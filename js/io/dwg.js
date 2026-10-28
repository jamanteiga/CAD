// Lectura DWG mediante libredwg-web (WebAssembly), cargado bajo demanda
import * as G from '../core/geom.js';
import { Doc, newLayer } from '../core/document.js';
import { LINETYPES } from '../core/tables.js';
import { layoutBase } from '../core/i18n.js';

const VER = '0.7.15';
const SOURCES = [
  { js: './vendor/libredwg/dist/libredwg-web.js', wasm: './vendor/libredwg/wasm' },
  { js: `https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@${VER}/dist/libredwg-web.js`, wasm: `https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@${VER}/wasm` },
];
let lib = null;
async function loadLib(log) {
  if (lib) return lib;
  let lastErr;
  for (const s of SOURCES) {
    try {
      const url = new URL(s.js, document.baseURI).href;
      const mod = await import(/* @vite-ignore */ url);
      const wasmDir = new URL(s.wasm, document.baseURI).href;
      const inst = await mod.LibreDwg.create(wasmDir);
      lib = { mod, inst };
      return lib;
    } catch (e) { lastErr = e; log?.(`Cargador DWG: ${s.js} no disponible`); }
  }
  throw new Error('No se pudo cargar el lector DWG (libredwg-web): ' + (lastErr?.message || lastErr));
}

export async function readDWG(buffer, name, log) {
  const { mod, inst } = await loadLib(log);
  const ptr = inst.dwg_read_data(buffer, mod.Dwg_File_Type.DWG);
  if (ptr == null) throw new Error('El archivo DWG no se pudo leer (versión no soportada o archivo dañado).');
  let db;
  try { db = inst.convert(ptr); } finally { try { inst.dwg_free(ptr); } catch (_) { /* nada */ } }
  return fromDatabase(db, name);
}

const p2 = (p) => ({ x: p?.x || 0, y: p?.y || 0 });
const colorOf = (e) => {
  const o = {};
  if (e.colorIndex != null) o.color = e.colorIndex;
  else if (e.color != null && e.color >= 0) { o.tc = '#' + (e.color & 0xffffff).toString(16).padStart(6, '0'); o.color = 256; }
  else o.color = 256;
  if (o.color > 256 || o.color < 0) o.color = 256;
  return o;
};
const LWIDX = [0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211];
export const dwgLw = (v) => (v === 29 ? -1 : v === 30 ? -2 : v === 31 ? -3 : v >= 0 && v < LWIDX.length ? LWIDX[v] : v < 0 ? v : -1);
function common(e) {
  const o = { layer: e.layer || '0', ...colorOf(e) };
  o.ltype = (e.lineType || 'BYLAYER').toUpperCase();
  if (e.lineweight != null) o.lw = dwgLw(e.lineweight);
  if (e.lineTypeScale && e.lineTypeScale !== 1) o.lts = e.lineTypeScale;
  if (e.isVisible === false) o.visible = false;
  if (e.handle) o.hid = String(e.handle).toUpperCase();
  return o;
}
const flipZ = (e) => (e.extrusionDirection?.z ?? 1) < 0;

