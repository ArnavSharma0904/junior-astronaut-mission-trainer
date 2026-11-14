# Plan -> research -> contract -> build -> independent review -> browser -> repair

## Roles
Claude Code: planning lead, architecture and bounded research. Cursor: implementation writer after explicit file handoff. Codex: fresh independent code/science/test reviewer, not a second concurrent builder. Aside: independent real-browser QA and review, via the scheduled routine or a direct user request. A fresh Claude context is the documented fallback if Codex is unavailable. Never call that a Codex run.

Use at most three concurrent read-only investigations: science/API, design/accessibility, and test/risk. Each has non-overlapping questions. Their output returns to the single writer. Maximum useful verification is the goal; unlimited parallel agents cost tokens and generate conflicts.

## Durable state
Canonical requirements live in docs, not the chat. Update STATUS, HANDOFF and the evidence index as slices finish. Routine refinement goes into new docs/refinements/ notes, IMPLEMENTATION_PLAN.md, API_RESEARCH.md, scenarios, tests and other unprotected implementation files; it may populate details consistent with the baseline without repeated owner approval. It must not change mandatory constraints. See GOVERNANCE_CHANGE.md. Checksummed protected contracts catch accidental overwrites. Governance changes need a written ADR and owner approval; do not delete protection to pass a hook.

## Lease and queue
node scripts/workflow.mjs claim <owner> acquires an exclusive writer file. A Claude->Cursor transfer is release claude then claim cursor, after checking HEAD and dirty state. No stale-lease theft: inspect and escalate instead. The lease is advisory, not an OS access-control sandbox.

Each review request and verdict is a new immutable JSON file in ignored .agent-bus/. This replaces the old shared editable STATE block and avoids agents rewriting one bus document. Request IDs are unique (m02-r1, m02-r2). Independent and browser lanes must both PASS the same SHA before a push. Reviewers may create only their own review/evidence artifacts and lock files; they never edit application code.

## Evidence and repair
Commit each narrow slice locally and run the check runner. At the four review checkpoints in COMMIT_PLAN, request exact-commit review, dispatch the independent Codex/Claude reviewer explicitly, import its unchanged verdict, and wait with a timeout for the other lane. A request never launches the independent reviewer by itself. CLI unavailable/unauthed -> use an actually available fresh context or BLOCKED. Perform a bounded end-to-end readiness rehearsal at M01/M02: valid request, independent verdict transport, Aside/manual browser verdict, and observed continuation; do not certify autonomous operation without it. The runner records each command, timestamps, exit code and Git HEAD in .agent-bus/runs. Browser review verifies the actual build SHA, completes interactions and saves screenshots. FIX requires a new commit, new checks and a new id. No verdict overwrite. Missing evidence or failed providers means BLOCKED. After three unsuccessful repair rounds, stop the slice and escalate with a minimal reproduction and last working SHA. Independent clean work such as documentation research can continue, but never edit the reviewed product tree.

## Publishing
Hooks enforce useful local checks, not real reviewer identity or unbreakable permissions. Agents with the same filesystem rights can bypass them. Real stronger controls require owner-controlled GitHub branch rules and independent CI. No push is authorized merely because a model wrote PASS. The future owner must approve remote and publishing; the helper requires PUSH_AUTHORIZED=1 only after that approval. Do not force-push, amend reviewed SHAs, fabricate dates, erase AI disclosures or change global Git identity.

## When stopping a chat
Do not assume a CLI session or this conversation can wake itself. The finite wait utility only polls; it does not resume a dead agent. If the agent/tool cannot maintain a live background task, record WAITING in HANDOFF and rely on an explicitly active scheduler or user restart. Never describe this limitation as a working autonomous bridge.
