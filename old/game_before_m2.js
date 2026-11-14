'use strict';
// ============================================================
//  งานวัดลอยกระทง (ยุคโบราณ) — หลายฉาก: ตลาด / ท่าน้ำ  (โบสถ์: ยังไม่ได้ทำ)
//  ภาพทั้งหมดมาจาก assets.js (สร้างด้วย tools/gen_assets.py)
// ============================================================
let VIEW_H = 620;
const BGS = 1.5, RS = 2, CS = META.cs;
const cv = document.getElementById('game'), g = cv.getContext('2d');
const dark = document.createElement('canvas'), dg = dark.getContext('2d');
let sc = 1, vw = 1280, camL = 0, camT = 0, time = 0, started = false;
const cam = { x: 1180, y: 900 };
const R = Math.random, rr = (a, b) => a + R() * (b - a), pick = a => a[R() * a.length | 0];
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
const F = (px, w = 600) => `${w} ${px}px Mali, "Leelawadee UI", sans-serif`;
const $ = id => document.getElementById(id);
function seeded(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(320, innerWidth * dpr); cv.height = Math.max(240, innerHeight * dpr);
  sc = cv.height / VIEW_H; vw = cv.width / sc; dark.width = Math.ceil(cv.width / 2); dark.height = Math.ceil(cv.height / 2);
}
addEventListener('resize', resize); resize();
addEventListener('wheel', e => { VIEW_H = Math.max(460, Math.min(900, VIEW_H + Math.sign(e.deltaY) * 40)); resize(); }, { passive: true });

// ---------- เสียง (สังเคราะห์เอง ไม่ใช้ไฟล์เสียง) ----------
let AC = null, master = null, muted = false, amb = null;
function audioInit() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .5; master.connect(AC.destination); } catch (e) { AC = null; } }
function tone(f, t0, d, type = 'sine', v = .2, f2) {
  if (!AC || muted) return; const o = AC.createOscillator(), g2 = AC.createGain(), t = AC.currentTime + t0;
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(v, t + .012); g2.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g2); g2.connect(master); o.start(t); o.stop(t + d + .05);
}
function noise(t0, d, v = .15, freq = 1200, q = 1) {
  if (!AC || muted) return; const n = AC.sampleRate * d | 0, buf = AC.createBuffer(1, n, AC.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g2 = AC.createGain(); s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g2.gain.value = v; s.connect(f); f.connect(g2); g2.connect(master); s.start(AC.currentTime + t0);
}
const SFX = {
  buy() { tone(660, 0, .12, 'triangle', .18); tone(880, .09, .18, 'triangle', .18); },
  eat() { noise(0, .08, .2, 1800, 2); noise(.35, .08, .18, 1500, 2); noise(.7, .08, .16, 1700, 2); },
  coin() { tone(1568, 0, .5, 'sine', .16); tone(2093, .04, .6, 'sine', .1); },
  bell() { tone(523, 0, 1.6, 'sine', .2); tone(1046, 0, 1.2, 'sine', .07); tone(784, .02, 1.4, 'sine', .06); },
  plop() { tone(420, 0, .22, 'sine', .22, 140); noise(.02, .3, .08, 700, .8); tone(1320, .25, .7, 'sine', .08); },
  boom() { noise(0, .5, .09, 220, .6); noise(.12, .7, .04, 2400, .7); },
  ride() { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .09, .16, 'square', .06)); },
  door() { noise(0, .35, .06, 500, .7); },
  step() { noise(0, .05, .03, 400, 1); },
  woof() { tone(320, 0, .13, 'sawtooth', .13, 150); noise(0, .1, .08, 500, 1); tone(300, .2, .13, 'sawtooth', .12, 140); noise(.2, .1, .07, 500, 1); },
  meow() { tone(620, 0, .18, 'triangle', .12, 900); tone(900, .16, .32, 'triangle', .12, 520); },
  water() { tone(900, 0, .5, 'sine', .05, 1400); noise(0, .5, .04, 3000, 1); },
};
const sfx = n => { if (SFX[n]) SFX[n](); };
function startAmbient() {
  if (!AC || amb) return; const n = AC.sampleRate * 2, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(); amb = AC.createGain(); s.buffer = buf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 600; amb.gain.value = 0; s.connect(f); f.connect(amb); amb.connect(master); s.start();
  setInterval(() => {
    if (!cur || muted || document.hidden) return; amb.gain.setTargetAtTime(cur.name === 'pier' ? .06 : .012, AC.currentTime, .8);
    if (cur.name !== 'temple') { if (Math.random() < .7) for (let i = 0; i < 3; i++) tone(4300 + Math.random() * 300, i * .07, .05, 'sine', .012); }
    else if (Math.random() < .08) tone(392, 0, 2.2, 'sine', .04);
  }, 1300);
}
function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : .5; $('mute').textContent = muted ? 'เสียง: ปิด (M)' : 'เสียง: เปิด (M)'; }

// ---------- ฉาก: ตัวแปรชุดนี้ชี้ไปที่ฉากปัจจุบัน ----------
let W = 3500, H = 1480, ents = [], lights = [], RECTS = [], STRINGS = [], stalls = [], bots = [], N = {}, STALL = {}, cur = null;
const SCENES = {};
function beginScene(w, h) { W = w; H = h; ents = []; lights = []; RECTS = []; STRINGS = []; stalls = []; bots = []; N = {}; STALL = {}; }
function endScene(sc0) { SCENES[sc0.name] = Object.assign(sc0, { W, H, ents, lights, RECTS, STRINGS, stalls, bots, N, STALL }); cur = sc0; for (let i = 0; i < sc0.nBots; i++) bots.push(spawnBot({}, true)); }
function useScene(s) { cur = s; ({ W, H, ents, lights, RECTS, STRINGS, stalls, bots, N, STALL } = s); }
function enterScene(name, x, y, dir = 'up') {
  const f = $('fade'); f.style.transition = 'none'; f.style.opacity = 1;
  sfx('door'); useScene(SCENES[name]); Object.assign(P, { x, y, dir, path: [], task: null, pose: null, busy: 0, vx: 0, vy: 0, duckT: 0 }); cam.x = x; cam.y = y - 62;
  $('sceneName').textContent = cur.title; setTimeout(() => { f.style.transition = 'opacity .6s'; f.style.opacity = 0; }, 60);
}

// ---------- sprites ----------
const SPR = {};
function loadAssets() {
  return Promise.all(Object.entries(ASSETS).map(([k, a]) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { const c = document.createElement('canvas'); c.width = Math.ceil(a.w * a.s * RS); c.height = Math.ceil(a.h * a.s * RS); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); SPR[k] = { cv: c, ax: a.ax * a.s, ay: a.ay * a.s, w: a.w * a.s, h: a.h * a.s }; res(); };
    img.onerror = () => rej(new Error('โหลดภาพไม่ได้: ' + k));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(a.svg);
  })));
}
function spr(c, name, x, y, o) {
  const s = SPR[name]; if (!s) return;
  if (!o) { c.drawImage(s.cv, x - s.ax, y - s.ay, s.w, s.h); return; }
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); const k = o.k || 1; c.scale((o.flip ? -1 : 1) * (o.sx || 1) * k, (o.sy || 1) * k);
  c.drawImage(s.cv, -s.ax, -s.ay, s.w, s.h); c.restore();
}
function ell(c, x, y, rx, ry, f) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = f; c.fill(); }
function label(c, s, x, y, px, col, w = 600, outline) {
  c.font = F(px, w); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (outline) { c.lineWidth = px / 4; c.strokeStyle = outline; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y);
}
function tag(c, cx, cy, txt) {
  c.font = F(16, 700); const w = c.measureText(txt).width + 16;
  c.beginPath(); c.roundRect(cx - w / 2, cy - 14, w, 28, 6); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#33211f'; c.lineWidth = 2; c.stroke();
  label(c, txt, cx, cy + 1, 16, '#6b3a1e', 700);
}
function board(c, cx, cy, txt, px = 22) {
  c.font = F(px, 700); const w = c.measureText(txt).width + 28, h = px + 18;
  c.beginPath(); c.roundRect(cx - w / 2, cy - h / 2, w, h, 7); c.fillStyle = '#8a5a34'; c.fill(); c.strokeStyle = '#33211f'; c.lineWidth = 3.5; c.stroke();
  label(c, txt, cx, cy + 1, px, '#fff1cc', 700);
}
function bubble(c, x, y, t) {
  c.font = F(15, 600); const w = c.measureText(t).width + 22;
  c.beginPath(); c.roundRect(x - w / 2, y - 15, w, 30, 13); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#33211f'; c.lineWidth = 2.5; c.stroke();
  label(c, t, x, y + 1, 15, '#5a3519');
}

// ---------- characters ----------
function mkChar(x, y, ci) { return { x, y, ci, dir: 'down', phase: R() * 6, seed: R() * 10, moving: false, pose: null, held: null, lit: false, kr: 'leaf', path: [], task: null, speed: 90, wait: 0, mv: 0, turn: 0, hop: 0, hopV: 0, joy: 0, pop: 0, duck: 0, duckT: 0, pdir: 'down' }; }
function animChar(c, dt) {
  const k = r => Math.min(1, dt * r);
  c.mv += ((c.moving ? 1 : 0) - c.mv) * k(12); c.duck += ((c.duckT || 0) - c.duck) * k(7);
  if (c.pdir !== c.dir) { c.pdir = c.dir; c.turn = 1; }
  c.turn = Math.max(0, c.turn - dt * 7);
  if (c.hopV) { c.hopV += 620 * dt; c.hop += c.hopV * dt; if (c.hop >= 0) { c.hop = 0; c.hopV = 0; c.pop = 1; } }
  c.joy = Math.max(0, c.joy - dt); c.pop = Math.max(0, c.pop - dt * 5);
}
function cheer(c, hop = 150) { if (META.cast[c.ci].monk) return; if (hop) { c.hopV = -hop; c.hop = -.01; } c.joy = 1.4; }
function drawChar(c, ch) {
  const m = META.cast[ch.ci], x = ch.x, y = ch.y, mv = ch.mv;
  let view = ch.dir === 'up' ? 'b' : ch.dir === 'down' ? 'f' : 's', flip = ch.dir === 'left', pose = 'stand';
  if (ch.pose === 'eat' || ch.pose === 'up' || ch.pose === 'wai') { pose = ch.pose; view = 'f'; flip = false; }
  else if (ch.joy > 0 && !ch.moving && !m.monk && ch.held !== 'krathong' && ch.duck < .1) { pose = 'up'; view = 'f'; flip = false; }
  else if (ch.held === 'krathong') pose = 'hold';
  let name = `c${ch.ci}_${view}_${pose}`; if (!SPR[name]) { name = `c${ch.ci}_${view}_stand`; pose = 'stand'; }
  const kn = ch.duck > .5 && view === 'b' && !!SPR[`c${ch.ci}_b_kneel`]; if (kn) name = `c${ch.ci}_b_${ch.duck > 1.45 ? 'bow' : 'kneel'}`;
  const sw = Math.sin(ch.phase), bob = Math.abs(sw) * 3 * mv + Math.sin(time * 2.2 + ch.seed) * .6 * (1 - mv);
  const wk = mv > .3 ? (sw > 0 ? 1 : 2) : 0, sgn = flip ? -1 : 1, yy = y + ch.hop, ub = yy - bob + (kn ? 0 : ch.duck * 13);
  if (!ch.noShadow) { const s = 1 + ch.hop / 45; ell(c, x, y + 1, 24 * s, 6 * s, 'rgba(20,10,40,.3)'); }
  if (!ch.noLegs && !kn) spr(c, `c${ch.ci}_legs${wk}`, x, yy, { flip, sy: 1 - ch.duck * .5 });
  const kr = ch.held === 'krathong' ? ch.kr : null, ky = ub - 58 * CS;
  if (kr && view === 'b' && !ch.hideItem) drawKr(c, kr, x, ky, .6, ch.lit);
  spr(c, name, x, ub, { flip, rot: (view === 's' ? sgn * .05 : sw * .04) * mv, sx: (1 - Math.sin(ch.turn * Math.PI) * .2) * (1 + ch.pop * .08), sy: 1 + Math.cos(ch.phase * 2) * .02 * mv - ch.pop * .1 + Math.sin(time * 2.2 + ch.seed) * .008 });
  if (ch.hideItem) return;
  if (kr && view !== 'b') drawKr(c, kr, x + (view === 's' ? sgn * 8 : 0), ky, .6, ch.lit);
  else if (ch.held && !kr) {
    const it = ITEMS[ch.held].spr, pk = 1 + Math.max(0, ch.joy - 1.1) * 1.5;
    let ix, iy, rot = 0;
    if (pose === 'eat') { ix = x + 44 * CS - Math.max(0, Math.sin(time * 9)) * 5; iy = ub - 150 * CS; rot = -.5; }
    else if (pose === 'up') { ix = x + 72 * CS; iy = ub - 166 * CS; }
    else { ix = x + sgn * 56 * CS * (view === 's' ? .3 : 1); iy = ub - 60 * CS + sw * 1.5 * mv; }
    spr(c, it, ix, iy, { rot, k: pk });
    if (ch.held === 'pinwheel') spr(c, 'pin_blades', ix, iy - 31, { rot: time * (2.5 + mv * 10) + ch.seed });
  }
}

// ---------- world helpers ----------
function addLight(x, y, r, a = 1) { lights.push({ x, y, r, a }); }
function prop(name, x, y, lt) { if (lt) for (const [dx, dy, r, a] of lt) addLight(x + dx, y + dy, r, a); const amp = SWAY[name] || 0, e = { x, y, w: SPR[name].w, draw(c) { ell(c, x, y + 2, SPR[name].w * .22, 7, 'rgba(20,10,40,.28)'); if (amp) spr(c, name, x, y, { rot: (Math.sin(time * (amp > .02 ? 1.3 : .8) + x * .013) + Math.sin(time * 2.9 + x * .02) * .35) * amp }); else spr(c, name, x, y); if (name === 'torch') flame(c, x, y - 76, 2.1); } }; ents.push(e); return e; }
const SWAY = { tree1: .012, tree2: .013, palm: .03, banana: .04, lamp: .008 };
function lamp(x, y) { return prop('lamp', x, y, [[32, -138, 210, 1], [10, -8, 150, .6]]); }
const BULB = ['#ffe08a', '#ff9db5', '#9fd8ff', '#c4f5a6'];
function addString(x1, y1, x2, y2, sag = 30) { STRINGS.push([x1, y1, x2, y2, sag]); const n = Math.max(1, Math.round((x2 - x1) / 240)); for (let i = 0; i < n; i++) addLight(lerp(x1, x2, (i + .5) / n), lerp(y1, y2, (i + .5) / n) + sag + 40, 130, .5); }
const node = (k, x, y) => N[k] = { k, x, y, adj: [] }, link = (a, b) => { N[a].adj.push(N[b]); N[b].adj.push(N[a]); };
function nearest(x, y) { let best = null, bd = 1e9; for (const k in N) { const n = N[k], d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd && !n.exit) { bd = d; best = n; } } return best; }
function route(b, target, final) {
  const from = nearest(b.x, b.y), to = N[target], prev = new Map([[from, null]]), q = [from];
  while (q.length) { const n = q.shift(); if (n === to) break; for (const m of n.adj) if (!prev.has(m)) { prev.set(m, n); q.push(m); } }
  const out = []; for (let n = to; n; n = prev.get(n)) out.unshift(n);
  b.path = out.map(n => n.exit || n.tight ? { x: n.x + (n.exit ? 0 : b.jx * .4), y: n.y } : { x: n.x + b.jx, y: n.y + b.jy });
  if (final) b.path.push(final);
}
function ground(b, rnd, y0, lanes) {
  const gr = b.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, '#8d6b5c'); gr.addColorStop(1, '#6f5357'); b.fillStyle = gr; b.fillRect(0, y0, W, H - y0);
  for (let i = 0; i < W / 22; i++) ell(b, rnd() * W, y0 + 30 + rnd() * (H - y0 - 40), 40 + rnd() * 90, 10 + rnd() * 16, `rgba(40,20,30,${.04 + rnd() * .05})`);
  for (const y of lanes) for (let x = 60; x < W; x += 90) ell(b, x + rnd() * 40, y + rnd() * 30 - 15, 80, 34, 'rgba(255,225,190,.07)');
  for (let i = 0; i < W / 17; i++) { const x = rnd() * W, y = y0 + 50 + rnd() * (H - y0 - 70); if (lanes.some(l => Math.abs(y - l) < 60)) continue; b.strokeStyle = '#4f8a52'; b.lineWidth = 3.2; b.lineCap = 'round'; b.beginPath(); b.moveTo(x - 7, y); b.quadraticCurveTo(x - 5, y - 10, x - 9, y - 15); b.moveTo(x, y); b.quadraticCurveTo(x, y - 12, x + 2, y - 19); b.moveTo(x + 7, y); b.quadraticCurveTo(x + 5, y - 10, x + 11, y - 15); b.stroke(); }
  for (let i = 0; i < W / 36; i++) { const x = rnd() * W, y = y0 + 50 + rnd() * (H - y0 - 70); ell(b, x, y, 7 + rnd() * 6, 4 + rnd() * 3, '#a58c84'); b.lineWidth = 2; b.strokeStyle = '#33211f'; b.stroke(); }
}
function sky(b, rnd, h, mx, my) {
  let gr = b.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0f0d30'); gr.addColorStop(1, '#2f2466'); b.fillStyle = gr; b.fillRect(0, 0, W, h + 10);
  for (let i = 0; i < W / 12; i++) ell(b, rnd() * W, rnd() * h * .65, rnd() * 1.3 + .4, rnd() * 1.3 + .4, `rgba(255,255,255,${.3 + rnd() * .6})`);
  gr = b.createRadialGradient(mx, my, 20, mx, my, 150); gr.addColorStop(0, 'rgba(230,225,255,.4)'); gr.addColorStop(1, 'rgba(230,225,255,0)'); b.fillStyle = gr; b.fillRect(mx - 150, my - 150, 300, 300);
  ell(b, mx, my, 32, 32, '#fbf6e6'); b.lineWidth = 4; b.strokeStyle = '#33211f'; b.stroke();
}
function newBG() { const bg = document.createElement('canvas'); bg.width = W * BGS; bg.height = H * BGS; const b = bg.getContext('2d'); b.scale(BGS, BGS); return [bg, b]; }

