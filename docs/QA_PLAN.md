# Verification plan

## Unit/integration
Pure reducer: each legal action, illegal action, double submission, resource boundaries, mission end, replay, deterministic seed if used, version migration, corrupt saves and no viable options. Check that story text matches actual state deltas. Schema rejects missing dates/units/source ids, HTML error pages, malformed JSON and unsupported fields. Data transformations preserve original units and provenance.

## Browser matrix
Built preview, not just dev server. Read data-build-sha and compare exact request SHA. Test Chromium first; smoke WebKit for the intended Mac and mobile layout if available. Capture viewport/browser/version and hardware for performance claims.

Flows: briefing->success; briefing->failure; choose alternative path; rapid double click; keyboard-only; sources drawer and focus return; restart; reload/resume; corrupt stored save; sound mute; reduced motion; low effects; no WebGL/context loss; offline after load; simulated API timeout/429/500/empty payload. No screenshots may contain personal data, API keys, private browser tabs or children.

Save focused screenshots to .agent-bus/evidence/<request-id>/ with meaningful names and a small evidence index. Video proof is optional development evidence and must not be confused with the chosen <=30s submission video (a <=7-slide deck is the allowed alternative). Run axe and manual keyboard/contrast checks; automated accessibility scans alone are not a complete audit.

## Performance
Record device, viewport, effects mode and measurement method. Inspect initial transfer and lazy chunks; use performance traces and actual interaction latency. Repeat known expensive scene changes. A low-effects path must remain attractive. CI timing is not enough to claim sustained 60fps on a real device. Do not burn the last hour chasing shader effects.

## Release gates: local readiness, then publication verification
A. LOCAL READY TO PUBLISH: independent reviewer + Aside/manual browser PASS on exact SHA, clean source, complete local QA, no P0/P1 blockers, NASA/asset/AI attribution, prepared submission fields and short demo. This is not evidence a public URL exists.

B. AUTHORIZED PUBLICATION: owner approves the actual repo remote/visibility/deployment; push/deploy that reviewed SHA through normal gates. No circular requirement for an already-public URL before the authorized first deployment.

C. PUBLIC VERIFIED / READY TO SUBMIT: test the deployed build as a new visitor without login, check exact build identity and all demo/final-project links, finish local pitch rehearsal, and submit only with required owner authorization/certifications. Save publication evidence under ignored .agent-bus/evidence so recording it does not silently change the reviewed source SHA. If public QA reveals a bug, fix -> new commit -> checks/review -> redeploy.
