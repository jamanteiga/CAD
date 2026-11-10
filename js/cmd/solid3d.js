// 3D básico: sólidos (prisma, cilindro, cono, esfera, extrusión, revolución), visor 3D con órbita, ViewCube y
// estilos visuales, exportación STL/OBJ; nubes de puntos (XYZ/PTS/PLY/CSV) y geolocalización con mapa de OpenStreetMap.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t as T } from '../core/i18n.js';
import { aciCss } from '../core/tables.js';
import * as P3 from '../core/plane3d.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
let EARCUT = null;
const earcut = async () => (EARCUT ||= (await import(new URL('../../vendor/earcut/earcut.mjs', import.meta.url).href)).default);

// ======================= SÓLIDOS =======================
const ring = (l) => { const p = E.polyPoints({ pts: l, closed: true }); if (p.length > 1 && G.eq(p[0], p.at(-1), 1e-9)) p.pop(); return p; };
const ccw = (p) => (G.polyArea(p) < 0 ? p.slice().reverse() : p);
// malla: { v: [[x,y,z]], f: [[i,j,k,...]], caps: [{ outer:[idx], holes:[[idx]] }] }
// malla en coordenadas universales (aplica el plano de trabajo del sólido, e.wp)
export function meshOf(e) {
  const m = meshLocal(e);
  if (!e.wp || P3.isWorld(e.wp)) return m;
  return { ...m, v: m.v.map(([x, y, z]) => P3.toW(e.wp, { x, y, z })), caps: m.caps };
}
// malla en las coordenadas del plano del sólido
export function meshLocal(e) {
  const v = [], f = [];
  const add = (x, y, z) => (v.push([x, y, z]), v.length - 1);
  const z0 = e.z0 || 0;
  if (e.kind === 'mesh') { for (const poly of e.polys || []) f.push(poly.map((p) => add(p[0], p[1], p[2]))); return { v, f }; }
  if (e.kind === 'sphere') {
    const n = 24, m = 12, c = e.c, r = e.r, zc = z0 + r;
    for (let j = 0; j <= m; j++) { const phi = Math.PI * j / m; for (let i = 0; i < n; i++) { const th = 2 * Math.PI * i / n; add(c.x + r * Math.sin(phi) * Math.cos(th), c.y + r * Math.sin(phi) * Math.sin(th), zc + r * Math.cos(phi)); } }
    for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = j * n + i, b = j * n + (i + 1) % n, c2 = (j + 1) * n + (i + 1) % n, d = (j + 1) * n + i; f.push(j === 0 ? [a, c2, d] : j === m - 1 ? [a, b, d] : [a, b, c2, d]); }
    return { v, f: f.map((x) => x.slice().reverse()) };
  }
  if (e.kind === 'revolve') {
    const prof = ccw(ring(e.prof[0])), a1 = e.axis[0], u = G.norm(G.sub(e.axis[1], e.axis[0])), nrm = G.perp(u);
    const ang = e.ang || G.TAU, steps = Math.max(8, Math.round(48 * ang / G.TAU)), full = Math.abs(ang - G.TAU) < 1e-6;
    const cnt = full ? steps : steps + 1;
    for (let s = 0; s < cnt; s++) {
      const th = ang * s / steps, ct = Math.cos(th), st = Math.sin(th);
      for (const p of prof) { const q = G.sub(p, a1), t = G.dot(q, u), d = G.dot(q, nrm); const base = G.add(a1, G.mul(u, t)); add(base.x + nrm.x * d * ct, base.y + nrm.y * d * ct, z0 + d * st); }
    }
    const n = prof.length;
    for (let s = 0; s < steps; s++) for (let i = 0; i < n; i++) { const s2 = (s + 1) % cnt; f.push([s * n + i, s * n + (i + 1) % n, s2 * n + (i + 1) % n, s2 * n + i]); }
    if (!full) { f.push([...Array(n).keys()].reverse()); f.push([...Array(n).keys()].map((i) => steps * n + i)); }
    const mm = { v, f };
    if (meshVolume(mm) < 0) mm.f = f.map((x) => x.slice().reverse());
    return mm;
  }
  // prismas: extrusión de contornos (con huecos) entre z0 y z0+h, con escala superior (cono / ahusado)
  const loops = e.prof.map((l, i) => { const r = ring(l); return i === 0 ? ccw(r) : ccw(r).reverse(); });
  const top = z0 + e.h, k2 = e.taper ?? 1;
  const cen = (() => { const b = G.bbNew(); for (const p of loops[0]) G.bbAdd(b, p); return { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 }; })();
  const caps = [];
  const bot = [], tp = [];
  for (const l of loops) {
    const ib = l.map((p) => add(p.x, p.y, z0));
    const it = l.map((p) => { const q = G.add(cen, G.mul(G.sub(p, cen), k2)); return add(q.x, q.y, top); });
    bot.push(ib); tp.push(it);
    for (let i = 0; i < l.length; i++) { const j = (i + 1) % l.length; f.push([ib[i], ib[j], it[j], it[i]]); }
  }
  caps.push({ outer: bot[0].slice().reverse(), holes: bot.slice(1).map((x) => x.slice().reverse()), z: z0 }, { outer: tp[0], holes: tp.slice(1), z: top });
  for (const c of caps) if (!c.holes.length) f.push(c.outer);
  return { v, f, caps: caps.filter((c) => c.holes.length) };
}
export function meshVolume(m) {
  let V = 0;
  const tri = (a, b, c) => (V += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6);
  for (const f of m.f) for (let i = 1; i < f.length - 1; i++) tri(m.v[f[0]], m.v[f[i]], m.v[f[i + 1]]);
  return V;
}
// aristas vivas de una malla proyectadas en planta
export function featureEdges(m, angDeg = 20, sil = false) {
  const key = (p) => `${p[0].toFixed(6)},${p[1].toFixed(6)},${p[2].toFixed(6)}`;
  const nrm = (f) => { let n = [0, 0, 0]; for (let i = 0; i < f.length; i++) { const p = m.v[f[i]], q = m.v[f[(i + 1) % f.length]]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); } const l = Math.hypot(...n) || 1; return n.map((x) => x / l); };
  const E2 = new Map();
  m.f.forEach((f, fi) => { const n = nrm(f); for (let i = 0; i < f.length; i++) { const a = m.v[f[i]], b = m.v[f[(i + 1) % f.length]]; const ka = key(a), kb = key(b); const k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const o = E2.get(k); if (o) o.n.push(n); else E2.set(k, { a, b, n: [n] }); } });
  const cmax = Math.cos(angDeg * Math.PI / 180), out = [];
  for (const { a, b, n } of E2.values()) if (n.length < 2 || n[0][0] * n[1][0] + n[0][1] * n[1][1] + n[0][2] * n[1][2] < cmax || (sil && n[0][2] * n[1][2] < -1e-9)) out.push([a, b]);
  return out;
}
const solidOutline = (e) => {
  if (e.kind === 'mesh') { const out = []; const seen = new Set(); for (const [a, b] of featureEdges(meshOf(e), 20, true)) { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9) continue; const k = [a[0], a[1], b[0], b[1]].map((x) => x.toFixed(5)); const kk = k[0] + k[1] < k[2] + k[3] ? k.join() : [k[2], k[3], k[0], k[1]].join(); if (seen.has(kk)) continue; seen.add(kk); out.push({ type: 'LINE', p1: { x: a[0], y: a[1] }, p2: { x: b[0], y: b[1] } }); } return out; }
  if (e.kind === 'sphere') return [{ type: 'CIRCLE', c: e.c, r: e.r }];
  if (e.kind === 'revolve') { const m = meshOf(e); const pts = m.v.map(([x, y]) => ({ x, y })); const bb = G.bbNew(); for (const p of pts) G.bbAdd(bb, p); return [{ type: 'LWPOLYLINE', pts: [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x2, y: bb.y2 }, { x: bb.x1, y: bb.y2 }].map((p) => ({ ...p, b: 0 })), closed: true }, ...e.prof.map((l) => ({ type: 'LWPOLYLINE', pts: l.map((p) => ({ ...p })), closed: true }))]; }
  const out = e.prof.map((l) => ({ type: 'LWPOLYLINE', pts: l.map((p) => ({ x: p.x, y: p.y, b: p.b || 0 })), closed: true }));
  if ((e.taper ?? 1) !== 1) { const b = G.bbNew(); for (const p of ring(e.prof[0])) G.bbAdd(b, p); const c = { x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 }; if (e.taper > 1e-9) out.push(...e.prof.map((l) => ({ type: 'LWPOLYLINE', pts: ring(l).map((p) => ({ ...G.add(c, G.mul(G.sub(p, c), e.taper)), b: 0 })), closed: true }))); else out.push({ type: 'POINT', p: c }); }
  return out;
};
E.GEN['3DSOLID'] = {
  pts: ['c'], loops: ['prof'], arrs: ['axis'], lens: ['r', 'h'],
  xform(e, m, o) {
    if (o.s !== 1) e.z0 = (e.z0 || 0) * o.s;
    if (e.polys) e.polys = e.polys.map((f) => { const g = f.map((p) => { const q = G.M.apply(m, { x: p[0], y: p[1] }); return [q.x, q.y, p[2] * o.s]; }); return o.mir ? g.reverse() : g; });
  },
  ents(e) { return solidOutline(e).map((x) => ({ ...x, layer: e.layer })); },
  volume(e) { return Math.abs(meshVolume(meshOf(e))); },
  inside(e, p) {
    if (e.kind === 'sphere') return G.dist(p, e.c) <= e.r;
    if (e.kind === 'mesh') return (e.polys || []).some((f) => f.length > 2 && G.ptInPoly(p, f.map((q) => ({ x: q[0], y: q[1] }))));
    return e.prof?.[0] ? G.ptInPoly(p, ring(e.prof[0])) : false;
  },
};

