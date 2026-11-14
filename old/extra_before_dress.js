'use strict';
// ============================================================
//  ส่วนเสริม: ออกแบบกระทงเอง / เซียมซี / ระบายสีปูนปั้น
//  (โหลดต่อจาก game.js ใช้ตัวแปรและฟังก์ชันของ game.js ได้โดยตรง)
// ============================================================
const OLJ = '#33211f';
function pth(c, d, fill, sw = 3.5, stroke = OLJ) { const p = new Path2D(d); if (fill) { c.fillStyle = fill; c.fill(p); } if (sw) { c.strokeStyle = stroke; c.lineWidth = sw; c.lineJoin = c.lineCap = 'round'; c.stroke(p); } }
function eli(c, x, y, rx, ry, fill, sw = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = fill; c.fill(); if (sw) { c.strokeStyle = OLJ; c.lineWidth = sw; c.stroke(); } }
function mkSpr(w, h, ax, ay, fn) { const cv2 = document.createElement('canvas'); cv2.width = Math.ceil(w * RS); cv2.height = Math.ceil(h * RS); const c = cv2.getContext('2d'); c.scale(RS, RS); c.translate(ax, ay); fn(c); return { cv: cv2, ax, ay, w, h }; }

// ---------------------------------------------------------------- กระทงออกแบบเอง
// รหัสกระทง 6 หลัก: ฐาน, สีกลีบ, ชนิดดอกไม้, สีดอกไม้, สีเทียน, ของตกแต่ง
const KR_BASE = ['ใบตอง', 'ดอกบัว', 'กะลา', 'สองชั้น'], KR_FT = ['กล้วยไม้', 'ดาวเรือง', 'บัวตูม', 'ไม่ใส่'], KR_DECO = ['ไม่มี', 'ปักธง', 'มาลัยมะลิ', 'ธงและมาลัย'];
const KR_PET = [['#6cc05a', '#3f8f45'], ['#ffc4d8', '#ff8fb8'], ['#fff6e8', '#e0d2bc'], ['#d9b4f0', '#b07ad6'], ['#ffe08a', '#f2c14e']];
const KR_FCOL = ['#c95be0', '#ffd23e', '#ff8fb0', '#ffffff', '#e2574a'], KR_CAN = ['#fff6dc', '#ffd23e', '#e2574a', '#ffb7d0'];
function krFlower(c, x, y, type, col, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (type === 0) { for (let i = 0; i < 5; i++) { c.save(); c.rotate(i * 1.2566); pth(c, 'M0,0 C-9,-7 -9,-20 0,-24 C9,-20 9,-7 0,0Z', col, 2.5); c.restore(); } eli(c, 0, 0, 6, 6, '#fff3b0', 2.5); }
  else if (type === 1) { for (let i = 0; i < 8; i++) eli(c, Math.cos(i * .785) * 11, Math.sin(i * .785) * 11, 8, 8, col, 2); eli(c, 0, 0, 11, 11, col, 2.5); eli(c, 0, 0, 5, 5, 'rgba(255,255,255,.35)'); }
  else if (type === 2) { pth(c, 'M0,10 C-14,0 -10,-20 0,-30 C10,-20 14,0 0,10Z', col, 2.5); pth(c, 'M0,6 L0,-18', null, 1.6, 'rgba(0,0,0,.22)'); }
  c.restore();
}
function drawKrArt(c, key) {
  const [base, pet, ft, fc, can, deco] = key.split('').map(Number), [pl, pd] = KR_PET[pet] || KR_PET[0];
  const candle = () => { pth(c, 'M-16,-34 L-22,-86 M16,-34 L22,-86', null, 3, '#a8703c'); pth(c, 'M-6,-30 L-6,-76 C-3,-80 3,-80 6,-76 L6,-30Z', KR_CAN[can] || KR_CAN[0], 3); };
  if (deco === 1 || deco === 3) for (const f of [-1, 1]) { pth(c, `M${58 * f},-24 L${66 * f},-74`, null, 3, '#8a5a34'); pth(c, `M${66 * f},-74 L${88 * f},-66 L${66 * f},-58Z`, '#e2574a', 2.5); }
  if (base === 0 || base === 3) {
    for (let i = -3; i <= 3; i++) { const x = i * 19, ln = i * 7; pth(c, `M${x - 13},-8 C${x - 13 + ln * .3},-36 ${x + ln - 4},-52 ${x + ln},-60 C${x + ln + 4},-52 ${x + 13 + ln * .3},-36 ${x + 13},-8Z`, pd, 3.5); }
    if (base === 3) for (let i = -2; i <= 2; i++) { const x = i * 17, ln = i * 6; pth(c, `M${x - 11},-34 C${x - 11},-54 ${x + ln - 3},-66 ${x + ln},-72 C${x + ln + 3},-66 ${x + 11},-54 ${x + 11},-34Z`, pl, 3); }
    candle(); if (base === 3) pth(c, 'M-48,-36 C-30,-28 30,-28 48,-36 L46,-26 C30,-18 -30,-18 -46,-26Z', '#f2c14e', 3);
    pth(c, 'M-76,-8 C-76,26 76,26 76,-8 C46,8 -46,8 -76,-8Z', '#2f6f38');
    for (let i = -4; i <= 4; i++) { const x = i * 16.5, ln = i * 3.5; pth(c, `M${x - 11},-4 C${x - 11},-24 ${x + ln - 3},-36 ${x + ln},-42 C${x + ln + 3},-36 ${x + 11},-24 ${x + 11},-4Z`, pl, 3); }
    for (let i = -5; i <= 5; i++) eli(c, i * 13, 8 - i * i * .28, 7.5, 6.5, '#ffb52e', 2.5);
  } else if (base === 1) {
    pth(c, 'M-86,2 C-86,-16 86,-16 86,2 C86,22 -86,22 -86,2Z', '#3f8f55');
    const petal = (x, h, w, col, rot) => { c.save(); c.translate(x, -4); c.rotate(rot * Math.PI / 180); pth(c, `M0,0 C${-w},${-h * .3} ${-w * .8},${-h * .8} 0,${-h} C${w * .8},${-h * .8} ${w},${-h * .3} 0,0Z`, col, 3.5); c.restore(); };
    for (const [x, r] of [[-44, -40], [-22, -19], [0, 0], [22, 19], [44, 40]]) petal(x, 72, 23, pd, r);
    candle(); for (const [x, r] of [[-56, -60], [-33, -32], [-11, -10], [11, 10], [33, 32], [56, 60]]) petal(x, 50, 19, pl, r);
  } else {
    candle(); pth(c, 'M-58,-18 C-58,30 58,30 58,-18Z', '#8a5a34'); pth(c, 'M-40,-2 C-36,12 -26,20 -14,24 M40,-2 C36,12 26,20 14,24', null, 2.5, 'rgba(60,30,10,.5)');
    eli(c, 0, -18, 58, 13, '#fff6e8', 3.5); eli(c, 0, -17, 46, 9, pl);
  }
  if (deco >= 2) for (const cx of [-52, 0, 52]) { for (let j = -3; j <= 3; j++) eli(c, cx + j * 7, 10 + (9 - j * j) * 1.5, 4.4, 4.4, '#fff', 1.8); eli(c, cx, 28, 5, 6, '#ff8fb0', 2); }
  if (ft < 3) { const fy = base === 2 ? -24 : base === 1 ? -12 : -28, col = KR_FCOL[fc] || KR_FCOL[0]; krFlower(c, -36, fy, ft, col, .7); krFlower(c, 36, fy, ft, col, .7); krFlower(c, 0, fy + 6, ft, KR_FCOL[(fc + 1) % 5], .8); }
}
function krName(key) { key = /^\d{6}$/.test(key) ? key : '000000'; const n = 'kr_' + key; if (!SPR[n]) SPR[n] = mkSpr(94, 66, 47, 48, c => { c.scale(.5, .5); drawKrArt(c, key); }); return n; }
function randKr() { return [R() * 4 | 0, R() * 5 | 0, R() * 4 | 0, R() * 5 | 0, R() * 4 | 0, R() * 4 | 0].join(''); }
let krbSpec = [0, 0, 0, 0, 0, 0], krbStall = null;
function krbDraw() {
  const cvp = $('krbCv'), c = cvp.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvp.width, cvp.height);
  c.translate(cvp.width / 2, cvp.height * .74); c.scale(2.1, 2.1); eli(c, 0, 14, 96, 16, 'rgba(120,140,255,.25)'); drawKrArt(c, krbSpec.join(''));
  eli(c, 0, -92, 16, 16, 'rgba(255,190,90,.3)'); pth(c, 'M0,-80 C-8,-90 -3,-100 0,-108 C3,-100 8,-90 0,-80Z', '#ffb03a', 2, '#e07a1e');
}
function krbBuild() {
  const rows = [['ฐาน', KR_BASE.map(t => ({ t }))], ['สีกลีบ', KR_PET.map(p => ({ col: p[0] }))], ['ดอกไม้', KR_FT.map(t => ({ t }))], ['สีดอกไม้', KR_FCOL.map(col => ({ col }))], ['สีเทียน', KR_CAN.map(col => ({ col }))], ['ตกแต่ง', KR_DECO.map(t => ({ t }))]];
  const box = $('krbOpts'); box.innerHTML = '';
  rows.forEach(([name, opts], ri) => {
    const row = document.createElement('div'); row.className = 'orow'; row.innerHTML = `<span>${name}</span>`;
    opts.forEach((o, i) => { const b = document.createElement('button'); b.className = (o.col ? 'sw' : 'chip') + (krbSpec[ri] === i ? ' on' : ''); if (o.col) b.style.background = o.col; else b.textContent = o.t; b.onclick = () => { krbSpec[ri] = i; krbBuild(); }; row.appendChild(b); });
    box.appendChild(row);
  });
  krbDraw();
}
function openPicker(s) { krbStall = s; if (P.lastKr) krbSpec = P.lastKr.split('').map(Number); krbBuild(); $('krb').style.display = 'flex'; }
$('krbRand').onclick = () => { krbSpec = randKr().split('').map(Number); krbBuild(); };
$('krbCancel').onclick = () => $('krb').style.display = 'none';
$('krbOk').onclick = () => { $('krb').style.display = 'none'; const s = krbStall; if (!s) return; if (s.line.full()) return toast('แถวร้านนี้ยาวอยู่ รอสักครู่นะ'); P.krPick = P.lastKr = krbSpec.join(''); s.line.join(P); };

