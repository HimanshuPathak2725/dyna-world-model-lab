import { runComparison } from '../domain/rl/comparison.js';
import type { ComparisonOptions, ComparisonWorkerMessage } from '../domain/rl/types.js';

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<ComparisonOptions>): void => {
  try {
    const results = runComparison(event.data);
    const message: ComparisonWorkerMessage = { type: 'result', results };
    workerScope.postMessage(message);
  } catch (error) {
    const message: ComparisonWorkerMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Comparison failed',
    };
    workerScope.postMessage(message);
  }
};

export {};
