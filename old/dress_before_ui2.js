'use strict';
// ============================================================
//  สร้างตัวละครเอง: ตัวเปล่า + เลือกผม เสื้อ ผ้านุ่ง รองเท้า (ลายเส้นเดิม)
//  ประกอบภาพในเกมจากสูตรเดียวกับ tools/gen_assets.py
//  เครื่องประดับไม่อยู่ในหน้านี้ ต้องไปซื้อในตลาด
// ============================================================
{ const i3 = WALKERS.indexOf(3); if (i3 >= 0) WALKERS.splice(i3, 1); }   // แม่ค้าหาบเร่เป็น NPC เท่านั้น
const D_OL = '#33211f', D_LW = 5.5, D_GOLD = '#f2c14e';
function sP(d, fill, sw, stroke, op = 1) { const w = sw == null ? D_LW : sw; return `<path d="${d}" fill="${fill}" ${w ? `stroke="${stroke || D_OL}" stroke-width="${w}"` : 'stroke="none"'} opacity="${op}" stroke-linejoin="round" stroke-linecap="round"/>`; }
function sE(cx, cy, rx, ry, fill, sw = 0, op = 1) { return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${sw ? `stroke="${D_OL}" stroke-width="${sw}"` : 'stroke="none"'} opacity="${op}"/>`; }
function sL(d, stroke, sw, op = 1) { return `<path d="${d}" fill="none" stroke="${stroke || D_OL}" stroke-width="${sw || D_LW}" opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`; }
function sG(inner, x = 0, y = 0, s = 1, flip = false) { return `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})">${inner}</g>`; }
const D_HEAD = 'M-98,-205 C-101,-270 -52,-306 0,-306 C52,-306 101,-270 98,-205 C96,-150 54,-122 0,-122 C-54,-122 -96,-150 -98,-205Z';
const D_BODY = 'M-38,-116 C-47,-92 -49,-62 -43,-36 C-22,-27 22,-27 43,-36 C49,-62 47,-92 38,-116 C20,-124 -20,-124 -38,-116Z';
const D_CAP = 'M-102,-208 C-106,-276 -56,-314 0,-314 C56,-314 106,-276 102,-208 C100,-152 56,-122 0,-122 C-56,-122 -100,-152 -102,-208Z';
const D_LONG = 'M-106,-220 C-112,-292 -56,-318 0,-318 C56,-318 112,-292 106,-220 C116,-150 110,-92 88,-58 C62,-46 -62,-46 -88,-58 C-110,-92 -116,-150 -106,-220Z';
function dFlower() { let s = ''; for (let i = 0; i < 5; i++) s += `<g transform="rotate(${i * 72})">` + sP('M0,0 C-9,-7 -9,-20 0,-24 C9,-20 9,-7 0,0Z', '#fff', 2.5) + '</g>'; return s + sE(0, 0, 6, 6, '#ffc531', 2.5); }
function dFace(expr) {
  const ey = -196; let s = sE(-64, -176, 15, 9, '#ff9aa6', 0, .7) + sE(64, -176, 15, 9, '#ff9aa6', 0, .7);
  for (const ex of [-40, 40]) {
    const f = ex > 0 ? 1 : -1;
    if (expr === 'laugh' || expr === 'happy') s += sL(`M${ex - 12},${ey + 4} Q${ex},${ey - 12} ${ex + 12},${ey + 4}`);
    else if (expr === 'pray') s += sL(`M${ex - 12},${ey - 2} Q${ex},${ey + 10} ${ex + 12},${ey - 2}`);
    else s += sE(ex, ey, 8, 11.5, '#2a1a18') + sE(ex - 2.4, ey - 4.5, 2.6, 3, '#fff');
    if (expr === 'smug') s += sL(`M${ex - 13 * f},${ey - 22} L${ex + 11 * f},${ey - 30}`, null, 5);
    else if (expr === 'o' || expr === 'eat') s += sL(`M${ex - 12},${ey - 30} Q${ex},${ey - 38} ${ex + 12},${ey - 30}`, null, 5);
    else s += sL(`M${ex - 11},${ey - 27} Q${ex},${ey - 32} ${ex + 11},${ey - 27}`, null, 5);
  }
  if (expr === 'laugh') s += sP('M-20,-173 Q0,-136 20,-173Z', '#c9483a') + sE(0, -157, 9, 5, '#ff9a9a');
  else if (expr === 'eat') s += sE(0, -160, 11, 10, '#a8483a', 4);
  else if (expr === 'smug') s += sL('M-16,-166 Q-8,-156 0,-166 Q8,-156 16,-166');
  else if (expr === 'pray') s += sL('M-8,-166 Q0,-160 8,-166');
  else s += sL('M-15,-169 Q0,-153 15,-169');
  return s;
}
function dStubble(full) { return full ? sP(D_HEAD, '#4a3a3a', 0, null, .13) : sP('M-95,-216 C-97,-276 -52,-303 0,-303 C52,-303 97,-276 95,-216 C60,-236 -60,-236 -95,-216Z', '#4a3a3a', 0, null, .13); }
const D_PEEK = 'M-93,-230 C-91,-298 -44,-315 0,-315 C44,-315 91,-298 93,-230 C74,-254 34,-264 0,-262 C-34,-264 -74,-254 -93,-230Z';
function dHairFront(kind, c) {
  const lw = D_LW;
  if (kind === 'mahadthai') return dStubble() + sP('M-64,-266 C-60,-314 60,-314 64,-266 C40,-258 -40,-258 -64,-266Z', c) + sL('M-34,-292 C-16,-300 16,-300 34,-292', '#fff', 6, .2);
  if (kind === 'peek' || kind === 'twin') {
    let s = kind === 'twin' ? sE(-70, -304, 24, 22, c, lw) + sE(70, -304, 24, 22, c, lw) + sL('M-88,-292 L-54,-296 M88,-292 L54,-296', '#e2574a', 5) : '';
    s += sP(D_PEEK, c);
    for (const f of [-1, 1]) s += sP(`M${91 * f},-240 C${100 * f},-224 ${98 * f},-200 ${88 * f},-184 C${84 * f},-202 ${84 * f},-222 ${81 * f},-238Z`, c, lw * .7);
    return s + sL('M-52,-288 C-26,-300 26,-300 52,-288', '#fff', 6, .2);
  }
  if (kind === 'juk') { let s = dStubble() + sE(0, -322, 25, 23, c, lw) + sL('M-34,-330 L34,-316', D_GOLD, 5); for (let i = 0; i < 7; i++) s += sE(-21 + i * 7, -302 - (3 - Math.abs(i - 3)) * 1.4, 4.6, 4.6, '#fff', 1.6); return s; }
  if (kind === 'queue') return sP('M-86,-248 C-82,-306 82,-306 86,-248 C50,-262 -50,-262 -86,-248Z', '#2a2230') + sL('M-84,-250 C-50,-264 50,-264 84,-250', '#c9483a', 4) + sE(0, -305, 9, 8, '#c9483a', 3);
  if (kind === 'long' || kind === 'muay' || kind === 'braid') {
    let s = sP('M-101,-212 C-105,-282 -54,-314 0,-314 C54,-314 105,-282 101,-212 C92,-238 58,-264 5,-272 L0,-262 L-5,-272 C-58,-264 -92,-238 -101,-212Z', c);
    for (const f of [-1, 1]) s += sP(`M${97 * f},-236 C${106 * f},-212 ${104 * f},-176 ${92 * f},-150 C${86 * f},-176 ${86 * f},-210 ${84 * f},-236Z`, c, lw * .7);
    if (kind === 'braid') { for (let i = 0; i < 5; i++) s += sE(86 - i * 4, -146 + i * 20, 13 - i * .8, 13, c, lw * .8); s += sP('M60,-58 L80,-66 L84,-46 L70,-50 L62,-40Z', '#e2574a', lw * .7); }
    return s + sL('M-56,-288 C-30,-300 -10,-302 -4,-300 M56,-288 C30,-300 10,-302 4,-300', '#fff', 6, .2);
  }
  return dStubble();
}
function dHairBack(kind, c) {
  const shine = sL('M-60,-282 C-30,-298 30,-298 60,-282', '#fff', 7, .2);
  if (kind === 'mahadthai') return dStubble(true) + sP('M-64,-262 C-60,-314 60,-314 64,-262 C40,-246 -40,-246 -64,-262Z', c);
  if (kind === 'peek' || kind === 'twin') return (kind === 'twin' ? sE(-70, -304, 24, 22, c, D_LW) + sE(70, -304, 24, 22, c, D_LW) : '') + sP('M-97,-214 C-101,-290 -50,-315 0,-315 C50,-315 101,-290 97,-214 C82,-174 40,-158 0,-158 C-40,-158 -82,-174 -97,-214Z', c) + shine;
  if (kind === 'juk') { let s = dStubble(true) + sE(0, -322, 25, 23, c, D_LW) + sL('M-34,-316 L34,-330', D_GOLD, 5); for (let i = 0; i < 7; i++) s += sE(-21 + i * 7, -302 - (3 - Math.abs(i - 3)) * 1.4, 4.6, 4.6, '#fff', 1.6); return s; }
  if (kind === 'queue') return sP('M-11,-256 C-15,-200 -13,-140 -8,-92 L8,-92 C13,-140 15,-200 11,-256Z', '#2a1a18') + sL('M-10,-210 L10,-206 M-10,-170 L10,-166 M-9,-130 L9,-126', '#555', 2) + sP('M-88,-236 C-84,-306 84,-306 88,-236 C50,-222 -50,-222 -88,-236Z', '#2a2230') + sL('M-86,-238 C-50,-224 50,-224 86,-238', '#c9483a', 4) + sE(0, -305, 9, 8, '#c9483a', 3);
  if (kind === 'long') return sP(D_LONG, c) + sL('M-40,-250 C-46,-190 -48,-120 -40,-64 M0,-262 L0,-56 M40,-250 C46,-190 48,-120 40,-64', null, 2.2, .35) + shine;
  if (kind === 'muay') return sE(0, -324, 40, 30, c, D_LW) + sL('M-52,-318 L52,-336', D_GOLD, 6) + sP(D_CAP, c) + shine;
  if (kind === 'braid') { let s = sP(D_CAP, c); for (let i = 0; i < 5; i++) s += sE(0, -128 + i * 19, 13 - i * .8, 13, c, D_LW * .8); return s + sP('M-12,-40 L12,-40 L8,-22 L0,-30 L-8,-22Z', '#e2574a', D_LW * .7) + shine; }
  return dStubble(true);
}
const D_LONGB = ['nung', 'nunghem', 'sin'];
function dLegs(o, walk) {
  const ex = o.ex || [], SK = o.skin, feet = o.feet || 'bare', longb = D_LONGB.includes(o.bottom); let s = '';
  [-19, 19].forEach((x, i) => {
    const up = walk === i + 1, lift = up ? 11 : 0, dx = up ? [-5, 5][i] : 0, fx = x + dx, fy = -lift;
    if (!longb) s += sP(`M${x - 11},-40 L${x - 10 + dx},${-10 - lift} C${x - 10 + dx},${-3 - lift} ${x + 10 + dx},${-3 - lift} ${x + 10 + dx},${-10 - lift} L${x + 11},-40Z`, feet === 'stocking' ? '#fffaf2' : SK);
    const d = `M${fx - 17},${fy - 6} C${fx - 20},${fy - 17} ${fx + 20},${fy - 17} ${fx + 17},${fy - 6} C${fx + 20},${fy + 4} ${fx - 20},${fy + 4} ${fx - 17},${fy - 6}Z`;
    if (feet === 'bare' || feet === 'slipper') { s += sP(d, SK) + sL(`M${fx - 5},${fy} L${fx - 5},${fy - 5} M${fx + 4},${fy} L${fx + 4},${fy - 5}`, null, 2.2); if (feet === 'slipper') s += sL(`M${fx - 17},${fy + 2} L${fx + 17},${fy + 2}`, '#8a5a34', 5) + sL(`M${fx - 13},${fy - 9} L${fx},${fy - 3} L${fx + 13},${fy - 9}`, '#c9483a', 4); }
    else s += sP(d, '#3a2a2a');
    if (ex.includes('anklet') && !longb) s += sL(`M${x - 10 + dx},${-15 - lift} L${x + 10 + dx},${-15 - lift}`, D_GOLD, 4.5);
  });
  return s;
}
function dUpper(o, view, pose, expr) {
  const ex = o.ex || [], lw = D_LW, back = view === 'b', side = view === 's', SK = o.skin;
  let torso = o.torso || 'bare'; const trim = torso === 'sabaitrim'; if (trim) torso = 'sabai';
  const bottom = o.bottom || 'kraben', bc = o.bc, top = o.top, sc = o.sc, hk = o.hair, hc = o.hc; expr = expr || o.expr || 'smile';
  const cloth = ['jacket', 'chinese', 'paai', 'lace'].includes(torso), sl = cloth ? top : SK;
  const aDown = col => sP('M-36,-110 C-58,-106 -68,-86 -66,-66 C-64,-54 -48,-54 -46,-66 C-46,-80 -42,-90 -34,-94Z', col) + sE(-56, -60, 11, 11, SK, lw);
  const aUp = col => sP('M-36,-110 C-60,-112 -78,-128 -80,-148 C-78,-160 -62,-158 -60,-148 C-58,-134 -48,-124 -34,-122Z', col) + sE(-72, -154, 11, 11, SK, lw);
  const aMid = col => sP('M-38,-108 C-54,-100 -54,-80 -40,-72 C-30,-68 -22,-76 -26,-84 C-30,-90 -32,-98 -30,-104Z', col) + sE(-28, -76, 11, 11, SK, lw);
  const aEat = col => sP('M-36,-110 C-58,-112 -70,-126 -66,-142 C-62,-152 -48,-150 -46,-142 C-46,-134 -42,-128 -34,-122Z', col) + sE(-56, -148, 11, 11, SK, lw);
  let s = '';
  if (!back) {
    if (hk === 'queue') s += sP('M56,-252 C92,-232 100,-170 86,-108 C82,-98 70,-102 72,-114 C82,-168 74,-222 48,-240Z', '#2a1a18') + sL('M70,-200 L84,-196 M76,-170 L88,-166 M76,-140 L88,-136', '#555', 2);
    if (hk === 'long') s += sP(D_LONG, hc) + sL('M-70,-120 C-74,-100 -72,-80 -66,-64 M70,-120 C74,-100 72,-80 66,-64', null, 2.2, .35);
    if (hk === 'muay') s += sE(0, -324, 40, 30, hc, lw) + sL('M-52,-336 L52,-318', D_GOLD, 6) + sE(54, -318, 6, 6, '#e2574a', 2.5);
    if (torso === 'sabai') s += sP('M-40,-112 C-58,-100 -66,-64 -60,-30 L-45,-33 C-50,-64 -44,-92 -30,-106Z', sc);
  } else if (pose === 'hold' || pose === 'wai') s += aMid(sl) + sG(aMid(sl), 0, 0, 1, true);
  const pre = s; s = sP(D_BODY, cloth ? top : SK);
  if (torso === 'bare' && !back) s += sL('M-3,-52 Q0,-49 3,-52', null, 2.2, .6);
  if (torso === 'sabai' || torso === 'wrap') s += sP('M-46,-104 C-20,-96 20,-96 46,-104 L47,-70 C20,-62 -20,-62 -47,-70Z', top);
  if (torso === 'krachao') s += sL('M-30,-100 L-22,-121 M30,-100 L22,-121', null, 13) + sL('M-30,-100 L-22,-121 M30,-100 L22,-121', top, 7.5) + sP('M-44,-102 C-20,-110 20,-110 44,-102 L47,-58 C20,-50 -20,-50 -47,-58Z', top) + (back ? '' : sL('M-30,-96 C-12,-90 12,-90 30,-96', '#fff', 3, .5));
  if (bottom === 'kraben' || bottom === 'lai') {
    s += sP('M-45,-70 C-55,-56 -57,-40 -51,-27 C-36,-21 -16,-23 -6,-29 L0,-41 L6,-29 C16,-23 36,-21 51,-27 C57,-40 55,-56 45,-70 C28,-63 -28,-63 -45,-70Z', bc);
    s += sP('M-8,-67 L8,-67 L5,-41 L0,-41 L-5,-41Z', '#fff', 0, null, .22) + sL('M-24,-62 L-9,-34 M24,-62 L9,-34 M-36,-58 L-26,-32 M36,-58 L26,-32', null, 2, .4);
    if (bottom === 'lai') for (const [x, y] of [[-38, -46], [-26, -54], [-22, -36], [38, -46], [26, -54], [22, -36], [-42, -32], [42, -32]]) s += sP(`M${x},${y - 5} l4,5 l-4,5 l-4,-5Z`, D_GOLD, 0);
  } else if (D_LONGB.includes(bottom)) {
    s += sP('M-45,-70 C-53,-42 -54,-22 -50,-9 C-30,-2 30,-2 50,-9 C54,-22 53,-42 45,-70 C28,-63 -28,-63 -45,-70Z', bc);
    if (bottom === 'sin') s += sL('M-49,-50 C-30,-43 30,-43 49,-50 M-51,-38 C-30,-31 30,-31 51,-38', '#fff', 3.5, .45) + sP('M-52,-24 C-30,-16 30,-16 52,-24 L50,-9 C30,-2 -30,-2 -50,-9Z', '#c9483a', lw * .7) + sL('M-44,-12 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6 l6,6 l6,-6', D_GOLD, 2.2);
    else if (!back) s += sP('M-11,-66 L11,-66 L14,-7 L-14,-7Z', '#fff', 0, null, .2) + sL('M-4,-64 L-5,-8 M4,-64 L5,-8', null, 2, .45);
    if (bottom === 'nunghem') s += sP('M-52,-22 C-30,-14 30,-14 52,-22 L50,-9 C30,-2 -30,-2 -50,-9Z', D_GOLD, lw * .7) + sL('M-40,-13 L-34,-9 M-20,-10 L-14,-6 M0,-9 L6,-5 M20,-10 L26,-7', '#b9722a', 2);
  } else if (bottom === 'pants') s += sP('M-45,-68 C-51,-40 -49,-22 -45,-12 C-30,-7 -12,-7 -4,-12 L0,-42 L4,-12 C12,-7 30,-7 45,-12 C49,-22 51,-40 45,-68 C28,-61 -28,-61 -45,-68Z', bc);
  if (cloth) {
    s += sP('M-38,-116 C-47,-94 -49,-74 -47,-58 C-22,-50 22,-50 47,-58 C49,-74 47,-94 38,-116 C20,-124 -20,-124 -38,-116Z', top);
    if (torso !== 'paai' || back) s += sP('M-14,-125 L14,-125 L12,-112 L-12,-112Z', top, lw * .7);
    if (back) s += sL('M0,-112 L0,-56', null, 2.2, .4);
    else if (torso === 'jacket') s += [-104, -92, -80, -68].map(y => sE(0, y, 3.6, 3.6, D_GOLD, 2)).join('');
    else if (torso === 'chinese') s += sL('M0,-112 L0,-54', null, 2.2) + [-100, -84, -68].map(y => sL(`M-9,${y} L9,${y}`, '#f6e3b8', 4) + sE(0, y, 3, 3, '#f6e3b8', 1.5)).join('');
    else if (torso === 'paai') s += sL('M-16,-122 L20,-72 L20,-56', sc, 7) + sL('M16,-122 L-2,-98', sc, 7) + sL('M20,-74 l12,-6 M20,-74 l12,6', null, 2.6);
    else s += [-18, -9, 0, 9, 18].map(x => sE(x, -113 + Math.abs(x) * .22, 6, 6, '#fff', 2)).join('') + sL('M0,-106 L0,-56', null, 2, .35);
    if (torso === 'lace') s += sE(-43, -104, 15, 13, top, lw * .8) + sE(43, -104, 15, 13, top, lw * .8);
  }
  if (torso === 'sabai') {
    let d = sP('M-38,-114 C-30,-121 -20,-123 -12,-122 L47,-76 L47,-58 L34,-58Z', sc);
    if (trim) d += sL('M-30,-112 L40,-60 M-16,-120 L46,-70', '#fff6c8', 2.2, .9);
    if (back) d += sP('M-40,-114 C-50,-90 -50,-60 -44,-36 L-28,-38 C-34,-62 -32,-90 -24,-112Z', sc);
    s += back ? sG(d, 0, 0, 1, true) : d;
  }
  if (ex.includes('pakama')) s += sP('M-47,-76 C-20,-68 20,-68 47,-76 L47,-61 C20,-53 -20,-53 -47,-61Z', 'url(#pakama)', lw * .7) + (back ? '' : sP('M28,-64 L46,-32 L32,-28 L22,-58Z', 'url(#pakama)', lw * .7));
  if (ex.includes('belt')) s += sP('M-47,-74 C-20,-66 20,-66 47,-74 L47,-63 C20,-55 -20,-55 -47,-63Z', D_GOLD, lw * .7) + (back ? '' : sE(0, -61, 8, 7, '#fff3b0', 2.5));
  if (!back) {
    if (ex.includes('necklace')) s += sL('M-24,-119 Q0,-94 24,-119', D_GOLD, 4.5) + sE(0, -105, 5, 6, '#e2574a', 2);
    if (ex.includes('amulet')) s += sL('M-22,-119 Q0,-98 22,-119', '#8a5a34', 2.5) + sP('M-6,-106 L6,-106 L4,-94 L-4,-94Z', D_GOLD, 2);
  }
  if (pose === 'hold' || pose === 'wai') { if (!back) { s += sG(aMid(sl) + sG(aMid(sl), 0, 0, 1, true), side ? 18 : 0); if (pose === 'wai') s += sP('M-7,-78 C-9,-96 -3,-108 0,-112 C3,-108 9,-96 7,-78Z', SK); } }
  else if (pose === 'up') s += aDown(sl) + sG(aUp(sl), 0, 0, 1, true);
  else if (pose === 'eat') s += aDown(sl) + sG(aEat(sl), 0, 0, 1, true);
  else if (side) s += sG(aDown(sl), 44);
  else s += aDown(sl) + sG(aDown(sl), 0, 0, 1, true);
  if (ex.includes('bangle') && pose === 'stand' && !side) s += sL('M-66,-70 L-48,-72 M66,-70 L48,-72', D_GOLD, 4.5);
  s = pre + (side ? '<g transform="scale(.86,1)">' + s + '</g>' : s);
  s += sE(-98, -198, 10, 13, SK, lw) + (side ? '' : sE(98, -198, 10, 13, SK, lw)) + sP(D_HEAD, SK);
  if (back) s += dHairBack(hk, hc);
  else {
    s += (side ? '<g clip-path="url(#hc)">' + sG(dFace(expr), 36) + '</g>' : dFace(expr)) + dHairFront(hk, hc);
    if (side && ['peek', 'twin', 'long', 'muay', 'braid'].includes(hk)) s += sP('M-104,-206 C-110,-282 -58,-318 -4,-316 C-44,-298 -74,-258 -80,-200 C-84,-176 -92,-166 -100,-172Z', hc);
    if (ex.includes('flower')) s += sG(dFlower(), -92, -238, .8);
    if (ex.includes('earring')) s += sE(-98, -180, 5, 6, D_GOLD, 2) + (side ? '' : sE(98, -180, 5, 6, D_GOLD, 2));
  }
  return s;
}
function dKneel(o, bow) { return `<g transform="translate(0,${bow ? 36 : 24}) scale(1,${bow ? .6 : 1})">${dUpper(o, 'b', 'hold')}</g>` + sP('M-56,-6 C-64,-36 64,-36 56,-6 C36,7 -36,7 -56,-6Z', o.bc) + sE(-22, -2, 14, 8, o.skin, D_LW * .7) + sE(22, -2, 14, 8, o.skin, D_LW * .7); }
const D_SUFFIX = ['legs0', 'legs1', 'legs2', 'f_stand', 'f_hold', 'f_up', 'f_wai', 'f_eat', 's_stand', 's_hold', 'b_stand', 'b_hold', 'b_kneel', 'b_bow'];
const dressGen = {};
function buildCast(ci, o) {
  const gen = dressGen[ci] = (dressGen[ci] || 0) + 1;
  return Promise.all(D_SUFFIX.map(sf => new Promise(res => {
    const a = ASSETS['c8_' + sf], hd = a.svg.slice(0, a.svg.indexOf('</defs>') + 7); let inner;
    if (sf.startsWith('legs')) inner = dLegs(o, +sf[4]);
    else { const [v, p] = sf.split('_'); inner = p === 'kneel' || p === 'bow' ? dKneel(o, p === 'bow') : dUpper(o, v, p, { up: 'laugh', wai: 'pray', eat: 'eat' }[p]); }
    const img = new Image();
    img.onload = () => { if (gen === dressGen[ci]) { const c = document.createElement('canvas'); c.width = Math.ceil(a.w * a.s * RS); c.height = Math.ceil(a.h * a.s * RS); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); SPR[`c${ci}_${sf}`] = { cv: c, ax: a.ax * a.s, ay: a.ay * a.s, w: a.w * a.s, h: a.h * a.s }; } res(); };
    img.onerror = () => res();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hd + inner + '</svg>');
  })));
}

