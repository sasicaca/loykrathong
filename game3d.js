// ============================================================
//  งานวัดลอยกระทง — ฉากทดลอง 3D (ตัวละคร + ร้านลูกชิ้น + โคม + กล้อง)
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const R = Math.random, rr = (a, b) => a + R() * (b - a), pick = a => a[R() * a.length | 0];
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const $ = id => document.getElementById(id);
try { await Promise.race([document.fonts.load('700 64px Mali', 'ลูกชิ้นปิ้ง'), new Promise(r => setTimeout(r, 2500))]); } catch (e) { /* ใช้ฟอนต์เครื่องแทน */ }

// ---------- renderer / scene / camera ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0b2e);
scene.fog = new THREE.FogExp2(0x1b1445, .011);
const camera = new THREE.PerspectiveCamera(42, 1, .1, 400);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .22, .5, 1.0);
composer.addPass(bloom); composer.addPass(new OutputPass());
function resize() { const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); composer.setSize(w, h); }
addEventListener('resize', resize); resize();

// ---------- helpers ----------
const mats = new Map();
// ลงสีแบบการ์ตูน: แสงเงาเป็นขั้น ๆ + เส้นขอบ
const GRAD = new THREE.DataTexture(new Uint8Array([105, 160, 205, 235]), 4, 1, THREE.RedFormat); GRAD.minFilter = GRAD.magFilter = THREE.NearestFilter; GRAD.needsUpdate = true;
const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x4a2530, side: THREE.BackSide });
OUTLINE.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
transformed += normalize(normal) * 0.013;
`); };
function M(color, o = {}) {
  const k = color + JSON.stringify(o); if (!mats.has(k)) { const { roughness, metalness, ...rest } = o; mats.set(k, new THREE.MeshToonMaterial({ color, gradientMap: GRAD, ...rest })); } return mats.get(k);
}
const glow = (color, i = 2.2) => M(color, { emissive: color, emissiveIntensity: i });
function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; return m; }
const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const cyl = (rt, rb, h, mat, x, y, z, seg = 16) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z);
const ball = (r, mat, x, y, z) => mesh(new THREE.SphereGeometry(r, 20, 14), mat, x, y, z);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function textTex(txt, { w = 512, h = 128, bg = '#7a4a25', fg = '#fff1cc', px = 72, border = '#a87644' } = {}) {
  return canvasTex(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); g.fillStyle = fg; g.font = `700 ${px}px Mali, "Leelawadee UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4); });
}

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x8f86e0, 0x8a6a78, 1.7));
const moonLight = new THREE.DirectionalLight(0xb4bcff, .8);
moonLight.position.set(10, 18, 8); moonLight.castShadow = true; moonLight.shadow.mapSize.set(2048, 2048);
Object.assign(moonLight.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 60 }); moonLight.shadow.bias = -.0004; moonLight.shadow.normalBias = .03;
scene.add(moonLight);
const warm = (x, y, z, i = 22, d = 10) => { const l = new THREE.PointLight(0xffb060, i, d, 1.8); l.position.set(x, y, z); scene.add(l); return l; };

