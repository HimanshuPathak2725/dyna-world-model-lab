import type {
  Action,
  EpisodeEndReason,
  EpisodeRecord,
  GridworldOptions,
  ParameterName,
  PlanningUpdate,
  PolicyEvaluation,
  ResetOptions,
  SimulationParams,
  StateInfo,
  StepEvent,
  StoredTransition,
  Transition,
} from './types.js';

export const GRID_WIDTH = 9;
export const GRID_HEIGHT = 7;
export const STATE_COUNT = GRID_WIDTH * GRID_HEIGHT;

export const ACTIONS: readonly Action[] = Object.freeze([
  Object.freeze({ name: 'North', short: 'N', dx: 0, dz: -1 }),
  Object.freeze({ name: 'East', short: 'E', dx: 1, dz: 0 }),
  Object.freeze({ name: 'South', short: 'S', dx: 0, dz: 1 }),
  Object.freeze({ name: 'West', short: 'W', dx: -1, dz: 0 }),
]);

export const DEFAULT_PARAMS: Readonly<SimulationParams> = Object.freeze({
  alpha: 0.18,
  gamma: 0.95,
  epsilon: 0.14,
  planningSteps: 12,
  maxStepsPerEpisode: 160,
});

export const DEFAULT_OBSTACLES: readonly number[] = Object.freeze([
  4, 13, 22, 31, 40,
  24, 33, 42, 51, 60,
]);

export const START_STATE = 1 + 5 * GRID_WIDTH;
export const GOAL_STATE = 7 + GRID_WIDTH;
export const STEP_COST = -0.04;

const ACTION_COUNT = ACTIONS.length;
const PARAMETER_NAMES: ReadonlySet<ParameterName> = new Set([
  'alpha',
  'gamma',
  'epsilon',
  'planningSteps',
  'maxStepsPerEpisode',
]);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function normalizeParameter(name: ParameterName, value: number): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }

  switch (name) {
    case 'alpha':
      return clamp(value, 0.01, 1);
    case 'gamma':
      return clamp(value, 0, 0.999);
    case 'epsilon':
      return clamp(value, 0, 1);
    case 'planningSteps':
      return Math.round(clamp(value, 0, 50));
    case 'maxStepsPerEpisode':
      return Math.max(10, Math.round(value));
  }
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new TypeError('seed must be a finite number');
  }
  return Math.trunc(seed) >>> 0;
}

function assertState(state: number, width: number, height: number, label = 'state'): void {
  if (!Number.isInteger(state) || state < 0 || state >= width * height) {
    throw new RangeError(`${label} must be an integer within the grid`);
  }
}

