'use strict';
// ============================================================
//  งานวัดลอยกระทง — เวอร์ชันเดินเล่นคนเดียว (รอบแรก)
// ============================================================
const W = 2950, H = 1440, VIEW_H = 760, BGS = 1.5;
const cv = document.getElementById('game'), g = cv.getContext('2d');
const dark = document.createElement('canvas'), dg = dark.getContext('2d');
let sc = 1, vw = 1280, camL = 0, camT = 0, time = 0, started = false;
const cam = { x: 1750, y: 1060 };

const R = Math.random, rr = (a, b) => a + R() * (b - a), pick = a => a[R() * a.length | 0];
const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const F = (px, w = 600) => `${w} ${px}px Mali, "Leelawadee UI", sans-serif`;
function seeded(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(320, innerWidth * dpr); cv.height = Math.max(240, innerHeight * dpr);
  sc = cv.height / VIEW_H; vw = cv.width / sc;
  dark.width = Math.ceil(cv.width / 2); dark.height = Math.ceil(cv.height / 2);
}
addEventListener('resize', resize); resize();

// ---------- drawing helpers ----------
function ell(c, x, y, rx, ry, f) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = f; c.fill(); }
function circ(c, x, y, r, f) { ell(c, x, y, r, r, f); }
function rbox(c, x, y, w, h, r, f) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = f; c.fill(); }
function seg(c, x1, y1, x2, y2, col, w) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.stroke(); }
function poly(c, pts, f) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = f; c.fill(); }
function label(c, s, x, y, px, col, w = 600, outline) {
  c.font = F(px, w); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (outline) { c.lineWidth = px / 4; c.strokeStyle = outline; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y);
}
function board(c, cx, cy, txt, px) {
  c.font = F(px, 700); const w = c.measureText(txt).width + 26, h = px + 16;
  rbox(c, cx - w / 2, cy - h / 2, w, h, 6, '#5a3519');
  rbox(c, cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h - 4, 5, '#8a5a30');
  c.strokeStyle = 'rgba(60,30,10,.35)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(cx - w / 2 + 6, cy - 3); c.lineTo(cx + w / 2 - 6, cy - 4); c.stroke();
  label(c, txt, cx, cy + 1, px, '#fff1cc', 700);
  return w;
}
function tag(c, cx, cy, txt, bg = '#fffaf0', fg = '#6b3a1e') {
  c.font = F(13, 700); const w = c.measureText(txt).width + 14;
  rbox(c, cx - w / 2, cy - 11, w, 22, 5, bg); c.strokeStyle = '#c9a377'; c.lineWidth = 1.2; c.stroke();
  label(c, txt, cx, cy + 1, 13, fg, 700);
}
function paperLantern(c, x, y, s = 1, col = '#ffe7a3') {
  seg(c, x, y - 6 * s, x, y, '#5a3a22', 1.5);
  const gr = c.createLinearGradient(x - 11 * s, 0, x + 11 * s, 0);
  gr.addColorStop(0, '#ffc66b'); gr.addColorStop(.5, col); gr.addColorStop(1, '#ffc66b');
  rbox(c, x - 11 * s, y, 22 * s, 30 * s, 8 * s, gr);
  rbox(c, x - 8 * s, y - 2 * s, 16 * s, 5 * s, 2, '#b2413a'); rbox(c, x - 8 * s, y + 27 * s, 16 * s, 5 * s, 2, '#b2413a');
  seg(c, x, y + 32 * s, x, y + 42 * s, '#e0574f', 2);
}

// ---------- items ----------
const KCOL = [['#c95be0', '#f3b8ff'], ['#ffc531', '#fff0a0'], ['#ff7fb0', '#ffd0e2']];
function drawKrathong(c, x, y, s, v, lit) {
  c.save(); c.translate(x, y); c.scale(s, s);
  ell(c, 0, 0, 18, 8, '#2f7a3a');
  for (let i = -3; i <= 3; i++) poly(c, [i * 5.2 - 4, -1, i * 5.6, -13 + Math.abs(i), i * 5.2 + 4, -1], i % 2 ? '#58b24e' : '#3f9b46');
  ell(c, 0, -3, 15, 5.5, '#3f9b46');
  const [a, b] = KCOL[v % 3];
  for (const [fx, fy] of [[-9, -8], [0, -10], [9, -8], [-4.5, -5], [4.5, -5]]) { circ(c, fx, fy, 4.6, a); circ(c, fx, fy, 2, b); }
  seg(c, -5, -12, -6, -24, '#8a6a4a', 1); seg(c, 5, -12, 6, -24, '#8a6a4a', 1);
  rbox(c, -1.8, -25, 3.6, 14, 1.5, '#fff3d0');
  if (lit) { const f = 1 + Math.sin(time * 14 + x) * .15; ell(c, 0, -29, 3 * f, 5 * f, '#ff9a2e'); ell(c, 0, -28, 1.6, 3, '#fff4b0'); }
  c.restore();
}
const ITEMS = {
  meatball: { name: 'ลูกชิ้นปิ้ง', edible: true, draw(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    seg(c, 0, 4, 0, -30, '#d9b98a', 2);
    for (const by of [-10, -18, -26]) { circ(c, 0, by, 5, '#b8672c'); circ(c, -1.4, by - 1.6, 1.6, '#e59a57'); ell(c, 1.2, by + 1.6, 2.6, 1.6, '#7a2e12'); }
    c.restore(); } },
  krathong: { name: 'กระทง', draw(c, x, y, s, v) { drawKrathong(c, x, y, s, v || 0, false); } },
};

// ---------- characters ----------
const SKINS = ['#ffe0c4', '#fbd3b0', '#f3c49a', '#ecb98e'], HAIRS = ['#2b1a12', '#3d2314', '#4a2c1a', '#231c1c', '#5a3520'];
const SHIRTS = ['#ffffff', '#ffd6e0', '#cfe8ff', '#ffe9a8', '#d4f5d0', '#e3d4ff', '#ff9aa2', '#8fd3c8', '#f7b267'];
const BOTTOMS = ['#5b5f97', '#3d405b', '#8d6a9f', '#6b4f4f', '#3f6f73', '#b56576'];
function randLook() {
  const girl = R() < .5;
  return { skin: pick(SKINS), hairC: pick(HAIRS), hair: girl ? pick(['long', 'bun', 'pony', 'long']) : 'short', shirtC: pick(SHIRTS),
    bottom: girl ? (R() < .7 ? 'skirt' : 'shorts') : (R() < .5 ? 'shorts' : 'pants'), bottomC: pick(BOTTOMS), acc: girl ? pick([null, 'bow', 'flower']) : null };
}
const PRESETS = [
  { skin: '#ffe0c4', hairC: '#3d2314', hair: 'short', shirtC: '#ffffff', bottom: 'shorts', bottomC: '#4a4e69', acc: null },
  { skin: '#ffe0c4', hairC: '#4a2c1a', hair: 'long', shirtC: '#ffffff', bottom: 'skirt', bottomC: '#9d7ad1', acc: 'bow' },
  { skin: '#fbd3b0', hairC: '#3d2314', hair: 'bun', shirtC: '#ffd6e0', bottom: 'skirt', bottomC: '#c2455e', acc: 'flower' },
  { skin: '#f3c49a', hairC: '#231c1c', hair: 'short', shirtC: '#8fd3c8', bottom: 'pants', bottomC: '#3d405b', acc: null },
];
function mkChar(x, y, look) { return { x, y, dir: 'down', look, phase: R() * 6, seed: R() * 10, moving: false, pose: null, held: null, heldV: 0, path: [], task: null, speed: 90, wait: 0, mv: 0, kn: 0, fx: 0, turn: 0, hop: 0, hopV: 0, joy: 0, pop: 0, pdir: 'down' }; }

