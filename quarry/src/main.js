import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const DEM = window.QUARRY_DEM, F = window.QUARRY_FEATURES;
const { nx, ny, cell, x0, y0, pxPerM } = DEM;
const M = cell / pxPerM;                       // metres per grid cell
const Z = Float32Array.from(DEM.z), CONF = Int16Array.from(DEM.d, v => v * 4);
const zmin = Math.min(...Z), zmax = Math.max(...Z), BASE = zmin - 10;
const WX = (nx - 1) * M, WZ = (ny - 1) * M;    // world extent (m)
const px2w = (px, py) => [(px - x0) / pxPerM - WX / 2, (py - y0) / pxPerM - WZ / 2];

function elevAt(px, py) {                      // bilinear, scan-pixel coordinates
  const gx = Math.min(Math.max((px - x0) / cell, 0), nx - 1.001), gy = Math.min(Math.max((py - y0) / cell, 0), ny - 1.001);
  const i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j;
  const a = Z[j * nx + i], b = Z[j * nx + i + 1], c = Z[(j + 1) * nx + i], d = Z[(j + 1) * nx + i + 1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

// ---------- renderer / scene ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const SKY = new THREE.Color('#cfdde8'); scene.background = SKY; scene.fog = new THREE.Fog(SKY, 1400, 3200);
const camera = new THREE.PerspectiveCamera(45, 1, 2, 6000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.495; controls.screenSpacePanning = false;
const hemi = new THREE.HemisphereLight('#ffffff', '#8c8070', 0.75); scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff4e0', 1.9); scene.add(sun);
function setSun(az, el) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  sun.position.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).multiplyScalar(2500);
}

// ---------- textures ----------
function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
function elevationCanvas() {
  const S = 3, w = nx * S, h = ny * S, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), id = g.createImageData(w, h);
  const ramp = [[903, [74, 120, 84]], [960, [128, 150, 92]], [1010, [186, 176, 106]], [1060, [190, 140, 86]], [1120, [160, 110, 84]], [1230, [232, 226, 220]]];
  const col = z => { for (let k = 1; k < ramp.length; k++) if (z <= ramp[k][0] || k === ramp.length - 1) { const [za, ca] = ramp[k - 1], [zb, cb] = ramp[k], t = Math.min(Math.max((z - za) / (zb - za), 0), 1); return ca.map((v, q) => v + (cb[q] - v) * t); } };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = Math.min(x / S, nx - 1.001), gy = Math.min(y / S, ny - 1.001), i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j;
    const z = (Z[j * nx + i] * (1 - fx) + Z[j * nx + i + 1] * fx) * (1 - fy) + (Z[(j + 1) * nx + i] * (1 - fx) + Z[(j + 1) * nx + i + 1] * fx) * fy;
    const dzx = (Z[j * nx + Math.min(i + 1, nx - 1)] - Z[j * nx + Math.max(i - 1, 0)]) / (2 * M), dzy = (Z[Math.min(j + 1, ny - 1) * nx + i] - Z[Math.max(j - 1, 0) * nx + i]) / (2 * M);
    const slope = Math.atan(Math.hypot(dzx, dzy)) * 57.3, rock = Math.min(Math.max((slope - 30) / 12, 0), 1);
    let c = col(z); const idx = (y * w + x) * 4;
    // contour lines every 5 m (bold 25 m)
    const f5 = ((z % 5) + 5) % 5, near = Math.min(f5, 5 - f5) / Math.max(Math.hypot(dzx, dzy), 0.15);
    const line = near < 0.55 ? 0.38 : 0, idxl = Math.abs(((z + 2.5) % 25) - 2.5) < 0.1 + Math.hypot(dzx, dzy) * 0.18 ? 0.25 : 0;
    for (let q = 0; q < 3; q++) { let v = c[q] * (1 - rock * 0.55) + 120 * rock * 0.55; v *= 1 - line - idxl * 0.5; id.data[idx + q] = v; }
    id.data[idx + 3] = 255;
  }
  g.putImageData(id, 0, 0); return cv;
}
const T = { scan: null, plan: null, elev: null };
function mkTex(src) { const t = new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); t.needsUpdate = true; return t; }
async function buildTextures() {
  T.elev = mkTex(elevationCanvas());
  const sc = await loadImg(window.QUARRY_SCAN); if (sc) T.scan = mkTex(sc);
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.QUARRY_PLAN);
  const pi = await loadImg(svgUrl);
  if (pi) {
    const ex = (nx - 1) * cell, ey = (ny - 1) * cell, cv = document.createElement('canvas'); cv.width = 4096; cv.height = Math.round(4096 * ey / ex);
    const g = cv.getContext('2d'); g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, cv.width, cv.height);
    g.drawImage(pi, x0, y0 - 450, ex, ey, 0, 0, cv.width, cv.height);   // plan svg's window starts at y=450
    T.plan = mkTex(cv);
  }
}

