// Biblioteca de bloques: climatización (planta, mm reales), valvulería y esquemas P&ID (símbolos ISO 10628, ~10 mm)
// y perfiles estructurales en sección (dimensiones nominales de catálogo, mm).
import * as G from './geom.js';

const BQ = 0.41421356237; // curvatura de un cuarto de círculo
let bid = 0;
const L = (x1, y1, x2, y2, o = {}) => ({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer: '0', color: 0, ...o });
const C = (x, y, r, o = {}) => ({ type: 'CIRCLE', c: { x, y }, r, layer: '0', color: 0, ...o });
const A = (x, y, r, a1, a2, o = {}) => ({ type: 'ARC', c: { x, y }, r, a1: G.rad(a1), a2: G.rad(a2), layer: '0', color: 0, ...o });
const P = (pts, closed = true, o = {}) => ({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ x: p[0], y: p[1], b: p[2] || 0 })), closed, layer: '0', color: 0, ...o });
const R = (x, y, w, h, o) => P([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true, o);
const Tx = (x, y, h, text, o = {}) => ({ type: 'TEXT', p: { x, y }, p2: { x, y }, h, text, ha: 4, va: 0, layer: '0', color: 0, ...o });
const AT = (tag, prompt, def, x, y, h, o = {}) => ({ type: 'ATTDEF', tag, prompt, def, text: def, p: { x, y }, p2: { x, y }, h, ha: 4, va: 0, layer: '0', color: 0, ...o });
const SOLIDC = (x, y, r) => ({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [[{ x: x - r, y, b: 1 }, { x: x + r, y, b: 1 }]], layer: '0', color: 0 });
const SOLIDP = (pts) => ({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [pts.map((p) => ({ x: p[0], y: p[1], b: 0 }))], layer: '0', color: 0 });
const blk = (name, ents, o = {}) => { bid = 0; return { name, base: o.base || { x: 0, y: 0 }, ents: ents.map((e) => ({ ...e, bid: bid++ })), params: o.params || [], _ver: 1, lib: true, desc: o.desc || '' }; };
// parámetro lineal con acción de estiramiento sobre la parte derecha
const stretchW = (name, W, y1, y2, ids) => ({ type: 'linear', name, p1: { x: 0, y: y1 }, p2: { x: W, y: y1 }, inc: 50, actions: [{ type: 'stretch', frame: { x1: W * 0.6, y1: y1 - 1e3, x2: W + 1e3, y2: y2 + 1e3 }, ids }] });

// ---------------- climatización (planta)
const HVAC = {
  'Rejilla de impulsión': () => {
    const W = 400, H = 60, e = [R(0, 0, W, H)];
    for (let x = 25; x < W; x += 25) e.push(L(x, 8, x - 12, H - 8));
    e.push(AT('REF', 'Referencia', 'R-1', W / 2, H + 40, 60), AT('CAUDAL', 'Caudal (m³/h)', '300', W / 2, -110, 50));
    return blk('LIB_REJILLA_IMPULSION', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))], desc: 'Rejilla de pared, ancho ajustable' });
  },
  'Rejilla de retorno': () => {
    const W = 400, H = 60, e = [R(0, 0, W, H)];
    for (let x = 25; x < W; x += 25) e.push(L(x, 8, x, H - 8));
    e.push(AT('REF', 'Referencia', 'RR-1', W / 2, H + 40, 60), AT('CAUDAL', 'Caudal (m³/h)', '300', W / 2, -110, 50));
    return blk('LIB_REJILLA_RETORNO', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))] });
  },
  'Difusor rotacional': () => {
    const S = 600, e = [R(-S / 2, -S / 2, S, S), C(0, 0, 250), C(0, 0, 60)];
    for (let k = 0; k < 12; k++) { const a = k * 30; e.push(A(0, 0, 160, a, a + 22)); const p = G.polar({ x: 0, y: 0 }, G.rad(a), 70), q = G.polar({ x: 0, y: 0 }, G.rad(a + 18), 240); e.push(L(p.x, p.y, q.x, q.y)); }
    e.push(AT('REF', 'Referencia', 'D-1', 0, S / 2 + 50, 60), AT('CAUDAL', 'Caudal (m³/h)', '400', 0, -S / 2 - 110, 50));
    return blk('LIB_DIFUSOR_ROTACIONAL', e, { desc: 'Difusor rotacional de techo 600×600' });
  },
  'Difusor lineal': () => {
    const W = 1200, H = 100, e = [R(0, 0, W, H), R(20, 25, W - 40, 15), R(20, 60, W - 40, 15)];
    e.push(AT('REF', 'Referencia', 'DL-1', W / 2, H + 40, 60), AT('CAUDAL', 'Caudal (m³/h)', '250', W / 2, -110, 50));
    return blk('LIB_DIFUSOR_LINEAL', e, { params: [stretchW('Longitud', W, 0, H, e.map((_, i) => i))] });
  },
  'Compuerta de regulación': () => {
    const W = 400, H = 150, e = [R(0, 0, W, H), L(20, 20, W - 20, H - 20), C(W / 2, H / 2, 15), L(W / 2, H, W / 2, H + 80), L(W / 2 - 40, H + 80, W / 2 + 40, H + 80)];
    e.push(AT('REF', 'Referencia', 'CR-1', W / 2, H + 120, 60));
    return blk('LIB_COMPUERTA_REGULACION', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))] });
  },
  'Compuerta cortafuegos': () => {
    const W = 400, H = 300, e = [R(0, 0, W, H), L(0, 0, W, H), L(0, H, W, 0), Tx(W / 2, H + 40, 70, 'CF'), AT('REF', 'Referencia', 'CF-1', W / 2, -120, 60)];
    return blk('LIB_COMPUERTA_CORTAFUEGOS', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))] });
  },
  'Silenciador': () => {
    const W = 400, H = 900, e = [R(0, 0, W, H)];
    for (let y = 60; y < H; y += 60) e.push(L(30, y, W - 30, y - 40));
    e.push(AT('REF', 'Referencia', 'S-1', W / 2, H + 40, 60));
    return blk('LIB_SILENCIADOR', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))] });
  },
  'Ventilador': () => {
    const e = [C(0, 0, 300), C(0, 0, 40)];
    for (let k = 0; k < 4; k++) { const a = k * 90; e.push(A(G.polar({ x: 0, y: 0 }, G.rad(a + 45), 150).x, G.polar({ x: 0, y: 0 }, G.rad(a + 45), 150).y, 110, a + 135, a + 300)); }
    e.push(AT('REF', 'Referencia', 'V-1', 0, 360, 70), AT('CAUDAL', 'Caudal (m³/h)', '1500', 0, -420, 55));
    return blk('LIB_VENTILADOR', e);
  },
  'Unidad de tratamiento de aire': () => {
    const W = 3600, H = 1200, e = [R(0, 0, W, H)];
    const secs = [['Toma', 500], ['Filtro', 600], ['Batería', 700], ['Ventilador', 1100], ['Impulsión', 700]];
    let x = 0; for (const [n, w] of secs) { if (x) e.push(L(x, 0, x, H)); e.push(Tx(x + w / 2, H / 2 - 40, 90, n)); x += w; }
    e.push(L(1100 + 80, 100, 1100 + 520, H - 100), L(1100 + 520, 100, 1100 + 80, H - 100), C(1800 + 550, H / 2, 380));
    e.push(AT('REF', 'Referencia', 'UTA-1', W / 2, H + 80, 120), AT('CAUDAL', 'Caudal (m³/h)', '10000', W / 2, -180, 90));
    return blk('LIB_UTA', e, { desc: 'Climatizador (UTA) 3600×1200' });
  },
  'Fancoil': () => { const e = [R(0, 0, 1000, 500), Tx(500, 200, 120, 'FC'), L(0, 120, 1000, 120), AT('REF', 'Referencia', 'FC-1', 500, 560, 70), AT('POTENCIA', 'Potencia (kW)', '3,5', 500, -110, 55)]; return blk('LIB_FANCOIL', e); },
  'Split interior': () => { const e = [R(0, 0, 900, 250), L(40, 60, 860, 60), L(40, 100, 860, 100), AT('REF', 'Referencia', 'UI-1', 450, 300, 60)]; return blk('LIB_SPLIT_INTERIOR', e); },
  'Unidad exterior': () => { const e = [R(0, 0, 900, 350), C(330, 175, 140), L(650, 40, 650, 310), L(700, 40, 700, 310), L(750, 40, 750, 310), AT('REF', 'Referencia', 'UE-1', 450, 400, 60)]; return blk('LIB_UNIDAD_EXTERIOR', e); },
  'Termostato': () => { const e = [C(0, 0, 60), Tx(0, -25, 50, 'T'), AT('REF', 'Referencia', 'TS-1', 0, 90, 45)]; return blk('LIB_TERMOSTATO', e); },
  'Toma de aire exterior': () => { const W = 600, H = 80, e = [R(0, 0, W, H)]; for (let x = 30; x < W; x += 30) e.push(L(x, H, x - 20, 0)); e.push(L(W / 2, -60, W / 2, -300), L(W / 2, -60, W / 2 - 40, -140), L(W / 2, -60, W / 2 + 40, -140)); return blk('LIB_TOMA_AIRE', e, { params: [stretchW('Ancho', W, 0, H, e.map((_, i) => i))] }); },
};

