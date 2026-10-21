"""Read-only deployment preservation and guest HTTP checks; no private rows output."""
from pathlib import Path
import hashlib,json,sqlite3,urllib.request,urllib.error
root=Path(__file__).resolve().parents[1]
evidence=root/'evidence/lab08'
backup=Path(json.loads((evidence/'deploy-backup.json').read_text())['backup'])
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def tree(p):return {str(f.relative_to(p)):digest(f) for f in p.rglob('*') if f.is_file()}
expected=json.loads((evidence/'isolated/preservation.json').read_text())['integratedHashes']
assert tree(root/'courses/scale-lab/dist')==expected
baseline=json.loads((evidence/'before-hashes.json').read_text())
protected=[p for p in baseline if p.endswith('.pdf') or p=='appworks/.env']
assert all(digest(root/p)==baseline[p] for p in protected)
for name in ['profile-photos','community-uploads']:
    assert tree(root/'appworks/instance'/name)==tree(backup/name)
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):return None
opener=urllib.request.build_opener(NoRedirect)
checks={}
for path in ['/login','/courses/scale-lab/']+['/courses/scale-lab/'+p for p in expected if p.startswith('assets/')]:
    try:
        with opener.open('http://127.0.0.1:8080'+path,timeout=10) as response:status=response.status;location=response.headers.get('Location')
    except urllib.error.HTTPError as error:status=error.code;location=error.headers.get('Location')
    assert status==(200 if path=='/login' else 303)
    if status==303:assert location=='/login'
    checks[path]=status
with sqlite3.connect(f'file:{root}/appworks/instance/classroom.sqlite3?mode=ro',uri=True) as db,sqlite3.connect(f'file:{backup}/classroom.sqlite3?mode=ro',uri=True) as old:
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    assert db.execute('SELECT type,name,sql FROM sqlite_master ORDER BY type,name').fetchall()==old.execute('SELECT type,name,sql FROM sqlite_master ORDER BY type,name').fetchall()
    tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    checked=[]
    for table in tables:
        quoted='"'+table.replace('"','""')+'"'
        previous=old.execute('SELECT * FROM '+quoted).fetchall()
        current=db.execute('SELECT * FROM '+quoted).fetchall()
        if table=='sessions':assert set(previous)<=set(current)
        else:assert sorted(previous,key=repr)==sorted(current,key=repr),table
        checked.append(table)
report={'deployed':True,'url':'http://127.0.0.1:8080/','backup':str(backup),'buildMatchesTestedQA':True,'publishedHashes':expected,'integrity':'ok','schemaUnchanged':True,'tablesVerified':checked,'nonSessionTablesIdentical':True,'previousSessionsRetained':True,'guestChecks':checks,'pdfAndEnvUnchanged':True,'uploadsUnchanged':True}
(evidence/'deployment.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'deployed':True,'integrity':'ok','tablesVerified':len(checked),'buildMatchesTestedQA':True,'guestChecks':checks}))
