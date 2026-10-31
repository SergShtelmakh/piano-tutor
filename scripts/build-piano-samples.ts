/**
 * Prepares the piano samples (Phase 17). Run once by hand; the outputs are committed.
 *
 *   bun run piano-samples <folder of UprightPianoKW-SFZ+FLAC-20220221>
 *
 * Reads the SFZ of the FreePats "Upright Piano KW" set (CC0, see licenses/piano-samples.md) and
 * writes public/piano/*.mp3 and src/core/pianoSampleMap.ts. Needs ffmpeg on PATH (or set FFMPEG
 * to its path). Not part of the app or of CI.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  HIGHEST_NOTE,
  LOWEST_NOTE,
  mapProblems,
  type SampleRegion,
} from '../src/core/pianoSamples.ts';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const OUT_DIR = resolve(import.meta.dirname, '../public/piano');
const MAP_FILE = resolve(import.meta.dirname, '../src/core/pianoSampleMap.ts');

/** The soft layer plays for velocities 1–80, the loud layer for 81–127 (the SFZ's own split). */
const SOFT_TOP = 80;
/** Longest sample in seconds; the long bass tails are already very quiet by then. */
const MAX_SECONDS = 10;
const END_FADE = 0.4;
const BITRATE = '320k';
/** Mean level of the first second of a sample, the same for both layers (dB). */
const TARGET_MEAN = -20;
const PEAK_LIMIT = -1;
const SAMPLE_RATE = 44100;

interface Source {
  /** Path of the FLAC file. */
  path: string;
  root: number;
  soft: boolean;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function ffmpeg(args: string[]): string {
  const result = spawnSync(FFMPEG, ['-hide_banner', '-nostats', ...args], { encoding: 'utf8' });
  if (result.error) {
    fail(
      `Could not run ffmpeg (${FFMPEG}): ${result.error.message}\n` +
        'Install it (winget install Gyan.FFmpeg) or set FFMPEG to its path.',
    );
  }
  if (result.status !== 0) fail(`ffmpeg failed (${args.join(' ')}):\n${result.stderr}`);
  return result.stderr;
}

/** The regions of the SFZ file: sample, root key, and which velocity layer (group) it is in. */
function readSfz(folder: string): Source[] {
  const sfz = readdirSync(folder).find((name) => name.endsWith('.sfz'));
  if (!sfz) fail(`No .sfz file in ${folder}`);
  const sources: Source[] = [];
  let soft = true;
  let region: Record<string, string> | null = null;
  const finish = () => {
    if (!region) return;
    const root = Number(region.pitch_keycenter ?? region.key);
    if (!region.sample || !Number.isInteger(root))
      fail(`Bad region in the SFZ: ${JSON.stringify(region)}`);
    sources.push({ path: join(folder, region.sample), root, soft });
    region = null;
  };
  for (const raw of readFileSync(join(folder, sfz), 'utf8').split(/\r?\n/)) {
    const line = raw.replace(/\/\/.*$/, '').trim();
    if (line === '<group>') {
      finish();
      soft = true;
    } else if (line === '<region>') {
      finish();
      region = {};
    } else if (line.includes('=')) {
      for (const pair of line.split(/\s+/)) {
        const [key, value] = pair.split('=');
        if (key === 'hivel') soft = true;
        else if (key === 'lovel') soft = false;
        else if (region && value !== undefined) region[key] = value;
      }
    }
  }
  finish();
  return sources;
}

/** Each key plays the nearest recorded key of its layer; a tie plays the higher one (pitched down). */
function regionsOf(sources: Source[], soft: boolean): SampleRegion[] {
  const roots = sources
    .filter((s) => s.soft === soft)
    .map((s) => s.root)
    .sort((a, b) => a - b);
  const keysOf = new Map<number, number[]>(roots.map((root) => [root, []]));
  for (let note = LOWEST_NOTE; note <= HIGHEST_NOTE; note++) {
    let best = roots[0];
    for (const root of roots) {
      const closer = Math.abs(root - note) < Math.abs(best - note);
      const tie = Math.abs(root - note) === Math.abs(best - note) && root > best;
      if (closer || tie) best = root;
    }
    keysOf.get(best)!.push(note);
  }
  const layer = soft ? 'soft' : 'loud';
  return roots.flatMap((root) => {
    const keys = keysOf.get(root)!;
    if (keys.length === 0) return [];
    return [
      {
        file: `${layer}-${root}.mp3`,
        root,
        lowKey: keys[0],
        highKey: keys[keys.length - 1],
        lowVelocity: soft ? 1 : SOFT_TOP + 1,
        highVelocity: soft ? SOFT_TOP : 127,
      },
    ];
  });
}

const START = 'silenceremove=start_periods=1:start_threshold=-60dB';

/** Mean and peak level (dB) of the first second after the leading silence. */
function measure(path: string): { mean: number; max: number } {
  const log = ffmpeg([
    '-i',
    path,
    '-af',
    `${START},atrim=duration=1,volumedetect`,
    '-f',
    'null',
    '-',
  ]);
  const mean = /mean_volume:\s*(-?[\d.]+) dB/.exec(log);
  const max = /max_volume:\s*(-?[\d.]+) dB/.exec(log);
  if (!mean || !max) fail(`Could not measure ${path}`);
  return { mean: Number(mean[1]), max: Number(max[1]) };
}

function secondsOf(path: string): number {
  const log = ffmpeg(['-i', path, '-f', 'null', '-']);
  const times = [...log.matchAll(/time=(\d+):(\d+):([\d.]+)/g)];
  const last = times[times.length - 1];
  if (!last) fail(`Could not read the length of ${path}`);
  return Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3]);
}

