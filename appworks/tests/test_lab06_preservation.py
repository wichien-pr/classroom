"""Characterization of existing generic history semantics: no production DB migration."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award
from test_exam import seed, post

ROOT = Path(__file__).resolve().parents[2]

def test_removed_session_never_qualifies_cache_and_snapshot_survives(setup_course):
    client, course, base = setup_course
    current = json.loads((ROOT/'courses/scale-lab/course.json').read_text())
    historical = {'session': ['login', 'session'], 'check-your-thinking': ['quiz-answer-a', 'quiz-answer-b']}
    manifest = {**base, 'lessons': ['session'], 'completion_requirements': current['completion_requirements'], 'participation': {'session': historical}}
    (course/'course.json').write_text(json.dumps(manifest))
    (course/'assessment.json').write_text(json.dumps({'version': 1, 'questions': [{'id': 'session-history', 'lesson_id': 'session', 'prompt': 'Historical Session', 'options': [{'id': 'a', 'text': 'Local'}, {'id': 'b', 'text': 'Shared'}], 'answer': 'b'}]}))
    assert client.post('/api/courses/example/progress', json={'lesson_id': 'session', 'manual': True}, headers={'X-CSRF-Token': token(client, '/')}).status_code == 200
    assert award(client, 'session', 'login', 'session').json['awarded']
    assert award(client, 'check-your-thinking', 'quiz-answer-a', 'session').json['awarded']
    seed(client, course, base, 12)
    attempt = post(client).json
    tables = ['users', 'lesson_progress', 'lesson_manual_completion', 'participation_awards_v2', 'participation_requests_v2', 'exam_attempts', 'level_achievements']
    def rows():
        with sqlite3.connect(client.application.config['DATABASE']) as db:
            return {t: db.execute(f'SELECT * FROM {t} ORDER BY rowid').fetchall() for t in tables}
    before = rows()
    manifest.update(lessons=['cache'], participation={'cache': current['participation']['cache']})
    (course/'course.json').write_text(json.dumps(manifest))
    bank = json.loads((ROOT/'courses/scale-lab/assessment.json').read_text())
    bank['questions'] = [q for q in bank['questions'] if q['lesson_id'] == 'cache']
    (course/'assessment.json').write_text(json.dumps(bank))
    progress = client.get('/api/courses/example/progress').json
    assert progress['completed'] == [] and progress['total'] == 1
    assert progress['criteria'] == {'cache': {'manual': False, 'simulation': False, 'thinking': False}}
    assert client.get('/api/courses/example/participation').json['score'] == 2  # History, not active maximum.
    assert client.get('/api/exam').json['attempt'] == attempt
    assert rows() == before
    assert award(client, 'session', 'login', 'session').status_code == 400
    assert award(client, 'cache', 'read-cache', 'cache').json['awarded']
    assert not award(client, 'cache', 'read-cache', 'cache').json['awarded']
    assert award(client, 'check-your-thinking', 'quiz-answer-a', 'cache').json['awarded']
    assert client.get('/api/courses/example/progress').json['completed'] == []
    assert client.post('/api/courses/example/progress', json={'lesson_id': 'cache', 'manual': True}, headers={'X-CSRF-Token': token(client, '/')}).json['completed'] == ['cache']
    from app import create_app
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/api/courses/example/progress').json['completed'] == ['cache']
    assert restarted.get('/api/courses/example/participation').json['score'] == 4
    assert restarted.get('/api/exam').json['attempt'] == attempt
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snapshot = json.loads(db.execute('SELECT snapshot FROM exam_attempts WHERE id=?', (attempt['id'],)).fetchone()[0])
    assert any('session-history' in q['id'] for q in snapshot['questions'])
    assert post(restarted, '/api/exam/'+attempt['id']+'/submit', {'answers': {q['id']: q['answer'] for q in snapshot['questions']}}).json['passed']
