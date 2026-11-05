// Productividad: grabadora de acciones, comparación de dibujos, conjuntos de planos, eTransmit,
// líneas múltiples (MLINE/MLSTYLE), regiones y operaciones booleanas, propiedades físicas (MASSPROP),
// texto en arco (ARCTEXT), mover-copiar-girar-escalar (MOCORO), supersombreado (SUPERHATCH) y cambio de espacio (CHSPACE).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { listManager } from '../ui/mgr.js';
import { t as T } from '../core/i18n.js';
import { drawEnt } from '../view/renderer.js';
import { zipStore } from '../io/io.js';
import { findBoundary } from './boundary.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);
let PC = null;
const polyClip = async () => (PC ||= (await import(new URL('../../vendor/polygon-clipping/polygon-clipping.mjs', import.meta.url).href)).default);

// ---------- desfase de polilínea con inglete (para MLINE)
function offsetPath(pts, d, closed) {
  const n = pts.length; if (n < 2) return pts.slice();
  const seg = (i) => { const a = pts[i], b = pts[(i + 1) % n]; const u = G.norm(G.sub(b, a)); return { a, b, u, nr: { x: -u.y, y: u.x } }; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
    const sp = hasPrev ? seg((i - 1 + n) % n) : null, sn = hasNext ? seg(i) : null;
    if (!sp) { out.push(G.add(pts[i], G.mul(sn.nr, d))); continue; }
    if (!sn) { out.push(G.add(pts[i], G.mul(sp.nr, d))); continue; }
    const p1 = G.add(sp.a, G.mul(sp.nr, d)), p2 = G.add(sp.b, G.mul(sp.nr, d)), q1 = G.add(sn.a, G.mul(sn.nr, d)), q2 = G.add(sn.b, G.mul(sn.nr, d));
    const x = G.llInter(p1, p2, q1, q2, true, true)[0];
    out.push(x && G.dist(x, pts[i]) < Math.abs(d) * 20 ? x : G.add(pts[i], G.mul(sn.nr, d)));
  }
  return out;
}
const mlStyle = (doc, e) => doc?.ext?.mlstyles?.[e.style] || doc?.ext?.mlstyles?.STANDARD || { els: [{ off: 0.5 }, { off: -0.5 }], caps: {} };
E.GEN.MLINE = {
  arrs: ['pts'], lens: ['scale'],
  xform(e, m, o) { if (o.mir) e.just = e.just === 0 ? 2 : e.just === 2 ? 0 : e.just; },
  ents(e, doc) {
    const st = mlStyle(doc, e), k = e.scale ?? 1, offs = st.els.map((x) => x.off);
    const mx = Math.max(...offs), mn = Math.min(...offs), shift = e.just === 0 ? -mx : e.just === 2 ? -mn : 0;
    const out = [], lines = [];
    for (const el of st.els) {
      const p = offsetPath(e.pts, (el.off + shift) * k, !!e.closed);
      lines.push(p);
      out.push({ type: 'LWPOLYLINE', pts: p.map((q) => ({ ...q, b: 0 })), closed: !!e.closed, layer: e.layer, color: el.color ?? 256, ltype: el.lt || 'BYLAYER' });
    }
    if (!e.closed && lines.length > 1) {
      const top = lines[offs.indexOf(mx)], bot = lines[offs.indexOf(mn)];
      if (st.caps?.start) out.push({ type: 'LINE', p1: top[0], p2: bot[0], layer: e.layer, color: 0 });
      if (st.caps?.end) out.push({ type: 'LINE', p1: top.at(-1), p2: bot.at(-1), layer: e.layer, color: 0 });
    }
    return out;
  },
  length(e) { let s = 0; for (let i = 1; i < e.pts.length; i++) s += G.dist(e.pts[i - 1], e.pts[i]); return s; },
};

// ---------- REGIÓN: contornos cerrados (con curvatura) con relleno par-impar
const ringPts = (l) => E.polyPoints({ pts: l, closed: true });
const regionArea = (e) => { let s = 0; const rings = e.loops.map(ringPts); rings.forEach((r, i) => { const a = Math.abs(G.polyArea(r)); const depth = rings.filter((o, j) => j !== i && G.ptInPoly(r[0], o)).length; s += depth % 2 ? -a : a; }); return s; };
E.GEN.REGION = {
  loops: ['loops'],
  ents(e) { return e.loops.map((l) => ({ type: 'LWPOLYLINE', pts: l.map((p) => ({ x: p.x, y: p.y, b: p.b || 0 })), closed: true, layer: e.layer })); },
  area: regionArea,
  length(e) { return e.loops.reduce((s, l) => s + E.entLength({ type: 'LWPOLYLINE', pts: l, closed: true }), 0); },
  inside(e, p) { let n = 0; for (const l of e.loops) if (G.ptInPoly(p, ringPts(l))) n++; return n % 2 === 1; },
};
export function massProps(e) {
  const rings = e.loops.map(ringPts);
  let A = 0, Sx = 0, Sy = 0, Ixx = 0, Iyy = 0, Ixy = 0;
  rings.forEach((r, i) => {
    const depth = rings.filter((o, j) => j !== i && G.ptInPoly(r[0], o)).length, sgn = (depth % 2 ? -1 : 1) * Math.sign(G.polyArea(r) || 1);
    for (let k = 0; k < r.length; k++) {
      const p = r[k], q = r[(k + 1) % r.length], c = p.x * q.y - q.x * p.y;
      A += sgn * c / 2; Sx += sgn * (p.x + q.x) * c / 6; Sy += sgn * (p.y + q.y) * c / 6;
      Iyy += sgn * (p.x * p.x + p.x * q.x + q.x * q.x) * c / 12; Ixx += sgn * (p.y * p.y + p.y * q.y + q.y * q.y) * c / 12;
      Ixy += sgn * (p.x * q.y + 2 * p.x * p.y + 2 * q.x * q.y + q.x * p.y) * c / 24;
    }
  });
  const cx = Sx / A, cy = Sy / A;
  const bb = G.bbNew(); for (const r of rings) for (const p of r) G.bbAdd(bb, p);
  return { area: A, perim: E.GEN.REGION.length(e), bb, c: { x: cx, y: cy }, Ixx, Iyy, Ixy, Icx: Ixx - A * cy * cy, Icy: Iyy - A * cx * cx, Icxy: Ixy - A * cx * cy };
}

