import type { SimulationParams } from '../../domain/rl/types.js';

export interface Mission {
  id: string;
  number: string;
  nav: string;
  title: string;
  label: string;
  deck: string;
  description: string;
  instruction: string;
  action: string;
  params: Partial<SimulationParams>;
  toast: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'interact',
    number: '01',
    nav: 'Meet the loop',
    title: 'First, touch the world.',
    label: 'REAL EXPERIENCE',
    deck: 'Action → reward → update',
    description: 'Before imagination, there is interaction. The agent selects an action, observes a reward and next state, then updates one Q-value.',
    instruction: 'Set planning to 0 and run the agent. The teal trail is real experience; nothing is rehearsed yet.',
    action: 'Run real-only',
    params: { planningSteps: 0, epsilon: 0.14 },
    toast: 'Real experience only. Every Q-update now costs one environment step.',
  },
  {
    id: 'explore',
    number: '02',
    nav: 'Chase uncertainty',
    title: 'Make room for surprise.',
    label: 'EXPLORATION',
    deck: 'Let ε open new paths',
    description: 'A greedy agent can repeat an incomplete story. Exploration keeps a little randomness alive so experience covers more of the world.',
    instruction: 'Raise ε to 0.28. Watch new state–action pairs enter the model while the agent occasionally ignores its current best action.',
    action: 'Increase exploration',
    params: { planningSteps: 0, epsilon: 0.28 },
    toast: 'Exploration raised. Random actions now have probability 0.28.',
  },
  {
    id: 'imagine',
    number: '03',
    nav: 'Learn in imagination',
    title: 'Reuse every experience.',
    label: 'MODEL-BASED UPDATES',
    deck: 'One memory, many updates',
    description: 'Dyna-Q stores observed transitions. Each planning step samples one stored state–action pair and applies another Bellman update—without asking the environment again.',
    instruction: 'Enable 20 planning updates per real step. Rust arcs are one-step model updates, not full imagined trajectories.',
    action: 'Enable imagination',
    params: { planningSteps: 20, epsilon: 0.14 },
    toast: 'Dyna-Q active: 20 model updates now follow each real transition.',
  },
  {
    id: 'mismatch',
    number: '04',
    nav: 'Break the model',
    title: 'Now, break the model.',
    label: 'MODEL MISMATCH',
    deck: 'When memory meets change',
    description: 'A model only describes the world its entries have captured. Move the goal while preserving Q-values and the model: old entries can now disagree with reality.',
    instruction: 'Shift the goal, then open the Model tab. Select a state and compare stored transitions against the current environment.',
    action: 'Shift the goal',
    params: { planningSteps: 20, epsilon: 0.18 },
    toast: 'Goal moved. Q-values and model retained—some entries may now be stale.',
  },
];

export const QUIZ: QuizItem[] = [
  {
    question: 'In Dyna-Q, what does one planning step consume?',
    options: ['A new environment transition', 'A previously observed state–action pair', 'A newly rendered observation'],
    answer: 1,
    explanation: 'Planning samples a transition already stored in the model. It costs computation, not another real environment interaction.',
  },
  {
    question: 'What do the rust-colored links in this laboratory represent?',
    options: ['Long-horizon imagined rollouts', 'The agent’s real movement', 'One-step Bellman updates using the learned model'],
    answer: 2,
    explanation: 'Each rust link visualizes a sampled one-step model transition used for a Q-update. Dyna-Q here is not rolling out a multi-step planner.',
  },
  {
    question: 'Why can planning become misleading immediately after the goal moves?',
    options: ['Stored rewards and terminal flags may describe the old world', 'The learning rate becomes zero', 'Exploration is no longer possible'],
    answer: 0,
    explanation: 'The environment changes at once, but model entries remain unchanged until real transitions overwrite them. Their rewards or terminal flags can be stale.',
  },
  {
    question: 'What is held fixed in the matched-budget comparison?',
    options: ['The total number of Q-updates', 'The number of real environment steps', 'The final greedy policy'],
    answer: 1,
    explanation: 'Both conditions receive the same real-interaction budget. Dyna-Q performs additional model-based updates on top of that budget.',
  },
];


export type FoundationTarget = 'state' | 'experiment' | 'comparison';

export interface Foundation {
  title: string;
  description: string;
  formula: string;
  explanation: string;
  action: string;
  target: FoundationTarget;
}

export const FOUNDATIONS: Foundation[] = [
  {
    title: 'A state is an address, not a learned representation.',
    description: 'Willow Grid has 63 discrete positions. At each position, the agent can choose North, East, South or West. Walls and boundaries can keep it in place.',
    formula: 's ∈ {0, …, 62}   ·   a ∈ {N, E, S, W}',
    explanation: 'The agent starts at S46 and the terminal goal is S16. There is no image encoder, embedding or hidden latent state here: the state is directly inspectable.',
    action: 'Inspect the agent’s state',
    target: 'state',
  },
  {
    title: 'A reward updates one value at a time.',
    description: 'Every ordinary move costs −0.04. Reaching the goal returns +1 and ends the episode. Q-learning uses the reward and the best next-state value to update the action just taken.',
    formula: 'δ = r + γ max Q(s′,·) − Q(s,a)   ·   Q ← Q + αδ',
    explanation: 'Example: with α = 0.18, a −0.04 reward and zero next-state values, the update is −0.04 × 0.18 = −0.0072. The first experiment shows the real values from your step.',
    action: 'Take a guided real step',
    target: 'experiment',
  },
  {
    title: 'The model is memory. Planning is reuse.',
    description: 'After a real transition, the agent stores its reward, next state and terminal flag under that state–action pair. Planning samples those stored entries for extra Q-updates.',
    formula: 'M(s,a) = (r, s′, terminal)   ·   (s,a) ∼ M',
    explanation: 'N = 0 gives Q-learning; N > 0 gives Dyna-Q. This is a transition table, not a neural dynamics model. Planning costs computation, not another environment step, and old entries can become stale when the goal moves.',
    action: 'Compare Q-learning and Dyna-Q',
    target: 'comparison',
  },
];
