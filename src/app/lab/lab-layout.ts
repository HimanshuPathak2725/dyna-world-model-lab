import { brandMark, icon } from '../../shared/icons.js';
import type { ParameterName } from '../../domain/rl/types.js';
import type { ViewSettings } from './progress-store.js';

function parameter(id: Exclude<ParameterName, 'maxStepsPerEpisode'>, label: string, symbol: string, min: number, max: number, step: number, value: number, description: string) {
  return `<div class="parameter" data-parameter="${id}">
    <div class="parameter-heading"><label for="param-${id}"><span>${label}</span><i>${symbol}</i></label><output for="param-${id}" id="value-${id}">${id === 'planningSteps' ? value : Number(value).toFixed(2)}</output></div>
    <input id="param-${id}" data-param="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" aria-describedby="description-${id}" />
    <span class="sr-only" id="description-${id}">${description}</span>
  </div>`;
}

function settingToggle(id: keyof ViewSettings, label: string, description: string, checked = true) {
  return `<label class="switch-row" for="setting-${id}"><span><strong>${label}</strong><small>${description}</small></span><input id="setting-${id}" data-setting="${id}" type="checkbox" ${checked ? 'checked' : ''}/><span class="switch-track" aria-hidden="true"></span></label>`;
}

export function renderLayout() {
  return `
  <div class="loader" id="loader" role="status" aria-live="polite">
    <div class="loader-inner"><span class="loader-logo">${brandMark}</span><p class="loader-title">DYNA</p><p class="loader-subtitle">World Model Lab</p><div class="loader-track"><span></span></div><p class="loader-step">Building the learning loop</p></div>
  </div>
  <div class="artboard" id="artboard">
    <svg class="traces" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
      <path d="M72 116h43v76h96M0 726h84v-62h70M115 941v-54h106v-35M1440 0v54h74v91M1510 236v72h90M1289 941v-55h97v-43h214"/>
      <path d="M94 330H44v118h28M1550 535h-64v88h55M271 0v38h55v29M720 1000v-45h74v-36"/>
      <circle cx="115" cy="192" r="4"/><circle cx="211" cy="192" r="4"/><circle cx="84" cy="664" r="4"/><circle cx="221" cy="887" r="4"/><circle cx="1440" cy="54" r="4"/><circle cx="1514" cy="145" r="4"/><circle cx="1486" cy="623" r="4"/><circle cx="794" cy="919" r="4"/>
    </svg>

    <nav class="sidebar" id="sidebar" aria-label="Main navigation">
      <button class="side-toggle" id="side-toggle" aria-label="Expand sidebar" aria-expanded="false">${icon('chevronRight', 19)}</button>
      <ul class="side-nav">
        <li class="is-on" data-nav-item="lab"><button data-nav="lab" aria-label="Lab" title="Lab">${icon('home', 27)}<span class="side-label">Lab</span></button></li>
        <li data-nav-item="missions"><button data-nav="missions" aria-label="Lessons" title="Lessons">${icon('book', 27)}<span class="side-label">Lessons</span></button></li>
        <li data-nav-item="compare"><button data-nav="compare" aria-label="Compare algorithms" title="Compare">${icon('chart', 27)}<span class="side-label">Compare</span></button></li>
        <li data-nav-item="notes"><button data-nav="notes" aria-label="Field notes" title="Field notes">${icon('route', 27)}<span class="side-label">Field notes</span></button></li>
        <li data-nav-item="settings"><button data-nav="settings" aria-label="Settings" title="Settings">${icon('sliders', 27)}<span class="side-label">Settings</span></button></li>
      </ul>
      <div class="side-credit"><span>HP</span><p>Built for<br><strong>Himanshu</strong></p></div>
    </nav>

    <div class="app-content">
      <header class="brand">
        <span class="brand-logo">${brandMark}</span><span class="brand-rule"></span>
        <div class="brand-text"><h1>DYNA</h1><p>Model-Based RL Lab</p></div>
        <span class="brand-tagline">Observe <i>·</i> Learn <i>·</i> Plan <i>·</i> Challenge</span>
      </header>

      <section class="status" aria-label="Learning progress and counters">
        <div class="progress-card">
          <span class="progress-icon">${icon('brain', 31)}</span>
          <div class="progress-body"><span class="progress-label">Experiments</span><div class="progress-row"><span class="progress-track" id="learning-progress" role="progressbar" aria-label="Completed lessons" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0"><span id="progress-fill"></span></span><span class="progress-count" id="mission-progress">0/4</span></div></div>
        </div>
        <div class="status-metrics">
          <div><span>REAL STEPS</span><strong id="real-steps">0</strong></div>
          <div><span>MODEL</span><strong id="model-steps">0</strong></div>
          <div><span>EPISODE</span><strong id="episode-count">01</strong></div>
        </div>
      </section>

      <section class="first-experiment" id="first-experiment" aria-labelledby="first-step-title">
        <div class="first-step-copy"><span class="panel-kicker" id="first-step-kicker">START HERE / 01 · REAL EXPERIENCE</span><h2 id="first-step-title">Take one step. Nothing runs until you ask.</h2><p id="first-step-description">The agent starts at S46 and the goal is S16. Take one real step to see an action, a reward, a next state and one Q-value update.</p><p class="first-step-evidence" id="first-step-evidence" aria-live="polite" hidden></p></div>
        <div class="first-step-actions"><button class="primary-button" id="first-step-action">Take one real step ${icon('arrow', 16)}</button><button class="secondary-button" id="first-step-basics">${icon('book', 15)} Learn the basics</button></div>
        <button class="icon-button" id="dismiss-first-experiment" aria-label="Dismiss first experiment">${icon('close', 17)}</button>
      </section>

      <main class="stage" id="stage-panel" aria-label="Interactive 3D Dyna-Q environment">
        <div class="stage-heading"><span>EXPERIMENT / 01</span><h2>Willow Grid</h2><p>A small world for large ideas.</p><button class="first-experiment-link" id="show-first-experiment">${icon('flask', 12)} First experiment</button></div>
        <div id="scene-container" class="scene-container"></div>
        <div class="stage-readout"><span><i id="training-dot"></i><span id="environment-status">ENVIRONMENT PAUSED</span></span><strong id="view-state-label">Q-LEARNING / N = 0</strong></div>
        <div class="scene-legend" aria-label="Visualization legend"><span><i class="legend-line real"></i>Real experience</span><span><i class="legend-line model"></i>Model update</span></div>
        <div class="scene-callout agent-callout" id="agent-callout"><span class="callout-icon">${icon('route', 20)}</span><div><strong>THE AGENT</strong><p id="agent-policy-status">ε-greedy policy · paused</p></div><i class="callout-leader"></i></div>
        <div class="scene-callout goal-callout" id="goal-callout"><span class="callout-icon">${icon('target', 20)}</span><div><strong>REWARD +1</strong><p>Terminal goal · move it anytime</p></div><i class="callout-leader"></i></div>
        <div class="goal-mode-banner" id="goal-mode-banner" hidden>${icon('target', 15)} Select a walkable tile for the new goal <kbd>Esc</kbd></div>
        <div class="state-tooltip" id="state-tooltip" hidden></div>
        <div class="minimap" id="minimap-panel">
          <header><span>TOP-DOWN MAP</span><strong id="current-state">S / 46</strong></header>
          <canvas id="minimap-canvas" width="352" height="272" aria-label="Clickable top-down grid map"></canvas>
          <footer><span><i class="mini-agent"></i>Agent</span><span><i class="mini-goal"></i>Goal</span><span>Click to inspect</span></footer>
          <button class="keyboard-grid-toggle" id="keyboard-grid-toggle" aria-expanded="false" aria-controls="keyboard-grid-panel">${icon('keyboard', 13)} Keyboard grid</button>
          <div class="keyboard-grid-panel" id="keyboard-grid-panel" hidden>
            <div class="keyboard-grid-heading"><strong>INSPECT BY KEYBOARD</strong><button class="icon-button" id="keyboard-grid-close" aria-label="Close keyboard grid">${icon('close', 14)}</button></div>
            <p id="state-grid-help">Arrow keys move between states. Enter inspects. Home and End move within a row.</p>
            <div class="state-grid" id="state-grid" role="grid" aria-label="Willow Grid state inspector" aria-describedby="state-grid-help" aria-rowcount="7" aria-colcount="9"></div>
          </div>
        </div>
        <div class="viewbar" aria-label="3D view controls">
          <button data-camera="iso" class="is-active" aria-label="Isometric camera" title="Isometric view" aria-pressed="true">${icon('isoView', 19)}</button>
          <button data-camera="top" aria-label="Top camera" title="Top view" aria-pressed="false">${icon('topView', 19)}</button>
          <button data-camera="side" aria-label="Side camera" title="Side view" aria-pressed="false">${icon('sideView', 19)}</button>
          <span class="viewbar-sep"></span>
          <button id="reset-camera" aria-label="Recenter camera" title="Recenter">${icon('compass', 20)}</button>
          <button id="move-goal" aria-label="Move goal" title="Move goal" aria-pressed="false">${icon('target', 19)}</button>
          <span class="viewbar-sep"></span>
          <button data-view-button="values" class="toggle is-on" aria-label="Toggle value landscape" title="Value landscape" aria-pressed="true">${icon('layers', 19)}</button>
          <button data-view-button="policy" class="toggle is-on" aria-label="Toggle greedy policy" title="Greedy policy" aria-pressed="true">${icon('route', 19)}</button>
          <button data-view-button="modelUpdates" class="toggle is-on" aria-label="Toggle model updates" title="Model updates" aria-pressed="true">${icon('spark', 19)}</button>
          <button id="minimap-toggle" class="toggle is-on" aria-label="Toggle minimap" title="Minimap" aria-pressed="true">${icon('map', 19)}</button>
          <span class="viewbar-sep"></span>
          <button id="fullscreen" aria-label="Enter fullscreen" title="Fullscreen">${icon('expand', 18)}</button>
        </div>
        <div class="view-hint" id="view-hint">Drag to orbit · WASD to pan · Q / E to rotate · Scroll to zoom</div>
      </main>

      <aside class="right-rail">
        <section class="info-card" aria-label="Lesson and state information">
          <div class="tabs" role="tablist" aria-label="Inspector views">
            <button role="tab" data-tab="guide" class="is-active" aria-selected="true" aria-controls="guide-panel">Guide</button>
            <button role="tab" data-tab="state" aria-selected="false" aria-controls="state-panel">State</button>
            <button role="tab" data-tab="model" aria-selected="false" aria-controls="model-panel">Model</button>
          </div>
          <div class="info-body">
            <div class="info-content" id="guide-panel" role="tabpanel">
              <span class="panel-kicker" id="mission-label">01 / REAL EXPERIENCE</span>
              <h2 id="mission-title">First, touch the world.</h2>
              <p class="sub" id="mission-deck">Action → reward → update</p>
              <p class="mission-description" id="mission-description"></p>
              <div class="mission-instruction">${icon('flask', 16)}<span id="mission-instruction"></span></div>
              <div class="mission-actions"><button class="primary-button" id="apply-mission">Run real-only ${icon('arrow', 16)}</button><button class="icon-button" id="next-mission" aria-label="Next lesson" title="Next lesson">${icon('chevronRight', 17)}</button></div>
              <div class="return-panel"><div><span>EPISODE RETURN</span><small id="episode-return">current 0.00</small></div><svg id="reward-chart" viewBox="0 0 340 62" role="img" aria-label="Recent completed episode returns"></svg></div>
              <button class="intuition-link" data-open="quiz-dialog">${icon('spark', 15)} Check your intuition <span id="quiz-best">4 questions</span>${icon('arrowUpRight', 13)}</button>
            </div>
            <div class="info-content" id="state-panel" role="tabpanel" hidden>
              <div class="empty-state" id="state-empty">${icon('cube', 34)}<h2>Inspect a state.</h2><p>Select any tile in the 3D world or minimap to see what the agent currently believes.</p><span>Four actions. Four Q-values. One current policy.</span></div>
              <div id="state-details" hidden>
                <span class="panel-kicker" id="selected-index">STATE / 00</span><h2 id="selected-title">State 0, 0</h2><p class="sub">The value of following the greedy policy from here.</p>
                <div class="value-readout"><span>V(s) = max<sub>a</sub> Q(s,a)</span><strong id="selected-value">0.000</strong></div>
                <div class="q-grid" id="q-grid"></div>
                <div class="inspector-facts"><div><span>Real visits</span><strong id="selected-visits">0</strong></div><div><span>Modeled actions</span><strong id="selected-model">0 / 4</strong></div><div><span>Greedy action</span><strong id="selected-action">North ↑</strong></div></div>
                <button class="secondary-button" id="inspect-model">Compare model with reality ${icon('arrow', 15)}</button>
              </div>
            </div>
            <div class="info-content" id="model-panel" role="tabpanel" hidden>
              <span class="panel-kicker">LEARNED TRANSITION MODEL</span><h2>Memory vs. reality.</h2><p class="sub">A stored prediction and the current world can disagree.</p>
              <div class="coverage-panel"><div><span>Model coverage</span><strong id="model-coverage">0 / 212</strong></div><div class="coverage-track"><span id="coverage-fill"></span></div></div>
              <div class="empty-state compact" id="model-empty">${icon('route', 29)}<p>Select a walkable state to compare all four stored actions with the current environment.</p></div>
              <div id="model-details" hidden>
                <div class="model-state-heading"><strong id="model-state-title">State 0, 0</strong><span id="mismatch-count">0 mismatches</span></div>
                <div class="model-table"><div class="model-row model-head"><span>ACT</span><span>STORED (r, s′)</span><span>CURRENT (r, s′)</span></div><div id="model-rows"></div></div>
                <p class="model-note">${icon('info', 14)} “Not observed” is different from a wrong prediction. Mismatches only appear where the model has an entry.</p>
              </div>
            </div>
          </div>
        </section>

        <section class="control-card" id="control-card" data-state="idle" aria-label="Try the learning loop">
          <header><div><span class="panel-kicker">TRY IT YOURSELF</span><h2>Learning loop</h2></div><div class="code-actions"><button class="icon-button" id="reset-params" aria-label="Restore default parameters" title="Restore defaults">${icon('sliders', 17)}</button><button class="run-button" id="play-toggle" aria-label="Start training" aria-pressed="false">${icon('play', 19)}</button></div></header>
          <div class="transport-row"><button id="single-step" aria-label="Advance one real step">${icon('step', 15)} Step</button><button id="reset-simulation" aria-label="Reset learning">${icon('reset', 15)} Reset</button><div class="speed-control" role="group" aria-label="Simulation speed">${[1, 2, 4, 8].map((value) => `<button data-speed="${value}" class="${value === 2 ? 'active' : ''}" aria-pressed="${value === 2}">${value}×</button>`).join('')}</div></div>
          <div class="control-body">
            <details class="advanced-controls" id="advanced-controls"><summary><span>Technical controls</span><small>ε, α, γ, N and the update loop</small>${icon('chevronRight', 14)}</summary><div class="advanced-controls-body">
              <div class="parameter-list">
                ${parameter('epsilon', 'Explore', 'ε', 0, 0.5, 0.01, 0.14, 'Random action probability')}
                ${parameter('alpha', 'Learn', 'α', 0.01, 0.5, 0.01, 0.18, 'How much each update changes Q')}
                ${parameter('gamma', 'Discount', 'γ', 0.5, 0.99, 0.01, 0.95, 'How much the future matters')}
                ${parameter('planningSteps', 'Plan', 'N', 0, 50, 1, 0, 'Model updates per real step')}
              </div>
              <pre class="learning-code" aria-label="Dyna-Q learning loop"><code><span class="code-line" data-code="act"><i>01</i><b>a</b> ← ε-greedy(<em>Q</em>, s)</span><span class="code-line" data-code="real"><i>02</i>(s′, r) ← <strong>world</strong>.step(a)</span><span class="code-line" data-code="update"><i>03</i>Q.update(s, a, r, s′)</span><span class="code-line" data-code="model"><i>04</i>M(s, a) ← (r, s′)</span><span class="code-line" data-code="plan"><i>05</i><span>repeat <b>N</b>: Q.update(<strong>sample(M)</strong>)</span></span></code></pre>
            </div></details>
            <div class="event-console" id="event-console">
              <div class="console-head"><span class="console-dot"></span><span class="console-title">Event monitor</span><span class="console-status" id="console-status">Paused</span><div class="monitor-filters"><button data-monitor="all" class="active" aria-pressed="true">All</button><button data-monitor="real" aria-pressed="false">Real</button><button data-monitor="model" aria-pressed="false">Model</button></div><button class="console-clear" id="console-toggle" aria-label="Open event monitor" aria-expanded="false" title="Expand event monitor">${icon('monitor', 13)}</button><button class="console-clear" id="clear-monitor" aria-label="Clear event monitor" title="Clear monitor">${icon('trash', 13)}</button></div>
              <div class="console-lines" id="console-lines" aria-live="off"><div class="log-system">Paused. Take one real step when you’re ready.</div></div>
            </div>
          </div>
        </section>
      </aside>

      <section class="lessons" id="lessons" aria-label="Guided experiments">
        <header><h2>Guided experiments</h2><div class="lesson-controls"><button class="lesson-basics" data-open="foundations-dialog">${icon('book', 13)} Foundations</button><span>4 lessons · local progress</span><button class="lesson-step" data-lesson-scroll="prev" aria-label="Previous lessons">${icon('chevronLeft', 16)}</button><button class="lesson-step" data-lesson-scroll="next" aria-label="Next lessons">${icon('chevronRight', 16)}</button></div></header>
        <ol class="lesson-list" id="lesson-list"></ol>
      </section>
      <footer class="app-foot"><span>Built for Himanshu · model-based reinforcement learning</span><span>${icon('keyboard', 14)} <kbd>Space</kbd> run <kbd>N</kbd> step <kbd>R</kbd> reset <kbd>Arrows</kbd> inspect <kbd>WASD</kbd> pan <kbd>Q/E</kbd> rotate</span></footer>
    </div>
  </div>

  <dialog class="modal foundations-modal" id="foundations-dialog" aria-labelledby="foundations-title"><button class="modal-close icon-button" data-close aria-label="Close foundations">${icon('close', 20)}</button><span class="panel-kicker">FOUNDATIONS / <span id="foundations-count">01 / 03</span></span><div id="foundations-content"></div><div class="foundations-nav"><button class="secondary-button" id="foundation-prev">${icon('chevronLeft', 14)} Previous</button><div class="foundation-tabs" aria-label="Foundation chapters"><button data-foundation="0" aria-pressed="true">01 States & actions</button><button data-foundation="1" aria-pressed="false">02 Rewards & Q-learning</button><button data-foundation="2" aria-pressed="false">03 Models & planning</button></div><button class="secondary-button" id="foundation-next">Next ${icon('chevronRight', 14)}</button></div><button class="primary-button" id="foundation-apply"></button></dialog>

  <dialog class="modal notes-modal" id="notes-dialog" aria-labelledby="notes-title"><button class="modal-close icon-button" data-close aria-label="Close field notes">${icon('close', 20)}</button><span class="panel-kicker">FIELD NOTES / 01</span><h2 id="notes-title">One world. Three operations.</h2><p class="modal-lead">Dyna-Q combines learning from reality, learning a model, and reusing that model for additional value updates.</p><div class="note-cards"><article><span class="note-number real-note">01</span><h3>Act in the world</h3><p>Take an ε-greedy action. Observe <code>(s, a, r, s′)</code> and update Q from the real transition.</p><code class="formula">δ = r + γ max Q(s′,·) − Q(s,a)</code></article><article><span class="note-number">02</span><h3>Remember the transition</h3><p>Store the observed reward, next state, and terminal flag in a tabular model indexed by state and action.</p><code class="formula">M(s,a) → (r, s′, terminal)</code></article><article><span class="note-number model-note">03</span><h3>Rehearse an update</h3><p>Sample a previously observed pair, ask the model what happened, and apply the same Bellman update again.</p><code class="formula">(s,a) ∼ M &nbsp;→&nbsp; update Q</code></article></div><div class="honesty-note">${icon('info', 18)}<p><strong>A useful distinction.</strong> The rust links are sampled one-step model transitions, not multi-step imagined rollouts. The comparison is a small deterministic gridworld experiment, not a general algorithm benchmark.</p></div><a class="source-link" href="https://new-portfolio-henna-ten.vercel.app/posts/the-world-models-today/" target="_blank" rel="noreferrer">Read “The World Models Today” on Himanshu’s portfolio ${icon('arrowUpRight', 15)}</a></dialog>

  <dialog class="modal comparison-modal" id="comparison-dialog" aria-labelledby="comparison-title"><button class="modal-close icon-button" data-close aria-label="Close comparison">${icon('close', 20)}</button><span class="panel-kicker">CONTROLLED COMPARISON</span><h2 id="comparison-title">Does imagination earn its keep?</h2><p class="modal-lead">Paired seeds, the same environment, and the same real-transition budget. Only the number of model-based updates changes.</p><div class="comparison-config"><label>Paired seeds<select id="comparison-seeds"><option value="8">8 seeds</option><option value="12" selected>12 seeds</option><option value="16">16 seeds</option></select></label><label>Real budget<select id="comparison-budget"><option value="1500">1,500 steps</option><option value="3000" selected>3,000 steps</option><option value="5000">5,000 steps</option></select></label><label>Dyna planning<select id="comparison-planning"><option value="4">4 updates</option><option value="12" selected>12 updates</option><option value="24">24 updates</option><option value="40">40 updates</option></select></label><button class="primary-button" id="run-comparison">${icon('flask', 16)} Run experiment</button></div><div class="comparison-loading" id="comparison-loading" hidden><span></span><p>Running paired seeds in a Web Worker…</p></div><div id="comparison-results" hidden><div class="comparison-chart-wrap"><svg id="comparison-chart" viewBox="0 0 720 320" role="img" aria-label="Greedy policy success versus real environment steps"></svg></div><div class="comparison-summary" id="comparison-summary"></div><p class="experiment-caveat" id="comparison-caveat"></p></div></dialog>

  <dialog class="modal settings-modal" id="settings-dialog" aria-labelledby="settings-title"><button class="modal-close icon-button" data-close aria-label="Close settings">${icon('close', 20)}</button><span class="panel-kicker">LAB SETTINGS</span><h2 id="settings-title">Tune your point of view.</h2><p class="modal-lead">Visual preferences and course progress stay in this browser. No account, no remote storage.</p><div class="settings-grid"><section><h3>Visible layers</h3>${settingToggle('values', 'Value landscape', 'Height and color encode max Q')}${settingToggle('policy', 'Greedy policy', 'Best current action per state')}${settingToggle('modelUpdates', 'Model updates', 'Transient one-step planning links')}${settingToggle('minimap', 'Top-down minimap', 'A clickable overview of the grid')}${settingToggle('hints', 'Camera hint', 'Show navigation help above the viewbar')}</section><section class="progress-settings"><h3>Your progress</h3><div class="settings-progress" id="settings-progress"></div><button class="secondary-button" id="restore-visuals">${icon('reset', 15)} Restore visual defaults</button><button class="danger-button" id="reset-progress">${icon('trash', 15)} Reset saved progress</button><p>Resetting progress does not change the current learning simulation. The second click confirms the reset.</p></section></div></dialog>

  <dialog class="modal quiz-modal" id="quiz-dialog" aria-labelledby="quiz-title"><button class="modal-close icon-button" data-close aria-label="Close intuition check">${icon('close', 20)}</button><span class="panel-kicker">INTUITION CHECK</span><div id="quiz-content"></div></dialog>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