// ---------- terrain ----------
const pos = new Float32Array(nx * ny * 3), uv = new Float32Array(nx * ny * 2), colr = new Float32Array(nx * ny * 3);
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const k = j * nx + i;
  pos[k * 3] = i * M - WX / 2; pos[k * 3 + 1] = Z[k]; pos[k * 3 + 2] = j * M - WZ / 2;
  uv[k * 2] = i / (nx - 1); uv[k * 2 + 1] = 1 - j / (ny - 1);
  const c = CONF[k] > 330 ? 0.8 : 1; colr[k * 3] = colr[k * 3 + 1] = colr[k * 3 + 2] = c;
}
const idx = [];
for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, c, b, b, c, d); }
const tg = new THREE.BufferGeometry();
tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); tg.setAttribute('color', new THREE.BufferAttribute(colr, 3));
tg.setIndex(idx); tg.computeVertexNormals();
const tmat = new THREE.MeshLambertMaterial({ vertexColors: true });
const terrain = new THREE.Mesh(tg, tmat); scene.add(terrain);

// skirt (cut-block look)
let skirt;
{
  const sp = [], sc = [], si = [];
  const edge = [];
  for (let i = 0; i < nx; i++) edge.push([i, 0]);
  for (let j = 1; j < ny; j++) edge.push([nx - 1, j]);
  for (let i = nx - 2; i >= 0; i--) edge.push([i, ny - 1]);
  for (let j = ny - 2; j > 0; j--) edge.push([0, j]);
  edge.forEach(([i, j], n) => {
    const k = j * nx + i, x = i * M - WX / 2, z = j * M - WZ / 2, h = Z[k];
    sp.push(x, h, z, x, BASE, z);
    for (let q = 0; q < 2; q++) { const t = q ? 0.3 : 0.55 + ((h - zmin) % 12) / 60; sc.push(0.45 * t + 0.2, 0.36 * t + 0.16, 0.28 * t + 0.12); }
    if (n < edge.length - 1) { const a = n * 2; si.push(a, a + 1, a + 2, a + 2, a + 1, a + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3)); g.setIndex(si); g.computeVertexNormals();
  skirt = { mesh: new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })), edge };
  scene.add(skirt.mesh);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WX, WZ).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#2a2622' })); floor.position.y = BASE; scene.add(floor);
}

