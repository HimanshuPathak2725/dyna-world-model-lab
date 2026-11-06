export interface Action {
  name: string;
  short: string;
  dx: number;
  dz: number;
}

export interface SimulationParams {
  alpha: number;
  gamma: number;
  epsilon: number;
  planningSteps: number;
  maxStepsPerEpisode: number;
}

export type ParameterName = keyof SimulationParams;

export interface GridworldOptions {
  seed?: number;
  width?: number;
  height?: number;
  obstacles?: Iterable<number>;
  start?: number;
  goal?: number;
  maxStepsPerEpisode?: number;
}

export interface ResetOptions {
  seed?: number;
  preserveGoal?: boolean;
}

export interface Transition {
  nextState: number;
  reward: number;
  terminal: boolean;
}

export interface StoredTransition extends Transition {
  state: number;
  action: number;
}

export interface PlanningUpdate {
  state: number;
  action: number;
  nextState: number;
  reward: number;
  delta: number;
}

export type EpisodeEndReason = 'goal' | 'limit' | null;

export interface StepEvent extends Transition {
  state: number;
  action: number;
  done: boolean;
  reason: EpisodeEndReason;
  planning: PlanningUpdate[];
  delta: number;
  episodeCompleted: boolean;
  episodeReturn: number;
  stateAfter: number;
}

export interface EpisodeRecord {
  episode: number;
  return: number;
  steps: number;
  success: boolean;
  reason: EpisodeEndReason;
  totalRealSteps: number;
}

export interface StateInfo {
  state: number;
  x: number;
  z: number;
  walkable: boolean;
  values: number[];
  maxValue: number;
  greedyAction: number;
  visits: number;
  isGoal: boolean;
  isStart: boolean;
  isObstacle: boolean;
}

export interface PolicyEvaluation {
  success: boolean;
  steps: number;
  path: number[];
}

export interface ComparisonOptions {
  seed?: number;
  seeds?: number;
  realBudget?: number;
  planningSteps?: number;
  checkpointEvery?: number;
  params?: Partial<SimulationParams>;
}

export interface ComparisonSeries {
  id: string;
  label: string;
  planningSteps: number;
  values: number[];
}

export interface ComparisonResults {
  checkpoints: number[];
  series: ComparisonSeries[];
  seeds: number;
  realBudget: number;
}

export type ComparisonWorkerMessage =
  | { type: 'result'; results: ComparisonResults }
  | { type: 'error'; message: string };
