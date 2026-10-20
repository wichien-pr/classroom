# Community contract

## Scope and privacy

`appworks/community.py` installs member-authenticated feed/detail/composer routes; `community_media.py` handles structured links and private files, and `community_polls.py` handles single-choice polls. Feed cards retain real authors, avatars, handles, course levels, pinned state, counts and latest commenter. No reference members, content or statistics are imported. Community never changes learning Activity, progress, levels or join dates.

All reads require a live account/session. All mutations require session CSRF and same-origin Origin (when present), and reject cross-site Sec-Fetch-Site. Author/moderator authority is derived server-side, never submitted. Plain-text titles/body/comments remain escaped; there is no raw HTML, arbitrary iframe, notification/tagging system or email delivery. The editor uses strict plain-text and attachment blocks, not arbitrary rich HTML.

## Composer and progressive enhancement

The feed write prompt opens a native modal dialog with real author identity, title/body, paperclip/link/video/poll/emoji/GIF toolbar, explicit category choice, Cancel and Post. Native dialog contains focus; initial focus goes to title, Escape/Cancel restore the prompt, and dirty drafts require confirmation. Posting is disabled until title/category, text-or-image and type/length validation passes (read validity properties, without firing native invalid popups during typing); the server is authoritative for whitespace, URL/provider, poll and file validation. No drafts are uploaded before final submission. Cancellation creates no stored files.

JavaScript enhances a normal multipart form inside a details card. Without JS, the feed details card and direct `/community/posts/<id>/edit` page expose file inputs and link/video/poll fields; removal uses listed attachment IDs in the comma-separated `remove_attachments` field. With JS, removal buttons/preview cards manage that field and new file selections. Emoji picker is a local curated Unicode set. GIF means **upload your own file**, not a search service or third-party API. Invalid submissions retain escaped text/structured fields and existing attachments; browsers cannot repopulate file inputs, so the dialog explicitly asks users to reselect files. Request-level 413 cannot retain the rejected body.

## Unified inline block editor (supersedes the body-under-gallery design)

A single bordered **Write something** surface contains independently editable plain-text blocks and noneditable image/GIF blocks in actual document order. Authors can type before and after images, insert uploads at the saved text caret even after focusing toolbar buttons, move media up/down, and remove it without deleting neighboring text. Documents use filename cards. Media controls are at least 44px. Plain-text paste rejects HTML; dropped remote content is not imported. Emoji inserts at the saved caret. The hidden fallback textarea is never required in the enhanced editor.

Selections append; exact local duplicates by name, size and last-modified timestamp are ignored. Existing stored attachments are not deduplicated against new files by filename. The four-file/5 MiB limits include retained attachments, and the server still validates actual content and converted sizes. New previews use local object URLs, revoked on redraw/removal/cancel/page exit. Cancel resets the original retained-removal snapshot and clears newly selected files. Errors retain escaped fields and the existing-file removal snapshot, not local file selections; users must reselect those files. Composer GIF previews animate the author's own selected/stored GIF; published feed/detail GIFs retain explicit play controls.

The dialog scrolls and the footer stays reachable at 320/390px. A visible helper explains required title/category and **text OR an actual validated retained/new image/GIF**. Image-only posts are valid; empty, document-only, link-only and poll-only posts are not. Invalid/removed images never satisfy the server rule. See [inline editor verification](composer-inline-editor-verification.md).

Optional `content_blocks` is a JSON array of 1–64 exact-schema objects: `{"type":"text","text":"plain Unicode"}` or `{"type":"attachment","id":123}` for retained media belonging to this post, or `{"type":"attachment","upload":0}` for zero-based new multipart file order. Integers must not be booleans. All retained nonremoved/new files must appear exactly once; duplicate, missing, removed and foreign references fail closed. Unknown types/keys, control characters, surrogate code points and overlong combined text fail. Text is limited to 2,000 Unicode code points combined, without silently truncating or stripping block whitespace. `body` is derived by concatenating text blocks for search. Final storage replaces upload indices with server-owned attachment IDs. Rendering revalidates the schema/references and uses escaped template text, never `safe` HTML. Feed/detail render ordered blocks exactly once, without a duplicate gallery.

Legacy rows have NULL blocks and keep body/gallery display. No-JS forms submit textarea/files; the server generates ordered text-then-file blocks and applies the same image-only rule. No-JS editing cannot rearrange interleaved order; the enhanced editor restores exact saved order. Error drafts preserve validated text/retained blocks but require reselecting local uploads. Cancel/reopen restores the initial saved snapshot, clears new files and revokes object URLs.

## Routes and fields

