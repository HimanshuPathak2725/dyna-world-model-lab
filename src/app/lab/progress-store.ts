export interface ViewSettings {
  values: boolean;
  policy: boolean;
  modelUpdates: boolean;
  minimap: boolean;
  hints: boolean;
}

export interface StoredProgress {
  completed: string[];
  quizBest: number;
  view: ViewSettings;
}

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

export const STORAGE_KEY = 'dyna-paper-lab-v1';
export const DEFAULT_VIEW: ViewSettings = {
  values: true,
  policy: true,
  modelUpdates: true,
  minimap: true,
  hints: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function loadProgress(storage: ReadableStorage = localStorage): StoredProgress {
  try {
    const value: unknown = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    if (!isRecord(value)) throw new TypeError('Saved progress must be an object');
    const rawView = isRecord(value.view) ? value.view : {};
    const view = { ...DEFAULT_VIEW };
    for (const key of Object.keys(view) as (keyof ViewSettings)[]) {
      if (typeof rawView[key] === 'boolean') view[key] = rawView[key];
    }
    return {
      completed: Array.isArray(value.completed)
        ? value.completed.filter((id): id is string => typeof id === 'string')
        : [],
      quizBest: typeof value.quizBest === 'number' && Number.isFinite(value.quizBest)
        ? value.quizBest
        : 0,
      view,
    };
  } catch {
    return { completed: [], quizBest: 0, view: { ...DEFAULT_VIEW } };
  }
}

export function saveProgress(progress: StoredProgress, storage: WritableStorage = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
