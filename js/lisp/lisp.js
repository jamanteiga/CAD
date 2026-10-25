// Intérprete AutoLISP (subconjunto amplio, evaluación asíncrona, ámbito dinámico)
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel, PAUSE } from '../cmd/engine.js';

// ---------- tipos
export class Sym { constructor(n) { this.name = n; } toString() { return this.name; } }
const SYMS = new Map();
export const sym = (n) => { n = n.toUpperCase(); let s = SYMS.get(n); if (!s) { s = new Sym(n); SYMS.set(n, s); } return s; };
export const T = sym('T');
export class Real { constructor(v) { this.v = v; } }
export class Pair { constructor(a, d) { this.a = a; this.d = d; } }
export class Ename { constructor(e, parent = null, seqend = false) { this.e = e; this.parent = parent; this.seqend = seqend; } }
export class PickSet { constructor(items = []) { this.items = items; } }
export class Fn { constructor(name, params, locals, body) { this.name = name; this.params = params; this.locals = locals; this.body = body; } }
class LFile { constructor(name, mode, content = '') { this.name = name; this.mode = mode; this.lines = content.split(/\r?\n/); this.pos = 0; this.out = []; } }
class VlaObj { constructor(kind, ref) { this.kind = kind; this.ref = ref; } }
export class LispError extends Error {}
class CatchErr { constructor(msg) { this.msg = msg; } }
const SILENT = { silent: true };
const QUOTE = sym('QUOTE');

const isNum = (x) => typeof x === 'number' || x instanceof Real;
const num = (x) => { if (typeof x === 'number') return x; if (x instanceof Real) return x.v; throw new LispError(`bad argument type: numberp: ${show(x)}`); };
const mkNum = (v, real) => (real || !Number.isInteger(v) ? new Real(v) : v);
const R = (v) => new Real(v);
const isList = (x) => x === null || Array.isArray(x);
const truthy = (x) => x !== null && x !== undefined && x !== false;
const L = (arr) => (arr && arr.length ? arr : null);
const ptList = (p) => [R(p.x), R(p.y), R(p.z || 0)];
export const toPt = (x) => { if (Array.isArray(x) && x.length >= 2 && isNum(x[0]) && isNum(x[1])) return { x: num(x[0]), y: num(x[1]) }; return null; };
const str = (x) => { if (typeof x !== 'string') throw new LispError(`bad argument type: stringp ${show(x)}`); return x; };

export function fmtReal(v) {
  if (!isFinite(v)) return v > 0 ? '1.#INF' : v < 0 ? '-1.#INF' : '1.#QNAN';
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toFixed(1);
  const a = Math.abs(v);
  if (a >= 1e6 || a < 1e-4) { let s = v.toExponential(5).replace(/\.?0+e/, 'e'); const m = /e([+-])(\d+)/.exec(s); if (m) s = s.replace(/e[+-]\d+/, `e${m[1]}${m[2].padStart(3, '0')}`); if (!s.includes('.')) s = s.replace('e', '.0e'); return s; }
  let s = String(+v.toPrecision(6)); if (!s.includes('.')) s += '.0'; return s;
}
export function show(x, princ = false) {
  if (x === null || x === undefined) return 'nil';
  if (x === SILENT) return '';
  if (x === true) return 'T';
  if (typeof x === 'number') return String(x);
  if (x instanceof Real) return fmtReal(x.v);
  if (typeof x === 'string') return princ ? x : '"' + x.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';
  if (x instanceof Sym) return x.name;
  if (x instanceof Pair) return `(${show(x.a, princ)} . ${show(x.d, princ)})`;
  if (Array.isArray(x)) return '(' + x.map((y) => show(y, princ)).join(' ') + ')';
  if (x instanceof Ename) return `<Entity name: ${(x.e?.hid || '0').toLowerCase().padStart(12, '7ff6')}>`;
  if (x instanceof PickSet) return `<Selection set: ${x.items.length.toString(16)}>`;
  if (x instanceof Fn) return `#<USUBR @${x.name || 'lambda'}>`;
  if (typeof x === 'function') return `#<SUBR @${x.lname || 'builtin'}>`;
  if (x instanceof LFile) return `#<file "${x.name}">`;
  if (x instanceof VlaObj) return `#<VLA-OBJECT ${x.kind}>`;
  if (x instanceof CatchErr) return `#<%catch-all-apply-error%>`;
  return String(x);
}

