"""Whole-course levels and server-owned final assessments."""
from flask import g, request, render_template, redirect
from course_registry import discover_courses, contained_path
import json
import secrets
import time
import re


def load_bank(course):
    bank = json.loads(contained_path(course['course_path'], 'assessment.json').read_text())
    if not isinstance(bank, dict) or set(bank) != {'version','questions'} or type(bank.get('version')) is not int or bank['version'] != 1 or not isinstance(bank.get('questions'), list) or not bank['questions']:
        raise ValueError('invalid bank')
    ids = set()
    for q in bank['questions']:
        if not isinstance(q, dict) or set(q) != {'id','lesson_id','prompt','options','answer'}:
            raise ValueError('invalid question fields')
        if not isinstance(q['id'], str) or not re.fullmatch(r'[a-z0-9-]{1,80}', q['id']) or q['id'] in ids:
            raise ValueError('invalid question ID')
        ids.add(q['id'])
        if q['lesson_id'] not in course['lessons'] or not isinstance(q['prompt'], str) or not q['prompt'].strip():
            raise ValueError('invalid lesson or prompt')
        if not isinstance(q['options'], list) or not 2 <= len(q['options']) <= 6:
            raise ValueError('invalid choices')
        choices = set()
        for option in q['options']:
            if not isinstance(option, dict) or set(option) != {'id','text'} or not isinstance(option['id'], str) or not re.fullmatch(r'[a-z0-9-]{1,80}',option['id']) or option['id'] in choices or not isinstance(option['text'],str) or not option['text'].strip():
                raise ValueError('invalid choice')
            choices.add(option['id'])
        if not isinstance(q['answer'], str) or q['answer'] not in choices:
            raise ValueError('invalid correct choice')
    if {q['lesson_id'] for q in bank['questions']} != set(course['lessons']):
        raise ValueError('bank must cover every declared lesson')
    return bank['questions']


def public_attempt(row):
    snapshot = json.loads(row['snapshot'])
    return dict(id=row['id'], courses=snapshot['courses'], questions=[{k:v for k,v in q.items() if k != 'answer'} for q in snapshot['questions']], status=row['status'], correct=row['correct'], total=len(snapshot['questions']), passed=row['status']=='passed')

THRESHOLDS = (0, 1, 3, 5, 7, 9, 11, 13)


def level_for(count, passed=False):
    return 9 if passed else sum(count >= n for n in THRESHOLDS)


def level_progress(count, passed=False):
    level = level_for(count, passed)
    remaining = None
    if level == 9:
        done, total = 1, 1
        caption = 'ยินดีด้วย! สำเร็จระดับสูงสุดแล้ว'
    elif level == 8:
        done, total = 0, 1
        caption = 'ปลดล็อกข้อสอบแล้ว · ผ่านอย่างน้อย 95% เพื่อรับ Level 9'
    else:
        lower, upper = THRESHOLDS[level - 1], THRESHOLDS[level]
        done, total = count - lower, upper - lower
        remaining = upper - count
        caption = f'อีก {remaining} คอร์สเพื่อเลื่อนเป็น Level {level + 1}'
    return dict(level=level, done=done, total=total, remaining=remaining,
                percent=done * 100 / total, caption=caption)


def completed_courses(db, user_id, courses):
    from qualification import qualified_lessons
    return [c for c in courses if c.get('lessons') and len(qualified_lessons(db, user_id, c)) == len(c['lessons'])]


