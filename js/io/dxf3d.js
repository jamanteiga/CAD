// DXF en 3D: coordenadas Z, sistema de coordenadas de objeto (OCS, dirección de extrusión 210/220/230),
// polilíneas 3D, mallas (POLYFACE, malla poligonal, MESH) y caras 3D.
// Cada objeto plano se guarda en las coordenadas 2D de su plano (e.wp, ver core/plane3d.js);
// las superficies se guardan como sólidos de malla abiertos (3DSOLID kind 'mesh', surf).
import * as P3 from '../core/plane3d.js';

const gv = (g, c) => { const x = g.find((p) => p[0] === c); return x ? x[1].trim() : undefined; };
const ga = (g, c) => g.filter((p) => p[0] === c).map((p) => p[1].trim());
const gn = (g, c, d = 0) => { const v = gv(g, c); return v == null || v === '' ? d : +v; };
const p3 = (g, c) => [gn(g, c), gn(g, c + 10), gn(g, c + 20)];
const EPS = 1e-9;

export const extrusion = (g) => P3.unit([gn(g, 210, 0), gn(g, 220, 0), gn(g, 230, 1)]);
export const isZ = (N) => Math.abs(N[0]) < 1e-9 && Math.abs(N[1]) < 1e-9;
// algoritmo del eje arbitrario del DXF: ejes X e Y del OCS a partir de la normal
export function ocsAxes(N) {
  const ax = Math.abs(N[0]) < 1 / 64 && Math.abs(N[1]) < 1 / 64 ? P3.unit(P3.cross([0, 1, 0], N)) : P3.unit(P3.cross([0, 0, 1], N));
  return [ax, P3.unit(P3.cross(N, ax))];
}
export function ocsPlane(N, elev) { const [u, v] = ocsAxes(N); return P3.plane(P3.mul(N, elev), u, v); }
const flat = (pl) => (pl && !P3.isWorld(pl) ? pl : null);
const elevPlane = (z) => (Math.abs(z) > EPS ? P3.plane([0, 0, z], [1, 0, 0], [0, 1, 0]) : null);

// Tipos con coordenadas en el OCS y su elevación
const OCS_ELEV = { CIRCLE: 30, ARC: 30, TEXT: 30, ATTDEF: 30, ATTRIB: 30, INSERT: 30, ACAD_TABLE: 30, SOLID: 30, TRACE: 30, HATCH: 30, LWPOLYLINE: 38, POLYLINE: 30 };
// ¿hay que leer este objeto sin la simetría 2D de extrusión (0,0,-1)? (normal no vertical)
export const needsRawOcs = (type, g) => OCS_ELEV[type] != null && !isZ(extrusion(g));

// plano de trabajo de un objeto ya convertido a 2D; devuelve el objeto (o varios) en 3D
export function to3D(type, g, e, extra) {
  if (!e) return e;
  if (Array.isArray(e)) return e;
  const N = extrusion(g);
  if (OCS_ELEV[type] != null) {
    if (type === 'POLYLINE') { const fl = gn(g, 70); if (fl & (8 | 16 | 64)) return e; }
    const z = gn(g, OCS_ELEV[type]);
    const pl = isZ(N) ? elevPlane(N[2] < 0 ? -z : z) : ocsPlane(N, z);
    if (pl) e.wp = pl;
    return e;
  }
  switch (type) {
    case 'LINE': {
      const a = p3(g, 10), b = p3(g, 11);
      if (Math.abs(a[2] - b[2]) < EPS) { const pl = elevPlane(a[2]); if (pl) e.wp = pl; return e; }
      const u = P3.unit(P3.sub(b, a)); let v = P3.sub([0, 0, 1], P3.mul(u, u[2]));
      if (Math.hypot(...v) < 1e-6) v = P3.sub([1, 0, 0], P3.mul(u, u[0]));
      e.wp = P3.plane(a, u, P3.unit(v)); e.p1 = { x: 0, y: 0 }; e.p2 = { x: Math.hypot(...P3.sub(b, a)), y: 0 };
      return e;
    }
    case 'POINT': { const pl = elevPlane(gn(g, 30)); if (pl) e.wp = pl; return e; }
    case 'ELLIPSE': {
      const c = p3(g, 10), m = p3(g, 11);
      if (isZ(N) && N[2] > 0) { const pl = elevPlane(c[2]); if (pl) e.wp = pl; return e; }
      const u = P3.unit(m), v = P3.unit(P3.cross(N, u));
      e.wp = P3.plane(c, u, v); e.c = { x: 0, y: 0 }; e.major = { x: Math.hypot(...m), y: 0 };
      return e;
    }
    case 'MTEXT': {
      const p = p3(g, 10);
      if (isZ(N) && N[2] > 0) { const pl = elevPlane(p[2]); if (pl) e.wp = pl; return e; }
      let u = gv(g, 11) != null ? p3(g, 11) : ocsAxes(N)[0];
      u = P3.unit(P3.sub(u, P3.mul(N, P3.dot(u, N))));
      e.wp = P3.plane(p, u, P3.unit(P3.cross(N, u))); e.p = { x: 0, y: 0 }; e.rot = 0;
      return e;
    }
    case 'SPLINE': case 'LEADER': {
      const zs = ga(g, 30).map(Number);
      if (zs.length && zs.every((z) => Math.abs(z - zs[0]) < 1e-6)) { const pl = elevPlane(zs[0]); if (pl) e.wp = pl; }
      return e;
    }
  }
  return e;
}

