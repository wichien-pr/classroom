"""Isolated achievement QA. No writes to production SQLite or courses."""
import json
import sys
import tempfile
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'appworks'))
from app import create_app
from werkzeug.security import generate_password_hash
from waitress import serve
import sqlite3
qa=Path(tempfile.mkdtemp(prefix='leaderboards-qa-',dir=ROOT/'evidence'))
root=qa/'courses'; root.mkdir()
shutil.copytree(ROOT/'courses/scale-lab/dist',root/'scale-lab/dist')
for f in ('course.json','assessment.json'):
    shutil.copy2(ROOT/'courses/scale-lab'/f,root/'scale-lab'/f)
shutil.copytree(ROOT/'scripts/fixtures/future-course',root/'future-course')
for i in range(20):
    p=root/f'qa-{i}'; (p/'dist').mkdir(parents=True)
    (p/'dist/index.html').write_text('QA ONLY')
    (p/'course.json').write_text(json.dumps(dict(id=p.name,title='QA fixture '+str(i),subtitle='QA ONLY',enabled=True,order=i+100,delivery='static',build_dir='dist',entry='index.html',lessons=['intro'])))
    (p/'assessment.json').write_text(json.dumps(dict(version=1,questions=[dict(id='q1',lesson_id='intro',prompt='QA fixture: เลือกคำตอบที่ถูกต้อง',options=[dict(id='a',text='คำตอบถูกต้อง'),dict(id='b',text='คำตอบไม่ถูกต้อง')],answer='a')])))
dbpath=qa/'accounts.sqlite3'
app=create_app(dict(DATABASE=str(dbpath),COURSES_ROOT=str(root)))
password='QA-only-password-2026'
with sqlite3.connect(dbpath) as db:
    for name,count in [('QA Zero',0),('QA Eligible',20),('QA Level2',1),('QA Level3',3),('QA Level4',5),('QA Level5',7),('QA Level6',9),('QA Level7',11),('QA Level8',13)]:
        uid=db.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',(name,name.lower().replace(' ','')+'@example.test',generate_password_hash(password))).lastrowid
        for i in range(count):db.execute('INSERT INTO lesson_progress VALUES(?,?,?,0)',(uid,f'qa-{i}','intro'))
info=dict(database=str(dbpath),courses_root=str(root),base='http://127.0.0.1:8095',password=password)
(ROOT/'evidence/leaderboards-qa-server.json').write_text(json.dumps(info,indent=2))
print(json.dumps(info),flush=True)
serve(app,host='127.0.0.1',port=8095)
