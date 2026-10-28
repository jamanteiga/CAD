// Restricciones paramétricas geométricas y de cota, con un resolvedor iterativo por proyecciones.
// Referencias: punto { h, k } (k = 'p1' | 'p2' | 'c' | 'v<i>' | 'a1' | 'a2'), línea { h, seg? }, círculo { h }.
// El resolvedor mueve lo mínimo; los puntos de las entidades recién editadas y los fijados no se mueven.
import * as G from './geom.js';
import { invalidate } from './entities.js';

export const GEOM_TYPES = ['coincident', 'horizontal', 'vertical', 'parallel', 'perpendicular', 'equal', 'fix', 'concentric', 'collinear', 'tangent'];
export const DIM_TYPES = ['dlinear', 'dhorizontal', 'dvertical', 'daligned', 'dradius', 'ddiameter', 'dangular'];
export const GLYPH = { coincident: '●', horizontal: 'H', vertical: 'V', parallel: '∥', perpendicular: '⊥', equal: '=', fix: '🔒', concentric: '◎', collinear: '⋯', tangent: 'T' };

const ent = (doc, h, cache) => { if (cache && cache.has(h)) return cache.get(h); const e = doc.findHandle(h); cache?.set(h, e); return e; };
export function getP(e, k) {
  if (!e) return null;
  if (k === 'p1' || k === 'p2') return e[k];
  if (k === 'c') return e.c;
  if (k[0] === 'v') return e.pts?.[+k.slice(1)];
  if (k === 'a1' || k === 'a2') return G.polar(e.c, e[k], e.r);
  return null;
}
function setP(e, k, p) {
  if (k === 'p1' || k === 'p2') e[k] = { x: p.x, y: p.y };
  else if (k === 'c') e.c = { x: p.x, y: p.y };
  else if (k[0] === 'v') { const i = +k.slice(1); e.pts[i] = { ...e.pts[i], x: p.x, y: p.y }; }
  else if (k === 'a1' || k === 'a2') e[k] = G.ang(e.c, p);
  invalidate(e);
}
// extremos de una referencia de línea
export function lineRefs(L, e) {
  if (!e) return null;
  if (e.type === 'LINE') return [{ h: L.h, k: 'p1' }, { h: L.h, k: 'p2' }];
  if (e.type === 'LWPOLYLINE') { const i = L.seg || 0, j = (i + 1) % e.pts.length; return [{ h: L.h, k: 'v' + i }, { h: L.h, k: 'v' + j }]; }
  return null;
}
// referencia a partir de un punto designado
export function pointRefAt(e, p) {
  const c = [];
  if (e.type === 'LINE') c.push(['p1', e.p1], ['p2', e.p2]);
  else if (e.type === 'LWPOLYLINE') e.pts.forEach((v, i) => c.push(['v' + i, v]));
  else if (e.type === 'CIRCLE') c.push(['c', e.c]);
  else if (e.type === 'ARC') c.push(['c', e.c], ['a1', G.polar(e.c, e.a1, e.r)], ['a2', G.polar(e.c, e.a2, e.r)]);
  if (!c.length) return null;
  c.sort((a, b) => G.dist(a[1], p) - G.dist(b[1], p));
  return { h: e.hid, k: c[0][0] };
}
export function lineRefAt(e, p) {
  if (e.type === 'LINE') return { h: e.hid };
  if (e.type === 'LWPOLYLINE') {
    let best = 0, bd = Infinity; const n = e.closed ? e.pts.length : e.pts.length - 1;
    for (let i = 0; i < n; i++) { const a = e.pts[i], b = e.pts[(i + 1) % e.pts.length]; const d = G.segDist ? G.segDist(p, a, b) : distSeg(p, a, b); if (d < bd) { bd = d; best = i; } }
    return { h: e.hid, seg: best };
  }
  return null;
}
const distSeg = (p, a, b) => { const ab = G.sub(b, a), t = Math.max(0, Math.min(1, G.dot(G.sub(p, a), ab) / (G.dot(ab, ab) || 1))); return G.dist(p, G.add(a, G.mul(ab, t))); };