// ---------------------------------------------------------------- ตัวเลือก
const HAIRS = [['shaved', 'โล้น'], ['mahadthai', 'มหาดไทย'], ['juk', 'จุก'], ['queue', 'หางเปียจีน'], ['peek', 'ผมปีก'], ['twin', 'จุกคู่'], ['long', 'ผมยาว'], ['muay', 'เกล้ามวย'], ['braid', 'ผมเปีย']];
const TORSOS = [['bare', 'ไม่ใส่'], ['wrap', 'ผ้าแถบ'], ['krachao', 'คอกระเช้า'], ['sabai', 'สไบ'], ['sabaitrim', 'สไบขลิบทอง'], ['paai', 'เสื้อป้าย'], ['jacket', 'ราชปะแตน'], ['chinese', 'เสื้อจีน'], ['lace', 'เสื้อแขนพอง']];
const BOTTOMS = [['kraben', 'โจงกระเบน'], ['lai', 'โจงลายทอง'], ['nung', 'ผ้านุ่ง'], ['nunghem', 'ผ้านุ่งเชิงทอง'], ['sin', 'ซิ่นตีนจก'], ['pants', 'กางเกงแพร']];
const FEET = [['bare', 'เท้าเปล่า'], ['slipper', 'รองเท้าแตะ'], ['shoes', 'รองเท้า'], ['stocking', 'ถุงเท้า+รองเท้า']];
const EXPRS = [['smile', 'ยิ้ม'], ['happy', 'ตาหยี'], ['smug', 'มั่นใจ']];
const C_SKIN = ['#fbe6cf', '#f7d3ae', '#e6b98c', '#c9966c', '#9c6b48'], C_HAIR = ['#2e2422', '#3a2622', '#4a2c1a', '#7a4a2c', '#a8683a', '#b9b2a8'];
const C_CLOTH = ['#fffaf2', '#f6e3b8', '#f2c14e', '#e2a93a', '#ffb7c5', '#f08aa8', '#c9483a', '#9a3a5a', '#7a4a9a', '#5a7ab0', '#4a6a9a', '#6cc0b4', '#6aa86f', '#8a5a34', '#4a4a6a', '#2a2a3a'];
const FEM_HAIR = ['peek', 'twin', 'long', 'muay', 'braid'];
const BLANK = { hair: 'shaved', hc: '#2e2422', skin: '#f7d3ae', expr: 'smile', torso: 'bare', top: '#f6e3b8', sc: '#f08aa8', bottom: 'kraben', bc: '#fffaf2', feet: 'bare' };
const PRESETS = [
  ['ชาวบ้านชาย', { hair: 'mahadthai', torso: 'bare', bottom: 'kraben', bc: '#3f5a8a' }],
  ['ชาวบ้านหญิง', { hair: 'peek', torso: 'wrap', top: '#c9685a', bottom: 'nung', bc: '#4a4a6a', expr: 'happy' }],
  ['ขุนนาง', { hair: 'mahadthai', torso: 'jacket', top: '#fffaf2', bottom: 'lai', bc: '#7a4a9a', feet: 'stocking', expr: 'smug' }],
  ['คุณหญิง', { hair: 'peek', torso: 'sabaitrim', top: '#f6e3b8', sc: '#e2a93a', bottom: 'nunghem', bc: '#9a3a5a' }],
  ['เด็กชาย', { hair: 'juk', torso: 'bare', bottom: 'kraben', bc: '#c9483a' }],
  ['เด็กหญิง', { hair: 'twin', torso: 'krachao', top: '#ffb7c5', bottom: 'nung', bc: '#6aa86f' }],
  ['พ่อค้าจีน', { hair: 'queue', torso: 'chinese', top: '#4a6a9a', bottom: 'pants', bc: '#2a2a3a', feet: 'shoes' }],
  ['หญิงสาว', { hair: 'long', hc: '#3a2622', torso: 'sabai', top: '#f4ead8', sc: '#f08aa8', bottom: 'nung', bc: '#5a7ab0' }],
  ['แม่หญิง', { hair: 'muay', torso: 'lace', top: '#fffaf2', sc: '#6cc0b4', bottom: 'sin', bc: '#7a3a4a', feet: 'slipper' }],
  ['สาวผมเปีย', { hair: 'braid', hc: '#4a2c1a', torso: 'wrap', top: '#f2c14e', bottom: 'sin', bc: '#6a4a8a' }],
];
const MYCI = META.cast.length; META.cast.push({ name: 'ตัวของฉัน', monk: false, vendor: false, long: false });
let look = Object.assign({}, BLANK), lookMonk = false;
try { const s = JSON.parse(localStorage.getItem('lk_look2') || 'null'); if (s && s.look && HAIRS.some(h => h[0] === s.look.hair)) { look = Object.assign({}, BLANK, s.look); lookMonk = !!s.monk; } } catch (e) { }

