# Catalog covers and Framework overview

Deployed to the existing real-account Classroom stack at `https://localhost` on `feat/ux-ui-improvements`. No commit or push.

- Catalog green uses semantic light/dark cover, title, subtitle and decorative-brace tokens. Light cover `#e2efe8`; dark cover `#1e3931`. Course lesson themes are unchanged.
- Framework Lab description summarizes its existing four stages: requirements/scope, high-level design with customer feedback, focused deep dive, recap/bottlenecks/improvements. Title, stable IDs, lesson/action contracts and private bank are unchanged.
- Existing Scale/Estimate copy remains intact. Flex card bodies align desktop progress/footer positions without truncating descriptions; mobile cards retain content-driven height. Progress count/bar spacing no longer inherits the generic paragraph minimum height.

## Verification

TDD browser failures observed for missing Framework description, fixed green cover, disconnected progress spacing, and dark subtitle overridden by the global muted rule; each subsequently passed.

```sh
QA_PYTHON=/Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python QA_PYTHON_ARCH=arm64 QA_EVIDENCE=evidence/catalog-theme-verified/ node scripts/theme-browser-verify.mjs
PYTHONPATH=appworks /usr/bin/arch -arm64 /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python -m pytest appworks/tests -q
/usr/bin/arch -arm64 /Users/prommeesee/.hermes/cache/scratch/classroom-login-venv/bin/python scripts/courses.py validate
```

- Full backend suite: **433 passed**. After the final subtitle specificity correction, focused theme/catalog suite: **41 passed**.
- Browser: **25 scenario groups passed**, zero page errors. Catalog assertions run at 1920, 1280, 900, 768, 390 and 320px in both themes: exactly three cards, target-specific Framework title/overview, actual cover/subtitle/brace colors, title/subtitle contrast >=4.5, compact progress groups and desktop aligned bars. Existing platform header, navigation, cross-tab/storage fallback and logout checks also pass.
- Final report: `evidence/catalog-theme-verified/browser.json`; screenshots `catalog-{light,dark}-{1280,390,320}.png` in the same directory. Desktop/mobile screenshots inspected for reading hierarchy and card spacing.
- Manifest validation passed for all three courses; `git diff --check` clean.
- SHA-256 snapshot comparison: **13 dist/private-bank files unchanged**. No course build needed for a catalog template/description change. No Docker commands, real account access, volume writes or live HTTP probes performed.
- QA uses a disposable loopback Flask server and synthetic account, not the real Docker account database; owned QA server terminated and listener closure verified by the runner. Existing uncommitted theme/header/course changes retained.

## Docker release verification — 2026-11-04

The source-only results above precede deployment; their no-Docker/no-live-probe statement describes that QA phase only.

- Canonical Docker build succeeded before downtime. Running image: `sha256:77ef7f048989f3ffc778f0e5b4b8abcd513f5dda015590702dc0a39a65dff6b4`.
- Complete old/new `/app` hash comparison permits exactly `appworks/templates/classroom.html`, `appworks/templates/theme-style.html`, and Framework `course.json`. Parsed manifests prove only its description changed. All backend code, course bundles, private banks and other manifest fields match the prior image.
- Actual immutable-image synthetic-account Chromium QA: **12 width/theme checks passed**, zero page errors; 1920/1280/900/768/390/320px, light/dark colors, contrast, exact Framework overview, compact progress groups, desktop alignment, overflow and reload persistence. Evidence: `evidence/catalog-theme-release-image/browser.json` and adjacent screenshots. Dark desktop 1280 and light mobile 320 screenshots inspected.
- Coordinated stopped-volume backup: `/Users/prommeesee/.hermes/backups/classroom-catalog-theme-20261104-145042/data.tar`; SHA-256 `c860923c35be321c75c8d4595f2a46f953fd0acfece8e270f68fa87b7f113b06`. Extracted archive verified against the stopped-volume baseline, including integrity, schema, all 25 table fingerprints and upload hashes.
- Immediate post-recreation database/schema/uploads exactly match the baseline. Environment and `classroom-accounts-20261022:/data` preserved. After HTTPS probes all non-session tables and preexisting sessions still match; exactly one new anonymous login-probe session was added.
- Running `/app` matches the qualified image. Healthy container, direct and trusted-CA HTTPS `/healthz` passed; login theme markers present; protected HTML redirects to `/login` (303), protected APIs reject guests (401). No insecure TLS bypass or real-account authentication used.
- Existing uncommitted source, local PDFs, `~$Step3.docx` and host course dist retained unchanged; this document is the only release documentation edit.
- Detailed private report: `/Users/prommeesee/.hermes/backups/classroom-catalog-theme-20261104-145042/deployment-report.json`. Immutable rollback tag: `classroom:rollback-catalog-theme-20261104-145042` (prior image `sha256:e030ff17442918e9548ee192696ee0a85eb51e70add5918cf57af144d1df35b2`).

## Limitation

Authenticated browser coverage uses disposable synthetic accounts on the exact image over loopback HTTP, not real accounts on live HTTPS. Live verification is trusted-CA HTTPS health/login/guest protection plus full data/runtime preservation. Green changes remain confined to catalog covers, not diagrams or lesson navigation.
