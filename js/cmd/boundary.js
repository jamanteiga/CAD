// Detección de contorno cerrado (BOUNDARY / HATCH por punto interior)
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';

function segmentsOf(app) {
  const doc = app.doc, view = app.view, segs = [], closedEnts = [];
  const vb = view.worldBB();
  for (const e of doc.space) {
    if (!doc.isVisible(e) || e.type === 'HATCH' || e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'DIMENSION' || e.type === 'POINT') continue;
    const bb = E.entBBox(e, doc);
    if (e.type !== 'XLINE' && e.type !== 'RAY' && G.bbValid(bb) && !G.bbOverlap(bb, vb)) continue;
    if ((e.type === 'CIRCLE') || (e.type === 'LWPOLYLINE' && e.closed) || (e.type === 'ELLIPSE' && Math.abs(G.arcSweep(e.a1 ?? 0, e.a2 ?? G.TAU) - G.TAU) < 1e-6) || (e.type === 'SPLINE' && e.closed)) closedEnts.push(e);
    for (const p of E.prims(e, doc)) {
      if (p.k === 'L') { if (G.dist(p.a, p.b) > 1e-12) segs.push([p.a, p.b]); }
      else {
        const pts = G.tessArc(p.c, p.r, p.full ? 0 : p.a1, p.full ? G.TAU - 1e-12 : p.a2, p.full ? 96 : Math.max(4, Math.ceil(G.arcSweep(p.a1, p.a2) / (G.TAU / 96))));
        if (p.full) pts[pts.length - 1] = pts[0];
        for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i], pts[i + 1]]);
      }
    }
  }
  return { segs, closedEnts };
}

