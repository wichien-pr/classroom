import json
from test_courses import setup_course
from test_app import token


def configured(fixture):
    client, course, manifest = fixture
    manifest.update(lessons=['intro'], completion_requirements=['manual', 'simulation', 'thinking'],
                    participation={'intro': {'demo': ['run'], 'check-your-thinking': ['quiz-answer-a', 'quiz-answer-b']}})
    (course / 'course.json').write_text(json.dumps(manifest))
    return client, course, manifest


def test_manual_only_does_not_qualify_or_raise_level(setup_course):
    client, _, _ = configured(setup_course)
    response = client.post('/api/courses/example/progress', json={'lesson_id':'intro'}, headers={'X-CSRF-Token':token(client, '/')})
    assert response.status_code == 200
    assert response.json['completed'] == []
    assert client.get('/api/leaderboards').json['members'][0]['level'] == 1


def award(client, simulation='demo', action='run', lesson='intro'):
    import uuid
    return client.post('/api/courses/example/participation', json=dict(lesson_id=lesson, simulation_id=simulation, action=action, event_id=str(uuid.uuid4())), headers={'X-CSRF-Token':token(client, '/')})


def test_legacy_or_quiz_progress_is_not_explicit_manual(setup_course):
    client, _, _ = configured(setup_course)
    client.post('/api/courses/example/progress', json={'lesson_id':'intro'}, headers={'X-CSRF-Token':token(client, '/')})
    assert award(client).status_code == 200
    assert award(client, 'check-your-thinking', 'quiz-answer-b').status_code == 200
    assert client.get('/api/courses/example/progress').json['completed'] == []
    result = client.post('/api/courses/example/progress', json={'lesson_id':'intro', 'manual':True}, headers={'X-CSRF-Token':token(client, '/')})
    assert result.status_code == 200
    assert result.json['completed'] == ['intro']
    assert result.json['criteria']['intro'] == dict(manual=True, simulation=True, thinking=True)
    assert client.get('/api/leaderboards').json['members'][0]['level'] == 2


import pytest
@pytest.mark.parametrize('requirements', [None, [], ['manual'], ['manual','simulation','thinking','extra']])
def test_invalid_requirements_fail_closed(setup_course, requirements):
    client, course, manifest = configured(setup_course)
    manifest['completion_requirements'] = requirements
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get('/api/courses/example/progress').status_code == 404


def test_requirements_need_both_action_kinds_every_lesson(setup_course):
    client, course, manifest = configured(setup_course)
    del manifest['participation']['intro']['demo']
    (course / 'course.json').write_text(json.dumps(manifest))
    assert client.get('/api/courses/example/progress').status_code == 404


@pytest.mark.parametrize('order', ['mst','mts','smt','stm','tms','tsm'])
def test_all_orders_persist_and_every_lesson_required(setup_course, order):
    import sqlite3
    from app import create_app
    client, course, manifest = configured(setup_course)
    manifest['lessons'].append('second')
    manifest['participation']['second'] = manifest['participation']['intro']
    (course / 'course.json').write_text(json.dumps(manifest))
    operations = dict(m=lambda: client.post('/api/courses/example/progress', json={'lesson_id':'intro','manual':True}, headers={'X-CSRF-Token':token(client, '/')}),
                      s=lambda: award(client), t=lambda: award(client,'check-your-thinking','quiz-answer-a'))
    for i, key in enumerate(order):
        assert operations[key]().status_code == 200
        assert client.get('/api/courses/example/progress').json['completed'] == (['intro'] if i == 2 else [])
    for operation in operations.values():
        operation()
    assert client.get('/api/leaderboards').json['members'][0]['level'] == 1
    assert client.post('/api/exam',json={},headers={'X-CSRF-Token':token(client,'/')}).status_code == 403
    restarted=create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/api/courses/example/progress').json['completed'] == ['intro']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM lesson_manual_completion').fetchone()[0] == 1
        assert db.execute('SELECT count(*) FROM participation_awards_v2').fetchone()[0] == 2


