# LAB03: viewport stability on Next / Back

## Outcome and scope

Workspace `/Users/prommeesee/projects/classroom`, branch `exam-new`, starting HEAD `68d174c`.
Changes are **not committed, pushed or deployed**. Only the parent-owned standalone preview at http://127.0.0.1:4178/ was rebuilt, into `/Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build`; PID 162 remains running. Select LAB03. This preview has no platform login and uses browser-local progress.

## สาเหตุที่ยืนยันแล้ว

- เมื่อกด Next/Back ตัว `show()` เรียก `heading.focus({preventScroll:true})` แล้วเรียก `topic.scrollIntoView({block:'start',behavior:'instant'})` ตามหลังอีกครั้ง จึงเลื่อนหน้าไปตำแหน่งที่โค้ดกำหนด แทนที่จะเก็บตำแหน่งที่ผู้เรียนกำลังดูอยู่ `preventScroll` ของ focus ไม่ได้ยกเลิกคำสั่งเลื่อนถัดมา
- ในมือถือ ชื่อหัวข้อยาวไม่เท่ากันทำให้แถว navigation เปลี่ยนความสูง แม้หยุดเลื่อน scrollY แล้ว ต้นฉากยังขยับ 9.59375px ที่ 390px และ 28.796875px ที่ 320px
- Probe ปิดเฉพาะ `scrollIntoView` ทำให้ scrollY/nav-top drift เป็น 0 ทั้งสามความกว้าง; ปิด focus หรือ browser scroll anchoring อย่างเดียวไม่ช่วย จึงไม่ใช่ focus restoration หรือการยุบฉากระหว่าง render ที่เป็นสาเหตุของ Next/Back
- LAB02 ใช้ realignment เดียวกัน: จาก nav top 180px ไป 120px desktop / 114px mobile เช่นเดียวกับ LAB03 จึงไม่ใช่ตัวอย่างที่นิ่งทุกตำแหน่ง เปรียบเทียบด้วยตำแหน่งเริ่มเดียวกันแล้วพบอาการเช่นกัน แต่ไม่แก้ LAB02 ในงานนี้
- ตรวจ parent commit แล้วพบ `scrollIntoView` เดิมอยู่ก่อนการลบ instruction strip; ไม่กล่าวว่าการลบ strip เป็นผู้เพิ่มบั๊กนี้

## Minimal correction

- `src/lesson-topics.js`: gate only `kind === 'stock'` out of the existing scrollIntoView call, preserving title focus and all other labs' behavior. Add LAB03-only title sizing spans from the real five titles.
- `src/scaling-view.css`: overlap invisible `aria-hidden` title sizing spans in one grid cell. The tallest title reserves natural height at the current font/width; no hardcoded title-height, timeout, scroll restoration loop, global anchor override or scroll lock.
- Added `tests/browser/scaling-scroll.spec.js` and `playwright.lab03-scroll.config.js`.
- No changes to model, presets, actions, scoring, `main.js`, animation implementation or centralized timing.

## RED / GREEN evidence

Evidence root: `/Users/prommeesee/.hermes/cache/scratch/`.

| Check | Observed result |
|---|---|
| Initial RED, six width/theme combinations, all five topics Next and Back | 6 failed; nav drift 60px desktop, 66px mobile from nav top 180px |
| Isolate title wrapping, disable scrollIntoView in probe only | 320px RED: nav-bottom/scene-top drift 28.796875px |
| Compiled fix, initial viewport matrix | 6 passed |
| Lifecycle + neighboring LAB02/LAB04 + viewport matrix | 24 passed |
| Final viewport matrix with initial nav tops 90/180/300/120px | 6 passed: 48 transitions, 749 click/mutation/rAF samples, max scrollY/nav-top/nav-bottom/scene-top drift **0px** |
| Existing strip regressions: all topics at 1280/390/320 Light/Dark, reduced-motion execute/replay, untargeted LAB09–12 DOM | 8 passed |
| Course units | 151 passed, 0 failed |
| Vite scratch build | 96 modules, successful |
| Whitespace | git diff --check passed |

All new viewport/lifecycle tests use a short **560px height**, normal motion, and actual Playwright clicks/keyboard events. They cover first/last disabled boundaries, Enter/Space and title focus/Tab order, rapid Next→Back→Next during actual replay, 3500ms settling beyond the 2000ms route/3200ms offline animation, freely scrolling wheel down/up, reset functionality and stable navigation after reset. Scene bottom is recorded but deliberately not required to stay fixed: three-machine/Load-balancer scenes legitimately have different heights.

Evidence:
- `lab03-scroll-red/`: initial RED JSON and screenshots.
- `lab03-no-scroll/`, `lab03-no-focus/`, `lab03-no-anchor/`: controlled root-cause probes.
- `lab03-title-red/`: title-wrap failure.
- `lab03-comparison.json`: focus/scrollIntoView call traces and LAB02 comparison.
- `lab03-scroll-final/`: 24-pass report, six lifecycle screenshots and viewport measurements.
- `lab03-scroll-offsets/`: final six multi-offset tests and 749 samples.
- `lab03-strip-regression/`: eight existing regression results and screenshots.
- `lab03-units.log`: 151 unit results.

Inspected screenshots:
- `lab03-scroll-final/lifecycle-320-dark.png`
- `lab03-scroll-final/lifecycle-1280-light.png`

Both show centered usable navigation and the scene directly below it; tall mobile scenes remain normally scrollable rather than shrunk to fit.

## Reproduce

From `courses/scale-lab`, use the compatible executable:

```sh
NODE=/usr/local/Cellar/node/26.7.0/bin/node
$NODE node_modules/vite/bin/vite.js build --outDir /Users/prommeesee/.hermes/cache/scratch/lab12-why-sharding-build
SCROLL_EVIDENCE=/Users/prommeesee/.hermes/cache/scratch/lab03-scroll-rerun \
  PLAYWRIGHT_BROWSERS_PATH=.browsers $NODE node_modules/@playwright/test/cli.js test -c playwright.lab03-scroll.config.js
$NODE --test tests/*.test.js
```

Served asset bytes were fetched over HTTP and matched the scratch files:
- JS `index-x4xmSja2.js`: SHA256 `491422ee3558686cadbf1fef86840fbafe5bc33fecd5689dccc6840bed4f941a`
- CSS `index-aij28Isf.css`: SHA256 `8882fe4e21a8cb22666d0a65879c9d76693a01d22cfa850797dd1bc1f6299f1a`

## Explicit limitations / remaining behavior

- **Reset is functional, not position-invariant.** The existing reset replaces the entire app, focuses the header Reset button, and subsequent layout/anchoring shifts scrollY by 8px desktop / 42px mobile in the measured reset journey. A stricter reset-geometry assertion failed and was not represented as a pass: the retained acceptance test checks reset state/focus and subsequent stable Next instead. The same 8/42px behavior was reproduced against the original compiled JS/CSS via browser-only HTML interception (`lab03-reset-baseline.log`), so this is pre-existing and separate from Next/Back. No global remount or glossary change was bundled into this scoped fix. If reset itself must be immobile, that remains additional work.
- Browser coverage is Chromium, not Safari/Firefox or physical devices. Keyboard is exercised; no screen-reader session.
- Standalone UI/model coverage is not authenticated scoring/persistence verification; no account backend or database was used.
- Main dist, databases, 4173, deployment and existing historical artifacts were not written or stopped. No before/after whole-production hash claim is made.
