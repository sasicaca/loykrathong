'use strict';
// ============================================================
//  งานวัดลอยกระทง (ยุคโบราณ) — ฉากที่ 1: ตลาด
//  ภาพทั้งหมดมาจาก assets.js (สร้างด้วย tools/gen_assets.py)
// ============================================================
let VIEW_H = 620;
const W = 3500, H = 1480, BGS = 1.5, RS = 2, CS = META.cs;
const cv = document.getElementById('game'), g = cv.getContext('2d');
const dark = document.createElement('canvas'), dg = dark.getContext('2d');
let sc = 1, vw = 1280, camL = 0, camT = 0, time = 0, started = false, BG = null;
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
function mkChar(x, y, ci) { return { x, y, ci, dir: 'down', phase: R() * 6, seed: R() * 10, moving: false, pose: null, held: null, path: [], task: null, speed: 90, wait: 0, mv: 0, turn: 0, hop: 0, hopV: 0, joy: 0, pop: 0, pdir: 'down' }; }
function animChar(c, dt) {
  const k = r => Math.min(1, dt * r);
  c.mv += ((c.moving ? 1 : 0) - c.mv) * k(12);
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
  else if (ch.joy > 0 && !ch.moving && !m.monk && ch.held !== 'krathong') { pose = 'up'; view = 'f'; flip = false; }
  else if (ch.held === 'krathong') pose = 'hold';
  let name = `c${ch.ci}_${view}_${pose}`; if (!SPR[name]) { name = `c${ch.ci}_${view}_stand`; pose = 'stand'; }
  const sw = Math.sin(ch.phase), bob = Math.abs(sw) * 3 * mv + Math.sin(time * 2.2 + ch.seed) * .6 * (1 - mv);
  const wk = mv > .3 ? (sw > 0 ? 1 : 2) : 0, sgn = flip ? -1 : 1, yy = y + ch.hop, ub = yy - bob;
  if (!ch.noShadow) { const s = 1 + ch.hop / 45; ell(c, x, y + 1, 24 * s, 6 * s, 'rgba(20,10,40,.3)'); }
  if (!ch.noLegs) spr(c, `c${ch.ci}_legs${wk}`, x, yy, { flip });
  const kr = ch.held === 'krathong' ? (ch.lit ? 'it_krathong_lit' : 'it_krathong') : null;
  if (kr && view === 'b' && !ch.hideItem) spr(c, kr, x, ub - 66 * CS);
  spr(c, name, x, ub, { flip, rot: (view === 's' ? sgn * .05 : sw * .04) * mv, sx: (1 - Math.sin(ch.turn * Math.PI) * .2) * (1 + ch.pop * .08), sy: 1 + Math.cos(ch.phase * 2) * .02 * mv - ch.pop * .1 + Math.sin(time * 2.2 + ch.seed) * .008 });
  if (ch.hideItem) return;
  if (kr && view !== 'b') spr(c, kr, x + (view === 's' ? sgn * 8 : 0), ub - 66 * CS);
  else if (ch.held && !kr) {
    const it = ITEMS[ch.held].spr, pk = 1 + Math.max(0, ch.joy - 1.1) * 1.5;
    if (pose === 'eat') spr(c, it, x + 44 * CS - Math.max(0, Math.sin(time * 9)) * 5, ub - 150 * CS, { rot: -.5, k: pk });
    else if (pose === 'up') spr(c, it, x + 72 * CS, ub - 166 * CS, { k: pk });
    else spr(c, it, x + sgn * 56 * CS * (view === 's' ? .5 : 1), ub - 60 * CS + sw * 1.5 * mv, { k: pk });
  }
}

