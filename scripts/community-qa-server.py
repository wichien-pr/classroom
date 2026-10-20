#!/usr/bin/env python3
"""Community QA only: separate accounts, uploads and courses; resumable for restart proof."""
import argparse,json,shutil,sqlite3,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'appworks'))
from app import create_app
from waitress import serve
from werkzeug.security import generate_password_hash
parser=argparse.ArgumentParser()
parser.add_argument('--resume',action='store_true')
args=parser.parse_args()
info_path=ROOT/'evidence/community-qa-server.json'
if args.resume:
    info=json.loads(info_path.read_text())
else:
    qa=Path(tempfile.mkdtemp(prefix='community-qa-',dir=ROOT/'evidence'))
    course=qa/'courses/scale-lab';course.mkdir(parents=True)
    shutil.copy2(ROOT/'courses/scale-lab/course.json',course/'course.json')
    shutil.copytree(ROOT/'courses/scale-lab/dist',course/'dist')
    shutil.copytree(ROOT/'scripts/fixtures/future-course',qa/'courses/future-course')
    info=dict(database=str(qa/'accounts.sqlite3'),courses_root=str(qa/'courses'),uploads=str(qa/'photos'),url='http://127.0.0.1:8100')
    info_path.write_text(json.dumps(info,indent=2))
app=create_app({'DATABASE':info['database'],'COURSES_ROOT':info['courses_root'],'PROFILE_UPLOAD_DIR':info['uploads'],'COMMUNITY_MODERATOR_IDS':{2}})
if not args.resume:
    with sqlite3.connect(info['database']) as db:
        for name,email in [('QA Community Learner','community-a@example.test'),('QA Community Moderator','community-b@example.test')]:
            db.execute('INSERT INTO users(name,email,password_hash,joined_at) VALUES(?,?,?,?)',(name,email,generate_password_hash('QA-community-password-2026',method='scrypt'),time.time()))
        for i in range(12):
            db.execute('INSERT INTO community_posts(user_id,title,body,category,created,updated,activity) VALUES(?,?,?,?,?,?,?)',(2,f'QA ตัวอย่างการแบ่งปัน {i+1:02}','โพสต์ทดสอบสำหรับ QA เท่านั้น ไม่ใช่เนื้อหาจริง','tips',time.time()-1000+i,time.time()-1000+i,time.time()-1000+i))
print(json.dumps(info),flush=True)
serve(app,host='127.0.0.1',port=8100)