// ---------- ground, river, far bank, sky ----------
const tileTex = canvasTex(512, 512, (g) => {
  g.fillStyle = '#6a5464'; g.fillRect(0, 0, 512, 512);
  for (let row = 0; row < 8; row++) for (let i = -1; i < 4; i++) { const v = R() * 26 - 13; g.fillStyle = `rgb(${158 + v | 0},${132 + v | 0},${138 + v | 0})`; g.beginPath(); g.roundRect(i * 128 + (row % 2 ? 64 : 0) + 3, row * 64 + 3, 122, 58, 8); g.fill(); }
});
tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(9, 6);
const ground = mesh(new THREE.PlaneGeometry(36, 24), new THREE.MeshStandardMaterial({ map: tileTex, roughness: .92 }), 0, 0, 6, false); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const grass = mesh(new THREE.PlaneGeometry(140, 60), M('#2f5a3a'), 0, -.02, 20, false); grass.rotation.x = -Math.PI / 2; scene.add(grass);
scene.add(box(36, .5, .5, M('#b9a3a8'), 0, -.05, -6.2));
const river = mesh(new THREE.PlaneGeometry(260, 60), new THREE.MeshStandardMaterial({ color: 0x1c1650, roughness: .22, metalness: .55 }), 0, -.3, -36, false); river.rotation.x = -Math.PI / 2; scene.add(river);
// railing
for (let x = -17.5; x <= 17.5; x += 1.4) scene.add(box(.1, .8, .1, M('#5d3a20'), x, .4, -5.8));
scene.add(box(36, .08, .1, M('#7a4c2c'), 0, .8, -5.8), box(36, .06, .08, M('#7a4c2c'), 0, .5, -5.8));
// far bank
scene.add(box(260, 2.4, 6, M('#120d30'), 0, .6, -68));
for (let i = 0; i < 40; i++) scene.add(mesh(new THREE.IcosahedronGeometry(rr(2, 4.5), 0), M('#140f33'), rr(-120, 120), rr(1.5, 3), rr(-69, -66), false));
function chedi(x, s) {
  const gm = glow('#ffcf6a', .55), gp = new THREE.Group(); gp.position.set(x, 1.6, -67); gp.scale.setScalar(s);
  gp.add(cyl(3.4, 3.8, 1.2, gm, 0, .6, 0), cyl(2.6, 3.2, 1.2, gm, 0, 1.8, 0), mesh(new THREE.SphereGeometry(2.4, 20, 14, 0, 7, 0, 1.6), gm, 0, 2.4, 0, false), cyl(.9, 1.5, 1.6, gm, 0, 5, 0), mesh(new THREE.ConeGeometry(.9, 6.5, 14), gm, 0, 9, 0, false));
  scene.add(gp);
}
chedi(4, 1.5); chedi(-46, .9); chedi(58, 1);
for (const [x, w] of [[-6, 9], [14, 8], [-34, 7], [40, 8], [-70, 8], [82, 7]]) { scene.add(box(w, 2.2, 3, glow('#f3cf86', .3), x, 2.6, -66.5)); const roof = mesh(new THREE.ConeGeometry(w * .72, 2.6, 4), glow('#c9482b', .25), x, 5, -66.5, false); roof.rotation.y = Math.PI / 4; roof.scale.z = .5; scene.add(roof); }
function points(n, gen, size, color) { const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set(gen(i), i * 3); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, sizeAttenuation: true, fog: false, transparent: true, opacity: .95 })); scene.add(pts); return pts; }
points(260, () => [rr(-125, 125), rr(1.9, 2.7), -64.8], .45, 0xffc070);
points(700, () => { const a = rr(0, Math.PI * 2), e = rr(.06, 1.3), r = 300; return [Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r]; }, 1.6, 0xffffff);
const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 20), new THREE.MeshBasicMaterial({ color: 0xfff6dc, fog: false })); moon.position.set(40, 40, -220);
scene.add(new THREE.Mesh(new THREE.SphereGeometry(350, 24, 16), new THREE.MeshBasicMaterial({ map: canvasTex(8, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#05051c'); gr.addColorStop(.42, '#1a1450'); gr.addColorStop(.5, '#4b2f82'); gr.addColorStop(.56, '#1b1445'); gr.addColorStop(1, '#1b1445'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); }), side: THREE.BackSide, fog: false, depthWrite: false }))); scene.add(moon);

// ---------- krathongs on the river ----------
const krathongs = [];
function makeKrathong(v = 0) {
  const g = new THREE.Group(), fc = ['#c95be0', '#ffc531', '#ff7fb0'][v % 3];
  g.add(cyl(.2, .16, .07, M('#2f7a3a'), 0, .035, 0, 12));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, p = mesh(new THREE.ConeGeometry(.06, .16, 4), M(i % 2 ? '#58b24e' : '#3f9b46'), Math.cos(a) * .19, .1, Math.sin(a) * .19); p.rotation.set(Math.sin(a) * .6, 0, -Math.cos(a) * .6); g.add(p); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(ball(.05, M(fc), Math.cos(a) * .1, .1, Math.sin(a) * .1)); }
  g.add(cyl(.018, .018, .16, M('#fff3d0'), 0, .17, 0, 8));
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffb040 })); flame.position.y = .28; flame.scale.y = 1.6; g.add(flame);
  return g;
}
for (let i = 0; i < 46; i++) { const k = makeKrathong(i); k.position.set(rr(-45, 45), -.26, rr(-34, -8)); k.scale.setScalar(1.5); k.userData = { v: rr(.25, .5), s: R() * 9 }; scene.add(k); krathongs.push(k); }
const skyLanterns = [];
for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .28, .6, 8), new THREE.MeshBasicMaterial({ color: 0xffb060, fog: false })); m.position.set(rr(-70, 70), rr(8, 40), rr(-90, -40)); scene.add(m); skyLanterns.push(m); }

