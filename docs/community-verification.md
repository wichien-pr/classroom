# Community verification

Workspace: `/Users/prommeesee/Documents/04_Learning/classroom`.

## Results from execution

| Suite | Actual result | Evidence |
|---|---|---|
| Full Flask backend | **192 passed** | `evidence/community-backend-tests.txt` |
| Community-specific Flask tests | **22 passed** | `evidence/community-unit-tests.txt` |
| Scale Lab Node unit suite | **21 passed** | `evidence/community-course-regressions.txt` |
| Standalone course browser suite | **16 passed** | same log |
| Course account browser suite | **6 passed** | same log |
| Authenticated platform/course integration | passed | `evidence/community-platform-regression.txt`, `platform-browser.json` |
| Real account progress integration | passed | `evidence/community-progress-regression.txt`, `account-progress-browser.json` |
| Community real-browser journey | **15 checks passed**, no page errors | `evidence/community-browser.json`, `community-browser-run.txt` |
| Browser edge cases | passed: 80-character author at 320px, Thai body 2,000 chars, retained invalid draft | `evidence/community-edge-browser.json` |
| Moderator/browser error journey | passed: unpin/repin, moderator deletes others' post/comment, invalid comment edit stays in correct form | `evidence/community-moderation-browser.json` |
| Actual QA server restart | passed: existing session, edited post, pin and deleted comment persisted | `evidence/community-restart.json` |

Backend commands must run from `appworks/` (or explicitly set PYTHONPATH). An attempted root-directory pytest invocation produced import errors because this repository uses top-level `app` imports; rerunning from the documented directory passed. This was a runner cwd issue, not a missing dependency.

## TDD development observations

The following are observed development milestones, not a fabricated terminal transcript. Tests were introduced in vertical behavior slices, run RED, then implemented and run GREEN. Additional existing-behavior tests were labelled regression checks rather than claimed RED-first coverage.

1. Authenticated empty feed: missing `/community` returned 404 instead of 303; then **1 passed**.
2. Create/read/plain-text validation: missing POST returned 404; then **2 passed**.
3. Owner edit/delete/moderation: missing editor returned 404 instead of forbidden; then **3 passed**.
4. Likes/comments: missing like route returned 404; then **4 passed**.
5. Search/category/pagination: questions filter leaked `Post 24`; then **5 passed**.
6. Persistent rate limits/retry: duplicate submission created post 2 instead of reusing post 1; valid maximum Thai text hit 413 with URL encoding. Dedup/rate transactions and multipart text forms fixed these; **7 passed**.
7. Navigation/strict forms: old placeholder lacked Community link; arbitrary `user_id` extra field was accepted. Fixed navigation/strict allowlists and friendly errors; full suite **180 passed** at that milestone. Concurrent likes and duplicate submissions already passed as regression coverage.
8. Deleted-ID reuse and long comment thread: SQLite ordinary INTEGER PK reused the removed post ID, and new comments redirected to page 1. AUTOINCREMENT and correct page redirect fixed both; full suite **188 passed**.
9. Very large route integers reproduced `OverflowError` from SQLite on both post/comment routes. Validate signed-64-bit IDs before SQL; full suite **190 passed**.
10. Real browser test reproduced 320px overflow for an 80-character unbroken author name. `min-width:0; overflow-wrap:anywhere` on the author flex child fixed it; edge browser suite passed.
11. Invalid comment edit showed original text in the editor and put the attempted draft into the new-comment composer. Preserve attempted edit in its own open form and page; final full suite **192 passed**, Community **22 passed**.

The suite also verifies persistence via app recreation; cross-account edits/deletes; no silent ID-1 moderator; explicit allowlisted moderator actions; CSRF and cross-site headers; plain-text XSS escaping; strict forms; oversized requests; literal `%` search; stable tie ordering; page bounds; unique concurrent likes; deduplicated concurrent creates; persistent throttling; safe cleanup; no Community learning events; and course-derived L2 authors.

## Real browser scope

QA used **8100 only**, separate SQLite, profile upload path and copied course root. `scripts/community-qa-server.py` seeds labelled QA users/posts solely in a new private evidence directory. Synthetic user 2 is explicitly moderator only for this QA app. `evidence/community-qa-server.json` identifies the current isolated directory.

The main browser journey used two accounts, created and edited a post, preserved literal `<script>` text, liked/unliked, created/edited/deleted comments, checked ownership by a direct bypass request, pinned as moderator, searched/filtered/paginated, confirmed deletion and 404, and checked keyboard composer opening and document-width bounds at **320 and 390px**. Additional moderator and edge runners exercised actual forms and independent accounts. QA was stopped and resumed against the same database; a saved browser session then read the edited/pinned post and confirmed comment deletion.

Screenshots were actually captured and visually inspected. Representative files:

- `evidence/community-feed-desktop.png`
- `evidence/community-detail-desktop.png`
- `evidence/community-feed-mobile-320.png`, `community-feed-mobile-390.png`
- `evidence/community-detail-mobile-320.png`, `community-detail-mobile-390.png`
- `evidence/community-long-name-mobile.png`
- `evidence/community-invalid-draft.png`, `community-invalid-comment-edit.png`
- `evidence/community-after-restart.png`

The desktop uses white feed cards, category chips and a right summary. Mobile stacks the summary below the discussion; long names and multiline bodies wrap rather than clip. All displayed QA statistics derive from the isolated database. The reference's golf posts/users were not imported.

## Preserved files and deployment handoff

Original reference SHA-256 verified unchanged:

`d5ef90702488a4af2e9ba1246f1215df80171fd3c86f29199fbbfd702ddfd76d`

The production process on 8080 was only inspected, never signalled or restarted. Port 8081 was not touched. A read-only query confirmed the live database still had **no Community tables** before handoff, so the Community migration has not been applied to production by this worker. No real accounts, join dates, profile uploads, course source or built course assets were changed. No new dependencies or build required.

Parent/operator must back up live SQLite (backup API + integrity check) and existing private photos, restart its identified 8080 process against the original DB, and verify production login/guest protection plus the empty authenticated Community. Startup adds four Community tables and indexes only. Keep `COMMUNITY_MODERATOR_IDS` empty unless explicitly authorized; never copy QA moderator IDs into production.

Limitations: text-only; no notifications/attachments/embeds; no audit history or undo after deletion; offset pagination may shift with concurrent additions; identical same-author content within 10 minutes is treated as retry; likes/edits are not rate-limited; Community does not award course levels or learning events. See [contract](community-contract.md).
