# NASA / partner data plan (planning pass, 2026-11-14)

Status: research notes and contracts for M03. Nothing here is an integrated dataset yet.
Evidence limit: all responses below were seen through an AI web-fetch tool on 2026-11-14, which returns
summarised content. Exact HTTP status, content-type, raw bytes and hashes are NOT yet recorded. The planning
sandbox could not reach NASA hosts directly (proxy 403). M03 must re-fetch from the owner's terminal and
record raw evidence before any record below is treated as verified data.

## 1. Resource assessment

| Resource | Status today | Role in the game | Decision |
|---|---|---|---|
| DONKI direct (ccmc.gsfc.nasa.gov/DONKI-API) | response seen for /get/FLR, /get/SEP, /get/CME, /get/WSAEnlilSimulations; no key | Mission timeline: real flare, CME, particle-event and forecast-model records drive the 6 turns | PRIMARY, core |
| DONKI /get/notifications, CMEAnalysis | documented only, not fetched | none needed | skip |
| api.nasa.gov DONKI mirror | SEP call worked with DEMO_KEY, FLR call failed once | fallback for acquisition only | backup, never in client |
| OSDR Biological Data API (visualization.osdr.nasa.gov/biodata/api, OpenAPI v2.0.0) | /v2/dataset/OSD-476/ seen; /v2/query/datasets/ returned a server error once | Evidence card on the greenhouse choices: Arabidopsis grown in Apollo 11/12/17 regolith vs JSC-1A simulant (ground study) | SECONDARY, static record |
| Moon Trek WMTS (LRO LOLA south-pole shaded relief) | WMTSCapabilities.xml seen; terms unverified | One or two real south-pole terrain tiles, downloaded at build time, shown as a credited "real terrain" inset on the briefing | OPTIONAL after M04; needs terms check |
| RadLab | docs page loads; data endpoint returned server errors twice | None. ISS-interior dose rates are not lunar-surface data | NOT INTEGRATED (blocked + not applicable). One plain sentence in Sources at most, no numbers |
| NASA Image and Video Library (images-api.nasa.gov) | search response seen, no auth | At most one credited real photo in Sources/debrief; per-item credit check needed | OPTIONAL, cut first |
| APOD, EPIC | not relevant (third-party copyright / Earth imagery) | none | not used |
| Mars Trek | not relevant to a lunar mission | none | not used; recorded honestly |
| CSA educator toolkits | terms page seen: non-commercial educational reuse with "Credit: Canadian Space Agency", no logos, no implied endorsement | Short credited paraphrase + link in the greenhouse science card | curated content, not an API |

Fetched URLs: 
- https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-12&class=X
- https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-08&endDate=2024-05-14
- https://ccmc.gsfc.nasa.gov/DONKI-API/get/CME?startDate=2024-05-09&endDate=2024-05-09
- https://ccmc.gsfc.nasa.gov/DONKI-API/get/WSAEnlilSimulations?startDate=2024-05-10&endDate=2024-05-10
- https://visualization.osdr.nasa.gov/biodata/api/ and .../v2/dataset/OSD-476/
- https://visualization.osdr.nasa.gov/radlab/gui/data-api
- https://trek.nasa.gov/tiles/Moon/SP/LRO_LOLA_Shade_SPole875_5mp_v04/1.0.0/WMTSCapabilities.xml
- https://www.asc-csa.gc.ca/eng/terms.asp
- https://images-api.nasa.gov/search?q=lunar%20south%20pole%20LRO&media_type=image&page_size=3

## 2. Selected event window: 9-11 May 2024 (active region 13664)

IDs as seen in responses; M03 must confirm each against raw bytes and pin versionId.

| Turn use | Record | Seen values |
|---|---|---|
| T2 flare | FLR `2024-05-09T08:45:00-FLR-001` | X2.2, peak 09:13Z |
| T2/T3 cloud | CME `2024-05-09T09:24:00-CME-001` | analysis speed 1330 km/s, half-angle 45 deg |
| T3 forecast (MODEL OUTPUT) | `WSA-ENLIL/30626` | completed 05-09T16:43Z, estimated shock arrival at Earth 05-11T05:02Z |
| T3 forecast revised (MODEL OUTPUT) | `WSA-ENLIL/30652` | completed 05-09T20:46Z, estimated arrival 05-10T12:50Z |
| T4 flare | FLR `2024-05-11T01:10:00-FLR-001` | X5.8, begin 01:10Z, peak 01:23Z, end 01:39Z, AR 13664 |
| T4 particles | SEP `2024-05-11T02:10:00-SEP-001` | GOES-P SEISS >100 MeV, 02:10Z (47 min after flare peak) |
| context | SEP `2024-05-10T13:35:00-SEP-001`, CME `2024-05-11T01:36:00-CME-001` | linked records |

Why this window is used meaningfully: the real gap between the 11 May flare peak and the particle-event record
is under an hour, while the cloud forecast worked on a scale of days and changed between two model runs. That is
the reason the game rewards preparing the shelter before the storm turn. The data shapes the mechanic.

Qualification added 2026-11-15: the 47 minutes are only the interval between the archived X5.8 peak (01:23Z) and the GOES SEP record (02:10Z). They are not a Moon arrival time, a causal proof, or a guaranteed warning. Not every flare leads to local danger.

