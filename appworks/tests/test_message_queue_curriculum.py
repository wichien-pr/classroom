"""Characterization: replacing Multi-region retains history without granting Message queue."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award


def test_region_history_cannot_qualify_message_queue(setup_course):
    client, course, manifest = setup_course
    manifest.update(lessons=['region'], completion_requirements=['manual','simulation','thinking'], participation={'region': {'region':['decision'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']}})
    (course/'course.json').write_text(json.dumps(manifest))
    endpoint='/api/courses/example/progress'
    assert client.post(endpoint,json={'lesson_id':'region','manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,'region','decision','region').status_code==200
    assert award(client,'check-your-thinking','quiz-answer-b','region').status_code==200
    assert client.get(endpoint).json['completed']==['region']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snapshot=json.dumps({'courses':['example'],'questions':[{'id':'region-19','lesson_id':'region','answer':'a'}]})
        db.execute('INSERT INTO exam_attempts(id,user_id,snapshot,status,created) VALUES(?,?,?,?,?)',('frozen-region',1,snapshot,'failed',1))
        db.commit()
        saved={table:db.execute('SELECT * FROM '+table).fetchall() for table in ['lesson_progress','lesson_manual_completion','participation_awards_v2','participation_requests_v2','exam_attempts']}
    live=json.loads((Path(__file__).resolve().parents[2]/'courses/scale-lab/course.json').read_text())
    manifest.update(lessons=live['lessons'],participation=live['participation'])
    (course/'course.json').write_text(json.dumps(manifest))
    result=client.get(endpoint).json
    assert result['completed']==[]
    assert result['criteria']['message-queue']==dict(manual=False,simulation=False,thinking=False)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert saved=={table:db.execute('SELECT * FROM '+table).fetchall() for table in saved}
    assert award(client,'region','decision','region').status_code==400
    assert client.post(endpoint,json={'lesson_id':'message-queue','manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,'message-queue','enqueue-jobs','message-queue').status_code==200
    assert client.get(endpoint).json['completed']==[]
    assert award(client,'check-your-thinking','quiz-answer-a','message-queue').status_code==200
    assert client.get(endpoint).json['completed']==['message-queue']
    assert client.get('/api/courses/example/participation').json['score']==4
    from app import create_app
    restarted=create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert restarted.get(endpoint).json['completed']==['message-queue']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for table, rows in saved.items():
            assert all(row in db.execute('SELECT * FROM '+table).fetchall() for row in rows), table
        assert db.execute("SELECT snapshot FROM exam_attempts WHERE id='frozen-region'").fetchone()[0]==snapshot