// ---------- props ----------
function lantern(x, y, z, s = 1, col = '#ffe2a0') { const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); g.add(cyl(.15, .15, .3, glow(col, .32), 0, 0, 0, 12), cyl(.11, .11, .05, M('#b2413a'), 0, .17, 0, 12), cyl(.11, .11, .05, M('#b2413a'), 0, -.17, 0, 12), cyl(.012, .012, .2, M('#e0574f'), 0, -.3, 0, 6)); scene.add(g); return g; }
function lampPost(x, z) { const m = M('#4a2e1c'); scene.add(cyl(.06, .08, 2.9, m, x, 1.45, z, 10), box(.5, .06, .06, m, x + .22, 2.86, z)); lantern(x + .45, 2.55, z, 1.25); warm(x + .45, 2.4, z, 13, 12); }
function tree(x, z, s = 1) {
  scene.add(cyl(.22 * s, .34 * s, 2.6 * s, M('#5d3d26'), x, 1.3 * s, z, 10));
  for (let i = 0; i < 7; i++) scene.add(mesh(new THREE.IcosahedronGeometry(rr(.9, 1.5) * s, 1), new THREE.MeshStandardMaterial({ color: pick(['#2c6338', '#37774a', '#458a52', '#6fae58']), roughness: .9, flatShading: true }), x + rr(-1.3, 1.3) * s, (3 + rr(0, 1.6)) * s, z + rr(-1.3, 1.3) * s));
}
function bunting(a, b, sag = .5) {
  const cols = ['#ff6b6b', '#ffd166', '#4ecdc4', '#ff8fab', '#7c6cf0', '#ff9f43'], n = Math.round(a.distanceTo(b) / .42);
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.13, 0, 0, .13, 0, 0, 0, -.28, 0]), 3)); tri.computeVertexNormals();
  for (let i = 1; i < n; i++) { const u = i / n, p = a.clone().lerp(b, u); p.y -= sag * 4 * u * (1 - u); const f = new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: cols[i % 6], side: THREE.DoubleSide, roughness: .9 })); f.position.copy(p); f.rotation.y = Math.atan2(b.x - a.x, b.z - a.z) + Math.PI / 2; scene.add(f); }
}
const BOXES = [];   // collision boxes [minX, maxX, minZ, maxZ]
function makeStall(x, z, { name, cols, price, kind }) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  const wood = M('#a8703c'), dark = M('#5d3a20');
  g.add(box(3.3, .62, .9, wood, 0, .31, 0), box(3.4, .06, 1, M('#d39b5f'), 0, .65, 0));
  for (const sx of [-1.65, 1.65]) for (const sz of [-.75, .55]) g.add(cyl(.05, .05, 2.5, dark, sx, 1.25, sz, 8));
  g.add(box(3.3, 1.9, .06, M('#6e4428'), 0, 1.45, -.78), box(3.3, .06, .3, M('#8a5a34'), 0, 1.35, -.62));
  const stripe = canvasTex(256, 64, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? cols[1] : cols[0]; c.fillRect(i * 32, 0, 32, 64); } });
  const am = new THREE.MeshStandardMaterial({ map: stripe, roughness: .9, side: THREE.DoubleSide });
  const aw = mesh(new THREE.BoxGeometry(3.9, .05, 2.2), am, 0, 2.52, .05); aw.rotation.x = .26; g.add(aw);
  const fr = mesh(new THREE.BoxGeometry(3.9, .22, .04), am, 0, 2.14, 1.12); g.add(fr);
  for (let i = 0; i < 8; i++) { const d = cyl(.243, .243, .03, M(i % 2 ? cols[1] : cols[0]), -1.706 + i * .4875, 2.03, 1.11, 20); d.rotation.x = Math.PI / 2; g.add(d); }
  const sign = mesh(new THREE.BoxGeometry(2, .5, .08), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: textTex(name), roughness: .8 }), dark], 0, 3.05, .3); g.add(sign);
  g.add(cyl(.03, .03, .35, dark, -.7, 2.78, .3, 6), cyl(.03, .03, .35, dark, .7, 2.78, .3, 6));
  const tagM = new THREE.MeshStandardMaterial({ map: textTex(price, { w: 256, h: 96, bg: '#fffaf0', fg: '#6b3a1e', px: 46, border: '#c9a377' }), roughness: .8 });
  const tag = mesh(new THREE.PlaneGeometry(.75, .28), tagM, -.9, .36, .46, false); g.add(tag);
  for (const sx of [-1.5, 1.5]) { const l = lantern(0, 0, 0, .9); scene.remove(l); l.position.set(sx, 1.95, 1.0); g.add(l); }
  warm(x, 1.5, z + 1.9, 6, 9);
  if (kind === 'meatball') {
    g.add(box(1.3, .14, .5, M('#2c2828'), -.2, .75, .1));
    const coal = mesh(new THREE.PlaneGeometry(1.2, .42), glow('#ff6a20', 1.8), -.2, .825, .1, false); coal.rotation.x = -Math.PI / 2; g.add(coal); g.userData.coal = coal;
    g.userData.skewers = [];
    for (let i = 0; i < 5; i++) { const s = makeSkewer(); s.rotation.x = Math.PI / 2; s.position.set(-.7 + i * .25, .87, -.1); g.add(s); g.userData.skewers.push(s); }
    g.add(cyl(.17, .12, .12, M('#eadfce'), 1.1, .74, .1), cyl(.14, .14, .02, M('#7a2e12'), 1.1, .8, .1), box(.5, .05, .4, M('#dfe7ea'), -1.25, .7, .05));
  } else {
    for (let i = 0; i < 5; i++) { const k = makeKrathong(i); k.scale.setScalar(1.25); k.position.set(-1.2 + i * .6, .68, .1); g.add(k); }
    for (let i = 0; i < 4; i++) { const k = makeKrathong(i + 1); k.position.set(-.9 + i * .6, 1.4, -.6); g.add(k); }
  }
  BOXES.push([x - 1.95, x + 1.95, z - 1.1, z + .75]);
  return g;
}
function makeSkewer() {
  const g = new THREE.Group(); g.add(cyl(.012, .012, .5, M('#d9b98a'), 0, .25, 0, 6));
  for (const y of [.3, .39, .48]) g.add(ball(.052, M('#b8672c', { roughness: .5 }), 0, y, 0));
  return g;
}

