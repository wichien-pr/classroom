"""Local deployment backup; never prints account data or credentials."""
from pathlib import Path
from datetime import datetime, timezone
import sqlite3, shutil, json, hashlib, os
ROOT=Path(__file__).resolve().parents[1]
os.umask(0o077)
dest=ROOT/'backups'/('lab01-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
dest.mkdir(parents=True)
source=ROOT/'appworks/instance/classroom.sqlite3'
with sqlite3.connect(f'file:{source}?mode=ro',uri=True) as db, sqlite3.connect(dest/'classroom.sqlite3') as out:
    db.backup(out)
    assert out.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    fingerprints={}
    for table in tables:
        rows=db.execute('SELECT * FROM "'+table.replace('"','""')+'"').fetchall()
        fingerprints[table]={'rows':len(rows),'sha256':hashlib.sha256(repr(sorted(rows,key=repr)).encode()).hexdigest()}
for name in ['profile-photos','community-uploads']:
    path=source.parent/name
    if path.exists():shutil.copytree(path,dest/name)
shutil.copytree(ROOT/'courses/scale-lab/dist',dest/'dist')
for name in ['course.json','assessment.json']:
    shutil.copy2(ROOT/'courses/scale-lab'/name,dest/name)
(dest/'table-fingerprints.json').write_text(json.dumps(fingerprints,indent=2))
print(json.dumps({'backup':str(dest),'integrity':'ok','tables':len(tables)}))
