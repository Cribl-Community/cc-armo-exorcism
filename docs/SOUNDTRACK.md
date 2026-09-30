# 🐐 Soundtrack slots

Drop audio files into `public/assets/audio/` with these exact names. A slot without a file (or with one the browser can't play) falls back to a synthesized stand-in, so the ritual never goes silent.

| Slot file | When it plays | Requested source | Synth stand-in |
|---|---|---|---|
| `facade-sting.mp3` | Façade: the moment the goat eye opens in the dashboard (about 3 s after load, or on the first click) | "Surprised Horror" SFX | dissonant horror stab |
| `goat-intro.mp3` | Rite I appears: "DO YOU BELIEVE IN THE GOAT?" (fades out on YES) | "Choirs From Heaven" SFX | heavenly choir |
| `yes-reveal.mp3` | Clicking either YES | Among Us role-reveal sound | boom + whoosh + ominous chord |
| `ambient-loop.mp3` (loops) | From just after YES to the end of the rite. It ducks under the CEO's offering and stops on restart | "Scary Instrumental Music – Darkness" | low filtered drone |
| `ceo-offering.mp3` | Rite III, only when the CEO is sacrificed: from SACRIFICE until the judge leaves the altar (fades out) | "Unholy" (Epic Version) | dark minor choir |
| `priestess-chant.mp3` (loops) | Rites VII–VIII, while the High Priestess heals the Goat; cut dead when the Goat resists | "In Nomine Patris" | heavenly choir |
| `goat-scream.mp3` | Overlapping, pitch-shifted one-shots: every goatified name, the Goat resisting, the summons, the refusal, the Awakening, the final commandment | Screaming goat | synth goat scream |

## Current files (2026-09-30, licensed by the team)

All loudness-normalized to about −16 LUFS (true peak ≤ −1.5 dBFS). Total about 2.4 MB.

| File | Source | Cut |
|---|---|---|
| `facade-sting.mp3` | "Surprised Horror" (YouTube DatGnnYOHZ0) | whole, 4.7 s, 0.4 s fade-out |
| `goat-intro.mp3` | "Choirs From Heaven" (YouTube 59XByaM4XUc) | 0:02–0:24, 0.6 s fade-in, 3 s fade-out |
| `yes-reveal.mp3` | Among Us role reveal (myinstants) | whole, 4.4 s |
| `ceo-offering.mp3` | "Unholy – Epic Version" (YouTube 8NQAAUm3Hyw) | 0:52–1:32 (the loudest section), 3 s fade-out |
| `ambient-loop.mp3` | "Scary Instrumental Music – Darkness" (YouTube sRjHVV0UjGc) | 0:00–2:36, mono 64 kbps, faded ends for the loop |
| `priestess-chant.mp3` | "In Nomine Patris" (myinstants) | whole, 5.1 s, loops |
| `goat-scream.mp3` | "Screaming goat" (myinstants) | whole, 1.9 s, −14 LUFS |

To re-cut a clip, change the trim points and re-encode with ffmpeg:

```bash
ffmpeg -i source -af "atrim=start=52:end=92,asetpts=PTS-STARTPTS,afade=t=out:st=37:d=3,loudnorm=I=-16:TP=-1.5" -c:a libmp3lame -b:a 112k ceo-offering.mp3
```

## How it plays

Each slot is fetched and decoded into a WebAudio buffer at startup. That gives gapless loops, precise fades and ducking, and works before the first click. If a fetch or decode fails (for example because Cribl's fetch proxy intercepts the request), an `<audio>` element tries the file instead. If that fails too, the synth stand-in plays. In dev builds, `await __goatTracks()` in the console shows how each slot loaded.

## Notes

- **Format:** MP3 (or rename the paths in `src/ritual/fx/tracks.ts`). Trim to what's heard: the sting and reveal are 2–4 s, the intro about 6–8 s, the CEO track about 30–40 s, and the ambient loop 60–90 s with clean loop points. Keep the folder under ~6 MB so the app package stays small.
- **Volumes** are per slot in `src/ritual/fx/tracks.ts`. `M` mutes everything, files and synth alike.
- **Autoplay:** a Cribl app runs in a cross-origin iframe, so the browser usually blocks sound until the first click inside the app. The Façade then shows "🔊 This overview has sound. Click anywhere to continue." and waits for that click (at most 12 s, then it continues silently). The click triggers the eye and the sting.
- **Rights:** the team confirmed a licence for all five sounds (2026-09-30). Keep the proof of licence with the submission. YouTube Content ID may still flag the demo video, so have the licence details ready for a dispute.

## Synthesized effects (no files)

Builders' foley (card slams, gibberish voices, crickets on "…", the yeet), hover possessions (tiny bleat, sinking moan, whisper, inhale), the exorcism tension engine (quickening heartbeat under a rising string cluster, a violin screech at 97 %), the CEO's ghost wail, the haunted music box for CALM THE GOAT, static bursts, and a dry clock tick. None of them use square-wave beeps. All in `src/ritual/fx/sound.ts`.