// ---------- characters ----------
const SKINS = ['#ffe0c4', '#fbd3b0', '#f3c49a'], HAIRS = ['#3a2218', '#4a2c1a', '#5a3520', '#2e2422'];
const SHIRTS = ['#ffffff', '#ffd6e0', '#cfe8ff', '#ffe9a8', '#d4f5d0', '#e3d4ff', '#8fd3c8'], BOTTOMS = ['#5b5f97', '#3d405b', '#8d6a9f', '#b56576', '#3f6f73'];
function randLook() { const girl = R() < .5; return { skin: pick(SKINS), hair: pick(HAIRS), style: girl ? pick(['long', 'bun', 'pony', 'long']) : 'short', shirt: pick(SHIRTS), bottom: pick(BOTTOMS), skirt: girl && R() < .7, pants: !girl && R() < .5, acc: girl ? pick([null, 'flower', 'bow']) : null }; }
// หน้าแบบวาด: วาดลงผืนผ้าใบแล้วแปะบนหัว เปลี่ยนสีหน้าได้
function faceTex(kind) {
  return canvasTex(256, 256, (g) => {
    const P2 = Math.PI; g.lineCap = 'round';
    for (const s of [-1, 1]) { const bx = 128 + s * 88, gr = g.createRadialGradient(bx, 174, 2, bx, 174, 27); gr.addColorStop(0, 'rgba(255,105,125,.8)'); gr.addColorStop(1, 'rgba(255,105,125,0)'); g.fillStyle = gr; g.fillRect(bx - 28, 146, 56, 56); }
    for (const s of [-1, 1]) {
      const ex = 128 + s * 52, ey = 134;
      g.strokeStyle = '#2a1610'; g.lineWidth = 7;
      if (kind === 'blink') { g.beginPath(); g.moveTo(ex - 18, ey + 8); g.lineTo(ex + 18, ey + 8); g.stroke(); }
      else if (kind === 'happy') { g.beginPath(); g.arc(ex, ey + 16, 19, 1.15 * P2, 1.85 * P2); g.stroke(); }
      else if (kind === 'pray') { g.beginPath(); g.arc(ex, ey - 6, 19, .15 * P2, .85 * P2); g.stroke(); }
      else {
        g.fillStyle = '#3a2318'; g.beginPath(); g.ellipse(ex, ey, 19, 27, 0, 0, 7); g.fill();
        const gr = g.createLinearGradient(0, ey - 8, 0, ey + 24); gr.addColorStop(0, '#6a3a1e'); gr.addColorStop(1, '#c98548'); g.fillStyle = gr; g.beginPath(); g.ellipse(ex, ey + 6, 14, 18, 0, 0, 7); g.fill();
        g.fillStyle = '#24120c'; g.beginPath(); g.ellipse(ex, ey + 2, 7, 10, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 7, ey - 11, 7.5, 0, 7); g.fill(); g.globalAlpha = .85; g.beginPath(); g.arc(ex + 8, ey + 13, 3.6, 0, 7); g.fill(); g.globalAlpha = 1;
        g.lineWidth = 6.5; g.beginPath(); g.arc(ex, ey + 5, 24, 1.13 * P2, 1.87 * P2); g.stroke();
        g.lineWidth = 4; g.beginPath(); g.moveTo(ex + s * 21, ey - 6); g.lineTo(ex + s * 28, ey - 12); g.stroke();
      }
    }
    if (kind === 'eat') { g.fillStyle = '#a8483a'; g.beginPath(); g.ellipse(128, 192, 9, 11, 0, 0, 7); g.fill(); }
    else if (kind === 'happy') { g.fillStyle = '#b5483a'; g.beginPath(); g.arc(128, 183, 14, 0, P2); g.closePath(); g.fill(); g.fillStyle = '#ff9aa0'; g.beginPath(); g.ellipse(128, 193, 7, 4, 0, 0, 7); g.fill(); }
    else { g.strokeStyle = '#a0522d'; g.lineWidth = 4.5; g.beginPath(); g.arc(128, 180, 11, .15 * P2, .85 * P2); g.stroke(); }
  });
}
const FACES = Object.fromEntries(['normal', 'blink', 'happy', 'pray', 'eat'].map(k => [k, faceTex(k)]));
function makeChar(L) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const skin = M(L.skin), shirt = M(L.shirt), bottom = M(L.bottom), hair = M(L.hair), white = M('#ffffff');
  const add = (m, parent = body) => { m.add(new THREE.Mesh(m.geometry, OUTLINE)); parent.add(m); return m; };
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s * .11, .34, 0);
    add(mesh(new THREE.CapsuleGeometry(.075, .15, 4, 10), L.pants ? bottom : skin, 0, -.15, 0), hip);
    if (!L.pants) add(cyl(.082, .082, .07, white, 0, -.235, 0, 12), hip);
    const foot = ball(.095, M('#6b4a3a'), 0, -.29, .045); foot.scale.set(1, .62, 1.5); add(foot, hip);
    body.add(hip); legs.push(hip);
    const sh = new THREE.Group(); sh.position.set(s * .25, .7, 0);
    add(mesh(new THREE.CapsuleGeometry(.056, .17, 4, 10), skin, 0, -.13, 0), sh);
    add(mesh(new THREE.CapsuleGeometry(.076, .06, 4, 10), shirt, 0, -.05, 0), sh);
    sh.userData.hand = add(ball(.07, skin, 0, -.28, 0), sh);
    body.add(sh); arms.push(sh);
  }
  const torso = ball(.27, shirt, 0, .58, 0); torso.scale.set(1, 1.08, .85); add(torso);
  if (L.skirt) { add(cyl(.2, .37, .26, bottom, 0, .4, 0, 24)); add(cyl(.218, .218, .05, M('#fff4e0'), 0, .525, 0, 20)); }
  else add(cyl(.245, .25, .17, bottom, 0, .38, 0, 16));
  if (L.apron) { add(box(.32, .34, .05, M(L.apron), 0, .52, .215)); body.add(box(.16, .1, .02, M('#f2e2c0'), 0, .45, .245)); }
  else { const col = mesh(new THREE.TorusGeometry(.13, .036, 8, 18), white, 0, .8, .02); col.rotation.x = Math.PI / 2; add(col); for (const y of [.66, .56]) body.add(ball(.022, M('#f2c14e'), 0, y, .232)); }
  // head
  const head = new THREE.Group(); head.position.y = 1.03; body.add(head);
  const hm = ball(.36, skin, 0, 0, 0); hm.scale.set(1, .94, .95); add(hm, head);
  const fm = new THREE.MeshBasicMaterial({ map: FACES.normal, transparent: true, depthWrite: false });
  hm.add(new THREE.Mesh(new THREE.SphereGeometry(.366, 24, 16, Math.PI / 2 - .9, 1.8, Math.PI / 2 - .75, 1.5), fm));
  for (const s of [-1, 1]) add(ball(.06, skin, s * .345, -.03, 0), head);
  const cap = mesh(new THREE.SphereGeometry(.39, 28, 18, 0, Math.PI * 2, 0, Math.PI * .56), hair, 0, .01, -.015); cap.rotation.x = -.5; add(cap, head);
  for (const [bx, rot] of [[-.25, .55], [-.13, .22], [0, 0], [.13, -.22], [.25, -.55]]) {
    const b = ball(.105, hair, bx, .21 - Math.abs(bx) * .3, Math.sqrt(.37 * .37 - bx * bx - .04) - .035); b.scale.set(.85, 1.25, .5); b.rotation.z = rot; add(b, head);
  }
  if (L.style !== 'short') for (const s of [-1, 1]) { const lk = mesh(new THREE.CapsuleGeometry(.05, .2, 4, 8), hair, s * .335, -.1, .1); lk.rotation.z = s * .12; add(lk, head); }
  if (L.style === 'long') { const h = ball(.38, hair, 0, -.2, -.12); h.scale.set(1.05, 1.4, .7); add(h, head); }
  if (L.style === 'bun') for (const s of [-1, 1]) add(ball(.14, hair, s * .27, .31, -.04), head);
  if (L.style === 'pony') { add(ball(.13, hair, 0, .12, -.4), head); const t = mesh(new THREE.CapsuleGeometry(.08, .28, 4, 8), hair, 0, -.14, -.46); t.rotation.x = -.25; add(t, head); body.userData.tail = t; }
  if (L.acc === 'flower') { for (let i = 0; i < 5; i++) head.add(ball(.04, white, -.28 + Math.cos(i * 1.257) * .05, .22 + Math.sin(i * 1.257) * .05, .2)); head.add(ball(.035, M('#ffc531'), -.28, .22, .225)); }
  if (L.acc === 'bow') { for (const s of [-1, 1]) { const w = ball(.075, M('#ff8fb0'), .22 + s * .075, .33, .1); w.scale.set(1, .72, .5); add(w, head); } head.add(ball(.038, M('#ff6f9a'), .22, .33, .12)); }
  scene.add(root);
  return { root, body, head, legs, arms, fm, vx: 0, vz: 0, yaw: 0, yawT: 0, mv: 0, phase: R() * 6, seed: R() * 9, hop: 0, hopV: 0, pop: 0, joy: 0, held: null, pose: null, t: 0 };
}
function hop(c, v = 3.2) { c.hopV = v; c.hop = .001; c.joy = 1.5; }
function animChar(c, dt, time) {
  const sp = Math.hypot(c.vx, c.vz), k = r => Math.min(1, dt * r);
  c.mv += ((sp > .15 ? 1 : 0) - c.mv) * k(10); c.phase += dt * sp * 4.6;
  if (sp > .15) c.yawT = Math.atan2(c.vx, c.vz);
  let d = c.yawT - c.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); c.yaw += d * k(11); c.root.rotation.y = c.yaw;
  if (c.hopV) { c.hopV -= 16 * dt; c.hop += c.hopV * dt; if (c.hop <= 0) { c.hop = 0; c.hopV = 0; c.pop = 1; } }
  c.pop = Math.max(0, c.pop - dt * 5); c.joy = Math.max(0, c.joy - dt);
  const s = Math.sin(c.phase), mv = c.mv;
  c.legs[0].rotation.x = s * .8 * mv; c.legs[1].rotation.x = -s * .8 * mv;
  let aL = -s * .7 * mv, aR = s * .7 * mv, zL = -.16, zR = .16;
  if (c.pose === 'cook') { aR = -1.15 + Math.sin(c.t * 9) * .3; zR = -.25 + Math.sin(c.t * 4.5) * .35; aL = -1.0; zL = .1 + Math.sin(c.t * 16) * .22; }
  else if (c.pose === 'give') { aR = -1.5; zR = -.1; }
  else if (c.pose === 'eat') { aR = -1.3; zR = -.12; }
  else if (c.held) { aR = -1.25 + s * .08 * mv; zR = -.05; }
  const a = k(14);
  c.arms[0].rotation.x += (aL - c.arms[0].rotation.x) * a; c.arms[1].rotation.x += (aR - c.arms[1].rotation.x) * a;
  c.arms[0].rotation.z += (zL - c.arms[0].rotation.z) * a; c.arms[1].rotation.z += (zR - c.arms[1].rotation.z) * a;
  c.body.position.y = Math.abs(s) * .05 * mv + c.hop;
  c.body.rotation.x = .1 * mv + (c.pose === 'cook' ? .12 : 0); c.body.rotation.z = s * .05 * mv + (c.pose === 'cook' ? Math.sin(c.t * 4.5) * .04 : 0);
  c.body.scale.set(1 + c.pop * .08, 1 + Math.sin(time * 2.2 + c.seed) * .012 - c.pop * .1, 1 + c.pop * .08);
  c.head.rotation.z = -s * .05 * mv; c.head.rotation.y = Math.sin(time * .7 + c.seed) * .18 * (1 - mv) * (c.pose ? 0 : 1);
  if (c.pose !== 'eat') c.head.rotation.x = c.pose === 'cook' ? .22 : 0;
  if (c.body.userData.tail) c.body.userData.tail.rotation.z = Math.sin(c.phase - 1) * .25 * mv;
  const ex = c.pose === 'eat' ? 'eat' : c.joy > 0 ? 'happy' : (time * .7 + c.seed) % 4 < .12 ? 'blink' : 'normal';
  if (c.fm.map !== FACES[ex]) c.fm.map = FACES[ex];
}