function tone(hex, f) { const n = parseInt(hex.slice(1), 16), q = v => Math.max(0, Math.min(255, v * f | 0)); return `rgb(${q(n >> 16)},${q(n >> 8 & 255)},${q(n & 255)})`; }
const OUT = 'rgba(72,36,48,.62)';
function ol(c, w = 1.5) { c.strokeStyle = OUT; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); }
// ค่าที่ไล่ระดับทีละเฟรม เพื่อให้ท่าทางนุ่ม ไม่กระตุก
function animChar(c, dt) {
  const k = r => Math.min(1, dt * r), kneel = c.pose === 'kneel' || c.pose === 'pray';
  c.mv += ((c.moving ? 1 : 0) - c.mv) * k(12);
  c.kn += ((kneel ? 1 : 0) - c.kn) * k(7);
  c.fx += ((c.dir === 'left' ? -1 : c.dir === 'right' ? 1 : 0) - c.fx) * k(14);
  if (c.pdir !== c.dir) { c.pdir = c.dir; c.turn = 1; }
  c.turn = Math.max(0, c.turn - dt * 7);
  if (c.hopV) { c.hopV += 620 * dt; c.hop += c.hopV * dt; if (c.hop >= 0) { c.hop = 0; c.hopV = 0; c.pop = 1; } }
  c.joy = Math.max(0, c.joy - dt); c.pop = Math.max(0, c.pop - dt * 5);
}
function cheer(c, hop = 150) { if (hop) { c.hopV = -hop; c.hop = -.01; } c.joy = 1.6; }
function charBase(c) {
  const up = Math.abs(Math.sin(c.phase)) * 3 * c.mv + Math.sin(time * 2.2 + c.seed) * .6 * (1 - c.mv);
  return c.y - up + c.kn * 13 + c.hop;
}
function charHands(c, b) {
  const x = c.x, sw = Math.sin(c.phase) * c.mv, side = c.dir === 'left' ? -1 : c.dir === 'right' ? 1 : 0, hs = side || 1;
  let hl = { x: x - 17 - Math.abs(sw), y: b - 24 + sw * 4.5 }, hr = { x: x + 17 + Math.abs(sw), y: b - 24 - sw * 4.5 }, item = null;
  if (side) { hl = { x: x - sw * 11, y: b - 24 - Math.abs(sw) * 2 }; hr = { x: x + sw * 11, y: b - 24 - Math.abs(sw) * 2 }; }
  if (c.pose === 'pray') { const px = x + side * 13; hl = { x: px - 3, y: b - 38 }; hr = { x: px + 3, y: b - 38 }; }
  else if (c.pose === 'eat') { const bite = Math.max(0, Math.sin(time * 9)) * 7; hr = { x: x + hs * (27 - bite * .5), y: b - 41 - bite * .4 }; item = { x: hr.x, y: hr.y, rot: -hs * 1.2 }; }
  else if (c.held === 'krathong') { const kx = x + side * 15; hl = { x: kx - 11, y: b - 26 }; hr = { x: kx + 11, y: b - 26 }; item = { x: kx, y: b - 27 }; }
  else if (c.held) { if (hs > 0) { hr = { x: x + 20, y: b - 33 + sw * 1.5 }; item = hr; } else { hl = { x: x - 20, y: b - 33 + sw * 1.5 }; item = hl; } }
  if (c.handL) hl = c.handL; if (c.handR) hr = c.handR;
  return { hl, hr, item };
}
function drawArms(c, ch) {
  const b = charBase(ch), L = ch.look, { hl, hr, item } = charHands(ch, b);
  for (const [sx, h] of [[ch.x - 13, hl], [ch.x + 13, hr]]) { seg(c, sx, b - 38, h.x, h.y, OUT, 9.5); seg(c, sx, b - 38, h.x, h.y, L.shirtC, 7); circ(c, h.x, h.y, 4.8, L.skin); ol(c, 1.2); }
  if (item && ch.held && !(ch.dir === 'up' && (ch.held === 'krathong' || item.rot))) { c.save(); c.translate(item.x, item.y); c.rotate(item.rot || 0); ITEMS[ch.held].draw(c, 0, 0, 1 + Math.max(0, ch.joy - 1.3) * 1.6, ch.heldV); c.restore(); }
}
function drawChar(c, ch, o = {}) {
  const L = ch.look, x = ch.x, y = ch.y, b = charBase(ch), d = ch.dir, mv = ch.mv, kn = ch.kn, hop = ch.hop;
  const sw = Math.sin(ch.phase) * mv, back = d === 'up', sideView = d === 'left' || d === 'right', fxs = back ? 0 : ch.fx;
  const pray = ch.pose === 'pray', eat = ch.pose === 'eat', joy = ch.joy > 0;
  const hairC = L.hairC, hairD = tone(hairC, .72), hairL = tone(hairC, 1.9), sway = Math.sin(ch.phase - 1) * 2.5 * mv;
  if (!o.noShadow) { const s = 1 + hop / 45; ell(c, x, y, 19 * s, 6.5 * s, 'rgba(10,5,30,.3)'); }
  if (back && ch.held === 'krathong') { const h = charHands(ch, b); ITEMS.krathong.draw(c, h.item.x, h.item.y, 1, ch.heldV); }
  // legs
  if (!o.noLegs) {
    if (kn > .5) { ell(c, x, y - 5, 17, 7.5, L.bottom === 'pants' ? L.bottomC : L.skin); ol(c); }
    else for (const s of [-1, 1]) {
      const lx = sideView ? x + s * sw * 7 : x + s * 7, lift = Math.max(0, s * sw) * (sideView ? 4 : 6), ly = y + hop - lift + kn * 6;
      rbox(c, lx - 4.5, ly - 18, 9, 14, 4, L.bottom === 'pants' ? L.bottomC : L.skin); ol(c, 1.2);
      if (L.bottom !== 'pants') { c.fillStyle = '#fff'; c.fillRect(lx - 4, ly - 9, 8, 4); }
      ell(c, lx + fxs * 2, ly - 3, 6.4, 4, '#5a3d3d'); ol(c, 1.2); ell(c, lx + fxs * 2 - 1.5, ly - 4.2, 2.4, 1.2, 'rgba(255,255,255,.3)');
    }
  }
  // squash & stretch, body sway
  const sy = 1 + Math.cos(ch.phase * 2) * .03 * mv - ch.pop * .12 + Math.sin(time * 2.2 + ch.seed) * .012 + (hop < 0 ? .05 : 0);
  const sx = (1 - Math.sin(ch.turn * Math.PI) * .22) * (1 + ch.pop * .1);
  c.save(); c.translate(x, b); c.rotate(sideView ? fxs * .07 * mv : Math.sin(ch.phase) * .045 * mv); c.scale(sx, sy);
  if (!back) {
    if (L.hair === 'long') { rbox(c, -26 + sway * .4, -72, 52, 50, 16, hairD); ol(c); }
    if (L.hair === 'pony') for (const s of [-1, 1]) { ell(c, s * 27 + sway, -50, 7, 15, hairD); ol(c); }
  }
  // body
  rbox(c, -15, -46, 30, 31, 10, L.shirtC); ol(c);
  rbox(c, -14, -28, 28, 11, 5, 'rgba(70,30,70,.10)');
  if (L.bottom === 'skirt') { poly(c, [-14, -24, 14, -24, 20, -8, -20, -8], L.bottomC); ol(c); for (const px of [-8, 0, 8]) seg(c, px * .8, -22, px * 1.2, -9, tone(L.bottomC, .78), 1.2); }
  else { rbox(c, -15, -24, 30, 12, 5, L.bottomC); ol(c); }
  if (!back) {
    if (L.apron) { rbox(c, -11, -40, 22, 27, 4, L.apron); ol(c, 1.2); seg(c, -9, -40, -13, -46, L.apron, 2.5); seg(c, 9, -40, 13, -46, L.apron, 2.5); rbox(c, -6, -26, 12, 8, 2, tone('#ffffff', .9)); }
    else { poly(c, [-6, -46, 6, -46, 0, -39], L.skin); seg(c, -6, -46, 0, -39, tone(L.shirtC, .8), 1.3); seg(c, 6, -46, 0, -39, tone(L.shirtC, .8), 1.3); }
  }
  // head
  c.translate(0, -64 + Math.sin(ch.phase * 2 - .8) * 1.2 * mv + (pray ? kn * 3 : 0));
  c.rotate(Math.sin(time * .9 + ch.seed) * .03 * (1 - mv) + (joy ? Math.sin(time * 11) * .05 : 0));
  if (back) {
    if (L.hair === 'bun') for (const s of [-1, 1]) { circ(c, s * 18, -20, 9.5, hairC); ol(c); }
    if (L.hair === 'long') { rbox(c, -25 + sway * .5, -4, 50, 46, 15, hairC); ol(c); }
    if (L.hair === 'pony') { rbox(c, -7 + sway, 8, 14, 32, 7, hairC); ol(c); }
    ell(c, 0, 0, 25.5, 24.5, hairC); ol(c);
    if (L.hair === 'long') rbox(c, -23, 2, 46, 30, 12, hairC);
    if (L.acc === 'bow') { poly(c, [0, 14, -13, 7, -13, 21], '#fff'); ol(c, 1.2); poly(c, [0, 14, 13, 7, 13, 21], '#fff'); ol(c, 1.2); circ(c, 0, 14, 3, '#f1e6e6'); }
  } else {
    if (L.hair === 'bun') for (const s of [-1, 1]) { circ(c, s * 19, -20, 9.5, hairC); ol(c); }
    for (const s of [-1, 1]) { ell(c, s * 24 + fxs * 3, 3, 4, 5, L.skin); ol(c, 1.2); }
    ell(c, 0, 0, 24.5, 23.5, L.skin); ol(c);
    const fx = fxs * 8, blink = (time * .7 + ch.seed) % 4 < .12;
    for (const s of [-1, 1]) {
      const ex = fx + s * 9.5, ey = 5, w = 4.3 * (1 - .32 * Math.max(0, s * fxs));
      ell(c, fx + s * 15.5, 12.5, 5.6, 3.3, 'rgba(255,105,120,.38)');
      c.strokeStyle = '#3a2318'; c.lineWidth = 1.9; c.lineCap = 'round';
      if (pray) { c.beginPath(); c.arc(ex, ey - 1, 3.6, .12 * Math.PI, .88 * Math.PI); c.stroke(); }
      else if (joy) { c.beginPath(); c.arc(ex, ey + 2.5, 3.8, 1.12 * Math.PI, 1.88 * Math.PI); c.stroke(); }
      else if (blink) { c.beginPath(); c.moveTo(ex - 3.4, ey); c.lineTo(ex + 3.4, ey); c.stroke(); }
      else {
        ell(c, ex, ey, w, 6, '#3a2318'); ell(c, ex, ey + 1.7, w * .66, 3.3, '#8f5631');
        circ(c, ex - 1.2, ey - 2.3, 1.7, '#fff'); circ(c, ex + 1.3, ey + 2.6, .9, 'rgba(255,255,255,.8)');
        c.beginPath(); c.arc(ex, ey + 1.2, w + 1.2, 1.17 * Math.PI, 1.83 * Math.PI); c.strokeStyle = '#2a1610'; c.lineWidth = 1.7; c.stroke();
      }
    }
    if (eat) ell(c, fx, 14, 2.8, 2 + Math.sin(time * 14) * 1.1, '#a8483a');
    else if (joy) { c.beginPath(); c.arc(fx, 10.5, 4.6, 0, Math.PI); c.closePath(); c.fillStyle = '#b5483a'; c.fill(); }
    else { c.beginPath(); c.arc(fx, 10.5, 4, .15 * Math.PI, .85 * Math.PI); c.strokeStyle = '#a0522d'; c.lineWidth = 1.7; c.lineCap = 'round'; c.stroke(); }
    const o5 = fxs * 5;
    if (L.hair !== 'short') for (const s of [-1, 1]) ell(c, s * 22.5 + o5 * .3, 7, 4.6, 13, hairC);
    c.beginPath(); c.arc(0, 0, 25.5, Math.PI, 0);
    c.quadraticCurveTo(15 + o5, 7, 8 + o5, -9); c.quadraticCurveTo(o5, 2, -8 + o5, -9); c.quadraticCurveTo(-15 + o5, 7, -25.5, 0);
    c.closePath(); c.fillStyle = hairC; c.fill(); ol(c);
    if (L.acc === 'flower') { for (let i = 0; i < 5; i++) circ(c, -18 + Math.cos(i * 1.257) * 4.5, -14 + Math.sin(i * 1.257) * 4.5, 3.4, '#fff'); circ(c, -18, -14, 2.4, '#ffc531'); }
    if (L.acc === 'bow') { poly(c, [14, -20, 4, -26, 5, -14], '#fff'); ol(c, 1.2); poly(c, [14, -20, 24, -26, 23, -14], '#fff'); ol(c, 1.2); }
  }
  c.globalAlpha = .4; c.beginPath(); c.arc(0, 0, 19, 1.2 * Math.PI, 1.8 * Math.PI); c.strokeStyle = hairL; c.lineWidth = 3.2; c.lineCap = 'round'; c.stroke(); c.globalAlpha = 1;
  c.restore();
  if (!o.noArms) drawArms(c, ch);
}

