# CTO Project Lab contract

See [course README](../courses/cto-project-lab/README.md) for assignments, API payloads, audit/idempotency semantics and portable QA commands.

## Reviewer configuration

Authority is empty by default. The authorized email spelling is exactly:

```dotenv
CTO_REVIEWER_EMAILS=wichien@appworks.co.th
CTO_REVIEWER_IDS=
```

Email values are comma-separated, trimmed and lowercased like login. The server checks the authenticated stored `users.email`; it never trusts client-supplied roles. Legacy explicitly configured account IDs and email matches form a union. Self-review is forbidden and own projects are absent from the review selector.

`service:create_app` reads its existing private mode-0600 `appworks/.env` and then process environment. Both bare `CTO_REVIEWER_EMAILS` / `CTO_REVIEWER_IDS` and `APPWORKS_` forms are supported; process settings win across layers, and prefixed forms win within a layer, including empty values. Avoid defining both forms. Direct factory configuration overrides environment defaults. `app:create_app` does not load a private file.

Docker launches `service:create_app`; `compose.yaml` injects `CLASSROOM_ENV_FILE` via `env_file.format: raw`. Put unquoted values in the actual runtime file, not merely an interpolation-only root `.env`. A changed environment requires authorized container recreation, not just restart. Verify the exact stored account and effective role before activation. The example is not a default grant, and publishing this commit does not activate or deploy anything.

## Learner and reviewer behavior

The desktop step sidebar and narrow-screen selector show seven steps, with only one detail mounted. Learners save drafts or **ส่งตรวจ**. Submission stays pending at that step; only a configured CTO's **Pass** unlocks the next. Feedback is required for Pass or changes requested. Step 7 saturates at completion—there is no step 8. Drafts persist across in-tab navigation; only explicit writes persist to the server.

Pending learner state is polled every two seconds, single-flight with a ten-second timeout and bounded error backoff. Background reads do not use foreground busy/locking handlers. Unchanged responses do not replace the workspace; real changes patch affected regions and append immutable history. Selected pending approval advances automatically, but approval on another step does not hijack reading. Foreground operations invalidate older reads. This is polling, not push synchronization; hidden reviewer workspace and foreground retries pause polling.

Four additive tables store immutable assignment snapshots, current step/version state, append-only evidence/review history and actor/request UUID receipts. No participation awards, lesson qualification or L9 credits are issued. This trusted first-party workflow is a human review tracker, not an automatic grader or protection against a database administrator.

## Publication boundary

The active package includes backend wiring, course source/lockfile, configuration example, focused API tests and portable synthetic QA runners. Historical release/deploy/provisioning controllers, private env files, backups, live databases, credentials, generated evidence and retired timed-exam source/tests remain local and excluded. Pending source archival is not bypassed. Do not build/deploy an unbounded dirty checkout containing retired sources.

The verification runners accept explicit scratch/Python/browser-cache settings, isolate database/uploads/configuration, and stop their owned loopback service after execution. They do not mutate production or send mail. Test reports must distinguish current execution from historical deployment evidence and synthetic sessions from login/OTP coverage.
