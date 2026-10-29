// Motor de comandos: registro, alias, solicitudes de entrada, selección, pinzamientos
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { tKnown, trPrompt, kwInfo, kwInfos, norm, CMD_ES, ALIAS_ES, CMD_GL, ALIAS_GL, CMD_PT, CMD_CA, locOsnap, locCmd, dispCmd } from '../core/i18n.js';

export class Cancel extends Error { constructor() { super('*Cancel*'); } }
export const PAUSE = Symbol('PAUSE');

export const DEFAULT_ALIASES = {
  L: 'LINE', PL: 'PLINE', C: 'CIRCLE', A: 'ARC', REC: 'RECTANG', RECTANGLE: 'RECTANG', POL: 'POLYGON', EL: 'ELLIPSE', SPL: 'SPLINE',
  PO: 'POINT', XL: 'XLINE', RAY: 'RAY', DO: 'DONUT', M: 'MOVE', CO: 'COPY', CP: 'COPY', RO: 'ROTATE', SC: 'SCALE', MI: 'MIRROR',
  O: 'OFFSET', TR: 'TRIM', EX: 'EXTEND', E: 'ERASE', X: 'EXPLODE', F: 'FILLET', CHA: 'CHAMFER', AR: 'ARRAY', S: 'STRETCH', BR: 'BREAK',
  J: 'JOIN', LEN: 'LENGTHEN', PE: 'PEDIT', B: 'BLOCK', I: 'INSERT', W: 'WBLOCK', BE: 'BEDIT', ATT: 'ATTDEF', ATE: 'ATTEDIT',
  LA: 'LAYER', LT: 'LINETYPE', LTS: 'LTSCALE', LW: 'LWEIGHT', COL: 'COLOR', DT: 'TEXT', T: 'MTEXT', MT: 'MTEXT', ED: 'DDEDIT',
  H: 'HATCH', BH: 'HATCH', HE: 'HATCHEDIT', DLI: 'DIMLINEAR', DAL: 'DIMALIGNED', DRA: 'DIMRADIUS', DDI: 'DIMDIAMETER', DAN: 'DIMANGULAR',
  DOR: 'DIMORDINATE', D: 'DIMSTYLE', DST: 'DIMSTYLE', LE: 'QLEADER', Z: 'ZOOM', P: 'PAN', RE: 'REGEN', REA: 'REGENALL', R: 'REDRAW', PR: 'PROPERTIES',
  CH: 'PROPERTIES', MO: 'PROPERTIES', MA: 'MATCHPROP', LI: 'LIST', LS: 'LIST', DI: 'DIST', AA: 'AREA', DIV: 'DIVIDE', ME: 'MEASURE',
  OP: 'OPTIONS', ST: 'STYLE', UN: 'UNITS', AP: 'APPLOAD', V: 'VIEW', OS: 'OSNAP', SE: 'DSETTINGS', DS: 'DSETTINGS', U: 'U',
  TA: 'TABLET', MV: 'MVIEW', MS: 'MSPACE', PS: 'PSPACE', PU: 'PURGE', REN: 'RENAME', SCR: 'SCRIPT', VLIDE: 'VLISP', XR: 'XREF',
  G: 'GROUP', GR: 'DDGRIPS', BC: 'BCLOSE', ALI: 'ALIGN', REV: 'REVCLOUD', WI: 'WIPEOUT', SPE: 'SPLINEDIT', QS: 'QSELECT', TX: 'TEXT',
};

export class Engine {
  constructor(app) {
    this.app = app;
    this.commands = {};
    this.aliases = { ...DEFAULT_ALIASES };
    // Los nombres de comando en castellano (p. ej. POL = POLILINEA) prevalecen sobre los alias ingleses; los alias cortos en castellano no.
    Object.assign(this.aliases, CMD_ES);
    for (const [k, v] of Object.entries({ ...CMD_CA, ...CMD_PT, ...CMD_GL })) if (!this.aliases[k]) this.aliases[k] = v;
    for (const [k, v] of Object.entries({ ...ALIAS_ES, ...ALIAS_GL })) if (!this.aliases[k]) this.aliases[k] = v;
    this.sel = []; this.grips = []; this.req = null; this.queue = [];
    this.active = null; this.lastCmd = null; this.osOverride = null;
    this.waiters = []; this.prevSel = [];
    this.lastPoint = { x: 0, y: 0 };
    this.initget = null;
  }
  get doc() { return this.app.doc; }
  get view() { return this.app.view; }
  get ui() { return this.app.ui; }
  print(s) { this.app.log(s); }

  register(name, fn, opts = {}) {
    name = name.toUpperCase();
    this.commands[name] = { name, fn, ...opts };
    for (const a of opts.alias || []) this.aliases[a.toUpperCase()] = name;
  }
  resolveName(raw) {
    let n = norm(String(raw).trim());
    const en = /^[.\-+]*_/.test(n); // prefijo _ = nombre inglés (como en AutoCAD localizado)
    n = n.replace(/^[_.\-+]+/, (m) => (m.includes('-') ? '-' : ''));
    const dash = n.startsWith('-');
    let base = dash ? n.slice(1) : n;
    const userA = this.app.settings?.aliases || {};
    if (en && this.commands[(dash ? '-' : '') + base]) return (dash ? '-' : '') + base;
    if (en && DEFAULT_ALIASES[base]) base = DEFAULT_ALIASES[base];
    else if (userA[base]) base = userA[base].toUpperCase();
    else if (locCmd(base)) base = locCmd(base);
    else if (this.aliases[base]) base = this.aliases[base];
    const full = (dash ? '-' : '') + base;
    if (this.commands[full]) return full;
    if (this.commands[base]) return base;
    if (this.app.lisp && this.app.lisp.hasCommand(base)) return 'C:' + base;
    return null;
  }

