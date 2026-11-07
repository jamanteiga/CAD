// Tornillería para bridas: espárragos, tornillos hexagonales, tuercas y arandelas.
// Rosca americana: UNC hasta 1" y 8UN por encima (ASME B1.1, práctica de ASME B16.5); tuercas hexagonales
// pesadas ASME B18.2.2 (2H); tornillos hexagonales pesados ASME B18.2.1; arandelas templadas ASTM F436.
// Rosca métrica: ISO 261 paso grueso; tuercas ISO 4032; tornillos ISO 4014/4017; arandelas ISO 7089.
// Equivalencias pulgada → métrica según ASME B16.5. Verifique con la edición vigente de cada norma.
const IN = 25.4;
export const frac = (s) => { s = String(s); if (s.includes('-')) { const [w, f] = s.split('-'); const [a, b] = f.split('/'); return +w + a / b; } if (s.includes('/')) { const [a, b] = s.split('/'); return a / b; } return +s; };

// métrica: d → [paso, entrecaras s, altura tuerca m, altura cabeza k, arandela d1, d2, h]
const MET = {
  12: [1.75, 18, 10.8, 7.5, 13, 24, 2.5], 14: [2, 21, 12.8, 8.8, 15, 28, 2.5], 16: [2, 24, 14.8, 10, 17, 30, 3], 20: [2.5, 30, 18, 12.5, 21, 37, 3],
  24: [3, 36, 21.5, 15, 25, 44, 4], 27: [3, 41, 23.8, 17, 28, 50, 4], 30: [3.5, 46, 25.6, 18.7, 31, 56, 4], 33: [3.5, 50, 28.7, 21, 34, 60, 5],
  36: [4, 55, 31, 22.5, 37, 66, 5], 39: [4, 60, 33.4, 25, 42, 72, 6], 42: [4.5, 65, 34, 26, 45, 78, 8], 45: [4.5, 70, 36, 28, 48, 85, 8],
  48: [5, 75, 38, 30, 52, 92, 8], 52: [5, 80, 42, 33, 56, 98, 8], 56: [5.5, 85, 45, 35, 62, 105, 10], 64: [6, 95, 51, 40, 70, 115, 10],
};
// cabeza de tornillo hexagonal pesado ASME B18.2.1 (pulgadas)
const HEAD_IN = { '1/2': 11 / 32, '5/8': 27 / 64, '3/4': 1 / 2, '7/8': 37 / 64, '1': 43 / 64, '1-1/8': 3 / 4, '1-1/4': 27 / 32, '1-3/8': 29 / 32, '1-1/2': 1 };
// arandela ASTM F436 (pulgadas): [Ø interior, Ø exterior]
const F436 = { '1/2': [0.531, 1.063], '5/8': [0.688, 1.313], '3/4': [0.813, 1.469], '7/8': [0.938, 1.750], '1': [1.125, 2.000], '1-1/8': [1.250, 2.250], '1-1/4': [1.375, 2.500], '1-3/8': [1.500, 2.750], '1-1/2': [1.625, 3.000] };
const TPI = { '1/2': 13, '5/8': 11, '3/4': 10, '7/8': 9, '1': 8 };
// equivalencia métrica admitida por ASME B16.5 para bridas en pulgadas
export const IN2M = { '1/2': 14, '5/8': 16, '3/4': 20, '7/8': 24, '1': 27, '1-1/8': 30, '1-1/4': 33, '1-3/8': 36, '1-1/2': 39, '1-5/8': 42, '1-3/4': 45, '1-7/8': 48, '2': 52, '2-1/4': 56, '2-1/2': 64, '2-3/4': 70, '3': 76, '3-1/4': 82, '3-1/2': 90, '3-3/4': 95, '4': 100 };

