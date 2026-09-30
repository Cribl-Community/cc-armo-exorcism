// The Goat's voice, synthesized with WebAudio — no network, no licensing. Also the fallback for
// every file-based track in tracks.ts. The context is unlocked on the first user click (browsers
// block audio before a gesture, and a Cribl app is a cross-origin iframe).

export type Cue =
  | 'rumble' | 'thud' | 'bleat' | 'scream' | 'choir' | 'glitch' | 'lullaby' | 'tick' | 'bell' | 'sting' | 'reveal' | 'unholy'
  | 'whoosh' | 'yeet' | 'crickets' | 'babbleLow' | 'babbleHigh' | 'slam' | 'boo' | 'violin';

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

/** The shared context and master bus. Creating it needs no gesture (it starts suspended). */
export function audioBus(): { ctx: AudioContext; master: GainNode } | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
  }
  return master ? { ctx, master } : null;
}

export function unlockAudio(): void {
  const bus = audioBus();
  if (bus && bus.ctx.state === 'suspended') void bus.ctx.resume();
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

function distortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
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
    case 'glitch': {
      // Cursed radio static: bursts of band-passed noise over a distorted sub thump. No beeps.
      for (let i = 0; i < 5; i++) {
        const n = noise(c, 0.12);
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 500 + Math.random() * 3000;
        bp.Q.value = 6;
        const g = c.createGain();
        env(g, t + i * 0.06, 0.004, 0.03, 0.05, 0.55);
        n.connect(bp).connect(g).connect(out);
        n.start(t + i * 0.06);
      }
      const dist = c.createWaveShaper();
      dist.curve = distortionCurve(40);
      const g = c.createGain();
      env(g, t, 0.005, 0.1, 0.3, 0.5);
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
      o.connect(dist).connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.5);
      break;
    }
    case 'lullaby': {
      // A haunted music box winding down: detuned, slowing, sinking, and ending on the wrong note.
      const notes = [392, 392, 466.16, 392, 392, 466.16, 392, 466.16, 622.25, 587.33, 523.25, 523.25, 466.16, 440];
      let at = t;
      notes.forEach((fr, i) => {
        const sag = 1 - i * 0.012;
        tone(c, out, 'triangle', fr * sag, at, 0.004, 0.05, 0.6, 0.22);
        tone(c, out, 'sine', fr * sag * 2.01, at, 0.004, 0.02, 0.35, 0.08);
        at += 0.26 + i * 0.03;
      });
      tone(c, out, 'sawtooth', 58, t, 1.5, at - t - 1, 1.2, 0.06);
      tone(c, out, 'triangle', 466.16 * 0.94, at + 0.1, 0.004, 0.1, 1.4, 0.2);
      break;
    }
    case 'tick': {
      // A clock in an empty church: a tiny dry click, not a beep.
      const n = noise(c, 0.03);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2500;
      const g = c.createGain();
      env(g, t, 0.001, 0.004, 0.02, 0.35);
      n.connect(hp).connect(g).connect(out);
      n.start(t);
      break;
    }
    case 'whoosh': {
      const n = noise(c, 0.7);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(3500, t);
      bp.frequency.exponentialRampToValueAtTime(250, t + 0.6);
      const g = c.createGain();
      env(g, t, 0.12, 0.15, 0.4, 0.7);
      n.connect(bp).connect(g).connect(out);
      n.start(t);
      break;
    }
    case 'yeet': {
      // Slide whistle up, then a falling Doppler wail as the Forbidden Engineer leaves the ritual.
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(500, t);
      o.frequency.exponentialRampToValueAtTime(1700, t + 0.35);
      o.frequency.exponentialRampToValueAtTime(260, t + 1.2);
      const vib = c.createOscillator();
      vib.frequency.value = 7;
      const vg = c.createGain();
      vg.gain.value = 25;
      vib.connect(vg).connect(o.frequency);
      const g = c.createGain();
      env(g, t, 0.03, 0.7, 0.5, 0.35);
      o.connect(g).connect(out);
      o.start(t);
      vib.start(t);
      o.stop(t + 1.3);
      vib.stop(t + 1.3);
      play('whoosh');
      break;
    }
    case 'crickets':
      // The silence after "…": three cricket chirps.
      for (let k = 0; k < 3; k++) {
        for (let i = 0; i < 4; i++) tone(c, out, 'sine', 4400, t + k * 0.55 + i * 0.045, 0.004, 0.015, 0.02, 0.07);
      }
      break;
    case 'babbleLow':
    case 'babbleHigh': {
      // Cursed gibberish voices: formant-filtered syllables, lower for the Architect, higher for the Engineer.
      const base = cue === 'babbleLow' ? 120 : 210;
      const syllables = 7 + Math.floor(Math.random() * 4);
      for (let i = 0; i < syllables; i++) {
        const at = t + i * 0.085;
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(base * (0.8 + Math.random() * 0.6), at);
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 600 + Math.random() * 1400;
        bp.Q.value = 5;
        const g = c.createGain();
        env(g, at, 0.01, 0.03, 0.03, 0.45);
        o.connect(bp).connect(g).connect(out);
        o.start(at);
        o.stop(at + 0.09);
      }
      break;
    }
    case 'slam': {
      tone(c, out, 'sine', 60, t, 0.003, 0.06, 0.5, 1.2);
      const n = noise(c, 0.25);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1200;
      const g = c.createGain();
      env(g, t, 0.002, 0.03, 0.2, 0.8);
      n.connect(lp).connect(g).connect(out);
      n.start(t);
      break;
    }
    case 'boo': {
      // The CEO's ghost wails: a sliding vibrato moan with an echo.
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(620, t);
      o.frequency.exponentialRampToValueAtTime(330, t + 1.6);
      const vib = c.createOscillator();
      vib.frequency.value = 5;
      const vg = c.createGain();
      vg.gain.value = 18;
      vib.connect(vg).connect(o.frequency);
      const g = c.createGain();
      env(g, t, 0.3, 0.8, 0.8, 0.28);
      const delay = c.createDelay(1);
      delay.delayTime.value = 0.28;
      const fb = c.createGain();
      fb.gain.value = 0.4;
      o.connect(g);
      g.connect(out);
      g.connect(delay).connect(fb).connect(delay);
      fb.connect(out);
      o.start(t);
      vib.start(t);
      o.stop(t + 2);
      vib.stop(t + 2);
      break;
    }
    case 'violin': {
      // The shower-scene screech, for 97 %.
      [1480, 1568, 1661].forEach((fr, i) => {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(fr, t + i * 0.09);
        o.frequency.linearRampToValueAtTime(fr * 1.06, t + i * 0.09 + 0.3);
        const vib = c.createOscillator();
        vib.frequency.value = 11;
        const vg = c.createGain();
        vg.gain.value = 30;
        vib.connect(vg).connect(o.frequency);
        const bp = c.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2500;
        bp.Q.value = 1;
        const g = c.createGain();
        env(g, t + i * 0.09, 0.005, 0.25, 0.25, 0.22);
        o.connect(bp).connect(g).connect(out);
        o.start(t + i * 0.09);
        vib.start(t + i * 0.09);
        o.stop(t + i * 0.09 + 0.6);
        vib.stop(t + i * 0.09 + 0.6);
      });
      break;
    }
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