// ---------- features (all draped on the terrain, scaled by exaggeration) ----------
const groups = { stream: new THREE.Group(), blocks: new THREE.Group(), labels: new THREE.Group(), buildings: new THREE.Group(), spots: new THREE.Group() };
Object.values(groups).forEach(g => scene.add(g));
const draped = [];   // {obj, px, py, lift}
function ribbon(points, width, color, lift, opacity = 1) {
  const pts = []; for (let i = 0; i < points.length - 1; i++) { const [ax, ay] = points[i], [bx, by] = points[i + 1]; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 14)); for (let s = 0; s < n; s++) pts.push([ax + (bx - ax) * s / n, ay + (by - ay) * s / n]); }
  pts.push(points[points.length - 1]);
  const p = [], ix = [], base = [];
  pts.forEach(([x, y], i) => {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nxn = -ty / l, nyn = tx / l;
    for (const s of [-1, 1]) { const qx = x + nxn * s * width * pxPerM / 2, qy = y + nyn * s * width * pxPerM / 2; base.push([qx, qy]); p.push(0, 0, 0); }
    if (i < pts.length - 1) { const k = i * 2; ix.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity >= 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.frustumCulled = false; m.userData = { base, lift }; draped.push(m); return m;
}
function label(text, px, py, lift, { size = 1, color = '#fff', bg = 'rgba(20,24,28,.72)' } = {}) {
  const cv = document.createElement('canvas'), g = cv.getContext('2d'); g.font = '600 38px Segoe UI, Arial'; const w = Math.ceil(g.measureText(text).width) + 28; cv.width = w; cv.height = 64;
  g.font = '600 38px Segoe UI, Arial'; g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, 64, 14); g.fill(); g.fillStyle = color; g.textBaseline = 'middle'; g.fillText(text, 14, 34);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.renderOrder = 10; s.scale.set(w / 64 * 13 * size, 13 * size, 1); s.userData = { px, py, lift, sprite: true }; return s;
}
// stream
{
  const pts = F.stream.map(p => [p[0], p[1]]);
  groups.stream.add(ribbon(pts, 11, '#6fb1d8', 0.5, 0.75)); groups.stream.add(ribbon(pts, 3, '#2f7fb4', 0.8));
  const l = label('pr. Fântâna', 2050, 1285, 14, { size: .8, bg: 'rgba(30,90,140,.8)' }); groups.stream.add(l); draped.push(l);
}
// block outlines
const BC = { 'upper (pink)': '#d65aa8', blue: '#4d73ff', pink: '#d65aa8', 'teal 2-B': '#18c4ae', 'teal top': '#18c4ae' };
for (const [k, pts] of Object.entries(F.blocks)) groups.blocks.add(ribbon(pts, 1.6, BC[k], 1.2));
// labels
for (const [t, x, y] of F.labels) { const big = t !== 'HALDA'; const l = label(t, x, y, big ? 22 : 12, { size: big ? 1.15 : .7, bg: big ? 'rgba(20,24,28,.78)' : 'rgba(110,92,60,.85)' }); groups.labels.add(l); draped.push(l); }
// buildings
for (const [x, y, w, h, lab] of F.buildings) {
  const bw = w / pxPerM * 1.3, bd = h / pxPerM * 1.3, bh = 6;
  const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), new THREE.MeshLambertMaterial({ color: lab === 'Sediu' ? '#c9b48a' : '#d8d2c4' }));
  m.userData = { px: x, py: y, lift: bh / 2, box: true }; groups.buildings.add(m); draped.push(m);
  const r = new THREE.Mesh(new THREE.BoxGeometry(bw * 1.06, 1.2, bd * 1.06), new THREE.MeshLambertMaterial({ color: '#7a3e2c' }));
  r.userData = { px: x, py: y, lift: bh + 0.4, box: true }; groups.buildings.add(r); draped.push(r);
  if (lab) { const l = label(lab, x, y, bh + 9, { size: .7 }); groups.buildings.add(l); draped.push(l); }
}
// spot-height markers
for (const [x, y, z] of F.spots) { if (z % 5 === 0 && Math.abs(z - Math.round(z)) < .01) continue; const m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 5, 6), new THREE.MeshBasicMaterial({ color: '#222' })); m.userData = { px: x, py: y, lift: 2.5, box: true }; groups.spots.add(m); draped.push(m); }
groups.spots.visible = false;

// north arrow: sheet north is to the right, tilted ~10.6 degrees clockwise
{
  const g = new THREE.Group(); const ang = Math.atan2(30, 160);
  const dir = new THREE.Vector3(Math.cos(ang), 0, Math.sin(ang));
  g.add(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 90, '#d13b3b', 18, 10));
  const l = label('N', 0, 0, 0, { size: 1.1, bg: 'rgba(180,40,40,.9)' }); l.position.copy(dir.clone().multiplyScalar(112)); l.position.y = 0; g.add(l);
  g.position.set(WX / 2 - 170, zmax + 40, -WZ / 2 + 70); g.userData.north = true; scene.add(g);
}

