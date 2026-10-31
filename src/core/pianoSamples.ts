/** One recorded sample and the keys and velocities it plays for. */
export interface SampleRegion {
  /** File name inside `public/piano/`. */
  file: string;
  /** The MIDI note the sample was recorded at. */
  root: number;
  lowKey: number;
  highKey: number;
  lowVelocity: number;
  highVelocity: number;
}

export interface PickedSample {
  region: SampleRegion;
  /** Playback speed that moves the sample from its root to the played note. */
  playbackRate: number;
  /** Loudness from the velocity, 0..1. The samples are levelled, so this is the only dynamics curve. */
  gain: number;
}

/** The piano's range: A0 to C8. */
export const LOWEST_NOTE = 21;
export const HIGHEST_NOTE = 108;
/** The most a sample may be shifted in pitch (FR-2). */
export const MAX_SHIFT = 2;

const VELOCITY_EXPONENT = 2;

export function velocityGain(velocity: number): number {
  const v = Math.min(127, Math.max(1, Math.round(velocity)));
  return (v / 127) ** VELOCITY_EXPONENT;
}

/** The sample for a note and velocity, or `null` for a note outside A0–C8. */
export function pickSample(
  map: readonly SampleRegion[],
  note: number,
  velocity: number,
): PickedSample | null {
  const v = Math.min(127, Math.max(1, Math.round(velocity)));
  const region = map.find(
    (r) => note >= r.lowKey && note <= r.highKey && v >= r.lowVelocity && v <= r.highVelocity,
  );
  if (!region) return null;
  return { region, playbackRate: 2 ** ((note - region.root) / 12), gain: velocityGain(v) };
}

const LONGEST_RELEASE = 0.3;
const SHORTEST_RELEASE = 0.1;

/** Damper fade in seconds: a little longer in the bass, as on a real piano. */
export function releaseTime(note: number): number {
  const t =
    (Math.min(HIGHEST_NOTE, Math.max(LOWEST_NOTE, note)) - LOWEST_NOTE) /
    (HIGHEST_NOTE - LOWEST_NOTE);
  return LONGEST_RELEASE - (LONGEST_RELEASE - SHORTEST_RELEASE) * t;
}

/**
 * Index of the first sample that is louder than the threshold, so encoder padding and leading
 * silence don't delay the attack. A silent buffer starts at 0.
 */
export function onsetIndex(channel: ArrayLike<number>, threshold = 0.001): number {
  for (let i = 0; i < channel.length; i++) {
    if (Math.abs(channel[i]) > threshold) return i;
  }
  return 0;
}

export interface Impulse {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
}

/**
 * A small room: decaying noise that loses its high frequencies over time, a different noise per
 * ear. `random` returns numbers in [0, 1) so the result can be made repeatable in tests.
 */
export function impulseResponse(
  seconds: number,
  sampleRate: number,
  random: () => number = Math.random,
): Impulse {
  const length = Math.max(1, Math.round(seconds * sampleRate));
  const preDelay = Math.round(0.01 * sampleRate);
  // 60 dB of decay over `seconds`.
  const tau = seconds / Math.log(1000);

  const channel = () => {
    const out = new Float32Array(length);
    let low = 0;
    for (let n = preDelay; n < length; n++) {
      const t = (n - preDelay) / sampleRate;
      const noise = random() * 2 - 1;
      // One-pole low-pass: bright at the start, dark at the end.
      const open = 0.6 * Math.exp(-t / (seconds / 3)) + 0.05;
      low += open * (noise - low);
      out[n] = low * Math.exp(-t / tau);
    }
    // Unit energy, so the wet level alone sets how much room is heard (the convolver's own
    // normalisation is switched off; it made a noise impulse nearly inaudible).
    let energy = 0;
    for (const value of out) energy += value * value;
    const scale = energy > 0 ? 1 / Math.sqrt(energy) : 0;
    for (let n = 0; n < length; n++) out[n] *= scale;
    return out;
  };
  return { left: channel(), right: channel() };
}

/**
 * Problems in a sample map, for tests and the build script. An empty list means that every key
 * A0–C8 has a sample for every velocity, within `MAX_SHIFT` semitones.
 */
export function mapProblems(map: readonly SampleRegion[]): string[] {
  const problems: string[] = [];
  for (const region of map) {
    if (region.lowKey > region.highKey) problems.push(`${region.file}: keys reversed`);
    if (region.lowVelocity > region.highVelocity)
      problems.push(`${region.file}: velocities reversed`);
    if (region.root < region.lowKey - MAX_SHIFT || region.root > region.highKey + MAX_SHIFT) {
      // Checked per note below, but a root far outside its range is a mistake worth naming.
      problems.push(`${region.file}: root ${region.root} is outside its keys`);
    }
  }
  for (let velocity = 1; velocity <= 127; velocity++) {
    for (let note = LOWEST_NOTE; note <= HIGHEST_NOTE; note++) {
      const matches = map.filter(
        (r) =>
          note >= r.lowKey &&
          note <= r.highKey &&
          velocity >= r.lowVelocity &&
          velocity <= r.highVelocity,
      );
      if (matches.length === 0) {
        problems.push(`note ${note}, velocity ${velocity}: no sample`);
        break;
      }
      if (matches.length > 1) {
        problems.push(`note ${note}, velocity ${velocity}: ${matches.length} samples overlap`);
        break;
      }
      if (Math.abs(note - matches[0].root) > MAX_SHIFT) {
        problems.push(
          `note ${note}, velocity ${velocity}: shifted more than ${MAX_SHIFT} semitones`,
        );
        break;
      }
    }
  }
  return problems;
}
