import './home.css';
import { brandMark, icon } from '../../shared/icons.js';
import {
  DEFAULT_OBSTACLES,
  GOAL_STATE,
  GRID_WIDTH,
  START_STATE,
  STATE_COUNT,
} from '../../domain/rl/simulation.js';

interface Pathway {
  number: string;
  title: string;
  description: string;
  category: string;
  level: string;
  art: string;
  href: string;
  label: string;
}

const pathwayArt = {
  foundations: '<svg viewBox="0 0 220 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><rect x="88" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><rect x="160" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><path d="M62 43h22m22 0h22m22 0h22" stroke="#1aa3a1" stroke-dasharray="4 3"/><circle cx="37" cy="43" r="5" fill="#1aa3a1" stroke="none"/><circle cx="109" cy="43" r="5" fill="#c0652d" stroke="none"/><circle cx="181" cy="43" r="5" fill="#f0a53a" stroke="none"/><path d="M37 70c18 18 55 18 72 0s54-18 72 0" stroke="#18213d" stroke-dasharray="3 4"/></g></svg>',
  research: '<svg viewBox="0 0 220 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M35 60 88 25l48 45 48-45M88 25l2 50 46-5 48 45M35 60l53 15 48-45" stroke="#c0652d" stroke-dasharray="4 4"/><circle cx="35" cy="60" r="7" fill="#1aa3a1" stroke="none"/><circle cx="88" cy="25" r="7" fill="#c0652d" stroke="none"/><circle cx="90" cy="75" r="7" fill="#18213d" stroke="none"/><circle cx="136" cy="70" r="7" fill="#f0a53a" stroke="none"/><circle cx="184" cy="25" r="7" fill="#1aa3a1" stroke="none"/></g></svg>',
};

function willowGridPreview(): string {
  const cells = Array.from({ length: STATE_COUNT }, (_, state) => {
    const x = state % GRID_WIDTH;
    const y = Math.floor(state / GRID_WIDTH);
    const fill = DEFAULT_OBSTACLES.includes(state)
      ? '#26324d'
      : state === GOAL_STATE
        ? '#f0a53a'
        : state === START_STATE
          ? '#1aa3a1'
          : '#e8ddce';
    const label = state === START_STATE ? 'S' : state === GOAL_STATE ? 'G' : '';
    return `<rect x="${15 + x * 35}" y="${17 + y * 30}" width="29" height="24" rx="4" fill="${fill}"/>${label ? `<text x="${15 + x * 35 + 14.5}" y="${17 + y * 30 + 16}" text-anchor="middle" fill="#fffaf0" font-size="10" font-family="JetBrains Mono, monospace">${label}</text>` : ''}`;
  }).join('');
  return `<svg class="model-grid" viewBox="0 0 340 238" role="img" aria-labelledby="grid-preview-title grid-preview-description"><title id="grid-preview-title">The actual Willow Grid state space</title><desc id="grid-preview-description">A nine-column by seven-row grid. Teal marks start state 46, amber marks goal state 16, and navy cells are blocked.</desc><g>${cells}</g><text x="15" y="230" fill="#696d74" font-size="8" font-family="JetBrains Mono, monospace">S46 / START</text><text x="128" y="230" fill="#696d74" font-size="8" font-family="JetBrains Mono, monospace">G16 / GOAL</text><text x="244" y="230" fill="#696d74" font-size="8" font-family="JetBrains Mono, monospace">9 × 7 GRID</text></svg>`;
}

function pathwayCard({ number, title, description, category, level, art, href, label }: Pathway): string {
  return `<article class="pathway-card reveal">
    <div class="pathway-art">${art}</div>
    <div class="card-meta"><span>${number}</span><span>${category}</span></div>
    <h3>${title}</h3>
    <p>${description}</p>
    <div class="card-footer"><span class="level-label">${level}</span><a class="text-link" href="${href}">${label} ${icon('arrowUpRight', 15)}</a></div>
  </article>`;
}