export function assertNonnegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a nonnegative integer`);
  }
}

export class DynaGridworld {
  readonly width: number;
  readonly height: number;
  readonly stateCount: number;
  readonly obstacleSet: Set<number>;
  readonly startState: number;
  goalState: number;
  params: SimulationParams;
  q!: Float32Array;
  model!: Map<number, StoredTransition>;
  modelKeys!: number[];
  visits!: Uint32Array;
  state!: number;
  episode!: number;
  episodeReturn!: number;
  episodeSteps!: number;
  returns!: EpisodeRecord[];
  totalRealSteps!: number;
  totalModelSteps!: number;
  totalSuccesses!: number;
  goalRevision!: number;
  seed!: number;
  private _originalGoal: number;
  private _rngState!: number;

  constructor({
    seed = 7,
    width = GRID_WIDTH,
    height = GRID_HEIGHT,
    obstacles = DEFAULT_OBSTACLES,
    start = START_STATE,
    goal = GOAL_STATE,
    maxStepsPerEpisode = 160,
  }: GridworldOptions = {}) {
    if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
      throw new RangeError('width and height must be positive integers');
    }

    this.width = width;
    this.height = height;
    this.stateCount = width * height;

    const obstacleList = Array.from(obstacles);
    for (const obstacle of obstacleList) {
      assertState(obstacle, width, height, 'obstacle');
    }
    this.obstacleSet = new Set(obstacleList);

    assertState(start, width, height, 'start');
    assertState(goal, width, height, 'goal');
    if (start === goal) {
      throw new RangeError('start and goal must be different states');
    }
    if (this.obstacleSet.has(start) || this.obstacleSet.has(goal)) {
      throw new RangeError('start and goal must be walkable');
    }

    this.startState = start;
    this.goalState = goal;
    this._originalGoal = goal;
    this.params = { ...DEFAULT_PARAMS };
    this.setParams({ maxStepsPerEpisode });
    this.reset({ seed, preserveGoal: true });
  }

  reset({ seed = this.seed, preserveGoal = false }: ResetOptions = {}): this {
    this.seed = normalizeSeed(seed);
    this._rngState = this.seed;
    this.goalState = preserveGoal ? this.goalState : this._originalGoal;

    this.q = new Float32Array(this.stateCount * ACTION_COUNT);
    this.model = new Map();
    this.modelKeys = [];
    this.visits = new Uint32Array(this.stateCount);

    this.state = this.startState;
    this.episode = 0;
    this.episodeReturn = 0;
    this.episodeSteps = 0;
    this.returns = [];
    this.totalRealSteps = 0;
    this.totalModelSteps = 0;
    this.totalSuccesses = 0;
    this.goalRevision = 0;

    return this;
  }

  setParams(patch: Partial<SimulationParams> = {}): SimulationParams {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new TypeError('params patch must be an object');
    }

    for (const name of PARAMETER_NAMES) {
      const value = patch[name];
      if (value !== undefined) this.setParameter(name, value);
    }
    return this.params;
  }

  private setParameter<K extends ParameterName>(name: K, value: number): void {
    this.params[name] = normalizeParameter(name, value);
  }

  transition(state: number, action: number): Transition {
    assertState(state, this.width, this.height);
    if (!Number.isInteger(action) || action < 0 || action >= ACTION_COUNT) {
      throw new RangeError('action must be an integer from 0 to 3');
    }

    const x = state % this.width;
    const z = Math.floor(state / this.width);
    const movement = ACTIONS[action];
    const nextX = x + movement.dx;
    const nextZ = z + movement.dz;
    let nextState = state;

    if (nextX >= 0 && nextX < this.width && nextZ >= 0 && nextZ < this.height) {
      const candidate = nextX + nextZ * this.width;
      if (!this.obstacleSet.has(candidate)) {
        nextState = candidate;
      }
    }

    const terminal = nextState === this.goalState;
    return {
      nextState,
      reward: terminal ? 1 : STEP_COST,
      terminal,
    };
  }

  private _random(): number {
    this._rngState = (this._rngState + 0x6d2b79f5) >>> 0;
    let value = this._rngState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  private _greedyAction(state: number, randomizeTies = false): number {
    const offset = state * ACTION_COUNT;
    let bestValue = -Infinity;
    let bestAction = 0;
    let tieCount = 0;

    for (let action = 0; action < ACTION_COUNT; action += 1) {
      const value = this.q[offset + action];
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
        tieCount = 1;
      } else if (value === bestValue) {
        tieCount += 1;
        if (randomizeTies && this._random() < 1 / tieCount) {
          bestAction = action;
        }
      }
    }

    return bestAction;
  }

  private _chooseAction(state: number): number {
    if (this._random() < this.params.epsilon) {
      return Math.floor(this._random() * ACTION_COUNT);
    }
    return this._greedyAction(state, true);
  }

  private _maxQ(state: number): number {
    const offset = state * ACTION_COUNT;
    let maximum = this.q[offset];
    for (let action = 1; action < ACTION_COUNT; action += 1) {
      maximum = Math.max(maximum, this.q[offset + action]);
    }
    return maximum;
  }

  private _updateQ(state: number, action: number, nextState: number, reward: number, terminal: boolean): number {
    const index = state * ACTION_COUNT + action;
    const previous = this.q[index];
    const target = terminal
      ? reward
      : reward + this.params.gamma * this._maxQ(nextState);
    this.q[index] = previous + this.params.alpha * (target - previous);
    return this.q[index] - previous;
  }

  step(): StepEvent {
    const state = this.state;
    const action = this._chooseAction(state);
    const { nextState, reward, terminal } = this.transition(state, action);
    const delta = this._updateQ(state, action, nextState, reward, terminal);
    const key = state * ACTION_COUNT + action;

    if (!this.model.has(key)) {
      this.modelKeys.push(key);
    }
    this.model.set(key, { state, action, nextState, reward, terminal });

    this.visits[state] += 1;
    this.episodeReturn += reward;
    this.episodeSteps += 1;
    this.totalRealSteps += 1;
    this.state = nextState;

    const done = terminal || this.episodeSteps >= this.params.maxStepsPerEpisode;
    const reason: EpisodeEndReason = terminal ? 'goal' : done ? 'limit' : null;
    const planning: PlanningUpdate[] = [];

    for (let index = 0; index < this.params.planningSteps; index += 1) {
      const modelKey = this.modelKeys[Math.floor(this._random() * this.modelKeys.length)];
      const sample = this.model.get(modelKey)!;
      const planningDelta = this._updateQ(
        sample.state,
        sample.action,
        sample.nextState,
        sample.reward,
        sample.terminal,
      );
      this.totalModelSteps += 1;
      planning.push({
        state: sample.state,
        action: sample.action,
        nextState: sample.nextState,
        reward: sample.reward,
        delta: planningDelta,
      });
    }

    const completedReturn = this.episodeReturn;
    const completedSteps = this.episodeSteps;

    if (done) {
      const success = reason === 'goal';
      this.returns.push({
        episode: this.episode + 1,
        return: completedReturn,
        steps: completedSteps,
        success,
        reason,
        totalRealSteps: this.totalRealSteps,
      });
      if (this.returns.length > 300) {
        this.returns.splice(0, this.returns.length - 300);
      }

      this.episode += 1;
      if (success) {
        this.totalSuccesses += 1;
      }
      this.state = this.startState;
      this.episodeReturn = 0;
      this.episodeSteps = 0;
    }

    return {
      state,
      action,
      nextState,
      reward,
      terminal,
      done,
      reason,
      planning,
      delta,
      episodeCompleted: done,
      episodeReturn: done ? completedReturn : this.episodeReturn,
      stateAfter: this.state,
    };
  }

  setGoal(state: number): { oldGoal: number; newGoal: number } {
    assertState(state, this.width, this.height, 'goal');
    if (!this.obstacleSet.has(state) && state !== this.startState) {
      const oldGoal = this.goalState;
      this.goalState = state;
      this.state = this.startState;
      this.episodeReturn = 0;
      this.episodeSteps = 0;
      this.goalRevision += 1;
      return { oldGoal, newGoal: state };
    }

    if (state === this.startState) {
      throw new RangeError('goal must not be the start state');
    }
    throw new RangeError('goal must be walkable');
  }

  shiftGoal(): { oldGoal: number; newGoal: number } {
    const coordinates = [
      [this.width - 2, 1],
      [this.width - 2, this.height - 2],
      [1, 1],
      [Math.floor(this.width / 2), Math.floor(this.height / 2)],
      [Math.floor(this.width / 2), 1],
      [this.width - 2, Math.floor(this.height / 2)],
      [1, this.height - 2],
    ];
    const candidates: number[] = [];

    const addCandidate = (state: number): void => {
      if (
        state >= 0
        && state < this.stateCount
        && state !== this.startState
        && !this.obstacleSet.has(state)
        && !candidates.includes(state)
      ) {
        candidates.push(state);
      }
    };

    addCandidate(this._originalGoal);
    for (const [x, z] of coordinates) {
      if (x >= 0 && x < this.width && z >= 0 && z < this.height) {
        addCandidate(x + z * this.width);
      }
    }

    const currentIndex = candidates.indexOf(this.goalState);
    for (let offset = 1; offset <= candidates.length; offset += 1) {
      const candidate = candidates[(currentIndex + offset) % candidates.length];
      if (candidate !== this.goalState) {
        return this.setGoal(candidate);
      }
    }

    for (let state = 0; state < this.stateCount; state += 1) {
      if (state !== this.goalState && state !== this.startState && !this.obstacleSet.has(state)) {
        return this.setGoal(state);
      }
    }

    throw new Error('No alternative walkable goal is available');
  }

  getStateInfo(state: number): StateInfo {
    assertState(state, this.width, this.height);
    const offset = state * ACTION_COUNT;
    const values = Array.from(this.q.subarray(offset, offset + ACTION_COUNT));
    const maxValue = Math.max(...values);
    const isObstacle = this.obstacleSet.has(state);

    return {
      state,
      x: state % this.width,
      z: Math.floor(state / this.width),
      walkable: !isObstacle,
      values,
      maxValue,
      greedyAction: this._greedyAction(state),
      visits: this.visits[state],
      isGoal: state === this.goalState,
      isStart: state === this.startState,
      isObstacle,
    };
  }

  evaluatePolicy(maxSteps = 100): PolicyEvaluation {
    assertNonnegativeInteger(maxSteps, 'maxSteps');
    let current = this.startState;
    let steps = 0;
    const path = [current];
    const visited = new Set(path);

    while (steps < maxSteps) {
      const action = this._greedyAction(current);
      const { nextState, terminal } = this.transition(current, action);
      current = nextState;
      path.push(current);
      steps += 1;

      if (terminal) {
        return { success: true, steps, path };
      }
      if (visited.has(current)) {
        return { success: false, steps, path };
      }
      visited.add(current);
    }

    return { success: false, steps, path };
  }
}
