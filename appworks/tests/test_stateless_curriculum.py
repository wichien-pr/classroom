"""Regression: generic current-allowlist qualification preserves retired history."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award


def test_retired_history_never_grants_new_stateless_lesson(setup_course):
    client, course, manifest = setup_course
    manifest.update(lessons=['queue','session'],completion_requirements=['manual','simulation','thinking'],participation={key:{key:['work'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']} for key in ['queue','session']})
    (course/'course.json').write_text(json.dumps(manifest))
    for key in manifest['lessons']:
        client.post('/api/courses/example/progress',json={'lesson_id':key,'manual':True},headers={'X-CSRF-Token':token(client,'/')})
        award(client,key,'work',key)
        award(client,'check-your-thinking','quiz-answer-b',key)
    assert client.get('/api/courses/example/progress').json['completed']==['queue','session']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snapshot=json.dumps({'courses':['example'],'questions':[{'id':'queue-old','lesson_id':'queue','answer':'old-key'}]})
        db.execute("INSERT INTO exam_attempts(id,user_id,snapshot,status,created) VALUES(?,?,?,?,?)",('frozen-queue',1,snapshot,'failed',1))
        db.commit()
        saved={table:db.execute('SELECT * FROM '+table).fetchall() for table in ['lesson_progress','lesson_manual_completion','participation_awards_v2','participation_requests_v2','exam_attempts']}
    live=json.loads((Path(__file__).resolve().parents[2]/'courses/scale-lab/course.json').read_text())
    manifest.update(lessons=live['lessons'],participation=live['participation'])
    (course/'course.json').write_text(json.dumps(manifest))
    endpoint='/api/courses/example/progress'
    result=client.get(endpoint).json
    assert result['completed']==[]
    assert result['criteria']['stateless-web']==dict(manual=False,simulation=False,thinking=False)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert saved=={table:db.execute('SELECT * FROM '+table).fetchall() for table in saved}
    client.post(endpoint,json={'lesson_id':'stateless-web','manual':True},headers={'X-CSRF-Token':token(client,'/')})
    assert client.get(endpoint).json['completed']==[]
    assert award(client,'stateless-web','web-request','stateless-web').status_code==200
    assert client.get(endpoint).json['completed']==[]
    assert award(client,'check-your-thinking','quiz-answer-a','stateless-web').status_code==200
    assert client.get(endpoint).json['completed']==['stateless-web']
    assert client.get('/api/courses/example/participation').json['score']==6
    from app import create_app
    restarted=create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert restarted.get(endpoint).json['completed']==['stateless-web']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for table, rows in saved.items():
            current=db.execute('SELECT * FROM '+table).fetchall()
            assert all(row in current for row in rows), table
        assert db.execute("SELECT snapshot FROM exam_attempts WHERE id='frozen-queue'").fetchone()[0]==snapshot