// ---------- static world ----------
const lights = [], ents = [], farLights = [], wavelets = [];
function buildBG() {
  const bg = document.createElement('canvas'); bg.width = W * BGS; bg.height = H * BGS;
  const b = bg.getContext('2d'), rnd = seeded(7); b.scale(BGS, BGS);
  let gr = b.createLinearGradient(0, 0, 0, 180); gr.addColorStop(0, '#0b0926'); gr.addColorStop(1, '#2a1c5e'); b.fillStyle = gr; b.fillRect(0, 0, W, 180);
  for (let i = 0; i < 260; i++) circ(b, rnd() * W, rnd() * 140, rnd() * 1.3 + .3, `rgba(255,255,255,${.3 + rnd() * .6})`);
  // moon
  const mx = 2010, my = 60; gr = b.createRadialGradient(mx, my, 20, mx, my, 150); gr.addColorStop(0, 'rgba(230,225,255,.45)'); gr.addColorStop(1, 'rgba(230,225,255,0)'); b.fillStyle = gr; b.fillRect(mx - 150, my - 150, 300, 300);
  circ(b, mx, my, 31, '#fbf6e6'); circ(b, mx - 9, my - 6, 7, 'rgba(200,195,215,.5)'); circ(b, mx + 10, my + 9, 5, 'rgba(200,195,215,.45)'); circ(b, mx + 6, my - 13, 3.5, 'rgba(200,195,215,.4)');
  // river
  gr = b.createLinearGradient(0, 150, 0, 432); gr.addColorStop(0, '#17123f'); gr.addColorStop(.5, '#241a5c'); gr.addColorStop(1, '#35256e'); b.fillStyle = gr; b.fillRect(0, 150, W, 285);
  // far bank
  b.beginPath(); b.moveTo(0, 172); for (let x = 0; x <= W; x += 26) b.lineTo(x, 150 - rnd() * 14 - (rnd() < .15 ? 12 : 0)); b.lineTo(W, 172); b.closePath(); b.fillStyle = '#120d30'; b.fill();
  const chedi = (x, base, h) => {
    let q = b.createRadialGradient(x, base - h * .5, 4, x, base - h * .5, h * 1.1); q.addColorStop(0, 'rgba(255,200,110,.5)'); q.addColorStop(1, 'rgba(255,200,110,0)'); b.fillStyle = q; b.fillRect(x - h * 1.2, base - h * 1.7, h * 2.4, h * 2.2);
    q = b.createLinearGradient(0, base - h, 0, base); q.addColorStop(0, '#fff3b8'); q.addColorStop(1, '#e09a2e'); b.fillStyle = q;
    b.beginPath(); b.moveTo(x - h * .42, base); b.lineTo(x - h * .36, base - h * .18); b.lineTo(x - h * .26, base - h * .2); b.quadraticCurveTo(x - h * .24, base - h * .5, x - h * .07, base - h * .56); b.lineTo(x, base - h);
    b.lineTo(x + h * .07, base - h * .56); b.quadraticCurveTo(x + h * .24, base - h * .5, x + h * .26, base - h * .2); b.lineTo(x + h * .36, base - h * .18); b.lineTo(x + h * .42, base); b.fill();
  };
  const hall = (x, base, w) => { b.fillStyle = '#f3cf86'; b.fillRect(x - w / 2, base - 16, w, 16); poly(b, [x - w / 2 - 8, base - 15, x, base - 40, x + w / 2 + 8, base - 15], '#c9482b'); poly(b, [x - w / 3, base - 22, x, base - 48, x + w / 3, base - 22], '#de6a3c'); };
  hall(1630, 158, 70); hall(1840, 158, 60); chedi(1735, 158, 100); chedi(610, 156, 56); hall(680, 156, 50); chedi(2640, 156, 62); hall(2570, 156, 54); hall(1150, 156, 60); hall(2250, 157, 46); hall(240, 156, 56);
  for (let x = 8; x < W; x += 12 + rnd() * 22) {
    const col = pick(['#ffd27a', '#ffb24d', '#ff9a6b', '#ffe9a8', '#ff8fb0']);
    circ(b, x, 158 + rnd() * 6, 4, 'rgba(255,190,110,.18)'); circ(b, x, 158 + rnd() * 6, 1.7, col);
    if (rnd() < .45) farLights.push({ x, col });
  }
  for (let i = 0; i < 150; i++) wavelets.push({ x: rnd() * W, y: 185 + rnd() * 235, l: 10 + rnd() * 26, p: rnd() * 6 });
  // ground: stone
  b.fillStyle = '#6a5464'; b.fillRect(0, 432, W, H - 432);
  for (let row = 0, y = 438; y < 1228; y += 38, row++) for (let x = (row % 2 ? -32 : 0); x < W; x += 64) {
    const v = rnd() * 22 - 11; b.fillStyle = `rgb(${150 + v | 0},${124 + v | 0},${130 + v | 0})`; b.beginPath(); b.roundRect(x + 1.5, y + 1.5, 61, 35, 4); b.fill();
  }
  // grass areas
  const grass = (x, y, w, h) => {
    b.fillStyle = '#3f7045'; b.fillRect(x, y, w, h);
    for (let i = 0; i < w * h / 900; i++) { const gx = x + rnd() * w, gy = y + rnd() * h; b.fillStyle = rnd() < .5 ? '#4f8a52' : '#356240'; b.beginPath(); b.ellipse(gx, gy, 5 + rnd() * 7, 2.5, 0, 0, 7); b.fill(); }
  };
  grass(0, 438, 700, 566); grass(0, 1228, W, H - 1228);
  b.fillStyle = '#8b7379'; b.fillRect(0, 1222, W, 8);
  // temple path
  for (let y = 985; y < 1010; y += 20) for (let x = 300; x < 460; x += 40) { b.fillStyle = '#b29a9e'; b.beginPath(); b.roundRect(x + 1, y + 1, 38, 18, 4); b.fill(); }
  // bank curb
  b.fillStyle = '#b9a3a8'; b.fillRect(0, 426, W, 12); b.fillStyle = '#8f7a82'; b.fillRect(0, 436, W, 3);
  // pier
  b.fillStyle = 'rgba(8,5,30,.35)'; b.fillRect(1624, 334, 252, 96);
  b.fillStyle = '#8f6038'; b.fillRect(1630, 338, 240, 96);
  for (let y = 338; y < 434; y += 12) { b.fillStyle = `rgba(60,30,10,${.18 + rnd() * .12})`; b.fillRect(1630, y, 240, 1.5); b.fillStyle = `rgba(255,220,170,${rnd() * .07})`; b.fillRect(1630, y + 2, 240, 9); }
  b.strokeStyle = '#5a3519'; b.lineWidth = 4; b.strokeRect(1630, 338, 240, 96);
  for (const sx of [1680, 1750, 1820]) { b.strokeStyle = 'rgba(255,200,220,.55)'; b.lineWidth = 2; b.setLineDash([5, 4]); b.beginPath(); b.ellipse(sx, 366, 24, 9, 0, 0, 7); b.stroke(); b.setLineDash([]); }
  // queue lane tint
  b.fillStyle = 'rgba(255,230,180,.10)'; b.fillRect(1040, 446, 580, 54);
  // leaves
  for (let i = 0; i < 230; i++) { const x = rnd() * W, y = 445 + rnd() * 780; b.save(); b.translate(x, y); b.rotate(rnd() * 6); ell(b, 0, 0, 6 + rnd() * 3, 3, pick(['#e8b93c', '#d99a2b', '#f0cf5a', '#c9772e'])); b.restore(); }
  return bg;
}

function addLight(x, y, r, a = 1) { lights.push({ x, y, r, a }); }
function lampPost(x, y, h) {
  addLight(x + 22, y - h + 40, 250, 1); addLight(x + 10, y - 10, 170, .7);
  return { x, y, w: 60, draw(c) { ell(c, x, y, 12, 4, 'rgba(10,5,30,.3)'); seg(c, x, y, x, y - h, '#4a2e1c', 6); seg(c, x, y - h, x + 22, y - h, '#4a2e1c', 4); paperLantern(c, x + 22, y - h + 6, 1.15); } };
}
function tree(x, y, seed, lantern) {
  const rnd = seeded(seed), blobs = [];
  for (let i = 0; i < 9; i++) blobs.push({ dx: (rnd() - .5) * 150, dy: -120 - rnd() * 95, r: 46 + rnd() * 30, c: pick2(rnd, ['#2c6338', '#37774a', '#458a52', '#2f6b3a']) });
  for (let i = 0; i < 7; i++) blobs.push({ dx: (rnd() - .5) * 150, dy: -150 - rnd() * 80, r: 16 + rnd() * 14, c: pick2(rnd, ['#6fae58', '#9bbf4f', '#58a35a']) });
  if (lantern) addLight(x + 46, y - 80, 200, .9);
  return { x, y, w: 160, draw(c) {
    ell(c, x, y, 34, 9, 'rgba(10,5,30,.3)'); poly(c, [x - 15, y, x - 9, y - 120, x + 9, y - 120, x + 15, y], '#5d3d26'); seg(c, x - 3, y - 20, x - 2, y - 100, '#4a2e1c', 3);
    for (const q of blobs) circ(c, x + q.dx, y + q.dy, q.r, q.c);
    if (lantern) paperLantern(c, x + 46, y - 108, 1.1, '#ffd9e6');
  } };
}
function pick2(rnd, a) { return a[rnd() * a.length | 0]; }
function signpost(x, y, boards) {
  return { x, y, w: 150, draw(c) { ell(c, x, y, 10, 3.5, 'rgba(10,5,30,.3)'); c.fillStyle = '#5d3a20'; c.fillRect(x - 4, y - 44 - boards.length * 34, 8, 44 + boards.length * 34); boards.forEach((t, i) => board(c, x, y - 28 - (boards.length - i) * 34 + 10, t, 16)); } };
}

// ---------- queues ----------
class Line {
  constructor(o) { Object.assign(this, o); this.members = []; this.occ = o.spots.map(() => null); }
  full() { return this.members.length >= this.max; }
  join(c) { this.members.push(c); c.task = { line: this, state: 'wait', i: -1 }; c.path = []; }
  leave(c) { const i = this.members.indexOf(c); if (i >= 0) this.members.splice(i, 1); c.task = null; c.path = []; }
  release(i) { const c = this.occ[i]; this.occ[i] = null; if (c) { c.task = null; c.pose = null; } return c; }
  update() {
    for (let i = 0; i < this.spots.length; i++) if (!this.occ[i] && this.members.length && this.ready()) {
      const c = this.members.shift(); this.occ[i] = c; c.task.state = 'go'; c.task.spot = i; c.path = this.approach(c, i);
    }
    this.members.forEach((c, i) => { if (c.task.i !== i) { c.task.i = i; c.path = [this.slot(i)]; } else if (!c.path.length) c.dir = this.face; });
  }
}

