"""Single-choice polls: only aggregate counts leave the server."""
import json


def migrate(db):
    db.execute('CREATE TABLE IF NOT EXISTS community_polls (post_id INTEGER PRIMARY KEY REFERENCES community_posts(id), question TEXT NOT NULL, options TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS community_votes (post_id INTEGER NOT NULL REFERENCES community_polls(post_id), user_id INTEGER NOT NULL REFERENCES users(id), choice INTEGER NOT NULL, PRIMARY KEY(post_id,user_id))')


def parse(form):
    question=form.get('poll_question','').strip()
    raw=form.get('poll_options','').strip()
    if not question and not raw:
        return None
    options=[v.strip() for v in raw.splitlines()]
    if not 1<=len(question)<=200 or not 2<=len(options)<=6 or any(not 1<=len(v)<=100 for v in options) or len({v.casefold() for v in options})!=len(options) or any(ord(c)<32 for c in question+''.join(options)):
        raise ValueError('โพลต้องมีคำถาม 1–200 ตัวอักษร และ 2–6 ตัวเลือกไม่ซ้ำ ตัวเลือกละไม่เกิน 100 ตัวอักษร')
    return dict(question=question,options=options)


def snapshot(db,pid,uid):
    row=db.execute('SELECT * FROM community_polls WHERE post_id=?',(pid,)).fetchone()
    if not row:
        return None
    options=json.loads(row['options'])
    counts=dict(db.execute('SELECT choice,count(*) FROM community_votes WHERE post_id=? GROUP BY choice',(pid,)).fetchall())
    own=db.execute('SELECT choice FROM community_votes WHERE post_id=? AND user_id=?',(pid,uid)).fetchone()
    return dict(question=row['question'],options=options,counts=[counts.get(i,0) for i in range(len(options))],total=sum(counts.values()),choice=own['choice'] if own else None)


def validate_edit(db,pid,poll):
    existing=db.execute('SELECT * FROM community_polls WHERE post_id=?',(pid,)).fetchone()
    if existing and db.execute('SELECT 1 FROM community_votes WHERE post_id=? LIMIT 1',(pid,)).fetchone():
        if poll is None or poll['question']!=existing['question'] or poll['options']!=json.loads(existing['options']):
            raise ValueError('โพลมีผู้โหวตแล้ว แก้คำถามหรือตัวเลือกไม่ได้ แต่แก้ข้อความโพสต์ได้')


def save(db,pid,poll):
    if poll:
        db.execute('INSERT INTO community_polls VALUES(?,?,?) ON CONFLICT(post_id) DO UPDATE SET question=excluded.question,options=excluded.options',(pid,poll['question'],json.dumps(poll['options'],ensure_ascii=False)))
    else:
        db.execute('DELETE FROM community_polls WHERE post_id=?',(pid,))
