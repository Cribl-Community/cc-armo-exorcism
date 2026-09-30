# 🐐 THE CHURCH OF GOAT — Design Dossier

*An Interactive Cribl Telemetry Purification Experience*

> **Sources of truth used for this dossier**
> - `AGENTS.md` in this repo — the Cribl App Platform developer guide (`@cribl/apps` 1.2.0): iframe sandbox, fetch proxy, KV store, `policies.yml`, `proxies.yml`, backend endpoints, schedules, theming, packaging.
> - `openapi.json` in this repo — Cribl API Reference **v4.20.1** (677 paths).
> - Capra design system — `https://capra.cribl.io/llms.txt` → Page Templates (Overview, Navigation).
> - docs.cribl.io could not be fetched from this machine (HTTP 403; the web tools were also unavailable). Everything below is grounded in the repo-local spec and the platform guide. Items marked **⚠ VERIFY** have to be confirmed against a live tenant during build (step 0 of the implementation plan does exactly that).

### Where the requested A–L items live

| Item | Section |
|---|---|
| A. Recommended Cribl architecture | §2 |
| B. Required Cribl components | §2.2 |
| C. Required APIs | §8 |
| D. Required permissions | §8.2, §9 |
| E. Data flow | §5 |
| F. UI architecture | §2.3 |
| G. Asset requirements | §10 |
| H. Demo environment requirements | §12.1 |
| I. Safety / isolation strategy | §9 |
| J. Exact implementation plan | §11 |
| K. Risks / limitations | §15 |
| L. Real vs. simulated | §6, §7 |
| Critical review | §0 |
| Unknown judge environments | §2.4 |
| Submission package (GitHub, judges guide, video) | §12 |

### Decisions (confirmed 2026-09-29)

| # | Decision | Consequence in this dossier |
|---|---|---|
| D1 | The ritual art layer is a **deliberate exception** to Capra page templates and token-only styling | §2.3: Capra is kept for every real-data surface; the ritual layer has its own holy/demonic palette |
| D2 | **Consent obtained** from every real person depicted (Arno, Moise, the CEO, the High Priestess) | §10.1: `consent: true` for all four; the consent gate stays so any card can be switched off in one line |
| D3 | We build on a **Cribl trial license**. Judges install from a **GitHub repo** on **their own, unknown Cribl environments**. We can ship README docs and videos | New §2.4 (the app must adapt to any tenant, including empty ones); §12 rewritten as a submission package (repo + release `.tgz` + `JUDGES.md` + demo video); sandbox writes are **never** in the shipped build |

---

## 0. Critical review of the original concept (and the fixes)

I tested the brief against its own four questions.

**1. "Would a Cribl engineer immediately see real Cribl tech under the joke?"**
*Original: not reliably.* A fake progress bar and renamed labels look like a website with Cribl words in it.
**Fixes:**
- **The exorcism really runs on the Cribl engine.** `POST /m/{group}/preview` accepts an **inline `pipelineConf` plus inline `events`**. Nothing gets saved, and the response includes **per-function `eventsIn/eventsOut/bytesIn/bytesOut`**. So the exorcism pipeline on screen is a real Cribl pipeline (Drop, Mask, Eval, Sampling), and every number next to each stage comes from the engine.
- **"The Goat resisted" comes from a real filter too.** The purification functions carry the filter `species !== 'goat'`, so goat events come out of the engine unpurified. The story beat is simply what the engine returned.
- **"Heresy removed: 41 %" is real data reduction**, computed from `bytesIn` and `bytesOut`. That's Cribl's core value proposition wearing a robe.
- **The Scripture drawer (📜):** a corner button, always visible, opens a Capra `Drawer` that logs every real API call as it happens (method, path, status, latency, trimmed response). It's the "look under the hood" proof, one click away and never in the way.
- **Rite XIII — the Reveal**, a technical credits card after the report: *"API calls: 23 · Cribl functions executed: 5 · Events processed by the Cribl engine: 40 · Config mutations: 0."*

**2. "Would a judge understand the story in 10 seconds?"**
*Mostly yes*, but 12 screens is a lot. **Fixes:** one primary button per screen, a persistent **12-candle progress rail** ("RITE III OF XII") where candles light up as you go, text beats that advance themselves, and no paragraph longer than 8 words on any ritual screen.

**3. "Would it be memorable after 20 other projects?"**
*Original: the goat is memorable; the rest is a generic cult parody.* **Fixes:**
- **The Façade opening.** For 3 seconds the app looks like a sober, legitimate Capra "Telemetry Health Overview" page with real KPIs from the judge's environment. Then a crack runs across the screen, a goat eye opens behind it, and the page gets *eaten*. That delivers "we built a forbidden app inside Cribl and the Goat took over" in 3 seconds, with no words.
- **The Goat knows the judge's name.** `window.getCriblUser()` → *"WE HAVE BEEN EXPECTING YOU, SARAH."* It's a real platform API and a genuinely unsettling moment.
- **It's the judge's own environment being possessed.** Screen 9 goatifies their real pipeline and destination names through a real preview run: *your* pipeline `main` becomes `GOAT_MAIN_RITUAL`.
- **The Book of Offerings.** The app's KV store keeps a cross-judge tally: *"You are the 14th soul to believe. 62 % of judges sacrificed the CEO."* The Goat remembers everyone.
- **A tarot card system for every character** (see §10). The real tarot has The High Priestess (II), The Emperor (IV) and The Devil (XV), and The Devil is traditionally drawn *as a goat*. That gives one coherent, recognizable, legitimately weird visual language.
- **Sound.** A goat scream, a choir pad and glitch bursts (muted with `M`). In a room full of silent dashboards, audio is the thing people remember.

**4. "Does it feel genuinely WEIRD rather than merely funny?"**
*Original: funny.* Weirdness comes from **sincerity and from breaking the fourth wall of the host product**, not from more jokes. **Fixes:**
- Play it completely straight. The Goat never winks. The UI treats the ritual with enterprise seriousness (a SOC incident screen built from real Capra components, a formal incident report with a ticket number).
- The interface misbehaves: the **RUN** button runs away from the cursor; **CALM THE GOAT** plays a lullaby, the Goat listens, then refuses, and the button turns into SUMMON. Every path leads to the Goat.
- The Goat addresses the Cribl product itself (*"YOUR LEADER NODE IS MINE"*) and appears to escape the iframe. It can't, but a full-bleed flash timed with the crack makes it *feel* like it did.
- **Stretch — the theme toggle changes the Goat's alignment.** Cribl's light mode makes the Goat HOLY (white, gold halo); dark mode makes it DEMONIC. The app must support both themes anyway (per `AGENTS.md`), so the rule becomes a gag.

**Verdict:** the concept holds up, and it gets much stronger once the ritual mechanics *are* Cribl mechanics. Target reaction: *"I have no idea why someone built this, but that exorcism was a real pipeline preview and it knew my name."*

---

## 1. FINAL CONCEPT

**The Church of Goat** is a Cribl App (App Platform, `@cribl/apps`) that installs into a Cribl.Cloud Leader and opens looking like a normal telemetry overview. Then an ancient Goat takes it over.

The judge is led through **12 rites** (about 3 minutes):

