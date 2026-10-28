// Escritura DXF 2000 (AC1015) con identificadores, propietarios y diccionarios.
// Lo que DXF no puede representar (bloques dinámicos, cotas editables, tablas, restricciones, grupos, propiedades)
// viaja como XDATA/XRECORD de la aplicación WEBCAD, de modo que WebCAD recupera el dibujo sin pérdidas
// y AutoCAD ve la geometría equivalente.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { HATCHES } from '../core/tables.js';

const R2D = 180 / Math.PI;
const APP = 'WEBCAD';
// claves internas que no se guardan en XDATA
const SKIP = new Set(['hid', 'layer', 'color', 'ltype', 'lw', 'lts', 'tc', 'visible']);

export function writeDXF2000(doc, opts = {}) {
  const out = [];
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+(+v).toFixed(12)));
  // ANSI_1252: lo representable va como byte; el resto como \\U+XXXX (lo entiende cualquier AutoCAD)
  const esc = (t) => String(t ?? '').replace(/[^\x00-\x7f\xa0-\xff€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, (ch) => '\\U+' + ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
  const w = (c, v) => { out.push(String(c).padStart(3, ' ')); out.push(typeof v === 'number' ? fmt(v) : esc(v)); };
  const P = (code, p, z = true) => { w(code, p?.x ?? 0); w(code + 10, p?.y ?? 0); if (z) w(code + 20, 0); };

  // ---- identificadores: se respetan los de las entidades y se reservan nuevos para tablas y objetos
  const used = new Set();
  let seed = doc.handseed || 0x100;
  for (const e of doc.allEntsDeep()) { const n = parseInt(e.hid, 16); if (n >= seed) seed = n + 1; }
  const H = () => { let h; do { h = (seed++).toString(16).toUpperCase(); } while (used.has(h)); used.add(h); return h; };
  const entH = (e) => { if (e.hid && !used.has(e.hid) && /^[0-9A-F]+$/.test(e.hid)) { used.add(e.hid); return e.hid; } return H(); };
  const fixed = { blockTable: H(), layerTable: H(), ltypeTable: H(), styleTable: H(), viewTable: H(), ucsTable: H(), vportTable: H(), appidTable: H(), dimTable: H(), root: H(), groupDict: H(), layoutDict: H(), mlsDict: H(), propsDict: null };
  // trocea una cadena ya escapada en tramos de ≤250 caracteres sin partir las secuencias \U+XXXX
  const chunks = (t) => { t = esc(t); const r = []; let i = 0; while (i < t.length) { let j = Math.min(t.length, i + 250); const b = t.lastIndexOf('\\U+', j - 1); if (b > j - 7 && b >= i && b + 7 > j && j < t.length) j = b; r.push(t.slice(i, j)); i = j; } return r.length ? r : ['']; };
  const xdata = (o) => {
    if (!o) return;
    const s = JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : v));
    w(1001, APP);
    for (const c of chunks(s)) w(1000, c);
  };
  const entData = (e) => { const o = {}; for (const [k, v] of Object.entries(e)) if (!SKIP.has(k) && k[0] !== '_') o[k] = v; return o; };

  // grupos: identificadores reservados de antemano porque las entidades llevan un reactor hacia su grupo
  const groups = opts.ents ? {} : doc.groups || {};
  const groupH = Object.fromEntries(Object.keys(groups).map((n) => [n, H()]));
  const reactors = {};
  for (const [n, g] of Object.entries(groups)) for (const hid of g.hids || []) (reactors[hid] ||= []).push(groupH[n]);
  const model = opts.ents || doc.model;
  const blocks = opts.blocks || doc.blocks;
  const layouts = opts.ents ? [] : doc.layouts;
  const anon = []; // bloques anónimos (*U dinámicos, *D cotas, *T tablas)
  const bb = doc.extents(model) || { x1: 0, y1: 0, x2: 100, y2: 100 };

  // registros de bloque
  const brModel = H(), brPaper = H();
  const brLayouts = layouts.map((l, i) => ({ l, name: i === 0 ? '*Paper_Space' : `*Paper_Space${i - 1}`, h: i === 0 ? brPaper : H(), layoutH: H() }));
  if (!brLayouts.length) brLayouts.push({ l: null, name: '*Paper_Space', h: brPaper, layoutH: H() });
  const modelLayoutH = H();
  const userBlocks = Object.values(blocks).filter((b) => !/^\*(Model|Paper)_Space/i.test(b.name));
  const br = {}; for (const b of userBlocks) br[b.name] = H();

  // ---------------- HEADER
  w(0, 'SECTION'); w(2, 'HEADER');
  const hv = (name, code, v) => { w(9, name); if (code === 10) P(10, v); else w(code, v); };
  hv('$ACADVER', 1, 'AC1015'); hv('$ACADMAINTVER', 70, 6); hv('$DWGCODEPAGE', 3, 'ANSI_1252');
  hv('$INSBASE', 10, { x: 0, y: 0 }); hv('$EXTMIN', 10, { x: bb.x1, y: bb.y1 }); hv('$EXTMAX', 10, { x: bb.x2, y: bb.y2 });
  w(9, '$LIMMIN'); P(10, { x: 0, y: 0 }, false); w(9, '$LIMMAX'); P(10, { x: 420, y: 297 }, false);
  hv('$LTSCALE', 40, doc.vars.LTSCALE || 1); hv('$TEXTSIZE', 40, doc.vars.TEXTSIZE || 2.5); hv('$TEXTSTYLE', 7, doc.vars.TEXTSTYLE || 'Standard');
  hv('$CLAYER', 8, doc.clayer); hv('$CELTYPE', 6, cap(doc.vars.CELTYPE || 'BYLAYER')); hv('$CECOLOR', 62, typeof doc.vars.CECOLOR === 'number' ? doc.vars.CECOLOR : 256);
  hv('$CELWEIGHT', 370, doc.vars.CELWEIGHT ?? -1); hv('$LWDISPLAY', 290, doc.vars.LWDISPLAY ? 1 : 0);
  hv('$DIMSTYLE', 2, 'ISO-25'); hv('$DIMSCALE', 40, doc.dimstyle.dimscale || 1); hv('$DIMASZ', 40, doc.dimstyle.dimasz || 2.5); hv('$DIMTXT', 40, doc.dimstyle.dimtxt || 2.5);
  hv('$INSUNITS', 70, doc.vars.INSUNITS ?? 4); hv('$MEASUREMENT', 70, 1); hv('$LUNITS', 70, doc.vars.LUNITS ?? 2); hv('$LUPREC', 70, doc.vars.LUPREC ?? 4);
  hv('$PDMODE', 70, doc.vars.PDMODE | 0); hv('$PDSIZE', 40, doc.vars.PDSIZE || 0); hv('$PSLTSCALE', 70, doc.vars.PSLTSCALE ?? 1);
  hv('$TILEMODE', 70, doc.active === 'Model' ? 1 : 0);
  const seedPos = out.length; hv('$HANDSEED', 5, 'FFFF'); // se corrige al final
  w(0, 'ENDSEC');
  // ---------------- CLASSES
  w(0, 'SECTION'); w(2, 'CLASSES'); w(0, 'ENDSEC');

  // ---------------- TABLES
  w(0, 'SECTION'); w(2, 'TABLES');
  const table = (name, h, n, dimstyle = false) => { w(0, 'TABLE'); w(2, name); w(5, h); w(330, 0); w(100, 'AcDbSymbolTable'); w(70, n); if (dimstyle) w(100, 'AcDbDimStyleTable'); };
  const rec = (type, owner, sub, name, flags = 0, hcode = 5) => { const h = H(); w(0, type); w(hcode, h); w(330, owner); w(100, 'AcDbSymbolTableRecord'); w(100, sub); w(2, name); w(70, flags); return h; };
  // VPORT
  table('VPORT', fixed.vportTable, 1);
  rec('VPORT', fixed.vportTable, 'AcDbViewportTableRecord', '*Active');
  w(10, 0); w(20, 0); w(11, 1); w(21, 1); P(12, { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 }, false);
  w(13, 0); w(23, 0); w(14, doc.vars.SNAPUNIT || 10); w(24, doc.vars.SNAPUNIT || 10); w(15, doc.vars.GRIDUNIT || 10); w(25, doc.vars.GRIDUNIT || 10);
  w(16, 0); w(26, 0); w(36, 1); w(17, 0); w(27, 0); w(37, 0); w(40, Math.max(1, (bb.y2 - bb.y1) * 1.1)); w(41, 1.6); w(42, 50); w(43, 0); w(44, 0); w(50, 0); w(51, 0);
  w(71, 0); w(72, 1000); w(73, 1); w(74, 3); w(75, doc.vars.SNAPMODE ? 1 : 0); w(76, doc.vars.GRIDMODE ? 1 : 0); w(77, 0); w(78, 0);
  w(0, 'ENDTAB');
  // LTYPE
  const lts = { BYBLOCK: { desc: '', pat: [] }, BYLAYER: { desc: '', pat: [] }, CONTINUOUS: { desc: 'Solid line', pat: [] } };
  for (const [n, lt] of Object.entries(doc.ltypes)) lts[n.toUpperCase()] = lt;
  table('LTYPE', fixed.ltypeTable, Object.keys(lts).length);
  for (const [n, lt] of Object.entries(lts)) {
    rec('LTYPE', fixed.ltypeTable, 'AcDbLinetypeTableRecord', n === 'BYBLOCK' ? 'ByBlock' : n === 'BYLAYER' ? 'ByLayer' : n === 'CONTINUOUS' ? 'Continuous' : n);
    const pat = lt.pat || [];
    w(3, lt.desc || ''); w(72, 65); w(73, pat.length); w(40, pat.reduce((s, x) => s + Math.abs(x), 0));
    for (const d of pat) { w(49, d); w(74, 0); }
  }
  w(0, 'ENDTAB');
  // LAYER
  table('LAYER', fixed.layerTable, Object.keys(doc.layers).length);
  for (const l of Object.values(doc.layers)) {
    rec('LAYER', fixed.layerTable, 'AcDbLayerTableRecord', l.name, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0));
    const col = typeof l.color === 'number' ? l.color : rgbAci(l.color);
    w(62, l.on === false ? -col : col);
    if (typeof l.color === 'string') w(420, parseInt(l.color.slice(1), 16));
    w(6, lcap(l.ltype || 'CONTINUOUS')); if (l.plot === false || l.name === 'Defpoints') w(290, 0); w(370, l.lw ?? -3); w(390, 0);
    if (l.desc) xdata({ desc: l.desc });
  }
  w(0, 'ENDTAB');
  // STYLE
  table('STYLE', fixed.styleTable, Object.keys(doc.styles).length);
  for (const s of Object.values(doc.styles)) {
    rec('STYLE', fixed.styleTable, 'AcDbTextStyleTableRecord', s.name);
    w(40, s.h || 0); w(41, s.wf || 1); w(50, 0); w(71, 0); w(42, 2.5); w(3, fontFile(s.font)); w(4, s.bigfont || '');
  }
  w(0, 'ENDTAB');
  table('VIEW', fixed.viewTable, 0); w(0, 'ENDTAB');
  table('UCS', fixed.ucsTable, 0); w(0, 'ENDTAB');
  // APPID
  table('APPID', fixed.appidTable, 2);
  rec('APPID', fixed.appidTable, 'AcDbRegAppTableRecord', 'ACAD'); rec('APPID', fixed.appidTable, 'AcDbRegAppTableRecord', APP);
  w(0, 'ENDTAB');
  // DIMSTYLE
  table('DIMSTYLE', fixed.dimTable, 2, true);
  const ds = doc.dimstyle;
  for (const name of ['Standard', 'ISO-25']) {
    rec('DIMSTYLE', fixed.dimTable, 'AcDbDimStyleTableRecord', name, 0, 105);
    w(3, ds.dimpost || ''); w(40, ds.dimscale || 1); w(41, ds.dimasz || 2.5); w(42, ds.dimexo ?? 0.625); w(44, ds.dimexe ?? 1.25);
    w(140, ds.dimtxt || 2.5); w(147, ds.dimgap ?? 0.625); w(144, ds.dimlfac || 1); w(77, ds.dimtad ? 1 : 0); w(271, ds.dimdec ?? 2);
    w(176, ds.dimclrd ?? 0); w(178, ds.dimclrt ?? 0);
  }
  w(0, 'ENDTAB');
  // BLOCK_RECORD
  table('BLOCK_RECORD', fixed.blockTable, 2 + Math.max(0, brLayouts.length - 1) + userBlocks.length + 0);
  const brTablePos = out.length - 1; // la cuenta se corrige al añadir anónimos
  const blockRecord = (name, h, layoutH, extra) => {
    w(0, 'BLOCK_RECORD'); w(5, h); w(330, fixed.blockTable); w(100, 'AcDbSymbolTableRecord'); w(100, 'AcDbBlockTableRecord'); w(2, name); w(340, layoutH || 0);
    if (extra) xdata(extra);
  };
  const brStart = out.length;
  blockRecord('*Model_Space', brModel, modelLayoutH);
  for (const x of brLayouts) blockRecord(x.name, x.h, x.layoutH);
  for (const b of userBlocks) {
    const extra = {}; for (const [k, v] of Object.entries(b)) if (!['name', 'base', 'ents', '_ver'].includes(k) && k[0] !== '_') extra[k] = v;
    blockRecord(b.name, br[b.name], null, Object.keys(extra).length ? extra : null);
  }
  const brEnd = out.length;
  w(0, 'ENDTAB');
  w(0, 'ENDSEC');

  // ---------------- entidades
  const writeEnt = (e, owner, paper = false) => {
    const head = (type, sub) => {
      const h = entH(e);
      w(0, type); w(5, h);
      if (reactors[h]) { w(102, '{ACAD_REACTORS'); for (const r of reactors[h]) w(330, r); w(102, '}'); }
      w(330, owner); w(100, 'AcDbEntity'); if (paper) w(67, 1);
      w(8, e.layer || '0');
      const lt = (e.ltype || 'BYLAYER').toUpperCase(); if (lt !== 'BYLAYER') w(6, lcap(lt));
      if (typeof e.color === 'number' && e.color !== 256) w(62, e.color);
      else if (typeof e.color === 'string') { w(62, rgbAci(e.color)); w(420, parseInt(e.color.slice(1), 16)); }
      if (e.tc) w(420, parseInt(e.tc.slice(1), 16));
      if (e.lw != null && e.lw !== -1) w(370, e.lw);
      if (e.lts && e.lts !== 1) w(48, e.lts);
      if (e.visible === false) w(60, 1);
      if (sub) w(100, sub);
      return h;
    };
    const exploded = (parts) => { for (const p of parts || []) writeEnt({ layer: e.layer, color: e.color, ltype: e.ltype, lw: e.lw, ...p, hid: undefined }, owner, paper); };
    switch (e.type) {
      case 'LINE': head('LINE', 'AcDbLine'); P(10, e.p1); P(11, e.p2); break;
      case 'POINT': head('POINT', 'AcDbPoint'); P(10, e.p); break;
      case 'CIRCLE': head('CIRCLE', 'AcDbCircle'); P(10, e.c); w(40, e.r); break;
      case 'ARC': head('ARC', 'AcDbCircle'); P(10, e.c); w(40, e.r); w(100, 'AcDbArc'); w(50, G.normA(e.a1) * R2D); w(51, G.normA(e.a2) * R2D); break;
      case 'XLINE': case 'RAY': head(e.type, e.type === 'XLINE' ? 'AcDbXline' : 'AcDbRay'); P(10, e.p); P(11, G.norm(e.dir)); break;
      case 'LWPOLYLINE': {
        head('LWPOLYLINE', 'AcDbPolyline'); w(90, e.pts.length); w(70, (e.closed ? 1 : 0) | 128); w(43, e.cw_ || 0);
        for (const v of e.pts) { w(10, v.x); w(20, v.y); if (v.b) w(42, v.b); }
        break;
      }
      case 'ELLIPSE': {
        head('ELLIPSE', 'AcDbEllipse'); P(10, e.c); P(11, e.major); w(210, 0); w(220, 0); w(230, 1); w(40, Math.min(1, e.ratio)); w(41, e.a1 ?? 0); w(42, e.a2 ?? G.TAU);
        break;
      }
      case 'SPLINE': {
        let cps = e.cps, knots = e.knots, deg = e.deg || 3, weights = e.w;
        if (!cps || !cps.length) { const b = catmullToBspline(e.fit || [], e.closed); cps = b.cps; knots = b.knots; deg = 3; weights = null; }
        if (!knots || knots.length !== cps.length + deg + 1) knots = clampedKnots(cps.length, deg);
        head('SPLINE', 'AcDbSpline'); w(210, 0); w(220, 0); w(230, 1);
        w(70, 8 | (e.closed ? 1 : 0) | (weights ? 4 : 0)); w(71, deg); w(72, knots.length); w(73, cps.length); w(74, e.fit?.length || 0);
        w(42, 1e-10); w(43, 1e-10); w(44, 1e-10);
        for (const k of knots) w(40, k);
        if (weights) for (const x of weights) w(41, x);
        for (const p of cps) P(10, p);
        for (const p of e.fit || []) P(11, p);
        break;
      }
      case 'TEXT': case 'ATTDEF': case 'ATTRIB': {
        head(e.type, 'AcDbText');
        P(10, e.p); w(40, e.h || 2.5); w(1, e.type === 'ATTDEF' ? (e.def ?? '') : (e.text ?? '')); if (e.rot) w(50, e.rot * R2D); if (e.wf && e.wf !== 1) w(41, e.wf);
        w(7, e.style || 'Standard'); if (e.ha) w(72, e.ha); if (e.ha || e.va) P(11, e.p2 || e.p);
        if (e.type === 'TEXT') { w(100, 'AcDbText'); if (e.va) w(73, e.va); }
        else if (e.type === 'ATTDEF') { w(100, 'AcDbAttributeDefinition'); w(3, e.prompt || ''); w(2, e.tag || 'TAG'); w(70, (e.invisible ? 1 : 0) | (e.constant ? 2 : 0)); if (e.va) w(74, e.va); }
        else { w(100, 'AcDbAttribute'); w(2, e.tag || 'TAG'); w(70, e.invisible ? 1 : 0); if (e.va) w(74, e.va); }
        break;
      }
      case 'MTEXT': {
        head('MTEXT', 'AcDbMText'); P(10, e.p); w(40, e.h || 2.5); w(41, e.w || 0); w(71, e.att || 1); w(72, 1);
        const parts = chunks(String(e.text ?? ''));
        for (let k = 0; k < parts.length - 1; k++) w(3, parts[k]);
        w(1, parts[parts.length - 1]); w(7, e.style || 'Standard'); if (e.rot) w(50, e.rot * R2D); w(73, 1); w(44, e.ls || 1);
        break;
      }
      case 'INSERT': {
        const blk = doc.blocks[e.name];
        let name = e.name, extra = null;
        if ((e.dyn && blk?.params?.length) || e.table) { // geometría efectiva en un bloque anónimo
          name = `*U${anon.length + 1}`; anon.push({ name, base: blk?.base || { x: 0, y: 0 }, ents: E.blockEntsFor(e, doc), h: H() });
          extra = { name: e.name, dyn: e.dyn, table: e.table };
        }
        if (e.cmp) extra = { ...(extra || {}), cmp: e.cmp };
        if (e.arr) extra = { ...(extra || {}), arr: e.arr };
        const h = head('INSERT', 'AcDbBlockReference'); if (e.attribs?.length) w(66, 1);
        w(2, name); P(10, e.p); w(41, e.sx ?? 1); w(42, e.sy ?? 1); w(43, 1); if (e.rot) w(50, e.rot * R2D);
        if (e.cols > 1) { w(70, e.cols); w(44, e.cs || 0); } if (e.rows > 1) { w(71, e.rows); w(45, e.rs || 0); }
        xdata(extra);
        if (e.attribs?.length) {
          for (const a of e.attribs) writeEnt({ ...a, type: 'ATTRIB', layer: a.layer || e.layer }, h, paper);
          w(0, 'SEQEND'); w(5, H()); w(330, h); w(100, 'AcDbEntity'); if (paper) w(67, 1); w(8, e.layer || '0');
        }
        break;
      }
      case 'SOLID': head('SOLID', 'AcDbTrace'); e.pts.forEach((p, k) => P(10 + k, p)); if (e.pts.length === 3) P(13, e.pts[2]); break;
      case 'LEADER': {
        head('LEADER', 'AcDbLeader'); w(3, 'ISO-25'); w(71, e.arrow === false ? 0 : 1); w(72, 0); w(73, 3); w(74, 1); w(75, 0); w(40, 0); w(41, 0); w(76, e.pts.length);
        for (const p of e.pts) P(10, p);
        break;
      }
      case 'HATCH': {
        const solid = e.solid || (e.pattern || '').toUpperCase() === 'SOLID';
        head('HATCH', 'AcDbHatch'); P(10, { x: 0, y: 0 }); w(210, 0); w(220, 0); w(230, 1);
        w(2, solid ? 'SOLID' : (e.pdef && !HATCHES[(e.pattern || '').toUpperCase()] ? (e.pattern || '_USER') : (e.pattern || 'ANSI31')).toUpperCase());
        w(70, solid ? 1 : 0); w(71, 0); w(91, e.loops.length);
        e.loops.forEach((l, i) => {
          w(92, 2 | 1 | (i === 0 ? 16 : 0)); const hasB = l.some((v) => v.b);
          w(72, hasB ? 1 : 0); w(73, 1); w(93, l.length);
          for (const v of l) { w(10, v.x); w(20, v.y); if (hasB) w(42, v.b || 0); }
          w(97, 0);
        });
        w(75, 0); w(76, 1);
        if (!solid) {
          const defs = hatchDefs(e);
          w(52, (e.angle || 0) * R2D); w(41, e.scale || 1); w(77, 0); w(78, defs.length);
          for (const d of defs) { w(53, d.a); w(43, d.o[0]); w(44, d.o[1]); w(45, d.d[0]); w(46, d.d[1]); w(79, d.dash.length); for (const x of d.dash) w(49, x); }
        }
        w(98, 0);
        break;
      }
      case 'DIMENSION': {
        const ents = E.dimEnts(e, doc).map((x) => ({ ...x, layer: x.layer || e.layer }));
        const name = `*D${anon.length + 1}`; anon.push({ name, base: { x: 0, y: 0 }, ents, h: H() });
        const tp = e.tp || textPos(ents) || e.dp || e.p1 || { x: 0, y: 0 };
        head('DIMENSION', 'AcDbDimension'); w(2, name);
        const t = { linear: 0, aligned: 1, angular: 5, diameter: 3, radius: 4, ordinate: 6 }[e.dt] ?? 0;
        const def10 = e.dt === 'radius' ? e.c : e.dt === 'diameter' ? e.p2 : e.dt === 'angular' ? (e.dp || e.p1) : e.dt === 'ordinate' ? { x: 0, y: 0 } : (e.dp || e.p1);
        P(10, def10 || { x: 0, y: 0 }); P(11, tp); w(70, t | 32 | (e.dt === 'ordinate' && e.xord ? 64 : 0)); w(1, e.text ?? ''); w(3, 'ISO-25');
        if (e.dt === 'linear' || e.dt === 'aligned') { w(100, 'AcDbAlignedDimension'); P(13, e.p1); P(14, e.p2); if (e.dt === 'linear') { w(50, (e.rot || 0) * R2D); w(100, 'AcDbRotatedDimension'); } }
        else if (e.dt === 'radius') { w(100, 'AcDbRadialDimension'); P(15, e.p1); w(40, 0); }
        else if (e.dt === 'diameter') { w(100, 'AcDbDiametricDimension'); P(15, e.p1); w(40, 0); }
        else if (e.dt === 'angular') { w(100, 'AcDb3PointAngularDimension'); P(13, e.p1); P(14, e.p2); P(15, e.c); }
        else if (e.dt === 'ordinate') { w(100, 'AcDbOrdinateDimension'); P(13, e.p1); P(14, e.dp || e.p1); }
        xdata(e.block && !e.p1 ? null : { dim: entData(e) });
        break;
      }
      case 'VIEWPORT': {
        head('VIEWPORT', 'AcDbViewport'); P(10, e.c); w(40, e.w); w(41, e.h); w(68, 1); w(69, e.vpid || 2);
        P(12, e.vc || { x: 0, y: 0 }, false); w(13, 0); w(23, 0); w(14, 10); w(24, 10); w(15, 10); w(25, 10);
        w(16, 0); w(26, 0); w(36, 1); w(17, 0); w(27, 0); w(37, 0); w(42, 50); w(43, 0); w(44, 0); w(45, e.h / (e.scale || 1)); w(50, 0); w(51, 0); w(72, 100);
        w(90, 32864 | (e.locked ? 16384 : 0)); w(281, 0); w(71, 1); w(74, 0); w(110, 0); w(120, 0); w(130, 0); w(111, 1); w(121, 0); w(131, 0); w(112, 0); w(122, 1); w(132, 0); w(79, 0); w(146, 0);
        break;
      }
      case 'WIPEOUT': // se guarda como sombreado sólido de color de fondo + datos para recuperarlo
        writeEnt({ type: 'HATCH', layer: e.layer, color: 255, solid: true, pattern: 'SOLID', loops: [e.pts.map((p) => ({ ...p, b: 0 }))], hid: undefined, _wipe: e }, owner, paper);
        break;
      case 'DUCT': {
        const name = `*U${anon.length + 1}`; anon.push({ name, base: { x: 0, y: 0 }, ents: E.explodeEnt(e, doc).map((x) => ({ ...x, layer: '0', color: x.color === 8 ? 8 : 0 })), h: H() });
        head('INSERT', 'AcDbBlockReference'); w(2, name); P(10, { x: 0, y: 0 }); w(41, 1); w(42, 1); w(43, 1);
        xdata({ ductEnt: entData(e) }); break;
      }
      case 'TABLE': { // tabla: bloque anónimo con su geometría + datos para recuperarla en WebCAD
        const name = `*U${anon.length + 1}`; anon.push({ name, base: { x: 0, y: 0 }, ents: E.explodeEnt(e, doc).map((x) => ({ ...x, layer: '0', color: 0 })), h: H() });
        head('INSERT', 'AcDbBlockReference'); w(2, name); P(10, { x: 0, y: 0 }); w(41, 1); w(42, 1); w(43, 1);
        xdata({ tableEnt: entData(e) }); break;
      }
      default: exploded(E.explodeEnt(e, doc)); break;
    }
    if (e.type === 'HATCH' && e._wipe) xdata({ wipeout: true });
    else if (e.type === 'HATCH' && e.assoc) xdata({ assoc: e.assoc });
  };

  // ---------------- BLOCKS
  w(0, 'SECTION'); w(2, 'BLOCKS');
  const blockHead = (name, brh, base, flags = 0, paper = false, extra = {}) => {
    w(0, 'BLOCK'); w(5, H()); w(330, brh); w(100, 'AcDbEntity'); if (paper) w(67, 1); w(8, '0'); w(100, 'AcDbBlockBegin');
    w(2, name); w(70, flags); P(10, base || { x: 0, y: 0 }); w(3, name); w(1, extra.path || '');
  };
  const blockTail = (brh, paper = false) => { w(0, 'ENDBLK'); w(5, H()); w(330, brh); w(100, 'AcDbEntity'); if (paper) w(67, 1); w(8, '0'); w(100, 'AcDbBlockEnd'); };
  blockHead('*Model_Space', brModel); blockTail(brModel);
  brLayouts.forEach((x, i) => {
    blockHead(x.name, x.h, null, 0, i === 0);
    if (i > 0 && x.l) for (const e of layoutEnts(x.l)) writeEnt(e, x.h, true);
    blockTail(x.h, i === 0);
  });
  for (const b of userBlocks) {
    const flags = (b.xref ? 4 : 0) | (b.ents.some((e) => e.type === 'ATTDEF') ? 2 : 0) | (b.name.startsWith('*') ? 1 : 0);
    blockHead(b.name, br[b.name], b.base, flags, false, { path: b.xref?.path });
    if (!b.xref) for (const e of b.ents) writeEnt(e, br[b.name]);
    blockTail(br[b.name]);
  }
  const anonPos = out.length; // aquí se insertan los anónimos
  w(0, 'ENDSEC');

  // ---------------- ENTITIES
  w(0, 'SECTION'); w(2, 'ENTITIES');
  for (const e of model) writeEnt(e, brModel);
  if (brLayouts[0].l) for (const e of layoutEnts(brLayouts[0].l)) writeEnt(e, brPaper, true);
  if (opts.paper) for (const e of opts.paper) writeEnt(e, brPaper, true);
  w(0, 'ENDSEC');

  // bloques anónimos (se generan mientras se escriben las entidades)
  const anonOut = [], anonBR = [];
  for (let k = 0; k < anon.length; k++) {
    const a = anon[k];
    const save = out.length;
    blockHead(a.name, a.h, a.base, 1);
    for (const e of a.ents) writeEnt({ ...e, hid: undefined }, a.h);
    blockTail(a.h);
    anonOut.push(...out.splice(save));
    const s2 = out.length; blockRecord(a.name, a.h, null); anonBR.push(...out.splice(s2));
  }
  out.splice(anonPos, 0, ...anonOut);
  out.splice(brEnd, 0, ...anonBR);
  out[brTablePos] = fmt(+out[brTablePos] + anon.length);
  void brStart;

  // ---------------- OBJECTS
  w(0, 'SECTION'); w(2, 'OBJECTS');
  const propsH = H(), dataH = H();
  w(0, 'DICTIONARY'); w(5, fixed.root); w(330, 0); w(100, 'AcDbDictionary'); w(281, 1);
  w(3, 'ACAD_GROUP'); w(350, fixed.groupDict); w(3, 'ACAD_LAYOUT'); w(350, fixed.layoutDict); w(3, 'ACAD_MLINESTYLE'); w(350, fixed.mlsDict);
  w(3, 'DWGPROPS'); w(350, propsH); w(3, 'WEBCAD_DATA'); w(350, dataH);
  w(0, 'DICTIONARY'); w(5, fixed.groupDict); w(330, fixed.root); w(100, 'AcDbDictionary'); w(281, 1);
  for (const n of Object.keys(groups)) { w(3, n); w(350, groupH[n]); }
  // presentaciones
  w(0, 'DICTIONARY'); w(5, fixed.layoutDict); w(330, fixed.root); w(100, 'AcDbDictionary'); w(281, 1);
  w(3, 'Model'); w(350, modelLayoutH);
  for (const x of brLayouts) { w(3, x.l?.name || 'Layout1'); w(350, x.layoutH); }
  const mlsH = H();
  w(0, 'DICTIONARY'); w(5, fixed.mlsDict); w(330, fixed.root); w(100, 'AcDbDictionary'); w(281, 1); w(3, 'Standard'); w(350, mlsH);
  w(0, 'MLINESTYLE'); w(5, mlsH); w(330, fixed.mlsDict); w(100, 'AcDbMlineStyle'); w(2, 'Standard'); w(70, 0); w(3, ''); w(62, 256); w(51, 90); w(52, 90);
  w(71, 2); w(49, 0.5); w(62, 256); w(6, 'BYLAYER'); w(49, -0.5); w(62, 256); w(6, 'BYLAYER');
  const layout = (h, name, brh, order, wmm = 420, hmm = 297) => {
    w(0, 'LAYOUT'); w(5, h); w(330, fixed.layoutDict); w(100, 'AcDbPlotSettings'); w(1, ''); w(2, 'none_device'); w(4, `ISO_A3_(${wmm}.00_x_${hmm}.00_MM)`); w(6, '');
    w(40, 0); w(41, 0); w(42, 0); w(43, 0); w(44, wmm); w(45, hmm); w(46, 0); w(47, 0); w(48, 0); w(49, 0); w(140, 0); w(141, 0); w(142, 1); w(143, 1);
    w(70, 688); w(72, 1); w(73, 0); w(74, 5); w(7, ''); w(75, 16); w(147, 1); w(148, 0); w(149, 0);
    w(100, 'AcDbLayout'); w(1, name); w(70, 1); w(71, order); w(10, 0); w(20, 0); w(11, wmm); w(21, hmm); P(12, { x: 0, y: 0 });
    P(14, { x: 0, y: 0 }); P(15, { x: wmm, y: hmm }); w(146, 0); P(13, { x: 0, y: 0 }); w(16, 1); w(26, 0); w(36, 0); w(17, 0); w(27, 1); w(37, 0); w(76, 0); w(330, brh);
  };
  layout(modelLayoutH, 'Model', brModel, 0);
  brLayouts.forEach((x, i) => layout(x.layoutH, x.l?.name || 'Layout1', x.h, i + 1, x.l?.w || 420, x.l?.h || 297));
  // grupos
  for (const [n, g] of Object.entries(groups)) {
    w(0, 'GROUP'); w(5, groupH[n]); w(330, fixed.groupDict); w(100, 'AcDbGroup'); w(300, g.desc || ''); w(70, 0); w(71, g.selectable === false ? 0 : 1);
    for (const hid of g.hids || []) if (used.has(hid)) w(340, hid);
  }
  // propiedades del dibujo (formato DWGPROPS de AutoCAD)
  const pr = doc.props || {};
  w(0, 'XRECORD'); w(5, propsH); w(330, fixed.root); w(100, 'AcDbXrecord'); w(280, 1);
  w(1, 'DWGPROPS COOKIE'); w(2, pr.title || ''); w(3, pr.subject || ''); w(4, pr.author || ''); w(6, pr.comments || ''); w(7, pr.keywords || ''); w(8, pr.lastSavedBy || ''); w(9, pr.revision || '');
  const custom = Object.entries(pr.custom || {});
  for (let i = 0; i < 10; i++) w(300 + i, custom[i] ? `${custom[i][0]}=${custom[i][1]}` : '=');
  w(40, 0); w(41, 0); w(42, 0); w(43, 0); w(44, 0); w(45, 0); w(90, custom.length);
  // datos propios de WebCAD (restricciones, vistas, presentaciones, tablas de estilos…)
  const extra = JSON.stringify({ v: 1, props: pr, constraints: doc.constraints || [], markups: doc.markups || [], views: doc.views || {}, layouts: layouts.map((l) => ({ name: l.name, paper: l.paper, w: l.w, h: l.h, ctb: l.ctb })), plotStyles: doc.plotStyles, vars: pick(doc.vars, ['SNAPUNIT', 'GRIDUNIT', 'OSMODE', 'POLARANG', 'HPNAME', 'HPSCALE', 'FILLETRAD', 'INSUNITS']), dimstyle: doc.dimstyle, dataLinks: doc.dataLinks });
  w(0, 'XRECORD'); w(5, dataH); w(330, fixed.root); w(100, 'AcDbXrecord'); w(280, 1);
  for (const c of chunks(extra)) w(300, c);
  w(0, 'ENDSEC'); w(0, 'EOF');
  out[seedPos + 3] = (seed + 1).toString(16).toUpperCase();
  return toCp1252(out.join('\r\n') + '\r\n');
}
const CP_EXTRA = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f };
export function toCp1252(str) {
  const b = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); b[i] = c < 0x80 || (c >= 0xa0 && c <= 0xff) ? c : CP_EXTRA[str[i]] ?? 0x3f; }
  return b;
}

