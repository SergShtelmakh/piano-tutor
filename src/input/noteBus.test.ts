import { describe, expect, it, vi } from 'vitest';
import type { NoteEvent } from '../core/types.ts';
import { createNoteBus } from './noteBus.ts';

const event: NoteEvent = { type: 'noteon', note: 60, velocity: 100, source: 'screen' };

describe('noteBus', () => {
  it('calls listeners synchronously and in order', () => {
    const bus = createNoteBus();
    const calls: string[] = [];
    bus.subscribe(() => calls.push('a'));
    bus.subscribe(() => calls.push('b'));
    bus.emit(event);
    calls.push('after');
    expect(calls).toEqual(['a', 'b', 'after']);
  });

  it('passes the event through unchanged', () => {
    const bus = createNoteBus();
    const listener = vi.fn();
    bus.subscribe(listener);
    bus.emit(event);
    expect(listener).toHaveBeenCalledWith(event);
  });

  it('stops delivering after unsubscribe', () => {
    const bus = createNoteBus();
    const listener = vi.fn();
    const unsubscribe = bus.subscribe(listener);
    unsubscribe();
    bus.emit(event);
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps delivering when a listener throws', () => {
    const bus = createNoteBus();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const after = vi.fn();
    bus.subscribe(() => {
      throw new Error('boom');
    });
    bus.subscribe(after);
    bus.emit(event);
    expect(after).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });
});
