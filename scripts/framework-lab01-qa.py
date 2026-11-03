"""Disposable LAB01 QA only: synthetic legacy members, no email transport."""
import json, sys, tempfile, sqlite3, os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'appworks'))
from app import create_app
from werkzeug.security import generate_password_hash
from werkzeug.serving import make_server
evidence=ROOT/'evidence/framework-lab01'
if '--resume' in sys.argv:
 qa=Path(json.loads((evidence/'server.json').read_text())['database']).parent
else:
 scratch=Path.home()/'.hermes/cache/scratch';scratch.mkdir(parents=True,exist_ok=True)
 qa=Path(tempfile.mkdtemp(prefix='framework-lab01-',dir=scratch))
 with sqlite3.connect(qa/'qa.sqlite3') as db:
  db.execute('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL)')
  for i in [1,2]:db.execute('INSERT INTO users VALUES(?,?,?,?)',(i,f'Framework QA {i}',f'framework{i}@example.test',generate_password_hash('disposable-qa-password')))
app=create_app({'DATABASE':str(qa/'qa.sqlite3'),'COURSES_ROOT':str(ROOT/'courses'),'PROFILE_UPLOAD_DIR':str(qa/'photos'),'COMMUNITY_UPLOAD_DIR':str(qa/'uploads'),'RESET_ENABLED':False})
server=make_server('127.0.0.1',0,app,threaded=True)
info={'url':f'http://127.0.0.1:{server.server_port}','pid':os.getpid(),'database':str(qa/'qa.sqlite3')}
evidence=ROOT/'evidence/framework-lab01';evidence.mkdir(parents=True,exist_ok=True)
(evidence/'server.json').write_text(json.dumps(info,indent=2))
print(json.dumps(info),flush=True)
server.serve_forever()
