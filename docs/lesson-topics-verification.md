# Scale Lab LAB02–LAB12: topic experiments — deployed 2026-11-05

Checkout `/Users/prommeesee/projects/classroom`, branch `exam-new`. ขยาย presentation experiment ให้ครบ **11 บท / 59 หัวข้อ**. Deploy ตามอนุมัติแล้วที่ `https://localhost` พร้อม pending LAB01 thinking readability; คง diagram/sidebar ที่อนุมัติไว้ ไม่ commit/push. หลักฐาน implementation ด้านล่างเป็นผลก่อน deploy; ผล rollout ปัจจุบันอยู่ท้ายเอกสาร

## สิ่งที่เปลี่ยน

- ใช้หัวข้อจากขั้นทดลองเดิมทุกข้อ ไม่สร้างลำดับแบบเดียวกันให้ทุกบท: heading/instruction → แผนภาพเดิมที่ยังทำงาน → controls ที่เกี่ยวข้อง → ผลล่าสุด/state → Back/Next
- Next/Back เปลี่ยนหัวข้อได้ทันที ไม่เรียก action ไม่ปรับ input ไม่ reset ไม่ให้คะแนน ไม่ทำให้เรียนจบ ย้าย DOM เดิม ไม่ clone/remount listeners
- ปุ่ม “ปรับเงื่อนไขอื่น / เตรียมขั้นที่ข้าม” เปิด controls ทั้งหมดเพื่อให้ตั้ง prerequisites เอง ไม่มีการทำขั้นที่ข้ามให้อัตโนมัติ กลับ/ถัดไปจะปิดชุดตั้งค่าเพิ่มเติม แต่ค่าทั้งหมดคงเดิม
- คง full live architecture ไว้เหนือ action ไม่ย่อทั้งสถาปัตยกรรมให้เล็กเพื่อยัดลงสไลด์ ส่วน event history และ caveats เดิมอยู่ใน disclosure
- LAB11 แยกผล Logs / Metrics / Pipeline ตามหัวข้อ และย้าย fresh result nodes จาก renderer มาไว้ใต้ action ทุกครั้งที่ render ผลยังคงอยู่เมื่อ Back
- LAB12 เพิ่มภาพเริ่มต้น Web servers → Router → Database/Shards พร้อมระบุ “ยังไม่ได้ประเมิน” แทน placeholder เดิม การประเมินจริงยังใช้ renderer/model เดิม
- หัวข้อ 22px, instruction 17px, action/result 16px, secondary 14px, navigation >=48px; Next น้ำเงินทึบ / Back outlined / disabled neutral-dashed; theme styles scoped `.topic-lesson #lesson-topic`
- Reset และการเปลี่ยนโหมดที่เดิมเริ่มสถานการณ์ใหม่ยังเป็นการกระทำ explicit ของผู้เรียน ไม่เปลี่ยน scoring/quiz/progress contracts

## Inventory ที่ตรวจครบ

แหล่งคำสั่งเดิม: `src/lesson-layout-data.js`, `src/*-view.js` และ `webSteps()`; จับคู่กับ topic titles + controls ใน `src/lesson-topics.js` แบบหนึ่งต่อหนึ่ง ตรวจจำนวนตรงกันตอน mount

