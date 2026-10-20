# Appworks Classroom

เว็บแอป Flask + SQLite สำหรับสมัครสมาชิก เข้าสู่ระบบ และออกจากระบบ พร้อม Classroom ภาษาไทยเดิมและการ์ด Scale Lab

## เริ่มใช้งาน

```sh
cd /Users/prommeesee/Documents/04_Learning/classroom/appworks
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
umask 077
.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call app:create_app
```

เปิด **http://127.0.0.1:8080/** → สมัครสมาชิก → เข้าสู่ระบบ ไม่ได้สร้างบัญชีเริ่มต้นให้
พอร์ต 8081 มี Docker/nginx ของแอปอื่นใช้อยู่ จึงใช้ 8080 แทน โดยหยุด `python http.server` ของต้นแบบแล้ว ห้ามใช้ static server เสิร์ฟโฟลเดอร์นี้ เพราะจะเปิดเผยฐานข้อมูลและซอร์สโค้ด

ฐานข้อมูลสร้างอัตโนมัติที่ `instance/classroom.sqlite3` เปลี่ยนได้ด้วย `APPWORKS_DATABASE=/absolute/path/file.sqlite3` สำรองฐานข้อมูลเมื่อหยุดเซิร์ฟเวอร์ เก็บไฟล์สำรองเป็นข้อมูลส่วนบุคคล
ต้นแบบเก่าเก็บไว้ใน `backups/prototype.html` ซึ่งไม่มี public route

## ทดสอบ

```sh
.venv/bin/python -m pytest -q
.venv/bin/python -m compileall -q app.py
```

Tests ใช้ฐานข้อมูลชั่วคราวของ pytest แยกจากบัญชีจริง ครอบคลุม registration/hash, normalized unique email, validation, login, session persistence/rotation/expiry, logout/replay, CSRF/Origin, throttling, cookie flags และป้องกันดาวน์โหลด private files
พัฒนาแบบ vertical RED → GREEN ทีละพฤติกรรม ไม่สร้าง test accounts ในฐานข้อมูลจริง

Browser QA ใช้เซิร์ฟเวอร์แยกและไฟล์ `instance/browser-test.sqlite3`:

```sh
APPWORKS_DATABASE=instance/browser-test.sqlite3 .venv/bin/waitress-serve --listen=127.0.0.1:8082 --call app:create_app
```

ตรวจสมัครสมาชิก → รหัสผ่านผิด → เข้าสู่ระบบ → Classroom → ออกจากระบบ → เข้าหน้าป้องกันไม่ได้ รวมถึง layout มือถือ 390px และ desktop 1280px

## HTTP interface

บัญชีใช้ server-rendered HTML/form endpoints; ความคืบหน้าใช้ JSON API แยก:

- `GET /register`, `GET /login`: HTML พร้อม hidden `csrf_token` และ session cookie
- `POST /register`: `name`, `email`, `password`, `csrf_token`; สำเร็จ 303 ไป `/login`, input ผิด 400, email ซ้ำ 409
- `POST /login`: `email`, `password`, `csrf_token`; สำเร็จ 303 ไป `/`, ผิด 401 ข้อความเหมือนกันไม่ว่า email มีอยู่หรือไม่, เกิน limit 429
- `GET /`: ต้อง login มิฉะนั้น 303 ไป `/login`
- `POST /logout`: `csrf_token`; ลบ session ฝั่งฐานข้อมูลและ cookie แล้ว 303 ไป `/login`
- ทุก POST ต้องมี CSRF ตรงกับ session; foreign Origin/cross-site ถูกปฏิเสธ 403

## ความปลอดภัยและข้อจำกัด

- รหัสผ่าน 12–128 ตัวอักษร เก็บ Werkzeug scrypt hash ไม่เก็บ plaintext; email trim + lowercase และ unique constraint; SQL ใช้ parameters
- Session token สุ่ม 256 bits เก็บเฉพาะ SHA-256 hash ใน SQLite อายุ 8 ชั่วโมงแบบ absolute ทั้ง anonymous/authenticated; เปลี่ยน token เมื่อ login และลบทิ้งเมื่อ logout
- Cookie `HttpOnly`, `SameSite=Lax`; local HTTP ไม่ตั้ง Secure สำหรับ HTTPS ตั้ง `APPWORKS_COOKIE_SECURE=1` และตั้งค่า reverse proxy/Origin ให้ถูกต้องก่อนเปิดใช้งานจริง
- จำกัด login ผิด 5 ครั้ง/IP ใน 15 นาที เก็บใน SQLite และล้างเมื่อ login สำเร็จ ไม่เชื่อ X-Forwarded-For; ผู้ใช้หลัง NAT อาจกระทบกัน ยังไม่มี distributed/account rate limit หรือ register/CAPTCHA limit
- ไม่มี email verification, password reset, MFA, roles/admin หรือระบบ audit เหมาะกับ local development ไม่ใช่ production deployment สำเร็จรูป
- ไม่เปิด static directory; ไม่มี route ดาวน์โหลด DB/source; responses ใช้ no-store และป้องกัน framing; CSP ยังอนุญาต inline script/style เพื่อคง prototype เดิม
- Classroom แสดงความคืบหน้าจาก SQLite ตามบัญชี/คอร์ส/stable lesson ID; `GET/POST /api/courses/<id>/progress` ใช้ session เดิมและ POST JSON ต้องส่ง `X-CSRF-Token` จาก GET พร้อมผ่าน Origin check ดูรายละเอียด [course contract](../docs/course-contract.md)
- คอร์ส opt in ด้วย `lessons` ใน manifest; Scale Lab integrated mode ไม่อ่าน/นำเข้า localStorage เดิม ส่วน standalone ยังเก็บในเบราว์เซอร์
- Scale Lab ย้ายไป `../courses/scale-lab` เปิดผ่าน `/courses/scale-lab/` หลัง login; assets ทุกไฟล์ต้องผ่าน session เช่นกัน ไม่ใช้พอร์ต 5173 ใน integrated mode
- ก่อนเริ่ม server รัน `cd .. && python3 scripts/courses.py build && python3 scripts/courses.py validate && cd appworks`; วิธีเพิ่ม/ปิด/ลบคอร์สและ standalone ดู [README กลาง](../README.md) และ [course contract](../docs/course-contract.md)
- SQLite เหมาะกับโหลดเล็ก ควรมี HTTPS, backups, monitoring, rate limits เพิ่มเติมและ migration strategy ก่อนเผยแพร่สาธารณะ
- หยุดเซิร์ฟเวอร์ด้วย Ctrl+C เมื่อรัน foreground; bind เฉพาะ loopback โดยค่าเริ่มต้น
