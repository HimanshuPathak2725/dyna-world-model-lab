import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEW, loadProgress, saveProgress, STORAGE_KEY } from './progress-store.js';
import type { StoredProgress } from './progress-store.js';

class MemoryStorage {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('progress storage', () => {
  it('falls back safely for malformed JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{invalid');
    expect(loadProgress(storage)).toEqual({ completed: [], quizBest: 0, view: DEFAULT_VIEW });
  });

  it('validates saved fields and ignores invalid view values', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({
      completed: ['interact', 7, null, 'mismatch'],
      quizBest: 'not-a-number',
      view: { values: false, policy: 'false', minimap: false, unknown: true },
    }));
    const progress = loadProgress(storage);
    expect(progress.completed).toEqual(['interact', 'mismatch']);
    expect(progress.quizBest).toBe(0);
    expect(progress.view.values).toBe(false);
    expect(progress.view.policy).toBe(true);
    expect(progress.view.minimap).toBe(false);
    expect(progress.view).not.toHaveProperty('unknown');
  });

  it('round-trips valid progress using the existing storage key', () => {
    const storage = new MemoryStorage();
    const progress: StoredProgress = {
      completed: ['interact', 'imagine'],
      quizBest: 3,
      view: { ...DEFAULT_VIEW, hints: false },
    };
    expect(saveProgress(progress, storage)).toBe(true);
    expect(loadProgress(storage)).toEqual(progress);
    expect(storage.values.has(STORAGE_KEY)).toBe(true);
  });

  it('handles unavailable storage without throwing', () => {
    expect(loadProgress({ getItem: () => { throw new Error('blocked'); } })).toEqual({
      completed: [],
      quizBest: 0,
      view: DEFAULT_VIEW,
    });
    const progress: StoredProgress = { completed: [], quizBest: 0, view: DEFAULT_VIEW };
    expect(saveProgress(progress, { setItem: () => { throw new Error('blocked'); } })).toBe(false);
  });
});