| LAB | Stable ID | เรื่อง | หัวข้อ |
|---|---|---|---:|
| 02 | workload | แยก Web/Data, ทรัพยากรร่วม, DB ล่ม, SQL/NoSQL | 4 |
| 03 | stock | โหลดเริ่มต้น, Scale up, direct outage, LB/capacity | 4 |
| 04 | balance | round-robin, เครื่องล่ม, 503, เพิ่มเครื่อง | 4 |
| 05 | replica | lag, sync, fallback, Primary ล่ม, Promote | 5 |
| 06 | cache | MISS/HIT, stale write, invalidate, TTL, outage | 5 |
| 07 | cdn | MISS/HIT, origin update, TTL, invalidate, version URL, fallback | 6 |
| 08 | stateless-web | local session, sticky, shared store, Web ล่ม, เพิ่ม Web, store ล่ม | 6 |
| 09 | data-centers | แบ่ง traffic, outage, DNS เก่า/ใหม่, ข้อมูล, capacity, release | 7 |
| 10 | message-queue | enqueue, worker/producer outage, backlog, workers, drain | 6 |
| 11 | logging-operations | local/central logs, metrics, blocked/fixed/terminal pipeline | 6 |
| 12 | database-scaling | vertical load/power/outage, sharding, hotspot, skew, reshard | 6 |

`evidence/lesson-topics/inventory.json` เก็บทุกหัวข้อพร้อม **คำสั่งเดิม, controls, visual/result target และข้อกำหนดการข้ามขั้น**; จำนวน 11/59 คำนวณด้วยโค้ดและตรวจจริง ไม่ใช้การนับด้วยสายตา LAB11 มี independent logs/metrics/pipeline ส่วนหัวข้อของบทอื่นใช้ state machine เดียวกันในบทนั้น

## Verification จริง

- RED→GREEN: topic workspace ยังไม่มี, logging results ยังไม่ filter, initial LAB12 ยังเป็น placeholder และ dark state cards ยังใช้พื้นขาว — พบ failure ก่อนแก้ แล้วผ่าน
- `npm test`: **74 passed**
- `npx playwright test --config=playwright.lesson-topics.config.js`: **21 passed** (15 behavior tests + 6 matrix tests ที่วนครบทุกบท/ทุกหัวข้อ)
- Matrix: light/dark × 1280/390/320, 320 ใช้ viewport สูง **568px**, ขนาดอื่น 800px; กด action จริงก่อนตรวจ typography/contrast/overflow และถ่าย topic/action screenshots ครบทุกบท ไม่พบ clipped topic headings/instructions/navigation หรือ horizontal overflow
- LAB01 targeted regression run รวมกับ initial topics suite: **44 passed** รวม diagram ordering, slides, readability และ quiz typography; รอบ full ด้านล่างตรวจ LAB01 อีกครั้งด้วย
- Full standalone browser suite รอบสุดท้าย: **131 passed, 8 failed, 0 skipped**. ทั้ง 8 เป็น assumptions 11-versus-12 เดิม: `app`, `cache`, `completion`, `labs` สองเคส, `logging` wraparound LAB11→LAB01, `participation`, `quiz-order`. ไม่ซ่อน failures และไม่เปลี่ยนตัวเลขเก่าที่นอก scope นี้ รายงาน `evidence/lesson-topics/full-suite.json`
- ปรับ browser behavior regressions เดิมให้เปิด explicit “ปรับเงื่อนไขอื่น” ก่อนทำ free-form simulation; layout assertions วัดเฉพาะ controls ที่ visible และย้าย selector note ไป disclosure ใหม่ ไม่ลด assertions ด้านผลจำลอง/scoring
- Backend contract tests: `test_participation.py` + `test_qualification.py`: **42 passed**
- Vite integrated build สำเร็จใน scratch เท่านั้น: `scale-topics-qa/scale-lab/dist`, 52 modules; assets `index-CQejNw07.js`, `index-GgegrGtT.css`
- Compiled actual Flask QA ใช้ synthetic seeded account และ disposable SQLite, ตรวจครบ **11 บท / 59 หัวข้อ / 19 simulation actions + 22 thinking actions = 41 unique awards**. ทุก action ส่ง identity เดิมและ HTTP 200; กดซ้ำไม่เพิ่มคะแนน; Next/Back ไม่มี progress/participation POST; DOM/state/result คงอยู่; manual+simulation ยังไม่จบจนตอบ thinking; read-back จบ 11 บทและ LAB01 ยังไม่ถูกทำ; reload ยังคง 41/11; **zero page errors**. Server ปิดใน finally แล้ว
- `git diff --check` ผ่าน
- Snapshot SHA-256 **112 files**: เปลี่ยนเฉพาะ existing `src/main.js` และ `src/database-scaling-view.js` ที่ตั้งใจแก้ ส่วน host dist, manifests, private banks, LAB01 pending source/sidebar, source คลาสอื่น, PDFs และ `~$Step3.docx` เหมือนก่อนเริ่ม รายงาน `evidence/lesson-topics/protected-files.json`

