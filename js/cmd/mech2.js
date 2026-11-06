// Ficha Mecánica (2): válvulas, filtros y mirillas (alzado y símbolo P&ID), juntas y tornillería,
// accesorios forjados ASME B16.11, derivaciones MSS SP-97, extremos para brida loca, bridas de orificio
// y figuras en ocho (B16.48).
import * as G from '../core/geom.js';
import { Cancel } from './engine.js';
import { t as T } from '../core/i18n.js';
import * as P from '../core/pipedata.js';
import * as P2 from '../core/pipedata2.js';
import { flangeOf, pipeOf, npsTxt, CLASSES } from './mech.js';

const IN = 25.4;
const need = (v) => { if (v == null) throw new Cancel(); return v; };
const r1 = (v, n = 1) => Math.round(v * 10 ** n) / 10 ** n;
const L = (x1, y1, x2, y2, o = {}) => ({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer: '0', ...o });
const AX = { layer: 'MEC_EJES', color: 256, ltype: 'BYLAYER' };
const HID = { layer: 'MEC_OCULTAS', color: 256, ltype: 'BYLAYER' };
const rect = (x1, y1, x2, y2, o) => [L(x1, y1, x2, y1, o), L(x2, y1, x2, y2, o), L(x2, y2, x1, y2, o), L(x1, y2, x1, y1, o)];
const arc = (c, r, a1, a2, o = {}) => ({ type: 'ARC', c, r, a1, a2, layer: '0', ...o });
const circ = (c, r, o = {}) => ({ type: 'CIRCLE', c, r, layer: '0', ...o });
const poly = (pts, closed = true, o = {}) => ({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ x: p[0], y: p[1], b: p[2] || 0 })), closed, layer: '0', ...o });
const fill = (pts) => ({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [pts.map((p) => ({ x: p[0], y: p[1], b: 0 }))], layer: '0' });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (cx, cy, a, b, o = {}) => ({ type: 'ELLIPSE', c: { x: cx, y: cy }, major: { x: a, y: 0 }, ratio: Math.min(1, b / a), a1: 0, a2: Math.PI * 2, layer: '0', ...o });

