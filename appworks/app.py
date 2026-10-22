import os
import sqlite3
from pathlib import Path
import secrets
import hashlib
import time
from flask import Flask, render_template, request, redirect, g, abort, send_from_directory
from course_registry import discover_courses, contained_path
from activity import install as install_activity, record as record_activity
from werkzeug.security import generate_password_hash, check_password_hash


def create_app(config=None):
    app = Flask(__name__, static_folder=None)
    app.config.update(DATABASE=os.environ.get('APPWORKS_DATABASE', str(Path(__file__).parent / 'instance' / 'classroom.sqlite3')))
    app.config.update(COOKIE_SECURE=os.environ.get('APPWORKS_COOKIE_SECURE') == '1', MAX_CONTENT_LENGTH=16384)
    app.config.update(COURSES_ROOT=str(Path(__file__).resolve().parent.parent / 'courses'))
    app.config.update(config or {})
    Path(app.config['DATABASE']).parent.mkdir(parents=True, exist_ok=True)

    from contextlib import contextmanager

    @contextmanager
    def connect():
        db = sqlite3.connect(app.config['DATABASE'], timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL)')
        db.execute('''CREATE TABLE IF NOT EXISTS lesson_progress (
            user_id INTEGER NOT NULL, course_id TEXT NOT NULL, lesson_id TEXT NOT NULL,
            completed_at REAL NOT NULL, PRIMARY KEY (user_id, course_id, lesson_id))''')



    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT NOT NULL, attempted REAL NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS attempts_ip_time ON login_attempts(ip, attempted)')
        db.execute('CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER, csrf TEXT NOT NULL, expires REAL NOT NULL)')

    def digest(value):
        return hashlib.sha256(value.encode()).hexdigest()

    @app.before_request
    def load_session():
        with connect() as db:
            g.session = db.execute('SELECT * FROM sessions WHERE token_hash=? AND expires>?', (digest(request.cookies.get('aw_session', '')), time.time())).fetchone()
            g.user = db.execute('SELECT id,name,email,photo_ref,username,bio,joined_at,last_active_at FROM users WHERE id=?', (g.session['user_id'],)).fetchone() if g.session else None
            if request.endpoint == 'account_profile' and request.method == 'POST' and g.user:
                # Flask 3.1 per-request override, before CSRF parses multipart.
                request.max_content_length = 5 * 1024 * 1024 + 16384
                request.max_form_memory_size = 80 * 1024
                request.max_form_parts = 4
            if request.method == 'POST':
                if g.user and request.endpoint in ('community_create','community_edit'):
                    request.max_content_length = 32768
                if g.user and request.endpoint in ('community_create','community_edit') and request.mimetype == 'multipart/form-data':
                    request.max_content_length = 20 * 1024 * 1024 + 32768
                    request.max_form_memory_size = 65536
                    request.max_form_parts = 24
                origin = request.headers.get('Origin')
                # no-referrer HTML forms can send Origin: null. Permit only the
                # recovery routes with browser-confirmed same-origin metadata;
                # the session-bound CSRF check below remains mandatory.
                private_same_origin = (request.path in ('/forgot-password', '/reset-password', '/register', '/register/verify', '/register/resend', '/register/cancel')
                                       and origin == 'null' and request.headers.get('Sec-Fetch-Site') == 'same-origin')
                if (origin and origin != request.host_url.rstrip('/') and not private_same_origin) or request.headers.get('Sec-Fetch-Site') == 'cross-site':
                    abort(403)
                csrf = request.headers.get('X-CSRF-Token', '') if request.path.startswith('/api/') else request.form.get('csrf_token', '')
                if not g.session or not secrets.compare_digest(g.session['csrf'].encode(), csrf.encode()):
                    abort(403)
            if not g.session and request.path in ('/register', '/login', '/forgot-password', '/reset-password'):
                g.new_token = secrets.token_urlsafe(32)
                g.session = dict(token_hash=digest(g.new_token), user_id=None, csrf=secrets.token_urlsafe(32), expires=time.time() + 28800)
                db.execute('INSERT INTO sessions VALUES(:token_hash,:user_id,:csrf,:expires)', g.session)

    @app.after_request
    def set_anonymous_cookie(response):
        # Successful authenticated page/API activity only; images/assets never heartbeat.
        if (g.user and response.status_code < 400 and request.endpoint in {
                'classroom', 'account_profile', 'edit_profile', 'member_profile',
                'leaderboards', 'exam_page', 'course_progress', 'exam_attempt', 'submit_exam'}):
            now = time.time()
            if g.user['last_active_at'] is None or g.user['last_active_at'] <= now - 60:
                with connect() as db:
                    db.execute('UPDATE users SET last_active_at=? WHERE id=? AND (last_active_at IS NULL OR last_active_at<=?)',
                               (now, g.user['id'], now - 60))
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'no-referrer' if request.path in ('/forgot-password', '/reset-password', '/register', '/register/verify', '/register/resend', '/register/cancel') else 'same-origin'
        response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
        if getattr(g, 'new_token', None):
            response.set_cookie('aw_session', g.new_token, httponly=True, secure=app.config['COOKIE_SECURE'], samesite='Lax', max_age=28800)
        return response

    dummy_hash = generate_password_hash(secrets.token_urlsafe(32), method='scrypt')

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            with connect() as db:
                db.execute('BEGIN IMMEDIATE')
                db.execute('DELETE FROM login_attempts WHERE attempted < ?', (time.time() - 900,))
                attempts = db.execute('SELECT count(*) FROM login_attempts WHERE ip=?', (request.remote_addr,)).fetchone()[0]
                if attempts >= 5:
                    return render_template('auth.html', mode='login', csrf_token=g.session['csrf'], error='ลองเข้าสู่ระบบมากเกินไป กรุณารอ 15 นาที'), 429, {'Retry-After': '900'}
                db.execute('INSERT INTO login_attempts VALUES(?,?)', (request.remote_addr, time.time()))
            with connect() as db:
                user = db.execute('SELECT * FROM users WHERE email=?', (request.form.get('email', '').strip().lower(),)).fetchone()
                valid = check_password_hash(user['password_hash'] if user else dummy_hash, request.form.get('password', '')[:129])
                # Serialize session issuance with password reset; a verified old hash
                # must not create a session after reset has revoked existing sessions.
                db.execute('BEGIN IMMEDIATE')
                if user and valid and db.execute('SELECT 1 FROM users WHERE id=? AND password_hash=?', (user['id'], user['password_hash'])).fetchone():
                    db.execute('DELETE FROM login_attempts WHERE ip=?', (request.remote_addr,))
                    db.execute('DELETE FROM sessions WHERE token_hash=? OR expires<=?', (g.session['token_hash'], time.time()))
                    raw = secrets.token_urlsafe(32)
                    db.execute('INSERT INTO sessions VALUES(?,?,?,?)', (digest(raw), user['id'], secrets.token_urlsafe(32), time.time() + 28800))
                    record_activity(db, user['id'], 'login')
                    response = redirect('/', code=303)
                    response.set_cookie('aw_session', raw, httponly=True, secure=app.config['COOKIE_SECURE'], samesite='Lax', max_age=28800)
                    return response
            return render_template('auth.html', mode='login', csrf_token=g.session['csrf'], error='อีเมลหรือรหัสผ่านไม่ถูกต้อง'), 401
        return render_template('auth.html', mode='login', csrf_token=g.session['csrf'])

    def progress_snapshot(course):
        from qualification import qualified_lessons, lesson_criteria
        with connect() as db:
            completed = qualified_lessons(db, g.user['id'], course)
            criteria = lesson_criteria(db, g.user['id'], course)
        return dict(course_id=course['id'], completed=completed, criteria=criteria,
                    completed_count=len(completed), total=len(course['lessons']))

    @app.route('/api/courses/<course_id>/progress', methods=['GET', 'POST'])
    def course_progress(course_id):
        if not g.user:
            return {'error': 'authentication_required'}, 401
        course = next((c for c in discover_courses(app.config['COURSES_ROOT'])
                       if c['id'] == course_id and 'lessons' in c), None)
        if not course:
            return {'error': 'course_not_found'}, 404
        if request.method == 'POST':
            data = request.get_json(silent=True)
            if (not isinstance(data, dict) or set(data) not in ({'lesson_id'}, {'lesson_id', 'manual'})
                    or not isinstance(data.get('lesson_id'), str)
                    or ('manual' in data and data['manual'] is not True)) :
                return {'error': 'expected_lesson_id'}, 400
            if data['lesson_id'] not in course['lessons']:
                return {'error': 'lesson_not_found'}, 404
            with connect() as db:
                inserted = db.execute('INSERT OR IGNORE INTO lesson_progress VALUES(?,?,?,?)',
                           (g.user['id'], course_id, data['lesson_id'], time.time()))
                if data.get('manual') is True:
                    db.execute('INSERT OR IGNORE INTO lesson_manual_completion VALUES(?,?,?,?)',
                               (g.user['id'], course_id, data['lesson_id'], time.time()))
                if inserted.rowcount:
                    record_activity(db, g.user['id'], 'lesson_completed', course_id + ':' + data['lesson_id'])
            # Missing banks must not discard learning progress; exam UI reports actionable availability.
            app.extensions['prepare_final_exam']()
        return {**progress_snapshot(course), 'csrf_token': g.session['csrf']}

    @app.get('/')
    def classroom():
        if not g.user:
            return redirect('/login', code=303)
        courses = discover_courses(app.config['COURSES_ROOT'])
        for course in courses:
            if 'lessons' in course:
                course['progress'] = progress_snapshot(course)
        return render_template('classroom.html', user=g.user, csrf_token=g.session['csrf'], courses=courses)

    @app.get('/courses/<course_id>/')
    @app.get('/courses/<course_id>/<path:filename>')
    def course_file(course_id, filename=None):
        if not g.user:
            return redirect('/login', code=303)
        course = next((c for c in discover_courses(app.config['COURSES_ROOT']) if c['id'] == course_id), None)
        if not course:
            abort(404)
        filename = filename or course['entry']
        try:
            target = contained_path(course['build_path'], filename)
        except (ValueError, OSError, RuntimeError):
            abort(404)
        if not target.is_file():
            # Extensionless client routes only; missing assets must remain 404.
            if any('.' in part for part in filename.split('/')) or filename.split('/')[0] in ('assets', 'src', 'node_modules'):
                abort(404)
            filename = course['entry']
        response = send_from_directory(course['build_path'], filename)
        if (request.method == 'GET' and response.status_code == 200
                and filename == course['entry']
                and request.headers.get('Sec-Fetch-Dest', 'document') == 'document'):
            with connect() as db:
                record_activity(db, g.user['id'], 'course_open', course_id)
        return response

    @app.post('/logout')
    def logout():
        with connect() as db:
            db.execute('DELETE FROM sessions WHERE token_hash=?', (digest(request.cookies.get('aw_session', '')),))
        response = redirect('/login', code=303)
        response.delete_cookie('aw_session', httponly=True, secure=app.config['COOKIE_SECURE'], samesite='Lax')
        return response

    from participation import install as install_participation
    install_participation(app, connect)
    install_activity(connect)
    from profiles import install as install_profiles
    install_profiles(app, connect)
    from achievements import install
    install(app, connect)
    from community import install as install_community
    install_community(app, connect)
    from password_reset import install as install_password_reset
    install_password_reset(app, connect)
    from registration import install as install_registration
    install_registration(app, connect)
    from presence import install as install_presence
    install_presence(app, connect)
    return app
