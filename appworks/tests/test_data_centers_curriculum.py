"""Characterization: replacing Observability retains history without granting Data centers."""
import json
import sqlite3
from pathlib import Path
from test_courses import setup_course
from test_app import token
from test_qualification import award


def test_observability_history_cannot_qualify_data_centers(setup_course):
    client, course, manifest = setup_course
    manifest.update(lessons=['observe'], completion_requirements=['manual','simulation','thinking'], participation={'observe': {'observe':['decision'],'check-your-thinking':['quiz-answer-a','quiz-answer-b']}})
    (course/'course.json').write_text(json.dumps(manifest))
    endpoint='/api/courses/example/progress'
    assert client.post(endpoint,json={'lesson_id':'observe','manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,'observe','decision','observe').status_code==200
    assert award(client,'check-your-thinking','quiz-answer-b','observe').status_code==200
    assert client.get(endpoint).json['completed']==['observe']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        snapshot=json.dumps({'courses':['example'],'questions':[{'id':'observe-19','lesson_id':'observe','answer':'a'}]})
        db.execute('INSERT INTO exam_attempts(id,user_id,snapshot,status,created) VALUES(?,?,?,?,?)',('frozen-observe',1,snapshot,'failed',1))
        db.commit()
        saved={table:db.execute('SELECT * FROM '+table).fetchall() for table in ['lesson_progress','lesson_manual_completion','participation_awards_v2','participation_requests_v2','exam_attempts']}
    live=json.loads((Path(__file__).resolve().parents[2]/'courses/scale-lab/course.json').read_text())
    manifest.update(lessons=live['lessons'],participation=live['participation'])
    (course/'course.json').write_text(json.dumps(manifest))
    result=client.get(endpoint).json
    assert result['completed']==[]
    assert result['criteria']['data-centers']==dict(manual=False,simulation=False,thinking=False)
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert saved=={table:db.execute('SELECT * FROM '+table).fetchall() for table in saved}
    assert award(client,'observe','decision','observe').status_code==400
    assert client.post(endpoint,json={'lesson_id':'data-centers','manual':True},headers={'X-CSRF-Token':token(client,'/')}).status_code==200
    assert award(client,'data-centers','dc-request','data-centers').status_code==200
    assert client.get(endpoint).json['completed']==[]
    assert award(client,'check-your-thinking','quiz-answer-a','data-centers').status_code==200
    assert client.get(endpoint).json['completed']==['data-centers']
    assert client.get('/api/courses/example/participation').json['score']==4
    from app import create_app
    restarted=create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert restarted.get(endpoint).json['completed']==['data-centers']
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        for table, rows in saved.items():
            assert all(row in db.execute('SELECT * FROM '+table).fetchall() for row in rows), table
        assert db.execute("SELECT snapshot FROM exam_attempts WHERE id='frozen-observe'").fetchone()[0]==snapshot
