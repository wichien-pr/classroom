"""Authenticated plain-text community; deliberately no learning activity writes."""
import time
import os
import re
import secrets
from datetime import datetime
from zoneinfo import ZoneInfo
from functools import wraps
from urllib.parse import urlencode
from flask import g, redirect, render_template, request, abort, send_file
from pathlib import Path
from achievements import completed_courses, level_for
from course_registry import discover_courses
import community_media as media
import community_polls as polls
import community_blocks as blocks

CATEGORIES = {'general':'ทั่วไป', 'questions':'คำถาม', 'introductions':'แนะนำตัว', 'wins':'ความสำเร็จ', 'tips':'เคล็ดลับ/แบบฝึกหัด', 'requests':'ข้อเสนอแนะ'}


def install(app, connect):
    app.config.setdefault('COMMUNITY_UPLOAD_DIR', os.environ.get('APPWORKS_COMMUNITY_UPLOAD_DIR',str(Path(app.config['DATABASE']).resolve().parent/'community-uploads')))
    app.config.setdefault('COMMUNITY_MODERATOR_IDS', {int(x) for x in os.environ.get('COMMUNITY_MODERATOR_IDS','').split(',') if x.strip().isdigit()})

    def moderator():
        return g.user['id'] in app.config['COMMUNITY_MODERATOR_IDS']
    with connect() as db:
        db.execute('''CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL,
            created REAL NOT NULL, updated REAL NOT NULL, activity REAL NOT NULL,
            pinned INTEGER NOT NULL DEFAULT 0)''')
        media.migrate(db)
        if 'content_blocks' not in {r['name'] for r in db.execute('PRAGMA table_info(community_posts)')}:
            db.execute('ALTER TABLE community_posts ADD COLUMN content_blocks TEXT')
        polls.migrate(db)
        if 'nonce' not in {r['name'] for r in db.execute('PRAGMA table_info(community_posts)')}:
            db.execute('ALTER TABLE community_posts ADD COLUMN nonce TEXT')
        db.execute('CREATE UNIQUE INDEX IF NOT EXISTS community_post_nonce ON community_posts(user_id,nonce)')
        db.execute('''CREATE TABLE IF NOT EXISTS community_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES community_posts(id),
            user_id INTEGER NOT NULL REFERENCES users(id), body TEXT NOT NULL,
            created REAL NOT NULL, updated REAL NOT NULL)''')
        db.execute('CREATE TABLE IF NOT EXISTS community_rate_events (user_id INTEGER NOT NULL,kind TEXT NOT NULL,created REAL NOT NULL)')
        db.execute('CREATE INDEX IF NOT EXISTS community_rates ON community_rate_events(user_id,kind,created)')
        db.execute('CREATE INDEX IF NOT EXISTS community_posts_author ON community_posts(user_id,created)')
        db.execute('CREATE INDEX IF NOT EXISTS community_comments_author ON community_comments(user_id,created)')
        db.execute('CREATE INDEX IF NOT EXISTS community_comments_post ON community_comments(post_id,created,id)')
        db.execute('''CREATE TABLE IF NOT EXISTS community_likes (
            post_id INTEGER NOT NULL REFERENCES community_posts(id), user_id INTEGER NOT NULL REFERENCES users(id),
            PRIMARY KEY(post_id,user_id))''')
        db.execute('CREATE INDEX IF NOT EXISTS community_posts_feed ON community_posts(pinned DESC,created DESC,id DESC)')
        db.execute('CREATE INDEX IF NOT EXISTS community_posts_category ON community_posts(category,pinned DESC,created DESC,id DESC)')
        db.execute('CREATE INDEX IF NOT EXISTS community_posts_activity ON community_posts(pinned DESC,activity DESC,id DESC)')

    def member(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            if not g.user:
                return redirect('/login', code=303)
            if any(not 1 <= kwargs[key] <= 9223372036854775807 for key in ('pid','cid') if key in kwargs):
                abort(404)
            if request.method=='POST':
                composer = fn.__name__ in ('community_create','community_edit')
                if (request.files and (not composer or set(request.files)-{'attachments'})) or any(len(request.form.getlist(k)) != 1 for k in request.form):
                    abort(400)
                if composer and sum(len(v.encode()) for v in request.form.values())>(32768 if 'content_blocks' in request.form else 16384):
                    abort(413)
                keys=set(request.form)-{'csrf_token'}
                if fn.__name__ in ('community_create','community_edit'):
                    keys -= {'link_url','video_url','remove_attachments','poll_question','poll_options','nonce','content_blocks'}
                    if request.form.get('nonce') and not re.fullmatch(r'[A-Za-z0-9_-]{16,80}',request.form['nonce']):
                        abort(400)
                expected={'community_create':{'title','body','category'},'community_edit':{'title','body','category'},
                          'community_delete':{'confirm'},'community_pin':{'state'},'community_like':{'state'},
                          'community_comment':{'body'},'community_vote':{'option'}}.get(fn.__name__)
                if fn.__name__=='community_comment_action':
                    expected={'body'} if kwargs.get('action')=='edit' else {'confirm'}
                if expected is not None and keys!=expected:
                    abort(400)
            return fn(*args, **kwargs)
        return wrapped

    @app.template_filter('community_time')
    def community_time(value):
        return datetime.fromtimestamp(value, ZoneInfo('Asia/Bangkok')).strftime('%d/%m/%Y %H:%M') + ' น.'

    @app.template_filter('community_relative')
    def community_relative(value):
        seconds = max(0, int(time.time() - value))
        if seconds < 60:
            return 'เมื่อสักครู่'
        if seconds < 3600:
            return f'{seconds // 60} นาทีที่แล้ว'
        if seconds < 86400:
            return f'{seconds // 3600} ชั่วโมงที่แล้ว'
        return f'{seconds // 86400} วันที่แล้ว'

    def authors(db, rows):
        courses = discover_courses(app.config['COURSES_ROOT'])
        people = {}
        for row in rows:
            uid = row['user_id']
            if uid not in people:
                person = dict(db.execute('SELECT id,name,username,photo_ref FROM users WHERE id=?', (uid,)).fetchone())
                person['level'] = level_for(len(completed_courses(db, uid, courses)), db.execute('SELECT 1 FROM level_achievements WHERE user_id=?',(uid,)).fetchone() is not None)
                people[uid] = person
        return people

    def render(**context):
        if request.method=='POST' and context.get('values') is not None:
            values=context['values']
            values['content_blocks']=blocks.draft(request.form.get('content_blocks'),values.get('attachments',[]))
        context['nonce']=request.form.get('nonce') or secrets.token_urlsafe(24)
        with connect() as db:
            count = db.execute('SELECT count(*) FROM users').fetchone()[0]
        return render_template('community.html', user=g.user, csrf_token=g.session['csrf'], categories=CATEGORIES, member_count=count, moderator=moderator(), **context)

    def counts(db, item):
        pid=item['id']
        item['poll']=polls.snapshot(db,pid,g.user['id'])
        item['poll_question']=item['poll']['question'] if item['poll'] else ''
        item['poll_options']='\n'.join(item['poll']['options']) if item['poll'] else ''
        item['attachments']=[dict(r) for r in db.execute('SELECT * FROM community_attachments WHERE post_id=? ORDER BY id',(pid,))]
        item['ordered_blocks']=blocks.display(item.get('content_blocks'),item['attachments'])
        item['likes']=db.execute('SELECT count(*) FROM community_likes WHERE post_id=?',(pid,)).fetchone()[0]
        latest = db.execute('SELECT c.created,u.id,u.name,u.username,u.photo_ref FROM community_comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created DESC,c.id DESC LIMIT 1',(pid,)).fetchone()
        item['last_comment'] = dict(latest) if latest else None
        item['comments']=db.execute('SELECT count(*) FROM community_comments WHERE post_id=?',(pid,)).fetchone()[0]
        item['liked']=db.execute('SELECT 1 FROM community_likes WHERE post_id=? AND user_id=?',(pid,g.user['id'])).fetchone() is not None
        return item

    def find(db, pid):
        row = db.execute('SELECT * FROM community_posts WHERE id=?',(pid,)).fetchone()
        if row is None:
            abort(404)
        return counts(db,dict(row))

    def limited(db,kind):
        now=time.time()
        db.execute('DELETE FROM community_rate_events WHERE created<?',(now-600,))
        count=db.execute('SELECT count(*) FROM community_rate_events WHERE user_id=? AND kind=? AND created>?',(g.user['id'],kind,now-600)).fetchone()[0]
        if count >= (5 if kind=='post' else 15):
            return True
        db.execute('INSERT INTO community_rate_events VALUES(?,?,?)',(g.user['id'],kind,now))
        return False

    def valid_text(text,maximum):
        return 1<=len(text)<=maximum and not any(ord(c)<32 and c not in '\n\r\t' for c in text)

    def community_error(error):
        if not request.path.startswith('/community'):
            return error
        messages={400:'คำขอไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่',403:'ไม่มีสิทธิ์ หรือเซสชันหมดอายุ กรุณาโหลดหน้าใหม่หรือเข้าสู่ระบบอีกครั้ง',404:'ไม่พบโพสต์หรือความคิดเห็น อาจถูกลบแล้ว'}
        return render_template('community-error.html',message=messages[error.code]),error.code

    for code in (400,403,404):
        app.register_error_handler(code,community_error)

    def page_number(key='page'):
        raw=request.args.get(key,'1')
        if not raw.isascii() or not raw.isdigit() or len(raw)>5 or not 1<=int(raw)<=10000:
            abort(400)
        return int(raw)

    @app.get('/community')
    @member
    def community_feed():
        page=page_number()
        category=request.args.get('category','')
        query=request.args.get('q','').strip()
        sort=request.args.get('sort','newest')
        if category not in ('',*CATEGORIES) or len(query)>100 or sort not in ('newest','activity'):
            abort(400)
        clauses=[]; params=[]
        if category:
            clauses.append('category=?'); params.append(category)
        if query:
            escaped=query.replace('\\','\\\\').replace('%','\\%').replace('_','\\_')
            clauses.append("(title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')")
            params.extend(['%'+escaped+'%']*2)
        where=' WHERE '+ ' AND '.join(clauses) if clauses else ''
        order='created' if sort=='newest' else 'activity'
        with connect() as db:
            total=db.execute('SELECT count(*) FROM community_posts'+where,params).fetchone()[0]
            rows=[counts(db,dict(r)) for r in db.execute('SELECT * FROM community_posts'+where+f' ORDER BY pinned DESC,{order} DESC,id DESC LIMIT 10 OFFSET ?',[*params,(page-1)*10])]
            people=authors(db,rows)
        def link(n):
            return '/community?'+urlencode(dict(category=category,q=query,sort=sort,page=n))
        return render(posts=rows,people=people,category=category,query=query,sort=sort,page=page,total=total,
                      previous=link(page-1) if page>1 else None,next_page=link(page+1) if page*10<total else None)

    @app.post('/community/posts')
    @member
    def community_create():
        values = {key:request.form.get(key,'').strip() for key in ('title','body','category')}
        values.update({k:request.form.get(k,'') for k in ('link_url','video_url','poll_question','poll_options')})
        try:
            values.update(media.links(request.form))
            values.update({k:request.form.get(k,'') for k in ('poll_question','poll_options')})
            poll=polls.parse(request.form)
            new_files=media.uploads(request)
            ordered,values['body']=blocks.parse(request.form.get('content_blocks'),values['body'],[],new_files)
        except ValueError as exc:
            return render(compose=True,values=values,error=str(exc)),400
        if not valid_text(values['title'],160) or values['category'] not in CATEGORIES:
            return render(compose=True, values=values, error='กรุณากรอกหัวข้อ 1–160 ตัวอักษร เนื้อหา 1–2,000 ตัวอักษร และเลือกหมวดหมู่'),400
        now=time.time()
        with media.transaction(connect,app) as (db,store):
            nonce=request.form.get('nonce') or None
            if nonce:
                duplicate=db.execute('SELECT id FROM community_posts WHERE user_id=? AND nonce=?',(g.user['id'],nonce)).fetchone()
            else:
                duplicate=db.execute('SELECT id FROM community_posts WHERE user_id=? AND title=? AND body=? AND category=? AND created>? ORDER BY id DESC LIMIT 1',
                                     (g.user['id'],values['title'],values['body'],values['category'],now-600)).fetchone()
            if duplicate:
                return redirect(f"/community/posts/{duplicate['id']}",code=303)
            if limited(db,'post'):
                return render(compose=True,values=values,error='โพสต์ได้ไม่เกิน 5 ครั้งใน 10 นาที กรุณารอสักครู่'),429,{'Retry-After':'600'}
            pid=db.execute('INSERT INTO community_posts(user_id,title,body,category,created,updated,activity) VALUES(?,?,?,?,?,?,?)',
                           (g.user['id'],values['title'],values['body'],values['category'],now,now,now)).lastrowid
            media.save_links(db,pid,values)
            db.execute('UPDATE community_posts SET nonce=? WHERE id=?',(nonce,pid))
            new_ids=media.save_files(db,store,pid,new_files)
            blocks.save(db,pid,ordered,new_ids)
            polls.save(db,pid,poll)
        return redirect(f'/community/posts/{pid}',code=303)

    @app.get('/community/posts/<int:pid>')
    @member
    def community_detail(pid):
        return detail(pid)

    def detail(pid,error=None,comment_value='',edit_comment=None):
        page=page_number('comment_page')
        with connect() as db:
            item=find(db,pid)
            if edit_comment:
                position=db.execute('SELECT count(*) FROM community_comments WHERE post_id=? AND (created<? OR (created=? AND id<=?))',
                                    (pid,edit_comment['created'],edit_comment['created'],edit_comment['id'])).fetchone()[0]
                page=max(1,(position+19)//20)
            comments=[dict(r) for r in db.execute('SELECT * FROM community_comments WHERE post_id=? ORDER BY created,id LIMIT 20 OFFSET ?',(pid,(page-1)*20))]
            people=authors(db,[item]+comments)
        return render(item=item,comments=comments,people=people,comment_page=page,comments_more=page*20<item['comments'],error=error,comment_value=comment_value,edit_comment=edit_comment)

    @app.route('/community/posts/<int:pid>/edit', methods=['GET','POST'])
    @member
    def community_edit(pid):
        with media.transaction(connect,app) as (db,store):
            item=find(db,pid)
            if item['user_id'] != g.user['id']:
                abort(403)
            if request.method == 'POST':
                values={key:request.form.get(key,'').strip() for key in ('title','body','category')}
                values.update({k:request.form.get(k,'') for k in ('link_url','video_url','poll_question','poll_options','remove_attachments')})
                values.update(attachments=item['attachments'],poll=item['poll'])
                try:
                    values.update(media.links(request.form))
                    values.update({k:request.form.get(k,'') for k in ('poll_question','poll_options')})
                    poll=polls.parse(request.form)
                    polls.validate_edit(db,pid,poll)
                    new_files=media.uploads(request)
                    ordered,values['body']=blocks.parse(request.form.get('content_blocks'),values['body'],item['attachments'],new_files,request.form.get('remove_attachments',''))
                except ValueError as exc:
                    return render(compose=True,edit_id=pid,values=values,error=str(exc)),400
                if not valid_text(values['title'],160) or values['category'] not in CATEGORIES:
                    return render(compose=True,edit_id=pid,values=values,error='หัวข้อหรือเนื้อหาไม่ถูกต้อง'),400
                try:
                    new_ids=media.save_files(db,store,pid,new_files,request.form.get('remove_attachments',''))
                except ValueError as exc:
                    values['attachments']=item['attachments']
                    return render(compose=True,edit_id=pid,values=values,error=str(exc)),400
                db.execute('UPDATE community_posts SET title=?,body=?,category=?,updated=? WHERE id=?',
                           (values['title'],values['body'],values['category'],time.time(),pid))
                media.save_links(db,pid,values)
                blocks.save(db,pid,ordered,new_ids)
                polls.save(db,pid,poll)
                return redirect(f'/community/posts/{pid}',code=303)
        return render(compose=True,edit_id=pid,values=item)

    @app.post('/community/posts/<int:pid>/delete')
    @member
    def community_delete(pid):
        with media.transaction(connect,app) as (db,store):
            item=find(db,pid)
            if item['user_id'] != g.user['id'] and not moderator():
                abort(403)
            if request.form.get('confirm') != 'delete':
                abort(400)
            media.save_files(db,store,pid,[],','.join(str(a['id']) for a in item['attachments']))
            db.execute('DELETE FROM community_comments WHERE post_id=?',(pid,))
            db.execute('DELETE FROM community_likes WHERE post_id=?',(pid,))
            db.execute('DELETE FROM community_votes WHERE post_id=?',(pid,))
            db.execute('DELETE FROM community_polls WHERE post_id=?',(pid,))
            db.execute('DELETE FROM community_posts WHERE id=?',(pid,))
        return redirect('/community',code=303)

    @app.get('/community/media/<int:aid>')
    @member
    def community_media(aid):
        if not 1<=aid<=9223372036854775807:
            abort(404)
        with connect() as db:
            row=db.execute('SELECT a.* FROM community_attachments a JOIN community_posts p ON p.id=a.post_id WHERE a.id=?',(aid,)).fetchone()
        if not row or not re.fullmatch(r'[a-f0-9]{48}',row['storage']):
            abort(404)
        path=Path(app.config['COMMUNITY_UPLOAD_DIR'])/row['storage']
        if not path.is_file() or path.is_symlink():
            abort(404)
        return send_file(path,mimetype=row['mime'],as_attachment=not row['mime'].startswith('image/'),download_name=row['name'])

    @app.post('/community/posts/<int:pid>/like')
    @member
    def community_like(pid):
        return like(pid)

    @app.post('/community/posts/<int:pid>/vote')
    @member
    def community_vote(pid):
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            item=find(db,pid)
            poll=item['poll']; raw=request.form.get('option','')
            if not poll or raw not in {str(i) for i in range(len(poll['options']))}:
                abort(400)
            choice=int(raw)
            if poll['choice']!=choice:
                if limited(db,'vote'):
                    return detail(pid,error='โหวตหรือเปลี่ยนโหวตได้ไม่เกิน 15 ครั้งใน 10 นาที'),429,{'Retry-After':'600'}
                db.execute('INSERT INTO community_votes VALUES(?,?,?) ON CONFLICT(post_id,user_id) DO UPDATE SET choice=excluded.choice',(pid,g.user['id'],choice))
        return redirect(f'/community/posts/{pid}',code=303)

    def like(pid):
        state=request.form.get('state')
        if state not in ('0','1'):
            abort(400)
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            find(db,pid)
            if state == '1':
                db.execute('INSERT OR IGNORE INTO community_likes VALUES(?,?)',(pid,g.user['id']))
            else:
                db.execute('DELETE FROM community_likes WHERE post_id=? AND user_id=?',(pid,g.user['id']))
        return redirect(f'/community/posts/{pid}',code=303)

    @app.post('/community/posts/<int:pid>/comments')
    @member
    def community_comment(pid):
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            find(db,pid)
            body=request.form.get('body','').strip()
            if not valid_text(body,1000):
                return detail(pid,error='ความคิดเห็นต้องมี 1–1,000 ตัวอักษร',comment_value=body),400
            now=time.time()
            duplicate=db.execute('SELECT id FROM community_comments WHERE user_id=? AND post_id=? AND body=? AND created>? LIMIT 1',(g.user['id'],pid,body,now-600)).fetchone()
            if duplicate:
                return redirect(f'/community/posts/{pid}#comments',code=303)
            if limited(db,'comment'):
                return detail(pid,error='แสดงความคิดเห็นได้ไม่เกิน 15 ครั้งใน 10 นาที กรุณารอสักครู่',comment_value=body),429,{'Retry-After':'600'}
            db.execute('INSERT INTO community_comments(post_id,user_id,body,created,updated) VALUES(?,?,?,?,?)',(pid,g.user['id'],body,now,now))
            db.execute('UPDATE community_posts SET activity=? WHERE id=?',(now,pid))
            total=db.execute('SELECT count(*) FROM community_comments WHERE post_id=?',(pid,)).fetchone()[0]
        return redirect(f'/community/posts/{pid}?comment_page={(total+19)//20}#comments',code=303)

    @app.post('/community/comments/<int:cid>/<action>')
    @member
    def community_comment_action(cid,action):
        if action not in ('edit','delete'):
            abort(404)
        with connect() as db:
            db.execute('BEGIN IMMEDIATE')
            comment=db.execute('SELECT * FROM community_comments WHERE id=?',(cid,)).fetchone()
            if comment is None:
                abort(404)
            if comment['user_id'] != g.user['id'] and not (action=='delete' and moderator()):
                abort(403)
            if action=='delete':
                if request.form.get('confirm') != 'delete':
                    abort(400)
                db.execute('DELETE FROM community_comments WHERE id=?',(cid,))
            else:
                body=request.form.get('body','').strip()
                if not valid_text(body,1000):
                    return detail(comment['post_id'],error='ความคิดเห็นต้องมี 1–1,000 ตัวอักษร',edit_comment={**dict(comment),'body':body}),400
                db.execute('UPDATE community_comments SET body=?,updated=? WHERE id=?',(body,time.time(),cid))
        return redirect(f"/community/posts/{comment['post_id']}#comments",code=303)

    @app.post('/community/posts/<int:pid>/pin')
    @member
    def community_pin(pid):
        if not moderator():
            abort(403)
        state=request.form.get('state')
        if state not in ('0','1'):
            abort(400)
        with connect() as db:
            find(db,pid)
            db.execute('UPDATE community_posts SET pinned=? WHERE id=?',(int(state),pid))
        return redirect(f'/community/posts/{pid}',code=303)