  // ---- notificación de estado (para LISP command)
  notify() { const w = this.waiters; this.waiters = []; for (const f of w) f(); }
  waitSettled() {
    return new Promise((res) => {
      const check = () => { if (!this.active || this.req) res(); else this.waiters.push(check); };
      check();
    });
  }

  // ---- ejecución
  async run(raw, { transparent = false, fromLisp = false } = {}) {
    const name = this.resolveName(raw);
    if (!name) {
      const vn = String(raw).trim().replace(/^'/, '');
      if (this.doc.getvar(vn) !== undefined && this.sysvarPrompt) {
        if (this.active && !transparent) return;
        const was = this.active; if (!was) this.active = vn.toUpperCase();
        try { await this.sysvarPrompt(vn); } catch (e) { if (!(e instanceof Cancel)) this.print(e.message); } finally { if (!was) { this.active = null; this.req = null; this.afterCommand(); } }
        return;
      }
      this.print(`Unknown command "${String(raw).toUpperCase()}".  Press F1 for help.`); return;
    }
    if (name.startsWith('C:')) {
      this.lastCmd = raw;
      this.doc.begin(name);
      try { await this.app.lisp.callCommand(name.slice(2)); }
      catch (e) { if (!(e instanceof Cancel)) this.print('; error: ' + (e.message || e)); else this.print('*Cancel*'); }
      finally { this.doc.end(); this.afterCommand(); }
      return;
    }
    const cmd = this.commands[name];
    if (transparent || cmd.transparentOnly) return this.runTransparent(cmd);
    if (this.active) { this.print(`** ${dispCmd(name)} command not allowed while ${dispCmd(this.active)} is active **`); return; }
    this.active = name; this.lastCmd = name.startsWith('-') ? name : raw;
    if (!cmd.noRepeat) this.lastCmd = name;
    this.ui?.cmdline?.echoCommand?.(dispCmd(name));
    this.doc.begin(name);
    this.pickfirst = cmd.pickfirst === false ? [] : this.sel.slice();
    if (!cmd.keepSel) this.clearSel(false);
    const react = (ev) => { try { this.app.lisp?.fireCommandEvent?.(ev, name); } catch (_) { /* reactores */ } };
    react('commandWillStart');
    let outcome = 'commandEnded';
    try { await cmd.fn(this); }
    catch (e) {
      if (e instanceof Cancel) { this.print('*Cancel*'); outcome = 'commandCancelled'; }
      else { console.error(e); this.print(`; error en ${name}: ${e.message || e}`); outcome = 'commandFailed'; }
    } finally {
      react(outcome);
      this.doc.end();
      this.active = null; this.req = null; this.previewFn = null; this.osOverride = null; this.win = null; this.pickfirst = [];
      this.afterCommand();
    }
  }
  afterCommand() {
    this.queue = this.queue.filter((t) => t !== PAUSE);
    this.ui?.cmdline?.setPrompt?.('');
    this.view?.redraw(); this.view?.redrawOverlay();
    this.ui?.refresh?.();
    this.notify();
  }
  async runTransparent(cmd) {
    const saved = this.req, savedPrev = this.previewFn;
    this.req = null; this.previewFn = null;
    this.print(`>>${cmd.name}`);
    try { await cmd.fn(this); } catch (e) { if (!(e instanceof Cancel)) this.print('; error: ' + e.message); }
    this.req = saved; this.previewFn = savedPrev;
    if (saved) { this.print('Resuming ' + dispCmd(this.active || '') + ' command.'); this.ui?.cmdline?.setPrompt?.(saved.display ?? saved.prompt, saved.kws); }
    this.view.redrawOverlay();
  }
  cancel() {
    if (this.gripDrag) { this.gripDrag = null; this.view.redrawOverlay(); this.ui?.cmdline?.setPrompt?.(''); return; }
    if (this.win && !this.req) { this.win = null; this.view.redrawOverlay(); return; }
    if (this.req) { const r = this.req; this.req = null; this.queue = []; r.reject(new Cancel()); return; }
    if (this.app.lisp?.running) { this.app.lisp.abort(); }
    this.clearSel();
  }
  get preview() { return this.previewFn || (this.gripDrag ? (p) => this.gripPreview(p) : null); }

  // ---- solicitud genérica
  ask(req) {
    return new Promise((resolve, reject) => {
      req.resolve = (v) => { if (this.req === req) this.req = null; this.osOverride = null; if (v && v.x !== undefined && req.wantsPoint) this.lastPoint = v; resolve(v); this.view.redrawOverlay(); };
      req.reject = (e) => { if (this.req === req) this.req = null; reject(e); };
      req.kws = req.kws || parseKws(req.prompt);
      if (!req.raw) { const li = kwInfos(req.kws.map((k) => k.name)); req.kws = req.kws.map((k, i) => ({ ...k, ...li[i] })); }
      req.display = req.raw ? req.prompt : trPrompt(req.prompt);
      this.req = req;
      this.previewFn = req.preview || null;
      this.ui?.cmdline?.setPrompt?.(req.display, req.kws);
      this.view.updateCursor(); this.view.redrawOverlay();
      this.notify();
      if (this.queue.length) queueMicrotask(() => this.feedNext());
    });
  }
  feedNext() {
    if (!this.req || !this.queue.length) return;
    const t = this.queue[0];
    if (t === PAUSE) return; // espera al usuario
    this.queue.shift();
    this.inputToken(t);
  }
  inputToken(t) {
    const req = this.req; if (!req) return;
    if (t == null) return this.submit('');
    if (typeof t === 'object' && t.__ss) { if (req.kind === 'select') { for (const e of t.items) if (!req.sel.includes(e)) req.sel.push(e); this.view.redrawOverlay(); queueMicrotask(() => this.feedNext()); return; } t = t.items[0]; }
    if (typeof t === 'object' && t.__ent) {
      if (req.kind === 'select') { if (!req.sel.includes(t.__ent)) req.sel.push(t.__ent); queueMicrotask(() => this.feedNext()); return; }
      if (req.kind === 'entity') return req.resolve({ e: t.__ent, p: t.p || E.entSnaps(t.__ent, this.doc)[0]?.p || { x: 0, y: 0 } });
      return;
    }
    if (typeof t === 'object' && 'x' in t) {
      if (req.wantsPoint) return req.resolve({ x: t.x, y: t.y });
      if (req.kind === 'select') { const e = this.view.pickAt(t); if (e && !req.sel.includes(e)) req.sel.push(e); queueMicrotask(() => this.feedNext()); return; }
      if (req.kind === 'entity') { const e = this.view.pickAt(t); if (e) return req.resolve({ e, p: t }); return; }
      return this.submit(`${t.x},${t.y}`);
    }
    this.submit(String(t));
  }

  // texto escrito en la línea de comandos
  async submit(text) {
    const req = this.req;
    const raw = text;
    text = text.trim();
    if (!req) {
      if (this.app.lisp?.running && !this.active) return;
      if (!text) { if (this.lastCmd) return this.run(this.lastCmd); return; }
      if (text.startsWith('(') || text.startsWith('!')) return this.app.lisp.evalTyped(text);
      return this.run(text.replace(/^'/, ''));
    }
    if (text.startsWith("'") && text.length > 1) {
      const name = this.resolveName(text.slice(1));
      if (name && this.commands[name]?.transparent) return this.runTransparent(this.commands[name]);
      this.print('** That command may not be invoked transparently **'); return;
    }
    if ((text.startsWith('(') || text.startsWith('!')) && req.kind !== 'string') {
      const v = await this.app.lisp.evalTyped(text, true);
      if (v != null) return this.inputToken(this.app.lisp.toInputToken(v));
      return;
    }
    const forceEn = text.startsWith('_');
    const U = norm(text).replace(/^_/, '');
    const matchKw = (kws, u) => matchKwL(kws, u, forceEn);
    switch (req.kind) {
      case 'string': {
        return req.resolve(text === '' && req.def != null ? req.def : (req.spaces ? raw : text));
      }
      case 'select': return this.selectInput(U, req);
      case 'entity': {
        if (!text) return req.resolve(null);
        const kw = matchKw(req.kws, U); if (kw) return req.resolve(kw);
        const pp = parsePoint(text, this);
        if (pp) { const e = this.view.pickAt(pp); if (e && (!req.filter || req.filter(e))) return req.resolve({ e, p: pp }); this.print('Nothing selected.'); return; }
        this.print('Invalid selection.'); return;
      }
      case 'kw': {
        if (!text) return req.resolve(req.def ?? null);
        const kw = matchKw(req.kws, U); if (kw) return req.resolve(kw);
        this.print('Invalid option keyword.'); return;
      }
      case 'real': case 'int': case 'dist': case 'angle': {
        if (!text) return req.resolve(req.def ?? null);
        const kw = matchKw(req.kws, U); if (kw) return req.resolve(kw);
        if (req.kind === 'angle') { const a = parseAngle(text, this.doc); if (a != null) return req.resolve(a); }
        else if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(text) || /^[-+]?\d+\s*\/\s*\d+$/.test(text)) {
          const v = evalNum(text);
          if (req.kind === 'int' && !Number.isInteger(v)) { this.print('Requires an integer value.'); return; }
          if (req.positive && v <= 0) { this.print('Value must be positive and nonzero.'); return; }
          return req.resolve(v);
        }
        if (req.kind === 'dist' || req.kind === 'angle') { const p = parsePoint(text, this); if (p && req.base) return req.resolve(req.kind === 'dist' ? G.dist(req.base, p) : G.ang(req.base, p)); }
        this.print(req.kind === 'int' ? 'Requires an integer value.' : 'Requires numeric distance, second point, or option keyword.'); return;
      }
      case 'point': {
        if (!text) return req.resolve(req.def ?? null);
        const os = OSNAP_WORDS[U] || (!forceEn && locOsnap(U));
        if (os) { this.osOverride = os; this.print(`of`); this.view.updateCursor(); return; }
        const kw = matchKw(req.kws, U); if (kw) return req.resolve(kw);
        const p = parsePoint(text, this);
        if (p) return req.resolve(p);
        const ot = this.view.otrack;
        if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text) && ot?.lines?.length === 1) return req.resolve(G.add(ot.lines[0].a, G.mul(ot.lines[0].dir, +text)));
        if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(text) && (req.base || req.ddBase)) {
          const b = req.base || req.ddBase, d = +text;
          let dir = G.sub(this.view.snapped, b); if (G.len(dir) < 1e-12) dir = { x: 1, y: 0 };
          return req.resolve(G.add(b, G.mul(G.norm(dir), d)));
        }
        if (req.allowNumber && /^[-+]?(\d+\.?\d*|\.\d+)$/.test(text)) return req.resolve(+text);
        if (req.allowString) return req.resolve({ str: raw.trim() });
        this.print('Point or option keyword required.'); return;
      }
      default: return req.resolve(text || null);
    }
  }

  // ---- API para comandos
  async getPoint(prompt, o = {}) {
    return this.ask({ kind: 'point', prompt, wantsPoint: true, base: o.base, rubber: o.rubber ?? (o.base ? 'line' : false), preview: o.preview, def: o.def, allowNumber: o.allowNumber, ddBase: o.ddBase, allowString: o.allowString });
  }
  async getCorner(prompt, base) { return this.getPoint(prompt, { base, rubber: 'rect' }); }
  async getDist(prompt, o = {}) {
    const r = await this.ask({ kind: 'dist', prompt, wantsPoint: true, base: o.base, rubber: o.base ? 'line' : false, def: o.def, preview: o.preview, positive: o.positive });
    if (r && typeof r === 'object' && 'x' in r) {
      if (o.base) return G.dist(o.base, r);
      const p2 = await this.getPoint('Specify second point:', { base: r });
      if (!p2 || typeof p2 !== 'object') throw new Cancel();
      return G.dist(r, p2);
    }
    return r;
  }
  async getAngle(prompt, o = {}) {
    const r = await this.ask({ kind: 'angle', prompt, wantsPoint: true, base: o.base, rubber: o.base ? 'line' : false, def: o.def, preview: o.preview });
    if (r && typeof r === 'object' && 'x' in r) {
      if (o.base) return G.ang(o.base, r);
      const p2 = await this.getPoint('Specify second point:', { base: r });
      if (!p2 || typeof p2 !== 'object') throw new Cancel();
      return G.ang(r, p2);
    }
    return r;
  }
  getReal(prompt, o = {}) { return this.ask({ kind: 'real', prompt, def: o.def, positive: o.positive }); }
  getInt(prompt, o = {}) { return this.ask({ kind: 'int', prompt, def: o.def, positive: o.positive }); }
  getString(prompt, o = {}) { return this.ask({ kind: 'string', prompt, spaces: o.spaces, def: o.def }); }
  getKw(prompt, def) { return this.ask({ kind: 'kw', prompt, def }); }
  async entsel(prompt = 'Select object:', o = {}) {
    for (;;) {
      const r = await this.ask({ kind: 'entity', prompt, filter: o.filter });
      if (r == null || typeof r === 'string') return r;
      if (o.filter && !o.filter(r.e)) { this.print(o.filterMsg || 'Object is not valid.'); continue; }
      return r;
    }
  }
  // selección de objetos (usa preselección si existe)
  async select(prompt = 'Select objects:', o = {}) {
    if (!o.noPickfirst && this.pickfirst && this.pickfirst.length) {
      const s = this.pickfirst.filter((e) => this.selectable(e, o)); this.pickfirst = [];
      if (s.length) { this.prevSel = s; return s; }
    }
    const req = { kind: 'select', prompt, sel: [], mode: 'add', single: o.single, filter: o.filter };
    await this.ask(req);
    this.prevSel = req.sel.slice();
    return req.sel;
  }
  selectable(e, o = {}) {
    if (!this.doc.isVisible(e)) return false;
    if (!o.allowLocked && this.doc.isLocked(e)) return false;
    if (o.filter && !o.filter(e)) return false;
    return true;
  }
  // miembros de grupo seleccionables (PICKSTYLE 1)
  withGroups(list) {
    const d = this.doc, gs = Object.values(d.groups || {});
    if (!(d.vars.PICKSTYLE & 1) || !gs.length || !list.length) return list;
    const out = [...list], seen = new Set(list);
    for (const e of list) for (const g of gs) if (g.selectable !== false && g.hids?.includes(e.hid)) for (const hid of g.hids) { const m = d.findHandle(hid); if (m && !seen.has(m) && d.space.includes(m)) { seen.add(m); out.push(m); } }
    return out;
  }
  async selectInput(U, req) {
    const add = (arr) => { let n = 0; for (const e of arr) { if (!this.selectable(e, req)) continue; if (req.mode === 'remove') { const i = req.sel.indexOf(e); if (i >= 0) { req.sel.splice(i, 1); n++; } } else if (!req.sel.includes(e)) { req.sel.push(e); n++; } } this.print(`${n} found, ${req.sel.length} total`); this.view.redrawOverlay(); };
    if (!U) return req.resolve(req.sel);
    const space = this.doc.space;
    const subPrompt = async (fn) => { const saved = this.req; this.req = null; try { await fn(); } finally { this.req = saved; this.ui?.cmdline?.setPrompt?.(req.display ?? req.prompt, req.kws); this.view.redrawOverlay(); } };
    switch (U) {
      case 'ALL': case 'TODO': case 'TODOS': case 'TUDO': case 'TOT': add(space); break;
      case 'L': case 'LAST': case 'U': case 'ULTIMO': case 'DARRER': { const l = [...space].reverse().find((e) => this.doc.isVisible(e)); if (l) add([l]); break; }
      case 'P': case 'PREVIOUS': case 'PREVIO': case 'ANTERIOR': case 'PREVI': add(this.prevSel.filter((e) => space.includes(e))); break;
      case 'R': case 'REMOVE': case 'S': case 'SUPRIMIR': case 'ELIMINAR': case 'Q': case 'QUITAR': case 'REMOVER': case 'TREURE': req.mode = 'remove'; req.prompt = 'Remove objects:'; req.display = trPrompt(req.prompt); this.ui?.cmdline?.setPrompt?.(req.display); break;
      case 'A': case 'ADD': case 'ANADIR': case 'ENGADIR': case 'ADICIONAR': case 'AFEGIR': req.mode = 'add'; req.prompt = 'Select objects:'; req.display = trPrompt(req.prompt); this.ui?.cmdline?.setPrompt?.(req.display); break;
      case 'W': case 'C': case 'V': case 'WINDOW': case 'CROSSING': case 'VENTANA': case 'VENTA': case 'JANELA': case 'FINESTRA': case 'CAPTURA': await subPrompt(async () => {
        const p1 = await this.getPoint('Specify first corner:'); if (!p1 || typeof p1 !== 'object') return;
        const p2 = await this.getCorner('Specify opposite corner:', p1); if (!p2 || typeof p2 !== 'object') return;
        add(this.windowSelect(p1, p2, U[0] === 'C'));
      }); break;
      case 'F': case 'FENCE': case 'B': case 'BORDE': case 'BORDO': case 'VEDACAO': case 'TANCA': await subPrompt(async () => {
        const pts = []; for (;;) { const p = await this.getPoint(pts.length ? 'Specify endpoint of line or [Undo]:' : 'Specify first fence point:', { base: pts[pts.length - 1] }); if (!p || typeof p !== 'object') break; pts.push(p); }
        const fence = []; for (let i = 0; i < pts.length - 1; i++) fence.push({ k: 'L', a: pts[i], b: pts[i + 1] });
        add(space.filter((e) => E.prims(e, this.doc).some((p) => fence.some((f) => G.primInter(p, f).length))));
      }); break;
      case 'WP': case 'CP': case 'PV': case 'PC': await subPrompt(async () => {
        const pts = []; for (;;) { const p = await this.getPoint(pts.length ? 'Specify endpoint of line or [Undo]:' : 'First polygon point:', { base: pts[pts.length - 1] }); if (!p || typeof p !== 'object') break; pts.push(p); }
        if (pts.length < 3) return;
        add(space.filter((e) => { const ps = E.prims(e, this.doc); const inside = ps.every((p) => G.ptInPoly(p.k === 'L' ? p.a : G.polar(p.c, p.a1, p.r), pts)); if (inside) return true; if (U === 'WP' || U === 'PV') return false; const poly = pts.map((p, i) => ({ k: 'L', a: p, b: pts[(i + 1) % pts.length] })); return ps.some((p) => poly.some((q) => G.primInter(p, q).length)); }));
      }); break;
      default: {
        const p = parsePoint(U, this);
        if (p) { const e = this.view.pickAt(p); if (e) add([e]); break; }
        this.print('*Invalid selection*\nExpects a point or Window/Last/Crossing/BOX/ALL/Fence/WPolygon/CPolygon/Add/Remove/Previous');
      }
    }
    if (req.single && req.sel.length) req.resolve(req.sel);
  }
  windowSelect(p1, p2, crossing) {
    const bb = { x1: Math.min(p1.x, p2.x), y1: Math.min(p1.y, p2.y), x2: Math.max(p1.x, p2.x), y2: Math.max(p1.y, p2.y) };
    const d = this.doc, out = [];
    for (const e of d.space) {
      if (!d.isVisible(e)) continue;
      const b = E.entBBox(e, d);
      if (e.type === 'XLINE' || e.type === 'RAY') { if (crossing && E.prims(e, d).some((p) => G.primCrossesRect(p, bb))) out.push(e); continue; }
      if (!G.bbValid(b)) continue;
      if (G.bbInside(b, bb)) { out.push(e); continue; }
      if (!crossing || !G.bbOverlap(b, bb)) continue;
      if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'INSERT' && E.prims(e, d).length === 0) { out.push(e); continue; }
      if (e.type === 'HATCH' || e.type === 'SOLID') { const c = { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 }; if (E.entDist(e, c, d) === 0) { out.push(e); continue; } }
      if (E.prims(e, d).some((p) => G.primCrossesRect(p, bb))) out.push(e);
    }
    return out;
  }

  // ---- selección implícita y pinzamientos
  clearSel(redraw = true) { this.sel = []; this.grips = []; this.gripDrag = null; if (redraw) { this.view?.redrawOverlay(); this.ui?.refresh?.(); } }
  setSel(arr) { this.sel = arr.filter((e) => this.doc.isVisible(e)); this.updateGrips(); this.ui?.refresh?.(); this.view.redrawOverlay(); }
  updateGrips() {
    this.grips = [];
    if (!this.doc.vars.GRIPS) return;
    const ents = this.sel.slice(0, 100);
    for (const e of ents) { if (this.doc.isLocked(e)) continue; for (const g of E.entGrips(e, this.doc)) { g.ent = e; this.grips.push(g); } }
  }
  gripAt(sx, sy) {
    const gs = (this.app.settings.gripSize || 6) + 3;
    for (const g of this.grips) { const s = this.view.toScreen(g.p); if (Math.abs(s.x - sx) <= gs && Math.abs(s.y - sy) <= gs) return g; }
    return null;
  }
  pointerMove(info) {
    const req = this.req;
    if (!req || req.kind === 'select' || req.kind === 'entity') {
      const before = this.hover;
      this.hover = (this.win || this.gripDrag) ? null : this.view.pickAt(info.raw);
      if (!req) {
        const hg = this.gripAt(info.sx, info.sy);
        if (hg !== this.hoverGrip) {
          this.hoverGrip = hg; clearTimeout(this._gmT);
          // pinzamientos multifunción: al parar el cursor sobre uno aparece su menú
          if (hg && (hg.vi != null || hg.si != null || hg.le)) this._gmT = setTimeout(() => { if (this.hoverGrip === hg && !this.req && !this.gripDrag) this.ui?.gripMenu?.(hg, info.sx, info.sy); }, 550);
        }
      }
      if (before !== this.hover) this.view.redrawOverlay();
    } else if (this.hover) { this.hover = null; }
  }
  pointerDown(info) {
    const req = this.req;
    if (info.button === 2) {
      if (req || this.gripDrag) { if (this.gripDrag) return this.cancel(); return this.submit(''); }
      return this.ui?.contextMenu?.(info);
    }
    if (info.button !== 0) return;
    if (this.gripDrag) return this.finishGrip(info.p);
    if (req && req.wantsPoint) return req.resolve({ ...info.p });
    if (req && req.kind === 'entity') {
      const e = this.view.pickAt(info.raw);
      if (e) { if (req.filter && !req.filter(e)) { this.print('Object is not valid.'); return; } return req.resolve({ e, p: info.raw }); }
      this.print('Nothing selected.'); return;
    }
    if (req && req.kind !== 'select') return;
    // selección (idle o solicitud)
    if (this.win) return this.finishWindow(info);
    if (!req) {
      const g = this.gripAt(info.sx, info.sy);
      if (g) return this.startGrip(g);
    }
    const e = this.view.pickAt(info.raw);
    if (e) {
      if (req) {
        if (!this.selectable(e, req)) { this.print('1 was on a locked layer.'); return; }
        const grp = this.withGroups([e]);
        if (info.shift || req.mode === 'remove') req.sel = req.sel.filter((x) => !grp.includes(x));
        else for (const x of grp) if (!req.sel.includes(x) && this.selectable(x, req)) req.sel.push(x);
        this.print(`1 found, ${req.sel.length} total`);
        if (req.single) return req.resolve(req.sel);
        this.view.redrawOverlay(); return;
      }
      const grp = this.withGroups([e]);
      if (info.shift) this.sel = this.sel.filter((x) => !grp.includes(x)); else for (const x of grp) if (!this.sel.includes(x)) this.sel.push(x);
      this.updateGrips(); this.ui?.refresh?.(); this.view.redrawOverlay(); return;
    }
    this.win = { p1: info.raw, sx: info.sx, sy: info.sy, t: performance.now(), shift: info.shift };
    this.view.redrawOverlay();
  }
  pointerUp(info) {
    if (this.win && info.button === 0) {
      const moved = Math.hypot(info.sx - this.win.sx, info.sy - this.win.sy);
      if (moved > 6) this.finishWindow(info);
    }
  }
  finishWindow(info) {
    const w = this.win; this.win = null;
    const found = this.withGroups(this.windowSelect(w.p1, info.raw, info.raw.x < w.p1.x));
    const req = this.req;
    if (req && req.kind === 'select') {
      const ok = found.filter((e) => this.selectable(e, req));
      if (info.shift || req.mode === 'remove') req.sel = req.sel.filter((e) => !ok.includes(e));
      else for (const e of ok) if (!req.sel.includes(e)) req.sel.push(e);
      this.print(`${ok.length} found, ${req.sel.length} total`);
      if (req.single && req.sel.length) return req.resolve(req.sel);
    } else if (!req) {
      if (info.shift || w.shift) this.sel = this.sel.filter((e) => !found.includes(e));
      else for (const e of found) if (!this.sel.includes(e)) this.sel.push(e);
      this.updateGrips(); this.ui?.refresh?.();
    }
    this.view.redrawOverlay();
  }
  dblClick(info) {
    if (this.req || this.active) return;
    const d = this.doc;
    if (d.active !== 'Model' && !d.blockEdit) {
      if (d.mspace) { const vp = d.mspace; const pp = this.view.toScreen(info.raw); void pp; }
      const e = this.view.pickAt(info.raw);
      if (!d.mspace && (!e || e.type === 'VIEWPORT')) { const ps = info.raw; const vp = d.layout.ents.find((x) => x.type === 'VIEWPORT' && Math.abs(ps.x - x.c.x) <= x.w / 2 && Math.abs(ps.y - x.c.y) <= x.h / 2); if (vp) { this.clearSel(); return this.run('MSPACE'); } }
      if (d.mspace && !e) {
        const pv = this.view.paperView(); const sp = this.view.toWorld(info.sx, info.sy, pv); const vp = d.mspace;
        if (Math.abs(sp.x - vp.c.x) > vp.w / 2 || Math.abs(sp.y - vp.c.y) > vp.h / 2) { this.clearSel(); return this.run('PSPACE'); }
      }
    }
    const e = this.view.pickAt(info.raw);
    if (!e) return;
    this.sel = [e];
    if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTDEF') return this.run('DDEDIT');
    if (e.type === 'INSERT' && e.attribs && e.attribs.length) return this.run('EATTEDIT');
    if (e.type === 'INSERT' && d.blocks[e.name] && !e.name.startsWith('*')) { this.sel = []; this.bedName = e.name; return this.run('BEDIT'); }
    if (e.type === 'TABLE') return this.run('TABLEDIT');
    if (e.type === 'HATCH') return this.run('HATCHEDIT');
    if (e.type === 'LWPOLYLINE') return this.run('PEDIT');
    this.setSel([e]); this.ui?.showProperties?.(true);
  }

  // ---- edición por pinzamientos
  // acciones de pinzamientos multifunción
  gripAction(g, act) {
    const e = g.ent, d = this.doc;
    const one = (set) => { this.gripDrag = { grip: { ...g, set }, base: g.p, mode: 0, only: true }; this.ui?.cmdline?.setPrompt?.(trPrompt('Specify stretch point:')); this.view.redrawOverlay(); };
    if (act === 'stretch') return this.startGrip(g);
    if (act === 'add') { const i = g.vi != null ? g.vi : g.si; return one((x, p) => { x.pts.splice(i + 1, 0, { x: p.x, y: p.y, b: 0 }); if (x.pts[i].b) x.pts[i] = { ...x.pts[i], b: 0 }; }); }
    if (act === 'del') { if (e.pts.length <= 2) return; d.begin('GRIP_REMOVEVERTEX'); d.touch(e); e.pts.splice(g.vi, 1); E.invalidate(e); d.end(); this.updateGrips(); this.view.redraw(); return; }
    if (act === 'arc') return one((x, p) => E.setSegThrough(x, g.si, p));
    if (act === 'line') { d.begin('GRIP_TOLINE'); d.touch(e); e.pts[g.si] = { ...e.pts[g.si], b: 0 }; E.invalidate(e); d.end(); this.updateGrips(); this.view.redraw(); return; }
    if (act === 'lengthen') { const fix = g.le === 1 ? 'p2' : 'p1', mov = g.le === 1 ? 'p1' : 'p2'; const dir = G.norm(G.sub(e[mov], e[fix])); return one((x, p) => { x[mov] = G.add(x[fix], G.mul(dir, Math.max(1e-9, G.dot(G.sub(p, x[fix]), dir)))); }); }
  }
  startGrip(g) {
    if (g.kind === 'dflip') {
      const e = g.ent; this.doc.begin('GRIP'); this.doc.touch(e); const v = E.dynDefaults(this.doc.blocks[e.name]); e.dyn = { ...v, ...(e.dyn || {}) }; e.dyn[g.param.name] = e.dyn[g.param.name] ? 0 : 1; E.invalidate(e); this.doc.end();
      this.updateGrips(); this.view.redraw(); return;
    }
    if (g.kind === 'dvis' || g.kind === 'dlook') return this.ui?.visMenu?.(g);
    this.gripDrag = { grip: g, base: g.p, mode: 0 };
    this.ui?.cmdline?.setPrompt?.(tKnown('** ESTIRAR **') + '\n' + tKnown('Precise punto de estiramiento (Espacio = siguiente modo, Esc = cancelar):'));
    this.view.redrawOverlay();
  }
  cycleGripMode() {
    if (!this.gripDrag) return false;
    if (this.gripDrag.grip.kind?.startsWith('d')) return true;
    this.gripDrag.mode = (this.gripDrag.mode + 1) % 5;
    const names = ['ESTIRAR', 'DESPLAZAR', 'GIRAR', 'ESCALA', 'SIMETRÍA'];
    this.ui?.cmdline?.setPrompt?.(`** ${tKnown(names[this.gripDrag.mode])} **`);
    this.view.redrawOverlay(); return true;
  }
  gripXform(p) {
    const gd = this.gripDrag, b = gd.base;
    switch (gd.mode) {
      case 1: return G.M.tr(p.x - b.x, p.y - b.y);
      case 2: return G.M.rot(G.ang(b, p), b);
      case 3: { const k = G.dist(b, p); return G.M.scale(Math.max(k, 1e-6), b); }
      case 4: return G.M.mirror(b, G.dist(b, p) > 1e-9 ? p : G.add(b, { x: 1, y: 0 }));
    }
    return null;
  }
  gripTargets() {
    const gd = this.gripDrag, g = gd.grip;
    if (gd.mode === 0) {
      if (gd.only) return [g];
      const same = this.grips.filter((x) => x === g || (!g.kind?.startsWith('d') && !x.kind?.startsWith('d') && G.eq(x.p, g.p, 1e-9)));
      return same;
    }
    return null;
  }
  gripPreview(p) {
    const gd = this.gripDrag; if (!gd) return null;
    if (gd.mode === 0) {
      const out = [];
      for (const g of this.gripTargets()) { const c = E.cloneEnt(g.ent); if (g.kind?.startsWith('d')) { c.name = g.ent.name; E.dynSetFromPoint(c, this.doc, g, p); } else g.set(c, p); E.invalidate(c); c._ghost = false; out.push(c); }
      return out;
    }
    const m = this.gripXform(p);
    return this.sel.map((e) => { const c = E.cloneEnt(e); E.transformEnt(c, m); return c; });
  }
  finishGrip(p) {
    const gd = this.gripDrag;
    const targets = gd.mode === 0 ? this.gripTargets() : null, m = gd.mode === 0 ? null : this.gripXform(p);
    this.gripDrag = null;
    this.doc.begin('GRIP_' + ['STRETCH', 'MOVE', 'ROTATE', 'SCALE', 'MIRROR'][gd.mode]);
    if (targets) for (const g of targets) { this.doc.touch(g.ent); g.set(g.ent, p); E.invalidate(g.ent); }
    else for (const e of this.sel) { this.doc.touch(e); E.transformEnt(e, m, { mirrtext: this.doc.vars.MIRRTEXT }); }
    this.doc.end();
    this.updateGrips(); this.ui?.cmdline?.setPrompt?.(''); this.view.redraw(); this.ui?.refresh?.();
  }
}