// ---------- exaggeration / draping ----------
let exag = 1.6;
function applyExag() {
  const mid = (zmin + zmax) / 2;
  const ys = z => (z - zmin) * exag + zmin;
  const p = tg.attributes.position; for (let k = 0; k < nx * ny; k++) p.array[k * 3 + 1] = ys(Z[k]); p.needsUpdate = true; tg.computeVertexNormals();
  { const a = skirt.mesh.geometry.attributes.position; skirt.edge.forEach(([i, j], n) => { a.array[n * 6 + 1] = ys(Z[j * nx + i]); }); a.needsUpdate = true; }
  draped.forEach(o => {
    const u = o.userData;
    if (u.base) { const a = o.geometry.attributes.position; u.base.forEach(([qx, qy], i) => { const [wx, wz] = px2w(qx, qy); a.array[i * 3] = wx; a.array[i * 3 + 1] = ys(elevAt(qx, qy)) + u.lift; a.array[i * 3 + 2] = wz; }); a.needsUpdate = true; }
    else { const [wx, wz] = px2w(u.px, u.py); o.position.set(wx, ys(elevAt(u.px, u.py)) + u.lift * (u.box ? 1 : 1), wz); }
  });
  controls.target.y = ys(1020);
}

// ---------- UI ----------
const $ = id => document.getElementById(id);
let mode = 'elev';
function setMode(m) {
  mode = m; const t = T[m] || T.elev; tmat.map = t; tmat.needsUpdate = true;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
}
document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('exag').oninput = e => { exag = +e.target.value; $('exagv').textContent = exag.toFixed(1) + '×'; applyExag(); };
$('sunaz').oninput = e => setSun(+e.target.value, +$('sunel').value); $('sunel').oninput = e => setSun(+$('sunaz').value, +e.target.value);
for (const k of Object.keys(groups)) { const el = $('t-' + k); if (el) { el.checked = groups[k].visible; el.onchange = () => groups[k].visible = el.checked; } }
$('wire').onchange = e => { tmat.wireframe = e.target.checked; };
const views = {
  overview: [[-120, 760, 880], [-60, 1000, 20]],
  quarry:   [[-330, 330, 180], [-330, 1090, -90]],
  face:     [[-250, 230, 300], [-300, 1120, -120]],
  stream:   [[0, 330, 330], [60, 960, 60]],
  sediu:    [[430, 230, 240], [430, 910, 20]],
};
function fly(name) {
  const [c, t] = views[name];
  camera.position.set(c[0], zmin + c[1], c[2]); controls.target.set(t[0], (t[1] - zmin) * exag + zmin, t[2]); controls.update();
}
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => fly(b.dataset.view));
// hover readout
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mouse, camera); const h = ray.intersectObject(terrain)[0];
  if (h) { const z = (h.point.y - zmin) / exag + zmin; const e_ = (h.point.x + WX / 2), s_ = (h.point.z + WZ / 2); const px = x0 + e_ / M * cell, py = y0 + s_ / M * cell; $('readout').textContent = `cota ≈ ${z.toFixed(0)} m · ${CONF[Math.min(Math.round(s_ / M), ny - 1) * nx + Math.min(Math.round(e_ / M), nx - 1)] > 330 ? 'extrapolat (zonă neridicată)' : 'zonă ridicată pe planșă'}`; }
});
function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
// label sizing: keep readable
function tick() {
  controls.update();
  groups.labels.children.concat(groups.buildings.children, groups.stream.children).forEach(o => { if (o.isSprite) { const d = camera.position.distanceTo(o.position); const k = Math.min(Math.max(d / 700, .45), 1.8); o.scale.set(o.scale.x / (o.userData.k || 1) * k, o.scale.y / (o.userData.k || 1) * k, 1); o.userData.k = k; } });
  renderer.render(scene, camera); requestAnimationFrame(tick);
}
(async () => {
  resize(); setSun(235, 38); await buildTextures();
  $('tex-scan').disabled = !T.scan; $('tex-plan').disabled = !T.plan;
  setMode('elev'); applyExag(); fly('overview'); $('loading').remove(); tick();
  window.__quarry = { fly, setMode, THREE, camera, controls, scene };
})();