// ---------------------------------------------------------------- เซียมซี
const FORTUNES = [
  ['ดีมาก', 'ดั่งเรือได้ลมส่งท้าย คิดการสิ่งใดสำเร็จดังใจ มีผู้ใหญ่คอยค้ำชู'],
  ['ดี', 'ฝนตกหลังแล้งนาน ความลำบากที่ผ่านมาจะคลี่คลาย การเงินค่อย ๆ ดีขึ้น'],
  ['ปานกลาง', 'น้ำนิ่งไหลลึก อย่าเพิ่งใจร้อน รออีกสักระยะแล้วจะเห็นทาง'],
  ['พึงระวัง', 'เดินทางกลางคืนไร้โคม ควรคิดให้รอบคอบก่อนตัดสินใจเรื่องเงินทอง'],
  ['ดีมาก', 'ดอกบัวพ้นน้ำรับแสงตะวัน งานที่ทำจะมีคนเห็นคุณค่า มีข่าวดีจากแดนไกล'],
  ['ดี', 'ได้ของหายคืนมา มิตรเก่าจะกลับมาเกื้อกูล สุขภาพแข็งแรง'],
  ['ปานกลาง', 'ปลูกไม้วันนี้ยังไม่ทันได้ร่ม ขยันต่อไปผลจะตามมาภายหลัง'],
  ['ดี', 'จันทร์เต็มดวงกลางฟ้า ความรักราบรื่น คนในบ้านปรองดองกัน'],
  ['พึงระวัง', 'ปากเป็นเอกเลขเป็นโท ระวังคำพูดจะพาให้ผิดใจกับคนใกล้ตัว'],
  ['ดีมาก', 'พบช้างเผือกกลางป่า โชคลาภมาโดยไม่คาดฝัน จงรีบคว้าโอกาส'],
  ['ปานกลาง', 'ทางสองแพร่งยังเลือกไม่ได้ ปรึกษาผู้รู้ก่อนแล้วค่อยก้าว'],
  ['ดี', 'ข้าวในนางอกงาม ทำมาค้าขายมีกำไร อย่าลืมแบ่งปันผู้อื่น'],
  ['ดี', 'นกน้อยกลับรัง ผู้ที่จากไปไกลจะได้กลับมาพบหน้า'],
  ['พึงระวัง', 'เมฆบังจันทร์ชั่วคราว มีเรื่องขุ่นใจเล็กน้อย อดทนไว้ไม่นานก็ผ่าน'],
  ['ดีมาก', 'ได้แก้วสารพัดนึก ปรารถนาสิ่งใดจะสมหวัง การเรียนการงานก้าวหน้า'],
  ['ปานกลาง', 'พายเรือทวนน้ำ เหนื่อยหน่อยแต่ถึงฝั่งแน่ ขอเพียงอย่าวางพาย'],
  ['ดี', 'มีคนนำร่มมาให้ยามฝนตก ยามลำบากจะมีผู้ยื่นมือช่วย'],
  ['พึงระวัง', 'ของหวานมักมีมด ลาภที่ได้มาง่ายให้ตรวจดูให้ดีเสียก่อน'],
  ['ดี', 'ต้นไม้ใหญ่ให้ร่มเงา ครอบครัวอบอุ่น เป็นที่พึ่งของคนรอบข้าง'],
  ['ดีมาก', 'ลอยกระทงคืนเพ็ญ สิ่งที่อธิษฐานไว้มีหวังสมปรารถนา'],
  ['ปานกลาง', 'ไก่ขันก่อนรุ่ง ข่าวที่รออยู่ยังมาไม่ถึง ใจเย็นอีกนิด'],
  ['ดี', 'เปิดประตูรับลมเย็น ย้ายที่ทางหรือเริ่มสิ่งใหม่ได้ผลดี'],
  ['พึงระวัง', 'ไฟในอย่านำออก ไฟนอกอย่านำเข้า เรื่องในบ้านควรคุยกันดี ๆ'],
  ['ดี', 'แมวนอนอิ่มข้างเตา ชีวิตสุขสบาย ไม่ขัดสนเรื่องปากท้อง'],
  ['ดีมาก', 'ฟ้าหลังฝนสดใส เคราะห์ร้ายพ้นไปแล้ว ต่อจากนี้มีแต่ดีขึ้น'],
  ['ปานกลาง', 'ผ้าทอยังไม่เต็มผืน งานยังไม่เสร็จอย่าเพิ่งวางมือ'],
  ['ดี', 'ได้ยินเสียงระฆังยามเช้า จิตใจสงบ ทำบุญแล้วสบายใจ'],
  ['ดีมาก', 'เดินตามแสงโคมถึงท่าน้ำ มีคนดีนำทาง หน้าที่การงานรุ่งเรือง'],
];
function showFortune(n) {
  const [v, t] = FORTUNES[n - 1]; $('fNo').textContent = n; $('fVerdict').textContent = v; $('fText').textContent = t;
  $('fVerdict').style.color = v === 'พึงระวัง' ? '#ff9a9a' : v === 'ปานกลาง' ? '#ffe9b8' : '#b8f29a'; $('fortune').style.display = 'flex'; sfx('bell');
}
function addSiamsi(x, y) {
  if (!SPR.siamsi) SPR.siamsi = mkSpr(36, 70, 18, 66, c => { c.scale(.62, .62); for (const dx of [-16, -8, 0, 8, 16]) pth(c, `M${dx * .5},-64 L${dx},-104`, null, 5, '#c9a36a'); pth(c, 'M-22,-70 L22,-70 L18,0 L-18,0Z', '#c9483a'); pth(c, 'M-21,-56 L21,-56 M-19,-14 L19,-14', null, 5, '#f2c14e'); eli(c, 0, -70, 22, 6, '#7a1c22', 3.5); });
  const o = { x, y, shake: 0, start() { o.shake = 2.6; for (let i = 0; i < 12; i++) noise(i * .2, .05, .09, 2500, 3); } };
  ents.push({ x, y, w: 50, draw(c) { ell(c, x, y + 2, 44, 7, 'rgba(20,10,40,.3)'); spr(c, 'table', x, y, { k: .44 }); const sh = o.shake > 0; spr(c, 'siamsi', x + (sh ? Math.sin(time * 38) * 3 : 0), y - 22, { rot: sh ? Math.sin(time * 38) * .22 : 0 }); board(c, x, y - 96, 'เสี่ยงเซียมซี', 20); if (sh) o.shake -= 1 / 60; } });
  ents.push({ x, y: y + 20, w: 40, draw(c) { spr(c, 'mat', x, y + 58); } });
  RECTS.push([x - 44, y - 20, x + 44, y + 4]); addLight(x, y - 40, 220, .9); return o;
}
function useSiamsi(o) {
  P.x = o.x; P.y = o.y + 52; P.dir = 'up'; P.duckT = 1; o.start();
  doBusy(null, 2.7, () => { P.duckT = 0; showFortune(1 + (R() * FORTUNES.length | 0)); });
}

