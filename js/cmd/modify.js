// Comandos de modificación y consulta
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { curveSegs, paramOf, cutParams, removeInterval, pointAt } from './curves.js';
const { M } = G;
const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, fn, o) => eng.register(n, fn, o);
  const ghost = (ents, m) => ents.map((e) => { const c = E.cloneEnt(e); E.transformEnt(c, m); c._ghost = false; return c; });
  const baseDisp = async (c, ents, verb) => {
    const b = need(await c.getPoint(`Specify base point or [Displacement] <Displacement>:`, { def: 'Displacement' }));
    if (b === 'Displacement') { const d = need(await c.getPoint('Specify displacement <0.0000, 0.0000, 0.0000>:')); return { base: { x: 0, y: 0 }, to: d, disp: true }; }
    void verb; return { base: b };
  };

  R('ERASE', async (c) => {
    const s = await c.select();
    c.lastErased = s.map((e) => ({ e, arr: doc().ownerOf(e) }));
    for (const e of s) doc().remove(e);
  }, { alias: ['DELETE'] });
  R('OOPS', async (c) => { for (const { e, arr } of c.lastErased || []) if (arr && !arr.includes(e)) doc().add(e, arr); c.lastErased = []; });

  R('MOVE', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const bd = await baseDisp(c, s);
    let to = bd.to;
    if (!to) to = need(await c.getPoint('Specify second point or <use first point as displacement>:', { base: bd.base, preview: (q) => ghost(s, M.tr(q.x - bd.base.x, q.y - bd.base.y)) }));
    if (!isPt(to)) to = bd.base, bd.base = { x: 0, y: 0 };
    const m = M.tr(to.x - bd.base.x, to.y - bd.base.y);
    for (const e of s) { doc().touch(e); E.transformEnt(e, m); }
  });

  R('COPY', async (c) => {
    const s = await c.select(); if (!s.length) return;
    c.print('Current settings:  Copy mode = Multiple');
    const bd = await baseDisp(c, s);
    if (bd.disp) { const m = M.tr(bd.to.x, bd.to.y); for (const e of s) doc().add(E.transformEnt(E.cloneEnt(e), m)); return; }
    for (;;) {
      const to = await c.getPoint('Specify second point or [Array] <exit>:', { base: bd.base, preview: (q) => ghost(s, M.tr(q.x - bd.base.x, q.y - bd.base.y)) });
      if (to == null) return;
      if (to === 'Array') {
        const n = need(await c.getInt('Enter number of items to array:', { positive: true }));
        const q = need(await c.getPoint('Specify second point or [Fit]:', { base: bd.base }));
        if (!isPt(q)) return;
        for (let i = 1; i < n; i++) { const m = M.tr((q.x - bd.base.x) * i, (q.y - bd.base.y) * i); for (const e of s) doc().add(E.transformEnt(E.cloneEnt(e), m)); }
        return;
      }
      const m = M.tr(to.x - bd.base.x, to.y - bd.base.y);
      for (const e of s) doc().add(E.transformEnt(E.cloneEnt(e), m));
      app.view.redraw();
    }
  });

  R('ROTATE', async (c) => {
    const s = await c.select(); if (!s.length) return;
    c.print('Current positive angle in UCS:  ANGDIR=counterclockwise  ANGBASE=0');
    const b = need(await c.getPoint('Specify base point:'));
    let copy = false, ref = 0;
    for (;;) {
      const a = need(await c.getAngle(`Specify rotation angle or [Copy/Reference] <${F(G.deg(c._lastRot || 0))}>:`, { base: b, def: c._lastRot || 0, preview: (q) => ghost(s, M.rot(G.ang(b, q) - ref, b)) }));
      if (a === 'Copy') { copy = true; c.print('Rotating a copy of the selected objects.'); continue; }
      if (a === 'Reference') {
        ref = need(await c.getAngle('Specify the reference angle <0>:', { def: 0 }));
        const na = need(await c.getAngle('Specify the new angle or [Points] <0>:', { base: b, def: 0, preview: (q) => ghost(s, M.rot(G.ang(b, q) - ref, b)) }));
        return apply(na - ref);
      }
      return apply(a);
    }
    function apply(a) { c._lastRot = a; const m = M.rot(a, b); for (const e of s) { if (copy) doc().add(E.transformEnt(E.cloneEnt(e), m)); else { doc().touch(e); E.transformEnt(e, m); } } }
  });

  R('SCALE', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const b = need(await c.getPoint('Specify base point:'));
    let copy = false;
    for (;;) {
      const k = need(await c.getDist('Specify scale factor or [Copy/Reference]:', { base: b, preview: (q) => { const d = G.dist(b, q); return d > 1e-9 ? ghost(s, M.scale(d, b)) : null; } }));
      if (k === 'Copy') { copy = true; continue; }
      let f = k;
      if (k === 'Reference') {
        const r1 = need(await c.getDist('Specify reference length <1.0000>:', { def: 1 }));
        const r2 = need(await c.getDist('Specify new length or [Points] <1.0000>:', { base: b, def: 1 }));
        f = r2 / r1;
      }
      if (!(f > 0)) { c.print('Value must be positive and nonzero.'); continue; }
      const m = M.scale(f, b);
      for (const e of s) { if (copy) doc().add(E.transformEnt(E.cloneEnt(e), m)); else { doc().touch(e); E.transformEnt(e, m); } }
      return;
    }
  });

  R('MIRROR', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const a = need(await c.getPoint('Specify first point of mirror line:'));
    const b = need(await c.getPoint('Specify second point of mirror line:', { base: a, preview: (q) => (G.dist(a, q) > 1e-9 ? ghost(s, M.mirror(a, q)) : null) }));
    const del = (await c.getKw('Erase source objects? [Yes/No] <No>:', 'No')) === 'Yes';
    const m = M.mirror(a, b), o = { mirrtext: doc().vars.MIRRTEXT };
    for (const e of s) { if (del) { doc().touch(e); E.transformEnt(e, m, o); } else doc().add(E.transformEnt(E.cloneEnt(e), m, o)); }
  });

  R('OFFSET', async (c) => {
    c.print(`Current settings: Erase source=${c._offErase ? 'Yes' : 'No'}  Layer=Source  OFFSETGAPTYPE=0`);
    let d = doc().vars.OFFSETDIST;
    for (;;) {
      const r = need(await c.getDist(`Specify offset distance or [Through/Erase/Layer] <${d < 0 ? 'Through' : F(d)}>:`, { def: d < 0 ? 'Through' : d }));
      if (r === 'Erase') { c._offErase = (await c.getKw('Erase source object after offsetting? [Yes/No] <No>:', 'No')) === 'Yes'; continue; }
      if (r === 'Layer') { await c.getKw('Enter layer option for offset objects [Current/Source] <Source>:', 'Source'); continue; }
      d = r === 'Through' ? -1 : r; doc().setvar('OFFSETDIST', d); break;
    }
    for (;;) {
      const s = await c.entsel('Select object to offset or [Exit/Undo] <Exit>:', { filter: (e) => ['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'ELLIPSE', 'SPLINE', 'XLINE', 'RAY'].includes(e.type) });
      if (!s || s === 'Exit') return;
      if (s === 'Undo') { doc().undo(); continue; }
      const e = s.e;
      let res;
      if (d < 0) {
        const tp = need(await c.getPoint('Specify through point or [Exit/Multiple/Undo] <Exit>:'));
        if (!isPt(tp)) return;
        const dd = E.prims(e, doc()).reduce((m_, p) => Math.min(m_, G.primDist(p, tp)), Infinity);
        res = E.offsetEnt(e, dd, tp);
      } else {
        const side = need(await c.getPoint('Specify point on side to offset or [Exit/Multiple/Undo] <Exit>:', { preview: (q) => { const o = E.offsetEnt(e, d, q); return o ? [o] : null; } }));
        if (!isPt(side)) return;
        res = E.offsetEnt(e, d, side);
      }
      if (res) { delete res.hid; doc().add(res); if (c._offErase) doc().remove(e); } else c.print('Cannot offset that object.');
      app.view.redraw();
    }
  });

  // ---------------- TRIM / EXTEND
  const cuttersFor = (exclude, edges) => {
    const out = [];
    for (const e of edges || doc().space) {
      if (e === exclude || !doc().isVisible(e)) continue;
      if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'POINT') continue;
      for (const p of E.prims(e, doc())) out.push(p);
    }
    return out;
  };
  const trimAt = (e, p, edges) => {
    const cv = curveSegs(e); if (!cv) return false;
    const cutters = cuttersFor(e, edges);
    if (e.type === 'LWPOLYLINE') { /* auto-intersecciones ignoradas */ }
    const cuts = cutParams(cv, cutters);
    const tp = paramOf(cv, p);
    const pieces = removeInterval(e, cv, cuts, tp);
    if (pieces == null) return false;
    if (!pieces.length && !c_quick) return false;
    const arr = doc().ownerOf(e);
    doc().remove(e);
    for (const x of pieces) doc().add(x, arr);
    return true;
  };
  let c_quick = true;
  const extendAt = (e, p, edges) => {
    const cutters = cuttersFor(e, edges);
    if (e.type === 'LINE' || (e.type === 'LWPOLYLINE' && !e.closed)) {
      let a, b, setEnd;
      if (e.type === 'LINE') {
        const atEnd = G.dist(p, e.p2) < G.dist(p, e.p1);
        a = atEnd ? e.p1 : e.p2; b = atEnd ? e.p2 : e.p1;
        setEnd = (q) => { if (atEnd) e.p2 = q; else e.p1 = q; };
      } else {
        const n = e.pts.length, atEnd = G.dist(p, e.pts[n - 1]) < G.dist(p, e.pts[0]);
        const i0 = atEnd ? n - 2 : 1, i1 = atEnd ? n - 1 : 0;
        if ((atEnd ? e.pts[n - 2].b : e.pts[0].b)) { c.print?.('Arc segment extension not supported.'); return false; }
        a = e.pts[i0]; b = e.pts[i1];
        setEnd = (q) => { e.pts[i1] = { ...e.pts[i1], x: q.x, y: q.y }; };
      }
      const far = G.add(b, G.mul(G.norm(G.sub(b, a)), 1e7));
      let best = null, bd = Infinity;
      for (const cp of cutters) for (const x of G.primInter({ k: 'L', a: b, b: far }, cp)) { const d = G.dist(b, x); if (d > 1e-9 && d < bd) { bd = d; best = x; } }
      if (!best) return false;
      doc().touch(e); setEnd(best); E.invalidate(e); return true;
    }
    if (e.type === 'ARC') {
      const atEnd = G.dist(p, G.polar(e.c, e.a2, e.r)) < G.dist(p, G.polar(e.c, e.a1, e.r));
      const full = { k: 'A', c: e.c, r: e.r, a1: 0, a2: G.TAU, full: true };
      let best = null, bd = Infinity; const gap = G.TAU - G.arcSweep(e.a1, e.a2);
      for (const cp of cutters) for (const x of G.primInter(full, cp)) {
        const a = G.ang(e.c, x);
        const d = atEnd ? G.normA(a - e.a2) : G.normA(e.a1 - a);
        if (d > 1e-9 && d < gap && d < bd) { bd = d; best = a; }
      }
      if (best == null) return false;
      doc().touch(e); if (atEnd) e.a2 = best; else e.a1 = best; E.invalidate(e); return true;
    }
    return false;
  };
  const trimExtend = (isTrim) => async (c) => {
    c.print(`Current settings: Projection=UCS, Edge=None, Mode=${c_quick ? 'Quick' : 'Standard'}`);
    let edges = null;
    if (!c_quick) { c.print('Select cutting edges ...'); edges = await c.select('Select objects or <select all>:', { noPickfirst: true }); if (!edges.length) edges = null; }
    for (;;) {
      const verb = isTrim ? 'trim or shift-select to extend' : 'extend or shift-select to trim';
      const r = await c.entsel(`Select object to ${verb} or [cuTting edges/Fence/Crossing/mOde/Project/eRase${isTrim ? '' : '/Undo'}]:`);
      if (r == null) return;
      if (r === 'mOde') { const m = await c.getKw(`Enter a ${isTrim ? 'trim' : 'extend'} mode option [Quick/Standard] <${c_quick ? 'Quick' : 'Standard'}>:`, c_quick ? 'Quick' : 'Standard'); c_quick = m !== 'Standard'; if (!c_quick) { edges = await c.select('Select cutting edges:', { noPickfirst: true }); } continue; }
      if (r === 'cuTting edges') { edges = await c.select('Select cutting edges:', { noPickfirst: true }); if (!edges.length) edges = null; continue; }
      if (r === 'eRase') { const s = await c.select('Select objects to erase or <exit>:', { noPickfirst: true }); for (const e of s) doc().remove(e); continue; }
      if (r === 'Undo') { doc().undo(); continue; }
      if (r === 'Fence' || r === 'Crossing') {
        const pts = [];
        if (r === 'Crossing') { const p1 = need(await c.getPoint('Specify first corner:')); const p2 = need(await c.getCorner('Specify opposite corner:', p1)); const found = c.windowSelect(p1, p2, true); for (const e of found) { const cv = curveSegs(e); if (!cv) continue; const ctr = G.mid(p1, p2); const near = cv.segs.map((s) => G.primNearest(s, ctr)).sort((a, b) => G.dist(a, ctr) - G.dist(b, ctr))[0]; if (near) (isTrim ? trimAt : extendAt)(e, near, edges); } app.view.redraw(); continue; }
        for (;;) { const p = await c.getPoint(pts.length ? 'Specify next fence point or [Undo]:' : 'Specify first fence point:', { base: pts[pts.length - 1] }); if (!isPt(p)) break; pts.push(p); }
        const fence = []; for (let i = 0; i < pts.length - 1; i++) fence.push({ k: 'L', a: pts[i], b: pts[i + 1] });
        for (const e of [...doc().space]) {
          if (!doc().isVisible(e)) continue;
          const hits = []; for (const pr of E.prims(e, doc())) for (const f of fence) hits.push(...G.primInter(pr, f));
          for (const h of hits) { const cur = doc().space.includes(e) ? e : null; if (cur) (isTrim ? trimAt : extendAt)(cur, h, edges); }
        }
        app.view.redraw(); continue;
      }
      if (typeof r !== 'object') continue;
      const shift = app.view.lastShift;
      const doTrim = isTrim !== !!shift;
      const ok = doTrim ? trimAt(r.e, r.p, edges) : extendAt(r.e, r.p, edges);
      if (!ok) c.print(doTrim ? 'Object does not intersect an edge.' : 'Object does not intersect an edge.');
      app.view.redraw();
    }
  };
  R('TRIM', trimExtend(true), { pickfirst: false });
  R('EXTEND', trimExtend(false), { pickfirst: false });

  // ---------------- BREAK
  R('BREAK', async (c) => {
    const s = need(await c.entsel('Select object:', { filter: (e) => !!curveSegs(e) }));
    let p1 = s.p;
    const p2r = need(await c.getPoint('Specify second break point or [First point]:'));
    let p2 = p2r;
    if (p2r === 'First point') { p1 = need(await c.getPoint('Specify first break point:')); p2 = need(await c.getPoint('Specify second break point:')); }
    if (!isPt(p2)) return;
    breakObj(s.e, p1, p2);
  });
  R('BREAKATPOINT', async (c) => {
    const s = need(await c.entsel('Select object:', { filter: (e) => !!curveSegs(e) }));
    const p = need(await c.getPoint('Specify break point:'));
    breakObj(s.e, p, p);
  });
  const breakObj = (e, p1, p2) => {
    const cv = curveSegs(e);
    let t1 = paramOf(cv, p1), t2 = paramOf(cv, p2);
    if (Math.abs(t1 - t2) < 1e-9 && !cv.periodic) {
      const arr = doc().ownerOf(e);
      const a = removeInterval(e, cv, [], t1, t1 + 1e-12);
      doc().remove(e); for (const x of a) doc().add(x, arr); return;
    }
    if (e.type === 'CIRCLE') { // sentido antihorario de p1 a p2 se elimina
      const arr = doc().ownerOf(e); doc().remove(e);
      doc().add({ type: 'ARC', layer: e.layer, color: e.color, ltype: e.ltype, lw: e.lw, c: e.c, r: e.r, a1: G.ang(e.c, p2), a2: G.ang(e.c, p1) }, arr); return;
    }
    const arr = doc().ownerOf(e);
    const pieces = removeInterval(e, cv, [], t1, t2);
    doc().remove(e); for (const x of pieces) doc().add(x, arr);
  };

  // ---------------- FILLET / CHAMFER
  const lineLike = (e) => e.type === 'LINE';
  const corner = async (c, isFillet) => {
    const v = doc().vars;
    for (;;) {
      if (isFillet) c.print(`Current settings: Mode = TRIM, Radius = ${F(v.FILLETRAD)}`);
      else c.print(`("TRIM" mode) Current chamfer Dist1 = ${F(v.CHAMFERA)}, Dist2 = ${F(v.CHAMFERB)}`);
      const s1 = need(await c.entsel(isFillet ? 'Select first object or [Undo/Polyline/Radius/Trim/Multiple]:' : 'Select first line or [Undo/Polyline/Distance/Angle/Trim/mEthod/Multiple]:'));
      if (s1 === 'Radius') { v.FILLETRAD = need(await c.getDist(`Specify fillet radius <${F(v.FILLETRAD)}>:`, { def: v.FILLETRAD })); continue; }
      if (s1 === 'Distance') { v.CHAMFERA = need(await c.getDist(`Specify first chamfer distance <${F(v.CHAMFERA)}>:`, { def: v.CHAMFERA })); v.CHAMFERB = need(await c.getDist(`Specify second chamfer distance <${F(v.CHAMFERA)}>:`, { def: v.CHAMFERA })); continue; }
      if (s1 === 'Undo') { doc().undo(); continue; }
      if (s1 === 'Trim' || s1 === 'Multiple' || s1 === 'Angle' || s1 === 'mEthod') continue;
      if (s1 === 'Polyline') {
        const ps = need(await c.entsel('Select 2D polyline:', { filter: (e) => e.type === 'LWPOLYLINE' }));
        polyCorners(ps.e, isFillet); return;
      }
      if (typeof s1 !== 'object') continue;
      const s2 = need(await c.entsel(isFillet ? 'Select second object or shift-select to apply corner or [Radius]:' : 'Select second line or shift-select to apply corner or [Distance/Angle/Method]:'));
      if (typeof s2 !== 'object') continue;
      if (lineLike(s1.e) && lineLike(s2.e)) { cornerLines(s1, s2, isFillet, app.view.lastShift); return; }
      if (s1.e === s2.e && s1.e.type === 'LWPOLYLINE') { polyCorners(s1.e, isFillet); return; }
      if (isFillet && ((s1.e.type === 'ARC' || s1.e.type === 'CIRCLE' || lineLike(s1.e)) && (s2.e.type === 'ARC' || s2.e.type === 'CIRCLE' || lineLike(s2.e)))) { filletGeneric(s1, s2); return; }
      c.print('Cannot ' + (isFillet ? 'fillet' : 'chamfer') + ' those objects.'); return;
    }
  };
  const cornerLines = (s1, s2, isFillet, shift) => {
    const v = doc().vars, L1 = s1.e, L2 = s2.e;
    const X = G.llInter(L1.p1, L1.p2, L2.p1, L2.p2, true, true)[0];
    if (!X) { app.log('Lines are parallel.'); return; }
    const keep = (L, pick) => { const d1 = G.dot(G.sub(L.p1, X), G.sub(pick, X)), d2 = G.dot(G.sub(L.p2, X), G.sub(pick, X)); return Math.abs(d1) >= Math.abs(d2) ? (d1 >= 0 ? 'p1' : 'p2') : (d2 >= 0 ? 'p2' : 'p1'); };
    const k1 = keep(L1, s1.p), k2 = keep(L2, s2.p);
    const u1 = G.norm(G.sub(L1[k1], X)), u2 = G.norm(G.sub(L2[k2], X));
    const o1 = k1 === 'p1' ? 'p2' : 'p1', o2 = k2 === 'p1' ? 'p2' : 'p1';
    const r = shift ? 0 : isFillet ? v.FILLETRAD : 0;
    if (isFillet && r > 0) {
      const th = Math.acos(Math.max(-1, Math.min(1, G.dot(u1, u2)))) / 2;
      const d = r / Math.tan(th), T1 = G.add(X, G.mul(u1, d)), T2 = G.add(X, G.mul(u2, d));
      const cc = G.add(X, G.mul(G.norm(G.add(u1, u2)), r / Math.sin(th)));
      doc().touch(L1); L1[o1] = T1; doc().touch(L2); L2[o2] = T2; E.invalidate(L1); E.invalidate(L2);
      let a1 = G.ang(cc, T1), a2 = G.ang(cc, T2);
      if (G.arcSweep(a1, a2) > Math.PI) [a1, a2] = [a2, a1];
      doc().add({ type: 'ARC', c: cc, r, a1, a2, layer: L1.layer, color: L1.color, ltype: L1.ltype });
    } else if (!isFillet && !shift && (v.CHAMFERA > 0 || v.CHAMFERB > 0)) {
      const T1 = G.add(X, G.mul(u1, v.CHAMFERA)), T2 = G.add(X, G.mul(u2, v.CHAMFERB));
      doc().touch(L1); L1[o1] = T1; doc().touch(L2); L2[o2] = T2; E.invalidate(L1); E.invalidate(L2);
      doc().add({ type: 'LINE', p1: T1, p2: T2, layer: L1.layer, color: L1.color, ltype: L1.ltype });
    } else {
      doc().touch(L1); L1[o1] = X; doc().touch(L2); L2[o2] = X; E.invalidate(L1); E.invalidate(L2);
    }
  };
  const filletGeneric = (s1, s2) => {
    const r = doc().vars.FILLETRAD; if (!(r > 0)) { app.log('Radius must be > 0 for arcs.'); return; }
    const off = (s) => { const p = E.prims(s.e, doc())[0]; if (p.k === 'L') { const n = G.perp(G.norm(G.sub(p.b, p.a))); const sg = 1; return [1, -1].map((k) => ({ k: 'L', a: G.add(p.a, G.mul(n, r * k * sg)), b: G.add(p.b, G.mul(n, r * k)) })); } return [{ k: 'A', c: p.c, r: p.r + r, a1: 0, a2: G.TAU, full: true }, ...(p.r > r ? [{ k: 'A', c: p.c, r: p.r - r, a1: 0, a2: G.TAU, full: true }] : [])]; };
    let best = null, bd = Infinity;
    for (const a of off(s1)) for (const b of off(s2)) for (const x of G.primInter(a, b, true, true)) { const d = G.dist(x, s1.p) + G.dist(x, s2.p); if (d < bd) { bd = d; best = x; } }
    if (!best) { app.log('Radius is too large.'); return; }
    const t1 = G.primPerp(E.prims(s1.e, doc())[0], best), t2 = G.primPerp(E.prims(s2.e, doc())[0], best);
    let a1 = G.ang(best, t1), a2 = G.ang(best, t2); if (G.arcSweep(a1, a2) > Math.PI) [a1, a2] = [a2, a1];
    doc().add({ type: 'ARC', c: best, r, a1, a2, layer: s1.e.layer });
    for (const [s, t] of [[s1, t1], [s2, t2]]) {
      const e = s.e;
      if (e.type === 'LINE') { doc().touch(e); if (G.dist(e.p1, t) < G.dist(e.p2, t)) e.p1 = t; else e.p2 = t; E.invalidate(e); }
      else if (e.type === 'ARC') { doc().touch(e); const a = G.ang(e.c, t); const keepStart = G.angIn(G.ang(e.c, s.p), e.a1, a); if (keepStart) e.a2 = a; else e.a1 = a; E.invalidate(e); }
    }
  };
  const polyCorners = (e, isFillet) => {
    const v = doc().vars, r = v.FILLETRAD, n = e.pts.length;
    const out = [];
    let count = 0;
    for (let i = 0; i < n; i++) {
      const p = e.pts[i];
      const hasPrev = e.closed || i > 0, hasNext = e.closed || i < n - 1;
      const prev = e.pts[(i - 1 + n) % n], next = e.pts[(i + 1) % n];
      if (!hasPrev || !hasNext || prev.b || p.b) { out.push({ ...p }); continue; }
      const u1 = G.norm(G.sub(prev, p)), u2 = G.norm(G.sub(next, p));
      const th = Math.acos(Math.max(-1, Math.min(1, G.dot(u1, u2)))) / 2;
      if (th < 1e-6 || Math.abs(th - Math.PI / 2) < 1e-9) { out.push({ ...p }); continue; }
      const d = isFillet ? r / Math.tan(th) : v.CHAMFERA;
      const d2 = isFillet ? d : v.CHAMFERB;
      if (d > G.dist(prev, p) / 2 + 1e-9 || d2 > G.dist(next, p) / 2 + 1e-9 || d <= 0) { out.push({ ...p }); continue; }
      const T1 = G.add(p, G.mul(u1, d)), T2 = G.add(p, G.mul(u2, d2));
      let b = 0;
      if (isFillet) { const sw = Math.PI - 2 * th; b = Math.tan(sw / 4) * (G.cross(G.sub(p, prev), G.sub(next, p)) > 0 ? 1 : -1); }
      out.push({ x: T1.x, y: T1.y, b }, { x: T2.x, y: T2.y, b: 0 });
      count++;
    }
    doc().touch(e); e.pts = out; E.invalidate(e);
    app.log(`${count} lines were ${isFillet ? 'filleted' : 'chamfered'}`);
  };
  R('FILLET', (c) => corner(c, true));
  R('CHAMFER', (c) => corner(c, false));

  // ---------------- ARRAY (asociativa por defecto: ARRAYASSOCIATIVITY = 1)
  // Una matriz asociativa es una referencia a un bloque anónimo *A con los parámetros en e.arr;
  // ARRAYEDIT o la paleta Propiedades cambian los parámetros y se regenera.
  const arrayMats = (a) => {
    const mats = [], ref = a.ref || { x: 0, y: 0 };
    if (a.kind === 'rect') { for (let i = 0; i < a.rows; i++) for (let j = 0; j < a.cols; j++) mats.push(M.tr(j * a.dx, i * a.dy)); }
    else if (a.kind === 'polar') {
      const full = Math.abs(Math.abs(a.fill) - G.TAU) < 1e-9, step = full ? a.fill / a.n : a.fill / Math.max(1, a.n - 1);
      for (let i = 0; i < a.n; i++) { const ang = step * i; if (a.rot) mats.push(M.rot(ang, a.c)); else { const q = G.rotate(ref, a.c, ang); mats.push(M.tr(q.x - ref.x, q.y - ref.y)); } }
    } else if (a.kind === 'path') {
      const L = E.entLength({ type: 'LWPOLYLINE', pts: a.path.map((p) => ({ ...p, b: 0 })) }) || 1, a0 = E.pointAtLength(a.path, 0).a;
      for (let i = 0; i < a.n; i++) { const { p, a: ang } = E.pointAtLength(a.path, a.n > 1 ? L * i / (a.n - 1) : 0); let m = M.tr(p.x - ref.x, p.y - ref.y); if (a.align) m = M.mul(M.rot(ang - a0, p), m); mats.push(m); }
    }
    return mats;
  };
  const rebuildArray = (ins, d = doc()) => {
    const a = ins.arr, blk = d.blocks[ins.name]; if (!a || !blk) return;
    blk.ents = []; let k = 0;
    for (const m of arrayMats(a)) for (const e of a.src) blk.ents.push({ ...E.transformEnt(E.cloneEnt(e), m), bid: k++ });
    blk._ver = (blk._ver || 0) + 1; E.invalidate(ins);
  };
  app.rebuildArray = rebuildArray;
  const arrayCmd = async (c, forced, classic = false) => {
    const s = await c.select(); if (!s.length) return;
    const t = forced || (await c.getKw('Enter array type [Rectangular/PAth/POlar] <Rectangular>:', 'Rectangular')) || 'Rectangular';
    const bb = doc().extents(s), ref = { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 };
    let a;
    if (t === 'Rectangular') {
      const rows = need(await c.getInt('Enter the number of rows (---) <1>:', { def: 1, positive: true }));
      const cols = need(await c.getInt('Enter the number of columns (|||) <1>:', { def: 1, positive: true }));
      let dy = 0, dx = 0;
      if (rows > 1) dy = need(await c.getDist('Enter the distance between rows or specify unit cell (---):'));
      if (cols > 1) dx = need(await c.getDist('Specify the distance between columns (|||):'));
      a = { kind: 'rect', rows, cols, dx, dy };
    } else if (t === 'POlar') {
      const cc = need(await c.getPoint('Specify center point of array or [Base point/Axis of rotation]:'));
      const n = need(await c.getInt('Enter the number of items in the array:', { positive: true }));
      const fill = need(await c.getAngle('Specify the angle to fill (+=ccw, -=cw) <360>:', { def: G.TAU }));
      const rot = (await c.getKw('Rotate arrayed objects? [Yes/No] <Y>:', 'Yes')) !== 'No';
      a = { kind: 'polar', c: { x: cc.x, y: cc.y }, n, fill, rot, ref };
    } else {
      const ps = need(await c.entsel('Select path curve:', { filter: (e) => !!curveSegs(e) }));
      const n = need(await c.getInt('Enter number of items along path:', { positive: true }));
      const align = (await c.getKw('Align arrayed items to path? [Yes/No] <Yes>:', 'Yes')) !== 'No';
      a = { kind: 'path', path: E.curvePoints(ps.e).map((p) => ({ x: p.x, y: p.y })), n, align, ref };
    }
    const d = doc();
    const isId = (m) => { const p0 = G.M.apply(m, { x: 0, y: 0 }), p1 = G.M.apply(m, { x: 1, y: 1 }); return G.dist(p0, { x: 0, y: 0 }) < 1e-9 && G.dist(p1, { x: 1, y: 1 }) < 1e-9; };
    if (classic || !d.vars.ARRAYASSOCIATIVITY) { for (const m of arrayMats(a)) { if (isId(m)) continue; for (const e of s) d.add(E.transformEnt(E.cloneEnt(e), m)); } return; }
    let k = 1; while (d.blocks[`*A${k}`]) k++;
    const name = `*A${k}`;
    d.touchTables();
    d.blocks[name] = { name, base: { x: 0, y: 0 }, ents: [], params: [], _ver: 1 };
    const ins = { type: 'INSERT', name, p: { x: 0, y: 0 }, sx: 1, sy: 1, rot: 0, layer: s[0].layer, color: 256, arr: { ...a, src: s.map((e) => E.cloneEnt(e)) } };
    for (const e of s) d.remove(e);
    rebuildArray(ins, d);
    d.add(ins);
    c.sel = [];
  };
  R('ARRAY', (c) => arrayCmd(c), { alias: ['ARRAYCLASSIC'] });
  R('-ARRAY', (c) => arrayCmd(c, null, true));
  R('ARRAYRECT', (c) => arrayCmd(c, 'Rectangular'));
  R('ARRAYPOLAR', (c) => arrayCmd(c, 'POlar'));
  R('ARRAYPATH', (c) => arrayCmd(c, 'PAth'));
  R('ARRAYEDIT', async (c) => {
    const r = need(await c.entsel('Select array:', { filter: (e) => e.type === 'INSERT' && !!e.arr }));
    const ins = r.e, a = ins.arr;
    const opt = await c.getKw(a.kind === 'rect' ? 'Enter an option [COUnt/Spacing/eXit] <eXit>:' : 'Enter an option [Items/Fill angle/ROTate items/eXit] <eXit>:', 'eXit');
    const d = doc(); d.begin('ARRAYEDIT'); d.touch(ins); d.touchTables();
    if (opt === 'COUnt') { a.cols = need(await c.getInt(`Enter the number of columns (|||) <${a.cols}>:`, { def: a.cols, positive: true })); a.rows = need(await c.getInt(`Enter the number of rows (---) <${a.rows}>:`, { def: a.rows, positive: true })); }
    else if (opt === 'Spacing') { a.dx = need(await c.getDist(`Specify the distance between columns (|||) <${F(a.dx)}>:`, { def: a.dx })); a.dy = need(await c.getDist(`Enter the distance between rows or specify unit cell (---) <${F(a.dy)}>:`, { def: a.dy })); }
    else if (opt === 'Items') a.n = need(await c.getInt(`Enter the number of items in the array <${a.n}>:`, { def: a.n, positive: true }));
    else if (opt === 'Fill angle') a.fill = need(await c.getAngle(`Specify the angle to fill (+=ccw, -=cw) <${F(G.deg(a.fill), 2)}>:`, { def: a.fill }));
    else if (opt === 'ROTate items') a.rot = (await c.getKw('Rotate arrayed objects? [Yes/No] <Y>:', 'Yes')) !== 'No';
    rebuildArray(ins, d); d.end();
  });

  // ---------------- STRETCH
  R('STRETCH', async (c) => {
    c.print('Select objects to stretch by crossing-window or crossing-polygon...');
    const p1 = need(await c.getPoint('Specify first corner:'));
    const p2 = need(await c.getCorner('Specify opposite corner:', p1));
    const fr = { x1: Math.min(p1.x, p2.x), y1: Math.min(p1.y, p2.y), x2: Math.max(p1.x, p2.x), y2: Math.max(p1.y, p2.y) };
    const s = c.windowSelect(p1, p2, true).filter((e) => c.selectable(e));
    c.print(`${s.length} found`);
    if (!s.length) return;
    const bd = await baseDisp(c, s);
    const apply = (e, d) => stretchEnt(e, fr, d, doc());
    let to = bd.to;
    if (!to) to = need(await c.getPoint('Specify second point or <use first point as displacement>:', { base: bd.base, preview: (q) => s.map((e) => { const x = E.cloneEnt(e); apply(x, G.sub(q, bd.base)); return x; }) }));
    if (!isPt(to)) return;
    const d = G.sub(to, bd.base);
    for (const e of s) { doc().touch(e); apply(e, d); }
  });

  // ---------------- JOIN
  R('JOIN', async (c) => {
    const s = await c.select('Select source object or multiple objects to join at once:', { filter: (e) => ['LINE', 'ARC', 'LWPOLYLINE'].includes(e.type) });
    if (s.length < 1) return;
    const res = joinEnts(s);
    if (!res) { c.print('0 objects joined'); return; }
    const arr = doc().ownerOf(s[0]);
    for (const e of res.used) doc().remove(e);
    for (const e of res.out) doc().add(e, arr);
    c.print(`${res.used.length} objects converted to ${res.out.length} polyline${res.out.length > 1 ? 's' : ''}`);
  });

  // ---------------- LENGTHEN
  R('LENGTHEN', async (c) => {
    let mode = c._lenMode || 'DElta', val = c._lenVal || 0;
    for (;;) {
      const s = need(await c.entsel(`Select an object to measure or [DElta/Percent/Total/DYnamic] <${mode}>:`));
      if (typeof s === 'object') { c.print(`Current length: ${F(E.entLength(s.e))}`); continue; }
      mode = s; c._lenMode = s; break;
    }
    if (mode === 'DElta') val = need(await c.getDist(`Enter delta length or [Angle] <${F(val)}>:`, { def: val }));
    else if (mode === 'Percent') val = need(await c.getReal('Enter percentage length <100.0000>:', { def: 100 }));
    else if (mode === 'Total') val = need(await c.getDist('Specify total length or [Angle] <1.0000>:', { def: 1 }));
    c._lenVal = val;
    for (;;) {
      const s = await c.entsel('Select an object to change or [Undo]:', { filter: (e) => e.type === 'LINE' || e.type === 'ARC' });
      if (!s) return; if (s === 'Undo') { doc().undo(); continue; } if (typeof s !== 'object') continue;
      const e = s.e, L = E.entLength(e);
      let target = L;
      if (mode === 'DElta') target = L + val; else if (mode === 'Percent') target = L * val / 100; else if (mode === 'Total') target = val;
      else { const q = need(await c.getPoint('Specify new end point:')); target = L + (G.dist(q, s.p)); }
      if (target <= 0) { c.print('Invalid length.'); continue; }
      doc().touch(e);
      if (e.type === 'LINE') { const atEnd = G.dist(s.p, e.p2) < G.dist(s.p, e.p1); const a = atEnd ? e.p1 : e.p2, b = atEnd ? e.p2 : e.p1; const nb = G.add(a, G.mul(G.norm(G.sub(b, a)), target)); if (atEnd) e.p2 = nb; else e.p1 = nb; }
      else { const sw = target / e.r; const atEnd = G.dist(s.p, G.polar(e.c, e.a2, e.r)) < G.dist(s.p, G.polar(e.c, e.a1, e.r)); if (atEnd) e.a2 = e.a1 + sw; else e.a1 = e.a2 - sw; }
      E.invalidate(e); app.view.redraw();
    }
  }, { alias: ['LEN'] });

  // ---------------- EXPLODE
  R('EXPLODE', async (c) => {
    const s = await c.select();
    let n = 0;
    for (const e of s) {
      const parts = E.explodeEnt(e, doc());
      if (!parts) { c.print(`1 ${e.type === 'LINE' ? 'was' : 'object'} not able to be exploded.`); continue; }
      const arr = doc().ownerOf(e);
      doc().remove(e);
      for (const p of parts) { delete p.hid; doc().add(p, arr); }
      n++;
    }
    if (n) c.print(`${n} object${n > 1 ? 's' : ''} exploded.`);
  }, { alias: ['XPLODE'] });

  // ---------------- PEDIT
  R('PEDIT', async (c) => {
    let s = await c.select('Select polyline or [Multiple]:', { single: true });
    let e = s[0]; if (!e) return;
    if (e.type === 'LINE' || e.type === 'ARC') {
      const y = await c.getKw('Object selected is not a polyline\nDo you want to turn it into one? [Yes/No] <Y>:', 'Yes');
      if (y === 'No') return;
      const r = joinEnts([e]); if (!r) return; doc().remove(e); e = doc().add(r.out[0]);
    }
    if (e.type !== 'LWPOLYLINE') { c.print('Object selected is not a polyline.'); return; }
    for (;;) {
      const o = await c.getKw(`Enter an option [${e.closed ? 'Open' : 'Close'}/Join/Width/Edit vertex/Fit/Spline/Decurve/Ltype gen/Reverse/Undo]:`);
      if (!o) return;
      doc().touch(e);
      if (o === 'Close') e.closed = true;
      else if (o === 'Open') e.closed = false;
      else if (o === 'Decurve') e.pts = e.pts.map((p) => ({ ...p, b: 0 }));
      else if (o === 'Reverse') e.pts = reversePts(e.pts, e.closed);
      else if (o === 'Width') { const w = need(await c.getDist('Specify new width for all segments:')); e.cw_ = w || undefined; }
      else if (o === 'Join') { const more = await c.select('Select objects:', { filter: (x) => x !== e && ['LINE', 'ARC', 'LWPOLYLINE'].includes(x.type), noPickfirst: true }); const r = joinEnts([e, ...more]); if (r) { const main = r.out.find(() => true); for (const u of r.used) if (u !== e) doc().remove(u); e.pts = main.pts; e.closed = main.closed; c.print(`${r.used.length - 1} segments added to polyline`); } }
      else if (o === 'Fit' || o === 'Spline') { const pts = E.polyPoints(e); const sp = { type: 'SPLINE', layer: e.layer, color: e.color, ltype: e.ltype, closed: e.closed, ...(o === 'Fit' ? { fit: e.pts.map((p) => ({ x: p.x, y: p.y })) } : { cps: e.closed ? [...e.pts, e.pts[0], e.pts[1], e.pts[2]].map((p) => ({ x: p.x, y: p.y })) : e.pts.map((p) => ({ x: p.x, y: p.y })), deg: 3 }) }; void pts; const arr = doc().ownerOf(e); doc().remove(e); doc().add(sp, arr); return; }
      else if (o === 'Undo') doc().undo();
      else if (o === 'Edit vertex') c.print('Use grips to edit vertices.');
      E.invalidate(e); app.view.redraw();
    }
  });

  // ---------------- MATCHPROP
  R('MATCHPROP', async (c) => {
    const s = need(await c.entsel('Select source object:'));
    if (typeof s !== 'object') return;
    const src = s.e;
    c.print('Current active settings:  Color Layer Ltype Ltscale Lineweight Transparency Thickness PlotStyle Dim Text Hatch Polyline Viewport Table Material Multileader Center object');
    for (;;) {
      const t = await c.select('Select destination object(s) or [Settings]:', { noPickfirst: true });
      if (!t.length) return;
      for (const e of t) {
        doc().touch(e);
        for (const k of ['layer', 'color', 'ltype', 'lw', 'lts', 'tc']) { if (src[k] !== undefined) e[k] = src[k]; else delete e[k]; }
        if ((e.type === 'TEXT' || e.type === 'MTEXT') && (src.type === 'TEXT' || src.type === 'MTEXT')) { e.h = src.h; e.style = src.style; }
        if (e.type === 'HATCH' && src.type === 'HATCH') { e.pattern = src.pattern; e.scale = src.scale; e.angle = src.angle; e.solid = src.solid; e.pdef = src.pdef; }
        if (e.type === 'DIMENSION' && src.type === 'DIMENSION') e.st = src.st ? { ...src.st } : undefined;
        E.invalidate(e);
      }
      app.view.redraw();
      if (!c.req) { /* sigue */ }
    }
  }, { alias: ['PAINTER'] });

  // ---------------- CHPROP / CHANGE
  R('CHPROP', async (c) => {
    const s = await c.select(); if (!s.length) return;
    for (;;) {
      const o = await c.getKw('Enter property to change [Color/LAyer/LType/ltScale/LWeight/Thickness/TRansparency/Material/PLotstyle]:');
      if (!o) return;
      if (o === 'Color') { const v = need(await c.getString('Enter new color [Truecolor/COlorbook] <BYLAYER>:', { def: 'BYLAYER' })); const col = parseColor(v); for (const e of s) doc().mod(e, (x) => (x.color = col)); }
      if (o === 'LAyer') { const v = need(await c.getString(`Enter new layer name <${s[0].layer}>:`, { def: s[0].layer })); doc().ensureLayer(v); for (const e of s) doc().mod(e, (x) => (x.layer = v)); }
      if (o === 'LType') { const v = need(await c.getString('Enter new linetype name <ByLayer>:', { def: 'BYLAYER' })).toUpperCase(); for (const e of s) doc().mod(e, (x) => (x.ltype = v)); }
      if (o === 'ltScale') { const v = need(await c.getReal('Specify new linetype scale <1.0000>:', { def: 1 })); for (const e of s) doc().mod(e, (x) => (x.lts = v)); }
      if (o === 'LWeight') { const v = need(await c.getString('Enter new lineweight <ByLayer>:', { def: 'BYLAYER' })); const lw = /bylayer/i.test(v) ? -1 : /byblock/i.test(v) ? -2 : Math.round(parseFloat(v) * 100); for (const e of s) doc().mod(e, (x) => (x.lw = lw)); }
      app.view.redraw();
    }
  }, { alias: ['CHANGE', '-CHANGE'] });

  // ---------------- DRAWORDER
  R('DRAWORDER', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const o = (await c.getKw('Enter object ordering option [Above objects/Under objects/Front/Back] <Back>:', 'Back')) || 'Back';
    const arr = doc().space;
    let ref = null;
    if (o === 'Above objects' || o === 'Under objects') { const r = await c.select('Select reference objects:', { noPickfirst: true }); ref = r; }
    for (const e of s) doc().remove(e, arr);
    if (o === 'Front') for (const e of s) doc().add(e, arr);
    else if (o === 'Back') { for (const e of [...s].reverse()) { arr.unshift(e); doc()._rec({ k: 'add', e, arr }); } }
    else if (ref && ref.length) {
      const idxs = ref.map((r) => arr.indexOf(r)).filter((i) => i >= 0);
      const at = o === 'Above objects' ? Math.max(...idxs) + 1 : Math.min(...idxs);
      arr.splice(at, 0, ...s); for (const e of s) doc()._rec({ k: 'add', e, arr });
    } else for (const e of s) doc().add(e, arr);
    app.view.redraw();
  }, { alias: ['DR'] });
  R('TEXTTOFRONT', async () => { const arr = doc().space; const t = arr.filter((e) => ['TEXT', 'MTEXT', 'DIMENSION', 'LEADER'].includes(e.type)); for (const e of t) doc().remove(e, arr); for (const e of t) doc().add(e, arr); });
  R('HATCHTOBACK', async () => { const arr = doc().space; const t = arr.filter((e) => e.type === 'HATCH'); for (const e of t) doc().remove(e, arr); for (const e of t.reverse()) { arr.unshift(e); doc()._rec({ k: 'add', e, arr }); } });

  // ---------------- ALIGN
  R('ALIGN', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const s1 = need(await c.getPoint('Specify first source point:'));
    const d1 = need(await c.getPoint('Specify first destination point:', { base: s1 }));
    const s2 = await c.getPoint('Specify second source point:');
    let m = M.tr(d1.x - s1.x, d1.y - s1.y);
    if (isPt(s2)) {
      const d2 = need(await c.getPoint('Specify second destination point:', { base: s2 }));
      await c.getPoint('Specify third source point or <continue>:');
      const sc = (await c.getKw('Scale objects based on alignment points? [Yes/No] <N>:', 'No')) === 'Yes';
      const a = G.ang(d1, d2) - G.ang(s1, s2);
      m = M.mul(M.rot(a, d1), m);
      if (sc) m = M.mul(M.scale(G.dist(d1, d2) / G.dist(s1, s2), d1), m);
    }
    for (const e of s) { doc().touch(e); E.transformEnt(e, m); }
  });

  // ---------------- consulta
  R('DIST', async (c) => {
    const a = need(await c.getPoint('Specify first point:'));
    const b = need(await c.getPoint('Specify second point or [Multiple points]:', { base: a }));
    if (!isPt(b)) return;
    c.print(`Distance = ${F(G.dist(a, b))},  Angle in XY Plane = ${F(G.deg(G.normA(G.ang(a, b))), 0)}, Angle from XY Plane = 0\nDelta X = ${F(b.x - a.x)}, Delta Y = ${F(b.y - a.y)}, Delta Z = 0.0000`);
  }, { transparent: true, alias: ['MEASUREGEOM'] });
  R('ID', async (c) => { const p = need(await c.getPoint('Specify point:')); c.print(`X = ${F(p.x)}     Y = ${F(p.y)}     Z = 0.0000`); }, { transparent: true });
  R('AREA', async (c) => {
    const p = need(await c.getPoint('Specify first corner point or [Object/Add area/Subtract area] <Object>:', { def: 'Object' }));
    if (p === 'Object') {
      const s = need(await c.entsel('Select objects:'));
      const ar = E.entArea(s.e), pe = E.entLength(s.e); doc().vars.AREA = ar; doc().vars.PERIMETER = pe;
      c.print(`Area = ${F(ar)}, ${s.e.type === 'CIRCLE' ? 'Circumference' : 'Perimeter'} = ${F(pe)}`); return;
    }
    if (!isPt(p)) return;
    const pts = [p];
    for (;;) { const q = await c.getPoint('Specify next point or [Arc/Length/Undo/Total] <Total>:', { base: pts[pts.length - 1], preview: (x) => [{ type: 'LWPOLYLINE', pts: [...pts, x].map((v) => ({ ...v, b: 0 })), closed: true }] }); if (!isPt(q)) break; pts.push(q); }
    let per = 0; for (let i = 0; i < pts.length; i++) per += G.dist(pts[i], pts[(i + 1) % pts.length]);
    doc().vars.AREA = Math.abs(G.polyArea(pts)); doc().vars.PERIMETER = per;
    c.print(`Area = ${F(Math.abs(G.polyArea(pts)))}, Perimeter = ${F(per)}`);
  }, { alias: ['AA'] });
  R('LIST', async (c) => {
    const s = await c.select();
    for (const e of s) c.print(listEnt(e, doc()));
    app.ui?.cmdline?.expand?.(true);
  });
  R('DIVIDE', async (c) => divMeas(c, true));
  R('MEASURE', async (c) => divMeas(c, false));
  const divMeas = async (c, divide) => {
    const s = need(await c.entsel(`Select object to ${divide ? 'divide' : 'measure'}:`, { filter: (e) => E.curvePoints(e).length > 1 }));
    let r = need(await (divide ? c.getInt('Enter the number of segments or [Block]:') : c.getDist('Specify length of segment or [Block]:')));
    let blk = null, align = true;
    if (r === 'Block') { blk = need(await c.getString('Enter name of block to insert:')); align = (await c.getKw('Align block with object? [Yes/No] <Y>:', 'Yes')) !== 'No'; r = need(await (divide ? c.getInt('Enter the number of segments:') : c.getDist('Specify length of segment:'))); }
    const pts = E.curvePoints(s.e), L = E.entLength(s.e);
    const positions = [];
    if (divide) for (let i = 1; i < r; i++) positions.push(L * i / r); else for (let d = r; d < L - 1e-9; d += r) positions.push(d);
    for (const d of positions) { const { p, a } = E.pointAtLength(pts, d); doc().add(blk ? { type: 'INSERT', name: blk.toUpperCase() in doc().blocks ? blk.toUpperCase() : blk, p, sx: 1, sy: 1, rot: align ? a : 0 } : { type: 'POINT', p }); }
  };

  R('U', async (c) => { const n = doc().undo(); c.print(n ? `${n}` : 'Everything has been undone'); app.view.redraw(); }, { noRepeat: false });
  R('UNDO', async (c) => {
    const r = await c.getString('Enter the number of operations to undo or [Auto/Control/BEgin/End/Mark/Back] <1>:', { def: '1' });
    const n = parseInt(r, 10) || 1;
    for (let i = 0; i < n; i++) { const t = doc().undo(); if (!t) { c.print('Everything has been undone'); break; } c.print(t); }
    app.view.redraw();
  });
  R('REDO', async (c) => { const n = doc().redo(); c.print(n ? `${n}` : 'Nothing to redo'); app.view.redraw(); }, { alias: ['MREDO'] });
}

