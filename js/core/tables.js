// Tablas: colores ACI, tipos de línea, patrones de sombreado, unidades
function hsv(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
}
export const ACI = (() => {
  const t = new Array(256);
  t[0] = [0, 0, 0];
  const base = { 1: [255, 0, 0], 2: [255, 255, 0], 3: [0, 255, 0], 4: [0, 255, 255], 5: [0, 0, 255], 6: [255, 0, 255], 7: [255, 255, 255], 8: [128, 128, 128], 9: [192, 192, 192] };
  Object.assign(t, base);
  const vals = [1, 1, 0.74, 0.74, 0.506, 0.506, 0.408, 0.408, 0.31, 0.31];
  for (let i = 10; i < 250; i++) {
    const h = (Math.floor(i / 10) - 1) * 15, sub = i % 10;
    t[i] = hsv(h, sub % 2 ? 0.333 : 1, vals[sub]);
  }
  [51, 91, 132, 173, 214, 255].forEach((g, k) => (t[250 + k] = [g, g, g]));
  return t;
})();
export const COLOR_NAMES = { 1: 'Red', 2: 'Yellow', 3: 'Green', 4: 'Cyan', 5: 'Blue', 6: 'Magenta', 7: 'White', 256: 'ByLayer', 0: 'ByBlock' };
export function aciCss(i, bgDark = true) {
  if (i === 7 || i === 255 && !bgDark) return bgDark ? '#ffffff' : '#000000';
  const c = ACI[i] || ACI[7];
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function colorName(c) {
  if (c == null || c === 256) return 'ByLayer';
  if (c === 0) return 'ByBlock';
  if (typeof c === 'string') return c;
  return COLOR_NAMES[c] || 'Color ' + c;
}
export function rgbToAci(r, g, b) {
  let best = 7, bd = Infinity;
  for (let i = 1; i < 256; i++) { const c = ACI[i]; const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = i; } }
  return best;
}

// Tipos de línea (unidades de dibujo; + trazo, - hueco, 0 punto)
export const LINETYPES = {
  CONTINUOUS: { desc: 'Solid line', pat: [] },
  DASHED: { desc: '__ __ __ __ __ __ __', pat: [0.5, -0.25] },
  DASHED2: { desc: '_ _ _ _ _ _ _ _ _ _', pat: [0.25, -0.125] },
  DASHEDX2: { desc: '____  ____  ____', pat: [1.0, -0.5] },
  HIDDEN: { desc: '__ __ __ __ __ __', pat: [0.25, -0.125] },
  HIDDEN2: { desc: '_ _ _ _ _ _ _ _ _', pat: [0.125, -0.0625] },
  CENTER: { desc: '____ _ ____ _ ____', pat: [1.25, -0.25, 0.25, -0.25] },
  CENTER2: { desc: '___ _ ___ _ ___', pat: [0.75, -0.125, 0.125, -0.125] },
  PHANTOM: { desc: '______  __  __  ______', pat: [1.25, -0.25, 0.25, -0.25, 0.25, -0.25] },
  DOT: { desc: '. . . . . . . .', pat: [0, -0.25] },
  DASHDOT: { desc: '__ . __ . __ .', pat: [0.5, -0.25, 0, -0.25] },
  DIVIDE: { desc: '____ . . ____ . .', pat: [0.5, -0.25, 0, -0.25, 0, -0.25] },
  BORDER: { desc: '__ __ . __ __ .', pat: [0.5, -0.25, 0.5, -0.25, 0, -0.25] },
  ACAD_ISO02W100: { desc: 'ISO dash', pat: [12, -3] },
  ACAD_ISO03W100: { desc: 'ISO dash space', pat: [12, -18] },
  ACAD_ISO04W100: { desc: 'ISO long-dash dot', pat: [24, -3, 0.5, -3] },
  ACAD_ISO08W100: { desc: 'ISO long-dash short-dash', pat: [24, -3, 6, -3] },
  ACAD_ISO10W100: { desc: 'ISO dash dot', pat: [12, -3, 0.5, -3] },
};

