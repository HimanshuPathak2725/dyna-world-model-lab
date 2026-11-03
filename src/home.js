import './home.css';
import { brandMark, icon } from './icons.js';

const pathwayArt = {
  foundations: `<svg viewBox="0 0 220 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="16" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><rect x="88" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><rect x="160" y="28" width="42" height="30" rx="5" fill="#f6eddd"/><path d="m62 43 22 0m18 0h22m18 0h22" stroke="#1aa3a1" stroke-dasharray="4 3"/><circle cx="37" cy="43" r="5" fill="#1aa3a1" stroke="none"/><circle cx="109" cy="43" r="5" fill="#c0652d" stroke="none"/><circle cx="181" cy="43" r="5" fill="#f0a53a" stroke="none"/><path d="M37 70c18 18 55 18 72 0s54-18 72 0" stroke="#18213d" stroke-dasharray="3 4"/></g></svg>`,
  research: `<svg viewBox="0 0 220 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M35 60 88 25l48 45 48-45M88 25l2 50 46-5 48 45M35 60l53 15 48-45" stroke="#c0652d" stroke-dasharray="4 4"/><circle cx="35" cy="60" r="7" fill="#1aa3a1" stroke="none"/><circle cx="88" cy="25" r="7" fill="#c0652d" stroke="none"/><circle cx="90" cy="75" r="7" fill="#18213d" stroke="none"/><circle cx="136" cy="70" r="7" fill="#f0a53a" stroke="none"/><circle cx="184" cy="25" r="7" fill="#1aa3a1" stroke="none"/></g></svg>`,
};

function pathwayCard({ number, title, description, category, level, art, action, label }) {
  return `<article class="pathway-card reveal">
    <div class="pathway-art">${art}</div>
    <div class="card-meta"><span>${number}</span><span>${category}</span></div>
    <h3>${title}</h3>
    <p>${description}</p>
    <div class="card-footer"><span class="level-label">${level}</span><a class="text-link" href="${action.href}">${label} ${icon('arrowUpRight', 15)}</a></div>
  </article>`;
}

function researchVisual(type) {
  if (type === 'world') return `<svg class="research-diagram" viewBox="0 0 240 110" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="18" y="35" width="44" height="42" rx="5" fill="#f6eddd"/><rect x="168" y="35" width="44" height="42" rx="5" fill="#f6eddd"/><path d="M62 56h106" stroke="#1aa3a1" stroke-dasharray="5 4"/><circle cx="120" cy="56" r="17" fill="#1aa3a1" stroke="none"/><path d="m104 56 16-11 16 11-16 11Z" fill="#f6eddd" stroke="#18213d"/><circle cx="40" cy="56" r="5" fill="#c0652d" stroke="none"/><circle cx="190" cy="56" r="5" fill="#f0a53a" stroke="none"/></g></svg>`;
  if (type === 'dyna') return `<svg class="research-diagram" viewBox="0 0 240 110" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M34 65c28-42 68-42 96 0s68 42 76 0" stroke="#1aa3a1"/><path d="M35 78c30-37 65-37 95 0" stroke="#c0652d" stroke-dasharray="4 4"/><circle cx="35" cy="65" r="6" fill="#1aa3a1" stroke="none"/><circle cx="130" cy="65" r="6" fill="#c0652d" stroke="none"/><circle cx="206" cy="65" r="6" fill="#f0a53a" stroke="none"/></g></svg>`;
  return `<svg class="research-diagram" viewBox="0 0 240 110" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M40 78 78 28l48 50 48-50M78 28l48 50 48-50" stroke="#1aa3a1" stroke-dasharray="4 4"/><circle cx="40" cy="78" r="6" fill="#c0652d" stroke="none"/><circle cx="78" cy="28" r="6" fill="#1aa3a1" stroke="none"/><circle cx="126" cy="78" r="6" fill="#f0a53a" stroke="none"/><circle cx="174" cy="28" r="6" fill="#18213d" stroke="none"/><path d="M78 28v50" stroke="#c0652d"/></g></svg>`;
}

