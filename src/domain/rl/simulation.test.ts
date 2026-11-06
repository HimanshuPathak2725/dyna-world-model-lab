import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PARAMS,
  DynaGridworld,
  GOAL_STATE,
  START_STATE,
  STEP_COST,
} from './simulation.js';
import { runComparison } from './comparison.js';

describe('DynaGridworld transitions', () => {
  it('starts with the documented grid, agent and goal', () => {
    const agent = new DynaGridworld();
    expect(agent.stateCount).toBe(63);
    expect(agent.state).toBe(START_STATE);
    expect(agent.goalState).toBe(GOAL_STATE);
    expect(agent.model.size).toBe(0);
    expect(agent.params).toEqual(DEFAULT_PARAMS);
  });

  it('keeps the agent in place at boundaries and obstacles', () => {
    const agent = new DynaGridworld();
    expect(agent.transition(0, 3)).toEqual({ nextState: 0, reward: STEP_COST, terminal: false });
    expect(agent.transition(3, 1)).toEqual({ nextState: 3, reward: STEP_COST, terminal: false });
    expect(agent.transition(GOAL_STATE - 1, 1)).toEqual({ nextState: GOAL_STATE, reward: 1, terminal: true });
  });

  it('rejects invalid actions and states', () => {
    const agent = new DynaGridworld();
    expect(() => agent.transition(0, 4)).toThrow(RangeError);
    expect(() => agent.transition(63, 0)).toThrow(RangeError);
    expect(() => agent.setGoal(START_STATE)).toThrow(RangeError);
    expect(() => agent.setGoal(4)).toThrow(RangeError);
  });
});

describe('learning and planning', () => {
  it('applies the analytic first Q-update and stores the observed transition', () => {
    const agent = new DynaGridworld();
    agent.setParams({ epsilon: 0, planningSteps: 0, alpha: 0.18 });
    const event = agent.step();
    const target = event.terminal ? event.reward : event.reward + agent.params.gamma * 0;
    const expected = 0.18 * target;
    expect(event.delta).toBeCloseTo(expected, 7);
    expect(agent.q[event.state * 4 + event.action]).toBeCloseTo(expected, 7);
    expect(agent.model.get(event.state * 4 + event.action)).toEqual({
      state: event.state,
      action: event.action,
      nextState: event.nextState,
      reward: event.reward,
      terminal: event.terminal,
    });
    expect(agent.totalRealSteps).toBe(1);
    expect(agent.totalModelSteps).toBe(0);
  });

  it('samples only observed state–action pairs for planning', () => {
    const agent = new DynaGridworld();
    agent.setParams({ epsilon: 0, planningSteps: 8 });
    const event = agent.step();
    expect(event.planning).toHaveLength(8);
    expect(agent.totalModelSteps).toBe(8);
    expect(agent.model.size).toBe(1);
    for (const update of event.planning) {
      expect(agent.model.has(update.state * 4 + update.action)).toBe(true);
    }
    expect(agent.totalRealSteps).toBe(1);
  });

  it('replays exactly the same stochastic sequence for the same seed', () => {
    const first = new DynaGridworld({ seed: 42 });
    const second = new DynaGridworld({ seed: 42 });
    first.setParams({ planningSteps: 4 });
    second.setParams({ planningSteps: 4 });
    for (let index = 0; index < 20; index += 1) {
      expect(first.step()).toEqual(second.step());
    }
  });

  it('keeps Q-values and stored entries when a relocated goal makes them stale', () => {
    const agent = new DynaGridworld({ width: 3, height: 1, obstacles: [], start: 0, goal: 2 });
    agent.state = 1;
    agent.q[1 * 4 + 1] = 1;
    agent.setParams({ epsilon: 0, planningSteps: 0 });
    const event = agent.step();
    expect(event.terminal).toBe(true);
    const qBefore = Array.from(agent.q);
    const modelBefore = new Map(agent.model);
    agent.setGoal(1);
    expect(Array.from(agent.q)).toEqual(qBefore);
    expect(agent.model).toEqual(modelBefore);
    expect(agent.state).toBe(0);
    const stored = agent.model.get(1 * 4 + 1)!;
    const current = agent.transition(1, 1);
    expect(stored.reward).toBe(1);
    expect(stored.terminal).toBe(true);
    expect(current.reward).toBe(STEP_COST);
    expect(current.terminal).toBe(false);
    expect(agent.goalRevision).toBe(1);
  });

  it('terminates an unsuccessful episode at the configured step limit', () => {
    const agent = new DynaGridworld({ width: 2, height: 1, obstacles: [], start: 0, goal: 1, maxStepsPerEpisode: 10 });
    agent.q[1] = -1;
    agent.setParams({ epsilon: 0, planningSteps: 0 });
    let event;
    for (let index = 0; index < 10; index += 1) event = agent.step();
    expect(event!.done).toBe(true);
    expect(event!.reason).toBe('limit');
    expect(agent.returns).toHaveLength(1);
    expect(agent.returns[0].success).toBe(false);
    expect(agent.episode).toBe(1);
  });

  it('maintains valid states, finite values and model invariants across seeds', () => {
    for (let seed = 1; seed <= 5; seed += 1) {
      const agent = new DynaGridworld({ seed });
      agent.setParams({ planningSteps: 3 });
      for (let index = 0; index < 20; index += 1) {
        agent.step();
        expect(agent.state).toBeGreaterThanOrEqual(0);
        expect(agent.state).toBeLessThan(agent.stateCount);
        expect(agent.q.every(Number.isFinite)).toBe(true);
        expect(agent.modelKeys.length).toBe(agent.model.size);
      }
    }
  });
});

describe('runComparison', () => {
  it('uses paired seeds, exact checkpoints and separate planning budgets', () => {
    const options = { seed: 11, seeds: 2, realBudget: 80, planningSteps: 4, checkpointEvery: 25 } as const;
    const first = runComparison(options);
    const second = runComparison(options);
    expect(first).toEqual(second);
    expect(first.checkpoints).toEqual([0, 25, 50, 75, 80]);
    expect(first.series.map((series) => series.planningSteps)).toEqual([0, 4]);
    expect(first.series.map((series) => series.values)).toHaveLength(2);
    for (const series of first.series) {
      expect(series.values).toHaveLength(first.checkpoints.length);
      expect(series.values.every((value) => value >= 0 && value <= 100)).toBe(true);
    }
  });

  it('rejects an invalid seed count', () => {
    expect(() => runComparison({ seeds: 0 })).toThrow(RangeError);
  });
});