// เครื่องประดับ: ซื้อในตลาด ใส่แล้วติดไปกับตัว
const ACCS = { necklace: 'สร้อยทับทิม', bangle: 'กำไลทอง', earring: 'ต่างหูทอง', belt: 'เข็มขัดทอง', amulet: 'ตะกรุด', anklet: 'กำไลข้อเท้า', flower: 'ดอกไม้ทัดหู', pakama: 'ผ้าขาวม้าคาดเอว' };
const ACC_ART = {
  necklace(c) { pth(c, 'M-24,-18 Q0,26 24,-18', null, 9); pth(c, 'M-24,-18 Q0,26 24,-18', null, 5, D_GOLD); eli(c, 0, 6, 7, 8, '#e2574a', 3); },
  bangle(c) { const d = 'M-22,0 a22,14 0 1,0 44,0 a22,14 0 1,0 -44,0'; pth(c, d, null, 12); pth(c, d, null, 7, D_GOLD); },
  earring(c) { for (const x of [-13, 13]) { pth(c, `M${x},-22 L${x},-10`, null, 3, '#8a5a34'); eli(c, x, -2, 7, 9, D_GOLD, 3); eli(c, x - 2, -5, 2, 3, '#fff8d0'); } },
  belt(c) { pth(c, 'M-30,-8 L30,-8 L30,8 L-30,8Z', D_GOLD); eli(c, 0, 0, 10, 10, '#fff3b0', 3); eli(c, 0, 0, 4, 4, '#e2574a', 2); },
  amulet(c) { pth(c, 'M-22,-20 Q0,14 22,-20', null, 3.5, '#8a5a34'); pth(c, 'M-9,-4 L9,-4 L7,18 L-7,18Z', D_GOLD, 3); pth(c, 'M-5,4 L5,4 M-4,11 L4,11', null, 2, '#b9722a'); },
  anklet(c) { const d = 'M-18,-4 a18,10 0 1,0 36,0 a18,10 0 1,0 -36,0'; pth(c, d, null, 10); pth(c, d, null, 5.5, D_GOLD); for (const x of [-12, 0, 12]) eli(c, x, 9 - Math.abs(x) * .25, 4, 4, D_GOLD, 2); },
  flower(c) { krFlower(c, 0, 0, 0, '#ffffff', 1.25); },
  pakama(c) { c.save(); pth(c, 'M-28,-14 L28,-14 L28,14 L-28,14Z', '#f4ead8'); c.beginPath(); c.rect(-28, -14, 56, 28); c.clip(); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) { c.fillStyle = j % 2 ? '#e79a8a' : '#c9483a'; c.fillRect(-28 + i * 7, -14 + j * 7, 7, 7); } c.restore(); pth(c, 'M-28,-14 L28,-14 L28,14 L-28,14Z', null, 3.5); },
};
for (const k in ACCS) { SPR['ic_' + k] = mkSpr(40, 40, 20, 20, c => { c.scale(.5, .5); ACC_ART[k](c); }); ITEMS['acc_' + k] = { name: ACCS[k], spr: 'ic_' + k, wear: 'w_' + k, desc: 'เครื่องประดับ กดช่องในกระเป๋าเพื่อใส่หรือถอด' }; }
function myRecipe() { return Object.assign({}, look, { torso: look.torso === 'bare' && FEM_HAIR.includes(look.hair) ? 'wrap' : look.torso, ex: Object.keys(ACCS).filter(k => P['w_' + k]) }); }
let mySig = '';
function rebuildMine(force) {
  const o = myRecipe(), sig = JSON.stringify(o); if (sig === mySig && !force) return Promise.resolve(); mySig = sig;
  META.cast[MYCI].long = o.hair === 'long';
  return buildCast(MYCI, o).then(() => { if (!lookMonk) P.ci = MYCI; drawLookPreview(); });
}
const _renderInv = renderInv; renderInv = function () { _renderInv(); if (typeof started !== 'undefined' && started && !lookMonk) rebuildMine(); };

