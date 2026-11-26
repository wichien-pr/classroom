#!/usr/bin/env python3
"""Synthetic accounts only. Never reads production env/DB. Resume preserves QA history."""
import argparse
import hashlib
import json
from pathlib import Path
import secrets
import sqlite3
import sys
import time
from werkzeug.serving import make_server
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
import os
import service
p = argparse.ArgumentParser()
p.add_argument('--workspace', required=True)
p.add_argument('--port', type=int, default=0)
p.add_argument('--courses-root', type=Path, default=ROOT/'courses', help='Isolated compiled course tree for UI QA')
a = p.parse_args()
work = Path(a.workspace).resolve()
scratch = Path(os.environ['QA_SCRATCH_ROOT']).resolve()
if work == scratch or not work.is_relative_to(scratch):
    raise SystemExit('QA storage must be a child of QA_SCRATCH_ROOT')
work.mkdir(parents=True, exist_ok=True)
# Never inherit a real transport, reviewer grant, database or upload location.
for key in list(os.environ):
    if key.startswith(('APPWORKS_', 'CTO_REVIEWER_', 'OUTLOOK_')):
        del os.environ[key]
os.environ['APPWORKS_DATABASE'] = str(work/'qa.sqlite3')
os.environ['APPWORKS_PROFILE_UPLOAD_DIR'] = str(work/'photos')
os.environ['APPWORKS_COMMUNITY_UPLOAD_DIR'] = str(work/'uploads')
# Exercise the private service env pipeline, never production configuration.
private_env = work / '.env'
private_env.write_text('CTO_REVIEWER_EMAILS=wichien@appworks.co.th\nCTO_REVIEWER_IDS=\n')
private_env.chmod(0o600)
service.ENV_FILE = private_env
app = service.create_app()
app.config.update({ 'COURSES_ROOT': str(a.courses_root.resolve()), 'COOKIE_SECURE': False, 'PROFILE_UPLOAD_DIR': str(work/'photos'), 'COMMUNITY_UPLOAD_DIR': str(work/'uploads')})
statefile = work/'private-sessions.json'
if statefile.exists():
    tokens = json.loads(statefile.read_text())
else:
    tokens = {str(uid): secrets.token_urlsafe(32) for uid in (1,2,3)}
    statefile.write_text(json.dumps(tokens))
    statefile.chmod(0o600)
with sqlite3.connect(work/'qa.sqlite3') as db:
    for uid in (1,2,3):
        db.execute('INSERT OR IGNORE INTO users(id,name,email,password_hash) VALUES(?,?,?,?)', (uid, f'Synthetic {"CTO" if uid==3 else "learner"} {uid}', 'wichien@appworks.co.th' if uid == 3 else f'cto-qa-{uid}@example.invalid', '!'))
        db.execute('INSERT OR REPLACE INTO sessions VALUES(?,?,?,?)', (hashlib.sha256(tokens[str(uid)].encode()).hexdigest(), uid, secrets.token_urlsafe(24), time.time()+28800))
server = make_server('127.0.0.1', a.port, app, threaded=True)
info = {'url': f'http://127.0.0.1:{server.server_port}', 'workspace': str(work), 'pid': __import__('os').getpid()}
(work/'server.json').write_text(json.dumps(info))
print(json.dumps(info), flush=True)
server.serve_forever()
