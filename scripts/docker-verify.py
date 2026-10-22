#!/usr/bin/env python3
"""Destructive QA ONLY in classroom-container-smoke-data on port 8083.
Run with appworks/.venv/bin/python scripts/docker-verify.py --allow-destructive-qa
after starting the isolated classroom-container-smoke project.
No signup bypass is installed; an isolated legacy-account fixture tests login.
Credentials and cookies exist only in memory and never enter reports.
"""
import argparse
import hashlib
import http.cookiejar
import io
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import urllib.request
import urllib.error
import urllib.parse
import uuid
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PROJECT = 'classroom-container-smoke'
VOLUME = 'classroom-container-smoke-data'
COMPOSE = ['docker', 'compose', '-p', PROJECT, '-f', str(ROOT/'compose.yaml')]
BASE = 'http://127.0.0.1:8083'
# Inspect selected fields only: never expose runtime/mail environment secrets.
TARGET_FORMAT = ('{"mounts":{{json .Mounts}},'
                 '"project":{{json (index .Config.Labels "com.docker.compose.project")}},'
                 '"service":{{json (index .Config.Labels "com.docker.compose.service")}},'
                 '"ports":{{json .NetworkSettings.Ports}}}')


def preflight():
    container = command(COMPOSE + ['ps', '-q', 'classroom'])
    if not re.fullmatch(r'[0-9a-f]+', container):
        raise RuntimeError('Unsafe QA target: expected exactly one container')
    try:
        metadata = json.loads(command(['docker', 'inspect', '--format', TARGET_FORMAT, container]))
        # Compose also supplies scratch tmpfs; reject every other extra mount.
        mounts = [mount for mount in metadata['mounts']
                  if not (mount['Type'] == 'tmpfs' and mount['Destination'] == '/tmp')]
        safe = (metadata['project'] == PROJECT and metadata['service'] == 'classroom'
                and len(mounts) == 1 and mounts[0]['Destination'] == '/data'
                and mounts[0]['Type'] == 'volume' and mounts[0]['Name'] == VOLUME
                and mounts[0]['RW'] is True
                and metadata['ports'] == {'8080/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '8083'}]})
    except (ValueError, KeyError, TypeError, IndexError):
        safe = False
    if not safe:
        raise RuntimeError('Unsafe QA target: volume, labels or port mismatch')
    return container
checks = []


def command(args, **kwargs):
    # Pin all safety-sensitive interpolation even when the operator's shell or
    # .env selects the real account deployment. Never reuse its mail settings.
    env = dict(os.environ, CLASSROOM_DATA_VOLUME=VOLUME, CLASSROOM_PORT='8083',
               CLASSROOM_BIND_IP='127.0.0.1',
               CLASSROOM_ENV_FILE=str(ROOT/'docker/runtime.env.example'))
    return subprocess.run(args, check=True, capture_output=True, text=True, cwd=ROOT, env=env, **kwargs).stdout.strip()


def recreate():
    preflight()
    command(COMPOSE + ['up', '-d', '--no-build', '--force-recreate', '--wait', '--wait-timeout', '180'])
    return preflight()


def inside(code, data=''):
    return command(COMPOSE + ['exec', '-T', 'classroom', 'python', '-c', code], input=data)


def check(name, condition):
    assert condition, name
    checks.append(name)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), NoRedirect())


def request(path, data=None, headers=None):
    try:
        response = client.open(urllib.request.Request(BASE+path, data=data, headers=headers or {}), timeout=15)
    except urllib.error.HTTPError as error:
        response = error
    return response.status, response.read(), response.headers