// ---------- build the scene ----------
const stall = makeStall(-3.6, -1, { name: 'ลูกชิ้นปิ้ง', cols: ['#e85d4a', '#ffe9c9'], price: 'ไม้ละ 10฿', kind: 'meatball' });
makeStall(3.6, -1, { name: 'กระทงทำมือ', cols: ['#f48fb1', '#fff0f5'], price: 'ใบละ 40฿', kind: 'krathong' });
const vendor = makeChar({ ...randLook(), shirt: '#d96a6a', apron: '#fff6e0', style: 'bun' }); vendor.root.position.set(-3.6, 0, -1.55);
const vendor2 = makeChar({ ...randLook(), shirt: '#6a9ad9', apron: '#ffe0e6', style: 'short' }); vendor2.root.position.set(3.6, 0, -1.55);
for (const [x, z] of [[-8, 3], [8, 3], [-8, -4.6], [8, -4.6], [-3, 8.5], [4, 8.5]]) lampPost(x, z);
for (const [x, z, s] of [[-13, 1, 1.2], [13, 2, 1.3], [-12, 9, 1.1], [12, 10, 1.2], [-15, -4, 1], [15, -4, 1.1]]) tree(x, z, s);
bunting(new THREE.Vector3(-1.7, 2.95, -.2), new THREE.Vector3(1.7, 2.95, -.2), .35);
bunting(new THREE.Vector3(-7.5, 2.9, -4.6), new THREE.Vector3(8.5, 2.9, -4.6), .5);
// pier
scene.add(box(4, .16, 3.4, M('#8f6038'), 0, .0, -7.7)); for (const [px, pz] of [[-1.9, -9.3], [1.9, -9.3]]) { scene.add(cyl(.09, .09, 1.6, M('#5d3a20'), px, .3, pz, 8)); lantern(px, 1.3, pz, 1); }
warm(0, 1.6, -8.6, 14, 8);
const signP = mesh(new THREE.BoxGeometry(2.3, .5, .08), [M('#5d3a20'), M('#5d3a20'), M('#5d3a20'), M('#5d3a20'), new THREE.MeshStandardMaterial({ map: textTex('ท่าน้ำลอยกระทง', { px: 58 }), roughness: .8 }), M('#5d3a20')], 0, 1.75, -5.3); scene.add(signP, cyl(.05, .05, 1.6, M('#5d3a20'), -1, .8, -5.3, 8), cyl(.05, .05, 1.6, M('#5d3a20'), 1, .8, -5.3, 8));

