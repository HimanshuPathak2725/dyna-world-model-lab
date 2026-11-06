import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { DynaGridworld } from '../../domain/rl/simulation.js';
import type { PlanningUpdate, StepEvent } from '../../domain/rl/types.js';

interface SceneView {
  values: boolean;
  policy: boolean;
  modelUpdates: boolean;
}

interface WorldSceneCallbacks {
  onSelect?: (state: number) => void;
  onHover?: (state: number | null, event?: PointerEvent) => void;
}

interface PlanningEffect {
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  life: number;
  duration: number;
  opacity: number;
}

interface RealPulse {
  sprite: THREE.Sprite;
  from: THREE.Vector3;
  to: THREE.Vector3;
  life: number;
  duration: number;
}

interface SuccessEffect {
  ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  life: number;
  duration: number;
}

interface CameraTween {
  from: THREE.Vector3;
  to: THREE.Vector3;
  targetFrom: THREE.Vector3;
  targetTo: THREE.Vector3;
  start: number;
  duration: number;
}

export interface ProjectedState {
  x: number;
  y: number;
  visible: boolean;
}

export type CameraPreset = 'iso' | 'top' | 'side';
type TileMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
type ArrowMesh = THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required');
  return context;
}

const REAL_COLOR = new THREE.Color('#1aa3a1');
const MODEL_COLOR = new THREE.Color('#c0652d');
const MODEL_ACCENT_COLOR = new THREE.Color('#f0a53a');
const GOAL_COLOR = new THREE.Color('#f0a53a');
const LOW_COLOR = new THREE.Color('#e7ddce');
const MID_COLOR = new THREE.Color('#add8ce');
const HIGH_COLOR = new THREE.Color('#157f7d');
const NAVY_COLOR = new THREE.Color('#18213d');
const TILE_SPACING = 1.1;
const CAMERA_PRESETS = {
  iso: { position: [10.8, 10.2, 12.6], target: [0, 0.1, 0] },
  top: { position: [0, 18.5, 0.45], target: [0, 0.1, 0] },
  side: { position: [13.8, 6.8, 15.4], target: [0, 0.1, 0] },
};

function makeRadialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = getCanvasContext(canvas);
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,.7)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

function makePaperTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = getCanvasContext(canvas);
  const image = context.createImageData(256, 256);
  let seed = 41;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < image.data.length; i += 4) {
    const grain = Math.floor(random() * 7);
    image.data[i] = 246 + grain;
    image.data[i + 1] = 244 + grain;
    image.data[i + 2] = 239 + grain;
    image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  context.strokeStyle = 'rgba(108, 88, 60, 0.035)';
  context.lineWidth = 0.5;
  for (let i = 0; i < 180; i += 1) {
    const x = random() * 256;
    const y = random() * 256;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 3 + random() * 12, y + random() * 2 - 1);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

function makeLabel(text: string, color = '#18213d') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = getCanvasContext(canvas);
  context.beginPath();
  context.moveTo(62, 24);
  context.lineTo(450, 24);
  context.quadraticCurveTo(468, 24, 468, 42);
  context.lineTo(468, 86);
  context.quadraticCurveTo(468, 104, 450, 104);
  context.lineTo(62, 104);
  context.quadraticCurveTo(44, 104, 44, 86);
  context.lineTo(44, 42);
  context.quadraticCurveTo(44, 24, 62, 24);
  context.closePath();
  context.fillStyle = 'rgba(246, 237, 221, 0.94)';
  context.fill();
  context.strokeStyle = 'rgba(211, 190, 163, 0.85)';
  context.lineWidth = 2;
  context.stroke();
  context.font = '600 34px "IBM Plex Mono", monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, 256, 65, 400);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.renderOrder = 20;
  return sprite;
}

function arrowGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.045, -0.16);
  shape.lineTo(0.045, -0.16);
  shape.lineTo(0.045, 0.015);
  shape.lineTo(0.14, 0.015);
  shape.lineTo(0, 0.21);
  shape.lineTo(-0.14, 0.015);
  shape.lineTo(-0.045, 0.015);
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export class WorldScene {
  readonly container: HTMLElement;
  simulation: DynaGridworld;
  readonly callbacks: WorldSceneCallbacks;
  readonly scene: THREE.Scene;
  readonly clock: THREE.Clock;
  elapsed: number;
  tiles: TileMesh[];
  policyArrows: ArrowMesh[];
  pickables: THREE.Object3D[];
  planningEffects: PlanningEffect[];
  realPulses: RealPulse[];
  successEffects: SuccessEffect[];
  trailStates: number[];
  selectedState: number | null;
  hoveredState: number | null;
  agentReturnAt: { at: number; state: number } | null;
  view: SceneView;
  readonly reducedMotion: boolean;
  readonly radialTexture: THREE.CanvasTexture;
  readonly paperTexture: THREE.CanvasTexture;
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  cameraPreset: CameraPreset;
  readonly controls: OrbitControls;
  readonly resizeObserver: ResizeObserver;
  dust!: THREE.Points;
  startMarker!: THREE.Group;
  selection!: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  hoverSelection!: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  agent!: THREE.Group;
  agentShell!: THREE.Mesh<THREE.IcosahedronGeometry, THREE.MeshBasicMaterial>;
  agentRing!: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  agentTarget!: THREE.Vector3;
  goal!: THREE.Group;
  goalCore!: THREE.Mesh<THREE.OctahedronGeometry, THREE.MeshStandardMaterial>;
  goalRing!: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;
  modelGroup!: THREE.Group;
  realGroup!: THREE.Group;
  trail!: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  cameraTween: CameraTween | null = null;
  goalMode = false;

  constructor(container: HTMLElement, simulation: DynaGridworld, callbacks: WorldSceneCallbacks = {}) {
    this.container = container;
    this.simulation = simulation;
    this.callbacks = callbacks;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f6eddd');
    this.scene.fog = new THREE.FogExp2('#f6eddd', 0.018);
    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.tiles = [];
    this.policyArrows = [];
    this.pickables = [];
    this.planningEffects = [];
    this.realPulses = [];
    this.successEffects = [];
    this.trailStates = [simulation.startState];
    this.selectedState = null;
    this.hoveredState = null;
    this.agentReturnAt = null;
    this.view = { values: true, policy: true, modelUpdates: true };
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.radialTexture = makeRadialTexture();
    this.paperTexture = makePaperTexture();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Dyna-Q gridworld. Drag to orbit, scroll to zoom, and select a tile to inspect it.');
    this.renderer.domElement.setAttribute('role', 'img');
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.fromArray(CAMERA_PRESETS.iso.position);
    this.cameraPreset = 'iso';
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.fromArray(CAMERA_PRESETS.iso.target);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 27;
    this.controls.minPolarAngle = 0.02;
    this.controls.maxPolarAngle = Math.PI * 0.47;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.75;
    this.controls.update();
    this.controls.saveState();

    this.addLights();
    this.addAtmosphere();
    this.addBoard();
    this.addAgent();
    this.addGoal();
    this.addEffects();
    this.bindPicking();
    this.sync(simulation);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.renderer.setAnimationLoop(() => this.animate());
  }

  addLights() {
    const hemisphere = new THREE.HemisphereLight('#fffaf0', '#b7a084', 1.55);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight('#fff8ea', 2.4);
    key.position.set(-5, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0003;
    key.shadow.normalBias = 0.018;
    key.shadow.radius = 3;
    this.scene.add(key);

    const rim = new THREE.DirectionalLight('#f5d6ae', 0.65);
    rim.position.set(8, 6, -8);
    this.scene.add(rim);
  }

  addAtmosphere() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({
        color: '#65533f',
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.9;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(44, 44, '#d3bea3', '#d3bea3');
    grid.position.y = -0.895;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    grid.material.depthWrite = false;
    this.scene.add(grid);

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 12),
      new THREE.MeshBasicMaterial({
        map: this.radialTexture,
        color: '#6d5a43',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.885;
    this.scene.add(contactShadow);

    const count = 260;
    const positions = new Float32Array(count * 3);
    let seed = 19;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i += 1) {
      const radius = 8 + random() * 24;
      const angle = random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.5 + random() * 12;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: '#b89d7d',
        size: 0.028,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    this.scene.add(this.dust);
  }

  addBoard() {
    const { width, height } = this.simulation;
    const boardWidth = (width - 1) * TILE_SPACING + 1.5;
    const boardDepth = (height - 1) * TILE_SPACING + 1.5;
    const base = new THREE.Mesh(
      new RoundedBoxGeometry(boardWidth, 0.42, boardDepth, 5, 0.18),
      new THREE.MeshStandardMaterial({
        color: '#efe3d1',
        map: this.paperTexture,
        roughness: 0.82,
        metalness: 0.03,
      }),
    );
    base.position.y = -0.48;
    base.receiveShadow = true;
    base.castShadow = true;
    this.scene.add(base);

    const baseEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(base.geometry, 28),
      new THREE.LineBasicMaterial({ color: '#d3bea3', transparent: true, opacity: 0.42 }),
    );
    baseEdges.position.copy(base.position);
    this.scene.add(baseEdges);

    const lowerBase = new THREE.Mesh(
      new RoundedBoxGeometry(boardWidth - 0.35, 0.22, boardDepth - 0.35, 4, 0.12),
      new THREE.MeshStandardMaterial({
        color: '#d3bea3',
        map: this.paperTexture,
        roughness: 0.88,
        metalness: 0.02,
      }),
    );
    lowerBase.position.y = -0.75;
    lowerBase.castShadow = true;
    lowerBase.receiveShadow = true;
    this.scene.add(lowerBase);

    const tileGeometry = new RoundedBoxGeometry(0.91, 0.2, 0.91, 3, 0.07);
    const obstacleGeometry = new RoundedBoxGeometry(0.69, 1, 0.69, 3, 0.09);
    const sharedArrowGeometry = arrowGeometry();

    for (let state = 0; state < width * height; state += 1) {
      const position = this.statePosition(state);
      const material = new THREE.MeshStandardMaterial({
        color: LOW_COLOR.clone(),
        map: this.paperTexture,
        roughness: 0.74,
        metalness: 0.02,
      });
      const tile = new THREE.Mesh(tileGeometry, material);
      tile.position.set(position.x, -0.18, position.z);
      tile.castShadow = true;
      tile.receiveShadow = true;
      tile.userData.state = state;
      tile.userData.targetY = -0.18;
      tile.userData.targetColor = LOW_COLOR.clone();
      tile.userData.normalizedValue = 0;
      this.scene.add(tile);
      this.tiles.push(tile);
      this.pickables.push(tile);

      const arrow = new THREE.Mesh(
        sharedArrowGeometry,
        new THREE.MeshBasicMaterial({
          color: NAVY_COLOR,
          transparent: true,
          opacity: 0.48,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        }),
      );
      arrow.position.set(position.x, 0.02, position.z);
      arrow.scale.setScalar(0.82);
      arrow.renderOrder = 3;
      this.scene.add(arrow);
      this.policyArrows.push(arrow);

      if (this.simulation.obstacleSet.has(state)) {
        const obstacle = new THREE.Group();
        const block = new THREE.Mesh(
          obstacleGeometry,
          new THREE.MeshStandardMaterial({ color: '#26324d', roughness: 0.48, metalness: 0.18 }),
        );
        const blockHeight = 0.65 + ((state * 7) % 5) * 0.09;
        block.scale.y = blockHeight;
        block.position.y = blockHeight / 2;
        block.castShadow = true;
        block.receiveShadow = true;
        block.userData.state = state;
        obstacle.add(block);

        const cap = new THREE.Mesh(
          new RoundedBoxGeometry(0.5, 0.035, 0.5, 2, 0.04),
          new THREE.MeshStandardMaterial({
            color: '#18213d',
            emissive: '#26324d',
            emissiveIntensity: 0.06,
            roughness: 0.5,
            metalness: 0.2,
          }),
        );
        cap.position.y = blockHeight + 0.02;
        cap.castShadow = true;
        cap.userData.state = state;
        obstacle.add(cap);
        obstacle.position.set(position.x, -0.04, position.z);
        obstacle.userData.state = state;
        this.scene.add(obstacle);
        this.pickables.push(obstacle);
      }
    }

    this.startMarker = new THREE.Group();
    const startRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.016, 8, 48),
      new THREE.MeshBasicMaterial({ color: '#157f7d', transparent: true, opacity: 0.72 }),
    );
    startRing.rotation.x = Math.PI / 2;
    this.startMarker.add(startRing);
    const startLabel = makeLabel('START', '#157f7d');
    startLabel.position.y = 0.42;
    startLabel.scale.set(1.5, 0.38, 1);
    this.startMarker.add(startLabel);
    const startPosition = this.statePosition(this.simulation.startState);
    this.startMarker.position.set(startPosition.x, 0.08, startPosition.z);
    this.scene.add(this.startMarker);

    this.selection = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 0.05, 1.01)),
      new THREE.LineBasicMaterial({
        color: '#c0652d',
        transparent: true,
        opacity: 0.95,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.selection.visible = false;
    this.selection.renderOrder = 8;
    this.scene.add(this.selection);

    this.hoverSelection = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.98, 0.04, 0.98)),
      new THREE.LineBasicMaterial({
        color: '#1aa3a1',
        transparent: true,
        opacity: 0.65,
        depthTest: false,
        depthWrite: false,
      }),
    );
    this.hoverSelection.visible = false;
    this.hoverSelection.renderOrder = 8;
    this.scene.add(this.hoverSelection);
  }

  addAgent() {
    this.agent = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.22, 2),
      new THREE.MeshStandardMaterial({
        color: '#fffdf7',
        emissive: '#1aa3a1',
        emissiveIntensity: 0.4,
        roughness: 0.28,
        metalness: 0.08,
      }),
    );
    core.castShadow = true;
    core.receiveShadow = true;
    this.agent.add(core);

    this.agentShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 1),
      new THREE.MeshBasicMaterial({
        color: '#1aa3a1',
        wireframe: true,
        transparent: true,
        opacity: 0.3,
        toneMapped: false,
      }),
    );
    this.agent.add(this.agentShell);

    this.agentRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.39, 0.014, 8, 64),
      new THREE.MeshBasicMaterial({ color: '#157f7d', transparent: true, opacity: 0.8, toneMapped: false }),
    );
    this.agentRing.rotation.x = Math.PI / 2;
    this.agent.add(this.agentRing);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.radialTexture,
        color: '#1aa3a1',
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    glow.scale.set(1.45, 1.45, 1);
    this.agent.add(glow);

    const light = new THREE.PointLight('#1aa3a1', 0.65, 2.6, 2);
    light.position.y = 0.25;
    this.agent.add(light);

    const start = this.statePosition(this.simulation.state);
    this.agent.position.set(start.x, 0.62, start.z);
    this.agentTarget = this.agent.position.clone();
    this.scene.add(this.agent);
  }

  addGoal() {
    this.goal = new THREE.Group();
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.13, 32),
      new THREE.MeshStandardMaterial({
        color: GOAL_COLOR,
        emissive: '#f0a53a',
        emissiveIntensity: 0.16,
        metalness: 0.22,
        roughness: 0.42,
      }),
    );
    pedestal.position.y = 0.1;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    this.goal.add(pedestal);

    this.goalCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25, 0),
      new THREE.MeshStandardMaterial({
        color: '#ffd68f',
        emissive: '#f0a53a',
        emissiveIntensity: 0.7,
        roughness: 0.24,
        metalness: 0.1,
      }),
    );
    this.goalCore.position.y = 0.78;
    this.goalCore.castShadow = true;
    this.goal.add(this.goalCore);

    this.goalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.43, 0.018, 8, 64),
      new THREE.MeshBasicMaterial({ color: GOAL_COLOR, transparent: true, opacity: 0.78, toneMapped: false }),
    );
    this.goalRing.rotation.x = Math.PI / 2;
    this.goalRing.position.y = 0.44;
    this.goal.add(this.goalRing);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.25, 2.4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: GOAL_COLOR,
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.y = 1.25;
    this.goal.add(beam);

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: this.radialTexture,
        color: GOAL_COLOR,
        transparent: true,
        opacity: 0.18,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    glow.position.y = 0.7;
    glow.scale.set(2.1, 2.1, 1);
    this.goal.add(glow);

    const label = makeLabel('GOAL  +1');
    label.position.y = 1.55;
    this.goal.add(label);
    const light = new THREE.PointLight('#f0a53a', 0.7, 3.2, 2);
    light.position.y = 0.9;
    this.goal.add(light);
    this.scene.add(this.goal);
  }

  addEffects() {
    this.modelGroup = new THREE.Group();
    this.scene.add(this.modelGroup);
    this.realGroup = new THREE.Group();
    this.scene.add(this.realGroup);
    this.trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: REAL_COLOR,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.trail.renderOrder = 2;
    this.realGroup.add(this.trail);
  }

  statePosition(state: number): THREE.Vector3 {
    const x = state % this.simulation.width;
    const z = Math.floor(state / this.simulation.width);
    return new THREE.Vector3(
      (x - (this.simulation.width - 1) / 2) * TILE_SPACING,
      0,
      (z - (this.simulation.height - 1) / 2) * TILE_SPACING,
    );
  }

  projectState(state: number, height = 0.7): ProjectedState {
    const point = this.statePosition(state);
    point.y = this.tiles[state].position.y + height;
    point.project(this.camera);
    return {
      x: (point.x + 1) * 0.5 * this.container.clientWidth,
      y: (1 - point.y) * 0.5 * this.container.clientHeight,
      visible: point.z >= -1 && point.z <= 1 && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1,
    };
  }

  sync(simulation: DynaGridworld = this.simulation): void {
    this.simulation = simulation;
    this.tiles.forEach((tile, state) => {
      const info = simulation.getStateInfo(state);
      const arrow = this.policyArrows[state];
      if (info.isObstacle) {
        tile.userData.targetColor = NAVY_COLOR.clone();
        tile.userData.targetY = -0.2;
        arrow.visible = false;
        return;
      }
      const normalized = THREE.MathUtils.clamp((info.maxValue + 1) / 2, 0, 1);
      const colorProgress = THREE.MathUtils.clamp(info.maxValue, 0, 1);
      tile.userData.normalizedValue = normalized;
      tile.userData.targetY = this.view.values ? -0.18 + normalized * 0.28 : -0.18;
      if (!this.view.values) {
        tile.userData.targetColor = LOW_COLOR.clone();
      } else if (colorProgress < 0.55) {
        tile.userData.targetColor = new THREE.Color().lerpColors(LOW_COLOR, MID_COLOR, colorProgress / 0.55);
      } else {
        tile.userData.targetColor = new THREE.Color().lerpColors(MID_COLOR, HIGH_COLOR, (colorProgress - 0.55) / 0.45);
      }
      if (info.isGoal) tile.userData.targetColor = GOAL_COLOR.clone();
      arrow.visible = this.view.policy && !info.isGoal;
      arrow.rotation.y = -info.greedyAction * Math.PI / 2;
      arrow.material.opacity = info.visits > 0 ? 0.78 : 0.26;
    });

    const goalPosition = this.statePosition(simulation.goalState);
    this.goal.position.set(goalPosition.x, 0.02, goalPosition.z);
    if (this.selectedState !== null) this.positionOutline(this.selection, this.selectedState);
  }

  setView(view: Partial<SceneView>): void {
    this.view = { ...this.view, ...view };
    this.modelGroup.visible = this.view.modelUpdates;
    this.policyArrows.forEach((arrow, state) => {
      arrow.visible = this.view.policy && !this.simulation.obstacleSet.has(state) && state !== this.simulation.goalState;
    });
    this.sync();
  }

  handleEvent(event: StepEvent): void {
    const next = this.statePosition(event.nextState);
    const tile = this.tiles[event.nextState];
    next.y = tile.position.y + 0.72;
    this.agentTarget.copy(next);
    this.agentReturnAt = null;

    this.addRealPulse(event.state, event.nextState);
    if (event.terminal) {
      this.addSuccessEffect(event.nextState);
      this.agentReturnAt = { at: this.elapsed + 0.24, state: event.stateAfter };
      this.trailStates = [event.stateAfter];
    } else if (event.done) {
      this.agentReturnAt = { at: this.elapsed + 0.24, state: event.stateAfter };
      this.trailStates = [event.stateAfter];
    } else {
      if (this.trailStates.length === 0) this.trailStates.push(event.state);
      this.trailStates.push(event.nextState);
      if (this.trailStates.length > 34) this.trailStates.shift();
    }

    if (this.view.modelUpdates && event.planning.length > 0) {
      const count = Math.min(3, event.planning.length);
      for (let i = 0; i < count; i += 1) {
        const update = event.planning[Math.floor(i * event.planning.length / count)];
        if (update.state !== update.nextState) this.addModelLink(update);
      }
    }
    this.updateTrail();
  }

  addRealPulse(fromState: number, toState: number): void {
    if (fromState === toState) return;
    const from = this.statePosition(fromState);
    const to = this.statePosition(toState);
    from.y = this.tiles[fromState].position.y + 0.4;
    to.y = this.tiles[toState].position.y + 0.4;
    const material = new THREE.SpriteMaterial({
      map: this.radialTexture,
      color: REAL_COLOR,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.45, 0.45, 1);
    sprite.position.copy(from);
    this.realGroup.add(sprite);
    this.realPulses.push({ sprite, from, to, life: 0, duration: this.reducedMotion ? 0.05 : 0.32 });
    if (this.realPulses.length > 20) this.removePulse(this.realPulses.shift());
  }

  addModelLink(update: PlanningUpdate): void {
    const from = this.statePosition(update.state);
    const to = this.statePosition(update.nextState);
    from.y = this.tiles[update.state].position.y + 0.3;
    to.y = this.tiles[update.nextState].position.y + 0.3;
    const middle = from.clone().lerp(to, 0.5);
    middle.y += 0.35 + from.distanceTo(to) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(from, middle, to);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(12)),
      new THREE.LineBasicMaterial({
        color: (update.state + update.nextState) % 3 === 0 ? MODEL_ACCENT_COLOR : MODEL_COLOR,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.modelGroup.add(line);
    this.planningEffects.push({
      line,
      life: 0,
      duration: this.reducedMotion ? 0.08 : 0.75,
      opacity: 0.68,
    });
    if (this.planningEffects.length > 42) this.removeModelLink(this.planningEffects.shift());
  }

  addSuccessEffect(state: number): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.39, 48),
      new THREE.MeshBasicMaterial({
        color: GOAL_COLOR,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    const position = this.statePosition(state);
    ring.position.set(position.x, 0.34, position.z);
    this.realGroup.add(ring);
    this.successEffects.push({ ring, life: 0, duration: this.reducedMotion ? 0.1 : 0.9 });
  }

  updateTrail() {
    const points = this.trailStates.map((state) => {
      const point = this.statePosition(state);
      point.y = this.tiles[state].position.y + 0.25;
      return point;
    });
    this.trail.geometry.dispose();
    this.trail.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }

  removePulse(effect: RealPulse | undefined): void {
    if (!effect) return;
    this.realGroup.remove(effect.sprite);
    effect.sprite.material.dispose();
  }

  removeModelLink(effect: PlanningEffect | undefined): void {
    if (!effect) return;
    this.modelGroup.remove(effect.line);
    effect.line.geometry.dispose();
    effect.line.material.dispose();
  }

  resetSimulation(): void {
    const position = this.statePosition(this.simulation.state);
    position.y = this.tiles[this.simulation.state].position.y + 0.72;
    this.agent.position.copy(position);
    this.agentTarget.copy(position);
    this.agentReturnAt = null;
    this.trailStates = [this.simulation.state];
    this.planningEffects.forEach((effect) => this.removeModelLink(effect));
    this.realPulses.forEach((effect) => this.removePulse(effect));
    this.planningEffects = [];
    this.realPulses = [];
    this.successEffects.forEach((effect) => {
      this.realGroup.remove(effect.ring);
      effect.ring.geometry.dispose();
      effect.ring.material.dispose();
    });
    this.successEffects = [];
    this.updateTrail();
    this.sync();
  }

  setSelected(state: number | null): void {
    this.selectedState = state;
    this.selection.visible = state !== null;
    if (state !== null) this.positionOutline(this.selection, state);
  }

  positionOutline(outline: THREE.Object3D, state: number): void {
    const position = this.statePosition(state);
    outline.position.set(position.x, this.tiles[state].position.y + 0.16, position.z);
  }

  setGoalMode(active: boolean): void {
    this.goalMode = active;
    this.renderer.domElement.style.cursor = active ? 'crosshair' : 'grab';
  }

  setCameraPreset(preset: CameraPreset): boolean {
    if (!Object.prototype.hasOwnProperty.call(CAMERA_PRESETS, preset)) return false;
    const config = CAMERA_PRESETS[preset];

    this.cameraPreset = preset;
    const to = new THREE.Vector3().fromArray(config.position);
    const targetTo = new THREE.Vector3().fromArray(config.target);
    if (this.reducedMotion) {
      this.cameraTween = null;
      this.camera.position.copy(to);
      this.controls.target.copy(targetTo);
      this.controls.update();
      return true;
    }

    this.cameraTween = {
      from: this.camera.position.clone(),
      to,
      targetFrom: this.controls.target.clone(),
      targetTo,
      start: this.elapsed,
      duration: 0.75,
    };
    return true;
  }

  nudgeCamera(key: string): boolean {
    if (typeof key !== 'string') return false;
    const normalizedKey = key.toLowerCase();
    if (normalizedKey.length !== 1 || !'wasdqe'.includes(normalizedKey)) return false;

    this.cameraTween = null;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);

    if (normalizedKey === 'q' || normalizedKey === 'e') {
      spherical.theta += normalizedKey === 'q' ? Math.PI / 24 : -Math.PI / 24;
      spherical.makeSafe();
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi,
        this.controls.minPolarAngle,
        this.controls.maxPolarAngle,
      );
      spherical.radius = THREE.MathUtils.clamp(
        spherical.radius,
        this.controls.minDistance,
        this.controls.maxDistance,
      );
      offset.setFromSpherical(spherical);
      this.camera.position.copy(this.controls.target).add(offset);
    } else {
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 0.000001) forward.set(0, 0, -1);
      forward.normalize();
      const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();
      const movement = new THREE.Vector3();
      if (normalizedKey === 'w') movement.add(forward);
      if (normalizedKey === 's') movement.sub(forward);
      if (normalizedKey === 'd') movement.add(right);
      if (normalizedKey === 'a') movement.sub(right);
      movement.multiplyScalar(THREE.MathUtils.clamp(spherical.radius * 0.04, 0.35, 1.1));
      this.camera.position.add(movement);
      this.controls.target.add(movement);
    }

    this.controls.update();
    return true;
  }

  resetCamera() {
    this.setCameraPreset('iso');
  }

  bindPicking(): void {
    const canvas = this.renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;

    const pick = (event: PointerEvent): number | null => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, this.camera);
      const intersections = raycaster.intersectObjects(this.pickables, true);
      if (!intersections.length) return null;
      let object: THREE.Object3D | null = intersections[0].object;
      while (object && object.userData.state === undefined) object = object.parent;
      return object?.userData.state ?? null;
    };

    canvas.addEventListener('pointerdown', (event) => {
      down = { x: event.clientX, y: event.clientY };
    });
    canvas.addEventListener('pointerup', (event) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
      const state = pick(event);
      if (state !== null) {
        this.setSelected(state);
        this.callbacks.onSelect?.(state);
      }
      down = null;
    });
    canvas.addEventListener('pointermove', (event) => {
      if (event.buttons) return;
      const state = pick(event);
      if (state === this.hoveredState) return;
      this.hoveredState = state;
      this.hoverSelection.visible = state !== null;
      if (state !== null) this.positionOutline(this.hoverSelection, state);
      canvas.style.cursor = this.goalMode ? 'crosshair' : state !== null ? 'pointer' : 'grab';
      this.callbacks.onHover?.(state, event);
    });
    canvas.addEventListener('pointerleave', () => {
      this.hoverSelection.visible = false;
      this.hoveredState = null;
      this.callbacks.onHover?.(null);
    });
  }

  resize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.fov = width < 560 ? 50 : 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.elapsed += delta;
    const smoothing = 1 - Math.exp(-delta * 9);

    if (this.cameraTween) {
      const tween = this.cameraTween;
      const progress = Math.min((this.elapsed - tween.start) / tween.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(tween.from, tween.to, eased);
      this.controls.target.lerpVectors(tween.targetFrom, tween.targetTo, eased);
      if (progress === 1) this.cameraTween = null;
    }

    if (this.agentReturnAt && this.elapsed >= this.agentReturnAt.at) {
      const target = this.statePosition(this.agentReturnAt.state);
      target.y = this.tiles[this.agentReturnAt.state].position.y + 0.72;
      this.agentTarget.copy(target);
      this.agentReturnAt = null;
    }

    this.tiles.forEach((tile, state) => {
      tile.position.y = THREE.MathUtils.lerp(tile.position.y, tile.userData.targetY, smoothing);
      tile.material.color.lerp(tile.userData.targetColor, smoothing);
      const arrow = this.policyArrows[state];
      arrow.position.y = tile.position.y + 0.125;
    });

    const agentTargetY = this.agentTarget.y + (this.reducedMotion ? 0 : Math.sin(this.elapsed * 3.2) * 0.055);
    this.agent.position.x = THREE.MathUtils.lerp(this.agent.position.x, this.agentTarget.x, smoothing);
    this.agent.position.z = THREE.MathUtils.lerp(this.agent.position.z, this.agentTarget.z, smoothing);
    this.agent.position.y = THREE.MathUtils.lerp(this.agent.position.y, agentTargetY, smoothing);
    if (!this.reducedMotion) {
      this.agentShell.rotation.y += delta * 0.75;
      this.agentShell.rotation.x += delta * 0.24;
      this.agentRing.rotation.z += delta * 0.6;
      this.goalCore.rotation.y += delta * 0.9;
      this.goalCore.position.y = 0.78 + Math.sin(this.elapsed * 2.1) * 0.08;
      this.goalRing.rotation.z -= delta * 0.35;
      this.dust.rotation.y += delta * 0.004;
    }

    for (let i = this.planningEffects.length - 1; i >= 0; i -= 1) {
      const effect = this.planningEffects[i];
      effect.life += delta;
      effect.line.material.opacity = effect.opacity * (1 - effect.life / effect.duration);
      if (effect.life >= effect.duration) {
        this.removeModelLink(effect);
        this.planningEffects.splice(i, 1);
      }
    }

    for (let i = this.realPulses.length - 1; i >= 0; i -= 1) {
      const effect = this.realPulses[i];
      effect.life += delta;
      const progress = Math.min(effect.life / effect.duration, 1);
      effect.sprite.position.lerpVectors(effect.from, effect.to, progress);
      effect.sprite.position.y += Math.sin(progress * Math.PI) * 0.18;
      effect.sprite.material.opacity = 0.85 * (1 - progress);
      if (progress === 1) {
        this.removePulse(effect);
        this.realPulses.splice(i, 1);
      }
    }

    for (let i = this.successEffects.length - 1; i >= 0; i -= 1) {
      const effect = this.successEffects[i];
      effect.life += delta;
      const progress = effect.life / effect.duration;
      effect.ring.scale.setScalar(1 + progress * 5);
      effect.ring.material.opacity = 0.9 * (1 - progress);
      if (progress >= 1) {
        this.realGroup.remove(effect.ring);
        effect.ring.geometry.dispose();
        effect.ring.material.dispose();
        this.successEffects.splice(i, 1);
      }
    }

    if (this.selection.visible && this.selectedState !== null) {
      this.positionOutline(this.selection, this.selectedState);
    }
    if (this.hoverSelection.visible && this.hoveredState !== null) {
      this.positionOutline(this.hoverSelection, this.hoveredState);
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    this.radialTexture.dispose();
    this.paperTexture.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