// polilínea 3D: si es plana, una polilínea en su plano; si no, un tramo de línea por segmento
export function poly3D(pts, closed, c) {
  if (pts.length < 2) return [];
  const pl = fitPlane(pts);
  if (pl) {
    const loc = pts.map((p) => P3.fromW(pl, p));
    if (loc.every((q) => Math.abs(q.z) < 1e-6 * (1 + Math.abs(q.x) + Math.abs(q.y)))) {
      const e = { type: 'LWPOLYLINE', ...c, pts: loc.map((q) => ({ x: q.x, y: q.y, b: 0 })), closed };
      if (!P3.isWorld(pl)) e.wp = pl;
      return [e];
    }
  }
  const out = [], n = closed ? pts.length : pts.length - 1;
  for (let k = 0; k < n; k++) out.push(line3D(pts[k], pts[(k + 1) % pts.length], c));
  return out.filter(Boolean);
}
export function line3D(a, b, c) {
  const L = Math.hypot(...P3.sub(b, a)); if (L < EPS) return null;
  if (Math.abs(a[2] - b[2]) < EPS) { const e = { type: 'LINE', ...c, p1: { x: a[0], y: a[1] }, p2: { x: b[0], y: b[1] } }; const pl = elevPlane(a[2]); if (pl) e.wp = pl; return e; }
  const u = P3.unit(P3.sub(b, a)); let v = P3.sub([0, 0, 1], P3.mul(u, u[2]));
  if (Math.hypot(...v) < 1e-6) v = P3.sub([1, 0, 0], P3.mul(u, u[0]));
  return { type: 'LINE', ...c, wp: P3.plane(a, u, P3.unit(v)), p1: { x: 0, y: 0 }, p2: { x: L, y: 0 } };
}
// plano medio de unos puntos (si están en un plano horizontal, el XY a su cota)
function fitPlane(pts) {
  if (pts.every((p) => Math.abs(p[2] - pts[0][2]) < 1e-9)) return Math.abs(pts[0][2]) < 1e-12 ? P3.WORLD : elevPlane(pts[0][2]);
  const o = pts[0]; let n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); }
  if (Math.hypot(...n) < 1e-12) return null;
  n = P3.unit(n);
  const [u, v] = ocsAxes(n);
  return P3.plane(o, u, v);
}
// superficie de malla (caras 3D, mallas de caras y MESH)
export const surface = (polys, c) => (polys.length ? { type: '3DSOLID', kind: 'mesh', surf: true, ...c, polys } : null);

// POLYLINE de caras (70 & 64) y malla poligonal (70 & 16), y polilínea 3D (70 & 8)
export function polyline3D(g, verts, c) {
  const fl = gn(g, 70);
  if (fl & 64) {
    const vs = verts.filter((v) => gn(v, 70) & 64).map((v) => p3(v, 10)), polys = [];
    for (const v of verts) if ((gn(v, 70) & 128) && !(gn(v, 70) & 64)) {
      const idx = [71, 72, 73, 74].map((k) => Math.abs(gn(v, k))).filter((k) => k > 0 && vs[k - 1]);
      if (idx.length >= 3) polys.push(idx.map((k) => vs[k - 1]));
    }
    return [surface(polys, c)].filter(Boolean);
  }
  if (fl & 16) {
    const m = gn(g, 71), n = gn(g, 72), vs = verts.map((v) => p3(v, 10)), polys = [];
    const cm = !!(fl & 1), cn = !!(fl & 32);
    for (let a = 0; a < (cm ? m : m - 1); a++) for (let b = 0; b < (cn ? n : n - 1); b++) {
      const A = vs[a * n + b], B = vs[a * n + (b + 1) % n], C = vs[((a + 1) % m) * n + (b + 1) % n], D = vs[((a + 1) % m) * n + b];
      if (A && B && C && D) polys.push([A, B, C, D]);
    }
    return [surface(polys, c)].filter(Boolean);
  }
  if (fl & 8) return poly3D(verts.filter((v) => !(gn(v, 70) & 16)).map((v) => p3(v, 10)), !!(fl & 1), c);
  return null;
}
export function face3D(g, c) {
  const ps = [10, 11, 12, 13].map((k) => p3(g, k));
  if (Math.hypot(...P3.sub(ps[3], ps[2])) < 1e-12) ps.pop();
  return { ...surface([ps], c), _f3d: true };
}
// entidad MESH (subdivisión): vértices (92) y caras (93)
export function meshEnt(g, c) {
  let k = g.findIndex((p) => p[0] === 92); if (k < 0) return null;
  const nv = +g[k][1], vs = [];
  for (k++; k < g.length && vs.length < nv; k++) if (g[k][0] === 10) vs.push([+g[k][1], +(g[k + 1]?.[1] || 0), +(g[k + 2]?.[1] || 0)]);
  const f = g.findIndex((p, i) => i >= k && p[0] === 93); if (f < 0) return null;
  const nf = +g[f][1], ids = []; for (let i = f + 1; i < g.length && ids.length < nf; i++) if (g[i][0] === 90) ids.push(+g[i][1]);
  const polys = []; for (let i = 0; i < ids.length;) { const n = ids[i++]; const face = ids.slice(i, i + n).map((j) => vs[j]).filter(Boolean); i += n; if (face.length >= 3) polys.push(face); }
  return surface(polys, c);
}
// une caras 3D consecutivas de la misma capa y color en una sola superficie
export function mergeFaces(list) {
  const out = []; let cur = null;
  for (const e of list) {
    if (e?._f3d) {
      if (cur && cur.layer === e.layer && cur.color === e.color && (cur.tc || '') === (e.tc || '') && cur.polys.length < 20000) { cur.polys.push(...e.polys); continue; }
      delete e._f3d; cur = e; out.push(e); continue;
    }
    cur = null; out.push(e);
  }
  return out;
}

