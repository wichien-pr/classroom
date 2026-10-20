"""Regression characterization: no backend migration is needed for LAB05."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award
from test_exam import seed, post

ROOT = Path(__file__).resolve().parents[2]


def test_lab05_swap_preserves_account_evidence_and_frozen_attempt(setup_course):
    client, course, base = setup_course
    current = json.loads((ROOT/'courses/scale-lab/course.json').read_text())
    manifest = {**base, 'lessons': ['session', 'replica'],
                'completion_requirements': current['completion_requirements'],
                'participation': {k: current['participation'][k] for k in ['session', 'replica']}}
    (course/'course.json').write_text(json.dumps(manifest))
    bank = json.loads((ROOT/'courses/scale-lab/assessment.json').read_text())
    bank['questions'] = [q for q in bank['questions'] if q['lesson_id'] in manifest['lessons']]
    # A historical authored bank, deliberately different to the new one.
    old = json.loads(json.dumps(bank))
    for q in old['questions']:
        q['prompt'] = 'Historical wording: ' + q['id']
    (course/'assessment.json').write_text(json.dumps(old))
    for lesson, action in [('session', 'login'), ('replica', 'write')]:
        assert client.post('/api/courses/example/progress', json={'lesson_id': lesson, 'manual': True},
                           headers={'X-CSRF-Token': token(client, '/')}).status_code == 200
        assert award(client, lesson, action, lesson).status_code == 200
        assert award(client, 'check-your-thinking', 'quiz-answer-a', lesson).status_code == 200
    seed(client, course, base, 12)
    attempt = post(client).json
    tables = ['users', 'lesson_progress', 'lesson_manual_completion', 'participation_awards_v2', 'participation_requests_v2', 'exam_attempts', 'level_achievements']
    def rows():
        with sqlite3.connect(client.application.config['DATABASE']) as db:
            return {table: db.execute(f'SELECT * FROM {table} ORDER BY rowid').fetchall() for table in tables}
    before = rows()
    manifest['lessons'] = ['replica', 'session']
    (course/'course.json').write_text(json.dumps(manifest))
    (course/'assessment.json').write_text(json.dumps(bank))
    assert client.get('/api/courses/example/progress').json['completed'] == ['replica', 'session']
    assert client.get('/api/courses/example/participation').json['score'] == 4
    assert client.get('/api/exam').json['attempt'] == attempt
    assert rows() == before
    assert award(client, 'replica', 'write', 'replica').json['awarded'] is False
    from app import create_app
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/api/exam').json['attempt'] == attempt
    assert restarted.get('/api/courses/example/participation').json['score'] == 4
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snap = json.loads(db.execute('SELECT snapshot FROM exam_attempts WHERE id=?', (attempt['id'],)).fetchone()[0])
    answers = {q['id']: q['answer'] for q in snap['questions']}
    assert post(restarted, '/api/exam/'+attempt['id']+'/submit', {'answers': answers}).json['passed'] is True