// ---------- stalls ----------
const STALL_DEFS = [
  { id: 'kanom', name: 'ขนมไทย', cx: 880, by: 1000, col: ['#ff8fa3', '#fff1e6'], price: 'ชิ้นละ 5฿' },
  { id: 'squid', name: 'ปลาหมึกย่าง', cx: 1140, by: 1000, col: ['#ffb347', '#fff3d6'], price: 'ไม้ละ 20฿' },
  { id: 'meatball', name: 'ลูกชิ้นปิ้ง', cx: 1400, by: 1000, col: ['#e85d4a', '#ffe9c9'], price: 'ไม้ละ 10฿', open: true, item: 'meatball', cook: 2.8, buy: 'ซื้อลูกชิ้นปิ้ง' },
  { id: 'tea', name: 'ชาไทย', cx: 2100, by: 1000, col: ['#f08a3c', '#fff0dc'], price: 'แก้วละ 25฿' },
  { id: 'candy', name: 'สายไหม', cx: 2360, by: 1000, col: ['#f7a8d8', '#d9f2ff'], price: 'ไม้ละ 20฿' },
  { id: 'toy', name: 'โคม & ของเล่น', cx: 2620, by: 1000, col: ['#8c7ae6', '#ffe9a8'], price: 'อันละ 30฿' },
  { id: 'krathong', name: 'กระทงทำมือ', cx: 2120, by: 580, col: ['#f48fb1', '#fff0f5'], price: 'ใบละ 40฿', open: true, item: 'krathong', cook: 2.3, buy: 'ซื้อกระทง' },
];
const STALL = {}, stalls = [];
function makeStall(d) {
  const s = Object.assign({ anim: 'idle', t: 0, say: '', sayT: 0, variant: 0, x: d.cx, y: d.by, w: 150 }, d);
  const look = randLook(); look.apron = pick(['#fff6e0', '#ffe0e6', '#e0f0ff']); look.shirtC = pick(['#d96a6a', '#6a9ad9', '#7fb77e', '#e0a04a']);
  s.vendor = mkChar(d.cx, d.by - 60, look);
  s.line = new Line({ spots: [{ x: d.cx, y: d.by + 38 }], slot: i => ({ x: d.cx, y: d.by + 82 + 44 * i }), max: 3, face: 'up', ready: () => s.anim === 'idle', approach: () => [{ x: d.cx, y: d.by + 38 }] });
  s.draw = c => drawStall(c, s);
  addLight(d.cx, d.by - 110, 250, 1); addLight(d.cx - 96, d.by - 150, 120, .8); addLight(d.cx + 96, d.by - 150, 120, .8); addLight(d.cx, d.by + 40, 200, .75);
  STALL[d.id] = s; stalls.push(s); ents.push(s); return s;
}
function say(s, t) { s.say = t; s.sayT = 2.2; }
function give(c, id, v) { cheer(c, c === P ? 150 : 110); for (let i = 0; i < 5; i++) parts.push({ type: 'spark', x: c.x + rr(-22, 22), y: c.y - rr(30, 80), vx: rr(-14, 14), vy: rr(-30, -10), life: 0, max: rr(.4, .8) }); if (c === P) { addItem(id, v); P.held = id; P.heldV = v; renderInv(); } else { c.held = id; c.heldV = v; } }
function updStall(s, dt) {
  s.line.update(); s.sayT -= dt;
  if (s.id === 'meatball' && R() < dt * 2.2) smoke(s.cx + rr(-40, 40), s.by - 86, .5);
  const c = s.line.occ[0];
  if (started && !c && s.sayT < -6 && Math.hypot(P.x - s.cx, P.y - (s.by + 45)) < 115) { say(s, s.open ? pick(['เชิญเลยจ้า', 'รับอะไรดีจ๊ะ']) : 'ร้านยังไม่เปิดจ้า'); s.vendor.joy = 1.2; }
  if (!c) { s.anim = 'idle'; return; }
  if (c.task.state === 'go') { if (!c.path.length) { c.task.state = 'serve'; c.dir = 'up'; s.anim = 'cook'; s.t = 0; s.variant = R() * 3 | 0; say(s, pick(['รอแป๊บนะจ๊ะ', 'ได้เลยจ้า', 'สักครู่น้า'])); } return; }
  s.t += dt;
  if (s.anim === 'cook') {
    if (s.id === 'meatball') { if (R() < dt * 14) smoke(s.cx + rr(-44, 44), s.by - 88, 1); if (R() < dt * 1.3) parts.push({ type: 'txt', txt: 'ฉ่า~', x: s.cx + rr(-50, 50), y: s.by - 105, vx: 0, vy: -22, life: 0, max: .9, col: '#ffd27a' }); }
    else if (R() < dt * 7) parts.push({ type: 'spark', x: s.cx + rr(-22, 22), y: s.by - 84 + rr(-14, 6), vx: 0, vy: -14, life: 0, max: .6 });
    if (s.t > s.cook) { s.anim = 'hand'; s.t = 0; }
  } else if (s.anim === 'hand' && s.t > .75) {
    give(c, s.item, s.variant); s.line.release(0); s.anim = 'idle'; say(s, 'ได้แล้วจ้า~'); cheer(s.vendor, 0);
    if (c === P) toast(s.id === 'krathong' ? 'ได้กระทงแล้ว ไปต่อคิวลอยที่ท่าน้ำได้เลย' : 'ได้ลูกชิ้นปิ้งแล้ว กด F เพื่อกิน');
  }
}
function vendorHands(s) {
  const v = s.vendor, cx = s.cx, by = s.by, t = s.t;
  v.handL = { x: cx - 17, y: by - 86 }; v.handR = { x: cx + 17, y: by - 86 }; s.fan = false;
  v.y = by - 60 + (s.anim === 'cook' ? Math.sin(t * 10) * 1.3 : s.anim === 'hand' ? ease(t / .4) * 3 : 0);
  if (s.anim === 'cook') {
    if (s.id === 'meatball') { v.handR = { x: cx - 12 + Math.sin(t * 5) * 24, y: by - 94 - Math.abs(Math.sin(t * 10)) * 5 }; v.handL = { x: cx + 44, y: by - 92 + Math.sin(t * 16) * 6 }; s.fan = true; }
    else { v.handR = { x: cx + 12 + Math.sin(t * 7) * 7, y: by - 90 + Math.cos(t * 7) * 4 }; v.handL = { x: cx - 14, y: by - 84 }; }
  } else if (s.anim === 'hand') { const u = ease(t / .5); v.handR = { x: lerp(cx + 12, cx + 15, u), y: lerp(by - 90, by - 60, u) }; }
}
function drawGoods(c, s) {
  const cx = s.cx, by = s.by, t = time;
  switch (s.id) {
    case 'meatball': case 'squid': {
      rbox(c, cx - 54, by - 86, 108, 24, 4, '#2c2828');
      c.fillStyle = `rgba(255,${110 + Math.sin(t * 9) * 30 | 0},40,${.55 + Math.sin(t * 13) * .15})`; c.fillRect(cx - 50, by - 82, 100, 14);
      for (let x = cx - 48; x <= cx + 48; x += 8) seg(c, x, by - 84, x, by - 64, '#151212', 1.4);
      for (let i = 0; i < 4; i++) {
        if (s.id === 'meatball') {
          if (s.anim === 'cook' && i === 1) continue;
          const x = cx - 36 + i * 24 + (s.anim === 'cook' ? Math.sin(s.t * 12 + i) * 1.5 : 0);
          seg(c, x, by - 56, x, by - 86, '#d9b98a', 2); for (const yy of [-80, -73, -66]) { circ(c, x, by + yy, 4.4, '#b8672c'); circ(c, x - 1.2, by + yy - 1.3, 1.4, '#e59a57'); }
        } else if (i < 3) {
          const x = cx - 30 + i * 30; seg(c, x, by - 54, x, by - 88, '#d9b98a', 2);
          poly(c, [x - 7, by - 72, x, by - 90, x + 7, by - 72], '#f6cdb8'); for (let k = -1; k <= 1; k++) seg(c, x + k * 4, by - 72, x + k * 5, by - 62, '#eab59c', 2);
        }
      }
      ell(c, cx + 84, by - 68, 17, 10, '#eadfce'); ell(c, cx + 84, by - 69, 13, 7, s.id === 'meatball' ? '#7a2e12' : '#3b7a3a');
      rbox(c, cx - 110, by - 80, 42, 18, 3, '#dfe7ea'); for (let i = 0; i < 4; i++) seg(c, cx - 104 + i * 10, by - 64, cx - 104 + i * 10, by - 78, s.id === 'meatball' ? '#e7b9a0' : '#f3d9cc', 3);
      break;
    }
    case 'kanom': for (let k = 0; k < 3; k++) {
      const x0 = cx - 104 + k * 71; rbox(c, x0, by - 82, 66, 22, 3, '#3f8f4a');
      for (let r2 = 0; r2 < 2; r2++) for (let q = 0; q < 5; q++) rbox(c, x0 + 4 + q * 12, by - 79 + r2 * 9, 10, 7, 2, ['#ffb3c7', '#fff3b0', '#b8e986', '#ffd59e', '#ffffff'][(q + r2 + k) % 5]);
    } break;
    case 'tea': {
      for (const x of [cx - 78, cx - 36]) { rbox(c, x - 17, by - 116, 34, 48, 7, 'rgba(232,120,42,.92)'); rbox(c, x - 17, by - 116, 34, 12, 6, 'rgba(255,240,220,.7)'); rbox(c, x - 14, by - 122, 28, 8, 3, '#c9a377'); }
      for (let i = 0; i < 4; i++) { const x = cx + 14 + i * 26; poly(c, [x - 8, by - 86, x + 8, by - 86, x + 6, by - 62, x - 6, by - 62], '#f0863a'); rbox(c, x - 9, by - 89, 18, 5, 2, '#fff'); seg(c, x + 2, by - 88, x + 6, by - 100, '#ff5d73', 2); }
      break;
    }
    case 'candy': {
      ell(c, cx - 52, by - 70, 40, 14, '#d9d9e8'); ell(c, cx - 52, by - 72, 30, 9, '#ffc4e6'); circ(c, cx - 52, by - 73, 5, '#b8b8cc');
      for (let i = 0; i < 3; i++) { const x = cx + 26 + i * 32; seg(c, x, by - 60, x, by - 104, '#f3e3c3', 2.5); const col = i % 2 ? '#bfe6ff' : '#ffb7e0'; circ(c, x, by - 112, 14, col); circ(c, x - 8, by - 104, 9, col); circ(c, x + 8, by - 105, 9, col); circ(c, x - 3, by - 116, 5, 'rgba(255,255,255,.5)'); }
      break;
    }
    case 'toy': {
      for (let i = 0; i < 3; i++) { const x = cx - 80 + i * 40; seg(c, x, by - 60, x, by - 96, '#c9a377', 2); for (let k = 0; k < 4; k++) { const a = time * 2 + i + k * 1.571; poly(c, [x, by - 98, x + Math.cos(a) * 13, by - 98 + Math.sin(a) * 13, x + Math.cos(a + .9) * 8, by - 98 + Math.sin(a + .9) * 8], ['#ff6b6b', '#ffd166', '#4ecdc4', '#7c6cf0'][k]); } circ(c, x, by - 98, 2.5, '#fff'); }
      for (let i = 0; i < 3; i++) paperLantern(c, cx + 34 + i * 30, by - 96, .7, ['#ffd9e6', '#d9f2ff', '#ffe7a3'][i]);
      break;
    }
    case 'krathong': for (let i = 0; i < 4; i++) { if (s.anim !== 'idle' && i === 1) continue; drawKrathong(c, cx - 81 + i * 54, by - 64, .95, i, false); } break;
  }
}
function drawStall(c, s) {
  const cx = s.cx, by = s.by, [c1, c2] = s.col;
  ell(c, cx, by + 4, 136, 13, 'rgba(10,5,30,.3)');
  const gr = c.createLinearGradient(0, by - 190, 0, by - 56); gr.addColorStop(0, '#4a2c1c'); gr.addColorStop(1, '#7a4c2c'); c.fillStyle = gr; c.fillRect(cx - 108, by - 190, 216, 134);
  c.fillStyle = '#8a5a34'; c.fillRect(cx - 108, by - 132, 216, 5);
  if (s.id === 'krathong') for (let i = 0; i < 3; i++) drawKrathong(c, cx - 70 + i * 70, by - 134, .85, i + 1, false);
  if (s.id === 'toy') for (let i = 0; i < 5; i++) paperLantern(c, cx - 84 + i * 42, by - 176, .55, ['#ffb3c7', '#bfe6ff', '#ffe7a3', '#c9f2c0', '#e3d4ff'][i]);
  vendorHands(s);
  drawChar(c, s.vendor, { noLegs: 1, noShadow: 1, noArms: 1 });
  poly(c, [cx - 112, by - 84, cx + 112, by - 84, cx + 119, by - 58, cx - 119, by - 58], '#d39b5f');
  c.fillStyle = '#a8703c'; c.fillRect(cx - 119, by - 58, 238, 58);
  c.strokeStyle = 'rgba(70,35,10,.28)'; c.lineWidth = 1; for (let y = by - 50; y < by; y += 9) { c.beginPath(); c.moveTo(cx - 119, y); c.lineTo(cx + 119, y); c.stroke(); }
  for (let x = cx - 104; x < cx + 119; x += 22) { c.beginPath(); c.moveTo(x, by - 58); c.lineTo(x, by); c.stroke(); }
  c.fillStyle = 'rgba(40,15,5,.25)'; c.fillRect(cx - 119, by - 8, 238, 8);
  drawGoods(c, s);
  if (s.anim === 'cook' && s.id === 'krathong') drawKrathong(c, cx, by - 66, 1.15, s.variant, s.t > 1.7);
  drawArms(c, s.vendor);
  const v = s.vendor;
  if (s.fan) { const h = v.handL; c.save(); c.translate(h.x, h.y); c.rotate(Math.sin(s.t * 16) * .5 - .3); seg(c, 0, 0, 0, -10, '#8a5a34', 2.5); ell(c, 0, -20, 11, 12, '#f3e0b0'); c.restore(); }
  if (s.anim === 'cook' && s.id === 'meatball') ITEMS.meatball.draw(c, v.handR.x, v.handR.y + 14, 1);
  if (s.anim === 'hand') { const u = ease(s.t / .7), x = lerp(cx + 12, cx + 19, u), y = lerp(by - 74, by + 4, u) - Math.sin(u * Math.PI) * 18; ITEMS[s.item].draw(c, x, y, 1 + Math.sin(u * Math.PI) * .25, s.variant); }
  tag(c, cx - 66, by - 30, s.price);
  if (!s.open) tag(c, cx + 62, by - 30, 'กำลังจัดร้าน', '#5a3519', '#ffe9c0');
  c.fillStyle = '#5d3a20'; c.fillRect(cx - 122, by - 190, 6, 190); c.fillRect(cx + 116, by - 190, 6, 190);
  for (let i = 0; i < 8; i++) {
    const xb = cx - 104 + i * 26, xf = cx - 126 + i * 31.5, col = i % 2 ? c2 : c1;
    poly(c, [xb, by - 250, xb + 26, by - 250, xf + 31.5, by - 188, xf, by - 188], col);
    c.beginPath(); c.arc(xf + 15.75, by - 188, 15.75, 0, Math.PI); c.fillStyle = col; c.fill();
  }
  c.fillStyle = 'rgba(60,20,30,.12)'; c.fillRect(cx - 126, by - 196, 252, 8);
  paperLantern(c, cx - 96, by - 172, .75); paperLantern(c, cx + 96, by - 172, .75);
  c.fillStyle = '#5d3a20'; c.fillRect(cx - 50, by - 262, 5, 14); c.fillRect(cx + 45, by - 262, 5, 14);
  board(c, cx, by - 276, s.name, 24);
}

