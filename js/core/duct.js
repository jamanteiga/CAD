// Conductos de climatización (DUCT): tramo con codos a lo largo de un camino, etiqueta y cálculo de pérdida de carga.
// e = { type:'DUCT', pts:[{x,y}], shape:'rect'|'round', w, h (mm, rectangular), d (mm, circular), flow (m³/h),
//       sys, ratio (radio de codo / anchura, al eje), zeta (pérdidas singulares extra), eps (rugosidad, mm), label, ins (aislamiento, mm) }
import * as G from './geom.js';

export const SYSTEMS = {
  IMPULSION: { label: 'Impulsión', layer: 'CLIMA-CONDUCTO-IMPULSION', color: 5 },
  RETORNO: { label: 'Retorno', layer: 'CLIMA-CONDUCTO-RETORNO', color: 1 },
  EXTRACCION: { label: 'Extracción', layer: 'CLIMA-CONDUCTO-EXTRACCION', color: 6 },
  EXTERIOR: { label: 'Aire exterior', layer: 'CLIMA-CONDUCTO-AIRE-EXTERIOR', color: 3 },
};
export const RHO = 1.2, NU = 15.1e-6;

export const ductWidth = (e) => (e.shape === 'round' ? e.d : e.w);
export const sectionText = (e) => (e.shape === 'round' ? `Ø${e.d}` : `${e.w}×${e.h}`);
// diámetro equivalente (Huebscher) en mm
export const eqDiameter = (e) => (e.shape === 'round' ? e.d : 1.3 * Math.pow(e.w * e.h, 0.625) / Math.pow(e.w + e.h, 0.25));
export function colebrook(Re, rel) {
  if (Re < 2300) return 64 / Math.max(Re, 1);
  let f = 0.25 / Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)) ** 2; // Swamee-Jain como arranque
  for (let i = 0; i < 30; i++) { const x = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(f))); const nf = 1 / (x * x); if (Math.abs(nf - f) < 1e-12) { f = nf; break; } f = nf; }
  return f;
}
export function pathLength(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += G.dist(pts[i - 1], pts[i]); return L; }
// giros del camino (radianes) en los vértices interiores
export function turns(pts) { const out = []; for (let i = 1; i < pts.length - 1; i++) { const a = G.sub(pts[i], pts[i - 1]), b = G.sub(pts[i + 1], pts[i]); out.push(Math.abs(Math.atan2(G.cross(a, b), G.dot(a, b)))); } return out; }
// coeficiente de pérdida de un codo (rectangular o circular) según el giro y la relación R/W
export function elbowZeta(theta, ratio = 1) {
  const z90 = ratio >= 1.5 ? 0.18 : ratio >= 1 ? 0.22 : ratio >= 0.75 ? 0.3 : 0.45;
  const k = theta / (Math.PI / 2);
  return z90 * (k <= 1 ? 0.3 * k + 0.7 * k * k : k);
}
export function ductCalc(e) {
  const area = e.shape === 'round' ? Math.PI * (e.d / 1000) ** 2 / 4 : (e.w / 1000) * (e.h / 1000);
  const Q = (e.flow || 0) / 3600;
  const v = area > 0 ? Q / area : 0;
  const De = eqDiameter(e) / 1000;
  const Re = De > 0 ? v * De / NU : 0;
  const eps = (e.eps ?? 0.15) / 1000;
  const f = Re > 0 ? colebrook(Re, eps / De) : 0;
  const pd = RHO * v * v / 2;
  const R = De > 0 ? f / De * pd : 0;
  const L = pathLength(e.pts) / 1000;
  const zs = turns(e.pts).map((t) => elbowZeta(t, e.ratio ?? 1));
  const zeta = zs.reduce((a, b) => a + b, 0) + (+e.zeta || 0);
  const dpF = R * L, dpS = zeta * pd;
  const sheet = (e.shape === 'round' ? Math.PI * e.d / 1000 : 2 * (e.w + e.h) / 1000) * L;
  return { area, v, De: De * 1000, Re, f, R, L, elbows: zs.length, zeta, pd, dpF, dpS, dp: dpF + dpS, sheet };
}
// tamaño recomendado: rectangular con alto fijo o circular, por velocidad o por pérdida unitaria
export const STD = [100, 125, 150, 160, 200, 250, 300, 315, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1400, 1600, 1800, 2000];
export function sizeDuct({ flow, shape = 'rect', h = 300, vmax = 6, rmax = 1.0 }) {
  for (const s of STD) {
    const e = shape === 'round' ? { shape, d: s, flow, pts: [] } : { shape, w: s, h, flow, pts: [] };
    if (shape === 'round' && ![100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250].includes(s) && s < 1250) continue;
    const c = ductCalc({ ...e, pts: [{ x: 0, y: 0 }, { x: 1000, y: 0 }] });
    if (c.v <= vmax && c.R <= rmax) return { ...e, calc: c };
  }
  return null;
}

