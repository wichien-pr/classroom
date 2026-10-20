import re
import sqlite3
import pytest
from app import create_app
from test_app import token

@pytest.fixture
def otp(tmp_path, monkeypatch):
    messages = []
    monkeypatch.setattr('graph_mail.send', lambda cfg, message: messages.append(message))
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path/'otp.sqlite3'),
        'RESET_ENABLED': True, 'RESET_TRANSPORT': 'graph', 'RESET_BASE_URL': 'https://classroom.example',
        'RESET_GRAPH_CLIENT_ID': '11111111-1111-4111-8111-111111111111',
        'RESET_GRAPH_TENANT_ID': '22222222-2222-4222-8222-222222222222',
        'RESET_GRAPH_CLIENT_SECRET': 'test-only', 'RESET_GRAPH_SENDER': 'sender@example.test'})
    return app, app.test_client(), messages

def start(client, email='new@example.test', password='correct horse battery'):
    return client.post('/register', data={'csrf_token':token(client), 'name':'นักเรียน', 'email':email, 'password':password})

def code(messages):
    return re.search(r'(?<!\d)\d{6}(?!\d)', messages[-1].get_content())[0]

def verify(client, value):
    page = client.get('/register/verify')
    challenge = re.search(r'name="challenge" value="([^"]+)"',page.text)[1]
    return client.post('/register/verify', data={'csrf_token':token(client, '/register/verify'), 'challenge':challenge, 'code':value})

def test_missing_delivery_configuration_fails_closed(tmp_path, monkeypatch):
    monkeypatch.setattr('graph_mail.send', lambda *args: None)
    client = create_app({'TESTING':True, 'DATABASE':str(tmp_path/'disabled.sqlite3')}).test_client()
    assert start(client).status_code == 503


def test_delivery_failure_invalidates_challenge(otp, monkeypatch):
    app, client, messages = otp
    def failed(*args):
        raise OSError('provider unavailable')
    monkeypatch.setattr('graph_mail.send', failed)
    assert start(client).status_code == 503
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM pending_registrations').fetchone()[0] == 0


def test_existing_email_is_not_overwritten(otp):
    app, client, messages = otp
    start(client)
    assert verify(client, code(messages)).status_code == 303
    assert start(client).status_code == 409
    assert len(messages) == 1


def test_five_wrong_codes_invalidate_even_correct_code(otp):
    app, client, messages = otp
    start(client)
    right = code(messages)
    wrong = '000000' if right != '000000' else '111111'
    for _ in range(5):
        assert verify(client, wrong).status_code == 400
    assert verify(client, right).status_code == 400
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 0


def resend(client):
    page = client.get('/register/verify')
    challenge = re.search(r'name="challenge" value="([^"]+)"',page.text)[1]
    return client.post('/register/resend', data={'csrf_token':token(client, '/register/verify'), 'challenge':challenge})


def test_resend_cooldown_rotates_code_and_caps_deliveries(otp):
    app, client, messages = otp
    start(client)
    first = code(messages)
    assert resend(client).status_code == 429
    for _ in range(2):
        with sqlite3.connect(app.config['DATABASE']) as db:
            db.execute('UPDATE pending_registrations SET sent_at=sent_at-61')
        assert resend(client).status_code == 303
    assert len(messages) == 3
    assert verify(client, first).status_code == 400
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE pending_registrations SET sent_at=sent_at-61')
    assert resend(client).status_code == 429
    assert verify(client, code(messages)).location == '/login'


def test_duplicate_submit_does_not_replace_password_or_resend(otp):
    app, client, messages = otp
    start(client)
    assert start(client, password='attacker-new-password').status_code == 303
    assert len(messages) == 1
    assert verify(client, code(messages)).location == '/login'
    from werkzeug.security import check_password_hash
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert check_password_hash(db.execute('SELECT password_hash FROM users').fetchone()[0], 'correct horse battery')


def test_durable_email_and_ip_limits_include_resends(otp):
    app, client, messages = otp
    for _ in range(3):
        assert start(app.test_client()).status_code == 303
    assert start(app.test_client()).status_code == 429
    restarted = create_app(dict(app.config))
    assert start(restarted.test_client()).status_code == 429
    for n in range(7):
        assert start(app.test_client(), email=f'other{n}@example.test').status_code == 303
    assert start(app.test_client(), email='last@example.test').status_code == 429


def test_two_sessions_same_email_cannot_overwrite_verified_password(otp):
    from concurrent.futures import ThreadPoolExecutor
    app, first, messages = otp
    second = app.test_client()
    start(first)
    a = code(messages)
    start(second, password='second-password-123')
    b = code(messages)
    with ThreadPoolExecutor(2) as pool:
        results = list(pool.map(lambda pair: verify(*pair).status_code, [(first,a),(second,b)]))
    assert sorted(results) == [303,303]
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 1
        assert db.execute('SELECT count(*) FROM pending_registrations').fetchone()[0] == 0


