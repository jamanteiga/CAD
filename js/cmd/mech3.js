// Ficha Mecánica (3): soportes y separación entre soportes, equipos (bombas, recipientes con fondos
// DIN 28011/28013, tubuladuras), instrumentos, aislamiento térmico, tubería 3D, isométrica automática y
// despiece por spool con lista de corte.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { t as T } from '../core/i18n.js';
import * as P from '../core/pipedata.js';
import * as P2 from '../core/pipedata2.js';
import { flangeOf, pipeOf, npsTxt, flangeSide, elbowR, pipeKgM, CLASSES } from './mech.js';

const IN = 25.4;
const need = (v) => { if (v == null) throw new Cancel(); return v; };
const isPt = (v) => v && typeof v === 'object' && 'x' in v;
const r1 = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;
const L = (x1, y1, x2, y2, o = {}) => ({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer: '0', ...o });
const AX = { layer: 'MEC_EJES', color: 256, ltype: 'BYLAYER' };
const HID = { layer: 'MEC_OCULTAS', color: 256, ltype: 'BYLAYER' };
const rect = (x1, y1, x2, y2, o) => [L(x1, y1, x2, y1, o), L(x2, y1, x2, y2, o), L(x2, y2, x1, y2, o), L(x1, y2, x1, y1, o)];
const arc = (c, r, a1, a2, o = {}) => ({ type: 'ARC', c, r, a1, a2, layer: '0', ...o });
const circ = (c, r, o = {}) => ({ type: 'CIRCLE', c, r, layer: '0', ...o });
const txt = (x, y, h, s, o = {}) => ({ type: 'TEXT', p: { x, y }, p2: { x, y }, h, text: s, rot: o.rot || 0, ha: o.ha ?? 1, va: o.va ?? 2, layer: o.layer || '0' });