function drawLookPreview() {
  const cvp = $('lookCv'); if (!cvp) return; const c = cvp.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvp.width, cvp.height);
  const ci = lookMonk ? 6 : MYCI; if (!SPR[`c${ci}_f_stand`]) return;
  const one = (x, y, k, dir) => { c.save(); c.translate(x, y); c.scale(k, k); _drawChar(c, Object.assign(mkChar(0, 0, ci), { dir, phase: 0, seed: 0 })); c.restore(); };
  one(118, 262, 1.85, 'down'); one(252, 262, .95, 'right'); one(322, 262, .95, 'up');
}
function buildLooks() {
  const card = $('start').querySelector('.card'); card.style.maxWidth = '1020px'; card.style.padding = '12px 24px';
  const box = $('looks'); box.innerHTML = ''; $('lookName').style.display = 'none';
  const wrap = document.createElement('div'); wrap.style.cssText = 'display:flex;gap:14px;align-items:flex-start;justify-content:center;width:100%';
  const left = document.createElement('div'); left.innerHTML = '<canvas id="lookCv" width="380" height="280" style="width:380px;height:280px;background:rgba(20,14,60,.45);border-radius:16px;border:0;cursor:default"></canvas>';
  const opts = document.createElement('div'); opts.style.cssText = 'text-align:left;flex:1;min-width:0';
  const chipRow = (name, list, cur2, set) => { const row = document.createElement('div'); row.className = 'orow'; row.style.cssText = 'margin:3px 0;gap:4px'; row.innerHTML = `<span style="width:62px;font-size:13px">${name}</span>`; for (const [id, t] of list) { const b = document.createElement('button'); b.className = 'chip' + (cur2 === id ? ' on' : ''); b.style.cssText = 'font-size:13px;padding:2px 9px'; b.textContent = t; b.onclick = () => { set(id); buildLooks(); }; row.appendChild(b); } opts.appendChild(row); };
  const colRow = (name, cols, k) => { const row = document.createElement('div'); row.className = 'orow'; row.style.cssText = 'margin:3px 0;gap:4px'; row.innerHTML = `<span style="width:62px;font-size:13px">${name}</span>`; for (const col of cols) { const b = document.createElement('button'); b.className = 'sw' + (look[k] === col ? ' on' : ''); b.style.cssText = `background:${col};width:22px;height:22px;border-width:2px`; b.onclick = () => { look[k] = col; buildLooks(); }; row.appendChild(b); } opts.appendChild(row); };
  const pre = document.createElement('div'); pre.className = 'orow'; pre.style.cssText = 'margin:0 0 6px;gap:4px;justify-content:center';
  const pb = (t, fn, on) => { const b = document.createElement('button'); b.className = 'chip' + (on ? ' on' : ''); b.style.cssText = 'font-size:12.5px;padding:2px 8px'; b.textContent = t; b.onclick = () => { fn(); buildLooks(); }; pre.appendChild(b); };
  pb('ตัวเปล่า', () => { look = Object.assign({}, BLANK, { skin: look.skin }); lookMonk = false; });
  for (const [n, p] of PRESETS) pb(n, () => { look = Object.assign({}, BLANK, { skin: look.skin, feet: 'bare' }, p); lookMonk = false; });
  pb('พระสงฆ์', () => { lookMonk = true; }, lookMonk);
  pb('🎲 สุ่ม', () => { lookMonk = false; const fem = R() < .5; look = Object.assign({}, BLANK, { skin: pick(C_SKIN.slice(0, 4)), hc: pick(C_HAIR.slice(0, 4)), expr: pick(EXPRS)[0], hair: pick(fem ? FEM_HAIR : ['mahadthai', 'juk', 'queue', 'mahadthai']), torso: pick(fem ? ['wrap', 'krachao', 'sabai', 'sabaitrim', 'lace'] : ['bare', 'paai', 'jacket', 'chinese']), bottom: pick(fem ? ['nung', 'nunghem', 'sin'] : ['kraben', 'lai', 'pants']), top: pick(C_CLOTH), sc: pick(C_CLOTH), bc: pick(C_CLOTH.slice(2)), feet: pick(FEET)[0] }); });
  box.appendChild(pre);
  if (lookMonk) opts.insertAdjacentHTML('beforeend', '<p style="margin-top:40px">พระสงฆ์ครองจีวรแบบเดิม ไม่เปิดให้เปลี่ยนเครื่องแต่งกาย<br>เลือก “ตัวเปล่า” หรือชุดอื่นด้านบนเพื่อแต่งตัวเอง</p>');
  else {
    chipRow('หน้าตา', EXPRS, look.expr, v => look.expr = v); colRow('สีผิว', C_SKIN, 'skin');
    chipRow('ทรงผม', HAIRS, look.hair, v => look.hair = v); if (!['shaved', 'queue'].includes(look.hair)) colRow('สีผม', C_HAIR, 'hc');
    const tor = look.torso === 'bare' && FEM_HAIR.includes(look.hair) ? 'wrap' : look.torso;
    chipRow('เสื้อ', FEM_HAIR.includes(look.hair) ? TORSOS.slice(1) : TORSOS, tor, v => look.torso = v);
    if (tor !== 'bare') colRow('สีเสื้อ', C_CLOTH, 'top'); if (['sabai', 'sabaitrim', 'paai'].includes(tor)) colRow(tor === 'paai' ? 'สีขลิบ' : 'สีสไบ', C_CLOTH, 'sc');
    chipRow('ผ้านุ่ง', BOTTOMS, look.bottom, v => look.bottom = v); colRow('สีผ้านุ่ง', C_CLOTH, 'bc');
    chipRow('รองเท้า', FEET, look.feet, v => look.feet = v);
    opts.insertAdjacentHTML('beforeend', '<div style="font-size:12.5px;color:#d9c1a3;margin-top:5px">หมวก หน้ากาก เครื่องประดับ และลูกโป่ง หาซื้อได้ในตลาด</div>');
  }
  wrap.appendChild(left); wrap.appendChild(opts); box.appendChild(wrap);
  if (lookMonk) { P.ci = 6; drawLookPreview(); } else rebuildMine(true);
}
const _startGame = startGame;
startGame = function () {
  try { localStorage.setItem('lk_look2', JSON.stringify({ look, monk: lookMonk })); } catch (e) { }
  P.ci = lookMonk || !SPR[`c${MYCI}_f_stand`] ? (lookMonk ? 6 : 8) : MYCI; _startGame();
};
$('goBtn').onclick = () => startGame();