// ---------- queues ----------
class Line {
  constructor(o) { Object.assign(this, o); this.members = []; this.occ = o.spots.map(() => null); }
  full() { return this.members.length >= this.max; }
  join(c) { this.members.push(c); c.task = { line: this, state: 'wait', i: -1 }; c.path = []; }
  leave(c) { const i = this.members.indexOf(c); if (i >= 0) this.members.splice(i, 1); c.task = null; c.path = []; }
  release(i) { const c = this.occ[i]; this.occ[i] = null; if (c) { c.task = null; c.pose = null; } return c; }
  update() {
    for (let i = 0; i < this.spots.length; i++) if (!this.occ[i] && this.members.length && this.ready()) { const c = this.members.shift(); this.occ[i] = c; c.task.state = 'go'; c.task.spot = i; c.path = this.approach ? this.approach(c, i) : [this.spots[i]]; }
    this.members.forEach((c, i) => { if (c.task.i !== i) { c.task.i = i; c.path = [this.slot(i)]; } else if (!c.path.length) c.dir = this.face; });
  }
}

// ---------- items & stalls ----------
const ITEMS = {
  kanom: { name: 'ขนมไทย', edible: true, verb: 'กิน', spr: 'it_kanom' },
  drink: { name: 'น้ำตาลสด', edible: true, verb: 'ดื่ม', spr: 'it_drink' },
  krathong: { name: 'กระทง', spr: 'it_krathong' },
  lantern: { name: 'โคมกระดาษ', spr: 'it_lantern' },
  sangha: { name: 'ชุดสังฆทาน', spr: 'it_sangha' },
  khaolam: { name: 'ข้าวหลาม', edible: true, verb: 'กิน', spr: 'it_khaolam' },
  fruit: { name: 'มะม่วงสุก', edible: true, verb: 'กิน', spr: 'it_fruit' },
  pinwheel: { name: 'กังหันลม', spr: 'it_pinstick' },
  krok: { name: 'ขนมครก', edible: true, verb: 'กิน', spr: 'it_krok' },
  noodle: { name: 'ก๋วยเตี๋ยว', edible: true, verb: 'กิน', spr: 'it_noodle' },
  corn: { name: 'ข้าวโพดปิ้ง', edible: true, verb: 'กิน', spr: 'it_corn' },
  coco: { name: 'มะพร้าวน้ำหอม', edible: true, verb: 'ดื่ม', spr: 'it_coco' },
  garland: { name: 'พวงมาลัย', spr: 'it_garland' },
  fishtoy: { name: 'ปลาตะเพียนสาน', spr: 'it_fish' },
};
function makeStall(d) {
  const { cx, by } = d;
  const s = Object.assign({ x: cx, y: by, w: 170, anim: 'idle', t: 0, say: '', sayT: 0 }, d);
  s.vendor = mkChar(cx, by - 30, d.vendor); s.vendor.noLegs = s.vendor.noShadow = s.vendor.hideItem = true;
  s.line = new Line({ spots: [{ x: cx, y: by + 34 }], slot: i => ({ x: cx, y: by + 78 + 44 * i }), max: 3, face: 'up', ready: () => s.anim === 'idle' });
  s.draw = c => drawStall(c, s);
  addLight(cx, by - 70, 250, 1); addLight(cx - 122, by - 110, 110, .8); addLight(cx + 122, by - 110, 110, .8); addLight(cx, by + 40, 190, .7);
  RECTS.push([cx - 132, by - 150, cx + 132, by + 6]);
  s.steam = ['corn', 'khaolam', 'noodle', 'krok'].includes(d.kind);
  STALL[d.id] = s; stalls.push(s); ents.push(s);
}
function say(s, t) { s.say = t; s.sayT = 2.2; }
function give(c, id) {
  cheer(c, c === P ? 150 : 110); if (c === P) sfx('buy');
  for (let i = 0; i < 5; i++) parts.push({ type: 'spark', x: c.x + rr(-22, 22), y: c.y - rr(30, 90), vx: rr(-14, 14), vy: rr(-30, -10), life: 0, max: rr(.4, .8) });
  if (id === 'krathong') c.kr = c.krPick || pick(KR_KINDS);
  if (c === P) { addItem(id); P.held = id; renderInv(); } else c.held = id;
}
function updStall(s, dt) {
  s.line.update(); s.sayT -= dt; const v = s.vendor, c = s.line.occ[0];
  if (started && !c && s.sayT < -6 && Math.hypot(P.x - s.cx, P.y - (s.by + 45)) < 115) { say(s, pick(['เชิญจ้ะ เชิญจ้ะ', 'รับอะไรดีจ๊ะ', 'แวะชมก่อนได้จ้ะ'])); v.joy = 1.2; }
  v.pose = null; v.y = s.by - 30;
  if (!c) { s.anim = 'idle'; return; }
  if (c.task.state === 'go') { if (!c.path.length) { c.task.state = 'serve'; c.dir = 'up'; s.anim = 'cook'; s.t = 0; say(s, pick(['รอประเดี๋ยวนะจ๊ะ', 'ได้เลยจ้ะ', 'สักครู่จ้ะ'])); } return; }
  s.t += dt;
  if (s.anim === 'cook') {
    v.held = (s.t * 4 | 0) % 2 ? 'krathong' : null; v.y = s.by - 30 + Math.abs(Math.sin(s.t * 9)) * 2.5;
    if (R() < dt * 6) parts.push({ type: 'spark', x: s.cx + rr(-60, 60), y: s.by - 84 + rr(-12, 6), vx: 0, vy: -14, life: 0, max: .6 });
    if (s.t > s.cook) { s.anim = 'hand'; s.t = 0; v.held = null; }
  } else if (s.anim === 'hand') {
    v.pose = 'up';
    if (s.t > .75) {
      give(c, s.item); s.line.release(0); s.anim = 'idle'; say(s, 'ได้แล้วจ้ะ'); v.joy = 1.2;
      if (c === P) toast(s.item === 'krathong' ? 'ได้กระทงแล้ว จะจุดธูปเทียนก่อน หรือไปต่อแถวลอยเลยก็ได้' : ITEMS[s.item].edible ? `ได้${ITEMS[s.item].name}แล้ว กด F เพื่อ${ITEMS[s.item].verb}` : `ได้${ITEMS[s.item].name}แล้ว ถือเดินส่องทางได้เลย`);
    }
  }
}
function drawStall(c, s) {
  const { cx, by } = s;
  ell(c, cx, by + 4, 134, 12, 'rgba(20,10,40,.3)');
  spr(c, 'stall_back', cx, by); drawChar(c, s.vendor); spr(c, 'stall_' + s.kind, cx, by);
  label(c, s.sign, cx, by - 185, 31, '#fff1cc', 700); tag(c, cx - 56, by - 50, s.price);
  if (s.anim === 'hand') { const u = ease(s.t / .7); spr(c, s.item === 'krathong' ? 'kr_' + ((s.line.occ[0] || {}).krPick || 'leaf') : ITEMS[s.item].spr, lerp(cx + 30, cx + 22, u), lerp(by - 96, by - 6, u) - Math.sin(u * Math.PI) * 26, { k: 1 + Math.sin(u * Math.PI) * .3 }); }
}

// ---------- หมาวัด แมววัด ----------
function addPet(list, kind, i, x, y) { const a = { pet: kind, i, x, y, hx: x, hy: y, tx: x, ty: y, flip: R() < .5, st: 'idle', t: rr(1, 4), phase: 0, joy: 0, follow: 0, w: 40 }; a.draw = c => drawPet(c, a); ents.push(a); list.push(a); }
function updPet(a, dt) {
  a.joy = Math.max(0, a.joy - dt); a.follow -= dt; a.t -= dt; let tx = a.tx, ty = a.ty, sp = a.pet === 'dog' ? 70 : 50;
  if (a.follow > 0) { tx = P.x + (P.dir === 'left' ? 50 : -50); ty = P.y + 10; sp = 170; a.st = Math.hypot(tx - a.x, ty - a.y) < 14 ? 'sit' : 'walk'; }
  else if (a.t <= 0) {
    if (a.st === 'walk') { a.st = pick(a.pet === 'cat' ? ['sit', 'sit', 'sleep', 'idle'] : ['sit', 'idle', 'idle']); a.t = a.st === 'sleep' ? rr(8, 16) : rr(3, 8); }
    else { a.st = 'walk'; a.t = 9; for (let k = 0; k < 8; k++) { const nx = a.hx + rr(-260, 260), ny = a.hy + rr(-130, 130); if (!blocked(nx, ny)) { a.tx = nx; a.ty = ny; break; } } tx = a.tx; ty = a.ty; }
  }
  if (a.st === 'walk') {
    const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (d < 6) { if (a.follow <= 0) { a.st = 'idle'; a.t = rr(1, 4); } }
    else { const nx = a.x + dx / d * sp * dt, ny = a.y + dy / d * sp * dt; if (a.follow > 0 || !blocked(nx, ny)) { a.x = nx; a.y = ny; } else { a.st = 'idle'; a.t = 1; } if (Math.abs(dx) > 3) a.flip = dx < 0; a.phase += dt * sp * .13; }
  }
}
function drawPet(c, a) {
  const fr = a.st === 'sleep' ? 'sleep' : a.st === 'sit' ? 'sit' : a.st === 'walk' ? (Math.sin(a.phase) > 0 ? 'a' : 'b') : 'a', nm = `${a.pet}${a.i}_${fr}`;
  const hop = a.joy > 0 ? -Math.abs(Math.sin(time * 12)) * (a.pet === 'dog' ? 13 : 5) : 0;
  ell(c, a.x, a.y + 1, 22, 5, 'rgba(20,10,40,.28)'); spr(c, SPR[nm] ? nm : `${a.pet}${a.i}_sit`, a.x, a.y + hop, { flip: a.flip });
  if (a.st === 'sleep') label(c, 'z', a.x + 20, a.y - 30 - (time * 9 % 14), 13, '#fff', 700, 'rgba(30,15,50,.8)');
}
const LEAVES = Array.from({ length: 34 }, () => ({ x: R() * 3000, y: R() * 2000, v: rr(40, 90), p: R() * 9, c: pick(['#e8b93c', '#d99a2b', '#8fd07a', '#c9772e']) }));

// ---------- particles ----------
const parts = [];
function updParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life > p.max) parts.splice(i, 1); } }
function smoke(x, y) { parts.push({ type: 'smoke', x, y, vx: rr(-5, 8), vy: rr(-30, -18), life: 0, max: rr(1.4, 2.2), r: rr(4, 7) }); }

// ---------- player & bots ----------
const P = mkChar(1180, 1000, 8); P.speed = 200; P.name = ''; P.busy = 0; P.dir = 'up'; P.vx = P.vy = 0;
function blocked(x, y) {
  if (x < 40 || x > W - 40 || y > H - 40) return true;
  if (cur.blocked(x, y)) return true;
  for (const r of RECTS) if (x > r[0] && x < r[2] && y > r[1] && y < r[3]) return true;
  return false;
}
function faceBy(c, dx, dy) {
  const horiz = c.dir === 'left' || c.dir === 'right';
  if (horiz ? Math.abs(dx) * 1.4 > Math.abs(dy) : Math.abs(dx) > Math.abs(dy) * 1.4) c.dir = dx > 0 ? 'right' : 'left'; else c.dir = dy > 0 ? 'down' : 'up';
}
function stepTo(c, tx, ty, dt, collide) {
  const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), st = c.speed * dt;
  if (d <= st + .01) { if (!collide || !blocked(tx, ty)) { c.x = tx; c.y = ty; } return true; }
  const nx = dx / d * st, ny = dy / d * st;
  if (collide) { let m = false; if (!blocked(c.x + nx, c.y)) { c.x += nx; m = Math.abs(nx) > st * .3 || m; } if (!blocked(c.x, c.y + ny)) { c.y += ny; m = Math.abs(ny) > st * .3 || m; } if (!m) return true; }
  else { c.x += nx; c.y += ny; }
  faceBy(c, dx, dy); c.moving = true; c.phase += dt * c.speed * .075; return false;
}
function follow(c, dt, collide) { if (c.path.length && stepTo(c, c.path[0].x, c.path[0].y, dt, collide)) c.path.shift(); }
const keys = {};
function updPlayer(dt) {
  P.moving = false;
  let ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0), iy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (!started) ix = iy = 0;
  if (P.task) { if (P.task.state === 'wait' && (ix || iy)) { P.task.line.leave(P); toast('ออกจากแถวแล้ว'); } else { follow(P, dt, false); return; } }
  if (P.busy > 0) { P.busy -= dt; if (P.busy <= 0) { P.pose = null; const f = P.busyDone; P.busyDone = null; if (f) f(); } return; }
  const l = Math.hypot(ix, iy) || 1, a = Math.min(1, dt * 14);
  P.vx += (ix / l * P.speed - P.vx) * a; P.vy += (iy / l * P.speed - P.vy) * a;
  const v = Math.hypot(P.vx, P.vy);
  if (ix || iy || v > 12) {
    if (ix || iy) { P.path = []; P.dir = ix ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up'); }
    if (!blocked(P.x + P.vx * dt, P.y)) P.x += P.vx * dt; else P.vx = 0;
    if (!blocked(P.x, P.y + P.vy * dt)) P.y += P.vy * dt; else P.vy = 0;
    P.moving = true; P.phase += dt * v * .075;
  } else { P.vx = P.vy = 0; follow(P, dt, true); }
}
function doBusy(pose, t, done) { if (pose === 'eat') sfx('eat'); P.pose = pose; P.busy = t; P.busyDone = done; P.path = []; P.vx = P.vy = 0; }
const WALKERS = META.cast.map((m, i) => m.vendor ? -1 : i).filter(i => i >= 0);
function spawnBot(b, initial) {
  const ks = Object.keys(N), n = initial ? N[pick(ks.filter(k => !N[k].exit && !N[k].noSpawn))] : N[pick(ks.filter(k => N[k].exit))];
  Object.assign(b, mkChar(n.x + rr(-20, 20), n.y + rr(-10, 20), pick(cur.walkers || WALKERS)), { speed: rr(64, 92), jx: rr(-34, 34), jy: rr(-30, 30), step: null, after: null });
  if (META.cast[b.ci].monk) b.speed = 58;
  b.plan = cur.plan(b, initial); return b;
}
function updBot(b, dt) {
  b.moving = false;
  if (b.task) { follow(b, dt, false); return; }
  if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0 && b.after) { const f = b.after; b.after = null; f(); } return; }
  if (b.path.length) { follow(b, dt, false); return; }
  if (b.step && b.step.arrive) { const f = b.step.arrive; b.step.arrive = null; f(); return; }
  const s = b.plan.shift(); if (!s) { spawnBot(b); return; } b.step = s;
  if (s.t === 'browse') { const sp = pick(cur.browse)(); route(b, sp.node, { x: sp.x, y: sp.y }); s.arrive = () => { b.dir = sp.dir; b.wait = rr(2.5, 7); }; }
  else if (s.t === 'buy') { const st = STALL[s.s]; route(b, st.node, null); s.arrive = () => { if (st.line.full() || b.held) b.wait = .5; else { b.krPick = pick(KR_KINDS); st.line.join(b); } }; }
  else if (s.t === 'eat') { if (b.held && ITEMS[b.held].edible) { b.pose = 'eat'; b.wait = 1.6; b.after = () => { b.pose = null; b.held = null; cheer(b, 0); }; } }
  else if (s.t === 'exit') { route(b, pick(Object.keys(N).filter(k => N[k].exit)), null); s.arrive = () => spawnBot(b); }
  else if (cur.step) cur.step(b, s);
}
function separate() {
  const all = [P, ...bots].filter(c => !c.task && !c.hidden && !(c === P && P.busy > 0));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dy = (b.y - a.y) * 1.6, d = Math.hypot(dx, dy);
    if (d < 40 && d > .01) { const k = (40 - d) / d * .5, wa = a === P ? .25 : 1; const ax = a.x - dx * k * wa, ay = a.y - dy / 1.6 * k * wa; if (a !== P || !blocked(ax, ay)) { a.x = ax; a.y = ay; } b.x += dx * k; b.y += dy / 1.6 * k; }
  }
}

