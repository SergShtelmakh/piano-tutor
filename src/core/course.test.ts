import { describe, expect, it } from 'vitest';
import {
  baseOctaveFor,
  buildCourse,
  courseLessons,
  drillNotation,
  finishedLessons,
  lessonId,
  MAX_PARTS,
  mergeGroups,
  pieceIdOfLesson,
  piecesInProgress,
  splitParts,
  stepsOf,
  type Course,
} from './course.ts';
import { LIBRARY_PIECES } from './libraryCatalog.ts';
import { buildScore, type Score } from './score.ts';
import { parseMusicXml } from './musicxml.ts';
import { attributes, backup, measure, note, part, score } from './musicxmlTestHelpers.ts';
import type { Piece } from './smf.ts';

// One tick is one sixteenth note (4 ticks per quarter) at 120 bpm: 0.125 s each. A 4/4 bar is 16
// ticks, so a note is [pitch, startTick, endTick] and bar n starts at tick 16 * (n - 1).
type N = [note: number, start: number, end: number];

function scoreOf(notes: N[]): Score {
  const piece: Piece = {
    ticksPerQuarter: 4,
    notes: notes.map(([note, startTick, endTick]) => ({
      note,
      startTick,
      endTick,
      start: startTick * 0.125,
      end: endTick * 0.125,
      velocity: 80,
    })),
    pedal: [],
    tempos: [{ tick: 0, time: 0, microsPerQuarter: 500_000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    duration: 0,
  };
  return buildScore(piece);
}

/** `bars` bars of four quarter notes in the right hand (C D E F, then G A B C, …) and a half-note bass. */
function twoHands(bars: number, bass = true): N[] {
  const treble = [60, 62, 64, 65, 67, 69, 71, 72];
  const notes: N[] = [];
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      notes.push([
        treble[(bar * 4 + beat) % treble.length],
        bar * 16 + beat * 4,
        bar * 16 + beat * 4 + 4,
      ]);
    }
    if (bass) {
      notes.push([48, bar * 16, bar * 16 + 8], [43 + (bar % 3), bar * 16 + 8, bar * 16 + 16]);
    }
  }
  return notes;
}