export function renderHomepage(): string {
  return `
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/" aria-label="DYNA home"><span class="brand-symbol">${brandMark}</span><span class="brand-copy"><strong>DYNA</strong><small>MODEL-BASED RL LAB</small></span></a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a class="nav-cta" href="/lab#first-experiment">Start experimenting ${icon('arrowUpRight', 15)}</a>
        </nav>
        <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      </div>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden>
        <a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a class="nav-cta" href="/lab#first-experiment">Start experimenting ${icon('arrowUpRight', 15)}</a>
      </nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">MODEL-BASED REINFORCEMENT LEARNING / INTERACTIVE LAB</p>
          <h1 id="hero-title">Understand how agents learn to predict and plan.</h1>
          <p class="hero-description">An interactive laboratory for model-based reinforcement learning, starting with tabular Dyna-Q. Inspect real transitions, reuse a learned transition model, and discover what happens when that model becomes stale.</p>
          <div class="hero-actions"><a class="button-primary" href="/lab#first-experiment">Run your first experiment ${icon('arrowUpRight', 16)}</a><a class="button-secondary" href="/lab?guide=foundations">Start with the basics</a></div>
          <p class="reassurance">Starts paused · Runs in your browser · No account required</p>
        </div>
        <div class="mechanism-panel reveal" aria-labelledby="mechanism-title">
          <div class="model-header"><div><p class="eyebrow">CURRENT IMPLEMENTATION</p><h2 id="mechanism-title">Tabular Dyna-Q, made inspectable.</h2></div><span class="implementation-badge">OPEN SOURCE</span></div>
          ${willowGridPreview()}
          <div class="model-steps" aria-label="The three operations in this lab">
            <div><span>01 / ACT</span><strong>Experience</strong><p>Choose an action. Observe reward and next state.</p></div>
            <div><span>02 / REMEMBER</span><strong>Store</strong><p>Keep observed transitions in a lookup table.</p></div>
            <div><span>03 / PLAN</span><strong>Reuse</strong><p>Sample memories for additional Q-updates.</p></div>
          </div>
          <p class="scope-note"><strong>Not a neural world model.</strong> This lab uses discrete states and exact, previously observed transitions—not learned latent dynamics or video prediction.</p>
        </div>
      </section>

      <section class="pathways section-shell" id="learn" aria-labelledby="pathways-title">
        <div class="section-heading reveal"><p class="eyebrow">LEARN THE MECHANISM, THEN TEST IT</p><h2 id="pathways-title">Choose a real way in.</h2><p>Short explanations, working experiments, and the research behind them. Each destination takes you somewhere distinct.</p></div>
        <div class="pathway-grid">
          ${pathwayCard({ number: '01', title: 'Learn the mechanism', description: 'States, actions, rewards and Q-values—then a transition model and planning. Three short lessons connected to the live grid.', category: 'FOUNDATIONS / 3 MODULES', level: 'MECHANISM FIRST', art: pathwayArt.foundations, href: '/lab?guide=foundations', label: 'Open the foundations' })}
          <article class="pathway-card reveal"><div class="pathway-art lab-art"><img src="/images/willow-grid.png" alt="The Willow Grid 3D laboratory" loading="lazy"></div><div class="card-meta"><span>02</span><span>GUIDED LAB / 4 EXPERIMENTS</span></div><h3>Experiment with Dyna-Q</h3><p>Take one real step, enable planning, compare equal interaction budgets, then move the goal to expose stale model entries.</p><div class="card-footer"><span class="level-label">PAUSED BY DEFAULT</span><a class="text-link" href="/lab#first-experiment">Open Willow Grid ${icon('arrowUpRight', 15)}</a></div></article>
          ${pathwayCard({ number: '03', title: 'Connect to the research', description: 'See which parts implement Sutton’s Dyna architecture, and why neural world models are a different technical step.', category: 'RESEARCH DESK', level: 'PAPER ↔ IMPLEMENTATION', art: pathwayArt.research, href: '#research', label: 'Compare the ideas' })}
        </div>
      </section>

      <section class="research-section section-shell" id="research" aria-labelledby="research-title">
        <div class="section-heading reveal"><p class="eyebrow">SELECTED THIRD-PARTY RESEARCH</p><h2 id="research-title">From transition tables to learned world models.</h2><p>These papers are external research, not DYNA results. Their labels distinguish the current implementation from future directions.</p></div>
        <div class="research-layout">
          <article class="featured-paper reveal"><div class="paper-topline"><span class="paper-type">THE ARCHITECTURE IN THIS LAB</span><span class="paper-year">1991</span></div><h3>Dyna Architecture</h3><p class="paper-authors">Richard S. Sutton</p><span class="paper-category">MODEL-BASED REINFORCEMENT LEARNING</span><p>Learn from real experience, remember transitions, and reuse them for planning. Willow Grid is a small, direct implementation of that idea.</p><details class="paper-details"><summary>Prerequisites and what to notice</summary><p>Start with Q-learning and the Bellman update. Then separate two kinds of work: updates driven by new environment transitions, and updates driven by samples from the model. The lab exposes both counters and both kinds of evidence.</p></details><div class="paper-actions"><a class="text-link" href="https://doi.org/10.1145/122344.122377" target="_blank" rel="noopener noreferrer">Read the original publication ${icon('arrowUpRight', 15)}</a><a class="text-link" href="/lab#model-inspector">Inspect the implementation ${icon('arrowUpRight', 15)}</a></div></article>
          <div class="supporting-papers">
            <article class="support-paper reveal"><div class="paper-topline"><span class="paper-type">BEYOND THE CURRENT LAB</span><span class="paper-year">2018</span></div><h3>World Models</h3><p class="paper-authors">David Ha and Jürgen Schmidhuber</p><span class="paper-category">LEARNED REPRESENTATIONS & DYNAMICS</span><p>Learn a compact representation of observations and use a learned temporal model to explore possible futures.</p><details class="paper-details"><summary>How this differs from Willow Grid</summary><p>World Models combines a variational autoencoder, a recurrent dynamics model and a controller. Willow Grid has none of those learned components: its state is an integer and its model is a table of observed transitions.</p></details><a class="text-link" href="https://arxiv.org/abs/1803.10122" target="_blank" rel="noopener noreferrer">Read the original paper ${icon('arrowUpRight', 15)}</a></article>
            <article class="support-paper reveal"><div class="paper-topline"><span class="paper-type">LEARNED LATENT DYNAMICS</span><span class="paper-year">2025</span></div><h3>DreamerV3</h3><p class="paper-authors">Danijar Hafner and collaborators</p><span class="paper-category">NEURAL WORLD MODELS / NOT IMPLEMENTED</span><p>A neural world model can support learning behaviors across varied control tasks through latent prediction and imagination.</p><details class="paper-details"><summary>What would change technically</summary><p>Dreamer learns latent dynamics and actor-critic behavior through imagined trajectories. This lab replays sampled one-step table entries. Moving to Dreamer requires learned representations, neural dynamics, training infrastructure and new evaluation—not a visual upgrade.</p></details><a class="text-link" href="https://www.nature.com/articles/s41586-025-08744-2" target="_blank" rel="noopener noreferrer">Read the research ${icon('arrowUpRight', 15)}</a></article>
          </div>
        </div>
        <div class="research-boundary reveal"><h3>Know which system you are looking at.</h3><div class="comparison-table-wrap"><table><caption class="sr-only">A comparison between the implemented Willow Grid and neural world models</caption><thead><tr><th scope="col">Mechanism</th><th scope="col">Willow Grid / current lab</th><th scope="col">Neural world models</th></tr></thead><tbody><tr><th scope="row">Representation</th><td>63 discrete state indices</td><td>Learned latent representations</td></tr><tr><th scope="row">Dynamics</th><td>Exact observed (s, a) → (r, s′, terminal) entries</td><td>Learned predictive dynamics</td></tr><tr><th scope="row">Planning</th><td>Sampled one-step transition replays</td><td>Learned, often multi-step, imagined trajectories</td></tr><tr><th scope="row">Status here</th><td>Implemented and inspectable</td><td>Discussed as a research direction</td></tr></tbody></table></div></div>
      </section>

      <section class="lab-showcase section-shell" aria-labelledby="showcase-title">
        <div class="showcase-copy reveal"><p class="eyebrow">CURRENT LABORATORY / 01</p><h2 id="showcase-title">A working lab, not a neural-world-model demo.</h2><h3>Willow Grid — a 9 × 7 deterministic gridworld</h3><p>The 3D scene, Q-value inspector, transition table and paired-seed comparisons all run locally. Start paused, take one step, inspect the update, then decide how much planning to use.</p><a class="button-primary" href="/lab#first-experiment">Open the interactive lab ${icon('arrowUpRight', 16)}</a></div>
        <figure class="showcase-figure reveal"><img src="/images/willow-grid.png" alt="The Willow Grid laboratory with its 3D gridworld, state inspector, model inspector and minimap" loading="lazy"><figcaption><span class="live-dot"></span>THE ACTUAL WORKING LABORATORY</figcaption></figure>
      </section>

      <section class="final-cta section-shell" aria-labelledby="cta-title">
        <div class="cta-inner reveal"><div><p class="eyebrow">BEGIN WITH EVIDENCE, NOT AUTOPILOT</p><h2 id="cta-title">Start with one real step.</h2><p>See the action, reward, next state and Q-value update before enabling planning. The controls wait for you.</p><a class="button-primary" href="/lab#first-experiment">Run your first experiment ${icon('arrowUpRight', 16)}</a></div></div>
      </section>
    </main>

    <footer class="site-footer" id="about">
      <div class="footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-symbol">${brandMark}</span><span class="brand-copy"><strong>DYNA</strong><small>MODEL-BASED RL LAB</small></span></a><p>An open-source, browser-based laboratory for learning tabular model-based reinforcement learning.</p></div><nav aria-label="Footer navigation"><a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a href="https://github.com/HimanshuPathak2725/dyna-world-model-lab" target="_blank" rel="noopener noreferrer">GitHub ${icon('arrowUpRight', 14)}</a></nav></div>
      <div class="footer-bottom"><span>© 2026 DYNA. Built for exploration.</span><span>Observe · Learn · Plan · Challenge the model</span></div>
    </footer>
  `;
}

function required<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

required<HTMLDivElement>('#app').innerHTML = renderHomepage();

export function initHomepage(): void {
  const menuToggle = required<HTMLButtonElement>('#menu-toggle');
  const mobileMenu = required<HTMLElement>('#mobile-menu');
  const setMenu = (open: boolean): void => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileMenu.hidden = !open;
  };
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileMenu.hidden) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Node)) return;
    if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((element) => observer.observe(element));
  }

  const header = required<HTMLElement>('.site-header');
  const updateHeader = (): void => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

initHomepage();
