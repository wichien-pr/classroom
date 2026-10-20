#!/usr/bin/env python3
"""Isolated browser QA: never opens the real accounts database or adds live courses."""
import argparse
import json
from pathlib import Path
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
from app import create_app
from waitress import serve

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--port', type=int, default=8093)
args = parser.parse_args()
qa = Path(tempfile.mkdtemp(prefix='progress-qa-', dir=ROOT / 'evidence'))
course = qa / 'courses' / 'scale-lab'
course.mkdir(parents=True)
shutil.copy2(ROOT / 'courses/scale-lab/course.json', course / 'course.json')
shutil.copytree(ROOT / 'courses/scale-lab/dist', course / 'dist')
shutil.copytree(ROOT / 'scripts/fixtures/future-course', qa / 'courses/future-course')
database = qa / 'accounts.sqlite3'
info = dict(database=str(database), courses_root=str(qa / 'courses'), base=f'http://127.0.0.1:{args.port}')
(ROOT / 'evidence/progress-qa-server.json').write_text(json.dumps(info, indent=2))
print(json.dumps(info), flush=True)
serve(create_app({'DATABASE': str(database), 'COURSES_ROOT': str(qa / 'courses')}), host='127.0.0.1', port=args.port)
