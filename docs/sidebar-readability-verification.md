# Scale Lab: ตัวอักษรเมนูบทเรียนด้านซ้าย

สถานะ: **deploy แล้ว** ที่ `https://localhost` ด้วยบัญชี/volume เดิม บน branch `exam-new`; **ยังไม่ commit / push**

## Current Docker release — 16px adjustment (2026-11-05)

- Deployed at `https://localhost`: healthy immutable image `sha256:9f8e37248221f568bc18309290196d10fcb8205c8d11969f8d0f353a7e0cd1cc`.
- Labels now **16px**, numbers/status remain **16px**; line-height **1.55** (24.8px). This supersedes the historical 18px label release below.
- Previous image: `sha256:102a6717167fc110d6591a9852891f423ecd601bd749cfa84e85fece8d4d5d29`; rollback tag `classroom:rollback-sidebar-16-20261105-090616`.
- Private coordinated backup and evidence: `/Users/prommeesee/.hermes/backups/classroom-sidebar-16-20261105-090616/` (`data.tar`, `deployment-report.json`, schema/table/upload fingerprints, private `runtime.env`).
- Canonical Docker build succeeded before downtime. Complete runtime delta is limited to Scale Lab dist; normalized JS/HTML unchanged, entry-referenced CSS matches `/Users/prommeesee/.hermes/cache/scratch/sidebar-16-build`. Backend, other courses, manifests and private banks unchanged.
- Current source sidebar regression: **6 passed** (parent-run isolated build). Actual immutable-image Chromium regression: **6 passed**, Light/Dark at 1280/390/320, all 12 lessons selected/unselected, computed labels/numbers 16px, line-height 24–25.6px, wrapping, scroll, hover/focus and zero course POSTs on Next/Back. Synthetic account and real backend used only in a disposable tmpfs container; evidence: `evidence/sidebar-16-image/browser.json` and screenshots.
- Stopped-writer full-volume archive verified against baseline: SQLite integrity `ok`, schema and fingerprints of **25 tables**, **1 upload**. Immediately after startup, before HTTP probes, all fingerprints matched. Existing environment and `classroom-accounts-20261022:/data` preserved.
- Trusted-CA HTTPS health/login and direct backend health passed, without `-k`; guest HTML routes return 303 to `/login`, protected APIs 401. After probes all original sessions, non-session tables and uploads preserved; exactly one anonymous session added by the login probe.
- Host dist, pending LAB01 work, reference PDFs and `~$Step3.docx` preserved by source hash verification. No commit/push; no real-account login or production QA fixtures. No new restart-persistence journey or full unit/account suite run; earlier 18px results below remain historical, not current16px reruns.

## Historical Docker release — 18px labels (2026-11-05)

- Running immutable image: `sha256:102a6717167fc110d6591a9852891f423ecd601bd749cfa84e85fece8d4d5d29` (healthy)
- Previous image: `sha256:49c5ed116e70de4eb6fca136764fd119e58ccb7804ddc024cd8a393f9ae21490`
- Rollback tag: `classroom:rollback-sidebar-readability-20261105-085948`
- Private coordinated backup/report: `/Users/prommeesee/.hermes/backups/classroom-sidebar-readability-20261105-085948/` (`data.tar`, `deployment-report.json`, fingerprints และ `runtime.env` mode 0600)
- Build จาก canonical checkout ก่อนหยุด service; complete `/app` delta จำกัดเฉพาะ Scale Lab dist. JS/HTML หลัง normalize asset-hash references เหมือนเดิม; CSS ตรงกับไฟล์ที่ entry ของ source-qualified build อ้างถึง. Backend, course อื่น, manifests/private banks ไม่เปลี่ยน
- Actual-image browser: **6 passed**, synthetic account + real backend ใน disposable tmpfs container, HTTP loopback แยกจาก production. ตรวจครบ 12 ปุ่ม selected/unselected ทั้ง Light/Dark ที่ 1280/390/320, computed 18px/16px, line-height, wrapping, scroll, hover/focus และ Next/Back ไม่ส่ง course POST. หลักฐาน `evidence/sidebar-readability-image/browser.json` และ screenshots ใน directory เดียวกัน
- หยุด writer แล้ว archive volume `classroom-accounts-20261022`; ตรวจ archive เทียบ baseline รวม schema/fingerprints **25 tables** และ upload **1 file**, SQLite integrity `ok`. หลัง restart ก่อน HTTP เท่ากันทุก fingerprint; environment และ mount เดิม
- HTTPS ตรวจ certificate/hostname ด้วย root CA (ไม่ใช้ `-k`): health/login ผ่าน, guest HTML 303 ไป `/login`, protected API 401. หลัง probes ทุก non-session table/upload และ session เดิมยังเหมือนเดิม; เพิ่ม anonymous session **1** จาก login probe เท่านั้น
- ไม่เปลี่ยน host dist, pending LAB01 source, reference PDFs หรือ `~$Step3.docx`. ไม่มี fixture/credential QA ใน volume จริง
- ข้อจำกัด: ไม่ login บัญชีจริงผ่าน HTTPS, ไม่ทดสอบ account persistence journey ใหม่; source 74 unit / 19 compiled / 6 intercepted-adapter ด้านล่างเป็นผลก่อน deploy ไม่ใช่การรันซ้ำใน release นี้. Browser actual-image เป็นการรันเพิ่มแยกจากผลดังกล่าว
- Preflight ครั้งแรกหยุดก่อน downtime เพราะ scratch build มี CSS เก่าค้าง; ปรับ verifier ให้เลือก asset จาก `index.html` จริงแล้วผ่าน ไม่ลบหรือเปลี่ยน source/build เพื่อหลบ assertion