def install(app, connect):
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS lesson_manual_completion (
            user_id INTEGER NOT NULL, course_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
            created_at REAL NOT NULL, PRIMARY KEY(user_id, course_id, lesson_id))''')
        db.execute('''CREATE TABLE IF NOT EXISTS exam_attempts (
            id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, snapshot TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active', correct INTEGER, created REAL NOT NULL, submitted REAL)''')
        db.execute("CREATE UNIQUE INDEX IF NOT EXISTS one_active_exam ON exam_attempts(user_id) WHERE status='active'")
        db.execute('CREATE TABLE IF NOT EXISTS level_achievements (user_id INTEGER PRIMARY KEY, attempt_id TEXT NOT NULL, awarded REAL NOT NULL)')

    @app.route('/api/exam', methods=['GET', 'POST'])
    def exam_attempt(automatic=False):
        if not g.user:
            return {'error':'authentication_required'}, 401
        with connect() as db:
            if request.method == 'POST':
                if not automatic and request.get_json(silent=True) != {}:
                    return {'error':'expected_empty_object'}, 400
                db.execute('BEGIN IMMEDIATE')
            courses = completed_courses(db, g.user['id'], discover_courses(app.config['COURSES_ROOT']))
            row = db.execute('SELECT * FROM exam_attempts WHERE user_id=? ORDER BY created DESC LIMIT 1', (g.user['id'],)).fetchone()
            if request.method == 'GET':
                return {'eligible':len(courses)>=13, 'completed_courses':len(courses), 'attempt':public_attempt(row) if row else None, 'csrf_token':g.session['csrf']}
            if len(courses) < 13:
                return {'error':'level_8_required'}, 403
            if row and (automatic or row['status'] in ('active','passed')):
                return public_attempt(row)
            questions, unavailable = [], []
            rng = secrets.SystemRandom()
            for course in courses:
                try:
                    bank = load_bank(course)
                    # At least one randomly selected question from every lesson, every completed course.
                    for lesson in course['lessons']:
                        q = dict(rng.choice([q for q in bank if q['lesson_id']==lesson]))
                        q['id'] = course['id'] + ':' + q['id']
                        q['course_id'] = course['id']
                        q['options'] = list(q['options'])
                        rng.shuffle(q['options'])
                        questions.append(q)
                except (OSError, ValueError, TypeError, KeyError, RuntimeError):
                    unavailable.append(course['id'])
            if unavailable:
                return {'error':'banks_unavailable', 'courses':unavailable, 'message':'แจ้งผู้ดูแลให้เพิ่มหรือแก้ assessment.json ให้ครอบคลุมทุกบทเรียน'}, 409
            rng.shuffle(questions)
            identifier = secrets.token_urlsafe(24)
            snapshot = json.dumps({'courses':[c['id'] for c in courses], 'questions':questions}, ensure_ascii=False)
            db.execute('INSERT INTO exam_attempts(id,user_id,snapshot,created) VALUES(?,?,?,?)', (identifier,g.user['id'],snapshot,time.time()))
            return public_attempt(db.execute('SELECT * FROM exam_attempts WHERE id=?',(identifier,)).fetchone())

    # Called only after an authenticated CSRF-checked progress POST has committed.
    app.extensions['prepare_final_exam'] = lambda: exam_attempt(automatic=True)

    @app.post('/api/exam/<attempt_id>/submit')
    def submit_exam(attempt_id):
        if not g.user:
            return {'error':'authentication_required'}, 401
        data = request.get_json(silent=True)
        if not isinstance(data,dict) or set(data) != {'answers'} or not isinstance(data['answers'],dict):
            return {'error':'expected_answers_only'}, 400
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute('SELECT * FROM exam_attempts WHERE id=? AND user_id=?', (attempt_id,g.user['id'])).fetchone()
            if not row:
                return {'error':'attempt_not_found'}, 404
            questions = json.loads(row['snapshot'])['questions']
            answers = data['answers']
            if not questions or set(answers) != {q['id'] for q in questions} or any(not isinstance(answers[q['id']],str) or answers[q['id']] not in {o['id'] for o in q['options']} for q in questions):
                return {'error':'answer_every_question_with_valid_choice'}, 400
            if row['status'] != 'active':
                return public_attempt(row)
            # Eligibility is established by the immutable creation snapshot (>=13 completed courses).
            if len(json.loads(row['snapshot'])['courses']) < 13:
                return {'error':'level_8_required'}, 403
            correct = sum(answers[q['id']] == q['answer'] for q in questions)
            passed = correct * 100 >= len(questions) * 95
            db.execute('UPDATE exam_attempts SET status=?,correct=?,submitted=? WHERE id=?', ('passed' if passed else 'failed',correct,time.time(),attempt_id))
            if passed:
                db.execute('INSERT OR IGNORE INTO level_achievements VALUES(?,?,?)', (g.user['id'],attempt_id,time.time()))
            return public_attempt(db.execute('SELECT * FROM exam_attempts WHERE id=?',(attempt_id,)).fetchone())

    def members():
        courses = discover_courses(app.config['COURSES_ROOT'])
        with connect() as db:
            result = []
            for user in db.execute('SELECT id,name,photo_ref FROM users'):
                count = len(completed_courses(db, user['id'], courses))
                passed = db.execute('SELECT 1 FROM level_achievements WHERE user_id=?', (user['id'],)).fetchone() is not None
                result.append(dict(id=user['id'], name=user['name'], photo_ref=bool(user['photo_ref']), completed_courses=count, level=level_for(count, passed)))
        result.sort(key=lambda u: (-u['level'], -u['completed_courses'], u['id']))
        for rank, user in enumerate(result, 1):
            user['rank'] = rank
        return result

    @app.get('/leaderboards')
    def leaderboards():
        if not g.user:
            return redirect('/login', code=303)
        people = members()
        me = next(u for u in people if u['id']==g.user['id'])
        return render_template('leaderboards.html', members=people, me=me, thresholds=THRESHOLDS, user=g.user, csrf_token=g.session['csrf'])

    @app.get('/exam')
    def exam_page():
        if not g.user:
            return redirect('/login', code=303)
        return render_template('exam.html', user=g.user, csrf_token=g.session['csrf'])

    @app.get('/api/leaderboards')
    def leaderboard_data():
        if not g.user:
            return {'error': 'authentication_required'}, 401
        return {'members': members(), 'user_id': g.user['id'], 'csrf_token': g.session['csrf']}
