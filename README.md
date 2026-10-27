# Classroom — Modular courses

## Active Docker deployment — account-only migration

**http://localhost:8082** now serves one imported host account from fresh external volume `classroom-accounts-20261022`, without learning/activity/community history or uploads. Original host DB and old QA volume are preserved. Host **http://localhost:8080** has also been restarted separately with its original accounts/history and the Estimate Lab completion-strip fix; Docker 8082 was not updated by that host deployment. Account timestamps/password hash are unchanged, photo reference cleared, derived level starts at L1.

```sh
# Always select the existing project and BOTH Compose files:
sh scripts/classroom-compose.sh config --quiet
sh scripts/classroom-compose.sh ps
sh scripts/classroom-compose.sh up -d --no-build --no-deps --wait --wait-timeout 180 classroom
```

See [active operations and account-only migration](docs/account-only-migration.md). Never run the old QA fixture verifier on this volume. Real mail settings are retained, but no email or real-user login was tested. Plain Compose now requires explicit `CLASSROOM_DATA_VOLUME` selection to prevent accidental reversion.

## Historical Docker setup (not the active deployment)

The examples below require a separately pre-created external volume and explicit `CLASSROOM_DATA_VOLUME=<that-volume>`. Do not use the active account volume with another project. Older rollout/verification sections describe their original state, not the current deployment.

```sh
# รันจาก root ของ repository; ต้องมี Docker Compose 2.30+
cp -n docker/runtime.env.example docker/runtime.env
chmod 600 docker/runtime.env
# ตั้งค่า mail provider / origin ใน runtime.env แบบ private ก่อนเปิดรับสมัคร
# QA container ใช้ 8082 อยู่: เปลี่ยน CLASSROOM_PORT=8083 หากต้องเปิดอีก stack
export CLASSROOM_PORT=8083
docker compose -p classroom -f compose.yaml config --quiet
docker compose -p classroom -f compose.yaml build
docker compose -p classroom -f compose.yaml up -d --no-build --wait --wait-timeout 180
```

เปิด http://localhost:8083 — build จาก source ใน checkout นี้โดยไม่เขียนทับ host `dist` ใช้ non-root runtime และ named volume เก็บ SQLite/รูป/ไฟล์แนบถาวร ค่าเริ่มต้น mail ปิดเพื่อความปลอดภัย **ไม่ได้ข้าม OTP**; ต้องตั้งค่า Graph/SMTP ก่อนสมัครสมาชิกใหม่ ใช้เพียงหนึ่ง instance ต่อฐานข้อมูล SQLite

ทดสอบ image จริงบน linux/arm64 แล้ว: **414 backend + 7 Node + 36 container integration/persistence checks ผ่าน** พร้อม backup/restore แยก volume; QA ที่ http://localhost:8082 ยัง healthy ไม่แทน production 8080 ดู [คู่มือ Docker, prebuilt image, secrets, backup/restore, migration และหลักฐาน](docs/docker-deployment.md)


## LAB12 addition (isolated, not deployed)

Adds `database-scaling` with `evaluate-data-tier`, preserving retired Shard history. Current proposed curriculum: **12 lessons / 44 active definitions**. Earlier totals below describe previous revisions. See [LAB12 verification](docs/lab12-verification.md) for source mapping, limits and actual test results.

## LAB11 Logging, metrics & automation — deployed locally

Deployed at http://127.0.0.1:8080/ with manifest, private bank and compiled assets coordinated. All four build files match the isolated browser-tested build. Database integrity, preexisting data/sessions and uploads were preserved; only anonymous health-check sessions were added. Port 8081 remains untouched. Reload existing tabs. Backup: `backups/lab11-20261021T085417Z`; verification: `evidence/lab11/deployment.json`. Authenticated production interaction was not rerun. No commit or push performed.

### Pre-deployment implementation verification

Isolated `classroom-lab11` replaces Sharding with a fresh `logging-operations` identity grounded in the supplied PDF. Compare local/central logs, inspect three metric levels and step through a gated CI pipeline. Retired Shard/Observe history is retained without qualifying the new lesson. **11 lessons / 41 active actions**; Node **70**, backend **403**, compiled browser **87**, account UI **15** passed, plus two-account OTP and same-DB restart QA. No deployment, staging, commit or push. See [LAB11 verification](docs/lab11-verification.md). Earlier sections describe historical releases.

