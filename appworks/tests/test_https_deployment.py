"""HTTPS deployment contract; config rendering never reads private runtime env."""
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import threading
import urllib.error
import urllib.request


import pytest

ROOT = Path(__file__).resolve().parents[2]


def https_config():
    if not shutil.which('docker'):
        pytest.skip('Docker Compose required to validate HTTPS deployment')
    env = {**os.environ, 'CLASSROOM_DATA_VOLUME': 'classroom-https-test-unused',
           'CLASSROOM_ENV_FILE': str(ROOT / 'docker/runtime.env.example'),
           'CLASSROOM_DOMAIN': 'classroom.example.test'}
    result = subprocess.run(['docker', 'compose', '--env-file', '/dev/null',
                             '-f', str(ROOT / 'compose.yaml'),
                             '-f', str(ROOT / 'compose.https.yaml'),
                             'config', '--format', 'json'],
                            env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)


def test_https_deployment_closes_backend_and_sets_secure_origin():
    config = https_config()
    backend = config['services']['classroom']
    assert not backend.get('ports')
    assert '--url-scheme=https' in backend['command']
    assert backend['environment']['APPWORKS_COOKIE_SECURE'] == '1'
    assert backend['environment']['APPWORKS_RESET_ALLOW_LOCAL'] == '0'
    assert backend['environment']['APPWORKS_RESET_BASE_URL'] == 'https://classroom.example.test'
    proxy = config['services']['https']
    assert {p['target'] for p in proxy['ports']} == {80, 443}
    assert any(v['target'] == '/data' and v['type'] == 'volume' for v in proxy['volumes'])


def test_https_origin_through_real_waitress(tmp_path):
    """Use the configured server options, not Flask's synthetic HTTPS client."""
    from app import create_app
    from waitress import create_server
    from werkzeug.security import generate_password_hash
    config = https_config()
    command = config['services']['classroom']['command']
    scheme = next(arg.split('=', 1)[1] for arg in command if arg.startswith('--url-scheme='))
    app = create_app({'TESTING': True, 'DATABASE': str(tmp_path / 'https.sqlite3'),
                      'COOKIE_SECURE': True, 'RESET_ENABLED': False})
    with sqlite3.connect(app.config['DATABASE']) as db:
        db.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',
                   ('HTTPS test', 'https@example.test', generate_password_hash('test password only')))
    server = create_server(app, host='127.0.0.1', port=0, url_scheme=scheme)
    from waitress import wasyncore
    stopped = threading.Event()

    def serve():
        while not stopped.is_set():
            wasyncore.loop(timeout=0.05, count=1, map=server._map)

    thread = threading.Thread(target=serve, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.effective_port}'
    host = 'classroom.example.test'

    def request(path, data=None, headers=None):
        from urllib.parse import urlencode
        req = urllib.request.Request(base + path, data=urlencode(data).encode() if data is not None else None,
                                     headers={'Host': host, **(headers or {})})
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs):
                return None
        try:
            return urllib.request.build_opener(NoRedirect).open(req, timeout=5)
        except urllib.error.HTTPError as response:
            return response

    try:
        page = request('/login')
        cookie = page.headers['Set-Cookie']
        assert 'Secure;' in cookie and 'HttpOnly;' in cookie and 'SameSite=Lax' in cookie
        csrf = re.search(r'name="csrf_token" value="([^"]+)"', page.read().decode())[1]
        headers = {'Cookie': cookie.split(';')[0], 'Origin': 'https://' + host}
        data = {'csrf_token': csrf, 'email': 'https@example.test', 'password': 'test password only'}
        # Spoofed forwarded headers must not change the trusted fixed scheme/host.
        bad = request('/login', data, {**headers, 'Origin': 'https://evil.test',
                                      'X-Forwarded-Host': 'evil.test', 'X-Forwarded-Proto': 'https'})
        assert bad.status == 403
        missing = request('/login', {**data, 'csrf_token': ''}, headers)
        assert missing.status == 403
        response = request('/login', data, {**headers, 'X-Forwarded-Proto': 'http'})
        assert response.status == 303
        assert 'Secure;' in response.headers['Set-Cookie']
        authenticated = {'Cookie': response.headers['Set-Cookie'].split(';')[0]}
        assert request('/', headers=authenticated).status == 200
    finally:
        stopped.set()
        thread.join(timeout=3)
        server.close()
