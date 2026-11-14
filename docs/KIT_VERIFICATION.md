# Kit verification, not game verification

Verified November 14, 2026. README birth timestamp: 09:24:52 Pacific. Earlier AI-assisted challenge discussions occurred November 13. No false pre-event creation claim is made for this kit.

## Actual checks
- Independent parent run: WORKFLOW_TEST_TMP=<session tmp> node --test scripts/workflow.test.mjs -> EXIT 0, 20 passed, 0 failed, 0 skipped, about 30.25 seconds. Full log: reference/workflow-tests-2026-11-14.log.
- All .mjs syntax and shell syntax checked. JSON documents parsed. Inventory, protected checksums and document references checked during final packaging.
- Generic tests include exact-SHA/two-lane acceptance, failed/missing/stale check rejection, dirty worktree, locks/ownership, traversal/symlink evidence, missing screenshot/build identity, self-approval, duplicate verdicts, protected worktree/index tampering, unauthorized/non-fast-forward push, complete M00 inventory and all-four CLI execution in a path containing # and ?.
- Actual packaged-kit bootstrap rehearsal: PASS: hooks installed, full initial inventory committed through pre-commit guard, Claude lease acquired/released, Cursor lease acquired, protected checks passed, and absent app scripts correctly BLOCKED the app-check runner. This was tested in a temporary folder named NASA #1 ? as an additional special-path check. It uses an isolated temporary copy and synthetic fixture Git identity only; no repository/commits are created in the delivered kit.

## Independent reviews and corrections
- A fresh Codex-backed plan audit found bootstrap, scope-vs-release, independent-dispatch, publication sequencing, mutable-refinement and time-budget issues. All substantive document findings were corrected and rechecked. Final-SHA status ordering and optional-connector wording were corrected afterward.
- A separate fresh Codex-backed code audit found nonportable temp paths, omitted mandatory review-lock instructions and silent special-character path entrypoint bypass. All were corrected and rechecked; native crypto replaced a system hashing dependency. This was a review through Aside, not the user's Codex CLI.
- Claude Sonnet 5.5 review through Aside was attempted but BLOCKED by provider 402 insufficient credits. No Claude PASS exists. User's Claude Code/Fable 5.2 configuration and Codex CLI have not been invoked here.

## Not established
No playable game, graphics, NASA gameplay snapshot, functional connector, deployment, GitHub repo/remote, physical-device FPS, Node 24 CI run, public-link test, original team contribution or competition eligibility is proven. The source API spec is documentation only.

The NASA Aside reviewer routine exists but is PAUSED due the account's three-active-routine limit. No end-to-end automated agent dispatch/resumption has been demonstrated. Local hooks/locks do not authenticate identity or sandbox same-permission agents. Screenshots' file signatures do not prove real interaction; the actual browser reviewer still must do the work.


## Update 2026-11-14T17:51:16.405Z: Claude Code route works
A small read-only check through provider claude-code, requested model claude-fable-5-2, completed successfully after the user's settings reset. It compared docs/PRD.md against the newly supplied full NASA challenge brief. No critical mismatch was found. This supersedes any implication that all Claude routes are unavailable; the earlier Aside-hosted Sonnet 402 remains a historical failure. The model name is the requested tool route, not an independently attested upstream identity.

The check was limited to two files, not a full code/design/eligibility audit. No local terminal CLI command, game implementation, purchase, account action or video viewing occurred. Priorities: meaningful compounding trade-offs, no free safe choice, and traceable archived NASA evidence tied to actual gameplay without false dose predictions. The kit already includes the required dataset explanation/submission work. Scheduled Aside QA remains paused because the active-routine limit is a separate blocker.
