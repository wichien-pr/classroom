"""Authorized one-shot empty-course release to the discovered local HTTPS stack.
No credentials/rows are emitted. No reset, migration, mail or live login.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[1]
OLD = 'sha256:0efce9619f209b48b00ab2e2118c3dfea11433ff0477280e6c5837af42436271'
NEW = 'sha256:40c32ff42725b6dc37bf9aa6289f963dc791227562d098cdd97652d98b7cff5e'
NAME = 'classroom-docker-qa-classroom-1'
PROXY = 'classroom-docker-qa-https-1'
VOLUME = 'classroom-accounts-20261022'
COMPOSE = ['sh', 'scripts/classroom-https-local.sh']
os.umask(0o077)

def run(args, **kwargs):
    return subprocess.run(args, cwd=ROOT, check=True, capture_output=True, text=True, **kwargs).stdout.strip()

def inspect(target):
    return json.loads(run(['docker', 'inspect', target]))[0]

def environment(meta):
    return dict(item.split('=', 1) for item in meta['Config']['Env'])

FINGERPRINT = '''import sqlite3,json,hashlib,pathlib
root=pathlib.Path('/data')
with sqlite3.connect('file:/data/classroom.sqlite3?mode=ro',uri=True) as db:
 db.execute('BEGIN')
 assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
 schema=db.execute('SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name').fetchall()
 tables={}
 for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
  rows=db.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall()
  tables[name]={'rows':len(rows),'sha256':hashlib.sha256(repr(sorted(rows,key=repr)).encode()).hexdigest()}
 files={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and not p.name.startswith('classroom.sqlite3')}
 print(json.dumps({'integrity':'ok','schema':hashlib.sha256(repr(schema).encode()).hexdigest(),'tables':tables,'uploads':files},sort_keys=True))
'''

def snapshot(image):
    return json.loads(run(['docker','run','--rm','--network','none','--user','0:0',
        '--mount',f'type=volume,src={VOLUME},dst=/data,readonly',image,'python','-c',FINGERPRINT]))

def main():
    before = inspect(NAME)
    proxy = inspect(PROXY)
    assert before['Image'] == OLD and before['State']['Running']
    assert inspect('classroom:https-local')['Id'] == NEW
    expected_files = ','.join(str(ROOT / p) for p in ('compose.yaml','compose.accounts.yaml','compose.https.yaml','compose.https-local.yaml'))
    assert before['Config']['Labels']['com.docker.compose.project.config_files'] == expected_files
    assert before['Config']['Labels']['com.docker.compose.project'] == 'classroom-docker-qa'
    assert [(m.get('Name'),m['Destination']) for m in before['Mounts']] == [(VOLUME,'/data')]
    assert not before['HostConfig']['PortBindings']
    assert run(['docker','ps','-q','--filter',f'volume={VOLUME}']) == before['Id'][:12]
    config = json.loads(run(COMPOSE + ['config','--format','json']))
    configured = config['services']['classroom']
    assert configured['image'] == 'classroom:https-local'
    assert configured['command'] == before['Config']['Cmd']
    assert all(str(value) == environment(before)[key] for key,value in configured['environment'].items())
    assert not configured.get('ports')
    assert config['volumes']['classroom-data']['name'] == VOLUME
    # Prove the release adds only the requested course to the runtime application tree.
    tree_code = "import pathlib,hashlib,json; p=pathlib.Path('/app'); print(json.dumps({str(f.relative_to(p)):hashlib.sha256(f.read_bytes()).hexdigest() for f in p.rglob('*') if f.is_file()}))"
    trees = [json.loads(run(['docker','run','--rm','--network','none',image,'python','-c',tree_code])) for image in (OLD,NEW)]
    assert all(trees[1].get(path)==digest for path,digest in trees[0].items())
    added = sorted(set(trees[1])-set(trees[0]))
    assert added and all(p.startswith('courses/framework-for-system-design-interview/') for p in added)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = ROOT / 'backups' / ('framework-https-' + stamp)
    backup.mkdir(parents=True, mode=0o700)
    evidence = ROOT / 'evidence' / ('framework-deploy-' + stamp)
    evidence.mkdir(parents=True)
    rollback = 'classroom:rollback-framework-' + stamp.lower()
    run(['docker','tag',OLD,rollback])
    run(COMPOSE + ['stop','classroom'])
    assert not inspect(NAME)['State']['Running']
    assert run(['docker','ps','-q','--filter',f'volume={VOLUME}']) == ''
    baseline = snapshot(OLD)
    (backup/'fingerprints.json').write_text(json.dumps(baseline,indent=2)+'\n')
    archive = backup/'data.tar.gz'
    with archive.open('xb') as output:
        subprocess.run(['docker','run','--rm','--network','none','--user','0:0',
            '--mount',f'type=volume,src={VOLUME},dst=/data,readonly',OLD,'python','-c',
            "import tarfile,sys; t=tarfile.open(fileobj=sys.stdout.buffer,mode='w|gz'); t.add('/data',arcname='data'); t.close()"],
            stdout=output,stderr=subprocess.PIPE,check=True)
    assert archive.stat().st_mode & 0o777 == 0o600
    # Verify archive is readable, including DB integrity and upload membership.
    import tarfile, tempfile, sqlite3
    with tempfile.TemporaryDirectory(prefix='framework-backup-check-') as directory:
        with tarfile.open(archive) as tar: tar.extractall(directory,filter='data')
        with sqlite3.connect(f'file:{directory}/data/classroom.sqlite3?mode=ro',uri=True) as db:
            assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        for path,digest in baseline['uploads'].items():
            assert hashlib.sha256((Path(directory)/'data'/path).read_bytes()).hexdigest()==digest
    run(COMPOSE + ['up','-d','--no-build','--no-deps','--force-recreate','--wait','--wait-timeout','180','classroom'])
    after = inspect(NAME)
    assert after['Image']==NEW and after['State']['Health']['Status']=='healthy'
    assert [(m.get('Name'),m['Destination']) for m in after['Mounts']] == [(VOLUME,'/data')]
    assert environment(after)==environment(before)
    assert after['Config']['Cmd']==before['Config']['Cmd']
    assert not after['HostConfig']['PortBindings']
    assert inspect(PROXY)['Id']==proxy['Id']
    current=snapshot(NEW)
    assert current==baseline, 'Data changed before HTTP probes; retain backup and investigate'
    ca=evidence/'localhost-root.crt'
    run(['docker','cp',PROXY+':/data/caddy/pki/authorities/local/root.crt',str(ca)])
    checks={}
    for path,expected in [('/healthz',200),('/login',200),('/courses/framework-for-system-design-interview/',303),('/api/courses/framework-for-system-design-interview/progress',401)]:
        response=run(['curl','--noproxy','*','--cacert',str(ca),'-sS','-o','/dev/null','-w','%{http_code}', 'https://localhost'+path])
        assert int(response)==expected
        checks[path]=int(response)
    headers=run(['curl','--noproxy','*','--cacert',str(ca),'-sS','-I','https://localhost/courses/framework-for-system-design-interview/'])
    assert 'location: /login' in headers.lower()
    final=snapshot(NEW)
    assert final['schema']==baseline['schema'] and final['uploads']==baseline['uploads']
    assert {k:v for k,v in final['tables'].items() if k!='sessions'}=={k:v for k,v in baseline['tables'].items() if k!='sessions'}
    # Verify prior session rows, not merely counts; new probes may add anonymous rows.
    session_code='''import sqlite3,json,hashlib
with sqlite3.connect('file:/data/classroom.sqlite3?mode=ro',uri=True) as db:
 print(json.dumps({hashlib.sha256(repr(row).encode()).hexdigest():row[1] is None for row in db.execute('SELECT * FROM sessions')}))'''
    def sessions_from_archive():
        import tempfile,tarfile,sqlite3
        with tempfile.TemporaryDirectory(prefix='framework-session-check-') as d:
            with tarfile.open(archive) as t:t.extractall(d,filter='data')
            with sqlite3.connect(f'file:{d}/data/classroom.sqlite3?mode=ro',uri=True) as db:
                return {hashlib.sha256(repr(row).encode()).hexdigest() for row in db.execute('SELECT * FROM sessions')}
    prior=sessions_from_archive()
    now=json.loads(run(['docker','exec',NAME,'python','-c',session_code]))
    assert prior <= now.keys() and all(now[key] for key in now.keys()-prior)
    report=dict(url='https://localhost/',courseURL='https://localhost/courses/framework-for-system-design-interview/',
        container=after['Id'],image=NEW,previousImage=OLD,rollbackTag=rollback,backup=str(backup),
        archiveSHA256=hashlib.sha256(archive.read_bytes()).hexdigest(),volume=VOLUME,proxyUnchanged=True,
        environmentUnchanged=True,backendUnpublished=True,health='healthy',tlsCertificateValidated=True,
        preHTTPDataExactlyMatched=True,schemaUnchanged=True,tablesVerified=len(baseline['tables']),uploadsUnchanged=True,
        previousSessionsUnchanged=True,newAnonymousSessions=len(now.keys()-prior),checks=checks,addedRuntimeFiles=added)
    (evidence/'deployment.json').write_text(json.dumps(report,indent=2)+'\n')
    (evidence/'fingerprints-before.json').write_text(json.dumps(baseline,indent=2)+'\n')
    (evidence/'fingerprints-before-http.json').write_text(json.dumps(current,indent=2)+'\n')
    print(json.dumps({**report,'evidence':str(evidence)},indent=2))

if __name__=='__main__':
    main()
