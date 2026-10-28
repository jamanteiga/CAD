// Tipografías de trazo (como las SHX de AutoCAD).
// - Fuentes libres incluidas (Hershey/LibreCAD, GPL v2+ / dominio público) en vendor/fonts/stroke/*.json,
//   que sustituyen a las SHX habituales (txt, simplex, romans, isocp…).
// - Lector de archivos .SHX reales (shapes, unifont y bigfont) que el usuario carga desde su equipo.
// Formato común de glifo: { paths: [[[x, y, bulge?], ...], ...], adv } en unidades de la fuente; cap = altura de mayúsculas.

const BASE = new URL('../../vendor/fonts/stroke/', import.meta.url).href;
// equivalencias SHX -> fuente libre incluida
export const SHX_MAP = {
  txt: 'standard', monotxt: 'standard', standard: 'standard', simplex: 'simplex', romans: 'romans', romand: 'romand', romanc: 'romanc', romant: 'romant',
  isocp: 'iso3098', isocp2: 'iso3098', isocp3: 'iso3098', isoct: 'iso3098', isoct2: 'iso3098', isoct3: 'iso3098', isocpeur: 'iso3098', iso3098: 'iso3098', iso: 'iso',
  italic: 'italicc', italicc: 'italicc', italict: 'italict', gothice: 'gothgbt', gothicg: 'gothgbt', gothici: 'gothgbt', gothgbt: 'gothgbt',
  greeks: 'greeks', greekc: 'greeks', scripts: 'scripts', scriptc: 'scriptc', complex: 'romanc', syastro: 'symath', symath: 'symath', cursive: 'cursive',
  gdt: 'iso3098', amgdt: 'iso3098', bigfont: 'standard', extfont: 'standard', extfont2: 'standard',
};
export const BUILTIN = ['standard', 'simplex', 'romans', 'romand', 'romanc', 'romant', 'iso', 'iso3098', 'italicc', 'italict', 'gothgbt', 'greeks', 'scripts', 'scriptc', 'symath', 'cursive'];

const cache = {};          // clave -> fuente cargada
const pending = {};        // clave -> promesa
const userShx = {};        // nombre -> ArrayBuffer (SHX cargados por el usuario)
let styleSource = () => ({});
let loadedCb = () => {};
export const setStyleSource = (fn) => { styleSource = fn; };
export const onFontLoaded = (fn) => { loadedCb = fn; };

const base = (f) => String(f || '').replace(/^.*[\\/]/, '').replace(/\.(shx|ttf|otf|lff|json)$/i, '').toLowerCase();
// clave de fuente de trazo para un nombre de fuente de estilo (null = fuente TrueType del sistema)
export function strokeKey(fontName) {
  const f = String(fontName || '');
  const b = base(f);
  if (userShx[b]) return 'shx:' + b;
  if (/\.shx$/i.test(f)) return SHX_MAP[b] || 'standard';
  if (/\.(ttf|otf)$/i.test(f)) return null;
  if (SHX_MAP[b] && !/arial|helvetica|times|calibri|segoe/i.test(f)) return SHX_MAP[b];
  return null;
}
export function styleFont(styleName) {
  const st = (styleSource() || {})[styleName] || (styleSource() || {}).Standard;
  const key = strokeKey(st?.font);
  return key ? getFont(key) : null;
}
// devuelve la fuente si está cargada; si no, la carga en segundo plano y devuelve null
export function getFont(key) {
  if (cache[key]) return cache[key];
  if (key !== 'standard' && !cache.standard && !pending.standard) getFont('standard'); // reserva para glifos que falten
  if (!pending[key]) pending[key] = loadFont(key).then((f) => { cache[key] = f; loadedCb(key); return f; }).catch((e) => { console.warn('fuente', key, e); cache[key] = null; });
  return null;
}
export function fontReady(key) { return pending[key] || Promise.resolve(cache[key]); }
async function loadFont(key) {
  if (key.startsWith('shx:')) return parseSHX(userShx[key.slice(4)], key.slice(4));
  const r = await fetch(BASE + key + '.json');
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  const glyphs = {};
  for (const [code, paths] of Object.entries(d.g)) {
    let maxX = 0; for (const p of paths) for (const v of p) maxX = Math.max(maxX, v[0]);
    glyphs[code] = { paths, adv: paths.length ? maxX + d.ls : d.ws };
  }
  if (!glyphs[32]) glyphs[32] = { paths: [], adv: d.ws };
  return { name: d.name, cap: d.cap || 9, glyphs, lsf: d.lsf || 1, kind: 'lff' };
}
// ---- SHX del usuario (persisten en el navegador)
const SHX_DB = 'webcad.shx';
export async function addUserShx(name, buf) {
  const b = base(name); userShx[b] = buf; delete cache['shx:' + b]; delete pending['shx:' + b];
  try { const all = JSON.parse(localStorage.getItem(SHX_DB) || '{}'); all[b] = b64(buf); localStorage.setItem(SHX_DB, JSON.stringify(all)); } catch (_) { /* sin espacio: queda solo en esta sesión */ }
  return 'shx:' + b;
}
export function listUserShx() { return Object.keys(userShx); }
export function removeUserShx(name) { delete userShx[name]; delete cache['shx:' + name]; try { const all = JSON.parse(localStorage.getItem(SHX_DB) || '{}'); delete all[name]; localStorage.setItem(SHX_DB, JSON.stringify(all)); } catch (_) { /* */ } }
try { const all = JSON.parse(localStorage.getItem(SHX_DB) || '{}'); for (const [k, v] of Object.entries(all)) userShx[k] = unb64(v); } catch (_) { /* */ }
function b64(buf) { let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; }

