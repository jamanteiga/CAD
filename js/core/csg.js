// Operaciones booleanas de mallas por árboles BSP (adaptación compacta de csg.js de Evan Wallace, licencia MIT).
const EPS = 1e-5;
const v = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};
class Plane {
  constructor(n, w) { this.n = n; this.w = w; }
  static from(a, b, c) { const n = v.norm(v.cross(v.sub(b, a), v.sub(c, a))); return new Plane(n, v.dot(n, a)); }
  clone() { return new Plane(this.n.slice(), this.w); }
  flip() { this.n = v.mul(this.n, -1); this.w = -this.w; }
  split(poly, cf, cb, f, b) {
    const COP = 0, FR = 1, BK = 2, SP = 3;
    let pt = 0; const types = [];
    for (const p of poly.vs) { const t = v.dot(this.n, p) - this.w; const ty = t < -EPS ? BK : t > EPS ? FR : COP; pt |= ty; types.push(ty); }
    if (pt === COP) (v.dot(this.n, poly.plane.n) > 0 ? cf : cb).push(poly);
    else if (pt === FR) f.push(poly);
    else if (pt === BK) b.push(poly);
    else {
      const fs = [], bs = [];
      for (let i = 0; i < poly.vs.length; i++) {
        const j = (i + 1) % poly.vs.length, ti = types[i], tj = types[j], vi = poly.vs[i], vj = poly.vs[j];
        if (ti !== BK) fs.push(vi);
        if (ti !== FR) bs.push(ti !== BK ? vi.slice() : vi);
        if ((ti | tj) === SP) { const t = (this.w - v.dot(this.n, vi)) / v.dot(this.n, v.sub(vj, vi)); const p = v.lerp(vi, vj, t); fs.push(p); bs.push(p.slice()); }
      }
      if (fs.length >= 3) f.push(new Poly(fs, poly.shared));
      if (bs.length >= 3) b.push(new Poly(bs, poly.shared));
    }
  }
}
class Poly {
  constructor(vs, shared) { this.vs = vs; this.shared = shared; this.plane = Plane.from(vs[0], vs[1], vs[2]); }
  clone() { return new Poly(this.vs.map((p) => p.slice()), this.shared); }
  flip() { this.vs.reverse(); this.plane.flip(); }
}
class Node {
  constructor(polys) { this.plane = null; this.front = null; this.back = null; this.polys = []; if (polys) this.build(polys); }
  invert() { for (const p of this.polys) p.flip(); this.plane?.flip(); this.front?.invert(); this.back?.invert(); [this.front, this.back] = [this.back, this.front]; }
  clipPolys(polys) {
    if (!this.plane) return polys.slice();
    let f = [], b = [];
    for (const p of polys) this.plane.split(p, f, b, f, b);
    if (this.front) f = this.front.clipPolys(f);
    b = this.back ? this.back.clipPolys(b) : [];
    return f.concat(b);
  }
  clipTo(bsp) { this.polys = bsp.clipPolys(this.polys); this.front?.clipTo(bsp); this.back?.clipTo(bsp); }
  all() { let p = this.polys.slice(); if (this.front) p = p.concat(this.front.all()); if (this.back) p = p.concat(this.back.all()); return p; }
  build(polys) {
    if (!polys.length) return;
    if (!this.plane) this.plane = polys[0].plane.clone();
    const f = [], b = [];
    for (const p of polys) this.plane.split(p, this.polys, this.polys, f, b);
    if (f.length) { this.front ||= new Node(); this.front.build(f); }
    if (b.length) { this.back ||= new Node(); this.back.build(b); }
  }
}
const toPolys = (m) => m.f.filter((f) => f.length >= 3).map((f) => f.map((i) => m.v[i].slice())).filter((vs) => Math.hypot(...v.cross(v.sub(vs[1], vs[0]), v.sub(vs[2], vs[0]))) > 1e-12).map((vs) => new Poly(vs));
const clonePolys = (ps) => ps.map((p) => p.clone());
export function union(a, b) { const A = new Node(clonePolys(a)), B = new Node(clonePolys(b)); A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.all()); return A.all(); }
export function subtract(a, b) { const A = new Node(clonePolys(a)), B = new Node(clonePolys(b)); A.invert(); A.clipTo(B); B.clipTo(A); B.invert(); B.clipTo(A); B.invert(); A.build(B.all()); A.invert(); return A.all(); }
export function intersect(a, b) { const A = new Node(clonePolys(a)), B = new Node(clonePolys(b)); A.invert(); B.clipTo(A); B.invert(); A.clipTo(B); B.clipTo(A); A.build(B.all()); A.invert(); return A.all(); }
export const meshToPolys = toPolys;
// polígonos -> lista serializable [[x,y,z],...] por cara
export const polysToList = (ps) => ps.map((p) => p.vs.map((q) => [+q[0].toFixed(9), +q[1].toFixed(9), +q[2].toFixed(9)]));
export const listToPolys = (l) => l.filter((vs) => vs.length >= 3).map((vs) => new Poly(vs.map((q) => q.slice())));
// corte por un plano: conserva la parte del lado de la normal (n·p >= w)
export function halfSpace(n, w, size = 1e6) {
  const nn = v.norm(n), c = v.mul(nn, w);
  // caja enorme del lado positivo del plano
  const u = Math.abs(nn[2]) < 0.9 ? v.norm(v.cross(nn, [0, 0, 1])) : v.norm(v.cross(nn, [1, 0, 0])), t = v.cross(nn, u);
  const P = (a, b, h) => v.add(c, v.add(v.add(v.mul(u, a * size), v.mul(t, b * size)), v.mul(nn, h * size)));
  const q = [P(-1, -1, 0), P(1, -1, 0), P(1, 1, 0), P(-1, 1, 0)], r = [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)];
  const faces = [[q[3], q[2], q[1], q[0]], [r[0], r[1], r[2], r[3]], [q[0], q[1], r[1], r[0]], [q[1], q[2], r[2], r[1]], [q[2], q[3], r[3], r[2]], [q[3], q[0], r[0], r[3]]];
  return faces.map((f) => new Poly(f));
}
export { v as vec3 };
