// v8 — climatización y naval: conductos en 3D, isométrico y lista de materiales; cargas térmicas por recinto;
// hoja de datos y categoría PED; bridas EN 1092-1; cálculo de tuberías con NPSH; etiquetado y listado de P&ID.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import * as D from '../core/duct.js';
import { newTable } from '../core/table.js';
import { Cancel } from './engine.js';
import { t as T } from '../core/i18n.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const r1 = (v, d = 2) => (Number.isFinite(v) ? (+v).toFixed(d) : '—');

// ---------- PED 2014/68/UE, anexo II (orientativo)
export function pedCategory({ kind = 'vessel', state = 'gas', group = 1, PS = 0, V = 0, DN = 0 }) {
  const cat = (c, table) => ({ cat: c, table });
  if (PS <= 0.5) return cat('Fuera de alcance (PS ≤ 0,5 bar)', '-');
  if (kind === 'vessel') {
    const pv = PS * V;
    if (state === 'gas' && group === 1) { if (V <= 1) return PS > 1000 ? cat('IV', 1) : PS > 200 ? cat('III', 1) : cat('Art. 4.3', 1); if (pv <= 25) return cat('Art. 4.3', 1); return cat(pv <= 50 ? 'I' : pv <= 200 ? 'II' : pv <= 1000 ? 'III' : 'IV', 1); }
    if (state === 'gas') { if (V <= 1) return PS > 3000 ? cat('IV', 2) : PS > 1000 ? cat('III', 2) : cat('Art. 4.3', 2); if (pv <= 50) return cat('Art. 4.3', 2); return cat(pv <= 200 ? 'I' : pv <= 1000 ? 'II' : pv <= 3000 ? 'III' : 'IV', 2); }
    if (group === 1) { if (PS > 500) return cat('III', 3); if (V <= 1) return PS > 200 ? cat('I', 3) : cat('Art. 4.3', 3); if (pv <= 200) return cat('Art. 4.3', 3); return cat(PS > 10 ? 'II' : 'I', 3); }
    if (PS > 1000) return cat('II', 4); if (PS > 10 && pv > 10000) return cat('I', 4); if (PS > 500) return cat('I', 4); return cat('Art. 4.3', 4);
  }
  const pd = PS * DN;
  if (state === 'gas' && group === 1) { if (DN <= 25) return cat('Art. 4.3', 6); return cat(pd <= 1000 ? 'I' : pd <= 3500 ? 'II' : 'III', 6); }
  if (state === 'gas') { if (DN <= 32 || pd <= 1000) return cat('Art. 4.3', 7); return cat(pd <= 3500 ? 'I' : pd <= 5000 ? 'II' : 'III', 7); }
  if (group === 1) { if (DN <= 25 || pd <= 2000) return cat('Art. 4.3', 8); return cat(PS > 500 ? 'III' : PS > 10 ? 'II' : 'I', 8); }
  if (DN <= 200 || PS <= 10 || pd <= 5000) return cat('Art. 4.3', 9); return cat(PS > 500 ? 'II' : 'I', 9);
}
export const PED_MODULES = { I: 'A', II: 'A2, D1, E1', III: 'B (tipo de diseño) + D, B (tipo de diseño) + F, B (tipo de producción) + E, B (tipo de producción) + C2, H', IV: 'B (tipo de producción) + D, B (tipo de producción) + F, G, H1' };

