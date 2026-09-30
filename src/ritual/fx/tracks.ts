// File-based soundtrack: one named slot per ritual moment (see docs/SOUNDTRACK.md).
//
// Each slot is decoded into a WebAudio buffer (gapless loops, precise fades and ducking). If the
// file can't be fetched or decoded, an <audio> element tries it instead; if that fails too, the
// synthesized cue in sound.ts stands in, so the ritual never goes silent.
import { audioBus, isMuted, onMuteChange, play, startDrone, stopDrone, type Cue } from './sound';

export type Track = 'facade' | 'intro' | 'ceo' | 'ambient' | 'yes' | 'chant' | 'scream';

interface TrackDef {
  file: string;
  volume: number;
  loop?: boolean;
  /** Synth stand-in when the file is missing or cannot play. */
  fallback: Cue | 'drone';
}

const TRACKS: Record<Track, TrackDef> = {
  facade: { file: 'assets/audio/facade-sting.mp3', volume: 1, fallback: 'sting' },
  intro: { file: 'assets/audio/goat-intro.mp3', volume: 0.8, fallback: 'choir' },
  ceo: { file: 'assets/audio/ceo-offering.mp3', volume: 0.9, fallback: 'unholy' },
  ambient: { file: 'assets/audio/ambient-loop.mp3', volume: 0.32, loop: true, fallback: 'drone' },
  yes: { file: 'assets/audio/yes-reveal.mp3', volume: 1, fallback: 'reveal' },
  chant: { file: 'assets/audio/priestess-chant.mp3', volume: 0.85, loop: true, fallback: 'choir' },
  scream: { file: 'assets/audio/goat-scream.mp3', volume: 0.85, fallback: 'scream' },
};

const DUCK = 0.15;

// ── Backends ──────────────────────────────────────────────────────────────────────────────

interface Playing {
  stop: (fadeMs: number) => void;
  setLevel: (level: number, rampMs: number) => void;
}

type Loaded =
  | { kind: 'buffer'; buffer: AudioBuffer }
  | { kind: 'element'; el: HTMLAudioElement }
  | { kind: 'missing' };

const loaded = new Map<Track, Promise<Loaded>>();
const playing = new Map<Track, Playing>();
let musicBus: GainNode | null = null;
let ducked = false;
let ambientOn = false;

function bus(): { ctx: AudioContext; out: GainNode } | null {
  const b = audioBus();
  if (!b) return null;
  if (!musicBus) {
    musicBus = b.ctx.createGain();
    musicBus.gain.value = isMuted() ? 0 : 1;
    musicBus.connect(b.ctx.destination);
  }
  return { ctx: b.ctx, out: musicBus };
}

onMuteChange((on) => {
  const b = audioBus();
  if (musicBus && b) musicBus.gain.setTargetAtTime(on ? 0 : 1, b.ctx.currentTime, 0.05);
  loaded.forEach((p) => void p.then((l) => { if (l.kind === 'element') l.el.muted = on; }));
});

function loadAsElement(def: TrackDef): Promise<Loaded> {
  return new Promise((resolve) => {
    const el = new Audio();
    el.preload = 'auto';
    el.loop = Boolean(def.loop);
    el.muted = isMuted();
    el.addEventListener('canplaythrough', () => resolve({ kind: 'element', el }), { once: true });
    el.addEventListener('error', () => resolve({ kind: 'missing' }), { once: true });
    el.src = def.file;
  });
}

async function load(def: TrackDef): Promise<Loaded> {
  const b = bus();
  try {
    const res = await fetch(def.file);
    const type = res.headers.get('content-type') ?? '';
    // Not an audio file (e.g. a proxy or dev-server fallback page): let an <audio> element try.
    if (!res.ok || type.includes('text/html')) return loadAsElement(def);
    if (!b) return loadAsElement(def);
    const buffer = await b.ctx.decodeAudioData(await res.arrayBuffer());
    return { kind: 'buffer', buffer };
  } catch {
    return loadAsElement(def);
  }
}

/** Start loading every slot. Call once at startup; decoding works before the first click. */
export function preloadTracks(): void {
  (Object.keys(TRACKS) as Track[]).forEach((t) => {
    if (!loaded.has(t)) loaded.set(t, load(TRACKS[t]));
  });
}