// ---------------- utilidades
const cap = (s) => { const u = String(s).toUpperCase(); return u === 'BYLAYER' ? 'ByLayer' : u === 'BYBLOCK' ? 'ByBlock' : u === 'CONTINUOUS' ? 'Continuous' : s; };
const lcap = cap;
const pick = (o, ks) => Object.fromEntries(ks.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
function fontFile(f) {
  const s = String(f || 'Arial');
  if (/\.(shx|ttf|otf)$/i.test(s)) return s;
  return s.toLowerCase().replace(/\s+/g, '') + '.ttf';
}
function rgbAci(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex || '');
  if (!m) return 7;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  const base = [[255, 0, 0, 1], [255, 255, 0, 2], [0, 255, 0, 3], [0, 255, 255, 4], [0, 0, 255, 5], [255, 0, 255, 6], [255, 255, 255, 7], [128, 128, 128, 8], [192, 192, 192, 9]];
  let best = 7, bd = Infinity; for (const [R, Gr, B, i] of base) { const d = (R - r) ** 2 + (Gr - g) ** 2 + (B - b) ** 2; if (d < bd) { bd = d; best = i; } }
  return best;
}
function layoutEnts(l) { return (l.ents || []).filter((e) => !(e.type === 'VIEWPORT' && e.vpid === 1)); }
function textPos(ents) { const t = ents.find((x) => x.type === 'TEXT'); return t ? (t.p2 || t.p) : null; }
function clampedKnots(n, deg) {
  const k = []; const m = n - deg;
  for (let i = 0; i <= deg; i++) k.push(0);
  for (let i = 1; i < m; i++) k.push(i);
  for (let i = 0; i <= deg; i++) k.push(m);
  return k;
}
// Catmull-Rom (como lo dibuja WebCAD) -> B-spline cúbica exacta: tramos Bézier con nudos de multiplicidad 3
export function catmullToBspline(pts, closed) {
  const n = pts.length;
  if (n < 2) return { cps: pts.slice(), knots: clampedKnots(pts.length, 1) };
  if (n === 2) return { cps: [pts[0], G.lerp(pts[0], pts[1], 1 / 3), G.lerp(pts[0], pts[1], 2 / 3), pts[1]], knots: [0, 0, 0, 0, 1, 1, 1, 1] };
  const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  const cps = [g(0)];
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    cps.push({ x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }, { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }, { ...p2 });
  }
  const knots = [0, 0, 0, 0];
  for (let i = 1; i < segs; i++) knots.push(i, i, i);
  knots.push(segs, segs, segs, segs);
  return { cps, knots };
}
// definición del patrón en coordenadas del dibujo (escalada y girada), como la guarda AutoCAD
function hatchDefs(e) {
  if (e.pdef?.length && e.pdef[0].world) return e.pdef.map((d) => ({ a: d.a, o: d.o, d: d.d, dash: d.dash || [] }));
  const pat = HATCHES[(e.pattern || 'ANSI31').toUpperCase()] || HATCHES.ANSI31;
  const sc = e.scale || 1, an = e.angle || 0;
  return pat.map((d) => {
    const a = G.rad(d.a) + an;
    const o = G.rotate({ x: d.o[0] * sc, y: d.o[1] * sc }, { x: 0, y: 0 }, an);
    const off = G.rotate({ x: d.d[0] * sc, y: d.d[1] * sc }, { x: 0, y: 0 }, a);
    return { a: G.normA(a) * R2D, o: [o.x, o.y], d: [off.x, off.y], dash: (d.dash || []).map((x) => x * sc) };
  });
}
