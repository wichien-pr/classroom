#!/usr/bin/env python3
"""Isolated compiled Classroom + loopback SMTP sink; never opens production DB."""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT/'appworks'), str(ROOT/'appworks/tests')]
from smtp_capture import Capture
from app import create_app
from waitress import serve

os.umask(0o077)
evidence = ROOT/'evidence/password-reset'
evidence.mkdir(parents=True, exist_ok=True)
qa = Path(tempfile.mkdtemp(prefix='classroom-reset-'))
course = qa/'courses/scale-lab'
course.mkdir(parents=True)
shutil.copy2(ROOT/'courses/scale-lab/course.json', course/'course.json')
subprocess.run(['npm','run','build','--','--base','/courses/scale-lab/','--outDir',str(course/'dist')],
               cwd=ROOT/'courses/scale-lab', check=True,
               env={**os.environ,'VITE_CLASSROOM_URL':'/','VITE_CLASSROOM_PROGRESS_URL':'/api/courses/scale-lab/progress'})

class PrivateMessages(list):
    def append(self, message):
        super().append(message)
        body = message.get_content()
        link = re.search(r'http://127\.0\.0\.1:8118/reset-password#[A-Za-z0-9_-]{43}', body)[0]
        (qa/f'mail-{len(self)}.eml').write_bytes(message.as_bytes())
        # Private local QA artifact. Never printed, served or included in public report.
        (qa/f'mail-{len(self)}.json').write_text(json.dumps({'link':link, 'to':str(message['To'])}))

sink = Capture()
sink.messages = PrivateMessages()
info = {'base':'http://127.0.0.1:8118','pid':os.getpid(),'qa':str(qa),
        'database':str(qa/'accounts.sqlite3'), 'courses_root':str(qa/'courses'),
        'smtp_port':sink.server_address[1]}
(evidence/'server.json').write_text(json.dumps(info, indent=2))
app = create_app({'DATABASE':info['database'], 'COURSES_ROOT':info['courses_root'],
                  'PROFILE_UPLOAD_DIR':str(qa/'photos'), 'COMMUNITY_UPLOAD_DIR':str(qa/'community'),
                  'RESET_ENABLED':True, 'RESET_ALLOW_LOCAL':True, 'RESET_BASE_URL':info['base'],
                  'RESET_SMTP_HOST':'127.0.0.1', 'RESET_SMTP_PORT':info['smtp_port'],
                  'RESET_SMTP_TLS':'none', 'RESET_SMTP_FROM':'classroom@example.test'})
print('Isolated Classroom ready on 8118; loopback SMTP capture active', flush=True)
serve(app, host='127.0.0.1', port=8118)
