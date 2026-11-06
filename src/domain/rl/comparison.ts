import {
  DynaGridworld,
  assertNonnegativeInteger,
  normalizeParameter,
  normalizeSeed,
} from './simulation.js';
import type {
  ComparisonOptions,
  ComparisonResults,
  ComparisonSeries,
} from './types.js';

export function runComparison({
  seed = 11,
  seeds = 12,
  realBudget = 3000,
  planningSteps = 12,
  checkpointEvery = 250,
  params = {},
}: ComparisonOptions = {}): ComparisonResults {
  normalizeSeed(seed);
  if (!Number.isInteger(seeds) || seeds <= 0) {
    throw new RangeError('seeds must be a positive integer');
  }
  assertNonnegativeInteger(realBudget, 'realBudget');
  if (!Number.isInteger(checkpointEvery) || checkpointEvery <= 0) {
    throw new RangeError('checkpointEvery must be a positive integer');
  }
  if (params === null || typeof params !== 'object' || Array.isArray(params)) {
    throw new TypeError('params must be an object');
  }
  const dynaPlanningSteps = normalizeParameter('planningSteps', planningSteps);

  const checkpoints = [0];
  for (let step = checkpointEvery; step < realBudget; step += checkpointEvery) {
    checkpoints.push(step);
  }
  if (checkpoints[checkpoints.length - 1] !== realBudget) {
    checkpoints.push(realBudget);
  }

  const runSeries = (id: string, label: string, seriesPlanningSteps: number): ComparisonSeries => {
    const successes = new Array<number>(checkpoints.length).fill(0);

    for (let seedIndex = 0; seedIndex < seeds; seedIndex += 1) {
      const agent = new DynaGridworld({ seed: normalizeSeed(seed) + seedIndex });
      agent.setParams({ ...params, planningSteps: seriesPlanningSteps });
      successes[0] += Number(agent.evaluatePolicy().success);

      let checkpointIndex = 1;
      for (let realStep = 1; realStep <= realBudget; realStep += 1) {
        agent.step();
        if (realStep === checkpoints[checkpointIndex]) {
          successes[checkpointIndex] += Number(agent.evaluatePolicy().success);
          checkpointIndex += 1;
        }
      }
    }

    return {
      id,
      label,
      planningSteps: seriesPlanningSteps,
      values: successes.map((count) => count * 100 / seeds),
    };
  };

  return {
    checkpoints,
    series: [
      runSeries('q-learning', 'Q-learning', 0),
      runSeries('dyna-q', 'Dyna-Q', dynaPlanningSteps),
    ],
    seeds,
    realBudget,
  };
}