const P = makeChar({ skin: '#ffe0c4', hair: '#4a2c1a', style: 'long', shirt: '#ffffff', bottom: '#9d7ad1', skirt: true, acc: 'bow' }); P.root.position.set(0, 0, 4.5); P.yaw = P.yawT = Math.PI;
const bots = [];
const ZONES = [() => new THREE.Vector3(rr(-9, 9), 0, rr(1.6, 8)), () => new THREE.Vector3(rr(-9, 9), 0, rr(-5, -3.2))];
for (let i = 0; i < 6; i++) { const b = makeChar(randLook()); b.zone = i % 2; b.root.position.copy(ZONES[b.zone]()); b.path = []; b.wait = rr(0, 3); b.speed = rr(1, 1.5); bots.push(b); }

// smoke pool
const smokes = [];
for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff0f0, transparent: true, opacity: 0, depthWrite: false })); m.userData = { life: 9, max: 1 }; scene.add(m); smokes.push(m); }
function puff(x, y, z) { const m = smokes.find(s => s.userData.life >= s.userData.max); if (!m) return; m.position.set(x, y, z); m.userData = { life: 0, max: rr(1, 1.8), vx: rr(-.1, .2) }; }

// ---------- input ----------
const keys = {};
const keyOf = e => { const c = e.code || ''; return c.startsWith('Key') ? c.slice(3).toLowerCase() : c.toLowerCase(); };
addEventListener('keydown', e => { const k = keyOf(e); keys[k] = true; if (k.startsWith('arrow')) e.preventDefault(); if (e.repeat) return; if (k === 'e') tryBuy(); if (k === 'f') tryEat(); });
addEventListener('keyup', e => keys[keyOf(e)] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
let zoom = .55, zoomS = .55;
addEventListener('wheel', e => { zoom = Math.max(0, Math.min(1, zoom + Math.sign(e.deltaY) * .08)); }, { passive: true });
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 2600); }