// ======================================================================= VÁLVULAS
export const VTYPES = [['gate', 'Compuerta'], ['globe', 'Globo'], ['check', 'Retención de clapeta'], ['lift', 'Retención de pistón'], ['ball', 'Bola'], ['plug', 'Macho'], ['bfly', 'Mariposa'], ['ystr', 'Filtro en Y'], ['bstr', 'Filtro de cesta'], ['sight', 'Mirilla']];
const SMALL = { gate: [79, 92, 111, 120, 152, 172], globe: [79, 92, 111, 120, 152, 172], check: [79, 92, 111, 120, 152, 172], lift: [79, 92, 111, 120, 152, 172], ball: [70, 80, 95, 110, 120, 140], plug: [70, 80, 95, 110, 120, 140], ystr: [65, 80, 95, 115, 130, 160], bstr: [110, 120, 140, 160, 180, 210], sight: [80, 90, 100, 115, 125, 150] };
const SMALL_NPS = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2'];
// longitud cara a cara (mm) y origen del dato
export function valveLen(type, cls, nps, ends, pattern) {
  if (ends === 'SW' || ends === 'THD') { const i = SMALL_NPS.indexOf(nps); if (i < 0) return null; return { L: SMALL[type]?.[i] ?? SMALL.gate[i], src: T('forjada (API 602), aprox.') }; }
  if (type === 'bfly') { const v = P2.BUTTERFLY[nps]; return v ? { L: v, src: 'EN 558-20 / API 609 A' } : null; }
  const col = { gate: 0, globe: 1, lift: 1, check: 2, ball: pattern === 'S' ? 4 : 3, plug: pattern === 'R' ? 6 : 5, ystr: 1, bstr: 1, sight: 1 }[type];
  if (ends === 'BW' && cls === '150') { const r = P2.VALVE_BW150[nps]; const v = r?.[{ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 5 }[col]]; if (v) return { L: v, src: 'ASME B16.10 (BW)' }; }
  const c = cls === '400' ? '600' : cls, r = P2.VALVE_FF[c]?.[nps]; let v = r?.[col];
  if (!v && type === 'ball') v = r?.[3] || r?.[4];
  if (!v && type === 'plug') v = r?.[5] || r?.[6];
  if (!v) return null;
  let src = 'ASME B16.10';
  if (type === 'bstr') { v = Math.round(v * 1.35); src = T('aprox.'); } else if (type === 'ystr' || type === 'sight') src = 'ASME B16.10 (' + T('como globo') + ')';
  if (ends === 'RTJ') { v += cls === '150' ? 13 : cls === '300' ? 16 : 3; src += ' RTJ ' + T('aprox.'); }
  if (ends === 'BW' && cls !== '150') src += ' (BW ≈ RF)';
  return { L: v, src };
}
// alzado de la válvula: entrada en x = 0, salida en x = L, eje en y = 0
export function valveEnts(o) {
  const { type, L: Lv, fl, od, ends, act } = o, out = [];
  const DN = o.dn || 100, O = fl ? fl.O : od * 1.6, C = fl ? fl.C : 0, R = fl ? fl.R : od;
  const flg = ends === 'RF' || ends === 'RTJ' || ends === 'FF';
  const c = Lv / 2;
  // extremos
  if (flg && type !== 'bfly') {
    for (const [a, b] of [[0, C], [Lv - C, Lv]]) out.push(...rect(a, -O / 2, b, O / 2));
    for (const x of [C, Lv - C]) for (const sg of [1, -1]) out.push(L(x === C ? 0 : Lv, sg * fl.BC / 2, x, sg * fl.BC / 2, AX));
  } else if (ends === 'BW') { out.push(...rect(0, -od / 2, Lv * 0.18, od / 2), ...rect(Lv * 0.82, -od / 2, Lv, od / 2)); }
  else if (ends === 'SW' || ends === 'THD') { const h = od * 0.85; out.push(...rect(0, -h, Lv * 0.22, h), ...rect(Lv * 0.78, -h, Lv, h)); out.push(L(0, od / 2, Lv * 0.2, od / 2, HID), L(0, -od / 2, Lv * 0.2, -od / 2, HID), L(Lv, od / 2, Lv * 0.8, od / 2, HID), L(Lv, -od / 2, Lv * 0.8, -od / 2, HID)); }
  const x1 = flg ? C : ends === 'BW' ? Lv * 0.18 : Lv * 0.22, x2 = Lv - x1;
  const hb = Math.max(od * 0.75, (flg ? O : od * 1.7) * 0.42);
  let top = hb; // altura sobre el eje donde empieza el accionamiento
  const stem = (y1, y2) => out.push(L(c - 5, y1, c - 5, y2), L(c + 5, y1, c + 5, y2));
  const wheel = (y, D) => { out.push(...rect(c - D / 2, y, c + D / 2, y + Math.max(12, D * 0.07)), L(c, y - 8, c, y + 6, AX)); };
  const gear = (y, D) => { const b = clamp(D * 0.45, 120, 380); out.push(...rect(c - b / 2, y, c + b / 2, y + b * 0.6)); out.push(...rect(c + b / 2, y + b * 0.15, c + b / 2 + b * 0.25, y + b * 0.45)); const W = clamp(D, 200, 700); out.push(...rect(c + b / 2 + b * 0.25, y + b * 0.3 - W / 2, c + b / 2 + b * 0.25 + 14, y + b * 0.3 + W / 2)); return y + b * 0.6; };
  const pneu = (y, D) => { const w = clamp(D * 1.1, 150, 700), h = w * 0.55; out.push(...rect(c - 25, y, c + 25, y + h * 0.4), ell(c, y + h * 0.4 + h * 0.3, w / 2, h * 0.3)); return y + h; };
  const elec = (y, D) => { const w = clamp(D * 0.9, 180, 520), h = w * 0.75; out.push(...rect(c - w / 2, y, c + w / 2, y + h), ...rect(c + w / 2, y + h * 0.2, c + w / 2 + w * 0.45, y + h * 0.7), circ({ x: c - w / 2 - 30, y: y + h * 0.5 }, 28)); return y + h; };
  const actuate = (yStem, handFn) => {
    if (act === 'gear') { const y = gear(yStem, O); return y; }
    if (act === 'pneu') return pneu(yStem, O);
    if (act === 'elec') return elec(yStem, O);
    return handFn();
  };
  if (type === 'gate' || type === 'globe') {
    const gate = type === 'gate';
    if (gate) out.push(...rect(x1, -hb, x2, hb));
    else { const r = Math.min((x2 - x1) / 2, hb * 1.05); out.push(ell(c, 0, r, hb), L(x1, -od / 2, c - r * 0.8, -od / 2), L(x2, od / 2, c + r * 0.8, od / 2)); out.push(L(x1, od / 2, c - r * 0.95, od * 0.15, HID), L(c - r * 0.3, od * 0.15, c + r * 0.3, -od * 0.15, HID)); }
    // tapa (bonete) y castillete
    const bw = Math.min(x2 - x1, O * 0.75), bh = gate ? hb * 0.9 + DN * 0.6 : hb * 0.6 + DN * 0.3;
    out.push(L(c - bw / 2, hb, c - bw * 0.3, hb + bh), L(c + bw / 2, hb, c + bw * 0.3, hb + bh), L(c - bw * 0.3, hb + bh, c + bw * 0.3, hb + bh));
    out.push(...rect(c - bw * 0.42, hb - 8, c + bw * 0.42, hb + 10));
    const H = gate ? 5 * DN + 180 : 3.4 * DN + 200;
    const yokeTop = Math.max(hb + bh + 40, H - 30);
    out.push(L(c - bw * 0.25, hb + bh, c - 12, yokeTop), L(c + bw * 0.25, hb + bh, c + 12, yokeTop));
    stem(hb + bh, yokeTop + 25);
    top = actuate(yokeTop, () => { wheel(yokeTop + 25, clamp(1.6 * DN + 100, 100, 760) * (gate ? 1 : 0.85)); return yokeTop + 40; });
    if (o.hand) out.push(L(c, 0, c, top + 20, AX));
  } else if (type === 'check' || type === 'lift') {
    const r = Math.min((x2 - x1) / 2, hb * 1.1);
    out.push(ell(c, 0, r, hb));
    const cw = r * 1.2, ch = O * 0.32;
    out.push(...rect(c - cw / 2, hb - 6, c + cw / 2, hb + ch * 0.5), L(c - cw / 2, hb + ch * 0.5, c, hb + ch), L(c + cw / 2, hb + ch * 0.5, c, hb + ch));
    if (type === 'check') { const hp = { x: c - r * 0.45, y: od * 0.45 }; out.push(L(hp.x, hp.y, hp.x + r * 0.15, -od * 0.42, HID), circ(hp, 4, HID)); }
    else out.push(...rect(c - od * 0.25, -od * 0.1, c + od * 0.25, od * 0.35, HID));
    // flecha de sentido de flujo
    const ay = -hb - 15; out.push(L(c - r * 0.6, ay, c + r * 0.6, ay), L(c + r * 0.6, ay, c + r * 0.6 - 12, ay - 5), L(c + r * 0.6, ay, c + r * 0.6 - 12, ay + 5));
    top = hb + ch;
  } else if (type === 'ball' || type === 'plug') {
    const r = Math.min((x2 - x1) / 2 + 4, hb * 1.05);
    if (type === 'ball') { out.push(circ({ x: c, y: 0 }, r), circ({ x: c, y: 0 }, Math.min(r * 0.75, od * 0.6), HID)); }
    else out.push(poly([[x1, -hb * 0.7], [x2, -hb * 0.7], [x2 - (x2 - x1) * 0.12, hb], [x1 + (x2 - x1) * 0.12, hb]]), ...rect(c - od * 0.35, -hb * 0.5, c + od * 0.35, hb * 0.8, HID));
    const ys = r + 20 + DN * 0.25;
    out.push(...rect(c - 22, r - 4, c + 22, r + 18)); stem(r + 18, ys);
    top = actuate(ys, () => { const Ll = clamp(2.2 * DN + 120, 120, 1000); out.push(...rect(c - 15, ys, c + Ll, ys + 14), circ({ x: c, y: ys + 7 }, 9)); return ys + 14; });
  } else if (type === 'bfly') {
    const H2 = fl ? (fl.BC - fl.hole) / 2 : od * 0.9;
    out.push(...rect(0, -H2, Lv, H2), L(c, -od / 2, c, od / 2, HID), ell(c, 0, Lv * 0.2, od / 2, HID));
    const neck = H2 + 25 + DN * 0.4; out.push(...rect(c - 18, H2, c + 18, neck)); stem(neck, neck + 30);
    top = actuate(neck + 30, () => (DN > 200 ? gear(neck + 30, O) : (out.push(...rect(c - 15, neck + 30, c + clamp(1.8 * DN + 150, 150, 600), neck + 44)), neck + 44)));
  } else if (type === 'ystr') {
    const r = (x2 - x1) / 2;
    out.push(L(x1, od * 0.55, x2, od * 0.55), L(x1, -od * 0.55, x1 + r * 0.4, -od * 0.55), L(x2, -od * 0.55, x2 - r * 0.2, -od * 0.55));
    const a = -Math.PI / 4, lg = Math.max(od * 1.4, r * 1.4), w = od * 0.55;
    const p0 = { x: c - r * 0.2, y: -od * 0.3 }, d1 = { x: Math.cos(a), y: Math.sin(a) }, n1 = { x: -d1.y, y: d1.x };
    const q = (s, t) => [p0.x + d1.x * s + n1.x * t, p0.y + d1.y * s + n1.y * t];
    out.push(poly([q(0, w), q(lg, w), q(lg, -w), q(0, -w)], false), poly([q(lg, w * 1.1), q(lg + 18, w * 1.1), q(lg + 18, -w * 1.1), q(lg, -w * 1.1)]));
    out.push(poly([q(od * 0.2, w * 0.7), q(lg - 5, w * 0.7), q(lg - 5, -w * 0.7), q(od * 0.2, -w * 0.7)], true, HID));
    top = od * 0.55;
  } else if (type === 'bstr') {
    const w = (x2 - x1) * 0.8, h = Math.max(od * 2.2, DN * 2.5);
    out.push(L(x1, od * 0.6, x2, od * 0.6), ...rect(c - w / 2, -h, c + w / 2, od * 0.6), ...rect(c - w / 2 - 10, od * 0.6, c + w / 2 + 10, od * 0.6 + 22), ...rect(c - w * 0.38, -h + 15, c + w * 0.38, od * 0.3, HID));
    out.push(L(x1, -od * 0.6, c - w / 2, -od * 0.6), L(x2, -od * 0.6, c + w / 2, -od * 0.6));
    top = od * 0.6 + 22;
  } else if (type === 'sight') {
    const r = Math.min((x2 - x1) / 2, hb);
    out.push(...rect(x1, -hb * 0.9, x2, hb * 0.9), circ({ x: c, y: 0 }, r * 0.55), circ({ x: c, y: 0 }, r * 0.42));
    top = hb;
  }
  out.push(L(-6, 0, Lv + 6, 0, AX));
  return { ents: out, top };
}
// símbolos P&ID (ISA 5.1 simplificado), centrados en el origen; w = anchura del símbolo
export function valveSym(type, w, act) {
  const h = w / 2, out = [], bow = () => out.push(poly([[-w / 2, -h / 2], [-w / 2, h / 2], [w / 2, -h / 2], [w / 2, h / 2]], true));
  if (type === 'gate') bow();
  else if (type === 'globe') { bow(); out.push(fill(Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6) * h * 0.22, Math.sin(i * Math.PI / 6) * h * 0.22]))); }
  else if (type === 'check' || type === 'lift') { bow(); out.push(fill([[0, 0], [w / 2, -h / 2], [w / 2, h / 2]])); }
  else if (type === 'ball') { bow(); out.push(circ({ x: 0, y: 0 }, h * 0.3)); }
  else if (type === 'plug') { bow(); out.push(...rect(-h * 0.2, -h * 0.3, h * 0.2, h * 0.3)); }
  else if (type === 'bfly') { out.push(L(-w / 2, -h / 2, -w / 2, h / 2), L(w / 2, -h / 2, w / 2, h / 2), L(-w / 2, 0, w / 2, 0), circ({ x: 0, y: 0 }, h * 0.18), L(-h * 0.35, -h * 0.45, h * 0.35, h * 0.45)); }
  else if (type === 'ystr') { out.push(L(-w / 2, 0, w / 2, 0), L(-w * 0.1, 0, w * 0.15, -h * 0.9), L(w * 0.05, 0, w * 0.3, -h * 0.9), L(w * 0.15, -h * 0.9, w * 0.3, -h * 0.9), L(0, -h * 0.25, w * 0.2, -h * 0.25)); }
  else if (type === 'bstr') { out.push(L(-w / 2, 0, w / 2, 0), ...rect(-w * 0.2, -h, w * 0.2, 0), L(-w * 0.2, -h, w * 0.2, 0)); }
  else if (type === 'sight') { out.push(L(-w / 2, 0, w / 2, 0), circ({ x: 0, y: 0 }, h * 0.45), L(-h * 0.3, -h * 0.3, h * 0.3, h * 0.3)); }
  if (['gate', 'globe', 'ball', 'plug', 'bfly'].includes(type)) {
    if (act === 'pneu') out.push(L(0, 0, 0, h * 1.1), arc({ x: 0, y: h * 1.1 }, h * 0.45, 0, Math.PI), L(-h * 0.45, h * 1.1, h * 0.45, h * 1.1));
    else if (act === 'elec') out.push(L(0, 0, 0, h * 1.1), circ({ x: 0, y: h * 1.45 }, h * 0.35), { type: 'TEXT', p: { x: 0, y: h * 1.45 }, p2: { x: 0, y: h * 1.45 }, h: h * 0.4, text: 'M', ha: 1, va: 2, rot: 0, layer: '0' });
    else if (act === 'gear') out.push(L(0, 0, 0, h * 1.1), ...rect(-h * 0.3, h * 1.1, h * 0.3, h * 1.5));
    else out.push(L(0, 0, 0, h * 0.9), L(-h * 0.4, h * 0.9, h * 0.4, h * 0.9));
  }
  return { ents: out };
}

