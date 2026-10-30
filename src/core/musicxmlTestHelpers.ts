// Test helper: builds MusicXML text in code, so tests need no fixture files.

export interface NoteOptions {
  alter?: number;
  chord?: boolean;
  staff?: number;
  voice?: number;
  tie?: 'start' | 'stop' | 'both';
  grace?: boolean;
  cue?: boolean;
  /** Writes `<unpitched>` instead of `<pitch>`. */
  unpitched?: boolean;
}

export function note(step: string, octave: number, duration: number, options: NoteOptions = {}) {
  const tie = options.tie;
  return [
    '<note>',
    options.grace ? '<grace/>' : '',
    options.cue ? '<cue/>' : '',
    options.chord ? '<chord/>' : '',
    options.unpitched
      ? `<unpitched><display-step>${step}</display-step><display-octave>${octave}</display-octave></unpitched>`
      : `<pitch><step>${step}</step>${options.alter ? `<alter>${options.alter}</alter>` : ''}<octave>${octave}</octave></pitch>`,
    options.grace ? '' : `<duration>${duration}</duration>`,
    tie === 'stop' || tie === 'both' ? '<tie type="stop"/>' : '',
    tie === 'start' || tie === 'both' ? '<tie type="start"/>' : '',
    options.voice ? `<voice>${options.voice}</voice>` : '',
    options.staff ? `<staff>${options.staff}</staff>` : '',
    '</note>',
  ].join('');
}

export const rest = (duration: number) => `<note><rest/><duration>${duration}</duration></note>`;
export const backup = (duration: number) => `<backup><duration>${duration}</duration></backup>`;
export const forward = (duration: number) => `<forward><duration>${duration}</duration></forward>`;
export const pedal = (type: string) =>
  `<direction><direction-type><pedal type="${type}"/></direction-type></direction>`;

export function attributes(
  options: {
    divisions?: number;
    beats?: string;
    beatType?: number;
    staves?: number;
    transpose?: number;
  } = {},
) {
  return [
    '<attributes>',
    options.divisions !== undefined ? `<divisions>${options.divisions}</divisions>` : '',
    options.beats !== undefined
      ? `<time><beats>${options.beats}</beats><beat-type>${options.beatType ?? 4}</beat-type></time>`
      : '',
    options.staves !== undefined ? `<staves>${options.staves}</staves>` : '',
    options.transpose !== undefined
      ? `<transpose><chromatic>${options.transpose}</chromatic></transpose>`
      : '',
    '</attributes>',
  ].join('');
}

export const measure = (...content: string[]) => `<measure>${content.join('')}</measure>`;

export const part = (id: string, ...measures: string[]) =>
  `<part id="${id}">${measures.join('')}</part>`;

/** A `score-partwise` document. `percussion` lists ids of parts on MIDI channel 10. */
export function score(parts: string[], percussion: string[] = []) {
  const ids = parts.map((text) => /<part id="([^"]*)"/.exec(text)![1]);
  const list = ids
    .map(
      (id) =>
        `<score-part id="${id}"><midi-instrument><midi-channel>${
          percussion.includes(id) ? 10 : 1
        }</midi-channel></midi-instrument></score-part>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><part-list>${list}</part-list>${parts.join('')}</score-partwise>`;
}
