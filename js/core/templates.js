// Plantillas de dibujo: capas normalizadas, estilos, presentaciones con marco y cajetín con campos.
import { Doc, newLayer } from './document.js';
import { LINETYPES } from './tables.js';
import { docBase } from './i18n.js';

export const PAPERS = { A4: [297, 210], A4V: [210, 297], A3: [420, 297], A2: [594, 420], A1: [841, 594], A0: [1189, 841] };

// capas por disciplina: [nombre, color ACI, tipo de línea, grosor (centésimas de mm), traza]
const LAYERS = {
  base: [
    ['CONTORNO', 7, 'CONTINUOUS', 50], ['OCULTAS', 8, 'HIDDEN', 25], ['EJES', 1, 'CENTER', 18], ['COTAS', 3, 'CONTINUOUS', 18], ['TEXTO', 2, 'CONTINUOUS', 25],
    ['SOMBREADO', 252, 'CONTINUOUS', 13], ['CAJETIN', 7, 'CONTINUOUS', 35], ['VENTANAS', 8, 'CONTINUOUS', 13, false], ['REVISIONES', 1, 'CONTINUOUS', 25],
  ],
  hvac: [
    ['CLIMA-CONDUCTO-IMPULSION', 5, 'CONTINUOUS', 35], ['CLIMA-CONDUCTO-RETORNO', 1, 'CONTINUOUS', 35], ['CLIMA-CONDUCTO-EXTRACCION', 6, 'CONTINUOUS', 35],
    ['CLIMA-CONDUCTO-AIRE-EXTERIOR', 3, 'CONTINUOUS', 35], ['CLIMA-DIFUSORES', 4, 'CONTINUOUS', 25], ['CLIMA-REJILLAS', 4, 'CONTINUOUS', 25], ['CLIMA-EQUIPOS', 30, 'CONTINUOUS', 35],
    ['CLIMA-TUBERIA-AF-IDA', 5, 'CONTINUOUS', 25], ['CLIMA-TUBERIA-AF-RETORNO', 5, 'DASHED', 25], ['CLIMA-TUBERIA-AC-IDA', 1, 'CONTINUOUS', 25], ['CLIMA-TUBERIA-AC-RETORNO', 1, 'DASHED', 25],
    ['CLIMA-REFRIGERANTE', 6, 'CONTINUOUS', 25], ['CLIMA-CONDENSADOS', 140, 'DASHED', 18], ['CLIMA-VALVULERIA', 2, 'CONTINUOUS', 25], ['CLIMA-TEXTOS', 2, 'CONTINUOUS', 18],
    ['ARQ-MUROS', 8, 'CONTINUOUS', 25], ['ARQ-MOBILIARIO', 9, 'CONTINUOUS', 13],
  ],
  naval: [
    ['NAV-ESTRUCTURA', 7, 'CONTINUOUS', 50], ['NAV-MAMPAROS', 7, 'CONTINUOUS', 35], ['NAV-CUBIERTAS', 8, 'CONTINUOUS', 25], ['NAV-CUADERNAS', 9, 'CENTER', 13],
    ['NAV-REFUERZOS', 8, 'HIDDEN', 18], ['NAV-HVAC-CONDUCTOS', 5, 'CONTINUOUS', 35], ['NAV-HVAC-EQUIPOS', 30, 'CONTINUOUS', 35], ['NAV-TUBERIAS', 3, 'CONTINUOUS', 25],
    ['NAV-PASOS-MAMPARO', 1, 'CONTINUOUS', 25], ['NAV-AISLAMIENTO', 252, 'CONTINUOUS', 13], ['NAV-TEXTOS', 2, 'CONTINUOUS', 18],
  ],
  pid: [
    ['PID-LINEAS-PRINCIPALES', 7, 'CONTINUOUS', 50], ['PID-LINEAS-SECUNDARIAS', 7, 'CONTINUOUS', 25], ['PID-SENALES', 3, 'DASHED', 18], ['PID-EQUIPOS', 4, 'CONTINUOUS', 35],
    ['PID-VALVULAS', 2, 'CONTINUOUS', 25], ['PID-INSTRUMENTOS', 6, 'CONTINUOUS', 25], ['PID-TEXTOS', 2, 'CONTINUOUS', 18],
  ],
};

