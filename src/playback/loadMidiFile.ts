import { MAX_FILE_BYTES, parseMidiFile, type ParseResult } from '../core/smf.ts';

/** Reads a file chosen by the learner and parses it. The file never leaves the device. */
export async function loadMidiFile(file: File): Promise<ParseResult> {
  // Check the size first, so a huge file is never read into memory.
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' };
  try {
    return parseMidiFile(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return { ok: false, error: 'damaged' }; // the file could not be read
  }
}