// ---------- world ----------
const lights = [], ents = [];
const LOTX = [330, 670, 1010, 1350, 1690, 2030], ROWY = [620, 1080], GATES = [{ x: 520, name: 'โบสถ์' }, { x: 1860, name: 'ท่าน้ำ' }];
function addLight(x, y, r, a = 1) { lights.push({ x, y, r, a }); }
function prop(name, x, y, lt) { if (lt) for (const [dx, dy, r, a] of lt) addLight(x + dx, y + dy, r, a); const e = { x, y, w: SPR[name].w, draw(c) { ell(c, x, y + 2, SPR[name].w * .22, 7, 'rgba(20,10,40,.28)'); spr(c, name, x, y); } }; ents.push(e); return e; }
function buildBG() {
  const bg = document.createElement('canvas'); bg.width = W * BGS; bg.height = H * BGS;
  const b = bg.getContext('2d'), rnd = seeded(7); b.scale(BGS, BGS);
  let gr = b.createLinearGradient(0, 0, 0, 230); gr.addColorStop(0, '#0f0d30'); gr.addColorStop(1, '#2f2466'); b.fillStyle = gr; b.fillRect(0, 0, W, 240);
  for (let i = 0; i < 200; i++) ell(b, rnd() * W, rnd() * 150, rnd() * 1.3 + .4, rnd() * 1.3 + .4, `rgba(255,255,255,${.3 + rnd() * .6})`);
  const mx = 1250, my = 70; gr = b.createRadialGradient(mx, my, 20, mx, my, 150); gr.addColorStop(0, 'rgba(230,225,255,.4)'); gr.addColorStop(1, 'rgba(230,225,255,0)'); b.fillStyle = gr; b.fillRect(mx - 150, my - 150, 300, 300);
  ell(b, mx, my, 32, 32, '#fbf6e6'); b.lineWidth = 4; b.strokeStyle = '#33211f'; b.stroke();
  // แนวไม้หลังรั้ว + เงาวัดกับแสงท่าน้ำ
  for (const gt of GATES) { gr = b.createRadialGradient(gt.x, 200, 10, gt.x, 200, 260); gr.addColorStop(0, 'rgba(255,190,110,.4)'); gr.addColorStop(1, 'rgba(255,190,110,0)'); b.fillStyle = gr; b.fillRect(gt.x - 260, -60, 520, 320); }
  b.beginPath(); b.moveTo(0, 250); for (let x = 0; x <= W; x += 40) b.quadraticCurveTo(x + 20, 150 + rnd() * 40, x + 40, 190 + rnd() * 20); b.lineTo(W, 250); b.closePath(); b.fillStyle = '#1b1a3e'; b.fill();
  b.fillStyle = '#e0a23a'; b.beginPath(); b.moveTo(430, 200); b.quadraticCurveTo(500, 150, 520, 96); b.quadraticCurveTo(540, 150, 610, 200); b.closePath(); b.fill(); b.lineWidth = 4; b.strokeStyle = '#33211f'; b.stroke();
  // ลานดิน
  gr = b.createLinearGradient(0, 240, 0, H); gr.addColorStop(0, '#8d6b5c'); gr.addColorStop(1, '#6f5357'); b.fillStyle = gr; b.fillRect(0, 240, W, H - 240);
  for (let i = 0; i < 110; i++) ell(b, rnd() * W, 270 + rnd() * (H - 280), 40 + rnd() * 90, 10 + rnd() * 16, `rgba(40,20,30,${.04 + rnd() * .05})`);
  const worn = (x, y, rx, ry) => ell(b, x, y, rx, ry, 'rgba(255,225,190,.07)');
  for (const y of [330, 800, 1290]) for (let x = 60; x < W; x += 90) worn(x + rnd() * 40, y + rnd() * 30 - 15, 80, 34);
  for (const x of [150, 1180, 2350, 520, 1860]) for (let y = 300; y < 1320; y += 80) worn(x + rnd() * 30 - 15, y, 46, 50);
  for (let i = 0; i < 150; i++) { const x = rnd() * W, y = 290 + rnd() * (H - 310); if (Math.abs(y - 800) < 70 || Math.abs(y - 1290) < 70 || Math.abs(y - 330) < 40) continue; b.strokeStyle = '#4f8a52'; b.lineWidth = 3.2; b.lineCap = 'round'; b.beginPath(); b.moveTo(x - 7, y); b.quadraticCurveTo(x - 5, y - 10, x - 9, y - 15); b.moveTo(x, y); b.quadraticCurveTo(x, y - 12, x + 2, y - 19); b.moveTo(x + 7, y); b.quadraticCurveTo(x + 5, y - 10, x + 11, y - 15); b.stroke(); }
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = 290 + rnd() * (H - 310); ell(b, x, y, 7 + rnd() * 6, 4 + rnd() * 3, '#a58c84'); b.lineWidth = 2; b.strokeStyle = '#33211f'; b.stroke(); }
  for (let x = 100; x < W; x += 204) if (!GATES.some(gt => Math.abs(x - gt.x) < 170)) spr(b, 'fence', x, 268);
  return bg;
}

// ---------- queues ----------
class Line {
  constructor(o) { Object.assign(this, o); this.members = []; this.occ = o.spots.map(() => null); }
  full() { return this.members.length >= this.max; }
  join(c) { this.members.push(c); c.task = { line: this, state: 'wait', i: -1 }; c.path = []; }
  leave(c) { const i = this.members.indexOf(c); if (i >= 0) this.members.splice(i, 1); c.task = null; c.path = []; }
  release(i) { const c = this.occ[i]; this.occ[i] = null; if (c) { c.task = null; c.pose = null; } return c; }
  update() {
    for (let i = 0; i < this.spots.length; i++) if (!this.occ[i] && this.members.length && this.ready()) { const c = this.members.shift(); this.occ[i] = c; c.task.state = 'go'; c.task.spot = i; c.path = [this.spots[i]]; }
    this.members.forEach((c, i) => { if (c.task.i !== i) { c.task.i = i; c.path = [this.slot(i)]; } else if (!c.path.length) c.dir = this.face; });
  }
}

