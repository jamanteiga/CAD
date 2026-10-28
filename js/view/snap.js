// Referencia a objetos (OSNAP), ortho, polar y forzcursor
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';

export const OS = { end: 1, mid: 2, cen: 4, nod: 8, qua: 16, int: 32, ins: 64, per: 128, tan: 256, nea: 512, app: 2048, ext: 4096, par: 8192 };
export const OSLABEL = { end: 'Punto final', mid: 'Punto medio', cen: 'Centro', nod: 'Punto', qua: 'Cuadrante', int: 'Intersección', ins: 'Inserción', per: 'Perpendicular', tan: 'Tangente', nea: 'Cercano', ext: 'Extensión', app: 'Intersección ficticia' };
const PRIO = { end: 0, int: 0, cen: 1, mid: 1, qua: 1, nod: 0, ins: 0, per: 2, tan: 2, nea: 5 };

export function osnap(app, wp, base, override) {
  const doc = app.doc, view = app.view;
  const mode = override ? (override === 'non' ? 0 : OS[override] || 0) : (doc.vars.OSMODE & 16384 ? 0 : doc.vars.OSMODE);
  if (!mode) return null;
  const ap = (doc.vars.APERTURE || 10) / view.scale;
  const bb = { x1: wp.x - ap, y1: wp.y - ap, x2: wp.x + ap, y2: wp.y + ap };
  const cands = [];
  for (const e of view.snapEnts(bb)) {
    if (!doc.isVisible(e)) continue;
    const b = E.entBBox(e, doc);
    if (e.type === 'XLINE' || e.type === 'RAY' || (G.bbValid(b) && G.bbOverlap(b, bb))) {
      if (E.entDist(e, wp, doc) <= ap * 1.5 || e.type === 'INSERT' || e.type === 'CIRCLE' || e.type === 'ARC') cands.push(e);
    }
    if (cands.length > 60) break;
  }
  if (!cands.length) return null;
  let best = null;
  const consider = (p, t) => {
    if (!p) return;
    const d = G.dist(p, wp);
    if (d > ap) return;
    const score = d + (PRIO[t] || 0) * ap * 0.15;
    if (!best || score < best.score) best = { p: { x: p.x, y: p.y }, t, score };
  };
  const bitsOk = (t) => mode & OS[t];
  for (const e of cands) for (const s of E.entSnaps(e, doc)) if (bitsOk(s.t)) consider(s.p, s.t);
  const primsC = [];
  if (mode & (OS.int | OS.per | OS.tan | OS.nea | OS.app)) for (const e of cands) primsC.push(...E.prims(e, doc).filter((p) => (p.k === 'L' ? G.primDist(p, wp) < ap * 3 : Math.abs(G.dist(p.c, wp) - p.r) < ap * 3)));
  if (mode & (OS.int | OS.app)) {
    const n = Math.min(primsC.length, 80);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (const x of G.primInter(primsC[i], primsC[j])) consider(x, 'int');
  }
  if ((mode & OS.per) && base) for (const p of primsC) { const f = G.primPerp(p, base); if (f && (p.k === 'L' ? G.primDist(p, f) < 1e-6 : true)) consider(f, 'per'); }
  if ((mode & OS.tan) && base) for (const p of primsC) if (p.k === 'A') {
    const d = G.dist(base, p.c); if (d <= p.r) continue;
    const a = G.ang(p.c, base), b = Math.acos(p.r / d);
    for (const t of [a + b, a - b]) { if (p.full || G.angIn(t, p.a1, p.a2)) consider(G.polar(p.c, t, p.r), 'tan'); }
  }
  if (mode & OS.nea) for (const p of primsC) consider(G.primNearest(p, wp), 'nea');
  return best;
}

export function orthoPoint(base, p, angBase = 0) {
  const d = G.sub(p, base);
  const r = G.rotate(d, { x: 0, y: 0 }, -angBase);
  const q = Math.abs(r.x) >= Math.abs(r.y) ? { x: r.x, y: 0 } : { x: 0, y: r.y };
  return G.add(base, G.rotate(q, { x: 0, y: 0 }, angBase));
}
// ortogonal isométrico: plano izquierdo (90°/150°), superior (30°/150°) o derecho (30°/90°)
export function isoOrthoPoint(base, p, plane = 0) {
  const angs = [[90, 150], [30, 150], [30, 90]][plane] || [90, 150];
  const d = G.sub(p, base); let best = base, bd = -1;
  for (const a of angs) { const u = { x: Math.cos(G.rad(a)), y: Math.sin(G.rad(a)) }; const t = G.dot(d, u); const q = G.add(base, G.mul(u, t)); const k = Math.abs(t); if (k > bd) { bd = k; best = q; } }
  return best;
}
export function polarPoint(base, p, inc, tolDeg = 4) {
  const a = G.deg(G.ang(base, p)), d = G.dist(base, p);
  const k = Math.round(a / inc) * inc;
  if (Math.abs(a - k) <= tolDeg) { const r = G.rad(k); const v = { x: Math.cos(r), y: Math.sin(r) }; return { p: G.add(base, G.mul(v, G.dot(G.sub(p, base), v))), ang: ((k % 360) + 360) % 360, d }; }
  return null;
}
export function gridSnap(p, u) { return { x: Math.round(p.x / u) * u, y: Math.round(p.y / u) * u }; }