## LAB10 Message queue — deployed locally

LAB10 is deployed at http://127.0.0.1:8080/. Manifest, private assessment bank and compiled assets were released together; all four build-file hashes match the isolated tested build. SQLite integrity and preservation of existing data/uploads were verified. Port 8081 was left untouched. Reload existing course tabs. Deployment evidence: `evidence/lab10/deployment.json`; backup: `backups/lab10-20261021T081014Z`. No commit or push was performed. The LAB09 forward-reference remains unchanged. The implementation report below records the pre-deployment verification stage.

## LAB10 Message queue — pre-deployment verification

Isolated worktree `classroom-lab10` replaces Multi-region with a new `message-queue` identity: Thai photo-job queue experiment, independent outages, worker scaling and private assessment. Retired history does not qualify the replacement. **11 lessons / 39 active action definitions**; Node **66**, backend **401**, compiled browser **83**, account UI **15** passed, plus two-account real local OTP and same-DB restart QA. No staging/commit/push/deployment or production services touched. See [source mapping, evidence and limitations](docs/lab10-verification.md). Earlier sections below describe historical releases.

## LAB08 Stateless web tier — deploy ในเครื่องแล้ว

เปิดใช้งานที่ http://127.0.0.1:8080/ หลังได้รับอนุญาตและสำรอง DB/uploads/dist แล้ว Build ทุกไฟล์ตรงกับ isolated integrated QA; ตรวจ login 200 และ guest course/assets redirect 303 ข้อมูลบัญชี/ประวัติเดิมคงอยู่ ไม่แตะพอร์ต 8081

แทน Queue ด้วยบทใหม่ `stateless-web` ไม่โอนคะแนนหรือประวัติ Queue/Session: **11 Labs / 38 active action definitions** จาก manifest ต้องมี manual + simulation + thinking ของบทใหม่ ตรวจ Node **59**, backend **399**, browser **40**, account browser **15** และ compiled standalone / real OTP QA ครบ 38 actions รวมสองบัญชี, dedup/retry/concurrency และ restart DB เดิม ภาพ 320/390/1440px

Manifest/private bank เป็น dynamic-read จึงต้อง release คู่กับ compiled client; **reload แท็บเดิมก่อนเรียนต่อ** ไม่มีการล้างหรือแปลงประวัติและ frozen exam snapshots ดู [ผล QA, deployment, backup และ hashes](docs/lab08-verification.md). รายงาน LAB07/LAB06 ด้านล่างเป็นประวัติรุ่นก่อน

## LAB07 CDN — deploy ในเครื่องแล้ว

LAB07 สอนการส่งไฟล์ static ผ่าน CDN พร้อมภาพเส้นทาง HIT/MISS, การแยก CDN จาก cache ข้อมูล และตัวทดลอง TTL, รูปเก่า, invalidation, URL รุ่นใหม่ และทางสำรองเมื่อ CDN ล่ม ใช้ภาษาไทยและไม่แสดงชื่อไฟล์หรือหน้าอ้างอิงในบทเรียน

คง **11 Labs / 38 durable action definitions** และ stable ID `cdn` / `decision` เดิม การตั้งสถานการณ์และรีเซ็ตไม่เพิ่มคะแนน ไม่แก้ manifest, backend, ฐานข้อมูลหรือประวัติสอบ บัญชียังคงต้องทำ manual + simulation + thinking; ประวัติ CDN เดิมไม่ถูกล้าง

ตรวจผ่าน Node **55**, backend **398**, browser **37**, account browser **15** และ compiled standalone/บัญชี OTP บน QA 8128 แยกต่างหาก รวมการเริ่ม process ใหม่บน DB เดิม ตรวจ 320/390/1440px และปิด QA แล้ว จากนั้น deploy ตามอนุมัติที่ http://127.0.0.1:8080/ โดยสำรอง DB/uploads/dist และตรวจไฟล์เผยแพร่ตรงกับ QA build ทุกไฟล์ ข้อมูลเดิมคงอยู่และไม่แตะพอร์ต 8081 ดู [source map, commands, hashes และผลตรวจ LAB07](docs/lab07-verification.md). รายงาน LAB06 ด้านล่างเป็นประวัติรุ่นก่อน

