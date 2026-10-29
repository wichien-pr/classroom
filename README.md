# Classroom

แพลตฟอร์มเรียน System Design ภาษาไทยผ่านบทเรียนและการทดลองแบบโต้ตอบ ใช้ Flask ดูแลบัญชีและความคืบหน้าใน SQLite ส่วนแต่ละคลาสเป็นแอป Vite แยกกันภายใต้ `courses/`

## สถานะปัจจุบัน

- Docker ที่ใช้งานในเครื่อง: **http://localhost:8082** (bind เฉพาะ `127.0.0.1` ไม่ใช่ public production endpoint)
- Compose project: `classroom-docker-qa` — ชื่อนี้มาจากการติดตั้งเดิม แต่ volume ปัจจุบันมีข้อมูลบัญชีจริง **ห้ามใช้เป็นฐานข้อมูลทดสอบ**
- ใช้ `compose.yaml` ร่วมกับ `compose.accounts.yaml` ผ่าน `scripts/classroom-compose.sh` เสมอ
- SQLite และ uploads อยู่ใน external volume **`classroom-accounts-20261022`** ที่ mount เป็น `/data` ไม่หายเมื่อเปลี่ยน container
- Docker มีทั้ง **Scale Lab 12 บท** และ **Estimate Lab 5 บท** รวม LAB12 Database scaling และ LAB05 Tips แล้ว
- ข้อมูล host ใน `appworks/instance/` เป็นคนละชุดกับ Docker ไม่ได้ sync กันอัตโนมัติ การอัปเดต Docker ไม่ได้อัปเดต host service หรือ host `dist`

การ rebuild/deploy ล่าสุดใช้ source commit `2b3290a`: build/validate ทั้งสองคลาสผ่าน, container healthy และใช้ image ใหม่ ตรวจ SQLite integrity ผ่าน รวมถึง schema/ข้อมูลทุกตารางและ uploads ตรงกับก่อน restart ก่อนทดสอบ HTTP หน้า login ตอบ 200, guest เข้า course ถูก redirect 303 และ progress/participation APIs ตอบ 401 การตรวจหน้า login เพิ่ม anonymous session หนึ่งรายการ ไม่ได้ทดสอบ login ด้วยบัญชีจริงหรือส่งอีเมลจริงในรอบนี้

> Volume นี้เริ่มต้นจากการย้ายเฉพาะบัญชี ไม่ใช่ประวัติการเรียนทั้งหมด แต่หลังใช้งานอาจมี progress, activity และ uploads เพิ่มแล้ว ห้ามถือว่ายังว่างหรือย้ายฐานข้อมูล local มาทับ ดู [ประวัติการย้ายบัญชีและข้อควรระวัง](docs/account-only-migration.md)

## หลักสูตร

| คลาส | URL | บทเรียนที่ใช้งาน | นิยามกิจกรรมที่ให้คะแนน |
| --- | --- | ---: | ---: |
| Scale Lab | `/courses/scale-lab/` | 12 | 44 |
| Estimate Lab | `/courses/back-of-the-envelope-estimation/` | 5 | 15 |

จำนวนข้างต้นอิง `lessons` และ `participation` ใน manifest ไม่ใช่จำนวนคะแนนที่ทุกบัญชีต้องมี คะแนนเก่าอาจรวมกิจกรรมจากบทที่เลิกใช้แล้ว

### Scale Lab

ลำดับ stable lesson IDs:

`flow` → `workload` → `stock` → `balance` → `replica` → `cache` → `cdn` → `stateless-web` → `data-centers` → `message-queue` → `logging-operations` → `database-scaling`

เนื้อหาครอบคลุมเส้นทาง request, ฐานข้อมูล, การขยายระบบ, load balancing, replication, cache, CDN, stateless web tier, data centers, message queue, logging/metrics/automation และ database scaling

### Estimate Lab

