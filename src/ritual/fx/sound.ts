// The Goat's voice, synthesized with WebAudio — no network, no licensing. Also the fallback for
// every file-based track in tracks.ts. The context is unlocked on the first user click (browsers
// block audio before a gesture, and a Cribl app is a cross-origin iframe).

export type Cue = 'rumble' | 'thud' | 'bleat' | 'scream' | 'choir' | 'glitch' | 'lullaby' | 'tick' | 'bell' | 'sting' | 'reveal' | 'unholy';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
const muteListeners = new Set<(on: boolean) => void>();

export const isMuted = (): boolean => muted;
export function onMuteChange(fn: (on: boolean) => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

/** True once this frame may play sound (a click happened here, or the host granted autoplay). */
export function audioAllowed(): boolean {
  const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
  return ctx?.state === 'running' || ua?.hasBeenActive === true;
}

export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function setMuted(on: boolean): void {
  muted = on;
  if (master && ctx) master.gain.setTargetAtTime(on ? 0 : 0.55, ctx.currentTime, 0.05);
  muteListeners.forEach((fn) => fn(on));
}

const env = (g: GainNode, t: number, attack: number, hold: number, release: number, peak = 1): void => {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.setValueAtTime(peak, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
};

function noise(c: AudioContext, seconds: number): AudioBufferSourceNode {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** A goat is a sawtooth with a fast wobble through a nasal formant. */
function goatVoice(c: AudioContext, out: AudioNode, t: number, from: number, to: number, seconds: number, peak: number): void {
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.linearRampToValueAtTime(to, t + seconds * 0.35);
  osc.frequency.linearRampToValueAtTime(from * 0.92, t + seconds);
  const lfo = c.createOscillator();
  lfo.frequency.value = 28;
  const lfoGain = c.createGain();
  lfoGain.gain.value = from * 0.09;
  lfo.connect(lfoGain).connect(osc.frequency);
  const formant = c.createBiquadFilter();
  formant.type = 'bandpass';
  formant.frequency.value = 1300;
  formant.Q.value = 3;
  const g = c.createGain();
  env(g, t, 0.03, seconds * 0.6, seconds * 0.4, peak);
  osc.connect(formant).connect(g).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + seconds + 0.05);
  lfo.stop(t + seconds + 0.05);
}

function tone(c: AudioContext, out: AudioNode, type: OscillatorType, freq: number, t: number, attack: number, hold: number, release: number, peak: number): void {
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  env(g, t, attack, hold, release, peak);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + attack + hold + release + 0.05);
}

export function play(cue: Cue): void {
  if (!ctx || !master || muted) return;
  const c = ctx;
  const out = master;
  const t = c.currentTime + 0.01;
  switch (cue) {
    case 'rumble': {
      const n = noise(c, 2.2);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 90;
      const g = c.createGain();
      env(g, t, 0.3, 0.9, 1, 1.4);
      n.connect(lp).connect(g).connect(out);
      n.start(t);
      tone(c, out, 'sine', 42, t, 0.2, 1, 1, 0.8);
      break;
    }
    case 'thud':
      tone(c, out, 'sine', 70, t, 0.005, 0.05, 0.35, 1);
      tone(c, out, 'triangle', 140, t, 0.005, 0.02, 0.15, 0.4);
      break;
    case 'bleat':
      goatVoice(c, out, t, 380, 520, 0.75, 0.5);
      break;
    case 'scream':
      goatVoice(c, out, t, 520, 980, 1.8, 0.9);
      goatVoice(c, out, t + 0.05, 260, 490, 1.8, 0.4);
      break;
    case 'choir':
      [220, 277.18, 329.63, 440, 554.37].forEach((f, i) => {
        tone(c, out, 'triangle', f, t + i * 0.04, 1.1, 1.6, 1.4, 0.12);
        tone(c, out, 'sine', f * 1.003, t + i * 0.04, 1.1, 1.6, 1.4, 0.08);
      });
      break;
    case 'glitch':
      for (let i = 0; i < 7; i++) tone(c, out, 'square', 200 + Math.random() * 2200, t + i * 0.045, 0.002, 0.02, 0.02, 0.18);
      break;
    case 'lullaby': {
      // Brahms, first phrase, gently.
      const notes = [392, 392, 466.16, 392, 392, 466.16, 392, 466.16, 622.25, 587.33, 523.25, 523.25, 466.16];
      notes.forEach((f, i) => tone(c, out, 'sine', f, t + i * 0.28, 0.02, 0.12, 0.25, 0.28));
      break;
    }
    case 'tick':
      tone(c, out, 'square', 1800, t, 0.001, 0.005, 0.03, 0.08);
      break;
    case 'sting': {
      // Horror stab: a dissonant cluster slammed on top of a noise burst.
      const n = noise(c, 1.2);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const g = c.createGain();
      env(g, t, 0.005, 0.08, 0.9, 0.9);
      n.connect(hp).connect(g).connect(out);
      n.start(t);
      [196, 207.65, 277.18, 293.66, 415.3].forEach((fr) => tone(c, out, 'sawtooth', fr, t, 0.005, 0.25, 1.4, 0.16));
      tone(c, out, 'sine', 55, t, 0.005, 0.2, 1.6, 0.9);
      break;
    }
    case 'reveal': {
      // Role reveal: a deep boom, a rising whoosh, then a bright ominous chord.
      tone(c, out, 'sine', 48, t, 0.01, 0.15, 1.3, 1);
      const n = noise(c, 0.9);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 2;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(4000, t + 0.6);
      const g = c.createGain();
      env(g, t, 0.3, 0.2, 0.3, 0.5);
      n.connect(bp).connect(g).connect(out);
      n.start(t);
      [174.61, 207.65, 261.63, 349.23, 415.3].forEach((fr) => tone(c, out, 'sawtooth', fr, t + 0.62, 0.01, 0.5, 1.6, 0.1));
      break;
    }
    case 'unholy':
      // A dark minor choir with a slow tremolo, for burning the CEO.
      [110, 130.81, 164.81, 220, 261.63].forEach((fr, i) => {
        tone(c, out, 'triangle', fr, t + i * 0.06, 1.2, 3.5, 2, 0.12);
        tone(c, out, 'sawtooth', fr * 0.998, t + i * 0.06, 1.2, 3.5, 2, 0.04);
      });
      break;
    case 'bell':
      tone(c, out, 'sine', 880, t, 0.005, 0.05, 1.2, 0.35);
      tone(c, out, 'sine', 1320, t, 0.005, 0.03, 0.8, 0.15);
      break;
  }
}

// ── Ambient drone (fallback for the background track) ───────────────────────────────────

let drone: { stop: () => void } | null = null;

export function startDrone(): void {
  if (!ctx || !master || drone) return;
  const c = ctx;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 3);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 380;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(lp.frequency);
  const oscs = [55, 55.4, 82.4, 110.3].map((fr) => {
    const o = c.createOscillator();
    o.type = fr > 100 ? 'triangle' : 'sawtooth';
    o.frequency.value = fr;
    o.connect(lp);
    o.start();
    return o;
  });
  lp.connect(g).connect(master);
  lfo.start();
  drone = {
    stop: () => {
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0.0001, now, 0.6);
      setTimeout(() => { oscs.forEach((o) => o.stop()); lfo.stop(); }, 3000);
    },
  };
}

export function stopDrone(): void {
  drone?.stop();
  drone = null;
}
