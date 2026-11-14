# Visual, interaction and screen specification (planning pass, 2026-11-14)

Status: specification only. Nothing here has been rendered or measured. It extends docs/DESIGN_SYSTEM.md
(protected baseline) and never lowers it. Font licenses are NOT yet verified: read each package LICENSE at M05.

## 1. Art direction: "Polar Dusk Outpost"

A still, cinematic diorama on a lunar south-pole crater rim. Warm low sunlight against cool base light. Neon lives
only where the base is "alive" (seams, conduits, beacons) and never on reading surfaces.

Scene viewBox 1600x900, eye-level camera, slight downward tilt.
- Horizon at 58% height, rim curving down to the right.
- Sun 4 degrees above the horizon, far left, partly behind a ridge. Single key light; shadows 6-8x object height raking right.
- Earth: small half-lit disc at x 78%, y 16%.
- Hab-1 (cylinder + airlock) on the lower-left third line: the focal point.
- Greenhouse dome right of Hab-1, translucent, violet-green inner glow.
- Solar array: mast with 3 panel pairs on the left ridge, facing the sun.
- Regolith berm shelter: half-buried arch behind Hab-1.
- Comms mast with dish in the right third. Rover foreground right for scale. Glowing ground conduits link modules.
- Lighting: key #FFE2B0, Earth fill #5B7FB8 at 8%, cyan/violet emissive practicals.
- Kid-safe cyberpunk: chamfered panel corners, thin scanline on the scene frame only, glyph-coded module labels,
  a friendly base-computer callsign. No skulls, glitch text or hostile copy.

2D/SVG layers, back to front (parallax px): starfield (0), Earth (2), sun glow + ridge (4), far crater wall (6),
long shadows (8), berm/array/mast (10), Hab-1/dome/conduits (12), rover + rocks (18), particle canvas (20),
space-weather streak overlay, vignette.

WebGL tier (M06, optional) adds: directional light with one 1024 shadow map, low-poly displaced terrain, instanced
rocks, emissive windows with a single bloom pass, slow 6-degree dolly, instanced-points particle stream.

## 2. State to scene reactions

| State | 2D tier | WebGL tier | Low-effects / reduced motion | Non-colour cue |
|---|---|---|---|---|
| Power >= 60 | all windows lit, conduits pulse (4 s), panels glint | emissive 1.0 + bloom | static lit | "Power: Strong", bolt, 3 bars |
| Power 30-59 | half the windows, slower pulse | emissive 0.6 | static half lit | "Steady", 2 bars |
| Power < 30 | airlock light only, conduits dashed | emissive 0.25, no bloom | same, static | "Low", 1 bar, warning triangle |
| Oxygen bands | dome glow + plants full / sparse / wilted, vent puffs | dome opacity, puff sprites | three static dome states | "Oxygen: Strong/Steady/Low", leaf |
| Crew: working | crew dots in Hab-1 windows | same | same | label "Crew: Working" |
| Crew: in shelter | dots move to berm, hatch light on, shield arc outline | arc mesh fades in | instant swap | "Crew: In Shelter", shield icon |
| Space weather quiet/watch/storm/clearing | no streaks / faint at sun edge / dense slanted streaks + hatched amber band / thinning | 0 / 150 / 600 / 150 particles | static hatch density 0-3 | stage chip with text + 0-3 chevrons |
| Shelter stocked | supply crates and light at berm entrance | same | same | "Shelter: Ready" chip |
| Action resolution | 600 ms outline sweep on affected module + delta chip ("Power -18") | plus emissive ramp | outline appears, no sweep | delta chip text + log line |
| Critical | steady 2 px amber/red frame on module, never blinking | same | same | "Critical" badge + icon |
| Success | sun crests, all lights on, beacon steady | 3 s dolly out | static bright state | heading "Mission complete" |
| Paused / failure | lights to standby, crew in berm, calm | slow dim | static | heading "Mission paused: crew safe" |