// ---------- EN 1092-1 (bridas de cuello y planas): DN -> [D, K, L, n, rosca]
export const EN1092 = {
  10: { 15: [95, 65, 14, 4, 'M12'], 20: [105, 75, 14, 4, 'M12'], 25: [115, 85, 14, 4, 'M12'], 32: [140, 100, 18, 4, 'M16'], 40: [150, 110, 18, 4, 'M16'], 50: [165, 125, 18, 4, 'M16'], 65: [185, 145, 18, 8, 'M16'], 80: [200, 160, 18, 8, 'M16'], 100: [220, 180, 18, 8, 'M16'], 125: [250, 210, 18, 8, 'M16'], 150: [285, 240, 22, 8, 'M20'], 200: [340, 295, 22, 8, 'M20'], 250: [395, 350, 22, 12, 'M20'], 300: [445, 400, 22, 12, 'M20'] },
  16: { 15: [95, 65, 14, 4, 'M12'], 20: [105, 75, 14, 4, 'M12'], 25: [115, 85, 14, 4, 'M12'], 32: [140, 100, 18, 4, 'M16'], 40: [150, 110, 18, 4, 'M16'], 50: [165, 125, 18, 4, 'M16'], 65: [185, 145, 18, 8, 'M16'], 80: [200, 160, 18, 8, 'M16'], 100: [220, 180, 18, 8, 'M16'], 125: [250, 210, 18, 8, 'M16'], 150: [285, 240, 22, 8, 'M20'], 200: [340, 295, 22, 12, 'M20'], 250: [405, 355, 26, 12, 'M24'], 300: [460, 410, 26, 12, 'M24'] },
  25: { 15: [95, 65, 14, 4, 'M12'], 20: [105, 75, 14, 4, 'M12'], 25: [115, 85, 14, 4, 'M12'], 32: [140, 100, 18, 4, 'M16'], 40: [150, 110, 18, 4, 'M16'], 50: [165, 125, 18, 4, 'M16'], 65: [185, 145, 18, 8, 'M16'], 80: [200, 160, 18, 8, 'M16'], 100: [235, 190, 22, 8, 'M20'], 125: [270, 220, 26, 8, 'M24'], 150: [300, 250, 26, 8, 'M24'], 200: [360, 310, 26, 12, 'M24'], 250: [425, 370, 30, 12, 'M27'], 300: [485, 430, 30, 16, 'M27'] },
  40: { 15: [95, 65, 14, 4, 'M12'], 20: [105, 75, 14, 4, 'M12'], 25: [115, 85, 14, 4, 'M12'], 32: [140, 100, 18, 4, 'M16'], 40: [150, 110, 18, 4, 'M16'], 50: [165, 125, 18, 4, 'M16'], 65: [185, 145, 18, 8, 'M16'], 80: [200, 160, 18, 8, 'M16'], 100: [235, 190, 22, 8, 'M20'], 125: [270, 220, 26, 8, 'M24'], 150: [300, 250, 26, 8, 'M24'], 200: [375, 320, 30, 12, 'M27'], 250: [450, 385, 33, 12, 'M30'], 300: [515, 450, 33, 16, 'M30'] },
};
export const PIPE_OD = { 15: 21.3, 20: 26.9, 25: 33.7, 32: 42.4, 40: 48.3, 50: 60.3, 65: 76.1, 80: 88.9, 100: 114.3, 125: 139.7, 150: 168.3, 200: 219.1, 250: 273, 300: 323.9 };

// ---------- agua: propiedades en función de la temperatura (°C)
export const water = (Tc) => {
  const rho = 1000 * (1 - ((Tc + 288.9414) / (508929.2 * (Tc + 68.12963))) * (Tc - 3.9863) ** 2);
  const mu = 2.414e-5 * 10 ** (247.8 / (Tc + 133.15));
  const pv = 10 ** (8.07131 - 1730.63 / (233.426 + Tc)) * 133.322;
  return { rho, mu, nu: mu / rho, pv };
};
export function pipeCalc({ Q, Di, L, eps = 0.045, K = 0, T = 20, dz = 0, Pabs = 101325, Hs = 0, npshr = null }) {
  const w = water(T), A = Math.PI * (Di / 1000) ** 2 / 4, v = Q / 3600 / A, Re = v * (Di / 1000) / w.nu;
  const f = D.colebrook(Re, eps / Di), hfl = f * (L / (Di / 1000)) * v * v / (2 * 9.81), hfs = K * v * v / (2 * 9.81), hf = hfl + hfs;
  const dp = (hf + dz) * w.rho * 9.81;
  const npsha = (Pabs - w.pv) / (w.rho * 9.81) + Hs - hf;
  return { v, Re, f, hfl, hfs, hf, dp, npsha, margin: npshr != null ? npsha - npshr : null, rho: w.rho, pv: w.pv };
}

