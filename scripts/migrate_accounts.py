#!/usr/bin/env python3
"""Offline account-only import. Source must be stopped, target must not exist.

Run inside the reviewed application image, with source mounted read-only,
network disabled and no runtime env file. Never prints account values.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
from contextlib import closing

FIELDS = ('id','name','email','password_hash','username','bio','joined_at','last_active_at','email_verified_at')
EXPECTED = set(FIELDS) | {'photo_ref'}


def fingerprint(path):
    stat = path.stat()
    return (hashlib.sha256(path.read_bytes()).hexdigest(), stat.st_size, stat.st_mtime_ns)


def tables(db):
    return [r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table'")]


def quoted(name):
    return '"' + name.replace('"', '""') + '"'


def migrate(source, target, bootstrap):
    source, target = Path(source).resolve(), Path(target).resolve()
    if not source.is_file() or source == target:
        raise ValueError('Separate existing source required')
    if any(Path(str(source)+suffix).exists() for suffix in ('-wal','-shm','-journal')):
        raise ValueError('Source must be stopped and checkpointed')
    before = fingerprint(source)
    src = sqlite3.connect(source.as_uri()+'?mode=ro&immutable=1', uri=True)
    try:
        if src.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Source integrity failure')
        if {r[1] for r in src.execute('PRAGMA table_info(users)')} != EXPECTED:
            raise ValueError('Unreviewed source account schema')
        fields = ','.join(map(quoted,FIELDS))
        rows = src.execute('SELECT '+fields+' FROM users ORDER BY id').fetchall()
        # Exclusive reservation: never reset, merge, or overwrite an existing DB.
        fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        os.close(fd)
        bootstrap(target)
        with closing(sqlite3.connect(target)) as dst, dst:
            dst.execute('PRAGMA foreign_keys=ON')
            dst.execute('BEGIN IMMEDIATE')
            if {r[1] for r in dst.execute('PRAGMA table_info(users)')} != EXPECTED:
                raise ValueError('Unreviewed destination account schema')
            baseline = {n:dst.execute('SELECT * FROM '+quoted(n)).fetchall() for n in tables(dst)}
            if any(values for n,values in baseline.items() if n != 'activity_tracking'):
                raise ValueError('Bootstrap must contain only schema defaults')
            dst.executemany('INSERT INTO users ('+fields+',photo_ref) VALUES ('+','.join('?' for _ in FIELDS)+',NULL)',rows)
            if dst.execute('SELECT '+fields+' FROM users ORDER BY id').fetchall() != rows:
                raise ValueError('Account field verification failure')
            if dst.execute('SELECT count(*) FROM users WHERE photo_ref IS NOT NULL').fetchone()[0]:
                raise ValueError('Photo references must be empty')
            if any(dst.execute('SELECT * FROM '+quoted(n)).fetchall() != values for n,values in baseline.items() if n != 'users'):
                raise ValueError('Non-account data changed')
            if dst.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or dst.execute('PRAGMA foreign_key_check').fetchall():
                raise ValueError('Target integrity failure')
            if fingerprint(source) != before:
                raise ValueError('Source changed during migration')
        return {'imported_accounts':len(rows),'account_fields_equal':True,'source_unchanged':True,'photo_refs_cleared':True,'integrity':'ok'}
    finally:
        src.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--target', required=True)
    args = parser.parse_args()
    os.environ['APPWORKS_RESET_ENABLED'] = '0'
    from app import create_app
    def bootstrap(path):
        create_app({'DATABASE':str(path),'RESET_ENABLED':False})
    try:
        print(json.dumps(migrate(args.source,args.target,bootstrap),sort_keys=True))
    except Exception as exc:
        # SQLite errors may contain private values; only expose error type.
        parser.exit(1,'Migration refused/failed ('+type(exc).__name__+'); target retained for private inspection.\n')

if __name__ == '__main__':
    main()
