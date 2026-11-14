# Settled defaults and changes

D001: Sonoma State/Rohnert Park event, not Folsom. All teammates must be accepted at the same local event.
D002: Existing Junior Astronaut challenge direction; Moon default. Team-owned original contribution not invented/cleared by this kit.
D003: Short complete mission, static-first app, no runtime AI dependency.
D004: Cyberpunk-accented cinematic presentation, but accessibility and ages 7-12 constrain style.
D005: NASA evidence integral; maximum useful integration, not every API. No fake lunar radiation calculation.
D006: Claude planning -> explicit handoff -> one Cursor builder -> fresh code reviewer + Aside browser reviewer.
D007: Exact-SHA reviews, append-only request/verdict files, three-round repair limit, no automatic publishing.
D008: No additional personal profile/name in product UI by default. Git identity remains the owner's configured identity; assistance remains disclosed.

Changes: append an ADR with context, proposed change, files affected, trade-offs, acceptance updates and owner approval when changing a protected contract. Do not overwrite a decision to erase its history.

## Planning pass 2026-11-14 (Claude planning lead)

D009: Mission timeline uses archived DONKI records from 9-11 May 2024 (flares, CME, SEP) plus two WSA-ENLIL forecast records tagged as model output. Ids must be confirmed against raw responses in M03.
D010: OSDR OSD-476 and CSA toolkit are static, credited evidence for the greenhouse card. RadLab, Mars Trek, APOD and EPIC are not integrated; reasons in docs/refinements/NASA_DATA_PLAN.md.
D011: The app makes no runtime network requests. Data acquisition is an explicitly run script.
D012: The mission design in docs/refinements/IMPLEMENTATION_PLAN.md is an AI-proposed draft that the team must review and own (see D002).
D013: Owner reported on 2026-11-14 that organizers cleared the team to proceed. This is owner-reported and is not independently evidenced in this repository.

ADR-P1 (PROPOSED, NOT APPROVED, NOT IN EFFECT)
Context: COMMIT_PLAN.md skips M06 (WebGL scene) unless the complete 2D loop is ready by Saturday 14:30. The realistic backlog reaches that point around 17:30.
Proposed change: allow one 60-minute M06 attempt on Sunday 08:30-09:30 if C2 passed on Saturday, with automatic revert if the JS budget or any e2e check fails.
Files affected: docs/COMMIT_PLAN.md (protected), manifest and baseline hashes.
Trade-offs: more visual ambition against one hour less hardening time on Sunday.
Acceptance updates: none lowered; C3 would cover M06.
Owner approval: none recorded. Until approved through GOVERNANCE_CHANGE.md, M06 is skipped.