// ---------- temple / arch / rope / railing ----------
function drawTemple(c) {
  const cx = 380, b = 985;
  ell(c, cx, b, 250, 16, 'rgba(10,5,30,.3)');
  c.fillStyle = '#e9dcc9'; c.fillRect(cx - 232, b - 36, 464, 36); c.fillStyle = '#d2c1ab'; c.fillRect(cx - 232, b - 8, 464, 8);
  for (let i = 0; i < 3; i++) { c.fillStyle = ['#f3e8d6', '#e6d8c2', '#d9c9b0'][i]; c.fillRect(cx - 70 - i * 10, b - 30 + i * 10, 140 + i * 20, 10); }
  const gr = c.createLinearGradient(0, b - 240, 0, b - 36); gr.addColorStop(0, '#f1e3cd'); gr.addColorStop(1, '#fff8ea'); c.fillStyle = gr; c.fillRect(cx - 205, b - 240, 410, 204);
  for (const wx of [-135, 135]) { rbox(c, cx + wx - 24, b - 190, 48, 104, 4, '#d9a441'); poly(c, [cx + wx - 26, b - 188, cx + wx, b - 222, cx + wx + 26, b - 188], '#d9a441'); rbox(c, cx + wx - 17, b - 182, 34, 90, 3, '#9c2a2e'); seg(c, cx + wx, b - 182, cx + wx, b - 92, '#d9a441', 2); }
  rbox(c, cx - 44, b - 196, 88, 160, 4, '#d9a441'); poly(c, [cx - 48, b - 194, cx, b - 246, cx + 48, b - 194], '#e7b955'); rbox(c, cx - 35, b - 186, 70, 150, 3, '#a3262a'); seg(c, cx, b - 186, cx, b - 36, '#e7b955', 2.5); circ(c, cx - 8, b - 105, 3, '#ffe08a'); circ(c, cx + 8, b - 105, 3, '#ffe08a');
  for (const px of [-205, -80, 80, 205]) { c.fillStyle = '#fffaf0'; c.fillRect(cx + px - 10, b - 240, 20, 204); c.fillStyle = '#d9a441'; c.fillRect(cx + px - 13, b - 240, 26, 12); c.fillRect(cx + px - 13, b - 48, 26, 12); }
  const tiers = [[262, b - 232, 128], [208, b - 282, 112], [150, b - 328, 98]];
  for (const [w, y, h] of tiers) {
    c.beginPath(); c.moveTo(cx - w, y); c.quadraticCurveTo(cx - w * .36, y - h * .3, cx, y - h); c.quadraticCurveTo(cx + w * .36, y - h * .3, cx + w, y); c.closePath();
    c.fillStyle = '#d9562b'; c.fill(); c.lineJoin = 'round'; c.strokeStyle = '#2f7d4f'; c.lineWidth = 9; c.stroke(); c.strokeStyle = '#f2c14e'; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(120,30,10,.3)'; c.lineWidth = 1.2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(cx - w * (1 - k * .19), y - h * k * .13); c.lineTo(cx + w * (1 - k * .19), y - h * k * .13); c.stroke(); }
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(cx + s * w, y); c.quadraticCurveTo(cx + s * (w + 18), y - 4, cx + s * (w + 22), y - 24); c.strokeStyle = '#f2c14e'; c.lineWidth = 4; c.stroke(); }
  }
  poly(c, [cx - 120, b - 238, cx, b - 318, cx + 120, b - 238], '#e7b955'); poly(c, [cx - 84, b - 242, cx, b - 298, cx + 84, b - 242], '#f7dc8a'); circ(c, cx, b - 262, 11, '#d9562b');
  c.beginPath(); c.moveTo(cx, b - 426); c.quadraticCurveTo(cx + 4, b - 452, cx + 16, b - 462); c.strokeStyle = '#f2c14e'; c.lineWidth = 4; c.stroke();
  paperLantern(c, cx - 150, b - 228, .9); paperLantern(c, cx + 150, b - 228, .9);
}
function drawArch(c) {
  const y = 1000, x1 = 1578, x2 = 1922;
  for (const x of [x1, x2]) { ell(c, x, y, 13, 4, 'rgba(10,5,30,.3)'); c.fillStyle = '#a3262a'; c.fillRect(x - 7, y - 300, 14, 300); c.fillStyle = '#f2c14e'; c.fillRect(x - 9, y - 300, 18, 8); c.fillRect(x - 9, y - 150, 18, 6); c.fillRect(x - 9, y - 10, 18, 10); }
  rbox(c, x1 - 14, y - 298, x2 - x1 + 28, 56, 8, '#f2c14e'); rbox(c, x1 - 9, y - 293, x2 - x1 + 18, 46, 6, '#b3262e');
  label(c, 'งานประเพณีลอยกระทง', (x1 + x2) / 2, y - 269, 30, '#ffe08a', 700);
  for (let i = 0; i < 6; i++) paperLantern(c, x1 + 32 + i * 56, y - 238, .8, i % 2 ? '#ffd9e6' : '#ffe7a3');
}
function drawRope(c) {
  for (let x = 1040; x <= 1620; x += 116) {
    if (x < 1620) { c.beginPath(); c.moveTo(x, 474); c.quadraticCurveTo(x + 58, 492, x + 116, 474); c.strokeStyle = '#c0392b'; c.lineWidth = 3.5; c.stroke(); }
    ell(c, x, 506, 8, 3, 'rgba(10,5,30,.3)'); c.fillStyle = '#d9a441'; c.fillRect(x - 3, 470, 6, 36); circ(c, x, 468, 5.5, '#f2c14e');
  }
}
function drawRailing(c) {
  const x0 = Math.max(0, camL - 60), x1 = Math.min(W, camL + vw + 60);
  for (const [a, b] of [[0, 1630], [1870, W]]) {
    const s = Math.max(a, x0), e = Math.min(b, x1); if (e <= s) continue;
    c.fillStyle = '#7a4c2c'; c.fillRect(s, 398, e - s, 5); c.fillRect(s, 412, e - s, 3.5);
    for (let x = Math.ceil(s / 60) * 60; x <= e; x += 60) { c.fillStyle = '#5d3a20'; c.fillRect(x - 3, 394, 6, 38); }
  }
}

