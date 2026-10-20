# Scale Lab — ห้องทดลอง System Design ภาษาไทย

## Lab 01: Single-server setup

Lab 01 ใช้ `../../Single-server-setup.pdf` หน้า 1–3 เป็นแหล่งเนื้อหา พร้อมภาพ SVG วาดใหม่, DNS คืน IP ให้ client, HTTP ไป–กลับ server โดยตรง และโหมด Browser/HTML กับ Mobile/JSON เดินทีละขั้น ไม่มี network จริง คงรหัสคะแนนและเงื่อนไขเรียนจบเดิม ดู [source mapping, TDD, คำสั่งทดสอบ และ isolated compiled QA](../../docs/lab01-single-server.md). ไม่ได้ deploy หรือเขียนทับ live dist.

แอป Vite + vanilla JavaScript สำหรับใช้คู่กับ `TEAM_TRAINING_TH.md` ไม่ต้องใช้ account, API key หรือ backend ตัว UI เป็น learning console: บทเรียนทางซ้าย แผนภาพ/ตัวควบคุมตรงกลาง คำอธิบายและคำถามทางขวา

**ทุก infrastructure และค่าที่แสดงเป็น educational simulation ไม่ใช่ benchmark หรือ capacity claim** ไม่มีอีเมล การสั่งซื้อ หรือการเปลี่ยนระบบจริง

## เริ่มใช้งาน

ต้องมี Node.js รุ่นที่ Vite รองรับ (ทดสอบด้วย Node 26.7.0, npm 11.19.0)

```sh
cd /Users/prommeesee/Documents/04_Learning/bytebytego/Scale_From_Zero_To_Millions_Of_Users/scale-lab
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://127.0.0.1:5173`) ปิดด้วย Ctrl+C ไม่มี server ถาวรถูกตั้งไว้โดยงานนี้

```sh
npm test                       # unit tests ของ simulation models
PLAYWRIGHT_BROWSERS_PATH=./.browsers npx playwright install chromium
npm run test:e2e                # Chromium จริง เปิด/ปิด Vite ชั่วคราวเองที่ 4175
npm run build                  # production output ใน dist/
npm run preview                # ตรวจ production build ด้วยตนเอง
python3 tests/verify.py         # รันทั้งหมดและบันทึก evidence/verification.txt
```

Playwright ใช้ `channel: chromium` (full Chromium headless) เพราะ Chromium headless shell ปิดตัวระหว่าง navigation บนเครื่องทดสอบนี้ Browser ติดตั้งเฉพาะ `.browsers/` ภายในโปรเจกต์ ไม่เปลี่ยน global config

## วิธีสอน

1. เลือกบท อ่านเป้าหมายและ “ลองตามนี้”
2. ตั้งตัวแปร กดปุ่มเดินระบบทีละขั้น อ่านผลและ event log
3. เปลี่ยนตัวแปรเดียว เปรียบเทียบเหตุการณ์ก่อน/หลัง
4. ตอบคำถาม ทั้งตอบผิดและถูกมีคำอธิบาย ไม่จำกัดครั้ง
5. ปุ่ม “เริ่มการทดลองใหม่” คืนสถานะ/ตัวควบคุมของ lab ไม่ลบความคืบหน้า การเปลี่ยนบทเริ่ม lab ใหม่เช่นกัน

Standalone เก็บหมายเลขบทที่ตอบถูกใน localStorage `scale-lab-progress` ถ้า storage ถูกบล็อกยังใช้แอปได้ด้วย state ใน memory ส่วน integrated Classroom build ใช้ `VITE_CLASSROOM_PROGRESS_URL` โหลด/บันทึกตามบัญชีใน SQLite ผ่าน session + CSRF โดยใช้ `kind` เป็น stable lesson ID ห้ามเปลี่ยน/reuse ค่าเหล่านี้เมื่อปรับลำดับบท ไม่อ่าน/นำเข้า localStorage เดิมในโหมดบัญชี มี load/save error และ retry ไม่ fallback ไป localStorage ดู `../../docs/course-contract.md`

ทดสอบ adapter: `npm test`; ทดสอบ account UI/error/race: `npx playwright test -c playwright.account.config.js`; ทดสอบจริงกับ Flask/SQLite: `node scripts/progress-browser-verify.mjs` จาก root หลังเริ่ม isolated QA server

ปุ่ม “คู่มือฉบับเต็ม” อ่าน markdown ที่คัดลอกครบทุกบทผ่าน `textContent` และแสดงแบบ pre-wrap จึงไม่ execute HTML/script หรือ link จากเอกสารต้นทาง สามารถอ่านไฟล์นั้นตรง ๆ ได้ที่ `public/TEAM_TRAINING_TH.md`

## Source mapping

ต้นฉบับ `../TEAM_TRAINING_TH.md` ไม่ถูกแก้ไข สำเนาใน `public/` เทียบแบบ byte-for-byte โดยสคริปต์ verify