// ---- bloques con contenido 3D: las inserciones se descomponen en el espacio modelo (escala uniforme)
const is3D = (e) => (e.wp && !P3.isWorld(e.wp)) || e.type === '3DSOLID';
export function explode3DInserts(doc, ents, M, E) {
  const blk3 = new Map();
  const check = (name, seen = new Set()) => {
    if (blk3.has(name)) return blk3.get(name);
    const b = doc.blocks[name]; if (!b || seen.has(name)) return false; seen.add(name);
    const r = b.ents.some((e) => is3D(e) || (e.type === 'INSERT' && (e.wp || check(e.name, seen)))) || Math.abs(b.base.z || 0) > EPS;
    blk3.set(name, r); return r;
  };
  let n = 0;
  const out = [];
  const expand = (ins, depth) => {
    const b = doc.blocks[ins.name];
    const s = ins.sx ?? 1;
    if (!b || depth > 8 || Math.abs(Math.abs(ins.sy ?? 1) - Math.abs(s)) > 1e-9 || Math.abs(Math.abs(ins.sz ?? s) - Math.abs(s)) > 1e-9 || s <= 0 || (ins.sy ?? 1) <= 0 || ins.cols > 1 || ins.rows > 1) return [ins];
    // transformación del bloque: universal = Pins( giro·escala·(q − base) + p )
    const pl = ins.wp || P3.WORLD, base = [b.base.x, b.base.y, b.base.z || 0], rot = ins.rot || 0, cr = Math.cos(rot), sr = Math.sin(rot);
    const T = (q) => { const x = (q[0] - base[0]) * s, y = (q[1] - base[1]) * s, z = (q[2] - base[2]) * s; return P3.toW(pl, { x: x * cr - y * sr + ins.p.x, y: x * sr + y * cr + ins.p.y, z: z + (ins.pz || 0) }); };
    const Td = (d) => { const x = d[0] * s, y = d[1] * s; const a = P3.toW(pl, { x: x * cr - y * sr, y: x * sr + y * cr, z: d[2] * s }); return P3.sub(a, pl.o); };
    const res = [];
    for (const c0 of b.ents) {
      if (c0.type === 'ATTDEF') continue;
      const c = E.cloneEnt(c0); delete c.hid; delete c.bid;
      if (c.layer === '0') c.layer = ins.layer;
      if (c.color === 0) c.color = ins.color;
      if (c.type === 'INSERT') { if (c.wp || check(c.name)) { const sub = expand(c, depth + 1); for (const x of sub) res.push(x === c ? place(c) : x); continue; } }
      if (c.type === '3DSOLID' && c.kind === 'mesh' && !c.local) { c.polys = c.polys.map((f) => f.map(T)); res.push(c); continue; }
      res.push(place(c));
    }
    function place(c) {
      const cp = c.wp || P3.WORLD;
      if (Math.abs(s - 1) > 1e-12) E.transformEnt(c, M.scale(s));
      const o = T(cp.o), u = P3.unit(Td(cp.u)), v = P3.unit(Td(cp.v));
      c.wp = P3.plane(o, u, v); if (P3.isWorld(c.wp)) delete c.wp;
      return c;
    }
    n++;
    return res;
  };
  for (const e of ents) {
    if (e.type === 'INSERT' && (e.wp || check(e.name)) && !(e.attribs?.length)) out.push(...expand(e, 0));
    else out.push(e);
  }
  return { ents: out, n };
}
// ¿tiene el dibujo contenido 3D? (para abrirlo en vista isométrica)
export const has3D = (ents) => ents.some(is3D);