// ---------------------------------------------------------------- ระบายสีปูนปั้น
const PLASTER = '#fbf7ee', PALETTE = ['#fbf7ee', '#e2574a', '#ff8fb0', '#ffb52e', '#ffd23e', '#6cc05a', '#3f8f55', '#4ecdc4', '#6a9ad9', '#8c7ae6', '#8a5a34', '#3a3232'];
const FIGS = [
  { name: 'แมวนั่ง', parts: ['M26,-6 C54,-8 60,-40 46,-52 C48,-34 42,-24 28,-24Z', 'M-34,0 C-42,-42 -28,-62 0,-64 C28,-62 42,-42 34,0Z', 'M-16,-2 C-20,-34 20,-34 16,-2Z', 'M-30,-86 L-27,-112 L-9,-100Z', 'M30,-86 L27,-112 L9,-100Z', 'M-32,-80 C-32,-108 32,-108 32,-80 C32,-56 -32,-56 -32,-80Z', 'M-24,-62 C-10,-54 10,-54 24,-62 L22,-54 C10,-47 -10,-47 -22,-54Z'],
    detail(c) { eli(c, -12, -82, 3.6, 5.2, '#2a1a18'); eli(c, 12, -82, 3.6, 5.2, '#2a1a18'); pth(c, 'M-3,-74 L3,-74 L0,-70Z', '#ff8fa0', 1.5); pth(c, 'M-6,-68 Q-3,-64 0,-68 Q3,-64 6,-68 M16,-74 L34,-78 M16,-70 L34,-68 M-16,-74 L-34,-78 M-16,-70 L-34,-68', null, 1.8); } },
  { name: 'ช้างน้อย', parts: ['M-26,-84 C-60,-100 -66,-54 -38,-46 C-34,-58 -30,-70 -26,-84Z', 'M26,-84 C60,-100 66,-54 38,-46 C34,-58 30,-70 26,-84Z', 'M-40,0 C-48,-48 -30,-66 0,-66 C30,-66 48,-48 40,0Z', 'M-34,-44 C-12,-34 12,-34 34,-44 L30,-16 C12,-8 -12,-8 -30,-16Z', 'M-28,-78 C-28,-108 28,-108 28,-78 C28,-58 -28,-58 -28,-78Z', 'M-8,-70 C-12,-48 -6,-32 8,-32 C18,-32 18,-44 9,-44 C4,-48 6,-60 8,-70Z', 'M-14,-102 C-10,-116 10,-116 14,-102Z'],
    detail(c) { eli(c, -14, -84, 3.4, 4.6, '#2a1a18'); eli(c, 14, -84, 3.4, 4.6, '#2a1a18'); eli(c, -20, -74, 5, 3, 'rgba(255,120,130,.5)'); eli(c, 20, -74, 5, 3, 'rgba(255,120,130,.5)'); pth(c, 'M-30,-2 L-30,-8 M-20,-1 L-20,-7 M20,-1 L20,-7 M30,-2 L30,-8', null, 2); } },
  { name: 'กระต่าย', parts: ['M-22,-96 C-30,-130 -8,-134 -8,-98Z', 'M22,-96 C30,-130 8,-134 8,-98Z', 'M-30,0 C-38,-36 -26,-56 0,-58 C26,-56 38,-36 30,0Z', 'M-14,-2 C-18,-30 18,-30 14,-2Z', 'M-30,-76 C-30,-102 30,-102 30,-76 C30,-54 -30,-54 -30,-76Z', 'M0,-54 L-16,-62 L-16,-46Z M0,-54 L16,-62 L16,-46Z', 'M-30,0 C-30,-12 -6,-12 -6,0Z M6,0 C6,-12 30,-12 30,0Z'],
    detail(c) { eli(c, -11, -78, 3.4, 5, '#2a1a18'); eli(c, 11, -78, 3.4, 5, '#2a1a18'); eli(c, 0, -70, 3, 2.2, '#ff8fa0'); pth(c, 'M-5,-66 Q0,-62 5,-66', null, 1.8); pth(c, 'M-3,-64 L-3,-59 L3,-59 L3,-64', '#fff', 1.5); eli(c, -19, -68, 5, 3, 'rgba(255,120,130,.5)'); eli(c, 19, -68, 5, 3, 'rgba(255,120,130,.5)'); } },
  { name: 'กระปุกหมู', parts: ['M-34,-64 L-40,-88 L-18,-76Z', 'M34,-64 L40,-88 L18,-76Z', 'M-36,0 L-36,-14 L-20,-14 L-20,0Z M20,0 L20,-14 L36,-14 L36,0Z', 'M48,-40 C62,-44 62,-28 53,-30 C60,-24 52,-18 48,-24Z', 'M-48,-34 C-48,-78 48,-78 48,-34 C48,-4 -48,-4 -48,-34Z', 'M-16,-40 C-16,-54 16,-54 16,-40 C16,-28 -16,-28 -16,-40Z', 'M-40,-38 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0Z M26,-38 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0Z'],
    detail(c) { eli(c, -22, -54, 3.4, 4.8, '#2a1a18'); eli(c, 22, -54, 3.4, 4.8, '#2a1a18'); eli(c, -6, -40, 2.6, 4, '#2a1a18'); eli(c, 6, -40, 2.6, 4, '#2a1a18'); pth(c, 'M-10,-74 L10,-74', null, 4); } },
];
function drawFig(c, t, cols) { const f = FIGS[t]; f.parts.forEach((d, i) => pth(c, d, cols[i] || PLASTER, 3.5)); f.detail(c); }
function figSprite(t, cols) { const n = 'fig_' + t + '_' + cols.join('').replace(/#/g, ''); if (!SPR[n]) SPR[n] = mkSpr(72, 74, 36, 69, c => { c.scale(.5, .5); drawFig(c, t, cols); }); return n; }
ITEMS.plaster = { name: 'ปูนปั้นระบายสี', spr: 'fig_blank', act: { verb: 'ชูอวด', pose: 'up', dur: 1.8 } };
function addPaintBooth(x, y) {
  const blank = FIGS.map((f, t) => figSprite(t, f.parts.map(() => PLASTER))); SPR.fig_blank = SPR[blank[0]];
  ents.push({ x, y, w: 120, draw(c) { ell(c, x, y + 4, 104, 10, 'rgba(20,10,40,.28)'); spr(c, 'table', x, y); blank.forEach((n, i) => spr(c, n, x - 66 + i * 44, y - 48, { k: .8 })); board(c, x, y - 150, 'ระบายสีปูนปั้น', 22); } });
  for (const dx of [-54, 54]) ents.push({ x: x + dx, y: y - 53, w: 30, draw(c) { ell(c, x + dx, y - 50, 22, 5, 'rgba(20,10,40,.28)'); spr(c, 'stool', x + dx, y - 51); } });
  RECTS.push([x - 100, y - 26, x + 100, y + 6]); addLight(x, y - 60, 280, 1); addLight(x, y - 170, 180, .8);
  return { x, y };
}
let ptFig = 0, ptCols = [], ptCol = PALETTE[1], ptBooth = null;
function ptDraw() {
  const cvp = $('paintCv'), c = cvp.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cvp.width, cvp.height);
  eli(c, 180, 322, 120, 18, 'rgba(0,0,0,.25)'); c.translate(180, 318); c.scale(2.6, 2.6); drawFig(c, ptFig, ptCols);
}
function ptStage(paint) {
  $('paintPick').style.display = paint ? 'none' : 'flex'; $('paintWork').style.display = paint ? 'block' : 'none';
  $('paintTitle').textContent = paint ? `ระบายสี${FIGS[ptFig].name} · เลือกสีแล้วแตะส่วนที่จะระบาย` : 'เลือกตัวปูนปั้นที่จะระบาย';
  if (!paint) {
    const box = $('paintPick'); box.innerHTML = '';
    FIGS.forEach((f, t) => { const d = document.createElement('div'); d.className = 'kcard'; const cvt = document.createElement('canvas'); cvt.width = 170; cvt.height = 170; const c = cvt.getContext('2d'); c.translate(85, 158); c.scale(1.25, 1.25); drawFig(c, t, []); d.appendChild(cvt); d.insertAdjacentHTML('beforeend', `<b>${f.name}</b>`); d.onclick = () => { ptFig = t; ptCols = f.parts.map(() => PLASTER); ptStage(true); }; box.appendChild(d); });
  } else {
    const pal = $('paintPal'); pal.innerHTML = '';
    PALETTE.forEach(col => { const b = document.createElement('button'); b.className = 'sw' + (col === ptCol ? ' on' : ''); b.style.background = col; b.onclick = () => { ptCol = col; ptStage(true); }; pal.appendChild(b); });
    ptDraw();
  }
}
$('paintCv').addEventListener('mousedown', e => {
  const r = e.target.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width * 360 - 180) / 2.6, y = ((e.clientY - r.top) / r.height * 360 - 318) / 2.6, c = e.target.getContext('2d');
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); const parts = FIGS[ptFig].parts;
  for (let i = parts.length - 1; i >= 0; i--) if (c.isPointInPath(new Path2D(parts[i]), x, y)) { ptCols[i] = ptCol; sfx('step'); break; }
  c.restore(); ptDraw();
});
function openPaint(booth) {
  ptBooth = booth; P.task = { state: 'paint' }; P.path = []; P.vx = P.vy = 0; P.back = [P.x, P.y]; P.x = booth.x - 54; P.y = booth.y - 52; P.dir = 'down'; P.hop = -15; P.noShadow = true;
  ptStage(false); $('paint').style.display = 'flex';
}
function closePaint(done) {
  $('paint').style.display = 'none'; P.task = null; P.hop = 0; P.noShadow = false; if (P.back) { P.x = P.back[0]; P.y = P.back[1]; } for (const k in keys) keys[k] = false;
  if (!done) return;
  ITEMS.plaster.spr = figSprite(ptFig, ptCols); if (!hasItem('plaster')) addItem('plaster'); P.held = 'plaster'; renderInv(); cheer(P, 140); sfx('buy');
  toast(`ระบายสี${FIGS[ptFig].name}เสร็จแล้ว ถือไปอวดได้เลย กด F เพื่อชูอวด`);
}
$('paintDone').onclick = () => closePaint(true); $('paintCancel').onclick = () => closePaint(false);
$('paintClear').onclick = () => { ptCols = FIGS[ptFig].parts.map(() => PLASTER); ptDraw(); }; $('paintBack').onclick = () => ptStage(false);

