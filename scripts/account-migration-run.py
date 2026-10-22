"""Operator-specific authorized migration. Never rerun after successful creation."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
from contextlib import closing

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'appworks/instance/classroom.sqlite3'
PRIVATE = ROOT/'backups/account-only-20261022'
EVIDENCE = ROOT/'evidence/docker/account-only.json'
VOLUME = 'classroom-accounts-20261022'
IMAGE = 'sha256:4a2415639a7ed87742054c1828209a238bd0061876e854e8a670ed71d747612d'

def run(args, **kwargs):
    return subprocess.run(args,check=True,capture_output=True,text=True,**kwargs)

def metadata():
    s=SOURCE.stat()
    return {'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'size':s.st_size,'mtime_ns':s.st_mtime_ns}

def main():
    os.umask(0o077)
    if subprocess.run(['lsof','-nP','-iTCP:8080','-sTCP:LISTEN'],capture_output=True).returncode == 0:
        raise RuntimeError('Source listener must remain stopped')
    if any(Path(str(SOURCE)+suffix).exists() for suffix in ('-wal','-shm','-journal')):
        raise RuntimeError('Source sidecars require review')
    if VOLUME in run(['docker','volume','ls','--format','{{.Name}}']).stdout.splitlines():
        raise RuntimeError('Volume already exists; refusing reuse')
    PRIVATE.mkdir(mode=0o700)
    before=metadata()
    backup=PRIVATE/'source.sqlite3'
    with closing(sqlite3.connect(SOURCE.as_uri()+'?mode=ro&immutable=1',uri=True)) as src, closing(sqlite3.connect(backup)) as dst:
        src.backup(dst)
        assert dst.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    backup.chmod(0o600)
    assert metadata()==before
    (PRIVATE/'source-metadata.json').write_text(json.dumps(before))
    run(['docker','volume','create',VOLUME])
    run(['docker','run','--rm','--user','0:0','--network','none','--read-only','--mount',f'source={VOLUME},target=/data,volume-nocopy',IMAGE,'python','-c',"from pathlib import Path; import os; p=Path('/data'); assert not list(p.iterdir()); os.chown(p,10001,10001)"])
    # Host backup stays private; the offline helper runs as root with the source
    # mounted read-only. The following helper chowns target data to UID/GID 10001.
    command=['docker','run','--rm','--user','0:0','--network','none','--read-only','--tmpfs','/tmp:rw,noexec,nosuid,size=64m','--mount',f'source={VOLUME},target=/data,volume-nocopy','--mount',f'type=bind,source={PRIVATE},target=/source,readonly','--mount',f'type=bind,source={ROOT / "scripts/migrate_accounts.py"},target=/migration.py,readonly','-e','APPWORKS_RESET_ENABLED=0','-e','PYTHONPATH=/app/appworks',IMAGE,'python','/migration.py','--source','/source/source.sqlite3','--target','/data/classroom.sqlite3']
    result=json.loads(run(command).stdout)
    run(['docker','run','--rm','--user','0:0','--network','none','--read-only','--mount',f'source={VOLUME},target=/data',IMAGE,'python','-c',"from pathlib import Path; import os; [os.chown(p,10001,10001) for p in [Path('/data'),*Path('/data').rglob('*')]]"])
    assert metadata()==before
    result.update(volume=VOLUME,image=IMAGE,source_hash_and_mtime_unchanged=True,backup=str(backup))
    EVIDENCE.parent.mkdir(parents=True,exist_ok=True)
    EVIDENCE.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result))

if __name__=='__main__':
    try:
        main()
    except Exception as exc:
        raise SystemExit('Migration stopped: '+type(exc).__name__+' (inspect privately; no automatic cleanup/retry)') from None