def test_code_not_redeemable_before_delivery_acceptance(otp, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    import threading
    app, client, messages = otp
    token(client)
    copy = app.test_client()
    copy.set_cookie('aw_session', client.get_cookie('aw_session').value)
    entered, release = threading.Event(), threading.Event()
    def delayed(cfg, message):
        messages.append(message)
        entered.set()
        assert release.wait(5)
    monkeypatch.setattr('graph_mail.send', delayed)
    with ThreadPoolExecutor(1) as pool:
        future = pool.submit(start, client)
        assert entered.wait(5)
        try:
            assert verify(copy, code(messages)).status_code == 400
        finally:
            release.set()
        assert future.result().status_code == 303
    assert verify(copy, code(messages)).location == '/login'


def test_registration_smtp_option_uses_real_local_receipt(tmp_path, monkeypatch):
    from smtp_capture import Capture
    sink = Capture()
    monkeypatch.setattr('graph_mail.send', lambda *args: (_ for _ in ()).throw(AssertionError('wrong transport')))
    try:
        app = create_app({'TESTING':True,'DATABASE':str(tmp_path/'smtp.sqlite3'), 'RESET_ENABLED':True,
            'RESET_ALLOW_LOCAL':True,'RESET_BASE_URL':'http://127.0.0.1:8120', 'RESET_TRANSPORT':'smtp',
            'RESET_SMTP_HOST':'127.0.0.1','RESET_SMTP_PORT':sink.server_address[1],
            'RESET_SMTP_TLS':'none','RESET_SMTP_FROM':'sender@example.test'})
        client = app.test_client()
        assert start(client).status_code == 303
        assert len(sink.messages) == 1
        assert verify(client, code(sink.messages)).location == '/login'
    finally:
        sink.close()


def test_delivery_concurrency_is_bounded_and_busy_fails_closed(otp, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    import threading
    app, _, messages = otp
    entered, release = threading.Event(), threading.Event()
    lock = threading.Lock()
    def blocked(cfg, message):
        with lock:
            messages.append(message)
            if len(messages) == 4:
                entered.set()
        assert release.wait(10)
    monkeypatch.setattr('graph_mail.send', blocked)
    with ThreadPoolExecutor(5) as pool:
        futures = [pool.submit(start, app.test_client(), f'bound{i}@example.test') for i in range(4)]
        assert entered.wait(5)
        try:
            fifth = pool.submit(start, app.test_client(), 'overflow@example.test')
            assert fifth.result(timeout=2).status_code == 503
        finally:
            release.set()
        assert all(f.result().status_code == 303 for f in futures)
    assert len(messages) == 4


@pytest.mark.parametrize('path', ['/register','/register/verify','/register/resend'])
def test_registration_private_headers_and_narrow_null_origin(otp, path):
    app, client, messages = otp
    start(client)
    page = client.get('/register/verify')
    assert page.headers['Referrer-Policy'] == 'no-referrer'
    assert page.headers['Cache-Control'] == 'no-store'
    data = {'csrf_token':token(client, '/register/verify')}
    for site in ('cross-site','same-site','none',''):
        assert client.post(path, data=data, headers={'Origin':'null','Sec-Fetch-Site':site}).status_code == 403
    assert client.post(path, data=data, headers={'Origin':'null','Sec-Fetch-Site':'same-origin'}).status_code != 403
    assert client.post(path, data={}, headers={'Origin':'null','Sec-Fetch-Site':'same-origin'}).status_code == 403


def test_verify_ui_has_resend_and_delivery_pending_state(otp):
    app, client, messages = otp
    start(client)
    page = client.get('/register/verify').text
    assert 'action="/register/resend"' in page
    assert '60' in page
    assert 'กำลังส่ง' in page


def test_start_again_cancels_old_browser_challenge(otp):
    app, client, messages = otp
    start(client)
    csrf = token(client, '/register/verify')
    assert client.post('/register/cancel', data={'csrf_token':csrf}).location == '/register'
    assert client.get('/register/verify').location == '/register'
    assert start(client, password='changed-password-123').status_code == 303
    assert verify(client, code(messages)).location == '/login'


def test_register_explains_email_gate_and_pending_submit(otp):
    _, client, _ = otp
    page = client.get('/register').text
    assert 'ยืนยันอีเมล' in page and 'กำลังส่ง' in page


def test_pending_credentials_pruned_after_session_lifetime(otp):
    app, client, messages = otp
    start(client)
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE pending_registrations SET sent_at=0')
    start(app.test_client(),'fresh@example.test')
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM pending_registrations').fetchone()[0] == 1


def test_resend_never_reuses_previous_six_digit_value(otp, monkeypatch):
    app, client, messages = otp
    start(client)
    old = code(messages)
    values = iter([int(old), (int(old)+1)%1000000])
    monkeypatch.setattr('registration.secrets.randbelow', lambda _: next(values))
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('UPDATE pending_registrations SET sent_at=sent_at-61')
    assert resend(client).status_code == 303
    assert code(messages) != old
    assert verify(client, old).status_code == 400


@pytest.mark.parametrize('email', ['a,b@example.test','a;evil@example.test','bad\x00@example.test','a\"b@example.test'])
def test_registration_rejects_ambiguous_mailbox_headers(otp, email):
    app, client, messages = otp
    assert start(client,email).status_code == 400
    assert not messages


def test_registration_requires_mailed_code_before_account_exists(otp):
    app, client, messages = otp
    response = start(client)
    assert response.status_code == 303 and response.location == '/register/verify'
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 0
    assert messages[-1]['To'] == 'new@example.test'
    assert verify(client, code(messages)).location == '/login'
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT email_verified_at FROM users').fetchone()[0] > 0
    assert client.get('/').status_code == 303
