import { onsetIndex, type SampleRegion } from '../core/pianoSamples.ts';

export type LoadStatus = 'loading' | 'ready' | 'failed';

export interface LoadedSample {
  buffer: AudioBuffer;
  /** Seconds of encoder padding and silence to skip at the start. */
  offset: number;
}

export interface SampleLoader {
  status(): LoadStatus;
  /** Calls the listener when the status changes. Returns the function that removes it. */
  subscribe(listener: () => void): () => void;
  /** Loads the files that are still missing after a failure. */
  retry(): void;
  get(file: string): LoadedSample | undefined;
}

const PARALLEL_LOADS = 4;
// A little of the attack's start is kept so the trim never cuts into it.
const PRE_ROLL = 0.002;

/** Fetches and decodes the piano samples from `baseUrl` (the folder with the files). */
export function createSampleLoader(
  context: BaseAudioContext,
  regions: readonly SampleRegion[],
  baseUrl: string,
): SampleLoader {
  const files = [...new Set(regions.map((r) => r.file))];
  const loaded = new Map<string, LoadedSample>();
  const listeners = new Set<() => void>();
  let status: LoadStatus = 'loading';
  let running = false;

  function setStatus(next: LoadStatus) {
    if (next === status) return;
    status = next;
    listeners.forEach((listener) => listener());
  }

  async function loadOne(file: string): Promise<void> {
    const response = await fetch(`${baseUrl}${file}`);
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    const start = onsetIndex(buffer.getChannelData(0)) / buffer.sampleRate;
    loaded.set(file, { buffer, offset: Math.max(0, start - PRE_ROLL) });
  }

  async function run() {
    if (running) return;
    running = true;
    setStatus('loading');
    const queue = files.filter((file) => !loaded.has(file));
    let failed = false;
    const worker = async () => {
      for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
        try {
          await loadOne(file);
        } catch {
          failed = true;
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL_LOADS }, worker));
    running = false;
    setStatus(failed || loaded.size < files.length ? 'failed' : 'ready');
  }

  void run();

  return {
    status: () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    retry() {
      if (status === 'failed') void run();
    },
    get: (file) => loaded.get(file),
  };
}
