import json
import pytest
from test_courses import setup_course
from test_app import token

URL = '/api/courses/example/participation'

def tracked(fixture):
    client, course, manifest = fixture
    manifest.update(lessons=['intro'], participation={'intro': {'demo': ['run']}})
    (course / 'course.json').write_text(json.dumps(manifest))
    return client, course, manifest

def event(event_id='00000000-0000-4000-8000-000000000001'):
    return dict(lesson_id='intro', simulation_id='demo', action='run', event_id=event_id)

def post(client, payload=None):
    return client.post(URL, json=event() if payload is None else payload, headers={'X-CSRF-Token':token(client, '/')})

@pytest.mark.parametrize('change', [{'points':99}, {'user_id':2}, {'action':'reset'}, {'lesson_id':'other'}, {'simulation_id':'other'}, {'event_id':'bad'}, {'event_id':None}])
def test_strict_payloads(setup_course, change):
    client, _, _ = tracked(setup_course)
    assert post(client, {**event(), **change}).status_code == 400
    assert client.get(URL).json['score'] == 0

def test_rate_limit_preserves_retry(setup_course):
    client, course, manifest = tracked(setup_course)
    manifest['participation']['intro'] = {'demo': ['run'] + [f'run-{i}' for i in range(49)], 'extra': ['run'] + [f'run-{i}' for i in range(11)]}
    (course / 'course.json').write_text(json.dumps(manifest))
    import uuid
    last = None
    for i in range(60):
        last = {**event(str(uuid.uuid4())), 'simulation_id': 'demo' if i < 49 else 'extra', 'action': f'run-{i if i < 49 else i-49}'}
        assert post(client, last).status_code == 200
    assert post(client, last).status_code == 200
    result = post(client)
    assert result.status_code == 429
    assert result.headers['Retry-After']


def test_event_id_conflict(setup_course):
    client, course, manifest = tracked(setup_course)
    manifest['participation']['intro']['demo'].append('send')
    (course / 'course.json').write_text(json.dumps(manifest))
    post(client)
    assert post(client, {**event(), 'action':'send'}).status_code == 409


@pytest.mark.parametrize('definition', [None, {}, {'unknown':{'demo':['run']}}, {'intro':[]}, {'intro':{'demo':[]}}, {'intro':{'demo':['run','run']}}, {'intro':{'../bad':['run']}}])
def test_invalid_manifest_fails_closed(setup_course, definition):
    client, course, manifest = tracked(setup_course)
    manifest['participation'] = definition
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get(URL).status_code == 404


@pytest.mark.parametrize('fresh_uuid', [False, True])
def test_security_isolation_restart_concurrency(setup_course, fresh_uuid):
    import sqlite3
    from concurrent.futures import ThreadPoolExecutor
    from app import create_app
    from test_app import register
    client, _, _ = tracked(setup_course)
    guest = client.application.test_client()
    assert guest.get(URL).status_code == 401
    assert guest.post(URL, json=event()).status_code == 403
    csrf = token(client, '/')
    for headers in [{}, {'X-CSRF-Token':csrf, 'Origin':'https://evil.test'}, {'X-CSRF-Token':csrf, 'Sec-Fetch-Site':'cross-site'}]:
        assert client.post(URL, json=event(), headers=headers).status_code == 403
    assert client.post(URL, data='x'*17000, content_type='application/json', headers={'X-CSRF-Token':csrf}).status_code == 413
    cookie = client.get_cookie('aw_session').value
    def send(_):
        c = client.application.test_client()
        c.set_cookie('aw_session', cookie)
        return c.post(URL, json=event(str(__import__('uuid').uuid4())) if fresh_uuid else event(), headers={'X-CSRF-Token':csrf}).status_code
    with ThreadPoolExecutor(max_workers=6) as pool:
        assert list(pool.map(send, range(12))) == [200]*12
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', cookie)
    assert restarted.get(URL).json['score'] == 1
    assert post(restarted, event(str(__import__('uuid').uuid4()))).json['awarded'] is False
    other = client.application.test_client()
    register(other, 'other@example.com')
    other.post('/login', data={'csrf_token':token(other, '/login'), 'email':'other@example.com', 'password':'correct horse battery'})
    assert other.get(URL).json['score'] == 0
    assert post(other).json['score'] == 1
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM participation_awards_v2').fetchone()[0] == 2
        assert db.execute('SELECT count(*) FROM lesson_progress').fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM activity_events WHERE kind='lesson_completed'").fetchone()[0] == 0


