"""Isolated backend regression: Storage evidence must never qualify new Tips."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award

def test_tips_has_fresh_identity_and_preserves_storage_history(setup_course):
    retired, action = 'estimate-storage', 'calculate'
    client, course, manifest = setup_course
    manifest.update(lessons=[retired], completion_requirements=['manual','simulation','thinking'], participation={retired:{retired:[action],'check-your-thinking':['quiz-answer-a','quiz-answer-b']}})
    (course/'course.json').write_text(json.dumps(manifest))
    endpoint='/api/courses/example/progress'
    assert client.post(endpoint,json={'lesson_id':retired,'manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,retired,action,retired).status_code==200
    assert award(client,'check-your-thinking','quiz-answer-b',retired).status_code==200
    assert client.get(endpoint).json['completed']==[retired]
    tables=['lesson_progress','lesson_manual_completion','participation_awards_v2','participation_requests_v2','exam_attempts']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snapshot=json.dumps({'courses':['example'],'questions':[{'id':'retired-question','lesson_id':retired,'answer':'a'}]})
        db.execute('INSERT INTO exam_attempts(id,user_id,snapshot,status,created) VALUES(?,?,?,?,?)',('frozen-storage',1,snapshot,'failed',1))
        db.commit()
        before={t:db.execute('SELECT * FROM '+t).fetchall() for t in tables}
    live=json.loads((Path(__file__).resolve().parents[2]/'courses/back-of-the-envelope-estimation/course.json').read_text())
    manifest.update(lessons=live['lessons'],participation=live['participation'])
    (course/'course.json').write_text(json.dumps(manifest))
    result=client.get(endpoint).json
    assert result['completed']==[]
    assert result['criteria']['estimate-tips']==dict(manual=False,simulation=False,thinking=False)
    assert award(client,retired,action,retired).status_code==400
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert before=={t:db.execute('SELECT * FROM '+t).fetchall() for t in tables}
    assert client.post(endpoint,json={'lesson_id':'estimate-tips','manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,'estimate-tips','calculate','estimate-tips').status_code==200
    assert client.get(endpoint).json['completed']==[]
    assert award(client,'check-your-thinking','quiz-answer-a','estimate-tips').status_code==200
    assert client.get(endpoint).json['completed']==['estimate-tips']
    assert client.get('/api/courses/example/participation').json['score']==4
    from app import create_app
    restarted=create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert restarted.get(endpoint).json['completed']==['estimate-tips']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for t,rows in before.items():
            assert all(row in db.execute('SELECT * FROM '+t).fetchall() for row in rows)
        assert db.execute("SELECT snapshot FROM exam_attempts WHERE id='frozen-storage'").fetchone()[0]==snapshot
