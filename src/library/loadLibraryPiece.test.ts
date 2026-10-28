import { describe, expect, it } from 'vitest';
import { ev, midiFile, track } from '../core/smfTestHelpers.ts';
import { loadLibraryPiece } from './loadLibraryPiece.ts';

const piece = { composer: 'bach', slug: 'bwv-515-aria' };
const bytes = midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(480, 0, 60)])]);

/** A fetch that answers with the given response and remembers the URLs it was asked for. */
function fakeFetch(respond: () => Response | Promise<Response>) {
  const urls: string[] = [];
  const fetchFile = (async (url: string) => {
    urls.push(url);
    return respond();
  }) as unknown as typeof fetch;
  return { fetchFile, urls };
}

const midiResponse = () =>
  new Response(bytes.buffer as ArrayBuffer, {
    status: 200,
    headers: { 'content-type': 'audio/midi' },
  });

describe('loadLibraryPiece', () => {
  it('fetches the file under the base path and parses it', async () => {
    const { fetchFile, urls } = fakeFetch(midiResponse);
    const result = await loadLibraryPiece(piece, '/piano-tutor/', fetchFile);
    expect(urls).toEqual(['/piano-tutor/library/bach/bwv-515-aria.mid']);
    expect(result.ok).toBe(true);
  });

  it('reports a failed response as a network error', async () => {
    const { fetchFile } = fakeFetch(() => new Response('missing', { status: 404 }));
    expect(await loadLibraryPiece(piece, '/', fetchFile)).toEqual({ ok: false, error: 'network' });
  });

  it('reports a thrown fetch (offline) as a network error', async () => {
    const offline = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    expect(await loadLibraryPiece(piece, '/', offline)).toEqual({ ok: false, error: 'network' });
  });

  it('reports a fallback page that answers a missing file with HTML as a network error', async () => {
    const { fetchFile } = fakeFetch(
      () =>
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    );
    expect(await loadLibraryPiece(piece, '/', fetchFile)).toEqual({ ok: false, error: 'network' });
  });

  it('reports data that is not MIDI as not MIDI', async () => {
    const { fetchFile } = fakeFetch(
      () => new Response('hello world', { status: 200, headers: { 'content-type': 'audio/midi' } }),
    );
    expect(await loadLibraryPiece(piece, '/', fetchFile)).toEqual({ ok: false, error: 'notMidi' });
  });
});