// ---------- items & stalls ----------
const ITEMS = {
  kanom: { name: 'ขนมไทย', edible: true, verb: 'กิน', spr: 'it_kanom' },
  drink: { name: 'น้ำตาลสด', edible: true, verb: 'ดื่ม', spr: 'it_drink' },
  krathong: { name: 'กระทง', spr: 'it_krathong' },
  lantern: { name: 'โคมกระดาษ', spr: 'it_lantern' },
};
const STALL_DEFS = [
  { id: 'kanom', row: 0, lot: 1, sign: 'ขนมไทย', price: 'ห่อละ 1 อัฐ', item: 'kanom', cook: 2.4, buy: 'ซื้อขนมไทย', vendor: 11 },
  { id: 'drink', row: 0, lot: 3, sign: 'น้ำตาลสด', price: 'กระบอกละ 1 อัฐ', item: 'drink', cook: 2.0, buy: 'ซื้อน้ำตาลสด', vendor: 12 },
  { id: 'lantern', row: 1, lot: 2, sign: 'โคมกระดาษ', price: 'ใบละ 2 อัฐ', item: 'lantern', cook: 2.2, buy: 'ซื้อโคมกระดาษ', vendor: 11 },
];
const STALL = {}, stalls = [], RECTS = [];
function makeStall(d) {
  const cx = LOTX[d.lot], by = ROWY[d.row];
  const s = Object.assign({ cx, by, x: cx, y: by, w: 170, anim: 'idle', t: 0, say: '', sayT: 0 }, d);
  s.vendor = mkChar(cx, by - 30, d.vendor); s.vendor.noLegs = s.vendor.noShadow = s.vendor.hideItem = true;
  s.line = new Line({ spots: [{ x: cx, y: by + 34 }], slot: i => ({ x: cx, y: by + 78 + 44 * i }), max: 3, face: 'up', ready: () => s.anim === 'idle' });
  s.draw = c => drawStall(c, s);
  addLight(cx, by - 70, 250, 1); addLight(cx - 122, by - 110, 110, .8); addLight(cx + 122, by - 110, 110, .8); addLight(cx, by + 40, 190, .7);
  RECTS.push([cx - 132, by - 150, cx + 132, by + 6]);
  STALL[d.id] = s; stalls.push(s); ents.push(s);
}
function say(s, t) { s.say = t; s.sayT = 2.2; }
function give(c, id) {
  cheer(c, c === P ? 150 : 110);
  for (let i = 0; i < 5; i++) parts.push({ type: 'spark', x: c.x + rr(-22, 22), y: c.y - rr(30, 90), vx: rr(-14, 14), vy: rr(-30, -10), life: 0, max: rr(.4, .8) });
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
    v.held = (s.t * 4 | 0) % 2 ? 'krathong' : null; v.y = s.by - 30 + Math.abs(Math.sin(s.t * 9)) * 2.5;   // ท่าหยิบจัดของ
    if (R() < dt * 6) parts.push({ type: 'spark', x: s.cx + rr(-60, 60), y: s.by - 84 + rr(-12, 6), vx: 0, vy: -14, life: 0, max: .6 });
    if (s.t > s.cook) { s.anim = 'hand'; s.t = 0; v.held = null; }
  } else if (s.anim === 'hand') {
    v.pose = 'up';
    if (s.t > .75) { give(c, s.item); s.line.release(0); s.anim = 'idle'; say(s, 'ได้แล้วจ้ะ'); v.joy = 1.2; if (c === P) toast(ITEMS[s.item].edible ? `ได้${ITEMS[s.item].name}แล้ว กด F เพื่อ${ITEMS[s.item].verb}` : `ได้${ITEMS[s.item].name}แล้ว ถือเดินส่องทางได้เลย`); }
  }
}
function drawStall(c, s) {
  const { cx, by } = s;
  ell(c, cx, by + 4, 134, 12, 'rgba(20,10,40,.3)');
  spr(c, 'stall_back', cx, by);
  drawChar(c, s.vendor);
  spr(c, 'stall_' + s.id, cx, by);
  label(c, s.sign, cx, by - 185, 31, '#fff1cc', 700);
  tag(c, cx - 56, by - 50, s.price);
  if (s.anim === 'hand') { const u = ease(s.t / .7); spr(c, ITEMS[s.item].spr, lerp(cx + 30, cx + 22, u), lerp(by - 96, by - 6, u) - Math.sin(u * Math.PI) * 26, { k: 1 + Math.sin(u * Math.PI) * .3 }); }
}

