// ActiveX / Visual LISP: modelo de objetos de AutoCAD para rutinas vla-* y vlax-*.
// Application → Document → colecciones (Layers, Blocks, Layouts, TextStyles, Linetypes, DimStyles, Groups,
// Dictionaries, SelectionSets…) → objetos y entidades con sus propiedades y métodos.
// vla-get-X / vla-put-X / vla-Metodo se resuelven dinámicamente, de modo que cualquier propiedad o método
// implementado aquí está disponible con todas sus formas (vla-, vlax-get-property, vlax-get, vlax-invoke…).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { newLayer } from '../core/document.js';
import { newTable } from '../core/table.js';
import { ACI } from '../core/tables.js';

const VT = { EMPTY: 0, NULL: 1, INT: 2, LONG: 3, SINGLE: 4, DOUBLE: 5, CURRENCY: 6, DATE: 7, STRING: 8, OBJECT: 9, BOOL: 11, VARIANT: 12, ARRAY: 8192 };

export class Variant {
  constructor(type, value) { this.type = type; this.value = value; }
  lispType() { return 'VARIANT'; }
  lispShow(show) { return `#<variant ${this.type} ${this.value instanceof SafeArray ? '...' : show(this.value, true)}>`; }
}
export class SafeArray {
  constructor(type, dims, data) { this.type = type; this.dims = dims; this.data = data; }
  get size() { return this.dims.reduce((s, [l, u]) => s * Math.max(0, u - l + 1), 1); }
  lispType() { return 'SAFEARRAY'; }
  lispShow() { return `#<safearray...>`; }
}
class Arr { constructor(type, items) { this.type = type; this.items = items; } }
class Bool { constructor(v) { this.v = !!v; } }

const ENT_IFACE = {
  LINE: 'Line', CIRCLE: 'Circle', ARC: 'Arc', LWPOLYLINE: 'LWPolyline', POINT: 'Point', TEXT: 'Text', MTEXT: 'MText', INSERT: 'BlockReference',
  ELLIPSE: 'Ellipse', SPLINE: 'Spline', HATCH: 'Hatch', SOLID: 'Solid', XLINE: 'XLine', RAY: 'Ray', LEADER: 'Leader', ATTDEF: 'Attribute',
  ATTRIB: 'AttributeReference', VIEWPORT: 'PViewport', WIPEOUT: 'Wipeout', TABLE: 'Table', DUCT: 'Entity',
};
const OBJNAME = {
  LINE: 'AcDbLine', CIRCLE: 'AcDbCircle', ARC: 'AcDbArc', LWPOLYLINE: 'AcDbPolyline', POINT: 'AcDbPoint', TEXT: 'AcDbText', MTEXT: 'AcDbMText',
  INSERT: 'AcDbBlockReference', ELLIPSE: 'AcDbEllipse', SPLINE: 'AcDbSpline', HATCH: 'AcDbHatch', SOLID: 'AcDbTrace', XLINE: 'AcDbXline', RAY: 'AcDbRay',
  LEADER: 'AcDbLeader', ATTDEF: 'AcDbAttributeDefinition', ATTRIB: 'AcDbAttribute', VIEWPORT: 'AcDbViewport', WIPEOUT: 'AcDbWipeout', TABLE: 'AcDbTable', DUCT: 'WebCADDuct',
};
const DIMNAME = { linear: 'RotatedDimension', aligned: 'AlignedDimension', angular: '2LineAngularDimension', radius: 'RadialDimension', diameter: 'DiametricDimension', ordinate: 'OrdinateDimension' };
// alineación de TEXT (AcAlignment) ↔ códigos DXF 72/73
const ALIGN = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [0, 3], [1, 3], [2, 3], [0, 2], [1, 2], [2, 2], [0, 1], [1, 1], [2, 1]];

export const AX_CONSTANTS = {
  'vlax-vbEmpty': 0, 'vlax-vbNull': 1, 'vlax-vbInteger': 2, 'vlax-vbLong': 3, 'vlax-vbSingle': 4, 'vlax-vbDouble': 5, 'vlax-vbCurrency': 6, 'vlax-vbDate': 7,
  'vlax-vbString': 8, 'vlax-vbObject': 9, 'vlax-vbError': 10, 'vlax-vbBoolean': 11, 'vlax-vbVariant': 12, 'vlax-vbDataObject': 13, 'vlax-vbByte': 17, 'vlax-vbArray': 8192,
  acRed: 1, acYellow: 2, acGreen: 3, acCyan: 4, acBlue: 5, acMagenta: 6, acWhite: 7, acByBlock: 0, acByLayer: 256,
  acExtendNone: 0, acExtendThisEntity: 1, acExtendOtherEntity: 2, acExtendBoth: 3,
  acActiveViewport: 0, acAllViewports: 1, acPaperSpace: 0, acModelSpace: 1,
  acAlignmentLeft: 0, acAlignmentCenter: 1, acAlignmentRight: 2, acAlignmentAligned: 3, acAlignmentMiddle: 4, acAlignmentFit: 5,
  acAlignmentTopLeft: 6, acAlignmentTopCenter: 7, acAlignmentTopRight: 8, acAlignmentMiddleLeft: 9, acAlignmentMiddleCenter: 10,
  acAlignmentMiddleRight: 11, acAlignmentBottomLeft: 12, acAlignmentBottomCenter: 13, acAlignmentBottomRight: 14,
  acAttachmentPointTopLeft: 1, acAttachmentPointTopCenter: 2, acAttachmentPointTopRight: 3, acAttachmentPointMiddleLeft: 4,
  acAttachmentPointMiddleCenter: 5, acAttachmentPointMiddleRight: 6, acAttachmentPointBottomLeft: 7, acAttachmentPointBottomCenter: 8, acAttachmentPointBottomRight: 9,
  acSelectionSetWindow: 0, acSelectionSetCrossing: 1, acSelectionSetFence: 2, acSelectionSetPrevious: 3, acSelectionSetLast: 4, acSelectionSetAll: 5,
  acSelectionSetWindowPolygon: 6, acSelectionSetCrossingPolygon: 7,
  acHatchPatternTypeUserDefined: 0, acHatchPatternTypePreDefined: 1, acHatchPatternTypeCustomDefined: 2, acHatchStyleNormal: 0, acHatchStyleOuter: 1, acHatchStyleIgnore: 2,
  acAttributeModeNormal: 0, acAttributeModeInvisible: 1, acAttributeModeConstant: 2, acAttributeModeVerify: 4, acAttributeModePreset: 8, acAttributeModeLockPosition: 16,
  acLnWtByLayer: -1, acLnWtByBlock: -2, acLnWtByLwDefault: -3, acLnWt000: 0, acLnWt005: 5, acLnWt009: 9, acLnWt013: 13, acLnWt015: 15, acLnWt018: 18, acLnWt020: 20,
  acLnWt025: 25, acLnWt030: 30, acLnWt035: 35, acLnWt040: 40, acLnWt050: 50, acLnWt053: 53, acLnWt060: 60, acLnWt070: 70, acLnWt080: 80, acLnWt090: 90,
  acLnWt100: 100, acLnWt106: 106, acLnWt120: 120, acLnWt140: 140, acLnWt158: 158, acLnWt200: 200, acLnWt211: 211,
  acColorMethodByLayer: 192, acColorMethodByBlock: 193, acColorMethodByRGB: 194, acColorMethodByACI: 195, acColorMethodForeground: 197,
  acZoomScaledAbsolute: 0, acZoomScaledRelative: 1, acZoomScaledRelativePSpace: 2,
  acLeaderLine: 0, acLeaderLineWithArrow: 2, acLeaderSpline: 1, acLeaderSplineWithArrow: 3,
  acSimpleMesh: 0, acNative: 0, acR12_dxf: 1, ac2000_dxf: 12, ac2018_dxf: 64, ac2018_dwg: 64,
  acUnitless: 0, acInches: 1, acFeet: 2, acMillimeters: 4, acCentimeters: 5, acMeters: 6,
  acOn: 1, acOff: 0, acTrue: 1, acFalse: 0,
  acScientific: 1, acDecimal: 2, acEngineering: 3, acArchitectural: 4, acFractional: 5, acDegrees: 0, acDegreeMinuteSeconds: 1, acGrads: 2, acRadians: 3,
};

