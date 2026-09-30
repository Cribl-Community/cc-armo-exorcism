# 🐐 Soundtrack slots

Drop audio files into `public/assets/audio/` with these exact names. A slot without a file (or with one the browser can't play) falls back to a synthesized stand-in, so the ritual never goes silent.

| Slot file | When it plays | Requested source | Synth stand-in |
|---|---|---|---|
| `facade-sting.mp3` | Façade: the moment the goat eye opens in the dashboard (about 3 s after load, or on the first click) | "Surprised Horror" SFX | dissonant horror stab |
| `goat-intro.mp3` | Rite I appears: "DO YOU BELIEVE IN THE GOAT?" (fades out on YES) | "Choirs From Heaven" SFX | heavenly choir |
| `yes-reveal.mp3` | Clicking either YES | Among Us role-reveal sound | boom + whoosh + ominous chord |
| `ambient-loop.mp3` (loops) | From just after YES to the end of the rite. It ducks under the CEO's offering and stops on restart | "Scary Instrumental Music – Darkness" | low filtered drone |
| `ceo-offering.mp3` | Rite III, only when the CEO is sacrificed: from SACRIFICE until the judge leaves the altar (fades out) | "Unholy" (Epic Version) | dark minor choir |

## Notes

- **Format:** MP3 (or rename the paths in `src/ritual/fx/tracks.ts`). Trim to what's heard: the sting and reveal are 2–4 s, the intro about 6–8 s, the CEO track about 30–40 s, and the ambient loop 60–90 s with clean loop points. Keep the folder under ~6 MB so the app package stays small.
- **Volumes** are per slot in `src/ritual/fx/tracks.ts`. `M` mutes everything, files and synth alike.
- **Autoplay:** a Cribl app runs in a cross-origin iframe, so the browser usually blocks sound until the first click inside the app. The Façade then shows "🔊 This overview has sound. Click anywhere to continue." and waits for that click (at most 12 s, then it continues silently). The click triggers the eye and the sting.
- **Rights:** this repo is public and the app is distributed to judges. Only commit audio you are allowed to redistribute: your own recordings, CC0 or royalty-free libraries (e.g. Pixabay, Freesound CC0), or clips you have a licence for. Commercial music ("Unholy") and game audio (Among Us) are copyrighted. The demo video will also be matched by YouTube Content ID if it contains them.
