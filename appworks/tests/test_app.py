import importlib.util
import sqlite3
import re
import pytest


def test_register_persists_hashed_account(client, app):
    assert client.get('/register').status_code == 200
    response = register(client)
    assert response.status_code == 303
    with sqlite3.connect(app.config['DATABASE']) as db:
        row = db.execute('SELECT name,email,password_hash FROM users').fetchone()
    assert row[:2] == ('นักเรียน', 'learner@example.com')
    from werkzeug.security import check_password_hash
    assert row[2].startswith('scrypt:')
    assert check_password_hash(row[2], 'correct horse battery')


def test_login_protects_classroom_and_persists_session(client, app):
    assert client.get('/').status_code == 303
    register(client)
    response = client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'LEARNER@example.com', 'password': 'correct horse battery'})
    assert response.status_code == 303
    assert 'HttpOnly' in response.headers['Set-Cookie']
    assert 'SameSite=Lax' in response.headers['Set-Cookie']
    page = client.get('/')
    assert page.status_code == 200
    assert '/courses/scale-lab/' in page.text
    assert '127.0.0.1:5173' not in page.text
    assert 'นักเรียน' in page.text
    from app import create_app
    restarted = create_app({'TESTING': True, 'DATABASE': app.config['DATABASE']}).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    assert restarted.get('/').status_code == 200


def test_logout_invalidates_copied_cookie(client):
    register(client)
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'learner@example.com', 'password': 'correct horse battery'})
    cookie = client.get_cookie('aw_session').value
    response = client.post('/logout', data={'csrf_token': token(client, '/')})
    assert response.status_code == 303
    client.set_cookie('aw_session', cookie)
    assert client.get('/').status_code == 303


@pytest.mark.parametrize('path', ['/register', '/login', '/logout'])
def test_csrf_rejects_missing_token_and_foreign_origin(client, path):
    assert client.post(path, data={}).status_code == 403
    csrf = token(client)
    assert client.post(path, data={'csrf_token': csrf}, headers={'Origin': 'https://evil.example'}).status_code == 403
    assert client.post(path, data={'csrf_token': csrf}, headers={'Sec-Fetch-Site': 'cross-site'}).status_code == 403
    other = client.application.test_client()
    token(other)
    assert other.post(path, data={'csrf_token': csrf}).status_code == 403


@pytest.mark.parametrize('email,password', [('bad', 'long password here'), ('a@b.co', 'short'), ('a@b.co', 'x'*129), ('a b@c.com', 'long password here')])
def test_register_validates_input(client, email, password):
    assert register(client, email, password).status_code == 400


def test_register_duplicate_normalized_email(client):
    register(client)
    assert register(client, ' learner@EXAMPLE.com ').status_code == 409


def test_login_throttling_is_persistent_and_generic(client, app):
    register(client)
    csrf = token(client, '/login')
    responses = [client.post('/login', data={'csrf_token': csrf, 'email': email, 'password': 'wrong'}) for email in ['learner@example.com', 'missing@example.com']]
    assert [r.status_code for r in responses] == [401, 401]
    assert responses[0].data == responses[1].data
    for _ in range(3):
        assert client.post('/login', data={'csrf_token': csrf, 'email': 'missing@example.com', 'password': 'wrong'}).status_code == 401
    from app import create_app
    restarted = create_app({'TESTING': True, 'DATABASE': app.config['DATABASE']}).test_client()
    restarted.set_cookie('aw_session', client.get_cookie('aw_session').value)
    response = restarted.post('/login', data={'csrf_token': csrf, 'email': 'learner@example.com', 'password': 'correct horse battery'})
    assert response.status_code == 429
    assert int(response.headers['Retry-After']) > 0


def test_session_rotation_expiry_security_headers(client, app):
    register(client)
    old = client.get_cookie('aw_session').value
    client.post('/login', data={'csrf_token': token(client, '/login'), 'email': 'learner@example.com', 'password': 'correct horse battery'})
    assert client.get_cookie('aw_session').value != old
    page = client.get('/')
    assert page.headers.get('Cache-Control') == 'no-store'
    assert page.headers.get('X-Frame-Options') == 'DENY'
    with sqlite3.connect(app.config['DATABASE']) as db:
        assert db.execute('SELECT count(*) FROM sessions').fetchone()[0] == 1
        db.execute('UPDATE sessions SET expires=0')
    assert client.get('/').status_code == 303


def test_secure_cookie_config(app):
    app.config['COOKIE_SECURE'] = True
    assert 'Secure;' in app.test_client().get('/login').headers['Set-Cookie']


@pytest.mark.parametrize('path', ['/app.py', '/instance/classroom.sqlite3', '/backups/prototype.html', '/templates/classroom.html', '/index.html', '/.venv/pyvenv.cfg'])
def test_private_files_not_served(client, path):
    assert client.get(path).status_code == 404


def test_unicode_csrf_is_rejected_without_server_error(client):
    token(client)
    assert client.post('/login', data={'csrf_token': 'ผิด'}).status_code == 403


def test_factory_exists():
    assert importlib.util.find_spec('app') is not None, 'Missing web application'


@pytest.fixture
def app(tmp_path):
    from app import create_app
    return create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'test.sqlite3')})


@pytest.fixture
def client(app):
    return app.test_client()


def token(client, path='/register'):
    page = client.get(path)
    return re.search(r'name="csrf_token" value="([^"]+)"', page.text)[1]


def register(client, email='Learner@Example.com', password='correct horse battery'):
    # Explicitly exercise email verification; never disable the production gate.
    from unittest.mock import patch
    messages = []
    with patch.dict(client.application.config, {'RESET_ENABLED': True, 'RESET_TRANSPORT':'graph'}), patch('graph_mail.send', side_effect=lambda cfg, message: messages.append(message)):
        response = client.post('/register', data={'csrf_token': token(client), 'name': 'นักเรียน', 'email': email, 'password': password})
        if response.status_code == 303 and response.location == '/register/verify':
            page = client.get('/register/verify')
            challenge = re.search(r'name="challenge" value="([^"]+)"', page.text)[1]
            value = re.search(r'(?<!\d)\d{6}(?!\d)', messages[-1].get_content())[0]
            response = client.post('/register/verify', data={'csrf_token':token(client, '/register/verify'), 'challenge':challenge, 'code':value})
        return response