// ---------------------------------------------------------------- ลูกโป่งลอย + ลูกโป่งสัตว์จูงเดิน
function balArt(c, t) {
  const col = ['#e2574a', '#ffd23e', '#6a9ad9'][t];
  if (t === 0) pth(c, 'M0,-6 C-26,-22 -24,-50 -10,-50 C-4,-50 0,-45 0,-41 C0,-45 4,-50 10,-50 C24,-50 26,-22 0,-6Z', col, 3);
  else if (t === 1) pth(c, 'M0,-54 L7,-38 L24,-36 L11,-24 L15,-7 L0,-16 L-15,-7 L-11,-24 L-24,-36 L-7,-38Z', col, 3);
  else eli(c, 0, -30, 19, 23, col, 3);
  eli(c, -7, -38, 4, 6, 'rgba(255,255,255,.55)'); pth(c, 'M-4,0 L0,-6 L4,0Z', col, 2.5);
}
function palArt(c, t) {
  const [col, dk] = [['#c98a4e', '#8a5a34'], ['#ffb0c4', '#ff8fa8'], ['#ffd94a', '#f29a2e']][t];
  for (const lx of (t === 2 ? [-4, 6] : [-12, -4, 8, 15])) { pth(c, `M${lx},-12 L${lx},-2`, null, 3, t === 2 ? dk : '#8a6a58'); eli(c, lx + 1.5, -1.5, 4, 2.4, t === 2 ? dk : col, 2); }
  if (t === 0) pth(c, 'M-17,-26 C-26,-32 -26,-42 -20,-44', null, 5, dk);
  if (t === 1) pth(c, 'M-18,-24 q-7,-3 -5,-8 q3,-4 6,0', null, 2.5, dk);
  if (t === 2) pth(c, 'M-16,-28 L-28,-34 L-20,-20Z', col, 3);
  eli(c, 0, -22, 19, 13, col, 3); eli(c, -6, -27, 6, 3, 'rgba(255,255,255,.5)'); if (t === 2) pth(c, 'M-10,-22 C-4,-14 6,-16 8,-22', null, 2.2, dk);
  if (t === 1) { pth(c, 'M10,-44 L13,-54 L20,-46Z', dk, 2.5); pth(c, 'M22,-45 L28,-53 L30,-43Z', dk, 2.5); }
  eli(c, 18, -36, 12, 11, col, 3);
  if (t === 0) { pth(c, 'M10,-44 C4,-44 4,-30 10,-30 C14,-34 14,-40 10,-44Z', dk, 2.5); eli(c, 29, -34, 3, 2.6, '#2a1a18'); }
  if (t === 1) { eli(c, 27, -33, 6, 4.6, dk, 2.2); eli(c, 25.5, -33, 1, 1.6, '#2a1a18'); eli(c, 28.8, -33, 1, 1.6, '#2a1a18'); }
  if (t === 2) pth(c, 'M27,-38 L38,-34 L27,-30Z', dk, 2.5);
  eli(c, 20, -39, 2.2, 2.8, '#2a1a18'); eli(c, 13, -32, 3.4, 2, 'rgba(255,110,120,.5)');
}
const BALLOONS = ['bl0', 'bl1', 'bl2', 'pal0', 'pal1', 'pal2'];
['ลูกโป่งหัวใจ', 'ลูกโป่งดาว', 'ลูกโป่งกลม'].forEach((n, t) => { SPR['bl' + t] = mkSpr(60, 62, 30, 59, c => balArt(c, t)); ITEMS['bl' + t] = { name: n, spr: 'bl' + t, wear: 'bal', desc: 'ลูกโป่งลอย ผูกเชือกถือเดินได้' }; });
['ลูกโป่งหมาน้อย', 'ลูกโป่งหมูอ้วน', 'ลูกโป่งเป็ดเหลือง'].forEach((n, t) => { SPR['pal' + t] = mkSpr(76, 62, 34, 59, c => palArt(c, t)); ITEMS['pal' + t] = { name: n, spr: 'pal' + t, wear: 'pal', desc: 'ลูกโป่งสัตว์ จูงเดินตามหลังได้' }; });
function strLine(c, x0, y0, x1, y1, sag) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.6; c.stroke(); }
const _drawChar = drawChar;
drawChar = function (c, ch) {
  const hy = ch.y + ch.hop - 46 + (ch.duck || 0) * 13; let late = null;
  if (ch.pal && !ch.noShadow && !ch.noLegs) {
    let p = ch._pl; if (!p || Math.hypot(p.x - ch.x, p.y - ch.y) > 260) p = ch._pl = { x: ch.x - 44, y: ch.y + 6, ph: 0, flip: false };
    let dx = ch.x - p.x, dy = ch.y - p.y, d = Math.hypot(dx, dy) || 1; const L = 50;
    if (d > L) { const m = d - L; p.x += dx / d * m; p.y += dy / d * m; p.ph += m * .16; if (Math.abs(dx) > 6) p.flip = dx < 0; }
    else if (d < 28) { p.x -= dx / d * (28 - d); p.y -= dy / d * (28 - d) * .5; }
    const draw = () => { const by = p.y - 5 - Math.abs(Math.sin(p.ph)) * 5 - Math.sin(time * 2 + ch.seed) * 1.5; ell(c, p.x, p.y + 1, 18, 4.5, 'rgba(20,10,40,.28)'); strLine(c, ch.x + (dx > 0 ? -16 : 16), hy, p.x + (p.flip ? -12 : 12), by - 26, 8); spr(c, ch.pal, p.x, by, { flip: p.flip, rot: Math.sin(p.ph) * .08 }); };
    if (p.y <= ch.y) draw(); else late = draw;
  }
  _drawChar(c, ch); if (late) late();
  if (ch.bal && !ch.hideItem) {
    const tx = ch.x - 26 + Math.sin(time * 1.7 + ch.seed) * 5; let b = ch._bl; if (!b || Math.abs(b.x - tx) > 120) b = ch._bl = { x: tx }; b.x += (tx - b.x) * .1;
    const by = ch.y + ch.hop - 150 + Math.sin(time * 2.3 + ch.seed) * 3; strLine(c, ch.x - 17, hy, b.x, by, -30); spr(c, ch.bal, b.x, by, { rot: Math.max(-.4, Math.min(.4, (b.x - tx) * .02)) + Math.sin(time * 1.7 + ch.seed) * .06 });
  }
};
function addBalloonMan(x, y) {
  const v = Object.assign(mkChar(x, y, 2), { dir: 'down' }), bunch = [[-46, -196, 2], [-14, -214, 0], [18, -206, 1], [48, -188, 2], [-30, -168, 1], [30, -164, 0], [2, -178, 2]];
  ents.push({ x, y, w: 90, draw(c) {
    for (const [i, t] of [[0, 0], [1, 1], [2, 2]]) { const px = x + 62 + i * 34, py = y + 6 - (i % 2) * 14, bob = Math.abs(Math.sin(time * 3 + i * 2)) * 4; ell(c, px, py + 1, 17, 4, 'rgba(20,10,40,.28)'); spr(c, 'pal' + t, px, py - 4 - bob, { flip: true, k: .92 }); }
    drawChar(c, v);
    bunch.forEach(([dx, dy, t], i) => { const sx = Math.sin(time * 1.4 + i * 1.3) * 4, bx = x + dx + sx, by = y + dy + Math.sin(time * 2 + i) * 2; strLine(c, x + 18, y - 46, bx, by, -40); });
    bunch.forEach(([dx, dy, t], i) => { const sx = Math.sin(time * 1.4 + i * 1.3) * 4; spr(c, 'bl' + t, x + dx + sx, y + dy + Math.sin(time * 2 + i) * 2, { rot: sx * .03 }); });
    board(c, x + 96, y - 96, 'ลูกโป่ง', 22); tag(c, x + 96, y - 52, 'ลูกละ 1 อัฐ');
  } });
  RECTS.push([x - 22, y - 16, x + 150, y + 6]); addLight(x, y - 60, 260, 1); addLight(x, y - 190, 200, .9);
  return { x, y };
}
function openBalloons() {
  const list = $('pickList'); list.innerHTML = '';
  for (const k of BALLOONS) {
    const d = document.createElement('div'); d.className = 'kcard'; const sp = SPR[ITEMS[k].spr], c = document.createElement('canvas'); c.width = 188; c.height = 132; const z = Math.min(170 / sp.cv.width, 122 / sp.cv.height);
    c.getContext('2d').drawImage(sp.cv, 94 - sp.cv.width * z / 2, 66 - sp.cv.height * z / 2, sp.cv.width * z, sp.cv.height * z); d.appendChild(c); d.insertAdjacentHTML('beforeend', `<b>${ITEMS[k].name}</b><span>${ITEMS[k].desc}</span>`);
    d.onclick = () => { $('pick').style.display = 'none'; give(P, k); toast(`ได้${ITEMS[k].name}แล้ว ${ITEMS[k].wear === 'pal' ? 'มันจะเดินตามหลังไปทุกที่' : 'ถือเดินเล่นได้เลย'} · กดช่องในกระเป๋าเพื่อเก็บ`); };
    list.appendChild(d);
  }
  $('pick').style.display = 'flex';
}

