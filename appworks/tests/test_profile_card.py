import sqlite3
import time
import pytest
from app import create_app
from test_app import register, token
from test_profiles import account


def row(app, uid=1):
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.row_factory = sqlite3.Row
        return dict(db.execute('SELECT * FROM users WHERE id=?', (uid,)).fetchone())


def edit(client, **fields):
    return client.post('/account/profile/edit', data={'csrf_token':token(client, '/'), 'name':'ชื่อใหม่', 'username':'My_Handle', 'bio':'  สวัสดี <script>alert(1)</script>  ', **fields})


def test_edit_profile_normalizes_and_persists_safely(account):
    app, client = account
    token(client, '/')  # Establish activity before comparing immutable profile fields.
    before = row(app)
    response = edit(client)
    assert response.status_code == 303
    after = row(app)
    assert after['name'] == 'ชื่อใหม่' and after['username'] == 'my_handle'
    assert after['bio'] == 'สวัสดี <script>alert(1)</script>'
    for key in ('joined_at','email','password_hash','photo_ref'):
        assert after[key] == before[key]
    restarted = create_app(dict(app.config)).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    page = restarted.get('/account/profile').text
    assert 'ชื่อใหม่' in page and '@my_handle' in page
    assert '&lt;script&gt;alert(1)&lt;/script&gt;' in page
    assert '<script>alert(1)</script>' not in page


@pytest.mark.parametrize('fields', [
    {'name':''}, {'name':'x'*81}, {'name':'bad\x00name'}, {'username':'ab'},
    {'username':'x'*33}, {'username':'@handle'}, {'username':'มีชื่อ'},
    {'username':'bad space'}, {'username':'../path'}, {'username':'member-2'},
    {'bio':'x'*501}, {'bio':'bad\x00bio'}, {'user_id':'2'}, {'joined_at':'0'},
    {'last_active_at':'0'}, {'photo_ref':'x'}, {'email':'hack@test.test'},
])
def test_edit_rejects_invalid_fields_preserves_account(account, fields):
    app, client = account
    token(client, '/')  # Establish activity before comparing immutable profile fields.
    before = row(app)
    response = edit(client, **fields)
    assert response.status_code == 400
    assert 'role="alert"' in response.text
    assert row(app) == before


def test_username_conflict_is_case_insensitive_and_preserves_input(account):
    app, client = account
    other = app.test_client(); register(other, 'other@example.test')
    other.post('/login', data={'csrf_token':token(other,'/login'), 'email':'other@example.test', 'password':'correct horse battery'})
    assert edit(client, username='unique').status_code == 303
    response = edit(other, username=' UNIQUE ', name='ชื่อที่ยังไม่บันทึก', bio='<b>safe</b>')
    assert response.status_code == 409
    assert 'ชื่อที่ยังไม่บันทึก' in response.text and '&lt;b&gt;safe&lt;/b&gt;' in response.text
    assert row(app, 2)['username'] == 'member-2'
    assert edit(other, username='member-2', name='x'*80, bio='ก'*500).status_code == 303


def test_edit_auth_csrf_and_no_foreign_owner(account):
    app, client = account
    guest = app.test_client()
    assert guest.get('/account/profile/edit').status_code == 303
    assert guest.post('/account/profile/edit', data={}).status_code == 403
    assert client.post('/account/profile/edit', data={'name':'bad'}).status_code == 403
    assert client.post('/account/profile/edit', data={'csrf_token':token(client,'/')}, headers={'Origin':'https://evil.test'}).status_code == 403
    assert client.post('/account/profile/edit/2', data={'csrf_token':token(client,'/')}).status_code == 404
    from werkzeug.datastructures import MultiDict
    data=MultiDict([('csrf_token',token(client,'/')),('name','A'),('name','B'),('username','abc'),('bio','')])
    assert client.post('/account/profile/edit',data=data).status_code == 400


def test_activity_is_authenticated_throttled_and_not_asset_driven(account, monkeypatch):
    app, client = account
    now = time.time()
    monkeypatch.setattr('app.time.time', lambda: now)
    client.get('/account/profile')
    assert row(app)['last_active_at'] == now
    monkeypatch.setattr('app.time.time', lambda: now + 30)
    client.get('/leaderboards')
    assert row(app)['last_active_at'] == now
    monkeypatch.setattr('app.time.time', lambda: now + 61)
    client.get('/account/photos/1')
    client.get('/courses/scale-lab/assets/no-image.png')
    app.test_client().get('/')
    client.post('/account/profile/edit',data={})
    assert row(app)['last_active_at'] == now
    client.get('/')
    assert row(app)['last_active_at'] == now + 61


@pytest.mark.parametrize('count,passed,level,done,total,remaining', [
    (0,False,1,0,1,1), (1,False,2,0,2,2), (2,False,2,1,2,1),
    (3,False,3,0,2,2), (4,False,3,1,2,1), (5,False,4,0,2,2),
    (7,False,5,0,2,2), (9,False,6,0,2,2), (11,False,7,0,2,2),
    (12,False,7,1,2,1), (13,False,8,0,1,None), (99,False,8,0,1,None),
    (13,True,9,1,1,None), (0,True,9,1,1,None),
])
def test_level_ring_is_within_band_and_exam_aware(count, passed, level, done, total, remaining):
    import achievements
    assert hasattr(achievements, 'level_progress')
    progress = achievements.level_progress(count, passed)
    assert (progress['level'],progress['done'],progress['total'],progress['remaining']) == (level,done,total,remaining)
    assert 0 <= progress['percent'] <= 100
    if level == 8: assert '95%' in progress['caption']
    if level == 9: assert 'ยินดี' in progress['caption']


def test_profile_card_members_only_and_own_edit(account):
    app, client = account
    other = app.test_client(); register(other,'other@example.test')
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE users SET joined_at=NULL, last_active_at=? WHERE id=2', (time.time()-840,))
    page = client.get('/account/profile').text
    assert 'class="profile-card"' in page
    assert 'role="progressbar"' in page and 'aria-valuenow="0"' in page
    assert 'href="/account/profile/edit"' in page
    assert 'ใช้งานอยู่ตอนนี้' in page
    page = client.get('/members/2').text
    assert 'ไม่ทราบวันที่สมัคร' in page and '14 นาทีที่แล้ว' in page
    assert 'other@example.test' not in page and 'learner@example.com' not in page
    assert 'href="/account/profile/edit"' not in page and 'id="photo"' not in page
    assert 'href="/members/2"' in client.get('/leaderboards').text
    assert app.test_client().get('/members/2').status_code == 303
    assert client.get('/members/999').status_code == 404


def test_registration_records_real_join_time_and_private_handle(account):
    app, client = account
    user = row(app)
    assert user.get('joined_at') is not None
    assert abs(user['joined_at'] - time.time()) < 10
    assert user['username'] == 'member-1'
    assert user['bio'] == ''


def test_legacy_migration_keeps_unknown_join_time(tmp_path):
    path = tmp_path/'legacy.sqlite3'
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL)')
        db.execute("INSERT INTO users VALUES(7,'Secret Name','private@example.test','no-login')")
    app = create_app({'TESTING':True,'DATABASE':str(path)})
    user = row(app, 7)
    assert 'joined_at' in user
    assert user['joined_at'] is None and user['last_active_at'] is None
    assert user['username'] == 'member-7'
    assert row(create_app(dict(app.config)), 7) == user