function conv(e, stats) {
  const c = common(e);
  const fl = flipZ(e);
  const fx = (p) => (fl ? { x: -p.x, y: p.y } : p2(p));
  try {
    switch (e.type) {
      case 'LINE': return { type: 'LINE', ...c, p1: p2(e.startPoint), p2: p2(e.endPoint) };
      case 'XLINE': case 'RAY': return { type: e.type, ...c, p: p2(e.firstPoint || e.basePoint || e.position), dir: G.norm(p2(e.unitDirection || e.direction || { x: 1, y: 0 })) };
      case 'POINT': return { type: 'POINT', ...c, p: p2(e.position) };
      case 'CIRCLE': return { type: 'CIRCLE', ...c, c: fx(e.center), r: e.radius };
      case 'ARC': { let a1 = e.startAngle, a2 = e.endAngle; if (fl) [a1, a2] = [Math.PI - a2, Math.PI - a1]; return { type: 'ARC', ...c, c: fx(e.center), r: e.radius, a1, a2 }; }
      case 'LWPOLYLINE': { const pts = (e.vertices || []).map((v) => (fl ? { x: -v.x, y: v.y, b: -(v.bulge || 0) } : { x: v.x, y: v.y, b: v.bulge || 0 })); const o = { type: 'LWPOLYLINE', ...c, pts, closed: !!(e.flag & 512) || !!(e.flag & 1) }; if (e.constantWidth > 0) o.cw_ = e.constantWidth; return o; }
      case 'POLYLINE2D': case 'POLYLINE3D': { const vs = (e.vertices || []).filter((v) => !(v.flag & 16)); return { type: 'LWPOLYLINE', ...c, pts: vs.map((v) => ({ ...fx(v), b: (fl ? -1 : 1) * (v.bulge || 0) })), closed: !!(e.flag & 1) }; }
      case 'TEXT': case 'ATTDEF': case 'ATTRIB': {
        const t = e.type === 'TEXT' ? e : (e.text || e);
        const o = { type: e.type, ...c, p: p2(t.startPoint), h: t.textHeight || 2.5, text: t.text ?? '', rot: t.rotation || 0, wf: t.xScale || 1, style: t.styleName || 'Standard', ha: t.halign || 0, va: t.valign || 0 };
        if (o.ha || o.va) o.p2 = p2(t.endPoint || t.startPoint);
        if (e.type !== 'TEXT') { o.tag = e.tag || e.attrTag || ''; o.invisible = !!(e.flags & 1); o.constant = !!(e.flags & 2); }
        if (e.type === 'ATTDEF') { o.prompt = e.prompt || ''; o.def = o.text; }
        return o;
      }
      case 'MTEXT': {
        let rot = e.rotation || 0; if (e.direction && (e.direction.x || e.direction.y)) rot = Math.atan2(e.direction.y, e.direction.x);
        return { type: 'MTEXT', ...c, p: p2(e.insertionPoint), h: e.textHeight || 2.5, w: e.rectWidth || 0, att: e.attachmentPoint || 1, text: e.text || '', rot, ls: e.lineSpacing || 1 };
      }
      case 'INSERT': {
        let p = p2(e.insertionPoint), rot = e.rotation || 0, sy = e.yScale ?? 1;
        if (fl) { p = { x: -p.x, y: p.y }; rot = Math.PI - rot; sy = -sy; }
        const o = { type: 'INSERT', ...c, name: e.name, p, sx: e.xScale ?? 1, sy, rot };
        if ((e.columnCount || 0) > 1 || (e.rowCount || 0) > 1) { o.cols = Math.max(1, e.columnCount); o.rows = Math.max(1, e.rowCount); o.cs = e.columnSpacing || 0; o.rs = e.rowSpacing || 0; }
        if (e.attribs?.length) o.attribs = e.attribs.map((a) => conv(a, stats)).filter(Boolean);
        return o;
      }
      case 'ELLIPSE': return { type: 'ELLIPSE', ...c, c: p2(e.center), major: p2(e.majorAxisEndPoint), ratio: e.axisRatio || 1, a1: e.startAngle ?? 0, a2: e.endAngle ?? G.TAU };
      case 'SPLINE': { const o = { type: 'SPLINE', ...c, deg: e.degree || 3, knots: e.knots || [], closed: !!(e.flag & 1) }; if (e.weights?.length) o.w = e.weights; if (e.controlPoints?.length) o.cps = e.controlPoints.map(p2); else o.fit = (e.fitPoints || []).map(p2); return o; }
      case 'SOLID': case 'TRACE': return { type: 'SOLID', ...c, pts: [p2(e.corner1), p2(e.corner2), p2(e.corner3), p2(e.corner4 || e.corner3)] };
      case '3DFACE': return { type: 'LWPOLYLINE', ...c, pts: [e.corner1, e.corner2, e.corner3, e.corner4 || e.corner3].map((q) => ({ ...p2(q), b: 0 })), closed: true };
      case 'LEADER': return { type: 'LEADER', ...c, pts: (e.vertices || []).map(p2), arrow: e.isArrowheadEnabled !== false };
      case 'DIMENSION': return { type: 'DIMENSION', ...c, block: e.name, text: e.text || undefined, ip: { p10: p2(e.definitionPoint), m: e.measurement } };
      case 'HATCH': {
        const o = { type: 'HATCH', ...c, pattern: (e.patternName || 'SOLID').toUpperCase(), solid: e.solidFill === 1, loops: [], angle: e.patternAngle || 0, scale: e.patternScale || 1 };
        for (const bp of e.boundaryPaths || []) {
          const loop = [];
          if (bp.vertices) for (const v of bp.vertices) loop.push({ x: v.x, y: v.y, b: v.bulge || 0 });
          else for (const ed of bp.edges || []) {
            if (ed.type === 1) loop.push({ ...p2(ed.start), b: 0 });
            else if (ed.type === 2) { const ccw = ed.isCCW !== false; let a1 = ed.startAngle, a2 = ed.endAngle; if (!ccw) { a1 = -a1; a2 = -a2; } const sw = ccw ? G.arcSweep(a1, a2) : -G.arcSweep(a2, a1); const s = G.polar(p2(ed.center), a1, ed.radius); loop.push({ ...s, b: Math.tan(sw / 4) }); }
            else if (ed.type === 3) { const cc = p2(ed.center), maj = p2(ed.end), ratio = ed.lengthOfMinorAxis; const a = G.len(maj), rot = Math.atan2(maj.y, maj.x); const n = 48; let a1 = ed.startAngle, a2 = ed.endAngle; let sw = a2 - a1; if (sw <= 0) sw += G.TAU; for (let k = 0; k < n; k++) { const t = a1 + sw * k / n; loop.push({ ...G.add(cc, G.rotate({ x: a * Math.cos(t), y: a * ratio * Math.sin(t) }, { x: 0, y: 0 }, rot)), b: 0 }); } }
            else if (ed.type === 4) { const pts = G.splinePoints(ed.degree, (ed.controlPoints || []).map(p2), ed.knots, null, 48); for (const q of pts.slice(0, -1)) loop.push({ ...q, b: 0 }); }
          }
          if (loop.length >= 2) o.loops.push(loop);
        }
        if (!o.solid && e.definitionLines?.length) o.pdef = e.definitionLines.map((d) => ({ a: G.deg(d.angle), o: [d.base.x, d.base.y], d: [d.offset.x, d.offset.y], dash: d.dashLengths || [], world: true }));
        return o.loops.length ? o : null;
      }
      case 'VIEWPORT': { const h = e.height || 0, vh = e.viewHeight || h; return { type: 'VIEWPORT', ...c, vpid: e.viewportId, c: p2(e.viewportCenter || e.center), w: e.width || 0, h, vc: p2(e.viewCenter || e.displayCenter), scale: vh ? h / vh : 1 }; }
      case 'MULTILEADER': { const t = e.contextData?.mtext?.text || e.mtextContent?.text; if (!t) return null; return { type: 'MTEXT', ...c, p: p2(e.contextData?.mtext?.anchorPoint || e.contextData?.contentBasePosition), h: e.contextData?.textHeight || 2.5, text: t, att: 1, w: 0 }; }
      default: stats.unsupported[e.type] = (stats.unsupported[e.type] || 0) + 1; return null;
    }
  } catch (err) { stats.errors = (stats.errors || 0) + 1; return null; }
}