// ── Hover possessions: each button hover picks a variant, sound and animation together ───

export const HOVER_VARIANTS = ['jitter', 'melt', 'eyes', 'flip'] as const;
export type HoverVariant = (typeof HOVER_VARIANTS)[number];

export function playHover(variant: HoverVariant): void {
  if (!ctx || !master || muted) return;
  const c = ctx;
  const out = master;
  const t = c.currentTime + 0.005;
  switch (variant) {
    case 'jitter':
      // A tiny possessed bleat at a random pitch.
      goatVoice(c, out, t, 300 + Math.random() * 350, 500 + Math.random() * 400, 0.28, 0.22);
      break;
    case 'melt': {
      // Something sinking: a detuned moan sliding down.
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(420, t);
      o.frequency.exponentialRampToValueAtTime(120, t + 0.5);
      const g = c.createGain();
      env(g, t, 0.02, 0.2, 0.3, 0.2);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.6);
      break;
    }
    case 'eyes': {
      // A whisper right behind you.
      const n = noise(c, 0.45);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2200;
      bp.Q.value = 3;
      const g = c.createGain();
      env(g, t, 0.08, 0.12, 0.22, 0.35);
      n.connect(bp).connect(g).connect(out);
      n.start(t);
      break;
    }
    case 'flip': {
      // A reversed swell, like the room inhaling.
      const n = noise(c, 0.4);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(300, t);
      lp.frequency.exponentialRampToValueAtTime(5000, t + 0.35);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.34);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      n.connect(lp).connect(g).connect(out);
      n.start(t);
      break;
    }
  }
}