// ---------- cargas térmicas simplificadas (W)
export const USES = { Oficina: { occ: 10, light: 12, equip: 15 }, Vivienda: { occ: 20, light: 6, equip: 5 }, Aula: { occ: 2.5, light: 12, equip: 5 }, Comercio: { occ: 5, light: 20, equip: 10 }, Restaurante: { occ: 1.5, light: 15, equip: 20 }, Camarote: { occ: 6, light: 10, equip: 8 }, 'Sala de máquinas': { occ: 50, light: 10, equip: 0 } };
export const SOLAR = { N: 40, NE: 120, E: 180, SE: 160, S: 120, SO: 160, O: 180, NO: 120 };
export function roomLoads(o) {
  const A = o.area, V = A * o.h, Aw = o.perim * o.h * o.extFrac, Ag = Aw * o.glazing, Aop = Aw - Ag;
  const use = USES[o.use] || USES.Oficina, people = Math.max(1, Math.round(A / use.occ));
  const vent = Math.max(people * o.lsPerson * 3.6, V * (o.ach || 0)); // m³/h
  const dTw = o.tin_w - o.tout_w, dTs = o.tout_s - o.tin_s;
  const heat = (o.Uw * Aop + o.Ug * Ag) * dTw + 0.34 * vent * dTw;
  const sens = (o.Uw * Aop + o.Ug * Ag) * dTs + Ag * (SOLAR[o.orient] || 120) * o.g + people * 75 + A * (use.light + use.equip) + 0.34 * vent * dTs;
  const lat = people * 55 + 0.83 * vent * (o.dw || 3);
  return { A, V, people, vent, heat, sens, lat, total: sens + lat, wm2: (sens + lat) / A };
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const putTable = (c, p, cells, o = {}) => {
    const d = doc(), th = o.th || (d.vars.TEXTSIZE || 2.5);
    const e = newTable(p, cells.length, cells[0].length, { th, rh: th * 2.6, head: o.head ?? 1 });
    e.cells = cells.map((r) => r.map((v) => String(v)));
    e.cols = cells[0].map((_, j) => Math.max(...cells.map((r) => E.textWidth(String(r[j] ?? ''), th, 1) + th * 1.6)));
    e.layer = d.clayer; e.color = 256; e.style = d.vars.TEXTSTYLE;
    return d.add(e);
  };

  // ======================= CONDUCTOS 3D, ISOMÉTRICO Y LISTA DE MATERIALES =======================
  const pickDucts = async (c) => { let s = await c.select('Select ducts <all>:', { filter: (e) => e.type === 'DUCT' }); if (!s.length) s = doc().model.filter((e) => e.type === 'DUCT'); return s; };
  R('DUCTELEV', async (c) => {
    const s = await pickDucts(c); if (!s.length) return;
    const z = need(await c.getReal(`Enter duct axis elevation (mm) <${s[0].z ?? 2800}>:`, { def: s[0].z ?? 2800 }));
    const d = doc(); d.begin('DUCTELEV'); for (const e of s) d.mod(e, (x) => (x.z = z)); d.end(); c.print(`${s.length} duct(s) at elevation ${z}.`);
  });
  // tramo recto como malla: caja (rectangular) o prisma de 16 lados (circular) alrededor del eje
  const segMesh = (a, b, z, e) => {
    const u = G.norm(G.sub(b, a)), n = { x: -u.y, y: u.x }, L = G.dist(a, b);
    const local = (s, y, zz) => [a.x + u.x * s + n.x * y, a.y + u.y * s + n.y * y, z + zz];
    const sec = e.shape === 'round' ? Array.from({ length: 16 }, (_, i) => [e.d / 2 * Math.cos(i * Math.PI / 8), e.d / 2 * Math.sin(i * Math.PI / 8)]) : [[-e.w / 2, -e.h / 2], [e.w / 2, -e.h / 2], [e.w / 2, e.h / 2], [-e.w / 2, e.h / 2]];
    const r0 = sec.map(([y, zz]) => local(0, y, zz)), r1_ = sec.map(([y, zz]) => local(L, y, zz)), polys = [r0.slice(), r1_.slice().reverse()];
    for (let i = 0; i < sec.length; i++) { const j = (i + 1) % sec.length; polys.push([r0[j], r0[i], r1_[i], r1_[j]]); }
    return polys;
  };
  R('DUCT3D', async (c) => {
    const s = await pickDucts(c); if (!s.length) { c.print('No ducts.'); return; }
    const d = doc(); d.begin('DUCT3D'); let n = 0;
    for (const e of s) {
      const z = e.z ?? 2800;
      for (let i = 1; i < e.pts.length; i++) {
        // se prolongan medio ancho en los codos para que los tramos se unan
        const ext = D.ductWidth(e) / 2, a0 = e.pts[i - 1], b0 = e.pts[i], u = G.norm(G.sub(b0, a0));
        const a = i > 1 ? G.sub(a0, G.mul(u, ext)) : a0, b = i < e.pts.length - 1 ? G.add(b0, G.mul(u, ext)) : b0;
        let polys = segMesh(a, b, z, e);
        // corrige la orientación de las caras
        const vol = polys.reduce((acc, f) => { for (let k = 1; k < f.length - 1; k++) { const [p, q, r] = [f[0], f[k], f[k + 1]]; acc += (p[0] * (q[1] * r[2] - q[2] * r[1]) - p[1] * (q[0] * r[2] - q[2] * r[0]) + p[2] * (q[0] * r[1] - q[1] * r[0])) / 6; } return acc; }, 0);
        if (vol < 0) polys = polys.map((f) => f.slice().reverse());
        d.add({ type: '3DSOLID', kind: 'mesh', polys, layer: e.layer, color: e.color, duct: e.hid }); n++;
      }
    }
    d.end(); c.print(`${n} duct segment(s) created as 3D solids.`); redraw();
  }, { alias: ['CONDUCTO3D'] });
  R('DUCTISO', async (c) => {
    const s = await pickDucts(c); if (!s.length) { c.print('No ducts.'); return; }
    const ins = need(await c.getPoint('Specify insertion point for the isometric:'));
    const sc = need(await c.getReal('Enter scale <1>:', { def: 1 }));
    const c30 = Math.cos(Math.PI / 6), s30 = 0.5;
    const iso = (p, z) => ({ x: (p.x - p.y) * c30, y: (p.x + p.y) * s30 + z });
    const bb = G.bbNew(); for (const e of s) for (const p of e.pts) G.bbAdd(bb, iso(p, e.z ?? 2800));
    const o = { x: bb.x1, y: bb.y1 }, Pt = (p, z) => G.add(ins, G.mul(G.sub(iso(p, z), o), sc));
    const d = doc(); d.begin('DUCTISO'); d.touchTables(); d.ensureLayer('CLIMA-ISOMETRICO', { color: 4 });
    for (const e of s) {
      const z = e.z ?? 2800, pts = e.pts.map((p) => Pt(p, z));
      d.add({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ ...p, b: 0 })), closed: false, layer: 'CLIMA-ISOMETRICO', lw: 50 });
      for (let i = 1; i < pts.length; i++) {
        const m = G.mid(pts[i - 1], pts[i]); let a = G.ang(pts[i - 1], pts[i]); if (a > Math.PI / 2 || a < -Math.PI / 2) a += Math.PI;
        const L = G.dist(e.pts[i - 1], e.pts[i]) / 1000;
        d.add({ type: 'TEXT', p: G.add(m, G.polar({ x: 0, y: 0 }, a + Math.PI / 2, 2.5 * sc * 40)), h: 2.5 * sc * 40, rot: G.normA(a), text: `${D.sectionText(e)}  L=${r1(L)} m`, layer: 'CLIMA-ISOMETRICO', ha: 1, va: 0 });
      }
      d.add({ type: 'TEXT', p: G.add(pts[0], { x: 0, y: -6 * sc * 40 }), h: 2.5 * sc * 40, text: `${D.SYSTEMS[e.sys]?.label || ''} +${r1(z / 1000)} m`, layer: 'CLIMA-ISOMETRICO' });
    }
    d.end(); redraw();
  });
  const ductBom = (s) => {
    const rows = new Map();
    for (const e of s) {
      const k = `${D.SYSTEMS[e.sys]?.label || e.sys || ''}|${D.sectionText(e)}`;
      const L = D.pathLength(e.pts) / 1000, per = e.shape === 'round' ? Math.PI * e.d / 1000 : 2 * (e.w + e.h) / 1000;
      const r = rows.get(k) || { sys: D.SYSTEMS[e.sys]?.label || e.sys || '', sec: D.sectionText(e), L: 0, A: 0, el: 0, ins: 0 };
      r.L += L; r.A += per * L; r.el += Math.max(0, e.pts.length - 2); r.ins += e.ins ? (per + 8 * e.ins / 1000) * L : 0;
      rows.set(k, r);
    }
    return [...rows.values()].sort((a, b) => a.sys.localeCompare(b.sys) || a.sec.localeCompare(b.sec));
  };
  app.ductBom = ductBom;
  R('DUCTBOM', async (c) => {
    const s = await pickDucts(c); if (!s.length) { c.print('No ducts.'); return; }
    const rows = ductBom(s);
    const cells = [[tr('Sistema'), tr('Sección'), tr('Longitud (m)'), tr('Chapa (m²)'), tr('Codos'), tr('Aislamiento (m²)')], ...rows.map((r) => [r.sys, r.sec, r1(r.L), r1(r.A), r.el, r.ins ? r1(r.ins) : '—'])];
    const tot = rows.reduce((a, r) => ({ L: a.L + r.L, A: a.A + r.A, el: a.el + r.el }), { L: 0, A: 0, el: 0 });
    cells.push([tr('TOTAL'), '', r1(tot.L), r1(tot.A), tot.el, '']);
    const k = await c.getPoint('Specify insertion point or [Excel] <Excel>:', { def: 'Excel' });
    if (isPt(k)) { const d = doc(); d.begin('DUCTBOM'); putTable(c, k, cells); d.end(); redraw(); }
    else if (k != null) await app.writeCells(cells, (doc().name.replace(/\.\w+$/, '') || 'conductos') + '-materiales', 'xlsx');
  }, { alias: ['LISTACONDUCTOS'] });

  // ======================= CARGAS TÉRMICAS POR RECINTO =======================
  R('ROOMLOADS', async (c) => {
    const s = await c.select('Select closed polylines of rooms:', { filter: (e) => e.type === 'LWPOLYLINE' && e.closed });
    if (!s.length) return;
    const f = await app.ui.dlg.form('Cargas térmicas por recinto (orientativo)', [
      { t: 'sep', l: 'Recinto' },
      { k: 'use', l: 'Uso', v: 'Oficina', t: 'select', opts: Object.keys(USES) }, { k: 'h', l: 'Altura libre (m)', v: 2.7, t: 'number' }, { k: 'unit', l: 'Unidades del dibujo', v: 0.001, t: 'select', opts: [{ v: 0.001, l: 'Milímetros' }, { v: 0.01, l: 'Centímetros' }, { v: 1, l: 'Metros' }] },
      { t: 'sep', l: 'Envolvente' },
      { k: 'extFrac', l: 'Fracción de perímetro exterior', v: 0.5, t: 'number' }, { k: 'glazing', l: 'Fracción acristalada', v: 0.3, t: 'number' }, { k: 'orient', l: 'Orientación del hueco', v: 'S', t: 'select', opts: Object.keys(SOLAR) },
      { k: 'Uw', l: 'U muro (W/m²K)', v: 0.49, t: 'number' }, { k: 'Ug', l: 'U hueco (W/m²K)', v: 2.1, t: 'number' }, { k: 'g', l: 'Factor solar g', v: 0.6, t: 'number' },
      { t: 'sep', l: 'Condiciones' },
      { k: 'tout_w', l: 'T exterior invierno (°C)', v: 1, t: 'number' }, { k: 'tin_w', l: 'T interior invierno (°C)', v: 21, t: 'number' }, { k: 'tout_s', l: 'T exterior verano (°C)', v: 30, t: 'number' }, { k: 'tin_s', l: 'T interior verano (°C)', v: 25, t: 'number' },
      { k: 'lsPerson', l: 'Ventilación (l/s·persona)', v: 12.5, t: 'number' }, { k: 'label', l: 'Rotular cada recinto', v: true, t: 'check' },
    ]);
    if (!f) return;
    const u = +f.unit, rows = [[tr('Recinto'), tr('Área (m²)'), tr('Ocupantes'), tr('Ventilación (m³/h)'), tr('Calefacción (W)'), tr('Refrigeración sensible (W)'), tr('Refrigeración latente (W)'), tr('Total (W)'), 'W/m²']];
    const d = doc(); d.begin('ROOMLOADS'); d.touchTables(); d.ensureLayer('CLIMA-CARGAS', { color: 30 });
    s.forEach((e, i) => {
      const pts = E.polyPoints(e), area = Math.abs(G.polyArea(pts)) * u * u, perim = E.entLength(e) * u;
      const res = roomLoads({ ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === 'string' && !isNaN(+v) && k !== 'orient' && k !== 'use' ? +v : v])), area, perim });
      const name = `R${String(i + 1).padStart(2, '0')}`;
      rows.push([name, r1(res.A), res.people, r1(res.vent, 0), r1(res.heat, 0), r1(res.sens, 0), r1(res.lat, 0), r1(res.total, 0), r1(res.wm2, 0)]);
      if (f.label) { const bb = E.entBBox(e, d), hh = Math.max(bb.x2 - bb.x1, bb.y2 - bb.y1) / 25; d.add({ type: 'MTEXT', p: { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 }, h: hh, w: 0, att: 5, layer: 'CLIMA-CARGAS', text: `${name} — ${r1(res.A)} m²\\PQc ${r1(res.heat / 1000)} kW · Qr ${r1(res.total / 1000)} kW` }); }
    });
    const tot = rows.slice(1).reduce((a, r) => [a[0] + +r[1], a[1] + +r[4], a[2] + +r[7]], [0, 0, 0]);
    rows.push([tr('TOTAL'), r1(tot[0]), '', '', r1(tot[1], 0), '', '', r1(tot[2], 0), '']);
    d.end();
    const k = await c.getPoint('Specify insertion point or [Excel] <Excel>:', { def: 'Excel' });
    if (isPt(k)) { d.begin('ROOMLOADS'); putTable(c, k, rows); d.end(); } else if (k != null) await app.writeCells(rows, 'cargas-termicas', 'xlsx');
    c.print('Simplified loads (guidance only): transmission, solar through glazing, occupants, lighting, equipment and ventilation.');
    redraw();
  }, { alias: ['CARGASTERMICAS'] });

  // ======================= HOJA DE DATOS PED =======================
  R('PEDSHEET', async (c) => {
    const f = await app.ui.dlg.form('Hoja de datos — equipo a presión (PED 2014/68/UE)', [
      { k: 'tag', l: 'Identificador', v: 'V-101' }, { k: 'desc', l: 'Descripción', v: 'Depósito acumulador' },
      { k: 'kind', l: 'Tipo', v: 'vessel', t: 'select', opts: [{ v: 'vessel', l: 'Recipiente' }, { v: 'piping', l: 'Tubería' }] },
      { k: 'state', l: 'Estado del fluido', v: 'gas', t: 'select', opts: [{ v: 'gas', l: 'Gas, gas licuado o vapor' }, { v: 'liquid', l: 'Líquido' }] },
      { k: 'group', l: 'Grupo de fluido', v: 2, t: 'select', opts: [{ v: 1, l: 'Grupo 1 (peligroso)' }, { v: 2, l: 'Grupo 2' }] },
      { k: 'fluid', l: 'Fluido', v: 'Aire comprimido' },
      { k: 'PS', l: 'PS — presión máxima admisible (bar)', v: 10, t: 'number' }, { k: 'TS', l: 'TS — temperatura máx./mín. (°C)', v: '-10 / 80' },
      { k: 'V', l: 'V — volumen (L)', v: 500, t: 'number' }, { k: 'DN', l: 'DN (tuberías)', v: 0, t: 'number' },
      { k: 'PT', l: 'Presión de prueba (bar)', v: '' }, { k: 'mat', l: 'Material', v: 'P265GH' }, { k: 'code', l: 'Código de diseño', v: 'EN 13445' }, { k: 'ca', l: 'Sobreespesor de corrosión (mm)', v: 1 },
    ]);
    if (!f) return;
    const PS = +f.PS, V = +f.V, DN = +f.DN, res = pedCategory({ kind: f.kind, state: f.state, group: +f.group, PS, V, DN });
    const PT = f.PT || r1(Math.max(1.25 * PS, 1.43 * PS), 1);
    const rows = [[`${tr('HOJA DE DATOS')} — ${f.tag}`, ''], [tr('Descripción'), f.desc], [tr('Tipo'), f.kind === 'vessel' ? tr('Recipiente') : tr('Tubería')], [tr('Fluido'), `${f.fluid} (${f.state === 'gas' ? tr('gas') : tr('líquido')}, ${tr('grupo')} ${f.group})`],
      ['PS (bar)', r1(PS, 1)], ['TS (°C)', f.TS], ...(f.kind === 'vessel' ? [['V (L)', r1(V, 0)], ['PS·V (bar·L)', r1(PS * V, 0)]] : [['DN', DN], ['PS·DN', r1(PS * DN, 0)]]),
      [tr('Presión de prueba (bar)'), PT], [tr('Material'), f.mat], [tr('Código de diseño'), f.code], [tr('Sobreespesor de corrosión (mm)'), f.ca],
      [tr('Categoría PED'), res.cat], [tr('Cuadro del anexo II'), String(res.table)], [tr('Módulos de evaluación'), PED_MODULES[res.cat] || (/4\.3/.test(res.cat) ? tr('Buenas prácticas de ingeniería; sin marcado CE') : '—')],
      [tr('Nota'), tr('Orientativo: verifique con el anexo II de la Directiva 2014/68/UE.')]];
    const p = need(await c.getPoint('Specify insertion point:'));
    const d = doc(); d.begin('PEDSHEET'); putTable(c, p, rows, { head: 1 }); d.end();
    c.print(`PED category: ${res.cat} (table ${res.table}).`); redraw();
  }, { alias: ['HOJAPED', 'PED'] });

  // ======================= BRIDAS EN 1092-1 =======================
  const flangeBlock = (pn, dn) => {
    const d = doc(), [D_, K, L, n, bolt] = EN1092[pn][dn], od = PIPE_OD[dn], name = `BRIDA_EN1092_PN${pn}_DN${dn}`;
    if (d.blocks[name]) return name;
    const ents = [{ type: 'CIRCLE', c: { x: 0, y: 0 }, r: D_ / 2, layer: '0' }, { type: 'CIRCLE', c: { x: 0, y: 0 }, r: od / 2, layer: '0' }, { type: 'CIRCLE', c: { x: 0, y: 0 }, r: K / 2, layer: '0', ltype: 'CENTER', color: 1 }];
    for (let i = 0; i < n; i++) { const a = Math.PI / n + i * 2 * Math.PI / n; ents.push({ type: 'CIRCLE', c: G.polar({ x: 0, y: 0 }, a, K / 2), r: L / 2, layer: '0' }); }
    ents.push({ type: 'LINE', p1: { x: -D_ / 2 - 5, y: 0 }, p2: { x: D_ / 2 + 5, y: 0 }, layer: '0', ltype: 'CENTER', color: 1 }, { type: 'LINE', p1: { x: 0, y: -D_ / 2 - 5 }, p2: { x: 0, y: D_ / 2 + 5 }, layer: '0', ltype: 'CENTER', color: 1 });
    ents.push({ type: 'ATTDEF', tag: 'DESIGNACION', prompt: 'Designación', def: `EN 1092-1 DN${dn} PN${pn}`, p: { x: 0, y: -D_ / 2 - 12 }, h: 5, ha: 1, layer: '0' });
    ents.push({ type: 'ATTDEF', tag: 'TORNILLERIA', prompt: 'Tornillería', def: `${n}×${bolt}  Ø${L}  K=${K}`, p: { x: 0, y: -D_ / 2 - 20 }, h: 4, ha: 1, layer: '0' });
    d.touchTables(); if (!d.ltypes.CENTER) d.ltypes.CENTER = { name: 'CENTER', desc: 'Center ____ _ ____', pat: [31.75, -6.35, 6.35, -6.35] };
    d.blocks[name] = { name, base: { x: 0, y: 0 }, ents: ents.map((e, i) => { d.stamp(e); e.bid = i; return e; }), params: [], desc: `Brida EN 1092-1 DN${dn} PN${pn} (D=${D_}, K=${K}, ${n}×${bolt})`, _ver: 1 };
    return name;
  };
  app.flangeBlock = flangeBlock;
  R('FLANGE', async (c) => {
    const f = await app.ui.dlg.form('Brida EN 1092-1', [{ k: 'pn', l: 'PN', v: 16, t: 'select', opts: Object.keys(EN1092).map((v) => ({ v: +v, l: 'PN ' + v })) }, { k: 'dn', l: 'DN', v: 100, t: 'select', opts: Object.keys(PIPE_OD).map((v) => ({ v: +v, l: 'DN ' + v })) }, { k: 'list', l: 'Insertar tabla de dimensiones', v: false, t: 'check' }]);
    if (!f) return;
    const pn = +f.pn, dn = +f.dn, [D_, K, L, n, bolt] = EN1092[pn][dn];
    c.print(`EN 1092-1 DN${dn} PN${pn}: D=${D_} K=${K} holes ${n}×Ø${L} bolts ${bolt}. Check dimensions against the standard.`);
    const d = doc(); d.begin('FLANGE'); const name = flangeBlock(pn, dn); d.end();
    const p = need(await c.getPoint('Specify insertion point:', { preview: (q) => [{ type: 'INSERT', name, p: q, sx: 1, sy: 1, rot: 0 }] }));
    d.begin('FLANGE'); app.blocks.insertBlock(name, p, 1, 1, 0, {}, d.space);
    if (f.list) { const q = need(await c.getPoint('Specify insertion point for the table:')); putTable(c, q, [['DN', 'D', 'K', 'L', 'n', tr('Tornillos')], ...Object.keys(EN1092[pn]).map((k) => [k, ...EN1092[pn][k]])], { th: 5 }); }
    d.end(); redraw();
  }, { alias: ['BRIDA'] });

  // ======================= CÁLCULO DE TUBERÍAS Y NPSH =======================
  R('PIPECALC', async (c) => {
    const s = await c.select('Select pipe polylines or lines:', { filter: (e) => e.type === 'LWPOLYLINE' || e.type === 'LINE' });
    const Ldraw = s.reduce((a, e) => a + E.entLength(e), 0);
    const f = await app.ui.dlg.form('Cálculo de tubería (agua)', [
      { k: 'Q', l: 'Caudal (m³/h)', v: 10, t: 'number' }, { k: 'Di', l: 'Diámetro interior (mm)', v: 52.5, t: 'number' }, { k: 'L', l: 'Longitud (m)', v: r1(Ldraw / 1000, 2), t: 'number' },
      { k: 'eps', l: 'Rugosidad (mm)', v: 0.045, t: 'number' }, { k: 'K', l: 'Suma de coeficientes K singulares', v: 5, t: 'number' }, { k: 'T', l: 'Temperatura del agua (°C)', v: 20, t: 'number' }, { k: 'dz', l: 'Desnivel a vencer (m)', v: 0, t: 'number' },
      { t: 'sep', l: 'NPSH (tramo de aspiración)' }, { k: 'Pabs', l: 'Presión absoluta en el depósito (bar)', v: 1.013, t: 'number' }, { k: 'Hs', l: 'Altura del nivel sobre la bomba (m, negativo si aspira)', v: 1, t: 'number' }, { k: 'npshr', l: 'NPSH requerido (m)', v: 3, t: 'number' },
    ]);
    if (!f) return;
    const r = pipeCalc({ Q: +f.Q, Di: +f.Di, L: +f.L, eps: +f.eps, K: +f.K, T: +f.T, dz: +f.dz, Pabs: +f.Pabs * 1e5, Hs: +f.Hs, npshr: +f.npshr });
    const rows = [[tr('Cálculo de tubería'), ''], [tr('Caudal (m³/h)'), r1(+f.Q)], [tr('Diámetro interior (mm)'), r1(+f.Di, 1)], [tr('Velocidad (m/s)'), r1(r.v)], ['Re', r1(r.Re, 0)], [tr('Factor de fricción (Colebrook)'), r1(r.f, 4)],
      [tr('Pérdida lineal (m.c.a.)'), r1(r.hfl)], [tr('Pérdida singular (m.c.a.)'), r1(r.hfs)], [tr('Pérdida total (m.c.a.)'), r1(r.hf)], [tr('Δp total con desnivel (kPa)'), r1(r.dp / 1000)],
      [tr('Presión de vapor (kPa)'), r1(r.pv / 1000)], ['NPSH disponible (m)', r1(r.npsha)], ['NPSH requerido (m)', r1(+f.npshr)], [tr('Margen (m)'), r1(r.margin) + (r.margin < 0.5 ? '  ⚠' : '')]];
    for (const [a, b] of rows.slice(1)) c.print(`${a}: ${b}`);
    const k = await c.getPoint('Specify insertion point for results or [None] <None>:', { def: 'None' });
    if (isPt(k)) { const d = doc(); d.begin('PIPECALC'); putTable(c, k, rows); d.end(); redraw(); }
    app._lastPipe = r;
  }, { alias: ['CALCTUBERIA', 'NPSH'] });

  // ======================= P&ID: ETIQUETAS Y LISTADO =======================
  const PREFIX = { VALVULA: 'V', BOMBA: 'P', FILTRO: 'F', INTERCAMBIADOR: 'E', VASO: 'VE', MANOMETRO: 'PI', TERMOMETRO: 'TI', INSTRUMENTO: 'I' };
  const pidBlocks = (arr) => arr.filter((e) => e.type === 'INSERT' && /^PID_/.test(e.name));
  const kindOf = (e) => e.name.replace(/^PID_/, '').split('_')[0];
  R('PIDTAG', async (c) => {
    let s = pidBlocks(await c.select('Select P&ID symbols <all>:'));
    if (!s.length) s = pidBlocks(doc().space);
    if (!s.length) { c.print('No P&ID symbols.'); return; }
    const start = need(await c.getInt('Starting number <101>:', { def: 101 }));
    const counters = {};
    s.sort((a, b) => b.p.y - a.p.y || a.p.x - b.p.x);
    const d = doc(); d.begin('PIDTAG');
    for (const e of s) {
      const pre = PREFIX[kindOf(e)] || kindOf(e).slice(0, 2);
      const num = counters[pre] = (counters[pre] ?? start - 1) + 1;
      d.mod(e, (x) => { const a = (x.attribs || []).find((t) => /^(TAG|LAZO)$/.test(t.tag)); if (a) { a.text = a.tag === 'LAZO' ? String(num) : `${pre}-${num}`; E.invalidate(a); } });
    }
    d.end(); c.print(`${s.length} symbol(s) tagged.`); redraw();
  }, { alias: ['ETIQUETAPID'] });
  app.pidList = (arr) => pidBlocks(arr || doc().space).map((e) => {
    const tag = (e.attribs || []).find((a) => a.tag === 'TAG')?.text || [(e.attribs || []).find((a) => a.tag === 'FUNCION')?.text, (e.attribs || []).find((a) => a.tag === 'LAZO')?.text].filter(Boolean).join('-');
    // línea más próxima con rótulo
    let line = '', bd = Infinity;
    for (const t of doc().space) if (t.type === 'TEXT' && t.layer === 'PID-LINEAS-PRINCIPALES') { const dd = G.dist(t.p, e.p); if (dd < bd) { bd = dd; line = t.text; } }
    return [tag, e.name.replace(/^PID_/, '').replace(/_/g, ' ').toLowerCase().replace(/^./, (m) => m.toUpperCase()), line, `${r1(e.p.x, 0)}, ${r1(e.p.y, 0)}`];
  }).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  R('PIDLIST', async (c) => {
    const rows = app.pidList(); if (!rows.length) { c.print('No P&ID symbols.'); return; }
    const cells = [[tr('Identificador'), tr('Tipo'), tr('Línea'), tr('Posición')], ...rows];
    const k = await c.getPoint('Specify insertion point or [Excel] <Excel>:', { def: 'Excel' });
    if (isPt(k)) { const d = doc(); d.begin('PIDLIST'); putTable(c, k, cells); d.end(); redraw(); }
    else if (k != null) await app.writeCells(cells, 'listado-valvuleria', 'xlsx');
  }, { alias: ['LISTAPID'] });
}
