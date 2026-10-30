// Pure: a minimal, non-validating XML reader for the subset MusicXML uses (no namespaces).

export interface XmlElement {
  name: string;
  attributes: Readonly<Record<string, string>>;
  children: readonly XmlElement[];
  /** The text directly inside the element, trimmed. */
  text: string;
}

const NAMED_ENTITIES: Record<string, string> = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-z]+);/g, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body] ?? whole;
  });
}

/** Past this depth the file is treated as malformed (it also bounds the stack of the walkers). */
const MAX_DEPTH = 64;

const NAME_CHAR = /[^\s/>=]/;

/** Parses a document and returns its root element, or `null` when it is malformed. Never throws. */
export function parseXml(source: string): XmlElement | null {
  let pos = 0;
  const length = source.length;
  const stack: {
    name: string;
    attributes: Record<string, string>;
    children: XmlElement[];
    text: string[];
  }[] = [];
  const result: { root: XmlElement | null } = { root: null };

  const skipSpace = () => {
    while (pos < length && /\s/.test(source[pos])) pos++;
  };
  const readName = () => {
    const start = pos;
    while (pos < length && NAME_CHAR.test(source[pos])) pos++;
    return source.slice(start, pos);
  };

  const close = (): XmlElement => {
    const open = stack.pop()!;
    const element: XmlElement = {
      name: open.name,
      attributes: open.attributes,
      children: open.children,
      text: decodeEntities(open.text.join('')).trim(),
    };
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(element);
    else result.root = element;
    return element;
  };

  while (pos < length) {
    const lt = source.indexOf('<', pos);
    const textEnd = lt === -1 ? length : lt;
    if (textEnd > pos) {
      const chunk = source.slice(pos, textEnd);
      const top = stack[stack.length - 1];
      if (top) top.text.push(chunk);
      else if (chunk.trim() !== '' && !chunk.startsWith('﻿')) return null;
      pos = textEnd;
    }
    if (lt === -1) break;

    if (source.startsWith('<!--', pos)) {
      const end = source.indexOf('-->', pos + 4);
      if (end === -1) return null;
      pos = end + 3;
    } else if (source.startsWith('<![CDATA[', pos)) {
      const end = source.indexOf(']]>', pos + 9);
      const top = stack[stack.length - 1];
      if (end === -1 || !top) return null;
      // CDATA is literal: escape it so the later entity decoding leaves it alone.
      top.text.push(source.slice(pos + 9, end).replace(/&/g, '&amp;'));
      pos = end + 3;
    } else if (source.startsWith('<?', pos)) {
      const end = source.indexOf('?>', pos + 2);
      if (end === -1) return null;
      pos = end + 2;
    } else if (source.startsWith('<!', pos)) {
      // A DOCTYPE, possibly with an internal subset in brackets. Skipped, never expanded.
      let depth = 0;
      let i = pos + 2;
      for (; i < length; i++) {
        if (source[i] === '[') depth++;
        else if (source[i] === ']') depth--;
        else if (source[i] === '>' && depth <= 0) break;
      }
      if (i >= length) return null;
      pos = i + 1;
    } else if (source.startsWith('</', pos)) {
      pos += 2;
      const name = readName();
      skipSpace();
      if (source[pos] !== '>') return null;
      pos++;
      const top = stack[stack.length - 1];
      if (!top || top.name !== name) return null;
      close();
    } else {
      pos++;
      const name = readName();
      if (name === '') return null;
      const attributes: Record<string, string> = {};
      let selfClosing = false;
      for (;;) {
        skipSpace();
        if (pos >= length) return null;
        if (source[pos] === '>') {
          pos++;
          break;
        }
        if (source[pos] === '/' && source[pos + 1] === '>') {
          selfClosing = true;
          pos += 2;
          break;
        }
        const attribute = readName();
        skipSpace();
        if (attribute === '' || source[pos] !== '=') return null;
        pos++;
        skipSpace();
        const quote = source[pos];
        if (quote !== '"' && quote !== "'") return null;
        const end = source.indexOf(quote, pos + 1);
        if (end === -1) return null;
        attributes[attribute] = decodeEntities(source.slice(pos + 1, end));
        pos = end + 1;
      }
      if (result.root !== null && stack.length === 0) return null; // a second root element
      if (stack.length >= MAX_DEPTH) return null;
      stack.push({ name, attributes, children: [], text: [] });
      if (selfClosing) close();
    }
  }

  return stack.length === 0 ? result.root : null;
}

/** The first child element with this name. */
export function child(element: XmlElement, name: string): XmlElement | undefined {
  return element.children.find((item) => item.name === name);
}

/** All child elements with this name. */
export function childrenNamed(element: XmlElement, name: string): XmlElement[] {
  return element.children.filter((item) => item.name === name);
}

/** The text of the first child with this name, or `undefined`. */
export function childText(element: XmlElement, name: string): string | undefined {
  return child(element, name)?.text;
}
