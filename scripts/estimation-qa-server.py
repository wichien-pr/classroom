#!/usr/bin/env python3
"""QA ONLY. Isolated registration DB/build and real loopback Graph HTTP double."""
import argparse
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
from urllib.parse import parse_qs
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'appworks'))
from app import create_app
from waitress import serve
from werkzeug.security import generate_password_hash
parser=argparse.ArgumentParser()
parser.add_argument('--resume',action='store_true')
parser.add_argument('--port',type=int,default=8142)
parser.add_argument('--evidence',default='evidence/estimation')
args=parser.parse_args()
os.umask(0o077)
evidence=ROOT/args.evidence
evidence.mkdir(parents=True,exist_ok=True)
if args.resume:
    info=json.loads((evidence/'server.json').read_text())
    qa=Path(info['qa'])
else:
    qa=Path(tempfile.mkdtemp(prefix='classroom-estimation-'))
    for course_id in ('scale-lab','back-of-the-envelope-estimation'):
        source=ROOT/'courses'/course_id
        course=qa/'courses'/course_id;course.mkdir(parents=True)
        for name in ('course.json','assessment.json'):
            shutil.copy2(source/name,course/name)
        if course_id=='scale-lab':
            shutil.copytree(source/'dist',course/'dist')
        else:
            subprocess.run(['npm','run','build','--','--base',f'/courses/{course_id}/','--outDir',str(course/'dist')],
                cwd=source,check=True,env={**os.environ,'VITE_CLASSROOM_URL':'/',
                'VITE_CLASSROOM_PROGRESS_URL':f'/api/courses/{course_id}/progress'})
client_id='11111111-1111-4111-8111-111111111111'
tenant_id='22222222-2222-4222-8222-222222222222'
counts=json.loads((evidence/'graph-boundary.json').read_text()) if args.resume else {'tokenRequests':0,'sendMailRequests':0,'rejectedRequests':0,'externalNetwork':False}
lock=threading.Lock()
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def do_POST(self):
        body=self.rfile.read(int(self.headers['Content-Length']))
        if self.path=='/'+tenant_id+'/oauth2/v2.0/token':
            assert self.headers['Host']=='login.microsoftonline.com'
            assert parse_qs(body.decode())=={'client_id':[client_id],'client_secret':['qa-only-secret'],
                'grant_type':['client_credentials'],'scope':['https://graph.microsoft.com/.default']}
            with lock: counts['tokenRequests']+=1
            status=200;data=b'{"access_token":"qa-only-access-token"}'
        else:
            assert self.path=='/v1.0/users/sender%40example.test/sendMail'
            assert self.headers['Host']=='graph.microsoft.com'
            assert self.headers['Authorization']=='Bearer qa-only-access-token'
            payload=json.loads(body)
            assert payload['saveToSentItems'] is False
            message=payload['message'];assert message['body']['contentType']=='Text'
            recipients=message['toRecipients'];assert len(recipients)==1
            recipient=recipients[0]['emailAddress']['address'];assert recipient.endswith('@example.test')
            content=message['body']['content'];assert 'password-123' not in content
            code=re.search(r'(?<!\d)\d{6}(?!\d)',content)
            link=re.search(r'http://127\.0\.0\.1:'+str(args.port)+r'/reset-password#[A-Za-z0-9_-]{43}',content)
            assert code or link
            if (qa/'reject-mail').exists():
                with lock: counts['rejectedRequests']+=1
                status=503;data=b''
            else:
                with lock:
                    counts['sendMailRequests']+=1
                    (qa/f"mail-{counts['sendMailRequests']}.json").write_text(json.dumps({'to':recipient,'code':code[0] if code else None,'link':link[0] if link else None}))
                status=202;data=b''
        with lock:(evidence/'graph-boundary.json').write_text(json.dumps(counts,indent=2))
        self.send_response(status);self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
sink=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=sink.serve_forever,daemon=True).start()
class LocalConnection(http.client.HTTPConnection):
    def __init__(self,host,timeout):
        assert host in ('login.microsoftonline.com','graph.microsoft.com')
        self.authority=host
        super().__init__('127.0.0.1',sink.server_port,timeout=timeout)
    def request(self,method,path,body,headers):
        return super().request(method,path,body,{**headers,'Host':self.authority})
http.client.HTTPSConnection=LocalConnection
info={'base':f'http://127.0.0.1:{args.port}','pid':os.getpid(),'qa':str(qa),'database':str(qa/'accounts.sqlite3'),
      'courses_root':str(qa/'courses'),'graph_double_port':sink.server_port}
(evidence/'server.json').write_text(json.dumps(info,indent=2))
app=create_app({'DATABASE':info['database'],'COURSES_ROOT':info['courses_root'],
    'PROFILE_UPLOAD_DIR':str(qa/'photos'),'COMMUNITY_UPLOAD_DIR':str(qa/'community'),
    'RESET_ENABLED':True,'RESET_ALLOW_LOCAL':True,'RESET_BASE_URL':info['base'],'RESET_TRANSPORT':'graph',
    'RESET_GRAPH_CLIENT_ID':client_id,'RESET_GRAPH_TENANT_ID':tenant_id,'RESET_GRAPH_CLIENT_SECRET':'qa-only-secret',
    'RESET_GRAPH_SENDER':'sender@example.test'})
print(f'Isolated registration QA on {args.port}; no provider traffic',flush=True)
serve(app,host='127.0.0.1',port=args.port,threads=8)
