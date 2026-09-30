# BUILD PROMPT — 🐐 The Church of Goat (Cribl App)

> **Status (2026-09-30):** implemented as v1.0.0. See `docs/CHURCH_OF_GOAT_DESIGN.md` §17 for what was built and the deviations from this prompt.

You are implementing **The Church of Goat**, a Cribl App for the Cribl App Platform, in the existing repo `armogoat/`. It's a hackathon entry for "most weird application": a ~3.5-minute linear, interactive, absurd occult story that is **powered by real Cribl APIs and the real Cribl pipeline engine underneath**.

## 0. Read first (mandatory, in this order)
1. `AGENTS.md` and `CLAUDE.md`: Cribl App Platform rules (iframe, fetch proxy, KV, policies, theming, destructive-op confirmation). **These are binding.**
2. `docs/CHURCH_OF_GOAT_DESIGN.md`: the normative spec. §4 holds the screen copy and behavior, §5 the exact API bodies, §9 safety, §10 assets. If this prompt and the dossier conflict, **this prompt wins**.
3. Capra docs: `https://capra.cribl.io/llms.txt` → Page Templates → **Overview**, plus the Usage pages for `Card`, `Text`, `Button`, `Drawer`, `Modal`, `Alert`, `Pill`, `Spinner`, `Skeleton`, `EmptyState`, `Tooltip`. Don't guess Capra props; read the Usage pages.
4. `openapi.json` (Cribl API v4.20.1): look up request/response schemas for every endpoint you call, especially `POST /preview` and `components.schemas.FunctionConfSchema{Drop,Mask,Eval,Sampling,Rename,Comment}`.

