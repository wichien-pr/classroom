#!/usr/bin/env python3
"""QA ONLY: real local HTTP Graph double, private DB and isolated Vite build."""
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from urllib.parse import parse_qs
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'appworks'))
from app import create_app
from waitress import serve

os.umask(0o077)
evidence = ROOT/'evidence/password-reset-graph'
evidence.mkdir(parents=True, exist_ok=True)
qa = Path(tempfile.mkdtemp(prefix='classroom-graph-'))
course = qa/'courses/scale-lab'
course.mkdir(parents=True)
shutil.copy2(ROOT/'courses/scale-lab/course.json', course/'course.json')
subprocess.run(['npm','run','build','--','--base','/courses/scale-lab/','--outDir',str(course/'dist')],
               cwd=ROOT/'courses/scale-lab', check=True,
               env={**os.environ,'VITE_CLASSROOM_URL':'/','VITE_CLASSROOM_PROGRESS_URL':'/api/courses/scale-lab/progress'})
client_id = '11111111-1111-4111-8111-111111111111'
tenant_id = '22222222-2222-4222-8222-222222222222'
counts = {'tokenRequests':0, 'sendMailRequests':0, 'externalNetwork':False}
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    def do_POST(self):
        body = self.rfile.read(int(self.headers['Content-Length']))
        if self.path == '/' + tenant_id + '/oauth2/v2.0/token':
            assert self.headers['Host'] == 'login.microsoftonline.com'
            assert parse_qs(body.decode()) == {'client_id':[client_id], 'client_secret':['qa-only-secret'],
                'grant_type':['client_credentials'], 'scope':['https://graph.microsoft.com/.default']}
            counts['tokenRequests'] += 1
            self.send_response(200)
            data = b'{"access_token":"qa-only-access-token","token_type":"Bearer"}'
        else:
            assert self.path == '/v1.0/users/sender%40example.test/sendMail'
            assert self.headers['Host'] == 'graph.microsoft.com'
            assert self.headers['Authorization'] == 'Bearer qa-only-access-token'
            payload = json.loads(body)
            assert payload['saveToSentItems'] is False
            assert payload['message']['body']['contentType'] == 'Text'
            recipients = payload['message']['toRecipients']
            assert recipients == [{'emailAddress':{'address':'reset-browser@example.test'}}]
            link = re.search(r'http://127\.0\.0\.1:8119/reset-password#[A-Za-z0-9_-]{43}', payload['message']['body']['content'])[0]
            counts['sendMailRequests'] += 1
            (qa/f"mail-{counts['sendMailRequests']}.json").write_text(json.dumps({'to':recipients[0]['emailAddress']['address'], 'link':link}))
            self.send_response(202)
            data = b''
        (evidence/'graph-boundary.json').write_text(json.dumps(counts, indent=2))
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)

sink = ThreadingHTTPServer(('127.0.0.1',0), Handler)
threading.Thread(target=sink.serve_forever, daemon=True).start()
# Only this QA process replaces the TLS boundary; runtime endpoints remain fixed.
class LocalConnection(http.client.HTTPConnection):
    def __init__(self, host, timeout):
        assert host in ('login.microsoftonline.com','graph.microsoft.com')
        self.authority = host
        super().__init__('127.0.0.1',sink.server_port,timeout=timeout)
    def request(self, method, path, body, headers):
        return super().request(method,path,body,{**headers,'Host':self.authority})
http.client.HTTPSConnection = LocalConnection
info = {'base':'http://127.0.0.1:8119','pid':os.getpid(),'qa':str(qa),
        'database':str(qa/'accounts.sqlite3'), 'courses_root':str(qa/'courses'), 'graph_double_port':sink.server_port}
(evidence/'server.json').write_text(json.dumps(info, indent=2))
app = create_app({'DATABASE':info['database'], 'COURSES_ROOT':info['courses_root'],
                  'PROFILE_UPLOAD_DIR':str(qa/'photos'), 'COMMUNITY_UPLOAD_DIR':str(qa/'community'),
                  'RESET_ENABLED':True, 'RESET_ALLOW_LOCAL':True, 'RESET_BASE_URL':info['base'],
                  'RESET_TRANSPORT':'graph', 'RESET_GRAPH_CLIENT_ID':client_id, 'RESET_GRAPH_TENANT_ID':tenant_id,
                  'RESET_GRAPH_CLIENT_SECRET':'qa-only-secret', 'RESET_GRAPH_SENDER':'sender@example.test'})
print('Isolated Classroom on 8119; local Graph HTTP double (not provider delivery)', flush=True)
serve(app, host='127.0.0.1', port=8119)