## Files ของงานนี้

Production: เพิ่ม `courses/scale-lab/src/lesson-topics.js`, `src/lesson-topics.css`; แก้ `src/main.js` (import/mount/post-render hook เท่านั้น), `src/database-scaling-view.js` (initial illustration เท่านั้น)

Tests/tooling: เพิ่ม `playwright.lesson-topics.config.js`, `tests/browser/lesson-topics.spec.js`, `tests/browser/lesson-topics-readability.spec.js`, `scripts/lesson-topics-browser-verify.mjs` และเอกสารนี้

ปรับ existing browser tests: `cdn`, `data-centers`, `database`, `labs`, `lesson-layout`, `logging`, `message-queue`, `regressions`, `replication`, `scaling`, `stateless-layout`, `stateless-web` (`.spec.js` ทั้งหมด)

Pending changes ของ LAB01/sidebars ที่มีอยู่ก่อนยังอยู่ครบ ไม่ใช่ส่วนที่แก้ใหม่ของงานนี้

## Evidence / reproduce

- `evidence/lesson-topics/`: 132 topic/action screenshots, inventory, protected hashes, full-suite report
- `evidence/lesson-topics-account/`: ผลจริง 11 บท + sanitized `report.json`
- ตรวจภาพด้วยตาจริงรวม Cache dark 390 (พบและแก้ state surface), workload light 1280, logging light 1280, stateless dark 1280 และ database-scaling dark 320; ภาพท้ายสุดมีผลจากการกดจริง

จาก `courses/scale-lab`:

```sh
PATH=/usr/local/bin:$PATH npm test
PATH=/usr/local/bin:$PATH npx playwright test --config=playwright.lesson-topics.config.js
PATH=/usr/local/bin:$PATH VITE_CLASSROOM_URL=/ \
 VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress \
 npm run build -- --base=/courses/scale-lab/ \
 --outDir /Users/prommeesee/.hermes/cache/scratch/scale-topics-qa/scale-lab/dist --emptyOutDir
```

จาก repository root:

```sh
QA_COURSES_ROOT=/Users/prommeesee/.hermes/cache/scratch/scale-topics-qa \
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python \
QA_PYTHON_ARCH=arm64 PATH=/usr/local/bin:$PATH \
node scripts/lesson-topics-browser-verify.mjs

PYTHONPATH=appworks /usr/bin/arch -arm64 \
/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python \
-m pytest appworks/tests/test_participation.py appworks/tests/test_qualification.py -q
```

## ข้อจำกัดที่ไม่อ้างเกินผลตรวจ

Full diagram ทำให้ต้อง scroll บนมือถือ; ไม่อ้างว่าทั้ง instruction/diagram/action/navigation อยู่ใน viewport เดียว ใช้ภาพแยก top/action และตรวจ action-area/result adjacency แทนการลดตัวหนังสือ การคง state หมายถึง Next/Back ในบท ไม่ได้เพิ่ม full-reload simulator persistence หรือเปลี่ยนพฤติกรรมเปลี่ยนบทเดิม

บัญชี QA เป็น seeded synthetic account ไม่ใช่ signup/OTP, restart-persistence หรือ login บัญชีจริง ไม่ได้เปิด preview ทิ้งไว้และไม่ส่งมอบ URL ทดแทน main deployment. Background shell รอบแรกเลือก arm64 Node จน Vite เริ่มไม่ได้; รันใหม่ด้วย PATH ของ x64 Node เดิมแล้วสำเร็จ ไม่ติดตั้ง dependencies ใหม่ ไม่แตะ lockfile