export function fromDatabase(db, name) {
  const doc = new Doc();
  doc.reset(name);
  const stats = { unsupported: {} };
  doc.layers = { '0': newLayer('0') };
  for (const l of db.tables?.LAYER?.entries || []) {
    doc.layers[l.name] = newLayer(l.name, { color: Math.abs(l.colorIndex ?? 7) || 7, on: !l.off && (l.colorIndex ?? 1) >= 0, frozen: !!l.frozen, locked: !!l.locked, ltype: (l.lineType || 'CONTINUOUS').toUpperCase(), lw: l.lineweight != null ? (dwgLw(l.lineweight) < 0 ? -3 : dwgLw(l.lineweight)) : -3, plot: l.plotFlag !== 0 });
  }
  for (const lt of db.tables?.LTYPE?.entries || []) {
    const n = (lt.name || '').toUpperCase(); if (!n || n === 'BYLAYER' || n === 'BYBLOCK') continue;
    doc.ltypes[n] = { desc: lt.description || '', pat: n === 'CONTINUOUS' ? [] : (lt.pattern || []).map((p) => p.elementLength) };
  }
  for (const s of db.tables?.STYLE?.entries || []) doc.styles[s.name] = { name: s.name, font: s.font || 'Arial', h: s.fixedTextHeight || 0, wf: s.widthFactor || 1 };
  const paper = [];
  for (const b of db.tables?.BLOCK_RECORD?.entries || []) {
    const ents = (b.entities || []).map((e) => conv(e, stats)).filter(Boolean).flat();
    if (/^\*Model_Space$/i.test(b.name)) continue;
    if (/^\*Paper_Space$/i.test(b.name)) { paper.push(...ents); continue; }
    if (/^\*Paper_Space\d+$/i.test(b.name)) continue;
    ents.forEach((e, k) => (e.bid = k));
    doc.blocks[b.name] = { name: b.name, base: p2(b.basePoint), ents, params: [], _ver: 1 };
  }
  const model = [];
  const msRec = (db.tables?.BLOCK_RECORD?.entries || []).find((b) => /^\*Model_Space$/i.test(b.name));
  const src = msRec?.entities?.length ? msRec.entities : (db.entities || []);
  for (const e of src) { if (e.type === 'ATTRIB' || e.type === 'VIEWPORT') continue; const x = conv(e, stats); if (!x) continue; if (e.isInPaperSpace) paper.push(x); else model.push(x); }
  doc.model = model;
  doc.layouts = [{ name: layoutBase() + '1', paper: 'A3', w: 420, h: 297, ents: paper.filter((e) => !(e.type === 'VIEWPORT' && e.vpid === 1)) }];
  const lay = (db.objects?.LAYOUT || []).find((l) => l.layoutName && l.layoutName !== 'Model');
  if (lay) doc.layouts[0].name = lay.layoutName;
  for (const e of [...doc.model, ...paper]) if (!doc.layers[e.layer]) doc.ensureLayer(e.layer);
  for (const b of Object.values(doc.blocks)) for (const e of b.ents) if (!doc.layers[e.layer]) doc.ensureLayer(e.layer);
  for (const l of Object.values(doc.layers)) if (!doc.ltypes[l.ltype] && LINETYPES[l.ltype]) doc.ltypes[l.ltype] = LINETYPES[l.ltype];
  const h = db.header || {};
  if (h.LTSCALE) doc.vars.LTSCALE = h.LTSCALE;
  if (h.CLAYER && doc.layers[h.CLAYER]) doc.clayer = h.CLAYER;
  if (h.DIMSCALE) doc.dimstyle.dimscale = h.DIMSCALE;
  doc.fixHandles();
  doc.importStats = stats;
  return doc;
}