// ---------- navigation ----------
const N = {};
const node = (k, x, y) => N[k] = { k, x, y, adj: [] }, link = (a, b) => { N[a].adj.push(N[b]); N[b].adj.push(N[a]); };
const LX = [150, ...LOTX, 2350, 2700, 3000, 3440];
for (const [p, y] of [['m', 800], ['l', 1290]]) LX.forEach((x, i) => { node(p + x, x, y); if (i) link(p + LX[i - 1], p + x); });
const BX = [150, 520, 1180, 1860, 2350, 3440]; BX.forEach((x, i) => { node('b' + x, x, 335); if (i) link('b' + BX[i - 1], 'b' + x); });
node('m1180', 1180, 800); node('l1180', 1180, 1290); link('m1010', 'm1180'); link('m1180', 'm1350'); link('l1010', 'l1180'); link('l1180', 'l1350');
for (const x of [150, 1180, 2350, 3440]) { link('b' + x, 'm' + x); link('m' + x, 'l' + x); }
for (const gt of GATES) { node('g' + gt.x, gt.x, 262); link('g' + gt.x, 'b' + gt.x); }
function nearest(x, y) { let best = null, bd = 1e9; for (const k in N) { const n = N[k], d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd && !k.startsWith('g')) { bd = d; best = n; } } return best; }
function route(b, target, final) {
  const from = nearest(b.x, b.y), to = N[target], prev = new Map([[from, null]]), q = [from];
  while (q.length) { const n = q.shift(); if (n === to) break; for (const m of n.adj) if (!prev.has(m)) { prev.set(m, n); q.push(m); } }
  const out = []; for (let n = to; n; n = prev.get(n)) out.unshift(n);
  b.path = out.map(n => n.k[0] === 'g' || n.x === 1180 || n.x === 150 || n.x === 2350 || n.x === 3440 ? { x: n.x + b.jx * .5, y: n.y + (n.k[0] === 'g' ? 0 : b.jy) } : { x: n.x + b.jx, y: n.y + b.jy });
  if (final) b.path.push(final);
}
const BROWSE = [
  () => { const r = R() < .5 ? 0 : 1, x = pick(LOTX); return { node: (r ? 'l' : 'm') + x, x: x + rr(-60, 60), y: ROWY[r] + rr(40, 70), dir: 'up' }; },
  () => { const x = pick(LX); return { node: 'm' + x, x: x + rr(-90, 90), y: 800 + rr(-40, 40), dir: pick(['left', 'right', 'down']) }; },
  () => { const x = pick(LX); return { node: 'l' + x, x: x + rr(-90, 90), y: 1290 + rr(-30, 80), dir: pick(['left', 'right', 'down', 'up']) }; },
  () => { const x = pick(BX); return { node: 'b' + x, x: x + rr(-60, 60), y: 320 + rr(0, 30), dir: 'up' }; },
  () => { const x = pick([2700, 3000]); return { node: 'm' + x, x: x + rr(-70, 160), y: 790 + rr(-30, 50), dir: 'up' }; },
  () => { const x = pick([2700, 3000]); return { node: 'l' + x, x: x + rr(-60, 260), y: 1270 + rr(0, 50), dir: 'up' }; },
];

// ---------- particles ----------
const parts = [];
function updParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life > p.max) parts.splice(i, 1); } }

// ---------- player & bots ----------
const P = mkChar(1180, 1000, 8); P.speed = 200; P.name = ''; P.busy = 0; P.dir = 'up'; P.vx = P.vy = 0;
const bots = [];
function blocked(x, y) {
  if (x < 40 || x > W - 40 || y > H - 40) return true;
  if (y < 292) return !GATES.some(gt => Math.abs(x - gt.x) < 70 && y > 250);
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
  if (P.busy > 0) { P.busy -= dt; if (P.busy <= 0) { P.pose = null; const id = P.held; useItem(id); cheer(P, 90); for (let i = 0; i < 4; i++) parts.push({ type: 'heart', x: P.x + rr(-16, 16), y: P.y - 130, vx: rr(-10, 10), vy: rr(-30, -18), life: 0, max: 1.1 }); } return; }
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
const WALKERS = META.cast.map((m, i) => m.vendor ? -1 : i).filter(i => i >= 0);
function makePlan(b) {
  const p = [], br = () => p.push({ t: 'browse' });
  for (let i = R() * 3 | 0; i >= 0; i--) br();
  if (!META.cast[b.ci].monk) {
    if (R() < .6) { p.push({ t: 'buy', s: pick(['kanom', 'drink']) }); br(); p.push({ t: 'eat' }); }
    if (R() < .45) { p.push({ t: 'buy', s: 'lantern' }); br(); br(); }
  }
  if (R() < .5) br(); p.push({ t: 'exit', g: pick([520, 1860]) }); return p;
}
function spawnBot(b, initial) {
  const n = initial ? N[pick(Object.keys(N).filter(k => k[0] !== 'g'))] : N['g' + pick([520, 1860])];
  Object.assign(b, mkChar(n.x + rr(-20, 20), n.y + rr(-10, 20), pick(WALKERS)), { speed: rr(64, 92), jx: rr(-34, 34), jy: rr(-34, 34), step: null, after: null });
  if (META.cast[b.ci].monk) b.speed = 58;
  b.plan = makePlan(b); return b;
}
function updBot(b, dt) {
  b.moving = false;
  if (b.task) { follow(b, dt, false); return; }
  if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0 && b.after) { const f = b.after; b.after = null; f(); } return; }
  if (b.path.length) { follow(b, dt, false); return; }
  if (b.step && b.step.arrive) { const f = b.step.arrive; b.step.arrive = null; f(); return; }
  const s = b.plan.shift(); if (!s) { spawnBot(b); return; } b.step = s;
  if (s.t === 'browse') { const sp = pick(BROWSE)(); route(b, sp.node, { x: sp.x, y: sp.y }); s.arrive = () => { b.dir = sp.dir; b.wait = rr(2.5, 7); }; }
  else if (s.t === 'buy') { const st = STALL[s.s]; route(b, (st.row ? 'l' : 'm') + st.cx, null); s.arrive = () => { if (st.line.full() || b.held) b.wait = .5; else st.line.join(b); }; }
  else if (s.t === 'eat') { if (b.held && ITEMS[b.held].edible) { b.pose = 'eat'; b.wait = 1.6; b.after = () => { b.pose = null; b.held = null; cheer(b, 0); }; } }
  else if (s.t === 'exit') { route(b, 'g' + s.g, null); s.arrive = () => spawnBot(b); }
}
function separate() {
  const all = [P, ...bots].filter(c => !c.task && !(c === P && P.busy > 0));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j], dx = b.x - a.x, dy = (b.y - a.y) * 1.6, d = Math.hypot(dx, dy);
    if (d < 40 && d > .01) { const k = (40 - d) / d * .5, wa = a === P ? .25 : 1, wb = 1; const ax = a.x - dx * k * wa, ay = a.y - dy / 1.6 * k * wa; if (a !== P || !blocked(ax, ay)) { a.x = ax; a.y = ay; } b.x += dx * k * wb; b.y += dy / 1.6 * k * wb; }
  }
}

