// Entidades: geometría, primitivas, osnaps, transformaciones, grips, explode
import * as G from './geom.js';
import { styleFont, strokeWidth } from './fonts.js';
import { tableEnts } from './table.js';
import { ductEnts } from './duct.js';
const { M } = G;

export const ENT_TYPES = ['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE', 'POINT', 'TEXT', 'MTEXT', 'INSERT', 'ELLIPSE', 'SPLINE', 'HATCH', 'DIMENSION', 'SOLID', 'XLINE', 'RAY', 'LEADER', 'ATTDEF', 'VIEWPORT', 'WIPEOUT', 'TABLE', 'DUCT'];

export function cloneEnt(e) {
  return JSON.parse(JSON.stringify(e, (k, v) => (k[0] === '_' ? undefined : v)));
}
export function invalidate(e) { for (const k in e) if (k[0] === '_') delete e[k]; }

// ---------- medición de texto
let mctx = null;
export const FONT = 'Arial, "Liberation Sans", Helvetica, sans-serif';
export const CAP = 0.716;
export function textWidth(str, h, wf = 1, font = null) {
  if (font) return strokeWidth(font, str, h, wf);
  if (!mctx) {
    try { mctx = (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(4, 4) : document.createElement('canvas')).getContext('2d'); } catch (_) { mctx = null; }
  }
  if (!mctx) return str.length * h * 0.75 * wf;
  mctx.font = `100px ${FONT}`;
  return mctx.measureText(str).width / 100 * (h / CAP) * wf;
}
// ---------- campos (sintaxis de AutoCAD: %<\AcVar Title>%, %<\AcVar SaveDate \f "dd/MM/yyyy">%…)
let fieldCtx = () => ({});
export const setFieldContext = (fn) => { fieldCtx = fn; };
const pad = (n, k = 2) => String(n).padStart(k, '0');
export function fmtDate(d, f = 'dd/MM/yyyy') {
  const map = { yyyy: d.getFullYear(), yy: pad(d.getFullYear() % 100), MM: pad(d.getMonth() + 1), M: d.getMonth() + 1, dd: pad(d.getDate()), d: d.getDate(), HH: pad(d.getHours()), H: d.getHours(), mm: pad(d.getMinutes()), ss: pad(d.getSeconds()) };
  return f.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|ss/g, (k) => map[k]);
}
export function evalField(code) {
  const c = fieldCtx() || {}, pr = c.props || {};
  const m = /^\\AcVar\s+(\S+)(?:\s+\\f\s+"([^"]*)")?/i.exec(code.trim());
  if (!m) return '####';
  const name = m[1], f = m[2];
  const n = name.toLowerCase();
  if (n.startsWith('customdp.')) { const k = name.slice(9); const v = Object.entries(pr.custom || {}).find(([a]) => a.toLowerCase() === k.toLowerCase()); return v ? v[1] : ''; }
  switch (n) {
    case 'title': return pr.title || ''; case 'subject': return pr.subject || ''; case 'author': return pr.author || ''; case 'keywords': return pr.keywords || '';
    case 'comments': return pr.comments || ''; case 'lastsavedby': return pr.lastSavedBy || pr.author || ''; case 'revisionnumber': return pr.revision || '';
    case 'ctab': return c.ctab || ''; case 'login': return pr.author || '';
    case 'filename': { const fn = c.name || ''; if (f === '%fn2') return fn.replace(/\.[^.]+$/, ''); if (f === '%fn6' || !f) return fn; return fn; }
    case 'date': case 'savedate': case 'createdate': case 'plotdate': return fmtDate(n === 'savedate' && c.saveDate ? new Date(c.saveDate) : new Date(), f || 'dd/MM/yyyy');
  }
  return '####';
}
export const hasFields = (s) => /%<\\AcVar/i.test(String(s ?? ''));
export function decodeSpecial(s) {
  s = String(s ?? '');
  if (s.includes('%<')) s = s.replace(/%<(\\AcVar[^>]*?)>%/gi, (m, code) => evalField(code));
  return s.replace(/%%[cC]/g, 'Ø').replace(/%%[dD]/g, '°').replace(/%%[pP]/g, '±').replace(/%%%/g, '%').replace(/%%[uUoO]/g, '')
    .replace(/\\U\+([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
export function mtextPlain(s) {
  s = String(s ?? '');
  s = s.replace(/\\P/g, '\n').replace(/\\~/g, ' ').replace(/\\[ACFHQTWfcp][^;\\{}]*;/g, '').replace(/\\[LlOoKkN]/g, '')
    .replace(/\\S([^;]*?)[#^\/]([^;]*);/g, '$1/$2').replace(/[{}]/g, '').replace(/\\\\/g, '\\');
  return decodeSpecial(s);
}
// marco local de un TEXT/ATTRIB/ATTDEF: devuelve origen de línea base izquierda
export function textFrame(e) {
  const str = decodeSpecial(e.text ?? e.def ?? e.tag ?? '');
  const h = e.h || 2.5, wf = e.wf || 1, font = styleFont(e.style || 'Standard');
  let rot = e.rot || 0, w = textWidth(str, h, wf, font);
  const ha = e.ha || 0, va = e.va || 0;
  let o = e.p;
  if ((ha === 3 || ha === 5) && e.p2) {
    rot = G.ang(e.p, e.p2);
    const L = G.dist(e.p, e.p2);
    const k = w > 0 ? L / w : 1;
    return { o: e.p, rot, w: L, h: ha === 3 ? h * k : h, wf: wf * k, str, font };
  }
  if (ha || va) {
    const a = e.p2 || e.p;
    let dx = 0, dy = 0;
    if (ha === 1) dx = -w / 2; else if (ha === 2) dx = -w; else if (ha === 4) { dx = -w / 2; dy = -h / 2; }
    if (ha !== 4) { if (va === 1) dy = h * 0.3; else if (va === 2) dy = -h / 2; else if (va === 3) dy = -h; }
    o = G.add(a, G.rotate({ x: dx, y: dy }, { x: 0, y: 0 }, rot));
  }
  return { o, rot, w, h, wf, str, font };
}
export function mtextLayout(e) {
  const h = e.h || 2.5, plain = mtextPlain(e.text), font = styleFont(e.style || 'Standard');
  const lines = [];
  for (const para of plain.split('\n')) {
    if (!(e.w > 0)) { lines.push(para); continue; }
    let cur = '';
    for (const word of para.split(' ')) {
      const t = cur ? cur + ' ' + word : word;
      if (cur && textWidth(t, h, 1, font) > e.w) { lines.push(cur); cur = word; } else cur = t;
    }
    lines.push(cur);
  }
  const ls = h * 5 / 3 * (e.ls || 1);
  const widths = lines.map((l) => textWidth(l, h, 1, font));
  const W = Math.max(e.w || 0, ...widths, 0);
  const H = h + ls * (lines.length - 1);
  const att = e.att || 1, col = (att - 1) % 3, row = Math.floor((att - 1) / 3);
  // origen local de caja (esquina sup-izq) relativo a p
  const ox = col === 0 ? 0 : col === 1 ? -W / 2 : -W;
  const oy = row === 0 ? 0 : row === 1 ? H / 2 : H;
  return { lines, widths, W, H, ls, h, ox, oy, col, font };
}

// ---------- primitivas (coordenadas del espacio de la entidad)
const L = (a, b) => ({ k: 'L', a, b });
const A = (c, r, a1, a2) => ({ k: 'A', c, r, a1, a2 });
const C = (c, r) => ({ k: 'A', c, r, a1: 0, a2: G.TAU, full: true });

export function polySegs(e) {
  const pts = e.pts, n = pts.length, out = [];
  const cnt = e.closed ? n : n - 1;
  for (let i = 0; i < cnt; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    if (a.b && Math.abs(a.b) > 1e-9) {
      const arc = G.bulgeArc(a, b, a.b);
      if (arc) { const p = A(arc.c, arc.r, arc.a1, arc.a2); p.cw = arc.cw; p.i = i; out.push(p); continue; }
    }
    const l = L(a, b); l.i = i; out.push(l);
  }
  return out;
}
export function polyPoints(e) { // teselado
  const out = [];
  for (const s of polySegs(e)) {
    if (s.k === 'L') { if (!out.length) out.push(s.a); out.push(s.b); }
    else { let t = G.tessArc(s.c, s.r, s.a1, s.a2); if (s.cw) t = t.reverse(); if (out.length) t.shift(); out.push(...t); }
  }
  if (!out.length && e.pts.length) out.push(e.pts[0]);
  return out;
}
export function ellipsePoints(e, n = 96) {
  const a = G.len(e.major), b = a * e.ratio, rot = Math.atan2(e.major.y, e.major.x);
  let t1 = e.a1 ?? 0, t2 = e.a2 ?? G.TAU;
  let sw = t2 - t1; if (sw <= 0) sw += G.TAU;
  const full = Math.abs(sw - G.TAU) < 1e-6;
  const k = Math.max(16, Math.ceil(n * sw / G.TAU)), out = [];
  for (let i = 0; i <= k; i++) {
    const t = t1 + sw * i / k;
    out.push(G.add(e.c, G.rotate({ x: a * Math.cos(t), y: b * Math.sin(t) }, { x: 0, y: 0 }, rot)));
  }
  out.full = full; return out;
}
export function splineTess(e) {
  if (e._tess) return e._tess;
  let pts;
  if (e.cps && e.cps.length >= 2) pts = G.splinePoints(e.deg || 3, e.cps, e.knots, e.w);
  else pts = G.fitPoints(e.fit || [], e.closed);
  e._tess = pts; return pts;
}
const segsOf = (pts, closed) => { const o = []; for (let i = 0; i < pts.length - 1; i++) o.push(L(pts[i], pts[i + 1])); if (closed && pts.length > 2) o.push(L(pts[pts.length - 1], pts[0])); return o; };

export function textBox(e) {
  if (e.type === 'MTEXT') {
    const lay = mtextLayout(e), rot = e.rot || 0;
    const loc = [{ x: lay.ox, y: lay.oy }, { x: lay.ox + lay.W, y: lay.oy }, { x: lay.ox + lay.W, y: lay.oy - lay.H }, { x: lay.ox, y: lay.oy - lay.H }];
    return loc.map((q) => G.add(e.p, G.rotate(q, { x: 0, y: 0 }, rot)));
  }
  const f = textFrame(e);
  const loc = [{ x: 0, y: -0.2 * f.h }, { x: f.w, y: -0.2 * f.h }, { x: f.w, y: f.h }, { x: 0, y: f.h }];
  return loc.map((q) => G.add(f.o, G.rotate(q, { x: 0, y: 0 }, f.rot)));
}

// primitivas locales (sin inserts)
export function localPrims(e, doc) {
  switch (e.type) {
    case 'LINE': return [L(e.p1, e.p2)];
    case 'XLINE': { const d = G.norm(e.dir); return [L(G.sub(e.p, G.mul(d, 1e7)), G.add(e.p, G.mul(d, 1e7)))]; }
    case 'RAY': { const d = G.norm(e.dir); return [L(e.p, G.add(e.p, G.mul(d, 1e7)))]; }
    case 'CIRCLE': return [C(e.c, e.r)];
    case 'ARC': return [A(e.c, e.r, e.a1, e.a2)];
    case 'LWPOLYLINE': return polySegs(e);
    case 'POINT': return [L(e.p, e.p)];
    case 'ELLIPSE': { const p = ellipsePoints(e); return segsOf(p, false); }
    case 'SPLINE': return segsOf(splineTess(e), false);
    case 'SOLID': case 'WIPEOUT': return segsOf(e.pts, true);
    case 'LEADER': return segsOf(e.pts, false);
    case 'HATCH': { const o = []; for (const lp of e.loops) o.push(...polySegs({ pts: lp, closed: true })); return o; }
    case 'DUCT': { const o = []; for (const s of ductEnts(e)) if (s.type !== 'TEXT') o.push(...localPrims(s, doc)); return o; }
    case 'TABLE': { const o = []; for (const s of tableEnts(e)) if (s.type === 'LINE') o.push(...localPrims(s, doc)); return o; }
    case 'DIMENSION': { const o = []; for (const s of dimEnts(e, doc)) if (s.type !== 'TEXT' && s.type !== 'MTEXT') o.push(...localPrims(s, doc)); return o; }
    case 'VIEWPORT': { const x1 = e.c.x - e.w / 2, x2 = e.c.x + e.w / 2, y1 = e.c.y - e.h / 2, y2 = e.c.y + e.h / 2; return segsOf([{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }], true); }
    default: return [];
  }
}
export function transformPrim(p, m) {
  if (p.k === 'L') return L(M.apply(m, p.a), M.apply(m, p.b));
  const c = M.apply(m, p.c), s = M.scaleOf(m);
  if (p.full) return C(c, p.r * s);
  let a1 = Math.atan2(M.vec(m, { x: Math.cos(p.a1), y: Math.sin(p.a1) }).y, M.vec(m, { x: Math.cos(p.a1), y: Math.sin(p.a1) }).x);
  let a2 = Math.atan2(M.vec(m, { x: Math.cos(p.a2), y: Math.sin(p.a2) }).y, M.vec(m, { x: Math.cos(p.a2), y: Math.sin(p.a2) }).x);
  if (M.det(m) < 0) [a1, a2] = [a2, a1];
  return A(c, p.r * s, a1, a2);
}
// primitivas en mundo (incluye bloques)
export function prims(e, doc, depth = 0) {
  if (e.type === 'INSERT') {
    if (depth > 8) return [];
    const out = [];
    for (const { ent, m } of insertChildren(e, doc)) for (const p of prims(ent, doc, depth + 1)) out.push(transformPrim(p, m));
    return out;
  }
  if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTDEF' || e.type === 'ATTRIB') return segsOf(textBox(e), true);
  return localPrims(e, doc);
}

// ---------- bloques
export function blockOf(e, doc) { return doc && doc.blocks[e.name]; }
export function insertMatrix(e, blk) {
  return M.insert(e.p, e.sx ?? 1, e.sy ?? 1, e.rot || 0, blk ? blk.base : { x: 0, y: 0 });
}
// hijos efectivos (aplicando bloque dinámico)
export function blockEntsFor(e, doc) {
  const blk = blockOf(e, doc);
  if (!blk) return [];
  if (!blk.params || !blk.params.length || !e.dyn) return blk.ents.filter((x) => x.type !== 'ATTDEF' || x.constant);
  const key = JSON.stringify(e.dyn) + '|' + (blk._ver || 0);
  if (e._dynKey === key && e._dynEnts) return e._dynEnts;
  const ents = applyDynamic(blk, e.dyn);
  e._dynKey = key; e._dynEnts = ents; return ents;
}
export function insertChildren(e, doc) {
  const blk = blockOf(e, doc);
  if (!blk) return [];
  const base = insertMatrix(e, blk);
  const out = [];
  const ents = blockEntsFor(e, doc);
  const cols = e.cols || 1, rows = e.rows || 1;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    let m = base;
    if (i || j) { const off = G.rotate({ x: i * (e.cs || 0), y: j * (e.rs || 0) }, { x: 0, y: 0 }, e.rot || 0); m = M.mul(M.tr(off.x, off.y), base); }
    for (const ent of ents) out.push({ ent, m });
  }
  for (const a of e.attribs || []) if (!a.invisible) out.push({ ent: a, m: M.id() });
  return out;
}

// ---------- bloques dinámicos
export function dynDefaults(blk) {
  const d = {};
  for (const p of blk.params || []) {
    if (p.type === 'linear') d[p.name] = G.dist(p.p1, p.p2);
    else if (p.type === 'rotation') d[p.name] = p.a0 || 0;
    else if (p.type === 'flip') d[p.name] = 0;
    else if (p.type === 'visibility') d[p.name] = p.states?.[0]?.name || '';
    else if (p.type === 'xy') d[p.name] = { x: p.p2.x - p.p1.x, y: p.p2.y - p.p1.y };
    else if (p.type === 'polar') d[p.name] = { d: G.dist(p.p1, p.p2), a: G.ang(p.p1, p.p2) };
    else if (p.type === 'lookup') d[p.name] = p.rows?.[0]?.label || '';
  }
  return d;
}
function moveEntPoints(ent, frame, delta) {
  const inF = (p) => G.ptInBB(p, frame);
  const mv = (p) => (inF(p) ? G.add(p, delta) : p);
  switch (ent.type) {
    case 'LINE': ent.p1 = mv(ent.p1); ent.p2 = mv(ent.p2); break;
    case 'LWPOLYLINE': ent.pts = ent.pts.map((p) => { const q = mv(p); return { x: q.x, y: q.y, b: p.b }; }); break;
    case 'SOLID': case 'LEADER': ent.pts = ent.pts.map(mv); break;
    case 'HATCH': ent.loops = ent.loops.map((l) => l.map((p) => { const q = mv(p); return { x: q.x, y: q.y, b: p.b }; })); break;
    case 'DIMENSION': for (const k of ['p1', 'p2', 'dp', 'c', 'tp']) if (ent[k]) ent[k] = mv(ent[k]); break;
    default: {
      const bb = entBBox(ent, null);
      if (bb && G.bbInside(bb, frame)) transformEnt(ent, M.tr(delta.x, delta.y));
    }
  }
  invalidate(ent);
}
export function applyDynamic(blk, dyn) {
  let ents = blk.ents.filter((x) => x.type !== 'ATTDEF' || x.constant).map((x) => cloneEnt(x));
  const byId = (ids) => ents.filter((x) => ids.includes(x.bid));
  // tablas de consulta: la fila elegida fija los valores de otros parámetros
  dyn = { ...dyn };
  for (const p of blk.params || []) if (p.type === 'lookup') { const row = (p.rows || []).find((r) => r.label === dyn[p.name]); if (row) Object.assign(dyn, row.values || {}); }
  const actStretch = (p, delta, k) => {
    for (const ac of p.actions || []) {
      if (ac.type === 'stretch') for (const ent of byId(ac.ids)) moveEntPoints(ent, ac.frame, delta);
      else if (ac.type === 'move') for (const ent of byId(ac.ids)) { transformEnt(ent, M.tr(delta.x, delta.y)); invalidate(ent); }
      else if (ac.type === 'scale' && k != null) for (const ent of byId(ac.ids)) { transformEnt(ent, M.scale(k, p.p1)); invalidate(ent); }
    }
  };
  for (const p of blk.params || []) {
    const v = dyn[p.name];
    if (v == null) continue;
    if (p.type === 'visibility') {
      const st = (p.states || []).find((s) => s.name === v);
      if (st) ents = ents.filter((x) => !(st.hidden || []).includes(x.bid));
    } else if (p.type === 'linear') {
      const dir = G.norm(G.sub(p.p2, p.p1)), base = G.dist(p.p1, p.p2);
      const delta = G.mul(dir, v - base);
      for (const ac of p.actions || []) {
        if (ac.type === 'stretch') for (const ent of byId(ac.ids)) moveEntPoints(ent, ac.frame, delta);
        else if (ac.type === 'move') for (const ent of byId(ac.ids)) { transformEnt(ent, M.tr(delta.x, delta.y)); invalidate(ent); }
        else if (ac.type === 'scale') { const k = base > 0 ? v / base : 1; for (const ent of byId(ac.ids)) { transformEnt(ent, M.scale(k, p.p1)); invalidate(ent); } }
      }
    } else if (p.type === 'rotation') {
      const da = v - (p.a0 || 0);
      for (const ac of p.actions || []) for (const ent of byId(ac.ids)) { transformEnt(ent, M.rot(da, p.c)); invalidate(ent); }
    } else if (p.type === 'flip') {
      if (v) for (const ac of p.actions || []) for (const ent of byId(ac.ids)) { transformEnt(ent, M.mirror(p.p1, p.p2)); invalidate(ent); }
    } else if (p.type === 'xy' && v && typeof v === 'object') {
      actStretch(p, { x: v.x - (p.p2.x - p.p1.x), y: v.y - (p.p2.y - p.p1.y) });
    } else if (p.type === 'polar' && v && typeof v === 'object') {
      const np = G.polar(p.p1, v.a, v.d); actStretch(p, G.sub(np, p.p2));
    }
  }
  return ents;
}
// grips dinámicos en coordenadas mundo
export function dynGrips(e, doc) {
  const blk = blockOf(e, doc);
  if (!blk || !blk.params || !blk.params.length) return [];
  const m = insertMatrix(e, blk), dyn = { ...dynDefaults(blk), ...(e.dyn || {}) }, out = [];
  for (const p of blk.params) {
    const v = dyn[p.name];
    if (p.type === 'linear') {
      const dir = G.norm(G.sub(p.p2, p.p1));
      out.push({ kind: 'dlin', param: p, p: M.apply(m, G.add(p.p1, G.mul(dir, v))) });
    } else if (p.type === 'rotation') out.push({ kind: 'drot', param: p, p: M.apply(m, G.polar(p.c, v, p.r || 1)) });
    else if (p.type === 'flip') out.push({ kind: 'dflip', param: p, p: M.apply(m, G.mid(p.p1, p.p2)) });
    else if (p.type === 'visibility') out.push({ kind: 'dvis', param: p, p: M.apply(m, p.p || blk.base) });
    else if (p.type === 'xy' && v) out.push({ kind: 'dxy', param: p, p: M.apply(m, G.add(p.p1, { x: v.x, y: v.y })) });
    else if (p.type === 'polar' && v) out.push({ kind: 'dpol', param: p, p: M.apply(m, G.polar(p.p1, v.a, v.d)) });
    else if (p.type === 'lookup') out.push({ kind: 'dlook', param: p, p: M.apply(m, p.p || blk.base) });
  }
  return out;
}
export function dynSetFromPoint(e, doc, grip, wp) {
  const blk = blockOf(e, doc), m = insertMatrix(e, blk), lp = M.apply(M.inv(m), wp), p = grip.param;
  e.dyn = { ...dynDefaults(blk), ...(e.dyn || {}) };
  if (p.type === 'linear') {
    const dir = G.norm(G.sub(p.p2, p.p1));
    let v = Math.max(0, G.dot(G.sub(lp, p.p1), dir));
    if (p.inc > 0) v = Math.round(v / p.inc) * p.inc;
    if (p.min != null) v = Math.max(p.min, v);
    if (p.max != null) v = Math.min(p.max, v);
    if (p.vals?.length) v = p.vals.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
    e.dyn[p.name] = v;
  } else if (p.type === 'rotation') e.dyn[p.name] = G.ang(p.c, lp);
  else if (p.type === 'xy') { let x = lp.x - p.p1.x, y = lp.y - p.p1.y; if (p.inc > 0) { x = Math.round(x / p.inc) * p.inc; y = Math.round(y / p.inc) * p.inc; } e.dyn[p.name] = { x, y }; }
  else if (p.type === 'polar') { let d = G.dist(p.p1, lp); if (p.inc > 0) d = Math.round(d / p.inc) * p.inc; e.dyn[p.name] = { d, a: G.ang(p.p1, lp) }; }
  invalidate(e);
}

// ---------- cotas: geometría generada
export const DIMDEF = { dimtxt: 2.5, dimasz: 2.5, dimexo: 0.625, dimexe: 1.25, dimgap: 0.625, dimdec: 2, dimscale: 1, dimlfac: 1, dimtad: 1, dimpost: '', dimclrd: 256, dimclrt: 256 };
export function dimMeasure(e) {
  const lf = e.lfac || 1;
  switch (e.dt) {
    case 'linear': { const d = { x: Math.cos(e.rot || 0), y: Math.sin(e.rot || 0) }; return Math.abs(G.dot(G.sub(e.p2, e.p1), d)) * lf; }
    case 'aligned': return G.dist(e.p1, e.p2) * lf;
    case 'radius': return G.dist(e.c, e.p1) * lf;
    case 'diameter': return G.dist(e.p1, e.p2) * lf;
    case 'angular': { let a = G.normA(G.ang(e.c, e.p2) - G.ang(e.c, e.p1)); if (e.dp && !G.angIn(G.ang(e.c, e.dp), G.ang(e.c, e.p1), G.ang(e.c, e.p2))) a = G.TAU - a; return G.deg(a); }
    case 'ordinate': return Math.abs(e.xord ? e.p1.x - (e.org?.x || 0) : e.p1.y - (e.org?.y || 0));
  }
  return 0;
}
function readable(a) { a = G.normA(a); return a > Math.PI / 2 + 1e-6 && a <= 3 * Math.PI / 2 + 1e-6 ? a - Math.PI : a; }
export function dimText(e, st) {
  const v = dimMeasure(e);
  let s;
  if (e.dt === 'angular') s = G.fmt(v, Math.max(0, (st.dimadec ?? 0))) + '%%d';
  else s = v.toFixed(st.dimdec ?? 2).replace(/^-0(\.0+)?$/, '0$1');
  if (st.dimzin_trailing) s = s.replace(/\.?0+$/, '');
  if (e.dt === 'radius') s = 'R' + s;
  if (e.dt === 'diameter') s = '%%c' + s;
  s = s + (st.dimpost || '');
  if (e.text != null && e.text !== '' && e.text !== '<>') s = e.text.replace('<>', s);
  return s;
}
export function dimEnts(e, doc) {
  if (e._dim) return e._dim;
  if (e.block && doc && doc.blocks[e.block] && !e.p1) {
    const blk = doc.blocks[e.block];
    return (e._dim = blk.ents.map((x) => { const c = cloneEnt(x); if (c.color === 0) c.color = e.color ?? 256; if (e.xf) transformEnt(c, e.xf); return c; }));
  }
  const st = { ...DIMDEF, ...(doc?.dimstyle || {}), ...(e.st || {}) };
  const k = st.dimscale || 1, asz = st.dimasz * k, txt = st.dimtxt * k, gap = st.dimgap * k, exo = st.dimexo * k, exe = st.dimexe * k;
  const out = [], col = st.dimclrd ?? 256;
  const line = (a, b) => out.push({ type: 'LINE', p1: a, p2: b, color: col, layer: e.layer });
  const arrow = (tip, dir) => { // dir: hacia donde apunta la flecha
    const u = G.norm(dir), n = G.perp(u), b = G.sub(tip, G.mul(u, asz));
    out.push({ type: 'SOLID', pts: [tip, G.add(b, G.mul(n, asz / 6)), G.sub(b, G.mul(n, asz / 6)), G.sub(b, G.mul(n, asz / 6))], color: col, layer: e.layer });
  };
  const text = (p, rot, s) => out.push({ type: 'TEXT', p, p2: p, h: txt, rot, text: s, ha: 4, va: 0, color: st.dimclrt ?? 256, layer: e.layer });
  const str = dimText(e, st);
  const tw = textWidth(decodeSpecial(str), txt, 1, styleFont(e.style || 'Standard'));
  if (e.dt === 'linear' || e.dt === 'aligned') {
    const rot = e.dt === 'aligned' ? G.ang(e.p1, e.p2) : (e.rot || 0);
    const d = { x: Math.cos(rot), y: Math.sin(rot) }, n = G.perp(d);
    const dp = e.dp || G.add(e.p1, G.mul(n, 10));
    const foot = (p) => G.add(dp, G.mul(d, G.dot(G.sub(p, dp), d)));
    const e1 = foot(e.p1), e2 = foot(e.p2);
    for (const [p, q] of [[e.p1, e1], [e.p2, e2]]) {
      const v = G.sub(q, p), l = G.len(v);
      const u = l > 1e-9 ? G.mul(v, 1 / l) : n;
      if (l > exo) line(G.add(p, G.mul(u, exo)), G.add(q, G.mul(u, exe)));
    }
    const L_ = G.dist(e1, e2), u = G.norm(G.sub(e2, e1));
    const inside = L_ > asz * 2 + 0.5 * k;
    line(e1, e2);
    if (inside) { arrow(e1, G.mul(u, -1)); arrow(e2, u); }
    else { arrow(e1, u); arrow(e2, G.mul(u, -1)); line(e1, G.sub(e1, G.mul(u, asz * 2))); line(e2, G.add(e2, G.mul(u, asz * 2))); }
    const tr = readable(rot), up = G.perp({ x: Math.cos(tr), y: Math.sin(tr) });
    let tp = e.tp || G.add(G.mid(e1, e2), G.mul(up, st.dimtad ? gap + txt / 2 : 0));
    if (!st.dimtad && !e.tp) { // romper línea alrededor del texto
      out.splice(out.findIndex((o) => o.type === 'LINE' && o.p1 === e1), 1);
      const m_ = G.mid(e1, e2), hw = tw / 2 + gap;
      if (L_ / 2 > hw) { line(e1, G.sub(m_, G.mul(u, hw))); line(G.add(m_, G.mul(u, hw)), e2); }
    }
    text(tp, tr, str);
  } else if (e.dt === 'radius' || e.dt === 'diameter') {
    const c = e.dt === 'radius' ? e.c : G.mid(e.p1, e.p2);
    const p = e.p1, r = G.dist(c, p), u = G.norm(G.sub(p, c));
    const dp = e.dp || p;
    const out_ = G.dist(c, dp) > r + 1e-9;
    if (e.dt === 'diameter') {
      line(e.p1, e.p2); arrow(e.p1, u); arrow(e.p2, G.mul(u, -1));
    } else { line(c, p); arrow(p, u); }
    let tp;
    if (out_) {
      const land = G.add(dp, { x: (dp.x >= c.x ? 1 : -1) * asz, y: 0 });
      line(p, dp); line(dp, land);
      tp = G.add(G.mid(dp, land), { x: (dp.x >= c.x ? 1 : -1) * (tw / 2 + gap), y: 0 });
      text({ x: tp.x - (dp.x >= c.x ? 0 : 0), y: tp.y }, 0, str);
    } else {
      const tr = readable(G.ang(c, p)), up = G.perp({ x: Math.cos(tr), y: Math.sin(tr) });
      tp = e.tp || G.add(G.mid(c, p), G.mul(up, gap + txt / 2));
      text(tp, tr, str);
    }
  } else if (e.dt === 'angular') {
    const c = e.c, a1 = G.ang(c, e.p1), a2 = G.ang(c, e.p2);
    const dp = e.dp || G.polar(c, (a1 + a2) / 2, G.dist(c, e.p1));
    const r = G.dist(c, dp);
    let s1 = a1, s2 = a2;
    if (!G.angIn(G.ang(c, dp), a1, a2)) { s1 = a2; s2 = a1; }
    out.push({ type: 'ARC', c, r, a1: s1, a2: s2, color: col, layer: e.layer });
    for (const [p, a] of [[e.p1, a1], [e.p2, a2]]) { const d0 = G.dist(c, p); if (d0 < r) line(G.polar(c, a, d0 + exo), G.polar(c, a, r + exe)); }
    const t1 = G.perp({ x: Math.cos(s1), y: Math.sin(s1) });
    arrow(G.polar(c, s1, r), G.mul(t1, -1));
    arrow(G.polar(c, s2, r), G.perp({ x: Math.cos(s2), y: Math.sin(s2) }));
    const am = s1 + G.arcSweep(s1, s2) / 2;
    const tp = e.tp || G.polar(c, am, r + gap + txt / 2);
    text(tp, readable(am - Math.PI / 2), str);
  } else if (e.dt === 'ordinate') {
    const dp = e.dp || e.p1;
    line(e.p1, dp);
    text(G.add(dp, e.xord ? { x: 0, y: (dp.y > e.p1.y ? 1 : -1) * (tw / 2 + gap) } : { x: (dp.x > e.p1.x ? 1 : -1) * (tw / 2 + gap), y: 0 }), e.xord ? Math.PI / 2 : 0, str);
  }
  for (const o of out) { o.ltype = 'CONTINUOUS'; }
  return (e._dim = out);
}

// ---------- bbox
export function entBBox(e, doc) {
  if (e._bb) return e._bb;
  let bb = G.bbNew();
  switch (e.type) {
    case 'CIRCLE': bb = G.bbArc(e.c, e.r, 0, 0, true); break;
    case 'ARC': bb = G.bbArc(e.c, e.r, e.a1, e.a2); break;
    case 'TEXT': case 'MTEXT': case 'ATTDEF': case 'ATTRIB': for (const p of textBox(e)) G.bbAdd(bb, p); break;
    case 'INSERT': {
      for (const { ent, m } of insertChildren(e, doc)) { const b = entBBox(ent, doc); if (G.bbValid(b)) G.bbUnion(bb, m === undefined ? b : G.bbTransform(b, m)); }
      if (!G.bbValid(bb)) G.bbAdd(bb, e.p);
      break;
    }
    case 'XLINE': case 'RAY': G.bbAdd(bb, e.p); break;
    case 'DUCT': for (const x of ductEnts(e)) { const b = entBBox(x, doc); if (G.bbValid(b)) G.bbUnion(bb, b); } break;
    case 'TABLE': for (const x of tableEnts(e)) { const b = entBBox(x, doc); if (G.bbValid(b)) G.bbUnion(bb, b); } break;
    case 'DIMENSION': for (const x of dimEnts(e, doc)) { const b = entBBox(x, doc); if (G.bbValid(b)) G.bbUnion(bb, b); } break;
    default:
      for (const p of localPrims(e, doc)) {
        if (p.k === 'L') { G.bbAdd(bb, p.a); G.bbAdd(bb, p.b); } else G.bbUnion(bb, G.bbArc(p.c, p.r, p.a1, p.a2, p.full));
      }
  }
  e._bb = bb; return bb;
}

// ---------- distancia para selección
export function entDist(e, p, doc) {
  if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTDEF' || e.type === 'ATTRIB') {
    const box = textBox(e);
    if (G.ptInPoly(p, box)) return 0;
    let d = Infinity; for (let i = 0; i < 4; i++) d = Math.min(d, G.segDist(p, box[i], box[(i + 1) % 4])); return d;
  }
  if (e.type === 'INSERT') {
    let d = Infinity;
    for (const { ent, m } of insertChildren(e, doc)) {
      const inv = M.inv(m), lp = M.apply(inv, p), s = M.scaleOf(m) || 1;
      d = Math.min(d, entDist(ent, lp, doc) * s);
    }
    return d;
  }
  if (e.type === 'HATCH' || e.type === 'SOLID' || e.type === 'WIPEOUT') {
    if (e.type === 'HATCH') { let ins = false; for (const lp of e.loops) if (G.ptInPoly(p, polyPoints({ pts: lp, closed: true }))) ins = !ins; if (ins) return 0; }
    else if (G.ptInPoly(p, e.pts)) return 0;
  }
  let d = Infinity;
  for (const pr of localPrims(e, doc)) d = Math.min(d, G.primDist(pr, p));
  return d;
}

// ---------- osnaps
export function entSnaps(e, doc, m = null) {
  const out = [];
  const T = (p) => (m ? M.apply(m, p) : p);
  const push = (p, t) => out.push({ p: T(p), t });
  switch (e.type) {
    case 'LINE': push(e.p1, 'end'); push(e.p2, 'end'); push(G.mid(e.p1, e.p2), 'mid'); break;
    case 'XLINE': case 'RAY': push(e.p, 'end'); break;
    case 'CIRCLE': push(e.c, 'cen'); for (let k = 0; k < 4; k++) push(G.polar(e.c, k * Math.PI / 2, e.r), 'qua'); break;
    case 'ARC': push(e.c, 'cen'); push(G.polar(e.c, e.a1, e.r), 'end'); push(G.polar(e.c, e.a2, e.r), 'end');
      push(G.polar(e.c, e.a1 + G.arcSweep(e.a1, e.a2) / 2, e.r), 'mid');
      for (let k = 0; k < 4; k++) if (G.angIn(k * Math.PI / 2, e.a1, e.a2)) push(G.polar(e.c, k * Math.PI / 2, e.r), 'qua'); break;
    case 'LWPOLYLINE': e.pts.forEach((p) => push(p, 'end'));
      for (const s of polySegs(e)) { if (s.k === 'L') push(G.mid(s.a, s.b), 'mid'); else { push(G.polar(s.c, s.a1 + G.arcSweep(s.a1, s.a2) / 2, s.r), 'mid'); push(s.c, 'cen'); } } break;
    case 'POINT': push(e.p, 'nod'); break;
    case 'TEXT': case 'ATTDEF': case 'ATTRIB': push(e.p, 'ins'); if (e.p2 && (e.ha || e.va)) push(e.p2, 'ins'); break;
    case 'MTEXT': push(e.p, 'ins'); break;
    case 'ELLIPSE': { push(e.c, 'cen'); const pts = ellipsePoints(e, 4); if (pts.full) pts.slice(0, 4).forEach((p) => push(p, 'qua')); else { push(pts[0], 'end'); push(pts[pts.length - 1], 'end'); } break; }
    case 'SPLINE': { const t = splineTess(e); push(t[0], 'end'); push(t[t.length - 1], 'end'); (e.fit || []).forEach((p) => push(p, 'nod')); break; }
    case 'SOLID': case 'LEADER': e.pts.forEach((p) => push(p, 'end')); break;
    case 'HATCH': break;
    case 'DUCT': e.pts.forEach((v, i) => { push(v, 'end'); if (i) push(G.mid(e.pts[i - 1], v), 'mid'); }); for (const x of ductEnts(e)) if (x.type === 'LINE' && !x.ltype) { push(x.p1, 'end'); push(x.p2, 'end'); } break;
    case 'TABLE': for (const x of tableEnts(e)) if (x.type === 'LINE') { push(x.p1, 'end'); push(x.p2, 'end'); } break;
    case 'DIMENSION': if (e.p1) push(e.p1, 'nod'); if (e.p2) push(e.p2, 'nod'); if (e.dp) push(e.dp, 'nod'); break;
    case 'INSERT': {
      push(e.p, 'ins');
      const blk = blockOf(e, doc);
      if (blk && (!m || true)) for (const { ent, m: cm } of insertChildren(e, doc)) {
        if (ent.type === 'ATTRIB') { out.push({ p: T(ent.p), t: 'ins' }); continue; }
        for (const s of entSnaps(ent, doc, m ? M.mul(m, cm) : cm)) out.push(s);
      }
      break;
    }
  }
  return out;
}

// ---------- transformación (muta)
const tp = (m, p) => M.apply(m, p);
export function transformEnt(e, m, opts = {}) {
  const s = M.scaleOf(m), rotA = M.angOf(m), mir = M.det(m) < 0;
  switch (e.type) {
    case 'LINE': e.p1 = tp(m, e.p1); e.p2 = tp(m, e.p2); break;
    case 'XLINE': case 'RAY': e.p = tp(m, e.p); e.dir = G.norm(M.vec(m, e.dir)); break;
    case 'CIRCLE': e.c = tp(m, e.c); e.r *= s; break;
    case 'ARC': {
      const p1 = tp(m, G.polar(e.c, e.a1, e.r)), p2 = tp(m, G.polar(e.c, e.a2, e.r));
      e.c = tp(m, e.c); e.r *= s;
      if (mir) { e.a1 = G.ang(e.c, p2); e.a2 = G.ang(e.c, p1); } else { e.a1 = G.ang(e.c, p1); e.a2 = G.ang(e.c, p2); }
      break;
    }
    case 'LWPOLYLINE': e.pts = e.pts.map((p) => { const q = tp(m, p); return { x: q.x, y: q.y, b: mir ? -(p.b || 0) : p.b || 0 }; });
      if (e.cw_) e.cw_ *= s; break;
    case 'POINT': e.p = tp(m, e.p); break;
    case 'TEXT': case 'ATTDEF': case 'ATTRIB': case 'MTEXT': {
      e.p = tp(m, e.p); if (e.p2) e.p2 = tp(m, e.p2);
      e.h = (e.h || 2.5) * s; if (e.w) e.w *= s;
      let r = (e.rot || 0) + rotA;
      if (mir) {
        const xd = M.vec(m, { x: Math.cos(e.rot || 0), y: Math.sin(e.rot || 0) });
        r = Math.atan2(xd.y, xd.x);
        if (!opts.mirrtext) { r = readable(r); }
      }
      e.rot = G.normA(r); break;
    }
    case 'INSERT': {
      e.p = tp(m, e.p);
      e.rot = G.normA((e.rot || 0) + rotA);
      e.sx = (e.sx ?? 1) * s; e.sy = (e.sy ?? 1) * s;
      if (mir) { const xd = M.vec(m, { x: Math.cos(e.rot - rotA), y: Math.sin(e.rot - rotA) }); e.rot = G.normA(Math.atan2(xd.y, xd.x)); e.sy = -e.sy; }
      for (const a of e.attribs || []) transformEnt(a, m, opts);
      break;
    }
    case 'ELLIPSE': {
      const p1 = ellipsePoints(e, 4);
      e.c = tp(m, e.c); e.major = M.vec(m, e.major);
      if (mir && !(p1.full)) { const a1 = e.a1, a2 = e.a2; e.a1 = G.TAU - a2; e.a2 = G.TAU - a1; }
      break;
    }
    case 'SPLINE': if (e.cps) e.cps = e.cps.map((p) => tp(m, p)); if (e.fit) e.fit = e.fit.map((p) => tp(m, p)); break;
    case 'SOLID': case 'LEADER': case 'WIPEOUT': e.pts = e.pts.map((p) => tp(m, p)); break;
    case 'HATCH': e.loops = e.loops.map((l) => l.map((p) => { const q = tp(m, p); return { x: q.x, y: q.y, b: mir ? -(p.b || 0) : p.b || 0 }; }));
      e.scale = (e.scale || 1) * s; e.angle = (e.angle || 0) + (mir ? 0 : rotA); if (e.origin) e.origin = tp(m, e.origin);
      if (e.pdef) e.pdef = e.pdef.map((d) => { const dir = M.vec(m, { x: Math.cos(d.a * Math.PI / 180), y: Math.sin(d.a * Math.PI / 180) }); const o = tp(m, { x: d.o[0], y: d.o[1] }), v = M.vec(m, { x: d.d[0], y: d.d[1] }); return { ...d, a: Math.atan2(dir.y, dir.x) * 180 / Math.PI, o: [o.x, o.y], d: [v.x, v.y], dash: (d.dash || []).map((x) => x * s) }; });
      break;
    case 'DUCT': e.pts = e.pts.map((p) => { const q = tp(m, p); return { x: q.x, y: q.y }; }); break;
    case 'TABLE': e.p = tp(m, e.p); e.rot = (e.rot || 0) + rotA; if (Math.abs(s - 1) > 1e-12) { e.cols = e.cols.map((v) => v * s); e.rows = e.rows.map((v) => v * s); e.th *= s; } break;
    case 'DIMENSION':
      for (const k of ['p1', 'p2', 'dp', 'c', 'tp', 'org']) if (e[k]) e[k] = tp(m, e[k]);
      if (e.dt === 'linear') e.rot = (e.rot || 0) + rotA;
      if (e.block && !e.p1) { e.xf = e.xf ? M.mul(m, e.xf) : m; }
      break;
    case 'VIEWPORT': e.c = tp(m, e.c); e.w *= s; e.h *= s; break;
  }
  invalidate(e);
  return e;
}

// ---------- grips
// punto medio de un tramo de arco de polilínea y curvatura que hace pasar el tramo i por p
export function bulgeMidPoint(s) { if (s.k !== 'A') return null; return G.polar(s.c, s.a1 + G.arcSweep(s.a1, s.a2) / 2, s.r); }
export function bulgeThrough(a, b, p) {
  const ab = G.sub(b, a), cr = G.cross(ab, G.sub(p, a));
  if (Math.abs(cr) < 1e-12 * Math.max(1, G.len(ab) ** 2)) return 0;
  const alpha = Math.acos(Math.max(-1, Math.min(1, G.dot(G.norm(G.sub(a, p)), G.norm(G.sub(b, p))))));
  return (cr < 0 ? 1 : -1) * Math.tan(Math.PI / 2 - alpha / 2);
}
export function setSegThrough(x, i, p) { const j = (i + 1) % x.pts.length; x.pts[i] = { ...x.pts[i], b: bulgeThrough(x.pts[i], x.pts[j], p) }; }
export function entGrips(e, doc) {
  const g = [];
  const add = (p, set, kind = 'pt') => g.push({ p, set, kind });
  switch (e.type) {
    case 'LINE': add(e.p1, (x, p) => (x.p1 = p)); g[g.length - 1].le = 1; add(G.mid(e.p1, e.p2), (x, p) => { const d = G.sub(p, G.mid(x.p1, x.p2)); x.p1 = G.add(x.p1, d); x.p2 = G.add(x.p2, d); }); add(e.p2, (x, p) => (x.p2 = p)); g[g.length - 1].le = 2; break;
    case 'XLINE': case 'RAY': add(e.p, (x, p) => (x.p = p)); add(G.add(e.p, G.mul(G.norm(e.dir), 10)), (x, p) => (x.dir = G.norm(G.sub(p, x.p)))); break;
    case 'CIRCLE': add(e.c, (x, p) => (x.c = p)); for (let k = 0; k < 4; k++) add(G.polar(e.c, k * Math.PI / 2, e.r), (x, p) => (x.r = G.dist(x.c, p))); break;
    case 'ARC': {
      add(e.c, (x, p) => (x.c = p));
      add(G.polar(e.c, e.a1, e.r), (x, p) => { x.a1 = G.ang(x.c, p); });
      add(G.polar(e.c, e.a1 + G.arcSweep(e.a1, e.a2) / 2, e.r), (x, p) => (x.r = G.dist(x.c, p)));
      add(G.polar(e.c, e.a2, e.r), (x, p) => { x.a2 = G.ang(x.c, p); }); break;
    }
    case 'LWPOLYLINE': e.pts.forEach((v, i) => { add(v, (x, p) => { x.pts[i] = { x: p.x, y: p.y, b: x.pts[i].b || 0 }; }); g[g.length - 1].vi = i; });
      polySegs(e).forEach((s) => { if (s.k !== 'L') { const ap = bulgeMidPoint(s); if (ap) { add(ap, (x, p) => setSegThrough(x, s.i, p), 'mid'); g[g.length - 1].si = s.i; g[g.length - 1].arcSeg = true; } return; } add(G.mid(s.a, s.b), (x, p) => { const i = s.i, j = (i + 1) % x.pts.length, d = G.sub(p, G.mid(x.pts[i], x.pts[j])); x.pts[i] = { ...x.pts[i], x: x.pts[i].x + d.x, y: x.pts[i].y + d.y }; x.pts[j] = { ...x.pts[j], x: x.pts[j].x + d.x, y: x.pts[j].y + d.y }; }, 'mid'); g[g.length - 1].si = s.i; });
      break;
    case 'POINT': add(e.p, (x, p) => (x.p = p)); break;
    case 'TEXT': case 'ATTDEF': case 'ATTRIB': if (e.ha || e.va) add(e.p2 || e.p, (x, p) => { x.p2 = p; x.p = p; }); else add(e.p, (x, p) => (x.p = p)); break;
    case 'MTEXT': add(e.p, (x, p) => (x.p = p)); if (e.w) add(G.add(e.p, G.rotate({ x: e.w, y: 0 }, { x: 0, y: 0 }, e.rot || 0)), (x, p) => (x.w = Math.max(0.1, G.dot(G.sub(p, x.p), { x: Math.cos(x.rot || 0), y: Math.sin(x.rot || 0) })))); break;
    case 'INSERT': add(e.p, (x, p) => { const d = G.sub(p, x.p); x.p = p; for (const a of x.attribs || []) { a.p = G.add(a.p, d); if (a.p2) a.p2 = G.add(a.p2, d); } });
      for (const dg of dynGrips(e, doc)) g.push({ p: dg.p, kind: dg.kind, param: dg.param, set: (x, p) => dynSetFromPoint(x, doc, dg, p) });
      for (const a of e.attribs || []) if (!a.invisible) add(a.p2 && (a.ha || a.va) ? a.p2 : a.p, (x, p) => { const at = x.attribs.find((t) => t.tag === a.tag); if (at) { if (at.ha || at.va) at.p2 = p; at.p = p; } });
      break;
    case 'ELLIPSE': add(e.c, (x, p) => (x.c = p)); add(G.add(e.c, e.major), (x, p) => (x.major = G.sub(p, x.c))); break;
    case 'SPLINE': (e.fit && e.fit.length ? e.fit : e.cps || []).forEach((v, i) => add(v, (x, p) => { if (x.fit && x.fit.length) x.fit[i] = p; else x.cps[i] = p; })); break;
    case 'SOLID': case 'LEADER': case 'WIPEOUT': e.pts.forEach((v, i) => add(v, (x, p) => (x.pts[i] = p))); break;
    case 'HATCH': if (e.loops[0]) e.loops[0].forEach((v, i) => add(v, (x, p) => (x.loops[0][i] = { x: p.x, y: p.y, b: x.loops[0][i].b || 0 }))); break;
    case 'DUCT': e.pts.forEach((v, i) => add(v, (x, p) => { x.pts[i] = { x: p.x, y: p.y }; })); break;
    case 'TABLE': add(e.p, (x, p) => (x.p = p)); break;
    case 'DIMENSION': for (const k of ['p1', 'p2', 'c', 'dp']) if (e[k]) add(e[k], (x, p) => (x[k] = p)); if (e.p1) add(textAnchorOfDim(e, doc), (x, p) => (x.tp = p)); break;
    case 'VIEWPORT': {
      const c = e.c; add(c, (x, p) => (x.c = p));
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => add({ x: c.x + sx * e.w / 2, y: c.y + sy * e.h / 2 }, (x, p) => { x.w = Math.max(1, Math.abs(p.x - x.c.x) * 2); x.h = Math.max(1, Math.abs(p.y - x.c.y) * 2); }));
      break;
    }
  }
  return g;
}
function textAnchorOfDim(e, doc) { const t = dimEnts(e, doc).find((x) => x.type === 'TEXT'); return t ? t.p : e.dp || e.p1; }

// ---------- explode
export function explodeEnt(e, doc) {
  const base = { layer: e.layer, color: e.color, ltype: e.ltype, lw: e.lw };
  switch (e.type) {
    case 'LWPOLYLINE': return polySegs(e).map((s) => (s.k === 'L' ? { type: 'LINE', ...base, p1: s.a, p2: s.b } : { type: 'ARC', ...base, c: s.c, r: s.r, a1: s.a1, a2: s.a2 }));
    case 'INSERT': {
      const blk = blockOf(e, doc); if (!blk) return null;
      const out = [];
      for (const { ent, m } of insertChildren(e, doc)) {
        if (ent.type === 'ATTRIB') { out.push({ ...cloneEnt(ent), type: 'TEXT' }); continue; }
        const c = cloneEnt(ent); delete c.bid;
        if (c.layer === '0') c.layer = e.layer;
        if (c.color === 0) c.color = e.color ?? 256;
        if (c.type === 'ATTDEF') continue;
        transformEnt(c, m); out.push(c);
      }
      return out;
    }
    case 'DUCT': return ductEnts(e).map((x) => ({ ...cloneEnt(x), layer: e.layer, color: x.color === 8 ? 8 : e.color }));
    case 'TABLE': return tableEnts(e).map((x) => ({ ...cloneEnt(x), layer: e.layer, color: e.color }));
    case 'DIMENSION': return dimEnts(e, doc).map((x) => ({ ...cloneEnt(x), layer: e.layer }));
    case 'MTEXT': { const lay = mtextLayout(e); return lay.lines.map((t, i) => ({ type: 'TEXT', ...base, p: G.add(e.p, G.rotate({ x: lay.ox + (lay.col === 1 ? (lay.W - lay.widths[i]) / 2 : lay.col === 2 ? lay.W - lay.widths[i] : 0), y: lay.oy - lay.h - i * lay.ls }, { x: 0, y: 0 }, e.rot || 0)), h: e.h, rot: e.rot || 0, text: t })); }
    case 'HATCH': return e.loops.map((l) => ({ type: 'LWPOLYLINE', ...base, pts: l.map((p) => ({ ...p })), closed: true }));
    case 'LEADER': { const o = []; for (let i = 0; i < e.pts.length - 1; i++) o.push({ type: 'LINE', ...base, p1: e.pts[i], p2: e.pts[i + 1] }); return o; }
    case 'SPLINE': return [{ type: 'LWPOLYLINE', ...base, pts: splineTess(e).map((p) => ({ x: p.x, y: p.y, b: 0 })), closed: false }];
    case 'ELLIPSE': return [{ type: 'LWPOLYLINE', ...base, pts: ellipsePoints(e).map((p) => ({ x: p.x, y: p.y, b: 0 })), closed: false }];
  }
  return null;
}

// ---------- offset
function offsetSeg(s, d) {
  if (s.k === 'L') { const n = G.mul(G.perp(G.norm(G.sub(s.b, s.a))), d); return { k: 'L', a: G.add(s.a, n), b: G.add(s.b, n) }; }
  const r = s.cw ? s.r + d : s.r - d; // izquierda del sentido de recorrido
  if (r <= 1e-9) return null;
  return { ...s, r };
}
export function offsetEnt(e, d, side) { // side: punto
  switch (e.type) {
    case 'LINE': { const n = G.perp(G.norm(G.sub(e.p2, e.p1))), sg = G.dot(G.sub(side, e.p1), n) >= 0 ? 1 : -1; const v = G.mul(n, d * sg); return { ...cloneEnt(e), p1: G.add(e.p1, v), p2: G.add(e.p2, v) }; }
    case 'XLINE': case 'RAY': { const n = G.perp(G.norm(e.dir)), sg = G.dot(G.sub(side, e.p), n) >= 0 ? 1 : -1; return { ...cloneEnt(e), p: G.add(e.p, G.mul(n, d * sg)) }; }
    case 'CIRCLE': case 'ARC': { const r = G.dist(side, e.c) > e.r ? e.r + d : e.r - d; return r > 0 ? { ...cloneEnt(e), r } : null; }
    case 'ELLIPSE': { const a = G.len(e.major), k = (G.dist(side, e.c) > a * (1 + e.ratio) / 2 ? a + d : a - d) / a; if (k <= 0) return null; const b = a * e.ratio + (k > 1 ? d : -d); return { ...cloneEnt(e), major: G.mul(e.major, k), ratio: b / (a * k) }; }
    case 'LWPOLYLINE': {
      const segs = polySegs(e); if (!segs.length) return null;
      // lado: signo respecto al segmento más cercano
      let best = segs[0], bd = Infinity; for (const s of segs) { const dd = G.primDist(s, side); if (dd < bd) { bd = dd; best = s; } }
      let sg;
      if (best.k === 'L') sg = G.cross(G.sub(best.b, best.a), G.sub(side, best.a)) >= 0 ? 1 : -1;
      else { const inside = G.dist(side, best.c) < best.r; sg = (best.cw ? !inside : inside) ? 1 : -1; }
      const off = segs.map((s) => offsetSeg(s, d * sg));
      if (off.some((x) => !x)) return null;
      const startOf = (s, orig) => (s.k === 'L' ? s.a : G.polar(s.c, orig.cw ? s.a2 : s.a1, s.r));
      const endOf = (s, orig) => (s.k === 'L' ? s.b : G.polar(s.c, orig.cw ? s.a1 : s.a2, s.r));
      const n = off.length, pts = [];
      for (let i = 0; i < n; i++) {
        let p = startOf(off[i], segs[i]);
        if (i > 0 || e.closed) {
          const j = (i - 1 + n) % n;
          const a = off[j], b = off[i];
          if (a.k === 'L' && b.k === 'L') { const x = G.llInter(a.a, a.b, b.a, b.b, true, true); if (x.length) p = x[0]; }
          else { const xs = G.primInter(a.k === 'L' ? a : { ...a, full: true }, b.k === 'L' ? b : { ...b, full: true }, true, true); if (xs.length) { const q = endOf(a, segs[j]); xs.sort((u, v) => G.dist(u, q) - G.dist(v, q)); p = xs[0]; } }
        }
        pts.push(p);
      }
      if (!e.closed) pts.push(endOf(off[n - 1], segs[n - 1]));
      const res = pts.map((p, i) => {
        const s = off[i], o = segs[i];
        let b = 0;
        if (s && s.k === 'A') { const q = pts[(i + 1) % pts.length]; const a1 = G.ang(s.c, p), a2 = G.ang(s.c, q); b = Math.tan((o.cw ? -G.arcSweep(a2, a1) : G.arcSweep(a1, a2)) / 4); }
        return { x: p.x, y: p.y, b };
      });
      return { ...cloneEnt(e), pts: res };
    }
    case 'SPLINE': { const t = splineTess(e); const pl = { type: 'LWPOLYLINE', pts: t.map((p) => ({ x: p.x, y: p.y, b: 0 })), closed: false }; const r = offsetEnt(pl, d, side); return r ? { ...r, layer: e.layer, color: e.color } : null; }
  }
  return null;
}

// ---------- longitud / área
export function entLength(e) {
  switch (e.type) {
    case 'LINE': return G.dist(e.p1, e.p2);
    case 'CIRCLE': return G.TAU * e.r;
    case 'ARC': return e.r * G.arcSweep(e.a1, e.a2);
    case 'LWPOLYLINE': return polySegs(e).reduce((s, p) => s + G.primLen(p), 0);
    case 'ELLIPSE': { const p = ellipsePoints(e, 360); let s = 0; for (let i = 1; i < p.length; i++) s += G.dist(p[i - 1], p[i]); return s; }
    case 'SPLINE': { const p = splineTess(e); let s = 0; for (let i = 1; i < p.length; i++) s += G.dist(p[i - 1], p[i]); return s; }
  }
  return 0;
}
export function entArea(e) {
  switch (e.type) {
    case 'CIRCLE': return Math.PI * e.r * e.r;
    case 'LWPOLYLINE': return Math.abs(G.polyArea(polyPoints({ ...e, closed: true })));
    case 'ELLIPSE': return Math.PI * G.len(e.major) ** 2 * e.ratio;
    case 'HATCH': return e.loops.reduce((s, l, i) => s + (i === 0 ? 1 : -1) * Math.abs(G.polyArea(polyPoints({ pts: l, closed: true }))), 0);
    case 'SPLINE': return Math.abs(G.polyArea(splineTess(e)));
  }
  return 0;
}
// parámetro de recorrido para curvas (para TRIM/BREAK/DIVIDE)
export function curvePoints(e) {
  switch (e.type) {
    case 'LINE': return [e.p1, e.p2];
    case 'ARC': return G.tessArc(e.c, e.r, e.a1, e.a2);
    case 'CIRCLE': return G.tessArc(e.c, e.r, 0, G.TAU - 1e-9, 128).concat([G.polar(e.c, 0, e.r)]);
    case 'LWPOLYLINE': { const p = polyPoints(e); if (e.closed && p.length) p.push(p[0]); return p; }
    case 'ELLIPSE': return ellipsePoints(e);
    case 'SPLINE': return splineTess(e);
  }
  return [];
}
export function pointAtLength(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const l = G.dist(pts[i - 1], pts[i]);
    if (d <= l + 1e-12) return { p: G.lerp(pts[i - 1], pts[i], l ? d / l : 0), a: G.ang(pts[i - 1], pts[i]) };
    d -= l;
  }
  const n = pts.length; return { p: pts[n - 1], a: n > 1 ? G.ang(pts[n - 2], pts[n - 1]) : 0 };
}