## LAB06 Cache — แทน Session (deploy ในเครื่องแล้ว)

หลักสูตรปัจจุบันมี **11 Labs**: flow → workload → stock → balance → replica → **cache** → cdn → queue → observe → region → shard. นำ Session ออกจากบทเรียนและ assessment ที่ใช้งาน ไม่สลับหรือเปลี่ยนประวัติ Session ให้เป็น Cache; Cache ใช้ stable ID และปุ่มคะแนนเดิม รวมหลักสูตรมี **38 durable button definitions** (16 simulation + 22 thinking) ไม่ใช่ 39 คะแนนประวัติ Session ยังคงอยู่ จึงไม่ควรถือ 38 เป็นเพดานคะแนนเก่าของบัญชี

LAB06 เพิ่มเนื้อหาไทย ภาพวาดเส้นทาง hit/miss และ failure ทดลอง TTL แบบกดเวลาเอง, stale data, invalidation, cache ล่มและ DB fallback โดยไม่มีการอ้างไฟล์หรือหน้าเอกสารบนบทเรียน อ่าน [source mapping และผลตรวจจริง](docs/lab06-verification.md). Standalone เก็บประวัติ stable ID รวมบทที่เลิกใช้ แต่ไม่นับ Session ในความคืบหน้าปัจจุบัน ระบบบัญชีไม่ migrate/reset DB หรือ exam snapshots เดิม

**Deploy ในเครื่องแล้วที่ http://127.0.0.1:8080/** หลังสำรอง SQLite, uploads และ dist เดิม พร้อมตรวจ preservation และ readiness ดูรายละเอียดและข้อจำกัดของ QA/build แต่ละรอบใน [รายงาน LAB06](docs/lab06-verification.md). เนื้อหาย่อล่าสุดใช้หัวข้อ “ข้อมูลที่ใช้บ่อย งานที่ใช้เวลานาน ไม่ต้องทำซ้ำทุกครั้ง”. ไม่แก้ credentials หรือแตะพอร์ต 8081; ผล LAB05 ใน [รายงานเดิม](docs/lab05-verification.md) เป็นประวัติ ไม่ใช่หลักฐานของ LAB06

## ยืนยันอีเมลตอนสมัครสมาชิก

บัญชีใหม่ต้องกรอกรหัสยืนยัน 6 หลักที่ส่งทางอีเมลก่อนสร้างบัญชีและเข้าสู่ระบบ รหัสมีอายุ 10 นาที ผิดได้ไม่เกิน 5 ครั้ง ส่งใหม่ทุก 60 วินาที (รวมไม่เกิน 3 ครั้ง) พร้อมจำกัดอีเมล/IP ถาวรในฐานข้อมูล ใช้ Microsoft Graph/SMTP ที่ตั้งไว้แล้ว หากส่งไม่สำเร็จจะไม่ข้ามการยืนยัน บัญชีเดิมยังใช้ได้และไม่เติมวันที่ยืนยันย้อนหลัง ดู [contract/config/rollout](docs/registration-contract.md) และ [ผลตรวจจริง](docs/registration-verification.md) **ยังไม่ deploy หรือส่งอีเมลผ่าน provider จริง**

## ลืมรหัสผ่านทางอีเมล

หน้าเข้าสู่ระบบมี **ลืมรหัสผ่าน?** → ขออีเมล → ตั้งรหัสผ่านใหม่และเข้าสู่ระบบอีกครั้ง ลิงก์หมดอายุใน 30 นาที ใช้ได้ครั้งเดียว และยกเลิก session เดิมทั้งหมดของบัญชีเมื่อสำเร็จ โดยไม่ลบข้อมูลการเรียนรู้ ระบบส่งข้อความตอบกลับแบบไม่เปิดเผยว่ามีบัญชีหรือไม่

