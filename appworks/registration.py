"""Browser-bound registration; pending credentials never confer account access."""
import hashlib
import hmac
import re
import secrets
import time
import threading
from email.message import EmailMessage
from flask import g, request, render_template, redirect
from werkzeug.security import generate_password_hash


def install(app, connect):
    delivery_slots = threading.BoundedSemaphore(4)
    with connect() as db:
        columns = {r['name'] for r in db.execute('PRAGMA table_info(users)')}
        if 'email_verified_at' not in columns:
            db.execute('ALTER TABLE users ADD COLUMN email_verified_at REAL')
        db.execute('''CREATE TABLE IF NOT EXISTS pending_registrations (
            session_hash TEXT PRIMARY KEY, challenge TEXT NOT NULL, name TEXT NOT NULL,
            email TEXT NOT NULL, password_hash TEXT NOT NULL, code_hash TEXT NOT NULL,
            expires REAL NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
            sent_at REAL NOT NULL, sends INTEGER NOT NULL DEFAULT 1, ready INTEGER NOT NULL DEFAULT 0)''')

    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS registration_limits (kind TEXT NOT NULL,key_hash TEXT NOT NULL,attempted REAL NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS registration_limits_key ON registration_limits(kind,key_hash,attempted)')

    def permitted(db, email):
        now = time.time()
        db.execute('DELETE FROM registration_limits WHERE attempted<=?', (now-3600,))
        db.execute('DELETE FROM pending_registrations WHERE sent_at<=?', (now-28800,))
        keys = [('email', hashlib.sha256(email.encode()).hexdigest(), 3),
                ('ip', hashlib.sha256((request.remote_addr or '').encode()).hexdigest(), 10)]
        for kind, key, cap in keys:
            if db.execute('SELECT count(*) FROM registration_limits WHERE kind=? AND key_hash=?', (kind,key)).fetchone()[0] >= cap:
                return False
        for kind, key, cap in keys:
            db.execute('INSERT INTO registration_limits VALUES(?,?,?)', (kind,key,now))
        return True

    def limited():
        return render_template('auth.html', mode='register', csrf_token=g.session['csrf'], error='ส่งคำขอมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองอีกครั้ง'), 429, {'Retry-After':'3600'}

    def signed(challenge, code):
        return hmac.new(request.cookies.get('aw_session', '').encode(),
                        (challenge + ':' + code).encode(), hashlib.sha256).hexdigest()

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'GET':
            return render_template('auth.html', mode='register', csrf_token=g.session['csrf'])
        email = request.form.get('email', '').strip().lower()
        name = request.form.get('name', '').strip()
        password = request.form.get('password', '')
        if not (1 <= len(name) <= 80 and len(email) <= 254 and re.fullmatch(r"[A-Za-z0-9.!#$%&'*+=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+", email) and 12 <= len(password) <= 128):
            return render_template('auth.html', mode='register', csrf_token=g.session['csrf'], error='กรุณากรอกชื่อ อีเมลที่ถูกต้อง และรหัสผ่าน 12–128 ตัวอักษร'), 400
        with connect() as db:
            if db.execute('SELECT 1 FROM users WHERE email=?', (email,)).fetchone():
                return render_template('auth.html', mode='register', csrf_token=g.session['csrf'], error='ไม่สามารถใช้อีเมลนี้สมัครได้ กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น'), 409
        if not app.config['RESET_ENABLED']:
            return render_template('auth.html', mode='register', csrf_token=g.session['csrf'], error='ระบบส่งอีเมลไม่พร้อม กรุณาลองใหม่ภายหลัง'), 503
        challenge = secrets.token_urlsafe(32)
        code = f'{secrets.randbelow(1000000):06d}'
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            pending = db.execute('SELECT * FROM pending_registrations WHERE session_hash=?', (g.session['token_hash'],)).fetchone()
            if pending and pending['email'] == email:
                return redirect('/register/verify', code=303)
            if not permitted(db, email):
                return limited()
            db.execute('INSERT OR REPLACE INTO pending_registrations(session_hash,challenge,name,email,password_hash,code_hash,expires,sent_at) VALUES(?,?,?,?,?,?,?,?)',
                       (g.session['token_hash'], challenge, name, email, generate_password_hash(password, method='scrypt'), signed(challenge, code), time.time()+600, time.time()))
        return deliver(email, challenge, code)

    def deliver(email, challenge, code):
        message = EmailMessage()
        message['Subject'] = 'ยืนยันอีเมล · Classroom'
        cfg = app.config
        message['From'] = cfg['RESET_GRAPH_SENDER'] if cfg['RESET_TRANSPORT'] == 'graph' else cfg['RESET_SMTP_FROM']
        message['To'] = email
        message.set_content('รหัสยืนยันอีเมลของคุณ: ' + code + '\nหมดอายุใน 10 นาที ใช้ได้ครั้งเดียว หากไม่ได้สมัครให้ละเว้นอีเมลนี้\n')
        from graph_mail import send
        acquired = delivery_slots.acquire(blocking=False)
        try:
            if not acquired or not cfg['RESET_ENABLED']:
                raise RuntimeError('Delivery unavailable')
            if cfg['RESET_TRANSPORT'] == 'graph':
                send(cfg, message)
            else:
                import smtplib
                import ssl
                transport = smtplib.SMTP_SSL if cfg['RESET_SMTP_TLS'] == 'ssl' else smtplib.SMTP
                options = {'timeout':cfg['RESET_SMTP_TIMEOUT']}
                if transport is smtplib.SMTP_SSL:
                    options['context'] = ssl.create_default_context()
                with transport(cfg['RESET_SMTP_HOST'], cfg['RESET_SMTP_PORT'], **options) as smtp:
                    if cfg['RESET_SMTP_TLS'] == 'starttls':
                        smtp.starttls(context=ssl.create_default_context())
                    if cfg['RESET_SMTP_USERNAME']:
                        smtp.login(cfg['RESET_SMTP_USERNAME'], cfg['RESET_SMTP_PASSWORD'])
                    smtp.send_message(message)
        except Exception:
            # Deliberately omit provider exceptions (may contain credentials).
            with connect() as db:
                db.execute('DELETE FROM pending_registrations WHERE session_hash=? AND challenge=?', (g.session['token_hash'], challenge))
            return render_template('auth.html', mode='register', csrf_token=g.session['csrf'], error='ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่ภายหลัง'), 503
        finally:
            if acquired:
                delivery_slots.release()
        with connect() as db:
            db.execute('UPDATE pending_registrations SET ready=1 WHERE session_hash=? AND challenge=?', (g.session['token_hash'], challenge))
        return redirect('/register/verify', code=303)

    @app.post('/register/cancel')
    def cancel_registration():
        with connect() as db:
            db.execute('DELETE FROM pending_registrations WHERE session_hash=?', (g.session['token_hash'],))
        return redirect('/register', code=303)

    @app.post('/register/resend')
    def resend_registration():
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            pending = db.execute('SELECT * FROM pending_registrations WHERE session_hash=?', (g.session['token_hash'],)).fetchone()
            if not pending or pending['challenge'] != request.form.get('challenge'):
                return redirect('/register', code=303)
            if pending['sent_at'] > time.time()-60 or pending['sends'] >= 3:
                return render_template('registration_verify.html', csrf_token=g.session['csrf'], challenge=pending['challenge'], error='รออย่างน้อย 60 วินาที ส่งได้ไม่เกิน 3 ครั้ง กรุณาลองใหม่ภายหลัง'), 429, {'Retry-After':'60'}
            if not permitted(db, pending['email']):
                return limited()
            challenge = secrets.token_urlsafe(32)
            code = f'{secrets.randbelow(1000000):06d}'
            while hmac.compare_digest(pending['code_hash'], signed(pending['challenge'], code)):
                code = f'{secrets.randbelow(1000000):06d}'
            db.execute('UPDATE pending_registrations SET challenge=?,code_hash=?,expires=?,sent_at=?,attempts=0,sends=sends+1,ready=0 WHERE session_hash=?',
                       (challenge, signed(challenge, code), time.time()+600, time.time(), g.session['token_hash']))
        return deliver(pending['email'], challenge, code)

    @app.route('/register/verify', methods=['GET', 'POST'])
    def verify_registration():
        if not g.session:
            return redirect('/register', code=303)
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            pending = db.execute('SELECT * FROM pending_registrations WHERE session_hash=?', (g.session['token_hash'],)).fetchone()
            if not pending:
                return redirect('/register', code=303)
            error = None
            if request.method == 'POST':
                value = request.form.get('code', '')
                if (request.form.get('challenge') == pending['challenge'] and pending['expires'] > time.time() and pending['attempts'] < 5 and pending['ready']
                        and re.fullmatch(r'[0-9]{6}', value) and hmac.compare_digest(pending['code_hash'], signed(pending['challenge'], value))):
                    db.execute('INSERT OR IGNORE INTO users(name,email,password_hash,joined_at,email_verified_at) VALUES(?,?,?,?,?)',
                               (pending['name'], pending['email'], pending['password_hash'], time.time(), time.time()))
                    db.execute('DELETE FROM pending_registrations WHERE session_hash=?', (g.session['token_hash'],))
                    return redirect('/login', code=303)
                if request.form.get('challenge') == pending['challenge']:
                    db.execute('UPDATE pending_registrations SET attempts=min(attempts+1,5) WHERE session_hash=?', (g.session['token_hash'],))
                error = 'รหัสไม่ถูกต้อง หมดอายุ หรือใช้ครบ 5 ครั้ง กรุณาขอรหัสใหม่'
            return render_template('registration_verify.html', csrf_token=g.session['csrf'], challenge=pending['challenge'], retry_after=max(0, int(pending['sent_at']+60-time.time()+0.999)), error=error), 400 if error else 200
