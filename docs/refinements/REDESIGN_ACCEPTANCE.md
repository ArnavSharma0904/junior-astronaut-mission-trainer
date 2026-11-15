# Additive stricter redesign acceptance, declared BEFORE implementation
Owner explicitly expanded scope 2026-11-15. This adds requirements to, and never replaces/lowers, protected EVALUATOR_RUBRIC/DESIGN_SYSTEM/QA. No manifest refresh, no new WebGL/ADR-P1 approval.

## Art and authenticity
- Full scene/interface visual-system redesign, not palette-only or larger versions of old schematic shapes.
- Maintain a reference ledger linking actual NASA resources to specific artistic/scientific decisions, with limits and credits. No NASA identifiers, misleading official endorsement or fake human-authorship claim.
- Recognizable scale/material/ground contact: terrain silhouette and depth, habitat+airlock, greenhouse/glass, solar-cell surface, stocked shelter, drill/sample progress, crew location. Scene remains primary and functional, never obscured by a centered opaque card.
- Black lunar sky and one coherent low Sun; no unlabelled atmospheric/radiation fiction. Every resource/weather/crew band remains distinguishable with non-color cues; low effects retains craft.
- Three complete selectable/persisted themes: baseline-compatible Flight Deck, light Lunar Fieldbook, dark Night Shift. No unthemed hardcoded islands. Exact readable units, source taxonomy and danger meanings retained.

## Independent grading
- Both protected code and browser exact-SHA lanes required. Fresh reviewers, never builder self-score.
- TWO fresh visual review contexts examine actual new same-SHA screenshots. Each protected visual dimension>=4/5 for BOTH; no averaging away a sub4. Craft/originality target5, not an invented score or guaranteed result. Record disagreements and limitations.
- Explicit defect checklist in addition to scores: no hidden landmarks, generic repeated-container hierarchy, unexplained decorative telemetry, muddy material/light, inconsistent icon scale/type/spacing, cropped/obscured controls, theme leakage, unreadable evidence, false science/status/branding claims.
- Preserve original max3 bounded repairs per finding; new owner-authorized expansion is a new planned scope, not permission to erase prior repair history or endlessly churn.

## Functional/accessibility matrix
- All3themes x1440x900/1024x768/390x844, plus representative intermediate/short-landscape widths, with no overflow/occlusion. Include briefing, decision, consequence, critical, success/partial/paused, Settings/Sources, low-effects and reduced-motion.
- >=44px general /48px mobile hit targets, visible focus, real sequential Tab/ShiftTab/arrow/Space/Enter/Escape route, no test helper focus jumps masquerading as keyboard-only.
- At200% text, explicitly hit-test Confirm BEFORE click and Next, every evidence-row beginning/end/source, with storage-failure banner. Preserve original assertions; never accept only an8px sliver or aggregate-list visibility.
- Measured contrast across themes and key selected/focus/critical/disabled controls; no color-only meaning. Check new effects and pseudo-elements under reduced motion, low effects and forced colors.
- Settings migration preserves old sound/motion/low-effects prefs; unknown/malformed themes safe; denied theme persistence truthfully reports failure while current in-memory choice works. Existing mission save unchanged.

## NASA/data viability
- Catalog/resource matrix: implemented vs response-verified vs reference-only vs deferred vs irrelevant/unavailable. Do not claim all NASA APIs are integrated or add Mars/Earth/asteroid data as decorative badges.
- Meaningful DONKI data stays historical, observation/model/assumption separated; no real lunar dose/safety prediction. Qualify absolute safety and47-minute “warning” language.
- Pin OSD-476 raw metadata+hash/receipt, independently qualified as Earth ground study, not lunar oxygen-production proof. Preserve19curatedDONKI values and original-acquisition limitations.
- Actual raw SHA/body/bytes/URL/MIME/time/query/response-count checks, not hash-format tests alone. Newly retrieved verification evidence distinguished from missing original raw bodies.
- MIME, invalid JSON/schema/date, duplicate IDs/order, empty, timeout/stalledbody, offline,404/429/5xx, Retry-After seconds+HTTPdate, no final retry sleep, overall deadline, immutable last-known-good snapshot and safe explicit mirror policy. No secrets in browser/receipts/package. No live network dependency in deterministic mandatory CI.

## Performance/deliverables
- Keep baseline budgets: initial criticalJS<=300KB gzip, locally served fonts, useful interaction target<=3s on stated profile. Record actual methodology/asset totals/latency; no headless timings passed off as physical-phone/Safari/FPS evidence.
- Preserve five real canonical checks, and run stronger data/provenance tests separately when not in those scripts. Additive checks cannot silently weaken protected check scripts or fake snapshots.
- Seven-slide-or-fewer submission demo plus longer clearly separate technical/design/API appendix deck/report. Final screenshots, real final build ID/test counts and attribution, no placeholder photos or fictional integrations.
- Honest local-ready package only after applicable gates; source archive excludes .git/.agent-bus/.env/node_modules/phone/savebackups/logs; record exact build provenance for archive builds.
- No push/deploy/submit/purchases/accounts/signatures/eligibility certification without separate approval.
