# NASA hackathon: start here

## What this is
A planning and workflow kit for the existing Junior Astronaut Mission Trainer direction, for the Sonoma State / Rohnert Park event on November 14-15, 2026. It is NOT an implemented game. No repository, deployment, NASA API account, or GitHub remote has been created. No Claude Code or Codex CLI session has been run by this kit.

The target is an exceptional-looking, accessible, short educational Moon-base game, not a giant simulator. Product name is deliberately undecided. Use a neutral working title until the team chooses its own original identity and gameplay contribution.

## Important eligibility boundary
Filesystem creation timestamps show this AI-assisted package began November 14 at 09:24 Pacific. Earlier challenge selection/AI-assisted discussions took place November 13. The official brief says solutions are started, built, and submitted during November 14-15; the submission guide says AI should not originate the solution idea. Do not assume the earlier AI assistance is exempt. Ask the local lead about the actual assistance and any pre-event work before relying on this for an award-eligible entry. Do not backdate commits or hide the timeline. The global project form opens at 09:00; Sonoma's first scheduled work session is 10:00. Confirm local build-start instructions and obey any stricter start. No game code or assets are supplied here.

## The launch sequence
1. Open this folder in Claude Code or a terminal. First paste prompts/00_CLAUDE_PLAN.md. This is the planning lead. It may do general setup now; product work waits until the official start and compliance clarification.
2. In Claude Code use /model to inspect the actual model available to your account. The requested Fable 5.2 is user-reported, not locally verified. Keep your configured model if it is available; no model identifier is hardcoded here.
3. At the permitted start, have Claude resolve the bounded PRD, research, architecture, and design contracts, using fresh specialist contexts for science and design. Do not start four builders.
4. Claude writes docs/HANDOFF.md and releases the writer lease. Open THIS SAME folder in Cursor. Paste prompts/01_CURSOR_BUILD.md. Cursor is the only implementation writer, continuing through the ordered backlog without asking about routine reversible choices.
5. Run independent reviews in a separate Codex/Claude context using prompts/02_CODEX_REVIEW.md. If Codex is not installed/authenticated, use a fresh Claude evaluator and explicitly record the substitution. There is no universal command that makes Claude Code contact Aside.
6. An Aside browser-review routine has been created but is PAUSED: the free account's three active routine slots are already occupied. See docs/ASIDE_REVIEW.md. Free a slot and resume it for scheduled QA, or use prompts/03_ASIDE_QA.md directly with Aside. Moving this folder means the routine must be repointed. No automatic review is currently running.
7. Run tests, review the exact commit, then publish only after the repo/remote and push permission are explicitly established.

## Initial terminal commands
Run from this folder, not L.E.O.:

    node scripts/preflight.mjs
    node --test scripts/workflow.test.mjs

At the permitted start, after compliance is resolved:

    git init -b main
    node scripts/install-gates.mjs
    git add README_START_HERE.md AGENTS.md CLAUDE.md .cursor .claude .github .gitignore .nvmrc .env.example docs ai-workflow prompts scripts kit-inventory.json protected-manifest.json
    git commit -m 'chore: establish guarded workflow and product contracts'
    node scripts/workflow.mjs claim claude

Do not run git init inside a parent repository. install-gates refuses a different Git root and refuses to overwrite an existing hook. It verifies protected kit files before installing hooks.

The M00 commit is the only bootstrap exception to the normal clean-HEAD lease requirement: it records the actual existing kit after the event starts, not an invented app or fabricated work date. Pre-commit still verifies protected contracts. It is not publishable through the app release gate. If any listed file is absent, stop and inspect the incomplete kit rather than staging unrelated paths.

No app package.json exists yet. Claude/Cursor creates it as M01, with scripts: dev, typecheck, lint, test:unit, build, test:e2e. Playwright serves the built preview for release checks, not an unverified HMR session.

## Tests after each slice; reviews at explicit checkpoints

    git add <specific reviewed files>
    git commit -m '<the relevant message in docs/COMMIT_PLAN.md>'
    node scripts/run-checks.mjs
    node scripts/workflow.mjs request m02-r1 cursor <run-id>
    sh scripts/codex-review.sh m02-r1
    # Inspect the candidate path printed by the wrapper; use that ACTUAL path below.
    node scripts/workflow.mjs lock m02-r1 independent codex
    node scripts/workflow.mjs review <printed-candidate-path>
    node scripts/workflow.mjs unlock m02-r1 independent codex
    node scripts/wait-review.mjs m02-r1

The check runner prints the run-id. Request reviews only at the checkpoints in COMMIT_PLAN, not automatically for every local commit. The Codex wrapper starts an independent CLI review if installed/authenticated; a queue request alone does not launch a code reviewer. Import the unchanged valid candidate verdict before waiting for the second lane, or use the documented fresh-context fallback. If no independent reviewer is available, mark BLOCKED rather than waiting silently. The lock/review/unlock commands are transport of the unchanged independent reviewer result, not permission for the builder to invent, edit or upgrade a verdict. Use a different actual reviewer id if the fallback context produced it. If import fails, preserve the candidate and record the blocker; release only your own lock in cleanup. A reviewer must be given the request id and exact SHA. It writes a JSON verdict using the schema and then records it while holding its own lane lock with:

    node scripts/workflow.mjs review path/to/review.json

FIX means append a fix commit, rerun checks, and create a NEW request id. Never overwrite a verdict or amend the reviewed commit. Missing reviewer, rate limits, missing screenshots, or timeout means BLOCKED, not PASS. Three unsuccessful repair rounds means bounded escalation.

The push gate also needs PUSH_AUTHORIZED=1 and a configured, authorized origin. That variable is a process acknowledgment, NOT a secure permission system. Do not set it until the owner has approved the exact remote and publishing action. No helper creates a repo or pushes automatically.

## Tooling findings on this machine
Node 26.5.0, npm 11.17.0 and Git were available in Aside's tool environment. Cursor.app and Claude.app exist, and a Codex-related Cursor extension exists. claude and codex were not found on that environment's PATH or the common CLI locations checked. This does not prove they are absent in your own terminal. First run command -v claude and command -v codex there. See docs/TOOLS.md for optional setup. No third-party plugin is required.

## Quality promise, accurately stated
The kit supplies plans, safeguards, review prompts, and tested workflow utilities. It does not prove the future game's quality, performance, scientific validity, visual polish, deployment, or eligibility. Those need the explicit gates in the rubric and real browser evidence.
