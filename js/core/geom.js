// Geometría 2D básica
export const EPS = 1e-9;
export const TAU = Math.PI * 2;

export const P = (x, y) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a, k) => ({ x: a.x * k, y: a.y * k });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const cross = (a, b) => a.x * b.y - a.y * b.x;
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const polar = (p, a, d) => ({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d });
export const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const norm = (a) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
export const perp = (a) => ({ x: -a.y, y: a.x });
export const eq = (a, b, t = 1e-7) => Math.abs(a.x - b.x) < t && Math.abs(a.y - b.y) < t;
export const clone = (p) => ({ x: p.x, y: p.y });
export const normA = (a) => { a %= TAU; return a < 0 ? a + TAU : a; };
export const rad = (d) => d * Math.PI / 180;
export const deg = (r) => r * 180 / Math.PI;

export function rotate(p, c, a) {
  const s = Math.sin(a), co = Math.cos(a), dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
}

// ángulo a dentro del arco CCW a1→a2
export function angIn(a, a1, a2) {
  a = normA(a); a1 = normA(a1); a2 = normA(a2);
  if (Math.abs(a2 - a1) < EPS) return true;
  return a1 < a2 ? a >= a1 - 1e-10 && a <= a2 + 1e-10 : a >= a1 - 1e-10 || a <= a2 + 1e-10;
}
export function arcSweep(a1, a2) { let s = normA(a2) - normA(a1); if (s <= EPS) s += TAU; return s; }

// ----- Matriz afín [a b c d e f]: x' = a x + c y + e ; y' = b x + d y + f
export const M = {
  id: () => [1, 0, 0, 1, 0, 0],
  mul(m, n) { // m ∘ n (aplica n primero)
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
      m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  },
  apply(m, p) { return { x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] }; },
  vec(m, p) { return { x: m[0] * p.x + m[2] * p.y, y: m[1] * p.x + m[3] * p.y }; },
  inv(m) {
    const d = m[0] * m[3] - m[1] * m[2] || EPS;
    return [m[3] / d, -m[1] / d, -m[2] / d, m[0] / d, (m[2] * m[5] - m[3] * m[4]) / d, (m[1] * m[4] - m[0] * m[5]) / d];
  },
  det: (m) => m[0] * m[3] - m[1] * m[2],
  scaleOf: (m) => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])),
  angOf: (m) => Math.atan2(m[1], m[0]),
  tr: (dx, dy) => [1, 0, 0, 1, dx, dy],
  rot(a, c = { x: 0, y: 0 }) {
    const s = Math.sin(a), co = Math.cos(a);
    return [co, s, -s, co, c.x - co * c.x + s * c.y, c.y - s * c.x - co * c.y];
  },
  scale(k, c = { x: 0, y: 0 }, ky = k) { return [k, 0, 0, ky, c.x - k * c.x, c.y - ky * c.y]; },
  mirror(p1, p2) {
    const a = ang(p1, p2), c2 = Math.cos(2 * a), s2 = Math.sin(2 * a);
    const m = [c2, s2, s2, -c2, 0, 0];
    const q = M.apply(m, p1);
    m[4] = p1.x - q.x; m[5] = p1.y - q.y; return m;
  },
  // inserción de bloque: base → p con escalas y rotación
  insert(p, sx, sy, rot, base = { x: 0, y: 0 }) {
    const c = Math.cos(rot), s = Math.sin(rot);
    const m = [c * sx, s * sx, -s * sy, c * sy, 0, 0];
    const b = M.vec(m, base);
    m[4] = p.x - b.x; m[5] = p.y - b.y; return m;
  },
};

// ----- bulge → arco
export function bulgeArc(p1, p2, b) {
  const th = 4 * Math.atan(b), d = dist(p1, p2);
  if (d < EPS) return null;
  const r = d / (2 * Math.sin(th / 2));
  const m = mid(p1, p2), h = r * Math.cos(th / 2);
  const dir = norm(sub(p2, p1));
  const c = add(m, mul(perp(dir), h));
  const ccw = b > 0;
  const ra = Math.abs(r);
  let a1 = ang(c, p1), a2 = ang(c, p2);
  return ccw ? { c, r: ra, a1, a2 } : { c, r: ra, a1: a2, a2: a1, cw: true };
}
export function arcBulge(c, r, a1, a2) { return Math.tan(arcSweep(a1, a2) / 4); }

