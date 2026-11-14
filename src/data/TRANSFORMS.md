# Data transformations (version 1)

Source: NASA CCMC DONKI, https://ccmc.gsfc.nasa.gov/DONKI-API (no key). Archived records for 9-11 May 2024.
This is a historical snapshot. The app never requests data at runtime and never labels this data as live.

## How this snapshot was collected
On 2026-11-14 at 18:41 UTC the four queries listed in `donki-snapshot.json` were requested from a tab in the
owner's Chrome. Status, content type, byte length and SHA-256 of each raw body were computed in the page and are
recorded per query. The needed fields were then read out record by record. Raw bodies were NOT saved to disk by
that method. `npm run data:fetch` saves raw bodies under the ignored `.agent-bus/evidence/data/` folder and
`npm run data:validate` rebuilds the events from them and compares them with the committed snapshot. DONKI
records are revised over time, so a hash difference means "re-check", not automatically "wrong".

## Rules
1. Only documented fields are kept. `sentNotifications`, `link`, `note`, `catalog` and submission times are dropped.
2. Times stay in UTC at minute resolution exactly as DONKI gives them. No time-zone conversion in data.
3. Flare class is the GOES 1-8 angstrom X-ray class, unchanged. It is never converted to dose, risk or "safety".
4. FLR query: all X-class records in the window are kept.
5. SEP query: all records are kept. A record whose instrument name starts with `MODEL:` is a forecast-model
   alert and is flagged `isModelDerived: true`. Links are kept only where they name the 11 May X5.8 flare,
   together with the total number of linked records, because "linked" is a forecaster association and not proof of cause.
6. CME query: only the two records used by the mission are kept, with every analysis. DONKI marks more than one
   analysis "most accurate", so the app shows a speed range and never picks one value.
7. WSA-ENLIL query: only runs whose inputs include the CME that started 2024-05-09T09:24Z are kept. These are
   MODEL OUTPUTS for Earth. `estimatedShockArrivalTime` is a forecast, not an observation, and not a lunar forecast.
8. `linkedEvents: null` is treated as an empty list. An empty array response is valid but is never written as a snapshot.
9. The one derived number shown in the game is the 47-minute gap between the X5.8 flare peak (01:23Z) and the
   GOES >100 MeV particle event record (02:10Z). It is computed from the two archived times by `minutesBetween`.

## Not from DONKI
`osdr-osd-476` and `csa-food-toolkit` are reference records with status `reference`. The OSD-476 description was
read through an AI web-fetch summary and is not raw-verified. Records whose id starts with `assumption-` are game rules.
