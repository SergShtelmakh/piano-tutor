import { describe, expect, it } from 'vitest';
import {
  HIGHEST_NOTE,
  LOWEST_NOTE,
  impulseResponse,
  mapProblems,
  onsetIndex,
  pickSample,
  releaseTime,
  velocityGain,
  type SampleRegion,
} from './pianoSamples.ts';

const region = (
  root: number,
  lowKey: number,
  highKey: number,
  lowVelocity: number,
  highVelocity: number,
): SampleRegion => ({
  file: `${root}-${lowVelocity}.mp3`,
  root,
  lowKey,
  highKey,
  lowVelocity,
  highVelocity,
});

const map: SampleRegion[] = [
  region(60, 59, 61, 1, 80),
  region(63, 62, 64, 1, 80),
  region(60, 58, 61, 81, 127),
  region(63, 62, 64, 81, 127),
];

describe('pickSample', () => {
  it('plays the root at normal speed', () => {
    const picked = pickSample(map, 60, 50);
    expect(picked?.region.file).toBe('60-1.mp3');
    expect(picked?.playbackRate).toBe(1);
  });

  it('shifts a key between roots by the distance in semitones', () => {
    const up = pickSample(map, 61, 50);
    expect(up?.region.root).toBe(60);
    expect(up?.playbackRate).toBeCloseTo(2 ** (1 / 12), 10);
    const down = pickSample(map, 62, 50);
    expect(down?.region.root).toBe(63);
    expect(down?.playbackRate).toBeCloseTo(2 ** (-1 / 12), 10);
  });

  it('uses the soft layer up to the split and the loud layer above it', () => {
    expect(pickSample(map, 60, 1)?.region.lowVelocity).toBe(1);
    expect(pickSample(map, 60, 80)?.region.lowVelocity).toBe(1);
    expect(pickSample(map, 60, 81)?.region.lowVelocity).toBe(81);
    expect(pickSample(map, 60, 127)?.region.lowVelocity).toBe(81);
  });

  it('clamps and rounds the velocity', () => {
    expect(pickSample(map, 60, 0)?.region.lowVelocity).toBe(1);
    expect(pickSample(map, 60, 200)?.region.lowVelocity).toBe(81);
    expect(pickSample(map, 60, 80.4)?.region.lowVelocity).toBe(1);
  });

  it('returns null for a note without a sample', () => {
    expect(pickSample(map, 30, 64)).toBeNull();
    expect(pickSample(map, 100, 64)).toBeNull();
  });
});

describe('velocityGain', () => {
  it('rises with velocity and is continuous at the layer split', () => {
    let previous = 0;
    for (let v = 1; v <= 127; v++) {
      const gain = velocityGain(v);
      expect(gain).toBeGreaterThan(previous);
      previous = gain;
    }
    expect(velocityGain(81) - velocityGain(80)).toBeLessThan(0.02);
    expect(velocityGain(127)).toBe(1);
    expect(velocityGain(1)).toBeGreaterThan(0);
  });
});

describe('releaseTime', () => {
  it('is longer in the bass than in the treble, between 0.1 and 0.3 s', () => {
    expect(releaseTime(LOWEST_NOTE)).toBeCloseTo(0.3, 10);
    expect(releaseTime(HIGHEST_NOTE)).toBeCloseTo(0.1, 10);
    expect(releaseTime(40)).toBeGreaterThan(releaseTime(80));
  });

  it('stays in range for notes outside the piano', () => {
    expect(releaseTime(0)).toBeCloseTo(0.3, 10);
    expect(releaseTime(127)).toBeCloseTo(0.1, 10);
  });
});

describe('onsetIndex', () => {
  it('skips leading silence', () => {
    const channel = new Float32Array(100);
    channel[40] = 0.5;
    expect(onsetIndex(channel)).toBe(40);
  });

  it('ignores noise below the threshold', () => {
    const channel = new Float32Array(100);
    channel[10] = 0.0005;
    channel[60] = -0.3;
    expect(onsetIndex(channel)).toBe(60);
  });

  it('starts a silent buffer at 0', () => {
    expect(onsetIndex(new Float32Array(50))).toBe(0);
  });
});

describe('impulseResponse', () => {
  const seeded = () => {
    let state = 12345;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  };

  it('has the length of the room and is repeatable with a seeded random', () => {
    const a = impulseResponse(1.5, 8000, seeded());
    const b = impulseResponse(1.5, 8000, seeded());
    expect(a.left).toHaveLength(12000);
    expect(Array.from(a.left)).toEqual(Array.from(b.left));
  });

  it('decays and differs between the ears', () => {
    const { left, right } = impulseResponse(1.5, 8000, seeded());
    const energy = (data: Float32Array, from: number, to: number) => {
      let sum = 0;
      for (let i = from; i < to; i++) sum += data[i] * data[i];
      return sum;
    };
    expect(energy(left, 0, 2000)).toBeGreaterThan(energy(left, 10000, 12000) * 100);
    expect(Array.from(left)).not.toEqual(Array.from(right));
  });

  it('has unit energy in each ear, whatever its length', () => {
    for (const seconds of [0.5, 1.5, 2.5]) {
      const { left, right } = impulseResponse(seconds, 8000, seeded());
      for (const channel of [left, right]) {
        let energy = 0;
        for (const value of channel) energy += value * value;
        expect(energy).toBeCloseTo(1, 5);
      }
    }
  });

  it('starts after a short pre-delay', () => {
    const { left } = impulseResponse(1, 8000, seeded());
    expect(left[0]).toBe(0);
  });
});

describe('mapProblems', () => {
  it('reports gaps, overlaps, and shifts over the limit', () => {
    expect(mapProblems(map).length).toBeGreaterThan(0);
  });

  it('accepts a complete map', () => {
    const full: SampleRegion[] = [];
    for (let root = 22; root <= 109; root += 3) {
      const low = Math.max(LOWEST_NOTE, root - 1);
      const high = Math.min(HIGHEST_NOTE, root + 1);
      full.push(region(root, low, high, 1, 80), region(root, low, high, 81, 127));
    }
    expect(mapProblems(full)).toEqual([]);
  });

  it('finds overlapping regions', () => {
    const overlapping = [region(60, 21, 108, 1, 127), region(60, 21, 108, 1, 127)];
    expect(mapProblems(overlapping).join()).toContain('overlap');
  });
});
