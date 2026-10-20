import sqlite3
from app import create_app
from test_participation import tracked, post, URL
from test_courses import setup_course

def test_legacy_history_preserved_but_new_era_starts_zero(setup_course):
    client, _, _ = tracked(setup_course)
    from test_app import token
    assert client.post('/api/courses/example/progress', json={'lesson_id':'intro'}, headers={'X-CSRF-Token':token(client, '/')}).status_code == 200
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        user = db.execute('SELECT id FROM users LIMIT 1').fetchone()[0]
        db.execute('INSERT INTO participation_events VALUES(?,?,?,?,?,?,?,1)', (user,'example','intro','demo','run','legacy',1))
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get(URL).json['score'] == 0
    assert restarted.get('/api/courses/example/progress').json['completed'] == ['intro']
    assert post(restarted).json['score'] == 1
    again = create_app(dict(client.application.config)).test_client()
    again.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert again.get(URL).json['score'] == 1
    assert post(again).json['awarded'] is False
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT event_id FROM participation_events').fetchall() == [('legacy',)]
        import pytest
        with pytest.raises(sqlite3.IntegrityError):
            db.execute('INSERT INTO participation_awards_v2 SELECT user_id,course_id,lesson_id,simulation_id,action,?,created_at,points FROM participation_awards_v2', ('new-id',))
