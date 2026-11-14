# Implementation plan for Cursor (planning pass, 2026-11-14)

Author: Claude (Fable 5.2 route, as reported by the tool) as planning lead, with three read-only specialist
contexts (NASA data, visual/interaction, architecture/tests). No game code, assets or data snapshot were created.
Companion files: NASA_DATA_PLAN.md and VISUAL_SPEC.md in this folder. The protected contracts in docs/ still govern;
where this plan is more specific it is an elaboration, and every real scope change is listed in section 9.

Originality note: the mission design below is an AI-proposed draft. Under D002 and the PRD the team must review,
change and own it. Record what the team changed in docs/AI_USAGE.md.

## 1. Mission design: "Storm Watch" (working name, team to decide)

Setting: a small outpost on a lunar south-pole crater rim. The player is the junior flight engineer.
Goal shown at all times: "Collect 3 ice-drill samples and keep the crew safe."
The six turns follow real archived DONKI records from 9-11 May 2024 (see NASA_DATA_PLAN.md section 2).

### State (all values are GAME units, integers, clamped 0-100)
- power: starts 85. oxygen: starts 64. samples: starts 0 (goal 3).
- shelterStocked: false. crew: 'working' | 'sheltered'.
- spaceWeather: 'quiet' | 'watch' | 'storm' | 'clearing' (educational indicator, never a dose).
- Upkeep applied after every action: power -2, oxygen -8 ("the crew breathes, the base idles").

### Turns and actions (deltas before upkeep)

| Turn | Real record shown | Weather | Actions |
|---|---|---|---|
| T1 Morning check | 9 X-class flare records in the 8-12 May window, same active region | watch | Run ice drill: power -18, samples +1. Charge batteries: power +20. Boost greenhouse: power -10, oxygen +18 |
| T2 Flare seen | FLR X2.2, peak 09:13Z 9 May; CME record 09:24Z | watch | Run ice drill: power -18, samples +1. Stock the shelter: power -8, oxygen -6, shelterStocked. Charge batteries: power +16 |
| T3 Forecast changes | two WSA-ENLIL runs with different Earth-arrival estimates (MODEL OUTPUT) | watch | Run ice drill: power -18, samples +1. Boost greenhouse: power -10, oxygen +18. Stock the shelter (unavailable if already stocked, with reason) |
| T4 Particle storm | FLR X5.8 peak 01:23Z 11 May; SEP record 02:10Z | storm | Go to shelter: if stocked power -4, else power -14 and oxygen -12 (rushed). Shelter and drive drill by remote: needs stocked and power >= 30; power -24, samples +1. Keep working outside: breaks the storm safety rule, mission paused |
| T5 Storm continues | STEREO A SEP record 04:07Z (a different place in space) | storm | Rest in low power: power -2, oxygen -6. Remote drill: needs power >= 30; power -24, samples +1. Release reserve oxygen: power -14, oxygen +16 (made-up game units; not CO2 scrubbing) |
| T6 All clear | game assumption (the data does not give an "all clear" time; labelled as a game rule) | clearing | Surface drill: power -18, samples +1. Repair and recharge: power +15. Restart greenhouse: power -10, oxygen +18 |

### Endings
- Success: samples >= 3 and power >= 10 and oxygen >= 10 after T6.
- Partial: finished safely but short on samples or reserves. Debrief says exactly which.
- Paused (failure): power or oxygen reaches 0, or the crew is outside during the storm turn. Copy stays calm:
  "Mission Control paused the mission. The crew is safe." No injury, illness or dose language.

### Planning-time balance check (enumeration of all 306 terminal paths, run in the planning sandbox)
10 success, 223 partial, 42 power-out, 7 oxygen-out, 24 safety-rule pauses. No "always pick option k" policy wins.
Winning strategies differ in kind: prepare early then remote-drill through the storm; or drill early, take the rushed
shelter and recover by releasing stored oxygen. Example wins:
- charge, drill, stock, shelter+remote, reserve oxygen, drill (ends power 10, oxygen 24)
- charge, drill, drill, rushed shelter, reserve oxygen, drill (ends power 10, oxygen 18)
- drill, charge, stock, shelter, remote, drill (ends power 17, oxygen 10)