| Method | Route | Behavior |
|---|---|---|
| GET | `/community` | Filter/search/order/paginate and compose |
| POST | `/community/posts` | Create own post atomically with optional extras |
| GET | `/community/posts/<id>` | Detail, attachments, aggregate poll and comments |
| GET/POST | `/community/posts/<id>/edit` | Author-only edit, explicit attachment removal/addition |
| POST | `/community/posts/<id>/delete` | Author or configured moderator; `confirm=delete` |
| GET | `/community/media/<id>` | Authenticated delivery only while parent post exists |
| POST | `/community/posts/<id>/vote` | `option` zero-based choice; server-owned voter |
| POST | `/community/posts/<id>/like` | `state=1/0`, idempotent |
| POST | `/community/posts/<id>/pin` | Configured moderator only; `state=1/0` |
| POST | `/community/posts/<id>/comments` | Own plain-text `body` |
| POST | `/community/comments/<id>/edit` | Comment author only, `body` |
| POST | `/community/comments/<id>/delete` | Author/configured moderator; `confirm=delete` |

Create/edit require `title`, `body`, `category`; optional fields are `link_url`, `video_url`, `poll_question`, `poll_options` (one option per line), `remove_attachments` (edit), `nonce`, and `content_blocks`. Only file key `attachments` may repeat; scalar duplicate/unknown keys and unexpected files fail closed. Every mutation includes `csrf_token`. Success is 303 PRG.

The rendered composer generates a random nonce. `(user_id,nonce)` uniqueness ensures retries/concurrent submissions reuse the existing post without duplicating files. New nonces allow intentionally identical posts. Legacy submissions without a nonce retain the old same-author/title/body/category 10-minute dedup behavior; rich clients should always supply a nonce. A nonce is not an authorization token. Edit does not replace the post nonce.

## Private files

- At most **4 attachments**, **5 MiB per file**, **20 MiB total** (also enforced after image conversion and when retaining existing files).
- Allowed raster input: **JPEG, PNG, static WebP, GIF**. Pillow decodes the expected format rather than trusting MIME or extension alone. APNG/animated WebP, SVG, HTML, scripts, executables and archives are rejected.
- Dimensions: each side at most **4096**, at most **12 million pixels/frame**. GIF: at most **100 frames**, **20 million decoded pixels cumulative**, checked **3-second processing budget between frames**. This is a cooperative bound, not a hard process-level CPU timeout. Frames are traversed only up to the cap rather than scanning an unbounded frame count first. Pillow decompression-bomb warnings/errors fail closed.
- Raster files are re-encoded without source metadata/trailing payloads: static images become PNG; own GIF animation is re-encoded with 40–1000 ms frame delays. Converted files must still fit 5 MiB. GIF is shown behind an explicit play/details control so motion is not initially visible; collapsing hides it. No remote GIF service.
- Documents: **PDF** with `%PDF-` header and trailing `%%EOF`, or **UTF-8 TXT** without binary controls. PDF validation is a signature check, **not a complete PDF parser or malware scan**. Documents always use Content-Disposition attachment. TXT may contain literal markup, but is never rendered as HTML. Download/open only trusted documents; no malware-free guarantee.
- All delivery uses server-owned MIME, `nosniff`, no-store and authenticated membership plus existing parent post lookup. Documents download; raster images may display inline. User filenames are reduced to a safe, bounded Unicode basename for display/download only. Storage uses random 48-hex names and private permissions, never user paths.
- Storage is outside public/static/course source trees: default `<database-directory>/community-uploads` (normally `appworks/instance/community-uploads`). Set config `COMMUNITY_UPLOAD_DIR` or environment `APPWORKS_COMMUNITY_UPLOAD_DIR` to a private directory. Never mount that directory as a public static server. Back up DB and files together.
- Final multipart submit only: no staged upload endpoint. File/DB failures roll back newly created files and DB records. Removed/obsolete files are unlinked after DB commit; delete removes all attachment references/files. A process crash between filesystem and DB operations can leave an unreferenced file; no crash-recovery garbage collector is provided. Disk exhaustion or permission failures are server errors, not successful posts.

## Links and video

Links are bounded to 2048 characters and validated as http/https with an ASCII hostname, no userinfo, whitespace/control/backslash tricks (including percent-decoded controls), and only default/80/443 ports. `javascript:`, `data:`, `file:` and protocol-relative URLs are rejected. Anchors use `target=_blank` and `rel="noopener noreferrer"`. No server fetch, metadata scraper, proxy or remote preview: arbitrary URL SSRF is not introduced.

Video is **a link**, not file hosting. Supported forms: YouTube `/watch?v=<11-character-id>` on youtube.com/www.youtube.com/m.youtube.com, `youtu.be/<id>`, and `vimeo.com/<numeric-id>` (including www). Other providers/paths get Thai guidance. Cards open the provider only on deliberate click; no iframe, CDN, thumbnail, cookie-bearing provider request or automatic third-party load. CSP is **unchanged**; no provider is added to script/img/frame sources.