## 1. Hard constraints
- **Judges install this from a public GitHub repo onto their own Cribl tenants, which we have never seen.** They could be empty, have no Workers, run an older version, or give the judge a restricted role. The app must **always complete the ritual and never show a broken state**. Implement capability detection exactly as dossier §2.4, and treat "no data" as a story beat (the STARVING GOAT), not an error. We build and record on our own Cribl trial org.
- **Keep** `package.json` `name: "armogoat"` (it's the app id). Set `displayName: "The Church of Goat"`, `author: "Arno & Moise"`, `tags.product: ["stream","search"]`.
- All Cribl calls go through `fetch(window.CRIBL_API_URL + path)`. Never handle auth. Never define or polyfill `CRIBL_API_URL`, `CRIBL_BASE_PATH` or `getCriblUser`.
- **Never** use `localStorage`, `sessionStorage`, `IndexedDB` or cookies. Persistence goes only in app KV (`CRIBL_API_URL + '/kvstore/church/...'`).
- **No external network calls.** Bundle fonts (`@fontsource/cinzel-decorative`, `@fontsource/jetbrains-mono`) and audio (`public/assets/audio/`). Leave `config/proxies.yml` with no active entries.
- **LIVE mode must be incapable of mutating Cribl config.** Implement a single `criblFetch()` wrapper that throws on any non-GET request unless the path matches the allowlist: `/m/*/preview`, `/m/*/system/metrics/query`, `/system/metrics/query`, `/system/metrics/enum`, `/kvstore/church/*`, `/m/default_search/search/jobs*`, `/m/*/system/capture` (only if the capture toggle is on), and `/m/goat_sandbox/pipelines*` (only if Sandbox mode is on).
- **Sandbox mode is compiled out of the release.** Guard all sandbox code with `import.meta.env.VITE_SANDBOX === 'true'` (default false) so tree-shaking removes it, and keep the sandbox policies commented in `config/policies.yml`. Only our own video build sets it.
- Every volatile operation (any `DELETE`; creating the sandbox pipeline; resetting the Book of Offerings) requires an explicit click **and** a Capra `Modal` naming the exact resource and action, with a "cannot be undone" warning where true. Report success or failure afterwards. Never trigger one on load or on a timer.
- Theme: install the existing `installThemeBridge` (already in `src/main.tsx`) and pass `onTheme` into React state. The app must look correct in **both** Cribl themes. Capra components use `token()` only. The ritual art layer uses its own CSS custom properties scoped under `.ritual`, with a **holy** (light theme) and **demonic** (dark theme) set.
- Use Capra for all "real Cribl" surfaces: Façade, Incident Response, Scripture drawer, Settings drawer, modals, report, reveal. The ritual story screens are a deliberate custom full-bleed art canvas.
- Add dependencies only from this list: `motion`, `canvas-confetti` (+ `@types/canvas-confetti`), `@fontsource/cinzel-decorative`, `@fontsource/jetbrains-mono`, `vitest` (dev). Anything else needs a written reason.
- Respect `prefers-reduced-motion`: disable particles, shake and parallax, keep cuts and fades.
- Projection legibility: headline ≥ 7vw (clamp), button labels ≥ 3vw, key numbers ≥ 5vw, ≤ 8 words of body text per ritual screen, one primary action per screen.

## 2. File layout to create
```
src/
  main.tsx                       (keep; add font imports)
  App.tsx                        → renders <RitualStage/>   (delete the old pasture code and its CSS)
  ritual/
    RitualStage.tsx              scene machine, HUD, hotkeys, sound unlock
    story.ts                     ALL on-screen copy, keyed by scene (single source of text)
    scenes/
      S00Facade.tsx  S01Invitation.tsx  S02Prophecy.tsx  S03Sacrifice.tsx
      S04Revelation.tsx  S05Incident.tsx  S06Builders.tsx  S07Priestess.tsx
      S08Exorcism.tsx  S09Possession.tsx  S10FinalButton.tsx  S11Awakening.tsx
      S12Report.tsx  S13Reveal.tsx
    hud/  CandleRail.tsx  DataSigil.tsx  ScriptureDrawer.tsx  SettingsDrawer.tsx  MuteButton.tsx
    goat/ Goat.tsx  goatStates.ts
    fx/   Particles.tsx  TelemetryRiver.tsx  Glitch.tsx  Crack.tsx  confetti.ts  sound.ts  SplitFlap.tsx
    characters/ characters.ts  TarotCard.tsx  fallbacks.tsx (SVG silhouettes)
    ritual.css                   ritual palette (holy/demonic), keyframes, layout
  cribl/
    client.ts        criblFetch(), allowlist, 6 s AbortController timeout, Scripture log store, demo switch
    capabilities.ts  detectCapabilities(): parallel probes per dossier §2.4 → Capabilities (group, preview context, metrics ok/empty, search, kv, per-endpoint 403s)
    census.ts        groups, pipelines, routes, input/output status → Census
    metrics.ts       totals(24h), series(60m/1m), enum probe
    exorcism.ts      demon event generator, EXORCISM_PIPELINE, GOATIFY_PIPELINE, runPreview(), localEmulate()
    kv.ts            Book of Offerings read/modify/write
    search.ts        optional Heresy Scrolls
    fixtures.ts      realistic demo data for every call above
    types.ts
  state/ritualStore.ts           useReducer + context
  test/                          vitest: exorcism generator, % math, localEmulate parity, allowlist
public/assets/characters/        arno.webp moise.webp ceo.webp priestess.webp  (placeholders OK)
public/assets/goat/              (optional official mascot svg)
public/assets/audio/             scream bleat choir rumble glitch lullaby thud (.mp3)
config/policies.yml              exactly as in dossier §8.2 (optional blocks commented)
README.md                        replace with dossier §13.1
JUDGES.md                        dossier §13.2
LICENSE                          Apache-2.0
docs/media/                      hero.gif + screenshots (captured after the build)
release/                         armogoat-<version>.tgz (copied from `npm run package` output)
```

## 3. Core contracts
```ts
// state
type SceneId = 'facade'|'invitation'|'prophecy'|'sacrifice'|'revelation'|'incident'|'builders'
             |'priestess'|'exorcism'|'possession'|'final'|'awakening'|'report'|'reveal';
type GoatState = 'NORMAL'|'CURIOUS'|'ANGRY'|'POSSESSED'|'HOLY'|'SUPREME';
interface Sourced<T> { value: T; simulated: boolean; error?: string }
interface RitualState {
  scene: number; mode: 'live'|'demo'; theme: 'light'|'dark'; muted: boolean;
  judge: Sourced<{ firstName?: string; username: string }>;
  group: Sourced<string>;
  census: Sourced<Census>;            // pipelines[], routes[], sources[{id,type,health}], destinations[{id,type,health}]
  totals: Sourced<{ events: number; bytes: number; dropped: number }>;
  series: Sourced<number[]>;          // 60 × 1-min event counts
  sacrifice?: 'ceo'|'pipeline'|'logs';
  exorcism?: Sourced<PreviewResult>;  // items, stats.functions, derived: purified, resisted[], bytesReducedPct
  goatified?: Sourced<Array<{ kind: string; mortal: string; goat: string }>>;
  book: Sourced<BookOfOfferings>;     // believers, sacrifices{}, finalFirst{}, soulNumber
  finalFirstChoice?: 'calm'|'run'|'summon';
}
// scripture log entry
interface ScriptureEntry { t: number; method: string; path: string; status: number|'ERR'|'BLOCKED'; ms: number; body?: unknown; preview?: string }
```
- Mode is `demo` if the URL has `?demo` (dev only), if **Settings → "Perform from memory"** is on, or if `GET /products/stream/groups` fails at startup. Otherwise `live`. The `D` hotkey toggles demo. Don't rely on query strings in the installed app; the Settings toggle is the judge-facing switch.
- `RitualState` also holds `capabilities: Capabilities` from `detectCapabilities()`, which runs during the Façade. Every scene chooses real / degraded / simulated from it, and Scripture lists each probe result in plain language (e.g. "No traffic in the last 24 h — the Goat is starving").
- **Empty tenant:** when `totals.events === 0`, the sacrifice scene plays the STARVING GOAT beat (dossier §4 Rite 3 fallback), and the offering counter shows the events processed by `/preview` during this session, still 🟢. When there are no pipelines or destinations, goatify Cribl's shipped defaults (`main`, `passthru`, `devnull`) labeled "(Cribl defaults)".
- Every UI element that displays a Cribl-derived number wraps it in `<Live value={Sourced<…>}>`. That component renders a tiny 🟢 or 🟡 dot, with a Tooltip showing the endpoint or "simulated".
- `Production Systems Destroyed` / `Config mutations` = the count of Scripture entries with a method ≠ GET whose path isn't in `{preview, metrics, kvstore, search, capture}`. **Compute it; don't hardcode 0.**

## 4. Scene requirements (copy lives in `story.ts`; see dossier §4 for full detail)
| Scene | Must do | Real data |
|---|---|---|
| facade | Capra Overview grid (12 col, `token('spacing.lg')` gap), 4 KPI Cards; at 2.5 s a goat eye opens, crack draws, shatter at 3.5 s; click skips | totals, census counts |
| invitation | "DO YOU BELIEVE IN THE GOAT?", two identical YES buttons, "There is no other option.", whisper "WE HAVE BEEN EXPECTING YOU, {NAME}.", tooltip in the NO gap "NO was sacrificed in v0.0.1."; on click unlock audio, increment believers, flash "You are soul #N" | getCriblUser, KV |
| prophecy | auto 2 s "🐐 THE GOAT HAS SPOKEN" → "A DEMON HAS INFECTED YOUR TELEMETRY." → "AN OFFERING IS REQUIRED." + 3 tarot cards (IV CEO, VII PIPELINE labeled with a real pipeline id, IX 1 GB OF LOGS) | census, KV |
| sacrifice | huge red SACRIFICE; card burns; TelemetryRiver into the Goat, rate ∝ series; count-up to totals.events "OFFERINGS RECEIVED" + "GOAT FUEL x.x GB"; sparkline; Goat → HOLY; "THE GOAT IS PLEASED." | metrics |
| revelation | "WAIT." → "THE {SACRIFICE} WAS NOT THE DEMON." → glitch "THE DEMON IS INSIDE CRIBL."; 3 stacked panels normal → corrupted → demonic built from real source ids | census |
| incident | red siren bar "🚨 DEMONIC TELEMETRY INCIDENT — SEV-0 (GOAT)", KPI Cards OFFERINGS / GOAT FUEL / SACRED PIPELINES / HOLY DESTINATIONS, HERESY card (unhealthy + dropped; 0 → "No heresy detected. Suspicious."), SACRED ROUTING mini-graph sources → routes → pipelines → destinations, sources table | all census + metrics |
| builders | tarot cards I ARNO THE ARCHITECT, XIII MOISE THE FORBIDDEN ENGINEER drop with a thud; 4 dialogue bubbles (1.6 s each, the "…" holds 2.5 s); "THE BUILDERS MUST PERFORM THE EXORCISM."; Moise's card slides away | — |
| priestess | card II HIGH PRIESTESS OF TELEMETRY rises; pipeline diagram DEMON → BANISH(drop) → SEAL(mask) → ANOINT(eval) → TITHE(sampling) → CLEAN | — |
| exorcism | PERFORM EXORCISM → call `runPreview(EXORCISM_PIPELINE, demonEvents)`; progress beats 13/27/42/69/97 over ≥ 4 s; nodes light with real eventsIn → eventsOut; "HERESY REMOVED: N % OF BYTES"; at 97 % shake + oversized Alert "ERROR: THE GOAT RESISTED." + render the resisted goat events as JSON with the filter caption; Goat ANGRY → POSSESSED | /preview |
| possession | Goat → SUPREME; "YOU SHOULD NOT HAVE SUMMONED ME." letter by letter; `runPreview(GOATIFY_PIPELINE, realNames)`; SplitFlap before → after for up to 3 pipelines, 3 destinations, 1 event; stamp "PREVIEW ONLY — NOTHING WAS SAVED" | /preview |
| final | 🧘 CALM (lullaby, Goat dozes, snaps awake, button becomes SUMMON), 🏃 RUN (flees the pointer 5×, then becomes SUMMON), 🐐 SUMMON (enormous, golden, pulsing); record first choice | KV |
| awakening | zoom through the Goat's eye; confetti; scream + choir; "🐐 THE GOAT HAS AWAKENED" → "EMOTIONAL OBSERVABILITY ACHIEVED™" | — |
| report | formal report table exactly as dossier §4 Rite 12; wax seal; "🐐 GOAT: SATISFIED"; "NO PRODUCTION SYSTEMS WERE HARMED."; buttons VIEW THE SCRIPTURE / BEGIN AGAIN | everything |
| reveal | Capra Card "What the Goat actually did.": API call count, functions executed, events processed by the engine, config mutations, KV writes, endpoint checklist, platform features used | Scripture |

HUD (from invitation onward): CandleRail (12 candles + "RITE IV OF XII"), DataSigil (`🟢 LIVE CRIBL · {group}` / `🟡 SIMULATED`), 📜 Scripture button, mute. Hotkeys: `→`/`Space` next (only where the scene allows), `←` back, `R` restart, `S` scripture, `M` mute, `D` demo, `A` autoplay (auto-press the primary action after 4 s of idle on every scene).

## 5. Cribl calls: exact behavior
- **Group selection:** `GET /products/stream/groups` → prefer the Settings choice (session state), else `default`, else the first item. Never use `default_search` for Stream calls.
- **Census:** `Promise.allSettled` of `GET /m/{g}/pipelines`, `/m/{g}/routes`, `/m/{g}/system/status/inputs?type=true`, `/m/{g}/system/status/outputs`. Health = worst-of `status.health` and `healthCounts` (reuse the logic in the current `App.tsx` `healthOf`).
- **Metrics:** bodies from dossier §5.2. Try `/m/{g}/system/metrics/query`, then fall back to `/system/metrics/query`. Parse `results[0].events|bytes|dropped` for totals and `results[].events` for the series.
- **Exorcism:** body from dossier §5.3 (40 events: 3 `species:'goat'`, ~6 `heresy_level ≥ 9000`, ~10 `level:'debug'`, the rest human; `_raw` uses real source ids and sourcetypes). Derive:
  - `purified` = items with `purified === true`;
  - `resisted` = items with `species === 'goat'`;
  - `bytesReducedPct` = `round(100 × (1 − lastFn.bytesOut / firstFn.bytesIn))` over `stats.functions` (skip `comment`).
  - `localEmulate()` must reproduce the same logic in TS for fallback. Test the two for parity on fixtures.
- **Goatify:** body from dossier §5.4 over ≤ 12 real names.
- **Preview limits:** ≤ 50 events, `timeout: 5000`, `memory: 256`, never more than one in flight, only on explicit clicks.
- **KV:** `GET /kvstore/church/stats` (a 404 means empty), mutate, `PUT` the JSON. Concurrency: last-writer-wins, acceptable.
- **Search (optional, Settings toggle "Heresy Scrolls", default on in live):** create job → poll status every 1 s up to 8 s → results → 5 scrolls on the incident screen. On any failure, hide it silently.
- **Capture (optional, Settings toggle, default OFF):** `POST /m/{g}/system/capture {filter:'true',maxEvents:20,duration:3,level:0}`, parse NDJSON, use the events as exorcism input with `_raw` visually blurred. Uncomment the capture policy only if you ship this.
- **Sandbox (optional, Settings toggle, default OFF, requires uncommented sandbox policies):** in the report, the button "INSTALL THE EXORCISM PIPELINE IN goat_sandbox":
  1. `GET /m/goat_sandbox/pipelines/goat_exorcism` (404 → free, else suffix `_2`, `_3`…);
  2. Modal confirmation naming the id and group;
  3. `POST /m/goat_sandbox/pipelines {id, conf}`;
  4. store the id in KV `church/created`;
  5. show a link `target="_top"` to the pipeline in Stream.

  "Banish" in Settings DELETEs only the ids in `church/created`, after a confirmation modal.

## 6. The Goat (`goat/Goat.tsx`)
One inline SVG, `viewBox 0 0 512 512`, with named `<g>` layers: `body, head, horns, eyes, pupils, mouth, halo, crown, extraEyes, aura, flames, rings`. Props: `state: GoatState`, `lookAt?: {x,y}`, `size`. Implement the state table in dossier §10.4 with `motion` variants (state changes cross-fade and morph over 400–900 ms). CURIOUS tracks the pointer with its head tilt and pupils. A lip "chew" loop plays when idle. If `public/assets/goat/cribl-goat.svg` exists and `characters.ts` sets `goat.useOfficial = true`, render it as the body/head layer and keep eyes, horns, halo and aura as overlays.

## 7. Characters (`characters/characters.ts`)
Implement exactly the config in dossier §10.1. Consent has been obtained from all four people, so every entry ships with `consent: true`. `TarotCard` renders: gold art-nouveau frame (SVG), roman numeral top, image or fallback SVG silhouette, title banner bottom. **If `consent === false` or the image fails to load (`onError`), render the fallback**, so no broken image ever appears. Names, titles and images must be swappable by editing only this file and dropping files in `public/assets/characters/`.

## 8. Sound (`fx/sound.ts`)
WebAudio buffer bus. Unlock it on the first user click (the invitation YES). Cues: rumble (facade crack), thud (cards), bleat (goat state change), glitch (revelation, possession), choir (holy, awakening), scream (exorcism failure, awakening), lullaby (calm). `M` toggles mute. A missing file is a silent no-op.

## 9. Acceptance criteria
1. `npm run build` passes (`tsc -b`, vite, `apps build`); `npm run lint` is clean; `npx vitest run` passes.
2. `npm run dev` with `?demo` runs the entire story offline end to end, and every data element shows 🟡.
3. In a live tenant, the exorcism's per-node numbers match the Scripture's `/preview` response exactly, and the report shows `Config mutations: 0`.
4. The whole story completes in ≤ 4:00 by clicking only the primary actions. With `A` autoplay it completes unattended.
5. Every ritual screen has exactly one visually dominant primary action (or auto-advances) and ≤ 8 words of body text.
6. Toggling the Cribl theme mid-story recolors the ritual (holy vs demonic) and all Capra surfaces with no unreadable text.
7. No usage of browser storage; no external requests (check the Network tab); `criblFetch` blocks a test `PATCH` in live mode and logs it as `BLOCKED` in Scripture.
8. `README.md` is replaced with dossier §13.1, `JUDGES.md` exists per §13.2, and `LICENSE` is present. `config/policies.yml` matches dossier §8.2 with the sandbox and capture blocks commented.
9. Readable at 1280×720 from 3 m: headline and number minimum sizes hold.
10. **Clean-room test** (dossier §12.3): installing the release `.tgz` on an empty trial org, as a non-admin user the app is shared with, completes the ritual with no errors. The STARVING GOAT beat appears, the exorcism is 🟢 if `/preview` is reachable, and every 🟡 has a reason in Scripture.
11. Simulated probe failures (force each endpoint to 403, timeout, or empty in a unit or integration test) each degrade only their own panel.
12. The release build contains no sandbox code (grep `dist/` for `goat_sandbox` returns nothing) and no tenant URLs, org ids or secrets anywhere in the repo.

## 11. Submission deliverables (after acceptance passes)
- `npm run package` → copy the `.tgz` to `tgz/` → GitHub Release `v1.0.0` with the `.tgz` attached and the 3 install steps in the notes.
- Record `docs/media/hero.gif` (≤ 8 MB, the Façade crack → "DO YOU BELIEVE IN THE GOAT?"), plus screenshots of the exorcism with Scripture open and of the report.
- Fill in `<VERSION>` (the Cribl version of our trial tenant), `<REPO_URL>` and `<VIDEO_URL>` placeholders in README and JUDGES.
- Video: follow the shot list in dossier §12.6.

## 10. Build order
Follow dossier §11 steps 0–9. **Do step 0 (the tenant probe) before writing the preview or metrics code**, and adjust the request bodies to what the engine actually accepts, recording any deviations in `docs/CHURCH_OF_GOAT_DESIGN.md` §5. Stretch items (dossier §11 step 10) come only after all acceptance criteria pass.