Known tuning debt (M02 must fix, test-enforced): no winning path currently uses a greenhouse action, so oxygen
pressure is too weak. Retune numbers until every non-trap action appears in at least one winning path. These numbers
are a starting point, not a verified design; M02's own enumeration test is the authority.

### Learning objectives (one per turn, each tied to a source id)
1. Engineers trade one resource for another; nothing is free.
2. Flare light arrives in minutes.
3. Forecast models help, and forecasts change (model output vs observation).
4. Fast particles can follow a flare within an hour, so preparing early matters.
5. Shelter keeps the crew safe but work slows down; remote tools help.
6. After a storm you rebuild reserves before pushing on. Greenhouse card: OSD-476 Moon-soil plant study + CSA credit.

## 2. State machine

App phase: boot -> (resumePrompt) -> briefing -> mission -> debrief -> briefing|mission (replay).
Turn phase inside reducer state: situation -> inspecting(actionId) -> resolving -> explained -> next turn | ended.
Events: START, INSPECT(id), COMMIT(id), RESOLUTION_SHOWN, NEXT, RESTART, LOAD(saved), RESET.

Guards:
- COMMIT only in situation/inspecting and only for a legal action; otherwise same state reference plus a rejection
  carrying the constraint text.
- COMMIT applies deltas, upkeep and sets `resolving` in one step. A second COMMIT is a no-op (double-spend lock in
  the reducer; the disabled button only mirrors it).
- NEXT only in `explained`. RESOLUTION_SHOWN is dispatched by a UI timer, immediately under reduced motion.
  Tests never wait on a clock.
- Saving during `resolving` persists the post-commit state as `explained`.

```ts
type TurnPhase = 'situation' | 'inspecting' | 'resolving' | 'explained' | 'ended';
type Outcome = 'in-progress' | 'success' | 'partial' | 'paused';
interface GameState {
  schemaVersion: 1; missionId: string; snapshotVersion: string;
  turnIndex: number; phase: TurnPhase; inspecting: string | null;
  resources: { power: number; oxygen: number }; samples: number;
  shelterStocked: boolean; crew: 'working' | 'sheltered';
  spaceWeather: 'quiet' | 'watch' | 'storm' | 'clearing';
  decisionLog: Decision[]; outcome: Outcome; pauseReason?: 'power' | 'oxygen' | 'safety-rule';
}
interface ActionDef {
  id: string; turn: number; labelKey: string;
  delta: { power?: number; oxygen?: number; samples?: number };
  sets?: { shelterStocked?: true; crew?: 'sheltered' };
  requires?: Guard[]; breaksSafetyRule?: true;
  principleId: string; sourceIds: string[];
}
interface Resolution { state: GameState; events: ConsequenceEvent[]; explanationKey: string; rejected?: { reason: string } }
```

Persistence: localStorage key `jamt.save.v1` = { schemaVersion, snapshotVersion, state }; settings in a separate key
{ muted: true, reducedMotion: 'system'|'on'|'off', lowEffects: boolean, renderer: 'auto'|'2d' }. Zod-parse on load;
any mismatch shows "Saved mission could not be loaded. Start fresh." and never crashes.

Build identity: vite.config.ts reads `git rev-parse HEAD` (fallback GITHUB_SHA, then 'unknown'), exposes
`__BUILD_SHA__` via define; main.tsx sets `document.documentElement.dataset.buildSha`. No tracked file is written.

## 3. Dependencies (registry versions seen 2026-11-14 via npm view; not yet installed together)

react 19.3.1, react-dom 19.3.1 (pin exactly; R3F peer is >=19 <19.4), vite 8.3.8, @vitejs/plugin-react 6.3.0,
typescript 6.0.3 (NOT 7.x: typescript-eslint 8.72.2 peers <6.1.0), eslint 10.15.0, typescript-eslint 8.72.2,
eslint-plugin-react-hooks 7.1.1, vitest 5.1.0, jsdom 31.0.1, @testing-library/react 16.3.3,
@playwright/test 1.65.1, @axe-core/playwright 4.14.0, zod 4.6.7.
M06 only: three 0.187.0, @react-three/fiber 9.8.2, @react-three/drei 10.7.9. No postprocessing unless measured.
Re-verify at install; if the set does not resolve, record what was changed. engines.node ">=22.22.2"; CI on Node 24
is authoritative. Do not edit .nvmrc, .gitignore, .env.example or ci.yml (all protected).

