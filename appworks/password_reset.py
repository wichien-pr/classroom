"""Email recovery. Raw capabilities exist only in memory and email, never SQLite."""
import hashlib
import http.client
import os
import queue
import re
from urllib.parse import urlsplit
import secrets
import smtplib
import ssl
import threading
import time
from email.message import EmailMessage
from flask import g, render_template, request
from werkzeug.security import generate_password_hash

GENERIC = 'หากอีเมลนี้มีบัญชีและระบบสามารถส่งอีเมลได้ คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ กรุณาตรวจสอบกล่องจดหมายและสแปม หรือรอสักครู่แล้วลองอีกครั้ง'


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def install(app, connect):
    defaults = dict(TRANSPORT='smtp', GRAPH_CLIENT_ID='', GRAPH_TENANT_ID='', GRAPH_CLIENT_SECRET='',
                    GRAPH_SENDER='', GRAPH_TIMEOUT=10, ENABLED=False, ALLOW_LOCAL=False, BASE_URL='', SMTP_HOST='', SMTP_PORT=587,
                    SMTP_TLS='starttls', SMTP_FROM='', SMTP_USERNAME='', SMTP_PASSWORD='', SMTP_TIMEOUT=10)
    for key, default in defaults.items():
        name = 'RESET_' + key
        aliases = {'GRAPH_CLIENT_ID':'OUTLOOK_CLIENT_ID', 'GRAPH_TENANT_ID':'OUTLOOK_TENANT_ID',
                   'GRAPH_CLIENT_SECRET':'OUTLOOK_CLIENT_SECRET', 'GRAPH_SENDER':'OUTLOOK_USER_EMAIL'}
        value = os.environ.get('APPWORKS_' + name, os.environ.get(aliases.get(key, ''), default))
        if isinstance(default, bool):
            value = value is True or value == '1'
        elif isinstance(default, int):
            try:
                value = int(value)
            except (ValueError, TypeError):
                raise ValueError('Invalid password recovery configuration') from None
        app.config.setdefault(name, value)
    cfg = app.config
    if cfg['RESET_ENABLED']:
        try:
            base = urlsplit(cfg['RESET_BASE_URL'])
            local_hosts = ('127.0.0.1', 'localhost', '::1')
            local = cfg['RESET_ALLOW_LOCAL'] is True and base.hostname in local_hosts
            valid = (base.scheme == 'https' or (local and base.scheme == 'http'))
            valid = valid and bool(base.hostname) and base.path in ('', '/') and not (base.query or base.fragment or base.username or base.password)
            valid = valid and not re.search(r'[\s\\]', cfg['RESET_BASE_URL'])
            if cfg['RESET_TRANSPORT'] == 'smtp':
                valid = valid and bool(re.fullmatch(r'[A-Za-z0-9.:-]+', cfg['RESET_SMTP_HOST']))
                valid = valid and bool(re.fullmatch(r'[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+', cfg['RESET_SMTP_FROM']))
                valid = valid and cfg['RESET_SMTP_TLS'] in ('starttls', 'ssl', 'none')
                if cfg['RESET_SMTP_TLS'] == 'none':
                    valid = valid and local and cfg['RESET_SMTP_HOST'] in local_hosts and not cfg['RESET_SMTP_USERNAME']
                valid = valid and type(cfg['RESET_SMTP_PORT']) is int and 1 <= cfg['RESET_SMTP_PORT'] <= 65535
                valid = valid and type(cfg['RESET_SMTP_TIMEOUT']) is int and 1 <= cfg['RESET_SMTP_TIMEOUT'] <= 30
                valid = valid and bool(cfg['RESET_SMTP_USERNAME']) == bool(cfg['RESET_SMTP_PASSWORD'])
            elif cfg['RESET_TRANSPORT'] == 'graph':
                guid = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
                valid = valid and all(re.fullmatch(guid, cfg['RESET_GRAPH_' + key]) for key in ('CLIENT_ID', 'TENANT_ID'))
                secret = cfg['RESET_GRAPH_CLIENT_SECRET']
                valid = valid and isinstance(secret, str) and 1 <= len(secret) <= 4096 and not re.search(r'[\x00-\x1f\x7f]', secret)
                valid = valid and bool(re.fullmatch(r"[A-Za-z0-9.!#$%&'*+=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+", cfg['RESET_GRAPH_SENDER']))
                valid = valid and len(cfg['RESET_GRAPH_SENDER']) <= 254
                valid = valid and type(cfg['RESET_GRAPH_TIMEOUT']) is int and 1 <= cfg['RESET_GRAPH_TIMEOUT'] <= 30
            else:
                valid = False
            _ = base.port  # Reject invalid URL ports too.
            if not valid:
                raise ValueError
        except (ValueError, TypeError):
            raise ValueError('Invalid password recovery configuration') from None
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS password_resets (
            token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires REAL NOT NULL)''')
        db.execute('CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets(user_id)')

    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS password_reset_limits (kind TEXT NOT NULL, key_hash TEXT NOT NULL, attempted REAL NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS password_reset_limits_key ON password_reset_limits(kind,key_hash,attempted)')

    def permitted(email):
        now = time.time()
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            db.execute('DELETE FROM password_reset_limits WHERE attempted<=?', (now - 900,))
            ip = digest(request.remote_addr or '')
            ip_count = db.execute("SELECT count(*) FROM password_reset_limits WHERE kind='ip' AND key_hash=?", (ip,)).fetchone()[0]
            if ip_count >= 10:
                return False
            db.execute("INSERT INTO password_reset_limits VALUES('ip',?,?)", (ip, now))
            account = digest(email)
            count = db.execute("SELECT count(*) FROM password_reset_limits WHERE kind='account' AND key_hash=?", (account,)).fetchone()[0]
            if count >= 3:
                return False
            db.execute("INSERT INTO password_reset_limits VALUES('account',?,?)", (account, now))
        return True

    def deliver(email):
        with connect() as db:
            user = db.execute('SELECT id,email FROM users WHERE email=?', (email,)).fetchone()
            if not user:
                return
            raw = secrets.token_urlsafe(32)
            token_hash = digest(raw)
            db.execute('DELETE FROM password_resets WHERE expires<=?', (time.time(),))
            db.execute('INSERT INTO password_resets VALUES(?,?,?)', (token_hash, user['id'], time.time() + 1800))
        message = EmailMessage()
        message['Subject'] = 'ตั้งรหัสผ่านใหม่ · Classroom'
        message['From'] = cfg['RESET_GRAPH_SENDER'] if cfg['RESET_TRANSPORT'] == 'graph' else cfg['RESET_SMTP_FROM']
        message['To'] = user['email']
        message.set_content('ใช้ลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ภายใน 30 นาที (ใช้ได้ครั้งเดียว)\n'
                            + cfg['RESET_BASE_URL'].rstrip('/') + '/reset-password#' + raw
                            + '\nหากคุณไม่ได้ขอ ให้ละเว้นอีเมลนี้ รหัสผ่านเดิมยังใช้ได้\n')
        try:
            if cfg['RESET_TRANSPORT'] == 'graph':
                from graph_mail import send
                send(cfg, message)
            else:
                transport = smtplib.SMTP_SSL if cfg['RESET_SMTP_TLS'] == 'ssl' else smtplib.SMTP
                options = {'timeout': cfg['RESET_SMTP_TIMEOUT']}
                if transport is smtplib.SMTP_SSL:
                    options['context'] = ssl.create_default_context()
                with transport(cfg['RESET_SMTP_HOST'], cfg['RESET_SMTP_PORT'], **options) as smtp:
                    if cfg['RESET_SMTP_TLS'] == 'starttls':
                        smtp.starttls(context=ssl.create_default_context())
                    if cfg['RESET_SMTP_USERNAME']:
                        smtp.login(cfg['RESET_SMTP_USERNAME'], cfg['RESET_SMTP_PASSWORD'])
                    smtp.send_message(message)
        except (OSError, smtplib.SMTPException, http.client.HTTPException, ValueError):
            with connect() as db:
                db.execute('DELETE FROM password_resets WHERE token_hash=?', (token_hash,))
            # No exception details: SMTP errors can include recipients or credentials.
            app.logger.warning('Password recovery delivery failed')

    jobs = queue.Queue(maxsize=100)
    if cfg['RESET_ENABLED']:
        app.extensions['password_reset_queue'] = jobs

        def worker():
            while True:
                email = jobs.get()
                try:
                    deliver(email)
                except Exception:
                    app.logger.error('Password recovery worker failed')
                finally:
                    jobs.task_done()
        threading.Thread(target=worker, name='password-recovery', daemon=True).start()

    @app.route('/reset-password', methods=['GET', 'POST'])
    def reset_password():
        if request.method == 'GET':
            return render_template('password_reset.html', reset=True, csrf_token=g.session['csrf'])
        raw = request.form.get('token', '')
        password = request.form.get('password', '')
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            token = db.execute('SELECT user_id FROM password_resets WHERE token_hash=? AND expires>?',
                               (digest(raw), time.time())).fetchone()
            if not token or not cfg['RESET_ENABLED'] or not re.fullmatch(r'[A-Za-z0-9_-]{43}', raw):
                return render_template('password_reset.html', reset=True, csrf_token=g.session['csrf'],
                                       error='ลิงก์ไม่ถูกต้อง หมดอายุ หรือใช้แล้ว กรุณาขอลิงก์ใหม่'), 400
            if not 12 <= len(password) <= 128 or password != request.form.get('confirmation', ''):
                return render_template('password_reset.html', reset=True, csrf_token=g.session['csrf'], token=raw,
                                       error='ใช้รหัสผ่าน 12–128 ตัวอักษรและยืนยันให้ตรงกัน'), 400
            db.execute('UPDATE users SET password_hash=? WHERE id=?',
                       (generate_password_hash(password, method='scrypt'), token['user_id']))
            db.execute('DELETE FROM sessions WHERE user_id=?', (token['user_id'],))
            db.execute('DELETE FROM password_resets WHERE user_id=?', (token['user_id'],))
        return render_template('password_reset.html', reset=True, success=True,
                               message='ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่')

    @app.route('/forgot-password', methods=['GET', 'POST'])
    def forgot_password():
        if request.method == 'POST' and cfg['RESET_ENABLED']:
            email = request.form.get('email', '').strip().lower()[:255]
            try:
                if permitted(email):
                    jobs.put_nowait(email)
            except queue.Full:
                pass
        return render_template('password_reset.html', csrf_token=g.session['csrf'],
                               message=GENERIC if request.method == 'POST' else None)