1. `estimate-units` — หน่วยข้อมูลและกำลังของสอง
2. `estimate-latency` — เปรียบเทียบ latency จากชุดข้อมูลอ้างอิงเชิงประวัติศาสตร์ ไม่ใช่ benchmark เครื่องปัจจุบัน
3. `estimate-availability` — availability, SLA และ downtime ตามช่วงเวลาที่กำหนด
4. `estimate-traffic` — ตัวอย่าง Twitter สมมติ: MAU → DAU → QPS/peak และพื้นที่เก็บสื่อ
5. `estimate-tips` — การปัดเลข สมมติฐาน หน่วย และแนวทางฝึกประมาณ

`estimate-storage` และ `estimate-rounding` เลิกเป็นบทที่ใช้งานแล้ว ไม่ลบประวัติเดิมและไม่โอนเครดิตไปให้ Tips เครื่องคำนวณ rounding ยังใช้ใน Tips ส่วนตัวอย่างพื้นที่เก็บสื่ออยู่ใน LAB04 ดู [รายละเอียด Estimate Lab](courses/back-of-the-envelope-estimation/README.md)

## ความคืบหน้า คะแนน และระดับ

ทั้งสองคลาสใช้เงื่อนไขเรียนจบต่อบทครบสามอย่าง โดยทำลำดับใดก่อนก็ได้:

1. กด **ทำเครื่องหมายว่าเรียนจบ**
2. ทำกิจกรรมหลักของบทอย่างน้อยหนึ่งรายการที่ manifest อนุญาต
3. เลือกคำตอบ Check your thinking อย่างน้อยหนึ่งตัวเลือก — ไม่ต้องตอบถูกเพื่อบันทึกการมีส่วนร่วม

- Participation Score แยกจากคะแนนสอบ แต่ละ lesson/simulation/action ได้คะแนนครั้งแรกต่อบัญชี กดซ้ำไม่เพิ่มคะแนน
- ตัวเลือกคำตอบยึดตัวเลือกต้นฉบับ ไม่ใช่ตำแหน่ง A/B ที่สุ่มแสดง การตอบถูกไม่สร้าง manual completion แทนผู้เรียน
- บันทึกความคืบหน้าตามบัญชี/คลาส/stable lesson ID มีสถานะ loading, saving, error และ retry ไม่มีการนำ localStorage เก่าเข้าบัญชีอัตโนมัติ
- การเปลี่ยนหลักสูตรใช้ manifest ปัจจุบันนับบทที่จบ เก็บประวัติบทที่เลิกใช้และ frozen exam snapshots ไว้ ไม่ใช้ ID เก่าให้หัวข้อใหม่
- Standalone ใช้ localStorage เฉพาะเบราว์เซอร์ ไม่ sync กับบัญชี; account mode ไม่ fallback ไป localStorage เมื่อ API ล้มเหลว

Leaderboards นับ **คลาสทั้งคลาสที่ครบทุกบท** ไม่ใช่คะแนนหรือจำนวนบทแยกกัน: L1 เริ่มต้น; L2–L8 ต้องจบอย่างน้อย 1/3/5/7/9/11/13 คลาสตามลำดับ ส่วน L9 ต้องถึง L8 และสอบได้อย่างน้อย 95% ข้อสอบสุ่มจาก private `assessment.json` ของทุกคลาสที่จบ หนึ่งข้อต่อบท ตรวจโดย server ไม่ใช่ LLM สร้างข้อสอบ เมื่อได้ L9 แล้วจะคงอยู่แม้หลักสูตรเปลี่ยน

ปัจจุบันมีสองคลาส จึงยังไม่สามารถถึง L8 จากหลักสูตรจริงที่มีอยู่ ไม่เพิ่มคลาสหรือบัญชี QA ลงระบบจริงเพื่อให้ถึงเกณฑ์ ดู [course contract](docs/course-contract.md) และ [participation contract](docs/participation-contract.md)

## บัญชีและฟีเจอร์แพลตฟอร์ม