export const TEMPLATES = [
  { id: 'iso-a3', name: 'ISO A3 apaisado — mm', paper: 'A3', layers: ['base'] },
  { id: 'iso-a4v', name: 'ISO A4 vertical — mm', paper: 'A4V', layers: ['base'] },
  { id: 'iso-a2', name: 'ISO A2 — mm', paper: 'A2', layers: ['base'] },
  { id: 'iso-a1', name: 'ISO A1 — mm', paper: 'A1', layers: ['base'] },
  { id: 'iso-a0', name: 'ISO A0 — mm', paper: 'A0', layers: ['base'] },
  { id: 'hvac-a1', name: 'Climatización (HVAC) A1 — mm', paper: 'A1', layers: ['base', 'hvac'] },
  { id: 'naval-a1', name: 'Naval A1 — mm', paper: 'A1', layers: ['base', 'naval'] },
  { id: 'pid-a3', name: 'P&ID / esquemas A3 — mm', paper: 'A3', layers: ['base', 'pid'] },
  { id: 'vacio', name: 'Vacío (sin marco) — mm', paper: 'A3', layers: [], noFrame: true },
];

// marco ISO 5457 (20 mm a la izquierda, 10 mm el resto) y cajetín ISO 7200 de 180 mm
export function titleBlock() {
  const ents = [];
  const L = (x1, y1, x2, y2, layer = 'CAJETIN') => ents.push({ type: 'LINE', p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 }, layer: '0', color: 0 });
  const T = (x, y, h, text) => ents.push({ type: 'TEXT', p: { x, y }, h, text, layer: '0', color: 0, style: 'ISO' });
  const A = (tag, prompt, def, x, y, h) => ents.push({ type: 'ATTDEF', tag, prompt, def, text: def, p: { x, y }, h, layer: '0', color: 0, style: 'ISO' });
  const W = 180, H = 40;
  // marco exterior del cajetín (origen en su esquina inferior derecha -> x negativa)
  const X0 = -W;
  [[X0, 0, 0, 0], [0, 0, 0, H], [0, H, X0, H], [X0, H, X0, 0]].forEach((s) => L(...s));
  // filas: 0-8 / 8-16 / 16-30 / 30-40
  L(X0, 8, 0, 8); L(X0, 16, 0, 16); L(X0, 30, 0, 30);
  // columnas de las filas inferiores
  for (const x of [-135, -90, -45]) { L(x, 0, x, 8); L(x, 8, x, 16); }
  T(X0 + 1.5, 37, 1.8, 'Proyecto'); A('PROYECTO', 'Proyecto', '%<\\AcVar CustomDP.PROYECTO>%', X0 + 2, 32, 3.5);
  T(X0 + 1.5, 27.5, 1.8, 'Título'); A('TITULO', 'Título del plano', '%<\\AcVar Title>%', X0 + 2, 19.5, 5);
  T(X0 + 1.5, 13.8, 1.8, 'Escala'); A('ESCALA', 'Escala', '1:1', X0 + 2, 9.6, 3);
  T(-133.5, 13.8, 1.8, 'Fecha'); A('FECHA', 'Fecha', '%<\\AcVar SaveDate \\f "dd/MM/yyyy">%', -133, 9.6, 3);
  T(-88.5, 13.8, 1.8, 'Dibujado'); A('DIBUJADO', 'Dibujado por', '%<\\AcVar Author>%', -88, 9.6, 3);
  T(-43.5, 13.8, 1.8, 'Revisado'); A('REVISADO', 'Revisado por', '', -43, 9.6, 3);
  T(X0 + 1.5, 5.8, 1.8, 'Plano nº'); A('PLANO', 'Número de plano', '%<\\AcVar Filename \\f "%fn2">%', X0 + 2, 1.6, 3);
  T(-133.5, 5.8, 1.8, 'Revisión'); A('REV', 'Revisión', '%<\\AcVar CustomDP.REVISION>%', -133, 1.6, 3);
  T(-88.5, 5.8, 1.8, 'Hoja'); A('HOJA', 'Hoja', '%<\\AcVar ctab>%', -88, 1.6, 3);
  T(-43.5, 1.6, 2.5, 'WebCAD Libre');
  ents.forEach((e, i) => (e.bid = i));
  return { name: 'CAJETIN_ISO', base: { x: 0, y: 0 }, ents, params: [], _ver: 1 };
}

