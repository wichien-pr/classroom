"""Private presence QA fixtures. Never loads .env or touches production DB."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'appworks'))
from app import create_app
from werkzeug.security import generate_password_hash
from waitress import serve
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8134)
parser.add_argument('--resume', action='store_true')
args = parser.parse_args()
evidence = ROOT/'evidence/presence'
evidence.mkdir(parents=True, exist_ok=True)
info_path = evidence/'server.json'
if args.resume:
    private = Path(json.loads(info_path.read_text())['private'])
else:
    private = Path(tempfile.mkdtemp(prefix='classroom-presence-'))
    os.chmod(private, 0o700)
    course = private/'courses/scale-lab'
    course.mkdir(parents=True)
    for name in ('course.json', 'assessment.json'):
        shutil.copy2(ROOT/'courses/scale-lab'/name, course/name)
    shutil.copytree(ROOT/'courses/scale-lab/dist', course/'dist')
app = create_app({'DATABASE': str(private/'qa.sqlite3'), 'COURSES_ROOT': str(private/'courses'),
                  'PROFILE_UPLOAD_DIR': str(private/'profile-photos'),
                  'COMMUNITY_UPLOAD_DIR': str(private/'community-uploads')})
if not args.resume:
    photos = private/'profile-photos'; photos.mkdir()
    photo = 'a'*48+'.jpg'
    Image.new('RGB', (128,128), '#36976e').save(photos/photo)
    password = generate_password_hash('QA-presence-only-2026')
    with sqlite3.connect(private/'qa.sqlite3') as db:
        for uid in range(1,24):
            name = ['QA มาลี', 'QA สมชาย', 'QA <script>ปลอดภัย</script> ชื่อยาวมาก'*2][min(uid-1,2)] if uid <= 3 else f'QA สมาชิก {uid}'
            db.execute('INSERT INTO users(id,name,email,password_hash,photo_ref) VALUES(?,?,?,?,?)',
                       (uid, name, f'presence-{uid}@example.test', password, photo if uid == 1 else None))
info = {'url': f'http://127.0.0.1:{args.port}', 'pid': os.getpid(), 'private': str(private),
        'database': str(private/'qa.sqlite3'), 'fixture_users': 23, 'production_untouched': True}
info_path.write_text(json.dumps(info, indent=2))
print(json.dumps(info), flush=True)
serve(app, host='127.0.0.1', port=args.port)