// medidas de la tornillería en mm. size: '3/4' (pulgadas) o 'M20'
export function fastener(size) {
  const s = String(size);
  if (/^M/i.test(s)) {
    const d = +s.slice(1), r = MET[d];
    const [p, sw, m, k, d1, d2, h] = r || [Math.round(d * 0.09 * 2) / 2, Math.round(d * 1.5), d * 0.8, d * 0.62, d + 2, d * 2, Math.max(8, d * 0.15)];
    return { sys: 'M', d, name: `M${d}`, thread: `M${d}×${p}`, pitch: p, s: sw, e: sw / Math.cos(Math.PI / 6), m, k, w: { id: d1, od: d2, t: h }, proj: 10, approx: !r };
  }
  const di = frac(s), d = di * IN, tpi = TPI[s] || 8, sw = (1.5 * di + 0.125) * IN, f = F436[s];
  return { sys: 'IN', d, di, name: `${s}"`, thread: `${s}"-${tpi} ${TPI[s] ? 'UNC' : '8UN'}`, pitch: IN / tpi, s: sw, e: sw / Math.cos(Math.PI / 6), m: d, k: (HEAD_IN[s] ?? 0.67 * di) * IN,
    w: f ? { id: f[0] * IN, od: f[1] * IN, t: 0.156 * IN } : { id: (di + 0.125) * IN, od: 2 * di * IN, t: 0.22 * IN }, proj: 2 * IN / tpi, approx: !HEAD_IN[s] };
}
// longitud del espárrago o del tornillo para una unión bridada
//  grip = espesor apretado (bridas + junta); asm: 'STUD' (tuerca+arandela+espárrago+arandela+tuerca) o
//  'BOLT' (tornillo+arandela+tuerca); washers: arandelas sí/no; headWasher: arandela también bajo la cabeza
export function boltLength(f, grip, asm = 'STUD', washers = true, headWasher = false) {
  const tw = washers ? f.w.t : 0;
  const raw = asm === 'STUD' ? grip + 2 * (tw + f.m + f.proj) : grip + tw + (headWasher && washers ? tw : 0) + f.m + f.proj;
  if (f.sys === 'IN') { const q = Math.ceil(raw / IN * 4 - 1e-9) / 4; return { L: q * IN, Lin: q, raw, txt: `${fmtIn(q)}" (${Math.round(q * IN)} mm)` }; }
  const L = Math.ceil(raw / 5 - 1e-9) * 5; return { L, raw, txt: `${L} mm` };
}
export function fmtIn(q) { const w = Math.floor(q), r = Math.round((q - w) * 4); const fr = ['', '1/4', '1/2', '3/4'][r]; return w ? (fr ? `${w}-${fr}` : `${w}`) : fr || '0'; }
// materiales habituales
export const MAT_IN = [['B7', 'ASTM A193 B7 / A194 2H / F436'], ['B7M', 'ASTM A193 B7M / A194 2HM'], ['B8M', 'ASTM A193 B8M cl.2 / A194 8M'], ['L7', 'ASTM A320 L7 / A194 7 (baja temperatura)'], ['B16', 'ASTM A193 B16 / A194 4 (alta temperatura)']];
export const MAT_M = [['88', 'ISO 898-1 8.8 / ISO 898-2 8 / 300 HV'], ['109', 'ISO 898-1 10.9 / ISO 898-2 10 / 300 HV'], ['A4', 'ISO 3506 A4-70 (inoxidable)'], ['B7', 'ASTM A193 B7 / A194 2H (rosca métrica)']];
export const matText = (sys, code, part) => {
  if (sys === 'IN') return { B7: { stud: 'ASTM A193 B7', nut: 'ASTM A194 2H', washer: 'ASTM F436' }, B7M: { stud: 'ASTM A193 B7M', nut: 'ASTM A194 2HM', washer: 'ASTM F436' }, B8M: { stud: 'ASTM A193 B8M cl.2', nut: 'ASTM A194 8M', washer: 'AISI 316' }, L7: { stud: 'ASTM A320 L7', nut: 'ASTM A194 7', washer: 'ASTM F436' }, B16: { stud: 'ASTM A193 B16', nut: 'ASTM A194 4', washer: 'ASTM F436' } }[code]?.[part] || '';
  return { 88: { stud: '8.8', nut: '8', washer: '300 HV' }, 109: { stud: '10.9', nut: '10', washer: '300 HV' }, A4: { stud: 'A4-70', nut: 'A4-70', washer: 'A4' }, B7: { stud: 'ASTM A193 B7', nut: 'ASTM A194 2H', washer: 'ASTM F436' } }[code]?.[part] || '';
};