// ---------- inventory / HUD ----------
const inv = [];
const hasItem = id => inv.find(i => i.id === id);
function addItem(id) { const s = hasItem(id); if (s) s.n++; else inv.push({ id, n: 1 }); renderInv(); }
function useItem(id) { const s = hasItem(id); if (!s) return; if (--s.n <= 0) { inv.splice(inv.indexOf(s), 1); if (P.held === id) P.held = null; if (id === 'krathong') P.lit = false; } renderInv(); }
function renderInv() {
  const bar = $('bar'); bar.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = inv[i], el = document.createElement('div'); el.className = 'slot' + (s && P.held === s.id ? ' on' : '');
    el.innerHTML = `<span class="k">${i + 1}</span>`;
    if (s) { const sp = SPR[s.id === 'krathong' ? 'kr_' + P.kr : ITEMS[s.id].spr], c = document.createElement('canvas'); c.width = c.height = 116; const k = Math.min(96 / sp.cv.width, 96 / sp.cv.height); const ic = c.getContext('2d'); ic.drawImage(sp.cv, 58 - sp.cv.width * k / 2, 58 - sp.cv.height * k / 2, sp.cv.width * k, sp.cv.height * k); if (s.id === 'pinwheel') ic.drawImage(SPR.pin_blades.cv, 58 - 34, 4, 68, 68); el.appendChild(c); const n = document.createElement('span'); n.className = 'n'; n.textContent = s.n > 1 ? '×' + s.n : ''; el.appendChild(n); el.title = ITEMS[s.id].name; }
    el.onclick = e => { e.stopPropagation(); toggleHold(i); }; bar.appendChild(el);
  }
  const h = P.held && ITEMS[P.held]; $('barHint').textContent = h ? `ถืออยู่: ${P.held === 'krathong' ? KR[P.kr].name : h.name}${P.held === 'krathong' ? (P.lit ? ' (จุดธูปเทียนแล้ว)' : ' (ยังไม่ได้จุดธูปเทียน)') : ''}${h.edible ? ` · กด F เพื่อ${h.verb}` : ''}` : '';
}
function toggleHold(i) { const s = inv[i]; if (!s || P.busy > 0 || P.task) return; P.held = P.held === s.id ? null : s.id; renderInv(); }
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 3000); }
function petInteract() {
  if (cur.pets) for (const a of cur.pets) if (Math.hypot(P.x - a.x, P.y - a.y) < 56) {
    const food = P.held && ITEMS[P.held].edible, nm = a.pet === 'dog' ? 'หมา' : 'แมว';
    return { label: food ? `แบ่ง${ITEMS[P.held].name}ให้${nm}` : `ลูบหัว${nm}`, act() {
      a.joy = 2.4; if (a.st === 'sleep') a.st = 'sit'; a.t = Math.max(a.t, 3); sfx(a.pet === 'dog' ? 'woof' : 'meow');
      for (let i = 0; i < 4; i++) parts.push({ type: 'heart', x: a.x + rr(-16, 16), y: a.y - 50, vx: rr(-10, 10), vy: rr(-30, -18), life: 0, max: 1.1 });
      if (food) { useItem(P.held); a.follow = 30; toast(`${nm}ชอบมาก จะเดินตามคุณสักพัก`); } else toast(a.pet === 'dog' ? 'หมากระดิกหาง ดีใจใหญ่' : 'แมวครางเบา ๆ อย่างพอใจ');
    } };
  }
  return null;
}
function findInteract() {
  if (P.task || P.busy > 0) return null;
  const pi = petInteract(); if (pi) return pi;
  for (const s of stalls) if (Math.hypot(P.x - s.cx, P.y - (s.by + 45)) < 95) return { label: `${s.buy} (${s.price})`, act() { if (s.limit1 && hasItem(s.item)) toast('มีกระทงอยู่แล้ว ลอยใบนี้ก่อนค่อยมาซื้อใหม่นะ'); else if (s.line.full()) toast('แถวร้านนี้ยาวอยู่ รอสักครู่นะ'); else if (s.item === 'krathong') openPicker(s); else s.line.join(P); } };
  return cur.interact();
}
let curI = null, promptTxt = '';
function updPrompt() {
  curI = started ? findInteract() : null; let t = '';
  if (curI) t = `<kbd>E</kbd>${curI.label}`;
  else if (P.task && P.task.state === 'wait') t = (P.task.line.name ? `${P.task.line.name} · คิวที่ ${P.task.i + 1}` : 'กำลังต่อแถว') + ' · กดปุ่มเดินเพื่อออกจากแถว';
  else if (P.task && P.task.sub >= 1) t = 'กำลังอธิษฐาน...';
  else if (P.task && P.task.ride) t = '<kbd>E</kbd>ลงจากเครื่องเล่น';
  if (t !== promptTxt) { promptTxt = t; const el = $('prompt'); el.innerHTML = t; el.style.display = t ? 'block' : 'none'; }
}
const keyOf = e => { const c = e.code || ''; return c.startsWith('Key') ? c.slice(3).toLowerCase() : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') && c.length === 7 ? c.slice(6) : c ? c.toLowerCase() : (e.key || '').toLowerCase(); };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; const k = keyOf(e); keys[k] = true; if (!started) return;
  if (k.startsWith('arrow') || k === 'space') e.preventDefault();
  if (e.repeat) return;
  if (k === 'm') toggleMute();
  if (k === 'e' && P.task && P.task.ride && cur.endRide) return cur.endRide();
  if (k === 'e' && curI) curI.act();
  if (k.length === 1 && k >= '1' && k <= '8') toggleHold(+k - 1);
  if (k === 'f' && P.held && ITEMS[P.held].edible && !P.task && P.busy <= 0) doBusy('eat', 1.5, () => { useItem(P.held); cheer(P, 90); for (let i = 0; i < 4; i++) parts.push({ type: 'heart', x: P.x + rr(-16, 16), y: P.y - 130, vx: rr(-10, 10), vy: rr(-30, -18), life: 0, max: 1.1 }); });
});
addEventListener('keyup', e => keys[keyOf(e)] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
cv.addEventListener('mousedown', e => { if (!started) return; const r = cv.getBoundingClientRect(), wx = camL + (e.clientX - r.left) / r.width * vw, wy = camT + (e.clientY - r.top) / r.height * VIEW_H; if (cur.click && cur.click(wx, wy)) return; if (P.task || P.busy > 0) return; P.path = [{ x: wx, y: wy }]; });
function openWish() { $('wish').style.display = 'flex'; $('wishText').value = ''; setTimeout(() => $('wishText').focus(), 30); }
function submitWish() { if (P.task && P.task.state === 'serve') P.task.wish = $('wishText').value.trim(); $('wish').style.display = 'none'; if (document.activeElement) document.activeElement.blur(); for (const k in keys) keys[k] = false; }
$('wishBtn').onclick = submitWish; $('wishText').addEventListener('keydown', e => { if (e.key === 'Enter') submitWish(); });

// ---------- กระทง: 4 แบบให้เลือก ----------
const KR = {
  leaf: { name: 'กระทงใบตอง', desc: 'แบบดั้งเดิม ใบตองพับ ร้อยดาวเรืองรอบขอบ' },
  lotus: { name: 'กระทงดอกบัว', desc: 'กลีบบัวชมพูซ้อนสองชั้นบนใบบัว' },
  gold: { name: 'กระทงสองชั้นมาลัยทอง', desc: 'สองชั้นปลายทอง ห้อยมาลัยมะลิ ปักธง' },
  coco: { name: 'กระทงกะลา', desc: 'กะลามะพร้าวใบเล็ก เรียบง่าย' },
}, KR_KINDS = Object.keys(KR);
function flame(c, x, y, k) {
  const f = 1 + Math.sin(time * 13 + x) * .14, w = 5 * k * f, h = 12 * k * f, tip = Math.sin(time * 9 + x) * 1.6 * k;
  ell(c, x, y - h * .5, 20 * k, 20 * k, 'rgba(255,190,90,.22)');
  c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - w * 1.7, y - h * .5, x - w * .6, y - h, x + tip, y - h * 1.6); c.bezierCurveTo(x + w * .6, y - h, x + w * 1.7, y - h * .5, x, y);
  c.fillStyle = '#ffb03a'; c.fill(); c.strokeStyle = '#e07a1e'; c.lineWidth = 1.5; c.stroke(); ell(c, x, y - h * .45, w * .5, h * .42, '#fff4b0');
}
function drawKr(c, kind, x, y, k, lit, rot) {
  spr(c, 'kr_' + kind, x, y, { k, rot });
  if (lit) { flame(c, x, y - 39 * k, k); ell(c, x - 11 * k, y - 43 * k, 1.8 * k, 1.8 * k, '#ff7a3a'); ell(c, x + 11 * k, y - 43 * k, 1.8 * k, 1.8 * k, '#ff7a3a'); }
}
function openPicker(s) {
  const list = $('pickList'); list.innerHTML = '';
  for (const k of KR_KINDS) {
    const d = document.createElement('div'); d.className = 'kcard'; const sp = SPR['kr_' + k], c = document.createElement('canvas'); c.width = 188; c.height = 132;
    c.getContext('2d').drawImage(sp.cv, 0, 0, 188, 132); d.appendChild(c); d.insertAdjacentHTML('beforeend', `<b>${KR[k].name}</b><span>${KR[k].desc}</span>`);
    d.onclick = () => { $('pick').style.display = 'none'; if (s.line.full()) return toast('แถวร้านนี้ยาวอยู่ รอสักครู่นะ'); P.krPick = k; s.line.join(P); };
    list.appendChild(d);
  }
  $('pick').style.display = 'flex';
}
$('pickCancel').onclick = () => $('pick').style.display = 'none';

