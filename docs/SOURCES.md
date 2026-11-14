# Inspected references and evidence boundaries

Guides/local-event research was inspected earlier November 13-14; new tooling/API documentation was checked November 14, 2026. This is a documentation/source register, not proof of functioning app integrations.

- User-provided AI-native builder workflow reel breakdown: retained the bounded PRD/research/fresh evaluator/test-repair loop; removed obligatory repetitive interviewing and unsupported throughput promises. Third-party plugin installation claims were not newly audited.
- Actual L.E.O. local workflow and local-only agent-bus protocol: read-only inspection; no reusable executable bridge found, no private bus/history copied. Its existing scheduled reviewer was inspected but not altered.
- NASA Project Submission Guide: https://www.spaceappschallenge.org/resources/project-submission-guide/ . Required fields, public links, demo limits, AI indicators, source attribution and deadline verified in browser earlier this session and in supplied text.
- NASA Judging & Awards Guide: https://www.spaceappschallenge.org/resources/judging-awards-guide/ . Impact, Creativity, Validity, Relevance and Presentation; no claim this plan has scored well or will win.
- Sonoma/Rohnert Park schedule: https://www.spaceappschallenge.org/2026/local-events/rohnert-park/?tab=schedule . Doors 08:30 both days; Saturday orientation 09:15 and first work session 10:00; Sunday presentations 15:00. Local instructions at kickoff take precedence for local operations.
- DONKI current docs and OpenAPI: https://ccmc.gsfc.nasa.gov/DONKI/api/ and https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/ . Full 55KB documentation response preserved in docs/reference/. Parsed actual server and FLR/SEP operations. Both documented operations permit maximum 60-day windows. No gameplay dataset was collected.
- NASA key/rate-limit docs: https://api.nasa.gov/assets/html/authentication.html . The limits refer to api.nasa.gov, not all NASA services.
- OSDR Developer API result: https://www.nasa.gov/reference/osdr-developer-api/ . Direct fetch returned 404; canonical live endpoint must be re-resolved. Search snippets are not enough for an implemented connector.
- RadLab docs: https://visualization.osdr.nasa.gov/radlab/gui/data-api . Indexed official description exists, direct fetch returned 500. Treat as unresolved, not integrated.
- CSA food toolkit: https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production . Curated educational content, no machine API established.
- Claude subagent docs: https://code.claude.com/docs/en/sub-agents . Custom file definitions and read-only boundaries verified from current docs; actual local CLI/model not exercised.
- Claude setup: https://code.claude.com/docs/en/quickstart . Official optional installation; not executed.
- Cursor rules: https://cursor.com/docs/rules . Project rules use .mdc; plain .md under .cursor/rules is not the native format. This kit uses .mdc and a canonical AGENTS.md.
- Codex instructions: https://developers.openai.com/codex/agent-configuration/agents-md . AGENTS.md is native guidance, not a sandbox.
- Codex noninteractive: https://developers.openai.com/codex/noninteractive . codex exec supports read-only sandbox, stdin and output file. Deprecated --full-auto is not used. No CLI invocation or login occurred here.
- R3F performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance and https://r3f.docs.pmnd.rs/advanced/pitfalls . On-demand rendering, instancing and adaptive effects inform the plan; no device performance has been measured.

## Checked in the planning pass, 2026-11-14 (through an AI web-fetch tool; not raw-byte evidence)
- DONKI direct FLR, SEP, CME and WSAEnlilSimulations responses for 8-14 May 2024. No gameplay snapshot collected yet.
- api.nasa.gov DONKI mirror: SEP call returned data with DEMO_KEY; one FLR call failed.
- OSDR Biological Data API v2 spec and dataset OSD-476 (Arabidopsis in Apollo regolith, ground study).
- RadLab data API docs page loaded; data endpoint returned server errors. Not integrated.
- Moon Trek WMTS capabilities for LRO LOLA south-pole shaded relief. Terms unverified.
- CSA terms of use: https://www.asc-csa.gc.ca/eng/terms.asp .
- NASA Image and Video Library search endpoint. Optional, per-item credit check required.
- npm registry versions for the planned dependency set. Not installed.
Full URLs and limits: docs/refinements/NASA_DATA_PLAN.md.
