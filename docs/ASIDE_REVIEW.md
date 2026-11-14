# Aside browser-review loop

A separate Aside routine has been created but is PAUSED. It is configured to poll this kit's local queue every ten minutes during event hours once enabled. There is no unauthenticated webhook, public API bridge, or magical Claude-to-Aside RPC. This is a scheduler plus a file-based queue, adapted from the actual L.E.O. process. No existing robotics routine was changed.

The scheduler reads this exact kit folder, not an arbitrary future clone. If you move the folder, repoint the routine before assuming reviews work. When no requests exist, it exits quickly. It does not create requests or build the game. The actual routine id and schedule are recorded below after creation.

## Builder prerequisites
- Initialized repo at this exact folder after the permitted start/compliance resolution.
- Run real app checks, commit source, then request an exact-SHA review using the workflow CLI.
- Leave a reachable app running at http://127.0.0.1:5173, or explicitly record a different port in request scope/HANDOFF.
- Expose actual build SHA in a DOM data-build-sha attribute. Built-preview tests and browser reviewer must reject stale servers.
- A queued request is not evidence the review ran. Wait for actual immutable verdict files.

## Reviewer sequence
Run pending browser; acquire the request's exclusive browser lock. Only read source/Git; write only your own ignored .agent-bus/evidence, candidates, reviews and role-specific lock files. No product edits, Git fetch/checkout/commit/push, process hijacking, global setting changes or touching other projects.

Read prompts/03_ASIDE_QA.md, the current request scope and fixed rubric. Use real browser snapshots, interactions, focused screenshots and notes. For an early slice, report the scoped behavior honestly; final release still needs the full matrix in QA_PLAN. Missing server, mismatched build, unavailable browser, provider failure or absent evidence means BLOCKED, never PASS.

Use stable reviewer id aside-reviewer (matching the acquired lock); put actual tool/model/context identity in the summary/evidence note. A candidate JSON must match docs/review.schema.json. Evidence references must be actual files under .agent-bus. A browser PASS requires observedBuildSha equal to request SHA plus screenshot evidence. Record with scripts/workflow.mjs review and release only the reviewer's own lock in cleanup. FIX -> builder creates a new fix commit, new checks and a new request id. No verdict overwrite or self-approval.

## Limits, explicitly
Local JSON labels/hooks do not authenticate reviewer identity or sandbox an agent with the same filesystem rights. Stronger protection needs owner-controlled GitHub rules/CI. The routine also cannot automatically resume a dead Cursor/Claude chat by writing a file. The finite wait utility only polls while its own process is alive. Do not claim unattended end-to-end execution until a real builder session has demonstrably continued after a verdict.

Final user review is retained for publishing, privacy, eligibility certifications and material scope/security choices. Routine reversible local coding/testing should proceed without repeatedly involving the owner.

## Configuration
Routine id: le4fCMxWWCc5mCkW. Name: NASA hackathon independent browser reviewer. Status: PAUSED, not running. Creating it active was blocked because the free account already has three active routines. No existing routines were paused or changed. To enable it, the owner must free a slot or upgrade and then resume this routine. Until then, direct Aside QA via prompts/03_ASIDE_QA.md is the fallback.

Configured cadence: every ten minutes, starting November 14 at 09:00 America/Los_Angeles, within local hours 08:00-17:59, ending November 15 at 17:00 (2026-11-16T01:00Z). Notifications are off to avoid polling spam. Permissions: guard. Target: this kit's exact absolute folder as recorded in README_START_HERE.md; moving it requires a routine update. End-to-end review/resumption has NOT been tested because no app/request exists.