// ======================= NUBES DE PUNTOS =======================
const CLOUD = new Map();
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export function cloudData(doc, id) {
  let c = CLOUD.get(id);
  const src = doc.ext?.clouds?.[id];
  if (!src) return null;
  if (!c || c.src !== src) { const xyz = new Float32Array(unb64(src.xyz).buffer); c = { src, xyz, rgb: src.rgb ? unb64(src.rgb) : null, n: src.n, bb: src.bb, ox: src.ox || 0, oy: src.oy || 0, oz: src.oz || 0 }; CLOUD.set(id, c); }
  return c;
}
export function parseCloud(text, name) {
  const xyz = [], rgb = []; let hasRgb = false;
  const lines = text.split(/\r?\n/);
  let i = 0;
  if (/\.ply$/i.test(name)) { while (i < lines.length && !/^end_header/.test(lines[i])) i++; i++; }
  else if (/\.pts$/i.test(name) && /^\s*\d+\s*$/.test(lines[0])) i = 1;
  for (; i < lines.length; i++) {
    const p = lines[i].trim().split(/[\s,;]+/).map(Number);
    if (p.length < 3 || p.slice(0, 3).some((v) => !isFinite(v))) continue;
    xyz.push(p[0], p[1], p[2]);
    let r = null;
    if (/\.pts$/i.test(name) && p.length >= 7) r = p.slice(4, 7); else if (p.length >= 6) r = p.slice(3, 6);
    if (r && r.every((v) => isFinite(v))) { if (r.every((v) => v <= 1) && r.some((v) => v > 0 && v < 1)) r = r.map((v) => v * 255); rgb.push(...r.map((v) => Math.max(0, Math.min(255, Math.round(v))))); hasRgb = true; } else rgb.push(200, 200, 200);
  }
  return buildCloud(name, xyz, hasRgb ? rgb : null);
}
// construye la nube serializable a partir de coordenadas (x,y,z…) y colores opcionales (r,g,b…)
export function buildCloud(name, xyz, rgb) {
  const n = Math.floor(xyz.length / 3);
  // origen local para conservar la precisión en coordenadas UTM grandes
  let ox = 0, oy = 0, oz = 0;
  if (n) { ox = Math.floor(xyz[0]); oy = Math.floor(xyz[1]); oz = Math.floor(xyz[2]); }
  const f = new Float32Array(n * 3); const bb = { x1: Infinity, y1: Infinity, z1: Infinity, x2: -Infinity, y2: -Infinity, z2: -Infinity };
  for (let k = 0; k < n; k++) {
    const x = xyz[k * 3], y = xyz[k * 3 + 1], z = xyz[k * 3 + 2];
    f[k * 3] = x - ox; f[k * 3 + 1] = y - oy; f[k * 3 + 2] = z - oz;
    if (x < bb.x1) bb.x1 = x; if (x > bb.x2) bb.x2 = x; if (y < bb.y1) bb.y1 = y; if (y > bb.y2) bb.y2 = y; if (z < bb.z1) bb.z1 = z; if (z > bb.z2) bb.z2 = z;
  }
  return { name, n, xyz: b64(new Uint8Array(f.buffer)), rgb: rgb ? b64(Uint8Array.from(rgb)) : null, bb, ox, oy, oz };
}
// LAS 1.0-1.4 binario sin comprimir (formatos de punto 0-10); diezma por encima de maxPts
export function parseLAS(buf, name, maxPts = 3000000) {
  const dv = new DataView(buf);
  if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'LASF') throw new Error('No es un archivo LAS');
  const minor = dv.getUint8(25), off = dv.getUint32(96, true), fmt = dv.getUint8(104) & 0x3f, rlen = dv.getUint16(105, true);
  if (dv.getUint8(104) & 0x80) throw new Error('LAZ comprimido: descomprímalo a LAS');
  let n = dv.getUint32(107, true);
  if (minor >= 4 && dv.byteLength > 255) { const n64 = Number(dv.getBigUint64(247, true)); if (n64) n = n64; }
  n = Math.min(n, Math.floor((buf.byteLength - off) / rlen));
  const sx = dv.getFloat64(131, true), sy = dv.getFloat64(139, true), sz = dv.getFloat64(147, true), ox = dv.getFloat64(155, true), oy = dv.getFloat64(163, true), oz = dv.getFloat64(171, true);
  const rgbOff = { 2: 20, 3: 28, 5: 28, 7: 30, 8: 30, 10: 30 }[fmt];
  const step = Math.max(1, Math.ceil(n / maxPts)), xyz = [], rgb = rgbOff ? [] : null;
  let k16 = 1;
  if (rgbOff) { let mx = 0; for (let i = 0; i < Math.min(n, 2000); i++) { const o = off + i * rlen + rgbOff; mx = Math.max(mx, dv.getUint16(o, true), dv.getUint16(o + 2, true), dv.getUint16(o + 4, true)); } k16 = mx > 255 ? 256 : 1; }
  for (let i = 0; i < n; i += step) {
    const o = off + i * rlen;
    xyz.push(dv.getInt32(o, true) * sx + ox, dv.getInt32(o + 4, true) * sy + oy, dv.getInt32(o + 8, true) * sz + oz);
    if (rgb) rgb.push(...[0, 2, 4].map((d) => Math.min(255, Math.round(dv.getUint16(o + rgbOff + d, true) / k16))));
  }
  return buildCloud(name, xyz, rgb);
}
const ramp = (t) => { t = Math.max(0, Math.min(1, t)); const r = Math.round(255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 3)))), g = Math.round(255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 2)))), b = Math.round(255 * Math.min(1, Math.max(0, 1.5 - Math.abs(4 * t - 1)))); return [r, g, b]; };
E.GEN.POINTCLOUD = {
  pts: ['p'], lens: ['sc'],
  ents(e, doc) { const c = cloudData(doc, e.cloud); if (!c) return []; const s = e.sc || 1, o = e.p || { x: 0, y: 0 }; const b = c.bb; const q = (x, y) => ({ x: o.x + (x - c.ox) * s + c.ox * s, y: o.y + (y - c.oy) * s + c.oy * s }); return [{ type: 'LWPOLYLINE', pts: [q(b.x1, b.y1), q(b.x2, b.y1), q(b.x2, b.y2), q(b.x1, b.y2)].map((p) => ({ ...p, b: 0 })), closed: true, layer: e.layer, ltype: 'CONTINUOUS' }]; },
  draw(ctx, e, doc, st) {
    const c = cloudData(doc, e.cloud); if (!c) return;
    const s = e.sc || 1, o = e.p || { x: 0, y: 0 }, px = st.px || 1;
    if (st.override) { const bb = E.GEN.POINTCLOUD.ents(e, doc)[0]; ctx.beginPath(); bb.pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke(); return; }
    const dens = Math.max(1, Math.min(100, doc.vars.POINTCLOUDDENSITY ?? 15)), maxPts = 30000 + 4700 * dens;
    const step = Math.max(1, Math.ceil(c.n / maxPts)), sz = (e.psize ?? 2) / px;
    const mode = e.cmode || (c.rgb ? 'rgb' : 'z'), zr = (c.bb.z2 - c.bb.z1) || 1;
    const vb = st.viewBB;
    const base = mode === 'obj' ? ctx.strokeStyle : null;
    let last = '';
    for (let k = 0; k < c.n; k += step) {
      const x = o.x + (c.xyz[k * 3] + c.ox) * s, y = o.y + (c.xyz[k * 3 + 1] + c.oy) * s;
      if (vb && (x < vb.x1 || x > vb.x2 || y < vb.y1 || y > vb.y2)) continue;
      let col;
      if (mode === 'obj') col = base;
      else if (mode === 'rgb' && c.rgb) col = `rgb(${c.rgb[k * 3]},${c.rgb[k * 3 + 1]},${c.rgb[k * 3 + 2]})`;
      else { const [r, g, b] = ramp((c.xyz[k * 3 + 2] + c.oz - c.bb.z1) / zr); col = `rgb(${r},${g},${b})`; }
      if (col !== last) { ctx.fillStyle = col; last = col; }
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  },
  snaps(e, push, doc) { const c = cloudData(doc, e.cloud); if (c) push({ x: (e.p?.x || 0) + c.bb.x1 * (e.sc || 1), y: (e.p?.y || 0) + c.bb.y1 * (e.sc || 1) }, 'ins'); },
  inside(e, p, doc) { const b = E.GEN.POINTCLOUD.ents(e, doc)[0]; return b ? G.ptInPoly(p, b.pts) : false; },
};

// ======================= GEOLOCALIZACIÓN =======================
const RE = 6378137;
export function geoToLatLon(geo, p) {
  const u = geo.unit || 1, q = G.rotate(G.sub(p, geo.dp || { x: 0, y: 0 }), { x: 0, y: 0 }, geo.north || 0);
  const e = q.x * u, n = q.y * u;
  return { lat: geo.lat + G.deg(n / RE), lon: geo.lon + G.deg(e / (RE * Math.cos(G.rad(geo.lat)))) };
}
export function latLonToGeo(geo, lat, lon) {
  const u = geo.unit || 1;
  const n = G.rad(lat - geo.lat) * RE, e = G.rad(lon - geo.lon) * RE * Math.cos(G.rad(geo.lat));
  return G.add(geo.dp || { x: 0, y: 0 }, G.rotate({ x: e / u, y: n / u }, { x: 0, y: 0 }, -(geo.north || 0)));
}
const tileXY = (lat, lon, z) => { const n = 2 ** z, x = (lon + 180) / 360 * n, lr = G.rad(lat); return { x, y: (1 - Math.log(Math.tan(lr) + 1 / Math.cos(lr)) / Math.PI) / 2 * n }; };
const tileLatLon = (x, y, z) => { const n = 2 ** z, lon = x / n * 360 - 180, lat = G.deg(Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)))); return { lat, lon }; };
const TILES = new Map();

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const solid = (o) => doc().add({ type: '3DSOLID', ...o });

  // ---------- primitivas
  R('BOX', async (c) => {
    const p1 = need(await c.getPoint('Specify first corner or [Center]:'));
    let p2 = need(await c.getPoint('Specify other corner or [Cube/Length]:', { base: p1, rubber: 'rect' }));
    if (p2 === 'Cube' || p2 === 'Length') { const L = need(await c.getDist('Specify length:', { base: p1 })); p2 = { x: p1.x + L, y: p1.y + L }; }
    const prof = [[{ x: p1.x, y: p1.y, b: 0 }, { x: p2.x, y: p1.y, b: 0 }, { x: p2.x, y: p2.y, b: 0 }, { x: p1.x, y: p2.y, b: 0 }]];
    const hh = need(await c.getDist('Specify height or [2Point]:', { def: Math.abs(p2.x - p1.x) }));
    solid({ kind: 'extrude', prof, h: hh }); redraw();
  });
  R('CYLINDER', async (c) => {
    const ce = need(await c.getPoint('Specify center point of base or [3P/2P/Ttr/Elliptical]:'));
    const r = need(await c.getDist('Specify base radius or [Diameter]:', { base: ce, preview: (q) => [{ type: 'CIRCLE', c: ce, r: G.dist(ce, q) }] }));
    const hh = need(await c.getDist('Specify height or [2Point/Axis endpoint]:', { def: r * 2 }));
    solid({ kind: 'extrude', prof: [[{ ...G.polar(ce, 0, r), b: 1 }, { ...G.polar(ce, Math.PI, r), b: 1 }]], h: hh, c: { ...ce }, r }); redraw();
  }, { alias: ['CYL'] });
  R('CONE', async (c) => {
    const ce = need(await c.getPoint('Specify center point of base or [3P/2P/Ttr/Elliptical]:'));
    const r = need(await c.getDist('Specify base radius or [Diameter]:', { base: ce, preview: (q) => [{ type: 'CIRCLE', c: ce, r: G.dist(ce, q) }] }));
    let hh = await c.getDist('Specify height or [2Point/Axis endpoint/Top radius]:', { def: r * 2 }); if (hh == null) return;
    let k = 0;
    if (hh === 'Top radius') { const r2 = need(await c.getDist('Specify top radius <0>:', { def: 0 })); k = r2 / r; hh = need(await c.getDist('Specify height:', { def: r * 2 })); }
    solid({ kind: 'extrude', prof: [[{ ...G.polar(ce, 0, r), b: 1 }, { ...G.polar(ce, Math.PI, r), b: 1 }]], h: hh, taper: k, c: { ...ce }, r }); redraw();
  });
  R('SPHERE', async (c) => {
    const ce = need(await c.getPoint('Specify center point or [3P/2P/Ttr]:'));
    const r = need(await c.getDist('Specify radius or [Diameter]:', { base: ce, preview: (q) => [{ type: 'CIRCLE', c: ce, r: G.dist(ce, q) }] }));
    solid({ kind: 'sphere', c: { ...ce }, r, z0: -r }); redraw();
  });
  // cuña, pirámide y toroide (mallas cerradas con caras orientadas hacia fuera)
  const meshSolid = (polys, extra = {}) => solid({ kind: 'mesh', polys, local: true, ...extra });
  R('WEDGE', async (c) => {
    const p1 = need(await c.getPoint('Specify first corner or [Center]:'));
    let p2 = need(await c.getPoint('Specify other corner or [Cube/Length]:', { base: p1, rubber: 'rect' }));
    if (p2 === 'Cube' || p2 === 'Length') { const L = need(await c.getDist('Specify length:', { base: p1 })); p2 = { x: p1.x + L, y: p1.y + L }; }
    const hh = need(await c.getDist('Specify height or [2Point]:', { def: Math.abs(p2.x - p1.x) }));
    const x1 = p1.x, x2 = p2.x, y1 = Math.min(p1.y, p2.y), y2 = Math.max(p1.y, p2.y), z0 = Math.min(0, hh), z1 = Math.max(0, hh);
    const sx = x2 >= x1 ? 1 : -1, b0 = [x1, y1, z0], b1 = [x2, y1, z0], b2 = [x2, y2, z0], b3 = [x1, y2, z0], t0 = [x1, y1, z1], t3 = [x1, y2, z1];
    let polys = [[b0, b3, b2, b1], [b0, t0, t3, b3], [b0, b1, t0], [b3, t3, b2], [t0, b1, b2, t3]];
    if (sx < 0) polys = polys.map((f) => f.slice().reverse());
    meshSolid(polys); redraw();
  });
  R('PYRAMID', async (c) => {
    let n = 4;
    let ce = need(await c.getPoint('Specify center point of base or [Sides]:'));
    if (ce === 'Sides') { n = Math.max(3, Math.min(32, need(await c.getInt('Enter number of sides <4>:', { def: 4 })))); ce = need(await c.getPoint('Specify center point of base or [Sides]:')); }
    const q = need(await c.getPoint('Specify base radius:', { base: ce, preview: (pt) => { const r = G.dist(ce, pt), a = G.ang(ce, pt); return [{ type: 'LWPOLYLINE', closed: true, pts: [...Array(n).keys()].map((i) => ({ ...G.polar(ce, a + i * G.TAU / n, r), b: 0 })) }]; } }));
    const r = isPt(q) ? G.dist(ce, q) : +q, a0 = isPt(q) ? G.ang(ce, q) : Math.PI / n;
    const hh = need(await c.getDist('Specify height or [2Point/Axis endpoint/Top radius]:', { def: r * 2 }));
    const base = [...Array(n).keys()].map((i) => { const p = G.polar(ce, a0 + i * G.TAU / n, r); return [p.x, p.y, 0]; }), apex = [ce.x, ce.y, hh];
    let polys = [base.slice().reverse(), ...base.map((p, i) => [p, base[(i + 1) % n], apex])];
    if (hh < 0) polys = polys.map((f) => f.slice().reverse());
    meshSolid(polys); redraw();
  });
  R('TORUS', async (c) => {
    const ce = need(await c.getPoint('Specify center point or [3P/2P/Ttr]:'));
    const R1 = need(await c.getDist('Specify radius or [Diameter]:', { base: ce, preview: (q) => [{ type: 'CIRCLE', c: ce, r: G.dist(ce, q) }] }));
    const r2 = need(await c.getDist('Specify tube radius or [2Point/Diameter]:', { def: R1 / 4 }));
    const n = 36, m = 24, P = (i, j) => { const u = G.TAU * i / n, v = G.TAU * j / m, k = R1 + r2 * Math.cos(v); return [ce.x + k * Math.cos(u), ce.y + k * Math.sin(u), r2 * Math.sin(v)]; };
    const polys = []; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) polys.push([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]);
    meshSolid(polys); redraw();
  }, { alias: ['TOR'] });
  const profileOf = (e) => {
    if (e.type === 'CIRCLE') return [[{ ...G.polar(e.c, 0, e.r), b: 1 }, { ...G.polar(e.c, Math.PI, e.r), b: 1 }]];
    if (e.type === 'LWPOLYLINE' && e.closed) return [e.pts.map((p) => ({ x: p.x, y: p.y, b: p.b || 0 }))];
    if (e.type === 'REGION') return e.loops.map((l) => l.map((p) => ({ ...p })));
    if ((e.type === 'ELLIPSE' || e.type === 'SPLINE')) { const p = E.curvePoints(e); if (p.length > 2 && G.eq(p[0], p.at(-1), 1e-6)) return [p.slice(0, -1).map((q) => ({ x: q.x, y: q.y, b: 0 }))]; }
    return null;
  };
  R('EXTRUDE', async (c) => {
    const s = await c.select('Select objects to extrude or [MOde]:', { filter: (e) => !!profileOf(e) });
    if (!s.length) return;
    let hh = await c.getDist('Specify height of extrusion or [Direction/Path/Taper angle/Expression]:', { def: 10 });
    if (hh == null) return;
    let taper = 0;
    if (hh === 'Taper angle') { taper = need(await c.getAngle('Specify angle of taper for extrusion <0>:', { def: 0 })); hh = need(await c.getDist('Specify height of extrusion:', { def: 10 })); }
    if (typeof hh !== 'number') return;
    const d = doc(); d.begin('EXTRUDE');
    for (const e of s) {
      const prof = profileOf(e);
      let k = 1;
      if (taper) { const b = G.bbNew(); for (const p of ring(prof[0])) G.bbAdd(b, p); const rr = Math.min(b.x2 - b.x1, b.y2 - b.y1) / 2; k = Math.max(0, (rr - Math.tan(taper) * Math.abs(hh)) / rr); }
      d.add({ type: '3DSOLID', kind: 'extrude', prof, h: hh, taper: k, layer: e.layer, color: e.color, wp: e.wp || null });
      if (d.vars.DELOBJ !== 0) d.remove(e);
    }
    d.end(); redraw();
  }, { alias: ['EXT'] });
  R('REVOLVE', async (c) => {
    const s = await c.select('Select objects to revolve or [MOde]:', { filter: (e) => !!profileOf(e) });
    if (!s.length) return;
    const a1 = need(await c.getPoint('Specify axis start point or define axis by [Object/X/Y/Z] <Object>:'));
    const a2 = need(await c.getPoint('Specify axis endpoint:', { base: a1 }));
    const ang = need(await c.getAngle('Specify angle of revolution or [STart angle/Reverse/EXpression] <360>:', { def: G.TAU }));
    const d = doc(); d.begin('REVOLVE');
    for (const e of s) { d.add({ type: '3DSOLID', kind: 'revolve', prof: profileOf(e).slice(0, 1), axis: [a1, a2], ang: Math.abs(ang) < 1e-9 ? G.TAU : ang, layer: e.layer, color: e.color, wp: e.wp || null }); if (d.vars.DELOBJ !== 0) d.remove(e); }
    d.end(); redraw();
  }, { alias: ['REV3D'] });

  // ---------- exportación
  const triangles = async (ents) => {
    const ec = await earcut(), tris = [];
    for (const e of ents) {
      const m = meshLocal(e), W = e.wp && !P3.isWorld(e.wp) ? (p) => P3.toW(e.wp, { x: p[0], y: p[1], z: p[2] }) : null, t0 = tris.length;
      for (const f of m.f) for (let i = 1; i < f.length - 1; i++) tris.push([m.v[f[0]], m.v[f[i]], m.v[f[i + 1]]]);
      for (const cap of m.caps || []) {
        const all = [cap.outer, ...cap.holes], flat = [], holes = [], idx = [];
        for (const l of all) { if (l !== cap.outer) holes.push(idx.length); for (const k of l) { idx.push(k); flat.push(m.v[k][0], m.v[k][1]); } }
        const t = ec(flat, holes);
        const up = cap.z > (e.z0 || 0);
        for (let i = 0; i < t.length; i += 3) { const a = m.v[idx[t[i]]], b = m.v[idx[t[i + 1]]], cc = m.v[idx[t[i + 2]]]; const cr = (b[0] - a[0]) * (cc[1] - a[1]) - (b[1] - a[1]) * (cc[0] - a[0]); tris.push((cr > 0) === up ? [a, b, cc] : [a, cc, b]); }
      }
      if (W) for (let i = t0; i < tris.length; i++) tris[i] = tris[i].map(W);
    }
    return tris;
  };
  app.solidTriangles = triangles;
  const pickSolids = async (c) => { const s = await c.select('Select solids:', { filter: (e) => e.type === '3DSOLID' }); return s.length ? s : doc().model.filter((e) => e.type === '3DSOLID'); };
  R('STLOUT', async (c) => {
    const s = await pickSolids(c); if (!s.length) { c.print('No solids.'); return; }
    const tris = await triangles(s);
    const buf = new ArrayBuffer(84 + tris.length * 50), dv = new DataView(buf);
    const head = 'WebCAD Libre STL'; for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
    dv.setUint32(80, tris.length, true);
    tris.forEach((t, i) => {
      const o = 84 + i * 50, [a, b, cc] = t;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
      const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], L = Math.hypot(...n) || 1;
      [n[0] / L, n[1] / L, n[2] / L, ...a, ...b, ...cc].forEach((v, k) => dv.setFloat32(o + k * 4, v, true));
    });
    await app.io.deliver((doc().name.replace(/\.[^.]+$/, '') || 'solidos') + '.stl', buf, 'model/stl');
    c.print(`${tris.length} triangle(s) exported.`);
    app._lastStl = tris.length;
  }, { alias: ['EXPORTSTL', '3DPRINT'] });
  R('OBJOUT', async (c) => {
    const s = await pickSolids(c); if (!s.length) { c.print('No solids.'); return; }
    const tris = await triangles(s); const lines = ['# WebCAD Libre'];
    for (const t of tris) for (const p of t) lines.push(`v ${p[0]} ${p[1]} ${p[2]}`);
    for (let i = 0; i < tris.length; i++) lines.push(`f ${i * 3 + 1} ${i * 3 + 2} ${i * 3 + 3}`);
    await app.io.deliver((doc().name.replace(/\.[^.]+$/, '') || 'solidos') + '.obj', lines.join('\n'), 'text/plain');
  });

  // ---------- visor 3D
  const VS = { '2dWireframe': 'Estructura alámbrica 2D', Wireframe: 'Estructura alámbrica', Hidden: 'Oculto', Shaded: 'Sombreado', Realistic: 'Realista' };
  const viewer = (o = {}) => {
    if (o.dock && app.v3d?.dock) return app.v3d;
    if (!o.dock && app.v3d?.dock) { if (o.view) Object.assign(app.v3d.cam, o.view); app.v3d.draw(); return app.v3d; }
    let d = doc(); const host = app.view.host;
    document.getElementById('v3d')?.remove();
    const cv = h('canvas', { class: 'v3d-cv' });
    const style = h('select', { class: 'rcombo', onchange: () => { d.vars.VSCURRENT = style.value; draw(); } }, Object.entries(VS).filter(([k]) => k !== '2dWireframe').map(([k, l]) => h('option', { value: k, selected: k === (d.vars.VSCURRENT === '2dWireframe' ? 'Shaded' : d.vars.VSCURRENT), text: tr(l) })));
    const persp = h('input', { type: 'checkbox', checked: true, onchange: () => draw() });
    const flat = h('input', { type: 'checkbox', checked: true, onchange: () => draw() });
    const root = h('div', { id: 'v3d', class: 'v3d' }, cv,
      h('div', { class: 'v3d-bar' }, h('b', { text: tr('Vista 3D') }), h('span', { text: tr('Estilo visual') }), style, h('label', {}, persp, h('span', { text: tr('Perspectiva') })), h('label', {}, flat, h('span', { text: tr('Objetos 2D') })),
        h('button', { class: 'btn', type: 'button', text: tr('Extensión'), onclick: () => { auto = true; fit(); draw(); } }),
        h('button', { class: 'btn', type: 'button', text: tr('Renderizar'), onclick: () => render() }),
        o.dock ? '' : h('button', { class: 'btn pri', type: 'button', text: tr('Cerrar'), onclick: () => close() })),
      h('div', { class: 'v3d-hint', text: tr('Arrastrar: órbita · Botón derecho o central: encuadre · Rueda: zoom · Pulse una cara del cubo para orientar la vista') }));
    if (o.dock) { root.classList.add('dock'); host.after(root); } else host.append(root);
    let clouds = [], meshes = [], wires = [], rev = -1, auto = true;
    const load = () => {
      d = doc(); rev = d.rev;
      clouds = d.model.filter((e) => e.type === 'POINTCLOUD' && d.isVisible(e));
      meshes = d.model.filter((e) => e.type === '3DSOLID' && d.isVisible(e)).map((e) => ({ e, m: meshOf(e), col: colorOf(e) }));
      wires = [];
      for (const e of d.model) { if (e.type === '3DSOLID' || e.type === 'POINTCLOUD' || !d.isVisible(e)) continue; for (const p of E.prims(e, d)) { if (p.k === 'L') wires.push([[p.a.x, p.a.y, 0], [p.b.x, p.b.y, 0], colorOf(e)]); else { const pts = G.tessArc(p.c, p.r, p.full ? 0 : p.a1, p.full ? G.TAU - 1e-9 : p.a2, 24); for (let i = 1; i < pts.length; i++) wires.push([[pts[i - 1].x, pts[i - 1].y, 0], [pts[i].x, pts[i].y, 0], colorOf(e)]); } } if (wires.length > 60000) break; }
    };
    load();
    const cam = { az: G.rad(-60), el: G.rad(30), dist: 100, t: [0, 0, 0] };
    const bbox = () => { const b = { x1: Infinity, y1: Infinity, z1: Infinity, x2: -Infinity, y2: -Infinity, z2: -Infinity }; const ad = (x, y, z) => { b.x1 = Math.min(b.x1, x); b.x2 = Math.max(b.x2, x); b.y1 = Math.min(b.y1, y); b.y2 = Math.max(b.y2, y); b.z1 = Math.min(b.z1, z); b.z2 = Math.max(b.z2, z); }; for (const { m } of meshes) for (const v of m.v) ad(...v); if (flat.checked) for (const w of wires) { ad(...w[0]); ad(...w[1]); } for (const e of clouds) { const c = cloudData(d, e.cloud); if (c) { ad(c.bb.x1, c.bb.y1, c.bb.z1); ad(c.bb.x2, c.bb.y2, c.bb.z2); } } if (!isFinite(b.x1)) { b.x1 = b.y1 = b.z1 = -50; b.x2 = b.y2 = b.z2 = 50; } return b; };
    const fit = () => { const b = bbox(); cam.t = [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2, (b.z1 + b.z2) / 2]; cam.dist = Math.max(1, Math.hypot(b.x2 - b.x1, b.y2 - b.y1, b.z2 - b.z1)) * 1.15; };
    if (o.view) Object.assign(cam, o.view); fit();
    let W = 0, H = 0, r = window.devicePixelRatio || 1;
    const basis = () => { const ca = Math.cos(cam.az), sa = Math.sin(cam.az), ce = Math.cos(cam.el), se = Math.sin(cam.el); const fwd = [-ce * ca, -ce * sa, -se]; const right = [-sa, ca, 0]; const up = [right[1] * fwd[2] - right[2] * fwd[1], right[2] * fwd[0] - right[0] * fwd[2], right[0] * fwd[1] - right[1] * fwd[0]]; return { fwd, right, up }; };
    const proj = (B) => { const eye = [cam.t[0] - B.fwd[0] * cam.dist, cam.t[1] - B.fwd[1] * cam.dist, cam.t[2] - B.fwd[2] * cam.dist]; const f = Math.min(W, H) * 0.9; return (p) => { const q = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]]; const x = q[0] * B.right[0] + q[1] * B.right[1] + q[2] * B.right[2], y = q[0] * B.up[0] + q[1] * B.up[1] + q[2] * B.up[2], z = q[0] * B.fwd[0] + q[1] * B.fwd[1] + q[2] * B.fwd[2]; const k = persp.checked ? f / Math.max(1e-6, z) : f / cam.dist; return [W / 2 + x * k, H / 2 - y * k, z]; }; };
    function colorOf(e) { const L = d.layers[e.layer] || d.layers['0']; let c = e.color ?? 256; if (c === 256 || c === 0) c = L?.color ?? 7; const css = e.tc || (typeof c === 'string' ? c : aciCss(c, false)); return css; }
    const shade = (css, k) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(css) || /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(css); let [rr, gg, bb] = m ? (css.startsWith('rgb') ? [+m[1], +m[2], +m[3]] : [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]) : [200, 200, 200]; if (rr + gg + bb > 700 || rr + gg + bb < 60) { rr = gg = bb = 200; } return `rgb(${Math.round(rr * k)},${Math.round(gg * k)},${Math.round(bb * k)})`; };
    const draw = (ctx = cv.getContext('2d'), sc = r, ww = W, hh = H) => {
      const keepW = W, keepH = H; W = ww; H = hh;
      const vs = style.value, B = basis(), P = proj(B);
      ctx.setTransform(sc, 0, 0, sc, 0, 0);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      if (vs === 'Realistic') { g.addColorStop(0, '#d8e2ec'); g.addColorStop(1, '#8796a8'); } else { g.addColorStop(0, '#f4f6f8'); g.addColorStop(1, '#dfe4ea'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // rejilla del suelo
      const b = bbox(), span = Math.max(b.x2 - b.x1, b.y2 - b.y1, 10), stp = 10 ** Math.floor(Math.log10(span / 5));
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.08)';
      for (let x = Math.floor(b.x1 / stp) * stp - stp * 2; x <= b.x2 + stp * 2; x += stp) { const a = P([x, b.y1 - stp * 2, b.z1]), c2 = P([x, b.y2 + stp * 2, b.z1]); if (a[2] > 0 && c2[2] > 0) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke(); } }
      for (let y = Math.floor(b.y1 / stp) * stp - stp * 2; y <= b.y2 + stp * 2; y += stp) { const a = P([b.x1 - stp * 2, y, b.z1]), c2 = P([b.x2 + stp * 2, y, b.z1]); if (a[2] > 0 && c2[2] > 0) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(c2[0], c2[1]); ctx.stroke(); } }
      if (flat.checked) { ctx.lineWidth = 1; for (const [a, c2, col] of wires) { const A = P(a), C = P(c2); if (A[2] <= 0 || C[2] <= 0) continue; ctx.strokeStyle = shade(col, 0.8); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(C[0], C[1]); ctx.stroke(); } }
      // caras ordenadas por profundidad (algoritmo del pintor)
      const faces = [];
      const light = (() => { const l = [0.4, -0.3, 0.86]; const L = Math.hypot(...l); return l.map((v) => v / L); })();
      for (const { m, col } of meshes) {
        const pv = m.v.map(P);
        const pushFace = (idx, holes) => {
          const pts = idx.map((i) => m.v[i]); if (pts.length < 3) return;
          const a = pts[0], bq = pts[1], c2 = pts[2];
          let n = [0, 0, 0]; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); }
          const L = Math.hypot(...n) || 1; n = n.map((v) => v / L); void a; void bq; void c2;
          const z = idx.reduce((s, i) => s + pv[i][2], 0) / idx.length;
          if (idx.some((i) => pv[i][2] <= 0)) return;
          const facing = n[0] * B.fwd[0] + n[1] * B.fwd[1] + n[2] * B.fwd[2] < 0;
          faces.push({ idx, holes, pv, z, n, col, facing });
        };
        for (const f of m.f) pushFace(f);
        for (const cp of m.caps || []) pushFace(cp.outer, cp.holes);
      }
      faces.sort((x, y) => y.z - x.z);
      for (const f of faces) {
        if (vs !== 'Wireframe' && !f.facing) continue;
        ctx.beginPath(); f.idx.forEach((i, k) => (k ? ctx.lineTo(f.pv[i][0], f.pv[i][1]) : ctx.moveTo(f.pv[i][0], f.pv[i][1]))); ctx.closePath();
        for (const hl of f.holes || []) { hl.forEach((i, k) => (k ? ctx.lineTo(f.pv[i][0], f.pv[i][1]) : ctx.moveTo(f.pv[i][0], f.pv[i][1]))); ctx.closePath(); }
        if (vs === 'Shaded' || vs === 'Realistic') { const k = 0.35 + 0.65 * Math.max(0, f.n[0] * light[0] + f.n[1] * light[1] + f.n[2] * light[2]); ctx.fillStyle = shade(f.col, k); ctx.fill('evenodd'); if (vs === 'Realistic') { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.6; ctx.stroke(); } else { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke(); } }
        else if (vs === 'Hidden') { ctx.fillStyle = '#f2f4f6'; ctx.fill('evenodd'); ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.stroke(); }
        else { ctx.strokeStyle = shade(f.col, 0.8); ctx.lineWidth = 1; ctx.stroke(); }
      }
      // nubes de puntos
      for (const e of clouds) {
        const c = cloudData(d, e.cloud); if (!c) continue;
        const step = Math.max(1, Math.ceil(c.n / 150000)), zr = (c.bb.z2 - c.bb.z1) || 1, ps = (e.psize ?? 2);
        for (let k = 0; k < c.n; k += step) {
          const p = P([c.xyz[k * 3] + c.ox + (e.p?.x || 0), c.xyz[k * 3 + 1] + c.oy + (e.p?.y || 0), c.xyz[k * 3 + 2] + c.oz]); if (p[2] <= 0) continue;
          if (c.rgb && (e.cmode || 'rgb') === 'rgb') ctx.fillStyle = `rgb(${c.rgb[k * 3]},${c.rgb[k * 3 + 1]},${c.rgb[k * 3 + 2]})`; else { const [rr, gg, bb2] = ramp((c.xyz[k * 3 + 2] + c.oz - c.bb.z1) / zr); ctx.fillStyle = `rgb(${rr},${gg},${bb2})`; }
          ctx.fillRect(p[0] - ps / 2, p[1] - ps / 2, ps, ps);
        }
      }
      drawCube(ctx, B);
      W = keepW; H = keepH;
    };
    // ViewCube
    const CUBE = [['SUPERIOR', [0, 0, 1], G.rad(-90), G.rad(89.9)], ['INFERIOR', [0, 0, -1], G.rad(-90), G.rad(-89.9)], ['FRONTAL', [0, -1, 0], G.rad(-90), 0], ['POSTERIOR', [0, 1, 0], G.rad(90), 0], ['DERECHA', [1, 0, 0], 0, 0], ['IZQUIERDA', [-1, 0, 0], G.rad(180), 0]];
    let cubeHit = [];
    const drawCube = (ctx, B) => {
      const cx = W - 70, cy = 70, s = 28; cubeHit = [];
      const P3 = (p) => [cx + (p[0] * B.right[0] + p[1] * B.right[1] + p[2] * B.right[2]) * s, cy - (p[0] * B.up[0] + p[1] * B.up[1] + p[2] * B.up[2]) * s, p[0] * B.fwd[0] + p[1] * B.fwd[1] + p[2] * B.fwd[2]];
      const fs = CUBE.map(([name, n, az, el]) => {
        const u = n[0] ? [0, 1, 0] : [1, 0, 0], w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
        const corner = (a, b2) => [n[0] + u[0] * a + w[0] * b2, n[1] + u[1] * a + w[1] * b2, n[2] + u[2] * a + w[2] * b2];
        const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map(P3);
        const dot = n[0] * B.fwd[0] + n[1] * B.fwd[1] + n[2] * B.fwd[2];
        return { name, pts, dot, az, el, z: pts.reduce((a, p) => a + p[2], 0) / 4 };
      }).filter((f) => f.dot < 0).sort((a, b2) => b2.z - a.z);
      ctx.save(); ctx.font = '9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const f of fs) {
        ctx.beginPath(); f.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
        ctx.fillStyle = `rgba(235,240,246,${0.75 + 0.25 * -f.dot})`; ctx.fill(); ctx.strokeStyle = '#7f8b99'; ctx.lineWidth = 1; ctx.stroke();
        const m = f.pts.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
        if (-f.dot > 0.25) { ctx.fillStyle = '#334'; ctx.fillText(tr(f.name), m[0], m[1]); }
        cubeHit.push(f);
      }
      ctx.restore();
    };
    const resize = () => { r = window.devicePixelRatio || 1; W = root.clientWidth; H = root.clientHeight; cv.width = W * r; cv.height = H * r; draw(); };
    const ro = new ResizeObserver(resize); ro.observe(root);
    let drag = null;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      const rc = cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
      for (const f of cubeHit.slice().reverse()) if (G.ptInPoly({ x, y }, f.pts.map((p) => ({ x: p[0], y: p[1] })))) { cam.az = f.az; cam.el = f.el; draw(); return; }
      if (Math.hypot(x - (W - 70), y - 70) < 45) { cam.az = G.rad(-60); cam.el = G.rad(30); draw(); return; }
      drag = { x: e.clientX, y: e.clientY, b: e.button, az: cam.az, el: cam.el, t: cam.t.slice() }; cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (drag.b === 0 && !e.shiftKey) { cam.az = drag.az - dx * 0.01; cam.el = Math.max(-1.5699, Math.min(1.5699, drag.el + dy * 0.01)); }
      else { auto = false; const B = basis(), k = cam.dist / Math.min(W, H); cam.t = drag.t.map((v, i) => v - (B.right[i] * dx - B.up[i] * dy) * k); }
      draw();
    });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); auto = false; cam.dist *= Math.pow(1.0015, e.deltaY); draw(); }, { passive: false });
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    if (!o.dock) document.addEventListener('keydown', key, true);
    function close() { ro.disconnect(); document.removeEventListener('keydown', key, true); root.remove(); app.ui.cmdline?.focus?.(); app.v3d = null; if (o.dock) app.view.resize?.(); }
    // vista acoplada: se actualiza con cada cambio del dibujo
    const sync = () => { const dd = doc(); if (dd !== d || dd.rev !== rev) { const first = dd !== d; load(); if (first || auto) fit(); draw(); } };
    function render() {
      const c2 = document.createElement('canvas'), k = 2; c2.width = W * k; c2.height = H * k;
      const keep = style.value; if (keep === 'Wireframe' || keep === 'Hidden') style.value = 'Realistic';
      draw(c2.getContext('2d'), k, W, H); style.value = keep; draw();
      c2.toBlob((b) => app.io.deliver((d.name.replace(/\.[^.]+$/, '') || 'render') + '-render.png', b, 'image/png'), 'image/png');
    }
    app.v3d = { cam, draw, close, sync, fit, dock: !!o.dock, get meshes() { return meshes; }, faces: () => meshes.reduce((a, m) => a + m.m.f.length, 0), style };
    if (o.dock) app.view.resize?.();
    resize();
    return app.v3d;
  };
  app.view3d = viewer;
  app.meshOf = meshOf;
  // órbita en la ventana principal: arrastrar con el botón izquierdo (o Mayús + botón central en cualquier momento)
  R('3DORBIT', async (c) => {
    if (!app.view.cam) app.view.setCam(P3.SWISO);
    await c.ask({ kind: 'orbit', prompt: 'Press ESC or ENTER to exit. Drag to orbit; Shift+wheel button drags orbit at any time.' }).catch(() => {});
  }, { alias: ['3DO', 'ORBIT', '3DVIEW', 'VIEWCUBE', 'NAVVCUBE'], transparent: true, keepSel: true });
  // vistas predefinidas (ortogonales e isométricas) de la ventana principal
  const PRESETS = P3.PRESETS;
  app.view3dPreset = (k) => {
    if (!PRESETS[k]) return;
    if (app.v3d && !app.v3d.dock) app.v3d.close();
    app.view.setCam(k === 'Top' && P3.isWorld(doc().ext.wp) && !app.settings.ws3d ? null : P3.presetCam(k));
    app.view.zoomExtents();
  };
  R('VIEWPRESET', async (c, args) => {
    const k = args?.k || await c.getKw('Enter an option [Top/Bottom/Front/Back/Left/Right/SWiso/SEiso/NEiso/NWiso] <SWiso>:', 'SWiso'); if (k == null) return;
    app.view3dPreset(k);
  }, { alias: ['VISTA3D', '3DVISTA'] });
  for (const k of Object.keys(PRESETS)) R('VIEW' + k.toUpperCase(), (c) => eng.commands.VIEWPRESET.fn(c, { k }));
  // ---- plano de trabajo 3D (SCP 3D): los objetos nuevos se dibujan sobre él
  const setWp = (pl, c) => {
    const d = doc(), prev = d.ext.wp || null;
    d.begin('WORKPLANE'); d.touchTables?.();
    (d.ext.wpPrev ||= []).push(prev); if (d.ext.wpPrev.length > 10) d.ext.wpPrev.shift();
    d.ext.wp = pl && !P3.isWorld(pl) ? pl : null;
    d.end();
    app.view._pk = null;
    // plano visto de canto: se pasa a una vista isométrica para poder dibujar sobre él
    const P = app.view.P; if (P && Math.abs(P.det) < 0.05) app.view.setCam(P3.SWISO);
    redraw(); app.view.updateCursor?.(); app.view.redrawOverlay();
    const n = P3.normal(d.ext.wp || P3.WORLD), o = (d.ext.wp || P3.WORLD).o;
    c?.print(`Work plane: origin ${o.map((x) => G.fmt(x, 3)).join(',')}, normal ${n.map((x) => G.fmt(x, 3)).join(',')}.`);
  };
  app.setWorkPlane = setWp;
  R('WORKPLANE', async (c, args) => {
    const d = doc(), cur = d.ext.wp || P3.WORLD;
    const k = args?.k || await c.getKw('Enter an option [World/Top/Bottom/Front/Back/Left/Right/Origin/Elevation/X/Y/Z/3point/Object/View/Previous] <World>:', 'World');
    if (k == null) return;
    if (k === 'World') return setWp(null, c);
    if (P3.NAMED[k]) return setWp(P3.named(k, [...cur.o]), c);
    if (k === 'Previous') { const p = (d.ext.wpPrev || []).pop(); d.begin('WORKPLANE'); d.ext.wp = p || null; d.end(); app.view._pk = null; redraw(); return; }
    if (k === 'Origin') { const p = need(await c.getPoint('Specify new origin point <0,0,0>:', { def: { x: 0, y: 0 } })); return setWp(P3.plane(P3.toW(cur, isPt(p) ? p : { x: 0, y: 0 }), cur.u, cur.v), c); }
    if (k === 'Elevation') { const z = await c.getReal('Specify elevation along the Z axis <0>:', { def: 0 }); if (z == null) return; return setWp(P3.plane(P3.toW(cur, { x: 0, y: 0, z }), cur.u, cur.v), c); }
    if (k === 'X' || k === 'Y' || k === 'Z') { const a = await c.getReal(`Specify rotation angle about ${k} axis <90>:`, { def: 90 }); if (a == null) return; return setWp(P3.rotate(cur, k, a * Math.PI / 180), c); }
    if (k === '3point') {
      const p0 = need(await c.getPoint('Specify new origin point <0,0,0>:'));
      const p1 = need(await c.getPoint('Specify point on positive portion of X-axis:', { base: p0 }));
      const p2 = need(await c.getPoint('Specify point on positive-Y portion of the UCS XY plane:', { base: p0 }));
      const pl = P3.from3(P3.toW(cur, p0), P3.toW(cur, p1), P3.toW(cur, p2)); if (!pl) { c.print('The points are collinear.'); return; }
      return setWp(pl, c);
    }
    if (k === 'Object') { const s = await c.select('Select object to align UCS:', { single: true }); if (!s.length) return; return setWp(s[0].wp || null, c); }
    if (k === 'View') { const B = P3.basis(app.view.cam); return setWp(P3.plane([...cur.o], B.R, B.U), c); }
  }, { alias: ['PLANOTRABAJO', 'UCS3D', 'SCP3D'] });
  for (const k of ['World', 'Top', 'Front', 'Right', 'Left', 'Back', 'Bottom', 'Origin', 'Elevation', 'X', 'Y', 'Z', '3point', 'Object', 'View', 'Previous']) R('WP' + k.toUpperCase(), (c) => eng.commands.WORKPLANE.fn(c, { k }));
  R('VIEW3DPANEL', async () => { const s = app.settings; if (app.v3d?.dock) { s.dock3d = false; app.v3d.close(); } else { s.dock3d = true; viewer({ dock: true }); } app.saveSettings?.(); }, { alias: ['PANEL3D'] });
  R('VSCURRENT', async (c) => {
    const k = await c.getKw(`Enter an option [2dwireframe/Wireframe/Hidden/Realistic/Shaded] <${doc().vars.VSCURRENT}>:`, doc().vars.VSCURRENT); if (k == null) return;
    const v = { '2dwireframe': '2dWireframe' }[k] || k; doc().vars.VSCURRENT = v;
    if (app.v3d) app.v3d.style.value = v === '2dWireframe' ? 'Shaded' : v, app.v3d.draw();
    redraw();
  }, { alias: ['VS', 'SHADEMODE'] });
  R('RENDER', async () => { const v = viewer(); v.style.value = 'Realistic'; v.draw(); }, { alias: ['RR'] });

  // ---------- nubes de puntos
  const attachCloud = async (f, p = { x: 0, y: 0 }) => {
    let cl;
    try { cl = /\.las$/i.test(f.name) ? parseLAS(await f.arrayBuffer(), f.name) : parseCloud(await f.text(), f.name); } catch (err) { app.log(`${f.name}: ${err.message}`); return null; }
    if (!cl.n) { app.log(`${f.name}: no point data.`); return null; }
    const d = doc(); d.begin('POINTCLOUDATTACH'); d.touchTables();
    const id = f.name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
    d.ext.clouds[id] = cl;
    const e = d.add({ type: 'POINTCLOUD', cloud: id, p, sc: 1, psize: 2 });
    d.end(); app.view.zoomExtents(); redraw();
    app.log(`Point cloud "${f.name}": ${cl.n} points.`);
    return e;
  };
  app.attachCloud = attachCloud;
  app.cloudFromText = (name, text) => attachCloud({ name, text: async () => text });
  R('POINTCLOUDATTACH', async () => { const f = await app.io.pickFile('.xyz,.txt,.csv,.pts,.ply,.las'); if (f) await attachCloud(f); }, { alias: ['PCATTACH', 'POINTCLOUD'] });
  R('POINTCLOUDCOLORMAP', async (c) => {
    const s = await c.select('Select point cloud:', { filter: (e) => e.type === 'POINTCLOUD' }); if (!s.length) return;
    const k = await c.getKw('Enter color mode [Rgb/Elevation/Object] <Rgb>:', 'Rgb'); if (k == null) return;
    const d = doc(); d.begin('POINTCLOUDCOLORMAP'); for (const e of s) d.mod(e, (x) => (x.cmode = { Rgb: 'rgb', Elevation: 'z', Object: 'obj' }[k])); d.end(); redraw();
  });
  R('POINTCLOUDCROP', async (c) => {
    const r = need(await c.entsel('Select point cloud:', { filter: (e) => e.type === 'POINTCLOUD' }));
    const e = r.e, d = doc(), cl = cloudData(d, e.cloud); if (!cl) return;
    const a = need(await c.getPoint('Specify first corner:')), b = need(await c.getCorner('Specify opposite corner:', a));
    const k = await c.getKw('Keep points [Inside/Outside] <Inside>:', 'Inside'); if (k == null) return;
    const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x), y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y), s = e.sc || 1, o = e.p || { x: 0, y: 0 };
    const xyz = [], rgb = [];
    for (let i = 0; i < cl.n; i++) { const x = o.x + (cl.xyz[i * 3] + cl.ox) * s, y = o.y + (cl.xyz[i * 3 + 1] + cl.oy) * s; const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2; if (inside === (k === 'Inside')) { xyz.push(cl.xyz[i * 3] + cl.ox, cl.xyz[i * 3 + 1] + cl.oy, cl.xyz[i * 3 + 2] + cl.oz); if (cl.rgb) rgb.push(cl.rgb[i * 3], cl.rgb[i * 3 + 1], cl.rgb[i * 3 + 2]); } }
    const lines = []; for (let i = 0; i < xyz.length; i += 3) lines.push(cl.rgb ? `${xyz[i]} ${xyz[i + 1]} ${xyz[i + 2]} ${rgb[i]} ${rgb[i + 1]} ${rgb[i + 2]}` : `${xyz[i]} ${xyz[i + 1]} ${xyz[i + 2]}`);
    const nc = parseCloud(lines.join('\n'), cl.src.name);
    d.begin('POINTCLOUDCROP'); d.touchTables(); d.ext.clouds[e.cloud] = nc; d.mod(e, () => {}); d.end(); CLOUD.delete(e.cloud);
    c.print(`${nc.n} point(s) kept.`); redraw();
  });

  // ---------- geolocalización
  R('GEOGRAPHICLOCATION', async (c) => {
    const d = doc(), g = d.ext.geo || { lat: 43.25, lon: -8.35, dp: { x: 0, y: 0 }, north: 0, unit: 1, map: 'off' };
    const r = await app.ui.dlg.form('Ubicación geográfica', [
      { k: 'lat', l: 'Latitud (°, + norte)', v: g.lat, t: 'number' }, { k: 'lon', l: 'Longitud (°, + este)', v: g.lon, t: 'number' },
      { k: 'x', l: 'Punto de diseño X', v: g.dp.x, t: 'number' }, { k: 'y', l: 'Punto de diseño Y', v: g.dp.y, t: 'number' },
      { k: 'north', l: 'Ángulo del norte (°)', v: G.deg(g.north || 0), t: 'number' },
      { k: 'unit', l: 'Unidades del dibujo', v: g.unit, t: 'select', opts: [{ v: 1, l: 'Metros' }, { v: 0.001, l: 'Milímetros' }, { v: 0.01, l: 'Centímetros' }, { v: 1000, l: 'Kilómetros' }, { v: 0.3048, l: 'Pies' }] },
      { k: 'map', l: 'Mapa en línea', v: g.map || 'off', t: 'select', opts: [{ v: 'off', l: 'Desactivado' }, { v: 'road', l: 'Callejero (OpenStreetMap)' }, { v: 'aerial', l: 'Aéreo (Esri World Imagery)' }] },
    ]);
    if (!r) return;
    d.begin('GEOGRAPHICLOCATION'); d.touchTables();
    d.ext.geo = { lat: +r.lat, lon: +r.lon, dp: { x: +r.x, y: +r.y }, north: G.rad(+r.north || 0), unit: +r.unit || 1, map: r.map };
    d.end(); redraw();
  }, { alias: ['GEO', 'GEOLOCATION'] });
  R('GEOMAP', async (c) => {
    const d = doc(); if (!d.ext.geo) { c.print('The drawing is not geolocated. Use GEOGRAPHICLOCATION.'); return; }
    const k = await c.getKw('Enter an option [Aerial/Road/Off] <Road>:', 'Road'); if (k == null) return;
    d.begin('GEOMAP'); d.touchTables(); d.ext.geo.map = k === 'Off' ? 'off' : k === 'Aerial' ? 'aerial' : 'road'; d.end(); redraw();
  });
  R('GEOREMOVE', async () => { const d = doc(); d.begin('GEOREMOVE'); d.touchTables(); d.ext.geo = null; d.end(); redraw(); });
  R('GEOMARKLATLONG', async (c) => {
    const d = doc(); if (!d.ext.geo) { c.print('The drawing is not geolocated. Use GEOGRAPHICLOCATION.'); return; }
    const lat = need(await c.getReal('Latitude:')), lon = need(await c.getReal('Longitude:'));
    const p = latLonToGeo(d.ext.geo, lat, lon);
    d.add({ type: 'POINT', p }); d.add({ type: 'MTEXT', p: G.add(p, { x: 1, y: 1 }), h: d.vars.TEXTSIZE || 2.5, w: 0, text: `${lat.toFixed(6)}, ${lon.toFixed(6)}`, att: 7 });
    redraw();
  });
  R('GEOLATLONG', async (c) => { const d = doc(); if (!d.ext.geo) { c.print('The drawing is not geolocated. Use GEOGRAPHICLOCATION.'); return; } const p = need(await c.getPoint('Specify point:')); const g = geoToLatLon(d.ext.geo, p); c.print(`Latitude: ${g.lat.toFixed(7)}  Longitude: ${g.lon.toFixed(7)}`); }, { alias: ['LATLONG'] });
  app.geo = { toLatLon: (p) => geoToLatLon(doc().ext.geo, p), fromLatLon: (a, b) => latLonToGeo(doc().ext.geo, a, b) };
  // mapa de fondo (teselas de OpenStreetMap) y marcador de ubicación
  app.drawUnderlay = (ctx, view, v) => {
    const d = doc(), g = d.ext?.geo; if (!g || d.active !== 'Model') return;
    const r = view.dpr, bb = view.worldBB(v);
    view.setWorld(ctx, v);
    if (g.map === 'road' || g.map === 'aerial') {
      const mpp = (g.unit || 1) / v.s, cosl = Math.cos(G.rad(g.lat));
      const z = Math.max(0, Math.min(19, Math.round(Math.log2(156543.03 * cosl / mpp))));
      const corners = [[bb.x1, bb.y1], [bb.x2, bb.y1], [bb.x2, bb.y2], [bb.x1, bb.y2]].map(([x, y]) => geoToLatLon(g, { x, y }));
      const ts = corners.map((c) => tileXY(c.lat, c.lon, z));
      const tx1 = Math.floor(Math.min(...ts.map((t) => t.x))), tx2 = Math.floor(Math.max(...ts.map((t) => t.x))), ty1 = Math.floor(Math.min(...ts.map((t) => t.y))), ty2 = Math.floor(Math.max(...ts.map((t) => t.y)));
      if ((tx2 - tx1 + 1) * (ty2 - ty1 + 1) <= 80) {
        for (let tx = tx1; tx <= tx2; tx++) for (let ty = ty1; ty <= ty2; ty++) {
          const n = 2 ** z; if (ty < 0 || ty >= n) continue;
          const key = `${z}/${((tx % n) + n) % n}/${ty}`;
          let im = TILES.get(g.map + key);
          if (!im) { im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => view.redraw(); im.onerror = () => { im.bad = true; }; im.src = g.map === 'aerial' ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${key.split('/')[0]}/${key.split('/')[2]}/${key.split('/')[1]}` : `https://tile.openstreetmap.org/${key}.png`; TILES.set(g.map + key, im); }
          if (!im.complete || im.bad || !im.naturalWidth) continue;
          const nw = tileLatLon(tx, ty, z), ne = tileLatLon(tx + 1, ty, z), sw = tileLatLon(tx, ty + 1, z);
          const A = latLonToGeo(g, nw.lat, nw.lon), B = latLonToGeo(g, ne.lat, ne.lon), C = latLonToGeo(g, sw.lat, sw.lon);
          ctx.save(); ctx.transform((B.x - A.x) / 256, (B.y - A.y) / 256, (C.x - A.x) / 256, (C.y - A.y) / 256, A.x, A.y);
          ctx.globalAlpha = 0.85; ctx.drawImage(im, 0, 0, 256, 256); ctx.restore();
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = `${10 * r}px system-ui, sans-serif`; ctx.fillStyle = 'rgba(255,255,255,.8)';
      const txt = g.map === 'aerial' ? '© Esri, Maxar, Earthstar Geographics' : '© OpenStreetMap', tw = ctx.measureText(txt).width; ctx.fillRect(view.W * r - tw - 10 * r, view.H * r - 16 * r, tw + 8 * r, 14 * r); ctx.fillStyle = '#333'; ctx.fillText(txt, view.W * r - tw - 6 * r, view.H * r - 5 * r);
      view.setWorld(ctx, v);
    }
    if (d.vars.GEOMARKERVISIBILITY !== 0) {
      const p = g.dp || { x: 0, y: 0 }, k = 1 / v.s;
      ctx.fillStyle = '#e53935'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = k;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 7 * k, p.y + 14 * k); ctx.arc(p.x, p.y + 16 * k, 7 * k, Math.PI + 0.3, -0.3, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      // flecha del norte
      const nn = G.rotate({ x: 0, y: 1 }, { x: 0, y: 0 }, -(g.north || 0)), q = G.add(p, G.mul(nn, 40 * k));
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}
