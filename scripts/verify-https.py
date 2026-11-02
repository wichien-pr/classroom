"""Real Caddy TLS + Waitress smoke test, disposable project/data only.

Build first: docker build -t classroom:https-verification .
Run: python3 scripts/verify-https.py --allow-isolated-qa
No live environment files, accounts, ports or volumes are reused.
"""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import re
import secrets
import ssl
import subprocess
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-isolated-qa', action='store_true')
    parser.add_argument('--image', default='classroom:https-verification')
    args = parser.parse_args()
    if not args.allow_isolated_qa:
        parser.error('--allow-isolated-qa is required to create disposable test containers')
    project = 'classroom-https-smoke-' + uuid.uuid4().hex[:12]
    volume = project + '-data'
    env = {**os.environ, 'CLASSROOM_DOMAIN': 'localhost', 'CLASSROOM_DATA_VOLUME': volume,
           'CLASSROOM_IMAGE': args.image, 'CLASSROOM_ENV_FILE': str(ROOT / 'docker/runtime.env.example')}

    def run(command, **kwargs):
        return subprocess.run(command, env=env, check=True, capture_output=True, text=True, **kwargs).stdout.strip()

    with tempfile.TemporaryDirectory(prefix=project + '-') as directory:
        folder = Path(directory)
        override = folder / 'qa.yaml'
        override.write_text('services:\n  https:\n    ports: !override\n'
                            '      - "127.0.0.1::80"\n      - "127.0.0.1::443"\n')
        compose = ['docker', 'compose', '--env-file', '/dev/null', '-p', project,
                   '-f', str(ROOT / 'compose.yaml'), '-f', str(ROOT / 'compose.https.yaml'), '-f', str(override)]
        run(['docker', 'volume', 'create', volume])
        try:
            run(compose + ['up', '-d', '--no-build', '--wait', '--wait-timeout', '120'])
            backend = run(compose + ['ps', '-q', 'classroom'])
            proxy = run(compose + ['ps', '-q', 'https'])
            metadata = json.loads(run(['docker', 'inspect', '--format',
                                      '{{json .Mounts}}', backend]))
            assert any(m.get('Name') == volume and m['Destination'] == '/data' for m in metadata)
            assert run(['docker', 'inspect', '--format',
                        '{{index .Config.Labels "com.docker.compose.project"}}', backend]) == project
            assert run(['docker', 'inspect', '--format', '{{json .HostConfig.PortBindings}}', backend]) in ('{}', 'null')
            port = run(compose + ['port', 'https', '443']).rsplit(':', 1)[1]
            http_port = run(compose + ['port', 'https', '80']).rsplit(':', 1)[1]
            origin = 'https://localhost:' + port
            ca = folder / 'root.crt'
            for attempt in range(30):
                try:
                    run(['docker', 'cp', proxy + ':/data/caddy/pki/authorities/local/root.crt', str(ca)])
                    break
                except subprocess.CalledProcessError:
                    time.sleep(0.5)
            context = ssl.create_default_context(cafile=str(ca))
            jar = http.cookiejar.CookieJar()

            class NoRedirect(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, *args, **kwargs):
                    return None

            opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect,
                                                 urllib.request.HTTPSHandler(context=context),
                                                 urllib.request.HTTPCookieProcessor(jar))

            def request(url, data=None, headers=None):
                req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data is not None else None,
                                             headers=headers or {})
                try:
                    return opener.open(req, timeout=10)
                except urllib.error.HTTPError as response:
                    return response

            redirect = request('http://localhost:' + http_port + '/login')
            assert redirect.status == 308 and redirect.headers['Location'].startswith('https://localhost/')
            assert json.loads(request(origin + '/healthz').read()) == {'status': 'ok'}
            # Insert only into the positively identified, unique disposable database.
            password = secrets.token_urlsafe(24)
            seed = """import sqlite3, sys
from werkzeug.security import generate_password_hash
with sqlite3.connect('/data/classroom.sqlite3') as db:
    assert db.execute('SELECT count(*) FROM users').fetchone()[0] == 0
    db.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',
               ('TLS smoke','tls@example.test',generate_password_hash(sys.stdin.read())))
"""
            run(['docker', 'exec', '-i', backend, 'python', '-c', seed], input=password)
            page = request(origin + '/login')
            cookie = page.headers['Set-Cookie']
            assert 'Secure;' in cookie and 'HttpOnly;' in cookie and 'SameSite=Lax' in cookie
            token = re.search(r'name="csrf_token" value="([^"]+)"', page.read().decode())[1]
            data = {'csrf_token': token, 'email': 'tls@example.test', 'password': password}
            assert request(origin + '/login', data, {'Origin': 'https://evil.test'}).status == 403
            assert request(origin + '/login', {**data, 'csrf_token': ''}, {'Origin': origin}).status == 403
            login = request(origin + '/login', data, {'Origin': origin, 'X-Forwarded-Proto': 'http',
                                                     'X-Forwarded-Host': 'evil.test'})
            assert login.status == 303 and login.headers['Location'] == '/'
            home = request(origin + '/')
            assert home.status == 200
            text = home.read().decode()
            assert '/courses/scale-lab/' in text
            token = re.search(r'name="csrf_token" value="([^"]+)"', text)[1]
            assert request(origin + '/logout', {'csrf_token': token}, {'Origin': origin}).status == 303
            assert request(origin + '/').status == 303
            print('PASS: verified TLS certificate, HTTP redirect, health, secure cookie, login, authenticated catalog, logout, CSRF rejection, forwarded-header spoof rejection, unpublished backend')
        finally:
            run(compose + ['down', '--volumes'])
            run(['docker', 'volume', 'rm', volume])
            print('Disposable HTTPS project and volumes removed; live deployment untouched.')


if __name__ == '__main__':
    main()
