# DYNA — Model-Based Reinforcement Learning Lab

DYNA is a browser-based laboratory for learning **tabular model-based reinforcement learning**. The current environment is Willow Grid, a deterministic 9 × 7 gridworld implementing Q-learning and Dyna-Q.

## Scope

The lab stores observed transitions in a JavaScript `Map`:

```text
M(s, a) = (reward, nextState, terminal)
```

Planning samples those entries for additional Q-updates. This is not a neural world model, learned latent dynamics, video prediction, or a general-purpose simulator. Neural world-model papers are linked as research directions, not presented as DYNA results.

## Run locally

```sh
npm ci
npm run dev
```

Open the local Vite URL. `/` is the product homepage; `/lab` is the interactive laboratory. Everything runs in the browser without accounts, a backend, or remote experiment storage.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

The build runs strict TypeScript checking before producing the Vite bundle. Unit tests cover transition mechanics, analytic Q-updates, planning samples, deterministic seeds, episode limits, stale models after goal relocation, comparison outputs, and malformed local storage.

## Architecture

The application uses strict TypeScript, Vite, and Three.js. It deliberately stays browser-local rather than introducing a server for a single-player simulation.

```text
src/
  domain/rl/
    types.ts             Shared parameters, events and result contracts
    simulation.ts        Deterministic environment and Dyna-Q agent
    comparison.ts        Paired-seed controlled comparisons
    simulation.test.ts   Executable engine invariants
  app/
    home/
      home-page.ts       Product content and real grid preview
      home.css
    lab/
      lab-controller.ts  Coordinates the lab and typed UI events
      lab-layout.ts      Accessible laboratory structure
      scene.ts           Three.js rendering adapter
      minimap.ts         Pointer-based top-down map
      state-grid.ts      Keyboard-accessible state inspector
      first-experiment.ts Paused, evidence-based first-run sequence
      foundations.ts     Three linked foundational modules
      content.ts         Lessons, quiz and foundation content
      progress-store.ts  Validated localStorage boundary
      progress-store.test.ts
  workers/
    comparison.worker.ts CPU-intensive comparisons off the UI thread
  shared/
    icons.ts             Local SVG interface icons
  routes/                Separate home and lab entry modules
  router.ts              Path-based loading with route-specific styles
```

The domain engine does not access the DOM. The renderer, minimap and state grid consume the same typed simulation state and event contracts. Comparison work uses a typed Web Worker message protocol and terminates the worker after completion or failure.

## Learning and accessibility

- The simulation starts paused at zero steps.
- The first experiment shows the actual action, reward, next state, Q-update and stored transition from the emitted step event.
- Advanced parameters are collapsed until requested.
- Foundation modules link explanations to working views in the lab.
- The 3D scene and minimap remain available, while an on-demand HTML grid supports arrow-key navigation, Enter/Space selection, and Home/End movement.
- Grid selection shares the same state and model inspectors as pointer selection.
- Reduced-motion preferences are respected.

## Experiment mechanics

The grid has 63 states and four actions. Ordinary steps cost `−0.04`; the terminal goal returns `+1`.

```text
δ = r + γ max Q(s′,·) − Q(s,a)
Q(s,a) ← Q(s,a) + αδ
```

`N = 0` runs Q-learning. `N > 0` adds that many sampled model updates per real step. The counters distinguish real environment interactions from model-based computation.

The controlled comparison uses paired seeds and equal real-interaction budgets. It is an illustrative deterministic-gridworld experiment, not evidence of a general algorithm ranking.

## Persistence and deployment

Lesson completion, quiz results and visual preferences stay in browser localStorage under `dyna-paper-lab-v1`. Stored values are validated before use. There is no remote progress store.

`npm run build` writes `dist/`. Netlify builds from `main` and uses the existing SPA redirect. Route entry modules preserve separate homepage and lab stylesheets; dynamic route paths reference their `.ts` entries explicitly.

## Research and further development

The homepage links Sutton's Dyna architecture, World Models and DreamerV3 as third-party research. Moving toward neural world models requires a separate learned-representation and dynamics-model domain, training infrastructure and evaluation design—not a cosmetic change to Willow Grid.

Useful next steps include additional explicit environments, broader browser regression coverage, continuous integration, and reproducible comparisons with clearly documented estimands and limitations.