export function findBoundary(app, p) {
  const { segs, closedEnts } = segmentsOf(app);
  if (!segs.length) return null;
  let bb = G.bbNew(); for (const s of segs) { G.bbAdd(bb, s[0]); G.bbAdd(bb, s[1]); }
  const size = Math.max(bb.x2 - bb.x1, bb.y2 - bb.y1) || 1;
  const tol = size * 1e-9 + 1e-9;
  // rejilla espacial
  const N = Math.max(1, Math.min(256, Math.ceil(Math.sqrt(segs.length / 4))));
  const cw = (bb.x2 - bb.x1) / N || 1, ch = (bb.y2 - bb.y1) / N || 1;
  const cells = new Map();
  segs.forEach((s, i) => {
    const x1 = Math.floor((Math.min(s[0].x, s[1].x) - bb.x1) / cw), x2 = Math.floor((Math.max(s[0].x, s[1].x) - bb.x1) / cw);
    const y1 = Math.floor((Math.min(s[0].y, s[1].y) - bb.y1) / ch), y2 = Math.floor((Math.max(s[0].y, s[1].y) - bb.y1) / ch);
    for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) { const k = x * 1000 + y; if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); }
  });
  const cuts = segs.map(() => [0, 1]);
  const done = new Set();
  for (const list of cells.values()) {
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const i = list[a], j = list[b], key = i < j ? i * 1e7 + j : j * 1e7 + i;
      if (done.has(key)) continue; done.add(key);
      const r = G.llInter(segs[i][0], segs[i][1], segs[j][0], segs[j][1]);
      if (r.length) { cuts[i].push(r[0].t); cuts[j].push(r[0].u); }
      else { // solapes colineales / extremos tocando interior
        for (const [s, t, ci] of [[segs[i], segs[j], i], [segs[j], segs[i], j]]) for (const q of t) {
          const d = G.sub(s[1], s[0]), L = G.dot(d, d); const u = G.dot(G.sub(q, s[0]), d) / L;
          if (u > 0 && u < 1 && G.dist(G.add(s[0], G.mul(d, u)), q) < tol * 10) cuts[ci].push(u);
        }
      }
    }
  }
  // vértices y aristas
  const verts = [], vmap = new Map();
  const q = (v) => Math.round(v / (tol * 1000));
  const vid = (p) => {
    const k = q(p.x) + ',' + q(p.y);
    let id = vmap.get(k);
    if (id === undefined) { id = verts.length; verts.push({ x: p.x, y: p.y, out: [] }); vmap.set(k, id); }
    return id;
  };
  const edges = [];
  segs.forEach((s, i) => {
    const ts = [...new Set(cuts[i].map((t) => Math.min(1, Math.max(0, t))))].sort((a, b) => a - b);
    for (let k = 0; k < ts.length - 1; k++) {
      if (ts[k + 1] - ts[k] < 1e-12) continue;
      const a = vid(G.lerp(s[0], s[1], ts[k])), b = vid(G.lerp(s[0], s[1], ts[k + 1]));
      if (a === b) continue;
      edges.push([a, b]);
    }
  });
  const ekey = new Set(); const he = [];
  for (const [a, b] of edges) {
    const k = a < b ? a + '_' + b : b + '_' + a; if (ekey.has(k)) continue; ekey.add(k);
    const i = he.length;
    he.push({ from: a, to: b, twin: i + 1 }, { from: b, to: a, twin: i });
    verts[a].out.push(i); verts[b].out.push(i + 1);
  }
  for (const v of verts) for (const h of v.out) he[h].ang = G.ang(v, verts[he[h].to]);
  const next = (h) => {
    const e = he[h], v = verts[e.to], back = G.normA(he[e.twin].ang);
    let best = -1, bd = Infinity;
    for (const o of v.out) {
      if (o === e.twin && v.out.length > 1) continue;
      let d = G.normA(back - he[o].ang); if (d < 1e-12) d = G.TAU;
      if (d < bd) { bd = d; best = o; }
    }
    return best < 0 ? e.twin : best;
  };
  // rayo hacia +x (ligeramente inclinado)
  const dir = { x: 1, y: 1e-7 }, far = G.add(p, G.mul(dir, size * 10 + 1e6));
  const tryFace = (startH) => {
    const loop = []; let h = startH, n = 0;
    do { loop.push(verts[he[h].from]); h = next(h); if (++n > 200000) return null; } while (h !== startH);
    const pts = loop.map((v) => ({ x: v.x, y: v.y }));
    if (G.polyArea(pts) <= 0) return null;
    if (!G.ptInPoly(p, pts)) return null;
    return pts;
  };
  const hits = [];
  for (let h = 0; h < he.length; h += 2) {
    const a = verts[he[h].from], b = verts[he[h].to];
    const r = G.llInter(p, far, a, b);
    if (r.length) hits.push({ t: r[0].t, h });
  }
  hits.sort((x, y) => x.t - y.t);
  let outer = null;
  for (const hit of hits) {
    const e = he[hit.h], a = verts[e.from], b = verts[e.to];
    const up = b.y - a.y > 0 ? hit.h : e.twin; // p a la izquierda
    outer = tryFace(up);
    if (outer) break;
  }
  if (!outer) return null;
  const clean = simplify(outer);
  const loops = [clean.map((v) => ({ x: v.x, y: v.y, b: 0 }))];
  // islas: entidades cerradas completamente dentro
  const ob = G.bbNew(); clean.forEach((v) => G.bbAdd(ob, v));
  for (const e of closedEnts) {
    const b = E.entBBox(e, app.doc);
    if (!G.bbInside(b, ob) || (b.x2 - b.x1) >= (ob.x2 - ob.x1) - tol) continue;
    let pts;
    if (e.type === 'CIRCLE') pts = [{ x: e.c.x - e.r, y: e.c.y, b: 1 }, { x: e.c.x + e.r, y: e.c.y, b: 1 }];
    else if (e.type === 'LWPOLYLINE') pts = e.pts.map((v) => ({ ...v }));
    else pts = (e.type === 'ELLIPSE' ? E.ellipsePoints(e) : E.splineTess(e)).map((v) => ({ x: v.x, y: v.y, b: 0 }));
    const testPts = E.polyPoints({ pts, closed: true });
    if (testPts.every((v) => G.ptInPoly(v, clean)) && !G.ptInPoly(p, testPts)) loops.push(pts);
  }
  return loops;
}
function simplify(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = out.length ? out[out.length - 1] : pts[pts.length - 1], b = pts[i], c = pts[(i + 1) % pts.length];
    if (Math.abs(G.cross(G.sub(b, a), G.sub(c, b))) < 1e-12 * (G.dist(a, b) + G.dist(b, c)) ** 2) continue;
    out.push(b);
  }
  return out.length >= 3 ? out : pts;
}