// ======================================================================= JUNTAS Y TORNILLERÍA
// longitud de espárrago calculada (B16.5 anexo: espesores + junta + dos tuercas + saliente), redondeada a 5 mm
export function studLength(fl, face, gasketT) {
  const d = typeof fl.bolt === 'string' && /^M/.test(fl.bolt) ? +fl.bolt.slice(1) : P.fr(fl.bolt) * IN;
  const ft = fl.incl || face === 'FF' ? fl.C : fl.C + fl.rfH; // espesor por brida incluido el resalte
  const raw = 2 * ft + gasketT + 2 * d + 2 * Math.max(3.2, d * 0.18);
  return { L: Math.ceil(raw / 5) * 5, d };
}
export const GASKETS = [['SW', 'Espirometálica (B16.20)'], ['FLAT', 'Plana sin amianto (B16.21)'], ['RTJ', 'Anillo RTJ octogonal (B16.20)']];
export function gasketDims(fl, kind, od, id) {
  const ringOD = fl.BC - fl.hole; // anillo centrador / junta plana hasta los tornillos
  if (kind === 'RTJ') return { t: 0, P: fl.P, A: fl.F ? fl.F * 0.8 : 11, H: fl.Eg ? fl.Eg * 2 + 3 : 17, desc: `R-${fl.ring}` };
  if (kind === 'FLAT') return { t: 3.2, OD: fl.face === 'FF' ? fl.O : ringOD, ID: id, desc: `${T('plana')} e=3,2` };
  const j = P.N19.indexOf(fl.nps), w = j >= 0 ? [P2.GK.WOD[j] * IN, P2.GK.WID[j] * IN] : [fl.R * 0.9, od * 1.05];
  return { t: 4.5, OD: ringOD, wOD: w[0], wID: w[1], ID: Math.min(id, w[1] - 6), desc: `${T('espirometálica')} e=4,5` };
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const K = () => app.mecKit;
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const pickMec = async (c, prompt, kinds) => {
    const r = await c.entsel(prompt); if (!r) return null; const e = r.ent || r.e || r;
    if (!e?.mec || (kinds && !kinds.includes(e.mec.kind))) { c.print('The selected object is not a piping component.'); return null; }
    return e;
  };
  const insertAt = (name, p, rot, sy, layer, info, ports) => {
    const d = doc(), k = K().scale(), e = app.blocks.insertBlock(name, p, k, sy * k, rot, {}, d.space); e.layer = layer; K().tagMec(e, info); if (ports) { e.mec.lports = ports; e.mec.od = info.od || null; } return e;
  };
  const sizeFields = (s, list) => K().pipeFields(s, list);

  // ---------- VÁLVULAS
  const ENDS = [['RF', 'Bridas RF'], ['RTJ', 'Bridas RTJ'], ['FF', 'Bridas FF'], ['BW', 'Soldar a tope (BW)'], ['SW', 'Socket weld (SW)'], ['THD', 'Roscados NPT']];
  const ACTS = [['hand', 'Manual (volante / palanca)'], ['gear', 'Reductor'], ['pneu', 'Actuador neumático'], ['elec', 'Actuador eléctrico']];
  const valveBuild = (v) => {
    const pipe = pipeOf(v), nps = pipe.nps;
    if (v.view === 'pid') {
      const w = +v.symw || 10;
      const g = valveSym(v.vtype, w, v.act);
      const name = `MEC_PID_${v.vtype}_${v.act}_${w}`.replace(/[^\w.-]/g, '_');
      return { ents: g.ents, name, desc: `${T(VTYPES.find((x) => x[0] === v.vtype)[1])} ${pipe.size} (P&ID)`, info: T('Símbolo P&ID (ISA 5.1)'), L: w, pid: true, od: pipe.od, ports: [{ x: -w / 2, y: 0, a: Math.PI }, { x: w / 2, y: 0, a: 0 }], conn: { x: -w / 2 } };
    }
    const len = valveLen(v.vtype, v.cls, nps, v.ends, v.pattern);
    if (!len) throw new Error(T('No hay dimensión cara a cara para este tipo, clase y diámetro.'));
    const fl = ['RF', 'RTJ', 'FF'].includes(v.ends) ? flangeOf(v.cls, nps) : null;
    if (['RF', 'RTJ', 'FF'].includes(v.ends) && !fl) throw new Error(T('No existe brida de clase {0} para {1} en ASME B16.5.', v.cls, pipe.size));
    if (fl) fl.nps = nps;
    const g = valveEnts({ type: v.vtype, L: len.L, fl, od: pipe.od, ends: v.ends, act: v.act, dn: pipe.dn || P.DN[nps] });
    const tname = T(VTYPES.find((x) => x[0] === v.vtype)[1]);
    const actTxt = v.act !== 'hand' && ['gate', 'globe', 'ball', 'plug', 'bfly'].includes(v.vtype) ? ', ' + T(ACTS.find((a) => a[0] === v.act)[1]).toLowerCase() : '';
    const desc = `${T('Válvula')} ${tname.toLowerCase()} ${pipe.size} Cl.${v.cls} ${v.ends}${actTxt}`.replace(`${T('Válvula')} ${T('filtro')}`, T('Filtro'));
    const name = `MEC_VAL_${v.vtype}_${v.cls}_${v.ends}_${v.act}_${v.pattern || ''}_NPS${nps}`.replace(/[^\w.-]/g, '_');
    return { ents: g.ents, name, desc: /^Filtro|^Mirilla/.test(tname) ? `${tname} ${pipe.size} Cl.${v.cls} ${v.ends}` : desc, info: `L ${len.L} mm · ${len.src}\n${T('Altura total aprox.')} ${r1(g.top)} mm`, L: len.L, od: pipe.od, fl, ports: [{ x: 0, y: 0, a: Math.PI, face: !!fl }, { x: len.L, y: 0, a: 0, face: !!fl }] };
  };
  app.mecValve = valveBuild;
  R('MVALVE', async (c, args) => {
    const s = K().spec();
    const v = await K().chooser('Válvula', [
      { k: 'vtype', l: 'Tipo', v: args?.vtype || s.vtype || 'gate', opts: () => VTYPES },
      { k: 'view', l: 'Representación', v: s.vview || 'side', opts: () => [['side', 'Alzado a escala'], ['pid', 'Símbolo P&ID']] },
      { k: 'ends', l: 'Extremos', v: s.ends || 'RF', when: (x) => x.view !== 'pid', opts: (x) => (x.vtype === 'bfly' ? ENDS.slice(0, 1) : ENDS) },
      { k: 'cls', l: 'Clase', v: s.cls, when: (x) => x.view !== 'pid', opts: (x) => (['SW', 'THD'].includes(x.ends) ? ['800', '1500'].map((k) => [k, 'Class ' + k]) : CLASSES.map((k) => [k, 'Class ' + k])) },
      { k: 'pattern', l: 'Patrón', v: s.pattern || 'L', when: (x) => x.view !== 'pid' && (x.vtype === 'ball' || x.vtype === 'plug'), opts: (x) => (x.vtype === 'ball' ? [['L', 'Largo (paso total)'], ['S', 'Corto']] : [['S', 'Corto'], ['R', 'Regular']]) },
      { k: 'act', l: 'Accionamiento', v: s.act || 'hand', when: (x) => ['gate', 'globe', 'ball', 'plug', 'bfly'].includes(x.vtype), opts: () => ACTS },
      { k: 'symw', l: 'Anchura del símbolo (mm)', v: s.symw || 10, when: (x) => x.view === 'pid', opts: () => [[6, '6'], [8, '8'], [10, '10'], [12, '12'], [16, '16'], [20, '20']] },
      ...sizeFields(s, null),
    ], valveBuild);
    if (!v) return; K().save({ ...v, vview: v.view, view: s.view });
    const b = valveBuild(v), d = doc(); d.begin('MVALVE'); K().defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + ' · ' + b.info.replace(/\n/g, ' · '));
    await K().place(c, b.name, K().mecInfo(b.pid ? 'VALVESYM' : /^Filtro|^Strainer|^Filtre/.test(b.desc) ? 'STRAINER' : 'VALVE', b.desc, { od: b.od }), { layer: b.pid ? 'MEC_PID' : 'MEC_VALVULAS', cmd: 'MVALVE', prompt: b.pid ? 'Specify center point:' : 'Specify inlet face point:', ports: b.ports, attach: b.pid ? 'none' : 'inlet', toFace: !!b.fl, conn: b.conn });
  }, { alias: ['VALVULA', 'MVALVULA'] });
  for (const [cmd, t] of [['MVALVEGATE', 'gate'], ['MVALVEGLOBE', 'globe'], ['MVALVECHECK', 'check'], ['MVALVEBALL', 'ball'], ['MVALVEPLUG', 'plug'], ['MVALVEBFLY', 'bfly'], ['MSTRAINER', 'ystr'], ['MSTRAINERB', 'bstr'], ['MSIGHTGLASS', 'sight']]) R(cmd, (c) => eng.commands.MVALVE.fn(c, { vtype: t }));

  // ---------- JUNTAS, ESPÁRRAGOS Y UNIÓN BRIDADA
  R('MGASKET', async (c) => {
    const e = await pickMec(c, 'Select flange to joint:', ['FLANGE']); if (!e) return;
    const fl = e.mec.fl; if (!fl) { c.print('This flange has no dimension data (insert it again with MFLANGE).'); return; }
    const s = K().spec();
    const v = await K().chooser('Unión bridada', [
      { k: 'gk', l: 'Junta', v: fl.face === 'RTJ' ? 'RTJ' : s.gk || 'SW', opts: () => (fl.face === 'RTJ' ? GASKETS.slice(2) : GASKETS.slice(0, 2)) },
      { k: 'mate', l: 'Brida opuesta', v: s.mate || '1', opts: () => [['1', 'Insertar brida igual enfrentada'], ['0', 'No']] },
      { k: 'studs', l: 'Dibujar espárragos', v: s.studs || '1', opts: () => [['1', 'Sí'], ['0', 'No']] },
    ], (x) => { const gd = gasketDims(fl, x.gk, fl.od, fl.id); const sl = studLength(fl, fl.face, x.gk === 'RTJ' ? 4 : gd.t); return { info: `${tr('Junta')}: ${gd.desc}${gd.OD ? ` Ø${r1(gd.OD)}/${r1(gd.ID)}` : ''}\n${fl.n} × ${tr('espárrago')} ${fl.bolt}${/^M/.test(fl.bolt) ? '' : '"'} × ${sl.L} mm + ${2 * fl.n} ${tr('tuercas')}`, ents: [] }; });
    if (!v) return; K().save(v);
    const d = doc(), k = K().scale(), rot = e.rot || 0, u = { x: Math.cos(rot), y: Math.sin(rot) }, n = { x: -u.y, y: u.x };
    const gd = gasketDims(fl, v.gk, fl.od, fl.id), gt = v.gk === 'RTJ' ? 4 : gd.t;
    const W = (x, y) => G.add(e.p, G.add(G.mul(u, x * k), G.mul(n, y * k * Math.sign(e.sy || 1))));
    const add = (ent) => d.add({ ...ent, layer: ent.layer || 'MEC_JUNTAS' });
    d.begin('MGASKET'); K().ensureLayers(d); d.ensureLayer('MEC_JUNTAS', { color: 6 }); d.ensureLayer('MEC_TORNILLERIA', { color: 5 });
    // junta en el lado de la cara (x < 0 en coordenadas de la brida)
    const gk = [];
    if (v.gk === 'RTJ') { for (const sg of [1, -1]) { const y = sg * gd.P / 2; gk.push(poly([[-gt / 2 - 2, y - gd.A / 2], [-gt / 2 + 2, y - gd.A / 2], [-gt / 2 + gd.H / 4, y], [-gt / 2 + 2, y + gd.A / 2], [-gt / 2 - 2, y + gd.A / 2], [-gt / 2 - gd.H / 4, y]])); } }
    else for (const sg of [1, -1]) { gk.push(rect(-gt, sg * gd.ID / 2, 0, sg * gd.OD / 2)); }
    for (const it of gk.flat()) { const t = (q) => W(q.x, q.y); const x = JSON.parse(JSON.stringify(it)); if (x.type === 'LINE') { x.p1 = t(x.p1); x.p2 = t(x.p2); } else if (x.type === 'LWPOLYLINE') x.pts = x.pts.map((q) => ({ ...t(q), b: 0 })); add(x); }
    const gEnt = add({ type: 'POINT', p: W(-gt / 2, 0) });
    K().tagMec(gEnt, { kind: 'GASKET', desc: `${tr('Junta')} ${gd.desc} ${fl.std === 'EN1092' ? 'DN' + (P.DN[fl.nps] || '') : 'NPS ' + fl.nps + '"'} ${fl.std === 'EN1092' ? fl.cls : 'Cl.' + fl.cls}${v.gk === 'RTJ' ? '' : fl.std === 'EN1092' ? ' EN 1514' : v.gk === 'SW' ? ' ASME B16.20' : ' ASME B16.21'}` });
    let mate = null;
    if (v.mate === '1') { mate = app.blocks.insertBlock(e.name, W(-gt, 0), e.sx, -(e.sy || 1), rot + Math.PI, {}, d.space); mate.layer = e.layer; K().tagMec(mate, { ...e.mec }); }
    const sl = studLength(fl, fl.face, gt);
    if (v.studs === '1') {
      const tf = fl.incl || fl.face === 'FF' ? fl.C : fl.C + fl.rfH, x0 = -gt - tf - sl.d - 4, x1 = tf + sl.d + 4, x0n = x0 + (sl.L - (x1 - x0)) / 2 * -1;
      void x0n;
      const xa = -gt / 2 - sl.L / 2, xb = -gt / 2 + sl.L / 2;
      for (const sg of [1, -1]) {
        const y = sg * fl.BC / 2, r = sl.d / 2;
        for (const q of rect(xa, y - r, xb, y + r)) { q.p1 = W(q.p1.x, q.p1.y); q.p2 = W(q.p2.x, q.p2.y); add({ ...q, layer: 'MEC_TORNILLERIA' }); }
        for (const xn of [-gt - tf - sl.d, tf]) for (const q of rect(xn, y - sl.d * 0.85, xn + sl.d, y + sl.d * 0.85)) { q.p1 = W(q.p1.x, q.p1.y); q.p2 = W(q.p2.x, q.p2.y); add({ ...q, layer: 'MEC_TORNILLERIA' }); }
      }
    }
    const bEnt = add({ type: 'POINT', p: W(-gt / 2, fl.BC / 2), layer: 'MEC_TORNILLERIA' });
    const boltTxt = /^M/.test(fl.bolt) ? fl.bolt : fl.bolt + '"';
    K().tagMec(bEnt, { kind: 'BOLT', desc: `${tr('Espárrago')} ${boltTxt} × ${sl.L} mm ${tr('con 2 tuercas')}`, qty: fl.n });
    d.end(); redraw();
    c.print(`Flanged joint: ${gd.desc}, ${fl.n} stud bolts ${boltTxt} x ${sl.L} mm.`);
  }, { alias: ['JUNTA', 'MJUNTA', 'UNIONBRIDADA'] });

  // ---------- ACCESORIOS FORJADOS B16.11
  const FTYPES = [['E90', 'Codo 90°'], ['E45', 'Codo 45°'], ['TEE', 'Te'], ['CROSS', 'Cruz'], ['CAP', 'Casquete'], ['PLUG', 'Tapón hexagonal'], ['UNION', 'Unión (MSS SP-83)'], ['NIPPLE', 'Niple'], ['SWAGE', 'Reducción de enchufe (MSS SP-95)']];
  const forgedBuild = (v) => {
    const nps = v.fnps, i = P2.FNPS.indexOf(nps); if (i < 0) throw new Error(T('Diámetro no disponible.'));
    const pr = P.PIPE.find((x) => x[0] === nps), od = pr[1] * IN, sw = v.fend === 'SW';
    const cls = v.fcls;
    let E, Dout, sockB = 0, J = 0;
    if (sw) {
      if (cls === '2000') throw new Error(T('Socket weld: clases 3000 y 6000.'));
      const A = (v.ftype === 'E45' ? P2.SW_A45 : P2.SW_A90)[cls][i]; if (A == null) throw new Error(T('ASME B16.11 no incluye este diámetro en clase {0}.', cls));
      sockB = P2.SW_B[i]; J = P2.SW_J[i]; E = A + J; Dout = sockB + 2 * P2.SW_C[cls][i] * 1.25;
    } else { const r = P2.THD[cls][i]; E = v.ftype === 'E45' ? r[1] : r[0]; Dout = r[2]; }
    const out = [], a = Dout / 2, b = od / 2;
    const leg = (ang, len) => { const u = { x: Math.cos(ang), y: Math.sin(ang) }, n = { x: -u.y, y: u.x }; const P0 = (s, t) => ({ x: u.x * s + n.x * t, y: u.y * s + n.y * t }); out.push(L(P0(0, a).x, P0(0, a).y, P0(len, a).x, P0(len, a).y), L(P0(0, -a).x, P0(0, -a).y, P0(len, -a).x, P0(len, -a).y), L(P0(len, -a).x, P0(len, -a).y, P0(len, a).x, P0(len, a).y)); if (sw) { const s1 = P0(len - J, sockB / 2), s2 = P0(len, sockB / 2), s3 = P0(len - J, -sockB / 2), s4 = P0(len, -sockB / 2); out.push(L(s1.x, s1.y, s2.x, s2.y, HID), L(s3.x, s3.y, s4.x, s4.y, HID), L(s1.x, s1.y, s3.x, s3.y, HID)); } else { const s1 = P0(len * 0.45, b), s2 = P0(len, b), s3 = P0(len * 0.45, -b), s4 = P0(len, -b); out.push(L(s1.x, s1.y, s2.x, s2.y, HID), L(s3.x, s3.y, s4.x, s4.y, HID)); } const ax = P0(len + 6, 0); out.push(L(0, 0, ax.x, ax.y, AX)); };
    const ports = []; let conn = 0, desc;
    const ft = T(FTYPES.find((x) => x[0] === v.ftype)[1]).replace(/\s*\(.*\)$/, '');
    const endTxt = sw ? 'SW' : 'NPT';
    if (v.ftype === 'E90' || v.ftype === 'E45') {
      const ang = v.ftype === 'E90' ? Math.PI / 2 : Math.PI / 4;
      // centro del accesorio en (E, 0): entrada hacia -X y salida girada
      const c0 = { x: E, y: 0 };
      const body = []; for (const [an, ln] of [[Math.PI, E], [Math.PI - (Math.PI - ang) + Math.PI, E]]) body.push([an, ln]);
      const before = out.length; leg(Math.PI, E); leg(ang, E);
      for (let k = before; k < out.length; k++) { const e = out[k]; e.p1 = G.add(e.p1, c0); e.p2 = G.add(e.p2, c0); }
      out.push(arc(c0, a, -Math.PI / 2, ang - Math.PI / 2));
      ports.push({ x: 0, y: 0, a: Math.PI }, { x: E + E * Math.cos(ang), y: E * Math.sin(ang), a: ang });
      desc = `${ft} ${endTxt} ${npsTxt(nps)} Class ${cls} ASME B16.11`; void body;
    } else if (v.ftype === 'TEE' || v.ftype === 'CROSS') {
      for (const an of v.ftype === 'TEE' ? [0, Math.PI, Math.PI / 2] : [0, Math.PI, Math.PI / 2, -Math.PI / 2]) leg(an, E);
      ports.push({ x: -E, y: 0, a: Math.PI }, { x: E, y: 0, a: 0 }, { x: 0, y: E, a: Math.PI / 2 }, ...(v.ftype === 'CROSS' ? [{ x: 0, y: -E, a: -Math.PI / 2 }] : [])); conn = -E;
      desc = `${ft} ${endTxt} ${npsTxt(nps)} Class ${cls} ASME B16.11`;
    } else if (v.ftype === 'CAP') {
      const r = P2.THD_CAP[cls === '2000' ? '3000' : cls]?.[i] || P2.THD_CAP['3000'][i], Lc = r[0], D = r[1];
      out.push(...rect(0, -D / 2, Lc, D / 2), sw ? L(0, sockB / 2, J, sockB / 2, HID) : L(0, b, Lc * 0.6, b, HID), sw ? L(0, -sockB / 2, J, -sockB / 2, HID) : L(0, -b, Lc * 0.6, -b, HID), L(sw ? J : Lc * 0.6, -(sw ? sockB : od) / 2, sw ? J : Lc * 0.6, (sw ? sockB : od) / 2, HID), L(-6, 0, Lc + 6, 0, AX));
      ports.push({ x: 0, y: 0, a: Math.PI }); desc = `${ft} ${endTxt} ${npsTxt(nps)} Class ${cls} ASME B16.11`;
    } else if (v.ftype === 'PLUG') {
      const Lt = P.SW.L2[P.SWN.indexOf(nps)] * IN + 6, hh = od * 0.75, hx = od * 0.55;
      out.push(...rect(0, -b, Lt, b), ...rect(-hx, -hh / 2 - od * 0.2, 0, hh / 2 + od * 0.2), L(-hx, -hh / 4, 0, -hh / 4), L(-hx, hh / 4, 0, hh / 4), L(-hx - 6, 0, Lt + 6, 0, AX));
      for (let k = 0; k < 4; k++) out.push(L(Lt * k / 4, -b, Lt * k / 4 + Lt / 8, b, HID));
      ports.push({ x: Lt, y: 0, a: 0 }); conn = Lt; desc = `${ft} ${npsTxt(nps)} Class ${cls} ASME B16.11`;
    } else if (v.ftype === 'UNION') {
      const Lu = 2.1 * E + 10, Dn = Dout * 1.45;
      out.push(...rect(0, -a, Lu * 0.3, a), ...rect(Lu * 0.3, -Dn / 2, Lu * 0.7, Dn / 2), ...rect(Lu * 0.7, -a, Lu, a), L(Lu * 0.5, -Dn / 2, Lu * 0.5, Dn / 2), L(-6, 0, Lu + 6, 0, AX));
      ports.push({ x: 0, y: 0, a: Math.PI }, { x: Lu, y: 0, a: 0 }); desc = `${ft} ${endTxt} ${npsTxt(nps)} Class ${cls} MSS SP-83 (${T('aprox.')})`;
    } else if (v.ftype === 'NIPPLE') {
      const Ln = +v.nlen || 100, t = (pr[2][v.nsch] ?? pr[2]['80']) * IN;
      out.push(...rect(0, -b, Ln, b), L(0, b - t, Ln, b - t, HID), L(0, -b + t, Ln, -b + t, HID), L(-6, 0, Ln + 6, 0, AX));
      if (!sw) for (const x0 of [0, Ln - Ln * 0.25]) out.push(L(x0, b - 1.2, x0 + Ln * 0.25, b - 1.2), L(x0, -b + 1.2, x0 + Ln * 0.25, -b + 1.2));
      ports.push({ x: 0, y: 0, a: Math.PI }, { x: Ln, y: 0, a: 0 }); desc = `${ft} ${npsTxt(nps)} Sch ${v.nsch} L=${Ln} ${sw ? 'PBE' : 'TBE'} ASME B36.10`;
    } else if (v.ftype === 'SWAGE') {
      const n2 = v.fnps2, p2 = P.PIPE.find((x) => x[0] === n2); if (!p2 || P.fr(n2) >= P.fr(nps)) throw new Error(T('El extremo pequeño debe ser menor que el grande.'));
      const Ls = P2.SWAGE_L[nps] || 100, d2 = p2[1] * IN / 2, s1 = Ls * 0.3, s2 = Ls * 0.75;
      out.push(L(0, -b, 0, b), L(0, b, s1, b), L(0, -b, s1, -b), L(s1, b, s2, d2), L(s1, -b, s2, -d2), L(s2, d2, Ls, d2), L(s2, -d2, Ls, -d2), L(Ls, -d2, Ls, d2), L(-6, 0, Ls + 6, 0, AX));
      ports.push({ x: 0, y: 0, a: Math.PI }, { x: Ls, y: 0, a: 0 }); desc = `${ft} ${npsTxt(nps)} × ${npsTxt(n2)} ${sw ? 'PBE' : 'TBE'} MSS SP-95`;
    }
    const name = `MEC_FORJ_${v.ftype}_${v.fend}_${cls}_NPS${nps}${v.ftype === 'SWAGE' ? 'x' + v.fnps2 : ''}${v.ftype === 'NIPPLE' ? '_' + v.nsch + '_' + v.nlen : ''}`.replace(/[^\w.-]/g, '_');
    return { ents: out, name, desc, info: v.ftype === 'E90' || v.ftype === 'E45' || v.ftype === 'TEE' || v.ftype === 'CROSS' ? `${T('centro a cara')} ${r1(E)} · Ø ${r1(Dout)}${sw ? ` · B ${sockB} · J ${J} (${T('mín.')})` : ''}` : '', od, ports, conn };
  };
  R('MFORGED', async (c, args) => {
    const s = K().spec();
    const v = await K().chooser('Accesorio forjado ASME B16.11', [
      { k: 'ftype', l: 'Tipo', v: args?.ftype || s.ftype || 'E90', opts: () => FTYPES },
      { k: 'fend', l: 'Extremos', v: s.fend || 'SW', opts: () => [['SW', 'Socket weld (SW)'], ['THD', 'Roscados NPT']] },
      { k: 'fcls', l: 'Clase', v: s.fcls || '3000', opts: (x) => (x.fend === 'SW' ? ['3000', '6000'] : ['2000', '3000', '6000']).map((k) => [k, 'Class ' + k]) },
      { k: 'fnps', l: 'Diámetro (NPS)', v: s.fnps || '1', opts: () => P2.FNPS.map((n) => [n, npsTxt(n)]) },
      { k: 'fnps2', l: 'Extremo pequeño (NPS)', v: s.fnps2 || '1/2', when: (x) => x.ftype === 'SWAGE', opts: (x) => P.PIPE.filter((r) => P.fr(r[0]) < P.fr(x.fnps) && P.fr(r[0]) >= 0.25).map((r) => [r[0], npsTxt(r[0])]) },
      { k: 'nsch', l: 'Serie (schedule)', v: s.nsch || '80', when: (x) => x.ftype === 'NIPPLE', opts: (x) => ['40', '80', '160', 'XXS'].filter((k) => P.PIPE.find((r) => r[0] === x.fnps)?.[2][k] != null).map((k) => [k, k]) },
      { k: 'nlen', l: 'Longitud (mm)', v: s.nlen || 100, when: (x) => x.ftype === 'NIPPLE', opts: () => [50, 75, 100, 150, 200].map((n) => [n, n + ' mm']) },
    ], forgedBuild);
    if (!v) return; K().save(v);
    const b = forgedBuild(v), d = doc(); d.begin('MFORGED'); K().defBlock(b.name, b.ents, b.desc); d.end();
    c.print(b.desc + (b.info ? ' · ' + b.info : ''));
    await K().place(c, b.name, K().mecInfo('FORGED', b.desc, { od: b.od }), { layer: 'MEC_ACCESORIOS', cmd: 'MFORGED', prompt: 'Specify connection point:', ports: b.ports, attach: 'inlet', conn: { x: b.conn } });
  }, { alias: ['FORJADO', 'MFORJADO'] });

  // ---------- DERIVACIONES MSS SP-97 (olets)
  const OTYPES = [['WOL', 'Weldolet'], ['SOL', 'Sockolet'], ['TOL', 'Threadolet'], ['LOL', 'Latrolet (45°)'], ['EOL', 'Elbolet'], ['NOL', 'Nipolet']];
  const oletBuild = (v) => {
    const run = pipeOf(v), br = v.onps;
    const tab = v.otype === 'SOL' ? P2.SOCKOLET : v.otype === 'TOL' ? P2.THREDOLET : P2.WELDOLET;
    const r = tab[br] || P2.WELDOLET[br]; if (!r) throw new Error(T('Diámetro no disponible.'));
    if (P.fr(br) > P.fr(run.nps)) throw new Error(T('La derivación no puede ser mayor que el colector.'));
    let [A, B, C, Db] = r; const y0 = run.od / 2, out = [];
    if (v.otype === 'NOL') { A = { '1/2': 89, '3/4': 89, '1': 114, '1-1/4': 114, '1-1/2': 114, '2': 140 }[br] || 140; C = P.PIPE.find((x) => x[0] === br)[1] * IN; B = C * 1.6; }
    const lat = v.otype === 'LOL';
    if (lat) {
      const a = Math.PI / 4, u = { x: Math.cos(a), y: Math.sin(a) }, n = { x: -u.y, y: u.x }, h = A * 1.6;
      const q = (s, t) => [u.x * s + n.x * t, y0 + u.y * s + n.y * t];
      out.push(poly([[-B * 0.75, y0], q(h, C / 2), q(h, -C / 2), [B * 0.75, y0]], false), L(...q(h, -C / 2), ...q(h, C / 2)), L(...q(-4, 0), ...q(h + 6, 0), AX));
      return { ents: out, ports: [{ x: q(h, 0)[0], y: q(h, 0)[1], a }], A: h };
    }
    // base sobre el colector (silla aproximada con arco) y cuerpo troncocónico
    const sag = Math.max(0, y0 - Math.sqrt(Math.max(0, y0 * y0 - (B / 2) ** 2)));
    out.push(arc({ x: 0, y: 0 }, y0, Math.PI / 2 - Math.asin(Math.min(1, B / 2 / y0)), Math.PI / 2 + Math.asin(Math.min(1, B / 2 / y0))));
    const yb = y0 - sag;
    out.push(L(-B / 2, yb, -C / 2, y0 + A), L(B / 2, yb, C / 2, y0 + A), L(-C / 2, y0 + A, C / 2, y0 + A));
    if (v.otype === 'SOL') { const Bs = P2.SW_B[P2.FNPS.indexOf(br)] || C * 0.7, J = P2.SW_J[P2.FNPS.indexOf(br)] || 13; out.push(...rect(-Bs / 2, y0 + A - J, Bs / 2, y0 + A, HID)); }
    if (v.otype === 'TOL') out.push(L(-Db / 2, y0 + A * 0.4, -Db / 2, y0 + A, HID), L(Db / 2, y0 + A * 0.4, Db / 2, y0 + A, HID));
    out.push(L(-Db / 2, y0 - 2, -Db / 2, y0 + A, HID), L(Db / 2, y0 - 2, Db / 2, y0 + A, HID), L(0, 0, 0, y0 + A + 8, AX));
    return { ents: out, ports: [{ x: 0, y: y0 + A, a: Math.PI / 2 }], A };
  };
  R('MOLET', async (c) => {
    const s = K().spec();
    const v = await K().chooser('Derivación MSS SP-97', [
      { k: 'otype', l: 'Tipo', v: s.otype || 'WOL', opts: () => OTYPES },
      ...sizeFields(s, null),
      { k: 'onps', l: 'Derivación (NPS)', v: s.onps || '2', opts: (x) => Object.keys(x.otype === 'SOL' ? P2.SOCKOLET : x.otype === 'TOL' ? P2.THREDOLET : P2.WELDOLET).filter((n) => P.fr(n) <= P.fr(pipeOf(x).nps)).map((n) => [n, npsTxt(n)]) },
    ], (x) => { const b = oletBuild(x); return { ents: [...b.ents, arc({ x: 0, y: 0 }, pipeOf(x).od / 2, 0, Math.PI, HID)], info: `A ${r1(b.A)} mm${['LOL', 'EOL', 'NOL'].includes(x.otype) ? ' (' + T('aprox.') + ')' : ''}` }; });
    if (!v) return; K().save(v);
    const run = pipeOf(v), b = oletBuild(v);
    const name = `MEC_OLET_${v.otype}_${run.std === 'ASME' ? 'NPS' + run.nps : 'EN' + run.od}x${v.onps}`.replace(/[^\w.-]/g, '_');
    const desc = `${OTYPES.find((o) => o[0] === v.otype)[1]} ${run.size} × ${npsTxt(v.onps)} MSS SP-97`;
    const d = doc(); d.begin('MOLET'); K().defBlock(name, b.ents, desc); d.end();
    // se coloca sobre el eje del colector; la dirección indica el lado de la derivación
    const p = need(await c.getPoint('Specify point on the run pipe axis:'));
    const q = await c.getPoint('Specify branch side <up>:', { base: p, def: 'D' });
    const rot = (q && typeof q === 'object' ? Math.atan2(q.y - p.y, q.x - p.x) : Math.PI / 2) - Math.PI / 2;
    d.begin('MOLET'); insertAt(name, p, rot, 1, 'MEC_ACCESORIOS', { kind: 'OLET', desc, od: P.PIPE.find((x) => x[0] === v.onps)[1] * IN }, b.ports); d.end(); redraw();
  }, { alias: ['OLET', 'WELDOLET', 'DERIVACION'] });

  // ---------- EXTREMO PARA BRIDA LOCA (stub end)
  R('MSTUBEND', async (c) => {
    const s = K().spec();
    const build = (x) => {
      const pipe = pipeOf(x), G0 = P.RF[pipe.nps] * IN; if (!G0) throw new Error(T('Diámetro no disponible.'));
      const f = P.fr(pipe.nps), F = x.pat === 'L' ? (f <= 2.5 ? 76.2 : f <= 12 ? 152.4 : 304.8) : (f <= 1.5 ? 50.8 : f <= 3.5 ? 63.5 : f <= 12 ? 101.6 : 152.4);
      const t = Math.max(pipe.t, 3), rr = Math.max(3, t);
      const out = [...rect(0, -G0 / 2, t, G0 / 2), L(t, pipe.od / 2 + rr, t, G0 / 2), L(t + rr, pipe.od / 2, F, pipe.od / 2), arc({ x: t + rr, y: pipe.od / 2 + rr }, rr, Math.PI, 1.5 * Math.PI), L(t, -pipe.od / 2 - rr, t, -G0 / 2), L(t + rr, -pipe.od / 2, F, -pipe.od / 2), arc({ x: t + rr, y: -pipe.od / 2 - rr }, rr, Math.PI / 2, Math.PI), L(F, -pipe.od / 2, F, pipe.od / 2), L(0, pipe.id / 2, F, pipe.id / 2, HID), L(0, -pipe.id / 2, F, -pipe.id / 2, HID), L(-6, 0, F + 6, 0, AX)];
      return { ents: out, F, G0, pipe, info: `F ${r1(F)} · G Ø${r1(G0)}${x.pat === 'S' ? ' (MSS SP-43, ' + T('aprox.') + ')' : ' (ASME B16.9, ' + T('aprox.') + ')'}` };
    };
    const v = await K().chooser('Extremo para brida loca (stub end)', [{ k: 'pat', l: 'Patrón', v: s.pat || 'S', opts: () => [['S', 'Corto (MSS SP-43)'], ['L', 'Largo (ASME B16.9)']] }, ...sizeFields(s, P.BWN)], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_STUB_${v.pat}_${b.pipe.std === 'ASME' ? 'NPS' + b.pipe.nps + '_' + b.pipe.sch : 'EN' + b.pipe.od}`.replace(/[^\w.-]/g, '_');
    const desc = `${T('Extremo para brida loca')} ${b.pipe.size} ${b.pipe.std === 'ASME' ? 'Sch ' + b.pipe.sch : 'e=' + b.pipe.t} ${v.pat === 'S' ? 'MSS SP-43' : 'ASME B16.9'}`;
    const d = doc(); d.begin('MSTUBEND'); K().defBlock(name, b.ents, desc); d.end();
    await K().place(c, name, K().mecInfo('STUBEND', desc, { od: b.pipe.od }), { layer: 'MEC_ACCESORIOS', cmd: 'MSTUBEND', prompt: 'Specify lap face point:', ports: [{ x: b.F, y: 0, a: 0 }], attach: 'weld', len: b.F });
  }, { alias: ['STUBEND', 'PORTABRIDAS'] });

  // ---------- BRIDAS DE ORIFICIO (B16.36) Y FIGURAS EN OCHO (B16.48)
  R('MORIFICE', async (c) => {
    const s = K().spec();
    const build = (x) => {
      if (+x.cls < 300) throw new Error(T('ASME B16.36: bridas de orificio desde Class 300.'));
      const pipe = pipeOf(x), fl = flangeOf(x.cls, pipe.nps); if (!fl || P.fr(pipe.nps) < 1) throw new Error(T('Diámetro no disponible.'));
      const C = Math.max(fl.C, 38.1), tp = 3.2, out = [];
      const one = (sg) => { // sg = 1 brida de aguas abajo (hacia +X)
        const x0 = sg > 0 ? tp / 2 : -tp / 2, d = sg, xe = x0 + d * (C + (fl.Y - fl.C)), xc = x0 + d * C;
        out.push(L(x0, -fl.O / 2, x0, fl.O / 2), L(x0, fl.O / 2, xc, fl.O / 2), L(x0, -fl.O / 2, xc, -fl.O / 2), L(xc, -fl.O / 2, xc, -fl.X / 2), L(xc, fl.O / 2, xc, fl.X / 2), L(xc, fl.X / 2, xe, pipe.od / 2), L(xc, -fl.X / 2, xe, -pipe.od / 2), L(xe, -pipe.od / 2, xe, pipe.od / 2));
        const xt = x0 + d * C / 2; out.push(L(xt - 6, fl.O / 2, xt - 6, pipe.id / 2, HID), L(xt + 6, fl.O / 2, xt + 6, pipe.id / 2, HID), L(xt, fl.O / 2 + 30, xt, 0, AX));
        out.push(L(x0, pipe.id / 2, xe, pipe.id / 2, HID), L(x0, -pipe.id / 2, xe, -pipe.id / 2, HID));
        return xe;
      };
      const xa = one(-1), xb = one(1);
      out.push(...rect(-tp / 2, -(fl.BC - fl.hole) / 2, tp / 2, (fl.BC - fl.hole) / 2), ...rect(-tp / 2, fl.O / 2, tp / 2, fl.O / 2 + 60), L(xa - 6, 0, xb + 6, 0, AX));
      return { ents: out, xa, xb, pipe, fl, info: `${T('Espesor')} ${r1(C)} (≥ 38,1) · ${T('tomas')} ½" NPT · ${T('placa')} 3,2 mm` };
    };
    const v = await K().chooser('Bridas de orificio ASME B16.36', [{ k: 'cls', l: 'Clase', v: +s.cls >= 300 ? s.cls : '300', opts: () => CLASSES.filter((k) => +k >= 300).map((k) => [k, 'Class ' + k]) }, ...sizeFields(s, null)], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_ORIF_${v.cls}_${b.pipe.std === 'ASME' ? 'NPS' + b.pipe.nps + '_' + b.pipe.sch : 'EN' + b.pipe.od}`.replace(/[^\w.-]/g, '_');
    const desc = `${T('Conjunto de bridas de orificio')} WN RF Cl.${v.cls} ${b.pipe.size} ASME B16.36`;
    const d = doc(); d.begin('MORIFICE'); K().defBlock(name, b.ents, desc); d.end();
    await K().place(c, name, K().mecInfo('ORIFICE', desc, { od: b.pipe.od }), { layer: 'MEC_BRIDAS', cmd: 'MORIFICE', prompt: 'Specify orifice plate center:', ports: [{ x: b.xa, y: 0, a: Math.PI }, { x: b.xb, y: 0, a: 0 }], attach: 'inlet', conn: { x: b.xa } });
  }, { alias: ['BRIDAORIFICIO', 'ORIFICIO'] });
  R('MBLIND', async (c) => {
    const s = K().spec();
    const build = (x) => {
      const pipe = pipeOf(x), r = P2.SPECTACLE[x.cls === '400' ? '600' : x.cls]?.[pipe.nps]; if (!r) throw new Error(T('ASME B16.48 no incluye este diámetro en clase {0}.', x.cls));
      const [A, Bi, Cc, t, W] = r, out = [];
      if (x.bview === 'front') {
        const blank = x.btype !== 'SPACER', ring = x.btype !== 'PADDLE';
        if (x.btype === 'SPEC') { out.push(circ({ x: 0, y: 0 }, A / 2), circ({ x: Cc, y: 0 }, A / 2), circ({ x: Cc, y: 0 }, Bi / 2), ...rect(A / 2 - 5, -W / 2, Cc - A / 2 + 5, W / 2)); }
        else { out.push(circ({ x: 0, y: 0 }, A / 2)); if (!blank) out.push(circ({ x: 0, y: 0 }, Bi / 2)); out.push(...rect(-W / 2, A / 2 - 5, W / 2, A / 2 + A * 0.6), circ({ x: 0, y: A / 2 + A * 0.5 }, 9)); void ring; }
        out.push(L(-A / 2 - 6, 0, (x.btype === 'SPEC' ? Cc : 0) + A / 2 + 6, 0, AX));
      } else {
        out.push(...rect(0, -A / 2, t, A / 2), ...(x.btype === 'SPEC' ? rect(0, A / 2, t, Cc + A / 2) : rect(0, A / 2, t, A / 2 + A * 0.6)));
        if (x.btype === 'SPACER' || x.btype === 'SPEC') out.push(L(0, x.btype === 'SPEC' ? Cc - Bi / 2 : -Bi / 2, t, x.btype === 'SPEC' ? Cc - Bi / 2 : -Bi / 2, HID), L(0, x.btype === 'SPEC' ? Cc + Bi / 2 : Bi / 2, t, x.btype === 'SPEC' ? Cc + Bi / 2 : Bi / 2, HID));
        out.push(L(-6, 0, t + 6, 0, AX));
      }
      return { ents: out, info: `A Ø${A} · B Ø${Bi} · C ${Cc} · t ${t} · W ${W}`, pipe, t };
    };
    const v = await K().chooser('Figura en ocho y discos ASME B16.48', [
      { k: 'btype', l: 'Tipo', v: s.btype || 'SPEC', opts: () => [['SPEC', 'Figura en ocho (spectacle)'], ['PADDLE', 'Disco ciego (paddle blind)'], ['SPACER', 'Anillo espaciador (paddle spacer)']] },
      { k: 'cls', l: 'Clase', v: s.cls, opts: () => CLASSES.map((k) => [k, 'Class ' + k]) },
      { k: 'bview', l: 'Vista', v: s.bview || 'side', opts: () => [['side', 'Lateral (alzado)'], ['front', 'Frontal']] },
      ...sizeFields(s, Object.keys(P2.SPECTACLE['150'])),
    ], build);
    if (!v) return; K().save(v);
    const b = build(v), name = `MEC_B1648_${v.btype}_${v.cls}_NPS${b.pipe.nps}_${v.bview}`.replace(/[^\w.-]/g, '_');
    const desc = `${{ SPEC: T('Figura en ocho'), PADDLE: T('Disco ciego'), SPACER: T('Anillo espaciador') }[v.btype]} ${b.pipe.size} Cl.${v.cls} t=${b.t} ASME B16.48`;
    const d = doc(); d.begin('MBLIND'); K().defBlock(name, b.ents, desc); d.end();
    await K().place(c, name, K().mecInfo('BLIND', desc), { layer: 'MEC_BRIDAS', cmd: 'MBLIND', prompt: 'Specify insertion point:', attach: 'none' });
  }, { alias: ['FIGURAOCHO', 'DISCOCIEGO'] });
}