// ---------- inventory / HUD ----------
const inv = [];
function addItem(id) { const s = inv.find(i => i.id === id); if (s) s.n++; else inv.push({ id, n: 1 }); renderInv(); }
function useItem(id) { const s = inv.find(i => i.id === id); if (!s) return; if (--s.n <= 0) { inv.splice(inv.indexOf(s), 1); if (P.held === id) P.held = null; } renderInv(); }
function renderInv() {
  const bar = $('bar'); bar.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = inv[i], el = document.createElement('div'); el.className = 'slot' + (s && P.held === s.id ? ' on' : '');
    el.innerHTML = `<span class="k">${i + 1}</span>`;
    if (s) { const sp = SPR[ITEMS[s.id].spr], c = document.createElement('canvas'); c.width = c.height = 116; const k = Math.min(96 / sp.cv.width, 96 / sp.cv.height); c.getContext('2d').drawImage(sp.cv, 58 - sp.cv.width * k / 2, 58 - sp.cv.height * k / 2, sp.cv.width * k, sp.cv.height * k); el.appendChild(c); const n = document.createElement('span'); n.className = 'n'; n.textContent = s.n > 1 ? '×' + s.n : ''; el.appendChild(n); el.title = ITEMS[s.id].name; }
    el.onclick = e => { e.stopPropagation(); toggleHold(i); }; bar.appendChild(el);
  }
  const h = P.held && ITEMS[P.held]; $('barHint').textContent = h ? `ถืออยู่: ${h.name}${h.edible ? ` · กด F เพื่อ${h.verb}` : ''}` : '';
}
function toggleHold(i) { const s = inv[i]; if (!s || P.busy > 0 || P.task) return; P.held = P.held === s.id ? null : s.id; renderInv(); }
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 2800); }
function findInteract() {
  if (P.task || P.busy > 0) return null;
  for (const s of stalls) if (Math.hypot(P.x - s.cx, P.y - (s.by + 45)) < 95) return { label: `${s.buy} (${s.price})`, act() { if (s.line.full()) toast('แถวร้านนี้ยาวอยู่ รอสักครู่นะ'); else s.line.join(P); } };
  for (const gt of GATES) if (Math.abs(P.x - gt.x) < 90 && P.y < 330) return { label: `ไป${gt.name}`, act() { toast(`ทางไป${gt.name}กำลังสร้าง เปิดเร็ว ๆ นี้`); } };
  for (const [x, y, n] of [[3060, 700, 'ชิงช้าสวรรค์'], [2760, 1190, 'ม้าหมุน'], [3240, 1250, 'บ้านลม']]) if (Math.hypot(P.x - x, P.y - y) < 110) return { label: 'เล่น' + n, act() { toast(n + 'จะเปิดให้เล่นเร็ว ๆ นี้ ตอนนี้ยืนดูไปก่อนนะ'); } };
  for (const r of [0, 1]) for (let i = 0; i < 6; i++) if (!stalls.some(s => s.row === r && s.lot === i) && Math.hypot(P.x - LOTX[i], P.y - (ROWY[r] + 40)) < 80) return { label: 'ดูล็อกว่าง', act() { toast('ล็อกนี้ยังว่าง รอพ่อค้าแม่ค้ามาตั้งร้าน'); } };
  return null;
}
let curI = null, promptTxt = '';
function updPrompt() {
  curI = started ? findInteract() : null; let t = '';
  if (curI) t = `<kbd>E</kbd>${curI.label}`; else if (P.task && P.task.state === 'wait') t = 'กำลังต่อแถว · กดปุ่มเดินเพื่อออกจากแถว';
  if (t !== promptTxt) { promptTxt = t; const el = $('prompt'); el.innerHTML = t; el.style.display = t ? 'block' : 'none'; }
}
const keyOf = e => { const c = e.code || ''; return c.startsWith('Key') ? c.slice(3).toLowerCase() : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') && c.length === 7 ? c.slice(6) : c ? c.toLowerCase() : (e.key || '').toLowerCase(); };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; const k = keyOf(e); keys[k] = true; if (!started) return;
  if (k.startsWith('arrow') || k === 'space') e.preventDefault();
  if (e.repeat) return;
  if (k === 'e' && curI) curI.act();
  if (k.length === 1 && k >= '1' && k <= '8') toggleHold(+k - 1);
  if (k === 'f' && P.held && ITEMS[P.held].edible && !P.task && P.busy <= 0) { P.pose = 'eat'; P.busy = 1.5; P.path = []; P.vx = P.vy = 0; }
});
addEventListener('keyup', e => keys[keyOf(e)] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
cv.addEventListener('mousedown', e => { if (!started || P.task || P.busy > 0) return; const r = cv.getBoundingClientRect(); P.path = [{ x: camL + (e.clientX - r.left) / r.width * vw, y: camT + (e.clientY - r.top) / r.height * VIEW_H }]; });

// ---------- lighting ----------
function radial(a, m, z) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, a); gr.addColorStop(.45, m); gr.addColorStop(1, z); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c; }
const HOLE = radial('rgba(0,0,0,1)', 'rgba(0,0,0,.55)', 'rgba(0,0,0,0)'), GLOW = radial('rgba(255,185,95,.9)', 'rgba(255,160,70,.28)', 'rgba(255,140,60,0)');
const dyn = [];
function drawLighting() {
  const w = dark.width, h = dark.height, s = sc / 2;
  dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, w, h); dg.fillStyle = 'rgba(16,10,52,.5)'; dg.fillRect(0, 0, w, h);
  dg.globalCompositeOperation = 'destination-out';
  const y0 = (120 - camT) * s, y1 = (300 - camT) * s;
  if (y1 > 0) { const gr = dg.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, w, y1); }
  const vis = []; for (const L of lights.concat(dyn)) if (L.x + L.r > camL && L.x - L.r < camL + vw && L.y + L.r > camT && L.y - L.r < camT + VIEW_H) vis.push(L);
  for (const L of vis) { dg.globalAlpha = L.a; dg.drawImage(HOLE, (L.x - L.r - camL) * s, (L.y - L.r - camT) * s, L.r * 2 * s, L.r * 2 * s); }
  dg.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dark, 0, 0, cv.width, cv.height);
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc); g.globalCompositeOperation = 'lighter';
  for (const L of vis) { g.globalAlpha = .17 * L.a * (1 + Math.sin(time * 3 + L.x) * .06); const r = L.r * .85; g.drawImage(GLOW, L.x - r, L.y - r, r * 2, r * 2); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}