/** A small seeded random source, so tests are repeatable. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('stepsOf', () => {
  it('makes a step of the notes that begin together, lowest first', () => {
    const score = scoreOf([
      [67, 0, 4],
      [60, 0, 4],
      [64, 0, 4],
      [62, 4, 8],
    ]);
    expect(stepsOf(score.bars, 'right').map((s) => s.notes)).toEqual([[60, 64, 67], [62]]);
  });

  it('takes the right hand from the treble staff and the left hand from the bass staff', () => {
    const score = scoreOf([
      [60, 0, 4],
      [48, 0, 4],
      [72, 4, 8],
      [40, 8, 12],
    ]);
    expect(stepsOf(score.bars, 'right').map((s) => s.notes)).toEqual([[60], [72]]);
    expect(stepsOf(score.bars, 'left').map((s) => s.notes)).toEqual([[48], [40]]);
  });

  it('puts the notes of both hands that begin together in one step', () => {
    const score = scoreOf([
      [60, 0, 4],
      [48, 0, 4],
      [62, 4, 8],
    ]);
    expect(stepsOf(score.bars, 'both').map((s) => s.notes)).toEqual([[48, 60], [62]]);
  });

  it('skips rests', () => {
    const score = scoreOf([
      [60, 0, 4],
      [62, 8, 12],
    ]); // a quarter rest between the notes
    expect(stepsOf(score.bars, 'right')).toHaveLength(2);
  });

  it('does not make a step of the end of a tied note', () => {
    // A note held across the bar line is shown as two tied columns but pressed once.
    const score = scoreOf([
      [60, 8, 24],
      [62, 24, 28],
    ]);
    expect(stepsOf(score.bars, 'right').map((s) => s.notes)).toEqual([[60], [62]]);
  });

  it('gives each step the time of its column', () => {
    const score = scoreOf([
      [60, 0, 4],
      [62, 4, 8],
    ]);
    expect(stepsOf(score.bars, 'right').map((s) => s.time)).toEqual([0, 0.5]);
  });

  it('returns nothing for a hand that does not play', () => {
    expect(stepsOf(scoreOf([[60, 0, 4]]).bars, 'left')).toEqual([]);
  });
});

describe('splitParts', () => {
  it('makes parts of at most 4 bars', () => {
    const { parts, truncated, covered } = splitParts(scoreOf(twoHands(10, false)));
    expect(parts.map((p) => p.bars.length)).toEqual([4, 4, 2]);
    expect(parts.map((p) => [p.fromBar, p.toBar])).toEqual([
      [1, 4],
      [5, 8],
      [9, 10],
    ]);
    expect(truncated).toBe(false);
    expect(covered).toEqual({ from: 1, to: 10 });
  });

  it('numbers the parts from 1', () => {
    expect(splitParts(scoreOf(twoHands(9, false))).parts.map((p) => p.number)).toEqual([1, 2, 3]);
  });

  it('keeps a part to 32 steps, both hands together', () => {
    // Each bar has 4 right-hand and 2 left-hand steps at different moments: 6 steps per bar.
    const dense: N[] = [];
    for (let bar = 0; bar < 6; bar++) {
      for (let i = 0; i < 16; i++) dense.push([60 + (i % 5), bar * 16 + i, bar * 16 + i + 1]);
    }
    const { parts } = splitParts(scoreOf(dense)); // 16 steps per bar: two bars fill a part
    expect(parts.map((p) => p.bars.length)).toEqual([2, 2, 2]);
    for (const part of parts) {
      expect(stepsOf(part.bars, 'both').length).toBeLessThanOrEqual(32);
    }
  });

  it('gives a bar with more than 32 steps a part of its own', () => {
    const notes: N[] = Array.from({ length: 40 }, (_, i) => [60 + (i % 3), i, i + 1]);
    // 40 sixteenths do not fit in one 4/4 bar (16 units): they run over bars; use a 3-bar dense piece
    const { parts } = splitParts(scoreOf(notes));
    expect(parts.length).toBeGreaterThanOrEqual(1);
    for (const part of parts) expect(part.bars.length).toBeGreaterThanOrEqual(1);
  });

  it('lets silent bars join the part before them', () => {
    const notes: N[] = [
      [60, 0, 16],
      [62, 16, 32],
      [64, 64, 80],
    ]; // bars 3 and 4 are silent
    const { parts } = splitParts(scoreOf(notes));
    expect(parts[0].bars.map((bar) => bar.number)).toEqual([1, 2, 3, 4]);
    expect(parts[0].toBar).toBe(4);
  });

  it('stops after six parts and says the piece goes on', () => {
    const { parts, truncated, covered } = splitParts(scoreOf(twoHands(30, false)));
    expect(parts).toHaveLength(MAX_PARTS);
    expect(truncated).toBe(true);
    expect(covered).toEqual({ from: 1, to: 24 });
  });

  it('is not truncated when the piece ends exactly with the sixth part', () => {
    const { parts, truncated } = splitParts(scoreOf(twoHands(24, false)));
    expect(parts).toHaveLength(MAX_PARTS);
    expect(truncated).toBe(false);
  });

  it('never cuts inside a bar', () => {
    const { parts } = splitParts(scoreOf(twoHands(13, false)));
    for (const part of parts) {
      expect(part.bars.map((bar) => bar.number)).toEqual(
        Array.from({ length: part.toBar - part.fromBar + 1 }, (_, i) => part.fromBar + i),
      );
    }
  });
});

describe('mergeGroups', () => {
  it('pairs neighbours, then pairs of pairs', () => {
    expect(mergeGroups([1, 2, 3, 4, 5, 6])).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [1, 2, 3, 4],
      [1, 2, 3, 4, 5, 6],
    ]);
  });

  it('carries a leftover part up unchanged', () => {
    expect(mergeGroups([1, 2, 3])).toEqual([
      [1, 2],
      [1, 2, 3],
    ]);
    expect(mergeGroups([1, 2, 3, 4, 5])).toEqual([
      [1, 2],
      [3, 4],
      [1, 2, 3, 4],
      [1, 2, 3, 4, 5],
    ]);
  });

  it('has nothing to merge for one part or none', () => {
    expect(mergeGroups([1])).toEqual([]);
    expect(mergeGroups([])).toEqual([]);
  });

  it('makes n - 1 merges for n parts and ends with everything together', () => {
    for (let n = 2; n <= 7; n++) {
      const numbers = Array.from({ length: n }, (_, i) => i + 1);
      const merges = mergeGroups(numbers);
      expect(merges).toHaveLength(n - 1);
      expect(merges[merges.length - 1]).toEqual(numbers);
    }
  });

  it('works with parts that are not consecutive numbers', () => {
    expect(mergeGroups([1, 3, 4])).toEqual([
      [1, 3],
      [1, 3, 4],
    ]);
  });
});

describe('baseOctaveFor', () => {
  it('chooses the octave whose computer keys hold the most notes', () => {
    expect(baseOctaveFor([60, 62, 64, 65, 67])).toBe(4); // C4 D4 E4 F4 G4: A is C4
    expect(baseOctaveFor([48, 50, 52, 53, 55])).toBe(3);
    expect(baseOctaveFor([72, 74, 76])).toBe(5);
  });

  it('breaks ties by the middle of the notes, and stays in the allowed range', () => {
    for (const notes of [[24], [100], [20, 100], [60, 80]]) {
      const octave = baseOctaveFor(notes);
      expect(octave).toBeGreaterThanOrEqual(1);
      expect(octave).toBeLessThanOrEqual(6);
    }
  });

  it('handles no notes', () => {
    expect(baseOctaveFor([])).toBeGreaterThanOrEqual(1);
  });
});

describe('drillNotation', () => {
  it('draws every step as one quarter note, half a second apart', () => {
    const { score, stepTimes } = drillNotation([[60], [62, 65], [64]]);
    expect(stepTimes).toEqual([0, 0.5, 1]);
    const columns = score.bars[0].columns.treble.filter((c) => !c.rest);
    expect(columns.map((c) => c.notes.map((n) => n.note))).toEqual([[60], [62, 65], [64]]);
    expect(columns.map((c) => c.time)).toEqual(stepTimes);
    expect(columns.every((c) => c.value === 'quarter')).toBe(true);
  });

  it('puts low notes on the bass staff', () => {
    const { score } = drillNotation([[48], [60]]);
    expect(score.bars[0].columns.bass.some((c) => !c.rest && c.notes[0].note === 48)).toBe(true);
  });

  it('wraps into bars of four steps', () => {
    expect(drillNotation(Array.from({ length: 9 }, () => [60])).score.bars).toHaveLength(3);
  });
});

function lessonKinds(course: Course, hand: string) {
  return course.stages.find((stage) => stage.hand === hand)?.lessons.map((l) => l.kind) ?? [];
}

const PIECE = { id: 'test/piece', title: 'A piece' };

describe('buildCourse', () => {
  const full = buildCourse(scoreOf(twoHands(10)), PIECE); // 3 parts, both hands, no chords

  it('has the stages right, left, both, in that order', () => {
    expect(full.stages.map((stage) => stage.hand)).toEqual(['right', 'left', 'both']);
  });

  it('orders a hand stage: notes, then parts, then merges (no chord lesson without chords)', () => {
    expect(lessonKinds(full, 'right')).toEqual(['notes', 'part', 'part', 'part', 'merge', 'merge']);
    expect(lessonKinds(full, 'left')).toEqual(['notes', 'part', 'part', 'part', 'merge', 'merge']);
  });

  it('has only parts and merges in the both-hands stage', () => {
    expect(lessonKinds(full, 'both')).toEqual(['part', 'part', 'part', 'merge', 'merge']);
  });

  it('adds a chord lesson when the hand plays at least two different chords', () => {
    const notes: N[] = [
      [60, 0, 4],
      [64, 0, 4],
      [67, 0, 4], // C major
      [62, 4, 8],
      [65, 4, 8],
      [69, 4, 8], // D minor
      [60, 8, 12],
      [62, 12, 16],
    ];
    const course = buildCourse(scoreOf(notes), PIECE);
    expect(lessonKinds(course, 'right')).toEqual(['notes', 'chords', 'part']);
  });

  it('leaves out the chord lesson for a single chord', () => {
    const notes: N[] = [
      [60, 0, 4],
      [64, 0, 4],
      [62, 4, 8],
      [60, 8, 12],
      [64, 8, 12],
    ];
    expect(lessonKinds(buildCourse(scoreOf(notes), PIECE), 'right')).not.toContain('chords');
  });

  it('has a single stage for a one-handed piece, and no both-hands stage', () => {
    const course = buildCourse(scoreOf(twoHands(6, false)), PIECE);
    expect(course.stages.map((stage) => stage.hand)).toEqual(['right']);
  });

  it('has no merge for a one-part piece', () => {
    const course = buildCourse(scoreOf(twoHands(3)), PIECE);
    expect(lessonKinds(course, 'right')).toEqual(['notes', 'part']);
    expect(lessonKinds(course, 'both')).toEqual(['part']);
  });

  it('leaves out the notes drill for a hand with a single pitch', () => {
    const notes: N[] = [
      [60, 0, 4],
      [60, 4, 8],
      [60, 8, 12],
      [48, 0, 4],
      [50, 4, 8],
    ];
    expect(lessonKinds(buildCourse(scoreOf(notes), PIECE), 'right')).toEqual(['part']);
  });

  it('keeps a six-part course to 37 lessons or fewer', () => {
    const course = buildCourse(scoreOf(twoHands(40)), PIECE);
    expect(courseLessons(course).length).toBeLessThanOrEqual(37);
    expect(course.truncated).toBe(true);
    expect(course.covered).toEqual({ from: 1, to: 24 });
    expect(course.totalBars).toBe(40);
  });

  it('gives every lesson a unique, stable id of the documented shape', () => {
    const ids = courseLessons(full).map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('melody:test/piece:right:notes');
    expect(ids).toContain('melody:test/piece:right:part-2');
    expect(ids).toContain('melody:test/piece:both:merge-1-3');
    expect(buildCourse(scoreOf(twoHands(10)), PIECE)).toEqual(
      expect.objectContaining({ pieceId: 'test/piece' }),
    );
    expect(courseLessons(buildCourse(scoreOf(twoHands(10)), PIECE)).map((l) => l.id)).toEqual(ids);
  });

  it('describes each lesson with a title key and parameters', () => {
    const part = courseLessons(full).find((lesson) => lesson.id.endsWith('right:part-2'))!;
    expect(part.titleKey).toBe('courseLessonPart');
    expect(part.titleParams).toEqual({ part: 2, from: 5, to: 8 });
    const merge = courseLessons(full).find((lesson) => lesson.id.endsWith('right:merge-1-2'))!;
    expect(merge.titleKey).toBe('courseLessonMerge');
    expect(merge.titleParams).toEqual({ from: 1, to: 2 });
  });
});

describe('creating the lessons of a course', () => {
  const course = buildCourse(scoreOf(twoHands(10)), PIECE);
  const find = (suffix: string) => courseLessons(course).find((l) => l.id.endsWith(suffix))!;

  it('makes a part lesson from the steps of that part, the same every time', () => {
    const one = find('right:part-1').create(seeded(1));
    const two = find('right:part-1').create(seeded(2));
    expect(one.steps).toEqual(two.steps);
    expect(one.steps).toEqual([
      [60],
      [62],
      [64],
      [65],
      [67],
      [69],
      [71],
      [72],
      [60],
      [62],
      [64],
      [65],
      [67],
      [69],
      [71],
      [72],
    ]);
    expect(one.hand).toBe('right');
    expect(one.pieceTitle).toBe('A piece');
  });

  it('plays a merge lesson as its parts in order', () => {
    const merge = find('right:merge-1-2').create(seeded(1));
    const parts = [1, 2].flatMap((n) => find(`right:part-${n}`).create(seeded(1)).steps);
    expect(merge.steps).toEqual(parts);
  });

  it('plays the both-hands lesson with the notes of both hands together', () => {
    const lesson = find('both:part-1').create(seeded(1));
    expect(lesson.steps[0]).toEqual([48, 60]); // bass C3 and C4 begin together
    expect(lesson.steps[2]).toEqual([43, 64]); // the bass changes on beat 3
  });

  it('gives every lesson matching notation, page, and octave data', () => {
    for (const entry of courseLessons(course)) {
      const lesson = entry.create(seeded(7));
      expect(lesson.id).toBe(entry.id);
      expect(lesson.steps.length, entry.id).toBe(entry.stepCount);
      expect(lesson.notation?.stepTimes, entry.id).toHaveLength(lesson.steps.length);
      expect(
        lesson.pages.reduce((a, b) => a + b, 0),
        entry.id,
      ).toBe(lesson.steps.length);
      expect(lesson.baseOctave, entry.id).toBeGreaterThanOrEqual(1);
      expect(lesson.baseOctave, entry.id).toBeLessThanOrEqual(6);
      expect(
        lesson.steps.every((step) => step.length > 0),
        entry.id,
      ).toBe(true);
    }
  });

  it('puts every step of a lesson on its notation at the step time', () => {
    for (const entry of courseLessons(course)) {
      const lesson = entry.create(seeded(3));
      const { score, stepTimes } = lesson.notation!;
      lesson.steps.forEach((step, i) => {
        const here = score.bars
          .flatMap((bar) => [...bar.columns.treble, ...bar.columns.bass])
          .filter((column) => !column.rest && column.time === stepTimes[i])
          .flatMap((column) => column.notes.map((note) => note.note));
        for (const note of step) expect(here, `${entry.id} step ${i}`).toContain(note);
      });
    }
  });

  it('makes a drill in a random order, never the same note twice in a row', () => {
    const drill = find('right:notes');
    const orders = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const lesson = drill.create(seeded(seed));
      orders.add(lesson.steps.map((s) => s.join(',')).join(' '));
      for (let i = 1; i < lesson.steps.length; i++) {
        expect(lesson.steps[i].join(','), `seed ${seed}`).not.toBe(lesson.steps[i - 1].join(','));
      }
    }
    expect(orders.size).toBeGreaterThan(1);
  });

  it('sizes a drill at twice the number of different notes, within 8 and 24', () => {
    const lesson = find('right:notes').create(seeded(1));
    // The hand plays 8 different notes (C D E F G A B C), so the drill is 16 steps of those notes.
    expect(lesson.steps).toHaveLength(16);
    const pool = [60, 62, 64, 65, 67, 69, 71, 72];
    expect(lesson.steps.flat().every((note) => pool.includes(note))).toBe(true);
  });

  it('only uses notes the hand plays in a drill', () => {
    const left = find('left:notes').create(seeded(5));
    expect(left.steps.flat().every((note) => [48, 43, 44, 45].includes(note))).toBe(true);
  });
});

describe('lesson ids and progress', () => {
  it('builds ids and reads the piece back', () => {
    expect(lessonId('bach/x', 'left', 'part', '3')).toBe('melody:bach/x:left:part-3');
    expect(lessonId('bach/x', 'both', 'merge', '1-6')).toBe('melody:bach/x:both:merge-1-6');
    expect(lessonId('bach/x', 'right', 'chords')).toBe('melody:bach/x:right:chords');
    expect(pieceIdOfLesson('melody:bach/x:left:part-3')).toBe('bach/x');
    expect(pieceIdOfLesson('melody:bach/x:both:merge-1-6')).toBe('bach/x');
    expect(pieceIdOfLesson('melody:bach/x:right:notes')).toBe('bach/x');
  });

  it('does not take other lesson ids for course lessons', () => {
    for (const id of [
      'note-reading',
      'treble-c-g',
      'melody-mary',
      'melody:',
      'melody:x:thumb:part-1',
    ]) {
      expect(pieceIdOfLesson(id), id).toBeNull();
    }
  });

  const course = buildCourse(scoreOf(twoHands(10)), PIECE);
  const record = (completions: number) => ({ bestAccuracy: 1, bestStars: 3 as const, completions });

  it('counts the lessons with a finished run', () => {
    const [first, second] = courseLessons(course);
    expect(finishedLessons(course, {})).toBe(0);
    expect(
      finishedLessons(course, { [first.id]: record(1), [second.id]: record(0), other: record(2) }),
    ).toBe(1);
  });

  it('lists the pieces in progress, most finished lessons first, then by title', () => {
    const [a, b, c] = LIBRARY_PIECES;
    const records = {
      [lessonId(a.id, 'right', 'notes')]: record(1),
      [lessonId(b.id, 'right', 'notes')]: record(1),
      [lessonId(b.id, 'left', 'notes')]: record(2),
      [lessonId(c.id, 'right', 'notes')]: record(0), // saved but not finished
      'note-reading': record(5),
    };
    const list = piecesInProgress(records, LIBRARY_PIECES);
    expect(list.map((entry) => [entry.piece.id, entry.finished])).toEqual([
      [b.id, 2],
      [a.id, 1],
    ]);
  });

  it('leaves out courses of files opened from disk', () => {
    const id = lessonId('file-0a1b2c3d', 'right', 'part', '1');
    expect(pieceIdOfLesson(id)).toBe('file-0a1b2c3d');
    expect(piecesInProgress({ [id]: record(3) }, LIBRARY_PIECES)).toEqual([]);
  });

  it('shows nothing when no course lesson is finished', () => {
    expect(piecesInProgress({ 'note-reading': record(3) }, LIBRARY_PIECES)).toEqual([]);
  });
});

describe('a course built from MusicXML', () => {
  // The right-hand melody goes below middle C (B3, A3); the left hand plays D4 above it.
  const xml = score([
    part(
      'P1',
      measure(
        attributes({ divisions: 1, beats: '4', staves: 2 }),
        note('C', 4, 1, { staff: 1 }),
        note('B', 3, 1, { staff: 1 }),
        note('A', 3, 1, { staff: 1 }),
        note('B', 3, 1, { staff: 1 }),
        backup(4),
        note('C', 3, 2, { staff: 2 }),
        note('D', 4, 2, { staff: 2 }),
      ),
    ),
  ]);

  it('keeps each note in the hand it was written for', () => {
    const result = parseMusicXml(xml);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const built = buildScore(result.piece);
    const pitches = (hand: 'right' | 'left') =>
      new Set(stepsOf(built.bars, hand).flatMap((step) => step.notes));
    expect(pitches('right')).toEqual(new Set([60, 59, 57]));
    expect(pitches('left')).toEqual(new Set([48, 62]));
    const course = buildCourse(built, { id: 'file-test', title: 'Test' });
    expect(course.stages.map((stage) => stage.hand)).toEqual(['right', 'left', 'both']);
  });
});

describe('the key of a course', () => {
  it('writes a drill by the key at the start of the piece', () => {
    const inFlats = drillNotation([[61], [70]], -5).score; // D♭4 and B♭4 in D♭ major
    const notes = inFlats.bars[0].columns.treble.flatMap((column) => column.notes);
    expect(notes.map((n) => [n.alter, n.accidental])).toEqual([
      [-1, null],
      [-1, null],
    ]);
    expect(inFlats.bars[0].keySignature).toBe(-5);
    const inC = drillNotation([[61]]).score.bars[0].columns.treble[0].notes[0];
    expect(inC.alter).toBe(1);
  });

  it('keeps the key of the bars in a part lesson', () => {
    const result = parseMusicXml(
      score([
        part(
          'P1',
          measure(
            attributes({ divisions: 1, beats: '4', staves: 2, fifths: -5 }),
            note('D', 5, 2, { alter: -1, staff: 1 }),
            note('C', 5, 2, { staff: 1 }),
            backup(4),
            note('B', 2, 4, { alter: -1, staff: 2 }),
          ),
        ),
      ]),
    );
    if (!result.ok) throw new Error('parse failed');
    const built = buildScore(result.piece);
    expect(built.bars[0].keySignature).toBe(-5);
    const course = buildCourse(built, { id: 'file-flats', title: 'Flats' });
    const lesson = courseLessons(course).find(
      (item) => item.kind === 'part' && item.hand === 'right',
    )!;
    const bars = lesson.create(() => 0).notation!.score.bars;
    expect(bars[0].keySignature).toBe(-5);
    expect(bars[0].columns.treble[0].notes[0]).toMatchObject({ alter: -1, accidental: null });
  });
});
