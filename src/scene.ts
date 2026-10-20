import * as THREE from 'three';
import { buildIncidentCues, cueAt } from './events';
import { buildTraffic, frameIndex, beatAt, QUEUE_LIMIT } from './traffic';
import film from '../examples/ddos-capacity/film.json';
import captions from '../examples/ddos-capacity/captions.json';

declare global {
  interface Window {
    __hf?: { buildReady?: Record<string, Promise<unknown>> };
    __hfThreeTime?: number;
    studio: { renderAt: (frame: number) => void; inspect: () => unknown; dispose: () => void };
  }
}
const COLORS = { bg: 0x0b1220, metal: 0x52657a, panel: 0x111e30, edge: 0x8ca1b8,
  normal: 0x4dd4ff, attack: 0xff7a59, success: 0xa5dfbc };
const W = 1080, H = 740, TOP = 565;
const canvas = document.querySelector<HTMLCanvasElement>('#world')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bg);
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
const geometry: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];
const critical = new Map<string, THREE.Object3D>();
function mat(color: number, metalness = .35, roughness = .5, emissive = 0) {
  const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity: .65 });
  materials.push(m); return m;
}
const metal = mat(COLORS.metal), panel = mat(COLORS.panel), edges = mat(COLORS.edge);
const normal = mat(COLORS.normal, .2, .35, COLORS.normal);
const attack = mat(COLORS.attack, .2, .35, COLORS.attack);
const green = mat(COLORS.success, .2, .35, COLORS.success);
function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d); geometry.push(g);
  const mesh = new THREE.Mesh(g, m); mesh.position.set(x, y, z); return mesh;
}
function cable(points: THREE.Vector3[], radius = .045, material = edges) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, 32, radius, 8, false); geometry.push(g);
  const m = new THREE.Mesh(g, material); scene.add(m); return m;
}
function device(id: string, x: number, z: number, color: THREE.Material) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.add(box(1.25, .18, .95, metal, 0, .12));
  g.add(box(1.1, .78, .12, metal, 0, .58, -.28));
  g.add(box(.92, .58, .025, panel, 0, .6, -.205));
  g.add(box(.68, .06, .025, color, 0, .63, -.185));
  g.add(box(.38, .045, .025, color, -.15, .45, -.185));
  scene.add(g); critical.set(id, g); return g;
}
const sources = [[-5, 4.6], [-1.9, 5.8], [1.5, 5.8], [5, 3.8]];
sources.forEach(([x, z], i) => device(`source-${i}`, x, z, i ? attack : normal));
const router = new THREE.Group();
router.add(box(2.2, .55, 1.0, metal, 0, .35));
router.add(box(2.05, .06, .92, panel, 0, .66));
for (let i = 0; i < 8; i++) router.add(box(.13, .12, .025, edges, -.8 + i * .23, .34, .513));
scene.add(router); critical.set('router', router);
const server = new THREE.Group(); server.position.set(0, 0, -6.4);
server.add(box(1.65, 2.45, 1.3, metal, 0, 1.23));
for (let j = 0; j < 5; j++) {
  server.add(box(1.44, .32, .05, panel, 0, .35 + j * .43, .68));
  server.add(box(.10, .08, .025, green, .53, .35 + j * .43, .719));
  for (let k = 0; k < 5; k++) server.add(box(.075, .10, .025, edges, -.53 + k * .14, .35 + j * .43, .719));
}
scene.add(server); critical.set('server', server);
for (const [x, z] of sources) cable([new THREE.Vector3(x, .1, z - .6),
  new THREE.Vector3(x * .75, .1, 2.6), new THREE.Vector3(0, .1, .6)], .04, panel);
