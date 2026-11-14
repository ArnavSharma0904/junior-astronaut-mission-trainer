# Canonical agent instructions

Read README_START_HERE.md, docs/COMPLIANCE.md, docs/STATUS.md and docs/WORKFLOW.md first. Product contracts: docs/PRD.md, docs/DESIGN_SYSTEM.md, docs/ARCHITECTURE.md, docs/API_PLAN.md. Acceptance: docs/EVALUATOR_RUBRIC.md and docs/QA_PLAN.md. Slices: docs/COMMIT_PLAN.md.

- One implementation writer at a time, held by the workflow lease. Helpers are read-only; return findings or proposed patches to the writer. Reviewer writes are restricted to ignored .agent-bus review/evidence files.
- No game code/assets before the permitted start. Pre-event planning and AI-originated idea eligibility need organizer clarification. Never hide the date or assistance.
- Infer reversible defaults and continue the ordered backlog. Ask only for external publishing, payment, credentials, destructive changes, compliance decisions, or a fork that would invalidate the result.
- No broad rewrites, disabling tests, silently weakening the rubric, fabricated data, invented API endpoints, or functionality that exists only in a screenshot.
- Protect core gameplay before effects. Every visible control works; nonessential unfinished features are removed, not shown as fake buttons.
- Failures receive a regression test. Scope one slice per commit. Exact-SHA independent and browser PASS gates before any push. No amend, force push, backdating, wholesale staging, hidden authorship changes, or global Git configuration changes.
- No secrets in browser bundles, screenshots, logs, Git, or chat. NASA keys stay in build-time/server-side adapters; never VITE_NASA_API_KEY.
- Never overwrite existing hooks, rules, human edits, lockfiles, source records, or decisions. Record an ADR and get governance-change approval before changing protected contracts. Prompt rules and local hooks are not a security boundary against a same-permission agent.
- Tests must have actual exit codes and the reviewed SHA; browser checks verify the running build SHA. Claimed PASS without evidence is forbidden.
- On handoff record exact HEAD, dirty status, owner, next slice, commands, evidence, blockers and pending review ids. Resume rather than restart the project.