// ============================================================ ฉากตลาด
function buildMarket() {
  beginScene(3500, 2360);
  const LOTX = [330, 670, 1010, 1350, 1690, 2030], ROWY = [620, 1080], GATES = [{ x: 520, name: 'โบสถ์' }, { x: 1860, name: 'ท่าน้ำ' }];
  const LX = [150, ...LOTX, 2350, 2700, 3000, 3440], BX = [150, 520, 1180, 1860, 2350, 3440];
  for (const [p, y] of [['m', 800], ['l', 1290]]) LX.forEach((x, i) => { node(p + x, x, y); if (i) link(p + LX[i - 1], p + x); });
  BX.forEach((x, i) => { node('b' + x, x, 335); if (i) link('b' + BX[i - 1], 'b' + x); });
  node('m1180', 1180, 800); node('l1180', 1180, 1290); link('m1010', 'm1180'); link('m1180', 'm1350'); link('l1010', 'l1180'); link('l1180', 'l1350');
  for (const x of [150, 1180, 2350, 3440]) { link('b' + x, 'm' + x); link('m' + x, 'l' + x); for (const p of 'bml') N[p + x].tight = true; }
  for (const gt of GATES) { node('g' + gt.x, gt.x, 262).exit = true; link('g' + gt.x, 'b' + gt.x); }
  const DX = [150, 500, 900, 1300, 1700, 2100, 2500], SXs = [300, 500, 1000, 1760, 2300, 2800, 3300];
  DX.forEach((x, i) => { node('d' + x, x, 1890); if (i) link('d' + DX[i - 1], 'd' + x); }); SXs.forEach((x, i) => { node('s' + x, x, 2262); if (i) link('s' + SXs[i - 1], 's' + x); });
  link('d150', 'l150'); link('d900', 'l1010'); link('d1700', 'l1690'); link('d2500', 'l2350'); node('br', 1760, 1935).tight = true; N.s1760.tight = true; link('br', 'd1700'); link('br', 's1760');
  const defs = [
    { id: 'kanom', kind: 'kanom', row: 0, lot: 1, sign: 'ขนมไทย', price: 'ห่อละ 1 อัฐ', item: 'kanom', cook: 2.4, buy: 'ซื้อขนมไทย', vendor: 11 },
    { id: 'drink', kind: 'drink', row: 0, lot: 3, sign: 'น้ำตาลสด', price: 'กระบอกละ 1 อัฐ', item: 'drink', cook: 2.0, buy: 'ซื้อน้ำตาลสด', vendor: 12 },
    { id: 'lantern', kind: 'lantern', row: 1, lot: 2, sign: 'โคมกระดาษ', price: 'ใบละ 2 อัฐ', item: 'lantern', cook: 2.2, buy: 'ซื้อโคมกระดาษ', vendor: 11 },
    { id: 'khaolam', kind: 'khaolam', row: 0, lot: 5, sign: 'ข้าวหลาม', price: 'กระบอกละ 1 อัฐ', item: 'khaolam', cook: 2.4, buy: 'ซื้อข้าวหลาม', vendor: 12 },
    { id: 'fruit', kind: 'fruit', row: 1, lot: 0, sign: 'ผลไม้', price: 'ลูกละ 1 อัฐ', item: 'fruit', cook: 1.8, buy: 'ซื้อมะม่วงสุก', vendor: 11 },
    { id: 'toy', kind: 'toy', row: 1, lot: 4, sign: 'กังหันลม', price: 'อันละ 1 อัฐ', item: 'pinwheel', cook: 2.0, buy: 'ซื้อกังหันลม', vendor: 12 },
    { id: 'krok', kind: 'krok', row: 0, lot: 0, sign: 'ขนมครก', price: 'กระทงละ 1 อัฐ', item: 'krok', cook: 2.6, buy: 'ซื้อขนมครก', vendor: 11 },
    { id: 'noodle', kind: 'noodle', row: 0, lot: 2, sign: 'ก๋วยเตี๋ยว', price: 'ชามละ 2 อัฐ', item: 'noodle', cook: 2.8, buy: 'ซื้อก๋วยเตี๋ยว', vendor: 12 },
    { id: 'corn', kind: 'corn', row: 0, lot: 4, sign: 'ข้าวโพดปิ้ง', price: 'ฝักละ 1 อัฐ', item: 'corn', cook: 2.4, buy: 'ซื้อข้าวโพดปิ้ง', vendor: 11 },
    { id: 'coco', kind: 'coco', row: 1, lot: 1, sign: 'มะพร้าวน้ำหอม', price: 'ลูกละ 1 อัฐ', item: 'coco', cook: 1.8, buy: 'ซื้อมะพร้าวน้ำหอม', vendor: 12 },
    { id: 'garland', kind: 'garland', row: 1, lot: 3, sign: 'พวงมาลัย', price: 'พวงละ 1 อัฐ', item: 'garland', cook: 2.0, buy: 'ซื้อพวงมาลัย', vendor: 11 },
    { id: 'fishtoy', kind: 'fishtoy', row: 1, lot: 5, sign: 'ปลาตะเพียนสาน', price: 'ตัวละ 1 อัฐ', item: 'fishtoy', cook: 2.0, buy: 'ซื้อปลาตะเพียนสาน', vendor: 12 },
  ];
  for (const d of defs) makeStall(Object.assign(d, { cx: LOTX[d.lot], by: ROWY[d.row], node: (d.row ? 'l' : 'm') + LOTX[d.lot] }));
  const empty = [];
  for (const r of [0, 1]) for (let i = 0; i < 6; i++) if (!defs.some(s => s.row === r && s.lot === i)) {
    const x = LOTX[i], y = ROWY[r]; RECTS.push([x - 100, y - 44, x + 100, y + 2]); empty.push([x, y]);
    ents.push({ x, y, w: 120, draw(c) { spr(c, 'lot', x, y); label(c, 'ล็อกว่าง', x, y - 74, 22, '#fff1cc', 700); } });
  }
  for (const gt of GATES) {
    ents.push({ x: gt.x, y: 266, w: 180, draw(c) { spr(c, 'gate', gt.x, 266, { k: .75 }); label(c, 'ทางไป' + gt.name, gt.x, 266 - 294 * .6, 27, '#fff1cc', 700); } });
    addLight(gt.x, 150, 230, 1); addLight(gt.x, 300, 170, .8);
    prop('torch', gt.x - 130, 300, [[0, -90, 150, .9]]); prop('torch', gt.x + 130, 300, [[0, -90, 150, .9]]);
  }
  prop('tree1', 2420, 620, [[-105, -126, 170, .9], [91, -122, 190, .9]]); prop('tree2', 140, 1250, [[-82, -99, 150, .9], [72, -96, 160, .9]]);
  for (const [x, y] of [[70, 330], [3440, 345], [1190, 300], [3450, 1420], [2540, 300]]) prop('palm', x, y);
  for (const [x, y] of [[2230, 300], [860, 298], [150, 620], [1500, 300], [3380, 300], [2600, 1440]]) prop('banana', x, y);
  for (const [x, y] of [[500, 880], [1180, 900], [1860, 880], [330, 1370], [1010, 1380], [1690, 1370], [2250, 1180], [2560, 930], [2960, 1400], [3440, 930], [2540, 1400], [3450, 1320]]) lamp(x, y);
  prop('jar', 1500, 628); prop('jar', 1540, 640); prop('jar', 180, 1090);
  const signs = (x, y, a, b) => { const sp = prop('sign', x, y), d0 = sp.draw; sp.draw = c => { d0(c); label(c, a, x + 6, y - 200 * .7, 22, '#fff1cc', 700); label(c, b, x - 6, y - 126 * .7, 22, '#fff1cc', 700); }; };
  signs(1180, 760, 'ท่าน้ำ →', '← โบสถ์'); signs(2470, 860, 'เครื่องเล่น →', '← ตลาด');
  // เครื่องเล่น (ขึ้นได้จริง)
  let ride = null, fwA = 0, carA = 0;
  const fx = 3060, fy = 660, hy = fy - 380 * .6, cx = 2760, cy = 1140, bx = 3240, by = 1210;
  const cabPos = i => { const a = fwA + i * Math.PI / 4; return [fx + Math.cos(a) * 180, hy + Math.sin(a) * 180]; };
  const horsePos = i => { const a = carA + i * Math.PI / 3; return { i, s: Math.sin(a), x: cx + Math.cos(a) * 105, y: cy - 12 + Math.sin(a) * 16 - Math.abs(Math.sin(time * 2.4 + i * 1.3)) * 12 }; };
  const rider = (c, x, y, k, flip) => { spr(c, SPR[`c${P.ci}_f_up`] ? `c${P.ci}_f_up` : `c${P.ci}_f_stand`, x, y, { k, flip }); label(c, P.name, x, y - 150 * k, 13, '#fff', 700, 'rgba(30,15,50,.9)'); };
  function startRide(type) {
    let idx = 0, best = -9;
    if (type === 'ferris') for (let i = 0; i < 8; i++) { const v = Math.sin(fwA + i * Math.PI / 4); if (v > best) { best = v; idx = i; } }
    if (type === 'horse') for (let i = 0; i < 6; i++) { const v = Math.sin(carA + i * Math.PI / 3); if (v > best) { best = v; idx = i; } }
    ride = { type, idx, t: 0, a: 0, back: [P.x, P.y] }; sfx('ride'); P.task = { state: 'ride', ride: true }; P.hidden = true; P.path = []; P.vx = P.vy = 0;
    toast({ ferris: 'ขึ้นชิงช้าสวรรค์แล้ว ชมวิวให้เต็มที่', horse: 'ขี่ม้าหมุนแล้ว จับแน่น ๆ นะ', bounce: 'กระโดดบ้านลมให้สุดแรง' }[type] + ' (กด E เพื่อลง)');
  }
  function endRide() { if (!ride) return; [P.x, P.y] = ride.back; ride = null; P.task = null; P.hidden = false; P.hop = 0; P.dir = 'down'; cam.x = P.x; cheer(P, 130); toast('สนุกไหม มาเล่นใหม่ได้เรื่อย ๆ'); }
  ents.push({ x: fx, y: fy, w: 240, draw(c) {
    ell(c, fx, fy + 4, 150, 14, 'rgba(20,10,40,.3)'); spr(c, 'fw_base', fx, fy); spr(c, 'fw_wheel', fx, hy, { rot: fwA });
    for (let i = 0; i < 8; i++) {
      const [x, y] = cabPos(i); spr(c, 'fw_cab' + i % 4, x, y, { rot: Math.sin(time * 1.4 + i) * .07 });
      if (ride && ride.type === 'ferris' && ride.idx === i) { rider(c, x, y + 53, .3); c.beginPath(); c.roundRect(x - 23, y + 37, 46, 21, 5); c.fillStyle = '#c98f55'; c.fill(); c.strokeStyle = '#33211f'; c.lineWidth = 3; c.stroke(); }
    }
    label(c, 'ชิงช้าสวรรค์', fx, fy - 59 * .6, 24, '#fff1cc', 700);
  } });
  RECTS.push([fx - 140, fy - 50, fx + 140, fy + 6]); addLight(fx, hy, 340, 1); addLight(fx, fy - 20, 230, .85);
  ents.push({ x: cx, y: cy, w: 170, draw(c) {
    ell(c, cx, cy + 8, 150, 16, 'rgba(20,10,40,.3)'); spr(c, 'car_base', cx, cy); const hs = [0, 1, 2, 3, 4, 5].map(horsePos);
    hs.sort((p, q) => p.s - q.s);
    for (const h of hs) { spr(c, 'horse' + h.i % 3, h.x, h.y, { flip: h.s > 0, k: .82 + h.s * .1 }); if (ride && ride.type === 'horse' && ride.idx === h.i) rider(c, h.x, h.y - 28, .6, h.s > 0); }
    spr(c, 'car_top', cx, cy); board(c, cx, cy + 38, 'ม้าหมุน');
  } });
  RECTS.push([cx - 150, cy - 60, cx + 150, cy + 16]); addLight(cx, cy - 110, 270, 1);
  const kids = [4, 5, 4].map((ci, i) => Object.assign(mkChar(bx - 80 + i * 80, by - 46, ci), { noShadow: true }));
  ents.push({ x: bx, y: by, w: 180, draw(c) {
    ell(c, bx, by + 6, 165, 16, 'rgba(20,10,40,.3)'); spr(c, 'bounce_back', bx, by, { sy: 1 + Math.sin(time * 5) * .012 });
    kids.forEach((k, i) => { k.hop = -Math.abs(Math.sin(time * 4 + i * 2.1)) * 36; k.joy = 1; drawChar(c, k); });
    if (ride && ride.type === 'bounce') { const me = Object.assign({}, P, { x: bx - 40, y: by - 40, hop: -Math.abs(Math.sin(time * 4.6)) * 44, joy: 1, dir: 'down', noShadow: true, moving: false, mv: 0, duck: 0 }); drawChar(c, me); label(c, P.name, me.x, me.y + me.hop - 142, 14, '#fff', 700, 'rgba(30,15,50,.9)'); }
    spr(c, 'bounce_front', bx, by, { sy: 1 + Math.sin(time * 5 + 1) * .02 }); board(c, bx, by + 30, 'บ้านลม');
  } });
  RECTS.push([bx - 160, by - 76, bx + 160, by + 8]); addLight(bx, by - 100, 260, 1);
  for (const y of ROWY) for (let i = 0; i < 5; i++) addString(LOTX[i], y - 214, LOTX[i + 1], y - 214, 26);
  addString(362, 1215, 1042, 1225, 44); addString(1042, 1225, 1722, 1215, 44); addString(532, 725, 1212, 745, 44); addString(1212, 745, 1892, 725, 44);
  addString(2592, 775, 3050, 440, 30); addString(3070, 440, 3472, 775, 30); addString(2572, 1245, 2992, 1245, 40);
  // ร้านอาหารนั่งกิน
  const RESTS = [];
  for (const d of [{ id: 'r_noodle', kind: 'noodle', cx: 500, sign: 'ก๋วยเตี๋ยว', dish: 'dish_noodle', name: 'ก๋วยเตี๋ยว', vendor: 12 }, { id: 'r_chicken', kind: 'chicken', cx: 1300, sign: 'ข้าวมันไก่', dish: 'dish_rice', name: 'ข้าวมันไก่', vendor: 11 }, { id: 'r_curry', kind: 'curry', cx: 2100, sign: 'ข้าวแกง', dish: 'dish_curry', name: 'ข้าวแกง', vendor: 12 }]) {
    const by = 1640, cx = d.cx, s = Object.assign({ by, sayT: 0, say: '', seats: [-176, -84, 84, 176].map(dx => ({ x: cx + dx, y: 1790, st: 0 })) }, d);
    s.vendor = Object.assign(mkChar(cx, by - 30, d.vendor), { noLegs: true, noShadow: true, hideItem: true });
    s.line = new Line({ name: 'รอโต๊ะว่าง', spots: s.seats, slot: i => ({ x: cx - 30 + 50 * i, y: 1880 }), max: 3, face: 'up', ready: () => true });
    ents.push({ x: cx, y: by, w: 170, draw(c) { ell(c, cx, by + 4, 134, 12, 'rgba(20,10,40,.3)'); spr(c, 'stall_back', cx, by); drawChar(c, s.vendor); spr(c, 'stall_' + d.kind, cx, by); label(c, d.sign, cx, by - 185, 31, '#fff1cc', 700); tag(c, cx - 50, by - 50, 'นั่งกินที่ร้าน'); if (s.sayT > 0) bubble(c, cx + 84, by - 132, s.say); } });
    for (const tx of [cx - 130, cx + 130]) { ents.push({ x: tx, y: 1822, w: 110, draw(c) { ell(c, tx, 1826, 100, 9, 'rgba(20,10,40,.28)'); spr(c, 'table', tx, 1822); for (const st of s.seats) if (Math.abs(st.x - tx) < 60 && st.st === 2) spr(c, d.dish, st.x, 1822 - 46); } }); RECTS.push([tx - 100, 1798, tx + 100, 1828]); }
    RECTS.push([cx - 132, by - 150, cx + 132, by + 6]); addLight(cx, by - 70, 250, 1); addLight(cx, by + 150, 300, .85); addLight(cx - 122, by - 110, 110, .8); addLight(cx + 122, by - 110, 110, .8);
    RESTS.push(s);
  }
  // ตลาดน้ำ: เรือขายของจอดริมฝั่งใต้
  for (const d of [{ id: 'bn', cx: 500, sign: 'ก๋วยเตี๋ยวเรือ', price: 'ชามละ 2 อัฐ', item: 'noodle', cook: 2.4, buy: 'ซื้อก๋วยเตี๋ยวเรือ', vendor: 12 }, { id: 'bf', cx: 1000, sign: 'เรือผลไม้', price: 'ลูกละ 1 อัฐ', item: 'fruit', cook: 1.6, buy: 'ซื้อมะม่วงสุก', vendor: 11 }, { id: 'bk', cx: 2300, sign: 'เรือขนมไทย', price: 'ห่อละ 1 อัฐ', item: 'kanom', cook: 1.8, buy: 'ซื้อขนมไทย', vendor: 11 }, { id: 'bc', cx: 2800, sign: 'เรือมะพร้าว', price: 'ลูกละ 1 อัฐ', item: 'coco', cook: 1.6, buy: 'ซื้อมะพร้าวน้ำหอม', vendor: 12 }]) {
    const by = 2182, cx = d.cx, s = Object.assign({ by, cx, x: cx, y: 2176, w: 120, anim: 'idle', t: 0, say: '', sayT: 0, node: 's' + cx }, d);
    s.vendor = Object.assign(mkChar(cx, by - 30, d.vendor), { noLegs: true, noShadow: true, hideItem: true });
    s.line = new Line({ spots: [{ x: cx, y: 2226 }], slot: i => ({ x: cx + 52 * (i + 1), y: 2238 }), max: 2, face: 'left', ready: () => s.anim === 'idle' });
    s.draw = c => {
      const yb = 2176 + Math.sin(time * 1.5 + cx) * 2; ell(c, cx, yb + 6, 100, 10, 'rgba(10,6,40,.35)'); spr(c, 'bshop_back', cx, yb);
      for (const dx of [-60, 60]) spr(c, ITEMS[d.item].spr, cx + dx, yb - 20, { k: 1.15 });
      drawChar(c, s.vendor); spr(c, 'bshop_front', cx, yb); board(c, cx, yb - 160, d.sign, 22); tag(c, cx, yb + 2, d.price);
      if (s.anim === 'hand') { const u = ease(s.t / .7); spr(c, ITEMS[d.item].spr, lerp(cx + 26, cx + 22, u), lerp(2118, 2208, u) - Math.sin(u * Math.PI) * 26, { k: 1 + Math.sin(u * Math.PI) * .3 }); }
    };
    addLight(cx - 60, 2100, 170, .95); addLight(cx, 2230, 170, .7); STALL[d.id] = s; stalls.push(s); ents.push(s);
  }
  const cboats = [{ x: 600, y: 2046, v: 22, a: 80, b: 1560, k: 'boat0' }, { x: 2600, y: 2070, v: -17, a: 1960, b: 3420, k: 'boat1' }], cwaves = [], mpets = [];
  { const r2 = seeded(31); for (let i = 0; i < 150; i++) cwaves.push({ x: r2() * 3500, y: 1972 + r2() * 190, l: 12 + r2() * 28, p: r2() * 6 }); }
  ents.push({ x: 1760, y: 1948, w: 120, draw(c) { board(c, 1760, 1900, 'ตลาดน้ำ ↓', 22); } });
  for (const [x, y] of [[900, 1720], [1700, 1720], [2500, 1720], [300, 2310], [1500, 2310], [2550, 2310], [3300, 2310], [3200, 1760], [150, 1760]]) lamp(x, y);
  prop('tree2', 3000, 1840, [[-82, -99, 150, .9], [72, -96, 160, .9]]); prop('palm', 60, 1930); prop('banana', 3420, 1920); prop('banana', 1180, 1930); prop('palm', 3440, 2330);
  addString(932, 1565, 1732, 1565, 44); addString(1732, 1565, 2532, 1565, 44); addString(332, 2155, 1532, 2155, 60); addString(1532, 2155, 2582, 2155, 60);
  for (const [k, i, x, y] of [['dog', 0, 900, 880], ['dog', 1, 2550, 1010], ['dog', 2, 1500, 1920], ['cat', 0, 300, 1330], ['cat', 1, 1900, 1260], ['cat', 2, 800, 1910], ['cat', 0, 2700, 2270], ['dog', 0, 1200, 2270]]) addPet(mpets, k, i, x, y);
  // พื้นหลัง
  const [bg, b] = newBG(), rnd = seeded(7); sky(b, rnd, 230, 1250, 70);
  for (const gt of GATES) { const gr = b.createRadialGradient(gt.x, 200, 10, gt.x, 200, 260); gr.addColorStop(0, 'rgba(255,190,110,.4)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); b.fillStyle = gr; b.fillRect(gt.x - 260, -60, 520, 320); }
  b.beginPath(); b.moveTo(0, 250); for (let x = 0; x <= W; x += 40) b.quadraticCurveTo(x + 20, 150 + rnd() * 40, x + 40, 190 + rnd() * 20); b.lineTo(W, 250); b.closePath(); b.fillStyle = '#1b1a3e'; b.fill();
  b.fillStyle = '#e0a23a'; b.beginPath(); b.moveTo(430, 200); b.quadraticCurveTo(500, 150, 520, 96); b.quadraticCurveTo(540, 150, 610, 200); b.closePath(); b.fill(); b.lineWidth = 4; b.strokeStyle = '#33211f'; b.stroke();
  ground(b, rnd, 240, [330, 800, 1290, 1890, 2262]);
  for (let x = 100; x < W; x += 204) if (!GATES.some(gt => Math.abs(x - gt.x) < 170)) spr(b, 'fence', x, 268);
  { const wg = b.createLinearGradient(0, 1950, 0, 2190); wg.addColorStop(0, '#1f2a78'); wg.addColorStop(1, '#3a4aa0'); b.fillStyle = wg; b.fillRect(0, 1956, W, 228);
    b.fillStyle = '#4f8a52'; b.fillRect(0, 1942, W, 16); b.fillRect(0, 2180, W, 12); b.strokeStyle = '#33211f'; b.lineWidth = 3; b.strokeRect(-10, 1957, W + 20, 224);
    for (let i = 0; i < 60; i++) { const x = rnd() * W, y = rnd() < .5 ? 1966 + rnd() * 20 : 2100 + rnd() * 20; if ((x > 1660 && x < 1860) || (y > 2090 && [500, 1000, 2300, 2800].some(q => Math.abs(q - x) < 130))) continue; const rx = 16 + rnd() * 14; b.beginPath(); b.ellipse(x, y, rx, rx * .34, 0, .25, 6.1); b.lineTo(x, y); b.closePath(); b.fillStyle = rnd() < .5 ? '#3f8f55' : '#4fa262'; b.fill(); b.lineWidth = 2.5; b.stroke(); if (rnd() < .35) { ell(b, x, y - 6, 6, 7, '#ffb0cc'); b.lineWidth = 2; b.stroke(); } }
    b.fillStyle = '#b0763e'; b.fillRect(1700, 1934, 120, 264); for (let y = 1946; y < 2196; y += 16) { b.fillStyle = 'rgba(60,30,10,.22)'; b.fillRect(1700, y, 120, 2); } b.lineWidth = 5; b.strokeRect(1700, 1934, 120, 264);
    for (const x of [1700, 1820]) for (let y = 1940; y <= 2196; y += 64) { b.fillStyle = '#8a5a34'; b.fillRect(x - 6, y - 26, 12, 30); b.lineWidth = 3; b.strokeRect(x - 6, y - 26, 12, 30); } }
  endScene({
    name: 'market', title: 'ฉากที่ 1 · ตลาด', bg, fade: [120, 300], nBots: 28, wind: true, pets: mpets,
    drawUnder(c) {
      if (camT + VIEW_H < 1940) return; const x0 = camL - 60, x1 = camL + vw + 60;
      for (const w of cwaves) if (w.x > x0 && w.x < x1) { c.globalAlpha = .1 + .08 * Math.sin(time * 1.1 + w.p); c.strokeStyle = '#b9b0ff'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); const xx = w.x + Math.sin(time * .5 + w.p) * 6; c.moveTo(xx, w.y); c.lineTo(xx + w.l, w.y); c.stroke(); }
      c.globalAlpha = 1;
      for (const bt of cboats) { const yb = bt.y + Math.sin(time * 1.3 + bt.x * .01) * 2; ell(c, bt.x, yb + 8, 90, 10, 'rgba(10,6,40,.35)'); spr(c, bt.k, bt.x, yb, { flip: bt.v < 0 }); dyn.push({ x: bt.x + (bt.v < 0 ? 70 : -70), y: yb - 40, r: 110, a: .85 }); }
    },
    blocked: (x, y) => (y < 292 && !GATES.some(gt => Math.abs(x - gt.x) < 70 && y > 250)) || (y > 1950 && y < 2192 && !(x > 1708 && x < 1812)),
    browse: [
      () => { const r = R() < .5 ? 0 : 1, x = pick(LOTX); return { node: (r ? 'l' : 'm') + x, x: x + rr(-60, 60), y: ROWY[r] + rr(40, 70), dir: 'up' }; },
      () => { const x = pick(LX); return { node: 'm' + x, x: x + rr(-90, 90), y: 800 + rr(-40, 40), dir: pick(['left', 'right', 'down']) }; },
      () => { const x = pick(LX); return { node: 'l' + x, x: x + rr(-90, 90), y: 1290 + rr(-30, 80), dir: pick(['left', 'right', 'down', 'up']) }; },
      () => { const x = pick(BX); return { node: 'b' + x, x: x + rr(-60, 60), y: 320 + rr(0, 30), dir: 'up' }; },
      () => { const x = pick([2700, 3000]); return { node: 'm' + x, x: x + rr(-70, 160), y: 790 + rr(-30, 50), dir: 'up' }; },
      () => { const x = pick([2700, 3000]); return { node: 'l' + x, x: x + rr(-60, 260), y: 1270 + rr(0, 50), dir: 'up' }; },
      () => { const x = pick(DX); return { node: 'd' + x, x: x + rr(-90, 90), y: 1890 + rr(-20, 40), dir: pick(['left', 'right', 'up', 'down']) }; },
      () => { const x = pick(SXs); return { node: 's' + x, x: x + rr(-90, 90), y: 2240 + rr(0, 60), dir: 'up' }; },
    ],
    plan(b) {
      const p = [], br = () => p.push({ t: 'browse' });
      for (let i = R() * 3 | 0; i >= 0; i--) br();
      if (!META.cast[b.ci].monk) { if (R() < .35) { p.push({ t: 'dine' }); br(); } if (R() < .3) { p.push({ t: 'buy', s: pick(['bn', 'bf', 'bk', 'bc']) }); br(); p.push({ t: 'eat' }); } if (R() < .6) { p.push({ t: 'buy', s: pick(['kanom', 'drink', 'khaolam', 'fruit', 'krok', 'noodle', 'corn', 'coco']) }); br(); p.push({ t: 'eat' }); } if (R() < .5) { p.push({ t: 'buy', s: pick(['lantern', 'toy', 'garland', 'fishtoy']) }); br(); br(); } if (R() < .35) { p.push({ t: 'ride' }); br(); } }
      if (R() < .5) br(); p.push({ t: 'exit' }); return p;
    },
    step(b, s) { if (s.t === 'dine') { const r = pick(RESTS); route(b, 'd' + r.cx, null); s.arrive = () => { if (!r.line.full()) r.line.join(b); }; } else if (s.t === 'ride') { const [nd, x, y] = pick([['m3000', 3060, 716], ['l2700', 2760, 1204], ['l3000', 3240, 1266]]); route(b, nd, { x: x + rr(-40, 40), y }); s.arrive = () => { b.hidden = true; b.wait = rr(8, 12); b.after = () => { b.hidden = false; cheer(b, 110); }; }; } },
    endRide,
    update(dt) {
      for (const s of RESTS) {
        s.line.update(); s.sayT -= dt; const v = s.vendor; v.pose = null; v.held = null; v.y = s.by - 30; animChar(v, dt); let cooking = false;
        if (R() < dt * 2.5) smoke(s.cx + rr(-60, 60), s.by - 96);
        s.line.occ.forEach((c, i) => {
          if (!c) return; const T = c.task, me = c === P, st = s.seats[i];
          if (T.state === 'go') { if (!c.path.length) { T.state = 'serve'; T.sub = 0; T.t = 0; T.keep = c.held; c.held = null; c.dir = 'down'; c.duckT = .45; st.st = 1; s.say = 'รอสักครู่จ้ะ'; s.sayT = 2; if (me) { renderInv(); toast(`สั่ง${s.name}แล้ว นั่งรอสักครู่นะ`); } } return; }
          T.t += dt;
          if (T.sub === 0) { cooking = true; if (T.t > 3.2) { T.sub = 2; T.t = 0; st.st = 2; s.say = 'ได้แล้วจ้ะ'; s.sayT = 2; if (me) sfx('buy'); } }
          else { c.pose = 'eat'; if (me && R() < dt * 1.6) sfx('step'); if (T.t > 5) { st.st = 0; c.duckT = 0; c.held = T.keep; s.line.release(i); cheer(c, me ? 120 : 0); if (me) { renderInv(); sfx('eat'); toast(`${s.name}อร่อยมาก อิ่มแล้ว`); for (let k = 0; k < 4; k++) parts.push({ type: 'heart', x: P.x + rr(-16, 16), y: P.y - 130, vx: rr(-10, 10), vy: rr(-30, -18), life: 0, max: 1.1 }); } else c.path = [{ x: c.x, y: 1900 }]; } }
        });
        if (cooking) { v.held = (time * 4 | 0) % 2 ? 'krathong' : null; v.y = s.by - 30 + Math.abs(Math.sin(time * 9)) * 2.5; }
      }
      for (const bt of cboats) { bt.x += bt.v * dt; if (bt.x > bt.b || bt.x < bt.a) bt.v = -bt.v; }
      for (const s of stalls) if (s.steam && R() < dt * 2) smoke(s.cx + rr(-50, 50), s.by - 96);
      const sp = ride && ride.type === 'ferris' ? .6 : .22, cs = ride && ride.type === 'horse' ? 1.1 : .6;
      fwA += dt * sp; carA += dt * cs; if (!ride) return; ride.t += dt;
      if (ride.type === 'ferris') { ride.a += dt * sp; const [x, y] = cabPos(ride.idx); P.x = x; P.y = y + 150; if (ride.a > Math.PI * 2) endRide(); }
      else if (ride.type === 'horse') { ride.a += dt * cs; P.x = horsePos(ride.idx).x; P.y = cy + 60; if (ride.a > Math.PI * 4) endRide(); }
      else { P.x = bx; P.y = by + 40; if (ride.t > 9) endRide(); }
    },
    interact() {
      for (const s of RESTS) if (Math.abs(P.x - s.cx) < 250 && P.y > 1640 && P.y < 1960) return { label: `นั่งกิน${s.name}ที่ร้าน`, act() { if (s.line.full()) toast('โต๊ะเต็มและคนรอเยอะ รอสักครู่นะ'); else s.line.join(P); } };
      if (Math.abs(P.x - 1860) < 90 && P.y < 330) return { label: 'ไปท่าน้ำ', act() { enterScene('pier', 1200, 1160); } };
      if (Math.abs(P.x - 520) < 90 && P.y < 330) return { label: 'เข้าโบสถ์', act() { enterScene('temple', 1050, 1170); } };
      for (const [x, y, n, t] of [[3060, 700, 'ขึ้นชิงช้าสวรรค์', 'ferris'], [2760, 1190, 'ขี่ม้าหมุน', 'horse'], [3240, 1250, 'เข้าไปกระโดดบ้านลม', 'bounce']]) if (Math.hypot(P.x - x, P.y - y) < 110) return { label: n, act() { startRide(t); } };
      for (const [x, y] of empty) if (Math.hypot(P.x - x, P.y - (y + 40)) < 80) return { label: 'ดูล็อกว่าง', act() { toast('ล็อกนี้ยังว่าง รอพ่อค้าแม่ค้ามาตั้งร้าน'); } };
      return null;
    },
  });
}

// ============================================================ ฉากท่าน้ำ
function buildPier() {
  beginScene(2400, 1300);
  const BANK = 650, DECK = [1000, 1400, 478], SPOTS = [1060, 1153, 1247, 1340].map(x => ({ x, y: 512 }));
  const KX = [300, 700, 1000, 1200, 1500, 1750, 2100], LXs = [300, 700, 1200, 1750, 2100];
  KX.forEach((x, i) => { node('k' + x, x, 770); if (i) link('k' + KX[i - 1], 'k' + x); });
  LXs.forEach((x, i) => { node('l' + x, x, 1060); if (i) link('l' + LXs[i - 1], 'l' + x); link('k' + x, 'l' + x); });
  node('gate', 1200, 1262).exit = true; link('gate', 'l1200'); node('q', 600, 712).noSpawn = true; link('q', 'k700'); N.q.tight = true;
  makeStall({ id: 'krathong', kind: 'krathong', cx: 1750, by: 940, node: 'l1750', sign: 'กระทง', price: 'ใบละ 2 อัฐ', item: 'krathong', cook: 2.4, buy: 'ซื้อกระทง', vendor: 11, limit1: true });
  const pier = new Line({ name: 'แถวลอยกระทง', spots: SPOTS, slot: i => ({ x: 950 - 56 * i, y: 712 }), max: 7, face: 'right', ready: () => true,
    approach: (c, i) => { const s = SPOTS[i], p = [{ x: s.x, y: 548 }, { x: s.x, y: s.y }]; if (c.y > BANK) p.unshift({ x: 1040, y: 690 }, { x: 1034, y: 560 }); return p; } });
  const krs = [], boats = [{ x: 500, y: 300, v: 16, k: 'boat0' }, { x: 1900, y: 400, v: -12, k: 'boat1' }], skyL = [], rnd = seeded(21);
  const NAMES = META.cast.filter(m => !m.vendor && !m.monk).map(m => m.name);
  for (let i = 0; i < 58; i++) krs.push({ kind: KR_KINDS[rnd() * 4 | 0], owner: NAMES[rnd() * NAMES.length | 0], x: rnd() * W, y: 200 + rnd() * 400, ty: 200 + rnd() * 400, lit: rnd() < .9, wish: '', age: 99, seed: rnd() * 9, vx: 9 + rnd() * 8, tvx: 9 + rnd() * 8 });
  for (let i = 0; i < 12; i++) skyL.push({ x: rnd() * W, y: 10 + rnd() * 130, v: 3 + rnd() * 4, s: .5 + rnd() * .5 });
  const farL = [], waves = [];
  // ของประกอบฉาก
  prop('sala', 330, 800, [[-62, -110, 150, .9], [62, -110, 150, .9]]); prop('tree1', 2200, 900, [[-105, -126, 170, .9], [91, -122, 190, .9]]);
  for (const [x, y] of [[70, 700], [2340, 690], [2330, 1250]]) prop('palm', x, y);
  for (const [x, y] of [[1560, 690], [120, 1180], [880, 1270]]) prop('banana', x, y);
  for (const [x, y] of [[160, 700], [640, 690], [1480, 700], [1960, 700], [700, 1230], [1700, 1240]]) lamp(x, y);
  for (const [x, y] of [[1000, 668], [1400, 668], [1008, 492], [1392, 492]]) prop('torch', x, y, [[0, -90, 170, .95]]);
  prop('urn', 560, 930, [[0, -80, 150, .7]]); prop('candles', 700, 930, [[0, -60, 230, 1]]); RECTS.push([500, 880, 800, 934]);
  ents.push({ x: 630, y: 931, w: 100, draw(c) { board(c, 630, 800, 'จุดธูปเทียน', 24); } });
  for (const x of [950, 838, 726]) prop('stake', x - 28, 742);
  ents.push({ x: 600, y: 744, w: 100, draw(c) { spr(c, 'stake', 560, 744); board(c, 600, 656, 'ต่อแถวลอยกระทง →', 22); } });
  ents.push({ x: 1200, y: 1290, w: 180, draw(c) { spr(c, 'gate', 1200, 1290, { k: .75 }); label(c, 'กลับตลาด', 1200, 1290 - 294 * .6, 27, '#fff1cc', 700); } }); addLight(1200, 1180, 220, .9);
  const sp = prop('sign', 1300, 900), d0 = sp.draw; sp.draw = c => { d0(c); label(c, 'ร้านกระทง →', 1306, 900 - 200 * .7, 21, '#fff1cc', 700); label(c, '← จุดธูปเทียน', 1294, 900 - 126 * .7, 20, '#fff1cc', 700); };
  addString(192, 545, 672, 535, 40); addString(1512, 545, 1992, 545, 40); addString(1992, 545, 2300, 500, 30);
  addLight(1200, 560, 260, .8);
  const ppets = []; for (const [k, i, x, y] of [['dog', 1, 1900, 1010], ['cat', 0, 420, 1060], ['cat', 2, 1520, 830], ['dog', 2, 900, 1100]]) addPet(ppets, k, i, x, y);
  // พื้นหลัง
  const [bg, b] = newBG(); sky(b, rnd, 170, 1650, 66);
  let gr = b.createLinearGradient(0, 150, 0, BANK + 10); gr.addColorStop(0, '#15124a'); gr.addColorStop(.35, '#1f2a78'); gr.addColorStop(.7, '#2c3f96'); gr.addColorStop(1, '#4a4aa6'); b.fillStyle = gr; b.fillRect(0, 150, W, BANK - 140);
  b.beginPath(); b.moveTo(0, 176); for (let x = 0; x <= W; x += 30) b.lineTo(x, 150 - rnd() * 14 - (rnd() < .15 ? 12 : 0)); b.lineTo(W, 176); b.closePath(); b.fillStyle = '#120e30'; b.fill();
  const chedi = (x, h) => { const gg = b.createRadialGradient(x, 160 - h * .5, 4, x, 160 - h * .5, h * 1.2); gg.addColorStop(0, 'rgba(255,200,110,.5)'); gg.addColorStop(1, 'rgba(255,200,110,0)'); b.fillStyle = gg; b.fillRect(x - h * 1.3, 160 - h * 1.8, h * 2.6, h * 2.2); b.fillStyle = '#f2c14e'; b.beginPath(); b.moveTo(x - h * .42, 160); b.lineTo(x - h * .36, 160 - h * .18); b.lineTo(x - h * .26, 160 - h * .2); b.quadraticCurveTo(x - h * .24, 160 - h * .5, x - h * .07, 160 - h * .56); b.lineTo(x, 160 - h); b.lineTo(x + h * .07, 160 - h * .56); b.quadraticCurveTo(x + h * .24, 160 - h * .5, x + h * .26, 160 - h * .2); b.lineTo(x + h * .36, 160 - h * .18); b.lineTo(x + h * .42, 160); b.closePath(); b.fill(); b.lineWidth = 3; b.strokeStyle = '#33211f'; b.stroke(); };
  chedi(1200, 104); chedi(420, 58); chedi(2050, 66);
  for (let x = 8; x < W; x += 12 + rnd() * 22) { const col = pick(['#ffd27a', '#ffb24d', '#ff9a6b', '#ffe9a8', '#ff8fb0']); ell(b, x, 160 + rnd() * 6, 1.8, 1.8, col); if (rnd() < .45) farL.push({ x, col }); }
  for (let i = 0; i < 200; i++) waves.push({ x: rnd() * W, y: 188 + rnd() * 440, l: 12 + rnd() * 30, p: rnd() * 6 });
  ground(b, rnd, BANK, [770, 1060]);
  b.beginPath(); b.moveTo(0, BANK - 6); for (let x = 0; x <= W; x += 60) b.quadraticCurveTo(x + 30, BANK - 14 + rnd() * 10, x + 60, BANK - 4); b.lineTo(W, BANK + 22); b.lineTo(0, BANK + 22); b.closePath(); b.fillStyle = '#4f8a52'; b.fill(); b.lineWidth = 3; b.strokeStyle = '#33211f'; b.stroke();
  // ใบบัว ดอกบัว และกอกก ริมตลิ่ง
  for (let i = 0; i < 46; i++) { const x = rnd() * W, y = 588 + rnd() * 48; if (x > 950 && x < 1450) continue; const rx = 18 + rnd() * 16; b.beginPath(); b.ellipse(x, y, rx, rx * .34, 0, .25, 6.1); b.lineTo(x, y); b.closePath(); b.fillStyle = rnd() < .5 ? '#3f8f55' : '#4fa262'; b.fill(); b.lineWidth = 2.5; b.strokeStyle = '#33211f'; b.stroke();
    if (rnd() < .4) { for (const [dx, dy, r2] of [[-8, -6, -.5], [8, -6, .5], [0, -11, 0]]) { b.save(); b.translate(x + dx, y - 2 + dy); b.rotate(r2); b.beginPath(); b.moveTo(0, 8); b.quadraticCurveTo(-8, 0, 0, -12); b.quadraticCurveTo(8, 0, 0, 8); b.fillStyle = '#ffb0cc'; b.fill(); b.lineWidth = 2; b.stroke(); b.restore(); } ell(b, x, y - 4, 3.5, 3, '#ffd23e'); } }
  for (let i = 0; i < 70; i++) { const x = rnd() * W; if (x > 960 && x < 1440) continue; const y = BANK + 2 + rnd() * 8, h = 26 + rnd() * 34, ln = (rnd() - .5) * 16; b.strokeStyle = '#3f7a48'; b.lineWidth = 3.4; b.lineCap = 'round'; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + ln * .3, y - h * .6, x + ln, y - h); b.stroke(); if (rnd() < .35) { b.strokeStyle = '#7a4a2a'; b.lineWidth = 6; b.beginPath(); b.moveTo(x + ln * .8, y - h * .86); b.lineTo(x + ln, y - h); b.stroke(); } }
  let mist = b.createLinearGradient(0, 160, 0, 260); mist.addColorStop(0, 'rgba(220,210,255,.2)'); mist.addColorStop(1, 'rgba(220,210,255,0)'); b.fillStyle = mist; b.fillRect(0, 160, W, 100);
  b.fillStyle = 'rgba(8,5,30,.35)'; b.fillRect(DECK[0] - 8, DECK[2] - 4, DECK[1] - DECK[0] + 16, BANK + 30 - DECK[2]);
  b.fillStyle = '#b0763e'; b.fillRect(DECK[0], DECK[2], DECK[1] - DECK[0], BANK + 22 - DECK[2]);
  for (let y = DECK[2] + 16; y < BANK + 20; y += 16) { b.fillStyle = `rgba(60,30,10,${.16 + rnd() * .1})`; b.fillRect(DECK[0], y, DECK[1] - DECK[0], 2); }
  b.lineWidth = 5; b.strokeStyle = '#33211f'; b.strokeRect(DECK[0], DECK[2], DECK[1] - DECK[0], BANK + 22 - DECK[2]);
  for (const s of SPOTS) { b.strokeStyle = 'rgba(255,220,200,.7)'; b.lineWidth = 2.5; b.setLineDash([6, 5]); b.beginPath(); b.ellipse(s.x, s.y + 2, 28, 10, 0, 0, 7); b.stroke(); b.setLineDash([]); }
  b.fillStyle = 'rgba(255,230,180,.10)'; b.fillRect(590, 690, 400, 44);
  let myK = null, focusT = 0, sel = null, selT = 0, fwT = 3;
  const fws = [], flies = [], twinkle = [];
  for (let i = 0; i < 34; i++) flies.push({ x: rnd() * W, y: 540 + rnd() * 260, p: rnd() * 9, s: .5 + rnd() });
  for (let i = 0; i < 110; i++) twinkle.push({ x: rnd() * W, y: 190 + rnd() * 440, p: rnd() * 9 });
  function launch(c, lit, wish, mine) { const k = { x: c.x + rr(-4, 4), y: c.y - 30, sy: c.y - 30, pt: 0, placing: true, lit, wish, mine, kind: c.kr, owner: mine ? P.name : META.cast[c.ci].name, age: 0, seed: R() * 9, vx: 0, tvx: rr(9, 15), ty: rr(210, 450) }; krs.push(k); return k; }
  const WISHES = ['ขอให้สุขภาพแข็งแรง', 'ขอให้ร่ำรวยเงินทอง', 'ขอให้ครอบครัวอยู่เย็นเป็นสุข', 'ขอให้พบเนื้อคู่', 'ขอให้ค้าขายรุ่งเรือง', 'ขอขมาพระแม่คงคา', 'ขอให้ปีหน้าดีกว่าเดิม', 'ขอให้ข้าวกล้าในนาอุดมสมบูรณ์', 'ขอให้ลูกหลานเป็นคนดี'];
  endScene({
    name: 'pier', title: 'ฉากที่ 3 · ท่าน้ำ', bg, fade: [120, 210], nBots: 14, pier, krs, wind: true, pets: ppets,
    blocked: (x, y) => y < BANK + 14 && !(x > DECK[0] + 14 && x < DECK[1] - 14 && y > DECK[2] + 22),
    browse: [
      () => { const x = pick([300, 700, 1500, 1750, 2100]); return { node: 'k' + x, x: x + rr(-110, 110), y: BANK + 22 + rr(0, 12), dir: 'up' }; },
      () => { const x = pick(LXs); return { node: 'l' + x, x: x + rr(-100, 100), y: 1060 + rr(-40, 60), dir: pick(['left', 'right', 'up']) }; },
      () => { const x = pick(KX); return { node: 'k' + x, x: x + rr(-60, 60), y: 790 + rr(0, 50), dir: 'up' }; },
    ],
    plan(b, initial) {
      const p = [], br = () => p.push({ t: 'browse' });
      if (META.cast[b.ci].monk) { br(); br(); br(); p.push({ t: 'exit' }); return p; }
      if (initial && R() < .4) { b.held = 'krathong'; b.lit = R() < .7; p.push({ t: 'float' }); br(); p.push({ t: 'exit' }); return p; }
      if (R() < .35) br(); p.push({ t: 'buy', s: 'krathong' }); if (R() < .7) p.push({ t: 'light' }); p.push({ t: 'float' }); br(); if (R() < .5) br(); p.push({ t: 'exit' }); return p;
    },
    step(b, s) {
      if (s.t === 'light') { if (b.held !== 'krathong') return; route(b, 'l700', { x: 630 + rr(-70, 70), y: 952 + rr(0, 14) }); s.arrive = () => { b.dir = 'up'; b.pose = 'wai'; b.wait = 1.9; b.after = () => { b.pose = null; b.lit = true; }; }; }
      else if (s.t === 'float') { if (b.held !== 'krathong') return; route(b, 'q', null); s.arrive = () => { if (pier.full()) b.plan.unshift({ t: 'browse' }, { t: 'float' }); else pier.join(b); }; }
    },
    interact() {
      const kr = hasItem('krathong');
      if (Math.hypot(P.x - 630, P.y - 960) < 120) return { label: kr && !P.lit ? 'จุดธูปเทียนให้กระทง' : 'ไหว้ขอพร', act() {
        P.dir = 'up'; if (kr) { P.held = 'krathong'; renderInv(); }
        doBusy('wai', 1.8, () => { if (kr && !P.lit) { P.lit = true; renderInv(); toast('จุดธูปเทียนแล้ว กระทงสว่างขึ้น ไปต่อแถวลอยได้เลย'); } else toast('สาธุ ขอให้สมปรารถนา'); });
      } };
      if (P.x > 540 && P.x < 1440 && P.y < 780) return { label: kr ? 'ต่อแถวลอยกระทง' : 'ลอยกระทง (ต้องมีกระทงก่อน)', act() {
        if (!kr) return toast('ยังไม่มีกระทง ซื้อได้ที่ร้านกระทงทางขวา →');
        if (pier.full()) return toast('แถวเต็มแล้ว รอสักครู่นะ');
        P.held = 'krathong'; renderInv(); pier.join(P);
      } };
      if (P.y > 1170 && Math.abs(P.x - 1200) < 110) return { label: 'กลับตลาด', act() { enterScene('market', 1860, 340, 'down'); } };
      return null;
    },
    focus() { return focusT > 0 && myK ? { x: lerp(P.x, myK.x, .55), y: lerp(P.y - 62, myK.y, .7) } : null; },
    click(wx, wy) {
      if (wy > BANK - 6) return false; let best = null, bd = 60;
      for (const k of krs) { const d = Math.hypot(k.x - wx, (k.y - 18 - wy) * 1.3); if (d < bd) { bd = d; best = k; } }
      if (best) { sel = best; selT = 6; } return true;
    },
    update(dt) {
      focusT -= dt; selT -= dt; if (keys.w || keys.a || keys.s || keys.d || keys.arrowup || keys.arrowdown || keys.arrowleft || keys.arrowright) focusT = Math.min(focusT, .01);
      fwT -= dt; if (fwT <= 0) { fwT = rr(3.5, 8); const n = R() < .35 ? 2 : 1; for (let j = 0; j < n; j++) { const f = { x: Math.max(80, Math.min(W - 80, camL + rr(.1, .9) * vw)), y: rr(30, 105), t: -j * .35, max: rr(1.5, 2.1), col: pick(['#ffd27a', '#ff8fb0', '#8fd3ff', '#c4f5a6', '#e3b4ff', '#ffffff']), ps: [] }; for (let i = 0; i < 34; i++) { const a = i / 34 * 6.283 + R() * .2, v = rr(34, 62) * (i % 2 ? 1 : .6); f.ps.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v }); } fws.push(f); sfx('boom'); } }
      for (let i = fws.length - 1; i >= 0; i--) { fws[i].t += dt; if (fws[i].t > fws[i].max) fws.splice(i, 1); }
      if (myK && !myK.placing && R() < dt * .5) for (const o of krs) if (o !== myK && o.lit && Math.hypot(o.x - myK.x, o.y - myK.y) < 70) { parts.push({ type: 'heart', x: (o.x + myK.x) / 2, y: Math.min(o.y, myK.y) - 50, vx: rr(-6, 6), vy: -20, life: 0, max: 1.3 }); break; }
      pier.update(); if (R() < dt * 3) smoke(560 + rr(-14, 14), 930 - 118);
      pier.occ.forEach((c, i) => {
        if (!c) return; const T = c.task, me = c === P;
        if (T.state === 'go') { if (!c.path.length) { T.state = 'serve'; T.sub = 0; T.t = 0; c.dir = 'up'; if (me) openWish(); } return; }
        T.t += dt;
        if (T.sub === 0) { if (me ? T.wish !== undefined : T.t > .9) { T.sub = 1; T.t = 0; c.duckT = 1; const lit = c.lit; c.held = null; if (me) useItem('krathong'); else c.lit = false; const k = launch(c, lit, me ? T.wish : (R() < .6 ? pick(WISHES) : ''), me); if (me) { myK = k; focusT = 9; } } }
        else if (T.sub === 1) { if (T.t > 1.3) { T.sub = 2; T.t = 0; T.dur = me ? 3 : rr(4, 7); } }
        else if (T.sub === 2) { if (T.t > T.dur) { T.sub = 3; T.t = 0; c.duckT = 0; T.dur = me ? .4 : rr(1.2, 2.5); } }
        else if (T.t > T.dur) { pier.release(i); c.path = me ? [] : [{ x: SPOTS[i].x, y: 552 }, { x: 1368, y: 566 }, { x: 1368, y: 690 }, { x: 1500, y: 790 }]; cheer(c, me ? 120 : 0); if (me) toast('ลอยกระทงเรียบร้อย ขอให้สมหวังนะ'); }
      });
      for (const k of krs) {
        k.age += dt;
        if (k.placing) { k.pt += dt; k.y = lerp(k.sy, DECK[2] - 14, ease(k.pt / 1.3)); if (k.pt >= 1.3) { k.placing = false; if (k.mine) sfx('plop'); for (const m of [1.2, 1.9]) parts.push({ type: 'ring', x: k.x, y: k.y + 6, vx: 0, vy: 0, life: 0, max: m }); } continue; }
        const near = k.x > 800 && k.x < 1500, ty = near ? Math.min(k.ty, 425) : k.ty; k.vx += (k.tvx - k.vx) * dt * .4; k.x += k.vx * dt; k.y += (ty - k.y) * dt * (near && k.y > 430 ? .45 : .07);
        if (k.x > W + 40) { k.x = -40; k.wish = ''; }
      }
      if (krs.length > 90) krs.splice(0, krs.length - 90);
      for (const bt of boats) { bt.x += bt.v * dt; if (bt.x > W + 120) bt.x = -120; if (bt.x < -120) bt.x = W + 120; }
      for (const s of skyL) { s.y -= s.v * dt; s.x -= s.v * dt * .5; if (s.y < -12) { s.y = 150; s.x = R() * W; } }
    },
    drawUnder(c) {
      const x0 = camL - 60, x1 = camL + vw + 60;
      for (let j = 0; j < 6; j++) { const yy = 230 + j * 70, xx = ((time * (6 + j * 2) + j * 500) % (W + 900)) - 450; ell(c, xx, yy, 420, 16 + j * 3, 'rgba(150,140,255,.045)'); ell(c, W - xx, yy + 34, 360, 14 + j * 3, 'rgba(120,200,255,.03)'); }
      for (const f of fws) for (const q of f.ps) { const u = f.t / f.max; if (u >= 1) continue; const px = f.x + q.vx * f.t * (1 - u * .35), py = f.y + q.vy * f.t * (1 - u * .35) + 26 * f.t * f.t; c.globalAlpha = (1 - u) * (.6 + .4 * Math.sin(time * 30 + q.vx)); ell(c, px, py, 2.6, 2.6, f.col); c.globalAlpha = (1 - u) * .25; ell(c, px - q.vx * .05, py - q.vy * .05, 1.8, 1.8, f.col); }
      c.globalAlpha = 1;
      for (const f of fws) { const u = f.t / f.max; if (u < 1) { c.globalAlpha = (1 - u) * .1; ell(c, f.x, 330, 300, 130, f.col); c.globalAlpha = 1; } }
      for (const t of twinkle) if (t.x > x0 && t.x < x1) { const a = Math.sin(time * 2.4 + t.p); if (a > .7) { c.globalAlpha = (a - .7) * 2.4; c.fillStyle = '#fff'; c.fillRect(t.x - 3, t.y, 6, 1.5); c.fillRect(t.x - .75, t.y - 3, 1.5, 6); } }
      c.globalAlpha = 1;
      for (const l of farL) if (l.x > x0 && l.x < x1) for (let j = 0; j < 6; j++) { c.globalAlpha = .34 - j * .05; c.fillStyle = l.col; c.fillRect(l.x - 3 - j + Math.sin(time * 1.4 + j * 1.7 + l.x) * 3, 176 + j * 11, 6 + j * 2, 3); }
      for (let j = 0; j < 16; j++) { c.globalAlpha = .3 - j * .015; c.fillStyle = '#ffd98a'; c.fillRect(1200 - 16 - j * 1.6 + Math.sin(time * 1.2 + j) * 4, 178 + j * 10, 32 + j * 3.2, 3); }
      for (let j = 0; j < 30; j++) { c.globalAlpha = .22 - j * .006; c.fillStyle = '#eee9ff'; c.fillRect(1650 - 10 - j * 2 + Math.sin(time + j * 1.3) * 5, 180 + j * 15, 20 + j * 4, 3); }
      for (const w of waves) if (w.x > x0 && w.x < x1) { c.globalAlpha = .08 + .07 * Math.sin(time * 1.1 + w.p); c.strokeStyle = '#b9b0ff'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); const xx = w.x + Math.sin(time * .5 + w.p) * 6; c.moveTo(xx, w.y); c.lineTo(xx + w.l, w.y); c.stroke(); }
      c.globalAlpha = 1;
      for (const s of skyL) if (s.x > x0 && s.x < x1) { ell(c, s.x, s.y, 10 * s.s, 10 * s.s, 'rgba(255,170,80,.22)'); c.fillStyle = '#ffc46b'; c.fillRect(s.x - 3 * s.s, s.y - 4 * s.s, 6 * s.s, 8 * s.s); }
      const list = krs.filter(k => k.x > x0 && k.x < x1).map(k => ({ k, y: k.y })).concat(boats.map(bt => ({ bt, y: bt.y }))).sort((p, q) => p.y - q.y);
      for (const it of list) {
        if (it.bt) { const bt = it.bt, yb = bt.y + Math.sin(time * 1.3 + bt.x * .01) * 2; ell(c, bt.x, yb + 8, 90, 10, 'rgba(10,6,40,.35)'); spr(c, bt.k, bt.x, yb, { flip: bt.v < 0 }); dyn.push({ x: bt.x + (bt.v < 0 ? 70 : -70), y: yb - 40, r: 110, a: .85 }); continue; }
        const k = it.k, dep = Math.max(0, Math.min(1, (k.y - 190) / 430)), sc2 = k.placing ? lerp(.6, 1, ease(k.pt / 1.3)) : lerp(.5, 1, dep), yb = k.placing ? k.y : k.y + Math.sin(time * 1.6 + k.seed) * 1.8, inW = !k.placing || k.pt > 1.1;
        if (inW) { ell(c, k.x, yb + 6 * sc2, 44 * sc2, 9 * sc2, 'rgba(10,6,40,.3)'); c.strokeStyle = `rgba(200,190,255,${.16 + .08 * Math.sin(time * 2 + k.seed)})`; c.lineWidth = 1.5; c.beginPath(); c.ellipse(k.x, yb + 6 * sc2, (50 + Math.sin(time * 1.5 + k.seed) * 5) * sc2, 11 * sc2, 0, 0, 7); c.stroke(); }
        if (inW && k.lit) { c.fillStyle = '#ffc46b'; for (let j = 0; j < 7; j++) { c.globalAlpha = .34 - j * .045; c.fillRect(k.x - (9 - j) * sc2 + Math.sin(time * 2.2 + j * 1.3 + k.seed) * 4 * sc2, yb + (12 + j * 7) * sc2, (18 - j * 2) * sc2, 2.4); } c.globalAlpha = 1; }
        if (k === sel) { c.strokeStyle = '#ffe08a'; c.lineWidth = 3; c.setLineDash([7, 6]); c.beginPath(); c.ellipse(k.x, yb + 4 * sc2, 58 * sc2, 16 * sc2, 0, 0, 7); c.stroke(); c.setLineDash([]); }
        drawKr(c, k.kind, k.x, yb, sc2, k.lit, k.placing ? 0 : Math.sin(time * 1.2 + k.seed) * .05);
        if (k.lit) { dyn.push({ x: k.x, y: yb - 26 * sc2, r: 92 * sc2, a: .95 }); if (R() < .012 && dep > .4) parts.push({ type: 'smoke', x: k.x + 11 * sc2, y: yb - 46 * sc2, vx: rr(2, 8), vy: -12, life: 0, max: 1.6, r: 2 }); }
        if (k.mine && inW && R() < .05) parts.push({ type: 'spark', x: k.x + rr(-34, 34) * sc2, y: yb + rr(-40, 0) * sc2, vx: 0, vy: -8, life: 0, max: .7 });
      }
    },
    drawOver(c) {
      c.globalCompositeOperation = 'lighter';
      for (const f of flies) { const x = f.x + Math.sin(time * .5 * f.s + f.p) * 60, y = f.y + Math.cos(time * .7 * f.s + f.p * 2) * 26, a = .5 + .5 * Math.sin(time * 2.2 + f.p * 3); if (x < camL - 20 || x > camL + vw + 20) continue; ell(c, x, y, 8, 8, `rgba(210,255,120,${.12 * a})`); ell(c, x, y, 2.2, 2.2, `rgba(230,255,150,${.9 * a})`); }
      c.globalCompositeOperation = 'source-over';
      if (sel && selT > 0) { c.globalAlpha = Math.min(1, selT); const w = sel.wish || 'ไม่ได้บอกคำอธิษฐาน'; label(c, 'กระทงของ ' + sel.owner, sel.x, sel.y - 92, 16, '#ffe08a', 700, 'rgba(20,10,50,.9)'); label(c, '“' + w + '”', sel.x, sel.y - 70, 17, '#fff', 600, 'rgba(20,10,50,.9)'); c.globalAlpha = 1; }
      for (const k of krs) if (k.wish && !k.placing && k.x > camL - 100 && k.x < camL + vw + 100) { const life = k.mine ? 14 : 8, a = Math.min(1, k.age - 1.3, life - k.age); if (a > 0) { c.globalAlpha = a; label(c, k.wish, k.x, k.y - (k.mine ? 58 : 42) - Math.min(10, k.age * 2), k.mine ? 18 : 14, k.mine ? '#ffe08a' : '#f3e6ff', 600, 'rgba(20,10,50,.85)'); } }
      c.globalAlpha = 1;
    },
  });
}

