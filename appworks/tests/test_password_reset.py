import re
import sqlite3
import pytest
from app import create_app


@pytest.fixture
def app(tmp_path):
    return create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'test.sqlite3')})


def csrf(response):
    return re.search(r'name="csrf_token" value="([^"]+)"', response.text)[1]


@pytest.fixture
def mail_app(tmp_path):
    from smtp_capture import Capture
    sink = Capture()
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'mail.sqlite3'),
                      'RESET_ENABLED': True, 'RESET_ALLOW_LOCAL': True,
                      'RESET_BASE_URL': 'http://127.0.0.1:8118',
                      'RESET_SMTP_HOST': '127.0.0.1', 'RESET_SMTP_PORT': sink.server_address[1],
                      'RESET_SMTP_TLS': 'none', 'RESET_SMTP_FROM': 'classroom@example.test'})
    yield app, sink
    sink.close()


def register(client, email='member@example.test'):
    from test_app import register as verified_register
    assert verified_register(client, email, 'old-password-123').status_code == 303


def request_reset(app, client, email='member@example.test'):
    token = csrf(client.get('/forgot-password'))
    response = client.post('/forgot-password', data={'csrf_token':token, 'email':email})
    if 'password_reset_queue' in app.extensions:
        app.extensions['password_reset_queue'].join()
    return response


def test_real_smtp_receipt_uses_trusted_url_hash_only(mail_app):
    import hashlib
    app, sink = mail_app
    client = app.test_client()
    register(client)
    response = request_reset(app, client)
    assert response.status_code == 200
    assert len(sink.messages) == 1
    mail = sink.messages[0]
    assert str(mail['To']) == 'member@example.test'
    body = mail.get_content()
    url = re.search(r'http://127\.0\.0\.1:8118/reset-password#[A-Za-z0-9_-]{43}', body)
    assert url
    raw = url[0].split('#')[1]
    assert raw not in response.text
    assert 'old-password' not in body
    with sqlite3.connect(app.config['DATABASE']) as db:
        rows = db.execute('SELECT token_hash, user_id, expires FROM password_resets').fetchall()
    assert len(rows) == 1
    assert rows[0][0] == hashlib.sha256(raw.encode()).hexdigest()
    assert raw not in str(rows)
    assert request_reset(app, client, 'missing@example.test').text == response.text
    assert len(sink.messages) == 1


def raw_token(sink, index=-1):
    return re.search(r'/reset-password#([A-Za-z0-9_-]{43})', sink.messages[index].get_content())[1]


def login(client, password='old-password-123', email='member@example.test'):
    return client.post('/login', data={'csrf_token':csrf(client.get('/login')), 'email':email, 'password':password})


def test_reset_consumes_once_revokes_sessions_without_login_or_progress_loss(mail_app):
    app, sink = mail_app
    member = app.test_client()
    register(member)
    assert login(member).status_code == 303
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute("INSERT INTO lesson_progress VALUES(1,'example','one',123)")
    guest = app.test_client()
    request_reset(app, guest)
    first = raw_token(sink)
    request_reset(app, guest)
    second = raw_token(sink)
    page = guest.get('/reset-password')
    assert page.status_code == 200
    assert page.headers['Referrer-Policy'] == 'no-referrer'
    data = {'csrf_token':csrf(page), 'token':first, 'password':'new-password-456', 'confirmation':'new-password-456'}
    assert guest.post('/reset-password', data=data).status_code == 200
    assert guest.post('/reset-password', data={**data, 'token':second}).status_code == 400
    assert guest.post('/reset-password', data=data).status_code == 400
    assert guest.get('/').status_code == 303
    assert member.get('/').status_code == 303
    assert login(guest).status_code == 401
    assert login(guest, 'new-password-456').status_code == 303
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 0
        assert db.execute('SELECT * FROM lesson_progress').fetchall() == [(1,'example','one',123)]


@pytest.mark.parametrize('password,confirmation', [('short','short'), ('x'*129,'x'*129), ('valid-password','different-value')])
def test_password_policy_errors_do_not_consume(mail_app, password, confirmation):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    request_reset(app, client)
    raw = raw_token(sink)
    token = csrf(client.get('/reset-password'))
    response = client.post('/reset-password', data={'csrf_token':token, 'token':raw,
                            'password':password, 'confirmation':confirmation})
    assert response.status_code == 400
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 1
    assert client.post('/reset-password', data={'csrf_token':token, 'token':raw,
                       'password':'valid-password', 'confirmation':'valid-password'}).status_code == 200


def test_persistent_account_rate_limit_same_response_after_restart(mail_app):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    responses = [request_reset(app, client).text for _ in range(4)]
    assert len(sink.messages) == 3
    assert len(set(responses)) == 1
    restarted = create_app(dict(app.config))
    other = restarted.test_client()
    token = csrf(other.get('/forgot-password'))
    response = other.post('/forgot-password', data={'csrf_token': token, 'email':' MEMBER@example.test '}, environ_base={'REMOTE_ADDR':'127.0.0.2'})
    restarted.extensions['password_reset_queue'].join()
    assert response.status_code == 200
    assert len(sink.messages) == 3


