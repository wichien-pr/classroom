"""Isolated activity QA on 8099; never opens the live DB or uploads."""
import json
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile
from waitress import serve

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'appworks'))
from app import create_app

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--reuse', type=Path, help='Reuse only a previous isolated activity QA directory')
args = parser.parse_args()
if args.reuse:
    qa = args.reuse.resolve()
    if qa.parent != (ROOT/'evidence').resolve() or not qa.name.startswith('activity-qa-') or not (qa/'accounts.sqlite3').is_file():
        parser.error('Not an existing isolated activity QA directory')
else:
    qa = Path(tempfile.mkdtemp(prefix='activity-qa-', dir=ROOT/'evidence'))
    course = qa/'courses/scale-lab'
    course.mkdir(parents=True)
    shutil.copy2(ROOT/'courses/scale-lab/course.json', course/'course.json')
    shutil.copytree(ROOT/'courses/scale-lab/dist', course/'dist')
    shutil.copytree(ROOT/'scripts/fixtures/future-course', qa/'courses/future-course')
config = dict(DATABASE=str(qa/'accounts.sqlite3'), PROFILE_UPLOAD_DIR=str(qa/'photos'), COURSES_ROOT=str(qa/'courses'), TEMPLATES_AUTO_RELOAD=True)
app = create_app(config)
with sqlite3.connect(config['DATABASE']) as db:
    db.execute("INSERT OR IGNORE INTO users(id,name,email,password_hash) VALUES(1,'QA Legacy Empty','legacy-qa@example.test','no-login')")
info = {**config, 'base':'http://127.0.0.1:8099'}
(ROOT/'evidence/activity-qa-server.json').write_text(json.dumps(info,indent=2))
print(json.dumps(info),flush=True)
serve(app, host='127.0.0.1',port=8099)