// ---- valores de las restricciones de cota (expresiones con nombres de parámetros)
export function evalParams(doc) {
  const vals = {};
  const dims = (doc.constraints || []).filter((c) => DIM_TYPES.includes(c.type));
  for (let pass = 0; pass < 4; pass++) for (const c of dims) {
    try {
      const names = Object.keys(vals);
      // solo números, operadores, paréntesis, funciones Math y nombres de parámetros
      const expr = String(c.expr ?? c.value).replace(/\b(sin|cos|tan|sqrt|abs|pi|PI|min|max|round|floor|ceil|atan|asin|acos)\b/g, (m) => (m.toLowerCase() === 'pi' ? 'Math.PI' : 'Math.' + m));
      if (/[^\w\s.+\-*/()^,]/.test(expr.replace(/Math\.\w+/g, ''))) continue;
      const fn = new Function(...names, `return (${expr.replace(/\^/g, '**')});`);
      const v = fn(...names.map((n) => vals[n]));
      if (Number.isFinite(v)) { vals[c.name] = v; c.value = v; }
    } catch (_) { /* expresión aún no resoluble */ }
  }
  return vals;
}

// ---- resolvedor
// pinned: Set de entidades fijas o { ents: Set, keys: Set('hid:k') } con los puntos recién editados
export function solve(doc, pinnedIn = new Set(), iters = 200, touchFn = null) {
  const pinned = pinnedIn instanceof Set ? pinnedIn : (pinnedIn.ents || new Set());
  const pinKeys = pinnedIn instanceof Set ? new Set() : (pinnedIn.keys || new Set());
  const cs = doc.constraints || [];
  if (!cs.length) return 0;
  evalParams(doc);
  const cache = new Map();
  const E = (h) => ent(doc, h, cache);
  const fixedRefs = new Set(cs.filter((c) => c.type === 'fix').map((c) => `${c.refs[0].h}:${c.refs[0].k}`));
  const isFixed = (r) => { const e = E(r.h); return !e || pinned.has(e) || pinKeys.has(`${r.h}:${r.k}`) || fixedRefs.has(`${r.h}:${r.k}`); };
  const P = (r) => getP(E(r.h), r.k);
  const S = (r, p) => { if (!isFixed(r)) { before(E(r.h)); setP(E(r.h), r.k, p); } };
  const touched = new Set(), seen = new Set();
  const before = (e) => { if (e && !seen.has(e)) { seen.add(e); touchFn?.(e); } };
  const markT = (r) => { const e = E(r.h); if (e) touched.add(e); };
  // mueve dos puntos hacia sus objetivos según cuáles estén libres
  const pair = (A, B, tA, tB) => { if (!isFixed(A)) { S(A, tA); markT(A); } if (!isFixed(B)) { S(B, tB); markT(B); } };
  // gira la línea [A,B] para que tenga dirección dir (sobre su punto medio o su extremo fijo)
  const orient = (A, B, dir) => {
    const a = P(A), b = P(B); if (!a || !b) return 0;
    let d = G.norm(dir); if (G.dot(d, G.sub(b, a)) < 0) d = G.mul(d, -1);
    const L = G.dist(a, b), fa = isFixed(A), fb = isFixed(B);
    if (fa && fb) return 0;
    let na, nb;
    if (fa) { na = a; nb = G.add(a, G.mul(d, L)); } else if (fb) { nb = b; na = G.sub(b, G.mul(d, L)); } else { const m = G.mid(a, b); na = G.sub(m, G.mul(d, L / 2)); nb = G.add(m, G.mul(d, L / 2)); }
    const err = G.dist(na, a) + G.dist(nb, b);
    pair(A, B, na, nb); return err;
  };
  const lineFree = (refs) => refs && !(isFixed(refs[0]) && isFixed(refs[1]));
  const apply = (c) => {
    const r = c.refs;
    switch (c.type) {
      case 'coincident': case 'concentric': {
        const A = c.type === 'concentric' ? { h: r[0].h, k: 'c' } : r[0], B = c.type === 'concentric' ? { h: r[1].h, k: 'c' } : r[1];
        const a = P(A), b = P(B); if (!a || !b) return 0; const err = G.dist(a, b); if (err < 1e-12) return 0;
        const fa = isFixed(A), fb = isFixed(B); if (fa && fb) return 0;
        const t = fa ? a : fb ? b : G.mid(a, b); pair(A, B, t, t); return err;
      }
      case 'fix': { const a = P(r[0]); if (!a || !c.pos) return 0; const err = G.dist(a, c.pos); if (err > 1e-12) { before(E(r[0].h)); setP(E(r[0].h), r[0].k, c.pos); markT(r[0]); } return err; }
      case 'horizontal': case 'vertical': {
        const L = lineRefs(r[0], E(r[0].h)); if (!L) return 0; const a = P(L[0]), b = P(L[1]);
        const k = c.type === 'horizontal' ? 'y' : 'x'; const err = Math.abs(a[k] - b[k]); if (err < 1e-12) return 0;
        const fa = isFixed(L[0]), fb = isFixed(L[1]); if (fa && fb) return 0;
        const v = fa ? a[k] : fb ? b[k] : (a[k] + b[k]) / 2;
        pair(L[0], L[1], { ...a, [k]: v }, { ...b, [k]: v }); return err;
      }
      case 'parallel': case 'perpendicular': {
        const L1 = lineRefs(r[0], E(r[0].h)), L2 = lineRefs(r[1], E(r[1].h)); if (!L1 || !L2) return 0;
        const d1 = G.sub(P(L1[1]), P(L1[0])), d2 = G.sub(P(L2[1]), P(L2[0]));
        const want = (d) => (c.type === 'parallel' ? d : G.perp(d));
        if (lineFree(L2)) return orient(L2[0], L2[1], want(d1));
        if (lineFree(L1)) return orient(L1[0], L1[1], want(d2));
        return 0;
      }
      case 'collinear': {
        const L1 = lineRefs(r[0], E(r[0].h)), L2 = lineRefs(r[1], E(r[1].h)); if (!L1 || !L2) return 0;
        const [S1, S2] = lineFree(L2) ? [L1, L2] : [L2, L1];
        const a = P(S1[0]), d = G.norm(G.sub(P(S1[1]), a)); let err = 0;
        for (const R2 of S2) { const p = P(R2), q = G.add(a, G.mul(d, G.dot(G.sub(p, a), d))); err += G.dist(p, q); if (!isFixed(R2)) { S(R2, q); markT(R2); } }
        return err;
      }
      case 'equal': {
        const e1 = E(r[0].h), e2 = E(r[1].h); if (!e1 || !e2) return 0;
        if ((e1.type === 'CIRCLE' || e1.type === 'ARC') && (e2.type === 'CIRCLE' || e2.type === 'ARC')) {
          const err = Math.abs(e1.r - e2.r); if (err < 1e-12) return 0;
          const f1 = pinned.has(e1), f2 = pinned.has(e2); if (f1 && f2) return 0;
          const v = f1 ? e1.r : f2 ? e2.r : (e1.r + e2.r) / 2; if (!f1) { before(e1); e1.r = v; invalidate(e1); touched.add(e1); } if (!f2) { before(e2); e2.r = v; invalidate(e2); touched.add(e2); } return err;
        }
        const L1 = lineRefs(r[0], e1), L2 = lineRefs(r[1], e2); if (!L1 || !L2) return 0;
        const l1 = G.dist(P(L1[0]), P(L1[1])), l2 = G.dist(P(L2[0]), P(L2[1])); const err = Math.abs(l1 - l2); if (err < 1e-12) return 0;
        const F1 = !lineFree(L1), F2 = !lineFree(L2); if (F1 && F2) return 0;
        const v = F1 ? l1 : F2 ? l2 : (l1 + l2) / 2;
        for (const L of [L1, L2]) if (lineFree(L)) setLen(L, v);
        return err;
      }
      case 'tangent': {
        const eL = E(r[0].h), eC = E(r[1].h); if (!eL || !eC || !eC.c) return 0;
        const L = lineRefs(r[0], eL); if (!L) return 0; const a = P(L[0]), b = P(L[1]); const n = G.norm(G.perp(G.sub(b, a)));
        const dd = G.dot(G.sub(eC.c, a), n), want = Math.sign(dd || 1) * eC.r, err = Math.abs(dd - want); if (err < 1e-12) return 0;
        if (!pinned.has(eC)) { before(eC); eC.c = G.add(eC.c, G.mul(n, want - dd)); invalidate(eC); touched.add(eC); }
        else if (lineFree(L)) { const m = G.mul(n, dd - want); pair(L[0], L[1], G.add(a, m), G.add(b, m)); }
        return err;
      }
      case 'dradius': case 'ddiameter': {
        const e = E(r[0].h); if (!e) return 0; const v = c.type === 'dradius' ? c.value : c.value / 2;
        const err = Math.abs(e.r - v); if (err > 1e-12) { before(e); e.r = v; invalidate(e); touched.add(e); } return err;
      }
      case 'dlinear': case 'dhorizontal': case 'dvertical': case 'daligned': {
        const A = r[0], B = r[1]; const a = P(A), b = P(B); if (!a || !b) return 0;
        let mode = c.type === 'dhorizontal' ? 'h' : c.type === 'dvertical' ? 'v' : c.type === 'daligned' ? 'a' : (c.mode || 'a');
        const v = c.value;
        let na = a, nb = b, err;
        if (mode === 'h' || mode === 'v') {
          const k = mode === 'h' ? 'x' : 'y', cur = b[k] - a[k], s = Math.sign(cur || 1), t = s * v; err = Math.abs(cur - t); if (err < 1e-12) return 0;
          const fa = isFixed(A), fb = isFixed(B); if (fa && fb) return 0;
          if (fa) nb = { ...b, [k]: a[k] + t }; else if (fb) na = { ...a, [k]: b[k] - t }; else { const m = (a[k] + b[k]) / 2; na = { ...a, [k]: m - t / 2 }; nb = { ...b, [k]: m + t / 2 }; }
        } else {
          const cur = G.dist(a, b); err = Math.abs(cur - v); if (err < 1e-12) return 0;
          const d = cur > 1e-12 ? G.norm(G.sub(b, a)) : { x: 1, y: 0 }; const fa = isFixed(A), fb = isFixed(B); if (fa && fb) return 0;
          if (fa) nb = G.add(a, G.mul(d, v)); else if (fb) na = G.sub(b, G.mul(d, v)); else { const m = G.mid(a, b); na = G.sub(m, G.mul(d, v / 2)); nb = G.add(m, G.mul(d, v / 2)); }
        }
        pair(A, B, na, nb); return err;
      }
      case 'dangular': {
        const L1 = lineRefs(r[0], E(r[0].h)), L2 = lineRefs(r[1], E(r[1].h)); if (!L1 || !L2) return 0;
        const d1 = G.sub(P(L1[1]), P(L1[0])), d2 = G.sub(P(L2[1]), P(L2[0]));
        const cur = Math.atan2(G.cross(d1, d2), G.dot(d1, d2)), want = Math.sign(cur || 1) * c.value; const err = Math.abs(cur - want); if (err < 1e-12) return 0;
        if (lineFree(L2)) return orient(L2[0], L2[1], G.rotate(d1, { x: 0, y: 0 }, want)), err;
        if (lineFree(L1)) return orient(L1[0], L1[1], G.rotate(d2, { x: 0, y: 0 }, -want)), err;
        return 0;
      }
    }
    return 0;
  };
  const setLen = (L, v) => {
    const a = P(L[0]), b = P(L[1]), d = G.norm(G.sub(b, a)); const fa = isFixed(L[0]), fb = isFixed(L[1]);
    if (fa) pair(L[0], L[1], a, G.add(a, G.mul(d, v))); else if (fb) pair(L[0], L[1], G.sub(b, G.mul(d, v)), b); else { const m = G.mid(a, b); pair(L[0], L[1], G.sub(m, G.mul(d, v / 2)), G.add(m, G.mul(d, v / 2))); }
  };
  let err = 0;
  for (let it = 0; it < iters; it++) { err = 0; for (const c of cs) { if (c.off) continue; err = Math.max(err, apply(c) || 0); } if (err < 1e-9) break; }
  return { err, touched };
}