// ============================================================ ฉากในโบสถ์
const DONATE_QR = '';   // ใส่ที่อยู่ไฟล์รูป QR ตรงนี้ภายหลัง เช่น 'qr.png' แล้วกดทำบุญจะมีหน้าต่างโชว์ QR
function buildTemple() {
  beginScene(2100, 1300);
  const MATS = [930, 1050, 1170].map(x => ({ x, y: 694 })), HOLY = { x: 420, y: 730 }, CH = { x: 1640, y: 650 };
  node('c800', 1050, 880); node('c1000', 1050, 1060); node('m', 440, 900); node('r', 1640, 880); node('door', 1050, 1262).exit = true;
  link('c800', 'c1000'); link('c800', 'm'); link('c800', 'r'); link('c1000', 'm'); link('c1000', 'r'); link('door', 'c1000'); N.c800.tight = N.c1000.tight = true;
  const pray = new Line({ name: 'แถวกราบพระ', spots: MATS, slot: i => ({ x: 1050 + (i % 2 ? 26 : -26), y: 792 + 44 * i }), max: 4, face: 'up', ready: () => true });
  const holy = new Line({ name: 'แถวรับน้ำมนต์', spots: [HOLY], slot: i => ({ x: 520 + 54 * i, y: 752 }), max: 3, face: 'left', ready: () => true });
  const monk = Object.assign(mkChar(420, 588, 6), { noLegs: true, noShadow: true }); let chestPop = 0, swing = 0;
  prop('buddha', 1050, 500, [[0, -180, 430, 1], [0, 60, 300, .9]]); prop('altar', 1050, 596, [[-84, -110, 150, .9], [84, -110, 150, .9]]); RECTS.push([850, 350, 1250, 602]);
  for (const m of MATS) ents.push({ x: m.x, y: m.y - 30, w: 60, draw(c) { spr(c, 'mat', m.x, m.y + 8); } });
  ents.push({ x: HOLY.x, y: HOLY.y - 30, w: 60, draw(c) { spr(c, 'mat', HOLY.x, HOLY.y + 8); } });
  for (const [x, y] of [[250, 440], [700, 440], [1400, 440], [1850, 440], [250, 1010], [1850, 1010]]) { ents.push({ x, y, w: 40, draw(c) { ell(c, x, y + 2, 30, 7, 'rgba(20,10,40,.3)'); spr(c, 'column', x, y); spr(c, 'lantern', x + 44, y - 236); } }); RECTS.push([x - 26, y - 30, x + 26, y + 6]); addLight(x + 44, y - 200, 230, 1); }
  ents.push({ x: 420, y: 620, w: 110, draw(c) {
    ell(c, 420, 624, 104, 12, 'rgba(20,10,40,.3)'); spr(c, 'seat_back', 420, 620); drawChar(c, monk);
    if (monk.pose === 'up') spr(c, 'brush', 420 + 72 * CS, 588 - 160 * CS, { rot: Math.sin(swing * 9) * .7 });
    spr(c, 'seat_front', 420, 620); for (let i = 0; i < Math.min(3, gifts); i++) spr(c, 'it_sangha', 470 + i * 26, 618); board(c, 420, 432, 'พรมน้ำมนต์ · ถวายสังฆทาน', 20);
  } }); RECTS.push([290, 500, 550, 626]); addLight(420, 540, 260, .95);
  ents.push({ x: CH.x, y: CH.y, w: 70, draw(c) {
    ell(c, CH.x, CH.y + 3, 62, 9, 'rgba(20,10,40,.3)'); spr(c, 'chest', CH.x, CH.y, { sx: 1 + chestPop * .1, sy: 1 - chestPop * .12 });
    label(c, 'ทำบุญ', CH.x, CH.y - 28, 17, '#6b3a1e', 700); board(c, CH.x, CH.y - 122, 'หีบบริจาค', 22);
  } }); RECTS.push([CH.x - 56, CH.y - 56, CH.x + 56, CH.y + 4]); addLight(CH.x, CH.y - 60, 240, .95);
  prop('sangha_table', 1640, 1010, [[0, -60, 240, .95]]); RECTS.push([1545, 958, 1735, 1014]); ents.push({ x: 1640, y: 1011, w: 100, draw(c) { board(c, 1640, 880, 'ชุดสังฆทาน', 22); } });
  let gifts = 0; const tpets = []; addPet(tpets, 'cat', 1, 330, 940); addPet(tpets, 'cat', 0, 1500, 1130);
  ents.push({ x: 1050, y: 1296, w: 120, draw(c) { board(c, 1050, 1262, 'ออกไปตลาด ↓', 22); } }); addLight(1050, 1200, 240, .8);
  ents.push({ x: 1290, y: 770, w: 100, draw(c) { board(c, 1290, 742, '← ต่อแถวกราบพระ', 19); } });
  addLight(600, 760, 330, .5); addLight(1500, 760, 330, .5); addLight(1050, 950, 380, .55); addLight(420, 1050, 320, .45); addLight(1680, 1050, 320, .45);
  // พื้นหลัง
  const [bg, b] = newBG(); b.fillStyle = '#231320'; b.fillRect(0, 0, W, H);
  for (let y = 320, r = 0; y < H; y += 70, r++) for (let x = 120, q = 0; x < W - 120; x += 70, q++) { b.fillStyle = (r + q) % 2 ? '#b89272' : '#a47e62'; b.fillRect(x, y, 70, 70); }
  b.fillStyle = '#a3262a'; b.fillRect(950, 320, 200, H - 320); b.fillStyle = '#f2c14e'; b.fillRect(958, 320, 7, H - 320); b.fillRect(1135, 320, 7, H - 320);
  b.fillStyle = '#8a2f2c'; b.fillRect(120, 0, W - 240, 320);
  for (let y = 62, r = 0; y < 280; y += 40, r++) for (let x = 150 + (r % 2) * 30; x < W - 140; x += 60) { b.beginPath(); b.moveTo(x, y - 9); b.lineTo(x + 7, y); b.lineTo(x, y + 9); b.lineTo(x - 7, y); b.closePath(); b.fillStyle = '#d9a441'; b.fill(); }
  b.fillStyle = '#d9a441'; b.fillRect(120, 0, W - 240, 34); b.fillRect(120, 288, W - 240, 32); b.strokeStyle = '#33211f'; b.lineWidth = 5; b.strokeRect(120, -10, W - 240, 330); b.beginPath(); b.moveTo(120, 34); b.lineTo(W - 120, 34); b.moveTo(120, 288); b.lineTo(W - 120, 288); b.lineWidth = 3; b.stroke();
  for (const x of [470, 1630]) { b.beginPath(); b.moveTo(x - 62, 270); b.lineTo(x - 62, 120); b.quadraticCurveTo(x - 58, 70, x, 52); b.quadraticCurveTo(x + 58, 70, x + 62, 120); b.lineTo(x + 62, 270); b.closePath(); b.fillStyle = '#d9a441'; b.fill(); b.lineWidth = 4; b.stroke(); b.beginPath(); b.moveTo(x - 46, 262); b.lineTo(x - 46, 124); b.quadraticCurveTo(x - 42, 88, x, 74); b.quadraticCurveTo(x + 42, 88, x + 46, 124); b.lineTo(x + 46, 262); b.closePath(); b.fillStyle = '#1b1650'; b.fill(); b.stroke(); for (let i = 0; i < 9; i++) ell(b, x - 36 + rndT() * 72, 100 + rndT() * 140, 1.4, 1.4, '#fff'); }
  b.beginPath(); b.moveTo(810, 320); b.lineTo(810, 160); b.quadraticCurveTo(830, 44, 1050, 12); b.quadraticCurveTo(1270, 44, 1290, 160); b.lineTo(1290, 320); b.closePath(); b.fillStyle = '#d9a441'; b.fill(); b.lineWidth = 5; b.stroke();
  b.beginPath(); b.moveTo(836, 320); b.lineTo(836, 166); b.quadraticCurveTo(854, 66, 1050, 40); b.quadraticCurveTo(1246, 66, 1264, 166); b.lineTo(1264, 320); b.closePath(); b.fillStyle = '#5a1c26'; b.fill(); b.lineWidth = 3; b.stroke();
  let gd = b.createLinearGradient(120, 0, 260, 0); gd.addColorStop(0, 'rgba(20,8,24,.55)'); gd.addColorStop(1, 'rgba(20,8,24,0)'); b.fillStyle = gd; b.fillRect(120, 0, 140, H);
  gd = b.createLinearGradient(W - 120, 0, W - 260, 0); gd.addColorStop(0, 'rgba(20,8,24,.55)'); gd.addColorStop(1, 'rgba(20,8,24,0)'); b.fillStyle = gd; b.fillRect(W - 260, 0, 140, H);
  b.fillStyle = 'rgba(255,213,138,.25)'; b.fillRect(930, H - 60, 240, 60);
  function rndT() { return Math.random(); }
  const burst = (x, y, n = 10) => { for (let i = 0; i < n; i++) parts.push({ type: 'spark', x: x + rr(-30, 30), y: y + rr(-30, 10), vx: rr(-30, 30), vy: rr(-60, -20), life: 0, max: rr(.5, 1) }); };
  const BLESS = ['ขอให้เจริญสุข อายุมั่นขวัญยืน', 'ขอให้คิดสิ่งใดสมปรารถนา', 'ขอให้พ้นทุกข์พ้นภัย', 'ขอให้มั่งมีศรีสุข'];
  endScene({
    name: 'temple', title: 'ฉากที่ 2 · ในโบสถ์', bg, fade: [-300, -200], darkA: .3, nBots: 7, pray, holy, pets: tpets, walkers: WALKERS.filter(i => i !== 3),
    blocked: (x, y) => x < 150 || x > 1950 || y < 352,
    browse: [
      () => ({ node: 'm', x: rr(220, 820), y: rr(880, 1150), dir: 'up' }), () => ({ node: 'r', x: rr(1280, 1880), y: rr(880, 1150), dir: 'up' }),
      () => ({ node: 'r', x: rr(1300, 1500), y: rr(700, 800), dir: 'up' }), () => ({ node: 'm', x: rr(620, 800), y: rr(700, 800), dir: 'up' }),
    ],
    plan(b) {
      const p = [], br = () => p.push({ t: 'browse' }); br();
      if (META.cast[b.ci].monk) { br(); br(); p.push({ t: 'exit' }); return p; }
      p.push({ t: 'pray' }); if (R() < .3) { p.push({ t: 'sangha' }); p.push({ t: 'holy' }); } else if (R() < .5) p.push({ t: 'holy' }); if (R() < .5) p.push({ t: 'donate' }); if (R() < .6) br(); p.push({ t: 'exit' }); return p;
    },
    step(b, s) {
      if (s.t === 'pray') { route(b, 'c1000', null); s.arrive = () => { if (!pray.full()) pray.join(b); }; }
      else if (s.t === 'holy') { route(b, 'm', { x: 640, y: 780 }); s.arrive = () => { if (!holy.full()) holy.join(b); }; }
      else if (s.t === 'sangha') { route(b, 'r', { x: 1640 + rr(-40, 40), y: 1052 }); s.arrive = () => { b.dir = 'up'; b.held = 'sangha'; b.wait = .6; }; }
      else if (s.t === 'donate') { route(b, 'r', { x: CH.x + rr(-30, 30), y: CH.y + 62 }); s.arrive = () => { b.dir = 'up'; b.pose = 'up'; b.wait = 1.1; b.after = () => { b.pose = null; chestPop = 1; burst(CH.x, CH.y - 80, 6); }; }; }
    },
    interact() {
      if (Math.hypot(P.x - HOLY.x, P.y - 760) < 150) return { label: hasItem('sangha') ? 'ถวายสังฆทาน' : 'ขอพรมน้ำมนต์', act() { if (holy.full()) toast('มีคนรออยู่หลายคน รอสักครู่นะ'); else holy.join(P); } };
      if (Math.hypot(P.x - CH.x, P.y - (CH.y + 60)) < 110) return { label: 'หยอดเหรียญทำบุญ', act() {
        P.dir = 'up'; sfx('coin'); parts.push({ type: 'coin', x: P.x + 26, y: P.y - 70, x1: CH.x, y1: CH.y - 66, vx: 0, vy: 0, life: 0, max: .7 });
        doBusy('up', .9, () => { chestPop = 1; burst(CH.x, CH.y - 80, 16); toast('สาธุ ขออนุโมทนาบุญ'); if (DONATE_QR) { $('donateImg').src = DONATE_QR; $('donate').style.display = 'flex'; } });
      } };
      if (Math.hypot(P.x - 1640, P.y - 1060) < 110) return { label: hasItem('sangha') ? 'มีชุดสังฆทานแล้ว' : 'รับชุดสังฆทาน', act() { if (hasItem('sangha')) return toast('นำไปถวายพระที่อาสนะด้านซ้ายได้เลย'); addItem('sangha'); P.held = 'sangha'; renderInv(); sfx('buy'); toast('ได้ชุดสังฆทานแล้ว นำไปถวายพระที่อาสนะด้านซ้าย'); } };
      if (Math.abs(P.x - 1050) < 240 && P.y > 640 && P.y < 1090) return { label: 'ต่อแถวกราบพระ', act() { if (pray.full()) toast('แถวยาวอยู่ รอสักครู่นะ'); else pray.join(P); } };
      if (P.y > 1180 && Math.abs(P.x - 1050) < 150) return { label: 'ออกไปตลาด', act() { enterScene('market', 520, 340, 'down'); } };
      return null;
    },
    update(dt) {
      pray.update(); holy.update(); chestPop = Math.max(0, chestPop - dt * 4); animChar(monk, dt);
      pray.occ.forEach((c, i) => {
        if (!c) return; const T = c.task, me = c === P;
        if (T.state === 'go') { if (!c.path.length) { T.state = 'serve'; T.sub = 1; T.t = 0; c.dir = 'up'; T.dur = me ? 5 : rr(5, 9); } return; }
        T.t += dt; c.duckT = T.t < T.dur ? 1 + Math.max(0, Math.sin(T.t * 2.2 - .6)) * .9 : 0;
        if (T.t > T.dur + .5) { pray.release(i); c.duckT = 0; if (me) { sfx('bell'); burst(P.x, P.y - 90, 12); toast('กราบพระเรียบร้อย จิตใจผ่องใส'); } }
      });
      const c = holy.occ[0]; monk.pose = null;
      if (c) {
        const T = c.task, me = c === P;
        if (T.state === 'go') { if (!c.path.length) { T.state = 'serve'; T.sub = 1; T.t = 0; c.dir = 'up'; c.duckT = 1; swing = 0; T.offer = me ? !!hasItem('sangha') : c.held === 'sangha'; if (T.offer) { c.held = null; if (me) useItem('sangha'); parts.push({ type: 'fly', spr: 'it_sangha', x: c.x, y: c.y - 40, x1: 470 + Math.min(2, gifts) * 26, y1: 618, vx: 0, vy: 0, life: 0, max: .8 }); gifts++; } if (me) sfx(T.offer ? 'bell' : 'water'); } }
        else {
          T.t += dt; swing += dt; monk.pose = T.t > .3 && T.t < 3 ? (T.offer ? 'wai' : 'up') : null;
          if (monk.pose === 'up' && R() < dt * 16) parts.push({ type: 'drop', x: 450 + rr(-20, 30), y: 520, vx: rr(-30, 20), vy: rr(150, 230), life: 0, max: rr(.7, 1) });
          if (T.t > 3.4) { holy.release(0); c.duckT = 0; if (me) { P.bless = T.offer ? 150 : 60; sfx('bell'); burst(P.x, P.y - 90, T.offer ? 24 : 14); toast((T.offer ? 'ถวายสังฆทานแล้ว อนุโมทนาบุญ · ' : '') + 'พระท่านให้พร: ' + pick(BLESS)); } else c.path = [{ x: 520, y: 860 }]; }
        }
      }
    },
  });
}

