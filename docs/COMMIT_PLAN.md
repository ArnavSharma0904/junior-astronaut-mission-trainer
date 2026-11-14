# Ordered vertical slices and meaningful commits
Do not manufacture these commits in advance. Each message is a suggested future commit after real work. Append fix commits rather than amending reviewed commits. Use the owner's existing local Git identity only after checking it; pushing authentication and authorship are different.

| Slice | Suggested commit | Bounded scope and exit gate |
|---|---|---|
| M00 | chore: establish guarded workflow and product contracts | Acknowledge pre-event/AI history; tests of workflow utilities pass; no claim the game exists. |
| M01 | chore: scaffold typed app and verification pipeline | React/Vite/TS, locked dependencies, script contracts, CI, build identity, accessible shell; build/test commands run. |
| M02 | feat: implement deterministic mission engine | Typed state/reducer, legal/illegal actions, win/fail/replay, unit tests and no rendering dependency. |
| M03 | feat: connect attributed NASA mission evidence | Verified snapshot/source manifest/normalizer; malformed/empty/offline tests; no fake health model. |
| M04 | feat: complete playable mission and learning debrief | Briefing, complete HTML/2D play loop, settings/sources, keyboard, resume, end states; E2E full mission. |
| M05 | style: establish cinematic mission-control interface | Typography/tokens/layout and real state feedback; responsive screenshots, contrast and readability. |
| M06 | feat: add adaptive lunar-base visualization | Optional lazy R3F scene, meaningful state links, loading/error/2D fallback; measured performance. Cut if time risk. |
| M07 | fix: harden accessibility and recovery flows | Reduced motion, low effects, focus, double actions, corrupt save, network/WebGL loss; regressions. |
| M08 | docs: package science provenance and project demonstration | Truthful NASA/other sources and AI ledger; project submission text based on actual functionality, <=30s video OR <=7 slides. |
| M09 | chore: prepare verified release and project package | Exact-SHA local independent/browser readiness, clean build and prepared links/materials. Then separately authorized publication and public-new-visitor verification are recorded as ignored evidence; fix/review/redeploy if needed. |

Dependencies are sequential for product writes. Parallel read-only audit/design research is allowed. All five real app check scripts run after every implementation slice once the app exists. To fit the weekend, mandatory fresh independent + browser review checkpoints are: C1 after M02 (scaffold/engine and real shell behavior); C2 after M04 (data + complete 2D mission); C3 after M05, or after M06 if attempted (visual/responsive/performance); C4 after M07-M09 local readiness (full release QA). Each review covers every change since the prior checkpoint and the exact latest SHA. Never push an unreviewed intermediate SHA. M00 kit-only checks use the workflow tests, not fabricated app-test evidence. Do not request the app release gate before app scripts exist. Milestone completion updates STATUS/HANDOFF with exact SHA, real checks and remaining limitations.

## Weekend budget
Planning/contracts budget: 30 minutes at the permitted start. DONKI acquisition/schema/provenance budget: 30 minutes for a bounded initial attempt, then use a verified permitted snapshot/resource fallback or record BLOCKED; do not invent data. Optional OSDR/RadLab/Mars investigation is skipped entirely unless there is a specific core need and spare time. Code review target <=5 minutes; browser request target <=10 minutes; timeout is explicit, never approval. Three repairs is a ceiling, not an instruction to spend the whole weekend polishing one slice.

M06 is an explicit SKIP unless M04 is functioning and reviewed with enough time for a bounded <=60-minute visual experiment. If the complete 2D loop is not ready by Saturday 14:30, skip M06 and concentrate on 2D craft. No mandatory 3D dependency can block the game. These are scope/time defaults, not promises of a winning result.

This is a budget, not a delivery guarantee. At Sonoma: work sessions begin Saturday 10:00; Sunday presentations 15:00. Aim for a full 2D game by Saturday's end. Sunday morning is correctness, science and visual refinement; freeze features around 13:00, finish submission/demo before 14:00 and rehearse before 15:00. If a dependency overruns, cut secondary connectors, live refresh, bloom, particles and extra missions in that order. Never cut the complete play loop, provenance, fallback or presentation.

## New GitHub repo, later
No remote is assumed. Create the intended repo in GitHub after confirming name/visibility, copy its actual URL, inspect it, and add origin. Do not guess a destination URL. Set appropriate branch rules/review checks if available on that account. No empty/backdated commits for appearances, no force-push, and no blanket git add . . Record AI assistance even if commits use the owner's identity. No agent should impersonate another real person or alter historical authors.

## Explicitly authorized first publication, after local PASS
After the owner approves the actual repo URL and visibility, configure that exact credential-free URL as origin AND the local workflow.approvedOrigin value. These are separate requirements; an origin alone is not acknowledgment. Do not guess the GitHub URL. The owner/authorized helper can run:

    git remote add origin <actual-approved-repository-url>
    git config --local workflow.approvedOrigin <same-actual-approved-repository-url>
    git fetch origin
    PUSH_AUTHORIZED=1 git push -u origin HEAD

If origin already exists, inspect it rather than overwriting it. Fetch/verify remote ancestry before a later normal push. PUSH_AUTHORIZED is an acknowledgment only, not proof of consent or authentication. No --force, --no-verify or permission-bypass shortcuts.