export function installActiveX(L_, K) {
  const { sym, T, Real, Pair, Ename, PickSet, VlaObj, LispError, show, read } = K;
  const R = (v) => new Real(v);
  const isNum = (x) => typeof x === 'number' || x instanceof Real;
  const num = (x) => { if (x instanceof Variant) x = x.value; if (typeof x === 'number') return x; if (x instanceof Real) return x.v; if (x === T) return 1; throw new LispError('bad argument type: numberp: ' + show(x)); };
  const int = (x) => Math.trunc(num(x));
  const str = (x) => { if (x instanceof Variant) x = x.value; if (x == null) return ''; if (typeof x === 'string') return x; if (isNum(x)) return String(num(x)); throw new LispError('bad argument type: stringp ' + show(x)); };
  const L = (a) => (a && a.length ? a : null);
  const VTRUE = sym(':VLAX-TRUE'), VFALSE = sym(':VLAX-FALSE'), VNULL = sym(':VLAX-NULL');
  const doc = () => L_.doc, app = () => L_.app;
  const redraw = () => app().view?.redraw?.();
  const err = (m) => { throw new LispError('Automation Error. ' + m); };
  const notFound = () => err('Key not found');
  const ci = (o, n) => { n = String(n).toUpperCase(); return Object.keys(o).find((k) => k.toUpperCase() === n); };

  // ---------- caché de objetos (eq/equal funcionan entre llamadas)
  const objCache = new WeakMap(), keyCache = new Map();
  const O = (kind, ref) => {
    if (ref && typeof ref === 'object') { let m = objCache.get(ref); if (!m) objCache.set(ref, (m = {})); return (m[kind] ||= new VlaObj(kind, ref)); }
    const k = kind + '\u0001' + String(ref ?? '').toUpperCase(); let o = keyCache.get(k); if (!o) keyCache.set(k, (o = new VlaObj(kind, ref))); return o;
  };
  const ent = (e) => O('ent', e);
  const parentOf = new WeakMap(); // atributo → referencia de bloque

  // ---------- conversión de valores
  const flat = (v) => {
    if (v instanceof Variant) return flat(v.value);
    if (v instanceof SafeArray) return v.data.flat(Infinity);
    if (Array.isArray(v)) return v.flatMap((x) => (Array.isArray(x) || x instanceof SafeArray || x instanceof Variant ? flat(x) : [x]));
    if (v instanceof PickSet) return v.items.map(ent);
    return v == null ? [] : [v];
  };
  const pt = (v) => { const a = flat(v); if (a.length < 2) throw new LispError('bad argument type: point ' + show(v)); return { x: num(a[0]), y: num(a[1]) }; };
  const pts2 = (v, stride) => { const a = flat(v).map(num), out = []; for (let i = 0; i + stride - 1 < a.length; i += stride) out.push({ x: a[i], y: a[i + 1] }); return out; };
  const bool = (v) => { if (v instanceof Variant) v = v.value; if (v === VFALSE || v == null || v === false) return false; if (isNum(v)) return num(v) !== 0; return true; };
  const entOf = (o) => { if (o instanceof VlaObj && o.kind === 'ent') return o.ref; if (o instanceof Ename && o.e) return o.e; throw new LispError('bad argument type: VLA-OBJECT ' + show(o)); };
  const objs = (v) => flat(v).filter((x) => x instanceof VlaObj || x instanceof Ename).map(entOf);
  const P3 = (p) => new Arr(VT.DOUBLE, [R(p.x), R(p.y), R(p.z || 0)]);
  const vtOf = (x) => (x == null ? VT.EMPTY : typeof x === 'number' ? VT.LONG : x instanceof Real ? VT.DOUBLE : typeof x === 'string' ? VT.STRING : x instanceof VlaObj ? VT.OBJECT : x === T || x === VTRUE || x === VFALSE ? VT.BOOL : x instanceof SafeArray ? VT.ARRAY | x.type : VT.VARIANT);
  const mkSA = (type, items) => new SafeArray(type, [[0, items.length - 1]], items);
  const out = (v, listMode) => {
    if (v === undefined) return null;
    if (v instanceof Arr) { const items = v.items.map((x) => out(x, listMode)); return listMode ? L(items) : new Variant(VT.ARRAY | v.type, mkSA(v.type, items)); }
    if (v instanceof Bool) return listMode ? (v.v ? -1 : 0) : v.v ? VTRUE : VFALSE;
    if (listMode && v instanceof Variant) return out(fromVariant(v), true);
    return v;
  };
  const fromVariant = (v) => { if (v instanceof Variant) v = v.value; if (v instanceof SafeArray) return saList(v); return v; };
  const saList = (sa) => {
    if (sa.dims.length <= 1) return L(sa.data.slice());
    const [l1, u1] = sa.dims[0], n2 = sa.dims[1][1] - sa.dims[1][0] + 1, rows = [];
    for (let i = 0; i <= u1 - l1; i++) rows.push(L(sa.data.slice(i * n2, (i + 1) * n2)));
    return L(rows);
  };
  const deflt = (type) => (type === VT.DOUBLE || type === VT.SINGLE ? R(0) : type === VT.STRING ? '' : type === VT.INT || type === VT.LONG || type === 17 ? 0 : type === VT.BOOL ? VFALSE : null);
  const coerce = (type, v) => {
    if (v instanceof Variant && type !== VT.VARIANT) v = v.value;
    switch (type) {
      case VT.DOUBLE: case VT.SINGLE: return R(num(v));
      case VT.INT: case VT.LONG: case 17: return int(v);
      case VT.STRING: return typeof v === 'string' ? v : show(v, true);
      case VT.BOOL: return bool(v) ? VTRUE : VFALSE;
      default: return v;
    }
  };
  const nearestAci = (hex) => { const n = parseInt(String(hex).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; let best = 7, bd = Infinity; for (let i = 1; i < 256; i++) { const c = ACI[i]; if (!c) continue; const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = i; } } return best; };
  const aciOf = (c) => (c == null ? 256 : typeof c === 'string' ? nearestAci(c) : c);
  const LTYPE = (lt) => (!lt || /^bylayer$/i.test(lt) ? 'ByLayer' : /^byblock$/i.test(lt) ? 'ByBlock' : /^continuous$/i.test(lt) ? 'Continuous' : lt);

  // ---------- espacios y bloques
  const paperName = (i) => (i === 0 ? '*Paper_Space' : '*Paper_Space' + (i - 1));
  const blkEnts = (name) => {
    const d = doc(), n = String(name).toUpperCase();
    if (n === '*MODEL_SPACE') return d.model;
    if (n.startsWith('*PAPER_SPACE')) { const i = n === '*PAPER_SPACE' ? (d.active !== 'Model' ? Math.max(0, d.layouts.indexOf(d.layout)) : 0) : 1 + parseInt(n.slice(12), 10); return d.layouts[i]?.ents ?? notFound(); }
    const k = ci(d.blocks, name); return k ? d.blocks[k].ents : notFound();
  };
  const blkDef = (name) => { const k = ci(doc().blocks, name); return k ? doc().blocks[k] : null; };
  const isSpace = (name) => String(name).startsWith('*') && /^\*(MODEL|PAPER)_SPACE/i.test(name);
  const spaceObj = (arr) => { const d = doc(); if (arr === d.model) return O('blk', '*Model_Space'); const i = d.layouts.findIndex((l) => l.ents === arr); if (i >= 0) return O('blk', paperName(i)); const b = Object.values(d.blocks).find((x) => x.ents === arr); return b ? O('blk', b.name) : null; };
  const touchBlock = (name) => { const b = blkDef(name); if (!b) return; b._ver = (b._ver || 0) + 1; for (const e of doc().allEnts()) if (e.type === 'INSERT' && e.name.toUpperCase() === b.name.toUpperCase()) E.invalidate(e); };
  // añade una entidad nueva a un espacio o a una definición de bloque
  const addTo = (blkName, e) => {
    const d = doc();
    if (isSpace(blkName)) { d.add(e, blkEnts(blkName)); }
    else { const b = blkDef(blkName) || notFound(); d.touchTables(); d.stamp(e); e.bid = b.ents.length ? Math.max(...b.ents.map((x) => x.bid ?? 0)) + 1 : 0; b.ents.push(e); touchBlock(b.name); }
    E.invalidate(e); redraw(); return ent(e);
  };
  const ownerArr = (e) => doc().ownerOf(e);
  const touch = (e) => { const p = parentOf.get(e); const d = doc(); const arr = ownerArr(p || e); if (arr && (arr === d.model || d.layouts.some((l) => l.ents === arr))) d.touch(p || e); else if (arr) { d.touchTables(); const b = Object.values(d.blocks).find((x) => x.ents === arr); if (b) touchBlock(b.name); } E.invalidate(e); if (p) E.invalidate(p); };
  const done = (e) => { E.invalidate(e); const p = parentOf.get(e); if (p) E.invalidate(p); redraw(); };
  const copyInto = (e, c) => { delete c.hid; delete c.bid; const arr = ownerArr(e) || doc().space; const so = spaceObj(arr); return so ? addTo(so.ref, c) : (doc().add(c, arr), ent(c)); };

  // ---------- colecciones
  const ssets = new Map();
  const COLL = {
    DOCUMENTS: { iface: 'Documents', names: () => [doc().name], item: () => O('doc', 'ACTIVE') },
    LAYERS: { iface: 'Layers', names: () => Object.keys(doc().layers), item: (k) => O('layer', k), key: (n) => ci(doc().layers, n),
      add: (n) => { n = str(n); const d = doc(); const k = ci(d.layers, n); if (!k) { d.touchTables(); d.layers[n] = newLayer(n); d.emit('layers'); } return O('layer', k || n); } },
    BLOCKS: { iface: 'Blocks', names: () => ['*Model_Space', ...doc().layouts.map((l, i) => paperName(i)), ...Object.keys(doc().blocks)], item: (k) => O('blk', k),
      key: (n) => { const u = String(n).toUpperCase(); if (u === '*MODEL_SPACE') return '*Model_Space'; if (u.startsWith('*PAPER_SPACE')) return paperName(u === '*PAPER_SPACE' ? 0 : 1 + parseInt(u.slice(12), 10)); return ci(doc().blocks, n); },
      add: (p, n) => { n = str(n); const d = doc(); const k = ci(d.blocks, n); if (!k) { d.touchTables(); d.blocks[n] = { name: n, base: pt(p), ents: [], params: [], _ver: 1 }; } else if (!d.blocks[k].ents.length) d.blocks[k].base = pt(p); return O('blk', k || n); } },
    LAYOUTS: { iface: 'Layouts', names: () => ['Model', ...doc().layouts.map((l) => l.name)], item: (k) => O('layout', k), key: (n) => (String(n).toUpperCase() === 'MODEL' ? 'Model' : doc().layouts.find((l) => l.name.toUpperCase() === String(n).toUpperCase())?.name),
      add: (n) => { n = str(n); const d = doc(); if (!d.layouts.some((l) => l.name.toUpperCase() === n.toUpperCase())) { d.touchTables(); d.layouts.push({ name: n, paper: 'A3', w: 420, h: 297, ents: [] }); app().ui?.refresh?.(); } return O('layout', n); } },
    TEXTSTYLES: { iface: 'TextStyles', names: () => Object.keys(doc().styles), item: (k) => O('style', k), key: (n) => ci(doc().styles, n),
      add: (n) => { n = str(n); const d = doc(); const k = ci(d.styles, n); if (!k) { d.touchTables(); d.styles[n] = { name: n, font: 'Arial', h: 0, wf: 1 }; } return O('style', k || n); } },
    LINETYPES: { iface: 'Linetypes', names: () => ['ByBlock', 'ByLayer', ...Object.keys(doc().ltypes)], item: (k) => O('ltype', k), key: (n) => (/^by(layer|block)$/i.test(n) ? LTYPE(n) : ci(doc().ltypes, n)),
      add: (n) => O('ltype', COLL.LINETYPES.key(n) || err('Linetype not found')) },
    DIMSTYLES: { iface: 'DimStyles', names: () => [doc().vars.DIMSTYLE || 'ISO-25'], item: (k) => O('dimstyle', k), key: (n) => (String(n).toUpperCase() === String(doc().vars.DIMSTYLE || 'ISO-25').toUpperCase() ? doc().vars.DIMSTYLE || 'ISO-25' : null), add: (n) => O('dimstyle', str(n)) },
    GROUPS: { iface: 'Groups', names: () => Object.keys(doc().groups), item: (k) => O('group', k), key: (n) => ci(doc().groups, n),
      add: (n) => { n = str(n); const d = doc(); const k = ci(d.groups, n); if (!k) { d.touchTables(); d.groups[n] = { desc: '', selectable: true, hids: [] }; } return O('group', k || n); } },
    DICTIONARIES: { iface: 'Dictionaries', names: () => Object.keys(dicts()), item: (k) => O('dict', dicts()[k]), key: (n) => ci(dicts(), n),
      add: (n) => { n = str(n); const D = dicts(); const k = ci(D, n); if (!k) D[n] = newDict(); return O('dict', D[k || n]); } },
    VIEWS: { iface: 'Views', names: () => Object.keys(doc().views), item: (k) => O('view', k), key: (n) => ci(doc().views, n),
      add: (n) => { n = str(n); const v = app().view.cur; doc().views[n] = { cx: v.cx, cy: v.cy, s: v.s }; return O('view', n); } },
    REGISTEREDAPPLICATIONS: { iface: 'RegisteredApplications', names: () => ['ACAD', ...Object.keys(doc().regapps || {})], item: (k) => O('regapp', k), key: (n) => (String(n).toUpperCase() === 'ACAD' ? 'ACAD' : ci(doc().regapps || {}, n)),
      add: (n) => { n = str(n).toUpperCase(); (doc().regapps ||= {})[n] = 1; return O('regapp', n); } },
    SELECTIONSETS: { iface: 'SelectionSets', names: () => [...ssets.keys()], item: (k) => O('ss', ssets.get(k)), key: (n) => [...ssets.keys()].find((k) => k.toUpperCase() === String(n).toUpperCase()),
      add: (n) => { n = str(n); if (COLL.SELECTIONSETS.key(n)) err('Duplicate record name'); const s = { name: n, items: [] }; ssets.set(n, s); return O('ss', s); } },
    HYPERLINKS: { iface: 'Hyperlinks', names: () => [], item: notFound, key: () => null },
    MENUGROUPS: { iface: 'MenuGroups', names: () => ['ACAD'], item: () => O('bag', 'MENUGROUP'), key: (n) => (String(n).toUpperCase() === 'ACAD' ? 'ACAD' : null) },
    VIEWPORTS: { iface: 'Viewports', names: () => ['*Active'], item: () => O('bag', 'VIEWPORT'), key: (n) => (String(n).toUpperCase() === '*ACTIVE' ? '*Active' : null) },
    UCSS: { iface: 'UCSs', names: () => [], item: notFound, key: () => null },
    MATERIALS: { iface: 'Materials', names: () => ['ByLayer', 'ByBlock', 'Global'], item: (k) => O('bag', 'MAT:' + k), key: (n) => ['ByLayer', 'ByBlock', 'Global'].find((k) => k.toUpperCase() === String(n).toUpperCase()) },
    PLOTCONFIGURATIONS: { iface: 'PlotConfigurations', names: () => [], item: notFound, key: () => null },
  };
  const collItem = (c, idx) => {
    const C = COLL[c];
    if (isNum(idx) || (idx instanceof Variant && isNum(idx.value))) { const n = C.names()[int(idx)]; if (n == null) err('Invalid index'); return C.item(n); }
    const k = C.key(str(idx)); if (k == null) notFound(); return C.item(k);
  };
  const collItems = (c) => COLL[c].names().map((n) => C_item(c, n)).filter(Boolean);
  const C_item = (c, n) => { try { return COLL[c].item(n); } catch (_) { return null; } };

  // ---------- diccionarios (namedobjdict, xrecords, ldata)
  const newDict = () => ({ type: 'DICTIONARY', items: {} });
  const dicts = () => { const d = doc(); d.dicts ||= {}; return d.dicts; };
  const xdictOf = (e, create) => { if (!e.xdict && create) e.xdict = newDict(); return e.xdict || null; };
  // datos LISP serializados (persisten en .wcad)
  const ser = (v) => show(v);
  const deser = (s) => { try { const r = read(s); return r.length ? r[0] : null; } catch (_) { return null; } };

  // ---------- propiedades por clase
  const common = (o, P) => {
    if (P === 'APPLICATION') return O('acad', 'APP');
    if (P === 'DOCUMENT' || P === 'DATABASE') return O('doc', 'ACTIVE');
    return undefined;
  };
  const KIND = {};
  KIND.acad = {
    iface: () => 'Application',
    get(_, P) {
      switch (P) {
        case 'ACTIVEDOCUMENT': return O('doc', 'ACTIVE');
        case 'DOCUMENTS': return O('coll', 'DOCUMENTS');
        case 'NAME': return 'WebCAD';
        case 'CAPTION': return 'WebCAD - [' + doc().name + ']';
        case 'VERSION': return '24.2s (WebCAD)';
        case 'FULLNAME': return 'WebCAD';
        case 'PATH': return '';
        case 'PREFERENCES': return O('prefs', 'PREFS');
        case 'VISIBLE': return new Bool(true);
        case 'WINDOWSTATE': return 3;
        case 'MENUGROUPS': return O('coll', 'MENUGROUPS');
        case 'MENUBAR': return O('bag', 'MENUBAR');
        case 'STATUSID': return new Bool(true);
        case 'HWND': case 'HWND32': return 1;
        case 'LOCALEID': return 1034;
      }
      return undefined;
    },
    put(_, P) { return ['VISIBLE', 'WINDOWSTATE', 'WINDOWLEFT', 'WINDOWTOP', 'WIDTH', 'HEIGHT'].includes(P); },
    async call(_, M, a) {
      switch (M) {
        case 'ZOOMEXTENTS': case 'ZOOMALL': app().view.zoomExtents(); redraw(); return null;
        case 'ZOOMWINDOW': { const p = pt(a[0]), q = pt(a[1]); app().view.zoomWindow({ x1: Math.min(p.x, q.x), y1: Math.min(p.y, q.y), x2: Math.max(p.x, q.x), y2: Math.max(p.y, q.y) }); redraw(); return null; }
        case 'ZOOMCENTER': { const c = pt(a[0]), h = num(a[1]); const v = app().view; v.setCur({ cx: c.x, cy: c.y, s: v.H / h }); redraw(); return null; }
        case 'ZOOMSCALED': { const v = app().view; v.setCur({ ...v.cur, s: v.cur.s * num(a[0]) }); redraw(); return null; }
        case 'ZOOMPREVIOUS': case 'ZOOMPICKWINDOW': case 'UPDATE': case 'LOADARX': case 'UNLOADARX': case 'LOADDVB': case 'UNLOADDVB': case 'QUIT': return null;
        case 'LISTARX': return new Arr(VT.STRING, []);
        case 'EVAL': return null;
        case 'GETINTERFACEOBJECT': { const n = str(a[0]).toUpperCase(); if (n.startsWith('AUTOCAD.ACCMCOLOR')) return O('color', { aci: 7 }); err('Problem in loading application'); }
        case 'GETACADSTATE': return O('bag', 'STATE');
      }
      return undefined;
    },
  };
  KIND.doc = {
    iface: () => 'Document',
    get(_, P) {
      const d = doc();
      switch (P) {
        case 'MODELSPACE': return O('blk', '*Model_Space');
        case 'PAPERSPACE': return O('blk', '*Paper_Space');
        case 'LAYERS': case 'BLOCKS': case 'LAYOUTS': case 'TEXTSTYLES': case 'LINETYPES': case 'DIMSTYLES': case 'GROUPS': case 'DICTIONARIES': case 'VIEWS':
        case 'REGISTEREDAPPLICATIONS': case 'SELECTIONSETS': case 'VIEWPORTS': case 'UCSS': case 'MATERIALS': case 'PLOTCONFIGURATIONS': return O('coll', P);
        case 'ACTIVELAYER': return O('layer', d.clayer);
        case 'ACTIVELAYOUT': return O('layout', d.active);
        case 'ACTIVESPACE': return d.paperMode ? 0 : 1;
        case 'MSPACE': return new Bool(!!d.mspace);
        case 'ACTIVETEXTSTYLE': return O('style', ci(d.styles, d.vars.TEXTSTYLE) || 'Standard');
        case 'ACTIVELINETYPE': return O('ltype', LTYPE(d.vars.CELTYPE));
        case 'ACTIVEDIMSTYLE': return O('dimstyle', d.vars.DIMSTYLE || 'ISO-25');
        case 'ACTIVEVIEWPORT': return O('bag', 'VIEWPORT');
        case 'ACTIVESELECTIONSET': return O('ss', { name: '$ACTIVE', items: (L_._activeSS || []).slice() });
        case 'PICKFIRSTSELECTIONSET': return O('ss', { name: 'PICKFIRST', items: (L_.eng?.sel || []).slice() });
        case 'NAME': return d.name;
        case 'FULLNAME': return (d.path || '') + d.name;
        case 'PATH': return d.path || '';
        case 'SAVED': return new Bool(!d.modified);
        case 'READONLY': return new Bool(false);
        case 'ACTIVE': return new Bool(true);
        case 'UTILITY': return O('util', 'UTIL');
        case 'SUMMARYINFO': return O('summary', 'SUMMARY');
        case 'OBJECTSNAPMODE': return new Bool(true);
        case 'HEIGHT': return app().view?.H ?? 600;
        case 'WIDTH': return app().view?.W ?? 800;
        case 'WINDOWTITLE': return d.name;
        case 'PLOT': return O('bag', 'PLOT');
        case 'HWND': return 1;
      }
      return undefined;
    },
    put(_, P, v) {
      const d = doc();
      switch (P) {
        case 'ACTIVELAYER': { const n = v instanceof VlaObj ? v.ref : str(v); d.setvar('CLAYER', ci(d.layers, n) || n); app().ui?.refresh?.(); return true; }
        case 'ACTIVELAYOUT': { const n = v instanceof VlaObj ? v.ref : str(v); app().setLayout ? app().setLayout(COLL.LAYOUTS.key(n) || notFound()) : (d.active = n); return true; }
        case 'ACTIVESPACE': { if (num(v) === 1 && d.active !== 'Model' && app().setLayout) app().setLayout('Model'); return true; }
        case 'ACTIVETEXTSTYLE': d.setvar('TEXTSTYLE', v instanceof VlaObj ? v.ref : str(v)); return true;
        case 'ACTIVELINETYPE': d.setvar('CELTYPE', String(v instanceof VlaObj ? v.ref : str(v)).toUpperCase()); return true;
        case 'ACTIVEDIMSTYLE': return true;
        case 'MSPACE': case 'OBJECTSNAPMODE': case 'WINDOWSTATE': case 'ACTIVEVIEWPORT': case 'ACTIVEUCS': return true;
      }
      return false;
    },
    async call(_, M, a) {
      const d = doc();
      switch (M) {
        case 'GETVARIABLE': { const f = L_.g.get('GETVAR'); return f.call(L_, [str(a[0])]); }
        case 'SETVARIABLE': { const f = L_.g.get('SETVAR'); f.call(L_, [str(a[0]), a[1] instanceof Variant ? fromVariant(a[1]) : a[1]]); return null; }
        case 'SENDCOMMAND': await sendCommand(str(a[0])); return null;
        case 'POSTCOMMAND': setTimeout(() => sendCommand(str(a[0])), 0); return null;
        case 'STARTUNDOMARK': d.begin('LISP'); return null;
        case 'ENDUNDOMARK': if (d.tx) d.end(); return null;
        case 'REGEN': for (const e of d.allEnts()) E.invalidate(e); redraw(); return null;
        case 'HANDLETOOBJECT': { const e = d.findHandle(str(a[0])); if (!e) err('Invalid object ID'); return ent(e); }
        case 'OBJECTIDTOOBJECT': case 'OBJECTIDTOOBJECT32': { const e = d.findHandle(int(a[0]).toString(16)); if (!e) err('Invalid object ID'); return ent(e); }
        case 'PURGEALL': { const used = new Set(); for (const e of d.allEntsDeep()) { if (e.type === 'INSERT') used.add(e.name); used.add(e.layer); } d.touchTables(); for (const n of Object.keys(d.blocks)) if (!used.has(n) && !d.blocks[n].xref) delete d.blocks[n]; for (const n of Object.keys(d.layers)) if (!used.has(n) && n !== '0' && n !== 'Defpoints' && n !== d.clayer) delete d.layers[n]; d.emit('layers'); return null; }
        case 'SAVE': app().io?.save?.(); return null;
        case 'SAVEAS': case 'EXPORT': case 'WBLOCK': case 'AUDITINFO': case 'ACTIVATE': case 'CLOSE': case 'LOADSHAPEFILE': case 'SETPROPERTYVALUE': return null;
        case 'GETACTIVE': return O('doc', 'ACTIVE');
        case 'EVALUATE': return null;
      }
      return undefined;
    },
  };
  KIND.coll = {
    iface: (c) => COLL[c].iface,
    get(c, P) {
      if (P === 'COUNT') return COLL[c].names().length;
      if (P === 'OBJECTNAME') return 'AcDb' + ({ LAYERS: 'LayerTable', BLOCKS: 'BlockTable', TEXTSTYLES: 'TextStyleTable', LINETYPES: 'LinetypeTable', DIMSTYLES: 'DimStyleTable', DICTIONARIES: 'Dictionary', LAYOUTS: 'Dictionary', GROUPS: 'Dictionary', VIEWS: 'ViewTable', REGISTEREDAPPLICATIONS: 'RegAppTable' }[c] || 'Object');
      return undefined;
    },
    put: () => false,
    async call(c, M, a) {
      const C = COLL[c];
      switch (M) {
        case 'ITEM': return collItem(c, a[0]);
        case 'ADD': if (!C.add) err('Not implemented'); return c === 'BLOCKS' ? C.add(a[0], a[1]) : C.add(a[0]);
        case 'REMOVE': { const o = collItem(c, a[0]); await invoke(o, 'DELETE', []); return null; }
        case 'GETNAME': return a[0] instanceof VlaObj ? getProp(a[0], 'NAME') : null;
        case 'RENAME': { const o = collItem(c, a[0]); putProp(o, 'NAME', a[1]); return null; }
        case 'GENERATEUSAGEDATA': return null;
        case 'ADDXRECORD': return undefined;
      }
      return undefined;
    },
  };
  const layerRef = (n) => { const d = doc(), k = ci(d.layers, n); return k ? d.layers[k] : notFound(); };
  KIND.layer = {
    iface: () => 'Layer',
    get(n, P) {
      const l = layerRef(n);
      switch (P) {
        case 'NAME': return l.name;
        case 'COLOR': return aciOf(l.color);
        case 'TRUECOLOR': return O('color', typeof l.color === 'string' ? { aci: nearestAci(l.color), rgb: l.color } : { aci: l.color });
        case 'LINETYPE': return LTYPE(l.ltype);
        case 'LINEWEIGHT': return l.lw ?? -3;
        case 'LAYERON': return new Bool(l.on);
        case 'FREEZE': return new Bool(l.frozen);
        case 'LOCK': return new Bool(l.locked);
        case 'PLOTTABLE': return new Bool(l.plot !== false);
        case 'DESCRIPTION': return l.desc || '';
        case 'VIEWPORTDEFAULT': return new Bool(false);
        case 'USED': { for (const e of doc().allEntsDeep()) if (e.layer === l.name) return new Bool(true); return new Bool(l.name === doc().clayer || l.name === '0'); }
        case 'OBJECTNAME': return 'AcDbLayerTableRecord';
        case 'HANDLE': return 'L' + l.name;
        case 'PLOTSTYLENAME': return 'Normal';
        case 'TRANSPARENCY': return l.transp ?? 0;
        case 'MATERIAL': return 'Global';
        case 'HASEXTENSIONDICTIONARY': return new Bool(false);
      }
      return undefined;
    },
    put(n, P, v) {
      const d = doc(), l = layerRef(n);
      d.touchTables();
      switch (P) {
        case 'NAME': { const nn = str(v); if (ci(d.layers, nn) && ci(d.layers, nn) !== l.name) err('Duplicate record name'); if (l.name === '0') err('Invalid input'); const old = l.name; delete d.layers[old]; l.name = nn; d.layers[nn] = l; for (const e of d.allEntsDeep()) if (e.layer === old) { e.layer = nn; E.invalidate(e); } if (d.clayer === old) d.clayer = nn; break; }
        case 'COLOR': l.color = Math.abs(num(v)) || 7; break;
        case 'TRUECOLOR': { const c = v.ref; l.color = c.rgb || c.aci || 7; break; }
        case 'LINETYPE': { const k = COLL.LINETYPES.key(str(v)); if (!k) err('Key not found'); l.ltype = k.toUpperCase(); break; }
        case 'LINEWEIGHT': l.lw = num(v); break;
        case 'LAYERON': l.on = bool(v); break;
        case 'FREEZE': if (l.name === d.clayer && bool(v)) err('Invalid layer'); l.frozen = bool(v); break;
        case 'LOCK': l.locked = bool(v); break;
        case 'PLOTTABLE': l.plot = bool(v); break;
        case 'DESCRIPTION': l.desc = str(v); break;
        case 'TRANSPARENCY': l.transp = num(v); break;
        case 'PLOTSTYLENAME': case 'VIEWPORTDEFAULT': case 'MATERIAL': break;
        default: return false;
      }
      d.emit('layers'); for (const e of d.allEnts()) if (e.type === 'INSERT') E.invalidate(e); redraw(); return true;
    },
    async call(n, M) {
      if (M === 'DELETE') { const d = doc(), l = layerRef(n); if (l.name === '0' || l.name === 'Defpoints' || l.name === d.clayer) err('Object is referenced'); for (const e of d.allEntsDeep()) if (e.layer === l.name) err('Object is referenced'); d.touchTables(); delete d.layers[l.name]; d.emit('layers'); return null; }
      if (M === 'GETEXTENSIONDICTIONARY') return O('dict', xdictOf(layerRef(n), true));
      return undefined;
    },
  };
  KIND.blk = {
    iface: (n) => (/^\*MODEL_SPACE$/i.test(n) ? 'ModelSpace' : /^\*PAPER_SPACE$/i.test(n) ? 'PaperSpace' : 'Block'),
    get(n, P) {
      const b = isSpace(n) ? null : blkDef(n) || notFound();
      switch (P) {
        case 'NAME': return isSpace(n) ? n : b.name;
        case 'COUNT': return blkEnts(n).length;
        case 'ORIGIN': return P3(b ? b.base : { x: 0, y: 0 });
        case 'ISLAYOUT': return new Bool(isSpace(n));
        case 'ISXREF': return new Bool(!!b?.xref);
        case 'ISDYNAMICBLOCK': return new Bool(!!b?.params?.length);
        case 'ISANONYMOUS': return new Bool(!!b?.name.startsWith('*'));
        case 'EXPLODABLE': return new Bool(b?.explodable !== false);
        case 'BLOCKSCALING': return 0;
        case 'UNITS': return 4;
        case 'COMMENTS': return b?.desc || '';
        case 'PATH': return b?.xref?.path || '';
        case 'LAYOUT': { if (/^\*MODEL_SPACE$/i.test(n)) return O('layout', 'Model'); if (isSpace(n)) { const arr = blkEnts(n); const l = doc().layouts.find((x) => x.ents === arr); return O('layout', l.name); } return notFound(); }
        case 'OBJECTNAME': return 'AcDbBlockTableRecord';
        case 'HANDLE': return 'B' + (b ? b.name : n);
        case 'HASEXTENSIONDICTIONARY': return new Bool(false);
      }
      return undefined;
    },
    put(n, P, v) {
      const d = doc(), b = isSpace(n) ? err('Invalid input') : blkDef(n) || notFound();
      d.touchTables();
      switch (P) {
        case 'NAME': { const nn = str(v), old = b.name; if (ci(d.blocks, nn)) err('Duplicate record name'); delete d.blocks[old]; b.name = nn; d.blocks[nn] = b; for (const e of d.allEntsDeep()) if (e.type === 'INSERT' && e.name === old) { e.name = nn; E.invalidate(e); } keyCache.delete('blk\u0001' + old.toUpperCase()); break; }
        case 'ORIGIN': b.base = pt(v); touchBlock(b.name); break;
        case 'COMMENTS': b.desc = str(v); break;
        case 'EXPLODABLE': b.explodable = bool(v); break;
        case 'BLOCKSCALING': case 'UNITS': break;
        default: return false;
      }
      redraw(); return true;
    },
    async call(n, M, a) {
      const add = (e) => addTo(n, e);
      switch (M) {
        case 'ITEM': { const e = blkEnts(n)[int(a[0])]; if (!e) err('Invalid index'); return ent(e); }
        case 'DELETE': { if (isSpace(n)) err('Invalid input'); const d = doc(), b = blkDef(n) || notFound(); for (const e of d.allEntsDeep()) if (e.type === 'INSERT' && e.name === b.name) err('Object is referenced'); d.touchTables(); delete d.blocks[b.name]; return null; }
        case 'ADDLINE': return add({ type: 'LINE', p1: pt(a[0]), p2: pt(a[1]) });
        case 'ADDCIRCLE': return add({ type: 'CIRCLE', c: pt(a[0]), r: num(a[1]) });
        case 'ADDARC': return add({ type: 'ARC', c: pt(a[0]), r: num(a[1]), a1: num(a[2]), a2: num(a[3]) });
        case 'ADDLIGHTWEIGHTPOLYLINE': return add({ type: 'LWPOLYLINE', pts: pts2(a[0], 2).map((p) => ({ ...p, b: 0 })), closed: false });
        case 'ADDPOLYLINE': case 'ADD3DPOLY': return add({ type: 'LWPOLYLINE', pts: pts2(a[0], 3).map((p) => ({ ...p, b: 0 })), closed: false });
        case 'ADDPOINT': return add({ type: 'POINT', p: pt(a[0]) });
        case 'ADDTEXT': return add({ type: 'TEXT', text: str(a[0]), p: pt(a[1]), h: num(a[2]), rot: 0, style: doc().vars.TEXTSTYLE });
        case 'ADDMTEXT': return add({ type: 'MTEXT', p: pt(a[0]), w: num(a[1]), text: str(a[2]), h: doc().vars.TEXTSIZE, att: 1, rot: 0, style: doc().vars.TEXTSTYLE });
        case 'ADDELLIPSE': { const ratio = num(a[2]); return add({ type: 'ELLIPSE', c: pt(a[0]), major: pt(a[1]), ratio, a1: 0, a2: G.TAU }); }
        case 'ADDSPLINE': return add({ type: 'SPLINE', fit: pts2(a[0], 3), closed: false });
        case 'ADDRAY': case 'ADDXLINE': { const p = pt(a[0]), q = pt(a[1]); return add({ type: M === 'ADDRAY' ? 'RAY' : 'XLINE', p, dir: G.norm(G.sub(q, p)) }); }
        case 'ADDSOLID': case 'ADDTRACE': return add({ type: 'SOLID', pts: (M === 'ADDTRACE' ? pts2(a[0], 3) : [pt(a[0]), pt(a[1]), pt(a[2]), pt(a[3])]) });
        case 'ADDHATCH': { const name = str(a[1]).toUpperCase(); const h = doc().vars; return add({ type: 'HATCH', loops: [], pattern: name, solid: name === 'SOLID', scale: h.HPSCALE || 1, angle: G.rad(h.HPANG || 0), assoc: bool(a[2] ?? 0) }); }
        case 'ADDDIMALIGNED': return add({ type: 'DIMENSION', dt: 'aligned', p1: pt(a[0]), p2: pt(a[1]), dp: pt(a[2]) });
        case 'ADDDIMROTATED': return add({ type: 'DIMENSION', dt: 'linear', p1: pt(a[0]), p2: pt(a[1]), dp: pt(a[2]), rot: num(a[3]) });
        case 'ADDDIMRADIAL': { const c = pt(a[0]), q = pt(a[1]); return add({ type: 'DIMENSION', dt: 'radius', c, p1: q, dp: G.polar(q, G.ang(c, q), num(a[2] ?? 0)) }); }
        case 'ADDDIMDIAMETRIC': { const p1 = pt(a[0]), p2 = pt(a[1]); return add({ type: 'DIMENSION', dt: 'diameter', p1, p2, dp: G.polar(p1, G.ang(p2, p1), num(a[2] ?? 0)) }); }
        case 'ADDDIMANGULAR': { const c = pt(a[0]); return add({ type: 'DIMENSION', dt: 'angular', c, p1: pt(a[1]), p2: pt(a[2]), dp: pt(a[3]) }); }
        case 'ADDDIM3POINTANGULAR': return add({ type: 'DIMENSION', dt: 'angular', c: pt(a[0]), p1: pt(a[1]), p2: pt(a[2]), dp: pt(a[3]) });
        case 'ADDDIMORDINATE': return add({ type: 'DIMENSION', dt: 'ordinate', p1: pt(a[0]), dp: pt(a[1]), xord: !bool(a[2]) });
        case 'ADDLEADER': return add({ type: 'LEADER', pts: pts2(a[0], 3) });
        case 'ADDTABLE': { const t = newTable(pt(a[0]), int(a[1]), int(a[2]), { rh: num(a[3]), cw: num(a[4]) }); return add(t); }
        case 'ADDWIPEOUT': return undefined;
        case 'ADDATTRIBUTE': { const mode = int(a[1] ?? 0); return add({ type: 'ATTDEF', h: num(a[0]), invisible: !!(mode & 1), constant: !!(mode & 2), prompt: str(a[2]), p: pt(a[3]), tag: str(a[4]).toUpperCase(), def: str(a[5]), text: str(a[5]), rot: 0 }); }
        case 'INSERTBLOCK': {
          let name = str(a[1]); const base = name.replace(/\\/g, '/').split('/').pop().replace(/\.dwg$/i, '');
          const k = ci(doc().blocks, name) || ci(doc().blocks, base); if (!k) err(`Filer error: ${name}`);
          const p = pt(a[0]), sx = num(a[2] ?? 1), sy = num(a[3] ?? sx), rot = num(a[5] ?? 0);
          if (isSpace(n) && app().blocks?.insertBlock) { const e = app().blocks.insertBlock(k, p, sx, sy, rot, {}, blkEnts(n)); E.invalidate(e); redraw(); return ent(e); }
          return add({ type: 'INSERT', name: k, p, sx, sy, rot });
        }
        case 'ADDREGION': return new Arr(VT.OBJECT, []);
        case 'ADDMLINE': { const v = pts2(a[0], 3); return add({ type: 'LWPOLYLINE', pts: v.map((p) => ({ ...p, b: 0 })), closed: false }); }
        case 'BIND': case 'DETACH': case 'RELOAD': case 'UNLOAD': return null;
      }
      return undefined;
    },
  };
  const styleRef = (n) => { const k = ci(doc().styles, n); return k ? doc().styles[k] : notFound(); };
  KIND.style = {
    iface: () => 'TextStyle',
    get(n, P) {
      const s = styleRef(n);
      switch (P) {
        case 'NAME': return s.name;
        case 'FONTFILE': return s.font || '';
        case 'BIGFONTFILE': return s.bigfont || '';
        case 'HEIGHT': return R(s.h || 0);
        case 'WIDTH': return R(s.wf || 1);
        case 'OBLIQUEANGLE': return R(s.obl || 0);
        case 'TEXTGENERATIONFLAG': return 0;
        case 'LASTHEIGHT': return R(s.h || doc().vars.TEXTSIZE);
        case 'OBJECTNAME': return 'AcDbTextStyleTableRecord';
      }
      return undefined;
    },
    put(n, P, v) {
      const s = styleRef(n); doc().touchTables();
      switch (P) {
        case 'FONTFILE': s.font = str(v).replace(/\\/g, '/').split('/').pop(); break;
        case 'BIGFONTFILE': s.bigfont = str(v); break;
        case 'HEIGHT': s.h = num(v); break;
        case 'WIDTH': s.wf = num(v); break;
        case 'OBLIQUEANGLE': s.obl = num(v); break;
        case 'TEXTGENERATIONFLAG': case 'LASTHEIGHT': break;
        default: return false;
      }
      for (const e of doc().allEntsDeep()) if (/TEXT|ATT|DIMENSION|INSERT/.test(e.type)) E.invalidate(e); redraw(); return true;
    },
    async call(n, M, a) {
      if (M === 'SETFONT') { const s = styleRef(n); doc().touchTables(); s.font = str(a[0]); redraw(); return null; }
      if (M === 'GETFONT') { const s = styleRef(n); for (const [i, v] of [s.font || 'Arial', VFALSE, VFALSE, 0, 0].entries()) if (a[i] instanceof K.Sym) L_.set(a[i], v); return null; }
      if (M === 'DELETE') { const s = styleRef(n); if (s.name === 'Standard') err('Object is referenced'); doc().touchTables(); delete doc().styles[s.name]; return null; }
      return undefined;
    },
  };
  KIND.ltype = {
    iface: () => 'Linetype',
    get(n, P) {
      if (P === 'NAME') return n;
      if (P === 'DESCRIPTION') { const k = ci(doc().ltypes, n); return k ? doc().ltypes[k].desc || '' : ''; }
      if (P === 'OBJECTNAME') return 'AcDbLinetypeTableRecord';
      return undefined;
    },
    put(n, P, v) { if (P === 'DESCRIPTION') { const k = ci(doc().ltypes, n); if (k) doc().ltypes[k].desc = str(v); return true; } return false; },
    async call(n, M) { if (M === 'DELETE') { const k = ci(doc().ltypes, n); if (!k || k === 'CONTINUOUS') err('Object is referenced'); doc().touchTables(); delete doc().ltypes[k]; return null; } return undefined; },
  };
  KIND.dimstyle = {
    iface: () => 'DimStyle',
    get(n, P) { if (P === 'NAME') return n; if (P === 'OBJECTNAME') return 'AcDbDimStyleTableRecord'; return undefined; },
    put: () => false,
    async call(n, M) { if (M === 'COPYFROM' || M === 'DELETE') return null; return undefined; },
  };
  const layoutRef = (n) => (String(n).toUpperCase() === 'MODEL' ? null : doc().layouts.find((l) => l.name.toUpperCase() === String(n).toUpperCase()) || notFound());
  KIND.layout = {
    iface: () => 'Layout',
    get(n, P) {
      const l = layoutRef(n), d = doc();
      switch (P) {
        case 'NAME': return l ? l.name : 'Model';
        case 'BLOCK': return l ? O('blk', paperName(d.layouts.indexOf(l))) : O('blk', '*Model_Space');
        case 'TABORDER': return l ? d.layouts.indexOf(l) + 1 : 0;
        case 'MODELTYPE': return new Bool(!l);
        case 'CANONICALMEDIANAME': return l ? 'ISO_full_bleed_' + (l.paper || 'A3') + '_(' + l.w + '.00_x_' + l.h + '.00_MM)' : 'ISO_full_bleed_A3_(420.00_x_297.00_MM)';
        case 'CONFIGNAME': return 'DWG To PDF.pc3';
        case 'STYLESHEET': return l?.ctb || 'monochrome.ctb';
        case 'PAPERUNITS': return 1;
        case 'PLOTROTATION': return 0;
        case 'PLOTTYPE': return l ? 5 : 0;
        case 'CENTERPLOT': case 'PLOTWITHPLOTSTYLES': case 'PLOTWITHLINEWEIGHTS': return new Bool(true);
        case 'STANDARDSCALE': return 0;
        case 'PLOTORIGIN': return new Arr(VT.DOUBLE, [R(0), R(0)]);
        case 'OBJECTNAME': return 'AcDbLayout';
        case 'TABSELECTED': return new Bool(d.active === (l ? l.name : 'Model'));
      }
      return undefined;
    },
    put(n, P, v) {
      const l = layoutRef(n), d = doc();
      switch (P) {
        case 'NAME': { if (!l) err('Invalid input'); const nn = str(v); d.touchTables(); if (d.active === l.name) d.active = nn; l.name = nn; app().ui?.refresh?.(); return true; }
        case 'STYLESHEET': if (l) l.ctb = str(v); return true;
        case 'TABORDER': { if (!l) return true; const i = Math.max(0, Math.min(d.layouts.length - 1, int(v) - 1)); d.layouts.splice(d.layouts.indexOf(l), 1); d.layouts.splice(i, 0, l); app().ui?.refresh?.(); return true; }
        case 'CONFIGNAME': case 'CANONICALMEDIANAME': case 'PAPERUNITS': case 'PLOTROTATION': case 'PLOTTYPE': case 'CENTERPLOT': case 'STANDARDSCALE': case 'PLOTWITHPLOTSTYLES': case 'PLOTWITHLINEWEIGHTS': case 'PLOTORIGIN': return true;
      }
      return false;
    },
    async call(n, M, a) {
      const l = layoutRef(n), d = doc();
      switch (M) {
        case 'DELETE': { if (!l || d.layouts.length < 2) err('Invalid input'); d.touchTables(); d.layouts.splice(d.layouts.indexOf(l), 1); if (d.active === l.name) app().setLayout?.('Model'); app().ui?.refresh?.(); return null; }
        case 'GETPAPERSIZE': { if (a[0] instanceof K.Sym) L_.set(a[0], R(l ? l.w : 420)); if (a[1] instanceof K.Sym) L_.set(a[1], R(l ? l.h : 297)); return null; }
        case 'GETCANONICALMEDIANAMES': return new Arr(VT.STRING, ['ISO_full_bleed_A4_(297.00_x_210.00_MM)', 'ISO_full_bleed_A3_(420.00_x_297.00_MM)', 'ISO_full_bleed_A2_(594.00_x_420.00_MM)', 'ISO_full_bleed_A1_(841.00_x_594.00_MM)', 'ISO_full_bleed_A0_(1189.00_x_841.00_MM)']);
        case 'GETPLOTDEVICENAMES': return new Arr(VT.STRING, ['DWG To PDF.pc3', 'PublishToWeb PNG.pc3']);
        case 'GETPLOTSTYLETABLENAMES': return new Arr(VT.STRING, ['monochrome.ctb', 'acad.ctb', 'Grayscale.ctb']);
        case 'COPYFROM': case 'REFRESHPLOTDEVICEINFO': case 'SETCUSTOMSCALE': case 'SETWINDOWTOPLOT': return null;
      }
      return undefined;
    },
  };
  const groupRef = (n) => { const k = ci(doc().groups, n); return k ? [k, doc().groups[k]] : notFound(); };
  const groupEnts = (g) => g.hids.map((h) => doc().findHandle(h)).filter(Boolean);
  KIND.group = {
    iface: () => 'Group',
    get(n, P) {
      const [k, g] = groupRef(n);
      switch (P) {
        case 'NAME': return k;
        case 'COUNT': return groupEnts(g).length;
        case 'DESCRIPTION': return g.desc || '';
        case 'OBJECTNAME': return 'AcDbGroup';
      }
      return undefined;
    },
    put(n, P, v) {
      const [k, g] = groupRef(n); doc().touchTables();
      if (P === 'NAME') { delete doc().groups[k]; doc().groups[str(v)] = g; return true; }
      if (P === 'DESCRIPTION') { g.desc = str(v); return true; }
      if (['LAYER', 'COLOR', 'LINETYPE', 'LINEWEIGHT', 'VISIBLE', 'HIGHLIGHT'].includes(P)) { for (const e of groupEnts(g)) putProp(ent(e), P, v); return true; }
      return false;
    },
    async call(n, M, a) {
      const [k, g] = groupRef(n);
      switch (M) {
        case 'ITEM': { const e = groupEnts(g)[int(a[0])]; if (!e) err('Invalid index'); return ent(e); }
        case 'APPENDITEMS': doc().touchTables(); for (const e of objs(a[0])) if (e.hid && !g.hids.includes(e.hid)) g.hids.push(e.hid); return null;
        case 'REMOVEITEMS': { doc().touchTables(); const hs = objs(a[0]).map((e) => e.hid); g.hids = g.hids.filter((h) => !hs.includes(h)); return null; }
        case 'DELETE': doc().touchTables(); delete doc().groups[k]; return null;
        case 'HIGHLIGHT': case 'UPDATE': return null;
      }
      return undefined;
    },
  };
  KIND.view = {
    iface: () => 'View',
    get(n, P) { const k = ci(doc().views, n); if (!k) notFound(); const v = doc().views[k]; if (P === 'NAME') return k; if (P === 'CENTER') return new Arr(VT.DOUBLE, [R(v.cx), R(v.cy)]); if (P === 'HEIGHT') return R((app().view?.H || 600) / v.s); if (P === 'WIDTH') return R((app().view?.W || 800) / v.s); return undefined; },
    put: () => false,
    async call(n, M) { if (M === 'DELETE') { const k = ci(doc().views, n); delete doc().views[k]; return null; } return undefined; },
  };
  KIND.regapp = { iface: () => 'RegisteredApplication', get: (n, P) => (P === 'NAME' ? n : undefined), put: () => false, async call(n, M) { if (M === 'DELETE') { delete (doc().regapps || {})[n]; return null; } return undefined; } };
  KIND.dict = {
    iface: () => 'Dictionary',
    get(D, P) { if (P === 'COUNT') return Object.keys(D.items).length; if (P === 'NAME') { const k = Object.keys(dicts()).find((x) => dicts()[x] === D); return k || ''; } if (P === 'OBJECTNAME') return 'AcDbDictionary'; return undefined; },
    put: () => false,
    async call(D, M, a) {
      const key = (x) => ci(D.items, str(x));
      switch (M) {
        case 'ITEM': case 'GETOBJECT': { const k = isNum(a[0]) ? Object.keys(D.items)[int(a[0])] : key(a[0]); if (!k) notFound(); const it = D.items[k]; return it.type === 'DICTIONARY' ? O('dict', it) : O('xrec', it); }
        case 'ADDXRECORD': { const k = key(a[0]) || str(a[0]); D.items[k] ||= { type: 'XRECORD', data: 'nil' }; return O('xrec', D.items[k]); }
        case 'ADDOBJECT': { const k = key(a[0]) || str(a[0]); D.items[k] ||= newDict(); return O('dict', D.items[k]); }
        case 'REMOVE': { const k = key(a[0]); if (!k) notFound(); const it = D.items[k]; delete D.items[k]; return it.type === 'DICTIONARY' ? O('dict', it) : O('xrec', it); }
        case 'RENAME': { const k = key(a[0]); if (!k) notFound(); D.items[str(a[1])] = D.items[k]; delete D.items[k]; return null; }
        case 'GETNAME': { const it = a[0]?.ref; return Object.keys(D.items).find((k) => D.items[k] === it) ?? notFound(); }
        case 'DELETE': { const D0 = dicts(); for (const k of Object.keys(D0)) if (D0[k] === D) delete D0[k]; return null; }
      }
      return undefined;
    },
  };
  KIND.xrec = {
    iface: () => 'XRecord',
    get(X, P) { if (P === 'OBJECTNAME') return 'AcDbXrecord'; if (P === 'TRANSLATEIDS') return new Bool(false); return undefined; },
    put: () => false,
    async call(X, M, a) {
      if (M === 'SETXRECORDDATA') { const t = flat(a[0]).map(int), v = flat(a[1]).map((x) => (x instanceof Variant ? x.value : x)); X.data = ser(L(t.map((c, i) => new Pair(c, v[i])))); return null; }
      if (M === 'GETXRECORDDATA') { const lst = deser(X.data) || []; const t = [], v = []; for (const p of lst) { if (p instanceof Pair) { t.push(p.a); v.push(p.d); } else if (Array.isArray(p)) { t.push(p[0]); v.push(new Variant(VT.ARRAY | VT.DOUBLE, mkSA(VT.DOUBLE, p.slice(1)))); } } if (a[0] instanceof K.Sym) L_.set(a[0], new Variant(VT.ARRAY | VT.INT, mkSA(VT.INT, t))); if (a[1] instanceof K.Sym) L_.set(a[1], new Variant(VT.ARRAY | VT.VARIANT, mkSA(VT.VARIANT, v.map((x) => new Variant(vtOf(x), x))))); return null; }
      if (M === 'DELETE') { X.data = 'nil'; return null; }
      return undefined;
    },
  };
  // Selection sets
  const filterFrom = (ft, fd) => { if (ft == null) return null; const t = flat(ft).map(int), v = flat(fd).length === t.length ? flat(fd) : (fd instanceof Variant ? fd.value : fd)?.data || flat(fd); return L(t.map((c, i) => new Pair(c, v[i] instanceof Variant ? v[i].value : v[i]))); };
  const ssget = async (args) => { const r = await L_.g.get('SSGET').call(L_, args); return r instanceof PickSet ? r.items : []; };
  KIND.ss = {
    iface: () => 'SelectionSet',
    get(S, P) { if (P === 'COUNT') return S.items.length; if (P === 'NAME') return S.name; if (P === 'OBJECTNAME') return 'AcDbSelectionSet'; return undefined; },
    put: () => false,
    async call(S, M, a) {
      const addAll = (arr) => { for (const e of arr) if (!S.items.includes(e)) S.items.push(e); };
      switch (M) {
        case 'ITEM': { const e = S.items[int(a[0])]; if (!e) err('Invalid index'); return ent(e); }
        case 'SELECT': {
          const mode = int(a[0] ?? 5), flt = filterFrom(a[3], a[4]);
          const m = { 0: 'W', 1: 'C', 3: 'P', 4: 'L', 5: 'X' }[mode];
          const args = mode <= 1 ? [m, ptList(pt(a[1])), ptList(pt(a[2]))] : [m];
          if (flt) args.push(flt);
          addAll(await ssget(args)); return null;
        }
        case 'SELECTONSCREEN': { const flt = filterFrom(a[0], a[1]); addAll(await ssget(flt ? [flt] : [])); return null; }
        case 'SELECTATPOINT': { const flt = filterFrom(a[1], a[2]); addAll(await ssget(flt ? [ptList(pt(a[0])), flt] : [ptList(pt(a[0]))])); return null; }
        case 'SELECTBYPOLYGON': { const mode = { 2: 'F', 6: 'WP', 7: 'CP' }[int(a[0])] || 'WP'; const flt = filterFrom(a[2], a[3]); const ps = L(pts2(a[1], 3).map(ptList)); addAll(await ssget(flt ? [mode, ps, flt] : [mode, ps])); return null; }
        case 'ADDITEMS': addAll(objs(a[0])); return null;
        case 'REMOVEITEMS': { const r = objs(a[0]); S.items = S.items.filter((e) => !r.includes(e)); return null; }
        case 'CLEAR': S.items = []; return null;
        case 'DELETE': S.items = []; for (const [k, v] of ssets) if (v === S) ssets.delete(k); return null;
        case 'ERASE': for (const e of S.items) { const o = ownerArr(e); if (o) doc().remove(e, o); } S.items = []; redraw(); return null;
        case 'HIGHLIGHT': case 'UPDATE': return null;
      }
      return undefined;
    },
  };
  const ptList = (p) => [R(p.x), R(p.y), R(0)];
  // Utility
  const builtin = (n, args) => L_.g.get(n).call(L_, args);
  const need = (v) => { if (v == null) err('Description was not provided.'); return v; };
  const optPt = (v) => { const a = flat(v); return a.length >= 2 ? [R(num(a[0])), R(num(a[1])), R(0)] : null; };
  const promptArgs = (base, msg) => (base ? [base, msg ?? ''] : msg != null ? [msg] : []);
  KIND.util = {
    iface: () => 'Utility',
    get: () => undefined,
    put: () => false,
    async call(_, M, a) {
      switch (M) {
        case 'GETPOINT': return P3(pt(need(await builtin('GETPOINT', promptArgs(optPt(a[0]), a[1] != null ? str(a[1]) : null)))));
        case 'GETCORNER': return P3(pt(need(await builtin('GETCORNER', [optPt(a[0]), a[1] != null ? str(a[1]) : '']))));
        case 'GETDISTANCE': return R(num(need(await builtin('GETDIST', promptArgs(optPt(a[0]), a[1] != null ? str(a[1]) : null)))));
        case 'GETANGLE': case 'GETORIENTATION': return R(num(need(await builtin('GETANGLE', promptArgs(optPt(a[0]), a[1] != null ? str(a[1]) : null)))));
        case 'GETREAL': return R(num(need(await builtin('GETREAL', a[0] != null ? [str(a[0])] : []))));
        case 'GETINTEGER': return int(need(await builtin('GETINT', a[0] != null ? [str(a[0])] : [])));
        case 'GETSTRING': return str(await builtin('GETSTRING', [bool(a[0]) ? T : null, a[1] != null ? str(a[1]) : '']));
        case 'GETKEYWORD': return need(await builtin('GETKWORD', a[0] != null ? [str(a[0])] : []));
        case 'GETINPUT': return L_._lastKw || '';
        case 'INITIALIZEUSERINPUT': await builtin('INITGET', [int(a[0] ?? 0), ...(a[1] != null ? [str(a[1])] : [])]); return null;
        case 'GETENTITY': case 'GETSUBENTITY': {
          const r = need(await builtin('ENTSEL', a[2] != null ? [str(a[2])] : []));
          if (a[0] instanceof K.Sym) L_.set(a[0], ent(r[0].e));
          if (a[1] instanceof K.Sym) L_.set(a[1], new Variant(VT.ARRAY | VT.DOUBLE, mkSA(VT.DOUBLE, r[1])));
          return null;
        }
        case 'PROMPT': L_.write(str(a[0])); return null;
        case 'ANGLETOREAL': return R(num(builtin('ANGTOF', [str(a[0]), int(a[1] ?? 0)]) ?? R(0)));
        case 'ANGLETOSTRING': return builtin('ANGTOS', [a[0], int(a[1] ?? 0), int(a[2] ?? 0)]);
        case 'DISTANCETOREAL': return R(num(builtin('DISTOF', [str(a[0])]) ?? R(0)));
        case 'REALTOSTRING': return builtin('RTOS', [a[0], int(a[1] ?? 2), int(a[2] ?? 4)]);
        case 'POLARPOINT': return P3(G.polar(pt(a[0]), num(a[1]), num(a[2])));
        case 'ANGLEFROMXAXIS': return R(G.normA(G.ang(pt(a[0]), pt(a[1]))));
        case 'TRANSLATECOORDINATES': return P3(pt(a[0]));
        case 'CREATETYPEDARRAY': { const type = int(a[1]); const vals = a.slice(2).map((x) => coerce(type, x)); if (a[0] instanceof K.Sym) L_.set(a[0], new Variant(VT.ARRAY | type, mkSA(type, vals))); return null; }
        case 'ISURL': return new Bool(/^\w+:\/\//.test(str(a[0])));
        case 'SENDMODELESSOPERATIONENDED': case 'SENDMODELESSOPERATIONSTART': return null;
      }
      return undefined;
    },
  };
  // Preferencias y objetos genéricos: guardan lo que se les asigna
  const bags = new Map();
  const BAG_DEF = {
    PREFS: { DISPLAY: () => O('bag', 'DISPLAY'), FILES: () => O('bag', 'FILES'), DRAFTING: () => O('bag', 'DRAFTING'), OPENSAVE: () => O('bag', 'OPENSAVE'), SYSTEM: () => O('bag', 'SYSTEM'), USER: () => O('bag', 'USER'), OUTPUT: () => O('bag', 'OUTPUT'), SELECTION: () => O('bag', 'SELECTION'), PROFILES: () => O('bag', 'PROFILES') },
    FILES: { SUPPORTPATH: '', PRINTERCONFIGPATH: '', TEMPFILEPATH: '/tmp', TEMPLATEDWGPATH: '', FONTFILEMAP: '', MENUFILE: 'acad', CUSTOMDICTIONARY: '', AUTOSAVEPATH: '', LOGFILEPATH: '', TOOLPALETTEPATH: '', TRUSTEDPATHS: '' },
    DISPLAY: { CURSORSIZE: 5, DISPLAYSCROLLBARS: VFALSE, DISPLAYSCREENMENU: VFALSE, LAYOUTDISPLAYMARGINS: VTRUE, MODELCROSSHAIRCOLOR: 16777215, GRAPHICSWINMODELBACKGRNDCOLOR: 0, TEXTWINTEXTCOLOR: 0 },
    PROFILES: { ACTIVEPROFILE: 'WebCAD' },
    OPENSAVE: { SAVEASTYPE: 12, AUTOSAVEINTERVAL: 10, CREATEBACKUP: VTRUE, FULLSAVERATIO: 50 },
    DRAFTING: { AUTOSNAPAPERTURE: VTRUE, AUTOSNAPMARKER: VTRUE },
    SYSTEM: { SINGLEDOCUMENTMODE: VFALSE, BEEPONERROR: VFALSE },
    VIEWPORT: { NAME: '*Active', CENTER: () => P3({ x: app().view?.cur?.cx || 0, y: app().view?.cur?.cy || 0 }), HEIGHT: () => R((app().view?.H || 600) / (app().view?.cur?.s || 1)), WIDTH: () => R((app().view?.W || 800) / (app().view?.cur?.s || 1)), GRIDON: () => new Bool(doc().vars.GRIDMODE), SNAPON: () => new Bool(doc().vars.SNAPMODE), ORTHOON: () => new Bool(doc().vars.ORTHOMODE) },
  };
  KIND.bag = {
    iface: (n) => 'Preferences' + (n === 'PREFS' ? '' : String(n).charAt(0) + String(n).slice(1).toLowerCase()),
    get(n, P) { const m = bags.get(n); if (m?.has(P)) return m.get(P); const d = BAG_DEF[n]?.[P]; if (typeof d === 'function') return d(); if (d !== undefined) return d; if (P === 'NAME') return String(n); if (P === 'COUNT') return 0; return 0; },
    put(n, P, v) { if (!bags.has(n)) bags.set(n, new Map()); bags.get(n).set(P, v); if (n === 'VIEWPORT' && P === 'GRIDON') doc().vars.GRIDMODE = bool(v) ? 1 : 0; return true; },
    async call() { return null; },
  };
  KIND.prefs = { iface: () => 'Preferences', get: (n, P) => KIND.bag.get('PREFS', P), put: () => true, async call() { return null; } };
  KIND.summary = {
    iface: () => 'SummaryInfo',
    get(_, P) {
      const p = doc().props;
      const m = { AUTHOR: 'author', TITLE: 'title', SUBJECT: 'subject', KEYWORDS: 'keywords', COMMENTS: 'comments', REVISIONNUMBER: 'revision', LASTSAVEDBY: 'author', HYPERLINKBASE: 'hyperlink' }[P];
      if (m) return p[m] || '';
      return undefined;
    },
    put(_, P, v) {
      const m = { AUTHOR: 'author', TITLE: 'title', SUBJECT: 'subject', KEYWORDS: 'keywords', COMMENTS: 'comments', REVISIONNUMBER: 'revision', HYPERLINKBASE: 'hyperlink' }[P];
      if (!m) return false; doc().touchTables(); doc().props[m] = str(v); return true;
    },
    async call(_, M, a) {
      const c = (doc().props.custom ||= {});
      switch (M) {
        case 'NUMCUSTOMINFO': return Object.keys(c).length;
        case 'ADDCUSTOMINFO': case 'SETCUSTOMBYKEY': doc().touchTables(); c[str(a[0])] = str(a[1]); return null;
        case 'GETCUSTOMBYKEY': { const k = ci(c, str(a[0])); if (!k) notFound(); if (a[1] instanceof K.Sym) L_.set(a[1], c[k]); return null; }
        case 'GETCUSTOMBYINDEX': { const k = Object.keys(c)[int(a[0])]; if (k == null) err('Invalid index'); if (a[1] instanceof K.Sym) L_.set(a[1], k); if (a[2] instanceof K.Sym) L_.set(a[2], c[k]); return null; }
        case 'REMOVECUSTOMBYKEY': doc().touchTables(); delete c[ci(c, str(a[0]))]; return null;
        case 'REMOVECUSTOMBYINDEX': doc().touchTables(); delete c[Object.keys(c)[int(a[0])]]; return null;
        case 'SETCUSTOMBYINDEX': { const k = Object.keys(c)[int(a[0])]; if (k != null) { delete c[k]; c[str(a[1])] = str(a[2]); } return null; }
      }
      return undefined;
    },
  };
  // AcCmColor
  KIND.color = {
    iface: () => 'AcCmColor',
    get(c, P) {
      const rgb = c.rgb ? parseInt(c.rgb.slice(1), 16) : null, rgbA = ACI[c.aci] || [255, 255, 255];
      switch (P) {
        case 'COLORINDEX': return c.aci ?? 256;
        case 'COLORMETHOD': return c.rgb ? 194 : c.aci === 256 ? 192 : c.aci === 0 ? 193 : 195;
        case 'RED': return rgb != null ? rgb >> 16 : rgbA[0];
        case 'GREEN': return rgb != null ? (rgb >> 8) & 255 : rgbA[1];
        case 'BLUE': return rgb != null ? rgb & 255 : rgbA[2];
        case 'ENTITYCOLOR': return rgb != null ? -1040187392 + rgb : -1023410176 + (c.aci ?? 256);
        case 'COLORNAME': case 'BOOKNAME': return '';
      }
      return undefined;
    },
    put(c, P, v) {
      switch (P) {
        case 'COLORINDEX': c.aci = int(v); delete c.rgb; return true;
        case 'COLORMETHOD': { const m = int(v); if (m === 192) { c.aci = 256; delete c.rgb; } else if (m === 193) { c.aci = 0; delete c.rgb; } return true; }
        case 'ENTITYCOLOR': { const n = int(v); const kind = (n >>> 24) & 255; if (kind === 0xc2) { c.rgb = '#' + (n & 0xffffff).toString(16).padStart(6, '0'); c.aci = nearestAci(c.rgb); } else { c.aci = n & 0xffff; delete c.rgb; } return true; }
      }
      return false;
    },
    async call(c, M, a) {
      if (M === 'SETRGB') { c.rgb = '#' + [a[0], a[1], a[2]].map((x) => Math.max(0, Math.min(255, int(x))).toString(16).padStart(2, '0')).join(''); c.aci = nearestAci(c.rgb); return null; }
      if (M === 'SETCOLORBOOKCOLOR' || M === 'SETNAMES') return null;
      if (M === 'DELETE') return null;
      return undefined;
    },
  };
  // propiedades de bloque dinámico
  const dynList = (e) => {
    const b = blkDef(e.name); if (!b?.params?.length) return [];
    const outp = [];
    for (const p of b.params) {
      if (p.type === 'xy') { outp.push({ ins: e, p, sub: 'x', name: p.name + ' X' }, { ins: e, p, sub: 'y', name: p.name + ' Y' }); }
      else if (p.type === 'polar') { outp.push({ ins: e, p, sub: 'd', name: p.name }, { ins: e, p, sub: 'a', name: p.name + ' Angle' }); }
      else outp.push({ ins: e, p, name: p.name });
    }
    return outp;
  };
  const dynVal = (dp) => {
    const b = blkDef(dp.ins.name), dyn = { ...E.dynDefaults(b), ...(dp.ins.dyn || {}) }, v = dyn[dp.p.name];
    if (dp.sub === 'x' || dp.sub === 'y') return R(v?.[dp.sub] ?? 0);
    if (dp.sub === 'd' || dp.sub === 'a') return R(v?.[dp.sub] ?? 0);
    if (dp.p.type === 'flip') return int(v || 0);
    if (dp.p.type === 'visibility' || dp.p.type === 'lookup') return String(v ?? '');
    return R(num(v ?? 0));
  };
  const dynCache = new Map();
  const dynObj = (dp) => { const k = dp.ins; let m = dynCache.get(k); if (!m) dynCache.set(k, (m = {})); return O('dynprop', (m[dp.name] ||= dp)); };
  KIND.dynprop = {
    iface: () => 'DynamicBlockReferenceProperty',
    get(dp, P) {
      switch (P) {
        case 'PROPERTYNAME': return dp.name;
        case 'VALUE': return new Variant(dp.p.type === 'visibility' || dp.p.type === 'lookup' ? VT.STRING : dp.p.type === 'flip' ? VT.INT : VT.DOUBLE, dynVal(dp));
        case 'READONLY': return new Bool(false);
        case 'SHOW': return new Bool(true);
        case 'DESCRIPTION': return dp.p.desc || '';
        case 'UNITSTYPE': return dp.p.type === 'rotation' || dp.sub === 'a' ? 1 : dp.p.type === 'linear' || dp.p.type === 'xy' || dp.p.type === 'polar' ? 2 : 0;
        case 'ALLOWEDVALUES': {
          if (dp.p.type === 'visibility') return new Arr(VT.STRING, (dp.p.states || []).map((s) => s.name));
          if (dp.p.type === 'lookup') return new Arr(VT.STRING, (dp.p.rows || []).map((r) => r.label));
          if (dp.p.type === 'flip') return new Arr(VT.INT, [0, 1]);
          if (dp.p.values?.length) return new Arr(VT.DOUBLE, dp.p.values.map((x) => R(+x)));
          return new Arr(VT.DOUBLE, []);
        }
      }
      return undefined;
    },
    put(dp, P, v) {
      if (P !== 'VALUE') return false;
      const e = dp.ins, b = blkDef(e.name); v = v instanceof Variant ? v.value : v;
      doc().touch(e);
      e.dyn = { ...E.dynDefaults(b), ...(e.dyn || {}) };
      const cur = e.dyn[dp.p.name];
      if (dp.sub === 'x' || dp.sub === 'y') e.dyn[dp.p.name] = { ...(cur || { x: 0, y: 0 }), [dp.sub]: num(v) };
      else if (dp.sub === 'd' || dp.sub === 'a') e.dyn[dp.p.name] = { ...(cur || { d: 0, a: 0 }), [dp.sub]: num(v) };
      else if (dp.p.type === 'visibility' || dp.p.type === 'lookup') { const s = str(v); const opts = dp.p.type === 'visibility' ? (dp.p.states || []).map((x) => x.name) : (dp.p.rows || []).map((r) => r.label); const k = opts.find((o) => o.toUpperCase() === s.toUpperCase()); if (k == null) err('Invalid input'); e.dyn[dp.p.name] = k; }
      else if (dp.p.type === 'flip') e.dyn[dp.p.name] = num(v) ? 1 : 0;
      else e.dyn[dp.p.name] = num(v);
      E.invalidate(e); redraw(); return true;
    },
    async call() { return undefined; },
  };

  // ---------- entidades
  const curveObj = (e) => ['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'ELLIPSE', 'SPLINE'].includes(e.type);
  const startPt = (e) => (e.type === 'LINE' ? e.p1 : e.type === 'ARC' ? G.polar(e.c, e.a1, e.r) : E.curvePoints(e)[0]);
  const endPt = (e) => { if (e.type === 'LINE') return e.p2; if (e.type === 'ARC') return G.polar(e.c, e.a2, e.r); const p = E.curvePoints(e); return p[p.length - 1]; };
  const textAlign = (e) => { const i = ALIGN.findIndex(([h, v]) => h === (e.ha || 0) && v === (e.va || 0)); return i < 0 ? 0 : i; };
  const ENT = {};
  ENT.get = (e, P, args) => {
    const T_ = e.type;
    switch (P) {
      case 'HANDLE': return e.hid || '0';
      case 'OBJECTNAME': case 'ENTITYNAME': return T_ === 'DIMENSION' ? 'AcDb' + (DIMNAME[e.dt] || 'RotatedDimension') : OBJNAME[T_] || 'AcDb' + T_;
      case 'OBJECTID': case 'OBJECTID32': return parseInt(e.hid || '0', 16);
      case 'OWNERID': case 'OWNERID32': return 1;
      case 'ENTITYTYPE': return { LINE: 19, CIRCLE: 8, ARC: 4, LWPOLYLINE: 24, POINT: 22, TEXT: 32, MTEXT: 27, INSERT: 7, ELLIPSE: 35, SPLINE: 31, HATCH: 15, DIMENSION: 11, ATTRIB: 2 }[T_] ?? 0;
      case 'LAYER': return e.layer || '0';
      case 'COLOR': return aciOf(e.color);
      case 'TRUECOLOR': return O('color', typeof e.color === 'string' ? { aci: nearestAci(e.color), rgb: e.color } : { aci: e.color ?? 256 });
      case 'LINETYPE': return LTYPE(e.ltype);
      case 'LINETYPESCALE': return R(e.lts ?? 1);
      case 'LINEWEIGHT': return e.lw ?? -1;
      case 'VISIBLE': return new Bool(e.visible !== false);
      case 'ENTITYTRANSPARENCY': return e.transp != null ? String(e.transp) : 'ByLayer';
      case 'PLOTSTYLENAME': case 'MATERIAL': return 'ByLayer';
      case 'HYPERLINKS': return O('coll', 'HYPERLINKS');
      case 'HASEXTENSIONDICTIONARY': return new Bool(!!e.xdict);
      case 'THICKNESS': return R(e.th || 0);
      case 'NORMAL': return P3({ x: 0, y: 0, z: 1 });
    }
    switch (T_) {
      case 'LINE':
        switch (P) {
          case 'STARTPOINT': return P3(e.p1);
          case 'ENDPOINT': return P3(e.p2);
          case 'LENGTH': return R(G.dist(e.p1, e.p2));
          case 'ANGLE': return R(G.normA(G.ang(e.p1, e.p2)));
          case 'DELTA': return P3(G.sub(e.p2, e.p1));
        }
        break;
      case 'CIRCLE':
        switch (P) {
          case 'CENTER': return P3(e.c);
          case 'RADIUS': return R(e.r);
          case 'DIAMETER': return R(e.r * 2);
          case 'AREA': return R(Math.PI * e.r * e.r);
          case 'CIRCUMFERENCE': case 'LENGTH': return R(G.TAU * e.r);
        }
        break;
      case 'ARC':
        switch (P) {
          case 'CENTER': return P3(e.c);
          case 'RADIUS': return R(e.r);
          case 'STARTANGLE': return R(G.normA(e.a1));
          case 'ENDANGLE': return R(G.normA(e.a2));
          case 'TOTALANGLE': return R(G.arcSweep(e.a1, e.a2));
          case 'ARCLENGTH': case 'LENGTH': return R(e.r * G.arcSweep(e.a1, e.a2));
          case 'STARTPOINT': return P3(startPt(e));
          case 'ENDPOINT': return P3(endPt(e));
          case 'AREA': { const s = G.arcSweep(e.a1, e.a2); return R(e.r * e.r * (s - Math.sin(s)) / 2); }
        }
        break;
      case 'LWPOLYLINE':
        switch (P) {
          case 'COORDINATES': return new Arr(VT.DOUBLE, e.pts.flatMap((p) => [R(p.x), R(p.y)]));
          case 'COORDINATE': { const p = e.pts[int(args[0])]; if (!p) err('Invalid index'); return new Arr(VT.DOUBLE, [R(p.x), R(p.y)]); }
          case 'CLOSED': return new Bool(e.closed);
          case 'CONSTANTWIDTH': return R(e.cw_ || 0);
          case 'ELEVATION': return R(e.elev || 0);
          case 'LENGTH': return R(E.entLength(e));
          case 'AREA': return R(E.entArea(e));
          case 'LINETYPEGENERATION': return new Bool(!!e.plinegen);
        }
        break;
      case 'POINT': if (P === 'COORDINATES') return P3(e.p); break;
      case 'TEXT': case 'ATTRIB': case 'ATTDEF':
        switch (P) {
          case 'TEXTSTRING': return e.text ?? e.def ?? '';
          case 'HEIGHT': return R(e.h || 0);
          case 'INSERTIONPOINT': return P3(e.p);
          case 'TEXTALIGNMENTPOINT': return P3(e.p2 || e.p);
          case 'ROTATION': return R(e.rot || 0);
          case 'STYLENAME': return e.style || 'Standard';
          case 'ALIGNMENT': return textAlign(e);
          case 'HORIZONTALALIGNMENT': return e.ha || 0;
          case 'VERTICALALIGNMENT': return e.va || 0;
          case 'SCALEFACTOR': return R(e.wf || 1);
          case 'OBLIQUEANGLE': return R(e.obl || 0);
          case 'BACKWARD': case 'UPSIDEDOWN': return new Bool(false);
          case 'TEXTGENERATIONFLAG': return 0;
          case 'TAGSTRING': if (T_ !== 'TEXT') return e.tag || ''; break;
          case 'PROMPTSTRING': if (T_ === 'ATTDEF') return e.prompt || ''; break;
          case 'INVISIBLE': if (T_ !== 'TEXT') return new Bool(e.invisible); break;
          case 'CONSTANT': if (T_ !== 'TEXT') return new Bool(e.constant); break;
          case 'VERIFY': case 'PRESET': case 'LOCKPOSITION': case 'MTEXTATTRIBUTE': if (T_ !== 'TEXT') return new Bool(false); break;
          case 'MODE': if (T_ !== 'TEXT') return (e.invisible ? 1 : 0) | (e.constant ? 2 : 0); break;
          case 'FIELDLENGTH': return 0;
        }
        break;
      case 'MTEXT':
        switch (P) {
          case 'TEXTSTRING': case 'CONTENTS': return e.text ?? '';
          case 'HEIGHT': return R(e.h || 0);
          case 'INSERTIONPOINT': return P3(e.p);
          case 'WIDTH': return R(e.w || 0);
          case 'ATTACHMENTPOINT': return e.att || 1;
          case 'ROTATION': return R(e.rot || 0);
          case 'STYLENAME': return e.style || 'Standard';
          case 'LINESPACINGFACTOR': return R(e.ls || 1);
          case 'DRAWINGDIRECTION': return 1;
          case 'BACKGROUNDFILL': return new Bool(!!e.bg);
        }
        break;
      case 'INSERT':
        switch (P) {
          case 'NAME': return e.name;
          case 'EFFECTIVENAME': return e.name;
          case 'INSERTIONPOINT': return P3(e.p);
          case 'ROTATION': return R(e.rot || 0);
          case 'XSCALEFACTOR': case 'XEFFECTIVESCALEFACTOR': return R(e.sx ?? 1);
          case 'YSCALEFACTOR': case 'YEFFECTIVESCALEFACTOR': return R(e.sy ?? 1);
          case 'ZSCALEFACTOR': case 'ZEFFECTIVESCALEFACTOR': return R(e.sx ?? 1);
          case 'HASATTRIBUTES': return new Bool(!!e.attribs?.length);
          case 'ISDYNAMICBLOCK': return new Bool(!!blkDef(e.name)?.params?.length);
          case 'INSUNITS': return 'Millimeters';
          case 'INSUNITSFACTOR': return R(1);
          case 'COLUMNS': return e.cols || 1;
          case 'ROWS': return e.rows || 1;
        }
        break;
      case 'ELLIPSE':
        switch (P) {
          case 'CENTER': return P3(e.c);
          case 'MAJORAXIS': return P3(e.major);
          case 'MINORAXIS': return P3(G.mul(G.perp(e.major), e.ratio));
          case 'RADIUSRATIO': return R(e.ratio);
          case 'MAJORRADIUS': return R(G.len(e.major));
          case 'MINORRADIUS': return R(G.len(e.major) * e.ratio);
          case 'STARTANGLE': case 'STARTPARAMETER': return R(e.a1 ?? 0);
          case 'ENDANGLE': case 'ENDPARAMETER': return R(e.a2 ?? G.TAU);
          case 'AREA': return R(E.entArea(e));
          case 'STARTPOINT': return P3(startPt(e));
          case 'ENDPOINT': return P3(endPt(e));
        }
        break;
      case 'SPLINE':
        switch (P) {
          case 'NUMBEROFFITPOINTS': return (e.fit || []).length;
          case 'NUMBEROFCONTROLPOINTS': return (e.cps || []).length;
          case 'FITPOINTS': return new Arr(VT.DOUBLE, (e.fit || []).flatMap((p) => [R(p.x), R(p.y), R(0)]));
          case 'CONTROLPOINTS': return new Arr(VT.DOUBLE, (e.cps || []).flatMap((p) => [R(p.x), R(p.y), R(0)]));
          case 'CLOSED': case 'ISPERIODIC': return new Bool(!!e.closed);
          case 'DEGREE': return e.deg || 3;
          case 'AREA': return R(E.entArea(e));
          case 'ISRATIONAL': case 'ISPLANAR': return new Bool(P === 'ISPLANAR');
        }
        break;
      case 'HATCH':
        switch (P) {
          case 'PATTERNNAME': return e.solid ? 'SOLID' : e.pattern || 'ANSI31';
          case 'PATTERNSCALE': return R(e.scale || 1);
          case 'PATTERNANGLE': return R(e.angle || 0);
          case 'PATTERNTYPE': return 1;
          case 'PATTERNSPACE': return R(1);
          case 'AREA': return R(E.entArea(e));
          case 'NUMBEROFLOOPS': return (e.loops || []).length;
          case 'ASSOCIATIVEHATCH': return new Bool(!!e.assoc);
          case 'HATCHSTYLE': return 0;
          case 'ISOPENPENWIDTH': case 'PATTERNDOUBLE': return new Bool(false);
          case 'ELEVATION': return R(0);
        }
        break;
      case 'DIMENSION':
        switch (P) {
          case 'MEASUREMENT': return R(E.dimMeasure(e));
          case 'TEXTOVERRIDE': return e.text || '';
          case 'STYLENAME': return doc().vars.DIMSTYLE || 'ISO-25';
          case 'TEXTPOSITION': return P3(e.tp || e.dp || { x: 0, y: 0 });
          case 'ROTATION': return R(e.rot || 0);
          case 'SCALEFACTOR': return R(doc().dimstyle?.dimscale || 1);
          case 'TEXTHEIGHT': return R(doc().dimstyle?.dimtxt || 2.5);
          case 'PRIMARYUNITSPRECISION': return doc().dimstyle?.dimdec ?? 2;
          case 'EXTLINE1POINT': case 'XLINE1POINT': return P3(e.p1 || { x: 0, y: 0 });
          case 'EXTLINE2POINT': case 'XLINE2POINT': return P3(e.p2 || { x: 0, y: 0 });
          case 'CENTER': return P3(e.c || { x: 0, y: 0 });
        }
        break;
      case 'TABLE':
        switch (P) {
          case 'ROWS': return e.rows.length;
          case 'COLUMNS': return e.cols.length;
          case 'INSERTIONPOINT': return P3(e.p);
          case 'WIDTH': return R(e.cols.reduce((s, x) => s + x, 0));
          case 'HEIGHT': return R(e.rows.reduce((s, x) => s + x, 0));
          case 'ROWHEIGHT': return R(e.rows[0] || 0);
          case 'COLUMNWIDTH': return R(e.cols[0] || 0);
          case 'STYLENAME': return 'Standard';
        }
        break;
      case 'XLINE': case 'RAY':
        switch (P) {
          case 'BASEPOINT': return P3(e.p);
          case 'SECONDPOINT': return P3(G.add(e.p, e.dir));
          case 'DIRECTIONVECTOR': return P3(e.dir);
        }
        break;
      case 'SOLID': if (P === 'COORDINATES') return new Arr(VT.DOUBLE, e.pts.flatMap((p) => [R(p.x), R(p.y), R(0)])); break;
      case 'LEADER': if (P === 'COORDINATES') return new Arr(VT.DOUBLE, e.pts.flatMap((p) => [R(p.x), R(p.y), R(0)])); break;
      case 'VIEWPORT':
        switch (P) {
          case 'CENTER': return P3(e.c);
          case 'WIDTH': return R(e.w);
          case 'HEIGHT': return R(e.h);
          case 'CUSTOMSCALE': return R(e.scale || 1);
          case 'DISPLAYLOCKED': return new Bool(!!e.locked);
          case 'VIEWPORTON': return new Bool(e.on !== false);
        }
        break;
    }
    if (P === 'LENGTH' && curveObj(e)) return R(E.entLength(e));
    if (P === 'AREA' && curveObj(e)) return R(E.entArea(e));
    if (P === 'CLOSED' && curveObj(e)) return new Bool(e.type === 'CIRCLE' || !!e.closed);
    return undefined;
  };
  const setP = (e, f, p) => { e[f] = pt(p); };
  const rebuildAttribs = (e) => { if (!e.attribs?.length || !app().blocks?.attribsFor) return; const vals = Object.fromEntries(e.attribs.map((a) => [a.tag, a.text])); e.attribs = app().blocks.attribsFor(e.name, e, vals); };
  ENT.put = (e, P, v, args) => {
    const T_ = e.type;
    switch (P) {
      case 'LAYER': { const n = str(v); const k = ci(doc().layers, n); if (!k) err('Key not found'); e.layer = k; return true; }
      case 'COLOR': e.color = int(v); return true;
      case 'TRUECOLOR': { const c = v instanceof VlaObj ? v.ref : { aci: int(v) }; e.color = c.rgb || (c.aci ?? 256); return true; }
      case 'LINETYPE': { const k = COLL.LINETYPES.key(str(v)); if (!k) err('Key not found'); e.ltype = k.toUpperCase(); return true; }
      case 'LINETYPESCALE': e.lts = num(v); return true;
      case 'LINEWEIGHT': e.lw = int(v); return true;
      case 'VISIBLE': if (bool(v)) delete e.visible; else e.visible = false; return true;
      case 'ENTITYTRANSPARENCY': { const s = str(v); if (/^bylayer$/i.test(s)) delete e.transp; else e.transp = parseInt(s, 10) || 0; return true; }
      case 'THICKNESS': e.th = num(v); return true;
      case 'PLOTSTYLENAME': case 'MATERIAL': case 'NORMAL': case 'HYPERLINKS': return true;
    }
    switch (T_) {
      case 'LINE':
        if (P === 'STARTPOINT') { setP(e, 'p1', v); return true; }
        if (P === 'ENDPOINT') { setP(e, 'p2', v); return true; }
        break;
      case 'CIRCLE':
        if (P === 'CENTER') { setP(e, 'c', v); return true; }
        if (P === 'RADIUS') { e.r = num(v); return true; }
        if (P === 'DIAMETER') { e.r = num(v) / 2; return true; }
        if (P === 'AREA') { e.r = Math.sqrt(num(v) / Math.PI); return true; }
        if (P === 'CIRCUMFERENCE') { e.r = num(v) / G.TAU; return true; }
        break;
      case 'ARC':
        if (P === 'CENTER') { setP(e, 'c', v); return true; }
        if (P === 'RADIUS') { e.r = num(v); return true; }
        if (P === 'STARTANGLE') { e.a1 = num(v); return true; }
        if (P === 'ENDANGLE') { e.a2 = num(v); return true; }
        break;
      case 'LWPOLYLINE':
        if (P === 'COORDINATES') { const old = e.pts; e.pts = pts2(v, 2).map((p, i) => ({ ...p, b: old[i]?.b || 0 })); return true; }
        if (P === 'COORDINATE') { const i = int(args[0]); if (!e.pts[i]) err('Invalid index'); const p = pt(v); e.pts[i] = { ...e.pts[i], x: p.x, y: p.y }; return true; }
        if (P === 'CLOSED') { e.closed = bool(v); return true; }
        if (P === 'CONSTANTWIDTH') { e.cw_ = num(v); for (const p of e.pts) { delete p.sw; delete p.ew; } return true; }
        if (P === 'ELEVATION') { e.elev = num(v); return true; }
        if (P === 'LINETYPEGENERATION') { e.plinegen = bool(v); return true; }
        break;
      case 'POINT': if (P === 'COORDINATES') { setP(e, 'p', v); return true; } break;
      case 'TEXT': case 'ATTRIB': case 'ATTDEF':
        switch (P) {
          case 'TEXTSTRING': e.text = str(v); if (T_ === 'ATTDEF') e.def = e.text; return true;
          case 'HEIGHT': e.h = num(v); return true;
          case 'INSERTIONPOINT': { const q = pt(v); if (e.p2) e.p2 = G.add(e.p2, G.sub(q, e.p)); e.p = q; return true; }
          case 'TEXTALIGNMENTPOINT': setP(e, 'p2', v); return true;
          case 'ROTATION': e.rot = num(v); return true;
          case 'STYLENAME': { const k = ci(doc().styles, str(v)); if (!k) err('Key not found'); e.style = k; return true; }
          case 'ALIGNMENT': { const [h, vv] = ALIGN[int(v)] || [0, 0]; e.ha = h; e.va = vv; if (!e.p2) e.p2 = { ...e.p }; return true; }
          case 'HORIZONTALALIGNMENT': e.ha = int(v); if (!e.p2) e.p2 = { ...e.p }; return true;
          case 'VERTICALALIGNMENT': e.va = int(v); if (!e.p2) e.p2 = { ...e.p }; return true;
          case 'SCALEFACTOR': e.wf = num(v); return true;
          case 'OBLIQUEANGLE': e.obl = num(v); return true;
          case 'TAGSTRING': if (T_ !== 'TEXT') { e.tag = str(v).toUpperCase(); return true; } break;
          case 'PROMPTSTRING': if (T_ === 'ATTDEF') { e.prompt = str(v); return true; } break;
          case 'INVISIBLE': if (T_ !== 'TEXT') { e.invisible = bool(v); return true; } break;
          case 'CONSTANT': if (T_ === 'ATTDEF') { e.constant = bool(v); return true; } break;
          case 'BACKWARD': case 'UPSIDEDOWN': case 'TEXTGENERATIONFLAG': case 'VERIFY': case 'PRESET': case 'LOCKPOSITION': case 'FIELDLENGTH': return true;
        }
        break;
      case 'MTEXT':
        switch (P) {
          case 'TEXTSTRING': case 'CONTENTS': e.text = str(v); return true;
          case 'HEIGHT': e.h = num(v); return true;
          case 'INSERTIONPOINT': setP(e, 'p', v); return true;
          case 'WIDTH': e.w = num(v); return true;
          case 'ATTACHMENTPOINT': e.att = int(v); return true;
          case 'ROTATION': e.rot = num(v); return true;
          case 'STYLENAME': { const k = ci(doc().styles, str(v)); if (!k) err('Key not found'); e.style = k; return true; }
          case 'LINESPACINGFACTOR': e.ls = num(v); return true;
          case 'BACKGROUNDFILL': e.bg = bool(v); return true;
          case 'DRAWINGDIRECTION': case 'LINESPACINGSTYLE': return true;
        }
        break;
      case 'INSERT':
        switch (P) {
          case 'INSERTIONPOINT': { const q = pt(v); E.transformEnt(e, G.M.tr(q.x - e.p.x, q.y - e.p.y)); return true; }
          case 'ROTATION': { const r = num(v); E.transformEnt(e, G.M.rot(r - (e.rot || 0), e.p)); e.rot = r; return true; }
          case 'XSCALEFACTOR': case 'XEFFECTIVESCALEFACTOR': e.sx = num(v); rebuildAttribs(e); return true;
          case 'YSCALEFACTOR': case 'YEFFECTIVESCALEFACTOR': e.sy = num(v); rebuildAttribs(e); return true;
          case 'ZSCALEFACTOR': case 'ZEFFECTIVESCALEFACTOR': return true;
          case 'NAME': { const k = ci(doc().blocks, str(v)); if (!k) err('Key not found'); e.name = k; const b = doc().blocks[k]; if (b.params?.length) e.dyn = E.dynDefaults(b); else delete e.dyn; rebuildAttribs(e); return true; }
        }
        break;
      case 'ELLIPSE':
        switch (P) {
          case 'CENTER': setP(e, 'c', v); return true;
          case 'MAJORAXIS': setP(e, 'major', v); return true;
          case 'RADIUSRATIO': e.ratio = num(v); return true;
          case 'MAJORRADIUS': e.major = G.mul(G.norm(e.major), num(v)); return true;
          case 'MINORRADIUS': e.ratio = num(v) / G.len(e.major); return true;
          case 'STARTANGLE': case 'STARTPARAMETER': e.a1 = num(v); return true;
          case 'ENDANGLE': case 'ENDPARAMETER': e.a2 = num(v); return true;
        }
        break;
      case 'SPLINE':
        if (P === 'FITPOINTS') { e.fit = pts2(v, 3); delete e.cps; return true; }
        if (P === 'CONTROLPOINTS') { e.cps = pts2(v, 3); return true; }
        if (P === 'CLOSED') { e.closed = bool(v); return true; }
        break;
      case 'HATCH':
        switch (P) {
          case 'PATTERNSCALE': e.scale = num(v); return true;
          case 'PATTERNANGLE': e.angle = num(v); return true;
          case 'ASSOCIATIVEHATCH': e.assoc = bool(v); return true;
          case 'HATCHSTYLE': case 'PATTERNTYPE': case 'PATTERNSPACE': case 'PATTERNDOUBLE': case 'ELEVATION': return true;
        }
        break;
      case 'DIMENSION':
        switch (P) {
          case 'TEXTOVERRIDE': e.text = str(v) || undefined; return true;
          case 'TEXTPOSITION': setP(e, 'tp', v); return true;
          case 'ROTATION': e.rot = num(v); return true;
          case 'STYLENAME': case 'SCALEFACTOR': case 'TEXTHEIGHT': case 'PRIMARYUNITSPRECISION': return true;
        }
        break;
      case 'TABLE':
        if (P === 'INSERTIONPOINT') { setP(e, 'p', v); return true; }
        if (P === 'ROWHEIGHT') { e.rows = e.rows.map(() => num(v)); return true; }
        if (P === 'COLUMNWIDTH') { e.cols = e.cols.map(() => num(v)); return true; }
        if (P === 'ROWS') { const n = int(v); while (e.rows.length < n) { e.rows.push(e.rows[e.rows.length - 1] || 8); e.cells.push(Array(e.cols.length).fill('')); } e.rows.length = n; e.cells.length = n; return true; }
        if (P === 'COLUMNS') { const n = int(v); while (e.cols.length < n) { e.cols.push(e.cols[e.cols.length - 1] || 25); for (const r of e.cells) r.push(''); } e.cols.length = n; for (const r of e.cells) r.length = n; return true; }
        break;
      case 'XLINE': case 'RAY':
        if (P === 'BASEPOINT') { setP(e, 'p', v); return true; }
        if (P === 'SECONDPOINT') { e.dir = G.norm(G.sub(pt(v), e.p)); return true; }
        if (P === 'DIRECTIONVECTOR') { e.dir = G.norm(pt(v)); return true; }
        break;
    }
    return false;
  };
  // offset con signo: positivo hacia fuera en curvas cerradas y arcos, a la izquierda en el resto
  const offsetSigned = (e, d) => {
    const ad = Math.abs(d), eps = 1e-4;
    if (e.type === 'CIRCLE' || e.type === 'ARC') return E.offsetEnt(e, ad, G.polar(e.c, 0, d > 0 ? e.r + 1e6 : e.r * 0.5));
    if (e.type === 'ELLIPSE') return E.offsetEnt(e, ad, d > 0 ? G.add(e.c, G.mul(e.major, 1e3)) : e.c);
    const pts = E.curvePoints(e);
    const { p, a } = E.pointAtLength(pts, Math.min(eps * 10, E.entLength(e) / 2));
    let left = d > 0;
    if (e.closed) { const ccw = G.polyArea(E.polyPoints({ ...e, closed: true })) > 0; left = d > 0 ? !ccw : ccw; }
    const side = G.polar(p, a + (left ? Math.PI / 2 : -Math.PI / 2), eps);
    return E.offsetEnt(e, ad, side);
  };
  const intersect = (a, b, ext) => {
    const pa = E.prims(a, doc()), pb = E.prims(b, doc()), res = [];
    for (const p of pa) for (const q of pb) for (const x of G.primInter(p, q, !!(ext & 1), !!(ext & 2))) if (!res.some((r) => G.eq(r, x, 1e-8))) res.push(x);
    return res;
  };
  const isCurveSyms = (x) => x instanceof K.Sym;
  ENT.call = async (e, M, a) => {
    const d = doc();
    switch (M) {
      case 'DELETE': case 'ERASE': { const p = parentOf.get(e); if (p) { d.touch(p); p.attribs = p.attribs.filter((x) => x !== e); E.invalidate(p); } else { const arr = ownerArr(e); if (!arr) err('Object was erased'); if (arr === d.model || d.layouts.some((l) => l.ents === arr)) d.remove(e, arr); else { d.touchTables(); arr.splice(arr.indexOf(e), 1); const b = Object.values(d.blocks).find((x) => x.ents === arr); if (b) touchBlock(b.name); } } redraw(); return null; }
      case 'COPY': return copyInto(e, E.cloneEnt(e));
      case 'MOVE': touch(e); E.transformEnt(e, G.M.tr(pt(a[1]).x - pt(a[0]).x, pt(a[1]).y - pt(a[0]).y)); done(e); return null;
      case 'ROTATE': touch(e); E.transformEnt(e, G.M.rot(num(a[1]), pt(a[0]))); done(e); return null;
      case 'SCALEENTITY': touch(e); E.transformEnt(e, G.M.scale(num(a[1]), pt(a[0]))); done(e); return null;
      case 'MIRROR': { const c = E.cloneEnt(e); E.transformEnt(c, G.M.mirror(pt(a[0]), pt(a[1])), { mirrtext: !!d.vars.MIRRTEXT }); return copyInto(e, c); }
      case 'TRANSFORMBY': { const m = flat(a[0]).map(num); touch(e); E.transformEnt(e, [m[0], m[4], m[1], m[5], m[3], m[7]]); done(e); return null; }
      case 'OFFSET': { const r = offsetSigned(e, num(a[0])); if (!r) err('The offset of the object is invalid'); return new Arr(VT.OBJECT, [copyInto(e, r)]); }
      case 'EXPLODE': { const parts = E.explodeEnt(e, d); if (!parts) err('Invalid input'); return new Arr(VT.OBJECT, parts.map((c) => copyInto(e, c))); }
      case 'INTERSECTWITH': { const o = entOf(a[0]); const xs = intersect(e, o, int(a[1] ?? 0)); return new Arr(VT.DOUBLE, xs.flatMap((p) => [R(p.x), R(p.y), R(0)])); }
      case 'GETBOUNDINGBOX': {
        const bb = E.entBBox(e, d); if (!bb || !G.bbValid(bb)) err('Invalid extents');
        const mk = (x, y) => new Variant(VT.ARRAY | VT.DOUBLE, mkSA(VT.DOUBLE, [R(x), R(y), R(0)]));
        if (isCurveSyms(a[0])) L_.set(a[0], mk(bb.x1, bb.y1)); if (isCurveSyms(a[1])) L_.set(a[1], mk(bb.x2, bb.y2));
        return null;
      }
      case 'ARRAYPOLAR': {
        const n = int(a[0]), tot = num(a[1]), c = pt(a[2]), step = Math.abs(tot - G.TAU) < 1e-9 || tot === 0 ? G.TAU / n : tot / (n - 1), res = [];
        for (let i = 1; i < n; i++) { const k = E.cloneEnt(e); E.transformEnt(k, G.M.rot(step * i, c)); res.push(copyInto(e, k)); }
        return new Arr(VT.OBJECT, res);
      }
      case 'ARRAYRECTANGULAR': {
        const nr = int(a[0]), nc = int(a[1]), dr = num(a[3]), dc = num(a[4]), res = [];
        for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { if (!i && !j) continue; const k = E.cloneEnt(e); E.transformEnt(k, G.M.tr(j * dc, i * dr)); res.push(copyInto(e, k)); }
        return new Arr(VT.OBJECT, res);
      }
      case 'HIGHLIGHT': case 'UPDATE': redraw(); return null;
      case 'GETEXTENSIONDICTIONARY': return O('dict', xdictOf(e, true));
      case 'GETXDATA': {
        const apps = str(a[0] ?? ''); const t = [], v = [];
        for (const [app_, s] of Object.entries(e.xd || {})) {
          if (apps && !K.wcmatch(app_, apps.toUpperCase(), true)) continue;
          t.push(1001); v.push(app_);
          for (const p of deser(s) || []) { if (p instanceof Pair) { t.push(p.a); v.push(p.d); } else if (Array.isArray(p)) { t.push(p[0]); v.push(new Variant(VT.ARRAY | VT.DOUBLE, mkSA(VT.DOUBLE, p.slice(1)))); } }
        }
        if (isCurveSyms(a[1])) L_.set(a[1], t.length ? new Variant(VT.ARRAY | VT.INT, mkSA(VT.INT, t)) : null);
        if (isCurveSyms(a[2])) L_.set(a[2], v.length ? new Variant(VT.ARRAY | VT.VARIANT, mkSA(VT.VARIANT, v.map((x) => (x instanceof Variant ? x : new Variant(vtOf(x), x))))) : null);
        return null;
      }
      case 'SETXDATA': {
        const t = flat(a[0]).map(int), v = flat(a[1]).map((x) => (x instanceof Variant ? x.value : x));
        touch(e); e.xd ||= {}; let cur = null, items = [];
        const flush = () => { if (cur) e.xd[cur] = ser(L(items)); };
        for (let i = 0; i < t.length; i++) { if (t[i] === 1001) { flush(); cur = str(v[i]).toUpperCase(); items = []; } else items.push(new Pair(t[i], v[i])); }
        flush(); return null;
      }
      case 'GETATTRIBUTES': { for (const at of e.attribs || []) parentOf.set(at, e); return new Arr(VT.OBJECT, (e.attribs || []).map(ent)); }
      case 'GETCONSTANTATTRIBUTES': { const b = blkDef(e.name); return new Arr(VT.OBJECT, (b?.ents || []).filter((x) => x.type === 'ATTDEF' && x.constant).map(ent)); }
      case 'GETDYNAMICBLOCKPROPERTIES': return new Arr(VT.OBJECT, dynList(e).map(dynObj));
      case 'RESETBLOCK': { const b = blkDef(e.name); if (b?.params?.length) { d.touch(e); e.dyn = E.dynDefaults(b); E.invalidate(e); redraw(); } return null; }
      case 'CONVERTTOSTATICBLOCK': return null;
      // polilínea
      case 'ADDVERTEX': { if (e.type !== 'LWPOLYLINE') break; d.touch(e); const i = int(a[0]); const p = pt(a[1]); e.pts.splice(i, 0, { ...p, b: 0 }); done(e); return null; }
      case 'GETBULGE': return R(e.pts?.[int(a[0])]?.b || 0);
      case 'SETBULGE': { d.touch(e); const p = e.pts[int(a[0])]; if (!p) err('Invalid index'); p.b = num(a[1]); done(e); return null; }
      case 'GETWIDTH': { const p = e.pts?.[int(a[0])]; if (!p) err('Invalid index'); if (isCurveSyms(a[1])) L_.set(a[1], R(p.sw ?? e.cw_ ?? 0)); if (isCurveSyms(a[2])) L_.set(a[2], R(p.ew ?? e.cw_ ?? 0)); return null; }
      case 'SETWIDTH': { d.touch(e); const p = e.pts[int(a[0])]; if (!p) err('Invalid index'); p.sw = num(a[1]); p.ew = num(a[2]); const all = e.pts.every((q) => q.sw === p.sw && q.ew === p.sw); if (all) e.cw_ = p.sw; done(e); return null; }
      // sombreado
      case 'APPENDOUTERLOOP': case 'APPENDINNERLOOP': {
        d.touch(e); const loop = [];
        for (const o of objs(a[0])) { if (o.type === 'LWPOLYLINE') loop.push(...o.pts.map((p) => ({ x: p.x, y: p.y, b: p.b || 0 }))); else if (o.type === 'CIRCLE') { for (let i = 0; i < 2; i++) loop.push({ ...G.polar(o.c, i * Math.PI, o.r), b: 1 }); } else { for (const p of E.curvePoints(o)) if (!loop.length || !G.eq(loop[loop.length - 1], p)) loop.push({ x: p.x, y: p.y, b: 0 }); } }
        if (loop.length > 2 && G.eq(loop[0], loop[loop.length - 1])) loop.pop();
        if (M === 'APPENDOUTERLOOP') e.loops.unshift(loop); else e.loops.push(loop);
        done(e); return null;
      }
      case 'SETPATTERN': d.touch(e); e.pattern = str(a[1]).toUpperCase(); e.solid = e.pattern === 'SOLID'; done(e); return null;
      case 'EVALUATE': case 'SETGRADIENT': return null;
      // tabla
      case 'GETTEXT': case 'GETCELLVALUE': return e.cells?.[int(a[0])]?.[int(a[1])] ?? '';
      case 'SETTEXT': case 'SETCELLVALUE': { d.touch(e); const r = int(a[0]), c = int(a[1]); if (!e.cells?.[r] || c >= e.cols.length) err('Invalid index'); e.cells[r][c] = a[2] instanceof Variant ? show(a[2].value, true) : typeof a[2] === 'string' ? a[2] : show(a[2], true); done(e); return null; }
      case 'INSERTROWS': { d.touch(e); const i = int(a[0]), h = num(a[1]), n = int(a[2] ?? 1); for (let k = 0; k < n; k++) { e.rows.splice(i, 0, h); e.cells.splice(i, 0, Array(e.cols.length).fill('')); } done(e); return null; }
      case 'DELETEROWS': { d.touch(e); e.rows.splice(int(a[0]), int(a[1] ?? 1)); e.cells.splice(int(a[0]), int(a[1] ?? 1)); done(e); return null; }
      case 'INSERTCOLUMNS': { d.touch(e); const i = int(a[0]), w = num(a[1]), n = int(a[2] ?? 1); for (let k = 0; k < n; k++) { e.cols.splice(i, 0, w); for (const r of e.cells) r.splice(i, 0, ''); } done(e); return null; }
      case 'DELETECOLUMNS': { d.touch(e); e.cols.splice(int(a[0]), int(a[1] ?? 1)); for (const r of e.cells) r.splice(int(a[0]), int(a[1] ?? 1)); done(e); return null; }
      case 'SETROWHEIGHT': d.touch(e); e.rows[int(a[0])] = num(a[1]); done(e); return null;
      case 'SETCOLUMNWIDTH': d.touch(e); e.cols[int(a[0])] = num(a[1]); done(e); return null;
      case 'GETROWHEIGHT': return R(e.rows?.[int(a[0])] || 0);
      case 'GETCOLUMNWIDTH': return R(e.cols?.[int(a[0])] || 0);
      case 'MERGECELLS': case 'UNMERGECELLS': case 'SETCELLTEXTHEIGHT': case 'SETCELLALIGNMENT': case 'RECOMPUTETABLEBLOCK': case 'SETTEXTHEIGHT': return null;
      case 'ROTATE3D': case 'MIRROR3D': case 'ARRAY3D': err('Not applicable');
    }
    return undefined;
  };
  KIND.ent = {
    iface: (e) => (e.type === 'DIMENSION' ? 'Dim' + (DIMNAME[e.dt] || 'RotatedDimension').replace('Dimension', '') : ENT_IFACE[e.type] || 'Entity'),
    get: (e, P, args) => ENT.get(e, P, args),
    put(e, P, v, args) { touch(e); const ok = ENT.put(e, P, v, args); if (ok) done(e); return ok; },
    call: (e, M, a) => ENT.call(e, M, a),
  };

  // ---------- despacho genérico
  const check = (o) => { if (!(o instanceof VlaObj)) { if (o instanceof Ename && o.e) return ent(o.e); throw new LispError('bad argument type: VLA-OBJECT ' + show(o)); } if (o.kind === 'ent' && !o.ref) err('Object was erased'); return o; };
  const refOf = (o) => (o.kind === 'coll' ? o.ref : o.ref);
  function getProp(o, P, args = []) {
    o = check(o); P = String(P).toUpperCase();
    const k = KIND[o.kind]; if (!k) throw new LispError('ActiveX: objeto no válido');
    let v = k.get(refOf(o), P, args, o);
    if (v === undefined) v = common(o, P);
    if (v === undefined && P === 'OBJECTNAME') v = 'AcDb' + k.iface(o.ref);
    if (v === undefined && P === 'HANDLE' && o.kind !== 'ent') v = '0';
    if (v === undefined) err(`Unknown name: ${P}`);
    return v;
  }
  function putProp(o, P, v, args = []) {
    o = check(o); P = String(P).toUpperCase();
    const k = KIND[o.kind];
    if (!k || !k.put(refOf(o), P, v, args, o)) err(`Unknown name: ${P}`);
    return null;
  }
  async function invoke(o, M, args) {
    o = check(o); M = String(M).toUpperCase();
    const k = KIND[o.kind];
    let r = k ? await k.call(refOf(o), M, args, o) : undefined;
    if (r === undefined && M === 'ITEM' && o.kind === 'coll') r = collItem(o.ref, args[0]);
    if (r === undefined && M === 'GETEXTENSIONDICTIONARY') r = O('dict', newDict());
    if (r === undefined && (M === 'RELEASE' || M === 'UPDATE' || M === 'HIGHLIGHT')) r = null;
    if (r === undefined) err(`Unknown name: ${M}`);
    return r;
  }
  const items = (coll) => {
    if (coll instanceof Variant || coll instanceof SafeArray || Array.isArray(coll)) return flat(coll).map((x) => (x instanceof Ename ? ent(x.e) : x));
    if (coll instanceof PickSet) return coll.items.map(ent);
    if (!(coll instanceof VlaObj)) return [];
    switch (coll.kind) {
      case 'coll': return collItems(coll.ref);
      case 'blk': return blkEnts(coll.ref).map(ent);
      case 'group': return groupEnts(groupRef(coll.ref)[1]).map(ent);
      case 'ss': return coll.ref.items.map(ent);
      case 'dict': return Object.values(coll.ref.items).map((it) => (it.type === 'DICTIONARY' ? O('dict', it) : O('xrec', it)));
    }
    return [];
  };
  L_.vlaItems = items;
  L_.vlaGet = (o, prop) => out(getProp(o, prop), false);
  L_.vlaPut = (o, prop, v) => putProp(o, prop, v);
  L_.vlaObjOf = (e) => ent(e);
  VlaObj.prototype.lispShow = function () { const k = KIND[this.kind]; let n = 'Object'; try { n = k ? k.iface(this.ref) : 'Object'; } catch (_) { /* nada */ } return `#<VLA-OBJECT IWcad${n} ${(this.kind === 'ent' && this.ref?.hid ? parseInt(this.ref.hid, 16) : 1).toString(16).padStart(16, '0')}>`; };
  VlaObj.prototype.lispType = () => 'VLA-OBJECT';

  // vla-get-X / vla-put-X / vla-Metodo dinámicos
  const dynFns = new Map();
  L_.dynamicVla = function (name) {
    if (dynFns.has(name)) return dynFns.get(name);
    let f = null, m;
    if ((m = /^VLA-(GET|PUT)-(.+)$/.exec(name))) {
      const P = m[2];
      f = m[1] === 'GET' ? async function (a) { return out(getProp(a[0], P, a.slice(1)), false); } : async function (a) { return putProp(a[0], P, a[a.length - 1], a.slice(1, -1)); };
    } else if ((m = /^VLA-(.+)$/.exec(name))) {
      const M = m[1];
      f = async function (a) { return out(await invoke(a[0], M, a.slice(1)), false); };
    }
    if (f) { f.lname = name.toLowerCase(); dynFns.set(name, f); }
    return f;
  };

  // ---------- funciones vlax-*
  const def = (names, f) => { for (const n of names.split(' ')) { const g = function (args) { return f.call(this, args, this); }; g.lname = n; L_.g.set(n.toUpperCase(), g); } };
  const pname = (x) => (x instanceof K.Sym ? x.name : str(x));
  for (const [k, v] of Object.entries(AX_CONSTANTS)) L_.g.set(k.toUpperCase(), v);
  L_.g.set(':VLAX-TRUE', VTRUE); L_.g.set(':VLAX-FALSE', VFALSE); L_.g.set(':VLAX-NULL', VNULL);
  def('vlax-get-acad-object', () => O('acad', 'APP'));
  def('vla-get-activedocument', (a) => (a[0] ? getProp(a[0], 'ACTIVEDOCUMENT') : O('doc', 'ACTIVE')));
  def('vlax-ename->vla-object', (a) => (a[0] instanceof Ename && a[0].e ? (a[0].parent && parentOf.set(a[0].e, a[0].parent), ent(a[0].e)) : a[0] instanceof Ename ? null : (() => { throw new LispError('bad argument type: lentityp ' + show(a[0])); })()));
  def('vlax-vla-object->ename', (a) => (a[0] instanceof VlaObj && a[0].kind === 'ent' ? new Ename(a[0].ref, parentOf.get(a[0].ref) || null) : null));
  def('vlax-get-property', (a) => out(getProp(a[0], pname(a[1]), a.slice(2)), false));
  def('vlax-get', (a) => out(getProp(a[0], pname(a[1]), a.slice(2)), true));
  def('vlax-put-property vlax-put', (a) => putProp(a[0], pname(a[1]), a[a.length - 1], a.slice(2, -1)));
  def('vlax-invoke-method', async (a) => out(await invoke(a[0], pname(a[1]), a.slice(2)), false));
  def('vlax-invoke', async (a) => out(await invoke(a[0], pname(a[1]), a.slice(2)), true));
  def('vlax-property-available-p', (a) => { try { const o = check(a[0]); const P = pname(a[1]).toUpperCase(); getProp(o, P); return truthyish(a[2]) && !canWrite(o, P) ? null : T; } catch (_) { return null; } });
  const truthyish = (x) => x != null && x !== VFALSE;
  const READONLY = new Set(['HANDLE', 'OBJECTNAME', 'OBJECTID', 'OBJECTID32', 'OWNERID', 'LENGTH', 'ARCLENGTH', 'TOTALANGLE', 'DELTA', 'ANGLE', 'MEASUREMENT', 'EFFECTIVENAME', 'HASATTRIBUTES', 'ISDYNAMICBLOCK', 'COUNT', 'APPLICATION', 'DOCUMENT', 'ENTITYTYPE', 'ENTITYNAME', 'NUMBEROFFITPOINTS', 'NUMBEROFCONTROLPOINTS', 'NUMBEROFLOOPS', 'MINORAXIS', 'USED', 'ISLAYOUT', 'ISXREF']);
  const canWrite = (o, P) => !READONLY.has(P) && !(P === 'AREA' && o.ref?.type !== 'CIRCLE');
  const METHODS = {
    ent: ['DELETE', 'COPY', 'MOVE', 'ROTATE', 'SCALEENTITY', 'MIRROR', 'TRANSFORMBY', 'GETBOUNDINGBOX', 'INTERSECTWITH', 'HIGHLIGHT', 'UPDATE', 'GETEXTENSIONDICTIONARY', 'GETXDATA', 'SETXDATA', 'ARRAYPOLAR', 'ARRAYRECTANGULAR'],
    curve: ['OFFSET', 'EXPLODE'], INSERT: ['GETATTRIBUTES', 'GETCONSTANTATTRIBUTES', 'GETDYNAMICBLOCKPROPERTIES', 'RESETBLOCK', 'EXPLODE', 'CONVERTTOSTATICBLOCK'],
    LWPOLYLINE: ['ADDVERTEX', 'GETBULGE', 'SETBULGE', 'GETWIDTH', 'SETWIDTH'], HATCH: ['APPENDOUTERLOOP', 'APPENDINNERLOOP', 'SETPATTERN', 'EVALUATE'],
    TABLE: ['GETTEXT', 'SETTEXT', 'GETCELLVALUE', 'SETCELLVALUE', 'INSERTROWS', 'DELETEROWS', 'INSERTCOLUMNS', 'DELETECOLUMNS', 'SETROWHEIGHT', 'SETCOLUMNWIDTH', 'GETROWHEIGHT', 'GETCOLUMNWIDTH', 'EXPLODE'],
    blk: ['ITEM', 'ADDLINE', 'ADDCIRCLE', 'ADDARC', 'ADDLIGHTWEIGHTPOLYLINE', 'ADDPOLYLINE', 'ADD3DPOLY', 'ADDPOINT', 'ADDTEXT', 'ADDMTEXT', 'ADDELLIPSE', 'ADDSPLINE', 'ADDRAY', 'ADDXLINE', 'ADDSOLID', 'ADDHATCH', 'ADDDIMALIGNED', 'ADDDIMROTATED', 'ADDDIMRADIAL', 'ADDDIMDIAMETRIC', 'ADDDIMANGULAR', 'ADDDIM3POINTANGULAR', 'ADDDIMORDINATE', 'ADDLEADER', 'ADDTABLE', 'ADDATTRIBUTE', 'INSERTBLOCK', 'DELETE'],
    coll: ['ITEM', 'ADD', 'REMOVE'], ss: ['ITEM', 'SELECT', 'SELECTONSCREEN', 'SELECTATPOINT', 'SELECTBYPOLYGON', 'ADDITEMS', 'REMOVEITEMS', 'CLEAR', 'DELETE', 'ERASE', 'HIGHLIGHT', 'UPDATE'],
    doc: ['GETVARIABLE', 'SETVARIABLE', 'SENDCOMMAND', 'POSTCOMMAND', 'STARTUNDOMARK', 'ENDUNDOMARK', 'REGEN', 'HANDLETOOBJECT', 'OBJECTIDTOOBJECT', 'PURGEALL', 'SAVE', 'SAVEAS', 'AUDITINFO'],
    acad: ['ZOOMEXTENTS', 'ZOOMALL', 'ZOOMWINDOW', 'ZOOMCENTER', 'ZOOMSCALED', 'ZOOMPREVIOUS', 'UPDATE', 'GETINTERFACEOBJECT', 'LOADARX', 'UNLOADARX', 'LISTARX', 'EVAL', 'QUIT'],
    util: ['GETPOINT', 'GETCORNER', 'GETDISTANCE', 'GETANGLE', 'GETORIENTATION', 'GETREAL', 'GETINTEGER', 'GETSTRING', 'GETKEYWORD', 'GETINPUT', 'INITIALIZEUSERINPUT', 'GETENTITY', 'GETSUBENTITY', 'PROMPT', 'ANGLETOREAL', 'ANGLETOSTRING', 'DISTANCETOREAL', 'REALTOSTRING', 'POLARPOINT', 'ANGLEFROMXAXIS', 'TRANSLATECOORDINATES', 'CREATETYPEDARRAY'],
    layer: ['DELETE', 'GETEXTENSIONDICTIONARY'], group: ['ITEM', 'APPENDITEMS', 'REMOVEITEMS', 'DELETE', 'HIGHLIGHT', 'UPDATE'], layout: ['DELETE', 'GETPAPERSIZE', 'GETCANONICALMEDIANAMES', 'GETPLOTDEVICENAMES', 'GETPLOTSTYLETABLENAMES', 'COPYFROM', 'REFRESHPLOTDEVICEINFO'],
    dict: ['ITEM', 'GETOBJECT', 'ADDXRECORD', 'ADDOBJECT', 'REMOVE', 'RENAME', 'GETNAME', 'DELETE'], xrec: ['SETXRECORDDATA', 'GETXRECORDDATA', 'DELETE'], color: ['SETRGB', 'SETCOLORBOOKCOLOR', 'SETNAMES'],
    summary: ['NUMCUSTOMINFO', 'ADDCUSTOMINFO', 'GETCUSTOMBYKEY', 'GETCUSTOMBYINDEX', 'SETCUSTOMBYKEY', 'REMOVECUSTOMBYKEY', 'REMOVECUSTOMBYINDEX', 'SETCUSTOMBYINDEX'], style: ['SETFONT', 'GETFONT', 'DELETE'],
  };
  const NICE = Object.fromEntries(('ScaleEntity TransformBy GetBoundingBox IntersectWith GetExtensionDictionary GetXData SetXData ArrayPolar ArrayRectangular GetAttributes GetConstantAttributes GetDynamicBlockProperties ResetBlock ConvertToStaticBlock AddVertex GetBulge SetBulge GetWidth SetWidth AppendOuterLoop AppendInnerLoop SetPattern GetText SetText GetCellValue SetCellValue InsertRows DeleteRows InsertColumns DeleteColumns SetRowHeight SetColumnWidth GetRowHeight GetColumnWidth '
    + 'AddLine AddCircle AddArc AddLightWeightPolyline AddPolyline Add3DPoly AddPoint AddText AddMText AddEllipse AddSpline AddRay AddXline AddSolid AddHatch AddDimAligned AddDimRotated AddDimRadial AddDimDiametric AddDimAngular AddDim3PointAngular AddDimOrdinate AddLeader AddTable AddAttribute InsertBlock SelectOnScreen SelectAtPoint SelectByPolygon AddItems RemoveItems '
    + 'GetVariable SetVariable SendCommand PostCommand StartUndoMark EndUndoMark HandleToObject ObjectIdToObject PurgeAll SaveAs AuditInfo ZoomExtents ZoomAll ZoomWindow ZoomCenter ZoomScaled ZoomPrevious GetInterfaceObject LoadArx UnloadArx ListArx GetPoint GetCorner GetDistance GetAngle GetOrientation GetReal GetInteger GetString GetKeyword GetInput InitializeUserInput GetEntity GetSubEntity '
    + 'AngleToReal AngleToString DistanceToReal RealToString PolarPoint AngleFromXAxis TranslateCoordinates CreateTypedArray AppendItems GetPaperSize GetCanonicalMediaNames GetPlotDeviceNames GetPlotStyleTableNames CopyFrom RefreshPlotDeviceInfo GetObject AddXRecord AddObject GetName SetXRecordData GetXRecordData SetRGB SetColorBookColor SetNames NumCustomInfo AddCustomInfo GetCustomByKey GetCustomByIndex SetCustomByKey RemoveCustomByKey RemoveCustomByIndex SetCustomByIndex SetFont GetFont').split(' ').map((n) => [n.toUpperCase(), n]));
  const methodsOf = (o) => {
    if (o.kind !== 'ent') return METHODS[o.kind] || [];
    const e = o.ref; let m = METHODS.ent.slice();
    if (curveObj(e) || e.type === 'INSERT' || e.type === 'HATCH' || e.type === 'MTEXT' || e.type === 'DIMENSION' || e.type === 'LEADER') m = m.concat(METHODS.curve);
    return m.concat(METHODS[e.type] || []);
  };
  def('vlax-method-applicable-p', (a) => { try { const o = check(a[0]); return methodsOf(o).includes(pname(a[1]).toUpperCase()) ? T : null; } catch (_) { return null; } });
  def('vlax-typeinfo-available-p vlax-read-enabled-p', (a) => (a[0] instanceof VlaObj ? T : null));
  def('vlax-write-enabled-p', (a) => (a[0] instanceof VlaObj && !(a[0].kind === 'ent' && doc().isLocked?.(a[0].ref)) ? T : null));
  def('vlax-object-released-p', (a) => (a[0] instanceof VlaObj ? null : T));
  def('vlax-erased-p', (a) => { const e = a[0] instanceof VlaObj ? a[0].ref : a[0]?.e; if (!e) return T; if (parentOf.get(e)) return parentOf.get(e).attribs?.includes(e) && doc().ownerOf(parentOf.get(e)) ? null : T; return doc().ownerOf(e) ? null : T; });
  def('vlax-release-object', () => null);
  def('vlax-dump-object', function (a) {
    const o = check(a[0]); const k = KIND[o.kind];
    this.write(`; IWcad${k.iface(o.ref)}: ${k.iface(o.ref)}\n; Property values:\n`);
    const props = PROPS_DUMP[o.kind === 'ent' ? o.ref.type : o.kind] || [];
    for (const P of ['Application', 'Document', 'Handle', 'Layer', 'Linetype', 'ObjectName', ...props]) { try { const v = out(getProp(o, P.toUpperCase()), false); if (o.kind !== 'ent' && ['Layer', 'Linetype'].includes(P)) continue; this.write(`;   ${P}${canWrite(o, P.toUpperCase()) ? '' : ' (RO)'} = ${v instanceof Variant ? show(fromVariant(v)) : show(v)}\n`); } catch (_) { /* propiedad no aplicable */ } }
    if (truthyish(a[1])) { this.write('; Methods supported:\n'); for (const m of methodsOf(o)) this.write(`;   ${NICE[m] || m.charAt(0) + m.slice(1).toLowerCase()}\n`); }
    return T;
  });
  const PROPS_DUMP = {
    LINE: ['StartPoint', 'EndPoint', 'Length', 'Angle', 'Color', 'Lineweight'], CIRCLE: ['Center', 'Radius', 'Diameter', 'Area', 'Circumference'], ARC: ['Center', 'Radius', 'StartAngle', 'EndAngle', 'ArcLength'],
    LWPOLYLINE: ['Coordinates', 'Closed', 'ConstantWidth', 'Elevation', 'Length', 'Area'], TEXT: ['TextString', 'InsertionPoint', 'Height', 'Rotation', 'StyleName', 'Alignment'],
    MTEXT: ['TextString', 'InsertionPoint', 'Height', 'Width', 'AttachmentPoint'], INSERT: ['Name', 'EffectiveName', 'InsertionPoint', 'Rotation', 'XScaleFactor', 'YScaleFactor', 'HasAttributes', 'IsDynamicBlock'],
    ATTRIB: ['TagString', 'TextString', 'InsertionPoint', 'Height'], layer: ['Name', 'Color', 'Linetype', 'Lineweight', 'LayerOn', 'Freeze', 'Lock', 'Plottable', 'Description'],
    blk: ['Name', 'Count', 'Origin', 'IsLayout', 'IsXRef', 'IsDynamicBlock'], doc: ['Name', 'FullName', 'Path', 'Saved', 'ActiveSpace'], acad: ['Name', 'Version', 'Caption'],
  };
  // safearrays y variants
  def('vlax-make-safearray', (a) => { const type = int(a[0]); const dims = a.slice(1).map((p) => [int(p instanceof Pair ? p.a : p[0]), int(p instanceof Pair ? p.d : p[1])]); const n = dims.reduce((s, [l, u]) => s * Math.max(0, u - l + 1), 1); return new SafeArray(type, dims, Array.from({ length: n }, () => deflt(type))); });
  def('vlax-safearray-fill', (a) => { const sa = a[0]; if (!(sa instanceof SafeArray)) throw new LispError('bad argument type: safearrayp ' + show(sa)); const v = sa.dims.length > 1 ? (a[1] || []).flat() : a[1] || []; if (v.length > sa.data.length) throw new LispError('Error: too many elements'); v.forEach((x, i) => (sa.data[i] = coerce(sa.type, x))); return sa; });
  def('vlax-safearray->list', (a) => { const x = a[0] instanceof Variant ? a[0].value : a[0]; if (x instanceof SafeArray) { if (!x.size) throw new LispError('Safearray is empty'); return saList(x); } if (Array.isArray(x)) return x; throw new LispError('bad argument type: safearrayp ' + show(a[0])); });
  def('vlax-safearray-get-dim', (a) => sa(a[0]).dims.length);
  def('vlax-safearray-get-l-bound', (a) => { const d = sa(a[0]).dims[int(a[1]) - 1]; if (!d) throw new LispError('Error: bad dimension'); return d[0]; });
  def('vlax-safearray-get-u-bound', (a) => { const d = sa(a[0]).dims[int(a[1]) - 1]; if (!d) throw new LispError('Error: bad dimension'); return d[1]; });
  def('vlax-safearray-type', (a) => sa(a[0]).type);
  const sa = (x) => { if (x instanceof Variant) x = x.value; if (!(x instanceof SafeArray)) throw new LispError('bad argument type: safearrayp ' + show(x)); return x; };
  const saIndex = (s, idx) => { let k = 0; s.dims.forEach(([l, u], d) => { const i = int(idx[d]); if (i < l || i > u) throw new LispError('Error: index out of range'); k = k * (u - l + 1) + (i - l); }); return k; };
  def('vlax-safearray-get-element', (a) => { const s = sa(a[0]); return s.data[saIndex(s, a.slice(1))]; });
  def('vlax-safearray-put-element', (a) => { const s = sa(a[0]); const v = a[a.length - 1]; s.data[saIndex(s, a.slice(1, -1))] = coerce(s.type, v); return v; });
  def('vlax-make-variant', (a) => { const v = a[0] ?? null; let type = a.length > 1 ? int(a[1]) : vtOf(v); let val = v; if (a.length > 1 && !(v instanceof SafeArray)) val = coerce(type & ~VT.ARRAY, v); if (v === T) { type = a.length > 1 ? type : VT.BOOL; val = a.length > 1 ? val : VTRUE; } return new Variant(type, val); });
  def('vlax-variant-type', (a) => (a[0] instanceof Variant ? a[0].type : vtOf(a[0])));
  def('vlax-variant-value', (a) => (a[0] instanceof Variant ? a[0].value : a[0]));
  def('vlax-variant-change-type', (a) => { const v = a[0] instanceof Variant ? a[0].value : a[0], t = int(a[1]); try { return new Variant(t, t === VT.STRING ? (typeof v === 'string' ? v : isNum(v) ? (v instanceof Real ? K.fmtReal(v.v) : String(v)) : show(v, true)) : t === VT.DOUBLE || t === VT.SINGLE ? R(typeof v === 'string' ? parseFloat(v) : num(v)) : t === VT.INT || t === VT.LONG ? (typeof v === 'string' ? parseInt(v, 10) : Math.round(num(v))) : t === VT.BOOL ? (bool(v) ? VTRUE : VFALSE) : v); } catch (_) { return null; } });
  def('vlax-3d-point', (a) => { const v = Array.isArray(a[0]) ? a[0] : a; return new Variant(VT.ARRAY | VT.DOUBLE, mkSA(VT.DOUBLE, [R(num(v[0])), R(num(v[1])), R(num(v[2] ?? 0))])); });
  def('vlax-tmatrix', (a) => { const rows = a[0] || []; const s = new SafeArray(VT.DOUBLE, [[0, 3], [0, 3]], rows.flat().map((x) => R(num(x)))); return new Variant(VT.ARRAY | VT.DOUBLE, s); });
  def('vlax-create-object vlax-get-object vlax-get-or-create-object', () => null);
  def('vlax-import-type-library', () => T);
  def('vlax-product-key', () => 'Software\\WebCAD\\4.1');
  def('vlax-add-cmd', function (a) { const name = str(a[0]).toUpperCase(); const f = a[1] instanceof K.Sym ? this.get(a[1]) : a[1]; if (!f) return null; L_.g.set('C:' + name, f); return name; });
  def('vlax-remove-cmd', (a) => { const n = 'C:' + str(a[0]).toUpperCase(); return L_.g.delete(n) ? T : null; });
  // vlax-for sobre cualquier colección
  L_.vlaxForItems = items;

  // ---------- ldata (datos LISP persistentes en el dibujo)
  const ldStore = (o, create) => {
    if (typeof o === 'string') { const D = dicts(); const k = ci(D, o) || (create ? o : null); if (!k) return null; D[k] ||= newDict(); return D[k].items; }
    if (o instanceof VlaObj && o.kind === 'ent') { if (!o.ref.ldata && create) o.ref.ldata = {}; return o.ref.ldata || null; }
    if (o instanceof Ename && o.e) { if (!o.e.ldata && create) o.e.ldata = {}; return o.e.ldata || null; }
    if (o instanceof VlaObj && o.kind === 'dict') return o.ref.items;
    throw new LispError('bad argument type: ' + show(o));
  };
  const ldKey = (s, k) => ci(s, k);
  def('vlax-ldata-put', (a) => { const s = ldStore(a[0], true); const k = ldKey(s, str(a[1])) || str(a[1]); s[k] = { type: 'LDATA', data: ser(a[2]) }; doc().modified = true; return a[2]; });
  def('vlax-ldata-get', (a) => { const s = ldStore(a[0], false); const k = s && ldKey(s, str(a[1])); if (!k) return a.length > 2 ? a[2] : null; const it = s[k]; return it?.type === 'LDATA' ? deser(it.data) : it?.type === 'XRECORD' ? deser(it.data) : null; });
  def('vlax-ldata-delete', (a) => { const s = ldStore(a[0], false); const k = s && ldKey(s, str(a[1])); if (!k) return null; delete s[k]; return T; });
  def('vlax-ldata-list', (a) => { const s = ldStore(a[0], false); if (!s) return null; return L(Object.entries(s).filter(([, v]) => v.type === 'LDATA').map(([k, v]) => { const d = deser(v.data); return Array.isArray(d) ? [k, ...d] : new Pair(k, d); })); });
  def('vlax-ldata-test', (a) => (a[0] instanceof VlaObj || a[0] instanceof Ename || a[0] instanceof PickSet ? null : T));

  // ---------- diccionarios con entget / dictsearch (namedobjdict)
  const NOD = () => { const d = doc(); d.dicts ||= {}; return d._nod ||= { type: 'DICTIONARY', get items() { return d.dicts; } }; };
  const dictOf = (en) => { const e = en instanceof Ename ? en.e : en instanceof VlaObj ? en.ref : null; if (!e || e.type !== 'DICTIONARY') throw new LispError('bad argument type: lentityp ' + show(en)); return e; };
  def('namedobjdict', () => new Ename(NOD()));
  def('dictsearch', function (a) { const D = dictOf(a[0]); const k = ci(D.items, str(a[1])); if (!k) return null; const r = this.entget(new Ename(D.items[k])); if (truthyish(a[2])) D._iter = Object.keys(D.items).indexOf(k) + 1; return r; });
  def('dictnext', function (a) { const D = dictOf(a[0]); const ks = Object.keys(D.items); if (truthyish(a[1]) || D._iter == null) D._iter = 0; const k = ks[D._iter++]; return k == null ? null : this.entget(new Ename(D.items[k])); });
  def('dictadd', (a) => { const D = dictOf(a[0]); const k = str(a[1]); if (ci(D.items, k)) throw new LispError('dictadd: duplicate key'); const it = a[2] instanceof Ename ? a[2].e : null; if (!it) return null; D.items[k] = it; doc().modified = true; return a[2]; });
  def('dictremove', (a) => { const D = dictOf(a[0]); const k = ci(D.items, str(a[1])); if (!k) return null; const it = D.items[k]; delete D.items[k]; return new Ename(it); });
  def('dictrename', (a) => { const D = dictOf(a[0]); const k = ci(D.items, str(a[1])); if (!k || ci(D.items, str(a[2]))) return null; D.items[str(a[2])] = D.items[k]; delete D.items[k]; return a[2]; });
  const origEntget = L_.entget.bind(L_);
  L_.entget = function (en, apps) {
    const e = en.e;
    if (e && e.type === 'DICTIONARY') { const r = [new Pair(-1, en), new Pair(0, 'DICTIONARY'), new Pair(100, 'AcDbDictionary'), new Pair(280, 0), new Pair(281, 1)]; for (const [k, v] of Object.entries(e.items)) { r.push(new Pair(3, k), new Pair(350, new Ename(v))); } return r; }
    if (e && (e.type === 'XRECORD' || e.type === 'LDATA')) { const d = deser(e.data); return [new Pair(-1, en), new Pair(0, 'XRECORD'), new Pair(100, 'AcDbXrecord'), new Pair(280, 1), ...(e.type === 'LDATA' ? [new Pair(1, show(d))] : d || [])]; }
    const r = origEntget(en);
    if (r && apps && e?.xd) {
      const xs = [];
      for (const ap of apps) for (const [k, s] of Object.entries(e.xd)) if (K.wcmatch(k, String(ap).toUpperCase(), true) && !xs.some((x) => x[0] === k)) xs.push([k, ...(deser(s) || [])]);
      if (xs.length) r.push([-3, ...xs]);
    }
    return r;
  };
  def('entget', function (a) { return a[0] instanceof Ename ? this.entget(a[0], a[1] || null) : null; });
  // entmod/entmake con datos extendidos (-3) y XRECORD/DICTIONARY
  const xdFrom = (lst) => { const x = (lst || []).find((it) => Array.isArray(it) && it[0] === -3); return x ? x.slice(1) : null; };
  const setXd = (e, xs) => { e.xd ||= {}; for (const grp of xs) { const app_ = str(grp[0]).toUpperCase(); const rest = grp.slice(1); if (rest.length) e.xd[app_] = ser(L(rest)); else delete e.xd[app_]; } };
  const origEntmod = L_.g.get('ENTMOD'), origEntmake = L_.g.get('ENTMAKE');
  def('entmod', function (a) {
    const lst = a[0]; const en = (lst || []).find((x) => x instanceof Pair && x.a === -1)?.d;
    if (en instanceof Ename && en.e && (en.e.type === 'XRECORD')) { en.e.data = ser(L(lst.filter((x) => !(x instanceof Pair && [-1, 0, 5, 100, 102, 330, 280].includes(x.a))))); return lst; }
    const r = origEntmod.call(this, a);
    const xs = xdFrom(lst); if (r && xs && en?.e) setXd(en.e, xs);
    return r;
  });
  const makeImpl = async function (a, isX) {
    const lst = a[0];
    const typ = String((lst || []).find((x) => x instanceof Pair && x.a === 0)?.d || '').toUpperCase();
    if (typ === 'XRECORD') { const e = { type: 'XRECORD', data: ser(L(lst.filter((x) => !(x instanceof Pair && [0, 5, 100, 102, 330, 280].includes(x.a))))) }; return isX ? new Ename(e) : lst; }
    if (typ === 'DICTIONARY') { const e = newDict(); return isX ? new Ename(e) : lst; }
    const sp = doc().space, before = sp.length, bd = this.blockDef, lastBlk = bd?.ents.length ?? 0;
    const r = await origEntmake.call(this, a);
    let made = null;
    if (r && bd && this.blockDef === bd && bd.ents.length > lastBlk) made = bd.ents[bd.ents.length - 1];
    else if (r && sp.length > before) made = sp[sp.length - 1];
    else if (r && this._poly === null && typ === 'SEQEND') made = sp[sp.length - 1];
    const xs = xdFrom(lst); if (made && xs) setXd(made, xs);
    if (isX && r && typeof r !== 'string') return made ? new Ename(made) : null;
    return r;
  };
  def('entmake', function (a) { return makeImpl.call(this, a, false); });
  def('entmakex', function (a) { return makeImpl.call(this, a, true); });
  def('xdroom', () => 16383);
  def('xdsize', (a) => show(a[0]).length);
  // conjunto de selección activo (vla-get-activeselectionset)
  const origSsget = L_.g.get('SSGET');
  L_.g.set('SSGET', async function (a) { const r = await origSsget.call(this, a); L_._activeSS = r instanceof PickSet ? r.items.slice() : []; return r; });
  // getpropertyvalue / setpropertyvalue (AutoCAD 2012+)
  const objArg = (x) => (x instanceof Ename ? (x.e ? ent(x.e) : null) : x);
  def('getpropertyvalue', (a) => { const o = objArg(a[0]); const v = out(getProp(o, pname(a[1]).replace(/[/]/g, ''), a.slice(2)), true); return v; });
  def('setpropertyvalue', (a) => { const o = objArg(a[0]); putProp(o, pname(a[1]).replace(/[/]/g, ''), a[a.length - 1], a.slice(2, -1)); return null; });
  def('ispropertyreadonly', (a) => { const o = objArg(a[0]); const P = pname(a[1]).toUpperCase(); try { getProp(o, P); } catch (_) { throw new LispError('ADS request error'); } return canWrite(o, P) ? 0 : 1; });
  def('dumpallproperties', function (a) { const o = objArg(a[0]); return L_.g.get('VLAX-DUMP-OBJECT').call(this, [o]); });

  // ---------- vlax-curve-*: parámetros como en AutoCAD (línea: distancia; arco/círculo/elipse: ángulo; polilínea: índice de vértice)
  const curveOf = (o) => {
    const e = o instanceof Ename ? o.e : o instanceof VlaObj && o.kind === 'ent' ? o.ref : null;
    if (!e) throw new LispError('bad argument type: curve ' + show(o));
    if (e._curve) return e._curve;
    const pcs = [];
    const Lp = (a, b, t0, t1) => pcs.push({ k: 'L', a, b, t0, t1, len: G.dist(a, b) });
    const Ap = (c, r, s, sw, t0, t1) => pcs.push({ k: 'A', c, r, s, sw, t0, t1, len: Math.abs(sw) * r });
    switch (e.type) {
      case 'LINE': Lp(e.p1, e.p2, 0, G.dist(e.p1, e.p2)); break;
      case 'CIRCLE': Ap(e.c, e.r, 0, G.TAU, 0, G.TAU); break;
      case 'ARC': { const a1 = G.normA(e.a1), sw = G.arcSweep(e.a1, e.a2); Ap(e.c, e.r, a1, sw, a1, a1 + sw); break; }
      case 'LWPOLYLINE': for (const sg of E.polySegs(e)) { if (sg.k === 'L') Lp(sg.a, sg.b, sg.i, sg.i + 1); else { const sw = G.arcSweep(sg.a1, sg.a2); if (sg.cw) Ap(sg.c, sg.r, sg.a2, -sw, sg.i, sg.i + 1); else Ap(sg.c, sg.r, sg.a1, sw, sg.i, sg.i + 1); } } break;
      case 'ELLIPSE': { const a1 = e.a1 ?? 0; let a2 = e.a2 ?? G.TAU; if (a2 <= a1) a2 += G.TAU; const n = 256, mn = G.mul(G.perp(e.major), e.ratio); const at = (t) => G.add(e.c, G.add(G.mul(e.major, Math.cos(t)), G.mul(mn, Math.sin(t)))); for (let i = 0; i < n; i++) { const t0 = a1 + (a2 - a1) * i / n, t1 = a1 + (a2 - a1) * (i + 1) / n; Lp(at(t0), at(t1), t0, t1); } break; }
      default: { const p = E.curvePoints(e); let d = 0; for (let i = 1; i < p.length; i++) { const l = G.dist(p[i - 1], p[i]); Lp(p[i - 1], p[i], d, d + l); d += l; } }
    }
    if (!pcs.length) throw new LispError('bad argument type: curve ' + show(o));
    let acc = 0; for (const q of pcs) { q.d0 = acc; acc += q.len; }
    const c = { e, pcs, len: acc };
    Object.defineProperty(e, '_curve', { value: c, enumerable: true, configurable: true, writable: true });
    return c;
  };
  const pAt = (q, f) => (q.k === 'L' ? G.lerp(q.a, q.b, f) : G.polar(q.c, q.s + f * q.sw, q.r));
  const pieceAtT = (c, t) => { for (const q of c.pcs) if (t <= q.t1 + 1e-12) return [q, Math.max(0, q.t1 > q.t0 ? (t - q.t0) / (q.t1 - q.t0) : 0)]; const q = c.pcs[c.pcs.length - 1]; return [q, 1]; };
  const pieceAtD = (c, d) => { for (const q of c.pcs) if (d <= q.d0 + q.len + 1e-12) return [q, q.len ? Math.max(0, (d - q.d0) / q.len) : 0]; const q = c.pcs[c.pcs.length - 1]; return [q, 1]; };
  const nearest = (c, p) => {
    let best = null;
    for (const q of c.pcs) {
      let f;
      if (q.k === 'L') { const v = G.sub(q.b, q.a), l2 = G.dot(v, v); f = l2 ? Math.max(0, Math.min(1, G.dot(G.sub(p, q.a), v) / l2)) : 0; }
      else { let da = G.ang(q.c, p) - q.s; if (q.sw < 0) da = -da; da = G.normA(da); const sw = Math.abs(q.sw); f = da <= sw ? da / sw : (G.TAU - da < da - sw ? 0 : 1); }
      const x = pAt(q, f), dd = G.dist(x, p);
      if (!best || dd < best.d - 1e-12) best = { q, f, p: x, d: dd };
    }
    return best;
  };
  const tOf = (q, f) => q.t0 + f * (q.t1 - q.t0);
  const PL = (p) => [R(p.x), R(p.y), R(0)];
  const tol = (c) => 1e-6 * Math.max(1, c.len);
  def('vlax-curve-getstartparam', (a) => R(curveOf(a[0]).pcs[0].t0));
  def('vlax-curve-getendparam', (a) => { const c = curveOf(a[0]); return R(c.pcs[c.pcs.length - 1].t1); });
  def('vlax-curve-getstartpoint', (a) => PL(pAt(curveOf(a[0]).pcs[0], 0)));
  def('vlax-curve-getendpoint', (a) => { const c = curveOf(a[0]); return PL(pAt(c.pcs[c.pcs.length - 1], 1)); });
  def('vlax-curve-getpointatparam', (a) => { const c = curveOf(a[0]), t = num(a[1]); if (t < c.pcs[0].t0 - 1e-9 || t > c.pcs[c.pcs.length - 1].t1 + 1e-9) return null; const [q, f] = pieceAtT(c, t); return PL(pAt(q, f)); });
  def('vlax-curve-getpointatdist', (a) => { const c = curveOf(a[0]), d = num(a[1]); if (d < -1e-9 || d > c.len + 1e-9) return null; const [q, f] = pieceAtD(c, d); return PL(pAt(q, f)); });
  def('vlax-curve-getdistatparam', (a) => { const c = curveOf(a[0]), t = num(a[1]); if (t < c.pcs[0].t0 - 1e-9 || t > c.pcs[c.pcs.length - 1].t1 + 1e-9) return null; const [q, f] = pieceAtT(c, t); return R(q.d0 + f * q.len); });
  def('vlax-curve-getparamatdist', (a) => { const c = curveOf(a[0]), d = num(a[1]); if (d < -1e-9 || d > c.len + 1e-9) return null; const [q, f] = pieceAtD(c, d); return R(tOf(q, f)); });
  def('vlax-curve-getclosestpointto vlax-curve-getclosestpointtoprojection', (a) => { const c = curveOf(a[0]); const p = pt(a[1]); if (truthyish(a[a.length - 1]) && a.length > 2 && c.e.type === 'LINE') { const v = G.norm(G.sub(c.e.p2, c.e.p1)); return PL(G.add(c.e.p1, G.mul(v, G.dot(G.sub(p, c.e.p1), v)))); } return PL(nearest(c, p).p); });
  def('vlax-curve-getparamatpoint', (a) => { const c = curveOf(a[0]); const n = nearest(c, pt(a[1])); return n.d > tol(c) ? null : R(tOf(n.q, n.f)); });
  def('vlax-curve-getdistatpoint', (a) => { const c = curveOf(a[0]); const n = nearest(c, pt(a[1])); return n.d > tol(c) ? null : R(n.q.d0 + n.f * n.q.len); });
  const deriv = (q, f, k) => {
    const dt = q.t1 - q.t0 || 1;
    if (q.k === 'L') return k === 1 ? G.mul(G.sub(q.b, q.a), 1 / dt) : { x: 0, y: 0 };
    const th = q.s + f * q.sw, m = q.r * q.sw / dt;
    return k === 1 ? { x: -Math.sin(th) * m, y: Math.cos(th) * m } : { x: -Math.cos(th) * m * q.sw / dt, y: -Math.sin(th) * m * q.sw / dt };
  };
  def('vlax-curve-getfirstderiv', (a) => { const [q, f] = pieceAtT(curveOf(a[0]), num(a[1])); return PL(deriv(q, f, 1)); });
  def('vlax-curve-getsecondderiv', (a) => { const [q, f] = pieceAtT(curveOf(a[0]), num(a[1])); return PL(deriv(q, f, 2)); });
  def('vlax-curve-getarea', (a) => { const c = curveOf(a[0]); const e = c.e; if (e.type === 'ARC') { const s = G.arcSweep(e.a1, e.a2); return R(e.r * e.r * (s - Math.sin(s)) / 2); } if (e.type === 'LINE') return R(0); if (e.type === 'LWPOLYLINE' || e.type === 'SPLINE' || e.type === 'ELLIPSE') { const p = E.curvePoints(e); return R(Math.abs(G.polyArea(p))); } return R(E.entArea(e)); });
  def('vlax-curve-isclosed', (a) => { const c = curveOf(a[0]), e = c.e; if (e.type === 'CIRCLE' || e.closed) return T; if (e.type === 'ELLIPSE') return Math.abs(G.arcSweep(e.a1 ?? 0, e.a2 ?? G.TAU) - G.TAU) < 1e-9 || (e.a2 ?? G.TAU) - (e.a1 ?? 0) >= G.TAU - 1e-9 ? T : null; return c.len > 0 && G.eq(pAt(c.pcs[0], 0), pAt(c.pcs[c.pcs.length - 1], 1), 1e-9) ? T : null; });
  def('vlax-curve-isperiodic', (a) => { const e = curveOf(a[0]).e; return e.type === 'CIRCLE' || (e.type === 'ELLIPSE' && (e.a2 ?? G.TAU) - (e.a1 ?? 0) >= G.TAU - 1e-9) ? T : null; });
  def('vlax-curve-isplanar', () => T);

  // ---------- reactores (vlr-*): los de comando se disparan de verdad; el resto se guardan
  class Reactor {
    constructor(type, owners, data, cbs) { this.type = type; this.owners = owners; this.data = data; this.cbs = cbs; this.added = true; this.pers = false; }
    lispType() { return this.type; }
    lispShow() { return `#<${this.type}>`; }
  }
  const reactors = [];
  const VLR_TYPES = ['VLR-AcDb-Reactor', 'VLR-Command-Reactor', 'VLR-DeepClone-Reactor', 'VLR-DocManager-Reactor', 'VLR-DWG-Reactor', 'VLR-DXF-Reactor', 'VLR-Editor-Reactor', 'VLR-Insert-Reactor', 'VLR-Linker-Reactor', 'VLR-Lisp-Reactor', 'VLR-Miscellaneous-Reactor', 'VLR-Mouse-Reactor', 'VLR-Object-Reactor', 'VLR-SysVar-Reactor', 'VLR-Toolbar-Reactor', 'VLR-Undo-Reactor', 'VLR-Wblock-Reactor', 'VLR-Window-Reactor', 'VLR-XREF-Reactor'];
  const cbList = (x) => (x || []).map((p) => (p instanceof Pair ? [String(p.a.name || p.a).toUpperCase(), p.d] : [String(p[0]?.name || p[0]).toUpperCase(), p[1]]));
  for (const t of VLR_TYPES) {
    const lname = t.toLowerCase().replace('vlr-miscellaneous-reactor', 'vlr-misc-reactor');
    def(lname, (a) => { const isObj = t === 'VLR-Object-Reactor'; const r = new Reactor(t, isObj ? flat(a[0]).filter((x) => x instanceof VlaObj) : [], isObj ? a[1] : a[0], cbList(isObj ? a[2] : a[1])); reactors.push(r); return r; });
  }
  const rx = (x) => { if (!(x instanceof Reactor)) throw new LispError('bad argument type: VLR-object ' + show(x)); return x; };
  def('vlr-add', (a) => { rx(a[0]).added = true; if (!reactors.includes(a[0])) reactors.push(a[0]); return a[0]; });
  def('vlr-remove', (a) => { rx(a[0]).added = false; return a[0]; });
  def('vlr-added-p', (a) => (rx(a[0]).added ? T : null));
  def('vlr-remove-all', (a) => { const t = a[0] ? pname(a[0]).toUpperCase() : null; for (const r of reactors) if (!t || r.type.toUpperCase() === t) r.added = false; return null; });
  def('vlr-reactors', (a) => { const ts = a.length ? a.map((x) => pname(x).toUpperCase()) : null; const by = new Map(); for (const r of reactors) if (r.added && (!ts || ts.includes(r.type.toUpperCase()))) { if (!by.has(r.type)) by.set(r.type, []); by.get(r.type).push(r); } return L([...by].map(([k, v]) => [sym(k), ...v])); });
  def('vlr-data', (a) => rx(a[0]).data);
  def('vlr-data-set', (a) => { rx(a[0]).data = a[1]; return a[1]; });
  def('vlr-owners', (a) => L(rx(a[0]).owners.slice()));
  def('vlr-owner-add', (a) => { rx(a[0]).owners.push(a[1]); return a[1]; });
  def('vlr-owner-remove', (a) => { const r = rx(a[0]); r.owners = r.owners.filter((x) => x !== a[1]); return a[1]; });
  def('vlr-pers', (a) => { rx(a[0]).pers = true; return a[0]; });
  def('vlr-pers-release', (a) => { rx(a[0]).pers = false; return a[0]; });
  def('vlr-pers-p', (a) => (rx(a[0]).pers ? a[0] : null));
  def('vlr-pers-list', () => L(reactors.filter((r) => r.pers)));
  def('vlr-type', (a) => sym(rx(a[0]).type));
  def('vlr-types', () => L(VLR_TYPES.map(sym)));
  def('vlr-reactions', (a) => L(rx(a[0]).cbs.map(([k, f]) => new Pair(sym(k), f))));
  def('vlr-reaction-set', (a) => { const r = rx(a[0]), k = pname(a[1]).toUpperCase(); r.cbs = r.cbs.filter(([x]) => x !== k); r.cbs.push([k, a[2]]); return a[2]; });
  def('vlr-reaction-names', (a) => L(({ 'VLR-COMMAND-REACTOR': [':vlr-commandWillStart', ':vlr-commandEnded', ':vlr-commandCancelled', ':vlr-commandFailed', ':vlr-unknownCommand'] })[pname(a[0]).toUpperCase()]?.map(sym) || []));
  def('vlr-notification', () => sym('ACTIVE-DOCUMENT-ONLY'));
  def('vlr-set-notification', (a) => a[0]);
  def('vlr-current-reaction-name', () => (L_._reaction ? sym(L_._reaction) : null));
  def('vlr-beep-reaction vlr-trace-reaction', () => null);
  L_.fireCommandEvent = (ev, name) => {
    const key = ':VLR-' + ev.toUpperCase();
    const hits = reactors.filter((r) => r.added && r.type === 'VLR-Command-Reactor').flatMap((r) => r.cbs.filter(([k]) => k === key).map(([, f]) => [r, f]));
    if (!hits.length) return;
    setTimeout(async () => { for (const [r, f] of hits) { const fn = f instanceof K.Sym ? L_.get(f) : f; if (!fn) continue; L_._reaction = key; await L_.guarded(() => L_.apply(fn, [r, [name.replace(/^-/, '-')]])); L_._reaction = null; } }, 0);
  };

  // ---------- otras funciones de Visual LISP / AutoLISP
  const fsKey = (n) => str(n).toLowerCase().replace(/\\/g, '/').split('/').pop();
  def('vl-string-mismatch', (a) => { let s1 = str(a[0]), s2 = str(a[1]); s1 = s1.slice(a[2] != null ? int(a[2]) : 0); s2 = s2.slice(a[3] != null ? int(a[3]) : 0); if (truthyish(a[4])) { s1 = s1.toUpperCase(); s2 = s2.toUpperCase(); } let i = 0; while (i < s1.length && i < s2.length && s1[i] === s2[i]) i++; return i; });
  def('vl-file-copy', (a) => { const src = L_.findFile(str(a[0])); if (!src) return null; const dst = fsKey(a[1]); if (L_.fs.has(dst) && !truthyish(a[2])) return null; const c = L_.fs.get(src); L_.fs.set(dst, truthyish(a[2]) ? (L_.fs.get(dst) || '') + c : c); return c.length; });
  def('vl-file-rename', (a) => { const src = L_.findFile(str(a[0])); const dst = fsKey(a[1]); if (!src || L_.fs.has(dst)) return null; L_.fs.set(dst, L_.fs.get(src)); L_.fs.delete(src); return T; });
  def('vl-file-size', (a) => { const k = L_.findFile(str(a[0])); return k ? new TextEncoder().encode(L_.fs.get(k)).length : null; });
  def('vl-file-systime', (a) => { if (!L_.findFile(str(a[0]))) return null; const d = new Date(); return [d.getFullYear(), d.getMonth() + 1, d.getDay(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0]; });
  def('vl-mkdir', () => T);
  const reg = () => { try { return JSON.parse(localStorage.getItem('webcad.registry') || '{}'); } catch (_) { return {}; } };
  const regSave = (o) => { try { localStorage.setItem('webcad.registry', JSON.stringify(o)); } catch (_) { /* sin almacenamiento */ } };
  const regKey = (k) => str(k).toUpperCase().replace(/\//g, '\\');
  def('vl-registry-write', (a) => { const o = reg(), k = regKey(a[0]); (o[k] ||= {})[a[1] != null ? str(a[1]).toUpperCase() : ''] = a[2] == null ? '' : typeof a[2] === 'string' ? a[2] : num(a[2]); regSave(o); return a[2] ?? ''; });
  def('vl-registry-read', (a) => { const o = reg()[regKey(a[0])]; if (!o) return null; const v = o[a[1] != null ? str(a[1]).toUpperCase() : '']; return v === undefined ? null : v; });
  def('vl-registry-delete', (a) => { const o = reg(), k = regKey(a[0]); if (!o[k]) return null; if (a[1] != null) delete o[k][str(a[1]).toUpperCase()]; else for (const x of Object.keys(o)) if (x === k || x.startsWith(k + '\\')) delete o[x]; regSave(o); return T; });
  def('vl-registry-descendents', (a) => { const o = reg(), k = regKey(a[0]); if (truthyish(a[1])) return L(Object.keys(o[k] || {}).filter(Boolean)); const pre = k + '\\'; return L([...new Set(Object.keys(o).filter((x) => x.startsWith(pre)).map((x) => x.slice(pre.length).split('\\')[0]))]); });
  def('vl-get-resource vl-list-loaded-vlx vl-vlx-loaded-p vl-unload-vlx vl-list-exported-functions vl-doc-import vl-vbarun', () => null);
  def('vl-doc-export vl-acad-undefun vl-arx-import vl-load-reactors', () => T);
  def('vl-load-all', async (a) => { await L_.g.get('LOAD').call(L_, [a[0]]); return null; });
  def('layoutlist', () => L(doc().layouts.map((l) => l.name)));
  def('snvalid', (a) => { const s = str(a[0]); return s.length && s.length <= 255 && !/[<>/\\":;?*|,=`]/.test(s) && (truthyish(a[1]) || !s.includes('|')) && s.trim() === s ? T : null; });
  def('xstrcase', (a) => str(a[0]).toUpperCase());
  def('getcname', (a) => { const n = str(a[0]).replace(/^[._]+/, '').toUpperCase(); const name = L_.eng?.resolveName?.(n) || L_.eng?.resolveName?.('_' + n); return name ? (str(a[0]).startsWith('_') ? name : name) : null; });
  def('acad-push-dbmod acad-pop-dbmod', () => T);
  def('arxload arx arxunload autoarxload', () => null);
  def('autoload', (a) => { const file = str(a[0]); for (const c of a[1] || []) { const n = 'C:' + str(c).toUpperCase(); if (L_.g.get(n)) continue; const stub = async function () { L_.g.delete(n); await L_.g.get('LOAD').call(L_, [file]); const f = L_.g.get(n); if (!f) throw new LispError(`; error: ${file} no define ${c}`); return L_.apply(f, []); }; stub.lname = n.toLowerCase(); L_.g.set(n, stub); } return null; });
  def('gc alloc expand mem initdia setfunhelp grclear tablet report slide_image', () => null);
  def('findtrustedfile', (a) => L_.findFile(str(a[0])));
  def('menugroup', (a) => (/^acad$/i.test(str(a[0])) ? 'ACAD' : null));
  // estados de capa
  const lstates = () => (doc().layerStates ||= {});
  def('layerstate-save', (a) => { const n = str(a[0]); const d = doc(); d.touchTables(); lstates()[n] = { mask: int(a[1] ?? 255), layers: Object.fromEntries(Object.values(d.layers).map((l) => [l.name, { on: l.on, frozen: l.frozen, locked: l.locked, color: l.color, ltype: l.ltype, lw: l.lw, plot: l.plot }])), clayer: d.clayer }; return T; });
  def('layerstate-restore', (a) => { const st = lstates()[ci(lstates(), str(a[0]))]; if (!st) return null; const d = doc(); d.touchTables(); for (const [n, v] of Object.entries(st.layers)) { const l = d.layers[n]; if (l) Object.assign(l, v); } d.emit('layers'); for (const e of d.allEnts()) E.invalidate(e); redraw(); return T; });
  def('layerstate-has', (a) => (ci(lstates(), str(a[0])) ? T : null));
  def('layerstate-delete', (a) => { const k = ci(lstates(), str(a[0])); if (!k) return null; doc().touchTables(); delete lstates()[k]; return T; });
  def('layerstate-getnames', () => L(Object.keys(lstates())));
  def('layerstate-rename', (a) => { const k = ci(lstates(), str(a[0])); if (!k) return null; lstates()[str(a[1])] = lstates()[k]; delete lstates()[k]; return T; });
  def('layerstate-getlayers', (a) => { const st = lstates()[ci(lstates(), str(a[0]))]; return st ? L(Object.keys(st.layers)) : null; });
  // utilidades frecuentes de Express Tools
  def('acet-error-init acet-error-restore acet-ui-progress-done acet-sys-beep acet-ui-status', () => null);
  def('acet-ui-progress-init acet-ui-progress acet-ui-progress-safe', () => T);
  def('acet-str-format', (a) => { let s = str(a[0]); a.slice(1).forEach((v, i) => { s = s.split('%' + (i + 1)).join(typeof v === 'string' ? v : show(v, true)); }); return s; });
  def('acet-geom-midpoint', (a) => PL(G.mid(pt(a[0]), pt(a[1]))));
  def('acet-str-replace', (a) => str(a[2]).split(str(a[0])).join(str(a[1])));
  def('acet-list-remove-duplicates', (a) => { const o = []; for (const x of a[0] || []) if (!o.some((y) => show(y) === show(x))) o.push(x); return L(o); });
  def('acet-ss-to-list', (a) => L((a[0] instanceof PickSet ? a[0].items : []).map((e) => new Ename(e))));
  def('acet-layer-locked', (a) => (doc().layers[ci(doc().layers, str(a[0]))]?.locked ? T : null));
  def('acet-file-find', (a) => L_.findFile(str(a[0])));

  // ---------- SendCommand: cadena de órdenes como en la línea de comandos (espacio/intro = Intro)
  async function sendCommand(s) {
    const eng = L_.eng; s = s.replace(/\r\n?/g, '\n');
    const toks = []; let cur = '', inLisp = 0;
    for (const ch of s) {
      if (ch === '(' && !cur) inLisp = 1;
      if (inLisp) { cur += ch; if (ch === '(') inLisp++; else if (ch === ')') { inLisp--; if (inLisp === 1) { toks.push({ lisp: cur }); cur = ''; inLisp = 0; } } continue; }
      if (ch === ' ' || ch === '\n') { toks.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) toks.push(cur);
    for (const t of toks) {
      if (t && t.lisp) { await L_.evalString(t.lisp); continue; }
      await eng.waitSettled();
      if (!eng.active) { if (t) { eng.run(t); await eng.waitSettled(); } continue; }
      eng.inputToken(t === '' ? null : t);
      await eng.waitSettled();
    }
  }
  L_.sendCommand = sendCommand;
}
