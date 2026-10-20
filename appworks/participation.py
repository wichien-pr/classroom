"""Account-owned simulation participation, with optional qualification evidence; separate from activity."""
import time
import re
from flask import g, request
from course_registry import discover_courses


def install(app, connect):
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS participation_events (
            user_id INTEGER NOT NULL, course_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
            simulation_id TEXT NOT NULL, action TEXT NOT NULL, event_id TEXT NOT NULL,
            created_at REAL NOT NULL, points INTEGER NOT NULL CHECK(points=1),
            PRIMARY KEY(user_id, course_id, event_id))''')

        db.execute('''CREATE TABLE IF NOT EXISTS participation_awards_v2 (
            user_id INTEGER NOT NULL, course_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
            simulation_id TEXT NOT NULL, action TEXT NOT NULL, event_id TEXT NOT NULL,
            created_at REAL NOT NULL, points INTEGER NOT NULL CHECK(points=1),
            PRIMARY KEY(user_id, course_id, lesson_id, simulation_id, action),
            UNIQUE(user_id, course_id, event_id))''')
        db.execute('''CREATE TABLE IF NOT EXISTS participation_requests_v2 (
            user_id INTEGER NOT NULL, course_id TEXT NOT NULL, event_id TEXT NOT NULL,
            lesson_id TEXT NOT NULL, simulation_id TEXT NOT NULL, action TEXT NOT NULL,
            PRIMARY KEY(user_id, course_id, event_id))''')


    @app.route('/api/courses/<course_id>/participation', methods=['GET', 'POST'])
    def course_participation(course_id):
        if not g.user:
            return {'error': 'authentication_required'}, 401
        course = next((c for c in discover_courses(app.config['COURSES_ROOT'])
                       if c['id'] == course_id and 'participation' in c), None)
        if not course:
            return {'error': 'course_not_found'}, 404
        awarded = False
        reason = None
        with connect() as db:
            if request.method == 'POST':
                data = request.get_json(silent=True)
                if (not isinstance(data, dict) or set(data) != {'lesson_id','simulation_id','action','event_id'}
                    or any(not isinstance(v, str) or len(v) > 80 for v in data.values())
                    or not re.fullmatch(r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}', data['event_id'])
                    or data['action'] not in course['participation'].get(data['lesson_id'], {}).get(data['simulation_id'], [])):
                    return {'error':'invalid_event'}, 400
                db.execute('BEGIN IMMEDIATE')
                existing = db.execute('SELECT * FROM participation_requests_v2 WHERE user_id=? AND course_id=? AND event_id=?',
                                      (g.user['id'], course_id, data['event_id'])).fetchone()
                if existing and any(existing[k] != data[k] for k in ('lesson_id','simulation_id','action')):
                    return {'error':'event_id_conflict'}, 409
                key = (g.user['id'], course_id, data['lesson_id'], data['simulation_id'], data['action'])
                counted = db.execute('''SELECT 1 FROM participation_awards_v2
                    WHERE user_id=? AND course_id=? AND lesson_id=? AND simulation_id=? AND action=?''', key).fetchone()
                if not existing and not counted:
                    if db.execute('SELECT count(*) FROM participation_awards_v2 WHERE user_id=? AND created_at>?',
                                  (g.user['id'], time.time()-60)).fetchone()[0] >= 60:
                        return {'error':'rate_limited'}, 429, {'Retry-After':'60'}
                    db.execute('INSERT INTO participation_awards_v2 VALUES(?,?,?,?,?,?,?,1)',
                               (*key, data['event_id'], time.time()))
                    awarded = True
                db.execute('INSERT OR IGNORE INTO participation_requests_v2 VALUES(?,?,?,?,?,?)',
                           (g.user['id'], course_id, data['event_id'], data['lesson_id'], data['simulation_id'], data['action']))
                reason = 'awarded' if awarded else 'already_counted'
            score = db.execute('SELECT COALESCE(sum(points),0) FROM participation_awards_v2 WHERE user_id=? AND course_id=?',
                               (g.user['id'], course_id)).fetchone()[0]
        result = dict(course_id=course_id, score=score, csrf_token=g.session['csrf'])
        if request.method == 'POST':
            result.update(awarded=awarded, reason=reason)
            if course.get('completion_requirements'):
                app.extensions['prepare_final_exam']()
        return result