export function buildTemplate(id, opts = {}) {
  const t = TEMPLATES.find((x) => x.id === id) || TEMPLATES[0];
  const d = new Doc(); d.reset(opts.name || `${docBase()}1`);
  for (const k of ['CENTER', 'HIDDEN', 'DASHED', 'PHANTOM', 'DASHDOT']) if (LINETYPES[k]) d.ltypes[k] = LINETYPES[k];
  for (const grp of t.layers) for (const [n, c, lt, lw, plot] of LAYERS[grp]) d.layers[n] = newLayer(n, { color: c, ltype: lt, lw, plot: plot !== false });
  d.styles.ISO = { name: 'ISO', font: 'isocp.shx', h: 0, wf: 1 };
  d.vars.TEXTSTYLE = 'ISO'; d.vars.INSUNITS = 4; d.vars.LTSCALE = t.paper === 'A0' || t.paper === 'A1' ? 10 : 5; d.vars.PSLTSCALE = 1;
  if (t.layers.includes('hvac')) d.props.custom = { PROYECTO: '', REVISION: '0', INSTALACION: 'Climatización' };
  else d.props.custom = { PROYECTO: '', REVISION: '0' };
  const [w, h] = PAPERS[t.paper];
  const L = d.layouts[0]; L.paper = t.paper.replace('V', ''); L.w = w; L.h = h; L.ents = [];
  if (!t.noFrame) {
    const blk = titleBlock(); d.blocks[blk.name] = blk;
    const fr = (x1, y1, x2, y2) => ({ type: 'LWPOLYLINE', layer: 'CAJETIN', color: 256, pts: [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }].map((p) => ({ ...p, b: 0 })), closed: true, lw: 50 });
    L.ents.push(fr(20, 10, w - 10, h - 10));
    L.ents.push({ type: 'INSERT', name: blk.name, p: { x: w - 10, y: 10 }, sx: 1, sy: 1, rot: 0, layer: 'CAJETIN', color: 256,
      attribs: blk.ents.filter((e) => e.type === 'ATTDEF').map((a) => ({ type: 'ATTRIB', tag: a.tag, text: a.def, p: { x: w - 10 + a.p.x, y: 10 + a.p.y }, h: a.h, layer: 'CAJETIN', style: 'ISO', color: 256 })) });
    // ventana gráfica sobre el área útil
    const vw = w - 40, vh = h - 70;
    L.ents.push({ type: 'VIEWPORT', vpid: 2, c: { x: 20 + 5 + vw / 2, y: 55 + vh / 2 }, w: vw, h: vh, vc: { x: vw / 2, y: vh / 2 }, scale: 1, layer: 'VENTANAS', color: 256 });
  }
  d.clayer = t.layers.length ? (t.layers.includes('hvac') ? 'CLIMA-CONDUCTO-IMPULSION' : 'CONTORNO') : '0';
  for (const e of [...d.model, ...L.ents]) d.stamp(e);
  d.modified = false;
  d._template = t.id;
  return d;
}