| Lab | บทต้นฉบับ | สิ่งที่ทดลอง |
|---|---|---|
| 1 Request flow | §3 | Browser → DNS → TLS → app → DB → response ทีละขั้น |
| 2 Workload | §4 | RPS ตามหน้าต่างเวลาและ app connection budget |
| 3 Database | §5 และ §2, §17 | Stock conditional update, idempotency, payload conflict |
| 4 Load balancing | §6 | Round-robin, backend failure, all-down 503 |
| 5 Stateless | §7 | Local session เทียบ shared store เมื่อสลับ instance |
| 6 Replication | §8 | เขียน primary, stale replica, primary read, explicit sync |
| 7 Cache | §9 | Cache-aside miss/hit, stale price, invalidation |
| 8 CDN | §10 | Decision lab: account cache policy และข้อมูลข้าม user |
| 9 Queue | §11 | Worker crash ก่อน/หลัง effect, redelivery, provider dedup, retry cap |
| 10 Observability | §12 | Decision lab: trace/pool/lock กับเพิ่ม CPU โดยไร้หลักฐาน |
| 11 Multi-region | §13 | Decision lab: fencing กับ DNS-only failover |
| 12 Sharding | §14 | Customer ID modulo, เปลี่ยน shard count และ mapping |

ทุกบทมี objective, คำอธิบาย trade-off, แนวทดลอง, คำถามและเหตุผลเฉลย ส่วน workshop, decision table, ADR, assessment และ source attribution ทั้งหมดอยู่ในคู่มือฉบับเต็ม (§1–19)

## โครงสร้าง

- `src/models.js`: pure deterministic simulation models (บางฟังก์ชันแก้ state ที่ส่งเข้า)
- `src/lessons.js`: เนื้อหาภาษาไทย 12 บทและแหล่งอ้างอิง
- `src/main.js`: UI, actions, การแสดงผลแบบ escape, guide, progress
- `src/style.css`: charcoal / warm off-white / teal, responsive, keyboard focus, reduced-motion
- `tests/models.test.js`: model regression suite
- `tests/browser/`: navigation, labs, quiz, persistence/reload, reset, storage failure, keyboard, guide และ narrow viewport
- `tests/tdd-build.py`: บันทึกกระบวนการสร้าง model ทีละ RED→GREEN slice; **ไม่ใช่คำสั่งทดสอบปกติ** เพราะจะสร้าง models/tests ใหม่จากประวัติเดิม
- `evidence/tdd.txt`: output จริงของ RED→GREEN ทั้ง 16 slices
- `evidence/browser-results.json`, `verification.txt`: ผลการรันจริงล่าสุด
- `evidence/desktop.png`, `mobile.png`: screenshot จาก Chromium จริง

## ขอบเขตและข้อจำกัดที่ต้องสอนให้ชัด

- เป็น single-process deterministic model ไม่มี network, HTTP backend, database transaction จริง, TLS handshake, DNS resolver, payment หรือ email จริง ไม่ใช้ random timer หรือ fake live metrics
- Stock/order แต่ละ action เป็น atomic step ที่เรียงลำดับ; ไม่ได้พิสูจน์ concurrent SQL isolation, deadlock handling หรือ production durability ใช้ SKU เดียวและลูกค้าสมมติคนเดียว payload fingerprint ในโมเดลคือ quantity
- Session สลับ shared/local เป็นสถานการณ์สมมติที่จัดวาง session ใหม่ ไม่ใช่ migration จริง JWT, authorization และ shared-store failure ไม่ได้จำลอง
- Cache ไม่จำลอง TTL, eviction, outage, stampede หรือ concurrent stale refill; คำอธิบายระบุความเสี่ยงเหล่านี้ ไม่อ้างว่า invalidate แก้ consistency ได้ทั้งหมด
- Replication ตามทันเมื่อกด sync หนึ่งครั้ง ไม่มีหน่วยเวลาจริง ไม่จำลอง failover election, data loss หรือ backup restore
- Queue เริ่มด้วย job ที่ถือว่าเข้า queue แล้ว เพื่อโฟกัส worker; ไม่ได้จำลอง outbox publisher crash ใช้ provider receipt ที่ทนทานเพื่อแสดง dedup หลัง side effect ไม่อ้างว่า processed-message table เพียงอย่างเดียวทำให้อีเมล exactly-once การล้มก่อน effect retry ได้ไม่เกิน 3 attempts แล้วเข้า dead-letter; การกด retry แทนเวลารอ backoff ไม่มี jitter จริง
- Sharding เป็น integer modulo (shard เริ่มนับ 0) ไม่ย้ายข้อมูล ไม่มี consistent hash, cross-shard transaction หรือ production resharding
- CDN, observability และ multi-region เป็น decision labs ไม่ใช่ deployment/network simulators
- Event log เก็บเฉพาะ 30 เหตุการณ์ล่าสุดใน memory ลำดับในรายการไม่ใช่เวลา wall-clock ความคืบหน้าเรียน persist แต่ lab state ไม่ persist
- Browser automation ตรวจ Chromium บน macOS เท่านั้น ไม่ได้ตรวจ Safari/Firefox หรือ screen reader โดยคนจริง ตรวจ mobile viewport ด้วย browser desktop ไม่ใช่อุปกรณ์จริง

## TDD / หลักฐาน

เริ่ม model ทีละ behavior เขียน test → รันแดง → เพิ่ม implementation → รันเขียว รวม 16 slices พร้อม output เก็บไว้ จากนั้น shell/request UI มี browser test แดงก่อน implementation และ regression สำหรับ quiz ที่เคย reset ช่องกรอกถูกทดสอบแดงก่อนแก้ การทดสอบ browser ชุดกว้างใช้ตรวจ integration เพิ่มเติมหลังเชื่อม models

ไม่มีการเปลี่ยนไฟล์ต้นฉบับหรือโฟลเดอร์อื่นเพื่อให้แอปทำงาน ไม่มี server ถาวรหรือ deployment ภายนอก
