"""Container probes must not allocate sessions or disclose configuration."""
import sqlite3
from app import create_app


def test_health_is_sessionless_database_probe(tmp_path):
    database = tmp_path / 'health.sqlite3'
    app = create_app({'TESTING': True, 'DATABASE': str(database)})
    client = app.test_client()
    with sqlite3.connect(database) as db:
        before = db.execute('SELECT count(*) FROM sessions').fetchone()[0]
    for _ in range(5):
        response = client.get('/healthz')
        assert response.status_code == 200
        assert response.json == {'status': 'ok'}
        assert 'Set-Cookie' not in response.headers
        assert response.headers['Cache-Control'] == 'no-store'
    with sqlite3.connect(database) as db:
        assert db.execute('SELECT count(*) FROM sessions').fetchone()[0] == before