// ---------- buying ----------
const buy = { state: 'idle', t: 0, fly: null };
const SPOT = new THREE.Vector3(-3.6, 0, .35);
const nearStall = () => P.root.position.distanceTo(SPOT) < 1.7;
function tryBuy() { if (buy.state !== 'idle' || P.pose || !nearStall()) return; if (P.held) return toast('ถือลูกชิ้นอยู่แล้ว กด F กินก่อนนะ'); buy.state = 'walk'; }
const EAT_BASE = new THREE.Vector3(.24, .62, .3), EAT_DIR = new THREE.Vector3(-.24, .31, .12).normalize(), UP = new THREE.Vector3(0, 1, 0);
function tryEat() {
  if (!P.held || P.pose || buy.state !== 'idle') return; P.pose = 'eat'; P.t = 0;
  P.arms[1].remove(P.held); P.body.add(P.held); P.held.quaternion.setFromUnitVectors(UP, EAT_DIR); P.held.position.copy(EAT_BASE);
}
const tmp = new THREE.Vector3();
function updBuy(dt) {
  if (buy.state === 'idle') return; buy.t += dt;
  const pp = P.root.position;
  if (buy.state === 'walk') {
    tmp.copy(SPOT).sub(pp); const d = tmp.length();
    if (d < .08) { P.vx = P.vz = 0; P.yawT = Math.PI; buy.state = 'cook'; buy.t = 0; vendor.pose = 'cook'; vendor.t = 0; toast('แม่ค้า: รอแป๊บนะจ๊ะ'); }
    else { tmp.multiplyScalar(2.2 / d); P.vx = tmp.x; P.vz = tmp.z; pp.x += P.vx * dt; pp.z += P.vz * dt; }
  } else if (buy.state === 'cook') {
    vendor.t += dt; if (R() < dt * 12) puff(-3.6 + rr(-.6, .4), 1, -.9);
    stall.userData.skewers.forEach((s, i) => { s.rotation.z = Math.sin(buy.t * 10 + i) * .12; });
    if (buy.t > 2.6) { buy.state = 'give'; buy.t = 0; vendor.pose = 'give'; buy.fly = makeSkewer(); scene.add(buy.fly); stall.userData.skewers[2].visible = false; }
  } else if (buy.state === 'give') {
    const u = ease(buy.t / .7); P.arms[1].userData.hand.getWorldPosition(tmp);
    buy.fly.position.set(-3.5, 1.0, -.9).lerp(tmp, u); buy.fly.position.y += Math.sin(u * Math.PI) * .45; buy.fly.rotation.x = (1 - u) * 1.2;
    if (buy.t > .7) { scene.remove(buy.fly); holdSkewer(P); hop(P); hop(vendor, 2); vendor.pose = null; buy.state = 'idle'; stall.userData.skewers[2].visible = true; toast('ได้ลูกชิ้นปิ้งแล้ว กด F เพื่อกิน'); }
  }
}
function holdSkewer(c) { const s = makeSkewer(); s.position.set(0, -.3, 0); s.rotation.x = Math.PI * .5 + 1.25; c.arms[1].add(s); c.held = s; }