// ---- geometría: lados paralelos al eje con codos de radio (ratio·W) en los vértices
export function ductEnts(e, opts = {}) {
  if (e._duct) return e._duct;
  const out = [], pts = e.pts || [];
  const W = ductWidth(e) || 100, hw = W / 2;
  const base = { layer: e.layer, color: 0 };
  if (pts.length < 2) return (e._duct = out);
  const n = pts.length;
  // recortes en cada vértice interior
  const cut = Array(n).fill(0), corner = [];
  for (let i = 1; i < n - 1; i++) {
    const a = G.norm(G.sub(pts[i], pts[i - 1])), b = G.norm(G.sub(pts[i + 1], pts[i]));
    const th = Math.atan2(G.cross(a, b), G.dot(a, b));
    if (Math.abs(th) < 1e-6) { corner.push(null); continue; }
    let Rc = Math.max(hw * 1.05, W * (e.ratio ?? 1));
    let t = Rc * Math.tan(Math.abs(th) / 2);
    const maxT = Math.min(G.dist(pts[i - 1], pts[i]) * (i === 1 ? 1 : 0.5), G.dist(pts[i], pts[i + 1]) * (i === n - 2 ? 1 : 0.5)) * 0.98;
    if (t > maxT) { t = maxT; Rc = t / Math.tan(Math.abs(th) / 2); }
    cut[i] = t;
    corner.push({ i, a, b, th, Rc, t });
  }
  // tramos rectos
  const segEnds = [];
  for (let i = 0; i < n - 1; i++) {
    const d = G.norm(G.sub(pts[i + 1], pts[i])), nrm = G.perp(d);
    const s = G.add(pts[i], G.mul(d, cut[i])), f = G.sub(pts[i + 1], G.mul(d, cut[i + 1]));
    for (const k of [-1, 1]) out.push({ type: 'LINE', p1: G.add(s, G.mul(nrm, k * hw)), p2: G.add(f, G.mul(nrm, k * hw)), ...base });
    segEnds.push({ s, f, nrm });
  }
  // codos
  for (const c of corner) {
    if (!c) continue;
    const { i, a, th, Rc, t } = c, nrmA = G.perp(a), side = Math.sign(th);
    const cc = G.add(G.sub(pts[i], G.mul(a, t)), G.mul(nrmA, side * Rc)); // centro de curvatura
    const p0 = G.sub(pts[i], G.mul(a, t));
    const a0 = G.ang(cc, p0), a1 = a0 + th;
    for (const k of [-1, 1]) {
      const r = Rc - side * k * hw; if (r <= 1e-6) continue;
      const s1 = side > 0 ? a0 : a1, s2 = side > 0 ? a1 : a0;
      out.push({ type: 'ARC', c: cc, r, a1: G.normA(s1), a2: G.normA(s2), ...base });
    }
    if (opts.throat !== false) { /* sin líneas de garganta */ }
  }
  // extremos abiertos: línea transversal
  const first = segEnds[0], last = segEnds[segEnds.length - 1];
  out.push({ type: 'LINE', p1: G.add(pts[0], G.mul(first.nrm, -hw)), p2: G.add(pts[0], G.mul(first.nrm, hw)), ...base });
  out.push({ type: 'LINE', p1: G.add(pts[n - 1], G.mul(last.nrm, -hw)), p2: G.add(pts[n - 1], G.mul(last.nrm, hw)), ...base });
  // eje discontinuo
  if (e.axis !== false) {
    for (let i = 0; i < n - 1; i++) out.push({ type: 'LINE', p1: segEnds[i].s, p2: segEnds[i].f, ...base, ltype: e.axisLt || 'CENTER', color: 8, lts: Math.max(0.2, W / 400) });
    for (const c of corner) { if (!c) continue; const { i, a, th, Rc, t } = c, side = Math.sign(th), nrmA = G.perp(a); const cc = G.add(G.sub(pts[i], G.mul(a, t)), G.mul(nrmA, side * Rc)); const a0 = G.ang(cc, G.sub(pts[i], G.mul(a, t))), a1 = a0 + th; out.push({ type: 'ARC', c: cc, r: Rc, a1: G.normA(side > 0 ? a0 : a1), a2: G.normA(side > 0 ? a1 : a0), ...base, ltype: e.axisLt || 'CENTER', color: 8, lts: Math.max(0.2, W / 400) }); }
  }
  // etiqueta sobre el tramo más largo
  if (e.label !== false) {
    let bi = 0, bl = 0; for (let i = 0; i < n - 1; i++) { const l = G.dist(segEnds[i].s, segEnds[i].f); if (l > bl) { bl = l; bi = i; } }
    const sg = segEnds[bi], mid = G.mid(sg.s, sg.f); let ang = G.ang(sg.s, sg.f);
    if (ang > Math.PI / 2 + 1e-9 || ang <= -Math.PI / 2 - 1e-9) ang += Math.PI;
    const up = G.polar({ x: 0, y: 0 }, ang + Math.PI / 2, 1);
    const th = Math.max(W * 0.18, 2.5) * (e.lscale || 1);
    const c = ductCalc(e), fmtN = (v, d) => (+v).toFixed(d).replace('.', e.dec === '.' ? '.' : ',');
    const txt = `${sectionText(e)}${e.flow ? ` · ${Math.round(e.flow)} m³/h · ${fmtN(c.v, 1)} m/s` : ''}`;
    const p = G.add(mid, G.mul(up, hw + th * 0.6));
    out.push({ type: 'TEXT', p, p2: p, h: th, text: txt, rot: G.normA(ang), ha: 1, va: 1, ...base, color: 0, style: e.style || 'Standard' });
  }
  e._duct = out;
  return out;
}
