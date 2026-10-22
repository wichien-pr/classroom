"""Presence fixtures are private SQLite users/sessions, never production accounts."""
import hashlib
import sqlite3
import time
import pytest
from app import create_app


@pytest.fixture
def presence(tmp_path):
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path/'qa.sqlite3')})
    def member(uid=1, session='one'):
        with sqlite3.connect(app.config['DATABASE']) as db:
            db.execute('INSERT OR IGNORE INTO users(id,name,email,password_hash) VALUES(?,?,?,?)',
                       (uid, f'สมาชิก {uid}', f'private{uid}@example.test', 'not-a-password'))
            db.execute('INSERT OR REPLACE INTO sessions VALUES(?,?,?,?)',
                       (hashlib.sha256(session.encode()).hexdigest(), uid, 'csrf-'+session, time.time()+3600))
        client = app.test_client()
        client.set_cookie('aw_session', session)
        return client, {'X-CSRF-Token': 'csrf-'+session, 'Origin': 'http://localhost'}
    return app, member


def test_visible_heartbeat_creates_private_unique_member_snapshot(presence):
    app, member = presence
    a, headers = member()
    assert a.get('/api/presence').status_code == 200
    assert a.get('/api/presence').json['total'] == 0
    result = a.post('/api/presence', json={}, headers=headers)
    assert result.status_code == 200
    assert result.json['total'] == 1
    assert result.json['members'] == [{'id': 1, 'name': 'สมาชิก 1', 'username': 'member-1', 'photo_url': None, 'profile_url': '/members/1'}]
    assert 'private1@' not in result.text
    assert 'no-store' in result.headers['Cache-Control']


def test_heartbeat_is_throttled_and_validated(presence, monkeypatch):
    app, member = presence
    a, headers = member()
    now = time.time()
    monkeypatch.setattr('presence.time.time', lambda: now)
    assert a.post('/api/presence', json={}, headers=headers).status_code == 200
    monkeypatch.setattr('presence.time.time', lambda: now+10)
    assert a.post('/api/presence', json={}, headers=headers).status_code == 200
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT seen_at FROM member_presence').fetchone()[0] == now
    assert a.post('/api/presence', json={'user_id': 2}, headers=headers).status_code == 400
    assert a.post('/api/presence', json={}, headers={**headers, 'Origin': 'https://evil.test'}).status_code == 403
    assert a.post('/api/presence', json={}).status_code == 403
    assert app.test_client().get('/api/presence').status_code == 401
    monkeypatch.setattr('presence.time.time', lambda: now+26)
    assert a.post('/api/presence', json={}, headers=headers).status_code == 200
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT seen_at FROM member_presence').fetchone()[0] == now+26


def test_pagination_count_and_order_share_snapshot(presence):
    app, member = presence
    for uid in range(1, 24):
        client, headers = member(uid, str(uid))
        assert client.post('/api/presence', json={}, headers=headers).status_code == 200
    first = client.get('/api/presence').json
    assert first['total'] == 23 and len(first['members']) == 20
    assert first['page'] == 1 and first['pages'] == 2
    second = client.get('/api/presence?page=2').json
    assert second['total'] == 23 and [m['id'] for m in second['members']] == [21,22,23]
    assert client.get('/api/presence?page=999').json['page'] == 2
    assert client.get('/api/presence?page=no').status_code == 400


def test_sessions_timeout_logout_and_no_learning_pollution(presence, monkeypatch):
    app, member = presence
    a, ah = member(1, 'one'); b, bh = member(1, 'two'); c, ch = member(2, 'three')
    now = time.time()
    monkeypatch.setattr('presence.time.time', lambda: now)
    for client, headers in [(a,ah),(b,bh),(c,ch)]:
        assert client.post('/api/presence', json={}, headers=headers).status_code == 200
    assert a.get('/api/presence').json['total'] == 2
    assert a.post('/logout', data={'csrf_token':ah['X-CSRF-Token']}).status_code == 303
    assert b.get('/api/presence').json['total'] == 2
    assert b.post('/logout', data={'csrf_token':bh['X-CSRF-Token']}).status_code == 303
    assert c.get('/api/presence').json['total'] == 1
    monkeypatch.setattr('presence.time.time', lambda: now+120)
    assert c.get('/api/presence').json['total'] == 0
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM activity_events').fetchone()[0] == 0
        assert db.execute('SELECT count(*) FROM users WHERE last_active_at IS NOT NULL').fetchone()[0] == 0
        db.execute('UPDATE sessions SET expires=?', (now+119,))
    assert c.get('/api/presence').status_code == 401


