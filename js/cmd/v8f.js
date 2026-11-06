// v8 — colaboración en tiempo real (Supabase Realtime o BroadcastChannel local), bloqueo de capas por
// usuario, comentarios anclados a objetos con respuestas y modo tableta (táctil, lápiz y gestos).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Doc } from '../core/document.js';
import { View } from '../view/viewport.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t as T } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };
const wire = (e) => JSON.parse(JSON.stringify(e, (k, v) => (k[0] === '_' ? undefined : v)));
const CURCOL = ['#e8833a', '#2b8cff', '#2fbf71', '#c94fd6', '#e0b400', '#00a7b5', '#ff5d73', '#7a8cff'];

// ---- ops de transacción -> mensajes (aplicables en cualquier copia del dibujo)
export function arrKey(d, arr) {
  if (arr === d.model) return 'M';
  const l = d.layouts.find((x) => x.ents === arr); if (l) return 'L:' + l.name;
  for (const [n, b] of Object.entries(d.blocks)) if (b.ents === arr) return 'B:' + n;
  return null;
}
export function arrOf(d, k) {
  if (k === 'M') return d.model;
  if (k?.startsWith('L:')) return d.layouts.find((x) => x.name === k.slice(2))?.ents;
  if (k?.startsWith('B:')) return d.blocks[k.slice(2)]?.ents;
  return null;
}
export function txToMsgs(d, ops) {
  const out = [], seen = new Set(); let tab = false;
  for (const o of ops) {
    if (o.k === 'tab') { tab = true; continue; }
    const e = o.e; if (!e?.hid || seen.has(e)) continue; seen.add(e);
    const arr = d.ownerOf(e), key = arr && arrKey(d, arr);
    if (key) out.push({ k: 'put', a: key, e: wire(e) });
    else if (o.arr) out.push({ k: 'del', a: arrKey(d, o.arr), h: e.hid });
  }
  if (tab) out.unshift({ k: 'tab', s: d.tablesSnap() });
  return out;
}
export function applyMsgs(d, msgs) {
  for (const m of msgs) {
    if (m.k === 'tab') { d.tablesRestore(m.s); continue; }
    const arr = arrOf(d, m.a); if (!arr) continue;
    const i = arr.findIndex((x) => x.hid === m.h || (m.e && x.hid === m.e.hid));
    if (m.k === 'del') { if (i >= 0) arr.splice(i, 1); continue; }
    if (i >= 0) { const x = arr[i]; for (const k of Object.keys(x)) delete x[k]; Object.assign(x, m.e); }
    else arr.push({ ...m.e });
  }
  d.modified = true; d.emit('change');
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const S = app.settings;
  const me = () => { S.collabId ||= Math.random().toString(36).slice(2, 10); return { id: S.collabId, name: app.cloud?.user?.email || S.collabName || S.cloud?.email || 'Usuario-' + S.collabId.slice(0, 4) }; };

  // ======================= SESIÓN EN TIEMPO REAL =======================
  const sess = (app.collab = { room: null, peers: new Map(), cursors: new Map(), joined: 0, send: null, close: null, doc: null });
  const peerList = () => [...sess.peers.values()].sort((a, b) => a.joined - b.joined);
  const amOldest = () => { const p = peerList(); return !p.length || p[0].joined >= sess.joined; };
  const post = (msg) => sess.send?.({ ...msg, from: me().id });

  const onMsg = (m) => {
    if (!m || m.from === me().id) return;
    const d = sess.doc;
    if (m.t === 'hello' || m.t === 'here') {
      sess.peers.set(m.from, { id: m.from, name: m.name, joined: m.joined, slot: m.slot });
      if (m.t === 'hello') { post({ t: 'here', name: me().name, joined: sess.joined, slot: sess.slot }); if (amOldest() && d && m.wantState) post({ t: 'state', to: m.from, data: d.serialize() }); }
      app.view.redrawOverlay(); app.ui.refresh?.();
    } else if (m.t === 'bye') { sess.peers.delete(m.from); sess.cursors.delete(m.from); app.view.redrawOverlay(); }
    else if (m.t === 'state' && m.to === me().id && sess.waiting) {
      sess.waiting = false;
      const nd = new Doc(); nd.load(JSON.parse(m.data)); nd.name = sess.room + '.dwg'; nd.modified = false;
      app.addDoc(nd); bindDoc(nd); app.view.zoomExtents?.(); app.log(T('Sesión {0}: dibujo recibido.', sess.room));
    } else if (m.t === 'ops' && d) {
      sess.applying = true; try { applyMsgs(d, m.ops); } finally { sess.applying = false; }
      if (d === doc()) redraw();
    } else if (m.t === 'cur') { sess.cursors.set(m.from, { ...m, at: performance.now() }); if (d === doc()) app.view.redrawOverlay(); }
  };

  // identificadores de objeto únicos por participante: evita colisiones de identificadores al crear a la vez
  const bindDoc = (d) => {
    sess.doc = d;
    if (!d._collabHandle) {
      d._collabHandle = true;
      const base = (sess.slot << 20) >>> 0; let n = 0;
      const used = new Set([...d.allEntsDeep()].map((e) => e.hid));
      d.newHandle = () => { let hx; do hx = (0x10000000 + base + ++n).toString(16).toUpperCase(); while (used.has(hx)); used.add(hx); return hx; };
    }
  };
  const txHook = (d, tx) => {
    if (!sess.room || d !== sess.doc || sess.applying || tx.name === 'REMOTE') return;
    const ops = tx.ops; queueMicrotask(() => { const msgs = txToMsgs(d, ops); if (msgs.length) post({ t: 'ops', ops: msgs }); });
  };
  if (!Doc.hooks.includes(txHook)) Doc.hooks.push(txHook);
  // deshacer y rehacer también se transmiten
  for (const k of ['undo', 'redo']) {
    const orig = Doc.prototype[k];
    if (orig._collab) continue;
    Doc.prototype[k] = function () {
      const st = k === 'undo' ? this.undoStack : this.redoStack, t = st[st.length - 1];
      const r = orig.call(this);
      if (t && sess.room && this === sess.doc && !sess.applying) { const msgs = txToMsgs(this, t.ops); if (msgs.length) post({ t: 'ops', ops: msgs }); }
      return r;
    };
    Doc.prototype[k]._collab = true;
  }

  const openTransport = async (room) => {
    const cfg = S.cloud || {};
    if (cfg.url && cfg.key && S.collabTransport !== 'local') {
      try {
        const c = await app.cloud.connect();
        const ch = c.channel('webcad:' + room, { config: { broadcast: { self: false, ack: false } } });
        ch.on('broadcast', { event: 'm' }, ({ payload }) => onMsg(payload));
        await new Promise((ok, ko) => { const to = setTimeout(() => ko(new Error('tiempo de espera agotado')), 8000); ch.subscribe((st) => { if (st === 'SUBSCRIBED') { clearTimeout(to); ok(); } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(to); ko(new Error(st)); } }); });
        return { kind: 'Supabase Realtime', send: (m) => ch.send({ type: 'broadcast', event: 'm', payload: m }), close: () => c.removeChannel(ch) };
      } catch (err) { app.log(T('Tiempo real en la nube no disponible ({0}); se usa el canal local del navegador.', err.message)); }
    }
    if (typeof BroadcastChannel === 'undefined') throw new Error('Este navegador no admite canales de difusión');
    const bc = new BroadcastChannel('webcad-' + room);
    bc.onmessage = (ev) => onMsg(ev.data);
    return { kind: T('canal local (pestañas de este navegador)'), send: (m) => bc.postMessage(m), close: () => bc.close() };
  };
  const leave = () => {
    if (!sess.room) return;
    post({ t: 'bye' }); sess.close?.();
    Object.assign(sess, { room: null, send: null, close: null, doc: null, waiting: false }); sess.peers.clear(); sess.cursors.clear();
    app.view.redrawOverlay(); app.ui.refresh?.();
  };
  app.collab.leave = leave;
  const join = async (room, host) => {
    leave();
    const tr = await openTransport(room);
    Object.assign(sess, { room, send: tr.send, close: tr.close, kind: tr.kind, joined: Date.now(), slot: 1 + Math.floor(Math.random() * 250), waiting: !host });
    if (host) bindDoc(doc());
    post({ t: 'hello', name: me().name, joined: sess.joined, slot: sess.slot, wantState: !host });
    return tr.kind;
  };
  app.collab.join = join; app.collab.onMsg = onMsg;

  // cursores remotos
  let lastCur = 0;
  app.view.ov.addEventListener('pointermove', () => {
    if (!sess.room || !sess.doc) return; const now = performance.now(); if (now - lastCur < 80) return; lastCur = now;
    const p = app.view.cursor; post({ t: 'cur', x: p.x, y: p.y, sp: doc().active, name: me().name, cmd: eng.active || '' });
  });

  R('COLLAB', async (c) => {
    const k = sess.room ? await c.getKw('Collaboration session [Users/Copy code/Leave/Name] <Users>:', 'Users') : await c.getKw('Collaboration [Start/Join/Name] <Start>:', 'Start');
    if (k == null) return;
    if (k === 'Name') { const n = await app.ui.dlg.prompt('Colaboración', 'Nombre visible para los demás:', me().name); if (n) { S.collabName = n.trim(); app.saveSettings?.(); } return; }
    if (k === 'Leave') { leave(); c.print('Collaboration session closed.'); return; }
    if (k === 'Copy code') { try { await navigator.clipboard.writeText(sess.room); c.print(`Session code ${sess.room} copied.`); } catch (_) { c.print(`Session code: ${sess.room}`); } return; }
    if (k === 'Users') { c.print(`Session ${sess.room} (${sess.kind}): ${[me().name + ' *', ...peerList().map((p) => p.name)].join(', ')}`); return; }
    if (k === 'Start') {
      const room = (doc()._cloudId ? 'd' + String(doc()._cloudId).slice(0, 8) : Math.random().toString(36).slice(2, 8)).toUpperCase();
      const kind = await join(room, true);
      c.print(`Collaboration session ${room} started (${kind}). Share the code; others use COLLAB > Join.`);
    } else {
      const room = need(await c.getString('Session code:')).trim().toUpperCase(); if (!room) return;
      const kind = await join(room, false);
      c.print(`Joined session ${room} (${kind}). Waiting for the drawing...`);
      setTimeout(() => { if (sess.waiting && sess.room === room) { sess.waiting = false; bindDoc(doc()); app.log(T('Nadie respondió en la sesión {0}: se comparte el dibujo actual.', room)); } }, 6000);
    }
    redraw();
  }, { alias: ['COLABORAR', 'COLLABORATE'] });

  // ======================= BLOQUEO DE CAPAS POR USUARIO =======================
  const locks = (d) => (d.ext.layerLocks ||= {});
  const origLocked = Doc.prototype.isLocked;
  if (!origLocked._v8) {
    Doc.prototype.isLocked = function (e) {
      if (origLocked.call(this, e)) return true;
      const l = this.ext?.layerLocks?.[e.layer || '0'];
      return !!(l && l.id !== me().id);
    };
    Doc.prototype.isLocked._v8 = true;
  }
  app.layerLockOwner = (name) => doc().ext?.layerLocks?.[name] || null;
  R('LAYERCLAIM', async (c) => {
    const d = doc(), k = await c.getKw('Layer reservation [Claim/Release/release All/List] <Claim>:', 'Claim');
    if (k == null) return;
    if (k === 'List') { const L = Object.entries(locks(d)); c.print(L.length ? L.map(([n, o]) => `${n}: ${o.name}`).join('\n') : 'No layers are reserved.'); return; }
    if (k === 'release All') { d.begin('LAYERCLAIM'); d.touchTables(); for (const [n, o] of Object.entries(locks(d))) if (o.id === me().id) delete locks(d)[n]; d.end(); redraw(); return; }
    let name = await c.getString(`Layer name <${d.clayer}>:`); name = (name || '').trim() || d.clayer;
    if (!d.layers[name]) { c.print(`Layer "${name}" not found.`); return; }
    const cur = locks(d)[name];
    if (k === 'Claim') {
      if (cur && cur.id !== me().id) { c.print(`Layer ${name} is reserved by ${cur.name}.`); return; }
      d.begin('LAYERCLAIM'); d.touchTables(); locks(d)[name] = { id: me().id, name: me().name, t: new Date().toISOString() }; d.end();
      c.print(`Layer ${name} reserved for you: other users cannot modify it.`);
    } else {
      if (cur && cur.id !== me().id && !(await app.ui.dlg.confirm?.(T('La capa {0} está reservada por {1}. ¿Liberarla igualmente?', name, cur.name)))) return;
      d.begin('LAYERCLAIM'); d.touchTables(); delete locks(d)[name]; d.end();
    }
    redraw();
  }, { alias: ['RESERVARCAPA', 'LAYERRESERVE'] });

  // ======================= COMENTARIOS ANCLADOS =======================
  const anchorPos = (d, m) => {
    if (!m.h) return m;
    const e = d.findHandle(m.h); if (!e) return m;
    const b = E.entBBox(e, d); if (!G.bbValid(b)) return m;
    return { x: (b.x1 + b.x2) / 2 + (m.ox || 0), y: (b.y1 + b.y2) / 2 + (m.oy || 0) };
  };
  app.commentPos = (m) => anchorPos(doc(), m);
  R('COMMENT', async (c) => {
    const d = doc();
    const k = await c.getPoint('Select object to comment on or [Point/Reply]:');
    if (k === 'Reply') {
      const list = d.markups || []; if (!list.length) { c.print('There are no comments.'); return; }
      const n = need(await c.getInt('Comment number to reply to:'));
      const m = list[n - 1]; if (!m) return;
      const text = await app.ui.dlg.prompt('Responder', `#${n}: ${m.text}`, ''); if (!text) return;
      d.begin('COMMENT'); d.touchTables(); (m.replies ||= []).push({ text, author: me().name, t: new Date().toISOString() }); d.end(); redraw(); return;
    }
    let p, ent = null;
    if (k === 'Point') p = need(await c.getPoint('Specify comment location:'));
    else {
      p = need(k && typeof k === 'object' ? k : null);
      ent = app.view.pickAt(p);
    }
    const text = await app.ui.dlg.prompt('Comentario', ent ? T('Comentario sobre {0}:', ent.type) : 'Comentario:', ''); if (!text) return;
    const m = { id: Math.random().toString(36).slice(2), x: p.x, y: p.y, space: d.active, text, author: me().name, resolved: false, t: new Date().toISOString(), replies: [] };
    if (ent) { const b = E.entBBox(ent, d); m.h = ent.hid; m.ox = p.x - (b.x1 + b.x2) / 2; m.oy = p.y - (b.y1 + b.y2) / 2; }
    d.begin('COMMENT'); d.touchTables(); (d.markups ||= []).push(m); d.end();
    if (d._cloudId && app.cloud?.user) { try { const row = await app.cloud.addMarkup(d._cloudId, m); m.cid = row.id; } catch (_) { /* local */ } }
    redraw();
  }, { alias: ['COMENTAR', 'COMENTARIO'] });
  R('COMMENTS', async () => {
    const d = doc(), list = h('div', { style: { minWidth: 'min(600px, 90vw)', maxHeight: '58vh', overflow: 'auto' } });
    const when = (s) => (s ? new Date(s).toLocaleString() : '');
    const render = () => list.replaceChildren(...((d.markups || []).length ? d.markups.map((m, i) => h('div', { style: { borderBottom: '1px solid var(--border)', padding: '6px 0', opacity: m.resolved ? 0.55 : 1 } },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('div', {}, h('b', { text: `#${i + 1} ` }), m.text, m.h ? h('span', { class: 'hint', text: ' · ' + T('anclado a {0}', d.findHandle(m.h)?.type || T('objeto borrado')) }) : '', h('div', { class: 'hint', text: `${m.author || ''} · ${when(m.t)}` })),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', text: 'Ir', onclick: () => { const q = anchorPos(d, m); if (m.space && m.space !== d.active) app.setLayout(m.space); app.view.setCur({ ...app.view.cur, cx: q.x, cy: q.y }); app.view.redraw(); } }),
          h('button', { class: 'btn', type: 'button', text: 'Responder', onclick: async () => { const tx = await app.ui.dlg.prompt('Responder', m.text, ''); if (!tx) return; d.begin('COMMENT'); d.touchTables(); (m.replies ||= []).push({ text: tx, author: me().name, t: new Date().toISOString() }); d.end(); render(); } }),
          h('button', { class: 'btn', type: 'button', text: m.resolved ? 'Reabrir' : 'Resolver', onclick: () => { d.begin('COMMENT'); d.touchTables(); m.resolved = !m.resolved; d.end(); render(); app.view.redraw(); } }),
          h('button', { class: 'btn', type: 'button', text: 'Suprimir', onclick: () => { d.begin('COMMENT'); d.touchTables(); d.markups.splice(i, 1); d.end(); render(); app.view.redraw(); } }))),
      ...(m.replies || []).map((r) => h('div', { style: { margin: '4px 0 0 26px', paddingLeft: '8px', borderLeft: '2px solid var(--border)' } }, r.text, h('div', { class: 'hint', text: `${r.author || ''} · ${when(r.t)}` }))))) : [h('p', { class: 'hint', text: 'No hay comentarios. Use COMENTAR para añadir uno.' })]));
    render();
    await app.ui.dlg.open({ title: 'Comentarios', body: [list], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
  }, { alias: ['COMENTARIOS'] });

  // chinchetas que siguen al objeto + cursores de los demás participantes
  const baseDraw = app.drawMarkups;
  app.drawMarkups = (cx, view, dark) => {
    const d = doc();
    const saved = (d.markups || []).map((m) => { if (!m.h) return null; const q = anchorPos(d, m); const o = { x: m.x, y: m.y }; m.x = q.x; m.y = q.y; return o; });
    baseDraw?.(cx, view, dark);
    (d.markups || []).forEach((m, i) => { const o = saved[i]; if (o) { if (m.replies?.length && (m.space || 'Model') === d.active) { const s = view.toScreen(m), r = view.dpr; cx.save(); cx.fillStyle = '#2b8cff'; cx.beginPath(); cx.arc((s.x + 8) * r, (s.y - 22) * r, 5 * r, 0, Math.PI * 2); cx.fill(); cx.fillStyle = '#fff'; cx.font = `600 ${8 * r}px system-ui`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(String(m.replies.length), (s.x + 8) * r, (s.y - 22) * r); cx.restore(); } m.x = o.x; m.y = o.y; } });
    if (!sess.room || sess.doc !== d) return;
    const r = view.dpr, now = performance.now();
    cx.save(); cx.font = `600 ${11 * r}px system-ui, sans-serif`;
    for (const [id, q] of sess.cursors) {
      if (now - q.at > 30000 || q.sp !== d.active) continue;
      const s = view.toScreen(q), x = s.x * r, y = s.y * r, col = CURCOL[(sess.peers.get(id)?.slot || 0) % CURCOL.length];
      cx.fillStyle = col; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x + 11 * r, y + 4 * r); cx.lineTo(x + 4 * r, y + 11 * r); cx.closePath(); cx.fill();
      const lbl = q.name + (q.cmd ? ' · ' + q.cmd : ''), w = cx.measureText(lbl).width + 8 * r;
      cx.fillRect(x + 10 * r, y + 10 * r, w, 16 * r); cx.fillStyle = '#fff'; cx.fillText(lbl, x + 14 * r, y + 22 * r);
    }
    // capas reservadas por otros: aviso discreto
    const others = Object.entries(d.ext.layerLocks || {}).filter(([, o]) => o.id !== me().id);
    if (others.length) { cx.fillStyle = dark ? 'rgba(232,131,58,.9)' : 'rgba(180,90,20,.9)'; cx.fillText(T('Capas reservadas: {0}', others.map(([n, o]) => `${n} (${o.name})`).join(', ')).slice(0, 140), 10 * r, view.H * r - 10 * r); }
    cx.restore();
  };

  // ======================= MODO TABLETA =======================
  const host = app.view.host, ov = app.view.ov;
  const setTablet = (on) => {
    S.touchMode = !!on; app.saveSettings?.();
    document.body.classList.toggle('tablet', !!on);
    if (on) { S._gs ??= S.gripSize; S.gripSize = Math.max(S.gripSize || 6, 12); } else if (S._gs != null) { S.gripSize = S._gs; delete S._gs; }
    app.view.redrawOverlay(); app.ui.refresh?.();
  };
  app.setTablet = setTablet;
  const pickTol0 = View.prototype.pickTol;
  if (!pickTol0._v8) { View.prototype.pickTol = function () { return pickTol0.call(this) * (document.body.classList.contains('tablet') ? 2.5 : 1); }; View.prototype.pickTol._v8 = true; }
  if (S.touchMode ?? (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches)) setTablet(true);
  R('TOUCHMODE', async (c) => {
    const k = await c.getKw(`Tablet mode [ON/OFF] <${S.touchMode ? 'OFF' : 'ON'}>:`, S.touchMode ? 'OFF' : 'ON');
    if (k == null) return; setTablet(k === 'ON'); c.print(`Tablet mode ${k === 'ON' ? 'on' : 'off'}.`);
  }, { alias: ['TABLETMODE', 'MODOTABLETA', 'TACTIL'] });

  // gestos: dos dedos encuadran y amplían; pulsación larga = clic derecho; lápiz se comporta como ratón
  const touches = new Map(); let pend = null, gest = null, lp = null;
  const fwd = (type, ev, extra = {}) => { const e = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: ev.clientX, clientY: ev.clientY, pointerId: ev.pointerId, pointerType: 'touch', button: extra.button ?? 0, buttons: extra.buttons ?? 1, shiftKey: ev.shiftKey, ctrlKey: ev.ctrlKey }); e._v8 = true; ov.dispatchEvent(e); };
  const flush = () => { if (!pend) return; const p = pend; pend = null; clearTimeout(p.t); fwd('pointerdown', p.ev); };
  const center = () => { const a = [...touches.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; };
  ov.addEventListener('pointerdown', (ev) => {
    if (ev._v8 || ev.pointerType !== 'touch') return;
    ev.stopImmediatePropagation(); ev.preventDefault();
    const r = ov.getBoundingClientRect(); touches.set(ev.pointerId, { x: ev.clientX - r.left, y: ev.clientY - r.top });
    if (touches.size === 2) {
      if (pend) { clearTimeout(pend.t); pend = null; } clearTimeout(lp); lp = null;
      gest = center(); return;
    }
    if (touches.size > 2) return;
    pend = { ev, x: ev.clientX, y: ev.clientY, t: setTimeout(flush, 140) };
    lp = setTimeout(() => { lp = null; if (touches.size !== 1) return; if (pend) { clearTimeout(pend.t); pend = null; } fwd('pointerdown', ev, { button: 2, buttons: 2 }); fwd('pointerup', ev, { button: 2, buttons: 0 }); touches.clear(); navigator.vibrate?.(20); }, 650);
  }, true);
  ov.addEventListener('pointermove', (ev) => {
    if (ev._v8 || ev.pointerType !== 'touch' || !touches.has(ev.pointerId)) return;
    const r = ov.getBoundingClientRect(); touches.set(ev.pointerId, { x: ev.clientX - r.left, y: ev.clientY - r.top });
    if (gest && touches.size >= 2) {
      ev.stopImmediatePropagation();
      const c = center(), v = app.view;
      v.panPx(c.x - gest.x, c.y - gest.y);
      if (gest.d > 10 && c.d > 10) v.zoomAt(c.d / gest.d, c.x, c.y);
      gest = c; v.updateCursor(); v.redrawOverlay(); return;
    }
    if (pend && Math.hypot(ev.clientX - pend.x, ev.clientY - pend.y) > 8) { clearTimeout(lp); lp = null; flush(); }
  }, true);
  const up = (ev) => {
    if (ev._v8 || ev.pointerType !== 'touch') return;
    const had = touches.delete(ev.pointerId); clearTimeout(lp); lp = null;
    if (gest) { ev.stopImmediatePropagation(); if (touches.size < 2) gest = null; return; }
    if (!had) { ev.stopImmediatePropagation(); return; }
    if (pend) { flush(); }
  };
  ov.addEventListener('pointerup', up, true);
  ov.addEventListener('pointercancel', (ev) => { touches.delete(ev.pointerId); gest = null; if (pend) { clearTimeout(pend.t); pend = null; } }, true);
  void host;
}
