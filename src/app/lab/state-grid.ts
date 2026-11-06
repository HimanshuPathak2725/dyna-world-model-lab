import type { DynaGridworld } from '../../domain/rl/simulation.js';

interface StateGridOptions {
  panel: HTMLElement;
  toggle: HTMLButtonElement;
  closeButton: HTMLButtonElement;
  onSelect: (state: number) => void;
}

export class StateGrid {
  private readonly buttons: HTMLButtonElement[] = [];
  private cursor: number;
  private selectedState: number | null = null;
  private visible = false;

  constructor(
    private readonly grid: HTMLElement,
    private readonly simulation: DynaGridworld,
    private readonly options: StateGridOptions,
  ) {
    this.cursor = simulation.startState;
    this.build();
    options.toggle.addEventListener('click', () => this.setVisible(!this.visible));
    options.closeButton.addEventListener('click', () => this.setVisible(false));
    grid.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>('[data-grid-state]');
      if (button) options.onSelect(Number(button.dataset.gridState));
    });
    grid.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  private build(): void {
    for (let z = 0; z < this.simulation.height; z += 1) {
      const row = document.createElement('div');
      row.className = 'state-grid-row';
      row.setAttribute('role', 'row');
      row.setAttribute('aria-rowindex', String(z + 1));
      for (let x = 0; x < this.simulation.width; x += 1) {
        const state = x + z * this.simulation.width;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.gridState = String(state);
        button.setAttribute('role', 'gridcell');
        button.setAttribute('aria-colindex', String(x + 1));
        button.tabIndex = -1;
        button.innerHTML = `<span aria-hidden="true">${state}</span>`;
        row.appendChild(button);
        this.buttons.push(button);
      }
      this.grid.appendChild(row);
    }
  }

  setVisible(visible: boolean, restoreFocus = true): void {
    this.visible = visible;
    this.options.panel.hidden = !visible;
    this.options.toggle.setAttribute('aria-expanded', String(visible));
    if (visible) {
      this.cursor = this.selectedState ?? this.simulation.state;
      this.refresh();
      if (restoreFocus) this.buttons[this.cursor].focus({ preventScroll: true });
    } else if (restoreFocus) {
      this.options.toggle.focus();
    }
  }

  setSelected(state: number | null): void {
    this.selectedState = state;
    if (state !== null) this.cursor = state;
    this.refresh();
  }

  refresh(): void {
    if (!this.visible) return;
    this.buttons.forEach((button, state) => {
      const info = this.simulation.getStateInfo(state);
      const flags = [
        info.isObstacle ? 'blocked' : 'walkable',
        info.isGoal ? 'goal' : '',
        info.isStart ? 'start' : '',
        state === this.simulation.state ? 'agent here' : '',
        state === this.selectedState ? 'selected' : '',
      ].filter(Boolean).join(', ');
      button.setAttribute('aria-label', `State ${state}, row ${info.z}, column ${info.x}: ${flags}. Value ${info.maxValue.toFixed(3)}.`);
      button.setAttribute('aria-selected', String(state === this.selectedState));
      button.tabIndex = state === this.cursor ? 0 : -1;
      button.className = [
        info.isObstacle ? 'is-obstacle' : '',
        info.isGoal ? 'is-goal' : '',
        info.isStart ? 'is-start' : '',
        state === this.simulation.state ? 'is-agent' : '',
        state === this.selectedState ? 'is-selected' : '',
      ].filter(Boolean).join(' ');
    });
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const state = Number(event.target.dataset.gridState);
    const x = state % this.simulation.width;
    const z = Math.floor(state / this.simulation.width);
    let next = state;
    if (event.key === 'ArrowUp' && z > 0) next -= this.simulation.width;
    else if (event.key === 'ArrowDown' && z < this.simulation.height - 1) next += this.simulation.width;
    else if (event.key === 'ArrowLeft' && x > 0) next -= 1;
    else if (event.key === 'ArrowRight' && x < this.simulation.width - 1) next += 1;
    else if (event.key === 'Home') next = z * this.simulation.width;
    else if (event.key === 'End') next = z * this.simulation.width + this.simulation.width - 1;
    else return;
    event.preventDefault();
    this.cursor = next;
    this.refresh();
    this.buttons[next].focus({ preventScroll: true });
  }
}
