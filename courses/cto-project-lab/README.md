# CTO Project Lab

Account-backed individual project assessment, independent of Participation Score, course completion levels and L9. This is a working workflow/evidence tracker, **not an automated code grader**. A human CTO verifies repository artifacts, meetings, tests and demonstrations. Publishing this source does not perform a deployment.

## Source mapping

The user-supplied workflow image is retained locally, not distributed in this checkout or public output. The transcription below is sufficient to understand the workflow. Visually read image title: **AI-Assisted Software Development Workflow**.

| Order | Image text | Plan annotation |
|---|---|---|
| 1 | หารือ Requirement กับ CTO | 1 week |
| 2 | สรุป Requirement กับ CTO | 1 week |
| 3 | UX/UI — CTO | 1 week |
| 4 | High-Level Design — CTO | 1 week |
| 5 | Low-Level Design — CTO | 1 week |
| 6 | Dev + Unit Test / Result / AI Agent | 1 week |
| 7 | Deploy / CI/CD | 1–2 weeks* |

Image banner: **ทดลองใช้ AI + Agent ในทุก ๆ จุด**. Footnote: **ต้นฉบับระบุทั้ง 1 และ 2 สัปดาห์**. These are planning annotations, not automatic deadlines. No invented calendar dates or summed delivery promise.

The image supplies the seven ordered phases and AI emphasis. The project bank, acceptance examples, quality targets, evidence rubrics and review state machine are supplementary implementation for the requested difficulty **3/5**.

## Workflow

- First explicit **เริ่มโปรเจกต์** atomically assigns one server-random snapshot from four templates: equipment booking, repair requests, daily sales CSV, inventory reconciliation CSV. Two web / two batch entries, equally sampled. No reroll endpoint; refresh/relogin/restart and repeated Start retain the assignment. Bank changes cannot rewrite assigned requirements.
- Moderate scope: one developer, one service/CLI and local database/files. Small reproducible workload; no mandatory microservices, Kubernetes, or multi-region design. Examples include authorization/conflicts for web, decimal arithmetic/reject reports/deduplication/atomic outputs for batch. Numeric performance targets are assignment criteria to measure, not measured results or production SLAs.
- All seven phases appear in the step navigation; only the selected phase detail is mounted. Only phase 1 is editable initially. Save draft or submit evidence plus AI-use reflection. Submit locks learner editing until CTO requests changes. Approval permanently locks that phase and unlocks the next. Seven approvals show complete.
- Batch UX means CLI arguments, input/output schemas, exit codes, logs, errors, retries and runbook—not a compulsory web interface.
- Text and artifact URLs are stored as escaped plain text (up to 3,000 characters per field); no upload, URL fetching, execution, notification, or automatic judging. Never paste secrets. Drafts save only on explicit save/submit; reload discards unsaved text after confirmation.
- Review dashboard lists started projects and step states; the backend keyset-paginates at 50 projects and client retrieves all pages. Human feedback is mandatory for approve/changes. Learners cannot access the dashboard or approve themselves; even configured reviewers cannot approve their own work.

## Reviewer authorization / deployment

Reviewer authority defaults to empty. Configure the authenticated stored account email through `CTO_REVIEWER_EMAILS=wichien@appworks.co.th` in the actual private runtime env file. Legacy explicit IDs are supported as a union. Process settings override private-file values; the `APPWORKS_` form wins within a layer. See [reviewer configuration](../../docs/cto-project-contract.md). Never infer authority from a name or client field; reviewers cannot approve themselves.

Deployment needs separate authorization, storage identification and backup. The four additive tables do not modify learning qualification or exam records. The Docker build discovers this manifest and uses the included lockfile with `npm ci`. Historical deployment reports and host-specific rollout scripts are not reusable checkout dependencies and are intentionally not part of this source package.

## Backend contract

Implementation: `appworks/cto_project.py`; installed in `appworks/app.py`.