// estado de cada restricción (para resaltar las que no se cumplen)
export function constraintEnts(doc, c) { return [...new Set(c.refs.map((r) => doc.findHandle(r.h)).filter(Boolean))]; }

// puntos que cambiaron en una operación (para fijarlos al resolver)
export function changedPins(tx) {
  const ents = new Set(), keys = new Set();
  for (const op of tx?.ops || []) {
    if (op.k !== 'mod' || !op.before) continue;
    const a = op.before, e = op.e, hid = e.hid;
    const diff = (p, q) => !p || !q || Math.abs(p.x - q.x) > 1e-12 || Math.abs(p.y - q.y) > 1e-12;
    if (e.type === 'LINE') { if (diff(a.p1, e.p1)) keys.add(hid + ':p1'); if (diff(a.p2, e.p2)) keys.add(hid + ':p2'); }
    else if (e.type === 'LWPOLYLINE') e.pts.forEach((v, i) => { if (diff(a.pts?.[i], v) || a.pts?.length !== e.pts.length) keys.add(hid + ':v' + i); });
    else if (e.type === 'CIRCLE' || e.type === 'ARC') { if (diff(a.c, e.c)) keys.add(hid + ':c'); if (Math.abs((a.r || 0) - e.r) > 1e-12) ents.add(e); if (e.type === 'ARC') { if (a.a1 !== e.a1) keys.add(hid + ':a1'); if (a.a2 !== e.a2) keys.add(hid + ':a2'); } if (diff(a.c, e.c)) ents.add(e); }
    else ents.add(e);
  }
  return { ents, keys };
}