// ---------------------------------------------------------------- หาบเร่เดินขาย
function plate(c) { pth(c, 'M-30,0 C-22,16 22,16 30,0 C20,-8 -20,-8 -30,0Z', '#4a9a4e', 3.5); }
const HK_ART = {
  lukchup(c) { plate(c); [['#e2574a', -14], ['#ffb52e', 0], ['#6cc05a', 14]].forEach(([col, x]) => { eli(c, x, -8, 8, 9, col, 3); eli(c, x - 3, -11, 2, 3, 'rgba(255,255,255,.7)'); pth(c, `M${x},-17 l4,-6`, null, 3, '#3f8f45'); }); },
  thongyip(c) { plate(c); for (const x of [-15, 0, 15]) { for (let i = 0; i < 5; i++) eli(c, x + Math.cos(i * 1.257) * 6, -8 + Math.sin(i * 1.257) * 5, 4.5, 4.5, '#ffb52e', 2); eli(c, x, -8, 3.5, 3.5, '#ffe27a'); } },
  tommud(c) { pth(c, 'M-26,-6 C-26,-26 26,-26 26,-6 C26,10 -26,10 -26,-6Z', '#58aa55', 3.5); pth(c, 'M-18,-12 C-6,-18 6,-18 18,-12', null, 2, '#2f6f38'); pth(c, 'M-9,-21 L-9,5 M9,-21 L9,5', null, 3.5, '#f0e2b0'); },
  icecream(c) { pth(c, 'M0,14 L0,-8', null, 5, '#d9b25e'); pth(c, 'M-11,-8 L-11,-44 C-11,-58 11,-58 11,-44 L11,-8Z', '#fff6e0', 3.5); eli(c, -4, -36, 2.5, 8, '#ffffff'); pth(c, 'M-11,-20 q5,5 11,0 q5,-5 11,0', null, 2, '#f2c9a0'); },
  saimai(c) { pth(c, 'M0,14 L0,-20', null, 4, '#d9b25e'); for (const [x, y, r] of [[-11, -26, 11], [11, -26, 11], [0, -44, 12], [0, -32, 15]]) eli(c, x, y, r, r - 1, '#ffb7d0', 3); eli(c, 0, -33, 14, 12, '#ffb7d0'); eli(c, -5, -40, 4, 3, 'rgba(255,255,255,.7)'); },
  oi(c) { pth(c, 'M0,14 L0,-54', null, 4, '#d9b25e'); for (let i = 0; i < 4; i++) { eli(c, 0, -6 - i * 12, 10, 6, '#f3ecc0', 2.5); eli(c, 0, -6 - i * 12, 4, 2, '#d9cf8a'); } },
};
[['lukchup', 'ลูกชุบ'], ['thongyip', 'ทองหยิบ'], ['tommud', 'ข้าวต้มมัด'], ['icecream', 'ไอติมกะทิ'], ['saimai', 'สายไหม'], ['oi', 'อ้อยควั่น']].forEach(([id, name]) => {
  SPR['it_' + id] = mkSpr(40, 44, 20, 34, c => { c.scale(.5, .5); HK_ART[id](c); }); ITEMS[id] = { name, edible: true, verb: 'กิน', spr: 'it_' + id, desc: 'ของหาบเร่ หาซื้อจากร้านอื่นไม่ได้' };
});
SPR.hk_basket = mkSpr(64, 44, 32, 40, c => { c.scale(.5, .5); eli(c, 0, -4, 26, 7, '#c9685a', 3); pth(c, 'M-56,-34 C-50,-6 50,-6 56,-34Z', '#d9a85a'); pth(c, 'M-44,-22 L-36,-10 M-20,-26 L-16,-10 M0,-27 L0,-9 M20,-26 L16,-10 M44,-22 L36,-10', null, 2.2, '#a8703c'); eli(c, 0, -36, 56, 13, '#e6be7a', 3.5); for (const [x, y] of [[-30, -40], [-8, -44], [14, -42], [34, -39], [2, -36], [-20, -35]]) { eli(c, x, y, 12, 7, '#58aa55', 2.5); pth(c, `M${x},${y - 7} L${x},${y + 7}`, null, 2.5, '#f0e2b0'); } });
SPR.hk_cart = mkSpr(130, 110, 62, 106, c => {
  c.scale(.5, .5); pth(c, 'M-78,-96 L-112,-120', null, 8, '#8a5a34'); pth(c, 'M-112,-132 L-112,-108', null, 8, '#8a5a34');
  pth(c, 'M-10,-112 L-10,-176 C-10,-186 46,-186 46,-176 L46,-112Z', '#cfd8dc'); eli(c, 18, -177, 28, 8, '#e8eef0', 3.5); pth(c, 'M18,-185 L18,-196', null, 5, '#8a9aa0'); pth(c, 'M-2,-150 L-2,-124', null, 3, 'rgba(255,255,255,.8)');
  pth(c, 'M-80,-112 L80,-112 L74,-40 L-74,-40Z', '#c9965a'); pth(c, 'M-78,-92 L78,-92 M-76,-66 L76,-66', null, 2.5, 'rgba(60,30,10,.45)'); pth(c, 'M-86,-118 L86,-118 L86,-106 L-86,-106Z', '#e6be7a');
  pth(c, 'M-62,-112 L-62,-150 L-30,-150', null, 4, '#8a5a34'); eli(c, -30, -142, 8, 9, '#f2c14e', 3); eli(c, -30, -132, 2.5, 2.5, '#8a5a34');
  for (const x of [-42, 44]) { eli(c, x, -24, 24, 24, '#8a5a34', 4); eli(c, x, -24, 15, 15, '#e6be7a', 3); pth(c, `M${x - 15},-24 L${x + 15},-24 M${x},-39 L${x},-9`, null, 3); eli(c, x, -24, 4, 4, '#33211f'); }
});
SPR.hk_stick = mkSpr(80, 190, 40, 186, c => {
  c.scale(.5, .5); pth(c, 'M0,0 L0,-300', null, 9); pth(c, 'M0,0 L0,-300', null, 5, '#b98a4a');
  for (const [x, y] of [[-34, -214], [34, -206]]) { pth(c, `M0,${y - 30} L${x},${y - 40} L${x},${y + 30}`, null, 3, '#8a5a34'); for (let i = 0; i < 4; i++) eli(c, x, y - 28 + i * 16, 10, 6, '#f3ecc0', 2.5); }
  pth(c, 'M-20,-346 C-20,-262 20,-262 20,-346 C20,-362 -20,-362 -20,-346Z', '#e6be7a', 3.5); pth(c, 'M-18,-330 L18,-322 M-19,-306 L19,-298', null, 2, '#a8703c');
  [[-46, -340, '#ffb7d0'], [46, -330, '#a8d8ff'], [-50, -292, '#fff3a0'], [50, -282, '#ffb7d0'], [0, -352, '#c9f0c0']].forEach(([x, y, col]) => { pth(c, `M${x * .3},${y + 14} L${x},${y}`, null, 3, '#d9b25e'); for (const [dx, dy, r] of [[-9, 4, 10], [9, 4, 10], [0, -8, 11], [0, 2, 13]]) eli(c, x + dx, y + dy, r, r - 1, col, 2.5); eli(c, x, y + 1, 12, 10, col); });
});
const HAWK = [
  { ci: 3, type: 'hab', items: ['lukchup', 'thongyip'], call: ['ลูกชุบ ทองหยิบจ้า', 'ขนมหวานมาแล้วจ้า'], pts: [[220, 836], [2300, 836]] },
  { ci: 9, type: 'head', items: ['tommud'], call: ['ข้าวต้มมัดร้อน ๆ จ้า', 'ข้าวต้มมัดไหมจ๊ะ'], pts: [[2480, 1334], [260, 1334]] },
  { ci: 7, type: 'cart', items: ['icecream'], call: ['ไอติมกะทิ เย็นชื่นใจ', 'ไอติมมาแล้ว กริ๊ง ๆ'], pts: [[220, 1902], [1620, 1902]] },
  { ci: 2, type: 'stick', items: ['saimai', 'oi'], call: ['สายไหมหวาน ๆ จ้า', 'อ้อยควั่นเย็น ๆ จ้า'], pts: [[2440, 884], [3420, 884], [3420, 1344], [2450, 1344]] },
];
function drawHawker(c, h) {
  const x = h.x, y = h.y, f = h.f, bob = Math.abs(Math.sin(h.phase)) * 3 * h.mv;
  if (h.type === 'cart' && h.dir === 'up') spr(c, 'hk_cart', x + f * 58, y - 8, { flip: f < 0, k: 1.15 });
  drawChar(c, h);
  if (h.type === 'head') spr(c, 'hk_basket', x, y - 121 - bob, { rot: Math.sin(h.phase) * .04 * h.mv });
  else if (h.type === 'cart' && h.dir !== 'up') { ell(c, x + f * 58, y + 4, 44, 7, 'rgba(20,10,40,.28)'); spr(c, 'hk_cart', x + f * 58, y + 4 - (h.mv > .3 ? Math.abs(Math.sin(h.phase * 2)) * 1.2 : 0), { flip: f < 0, k: 1.15 }); }
  else if (h.type === 'stick') spr(c, 'hk_stick', x + f * 26, y - 2 - bob, { k: 1.25, rot: f * .05 + Math.sin(h.phase) * .03 * h.mv });
  if (h.sayT > 0) bubble(c, x, y - (h.type === 'stick' ? 196 : h.type === 'head' ? 176 : 164), h.say);
}
function addHawkers() {
  const hsay = (h, t, d = 2.6) => { h.say = t; h.sayT = d; };
  const list = HAWK.map(d => { const h = Object.assign(mkChar(d.pts[0][0], d.pts[0][1], d.ci), d, { speed: d.type === 'cart' ? 40 : 48, wi: 1, rest: 0, walkT: rr(5, 12), sayT: 0, say: '', f: 1, w: 40 }); h.draw = c => drawHawker(c, h); ents.push(h); return h; });
  return {
    list,
    update(dt) {
      for (const h of list) {
        h.sayT -= dt; h.moving = false; const near = started && Math.hypot(P.x - h.x, P.y - h.y) < 95;
        if (h.cust) { const b = h.cust; h.custT -= dt; if (h.custT < 0 || b.held || b.task) h.cust = null; else if (!b.path.includes(h.custPt) && Math.hypot(b.x - h.x, b.y - h.y) < 80) { h.cust = null; b.dir = b.x < h.x ? 'right' : 'left'; give(b, pick(h.items)); h.joy = 1.2; hsay(h, 'ได้แล้วจ้ะ', 1.6); b.wait = .9; b.after = () => { b.pose = 'eat'; b.wait = 1.6; b.after = () => { b.pose = null; b.held = null; cheer(b, 0); }; }; } }
        if (near) { if (!h.wasNear && h.sayT < -1) hsay(h, pick(['รับอะไรดีจ๊ะ', 'แวะดูก่อนได้จ้ะ'])); h.dir = 'down'; }
        else if (h.rest > 0) {
          h.rest -= dt; h.dir = 'down';
          if (!h.cust && !h.tried && h.rest > 1.5) { h.tried = true; const b = bots.find(b => !b.task && !b.held && b.path.length && !b.after && b.wait <= 0 && !META.cast[b.ci].monk && Math.hypot(b.x - h.x, b.y - h.y) < 280); if (b && R() < .75) { h.cust = b; h.custT = 9; h.custPt = { x: h.x + (b.x < h.x ? -46 : 46), y: h.y + 8 }; b.path.unshift(h.custPt); h.rest += 3; } }
        }
        else if (!h.cust) {
          const p = h.pts[h.wi]; if (stepTo(h, p[0], p[1], dt, false)) h.wi = (h.wi + 1) % h.pts.length;
          if (h.dir === 'left') h.f = -1; else if (h.dir === 'right') h.f = 1;
          h.walkT -= dt; if (h.walkT <= 0) { h.rest = rr(4, 7); h.walkT = rr(10, 18); h.tried = false; hsay(h, pick(h.call), 3); if (h.type === 'cart' && Math.hypot(P.x - h.x, P.y - h.y) < 500) { tone(1568, 0, .25, 'sine', .06); tone(1568, .18, .3, 'sine', .06); } }
        }
        h.wasNear = near; animChar(h, dt);
      }
    },
    interact() {
      for (const h of list) if (Math.hypot(P.x - h.x, P.y - h.y) < 95) return { label: h.items.length > 1 ? `ซื้อ${h.items.map(i => ITEMS[i].name).join('หรือ')} (1 อัฐ)` : `ซื้อ${ITEMS[h.items[0]].name} (1 อัฐ)`, act() {
        const buy = k => { give(P, k); h.joy = 1.2; hsay(h, 'ได้แล้วจ้ะ', 1.6); toast(`ได้${ITEMS[k].name}แล้ว กด F เพื่อกิน`); };
        if (h.items.length < 2) return buy(h.items[0]);
        const box = $('pickList'); box.innerHTML = '';
        for (const k of h.items) { const d = document.createElement('div'); d.className = 'kcard'; const sp = SPR[ITEMS[k].spr], cv3 = document.createElement('canvas'); cv3.width = 188; cv3.height = 132; const z = Math.min(170 / sp.cv.width, 122 / sp.cv.height); cv3.getContext('2d').drawImage(sp.cv, 94 - sp.cv.width * z / 2, 66 - sp.cv.height * z / 2, sp.cv.width * z, sp.cv.height * z); d.appendChild(cv3); d.insertAdjacentHTML('beforeend', `<b>${ITEMS[k].name}</b><span>${ITEMS[k].desc}</span>`); d.onclick = () => { $('pick').style.display = 'none'; buy(k); }; box.appendChild(d); }
        $('pick').style.display = 'flex';
      } };
      return null;
    },
  };
}