// ---------- lector
export function read(src) {
  const out = []; let i = 0; const n = src.length;
  const ws = () => {
    for (;;) {
      while (i < n && /\s/.test(src[i])) i++;
      if (src[i] === ';') { if (src[i + 1] === '|') { const j = src.indexOf('|;', i + 2); i = j < 0 ? n : j + 2; } else { while (i < n && src[i] !== '\n') i++; } continue; }
      break;
    }
  };
  const item = () => {
    ws();
    if (i >= n) throw new LispError('malformed list on input');
    const c = src[i];
    if (c === '(') {
      i++; const lst = [];
      for (;;) {
        ws();
        if (i >= n) throw new LispError('malformed list on input');
        if (src[i] === ')') { i++; break; }
        if (src[i] === '.' && /[\s()]/.test(src[i + 1] || ' ')) { i++; const d = item(); ws(); if (src[i] !== ')') throw new LispError('misplaced dot on input'); i++; if (lst.length === 1 && !Array.isArray(d)) return new Pair(lst[0], d); return lst.concat(Array.isArray(d) ? d : [d]); }
        lst.push(item());
      }
      return L(lst);
    }
    if (c === ')') { i++; return item(); }
    if (c === "'") { i++; return [QUOTE, item()]; }
    if (c === '"') {
      i++; let s = '';
      while (i < n && src[i] !== '"') {
        if (src[i] === '\\') {
          i++; const e = src[i];
          if (e === 'n') s += '\n'; else if (e === 't') s += '\t'; else if (e === 'r') s += '\r'; else if (e === 'e') s += '\x1b';
          else if (/[0-7]/.test(e)) { const m = /^[0-7]{1,3}/.exec(src.slice(i)); s += String.fromCharCode(parseInt(m[0], 8)); i += m[0].length - 1; }
          else s += e;
          i++;
        } else s += src[i++];
      }
      i++; return s;
    }
    let j = i; while (j < n && !/[\s()';"]/.test(src[j])) j++;
    const tok = src.slice(i, j); i = j;
    if (/^[+-]?\d+$/.test(tok)) { const v = parseInt(tok, 10); return Math.abs(v) > 2147483647 ? R(v) : v; }
    if (/^[+-]?(\d+\.\d*|\.\d+|\d+)([eE][+-]?\d+)?$/.test(tok)) return R(parseFloat(tok));
    if (tok.toUpperCase() === 'NIL') return null;
    return sym(tok);
  };
  for (;;) { ws(); if (i >= n) break; if (src[i] === ')') { i++; continue; } out.push(item()); }
  return out;
}

// ---------- intérprete
export class Lisp {
  constructor(app) {
    this.app = app;
    this.g = new Map();
    this.fs = new Map();
    this.buf = '';
    this.running = 0;
    this.steps = 0;
    this.initgetState = null;
    this.blockDef = null;
    this.tblIter = {};
    this.installBuiltins();
  }
  get doc() { return this.app.doc; }
  get eng() { return this.app.cmd; }
  // salida
  write(s) { this.buf += s; const k = this.buf.lastIndexOf('\n'); if (k >= 0) { for (const line of this.buf.slice(0, k).split('\n')) this.app.log(line); this.buf = this.buf.slice(k + 1); } }
  flush() { if (this.buf) { this.app.log(this.buf); this.buf = ''; } }
  abort() { this.aborted = true; }

  get(s) { if (s === T) return T; const v = this.g.get(s.name); if (v === undefined) { const dyn = this.dynamicVla(s.name); if (dyn) return dyn; } return v === undefined ? null : v; }
  set(s, v) { if (!(s instanceof Sym)) throw new LispError(`bad argument type: symbolp ${show(s)}`); this.g.set(s.name, v); return v; }

  async ev(x) {
    if (x instanceof Sym) return this.get(x);
    if (!Array.isArray(x)) return x;
    if (++this.steps % 5000 === 0) { await new Promise((r) => setTimeout(r, 0)); if (this.aborted) { this.aborted = false; throw new LispError('Function cancelled'); } }
    const h = x[0];
    if (h instanceof Sym) {
      const sf = SPECIAL[h.name];
      if (sf) return sf.call(this, x);
      const f = this.get(h);
      if (f === null) throw new LispError(`no function definition: ${h.name}`);
      const args = new Array(x.length - 1);
      for (let i = 1; i < x.length; i++) args[i - 1] = await this.ev(x[i]);
      return this.apply(f, args, h.name);
    }
    const f = await this.ev(h);
    const args = [];
    for (let i = 1; i < x.length; i++) args.push(await this.ev(x[i]));
    return this.apply(f, args);
  }
  async apply(f, args, name) {
    if (typeof f === 'function') return f.call(this, args);
    if (f instanceof Fn) {
      if (args.length !== f.params.length) throw new LispError(args.length > f.params.length ? 'too many arguments' : 'too few arguments');
      const vars = [...f.params, ...f.locals];
      const saved = vars.map((v) => (this.g.has(v.name) ? this.g.get(v.name) : undefined));
      f.params.forEach((p, i) => this.g.set(p.name, args[i]));
      f.locals.forEach((p) => this.g.set(p.name, null));
      try {
        let r = null;
        for (const b of f.body) r = await this.ev(b);
        return r;
      } finally {
        vars.forEach((v, i) => { if (saved[i] === undefined) this.g.delete(v.name); else this.g.set(v.name, saved[i]); });
      }
    }
    if (f instanceof Sym) return this.apply(this.get(f), args, f.name);
    if (Array.isArray(f) && f[0] instanceof Sym && f[0].name === 'LAMBDA') return this.apply(this.makeLambda(f), args);
    throw new LispError(`bad function: ${show(f)}${name ? ' ' + name : ''}`);
  }
  makeLambda(x, name = null) {
    const ps = [], ls = []; let loc = false;
    for (const a of x[1] || []) { if (a instanceof Sym && a.name === '/') { loc = true; continue; } (loc ? ls : ps).push(a); }
    return new Fn(name, ps, ls, x.slice(2));
  }
  fnOf(v) { if (v instanceof Sym) return this.get(v); return v; }

  // ---------- puntos de entrada
  async evalString(src) {
    const forms = read(src);
    let r = null;
    for (const f of forms) r = await this.ev(f);
    return r;
  }
  async guarded(fn) {
    this.running++;
    try { return await fn(); }
    catch (e) {
      const msg = e instanceof Cancel ? 'Function cancelled' : (e.message || String(e));
      if (!(e instanceof LispError) && !(e instanceof Cancel)) console.error(e);
      const h = this.g.get('*ERROR*');
      this.flush();
      if (h) { try { await this.apply(h, [msg]); } catch (e2) { this.app.log('; error: ' + (e2.message || e2)); } }
      else this.app.log('; error: ' + msg);
      if (this.eng.active && this.eng.req) this.eng.cancel();
      return undefined;
    } finally { this.running--; this.flush(); }
  }
  async evalTyped(text, returnValue = false) {
    if (text.startsWith('!')) text = text.slice(1);
    const r = await this.guarded(() => this.evalString(text));
    if (r === undefined) return null;
    if (!returnValue && r !== SILENT) this.app.log(show(r));
    return r;
  }
  hasCommand(name) { const f = this.g.get('C:' + name.toUpperCase()); return f instanceof Fn || typeof f === 'function'; }
  async callCommand(name) {
    const r = await this.guarded(() => this.apply(this.g.get('C:' + name.toUpperCase()), []));
    if (r !== undefined && r !== SILENT && r !== null) this.app.log(show(r));
  }
  async loadText(src, name = 'unnamed') {
    const r = await this.guarded(() => this.evalString(src));
    if (r !== undefined) { if (r !== SILENT) this.app.log(show(r)); }
    return r;
  }
  addFile(name, content) { this.fs.set(name.toLowerCase(), content); }
  findFile(name) {
    const k = String(name).toLowerCase().replace(/\\/g, '/').split('/').pop();
    for (const c of [k, k + '.lsp']) if (this.fs.has(c)) return c;
    return null;
  }
  toInputToken(v) {
    if (Array.isArray(v) && toPt(v)) return toPt(v);
    if (isNum(v)) return String(num(v));
    if (v instanceof Ename) return { __ent: v.e };
    if (v instanceof PickSet) return { __ss: true, items: v.items };
    if (typeof v === 'string') return v;
    return show(v, true);
  }
  async runScript(text) {
    const toks = [];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/\s+$/, '');
      if (line.trim().startsWith('(')) { toks.push({ lisp: line }); continue; }
      if (line.trim().startsWith(';')) continue;
      const parts = line.split(' ');
      for (const p of parts) toks.push(p);
      toks.push('');
    }
    for (const t of toks) {
      if (t && t.lisp) { await this.evalTyped(t.lisp); continue; }
      if (!this.eng.active) { if (t) { this.eng.run(t); await this.eng.waitSettled(); } continue; }
      await this.eng.waitSettled();
      this.eng.inputToken(t === '' ? null : t);
      await this.eng.waitSettled();
    }
  }

  // ---------- (command ...)
  async command(args) {
    const eng = this.eng;
    this.flush();
    if (!args.length) { if (eng.active) eng.cancel(); return null; }
    for (const a of args) {
      let tok = a;
      if (a === '\\' || a === PAUSE) tok = PAUSE;
      else if (Array.isArray(a) && toPt(a)) tok = toPt(a);
      else if (a instanceof Ename) tok = { __ent: a.parent || a.e, p: null };
      else if (a instanceof PickSet) tok = { __ss: true, items: a.items };
      else if (isNum(a)) tok = String(num(a));
      else if (a === null) tok = null;
      else if (a instanceof Sym) tok = a.name;
      if (!eng.active) {
        if (typeof tok !== 'string' || !tok) continue;
        const name = eng.resolveName(tok);
        if (!name) { this.app.log(`Unknown command "${tok.toUpperCase()}".`); throw new LispError('invalid AutoCAD command: ' + tok); }
        eng.run(tok);
        await eng.waitSettled();
        continue;
      }
      await eng.waitSettled();
      if (!eng.active) continue;
      if (tok === PAUSE) {
        const r = eng.req;
        await new Promise((res) => { const chk = () => { if (eng.req !== r || !eng.active) res(); else eng.waiters.push(chk); }; chk(); });
        await eng.waitSettled();
        continue;
      }
      eng.inputToken(tok);
      await eng.waitSettled();
    }
    return null;
  }

  // ---------- entrada de usuario (get*)
  async getInput(kind, args, extra = {}) {
    const ig = this.initgetState; this.initgetState = null;
    let base = null, msg = '';
    for (const a of args) { if (typeof a === 'string') msg = a; else if (toPt(a)) base = toPt(a); }
    this.flush();
    const kws = ig?.kws ? ig.kws.map((k) => ({ name: k.replace(/[^A-Za-z0-9_-]/g, '') || k, key: (k.replace(/[^A-Z0-9]/g, '') || k).toUpperCase() })) : null;
    for (;;) {
      const req = { kind, prompt: msg || '', kws, wantsPoint: ['point', 'dist', 'angle'].includes(kind), base: extra.base || base, rubber: kind === 'corner' ? 'rect' : (base ? 'line' : false), spaces: extra.spaces };
      if (kind === 'corner') { req.kind = 'point'; req.wantsPoint = true; }
      if (kind === 'kw') req.kind = 'kw';
      let r = await this.eng.ask(req);
      if (r && typeof r === 'object' && r.str) r = r.str;
      if (r == null && ig && (ig.bits & 1)) { this.app.log('Requires a value.'); continue; }
      if (typeof r === 'number' && ig) { if ((ig.bits & 2) && r === 0) { this.app.log('Value must be nonzero.'); continue; } if ((ig.bits & 4) && r < 0) { this.app.log('Value must be positive.'); continue; } }
      return r;
    }
  }

  // ---------- conversión entidad <-> lista DXF
  entget(en) {
    const e = en.e; if (!e) return null;
    const out = [];
    const P = (k, v) => out.push(new Pair(k, v));
    const Pt = (k, p) => out.push([k, R(p.x), R(p.y), R(0)]);
    P(-1, en);
    if (en.seqend) { P(0, 'SEQEND'); P(-2, new Ename(en.parent)); return out; }
    const type = e.type;
    P(0, type);
    P(5, e.hid || '0');
    const d = this.doc;
    const inPaper = d.layouts.some((l) => l.ents.includes(e));
    if (inPaper) { P(67, 1); P(410, d.layouts.find((l) => l.ents.includes(e)).name); } else P(410, 'Model');
    P(8, e.layer || '0');
    if (e.ltype && e.ltype.toUpperCase() !== 'BYLAYER') P(6, e.ltype);
    if (e.color != null && e.color !== 256) P(62, e.color);
    if (e.lw != null && e.lw !== -1) P(370, e.lw);
    if (e.lts && e.lts !== 1) P(48, R(e.lts));
    switch (type) {
      case 'LINE': Pt(10, e.p1); Pt(11, e.p2); break;
      case 'XLINE': case 'RAY': Pt(10, e.p); Pt(11, e.dir); break;
      case 'CIRCLE': Pt(10, e.c); P(40, R(e.r)); break;
      case 'ARC': Pt(10, e.c); P(40, R(e.r)); P(50, R(G.normA(e.a1))); P(51, R(G.normA(e.a2))); break;
      case 'POINT': Pt(10, e.p); break;
      case 'LWPOLYLINE': P(90, e.pts.length); P(70, e.closed ? 1 : 0); P(43, R(e.cw_ || 0)); for (const v of e.pts) { out.push([10, R(v.x), R(v.y)]); P(40, R(0)); P(41, R(0)); P(42, R(v.b || 0)); P(91, 0); } break;
      case 'TEXT': case 'ATTRIB': case 'ATTDEF':
        Pt(10, e.p); P(40, R(e.h || 2.5)); P(1, e.text ?? e.def ?? ''); P(50, R(e.rot || 0)); P(41, R(e.wf || 1)); P(7, e.style || 'Standard'); P(72, e.ha || 0); Pt(11, e.p2 || e.p); P(73, e.va || 0);
        if (type !== 'TEXT') { P(2, e.tag); P(70, (e.invisible ? 1 : 0) | (e.constant ? 2 : 0)); if (type === 'ATTDEF') P(3, e.prompt || ''); }
        break;
      case 'MTEXT': Pt(10, e.p); P(40, R(e.h)); P(41, R(e.w || 0)); P(71, e.att || 1); P(1, e.text); P(7, e.style || 'Standard'); P(50, R(e.rot || 0)); break;
      case 'INSERT': if (e.attribs?.length) P(66, 1); P(2, e.name); Pt(10, e.p); P(41, R(e.sx ?? 1)); P(42, R(e.sy ?? 1)); P(43, R(1)); P(50, R(e.rot || 0)); P(70, e.cols || 0); P(71, e.rows || 0); break;
      case 'ELLIPSE': Pt(10, e.c); Pt(11, e.major); P(40, R(e.ratio)); P(41, R(e.a1 ?? 0)); P(42, R(e.a2 ?? G.TAU)); break;
      case 'SPLINE': P(70, e.closed ? 1 : 0); P(71, e.deg || 3); for (const c of e.cps || []) Pt(10, c); for (const f of e.fit || []) Pt(11, f); break;
      case 'HATCH': P(2, e.solid ? 'SOLID' : e.pattern); P(70, e.solid ? 1 : 0); P(41, R(e.scale || 1)); P(52, R(e.angle || 0)); P(91, e.loops.length); for (const v of e.loops[0] || []) Pt(10, v); break;
      case 'DIMENSION': if (e.dp) Pt(10, e.dp); if (e.p1) Pt(13, e.p1); if (e.p2) Pt(14, e.p2); if (e.c) Pt(15, e.c); P(1, e.text || ''); P(42, R(E.dimMeasure(e))); P(70, { linear: 0, aligned: 1, angular: 2, diameter: 3, radius: 4, ordinate: 6 }[e.dt] ?? 0); P(50, R(e.rot || 0)); P(3, 'ISO-25'); break;
      case 'SOLID': e.pts.forEach((p, i) => Pt(10 + i, p)); break;
      case 'LEADER': for (const p of e.pts) Pt(10, p); break;
      case 'VIEWPORT': Pt(10, e.c); P(40, R(e.w)); P(41, R(e.h)); Pt(12, e.vc); P(45, R(e.h / e.scale)); break;
    }
    return out;
  }
  applyList(e, lst, isNew) {
    const get = (k) => { const it = lst.find((x) => (x instanceof Pair ? x.a === k : Array.isArray(x) && x[0] === k)); if (!it) return undefined; return it instanceof Pair ? it.d : it.slice(1); };
    const all = (k) => lst.filter((x) => (x instanceof Pair ? x.a === k : Array.isArray(x) && x[0] === k)).map((x) => (x instanceof Pair ? x.d : x.slice(1)));
    const pt = (k) => { const v = get(k); return v === undefined ? undefined : toPt(v); };
    const nv = (k) => { const v = get(k); return v === undefined ? undefined : num(v); };
    const set = (field, v) => { if (v !== undefined) e[field] = v; };
    set('layer', get(8)); if (get(62) !== undefined) e.color = num(get(62)); if (get(6) !== undefined) e.ltype = String(get(6)).toUpperCase(); if (get(370) !== undefined) e.lw = num(get(370)); if (get(48) !== undefined) e.lts = nv(48);
    if (e.layer) this.doc.ensureLayer(e.layer);
    switch (e.type) {
      case 'LINE': set('p1', pt(10)); set('p2', pt(11)); break;
      case 'XLINE': case 'RAY': set('p', pt(10)); set('dir', pt(11)); break;
      case 'CIRCLE': set('c', pt(10)); set('r', nv(40)); break;
      case 'ARC': set('c', pt(10)); set('r', nv(40)); set('a1', nv(50)); set('a2', nv(51)); break;
      case 'POINT': set('p', pt(10)); break;
      case 'LWPOLYLINE': {
        const verts = []; let cur = null;
        for (const it of lst) {
          if (Array.isArray(it) && it[0] === 10) { cur = { x: num(it[1]), y: num(it[2]), b: 0 }; verts.push(cur); }
          else if (it instanceof Pair && it.a === 42 && cur) cur.b = num(it.d);
        }
        if (verts.length) e.pts = verts;
        if (get(70) !== undefined) e.closed = !!(num(get(70)) & 1);
        if (get(43) !== undefined && nv(43) > 0) e.cw_ = nv(43);
        if (!e.pts) e.pts = [];
        break;
      }
      case 'TEXT': case 'ATTRIB': case 'ATTDEF':
        set('p', pt(10)); set('h', nv(40)); if (get(1) !== undefined) e.text = String(get(1)); set('rot', nv(50)); set('wf', nv(41)); set('style', get(7)); set('ha', nv(72)); set('va', nv(73)); set('p2', pt(11));
        if (e.type !== 'TEXT') { set('tag', get(2)); if (get(70) !== undefined) { e.invisible = !!(nv(70) & 1); e.constant = !!(nv(70) & 2); } if (get(3) !== undefined) e.prompt = get(3); if (e.type === 'ATTDEF' && get(1) !== undefined) e.def = String(get(1)); }
        break;
      case 'MTEXT': set('p', pt(10)); set('h', nv(40)); set('w', nv(41)); set('att', nv(71)); if (get(1) !== undefined) e.text = all(3).join('') + String(get(1)); set('rot', nv(50)); set('style', get(7)); break;
      case 'INSERT': set('name', get(2)); set('p', pt(10)); set('sx', nv(41)); set('sy', nv(42)); set('rot', nv(50)); break;
      case 'ELLIPSE': set('c', pt(10)); set('major', pt(11)); set('ratio', nv(40)); set('a1', nv(41)); set('a2', nv(42)); break;
      case 'SPLINE': { const cps = all(10).map(toPt), fit = all(11).map(toPt); if (cps.length) e.cps = cps; if (fit.length) e.fit = fit; set('deg', nv(71)); if (get(70) !== undefined) e.closed = !!(nv(70) & 1); break; }
      case 'SOLID': { const p = [10, 11, 12, 13].map(pt).filter(Boolean); if (p.length >= 3) e.pts = p.length === 3 ? [...p, p[2]] : p; break; }
      case 'LEADER': { const p = all(10).map(toPt); if (p.length) e.pts = p; break; }
      case 'DIMENSION': set('dp', pt(10)); set('p1', pt(13)); set('p2', pt(14)); set('c', pt(15)); if (get(1) !== undefined) e.text = get(1) || undefined; set('rot', nv(50)); break;
      case 'HATCH': { const p = get(2); if (p) { e.pattern = String(p).toUpperCase(); e.solid = e.pattern === 'SOLID'; } set('scale', nv(41)); set('angle', nv(52)); const v = all(10).map(toPt); if (v.length >= 3) e.loops = [v.map((q) => ({ ...q, b: 0 }))]; break; }
    }
    E.invalidate(e);
  }
  enameOf(e) { return e ? new Ename(e) : null; }

  // filtro ssget
  matchFilter(e, flt) {
    if (!flt) return true;
    const al = this.entget(new Ename(e));
    const val = (code) => al.filter((x) => (x instanceof Pair ? x.a === code : x[0] === code)).map((x) => (x instanceof Pair ? x.d : x.slice(1)));
    const test1 = (it) => {
      const code = it instanceof Pair ? it.a : it[0], want = it instanceof Pair ? it.d : it.slice(1);
      const have = val(code);
      if (typeof want === 'string') return have.some((h) => typeof h === 'string' && wcmatch(h, want, true));
      if (isNum(want)) return have.some((h) => isNum(h) && num(h) === num(want)) || (code === 62 && !have.length && num(want) === 256);
      return true;
    };
    let i = 0;
    const group = (op) => {
      const res = [];
      while (i < flt.length) {
        const it = flt[i++];
        if (it instanceof Pair && it.a === -4) {
          const o = String(it.d).toUpperCase();
          if (o.startsWith('<')) res.push(group(o.slice(1)));
          else return combine(op, res);
        } else res.push(test1(it));
      }
      return combine(op, res);
    };
    const combine = (op, r) => op === 'OR' ? r.some(Boolean) : op === 'XOR' ? r.filter(Boolean).length === 1 : op === 'NOT' ? !r.every(Boolean) : r.every(Boolean);
    return group('AND');
  }

  // ActiveX mínimo: vla-get-xxx / vla-put-xxx
  dynamicVla(name) {
    const m = /^VLA-(GET|PUT)-(.+)$/.exec(name);
    if (!m) return null;
    const prop = m[2];
    const self = this;
    const f = async function (args) { return m[1] === 'GET' ? self.vlaGet(args[0], prop) : self.vlaPut(args[0], prop, args[1]); };
    f.lname = name.toLowerCase();
    return f;
  }
  entOf(o) { if (o instanceof Ename) return o.e; if (o instanceof VlaObj && o.kind === 'ent') return o.ref; throw new LispError('bad argument type: VLA-OBJECT ' + show(o)); }
  vlaGet(o, prop) {
    prop = prop.toUpperCase();
    if (o instanceof VlaObj && o.kind !== 'ent') {
      if (prop === 'ACTIVEDOCUMENT') return new VlaObj('doc');
      if (prop === 'MODELSPACE') return new VlaObj('ms');
      if (prop === 'PAPERSPACE') return new VlaObj('ps');
      if (prop === 'ACTIVELAYOUT') return new VlaObj('layout');
      if (prop === 'NAME') return this.doc.name;
      if (prop === 'COUNT' && o.kind === 'ms') return this.doc.model.length;
      return null;
    }
    const e = this.entOf(o);
    switch (prop) {
      case 'LAYER': return e.layer;
      case 'COLOR': return e.color ?? 256;
      case 'LINETYPE': return e.ltype || 'ByLayer';
      case 'OBJECTNAME': return 'AcDb' + ({ LWPOLYLINE: 'Polyline', INSERT: 'BlockReference', TEXT: 'Text', MTEXT: 'MText', LINE: 'Line', CIRCLE: 'Circle', ARC: 'Arc', HATCH: 'Hatch', DIMENSION: 'RotatedDimension', ELLIPSE: 'Ellipse', SPLINE: 'Spline', POINT: 'Point' }[e.type] || e.type);
      case 'HANDLE': return e.hid;
      case 'LENGTH': return R(E.entLength(e));
      case 'AREA': return R(E.entArea(e));
      case 'RADIUS': return R(e.r);
      case 'DIAMETER': return R(e.r * 2);
      case 'CENTER': return ptList(e.c);
      case 'STARTPOINT': return ptList(e.type === 'LINE' ? e.p1 : e.type === 'ARC' ? G.polar(e.c, e.a1, e.r) : E.curvePoints(e)[0]);
      case 'ENDPOINT': { if (e.type === 'LINE') return ptList(e.p2); if (e.type === 'ARC') return ptList(G.polar(e.c, e.a2, e.r)); const p = E.curvePoints(e); return ptList(p[p.length - 1]); }
      case 'TEXTSTRING': return e.type === 'ATTRIB' ? e.text : e.text ?? '';
      case 'HEIGHT': return R(e.h || 0);
      case 'ROTATION': return R(e.rot || 0);
      case 'INSERTIONPOINT': return ptList(e.p);
      case 'NAME': case 'EFFECTIVENAME': return e.name;
      case 'XSCALEFACTOR': return R(e.sx ?? 1);
      case 'YSCALEFACTOR': return R(e.sy ?? 1);
      case 'CLOSED': return e.closed ? T : null;
      case 'COORDINATES': return (e.pts || []).flatMap((p) => [R(p.x), R(p.y)]);
      case 'TAGSTRING': return e.tag;
      case 'HASATTRIBUTES': return e.attribs?.length ? T : null;
      case 'MEASUREMENT': return R(E.dimMeasure(e));
    }
    throw new LispError(`ActiveX: propiedad ${prop} no soportada`);
  }
  vlaPut(o, prop, v) {
    const e = this.entOf(o); prop = prop.toUpperCase();
    this.doc.touch(e);
    switch (prop) {
      case 'LAYER': e.layer = v; this.doc.ensureLayer(v); break;
      case 'COLOR': e.color = num(v); break;
      case 'LINETYPE': e.ltype = String(v).toUpperCase(); break;
      case 'TEXTSTRING': e.text = v; break;
      case 'HEIGHT': e.h = num(v); break;
      case 'ROTATION': e.rot = num(v); break;
      case 'RADIUS': e.r = num(v); break;
      case 'INSERTIONPOINT': e.p = toPt(v); break;
      case 'CENTER': e.c = toPt(v); break;
      case 'STARTPOINT': e.p1 = toPt(v); break;
      case 'ENDPOINT': e.p2 = toPt(v); break;
      case 'CLOSED': e.closed = truthy(v) && v !== 0; break;
      case 'XSCALEFACTOR': e.sx = num(v); break;
      case 'YSCALEFACTOR': e.sy = num(v); break;
      default: throw new LispError(`ActiveX: propiedad ${prop} no soportada`);
    }
    E.invalidate(e); this.app.view.redraw(); return null;
  }

  installBuiltins() { installBuiltins(this); }
}