export function tessArc(c, r, a1, a2, n) {
  const sw = arcSweep(a1, a2);
  n = n || Math.max(8, Math.ceil(sw / (Math.PI / 32)));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(polar(c, a1 + sw * i / n, r));
  return pts;
}

// ----- intersecciones de primitivas {k:'L',a,b} | {k:'A',c,r,a1,a2,full}
export function llInter(a, b, c, d, infA = false, infB = false) {
  const r = sub(b, a), s = sub(d, c), den = cross(r, s);
  if (Math.abs(den) < EPS) return [];
  const t = cross(sub(c, a), s) / den, u = cross(sub(c, a), r) / den;
  const tol = 1e-9;
  if ((!infA && (t < -tol || t > 1 + tol)) || (!infB && (u < -tol || u > 1 + tol))) return [];
  return [{ x: a.x + r.x * t, y: a.y + r.y * t, t, u }];
}
export function lcInter(a, b, c, rad, inf = false) {
  const d = sub(b, a), f = sub(a, c);
  const A = dot(d, d), B = 2 * dot(f, d), C = dot(f, f) - rad * rad;
  let disc = B * B - 4 * A * C;
  if (disc < -EPS || A < EPS) return [];
  disc = Math.sqrt(Math.max(0, disc));
  const out = [];
  for (const t of disc < 1e-12 ? [-B / (2 * A)] : [(-B - disc) / (2 * A), (-B + disc) / (2 * A)]) {
    if (inf || (t >= -1e-9 && t <= 1 + 1e-9)) out.push({ x: a.x + d.x * t, y: a.y + d.y * t, t });
  }
  return out;
}
export function ccInter(c1, r1, c2, r2) {
  const d = dist(c1, c2);
  if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9 || d < EPS) return [];
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const p = add(c1, mul(sub(c2, c1), a / d));
  const o = mul(perp(norm(sub(c2, c1))), h);
  return h < 1e-12 ? [p] : [add(p, o), sub(p, o)];
}
export function primInter(p, q, infP = false, infQ = false) {
  let res = [];
  if (p.k === 'L' && q.k === 'L') res = llInter(p.a, p.b, q.a, q.b, infP, infQ);
  else if (p.k === 'L' && q.k === 'A') res = lcInter(p.a, p.b, q.c, q.r, infP).filter((x) => q.full || infQ || angIn(ang(q.c, x), q.a1, q.a2));
  else if (p.k === 'A' && q.k === 'L') return primInter(q, p, infQ, infP);
  else if (p.k === 'A' && q.k === 'A') res = ccInter(p.c, p.r, q.c, q.r).filter((x) => (p.full || infP || angIn(ang(p.c, x), p.a1, p.a2)) && (q.full || infQ || angIn(ang(q.c, x), q.a1, q.a2)));
  return res.map((r) => ({ x: r.x, y: r.y }));
}
export function primNearest(p, pt) {
  if (p.k === 'L') {
    const d = sub(p.b, p.a), L = dot(d, d);
    let t = L < EPS ? 0 : dot(sub(pt, p.a), d) / L;
    t = Math.max(0, Math.min(1, t));
    return add(p.a, mul(d, t));
  }
  const a = ang(p.c, pt);
  if (p.full || angIn(a, p.a1, p.a2)) return polar(p.c, a, p.r);
  const e1 = polar(p.c, p.a1, p.r), e2 = polar(p.c, p.a2, p.r);
  return dist(e1, pt) < dist(e2, pt) ? e1 : e2;
}
export function primPerp(p, from) {
  if (p.k === 'L') {
    const d = sub(p.b, p.a), L = dot(d, d);
    if (L < EPS) return null;
    return add(p.a, mul(d, dot(sub(from, p.a), d) / L));
  }
  return polar(p.c, ang(p.c, from), p.r);
}
export function primDist(p, pt) { return dist(primNearest(p, pt), pt); }
export function primLen(p) { return p.k === 'L' ? dist(p.a, p.b) : p.r * (p.full ? TAU : arcSweep(p.a1, p.a2)); }

export function segDist(p, a, b) { return primDist({ k: 'L', a, b }, p); }