- **สมัครสมาชิก:** ยืนยันรหัส OTP ทางอีเมลก่อนสร้างบัญชี ต้องตั้งค่า Graph/SMTP ให้พร้อม หากส่งไม่ได้จะไม่ข้าม OTP บัญชีเดิมไม่ถูกสร้างประวัติยืนยันย้อนหลัง
- **ลืมรหัสผ่าน:** ลิงก์ใช้ครั้งเดียว มีอายุจำกัด และยกเลิก session เดิมของบัญชีเมื่อเปลี่ยนรหัสผ่านสำเร็จ
- **โปรไฟล์:** ชื่อ, `@username`, bio, รูปโปรไฟล์ และ Level; แก้ไขผ่าน `/account/profile/edit` รูปเก็บแยกจาก SQLite และส่งให้สมาชิกที่ยืนยันตัวตนเท่านั้น
- **Activity:** ปฏิทินกิจกรรม 53 สัปดาห์ แยก login/เปิดคลาส/เรียนจบ ใช้วันตาม Asia/Bangkok ไม่เติมประวัติย้อนหลัง
- **Online presence:** อิง heartbeat ของหน้าที่เปิดอยู่และ session ที่ยังใช้ได้ เป็นสถานะโดยประมาณ ไม่ใช่เวลา last-active ในโปรไฟล์
- **Community:** ซ่อนจากเมนูหลัก แต่สมาชิกยังเปิด `/community` ได้ รองรับโพสต์ ความคิดเห็น ถูกใจ ไฟล์แนบ ลิงก์และโพล แผงค้นหา/เรียงลำดับไม่แสดงใน UI การใช้งานส่วนนี้ไม่เพิ่มระดับหรือคะแนนการเรียน

รายละเอียด: [registration](docs/registration-contract.md) · [password reset](docs/password-reset-contract.md) · [profiles](docs/profiles-contract.md) · [activity](docs/activity-contract.md) · [presence](docs/presence-contract.md) · [community](docs/community-contract.md)

## ใช้งาน Docker ที่มีอยู่

รันจาก root ของ repository ใช้ Docker Compose 2.30+ ซึ่งรองรับ `env_file.format: raw`:

```sh
# ตรวจ configuration โดยไม่แสดงค่า secrets
sh scripts/classroom-compose.sh config --quiet
sh scripts/classroom-compose.sh ps

# เปิด service จาก image ที่มีอยู่ ไม่ rebuild
sh scripts/classroom-compose.sh up -d --no-build --no-deps --wait --wait-timeout 180 classroom

# ตรวจ readiness โดยไม่สร้าง anonymous session
curl -fsS http://localhost:8082/healthz
```

### Rebuild และ deploy รุ่นใหม่

```sh
# Build ใน Docker ไม่เขียนทับ host dist; container เดิมยังให้บริการระหว่าง build
sh scripts/classroom-compose.sh build classroom

# เมื่อ build ผ่าน: หยุด writer แล้วสำรอง SQLite และ uploads เป็นชุดเดียวกัน
sh scripts/classroom-compose.sh stop classroom
# สำรอง /data จาก volume ที่ตรวจสอบแล้วตามคู่มือ backup/restore ก่อนคำสั่งถัดไป

# ใช้ image ใหม่และ volume เดิม
sh scripts/classroom-compose.sh up -d --no-build --no-deps --force-recreate --wait --wait-timeout 180 classroom
sh scripts/classroom-compose.sh ps
curl -fsS http://localhost:8082/healthz
```

ต้องมี backup และ rollback image ก่อน recreate; หาก backup ไม่สำเร็จ ห้ามข้ามไป deploy ตรวจ mount, image ID, integrity และข้อมูลหลังเริ่มระบบด้วย **ห้ามใช้ `down -v`, ลบ volume หรือรัน fixture-seeding QA บน volume นี้** คำสั่งข้างต้นใช้กับ deployment เดิม ไม่ใช่วิธีสร้าง production เครื่องใหม่

