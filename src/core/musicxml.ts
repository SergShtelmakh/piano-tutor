// Pure: reads a MusicXML score (`score-partwise`, as exported by MuseScore) into the same `Piece`
// that a MIDI file gives, so the player, the score, and the course builder need no special case.
import {
  MAX_DURATION_SECONDS,
  MAX_NOTES,
  tickToSeconds,
  type ParseResult,
  type PedalChange,
  buildKeySignatures,
  type KeySignature,
  type NoteSpelling,
  type Piece,
  type PieceHand,
  type PieceNote,
  type TempoChange,
  type TimeSignature,
} from './smf.ts';
import { spellingFor } from './spelling.ts';
import { child, childText, childrenNamed, parseXml, type XmlElement } from './xml.ts';

/** The tempo is not read from the file: a quarter note lasts half a second (120 bpm). */
const MICROS_PER_QUARTER = 500_000;
const VELOCITY = 80;
const PERCUSSION_CHANNEL = 10; // counted from 1
const MAX_TICKS_PER_QUARTER = 3840;
const FALLBACK_TICKS_PER_QUARTER = 960;

const STEP_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const STEP_INDEX: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function numberOf(text: string | undefined): number | undefined {
  if (text === undefined || text === '') return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

/** Every element with this name anywhere below `element`. */
function descendants(element: XmlElement, name: string, into: XmlElement[] = []): XmlElement[] {
  for (const item of element.children) {
    if (item.name === name) into.push(item);
    descendants(item, name, into);
  }
  return into;
}

/** Ticks per quarter note: the least common multiple of the file's `divisions`. */
function ticksPerQuarterOf(root: XmlElement): number {
  let result = 1;
  for (const element of descendants(root, 'divisions')) {
    const value = numberOf(element.text);
    if (value === undefined || !Number.isInteger(value) || value <= 0) continue;
    result = (result / gcd(result, value)) * value;
    if (result > MAX_TICKS_PER_QUARTER) return FALLBACK_TICKS_PER_QUARTER;
  }
  return result;
}

/** The ids of parts played on the percussion channel; they are left out. */
function percussionParts(root: XmlElement): Set<string> {
  const ids = new Set<string>();
  const list = child(root, 'part-list');
  if (!list) return ids;
  for (const scorePart of childrenNamed(list, 'score-part')) {
    const channels = descendants(scorePart, 'midi-channel').map((item) => numberOf(item.text));
    if (channels.includes(PERCUSSION_CHANNEL)) ids.add(scorePart.attributes.id ?? '');
  }
  return ids;
}

/** The MIDI note of a `<pitch>`, or `undefined` when it is missing or out of range. */
function midiOf(pitch: XmlElement, transpose: number): number | undefined {
  const semitone = STEP_SEMITONES[childText(pitch, 'step') ?? ''];
  const octave = numberOf(childText(pitch, 'octave'));
  if (semitone === undefined || octave === undefined) return undefined;
  const alter = Math.round(numberOf(childText(pitch, 'alter')) ?? 0);
  const note = (octave + 1) * 12 + semitone + alter + transpose;
  return Number.isInteger(note) && note >= 0 && note <= 127 ? note : undefined;
}

/** `3+2` beats count as 5. */
function beatsOf(text: string | undefined): number | undefined {
  if (!text) return undefined;
  let sum = 0;
  for (const part of text.split('+')) {
    const value = numberOf(part.trim());
    if (value === undefined || !Number.isInteger(value) || value <= 0) return undefined;
    sum += value;
  }
  return sum;
}

interface DraftNote {
  note: number;
  startTick: number;
  endTick: number;
  hand?: PieceHand;
  spelling?: NoteSpelling;
  /** The `<voice>` number of the file and the staff the note is written on (1 when a part has one). */
  voiceNumber: number;
  staff: number;
  voice?: 1 | 2;
}

/**
 * Ranks the voices of every staff of a part: the lowest voice number is the upper voice, the
 * next one the lower voice, and a third or fourth voice joins whichever of the two has the closer
 * average pitch. Only the lower voice is marked (`voice: 2`).
 */
function rankVoices(notes: readonly DraftNote[]): void {
  const byStaff = new Map<number, DraftNote[]>();
  for (const note of notes) {
    const list = byStaff.get(note.staff);
    if (list) list.push(note);
    else byStaff.set(note.staff, [note]);
  }
  for (const staffNotes of byStaff.values()) {
    const numbers = [...new Set(staffNotes.map((note) => note.voiceNumber))].sort((a, b) => a - b);
    if (numbers.length < 2) continue;
    const mean = (voice: number) => {
      const own = staffNotes.filter((note) => note.voiceNumber === voice);
      return own.reduce((sum, note) => sum + note.note, 0) / own.length;
    };
    const [upper, lower] = numbers;
    const rank = new Map<number, 1 | 2>([
      [upper, 1],
      [lower, 2],
    ]);
    for (const extra of numbers.slice(2)) {
      const closer =
        Math.abs(mean(extra) - mean(upper)) <= Math.abs(mean(extra) - mean(lower)) ? upper : lower;
      rank.set(extra, rank.get(closer)!);
    }
    for (const note of staffNotes) {
      if (rank.get(note.voiceNumber) === 2) note.voice = 2;
    }
  }
}

interface PartResult {
  notes: DraftNote[];
  /** Pedal changes, in ticks before the pickup shift. */
  pedal: { tick: number; on: boolean }[];
  timeSignatures: TimeSignature[];
  keySignatures: KeySignature[];
  /** Length of the first measure, in ticks. */
  firstMeasureTicks: number;
  tooMany: boolean;
}

/**
 * How the file writes a note: its `<step>` (moved by the diatonic part of a `<transpose>`) with the
 * alteration that makes the sounding pitch. A double sharp or flat, or anything that does not match
 * the pitch, has no spelling and is written by the key signature like a MIDI note.
 */
function spellingOf(pitch: XmlElement, midi: number, diatonic: number): NoteSpelling | undefined {
  const written = STEP_INDEX[childText(pitch, 'step') ?? ''];
  if (written === undefined) return undefined;
  const step = (((written + diatonic) % 7) + 7) % 7;
  return spellingFor(midi, step);
}

function readPart(part: XmlElement, ticksPerQuarter: number): PartResult {
  const result: PartResult = {
    notes: [],
    pedal: [],
    timeSignatures: [],
    keySignatures: [],
    firstMeasureTicks: 0,
    tooMany: false,
  };
  let divisions = 1;
  let staves = 1;
  let transpose = 0;
  let diatonic = 0; // steps the written pitch is moved by `<transpose>`
  let cursor = 0; // ticks as a float, so a rounded duration never drifts
  let lastStart = 0;
  // Tied notes that continue into the next note of the same pitch.
  // A tie joins notes of one voice, so the voice is part of the key.
  const openTies = new Map<string, DraftNote>();
  const toTicks = (duration: number) => (duration * ticksPerQuarter) / divisions;

  childrenNamed(part, 'measure').forEach((measure, measureIndex) => {
    if (result.tooMany) return;
    const measureStart = cursor;
    let highWater = cursor;

    for (const item of measure.children) {
      if (item.name === 'attributes') {
        const newDivisions = numberOf(childText(item, 'divisions'));
        if (newDivisions !== undefined && newDivisions > 0) divisions = newDivisions;
        const newStaves = numberOf(childText(item, 'staves'));
        if (newStaves !== undefined && newStaves >= 1) staves = Math.floor(newStaves);

        const shift = child(item, 'transpose');
        if (shift) {
          const chromatic = numberOf(childText(shift, 'chromatic')) ?? 0;
          const octaveChange = numberOf(childText(shift, 'octave-change')) ?? 0;
          transpose = Math.round(chromatic + 12 * octaveChange);
          diatonic = Math.round(numberOf(childText(shift, 'diatonic')) ?? 0);
        }

        const key = child(item, 'key');
        const fifths = numberOf(key && childText(key, 'fifths'));
        if (fifths !== undefined && Number.isInteger(fifths) && fifths >= -7 && fifths <= 7) {
          result.keySignatures.push({ tick: Math.round(cursor), fifths });
        }

        const time = child(item, 'time');
        const beats = beatsOf(time && childText(time, 'beats'));
        const beatType = numberOf(time && childText(time, 'beat-type'));
        if (beats !== undefined && beatType !== undefined && beatType > 0) {
          result.timeSignatures.push({
            tick: Math.round(cursor),
            numerator: beats,
            denominator: beatType,
          });
        }
      } else if (item.name === 'backup' || item.name === 'forward') {
        const duration = toTicks(numberOf(childText(item, 'duration')) ?? 0);
        cursor += item.name === 'backup' ? -duration : duration;
        cursor = Math.max(0, cursor);
        highWater = Math.max(highWater, cursor);
      } else if (item.name === 'direction') {
        for (const type of childrenNamed(item, 'direction-type')) {
          const pedal = child(type, 'pedal');
          const kind = pedal?.attributes.type;
          const tick = Math.round(cursor);
          if (kind === 'start') result.pedal.push({ tick, on: true });
          else if (kind === 'stop') result.pedal.push({ tick, on: false });
          else if (kind === 'change') {
            result.pedal.push({ tick, on: false }, { tick, on: true });
          }
        }
      } else if (item.name === 'note') {
        if (child(item, 'grace')) continue; // grace notes take no time and are skipped
        const duration = toTicks(numberOf(childText(item, 'duration')) ?? 0);
        const chord = child(item, 'chord') !== undefined;
        const start = chord ? lastStart : cursor;
        if (!chord) {
          lastStart = cursor;
          cursor += duration;
          highWater = Math.max(highWater, cursor);
        }

        const pitch = child(item, 'pitch');
        if (!pitch || child(item, 'rest') || child(item, 'cue')) continue; // time moves on, no sound
        const midi = midiOf(pitch, transpose);
        if (midi === undefined) continue;

        const startTick = Math.round(start);
        const endTick = Math.max(startTick + 1, Math.round(start + duration));
        const tieTypes = [...childrenNamed(item, 'tie'), ...descendants(item, 'tied')].map(
          (tie) => tie.attributes.type,
        );
        const tieStop = tieTypes.includes('stop');
        const tieStart = tieTypes.includes('start');

        const voiceNumber = Math.max(1, Math.floor(numberOf(childText(item, 'voice')) ?? 1));
        const tieKey = `${voiceNumber}:${midi}`;
        const open = tieStop ? openTies.get(tieKey) : undefined;
        let draft: DraftNote;
        if (open) {
          open.endTick = endTick;
          draft = open;
        } else {
          const staff = Math.floor(numberOf(childText(item, 'staff')) ?? 1);
          const hand: PieceHand | undefined =
            staves >= 2 ? (staff <= 1 ? 'right' : 'left') : undefined;
          const spelling = spellingOf(pitch, midi, diatonic);
          draft = {
            note: midi,
            startTick,
            endTick,
            ...(hand ? { hand } : {}),
            ...(spelling ? { spelling } : {}),
            voiceNumber,
            staff: staves >= 2 ? staff : 1,
          };
          result.notes.push(draft);
          if (result.notes.length > MAX_NOTES) {
            result.tooMany = true;
            return;
          }
        }
        if (tieStart) openTies.set(tieKey, draft);
        else openTies.delete(tieKey);
      }
    }

    if (measureIndex === 0) result.firstMeasureTicks = highWater - measureStart;
    cursor = highWater; // the next measure starts after the longest voice
    lastStart = cursor;
  });

  return result;
}

/** Converts the text of a MusicXML score to a `Piece`. Never throws. */
export function parseMusicXml(text: string): ParseResult {
  const root = parseXml(text);
  if (!root) return { ok: false, error: 'damaged' };
  if (root.name === 'score-timewise') return { ok: false, error: 'unsupported' };
  if (root.name !== 'score-partwise') return { ok: false, error: 'notMidi' };

  const ticksPerQuarter = ticksPerQuarterOf(root);
  const skipped = percussionParts(root);

  const parts: PartResult[] = [];
  let total = 0;
  for (const part of childrenNamed(root, 'part')) {
    if (skipped.has(part.attributes.id ?? '\0')) continue;
    const result = readPart(part, ticksPerQuarter);
    rankVoices(result.notes); // voices are ranked per part, so parts are never voices of each other
    total += result.notes.length;
    if (result.tooMany || total > MAX_NOTES) return { ok: false, error: 'tooLarge' };
    parts.push(result);
  }
  if (total === 0) return { ok: false, error: 'empty' };

  // Time signatures: the first one seen at a tick wins; 4/4 when the file has none at tick 0.
  const signatures = new Map<number, TimeSignature>();
  for (const part of parts) {
    for (const signature of part.timeSignatures) {
      if (!signatures.has(signature.tick)) signatures.set(signature.tick, signature);
    }
  }
  const first = signatures.get(0) ?? { tick: 0, numerator: 4, denominator: 4 };
  signatures.set(0, first);

  // Key signatures the same way: the first part that says something at a tick wins; C when none.
  const keys = new Map<number, KeySignature>();
  for (const part of parts) {
    for (const key of part.keySignatures) if (!keys.has(key.tick)) keys.set(key.tick, key);
  }

  // A first measure shorter than its time signature is a pickup: everything moves later by the
  // missing length, so the bar lines of the score fall where the file has them (FR-7).
  const firstMeasure = parts.find((part) => part.firstMeasureTicks > 0)?.firstMeasureTicks ?? 0;
  const barTicks = (first.numerator * 4 * ticksPerQuarter) / first.denominator;
  const shift =
    firstMeasure > 0 && firstMeasure < barTicks - 0.5 ? Math.round(barTicks - firstMeasure) : 0;

  const tempos: TempoChange[] = [{ tick: 0, time: 0, microsPerQuarter: MICROS_PER_QUARTER }];
  const seconds = (tick: number) => tickToSeconds(tempos, ticksPerQuarter, tick);

  const notes: PieceNote[] = parts
    .flatMap((part) => part.notes)
    .map((draft) => {
      const startTick = draft.startTick + shift;
      const endTick = draft.endTick + shift;
      return {
        note: draft.note,
        startTick,
        endTick,
        start: seconds(startTick),
        end: seconds(endTick),
        velocity: VELOCITY,
        ...(draft.hand ? { hand: draft.hand } : {}),
        ...(draft.spelling ? { spelling: draft.spelling } : {}),
        ...(draft.voice ? { voice: draft.voice } : {}),
      };
    })
    .sort((a, b) => a.startTick - b.startTick || a.note - b.note);

  const duration = Math.max(...notes.map((note) => note.end));
  if (duration > MAX_DURATION_SECONDS) return { ok: false, error: 'tooLarge' };

  const pedal: PedalChange[] = parts
    .flatMap((part) => part.pedal)
    .map((change) => ({ tick: change.tick + shift, on: change.on }))
    .sort((a, b) => a.tick - b.tick)
    .map((change) => ({ ...change, time: seconds(change.tick) }));

  const timeSignatures = [...signatures.values()]
    .map((signature) =>
      signature.tick === 0 ? signature : { ...signature, tick: signature.tick + shift },
    )
    .sort((a, b) => a.tick - b.tick);

  const keySignatures = buildKeySignatures(
    [...keys.values()].map((key) => (key.tick === 0 ? key : { ...key, tick: key.tick + shift })),
  );

  return {
    ok: true,
    piece: {
      ticksPerQuarter,
      notes,
      pedal,
      tempos,
      timeSignatures,
      keySignatures,
      duration,
    } satisfies Piece,
  };
}