**เพิ่ม Microsoft Graph app-only แล้ว แต่ยังไม่ deploy/ส่ง reset email จริงในงานนี้**: เลือก `APPWORKS_RESET_TRANSPORT=graph`, ใช้ OUTLOOK credentials ที่ provision ไว้ และกำหนด canonical origin ก่อนเปิดส่ง ระบบ `service:create_app` โหลด `appworks/.env` แบบ private โดย process environment มีลำดับสูงกว่า ส่วน `app:create_app` สำหรับ QA ไม่โหลดไฟล์นี้ ดู [contract/config/backup](docs/password-reset-contract.md), [ผล Graph TDD/browser และ deployment handoff](docs/password-reset-graph-verification.md), และ `appworks/.env.password-reset.example`. Graph QA ใช้ 8119 กับ DB/compiled assets/HTTP double แยก ไม่แตะ production 8080/8081 หรือ dist เดิม

## Community ใช้งานจริง

เปิด **Community** ในเมนูหรือ `/community` หลังเข้าสู่ระบบ: เขียน/แก้ไข/ลบโพสต์ของตนเอง เลือกหมวดหมู่ ค้นหา เรียงโพสต์ใหม่หรือบทสนทนาล่าสุด กดถูกใจ/เลิกถูกใจ และเพิ่ม/แก้ไข/ลบความคิดเห็น มีการแบ่งหน้า ชื่อผู้ใช้ รูปโปรไฟล์และระดับจริงจากคลาส พร้อมจำนวนสมาชิกจริงและลิงก์ Leaderboards ไม่สร้างโพสต์/สมาชิก/สถิติตัวอย่างในฐานข้อมูลจริง

รองรับข้อความธรรมดา (หัวข้อ 160 / เนื้อหา 2,000 / ความคิดเห็น 1,000 ตัวอักษร) พร้อม **composer แบบ dialog**: แนบ JPEG/PNG/WebP ภาพนิ่ง, GIF ของคุณเอง, PDF/TXT สูงสุด 4 ไฟล์ ไฟล์ละ 5 MiB รวม 20 MiB; ลิงก์ http/https, ลิงก์วิดีโอ YouTube/Vimeo (เปิดภายนอกเมื่อคลิก ไม่มี embed/การดึง preview), อีโมจิ Unicode และโพล 2–6 ตัวเลือกหนึ่งเสียงต่อสมาชิก เปลี่ยนเสียงได้ แต่แก้โครงสร้างโพลหลังมีโหวตไม่ได้ มี preview/นำไฟล์ออก/ยกเลิกร่าง/validation และฟอร์ม fallback เมื่อปิด JS ไม่ใช้บริการ GIF ภายนอก เอกสารดาวน์โหลดเท่านั้นและไม่ได้สแกนไวรัส

โพสต์ได้ 5 ครั้ง/10 นาที ความคิดเห็นและการโหวต/เปลี่ยนโหวต 15 ครั้ง/10 นาที มี CSRF/Origin/ownership และการยืนยันก่อนลบ การใช้งาน Community **ไม่เพิ่มระดับหรือกิจกรรมการเรียนรู้** ไม่มีอีเมลแจ้งเตือน ผู้ดูแลปักหมุด/ลบได้เฉพาะเมื่อ operator กำหนด `COMMUNITY_MODERATOR_IDS` (default ว่าง)

ไม่มี dependency ใหม่ (ใช้ Pillow 12.3.0 ที่ pin อยู่แล้ว) Migration additive เพิ่มคอลัมน์ link/video/nonce และตาราง attachments/polls/votes ไม่แก้บัญชี/วันสมัคร/progress เดิม ไฟล์เก็บส่วนตัวที่ `<database-directory>/community-uploads` หรือ `APPWORKS_COMMUNITY_UPLOAD_DIR` (**ห้ามเปิดเป็น static directory**) ให้เจ้าของ process **backup SQLite พร้อมโฟลเดอร์ไฟล์ แล้ว restart production 8080** ไม่ต้อง rebuild คอร์ส ดู [contract](docs/community-contract.md) และ [ผล composer QA](docs/community-composer-verification.md)