// ----- bbox
export const bbNew = () => ({ x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity });
export function bbAdd(bb, p) { if (p.x < bb.x1) bb.x1 = p.x; if (p.y < bb.y1) bb.y1 = p.y; if (p.x > bb.x2) bb.x2 = p.x; if (p.y > bb.y2) bb.y2 = p.y; return bb; }
export function bbUnion(a, b) { if (!b) return a; a.x1 = Math.min(a.x1, b.x1); a.y1 = Math.min(a.y1, b.y1); a.x2 = Math.max(a.x2, b.x2); a.y2 = Math.max(a.y2, b.y2); return a; }
export const bbValid = (b) => b && isFinite(b.x1) && isFinite(b.x2);
export function bbArc(c, r, a1, a2, full) {
  const bb = bbNew();
  if (full) return { x1: c.x - r, y1: c.y - r, x2: c.x + r, y2: c.y + r };
  bbAdd(bb, polar(c, a1, r)); bbAdd(bb, polar(c, a2, r));
  for (let k = 0; k < 4; k++) if (angIn(k * Math.PI / 2, a1, a2)) bbAdd(bb, polar(c, k * Math.PI / 2, r));
  return bb;
}
export const bbOverlap = (a, b) => a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1;
export const bbInside = (a, b) => a.x1 >= b.x1 && a.x2 <= b.x2 && a.y1 >= b.y1 && a.y2 <= b.y2;
export const ptInBB = (p, b) => p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2;
export function bbTransform(bb, m) {
  const r = bbNew();
  for (const p of [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x1, y: bb.y2 }, { x: bb.x2, y: bb.y2 }]) bbAdd(r, M.apply(m, p));
  return r;
}

// primitiva vs rectángulo (para selección por captura)
export function primCrossesRect(p, bb) {
  const r = [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x2, y: bb.y2 }, { x: bb.x1, y: bb.y2 }];
  if (p.k === 'L') { if (ptInBB(p.a, bb) || ptInBB(p.b, bb)) return true; }
  else {
    const s = p.full ? polar(p.c, 0, p.r) : polar(p.c, p.a1, p.r);
    if (ptInBB(s, bb)) return true;
  }
  for (let i = 0; i < 4; i++) if (primInter(p, { k: 'L', a: r[i], b: r[(i + 1) % 4] }).length) return true;
  return false;
}

export function ptInPoly(pt, pts) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > pt.y) !== (b.y > pt.y) && pt.x < (b.x - a.x) * (pt.y - a.y) / (b.y - a.y) + a.x) ins = !ins;
  }
  return ins;
}
export function polyArea(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a.x * b.y - b.x * a.y; } return s / 2; }

// B-spline (de Boor) → puntos
export function splinePoints(deg_, cps, knots, weights, n = 0) {
  if (!cps || cps.length < 2) return cps || [];
  const p = Math.min(deg_ || 3, cps.length - 1);
  if (!knots || knots.length !== cps.length + p + 1) {
    knots = [];
    const m = cps.length + p + 1;
    for (let i = 0; i < m; i++) knots.push(i <= p ? 0 : i >= m - p - 1 ? 1 : (i - p) / (m - 2 * p - 1));
  }
  const w = weights && weights.length === cps.length ? weights : cps.map(() => 1);
  const t0 = knots[p], t1 = knots[knots.length - p - 1];
  n = n || Math.max(32, cps.length * 10);
  const out = [];
  for (let i = 0; i <= n; i++) {
    let t = t0 + (t1 - t0) * i / n;
    if (i === n) t = t1 - 1e-10;
    let k = p; while (k < knots.length - p - 2 && t >= knots[k + 1]) k++;
    const d = [];
    for (let j = 0; j <= p; j++) { const c = cps[k - p + j], ww = w[k - p + j]; d.push({ x: c.x * ww, y: c.y * ww, w: ww }); }
    for (let r = 1; r <= p; r++) for (let j = p; j >= r; j--) {
      const i2 = k - p + j, den = knots[i2 + p - r + 1] - knots[i2];
      const a = den < EPS ? 0 : (t - knots[i2]) / den;
      d[j] = { x: (1 - a) * d[j - 1].x + a * d[j].x, y: (1 - a) * d[j - 1].y + a * d[j].y, w: (1 - a) * d[j - 1].w + a * d[j].w };
    }
    out.push({ x: d[p].x / d[p].w, y: d[p].y / d[p].w });
  }
  return out;
}
// Spline interpolante (Catmull-Rom) por puntos de ajuste
export function fitPoints(pts, closed = false) {
  if (pts.length < 3) return pts.slice();
  const out = [], n = pts.length, seg = 12;
  const g = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(closed ? pts[0] : pts[n - 1]);
  return out;
}

export function fmt(v, dec = 4) {
  if (typeof v !== 'number' || !isFinite(v)) return String(v);
  const s = v.toFixed(dec);
  return s.includes('.') ? s.replace(/\.?0+$/, '') || '0' : s;
}
