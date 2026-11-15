# Integration status, 2026-11-15

This file is the current classification. It does not edit protected kit documents, and it does not claim that every NASA API is part of the game. Mars, Earth-imagery, asteroid, exoplanet, and rover feeds are not this Moon-storm lesson.

## Retrieval dated this session

OSD-476 was fetched again on 2026-11-15T11:47:04Z from `https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-476/`. HTTP 200, `application/json`, 15068 bytes, SHA-256 `a6d16e63e419f426c4d2fb63f22ace51c47f486fdb8ea29de00b447db3c3f454`. The body is stored at `src/data/verification/osd476-raw.json`. The receipt is a later verification. The study is an Earth ground study of Arabidopsis in Apollo regolith, not an oxygen-yield model.

The four DONKI queries in the snapshot were fetched again from CCMC on 2026-11-15T11:47:05Z and 11:47:06Z. Each body is stored under `src/data/verification/donki/` with its own later-verification receipt. Those bytes match the 14 November hashes. They are still later files. The original acquisition was never written down, and these files are not renamed into it.

## Resource matrix

| Resource | Class | What this game does |
|---|---|---|
| DONKI FLR, SEP, CME, WSA-ENLIL (CCMC, no key) | Implemented, archived | 19 curated records in the snapshot. Observations and model runs stay distinct. No live fetch in the app. |
| api.nasa.gov DONKI mirror with the public DEMO_KEY | Implemented only as an explicit opt-in after the CCMC call fails | Not used for the committed snapshot. Receipts strip `api_key`. No private key. |
| OSD-476 | Later-verification body and receipt in the package | Earth ground study of Arabidopsis in Apollo regolith. Not lunar oxygen production. |
| CSA food-production toolkit | Reference only | Educational credit. Not an API and not an endorsement. |
| science.nasa.gov radiation-protection article | Reference only | Supports "shielding can reduce exposure," not a safety guarantee. |
| RadLab | Deferred | The 2026-11-15 probe saw an error page. ISS data would not become a lunar dose. |
| Moon Trek WMTS | Deferred | Optional terrain reference. No tile is integrated. |
| NASA Image Library | Assessed, not used | A 200 response was not south-pole terrain. |
| DONKI notifications, CMEAnalysis, other operations | Documented, deferred | Not required for the six-turn lesson. |
| Mars, Earth, asteroid, APOD, EPIC, EONET, exoplanet, InSight, rover, and orbit feeds | Irrelevant to this mission | Not integrated. |

## Checks

`npm run data:validate` reads the tracked later bodies. On this machine before the canonical check it passed 15 tests and skipped none. A matching hash is recorded as drift-free, and the receipt label stays `later-verification`. Live NASA calls stay outside the five canonical app checks.
