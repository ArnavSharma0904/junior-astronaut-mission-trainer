# Architecture and source ownership

## Minimal stack
React + TypeScript + Vite, CSS design tokens, a pure TypeScript game reducer, schema validation (Zod or equivalent), Vitest, Playwright and axe-core. Optional three + @react-three/fiber + @react-three/drei; postprocessing only after a measured benefit. Use React state/reducer first; add Zustand only if complexity justifies it. Do not install Puppeteer alongside Playwright for the same job. No database, authentication, multi-service backend or runtime LLM.

Resolve current compatible stable versions at M01, verify official docs, lock exact resolved dependencies and commit package-lock.json. Node 24 LTS is the proposed CI baseline; verify the package engine requirements before implementation. No blind latest-version upgrade during final polish.

## Proposed file ownership
- src/game/{types,reducer,rules,selectors,validation}.ts: deterministic state transitions, no DOM, fetch, audio, clocks or render imports.
- src/content/: team-authored situations and learning objectives, validated against schemas.
- src/data/: normalized records, source manifest, attribution, immutable published snapshots and transformation notes.
- src/adapters/: NASA normalization functions; fetching belongs to build scripts or an optional server endpoint, not secret-bearing client code.
- src/components/: accessible HTML controls, meters, cards, drawers and debrief.
- src/scene/: optional lazy WebGL view plus an equally functional 2D view; consumes selectors, never mutates state.
- src/styles/: tokens, layout, component and low-effects styles.
- tests/{unit,integration,e2e}/: correctness, contracts, real flows and accessibility.
- scripts/data/: bounded, explicitly invoked data acquisition/validation. Never make API refresh a prerequisite for playing or building from an existing snapshot.
- docs/: canonical contracts and release evidence index.

## Data contracts
SourceRecord: stable id, agency, dataset/study id, record URL, retrievedAt, observedAt (nullable), original units, transformed units (if any), exact supported claim, license/usage notes, transformation version, content hash, source status (live/snapshot/reference/unavailable). NormalizedEvent retains raw source id/type/time and only documented fields. GameScenario references source ids and separates observedFacts, educationalInterpretation and simulationAssumptions.

GameState: schemaVersion, missionId, turnIndex, resources, protectionMode, environmentIndicator, decisionLog, outcome, settings and snapshotVersion. Action resolution returns state plus typed explanation/consequence events. Use an explicit deterministic seed only if randomness is introduced. Persist a versioned subset; validate on load and offer reset for corrupt/stale saves. No clock-dependent tests.

## Build identity
Vite injects the actual Git HEAD at build/start into a BUILD_SHA constant and a readable DOM data-build-sha attribute; do not write this value back into tracked source. Browser QA must match it to the review request. A stale server fails review. Release E2E starts its own built preview and checks its identity.

## Reliability and security
A prebundled valid snapshot is default. Optional fetch has a timeout, cancellation, validation, 429/backoff handling and last-known-good behavior. Never label bundled historical data as live. No public key proxy, arbitrary URL fetch or permissive CORS relay. No API keys in VITE variables. On WebGL context loss, fall back without losing game state. Announce meaningful updates to assistive technology without reading every animated frame.

## Infrastructure
Static production build on a provider with a verified free tier. Deployment, account creation, usage charges, domain changes and public pushes require explicit authorization. Node-based snapshot collection keeps the playable app static. Optional serverless refresh is a stretch, not a core dependency. No automatic public preview of secrets or unpublished personal information.