Not yet fetched (run in M03): `CME?startDate=2024-05-11&endDate=2024-05-11`,
`WSAEnlilSimulations?startDate=2024-05-09&endDate=2024-05-09` (to confirm the two run ids), and the single-day FLR/SEP calls.
If any id does not match raw data, use what the raw data says and update content. Never keep an unconfirmed id.

## 3. Observation vs model output vs analysis

- Observations: flare class and times (GOES X-ray), SEP threshold-crossing times (GOES/SOHO/STEREO A), OSD-476 results, LOLA terrain.
- Actual NASA-hosted MODEL OUTPUTS: WSA-ENLIL+Cone simulation records (CCMC). Arrival times are forecasts for Earth and listed spacecraft, not for the lunar surface. SEP entries whose instrument starts with `MODEL:` are also model-derived and must be filtered or tagged.
- Curated analysis: cmeAnalyses (speed/direction measured by forecasters), linkedEvents (forecaster association, not proof of cause).
- There is no NASA generative model in any of this, and the game does not present one.

## 4. Claims the game must not make

No conversion of flare class, particle flux or Kp into dose, illness or "safe/unsafe". No statement that Kp or a
geomagnetic storm affects the Moon. No "ENLIL predicted Moon conditions". No "this flare caused this particle event"
(say "linked in NASA's record"). No ISS dose numbers on the Moon. No "regolith blocks all radiation" or thickness numbers.
No "permanent sunlight" at the pole and no confirmed drinkable ice at the base.

Approved kid phrasing:
- "Flare light reaches the Moon in about 8 minutes."
- "Fast particles can arrive in minutes to hours. In this real event, satellites near Earth counted more of them less than an hour after the flare's peak."
- "The big cloud is slower. It usually takes 1 to 3 days. NASA's forecast model changed its arrival guess between runs."
- "The Moon has no thick air or magnetic shield like Earth, so crews plan to shelter behind thick material such as Moon soil."
- "Real Moon soil grew plants in a lab on Earth, but the plants grew slowly and showed stress."
- "Our hazard meter is a game indicator, not a real measurement."

## 5. Contracts (extend docs/ARCHITECTURE.md, do not replace it)

```ts
type SourceStatus = 'snapshot' | 'reference' | 'live' | 'unavailable';   // 'live' is never used in v1
type EvidenceKind = 'observation' | 'model-output' | 'curated-analysis' | 'educational-resource';
interface SourceRecord {
  id: string; agency: 'NASA' | 'CSA'; provider: string; datasetId: string;
  recordUrl: string; apiUrl: string | null;
  retrievedAt: string; observedAt: string | null; upstreamVersionId: number | null;
  kind: EvidenceKind; originalUnits: string | null; transformedUnits: string | null;
  supportedClaim: string; notSupported: string[];
  usageNotes: string; transformationVersion: string; contentSha256: string; status: SourceStatus;
}
interface NormalizedEvent {
  sourceId: string; rawId: string; type: 'FLR' | 'CME' | 'SEP' | 'ENLIL';
  timeUtc: string; peakTimeUtc?: string; endTimeUtc?: string;
  classType?: string; instrument?: string; isModelDerived: boolean;
  speedKmS?: number; linkedRawIds: string[];
  enlil?: { modelCompletionTime: string; estimatedShockArrivalTime: string | null; target: 'Earth' };
}
interface SnapshotManifest {
  snapshotVersion: string; createdAt: string; tool: string;
  queries: { url: string; httpStatus: number; contentType: string; bytes: number; sha256: string; retrievedAt: string }[];
  records: SourceRecord[]; events: NormalizedEvent[];
}
```

Normalizer rules: reject non-array or HTML bodies; `[]` is a valid response but an invalid committed snapshot and never
triggers an invented event; `linkedEvents: null` becomes `[]`; nullable `kp_*` and empty `cmeInputs` tolerated; when two
analyses are both `isMostAccurate`, take the latest `time21_5` and record that rule in TRANSFORMS.md; times must match
`YYYY-MM-DDTHH:MMZ`; unknown event types fail; `sentNotifications` stripped; schema is strict.

Failure modes to test with fixtures (acquisition script only; the app has no runtime network): timeout, 429, 5xx,
HTML error page, `[]`, malformed JSON, missing date/unit/id, upstream record revised (versionId change).
In browser QA these API flows are recorded as "not applicable: no runtime network", not as passed.

## 6. Acquisition steps for M03 (owner terminal, 30-minute cap)

1. `node scripts/data/fetch-donki.mjs` fetches the bounded single-day queries above with a 20 s timeout, writes raw bodies to ignored `.agent-bus/evidence/data/`, and prints status, content-type, bytes and sha256.
2. `node scripts/data/validate-snapshot.mjs` normalizes and writes `src/data/donki-snapshot.json` + `src/data/sources.json`.
3. OSD-476: fetch once, store title, organism, substrates, DOI and record URL as a `reference` SourceRecord. No effect sizes.
4. CSA: store the toolkit URL and credit line as an `educational-resource` record.
5. If DONKI is unreachable inside the cap: record BLOCKED in STATUS, do not invent data, and do not ship timeline numbers.
