// Documento: capas, bloques, espacios, variables de sistema, deshacer/rehacer
import { cloneEnt, invalidate, entBBox, DIMDEF } from './entities.js';
import * as G from './geom.js';
import { LINETYPES } from './tables.js';
import { docBase, layoutBase } from './i18n.js';

export const SYSVARS = {
  CECOLOR: 256, CELTYPE: 'BYLAYER', CELWEIGHT: -1, CELTSCALE: 1, LTSCALE: 1, PSLTSCALE: 1,
  TEXTSIZE: 2.5, TEXTSTYLE: 'Standard', OSMODE: 4135, ORTHOMODE: 0, SNAPMODE: 0, GRIDMODE: 1, SNAPUNIT: 10,
  GRIDUNIT: 10, POLARMODE: 0, POLARANG: 90, AUTOSNAP: 63, ARRAYASSOCIATIVITY: 1, PICKSTYLE: 1, SNAPSTYL: 0, ISOPLANE: 0, FILLETRAD: 0, CHAMFERA: 0, CHAMFERB: 0, OFFSETDIST: -1,
  PDMODE: 0, PDSIZE: 0, MIRRTEXT: 0, LUNITS: 2, LUPREC: 4, AUNITS: 0, AUPREC: 0, INSUNITS: 4, HPNAME: 'ANSI31',
  HPSCALE: 1, HPANG: 0, PICKBOX: 4, APERTURE: 10, LWDISPLAY: 0, DYNMODE: 1, CMDECHO: 1, ATTREQ: 1, ATTDIA: 0,
  EXPERT: 0, MENUBAR: 0, SCREENMENU: 0, TILEMODE: 1, DIMSTYLE: 'ISO-25', PLINEWID: 0, ANGBASE: 0, ANGDIR: 0,
  BLIPMODE: 0, ERRNO: 0, FILEDIA: 1, PICKFIRST: 1, PICKADD: 1, GRIPS: 1, SELECTIONPREVIEW: 3, ZOOMFACTOR: 60,
  TRIMMODE: 1, HIGHLIGHT: 1, OSNAPCOORD: 2, POLYSIDES: 4, CIRCLERAD: 0, ELEVATION: 0, THICKNESS: 0,
  USERI1: 0, USERI2: 0, USERI3: 0, USERI4: 0, USERI5: 0, USERR1: 0, USERR2: 0, USERR3: 0, USERR4: 0, USERR5: 0,
  AREA: 0, PERIMETER: 0, USERS1: '', USERS2: '', USERS3: '', USERS4: '', USERS5: '', ACADVER: '24.2s (WebCAD)', PLATFORM: 'Web',
  SAVETIME: 10, ISAVEPERCENT: 50, MAXSORT: 1000, QTEXTMODE: 0, FILLMODE: 1, REGENMODE: 1, UCSICON: 1,
  CURSORSIZE: 5, MEASUREMENT: 1, NOMUTT: 0, QAFLAGS: 0, OSNAPZ: 0, DELOBJ: 1, EDGEMODE: 0, PEDITACCEPT: 1,
};
const READONLY = new Set(['ACADVER', 'PLATFORM', 'DWGNAME', 'DWGPREFIX', 'CDATE', 'DATE', 'VIEWCTR', 'VIEWSIZE', 'EXTMIN', 'EXTMAX', 'CMDNAMES', 'LASTPOINT']);

export function newLayer(name, o = {}) {
  return { name, color: 7, ltype: 'CONTINUOUS', lw: -3, on: true, frozen: false, locked: false, plot: true, desc: '', ...o };
}

export class Doc {
  constructor() { this.listeners = {}; this.reset(); }
  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  emit(ev, a) { if (ev === 'change' || ev === 'reset' || ev === 'layers') this.rev = (this.rev || 0) + 1; for (const f of this.listeners[ev] || []) f(a); }

