import { describe, expect, it } from 'vitest';
import { child, childText, childrenNamed, parseXml } from './xml.ts';

describe('parseXml', () => {
  it('reads nesting, attributes with both quote styles, and text', () => {
    const root = parseXml(`<a x="1" y='two'><b>hi</b><b> there </b><c/></a>`)!;
    expect(root.name).toBe('a');
    expect(root.attributes).toEqual({ x: '1', y: 'two' });
    expect(childrenNamed(root, 'b').map((b) => b.text)).toEqual(['hi', 'there']);
    expect(child(root, 'c')?.children).toEqual([]);
    expect(childText(root, 'b')).toBe('hi');
    expect(childText(root, 'missing')).toBeUndefined();
  });

  it('decodes named and numeric entities', () => {
    const root = parseXml(`<a t="&lt;&amp;&quot;">&gt; &#65;&#x42; &unknown;</a>`)!;
    expect(root.attributes.t).toBe('<&"');
    expect(root.text).toBe('> AB &unknown;');
  });

  it('keeps CDATA literal', () => {
    expect(parseXml('<a><![CDATA[<x> &amp;]]></a>')!.text).toBe('<x> &amp;');
  });

  it('skips the declaration, comments, a DOCTYPE with a subset, and a BOM', () => {
    const root = parseXml(
      '﻿<?xml version="1.0"?>\n<!DOCTYPE a [ <!ENTITY e "x"> ]>\n<!-- c --><a><!-- inner --><b/></a>\n',
    )!;
    expect(root.name).toBe('a');
    expect(root.children.map((c) => c.name)).toEqual(['b']);
  });

  it.each([
    ['', 'empty'],
    ['text only', 'no element'],
    ['<a>', 'unclosed'],
    ['<a></b>', 'mismatched'],
    ['<a b=1/>', 'unquoted attribute'],
    ['<a b="1/>', 'unterminated attribute'],
    ['<a/><b/>', 'two roots'],
    ['<a><!-- x </a>', 'unterminated comment'],
    ['</a>', 'stray close'],
  ])('returns null for malformed input: %s (%s)', (source) => {
    expect(parseXml(source)).toBeNull();
  });

  it('refuses a deeply nested document', () => {
    const deep = '<a>'.repeat(200) + '</a>'.repeat(200);
    expect(parseXml(deep)).toBeNull();
  });
});
