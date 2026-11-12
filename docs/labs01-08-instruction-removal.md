# LAB01 and LAB03–08 instruction-strip removal

Canonical `exam-new`; no deployment. This report describes the extension after LAB02; the published change includes LAB02 removal too.

## Topic-to-node mapping

LAB01 omits `#flow-instruction` creation and its per-topic writer, preserving `#flow-scenario`. LAB03–08 remove `.experiment` only after retaining its live navigation heading; callbacks never reinsert the detached container. Removed target-scoped unused instruction/list CSS and orphan nav bottom padding/dividers. Scenario diagrams, outcomes, toolbar warnings, controls, reading and quiz remain.

### flow: `#flow-instruction`

- 1 / 4 · ค้นหา IP ก่อนส่งคำขอ
- 2 / 4 · ส่งคำขอเข้าเครื่องเดียว
- 3 / 4 · รับคำตอบและแสดงหน้าเว็บ
- 4 / 4 · เปลี่ยนเป็นแอป แล้วเทียบคำตอบ

### stock: `#lesson-topic[data-kind="stock"] .experiment`

- 1 / 5 · โหลดเกินกำลังเริ่มต้น
- 2 / 5 · Scale up เครื่องเดิม
- 3 / 5 · หลายเครื่อง แต่ยังต่อเครื่องเดิม
- 4 / 5 · กระจายไปเครื่องที่พร้อม
- 5 / 5 · โหลดเกินกำลังรวม

### balance: `#lesson-topic[data-kind="balance"] .experiment`

- 1 / 4 · Round-robin ระหว่างสองเครื่อง
- 2 / 4 · เครื่องแรกหยุดรับงาน
- 3 / 4 · เมื่อไม่มีเครื่องพร้อม
- 4 / 4 · เพิ่มเครื่องเข้ารับงาน

### replica: `#lesson-topic[data-kind="replica"] .experiment`

- 1 / 8 · เขียนแล้วสำเนายังตามไม่ทัน
- 2 / 8 · อ่าน Primary แล้วส่งสำเนา
- 3 / 8 · Replica หนึ่งเครื่องล่ม
- 4 / 8 · ไม่มี Replica พร้อมอ่าน
- 5 / 8 · Primary ล่ม ไม่เขียนหรือส่งสำเนา
- 6 / 8 · ยังไม่ยืนยัน fencing
- 7 / 8 · Fence แล้ว ยังไม่ยอมรับข้อมูลสูญเสีย
- 8 / 8 · Promote พร้อมยอมรับความสูญเสีย

### cache: `#lesson-topic[data-kind="cache"] .experiment`

- 1 / 5 · อ่านครั้งแรกและอ่านซ้ำ
- 2 / 5 · ต้นทางเปลี่ยน แต่สำเนายังเก่า
- 3 / 5 · ลบสำเนาแล้วโหลดใหม่
- 4 / 5 · เวลาและอายุสำเนา
- 5 / 5 · Cache ล่มและกลับมาใหม่

### cdn: `#lesson-topic[data-kind="cdn"] .experiment`

- 1 / 6 · MISS แล้ว HIT
- 2 / 6 · Origin เปลี่ยน สำเนายังเก่า
- 3 / 6 · สำเนาหมดอายุตาม TTL
- 4 / 6 · Invalidate key ปัจจุบัน
- 5 / 6 · URL รุ่นใหม่และ cache key
- 6 / 6 · CDN ล่มกับทางสำรอง

### stateless-web: `#lesson-topic[data-kind="stateless-web"] .experiment`

- 1 / 7 · Session อยู่คนละเครื่อง
- 2 / 7 · Sticky กลับเครื่องเดิม
- 3 / 7 · Shared store ใช้สถานะร่วมกัน
- 4 / 7 · Web ล่ม แต่สถานะยังอยู่
- 5 / 7 · เพิ่ม Web เข้าสู่ pool
- 6 / 7 · Shared store ล่ม
- 7 / 7 · ไม่มี Web พร้อมรับงาน

