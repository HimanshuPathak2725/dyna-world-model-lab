import type { StepEvent } from '../../domain/rl/types.js';
import { ACTIONS } from '../../domain/rl/simulation.js';

interface FirstExperimentCallbacks {
  step: () => StepEvent;
  setPlanning: (steps: number) => void;
  inspect: (state: number) => void;
  openFoundations: () => void;
  complete: () => void;
  getQValue: (state: number, action: number) => number;
  getCounts: () => { real: number; model: number; entries: number };
}

type GuideStage = 0 | 1 | 2 | 3;

export class FirstExperimentGuide {
  private readonly panel: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly title: HTMLElement;
  private readonly description: HTMLElement;
  private readonly evidence: HTMLElement;
  private readonly action: HTMLButtonElement;
  private stage: GuideStage = 0;
  private firstEvent: StepEvent | null = null;
  private visible = true;

  constructor(private readonly callbacks: FirstExperimentCallbacks) {
    this.panel = this.element('#first-experiment');
    this.kicker = this.element('#first-step-kicker');
    this.title = this.element('#first-step-title');
    this.description = this.element('#first-step-description');
    this.evidence = this.element('#first-step-evidence');
    this.action = this.element<HTMLButtonElement>('#first-step-action');
    this.action.addEventListener('click', () => this.advance());
    this.element<HTMLButtonElement>('#first-step-basics').addEventListener('click', callbacks.openFoundations);
    this.element<HTMLButtonElement>('#dismiss-first-experiment').addEventListener('click', () => this.setVisible(false));
    this.render();
  }

  private element<T extends Element = HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required element not found: ${selector}`);
    return element;
  }

  private setVisible(visible: boolean): void {
    this.visible = visible;
    this.render();
  }

  show(): void {
    this.setVisible(true);
    this.panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }

  reset(): void {
    this.stage = 0;
    this.firstEvent = null;
    this.render();
  }

  recordStep(event: StepEvent): void {
    if (this.stage === 0) {
      this.firstEvent = event;
      this.stage = 1;
    } else if (this.stage === 2 && event.planning.length > 0) {
      this.stage = 3;
    }
    this.render();
  }

  private advance(): void {
    if (this.stage === 0) {
      this.callbacks.setPlanning(0);
      this.callbacks.step();
      return;
    }
    if (this.stage === 1 && this.firstEvent) {
      this.callbacks.inspect(this.firstEvent.state);
      this.stage = 2;
      this.render();
      return;
    }
    if (this.stage === 2) {
      this.callbacks.setPlanning(4);
      this.callbacks.step();
      return;
    }
    this.setVisible(false);
    this.callbacks.complete();
  }

  private render(): void {
    this.panel.hidden = !this.visible;
    this.element('.app-content').classList.toggle('is-onboarding-complete', !this.visible);
    if (!this.visible) return;
    if (this.stage > 0 && !this.firstEvent) this.stage = 0;

    if (this.stage === 0) {
      this.kicker.textContent = 'START HERE / 01 · REAL EXPERIENCE';
      this.title.textContent = 'Take one step. Nothing runs until you ask.';
      this.description.textContent = 'The agent starts at S46 and the goal is S16. Take one real step to see an action, a reward, a next state and one Q-value update.';
      this.action.textContent = 'Take one real step →';
      this.evidence.hidden = true;
      return;
    }

    const event = this.firstEvent!;
    const action = ACTIONS[event.action];
    this.evidence.hidden = false;
    if (this.stage === 1) {
      this.kicker.textContent = '02 / READ THE EVIDENCE';
      this.title.textContent = 'One action changed one Q-value.';
      this.description.textContent = `S${event.state} → S${event.nextState} via ${action.name}. Reward ${event.reward.toFixed(2)}. The model stored that exact transition. Inspect it before enabling planning.`;
      this.evidence.textContent = `Q(S${event.state}, ${action.short}) changed by δ ${event.delta.toFixed(3)} · new Q ${this.callbacks.getQValue(event.state, event.action).toFixed(4)} · M(S${event.state}, ${action.short}) = (${event.reward.toFixed(2)}, S${event.nextState}, ${event.terminal})`;
      this.action.textContent = 'Inspect this transition →';
      return;
    }
    if (this.stage === 2) {
      this.kicker.textContent = '03 / REUSE THE MODEL';
      this.title.textContent = 'Now rehearse what the agent remembers.';
      this.description.textContent = 'Set N = 4 for the next real step. Four stored transitions will be sampled for extra Q-updates. Watch the separate real and model counters.';
      this.evidence.textContent = `Observed memory: M(S${event.state}, ${action.short}) = (${event.reward.toFixed(2)}, S${event.nextState}, ${event.terminal}). This is a lookup entry, not a neural prediction.`;
      this.action.textContent = 'Take a step with N = 4 →';
      return;
    }

    const counts = this.callbacks.getCounts();
    this.kicker.textContent = 'THE COMPLETE DYNA-Q LOOP';
    this.title.textContent = 'Real experience teaches. The model rehearses.';
    this.description.textContent = 'You have seen action, reward, storage and planning. Continue with the guided experiments, including moving the goal to expose stale model entries.';
    this.evidence.textContent = `${counts.real} real steps · ${counts.model} model updates · ${counts.entries} stored state–action pairs. Planning used memory; it did not create new environment evidence.`;
    this.action.textContent = 'Continue guided experiments →';
  }
}
