import sqlite3
from datetime import datetime, timezone, date
import pytest


@pytest.mark.parametrize('iso', ['2024-02-29T17:00:00+00:00','2025-12-31T17:00:00+00:00','2026-10-15T08:00:00+00:00'])
def test_calendar_alignment_timezone_and_unknown_states(setup_course, iso):
    import activity
    assert hasattr(activity, 'calendar'), 'calendar model missing'
    client, _, _ = setup_course
    now = datetime.fromisoformat(iso).timestamp()
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.row_factory = sqlite3.Row
        db.execute('UPDATE activity_tracking SET started_at=?', (now-86400,))
        model = activity.calendar(db, 999, now)
    days = [day for week in model['weeks'] for day in week]
    assert len(days) == 371
    assert date.fromisoformat(days[0]['date']).weekday() == 0
    assert date.fromisoformat(days[-1]['date']).weekday() == 6
    today = activity.local_day(now).isoformat()
    assert model['today'] == today
    assert next(d for d in days if d['date'] == today)['state'] == 'inactive'
    assert days[0]['state'] == 'unknown'
    assert all(d['state']=='future' for d in days if d['date']>today)
    assert activity.local_day(datetime(2024,2,29,17,tzinfo=timezone.utc).timestamp()) == date(2024,3,1)
from test_courses import setup_course
from test_app import token
from test_progress import tracked, complete


def test_learning_hooks_count_only_successful_unique_actions(setup_course):
    client, course, manifest = tracked(setup_course)
    for path in ['/', '/account/profile', '/api/courses/example/progress', '/courses/example/missing.js']:
        client.get(path)
    client.head('/courses/example/')
    client.application.test_client().get('/courses/example/')
    assert counts(client) == {'login':1}
    assert client.get('/courses/example/').status_code == 200
    assert client.get('/courses/example/deep/route').status_code == 200
    assert counts(client) == {'login':1, 'course_open':1}
    assert complete(client).status_code == 200
    assert complete(client).status_code == 200
    assert complete(client, 'unknown').status_code == 404
    assert counts(client) == {'login':1, 'course_open':1, 'lesson_completed':1}


def test_profile_renders_member_calendar_with_accessible_details(setup_course):
    client, _, _ = setup_course
    page = client.get('/account/profile').text
    assert 'id="activity-calendar"' in page
    assert 'aria-pressed="true"' in page
    assert 'id="activity-detail"' in page
    assert 'Asia/Bangkok' in page
    assert 'นับอย่างไร' in page
    assert 'learner@example.com' not in page
    assert 'id="activity-calendar"' in client.get('/members/1').text
    assert 'id="activity-calendar"' not in client.get('/account/profile/edit').text
    assert client.application.test_client().get('/members/1').status_code == 303


def test_isolation_new_courses_restart_and_no_backfill(setup_course):
    import json
    import shutil
    from app import create_app
    from test_app import register
    import activity
    import time
    client, course, manifest = tracked(setup_course)
    new = course.parent/'future-course'
    shutil.copytree(course, new)
    (new/'course.json').write_text(json.dumps({**manifest, 'id':'future-course'}))
    client.get('/courses/example/')
    client.get('/courses/future-course/deep')
    complete(client)
    complete(client, 'practice', '/api/courses/future-course/progress')
    other = client.application.test_client()
    register(other, 'private-other@example.test')
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.row_factory = sqlite3.Row
        before = db.execute('SELECT started_at FROM activity_tracking').fetchone()[0]
        user_before = tuple(db.execute('SELECT joined_at FROM users WHERE id=1').fetchone())
        db.execute('INSERT INTO lesson_progress VALUES(2,?,?,?)', ('example','intro',1))
        assert activity.calendar(db, 2, time.time())['active30'] == 0
        mine = activity.calendar(db, 1, time.time())
        assert mine['active30'] == 1 and mine['learning30'] == 1
        today = next(d for w in mine['weeks'] for d in w if d['date']==mine['today'])
        assert today['total'] == 5 and today['level'] == 3
    restarted = create_app(dict(client.application.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert counts(restarted) == {'login':1, 'course_open':2, 'lesson_completed':2}
    page = restarted.get('/members/2').text
    assert 'private-other@example.test' not in page
    assert 'เรียนรู้ <strong>0</strong>' in page
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        assert db.execute('SELECT started_at FROM activity_tracking').fetchone()[0] == before
        assert tuple(db.execute('SELECT joined_at FROM users WHERE id=1').fetchone()) == user_before


def test_assets_errors_csrf_and_polling_never_add_activity(setup_course):
    client, course, manifest = tracked(setup_course)
    guest = client.application.test_client()
    for path in ['/courses/example/assets/main.js', '/courses/example/missing.js', '/courses/unknown/', '/api/courses/example/progress', '/account/photos/1', '/account/profile', '/members/1']:
        client.get(path)
        guest.get(path)
    client.get('/courses/example/', headers={'Sec-Fetch-Dest':'empty'})
    client.get('/courses/example/', headers={'Range':'bytes=0-1'})
    client.post('/api/courses/example/progress', json={'lesson_id':'intro'})
    client.post('/login', data={'csrf_token':token(client,'/login'), 'email':'learner@example.com','password':'incorrect'})
    assert counts(client) == {'login':1}


def test_midnight_dedup_and_completion_is_lifetime_not_daily(setup_course, monkeypatch):
    import activity
    import time
    client, _, _ = tracked(setup_course)
    complete(client)
    now = time.time()
    monkeypatch.setattr(activity.time, 'time', lambda: now+86400)
    # Extend the isolated session to exercise next-day authenticated operations.
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        db.execute('UPDATE sessions SET expires=?', (now+172800,))
    complete(client)
    client.post('/login', data={'csrf_token':token(client,'/login'), 'email':'learner@example.com','password':'correct horse battery'})
    client.get('/courses/example/')
    assert counts(client) == {'login':2, 'course_open':1, 'lesson_completed':1}


def test_concurrent_completion_is_atomic(setup_course):
    from concurrent.futures import ThreadPoolExecutor
    client, _, _ = tracked(setup_course)
    csrf = token(client, '/')
    cookie = client.get_cookie('aw_session').value
    def save(_):
        tab = client.application.test_client()
        tab.set_cookie('aw_session', cookie)
        return tab.post('/api/courses/example/progress',json={'lesson_id':'intro'},headers={'X-CSRF-Token':csrf}).status_code
    with ThreadPoolExecutor(max_workers=4) as pool:
        assert list(pool.map(save, range(4))) == [200]*4
    assert counts(client) == {'login':1, 'lesson_completed':1}


def counts(client):
    with sqlite3.connect(client.application.config['DATABASE']) as db:
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        assert 'activity_events' in tables, 'persisted activity migration missing'
        return dict(db.execute('SELECT kind,count(*) FROM activity_events GROUP BY kind'))


def test_successful_login_is_persisted_once_per_bangkok_day(setup_course):
    client, _, _ = setup_course
    assert counts(client) == {'login': 1}
    client.post('/login', data={'csrf_token':token(client, '/login'), 'email':'learner@example.com','password':'correct horse battery'})
    assert counts(client) == {'login': 1}
