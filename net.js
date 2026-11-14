'use strict';
// ============================================================
//  ชั้นออนไลน์: เห็นผู้เล่นคนอื่น (ตำแหน่ง ท่าทาง ชุด ของที่ถือ) และกระทงที่เขาลอย
//  ตัวประกอบไม่ sync แต่ละเครื่องจำลองเอง
//
//  ตัวส่งข้อมูลมี 2 แบบ:
//   - Supabase Realtime (ปกติ) เล่นข้ามเครื่องได้
//   - BroadcastChannel (ใส่ ?local=1 หรือเมื่อโหลด Supabase ไม่ได้) เห็นกันเฉพาะแท็บในเบราว์เซอร์เดียวกัน ไม่กินโควตา
//
//  Supabase นับข้อความ = 1 ครั้งที่ส่ง + 1 ต่อผู้รับทุกคนในช่อง จึงต้องส่งให้น้อยที่สุด:
//   - ชื่อ ชุด และฉากที่อยู่ ฝากไว้ใน presence ของช่องห้อง (ส่งเมื่อเปลี่ยนเท่านั้น)
//   - การเดินส่งเฉพาะตอนเปลี่ยนทิศ/หยุด พร้อมความเร็ว ปลายทางเดินต่อเองจนกว่าจะมีข้อความใหม่
//   - แยกช่องตามฉาก คนคนละฉากไม่ได้รับข้อความกัน
// ============================================================
const Net = (() => {
  const qs = new URLSearchParams(location.search);
  const id = Math.random().toString(36).slice(2, 10);
  const room = (qs.get('room') || 'main').replace(/[^\w-]/g, '').slice(0, 24) || 'main';
  const others = new Map(), stats = { sent: 0, recv: 0, log: [] };
  let tx = null, online = false, now = 0, since = 9, lastKey = '', profSent = '', helloT = 0, px = 0, py = 0, hudT = 0;
  const HEX = /^#[0-9a-f]{6}$/i, okCol = (v, d) => HEX.test(v) ? v : d, inList = (list, v, d) => list.some(e => e[0] === v) ? v : d;
  const okItem = (v, wear) => typeof v === 'string' && ITEMS[v] && (wear ? ITEMS[v].wear === wear : !ITEMS[v].wear) ? v : null;
  const num = (v, lo, hi) => Math.max(lo, Math.min(hi, +v || 0));
  // ข้อมูลชุดจากคนอื่นถูกนำไปประกอบเป็น SVG จึงต้องกรองให้เหลือแต่ค่าที่รู้จัก
  function cleanLook(l) {
    l = l || {};
    return { sex: l.sex === 'f' ? 'f' : 'm', hair: inList(HAIRS, l.hair, 'shaved'), hc: okCol(l.hc, '#2e2422'), skin: okCol(l.skin, '#f7d3ae'), expr: inList(EXPRS, l.expr, 'smile'),
      torso: inList(TORSOS, l.torso, 'bare'), top: okCol(l.top, '#fffaf2'), sc: okCol(l.sc, '#f2c14e'), bottom: inList(BOTTOMS, l.bottom, 'kraben'), bc: okCol(l.bc, '#fffaf2'), feet: inList(FEET, l.feet, 'bare'),
      ex: Array.isArray(l.ex) ? l.ex.filter(k => typeof k === 'string' && ACCS[k]).slice(0, 8) : [] };
  }
  const cleanName = n => String(n || 'เพื่อน').replace(/[\u0000-\u001f]/g, '').slice(0, 14) || 'เพื่อน';
  const okId = v => typeof v === 'string' && v.length > 0 && v.length <= 16;

  function getOther(pid) {
    let o = others.get(pid);
    if (!o) {
      o = Object.assign(mkChar(0, 0, 8), { remote: true, pid, name: 'เพื่อน', w: 40, seen: now, tx: 0, ty: 0, rvx: 0, rvy: 0, moveT: 0, sc: null, ready: false, placed: false, lookKey: '', myCi: 0, inEnts: null });
      o.draw = c => { if (o.hidden || !o.ready || !o.placed) return; drawChar(c, o); if (o.duck < .3) label(c, o.name, o.x, o.y + o.hop - 142 + o.duck * 13, 15, '#bfe3ff', 700, 'rgba(30,15,50,.9)'); };
      others.set(pid, o);
    }
    return o;
  }
  function drop(pid) { const o = others.get(pid); if (!o) return; if (o.inEnts) { const i = o.inEnts.indexOf(o); if (i >= 0) o.inEnts.splice(i, 1); } others.delete(pid); }
  // ชื่อ ชุด และฉากของผู้เล่นอื่น (มาจาก presence หรือข้อความ look)
  function profileIn(pid, m) {
    if (!okId(pid) || pid === id || !m) return; const o = getOther(pid); o.seen = now; o.name = cleanName(m.name);
    if (typeof m.sc === 'string' && m.sc !== o.sc) { o.sc = m.sc; o.placed = false; }
    if (m.monk) { o.ci = 6; o.ready = true; o.lookKey = 'monk'; return; }
    const lk = cleanLook(m.look), key = JSON.stringify(lk); if (key === o.lookKey) return; o.lookKey = key;
    if (!o.myCi) { o.myCi = META.cast.length; META.cast.push({ name: o.name, monk: false, vendor: false, long: false }); }
    META.cast[o.myCi].long = lk.hair === 'long';
    buildCast(o.myCi, lk).then(() => { if (o.lookKey === key && SPR[`c${o.myCi}_f_stand`]) { o.ci = o.myCi; o.ready = true; } });
  }
  function receive(m) {
    if (!m || typeof m !== 'object' || !okId(m.id) || m.id === id) return; stats.recv++;
    if (m.t === 'bye') return drop(m.id);
    if (m.t === 'hello') { profSent = ''; return; }
    if (m.t === 'look') return profileIn(m.id, m);
    // คนเพิ่งเข้าฉากขอรู้ว่าใครอยู่ตรงไหน: ให้คนที่รหัสน้อยสุดในฉากตอบคนเดียว จะได้ไม่ตอบกันทุกคน
    if (m.t === 'hi') {
      if (!started || !cur) return; const here = [...others.values()].filter(o => o.pid !== m.id && o.sc === cur.name && o.placed);
      if (here.some(o => o.pid < id)) return;
      const list = here.map(o => ({ id: o.pid, sc: o.sc, x: Math.round(o.tx), y: Math.round(o.ty), d: o.dir, h: o.held, ht: o.hat, mk: o.mask, bl: o.bal, pl: o.pal, lit: o.lit ? 1 : 0, kr: o.kr, ps: o.pose, dk: Math.round(o.duckT || 0), hid: o.hidden ? 1 : 0, ns: o.noShadow ? 1 : 0 }));
      list.push(Object.assign(myState(0), { id, x: Math.round(P.x), y: Math.round(P.y) }));
      return send({ t: 'snap', list: list.slice(0, 40) });
    }
    if (m.t === 'snap') { if (Array.isArray(m.list)) for (const e of m.list.slice(0, 40)) if (e && okId(e.id) && e.id !== id) { const o = others.get(e.id); if (!o || !o.placed) { stats.recv--; receive(Object.assign({}, e, { t: 's', vx: 0, vy: 0 })); } } return; }
    if (m.t !== 's' && m.t !== 'kr') return;
    const o = getOther(m.id); o.seen = now;
    if (m.t === 's') {
      if (!o.lookKey && tx && tx.keepalive && now - helloT > 1) { helloT = now; send({ t: 'hello' }); }
      if (typeof m.sc === 'string' && m.sc !== o.sc) { o.sc = m.sc; o.placed = false; }
      o.tx = +m.x || 0; o.ty = +m.y || 0; o.rvx = num(m.vx, -320, 320); o.rvy = num(m.vy, -320, 320); o.moveT = 2.4;
      if (!o.placed || Math.hypot(o.tx - o.x, o.ty - o.y) > 320) { o.x = o.tx; o.y = o.ty; o.placed = true; }
      o.dir = ['up', 'down', 'left', 'right'].includes(m.d) ? m.d : 'down';
      o.held = m.h === 'krathong' ? 'krathong' : okItem(m.h); o.hat = okItem(m.ht, 'hat'); o.mask = okItem(m.mk, 'mask'); o.bal = okItem(m.bl, 'bal'); o.pal = okItem(m.pl, 'pal');
      o.lit = !!m.lit; o.kr = /^\d{6}$/.test(m.kr) ? m.kr : '000000'; o.pose = ['eat', 'up', 'wai'].includes(m.ps) ? m.ps : null;
      o.duckT = num(m.dk, 0, 2); o.hidden = !!m.hid; o.noShadow = !!m.ns; o.useT = m.ut ? 2 : 0;
      if (m.jy && !o.cheered) cheer(o, 110); o.cheered = !!m.jy;
    } else if (m.t === 'kr' && m.k && SCENES.pier) {
      const k = m.k;
      SCENES.pier.krs.push({ x: +k.x || 0, y: +k.y || 0, sy: +k.sy || 0, pt: 0, placing: true, lit: !!k.lit, wish: String(k.wish || '').slice(0, 80), mine: false, kind: /^\d{6}$/.test(k.kind) ? k.kind : '000000', owner: o.name, age: 0, seed: R() * 9, vx: 0, tvx: num(k.tvx, 5, 20), ty: num(k.ty, 200, 460) });
    }
  }
  function send(m) { if (!tx || !online) return; m.id = id; try { tx.send(m); stats.sent++; } catch (e) { } }
  function myState(q) {
    return { t: 's', sc: cur.name, q, d: P.dir, h: P.held, ht: P.hat, mk: P.mask, bl: P.bal, pl: P.pal, lit: P.lit ? 1 : 0, kr: P.held === 'krathong' ? P.kr : 0, ps: P.pose, dk: Math.round(P.duckT || 0), hid: P.hidden ? 1 : 0, ns: P.noShadow ? 1 : 0, jy: P.joy > 1 ? 1 : 0, ut: P.useT > 0 ? 1 : 0 };
  }
  function update(dt) {
    now += dt; if (!started || !tx || !cur) return;
    // ชื่อ ชุด ฉาก: ส่งเมื่อเปลี่ยน
    const prof = JSON.stringify({ name: P.name, monk: lookMonk, look: myRecipe(), sc: cur.name });
    if (prof !== profSent && (online || !tx.keepalive)) { profSent = prof; lastKey = ''; try { tx.profile(JSON.parse(prof)); stats.sent++; } catch (e) { } }
    // การเดิน: วัดความเร็วจริง แล้วส่งเฉพาะตอนทิศเปลี่ยน (8 ทิศ + หยุด) หรือสถานะอื่นเปลี่ยน
    let vx = (P.x - px) / dt, vy = (P.y - py) / dt, sp = Math.hypot(vx, vy); px = P.x; py = P.y;
    if (sp < 25 || sp > 320 || P.hidden) { vx = vy = 0; sp = 0; }
    const q = sp ? 1 + ((Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) + 8) % 8) : 0;
    since += dt; const st = myState(q), key = JSON.stringify(st);
    if ((key !== lastKey && since >= .12) || (q && since >= 1.5) || (tx.keepalive && since >= 1)) {
      lastKey = key; since = 0; const a = (q - 1) * Math.PI / 4, v = q ? Math.round(sp / 10) * 10 : 0;
      send(Object.assign(st, { x: Math.round(P.x), y: Math.round(P.y), vx: q ? Math.round(Math.cos(a) * v) : 0, vy: q ? Math.round(Math.sin(a) * v) : 0 }));
    }
    const krs = SCENES.pier && SCENES.pier.krs; if (krs && online) for (const k of krs) if (k.mine && !k.sent) { k.sent = true; send({ t: 'kr', k: { x: Math.round(k.x), y: Math.round(k.y), sy: Math.round(k.sy), lit: k.lit ? 1 : 0, wish: k.wish || '', kind: k.kind, tvx: +k.tvx.toFixed(1), ty: Math.round(k.ty) } }); }
    // ขยับคนอื่น: เดินต่อด้วยความเร็วล่าสุดจนกว่าจะมีข้อความใหม่
    for (const [pid, o] of others) {
      if (tx.keepalive && now - o.seen > 6) { drop(pid); continue; }
      const here = o.sc === cur.name;
      if (o.inEnts && (o.inEnts !== ents || !here)) { const i = o.inEnts.indexOf(o); if (i >= 0) o.inEnts.splice(i, 1); o.inEnts = null; }
      if (here && !o.inEnts) { ents.push(o); o.inEnts = ents; }
      const run = o.moveT > 0 && (o.rvx || o.rvy); if (run) { o.tx += o.rvx * dt; o.ty += o.rvy * dt; o.moveT -= dt; }
      const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy);
      o.moving = !!run || d > 4; if (d > .5) { const k = Math.min(1, dt * 10); o.x += dx * k; o.y += dy * k; } if (o.moving) o.phase += dt * 200 * .075;
      if (o.useT > 0) o.useT -= dt; animChar(o, dt);
    }
    hudT -= dt; if (hudT <= 0) { hudT = 1; hud(); }
  }
  function hud() {
    let el = $('netHud'); if (!el) { el = document.createElement('div'); el.id = 'netHud'; el.className = 'pill'; el.style.cssText = 'position:fixed;right:14px;top:52px;font-size:13px;padding:3px 14px;pointer-events:none'; document.body.appendChild(el); }
    const t = stats.sent + stats.recv; stats.log.push([now, t]); while (stats.log.length > 2 && now - stats.log[0][0] > 60) stats.log.shift();
    const span = now - stats.log[0][0], perMin = span > 5 ? Math.round((t - stats.log[0][1]) / span * 60) : 0;
    el.textContent = !tx ? 'ออฟไลน์' : !online ? 'กำลังเชื่อมต่อ…' : `ออนไลน์ ${others.size + 1} คน · ห้อง ${room}${tx.keepalive ? ' (ในเครื่อง)' : ''}` + (qs.has('netstat') ? ` · ${perMin} ข้อความ/นาที (รวม ${t})` : '');
  }
  function setOnline(v) { const was = online; online = v; if (v && !was) { lastKey = ''; since = 9; if (tx && tx.keepalive) profSent = ''; else send({ t: 'hi' }); } hud(); }
  function useTransport(t) { if (tx && tx.close) tx.close(); tx = t; profSent = ''; lastKey = ''; hud(); }

  // --- แบบในเครื่อง: BroadcastChannel ต้องส่งสัญญาณยังอยู่เอง
  function connectLocal() {
    if (typeof BroadcastChannel === 'undefined') return false; const ch = new BroadcastChannel('lk-' + room); ch.onmessage = e => receive(e.data);
    useTransport({ keepalive: true, send: m => ch.postMessage(m), profile: p => ch.postMessage(Object.assign({ t: 'look', id }, p)), close: () => { ch.postMessage({ t: 'bye', id }); ch.close(); } });
    setOnline(true); ch.postMessage({ t: 'hello', id }); return true;
  }
  // --- แบบ Supabase Realtime
  function connectSupabase(url, key) {
    if (typeof supabase === 'undefined' || !url || !key) return false;
    const sb = supabase.createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 12 } } });
    const roomCh = sb.channel(`lk:${room}`, { config: { presence: { key: id } } });
    let prof = null, joined = false, sceneCh = null, sceneName = null, sceneOk = false;
    roomCh.on('presence', { event: 'sync' }, () => {
      const st = roomCh.presenceState(), seen = new Set(); stats.recv++;
      for (const k in st) { const m = st[k] && st[k][st[k].length - 1]; if (!m || k === id) continue; seen.add(k); profileIn(k, m); }
      for (const pid of [...others.keys()]) if (!seen.has(pid)) drop(pid); hud();
    });
    roomCh.subscribe(s => { joined = s === 'SUBSCRIBED'; if (joined && prof) roomCh.track(prof); setOnline(joined && sceneOk); });
    function scene(sc) {
      if (sc === sceneName) return; if (sceneCh) sb.removeChannel(sceneCh); sceneName = sc; sceneOk = false; setOnline(false);
      const ch = sceneCh = sb.channel(`lk:${room}:${sc}`, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'm' }, e => { if (ch === sceneCh) receive(e.payload); });
      ch.subscribe(s => { if (ch !== sceneCh) return; sceneOk = s === 'SUBSCRIBED'; setOnline(joined && sceneOk); });
    }
    useTransport({ keepalive: false, send: m => { if (sceneCh && sceneOk) sceneCh.send({ type: 'broadcast', event: 'm', payload: m }); }, profile: p => { prof = p; scene(p.sc); if (joined) roomCh.track(p); }, close: () => sb.removeAllChannels(), sb });
    return true;
  }
  function connect() {
    const cfg = typeof LK_CONFIG !== 'undefined' ? LK_CONFIG : {};
    if (qs.has('local') || !connectSupabase(cfg.supabaseUrl, cfg.supabaseKey)) connectLocal();
  }
  addEventListener('pagehide', () => { if (tx && tx.close) tx.close(); });
  return { id, room, others, stats, receive, update, useTransport, connect, send, get online() { return online; }, get tx() { return tx; } };
})();
const _tickNet = tick; tick = function (dt) { _tickNet(dt); Net.update(dt); };
Net.connect();
G.Net = Net;
