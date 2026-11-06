// Ficha Mecánica: tubería ASME/EN, bridas ASME B16.5 (WN, SO, LWN, ciega; caras RF, FF y RTJ),
// codos de radio largo y corto, reducciones concéntricas y excéntricas, tes, cruces, casquetes (B16.9)
// y manguitos (B16.11). Dibujo 2D en milímetros: vista lateral (alzado) o frontal.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { newTable } from '../core/table.js';
import { Cancel } from './engine.js';
import { t as T } from '../core/i18n.js';
import { pairsToLisp } from '../io/xdutil.js';
import * as P from '../core/pipedata.js';

const IN = 25.4;
const need = (v) => { if (v == null) throw new Cancel(); return v; };
const isPt = (v) => v && typeof v === 'object' && 'x' in v;
const r1 = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;
const DN_NPS = Object.fromEntries(Object.entries(P.DN).map(([k, v]) => [v, k]));
export const CLASSES = Object.keys(P.FL);
export const npsTxt = (n) => n.replace('-', ' ') + '"';

// ---------------------------------------------------------------- datos
export function pipeOf(s) {
  if (s.std === 'EN') {
    const row = P.EN_PIPE.find((r) => r[1] === +s.od) || P.EN_PIPE[8];
    const t = +s.t || row[2][Math.min(2, row[2].length - 1)];
    return { std: 'EN', od: row[1], t, id: row[1] - 2 * t, dn: row[0], nps: DN_NPS[row[0]], label: `Ø${row[1]}×${t} EN 10220`, size: `DN${row[0]}` };
  }
  const row = P.PIPE.find((r) => r[0] === s.nps) || P.PIPE.find((r) => r[0] === '4');
  const sch = row[2][s.sch] != null ? s.sch : row[2].STD != null ? 'STD' : Object.keys(row[2])[0];
  const od = row[1] * IN, t = row[2][sch] * IN;
  return { std: 'ASME', od, t, id: od - 2 * t, dn: P.DN[row[0]], nps: row[0], sch, label: `NPS ${npsTxt(row[0])} Sch ${sch} ASME B36.10M/19M`, size: `NPS ${npsTxt(row[0])}` };
}
export const pipeKgM = (od, t) => 0.0246615 * (od - t) * t; // acero al carbono
export function flangeOf(cls, nps) {
  const f = P.FL[cls]; if (!f) return null;
  const i = f.nps.indexOf(nps); if (i < 0) return null;
  const incl = cls === '150' || cls === '300';
  const bolt = P.fr(f.d[i]);
  const ring = P.RTJ_RING[cls]?.[i] ?? null, rg = ring && P.RINGS[ring];
  const gr = rg && P.GROOVE[String(rg[1])];
  const j20 = P.N20.indexOf(nps);
  return {
    cls, nps, i, incl, O: f.O[i] * IN, C: f.tf[i] * IN, BC: f.BC[i] * IN, n: f.n[i], bolt: f.d[i], hole: (bolt + 0.125) * IN,
    X: f.X[i] * IN, Y: f.Y[i] * IN, R: P.RF[nps] * IN, rfH: incl ? 1.6 : 6.4,
    Yso: P.SO_Y[cls]?.[i] != null ? P.SO_Y[cls][i] * IN : null, Bso: j20 >= 0 ? P.SO_B[j20] * IN : null,
    ring, P: rg ? rg[0] * IN : null, F: gr ? gr[0] * IN : null, Eg: gr ? gr[1] * IN : null, K: rg ? (rg[0] + gr[0] + 0.5) * IN : null,
  };
}
function bwIdx(nps) { return P.BWN.indexOf(nps); }
export function elbowR(nps, type) { const i = bwIdx(nps); if (i < 0) return null; const v = (type === 'SR' ? P.BW.sr90 : P.BW.lr90)[i]; return v == null ? null : v * IN; }

// ---------------------------------------------------------------- geometría (bloques locales)
const L = (x1, y1, x2, y2, o = {}) => ({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer: '0', ...o });
const AX = { layer: 'MEC_EJES', color: 256, ltype: 'BYLAYER' };
const HID = { layer: 'MEC_OCULTAS', color: 256, ltype: 'BYLAYER' };
const rectL = (x1, y1, x2, y2, o) => [L(x1, y1, x2, y1, o), L(x2, y1, x2, y2, o), L(x2, y2, x1, y2, o), L(x1, y2, x1, y1, o)];
const arc = (c, r, a1, a2, o = {}) => ({ type: 'ARC', c, r, a1, a2, layer: '0', ...o });
const circ = (c, r, o = {}) => ({ type: 'CIRCLE', c, r, layer: '0', ...o });

