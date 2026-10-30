import { describe, expect, it } from 'vitest';
import { attributes, measure, note, part, score } from '../core/musicxmlTestHelpers.ts';
import { ev, midiFile, track } from '../core/smfTestHelpers.ts';
import { makeZip, utf8 } from '../core/zipTestHelpers.ts';
import { loadScoreBytes, MAX_XML_BYTES } from './loadScoreFile.ts';

const xml = score([
  part('P1', measure(attributes({ divisions: 1, beats: '4' }), note('C', 4, 2), note('E', 4, 2))),
]);

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.slice()])
    .stream()
    .pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const container = (path: string) =>
  `<container><rootfiles><rootfile full-path="${path}"/></rootfiles></container>`;

async function mxl(text = xml, path = 'score.musicxml') {
  const data = utf8(text);
  return makeZip([
    { name: 'META-INF/container.xml', data: utf8(container(path)) },
    { name: path, data: await deflate(data), method: 8, uncompressedSize: data.length },
  ]);
}

describe('loadScoreBytes', () => {
  it('opens a MIDI file by its header', async () => {
    const bytes = midiFile([track([ev.noteOn(0, 0, 60), ev.noteOff(480, 0, 60)])]);
    const result = await loadScoreBytes(bytes);
    expect(result.ok && result.piece.notes.map((n) => n.note)).toEqual([60]);
  });

  it('opens a compressed .mxl through its container', async () => {
    const result = await loadScoreBytes(await mxl());
    expect(result.ok && result.piece.notes.map((n) => n.note)).toEqual([60, 64]);
  });

  it('opens an .mxl whose entries are stored, and one without a container', async () => {
    const stored = makeZip([
      { name: 'META-INF/container.xml', data: utf8(container('a.xml')) },
      { name: 'a.xml', data: utf8(xml) },
    ]);
    expect((await loadScoreBytes(stored)).ok).toBe(true);
    const bare = makeZip([{ name: 'score.musicxml', data: utf8(xml) }]);
    expect((await loadScoreBytes(bare)).ok).toBe(true);
  });

  it('opens plain MusicXML, with a BOM and a leading declaration', async () => {
    expect((await loadScoreBytes(utf8(xml))).ok).toBe(true);
    expect((await loadScoreBytes(utf8('﻿' + xml))).ok).toBe(true);
  });

  it('opens UTF-16 text with a byte order mark', async () => {
    const units = [0xfeff, ...[...xml].map((c) => c.charCodeAt(0))];
    const bytes = new Uint8Array(units.length * 2);
    new DataView(bytes.buffer).setUint16(0, 0, true);
    units.forEach((unit, i) => new DataView(bytes.buffer).setUint16(i * 2, unit, true));
    expect((await loadScoreBytes(bytes)).ok).toBe(true);
  });

  it('gives the same id for the same bytes and another id for another file', async () => {
    const a = await loadScoreBytes(utf8(xml));
    const b = await loadScoreBytes(utf8(xml));
    const c = await loadScoreBytes(utf8(xml.replace('<step>C', '<step>D')));
    if (!a.ok || !b.ok || !c.ok) throw new Error('should open');
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^file-[0-9a-f]{8}$/);
    expect(c.id).not.toBe(a.id);
  });

  it('reports files that are not scores', async () => {
    expect(await loadScoreBytes(new Uint8Array())).toEqual({ ok: false, error: 'empty' });
    expect(await loadScoreBytes(utf8('hello'))).toEqual({ ok: false, error: 'notMidi' });
    expect(await loadScoreBytes(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toEqual({
      ok: false,
      error: 'notMidi',
    });
    const noScore = makeZip([{ name: 'readme.txt', data: utf8('hi') }]);
    expect(await loadScoreBytes(noScore)).toEqual({ ok: false, error: 'notMidi' });
    expect(await loadScoreBytes(utf8('<html></html>'))).toEqual({ ok: false, error: 'notMidi' });
  });

  it('reports damaged archives and damaged XML', async () => {
    const zip = await mxl();
    expect(await loadScoreBytes(zip.subarray(0, zip.length - 30))).toEqual({
      ok: false,
      error: 'damaged',
    });
    const garbage = makeZip([
      { name: 'score.xml', data: Uint8Array.from([1, 2, 3, 4, 5]), method: 8 },
    ]);
    expect(await loadScoreBytes(garbage)).toEqual({ ok: false, error: 'damaged' });
    expect(await loadScoreBytes(utf8('<score-partwise><part>'))).toEqual({
      ok: false,
      error: 'damaged',
    });
  });

  it('reports encrypted entries and unknown methods as unsupported', async () => {
    const encrypted = makeZip([{ name: 'score.xml', data: utf8('x'), flags: 1 }]);
    expect(await loadScoreBytes(encrypted)).toEqual({ ok: false, error: 'unsupported' });
    const method = makeZip([{ name: 'score.xml', data: utf8('x'), method: 12 }]);
    expect(await loadScoreBytes(method)).toEqual({ ok: false, error: 'unsupported' });
    expect(await loadScoreBytes(utf8('<score-timewise/>'))).toEqual({
      ok: false,
      error: 'unsupported',
    });
  });

  it('stops inflating past the limit', async () => {
    const big = new Uint8Array(MAX_XML_BYTES + 1000).fill(32); // spaces compress to almost nothing
    const zip = makeZip([
      { name: 'score.xml', data: await deflate(big), method: 8, uncompressedSize: big.length },
    ]);
    expect(zip.length).toBeLessThan(100_000);
    expect(await loadScoreBytes(zip)).toEqual({ ok: false, error: 'tooLarge' });
  });
});