// ---------------- valvulería y P&ID (esquemático, ~10 mm)
const bow = (o = {}) => [P([[-5, -3], [5, 3], [5, -3], [-5, 3]], true, o)];
const ends = () => [L(-8, 0, -5, 0), L(5, 0, 8, 0)];
const tag = (def = 'V-1') => AT('TAG', 'Identificador', def, 0, 5, 2);
const PID = {
  'Válvula de compuerta': () => blk('PID_VALVULA_COMPUERTA', [...bow(), ...ends(), tag()]),
  'Válvula de globo': () => blk('PID_VALVULA_GLOBO', [...bow(), SOLIDC(0, 0, 1.2), ...ends(), tag()]),
  'Válvula de bola': () => blk('PID_VALVULA_BOLA', [...bow(), C(0, 0, 1.8), ...ends(), tag()]),
  'Válvula de mariposa': () => blk('PID_VALVULA_MARIPOSA', [...bow(), L(0, -3.5, 0, 3.5), SOLIDC(0, 0, 0.8), ...ends(), tag()]),
  'Válvula de retención': () => blk('PID_VALVULA_RETENCION', [...bow(), SOLIDP([[-5, -3], [0, 0], [-5, 3]]), ...ends(), tag()]),
  'Válvula de tres vías': () => blk('PID_VALVULA_3VIAS', [...bow(), P([[0, 0], [-3, -5], [3, -5]]), L(0, -5, 0, -8), ...ends(), tag()]),
  'Válvula de control': () => blk('PID_VALVULA_CONTROL', [...bow(), L(0, 0, 0, 5), A(0, 5, 3, 0, 180), L(-3, 5, 3, 5), ...ends(), AT('TAG', 'Identificador', 'TV-1', 0, 9.5, 2)]),
  'Válvula de seguridad': () => blk('PID_VALVULA_SEGURIDAD', [P([[-3, -6], [3, -6], [0, 0]]), P([[0, 0], [6, -3], [6, 3]]), P([[0, 0], [-1.5, 1.5], [1.5, 3], [-1.5, 4.5], [1.5, 6], [0, 7]], false), L(0, -6, 0, -9), L(6, 0, 9, 0), AT('TAG', 'Identificador', 'PSV-1', 0, 9, 2)]),
  'Filtro en Y': () => blk('PID_FILTRO_Y', [L(-8, 0, 8, 0), L(-3, 0, 2, -5), L(2, -5, 4, -3), L(1, 0, 5, -4), L(3, -6, 6, -3), AT('TAG', 'Identificador', 'F-1', 0, 3, 2)]),
  'Bomba centrífuga': () => blk('PID_BOMBA', [C(0, 0, 5), L(0, 5, 8, 5), P([[-3.5, -3.5], [3.5, -3.5], [0, 0]], false), L(-8, 0, -5, 0), AT('TAG', 'Identificador', 'B-1', 0, -9, 2)]),
  'Manómetro': () => blk('PID_MANOMETRO', [C(0, 6, 3), Tx(0, 5, 2.2, 'P'), L(0, 0, 0, 3), AT('TAG', 'Identificador', 'PI-1', 0, 10.5, 1.8)]),
  'Termómetro': () => blk('PID_TERMOMETRO', [C(0, 6, 3), Tx(0, 5, 2.2, 'T'), L(0, 0, 0, 3), AT('TAG', 'Identificador', 'TI-1', 0, 10.5, 1.8)]),
  'Instrumento (ISA)': () => blk('PID_INSTRUMENTO', [C(0, 0, 5), L(-5, 0, 5, 0), AT('FUNCION', 'Función', 'PT', 0, 1.2, 2.2), AT('LAZO', 'Lazo', '101', 0, -3.4, 2.2)]),
  'Vaso de expansión': () => blk('PID_VASO_EXPANSION', [P([[-4, -6], [4, -6, BQ * 2.414], [4, 6], [-4, 6, BQ * 2.414]]), L(-4, 0, 4, 0), L(0, -6, 0, -9), AT('TAG', 'Identificador', 'VE-1', 7, 0, 2)]),
  'Intercambiador de calor': () => blk('PID_INTERCAMBIADOR', [C(0, 0, 6), P([[-8, -2], [-4, -2], [-2, 2], [0, -2], [2, 2], [4, -2], [8, -2]], false), AT('TAG', 'Identificador', 'IC-1', 0, 7.5, 2)]),
  'Depósito': () => blk('PID_DEPOSITO', [P([[-6, -10], [6, -10], [6, 10], [-6, 10]]), A(0, 10, 6, 0, 180), A(0, -10, 6, 180, 360), AT('TAG', 'Identificador', 'D-1', 0, 0, 2.5)]),
  'Purgador': () => blk('PID_PURGADOR', [R(-3, -3, 6, 6), L(-3, -3, 3, 3), L(-6, 0, -3, 0), L(3, 0, 6, 0), AT('TAG', 'Identificador', 'P-1', 0, 4.5, 1.8)]),
  'Brida': () => blk('PID_BRIDA', [L(-1, -4, -1, 4), L(1, -4, 1, 4), L(-5, 0, -1, 0), L(1, 0, 5, 0)]),
  'Reducción': () => blk('PID_REDUCCION', [P([[-4, -3], [4, -1.5], [4, 1.5], [-4, 3]]), L(-8, 0, -4, 0), L(4, 0, 8, 0)]),
  'Flecha de flujo': () => blk('PID_FLECHA', [SOLIDP([[-3, -1.5], [3, 0], [-3, 1.5]])]),
};