// ---------- formas especiales
const SPECIAL = {
  async QUOTE(x) { return x[1] ?? null; },
  async FUNCTION(x) { const v = x[1]; if (Array.isArray(v) && v[0] instanceof Sym && v[0].name === 'LAMBDA') return this.makeLambda(v); return v instanceof Sym ? this.get(v) : v; },
  async SETQ(x) { let v = null; for (let i = 1; i < x.length; i += 2) { v = await this.ev(x[i + 1] ?? null); this.set(x[i], v); } return v; },
  async DEFUN(x) { const f = this.makeLambda(x.slice(1), x[1].name); this.set(x[1], f); return x[1]; },
  async 'DEFUN-Q'(x) { return SPECIAL.DEFUN.call(this, x); },
  async LAMBDA(x) { return this.makeLambda(x); },
  async IF(x) { return truthy(await this.ev(x[1])) ? this.ev(x[2] ?? null) : this.ev(x[3] ?? null); },
  async COND(x) {
    for (let i = 1; i < x.length; i++) { const cl = x[i]; if (!cl) continue; const t = await this.ev(cl[0]); if (truthy(t)) { let r = t; for (let j = 1; j < cl.length; j++) r = await this.ev(cl[j]); return r; } }
    return null;
  },
  async WHILE(x) { let r = null; while (truthy(await this.ev(x[1]))) { for (let i = 2; i < x.length; i++) r = await this.ev(x[i]); } return r; },
  async REPEAT(x) { const n = num(await this.ev(x[1])); let r = null; for (let k = 0; k < n; k++) for (let i = 2; i < x.length; i++) r = await this.ev(x[i]); return r; },
  async FOREACH(x) {
    const v = x[1], lst = await this.ev(x[2]); let r = null;
    const saved = this.g.has(v.name) ? this.g.get(v.name) : undefined;
    try { for (const it of lst || []) { this.set(v, it); for (let i = 3; i < x.length; i++) r = await this.ev(x[i]); } }
    finally { if (saved === undefined) this.g.delete(v.name); else this.g.set(v.name, saved); }
    return r;
  },
  async PROGN(x) { let r = null; for (let i = 1; i < x.length; i++) r = await this.ev(x[i]); return r; },
  async AND(x) { for (let i = 1; i < x.length; i++) if (!truthy(await this.ev(x[i]))) return null; return T; },
  async OR(x) { for (let i = 1; i < x.length; i++) if (truthy(await this.ev(x[i]))) return T; return null; },
  async TRACE(x) { void x; return null; },
  async UNTRACE(x) { void x; return null; },
  async 'VLAX-FOR'(x) {
    const v = x[1], coll = await this.ev(x[2]); let r = null;
    const items = coll instanceof VlaObj && coll.kind === 'ms' ? this.doc.model.slice() : [];
    for (const e of items) { this.set(v, new VlaObj('ent', e)); for (let i = 3; i < x.length; i++) r = await this.ev(x[i]); }
    return r;
  },
};