cable([new THREE.Vector3(0, .16, -.6), new THREE.Vector3(0, .16, -5.7)], .09, edges);
// Capacity is represented by a fixed-width link, never a resizing pipe.
for (const z of [-1.8, -3.0, -4.2]) {
  const arch = new THREE.Group();
  arch.add(box(.07, .45, .08, metal, -.35, .25, z));
  arch.add(box(.07, .45, .08, metal, .35, .25, z));
  arch.add(box(.77, .07, .08, metal, 0, .49, z)); scene.add(arch);
}
const grid = new THREE.GridHelper(26, 26, 0x26384c, 0x19273a); grid.position.y = -.08; scene.add(grid);
const base = box(15, .13, 17, panel, 0, -.2, 0); scene.add(base);
const hemi = new THREE.HemisphereLight(0xd8e5f2, 0x26374c, 2.8); scene.add(hemi);
const key = new THREE.DirectionalLight(0xe6edff, 4.2); key.position.set(-6, 10, 6); scene.add(key);
const fill = new THREE.DirectionalLight(0x9eb8d4, 2.0); fill.position.set(8, 6, -4); scene.add(fill);
const sg = new THREE.SphereGeometry(.13, 12, 8), cg = new THREE.BoxGeometry(.22, .22, .22);
geometry.push(sg, cg);
const good = new THREE.InstancedMesh(sg, normal, 256), bad = new THREE.InstancedMesh(cg, attack, 256);
good.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bad.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
good.frustumCulled = false; bad.frustumCulled = false; scene.add(good, bad);
const dummy = new THREE.Object3D();
const model = buildTraffic(film.fps, film.duration, film.seed, film.beats[2].start, film.beats[3].start - film.beats[2].start);
const incidents = buildIncidentCues(model, Math.round(film.beats[4].start * film.fps));
const ringGeometry = new THREE.TorusGeometry(1.05, .035, 8, 64); geometry.push(ringGeometry);
const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff5c68, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }); materials.push(ringMaterial);
const impactRing = new THREE.Mesh(ringGeometry, ringMaterial); impactRing.rotation.x = -Math.PI / 2;
impactRing.position.set(0, .08, 1.1); scene.add(impactRing);
const incidentLight = new THREE.PointLight(0xff5c68, 0, 4, 2); incidentLight.position.set(0, 2, 1); scene.add(incidentLight);
const el = (id: string) => document.getElementById(id)!;
const labels = [
  { id: 'server-label', point: new THREE.Vector3(0, 2.9, -6.4) },
  { id: 'link-label', point: new THREE.Vector3(3.2, 1.3, -2.7) },
  { id: 'normal-label', point: new THREE.Vector3(-5, 1.5, 4.6) },
  { id: 'attack-label', point: new THREE.Vector3(3.5, 1.6, 5.1) }
];
let lastFrame = 0;
function projection(point: THREE.Vector3) {
  const p = point.clone().project(camera);
  return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H + TOP, depth: p.z };
}
export function renderAt(frame: number) {
  if (!Number.isInteger(frame) || frame < 0 || frame >= 1800) throw new Error('Frame outside [0, 1799]');
  lastFrame = frame;
  const t = frame / film.fps, state = model.frames[frame];
  const push = Math.sin(Math.min(1, Math.max(0, (t - film.beats[2].start - 2) / (film.beats[5].start - film.beats[2].start - 2))) * Math.PI);
  const event = cueAt(frame, incidents.events);
  camera.position.set(7.5 - 1.2 * push, 13.8 - .6 * push - .2 * event.impact, 19.8 - push - .65 * event.impact);
  camera.lookAt(0, .3, -.2);
  camera.updateMatrixWorld(true);
  let gn = 0, bn = 0;
  for (const p of model.packets) {
    if (frame < p.spawn) continue;
    const [sx, sz] = sources[p.lane];
    let x: number, y = .30, z: number, scale = 1;
    if (frame < p.arrival) {
      const u = (frame - p.spawn) / (p.arrival - p.spawn);
      x = sx * (1 - u); z = (sz - .5) * (1 - u) + 1.15 * u;
    } else if (p.dropped) {
      const u = (frame - p.arrival) / film.fps;
      if (u > .8) continue;
      x = 1.0 + u * 1.6; z = 1.1; y = .35 - u * 2.0; scale = 1 - u;
    } else if (p.departure !== null && frame >= p.departure) {
      const u = (frame - p.departure) / (film.fps * 1.3);
      if (u >= 1) continue;
      x = 0; z = -.6 - u * 5.1; y = .3 + .03 * Math.sin(u * Math.PI);
    } else {
      const q = state.queue.indexOf(p.id);
      if (q < 0) continue;
      x = (q % 6 - 2.5) * .27; z = .85 + Math.floor(q / 6) * .30;
      y = .3;
      if (p.role === 'normal' && t >= film.beats[4].start) scale = 1.5;
    }
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, p.role === 'attack' ? t * .8 + p.id : 0, 0);
    dummy.scale.setScalar(scale); dummy.updateMatrix();
    if (p.role === 'normal') good.setMatrixAt(gn++, dummy.matrix); else bad.setMatrixAt(bn++, dummy.matrix);
  }
  if (gn > 256 || bn > 256) throw new Error('Instance capacity exceeded');
  good.count = gn; bad.count = bn;
  good.instanceMatrix.needsUpdate = true; bad.instanceMatrix.needsUpdate = true;
  const beat = beatAt(t, film.beats);
  el('eyebrow').textContent = beat.eyebrow;
  el('headline').textContent = beat.title;
  el('detail').textContent = beat.detail;
  const cue = captions.find(c => t >= c.start && t < c.end);
  el('caption').textContent = cue?.text ?? '';
  el('caption').style.opacity = cue ? '1' : '0';
  el('capacity-fill').style.transform = `scaleX(${state.utilization})`;
  el('capacity-state').textContent = state.queue.length >= QUEUE_LIMIT - 1 ? 'SATURATED' : (t >= film.beats[2].start ? 'FILLING' : 'ROOM AVAILABLE');
  const saturated = state.queue.length >= QUEUE_LIMIT - 1;
  const warning = frame >= incidents.warningFrame && frame < incidents.events[0].start;
  el('capacity-fill').style.backgroundColor = saturated ? '#ff5c68' : warning ? '#ffc56e' : state.queue.length ? '#ff7a59' : '#4dd4ff';
  el('capacity-state').style.color = saturated ? '#ff5c68' : warning ? '#ffc56e' : '#eef3f8';
  el('incident').style.opacity = String(event.opacity);
  el('incident').style.visibility = event.cue ? 'visible' : 'hidden';
  el('incident').style.transform = `translateY(${event.lift}px) scale(${event.scale})`;
  el('incident-title').textContent = event.cue?.title ?? '';
  el('incident-detail').textContent = event.cue?.detail ?? '';
  impactRing.visible = event.ring > 0;
  impactRing.scale.setScalar(1 + (1 - event.ring) * .85);
  ringMaterial.opacity = event.ring * .8;
  incidentLight.intensity = event.opacity * 3.5;

  el('queue-state').textContent = state.queue.length >= QUEUE_LIMIT - 1 ? 'QUEUE FULL · PACKETS DROP' : (state.queue.length ? 'QUEUE BUILDING' : 'PACKETS PASS THROUGH');
  for (const label of labels) {
    const p = projection(label.point);
    el(label.id).style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -50%)`;
  }
  scene.updateMatrixWorld(true);
  renderer.render(scene, camera);
}
function inspect() {
  const objects = [...critical].map(([id, object]) => {
    const bounds = new THREE.Box3().setFromObject(object);
    const points = [];
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) points.push(projection(new THREE.Vector3(x, y, z)));
    return { id, minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)),
      minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)),
      visibleDepth: points.every(p => p.depth >= -1 && p.depth <= 1) };
  });
  const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
  return { frame: lastFrame, objects, incident: cueAt(lastFrame, incidents.events).cue?.id ?? null, incidentCues: incidents, serverOnline: true, normalInstances: good.count, attackInstances: bad.count,
    drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    queueLength: model.frames[lastFrame].queue.length, dropped: model.frames[lastFrame].dropped };
}
function dispose() {
  for (const g of geometry) g.dispose(); for (const m of materials) m.dispose();
  renderer.dispose();
}
export async function prepare() {
  await document.fonts.ready;
  await renderer.compileAsync(scene, camera);
  renderAt(0);
  window.studio = { renderAt, inspect, dispose };
}
window.__hf ??= {};
window.__hf.buildReady ??= {};
window.__hf.buildReady['ddos-three-scene'] = prepare();
window.addEventListener('hf-seek', (event) => {
  const detail = (event as CustomEvent).detail;
  renderAt(frameIndex(detail.time, film.fps, model.frames.length));
});