def test_generic_course_isolation_and_disabled_course(setup_course):
    import shutil
    client, course, manifest = tracked(setup_course)
    post(client)
    second = course.parent / 'future'
    shutil.copytree(course, second)
    manifest['id'] = 'future'
    (second / 'course.json').write_text(json.dumps(manifest))
    other = '/api/courses/future/participation'
    assert client.get(other).json['score'] == 0
    assert client.post(other, json=event(), headers={'X-CSRF-Token':token(client, '/')}).json['score'] == 1
    assert client.get(URL).json['score'] == 1
    manifest['enabled'] = False
    (second / 'course.json').write_text(json.dumps(manifest))
    assert client.get(other).status_code == 404
    manifest['enabled'] = True
    del manifest['participation']
    (second / 'course.json').write_text(json.dumps(manifest))
    assert client.get(other).status_code == 404


@pytest.mark.parametrize('payload', [[], {}, {'event_id':1}, {'lesson_id':{}}, 'bad'])
def test_non_event_json_rejected(setup_course, payload):
    client, _, _ = tracked(setup_course)
    assert post(client, payload).status_code == 400


def test_expired_session_cannot_submit(setup_course):
    import sqlite3
    client, _, _ = tracked(setup_course)
    csrf = token(client, '/')
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.execute('UPDATE sessions SET expires=0')
    assert client.get(URL).status_code == 401
    assert client.post(URL, json=event(), headers={'X-CSRF-Token':csrf}).status_code == 403


def test_scale_lab_quizzes_allowlisted_distinct_and_persistent(setup_course):
    from pathlib import Path
    import sqlite3
    import uuid
    client, course, manifest = setup_course
    scale = json.loads((Path(__file__).resolve().parents[2] / 'courses/scale-lab/course.json').read_text())
    manifest.update(lessons=scale['lessons'], participation=scale['participation'])
    (course / 'course.json').write_text(json.dumps(manifest))
    quiz = dict(lesson_id=scale['lessons'][0], simulation_id='check-your-thinking', action='quiz-answer-a', event_id=str(uuid.uuid4()))
    guest = client.application.test_client()
    assert guest.get(URL).status_code == 401
    assert guest.post(URL, json=quiz).status_code == 403
    csrf = token(client, '/')
    assert client.post(URL, json=quiz).status_code == 403
    assert client.post(URL, json=quiz, headers={'X-CSRF-Token':csrf, 'Origin':'https://evil.test'}).status_code == 403
    for index, lesson in enumerate(scale['lessons'], 1):
        payload = dict(lesson_id=lesson, simulation_id='check-your-thinking', action='quiz-answer-a', event_id=str(uuid.uuid4()))
        assert post(client, payload).json['score'] == index
        assert post(client, payload).json['score'] == index
        assert post(client, {**payload, 'simulation_id':lesson}).status_code == 400
        assert post(client, {**payload, 'action':'reset'}).status_code == 400
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT lesson_id,simulation_id,action,points FROM participation_awards_v2 ORDER BY created_at').fetchall() == [
            (lesson, 'check-your-thinking', 'quiz-answer-a', 1) for lesson in scale['lessons']]
        assert db.execute('SELECT count(*) FROM lesson_progress').fetchone()[0] == 0
        assert db.execute("SELECT count(*) FROM activity_events WHERE kind='lesson_completed'").fetchone()[0] == 0


def test_saved_score_deduplicates_retries(setup_course):
    client, _, _ = tracked(setup_course)
    assert client.get(URL).status_code == 200
    assert client.get(URL).json['score'] == 0
    assert post(client).json['awarded'] is True
    assert post(client).json['score'] == 1
    result = post(client, event('00000000-0000-4000-8000-000000000002'))
    assert result.json['score'] == 1
    assert result.json['awarded'] is False
    assert result.json['reason'] == 'already_counted'
    course = setup_course[1]
    manifest = setup_course[2]
    manifest['participation']['intro']['demo'].append('send')
    (course / 'course.json').write_text(json.dumps(manifest))
    assert post(client, {**event('00000000-0000-4000-8000-000000000002'), 'action':'send'}).status_code == 409