Acceptance: each band change differs from the previous screenshot by >= 2% of scene pixels, and every row is
distinguishable in a greyscale screenshot.

## 3. Screens

### Briefing
Full-bleed scene at 55% brightness. Centred card (max 640 px): working title, 3-line objective, "what you manage"
row (Power, Oxygen, Crew safety), primary "Start mission" (56 px tall). Footer: Sources, Settings, About + AI disclosure,
"Independent student project. Not endorsed by NASA." Focus order: Start, Settings, Sources, About.
If a valid save exists: "Continue mission" primary, "Start over" secondary.

### Console, 1440x900
12-column grid, 24 px gutters.
- Header 64 px: title, objective sentence, turn pips "2 of 6", Sources, Settings, mute.
- Left 7 columns: scene 816x510 (16:10); meter rail 96 px (Power, Oxygen, Samples, Crew chip, Shelter chip); event timeline 72 px.
- Right 5 columns: situation card (title, <= 40 words, source chip), 3 choice cards, sticky Confirm.

### Console, 1024x768
6/6 split, scene 480x300, timeline collapses to the current event chip, scanlines and parallax off.

### Console, 390x844
Stacked: header 56 px; sticky scene 390x220; meters 2x2; situation; full-width choices; Confirm in a sticky 64 px
bottom bar; history accordion. No horizontal scroll.

### Components
- Choice card (radio group, min 88 px): icon, verb title <= 4 words, one-line effect, signed chips with up/down glyphs
  ("Power -18", "Samples +1", "Crew to Shelter"). Selecting shows hatched ghost segments on the meters.
  Unavailable: lock icon + reason ("Needs 30 Power"), focusable with aria-disabled.
- Meter: icon, label, "62 / 100 game units", 10 segments, band word, ghost preview, threshold tick.
- Timeline: real DONKI records as nodes with UTC time in mono; id opens Sources; "you are here" marker;
  label "Archived NASA record, not live". Model-output nodes carry a distinct dashed outline and "Forecast model" tag.
- Science card (replaces choices after resolution): "What happened" <= 35 words, then three tagged rows:
  Observed (eye icon), Science idea (book icon), Game rule (gear icon). Primary "Next turn".
- Debrief: final scene left; right: outcome heading, end meters, decision log (turn, choice, effect, lesson),
  "Try another strategy" hint, "Play again" primary, "See sources".
- Drawers: right side 480 px (full screen on mobile). Sources grouped Observation / Forecast model / Science idea / Game rule
  with dataset, id, retrieved date, units, link. Settings: Sound (off by default), Reduce motion, Low effects,
  Reset save (inline two-step confirm; no browser dialogs).
- Resolving: Confirm reads "Working..." with aria-disabled.

## 4. Transitions (full / reduced)

| Moment | Full motion | Reduced motion |
|---|---|---|
| Briefing to console | 900 ms: card fade 200 ms, scene 55 to 100%, panels slide 24 px with 60 ms stagger, cubic-bezier(.2,.8,.2,1) | 150 ms crossfade |
| Commit to resolution | button compress 120 ms, module sweep 600 ms, meters tween 500 ms, science card at 700 ms | instant values, 150 ms fade |
| Turn change | pip 200 ms, card crossfade 180 ms, sun shifts 1 degree over 800 ms | instant |
| Storm arrival | 2.5 s streak ramp from the sun side, horizon band fade, opacity change <= 20%/s | static stage swap |
| Debrief | 1.2 s scene settle then panel 250 ms | instant |

No shake, strobe, flashes or looping motion behind text. Animation is presentation only; the reducer has already resolved.

## 5. Typography (licenses to verify at M05)

Self-hosted woff2, latin subset, font-display swap. Candidates: Orbitron 600/700 (display, >= 20 px headings and chips only),
Atkinson Hyperlegible Next 400/600 (body), JetBrains Mono (telemetry). Scale 14 (mono metadata only) / 16 / 18 / 22 / 28 / 40.
Line height 1.5, max 60ch. Reading level grade 3-4, sentences <= 14 words. Sentence case; caps only on <= 2-word labels.
If a license cannot be confirmed, fall back to the system UI stack and record it.

