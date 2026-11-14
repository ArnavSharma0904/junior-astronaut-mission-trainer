# Art direction: cinematic space engineering with cyberpunk accents
Status: design contract, not rendered proof. The intended audience remains ages 7-12.

## Visual hierarchy
1. Hero lunar-base scene, readable objective and current situation.
2. One dominant primary decision action, with alternatives clearly legible.
3. Resource meters with text, icons and units/status.
4. Secondary telemetry, timeline and source provenance.

This is NOT a generic dark dashboard, a wall of tiny HUD labels, a neon trading terminal, or a shooter. No existing game/IP imitation, NASA seals, mission patches, generated flags or implied agency endorsement.

## Palette and typography
Background #070B16; panel #10182A; primary text #EDF4FF; secondary text #B6C3D8. Cyan #66E3FF for interaction, violet #AC91FF for secondary energy, amber #FFD166 for caution; reserve red for critical states. Verify actual foreground/background contrast; hex choices alone are not a contrast audit. Keep glow behind text, not across it. Use locally served, licensed fonts: a readable sans for body and a restrained display/mono accent for headings/telemetry. Record font licenses and do not depend on remote fonts.

Body starts at 16px; control labels preferably 16-18px. Controls target 44x44 CSS px or larger. Do not encode state using color alone. No illegible all-caps paragraphs, flickering text or flashing alarms.

## Layout
Desktop 1440x900: header and mission progress above a two-column layout. Scene takes roughly 60% of available width, decision panel the rest; telemetry below or beside the scene. Keep the decision and consequences visible without opening a modal. At 1024x768 reduce decoration before reducing readability. At 390x844 stack scene, resources, decision and history, retaining natural scrolling and no horizontal overflow. Sources and settings drawers have focus traps and return focus to their triggers.

## Scene craft
Use one intentionally composed diorama with terrain silhouette, habitat modules, solar surfaces, lighting and a starfield. Make resource/protection state visibly affect appropriate scene elements. Scene transitions may emphasize an already-computed consequence; animation never determines game logic. Keep UI text in HTML, not baked into WebGL.

React Three Fiber / Drei are optional visual-tier tools. Start with a styled 2D/SVG scene. Add lazy-loaded WebGL only after the playable loop and data gate pass. Reuse geometry/materials, instance repeats, cap DPR, avoid React state updates in the render loop, and stop unnecessary continuous rendering. Prefer a single tasteful bloom pass; avoid stacks of expensive shaders and chromatic aberration over reading surfaces. Disable bloom/shadows/particles first under low effects. Provide an explicit full 2D scene fallback for missing WebGL/context loss.

## Motion and sound
Purposeful 150-250ms UI transitions and restrained scene motion. Respect prefers-reduced-motion automatically; a persistent user toggle can disable nonessential motion. No camera shake, rapid flashes or endless animated reading surfaces. Audio starts only after a gesture, is optional, muted by default until preference/consent, and has equivalent visual feedback. Generated audio requires disclosure. Sources of every external asset must be tracked.

## Visual gates
Capture briefing, an active decision, resolved consequence, critical state, debrief, mobile, low-effects and reduced-motion screens. Evaluator checks hierarchy, coherence, craft, readability, feedback and distinctiveness separately. Do not substitute a beautiful marketing screen for a working mission. No baseline screenshot updates just to silence a regression. Side-by-side review is required for intentional visual changes.

## Performance targets, not claims
Aim for 60fps on a named contemporary laptop at the chosen viewport; retain responsive controls and a 30fps minimum target on an explicitly documented lower-end test profile. Measure actual scene frame times outside headless timing for claims. Initial critical JS target <=300KB gzip excluding lazy 3D chunk; first useful interaction target <=3s on a stated test profile. If misses persist, cut effect complexity, not core accessibility. Headless CI performance is a smoke signal, not proof of device FPS.
