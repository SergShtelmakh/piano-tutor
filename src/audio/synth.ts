import { apply, createHeldState, type SynthAction } from '../core/heldNotes.ts';
import type { NoteBus } from '../input/noteBus.ts';

export const MAX_VOICES = 16;

const ATTACK = 0.005;
const DECAY_TIME_CONSTANT = 0.4;
const SUSTAIN_LEVEL = 0.6;
const RELEASE_TIME_CONSTANT = 0.05; // ≈ 150 ms to fall to silence
const VOICE_PEAK = 0.2;

export interface Synth {
  /** Starts or resumes the audio context. Call it from a user gesture. */
  resume(): void;
  /** Volume in percent (0–100). */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
}

interface Voice {
  env: GainNode;
  oscillators: OscillatorNode[];
}

function frequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

function masterGain(volume: number, muted: boolean): number {
  const level = volume / 100;
  return muted ? 0 : level * level;
}

/** A small polyphonic Web Audio synth driven by the note bus. */
export function createSynth(bus: NoteBus, initial: { volume: number; muted: boolean }): Synth {
  let volume = initial.volume;
  let muted = initial.muted;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  const voices = new Map<number, Voice>();
  let heldState = createHeldState();

  function ensureContext(): AudioContext {
    if (context && master) return context;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = masterGain(volume, muted);
    // A gentle compressor keeps big chords from clipping.
    const compressor = context.createDynamicsCompressor();
    master.connect(compressor).connect(context.destination);
    return context;
  }

  function startVoice(note: number, velocity: number) {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    if (voices.size >= MAX_VOICES) {
      const oldest = voices.keys().next().value;
      if (oldest !== undefined) stopVoice(oldest);
    }

    const now = ctx.currentTime;
    const peak = VOICE_PEAK * (velocity / 127) ** 2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(peak, now + ATTACK);
    env.gain.setTargetAtTime(peak * SUSTAIN_LEVEL, now + ATTACK, DECAY_TIME_CONSTANT);
    env.connect(master!);

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.value = frequency(note);
    body.connect(env);

    const overtone = ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.value = frequency(note) * 2;
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.25;
    overtone.connect(overtoneGain).connect(env);

    body.start(now);
    overtone.start(now);
    voices.set(note, { env, oscillators: [body, overtone] });
  }

  function stopVoice(note: number) {
    const voice = voices.get(note);
    if (!voice || !context) return;
    voices.delete(note);
    const now = context.currentTime;
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.setTargetAtTime(0, now, RELEASE_TIME_CONSTANT);
    for (const oscillator of voice.oscillators) oscillator.stop(now + RELEASE_TIME_CONSTANT * 8);
  }

  function run(action: SynthAction) {
    if (action.type === 'start') startVoice(action.note, action.velocity);
    else stopVoice(action.note);
  }

  bus.subscribe((event) => {
    const result = apply(heldState, event);
    heldState = result.state;
    result.actions.forEach(run);
  });

  function updateMaster() {
    if (!context || !master) return;
    master.gain.setTargetAtTime(masterGain(volume, muted), context.currentTime, 0.01);
  }

  return {
    resume() {
      const ctx = ensureContext();
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    },
    setVolume(next) {
      volume = next;
      updateMaster();
    },
    setMuted(next) {
      muted = next;
      updateMaster();
    },
  };
}