## 6. Tokens (computed contrast, to be re-audited on the real build)

| Colour | on #070B16 | on #10182A |
|---|---|---|
| text #EDF4FF | 17.8 | 16.0 |
| text-2 #B6C3D8 | 11.0 | 9.9 |
| cyan #66E3FF | 13.1 | 11.8 |
| violet #AC91FF | 7.7 | 6.9 |
| amber #FFD166 | 13.6 | 12.3 |
| critical #FF6B6B (new) | 7.1 | 6.4 |
| success #7CF2B0 (new) | 14.2 | 12.8 |
| muted #8494AE (new) | 6.4 | 5.8 |

Primary button: cyan fill, #070B16 text. panel-2 #1A2540. Decorative border #2A3A5C (1.7:1, decoration only);
control boundary #5B7199 (3.6:1 on panel). Focus ring: 3 px white, 2 px offset, 2 px #070B16 inner ring.
Spacing 4/8/12/16/24/32/48. Radii 6/12, 8 px chamfer via clip-path. Glow: box-shadow 0 0 24px at <= 35% alpha on
containers only, never text-shadow. Durations 150/250/600 ms.

## 7. Accessibility

- Keyboard: Tab between regions, arrows inside the choice radio group, Enter/Space select, separate Confirm button,
  Esc closes drawers, skip link to "Current decision". No single-key shortcuts.
- Focus: after resolution to the science-card heading; after Next to the situation heading; debrief to the outcome heading.
- One polite live region announces one composed sentence per resolution. Assertive only on first entering critical.
- Drawers: dialog element, focus trap, focus returns to trigger, background inert.
- Scene: role="img" with a state-derived description. forced-colors supported. Touch targets >= 48 px on mobile.
- prefers-reduced-motion is the default source; the Settings toggle overrides and persists.

## 8. Performance budgets (targets, not claims)

Core JS <= 300 KB gzip; fonts <= 120 KB; inline SVG <= 60 KB. 2D animates transform/opacity only; particle canvas
<= 200 particles, paused when hidden. WebGL lazy chunk <= 350 KB gzip, < 60 draw calls, < 50k triangles, DPR cap 1.5
(1.0 mobile), frameloop="demand". Auto-degrade when mean frame time > 24 ms for 2 s. Cut order: bloom, shadows,
particles, dolly, whole WebGL tier. 2D is selected when WebGL2 probe fails, failIfMajorPerformanceCaveat trips,
deviceMemory < 4 or saveData is set. webglcontextlost swaps to the 2D scene with the same selector props.
Low-effects is a static, crisply lit SVG that must still score >= 4 on the rubric.

## 9. Assets

All original: one layered scene SVG, about 14 icons (24 px grid, 2 px stroke), procedural starfield/noise, code-built
low-poly geometry. No NASA insignia, flags or patches. No AI-generated imagery is planned; if any is added it needs a
visible on-image mark. Optional: one credited NASA photo and one or two Moon Trek tiles (both need terms checks).
Audio is optional and cut first: WebAudio oscillator blips, off by default.

## 10. Visual risks and the check for each

1. Generic dashboard look: scene >= 55% of desktop viewport; evaluator distinctiveness >= 4.
2. Glow or scanlines over text: axe + zoomed card screenshots.
3. Colour-only state: greyscale screenshots of all bands and stages.
4. Mobile hides Confirm: Playwright asserts Confirm in viewport after selection at 390x844.
5. Scene reactions too subtle: >= 2% pixel diff per band.
6. Weak 2D fallback: WebGL-disabled run captures the same required screens.
7. Reduced motion loses information: delta chips and log text asserted present.
8. Display font overuse: test that Orbitron appears only on h1-h3 and chips and all text is >= 16 px (14 px mono metadata excepted).

Required captures: briefing, decision, resolution, critical, storm, debrief, mobile, low-effects, reduced-motion.
