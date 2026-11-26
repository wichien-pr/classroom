"""Independent CTO assessment; no participation, qualification or L9 writes."""
import json
import os
import secrets
import time
from flask import g, request

TEMPLATES = [
    {'id': 'web-booking', 'kind': 'web', 'title': 'ระบบจองอุปกรณ์ทีม', 'requirements': ['สมาชิกดูอุปกรณ์และช่วงเวลาว่าง สร้างและยกเลิกการจองของตนเอง', 'ป้องกันการจองอุปกรณ์เดียวกันในช่วงเวลาซ้อนกันด้วย transaction', 'ผู้ดูแลเพิ่ม/ปิดใช้งานอุปกรณ์ และค้นหาการจองตามวัน'], 'examples': ['A กับ B จองอุปกรณ์เดียวกันเวลาเดียวกันพร้อมกัน: สำเร็จหนึ่งรายการ อีกคนได้ conflict', 'สมาชิก B ยกเลิกการจองของ A: ปฏิเสธโดยไม่เปลี่ยนข้อมูล']},
    {'id': 'web-requests', 'kind': 'web', 'title': 'ระบบคำขอซ่อมภายใน', 'requirements': ['สมาชิกสร้างคำขอ ดูรายละเอียดและติดตามสถานะของตนเอง', 'เจ้าหน้าที่เปลี่ยนสถานะ open → in_progress → resolved พร้อมเหตุผล', 'ค้นหาตามสถานะและช่วงวัน พร้อม pagination และประวัติการเปลี่ยนสถานะ'], 'examples': ['สมาชิก B เปิดคำขอของ A: ปฏิเสธการเข้าถึง', 'เปลี่ยน resolved กลับเป็น open โดยไม่มีนโยบายรองรับ: ปฏิเสธและเก็บประวัติเดิม']},
    {'id': 'batch-sales', 'kind': 'batch', 'title': 'งานสรุปยอดขายรายวัน', 'requirements': ['อ่าน CSV sale_id,date,amount และสรุปยอดตามวันเป็น CSV', 'ตรวจ schema/date/ยอดเงิน เก็บแถวเสียใน reject report พร้อมเหตุผล', 'deduplicate sale_id และรันซ้ำ input เดิมได้โดยไม่เพิ่มยอดซ้ำ พร้อม run manifest'], 'examples': ['sale_id เดิมสองแถว: นับหนึ่งครั้ง; ID เดิมแต่ยอดต่างกัน: reject conflict', '100.25 กับ 20.10 วันเดียวกัน: ยอด 120.35 โดยใช้ decimal ไม่ใช่ float']},
    {'id': 'batch-inventory', 'kind': 'batch', 'title': 'งานกระทบยอดสต็อก', 'requirements': ['อ่าน opening.csv และ movements.csv สร้างยอดปิดตาม SKU', 'ตรวจ movement_id ซ้ำ, SKU ไม่รู้จัก และจำนวนผิดรูปแบบ พร้อม reject report', 'รันซ้ำให้ผลเดิม เขียน output แบบ atomic และมี exit code/สรุปจำนวนแถว'], 'examples': ['ยอดเปิด 10 รับ 5 จ่าย 3: ยอดปิด 12', 'input ผิดหรือ process หยุดก่อน publish: output ชุดก่อนยังครบ ไม่เผยแพร่ไฟล์ครึ่งเดียว']},
]
NONFUNCTIONAL = ['ขอบเขตระดับ 3/5: คนเดียวสร้างหนึ่ง service/CLI และฐานข้อมูลหรือไฟล์ local; ไม่ต้อง microservices, Kubernetes หรือ multi-region', 'web: ข้อมูลตัวอย่าง 1,000 รายการ/ผู้ใช้พร้อมกัน 10 คน; batch: CSV 10,000 แถวไม่เกิน 10 MB จบภายใน 60 วินาทีบนเครื่องที่ระบุ', 'วัดเวลาและทรัพยากรจริง พร้อมระบุเครื่อง/ข้อมูล/คำสั่ง; เป้าหมาย web p95 < 1 วินาทีบน local test ไม่ใช่ SLA production', 'validation, authorization (web), secret ไม่ลง Git/log, error ที่ใช้งานได้, automated tests และ README รันซ้ำได้', 'สำรอง/กู้คืนข้อมูลหรือ output และสาธิต failure/retry อย่างน้อยหนึ่งกรณี']
STEPS = [
    {'title': 'หารือ Requirement กับ CTO', 'tasks': 'นัด CTO อธิบายปัญหา ผู้ใช้ ขอบเขต และคำถามที่ยังไม่รู้ ห้ามเปลี่ยนโจทย์ที่สุ่ม', 'deliverables': 'บันทึกการประชุม วันที่ ผู้ร่วมประชุม คำถาม/คำตอบ ขอบเขตและสิ่งที่ไม่ทำ', 'ai': 'ใช้ AI เตรียมคำถาม แล้วตรวจสมมติฐานกับ CTO'},
    {'title': 'สรุป Requirement กับ CTO', 'tasks': 'แปลงโจทย์เป็น functional/nonfunctional requirements และ acceptance cases ยืนยันขอบเขตระดับ 3', 'deliverables': 'Requirement version + acceptance matrix รวม happy path, invalid input, failure และข้อสรุป CTO', 'ai': 'ให้ Agent ท้าทาย ambiguity แล้วตรวจทุกข้อกับความต้องการจริง'},
    {'title': 'UX/UI — CTO', 'tasks': 'web: wireframe และ user/error flows; batch: CLI flags, input/output schema, exit codes, logs, retry และ operating UX ไม่บังคับทำเว็บ', 'deliverables': 'prototype หรือ CLI examples รวม loading/error/empty/retry และ feedback CTO', 'ai': 'สร้างทางเลือก UX ด้วย AI แล้วบอกเหตุผลที่เลือก/ปฏิเสธ'},
    {'title': 'High-Level Design — CTO', 'tasks': 'วาด component/data flow, trust boundaries และ failure path; เลือกโครงสร้างที่เล็กพอ', 'deliverables': 'HLD diagram + trade-offs + data ownership และแผน recovery', 'ai': 'ให้ AI review จุดล้มเหลว แล้วตรวจความเป็นไปได้เอง'},
    {'title': 'Low-Level Design — CTO', 'tasks': 'กำหนด schema/API หรือ CLI contract, validation, transaction/idempotency และ test cases', 'deliverables': 'LLD, schema, sequence, error contract และ traceability กลับ requirement', 'ai': 'ใช้ Agent ช่วยหา edge cases พร้อมแก้ข้อเสนอที่ไม่ถูกต้อง'},
    {'title': 'Dev + Unit Test / Result / AI Agent', 'tasks': 'พัฒนาตาม design ทดสอบ business invariants, invalid input, concurrency/retry ที่เกี่ยวข้อง และวัดผลจริง', 'deliverables': 'repository/commit, คำสั่งรัน, test report, sample data และผล performance พร้อมบริบท', 'ai': 'บันทึก prompt/ส่วนที่ Agent เขียน การ review และข้อผิดพลาดที่มนุษย์แก้'},
    {'title': 'Deploy / CI/CD', 'tasks': 'สร้าง pipeline test/build/deploy สาธิต clean install, smoke test และ rollback/recovery', 'deliverables': 'pipeline config/run, URL หรือคำสั่ง job, runbook, rollback evidence และ demo CTO', 'ai': 'ใช้ AI ช่วย pipeline/runbook แต่ตรวจ secrets และรันทดสอบจริง'},
]

