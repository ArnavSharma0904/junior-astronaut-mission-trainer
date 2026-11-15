# Integration status, 2026-11-15

This file is the current classification. It does not edit protected kit documents, and it does not claim that every NASA API is part of the game. Mars, Earth-imagery, asteroid, exoplanet, and rover feeds are not this Moon-storm lesson.

## Retrieval dated this session

OSD-476 metadata was fetched again on 2026-11-15T11:08:43Z from `https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-476/`. HTTP 200, `application/json`, 15068 bytes, SHA-256 `a6d16e63e419f426c4d2fb63f22ace51c47f486fdb8ea29de00b447db3c3f454`. That matches the parent audit's hash. The body is not stored in the repository. The receipt in `src/data/osd476-verification.json` is a later verification, not the original acquisition, and not an oxygen-yield model.

The original DONKI raw bodies from 2026-11-14 were never written into the source package. A later `npm run data:fetch` must not be labeled as those original bytes.

## Resource matrix

| Resource | Class | What this game does |
|---|---|---|
| DONKI FLR, SEP, CME, WSA-ENLIL (CCMC, no key) | Implemented, archived | 19 curated records in the snapshot. Observations and model runs stay distinct. No live fetch in the app. |
| api.nasa.gov DONKI mirror with the public DEMO_KEY | Implemented only as an explicit opt-in after the CCMC call fails | Not used for the committed snapshot. Receipts strip `api_key`. No private key. |
| OSD-476 | Reference, later-verification receipt pinned | Earth ground study of Arabidopsis in Apollo regolith. Not lunar oxygen production. |
| CSA food-production toolkit | Reference only | Educational credit. Not an API and not an endorsement. |
| science.nasa.gov radiation-protection article | Reference only | Supports "shielding can reduce exposure," not a safety guarantee. |
| RadLab | Deferred | The 2026-11-15 probe saw an error page. ISS data would not become a lunar dose. |
| Moon Trek WMTS | Deferred | Optional terrain reference. No tile is integrated. |
| NASA Image Library | Assessed, not used | A 200 response was not south-pole terrain. |
| DONKI notifications, CMEAnalysis, other operations | Documented, deferred | Not required for the six-turn lesson. |
| Mars, Earth, asteroid, APOD, EPIC, EONET, exoplanet, InSight, rover, and orbit feeds | Irrelevant to this mission | Not integrated. |

## Checks

`npm run data:validate` runs without the missing original raw bodies. It checks the committed 19-record snapshot, the OSD-476 receipt, and injected fetch faults. It does not pretend a fresh DONKI download is the 14 November body. Live NASA calls stay outside the five canonical app checks.