## Authorized Docker rollout — 2026-11-05

- Published at **https://localhost**, the existing local HTTPS stack with real account volume `classroom-accounts-20261022:/data`; no fixture or real-account login was used on this stack.
- Canonical Docker build passed before downtime. Exact running image: `sha256:e1574cb7763cef843674d038efccfa333c9710252a52e177cae75e88d7ed379c`. Old image: `sha256:9eb352ad7778e6e0be50ee5c664d212f7a9d5bf0fc72543a14b63b33c5e5e570`.
- Complete `/app` hash comparison permits only Scale dist index + old/new JS/CSS filenames (5 changed paths). New dist matches the source-qualified integrated scratch build. Backend, platform, other courses, manifests and private banks unchanged; lesson totals read from actual image: Scale 12, Estimate 5, Framework 4.
- **Actual immutable-image QA before rollout:** disposable read-only container, tmpfs synthetic accounts, no live env/data. `evidence/lesson-topics-image/report.json`: 11 lessons / 59 topics, 19 simulation + 22 thinking identities = 41 unique awards, 11 completed, zero course POSTs on skip/navigation, retained DOM/state/results, duplicate/reload awards unchanged, zero page errors.
- `evidence/lesson-topics-image-matrix/report.json`: six light/dark × 1280/390/320 cases, all 59 topics checked for typography, contrast, navigation targets, overflow and action/result adjacency; short 320×568 viewport retained. Actual action screenshots reviewed for desktop logging and narrow dark database. Mobile still requires vertical scrolling; the short database action screenshot does not show the full result at once.
- `evidence/lesson-topics-image-thinking/report.json`: six actual-image LAB01 quiz cases, 16px choices/feedback/glossary, original `flow/check-your-thinking/quiz-answer-b`, one award across reloads, no completion, zero page errors; dark 320 screenshot reviewed.
- Current rerun: **74 unit + 42 backend contract tests passed**. Earlier standalone 21-pass targeted and 131-pass/8-stale-failure full-suite evidence above is historical, not rerun or relabeled as image coverage.
- Coordinated full-volume backup while the sole writer was stopped: `/Users/prommeesee/.hermes/backups/classroom-lesson-topics-20261105-103137/data.tar`; archive SHA-256 `011e16b3720a0c56cfcddda7c7c8afbc407f2145aea8c93dc81947705e964f10`. Extracted archive independently matched baseline integrity/schema/all 25 table fingerprints and one upload hash. Backup directory 0700 / files 0600.
- Immediate post-start fingerprints matched before any HTTP probe: all 25 tables, schema and upload unchanged. Preserved 1 user, 6 progress rows, 6 manual-completion rows, 15 v2 awards, 47 request receipts, 22 activity events and all 5 preexisting sessions. Login smoke added exactly **one anonymous session**; every non-session table and preexisting session remained unchanged afterward.
- Exact environment key/value mappings and `/data` mount preserved; rollback tag `classroom:rollback-lesson-topics-20261105-103137`. Healthy exact-image readback, direct `/healthz` 200 and trusted-root-CA HTTPS `/healthz` passed without `-k`; guest course pages redirect 303 to `/login`, progress APIs return 401.
- Private sanitized deployment report: `/Users/prommeesee/.hermes/backups/classroom-lesson-topics-20261105-103137/deployment-report.json`. Host dist, source, PDFs and `~$Step3.docx` hash-preserved during deployment; only these verification documents updated afterward.
- No authenticated **live HTTPS** journey, signup/OTP or QA backend-restart persistence claim. Existing accounts/data are preserved, but real credentials were not tested. Disposable image QA container removed after verification. No commit/push.