QA composer: `appworks/.venv/bin/python scripts/composer-qa-server.py` บน **8101** แยก DB/รูป/ไฟล์ แล้ว `node scripts/composer-browser-verify.mjs`; หลังหยุดเฉพาะ QA แล้วเริ่ม `--resume` ใช้ `node scripts/composer-restart-verify.mjs` ตรวจ persistence. Community regressions เดิมใช้ `scripts/community-qa-server.py` บน 8100 และ `scripts/community-browser-verify.mjs`


## Activity ปฏิทินการใช้งานจริง

ด้านขวาของการ์ด `/account/profile` และ `/members/<id>` มีปฏิทิน 53 สัปดาห์ (มือถืออยู่ใต้การ์ด) กดวันที่เพื่อดูจำนวน **เข้าสู่ระบบ / เปิดคอร์ส / เรียนจบ** แยกกัน วันเรียนรู้ไม่นับการ login อย่างเดียว สีเขียวตามจำนวนกิจกรรม มีคำอธิบาย “นับอย่างไร” และข้อมูลก่อนเริ่มเก็บเป็นช่องลาย **ไม่เติมประวัติย้อนหลัง**

บันทึก SQLite จากเซิร์ฟเวอร์: login สำเร็จวันละครั้ง, เปิดคอร์สต่อคอร์สวันละครั้ง, เรียนจบเฉพาะ progress ที่เพิ่มใหม่ กดซ้ำ/โหลดใหม่/โหลดรูปหรือ API ไม่เพิ่มจำนวน วันที่อิง Asia/Bangkok (UTC+07) ไม่ใช้วันที่หรือ user ID ที่ browser ส่งมา ไม่เก็บ IP/URL/user agent ใน activity และไม่เผยรหัสคอร์ส/บทหรืออีเมลในปฏิทิน การเปิดคอร์สไม่ใช่หลักฐานว่าอ่านจบ และการเรียนจบไม่ใช่คะแนนสอบ

Migration additive เพิ่ม `activity_tracking` (เวลาเริ่มเก็บถาวร) และ `activity_events` (unique member/day/type/subject) ไม่แก้ `joined_at` หรือข้อมูลเดิม เจ้าของ server ต้อง backup แล้ว restart 8080 เพื่อเริ่มเก็บจริง ส่วน QA ใช้ 8099/DB/รูป/คอร์สแยกทั้งหมด ดู [activity contract](docs/activity-contract.md) และ [ผลตรวจจริง](evidence/activity-verification.md)


## การ์ดโปรไฟล์และแก้ไขข้อมูล

เปิด `/account/profile` เพื่อดูรูป วงแหวน Level จริง ชื่อ `@username` ประวัติ วันที่สมัคร และการใช้งานล่าสุด กด **แก้ไขโปรไฟล์** เพื่อแก้ชื่อ (1–80 ตัว), username (3–32 ตัว a–z/0–9/_/- ไม่ใส่ @) และประวัติข้อความธรรมดา (ไม่เกิน 500 ตัว) ชื่อผู้ใช้ไม่ซ้ำและแปลงเป็นตัวพิมพ์เล็ก ลิงก์ชื่อใน Leaderboards เปิด `/members/<id>` ได้เฉพาะสมาชิกที่เข้าสู่ระบบ ไม่เปิดอีเมลหรือปุ่มแก้ไขของคนอื่น ไม่มี followers/following หรือสถิติแต่งขึ้น

วงแหวนคำนวณจำนวน **คอร์สทั้งคอร์ส** ภายในช่วงระดับปัจจุบัน ไม่ใช่คะแนน: L1 เริ่ม 0/1; L8 แสดงรอสอบ ≥95%; L9 เต็มพร้อมข้อความยินดี การใช้งานล่าสุดบันทึกจากคำขอที่ยืนยันตัวตนสำเร็จไม่ถี่กว่า 1 นาที ไม่ใช่สถานะออนไลน์สดและไม่อัปเดตเพราะโหลดรูป เปิดหน้าของตนเองแสดงใช้งานตอนนี้