  reset(name = docBase() + '1.dwg') {
    this.name = name;
    this.path = '';
    this.layers = { '0': newLayer('0'), Defpoints: newLayer('Defpoints', { plot: false }) };
    this.clayer = '0';
    this.blocks = {};
    this.model = [];
    this.layouts = [{ name: layoutBase() + '1', paper: 'A3', w: 420, h: 297, ents: [] }];
    this.active = 'Model';
    this.ltypes = { CONTINUOUS: LINETYPES.CONTINUOUS };
    this.styles = { Standard: { name: 'Standard', font: 'Arial', h: 0, wf: 1 } };
    this.vars = { ...SYSVARS };
    this.dimstyle = { ...DIMDEF };
    this.handseed = 0x100;
    this.undoStack = []; this.redoStack = []; this.tx = null;
    this.modified = false;
    this.blockEdit = null;
    this.views = {};
    this.props = { title: '', subject: '', author: '', keywords: '', comments: '', revision: '', custom: {} };
    this.groups = {};
    this.constraints = [];
    this.markups = [];
    this.dicts = {}; this.regapps = {}; this.layerStates = {}; delete this._nod;
    this.prevSel = [];
    this.emit('reset');
  }
  get layout() { return this.layouts.find((l) => l.name === this.active) || null; }
  get space() {
    if (this.blockEdit) return this.blockEdit.ents;
    if (this.active === 'Model' || this.mspace) return this.model;
    return this.layout ? this.layout.ents : this.model;
  }
  get paperMode() { return !this.blockEdit && this.active !== 'Model' && !this.mspace; }
  newHandle() { return (this.handseed++).toString(16).toUpperCase(); }

