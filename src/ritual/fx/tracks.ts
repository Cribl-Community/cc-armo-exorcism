// File-based soundtrack: one named slot per ritual moment. Drop an audio file with the slot's name
// into public/assets/audio/ and it plays; without one, the synthesized cue in sound.ts plays
// instead, so the ritual never goes silent. See docs/SOUNDTRACK.md for the slot list.
import { isMuted, onMuteChange, play, startDrone, stopDrone, type Cue } from './sound';

export type Track = 'facade' | 'intro' | 'ceo' | 'ambient' | 'yes';

interface TrackDef {
  file: string;
  volume: number;
  loop?: boolean;
  /** Synth stand-in when the file is missing or cannot play. */
  fallback: Cue | 'drone';
}

const TRACKS: Record<Track, TrackDef> = {
  facade: { file: 'assets/audio/facade-sting.mp3', volume: 0.9, fallback: 'sting' },
  intro: { file: 'assets/audio/goat-intro.mp3', volume: 0.75, fallback: 'choir' },
  ceo: { file: 'assets/audio/ceo-offering.mp3', volume: 0.8, fallback: 'unholy' },
  ambient: { file: 'assets/audio/ambient-loop.mp3', volume: 0.28, loop: true, fallback: 'drone' },
  yes: { file: 'assets/audio/yes-reveal.mp3', volume: 0.9, fallback: 'reveal' },
};

type Status = 'loading' | 'ready' | 'missing';
const els = new Map<Track, HTMLAudioElement>();
const status = new Map<Track, Status>();
const fades = new Map<Track, number>();
let ducked = false;
let ambientOn = false;

/** Start loading every slot. Missing files are detected here and fall back to synth. */
export function preloadTracks(): void {
  (Object.keys(TRACKS) as Track[]).forEach((t) => {
    if (els.has(t)) return;
    const def = TRACKS[t];
    const el = new Audio();
    el.preload = 'auto';
    el.loop = Boolean(def.loop);
    el.volume = def.volume;
    el.muted = isMuted();
    status.set(t, 'loading');
    el.addEventListener('canplaythrough', () => status.set(t, 'ready'), { once: true });
    el.addEventListener('error', () => status.set(t, 'missing'), { once: true });
    el.src = def.file;
    els.set(t, el);
  });
}

onMuteChange((on) => els.forEach((el) => { el.muted = on; }));

function fadeTo(t: Track, target: number, ms: number, then?: () => void): void {
  const el = els.get(t);
  if (!el) return;
  window.clearInterval(fades.get(t));
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let i = 0;
  const id = window.setInterval(() => {
    i++;
    el.volume = Math.min(1, Math.max(0, from + ((target - from) * i) / steps));
    if (i >= steps) {
      window.clearInterval(id);
      then?.();
    }
  }, 50);
  fades.set(t, id);
}

const ambientLevel = () => (ducked ? TRACKS.ambient.volume * 0.15 : TRACKS.ambient.volume);

/** Play a one-shot slot (or the looping ambient). Returns true if the file played, false if the synth stood in. */
export function playTrack(t: Track): boolean {
  const def = TRACKS[t];
  const el = els.get(t);
  const useFile = el && status.get(t) !== 'missing';
  if (useFile) {
    window.clearInterval(fades.get(t));
    el.currentTime = 0;
    el.volume = t === 'ambient' ? 0 : def.volume;
    el.play().then(
      () => { if (t === 'ambient') fadeTo('ambient', ambientLevel(), 2500); },
      () => synth(t), // blocked or undecodable: the synth stands in
    );
    return true;
  }
  synth(t);
  return false;
}

function synth(t: Track): void {
  const fb = TRACKS[t].fallback;
  if (fb === 'drone') startDrone();
  else play(fb);
}

export function stopTrack(t: Track, fadeMs = 800): void {
  const el = els.get(t);
  if (t === 'ambient') stopDrone();
  if (!el || el.paused) return;
  fadeTo(t, 0, fadeMs, () => {
    el.pause();
    el.currentTime = 0;
    el.volume = TRACKS[t].volume;
  });
}

/** The background track runs from the first YES to the end of the rite. */
export function startAmbient(): void {
  if (ambientOn) return;
  ambientOn = true;
  playTrack('ambient');
}

export function stopAmbient(): void {
  ambientOn = false;
  stopTrack('ambient', 1500);
}

/** Lower the background track while a featured track plays over it. */
export function duckAmbient(on: boolean): void {
  ducked = on;
  const el = els.get('ambient');
  if (el && !el.paused) fadeTo('ambient', ambientLevel(), on ? 400 : 1500);
}

export function stopAllTracks(): void {
  (Object.keys(TRACKS) as Track[]).forEach((t) => stopTrack(t, 500));
  ambientOn = false;
  ducked = false;
}
