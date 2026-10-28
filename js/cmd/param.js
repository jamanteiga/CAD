// Restricciones paramétricas: comandos GC*, DC*, AUTOCONSTRAIN, DELCONSTRAINT, PARAMETERS y su dibujo en pantalla.
import * as G from '../core/geom.js';
import * as C from '../core/constraints.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };
const LINEY = (e) => e && (e.type === 'LINE' || e.type === 'LWPOLYLINE');
const ROUND = (e) => e && (e.type === 'CIRCLE' || e.type === 'ARC');
const PTOBJ = (e) => e && ['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC'].includes(e.type);

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const F = (v) => G.fmt(v, 4);

  // resolvedor dentro de cada operación: lo editado queda fijo y el resto se adapta
  const hook = (d, tx) => C.solve(d, C.changedPins(tx), 200, (e) => d.touch(e));
  const attachHook = (d) => { d.solveHook = hook; };
  attachHook(app.doc);
  const prevSwitch = app.switchDoc; app.switchDoc = (d) => { attachHook(d); prevSwitch(d); };
  const prevAdd = app.addDoc; app.addDoc = (d) => { attachHook(d); prevAdd(d); };

  const addConstraint = (c, pinFirst = true) => {
    const d = doc();
    d.begin('CONSTRAINT'); d.touchTables();
    d.constraints.push(c);
    const first = d.findHandle(c.refs[0].h);
    const pins = { ents: new Set(), keys: new Set() }, r0 = c.refs[0];
    if (pinFirst && first) {
      if (r0.k) pins.keys.add(`${r0.h}:${r0.k}`);
      else if (LINEY(first)) for (const q of C.lineRefs(r0, first)) pins.keys.add(`${q.h}:${q.k}`);
      else pins.ents.add(first);
    }
    C.solve(d, pins, 200, (e) => d.touch(e));
    d.end();
    app.view.redraw();
    return c;
  };
  const nextName = (prefix) => { const used = new Set((doc().constraints || []).map((c) => c.name)); let i = 1; while (used.has(prefix + i)) i++; return prefix + i; };

  // ---- geométricas
  const geom = {
    coincident: async (c) => { const a = need(await c.entsel('Select first point:', { filter: PTOBJ })); const b = need(await c.entsel('Select second point:', { filter: PTOBJ })); return { refs: [C.pointRefAt(a.e, a.p), C.pointRefAt(b.e, b.p)] }; },
    horizontal: async (c) => { const a = need(await c.entsel('Select an object:', { filter: LINEY })); return { refs: [C.lineRefAt(a.e, a.p)] }; },
    vertical: async (c) => { const a = need(await c.entsel('Select an object:', { filter: LINEY })); return { refs: [C.lineRefAt(a.e, a.p)] }; },
    parallel: async (c) => { const a = need(await c.entsel('Select first object:', { filter: LINEY })); const b = need(await c.entsel('Select second object:', { filter: LINEY })); return { refs: [C.lineRefAt(a.e, a.p), C.lineRefAt(b.e, b.p)] }; },
    perpendicular: async (c) => { const a = need(await c.entsel('Select first object:', { filter: LINEY })); const b = need(await c.entsel('Select second object:', { filter: LINEY })); return { refs: [C.lineRefAt(a.e, a.p), C.lineRefAt(b.e, b.p)] }; },
    collinear: async (c) => { const a = need(await c.entsel('Select first object:', { filter: LINEY })); const b = need(await c.entsel('Select second object:', { filter: LINEY })); return { refs: [C.lineRefAt(a.e, a.p), C.lineRefAt(b.e, b.p)] }; },
    equal: async (c) => {
      const a = need(await c.entsel('Select first object:', { filter: (e) => LINEY(e) || ROUND(e) }));
      const b = need(await c.entsel('Select second object:', { filter: (e) => (ROUND(a.e) ? ROUND(e) : LINEY(e)) }));
      return { refs: [ROUND(a.e) ? { h: a.e.hid } : C.lineRefAt(a.e, a.p), ROUND(b.e) ? { h: b.e.hid } : C.lineRefAt(b.e, b.p)] };
    },
    concentric: async (c) => { const a = need(await c.entsel('Select first object:', { filter: ROUND })); const b = need(await c.entsel('Select second object:', { filter: ROUND })); return { refs: [{ h: a.e.hid, k: 'c' }, { h: b.e.hid, k: 'c' }] }; },
    tangent: async (c) => { const a = need(await c.entsel('Select first object:', { filter: LINEY })); const b = need(await c.entsel('Select second object:', { filter: ROUND })); return { refs: [C.lineRefAt(a.e, a.p), { h: b.e.hid }] }; },
    fix: async (c) => { const a = need(await c.entsel('Select point:', { filter: PTOBJ })); const r = C.pointRefAt(a.e, a.p); return { refs: [r], pos: { ...C.getP(a.e, r.k) } }; },
  };
  const KWS = { coincident: 'Coincident', horizontal: 'Horizontal', vertical: 'Vertical', parallel: 'Parallel', perpendicular: 'Perpendicular', equal: 'Equal', fix: 'Fix', concentric: 'CONcentric', collinear: 'COLlinear', tangent: 'Tangent' };
  const runGeom = async (c, type) => { const r = await geom[type](c); addConstraint({ type, ...r }); };
  for (const [type, kw] of Object.entries(KWS)) R('GC' + kw.toUpperCase(), (c) => runGeom(c, type));
  R('GEOMCONSTRAINT', async (c) => {
    const k = await c.getKw(`Enter constraint type [${Object.values(KWS).join('/')}] <Coincident>:`, 'Coincident');
    const type = Object.keys(KWS).find((x) => KWS[x] === k) || 'coincident';
    await runGeom(c, type);
  });

  // ---- de cota
  const dimValue = async (c, name, cur, isAng = false) => {
    const s = await c.getString(`Dimension text = ${name}=${isAng ? F(G.deg(cur)) : F(cur)}`, { def: '', spaces: true });
    let expr = String(s || '').trim().replace(/^\w+\s*=\s*/, '');
    if (!expr) expr = isAng ? String(+G.deg(cur).toFixed(6)) : String(+cur.toFixed(6));
    return expr;
  };
  const twoPoints = async (c) => {
    const a = need(await c.entsel('Specify first constraint point:', { filter: PTOBJ }));
    const b = need(await c.entsel('Specify second constraint point:', { filter: PTOBJ }));
    return [C.pointRefAt(a.e, a.p), C.pointRefAt(b.e, b.p)];
  };
  const makeDim = async (c, type) => {
    const d = doc();
    let refs, cur, isAng = false, prefix = 'd';
    if (type === 'dradius' || type === 'ddiameter') {
      const a = need(await c.entsel('Select arc or circle:', { filter: ROUND })); refs = [{ h: a.e.hid }];
      cur = type === 'dradius' ? a.e.r : a.e.r * 2; prefix = type === 'dradius' ? 'rad' : 'dia';
    } else if (type === 'dangular') {
      const a = need(await c.entsel('Select first line:', { filter: LINEY })); const b = need(await c.entsel('Select second line:', { filter: LINEY }));
      refs = [C.lineRefAt(a.e, a.p), C.lineRefAt(b.e, b.p)]; isAng = true; prefix = 'ang';
      const L1 = C.lineRefs(refs[0], a.e), L2 = C.lineRefs(refs[1], b.e);
      const d1 = G.sub(C.getP(a.e, L1[1].k), C.getP(a.e, L1[0].k)), d2 = G.sub(C.getP(b.e, L2[1].k), C.getP(b.e, L2[0].k));
      cur = Math.abs(Math.atan2(G.cross(d1, d2), G.dot(d1, d2)));
    } else {
      refs = await twoPoints(c);
      const pa = C.getP(d.findHandle(refs[0].h), refs[0].k), pb = C.getP(d.findHandle(refs[1].h), refs[1].k);
      cur = type === 'dhorizontal' ? Math.abs(pb.x - pa.x) : type === 'dvertical' ? Math.abs(pb.y - pa.y) : G.dist(pa, pb);
      if (type === 'dlinear') { const dx = Math.abs(pb.x - pa.x), dy = Math.abs(pb.y - pa.y); type = dx >= dy ? 'dhorizontal' : 'dvertical'; cur = Math.max(dx, dy); }
    }
    const loc = await c.getPoint('Specify dimension line location:');
    const name = nextName(prefix);
    const expr = await dimValue(c, name, cur, isAng);
    const cn = { type, refs, name, expr, value: isAng ? G.rad(+expr || 0) : +expr || cur, loc: loc && typeof loc === 'object' ? { x: loc.x, y: loc.y } : null, ang: isAng };
    if (isAng) cn.expr = `(${expr})*pi/180`;
    addConstraint(cn, true);
  };
  const DKW = { dlinear: 'LInear', dhorizontal: 'Horizontal', dvertical: 'Vertical', daligned: 'Aligned', dradius: 'Radius', ddiameter: 'Diameter', dangular: 'ANgular' };
  for (const [type, kw] of Object.entries(DKW)) R('DC' + kw.toUpperCase(), (c) => makeDim(c, type));
  R('DIMCONSTRAINT', async (c) => {
    const k = await c.getKw(`Enter constraint type [${Object.values(DKW).join('/')}] <LInear>:`, 'LInear');
    await makeDim(c, Object.keys(DKW).find((x) => DKW[x] === k) || 'dlinear');
  });

  // ---- automáticas: coincidencias de extremos y líneas horizontales/verticales
  R('AUTOCONSTRAIN', async (c) => {
    const s = (await c.select()).filter(PTOBJ); if (!s.length) return;
    const d = doc(), tol = 1e-6, out = [];
    const pts = [];
    for (const e of s) {
      if (e.type === 'LINE') pts.push({ h: e.hid, k: 'p1', p: e.p1 }, { h: e.hid, k: 'p2', p: e.p2 });
      if (e.type === 'LWPOLYLINE') e.pts.forEach((v, i) => pts.push({ h: e.hid, k: 'v' + i, p: v }));
      if (e.type === 'ARC') pts.push({ h: e.hid, k: 'a1', p: G.polar(e.c, e.a1, e.r) }, { h: e.hid, k: 'a2', p: G.polar(e.c, e.a2, e.r) });
    }
    const has = (type, a, b) => d.constraints.some((x) => x.type === type && JSON.stringify(x.refs) === JSON.stringify(b ? [a, b] : [a]));
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (pts[i].h !== pts[j].h && G.dist(pts[i].p, pts[j].p) < tol) { const A = { h: pts[i].h, k: pts[i].k }, B = { h: pts[j].h, k: pts[j].k }; if (!has('coincident', A, B)) out.push({ type: 'coincident', refs: [A, B] }); }
    for (const e of s) {
      const segs = e.type === 'LINE' ? [[{ h: e.hid }, e.p1, e.p2]] : e.type === 'LWPOLYLINE' ? e.pts.slice(0, e.closed ? e.pts.length : -1).map((v, i) => [{ h: e.hid, seg: i }, v, e.pts[(i + 1) % e.pts.length]]).filter((x) => !(x[1].b)) : [];
      for (const [ref, a, b] of segs) {
        if (Math.abs(a.y - b.y) < tol && Math.abs(a.x - b.x) > tol && !has('horizontal', ref)) out.push({ type: 'horizontal', refs: [ref] });
        else if (Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) > tol && !has('vertical', ref)) out.push({ type: 'vertical', refs: [ref] });
      }
    }
    d.begin('AUTOCONSTRAIN'); d.touchTables(); d.constraints.push(...out); d.end();
    c.print(`${out.length} constraint(s) applied.`); app.view.redraw();
  });
  R('DELCONSTRAINT', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const d = doc(), hs = new Set(s.map((e) => e.hid)), before = d.constraints.length;
    d.begin('DELCONSTRAINT'); d.touchTables(); d.constraints = d.constraints.filter((x) => !x.refs.some((r) => hs.has(r.h))); d.end();
    c.print(`${before - d.constraints.length} constraint(s) removed.`); app.view.redraw();
  });
  R('CONSTRAINTBAR', async (c) => {
    const k = await c.getKw('Enter an option [Show/Hide] <Show>:', 'Show');
    app.settings.cstrShow = k !== 'Hide'; app.saveSettings(); app.view.redraw();
  }, { alias: ['CONSTRAINTBARS'] });
  R('DCDISPLAY', async () => { app.settings.dcShow = app.settings.dcShow === false; app.saveSettings(); app.view.redraw(); });

  // ---- administrador de parámetros
  R('PARAMETERS', async () => {
    const d = doc();
    const dims = d.constraints.filter((x) => C.DIM_TYPES.includes(x.type));
    if (!dims.length) { app.log('No hay restricciones de cota en el dibujo.'); return; }
    C.evalParams(d);
    const inputs = [];
    const rows = dims.map((x) => { const inp = h('input', { type: 'text', value: x.ang ? String(x.expr).replace(/^\((.*)\)\*pi\/180$/, '$1') : x.expr }); inputs.push([x, inp]); return h('tr', {}, h('td', { class: 'kbd', text: x.name }), h('td', {}, inp), h('td', { class: 'hint', text: x.ang ? `${F(G.deg(x.value))}°` : F(x.value) })); });
    const ok = await app.ui.dlg.open({ title: 'Administrador de parámetros', body: [h('p', { class: 'hint', text: 'Escriba un valor o una expresión con otros parámetros (p. ej. d1/2 + 10).' }), h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, h('th', { text: 'Nombre' }), h('th', { text: 'Expresión' }), h('th', { text: 'Valor' }))), h('tbody', {}, rows))] });
    if (!ok) return;
    d.begin('PARAMETERS'); d.touchTables();
    for (const [x, inp] of inputs) x.expr = x.ang ? `(${inp.value})*pi/180` : inp.value;
    C.solve(d, new Set(), 300, (e) => d.touch(e)); d.end(); app.view.redraw();
  }, { alias: ['PARAMETERSMANAGER', 'PAR'] });

  // ---- dibujo en pantalla (capa de superposición)
  app.drawConstraints = (cx, view, dark) => {
    const d = doc(); if (!d.constraints?.length) return;
    const r = view.dpr, showG = app.settings.cstrShow !== false, showD = app.settings.dcShow !== false;
    const P = (ref) => C.getP(d.findHandle(ref.h), ref.k);
    const stack = new Map();
    cx.save(); cx.font = `600 ${11 * r}px Barlow, system-ui, sans-serif`; cx.textBaseline = 'middle';
    const badge = (wp, txt, key) => {
      const n = stack.get(key) || 0; stack.set(key, n + 1);
      const s = view.toScreen(wp), x = (s.x + 8 + n * 17) * r, y = (s.y - 12) * r, w = 15 * r;
      cx.fillStyle = dark ? 'rgba(22,28,31,.9)' : 'rgba(255,255,255,.95)'; cx.strokeStyle = '#3dd6c4'; cx.lineWidth = r;
      cx.beginPath(); cx.rect(x, y - w / 2, w, w); cx.fill(); cx.stroke();
      cx.fillStyle = dark ? '#7fe6da' : '#0b6f6a'; cx.textAlign = 'center'; cx.fillText(txt, x + w / 2, y + r);
    };
    for (const c of d.constraints) {
      const e0 = d.findHandle(c.refs[0].h); if (!e0 || !d.space.includes(e0)) continue;
      if (C.GEOM_TYPES.includes(c.type)) {
        if (!showG) continue;
        for (const ref of c.refs) {
          const e = d.findHandle(ref.h); if (!e) continue;
          let wp;
          if (ref.k) wp = P(ref);
          else if (LINEY(e)) { const L = C.lineRefs(ref, e); wp = G.mid(C.getP(e, L[0].k), C.getP(e, L[1].k)); }
          else if (e.c) wp = G.polar(e.c, Math.PI / 4, e.r);
          if (wp) badge(wp, C.GLYPH[c.type], `${ref.h}:${ref.k || ref.seg || ''}`);
          if (['horizontal', 'vertical', 'fix'].includes(c.type)) break;
        }
      } else if (showD) {
        cx.strokeStyle = '#3dd6c4'; cx.fillStyle = dark ? '#7fe6da' : '#0b6f6a'; cx.lineWidth = r; cx.setLineDash([]);
        const label = `${c.name}=${c.ang ? F(G.deg(c.value)) + '°' : F(c.value)}`;
        let a, b, tp;
        if (c.type === 'dradius' || c.type === 'ddiameter') { const e = d.findHandle(c.refs[0].h); const ang = c.loc ? G.ang(e.c, c.loc) : Math.PI / 4; a = c.type === 'ddiameter' ? G.polar(e.c, ang + Math.PI, e.r) : e.c; b = G.polar(e.c, ang, e.r); tp = c.loc || b; }
        else if (c.type === 'dangular') { const e1 = d.findHandle(c.refs[0].h); const L = C.lineRefs(c.refs[0], e1); a = C.getP(e1, L[0].k); b = C.getP(e1, L[1].k); tp = c.loc || G.mid(a, b); a = null; }
        else {
          const pa = P(c.refs[0]), pb = P(c.refs[1]); if (!pa || !pb) continue;
          const loc = c.loc || G.mid(pa, pb);
          if (c.type === 'dhorizontal') { a = { x: pa.x, y: loc.y }; b = { x: pb.x, y: loc.y }; }
          else if (c.type === 'dvertical') { a = { x: loc.x, y: pa.y }; b = { x: loc.x, y: pb.y }; }
          else { const n = G.norm(G.perp(G.sub(pb, pa))), off = G.dot(G.sub(loc, pa), n); a = G.add(pa, G.mul(n, off)); b = G.add(pb, G.mul(n, off)); }
          for (const [p, q] of [[pa, a], [pb, b]]) { const s1 = view.toScreen(p), s2 = view.toScreen(q); cx.setLineDash([2 * r, 2 * r]); cx.beginPath(); cx.moveTo(s1.x * r, s1.y * r); cx.lineTo(s2.x * r, s2.y * r); cx.stroke(); cx.setLineDash([]); }
          tp = G.mid(a, b);
        }
        if (a && b) { const s1 = view.toScreen(a), s2 = view.toScreen(b); cx.beginPath(); cx.moveTo(s1.x * r, s1.y * r); cx.lineTo(s2.x * r, s2.y * r); cx.stroke(); }
        const st = view.toScreen(tp); const tw = cx.measureText(label).width;
        cx.fillStyle = dark ? 'rgba(22,28,31,.92)' : 'rgba(255,255,255,.95)'; cx.fillRect(st.x * r - tw / 2 - 4 * r, st.y * r - 9 * r, tw + 8 * r, 16 * r);
        cx.fillStyle = dark ? '#7fe6da' : '#0b6f6a'; cx.textAlign = 'center'; cx.fillText(label, st.x * r, st.y * r);
      }
    }
    cx.restore();
  };
  void t;
}
