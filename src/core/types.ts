/** Where a note event came from. */
export type NoteSource = 'midi' | 'computer' | 'screen' | 'playback';

/** The one event shape that every input source emits into the note pipeline. */
export type NoteEvent =
  | { type: 'noteon'; note: number; velocity: number; source: NoteSource }
  | { type: 'noteoff'; note: number; source: NoteSource }
  | { type: 'sustain'; on: boolean; source: NoteSource };

export type NoteListener = (event: NoteEvent) => void;