// ---------------------------------------------------------------- แม่ค้าเครื่องประดับ
const JEWELS = ['acc_necklace', 'acc_earring', 'acc_bangle', 'acc_belt', 'acc_amulet', 'acc_anklet'];
function pickCards(ids, cb) {
  const box = $('pickList'); box.innerHTML = '';
  for (const k of ids) { const d = document.createElement('div'); d.className = 'kcard'; const sp = SPR[ITEMS[k].spr], cv3 = document.createElement('canvas'); cv3.width = 188; cv3.height = 132; const z = Math.min(150 / sp.cv.width, 110 / sp.cv.height); cv3.getContext('2d').drawImage(sp.cv, 94 - sp.cv.width * z / 2, 66 - sp.cv.height * z / 2, sp.cv.width * z, sp.cv.height * z); d.appendChild(cv3); d.insertAdjacentHTML('beforeend', `<b>${ITEMS[k].name}</b><span>${hasItem(k) ? 'มีแล้ว' : ITEMS[k].desc || ''}</span>`); d.onclick = () => { $('pick').style.display = 'none'; cb(k); }; box.appendChild(d); }
  $('pick').style.display = 'flex';
}
function addJeweler(x, y) {
  const v = Object.assign(mkChar(x, y - 34, 11), { dir: 'down', noShadow: true, hideItem: true }); let sayT = 0;
  ents.push({ x, y, w: 80, draw(c) {
    animChar(v, 1 / 60); ell(c, x, y + 3, 78, 9, 'rgba(20,10,40,.28)'); drawChar(c, v); spr(c, 'table', x, y, { k: .7 });
    JEWELS.forEach((k, i) => spr(c, ITEMS[k].spr, x - 50 + i * 20, y - 44 - (i % 2) * 3, { k: .8 }));
    board(c, x, y - 176, 'เครื่องประดับ', 22); tag(c, x - 4, y - 14, 'ชิ้นละ 2 อัฐ');
    if (sayT > 0) { sayT -= 1 / 60; bubble(c, x, y - 214, 'งามแท้เจ้าค่ะ'); }
  } });
  RECTS.push([x - 72, y - 30, x + 72, y + 6]); addLight(x, y - 60, 250, 1); addLight(x, y - 170, 170, .8);
  return { x, y, open() { if (lookMonk) return toast('พระสงฆ์ไม่ใส่เครื่องประดับ'); pickCards(JEWELS, k => { if (hasItem(k)) return toast(`มี${ITEMS[k].name}อยู่แล้ว`); give(P, k); v.joy = 1.2; sayT = 2; toast(`ได้${ITEMS[k].name}แล้ว ใส่ให้เลย · กดช่องในกระเป๋าเพื่อถอด`); }); } };
}