// ---- utilidades de entrada
function parseKws(prompt) {
  const m = /\[([^\]]+)\]/.exec(prompt || '');
  if (!m) return [];
  return m[1].split('/').map((s) => {
    s = s.trim();
    const caps = s.replace(/[^A-Z0-9]/g, '');
    return { name: s, key: (caps || s).toUpperCase() };
  });
}
function matchKwL(kws, U, forceEn = false) {
  if (!kws || !U) return null;
  if (!forceEn) for (const k of kws) if (k.es && (U === k.esKey || U === norm(k.es))) return k.name;
  for (const k of kws) if (U === k.key || U === norm(k.name)) return k.name;
  if (!forceEn) for (const k of kws) if (k.es && norm(k.es).startsWith(U) && U.length >= Math.min(k.esKey.length, norm(k.es).length)) return k.name;
  for (const k of kws) if (norm(k.name).startsWith(U) && U.length >= Math.min(k.key.length, k.name.length)) return k.name;
  if (!forceEn) for (const k of kws) if (k.es && norm(k.es).startsWith(U)) return k.name;
  for (const k of kws) if (norm(k.name).startsWith(U)) return k.name;
  return null;
}
export const OSNAP_WORDS = { END: 'end', ENDP: 'end', MID: 'mid', CEN: 'cen', INT: 'int', PER: 'per', TAN: 'tan', NEA: 'nea', QUA: 'qua', INS: 'ins', NOD: 'nod', NON: 'non', NONE: 'non', EXT: 'ext', APP: 'app' };
export function evalNum(t) { const m = /^([-+]?\d+)\s*\/\s*(\d+)$/.exec(t); if (m) return +m[1] / +m[2]; return parseFloat(t); }
export function parseAngle(t, doc) {
  t = t.trim();
  if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(t)) return G.rad(+t);
  let m = /^([-+]?\d+)d(\d+)'(\d+(\.\d*)?)"?$/i.exec(t); if (m) return G.rad(+m[1] + +m[2] / 60 + +m[3] / 3600);
  m = /^([-+]?\d+\.?\d*)r$/i.exec(t); if (m) return +m[1];
  m = /^([-+]?\d+\.?\d*)g$/i.exec(t); if (m) return +m[1] * Math.PI / 200;
  void doc; return null;
}
const NUM = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?';
export function parsePoint(t, eng) {
  t = t.trim();
  const last = eng.lastPoint || { x: 0, y: 0 };
  let rel = false, abs = false;
  if (t.startsWith('@')) { rel = true; t = t.slice(1); if (!t) return { ...last }; }
  else if (t.startsWith('#')) { abs = true; t = t.slice(1); }
  void abs;
  let m = new RegExp(`^(${NUM})\\s*,\\s*(${NUM})(?:\\s*,\\s*(${NUM}))?$`).exec(t);
  if (m) { const p = { x: +m[1], y: +m[2] }; return rel ? G.add(last, p) : p; }
  m = new RegExp(`^(${NUM})\\s*<\\s*(.+)$`).exec(t);
  if (m) { const a = parseAngle(m[2], eng.doc); if (a == null) return null; const p = G.polar({ x: 0, y: 0 }, a, +m[1]); return rel ? G.add(last, p) : p; }
  return null;
}