// ---------- strings of lights & rides ----------
const STRINGS = [], BULB = ['#ffe08a', '#ff9db5', '#9fd8ff', '#c4f5a6'];
function addString(x1, y1, x2, y2, sag = 30) { STRINGS.push([x1, y1, x2, y2, sag]); const n = Math.max(1, Math.round((x2 - x1) / 240)); for (let i = 0; i < n; i++) addLight(lerp(x1, x2, (i + .5) / n), lerp(y1, y2, (i + .5) / n) + sag + 40, 130, .5); }
function addRides() {
  const fx = 3060, fy = 660, hy = fy - 380 * .6;
  ents.push({ x: fx, y: fy, w: 240, draw(c) {
    ell(c, fx, fy + 4, 150, 14, 'rgba(20,10,40,.3)'); spr(c, 'fw_base', fx, fy); const a0 = time * .22; spr(c, 'fw_wheel', fx, hy, { rot: a0 });
    for (let i = 0; i < 8; i++) { const a = a0 + i * Math.PI / 4; spr(c, 'fw_cab' + i % 4, fx + Math.cos(a) * 180, hy + Math.sin(a) * 180, { rot: Math.sin(time * 1.4 + i) * .07 }); }
    label(c, 'ชิงช้าสวรรค์', fx, fy - 59 * .6, 24, '#fff1cc', 700);
  } });
  RECTS.push([fx - 140, fy - 50, fx + 140, fy + 6]); addLight(fx, hy, 340, 1); addLight(fx, fy - 20, 230, .85);
  const cx = 2760, cy = 1140;
  ents.push({ x: cx, y: cy, w: 170, draw(c) {
    ell(c, cx, cy + 8, 150, 16, 'rgba(20,10,40,.3)'); spr(c, 'car_base', cx, cy); const a0 = time * .6, hs = [];
    for (let i = 0; i < 6; i++) { const a = a0 + i * Math.PI / 3; hs.push({ i, s: Math.sin(a), x: cx + Math.cos(a) * 105, y: cy - 12 + Math.sin(a) * 16 - Math.abs(Math.sin(time * 2.4 + i * 1.3)) * 12 }); }
    hs.sort((p, q) => p.s - q.s); for (const h of hs) spr(c, 'horse' + h.i % 3, h.x, h.y, { flip: h.s > 0, k: .82 + h.s * .1 });
    spr(c, 'car_top', cx, cy); board(c, cx, cy + 38, 'ม้าหมุน');
  } });
  RECTS.push([cx - 150, cy - 60, cx + 150, cy + 16]); addLight(cx, cy - 110, 270, 1);
  const bx = 3240, by = 1210, kids = [4, 5, 4].map((ci, i) => Object.assign(mkChar(bx - 62 + i * 62, by - 46, ci), { noShadow: true }));
  ents.push({ x: bx, y: by, w: 180, draw(c) {
    ell(c, bx, by + 6, 165, 16, 'rgba(20,10,40,.3)'); spr(c, 'bounce_back', bx, by, { sy: 1 + Math.sin(time * 5) * .012 });
    kids.forEach((k, i) => { k.hop = -Math.abs(Math.sin(time * 4 + i * 2.1)) * 36; k.joy = 1; drawChar(c, k); });
    spr(c, 'bounce_front', bx, by, { sy: 1 + Math.sin(time * 5 + 1) * .02 }); board(c, bx, by + 30, 'บ้านลม');
  } });
  RECTS.push([bx - 160, by - 76, bx + 160, by + 8]); addLight(bx, by - 100, 260, 1);
}