// ---------- navigation graph for bots ----------
const N = {};
const node = (k, x, y) => N[k] = { k, x, y, adj: [] }, link = (a, b) => { N[a].adj.push(N[b]); N[b].adj.push(N[a]); };
const SX = [20, 380, 880, 1140, 1400, 1750, 2100, 2360, 2620, 2840, 2930], PX = [760, 1000, 1400, 1750, 2120, 2500, 2840];
SX.forEach((x, i) => { node('s' + x, x, 1105); if (i) link('s' + SX[i - 1], 's' + x); });
PX.forEach((x, i) => { node('p' + x, x, 640); if (i) link('p' + PX[i - 1], 'p' + x); });
node('av', 1750, 860); link('s1750', 'av'); link('av', 'p1750');
node('ea', 2840, 860); link('s2840', 'ea'); link('ea', 'p2840');
node('qe', 1005, 474); link('qe', 'p1000');
const EXITS = ['s20', 's2930'];
function nearest(x, y) { let best = null, bd = 1e9; for (const k in N) { const n = N[k], d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; best = n; } } return best; }
function route(b, target, final) {
  const from = nearest(b.x, b.y), to = N[target], prev = new Map([[from, null]]), q = [from];
  while (q.length) { const n = q.shift(); if (n === to) break; for (const m of n.adj) if (!prev.has(m)) { prev.set(m, n); q.push(m); } }
  const out = []; for (let n = to; n; n = prev.get(n)) out.unshift(n);
  b.path = out.map(n => n.k === 'qe' ? { x: n.x, y: n.y } : { x: n.x + b.jx, y: n.y + b.jy });
  if (final) b.path.push(final);
}
const BROWSE = [
  () => { const s = pick(stalls.filter(s => !s.open)); return { node: 's' + s.cx, x: s.cx + rr(-70, 70), y: 1048 + rr(0, 22), dir: 'up' }; },
  () => { const x = pick([2500, 2840]); return { node: 'p' + x, x: x + rr(-180, 60), y: 450, dir: 'up' }; },
  () => { const x = pick([760, 1000]); return { node: 'p' + x, x: x + rr(-30, 20) - (x === 1000 ? 60 : 0), y: 450, dir: 'up' }; },
  () => { const x = pick(SX.slice(1, 10)); return { node: 's' + x, x: x + rr(-90, 90), y: 1080 + rr(0, 110), dir: pick(['left', 'right', 'down', 'up']) }; },
  () => ({ node: 's380', x: 380 + rr(-90, 90), y: 1040 + rr(0, 30), dir: 'up' }),
];
const WISHES = ['ขอให้สุขภาพแข็งแรง', 'ขอให้รวยๆ เฮงๆ', 'ขอให้สอบผ่าน', 'ขอให้ครอบครัวมีความสุข', 'ขอให้เจอคนดีๆ', 'ขอให้งานราบรื่น', 'ขอให้แมวที่บ้านอายุยืน', 'ขอขมาพระแม่คงคา', 'ขอให้ปีหน้าดีกว่าเดิม', 'ขอให้ได้ไปเที่ยวไกลๆ'];

// ---------- pier ----------
const SPOTS = [1680, 1750, 1820].map(x => ({ x, y: 364 }));
const pier = new Line({ spots: SPOTS, slot: i => ({ x: 1590 - 56 * i, y: 470 }), max: 10, face: 'right', ready: () => true,
  approach: (c, i) => { const s = SPOTS[i], p = [{ x: s.x, y: 405 }, { x: s.x, y: s.y }]; if (c.y > 440) p.unshift({ x: 1650, y: 452 }); return p; } });
const krathongs = [];
function launchK(c, spot, v, wish, mine) { const k = { x: spot.x, y: c.y - 14, sy: c.y - 14, pt: 0, placing: true, v, wish, mine, age: 0, seed: R() * 9, vx: 0, tvx: rr(11, 17), ty: rr(205, 395) }; krathongs.push(k); return k; }
function updPier(dt) {
  pier.update();
  pier.occ.forEach((c, i) => {
    if (!c) return; const T = c.task, me = c === P;
    if (T.state === 'go') { if (!c.path.length) { T.state = 'serve'; T.sub = 0; T.t = 0; c.dir = 'up'; if (me) openWish(); } return; }
    T.t += dt;
    if (T.sub === 0) {
      if (me ? T.wish !== undefined : T.t > .9) { T.sub = 1; T.t = 0; c.pose = 'kneel'; const v = c.heldV || 0; c.held = null; if (me) useItem('krathong'); launchK(c, SPOTS[i], v, me ? T.wish : (R() < .6 ? pick(WISHES) : ''), me); }
    } else if (T.sub === 1) { if (T.t > 1.3) { T.sub = 2; T.t = 0; c.pose = 'pray'; T.dur = me ? 3 : rr(4, 7); } }
    else if (T.sub === 2) { if (T.t > T.dur) { T.sub = 3; T.t = 0; c.pose = null; T.dur = me ? .3 : rr(4, 8); } }
    else if (T.t > T.dur) { pier.release(i); cheer(c, me ? 120 : 0); c.path = me ? [] : [{ x: SPOTS[i].x, y: 405 }, { x: 1850, y: 455 }, { x: 1890, y: 560 }]; if (me) toast('ลอยกระทงเรียบร้อย ขอให้สมหวังนะ'); }
  });
}
function updKrathongs(dt) {
  for (const k of krathongs) {
    k.age += dt;
    if (k.placing) { k.pt += dt; k.y = lerp(k.sy, 322, ease(k.pt / 1.3)); if (k.pt >= 1.3) { k.placing = false; for (const m of [1.2, 1.9]) parts.push({ type: 'ring', x: k.x, y: 326, vx: 0, vy: 0, life: 0, max: m }); } continue; }
    k.vx += (k.tvx - k.vx) * dt * .4; k.x += k.vx * dt; k.y += (k.ty - k.y) * dt * .08;
    if (k.x > W + 40) { k.x = -40; k.wish = ''; }
  }
  if (krathongs.length > 80) krathongs.splice(0, krathongs.length - 80);
}

// ---------- particles ----------
const parts = [];
function smoke(x, y, a) { parts.push({ type: 'smoke', x, y, vx: rr(-6, 10), vy: rr(-34, -20), life: 0, max: rr(1.2, 2), r: rr(5, 9), a }); }
function updParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life > p.max) parts.splice(i, 1); } }

// ---------- player & bots ----------
const P = mkChar(1750, 1150, PRESETS[0]); P.speed = 200; P.name = ''; P.busy = 0; P.dir = 'up'; P.vx = P.vy = 0;
const bots = [];
const RECTS = [[0, 430, 700, 1005], [700, 735, 765, 1005], [765, 735, 1515, 1005], [1985, 735, 2735, 1005], [2000, 436, 2240, 585]];
function blocked(x, y) {
  if (x < 25 || x > W - 25 || y > 1222) return true;
  if (y < 440) return !(x > 1640 && x < 1860 && y > 352);
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
  if (P.task) { if (P.task.state === 'wait' && (ix || iy)) { P.task.line.leave(P); toast('ออกจากคิวแล้ว'); } else { follow(P, dt, false); return; } }
  if (P.busy > 0) { P.busy -= dt; if (P.busy <= 0) { P.pose = null; const id = P.held; useItem(id); cheer(P, 90); for (let i = 0; i < 4; i++) parts.push({ type: 'heart', x: P.x + rr(-16, 16), y: P.y - 96, vx: rr(-10, 10), vy: rr(-30, -18), life: 0, max: 1.1 }); } return; }
  const l = Math.hypot(ix, iy) || 1, a = Math.min(1, dt * 14);
  P.vx += (ix / l * P.speed - P.vx) * a; P.vy += (iy / l * P.speed - P.vy) * a;
  const v = Math.hypot(P.vx, P.vy);
  if (ix || iy || v > 12) {
    if (ix || iy) { P.path = []; P.dir = ix ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up'); }
    if (!blocked(P.x + P.vx * dt, P.y)) P.x += P.vx * dt; else P.vx = 0;
    if (!blocked(P.x, P.y + P.vy * dt)) P.y += P.vy * dt; else P.vy = 0;
    P.moving = true; P.phase += dt * v * .075;
  } else { P.vx = P.vy = 0; follow(P, dt, true); }
  const st = Math.sin(P.phase) > 0;
  if (P.moving && st !== P.ls) parts.push({ type: 'smoke', x: P.x, y: P.y - 2, vx: rr(-8, 8), vy: -9, life: 0, max: .45, r: 3, a: .55 });
  P.ls = st;
}

function makePlan() {
  const p = [], br = () => p.push({ t: 'browse' });
  for (let i = R() * 2 | 0; i >= 0; i--) br();
  if (R() < .6) { p.push({ t: 'buy', s: 'meatball' }); br(); p.push({ t: 'eat' }); }
  if (R() < .85) { p.push({ t: 'buy', s: 'krathong' }); if (R() < .3) br(); p.push({ t: 'float' }); br(); }
  if (R() < .5) br(); p.push({ t: 'exit' }); return p;
}
function spawnBot(b, initial) {
  const n = initial ? N[pick(Object.keys(N).filter(k => k !== 'qe'))] : N[pick(EXITS)];
  Object.assign(b, mkChar(n.x + rr(-20, 20), n.y + rr(-20, 20), randLook()), { speed: rr(68, 98), jx: rr(-30, 30), jy: rr(-26, 26), plan: makePlan(), step: null, after: null });
  if (initial === 2) { b.held = 'krathong'; b.heldV = R() * 3 | 0; b.plan = [{ t: 'float' }, { t: 'browse' }, { t: 'exit' }]; }
  return b;
}
function updBot(b, dt) {
  b.moving = false;
  if (b.task) { follow(b, dt, false); return; }
  if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0 && b.after) { const f = b.after; b.after = null; f(); } return; }
  if (b.path.length) { follow(b, dt, false); return; }
  if (b.step && b.step.arrive) { const f = b.step.arrive; b.step.arrive = null; f(); return; }
  const s = b.plan.shift(); if (!s) { spawnBot(b); return; } b.step = s;
  if (s.t === 'browse') { const sp = pick(BROWSE)(); route(b, sp.node, { x: sp.x, y: sp.y }); s.arrive = () => { b.dir = sp.dir; b.wait = rr(2.5, 7); }; }
  else if (s.t === 'buy') { const st = STALL[s.s]; route(b, s.s === 'krathong' ? 'p2120' : 's' + st.cx, null); s.arrive = () => { if (st.line.full() || b.held) b.wait = .5; else st.line.join(b); }; }
  else if (s.t === 'eat') { if (b.held && ITEMS[b.held].edible) { b.pose = 'eat'; b.wait = 1.6; b.after = () => { b.pose = null; b.held = null; cheer(b, 0); }; } }
  else if (s.t === 'float') { if (b.held !== 'krathong') return; route(b, 'qe', null); s.arrive = () => { if (pier.full()) b.plan.unshift({ t: 'browse' }, { t: 'float' }); else pier.join(b); }; }
  else if (s.t === 'exit') { route(b, pick(EXITS), null); s.arrive = () => spawnBot(b); }
}

