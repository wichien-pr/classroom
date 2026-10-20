"""Structured community extras: never fetch remote URLs."""
import re
import io
import os
import secrets
import time
import warnings
from pathlib import Path
from contextlib import contextmanager
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_FILE = 5 * 1024 * 1024
MAX_TOTAL = 20 * 1024 * 1024

from urllib.parse import urlsplit, unquote, parse_qs


def safe_url(value, video=False):
    if not value:
        return ''
    decoded = unquote(value)
    if len(value) > 2048 or any(ord(c) <= 32 or ord(c) == 127 or c == '\\' for c in decoded):
        raise ValueError('ลิงก์ต้องเป็น http/https ที่ไม่มีช่องว่างหรืออักขระควบคุม')
    try:
        parts = urlsplit(value)
        if parts.scheme not in ('http','https') or not parts.hostname or parts.username is not None or parts.password is not None:
            raise ValueError()
        if not re.fullmatch(r'[A-Za-z0-9.-]+', parts.hostname) or parts.port not in (None,80,443):
            raise ValueError()
    except ValueError:
        raise ValueError('ลิงก์ต้องเป็น http/https และไม่มีข้อมูลเข้าสู่ระบบ') from None
    if video:
        host = parts.hostname.lower()
        valid = (host in ('youtube.com','www.youtube.com','m.youtube.com') and parts.path == '/watch' and re.fullmatch(r'[A-Za-z0-9_-]{11}', parse_qs(parts.query).get('v',[''])[0]))
        valid = valid or (host == 'youtu.be' and re.fullmatch(r'/[A-Za-z0-9_-]{11}',parts.path))
        valid = valid or (host in ('vimeo.com','www.vimeo.com') and re.fullmatch(r'/[0-9]{1,12}', parts.path))
        if not valid:
            raise ValueError('วิดีโอรองรับลิงก์ YouTube (watch หรือ youtu.be) และ Vimeo เท่านั้น')
    return value


def migrate(db):
    db.execute('''CREATE TABLE IF NOT EXISTS community_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id),
        storage TEXT NOT NULL UNIQUE, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL)''')
    db.execute('CREATE INDEX IF NOT EXISTS community_attachments_post ON community_attachments(post_id)')
    columns = {r['name'] for r in db.execute('PRAGMA table_info(community_posts)')}
    for name in ('link_url','video_url'):
        if name not in columns:
            db.execute(f"ALTER TABLE community_posts ADD COLUMN {name} TEXT NOT NULL DEFAULT ''")


def links(form):
    return {name:safe_url(form.get(name,''),name=='video_url') for name in ('link_url','video_url')}


