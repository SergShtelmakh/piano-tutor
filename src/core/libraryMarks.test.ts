import { describe, expect, it } from 'vitest';
import {
  EMPTY_MARKS,
  parseMarks,
  serialiseMarks,
  toggleDone,
  toggleFavourite,
  type LibraryMarks,
} from './libraryMarks.ts';

describe('toggling marks', () => {
  it('adds and removes a favourite', () => {
    const on = toggleFavourite(EMPTY_MARKS, 'bach/a');
    expect(on.favourites).toEqual(['bach/a']);
    expect(toggleFavourite(on, 'bach/a').favourites).toEqual([]);
  });

  it('adds and removes a done mark, independently of the favourite', () => {
    const marks = toggleDone(toggleFavourite(EMPTY_MARKS, 'bach/a'), 'bach/a');
    expect(marks).toEqual({ favourites: ['bach/a'], done: ['bach/a'] });
    expect(toggleDone(marks, 'bach/a')).toEqual({ favourites: ['bach/a'], done: [] });
  });

  it('keeps the other pieces', () => {
    let marks: LibraryMarks = EMPTY_MARKS;
    marks = toggleFavourite(marks, 'a');
    marks = toggleFavourite(marks, 'b');
    marks = toggleFavourite(marks, 'a');
    expect(marks.favourites).toEqual(['b']);
  });

  it('does not change the marks it was given', () => {
    const marks = toggleFavourite(EMPTY_MARKS, 'a');
    toggleFavourite(marks, 'b');
    expect(marks.favourites).toEqual(['a']);
    expect(EMPTY_MARKS.favourites).toEqual([]);
  });
});

describe('saving and reading marks', () => {
  it('round-trips', () => {
    const marks: LibraryMarks = { favourites: ['a', 'b'], done: ['b'] };
    expect(parseMarks(serialiseMarks(marks))).toEqual(marks);
  });

  it('writes a versioned object', () => {
    expect(JSON.parse(serialiseMarks(EMPTY_MARKS))).toEqual({
      version: 1,
      favourites: [],
      done: [],
    });
  });

  it('means no marks for nothing, for text that is not JSON, and for the wrong shape', () => {
    for (const bad of [null, '', 'not json', '{', '5', 'null', '[]', '"x"']) {
      expect(parseMarks(bad), String(bad)).toEqual(EMPTY_MARKS);
    }
  });

  it('means no marks for another version', () => {
    expect(parseMarks('{"version":2,"favourites":["a"],"done":[]}')).toEqual(EMPTY_MARKS);
    expect(parseMarks('{"favourites":["a"],"done":[]}')).toEqual(EMPTY_MARKS);
  });

  it('drops values that are not strings and repeats, but keeps unknown piece ids', () => {
    const marks = parseMarks(
      '{"version":1,"favourites":["gone/piece","a",3,null,"a"],"done":"oops"}',
    );
    expect(marks).toEqual({ favourites: ['gone/piece', 'a'], done: [] });
  });
});