// ---------- wcmatch
export function wcmatch(s, pat, ci = false) {
  return String(pat).split(/(?<!`),/).some((p) => {
    let neg = false; if (p.startsWith('~')) { neg = true; p = p.slice(1); }
    let re = '';
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (c === '`') { re += (p[++i] || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); continue; }
      if (c === '#') re += '\\d'; else if (c === '@') re += '[A-Za-z]'; else if (c === '.') re += '[^A-Za-z0-9]'; else if (c === '*') re += '.*'; else if (c === '?') re += '.';
      else if (c === '[') { const j = p.indexOf(']', i + 1); let inner = p.slice(i + 1, j < 0 ? p.length : j); if (inner.startsWith('~')) inner = '^' + inner.slice(1); re += '[' + inner.replace(/\\/g, '\\\\') + ']'; i = j < 0 ? p.length : j; }
      else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const ok = new RegExp('^' + re + '$', ci ? 'i' : '').test(s);
    return neg ? !ok : ok;
  });
}

// ---------- funciones integradas
function installBuiltins(L_) {
  const def = (names, f) => { for (const n of names.split(' ')) { const g = function (args) { return f.call(this, args, this); }; g.lname = n; L_.g.set(n.toUpperCase(), g); } };
  const anyReal = (a) => a.some((x) => x instanceof Real);
  // aritmética
  def('+', (a) => mkNum(a.reduce((s, x) => s + num(x), 0), anyReal(a)));
  def('-', (a) => (a.length === 1 ? mkNum(-num(a[0]), anyReal(a)) : mkNum(a.slice(1).reduce((s, x) => s - num(x), num(a[0] ?? 0)), anyReal(a))));
  def('*', (a) => mkNum(a.reduce((s, x) => s * num(x), 1), anyReal(a)));
  def('/', (a) => { if (!a.length) return 0; let v = num(a[0]); const real = anyReal(a); for (const x of a.slice(1)) { const d = num(x); if (d === 0) throw new LispError('divide by zero'); v = real ? v / d : Math.trunc(v / d); } return a.length === 1 ? a[0] : mkNum(v, real); });
  def('1+', (a) => mkNum(num(a[0]) + 1, anyReal(a)));
  def('1-', (a) => mkNum(num(a[0]) - 1, anyReal(a)));
  def('rem', (a) => mkNum(a.slice(1).reduce((s, x) => s % num(x), num(a[0])), anyReal(a)));
  def('abs', (a) => mkNum(Math.abs(num(a[0])), anyReal(a)));
  def('fix', (a) => Math.trunc(num(a[0])));
  def('float', (a) => R(num(a[0])));
  def('sqrt', (a) => R(Math.sqrt(num(a[0]))));
  def('expt', (a) => mkNum(Math.pow(num(a[0]), num(a[1])), anyReal(a)));
  def('exp', (a) => R(Math.exp(num(a[0]))));
  def('log', (a) => R(Math.log(num(a[0]))));
  def('sin', (a) => R(Math.sin(num(a[0]))));
  def('cos', (a) => R(Math.cos(num(a[0]))));
  def('atan', (a) => R(a.length > 1 ? Math.atan2(num(a[0]), num(a[1])) : Math.atan(num(a[0]))));
  def('max', (a) => mkNum(Math.max(...a.map(num)), anyReal(a)));
  def('min', (a) => mkNum(Math.min(...a.map(num)), anyReal(a)));
  def('gcd', (a) => { let x = Math.abs(num(a[0])), y = Math.abs(num(a[1])); while (y) [x, y] = [y, x % y]; return x; });
  def('logand', (a) => a.reduce((s, x) => s & num(x), -1));
  def('logior', (a) => a.reduce((s, x) => s | num(x), 0));
  def('lsh', (a) => { const n = num(a[1] ?? 0); return n >= 0 ? num(a[0]) << n : num(a[0]) >> -n; });
  def('~', (a) => ~num(a[0]));
  def('boole', (a) => { const op = num(a[0]); let r = num(a[1]); for (const x of a.slice(2)) { const b = num(x); let v = 0; for (let k = 0; k < 32; k++) { const i1 = (r >> k) & 1, i2 = (b >> k) & 1, idx = (i1 << 1) | i2; if ((op >> (3 - idx)) & 1) v |= 1 << k; } r = v; } return r; });
  def('pi', () => R(Math.PI));
  L_.g.set('PI', R(Math.PI));
  L_.g.set('PAUSE', '\\');
  // comparación
  const cmp = (f) => (a) => { for (let i = 0; i < a.length - 1; i++) { const x = a[i], y = a[i + 1]; const r = typeof x === 'string' && typeof y === 'string' ? f(x < y ? -1 : x > y ? 1 : 0, 0) : f(num(x), num(y)); if (!r) return null; } return T; };
  def('=', (a) => { for (let i = 0; i < a.length - 1; i++) { const x = a[i], y = a[i + 1]; if (typeof x === 'string' || typeof y === 'string') { if (x !== y) return null; } else if (num(x) !== num(y)) return null; } return T; });
  def('/=', (a) => { const x = a[0], y = a[1]; if (typeof x === 'string' || typeof y === 'string') return x !== y ? T : null; return num(x) !== num(y) ? T : null; });
  def('<', cmp((x, y) => x < y)); def('>', cmp((x, y) => x > y)); def('<=', cmp((x, y) => x <= y)); def('>=', cmp((x, y) => x >= y));
  const equal = (x, y, fuzz = 0) => {
    if (isNum(x) && isNum(y)) return Math.abs(num(x) - num(y)) <= fuzz;
    if (Array.isArray(x) && Array.isArray(y)) return x.length === y.length && x.every((v, i) => equal(v, y[i], fuzz));
    if (x instanceof Pair && y instanceof Pair) return equal(x.a, y.a, fuzz) && equal(x.d, y.d, fuzz);
    if (x instanceof Ename && y instanceof Ename) return x.e === y.e && x.seqend === y.seqend;
    return x === y;
  };
  def('eq', (a) => (a[0] === a[1] || (a[0] instanceof Ename && a[1] instanceof Ename && a[0].e === a[1].e) || (isNum(a[0]) && isNum(a[1]) && !(a[0] instanceof Real) && num(a[0]) === num(a[1])) ? T : null));
  def('equal', (a) => (equal(a[0], a[1], a[2] ? num(a[2]) : 0) ? T : null));
  def('not null', (a) => (truthy(a[0]) ? null : T));
  def('zerop', (a) => (num(a[0]) === 0 ? T : null));
  def('minusp', (a) => (num(a[0]) < 0 ? T : null));
  def('numberp', (a) => (isNum(a[0]) ? T : null));
  def('listp', (a) => (isList(a[0]) || a[0] instanceof Pair ? T : null));
  def('atom', (a) => (Array.isArray(a[0]) || a[0] instanceof Pair ? null : T));
  def('vl-consp', (a) => (Array.isArray(a[0]) || a[0] instanceof Pair ? T : null));
  def('vl-symbolp', (a) => (a[0] instanceof Sym ? T : null));
  def('boundp', (a) => (a[0] instanceof Sym && L_.g.get(a[0].name) != null ? T : null));
  def('type', (a) => { const x = a[0]; if (x == null) return null; if (typeof x === 'number') return sym('INT'); if (x instanceof Real) return sym('REAL'); if (typeof x === 'string') return sym('STR'); if (x instanceof Sym) return sym('SYM'); if (Array.isArray(x) || x instanceof Pair) return sym('LIST'); if (x instanceof Ename) return sym('ENAME'); if (x instanceof PickSet) return sym('PICKSET'); if (x instanceof Fn) return sym('USUBR'); if (typeof x === 'function') return sym('SUBR'); if (x instanceof LFile) return sym('FILE'); if (x instanceof VlaObj) return sym('VLA-OBJECT'); return sym('UNKNOWN'); });
  // listas
  const car = (x) => (x == null ? null : x instanceof Pair ? x.a : Array.isArray(x) ? x[0] : (() => { throw new LispError('bad argument type: consp ' + show(x)); })());
  const cdr = (x) => (x == null ? null : x instanceof Pair ? x.d : Array.isArray(x) ? L(x.slice(1)) : (() => { throw new LispError('bad argument type: consp ' + show(x)); })());
  def('car', (a) => car(a[0])); def('cdr', (a) => cdr(a[0]));
  for (const c of ['aa', 'ad', 'da', 'dd', 'aaa', 'aad', 'ada', 'add', 'daa', 'dad', 'dda', 'ddd', 'addd', 'dddd', 'aadd', 'adda']) def('c' + c + 'r', (a) => { let x = a[0]; for (let i = c.length - 1; i >= 0; i--) x = c[i] === 'a' ? car(x) : cdr(x); return x; });
  def('cons', (a) => (Array.isArray(a[1]) ? [a[0], ...a[1]] : a[1] == null ? [a[0]] : new Pair(a[0], a[1])));
  def('list', (a) => L(a.slice()));
  def('append', (a) => L(a.flatMap((x) => (x == null ? [] : x))));
  def('reverse', (a) => L((a[0] || []).slice().reverse()));
  def('length vl-list-length', (a) => (a[0] || []).length);
  def('nth', (a) => (a[1] || [])[num(a[0])] ?? null);
  def('last', (a) => (a[0] ? a[0][a[0].length - 1] : null));
  def('member', (a) => { const l = a[1] || []; const i = l.findIndex((x) => equal(x, a[0])); return i < 0 ? null : L(l.slice(i)); });
  def('assoc', (a) => (a[1] || []).find((x) => equal(car(x), a[0])) ?? null);
  def('subst', (a) => { const sub = (l) => (equal(l, a[1]) ? a[0] : Array.isArray(l) ? l.map(sub) : l); return L((a[2] || []).map((x) => (equal(x, a[1]) ? a[0] : x))) ?? sub(a[2]); });
  def('vl-list*', (a) => { const last_ = a[a.length - 1]; const head = a.slice(0, -1); if (Array.isArray(last_)) return [...head, ...last_]; if (last_ == null) return L(head); return head.length === 1 ? new Pair(head[0], last_) : [...head.slice(0, -1), new Pair(head[head.length - 1], last_)]; });
  def('vl-position', (a) => { const i = (a[1] || []).findIndex((x) => equal(x, a[0])); return i < 0 ? null : i; });
  def('vl-remove', (a) => L((a[1] || []).filter((x) => !equal(x, a[0]))));
  def('acad_strlsort', (a) => L((a[0] || []).slice().sort()));
  def('vl-string->list', (a) => L([...str(a[0])].map((c) => c.charCodeAt(0))));
  def('vl-list->string', (a) => (a[0] || []).map((c) => String.fromCharCode(num(c))).join(''));
  // funciones de orden superior
  def('apply', async function (a) { return this.apply(this.fnOf(a[0]), a[1] || []); });
  def('mapcar', async function (a) { const f = this.fnOf(a[0]), ls = a.slice(1).map((l) => l || []); const n = Math.min(...ls.map((l) => l.length)); const out = []; for (let i = 0; i < n; i++) out.push(await this.apply(f, ls.map((l) => l[i]))); return L(out); });
  def('vl-remove-if', async function (a) { const f = this.fnOf(a[0]); const out = []; for (const x of a[1] || []) if (!truthy(await this.apply(f, [x]))) out.push(x); return L(out); });
  def('vl-remove-if-not', async function (a) { const f = this.fnOf(a[0]); const out = []; for (const x of a[1] || []) if (truthy(await this.apply(f, [x]))) out.push(x); return L(out); });
  def('vl-member-if', async function (a) { const f = this.fnOf(a[0]), l = a[1] || []; for (let i = 0; i < l.length; i++) if (truthy(await this.apply(f, [l[i]]))) return L(l.slice(i)); return null; });
  def('vl-member-if-not', async function (a) { const f = this.fnOf(a[0]), l = a[1] || []; for (let i = 0; i < l.length; i++) if (!truthy(await this.apply(f, [l[i]]))) return L(l.slice(i)); return null; });
  def('vl-some', async function (a) { const f = this.fnOf(a[0]), ls = a.slice(1).map((l) => l || []); const n = Math.min(...ls.map((l) => l.length)); for (let i = 0; i < n; i++) { const r = await this.apply(f, ls.map((l) => l[i])); if (truthy(r)) return r; } return null; });
  def('vl-every', async function (a) { const f = this.fnOf(a[0]), ls = a.slice(1).map((l) => l || []); const n = Math.min(...ls.map((l) => l.length)); for (let i = 0; i < n; i++) if (!truthy(await this.apply(f, ls.map((l) => l[i])))) return null; return T; });
  const sortBy = async (self, f, l) => { const arr = l.map((x, i) => ({ x, i })); // inserción estable con comparador asíncrono
    const out = []; for (const it of arr) { let lo = 0, hi = out.length; while (lo < hi) { const m = (lo + hi) >> 1; if (truthy(await self.apply(f, [out[m].x, it.x]))) lo = m + 1; else hi = m; } out.splice(lo, 0, it); } return out; };
  def('vl-sort', async function (a) { return L((await sortBy(this, this.fnOf(a[1]), a[0] || [])).map((o) => o.x)); });
  def('vl-sort-i', async function (a) { return L((await sortBy(this, this.fnOf(a[1]), a[0] || [])).map((o) => o.i)); });
  def('eval', async function (a) { return this.ev(a[0]); });
  def('set', function (a) { return this.set(a[0], a[1]); });
  def('read', (a) => { const r = read(str(a[0])); return r.length ? r[0] : null; });
  def('atoms-family', function (a) { const names = [...this.g.keys()]; return L(num(a[0]) === 1 ? names : names.map(sym)); });
  def('vl-symbol-name', (a) => a[0].name);
  def('vl-symbol-value', function (a) { return this.get(a[0]); });
  def('vl-catch-all-apply', async function (a) { try { return await this.apply(this.fnOf(a[0]), a[1] || []); } catch (e) { if (e instanceof Cancel) return new CatchErr('Function cancelled'); return new CatchErr(e.message); } });
  def('vl-catch-all-error-p', (a) => (a[0] instanceof CatchErr ? T : null));
  def('vl-catch-all-error-message', (a) => (a[0] instanceof CatchErr ? a[0].msg : null));
  def('exit quit vl-exit-with-error', (a) => { throw new LispError(a[0] ? String(a[0]) : 'quit / exit abort'); });
  def('vl-exit-with-value', (a) => { throw new LispError(show(a[0])); });
  def('vl-load-com vl-load-reactors vl-arx-import vl-acad-defun vl-vbaload vlr-remove-all', () => T);
  def('vl-doc-set vl-bb-set', function (a) { return this.set(a[0], a[1]); });
  def('vl-doc-ref vl-bb-ref', function (a) { return this.get(a[0]); });
  def('vl-propagate', () => null);
  def('vl-registry-read vl-registry-write', () => null);
  // cadenas
  def('strcat', (a) => a.map((x) => str(x)).join(''));
  def('strlen', (a) => a.reduce((s, x) => s + str(x).length, 0));
  def('substr', (a) => { const s = str(a[0]), i = num(a[1]) - 1; return a[2] != null ? s.substr(i, num(a[2])) : s.slice(i); });
  def('strcase', (a) => (truthy(a[1]) ? str(a[0]).toLowerCase() : str(a[0]).toUpperCase()));
  def('itoa', (a) => String(Math.trunc(num(a[0]))));
  def('atoi', (a) => { const v = parseInt(str(a[0]), 10); return isNaN(v) ? 0 : v; });
  def('atof', (a) => { const v = parseFloat(str(a[0])); return R(isNaN(v) ? 0 : v); });
  def('chr', (a) => String.fromCharCode(num(a[0])));
  def('ascii', (a) => (str(a[0]).length ? str(a[0]).charCodeAt(0) : 0));
  def('wcmatch', (a) => (wcmatch(str(a[0]), str(a[1])) ? T : null));
  const trimSet = (s, chars, l, r) => { const set_ = new Set([...(chars ?? ' \t\n')]); let i = 0, j = s.length; if (l) while (i < j && set_.has(s[i])) i++; if (r) while (j > i && set_.has(s[j - 1])) j--; return s.slice(i, j); };
  def('vl-string-trim', (a) => trimSet(str(a[1]), str(a[0]), true, true));
  def('vl-string-left-trim', (a) => trimSet(str(a[1]), str(a[0]), true, false));
  def('vl-string-right-trim', (a) => trimSet(str(a[1]), str(a[0]), false, true));
  def('vl-string-search', (a) => { const i = str(a[1]).indexOf(str(a[0]), a[2] ? num(a[2]) : 0); return i < 0 ? null : i; });
  def('vl-string-subst', (a) => { const s = str(a[2]), pat = str(a[1]), i = s.indexOf(pat, a[3] ? num(a[3]) : 0); return i < 0 ? s : s.slice(0, i) + str(a[0]) + s.slice(i + pat.length); });
  def('vl-string-translate', (a) => [...str(a[2])].map((c) => { const i = str(a[0]).indexOf(c); return i >= 0 ? str(a[1])[i] ?? c : c; }).join(''));
  def('vl-string-position', (a) => { const s = str(a[1]), c = String.fromCharCode(num(a[0])); const i = truthy(a[3]) ? s.lastIndexOf(c) : s.indexOf(c, a[2] ? num(a[2]) : 0); return i < 0 ? null : i; });
  def('vl-string-elt', (a) => str(a[0]).charCodeAt(num(a[1])));
  def('vl-prin1-to-string', (a) => show(a[0]));
  def('vl-princ-to-string', (a) => show(a[0], true));
  def('vl-filename-base', (a) => str(a[0]).replace(/\\/g, '/').split('/').pop().replace(/\.[^.]*$/, ''));
  def('vl-filename-extension', (a) => { const m = /\.[^./\\]*$/.exec(str(a[0])); return m ? m[0] : null; });
  def('vl-filename-directory', (a) => { const s = str(a[0]).replace(/\\/g, '/'); const i = s.lastIndexOf('/'); return i < 0 ? '' : s.slice(0, i); });
  def('vl-filename-mktemp', () => 'tmp' + Date.now().toString(36) + '.tmp');
  def('vl-file-directory-p', () => null);
  def('vl-directory-files', function () { return L([...this.fs.keys()]); });
  def('vl-file-delete', function (a) { return this.fs.delete(str(a[0]).toLowerCase()) ? T : null; });
  // conversión numérica
  def('rtos', function (a) {
    const v = num(a[0]), mode = a[1] != null ? num(a[1]) : this.doc.vars.LUNITS, prec = a[2] != null ? num(a[2]) : this.doc.vars.LUPREC;
    if (mode === 1) return v.toExponential(prec).replace(/e([+-])(\d)$/, 'E$10$2').replace('e', 'E');
    if (mode === 4 || mode === 3) { const ft = Math.trunc(v / 12), inch = v - ft * 12; return `${ft}'-${mode === 3 ? inch.toFixed(prec) : Math.round(inch)}"`; }
    if (mode === 5) { const w = Math.trunc(v), f = v - w, den = 2 ** Math.max(1, prec); const n = Math.round(f * den); return n ? `${w} ${n}/${den}` : String(w); }
    return v.toFixed(prec);
  });
  def('angtos', function (a) {
    const v = G.normA(num(a[0])), mode = a[1] != null ? num(a[1]) : this.doc.vars.AUNITS, prec = a[2] != null ? num(a[2]) : this.doc.vars.AUPREC;
    if (mode === 1) { const d = G.deg(v), dd = Math.trunc(d), m = (d - dd) * 60, mm = Math.trunc(m), s = (m - mm) * 60; return `${dd}d${mm}'${s.toFixed(prec)}"`; }
    if (mode === 2) return (v * 200 / Math.PI).toFixed(prec) + 'g';
    if (mode === 3) return v.toFixed(prec) + 'r';
    return G.deg(v).toFixed(prec);
  });
  def('distof', (a) => { const v = parseFloat(str(a[0])); return isNaN(v) ? null : R(v); });
  def('angtof', (a) => { const s = str(a[0]).trim(); const m = /^([-+]?\d+)d(\d+)'([\d.]+)"?$/i.exec(s); if (m) return R(G.rad(+m[1] + +m[2] / 60 + +m[3] / 3600)); if (/r$/i.test(s)) return R(parseFloat(s)); const v = parseFloat(s); return isNaN(v) ? null : R(G.rad(v)); });
  def('cvunit', (a) => { const k = { inch: { mm: 25.4, cm: 2.54, m: 0.0254, inch: 1, foot: 1 / 12 }, mm: { inch: 1 / 25.4, mm: 1, cm: 0.1, m: 0.001 }, m: { mm: 1000, cm: 100, m: 1, inch: 39.3701 }, degree: { radian: Math.PI / 180, degree: 1 }, radian: { degree: 180 / Math.PI, radian: 1 } }; const f = k[String(a[1]).toLowerCase()]?.[String(a[2]).toLowerCase()]; if (!f) return null; return Array.isArray(a[0]) ? a[0].map((x) => R(num(x) * f)) : R(num(a[0]) * f); });
  // geometría
  def('polar', (a) => { const p = toPt(a[0]); const q = G.polar(p, num(a[1]), num(a[2])); return ptList(q); });
  def('distance', (a) => R(G.dist(toPt(a[0]), toPt(a[1]))));
  def('angle', (a) => R(G.normA(G.ang(toPt(a[0]), toPt(a[1])))));
  def('inters', (a) => { const r = G.llInter(toPt(a[0]), toPt(a[1]), toPt(a[2]), toPt(a[3]), a.length > 4 && !truthy(a[4]), a.length > 4 && !truthy(a[4])); return r.length ? ptList(r[0]) : null; });
  def('trans', (a) => a[0]);
  def('osnap', function (a) { const p = toPt(a[0]); const modes = str(a[1]).toLowerCase().split(',').map((s) => s.trim().slice(0, 3)); for (const m of modes) { const r = this.app.osnapAt(p, m === 'non' ? null : m); if (r) return ptList(r.p); } return null; });
  def('textbox', function (a) { const al = a[0]; const t = (al.find((x) => x instanceof Pair && x.a === 1) || {}).d || ''; const h = num((al.find((x) => x instanceof Pair && x.a === 40) || {}).d ?? this.doc.vars.TEXTSIZE); return [[R(0), R(-0.2 * h), R(0)], [R(E.textWidth(t, h)), R(h), R(0)]]; });
  // salida
  def('princ', function (a) { if (!a.length) return SILENT; this.write(show(a[0], true)); return a[0]; });
  def('prin1', function (a) { if (!a.length) return SILENT; this.write(show(a[0])); return a[0]; });
  def('print', function (a) { this.write('\n' + show(a[0]) + ' '); return a[0]; });
  def('prompt', function (a) { this.write(show(a[0], true)); return null; });
  def('terpri', function () { this.write('\n'); return null; });
  def('alert', async function (a) { this.flush(); await this.app.ui.dlg.alert(show(a[0], true)); return null; });
  def('textscr textpage', function () { this.app.ui.cmdline.expand(true); return null; });
  def('graphscr', function () { this.app.ui.cmdline.expand(false); return null; });
  def('redraw', function () { this.app.view.redraw(); return null; });
  def('menucmd setcfg getcfg acad_helpdlg help startapp setview grdraw grvecs grtext', () => null);
  def('ver', () => 'Visual LISP 2023 (en) WebCAD');
  def('getenv', (a) => { try { return localStorage.getItem('webcad.env.' + str(a[0])) ?? null; } catch (_) { return null; } });
  def('setenv', (a) => { try { localStorage.setItem('webcad.env.' + str(a[0]), str(a[1])); } catch (_) { /* nada */ } return a[1]; });
  // ficheros virtuales
  def('findfile', function (a) { return this.findFile(str(a[0])); });
  def('load', async function (a) { const k = this.findFile(str(a[0])); if (!k) { if (a.length > 1) return a[1]; throw new LispError(`LOAD failed: "${a[0]}"`); } return this.evalString(this.fs.get(k)); });
  def('open', function (a) { const name = str(a[0]).toLowerCase().replace(/\\/g, '/').split('/').pop(); const mode = str(a[1]).toLowerCase(); if (mode === 'r') { const k = this.findFile(name) || name; if (!this.fs.has(k)) return null; return new LFile(k, 'r', this.fs.get(k)); } const f = new LFile(name, mode); if (mode === 'a') f.out = (this.fs.get(name) || '').split('\n'); return f; });
  def('close', function (a) { const f = a[0]; if (f instanceof LFile && f.mode !== 'r') this.fs.set(f.name, f.out.join('\n')); return null; });
  def('read-line', (a) => { const f = a[0]; if (!(f instanceof LFile)) return null; return f.pos < f.lines.length && !(f.pos === f.lines.length - 1 && f.lines[f.pos] === '') ? f.lines[f.pos++] : null; });
  def('read-char', (a) => { const f = a[0]; if (!f) return null; const s = f.lines.join('\n'); f.cpos = f.cpos || 0; return f.cpos < s.length ? s.charCodeAt(f.cpos++) : null; });
  def('write-line', function (a) { if (a[1] instanceof LFile) a[1].out.push(str(a[0])); else this.write(str(a[0]) + '\n'); return a[0]; });
  def('write-char', function (a) { const c = String.fromCharCode(num(a[0])); if (a[1] instanceof LFile) { const o = a[1].out; if (!o.length) o.push(''); o[o.length - 1] += c; } else this.write(c); return a[0]; });
  def('getfiled', async function (a) { const f = await this.app.io.pickFile(a[2] ? '.' + str(a[2]) : ''); if (!f) return null; this.addFile(f.name, await f.text()); return f.name.toLowerCase(); });
  // variables de sistema
  def('getvar', function (a) { const v = this.doc.getvar(str(a[0])); if (v === undefined) return null; if (v && typeof v === 'object' && 'x' in v) return ptList(v); if (typeof v === 'number') return Number.isInteger(v) && !['LTSCALE', 'TEXTSIZE', 'FILLETRAD', 'PDSIZE', 'SNAPUNIT', 'GRIDUNIT', 'DIMSCALE', 'DIMTXT', 'DIMASZ', 'CELTSCALE', 'HPSCALE', 'OFFSETDIST', 'CHAMFERA', 'CHAMFERB', 'CIRCLERAD', 'PLINEWID', 'ELEVATION', 'THICKNESS', 'DATE', 'CDATE', 'USERR1', 'USERR2', 'USERR3', 'USERR4', 'USERR5'].includes(str(a[0]).toUpperCase()) ? v : R(v); return v; });
  def('setvar', function (a) { const n = str(a[0]); let v = a[1]; if (Array.isArray(v)) v = toPt(v); else if (isNum(v)) v = num(v); try { this.doc.setvar(n, v); } catch (e) { throw new LispError(e.message); } this.app.ui?.status?.update?.(); this.app.view.redraw(); return a[1]; });
  // entrada de usuario
  def('initget', function (a) { let bits = 0, kws = null; for (const x of a) { if (isNum(x)) bits = num(x); else if (typeof x === 'string') kws = x.trim().split(/\s+/).filter(Boolean); } this.initgetState = { bits, kws }; return null; });
  const ptOut = (r) => (r && typeof r === 'object' && 'x' in r ? ptList(r) : r ?? null);
  def('getpoint', async function (a) { return ptOut(await this.getInput('point', a)); });
  def('getcorner', async function (a) { return ptOut(await this.getInput('corner', a)); });
  def('getdist', async function (a) { const r = await this.getInput('dist', a); return isNum(r) ? R(r) : r; });
  def('getangle getorient', async function (a) { const r = await this.getInput('angle', a); return isNum(r) ? R(r) : r; });
  def('getreal', async function (a) { const r = await this.getInput('real', a); return isNum(r) ? R(r) : r; });
  def('getint', async function (a) { const ig = this.initgetState; let r; for (;;) { this.initgetState = ig; r = await this.getInput('int', a); if (r == null || typeof r === 'string' || Number.isInteger(r)) break; this.app.log('Requires an integer value.'); } return r; });
  def('getstring', async function (a) { let cr = false, msg = ''; if (a.length > 1) { cr = truthy(a[0]); msg = a[1]; } else msg = a[0] || ''; const r = await this.getInput('string', [msg], { spaces: cr }); return r ?? ''; });
  def('getkword', async function (a) { const r = await this.getInput('kw', a); return r ?? null; });
  def('entsel nentsel nentselp', async function (a) {
    this.flush();
    const r = await this.eng.ask({ kind: 'entity', prompt: a[0] || 'Select object: ' });
    if (!r || typeof r !== 'object') return null;
    return [new Ename(r.e), ptList(r.p)];
  });
  def('grread', async function () { const r = await this.eng.ask({ kind: 'point', prompt: '', wantsPoint: true }); return r && r.x !== undefined ? [3, ptList(r)] : [2, 13]; });
  // entidades
  const space = () => L_.doc.space;
  def('entget', function (a) { return a[0] instanceof Ename ? this.entget(a[0]) : null; });
  def('entlast', function () { const s = space(); return s.length ? new Ename(s[s.length - 1]) : null; });
  def('entnext', function (a) {
    const s = this.doc.model.concat(...this.doc.layouts.map((l) => l.ents));
    if (!a[0]) return s.length ? new Ename(s[0]) : null;
    const en = a[0];
    if (en.seqend) { const i = s.indexOf(en.parent); return i >= 0 && i + 1 < s.length ? new Ename(s[i + 1]) : null; }
    if (en.parent) { const atts = en.parent.attribs || []; const i = atts.indexOf(en.e); return i + 1 < atts.length ? new Ename(atts[i + 1], en.parent) : new Ename(null, en.parent, true); }
    if (en.e?.type === 'INSERT' && en.e.attribs?.length) return new Ename(en.e.attribs[0], en.e);
    const i = s.indexOf(en.e); return i >= 0 && i + 1 < s.length ? new Ename(s[i + 1]) : null;
  });
  def('entdel', function (a) { const e = a[0]?.e; if (!e) return null; const own = this.doc.ownerOf(e); if (own) this.doc.remove(e); else { const d = this._deleted?.find((x) => x.e === e); if (d) { this.doc.add(e, d.arr); } } (this._deleted ||= []).push({ e, arr: own || this.doc.space }); this.app.view.redraw(); return a[0]; });
  def('entmod', function (a) {
    const lst = a[0]; const en = (lst || []).find((x) => x instanceof Pair && x.a === -1)?.d; if (!(en instanceof Ename) || !en.e) return null;
    const e = en.e; this.doc.touch(en.parent || e); if (en.parent) E.invalidate(en.parent);
    this.applyList(e, lst, false);
    if (en.parent) E.invalidate(en.parent);
    this.app.view.redraw(); return lst;
  });
  def('entupd', function (a) { if (a[0]?.e) E.invalidate(a[0].e); this.app.view.redraw(); return a[0]; });
  def('entmake entmakex', function (a) {
    const lst = a[0]; if (!lst) { this.blockDef = null; return null; }
    const typ = String((lst.find((x) => x instanceof Pair && x.a === 0) || {}).d || '').toUpperCase();
    const val = (k) => { const it = lst.find((x) => (x instanceof Pair ? x.a === k : Array.isArray(x) && x[0] === k)); return it ? (it instanceof Pair ? it.d : it.slice(1)) : undefined; };
    if (typ === 'BLOCK') { this.blockDef = { name: String(val(2)), base: toPt(val(10)) || { x: 0, y: 0 }, ents: [] }; return lst; }
    if (typ === 'ENDBLK') { const b = this.blockDef; this.blockDef = null; if (!b) return null; this.doc.touchTables(); b.ents.forEach((e, i) => (e.bid = i)); this.doc.blocks[b.name] = { ...b, params: [], _ver: 1 }; return b.name; }
    const types = ['LINE', 'CIRCLE', 'ARC', 'POINT', 'LWPOLYLINE', 'TEXT', 'MTEXT', 'INSERT', 'ELLIPSE', 'SPLINE', 'SOLID', 'LEADER', 'XLINE', 'RAY', 'DIMENSION', 'HATCH', 'ATTDEF'];
    if (!types.includes(typ)) { if (typ === 'POLYLINE' || typ === 'VERTEX' || typ === 'SEQEND') return this.legacyPoly(lst, typ); return null; }
    const e = { type: typ };
    if (typ === 'DIMENSION') e.dt = ['linear', 'aligned', 'angular', 'diameter', 'radius', 'linear', 'ordinate'][(val(70) ? num(val(70)) : 0) & 7];
    this.applyList(e, lst, true);
    if (!e.layer) delete e.layer; if (e.color == null) delete e.color;
    if (typ === 'TEXT' || typ === 'MTEXT' || typ === 'ATTDEF') { e.h = e.h || this.doc.vars.TEXTSIZE; e.text = e.text ?? ''; }
    if (typ === 'INSERT') { if (!this.doc.blocks[e.name]) return null; e.sx = e.sx ?? 1; e.sy = e.sy ?? 1; e.rot = e.rot || 0; }
    if (typ === 'ELLIPSE') { e.a1 = e.a1 ?? 0; e.a2 = e.a2 ?? G.TAU; }
    if (typ === 'SOLID' && !e.pts) return null;
    if (this.blockDef) { this.doc.stamp(e); this.blockDef.ents.push(e); return lst; }
    this.doc.add(e); this.app.view.redraw();
    return lst;
  });
  L_.legacyPoly = function (lst, typ) {
    const val = (k) => { const it = lst.find((x) => (x instanceof Pair ? x.a === k : Array.isArray(x) && x[0] === k)); return it ? (it instanceof Pair ? it.d : it.slice(1)) : undefined; };
    if (typ === 'POLYLINE') { this._poly = { type: 'LWPOLYLINE', pts: [], closed: !!(num(val(70) ?? 0) & 1), layer: val(8) }; return lst; }
    if (typ === 'VERTEX' && this._poly) { const p = toPt(val(10)); this._poly.pts.push({ ...p, b: val(42) ? num(val(42)) : 0 }); return lst; }
    if (typ === 'SEQEND' && this._poly) { const e = this._poly; this._poly = null; if (!e.layer) delete e.layer; this.doc.add(e); this.app.view.redraw(); return lst; }
    return null;
  };
  def('handent', function (a) { const e = this.doc.findHandle(str(a[0])); return e ? new Ename(e) : null; });
  // conjuntos de selección
  def('ssget', async function (a) {
    const eng = this.eng; let mode = null, rest = a, flt = null;
    if (typeof a[0] === 'string') { mode = a[0].toUpperCase().replace(/^_/, ''); rest = a.slice(1); }
    const lastArg = rest[rest.length - 1];
    if (Array.isArray(lastArg) && lastArg.length && (lastArg[0] instanceof Pair || (Array.isArray(lastArg[0])))) { flt = lastArg; rest = rest.slice(0, -1); }
    const ok = (e) => this.doc.isVisible(e) && this.matchFilter(e, flt);
    let items = [];
    if (mode === 'X') items = this.doc.model.concat(...this.doc.layouts.map((l) => l.ents)).filter((e) => this.matchFilter(e, flt));
    else if (mode === 'W' || mode === 'C') items = eng.windowSelect(toPt(rest[0]), toPt(rest[1]), mode === 'C').filter(ok);
    else if (mode === 'L') { const s = space(); items = s.length ? [s[s.length - 1]] : []; }
    else if (mode === 'P') items = (eng.prevSel || []).filter(ok);
    else if (mode === 'I') items = (eng.sel.length ? eng.sel : eng.pickfirst || []).filter(ok);
    else if (mode === 'A' || mode === 'ALL') items = space().filter(ok);
    else if (mode === 'F' || mode === 'WP' || mode === 'CP') {
      const pts = (rest[0] || []).map(toPt);
      if (mode === 'F') { const fence = []; for (let i = 0; i < pts.length - 1; i++) fence.push({ k: 'L', a: pts[i], b: pts[i + 1] }); items = space().filter((e) => ok(e) && E.prims(e, this.doc).some((p) => fence.some((f) => G.primInter(p, f).length))); }
      else items = space().filter((e) => ok(e) && E.prims(e, this.doc).every((p) => G.ptInPoly(p.k === 'L' ? p.a : p.c, pts)));
    } else if (toPt(rest[0]) && !mode) { const e = this.app.view.pickAt(toPt(rest[0])); items = e && ok(e) ? [e] : []; }
    else {
      this.flush();
      const single = mode && mode.includes(':S');
      if (eng.sel.length && !mode) { items = eng.sel.filter(ok); eng.clearSel(); }
      else {
        const req = { kind: 'select', prompt: 'Select objects:', sel: [], mode: 'add', single, filter: (e) => this.matchFilter(e, flt) };
        await eng.ask(req); items = req.sel; eng.prevSel = items.slice();
      }
    }
    return items.length ? new PickSet(items) : null;
  });
  def('ssadd', (a) => { if (!a.length) return new PickSet(); const ss = a[1] instanceof PickSet ? a[1] : new PickSet(); if (a[0] instanceof Ename && !ss.items.includes(a[0].e)) ss.items.push(a[0].e); return ss; });
  def('ssdel', (a) => { const ss = a[1]; if (!(ss instanceof PickSet)) return null; const i = ss.items.indexOf(a[0]?.e); if (i < 0) return null; ss.items.splice(i, 1); return ss; });
  def('sslength', (a) => (a[0] instanceof PickSet ? a[0].items.length : 0));
  def('ssname', (a) => { const e = a[0]?.items?.[num(a[1])]; return e ? new Ename(e) : null; });
  def('ssmemb', (a) => (a[1]?.items?.includes(a[0]?.e) ? a[0] : null));
  def('sssetfirst', function (a) { this.eng.setSel(a[1] instanceof PickSet ? a[1].items : []); return L([a[0], a[1]]); });
  def('ssgetfirst', function () { return [null, this.eng.sel.length ? new PickSet(this.eng.sel.slice()) : null]; });
  def('ssnamex', (a) => L((a[0]?.items || []).map((e) => [0, new Ename(e), 0])));
  // tablas
  const tblEntries = (t) => {
    const d = L_.doc; t = t.toUpperCase();
    if (t === 'LAYER') return Object.values(d.layers).map((l) => [new Pair(0, 'LAYER'), new Pair(2, l.name), new Pair(70, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0)), new Pair(62, l.on ? (typeof l.color === 'number' ? l.color : 7) : -(typeof l.color === 'number' ? l.color : 7)), new Pair(6, l.ltype), new Pair(290, l.plot ? 1 : 0), new Pair(370, l.lw)]);
    if (t === 'BLOCK') return Object.values(d.blocks).map((b) => [new Pair(0, 'BLOCK'), new Pair(2, b.name), new Pair(70, b.name.startsWith('*') ? 1 : 0), [10, R(b.base.x), R(b.base.y), R(0)], new Pair(-2, b.ents.length ? new Ename(b.ents[0]) : null)]);
    if (t === 'LTYPE') return Object.entries(d.ltypes).map(([n, lt]) => [new Pair(0, 'LTYPE'), new Pair(2, n), new Pair(3, lt.desc || ''), new Pair(73, (lt.pat || []).length)]);
    if (t === 'STYLE') return Object.values(d.styles).map((s) => [new Pair(0, 'STYLE'), new Pair(2, s.name), new Pair(40, R(s.h || 0)), new Pair(41, R(s.wf || 1)), new Pair(3, s.font)]);
    if (t === 'VIEW') return Object.entries(d.views).map(([n, v]) => [new Pair(0, 'VIEW'), new Pair(2, n), new Pair(40, R(L_.app.view.H / v.s)), [10, R(v.cx), R(v.cy)]]);
    if (t === 'DIMSTYLE') return [[new Pair(0, 'DIMSTYLE'), new Pair(2, d.vars.DIMSTYLE)]];
    if (t === 'APPID') return [[new Pair(0, 'APPID'), new Pair(2, 'ACAD')]];
    return [];
  };
  def('tblsearch', (a) => tblEntries(str(a[0])).find((x) => String(x[1].d).toUpperCase() === str(a[1]).toUpperCase()) ?? null);
  def('tblnext', function (a) { const t = str(a[0]).toUpperCase(); const list = tblEntries(t); if (truthy(a[1]) || this.tblIter[t] == null) this.tblIter[t] = 0; return list[this.tblIter[t]++] ?? null; });
  def('tblobjname', (a) => { const t = str(a[0]).toUpperCase(); if (t === 'BLOCK') { const b = L_.doc.blocks[str(a[1])]; return b && b.ents[0] ? new Ename(b.ents[0]) : null; } return null; });
  def('namedobjdict', () => null);
  def('dictsearch dictnext', () => null);
  def('regapp', (a) => a[0]);
  def('acad_colordlg', async function (a) { return this.app.ui.dlg.color(a[0] != null ? num(a[0]) : 256); });
  def('acad_truecolordlg', async function () { const c = await this.app.ui.dlg.color(256); return c == null ? null : [new Pair(62, c)]; });
  // command
  def('command vl-cmdf command-s', async function (a) { return this.command(a); });
  // vlax-curve
  const cv = (o) => { const e = o instanceof Ename ? o.e : o instanceof VlaObj ? o.ref : null; if (!e) throw new LispError('bad argument type: curve'); return { e, pts: E.curvePoints(e), len: E.entLength(e) }; };
  const distAt = (pts, q) => { let best = 0, bd = Infinity, acc = 0; for (let i = 1; i < pts.length; i++) { const n = G.primNearest({ k: 'L', a: pts[i - 1], b: pts[i] }, q); const d = G.dist(n, q); if (d < bd) { bd = d; best = acc + G.dist(pts[i - 1], n); } acc += G.dist(pts[i - 1], pts[i]); } return best; };
  def('vlax-curve-getstartpoint', (a) => ptList(cv(a[0]).pts[0]));
  def('vlax-curve-getendpoint', (a) => { const c = cv(a[0]); return ptList(c.pts[c.pts.length - 1]); });
  def('vlax-curve-getdistatparam', (a) => R(Math.min(num(a[1]), cv(a[0]).len)));
  def('vlax-curve-getparamatdist vlax-curve-getparamatpoint', (a) => { const c = cv(a[0]); return R(Array.isArray(a[1]) ? distAt(c.pts, toPt(a[1])) : num(a[1])); });
  def('vlax-curve-getdistatpoint', (a) => R(distAt(cv(a[0]).pts, toPt(a[1]))));
  def('vlax-curve-getpointatdist vlax-curve-getpointatparam', (a) => ptList(E.pointAtLength(cv(a[0]).pts, num(a[1])).p));
  def('vlax-curve-getendparam', (a) => R(cv(a[0]).len));
  def('vlax-curve-getstartparam', () => R(0));
  def('vlax-curve-getclosestpointto', (a) => { const c = cv(a[0]); const q = toPt(a[1]); return ptList(E.pointAtLength(c.pts, distAt(c.pts, q)).p); });
  def('vlax-curve-getfirstderiv', (a) => { const { a: an } = E.pointAtLength(cv(a[0]).pts, num(a[1])); return [R(Math.cos(an)), R(Math.sin(an)), R(0)]; });
  def('vlax-curve-getarea', (a) => R(E.entArea(cv(a[0]).e)));
  def('vlax-curve-isclosed', (a) => { const e = cv(a[0]).e; return e.type === 'CIRCLE' || e.closed ? T : null; });
  // ActiveX mínimo
  def('vlax-get-acad-object', () => new VlaObj('acad'));
  def('vlax-ename->vla-object', (a) => new VlaObj('ent', a[0]?.e));
  def('vlax-vla-object->ename', (a) => (a[0] instanceof VlaObj ? new Ename(a[0].ref) : null));
  def('vlax-get-property vlax-get', function (a) { return this.vlaGet(a[0], a[1] instanceof Sym ? a[1].name : str(a[1])); });
  def('vlax-put-property vlax-put', function (a) { return this.vlaPut(a[0], a[1] instanceof Sym ? a[1].name : str(a[1]), a[2]); });
  def('vlax-variant-value vlax-safearray->list', (a) => a[0]);
  def('vlax-3d-point', (a) => (Array.isArray(a[0]) ? a[0] : [a[0], a[1], a[2] ?? R(0)]));
  def('vlax-make-safearray vlax-safearray-fill vlax-make-variant', (a) => a[1] ?? a[0]);
  def('vlax-release-object vla-startundomark vla-endundomark vla-regen vla-update vla-zoomextents', () => null);
  def('vlax-erased-p', function (a) { const e = a[0] instanceof VlaObj ? a[0].ref : a[0]?.e; return this.doc.ownerOf(e) ? null : T; });
  def('vlax-property-available-p', function (a) { try { this.vlaGet(a[0], a[1] instanceof Sym ? a[1].name : str(a[1])); return T; } catch (_) { return null; } });
  def('vla-delete', function (a) { this.doc.remove(this.entOf(a[0])); this.app.view.redraw(); return null; });
  def('vla-addline', function (a) { const e = this.doc.add({ type: 'LINE', p1: toPt(a[1]), p2: toPt(a[2]) }); this.app.view.redraw(); return new VlaObj('ent', e); });
  def('vla-addcircle', function (a) { const e = this.doc.add({ type: 'CIRCLE', c: toPt(a[1]), r: num(a[2]) }); this.app.view.redraw(); return new VlaObj('ent', e); });
  def('vla-addtext', function (a) { const e = this.doc.add({ type: 'TEXT', text: str(a[1]), p: toPt(a[2]), h: num(a[3]), rot: 0 }); this.app.view.redraw(); return new VlaObj('ent', e); });
  def('vla-addlightweightpolyline', function (a) { const c = a[1] || []; const pts = []; for (let i = 0; i + 1 < c.length; i += 2) pts.push({ x: num(c[i]), y: num(c[i + 1]), b: 0 }); const e = this.doc.add({ type: 'LWPOLYLINE', pts, closed: false }); this.app.view.redraw(); return new VlaObj('ent', e); });
  def('vla-move', function (a) { const e = this.entOf(a[0]); const p1 = toPt(a[1]), p2 = toPt(a[2]); this.doc.touch(e); E.transformEnt(e, G.M.tr(p2.x - p1.x, p2.y - p1.y)); this.app.view.redraw(); return null; });
  def('vla-rotate', function (a) { const e = this.entOf(a[0]); this.doc.touch(e); E.transformEnt(e, G.M.rot(num(a[2]), toPt(a[1]))); this.app.view.redraw(); return null; });
  def('vla-scaleentity', function (a) { const e = this.entOf(a[0]); this.doc.touch(e); E.transformEnt(e, G.M.scale(num(a[2]), toPt(a[1]))); this.app.view.redraw(); return null; });
  def('vla-copy', function (a) { const e = this.entOf(a[0]); const c = E.cloneEnt(e); delete c.hid; this.doc.add(c, this.doc.ownerOf(e) || this.doc.space); return new VlaObj('ent', c); });
  def('vla-getattributes', function (a) { const e = this.entOf(a[0]); return L((e.attribs || []).map((x) => new VlaObj('ent', x))); });
  def('vla-getboundingbox', function (a) { const e = this.entOf(a[0]); const bb = E.entBBox(e, this.doc); this.set(a[1], ptList({ x: bb.x1, y: bb.y1 })); this.set(a[2], ptList({ x: bb.x2, y: bb.y2 })); return null; });
}
export { SILENT, VlaObj };
