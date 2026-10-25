import { apply, createHeldState } from '../core/heldNotes.ts';
import type { NoteBus } from './noteBus.ts';

export interface LitStore {
  subscribe(callback: () => void): () => void;
  /** The notes physically held right now. A new Set only when it changed (stable for React). */
  getSnapshot(): ReadonlySet<number>;
}

/** Tracks which notes are held, from any source, for the on-screen highlight. */
export function createLitStore(bus: NoteBus): LitStore {
  let state = createHeldState();
  let lit: ReadonlySet<number> = new Set();
  const callbacks = new Set<() => void>();

  bus.subscribe((event) => {
    state = apply(state, event).state;
    if (event.type === 'sustain') return;
    const next = new Set(state.held.keys());
    const changed = next.size !== lit.size || [...next].some((note) => !lit.has(note));
    if (!changed) return;
    lit = next;
    callbacks.forEach((callback) => callback());
  });

  return {
    subscribe(callback) {
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
      };
    },
    getSnapshot: () => lit,
  };
}