Migration เพิ่ม `username`, `bio`, `joined_at`, `last_active_at` และ unique index/trigger แบบ additive บัญชีเก่าใช้ `member-<id>` ซึ่งไม่เปิดเผยชื่อหรืออีเมล **วันที่สมัครเดิมที่ไม่เคยเก็บยังเป็น NULL** และแสดง “ไม่ทราบวันที่สมัคร” ไม่ใส่วันที่ migration แทน วันที่สมัครใหม่ใช้เวลา UTC ของเซิร์ฟเวอร์ ไม่มี dependency ใหม่ในงานการ์ดนี้ ต้องสำรอง SQLite/รูปก่อนให้เจ้าของ process restart 8080 เพื่อโหลด backend และ template รุ่นเดียวกัน

QA แยก DB/รูป/คอร์สสังเคราะห์: `appworks/.venv/bin/python scripts/profile-card-qa-server.py` (8097) แล้ว `node scripts/profile-card-browser-verify.mjs` ดู [contract](docs/profiles-contract.md) และ [ผลตรวจการ์ด](docs/profile-card-verification.md)

## รูปโปรไฟล์บัญชี

กดรูป/ชื่อที่ header เพื่อเปิด `/account/profile` แล้วกด **แก้ไขโปรไฟล์** เพื่อเลือกภาพ ดูตัวอย่าง แล้วบันทึกหรือลบภาพใน `/account/profile/edit` (หน้าดูโปรไฟล์ไม่มีปุ่มอัปโหลด/ลบ) รูปแสดงใน Classroom, โปรไฟล์ และ Leaderboards สำหรับสมาชิกที่เข้าสู่ระบบเท่านั้น รองรับ JPEG/PNG/WebP ภาพนิ่งไม่เกิน 5 MiB ด้านละ 32–4096 px รวมไม่เกิน 12 ล้านพิกเซล ระบบย่อเป็น JPEG ไม่เกิน 256 × 256 และลบ metadata; ไม่มีรูปใช้ตัวอักษรย่อ

ติดตั้ง dependency ใหม่ก่อน restart: `cd appworks && .venv/bin/pip install -r requirements.txt` (Pillow 12.3.0) Migration เพิ่ม `users.photo_ref` โดยไม่ reset ข้อมูล รูปเก็บใน `appworks/instance/profile-photos` หรือ `APPWORKS_PROFILE_UPLOAD_DIR`; สำรอง DB และรูปคู่กัน ดู [profile contract](docs/profiles-contract.md) และ [verification](docs/profiles-verification.md). QA ใช้ `scripts/profile-qa-server.py` และ `scripts/profile-browser-verify.mjs` บน 8096 แยก DB และรูปทั้งหมด เจ้าของ process ต้องสำรอง DB แล้ว restart production 8080 เองเพื่อโหลด backend ใหม่


โครงสร้าง: `appworks/` ดูแลบัญชี/session/SQLite และ catalog; `courses/<id>/` เป็นแอปคอร์สอิสระ; `scripts/` สำหรับ build/validate; `docs/course-contract.md` คือสัญญาการเชื่อมต่อ

## เริ่มใช้งาน / local deployment

```sh
cd /Users/prommeesee/Documents/04_Learning/classroom
cd courses/scale-lab && npm ci && cd ../..
python3 scripts/courses.py build
python3 scripts/courses.py validate
cd appworks
# เฉพาะติดตั้งครั้งแรก: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
umask 077
.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call app:create_app
```

เปิด http://127.0.0.1:8080/ สมัคร/เข้าสู่ระบบแล้วเปิด Scale Lab ที่ `/courses/scale-lab/` ไม่ต้องเริ่ม Vite อีกตัว ทุก asset ต้องผ่าน session ด้วย ฐานข้อมูลเดิม `appworks/instance/classroom.sqlite3` ไม่ย้าย/ไม่ reset ห้ามใช้ static server เสิร์ฟ classroom ทั้งโฟลเดอร์ และอย่าแตะพอร์ต 8081 ของแอปอื่น

## เพิ่ม / ปิด / ลบคอร์ส