// brida en vista lateral: cara de junta en x = 0, el cuerpo hacia +X; devuelve también la cota del extremo de soldadura
export function flangeSide(fl, kind, face, pipe, o = {}) {
  const out = [];
  const h = face === 'FF' ? 0 : face === 'RTJ' ? 6.4 : fl.rfH;
  const x0 = h;
  const disc = fl.incl ? fl.C - fl.rfH : fl.C; // en 150/300 el espesor C incluye el resalte de 1,6 mm
  const x1 = x0 + disc;
  const O2 = fl.O / 2;
  // resalte
  if (face === 'RF') out.push(...rectL(0, -fl.R / 2, x0, fl.R / 2));
  if (face === 'RTJ') {
    const K2 = fl.K / 2; out.push(...rectL(0, -K2, x0, K2));
    if (fl.P) for (const sg of [1, -1]) { const y1 = sg * (fl.P / 2 - fl.F / 2), y2 = sg * (fl.P / 2 + fl.F / 2), yb1 = sg * (fl.P / 2 - fl.F / 4), yb2 = sg * (fl.P / 2 + fl.F / 4); out.push(L(0, y1, fl.Eg, yb1, HID), L(fl.Eg, yb1, fl.Eg, yb2, HID), L(fl.Eg, yb2, 0, y2, HID)); }
  }
  // disco
  out.push(...rectL(x0, -O2, x1, O2));
  // taladros (dos visibles en la vista lateral)
  for (const sg of [1, -1]) { const yc = sg * fl.BC / 2; out.push(L(x0, yc - fl.hole / 2, x1, yc - fl.hole / 2, HID), L(x0, yc + fl.hole / 2, x1, yc + fl.hole / 2, HID), L(x0 - 3, yc, x1 + 3, yc, AX)); }
  let xe = x1, bore = 0;
  if (kind === 'WN') {
    xe = x0 + (fl.incl ? fl.Y - fl.rfH : fl.Y);
    const a = pipe.od / 2, X2 = fl.X / 2;
    out.push(L(x1, X2, xe, a), L(x1, -X2, xe, -a), L(xe, -a, xe, a));
    bore = pipe.id;
  } else if (kind === 'SO') {
    xe = x0 + (fl.incl ? fl.Yso - fl.rfH : fl.Yso);
    out.push(...rectL(x1, -fl.X / 2, xe, fl.X / 2).slice(0, 3));
    bore = fl.Bso;
  } else if (kind === 'LWN') {
    xe = o.lwnL || 9 * IN;
    out.push(...rectL(x1, -fl.X / 2, xe, fl.X / 2).slice(0, 3));
    bore = o.lwnBore || pipe.id;
  }
  if (bore) out.push(L(0, bore / 2, xe, bore / 2, HID), L(0, -bore / 2, xe, -bore / 2, HID));
  out.push(L(-6, 0, xe + 6, 0, AX));
  return { ents: out, len: xe, weldOD: kind === 'WN' ? pipe.od : null };
}
// brida en vista frontal (desde la cara de junta)
export function flangeFront(fl, kind, face, pipe) {
  const c0 = { x: 0, y: 0 }, out = [circ(c0, fl.O / 2)];
  if (face === 'RF') out.push(circ(c0, fl.R / 2));
  if (face === 'RTJ') { out.push(circ(c0, fl.K / 2)); if (fl.P) out.push(circ(c0, fl.P / 2 - fl.F / 2), circ(c0, fl.P / 2 + fl.F / 2)); }
  const bore = kind === 'WN' ? pipe.id : kind === 'SO' ? fl.Bso : kind === 'LWN' ? pipe.id : 0;
  if (bore) out.push(circ(c0, bore / 2));
  out.push(circ(c0, fl.BC / 2, AX));
  for (let k = 0; k < fl.n; k++) { const a = Math.PI / fl.n + k * 2 * Math.PI / fl.n, q = G.polar(c0, a, fl.BC / 2); out.push(circ(q, fl.hole / 2)); }
  const e = fl.O / 2 + 6; out.push(L(-e, 0, e, 0, AX), L(0, -e, 0, e, AX));
  return { ents: out };
}
// codo: entra por el origen en dirección +X y gira a la izquierda (+Y) un ángulo ang (rad), radio R
export function elbowEnts(R, od, ang, id) {
  const c0 = { x: 0, y: R }, a1 = -Math.PI / 2, a2 = -Math.PI / 2 + ang, out = [];
  out.push(arc(c0, R + od / 2, a1, a2), arc(c0, R - od / 2, a1, a2), arc(c0, R, a1, a2, AX));
  if (id) out.push(arc(c0, R + id / 2, a1, a2, HID), arc(c0, R - id / 2, a1, a2, HID));
  const end = (a) => { const p = G.polar(c0, a, R - od / 2), q = G.polar(c0, a, R + od / 2); return L(p.x, p.y, q.x, q.y); };
  out.push(end(a1), end(a2));
  return { ents: out, out: G.polar(c0, a2, R), outDir: ang };
}
// reducción: extremo grande en x = 0, longitud H; excéntrica con la generatriz plana abajo (o arriba)
export function reducerEnts(D1, D2, H, ecc, flatTop) {
  const s = H * 0.12, out = [];
  const off = ecc ? (flatTop ? 1 : -1) * (D1 - D2) / 2 : 0; // desplazamiento del eje del extremo pequeño
  const y = (x, sg) => { const D = x <= s ? D1 : x >= H - s ? D2 : D1 + (D2 - D1) * (x - s) / (H - 2 * s); const c = x <= s ? 0 : x >= H - s ? off : off * (x - s) / (H - 2 * s); return c + sg * D / 2; };
  for (const sg of [1, -1]) { out.push(L(0, y(0, sg), s, y(s, sg)), L(s, y(s, sg), H - s, y(H - s, sg)), L(H - s, y(H - s, sg), H, y(H, sg))); }
  out.push(L(0, -D1 / 2, 0, D1 / 2), L(H, off - D2 / 2, H, off + D2 / 2), L(s, y(s, -1), s, y(s, 1), { ...HID }), L(H - s, y(H - s, -1), H - s, y(H - s, 1), { ...HID }));
  out.push(L(-6, 0, s, 0, AX), L(s, 0, H - s, off, AX), L(H - s, off, H + 6, off, AX));
  return { ents: out, outOff: off };
}
// te / cruz: origen en el centro, colector sobre el eje X (±C), derivación hacia +Y hasta M (y -Y en la cruz)
export function teeEnts(D, d, C, M, cross) {
  const out = [], a = D / 2, b = d / 2;
  const bx = Math.min(b, a);
  out.push(L(-C, -a, -C, a), L(C, -a, C, a));
  // generatriz superior interrumpida por la derivación, intersección aproximada con curva
  const join = (sg) => {
    out.push(L(-C, sg * a, -bx, sg * a), L(bx, sg * a, C, sg * a), L(-bx, sg * a, -bx, sg * M), L(bx, sg * a, bx, sg * M));
    if (bx < a - 1e-6) { // curva de intersección: arco por (-b, a), (0, √(a²-b²)) y (b, a)
      const yJ = Math.sqrt(a * a - bx * bx), yc = (bx * bx + a * a - yJ * yJ) / (2 * (a - yJ)), r = yc - yJ;
      if (sg > 0) out.push(arc({ x: 0, y: yc }, r, Math.atan2(a - yc, -bx), Math.atan2(a - yc, bx)));
      else out.push(arc({ x: 0, y: -yc }, r, Math.atan2(yc - a, bx), Math.atan2(yc - a, -bx)));
    }
    out.push(L(-b, sg * M, b, sg * M), L(0, 0, 0, sg * (M + 6), AX));
  };
  join(1);
  if (cross) join(-1); else out.push(L(-C, -a, C, -a));
  out.push(L(-C - 6, 0, C + 6, 0, AX));
  return { ents: out };
}
export function capEnts(D, Ec) {
  const out = [], a = D / 2, k = Math.min(Ec * 0.55, a * 0.9);
  out.push(L(0, -a, 0, a), L(0, a, Ec - k, a), L(0, -a, Ec - k, -a));
  out.push({ type: 'ELLIPSE', c: { x: Ec - k, y: 0 }, major: { x: 0, y: a }, ratio: k / a, a1: Math.PI, a2: 2 * Math.PI, layer: '0' });
  out.push(L(-6, 0, Ec + 6, 0, AX));
  return { ents: out };
}
export function couplingEnts(c) { // c: { len, od, bore, sock: [{x1,x2,d}], thread }
  const out = [...rectL(0, -c.od / 2, c.len, c.od / 2)];
  for (const s of c.sock || []) out.push(L(s.x1, s.d / 2, s.x2, s.d / 2, HID), L(s.x1, -s.d / 2, s.x2, -s.d / 2, HID), L(s.x2, -s.d / 2, s.x2, s.d / 2, HID));
  if (c.bore) out.push(L(0, c.bore / 2, c.len, c.bore / 2, HID), L(0, -c.bore / 2, c.len, -c.bore / 2, HID));
  out.push(L(-6, 0, c.len + 6, 0, AX));
  return { ents: out };
}

