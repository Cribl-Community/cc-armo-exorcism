# 🐐 The Church of Goat

The Church of Goat is an interactive Cribl telemetry purification experience.

<!-- ![The Goat awakens](docs/media/hero.gif) -->

▶ **Watch the ritual (3 min):** `<VIDEO_URL>` · **Under the hood (1 min):** `<VIDEO_URL_2>`

## Summary

We wanted to explore what happens when observability meets an ancient Goat deity.

## How To Use

Follow the ritual.

## What This App Does

Funny on the surface, real Cribl underneath.

* The exorcism is a real Cribl pipeline (Drop, Mask, Eval, Sampling), executed by your Cribl engine in **pipeline preview** over events seeded from your own Sources. Nothing is saved.
* The Goat possesses your real pipeline and destination names through the same engine (`main` → `GOAT_MAIN_RITUAL`). Preview only, nothing is renamed.
* Offerings, Goat Fuel, Heresy and Sacred Routing come from your environment's metrics, status and routes.
* Numbers marked 🟢 are live, and 🟡 means simulated. The 📜 **Scripture** drawer lists every API call the Goat made.

## Before You Install

Everything destructive-looking is safely simulated or isolated. The app cannot create, change or delete Cribl configuration: it only declares read, metrics, preview and search permissions, and the incident report *counts* the configuration changes it made (always 0).

It works on any tenant, including an empty one. If there is no traffic, the Goat starves.

Tested on Cribl `<VERSION>` (Cribl.Cloud).

## Installation

1. Download `armogoat-<version>.tgz` from Releases (or the `release/` folder).
2. In Cribl: **Apps → Import from file**, upload, and install.
3. Open **The Church of Goat**. Turn the sound on. Fullscreen is recommended.

Users who are not admins need the app shared with them.

## Permissions

### Cribl API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/system/info` | Cribl version and Leader messages (Heresy) |
| GET | `/api/v1/products/stream/groups` | Find the Worker Group to possess |
| GET | `/api/v1/m/{group}/pipelines`, `/routes` | Sacred Pipelines, Sacred Routing |
| GET | `/api/v1/m/{group}/system/status/inputs`, `/outputs` | Altars, Holy Destinations, Heresy |
| POST | `/api/v1/system/metrics/query` | Offerings, Goat Fuel and source health (read-only query) |
| POST | `/api/v1/m/{group}/preview` | The exorcism (preview only; nothing is saved) |
| POST/GET | `/api/v1/m/default_search/search/jobs` | Heresy Scrolls (optional, Cribl.Cloud) |
| GET/PUT/DELETE | `/api/v1/kvstore/church/book` | The Book of Offerings (app KV; DELETE only from Settings, after confirmation) |

If a call is denied or unavailable, that panel falls back to simulated data and the ritual continues.

## External API Access

None. Fonts and sounds are bundled or synthesized in the browser.

## Data And Storage

One app-scoped KV key, `church/book`, holds anonymous ritual counters (believers, sacrifice choices, how judges faced the Goat). It stores no log content and no user data. It can be reset from **Settings → Burn the Book**.

## Support

### Community Built

Built by Arno & Moise for the Cribl Hackathon. Issues: `<REPO_URL>/issues`

## Known Limitations

* A pipeline preview takes about 8–10 s on Cribl.Cloud. The ritual starts it early, so the wait usually happens off-screen.
* Panels show 🟡 simulated data when the judge's role lacks access, the group has no Workers, or there is no traffic. The ritual always completes.

## Development

```bash
npm install
npm run dev      # live preview inside Cribl via the Apps dev connection
npm test         # unit tests (includes a golden test against real engine output)
npm run package  # builds the .tgz
```

See `docs/CHURCH_OF_GOAT_DESIGN.md` for the architecture, the real-vs-simulated map and the safety model.

## App Metadata

| Field | Value |
|---|---|
| App Name | The Church of Goat |
| App ID | armogoat |
| Version | 1.0.0 |
| Author | Arno & Moise |
| Support Model | community-built |
| Support Label | Community Built |
| Support Contact | `<REPO_URL>/issues` |
| License | Apache-2.0 |
| License File | [Apache License 2.0](./LICENSE) |
| Product Tags | stream, search |
| Category | Observability (Occult) |
| Audience | end-user |
| Availability | preview |
| Requires External Access | no |
| Repository | `<REPO_URL>` |
| Documentation | docs/CHURCH_OF_GOAT_DESIGN.md |
| README Schema Version | 1.0 |

No production systems were harmed.
