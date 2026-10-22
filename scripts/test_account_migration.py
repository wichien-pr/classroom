"""Isolated fixtures only; never connects to deployed data."""
import importlib.util
from pathlib import Path
import sqlite3
from contextlib import closing
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('migrate_accounts.py')

class MigrationTests(unittest.TestCase):
    def test_account_only_exact_copy(self):
        self.assertTrue(SCRIPT.exists(), 'account migration implementation missing')
        spec = importlib.util.spec_from_file_location('migration', SCRIPT)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as folder:
            source, target = [Path(folder)/n for n in ('source.db', 'target.db')]
            def bootstrap(path):
                with closing(sqlite3.connect(path)) as db, db:
                    db.executescript('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,email TEXT UNIQUE,password_hash TEXT,photo_ref TEXT,username TEXT,bio TEXT,joined_at REAL,last_active_at REAL,email_verified_at REAL); CREATE TABLE sessions(value TEXT); CREATE TABLE activity_tracking(id INTEGER PRIMARY KEY,started_at REAL); INSERT INTO activity_tracking VALUES(1,999);')
            bootstrap(source)
            row = (7,'Fixture','fixture@example.invalid','opaque-test-hash','old.jpg','fixture','Bio',123.0,456.0,None)
            with closing(sqlite3.connect(source)) as db, db:
                db.execute('INSERT INTO users VALUES(?,?,?,?,?,?,?,?,?,?)',row)
                db.execute("INSERT INTO sessions VALUES('not-to-copy')")
            before = source.read_bytes()
            result = module.migrate(source,target,bootstrap)
            self.assertEqual(result['imported_accounts'],1)
            with closing(sqlite3.connect(target)) as db, db:
                expected = list(row); expected[4] = None
                self.assertEqual(db.execute('SELECT * FROM users').fetchone(),tuple(expected))
                self.assertEqual(db.execute('SELECT count(*) FROM sessions').fetchone()[0],0)
                self.assertEqual(db.execute('SELECT * FROM activity_tracking').fetchall(),[(1,999.0)])
            self.assertEqual(source.read_bytes(),before)

    def test_safety_guards_and_transaction_rollback(self):
        spec = importlib.util.spec_from_file_location('migration', SCRIPT)
        assert spec and spec.loader
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as folder:
            source, target = [Path(folder)/n for n in ('source.db','target.db')]
            def bootstrap(path):
                with closing(sqlite3.connect(path)) as db, db:
                    db.executescript('CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT,email TEXT,password_hash TEXT,photo_ref TEXT,username TEXT,bio TEXT,joined_at REAL,last_active_at REAL,email_verified_at REAL); CREATE TABLE sessions(value TEXT);')
            bootstrap(source)
            with closing(sqlite3.connect(source)) as db, db:
                db.execute("INSERT INTO users(id,name) VALUES(1,'Fixture')")
            target.write_bytes(b'untouched')
            with self.assertRaises(FileExistsError):
                module.migrate(source,target,bootstrap)
            self.assertEqual(target.read_bytes(),b'untouched')
            target.unlink()
            def contaminated(path):
                bootstrap(path)
                with closing(sqlite3.connect(path)) as db, db:
                    db.execute("INSERT INTO sessions VALUES('existing')")
            with self.assertRaises(ValueError):
                module.migrate(source,target,contaminated)
            with closing(sqlite3.connect(target)) as db, db:
                self.assertEqual(db.execute('SELECT count(*) FROM users').fetchone()[0],0)
            target.unlink()
            def triggered(path):
                bootstrap(path)
                with closing(sqlite3.connect(path)) as db, db:
                    db.execute("CREATE TRIGGER bad AFTER INSERT ON users BEGIN INSERT INTO sessions VALUES('bad'); END")
            with self.assertRaises(ValueError):
                module.migrate(source,target,triggered)
            with closing(sqlite3.connect(target)) as db, db:
                self.assertEqual(db.execute('SELECT count(*) FROM users').fetchone()[0],0)
                self.assertEqual(db.execute('SELECT count(*) FROM sessions').fetchone()[0],0)
            target.unlink()
            with closing(sqlite3.connect(source)) as db, db:
                db.execute('ALTER TABLE users ADD COLUMN unknown TEXT')
            with self.assertRaises(ValueError):
                module.migrate(source,target,bootstrap)
            self.assertFalse(target.exists())

if __name__ == '__main__':
    unittest.main()