  getvar(n) {
    n = String(n).toUpperCase();
    switch (n) {
      case 'CLAYER': return this.clayer;
      case 'DWGNAME': return this.name;
      case 'DWGPREFIX': return this.path || '';
      case 'CDATE': { const d = new Date(); return +(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`); }
      case 'DATE': return Date.now() / 86400000 + 2440587.5;
      case 'TILEMODE': return this.active === 'Model' ? 1 : 0;
      case 'CTAB': return this.active;
      case 'DIMSCALE': case 'DIMTXT': case 'DIMASZ': case 'DIMEXO': case 'DIMEXE': case 'DIMGAP': case 'DIMDEC': case 'DIMLFAC': case 'DIMTAD': case 'DIMPOST': case 'DIMCLRD': case 'DIMCLRT':
        return this.dimstyle[n.toLowerCase()];
      case 'EXTMIN': { const b = this.extents(); return b ? { x: b.x1, y: b.y1 } : { x: 0, y: 0 }; }
      case 'EXTMAX': { const b = this.extents(); return b ? { x: b.x2, y: b.y2 } : { x: 0, y: 0 }; }
      case 'HANDSEED': return this.handseed.toString(16).toUpperCase();
    }
    if (n in this.vars) return this.vars[n];
    return undefined;
  }
  setvar(n, v) {
    n = String(n).toUpperCase();
    if (READONLY.has(n)) throw new Error(`${n} es de solo lectura`);
    if (n === 'CLAYER') { if (!this.layers[v]) throw new Error('Capa no existe'); this.clayer = v; this.emit('layers'); return v; }
    if (n === 'CTAB') { this.emit('tab', v); return v; }
    if (n.startsWith('DIM') && n.toLowerCase() in this.dimstyle) { this.touchTables(); this.dimstyle[n.toLowerCase()] = v; this.invalidateDims(); this.emit('change'); return v; }
    if (!(n in this.vars)) throw new Error(`Variable desconocida: ${n}`);
    const old = this.vars[n];
    this.vars[n] = typeof old === 'number' && typeof v !== 'number' ? +v : v;
    this.emit('var', n);
    return this.vars[n];
  }
  invalidateDims() { for (const e of this.allEnts()) if (e.type === 'DIMENSION') invalidate(e); }

  // ------- recorrido
  *allEnts() {
    yield* this.model;
    for (const l of this.layouts) yield* l.ents;
  }
  *allEntsDeep() {
    yield* this.allEnts();
    for (const b of Object.values(this.blocks)) yield* b.ents;
  }
  findHandle(h) {
    h = String(h).toUpperCase();
    for (const e of this.allEntsDeep()) if (e.hid === h) return e;
    return null;
  }
  ownerOf(e) {
    if (this.model.includes(e)) return this.model;
    for (const l of this.layouts) if (l.ents.includes(e)) return l.ents;
    if (this.blockEdit && this.blockEdit.ents.includes(e)) return this.blockEdit.ents;
    for (const b of Object.values(this.blocks)) if (b.ents.includes(e)) return b.ents;
    return null;
  }
  extents(ents = this.space) {
    const bb = G.bbNew(); let any = false;
    for (const e of ents) {
      if (e.type === 'XLINE' || e.type === 'RAY') continue;
      const b = entBBox(e, this);
      if (G.bbValid(b) && isFinite(b.x1)) { G.bbUnion(bb, b); any = true; }
    }
    return any ? bb : null;
  }
  layerOf(e) { return this.layers[e.layer] || this.layers['0']; }
  isLocked(e) { return this.layerOf(e).locked; }
  isVisible(e) { const l = this.layerOf(e); return l.on && !l.frozen && e.visible !== false; }

  ensureLayer(name, o) { if (!this.layers[name]) this.layers[name] = newLayer(name, o); return this.layers[name]; }

  // ------- transacciones
  begin(name = '') {
    if (this.tx) { this.tx.depth++; return; }
    this.tx = { name, ops: [], depth: 1, touched: new Set() };
  }
  end() {
    if (!this.tx) return;
    if (--this.tx.depth > 0) return;
    // restricciones paramétricas: se resuelven dentro de la misma operación (un solo deshacer)
    if (this.constraints?.length && this.solveHook && !this.tx.solving) { this.tx.solving = true; try { this.solveHook(this, this.tx); } catch (e) { console.error(e); } }
    const t = this.tx; this.tx = null;
    if (t.ops.length) {
      delete t.touched;
      this.undoStack.push(t);
      if (this.undoStack.length > 200) this.undoStack.shift();
      this.redoStack = [];
      this.modified = true;
    }
    this.emit('change');
  }
  abort() { if (this.tx) { this.tx.depth = 1; this.end(); } }
  _rec(op) {
    if (this.tx) { this.tx.ops.push(op); return; }
    this.undoStack.push({ name: 'auto', ops: [op] }); this.redoStack = []; this.modified = true; this.emit('change');
  }
  stamp(e) {
    if (!e.hid) e.hid = this.newHandle();
    if (e.layer == null) e.layer = this.clayer;
    if (e.color == null) e.color = this.vars.CECOLOR;
    if (e.ltype == null) e.ltype = this.vars.CELTYPE;
    if (e.lw == null) e.lw = this.vars.CELWEIGHT;
    if (!this.layers[e.layer]) this.ensureLayer(e.layer);
    return e;
  }
  add(e, arr = this.space) {
    this.stamp(e);
    arr.push(e);
    this._rec({ k: 'add', e, arr });
    this.lastEnt = e;
    return e;
  }
  remove(e, arr = null) {
    arr = arr || this.ownerOf(e);
    if (!arr) return;
    const idx = arr.indexOf(e);
    if (idx < 0) return;
    arr.splice(idx, 1);
    this._rec({ k: 'del', e, arr, idx });
  }
  touch(e) {
    if (this.tx && this.tx.touched.has(e)) { invalidate(e); return e; }
    if (this.tx) this.tx.touched.add(e);
    this._rec({ k: 'mod', e, before: cloneEnt(e) });
    invalidate(e);
    return e;
  }
  mod(e, fn) { this.touch(e); fn(e); invalidate(e); return e; }
  tablesSnap() {
    return JSON.stringify({ layers: this.layers, blocks: this.blocks, dimstyle: this.dimstyle, clayer: this.clayer, ltypes: this.ltypes, styles: this.styles, layouts: this.layouts.map((l) => ({ ...l, ents: undefined })), groups: this.groups, constraints: this.constraints, props: this.props, markups: this.markups }, (k, v) => (k[0] === '_' ? undefined : v));
  }
  tablesRestore(s) {
    const o = JSON.parse(s);
    this.layers = o.layers; this.blocks = o.blocks; this.dimstyle = o.dimstyle; this.clayer = o.clayer; this.ltypes = o.ltypes; this.styles = o.styles;
    if (o.groups) this.groups = o.groups; if (o.constraints) this.constraints = o.constraints; if (o.props) this.props = o.props; if (o.markups) this.markups = o.markups;
    for (const lm of o.layouts) { const l = this.layouts.find((x) => x.name === lm.name); if (l) Object.assign(l, lm, { ents: l.ents }); }
    for (const e of this.allEnts()) if (e.type === 'INSERT' || e.type === 'DIMENSION') invalidate(e);
    this.emit('layers');
  }
  touchTables() {
    if (this.tx && this.tx.touched.has('tables')) return;
    if (this.tx) this.tx.touched.add('tables');
    this._rec({ k: 'tab', before: this.tablesSnap() });
  }
  _replace(e, data) { for (const k of Object.keys(e)) delete e[k]; Object.assign(e, cloneEnt(data)); }
  undo() {
    const t = this.undoStack.pop(); if (!t) return null;
    for (let i = t.ops.length - 1; i >= 0; i--) {
      const op = t.ops[i];
      if (op.k === 'add') { const j = op.arr.indexOf(op.e); if (j >= 0) op.arr.splice(j, 1); }
      else if (op.k === 'del') op.arr.splice(Math.min(op.idx, op.arr.length), 0, op.e);
      else if (op.k === 'mod') { op.after = cloneEnt(op.e); this._replace(op.e, op.before); }
      else if (op.k === 'tab') { op.after = this.tablesSnap(); this.tablesRestore(op.before); }
    }
    this.redoStack.push(t); this.modified = true; this.emit('change');
    return t.name;
  }
  redo() {
    const t = this.redoStack.pop(); if (!t) return null;
    for (const op of t.ops) {
      if (op.k === 'add') op.arr.push(op.e);
      else if (op.k === 'del') { const j = op.arr.indexOf(op.e); if (j >= 0) op.arr.splice(j, 1); }
      else if (op.k === 'mod') this._replace(op.e, op.after);
      else if (op.k === 'tab') this.tablesRestore(op.after);
    }
    this.undoStack.push(t); this.modified = true; this.emit('change');
    return t.name;
  }

  // ------- serialización nativa (.wcad JSON)
  toJSON() {
    return {
      format: 'webcad', version: 1, name: this.name, layers: this.layers, clayer: this.clayer, blocks: this.blocks,
      model: this.model, layouts: this.layouts, ltypes: this.ltypes, styles: this.styles, vars: this.vars,
      dimstyle: this.dimstyle, handseed: this.handseed, views: this.views, props: this.props, groups: this.groups, constraints: this.constraints, markups: this.markups,
      plotStyles: this.plotStyles, dataLinks: this.dataLinks, dicts: this.dicts, regapps: this.regapps, layerStates: this.layerStates,
    };
  }
  serialize() { return JSON.stringify(this.toJSON(), (k, v) => (k[0] === '_' ? undefined : v)); }
  load(o) {
    this.reset(o.name || 'Dibujo.dwg');
    Object.assign(this.layers, o.layers || {});
    this.clayer = o.clayer && this.layers[o.clayer] ? o.clayer : '0';
    this.blocks = o.blocks || {};
    this.model = o.model || [];
    this.layouts = o.layouts && o.layouts.length ? o.layouts : this.layouts;
    Object.assign(this.ltypes, o.ltypes || {});
    Object.assign(this.styles, o.styles || {});
    Object.assign(this.vars, o.vars || {});
    Object.assign(this.dimstyle, o.dimstyle || {});
    this.handseed = o.handseed || this.handseed;
    this.views = o.views || {};
    if (o.props) this.props = { ...this.props, ...o.props };
    this.groups = o.groups || {};
    this.constraints = o.constraints || [];
    this.markups = o.markups || [];
    this.dicts = o.dicts || {}; this.regapps = o.regapps || {}; this.layerStates = o.layerStates || {};
    if (o.plotStyles) this.plotStyles = o.plotStyles;
    if (o.dataLinks) this.dataLinks = o.dataLinks;
    this.fixHandles();
    this.emit('reset');
  }
  fixHandles() {
    let max = this.handseed;
    const seen = new Set();
    for (const e of this.allEntsDeep()) {
      if (!e.hid || seen.has(e.hid)) e.hid = (max++).toString(16).toUpperCase();
      seen.add(e.hid);
      const n = parseInt(e.hid, 16); if (n >= max) max = n + 1;
    }
    this.handseed = max;
  }
}