Scripts: dev `vite`; typecheck `tsc --noEmit -p tsconfig.json`; lint `eslint . --max-warnings 0`; test:unit `vitest run`;
build `vite build`; test:e2e `playwright test` (webServer `vite preview --port 4173 --strictPort`,
reuseExistingServer false, Chromium project only); preview; data:fetch (never part of build).

Clean-tree rule: run-checks.mjs requires a clean tree (including untracked files) between checks, and .gitignore is
protected. So: Vite cacheDir `node_modules/.vite`, no `tsc -b`, no eslint `--cache`, Playwright outputDir
`test-results`, HTML report in `playwright-report/`. Never leave scratch files in the repo.

## 4. File ownership

```
package.json package-lock.json index.html vite.config.ts tsconfig.json eslint.config.js playwright.config.ts   M01
src/main.tsx src/App.tsx src/build-info.ts src/vite-env.d.ts                                                   M01
src/game/{types,reducer,rules,selectors,validation,persistence-schema}.ts                                      M02
src/content/{mission.ts,schema.ts,copy.ts}                                             M02 stub, final in M04
src/data/{donki-snapshot.json,sources.json,schema.ts,index.ts,TRANSFORMS.md}                                   M03
src/adapters/donki.ts   (pure normalizer, no fetch)                                                            M03
scripts/data/{fetch-donki.mjs,validate-snapshot.mjs}                                                           M03
src/state/{useMission.ts,storage.ts,settings.ts}   (only place that touches localStorage)                      M04
src/components/{Briefing,Console,SituationCard,ActionList,ActionPreview,Meters,Timeline,Explanation,
  Debrief,SourcesDrawer,SettingsDrawer,LiveRegion,ErrorBoundary}.tsx                                           M04
src/scene/{SceneHost.tsx,Scene2D.tsx,sceneModel.ts}                                                         M04/M05
src/scene/webgl/**   (lazy import only)                                                                        M06
src/styles/{tokens,layout,components,effects,low-effects}.css  src/assets/fonts/                               M05
tests/unit/** tests/integration/** tests/e2e/**                                                          per slice
```

