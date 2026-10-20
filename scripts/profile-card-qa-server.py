"""Profile card QA: isolated SQLite, uploads and synthetic level fixtures on 8097."""
import argparse
import json
from pathlib import Path
import sys
import tempfile
import sqlite3
import time
from PIL import Image, ImageDraw
from waitress import serve

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'appworks'))
from app import create_app

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8097)
args = parser.parse_args()

qa = Path(tempfile.mkdtemp(prefix='profile-card-qa-', dir=ROOT/'evidence'))
courses = qa/'courses'
for i in range(13):
    path = courses/f'qa-{i}'
    (path/'dist').mkdir(parents=True)
    (path/'dist/index.html').write_text('Synthetic QA course only')
    (path/'course.json').write_text(json.dumps(dict(id=path.name,title=f'QA {i}',subtitle='QA ONLY',enabled=True,order=i,delivery='static',build_dir='dist',entry='index.html',lessons=['intro'])))
app = create_app({'DATABASE':str(qa/'accounts.sqlite3'), 'PROFILE_UPLOAD_DIR':str(qa/'photos'), 'COURSES_ROOT':str(courses)})
with sqlite3.connect(app.config['DATABASE']) as db:
    for uid, count in [(1,2),(2,13),(3,13)]:
        db.execute('INSERT INTO users(id,name,email,password_hash,last_active_at) VALUES(?,?,?,?,?)', (uid, f'QA Legacy Level {uid}', f'fixture-{uid}@example.test', 'no-login', time.time()-840))
        for i in range(count):
            db.execute('INSERT INTO lesson_progress VALUES(?,?,?,?)',(uid,f'qa-{i}','intro',time.time()))
    db.execute('INSERT INTO level_achievements VALUES(?,?,?)',(3,'synthetic-qa-award',time.time()))
image=Image.new('RGB',(400,400),'#1d4ed8'); draw=ImageDraw.Draw(image)
draw.rounded_rectangle((70,60,330,320),40,fill='#fbbf24')
draw.ellipse((115,120,155,160),fill='#172554'); draw.ellipse((245,120,285,160),fill='#172554')
draw.rectangle((130,210,270,235),fill='#172554');draw.text((150,350),'QA SYNTHETIC',fill='white')
image.save(qa/'synthetic.png')
info=dict(database=app.config['DATABASE'],uploads=app.config['PROFILE_UPLOAD_DIR'],courses_root=str(courses),fixture=str(qa/'synthetic.png'),url=f'http://127.0.0.1:{args.port}')
(ROOT/'evidence/profile-card-qa-server.json').write_text(json.dumps(info,indent=2))
print(json.dumps(info),flush=True)
serve(app,host='127.0.0.1',port=args.port)
