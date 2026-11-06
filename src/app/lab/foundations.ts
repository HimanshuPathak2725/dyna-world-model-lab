import { FOUNDATIONS } from './content.js';
import type { FoundationTarget } from './content.js';

export class FoundationsGuide {
  private readonly dialog: HTMLDialogElement;
  private readonly previous: HTMLButtonElement;
  private readonly next: HTMLButtonElement;
  private index = 0;

  constructor(private readonly onAction: (target: FoundationTarget) => void) {
    const dialog = document.querySelector<HTMLDialogElement>('#foundations-dialog');
    if (!dialog) throw new Error('Foundations dialog not found');
    this.dialog = dialog;
    this.previous = this.element<HTMLButtonElement>('#foundation-prev');
    this.next = this.element<HTMLButtonElement>('#foundation-next');
    this.previous.addEventListener('click', () => this.select(this.index - 1));
    this.next.addEventListener('click', () => {
      if (this.index === FOUNDATIONS.length - 1) this.apply();
      else this.select(this.index + 1);
    });
    this.element<HTMLButtonElement>('#foundation-apply').addEventListener('click', () => this.apply());
    document.querySelectorAll<HTMLButtonElement>('[data-foundation]').forEach((button) => {
      button.addEventListener('click', () => this.select(Number(button.dataset.foundation)));
    });
    this.render();
  }

  private element<T extends Element = HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required element not found: ${selector}`);
    return element;
  }

  open(): void {
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  private select(index: number): void {
    this.index = Math.max(0, Math.min(FOUNDATIONS.length - 1, index));
    this.render();
  }

  private apply(): void {
    this.dialog.close();
    this.onAction(FOUNDATIONS[this.index].target);
  }

  private render(): void {
    const chapter = FOUNDATIONS[this.index];
    this.element('#foundations-count').textContent = `${String(this.index + 1).padStart(2, '0')} / ${String(FOUNDATIONS.length).padStart(2, '0')}`;
    this.element('#foundations-content').innerHTML = `<h2 id="foundations-title">${chapter.title}</h2><p class="foundation-description">${chapter.description}</p><div class="formula-block"><code>${chapter.formula}</code><p>${chapter.explanation}</p></div>`;
    this.element<HTMLButtonElement>('#foundation-apply').textContent = `${chapter.action} →`;
    this.previous.disabled = this.index === 0;
    this.next.textContent = this.index === FOUNDATIONS.length - 1 ? 'Use this chapter →' : 'Next →';
    document.querySelectorAll<HTMLButtonElement>('[data-foundation]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.foundation) === this.index));
    });
  }
}
