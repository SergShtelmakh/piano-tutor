// Pure: a short hash of a file's bytes, used to give a file from the learner's disk a stable id.

/** FNV-1a, 32 bits, as 8 hex digits. Not secure: it only has to tell different files apart. */
export function contentHash(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
