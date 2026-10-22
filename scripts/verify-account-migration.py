"""Read-only private comparison; output only sanitized migration evidence."""
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
from contextlib import closing

ROOT=Path(__file__).resolve().parents[1]
PRIVATE=ROOT/'backups/account-only-20261022'
CONTAINER='classroom-docker-qa-classroom-1'
FIELDS='id,name,email,password_hash,username,bio,joined_at,last_active_at,email_verified_at'

def run(args):
    return subprocess.run(args,check=True,capture_output=True,text=True).stdout

def inspect():
    data=json.loads(run(['docker','inspect',CONTAINER]))[0]
    return {'env_digest':hashlib.sha256(json.dumps(sorted(data['Config']['Env'])).encode()).hexdigest(),'image':data['Image'],'mounts':[(m['Name'],m['Destination']) for m in data['Mounts']], 'health':data['State'].get('Health',{}).get('Status')}

def qa_hash():
    return run(['docker','run','--rm','--network','none','--read-only','--mount','source=classroom-docker-qa_classroom-data,target=/data,readonly','classroom:local','python','-c',"import hashlib; print(hashlib.sha256(open('/data/classroom.sqlite3','rb').read()).hexdigest())"]).strip()

def main():
    baseline=PRIVATE/'deployment-before.json'
    if not baseline.exists():
        baseline.write_text(json.dumps(dict(inspect(),qa_hash=qa_hash())))
        baseline.chmod(0o600)
        print('Private runtime/QA-volume baseline recorded')
        return
    old=json.loads(baseline.read_text())
    current=inspect()
    assert current['env_digest']==old['env_digest'], 'Runtime environment changed'
    assert current['image']==old['image']
    assert current['mounts']==[['classroom-accounts-20261022','/data']] or current['mounts']==[('classroom-accounts-20261022','/data')]
    assert current['health']=='healthy'
    assert qa_hash()==old['qa_hash'], 'QA database changed'
    source=ROOT/'appworks/instance/classroom.sqlite3'
    expected_meta=json.loads((PRIVATE/'source-metadata.json').read_text())
    s=source.stat()
    assert {'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'size':s.st_size,'mtime_ns':s.st_mtime_ns}==expected_meta
    with closing(sqlite3.connect(source.as_uri()+'?mode=ro&immutable=1',uri=True)) as db:
        expected=db.execute('SELECT '+FIELDS+' FROM users ORDER BY id').fetchall()
    # Captured in memory; never log this subprocess stdout, which contains hashes/emails.
    code="""import sqlite3,json,os
from pathlib import Path
from course_registry import discover_courses
from achievements import load_bank,completed_courses,level_for
p=Path('/data/classroom.sqlite3')
d=sqlite3.connect('file:/data/classroom.sqlite3?mode=ro',uri=True)
d.row_factory=sqlite3.Row
courses=discover_courses('/app/courses',strict=True)
assert courses
for c in courses: load_bank(c)
names=[r[0] for r in d.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")]
counts={n:d.execute('SELECT count(*) FROM \"'+n+'\"').fetchone()[0] for n in names}
print(json.dumps(dict(rows=[list(r) for r in d.execute('SELECT FIELDS FROM users ORDER BY id')],counts=counts,photo_count=d.execute('SELECT count(*) FROM users WHERE photo_ref IS NOT NULL').fetchone()[0],integrity=d.execute('PRAGMA integrity_check').fetchone()[0],foreign_keys=len(d.execute('PRAGMA foreign_key_check').fetchall()),uid=os.getuid(),owner=p.stat().st_uid,group=p.stat().st_gid,courses=[c['id'] for c in courses],levels=[level_for(len(completed_courses(d,r[0],courses))) for r in d.execute('SELECT id FROM users')],upload_files=sum(1 for q in Path('/data').rglob('*') if q.is_file() and q!=p))))
""".replace('FIELDS',FIELDS)
    actual=json.loads(run(['docker','exec',CONTAINER,'python','-c',code]))
    assert actual.pop('rows')==[list(r) for r in expected]
    assert actual['integrity']=='ok' and actual['foreign_keys']==0
    assert actual['photo_count']==0 and actual['upload_files']==0
    assert actual['uid']==actual['owner']==actual['group']==10001
    assert actual['counts']['users']==len(expected)
    assert actual['counts']['activity_tracking']==1
    assert all(v==0 for k,v in actual['counts'].items() if k not in ('users','activity_tracking'))
    assert all(level==1 for level in actual['levels'])
    actual.update(account_fields_equal=True,source_hash_and_mtime_unchanged=True,qa_database_unchanged=True,runtime_environment_unchanged=True,health=current['health'],volume='classroom-accounts-20261022',image=current['image'])
    (ROOT/'evidence/docker/account-only-verification.json').write_text(json.dumps(actual,indent=2)+'\n')
    print(json.dumps(actual,indent=2))

if __name__=='__main__':
    main()