// geometría en vista lateral (eje del tornillo según X, centro en y = 0)
const L = (x1, y1, x2, y2, layer = 'MEC_TORNILLERIA') => ({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer });
const R = (x1, y1, x2, y2, layer) => [L(x1, y1, x2, y1, layer), L(x2, y1, x2, y2, layer), L(x2, y2, x1, y2, layer), L(x1, y2, x1, y1, layer)];
// tuerca o cabeza hexagonal vista por una arista (se ven tres caras): de x1 a x2
export function hexSide(x1, x2, f) { const a = f.e / 2, out = R(x1, -a, x2, a); out.push(L(x1, a / 2, x2, a / 2), L(x1, -a / 2, x2, -a / 2)); const c = Math.min(Math.abs(x2 - x1) * 0.18, a * 0.15), s = Math.sign(x2 - x1); out.push(L(x1, a - c, x1 + s * c, a), L(x1, -a + c, x1 + s * c, -a), L(x2, a - c, x2 - s * c, a), L(x2, -a + c, x2 - s * c, -a)); return out; }
export function washerSide(x1, x2, f) { return R(x1, -f.w.od / 2, x2, f.w.od / 2); }
// varilla roscada de x1 a x2 con chaflán en los extremos indicados y línea de fondo de rosca
export function shankSide(x1, x2, f, ends = [true, true], thread = [x1, x2]) {
  const r = f.d / 2, c = Math.min(f.pitch, r * 0.3), out = [];
  const a = ends[0] ? c : 0, b = ends[1] ? c : 0;
  out.push(L(x1 + a, r, x2 - b, r), L(x1 + a, -r, x2 - b, -r), L(x1, r - a, x1, -r + a), L(x2, r - b, x2, -r + b));
  if (a) out.push(L(x1, r - a, x1 + a, r), L(x1, -r + a, x1 + a, -r)); if (b) out.push(L(x2, r - b, x2 - b, r), L(x2, -r + b, x2 - b, -r));
  const rr = r - f.pitch * 0.6; out.push(L(Math.max(x1, thread[0]), rr, Math.min(x2, thread[1]), rr, 'MEC_OCULTAS'), L(Math.max(x1, thread[0]), -rr, Math.min(x2, thread[1]), -rr, 'MEC_OCULTAS'));
  out.push(L(x1 - 3, 0, x2 + 3, 0, 'MEC_EJES'));
  return out;
}
// montaje completo a lo largo de X: el apriete va de g1 a g2 (caras exteriores de las bridas)
export function assemblySide(f, g1, g2, asm, washers, headWasher, Lb) {
  const out = [], tw = washers ? f.w.t : 0;
  if (asm === 'STUD') {
    const xc = (g1 + g2) / 2, xa = xc - Lb / 2, xb = xc + Lb / 2;
    out.push(...shankSide(xa, xb, f));
    if (washers) out.push(...washerSide(g1 - tw, g1, f), ...washerSide(g2, g2 + tw, f));
    out.push(...hexSide(g1 - tw - f.m, g1 - tw, f), ...hexSide(g2 + tw, g2 + tw + f.m, f));
  } else {
    // cabeza en el lado g2, tuerca en el lado g1
    const htw = washers && headWasher ? tw : 0, xh = g2 + htw, xe = xh - Lb;
    out.push(...hexSide(xh, xh + f.k, f), ...shankSide(xe, xh, f, [true, false], [xe, xe + Math.min(Lb, 2 * f.d + 6 + (washers ? tw : 0) + f.m + f.proj + 10)]));
    if (htw) out.push(...washerSide(g2, g2 + tw, f));
    if (washers) out.push(...washerSide(g1 - tw, g1, f));
    out.push(...hexSide(g1 - tw - f.m, g1 - tw, f));
  }
  return out;
}
// vista frontal (desde la tuerca o la cabeza): hexágono, arandela y varilla
export function fastenerFront(f, kind) {
  const out = [], c = { x: 0, y: 0 };
  const hex = () => { const pts = Array.from({ length: 6 }, (_, i) => ({ x: f.e / 2 * Math.cos(i * Math.PI / 3), y: f.e / 2 * Math.sin(i * Math.PI / 3), b: 0 })); out.push({ type: 'LWPOLYLINE', pts, closed: true, layer: 'MEC_TORNILLERIA' }, { type: 'CIRCLE', c, r: f.s / 2 * 0.95, layer: 'MEC_TORNILLERIA' }); };
  if (kind === 'WASHER') out.push({ type: 'CIRCLE', c, r: f.w.od / 2, layer: 'MEC_TORNILLERIA' }, { type: 'CIRCLE', c, r: f.w.id / 2, layer: 'MEC_TORNILLERIA' });
  else if (kind === 'NUT') { hex(); out.push({ type: 'CIRCLE', c, r: f.d / 2 - f.pitch * 0.6, layer: 'MEC_TORNILLERIA' }, { type: 'ARC', c, r: f.d / 2, a1: 0, a2: 1.5 * Math.PI, layer: 'MEC_TORNILLERIA' }); }
  else if (kind === 'BOLT') hex();
  else out.push({ type: 'CIRCLE', c, r: f.d / 2, layer: 'MEC_TORNILLERIA' }, { type: 'CIRCLE', c, r: f.d / 2 - f.pitch * 0.6, layer: 'MEC_TORNILLERIA' });
  out.push(L(-f.e / 2 - 3, 0, f.e / 2 + 3, 0, 'MEC_EJES'), L(0, -f.e / 2 - 3, 0, f.e / 2 + 3, 'MEC_EJES'));
  return out;
}
