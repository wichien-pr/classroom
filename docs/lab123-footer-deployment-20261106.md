# LAB01–03 and completion footer — Docker release 20261106-102503

Deployed current `exam-new` checkout (HEAD `5c84b11b686acd3e6bd04521942b2fd86c5f117e` plus pending LAB03/footer sources) to **https://localhost/**, existing real-account Docker stack. Local loopback only; no commit or push. This release supersedes the source-only deployment status in the earlier LAB02, LAB03 and completion-footer verification notes; their earlier test evidence remains historical.

## Exact target

- Context: `desktop-linux`; project: `classroom-docker-qa`.
- Compose order: `compose.yaml`, `compose.accounts.yaml`, `compose.https.yaml`, `compose.https-local.yaml`.
- Backend `classroom-docker-qa-classroom-1`: healthy, zero restarts, image `sha256:c2800b23dab631cd2f31cf2b1ccabee75bde2e22ef2b12e5dec381749aae90aa`.
- Caddy `classroom-docker-qa-https-1` retained unchanged, image `sha256:8f5619aac3ed45304632491507becd99711bcaed375aee3e6317c7b703902969`.
- Same external volume `classroom-accounts-20261022`, database `/data/classroom.sqlite3`, uploads preserved.
- Rollback tag: `classroom:rollback-lab123-footer-20261106-102503` (old immutable image `sha256:84785b5aac9103f648fb9668ada1cd77ad2d81d119c80da61fffc4a0ffa6d99f`).

## Build and qualification

Docker compiled and validated all enabled courses before stopping the writer. Complete `/app` hash comparison permitted only Scale Lab dist: index HTML plus old/new hashed JS/CSS (five changed paths). Backend, manifests, private banks and other course bundles are identical. Underlying runtime image layers excluding the final course layer also match. Scale Lab image assets match the previously source-qualified integrated scratch bundle; host dist was not rebuilt.

Fresh immutable-image QA used read-only containers, tmpfs databases/uploads, synthetic accounts and loopback HTTP; no real environment or live volume was mounted:

- Backend qualification/progress/participation: **64 passed**.
- LAB03: **5 presets / 5 action POSTs**, original `stock / stock / order`, 2 semantic awards including wrong thinking answer; navigation/playback zero POSTs, explicit completion and reload readback passed.
- Footer: **all 12 lessons**, wrong answer alone disabled; experiment enables explicit completion; repeat actions deduplicate; **24 awards / 12 explicit completion POSTs**; reload preserved all 12.
- LAB02: **6 action POSTs / 1 semantic award**, zero navigation/playback POSTs; held-save icon and restored focus passed.
- LAB03 visual/motion: **7 tests**, all five topics at 1280/390/320 in Light/Dark plus reduced motion. Geometry, particles, pause, tooltip/focus and overflow assertions passed.
- LAB01/LAB02 icon/dotted smoke: **12 cases** across both themes and three widths.
- Screenshots inspected: dark 320px LAB03 topic 4 retains readable action-adjacent result; the diagram intentionally scrolls. Desktop light footer clearly enables completion despite the wrong answer, preserving policy.

Fresh evidence: `evidence/release-20261106-102503-{lab03,footer,lab02,matrix,smoke}/`. Disposable QA containers removed after verification.

## Preservation and HTTPS

Private backup/report directory:
`/Users/prommeesee/.hermes/backups/classroom-lab123-footer-20261106-102503`

The default runtime env file was absent. Before downtime the effective running environment was preserved there as private `runtime.env` (0600), explicitly supplied to recreation, and compared as key/value maps afterward without exposing values. Directory is 0700.

Stopped only the identified backend writer; archived the entire volume through a read-only, network-disabled helper. Verified archive integrity, schema, deterministic row fingerprints for **25 tables**, and upload hashes against the stopped baseline. Immediate post-startup fingerprints matched before HTTP requests. Post-probe all original session rows and every non-session table/upload remained unchanged; `/login` added exactly one anonymous session. Archive `data.tar` SHA-256:
`f40d9f625340e5e33543c707e83d03bb0e79a36ccb7b90c3d0c0a04046c20302`.

Trusted local-CA HTTPS `/healthz`, `/login`, HTML 303 redirects to login and protected API 401 responses passed; direct backend health 200. Running `/app` hashes match the qualified immutable image. No auth weakening, real-user login, mail sending, data reseeding or system CA changes.

Machine-readable evidence: backup directory `deployment-report.json`, with archive and before/after fingerprints. Rollout script: `/Users/prommeesee/.hermes/cache/scratch/deploy-classroom-lab123-footer-20261106-102503.py`.

Tracked/untracked implementation sources, PDFs, `~$Step3.docx`, and canonical dist hashes remained unchanged during build/rollout. Standalone preview PID 21546 remains at http://127.0.0.1:4173/ (HTTP 200), separately using browser-local progress.

Limits: synthetic authenticated course QA, not signup/OTP or real-account login; no QA backend-restart persistence journey. Full historical standalone suite was not rerun and is not claimed green. No commit/push.
