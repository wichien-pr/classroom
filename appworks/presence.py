"""Session-bound, visible-page presence; not learning or profile activity."""
import time
from flask import g, request, render_template, send_from_directory
from pathlib import Path

WINDOW = 120
WRITE_INTERVAL = 25
PAGE_SIZE = 20


def install(app, connect):
    # Templates remain inert in an already-running pre-feature process.
    app.config['PRESENCE_ENABLED'] = True

    @app.get('/platform/presence.js')
    def presence_script():
        if not g.user:
            return {'error': 'authentication_required'}, 401
        return send_from_directory(Path(__file__).parent/'platform-assets', 'presence.js')

    @app.after_request
    def course_presence(response):
        if (g.user and request.endpoint == 'course_file' and request.method == 'GET'
                and response.status_code == 200 and response.mimetype == 'text/html'):
            # Decorate the authenticated response only, never rewrite course dist.
            response.direct_passthrough = False
            html = response.get_data(as_text=True)
            script = render_template('presence-client.html')
            if '</body>' in html:
                html = html.replace('</body>', script+'</body>', 1)
            else:
                html += script
            response.set_data(html)
            for key in ('ETag', 'Last-Modified', 'Accept-Ranges'):
                response.headers.pop(key, None)
        return response

    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS member_presence (
            session_hash TEXT PRIMARY KEY, seen_at REAL NOT NULL)''')
        db.execute('CREATE INDEX IF NOT EXISTS presence_seen ON member_presence(seen_at)')

    @app.route('/api/presence', methods=['GET', 'POST'])
    def member_presence():
        if not g.user:
            return {'error': 'authentication_required'}, 401
        if request.method == 'POST' and request.get_json(silent=True) != {}:
            return {'error': 'expected_empty_object'}, 400
        try:
            page = max(1, int(request.args.get('page', '1')))
        except ValueError:
            return {'error': 'invalid_page'}, 400
        now = time.time()
        with connect() as db:
            if request.method == 'POST':
                previous = db.execute('SELECT seen_at FROM member_presence WHERE session_hash=?',
                                      (g.session['token_hash'],)).fetchone()
                if previous is None or previous['seen_at'] <= now-WRITE_INTERVAL:
                    db.execute('BEGIN IMMEDIATE')
                    # Recheck after acquiring the write lock: logout/reset may
                    # have revoked this session since load_session ran.
                    live = db.execute('SELECT 1 FROM sessions WHERE token_hash=? AND user_id=? AND expires>?',
                                      (g.session['token_hash'], g.user['id'], now)).fetchone()
                    if not live:
                        return {'error': 'authentication_required'}, 401
                    db.execute('''INSERT INTO member_presence VALUES(?,?)
                        ON CONFLICT(session_hash) DO UPDATE SET seen_at=excluded.seen_at
                        WHERE member_presence.seen_at<=?''',
                               (g.session['token_hash'], now, now-WRITE_INTERVAL))
                    db.execute('DELETE FROM member_presence WHERE seen_at<=?', (now-WINDOW,))
                    db.commit()
            # Explicit read transaction keeps total and page on the same snapshot.
            db.execute('BEGIN')
            if not db.execute('SELECT 1 FROM sessions WHERE token_hash=? AND user_id=? AND expires>?',
                              (g.session['token_hash'], g.user['id'], now)).fetchone():
                return {'error': 'authentication_required'}, 401
            source = '''FROM member_presence p JOIN sessions s ON s.token_hash=p.session_hash
                JOIN users u ON u.id=s.user_id WHERE p.seen_at>? AND s.expires>?'''
            total = db.execute('SELECT count(DISTINCT u.id) '+source, (now-WINDOW, now)).fetchone()[0]
            pages = max(1, (total+PAGE_SIZE-1)//PAGE_SIZE)
            page = min(page, pages)
            rows = db.execute('SELECT DISTINCT u.id,u.name,u.username,u.photo_ref '+source+
                              ' ORDER BY u.id LIMIT ? OFFSET ?',
                              (now-WINDOW, now, PAGE_SIZE, (page-1)*PAGE_SIZE)).fetchall()
        return {'total': total, 'page': page, 'pages': pages, 'members': [dict(id=r['id'], name=r['name'], username=r['username'],
                photo_url=f"/account/photos/{r['id']}" if r['photo_ref'] else None,
                profile_url=f"/members/{r['id']}") for r in rows], 'csrf_token': g.session['csrf']}
