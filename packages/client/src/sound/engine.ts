/**
 * Tiny Web Audio synth for interface cues. No audio files: every cue is a short
 * list of voices (oscillator or noise → optional filter → AD envelope).
 */

export const SOUND_NAMES = [
  'tap',
  'soft',
  'select',
  'destructive',
  'blocked',
  'toggleOn',
  'toggleOff',
  'open',
  'close',
  'tick',
  'key',
  'copy',
  'success',
  'error',
  'warning',
  'notification',
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

interface Voice {
  wave: OscillatorType | 'noise';
  /** Start frequency (Hz); ignored for noise. */
  freq: number;
  /** Glide target frequency. */
  to?: number;
  /** Delay before this voice starts (s). */
  at?: number;
  /** Total length (s). */
  dur: number;
  gain: number;
  attack?: number;
  filter?: { type: BiquadFilterType; freq: number; q?: number };
}

const PATCHES: Record<SoundName, Voice[]> = {
  tap: [
    { wave: 'triangle', freq: 1250, to: 820, dur: 0.045, gain: 0.22 },
    { wave: 'noise', freq: 0, dur: 0.012, gain: 0.05, filter: { type: 'highpass', freq: 4000 } },
  ],
  soft: [{ wave: 'sine', freq: 1100, to: 800, dur: 0.035, gain: 0.12 }],
  select: [{ wave: 'sine', freq: 1500, to: 1300, dur: 0.04, gain: 0.14 }],
  destructive: [
    { wave: 'triangle', freq: 420, to: 240, dur: 0.1, gain: 0.3 },
    { wave: 'noise', freq: 0, dur: 0.02, gain: 0.06, filter: { type: 'lowpass', freq: 1800 } },
  ],
  blocked: [
    { wave: 'square', freq: 170, dur: 0.05, gain: 0.08, filter: { type: 'lowpass', freq: 700 } },
    { wave: 'square', freq: 170, at: 0.07, dur: 0.05, gain: 0.08, filter: { type: 'lowpass', freq: 700 } },
  ],
  toggleOn: [
    { wave: 'sine', freq: 660, dur: 0.05, gain: 0.16 },
    { wave: 'sine', freq: 990, at: 0.045, dur: 0.06, gain: 0.16 },
  ],
  toggleOff: [
    { wave: 'sine', freq: 990, dur: 0.05, gain: 0.14 },
    { wave: 'sine', freq: 660, at: 0.045, dur: 0.06, gain: 0.14 },
  ],
  open: [
    { wave: 'noise', freq: 0, dur: 0.14, gain: 0.07, attack: 0.05, filter: { type: 'bandpass', freq: 1400, q: 0.8 } },
    { wave: 'sine', freq: 520, to: 880, dur: 0.12, gain: 0.08, attack: 0.02 },
  ],
  close: [
    { wave: 'noise', freq: 0, dur: 0.12, gain: 0.06, attack: 0.03, filter: { type: 'bandpass', freq: 900, q: 0.8 } },
    { wave: 'sine', freq: 820, to: 480, dur: 0.1, gain: 0.07, attack: 0.01 },
  ],
  tick: [{ wave: 'sine', freq: 2100, dur: 0.018, gain: 0.08 }],
  key: [{ wave: 'triangle', freq: 1700, to: 1500, dur: 0.025, gain: 0.12 }],
  copy: [
    { wave: 'sine', freq: 1200, to: 1800, dur: 0.06, gain: 0.14 },
    { wave: 'sine', freq: 2400, at: 0.05, dur: 0.05, gain: 0.06 },
  ],
  success: [
    { wave: 'sine', freq: 880, dur: 0.1, gain: 0.16 },
    { wave: 'sine', freq: 1320, at: 0.08, dur: 0.16, gain: 0.16 },
  ],
  error: [
    { wave: 'triangle', freq: 330, dur: 0.1, gain: 0.22, filter: { type: 'lowpass', freq: 1500 } },
    { wave: 'triangle', freq: 233, at: 0.09, dur: 0.16, gain: 0.22, filter: { type: 'lowpass', freq: 1500 } },
  ],
  warning: [
    { wave: 'triangle', freq: 620, dur: 0.07, gain: 0.16 },
    { wave: 'triangle', freq: 620, at: 0.11, dur: 0.09, gain: 0.16 },
  ],
  notification: [
    { wave: 'sine', freq: 1320, dur: 0.08, gain: 0.13 },
    { wave: 'sine', freq: 1760, at: 0.07, dur: 0.14, gain: 0.13 },
  ],
};

export const CLAY_SOUND_KEY = 'clay-sound';
export const CLAY_SOUND_VOLUME_KEY = 'clay-sound-volume';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let volume = readVolume();
const lastPlayed = new Map<SoundName, number>();

function readVolume(): number {
  try {
    const v = Number(localStorage.getItem(CLAY_SOUND_VOLUME_KEY));
    if (localStorage.getItem(CLAY_SOUND_VOLUME_KEY) != null && Number.isFinite(v)) {
      return Math.min(1, Math.max(0, v));
    }
  } catch {}
  return 0.5;
}

/** Sound is on when `<html data-sound="on">` (server default or remembered choice). */
export function isSoundEnabled(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.sound === 'on';
}

const soundListeners = new Set<() => void>();

/** Subscribe to enabled-state changes (for the mute button). */
export function subscribeSound(fn: () => void): () => void {
  soundListeners.add(fn);
  return () => soundListeners.delete(fn);
}

/**
 * True once sound is part of this app: on now, or a choice was remembered
 * (so a muted user can still unmute). Apps that never enable sound show no toggle.
 */
export function isSoundAvailable(): boolean {
  if (isSoundEnabled()) return true;
  try {
    return localStorage.getItem(CLAY_SOUND_KEY) != null;
  } catch {
    return false;
  }
}

/** Apply a server `sound` op (or the mute button) and remember it across reloads. */
export function applySound(opts: { enabled?: boolean; volume?: number }): void {
  if (opts.enabled !== undefined) {
    document.documentElement.dataset.sound = opts.enabled ? 'on' : 'off';
    try {
      localStorage.setItem(CLAY_SOUND_KEY, opts.enabled ? 'on' : 'off');
    } catch {}
    for (const fn of soundListeners) fn();
  }
  if (opts.volume !== undefined && Number.isFinite(opts.volume)) {
    volume = Math.min(1, Math.max(0, opts.volume));
    if (master) master.gain.value = volume;
    try {
      localStorage.setItem(CLAY_SOUND_VOLUME_KEY, String(volume));
    } catch {}
  }
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

export interface PlayOptions {
  /** Ignore the enabled flag (server-requested `ui.sound.play`). */
  force?: boolean;
  /** Pitch multiplier (e.g. menu position). */
  pitch?: number;
}

/** Play a cue. No-op when disabled, unsupported, or the same cue fired < 30 ms ago. */
export function playSound(name: SoundName, opts: PlayOptions = {}): void {
  if (!opts.force && !isSoundEnabled()) return;
  const patch = PATCHES[name];
  if (!patch) return;
  const now = performance.now();
  if (now - (lastPlayed.get(name) ?? 0) < 30) return;
  lastPlayed.set(name, now);

  const ac = audio();
  if (!ac || !master) return;
  if (ac.state === 'suspended') void ac.resume();

  // Small random variation so repeats don't sound mechanical.
  const pitch = (opts.pitch ?? 1) * (1 + (Math.random() - 0.5) * 0.04);
  const velocity = 1 + (Math.random() - 0.5) * 0.15;
  const t0 = ac.currentTime + 0.005;

  for (const v of patch) {
    const start = t0 + (v.at ?? 0);
    const end = start + v.dur;
    const attack = Math.min(v.attack ?? 0.003, v.dur / 2);

    let src: AudioScheduledSourceNode;
    if (v.wave === 'noise') {
      const n = ac.createBufferSource();
      n.buffer = noiseBuf;
      src = n;
    } else {
      const o = ac.createOscillator();
      o.type = v.wave;
      o.frequency.setValueAtTime(v.freq * pitch, start);
      if (v.to) o.frequency.exponentialRampToValueAtTime(v.to * pitch, end);
      src = o;
    }

    const env = ac.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(v.gain * velocity, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);

    let node: AudioNode = src;
    if (v.filter) {
      const f = ac.createBiquadFilter();
      f.type = v.filter.type;
      f.frequency.value = v.filter.freq;
      if (v.filter.q != null) f.Q.value = v.filter.q;
      node.connect(f);
      node = f;
    }
    node.connect(env);
    env.connect(master);
    src.start(start);
    src.stop(end + 0.02);
  }
}

export function isSoundName(name: unknown): name is SoundName {
  return typeof name === 'string' && (SOUND_NAMES as readonly string[]).includes(name);
}
