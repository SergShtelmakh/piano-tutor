import type { NoteEvent, NoteListener } from '../core/types.ts';

export interface NoteBus {
  /** Delivers the event to every listener synchronously, in subscription order. */
  emit(event: NoteEvent): void;
  subscribe(listener: NoteListener): () => void;
}

/** The single entry point of the note pipeline: every input source emits here. */
export function createNoteBus(): NoteBus {
  const listeners = new Set<NoteListener>();

  return {
    emit(event) {
      for (const listener of [...listeners]) {
        try {
          listener(event);
        } catch (error) {
          // One broken subscriber must not block the sound or the highlight.
          console.error('Note listener failed', error);
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