- `GET /api/cto-project`: current authenticated account only; project, ordered steps, immutable history, CSRF token and reviewer flag.
- `POST /api/cto-project`: `{action:"start"}` or `{action:"save"|"submit",step,version,request_id,evidence,reflection}`.
- `GET /api/cto-project/review?after=<user_id>`: explicitly authorized reviewers only; `projects` and nullable `next` cursor.
- `POST /api/cto-project/review/<owner_id>`: `{action:"approved"|"changes_requested",step,version,request_id,feedback}`.

All POSTs retain shared session-bound `X-CSRF-Token` and origin checks. Writes acquire SQLite `BEGIN IMMEDIATE`, revalidate live session, enforce owner/reviewer/state/version, and atomically save evidence, append audit history and persist actor+UUID-v4 receipts. Exact retries are safe; conflicting UUID reuse or stale versions return 409. Start is semantically idempotent via one project row/account. History snapshots include actor, action, evidence, reflection, feedback and timestamp; SQLite triggers reject UPDATE/DELETE. Project creation time is retained in `cto_projects`. This is application audit integrity, not protection from a privileged database administrator.

CTO routes alone allow an 80 KiB authenticated POST body to accommodate JSON-escaped Unicode for two 3,000-character fields; unrelated endpoint limits stay unchanged.

Manifest intentionally omits lessons, participation and assessment banks. Generic progress endpoint returns 404; no credits or L9 eligibility are awarded. Ordinary course opening can still produce the platform's normal Activity event.

## Build and isolated QA

```sh
npm --prefix courses/cto-project-lab ci
npm --prefix courses/cto-project-lab run build
python3 scripts/courses.py validate
```

Zero external frontend dependencies. Build copies the three owned assets into this course's `dist`, with account URLs rooted at `/courses/cto-project-lab/`. This is **account-only**: a standalone static server without the platform API is not a functioning alternative.

Install Python dependencies from `appworks/requirements.txt` plus pytest in a virtual environment. Browser QA reuses the repository's pinned Playwright dependency: run `npm --prefix courses/scale-lab ci`, then install Chromium with `PLAYWRIGHT_BROWSERS_PATH="$PWD/courses/scale-lab/.browsers" npm --prefix courses/scale-lab exec -- playwright install chromium`.

Run from the repository root (choose an existing private scratch directory):

```sh
export QA_SCRATCH_ROOT="${TMPDIR:?set TMPDIR to a private scratch directory}"
export QA_PYTHON="$PWD/appworks/.venv/bin/python"
node courses/cto-project-lab/tests/step-navigation.mjs
node scripts/cto-polling-browser-verify.mjs
node scripts/cto-polling-browser-verify.mjs --workflow
```

`QA_PYTHON` defaults to `python3`. On mixed-architecture macOS only, set `QA_PYTHON_ARCH=arm64` if the Python wheels require it. `PLAYWRIGHT_BROWSERS_PATH` overrides the browser cache. `QA_EVIDENCE` optionally selects an output directory; by default each run writes evidence in its own scratch workspace.

The runner builds only this course into scratch, starts an ephemeral loopback server with synthetic users and a synthetic reviewer email, and stops it in `finally`, checking process exit and listener closure. It strips inherited deployment/mail configuration and uses private scratch session capabilities, never real accounts or signup/OTP bypasses. Reports contain no session tokens. `--workflow` runs all seven approvals plus learner/reviewer mobile navigation; the default exercises real polling intervals, stale reads, backoff, focus/scroll/disclosures and retained drafts. These are authenticated synthetic-session checks, not login/OTP tests.

Backend tests need built courses for catalog discovery. In a **disposable checkout/index export**, install each enabled course's dependencies, run `python3 scripts/courses.py build`, then `PYTHONPATH=appworks "$QA_PYTHON" -m pytest appworks/tests/test_cto_project.py appworks/tests/test_cto_email_role.py appworks/tests/test_cto_qa_packaging.py -q`. Never build the live checkout for packaging QA. Retired timed-exam files are not included in this feature package.
