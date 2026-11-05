import { getCurrentSession } from './context';

/** Built-in interface cues synthesized by the client (Web Audio, no files). */
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

/**
 * Turn automatic interaction sounds on/off for this client (remembered across reloads).
 * Prefer `ui.sound.set`.
 */
export function setSound(enabled: boolean): void {
  getCurrentSession()?.setSound({ enabled });
}

/** Master volume 0–1 for this client (remembered across reloads). Default 0.5. */
export function setSoundVolume(volume: number): void {
  if (!Number.isFinite(volume)) throw new Error(`Invalid sound volume: ${volume}`);
  getCurrentSession()?.setSound({ volume: Math.min(1, Math.max(0, volume)) });
}

/** Play one cue now, even when automatic sounds are off. */
export function playSound(name: SoundName): void {
  if (!(SOUND_NAMES as readonly string[]).includes(name)) throw new Error(`Unknown sound: ${name}`);
  getCurrentSession()?.setSound({ play: name });
}

/** Interface sound cues (`ui.sound.set` / `ui.sound.volume` / `ui.sound.play`). */
export const sound = {
  set: setSound,
  volume: setSoundVolume,
  play: playSound,
  names: SOUND_NAMES,
};
