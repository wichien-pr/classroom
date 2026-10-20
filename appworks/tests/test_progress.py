import json
import sqlite3
import pytest
from test_courses import setup_course
from test_app import register, token

URL = '/api/courses/example/progress'

def tracked(setup_course):
    client, course, manifest = setup_course
    manifest['lessons'] = ['intro', 'practice']
    (course / 'course.json').write_text(json.dumps(manifest))
    return client, course, manifest

def complete(client, lesson='intro', url=URL):
    return client.post(url, json={'lesson_id': lesson}, headers={'X-CSRF-Token': token(client, '/')})

def test_completion_persists_after_recreation(setup_course):
    client, _, _ = tracked(setup_course)
    response = complete(client)
    assert response.status_code == 200
    assert response.json['completed'] == ['intro']
    from app import create_app
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    data = restarted.get(URL).json
    assert data is not None
    assert data['completed'] == ['intro']
    assert data['total'] == 2
    assert data['completed_count'] == 1
    assert data['csrf_token']

@pytest.mark.parametrize('lessons', [None, [], 'intro', ['intro', 'intro'], [1], ['../x'], [''], ['x'*81]])
def test_invalid_lesson_manifests_fail_closed(setup_course, lessons):
    client, course, manifest = tracked(setup_course)
    manifest['lessons'] = lessons
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get(URL).status_code == 404
    from course_registry import discover_courses
    with pytest.raises(ValueError, match='lessons'):
        discover_courses(course.parent, strict=True)

def test_catalog_uses_current_curriculum_and_idempotent_records(setup_course):
    client, course, manifest = tracked(setup_course)
    complete(client)
    complete(client)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM lesson_progress').fetchone()[0] == 1
    assert '1 / 2 บทเรียน' in client.get('/').text
    manifest['lessons'] = ['practice', 'new-lesson', 'another']
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get(URL).json['completed'] == []
    assert '0 / 3 บทเรียน' in client.get('/').text
    manifest['lessons'].append('intro')
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get(URL).json['completed'] == ['intro']

def test_accounts_and_new_courses_are_isolated(setup_course):
    import shutil
    client, course, manifest = tracked(setup_course)
    second = course.parent / 'new-course'
    shutil.copytree(course, second)
    manifest['id'] = 'new-course'
    (second / 'course.json').write_text(json.dumps(manifest))
    other_url = '/api/courses/new-course/progress'
    complete(client)
    assert client.get(other_url).json['completed'] == []
    assert complete(client, 'practice', other_url).status_code == 200
    other = client.application.test_client()
    register(other, 'other@example.com')
    other.post('/login', data={'csrf_token': token(other, '/login'), 'email': 'other@example.com', 'password': 'correct horse battery'})
    assert other.get(URL).json['completed'] == []
    assert other.get(other_url).json['completed'] == []
    assert complete(other, 'practice').status_code == 200
    assert client.get(URL).json['completed'] == ['intro']

@pytest.mark.parametrize('payload', [None, [], {}, {'lesson_id': 1}, {'lesson_id': ['intro']}, {'lesson_id': 'intro', 'user_id': 2}, {'completed': ['intro']}])
def test_invalid_payloads_do_not_write(setup_course, payload):
    client, _, _ = tracked(setup_course)
    response = client.post(URL, data=json.dumps(payload), content_type='application/json', headers={'X-CSRF-Token': token(client, '/')})
    assert response.status_code == 400
    assert client.get(URL).json['completed'] == []

def test_api_security_and_unavailable_courses(setup_course):
    client, course, manifest = tracked(setup_course)
    guest = client.application.test_client()
    assert guest.get(URL).status_code == 401
    assert guest.post(URL, json={'lesson_id':'intro'}).status_code == 403
    anonymous_csrf = token(guest)
    assert guest.post(URL, json={'lesson_id':'intro'}, headers={'X-CSRF-Token':anonymous_csrf}).status_code == 401
    csrf = token(client, '/')
    for headers in [{}, {'X-CSRF-Token':anonymous_csrf}, {'X-CSRF-Token':'ผิด'}, {'X-CSRF-Token':csrf,'Origin':'https://evil.test'}, {'X-CSRF-Token':csrf,'Sec-Fetch-Site':'cross-site'}]:
        assert client.post(URL, json={'lesson_id':'intro'}, headers=headers).status_code == 403
    assert complete(client, 'unknown').status_code == 404
    assert complete(client, url='/api/courses/unknown/progress').status_code == 404
    assert client.get(URL).json['completed'] == []
    for change in [{'enabled':False}, {'enabled':True, 'lessons':None}]:
        manifest.update(change)
        if manifest.get('lessons') is None:
            manifest.pop('lessons', None)
        (course / 'course.json').write_text(json.dumps(manifest))
        assert client.get(URL).status_code == 404
        assert complete(client).status_code == 404

def test_expired_session_cannot_read_or_write_progress(setup_course):
    client, _, _ = tracked(setup_course)
    csrf = token(client, '/')
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.execute('UPDATE sessions SET expires=0')
    assert client.get(URL).status_code == 401
    assert client.post(URL, json={'lesson_id':'intro'}, headers={'X-CSRF-Token':csrf}).status_code == 403

def test_platform_build_supplies_generic_opt_in_endpoint(monkeypatch, tmp_path):
    import importlib.util
    import sys
    from pathlib import Path
    spec = importlib.util.spec_from_file_location('course_build', Path(__file__).resolve().parents[2] / 'scripts/courses.py')
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    courses = [dict(id='future-course', course_path=tmp_path, lessons=['intro']), dict(id='legacy', course_path=tmp_path)]
    monkeypatch.setattr(module, 'discover_courses', lambda *args, **kwargs: courses)
    calls = []
    monkeypatch.setattr(module.subprocess, 'run', lambda *args, **kwargs: calls.append(kwargs))
    monkeypatch.setattr(sys, 'argv', ['courses.py', 'build'])
    monkeypatch.setenv('VITE_CLASSROOM_PROGRESS_URL', '/stale-endpoint')
    assert module.main() == 0
    assert calls[0]['env']['VITE_CLASSROOM_PROGRESS_URL'] == '/api/courses/future-course/progress'
    assert calls[1]['env']['VITE_CLASSROOM_PROGRESS_URL'] == ''

def test_simultaneous_completions_are_additive(setup_course):
    from concurrent.futures import ThreadPoolExecutor
    client, _, _ = tracked(setup_course)
    csrf = token(client, '/')
    cookie = client.get_cookie('aw_session').value
    def save(lesson):
        tab = client.application.test_client()
        tab.set_cookie('aw_session', cookie)
        return tab.post(URL, json={'lesson_id':lesson}, headers={'X-CSRF-Token':csrf}).status_code
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert list(pool.map(save, ['intro','practice','intro','practice'])) == [200]*4
    assert client.get(URL).json['completed'] == ['intro','practice']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM lesson_progress').fetchone()[0] == 2