// ---------- inventory / HUD ----------
const inv = [], $ = id => document.getElementById(id);
function addItem(id, v) { const s = inv.find(i => i.id === id); if (s) { s.n++; s.v = v; } else inv.push({ id, n: 1, v: v || 0 }); renderInv(); }
function useItem(id) { const s = inv.find(i => i.id === id); if (!s) return; if (--s.n <= 0) { inv.splice(inv.indexOf(s), 1); if (P.held === id) P.held = null; } renderInv(); }
function renderInv() {
  const bar = $('bar'); bar.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const s = inv[i], el = document.createElement('div'); el.className = 'slot' + (s && P.held === s.id ? ' on' : '');
    el.innerHTML = `<span class="k">${i + 1}</span>`;
    if (s) { const c = document.createElement('canvas'); c.width = c.height = 116; const x = c.getContext('2d'); ITEMS[s.id].draw(x, 58, s.id === 'krathong' ? 84 : 100, 2.6, s.v); el.appendChild(c); const n = document.createElement('span'); n.className = 'n'; n.textContent = s.n > 1 ? '×' + s.n : ''; el.appendChild(n); el.title = ITEMS[s.id].name; }
    el.onclick = e => { e.stopPropagation(); toggleHold(i); }; bar.appendChild(el);
  }
  const h = P.held && ITEMS[P.held]; $('barHint').textContent = h ? `ถืออยู่: ${h.name}${h.edible ? ' · กด F เพื่อกิน' : ''}` : '';
}
function toggleHold(i) { const s = inv[i]; if (!s || P.busy > 0 || (P.task && P.task.line === pier)) return; if (P.held === s.id) P.held = null; else { P.held = s.id; P.heldV = s.v; } renderInv(); }
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 2600); }
function openWish() { $('wish').style.display = 'flex'; $('wishText').value = ''; setTimeout(() => $('wishText').focus(), 30); }
function submitWish() { if (P.task && P.task.line === pier) P.task.wish = $('wishText').value.trim(); $('wish').style.display = 'none'; cv.focus(); for (const k in keys) keys[k] = false; }
$('wishBtn').onclick = submitWish;
$('wishText').addEventListener('keydown', e => { if (e.key === 'Enter') submitWish(); });