def install(app, connect):
    raw = app.config.get('CTO_REVIEWER_IDS', os.environ.get('APPWORKS_CTO_REVIEWER_IDS', ''))
    try:
        reviewers = frozenset(int(x) for x in (raw.split(',') if isinstance(raw, str) else raw) if str(x).strip())
    except (ValueError, TypeError):
        raise ValueError('CTO_REVIEWER_IDS must contain explicit integer account IDs')
    raw_emails = app.config.get('CTO_REVIEWER_EMAILS', os.environ.get('APPWORKS_CTO_REVIEWER_EMAILS', os.environ.get('CTO_REVIEWER_EMAILS', '')))
    # Same canonicalization as account login/registration; no spelling aliases.
    reviewer_emails = frozenset(x.strip().lower() for x in raw_emails.split(',') if x.strip())

    def is_reviewer(user):
        return bool(user and (user['id'] in reviewers or user['email'].strip().lower() in reviewer_emails))

    with connect() as db:
        db.execute('CREATE TABLE IF NOT EXISTS cto_projects(user_id INTEGER PRIMARY KEY, snapshot TEXT NOT NULL, created REAL NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS cto_steps(user_id INTEGER NOT NULL, step INTEGER NOT NULL, state TEXT NOT NULL, evidence TEXT NOT NULL, reflection TEXT NOT NULL, feedback TEXT NOT NULL, version INTEGER NOT NULL, PRIMARY KEY(user_id,step))')
        db.execute('CREATE TABLE IF NOT EXISTS cto_history(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, actor INTEGER NOT NULL, step INTEGER NOT NULL, action TEXT NOT NULL, evidence TEXT NOT NULL, reflection TEXT NOT NULL, feedback TEXT NOT NULL, created REAL NOT NULL)')
        db.execute('CREATE TABLE IF NOT EXISTS cto_receipts(actor INTEGER NOT NULL, request_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(actor,request_id))')
        for op in ('UPDATE', 'DELETE'):
            db.execute(f"CREATE TRIGGER IF NOT EXISTS cto_history_no_{op.lower()} BEFORE {op} ON cto_history BEGIN SELECT RAISE(ABORT, 'immutable history'); END")

    def snapshot(db, uid):
        row = db.execute('SELECT snapshot FROM cto_projects WHERE user_id=?', (uid,)).fetchone()
        project = json.loads(row['snapshot']) if row else None
        steps = [dict(r) for r in db.execute('SELECT step,state,evidence,reflection,feedback,version FROM cto_steps WHERE user_id=? ORDER BY step', (uid,))]
        for s in steps:
            s.update(STEPS[s['step']-1], weeks='1–2 weeks*' if s['step'] == 7 else '1 week')
            s['unlocked'] = s['step'] == 1 or steps[s['step']-2]['state'] == 'approved'
        history = [dict(r) for r in db.execute('SELECT * FROM cto_history WHERE user_id=? ORDER BY id', (uid,))]
        return {'project': project, 'steps': steps, 'history': history, 'csrf_token': g.session['csrf'], 'reviewer': is_reviewer(g.user)}

    def mutate(db, uid, data, review=False):
        import uuid
        actor = g.user['id']
        if review and (not is_reviewer(g.user) or actor == uid):
            return {'error': 'reviewer_required_no_self_review'}, 403
        fields = {'action', 'step', 'version', 'request_id'} | ({'feedback'} if review else {'evidence', 'reflection'})
        if not isinstance(data, dict) or set(data) != fields:
            return {'error': 'invalid_fields'}, 400
        if (data['action'] not in (('approved', 'changes_requested') if review else ('save', 'submit'))
                or type(data['step']) is not int or not 1 <= data['step'] <= 7
                or type(data['version']) is not int or data['version'] < 0):
            return {'error': 'invalid_command'}, 400
        try:
            rid = uuid.UUID(data['request_id'])
            if rid.version != 4 or str(rid) != data['request_id']:
                raise ValueError()
        except (ValueError, TypeError, AttributeError):
            return {'error': 'invalid_request_id'}, 400
        for key in ('feedback',) if review else ('evidence', 'reflection'):
            if not isinstance(data[key], str) or len(data[key]) > 3000 or '\x00' in data[key]:
                return {'error': 'invalid_text'}, 400
            if (review or data['action'] == 'submit') and not data[key].strip():
                return {'error': 'evidence_reflection_feedback_required'}, 400
        db.execute('BEGIN IMMEDIATE')
        if not db.execute('SELECT 1 FROM sessions WHERE token_hash=? AND user_id=? AND expires>?', (g.session['token_hash'], actor, time.time())).fetchone():
            return {'error': 'session_expired'}, 401
        payload = json.dumps([uid, data], sort_keys=True)
        previous = db.execute('SELECT payload FROM cto_receipts WHERE actor=? AND request_id=?', (actor, str(rid))).fetchone()
        if previous:
            return snapshot(db, uid) if previous['payload'] == payload else ({'error': 'request_id_conflict'}, 409)
        row = db.execute('SELECT * FROM cto_steps WHERE user_id=? AND step=?', (uid, data['step'])).fetchone()
        if not row:
            return {'error': 'project_not_started'}, 404
        if row['version'] != data['version']:
            return {'error': 'stale_version_reload'}, 409
        if review:
            if row['state'] != 'submitted':
                return {'error': 'not_submitted'}, 409
            state, evidence, reflection, feedback = data['action'], row['evidence'], row['reflection'], data['feedback']
        else:
            if row['state'] not in ('draft', 'changes_requested'):
                return {'error': 'step_readonly'}, 409
            if data['step'] > 1 and db.execute('SELECT state FROM cto_steps WHERE user_id=? AND step=?', (uid, data['step']-1)).fetchone()['state'] != 'approved':
                return {'error': 'previous_step_not_approved'}, 409
            state = 'submitted' if data['action'] == 'submit' else row['state']
            evidence, reflection, feedback = data['evidence'], data['reflection'], row['feedback']
        db.execute('UPDATE cto_steps SET state=?,evidence=?,reflection=?,feedback=?,version=version+1 WHERE user_id=? AND step=?', (state, evidence, reflection, feedback, uid, data['step']))
        db.execute('INSERT INTO cto_history(user_id,actor,step,action,evidence,reflection,feedback,created) VALUES(?,?,?,?,?,?,?,?)', (uid, actor, data['step'], data['action'], evidence, reflection, feedback, time.time()))
        db.execute('INSERT INTO cto_receipts VALUES(?,?,?)', (actor, str(rid), payload))
        return snapshot(db, uid)

    @app.get('/api/cto-project/review')
    def cto_review_list():
        if not is_reviewer(g.user):
            return {'error': 'reviewer_required'}, 403
        # Explicit keyset pagination, no hidden truncation of account-wide review.
        try:
            after = int(request.args.get('after', 0))
        except ValueError:
            return {'error': 'invalid_cursor'}, 400
        with connect() as db:
            rows = db.execute('SELECT p.user_id,u.name FROM cto_projects p JOIN users u ON u.id=p.user_id WHERE p.user_id>? AND p.user_id!=? ORDER BY p.user_id LIMIT 51', (after, g.user['id'])).fetchall()
            return {'projects': [{'user_id': r['user_id'], 'name': r['name'], **snapshot(db, r['user_id'])} for r in rows[:50]], 'next': rows[49]['user_id'] if len(rows)>50 else None}

    @app.post('/api/cto-project/review/<int:uid>')
    def cto_review(uid):
        if not g.user:
            return {'error': 'authentication_required'}, 401
        with connect() as db:
            return mutate(db, uid, request.get_json(silent=True), review=True)


    @app.route('/api/cto-project', methods=['GET', 'POST'])
    def cto_project():
        if not g.user:
            return {'error': 'authentication_required'}, 401
        uid = g.user['id']
        with connect() as db:
            if request.method == 'POST':
                data = request.get_json(silent=True)
                if data != {'action': 'start'}:
                    return mutate(db, uid, data)
                db.execute('BEGIN IMMEDIATE')
                if not db.execute('SELECT 1 FROM sessions WHERE token_hash=? AND user_id=? AND expires>?', (g.session['token_hash'], uid, time.time())).fetchone():
                    return {'error': 'session_expired'}, 401
                if not db.execute('SELECT 1 FROM cto_projects WHERE user_id=?', (uid,)).fetchone():
                    project = {**secrets.choice(TEMPLATES), 'difficulty': 3, 'bank_version': 1, 'nonfunctional': NONFUNCTIONAL}
                    db.execute('INSERT INTO cto_projects VALUES(?,?,?)', (uid, json.dumps(project, ensure_ascii=False), time.time()))
                    db.executemany('INSERT INTO cto_steps VALUES(?,?,\'draft\',\'\',\'\',\'\',0)', [(uid, s) for s in range(1,8)])
            return snapshot(db, uid)
