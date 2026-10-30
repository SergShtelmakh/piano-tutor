// Test helper: builds zip archives in code, so tests need no fixture files.

export interface TestZipEntry {
  name: string;
  /** The bytes as stored in the archive (already compressed when `method` is 8). */
  data: Uint8Array;
  method?: number;
  flags?: number;
  uncompressedSize?: number;
}

const encoder = new TextEncoder();

function u16(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff];
}
function u32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

export function makeZip(entries: readonly TestZipEntry[]): Uint8Array {
  const out: number[] = [];
  const central: number[] = [];
  for (const entry of entries) {
    const name = [...encoder.encode(entry.name)];
    const method = entry.method ?? 0;
    const flags = entry.flags ?? 0;
    const size = entry.uncompressedSize ?? entry.data.length;
    const offset = out.length;
    // The checksum is not verified by the reader, so it is left at zero.
    out.push(
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(flags),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(entry.data.length),
      ...u32(size),
      ...u16(name.length),
      ...u16(0),
      ...name,
      ...entry.data,
    );
    central.push(
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(flags),
      ...u16(method),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(entry.data.length),
      ...u32(size),
      ...u16(name.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset),
      ...name,
    );
  }
  const directoryStart = out.length;
  out.push(
    ...central,
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(central.length),
    ...u32(directoryStart),
    ...u16(0),
  );
  return Uint8Array.from(out);
}

export const utf8 = (text: string): Uint8Array => encoder.encode(text);