def test_participation_last_prepares_final_exam(setup_course):
    import shutil
    client, course, manifest = configured(setup_course)
    for i in range(13):
        target=course.parent / f'future-{i}'
        shutil.copytree(course,target)
        (target/'course.json').write_text(json.dumps({**manifest,'id':target.name}))
        (target/'assessment.json').write_text(json.dumps({'version':1,'questions':[{'id':'q','lesson_id':'intro','prompt':'Q','options':[{'id':'a','text':'A'},{'id':'b','text':'B'}],'answer':'b'}]}))
        csrf={'X-CSRF-Token':token(client,'/')}
        client.post(f'/api/courses/{target.name}/progress',json={'lesson_id':'intro','manual':True},headers=csrf)
        import uuid
        assert client.post('/api/exam',json={},headers=csrf).status_code == 403
        for simulation, action in [('demo','run'),('check-your-thinking','quiz-answer-a')]:
            assert client.post(f'/api/courses/{target.name}/participation',json=dict(lesson_id='intro',simulation_id=simulation,action=action,event_id=str(uuid.uuid4())),headers=csrf).status_code == 200
    data=client.get('/api/exam').json
    assert data['eligible'] is True
    assert data['attempt'] is not None
    assert len(data['attempt']['courses']) == 13


# Regression coverage for shared auth/isolation and preserved historical records.
def test_direct_api_cannot_supply_qualification_or_borrow_evidence(setup_course):
    import sqlite3, shutil
    from test_app import register
    client, course, manifest = configured(setup_course)
    endpoint='/api/courses/example/progress'
    headers={'X-CSRF-Token':token(client,'/')}
    for payload in [{'lesson_id':'intro','manual':1}, {'lesson_id':'intro','manual':True,'qualified':True}, {'lesson_id':'intro','simulation':True}]:
        assert client.post(endpoint,json=payload,headers=headers).status_code == 400
    assert client.post(endpoint,json={'lesson_id':'intro','manual':True},headers={}).status_code == 403
    assert client.post(endpoint,json={'lesson_id':'intro','manual':True},headers={**headers,'Origin':'https://evil.test'}).status_code == 403
    client.post(endpoint,json={'lesson_id':'intro','manual':True},headers=headers)
    assert client.get(endpoint).json['completed'] == []
    other=client.application.test_client()
    register(other,'isolation@example.com')
    other.post('/login',data={'csrf_token':token(other,'/login'),'email':'isolation@example.com','password':'correct horse battery'})
    award(other); award(other,'check-your-thinking','quiz-answer-b')
    assert client.get(endpoint).json['completed'] == []
    assert other.get(endpoint).json['criteria']['intro']['manual'] is False
    target=course.parent/'future'
    shutil.copytree(course,target)
    (target/'course.json').write_text(json.dumps({**manifest,'id':'future'}))
    assert client.get('/api/courses/future/progress').json['criteria']['intro'] == dict(manual=False,simulation=False,thinking=False)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for simulation,action in [('demo','run'),('check-your-thinking','quiz-answer-a')]:
            db.execute('INSERT INTO participation_events VALUES(?,?,?,?,?,?,?,1)',(1,'example','intro',simulation,action,simulation,1))
        db.execute('INSERT INTO level_achievements VALUES(?,?,?)',(1,'historical-achievement',1))
    assert client.get(endpoint).json['completed'] == [] # legacy events never substitute for v2 awards
    assert next(m for m in client.get('/api/leaderboards').json['members'] if m['id']==1)['level'] == 9
    award(client); award(client,'check-your-thinking','quiz-answer-b')
    assert client.get(endpoint).json['completed'] == ['intro']
    manifest['participation']['intro']['demo']=['different-action']
    (course/'course.json').write_text(json.dumps(manifest))
    assert client.get(endpoint).json['completed'] == [] # current allowlist, not stale totals
