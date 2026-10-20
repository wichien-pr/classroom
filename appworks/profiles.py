"""Account-owned raster thumbnails; original files are never retained."""
import io
import os
from pathlib import Path
import re
import sqlite3
import secrets
import time
from datetime import datetime, timezone
from achievements import completed_courses, level_progress
from course_registry import discover_courses
from activity import calendar
from flask import abort, g, redirect, render_template, request, send_file
from PIL import Image, ImageOps, UnidentifiedImageError
import warnings

MAX_PHOTO_BYTES = 5 * 1024 * 1024


def thumbnail(raw):
    with warnings.catch_warnings():
        warnings.simplefilter('error', Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(raw), formats=['JPEG', 'PNG', 'WEBP']) as image:
            if (getattr(image, 'n_frames', 1) != 1 or min(image.size) < 32
                    or max(image.size) > 4096 or image.width * image.height > 12_000_000):
                raise ValueError('dimensions or animation')
            image.verify()
        with Image.open(io.BytesIO(raw), formats=['JPEG', 'PNG', 'WEBP']) as image:
            image.load()
            image = ImageOps.exif_transpose(image).convert('RGBA')
            image.thumbnail((256, 256), Image.Resampling.LANCZOS)
            clean = Image.new('RGB', image.size, 'white')
            clean.paste(image, mask=image.getchannel('A'))
            output = io.BytesIO()
            clean.save(output, 'JPEG', quality=85)
            return output.getvalue()