1. สร้าง `courses/<id>/` ให้มีซอร์ส, package.json และ npm build ของตนเอง; ห้าม import platform หรือคอร์สอื่น
2. คัดลอก `course.json` ของ Scale Lab เปลี่ยน id ให้ตรงชื่อโฟลเดอร์ (lowercase, digits, hyphen) พร้อม title/subtitle/order
3. ติดตั้ง dependencies ในคอร์สนั้น แล้วรัน build/validate ด้านบน ไม่ต้องแก้ Flask หรือ catalog template
4. ปิดโดยตั้ง `enabled: false` ใน JSON: หายจาก catalog และ direct URLs เป็น 404 สำหรับผู้เข้าสู่ระบบทันที ไม่ต้อง restart
5. ลบโดยสำรองแล้วนำโฟลเดอร์คอร์สออกจาก `courses/` ไม่ต้องลบ user DB

Manifest ผิดหรือยังไม่มี build จะถูกซ่อน (fail closed); validate command รายงานข้อผิดพลาดและ exit 1 ตรวจด้วยคำสั่งนี้ก่อน deploy เสมอ

## Standalone development

```sh
cd courses/scale-lab
npm run dev -- --port 5173
npm test
npm run test:e2e
npm run build
npm run preview
```

Standalone ไม่มี auth ของ platform และไม่มีปุ่มกลับ Classroom โดย default การ build standalone จะเขียนทับ dist เป็น base `/` ดังนั้นก่อนเปิดผ่าน Flask ต้องรัน `python3 scripts/courses.py build` อีกครั้ง (ตั้ง base `/courses/scale-lab/` และ optional `VITE_CLASSROOM_URL=/` ให้เอง)

## ทดสอบและหลักฐาน

```sh
cd appworks && .venv/bin/python -m pytest -q && cd ..
cd courses/scale-lab && npm test && npm run test:e2e && cd ../..
python3 scripts/courses.py build
```

Browser integration ใช้ DB และ courses root แยก ไม่หยุดแอปจริงบน 8080 และไม่แตะ 8081:

```sh
# จาก classroom root หลัง integrated build:
appworks/.venv/bin/python scripts/progress-qa-server.py --port 8093
# อีก terminal จาก classroom root:
node scripts/browser-verify.mjs
node scripts/progress-browser-verify.mjs
# เปลี่ยนปลายทางได้ด้วย CLASSROOM_QA_URL=http://127.0.0.1:<QA-port>
```

ติดตั้ง browser ถ้าจำเป็น: `cd courses/scale-lab && PLAYWRIGHT_BROWSERS_PATH=.browsers npx playwright install chromium`
ผลอยู่ `evidence/platform-browser.json` และ `evidence/account-progress-browser.json`, ภาพอยู่โฟลเดอร์เดียวกัน `evidence/progress-qa-server.json` ระบุ DB ทดสอบที่สร้างใหม่ Test สมัครบัญชีใน DB ทดสอบเท่านั้น เมื่อเสร็จหยุดเฉพาะ QA server แล้วให้เจ้าของ process จริง restart แอป 8080 เพื่อโหลด Python ใหม่ (สร้างตาราง progress โดยไม่ reset บัญชีเดิม)

## ความคืบหน้า / ขอบเขต

Classroom บันทึกความคืบหน้าตามบัญชี/คอร์ส/รหัสบทเรียนใน SQLite แล้ว Scale Lab โหลดผลจากบัญชีเมื่อเข้าและบันทึกเมื่อกด “ทำเครื่องหมายว่าเรียนจบ” หลังเรียน พร้อมทดลองหลักและตอบ Check your thinking A หรือ B อย่างน้อยหนึ่งครั้งต่อบท (ไม่ต้องถูก) ครบทั้งสามเงื่อนไขจึงนับบทสำหรับ Level; การตอบถูกไม่ใช่การกดเรียนจบ ปุ่มใต้หัวข้อบทจะแสดง “✓ เรียนจบแล้ว” ตามบทที่เลือก โดยไม่อ้างว่าผ่านแบบทดสอบจากการกดเรียนจบ มีสถานะกำลังโหลด/บันทึกและข้อผิดพลาด ไม่แอบนำ localStorage เดิมเข้าบัญชี คอร์สใหม่เพิ่ม `lessons` (stable IDs) ใน manifest แล้วใช้ generic GET/POST `/api/courses/<id>/progress` ได้ทันที ดู schema, CSRF และตัวอย่าง adapter ใน `docs/course-contract.md`