## Commit readiness verification

- Fresh unit run: **151 passed, zero failed**. Scratch Vite build: **96 modules**, using the existing parent-owned preview output; no main dist, database, server or deployment changes.
- Fresh focused compiled browser checks: **8 strip checks passed** (all target topics in Light/Dark at 1280/390/320, reduced-motion experiment/replay for every target topic, and exact LAB09–12 DOM against the committed fixture); **6 timing checks passed** (LAB01 measured motion/pause/replay/cancel in both themes at desktop/mobile, LAB02 blocked hold/fade, LAB12 simultaneous and sharding-stage timing).
- New local outputs are isolated under scratch `strip-publish-check/` and `animation-publish-check/`; unit output is `animation-strip-publish-units.log`. These are local evidence, not runner dependencies. Earlier full-suite counts below are historical, not fresh full-suite claims.
- Run browser commands from `courses/scale-lab` against an already built standalone preview on port 4178. Set `STRIP_EVIDENCE` or `ANIMATION_TIMING_EVIDENCE` to a fresh output directory; both reporters and screenshots honor them. No baseline file is required in those directories. Install package dependencies and Playwright Chromium before running on a new checkout.
- Stale LAB02-only browser expectations and unrelated historical LAB11/12 runners/reports remain excluded and preserved locally. Commit/push is separately authorized; neither merge nor deployment is part of this change.

## Original implementation verification (historical local evidence)

Evidence: `/Users/prommeesee/.hermes/cache/scratch/labs01-08-strips/`.

- TDD: expected mounted-node RED first on LAB01, then on LAB03 after LAB01 was fixed; GREEN after scoped changes.
- Unit: **151 passed, 0 failed**, `unit.log`.
- Browser: **12 passed** in bounded runs: `browser.json` (7), `playback-desktop.json` (2), `playback-mobile.json` (3). Combined long run exceeded the tool's 420-second limit; only completed bounded reruns count.
- Every target topic forward/back, reset/remount: Light/Dark at 1280/390/320. Named nonempty controls, retained diagram/quiz, zero instruction nodes, zero nav bottom border/padding, gap 0–24px and no document overflow passed.
- Normal-motion first-topic experiment/pause/resume/replay in all seven labs at 1280/390, both themes: advancing animation time and frozen paused samples. Every topic also executes/replays with reduced motion; outcomes attached to mobile report. Standalone presentation QA, not authenticated persistence verification.
- LAB02 removal retained. Exact LAB09–12 instruction DOM and headings compared against pre-edit baseline on every topic. Only nine presentation source files changed from captured hashes; animation config, models/scoring, untargeted renderers and live dist unchanged.
- Vite passed, 96 modules, built into `/Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build`. Parent preview PID 162 kept alive at **http://127.0.0.1:4178** (standalone, no platform login). No live dist/db/4173/deploy/commit/push changes.

Use `/usr/local/Cellar/node/26.7.0/bin/node` explicitly. Unit command: `node --test tests/*.test.js`. Build: `node node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build`. Browser: `node node_modules/@playwright/test/cli.js test --config playwright.target-strip.config.js`; split with `--grep` and `STRIP_REPORT` to bound runs.

Screenshots: `{kind}-{theme}-{width}-{topic}.png` and `{kind}-{theme}-{width}-paused.png`. Reviewed seven-lab mobile contact sheets `seven-light-contact.png`, `seven-dark-contact.png`, and full `replica-dark-390-2.png`; originals retained. The original `baseline.json` records pre-edit rendered topic/removed-node markup. The committed bounded fixture `courses/scale-lab/tests/browser/fixtures/untargeted-instruction-baseline.json` retains only kind/title/strip for LAB09–12 (6/5/3/2 topics), extracted from that actual capture. The regression reads this fixture relative to its module, never from output evidence.

Historical untracked files preserved. The older LAB02-only test expects LAB03's strip; that assertion is superseded by this authorized extension, and the new exclusion regression compares LAB09–12 instead.