// ---------- geometría 3D (mallas)
const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]) };
v3.norm = (a) => v3.mul(a, 1 / (v3.len(a) || 1));
const perp = (u) => v3.norm(Math.abs(u[2]) < 0.9 ? v3.cross(u, [0, 0, 1]) : v3.cross(u, [1, 0, 0]));
const fixOrient = (polys) => { let vol = 0; for (const f of polys) for (let k = 1; k < f.length - 1; k++) { const [p, q, r] = [f[0], f[k], f[k + 1]]; vol += v3.dot(p, v3.cross(q, r)) / 6; } return vol < 0 ? polys.map((f) => f.slice().reverse()) : polys; };
export function cylMesh(a, b, r, n = 16) {
  const u = v3.norm(v3.sub(b, a)), e1 = perp(u), e2 = v3.cross(u, e1);
  const ring = (c) => Array.from({ length: n }, (_, i) => v3.add(c, v3.add(v3.mul(e1, r * Math.cos(2 * Math.PI * i / n)), v3.mul(e2, r * Math.sin(2 * Math.PI * i / n)))));
  const A = ring(a), B = ring(b), polys = [];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; polys.push([A[i], A[j], B[j], B[i]]); }
  polys.push(A.slice().reverse(), B.slice());
  return fixOrient(polys);
}
// codo 3D: S = inicio, u1 = dirección de entrada, n = dirección hacia el centro de curvatura, ángulo th, radio R
export function torusMesh(S, u1, n, R, th, r, segs = 12, m = 14) {
  const C = v3.add(S, v3.mul(n, R)), b = v3.cross(u1, n), rings = [];
  for (let k = 0; k <= segs; k++) {
    const f = th * k / segs, e1 = v3.add(v3.mul(n, -Math.cos(f)), v3.mul(u1, Math.sin(f)));
    const P0 = v3.add(C, v3.mul(e1, R));
    rings.push(Array.from({ length: m }, (_, i) => v3.add(P0, v3.add(v3.mul(e1, r * Math.cos(2 * Math.PI * i / m)), v3.mul(b, r * Math.sin(2 * Math.PI * i / m))))));
  }
  const polys = [];
  for (let k = 0; k < segs; k++) for (let i = 0; i < m; i++) { const j = (i + 1) % m; polys.push([rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]]); }
  polys.push(rings[0].slice().reverse(), rings[segs].slice());
  return fixOrient(polys);
}
// trazado 3D: recortes por codo y geometría de cada tramo/codo
export function route3D(pts, R) {
  const segs = [], bends = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const u1 = v3.norm(v3.sub(pts[i], pts[i - 1])), u2 = v3.norm(v3.sub(pts[i + 1], pts[i]));
    const th = Math.acos(Math.max(-1, Math.min(1, v3.dot(u1, u2)))); if (th < 1e-3) { bends.push(null); continue; }
    const tl = R * Math.tan(th / 2), n = v3.norm(v3.sub(u2, v3.mul(u1, v3.dot(u1, u2))));
    bends.push({ i, th, tl, u1, u2, n, S: v3.sub(pts[i], v3.mul(u1, tl)), E: v3.add(pts[i], v3.mul(u2, tl)) });
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const b0 = bends[i - 1], b1 = bends[i];
    const a = b0 ? b0.E : pts[i], b = b1 ? b1.S : pts[i + 1];
    segs.push({ a, b, len: v3.len(v3.sub(b, a)), ctc: v3.len(v3.sub(pts[i + 1], pts[i])) });
  }
  return { segs, bends: bends.filter(Boolean) };
}
// isometría estándar: X a 30°, Y a 150°, Z vertical
export const isoP = (p) => ({ x: (p[0] - p[1]) * Math.cos(Math.PI / 6), y: (p[0] + p[1]) * 0.5 + p[2] });

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const K = () => app.mecKit;
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const lines = () => (doc().ext.mecLines ||= []);

  // eje de tubo bajo un punto (línea MEC de tubería)
  const pipeAt = (p) => {
    let best = null, bd = Infinity;
    for (const e of doc().space) {
      if (e.mec?.kind !== 'PIPE' || e.type !== 'LINE') continue;
      const q = G.closestOnSeg ? G.closestOnSeg(p, e.p1, e.p2) : (() => { const d = G.sub(e.p2, e.p1), t = Math.max(0, Math.min(1, ((p.x - e.p1.x) * d.x + (p.y - e.p1.y) * d.y) / (d.x * d.x + d.y * d.y || 1))); return G.add(e.p1, G.mul(d, t)); })();
      const dd = G.dist(p, q); if (dd < bd) { bd = dd; best = { e, q, a: Math.atan2(e.p2.y - e.p1.y, e.p2.x - e.p1.x), od: e.mec.od }; }
    }
    return best && bd < Math.max(best.od || 50, 20) * K().scale() ? best : null;
  };
  const insertAt = (name, p, rot, layer, info, ports) => { const d = doc(), k = K().scale(), e = app.blocks.insertBlock(name, p, k, k, rot, {}, d.space); e.layer = layer; K().tagMec(e, info); if (ports) { e.mec.lports = ports; e.mec.od = info.od || null; } return e; };

  // ======================= SOPORTES =======================
  const STYPES = [['SHOE', 'Zapata'], ['GUIDE', 'Zapata guiada'], ['ANCHOR', 'Anclaje'], ['UBOLT', 'Abrazadera en U'], ['ROD', 'Colgador de varilla'], ['SPRING', 'Colgador de muelle']];
  const supportEnts = (type, od, H) => {
    const r = od / 2, out = [], Ls = Math.max(150, Math.min(450, od * 1.6));
    if (type === 'SHOE' || type === 'GUIDE' || type === 'ANCHOR') {
      out.push(...rect(-Ls / 2, -r - H, Ls / 2, -r), ...rect(-Ls / 2 - 20, -r - H - 12, Ls / 2 + 20, -r - H));
      if (type === 'GUIDE') for (const sg of [-1, 1]) out.push(...rect(sg * (Ls / 2 + 30), -r - H - 12, sg * (Ls / 2 + 30) + sg * 60, -r - H + H * 0.5));
      if (type === 'ANCHOR') { for (const sg of [-1, 1]) out.push(...rect(sg * (Ls / 2 + 2), -r - H - 12, sg * (Ls / 2 + 2) + sg * 25, -r - H * 0.3)); out.push(L(-Ls / 2, -r - H, Ls / 2, -r), L(-Ls / 2, -r, Ls / 2, -r - H)); }
      out.push(...rect(-Ls, -r - H - 12 - 120, Ls, -r - H - 12, HID));
    } else if (type === 'UBOLT') {
      const d = Math.max(10, Math.min(24, od * 0.06));
      out.push(arc({ x: 0, y: 0 }, r + d / 2, 0, Math.PI), L(-r - d / 2, 0, -r - d / 2, -r - 120 - 20), L(r + d / 2, 0, r + d / 2, -r - 120 - 20));
      out.push(...rect(-r * 1.6 - 60, -r - 120, r * 1.6 + 60, -r, HID).slice(0, 1), ...rect(-r * 1.6 - 60, -r - 12, r * 1.6 + 60, -r));
      for (const sg of [-1, 1]) out.push(...rect(sg * (r + d / 2) - d, -r - 30, sg * (r + d / 2) + d, -r - 12));
    } else {
      const Hr = H, c = Math.max(8, od * 0.04);
      out.push(arc({ x: 0, y: 0 }, r + c, 0, Math.PI), arc({ x: 0, y: 0 }, r + c, Math.PI, 2 * Math.PI), ...rect(-12, r + c, 12, r + c + 40));
      if (type === 'SPRING') { const y0 = r + c + 40 + Hr * 0.35, h = Math.max(220, od * 0.9), w = Math.max(120, od * 0.6); out.push(L(0, r + c + 40, 0, y0), ...rect(-w / 2, y0, w / 2, y0 + h)); for (let k = 0; k < 6; k++) out.push(L(-w * 0.35, y0 + h * (0.1 + k * 0.14), w * 0.35, y0 + h * (0.17 + k * 0.14))); out.push(L(0, y0 + h, 0, y0 + h + Hr * 0.4)); out.push(...rect(-80, y0 + h + Hr * 0.4, 80, y0 + h + Hr * 0.4 + 15)); }
      else { out.push(L(-4, r + c + 40, -4, r + c + 40 + Hr), L(4, r + c + 40, 4, r + c + 40 + Hr), ...rect(-80, r + c + 40 + Hr, 80, r + c + 40 + Hr + 15)); }
    }
    return out;
  };
  const supportName = (type, od, H) => `MEC_SOP_${type}_${r1(od, 1)}_${H}`.replace(/[^\w.-]/g, '_');
  const supportDesc = (type, size) => `${T('Soporte')} ${T(STYPES.find((x) => x[0] === type)[1]).toLowerCase()} ${size}`;
  R('MSUPPORT', async (c) => {
    const s = K().spec();
    const v = await K().chooser('Soporte de tubería', [
      { k: 'stype', l: 'Tipo', v: s.stype || 'SHOE', opts: () => STYPES },
      { k: 'sh', l: 'Altura / longitud de varilla (mm)', v: s.sh || 150, opts: () => [100, 150, 200, 300, 450, 600, 900, 1200].map((n) => [n, n + ' mm']) },
      ...K().pipeFields(s, null),
    ], (x) => ({ ents: [...supportEnts(x.stype, pipeOf(x).od, +x.sh), circ({ x: 0, y: 0 }, pipeOf(x).od / 2, HID)], info: `${tr('Separación máx. ASME B31.1')}: ${spanFor(pipeOf(x).nps, 'water') ?? '—'} m (${tr('agua')}) / ${spanFor(pipeOf(x).nps, 'gas') ?? '—'} m (${tr('gas')})` }));
    if (!v) return; K().save(v);
    const pipe = pipeOf(v), name = supportName(v.stype, pipe.od, +v.sh), d = doc();
    d.begin('MSUPPORT'); K().defBlock(name, supportEnts(v.stype, pipe.od, +v.sh), supportDesc(v.stype, pipe.size)); d.end();
    for (;;) {
      const p = await c.getPoint('Specify point on the pipe axis or <done>:', { def: null }); if (!isPt(p)) break;
      const hit = pipeAt(p), rot = hit ? hit.a : 0, at = hit ? hit.q : p;
      d.begin('MSUPPORT'); insertAt(name, at, rot, 'MEC_SOPORTES', { kind: 'SUPPORT', desc: supportDesc(v.stype, pipe.size) }); d.end(); redraw();
    }
  }, { alias: ['SOPORTE', 'MSOPORTE'] });
  const spanFor = (nps, fl) => { const f = P.fr(nps); let k = -1; P2.SPAN.nps.forEach((n, i) => { if (P.fr(n) <= f) k = i; }); return k < 0 ? null : P2.SPAN[fl][k]; };
  R('MSPAN', async (c) => {
    const s = K().spec();
    const sel = (await c.select('Select piping axes:', { filter: (e) => e.mec?.kind === 'PIPE' && e.type === 'LINE' })).filter((e) => e.mec?.kind === 'PIPE' && e.type === 'LINE');
    if (!sel.length) { c.print('No pipe axes selected.'); return; }
    const v = await K().chooser('Soportes según separación ASME B31.1', [
      { k: 'fluid', l: 'Servicio', v: s.fluid || 'water', opts: () => [['water', 'Agua (líquido)'], ['gas', 'Vapor, gas o aire']] },
      { k: 'stype', l: 'Tipo de soporte', v: s.stype || 'SHOE', opts: () => STYPES },
      { k: 'sh', l: 'Altura / longitud de varilla (mm)', v: s.sh || 150, opts: () => [100, 150, 200, 300, 450, 600, 900, 1200].map((n) => [n, n + ' mm']) },
    ], () => ({ info: tr('Tabla 121.5 de ASME B31.1 (tubo STD). En la práctica, apoye también junto a válvulas, cambios de dirección y cargas concentradas.'), ents: [] }));
    if (!v) return; K().save(v);
    const d = doc(), k = K().scale(); let n = 0; d.begin('MSPAN');
    for (const e of sel) {
      const od = e.mec.od, nps = (P.PIPE.find((r) => Math.abs(r[1] * IN - od) < 1.5) || [])[0] || (P.EN_PIPE.find((r) => Math.abs(r[1] - od) < 0.5) ? (() => { const dn = P.EN_PIPE.find((r) => Math.abs(r[1] - od) < 0.5)[0]; return Object.entries(P.DN).find(([, x]) => x === dn)?.[0]; })() : null);
      const S = spanFor(nps || '1', v.fluid); if (!S) continue;
      const Lseg = G.dist(e.p1, e.p2), step = S * 1000 * k, cnt = Math.floor(Lseg / step);
      const name = supportName(v.stype, od, +v.sh); K().defBlock(name, supportEnts(v.stype, od, +v.sh), supportDesc(v.stype, `NPS ${npsTxt(nps || '1')}`));
      const u = G.norm(G.sub(e.p2, e.p1)), a = Math.atan2(u.y, u.x), off = (Lseg - cnt * step) / 2;
      for (let i = 0; i <= cnt; i++) { if (cnt === 0 && i === 0 && Lseg < step * 0.5) break; const q = G.add(e.p1, G.mul(u, off + i * step)); insertAt(name, q, a, 'MEC_SOPORTES', { kind: 'SUPPORT', desc: supportDesc(v.stype, `NPS ${npsTxt(nps || '1')}`) }); n++; }
    }
    d.end(); redraw(); c.print(`${n} support(s) placed.`);
  }, { alias: ['SEPARACIONSOPORTES', 'MVANO'] });

  // ======================= EQUIPOS =======================
  const flangeEntsAt = (fl, x0, y0, dir, od) => { // brida simplificada: disco + cubo, cara en (x0, y0) mirando hacia dir
    const u = { x: Math.cos(dir), y: Math.sin(dir) }, n = { x: -u.y, y: u.x }, Pp = (s, t) => ({ x: x0 + u.x * s + n.x * t, y: y0 + u.y * s + n.y * t });
    const pts = [[0, -fl.O / 2], [-fl.C, -fl.O / 2], [-fl.C, -fl.X / 2], [-fl.Y, -od / 2], [-fl.Y, od / 2], [-fl.C, fl.X / 2], [-fl.C, fl.O / 2], [0, fl.O / 2]];
    const out = []; for (let i = 0; i < pts.length - 1; i++) { const a = Pp(...pts[i]), b = Pp(...pts[i + 1]); out.push(L(a.x, a.y, b.x, b.y)); }
    const a = Pp(0, -fl.O / 2), b = Pp(0, fl.O / 2); out.push(L(a.x, a.y, b.x, b.y)); return out;
  };
  R('MPUMP', async (c) => {
    const s = K().spec();
    const KW = [1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132];
    const build = (x) => {
      const fs = flangeOf(x.cls, x.snps), fd = flangeOf(x.cls, x.dnps); if (!fs || !fd) throw new Error(T('Diámetro no disponible.'));
      const ods = P.PIPE.find((r) => r[0] === x.snps)[1] * IN, odd = P.PIPE.find((r) => r[0] === x.dnps)[1] * IN, kw = +x.kw;
      const Dc = Math.max(260, ods * 2.6, odd * 3.2), Hs = Dc / 2 + 140, Ln = Math.max(120, ods * 1.2);
      const xc = Ln + Dc / 2, Lbf = 260 + Dc * 0.5, Lm = 280 + 95 * Math.pow(kw, 0.55), Hm = 180 + 70 * Math.pow(kw, 0.33), Lcg = 160;
      const out = [];
      out.push(circ({ x: xc, y: Hs }, Dc / 2), ...rect(xc - Dc * 0.2, Hs - Dc / 2 - 100, xc + Dc * 0.2, Hs - Dc / 2));
      out.push(L(0, Hs + ods / 2, xc - Dc / 2 * 0.95, Hs + ods / 2), L(0, Hs - ods / 2, xc - Dc / 2 * 0.95, Hs - ods / 2), ...flangeEntsAt(fs, 0, Hs, Math.PI, ods));
      const yd = Hs + Dc / 2 + Math.max(100, odd * 1.2); out.push(L(xc - odd / 2, Hs + Dc * 0.45, xc - odd / 2, yd), L(xc + odd / 2, Hs + Dc * 0.45, xc + odd / 2, yd), ...flangeEntsAt(fd, xc, yd, Math.PI / 2, odd));
      const xb = xc + Dc / 2; out.push(...rect(xb, Hs - Dc * 0.18, xb + Lbf, Hs + Dc * 0.18), ...rect(xb + Lbf, Hs - Dc * 0.12, xb + Lbf + Lcg, Hs + Dc * 0.12, HID), L(xb + Lbf, Hs - Dc * 0.18, xb + Lbf + Lcg, Hs - Dc * 0.12), L(xb + Lbf, Hs + Dc * 0.18, xb + Lbf + Lcg, Hs + Dc * 0.12));
      const xm = xb + Lbf + Lcg; out.push(...rect(xm, Hs - Hm / 2, xm + Lm, Hs + Hm / 2), ...rect(xm + Lm * 0.3, Hs + Hm / 2, xm + Lm * 0.65, Hs + Hm / 2 + Hm * 0.25), ...rect(xm + Lm * 0.15, Hs - Hm / 2 - (Hs - Hm / 2 - 40) , xm + Lm * 0.85, Hs - Hm / 2));
      for (let k = 1; k < 8; k++) out.push(L(xm + Lm * k / 8, Hs - Hm / 2, xm + Lm * k / 8, Hs + Hm / 2, HID));
      const Lb = xm + Lm + 60; out.push(...rect(Ln * 0.6, 0, Lb, 40), L(Ln * 0.6 - 30, 0, Lb + 30, 0, AX));
      out.push(L(-20, Hs, Lb, Hs, AX), L(xc, Hs - Dc / 2 - 110, xc, yd + 20, AX));
      return { ents: out, ports: [{ x: 0, y: Hs, a: Math.PI, face: true }, { x: xc, y: yd, a: Math.PI / 2, face: true }], info: `${tr('Aspiración')} ${npsTxt(x.snps)} · ${tr('impulsión')} ${npsTxt(x.dnps)} · ${kw} kW · ${tr('eje a')} ${r1(Hs)} mm\n${tr('Envolvente orientativa: verifique con el plano del fabricante.')}` };
    };
    const v = await K().chooser('Bomba centrífuga', [
      { k: 'snps', l: 'Aspiración (NPS)', v: s.snps || '3', opts: () => P.N20.map((n) => [n, npsTxt(n)]) },
      { k: 'dnps', l: 'Impulsión (NPS)', v: s.dnps || '2', opts: (x) => P.N20.filter((n) => P.fr(n) <= P.fr(x.snps)).map((n) => [n, npsTxt(n)]) },
      { k: 'cls', l: 'Clase de bridas', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) },
      { k: 'kw', l: 'Potencia del motor (kW)', v: s.kw || 7.5, opts: () => KW.map((k) => [k, k + ' kW']) },
    ], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_BOMBA_${v.snps}x${v.dnps}_${v.cls}_${v.kw}`.replace(/[^\w.-]/g, '_');
    const desc = `${tr('Bomba centrífuga')} ${npsTxt(v.snps)} × ${npsTxt(v.dnps)} Cl.${v.cls}, ${v.kw} kW`;
    const d = doc(); d.begin('MPUMP'); K().defBlock(name, b.ents, desc); d.end();
    await K().place(c, name, K().mecInfo('EQUIPMENT', desc), { layer: 'MEC_EQUIPOS', cmd: 'MPUMP', prompt: 'Specify suction flange face point:', ports: b.ports, attach: 'none' });
  }, { alias: ['BOMBA', 'MBOMBA'] });

  // recipiente: fondo con radio de bóveda R y de rebordeo r (DIN 28011 / 28013), dibujado en (0,0) hacia +Y
  const headEnts = (Da, s, type, sg = 1, y0 = 0) => {
    const { R: Rc, r, h1 } = P2.headDims(type, Da, s), a = Da / 2 - r;
    const yc = -Math.sqrt(Math.max(0, (Rc - r) ** 2 - a * a)); // centro de la bóveda bajo la línea de tangencia
    const phi = Math.atan2(a, -yc); // ángulo de unión bóveda-rebordeo
    const out = [], Y = (y) => y0 + sg * (h1 + y), A = (ang) => (sg > 0 ? ang : -ang);
    out.push(L(-Da / 2, y0, -Da / 2, Y(0)), L(Da / 2, y0, Da / 2, Y(0)), L(-Da / 2, Y(0), Da / 2, Y(0), HID));
    const k1 = { x: a, y: Y(0) }, k2 = { x: -a, y: Y(0) };
    if (sg > 0) { out.push(arc(k1, r, 0, Math.PI / 2 - phi), arc(k2, r, Math.PI / 2 + phi, Math.PI), arc({ x: 0, y: Y(yc) }, Rc, Math.PI / 2 - phi, Math.PI / 2 + phi)); }
    else { out.push(arc(k1, r, A(Math.PI / 2 - phi), 0), arc(k2, r, Math.PI, Math.PI - A(Math.PI / 2 - phi) + 0), arc({ x: 0, y: Y(yc) }, Rc, -Math.PI / 2 - phi, -Math.PI / 2 + phi)); }
    return { ents: out, h: h1 + (yc + Rc) };
  };
  R('MVESSEL', async (c) => {
    const s = K().spec();
    const DA = [400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000];
    const build = (x) => {
      const Da = +x.da, sh = +x.vs, Lt = +x.vl, out = [];
      const vert = x.orient === 'V';
      // se dibuja vertical; si es horizontal se gira al insertar
      out.push(L(-Da / 2, 0, -Da / 2, Lt), L(Da / 2, 0, Da / 2, Lt), L(-Da / 2 + sh, 0, -Da / 2 + sh, Lt, HID), L(Da / 2 - sh, 0, Da / 2 - sh, Lt, HID));
      const top = headEnts(Da, sh, x.head, 1, Lt), bot = headEnts(Da, sh, x.head, -1, 0);
      out.push(...top.ents, ...bot.ents);
      const H = Lt + top.h, B = -bot.h;
      out.push(L(0, B - 30, 0, H + 30, AX));
      const noz = (yb, dir, nps) => { if (!nps || nps === '0') return; const fl = flangeOf('150', nps), od = P.PIPE.find((r) => r[0] === nps)[1] * IN, proj = Math.max(150, od * 1.5); const ye = yb + dir * proj; out.push(L(-od / 2, yb, -od / 2, ye), L(od / 2, yb, od / 2, ye), ...flangeEntsAt(fl, 0, ye, dir > 0 ? Math.PI / 2 : -Math.PI / 2, od)); };
      noz(H - 5, 1, x.ntop); noz(B + 5, -1, x.nbot);
      if (x.nside && x.nside !== '0') { const fl = flangeOf('150', x.nside), od = P.PIPE.find((r) => r[0] === x.nside)[1] * IN, ys = Lt * 0.6, xe = Da / 2 + Math.max(150, od * 1.5); out.push(L(Da / 2, ys - od / 2, xe, ys - od / 2), L(Da / 2, ys + od / 2, xe, ys + od / 2), ...flangeEntsAt(fl, xe, ys, 0, od)); }
      if (vert && x.sup === 'LEGS') { const hl = Math.max(400, Da * 0.5); for (const sg of [-1, 1]) out.push(...rect(sg * Da / 2 - (sg > 0 ? 0 : 100), Lt * 0.15, sg * Da / 2 + (sg > 0 ? 100 : 0), Lt * 0.15 + 200), ...rect(sg * (Da / 2 + 20) - 40, B - hl, sg * (Da / 2 + 20) + 40, Lt * 0.15 + 200), ...rect(sg * (Da / 2 + 20) - 90, B - hl - 15, sg * (Da / 2 + 20) + 90, B - hl)); }
      else if (vert && x.sup === 'SKIRT') { const hs = Math.max(600, Da * 0.6); out.push(L(-Da / 2, 0, -Da / 2, -hs), L(Da / 2, 0, Da / 2, -hs), ...rect(-Da / 2 - 80, -hs - 30, Da / 2 + 80, -hs)); }
      else if (!vert) { for (const yy of [Lt * 0.2, Lt * 0.8]) { const hs = Da * 0.35 + 150; out.push(L(-Da / 2 - 20, yy, -Da / 2 - hs, yy - 120), L(-Da / 2 - 20, yy + 200, -Da / 2 - hs, yy + 320), L(-Da / 2 - hs, yy - 120, -Da / 2 - hs, yy + 320), ...rect(-Da / 2 - hs - 20, yy - 160, -Da / 2 - hs, yy + 360)); } }
      const vol = Math.PI * ((Da - 2 * sh) / 2000) ** 2 * (Lt / 1000) + 2 * 0.0847 * ((Da - 2 * sh) / 1000) ** 3 * (x.head === 'DIN28013' ? 1.6 : 1);
      return { ents: out, info: `${x.head === 'DIN28013' ? 'DIN 28013' : 'DIN 28011'}: R ${r1(P2.headDims(x.head, Da, sh).R)} · r ${r1(P2.headDims(x.head, Da, sh).r)} · h ${r1(top.h)}\n${tr('Altura total')} ${r1(H - B)} mm · ${tr('volumen aprox.')} ${r1(vol, 2)} m³`, H, B };
    };
    const NOZ = () => [['0', T('ninguna')], ...P.N20.map((n) => [n, npsTxt(n)])];
    const v = await K().chooser('Recipiente', [
      { k: 'orient', l: 'Disposición', v: s.orient || 'V', opts: () => [['V', 'Vertical'], ['H', 'Horizontal']] },
      { k: 'da', l: 'Ø exterior (mm)', v: s.da || 1000, opts: () => DA.map((n) => [n, n + ' mm']) },
      { k: 'vs', l: 'Espesor (mm)', v: s.vs || 8, opts: () => [4, 5, 6, 8, 10, 12, 15, 20, 25, 30].map((n) => [n, n + ' mm']) },
      { k: 'vl', l: 'Longitud entre tangentes (mm)', v: s.vl || 2000, opts: () => [500, 800, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000].map((n) => [n, n + ' mm']) },
      { k: 'head', l: 'Fondos', v: s.head || 'DIN28011', opts: () => [['DIN28011', 'Torisférico DIN 28011 (Klöpper)'], ['DIN28013', 'Semielíptico DIN 28013 (Korbbogen)']] },
      { k: 'sup', l: 'Apoyos', v: s.sup || 'LEGS', opts: (x) => (x.orient === 'V' ? [['LEGS', 'Patas'], ['SKIRT', 'Faldón'], ['NONE', 'Ninguno']] : [['SADDLE', 'Cunas'], ['NONE', 'Ninguno']]) },
      { k: 'ntop', l: 'Tubuladura superior', v: s.ntop || '2', opts: NOZ },
      { k: 'nbot', l: 'Tubuladura inferior', v: s.nbot || '2', opts: NOZ },
      { k: 'nside', l: 'Tubuladura lateral', v: s.nside || '0', opts: NOZ },
    ], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_RECIP_${v.orient}_${v.da}_${v.vs}_${v.vl}_${v.head}_${v.sup}_${v.ntop}_${v.nbot}_${v.nside}`.replace(/[^\w.-]/g, '_');
    const desc = `${tr('Recipiente')} Ø${v.da}×${v.vs} L=${v.vl} ${v.head === 'DIN28013' ? 'DIN 28013' : 'DIN 28011'}`;
    const d = doc(); d.begin('MVESSEL'); K().defBlock(name, b.ents, desc); d.end();
    const p = need(await c.getPoint('Specify bottom tangent line center:'));
    d.begin('MVESSEL'); insertAt(name, p, v.orient === 'H' ? -Math.PI / 2 : 0, 'MEC_EQUIPOS', { kind: 'EQUIPMENT', desc }); d.end(); redraw();
    c.print(b.info.replace(/\n/g, ' · '));
  }, { alias: ['RECIPIENTE', 'DEPOSITO', 'MRECIPIENTE'] });
  R('MNOZZLE', async (c) => {
    const s = K().spec();
    const build = (x) => {
      const pipe = pipeOf(x), fl = flangeOf(x.cls, pipe.nps); if (!fl) throw new Error(T('No existe brida de clase {0} para {1} en ASME B16.5.', x.cls, pipe.size));
      const proj = +x.proj, g = flangeSide(fl, 'WN', x.face || 'RF', pipe), out = [];
      for (const e of g.ents) { const q = JSON.parse(JSON.stringify(e)); q.p1 = { x: proj - q.p1.x, y: q.p1.y }; q.p2 = { x: proj - q.p2.x, y: q.p2.y }; out.push(q); }
      const xw = proj - g.len; out.push(L(0, pipe.od / 2, xw, pipe.od / 2), L(0, -pipe.od / 2, xw, -pipe.od / 2), L(0, pipe.id / 2, xw, pipe.id / 2, HID), L(0, -pipe.id / 2, xw, -pipe.id / 2, HID), L(-10, 0, 0, 0, AX));
      return { ents: out, proj, pipe, info: `${tr('Proyección')} ${proj} mm` };
    };
    const v = await K().chooser('Tubuladura', [...K().pipeFields(s, null), { k: 'cls', l: 'Clase de bridas', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) }, { k: 'face', l: 'Cara', v: s.face, opts: () => K().FACE }, { k: 'proj', l: 'Proyección desde la pared (mm)', v: s.proj || 200, opts: () => [100, 150, 200, 250, 300, 400, 500].map((n) => [n, n + ' mm']) }], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_TUBULADURA_${b.pipe.std === 'ASME' ? 'NPS' + b.pipe.nps + '_' + b.pipe.sch : 'EN' + b.pipe.od}_${v.cls}_${v.face}_${v.proj}`.replace(/[^\w.-]/g, '_');
    const desc = `${tr('Tubuladura')} ${b.pipe.size} Cl.${v.cls} ${v.face} ${tr('proyección')} ${v.proj}`;
    const d = doc(); d.begin('MNOZZLE'); K().defBlock(name, b.ents, desc); d.end();
    await K().place(c, name, K().mecInfo('NOZZLE', desc, { od: b.pipe.od }), { layer: 'MEC_EQUIPOS', cmd: 'MNOZZLE', prompt: 'Specify point on the vessel wall:', ports: [{ x: b.proj, y: 0, a: 0, face: true }], attach: 'none' });
  }, { alias: ['TUBULADURA', 'MTUBULADURA'] });

  // ======================= INSTRUMENTOS =======================
  const ITYPES = [['PI', 'Manómetro con válvula'], ['TI', 'Termómetro bimetálico con vaina'], ['TW', 'Vaina termométrica'], ['TRAP', 'Purgador termodinámico'], ['VENT', 'Venteo (válvula y tapón)'], ['DRAIN', 'Purga (válvula y tapón)']];
  const instrEnts = (type, od) => {
    const y0 = od / 2, out = [], b = 30;
    out.push(...rect(-12, y0, 12, y0 + b));
    if (type === 'PI') { out.push(...rect(-14, y0 + b, 14, y0 + b + 45), L(-14, y0 + b + 45, 14, y0 + b), ...rect(-5, y0 + b + 45, 5, y0 + b + 90), circ({ x: 0, y: y0 + b + 90 + 50 }, 50), circ({ x: 0, y: y0 + b + 140 }, 4), L(0, y0 + b + 140, 30, y0 + b + 170)); }
    else if (type === 'TI' || type === 'TW') { out.push(...rect(-4, -od * 0.35, 4, y0, HID), L(-4, -od * 0.35, 0, -od * 0.35 - 6, HID), L(4, -od * 0.35, 0, -od * 0.35 - 6, HID)); if (type === 'TI') out.push(...rect(-5, y0 + b, 5, y0 + b + 120), circ({ x: 0, y: y0 + b + 120 + 50 }, 50), L(0, y0 + b + 170, -28, y0 + b + 195)); else out.push(...rect(-16, y0 + b, 16, y0 + b + 18)); }
    else if (type === 'TRAP') { out.push(L(0, y0 + b, 0, y0 + b + 60), ...rect(-45, y0 + b + 60, 45, y0 + b + 120), ...rect(-25, y0 + b + 120, 25, y0 + b + 140), L(45, y0 + b + 90, 110, y0 + b + 90)); }
    else { const s = type === 'DRAIN' ? -1 : 1, yb = s > 0 ? y0 + b : -y0 - b; if (s < 0) { out.length = 0; out.push(...rect(-12, -y0 - b, 12, -y0)); } out.push(...rect(-16, yb, 16, yb + s * 70), L(-16, yb, 16, yb + s * 70), L(16, yb, -16, yb + s * 70), ...rect(-10, yb + s * 70, 10, yb + s * 95), L(0, yb + s * 35, 40, yb + s * 35), L(40, yb + s * 25, 40, yb + s * 45)); }
    return out;
  };
  R('MINSTR', async (c) => {
    const s = K().spec();
    const v = await K().chooser('Instrumento o accesorio de línea', [{ k: 'itype', l: 'Tipo', v: s.itype || 'PI', opts: () => ITYPES }, ...K().pipeFields(s, null)], (x) => ({ ents: [...instrEnts(x.itype, pipeOf(x).od), circ({ x: 0, y: 0 }, pipeOf(x).od / 2, HID)], info: T('Dimensiones orientativas.') }));
    if (!v) return; K().save(v);
    const pipe = pipeOf(v), name = `MEC_INSTR_${v.itype}_${r1(pipe.od)}`.replace(/[^\w.-]/g, '_'), desc = `${T(ITYPES.find((x) => x[0] === v.itype)[1])} ${tr('en')} ${pipe.size}`;
    const d = doc(); d.begin('MINSTR'); K().defBlock(name, instrEnts(v.itype, pipe.od), desc); d.end();
    const p = need(await c.getPoint('Specify point on the pipe axis:')); const hit = pipeAt(p);
    d.begin('MINSTR'); insertAt(name, hit ? hit.q : p, hit ? hit.a : 0, 'MEC_INSTRUMENTOS', { kind: 'INSTRUMENT', desc }); d.end(); redraw();
  }, { alias: ['INSTRUMENTO', 'MINSTRUMENTO'] });

  // ======================= AISLAMIENTO =======================
  R('MINSUL', async (c) => {
    const sel = (await c.select('Select pipe axes and elbows to insulate:')).filter((e) => e.mec && ((e.mec.kind === 'PIPE' && e.type === 'LINE') || (e.mec.kind === 'ELBOW' && e.type === 'INSERT' && e.mec.R)));
    if (!sel.length) { c.print('No pipe axes selected.'); return; }
    const s = K().spec();
    const v = await K().chooser('Aislamiento térmico', [{ k: 'ins', l: 'Espesor de aislamiento (mm)', v: s.ins || 40, opts: () => [20, 25, 30, 40, 50, 60, 80, 100, 120].map((n) => [n, n + ' mm']) }, { k: 'imat', l: 'Material', v: s.imat || 'MW', opts: () => [['MW', 'Lana mineral'], ['CG', 'Vidrio celular'], ['EL', 'Espuma elastomérica'], ['PUR', 'Poliuretano']] }], () => ({ info: T('Se dibuja a trazos sobre el contorno del tubo; la lista de materiales suma los metros por espesor.'), ents: [] }));
    if (!v) return; K().save(v);
    const d = doc(), k = K().scale(), t = +v.ins, mat = { MW: T('lana mineral'), CG: T('vidrio celular'), EL: T('espuma elastomérica'), PUR: T('poliuretano') }[v.imat];
    d.begin('MINSUL'); K().ensureLayers(d); let tot = 0;
    for (const e of sel) {
      const od = e.mec.od, ro = (od / 2 + t) * k;
      if (e.type === 'LINE') {
        const u = G.norm(G.sub(e.p2, e.p1)), n = { x: -u.y, y: u.x };
        for (const sg of [1, -1]) d.add({ type: 'LINE', p1: G.add(e.p1, G.mul(n, sg * ro)), p2: G.add(e.p2, G.mul(n, sg * ro)), layer: 'MEC_AISLAMIENTO', ltype: 'MEC_OCULTA' });
        const len = G.dist(e.p1, e.p2) / k; tot += len;
        K().tagMec(d.add({ type: 'POINT', p: G.mid(e.p1, e.p2), layer: 'MEC_AISLAMIENTO' }), { kind: 'INSUL', desc: `${T('Aislamiento')} ${mat} e=${t} mm ${T('sobre')} Ø${r1(od)}`, len });
      } else {
        const Rr = e.mec.R * k, ang = e.mec.ang, sx = e.sx < 0 ? -1 : 1, sy = e.sy < 0 ? -1 : 1, rot = e.rot || 0;
        const W = (q) => G.add(e.p, G.rotate ? G.rotate({ x: q.x * sx, y: q.y * sy }, { x: 0, y: 0 }, rot) : { x: q.x * sx * Math.cos(rot) - q.y * sy * Math.sin(rot), y: q.x * sx * Math.sin(rot) + q.y * sy * Math.cos(rot) });
        const cc = W({ x: 0, y: Rr }); const a0 = Math.atan2(W({ x: 0, y: 0 }).y - cc.y, W({ x: 0, y: 0 }).x - cc.x), a1 = a0 + ang * (sy * sx > 0 ? 1 : -1);
        const [b1, b2] = a1 >= a0 ? [a0, a1] : [a1, a0];
        for (const rr of [Rr + ro, Rr - ro]) if (rr > 0) d.add({ type: 'ARC', c: cc, r: rr, a1: b1, a2: b2, layer: 'MEC_AISLAMIENTO', ltype: 'MEC_OCULTA' });
        const len = Rr * ang / k; tot += len;
        K().tagMec(d.add({ type: 'POINT', p: cc, layer: 'MEC_AISLAMIENTO' }), { kind: 'INSUL', desc: `${T('Aislamiento')} ${mat} e=${t} mm ${T('sobre')} Ø${r1(od)}`, len });
      }
    }
    d.end(); redraw(); c.print(`Insulation: ${r1(tot / 1000, 2)} m.`);
  }, { alias: ['AISLAMIENTO', 'MAISLAMIENTO'] });

  // ======================= TUBERÍA 3D, ISOMÉTRICA Y SPOOLS =======================
  R('MPIPE3D', async (c) => {
    const s = K().spec();
    const v = await K().chooser('Tubería 3D', [...K().pipeFields(s, null), { k: 'elbow', l: 'Codos', v: s.elbow, opts: () => [['LR', 'Radio largo (1,5 D)'], ['SR', 'Radio corto (1 D)']] }, { k: 'fends', l: 'Bridas en los extremos', v: s.fends || '0', opts: () => [['0', 'No'], ['1', 'Sí (WN de la especificación)']] }],
      (x) => { const p = pipeOf(x); return { info: `${p.label}\n${T('Introduzca los puntos en planta y la cota Z de cada uno. Use Subir/Bajar para tramos verticales.')}`, ents: [] }; });
    if (!v) return; K().save(v);
    const tag = ((await c.getString('Line number <auto>:', { def: '' })) || '').trim() || `L-${String(lines().length + 1).padStart(3, '0')}`;
    const pipe = pipeOf(v), Rb = elbowR(pipe.nps, v.elbow) || pipe.od * 1.5, k = K().scale();
    const p0 = need(await c.getPoint('Specify start point:'));
    let z = await c.getReal(`Specify elevation Z <${r1(doc().vars.ELEVATION || 0, 0)}>:`, { def: doc().vars.ELEVATION || 0 }); z = +z || 0;
    const pts = [[p0.x / k, p0.y / k, z]];
    for (;;) {
      const last = pts.at(-1);
      const q = await c.getPoint('Specify next point or [Up/Down/Undo] <done>:', { base: { x: last[0] * k, y: last[1] * k }, def: null });
      if (q === 'Undo') { if (pts.length > 1) pts.pop(); continue; }
      if (q === 'Up' || q === 'Down') { const dz = +(await c.getDist('Specify vertical distance:', {})) || 0; if (dz) pts.push([last[0], last[1], last[2] + (q === 'Up' ? dz : -dz) / k]); continue; }
      if (!isPt(q)) break;
      const zz = await c.getReal(`Specify elevation Z <${r1(last[2], 0)}>:`, { def: last[2] });
      pts.push([q.x / k, q.y / k, zz == null ? last[2] : +zz]);
    }
    if (pts.length < 2) return;
    const geo = route3D(pts, Rb);
    if (geo.segs.some((sg, i) => sg.len < 0 && i)) c.print('Some segments are shorter than the elbows.');
    const d = doc(), id = Math.random().toString(36).slice(2, 9);
    d.begin('MPIPE3D'); K().ensureLayers(d);
    const S = (p) => [p[0] * k, p[1] * k, p[2] * k];
    for (const sg of geo.segs) if (sg.len > 0.5) K().tagMec(d.add({ type: '3DSOLID', kind: 'mesh', polys: cylMesh(S(sg.a), S(sg.b), pipe.od / 2 * k), layer: 'MEC_3D' }), { kind: 'PIPE', desc: `${T('Tubo')} ${pipe.label}`, len: sg.len, od: pipe.od, t: pipe.t, line: id });
    for (const bd of geo.bends) K().tagMec(d.add({ type: '3DSOLID', kind: 'mesh', polys: torusMesh(S(bd.S), bd.u1, bd.n, Rb * k, bd.th, pipe.od / 2 * k), layer: 'MEC_3D' }), { kind: 'ELBOW', desc: `${T('Codo')} ${r1(bd.th * 180 / Math.PI, 1)}° ${v.elbow === 'SR' ? T('radio corto') : T('radio largo')} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch + ' ASME B16.9' : 'e=' + pipe.t + ' EN 10253'}`, line: id });
    if (v.fends === '1') {
      const fl = flangeOf(s.cls, pipe.nps);
      if (fl) for (const [p, q] of [[pts[0], pts[1]], [pts.at(-1), pts.at(-2)]]) { const u = v3.norm(v3.sub(p, q)), c0 = S(p); const m = cylMesh(c0, v3.add(c0, v3.mul(u, -fl.C * k)), fl.O / 2 * k); K().tagMec(d.add({ type: '3DSOLID', kind: 'mesh', polys: m, layer: 'MEC_3D' }), { kind: 'FLANGE', desc: `${T('Brida')} WN ${s.face} Cl.${s.cls} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch : 'e=' + pipe.t} ASME B16.5`, line: id }); }
    }
    lines().push({ id, tag, pts, od: pipe.od, t: pipe.t, R: Rb, size: pipe.size, label: pipe.label, elbow: v.elbow, nps: pipe.nps, fends: v.fends === '1', cls: s.cls, face: s.face });
    d.touchTables(); d.end(); redraw();
    const L3 = geo.segs.reduce((a, sg) => a + Math.max(0, sg.len), 0) + geo.bends.reduce((a, b) => a + Rb * b.th, 0);
    c.print(`Line ${tag}: ${r1(L3 / 1000, 3)} m, ${geo.bends.length} elbow(s). Use MISO for the isometric.`);
  }, { alias: ['TUBERIA3D', 'MTUBERIA3D'] });

  // reparto en spools por longitud máxima de transporte; devuelve los puntos de soldadura de campo
  const spools = (ln, maxL) => {
    const geo = route3D(ln.pts, ln.R), cuts = []; let acc = 0, n = 1;
    geo.segs.forEach((sg, i) => {
      const lenNext = Math.max(0, sg.len) + (geo.bends[i] ? ln.R * geo.bends[i].th : 0);
      if (maxL && acc + lenNext > maxL && acc > 0) {
        // soldadura de campo dentro del tramo recto (a 100 mm del inicio si cabe)
        const s0 = Math.min(Math.max(100, maxL - acc), Math.max(0, sg.len - 100));
        const u = v3.norm(v3.sub(sg.b, sg.a)); cuts.push({ seg: i, at: s0, p: v3.add(sg.a, v3.mul(u, s0)), spool: ++n }); acc = Math.max(0, sg.len) - s0 + (geo.bends[i] ? ln.R * geo.bends[i].th : 0);
      } else acc += lenNext;
    });
    return { geo, cuts, n };
  };
  app.mecSpools = spools;
  // lista de corte: piezas de tubo recto entre soldaduras
  const cutList = (ln, sp) => {
    const out = []; let sp0 = 1, pc = 0;
    sp.geo.segs.forEach((sg, i) => {
      const cs = sp.cuts.filter((x) => x.seg === i).map((x) => x.at).sort((a, b) => a - b), edges = [0, ...cs, Math.max(0, sg.len)];
      for (let j = 0; j < edges.length - 1; j++) { if (j > 0) sp0++; const l = edges[j + 1] - edges[j]; if (l > 0.5) out.push({ n: ++pc, spool: sp0, len: l }); }
    });
    return out;
  };
  app.mecCutList = cutList;
  const pickLine = async (s, title, extra = []) => {
    const ls = lines(); if (!ls.length) return null;
    return K().chooser(title, [{ k: 'line', l: 'Línea', v: s.line && ls.some((l) => l.id === s.line) ? s.line : ls.at(-1).id, opts: () => ls.map((l) => [l.id, `${l.tag} · ${l.size}`]) }, ...extra], (x) => { const ln = ls.find((l) => l.id === x.line); const sp = spools(ln, (+x.maxl || 0) * 1000); return { info: `${ln.label}\n${sp.n} spool(s) · ${cutList(ln, sp).length} ${T('piezas de tubo')}`, ents: isoEnts(ln, sp, 1, 1).filter((e) => e.type !== 'TEXT') }; });
  };
  const isoEnts = (ln, sp, sc, th) => {
    const out = [], P_ = (p) => { const q = isoP(p); return { x: q.x * sc, y: q.y * sc }; }, geo = sp.geo;
    // eje de la línea: rectas y codos (arco 3D proyectado)
    for (const sg of geo.segs) { if (sg.len <= 0) continue; const a = P_(sg.a), b = P_(sg.b); out.push({ ...L(a.x, a.y, b.x, b.y), layer: 'MEC_ISO', lw: 50 }); }
    for (const bd of geo.bends) { const C = v3.add(bd.S, v3.mul(bd.n, ln.R)), pts = []; for (let k = 0; k <= 10; k++) { const f = bd.th * k / 10, e1 = v3.add(v3.mul(bd.n, -Math.cos(f)), v3.mul(bd.u1, Math.sin(f))); const q = P_(v3.add(C, v3.mul(e1, ln.R))); pts.push({ ...q, b: 0 }); } out.push({ type: 'LWPOLYLINE', pts, closed: false, layer: 'MEC_ISO', lw: 50 }); }
    // soldaduras (taller W, campo FW) numeradas
    const welds = []; for (const bd of geo.bends) welds.push({ p: bd.S }, { p: bd.E }); for (const cu of sp.cuts) welds.push({ p: cu.p, field: true });
    if (ln.fends) welds.push({ p: ln.pts[0] }, { p: ln.pts.at(-1) });
    welds.forEach((w, i) => { const q = P_(w.p); out.push(circ(q, th * 0.5, { layer: 'MEC_ISO' })); if (w.field) out.push(L(q.x - th * 0.6, q.y - th * 0.6, q.x + th * 0.6, q.y + th * 0.6, { layer: 'MEC_ISO' }), L(q.x - th * 0.6, q.y + th * 0.6, q.x + th * 0.6, q.y - th * 0.6, { layer: 'MEC_ISO' })); out.push(txt(q.x + th * 1.2, q.y + th * 1.2, th * 0.8, (w.field ? 'FW' : 'W') + (i + 1), { ha: 0, layer: 'MEC_ISO' })); });
    // cotas: centro a centro de cada tramo, paralelas al tramo en isométrico
    ln.pts.slice(1).forEach((p, i) => {
      const a = P_(ln.pts[i]), b = P_(p), u = G.norm(G.sub(b, a)), n = { x: -u.y, y: u.x }, off = th * 2.2, len = v3.len(v3.sub(p, ln.pts[i]));
      if (len < 1) return;
      const a1 = G.add(a, G.mul(n, off)), b1 = G.add(b, G.mul(n, off));
      out.push({ ...L(a1.x, a1.y, b1.x, b1.y), layer: 'MEC_ISO' }, { ...L(a.x, a.y, a1.x + n.x * th * 0.4, a1.y + n.y * th * 0.4), layer: 'MEC_ISO' }, { ...L(b.x, b.y, b1.x + n.x * th * 0.4, b1.y + n.y * th * 0.4), layer: 'MEC_ISO' });
      for (const q of [a1, b1]) out.push({ ...L(q.x - (u.x + n.x) * th * 0.35, q.y - (u.y + n.y) * th * 0.35, q.x + (u.x + n.x) * th * 0.35, q.y + (u.y + n.y) * th * 0.35), layer: 'MEC_ISO' });
      let ang = Math.atan2(u.y, u.x); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
      const m = G.mid(a1, b1); out.push(txt(m.x + n.x * th * 0.7, m.y + n.y * th * 0.7, th, String(Math.round(len)), { rot: ang, layer: 'MEC_ISO' }));
    });
    // coordenadas de los extremos y norte
    for (const p of [ln.pts[0], ln.pts.at(-1)]) { const q = P_(p); out.push(txt(q.x, q.y - th * 2.2, th * 0.8, `E ${Math.round(p[0])}  N ${Math.round(p[1])}  EL ${Math.round(p[2])}`, { layer: 'MEC_ISO' })); }
    return out;
  };
  R('MISO', async (c) => {
    if (!lines().length) { c.print('There are no 3D piping lines. Draw them with MPIPE3D.'); return; }
    const s = K().spec();
    const v = await pickLine(s, 'Isométrica de tubería', [{ k: 'maxl', l: 'Longitud máx. de spool (m)', v: s.maxl || 6, opts: () => [[0, 'Sin dividir'], [3, '3 m'], [6, '6 m'], [9, '9 m'], [12, '12 m']] }, { k: 'isc', l: 'Escala de la isométrica', v: s.isc || 'auto', opts: () => [['auto', 'Automática (sin escala)'], ['1', '1:1'], ['0.1', '1:10'], ['0.05', '1:20'], ['0.02', '1:50']] }]);
    if (!v) return; K().save({ line: v.line, maxl: v.maxl, isc: v.isc });
    const ln = lines().find((l) => l.id === v.line), sp = spools(ln, +v.maxl * 1000);
    const bb = G.bbNew(); for (const p of ln.pts) G.bbAdd(bb, isoP(p));
    const span = Math.max(bb.x2 - bb.x1, bb.y2 - bb.y1, 1), sc = v.isc === 'auto' ? 250 / span : +v.isc, th = Math.max(2.5, span * sc / 90);
    const ins = need(await c.getPoint('Specify insertion point for the isometric:'));
    const d = doc(); d.begin('MISO'); K().ensureLayers(d);
    const o = { x: ins.x - bb.x1 * sc, y: ins.y - bb.y1 * sc };
    for (const e of isoEnts(ln, sp, sc, th)) { const x = JSON.parse(JSON.stringify(e)); const mv = (q) => ({ x: q.x + o.x, y: q.y + o.y }); if (x.p1) { x.p1 = mv(x.p1); x.p2 = mv(x.p2); } if (x.p) { x.p = mv(x.p); x.p2 = mv(x.p2 || x.p); } if (x.c) x.c = mv(x.c); if (x.pts) x.pts = x.pts.map((q) => ({ ...mv(q), b: 0 })); d.add({ ...x, layer: 'MEC_ISO' }); }
    // norte (dirección +Y en isométrico) y rótulo
    const nx = ins.x - th * 6, ny = ins.y + (bb.y2 - bb.y1) * sc + th * 6, nu = G.norm(isoP([0, 1, 0]));
    const tipN = { x: nx + nu.x * th * 5, y: ny + nu.y * th * 5 }, nn = { x: -nu.y, y: nu.x };
    d.add({ type: 'LINE', p1: { x: nx, y: ny }, p2: tipN, layer: 'MEC_ISO' });
    d.add({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [[tipN, G.add(G.sub(tipN, G.mul(nu, th * 1.4)), G.mul(nn, th * 0.5)), G.sub(G.sub(tipN, G.mul(nu, th * 1.4)), G.mul(nn, th * 0.5))].map((q) => ({ ...q, b: 0 }))], layer: 'MEC_ISO' });
    d.add(txt(nx + nu.x * th * 6.4, ny + nu.y * th * 6.4, th, 'N', { layer: 'MEC_ISO' }));
    d.add(txt(ins.x, ins.y - th * 5, th * 1.4, `${T('ISOMÉTRICA')} ${ln.tag} — ${ln.size}`, { ha: 0, layer: 'MEC_ISO' }));
    // lista de materiales y de corte
    const cl = cutList(ln, sp), totalPipe = cl.reduce((a, x) => a + x.len, 0);
    const rows = [[T('Pos.'), T('Descripción'), T('Cant.')], ['1', `${T('Tubo')} ${ln.label}`, `${r1(totalPipe / 1000, 2)} m`], ['2', `${T('Codo')} ${ln.elbow === 'SR' ? T('radio corto') : T('radio largo')} ${ln.size}`, String(sp.geo.bends.length)], ...(ln.fends ? [['3', `${T('Brida')} WN ${ln.face} Cl.${ln.cls} ${ln.size}`, '2']] : [])];
    const cuts = [[T('Pieza'), 'Spool', T('Longitud de corte (mm)')], ...cl.map((x) => [String(x.n), 'S' + x.spool, String(Math.round(x.len))])];
    const tx = ins.x + (bb.x2 - bb.x1) * sc + th * 10;
    const tbl = (p, cells) => { const e = K().newTable(p, cells.length, cells[0].length, { th: th * 0.8, rh: th * 2.1, head: 1 }); e.cells = cells.map((r) => r.map(String)); e.cols = cells[0].map((_, j) => Math.max(...cells.map((r) => E.textWidth(String(r[j]), th * 0.8, 1) + th * 1.4))); e.layer = 'MEC_ISO'; e.color = 256; return d.add(e); };
    tbl({ x: tx, y: ins.y + (bb.y2 - bb.y1) * sc }, rows); tbl({ x: tx, y: ins.y + (bb.y2 - bb.y1) * sc - th * 2.1 * (rows.length + 1.5) }, cuts);
    d.end(); redraw();
    c.print(`Isometric ${ln.tag}: ${sp.n} spool(s), ${cl.length} pipe piece(s), ${sp.geo.bends.length * 2 + sp.cuts.length} weld(s).`);
  }, { alias: ['ISOMETRICA', 'MISOMETRICA'] });
  R('MSPOOL', async (c) => {
    if (!lines().length) { c.print('There are no 3D piping lines. Draw them with MPIPE3D.'); return; }
    const s = K().spec();
    const v = await pickLine(s, 'Despiece por spool', [{ k: 'maxl', l: 'Longitud máx. de spool (m)', v: s.maxl || 6, opts: () => [[3, '3 m'], [6, '6 m'], [9, '9 m'], [12, '12 m']] }]);
    if (!v) return;
    const ln = lines().find((l) => l.id === v.line), sp = spools(ln, +v.maxl * 1000), cl = cutList(ln, sp);
    for (const x of cl) c.print(`${T('Pieza')} ${x.n} · S${x.spool} · ${Math.round(x.len)} mm`);
    c.print(`${sp.n} spool(s), ${sp.cuts.length} field weld(s).`);
    const p = await c.getPoint('Specify insertion point for the table or [None] <None>:', { def: 'None' });
    if (isPt(p)) { const d = doc(), th = (d.vars.TEXTSIZE || 2.5) * 2; d.begin('MSPOOL'); const cells = [[T('Pieza'), 'Spool', T('Longitud de corte (mm)')], ...cl.map((x) => [String(x.n), 'S' + x.spool, String(Math.round(x.len))])]; const e = K().newTable(p, cells.length, 3, { th, rh: th * 2.6, head: 1 }); e.cells = cells; e.cols = [0, 1, 2].map((j) => Math.max(...cells.map((r) => E.textWidth(r[j], th, 1) + th * 1.6))); e.layer = d.clayer; e.color = 256; d.add(e); d.end(); redraw(); }
    app._lastSpool = { sp, cl };
  }, { alias: ['SPOOL', 'DESPIECE'] });
  void pipeKgM; void P2;
}
