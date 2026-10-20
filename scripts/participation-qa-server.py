#!/usr/bin/env python3
"""Private Participation QA; never builds into live dist or opens production DB."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'appworks'))
from app import create_app
from waitress import serve

parser = argparse.ArgumentParser()
parser.add_argument('--resume', action='store_true')
parser.add_argument('--port', type=int, default=8110)
parser.add_argument('--info', type=Path, default=ROOT / 'evidence/participation-qa-server.json')
args = parser.parse_args()
info_file = args.info.resolve()
info_file.parent.mkdir(parents=True, exist_ok=True)
if args.resume:
    info = json.loads(info_file.read_text())
else:
    qa = Path(tempfile.mkdtemp(prefix='participation-qa-', dir=ROOT / 'evidence'))
    course = qa / 'courses/scale-lab'
    course.mkdir(parents=True)
    shutil.copy2(ROOT / 'courses/scale-lab/course.json', course / 'course.json')
    subprocess.run(['npm','run','build','--','--base','/courses/scale-lab/','--outDir',str(course / 'dist')],
                   cwd=ROOT / 'courses/scale-lab', check=True,
                   env={**os.environ,'VITE_CLASSROOM_URL':'/','VITE_CLASSROOM_PROGRESS_URL':'/api/courses/scale-lab/progress'})
    info = dict(database=str(qa / 'accounts.sqlite3'), courses_root=str(qa / 'courses'),
                profile_upload_dir=str(qa / 'photos'), community_upload_dir=str(qa / 'community'))
info.update(base=f'http://127.0.0.1:{args.port}', pid=os.getpid())
info_file.write_text(json.dumps(info, indent=2))
print(json.dumps(info), flush=True)
serve(create_app({'DATABASE':info['database'], 'COURSES_ROOT':info['courses_root'],
                  'PROFILE_UPLOAD_DIR':info['profile_upload_dir'], 'COMMUNITY_UPLOAD_DIR':info['community_upload_dir']}),
      host='127.0.0.1', port=args.port)