// ---------- update ----------
let time = 0;
function collide(pos, nx, nz) {
  const hit = (x, z) => x < -11.5 || x > 11.5 || z > 10 || z < -5.4 || BOXES.some(b => x > b[0] - .3 && x < b[1] + .3 && z > b[2] - .3 && z < b[3] + .3);
  if (!hit(nx, pos.z)) pos.x = nx; if (!hit(pos.x, nz)) pos.z = nz;
}
function update(dt) {
  time += dt;
  // player
  if (buy.state === 'idle' && P.pose !== 'eat') {
    const ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    const l = Math.hypot(ix, iz) || 1, a = Math.min(1, dt * 12);
    P.vx += (ix / l * 2.6 - P.vx) * a; P.vz += (iz / l * 2.6 - P.vz) * a;
    collide(P.root.position, P.root.position.x + P.vx * dt, P.root.position.z + P.vz * dt);
  } else if (P.pose === 'eat') { P.vx = P.vz = 0; P.t += dt; const bite = Math.max(0, Math.sin(P.t * 9)); P.held.position.copy(EAT_BASE).addScaledVector(EAT_DIR, bite * .05 - .04); P.head.rotation.x = bite * .12; if (P.t > 1.6) { P.pose = null; P.body.remove(P.held); P.held = null; hop(P, 2.6); toast('อร่อย~'); } }
  updBuy(dt);
  // bots
  for (const b of bots) {
    b.vx = b.vz = 0;
    if (b.wait > 0) { b.wait -= dt; }
    else if (!b.path.length) { const nz = R() < .35 ? 1 - b.zone : b.zone; if (nz !== b.zone) b.path.push(new THREE.Vector3(rr(-.9, .9), 0, b.zone ? -3 : 1.4), new THREE.Vector3(rr(-.9, .9), 0, b.zone ? 1.4 : -3)); b.zone = nz; b.path.push(ZONES[nz]()); }
    else { tmp.copy(b.path[0]).sub(b.root.position); const d = tmp.length(); if (d < .1) { b.path.shift(); if (!b.path.length) { b.wait = rr(2, 6); if (b.zone) b.yawT = Math.PI; } } else { tmp.multiplyScalar(b.speed / d); b.vx = tmp.x; b.vz = tmp.z; b.root.position.addScaledVector(tmp, dt); } }
    animChar(b, dt, time);
  }
  const all = [P, ...bots];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i].root.position, b = all[j].root.position, dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
    if (d < .62 && d > .001) { const push = (.62 - d) / d * .5, lockA = i === 0 && buy.state !== 'idle'; if (!lockA) { a.x -= dx * push; a.z -= dz * push; } b.x += dx * push * (lockA ? 2 : 1); b.z += dz * push * (lockA ? 2 : 1); }
  }
  animChar(P, dt, time); animChar(vendor, dt, time); animChar(vendor2, dt, time);
  // ambience
  stall.userData.coal.material.emissiveIntensity = 1.6 + Math.sin(time * 11) * .35;
  if (R() < dt * 2) puff(-3.6 + rr(-.6, .4), 1, -.9);
  for (const s of smokes) { const u = s.userData; if (u.life < u.max) { u.life += dt; const k = u.life / u.max; s.position.y += dt * .7; s.position.x += u.vx * dt; s.scale.setScalar(1 + k * 2.2); s.material.opacity = .28 * (1 - k); } else s.material.opacity = 0; }
  for (const k of krathongs) { k.position.x += k.userData.v * dt; if (k.position.x > 46) k.position.x = -46; k.position.y = -.26 + Math.sin(time * 1.5 + k.userData.s) * .02; k.rotation.z = Math.sin(time + k.userData.s) * .05; }
  for (const m of skyLanterns) { m.position.y += dt * .5; m.position.x -= dt * .2; if (m.position.y > 60) m.position.y = 6; }
  // camera follow
  const pp = P.root.position; zoomS += (zoom - zoomS) * Math.min(1, dt * 6);
  const L = (a, b) => a + (b - a) * zoomS;
  tmp.set(pp.x * .8, L(3.6, 12.5), pp.z + L(8, 9.5)); camera.position.lerp(tmp, Math.min(1, dt * 4));
  camera.lookAt(camera.position.x * .96, 1, camera.position.z - L(8, 9.5) - L(4.5, 0));
  moonLight.target.position.set(pp.x, 0, pp.z); moonLight.target.updateMatrixWorld();
  // prompt
  const el = $('prompt'), show = buy.state === 'idle' && !P.pose && nearStall() && !P.held;
  el.style.display = show ? 'block' : 'none'; if (show && !el.innerHTML) el.innerHTML = '<kbd>E</kbd>ซื้อลูกชิ้นปิ้ง (ไม้ละ 10฿)';
}
camera.position.set(0, 8.5, 13.4);
const timer = new THREE.Timer(); timer.connect(document);
renderer.setAnimationLoop(() => { timer.update(); update(Math.min(Math.max(timer.getDelta(), 0), .05)); composer.render(); });
window.G3 = { P, vendor, bots, keys, buy, tryBuy, tryEat, step(n) { for (let i = 0; i < n; i++) update(1 / 30); composer.render(); } };
