import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function createNiaScene(container, { reducedMotion = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(1.35, 2.4, 6.3);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const hemisphere = new THREE.HemisphereLight('#f8f0df', '#3d4658', 2.1);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight('#fff3dc', 3.2);
  key.position.set(-2.5, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#1aa3a1', 1.1);
  rim.position.set(3, 3, -3);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1.45, 64),
    new THREE.MeshStandardMaterial({ color: '#cec0ad', roughness: 0.95, transparent: true, opacity: 0.4 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 48),
    new THREE.ShadowMaterial({ opacity: 0.16 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  shadow.receiveShadow = true;
  scene.add(shadow);

  const gltf = await new GLTFLoader().loadAsync('/models/casual_female.glb');
  const model = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 3.3 / size.y;
  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  const palette = {
    Skin: '#a46f50',
    Shirt: '#e9e1d2',
    Pants: '#293958',
    Belt: '#18213d',
    Face: '#2b2322',
    Hair: '#302522',
  };
  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      if (palette[object.material.name]) object.material.color.set(palette[object.material.name]);
    }
  });

  const tablet = new THREE.Group();
  const casing = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.42, 0.035),
    new THREE.MeshStandardMaterial({ color: '#18213d', roughness: 0.7 }),
  );
  casing.castShadow = true;
  tablet.add(casing);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.265, 0.35),
    new THREE.MeshBasicMaterial({ color: '#dbeae3' }),
  );
  screen.position.z = 0.018;
  tablet.add(screen);
  for (const [y, width] of [[0.095, 0.17], [0.035, 0.2], [-0.025, 0.14]]) {
    const line = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 0.013),
      new THREE.MeshBasicMaterial({ color: '#157f7d' }),
    );
    line.position.set(0, y, 0.019);
    tablet.add(line);
  }
  const hand = model.getObjectByName('FistL');
  if (hand) {
    tablet.position.set(0, 0.13, 0.09);
    tablet.rotation.set(0.2, -0.2, 0.1);
    hand.add(tablet);
  }
  scene.add(model);

  const target = new THREE.Vector3(0, 1.55, 0);
  camera.lookAt(target);
  const mixer = new THREE.AnimationMixer(model);
  const idle = gltf.animations.find((clip) => clip.name === 'Idle') || gltf.animations[0];
  if (idle) mixer.clipAction(idle).play();

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (reducedMotion) renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const clock = new THREE.Clock();
  let inView = true;
  let lastFrame = -Infinity;
  const animate = (time) => {
    if (time - lastFrame < 1000 / 30) return;
    lastFrame = time;
    mixer.update(Math.min(clock.getDelta(), 0.05));
    renderer.render(scene, camera);
  };
  const updatePlayback = () => {
    renderer.setAnimationLoop(!reducedMotion && inView && !document.hidden ? animate : null);
  };
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    updatePlayback();
  });
  visibilityObserver.observe(container);
  document.addEventListener('visibilitychange', updatePlayback);
  updatePlayback();

  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    container.innerHTML = '<p class="nia-load-error">Nia / Research Guide</p>';
  });

  return {
    dispose() {
      observer.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      renderer.setAnimationLoop(null);
      mixer.stopAllAction();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