// ---------- lighting ----------
function radial(a, m, z) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, a); gr.addColorStop(.45, m); gr.addColorStop(1, z); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c; }
const HOLE = radial('rgba(0,0,0,1)', 'rgba(0,0,0,.55)', 'rgba(0,0,0,0)'), GLOW = radial('rgba(255,185,95,.9)', 'rgba(255,160,70,.28)', 'rgba(255,140,60,0)');
const dyn = [];
function drawLighting() {
  const w = dark.width, h = dark.height, s = sc / 2;
  dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, w, h); dg.fillStyle = `rgba(16,10,52,${cur.darkA || .5})`; dg.fillRect(0, 0, w, h);
  dg.globalCompositeOperation = 'destination-out';
  const y0 = (cur.fade[0] - camT) * s, y1 = (cur.fade[1] - camT) * s;
  if (y1 > 0) { const gr = dg.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, w, y1); }
  const vis = []; for (const L of lights.concat(dyn)) if (L.x + L.r > camL && L.x - L.r < camL + vw && L.y + L.r > camT && L.y - L.r < camT + VIEW_H) vis.push(L);
  for (const L of vis) { dg.globalAlpha = L.a; dg.drawImage(HOLE, (L.x - L.r - camL) * s, (L.y - L.r - camT) * s, L.r * 2 * s, L.r * 2 * s); }
  dg.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dark, 0, 0, cv.width, cv.height);
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc); g.globalCompositeOperation = 'lighter';
  for (const L of vis) { g.globalAlpha = .17 * L.a * (1 + Math.sin(time * 3 + L.x) * .06); const r = L.r * .85; g.drawImage(GLOW, L.x - r, L.y - r, r * 2, r * 2); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- render ----------
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0f0d30'; g.fillRect(0, 0, cv.width, cv.height);
  if (!cur) return;
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc);
  g.drawImage(cur.bg, camL * BGS, camT * BGS, vw * BGS, VIEW_H * BGS, camL, camT, vw, VIEW_H);
  dyn.length = 0; if (cur.drawUnder) cur.drawUnder(g);
  const list = [];
  for (const e of ents) if (e.x + e.w + 200 > camL && e.x - e.w - 200 < camL + vw) list.push(e);
  for (const b of bots) if (!b.hidden) list.push(b); if (!P.hidden) list.push(P);
  if (P.bless > 0 && !P.hidden) dyn.push({ x: P.x, y: P.y - 60, r: 120, a: .8 });
  for (const e of list) { if (e.held === 'lantern') dyn.push({ x: e.x + 20, y: e.y - 40, r: 150, a: .9 }); else if (e.held === 'krathong' && e.lit) dyn.push({ x: e.x, y: e.y - 40, r: 90, a: .85 }); }
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.draw ? e.draw(g) : drawChar(g, e);
  for (const p of parts) if (p.type === 'smoke') { const u = p.life / p.max; ell(g, p.x, p.y, p.r * (1 + u * 1.6), p.r * (1 + u * 1.6), `rgba(240,230,235,${.28 * (1 - u)})`); } else if (p.type === 'ring') { const u = p.life / p.max, r = 12 + u * 30; g.beginPath(); g.ellipse(p.x, p.y, r, r * .38, 0, 0, 7); g.strokeStyle = `rgba(255,232,200,${.55 * (1 - u)})`; g.lineWidth = 1.8; g.stroke(); }
  drawLighting();
  for (const [x1, y1, x2, y2, sag] of STRINGS) if (x2 > camL - 50 && x1 < camL + vw + 50) {
    const wv = Math.sin(time * 1.1 + x1 * .01), sg = sag * (1 + wv * .12), wx = wv * 10;
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2 + wx * 2, (y1 + y2) / 2 + sg * 2, x2, y2); g.strokeStyle = '#33211f'; g.lineWidth = 2; g.stroke();
    const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 34);
    for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x1, x2, u) + wx * 4 * u * (1 - u), y = lerp(y1, y2, u) + sg * 4 * u * (1 - u) + 5, on = .75 + .25 * Math.sin(time * 3 + i * 1.7 + x1); ell(g, x, y, 10, 10, `rgba(255,200,110,${.2 * on})`); ell(g, x, y, 4.4, 5.2, BULB[i % 4]); }
  }
  for (const p of parts) {
    const u = p.life / p.max; g.globalAlpha = 1 - u;
    if (p.type === 'spark') { g.strokeStyle = '#fff4b0'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x - 6, p.y); g.lineTo(p.x + 6, p.y); g.moveTo(p.x, p.y - 6); g.lineTo(p.x, p.y + 6); g.stroke(); }
    else if (p.type === 'coin') { g.globalAlpha = 1; const x = lerp(p.x, p.x1, u), y = lerp(p.y, p.y1, u) - Math.sin(u * Math.PI) * 60; ell(g, x, y, 7, 7 * Math.abs(Math.cos(u * 12)) + 2, '#f2c14e'); g.strokeStyle = '#33211f'; g.lineWidth = 2.5; g.stroke(); }
    else if (p.type === 'fly') { g.globalAlpha = 1; spr(g, p.spr, lerp(p.x, p.x1, u), lerp(p.y, p.y1, u) - Math.sin(u * Math.PI) * 50); }
    else if (p.type === 'drop') { ell(g, p.x, p.y, 2.6, 4.2, '#bfe6ff'); }
    else if (p.type === 'heart') { ell(g, p.x - 3.5, p.y, 4.5, 4.5, '#ff7fa0'); ell(g, p.x + 3.5, p.y, 4.5, 4.5, '#ff7fa0'); g.beginPath(); g.moveTo(p.x - 8, p.y + 1.5); g.lineTo(p.x + 8, p.y + 1.5); g.lineTo(p.x, p.y + 11); g.closePath(); g.fill(); }
  }
  g.globalAlpha = 1;
  if (cur.wind) for (const l of LEAVES) { const x = camL + ((l.x + time * l.v) % (vw + 80)) - 40, y = camT + ((l.y + time * l.v * .35 + Math.sin(time * 1.6 + l.p) * 26) % (VIEW_H + 40)) - 20; g.save(); g.translate(x, y); g.rotate(time * 2.4 + l.p); g.globalAlpha = .85; ell(g, 0, 0, 6.5, 3, l.c); g.restore(); }
  g.globalAlpha = 1;
  if (cur.drawOver) cur.drawOver(g);
  for (const s of stalls) if (s.sayT > 0) bubble(g, s.cx + 84, s.by - 132, s.say);
  if (started && P.duck < .3 && !P.hidden) label(g, P.name, P.x, P.y + P.hop - 142 + P.duck * 13, 15, '#fff', 700, 'rgba(30,15,50,.9)');
}