1. The Goat demands belief.
2. It demands an offering.
3. The offering is paid in the judge's **real event volume**.
4. A demon is found **inside Cribl**.
5. A SOC incident screen shows the **real sources, pipelines, destinations and health**.
6. The builders (Arno and Moise) show up and make it worse.
7. The High Priestess of Telemetry performs an exorcism, which is a **real Cribl pipeline executed by the Cribl engine**.
8. The Goat resists (a **real filter**).
9. The Goat possesses the environment (a **real preview transformation of the judge's own resource names**; nothing is saved).
10. The judge summons it.
11. The Goat awakens.
12. A formal incident report closes things out, with real numbers and **"Config mutations: 0"**.

**Tagline:** *Funny on the surface. A real Cribl engine underneath. Zero production systems harmed.*

---

## 2. CRIBL ARCHITECTURE

### 2.1 Recommended architecture

```
┌──────────────────────── Cribl.Cloud Leader (App Platform) ─────────────────────────┐
│                                                                                    │
│  Cribl UI shell ──► sandboxed iframe: /app-ui/armogoat  (React 19 + Vite + Capra)  │
│                        │                                                           │
│                        │ fetch(CRIBL_API_URL + …)  ← platform fetch proxy          │
│                        │   (auth injected, scoped by config/policies.yml)          │
│                        ▼                                                           │
│   READ   /products/stream/groups           /m/{g}/pipelines   /m/{g}/routes        │
│          /m/{g}/system/status/inputs       /m/{g}/system/status/outputs            │
│          /m/{g}/system/metrics/query  (+enum)                  /system/info        │
│   ENGINE /m/{g}/preview   ← inline pipelineConf + inline events (non-persistent)   │
│   STATE  /kvstore/church/*  ← app-scoped KV ("Book of Offerings")                  │
│   OPT    /m/default_search/search/jobs  (Cribl.Cloud only: "Heresy Scrolls")       │
│   OPT    /m/{g}/system/capture          (opt-in: real offerings, masked)           │
│   SANDBOX-ONLY  POST /m/goat_sandbox/pipelines  (create goat_exorcism, confirmed)  │
│                                                                                    │
│  Backend endpoint (stretch): backend/heartbeat.ts  ◄── config/schedules.yml hourly │
│      reads metrics → appends snapshot to KV ("The Goat has been watching")         │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Why this shape:**
- The **frontend calls Cribl directly** through the platform proxy. That's the simplest reliable path, it works in `npm run dev` live preview, and it needs no auth handling.
- **`/preview` is the core technical move**: a real engine run with zero persistence.
- **KV** gives cross-judge memory without breaking the "no browser storage" rule.
- The **backend endpoint and schedule are a stretch goal.** They show the full App Platform surface (frontend + backend + schedules + KV + policies) without being on the critical path of the demo.

### 2.2 Required Cribl components

There are two environments, and they have different needs:

| Component | Our trial env (build + video) | Judge's env (unknown) | Purpose |
|---|---|---|---|
| Cribl deployment with **Apps** enabled | Required | Assumed (it's an Apps hackathon) | Host the app |
| Stream Worker Group with ≥1 live Worker | Required | **Not assumed** (detected, §2.4) | `/preview`, status, metrics |
| **Datagen Sources** (2–3) → Route → DevNull | Required, so the video has moving numbers | Not assumed | Real event counts |
| One unhealthy Source | Recommended | Not assumed | Real HERESY |
| App-scoped **KV store** | Built in | Built in | Book of Offerings |
| Cribl Search (`default_search`) | Optional | Not assumed | Heresy Scrolls |
| Group `goat_sandbox` | Optional, **our env only** | **Never**: sandbox code is excluded from the shipped build | Sandbox rite (video only) |
| Backend endpoint + schedule | Stretch | Works if the tenant supports backends; otherwise it's skipped | "The Goat has been watching" |

### 2.4 Environment adaptivity (judges run it on tenants we've never seen)

The app **must never break, block or look empty** on any tenant. At startup (during the Façade), `detectCapabilities()` runs cheap probes in parallel (6 s timeout each) and stores a `Capabilities` object. Each scene reads it and picks the real, degraded or simulated path. The Scripture drawer and Rite 13 list what was detected, so judges see *why* something was simulated.

| Probe | Result | Behavior |
|---|---|---|
| `GET /products/stream/groups` | fails | Whole app runs **SIMULATED**, with a banner: *"The Goat cannot see your Cribl. Performing the rite from memory."* The flow is identical |
| same | returns 0 groups / only `default_search` | Census simulated; `/preview` is tried on the Leader context (`/preview?product=stream`) |
| group choice | many groups | Pick the one with the most healthy Workers, else `default`, else the first. Selectable in Settings |
| census endpoints | some 403 (judge's role lacks rights) | That panel is simulated with a tooltip *"The Goat was denied access (403)."* Nothing else changes |
| metrics query | 0 events or failure | **This becomes the joke, not an error:** *"YOUR TELEMETRY IS SUSPICIOUSLY QUIET. THE GOAT IS STARVING."* The Goat turns ANGRY, and the offering counter then counts the events **the Cribl engine processes during this ritual** (preview counts). Still 🟢 real, just smaller |
| `/m/{g}/preview` | fails | Retry once on `/preview?product=stream`; else `localEmulate()` + 🟡, with the engine error shown in Scripture |
| Search job | fails / not Cloud | Heresy Scrolls hidden silently |
| `getCriblUser()` | rejects | "MORTAL" |
| KV | fails | Book of Offerings kept in memory for the session only; soul number hidden |
| any pipelines/destinations | 0 found | Rite 9 goatifies the defaults Cribl ships with (`main`, `passthru`, `devnull`), labeled "(Cribl defaults)" |

**Principle for unknown tenants:** the *engine* moments (exorcism, goatification) are the ones we most want real, because they don't depend on the judge having traffic, only on `/preview` being reachable. Probe step 0 (§11) has to confirm which preview context works on a trial Cloud tenant *and* on a minimal on-prem/single-instance install.

### 2.3 UI architecture

- **Stack:** React 19, Vite 8, TypeScript 6 (all already in the scaffold), `@capra/core`, `@capra/icons` and `@capra/theme` for all "real Cribl" surfaces. Add **`motion`** (Framer Motion) for scene transitions, **`canvas-confetti`**, and **`@fontsource/cinzel-decorative`** plus **`@fontsource/jetbrains-mono`**. Fonts are bundled locally so no external domain calls are needed.
- **Two visual layers, on purpose:**
  1. **Ritual layer** — full-bleed custom art canvas (layered SVG Goat, canvas particles, CSS glitch). This is a **deliberate opt-out** from Capra layout templates for the story screens. The palette lives in CSS custom properties scoped to `.ritual` and has explicit light ("holy") and dark ("demonic") variants.
  2. **Cribl layer** — genuine Capra components (`Card`, `Text`, `Button`, `Drawer`, `Modal`, `Alert`, `Spinner`, `Pill`) styled only with `token()`. Used by the Façade (Capra **Overview** template: 12-column grid, KPI Metric Cards), the Incident Response screen, the Scripture drawer, safety confirmations and the Settings view.
- **No router pages.** It's one story, so a single-page scene machine keeps things simple (`useReducer`). There's no multi-page nav, so Capra `VerticalNavigation` isn't required. The Settings view opens as a Capra `Drawer`.
- **Scene machine:** `RitualStage` owns `sceneIndex`, a `ritualState` (sacrifice choice, census, metrics, preview results, judge name), hotkeys, the candle rail and the sound bus. Every scene is a component receiving `{state, dispatch, next}`.

---

## 3. USER JOURNEY

`CURIOUS → CONFUSED → AMUSED → WHAT THE HELL? → IMPRESSED`

| # | Rite | Emotion | Beat | ~Time |
|---|---|---|---|---|
| 0 | The Façade | curious | Legit Capra overview with real KPIs… then it cracks | 0:05 |
| 1 | The Invitation | confused | "DO YOU BELIEVE IN THE GOAT?" [YES] [YES]. The Goat knows your name | 0:10 |
| 2 | The Prophecy | amused | Demon detected; choose an offering (3 tarot cards) | 0:15 |
| 3 | The Sacrifice | amused | Red button. Real event volume pours into the Goat | 0:20 |
| 4 | The Revelation | WTH | Glitch: the demon is INSIDE CRIBL (your real pipeline names corrupt) | 0:12 |
| 5 | Incident Response | WTH / impressed | Real Capra SOC screen: sources, pipelines, destinations, heresy | 0:25 |
| 6 | The Builders | amused | Arno & Moise dialogue | 0:15 |
| 7 | The High Priestess | impressed | The exorcism pipeline, drawn as a real Cribl pipeline | 0:15 |
| 8 | The Exorcism | impressed → WTH | Real preview run; 97 % → THE GOAT RESISTED | 0:20 |
| 9 | Goat Possession | WTH | The Supreme Goat goatifies *your* resources (real preview) | 0:20 |
| 10 | The Final Button | amused | CALM / RUN / SUMMON; every path leads to Summon | 0:10 |
| 11 | The Great Awakening | euphoric | Confetti, scream, EMOTIONAL OBSERVABILITY ACHIEVED™ | 0:10 |
| 12 | Incident Report | impressed | Formal report, real numbers, Config mutations: 0 | 0:30 |
| 13 | The Reveal | impressed | Technical credits / Scripture summary | 0:10 |
| | | | **Total** | **≈ 3:40** |

**Persistent HUD (every screen from Rite 1 on):**
- Bottom: **12-candle progress rail** + "RITE IV OF XII".
- Top-right: **data sigil** — `🟢 LIVE CRIBL · default` or `🟡 SIMULATED`.
- Top-right: **📜 Scripture** button (API log drawer) and **🔇** mute.
- Hotkeys: `→`/`Space` next, `←` back, `R` restart, `S` scripture, `M` mute, `D` force demo data, `A` autoplay.

---

## 4. SCREEN-BY-SCREEN SPECIFICATION

Legend: **[LIVE]** = real Cribl data or engine; **[SIM]** = simulated and labeled as such; **[KV]** = app KV store.

### Rite 0 — THE FAÇADE (3–5 s, auto)
- **Visual:** a real Capra Overview layout. Page title "Telemetry Health Overview". Four KPI Metric Cards: Events (24h), Bytes (24h), Pipelines, Destinations **[LIVE]**. Calm and corporate.
- At t = 2.5 s the goat's eye opens in the "Pipelines" card. A crack SVG draws across the viewport, with a low rumble. At t = 3.5 s the page shatters into shards that fall into darkness.
- **Primary action:** none (auto). A click skips.
- **Why:** it establishes "forbidden app inside Cribl" and warms the API cache (census + metrics load here).

### Rite 1 — THE INVITATION
- **Visual:** ritual chamber: dark stone, 7 flickering candles, rotating sigil of Cribl-like hexagon routing glyphs, telemetry motes rising. The Goat (state `NORMAL`) fills 60 % of the height.
- **Text (huge):** `DO YOU BELIEVE IN THE GOAT?`
- **Whisper line** (fades in at 1.5 s): `WE HAVE BEEN EXPECTING YOU, {FIRSTNAME}.` **[LIVE]** `getCriblUser()`, falling back to `username`, then to "MORTAL".
- **Buttons:** `[ YES ]` `[ YES ]`, identical, side by side. Small text: *There is no other option.*
- **Easter egg:** hovering the empty space where "NO" would sit shows the tooltip *"NO was sacrificed in v0.0.1."*
- **Book of Offerings [KV]:** on click, increment `church/believers` and show *"You are soul #14."* for 1 s.
- **Goat:** NORMAL → CURIOUS (head tilts toward the cursor).

### Rite 2 — THE PROPHECY
- **Beat A (auto, 2 s):** `🐐 THE GOAT HAS SPOKEN` → `A DEMON HAS INFECTED YOUR TELEMETRY.`
- **Beat B:** `AN OFFERING IS REQUIRED.` Three tarot cards fan in:
  - **IV — THE CEO** 👔 (CEO_PHOTO avatar; default is a fictional suit with a lanyard and a golden OKR scroll)
  - **VII — THE PIPELINE** 📡 (label shows a **real pipeline name** from census **[LIVE]**, e.g. "main")
  - **IX — 1 GB OF LOGS** 📦 (a crate that leaks log lines)
- **Primary action:** click a card; it flips and glows.
- **[KV]:** increment `church/sacrifices/{ceo|pipeline|logs}`.

### Rite 3 — THE SACRIFICE
- **Text:** `THE GOAT DEMANDS AN OFFERING.` The chosen card sits on a stone altar.
- **Primary action:** huge red pulsing `SACRIFICE` button (at least 30 % of viewport width).
- **On click:**
  1. The card burns (CSS mask plus ember particles).
  2. A **telemetry river** (canvas particles) flows from the screen edges into the Goat's mouth. Particle rate is proportional to the real per-minute series.
  3. A counter tallies up to the real **`total.in_events` over the last 24 h** **[LIVE]**, e.g. `4,281,932 OFFERINGS RECEIVED`, with `GOAT FUEL: 3.2 GB` (from `total.in_bytes`) below it.
  4. A **sparkline of the last 60 min** (1-min windows) draws in glowing teal **[LIVE]**.
  5. Goat → HOLY briefly. Text: `THE GOAT IS PLEASED.`
- **Fallback:** if metrics **return 0** (empty judge tenant), switch to the STARVING GOAT beat (§2.4): *"YOUR TELEMETRY IS SUSPICIOUSLY QUIET. THE GOAT IS STARVING."* The Goat turns ANGRY, and the counter later tallies the events the engine processes in this ritual (still 🟢). If metrics **fail**, show a seeded counter with this panel's sigil switched to `🟡 SIMULATED`.
- **Scripture shows:** `POST /m/default/system/metrics/query` with body and result.

### Rite 4 — THE REVELATION
- **Beat A:** hard cut to black. `WAIT.` (1 s)
- **Beat B:** `THE {SACRIFICE} WAS NOT THE DEMON.`
- **Beat C (huge, RGB-split glitch):** `THE DEMON IS INSIDE CRIBL.`
- **Visual:** three stacked panels flowing down with animated connectors:
  - **Normal telemetry:** 4 real event-shaped rows built from real source ids and sourcetypes **[LIVE census]**.
  - **Corrupted telemetry:** the same rows with zalgo text, flicker and bit-rot.
  - **Demonic telemetry:** rows now read `sourcetype=hellfire:access`, `status=666`, red glow.
- **Primary action:** `INVESTIGATE` (auto-advances after 6 s if idle).

### Rite 5 — INCIDENT RESPONSE 🚨
- **Tone shift:** pure enterprise SOC. This screen uses **real Capra components on the Overview grid**, with a pulsing red siren bar on top: `🚨 DEMONIC TELEMETRY INCIDENT — SEV-0 (GOAT)`. Incident ID `GOAT-{yyyymmdd}-{believer#}`.
- **KPI row (span 3 each) [LIVE]:**
  - **OFFERINGS** (events/24h)
  - **GOAT FUEL** (GB/24h)
  - **SACRED PIPELINES** (count of `/pipelines`)
  - **HOLY DESTINATIONS** (count of outputs)
- **Row 2:**
  - **HERESY** Card (span 4): unhealthy sources and destinations (Red/Yellow from status endpoints) + `total.dropped_events` **[LIVE]**. If there are 0: "No heresy detected. Suspicious."
  - **SACRED ROUTING** Card (span 8): a mini flow graph of **real Sources → Routes → Pipelines → Destinations** (from `/routes` + status endpoints), each node labeled with the real id and a small renamed caption (`in_syslog` / *altar of syslog*).
- **Row 3 (span 12):** a sources table: id, type, health pill, events/5 min.
- **Primary action:** `SUMMON THE BUILDERS`.
- **Scripture:** 5–6 real GETs listed.

### Rite 6 — THE BUILDERS APPEAR
- **Visual:** two tarot cards drop from above with a thud and a dust puff:
  - **I — ARNO, THE ARCHITECT** (glowing blueprints, ceremonial robe over a hoodie, telemetry orbiting)
  - **XIII — MOISE, THE FORBIDDEN ENGINEER** (tangled cables, terminal glow, deeply suspicious squint)
- **Dialogue** (speech bubbles, 1.6 s each, auto; click to skip):
  - ARNO: *"I think I know what happened."*
  - MOISE: *"Don't touch anything."*
  - ARNO: *"I already touched it."*
  - MOISE: *"…"* (bubble holds 2.5 s; the Goat blinks slowly in the background)
- **Then:** `THE BUILDERS MUST PERFORM THE EXORCISM.` → Moise's card slides out of frame on its own. Caption: *"The Forbidden Engineer has left the ritual."*
- **Primary action:** `CALL FOR HELP`.

### Rite 7 — THE HIGH PRIESTESS OF TELEMETRY
- **Visual:** light breaks through; card **II — THE HIGH PRIESTESS OF TELEMETRY** rises (MARKETING_OFFICER_PHOTO avatar; consent confirmed).
- **Text:** `✨ THE HIGH PRIESTESS WILL PURIFY THE TELEMETRY.`
- **Pipeline diagram (looks like the Stream pipeline editor, ritualized):**
  `😈 DEMON EVENTS (40)` → `[ BANISH (Drop) ]` → `[ SEAL THE SECRETS (Mask) ]` → `[ ANOINT (Eval) ]` → `[ TITHE (Sampling) ]` → `😇 CLEAN TELEMETRY`
  Each node shows its real Cribl function id underneath in mono (`drop`, `mask`, `eval`, `sampling`).
- **Primary action:** `PREPARE THE RITE`.

### Rite 8 — THE EXORCISM
- **Primary action:** huge `PERFORM EXORCISM`.
- **On click:**
  - `POST /m/{g}/preview` fires **[LIVE]** with the inline exorcism pipeline and 40 demon events (§5.3).
  - The progress bar walks the staged beats `EXORCISM INITIALIZING… 13 % → 27 % → 42 % → 69 % → 97 %`, with a minimum of 4 s so the joke lands even though the API takes ~300 ms.
  - As the bar passes each pipeline node, the node lights up and shows **its real `eventsIn → eventsOut` and bytes** from `stats.functions`.
  - Final counter: `HERESY REMOVED: 41 % OF BYTES` **[LIVE]**.
- **At 97 %:** the screen shakes, then a red Capra-style `Alert` (overscaled) reads `ERROR: THE GOAT RESISTED.`
  - Below it: the **3 goat events straight from the preview output**, still containing `curse=666`, rendered as JSON. Caption: *"filter: species !== 'goat' — the Goat was never subject to your pipeline."* **[LIVE]**
- **Goat:** ANGRY → POSSESSED (eyes glow red, horns ignite).
- **Fallback:** if preview fails, a local JS emulation runs the same rules and the sigil turns `🟡 SIMULATED` with the engine error shown in Scripture.

### Rite 9 — GOAT POSSESSION
- **Full-screen transformation:** Goat → **SUPREME GOAT** (crown, 6 eyes that blink out of sync, aura fills the screen). Screen colors invert, then settle into crimson.
- **Text:** `YOU SHOULD NOT HAVE SUMMONED ME.` (letters appear one at a time with a deep bass hit each)
- **Transformation board [LIVE preview, non-persistent]:** real names from census are sent through the **Goatification pipeline** via `/preview`, and before/after pairs animate as flipping split-flap tiles:
  - Pipeline `main` → `GOAT_MAIN_RITUAL`
  - Destination `devnull` → `THE_HOLY_DEVNULL`
  - Event `authentication failure` → `GOATIFICATION COMPLETE`
- **Mandatory stamp** in the corner of the board: `PREVIEW ONLY — NOTHING WAS SAVED` (with a link-like hint: "see Scripture").
- **Primary action:** auto-advances after 8 s, or `FACE THE GOAT`.

### Rite 10 — THE FINAL BUTTON
Three buttons:
- `🧘 CALM THE GOAT` (small): a lullaby plays, the Goat's eyes droop… then snap open. The button morphs into SUMMON.
- `🏃 RUN` (small): **flees the cursor** (moves away on hover, 5 times), then gives up and turns into SUMMON.
- `🐐 SUMMON THE GOAT` (enormous, golden, pulsing, surrounded by particles and a subtle idle wobble).
- **[KV]:** record which button was tried first (`church/final/{calm|run|summon}`).

### Rite 11 — THE GREAT GOAT AWAKENING
- The whole UI zooms out through the Goat's eye. The **Goat (SUPREME + HOLY blend)** fills the screen, with light rays, confetti (goat emoji plus gold), an extended scream, and a choir chord.
- **Text:** `🐐 THE GOAT HAS AWAKENED` → `EMOTIONAL OBSERVABILITY ACHIEVED™`
- **Primary action:** `READ THE INCIDENT REPORT`.

### Rite 12 — GOAT INCIDENT REPORT
Formal, parchment-on-Capra document, stamped with a wax seal.

| Field | Value | Source |
|---|---|---|
| Incident | Demonic Telemetry Possession | static |
| Ticket | GOAT-20260929-014 | date + believer # [KV] |
| Witnessed by | {firstName lastName} | [LIVE] getCriblUser |
| Architect | Arno | characters config |
| Forbidden Engineer | Moise (absent) | characters config |
| High Priestess | {name} | characters config |
| Sacrifice | CEO / Pipeline `main` / 1 GB of logs | state |
| Events Offered | 4,281,932 | [LIVE] metrics |
| Events Processed by Cribl Engine | 40 | [LIVE] preview |
| Events Purified | 31 | [LIVE] preview |
| Heresy Removed | 41 % of bytes | [LIVE] preview stats |
| Goats that Resisted | 3 | [LIVE] preview |
| Pipelines Possessed | 7 | [LIVE] census count |
| Destinations Sanctified | 4 | [LIVE] census count |
| Exorcisms | 1 | state |
| Goats Summoned | 1 | state |
| **Production Systems Destroyed** | **0** | **Scripture: 0 mutating calls** |
| Emotional Observability | 100 % | obviously |
| Judges converted to date | 14 · 62 % sacrificed the CEO | [KV] |

**Final status:** `🐐 GOAT: SATISFIED` → the footer stamp `NO PRODUCTION SYSTEMS WERE HARMED.`
**Actions:** `📜 VIEW THE SCRIPTURE` (→ Rite 13), `↺ BEGIN AGAIN`.
*(Stretch)* The report is itself sent through `/preview` as an event, and the returned `_raw` is shown: "This report has been ingested (in preview)."

### Rite 13 — THE REVEAL (technical credits)
Clean Capra card, no jokes except the title *"What the Goat actually did."*
- `API calls: 23` · `Cribl functions executed: 5 (drop, mask, eval, sampling, rename)` · `Events processed by the Cribl engine: 47` · `Config mutations: 0` · `KV writes: 4`
- A list of the endpoints hit, each with a ✓.
- "Built on the Cribl App Platform: iframe app + fetch proxy + policies.yml + KV store (+ backend endpoint & schedule)."

---

## 5. DATA FLOW

> **Verified on a live tenant:** §16.3 holds the request formats that actually work (epoch-second metrics, 20 s preview, one combined preview call, derived stage counts, text/plain KV). Where this section differs, §16.3 wins.

### 5.1 Startup (during the Façade)
```
getCriblUser() ─────────────────────────────► state.judge
GET  /products/stream/groups ───────────────► pick group (config → 'default' → first with workers)
┌ parallel, each with a 6 s AbortController timeout, Promise.allSettled ┐
│ GET  /m/{g}/pipelines                      → state.census.pipelines     │
│ GET  /m/{g}/routes                         → state.census.routes        │
│ GET  /m/{g}/system/status/inputs           → state.census.sources       │
│ GET  /m/{g}/system/status/outputs          → state.census.destinations  │
│ POST /m/{g}/system/metrics/query (24h cum) → state.metrics.totals       │
│ POST /m/{g}/system/metrics/query (60m/1m)  → state.metrics.series       │
│ GET  /kvstore/church/stats                 → state.book                 │
└──────────────────────────────────────────────────────────────────────────┘
any failure → that slice uses fixtures and is flagged simulated:true
```

### 5.2 Metrics queries **⚠ VERIFY names and syntax at build step 0**
```jsonc
// totals, last 24 h
{ "earliest": "-24h", "latest": "now",
  "aggs": { "aggregations": ["sum(\"total.in_events\").as(events)",
                             "sum(\"total.in_bytes\").as(bytes)",
                             "sum(\"total.dropped_events\").as(dropped)"],
            "cumulative": true } }
// series, last 60 min, 1-min windows
{ "earliest": "-60m", "latest": "now",
  "aggs": { "aggregations": ["sum(\"total.in_events\").as(events)"], "timeWindowSeconds": 60 } }
```
The aggregation syntax matches the spec example (`max("health.inputs").as("health")`). Metric names are standard Cribl internal metrics; confirm with `POST /system/metrics/enum { "metricNameFilter": "total\\..*" }`. Try `/m/{g}/system/metrics/query` first, then the Leader `/system/metrics/query`.

### 5.3 The Exorcism (Rite 8): real engine, nothing persisted
Demon events are generated client-side (40 events, seeded with real source ids and sourcetypes from census). Of these, 3 have `species:'goat'`, ~6 have `heresy_level >= 9000`, and ~10 have `level:'debug'`.
```jsonc
POST /m/{g}/preview
{
  "mode": "pipe", "pipelineId": "goat_exorcism", "sampleId": "",
  "timeout": 5000, "memory": 256,
  "events": [ { "_raw": "2026-09-29T21:13:37Z host=altar-01 src=in_syslog user=ceo action=login status=FAILED password=hunter2 curse=666",
                "species": "human", "heresy_level": 42, "level": "info", "curse": "666",
                "demonic_payload": "Ph'nglui mglw'nafh Cribl", "sourcetype": "syslog" }, … ],
  "pipelineConf": {
    "asyncFuncTimeout": 1000,
    "functions": [
      { "id": "comment", "conf": { "comment": "RITE OF PURIFICATION — performed by the High Priestess of Telemetry" } },
      { "id": "drop", "filter": "heresy_level >= 9000", "description": "BANISH", "conf": {} },
      { "id": "mask", "filter": "species !== 'goat'", "description": "SEAL THE SECRETS",
        "conf": { "fields": ["_raw"], "rules": [
          { "matchRegex": "/666/g", "replaceExpr": "'🐐🐐🐐'" },
          { "matchRegex": "/(password|token)=\\S+/gi", "replaceExpr": "`${g1}=[BLESSED]`" } ] } },
      { "id": "eval", "filter": "species !== 'goat'", "description": "ANOINT",
        "conf": { "add": [ { "name": "purified", "value": "true" },
                           { "name": "purified_by", "value": "'High Priestess of Telemetry'" },
                           { "name": "blessing", "value": "C.Mask.md5(String(curse))" } ],
                  "remove": ["curse", "demonic_payload"] } },
      { "id": "sampling", "description": "TITHE",
        "conf": { "rules": [ { "filter": "level === 'debug'", "rate": 5 } ] } }
    ] } }
```
**Response use:**
- `items[]`: purified events, plus the 3 goat events with `curse` intact, which trigger "THE GOAT RESISTED".
- `stats.functions[]`: per-node `eventsIn/eventsOut/bytesIn/bytesOut`, shown on the diagram.
- Heresy removed % = `1 − (last.bytesOut / first.bytesIn)`.
- ⚠ VERIFY exact conf shapes against `components.schemas.FunctionConfSchema{Drop,Mask,Eval,Sampling}` in `openapi.json` before build.

### 5.4 Goatification (Rite 9): real engine, nothing persisted
One event per real resource: `{kind:'pipeline'|'destination'|'event', name}` (≤ 12 events).
```jsonc
"pipelineConf": { "functions": [
  { "id": "eval", "filter": "kind === 'pipeline'",
    "conf": { "add": [ { "name": "goat_name", "value": "'GOAT_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_') + '_RITUAL'" } ] } },
  { "id": "eval", "filter": "kind === 'destination'",
    "conf": { "add": [ { "name": "goat_name", "value": "'THE_HOLY_' + name.toUpperCase().replace(/[^A-Z0-9]+/g,'_')" } ] } },
  { "id": "eval", "filter": "kind === 'event'",
    "conf": { "add": [ { "name": "goat_name", "value": "'GOATIFICATION COMPLETE'" } ] } },
  { "id": "rename", "conf": { "rename": [ { "currentName": "name", "newName": "mortal_name" } ] } }
] }
```
(⚠ VERIFY the `rename` conf shape.) The UI renders `mortal_name → goat_name` pairs.

### 5.5 Book of Offerings (KV)
Single JSON doc at `church/stats` (read, modify, `PUT`; last-writer-wins is acceptable):
`{ believers, sacrifices:{ceo,pipeline,logs}, finalFirst:{calm,run,summon}, lastRitualAt }`.
`PUT` overwrites **only the app's own KV key**, which is app-scoped data and not Cribl config. No confirmation needed, and this is stated in the README.

### 5.6 Optional flows
- **Heresy Scrolls (Cloud Search):** `POST /m/default_search/search/jobs {query:'dataset="cribl_internal_logs" level="error" | limit 5', earliest:'-24h'}` → poll `GET …/jobs/{id}/status` → `GET …/jobs/{id}/results`. Rendered as 5 burning scrolls on Rite 5. ⚠ VERIFY the dataset name on the tenant; if the search fails, the scrolls are simply not shown.
- **Real offerings (opt-in toggle in Settings):** `POST /m/{g}/system/capture {filter:'true', maxEvents:20, duration:3, level:0}` (NDJSON stream). The captured events *replace* the generated demon events as exorcism input. On screen, `_raw` is blurred and only field names and sourcetypes are shown. Off by default because of projector privacy.
- **Heartbeat (stretch):** `config/schedules.yml` `heartbeat: {endpoint: heartbeat, cronSchedule: '0 * * * *'}` → `backend/heartbeat.ts` queries metrics and appends `{t, events}` to KV `church/heartbeat` (ring buffer of 48). Rite 3 caption: *"The Goat has been watching for 31 hours."*

---

## 6. REAL CRIBL INTEGRATIONS

| Story element | Real Cribl mechanism | Endpoint |
|---|---|---|
| The Goat knows your name | App Platform user identity | `window.getCriblUser()` |
| Façade KPIs / Incident KPIs | Stream internal metrics | `POST /m/{g}/system/metrics/query` |
| "OFFERINGS" / "GOAT FUEL" | `total.in_events` / `total.in_bytes` | same |
| Telemetry river rate + sparkline | 1-min metric series | same |
| SACRED PIPELINES | Pipeline list | `GET /m/{g}/pipelines` |
| SACRED ROUTING graph | Routes table | `GET /m/{g}/routes` |
| Altars (sources) + health | Source status | `GET /m/{g}/system/status/inputs` |
| HOLY DESTINATIONS + health | Destination status | `GET /m/{g}/system/status/outputs` |
| HERESY | Red/Yellow health + dropped events | status + metrics |
| **EXORCISM PIPELINE** | **Cribl engine running Drop/Mask/Eval/Sampling** | **`POST /m/{g}/preview` (inline conf)** |
| Per-stage offering counts | Engine per-function stats | `stats.functions` |
| Heresy removed % | Real byte reduction | `stats.functions` |
| THE GOAT RESISTED | Real function `filter` expression | preview output |
| Goatified resource names | Real Eval over real names | `POST /m/{g}/preview` |
| Book of Offerings | App-scoped KV store | `/kvstore/church/*` |
| Heresy Scrolls (opt.) | Cribl Search job | `/m/default_search/search/jobs` |
| Real offerings (opt.) | Live data capture | `POST /m/{g}/system/capture` |
| Goat has been watching (stretch) | Backend endpoint + schedule | `backend.yml`, `schedules.yml` |
| Sandbox rite (video only, not shipped) | Real pipeline creation in an isolated group | `POST /m/goat_sandbox/pipelines` |

## 7. SIMULATED COMPONENTS

| Element | Why simulated | Labeling |
|---|---|---|
| Progress % beats (13/27/42/69/97) | Comedic pacing; the real call takes ~300 ms | none needed (theatrical) |
| Demon events (default) | Privacy on a projector; deterministic demo | Rite 7 caption "40 demon events summoned for this rite" |
| Glitch/corruption of telemetry (Rite 4) | Visual only; nothing is corrupted | Scripture shows no call |
| "YOUR LEADER NODE IS MINE", escaping the iframe | Pure theatre | — |
| Possession of resources (Rite 9) | Real engine output, but **never saved** | "PREVIEW ONLY — NOTHING WAS SAVED" stamp |
| Any slice whose API call failed, or `?demo` | Fixtures | Global/panel sigil `🟡 SIMULATED` |
| Characters' dialogue, the Goat, the CEO | Fiction | — |

**Rule:** a number only ever appears next to 🟢 if it came from an API response in this session.

---

## 8. API REQUIREMENTS

### 8.1 Endpoint list (all relative to `window.CRIBL_API_URL`)

| Method | Path | Used in | Mode |
|---|---|---|---|
| — | `window.getCriblUser()` | Rite 1, 12 | core |
| GET | `/products/stream/groups` | startup | core |
| GET | `/m/{g}/pipelines` | 0, 2, 5, 9, 12 | core |
| GET | `/m/{g}/routes` | 5 | core |
| GET | `/m/{g}/system/status/inputs` | 0, 4, 5 | core |
| GET | `/m/{g}/system/status/outputs` | 0, 5, 9 | core |
| POST | `/m/{g}/system/metrics/query` (fallback `/system/metrics/query`) | 0, 3, 5, 12 | core |
| POST | `/system/metrics/enum` | build-time verification / startup probe | core |
| POST | `/m/{g}/preview` | 8, 9, 12 | core |
| GET/PUT | `/kvstore/church/stats` | 1, 2, 10, 12 | core |
| POST/GET | `/m/default_search/search/jobs`, `/jobs/{id}/status`, `/jobs/{id}/results` | 5 | optional (Cloud) |
| POST | `/m/{g}/system/capture` | 8 | optional, opt-in |
| POST, GET | `/m/goat_sandbox/pipelines`, `/m/goat_sandbox/pipelines/goat_exorcism` | 12 | optional sandbox |
| DELETE | `/m/goat_sandbox/pipelines/goat_exorcism` | Settings "Banish" | optional sandbox, confirmed |
| GET/PUT | `/kvstore/church/heartbeat` (from backend: `/api/v1/a/{appId}/kvstore/...` ⚠ VERIFY) | stretch | stretch |

### 8.2 `config/policies.yml` (core)
```yaml
policies:
  - object: '/products/stream/groups'
    actions: ['GET']
  - object: '/products/stream/groups/*'
    actions: ['GET']
  - object: '/m/:gid/pipelines'
    actions: ['GET']
  - object: '/m/:gid/routes'
    actions: ['GET']
  - object: '/m/:gid/system/status/inputs'
    actions: ['GET']
  - object: '/m/:gid/system/status/outputs'
    actions: ['GET']
  - object: '/m/:gid/system/metrics/query'
    actions: ['POST']
  - object: '/system/metrics/query'
    actions: ['POST']
  - object: '/system/metrics/enum'
    actions: ['POST']
  - object: '/m/:gid/preview'
    actions: ['POST']          # engine dry-run; non-persistent
  # optional — Cribl Search (Cloud only)
  - object: '/m/default_search/search/jobs'
    actions: ['POST']
  - object: '/m/default_search/search/jobs/*'
    actions: ['GET']
  # optional — opt-in live capture
  # - object: '/m/:gid/system/capture'
  #   actions: ['POST']
  # optional — SANDBOX ONLY: literal group id, so the platform itself prevents writes elsewhere
  # - object: '/m/goat_sandbox/pipelines'
  #   actions: ['POST']
  # - object: '/m/goat_sandbox/pipelines/*'
  #   actions: ['GET', 'DELETE']
```
KV (`/a/{appId}/kvstore/*`) is granted automatically, so don't declare it. `config/proxies.yml` stays empty: **the app makes no external calls** (fonts and audio are bundled).

---

## 9. SECURITY / SAFETY MODEL

**Principle:** it looks like apocalypse and does nothing.

1. **Three modes, one visible sigil:**
   - **SIMULATED** (`?demo` or auto-fallback): zero network calls to Cribl config; fixtures only.
   - **LIVE (default):** real reads + `/preview` + app KV. **No config mutation is possible in code, and it isn't granted in `policies.yml` either.**
   - **SANDBOX** (explicit Settings toggle **and** the policy lines uncommented at package time): may create exactly one pipeline `goat_exorcism` in group `goat_sandbox`. **Only built for our own trial env and the video. The GitHub release is built with `VITE_SANDBOX=false`, which strips the code, and the sandbox policies stay commented.**
2. **Defense in depth for writes (sandbox only):**
   - (a) `policies.yml` grants writes only on the **literal** path `/m/goat_sandbox/...`;
   - (b) the client refuses any non-GET call outside an allowlist (`/preview`, `/system/metrics/query`, `/system/metrics/enum`, `/kvstore/*`, `/search/jobs`, `/system/capture`, sandbox paths). This is enforced in a single `criblFetch()` wrapper;
   - (c) GET-before-POST, so the app **never overwrites**. If `goat_exorcism` exists, it creates `goat_exorcism_2`, and so on;
   - (d) a Capra `Modal` confirmation naming the exact resource: *"Create pipeline **goat_exorcism** in group **goat_sandbox**. This adds a new pipeline; nothing existing is changed."* Explicit button click only, never on load or timer (per `AGENTS.md`);
   - (e) the app records created ids in KV `church/created`; the "Banish" (DELETE) cleanup only targets ids in that list, behind its own confirmation modal with an "cannot be undone" warning, and reports the outcome.
3. **`/preview` is bounded:** ≤ 50 events, `timeout: 5000`, `memory: 256`, one call in flight at a time, triggered only by explicit button clicks.
4. **Privacy:**
   - Default offerings are synthetic.
   - The opt-in capture is ≤ 20 events and ≤ 3 s, with `_raw` blurred on screen.
   - No log content is ever written to KV (only counters).
   - Judge identity is shown only on screen; the report stores no PII in KV.
5. **Likeness and brand:**
   - **Consent confirmed (D2)** for Arno, Moise, the CEO and the High Priestess. Keep a short written record (for example the email or Slack thread) in case a judge asks. Because the repo and video are public, consent should explicitly cover **public distribution on GitHub and in the video**. The `consent` flag stays in the config so anyone can be swapped back to a fictional illustration in one line if they change their mind.
   - Humor is affectionate: no insults and no implying real wrongdoing. The CEO card is "The Emperor of OKRs", and sacrificing it just sends the CEO on a sabbatical to a goat farm (shown in the report as `CEO status: on a spiritual retreat 🧘`).
   - Cribl's goat mascot is used per Cribl brand guidance for the hackathon; otherwise use the original layered SVG goat (§10).
6. **Scripture is the audit log.** Every call is visible, and the report's "Production Systems Destroyed: 0" is **computed**, as the count of non-GET calls outside `/preview`, `/metrics`, `/kvstore` and `/search`.

---

## 10. ASSET REQUIREMENTS

### 10.1 Character system (`src/ritual/characters/characters.ts`)
```ts
export const CHARACTERS = {
  arno:      { name: 'Arno',  title: 'The Architect',               arcana: 'I',    image: 'assets/characters/arno.webp',      fallback: 'svg:architect' },
  moise:     { name: 'Moise', title: 'The Forbidden Engineer',      arcana: 'XIII', image: 'assets/characters/moise.webp',     fallback: 'svg:engineer' },
  ceo:       { name: 'The CEO', title: 'The Emperor of OKRs',       arcana: 'IV',   image: 'assets/characters/ceo.webp',       fallback: 'svg:emperor',   consent: true },
  priestess: { name: 'The High Priestess', title: 'of Telemetry',   arcana: 'II',   image: 'assets/characters/priestess.webp', fallback: 'svg:priestess', consent: true },
} as const;
```
(`arno` and `moise` also carry `consent: true`.) If a card has `consent: false`, or its image file is missing, the component renders the illustrated fallback, so the app never shows a broken image on a judge's machine. Replace `'The CEO'` and `'The High Priestess'` with the real names if the people want to be named. To swap an image, drop the file in `public/assets/characters/` and edit this one config file.

### 10.2 Placeholders (files to supply)
| Placeholder | File | Spec |
|---|---|---|
| ARNO_PHOTO → illustrated card | `public/assets/characters/arno.webp` | 768×1152 (2:3 tarot), transparent or dark bg, < 300 KB |
| MOISE_PHOTO → card | `…/moise.webp` | same |
| CEO_PHOTO → card | `…/ceo.webp` | same (consent confirmed) |
| MARKETING_OFFICER_PHOTO → card | `…/priestess.webp` | same (consent confirmed) |
| GOAT_ASSET | `public/assets/goat/cribl-goat.svg` (optional) | Official mascot; otherwise the built-in layered SVG |
| Audio | `public/assets/audio/{scream,bleat,choir,rumble,glitch,lullaby,thud}.mp3` | < 150 KB each, royalty-free |

### 10.3 Turning the photos into characters (image-to-image prompts)
Use one consistent style prefix so all cards match:
> *STYLE: ornate dark-fantasy tarot card, cel-shaded digital painting, deep navy and black background, neon teal and warm orange telemetry light streams (Cribl-inspired), thin gold art-nouveau frame, roman numeral at top, title banner at bottom, keep the subject's face clearly recognizable and true to the reference photo, humorous but flattering, no text other than the banner.*

- **ARNO (I — THE ARCHITECT):** *…ceremonial hooded robe over a tech-conference hoodie, holding a glowing blueprint of a data pipeline (source → pipeline → destination boxes), holographic telemetry graphs orbiting his head, proud "I designed this" smile, a tiny goat silhouette hiding in the blueprint.*
- **MOISE (XIII — THE FORBIDDEN ENGINEER):** *…dark cloak made of tangled ethernet cables, green terminal text reflected on his face, one eyebrow raised in deep suspicion, arms crossed, "I told you this would happen" expression, a sealed scroll labeled FORBIDDEN under his arm.*
- **CEO (IV — THE EMPEROR OF OKRs):** *…seated on a throne of server racks, a golden crown shaped like a bar chart, holding a scepter topped with a KPI gauge, benevolent and slightly confused expression.*
- **HIGH PRIESTESS (II — OF TELEMETRY):** *…luminous white and teal robes, holding a glowing filter-funnel chalice that turns red smoke into clean teal light, serene confident expression, crescent moon made of a latency graph.*

### 10.4 The Goat: layered SVG, not 6 images
`src/ritual/goat/Goat.tsx` renders one inline SVG with named layers, each toggled or animated by `state`:

| Layer | NORMAL | CURIOUS | ANGRY | POSSESSED | HOLY | SUPREME |
|---|---|---|---|---|---|---|
| head tilt | 0° | 12° (follows cursor) | −5°, shake | jitter | 0° | 0°, scale 1.3 |
| eyes | amber, horizontal pupils | wide | narrowed | glowing red, flicker | closed, serene | **6 eyes**, out of sync |
| horns | plain | plain | steaming | on fire | gilded | crown + flaming |
| halo/aura | — | — | red vignette | red smoke | gold halo, rays | full-screen aura |
| mouth | chew loop | open "?" | teeth | unhinged | smile | scream on transition |
| extras | — | "?" bubble | — | glitch offset | sparkles | orbiting telemetry rings |

The Goat's tarot identity is **XV — THE DEVIL** when possessed and **XXI — THE WORLD** when Supreme or Holy. If the official Cribl goat SVG is provided, it replaces the head and body layers while keeping eyes, horns and aura as overlays.

### 10.5 Fonts and art tokens
- Fonts: **Cinzel Decorative** for liturgical headlines, **JetBrains Mono** for telemetry. Both bundled via `@fontsource`.
- Ritual palette: `--ritual-void, --ritual-blood, --ritual-candle, --ritual-teal, --ritual-gold`, with **holy** (light) and **demonic** (dark) sets.
- Minimum sizes for projection: headline ≥ 7 vw, button text ≥ 3 vw, any number ≥ 5 vw, and contrast ≥ APCA Lc 75 for headlines.

---

## 11. IMPLEMENTATION PLAN

**Step 0: probe the live tenant (½ day).** Build a throwaway `ProbePanel` (behind `?probe`) that runs every core endpoint and prints the responses. Confirm:
- metric names and aggregation syntax;
- `/m/{g}/preview` with the §5.3 body, including the exact function conf shapes;
- the `rename` conf shape;
- the Search dataset name;
- whether metrics are group-scoped or Leader-scoped.

Adjust the §5 bodies, then delete the probe.

**Step 1: skeleton.**
- Replace the pasture `App.tsx` with `RitualStage`.
- Add `state/ritualStore.ts` (reducer), the scene registry, hotkeys and the candle rail.
- Scenes are placeholder text only. Test the full flow end to end with the keyboard.

**Step 2: Cribl client layer (`src/cribl/`).**
- `client.ts`: `criblFetch` with timeout, method allowlist, Scripture logging, and demo switch.
- Plus `census.ts`, `metrics.ts`, `exorcism.ts` (pipeline confs + demon generator + local emulator fallback), `kv.ts` and `fixtures/`.
- Unit-test the pure parts (demon generator, % math, local emulator) with Vitest.

**Step 3: the Goat.**
- Layered SVG with the 6 states.
- Transitions via `motion`, and cursor-follow in CURIOUS.

**Step 4: FX kit.**
- `Particles` (canvas, rate prop), `TelemetryRiver` (sources → target point), `Glitch` (CSS RGB split + clip), `Crack` (SVG path draw).
- `Confetti`, and a `Sound` bus (WebAudio, unlocked on first click, mute).
- Respect `prefers-reduced-motion` by dropping particles and shake while keeping cuts.

**Step 5: scenes 0–5** (façade, invitation, prophecy, sacrifice, revelation, incident) with real data wiring.

**Step 6: scenes 6–9** (builders, priestess, exorcism with the real preview, possession with the real preview).

**Step 7: scenes 10–13** (final button with the fleeing RUN, awakening, report, reveal) and the Book of Offerings.

**Step 8: Scripture drawer + Settings drawer.**
- Settings: group picker, real-offerings toggle, sandbox toggle, and a reset of the Book of Offerings (DELETE KV key → confirmation modal).

**Step 9: polish for projection.**
- Test at 1920×1080 and 1280×720 at 3 m distance.
- Test both Cribl themes.
- Timing pass so the whole run is ≤ 4 min.
- Rehearse `A` autoplay.

**Step 10 (stretch):** backend heartbeat + schedule, Heresy Scrolls, sandbox rite, holy/demonic theme gag, report-as-event.

**Definition of done:**
- A judge with zero instructions finishes the ritual in under 4 min.
- Every 🟢 number traces to a Scripture entry.
- The report shows `Config mutations: 0` in LIVE mode.
- The app works with the network cable pulled (auto SIMULATED).
- The clean-room test (§12.3) passes on an empty trial org as a non-admin user.
- `npm run build` and `npm run package` succeed.
- oxlint is clean.

---

## 12. DEPLOYMENT & SUBMISSION PLAN

There are two audiences: **us**, building and recording on a trial license, and **judges**, installing from GitHub onto their own unknown tenants. Build for the second one.

### 12.1 Our trial environment (build + record the video)
- A Cribl trial org with Apps enabled. **Record its exact Cribl version**; it becomes "Tested on" in the README.
- Group `default` with ≥ 1 healthy Worker.
- 3 Datagen sources (e.g. `syslog`, `apache_common`, `palo_alto_traffic`) at ~2–5k EPS total → Routes → 2 pipelines (`main`, `security_logs`) → `devnull` (+ one more destination). That gives the counters movement and gives Rite 9 good names.
- One deliberately unhealthy source (`in_tcp_heresy`) so HERESY is real on video.
- Optional group `goat_sandbox`, only for the "extended cut" of the video. The sandbox code isn't in the shipped build.

### 12.2 Build
```bash
npm install
npm run dev          # live preview inside Cribl via the Apps dev connection
npm run build        # tsc -b && vite build && apps build
npm run package      # bumps the version and writes the .tgz
```

### 12.3 Clean-room test (simulates a judge)
Before tagging a release, install the `.tgz` on a **second, freshly created trial org with zero configuration**, as a **non-admin user** the app is shared with. Then walk the whole ritual and confirm all of these:
- no step blocks, and every number is either 🟢 (real) or 🟡 with a reason in Scripture;
- the "STARVING GOAT" path appears (it will, since there's no traffic);
- the exorcism is still 🟢, because `/preview` doesn't need traffic;
- both themes look right;
- it works with Wi-Fi off (full SIMULATED).

This is the single most important pre-submission step.

### 12.4 GitHub submission package
```
README.md                        short Marketplace-format README (§13.1): what, why, how, install, permissions
JUDGES.md                        2-minute quickstart for judges (§13.2)
LICENSE                          Apache-2.0
docs/CHURCH_OF_GOAT_DESIGN.md    this dossier: architecture, real-vs-simulated, safety model
docs/BUILD_PROMPT.md
docs/media/                      hero GIF (≤ 8 MB), screenshots, video thumbnail
release/armogoat-<version>.tgz   also attached to the GitHub Release (judges look in one or the other)
src/ backend/ config/ public/    full source, so judges can audit or rebuild
```
- **GitHub Release `v1.0.0`**, with the `.tgz` attached and release notes that repeat the 3 install steps.
- Put the **hero GIF at the top of README** (the Façade cracking into "DO YOU BELIEVE IN THE GOAT?"). It hooks judges before they install anything.
- Make sure the repo contains **no trial tenant URLs, org ids, tokens or `.env` files**. The app has no secrets by design (the platform injects auth).
- `node_modules`, `dist` and `backend-build` stay git-ignored (already the case); the `.tgz` in `release/` is the only committed build artifact.

### 12.5 Judge install flow (what JUDGES.md says)
1. Download `armogoat-<version>.tgz` from the Release (or `release/`).
2. Cribl → **Apps → Import from file** → upload → review the declared permissions (read-only plus preview) → install.
3. Open **The Church of Goat** → follow the ritual (~3.5 min, sound on, fullscreen recommended).

Non-admin users need the app **shared** with them. If a sigil shows 🟡, open 📜 Scripture to see why (e.g. no Workers, 403, no traffic). The ritual still completes. **Settings → "Perform from memory"** (or the `D` key) forces the full simulated rite. It's a UI toggle, not a URL parameter, because query strings may not reach the iframe.

### 12.6 Video (strongly recommended)
The video is our insurance against an empty or odd judge tenant, and the only way to show the ritual with live traffic, sound and pacing exactly as intended.
- **Main cut (≤ 3:30):** one uninterrupted run on our trial env, sound on, recorded at 1920×1080. Add burned-in captions for the dialogue (judges may watch muted).
- **Under-the-hood cut (≤ 60 s):** open 📜 Scripture during the exorcism; show the `/preview` request with the inline pipeline and the per-function stats matching the screen; show the report's computed "Config mutations: 0"; optionally the sandbox rite creating `goat_exorcism` and then opening it in the Stream UI.
- Host both as unlisted YouTube videos (or GitHub-attached MP4s), linked at the top of README and JUDGES.md.
- **Shot list:** Façade crack (0:00) → YES/YES + judge name (0:08) → sacrifice counter (0:25) → glitch (0:50) → SOC screen (1:05) → builders' dialogue (1:30) → exorcism + "THE GOAT RESISTED" (1:55) → Supreme Goat goatifying real names (2:25) → the fleeing RUN button (2:45) → awakening (2:55) → report (3:05).

### 12.7 package.json metadata
`displayName: "The Church of Goat"`, `author: "Arno & Moise"`, `tags.product: ["stream", "search"]`. **Keep `name: "armogoat"`** so the app id doesn't change.

---

## 13. README & JUDGES GUIDE

### 13.1 README.md (short; keeps the scaffold's fixed Marketplace section names)
```markdown
# 🐐 The Church of Goat

The Church of Goat is an interactive Cribl telemetry purification experience.

![The Goat awakens](docs/media/hero.gif)

▶ **Watch the ritual (3 min):** <VIDEO_URL> · **Under the hood (1 min):** <VIDEO_URL_2>

## Summary
We wanted to explore what happens when observability meets an ancient Goat deity.

## How To Use
Follow the ritual.

## What This App Does
Funny on the surface, real Cribl underneath: the exorcism is a real Cribl pipeline
(Drop, Mask, Eval, Sampling) executed by the Cribl engine in **preview**, over events
seeded from your own Sources. Numbers marked 🟢 come from your environment; 🟡 means
simulated, and the 📜 Scripture drawer shows every API call and why.

## Before You Install
Everything destructive-looking is safely simulated or isolated. The app never creates,
changes or deletes Cribl configuration. It works on any tenant, including an empty one.
Tested on Cribl <VERSION> (Cribl.Cloud trial).

## Installation
1. Download `armogoat-<version>.tgz` from Releases (or `release/`).
2. Cribl → Apps → Import from file → upload → install.
3. Open **The Church of Goat**. Sound on. Fullscreen recommended.

## Permissions
### Cribl API Endpoints Used
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/products/stream/groups` | Find the Worker Group to possess |
| GET | `/api/v1/m/{group}/pipelines`, `/routes` | Sacred Pipelines, Sacred Routing |
| GET | `/api/v1/m/{group}/system/status/inputs`, `/outputs` | Altars, Holy Destinations, Heresy |
| POST | `/api/v1/m/{group}/system/metrics/query` | Offerings & Goat Fuel (read-only query) |
| POST | `/api/v1/m/{group}/preview` | The exorcism (preview only; nothing saved) |
| POST/GET | `/api/v1/m/default_search/search/jobs` | Heresy Scrolls (optional, Cribl.Cloud) |

## External API Access
None. Fonts and sounds are bundled.

## Data And Storage
App-scoped KV key `church/stats`: anonymous ritual counters (believers, sacrifice choices). No log content, no user data.

## Support
Community built by Arno & Moise for the Cribl Hackathon. Issues: <REPO_URL>/issues

## Known Limitations
Some panels are simulated if your role lacks access, there are no Workers, or there is no traffic. The ritual always completes.

## App Metadata
| Field | Value |
|---|---|
| App Name | The Church of Goat |
| App ID | armogoat |
| Version | <x.y.z> |
| Author | Arno & Moise |
| Support Model | community-built |
| Support Label | Community Built |
| License | Apache-2.0 |
| Product Tags | stream, search |
| Category | Observability (Occult) |
| Audience | end-user |
| Availability | preview |
| Requires External Access | no |
| Repository | <REPO_URL> |
| README Schema Version | 1.0 |

No production systems were harmed.
```

### 13.2 JUDGES.md (one screen)
```markdown
# 🐐 Judging The Church of Goat — 2 minutes to install, 3.5 minutes to believe

1. **Install:** Releases → `armogoat-<version>.tgz` → Cribl → Apps → Import from file.
2. **Open** The Church of Goat. **Sound on.** Press F11.
3. **Follow the ritual.** One button per screen. `→` skips, `S` opens the Scripture, `M` mutes.

**Is any of this real?** Yes:
- 🟢 numbers come from your Cribl.
- The exorcism is a real pipeline run by your Cribl engine (preview only; nothing is saved).
- Open 📜 Scripture at any time to see every API call.

**Your environment is empty?** The Goat will notice. It still works.

**Something looks off?** Settings → "Perform from memory" runs the full simulated rite, or watch the video: <VIDEO_URL>

**Is it safe?** The app has no permission to change your configuration, and the incident report *counts* the changes it made (it's always 0).
```

---

## 14. FINAL CRIBL APP GENERATION PROMPT

See **[`BUILD_PROMPT.md`](./BUILD_PROMPT.md)**. It's self-contained and can go straight to a coding agent working in this repo.

---

## 15. RISKS / LIMITATIONS

| Risk | Impact | Mitigation |
|---|---|---|
| Metric names or query syntax differ on the tenant | Counters show 0 or error | Step 0 probe; `/system/metrics/enum` discovery; per-panel SIMULATED fallback |
| `/preview` in `/m/{g}` needs live Workers, or behaves differently on Cloud | Exorcism can't run for real | Probe early; local JS emulator fallback clearly labeled; keep ≥ 1 healthy Worker |
| Function conf shapes (mask/sampling/rename) differ slightly | Preview 400 | Validate against `openapi.json` schemas; the probe prints the engine error |
| Hackathon env has no traffic | Unimpressive numbers | Datagen sources in our env; judges get the STARVING GOAT path (§2.4) + the video |
| **Judge tenant unknown** (version, groups, role, Cloud vs on-prem) | Parts can't run for real | Capability detection (§2.4); clean-room test on an empty trial org as a non-admin (§12.3); the video as the reference run |
| Judge's Cribl version predates an API we use | Engine moments are simulated | README states the tested version; `/preview` retried in the Leader context; the local emulator keeps the flow intact |
| Judge never installs, only reads the repo | Misses the experience | Hero GIF + video links at the top of README |
| Cribl Search is Cloud-only / dataset names vary | Scrolls missing | Optional, fails silently |
| Proxy 30 s timeout, streaming capture | Hang | 6 s AbortController everywhere; capture is optional |
| Iframe sandbox blocks Fullscreen API / autoplay audio | Less drama | Browser F11; unlock audio on the first YES click |
| Capra rules (tokens everywhere, page templates) vs. art canvas | Guideline tension | Explicit opt-out for the ritual layer only; Capra for all real-data surfaces |
| Light/dark requirement | Art looks wrong in one theme | Two ritual palettes (holy/demonic); test both |
| Likeness / brand in a public repo | Reputational | Consent confirmed (D2) incl. public distribution; one-line consent flag to withdraw; affectionate copy; mascot per brand guidance |
| 12+ screens run long | Judge fatigue | Auto-advancing beats, hard 4-min budget, `→` skip, autoplay mode |
| Presenter Wi-Fi fails | Demo dies | Auto-SIMULATED with identical flow; Settings → Perform from memory |
| Real log content on a projector (capture mode) | Data exposure | Off by default, blurred, ≤ 20 events, never persisted |

---

## 16. PROBE LOG (live tenant findings)

### Pass 1 — 2026-09-30, Cribl.Cloud trial, Cribl 4.20.1-590ec085, group `default` (1 Worker, AWS eu-central-1)

| Area | Result | Consequence |
|---|---|---|
| `getCriblUser()` | ✅ firstName present | Judge greeting works |
| `/system/info` | ✅ `items[0].BUILD.VERSION`; also carries `items[0].messages[]` (real Leader system messages, some `severity: "error"`) | **New HERESY source:** Leader error messages (the trial tenant has real ones), since all 19 sources and 5 destinations were Green |
| Census (`/m/default/pipelines`, `/routes`, status inputs/outputs) | ✅ 23 pipelines, 1 route table / 7 routes, 19 sources, 5 destinations, ~130–270 ms each | Good goatify material (`cisco_asa`, `CryptoLake`, …) |
| `/system/metrics/enum` | ✅ `total.in_events`, `total.out_events`, `total.in_bytes`, `total.out_bytes`, `total.dropped_events` exist, with dims `__worker_group`, `__worker_node`, … | Metric names confirmed |
| `/m/{g}/system/metrics/query` | ❌ 404 (`Cannot POST /api/v1/system/metrics/query`) | **Use the Leader `/system/metrics/query` only** |
| `/system/metrics/query` (sum, −24h, cumulative) | ⚠ 200 but `results: []` | Body shape still wrong → pass 2 |
| `/m/{g}/preview` and `/preview?product=stream` | ⚠ 200, `items: []`, *"Preview results may be incomplete due to process timeout"* after ~5.1 s | The `timeout: 5000` we sent was shorter than the preview process's boot time → pass 2 with 20 s. **Design impact:** start the exorcism request when the judge enters Rite 7 so the result is ready by the Rite 8 click; the staged progress bar covers the rest |
| KV `PUT` (application/json object) | ⚠ 201, but read back as the literal `[object Object]` | The store keeps the request body as text → pass 2 tests `text/plain` + `JSON.stringify` |
| Search datasets / job / results | ✅ 21 datasets incl. `cribl_internal_logs`; job queued → completed in ~17 s; results are NDJSON (first line = job meta) | Start the Heresy Scrolls job during the Façade so it's done by Rite 5. The job response echoes the user's email and roles: never display the raw job object |

### Pass 2 — 2026-09-30 (same tenant)

| Area | Result | Consequence |
|---|---|---|
| Metrics time range | Relative strings (`-1h`, `-24h`) → **0 rows** in every variant. Epoch **seconds or ms** → rows (572,486 `total.in_events` in the last hour). No time range → the whole retention window (15,655,038) | **Always send epoch seconds** for `earliest`/`latest` |
| `where` / `splitBys` variants | Only tested with relative times (so inconclusive) | Retest in the build with epoch times; don't depend on them |
| `health.inputs` by `input` (spec example) | ✅ 34 rows; 4 inputs at `2` (Red), 2 at `1` (Yellow), even though `/system/status/inputs` reported all Green | **HERESY = inputs with `health.inputs > 0`** (last 15 min) + Leader error messages from `/system/info` |
| `GET /system/metrics` | Empty result | Not used |
| `/m/{g}/preview` with `timeout: 20000` (no `memory`) | ✅ Exorcism 9.4 s: 8 in → 5 out; `password=[BLESSED]`, `666→🐐🐐🐐`, `purified_by`, `blessing` (md5); `sampled: 3` on the kept debug event; **both goats untouched with `curse=666`** | Exorcism is real, and "THE GOAT RESISTED" is exactly the engine output |
| Preview `stats` | **Not returned** (no `stats` key) | Per-stage counts are **derived from the engine output**: every output event keeps its input `__id`, so dropped (banished), sampled (tithed), masked, anointed and resisted counts are exact. Bytes are computed from input vs output events (fields not starting with `__`) |
| Goatify preview | ✅ 8.3 s; Eval + Rename worked (`cisco_asa → GOAT_CISCO_ASA_RITUAL`, `CryptoLake → THE_HOLY_CRYPTOLAKE`, `mortal_name` set) | Real names become real goat names |
| KV encoding | `PUT` with `content-type: text/plain` + `JSON.stringify(doc)` → 201 and an identical read-back. `application/json` with a string literal → 400 | **KV = text/plain JSON strings.** `POST /kvstore/keys {prefix}` returns a JSON array of key names |

### 16.3 Locked-in request formats (these supersede §5 where they differ)

- **Metrics:** Leader only, `POST /system/metrics/query`.
  - Totals: `{earliest: now−86400, latest: now, aggs: {aggregations: ['sum("total.in_events").as("events")', 'sum("total.in_bytes").as("bytes")', 'sum("total.dropped_events").as("dropped")'], cumulative: true}}` (epoch seconds).
  - Series: same with `earliest: now−3600, aggs.timeWindowSeconds: 60`.
  - Heresy: `{earliest: now−900, latest: now, aggs: {aggregations: ['max("health.inputs").as("health")'], cumulative: true, splitBys: ['input']}}`.
- **Preview:** `POST /m/{g}/preview` with `timeout: 20000`, **no `memory`**, client abort at 28 s (the proxy gives up at 30 s). Fallback: `/preview?product=stream`, then the local emulator.
  - Latency is **8–10 s per call**, so the app sends **one combined call** (exorcism + goatify events, each function filtered on a `rite` field).
  - It fires when the judge clicks **SUMMON THE BUILDERS** (Rite 5 → 6). The builders' dialogue and the Priestess (about 30 s) cover the wait, and the Rite 8 progress bar holds at 97 % if the call is still running. Scripture shows the call as "The builders began the rite".
- **Per-stage counts:** derived from the engine output by `__id`, not from `stats.functions`.
- **KV:** `text/plain` body = `JSON.stringify(doc)`; `GET` returns the same text; a 404 means empty.
- **Search:** start the job during the Façade (it takes ~17 s); results are NDJSON with the job meta on line 1. Never display the raw job object (it echoes the user's email and roles).
- **Leftover probe keys** in this tenant's app KV: `church/probe`, `church/probe-text`. They're harmless and get removed with the probe.

---

## 17. IMPLEMENTATION NOTES (v1.0.0, 2026-09-30)

What was built, and where it deviates from §2–§11 and `BUILD_PROMPT.md`:

- **Layout:** `src/cribl/` (client with allowlist + Scripture, census, metrics, rite, kv, search, fixtures), `src/state/ritual.tsx` (reducer + orchestration), `src/ritual/` (stage, HUD, Goat, tarot characters, fx, and scenes grouped by act in `scenes/ActOne…ActSix.tsx`). Copy lives in the scenes rather than a separate `story.ts`.
- **One combined preview call** (exorcism + goatification) fires when the judge clicks SUMMON THE BUILDERS. It waits for the census (max 10 s) so it always uses the tenant's real names.
- **Byte reduction:** demon events carry an `ectoplasm` junk field that ANOINT removes, so "Heresy removed" is a meaningful number (~60 %). It's still computed from engine input vs output.
- **Scene advancing is scene-aware** (`advanceFrom(index)`): a timer in an exiting scene can never skip the next one.
- **Sound is synthesized with WebAudio** (bleat, scream, choir, lullaby, rumble…). No audio assets.
- **Theme:** the Goat's alignment follows the same `.dark` class the Capra tokens use, set by the `CRIBL_APP_LAYOUT` bridge. Light = holy, dark = demonic.
- **Removed:** the scaffold's sample backend endpoint and schedules (frontend-only app). The hourly heartbeat stretch goal would bring a backend back.
- **Not built yet (stretch):** sandbox pipeline creation, opt-in live capture, report-as-event, heartbeat schedule.
- **Dev aids:** `?demo` forces simulated mode; `?scene=N` (dev builds only) jumps to a scene.
- **Tests:** `npm test`, including a golden test of the stage-count derivation against real engine output from probe pass 2, emulator parity, and the allowlist.
- **Packaging on OneDrive:** `npm run package` fails or produces an empty archive when the project sits in a OneDrive-synced folder. The CLI rebuilds `dist/` and tar then reads files OneDrive is still syncing. Either keep the repo outside OneDrive, or run `npm run build`, wait for sync, and pack with the `@cribl/apps` packer directly (`createAppPack`).
- **Portraits (2026-09-30):** the four photos are processed by `tools/tarotize.py` into 560×640 tarot faces. Processing: aspect kept, headroom added, per-card duotone, light posterize, vignette. `src/ritual/characters/Costume.tsx` then draws the costume over each face: Arno's blueprint grid and telemetry orbit, Moïse's cables, terminal rain and FORBIDDEN seal, the CEO's bar-chart crown, the Priestess's halo and light. CEO and Priestess keep their titles, with no names. For fully illustrated versions, run the §10.3 image-generation prompts and drop the results in `public/assets/characters/` (same file names, 560×640).
- **Soundtrack slots (2026-09-30):** five file-based tracks (`src/ritual/fx/tracks.ts`, documented in `docs/SOUNDTRACK.md`): Façade sting, goat intro choir, YES reveal, ambient loop, CEO offering. Each falls back to a synthesized cue when its file is missing. Because the iframe usually can't autoplay, the Façade waits for the first click ("🔊 This overview has sound…", max 12 s) and that click opens the eye with the sting.
