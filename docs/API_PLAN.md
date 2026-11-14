# NASA/partner integration plan and verification boundaries
Checked: November 14, 2026. A documented endpoint is not the same as a successfully integrated dataset. No playable snapshots have been created by this kit.

## Priority 1: DONKI
Official documentation: https://ccmc.gsfc.nasa.gov/DONKI/api/
OpenAPI inspected: https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/
Current documented base: https://ccmc.gsfc.nasa.gov/DONKI-API
Relevant operations include GET /get/FLR, /get/SEP, /get/CME and /get/notifications. The actual parsed spec gives a maximum 60-day window for FLR and SEP; FLR also documents the class filter. Use operation-specific documented parameters; do not assume every endpoint accepts the same filters. The retrieved official spec is preserved in docs/reference/donki-openapi-2026-11-14.json. The September 2026 migration changed the old kauai host/base. Use the spec, not copied legacy URLs.

Intended role: an attributed historical space-weather event anchors a mission's environmental context. Preserve exact event identifiers and times, acquisition date and original values. Flare classification does NOT directly determine astronaut dose, lunar exposure, shielding effectiveness or a validated communications outage. Any game mapping is a clearly labeled educational rule, reviewed for scientific plausibility.

At event time: retrieve a bounded window, validate records, handle [] as a valid response, select a defensible example, record provenance and commit the curated snapshot. If the window is empty, query a different bounded historical window; never invent a NASA event. Build/play should not call the network.

## NASA Open APIs portal
https://api.nasa.gov/
Authentication documentation: https://api.nasa.gov/assets/html/authentication.html
DEMO_KEY documentation states 30 requests/IP/hour and 50/day; normal default is 1,000/hour, service-dependent. This applies to api.nasa.gov, not automatically to every NASA service. No blanket key requirement is assumed for the direct CCMC endpoint. A personal NASA API key is optional if a selected api.nasa.gov service needs it; keep it out of the client and do not create an account without authorization. APOD is not mission evidence; assess each image's copyright and credits before any optional use.

## Priority 2: OSDR
Search result located NASA's OSDR Developer API reference, but a direct fetch of https://www.nasa.gov/reference/osdr-developer-api/ returned 404 in this session. Re-resolve the canonical live API documentation from OSDR before implementation. Do NOT guess a search endpoint from a stale snippet.
Intended role: a very small, relevant published-study evidence collection for educational explanations. Distinguish organisms, conditions, mission context and findings. A mouse or cell experiment is not a direct human lunar-health claim. No diagnosis or invented effect sizes. A static verified study reference is sufficient; a live search UI is not required.

## RadLab: optional reference, not lunar dosimetry
https://visualization.osdr.nasa.gov/radlab/gui/data-api
Official indexed docs describe GET queries at https://visualization.osdr.nasa.gov/radlab/api . Direct documentation fetch returned HTTP 500 during this session. Endpoint response, instrument fields, units, coverage and usage conditions remain unverified. Treat integration as BLOCKED until checked, not implemented.
Use only if it adds a real learning benefit after core completion. ISS measurements cannot be relabeled as Moon-base measurements; absorbed dose, dose equivalent and dose rate are not interchangeable. Never generate a lunar safety prediction by multiplying an ISS reading with a made-up shield factor.

## Mars Trek: not needed for a lunar MVP
The brief lists Mars Trek for real Mars imagery/terrain. No programmable endpoint or asset license was verified here. This is intentionally deferred: Mars geography is not Moon geography. If a team-authored Mars version is selected later, verify official export/API docs, provenance, licensing, downloads and payload sizes first. Do not invent a connector to satisfy an API count.

## CSA educator resources: curated content, not a fictional API
Food toolkit: https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production
Educator toolkits: https://www.asc-csa.gc.ca/eng/youth-educators/toolkits
Use for appropriately attributed educational explanations where relevant to the selected mission. These are educational resources; no machine API has been established. Link/quote only within the site's actual usage terms. Food production is not permission to add a large new farming subsystem.

## Acquisition requirements
Per connector: actual status and content-type, bounded timeout, documented schema, units, date boundaries, empty/partial/malformed responses, 429/5xx behavior, credits/terms, content hash and deterministic normalization. Preserve raw evidence locally without secrets. CI tests use honest fixtures and the committed snapshot, not a live API. Source status must say documentation-verified / response-verified / integrated / deferred / blocked precisely.

Maximum useful NASA grounding, not maximum API count. One meaningful integration is stronger than six decorative badges.
