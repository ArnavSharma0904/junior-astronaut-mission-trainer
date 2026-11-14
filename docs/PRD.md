# Baseline PRD: Junior Astronaut Mission Trainer
Status: proposed implementation of NASA's existing brief, not an originality-cleared entry. Team supplies its own original contribution at the permitted event.

## Product and audience
A short browser game for children 7-12 about engineering trade-offs in a lunar outpost. An adult judge should understand the objective within 20 seconds and complete a mission in roughly 3-5 minutes. These are design targets to test, not measured facts.

## One complete loop
Briefing -> mission console -> situation -> inspect choices -> commit one choice -> observable state change -> concise science explanation -> next turn -> honest success/failure debrief -> replay. Scope initially to one mission, 4-6 authored turns, and a small verified source collection. Scenario content is team-authored, not generated dynamically during play.

## State model
Power reserve and oxygen reserve use clearly labeled GAME units until a defensible physical model exists. Crew protection is a mode/status, not a consumable tank. Environmental hazard is an educational indicator, never a human radiation dose prediction. Mission progress and a decision log support the debrief. No health diagnosis, real-time safety advice, or claim of NASA approval.

## Must work
Start, tutorial dismissal, action selection/confirmation, consequences, turn progression, end states, restart, sources drawer, mute, reduced-motion/low-effects settings and local resume/reset. Show concise action-cost/consequence previews and keep the current objective visible. Confirmation is disabled during resolution so a double-click cannot spend resources twice. Move focus predictably after resolution and announce the meaningful result once. An unavailable action explains its constraint. No universal best option; the team must demonstrate at least two meaningful strategies and an achievable successful route. Balance tests catch softlocks, NaN, negative clamping errors and unrecoverable empty choices.

## Learning
Each meaningful choice is tied to a supported principle and an explicit learning objective. The debrief explains cause and effect rather than just awarding a score. A source drawer separates observation, interpretation and simulation assumptions. Use short, concrete wording, predictable controls and explanations suitable for the age group. Do not add frightening medical imagery, graphic hazards, gambling mechanics or hostile cyberpunk copy.

## Graphics promise
A central interactive lunar-base scene surrounded by crisp mission controls. State changes should alter meaningful scene elements, not just numbers. The game engine does not depend on rendering, networking, sound or animation. The 2D fallback must still be designed, complete and playable.

## Data promise
At least one NASA source genuinely informs the experience. Prefer an attributed, validated DONKI snapshot plus a very small evidence collection. Live refresh is optional; the mission never waits for it. OSDR and CSA can support explanations. RadLab is reference context only unless the exact scientific mapping is justified. Moon is the default setting; Mars terrain does not become lunar terrain.

## Exclusions
Accounts, multiplayer, paid services, a full physics or radiation model, medical recommendations, live AI chat, procedural story generation, inventories/crafting trees, a large map, or multiple planets. No requirement to use every NASA API.

## Acceptance
A fresh evaluator verifies the rubric. A real browser completes success and failure flows, replay, keyboard use, network-off and WebGL-off flows at the specified viewport sizes. Every exposed control has an observed effect. Science, performance and visuals are not declared A+ until evidence exists.