// ---- medición y trazado
const FALLBACK = '?'.charCodeAt(0);
function glyphOf(font, ch) {
  const code = ch.codePointAt(0);
  let g = font.glyphs[code];
  if (!g && font.kind === 'shx' && font.fallback) g = font.fallback.glyphs[code];
  if (!g) { const std = cache.standard; if (std && std !== font) { const s = std.glyphs[code]; if (s) { const k = font.cap / std.cap; g = { paths: s.paths.map((p) => p.map((v) => [v[0] * k, v[1] * k, v[2] || 0])), adv: s.adv * k }; font.glyphs[code] = g; } } }
  return g || font.glyphs[FALLBACK] || { paths: [], adv: font.cap * 0.6 };
}
// anchura en unidades de dibujo para una altura h
export function strokeWidth(font, str, h, wf = 1) {
  let w = 0; for (const ch of str) w += glyphOf(font, ch).adv;
  // se descuenta el espaciado final para que la caja coincida con el trazo
  if (font.kind === 'lff' && str.length) { const last = glyphOf(font, [...str].pop()); if (last.paths.length) w -= (last.adv - maxX(last)); }
  return w * (h / font.cap) * wf;
}
const maxX = (g) => { let m = 0; for (const p of g.paths) for (const v of p) m = Math.max(m, v[0]); return m; };
// trazo en un contexto 2D ya situado en el origen de la línea base (y hacia arriba)
export function strokeText(ctx, font, str, h, wf = 1) {
  const k = h / font.cap; let x = 0;
  for (const ch of str) {
    const g = glyphOf(font, ch);
    for (const p of g.paths) {
      if (!p.length) continue;
      ctx.moveTo((x + p[0][0]) * k * wf, p[0][1] * k);
      for (let i = 1; i < p.length; i++) {
        const a = p[i - 1], b = p[i];
        if (b[2]) arcTo(ctx, (x + a[0]) * k * wf, a[1] * k, (x + b[0]) * k * wf, b[1] * k, b[2]);
        else ctx.lineTo((x + b[0]) * k * wf, b[1] * k);
      }
    }
    x += g.adv;
  }
}
// polilíneas (para descomponer texto en líneas, exportar o medir)
export function textPolylines(font, str, h, wf = 1) {
  const out = []; const k = h / font.cap; let x = 0;
  for (const ch of str) {
    const g = glyphOf(font, ch);
    for (const p of g.paths) out.push(p.map((v) => ({ x: (x + v[0]) * k * wf, y: v[1] * k, b: 0 })).map((v, i, arr) => ({ ...v, b: i + 1 < arr.length ? (p[i + 1][2] || 0) : 0 })));
    x += g.adv;
  }
  return out;
}
function arcTo(ctx, x1, y1, x2, y2, bulge) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy);
  if (d < 1e-12) return;
  const sOff = (d / 2) * (1 - bulge * bulge) / (2 * bulge); // distancia con signo del centro a la cuerda
  const cx = (x1 + x2) / 2 - dy / d * sOff, cy = (y1 + y2) / 2 + dx / d * sOff;
  const r = Math.hypot(x1 - cx, y1 - cy);
  ctx.arc(cx, cy, r, Math.atan2(y1 - cy, x1 - cx), Math.atan2(y2 - cy, x2 - cx), bulge < 0);
}