// ── Tension engine for the exorcism: a quickening heartbeat under a rising string cluster ──

export interface Tension {
  /** 0 = unease, 1 = about to break. */
  set: (level: number) => void;
  stop: () => void;
}

export function startTension(): Tension {
  if (!ctx || !master) return { set: () => undefined, stop: () => undefined };
  const c = ctx;
  const bus = c.createGain();
  bus.gain.setValueAtTime(0.0001, c.currentTime);
  bus.gain.exponentialRampToValueAtTime(1, c.currentTime + 1.5);
  bus.connect(master);

  // Low string cluster through a filter that opens as the tension rises.
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const clusterGain = c.createGain();
  clusterGain.gain.value = 0.05;
  lp.connect(clusterGain).connect(bus);
  const cluster = [55, 58.27, 82.41, 87.31, 110, 116.54].map((fr) => {
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = fr;
    o.connect(lp);
    o.start();
    return o;
  });

  // High tremolo strings that fade in near the end.
  const hi = c.createOscillator();
  hi.type = 'sawtooth';
  hi.frequency.value = 880;
  const trem = c.createOscillator();
  trem.frequency.value = 9;
  const tremGain = c.createGain();
  tremGain.gain.value = 0.5;
  const hiAmp = c.createGain();
  hiAmp.gain.value = 0.5;
  trem.connect(tremGain).connect(hiAmp.gain);
  const hiBp = c.createBiquadFilter();
  hiBp.type = 'bandpass';
  hiBp.frequency.value = 1800;
  const hiGain = c.createGain();
  hiGain.gain.value = 0.0001;
  hi.connect(hiAmp).connect(hiBp).connect(hiGain).connect(bus);
  hi.start();
  trem.start();

  let level = 0;
  let stopped = false;
  let beatTimer = 0;
  const beat = () => {
    if (stopped) return;
    const at = c.currentTime + 0.01;
    tone(c, bus, 'sine', 52, at, 0.004, 0.05, 0.18, 0.9 + level * 0.5);
    tone(c, bus, 'sine', 46, at + 0.16, 0.004, 0.04, 0.16, 0.6 + level * 0.4);
    const interval = 950 - level * 620;
    beatTimer = window.setTimeout(beat, interval);
  };
  beat();

  return {
    set: (lv) => {
      level = Math.max(0, Math.min(1, lv));
      const now = c.currentTime;
      lp.frequency.setTargetAtTime(300 + level * 2600, now, 0.4);
      clusterGain.gain.setTargetAtTime(0.05 + level * 0.12, now, 0.4);
      cluster.forEach((o, i) => o.detune.setTargetAtTime(level * (i % 2 ? 35 : -35), now, 0.5));
      hiGain.gain.setTargetAtTime(level > 0.5 ? (level - 0.5) * 0.18 : 0.0001, now, 0.4);
      trem.frequency.setTargetAtTime(9 + level * 8, now, 0.4);
    },
    stop: () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(beatTimer);
      const now = c.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(0.0001, now, 0.05);
      window.setTimeout(() => {
        cluster.forEach((o) => o.stop());
        hi.stop();
        trem.stop();
        bus.disconnect();
      }, 800);
    },
  };
}
