import './lab.css';
import { ACTIONS, DEFAULT_PARAMS, DynaGridworld } from '../../domain/rl/simulation.js';
import type { ComparisonOptions, ComparisonResults, ComparisonWorkerMessage, SimulationParams, StepEvent } from '../../domain/rl/types.js';
import { WorldScene } from './scene.js';
import { Minimap } from './minimap.js';
import { icon, lessonArt } from '../../shared/icons.js';
import { MISSIONS, QUIZ } from './content.js';
import type { FoundationTarget } from './content.js';
import { renderLayout } from './lab-layout.js';
import { DEFAULT_VIEW, loadProgress, saveProgress } from './progress-store.js';
import type { ViewSettings } from './progress-store.js';
import type { CameraPreset, ProjectedState } from './scene.js';
import { FirstExperimentGuide } from './first-experiment.js';
import { FoundationsGuide } from './foundations.js';
import { StateGrid } from './state-grid.js';

document.querySelector('#app')!.innerHTML = renderLayout();

function $<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const $$ = <T extends Element = HTMLElement>(selector: string): T[] => [...document.querySelectorAll<T>(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type InspectorTab = 'guide' | 'state' | 'model';
type MonitorFilter = 'all' | 'real' | 'model';

interface MonitorLog {
  type: 'real' | 'model' | 'system';
  text: string;
}

const saved = loadProgress();
const appliedMissions = new Set(saved.completed.filter((id) => MISSIONS.some((mission) => mission.id === id)));
let quizBest = Math.max(0, Math.min(QUIZ.length, saved.quizBest));
let viewSettings: ViewSettings = { ...saved.view };
const simulation = new DynaGridworld();
simulation.setParams({ planningSteps: 0 });
let world: WorldScene | undefined;
let minimap: Minimap;
let running = false;
let speed = 2;
let activeMission = 0;
let activeTab: InspectorTab = 'guide';
let selectedState: number | null = null;
let goalMode = false;
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let accumulator = 0;
let previousTime = performance.now();
let lastUiUpdate = 0;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;
let monitorFilter: MonitorFilter = 'all';
let monitorLogs: MonitorLog[] = [];
let codeFlashTimer: ReturnType<typeof setTimeout> | undefined;
let resetProgressArmed = false;
let lastReturnCount = -1;

try {
  world = new WorldScene($('#scene-container'), simulation, {
    onSelect: handleStateSelect,
    onHover: handleStateHover,
  });
} catch (error) {
  $('#scene-container').innerHTML = '<div class="webgl-fallback"><h3>The 3D view needs WebGL</h3><p>Enable hardware acceleration or use a WebGL-capable browser. The minimap and learning controls still work.</p></div>';
  console.error(error);
}

minimap = new Minimap($<HTMLCanvasElement>('#minimap-canvas'), simulation, { onSelect: handleStateSelect });

function savePreferences(): void {
  saveProgress({
    completed: [...appliedMissions],
    quizBest,
    view: viewSettings,
  });
}

function setActiveNav(name: string): void {
  $$('[data-nav-item]').forEach((item) => item.classList.toggle('is-on', item.dataset.navItem === name));
}

function renderLessons(): void {
  $('#lesson-list').innerHTML = MISSIONS.map((mission, index) => `
    <li><button class="lesson ${index === activeMission ? 'is-active' : ''} ${appliedMissions.has(mission.id) ? 'is-done' : ''}" data-mission="${index}" aria-current="${index === activeMission ? 'true' : 'false'}">
      <span class="lesson-done">${icon('check', 13)}</span>
      <span class="lesson-number">${mission.number}</span>
      ${lessonArt(mission.id)}
      <span class="lesson-title">${mission.nav}</span>
      <span class="lesson-deck">${mission.deck}</span>
    </button></li>`).join('');
  $$('[data-mission]').forEach((button) => button.addEventListener('click', () => {
    selectMission(Number(button.dataset.mission));
  }));
  updateLessonScroll();
}

function selectMission(index: number): void {
  activeMission = (index + MISSIONS.length) % MISSIONS.length;
  renderLessons();
  renderGuide();
  switchTab('guide');
}

function renderGuide(): void {
  const mission = MISSIONS[activeMission];
  $('#mission-label').textContent = `${mission.number} / ${mission.label}`;
  $('#mission-title').textContent = mission.title;
  $('#mission-deck').textContent = mission.deck;
  $('#mission-description').textContent = mission.description;
  $('#mission-instruction').textContent = mission.instruction;
  $('#apply-mission').innerHTML = `${mission.action} ${icon('arrow', 16)}`;
}

function updateProgress(): void {
  const count = appliedMissions.size;
  $('#mission-progress').textContent = `${count}/${MISSIONS.length}`;
  $('#progress-fill').style.width = `${(count / MISSIONS.length) * 100}%`;
  $('#learning-progress').setAttribute('aria-valuenow', String(count));
  $('#quiz-best').textContent = quizBest > 0 ? `best ${quizBest}/${QUIZ.length}` : '4 questions';
  $('#settings-progress').innerHTML = `<div><span>Lessons complete</span><strong>${count} / ${MISSIONS.length}</strong></div><div><span>Best intuition score</span><strong>${quizBest} / ${QUIZ.length}</strong></div><div><span>Storage</span><strong>This browser</strong></div>`;
}

function switchTab(tab: InspectorTab): void {
  activeTab = tab;
  $$('[data-tab]').forEach((button) => {
    const active = button.dataset.tab === tab;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const tabs: InspectorTab[] = ['guide', 'state', 'model'];
  tabs.forEach((name) => {
    $(`#${name}-panel`).hidden = name !== tab;
  });
  if (tab === 'state') renderStateInspector();
  if (tab === 'model') renderModelInspector();
}

function applyMission(): void {
  const mission = MISSIONS[activeMission];
  setParameters(mission.params);
  if (mission.id === 'mismatch') {
    simulation.shiftGoal();
    selectedState = simulation.startState;
    world?.setSelected(selectedState);
    minimap.setSelected(selectedState);
    world?.resetSimulation();
    minimap.resetSimulation();
    minimap.setSelected(selectedState);
    switchTab('model');
    addSystemLog(`WORLD goal moved to S${simulation.goalState}; Q and M preserved`);
  } else {
    world?.sync();
    switchTab('guide');
  }
  appliedMissions.add(mission.id);
  savePreferences();
  running = true;
  updatePlayButton();
  renderLessons();
  updateProgress();
  updateUI(true);
  toast(mission.toast);
}

function setParameters(params: Partial<SimulationParams>): void {
  simulation.setParams(params);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    const input = document.querySelector<HTMLInputElement>(`#param-${key}`);
    if (!input) return;
    input.value = String(value);
    updateRange(input);
  });
  updateEnvironmentLabel();
}

function updateRange(input: HTMLInputElement): void {
  const value = Number(input.value);
  const progress = ((value - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
  input.style.setProperty('--range-progress', `${progress}%`);
  const key = input.dataset.param;
  $(`#value-${key}`).textContent = key === 'planningSteps' ? String(Math.round(value)) : value.toFixed(2);
}

function updateEnvironmentLabel() {
  const count = simulation.params.planningSteps;
  $('#view-state-label').textContent = count > 0 ? `DYNA-Q / N = ${count}` : 'Q-LEARNING / N = 0';
  $('[data-code="plan"] span').innerHTML = `repeat <b>${count}</b>: Q.update(<strong>sample(M)</strong>)`;
}

function updatePlayButton(): void {
  const button = $('#play-toggle');
  button.innerHTML = icon(running ? 'pause' : 'play', 19);
  button.setAttribute('aria-label', running ? 'Pause training' : 'Start training');
  button.setAttribute('aria-pressed', String(running));
  $('#control-card').dataset.state = running ? 'running' : 'idle';
  $('#console-status').textContent = running ? 'Live' : 'Paused';
  $('#training-dot').classList.toggle('paused', !running);
  $('#environment-status').textContent = !running ? 'ENVIRONMENT PAUSED' : simulation.goalRevision > 0 ? 'WORLD CHANGED · LEARNING' : 'LIVE ENVIRONMENT';
  $('#agent-policy-status').textContent = `ε-greedy policy · ${running ? 'running' : 'paused'}`;
}

function performStep(): StepEvent {
  const event = simulation.step();
  world?.handleEvent(event);
  minimap.handleEvent(event);
  recordEvent(event);
  return event;
}

function stepOnce(): StepEvent {
  running = false;
  const event = performStep();
  updatePlayButton();
  updateUI(true);
  firstExperiment.recordStep(event);
  return event;
}

function resetLearning(): void {
  running = false;
  simulation.reset();
  selectedState = null;
  world?.setSelected(null);
  world?.resetSimulation();
  minimap.resetSimulation();
  stateGrid.setSelected(null);
  setGoalMode(false);
  monitorLogs = [];
  addSystemLog('RESET fresh Q-values, model, and counters');
  updatePlayButton();
  updateUI(true);
  firstExperiment.reset();
  toast('Fresh agent. Q-values, model, and counters reset.');
}

function setGoalMode(active: boolean): void {
  goalMode = active;
  world?.setGoalMode(active);
  $('#goal-mode-banner').hidden = !active;
  $('#move-goal').classList.toggle('is-on', active);
  $('#move-goal').setAttribute('aria-pressed', String(active));
}

function handleStateSelect(state: number): void {
  if (goalMode) {
    try {
      simulation.setGoal(state);
      setGoalMode(false);
      selectedState = state;
      world?.setSelected(state);
      world?.resetSimulation();
      minimap.resetSimulation();
      minimap.setSelected(state);
      addSystemLog(`WORLD goal relocated to S${state}; stored model preserved`);
      updatePlayButton();
      updateUI(true);
      switchTab('model');
      toast('Goal relocated. Select a state to compare old model entries with reality.');
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Unable to relocate the goal', 'warning');
    }
    return;
  }
  selectedState = state;
  world?.setSelected(state);
  minimap.setSelected(state);
  stateGrid.setSelected(state);
  switchTab(activeTab === 'model' ? 'model' : 'state');
}

function handleStateHover(state: number | null, event?: PointerEvent): void {
  const tooltip = $('#state-tooltip');
  if (state === null || !event || goalMode) {
    tooltip.hidden = true;
    return;
  }
  const info = simulation.getStateInfo(state);
  tooltip.innerHTML = `<span>S / ${String(state).padStart(2, '0')}</span><strong>${info.isObstacle ? 'Blocked state' : `V(s) ${info.maxValue.toFixed(3)}`}</strong>`;
  const rect = $('#scene-container').getBoundingClientRect();
  const x = Math.min(event.clientX - rect.left + 14, rect.width - 145);
  const y = Math.max(event.clientY - rect.top - 52, 8);
  tooltip.style.transform = `translate(${x}px, ${y}px)`;
  tooltip.hidden = false;
}

function renderStateInspector(): void {
  const state = selectedState;
  $('#state-empty').hidden = state !== null;
  $('#state-details').hidden = state === null;
  if (state === null) return;
  const info = simulation.getStateInfo(state);
  $('#selected-index').textContent = `STATE / ${String(state).padStart(2, '0')}${info.isGoal ? ' · GOAL' : info.isObstacle ? ' · BLOCKED' : ''}`;
  $('#selected-title').textContent = `State ${info.x}, ${info.z}`;
  $('#selected-value').textContent = info.maxValue.toFixed(3);
  $('#q-grid').innerHTML = ACTIONS.map((action, index) => `
    <div class="q-value ${index === info.greedyAction && !info.isObstacle ? 'best' : ''}"><span><b>${['↑', '→', '↓', '←'][index]}</b> Q ${action.short}</span><strong>${info.values[index].toFixed(3)}</strong></div>`).join('');
  $('#selected-visits').textContent = info.visits.toLocaleString();
  const modeled = ACTIONS.filter((_, action) => simulation.model.has(state * 4 + action)).length;
  $('#selected-model').textContent = `${modeled} / 4`;
  $('#selected-action').textContent = info.isObstacle ? 'Blocked' : `${ACTIONS[info.greedyAction].name} ${['↑', '→', '↓', '←'][info.greedyAction]}`;
  $<HTMLButtonElement>('#inspect-model').disabled = info.isObstacle;
}

function formatReward(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function renderModelInspector(): void {
  const state = selectedState;
  $('#model-empty').hidden = state !== null;
  $('#model-details').hidden = state === null;
  if (state === null) {
    $('#model-empty').innerHTML = `${icon('route', 29)}<p>Select a walkable state in the 3D world, minimap or keyboard grid to compare stored actions with the current environment.</p>`;
    return;
  }
  const info = simulation.getStateInfo(state);
  $('#model-empty').hidden = !info.isObstacle;
  $('#model-details').hidden = info.isObstacle;
  if (info.isObstacle) {
    $('#model-empty').innerHTML = `${icon('route', 29)}<p>This is a blocked state. Select a walkable tile so the agent can experience its actions.</p>`;
    return;
  }
  let mismatches = 0;
  let modeled = 0;
  $('#model-state-title').textContent = `State ${info.x}, ${info.z} / S${state}`;
  $('#model-rows').innerHTML = ACTIONS.map((action, actionIndex) => {
    const stored = simulation.model.get(state * 4 + actionIndex);
    const actual = simulation.transition(state, actionIndex);
    if (stored) modeled += 1;
    const mismatch = stored && (
      stored.nextState !== actual.nextState
      || Math.abs(stored.reward - actual.reward) > 1e-8
      || stored.terminal !== actual.terminal
    );
    if (mismatch) mismatches += 1;
    const storedText = stored ? `${formatReward(stored.reward)}, S${stored.nextState}${stored.terminal ? ' · T' : ''}` : 'Not observed';
    const actualText = `${formatReward(actual.reward)}, S${actual.nextState}${actual.terminal ? ' · T' : ''}`;
    return `<div class="model-row ${mismatch ? 'mismatch' : ''}"><span><b>${['↑', '→', '↓', '←'][actionIndex]}</b>${action.short}</span><span>${storedText}</span><span>${actualText}${mismatch ? '<i>STALE</i>' : ''}</span></div>`;
  }).join('');
  $('#mismatch-count').textContent = mismatches ? `${mismatches} mismatch${mismatches === 1 ? '' : 'es'}` : modeled ? 'Observed entries align' : 'No entries yet';
  $('#mismatch-count').classList.toggle('has-mismatch', mismatches > 0);
}

function positionCallout(element: HTMLElement, point: ProjectedState | null, offsetX: number, offsetY: number): void {
  if (!point?.visible) {
    element.classList.remove('is-ready');
    return;
  }
  const stage = $('#stage-panel');
  const x = Math.max(10, Math.min(stage.clientWidth - 172, point.x + offsetX));
  const y = Math.max(82, Math.min(stage.clientHeight - 165, point.y + offsetY));
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.classList.add('is-ready');
}

function updateAnnotations() {
  if (!world?.projectState) return;
  positionCallout($('#agent-callout'), world.projectState(simulation.state, 0.8), -176, -112);
  positionCallout($('#goal-callout'), world.projectState(simulation.goalState, 1.1), 32, -112);
}

function updateUI(force = false) {
  updateAnnotations();
  $('#real-steps').textContent = simulation.totalRealSteps.toLocaleString();
  $('#model-steps').textContent = simulation.totalModelSteps.toLocaleString();
  $('#episode-count').textContent = String(simulation.episode + 1).padStart(2, '0');
  const success = simulation.episode > 0 ? Math.round((simulation.totalSuccesses / simulation.episode) * 100) : 0;
  $('#episode-return').textContent = `current ${simulation.episodeReturn.toFixed(2)} · ${success}% success`;
  $('#current-state').textContent = `S / ${String(simulation.state).padStart(2, '0')}`;
  const possible = (simulation.width * simulation.height - simulation.obstacleSet.size) * 4;
  $('#model-coverage').textContent = `${simulation.model.size} / ${possible}`;
  $('#coverage-fill').style.width = `${Math.min(100, (simulation.model.size / possible) * 100)}%`;
  if (activeTab === 'state') renderStateInspector();
  if (activeTab === 'model') renderModelInspector();
  stateGrid.refresh();
  if (force || simulation.returns.length !== lastReturnCount) {
    lastReturnCount = simulation.returns.length;
    renderRewardChart();
  }
}

function renderRewardChart() {
  const svg = $('#reward-chart');
  const records = simulation.returns.slice(-40);
  if (records.length < 2) {
    svg.innerHTML = '<path d="M0 49H340M0 27H340M0 6H340" stroke="#ded1bf" stroke-width="1" stroke-dasharray="3 5"/><text x="170" y="35" text-anchor="middle" fill="#8b8175" font-size="10" font-family="JetBrains Mono, monospace">Complete episodes to draw the curve</text>';
    return;
  }
  const values = records.map((record) => record.return ?? 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = Math.max(max - min, 0.001);
  const points = values.map((value, index) => ({ x: (index / (values.length - 1)) * 340, y: 54 - ((value - min) / range) * 46 }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const lastPoint = points.at(-1)!;
  svg.innerHTML = `<defs><linearGradient id="return-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1aa3a1" stop-opacity=".24"/><stop offset="1" stop-color="#1aa3a1" stop-opacity="0"/></linearGradient></defs><path d="M0 54H340" stroke="#ded1bf"/><path d="${line} L340,60 L0,60 Z" fill="url(#return-fill)"/><path d="${line}" fill="none" stroke="#157f7d" stroke-width="1.8"/><circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="3" fill="#157f7d"/><text x="2" y="9" fill="#696d74" font-size="8" font-family="JetBrains Mono, monospace">${max.toFixed(2)}</text>`;
}

function recordEvent(event: StepEvent): void {
  monitorLogs.push({
    type: 'real',
    text: `REAL S${event.state} ${ACTIONS[event.action].short} → S${event.nextState}  r ${formatReward(event.reward)}  δ ${event.delta.toFixed(3)}`,
  });
  if (event.planning.length) {
    const update = event.planning[0];
    monitorLogs.push({
      type: 'model',
      text: `PLAN S${update.state} ${ACTIONS[update.action].short} → S${update.nextState}  δ ${update.delta.toFixed(3)}  +${event.planning.length} updates`,
    });
  }
  if (event.terminal) addSystemLog(`GOAL return ${event.episodeReturn.toFixed(2)}; episode ${simulation.episode} complete`, false);
  if (monitorLogs.length > 60) monitorLogs.splice(0, monitorLogs.length - 60);
  renderMonitor();
  flashCode(event);
}

function addSystemLog(text: string, render = true): void {
  monitorLogs.push({ type: 'system', text: `DYNA ${text}` });
  if (monitorLogs.length > 60) monitorLogs.splice(0, monitorLogs.length - 60);
  if (render) renderMonitor();
}

function renderMonitor(): void {
  const visible = monitorLogs.filter((log) => monitorFilter === 'all' || log.type === monitorFilter).slice(-7);
  $('#console-lines').innerHTML = visible.length
    ? visible.map((log) => `<div class="log-${log.type}">${log.text}</div>`).join('')
    : '<div class="log-system">No events in this view yet.</div>';
  const lines = $('#console-lines');
  lines.scrollTop = lines.scrollHeight;
}

function flashCode(event: StepEvent): void {
  clearTimeout(codeFlashTimer);
  $$('.code-line').forEach((line) => line.classList.remove('is-active'));
  ['act', 'real', 'update', 'model'].forEach((name) => $(`[data-code="${name}"]`).classList.add('is-active'));
  if (event.planning.length) $('[data-code="plan"]').classList.add('is-active');
  codeFlashTimer = setTimeout(() => $$('.code-line').forEach((line) => line.classList.remove('is-active')), 170);
}

function isViewSetting(key: string | undefined): key is keyof ViewSettings {
  return key !== undefined && Object.hasOwn(DEFAULT_VIEW, key);
}

function applyViewSettings(persist = true): void {
  world?.setView(viewSettings);
  $('#minimap-panel').hidden = !viewSettings.minimap;
  if (!viewSettings.minimap) stateGrid.setVisible(false, false);
  $('#view-hint').hidden = !viewSettings.hints;
  const sceneKeys = ['values', 'policy', 'modelUpdates'] as const;
  sceneKeys.forEach((key) => {
    const button = $(`[data-view-button="${key}"]`);
    button.classList.toggle('is-on', viewSettings[key]);
    button.setAttribute('aria-pressed', String(viewSettings[key]));
  });
  $('#minimap-toggle').classList.toggle('is-on', viewSettings.minimap);
  $('#minimap-toggle').setAttribute('aria-pressed', String(viewSettings.minimap));
  $$<HTMLInputElement>('[data-setting]').forEach((input) => {
    if (isViewSetting(input.dataset.setting)) input.checked = viewSettings[input.dataset.setting];
  });
  if (persist) savePreferences();
}

function updateViewSetting(key: keyof ViewSettings, value: boolean): void {
  viewSettings = { ...viewSettings, [key]: value };
  applyViewSettings();
}

function toast(message: string, type: 'default' | 'warning' = 'default'): void {
  clearTimeout(toastTimer);
  const element = $('#toast');
  element.textContent = message;
  element.className = `toast show ${type}`;
  toastTimer = setTimeout(() => element.classList.remove('show'), 3600);
}

function openDialog(id: string): void {
  if (id === 'foundations-dialog') {
    foundations.open();
    return;
  }
  const dialog = document.getElementById(id);
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (id === 'comparison-dialog') {
    const planning = simulation.params.planningSteps || 12;
    [...$<HTMLSelectElement>('#comparison-planning').options].reduce((best, current) => (
      Math.abs(Number(current.value) - planning) < Math.abs(Number(best.value) - planning) ? current : best
    )).selected = true;
  }
  if (id === 'quiz-dialog' && !$('#quiz-content').innerHTML) resetQuiz();
  if (id === 'settings-dialog') updateProgress();
  dialog.showModal();
}

function renderComparison(results: ComparisonResults): void {
  const margin = { left: 54, right: 28, top: 28, bottom: 46 };
  const plotWidth = 720 - margin.left - margin.right;
  const plotHeight = 320 - margin.top - margin.bottom;
  const x = (step: number): number => margin.left + (step / results.realBudget) * plotWidth;
  const y = (value: number): number => margin.top + (1 - value / 100) * plotHeight;
  const colors = ['#26324d', '#c0652d'];
  const grid = [0, 25, 50, 75, 100].map((value) => `<line x1="${margin.left}" y1="${y(value)}" x2="692" y2="${y(value)}" stroke="#ded1bf" stroke-dasharray="3 6"/><text x="${margin.left - 12}" y="${y(value) + 4}" text-anchor="end" fill="#696d74" font-size="11" font-family="JetBrains Mono, monospace">${value}%</text>`).join('');
  const xLabels = results.checkpoints.map((step) => `<text x="${x(step)}" y="302" text-anchor="middle" fill="#696d74" font-size="10" font-family="JetBrains Mono, monospace">${step >= 1000 ? `${step / 1000}k` : step}</text>`).join('');
  const paths = results.series.map((series, index) => {
    const points = series.values.map((value, i) => `${i ? 'L' : 'M'}${x(results.checkpoints[i]).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
    return `<path d="${points}" fill="none" stroke="${colors[index]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${x(results.realBudget)}" cy="${y(series.values.at(-1)!)}" r="4.5" fill="${colors[index]}"/>`;
  }).join('');
  $('#comparison-chart').innerHTML = `${grid}${xLabels}<text x="${margin.left}" y="14" fill="#696d74" font-size="10" font-family="JetBrains Mono, monospace">GREEDY-POLICY SUCCESS</text><text x="360" y="318" text-anchor="middle" fill="#696d74" font-size="10" font-family="JetBrains Mono, monospace">REAL ENVIRONMENT STEPS</text>${paths}`;
  const finalQ = results.series[0].values.at(-1)!;
  const finalDyna = results.series[1].values.at(-1)!;
  const delta = finalDyna - finalQ;
  $('#comparison-summary').innerHTML = results.series.map((series, index) => `<div class="result-card"><span><i style="background:${colors[index]}"></i>${series.label}<small>N = ${series.planningSteps}</small></span><strong>${series.values.at(-1)!.toFixed(0)}<small>%</small></strong><p>final greedy success</p></div>`).join('') + `<div class="result-interpretation"><span class="panel-kicker">READ THE RESULT</span><p>${Math.abs(delta) < 0.01 ? 'The conditions finished at the same success rate in this run.' : `Dyna-Q finished <strong>${Math.abs(delta).toFixed(0)} percentage points ${delta > 0 ? 'higher' : 'lower'}</strong> at this budget.`} Change a parameter or seed count and run it again.</p></div>`;
  $('#comparison-caveat').textContent = `${results.seeds} paired seeds · deterministic tabular gridworld · greedy evaluation stops on cycles or after 100 moves. This small controlled run is illustrative, not evidence of a general ranking.`;
  $('#comparison-results').hidden = false;
}

function resetQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizAnswered = false;
  renderQuiz();
}

function renderQuiz() {
  const content = $('#quiz-content');
  if (quizIndex >= QUIZ.length) {
    if (quizScore > quizBest) {
      quizBest = quizScore;
      savePreferences();
      updateProgress();
    }
    const message = quizScore === QUIZ.length ? 'You can separate the mechanism from the metaphor.' : quizScore >= 3 ? 'Strong intuition. One more pass through the lab will sharpen it.' : 'Run the lessons again, then watch what changes when the model cannot be trusted.';
    content.innerHTML = `<div class="quiz-result"><span class="result-orbit">${icon('brain', 34)}</span><h2 id="quiz-title">${quizScore} / ${QUIZ.length}</h2><h3>Mechanisms, not buzzwords.</h3><p>${message}</p><button class="primary-button" id="retry-quiz">${icon('reset', 16)} Try again</button></div>`;
    $('#retry-quiz').addEventListener('click', resetQuiz);
    return;
  }
  const item = QUIZ[quizIndex];
  content.innerHTML = `<div class="quiz-progress"><span>QUESTION ${quizIndex + 1} / ${QUIZ.length}</span><div><i style="width:${(quizIndex / QUIZ.length) * 100}%"></i></div></div><h2 id="quiz-title">${item.question}</h2><div class="quiz-options">${item.options.map((option, index) => `<button data-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${option}${icon('chevronRight', 15)}</button>`).join('')}</div><div class="quiz-feedback" id="quiz-feedback" aria-live="polite" hidden></div><button class="primary-button quiz-next" id="quiz-next" hidden>${quizIndex === QUIZ.length - 1 ? 'See result' : 'Next question'} ${icon('arrow', 16)}</button>`;
  $$('[data-answer]').forEach((button) => button.addEventListener('click', () => answerQuiz(Number(button.dataset.answer))));
  $('#quiz-next').addEventListener('click', () => {
    quizIndex += 1;
    quizAnswered = false;
    renderQuiz();
  });
}

function answerQuiz(answer: number): void {
  if (quizAnswered) return;
  quizAnswered = true;
  const item = QUIZ[quizIndex];
  const correct = answer === item.answer;
  if (correct) quizScore += 1;
  $$<HTMLButtonElement>('[data-answer]').forEach((button) => {
    const index = Number(button.dataset.answer);
    button.disabled = true;
    if (index === item.answer) button.classList.add('correct');
    if (index === answer && !correct) button.classList.add('incorrect');
  });
  const feedback = $('#quiz-feedback');
  feedback.innerHTML = `<strong>${correct ? 'Exactly.' : 'Not quite.'}</strong> ${item.explanation}`;
  feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
  feedback.hidden = false;
  $('#quiz-next').hidden = false;
  $('#quiz-next').focus();
}

function updateLessonScroll(): void {
  const list = $('#lesson-list');
  $$<HTMLButtonElement>('[data-lesson-scroll="prev"]').forEach((button) => { button.disabled = list.scrollLeft <= 2; });
  $$<HTMLButtonElement>('[data-lesson-scroll="next"]').forEach((button) => { button.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2; });
}

function isInspectorTab(value: string | undefined): value is InspectorTab {
  return value === 'guide' || value === 'state' || value === 'model';
}

function isCameraPreset(value: string | undefined): value is CameraPreset {
  return value === 'iso' || value === 'top' || value === 'side';
}

function isParameterName(value: string | undefined): value is keyof SimulationParams {
  return value === 'alpha' || value === 'gamma' || value === 'epsilon' || value === 'planningSteps' || value === 'maxStepsPerEpisode';
}

const firstExperiment = new FirstExperimentGuide({
  step: stepOnce,
  setPlanning: (steps) => setParameters({ planningSteps: steps }),
  inspect: (state) => {
    handleStateSelect(state);
    switchTab('model');
  },
  openFoundations: () => openDialog('foundations-dialog'),
  complete: () => $('#lessons').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }),
  getQValue: (state, action) => simulation.q[state * 4 + action],
  getCounts: () => ({
    real: simulation.totalRealSteps,
    model: simulation.totalModelSteps,
    entries: simulation.model.size,
  }),
});

const stateGrid = new StateGrid($('#state-grid'), simulation, {
  panel: $('#keyboard-grid-panel'),
  toggle: $<HTMLButtonElement>('#keyboard-grid-toggle'),
  closeButton: $<HTMLButtonElement>('#keyboard-grid-close'),
  onSelect: handleStateSelect,
});

const foundations = new FoundationsGuide((target: FoundationTarget) => {
  if (target === 'state') {
    handleStateSelect(simulation.state);
    $('.info-card').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  } else if (target === 'experiment') {
    firstExperiment.show();
  } else if (target === 'comparison') {
    openDialog('comparison-dialog');
  }
});

$('#show-first-experiment').addEventListener('click', () => firstExperiment.show());

function executeComparison(options: ComparisonOptions): Promise<ComparisonResults> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../../workers/comparison.worker.js', import.meta.url), { type: 'module' });
    const cleanup = (): void => worker.terminate();
    worker.onmessage = (event: MessageEvent<ComparisonWorkerMessage>) => {
      if (event.data.type === 'result') resolve(event.data.results);
      else reject(new Error(event.data.message));
      cleanup();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      reject(new Error(event.message));
      cleanup();
    };
    worker.postMessage(options);
  });
}

$$('[data-tab]').forEach((button) => button.addEventListener('click', () => {
  if (isInspectorTab(button.dataset.tab)) switchTab(button.dataset.tab);
}));
$('#apply-mission').addEventListener('click', applyMission);
$('#next-mission').addEventListener('click', () => selectMission(activeMission + 1));
$('#inspect-model').addEventListener('click', () => switchTab('model'));
$('#play-toggle').addEventListener('click', () => {
  running = !running;
  updatePlayButton();
});
$('#single-step').addEventListener('click', stepOnce);
$('#reset-simulation').addEventListener('click', resetLearning);
$('#reset-camera').addEventListener('click', () => {
  world?.resetCamera();
  $$('[data-camera]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.camera === 'iso');
    button.setAttribute('aria-pressed', String(button.dataset.camera === 'iso'));
  });
});
$('#move-goal').addEventListener('click', () => setGoalMode(!goalMode));
$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await $('#stage-panel').requestFullscreen();
  } catch {
    toast('Fullscreen is not available in this browser.', 'warning');
  }
});
document.addEventListener('fullscreenchange', () => {
  $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen');
});

$$('[data-camera]').forEach((button) => button.addEventListener('click', () => {
  const preset = button.dataset.camera;
  if (!isCameraPreset(preset)) return;
  world?.setCameraPreset(preset);
  $$('[data-camera]').forEach((item) => {
    item.classList.toggle('is-active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
}));

$$('[data-speed]').forEach((button) => button.addEventListener('click', () => {
  speed = Number(button.dataset.speed);
  $$('[data-speed]').forEach((item) => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
}));

$$<HTMLInputElement>('[data-param]').forEach((input) => {
  updateRange(input);
  input.addEventListener('input', () => {
    const key = input.dataset.param;
    if (!isParameterName(key)) return;
    const patch: Partial<SimulationParams> = { [key]: Number(input.value) };
    simulation.setParams(patch);
    updateRange(input);
    updateEnvironmentLabel();
  });
});
$('#reset-params').addEventListener('click', () => {
  setParameters(DEFAULT_PARAMS);
  toast('Default parameters restored. Learned Q-values and model were kept.');
});
$$('[data-view-button]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.viewButton;
  if (isViewSetting(key)) updateViewSetting(key, !viewSettings[key]);
}));
$('#minimap-toggle').addEventListener('click', () => updateViewSetting('minimap', !viewSettings.minimap));
$$<HTMLInputElement>('[data-setting]').forEach((input) => input.addEventListener('change', () => {
  if (isViewSetting(input.dataset.setting)) updateViewSetting(input.dataset.setting, input.checked);
}));
$('#restore-visuals').addEventListener('click', () => {
  viewSettings = { ...DEFAULT_VIEW };
  applyViewSettings();
  toast('Visual defaults restored.');
});

$('#reset-progress').addEventListener('click', () => {
  if (!resetProgressArmed) {
    resetProgressArmed = true;
    $('#reset-progress').innerHTML = `${icon('trash', 15)} Click again to confirm`;
    setTimeout(() => {
      if (!resetProgressArmed) return;
      resetProgressArmed = false;
      $('#reset-progress').innerHTML = `${icon('trash', 15)} Reset saved progress`;
    }, 3500);
    return;
  }
  resetProgressArmed = false;
  appliedMissions.clear();
  quizBest = 0;
  savePreferences();
  renderLessons();
  updateProgress();
  $('#reset-progress').innerHTML = `${icon('trash', 15)} Reset saved progress`;
  toast('Saved lesson and quiz progress cleared.');
});

$('#side-toggle').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('is-open');
  $('#side-toggle').setAttribute('aria-expanded', String(open));
  $('#side-toggle').setAttribute('aria-label', open ? 'Collapse sidebar' : 'Expand sidebar');
});

$$('[data-nav]').forEach((button) => button.addEventListener('click', () => {
  const nav = button.dataset.nav;
  if (!nav) return;
  setActiveNav(nav);
  if (nav === 'lab') $('#stage-panel').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  if (nav === 'missions') {
    switchTab('guide');
    $('#lessons').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  }
  if (nav === 'compare') openDialog('comparison-dialog');
  if (nav === 'notes') openDialog('notes-dialog');
  if (nav === 'settings') openDialog('settings-dialog');
  if (window.innerWidth <= 700) $('#sidebar').classList.remove('is-open');
}));

$$('[data-open]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.open) openDialog(button.dataset.open);
}));
$$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog')?.close()));
$$<HTMLDialogElement>('dialog').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));

$$('[data-monitor]').forEach((button) => button.addEventListener('click', () => {
  const filter = button.dataset.monitor;
  if (filter !== 'all' && filter !== 'real' && filter !== 'model') return;
  monitorFilter = filter;
  $$('[data-monitor]').forEach((item) => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  renderMonitor();
}));
$('#console-toggle').addEventListener('click', () => {
  const open = $('#event-console').classList.toggle('is-open');
  $('#console-toggle').setAttribute('aria-expanded', String(open));
  $('#console-toggle').setAttribute('aria-label', open ? 'Close event monitor' : 'Open event monitor');
});
$('#clear-monitor').addEventListener('click', () => {
  monitorLogs = [];
  addSystemLog('Monitor cleared');
});

$$('[data-lesson-scroll]').forEach((button) => button.addEventListener('click', () => {
  const direction = button.dataset.lessonScroll === 'next' ? 1 : -1;
  $('#lesson-list').scrollBy({ left: direction * Math.min(520, $('#lesson-list').clientWidth * 0.75), behavior: reducedMotion ? 'auto' : 'smooth' });
}));
$('#lesson-list').addEventListener('scroll', updateLessonScroll, { passive: true });
window.addEventListener('resize', updateLessonScroll);

$('#run-comparison').addEventListener('click', async () => {
  const button = $<HTMLButtonElement>('#run-comparison');
  button.disabled = true;
  $('#comparison-results').hidden = true;
  $('#comparison-loading').hidden = false;
  try {
    const results = await executeComparison({
      seeds: Number($<HTMLSelectElement>('#comparison-seeds').value),
      realBudget: Number($<HTMLSelectElement>('#comparison-budget').value),
      planningSteps: Number($<HTMLSelectElement>('#comparison-planning').value),
      params: {
        alpha: simulation.params.alpha,
        gamma: simulation.params.gamma,
        epsilon: simulation.params.epsilon,
        maxStepsPerEpisode: simulation.params.maxStepsPerEpisode,
      },
    });
    renderComparison(results);
  } catch (error) {
    console.error(error);
    toast('The comparison could not finish. Try a smaller budget.', 'warning');
  } finally {
    $('#comparison-loading').hidden = true;
    button.disabled = false;
  }
});

document.addEventListener('keydown', (event) => {
  if (!(event.target instanceof Element)) return;
  if (event.target.matches('input, select, textarea') || document.querySelector('dialog[open]')) return;
  if (event.code === 'Space' && event.target.closest('button, a')) return;
  const key = event.key.toLowerCase();
  if (event.code === 'Space') {
    event.preventDefault();
    running = !running;
    updatePlayButton();
  } else if (key === 'n') {
    stepOnce();
  } else if (key === 'r') {
    resetLearning();
  } else if (['w', 'a', 's', 'd', 'q', 'e'].includes(key)) {
    event.preventDefault();
    world?.nudgeCamera(key);
    $$('[data-camera]').forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
  } else if (event.key === 'Escape') {
    setGoalMode(false);
  }
});

document.addEventListener('visibilitychange', () => {
  accumulator = 0;
  previousTime = performance.now();
});

function frame(now: number): void {
  const delta = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  if (running && !document.hidden) {
    accumulator += delta * speed;
    let steps = 0;
    while (accumulator >= 0.14 && steps < 20) {
      performStep();
      accumulator -= 0.14;
      steps += 1;
    }
    if (steps === 20) accumulator = 0;
  } else {
    accumulator = 0;
  }
  if (now - lastUiUpdate > 120) {
    world?.sync();
    minimap.draw();
    updateUI();
    lastUiUpdate = now;
  }
  requestAnimationFrame(frame);
}

renderLessons();
renderGuide();
updateProgress();
updateEnvironmentLabel();
applyViewSettings(false);
updatePlayButton();
updateUI(true);

if (new URLSearchParams(window.location.search).get('guide') === 'foundations') foundations.open();
if (window.location.hash === '#first-experiment') firstExperiment.show();
if (window.location.hash === '#model-inspector') {
  handleStateSelect(simulation.state);
  switchTab('model');
}

requestAnimationFrame(frame);
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.querySelector('#loader')?.classList.add('is-done');
  setTimeout(() => document.querySelector('#loader')?.remove(), 500);
}));