function main() {
  const folder = process.argv[2];
  if (!folder) fail('Usage: bun run piano-samples <folder with the SFZ and samples/>');
  const sources = readSfz(resolve(folder));

  const map = [true, false].flatMap((soft) => regionsOf(sources, soft));
  const problems = mapProblems(map);
  if (problems.length > 0) fail(`The sample map has problems:\n${problems.join('\n')}`);

  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  // Level each layer to the same mean, keeping the balance between its keys. The only dynamics
  // curve left is the velocity gain, so the two layers join smoothly at the split.
  const measured = new Map<Source, { mean: number; max: number }>();
  for (const source of sources) measured.set(source, measure(source.path));
  const layerMean = (soft: boolean) => {
    const values = sources.filter((s) => s.soft === soft).map((s) => measured.get(s)!.mean);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };
  const offset = { soft: TARGET_MEAN - layerMean(true), loud: TARGET_MEAN - layerMean(false) };
  console.log(`Layer gain: soft ${offset.soft.toFixed(1)} dB, loud ${offset.loud.toFixed(1)} dB`);

  let totalBytes = 0;
  let totalSeconds = 0;
  let largest = 0;
  for (const source of sources) {
    const m = measured.get(source)!;
    const gain = Math.min(source.soft ? offset.soft : offset.loud, PEAK_LIMIT - m.max);
    const file = `${source.soft ? 'soft' : 'loud'}-${source.root}.mp3`;
    const out = join(OUT_DIR, file);
    // The fade-out is done on the reversed audio, so the length need not be known.
    const filter = [
      START,
      `atrim=duration=${MAX_SECONDS}`,
      'areverse',
      `afade=t=in:d=${END_FADE}`,
      'areverse',
      `volume=${gain.toFixed(2)}dB`,
    ].join(',');
    ffmpeg([
      '-y',
      '-i',
      source.path,
      '-af',
      filter,
      '-ar',
      String(SAMPLE_RATE),
      '-ac',
      '2',
      '-c:a',
      'libmp3lame',
      '-b:a',
      BITRATE,
      out,
    ]);
    const bytes = statSync(out).size;
    const seconds = secondsOf(out);
    totalBytes += bytes;
    totalSeconds += seconds;
    largest = Math.max(largest, bytes);
    console.log(
      `${file.padEnd(14)} ${(bytes / 1024).toFixed(0).padStart(5)} KB ${seconds.toFixed(2).padStart(6)} s  ${gain.toFixed(1)} dB`,
    );
  }

  const lines = map.map(
    (r) =>
      `  { file: '${r.file}', root: ${r.root}, lowKey: ${r.lowKey}, highKey: ${r.highKey}, lowVelocity: ${r.lowVelocity}, highVelocity: ${r.highVelocity} },`,
  );
  writeFileSync(
    MAP_FILE,
    [
      '// Generated by scripts/build-piano-samples.ts. Do not edit by hand.',
      "import type { SampleRegion } from './pianoSamples.ts';",
      '',
      'export const PIANO_SAMPLE_MAP: readonly SampleRegion[] = [',
      ...lines,
      '];',
      '',
    ].join('\n'),
  );

  const decodedMb = (totalSeconds * SAMPLE_RATE * 2 * 4) / 1024 / 1024;
  console.log(
    `\n${sources.length} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB, largest ${(largest / 1024).toFixed(0)} KB, ` +
      `${totalSeconds.toFixed(0)} s, decoded about ${decodedMb.toFixed(0)} MB (stereo, 32-bit float)`,
  );
}

main();
