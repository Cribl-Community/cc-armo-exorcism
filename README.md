# 🐐 The Church of Goat

The Church of Goat is an interactive Cribl telemetry purification experience: a 12-rite, 3½-minute ritual in which an ancient Goat possesses your Cribl, and a High Priestess tries to exorcise it.

## Summary

We wanted to explore what happens when observability meets an ancient Goat deity. It's funny on the surface, with real Cribl underneath:

* **The exorcism is a real Cribl pipeline** (Drop → Mask → Eval → Sampling), run by your engine in **pipeline preview**. Nothing is saved, and the per-stage counts and byte reduction on screen are the engine's actual output.
* **The Goat renames your real pipelines and destinations** (`main` → `GOAT_MAIN_RITUAL`) through the same preview. Nothing is renamed.
* **Offerings, Goat Fuel, Heresy and Sacred Routing** come from your metrics, source/destination health and routes. 🟢 means live data and 🟡 means simulated.
* The **📜 Scripture** drawer lists every API call the app made.

## How To Use

Follow the ritual. There is one big button per screen. Turn the sound on, and use fullscreen if you can.

Hotkeys: `→` next · `S` Scripture · `M` mute · `R` restart · `A` autoplay.

## Installation

1. Download `release/armogoat-1.0.0.tgz` from this repository.
2. In Cribl: **Apps → Import from file**, upload the file, review the permissions and install.
3. Open **The Church of Goat**. Users who are not admins need the app shared with them.

Tested on Cribl 4.20.1 (Cribl.Cloud). The app works on any tenant, including an empty one. Panels it can't read fall back to simulated data, and the ritual always completes. **⚙ Settings → Perform from memory** runs it fully simulated.

## Permissions

The app **cannot create, change or delete Cribl configuration**. It only declares read, metrics, preview and search access (`config/policies.yml`), and its API client refuses anything outside that allowlist. The final incident report *counts* the configuration changes it made, and the count is always 0.

### Cribl API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/system/info` | Cribl version and Leader messages (Heresy) |
| GET | `/api/v1/products/stream/groups` | Find the Worker Group |
| GET | `/api/v1/m/{group}/pipelines` | Count and name pipelines |
| GET | `/api/v1/m/{group}/routes` | Show routing |
| GET | `/api/v1/m/{group}/system/status/inputs` | Source health |
| GET | `/api/v1/m/{group}/system/status/outputs` | Destination health |
| POST | `/api/v1/system/metrics/query` | Event and byte totals, source health metric (read-only query) |
| POST | `/api/v1/m/{group}/preview` (or `/api/v1/preview`) | The exorcism: inline events through an inline pipeline; not persisted |
| POST / GET | `/api/v1/m/default_search/search/jobs` (+ `/{id}/status`, `/{id}/results`) | Optional, Cribl.Cloud: five recent errors from `cribl_internal_logs` |
| GET / PUT / DELETE | `/api/v1/kvstore/church/book` | App-scoped KV (granted automatically). DELETE only via Settings → Burn the Book, after confirmation |

## External API Access

**None.** `config/proxies.yml` declares no domains. Fonts, images and sounds are bundled with the app. The Goat's voice in the finale uses the browser's built-in speech synthesis, which prefers on-device voices.

## Data And Storage

One app KV key, `church/book`, holds anonymous ritual counters (believers, sacrifice choices). It stores no log content and no user data.

## Support

### Community Built

Built by Arno & Moïse for the Cribl Hackathon. Issues: https://github.com/Cribl-Community/cc-armo-exorcism/issues

## Development

```bash
npm install
npm run dev      # live preview inside Cribl via the Apps dev connection
npm test
npm run package  # writes build/armogoat-<version>.tgz
```

Design notes, the real-vs-simulated map and the safety model are in `docs/`. The sound clips are used under a licence obtained by the authors (sources in `docs/SOUNDTRACK.md`).

## License

Apache License 2.0. See [LICENSE](./LICENSE).

## App Metadata

| Field | Value |
|---|---|
| App Name | The Church of Goat |
| App ID | armogoat |
| Version | 1.0.0 |
| Author | Arno & Moïse |
| Support Model | community-built |
| Support Label | Community Built |
| Support Contact | https://github.com/Cribl-Community/cc-armo-exorcism/issues |
| License | Apache-2.0 |
| License File | [Apache License 2.0](./LICENSE) |
| Product Tags | stream, search |
| Category | Observability (Occult) |
| Audience | end-user |
| Availability | preview |
| Requires External Access | no |
| Repository | https://github.com/Cribl-Community/cc-armo-exorcism |
| README Schema Version | 1.0 |

No production systems were harmed.