จำนวนบทเรียนอิง manifest ปัจจุบัน คอร์สที่ไม่ประกาศ `lessons` ยังเปิดได้แต่ไม่ติดตาม ผลเป็นการเรียนรู้ที่ client รายงาน ไม่ใช่ระบบสอบกันโกง Standalone ยังใช้ localStorage เฉพาะเบราว์เซอร์ ไม่มีการ sync ข้ามบัญชี ส่วน platform ไม่ fallback ไป localStorage เมื่อ API ล้มเหลว
คอร์สเป็น trusted first-party JS บน origin เดียวกัน ไม่ใช่ sandbox สำหรับโค้ดภายนอก ต้อง review ก่อนเพิ่ม ข้อจำกัด auth/deployment ดู `appworks/README.md`.

## Leaderboards / 9 ระดับ / ข้อสอบปลายทาง

เปิด `/leaderboards` หลังเข้าสู่ระบบ แสดงเฉพาะสมาชิกจริง (ชื่อ ไม่แสดงอีเมล) เรียงระดับ → จำนวนคอร์สที่จบ → รหัสสมาชิกก่อนเมื่อเสมอ ไม่แสดงคะแนนหรืออันดับรายสัปดาห์ที่ไม่ได้เก็บจริง

- L1 สมัครสมาชิก; L2/L3/L4/L5/L6/L7/L8 จบอย่างน้อย **1/3/5/7/9/11/13 CLASS** ตามลำดับ
- **CLASS = คอร์สทั้งคอร์สที่ครบทุกบทใน manifest ปัจจุบัน** ไม่ใช่หนึ่งบท; นับเฉพาะ enabled/valid/built courses ที่ประกาศ lessons
- L9 ต้องถึง L8 ก่อน แล้วผ่านข้อสอบที่ server ตรวจได้อย่างน้อย 95% (เทียบจำนวนเต็ม ไม่ปัดเพื่อเลื่อนระดับ)
- เมื่อบันทึก progress จนถึง L8 ระบบพยายามสร้างชุดข้อสอบอัตโนมัติ; ผู้ที่มี progress เดิมเปิด `/exam` เพื่อสร้างได้เช่นกัน ชุดสุ่มจาก `assessment.json` ของ **ทุกคอร์สที่จบ ณ เวลาสร้าง** หนึ่งข้อต่อบท ไม่ใช่ LLM แต่งคำถามใหม่ และไม่ต้องมี API key
- คลังข้อสอบขาด/ผิดจะแสดงรายชื่อคอร์สให้ผู้ดูแลแก้ ไม่ละเว้นคอร์สและไม่ทำให้ progress สูญหาย คอร์สใหม่ต้องมี private bank ตาม contract
- ชุด active ถูกเก็บถาวร โหลดใหม่ไม่สุ่มใหม่; คำตอบก่อนส่งยังไม่บันทึก ส่งแล้วแก้ไม่ได้ สอบไม่ผ่านเริ่มชุดใหม่ได้ทันที; ผ่านแล้ว L9 คงอยู่แม้เปลี่ยนหลักสูตร
- ปัจจุบันมี Scale Lab จริงเพียง 1 คอร์ส จึงยังไม่มีทางถึง L8 จากหลักสูตรจริงจนเพิ่มคอร์สครบ ไม่ใส่คอร์ส/สมาชิก QA ใน production

Migration เป็น additive `exam_attempts`, unique active-attempt index และ `level_achievements` ไม่ reset users/sessions/progress สำรอง SQLite ก่อนให้เจ้าของ process restart 8080 ระบบสอบนี้ตรวจคะแนน server-side แต่ไม่ใช่ proctored exam และการเรียนจบยังเป็น client-reported progress

QA แยกทั้งหมด: `appworks/.venv/bin/python scripts/leaderboards-qa-server.py` (8095), อีก terminal `node scripts/leaderboards-browser-verify.mjs` ดูหลักฐาน `evidence/leaderboards-browser.json`, `leaderboards-*.png`, `exam-*.png` และ `docs/leaderboards-verification.md` อย่าใช้ฐานข้อมูล QA เป็น production

# classroom