// Patrones de sombreado: líneas {a: grados, o:[ox,oy] origen, d:[dx,dy] desplazamiento, dash:[]}
export const HATCHES = {
  SOLID: null,
  ANSI31: [{ a: 45, o: [0, 0], d: [0, 3.175], dash: [] }],
  ANSI32: [{ a: 45, o: [0, 0], d: [0, 9.525], dash: [] }, { a: 45, o: [4.49, 0], d: [0, 9.525], dash: [] }],
  ANSI33: [{ a: 45, o: [0, 0], d: [0, 6.35], dash: [] }, { a: 45, o: [4.49, 0], d: [0, 6.35], dash: [3.175, -1.5875] }],
  ANSI34: [{ a: 45, o: [0, 0], d: [0, 19.05], dash: [] }, { a: 45, o: [4.49, 0], d: [0, 19.05], dash: [] }, { a: 45, o: [8.98, 0], d: [0, 19.05], dash: [] }, { a: 45, o: [13.47, 0], d: [0, 19.05], dash: [] }],
  ANSI35: [{ a: 45, o: [0, 0], d: [0, 6.35], dash: [] }, { a: 45, o: [4.49, 0], d: [0, 6.35], dash: [7.9375, -1.5875, 0, -1.5875] }],
  ANSI36: [{ a: 45, o: [0, 0], d: [5.55625, 3.175], dash: [7.9375, -1.5875, 0, -1.5875] }],
  ANSI37: [{ a: 45, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 135, o: [0, 0], d: [0, 3.175], dash: [] }],
  ANSI38: [{ a: 45, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 135, o: [0, 0], d: [6.35, 3.175], dash: [7.9375, -4.7625] }],
  NET: [{ a: 0, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 90, o: [0, 0], d: [0, 3.175], dash: [] }],
  NET3: [{ a: 0, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 60, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 120, o: [0, 0], d: [0, 3.175], dash: [] }],
  LINE: [{ a: 0, o: [0, 0], d: [0, 3.175], dash: [] }],
  CROSS: [{ a: 0, o: [0, 0], d: [6.35, 6.35], dash: [3.175, -9.525] }, { a: 90, o: [1.5875, -1.5875], d: [-6.35, 6.35], dash: [3.175, -9.525] }],
  DOTS: [{ a: 0, o: [0, 0], d: [0.79375, 1.5875], dash: [0, -1.5875] }],
  BRICK: [{ a: 0, o: [0, 0], d: [0, 6.35], dash: [] }, { a: 90, o: [0, 0], d: [0, 12.7], dash: [6.35, -6.35] }, { a: 90, o: [6.35, 0], d: [0, 12.7], dash: [-6.35, 6.35] }],
  HONEY: [{ a: 0, o: [0, 0], d: [4.7625, 2.749630], dash: [3.175, -6.35] }, { a: 120, o: [0, 0], d: [4.7625, -2.749630], dash: [3.175, -6.35] }, { a: 60, o: [0, 0], d: [4.7625, 2.749630], dash: [-6.35, 3.175] }],
  'AR-CONC': [{ a: 50, o: [0, 0], d: [4.12, -10.5], dash: [3.75, -8.25] }, { a: 355, o: [0, 0], d: [-2.4, 11.6], dash: [3, -9] }, { a: 100.45, o: [2.97, -0.26], d: [8.8, 3.1], dash: [3.18, -8.82] }],
  EARTH: [{ a: 0, o: [0, 0], d: [6.35, 6.35], dash: [6.35, -6.35] }, { a: 0, o: [0, 2.38], d: [6.35, 6.35], dash: [6.35, -6.35] }, { a: 0, o: [0, 4.76], d: [6.35, 6.35], dash: [6.35, -6.35] }, { a: 90, o: [0.79, 5.56], d: [-6.35, 6.35], dash: [6.35, -6.35] }, { a: 90, o: [3.18, 5.56], d: [-6.35, 6.35], dash: [6.35, -6.35] }, { a: 90, o: [5.56, 5.56], d: [-6.35, 6.35], dash: [6.35, -6.35] }],
  STEEL: [{ a: 45, o: [0, 0], d: [0, 3.175], dash: [] }, { a: 45, o: [0, 1.5875], d: [0, 3.175], dash: [] }],
};

export const LWEIGHTS = [-1, -2, -3, 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
export const lwName = (l) => l === -1 ? 'ByLayer' : l === -2 ? 'ByBlock' : l === -3 ? 'Default' : (l / 100).toFixed(2) + ' mm';

export const PAPER = { A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841], Letter: [279.4, 215.9] };
