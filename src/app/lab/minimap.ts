import type { DynaGridworld } from '../../domain/rl/simulation.js';
import type { StepEvent } from '../../domain/rl/types.js';

interface MinimapCallbacks {
  onSelect?: (state: number) => void;
}

function colorChannels(color: string): number[] {
  const matches = color.match(/\w\w/g);
  if (!matches) throw new TypeError(`Invalid color: ${color}`);
  return matches.map((value) => parseInt(value, 16));
}

function mixColor(from: string, to: string, amount: number): string {
  const a = colorChannels(from);
  const b = colorChannels(to);
  return `rgb(${a.map((value, index) => Math.round(value + (b[index] - value) * amount)).join(',')})`;
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export class Minimap {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  simulation: DynaGridworld;
  readonly callbacks: MinimapCallbacks;
  selectedState: number | null = null;
  trail: number[];
  cell!: number;
  boardWidth!: number;
  boardHeight!: number;
  offsetX!: number;
  offsetY!: number;

  constructor(canvas: HTMLCanvasElement, simulation: DynaGridworld, callbacks: MinimapCallbacks = {}) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The minimap requires a 2D canvas context');
    this.context = context;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.trail = [simulation.state];
    this.layout();
    canvas.addEventListener('pointerup', (event) => {
      const state = this.pick(event);
      if (state !== null) this.callbacks.onSelect?.(state);
    });
    canvas.addEventListener('pointermove', (event) => {
      canvas.style.cursor = this.pick(event) === null ? 'default' : 'pointer';
    });
  }

  layout(): void {
    const { width, height } = this.simulation;
    this.cell = Math.floor(Math.min((this.canvas.width - 40) / width, (this.canvas.height - 48) / height));
    this.boardWidth = this.cell * width;
    this.boardHeight = this.cell * height;
    this.offsetX = Math.round((this.canvas.width - this.boardWidth) / 2);
    this.offsetY = Math.round((this.canvas.height - this.boardHeight) / 2);
  }

  pick(event: PointerEvent): number | null {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (event.clientX - rect.left) * this.canvas.width / rect.width;
    const canvasY = (event.clientY - rect.top) * this.canvas.height / rect.height;
    const x = Math.floor((canvasX - this.offsetX) / this.cell);
    const z = Math.floor((canvasY - this.offsetY) / this.cell);
    if (x < 0 || z < 0 || x >= this.simulation.width || z >= this.simulation.height) return null;
    return x + z * this.simulation.width;
  }

  setSelected(state: number | null): void {
    this.selectedState = state;
  }

  handleEvent(event: StepEvent): void {
    if (event.done) this.trail = [event.stateAfter];
    else {
      this.trail.push(event.nextState);
      if (this.trail.length > 24) this.trail.shift();
    }
  }

  resetSimulation(): void {
    this.trail = [this.simulation.state];
    this.selectedState = null;
  }

  center(state: number): { x: number; y: number } {
    return {
      x: this.offsetX + (state % this.simulation.width + 0.5) * this.cell,
      y: this.offsetY + (Math.floor(state / this.simulation.width) + 0.5) * this.cell,
    };
  }

  draw(simulation: DynaGridworld = this.simulation): void {
    this.simulation = simulation;
    const context = this.context;
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    context.fillStyle = '#f4ecdf';
    context.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.trail.length > 1) {
      context.beginPath();
      this.trail.forEach((state, index) => {
        const point = this.center(state);
        if (index === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      });
      context.strokeStyle = 'rgba(21,127,125,.38)';
      context.lineWidth = 3;
      context.lineJoin = 'round';
      context.stroke();
    }

    for (let state = 0; state < simulation.width * simulation.height; state += 1) {
      const info = simulation.getStateInfo(state);
      const x = this.offsetX + info.x * this.cell + 2;
      const y = this.offsetY + info.z * this.cell + 2;
      const size = this.cell - 4;
      if (info.isObstacle) context.fillStyle = '#26324d';
      else if (info.isGoal) context.fillStyle = '#f0a53a';
      else {
        const normalized = Math.max(0, Math.min(1, (info.maxValue + 1) / 2));
        context.fillStyle = mixColor('#e8ddce', '#1aa3a1', normalized * 0.82);
      }
      roundedRect(context, x, y, size, size, 4);
      context.fill();
      if (info.isObstacle) {
        context.fillStyle = '#c0652d';
        context.fillRect(x + size * 0.35, y + size * 0.35, size * 0.3, size * 0.3);
      }
      if (info.isStart) {
        context.strokeStyle = '#18213d';
        context.lineWidth = 2;
        roundedRect(context, x + 4, y + 4, size - 8, size - 8, 3);
        context.stroke();
      }
      if (state === this.selectedState) {
        context.strokeStyle = '#c0652d';
        context.lineWidth = 3;
        roundedRect(context, x - 1, y - 1, size + 2, size + 2, 5);
        context.stroke();
      }
    }

    const agent = this.center(simulation.state);
    context.beginPath();
    context.arc(agent.x, agent.y, Math.max(6, this.cell * 0.2), 0, Math.PI * 2);
    context.fillStyle = '#fdf8ef';
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = '#157f7d';
    context.stroke();
    context.beginPath();
    context.arc(agent.x, agent.y, Math.max(2, this.cell * 0.08), 0, Math.PI * 2);
    context.fillStyle = '#157f7d';
    context.fill();
  }
}