// ---------- main ----------
let last = performance.now();
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; tick(dt); render(); requestAnimationFrame(frame); }
function tick(dt) {
  time += dt;
  for (const s of stalls) { updStall(s, dt); animChar(s.vendor, dt); }
  if (cur.update) cur.update(dt);
  if (cur.pets) for (const a of cur.pets) updPet(a, dt);
  updPlayer(dt); for (const b of bots) updBot(b, dt); separate(); updParts(dt); updPrompt();
  animChar(P, dt); for (const b of bots) animChar(b, dt);
  const stp = Math.sin(P.phase) > 0; if (P.moving && !P.task && stp !== P.ls) sfx('step'); P.ls = stp;
  if (P.bless > 0) { P.bless -= dt; if (R() < dt * 2.5) parts.push({ type: 'spark', x: P.x + rr(-26, 26), y: P.y - rr(20, 130), vx: 0, vy: -16, life: 0, max: .8 }); }
  const fc = cur.focus && cur.focus(), fx = fc ? fc.x : P.x, fy = fc ? fc.y : P.y - 62, fk = Math.min(1, dt * (fc ? 2.2 : 5));
  cam.x += (fx - cam.x) * fk; cam.y += (fy - cam.y) * fk;
  camL = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.x - vw / 2)); camT = Math.max(0, Math.min(H - VIEW_H, cam.y - VIEW_H / 2));
}
function buildLooks() {
  let sel = WALKERS.indexOf(8);
  WALKERS.forEach((ci, i) => {
    const c = document.createElement('canvas'); c.width = 150; c.height = 170; if (i === sel) c.className = 'sel'; c.title = META.cast[ci].name;
    const x = c.getContext('2d'); spr(x, `c${ci}_legs0`, 75, 158); spr(x, `c${ci}_f_stand`, 75, 158);
    c.onclick = () => { sel = i; P.ci = ci; [...$('looks').children].forEach((el, j) => el.className = j === i ? 'sel' : ''); $('lookName').textContent = META.cast[ci].name; };
    $('looks').appendChild(c);
  });
  $('lookName').textContent = META.cast[8].name;
}
function startGame() { P.name = $('name').value.trim() || 'ฉัน'; $('start').style.display = 'none'; started = true; audioInit(); startAmbient(); if (document.activeElement) document.activeElement.blur(); toast('ยินดีต้อนรับสู่งานวัดลอยกระทง'); }
$('goBtn').onclick = startGame; $('mute').onclick = toggleMute;
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
window.G = { P, inv, keys, toast, addItem, enterScene, SCENES, get cur() { return cur; }, get bots() { return bots; }, get stalls() { return stalls; }, step(n) { for (let i = 0; i < n; i++) tick(1 / 30); render(); } };
if (document.fonts && document.fonts.load) document.fonts.load(F(20, 700), 'ลอยกระทง');
loadAssets().then(() => { buildPier(); buildTemple(); buildMarket(); useScene(SCENES.market); $('sceneName').textContent = cur.title; buildLooks(); renderInv(); $('loading').style.display = 'none'; G.ready = true; requestAnimationFrame(frame); })
  .catch(e => { $('loading').textContent = 'โหลดเกมไม่สำเร็จ: ' + e.message; console.error(e); });