def clean_upload(upload):
    raw = upload.stream.read(MAX_FILE + 1)
    if not raw or len(raw) > MAX_FILE:
        raise ValueError('ไฟล์ต้องไม่ว่างและไม่เกิน 5 MiB')
    name = upload.filename.replace('\\','/').split('/')[-1]
    name = ''.join(c for c in name if c.isprintable() and c not in '\"<>:')[:120] or 'download'
    ext = Path(name).suffix.lower()
    allowed = {'.jpg':'JPEG','.jpeg':'JPEG','.png':'PNG','.webp':'WEBP','.gif':'GIF'}
    if ext in allowed:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter('error',Image.DecompressionBombWarning)
                with Image.open(io.BytesIO(raw),formats=[allowed[ext]]) as im:
                    frames=[]; durations=[]; started=time.monotonic(); pixels=0
                    # Do not ask GIF n_frames: Pillow scans the entire input to count.
                    count=101 if ext=='.gif' else getattr(im,'n_frames',1)
                    if ext!='.gif' and count!=1:
                        raise ValueError('ภาพเคลื่อนไหวรองรับ GIF ไม่เกิน 100 เฟรม')
                    for i in range(count):
                        try:
                            im.seek(i)
                        except EOFError:
                            break
                        if i==100:
                            raise ValueError('GIF ต้องไม่เกิน 100 เฟรม')
                        pixels += im.width*im.height
                        if max(im.size)>4096 or im.width*im.height>12_000_000 or pixels>20_000_000 or time.monotonic()-started>3:
                            raise ValueError('ภาพใหญ่หรือ GIF ซับซ้อนเกินไป (20 ล้านพิกเซลรวม)')
                        im.load()
                        frame=ImageOps.exif_transpose(im).convert('RGBA')
                        frame.info.clear()
                        frames.append(frame)
                        durations.append(max(40,min(1000,im.info.get('duration',100))))
                    output=io.BytesIO()
                    if ext=='.gif':
                        frames[0].save(output,'GIF',save_all=True,append_images=frames[1:],duration=durations,loop=0,disposal=2)
                        mime='image/gif'
                    else:
                        frames[0].save(output,'PNG')
                        mime='image/png'
                        name=Path(name).stem+'.png'
                    data=output.getvalue()
                    if len(data)>MAX_FILE:
                        raise ValueError('ภาพหลังแปลงเกิน 5 MiB กรุณาลดขนาด')
                    return dict(data=data,name=name,mime=mime,original_size=len(raw))
        except (OSError,UnidentifiedImageError,Image.DecompressionBombError,Image.DecompressionBombWarning) as exc:
            raise ValueError('ไฟล์ภาพเสียหรือรูปแบบไม่ตรงกับนามสกุล') from exc
    if ext=='.pdf' and raw.startswith(b'%PDF-') and b'%%EOF' in raw[-1024:]:
        return dict(data=raw,name=name,mime='application/pdf',original_size=len(raw))
    if ext=='.txt':
        try:
            text=raw.decode('utf-8')
            if any(ord(c)<32 and c not in '\r\n\t' for c in text):
                raise ValueError()
        except (ValueError,UnicodeError):
            raise ValueError('TXT ต้องเป็น UTF-8 ไม่มีอักขระควบคุม') from None
        return dict(data=raw,name=name,mime='text/plain',original_size=len(raw))
    raise ValueError('รองรับ JPEG, PNG, WebP ภาพนิ่ง, GIF, PDF และ TXT เท่านั้น')


def uploads(request):
    selected=[f for f in request.files.getlist('attachments') if f.filename]
    if len(selected)>4:
        raise ValueError('แนบได้ไม่เกิน 4 ไฟล์')
    result=[clean_upload(f) for f in selected]
    if sum(f['original_size'] for f in result)>MAX_TOTAL:
        raise ValueError('ไฟล์รวมต้องไม่เกิน 20 MiB')
    return result


@contextmanager
def transaction(connect,app):
    root=Path(app.config['COMMUNITY_UPLOAD_DIR'])
    created=[]; obsolete=[]
    try:
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            yield db, (root,created,obsolete)
    except BaseException:
        for path in created:
            path.unlink(missing_ok=True)
        raise
    else:
        for path in obsolete:
            path.unlink(missing_ok=True)


def save_files(db,store,pid,new,remove=''):
    root,created,obsolete=store
    current={str(row['id']):dict(row) for row in db.execute('SELECT * FROM community_attachments WHERE post_id=?',(pid,))}
    ids=set(remove.split(',')) if remove else set()
    if not ids <= current.keys():
        raise ValueError('ไฟล์ที่ลบไม่ได้อยู่ในโพสต์นี้')
    remaining=[r for key,r in current.items() if key not in ids]
    if len(remaining)+len(new)>4 or sum(r['size'] for r in remaining)+sum(len(f['data']) for f in new)>MAX_TOTAL:
        raise ValueError('แนบได้ไม่เกิน 4 ไฟล์ รวม 20 MiB')
    for key in ids:
        obsolete.append(root/current[key]['storage'])
        db.execute('DELETE FROM community_attachments WHERE id=?',(int(key),))
    new_ids=[]
    for f in new:
        root.mkdir(parents=True,exist_ok=True,mode=0o700)
        ref=secrets.token_hex(24)
        path=root/ref
        created.append(path)
        with path.open('xb') as output:
            output.write(f['data'])
        path.chmod(0o600)
        new_ids.append(db.execute('INSERT INTO community_attachments(post_id,storage,name,mime,size) VALUES(?,?,?,?,?)',(pid,ref,f['name'],f['mime'],len(f['data']))).lastrowid)
    return new_ids


def save_links(db,pid,values):
    db.execute('UPDATE community_posts SET link_url=?,video_url=? WHERE id=?',(values['link_url'],values['video_url'],pid))