// ---------- TEXTO EN ARCO
E.GEN.ARCTEXT = {
  pts: ['c'], lens: ['r', 'h', 'off'],
  xform(e, m, o) { e.a1 += o.rotA; e.a2 += o.rotA; if (o.mir) { const a1 = e.a1; e.a1 = Math.PI - e.a2; e.a2 = Math.PI - a1; } },
  ents(e, doc) {
    const st = doc?.styles?.[e.style || 'Standard'], font = st?.font && /\.shx$/i.test(st.font) ? null : null;
    const chars = [...String(e.text || '')], h = e.h || 2.5, wf = e.wf || 1;
    const ws = chars.map((ch) => E.textWidth(ch, h, wf, font) + (e.cs || 0) * h);
    const total = ws.reduce((a, b) => a + b, 0);
    const convex = e.side !== 'concave';
    const R = convex ? e.r + (e.off ?? h * 0.5) : Math.max(h, e.r - (e.off ?? h * 0.5) - h);
    const sweep = G.arcSweep(e.a1, e.a2), mid = e.a1 + sweep / 2, span = total / R;
    let start;
    if (convex) start = e.pos === 'left' ? e.a1 + sweep : e.pos === 'right' ? e.a1 + span : mid + span / 2;
    else start = e.pos === 'left' ? e.a1 : e.pos === 'right' ? e.a1 + sweep - span : mid - span / 2;
    const out = []; let acc = 0;
    chars.forEach((ch, i) => {
      const a = convex ? start - (acc + ws[i] / 2) / R : start + (acc + ws[i] / 2) / R;
      acc += ws[i];
      if (ch === ' ') return;
      const p = G.polar(e.c, a, R);
      out.push({ type: 'TEXT', p, p2: p, h, rot: convex ? a - Math.PI / 2 : a + Math.PI / 2, text: ch, ha: 1, va: 0, wf, style: e.style, layer: e.layer, color: e.color });
    });
    return out;
  },
  snaps(e, push) { push(e.c, 'cen'); },
};

