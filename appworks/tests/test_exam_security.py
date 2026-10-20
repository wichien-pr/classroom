import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import pytest
from test_courses import setup_course
from test_progress import tracked
from test_exam import seed, post
from test_app import register, token


def eligible(setup_course, n=13):
    client, course, manifest = tracked(setup_course)
    seed(client,course,manifest,n)
    return client, course


def test_original_scale_bank_covers_curriculum():
    from achievements import load_bank
    from course_registry import discover_courses
    root=Path(__file__).resolve().parents[2]/'courses'
    course=next(c for c in discover_courses(root) if c['id']=='scale-lab')
    bank=load_bank(course)
    # Answer positions in the authored bank must not form an all-A shortcut.
    assert len({q['answer'] for q in bank}) >= 3
    assert len(bank)>=24
    assert {q['lesson_id'] for q in bank}==set(course['lessons'])


def test_missing_invalid_banks_fail_closed(setup_course):
    client, course = eligible(setup_course)
    bank=course.parent/'course-0/assessment.json'
    original=bank.read_text()
    for bad in ['', '{}', '[]', '{"version":1,"questions":[]}', original.replace('"version": 1','"version": true'), original.replace('"answer": "a"','"answer": "z"'), original.replace('"id": "b"','"id": "a"')]:
        bank.write_text(bad)
        response=post(client)
        assert response.status_code==409
        assert response.json['courses']==['course-0']
    bank.unlink()
    assert post(client).status_code==409
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM exam_attempts').fetchone()[0]==0


def test_submission_security_ownership_and_score_injection(setup_course):
    client, course=eligible(setup_course)
    a=post(client).json
    url='/api/exam/'+a['id']+'/submit'
    valid={q['id']:'a' for q in a['questions']}
    for data in [[],None,{}, {'score':100}, {'answers':valid,'score':100}, {'answers':{}}, {'answers':{**valid,'evil':'a'}}, {'answers':{**valid,a['questions'][0]['id']:True}}, {'answers':{**valid,a['questions'][0]['id']:'wrong'}}]:
        assert post(client,url,data).status_code==400
    assert client.post(url,json={'answers':valid}).status_code==403
    assert client.post(url,json={'answers':valid},headers={'X-CSRF-Token':token(client,'/'),'Origin':'https://evil.test'}).status_code==403
    guest=client.application.test_client()
    assert guest.get('/api/exam').status_code==401
    register(guest,'other@example.com')
    guest.post('/login',data={'csrf_token':token(guest,'/login'),'email':'other@example.com','password':'correct horse battery'})
    assert post(guest,url,{'answers':valid}).status_code==404
    assert guest.get('/api/exam').json['attempt'] is None
    for path in ['/courses/course-0/assessment.json','/assessment.json','/courses/course-0/../assessment.json']:
        assert client.get(path).status_code==404
    assert 'answer"' not in json.dumps(client.get('/api/exam').json)


def test_below95_and_immutable_bank(setup_course):
    client,course=eligible(setup_course,19)
    a=post(client).json
    answers={q['id']:'a' for q in a['questions']}
    answers[a['questions'][0]['id']]='b'
    for path in course.parent.glob('*/assessment.json'):
        path.write_text('{}')
    result=post(client,'/api/exam/'+a['id']+'/submit',{'answers':answers})
    assert result.json['correct']==18
    assert result.json['passed'] is False
    assert client.get('/api/leaderboards').json['members'][0]['level']==8


def test_concurrent_create_submit(setup_course):
    client,course=eligible(setup_course)
    cookie=client.get_cookie('aw_session').value
    def worker(create=True, a=None):
        c=client.application.test_client();c.set_cookie('aw_session',cookie)
        return post(c).json if create else post(c,'/api/exam/'+a['id']+'/submit',{'answers':{q['id']:'a' for q in a['questions']}}).json
    with ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(lambda _:worker(),range(4)))
        assert len({r['id'] for r in results})==1
        submitted=list(pool.map(lambda _:worker(False,results[0]),range(4)))
        assert all(r['passed'] for r in submitted)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM level_achievements').fetchone()[0]==1