// ---------- render ----------
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0f0d30'; g.fillRect(0, 0, cv.width, cv.height);
  if (!BG) return;
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc);
  g.drawImage(BG, camL * BGS, camT * BGS, vw * BGS, VIEW_H * BGS, camL, camT, vw, VIEW_H);
  dyn.length = 0;
  const list = [];
  for (const e of ents) if (e.x + e.w + 200 > camL && e.x - e.w - 200 < camL + vw) list.push(e);
  for (const b of bots) list.push(b); list.push(P);
  for (const e of list) if (e.held === 'lantern') dyn.push({ x: e.x + 20, y: e.y - 40, r: 150, a: .9 });
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.draw ? e.draw(g) : drawChar(g, e);
  drawLighting();
  for (const [x1, y1, x2, y2, sag] of STRINGS) if (x2 > camL - 50 && x1 < camL + vw + 50) {
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag * 2, x2, y2); g.strokeStyle = '#33211f'; g.lineWidth = 2; g.stroke();
    const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 34);
    for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x1, x2, u), y = lerp(y1, y2, u) + sag * 4 * u * (1 - u) + 5, on = .75 + .25 * Math.sin(time * 3 + i * 1.7 + x1); ell(g, x, y, 10, 10, `rgba(255,200,110,${.2 * on})`); ell(g, x, y, 4.4, 5.2, BULB[i % 4]); }
  }
  for (const p of parts) {
    const u = p.life / p.max; g.globalAlpha = 1 - u;
    if (p.type === 'spark') { g.strokeStyle = '#fff4b0'; g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x - 6, p.y); g.lineTo(p.x + 6, p.y); g.moveTo(p.x, p.y - 6); g.lineTo(p.x, p.y + 6); g.stroke(); }
    else if (p.type === 'heart') { ell(g, p.x - 3.5, p.y, 4.5, 4.5, '#ff7fa0'); ell(g, p.x + 3.5, p.y, 4.5, 4.5, '#ff7fa0'); g.beginPath(); g.moveTo(p.x - 8, p.y + 1.5); g.lineTo(p.x + 8, p.y + 1.5); g.lineTo(p.x, p.y + 11); g.closePath(); g.fill(); }
  }
  g.globalAlpha = 1;
  for (const s of stalls) if (s.sayT > 0) bubble(g, s.cx + 84, s.by - 132, s.say);
  if (started) label(g, P.name, P.x, P.y + P.hop - 142, 15, '#fff', 700, 'rgba(30,15,50,.9)');
}

