# Fixed evaluator rubric
Write/approve rubric before implementation. This rubric has two scopes: SLICE and RELEASE. Every app slice runs all five real check scripts; early E2E tests only functionality that actually exists. A scoped checkpoint PASS verifies all acceptance applicable to that checkpoint and must list unavailable future features as NOT YET IMPLEMENTED, not passed. Full-mission, all-state visual screenshots, public-new-visitor and complete QA-matrix gates apply to final RELEASE, not M01/M02. No N/A may excuse a feature the current slice claims to implement. A RELEASE PASS requires all applicable mandatory gates; attractive screenshots cannot offset broken behavior. NASA's five criteria are Impact, Creativity, Validity, Relevance and Presentation. This engineering rubric supports them; it does not predict an award.

## Mandatory correctness and reliability
- Complete mission, meaningful alternatives, achievable success and honest failure; deterministic transitions and no double spending.
- Every visible control works, including restart/settings/sources; save validation and error recovery are tested.
- Offline play, API failure/empty responses, low effects and WebGL loss preserve functionality.
- Typecheck, lint, unit/integration tests, production build and built-preview E2E actually pass on the requested SHA.
- No secrets, unauthorized assets, private personal content or fabricated live-data labels.

## Science and learning
- At least one meaningful NASA resource and evidence of its effect on the experience.
- Observation vs interpretation vs game assumptions clearly distinguished, with exact citations/units/dates.
- No ISS-to-Moon dose extrapolation or unsupported safety/medical claims.
- Reading level and feedback appropriate to ages 7-12; debrief demonstrates the intended lesson.

## Visual and interaction quality
Independently score hierarchy, visual coherence, craft/distinctiveness, readability, feedback and responsive layout from 1-5 using actual screenshots and interaction evidence. For visual/release checkpoints, minimum target: every dimension >=4; any dimension below that is FIX, not a claim that everything is A+. For nonvisual early slices, visual scoring is explicitly NOT YET APPLICABLE, never an invented 5. A 4 means intentional composition, readable primary action, consistent spacing/type, visible state feedback and a complete responsive layout; a 5 requires unusually strong craft without compromising those basics. A 3 means generic/inconsistent or requiring explanation to operate. No invented score if the evaluator has not seen the app.
- Scene feels intentionally composed, not a stock dashboard.
- Cyberpunk accents do not compromise legibility or age appropriateness.
- Keyboard path, visible focus, accessible names, contrast audit and reduced-motion behavior pass.
- Viewports 1440x900, 1024x768 and 390x844 have no clipped controls or horizontal overflow.

## Process
- Fresh evaluator identity/context; no builder self-approval.
- Exact commit, clean reviewed source, fresh test logs and observed build identity.
- Browser evidence includes actual start-to-finish and recovery interactions, not captions alone.
- No silent rubric weakening or screenshot-baseline replacement.

Report verdict PASS / FIX / BLOCKED, exact SHA, evidence references, blockers with file:line, optional polish separately, measured vs unmeasured claims, and next step. BLOCKED is a valid honest result. Do not claim NASA eligibility on the team's behalf.