## Polls

One optional poll per post: question 1–200 characters, **2–6 unique nonempty options**, each 1–100 characters. Uniqueness is case-insensitive. One choice per authenticated member, including author; submitting the same choice is idempotent, selecting another **changes** the existing vote. Server never accepts voter IDs or scores. Composite `(post_id,user_id)` uniqueness plus `BEGIN IMMEDIATE` serializes concurrent votes. UI exposes aggregates and own selected option, **not voter identities**. No change to learning Activity/levels.

Once any vote exists, question/options cannot be changed or removed, even by the author; normal text/link/file edits remain possible. Before votes, the author can modify/remove the poll. Post deletion explicitly deletes poll/votes in the same transaction. Votes/changes have a persistent limit of **15 per 10 minutes**; same-choice retries do not consume it.

## Existing text/feed/security contract

- Title 1–160, combined block text 0–2,000 (zero requires validated image/GIF), comment 1–1,000 Unicode characters. Legacy textarea/title/comment strip outer whitespace; structured block text preserves it. Disallow controls except newline/CR/tab.
- Only authenticated multipart create/edit receives a per-request ceiling of **20 MiB + 32 KiB** before CSRF parsing. Structured composer scalar payload is capped at **32 KiB** (body plus block JSON carry the same Unicode text); legacy scalar payload remains **16 KiB**. Authenticated nonmultipart composer request ceiling is 32 KiB. Multipart uses, multipart memory buffer 64 KiB and 24 parts. The global **16 KiB** ceiling on unrelated endpoints remains unchanged; profile photo's existing 5 MiB override remains unchanged. Missing/foreign CSRF or Origin fail closed.
- Categories: general, questions, introductions, wins, tips, requests. No category grants moderation.
- Search `q` max 100: literal parameterized SQL substring over title/body, escaping SQL wildcard characters. Newest/activity ordering preserves real pins, descending timestamp/id; edit/like/vote does not bump activity. Comments page oldest first. Feed 10/page, comments 20/page. Positive ASCII page 1–10,000 only. Offset pagination is not a snapshot cursor.
- Creation rates: **5 posts / 10 minutes**, **15 comments / 10 minutes**, persisted and shared across sessions. Duplicate retries precede accounting. Deletes do not reset rates. Existing likes/edits/pins remain unthrottled. Server timestamps UTC, rendered in Asia/Bangkok.
- Deletes are permanent, confirmation required; IDs AUTOINCREMENT, not reused. Explicit `COMMUNITY_MODERATOR_IDS` operator allowlist defaults empty. Moderators may pin/delete, not rewrite another author's post or edit their poll. Never infer roles from earliest signup.
- Like buttons remain native outline-thumb/count with Thai accessible labels, aria-pressed, blue selection and 44px target. Real latest-comment identity only; no placeholder media.

## Additive schema and deployment

Existing posts/comments/likes/rate tables remain. Startup adds `community_posts.link_url` and `.video_url` (TEXT NOT NULL DEFAULT ''), nullable `.nonce` and `.content_blocks` (TEXT containing validated block JSON), and unique `(user_id,nonce)` index. Adds `community_attachments(id AUTOINCREMENT,post_id,storage UNIQUE,name,mime,size)` with post index; `community_polls(post_id PRIMARY KEY,question,options JSON text)`; `community_votes(post_id,user_id,choice,PRIMARY KEY(post_id,user_id))`. SQLite FK enforcement is not globally enabled: delete performs explicit transactional cleanup. Existing account/profile/learning tables and data are untouched.

No new dependencies: reuse pinned **Pillow 12.3.0**, Flask 3.1.3 and Werkzeug 3.1.9. No course source/dist changes or rebuild needed. Parent/operator must back up live SQLite with SQLite backup API (verify integrity) and private uploads, then restart the identified production service so Python/templates match. The implementation worker does not stop/restart production 8080 or touch 8081. Do not seed production with QA fixtures.

```sh
cd /Users/prommeesee/Documents/04_Learning/classroom
(cd appworks && .venv/bin/python -m pytest -q)
# QA-only, new private SQLite + photo + community upload directories:
appworks/.venv/bin/python scripts/composer-qa-server.py
node scripts/composer-browser-verify.mjs
# stop ONLY that QA process, then same data after real process restart:
appworks/.venv/bin/python scripts/composer-qa-server.py --resume
node scripts/composer-restart-verify.mjs
```

Composer QA binds **8101**. Legacy Community regression launcher binds **8100**, also isolated. QA evidence/session files must remain private. See [composer verification](community-composer-verification.md) for actual RED cycles, test counts, screenshots, restart verification and limitations.