Runtime secrets อยู่ใน `docker/runtime.env` แบบ private/gitignored ไม่อยู่ใน image ห้ามพิมพ์ resolved Compose config ที่มี secrets ลง log หรือ commit ไฟล์นี้ คู่มือเต็ม: [Docker deployment, image และ backup/restore](docs/docker-deployment.md)

### ย้ายขึ้น production เครื่องอื่น

- ตั้ง HTTPS, canonical origin และ secure cookies ให้ตรงปลายทาง ไม่ใช้ local HTTP exceptions เป็นค่า production
- เตรียม persistent volume/host storage สำหรับ SQLite, profile photos และ community uploads รันหนึ่ง app instance ต่อฐานข้อมูลตามรูปแบบ deployment นี้
- หยุดการเขียนก่อนย้ายข้อมูลพร้อม uploads หรือใช้ SQLite Backup API สำหรับสำเนาฐานข้อมูลที่สอดคล้องกัน อย่าคัดลอกเฉพาะ `.sqlite3` ขณะมีการเขียนหรือยังมีข้อมูลค้างใน WAL
- หลัง production มีข้อมูลใหม่แล้ว การ deploy ครั้งต่อไปต้องเก็บ DB เดิม ไม่ copy DB จาก local ไปทับ
- ปล่อย manifest, private assessment และ compiled client รุ่นเดียวกัน โดยไม่เสิร์ฟ assessment เป็น public asset
- ตรวจ login, progress, uploads และ mail ที่ปลายทางแยกจาก health check

## โครงสร้างโครงการ

```text
appworks/       Flask, auth/session, SQLite, catalog และ platform features
courses/        แอปคลาสอิสระ: source, manifest, private assessment, tests
scripts/        build/validate, deployment wrappers และ isolated QA tools
docs/           contracts, operations และรายงาน verification แต่ละรุ่น
docker/         runtime configuration example และ private runtime.env
compose.yaml    build/runtime service และข้อกำหนด persistent storage
```

แต่ละคลาสเป็น trusted first-party JavaScript บน origin เดียวกัน ไม่ใช่ sandbox สำหรับโค้ดบุคคลภายนอก ทุก course HTML/asset ผ่าน session ห้ามใช้ static server เปิดทั้ง repository

## พัฒนาในเครื่อง

ใช้ checkout/worktree แยกจาก deployment ที่กำลังให้บริการ โดยเฉพาะการแก้ manifest/private bank ซึ่ง host backend อ่านแบบ dynamic

```sh
# ติดตั้ง backend ครั้งแรก
python3 -m venv appworks/.venv
appworks/.venv/bin/pip install -r appworks/requirements.txt

# ติดตั้ง dependencies ของทั้งสองคลาส
npm --prefix courses/scale-lab ci
npm --prefix courses/back-of-the-envelope-estimation ci

# Integrated build: ตั้ง course base path และ account adapters ให้แต่ละคลาส
python3 scripts/courses.py build
python3 scripts/courses.py validate

# รันเฉพาะเมื่อพอร์ต 8080 ว่างและตั้งค่า DB/uploads/mail สำหรับ environment นี้แล้ว
cd appworks
.venv/bin/waitress-serve --listen=127.0.0.1:8080 --call service:create_app
```

`service:create_app` โหลด private `appworks/.env` โดย process environment มีลำดับสูงกว่า ส่วน `app:create_app` ไม่โหลดไฟล์นี้และใช้ใน tests/QA อย่าเปิด service ทดสอบด้วยฐานข้อมูลจริง ค่าเริ่มต้น host DB คือ `appworks/instance/classroom.sqlite3`; แยกด้วย `APPWORKS_DATABASE` และกำหนด upload paths ให้เป็นชุดเดียวกัน ห้ามแย่งพอร์ตของ service เดิม

### Standalone

```sh
# เลือกคลาสที่ต้องการพัฒนา
cd courses/back-of-the-envelope-estimation
npm run dev -- --port 5173
```