// ---------------------------------------------------------------- คนเดินงานหน้าตาใหม่ ๆ (สุ่มจากชิ้นส่วนเดียวกัน)
(function () {
  const rnd2 = mulberry(20261113), pk = a => a[Math.floor(rnd2() * a.length)];
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  for (let i = 0; i < 8; i++) {
    const fem = i % 2 === 0, o = Object.assign({}, BLANK, { skin: pk(C_SKIN.slice(0, 4)), hc: pk(C_HAIR.slice(0, 4)), expr: pk(['smile', 'smile', 'happy']), hair: pk(fem ? FEM_HAIR : ['mahadthai', 'mahadthai', 'juk']), torso: pk(fem ? ['wrap', 'krachao', 'sabai', 'sabaitrim', 'lace'] : ['bare', 'paai', 'paai', 'jacket']), bottom: pk(fem ? ['nung', 'nunghem', 'sin'] : ['kraben', 'lai', 'kraben']), top: pk(C_CLOTH.slice(0, 13)), sc: pk(C_CLOTH.slice(2, 13)), bc: pk(C_CLOTH.slice(6)), feet: pk(['bare', 'bare', 'slipper']), ex: [] });
    for (const k of (fem ? ['flower', 'earring', 'necklace', 'bangle'] : ['pakama', 'amulet'])) if (rnd2() < .3) o.ex.push(k);
    const ci = META.cast.length; META.cast.push({ name: 'คนเที่ยวงาน', monk: false, vendor: false, long: o.hair === 'long' });
    buildCast(ci, o).then(() => { if (SPR[`c${ci}_f_stand`]) WALKERS.push(ci); });
  }
})();