export function renderHomepage() {
  return `
    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/" aria-label="DYNA home"><span class="brand-symbol">${brandMark}</span><span class="brand-copy"><strong>DYNA</strong><small>WORLD MODEL LAB</small></span></a>
        <nav class="desktop-nav" aria-label="Primary navigation">
          <a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a class="nav-cta" href="/lab">Enter the Lab ${icon('arrowUpRight', 15)}</a>
        </nav>
        <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation menu"><span></span><span></span><span></span></button>
      </div>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden>
        <a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a class="nav-cta" href="/lab">Enter the Lab ${icon('arrowUpRight', 15)}</a>
      </nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow">INTERACTIVE WORLD MODEL LEARNING LAB</p>
          <h1 id="hero-title">How does an<br>intelligent agent<br>learn the world?</h1>
          <p class="hero-description">Explore how intelligent agents build internal models, predict what happens next, and learn to plan — through interactive simulations and scientific research.</p>
          <div class="hero-actions"><a class="button-primary" href="/lab">Explore the Lab ${icon('arrowUpRight', 16)}</a><a class="button-secondary" href="#research">Discover Research</a></div>
          <p class="reassurance">Open to explore · No account required</p>
        </div>
        <div class="hero-guide" aria-label="Nia, DYNA research guide">
          <div class="nia-stage">
            <div class="nia-orbit" aria-hidden="true"></div><div class="nia-grid" aria-hidden="true"></div>
            <div class="guide-badge"><span></span>YOUR DYNA RESEARCH GUIDE</div>
            <img class="nia-image" src="/nia.svg" alt="Nia, a research guide with dark shoulder-length hair, an ivory jacket and a scientific tablet" width="420" height="560" loading="eager">
            <div class="nia-name"><strong>Nia</strong><span>Research Guide</span></div>
            <div class="guide-dialogue" id="guide-dialogue">
              <span class="dialogue-label">NIA / RESEARCH GUIDE</span>
              <p>Hi! I'm Nia, your guide through DYNA.</p>
              <p>We'll explore how intelligent agents learn, predict and plan.</p>
              <p>You can start with a small experiment or discover the research behind these ideas.</p>
              <div class="dialogue-actions"><a href="/lab">Start exploring ${icon('arrowUpRight', 14)}</a><a href="#research">Explore research ${icon('arrowUpRight', 14)}</a></div>
              <button class="guide-attention" id="guide-attention" type="button" aria-label="Ask Nia to highlight the laboratory"><span></span><span id="nia-status" aria-live="polite">A little guidance, when you need it</span></button>
            </div>
          </div>
        </div>
      </section>

      <section class="pathways section-shell" id="learn" aria-labelledby="pathways-title">
        <div class="section-heading reveal"><p class="eyebrow">THREE WAYS IN</p><h2 id="pathways-title">Choose how you want to explore.</h2><p>Build your understanding, experiment with intelligent agents, and discover the research shaping world models.</p></div>
        <div class="pathway-grid">
          ${pathwayCard({ number: '01', title: 'Build the Foundations', description: 'Understand states, actions, rewards, reinforcement learning and the mathematical ideas behind predictive models.', category: 'LEARNING PATH', level: 'BEGINNER → ADVANCED', art: pathwayArt.foundations, action: { href: '/lab' }, label: 'Explore the current learning experience' })}
          <article class="pathway-card reveal"><div class="pathway-art lab-art"><img src="/images/willow-grid.png" alt="The actual Willow Grid 3D laboratory" loading="lazy"></div><div class="card-meta"><span>02</span><span>INTERACTIVE LABS</span></div><h3>Enter the Laboratory</h3><p>Interact with simulated environments, adjust learning parameters, observe agent behavior and test your own hypotheses.</p><div class="card-footer"><span class="level-label">HANDS-ON</span><a class="text-link" href="/lab">Open Willow Grid ${icon('arrowUpRight', 15)}</a></div></article>
          ${pathwayCard({ number: '03', title: 'Explore the Research', description: 'Discover foundational papers, neural world models, planning approaches and experimental investigations.', category: 'RESEARCH DESK', level: 'RESEARCH & IMPLEMENTATION', art: pathwayArt.research, action: { href: '#research' }, label: 'Explore research' })}
        </div>
      </section>

      <section class="research-section section-shell" id="research" aria-labelledby="research-title">
        <div class="section-heading reveal"><p class="eyebrow">SELECTED THIRD-PARTY RESEARCH</p><h2 id="research-title">Research that moves beyond the screen.</h2><p>Explore the ideas, architectures and experiments behind agents that learn to predict and interact with the world.</p></div>
        <div class="research-layout">
          <article class="featured-paper reveal"><div class="paper-topline"><span class="paper-type">FEATURED PAPER</span><span class="paper-year">2018</span></div><div class="paper-main"><div><h3>World Models</h3><p class="paper-authors">David Ha and Jürgen Schmidhuber</p><span class="paper-category">FOUNDATIONAL RESEARCH</span><p>How can an agent learn a compact representation of its environment and use that representation to imagine future possibilities?</p><a class="text-link" href="https://arxiv.org/abs/1803.10122" target="_blank" rel="noopener noreferrer">Read the original paper ${icon('arrowUpRight', 15)}</a></div><div class="paper-art">${researchVisual('world')}</div></div></article>
          <div class="supporting-papers">
            <article class="support-paper reveal"><div class="paper-topline"><span class="paper-type">SUPPORTING PAPER 01</span><span class="paper-year">1991</span></div><div class="paper-art small-art">${researchVisual('dyna')}</div><h3>Dyna Architecture</h3><p class="paper-authors">Richard S. Sutton</p><span class="paper-category">MODEL-BASED REINFORCEMENT LEARNING</span><p>Learning, planning and reacting within a unified reinforcement-learning architecture.</p><a class="text-link" href="https://doi.org/10.1145/122344.122377" target="_blank" rel="noopener noreferrer">View original publication ${icon('arrowUpRight', 15)}</a></article>
            <article class="support-paper reveal"><div class="paper-topline"><span class="paper-type">SUPPORTING PAPER 02</span><span class="paper-year">2025</span></div><div class="paper-art small-art">${researchVisual('dreamer')}</div><h3>DreamerV3</h3><p class="paper-authors">Danijar Hafner and collaborators</p><span class="paper-category">LEARNED WORLD MODELS</span><p>An example of how learned world models can support agents across a range of challenging control tasks.</p><a class="text-link" href="https://www.nature.com/articles/s41586-025-08744-2" target="_blank" rel="noopener noreferrer">Read the research ${icon('arrowUpRight', 15)}</a></article>
          </div>
        </div>
      </section>

      <section class="lab-showcase section-shell" aria-labelledby="showcase-title">
        <div class="showcase-copy reveal"><p class="eyebrow">CURRENT LABORATORY</p><h2 id="showcase-title">Don't just read about it. Try it.</h2><h3>Willow Grid — The first DYNA laboratory</h3><p>Explore how an agent learns to navigate an environment, updates its value estimates and uses a learned model to perform additional planning.</p><a class="button-primary" href="/lab">Open the Interactive Lab ${icon('arrowUpRight', 16)}</a></div>
        <figure class="showcase-figure reveal"><img src="/images/willow-grid.png" alt="The deployed Willow Grid laboratory with a 3D gridworld, value tiles, policy arrows and a minimap" loading="lazy"><figcaption><span class="live-dot"></span>THE REAL WORKING LABORATORY</figcaption></figure>
      </section>

      <section class="final-cta section-shell" aria-labelledby="cta-title">
        <div class="cta-inner reveal"><div><p class="eyebrow">BEGIN WITH A SMALL WORLD</p><h2 id="cta-title">Your first experiment is waiting.</h2><p>Start with a simple world. Discover how an agent learns. Then explore the science behind what happens next.</p><a class="button-primary" href="/lab">Enter DYNA Lab ${icon('arrowUpRight', 16)}</a></div><div class="cta-nia"><img src="/nia.svg" alt="" aria-hidden="true"><span>Nia, your research guide</span></div></div>
      </section>
    </main>

    <footer class="site-footer" id="about">
      <div class="footer-grid"><div><a class="brand footer-brand" href="/"><span class="brand-symbol">${brandMark}</span><span class="brand-copy"><strong>DYNA</strong><small>WORLD MODEL LAB</small></span></a><p>An interactive world model learning and research lab. Explore how agents learn, predict and plan.</p></div><nav aria-label="Footer navigation"><a href="/">Home</a><a href="#learn">Learn</a><a href="/lab">Labs</a><a href="#research">Research</a><a href="#about">About</a><a href="https://github.com/HimanshuPathak2725/dyna-world-model-lab" target="_blank" rel="noopener noreferrer">GitHub ${icon('arrowUpRight', 14)}</a></nav></div>
      <div class="footer-bottom"><span>© 2026 DYNA. Built for exploration.</span><span>Observe · Imagine · Learn</span></div>
    </footer>
  `;
}

document.querySelector('#app').innerHTML = renderHomepage();

export function initHomepage() {
  const menuToggle = document.querySelector('#menu-toggle');
  const mobileMenu = document.querySelector('#mobile-menu');
  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileMenu.hidden = !open;
  };
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (event) => {
    if (!mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });

  const guide = document.querySelector('#guide-dialogue');
  const status = document.querySelector('#nia-status');
  let attentionTimer;
  document.querySelector('#guide-attention').addEventListener('click', () => {
    guide.classList.add('is-speaking');
    status.textContent = 'Nia is highlighting the laboratory';
    clearTimeout(attentionTimer);
    attentionTimer = setTimeout(() => {
      guide.classList.remove('is-speaking');
      status.textContent = 'A little guidance, when you need it';
    }, 2400);
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

  const header = document.querySelector('.site-header');
  const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

initHomepage();