def test_unknown_accounts_count_toward_ip_limit_and_window_expires(mail_app):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    for i in range(10):
        assert request_reset(app, client, f'unknown{i}@example.test').status_code == 200
    assert request_reset(app, client).status_code == 200
    assert len(sink.messages) == 0
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE password_reset_limits SET attempted=0')
    request_reset(app, client)
    assert len(sink.messages) == 1


@pytest.mark.parametrize('override', [
    {'RESET_BASE_URL':'http://classroom.example.test'},
    {'RESET_BASE_URL':'https://user:secret@classroom.example.test'},
    {'RESET_BASE_URL':'https://classroom.example.test/path?x=1'},
    {'RESET_BASE_URL':'https://classroom.example.test/#bad'},
    {'RESET_BASE_URL':''}, {'RESET_SMTP_HOST':''},
    {'RESET_SMTP_TLS':'none'}, {'RESET_SMTP_TLS':'invalid'},
    {'RESET_SMTP_FROM':'bad\r\nBcc: victim@example.test'},
    {'RESET_SMTP_PORT':0}, {'RESET_SMTP_TIMEOUT':0},
    {'RESET_SMTP_USERNAME':'user', 'RESET_SMTP_PASSWORD':''},
    {'RESET_ALLOW_LOCAL':True, 'RESET_SMTP_TLS':'none'},
])
def test_enabled_unsafe_config_fails_closed(tmp_path, override):
    config = {'TESTING':True, 'DATABASE':str(tmp_path/'config.sqlite3'),
              'RESET_ENABLED':True, 'RESET_BASE_URL':'https://classroom.example.test',
              'RESET_SMTP_HOST':'smtp.example.test', 'RESET_SMTP_FROM':'no-reply@example.test'}
    with pytest.raises(ValueError, match='password recovery configuration'):
        create_app({**config, **override})


def test_disabling_recovery_rejects_previously_issued_token(mail_app):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    request_reset(app, client)
    raw = raw_token(sink)
    disabled = create_app({**dict(app.config), 'RESET_ENABLED':False})
    client = disabled.test_client()
    response = client.post('/reset-password', data={'csrf_token':csrf(client.get('/reset-password')),
                           'token':raw, 'password':'new-password-456', 'confirmation':'new-password-456'})
    assert response.status_code == 400
    assert login(client).status_code == 303


def test_login_in_flight_cannot_escape_reset_revocation(mail_app, monkeypatch):
    import app as app_module
    from concurrent.futures import ThreadPoolExecutor, TimeoutError
    from threading import Event
    app, sink = mail_app
    client = app.test_client()
    register(client)
    request_reset(app, client)
    data = {'csrf_token':csrf(client.get('/reset-password')), 'token':raw_token(sink),
            'password':'new-password-456', 'confirmation':'new-password-456'}
    old = app.test_client()
    old_csrf = csrf(old.get('/login'))
    entered, release = Event(), Event()
    original = app_module.check_password_hash
    def delayed(*args):
        entered.set()
        assert release.wait(5)
        return original(*args)
    monkeypatch.setattr(app_module, 'check_password_hash', delayed)
    with ThreadPoolExecutor(2) as pool:
        logging_in = pool.submit(old.post, '/login', data={'csrf_token':old_csrf, 'email':'member@example.test', 'password':'old-password-123'})
        assert entered.wait(5)
        resetting = pool.submit(client.post, '/reset-password', data=data)
        try:
            resetting.result(timeout=0.5)
        except TimeoutError:
            pass
        finally:
            release.set()
        assert resetting.result().status_code == 200
        assert logging_in.result().status_code in (303,401)
    assert old.get('/').status_code == 303


# Characterization/regression coverage for the already-green recovery slices.
@pytest.mark.parametrize('kind', ['expired','tampered','empty','malformed','too-long'])
def test_bad_tokens_do_not_change_password(mail_app, kind):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    request_reset(app, client)
    raw = raw_token(sink)
    if kind == 'expired':
        with sqlite3.connect(app.config['DATABASE']) as db:
            db.execute('UPDATE password_resets SET expires=0')
    else:
        raw = {'tampered': ('A' if raw[0] != 'A' else 'B') + raw[1:],
               'empty':'', 'malformed':'<script>bad</script>', 'too-long':'x'*1000}[kind]
    response = client.post('/reset-password', data={'csrf_token':csrf(client.get('/reset-password')),
                           'token':raw, 'password':'new-password-456', 'confirmation':'new-password-456'})
    assert response.status_code == 400
    assert login(client).status_code == 303


def test_concurrent_reset_only_one_commit(mail_app):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier
    app, sink = mail_app
    owner = app.test_client()
    register(owner)
    request_reset(app, owner)
    raw = raw_token(sink)
    barrier = Barrier(2)
    def submit(index):
        client = app.test_client()
        token = csrf(client.get('/reset-password'))
        barrier.wait(timeout=5)
        return client.post('/reset-password', data={'csrf_token':token, 'token':raw,
                           'password':f'new-password-{index}', 'confirmation':f'new-password-{index}'}).status_code
    with ThreadPoolExecutor(2) as pool:
        assert sorted(pool.map(submit, [1,2])) == [200,400]