def test_shared_header_and_course_heartbeat_without_dist_changes(presence, tmp_path):
    app, member = presence
    a, _ = member()
    for route in ['/', '/account/profile', '/account/profile/edit', '/leaderboards', '/community']:
        page = a.get(route)
        assert page.status_code == 200
        assert 'id="presence-toggle"' in page.text
        assert '/platform/presence.js' in page.text
    assert 'presence-toggle' not in app.test_client().get('/login').text
    assert a.get('/platform/presence.js').status_code == 200
    assert app.test_client().get('/platform/presence.js').status_code == 401
    import json
    root = tmp_path/'courses'; course = root/'fixture'; dist = course/'dist'
    dist.mkdir(parents=True)
    original = '<!doctype html><html><body>Course</body></html>'
    (dist/'index.html').write_text(original)
    (course/'course.json').write_text(json.dumps(dict(id='fixture', title='Fixture', subtitle='QA', enabled=True, order=1, delivery='static', build_dir='dist', entry='index.html')))
    app.config['COURSES_ROOT'] = str(root)
    page = a.get('/courses/fixture/')
    assert page.status_code == 200 and '/platform/presence.js' in page.text
    assert 'presence-toggle' not in page.text
    assert (dist/'index.html').read_text() == original
    assert int(page.headers['Content-Length']) == len(page.data)


@pytest.mark.parametrize('method', ['get', 'post'])
def test_revoked_inflight_session_cannot_read_members(presence, method):
    app, member = presence
    client, headers = member()
    @app.before_request
    def revoke_after_authentication():
        with sqlite3.connect(app.config['DATABASE']) as db:
            db.execute('DELETE FROM sessions')
    result = getattr(client, method)('/api/presence', json={}, headers=headers)
    assert result.status_code == 401


def test_concurrent_heartbeats_deduplicate_sessions_and_restart(presence):
    from concurrent.futures import ThreadPoolExecutor
    app, member = presence
    a, ah = member(1, 'one'); b, bh = member(1, 'two')
    def beat(index):
        client = app.test_client()
        key, headers = ('one', ah) if index % 2 else ('two', bh)
        client.set_cookie('aw_session', key)
        return client.post('/api/presence', json={}, headers=headers)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(beat, range(24)))
    assert all(result.status_code == 200 and result.json['total'] == 1 for result in results)
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM member_presence').fetchone()[0] == 2
    restarted = create_app(dict(app.config)).test_client()
    restarted.set_cookie('aw_session', 'one')
    assert restarted.get('/api/presence').json['total'] == 1


def test_invalid_other_sessions_never_contribute(presence):
    app, member = presence
    observer, headers = member(1, 'observer')
    other, oh = member(2, 'other')
    observer.post('/api/presence', json={}, headers=headers)
    other.post('/api/presence', json={}, headers=oh)
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE sessions SET expires=0 WHERE user_id=2')
    assert observer.get('/api/presence').json['total'] == 1
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('DELETE FROM sessions WHERE user_id=2')
    assert observer.get('/api/presence').json['total'] == 1


def test_disabled_template_gate_keeps_old_process_header_inert(presence):
    app, member = presence
    client, _ = member()
    app.config.pop('PRESENCE_ENABLED')
    assert 'presence-toggle' not in client.get('/').text
    assert '/platform/presence.js' not in client.get('/leaderboards').text
