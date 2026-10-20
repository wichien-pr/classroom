#!/usr/bin/env python3
"""Isolated composer QA; never writes production data or binds production ports."""
import argparse,json,sqlite3,sys,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'appworks'))
from app import create_app
from waitress import serve
from werkzeug.security import generate_password_hash
from PIL import Image
parser=argparse.ArgumentParser();parser.add_argument('--resume',action='store_true');parser.add_argument('--port',type=int,choices=[8102,8103],default=8102);args=parser.parse_args()
info_path=ROOT/('evidence/inline-editor-qa-server.json' if args.port==8102 else 'evidence/inline-regression-qa-server.json')
if args.resume:
    info=json.loads(info_path.read_text())
else:
    qa=Path(tempfile.mkdtemp(prefix='composer-qa-',dir=ROOT/'evidence'))
    info=dict(database=str(qa/'accounts.sqlite3'),uploads=str(qa/'photos'),community_uploads=str(qa/'community-uploads'),url=f'http://127.0.0.1:{args.port}')
    info_path.write_text(json.dumps(info,indent=2))
app=create_app({'TEMPLATES_AUTO_RELOAD':True,'DATABASE':info['database'],'PROFILE_UPLOAD_DIR':info['uploads'],'COMMUNITY_UPLOAD_DIR':info['community_uploads'],'COMMUNITY_MODERATOR_IDS':{2}})
if not args.resume:
    with sqlite3.connect(info['database']) as db:
        for name,email in [('QA Composer Learner','composer-a@example.test'),('QA Composer Peer','composer-b@example.test')]:
            db.execute('INSERT INTO users(name,email,password_hash,joined_at) VALUES(?,?,?,?)',(name,email,generate_password_hash('QA-composer-password-2026',method='scrypt'),time.time()))
    fixtures=Path(info['database']).parent/'fixtures';fixtures.mkdir()
    image=Image.new('RGB',(320,200),'#f2bd54');image.save(fixtures/'qa-image.png')
    frames=[Image.new('RGB',(100,100),color) for color in ('#ee8844','#4488ee','#44cc88')]
    frames[0].save(fixtures/'qa-own.gif',save_all=True,append_images=frames[1:],duration=200,loop=0)
    (fixtures/'qa-note.txt').write_text('QA fixture only. Not production content.\n')
    (fixtures/'qa-invalid.svg').write_text('<svg onload="alert(1)"></svg>')
print(json.dumps(info),flush=True)
serve(app,host='127.0.0.1',port=args.port)