def test_reset_csrf_origin_get_and_cross_account_isolation(mail_app):
    app, sink = mail_app
    owner, other = app.test_client(), app.test_client()
    register(owner)
    register(other, 'other@example.test')
    assert login(other, email='other@example.test').status_code == 303
    request_reset(app, owner)
    raw = raw_token(sink)
    page = other.get('/reset-password')
    data = {'csrf_token':csrf(page), 'token':raw, 'password':'new-password-456', 'confirmation':'new-password-456', 'user_id':2}
    assert other.post('/reset-password', data={**data,'csrf_token':csrf(owner.get('/reset-password'))}).status_code == 403
    assert other.post('/reset-password', data=data, headers={'Origin':'https://evil.test'}).status_code == 403
    assert other.post('/reset-password', data=data, headers={'Sec-Fetch-Site':'cross-site'}).status_code == 403
    for _ in range(3):
        assert owner.get('/reset-password').status_code == 200
    with sqlite3.connect(app.config['DATABASE']) as db:
        tables = [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'") if r[0] not in ('users','sessions','password_resets','password_reset_limits')]
        before = {t:db.execute(f'SELECT * FROM "{t}"').fetchall() for t in tables}
        other_hash = db.execute('SELECT password_hash FROM users WHERE id=2').fetchone()[0]
    assert other.post('/reset-password', data=data).status_code == 200
    assert other.get('/').status_code == 200
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT password_hash FROM users WHERE id=2').fetchone()[0] == other_hash
        assert {t:db.execute(f'SELECT * FROM "{t}"').fetchall() for t in tables} == before
    assert login(owner, 'new-password-456').status_code == 303


def test_smtp_failure_is_generic_and_does_not_downgrade_tls(mail_app, caplog):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    app.config['RESET_SMTP_TLS'] = 'starttls'  # Real sink does not offer STARTTLS.
    a = request_reset(app, client)
    b = request_reset(app, client, 'missing@example.test')
    assert a.status_code == b.status_code == 200
    assert a.text == b.text
    assert sink.messages == []
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM password_resets').fetchone()[0] == 0
    assert 'Password recovery delivery failed' in caplog.text
    assert 'member@example.test' not in caplog.text
    assert 'old-password-123' not in caplog.text


def test_public_url_never_uses_host_or_forwarded_host(mail_app):
    app, sink = mail_app
    client = app.test_client()
    register(client)
    headers = {'X-Forwarded-Host':'evil.test'}
    response = client.get('/forgot-password', headers=headers)
    client.post('/forgot-password', headers=headers, data={'csrf_token':csrf(response), 'email':'member@example.test'})
    app.extensions['password_reset_queue'].join()
    assert 'evil.test' not in sink.messages[0].get_content()
    assert 'http://127.0.0.1:8118/reset-password#' in sink.messages[0].get_content()


def test_private_form_null_origin_requires_same_origin_metadata_and_csrf(app):
    client = app.test_client()
    token = csrf(client.get('/forgot-password'))
    data = {'csrf_token':token,'email':'missing@example.test'}
    response = client.post('/forgot-password', data=data, headers={'Origin':'null','Sec-Fetch-Site':'same-origin'})
    assert response.status_code == 200
    for headers in [{'Origin':'null'}, {'Origin':'null','Sec-Fetch-Site':'same-site'}, {'Origin':'null','Sec-Fetch-Site':'cross-site'}]:
        assert client.post('/forgot-password', data=data, headers=headers).status_code == 403
    assert client.post('/forgot-password', data={'email':'missing@example.test'}, headers={'Origin':'null','Sec-Fetch-Site':'same-origin'}).status_code == 403


def test_invalid_numeric_environment_is_sanitized(tmp_path, monkeypatch):
    monkeypatch.setenv('APPWORKS_RESET_SMTP_PORT', 'invalid-private-setting')
    with pytest.raises(ValueError, match='password recovery configuration') as error:
        create_app({'TESTING':True, 'DATABASE':str(tmp_path/'environment.sqlite3')})
    assert 'invalid-private-setting' not in str(error.value)


def test_forgot_page_is_anonymous_private_and_generic_without_config(app):
    client = app.test_client()
    assert '/forgot-password' in client.get('/login').text
    page = client.get('/forgot-password')
    assert page.status_code == 200
    assert page.headers['Referrer-Policy'] == 'no-referrer'
    assert page.headers['Cache-Control'] == 'no-store'
    token = csrf(page)
    a = client.post('/forgot-password', data={'csrf_token': token, 'email': 'nobody@example.test'})
    assert a.status_code == 200
    assert 'หากอีเมลนี้' in a.text
    assert client.post('/forgot-password', data={'email': 'a@example.test'}).status_code == 403
    assert client.post('/forgot-password', data={'csrf_token': token}, headers={'Origin':'https://evil.test'}).status_code == 403