// ---------- main ----------
let last = performance.now();
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; tick(dt); render(); requestAnimationFrame(frame); }
function tick(dt) {
  time += dt;
  for (const s of stalls) { updStall(s, dt); animChar(s.vendor, dt); }
  updPlayer(dt); for (const b of bots) updBot(b, dt); separate(); updParts(dt); updPrompt();
  animChar(P, dt); for (const b of bots) animChar(b, dt);
  cam.x += (P.x - cam.x) * Math.min(1, dt * 5); cam.y += (P.y - 62 - cam.y) * Math.min(1, dt * 5);
  camL = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.x - vw / 2)); camT = Math.max(0, Math.min(H - VIEW_H, cam.y - VIEW_H / 2));
}
function buildWorld() {
  STALL_DEFS.forEach(makeStall);
  for (const r of [0, 1]) for (let i = 0; i < 6; i++) if (!stalls.some(s => s.row === r && s.lot === i)) {
    const x = LOTX[i], y = ROWY[r]; RECTS.push([x - 100, y - 44, x + 100, y + 2]);
    ents.push({ x, y, w: 120, draw(c) { spr(c, 'lot', x, y); label(c, 'ล็อกว่าง', x, y - 74, 22, '#fff1cc', 700); } });
  }
  for (const gt of GATES) {
    ents.push({ x: gt.x, y: 266, w: 180, draw(c) { spr(c, 'gate', gt.x, 266, { k: .75 }); label(c, 'ทางไป' + gt.name, gt.x, 266 - 294 * .6, 27, '#fff1cc', 700); } });
    addLight(gt.x, 150, 230, 1); addLight(gt.x, 300, 170, .8);
    prop('torch', gt.x - 130, 300, [[0, -90, 150, .9]]); prop('torch', gt.x + 130, 300, [[0, -90, 150, .9]]);
  }
  prop('tree1', 2420, 620, [[-105, -126, 170, .9], [91, -122, 190, .9]]); prop('tree2', 140, 1250, [[-82, -99, 150, .9], [72, -96, 160, .9]]);
  prop('palm', 70, 330); prop('palm', 3440, 345); prop('palm', 1190, 300); prop('palm', 3450, 1420); prop('palm', 2540, 300); prop('banana', 3380, 300); prop('banana', 2600, 1440);
  prop('banana', 2230, 300); prop('banana', 860, 298); prop('banana', 150, 620); prop('banana', 1500, 300);
  for (const [x, y] of [[500, 880], [1180, 900], [1860, 880], [330, 1370], [1010, 1380], [1690, 1370], [2250, 1180]]) prop('lamp', x, y, [[32, -138, 210, 1], [10, -8, 150, .6]]);
  prop('jar', 1500, 628); prop('jar', 1540, 640); prop('jar', 180, 1090);
  const sp = prop('sign', 1180, 760); const d0 = sp.draw; sp.draw = c => { d0(c); label(c, 'ท่าน้ำ →', 1180 + 6, 760 - 200 * .7, 23, '#fff1cc', 700); label(c, '← โบสถ์', 1180 - 6, 760 - 126 * .7, 23, '#fff1cc', 700); };
  for (const [x, y] of [[2560, 930], [2960, 1400], [3440, 930], [2540, 1400], [3450, 1320]]) prop('lamp', x, y, [[32, -138, 210, 1], [10, -8, 150, .6]]);
  const sp2 = prop('sign', 2470, 860); const d2 = sp2.draw; sp2.draw = c => { d2(c); label(c, 'เครื่องเล่น →', 2470 + 6, 860 - 200 * .7, 22, '#fff1cc', 700); label(c, '← ตลาด', 2470 - 6, 860 - 126 * .7, 23, '#fff1cc', 700); };
  addRides();
  for (const y of ROWY) for (let i = 0; i < 5; i++) addString(LOTX[i], y - 214, LOTX[i + 1], y - 214, 26);
  addString(362, 1215, 1042, 1225, 44); addString(1042, 1225, 1722, 1215, 44); addString(532, 725, 1212, 745, 44); addString(1212, 745, 1892, 725, 44);
  addString(2592, 775, 3050, 440, 30); addString(3070, 440, 3472, 775, 30); addString(2572, 1245, 2992, 1245, 40);
  for (let i = 0; i < 20; i++) bots.push(spawnBot({}, true));
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
function startGame() { P.name = $('name').value.trim() || 'ฉัน'; $('start').style.display = 'none'; started = true; if (document.activeElement) document.activeElement.blur(); toast('ยินดีต้อนรับสู่งานวัดลอยกระทง'); }
$('goBtn').onclick = startGame;
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
window.G = { P, bots, stalls, inv, keys, toast, addItem, STALL, step(n) { for (let i = 0; i < n; i++) tick(1 / 30); render(); } };
if (document.fonts && document.fonts.load) document.fonts.load(F(20, 700), 'ลอยกระทง');
loadAssets().then(() => { buildWorld(); BG = buildBG(); buildLooks(); renderInv(); $('loading').style.display = 'none'; G.ready = true; requestAnimationFrame(frame); })
  .catch(e => { $('loading').textContent = 'โหลดเกมไม่สำเร็จ: ' + e.message; });
