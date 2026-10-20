import json
import sqlite3
from pathlib import Path
import pytest
from test_courses import setup_course
from test_progress import tracked
from test_app import token


def seed(client, course, manifest, n=13):
    for i in range(n):
        path = course.parent / f'course-{i}'
        (path / 'dist').mkdir(parents=True)
        (path / 'dist/index.html').write_text('QA')
        (path / 'course.json').write_text(json.dumps({**manifest, 'id': path.name, 'lessons':['intro']}))
        (path / 'assessment.json').write_text(json.dumps({'version':1, 'questions':[
            {'id':f'q-{j}', 'lesson_id':'intro', 'prompt':f'QA question {j}', 'options':[{'id':'a','text':'Yes'},{'id':'b','text':'No'}], 'answer':'a'} for j in range(4)]}))
        with sqlite3.connect(client.application.config['DATABASE']) as db:
            uid = db.execute('SELECT id FROM users').fetchone()[0]
            db.execute('INSERT INTO lesson_progress VALUES(?,?,?,0)', (uid,path.name,'intro'))


def post(client, url='/api/exam', payload=None):
    return client.post(url, json={} if payload is None else payload, headers={'X-CSRF-Token':token(client,'/')})


def test_level8_completion_automatically_assembles_exam(setup_course):
    client, course, manifest = tracked(setup_course)
    seed(client,course,manifest,13)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.execute("DELETE FROM lesson_progress WHERE course_id='course-12'")
    response=client.post('/api/courses/course-12/progress',json={'lesson_id':'intro'},headers={'X-CSRF-Token':token(client,'/')})
    assert response.status_code==200
    assert client.get('/api/exam').json['attempt'] is not None


def test_grade_retry_exact95_and_persistence(setup_course):
    client, course, manifest = tracked(setup_course)
    seed(client, course, manifest, 20)
    attempt = post(client).json
    answers = {q['id']:'b' for q in attempt['questions']}
    url = '/api/exam/' + attempt['id'] + '/submit'
    result = post(client, url, {'answers':answers})
    assert result.status_code == 200
    assert result.json['status'] == 'failed'
    assert post(client, url, {'answers':answers}).json == result.json
    retry = post(client).json
    assert retry['id'] != attempt['id']
    answers = {q['id']:'a' for q in retry['questions']}
    answers[retry['questions'][0]['id']] = 'b'
    result = post(client, '/api/exam/' + retry['id'] + '/submit', {'answers':answers})
    assert result.json['correct'] == 19
    assert result.json['passed'] is True
    assert client.get('/api/leaderboards').json['members'][0]['level'] == 9
    from app import create_app
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/api/exam').json['attempt']['passed'] is True
    assert restarted.get('/api/leaderboards').json['members'][0]['level'] == 9


def test_gate_assembly_and_reload(setup_course):
    client, course, manifest = tracked(setup_course)
    assert post(client).status_code == 403
    seed(client, course, manifest)
    response = post(client)
    assert response.status_code == 200
    data = response.json
    assert len({q['course_id'] for q in data['questions']}) == 13
    assert 'answer' not in json.dumps(data)
    assert post(client).json == data
    assert client.get('/api/exam').json['attempt'] == data
