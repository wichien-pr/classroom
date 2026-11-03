"""Disposable synthetic-account server. Never loads .env or production data."""
import json
from pathlib import Path
import sqlite3
import sys
from werkzeug.security import generate_password_hash
from werkzeug.serving import make_server
ROOT = Path('/app')
sys.path.insert(0, str(ROOT / 'appworks'))
from app import create_app
qa = Path(sys.argv[1]).resolve()
assert qa.name.startswith('framework-lab02-qa-')
app = create_app({'DATABASE': str(qa / 'accounts.sqlite3'), 'COURSES_ROOT': '/app/courses',
                  'PROFILE_UPLOAD_DIR': str(qa / 'photos'), 'COMMUNITY_UPLOAD_DIR': str(qa / 'uploads'),
                  'RESET_ENABLED': False, 'TESTING': True})
with sqlite3.connect(app.config['DATABASE']) as db:
    if not db.execute('SELECT count(*) FROM users').fetchone()[0]:
        for i in (1, 2):
            db.execute('INSERT INTO users(name,email,password_hash,username) VALUES(?,?,?,?)',
                       (f'LAB02 QA {i}', f'lab02-{i}@example.test', generate_password_hash('disposable-qa-password'), f'lab02-qa-{i}'))
server = make_server('0.0.0.0', 8080, app)
print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}'}), flush=True)
server.serve_forever()