import { pieceUrl } from '../core/library.ts';
import type { LibraryPiece } from '../core/libraryCatalog.ts';
import { parseMidiFile, type ParseResult } from '../core/smf.ts';

export type LibraryLoadResult = ParseResult | { ok: false; error: 'network' };

/**
 * Fetches a library piece from the app's own static files and parses it. A failed request (offline
 * and not cached yet, a missing file, a server error, an HTML fallback page) is `network`. `base` and `fetchFile` can be
 * replaced in tests.
 */
export async function loadLibraryPiece(
  piece: Pick<LibraryPiece, 'composer' | 'slug'>,
  base: string = import.meta.env.BASE_URL,
  fetchFile: typeof fetch = (...args) => fetch(...args),
): Promise<LibraryLoadResult> {
  try {
    const response = await fetchFile(pieceUrl(base, piece));
    // A host that answers a missing file with its fallback page (HTML) did not find the piece.
    const type = response.headers.get('content-type') ?? '';
    if (!response.ok || type.includes('text/html')) return { ok: false, error: 'network' };
    return parseMidiFile(new Uint8Array(await response.arrayBuffer()));
  } catch {
    return { ok: false, error: 'network' };
  }
}