// ================= lector SHX =================
const DIRS = [[1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [-0.5, 1], [-1, 1], [-1, 0.5], [-1, 0], [-1, -0.5], [-1, -1], [-0.5, -1], [0, -1], [0.5, -1], [1, -1], [1, -0.5]];
export function parseSHX(buf, name = 'shx') {
  const u = new Uint8Array(buf), dv = new DataView(buf);
  let head = ''; let p = 0; while (p < 40 && u[p] !== 0x1a) head += String.fromCharCode(u[p++]); p++;
  const defs = {}; // código -> bytes
  let above = 0, below = 0, isUni = /unifont/i.test(head), isBig = /bigfont/i.test(head);
  if (/shapes/i.test(head)) {
    p += 4; const n = dv.getUint16(p, true); p += 2;
    const idx = []; for (let i = 0; i < n; i++) { idx.push([dv.getUint16(p, true), dv.getUint16(p + 2, true)]); p += 4; }
    for (const [code, len] of idx) { defs[code] = u.subarray(p, p + len); p += len; }
  } else if (isUni) {
    const n = dv.getUint32(p, true); p += 4; const ilen = dv.getUint16(p, true); p += 2;
    defs[0] = u.subarray(p, p + ilen); p += ilen;
    for (let i = 0; i < n - 1 && p + 4 <= u.length; i++) { const code = dv.getUint16(p, true), len = dv.getUint16(p + 2, true); p += 4; defs[code] = u.subarray(p, p + len); p += len; }
  } else if (isBig) {
    p += 2; const n = dv.getUint16(p, true); const nr = dv.getUint16(p + 2, true); p += 4 + nr * 4;
    for (let i = 0; i < n && p + 8 <= u.length; i++) { const code = dv.getUint16(p, true), len = dv.getUint16(p + 2, true), off = dv.getUint32(p + 4, true); p += 8; if (len) defs[code] = u.subarray(off, off + len); }
  } else throw new Error('No es un archivo SHX');
  // definición 0: nombre + arriba, abajo, modos
  const skipName = (b) => { let i = 0; while (i < b.length && b[i] !== 0) i++; return i + 1; };
  if (defs[0]) { const b = defs[0]; const i = skipName(b); above = b[i] || 0; below = b[i + 1] || 0; if (isUni) { above = b[i]; below = b[i + 1]; } }
  if (!above) above = 8;
  const glyphs = {};
  const run = (code, st, depth = 0) => {
    const b = defs[code]; if (!b || depth > 6) return;
    let i = code === 0 && !isUni ? b.length : skipName(b);
    const sb = (x) => (x > 127 ? x - 256 : x);
    const move = (dx, dy) => { const nx = st.x + dx * st.sc, ny = st.y + dy * st.sc; if (st.pen) { if (!st.cur) { st.cur = [[st.x, st.y]]; st.paths.push(st.cur); } st.cur.push([nx, ny]); } st.x = nx; st.y = ny; };
    const arcPts = (cx, cy, r, a1, sweep) => { const n = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 16))); for (let k = 1; k <= n; k++) { const a = a1 + sweep * k / n; const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); if (st.pen) { if (!st.cur) { st.cur = [[st.x, st.y]]; st.paths.push(st.cur); } st.cur.push([x, y]); } st.x = x; st.y = y; } };
    const bulge = (dx, dy, bl) => { // arco por desplazamiento y abombamiento (-127..127)
      if (!bl) { move(dx, dy); return; }
      const ex = st.x + dx * st.sc, ey = st.y + dy * st.sc, d = Math.hypot(ex - st.x, ey - st.y), bb = bl / 127, sweep = 4 * Math.atan(bb);
      if (d < 1e-12) return;
      const so = (d / 2) * (1 - bb * bb) / (2 * bb);
      const cx = (st.x + ex) / 2 - (ey - st.y) / d * so, cy = (st.y + ey) / 2 + (ex - st.x) / d * so;
      arcPts(cx, cy, Math.hypot(st.x - cx, st.y - cy), Math.atan2(st.y - cy, st.x - cx), sweep);
    };
    let skip = false;
    while (i < b.length) {
      const c = b[i++]; const vertOnly = skip; skip = false;
      const savePen = st.pen, saveX = st.x, saveY = st.y;
      if (c === 0) break;
      if (c > 0x0f) { const len = c >> 4, dir = DIRS[c & 15]; if (!vertOnly) move(dir[0] * len, dir[1] * len); continue; }
      switch (c) {
        case 1: if (!vertOnly) { st.pen = true; st.cur = null; } break;
        case 2: if (!vertOnly) { st.pen = false; st.cur = null; } break;
        case 3: { const v = b[i++]; if (!vertOnly && v) st.sc /= v; break; }
        case 4: { const v = b[i++]; if (!vertOnly) st.sc *= v; break; }
        case 5: if (!vertOnly) st.stack.push([st.x, st.y]); break;
        case 6: if (!vertOnly) { const q = st.stack.pop(); if (q) { st.x = q[0]; st.y = q[1]; st.cur = null; } } break;
        case 7: { let sub; if (isUni) { sub = (b[i] << 8) | b[i + 1]; i += 2; } else { sub = b[i++]; if (isBig && sub === 0) { sub = (b[i] << 8) | b[i + 1]; i += 6; } } if (!vertOnly) { st.cur = null; run(sub, st, depth + 1); st.cur = null; } break; }
        case 8: { const dx = sb(b[i++]), dy = sb(b[i++]); if (!vertOnly) move(dx, dy); break; }
        case 9: for (;;) { const dx = sb(b[i++]), dy = sb(b[i++]); if (dx === 0 && dy === 0) break; if (!vertOnly) move(dx, dy); } break;
        case 10: { const r = b[i++] * st.sc, o = sb(b[i++]); const so = (Math.abs(o) >> 4) & 7, no = (Math.abs(o) & 7) || 8; const ccw = o >= 0; const a0 = so * Math.PI / 4; const cx = st.x - r * Math.cos(a0), cy = st.y - r * Math.sin(a0); if (!vertOnly) arcPts(cx, cy, r, a0, (ccw ? 1 : -1) * no * Math.PI / 4); break; }
        case 11: { const so_ = b[i++], eo = b[i++], rh = b[i++], rl = b[i++], o = sb(b[i++]); const r = (rh * 256 + rl) * st.sc; const so = (Math.abs(o) >> 4) & 7, no = (Math.abs(o) & 7) || 8; const ccw = o >= 0; const s = ccw ? 1 : -1; const a0 = so * Math.PI / 4 + s * so_ * (Math.PI / 4) / 256; const sweep = s * (no * Math.PI / 4 - (so_ + (256 - eo) % 256) * (Math.PI / 4) / 256); const cx = st.x - r * Math.cos(a0), cy = st.y - r * Math.sin(a0); if (!vertOnly) arcPts(cx, cy, r, a0, sweep); break; }
        case 12: { const dx = sb(b[i++]), dy = sb(b[i++]), bl = sb(b[i++]); if (!vertOnly) bulge(dx, dy, bl); break; }
        case 13: for (;;) { const dx = sb(b[i++]), dy = sb(b[i++]); if (dx === 0 && dy === 0) break; const bl = sb(b[i++]); if (!vertOnly) bulge(dx, dy, bl); } break;
        case 14: skip = true; break; // la siguiente orden solo vale para texto vertical
        default: break;
      }
      if (vertOnly) { st.pen = savePen; st.x = saveX; st.y = saveY; }
    }
  };
  for (const code of Object.keys(defs)) {
    const c = +code; if (c === 0) continue;
    const st = { x: 0, y: 0, sc: 1, pen: true, stack: [], paths: [], cur: null };
    try { run(c, st); } catch (_) { continue; }
    glyphs[c] = { paths: st.paths.filter((pp) => pp.length > 1), adv: st.x };
  }
  if (!glyphs[32]) glyphs[32] = { paths: [], adv: above * 0.6 };
  return { name, cap: above, below, glyphs, kind: 'shx', big: isBig };
}