def api(path, data=None, csrf=None):
    headers = {'Content-Type': 'application/json', 'Origin': BASE}
    if csrf:
        headers['X-CSRF-Token'] = csrf
    status, body, _ = request(path, None if data is None else json.dumps(data).encode(), headers)
    return status, json.loads(body)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-destructive-qa", action="store_true", required=True)
    parser.parse_args(argv)
    container_before = preflight()
    check('nonroot', inside('import os; print(os.getuid())') == '10001')
    check('mail_disabled_no_host_env', inside("import os; from pathlib import Path; assert os.environ['APPWORKS_RESET_ENABLED']=='0'; assert not Path('/app/appworks/.env').exists(); print('ok')") == 'ok')
    count_code = "import sqlite3; print(sqlite3.connect('/data/classroom.sqlite3').execute('SELECT count(*) FROM sessions').fetchone()[0])"
    before = inside(count_code)
    for _ in range(10):
        status, body, headers = request('/healthz')
        assert status == 200 and json.loads(body) == {'status': 'ok'} and 'Set-Cookie' not in headers
    check('ten_health_probes_no_new_sessions', inside(count_code) == before)
    for path, expected in [('/',303),('/courses/scale-lab/',303),('/api/presence',401),('/platform/presence.js',401),('/.env',404),('/instance/classroom.sqlite3',404)]:
        check('guest:'+path, request(path)[0] == expected)
    password = secrets.token_urlsafe(30)
    # Refuse nonempty databases; never point this fixture at production.
    inside("import sys,json,sqlite3; from werkzeug.security import generate_password_hash; d=sqlite3.connect('/data/classroom.sqlite3'); assert d.execute('SELECT count(*) FROM users').fetchone()[0]==0, 'QA requires empty users'; p=json.load(sys.stdin); d.execute('INSERT INTO users(name,email,password_hash,username) VALUES(?,?,?,?)',('Container QA','docker-qa@example.invalid',generate_password_hash(p),'docker-qa')); d.commit()", json.dumps(password))
    status, body, _ = request('/login')
    match = re.search(rb'name="csrf_token" value="([^"]+)"', body)
    assert match is not None, 'Login form CSRF missing'
    csrf = match[1].decode()
    status, _, _ = request('/login', urllib.parse.urlencode({'csrf_token':csrf,'email':'docker-qa@example.invalid','password':password}).encode(), {'Origin':BASE})
    check('real_http_login', status == 303)
    password = None
    status, html, _ = request('/courses/scale-lab/')
    check('authenticated_course', status == 200)
    check('presence_injected_into_course', b'/platform/presence.js' in html)
    assets = set(re.findall(rb'(?:src|href)="(/courses/scale-lab/[^" ]+\.(?:js|css))"', html))
    check('compiled_js_css_discovered', len(assets) >= 2)
    for asset in assets:
        check('asset:'+asset.decode(), request(asset.decode())[0] == 200)
    for path, expected in [('/courses/scale-lab/assessment.json',404),('/courses/scale-lab/src/main.js',404),('/courses/scale-lab/assets/missing.js',404),('/courses/scale-lab/deep/route',200),('/platform/presence.js',200)]:
        check('authenticated:'+path, request(path)[0] == expected)
    status, presence = api('/api/presence')
    csrf = presence['csrf_token']
    status, presence = api('/api/presence', {}, csrf)
    check('presence_authenticated_heartbeat', status == 200 and presence['total'] == 1)
    check('csrf_rejection', request('/api/presence', b'{}', {'Content-Type':'application/json'})[0] == 403)
    endpoint = '/api/courses/scale-lab/progress'
    status, progress = api(endpoint, {'lesson_id':'flow','manual':True}, csrf)
    check('persist_manual_progress', status == 200 and progress['criteria']['flow']['manual'])
    for sim, action in [('flow','step'),('check-your-thinking','quiz-answer-a')]:
        status, award = api('/api/courses/scale-lab/participation', {'event_id':str(uuid.uuid4()),'lesson_id':'flow','simulation_id':sim,'action':action}, csrf)
        check('participation:'+sim, status == 200)
    check('qualified_lesson', 'flow' in api(endpoint)[1]['completed'])
    image = io.BytesIO()
    Image.new('RGB',(64,64),(20,120,180)).save(image,format='PNG')
    boundary = 'docker-'+secrets.token_hex(12)
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="csrf_token"\r\n\r\n{csrf}\r\n--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="qa.png"\r\nContent-Type: image/png\r\n\r\n'.encode()+image.getvalue()+f'\r\n--{boundary}--\r\n'.encode())
    check('real_http_photo_upload', request('/account/profile',body,{'Content-Type':'multipart/form-data; boundary='+boundary,'Origin':BASE})[0] == 303)
    status, photo, _ = request('/account/photos/1')
    check('private_photo_read',status == 200)
    photo_hash = hashlib.sha256(photo).hexdigest()
    # Community storage marker verifies the second private upload directory too.
    inside("from pathlib import Path; Path('/data/community-uploads/qa-persistence.txt').write_text('isolated persistence fixture')")
    container_after = recreate()
    check('container_recreated', container_after != container_before)
    check('session_and_qualification_survive', 'flow' in api(endpoint)[1]['completed'])
    check('photo_survives', hashlib.sha256(request('/account/photos/1')[1]).hexdigest() == photo_hash)
    check('community_upload_survives', inside("from pathlib import Path; print(Path('/data/community-uploads/qa-persistence.txt').read_text())") == 'isolated persistence fixture')
    check('database_integrity',inside("import sqlite3; print(sqlite3.connect('/data/classroom.sqlite3').execute('PRAGMA integrity_check').fetchone()[0])") == 'ok')
    metadata = json.loads(command(['docker','inspect','--format','{{json .State.Health}}',container_after]))
    check('container_healthy',metadata['Status'] == 'healthy')
    check('logout',request('/logout',urllib.parse.urlencode({'csrf_token':csrf}).encode(),{'Origin':BASE})[0] == 303)
    check('private_photo_guest_protected',request('/account/photos/1')[0] == 303)
    report = {'checks':checks,'passed':len(checks),'url':BASE,'image_id':command(['docker','inspect','--format','{{.Image}}',container_after]),'container_id':container_after,'health':metadata['Status'],'photo_sha256':photo_hash,'limitations':['API/HTTP integration, not browser rendering','Isolated legacy account fixture; no real mail, no OTP bypass installed','community upload persistence marker, not a composer upload']}
    (ROOT/'evidence/docker/integration.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))


if __name__ == "__main__":
    main()