def install(app, connect):
    app.config.setdefault('PROFILE_UPLOAD_DIR', os.environ.get('APPWORKS_PROFILE_UPLOAD_DIR', str(Path(app.config['DATABASE']).resolve().parent/'profile-photos')))
    with connect() as db:
        columns = {r['name'] for r in db.execute('PRAGMA table_info(users)')}
        for name, definition in {'photo_ref':'TEXT', 'username':'TEXT', 'bio':"TEXT NOT NULL DEFAULT ''", 'joined_at':'REAL', 'last_active_at':'REAL'}.items():
            if name not in columns:
                db.execute(f'ALTER TABLE users ADD COLUMN {name} {definition}')
        # Reserved member-ID handles reveal neither names nor email addresses.
        db.execute("UPDATE users SET username='member-' || id WHERE username IS NULL")
        db.execute('CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username COLLATE NOCASE)')
        db.execute("""CREATE TRIGGER IF NOT EXISTS users_default_handle AFTER INSERT ON users
            WHEN NEW.username IS NULL BEGIN
            UPDATE users SET username='member-' || NEW.id WHERE id=NEW.id; END""")

    @app.template_filter('utc_date')
    def utc_date(value):
        return datetime.fromtimestamp(value, timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')

    def render_profile(person, error=None):
        person = dict(person)
        own = person['id'] == g.user['id']
        now = time.time()
        if own:
            person['last_active_at'] = now  # This authenticated page request is activity.
        active = person['last_active_at']
        minutes = max(0, int((now - active) / 60)) if active is not None else None
        if minutes is None:
            relative = 'ยังไม่มีข้อมูลการใช้งาน'
        elif minutes < 1:
            relative = 'ใช้งานอยู่ตอนนี้'
        elif minutes < 60:
            relative = f'ใช้งาน {minutes} นาทีที่แล้ว'
        elif minutes < 1440:
            relative = f'ใช้งาน {minutes // 60} ชั่วโมงที่แล้ว'
        else:
            relative = f'ใช้งาน {minutes // 1440} วันที่แล้ว'
        with connect() as db:
            count = len(completed_courses(db, person['id'], discover_courses(app.config['COURSES_ROOT'])))
            passed = db.execute('SELECT 1 FROM level_achievements WHERE user_id=?', (person['id'],)).fetchone() is not None
            activity = calendar(db, person['id'], now)
        return render_template('profile.html', user=g.user, profile=person, own=own,
                               progress=level_progress(count, passed), relative=relative,
                               server_now=now, csrf_token=g.session['csrf'], error=error, activity=activity)

    @app.get('/members/<int:user_id>')
    def member_profile(user_id):
        if not g.user:
            return redirect('/login', code=303)
        with connect() as db:
            person = db.execute('SELECT id,name,username,bio,photo_ref,joined_at,last_active_at FROM users WHERE id=?', (user_id,)).fetchone()
        if person is None:
            abort(404)
        return render_profile(person)

    @app.route('/account/profile/edit', methods=['GET', 'POST'])
    def edit_profile():
        if not g.user:
            return redirect('/login', code=303)
        values = dict(g.user)
        if request.method == 'POST':
            values.update({key:request.form.get(key, '').strip() for key in ('name','username','bio')})
            values['username'] = values['username'].lower()
            def invalid(message, status=400):
                return render_template('profile-edit.html', user=g.user, values=values, csrf_token=g.session['csrf'], error=message), status
            if (set(request.form) != {'csrf_token','name','username','bio'} or request.files
                    or any(len(request.form.getlist(key)) != 1 for key in request.form)):
                return invalid('คำขอไม่ถูกต้อง กรุณาแก้ไขเฉพาะชื่อ ชื่อผู้ใช้ และประวัติ')
            if (not 1 <= len(values['name']) <= 80 or len(values['bio']) > 500
                    or any(ord(c) < 32 and c not in '\n\r\t' for c in values['bio'])
                    or any(ord(c) < 32 for c in values['name'])):
                return invalid('ชื่อที่แสดงต้องมี 1–80 ตัวอักษร และประวัติไม่เกิน 500 ตัวอักษร โดยไม่มีอักขระควบคุม')
            if (not re.fullmatch(r'[a-z0-9][a-z0-9_-]{2,31}', values['username'])
                    or (re.fullmatch(r'member-[0-9]+', values['username']) and values['username'] != f"member-{g.user['id']}")):
                return invalid('ชื่อผู้ใช้ต้องมี 3–32 ตัว ใช้ a–z, 0–9, _ หรือ - เริ่มด้วยตัวอักษรหรือตัวเลข ไม่ใส่ @; member-เลข สงวนให้เจ้าของบัญชี')
            try:
                with connect() as db:
                    db.execute('UPDATE users SET name=?,username=?,bio=? WHERE id=?',
                               (values['name'], values['username'], values['bio'], g.user['id']))
            except sqlite3.IntegrityError:
                return invalid('ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น', 409)
            return redirect('/account/profile?saved=1', code=303)
        return render_template('profile-edit.html', user=g.user, values=values, csrf_token=g.session['csrf'])

    @app.errorhandler(413)
    def too_large(error):
        if request.path.startswith('/community'):
            return '<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><h1>คำขอมีขนาดใหญ่เกินไป</h1><p>คำขอต้องไม่เกิน 16 KiB กรุณาลดข้อความแล้วลองใหม่ ข้อความที่ส่งยังไม่ได้บันทึก</p><a href="/community">กลับ Community</a></html>',413
        if g.user and request.endpoint in {'account_profile', 'edit_profile'}:
            # Do not parse the rejected body again (including failures in before_request).
            return render_template('profile-edit.html', user=g.user, values=dict(g.user),
                                   csrf_token=g.session['csrf'],
                                   error='ไฟล์หรือคำขอใหญ่เกินไป รูปโปรไฟล์ต้องไม่เกิน 5 MiB; ข้อมูลโปรไฟล์ไม่เกิน 16 KiB'), 413
        return '<!doctype html><html lang="th"><meta charset="utf-8"><h1>ไฟล์หรือคำขอใหญ่เกินไป</h1><p>รูปโปรไฟล์ต้องไม่เกิน 5 MiB; คำขออื่นไม่เกิน 16 KiB</p><a href="/account/profile/edit">กลับไปเลือกภาพใหม่</a></html>', 413

    @app.route('/account/profile', methods=['GET', 'POST'])
    def account_profile():
        if not g.user:
            return redirect('/login', code=303)
        if request.method == 'POST':
            def invalid():
                return render_template('profile-edit.html', user=g.user, values=dict(g.user), csrf_token=g.session['csrf'], error='รูปภาพไม่ถูกต้อง ใช้ JPEG, PNG หรือ WebP ภาพนิ่ง ขนาดด้านละ 32–4096 พิกเซล ไม่เกิน 12 ล้านพิกเซล'), 400
            if (set(request.form) - {'csrf_token','action'} or set(request.files) - {'photo'}
                    or any(len(request.form.getlist(k)) != 1 for k in request.form)
                    or any(len(request.files.getlist(k)) != 1 for k in request.files)
                    or request.form.get('action', 'upload') not in ('upload','remove')):
                return invalid()
            remove = request.form.get('action') == 'remove'
            if remove and request.files:
                return invalid()
            data = None
            if not remove:
                try:
                    raw = request.files['photo'].read(MAX_PHOTO_BYTES + 1)
                    if len(raw) > MAX_PHOTO_BYTES:
                        abort(413)
                    data = thumbnail(raw)
                except (KeyError, ValueError, OSError, SyntaxError, UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning):
                    return invalid()
            root = Path(app.config['PROFILE_UPLOAD_DIR']).resolve()
            root.mkdir(parents=True, exist_ok=True, mode=0o700)
            ref = None
            created = False
            try:
                if data is not None:
                    ref = secrets.token_hex(24)+'.jpg'
                    fd = os.open(root/ref, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                    created = True
                    with os.fdopen(fd, 'wb') as output:
                        output.write(data)
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    old = db.execute('SELECT photo_ref FROM users WHERE id=?', (g.user['id'],)).fetchone()['photo_ref']
                    db.execute('UPDATE users SET photo_ref=? WHERE id=?', (ref,g.user['id']))
            except Exception:
                if created:
                    (root/ref).unlink(missing_ok=True)
                raise
            # Commit first. Lock during reference check/cleanup; never remove shared files.
            if old and re.fullmatch(r'[a-f0-9]{48}\.jpg', old):
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    if not db.execute('SELECT 1 FROM users WHERE photo_ref=?', (old,)).fetchone():
                        path = root/old
                        if not path.is_symlink():
                            try:
                                path.unlink(missing_ok=True)
                            except OSError:
                                app.logger.warning('Old profile thumbnail cleanup failed')
            return redirect('/account/profile/edit?photo_saved=1', code=303)
        return render_profile(g.user)

    @app.get('/account/photos/<int:user_id>')
    def account_photo(user_id):
        if not g.user:
            return redirect('/login', code=303)
        with connect() as db:
            row = db.execute('SELECT photo_ref FROM users WHERE id=?', (user_id,)).fetchone()
        if not row or not row['photo_ref'] or not re.fullmatch(r'[a-f0-9]{48}\.jpg', row['photo_ref']):
            abort(404)
        path = Path(app.config['PROFILE_UPLOAD_DIR'])/row['photo_ref']
        if path.is_symlink() or not path.is_file():
            abort(404)
        return send_file(path, mimetype='image/jpeg', conditional=False)