function findInteract() {
  if (P.task || P.busy > 0) return null;
  for (const s of stalls) if (Math.hypot(P.x - s.cx, P.y - (s.by + 45)) < 95) return s.open
    ? { label: `${s.buy} (${s.price})`, act() { if (s.line.full()) toast('คิวร้านนี้ยาวอยู่ รอสักครู่นะ'); else s.line.join(P); } }
    : { label: `ดูร้าน${s.name}`, act() { toast(`ร้าน${s.name}ยังจัดของไม่เสร็จ รอบหน้าเปิดแน่นอน`); } };
  if (P.y < 620 && P.x > 960 && P.x < 1900) {
    const has = inv.find(i => i.id === 'krathong');
    return { label: has ? 'ต่อคิวลอยกระทง' : 'ลอยกระทง (ต้องมีกระทงก่อน)', act() {
      if (!has) return toast('ยังไม่มีกระทง ไปซื้อที่ร้านกระทงทำมือทางขวาก่อนนะ →');
      if (pier.full()) return toast('คิวเต็มแล้ว รอสักครู่นะ');
      P.held = 'krathong'; P.heldV = has.v; renderInv(); pier.join(P);
    } };
  }
  if (Math.hypot(P.x - 380, P.y - 1040) < 100) return { label: 'เข้าโบสถ์ไหว้พระ', act() { toast('โบสถ์กำลังเตรียมงาน เปิดให้เข้าไหว้พระรอบหน้า'); } };
  return null;
}
let curI = null, promptTxt = '';
function updPrompt() {
  curI = started ? findInteract() : null; let t = '';
  if (curI) t = `<kbd>E</kbd>${curI.label}`;
  else if (P.task && P.task.state === 'wait') t = (P.task.line === pier ? `ต่อคิวลอยกระทง · คิวที่ ${P.task.i + 1}` : 'กำลังต่อคิว') + ' · กดปุ่มเดินเพื่อออกจากคิว';
  else if (P.task && P.task.line === pier && P.task.state === 'serve' && P.task.sub >= 1) t = 'กำลังอธิษฐาน...';
  if (t !== promptTxt) { promptTxt = t; const el = $('prompt'); el.innerHTML = t; el.style.display = t ? 'block' : 'none'; }
}
// ใช้ตำแหน่งปุ่มจริง (e.code) เพื่อให้กดได้แม้คีย์บอร์ดเป็นภาษาไทย
const keyOf = e => { const c = e.code || ''; return c.startsWith('Key') ? c.slice(3).toLowerCase() : c.startsWith('Digit') ? c.slice(5) : c.startsWith('Numpad') && c.length === 7 ? c.slice(6) : c ? c.toLowerCase() : (e.key || '').toLowerCase(); };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; const k = keyOf(e); keys[k] = true; if (!started) return;
  if (k.startsWith('arrow') || k === 'space') e.preventDefault();
  if (e.repeat) return;
  if (k === 'e' && curI) curI.act();
  if (k.length === 1 && k >= '1' && k <= '8') toggleHold(+k - 1);
  if (k === 'f' && P.held && ITEMS[P.held].edible && !P.task && P.busy <= 0) { P.pose = 'eat'; P.busy = 1.5; P.path = []; }
});
addEventListener('keyup', e => keys[keyOf(e)] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
cv.addEventListener('mousedown', e => { if (!started || P.task || P.busy > 0) return; const r = cv.getBoundingClientRect(); P.path = [{ x: camL + (e.clientX - r.left) / r.width * vw, y: camT + (e.clientY - r.top) / r.height * VIEW_H }]; });

// ---------- start screen ----------
let lookSel = 0;
PRESETS.forEach((L, i) => {
  const c = document.createElement('canvas'); c.width = 168; c.height = 208; if (!i) c.className = 'sel';
  const x = c.getContext('2d'); x.scale(1.7, 1.7); const ch = mkChar(49, 108, L); ch.seed = 0; drawChar(x, ch);
  c.onclick = () => { lookSel = i; [...$('looks').children].forEach((el, j) => el.className = j === i ? 'sel' : ''); };
  $('looks').appendChild(c);
});
function startGame() { P.name = $('name').value.trim() || 'ฉัน'; P.look = PRESETS[lookSel]; $('start').style.display = 'none'; started = true; if (document.activeElement) document.activeElement.blur(); toast('ยินดีต้อนรับสู่งานลอยกระทง'); }
$('goBtn').onclick = startGame;
$('name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

// ---------- world assembly ----------
const BG = buildBG();
STALL_DEFS.forEach(makeStall);
ents.push({ x: 380, y: 985, w: 320, draw: drawTemple }, { x: 1750, y: 1000, w: 260, draw: drawArch }, { x: 1330, y: 506, w: 340, draw: drawRope }, { x: 0, y: 430, wide: true, draw: drawRailing });
addLight(380, 870, 380, 1); addLight(230, 760, 160, .8); addLight(530, 760, 160, .8); addLight(1750, 800, 300, .9);
for (const x of [300, 640, 980, 1320, 1660, 2000, 2340, 2680]) ents.push(lampPost(x, 1234, 160));
for (const x of [780, 1080, 1380, 1626, 1874, 2290, 2560, 2860]) ents.push(lampPost(x, 432, 128));
[[150, 1415, 1], [520, 1440, 0], [860, 1420, 1], [1190, 1445, 0], [1500, 1418, 1], [1990, 1425, 1], [2330, 1445, 0], [2690, 1420, 1], [2910, 1445, 0], [50, 620, 0], [668, 700, 1], [725, 980, 0], [40, 900, 0]].forEach(([x, y, l], i) => ents.push(tree(x, y, 11 + i * 7, l)));
ents.push(signpost(1642, 992, ['↑ ท่าน้ำลอยกระทง', '↗ ร้านกระทง', '← โบสถ์']), signpost(1936, 700, ['→ ร้านกระทงทำมือ', '← เข้าคิวลอยกระทง', '↓ ตลาด']),
  signpost(962, 540, ['ทางเข้าคิว →', 'ลอยกระทง']), signpost(1950, 446, ['ท่าน้ำลอยกระทง', 'ลอยครั้งละ 3 คน', '← กรุณาต่อคิว']), signpost(2335, 618, ['ซื้อกระทงที่นี่', 'ก่อนไปลอยนะ']), signpost(590, 1022, ['โบสถ์ · ไหว้พระขอพร']));
for (let i = 0; i < 18; i++) bots.push(spawnBot({}, i < 5 ? 2 : 1));
for (let i = 0; i < 30; i++) krathongs.push({ x: R() * W, y: rr(205, 398), ty: rr(205, 398), v: R() * 3 | 0, wish: '', age: 99, seed: R() * 9, vx: rr(11, 17), tvx: rr(11, 17) });
const skyLanterns = []; for (let i = 0; i < 9; i++) skyLanterns.push({ x: R() * W, y: rr(10, 140), v: rr(3, 7), s: rr(.5, 1) });
const HOLE = radial('rgba(0,0,0,1)', 'rgba(0,0,0,.55)', 'rgba(0,0,0,0)'), GLOW = radial('rgba(255,185,95,.9)', 'rgba(255,160,70,.28)', 'rgba(255,140,60,0)');
function radial(a, m, z) { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, a); gr.addColorStop(.45, m); gr.addColorStop(1, z); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c; }
const BUNTING = [];
for (let i = 0; i < stalls.length - 1; i++) { const a = stalls[i], b = stalls[i + 1]; if (a.by === b.by && b.cx - a.cx < 300) BUNTING.push([a.cx + 70, a.by - 290, b.cx - 70, b.by - 290, 26]); }
for (const x of [300, 640, 980, 1320, 1660, 2000, 2340]) BUNTING.push([x, 1074, x + 340, 1074, 34]);
const FLAGC = ['#ff6b6b', '#ffd166', '#4ecdc4', '#ff8fab', '#7c6cf0', '#ff9f43'];

// ---------- render ----------
function drawRiver() {
  const x0 = camL - 40, x1 = camL + vw + 40;
  for (const l of farLights) if (l.x > x0 && l.x < x1) for (let j = 0; j < 6; j++) { g.globalAlpha = .34 - j * .05; g.fillStyle = l.col; g.fillRect(l.x - 3 - j + Math.sin(time * 1.4 + j * 1.7 + l.x) * 3, 172 + j * 10, 6 + j * 2, 3); }
  for (let j = 0; j < 14; j++) { g.globalAlpha = .3 - j * .015; g.fillStyle = '#ffd98a'; g.fillRect(1735 - 14 - j * 1.5 + Math.sin(time * 1.2 + j) * 4, 172 + j * 9, 28 + j * 3, 3); }
  for (let j = 0; j < 20; j++) { g.globalAlpha = .22 - j * .008; g.fillStyle = '#eee9ff'; g.fillRect(2010 - 10 - j * 2 + Math.sin(time + j * 1.3) * 5, 176 + j * 12, 20 + j * 4, 3); }
  g.globalAlpha = 1;
  for (const w of wavelets) if (w.x > x0 && w.x < x1) { g.globalAlpha = .08 + .07 * Math.sin(time * 1.1 + w.p); seg(g, w.x + Math.sin(time * .5 + w.p) * 6, w.y, w.x + w.l + Math.sin(time * .5 + w.p) * 6, w.y, '#b9b0ff', 1.6); }
  g.globalAlpha = 1;
  for (const s of skyLanterns) { s.y -= s.v * .016; s.x -= s.v * .008; if (s.y < -12) { s.y = 142; s.x = R() * W; } if (s.x > x0 && s.x < x1) { circ(g, s.x, s.y, 9 * s.s, 'rgba(255,170,80,.22)'); rbox(g, s.x - 3 * s.s, s.y - 4 * s.s, 6 * s.s, 8 * s.s, 2, '#ffc46b'); } }
  krathongs.sort((a, b) => a.y - b.y);
  for (const k of krathongs) if (k.x > x0 && k.x < x1) {
    const yb = k.placing ? k.y : k.y + Math.sin(time * 1.6 + k.seed) * 1.5, inWater = !k.placing || k.pt > 1.1;
    if (inWater) { ell(g, k.x, yb + 12, 16, 9, 'rgba(255,170,80,.16)'); g.globalAlpha = .35; g.fillStyle = '#ffc46b'; for (let j = 0; j < 3; j++) g.fillRect(k.x - 5 + Math.sin(time * 2 + j + k.seed) * 3, yb + 9 + j * 5, 10 - j * 2, 2); g.globalAlpha = 1; }
    drawKrathong(g, k.x, yb, 1.15, k.v, inWater || k.mine !== undefined);
    if (inWater) dyn.push({ x: k.x, y: yb - 20, r: 58, a: .9 });
  }
}
const dyn = [];
function drawLighting() {
  const w = dark.width, h = dark.height, s = sc / 2;
  dg.setTransform(1, 0, 0, 1, 0, 0); dg.globalCompositeOperation = 'source-over'; dg.clearRect(0, 0, w, h); dg.fillStyle = 'rgba(14,8,46,.6)'; dg.fillRect(0, 0, w, h);
  dg.globalCompositeOperation = 'destination-out';
  const y0 = (150 - camT) * s, y1 = (445 - camT) * s;
  if (y1 > 0) { const gr = dg.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); dg.fillStyle = gr; dg.fillRect(0, 0, w, y1); }
  const vis = [];
  for (const L of lights.concat(dyn)) if (L.x + L.r > camL && L.x - L.r < camL + vw && L.y + L.r > camT && L.y - L.r < camT + VIEW_H) vis.push(L);
  for (const L of vis) { dg.globalAlpha = L.a; dg.drawImage(HOLE, (L.x - L.r - camL) * s, (L.y - L.r - camT) * s, L.r * 2 * s, L.r * 2 * s); }
  dg.globalAlpha = 1;
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(dark, 0, 0, cv.width, cv.height);
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc); g.globalCompositeOperation = 'lighter';
  for (const L of vis) { g.globalAlpha = .2 * L.a * (1 + Math.sin(time * 3 + L.x) * .05); const r = L.r * .85; g.drawImage(GLOW, L.x - r, L.y - r, r * 2, r * 2); }
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
function bubble(c, x, y, t) {
  c.font = F(15, 600); const w = c.measureText(t).width + 22;
  rbox(c, x - w / 2, y - 15, w, 30, 13, '#fffaf0'); poly(c, [x - 14, y + 13, x - 4, y + 13, x - 16, y + 24], '#fffaf0'); label(c, t, x, y + 1, 15, '#5a3519');
}
function render() {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b0926'; g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(sc, 0, 0, sc, -camL * sc, -camT * sc);
  g.drawImage(BG, camL * BGS, camT * BGS, vw * BGS, VIEW_H * BGS, camL, camT, vw, VIEW_H);
  dyn.length = 0; drawRiver();
  const list = [];
  for (const e of ents) if (e.wide || (e.x + e.w + 200 > camL && e.x - e.w - 200 < camL + vw)) list.push(e);
  for (const b of bots) list.push(b); list.push(P);
  list.sort((a, b) => a.y - b.y);
  for (const e of list) e.draw ? e.draw(g) : drawChar(g, e);
  for (const p of parts) if (p.type === 'ring') { const u = p.life / p.max, r = 12 + u * 30; g.beginPath(); g.ellipse(p.x, p.y, r, r * .38, 0, 0, 7); g.strokeStyle = `rgba(255,232,200,${.55 * (1 - u)})`; g.lineWidth = 1.6; g.stroke(); }
  for (const p of parts) if (p.type === 'smoke') { const u = p.life / p.max; circ(g, p.x, p.y, p.r * (1 + u * 1.6), `rgba(240,230,235,${.3 * p.a * (1 - u)})`); }
  for (const [x1, y1, x2, y2, sag] of BUNTING) if (x2 > camL && x1 < camL + vw) {
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2, y1 + sag * 2, x2, y2); g.strokeStyle = '#e8d9c0'; g.lineWidth = 1.5; g.stroke();
    const n = Math.round((x2 - x1) / 30);
    for (let i = 1; i < n; i++) { const u = i / n, x = lerp(x1, x2, u), y = y1 + sag * 4 * u * (1 - u) * 1 + Math.sin(time * 2 + i) * .6; poly(g, [x - 9, y, x + 9, y, x, y + 18], FLAGC[i % 6]); }
  }
  drawLighting();
  for (const p of parts) {
    const u = p.life / p.max; g.globalAlpha = 1 - u;
    if (p.type === 'txt') label(g, p.txt, p.x, p.y, 16, p.col, 700, '#4a2010');
    else if (p.type === 'spark') { seg(g, p.x - 5, p.y, p.x + 5, p.y, '#fff4b0', 2); seg(g, p.x, p.y - 5, p.x, p.y + 5, '#fff4b0', 2); }
    else if (p.type === 'heart') { circ(g, p.x - 3, p.y, 4, '#ff7fa0'); circ(g, p.x + 3, p.y, 4, '#ff7fa0'); poly(g, [p.x - 7, p.y + 1.5, p.x + 7, p.y + 1.5, p.x, p.y + 10], '#ff7fa0'); }
  }
  g.globalAlpha = 1;
  for (const k of krathongs) if (k.wish && !k.placing) { const life = k.mine ? 14 : 8, a = Math.min(1, k.age - 1.3, life - k.age); if (a > 0) { g.globalAlpha = a; label(g, k.wish, k.x, k.y - (k.mine ? 62 : 44) - Math.min(10, k.age * 2), k.mine ? 17 : 13, k.mine ? '#ffe08a' : '#f3e6ff', 600, 'rgba(20,10,50,.85)'); } }
  g.globalAlpha = 1;
  for (const s of stalls) if (s.sayT > 0) bubble(g, s.cx + 78, s.by - 168, s.say);
  if (started && P.pose !== 'kneel' && P.pose !== 'pray') label(g, P.name, P.x, charBase(P) - 100, 15, '#fff', 700, 'rgba(30,15,50,.9)');
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) { const dt = Math.min(.05, (now - last) / 1000); last = now; tick(dt); render(); requestAnimationFrame(frame); }
function tick(dt) {
  time += dt;
  for (const s of stalls) updStall(s, dt);
  updPier(dt); updPlayer(dt); for (const b of bots) updBot(b, dt); updKrathongs(dt); updParts(dt); animChar(P, dt); for (const b of bots) animChar(b, dt); for (const s of stalls) animChar(s.vendor, dt); updPrompt();
  const tx = P.x, ty = P.y - 70;
  cam.x += (tx - cam.x) * Math.min(1, dt * 5); cam.y += (ty - cam.y) * Math.min(1, dt * 5);
  camL = vw >= W ? (W - vw) / 2 : Math.max(0, Math.min(W - vw, cam.x - vw / 2)); camT = Math.max(0, Math.min(H - VIEW_H, cam.y - VIEW_H / 2));
}
renderInv();
if (document.fonts && document.fonts.load) document.fonts.load(F(20, 700), 'ลอยกระทง');
requestAnimationFrame(frame);
window.G = { P, bots, pier, stalls, krathongs, inv, keys, toast, addItem, step(n) { for (let i = 0; i < n; i++) tick(1 / 30); render(); } };
