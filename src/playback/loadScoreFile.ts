import { contentHash } from '../core/contentHash.ts';
import { parseMusicXml } from '../core/musicxml.ts';
import { MAX_FILE_BYTES, parseMidiFile, type ParseError, type Piece } from '../core/smf.ts';
import { CONTAINER_PATH, findScoreEntry, readZip, type ZipEntry } from '../core/zip.ts';

/** The score inside a `.mxl` may be much larger than the archive; this bounds what is inflated. */
export const MAX_XML_BYTES = 20 * 1024 * 1024;

export type LoadScoreResult =
  | {
      ok: true;
      piece: Piece;
      /** `file-<hash of the file's bytes>`, stable across sessions. */ id: string;
    }
  | { ok: false; error: ParseError };

const MIDI_MAGIC = [0x4d, 0x54, 0x68, 0x64]; // "MThd"
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // "PK\x03\x04"

const startsWith = (bytes: Uint8Array, magic: number[]) => magic.every((b, i) => bytes[i] === b);

/** Inflates raw deflate data, stopping once it would pass `limit` bytes. */
async function inflate(
  data: Uint8Array,
  limit: number,
): Promise<Uint8Array | 'tooLarge' | 'damaged'> {
  try {
    const stream = new Blob([data.slice()])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) {
        await reader.cancel();
        return 'tooLarge';
      }
      chunks.push(value);
    }
    const out = new Uint8Array(total);
    let at = 0;
    for (const chunk of chunks) {
      out.set(chunk, at);
      at += chunk.length;
    }
    return out;
  } catch {
    return 'damaged';
  }
}

async function unpack(
  entry: ZipEntry,
): Promise<Uint8Array | 'tooLarge' | 'damaged' | 'unsupported'> {
  if (entry.encrypted) return 'unsupported';
  if (entry.method === 0) return entry.data.length > MAX_XML_BYTES ? 'tooLarge' : entry.data;
  if (entry.method === 8) return inflate(entry.data, MAX_XML_BYTES);
  return 'unsupported';
}

/** UTF-8, or UTF-16 when the file starts with a byte order mark. */
function decodeText(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  return new TextDecoder('utf-8').decode(bytes);
}

/** Reads a score from bytes. The format is detected from the content, not from a file name. */
export async function loadScoreBytes(bytes: Uint8Array): Promise<LoadScoreResult> {
  const id = `file-${contentHash(bytes)}`;
  const done = (result: { ok: true; piece: Piece } | { ok: false; error: ParseError }) =>
    result.ok ? { ...result, id } : result;

  if (bytes.length === 0) return { ok: false, error: 'empty' };
  if (bytes.length > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' };

  if (startsWith(bytes, MIDI_MAGIC)) return done(parseMidiFile(bytes));

  let xmlBytes = bytes;
  if (startsWith(bytes, ZIP_MAGIC)) {
    const entries = readZip(bytes);
    if (!entries) return { ok: false, error: 'damaged' };

    // The container is only a pointer to the score; without it the first xml entry is used.
    const containerEntry = entries.find((entry) => entry.name === CONTAINER_PATH);
    const container = containerEntry ? await unpack(containerEntry) : null;
    const containerText = container instanceof Uint8Array ? decodeText(container) : null;

    const scoreEntry = findScoreEntry(entries, containerText);
    if (!scoreEntry) return { ok: false, error: 'notMidi' };
    const unpacked = await unpack(scoreEntry);
    if (!(unpacked instanceof Uint8Array)) return { ok: false, error: unpacked };
    xmlBytes = unpacked;
  }

  const text = decodeText(xmlBytes).trimStart(); // TextDecoder already drops a byte order mark
  if (!text.startsWith('<')) return { ok: false, error: 'notMidi' };
  return done(parseMusicXml(text));
}

/** Reads a file chosen by the learner and parses it. The file never leaves the device. */
export async function loadScoreFile(file: File): Promise<LoadScoreResult> {
  // Check the size first, so a huge file is never read into memory.
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'tooLarge' };
  try {
    return await loadScoreBytes(new Uint8Array(await file.arrayBuffer()));
  } catch {
    return { ok: false, error: 'damaged' }; // the file could not be read
  }
}