// ---------- SUPERSOMBREADO: bloque o imagen repetidos dentro de un contorno
E.GEN.SUPERHATCH = {
  loops: ['loops'], pts: ['org'], lens: ['dx', 'dy', 'sc'],
  xform(e, m, o) { e.rot = (e.rot || 0) + o.rotA; },
  ents(e) { return e.loops.map((l) => ({ type: 'LWPOLYLINE', pts: l.map((p) => ({ x: p.x, y: p.y, b: p.b || 0 })), closed: true, layer: e.layer })); },
  inside(e, p) { return e.loops.some((l) => G.ptInPoly(p, ringPts(l))); },
  tiles(e) {
    const bb = G.bbNew(); for (const l of e.loops) for (const p of ringPts(l)) G.bbAdd(bb, p);
    const out = [], dx = e.dx || 10, dy = e.dy || 10, o = e.org || { x: bb.x1, y: bb.y1 };
    const i0 = Math.floor((bb.x1 - o.x) / dx) - 1, i1 = Math.ceil((bb.x2 - o.x) / dx) + 1, j0 = Math.floor((bb.y1 - o.y) / dy) - 1, j1 = Math.ceil((bb.y2 - o.y) / dy) + 1;
    if ((i1 - i0) * (j1 - j0) > 20000) return out;
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) out.push({ x: o.x + i * dx, y: o.y + j * dy });
    return out;
  },
  draw(ctx, e, doc, st, s, drawEnts) {
    ctx.save();
    ctx.beginPath(); for (const l of e.loops) { const r = ringPts(l); r.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); }
    if (!st.override) {
      ctx.clip('evenodd');
      const tiles = E.GEN.SUPERHATCH.tiles(e);
      if (e.block && doc.blocks[e.block]) {
        const ins = tiles.map((p) => ({ type: 'INSERT', name: e.block, p, sx: e.sc || 1, sy: e.sc || 1, rot: e.rot || 0, layer: e.layer, color: e.color ?? 256 }));
        drawEnts?.(ctx, ins, doc, { ...st, viewBB: null });
      } else if (e.img) {
        const im = E.GEN.IMAGE?.imgOf?.(doc, e.img);
        if (im) for (const p of tiles) { ctx.save(); ctx.translate(p.x, p.y + e.dy); ctx.scale(1, -1); ctx.drawImage(im, 0, 0, e.dx, e.dy); ctx.restore(); }
      }
    }
    ctx.restore();
    ctx.beginPath(); for (const l of e.loops) { const r = ringPts(l); r.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); }
    ctx.stroke();
  },
  explode(e, doc) {
    const out = E.GEN.SUPERHATCH.ents(e).map((x) => ({ ...x, color: e.color }));
    if (e.block && doc.blocks[e.block]) for (const p of E.GEN.SUPERHATCH.tiles(e)) if (e.loops.some((l) => G.ptInPoly({ x: p.x + e.dx / 2, y: p.y + e.dy / 2 }, ringPts(l)))) out.push({ type: 'INSERT', name: e.block, p, sx: e.sc || 1, sy: e.sc || 1, rot: e.rot || 0, layer: e.layer });
    return out;
  },
};

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };

  // ======================= GRABADORA DE ACCIONES =======================
  const ACT_KEY = 'webcad.actions.v1';
  const loadActs = () => { try { return JSON.parse(localStorage.getItem(ACT_KEY) || '{}'); } catch (_) { return {}; } };
  const saveActs = (o) => { try { localStorage.setItem(ACT_KEY, JSON.stringify(o)); } catch (_) { /* almacenamiento no disponible */ } };
  const lispStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const fmtN = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(8)));
  class Recorder {
    constructor() { this.steps = []; this.cur = null; this.pauseNext = false; }
    command(name) { if (/^(ACTRECORD|ACTSTOP|ACTUSERINPUT|ACTUSERMESSAGE|ACTMANAGER|ACTPLAY)$/.test(name)) return; this.cur = [lispStr('_' + name)]; this.steps.push({ cmd: this.cur }); }
    input(req, v) {
      if (!this.cur) return;
      if (this.pauseNext) { this.pauseNext = false; this.cur.push('pause'); return; }
      if (v == null || v === '') this.cur.push('""');
      else if (Array.isArray(v)) { const hs = v.map((e) => e.hid).filter(Boolean); this.cur.push(hs.length ? `(progn (setq %as (ssadd)) (foreach %h '(${hs.map(lispStr).join(' ')}) (if (handent %h) (ssadd (handent %h) %as))) %as)` : 'pause'); if (hs.length) this.cur.push('""'); }
      else if (isPt(v)) this.cur.push(`'(${fmtN(v.x)} ${fmtN(v.y)})`);
      else if (v.e && v.p) this.cur.push(`'(${fmtN(v.p.x)} ${fmtN(v.p.y)})`);
      else if (typeof v === 'number') this.cur.push(req.kind === 'angle' ? lispStr(fmtN(G.deg(v))) : fmtN(v));
      else if (typeof v === 'string') this.cur.push(lispStr(req.kws?.some((k) => k.name === v) ? '_' + v : v));
    }
    script() { return this.steps.map((s) => (s.msg ? `(alert ${lispStr(s.msg)})` : `(command ${s.cmd.join(' ')})`)).join('\n'); }
  }
  R('ACTRECORD', async (c) => {
    if (eng.recorder) { c.print('Action Recorder is already recording.'); return; }
    eng.recorder = new Recorder();
    c.print('Action recording started. Use ACTSTOP to finish.');
    app.ui.status?.update?.();
  }, { alias: ['ARR'] });
  R('ACTSTOP', async (c) => {
    const r = eng.recorder; if (!r) { c.print('Action Recorder is not recording.'); return; }
    eng.recorder = null;
    if (!r.steps.length) { c.print('No actions recorded.'); return; }
    const acts = loadActs();
    let n = 1; while (acts[`ActionMacro${String(n).padStart(3, '0')}`]) n++;
    const name = (await c.getString(`Enter action macro name <ActionMacro${String(n).padStart(3, '0')}>:`, { def: `ActionMacro${String(n).padStart(3, '0')}` })) || `ActionMacro${String(n).padStart(3, '0')}`;
    acts[name.toUpperCase()] = { name, script: r.script(), steps: r.steps.length, date: new Date().toISOString() };
    saveActs(acts);
    c.print(`Action macro "${name}" saved (${r.steps.length} step(s)).`);
  }, { alias: ['ARS'] });
  R('ACTUSERINPUT', async (c) => { if (!eng.recorder) { c.print('Action Recorder is not recording.'); return; } eng.recorder.pauseNext = true; c.print('The next input will be requested during playback.'); }, { alias: ['ARU'] });
  R('ACTUSERMESSAGE', async (c) => { if (!eng.recorder) { c.print('Action Recorder is not recording.'); return; } const m = await c.getString('Enter user message:', { spaces: true }); if (m) eng.recorder.steps.push({ msg: m }); }, { alias: ['ARM'] });
  const playAct = async (name) => {
    const a = loadActs()[String(name).toUpperCase()]; if (!a) return false;
    doc().begin('ACTPLAY');
    try { for (const line of a.script.split('\n')) if (line.trim()) await app.lisp.evalString(line); } finally { doc().end(); }
    redraw(); return true;
  };
  app.actions = { list: loadActs, play: playAct, save: (o) => saveActs(o) };
  R('ACTPLAY', async (c) => {
    const acts = loadActs(), names = Object.values(acts).map((a) => a.name);
    if (!names.length) { c.print('No action macros.'); return; }
    const n = await c.getString(`Enter action macro name or [?] <${names[0]}>:`, { def: names[0] }); if (n == null) return;
    if (n === '?') { c.print(names.join(', ')); return; }
    if (!loadActs()[n.toUpperCase()]) { c.print(`Action macro "${n}" not found.`); return; }
    setTimeout(() => playAct(n), 0); // se reproduce al terminar ACTPLAY
  }, { alias: ['ARP'] });
  R('ACTMANAGER', async () => {
    await listManager(app, {
      title: 'Administrador de acciones',
      names: () => Object.values(loadActs()).map((a) => a.name),
      info: (n) => { const a = loadActs()[n.toUpperCase()]; return a ? `${tr('Pasos')}: ${a.steps}\n${new Date(a.date).toLocaleString()}\n\n${a.script}` : ''; },
      buttons: [
        { t: 'Reproducir', dbl: true, fn: (n) => { if (n) { document.querySelector('.modal .dlg-f .btn.pri')?.click(); setTimeout(() => playAct(n), 50); } } },
        { t: 'Renombrar...', fn: async (n) => { const nn = await app.ui.dlg.prompt('Renombrar', 'Nombre:', n); if (!nn) return; const o = loadActs(); o[nn.toUpperCase()] = { ...o[n.toUpperCase()], name: nn }; delete o[n.toUpperCase()]; saveActs(o); return nn; } },
        { t: 'Suprimir', fn: (n) => { const o = loadActs(); delete o[n.toUpperCase()]; saveActs(o); } },
        { t: 'Exportar...', fn: (n) => { const a = loadActs()[n?.toUpperCase()]; if (a) app.io.deliver(`${a.name}.actm.json`, JSON.stringify(a, null, 1), 'application/json'); } },
        { t: 'Importar...', fn: async () => { const f = await app.io.pickFile('.json,.actm'); if (!f) return; try { const a = JSON.parse(await f.text()); if (!a.script) throw new Error('formato no válido'); const o = loadActs(); o[(a.name || f.name).toUpperCase()] = { name: a.name || f.name, script: a.script, steps: a.steps || 0, date: a.date || new Date().toISOString() }; saveActs(o); return a.name; } catch (err) { app.ui.dlg.alert(err.message); } } },
        { t: 'Exportar como LISP...', fn: (n) => { const a = loadActs()[n?.toUpperCase()]; if (a) app.io.deliver(`${a.name}.lsp`, `;;; ${a.name} — macro de acción de WebCAD Libre\n(defun c:${a.name.replace(/\W+/g, '')} ()\n  ${a.script.split('\n').join('\n  ')}\n  (princ))\n`, 'text/plain'); } },
      ],
    });
  }, { alias: ['ACTM'] });

  // ======================= COMPARAR DIBUJOS =======================
  const round = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v);
  const sig = (e) => JSON.stringify(e, (k, v) => (k[0] === '_' || k === 'hid' || k === 'owner' || k === 'assoc' ? undefined : round(v)));
  let cmp = null;
  app.drawCompare = (c, view) => {
    if (!cmp || doc() !== cmp.doc || doc().active !== 'Model') return;
    view.setWorld(c, view.cur);
    const st = view.baseStyle(view.cur, { viewBB: null });
    for (const e of cmp.b) drawEnt(c, e, doc(), { ...st, override: '#ff3b30', extraW: 1.5 });
    for (const e of cmp.a) drawEnt(c, e, doc(), { ...st, override: '#22b14c', extraW: 1.5 });
    c.setTransform(1, 0, 0, 1, 0, 0);
  };
  const compareWith = (other) => {
    const d = doc(), A = new Map(), out = { a: [], b: [], same: 0 };
    for (const e of d.model) { const k = sig(e); if (!A.has(k)) A.set(k, []); A.get(k).push(e); }
    for (const e of other.model) { const k = sig(e), l = A.get(k); if (l?.length) { l.pop(); out.same++; } else out.b.push(e); }
    for (const l of A.values()) out.a.push(...l);
    return out;
  };
  app.compareDocs = compareWith;
  R('DWGCOMPARE', async (c) => {
    const f = await app.io.pickFile('.dxf,.dwg,.wcad,.json'); if (!f) return;
    let other; try { other = await app.io.parseFile(f); } catch (err) { c.print(`${f.name}: ${err.message}`); return; }
    const r = compareWith(other);
    cmp = { ...r, doc: doc(), name: f.name };
    app.view.redrawOverlay(); app.view.redraw();
    c.print(`Compared with "${f.name}": ${r.a.length} only in current drawing (green), ${r.b.length} only in compared drawing (red), ${r.same} identical.`);
    for (;;) {
      const k = await c.getKw('Enter an option [Insert differences/Report/Zoom/eXit] <eXit>:', 'eXit');
      if (k == null || k === 'eXit') break;
      if (k === 'Zoom') { const bb = G.bbNew(); for (const e of [...r.a, ...r.b]) { const b = E.entBBox(e, doc()); if (G.bbValid(b)) G.bbUnion(bb, b); } if (G.bbValid(bb)) app.view.zoomWindow(bb, 1.2); }
      if (k === 'Insert differences') {
        const d = doc(), ln = 'COMPARAR_' + f.name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 30);
        d.begin('DWGCOMPARE'); d.touchTables(); d.ensureLayer(ln, { color: 1 });
        for (const e of r.b) { const x = E.cloneEnt(e); delete x.hid; x.layer = ln; if (x.type === 'INSERT' && !d.blocks[x.name] && other.blocks[x.name]) d.blocks[x.name] = JSON.parse(JSON.stringify(other.blocks[x.name])); d.add(x); }
        d.end(); c.print(`${r.b.length} object(s) inserted on layer ${ln}.`);
      }
      if (k === 'Report') {
        const tn = (e) => `${e.type}${e.layer ? ' [' + e.layer + ']' : ''}`;
        const txt = [`DWGCOMPARE ${doc().name} ↔ ${f.name}`, new Date().toLocaleString(), '', `Solo en el dibujo actual: ${r.a.length}`, ...r.a.map((e) => '  + ' + tn(e)), '', `Solo en el dibujo comparado: ${r.b.length}`, ...r.b.map((e) => '  - ' + tn(e)), '', `Idénticos: ${r.same}`].join('\n');
        app.io.deliver('comparacion.txt', txt, 'text/plain');
      }
    }
  }, { alias: ['COMPARE'] });
  R('DWGCOMPAREEXIT', async () => { cmp = null; app.view.redrawOverlay(); }, { alias: ['COMPAREEXIT'] });

  // ======================= CONJUNTO DE PLANOS =======================
  const sheetset = () => { const d = doc(); d.ext.sheetset ||= { name: d.name.replace(/\.[^.]+$/, ''), desc: '', sheets: {} }; return d.ext.sheetset; };
  const sheets = () => doc().layouts.map((l, i) => ({ layout: l.name, num: sheetset().sheets[l.name]?.num ?? String(i + 1).padStart(2, '0'), title: sheetset().sheets[l.name]?.title ?? l.name }));
  app.sheetList = sheets;
  R('SHEETSET', async (c) => {
    await listManager(app, {
      title: `${tr('Administrador de conjuntos de planos')} — ${sheetset().name}`,
      names: () => sheets().map((s) => `${s.num} - ${s.title}`),
      info: (n) => { const s = sheets().find((x) => `${x.num} - ${x.title}` === n); const l = s && doc().layouts.find((x) => x.name === s.layout); return s ? `${tr('Presentación')}: ${s.layout}\n${tr('Papel')}: ${l?.paper || ''} (${l?.w} x ${l?.h})\n${tr('Ventanas')}: ${l?.ents.filter((e) => e.type === 'VIEWPORT').length}` : ''; },
      buttons: [
        { t: 'Abrir', dbl: true, fn: (n) => { const s = sheets().find((x) => `${x.num} - ${x.title}` === n); if (s) app.setLayout(s.layout); } },
        { t: 'Propiedades del plano...', fn: async (n) => { const s = sheets().find((x) => `${x.num} - ${x.title}` === n); if (!s) return; const r = await app.ui.dlg.form('Propiedades del plano', [{ k: 'num', l: 'Número', v: s.num }, { k: 'title', l: 'Título', v: s.title }]); if (!r) return; const d = doc(); d.begin('SHEETSET'); d.touchTables(); sheetset().sheets[s.layout] = { num: r.num, title: r.title }; d.end(); return `${r.num} - ${r.title}`; } },
        { t: 'Nuevo plano...', fn: async () => { const d = doc(); const name = await app.ui.dlg.prompt('Nuevo plano', 'Nombre:', `${tr('Plano')} ${d.layouts.length + 1}`); if (!name || d.layouts.some((l) => l.name === name)) return; d.begin('SHEETSET'); d.touchTables(); const src = d.layouts[0]; d.layouts.push({ name, paper: src?.paper || 'A3', w: src?.w || 420, h: src?.h || 297, ents: [] }); d.end(); app.ui.refresh?.(); app.ui.renderLayoutTabs?.(); } },
        { t: 'Propiedades del conjunto...', fn: async () => { const ss = sheetset(); const r = await app.ui.dlg.form('Conjunto de planos', [{ k: 'name', l: 'Nombre', v: ss.name }, { k: 'desc', l: 'Descripción', v: ss.desc }]); if (r) { const d = doc(); d.begin('SHEETSET'); d.touchTables(); ss.name = r.name; ss.desc = r.desc; d.end(); } } },
        { t: 'Publicar en PDF', fn: () => app.io.publishPDF(doc().layouts.map((l) => l.name)) },
        { t: 'Insertar lista de planos', fn: () => setTimeout(() => eng.run('SHEETLIST'), 50) },
      ],
    });
  }, { alias: ['SSM', 'SHEETSETMANAGER'] });
  R('SHEETLIST', async (c) => {
    const rows = [[tr('Número'), tr('Título')], ...sheets().map((s) => [s.num, s.title])];
    const p = need(await c.getPoint('Specify insertion point:'));
    const ts = eng.tableStyle?.() || { th: 2.5, rowh: 7 };
    const d = doc(); d.begin('SHEETLIST');
    d.add({ type: 'TABLE', p, cells: [[sheetset().name, ''], ...rows], rows: Array(rows.length + 1).fill(ts.rowh || 7), cols: [25, 90], th: ts.th || 2.5, head: 2, merge: [[0, 0, 0, 1]] });
    d.end(); redraw();
  });

  // ======================= eTRANSMIT =======================
  R('ETRANSMIT', async (c) => {
    const d = doc(), base = d.name.replace(/\.[^.]+$/, '') || 'dibujo';
    const enc = new TextEncoder(), files = [];
    files.push({ name: `${base}.dxf`, data: enc.encode(app.io.content('dxf')) });
    files.push({ name: `${base}.wcad`, data: enc.encode(d.serialize()) });
    const imgs = Object.entries(d.ext.images || {});
    for (const [id, im] of imgs) {
      const m = /^data:([^;]+);base64,(.*)$/.exec(im.data || ''); if (!m) continue;
      const ext = (m[1].split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      files.push({ name: `imagenes/${(im.name || id).replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '_')}.${ext}`, data: Uint8Array.from(atob(m[2]), (ch) => ch.charCodeAt(0)) });
    }
    const lisp = app.lisp?.fs ? [...app.lisp.fs.entries()].filter(([n]) => /\.(lsp|mnl|dcl|scr)$/i.test(n)) : [];
    for (const [n, t] of lisp) files.push({ name: `lisp/${n}`, data: enc.encode(t) });
    const xrefs = Object.values(d.blocks).filter((b) => b.xref).map((b) => b.name);
    const styles = [...new Set(Object.values(d.styles).map((s) => s.font))];
    const report = [`Informe de transmisión — ${d.name}`, new Date().toLocaleString(), '', 'Archivos incluidos:', ...files.map((f) => '  ' + f.name), '',
      `Fuentes utilizadas: ${styles.join(', ')}`, `Referencias externas (incluidas como bloques en el dibujo): ${xrefs.join(', ') || 'ninguna'}`,
      `Capas: ${Object.keys(d.layers).length}  Bloques: ${Object.keys(d.blocks).length}  Presentaciones: ${d.layouts.length}  Objetos en el modelo: ${d.model.length}`].join('\r\n');
    files.push({ name: `${base} - informe de transmisión.txt`, data: enc.encode(report) });
    const zip = await zipStore(files);
    await app.io.deliver(`${base} - Standard.zip`, zip, 'application/zip');
    c.print(`Transmittal package created: ${files.length} file(s).`);
    app._lastTransmit = files.map((f) => f.name);
  });

  // ======================= LÍNEA MÚLTIPLE =======================
  const ensureMl = () => { const x = doc().ext; x.mlstyles ||= {}; if (!x.mlstyles.STANDARD) x.mlstyles.STANDARD = { els: [{ off: 0.5, color: 256, lt: 'BYLAYER' }, { off: -0.5, color: 256, lt: 'BYLAYER' }], caps: { start: false, end: false }, desc: '' }; };
  R('MLINE', async (c) => {
    ensureMl();
    const d = doc(), v = d.vars;
    for (;;) {
      c.print(`Current settings: Justification = ${['Top', 'Zero', 'Bottom'][v.CMLJUST ?? 0]}, Scale = ${F(v.CMLSCALE ?? 1, 2)}, Style = ${v.CMLSTYLE}`);
      const p = need(await c.getPoint('Specify start point or [Justification/Scale/STyle]:'));
      if (p === 'Justification') { const j = await c.getKw('Enter justification type [Top/Zero/Bottom] <top>:', 'Top'); if (j) d.setvar('CMLJUST', { Top: 0, Zero: 1, Bottom: 2 }[j] ?? 0); continue; }
      if (p === 'Scale') { const s = await c.getReal(`Enter mline scale <${F(v.CMLSCALE ?? 1, 2)}>:`, { def: v.CMLSCALE ?? 1 }); if (s != null) d.setvar('CMLSCALE', s); continue; }
      if (p === 'STyle') { const s = await c.getString('Enter mline style name or [?]:'); if (s === '?') c.print(Object.keys(d.ext.mlstyles).join(', ')); else if (s && d.ext.mlstyles[s.toUpperCase()]) d.setvar('CMLSTYLE', s.toUpperCase()); else if (s) c.print(`Cannot find mline style "${s}".`); continue; }
      const pts = [p];
      const mk = (q, closed = false) => ({ type: 'MLINE', pts: q ? [...pts, q] : pts.slice(), closed, style: v.CMLSTYLE, scale: v.CMLSCALE ?? 1, just: v.CMLJUST ?? 0 });
      for (;;) {
        const q = await c.getPoint(pts.length >= 3 ? 'Specify next point or [Close/Undo]:' : 'Specify next point or [Undo]:', { base: pts.at(-1), preview: (q) => [mk(q)] });
        if (q == null || q === '') break;
        if (q === 'Undo') { if (pts.length > 1) pts.pop(); continue; }
        if (q === 'Close' && pts.length >= 3) { d.add(mk(null, true)); redraw(); return; }
        if (isPt(q)) pts.push(q);
      }
      if (pts.length > 1) { d.add(mk(null)); redraw(); }
      return;
    }
  }, { alias: ['ML'] });
  R('MLSTYLE', async () => {
    ensureMl();
    const tab = () => doc().ext.mlstyles;
    const elStr = (s) => s.els.map((x) => `${x.off}, ${x.color ?? 256}, ${x.lt || 'BYLAYER'}`).join('; ');
    const edit = async (n) => {
      const s = tab()[n];
      const r = await app.ui.dlg.form(`${tr('Modificar estilo de línea múltiple')}: ${n}`, [{ k: 'desc', l: 'Descripción', v: s.desc || '' }, { k: 'els', l: 'Elementos (desfase, color, tipo de línea; …)', v: elStr(s) }, { k: 'cs', l: 'Remate inicial (línea)', v: !!s.caps?.start, t: 'check' }, { k: 'ce', l: 'Remate final (línea)', v: !!s.caps?.end, t: 'check' }]);
      if (!r) return;
      const els = r.els.split(';').map((x) => x.split(',').map((y) => y.trim())).filter((x) => x[0] !== '' && !isNaN(+x[0])).map(([o, col, lt]) => ({ off: +o, color: col ? +col || 256 : 256, lt: (lt || 'BYLAYER').toUpperCase() }));
      if (!els.length) return;
      const d = doc(); d.begin('MLSTYLE'); d.touchTables(); Object.assign(tab()[n], { desc: r.desc, els, caps: { start: r.cs, end: r.ce } }); d.end();
      for (const e of d.allEntsDeep()) if (e.type === 'MLINE' && (e.style || 'STANDARD') === n) E.invalidate(e);
      redraw();
    };
    await listManager(app, {
      title: 'Estilo de línea múltiple', names: () => Object.keys(tab()), cur: () => doc().vars.CMLSTYLE,
      info: (n) => { const s = tab()[n]; return s ? `${s.desc || ''}\n\n${tr('Elementos')}:\n${s.els.map((x) => `  ${x.off}  ${x.color ?? 256}  ${x.lt || 'BYLAYER'}`).join('\n')}` : ''; },
      buttons: [
        { t: 'Definir actual', dbl: true, fn: (n) => doc().setvar('CMLSTYLE', n) },
        { t: 'Nuevo...', fn: async (n) => { const nn = (await app.ui.dlg.prompt('Nuevo estilo', 'Nombre:', ''))?.toUpperCase(); if (!nn || tab()[nn]) return; const d = doc(); d.begin('MLSTYLE'); d.touchTables(); tab()[nn] = JSON.parse(JSON.stringify(tab()[n] || tab().STANDARD)); d.end(); await edit(nn); return nn; } },
        { t: 'Modificar...', fn: edit },
        { t: 'Suprimir', fn: (n) => { if (n === 'STANDARD' || n === doc().vars.CMLSTYLE) return; const d = doc(); d.begin('MLSTYLE'); d.touchTables(); delete tab()[n]; d.end(); } },
      ],
    });
  });
  R('MLEDIT', async (c) => { c.print('Explode the multiline (EXPLODE) and use TRIM/EXTEND to edit its elements.'); });

  // ======================= REGIONES =======================
  const loopOf = (e) => {
    if (e.type === 'CIRCLE') return [{ ...G.polar(e.c, 0, e.r), b: 1 }, { ...G.polar(e.c, Math.PI, e.r), b: 1 }];
    if (e.type === 'LWPOLYLINE' && (e.closed || (e.pts.length > 2 && G.eq(e.pts[0], e.pts.at(-1), 1e-7)))) { const p = e.pts.map((q) => ({ x: q.x, y: q.y, b: q.b || 0 })); if (!e.closed) p.pop(); return p; }
    if ((e.type === 'ELLIPSE' || e.type === 'SPLINE') && E.curvePoints(e).length > 2) { const p = E.curvePoints(e); if (G.eq(p[0], p.at(-1), 1e-6)) return p.slice(0, -1).map((q) => ({ x: q.x, y: q.y, b: 0 })); }
    if (e.type === 'REGION') return null;
    return null;
  };
  // une líneas y arcos sueltos en contornos cerrados
  const chainLoops = (ents) => {
    const segs = ents.map((e) => (e.type === 'LINE' ? { e, a: e.p1, b: e.p2, bulge: 0 } : e.type === 'ARC' ? { e, a: G.polar(e.c, e.a1, e.r), b: G.polar(e.c, e.a2, e.r), bulge: G.arcBulge(e.c, e.r, e.a1, e.a2) } : e.type === 'LWPOLYLINE' && !e.closed ? { e, a: e.pts[0], b: e.pts.at(-1), pl: e } : null)).filter(Boolean);
    const used = new Set(), loops = [], tol = 1e-6;
    for (const s0 of segs) {
      if (used.has(s0)) continue;
      const chain = [{ s: s0, rev: false }]; used.add(s0);
      let end = s0.b;
      for (let guard = 0; guard < segs.length; guard++) {
        if (G.dist(end, s0.a) < tol && chain.length > 1) break;
        const nx = segs.find((s) => !used.has(s) && (G.dist(s.a, end) < tol || G.dist(s.b, end) < tol));
        if (!nx) break;
        const rev = G.dist(nx.b, end) < tol; chain.push({ s: nx, rev }); used.add(nx); end = rev ? nx.a : nx.b;
      }
      if (G.dist(end, s0.a) >= tol || chain.length < 2) continue;
      const loop = [];
      for (const { s, rev } of chain) {
        if (s.pl) { const p = rev ? s.pl.pts.slice().reverse().map((q, i, arr) => ({ x: q.x, y: q.y, b: i < arr.length - 1 ? -(arr[i + 1].b || 0) : 0 })) : s.pl.pts.map((q) => ({ ...q })); loop.push(...p.slice(0, -1)); }
        else loop.push({ ...(rev ? s.b : s.a), b: rev ? -s.bulge : s.bulge });
      }
      loops.push({ loop, ents: chain.map((x) => x.s.e) });
    }
    return loops;
  };
  R('REGION', async (c) => {
    const s = await c.select('Select objects:', { filter: (e) => /^(CIRCLE|LWPOLYLINE|ELLIPSE|SPLINE|LINE|ARC)$/.test(e.type) });
    if (!s.length) return;
    const d = doc(); d.begin('REGION'); let n = 0; const done = new Set();
    for (const e of s) { const l = loopOf(e); if (!l) continue; d.add({ type: 'REGION', loops: [l], layer: e.layer, color: e.color }); done.add(e); n++; }
    for (const { loop, ents } of chainLoops(s.filter((e) => !done.has(e)))) { d.add({ type: 'REGION', loops: [loop], layer: ents[0].layer, color: ents[0].color }); ents.forEach((x) => done.add(x)); n++; }
    if (d.vars.DELOBJ !== 0) for (const e of done) d.remove(e);
    d.end(); c.print(`${n} loop(s) extracted.\n${n} Region(s) created.`); redraw();
  }, { alias: ['REG'] });
  const toMP = (e) => e.loops.map((l) => { const r = ringPts(l).map((p) => [p.x, p.y]); r.push(r[0]); return [r]; });
  const fromMP = (mp, base) => mp.map((poly) => ({ type: 'REGION', loops: poly.map((ring) => ring.slice(0, -1).map(([x, y]) => ({ x, y, b: 0 }))), layer: base.layer, color: base.color }));
  const regionOp = (kind) => async (c) => {
    const pc = await polyClip();
    let A, B;
    if (kind === 'subtract') {
      A = await c.select('Select solids, surfaces, and regions to subtract from ..', { filter: (e) => e.type === 'REGION' }); if (!A.length) return;
      B = await c.select('Select solids, surfaces, and regions to subtract ..', { filter: (e) => e.type === 'REGION' && !A.includes(e) }); if (!B.length) return;
    } else { A = await c.select('Select objects:', { filter: (e) => e.type === 'REGION' }); if (A.length < 2) { c.print('At least 2 regions are required.'); return; } }
    const xorAll = (e) => toMP(e).reduce((acc, p) => (acc ? pc.xor(acc, p) : p), null);
    let res;
    const as = A.map(xorAll);
    if (kind === 'union') res = pc.union(...as);
    else if (kind === 'intersect') res = pc.intersection(...as);
    else res = pc.difference(pc.union(...as), ...B.map(xorAll));
    const d = doc(); d.begin(kind.toUpperCase());
    for (const e of [...A, ...(B || [])]) d.remove(e);
    const out = fromMP(res, A[0]); for (const r of out) d.add(r);
    d.end(); if (!out.length) c.print('Null region created - deleted.'); redraw();
  };
  R('UNION', regionOp('union'), { alias: ['UNI'] });
  R('SUBTRACT', regionOp('subtract'), { alias: ['SU'] });
  R('INTERSECT', regionOp('intersect'));
  app.regionBoolean = async (kind, a, b) => { const pc = await polyClip(); const xa = (e) => toMP(e).reduce((acc, p) => (acc ? pc.xor(acc, p) : p), null); return kind === 'union' ? pc.union(xa(a), xa(b)) : kind === 'intersect' ? pc.intersection(xa(a), xa(b)) : pc.difference(xa(a), xa(b)); };
  R('MASSPROP', async (c) => {
    const s = await c.select('Select objects:', { filter: (e) => e.type === 'REGION' || e.type === '3DSOLID' || (e.type === 'LWPOLYLINE' && e.closed) || e.type === 'CIRCLE' });
    if (!s.length) return;
    for (const e0 of s) {
      if (e0.type === '3DSOLID') { const g = E.GEN['3DSOLID']; c.print(`----------------   SOLIDS   ----------------\nVolume:                  ${F(g.volume(e0))}\nBounding box:         X: ${F(E.entBBox(e0, doc()).x1)}  --  ${F(E.entBBox(e0, doc()).x2)}\n                      Y: ${F(E.entBBox(e0, doc()).y1)}  --  ${F(E.entBBox(e0, doc()).y2)}\n                      Z: ${F(e0.z0 || 0)}  --  ${F((e0.z0 || 0) + e0.h)}`); continue; }
      const e = e0.type === 'REGION' ? e0 : { loops: [loopOf(e0)] };
      const m = massProps(e);
      c.print(['----------------   REGIONS   ----------------', `Area:                    ${F(Math.abs(m.area))}`, `Perimeter:               ${F(m.perim)}`,
        `Bounding box:         X: ${F(m.bb.x1)}  --  ${F(m.bb.x2)}`, `                      Y: ${F(m.bb.y1)}  --  ${F(m.bb.y2)}`, `Centroid:             X: ${F(m.c.x)}`, `                      Y: ${F(m.c.y)}`,
        `Moments of inertia:   X: ${F(Math.abs(m.Ixx))}`, `                      Y: ${F(Math.abs(m.Iyy))}`, `Product of inertia:  XY: ${F(m.Ixy)}`,
        `Radii of gyration:    X: ${F(Math.sqrt(Math.abs(m.Ixx / m.area)))}`, `                      Y: ${F(Math.sqrt(Math.abs(m.Iyy / m.area)))}`,
        `Principal moments and X-Y directions about centroid:`, ...(() => { const a = Math.abs(m.Icx), b = Math.abs(m.Icy), cxy = m.Icxy * Math.sign(m.area), avg = (a + b) / 2, r = Math.hypot((a - b) / 2, cxy); return [`                  I: ${F(avg + r)}`, `                  J: ${F(avg - r)}`]; })()].join('\n'));
    }
  }, { alias: ['PROPFIS'] });

  // ======================= TEXTO EN ARCO =======================
  R('ARCTEXT', async (c) => {
    const r = need(await c.entsel('Select an Arc or an ArcAlignedText:', { filter: (e) => e.type === 'ARC' || e.type === 'ARCTEXT', filterMsg: 'Select an arc.' }));
    const a = r.e, ex = a.type === 'ARCTEXT' ? a : null;
    const d = doc();
    const f = await app.ui.dlg.form('Texto alineado con arco', [
      { k: 'text', l: 'Texto', v: ex?.text || '' }, { k: 'h', l: 'Altura de texto', v: ex?.h || d.vars.TEXTSIZE || 2.5, t: 'number' }, { k: 'wf', l: 'Factor de anchura', v: ex?.wf || 1, t: 'number' },
      { k: 'cs', l: 'Espaciado entre caracteres', v: ex?.cs || 0, t: 'number' }, { k: 'off', l: 'Desfase desde el arco', v: ex?.off ?? (ex?.h || d.vars.TEXTSIZE || 2.5) * 0.5, t: 'number' },
      { k: 'pos', l: 'Alineación', v: ex?.pos || 'center', t: 'select', opts: [{ v: 'center', l: 'Centro' }, { v: 'left', l: 'Izquierda' }, { v: 'right', l: 'Derecha' }] },
      { k: 'side', l: 'Posición', v: ex?.side || 'convex', t: 'select', opts: [{ v: 'convex', l: 'Lado convexo' }, { v: 'concave', l: 'Lado cóncavo' }] },
      { k: 'style', l: 'Estilo', v: ex?.style || d.vars.TEXTSTYLE, t: 'select', opts: Object.keys(d.styles) },
    ]);
    if (!f || !f.text) return;
    const o = { text: f.text, h: +f.h, wf: +f.wf || 1, cs: +f.cs || 0, off: +f.off, pos: f.pos, side: f.side, style: f.style };
    d.begin('ARCTEXT');
    if (ex) d.mod(ex, (x) => Object.assign(x, o));
    else d.add({ type: 'ARCTEXT', c: { ...a.c }, r: a.r, a1: a.a1, a2: a.a2, ...o, layer: a.layer });
    d.end(); redraw();
  }, { alias: ['ARCTXT'] });

  // ======================= MOCORO =======================
  R('MOCORO', async (c) => {
    let s = await c.select(); if (!s.length) return;
    const d = doc();
    let base = need(await c.getPoint('Base point:'));
    let mode = 'Move'; const undo = [];
    d.begin('MOCORO');
    try {
      for (;;) {
        const pv = (q) => {
          if (!isPt(q)) return [];
          const m = mode === 'Move' || mode === 'Copy' ? G.M.tr(q.x - base.x, q.y - base.y) : mode === 'Rotate' ? G.M.rot(G.ang(base, q), base) : G.M.scale(Math.max(1e-6, G.dist(base, q) / 10), base);
          return s.map((e) => { const x = E.cloneEnt(e); E.transformEnt(x, m); x._ghost = mode !== 'Copy'; return x; });
        };
        const q = await c.getPoint('Specify second point or [Move/Copy/Rotate/Scale/Base/Undo/eXit] <eXit>:', { base, preview: pv });
        if (q == null || q === '' || q === 'eXit') break;
        if (q === 'Base') { base = need(await c.getPoint('Base point:')); continue; }
        if (q === 'Undo') { const u = undo.pop(); if (u) { for (const [e, data] of u.mods) { d.touch(e); for (const k of Object.keys(e)) delete e[k]; Object.assign(e, data); E.invalidate(e); } for (const e of u.adds) d.remove(e); s = u.sel; redraw(); } continue; }
        if (['Move', 'Copy', 'Rotate', 'Scale'].includes(q)) { mode = q; c.print(`** ${q.toUpperCase()} **`); continue; }
        if (!isPt(q)) {
          if (typeof q === 'number' && mode === 'Rotate') { /* ángulo escrito */ }
          continue;
        }
        let m;
        if (mode === 'Move' || mode === 'Copy') m = G.M.tr(q.x - base.x, q.y - base.y);
        else if (mode === 'Rotate') m = G.M.rot(G.ang(base, q), base);
        else { const k = await c.getReal('Specify scale factor <1>:', { def: 1, positive: true }); if (!k) continue; m = G.M.scale(k, base); }
        if (mode === 'Copy') { const adds = s.map((e) => { const x = E.cloneEnt(e); delete x.hid; E.transformEnt(x, m); return d.add(x); }); undo.push({ mods: [], adds, sel: s }); }
        else { const mods = s.map((e) => [e, E.cloneEnt(e)]); for (const e of s) d.mod(e, (x) => E.transformEnt(x, m)); undo.push({ mods, adds: [], sel: s }); }
        redraw();
      }
    } finally { d.end(); }
  }, { alias: ['MCR'] });

  // ======================= SUPERSOMBREADO =======================
  R('SUPERHATCH', async (c) => {
    const d = doc();
    const k = await c.getKw('Select pattern type [Image/Block] <Block>:', 'Block'); if (k == null) return;
    let block = null, img = null, dx = 10, dy = 10, sc = 1;
    if (k === 'Block') {
      const names = Object.keys(d.blocks).filter((n) => !n.startsWith('*'));
      if (!names.length) { c.print('The drawing has no blocks.'); return; }
      const r = await app.ui.dlg.form('Supersombreado', [{ k: 'b', l: 'Bloque', v: names[0], t: 'select', opts: names }, { k: 'sc', l: 'Escala', v: 1, t: 'number' }, { k: 'gap', l: 'Separación adicional', v: 0, t: 'number' }]);
      if (!r) return;
      block = r.b; sc = +r.sc || 1;
      const bb = d.extents(d.blocks[block].ents) || { x1: 0, y1: 0, x2: 10, y2: 10 };
      dx = (bb.x2 - bb.x1) * sc + (+r.gap || 0); dy = (bb.y2 - bb.y1) * sc + (+r.gap || 0);
      if (dx <= 0) dx = 10; if (dy <= 0) dy = 10;
    } else {
      const f = await app.io.pickFile('image/*'); if (!f) return;
      const data = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(f); });
      const im = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = data; });
      const r = await app.ui.dlg.form('Supersombreado', [{ k: 'w', l: 'Anchura de la imagen', v: 20, t: 'number' }]); if (!r) return;
      dx = +r.w || 20; dy = dx * im.naturalHeight / im.naturalWidth;
      d.begin('SUPERHATCH'); d.touchTables(); img = 'sh_' + Math.random().toString(36).slice(2, 8); d.ext.images[img] = { name: f.name, data, w: im.naturalWidth, h: im.naturalHeight }; d.end();
    }
    const org = need(await c.getPoint('Specify insertion point <use first tile origin>:', { def: null }));
    const loops = [];
    for (;;) {
      const r = await c.ask({ kind: 'point', wantsPoint: true, prompt: 'Specify an option [Select/Advanced options] <Internal point>:' });
      if (r == null || r === '') break;
      if (r === 'Select') { const s = await c.select('Select objects:', { filter: (e) => !!loopOf(e) || e.type === 'REGION' }); for (const e of s) { if (e.type === 'REGION') loops.push(...e.loops); else loops.push(loopOf(e)); } break; }
      if (isPt(r)) { const pts = findBoundary(app, r); if (pts) { loops.push(pts.map((p) => ({ x: p.x, y: p.y, b: 0 }))); c.print('Boundary found.'); } else c.print('Valid hatch boundary not found.'); }
    }
    if (!loops.length) return;
    d.begin('SUPERHATCH');
    d.add({ type: 'SUPERHATCH', loops, block, img, dx, dy, sc, org: isPt(org) ? org : null });
    d.end(); redraw();
  }, { alias: ['SUPERSOMBREADO'] });

  // ======================= CAMBIAR DE ESPACIO =======================
  R('CHSPACE', async (c) => {
    const d = doc();
    if (d.active === 'Model') { c.print('** Command not allowed in Model Tab **'); return; }
    const toModel = !d.mspace;
    const s = await c.select('Select objects:', { filter: (e) => e.type !== 'VIEWPORT' }); if (!s.length) return;
    let vp = d.mspace;
    if (!vp) {
      const vps = d.layout.ents.filter((e) => e.type === 'VIEWPORT');
      if (vps.length === 1) vp = vps[0];
      else { const r = need(await c.entsel('Select viewport to set current:', { filter: (e) => e.type === 'VIEWPORT' })); vp = r.e; }
    }
    if (!vp) { c.print('No viewport.'); return; }
    // papel -> modelo: m = vc + (p - c) / scale
    const k = 1 / vp.scale;
    const P2M = G.M.mul(G.M.tr(vp.vc.x, vp.vc.y), G.M.mul(G.M.scale(k), G.M.tr(-vp.c.x, -vp.c.y)));
    const m = toModel ? P2M : G.M.inv(P2M);
    const from = toModel ? d.layout.ents : d.model, to = toModel ? d.model : d.layout.ents;
    d.begin('CHSPACE');
    for (const e of s) { if (!from.includes(e)) continue; d.remove(e, from); E.transformEnt(e, m); d.add(e, to); }
    d.end();
    c.print(`${s.length} object(s) changed from ${toModel ? 'PAPER' : 'MODEL'} space to ${toModel ? 'MODEL' : 'PAPER'} space.\nObjects were scaled by a factor of ${F(toModel ? k : vp.scale, 6)} to maintain visual appearance.`);
    redraw();
  });
}
