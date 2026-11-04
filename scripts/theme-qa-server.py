"""Disposable loopback theme QA. No .env, real accounts, or course builds."""
import json
import os
from pathlib import Path
import sqlite3
import signal
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
from app import create_app
from werkzeug.security import generate_password_hash
from werkzeug.serving import make_server

signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))

with tempfile.TemporaryDirectory(prefix='classroom-theme-') as directory:
    private = Path(directory)
    os.chmod(private, 0o700)
    app = create_app({'DATABASE': str(private / 'qa.sqlite3'),
                      'PROFILE_UPLOAD_DIR': str(private / 'photos'),
                      'COMMUNITY_UPLOAD_DIR': str(private / 'uploads'),
                      'COURSES_ROOT': os.environ.get('QA_COURSES_ROOT', str(ROOT / 'courses')),
                      'RESET_ENABLED': False})
    with sqlite3.connect(private / 'qa.sqlite3') as db:
        db.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',
                   ('นักเรียน QA', 'theme@example.test', generate_password_hash('QA-theme-only-2026')))
    server = make_server('127.0.0.1', 0, app, threaded=True)
    print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}', 'pid': os.getpid()}), flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()
