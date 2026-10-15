// scene.ts: a plain three.js scene. three.js owns every object in it: the
// meshes, their positions, colors, visibility. Nothing here is written for a
// UI, and nothing is copied out of it: the inspector reads these objects
// where they live, and writes to them directly.
import type * as THREE from "three";

// Loaded on demand, so this page costs nothing until the scene mounts.
// In an app you would write: import * as THREE from "three".
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js";

export interface World {
  renderer: THREE.WebGLRenderer;
  fps: number;
  meshes(): THREE.Mesh[];
  add(): THREE.Mesh;
  remove(mesh: THREE.Mesh): void;
  pick(x: number, y: number): THREE.Mesh | null;
  resize(width: number, height: number): void;
  start(onFrame: () => void): () => void;
  dispose(): void;
}

export async function createWorld(canvas: HTMLCanvasElement): Promise<World> {
  const THREE: typeof import("three") = await import(/* @vite-ignore */ THREE_URL);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 3.2, 8.5);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334466, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 6, 5);
  scene.add(sun);
  scene.add(new THREE.GridHelper(10, 10, 0x888888, 0x666666));

  const shapes = {
    Box: () => new THREE.BoxGeometry(1.2, 1.2, 1.2),
    Sphere: () => new THREE.SphereGeometry(0.75, 32, 16),
    Torus: () => new THREE.TorusGeometry(0.6, 0.25, 16, 48),
    Cone: () => new THREE.ConeGeometry(0.7, 1.4, 32),
    Knot: () => new THREE.TorusKnotGeometry(0.5, 0.18, 96, 12),
  };
  const kinds = Object.keys(shapes) as (keyof typeof shapes)[];
  let count = 0;

  const meshes = () => scene.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);

  // Spread the meshes on a ring, so the scene stays readable as it changes.
  function layout() {
    const all = meshes();
    all.forEach((m, i) => {
      const angle = (i / all.length) * Math.PI * 2 - Math.PI / 2;
      m.position.x = Math.cos(angle) * 3;
      m.position.z = Math.sin(angle) * 3;
    });
  }

  function add() {
    const kind = kinds[count % kinds.length];
    const color = new THREE.Color().setHSL((count * 0.17 + 0.05) % 1, 0.7, 0.55);
    const mesh = new THREE.Mesh(shapes[kind](), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
    mesh.name = `${kind} ${++count}`;
    mesh.userData.spin = 0.8; // plain data on the object; the inspector edits it
    scene.add(mesh);
    layout();
    return mesh;
  }

  function remove(mesh: THREE.Mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
    layout();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(x: number, y: number) {
    pointer.set((x / canvas.clientWidth) * 2 - 1, -(y / canvas.clientHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes())[0];
    return hit ? (hit.object as THREE.Mesh) : null;
  }

  function resize(width: number, height: number) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const world: World = {
    renderer,
    fps: 0,
    meshes,
    add,
    remove,
    pick,
    resize,
    start(onFrame) {
      let last = performance.now();
      let frame = requestAnimationFrame(function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        world.fps = Math.round(world.fps * 0.9 + (1 / dt) * 0.1);
        meshes().forEach((m, i) => {
          m.rotation.y += m.userData.spin * dt;
          m.position.y = Math.sin(now / 900 + i) * 0.3;
        });
        renderer.render(scene, camera);
        onFrame();
        frame = requestAnimationFrame(loop);
      });
      return () => cancelAnimationFrame(frame);
    },
    dispose() {
      lut.dispose();
      renderer.dispose();
    },
  };

  for (let i = 0; i < 5; i++) add();
  // three.js shares one lookup texture (DFG_LUT) between every renderer, and
  // that texture keeps each renderer that drew with it reachable, canvas and
  // page included, until it is disposed. Render once to get hold of it.
  renderer.render(scene, camera);
  const lut = (renderer.properties.get(meshes()[0].material) as { uniforms: { dfgLUT: { value: THREE.Texture } } }).uniforms.dfgLUT.value;
  return world;
}