// ---------------------------------------------------------------- comandos
export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s, ...a) => T(s, ...a);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const spec = () => (doc().ext.mec ||= { std: 'ASME', nps: '4', sch: 'STD', od: 114.3, t: 6.0, cls: '150', face: 'RF', kind: 'WN', elbow: 'LR', view: 'side', mode: 'double', ccls: '3000' });
  const scale = () => (doc().vars.INSUNITS === 1 ? 1 / IN : 1);

  const ensureLayers = (d) => {
    d.touchTables();
    if (!d.ltypes.MEC_EJE) d.ltypes.MEC_EJE = { name: 'MEC_EJE', desc: 'Eje ____ _ ____', pat: [12, -3, 2, -3] };
    if (!d.ltypes.MEC_OCULTA) d.ltypes.MEC_OCULTA = { name: 'MEC_OCULTA', desc: 'Oculta __ __ __', pat: [4, -2] };
    d.ensureLayer('MEC_TUBERIA', { color: 4, lw: 35 }); d.ensureLayer('MEC_ACCESORIOS', { color: 3, lw: 35 }); d.ensureLayer('MEC_BRIDAS', { color: 2, lw: 35 });
    d.ensureLayer('MEC_EJES', { color: 1, ltype: 'MEC_EJE', lw: 13 }); d.ensureLayer('MEC_OCULTAS', { color: 8, ltype: 'MEC_OCULTA', lw: 13 });
  };
  const defBlock = (name, ents, desc) => {
    const d = doc(); if (d.blocks[name]) return name;
    ensureLayers(d);
    d.blocks[name] = { name, base: { x: 0, y: 0 }, ents: ents.map((e, i) => { const x = { ...e }; x.color ??= 256; d.stamp(x); x.bid = i; return x; }), params: [], desc, _ver: 1 };
    return name;
  };
  const tagMec = (e, info) => { e.mec = info; e.xd = { ...(e.xd || {}), MEC: pairsToLisp([[1000, info.desc], [1000, `kind=${info.kind}`], ...(info.len ? [[1040, info.len]] : [])]) }; return e; };
  const place = async (c, name, info, o = {}) => {
    const d = doc(), k = scale(), sy = (o.mirror ? -1 : 1) * k;
    const p = need(await c.getPoint(o.prompt || 'Specify insertion point:', { preview: (q) => [{ type: 'INSERT', name, p: q, sx: k, sy, rot: 0, layer: o.layer }] }));
    const dir = await c.getPoint('Specify direction <0>:', { base: p, def: 'D0', preview: (q) => [{ type: 'INSERT', name, p, sx: k, sy, rot: Math.atan2(q.y - p.y, q.x - p.x), layer: o.layer }] });
    const rot = isPt(dir) ? Math.atan2(dir.y - p.y, dir.x - p.x) : 0;
    d.begin(o.cmd || 'MEC');
    const e = app.blocks.insertBlock(name, p, k, sy, rot, {}, d.space);
    e.layer = o.layer; tagMec(e, info);
    d.end(); redraw(); return e;
  };

  // ---------- diálogo de selección (listas dependientes y vista previa)
  const h = (tag, a = {}, ...ch) => { const el = document.createElement(tag); for (const [k, v] of Object.entries(a)) { if (k === 'text') el.textContent = v; else if (k === 'style') Object.assign(el.style, v); else if (k.startsWith('on')) el[k] = v; else el.setAttribute(k, v); } for (const c of ch.flat()) if (c != null && c !== '') el.append(c); return el; };
  const sel = (opts, v) => { const s = h('select', { class: 'fld' }); for (const o of opts) { const [val, lab] = Array.isArray(o) ? o : [o, o]; const op = h('option', { value: val, text: lab }); if (String(val) === String(v)) op.selected = true; s.append(op); } return s; };
  async function chooser(title, fields, build) {
    // fields: [{k, l, opts: (vals) => [...], v}] — las opciones se recalculan al cambiar cualquier campo
    const vals = Object.fromEntries(fields.map((f) => [f.k, f.v]));
    const grid = h('div', { class: 'frm' }), cv = h('canvas', { width: 300, height: 220, style: { width: '300px', height: '220px', border: '1px solid var(--border, #8884)', background: 'var(--bg2, #fff)' } });
    const info = h('div', { class: 'hint', style: { maxWidth: '300px', whiteSpace: 'pre-wrap', marginTop: '6px' } });
    const render = () => {
      grid.replaceChildren();
      for (const f of fields) {
        if (f.when && !f.when(vals)) continue;
        if (f.t === 'number') { const inp = h('input', { class: 'fld', type: 'number', step: 'any', value: vals[f.k] ?? '' }); inp.onchange = () => { vals[f.k] = inp.value; render(); }; grid.append(h('label', { text: tr(f.l) }), inp); continue; }
        const opts = f.opts(vals); if (!opts.some((o) => String(Array.isArray(o) ? o[0] : o) === String(vals[f.k]))) vals[f.k] = Array.isArray(opts[0]) ? opts[0]?.[0] : opts[0];
        const s = sel(opts.map((o) => (Array.isArray(o) ? [o[0], tr(String(o[1]))] : o)), vals[f.k]); s.onchange = () => { vals[f.k] = s.value; render(); };
        grid.append(h('label', { text: tr(f.l) }), s);
      }
      try { const r = build(vals); info.textContent = r?.info || ''; drawPrev(cv, r?.ents || []); } catch (err) { info.textContent = err.message; drawPrev(cv, []); }
    };
    render();
    const ok = await app.ui.dlg.open({ title: tr(title), body: [h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '14px' } }, grid, h('div', {}, cv, info))], onOk: () => true });
    return ok ? vals : null;
  }
  const drawPrev = (cv, ents) => {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    if (!ents.length) return;
    const bb = G.bbNew(); for (const e of ents) { const b = E.entBBox(e, doc()); if (G.bbValid(b)) G.bbUnion(bb, b); }
    if (!G.bbValid(bb)) return;
    const s = Math.min((W - 30) / Math.max(1e-6, bb.x2 - bb.x1), (H - 30) / Math.max(1e-6, bb.y2 - bb.y1));
    g.setTransform(s, 0, 0, -s, W / 2 - s * (bb.x1 + bb.x2) / 2, H / 2 + s * (bb.y1 + bb.y2) / 2);
    const dark = document.body.classList.contains('dark') || matchMedia?.('(prefers-color-scheme: dark)').matches && !document.body.classList.contains('light');
    for (const e of ents) {
      g.lineWidth = 1.2 / s; g.setLineDash(e.layer === 'MEC_OCULTAS' ? [4 / s, 3 / s] : e.layer === 'MEC_EJES' ? [10 / s, 3 / s, 2 / s, 3 / s] : []);
      g.strokeStyle = e.layer === 'MEC_EJES' ? '#d33' : e.layer === 'MEC_OCULTAS' ? '#888' : dark ? '#ddd' : '#223';
      g.beginPath();
      if (e.type === 'LINE') { g.moveTo(e.p1.x, e.p1.y); g.lineTo(e.p2.x, e.p2.y); }
      else if (e.type === 'CIRCLE') g.arc(e.c.x, e.c.y, e.r, 0, 2 * Math.PI);
      else if (e.type === 'ARC') g.arc(e.c.x, e.c.y, e.r, e.a1, e.a2);
      else if (e.type === 'ELLIPSE') { const a = Math.hypot(e.major.x, e.major.y), rot = Math.atan2(e.major.y, e.major.x); g.ellipse(e.c.x, e.c.y, a, a * e.ratio, rot, e.a1, e.a2); }
      g.stroke();
    }
  };
  const NPS_OPTS = () => P.PIPE.map((r) => [r[0], npsTxt(r[0]) + ' (DN ' + P.DN[r[0]] + ')']);
  const SCH_OPTS = (v) => { const r = P.PIPE.find((x) => x[0] === v.nps); return r ? P.SCH.filter((s) => r[2][s] != null).map((s) => [s, `${s} (${r1(r[2][s] * IN, 2)} mm)`]) : ['STD']; };
  const EN_OPTS = () => P.EN_PIPE.map((r) => [r[1], `Ø${r[1]} (DN ${r[0]})`]);
  const ENT_OPTS = (v) => (P.EN_PIPE.find((r) => r[1] === +v.od) || P.EN_PIPE[0])[2].map((t) => [t, t.toFixed(1) + ' mm']);
  const pipeFields = (s, npsList) => [
    { k: 'std', l: 'Norma del tubo', v: s.std, opts: () => [['ASME', 'ASME B36.10M / B36.19M'], ['EN', 'EN 10220 / EN 10216']] },
    { k: 'nps', l: 'Diámetro (NPS)', v: s.nps, when: (v) => v.std === 'ASME', opts: () => (npsList ? NPS_OPTS().filter((o) => npsList.includes(o[0])) : NPS_OPTS()) },
    { k: 'sch', l: 'Serie (schedule)', v: s.sch, when: (v) => v.std === 'ASME', opts: SCH_OPTS },
    { k: 'od', l: 'Diámetro exterior (mm)', v: s.od, when: (v) => v.std === 'EN', opts: () => (npsList ? EN_OPTS().filter((o) => npsList.includes(DN_NPS[P.EN_PIPE.find((r) => r[1] === o[0])[0]])) : EN_OPTS()) },
    { k: 't', l: 'Espesor (mm)', v: s.t, when: (v) => v.std === 'EN', opts: ENT_OPTS },
  ];
  const save = (v) => { const s = spec(); for (const k of Object.keys(v)) s[k] = v[k]; };
  const mecInfo = (kind, desc, extra = {}) => ({ kind, desc, ...extra });

  // ---------- BRIDAS
  const FL_KIND = [['WN', 'Cuello para soldar (WN)'], ['SO', 'Plana deslizante (SO)'], ['LWN', 'Cuello largo (LWN)'], ['BL', 'Ciega']];
  const FACE = [['RF', 'Cara con resalte (RF)'], ['FF', 'Cara plana (FF)'], ['RTJ', 'Junta de anillo (RTJ)']];
  const VIEW = [['side', 'Lateral (alzado)'], ['front', 'Frontal']];
  const flangeBuild = (v) => {
    const pipe = pipeOf(v), fl = flangeOf(v.cls, pipe.nps);
    if (!fl) throw new Error(T('No existe brida de clase {0} para {1} en ASME B16.5.', v.cls, pipe.size));
    if (v.kind === 'SO' && fl.Yso == null) throw new Error(T('ASME B16.5 no incluye bridas SO de clase {0} en {1}.', v.cls, pipe.size));
    if (v.face === 'RTJ' && !fl.ring) throw new Error(T('No hay anillo RTJ normalizado para clase {0} en {1}.', v.cls, pipe.size));
    const lwnL = (+v.lwn || 9) * IN;
    const g = v.view === 'front' ? flangeFront(fl, v.kind, v.face, pipe) : flangeSide(fl, v.kind, v.face, pipe, { lwnL });
    const kindTxt = { WN: 'WN', SO: 'SO', LWN: 'LWN', BL: T('Ciega') }[v.kind];
    const desc = `${T('Brida')} ${kindTxt} ${v.face} Cl.${v.cls} ${pipe.size}${v.kind === 'WN' || v.kind === 'LWN' ? (pipe.std === 'ASME' ? ' Sch ' + pipe.sch : ' e=' + pipe.t) : ''} ASME B16.5${v.kind === 'LWN' ? ` L=${r1(lwnL, 0)}` : ''}`;
    const info = `Ø ${r1(fl.O)} · C ${r1(fl.C)} · ${T('círculo')} ${r1(fl.BC)}\n${fl.n} × ${fl.bolt}" (${T('taladro')} Ø${r1(fl.hole)})` + (v.kind === 'WN' ? `\nX ${r1(fl.X)} · Y ${r1(fl.Y)}` : v.kind === 'SO' ? `\nX ${r1(fl.X)} · Y ${r1(fl.Yso)} · B ${r1(fl.Bso)}` : '') + (v.face === 'RTJ' ? `\nR-${fl.ring}: P ${r1(fl.P, 2)} · F ${r1(fl.F, 2)} · E ${r1(fl.Eg, 2)} · K≈${r1(fl.K)}` : `\nRF Ø${r1(fl.R)} × ${fl.rfH}`);
    const name = `MEC_BRIDA_${v.kind}_${v.face}_CL${v.cls}_${pipe.std === 'ASME' ? 'NPS' + pipe.nps + '_' + pipe.sch : 'EN' + pipe.od + 'x' + pipe.t}_${v.view === 'front' ? 'F' : 'L'}${v.kind === 'LWN' ? '_' + (+v.lwn || 9) : ''}`.replace(/[^\w.-]/g, '_');
    return { ents: g.ents, info, desc, name, fl, pipe, len: g.len };
  };
  app.mec = { pipeOf, flangeOf, flangeBuild, spec };
  R('MFLANGE', async (c, args) => {
    const s = spec();
    const v = args?.vals || await chooser('Brida ASME B16.5', [
      { k: 'kind', l: 'Tipo', v: args?.kind || s.kind, opts: () => FL_KIND },
      { k: 'face', l: 'Cara', v: s.face, opts: (x) => (x.kind === 'BL' ? FACE : FACE) },
      { k: 'cls', l: 'Clase', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) },
      ...pipeFields(s, null),
      { k: 'lwn', l: 'Longitud LWN (pulgadas)', v: s.lwn || 9, when: (x) => x.kind === 'LWN', opts: () => [[9, '9"'], [12, '12"'], [16, '16"']] },
      { k: 'view', l: 'Vista', v: s.view, opts: () => VIEW },
    ], flangeBuild);
    if (!v) return; save(v);
    const b = flangeBuild(v);
    const d = doc(); d.begin('MFLANGE'); defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + '\n' + b.info.replace(/\n/g, ' · '));
    await place(c, b.name, mecInfo('FLANGE', b.desc), { layer: 'MEC_BRIDAS', cmd: 'MFLANGE', prompt: 'Specify gasket face point:' });
  }, { alias: ['BRIDAASME', 'MBRIDA'] });
  for (const [cmd, kind] of [['MFLANGEWN', 'WN'], ['MFLANGESO', 'SO'], ['MFLANGELWN', 'LWN'], ['MFLANGEBL', 'BL']]) R(cmd, (c) => eng.commands.MFLANGE.fn(c, { kind }));

  // ---------- CODOS
  const elbowBuild = (v) => {
    const pipe = pipeOf(v), ang = +v.ang;
    const R0 = elbowR(pipe.nps, v.elbow);
    if (!R0) throw new Error(T('No hay codo {0} de {1} en ASME B16.9.', v.elbow === 'SR' ? T('de radio corto') : T('de radio largo'), pipe.size));
    if (v.elbow === 'SR' && ang === 45) throw new Error(T('ASME B16.9 no define codos de 45° de radio corto.'));
    const g = elbowEnts(R0, pipe.od, ang * Math.PI / 180, v.hid === '1' ? pipe.id : 0);
    const cte = R0 * Math.tan(ang * Math.PI / 360);
    const std = pipe.std === 'EN' ? (v.elbow === 'SR' ? 'EN 10253 2D' : 'EN 10253 3D') : 'ASME B16.9';
    const desc = `${T('Codo')} ${ang}° ${v.elbow === 'SR' ? T('radio corto') : T('radio largo')} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch : 'e=' + pipe.t} ${std}`;
    const info = `R ${r1(R0)} · ${T('centro a cara')} ${r1(ang === 180 ? 2 * R0 : cte)}${ang === 180 ? ' (' + T('centro a centro') + ')' : ''}`;
    const name = `MEC_CODO${ang}_${v.elbow}_${pipe.std === 'ASME' ? 'NPS' + pipe.nps + '_' + pipe.sch : 'EN' + pipe.od + 'x' + pipe.t}${v.hid === '1' ? '_H' : ''}`.replace(/[^\w.-]/g, '_');
    return { ents: g.ents, info, desc, name, R: R0 };
  };
  R('MELBOW', async (c) => {
    const s = spec();
    const v = await chooser('Codo ASME B16.9', [
      { k: 'elbow', l: 'Radio', v: s.elbow, opts: () => [['LR', 'Radio largo (1,5 D)'], ['SR', 'Radio corto (1 D)']] },
      { k: 'ang', l: 'Ángulo', v: s.ang || 90, opts: (x) => (x.elbow === 'SR' ? [[90, '90°'], [180, '180°']] : [[90, '90°'], [45, '45°'], [180, '180°']]) },
      ...pipeFields(s, P.BWN),
      { k: 'hid', l: 'Mostrar espesor (ocultas)', v: s.hid || '0', opts: () => [['0', 'No'], ['1', 'Sí']] },
    ], elbowBuild);
    if (!v) return; save(v);
    const b = elbowBuild(v), d = doc(); d.begin('MELBOW'); defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + ' · ' + b.info);
    const side = await c.getKw('Turn direction [Left/Right] <Left>:', 'Left');
    await place(c, b.name, mecInfo('ELBOW', b.desc), { layer: 'MEC_ACCESORIOS', cmd: 'MELBOW', mirror: side === 'Right', prompt: 'Specify inlet end point:' });
  }, { alias: ['CODO', 'MCODO'] });

  // ---------- REDUCCIONES
  const reducerBuild = (v) => {
    const big = pipeOf(v), small = pipeOf({ ...v, nps: v.nps2, od: v.od2, t: v.t2, sch: v.sch });
    const i = bwIdx(big.nps); const H = P.BW.red[i];
    if (H == null) throw new Error(T('No hay reducción en ASME B16.9 para {0}.', big.size));
    if (small.od >= big.od) throw new Error(T('El extremo pequeño debe ser menor que el grande.'));
    const ecc = v.rtype === 'ECC', g = reducerEnts(big.od, small.od, H * IN, ecc, v.flat === 'TOP');
    const std = big.std === 'EN' ? 'EN 10253' : 'ASME B16.9';
    const desc = `${T('Reducción')} ${ecc ? T('excéntrica') : T('concéntrica')} ${big.size} × ${small.size} ${big.std === 'ASME' ? 'Sch ' + big.sch : 'e=' + big.t} ${std}`;
    const name = `MEC_RED_${v.rtype}${ecc ? '_' + v.flat : ''}_${big.std === 'ASME' ? 'NPS' + big.nps + 'x' + small.nps + '_' + big.sch : 'EN' + big.od + 'x' + small.od}`.replace(/[^\w.-]/g, '_');
    return { ents: g.ents, info: `H ${r1(H * IN)} · Ø ${r1(big.od)} → ${r1(small.od)}` + (ecc ? ` · ${T('excentricidad')} ${r1((big.od - small.od) / 2)}` : ''), desc, name };
  };
  R('MREDUCER', async (c, args) => {
    const s = spec();
    const v = await chooser('Reducción ASME B16.9', [
      { k: 'rtype', l: 'Tipo', v: args?.rtype || s.rtype || 'CON', opts: () => [['CON', 'Concéntrica'], ['ECC', 'Excéntrica']] },
      { k: 'flat', l: 'Generatriz plana', v: s.flat || 'BOT', when: (x) => x.rtype === 'ECC', opts: () => [['BOT', 'Abajo (FOB)'], ['TOP', 'Arriba (FOT)']] },
      ...pipeFields(s, P.BWN.filter((n) => P.BW.red[bwIdx(n)] != null)),
      { k: 'nps2', l: 'Extremo pequeño (NPS)', v: s.nps2, when: (x) => x.std === 'ASME', opts: (x) => NPS_OPTS().filter((o) => P.BWN.includes(o[0]) && P.fr(o[0]) < P.fr(x.nps) && P.fr(o[0]) >= P.fr(x.nps) / 4) },
      { k: 'od2', l: 'Extremo pequeño Ø (mm)', v: s.od2, when: (x) => x.std === 'EN', opts: (x) => EN_OPTS().filter((o) => o[0] < +x.od && o[0] >= +x.od / 4) },
      { k: 't2', l: 'Espesor extremo pequeño (mm)', v: s.t2, when: (x) => x.std === 'EN', opts: (x) => ENT_OPTS({ od: x.od2 }) },
    ], reducerBuild);
    if (!v) return; save(v);
    const b = reducerBuild(v), d = doc(); d.begin('MREDUCER'); defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + ' · ' + b.info);
    await place(c, b.name, mecInfo('REDUCER', b.desc), { layer: 'MEC_ACCESORIOS', cmd: 'MREDUCER', prompt: 'Specify large end point:' });
  }, { alias: ['REDUCCION', 'MREDUCCION'] });
  R('MREDUCERECC', (c) => eng.commands.MREDUCER.fn(c, { rtype: 'ECC' }));

  // ---------- TES Y CRUCES
  const teeBuild = (v, cross) => {
    const run = pipeOf(v), br = v.red === '1' ? pipeOf({ ...v, nps: v.nps2, od: v.od2, t: v.t2 }) : run;
    const i = bwIdx(run.nps), C = P.BW.tee[i] * IN;
    if (br.od > run.od) throw new Error(T('La derivación no puede ser mayor que el colector.'));
    // salida reducida: aproximación a la tabla de ASME B16.9 (M ≤ C)
    const M = br === run ? C : Math.max(C - (run.od - br.od) / 4, (P.BW.tee[bwIdx(br.nps)] || 0) * IN);
    const g = teeEnts(run.od, br.od, C, M, cross);
    const std = run.std === 'EN' ? 'EN 10253' : 'ASME B16.9';
    const what = cross ? T('Cruz') : T('Te');
    const desc = `${what} ${br === run ? T('igual') : T('reducida')} ${run.size}${br === run ? '' : ' × ' + br.size} ${run.std === 'ASME' ? 'Sch ' + run.sch : 'e=' + run.t} ${std}`;
    const name = `MEC_${cross ? 'CRUZ' : 'TE'}_${run.std === 'ASME' ? 'NPS' + run.nps + (br === run ? '' : 'x' + br.nps) + '_' + run.sch : 'EN' + run.od + (br === run ? '' : 'x' + br.od)}`.replace(/[^\w.-]/g, '_');
    return { ents: g.ents, info: `C ${r1(C)} · M ${r1(M)}${br === run ? '' : ' (' + T('aprox.') + ')'}`, desc, name };
  };
  for (const [cmd, cross, alias] of [['MTEE', false, ['TE', 'MTE']], ['MCROSS', true, ['CRUZ', 'MCRUZ']]]) {
    R(cmd, async (c) => {
      const s = spec();
      const v = await chooser(cross ? 'Cruz ASME B16.9' : 'Te ASME B16.9', [
        { k: 'red', l: 'Tipo', v: s.red || '0', opts: () => [['0', 'Igual'], ['1', 'Reducida']] },
        ...pipeFields(s, P.BWN),
        { k: 'nps2', l: 'Derivación (NPS)', v: s.nps2, when: (x) => x.std === 'ASME' && x.red === '1', opts: (x) => NPS_OPTS().filter((o) => P.BWN.includes(o[0]) && P.fr(o[0]) < P.fr(x.nps) && P.fr(o[0]) >= P.fr(x.nps) / 4) },
        { k: 'od2', l: 'Derivación Ø (mm)', v: s.od2, when: (x) => x.std === 'EN' && x.red === '1', opts: (x) => EN_OPTS().filter((o) => o[0] < +x.od && o[0] >= +x.od / 4) },
        { k: 't2', l: 'Espesor derivación (mm)', v: s.t2, when: (x) => x.std === 'EN' && x.red === '1', opts: (x) => ENT_OPTS({ od: x.od2 }) },
      ], (x) => teeBuild(x, cross));
      if (!v) return; save(v);
      const b = teeBuild(v, cross), d = doc(); d.begin(cmd); defBlock(b.name, b.ents, b.desc); d.end();
      c.print(b.desc + ' · ' + b.info);
      await place(c, b.name, mecInfo(cross ? 'CROSS' : 'TEE', b.desc), { layer: 'MEC_ACCESORIOS', cmd, prompt: 'Specify center point:' });
    }, { alias });
  }

  // ---------- CASQUETES
  const capBuild = (v) => {
    const pipe = pipeOf(v), i = bwIdx(pipe.nps), Ec = P.BW.cap[i] * IN;
    const desc = `${T('Casquete')} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch : 'e=' + pipe.t} ${pipe.std === 'EN' ? 'EN 10253' : 'ASME B16.9'}`;
    return { ents: capEnts(pipe.od, Ec).ents, info: `E ${r1(Ec)}`, desc, name: `MEC_CAP_${pipe.std === 'ASME' ? 'NPS' + pipe.nps + '_' + pipe.sch : 'EN' + pipe.od}`.replace(/[^\w.-]/g, '_') };
  };
  R('MCAP', async (c) => {
    const s = spec();
    const v = await chooser('Casquete ASME B16.9', pipeFields(s, P.BWN), capBuild);
    if (!v) return; save(v);
    const b = capBuild(v), d = doc(); d.begin('MCAP'); defBlock(b.name, b.ents, b.desc); d.end();
    await place(c, b.name, mecInfo('CAP', b.desc), { layer: 'MEC_ACCESORIOS', cmd: 'MCAP', prompt: 'Specify weld end point:' });
  }, { alias: ['CASQUETE', 'MCASQUETE'] });

  // ---------- MANGUITOS (B16.11)
  const couplingBuild = (v) => {
    const i = P.CPL_NPS.indexOf(v.cnps); if (i < 0) throw new Error(T('Diámetro no disponible.'));
    const half = v.ctype.startsWith('H'), sw = v.ctype.endsWith('SW');
    const nps = v.cnps, desc = `${half ? T('Medio manguito') : T('Manguito')} ${sw ? 'SW' : T('roscado NPT')} ${npsTxt(nps)} Class ${v.ccls} ASME B16.11`;
    if (sw) {
      const r = P.CPL_SW[v.ccls]?.[i]; if (!r) throw new Error(T('ASME B16.11 no incluye este manguito en clase {0}.', v.ccls));
      const [B, J, Cw, Eg, F] = r, od = B + 2 * Cw;
      const len = half ? F + J : 2 * J + Eg;
      const sock = half ? [{ x1: 0, x2: J, d: B }] : [{ x1: 0, x2: J, d: B }, { x1: len, x2: len - J, d: B }];
      const pipeId = (P.PIPE.find((x) => x[0] === nps)[1] - 2 * P.PIPE.find((x) => x[0] === nps)[2][v.ccls === '6000' ? '160' : '80']) * IN;
      return { ents: couplingEnts({ len, od, sock, bore: 0 }).ents.concat([L(J, pipeId / 2, half ? len : len - J, pipeId / 2, HID), L(J, -pipeId / 2, half ? len : len - J, -pipeId / 2, HID)]), info: `L ${r1(len)} · Ø ${r1(od)} · B ${B} · J ${J} (${T('mín.')})`, desc, name: `MEC_MANG_${v.ctype}_${v.ccls}_NPS${nps}`.replace(/[^\w.-]/g, '_') };
    }
    const r = P.CPL_THD[v.ccls][i], [A, Dd] = r, len = half ? A / 2 : A;
    const pod = P.PIPE.find((x) => x[0] === nps)[1] * IN;
    return { ents: couplingEnts({ len, od: Dd, bore: pod }).ents, info: `L ${r1(len)}${half ? ' (' + T('aprox.') + ')' : ''} · Ø ${Dd}`, desc, name: `MEC_MANG_${v.ctype}_${v.ccls}_NPS${nps}`.replace(/[^\w.-]/g, '_') };
  };
  R('MCOUPLING', async (c) => {
    const s = spec();
    const v = await chooser('Manguito ASME B16.11', [
      { k: 'ctype', l: 'Tipo', v: s.ctype || 'FSW', opts: () => [['FSW', 'Completo socket weld'], ['HSW', 'Medio socket weld'], ['FTHD', 'Completo roscado NPT'], ['HTHD', 'Medio roscado NPT']] },
      { k: 'ccls', l: 'Clase', v: s.ccls, opts: () => [['3000', 'Class 3000'], ['6000', 'Class 6000']] },
      { k: 'cnps', l: 'Diámetro (NPS)', v: s.cnps || '1', opts: (x) => P.CPL_NPS.filter((n, i) => !(x.ctype.endsWith('SW') && !P.CPL_SW[x.ccls][i])).map((n) => [n, npsTxt(n)]) },
    ], couplingBuild);
    if (!v) return; save(v);
    const b = couplingBuild(v), d = doc(); d.begin('MCOUPLING'); defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + ' · ' + b.info);
    await place(c, b.name, mecInfo('COUPLING', b.desc), { layer: 'MEC_ACCESORIOS', cmd: 'MCOUPLING', prompt: 'Specify end point:' });
  }, { alias: ['MANGUITO', 'MMANGUITO'] });

  // ---------- TUBERÍA (trazado con codos automáticos)
  R('MPIPE', async (c) => {
    const s = spec();
    const v = await chooser('Tubería', [
      ...pipeFields(s, null),
      { k: 'elbow', l: 'Codos en los quiebros', v: s.elbow, opts: () => [['LR', 'Radio largo (1,5 D)'], ['SR', 'Radio corto (1 D)'], ['NONE', 'Sin codo (inglete)']] },
      { k: 'mode', l: 'Representación', v: s.mode, opts: () => [['double', 'Doble línea'], ['single', 'Unifilar']] },
    ], (x) => { const p = pipeOf(x); return { info: `Ø ${r1(p.od)} × ${r1(p.t, 2)} · ${T('interior')} ${r1(p.id)}\n${r1(pipeKgM(p.od, p.t), 2)} kg/m`, ents: [...rectL(0, -p.od / 2, p.od * 3, p.od / 2), L(0, p.id / 2, p.od * 3, p.id / 2, HID), L(0, -p.id / 2, p.od * 3, -p.id / 2, HID), L(-6, 0, p.od * 3 + 6, 0, AX)] }; });
    if (!v) return; save(v);
    const pipe = pipeOf(v), k = scale();
    const pts = [need(await c.getPoint('Specify start point:'))];
    for (;;) {
      const q = await c.getPoint(pts.length > 1 ? 'Specify next point or [Undo] <done>:' : 'Specify next point:', { base: pts.at(-1), def: null });
      if (q === 'Undo') { if (pts.length > 1) pts.pop(); continue; }
      if (!isPt(q)) break;
      if (G.dist(q, pts.at(-1)) > 1e-6) pts.push(q);
    }
    if (pts.length < 2) return;
    const d = doc(); d.begin('MPIPE'); ensureLayers(d);
    const R0 = v.elbow === 'NONE' ? 0 : (elbowR(pipe.nps, v.elbow) || 0) * k;
    if (v.elbow !== 'NONE' && !R0) c.print(`No ${v.elbow} elbow in ASME B16.9 for this size: mitred joints used.`);
    const od = pipe.od * k, id = pipe.id * k;
    // recortes en cada vértice
    const cut = pts.map(() => [0, 0]); const bends = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = G.norm(G.sub(pts[i], pts[i - 1])), b = G.norm(G.sub(pts[i + 1], pts[i]));
      const ang = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y))); if (ang < 1e-3) continue;
      const left = a.x * b.y - a.y * b.x > 0;
      const tl = R0 ? R0 * Math.tan(ang / 2) : 0;
      if (R0 && (tl > G.dist(pts[i - 1], pts[i]) - cut[i - 1][1] || tl > G.dist(pts[i], pts[i + 1]))) { c.print('Segment too short for the elbow: mitred joint used.'); bends.push({ i, ang, left, tl: 0, a, b }); continue; }
      cut[i][0] = tl; cut[i][1] = tl; bends.push({ i, ang, left, tl, a, b });
    }
    const descP = `${T('Tubo')} ${pipe.label}`;
    const lay = 'MEC_TUBERIA'; let total = 0;
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const u = G.norm(G.sub(pts[i + 1], pts[i])), n = { x: -u.y, y: u.x };
      const p1 = G.add(pts[i], G.mul(u, cut[i][1])), p2 = G.sub(pts[i + 1], G.mul(u, cut[i + 1][0]));
      const len = G.dist(p1, p2); total += len; segs.push({ p1, p2, u, n, len });
    }
    if (v.mode === 'single') {
      // unifilar: polilínea por el eje con los codos como arcos
      const vs = [];
      for (let i = 0; i < segs.length; i++) {
        const sg = segs[i], bd = bends.find((x) => x.i === i + 1);
        if (i === 0) vs.push({ ...sg.p1, b: 0 });
        if (bd && bd.tl) { vs.push({ ...sg.p2, b: Math.tan(bd.ang / 4) * (bd.left ? 1 : -1) }); }
        else vs.push({ ...sg.p2, b: 0 });
      }
      const e = d.add({ type: 'LWPOLYLINE', pts: vs, closed: false, layer: lay, lw: 70 });
      tagMec(e, { kind: 'PIPE', desc: descP, len: total / k, od: pipe.od, t: pipe.t });
      for (const bd of bends) if (bd.tl) tagMec(d.add({ type: 'POINT', p: pts[bd.i], layer: 'MEC_ACCESORIOS' }), { kind: 'ELBOW', desc: `${T('Codo')} ${r1(bd.ang * 180 / Math.PI, 1)}° ${v.elbow === 'SR' ? T('radio corto') : T('radio largo')} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch + ' ASME B16.9' : 'e=' + pipe.t + ' EN 10253'}` });
    } else {
      // inglete: las generatrices se cortan en la bisectriz del quiebro
      const mit = new Set(bends.filter((x) => !x.tl).map((x) => x.i));
      const xl = (p, u, q, w) => { const den = u.x * w.y - u.y * w.x; if (Math.abs(den) < 1e-9) return null; const t = ((q.x - p.x) * w.y - (q.y - p.y) * w.x) / den; return G.add(p, G.mul(u, t)); };
      segs.forEach((sg, i) => {
        const off = (r) => {
          let q1 = G.add(sg.p1, G.mul(sg.n, r)), q2 = G.add(sg.p2, G.mul(sg.n, r));
          if (mit.has(i)) { const pv = segs[i - 1]; q1 = xl(G.add(pv.p1, G.mul(pv.n, r)), pv.u, q1, sg.u) || q1; }
          if (mit.has(i + 1)) { const nx = segs[i + 1]; q2 = xl(q2, sg.u, G.add(nx.p1, G.mul(nx.n, r)), nx.u) || q2; }
          return [q1, q2];
        };
        const [a1, a2] = off(od / 2), [b1, b2] = off(-od / 2), [h1, h2] = off(id / 2), [g1, g2] = off(-id / 2);
        d.add({ type: 'LINE', p1: a1, p2: a2, layer: lay }); d.add({ type: 'LINE', p1: b1, p2: b2, layer: lay });
        if (!mit.has(i)) d.add({ type: 'LINE', p1: a1, p2: b1, layer: lay });
        d.add({ type: 'LINE', p1: a2, p2: b2, layer: lay });
        if (s.hid === '1') { d.add({ type: 'LINE', p1: h1, p2: h2, layer: 'MEC_OCULTAS' }); d.add({ type: 'LINE', p1: g1, p2: g2, layer: 'MEC_OCULTAS' }); }
        const ax = d.add({ type: 'LINE', p1: sg.p1, p2: sg.p2, layer: 'MEC_EJES' });
        tagMec(ax, { kind: 'PIPE', desc: descP, len: sg.len / k, od: pipe.od, t: pipe.t });
      });
      for (const bd of bends) {
        if (!bd.tl) continue;
        const deg = r1(bd.ang * 180 / Math.PI, 2);
        const vv = { ...v, ang: deg, hid: s.hid };
        const g = elbowEnts(R0 / k, pipe.od, bd.ang, s.hid === '1' ? pipe.id : 0);
        const std = pipe.std === 'EN' ? 'EN 10253' : 'ASME B16.9';
        const cutTxt = Math.abs(deg - 90) < 0.01 || Math.abs(deg - 45) < 0.01 ? '' : ' (' + T('cortado') + ')';
        const desc = `${T('Codo')} ${Math.abs(deg - 90) < 0.01 ? 90 : Math.abs(deg - 45) < 0.01 ? 45 : deg}° ${v.elbow === 'SR' ? T('radio corto') : T('radio largo')}${cutTxt} ${pipe.size} ${pipe.std === 'ASME' ? 'Sch ' + pipe.sch : 'e=' + pipe.t} ${std}`;
        const name = `MEC_CODO${String(deg).replace('.', '_')}_${v.elbow}_${pipe.std === 'ASME' ? 'NPS' + pipe.nps + '_' + pipe.sch : 'EN' + pipe.od + 'x' + pipe.t}${s.hid === '1' ? '_H' : ''}`.replace(/[^\w.-]/g, '_');
        defBlock(name, g.ents, desc); void vv;
        const start = G.sub(pts[bd.i], G.mul(bd.a, bd.tl));
        const e = app.blocks.insertBlock(name, start, k, bd.left ? k : -k, Math.atan2(bd.a.y, bd.a.x), {}, d.space);
        e.layer = 'MEC_ACCESORIOS'; tagMec(e, { kind: 'ELBOW', desc });
      }
    }
    d.end(); redraw();
    c.print(`${descP}: ${r1(total / k / 1000, 3)} m, ${bends.filter((b) => b.tl).length} elbow(s).`);
  }, { alias: ['TUBERIAMEC', 'MTUBERIA', 'MTUBO'] });

  // ---------- ESPECIFICACIÓN Y LISTA DE MATERIALES
  R('MSPEC', async (c) => {
    const s = spec();
    const v = await chooser('Especificación de tubería', [...pipeFields(s, null), { k: 'cls', l: 'Clase de bridas', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) }, { k: 'face', l: 'Cara', v: s.face, opts: () => FACE }, { k: 'elbow', l: 'Codos', v: s.elbow, opts: () => [['LR', 'Radio largo (1,5 D)'], ['SR', 'Radio corto (1 D)']] }],
      (x) => { const p = pipeOf(x); const f = flangeOf(x.cls, p.nps); return { info: `${p.label}\n${f ? `${T('Brida')} Cl.${x.cls}: Ø${r1(f.O)}, ${f.n}×${f.bolt}"` : T('Sin brida B16.5 para este diámetro y clase')}`, ents: f ? flangeSide(f, 'WN', x.face, p).ents : [] }; });
    if (!v) return; save(v);
    c.print(`Piping spec: ${pipeOf(v).label}, Class ${v.cls} ${v.face}, ${v.elbow} elbows.`);
  }, { alias: ['ESPECTUBERIA', 'MESPEC'] });
  const mecOf = (e) => e.mec || null;
  app.mecBom = (ents) => {
    const rows = new Map();
    for (const e of ents) {
      const m = mecOf(e); if (!m) continue;
      const r = rows.get(m.desc) || { desc: m.desc, kind: m.kind, n: 0, len: 0, kg: 0 };
      if (m.kind === 'PIPE') { r.len += m.len || 0; if (m.od) r.kg += pipeKgM(m.od, m.t) * (m.len || 0) / 1000; } else r.n++;
      rows.set(m.desc, r);
    }
    const order = ['PIPE', 'FLANGE', 'ELBOW', 'TEE', 'CROSS', 'REDUCER', 'CAP', 'COUPLING'];
    return [...rows.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.desc.localeCompare(b.desc));
  };
  R('MBOM', async (c) => {
    let s = await c.select('Select piping objects <all>:');
    if (!s.length) s = [...doc().space];
    const rows = app.mecBom(s);
    if (!rows.length) { c.print('No piping components found.'); return; }
    const cells = [[T('Pos.'), T('Descripción'), T('Cant.'), T('Ud.'), T('Peso (kg)')], ...rows.map((r, i) => [i + 1, r.desc, r.kind === 'PIPE' ? r1(r.len / 1000, 2) : r.n, r.kind === 'PIPE' ? 'm' : T('ud'), r.kind === 'PIPE' ? r1(r.kg, 1) : ''])];
    for (const r of cells.slice(1)) c.print(r.join('  '));
    const p = await c.getPoint('Specify insertion point for the table or [None] <None>:', { def: 'None' });
    if (isPt(p)) {
      const d = doc(), th = (d.vars.TEXTSIZE || 2.5) * 2;
      d.begin('MBOM');
      const e = newTable(p, cells.length, cells[0].length, { th, rh: th * 2.6, head: 1 });
      e.cells = cells.map((r) => r.map((x) => String(x)));
      e.cols = cells[0].map((_, j) => Math.max(...cells.map((r) => E.textWidth(String(r[j] ?? ''), th, 1) + th * 1.6)));
      e.layer = d.clayer; e.color = 256; e.style = d.vars.TEXTSTYLE;
      d.add(e); d.end(); redraw();
    }
    app._lastMecBom = rows;
  }, { alias: ['LISTAMEC', 'MLISTA'] });

  // tabla de dimensiones de bridas B16.5 de una clase
  R('MFLANGETABLE', async (c) => {
    const s = spec();
    const v = await chooser('Tabla de bridas ASME B16.5', [{ k: 'cls', l: 'Clase', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) }], (x) => ({ info: `${P.FL[x.cls].nps.length} ${T('diámetros')}`, ents: [] }));
    if (!v) return;
    const f = P.FL[v.cls];
    const cells = [['NPS', 'DN', 'O', 'C', 'X', 'Y (WN)', 'Y (SO)', 'R', T('Círculo'), T('Taladros'), T('Tornillos'), 'RTJ']];
    f.nps.forEach((n) => { const x = flangeOf(v.cls, n); cells.push([npsTxt(n), P.DN[n], r1(x.O), r1(x.C), r1(x.X), r1(x.Y), x.Yso ? r1(x.Yso) : '—', r1(x.R), r1(x.BC), `${x.n}×Ø${r1(x.hole)}`, `${x.bolt}"`, x.ring ? 'R-' + x.ring : '—']); });
    const p = need(await c.getPoint('Specify insertion point for the table:'));
    const d = doc(), th = (d.vars.TEXTSIZE || 2.5) * 2;
    d.begin('MFLANGETABLE');
    const e = newTable(p, cells.length + 1, cells[0].length, { th, rh: th * 2.6, head: 1 });
    e.cells = [[`ASME B16.5 Class ${v.cls} (mm)`, ...Array(cells[0].length - 1).fill('')], ...cells].map((r) => r.map((x) => String(x)));
    e.cols = cells[0].map((_, j) => Math.max(...cells.map((r) => E.textWidth(String(r[j] ?? ''), th, 1) + th * 1.6)));
    e.layer = d.clayer; e.color = 256; e.style = d.vars.TEXTSTYLE;
    d.add(e); d.end(); redraw();
  }, { alias: ['TABLABRIDAS'] });
}