function startBuffer(t: Track, buffer: AudioBuffer, level: number): Playing | null {
  const b = bus();
  if (!b) return null;
  const src = b.ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = Boolean(TRACKS[t].loop);
  const gain = b.ctx.createGain();
  const now = b.ctx.currentTime;
  const fadeIn = t === 'ambient' ? 2.5 : 0.02;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(level, now + fadeIn);
  src.connect(gain).connect(b.out);
  src.start();
  return {
    stop: (fadeMs) => {
      const at = b.ctx.currentTime;
      gain.gain.cancelScheduledValues(at);
      gain.gain.setValueAtTime(gain.gain.value, at);
      gain.gain.linearRampToValueAtTime(0.0001, at + fadeMs / 1000);
      src.stop(at + fadeMs / 1000 + 0.05);
    },
    setLevel: (lv, rampMs) => {
      const at = b.ctx.currentTime;
      gain.gain.cancelScheduledValues(at);
      gain.gain.setValueAtTime(gain.gain.value, at);
      gain.gain.linearRampToValueAtTime(lv, at + rampMs / 1000);
    },
  };
}

function startElement(el: HTMLAudioElement, level: number, onBlocked: () => void): Playing {
  let fade = 0;
  const rampTo = (target: number, ms: number, then?: () => void) => {
    window.clearInterval(fade);
    const from = el.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;
    fade = window.setInterval(() => {
      i++;
      el.volume = Math.min(1, Math.max(0, from + ((target - from) * i) / steps));
      if (i >= steps) {
        window.clearInterval(fade);
        then?.();
      }
    }, 50);
  };
  el.currentTime = 0;
  el.volume = level;
  el.play().catch(onBlocked);
  return {
    stop: (ms) => rampTo(0, ms, () => { el.pause(); el.currentTime = 0; }),
    setLevel: (lv, ms) => rampTo(lv, ms),
  };
}

const levelFor = (t: Track): number => TRACKS[t].volume * (t === 'ambient' && ducked ? DUCK : 1);

function synth(t: Track): void {
  const fb = TRACKS[t].fallback;
  if (fb === 'drone') startDrone();
  else play(fb);
}

// ── Public API ────────────────────────────────────────────────────────────────────────────

/** Play a slot: its file if available, otherwise the synth stand-in. */
export function playTrack(t: Track): void {
  playing.get(t)?.stop(150);
  playing.delete(t);
  const pending = loaded.get(t) ?? load(TRACKS[t]);
  loaded.set(t, pending);
  const requestedAt = performance.now();
  void pending.then((l) => {
    // A one-shot that took too long to load would land out of place: use the synth instead.
    const late = !TRACKS[t].loop && performance.now() - requestedAt > 1500;
    if (l.kind === 'missing' || late) {
      synth(t);
      return;
    }
    const p = l.kind === 'buffer' ? startBuffer(t, l.buffer, levelFor(t)) : startElement(l.el, levelFor(t), () => synth(t));
    if (p) playing.set(t, p);
    else synth(t);
  });
}

/**
 * Fire a slot as an overlapping one-shot at a given playback rate (a herd of screaming goats at
 * different pitches). Does not stop earlier instances.
 */
export function playLayer(t: Track, rate = 1, level = 1): void {
  const pending = loaded.get(t) ?? load(TRACKS[t]);
  loaded.set(t, pending);
  void pending.then((l) => {
    if (l.kind === 'buffer') {
      const b = bus();
      if (!b) return;
      const src = b.ctx.createBufferSource();
      src.buffer = l.buffer;
      src.playbackRate.value = rate;
      const g = b.ctx.createGain();
      g.gain.value = TRACKS[t].volume * level;
      src.connect(g).connect(b.out);
      src.start();
    } else if (l.kind === 'element') {
      const el = l.el.cloneNode() as HTMLAudioElement;
      el.playbackRate = rate;
      el.volume = Math.min(1, TRACKS[t].volume * level);
      el.muted = isMuted();
      el.play().catch(() => synth(t));
    } else {
      synth(t);
    }
  });
}

/** Play a slot unless it is already playing (a scene handing a track to the next scene). */
export function ensureTrack(t: Track): void {
  if (!playing.has(t)) playTrack(t);
}

export function stopTrack(t: Track, fadeMs = 800): void {
  if (t === 'ambient') stopDrone();
  playing.get(t)?.stop(fadeMs);
  playing.delete(t);
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
  if (ducked === on) return;
  ducked = on;
  playing.get('ambient')?.setLevel(levelFor('ambient'), on ? 400 : 1500);
}

export function stopAllTracks(): void {
  (Object.keys(TRACKS) as Track[]).forEach((t) => stopTrack(t, 500));
  ambientOn = false;
  ducked = false;
}

// Dev only: `await __goatTracks()` in the console shows how each slot loaded (buffer / element / missing).
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__goatTracks = async () =>
    Object.fromEntries(await Promise.all([...loaded].map(async ([t, p]) => [t, (await p).kind] as const)));
}