Standalone ไม่มี platform auth และไม่บันทึกเข้าบัญชี `npm run build` แบบ standalone จะเขียนทับ `dist` ของคลาสนั้นด้วย base `/` จึงห้ามรันใน checkout ที่ host กำลังเสิร์ฟ integrated assets ให้ใช้ output/worktree แยกหรือหยุด service ก่อน build ที่ได้รับอนุญาต

## การทดสอบ

```sh
# รันใน checkout สำหรับพัฒนา/QA ไม่ใช่การ seed ข้อมูลให้ deployment
(cd appworks && .venv/bin/python -m pytest -q)
npm --prefix courses/scale-lab test
npm --prefix courses/back-of-the-envelope-estimation test
```

Backend suite บางส่วนต้องมี integrated build ของคลาสใน checkout QA ก่อนรัน Browser tests ต้องเตรียม Playwright/Chrome และ environment ตาม runner นั้น ไม่ถือว่าการผ่าน unit tests หรือ `/healthz` ยืนยัน authenticated browser workflow

- Scale Lab: `npm run test:e2e` ในโฟลเดอร์คลาส
- Estimate Lab: scripts `test:completion`, `test:units`, `test:latency`, `test:availability`, `test:traffic`, `test:tips`, `test:retirement` ใช้ browser ตรวจ UI; runner ที่ intercept APIs เป็น frontend contract QA ไม่ใช่ backend persistence
- Account QA ของ Estimate Lab รุ่นห้าบท: `scripts/estimation-five-account-verify.mjs` ต้องใช้ isolated server/mail capture และฐานข้อมูล QA ตาม runner ห้ามชี้ไป volume บัญชีจริง
- `scripts/estimation-tips-account-verify.mjs` และรายงานหกบทเป็นหลักฐานรุ่นก่อน ไม่ใช่ active curriculum
- ห้ามรัน `scripts/docker-verify.py` หรือ migration initial-state verifier กับ deployment ที่มีข้อมูลจริงหลังเริ่มใช้งาน

ตัวเลขผลทดสอบในเอกสาร verification เป็นผลของรุ่นและ environment ที่ระบุ ไม่ใช่ผลทดสอบรอบล่าสุดโดยอัตโนมัติ ดู [Estimate Lab verification](docs/estimation-verification.md), [LAB12 verification](docs/lab12-verification.md) และ [Docker verification/operations](docs/docker-deployment.md) ส่วน `evidence/` และ backups เป็น artifact ในเครื่องและอาจไม่อยู่ใน Git

## เพิ่มหรือปรับหลักสูตร

1. สร้าง `courses/<id>/` พร้อม source, `package.json`, `course.json` และ build ของตัวเอง ไม่ import platform หรือ source ของอีกคลาส
2. ใช้ ID ที่ปลอดภัยและตรงชื่อโฟลเดอร์ ตั้ง title/order/enabled ตาม [course contract](docs/course-contract.md)
3. ประกาศ stable lesson IDs, completion requirements, participation allowlists และ private `assessment.json` ให้ตรงกับบทเรียน
4. ติดตั้ง dependencies, build/validate และทดสอบผ่าน generic progress/participation APIs โดยไม่เพิ่ม backend branch เฉพาะคลาส
5. ทดสอบการเปลี่ยนหลักสูตรใน worktree/QA แยก สำรองข้อมูลก่อน release และปล่อย manifest/bank/client พร้อมกัน

ปิดคลาสด้วย `enabled: false` จะไม่นับใน catalog/qualification; สำหรับ host มีผลเมื่ออ่าน manifest ใหม่ ส่วน Docker ต้อง rebuild/redeploy เพื่อเปลี่ยนไฟล์ใน image การปิดหรือลบบทเรียนไม่ใช่คำสั่งลบประวัติใน SQLite และไม่ควรเปลี่ยน stable ID ของหัวข้อเดิมเพียงเพื่อแก้ชื่อที่แสดง
