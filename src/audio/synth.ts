import { apply, createHeldState, type SynthAction } from '../core/heldNotes.ts';
import { PIANO_SAMPLE_MAP } from '../core/pianoSampleMap.ts';
import { impulseResponse, pickSample, releaseTime } from '../core/pianoSamples.ts';
import type { NoteBus } from '../input/noteBus.ts';
import { createSampleLoader, type LoadStatus, type SampleLoader } from './sampleLoader.ts';

export const MAX_VOICES = 32;

const VOICE_PEAK = 0.8;
const START_RAMP = 0.002; // avoids a click if a sample does not start at zero
const ROOM_SECONDS = 1.5;
const WET_LEVEL = 0.4;
const REVERB_SWITCH_TIME_CONSTANT = 0.02; // ≈ 50 ms to switch

export interface Synth {
  /** Creates the audio context and starts loading the piano samples. Safe to call again. */
  start(): void;
  /** Starts or resumes the audio context. Call it from a user gesture. */
  resume(): void;
  /** Volume in percent (0–100). */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setReverb(on: boolean): void;
  /** Keys make no sound until the samples are `ready`. */
  loadStatus(): LoadStatus;
  /** Calls the listener when the load status changes. Returns the function that removes it. */
  subscribeLoad(listener: () => void): () => void;
  /** After a failed load, loads the files that are still missing. */
  retryLoad(): void;
}

interface Voice {
  env: GainNode;
  source: AudioBufferSourceNode;
}

function masterGain(volume: number, muted: boolean): number {
  const level = volume / 100;
  return muted ? 0 : level * level;
}

/** A polyphonic Web Audio piano (recorded samples) driven by the note bus. */
export function createSynth(
  bus: NoteBus,
  initial: { volume: number; muted: boolean; reverb: boolean },
): Synth {
  let volume = initial.volume;
  let muted = initial.muted;
  let reverb = initial.reverb;
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let voiceBus: GainNode | null = null;
  let wet: GainNode | null = null;
  let loader: SampleLoader | null = null;
  const loadListeners = new Set<() => void>();
  const voices = new Map<number, Voice>();
  let heldState = createHeldState();

  function ensureContext(): AudioContext {
    if (context && master && voiceBus && wet) return context;
    const ctx = new AudioContext();
    context = ctx;
    master = ctx.createGain();
    master.gain.value = masterGain(volume, muted);
    // A gentle compressor keeps big chords from clipping.
    const compressor = ctx.createDynamicsCompressor();
    master.connect(compressor).connect(ctx.destination);

    // Every voice goes to the dry path and, through a small generated room, to the wet path.
    voiceBus = ctx.createGain();
    voiceBus.connect(master);
    const room = impulseResponse(ROOM_SECONDS, ctx.sampleRate);
    const impulse = ctx.createBuffer(2, room.left.length, ctx.sampleRate);
    impulse.copyToChannel(room.left, 0);
    impulse.copyToChannel(room.right, 1);
    const convolver = ctx.createConvolver();
    convolver.normalize = false; // the impulse has unit energy already
    convolver.buffer = impulse;
    wet = ctx.createGain();
    wet.gain.value = reverb ? WET_LEVEL : 0;
    voiceBus.connect(convolver).connect(wet).connect(master);
    return ctx;
  }

  function start() {
    if (loader) return;
    const ctx = ensureContext();
    loader = createSampleLoader(ctx, PIANO_SAMPLE_MAP, `${import.meta.env.BASE_URL}piano/`);
    loader.subscribe(() => loadListeners.forEach((listener) => listener()));
    loadListeners.forEach((listener) => listener());
  }

  function startVoice(note: number, velocity: number) {
    start();
    const ctx = context!;
    if (loader!.status() !== 'ready') return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

    const picked = pickSample(PIANO_SAMPLE_MAP, note, velocity);
    const sample = picked && loader!.get(picked.region.file);
    if (!picked || !sample) return;

    if (voices.size >= MAX_VOICES) {
      const oldest = voices.keys().next().value;
      if (oldest !== undefined) stopVoice(oldest);
    }

    const now = ctx.currentTime;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(VOICE_PEAK * picked.gain, now + START_RAMP);
    env.connect(voiceBus!);

    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    source.playbackRate.value = picked.playbackRate;
    source.connect(env);
    const voice: Voice = { env, source };
    source.onended = () => {
      env.disconnect();
      if (voices.get(note) === voice) voices.delete(note);
    };
    source.start(now, sample.offset);
    voices.set(note, voice);
  }

  function stopVoice(note: number) {
    const voice = voices.get(note);
    if (!voice || !context) return;
    voices.delete(note);
    const now = context.currentTime;
    const release = releaseTime(note);
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    // Falls to about -52 dB at 1.5 × the release time, where the source is stopped.
    voice.env.gain.setTargetAtTime(0, now, release / 4);
    voice.source.stop(now + release * 1.5);
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
    start,
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
    setReverb(next) {
      reverb = next;
      if (!context || !wet) return;
      wet.gain.setTargetAtTime(
        reverb ? WET_LEVEL : 0,
        context.currentTime,
        REVERB_SWITCH_TIME_CONSTANT,
      );
    },
    loadStatus: () => loader?.status() ?? 'loading',
    subscribeLoad(listener) {
      loadListeners.add(listener);
      return () => loadListeners.delete(listener);
    },
    retryLoad() {
      loader?.retry();
    },
  };
}