// ---------- utilidades exportadas
export function stretchEnt(e, fr, d, doc) {
  const inF = (p) => G.ptInBB(p, fr);
  const mv = (p) => (inF(p) ? G.add(p, d) : p);
  const bb = E.entBBox(e, doc);
  if (G.bbInside(bb, fr)) { E.transformEnt(e, M.tr(d.x, d.y)); return; }
  switch (e.type) {
    case 'LINE': e.p1 = mv(e.p1); e.p2 = mv(e.p2); break;
    case 'LWPOLYLINE': e.pts = e.pts.map((p) => ({ ...p, ...mv(p) })); break;
    case 'SOLID': case 'LEADER': case 'WIPEOUT': e.pts = e.pts.map(mv); break;
    case 'ARC': { const s = G.polar(e.c, e.a1, e.r), t = G.polar(e.c, e.a2, e.r), m = G.polar(e.c, e.a1 + G.arcSweep(e.a1, e.a2) / 2, e.r); if (inF(s) || inF(t)) { const ns = mv(s), nt = mv(t); const cc = circle3pts(ns, m, nt); if (cc) { e.c = cc.c; e.r = cc.r; e.a1 = G.ang(cc.c, ns); e.a2 = G.ang(cc.c, nt); } } break; }
    case 'DIMENSION': for (const k of ['p1', 'p2', 'dp', 'c', 'tp']) if (e[k]) e[k] = mv(e[k]); break;
    case 'TEXT': case 'MTEXT': case 'INSERT': case 'POINT': case 'CIRCLE': { const p = e.p || e.c; if (p && inF(p)) E.transformEnt(e, M.tr(d.x, d.y)); break; }
    case 'HATCH': e.loops = e.loops.map((l) => l.map((p) => ({ ...p, ...mv(p) }))); break;
    case 'SPLINE': if (e.fit) e.fit = e.fit.map(mv); if (e.cps) e.cps = e.cps.map(mv); break;
  }
  E.invalidate(e);
}
function circle3pts(a, b, c) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)); if (Math.abs(d) < 1e-12) return null;
  const ux = ((a.x ** 2 + a.y ** 2) * (b.y - c.y) + (b.x ** 2 + b.y ** 2) * (c.y - a.y) + (c.x ** 2 + c.y ** 2) * (a.y - b.y)) / d;
  const uy = ((a.x ** 2 + a.y ** 2) * (c.x - b.x) + (b.x ** 2 + b.y ** 2) * (a.x - c.x) + (c.x ** 2 + c.y ** 2) * (b.x - a.x)) / d;
  return { c: { x: ux, y: uy }, r: Math.hypot(a.x - ux, a.y - uy) };
}
export function reversePts(pts, closed) {
  const n = pts.length, out = [];
  for (let i = n - 1; i >= 0; i--) {
    const b = closed ? -(pts[(i - 1 + n) % n].b || 0) : (i > 0 ? -(pts[i - 1].b || 0) : 0);
    out.push({ x: pts[i].x, y: pts[i].y, b });
  }
  return out;
}
export function joinEnts(ents) {
  const tol = 1e-6;
  const pieces = ents.map((e) => {
    if (e.type === 'LINE') return { e, pts: [{ ...e.p1, b: 0 }, { ...e.p2, b: 0 }] };
    if (e.type === 'ARC') { const s = G.polar(e.c, e.a1, e.r), t = G.polar(e.c, e.a2, e.r); return { e, pts: [{ ...s, b: Math.tan(G.arcSweep(e.a1, e.a2) / 4) }, { ...t, b: 0 }] }; }
    if (e.type === 'LWPOLYLINE' && !e.closed) return { e, pts: e.pts.map((p) => ({ ...p })) };
    if (e.type === 'LWPOLYLINE') return { e, pts: e.pts.map((p) => ({ ...p })), closed: true };
    return null;
  }).filter(Boolean);
  if (!pieces.length) return null;
  const out = [], used = [];
  const rest = pieces.slice();
  while (rest.length) {
    const first = rest.shift();
    let chain = first.pts.map((p) => ({ ...p })); const members = [first.e];
    if (first.closed) { out.push({ type: 'LWPOLYLINE', layer: first.e.layer, color: first.e.color, ltype: first.e.ltype, lw: first.e.lw, pts: chain, closed: true }); used.push(first.e); continue; }
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < rest.length; i++) {
        const p = rest[i]; if (p.closed) continue;
        const s = chain[0], t = chain[chain.length - 1], ps = p.pts[0], pt = p.pts[p.pts.length - 1];
        let add = null, atEnd = true;
        if (G.eq(t, ps, tol)) add = p.pts;
        else if (G.eq(t, pt, tol)) add = reversePts(p.pts, false);
        else if (G.eq(s, pt, tol)) { add = p.pts; atEnd = false; }
        else if (G.eq(s, ps, tol)) { add = reversePts(p.pts, false); atEnd = false; }
        if (!add) continue;
        if (atEnd) { chain[chain.length - 1].b = add[0].b; chain = chain.concat(add.slice(1).map((x) => ({ ...x }))); }
        else { const a = add.map((x) => ({ ...x })); chain = a.slice(0, -1).concat(chain); }
        members.push(p.e); rest.splice(i, 1); grew = true; break;
      }
    }
    let closed = false;
    if (chain.length > 2 && G.eq(chain[0], chain[chain.length - 1], tol)) { const last = chain.pop(); chain[chain.length - 1].b = chain[chain.length - 1].b; closed = true; void last; }
    const f = first.e;
    out.push({ type: 'LWPOLYLINE', layer: f.layer, color: f.color, ltype: f.ltype, lw: f.lw, pts: chain, closed });
    used.push(...members);
  }
  return { out, used };
}
export function parseColor(v) {
  const s = String(v).trim().toUpperCase();
  if (s === 'BYLAYER') return 256; if (s === 'BYBLOCK') return 0;
  const names = { RED: 1, YELLOW: 2, GREEN: 3, CYAN: 4, BLUE: 5, MAGENTA: 6, WHITE: 7, BLACK: 7 };
  if (names[s]) return names[s];
  const n = parseInt(s, 10); return n >= 0 && n <= 256 ? n : 256;
}
export function listEnt(e, doc) {
  const L = [];
  L.push(`                  ${e.type}  Layer: "${e.layer}"\n                            Space: ${doc.model.includes(e) ? 'Model space' : 'Paper space'}\n                   Handle = ${(e.hid || '').toLowerCase()}`);
  if (e.color != null && e.color !== 256) L.push(`                   Color: ${e.color}`);
  const p = (q) => `X=${F(q.x)}  Y=${F(q.y)}  Z=   0.0000`;
  switch (e.type) {
    case 'LINE': L.push(`              from point, ${p(e.p1)}\n                to point, ${p(e.p2)}\n          Length = ${F(G.dist(e.p1, e.p2))},  Angle in XY Plane = ${F(G.deg(G.normA(G.ang(e.p1, e.p2))), 0)}`); break;
    case 'CIRCLE': L.push(`            center point, ${p(e.c)}\n            radius ${F(e.r)}\n circumference ${F(G.TAU * e.r)}\n            area ${F(Math.PI * e.r * e.r)}`); break;
    case 'ARC': L.push(`            center point, ${p(e.c)}\n            radius ${F(e.r)}\n           start angle ${F(G.deg(G.normA(e.a1)), 0)}\n             end angle ${F(G.deg(G.normA(e.a2)), 0)}\n            length ${F(E.entLength(e))}`); break;
    case 'LWPOLYLINE': L.push(`            ${e.closed ? 'Closed' : 'Open'}\n    Constant width    ${F(e.cw_ || 0)}\n            area   ${F(E.entArea(e))}\n            length   ${F(E.entLength(e))}`); e.pts.forEach((v) => L.push(`          at point  ${p(v)}${v.b ? `  bulge ${F(v.b)}` : ''}`)); break;
    case 'TEXT': case 'MTEXT': L.push(`                  Style = "${e.style || 'Standard'}"\n        insertion point ${p(e.p)}\n                 height ${F(e.h)}\n                  text ${e.text}\n               rotation angle ${F(G.deg(e.rot || 0), 0)}`); break;
    case 'INSERT': L.push(`              Block Name: "${e.name}"\n                 at point, ${p(e.p)}\n   X scale factor:    ${F(e.sx ?? 1)}\n   Y scale factor:    ${F(e.sy ?? 1)}\n   rotation angle:    ${F(G.deg(e.rot || 0), 0)}`); for (const a of e.attribs || []) L.push(`              Tag: ${a.tag}  Value: ${a.text}`); if (e.dyn) for (const [k, v] of Object.entries(e.dyn)) L.push(`              ${k}: ${typeof v === 'number' ? F(v) : v}`); break;
    case 'HATCH': L.push(`                 Pattern: ${e.pattern}  Scale: ${F(e.scale || 1)}  Angle: ${F(G.deg(e.angle || 0), 0)}\n                    Area: ${F(E.entArea(e))}`); break;
    case 'DIMENSION': L.push(`                    type: ${e.dt || 'block'}\n             measurement: ${F(E.dimMeasure(e))}`); break;
    case 'POINT': L.push(`                at point, ${p(e.p)}`); break;
    case 'ELLIPSE': L.push(`                  Center: ${p(e.c)}\n              Major Axis: X = ${F(e.major.x)}  Y = ${F(e.major.y)}\n            Radius Ratio: ${F(e.ratio)}`); break;
  }
  return L.join('\n');
}
