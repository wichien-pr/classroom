"""Regression/security characterization of the pending-only account boundary."""
import hashlib
import hmac
import re
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from app import create_app
from test_registration_otp import otp, start, code, verify, resend
from test_app import token


def test_pending_cannot_login_or_reset_password(otp):
    app, client, messages = otp
    start(client)
    response = client.post('/login', data={'csrf_token':token(client,'/login'), 'email':'new@example.test','password':'correct horse battery'})
    assert response.status_code == 401
    assert client.get('/').location == '/login'
    client.post('/forgot-password',data={'csrf_token':token(client,'/forgot-password'),'email':'new@example.test'})
    app.extensions['password_reset_queue'].join()
    assert len(messages) == 1
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 0
    assert client.post('/reset-password',data={'csrf_token':token(client,'/reset-password'),'token':code(messages),'password':'new-password-123','confirmation':'new-password-123'}).status_code == 400


def test_expiry_and_session_expiration_fail_closed(otp):
    app, client, messages = otp
    start(client)
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE pending_registrations SET expires=0')
    assert verify(client,code(messages)).status_code == 400
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE sessions SET expires=0')
    assert client.get('/register/verify').location == '/register'


def test_database_does_not_contain_otp_or_its_unkeyed_hash(otp):
    app, client, messages = otp
    start(client)
    raw = code(messages)
    with sqlite3.connect(app.config['DATABASE']) as db:
        stored = db.execute('SELECT code_hash,challenge FROM pending_registrations').fetchone()
    assert stored[0] != raw and stored[0] != hashlib.sha256(raw.encode()).hexdigest()
    assert stored[0] == hmac.new(client.get_cookie('aw_session').value.encode(),(stored[1]+':'+raw).encode(),hashlib.sha256).hexdigest()
    assert 'correct horse battery' not in messages[-1].get_content()
    assert raw not in client.get('/register/verify').text


def test_other_browser_code_cannot_verify_or_replace_first_password(otp):
    app, first, messages = otp
    start(first)
    first_code = code(messages)
    second = app.test_client()
    start(second,password='another-password-123')
    assert verify(second,first_code).status_code == 400
    assert verify(first,first_code).location == '/login'
    from werkzeug.security import check_password_hash
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert check_password_hash(db.execute('SELECT password_hash FROM users').fetchone()[0], 'correct horse battery')


def test_same_challenge_concurrent_redemption_is_single_use(otp):
    app, client, messages = otp
    start(client)
    page = client.get('/register/verify').text
    data={'csrf_token':token(client,'/register/verify'),'challenge':re.search(r'name="challenge" value="([^"]+)"',page)[1],'code':code(messages)}
    def post(_):
        other=app.test_client();other.set_cookie('aw_session',client.get_cookie('aw_session').value)
        return other.post('/register/verify',data=data)
    with ThreadPoolExecutor(8) as pool:
        responses=list(pool.map(post,range(8)))
    assert sum(r.location == '/login' for r in responses) == 1
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 1


def test_concurrent_resends_deliver_once_and_stale_generation_cannot_verify(otp):
    app, client, messages = otp
    start(client)
    old = code(messages)
    page = client.get('/register/verify').text
    data = {'csrf_token':token(client,'/register/verify'), 'challenge':re.search(r'name="challenge" value="([^"]+)"',page)[1]}
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE pending_registrations SET sent_at=sent_at-61')
    def post(_):
        other=app.test_client();other.set_cookie('aw_session',client.get_cookie('aw_session').value)
        return other.post('/register/resend',data=data)
    with ThreadPoolExecutor(8) as pool:
        responses=list(pool.map(post,range(8)))
    assert all(r.status_code == 303 for r in responses)
    assert len(messages) == 2
    assert client.post('/register/verify', data={**data,'code':code(messages)}).status_code == 400
    assert verify(client,old).status_code == 400
    assert verify(client,code(messages)).location == '/login'


def test_concurrent_wrong_attempts_are_serialized(otp):
    app, client, messages = otp
    start(client)
    raw=code(messages);wrong='000000' if raw!='000000' else '111111'
    def attempt(_):
        other=app.test_client();other.set_cookie('aw_session',client.get_cookie('aw_session').value)
        return verify(other,wrong).status_code
    with ThreadPoolExecutor(8) as pool:
        assert list(pool.map(attempt,range(8))) == [400]*8
    assert verify(client,raw).status_code == 400
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT attempts FROM pending_registrations').fetchone()[0] == 5


def test_restart_preserves_pending_cookie_and_verification(otp):
    app, client, messages = otp
    start(client)
    restarted=create_app(dict(app.config)).test_client()
    restarted.set_cookie('aw_session',client.get_cookie('aw_session').value)
    assert verify(restarted,code(messages)).location == '/login'


def test_pre_feature_accounts_remain_usable_without_fabricated_timestamp(tmp_path):
    from werkzeug.security import generate_password_hash
    path=str(tmp_path/'legacy.sqlite3')
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL)')
        db.execute('INSERT INTO users VALUES(1,?,?,?)',('Legacy','legacy@example.test',generate_password_hash('legacy-password-123')))
    app=create_app({'TESTING':True,'DATABASE':path})
    client=app.test_client()
    assert client.post('/login',data={'csrf_token':token(client,'/login'),'email':'legacy@example.test','password':'legacy-password-123'}).location == '/'
    with sqlite3.connect(path) as db:
        assert db.execute('SELECT email_verified_at FROM users').fetchone()[0] is None


def test_stale_delivery_completion_does_not_enable_replacement(otp, monkeypatch):
    import threading
    app, client, messages = otp
    token(client)
    other=app.test_client();other.set_cookie('aw_session',client.get_cookie('aw_session').value)
    entered,release=threading.Event(),threading.Event()
    def delay(cfg,message):
        messages.append(message)
        if message['To']=='new@example.test':
            entered.set();assert release.wait(5)
        else:
            raise OSError('delivery failed')
    monkeypatch.setattr('graph_mail.send',delay)
    with ThreadPoolExecutor(1) as pool:
        first=pool.submit(start,client)
        assert entered.wait(5)
        try:
            assert start(other,'replacement@example.test').status_code == 503
        finally:
            release.set()
        assert first.result().status_code == 303
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM pending_registrations').fetchone()[0] == 0
        assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 0