## ขอบเขต

- เปลี่ยนเฉพาะเมนู 12 บทของ Scale Lab ใน `src/theme.css` ด้วย selector `.sidebar nav button[data-lesson]` ไม่ใช้ global `nav button` เพิ่มเติม
- ก่อนแก้ computed style ที่ desktop: ชื่อบท 12px / line-height 18px และเลข 11px; mobile เดิมลดชื่อบทเหลือ 11px ตาม media query
- หลังแก้ชื่อบท 18px / line-height 1.55 (27.9px), เลขและเครื่องหมายสถานะ 16px; จัดบรรทัดแรกตรงกัน พร้อม padding 12px 10px
- sidebar desktop กว้าง 320px (เดิม 258px และ 225px ที่ breakpoint กลาง) เพื่อรองรับชื่อไทย/อังกฤษโดยไม่ตัดข้อความ; คง vertical scroll เดิม
- mobile ใช้หนึ่งคอลัมน์แทนสองคอลัมน์ และเลื่อนรายการได้ในความสูงสูงสุด 55vh เพื่อไม่ให้เมนูทั้ง 12 บทดันเนื้อหาลงไปไกลเกินจำเป็น ชื่อยาวห่อหลายบรรทัด ไม่ย่อหรือซ่อน
- ไม่เปลี่ยนฟอนต์เนื้อหาบทเรียน, course อื่น, manifest, private bank, ID หรือระบบ progress

## ผลตรวจจริง

1. RED: เพิ่ม `tests/browser/sidebar-readability.spec.js` แล้วรัน desktop light ก่อนแก้ CSS: ล้มเหลวตามคาด `Expected 18 / Received 12` พร้อมค่าเลขจริง 11px
2. `npm test`: **74 passed**
3. standalone build ลง `/Users/prommeesee/.hermes/cache/scratch/scale-menu-build`: ผ่าน
4. `MENU_BUILD=/Users/prommeesee/.hermes/cache/scratch/scale-menu-build npx playwright test --config playwright.sidebar.config.js`: **19 passed** ได้แก่เมนู 6 cases และ LAB01 readability/slides 13 cases
5. account-mode build ลง `/Users/prommeesee/.hermes/cache/scratch/scale-menu-account-build` โดยตั้ง `VITE_CLASSROOM_URL=/` และ `VITE_CLASSROOM_PROGRESS_URL=/api/courses/scale-lab/progress`: ผ่าน
6. `FLOW_SLIDES_BUILD=/Users/prommeesee/.hermes/cache/scratch/scale-menu-account-build FLOW_SLIDES_EVIDENCE=../../evidence/sidebar-readability/account npx playwright test --config playwright.flow-slides.config.js`: **6 passed** ตรวจ Next/Back ไม่ส่งคะแนน และ action เดิมยังส่ง identity เดิม โดยใช้ API interception
7. `git diff --check`: ผ่าน; preview ports 4191/4187 ไม่มี listener หลังจบ

เมนูทดสอบจริงครบ 12 ปุ่มทั้ง selected/unselected ใน Light/Dark และ viewport 1280/390/320 × 800 ตรวจ computed font/line-height, การห่อชื่อจริง, ไม่มี horizontal overflow, เลขตรงกับบรรทัดแรก, selected/hover/focus, scroll ถึง LAB12 และการคลิกเปลี่ยนบท ตรวจว่า LAB01 Next ยัง `display:block` / 16px ไม่รับ style เมนู

## ภาพและการตรวจด้วยสายตา

`evidence/sidebar-readability/{light,dark}-{1280,390,320}.png` และไฟล์ `-last.png` แสดงช่วงต้น/ท้ายเมนู; `account/` เป็นภาพ LAB01 จาก account-mode frontend regression

ตรวจภาพ desktop และ mobile ทั้งสอง theme แล้ว: ชื่อไทย/อังกฤษอ่านได้ เลขอยู่บนบรรทัดแรก active สีเดิม ไม่มีข้อความถูกบีบในช่องเลข; ชื่อยาวบางบทเป็น 3 บรรทัดที่ 320px ขอบ scroll viewport อาจแสดงบางส่วนของรายการถัดไปตามปกติ แต่เลื่อนถึงข้อความและ LAB12 ได้ครบ

## การรักษางานเดิมและข้อจำกัด

Snapshot SHA-256 ก่อน/หลังรวม 70 ไฟล์ (course dist, Scale source, manifests/banks และ `~$Step3.docx`) พบเปลี่ยนเพียง `courses/scale-lab/src/theme.css` งาน LAB01 ที่ค้างอยู่เดิมยังเหมือน snapshot ไม่แก้ไฟล์เหล่านั้น

ในขั้น source QA ก่อน deploy ไม่แตะ Docker/container/volume จริง ไม่ build ทับ host dist ไม่ใช้บัญชีจริง และไม่มี commit/push (deployment ที่ทำภายหลังดู release ด้านบน). การทดสอบ account-mode ครั้งนี้เป็น frontend contract ผ่าน API double **ไม่ใช่**การตรวจ persisted account หรือ HTTPS authentication ใหม่. Vite แจ้งตามปกติว่า outDir นอก project ไม่ถูกล้างอัตโนมัติ; build สำเร็จและ browser ใช้ entry/assets ใหม่