Lint-enforced boundaries: src/game imports only itself and zod, and may not use window, document, fetch,
localStorage, Date or Math.random. src/adapters has no fetch. src/scene never imports the reducer or dispatches.
three and @react-three/* only under src/scene/webgl. A unit test also scans src/game for forbidden tokens.

## 5. Acceptance tests

Unit (M02): enumerate every legal action sequence and assert: all states finite integers within clamps; every
non-terminal state has a legal action; >= 2 winning paths that differ in >= 2 turns; no fixed-option policy wins;
every non-trap action appears in >= 1 winning path; >= 1 path for each pause reason and the debrief names it; no
action with zero cost and zero trade-off; reducer deterministic; double COMMIT changes nothing.
Copy vs delta: preview chips and explanations render from ActionDef data; copy strings contain no digit literals;
every sourceId and principleId resolves.
Schema (M03): snapshot and manifest parse strictly; fixtures for HTML body, malformed JSON, `[]`, missing date/unit/id;
content hash recomputed; no `fetch(` anywhere under src/.
E2E on the built preview (M04+): success, failure and alternative paths; rapid double click logs once; keyboard-only
mission; drawer focus trap and return; restart; reload/resume; corrupt save; mute; reduced-motion emulation;
low-effects; WebGL unavailable (and forced context loss once M06 exists); offline after load; zero non-origin
requests; 1440x900, 1024x768, 390x844 with no horizontal overflow; axe on briefing, console, drawer, debrief;
data-build-sha equals git HEAD.
Visual (M05): the captures and checks in VISUAL_SPEC.md sections 2 and 10.

## 6. Ordered backlog

| Slice | Window | Tasks | Exit |
|---|---|---|---|
| M01 | Sat to ~11:45 | scaffold, pinned deps, 5 scripts, lint boundaries, build SHA, accessible shell, one smoke e2e + axe | run-checks PASS, tree clean |
| M02 | to ~13:15 | types, reducer, rules, mission data from section 1, enumeration tests, retune | unit assertions green; C1 review loop rehearsal |
| M03 | to ~14:15 (30 min acquisition cap) | fetch + validate scripts, committed snapshot + manifest, normalizer, fixtures, OSD-476 and CSA records | offline build; schema tests; ids confirmed against raw bytes |
| M04 | to ~17:30 | all screens, 2D scene v1, drawers, persistence, live region, final copy | full e2e list; C2 |
| M05 | to ~20:30 | tokens, fonts + licenses, three layouts, state-linked SVG scene, transitions, low-effects | captures + contrast audit; C3 if M06 skipped |
| M06 | optional, 60 min hard cap, see section 9 | lazy R3F tier, context-loss fallback | JS budget met, else revert |
| M07 | Sun morning | hardening and regressions | QA matrix green |
| M08 | Sun to ~12:00 | sources, AI ledger, submission text, <= 7 slides or <= 30 s video | text matches the build |
| M09 | Sun to 13:00 freeze | final checks; C4 | both lanes PASS on the exact SHA |

Cut order when late: optional photo and Moon Trek tiles, sound, WebGL tier, particles and bloom, WebKit smoke.
Never cut: the complete loop, provenance, the 2D fallback, the demo.

## 7. Kit gate traps for the builder

1. Every workflow command needs a clean tree including untracked files.
2. The pre-commit hook needs `node` on Git's PATH: commit from a terminal, not a GUI without nvm's PATH.
3. Claim with `node scripts/workflow.mjs claim cursor build` only after confirming `.agent-bus/locks/writer.json` is absent.
4. `request` needs a check run that started after the commit and matches HEAD: commit docs first, run checks, then request.
5. Request ids are single-use. Order is lock, review, unlock. Reviewer id must differ from `cursor`. Do not edit during review.
6. `scripts/codex-review.sh` needs the codex CLI. If it is missing, use a fresh Claude evaluator and record the substitution.
7. The Aside routine is paused. Browser PASS needs a real screenshot and observedBuildSha; otherwise BLOCKED.
8. ASIDE_REVIEW.md expects port 5173; preview defaults to 4173. Record the port in the request scope or serve review on 5173.
9. The push gate needs `workflow.approvedOrigin` (currently unset) and PUSH_AUTHORIZED=1. Both are owner actions.
10. run-checks allows 300 s per check: keep e2e under about 3 minutes.
11. The repo path contains a space. Quote it in scripts and configs.

## 8. Release readiness and what cannot be claimed

Ready means: clean HEAD with a PASS check run at that SHA; independent and browser PASS on the same request;
verify-protected passes; lockfile committed; no VITE_ secrets; zero third-party runtime requests; fonts and assets
license-listed; AI ledger current; snapshot labelled archived; submission fields drafted; owner approves origin and push;
new-visitor check recorded under .agent-bus/evidence.
Not established by this plan: any app behaviour, frame rate, accessibility conformance, CI result, Codex/Aside
availability, that the dependency set installs together, deployment, eligibility, or NASA endorsement.

## 9. Scope changes and refinements (explicit)

Refinements consistent with the baseline (no approval needed):
- R1: mission spans three real days of records rather than a single event chain, because NASA's own records link the
  10 May particle events to several flares. A one-flare-one-storm story would be false.
- R2: a third tracked quantity, `samples`, is the PRD's "mission progress".
- R3: `shelterStocked` and `crew` implement the PRD's "protection is a mode/status".
- R4: WSA-ENLIL forecast records are shown as a separately tagged "Forecast model" evidence kind.
- R5: OSDR OSD-476 and a CSA credit support the greenhouse card (PRD: "OSDR and CSA can support explanations").
- R6: API-failure browser flows are recorded as not applicable because the app has no runtime network.

Additions beyond the baseline (optional, cut first, none blocks the mission):
- A1: Moon Trek south-pole terrain inset (needs terms check).
- A2: one credited NASA library photo.

Proposed change to a protected contract (NOT in effect; see docs/DECISIONS.md ADR-P1):
- COMMIT_PLAN.md says skip M06 unless the 2D loop is done by Saturday 14:30. This backlog cannot meet that, so under
  the current contract M06 is SKIPPED and the SVG scene is the centerpiece. Running M06 on Sunday morning needs the
  owner's written approval of ADR-P1.

Not integrated, recorded honestly: RadLab (endpoint errors and ISS data is not lunar data), Mars Trek, APOD, EPIC.