// ---------------- perfiles estructurales (sección)
const I_SEC = { // h, b, tw, tf, r
  IPE: { 80: [80, 46, 3.8, 5.2, 5], 100: [100, 55, 4.1, 5.7, 7], 120: [120, 64, 4.4, 6.3, 7], 140: [140, 73, 4.7, 6.9, 7], 160: [160, 82, 5, 7.4, 9], 180: [180, 91, 5.3, 8, 9], 200: [200, 100, 5.6, 8.5, 12], 220: [220, 110, 5.9, 9.2, 12], 240: [240, 120, 6.2, 9.8, 15], 270: [270, 135, 6.6, 10.2, 15], 300: [300, 150, 7.1, 10.7, 15], 330: [330, 160, 7.5, 11.5, 18], 360: [360, 170, 8, 12.7, 18], 400: [400, 180, 8.6, 13.5, 21], 450: [450, 190, 9.4, 14.6, 21], 500: [500, 200, 10.2, 16, 21], 550: [550, 210, 11.1, 17.2, 24], 600: [600, 220, 12, 19, 24] },
  HEA: { 100: [96, 100, 5, 8, 12], 120: [114, 120, 5, 8, 12], 140: [133, 140, 5.5, 8.5, 12], 160: [152, 160, 6, 9, 15], 180: [171, 180, 6, 9.5, 15], 200: [190, 200, 6.5, 10, 18], 220: [210, 220, 7, 11, 18], 240: [230, 240, 7.5, 12, 21], 260: [250, 260, 7.5, 12.5, 24], 280: [270, 280, 8, 13, 24], 300: [290, 300, 8.5, 14, 27], 320: [310, 300, 9, 15.5, 27], 340: [330, 300, 9.5, 16.5, 27], 360: [350, 300, 10, 17.5, 27], 400: [390, 300, 11, 19, 27], 450: [440, 300, 11.5, 21, 27], 500: [490, 300, 12, 23, 27], 600: [590, 300, 13, 25, 27] },
  HEB: { 100: [100, 100, 6, 10, 12], 120: [120, 120, 6.5, 11, 12], 140: [140, 140, 7, 12, 12], 160: [160, 160, 8, 13, 15], 180: [180, 180, 8.5, 14, 15], 200: [200, 200, 9, 15, 18], 220: [220, 220, 9.5, 16, 18], 240: [240, 240, 10, 17, 21], 260: [260, 260, 10, 17.5, 24], 280: [280, 280, 10.5, 18, 24], 300: [300, 300, 11, 19, 27], 320: [320, 300, 11.5, 20.5, 27], 340: [340, 300, 12, 21.5, 27], 360: [360, 300, 12.5, 22.5, 27], 400: [400, 300, 13.5, 24, 27], 450: [450, 300, 14, 26, 27], 500: [500, 300, 14.5, 28, 27], 600: [600, 300, 15.5, 30, 27] },
  UPN: { 80: [80, 45, 6, 8, 8], 100: [100, 50, 6, 8.5, 8.5], 120: [120, 55, 7, 9, 9], 140: [140, 60, 7, 10, 10], 160: [160, 65, 7.5, 10.5, 10.5], 180: [180, 70, 8, 11, 11], 200: [200, 75, 8.5, 11.5, 11.5], 220: [220, 80, 9, 12.5, 12.5], 240: [240, 85, 9.5, 13, 13], 260: [260, 90, 10, 14, 14], 280: [280, 95, 10, 15, 15], 300: [300, 100, 10, 16, 16] },
};
const ANG = { '40x4': [40, 4, 6], '50x5': [50, 5, 7], '60x6': [60, 6, 8], '70x7': [70, 7, 9], '80x8': [80, 8, 10], '90x9': [90, 9, 11], '100x10': [100, 10, 12], '120x12': [120, 12, 13], '150x15': [150, 15, 16] };
const RHS = { '40x40x3': [40, 40, 3], '50x50x4': [50, 50, 4], '60x60x4': [60, 60, 4], '80x80x5': [80, 80, 5], '100x100x6': [100, 100, 6], '120x120x6': [120, 120, 6], '100x50x4': [100, 50, 4], '120x60x5': [120, 60, 5], '150x100x6': [150, 100, 6], '200x100x8': [200, 100, 8] };
const CHS = { '33.7x3.2': [33.7, 3.2], '48.3x3.2': [48.3, 3.2], '60.3x4': [60.3, 4], '76.1x4': [76.1, 4], '88.9x5': [88.9, 5], '114.3x5': [114.3, 5], '139.7x6.3': [139.7, 6.3], '168.3x6.3': [168.3, 6.3] };
const axes = (w, h) => [L(-w * 0.65, 0, w * 0.65, 0, { ltype: 'CENTER', color: 8, lts: 0.05 }), L(0, -h * 0.6, 0, h * 0.6, { ltype: 'CENTER', color: 8, lts: 0.05 })];
function iSection(name, [h, b, tw, tf, r]) {
  const y0 = -h / 2, y1 = h / 2, q = -BQ;
  const pts = [[-b / 2, y0], [b / 2, y0], [b / 2, y0 + tf], [tw / 2 + r, y0 + tf, q], [tw / 2, y0 + tf + r], [tw / 2, y1 - tf - r, q], [tw / 2 + r, y1 - tf], [b / 2, y1 - tf], [b / 2, y1], [-b / 2, y1], [-b / 2, y1 - tf], [-tw / 2 - r, y1 - tf, q], [-tw / 2, y1 - tf - r], [-tw / 2, y0 + tf + r, q], [-tw / 2 - r, y0 + tf], [-b / 2, y0 + tf]];
  return blk(name, [P(pts), ...axes(b, h), Tx(0, y0 - h * 0.18 - 4, Math.max(4, h / 18), name.replace('PERFIL_', ''))], { desc: `h=${h} b=${b} tw=${tw} tf=${tf} r=${r}` });
}
function uSection(name, [h, b, tw, tf, r]) {
  const y0 = -h / 2, y1 = h / 2, q = -BQ;
  const pts = [[0, y0], [b, y0], [b, y0 + tf], [tw + r, y0 + tf, q], [tw, y0 + tf + r], [tw, y1 - tf - r, q], [tw + r, y1 - tf], [b, y1 - tf], [b, y1], [0, y1]];
  return blk(name, [P(pts), Tx(b / 2, y0 - h * 0.18 - 4, Math.max(4, h / 18), name.replace('PERFIL_', ''))], { desc: `h=${h} b=${b} tw=${tw} tf=${tf}` });
}
function lSection(name, [a, t, r]) {
  const pts = [[0, 0], [a, 0], [a, t], [t + r, t, -BQ], [t, t + r], [t, a], [0, a]];
  return blk(name, [P(pts), Tx(a / 2, -a * 0.25 - 4, Math.max(4, a / 10), name.replace('PERFIL_', ''))]);
}
function rhsSection(name, [w, hh, t]) {
  const ro = 2 * t, ri = t, rr = (W, H, r) => [[-W / 2 + r, -H / 2], [W / 2 - r, -H / 2, BQ], [W / 2, -H / 2 + r], [W / 2, H / 2 - r, BQ], [W / 2 - r, H / 2], [-W / 2 + r, H / 2, BQ], [-W / 2, H / 2 - r], [-W / 2, -H / 2 + r, BQ]];
  return blk(name, [P(rr(w, hh, ro)), P(rr(w - 2 * t, hh - 2 * t, ri)), ...axes(w, hh), Tx(0, -hh / 2 - hh * 0.25 - 4, Math.max(4, hh / 10), name.replace('PERFIL_', ''))]);
}
function chsSection(name, [d, t]) { return blk(name, [C(0, 0, d / 2), C(0, 0, d / 2 - t), ...axes(d, d), Tx(0, -d / 2 - d * 0.25 - 4, Math.max(4, d / 10), name.replace('PERFIL_', ''))]); }

const PROFILES = {};
for (const [fam, tab] of Object.entries(I_SEC)) for (const [sz, dims] of Object.entries(tab)) PROFILES[`${fam} ${sz}`] = () => (fam === 'UPN' ? uSection(`PERFIL_${fam}${sz}`, dims) : iSection(`PERFIL_${fam}${sz}`, dims));
for (const [sz, d] of Object.entries(ANG)) PROFILES[`L ${sz}`] = () => lSection(`PERFIL_L${sz}`, d);
for (const [sz, d] of Object.entries(RHS)) PROFILES[`Tubo ${sz}`] = () => rhsSection(`PERFIL_TR${sz}`, d);
for (const [sz, d] of Object.entries(CHS)) PROFILES[`Tubo Ø${sz}`] = () => chsSection(`PERFIL_CHS${sz}`, d);

export const LIBRARY = [
  { id: 'hvac', name: 'Climatización', items: HVAC },
  { id: 'pid', name: 'Valvulería y P&ID', items: PID },
  { id: 'steel', name: 'Perfiles de acero', items: PROFILES },
];
export function libBlock(cat, label) { const c = LIBRARY.find((x) => x.id === cat); const f = c?.items[label]; return f ? f() : null; }
