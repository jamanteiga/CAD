// v8 — completa límites de la v7: MLEDIT, cortes de cota automáticos, booleanas de sólidos 3D,
// sección de nubes de puntos.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import * as CSG from '../core/csg.js';
import { Cancel } from './engine.js';
import { Doc } from '../core/document.js';
import { meshOf, cloudData, buildCloud } from './solid3d.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };

// ---------- máscaras de MLINE (cruces, tes, cortes): se ocultan las líneas dentro de los polígonos
const clipOutside = (a, b, masks) => {
  const ts = [0, 1];
  for (const m of masks) for (let i = 0; i < m.length; i++) {
    const q = G.llInter(a, b, m[i], m[(i + 1) % m.length], false, false)[0];
    if (q) ts.push(G.dot(G.sub(q, a), G.sub(b, a)) / Math.max(1e-18, G.dot(G.sub(b, a), G.sub(b, a))));
  }
  ts.sort((x, y) => x - y);
  const out = [];
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - ts[i - 1] < 1e-9) continue;
    const mid = G.lerp(a, b, (ts[i] + ts[i - 1]) / 2);
    if (!masks.some((m) => G.ptInPoly(mid, m))) out.push([G.lerp(a, b, ts[i - 1]), G.lerp(a, b, ts[i])]);
  }
  return out;
};
const ML = E.GEN.MLINE, mlEnts0 = ML.ents, mlX0 = ML.xform;
ML.ents = (e, doc) => {
  const sub = mlEnts0(e, doc);
  if (!e.masks?.length) return sub;
  const out = [];
  for (const s of sub) {
    const segs = s.type === 'LINE' ? [[s.p1, s.p2]] : s.pts.map((p, i, a) => (i < a.length - 1 ? [p, a[i + 1]] : s.closed ? [p, a[0]] : null)).filter(Boolean);
    for (const [a, b] of segs) for (const [p, q] of clipOutside(a, b, e.masks)) out.push({ type: 'LINE', p1: { x: p.x, y: p.y }, p2: { x: q.x, y: q.y }, layer: s.layer, color: s.color, ltype: s.ltype });
  }
  return out;
};
ML.xform = (e, m, o) => { mlX0?.(e, m, o); if (e.masks) e.masks = e.masks.map((pl) => pl.map((p) => G.M.apply(m, p))); };
// banda exterior de una multilínea (polígono que ocupa entre sus elementos extremos)
export function mlBand(e, doc, pad = 0) {
  const st = doc.ext?.mlstyles?.[e.style] || doc.ext?.mlstyles?.STANDARD || { els: [{ off: 0.5 }, { off: -0.5 }] };
  const k = e.scale ?? 1, offs = st.els.map((x) => x.off), mx = Math.max(...offs), mn = Math.min(...offs), shift = e.just === 0 ? -mx : e.just === 2 ? -mn : 0;
  const off = (d) => { const pts = e.pts, out = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const u = G.norm(G.sub(b, a)); out.push(G.add(pts[i], G.mul({ x: -u.y, y: u.x }, d))); } return out; };
  const top = off((mx + shift) * k + pad), bot = off((mn + shift) * k - pad);
  return [...top, ...bot.reverse()];
}
// polígono de la banda de A recortado a la zona próxima al cruce con B
const crossMask = (A, B, doc, pad = 1e-6) => {
  const band = mlBand(B, doc, pad);
  return band;
};

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };

  // ======================= MLEDIT =======================
  R('MLEDIT', async (c) => {
    const d = doc();
    const tool = await c.getKw('Enter mline editing option [Closed cross/Open cross/Merged cross/closed Tee/open tEe/Merged tee/Corner joint/Add vertex/Delete vertex/Cut single/cut All/Weld all] <Closed cross>:', 'Closed cross');
    if (tool == null) return;
    const pick = async (pr) => need(await c.entsel(pr, { filter: (e) => e.type === 'MLINE', filterMsg: 'Select a multiline.' }));
    if (tool === 'Add vertex' || tool === 'Delete vertex') {
      const r = await pick('Select mline:'); const e = r.e;
      let best = 0, bd = Infinity; for (let i = 0; i < e.pts.length - 1; i++) { const dd = G.segDist(r.p, e.pts[i], e.pts[i + 1]); if (dd < bd) { bd = dd; best = i; } }
      d.begin('MLEDIT');
      d.mod(e, (x) => {
        if (tool === 'Add vertex') { const a = x.pts[best], b = x.pts[best + 1], q = G.add(a, G.mul(G.norm(G.sub(b, a)), G.dot(G.sub(r.p, a), G.norm(G.sub(b, a))))); x.pts.splice(best + 1, 0, q); }
        else if (x.pts.length > 2) { let k = 0, kd = Infinity; x.pts.forEach((p, i) => { const dd = G.dist(p, r.p); if (dd < kd) { kd = dd; k = i; } }); x.pts.splice(k, 1); }
      });
      d.end(); redraw(); return;
    }
    if (tool === 'Cut single' || tool === 'cut All') {
      const r = await pick('Select mline:');
      const p2 = need(await c.getPoint('Select second point:', { base: r.p }));
      const e = r.e, u = G.norm(G.sub(p2, r.p)), n = { x: -u.y, y: u.x }, w = Math.max(1e-6, (e.scale ?? 1) * 0.02);
      const L = G.dist(r.p, p2);
      // rectángulo estrecho a lo largo del corte; «cortar todo» lo ensancha a toda la banda
      const span = tool === 'cut All' ? (e.scale ?? 1) * 4 + 1 : w;
      const poly = [G.add(r.p, G.mul(n, -span)), G.add(p2, G.mul(n, -span)), G.add(p2, G.mul(n, span)), G.add(r.p, G.mul(n, span))];
      void L;
      d.begin('MLEDIT'); d.mod(e, (x) => (x.masks = [...(x.masks || []), poly])); d.end(); redraw(); return;
    }
    if (tool === 'Weld all') {
      const r = await pick('Select mline:'); d.begin('MLEDIT'); d.mod(r.e, (x) => delete x.masks); d.end(); redraw(); return;
    }
    const r1 = await pick('Select first mline:'), r2 = await pick('Select second mline:');
    const A = r1.e, B = r2.e;
    if (A === B) { c.print('Select two different multilines.'); return; }
    d.begin('MLEDIT');
    if (tool === 'Corner joint') {
      const x = G.llInter(A.pts.at(-2) || A.pts[0], A.pts.at(-1), B.pts[0], B.pts[1], true, true)[0];
      if (x) {
        const endA = G.dist(A.pts[0], r1.p) < G.dist(A.pts.at(-1), r1.p) ? 0 : A.pts.length - 1;
        const endB = G.dist(B.pts[0], r2.p) < G.dist(B.pts.at(-1), r2.p) ? 0 : B.pts.length - 1;
        // se recorta o alarga el extremo más alejado del punto designado
        const ka = endA === 0 ? A.pts.length - 1 : 0, kb = endB === 0 ? B.pts.length - 1 : 0;
        const xa = G.llInter(A.pts[ka], A.pts[ka === 0 ? 1 : ka - 1], B.pts[kb], B.pts[kb === 0 ? 1 : kb - 1], true, true)[0] || x;
        d.mod(A, (y) => (y.pts[ka] = { ...xa })); d.mod(B, (y) => (y.pts[kb] = { ...xa }));
      }
    } else {
      const open = /^Open|^open/.test(tool), merged = /^Merged/.test(tool), tee = /tee|Tee|tEe/.test(tool);
      // cruz cerrada: la segunda se corta dentro de la primera; abierta y fusionada: ambas
      d.mod(B, (y) => (y.masks = [...(y.masks || []), crossMask(B, A, d)]));
      if (open || merged) d.mod(A, (y) => (y.masks = [...(y.masks || []), crossMask(A, B, d)]));
      if (tee) {
        // en T: la primera termina en la segunda (se elimina lo que sobresale por el otro lado)
        const xA = G.llInter(A.pts[0], A.pts.at(-1), B.pts[0], B.pts.at(-1), true, true)[0];
        if (xA) {
          const keepStart = G.dist(r1.p, A.pts[0]) < G.dist(r1.p, A.pts.at(-1));
          d.mod(A, (y) => { if (keepStart) y.pts[y.pts.length - 1] = { ...xA }; else y.pts[0] = { ...xA }; });
          d.mod(B, (y) => (y.masks = (y.masks || []).slice(0, -1)));
          if (open || merged) d.mod(B, (y) => (y.masks = [...(y.masks || []), crossMask(B, A, d)]));
        }
      }
    }
    d.end(); redraw();
  }, { alias: ['MLED'] });

  // ======================= DIMBREAK automático =======================
  const brkHook = (d, tx) => {
    if (tx.name === 'UNDO' || tx.name === 'REDO' || !eng.dimBreakPoints) return;
    const touched = tx.ops.filter((o) => o.e && o.e.type !== 'DIMENSION').map((o) => o.e);
    const dims = [...d.allEnts()].filter((e) => e.type === 'DIMENSION' && e.brkAuto);
    if (!dims.length) return;
    const tbb = touched.map((e) => E.entBBox(e, d)).filter((b) => G.bbValid(b));
    for (const dm of dims) {
      const selfTouched = tx.ops.some((o) => o.e === dm);
      const bb = E.entBBox({ ...dm, brk: null, _dim: null }, d);
      if (!selfTouched && !tbb.some((b) => G.bbOverlap(b, bb))) continue;
      const nb = eng.dimBreakPoints(dm);
      if (JSON.stringify(nb) !== JSON.stringify(dm.brk || [])) d.mod(dm, (x) => (x.brk = nb));
    }
  };
  if (!Doc.hooks.includes(brkHook)) Doc.hooks.push(brkHook);

  // ======================= BOOLEANAS DE SÓLIDOS 3D =======================
  const polysOf = (e) => CSG.meshToPolys(meshOf(e));
  const solidOp = (kind, fallback) => async (c) => {
    const isSolid = (e) => e.type === '3DSOLID';
    let A, B;
    if (kind === 'subtract') {
      A = await c.select('Select solids, surfaces, and regions to subtract from ..', { filter: (e) => isSolid(e) || e.type === 'REGION' }); if (!A.length) return;
      if (!A.some(isSolid)) return fallback(c, A);
      B = await c.select('Select solids, surfaces, and regions to subtract ..', { filter: (e) => isSolid(e) && !A.includes(e) }); if (!B.length) return;
    } else {
      A = await c.select('Select objects:', { filter: (e) => isSolid(e) || e.type === 'REGION' });
      if (!A.some(isSolid)) return fallback(c, A);
      A = A.filter(isSolid);
      if (A.length < 2) { c.print('At least 2 solids are required.'); return; }
    }
    let res;
    if (kind === 'union') res = A.slice(1).reduce((acc, e) => CSG.union(acc, polysOf(e)), polysOf(A[0]));
    else if (kind === 'intersect') res = A.slice(1).reduce((acc, e) => CSG.intersect(acc, polysOf(e)), polysOf(A[0]));
    else { const base = A.filter(isSolid).slice(1).reduce((acc, e) => CSG.union(acc, polysOf(e)), polysOf(A.filter(isSolid)[0])); res = B.reduce((acc, e) => CSG.subtract(acc, polysOf(e)), base); }
    const d = doc(); d.begin(kind.toUpperCase());
    const first = A[0];
    for (const e of [...A.filter(isSolid), ...(B || [])]) d.remove(e);
    if (res.length) d.add({ type: '3DSOLID', kind: 'mesh', polys: CSG.polysToList(res), layer: first.layer, color: first.color });
    else c.print('Null solid created - deleted.');
    d.end(); redraw();
  };
  // solo regiones: booleana 2D (polygon-clipping) por parejas
  const regionFallback = (kind) => async (c, A) => {
    let B = [];
    if (kind === 'subtract') { B = await c.select('Select solids, surfaces, and regions to subtract ..', { filter: (e) => e.type === 'REGION' && !A.includes(e) }); if (!B.length) return; }
    else if (A.length < 2) { c.print('At least 2 regions are required.'); return; }
    const toReg = (mp) => ({ loops: mp.flatMap((poly) => poly.map((ring) => ring.slice(0, -1).map(([x, y]) => ({ x, y, b: 0 })))) });
    let reg = A[0], mp = null;
    for (const a of A.slice(1)) { mp = await app.regionBoolean(kind === 'intersect' ? 'intersect' : 'union', reg, a); reg = toReg(mp); }
    for (const b of B) { mp = await app.regionBoolean('subtract', reg, b); reg = toReg(mp); }
    const d = doc(); d.begin(kind.toUpperCase());
    for (const e of [...A, ...B]) d.remove(e);
    for (const poly of mp || []) d.add({ type: 'REGION', loops: poly.map((ring) => ring.slice(0, -1).map(([x, y]) => ({ x, y, b: 0 }))), layer: A[0].layer, color: A[0].color });
    d.end(); if (!mp?.length) c.print('Null region created - deleted.'); redraw();
  };
  R('UNION', solidOp('union', regionFallback('union')), { alias: ['UNI'] });
  R('SUBTRACT', solidOp('subtract', regionFallback('subtract')), { alias: ['SU'] });
  R('INTERSECT', solidOp('intersect', regionFallback('intersect')));
  app.solidBoolean = (kind, a, b) => { const r = kind === 'union' ? CSG.union(polysOf(a), polysOf(b)) : kind === 'intersect' ? CSG.intersect(polysOf(a), polysOf(b)) : CSG.subtract(polysOf(a), polysOf(b)); return { type: '3DSOLID', kind: 'mesh', polys: CSG.polysToList(r) }; };

  // ======================= SECCIÓN DE NUBE DE PUNTOS =======================
  R('POINTCLOUDSECTION', async (c) => {
    const r = need(await c.entsel('Select point cloud:', { filter: (e) => e.type === 'POINTCLOUD' }));
    const e = r.e, d = doc(), cl = cloudData(d, e.cloud); if (!cl) return;
    const a = need(await c.getPoint('Specify start point of section line:'));
    const b = need(await c.getPoint('Specify end point of section line:', { base: a }));
    const tol = need(await c.getDist('Specify section thickness <0.5>:', { def: 0.5, base: b }));
    const ins = need(await c.getPoint('Specify insertion point for profile:'));
    const L = G.dist(a, b), u = G.norm(G.sub(b, a)), n = { x: -u.y, y: u.x }, s = e.sc || 1, o = e.p || { x: 0, y: 0 };
    const xyz = [], rgb = cl.rgb ? [] : null, bins = new Map(), bw = Math.max(tol, L / 400);
    for (let i = 0; i < cl.n; i++) {
      const p = { x: o.x + (cl.xyz[i * 3] + cl.ox) * s, y: o.y + (cl.xyz[i * 3 + 1] + cl.oy) * s }, z = cl.xyz[i * 3 + 2] + cl.oz;
      const q = G.sub(p, a), t = G.dot(q, u), dd = Math.abs(G.dot(q, n));
      if (t < 0 || t > L || dd > tol / 2) continue;
      xyz.push(ins.x + t, ins.y + z, 0); if (rgb) rgb.push(cl.rgb[i * 3], cl.rgb[i * 3 + 1], cl.rgb[i * 3 + 2]);
      const k = Math.floor(t / bw); const bv = bins.get(k); if (!bv || z > bv.z) bins.set(k, { t, z });
    }
    if (!xyz.length) { c.print('No points within the section.'); return; }
    const prof = [...bins.entries()].sort((x, y) => x[0] - y[0]).map(([, v]) => ({ x: ins.x + v.t, y: ins.y + v.z, b: 0 }));
    d.begin('POINTCLOUDSECTION'); d.touchTables();
    const id = 'seccion_' + Math.random().toString(36).slice(2, 7);
    d.ext.clouds[id] = buildCloud('Sección ' + (cl.src?.name || ''), xyz, rgb);
    d.add({ type: 'POINTCLOUD', cloud: id, p: { x: 0, y: 0 }, sc: 1, psize: 2 });
    if (prof.length > 1) d.add({ type: 'LWPOLYLINE', pts: prof, closed: false });
    d.add({ type: 'LINE', p1: { x: ins.x, y: ins.y }, p2: { x: ins.x + L, y: ins.y } });
    d.end(); c.print(`${xyz.length / 3} point(s) in section.`); redraw();
  }, { alias: ['PCSECTION'] });
}
