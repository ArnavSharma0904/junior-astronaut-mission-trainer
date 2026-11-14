# What was actually recovered from L.E.O.

Read-only inspection found the L.E.O. Git checkout and its reusable ai-workflow/WORKFLOW.md. The local-only agent bus lived in the parent workspace's docs/evidence/agent-bus, not in the checked-in app. It contained PROTOCOL.md, BUS.md, NOTES.md and evidence logs. No general executable Aside bridge or watcher script was found.

Actual mechanism: an externally scheduled Aside routine reads the bus, while Cursor runs a terminal polling loop. A running chat does not automatically wake when a file changes. Existing L.E.O. review/watchdog routines were inspected but not modified, resumed, repointed or copied.

Preserved: one writer, fresh reviewer, exact-SHA PASS, evidence headers, bounded repair, periodic cross-slice audits, ancestry check before normal push, explicit process ownership.

Improved here: one immutable JSON file per request/verdict; no shared mutable STATE block; testable SHA gate; bounded waiting; reviewer-specific locks; protected-contract checksum; fail on absent evidence; no push before verdict or automatic global permission changes. Local hooks remain bypassable and are described honestly.

Excluded: robot models, physics/safety constraints, project milestones, private bus history, scratch scripts, old session ids, restart commands with force flags and private evidence. This is a new adaptation of the process, not a claim to have copied a ready-made bridge. No third-party plugin source code was vendored.
