// Pure: reads the directory of a zip archive. Decompression is done by the adapter
// (`playback/loadScoreFile.ts`), so this module stays synchronous and free of platform APIs.
import { child, childrenNamed, parseXml } from './xml.ts';

export interface ZipEntry {
  name: string;
  /** 0 = stored, 8 = deflate. */
  method: number;
  encrypted: boolean;
  compressedSize: number;
  uncompressedSize: number;
  /** The compressed bytes of the entry, as stored in the archive. */
  data: Uint8Array;
}

const END_OF_DIRECTORY = 0x06054b50;
const CENTRAL_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const MAX_ENTRIES = 10_000;

/** Reads the entries of a zip file, or returns `null` when it is not a readable zip. */
export function readZip(bytes: Uint8Array): ZipEntry[] | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // The end-of-directory record is within the last 22 + 65535 bytes (it ends with a comment).
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === END_OF_DIRECTORY) {
      end = i;
      break;
    }
  }
  if (end === -1) return null;

  const count = view.getUint16(end + 10, true);
  let pos = view.getUint32(end + 16, true);
  if (count > MAX_ENTRIES) return null;

  const decoder = new TextDecoder('utf-8');
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (pos + 46 > bytes.length || view.getUint32(pos, true) !== CENTRAL_ENTRY) return null;
    const flags = view.getUint16(pos + 8, true);
    const method = view.getUint16(pos + 10, true);
    const compressedSize = view.getUint32(pos + 20, true);
    const uncompressedSize = view.getUint32(pos + 24, true);
    const nameLength = view.getUint16(pos + 28, true);
    const extraLength = view.getUint16(pos + 30, true);
    const commentLength = view.getUint16(pos + 32, true);
    const localOffset = view.getUint32(pos + 42, true);
    if (pos + 46 + nameLength > bytes.length) return null;
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    pos += 46 + nameLength + extraLength + commentLength;

    // The local header repeats the name and has its own extra field, so its length is read again.
    if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== LOCAL_HEADER) {
      return null;
    }
    const start =
      localOffset +
      30 +
      view.getUint16(localOffset + 26, true) +
      view.getUint16(localOffset + 28, true);
    if (start + compressedSize > bytes.length) return null;

    entries.push({
      name,
      method,
      encrypted: (flags & 1) !== 0,
      compressedSize,
      uncompressedSize,
      data: bytes.subarray(start, start + compressedSize),
    });
  }
  return entries;
}

export const CONTAINER_PATH = 'META-INF/container.xml';

/** The `full-path` of the first `rootfile` of a `container.xml`, or `undefined`. */
export function rootfilePath(containerXml: string): string | undefined {
  const root = parseXml(containerXml);
  const rootfiles = root && child(root, 'rootfiles');
  const first = rootfiles && childrenNamed(rootfiles, 'rootfile')[0];
  return first?.attributes['full-path'] || undefined;
}

/**
 * The entry that holds the score: the one `container.xml` points to, otherwise the first
 * `.musicxml` / `.xml` entry outside `META-INF/`.
 */
export function findScoreEntry(
  entries: readonly ZipEntry[],
  containerXml: string | null,
): ZipEntry | undefined {
  const path = containerXml === null ? undefined : rootfilePath(containerXml);
  const named = path === undefined ? undefined : entries.find((entry) => entry.name === path);
  if (named) return named;
  return entries.find(
    (entry) => !entry.name.startsWith('META-INF/') && /\.(musicxml|xml)$/i.test(entry.name),
  );
}
