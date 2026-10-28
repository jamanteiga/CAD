// Parametrización de curvas para TRIM / EXTEND / BREAK / DIVIDE
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';

// segmentos parametrizados: cada uno con rango [t0,t1] global
export function curveSegs(e) {
  switch (e.type) {
    case 'LINE': return { segs: [{ k: 'L', a: e.p1, b: e.p2, t0: 0, t1: 1 }], T0: 0, T1: 1, periodic: false };
    case 'XLINE': { const d = G.norm(e.dir); return { segs: [{ k: 'L', a: G.sub(e.p, G.mul(d, 1e7)), b: G.add(e.p, G.mul(d, 1e7)), t0: 0, t1: 1 }], T0: 0, T1: 1, periodic: false, inf: 'both' }; }
    case 'RAY': { const d = G.norm(e.dir); return { segs: [{ k: 'L', a: e.p, b: G.add(e.p, G.mul(d, 1e7)), t0: 0, t1: 1 }], T0: 0, T1: 1, periodic: false, inf: 'end' }; }
    case 'ARC': return { segs: [{ k: 'A', c: e.c, r: e.r, a1: e.a1, a2: e.a2, t0: 0, t1: 1 }], T0: 0, T1: 1, periodic: false };
    case 'CIRCLE': return { segs: [{ k: 'A', c: e.c, r: e.r, a1: 0, a2: G.TAU, full: true, t0: 0, t1: 1 }], T0: 0, T1: 1, periodic: true };
    case 'LWPOLYLINE': {
      const segs = E.polySegs(e).map((s, i) => ({ ...s, t0: i, t1: i + 1, i }));
      return { segs, T0: 0, T1: segs.length, periodic: !!e.closed };
    }
    case 'ELLIPSE': case 'SPLINE': {
      const pts = e.type === 'ELLIPSE' ? E.ellipsePoints(e, 180) : E.splineTess(e);
      const segs = []; for (let i = 0; i < pts.length - 1; i++) segs.push({ k: 'L', a: pts[i], b: pts[i + 1], t0: i, t1: i + 1 });
      return { segs, T0: 0, T1: segs.length, periodic: !!(pts.full || e.closed), pts };
    }
  }
  return null;
}
export function localParam(s, p) {
  if (s.k === 'L') { const d = G.sub(s.b, s.a), L = G.dot(d, d); return L < 1e-30 ? 0 : G.dot(G.sub(p, s.a), d) / L; }
  if (s.cw) { const sw = G.arcSweep(s.a1, s.a2); return G.normA(s.a2 - G.ang(s.c, p)) / sw; }
  const sw = s.full ? G.TAU : G.arcSweep(s.a1, s.a2);
  return G.normA(G.ang(s.c, p) - s.a1) / sw;
}
export function paramOf(cv, p) {
  let best = 0, bd = Infinity;
  for (const s of cv.segs) {
    const n = G.primNearest(s, p), d = G.dist(n, p);
    if (d < bd) { bd = d; best = s.t0 + Math.min(1, Math.max(0, localParam(s, n))) * (s.t1 - s.t0); }
  }
  return best;
}
export function pointAt(cv, t) {
  const s = cv.segs.find((x) => t >= x.t0 - 1e-12 && t <= x.t1 + 1e-12) || cv.segs[cv.segs.length - 1];
  const f = (t - s.t0) / (s.t1 - s.t0);
  if (s.k === 'L') return G.lerp(s.a, s.b, f);
  const sw = s.full ? G.TAU : G.arcSweep(s.a1, s.a2);
  return s.cw ? G.polar(s.c, s.a2 - sw * f, s.r) : G.polar(s.c, s.a1 + sw * f, s.r);
}
// intersecciones con primitivas de corte -> parámetros globales
export function cutParams(cv, cutters) {
  const out = [];
  for (const s of cv.segs) {
    const sp = s.k === 'A' && !s.full ? { k: 'A', c: s.c, r: s.r, a1: s.a1, a2: s.a2 } : s;
    for (const c of cutters) for (const x of G.primInter(sp, c)) {
      const t = s.t0 + Math.min(1, Math.max(0, localParam(s, x))) * (s.t1 - s.t0);
      out.push(t);
    }
  }
  out.sort((a, b) => a - b);
  return out.filter((t, i) => i === 0 || t - out[i - 1] > 1e-9);
}
// subtramo [ta, tb] de una entidad -> nueva entidad
export function slice(e, cv, ta, tb) {
  const base = { layer: e.layer, color: e.color, ltype: e.ltype, lw: e.lw, lts: e.lts };
  if (tb - ta < 1e-9) return null;
  switch (e.type) {
    case 'LINE': return { type: 'LINE', ...base, p1: pointAt(cv, ta), p2: pointAt(cv, tb) };
    case 'XLINE': case 'RAY': {
      const p1 = pointAt(cv, ta), p2 = pointAt(cv, tb), d = G.norm(e.dir);
      const startInf = (e.type === 'XLINE') && ta <= 1e-12, endInf = tb >= 1 - 1e-12;
      if (startInf && endInf) return { ...E.cloneEnt(e) };
      if (endInf) return { type: 'RAY', ...base, p: p1, dir: d };
      if (startInf) return { type: 'RAY', ...base, p: p2, dir: G.mul(d, -1) };
      return { type: 'LINE', ...base, p1, p2 };
    }
    case 'ARC': { const sw = G.arcSweep(e.a1, e.a2); return { type: 'ARC', ...base, c: e.c, r: e.r, a1: e.a1 + sw * ta, a2: e.a1 + sw * tb }; }
    case 'CIRCLE': return { type: 'ARC', ...base, c: e.c, r: e.r, a1: G.TAU * ta, a2: G.TAU * tb };
    case 'LWPOLYLINE': {
      const n = cv.segs.length, pts = [];
      const segAt = (t) => cv.segs[((Math.floor(t) % n) + n) % n];
      const ptAt = (t) => { const s = segAt(t), f = t - Math.floor(t); const q = s.k === 'L' ? G.lerp(s.a, s.b, f) : (s.cw ? G.polar(s.c, s.a2 - G.arcSweep(s.a1, s.a2) * f, s.r) : G.polar(s.c, s.a1 + G.arcSweep(s.a1, s.a2) * f, s.r)); return q; };
      const bul = (t0, t1) => { const s = segAt(t0); if (s.k === 'L') return 0; const b = e.pts[s.i].b || 0; const th = 4 * Math.atan(b); return Math.tan(th * (t1 - t0) / 4); };
      let t = ta;
      while (t < tb - 1e-12) {
        const nxt = Math.min(tb, Math.floor(t + 1e-12) + 1);
        const p = ptAt(t); pts.push({ x: p.x, y: p.y, b: bul(t, nxt) });
        t = nxt;
      }
      const pe = ptAt(tb >= n && !e.closed ? n - 1e-12 : tb); pts.push({ x: pe.x, y: pe.y, b: 0 });
      if (tb >= n && !e.closed) { const l = e.pts[e.pts.length - 1]; pts[pts.length - 1] = { x: l.x, y: l.y, b: 0 }; }
      return { type: 'LWPOLYLINE', ...base, pts, closed: false, cw_: e.cw_ };
    }
    case 'ELLIPSE': case 'SPLINE': {
      const pts = []; const n = cv.pts.length - 1;
      const at = (t) => pointAt(cv, ((t % n) + n) % n);
      pts.push(at(ta)); for (let k = Math.floor(ta) + 1; k < tb; k++) pts.push(cv.pts[k % n]); pts.push(at(tb));
      return { type: 'LWPOLYLINE', ...base, pts: pts.map((p) => ({ x: p.x, y: p.y, b: 0 })), closed: false };
    }
  }
  return null;
}
// elimina el tramo entre los cortes que rodean tp. Devuelve lista de piezas (o [] si se borra) o null si no se puede
export function removeInterval(e, cv, cuts, tp, alsoT2 = null) {
  const { T0, T1, periodic } = cv;
  if (alsoT2 != null) { // BREAK con dos parámetros
    let a = Math.min(tp, alsoT2), b = Math.max(tp, alsoT2);
    if (periodic) {
      if (e.type === 'CIRCLE') return [slice(e, cv, b, a + 1)].filter(Boolean);
      return [slice(e, cv, b, a + T1)].filter(Boolean);
    }
    return [slice(e, cv, T0, a), slice(e, cv, b, T1)].filter(Boolean);
  }
  const inner = cuts.filter((t) => (periodic ? true : t > T0 + 1e-9 && t < T1 - 1e-9));
  if (!inner.length) return [];
  if (periodic) {
    if (inner.length < (e.type === 'CIRCLE' ? 2 : 1)) return null;
    let lo = null, hi = null;
    for (const t of inner) { if (t < tp) lo = t; if (t > tp && hi == null) hi = t; }
    if (lo == null) lo = inner[inner.length - 1] - (T1 - T0);
    if (hi == null) hi = inner[0] + (T1 - T0);
    const piece = slice(e, cv, hi, lo + (T1 - T0));
    return piece ? [piece] : [];
  }
  let lo = T0, hi = T1;
  for (const t of inner) { if (t < tp) lo = t; else if (t > tp) { hi = t; break; } }
  return [slice(e, cv, T0, lo), slice(e, cv, hi, T1)].filter(Boolean);
}
