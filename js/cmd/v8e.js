// v8 — archivos: importación SHP (con DBF) y GeoJSON, conversor DWG externo opcional.
import * as G from '../core/geom.js';
import { Cancel } from './engine.js';
import { pairsToLisp } from '../io/xdutil.js';
import { latLonToGeo } from './solid3d.js';

const need = (p) => { if (p == null) throw new Cancel(); return p; };

// ---------- shapefile (.shp) y tabla de atributos (.dbf)
export function parseSHP(buf) {
  const dv = new DataView(buf), out = [];
  if (dv.getInt32(0, false) !== 9994) throw new Error('No es un archivo SHP');
  let o = 100;
  while (o + 8 <= buf.byteLength) {
    const len = dv.getInt32(o + 4, false) * 2, c = o + 8; o = c + len;
    if (c + 4 > buf.byteLength) break;
    const st = dv.getInt32(c, true);
    if (st === 0) { out.push(null); continue; }
    const base = st % 10; // 1 punto, 3 línea, 5 polígono, 8 multipunto (Z: 11,13,15,18; M: 21,23,25,28)
    if (base === 1) out.push({ kind: 'point', pts: [[{ x: dv.getFloat64(c + 4, true), y: dv.getFloat64(c + 12, true) }]] });
    else if (base === 3 || base === 5) {
      const np = dv.getInt32(c + 36, true), n = dv.getInt32(c + 40, true), parts = [];
      for (let i = 0; i < np; i++) parts.push(dv.getInt32(c + 44 + i * 4, true));
      const p0 = c + 44 + np * 4, pts = [];
      for (let i = 0; i < n; i++) pts.push({ x: dv.getFloat64(p0 + i * 16, true), y: dv.getFloat64(p0 + i * 16 + 8, true) });
      out.push({ kind: base === 3 ? 'line' : 'poly', pts: parts.map((s, i) => pts.slice(s, i + 1 < np ? parts[i + 1] : n)) });
    } else if (base === 8) {
      const n = dv.getInt32(c + 36, true), pts = [];
      for (let i = 0; i < n; i++) pts.push([{ x: dv.getFloat64(c + 40 + i * 16, true), y: dv.getFloat64(c + 48 + i * 16, true) }]);
      out.push({ kind: 'point', pts });
    } else out.push(null);
  }
  return out;
}
export function parseDBF(buf) {
  const dv = new DataView(buf), n = dv.getUint32(4, true), hl = dv.getUint16(8, true), rl = dv.getUint16(10, true), fields = [];
  const dec = new TextDecoder('latin1');
  for (let o = 32; o < hl - 1 && dv.getUint8(o) !== 0x0d; o += 32) fields.push({ name: dec.decode(new Uint8Array(buf, o, 11)).replace(/\0.*$/, '').trim(), type: String.fromCharCode(dv.getUint8(o + 11)), len: dv.getUint8(o + 16) });
  const rows = [];
  for (let r = 0; r < n; r++) {
    let o = hl + r * rl + 1; const row = {};
    for (const f of fields) { const s = dec.decode(new Uint8Array(buf, o, f.len)).trim(); row[f.name] = f.type === 'N' || f.type === 'F' ? (s === '' ? null : +s) : s; o += f.len; }
    rows.push(row);
  }
  return rows;
}
// GeoJSON -> mismas geometrías que el SHP
export function parseGeoJSON(obj) {
  const feats = obj.type === 'FeatureCollection' ? obj.features : obj.type === 'Feature' ? [obj] : [{ type: 'Feature', geometry: obj, properties: {} }];
  const out = [];
  const P = (c) => ({ x: c[0], y: c[1] });
  for (const f of feats) {
    const g = f.geometry; if (!g) continue;
    const props = f.properties || {};
    const push = (kind, pts) => out.push({ kind, pts, props });
    if (g.type === 'Point') push('point', [[P(g.coordinates)]]);
    else if (g.type === 'MultiPoint') push('point', g.coordinates.map((c) => [P(c)]));
    else if (g.type === 'LineString') push('line', [g.coordinates.map(P)]);
    else if (g.type === 'MultiLineString') push('line', g.coordinates.map((l) => l.map(P)));
    else if (g.type === 'Polygon') push('poly', g.coordinates.map((l) => l.map(P)));
    else if (g.type === 'MultiPolygon') push('poly', g.coordinates.flat().map((l) => l.map(P)));
  }
  return out;
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const pickFiles = (accept) => new Promise((ok) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept; i.multiple = true; i.onchange = () => ok([...i.files]); i.click(); });

  // geometrías -> entidades (lon/lat se proyectan con la geolocalización del dibujo)
  const addGeoms = (geoms, name, o = {}) => {
    const d = doc();
    const all = geoms.filter(Boolean).flatMap((g) => g.pts.flat());
    const lonlat = o.lonlat ?? (all.length > 0 && all.every((p) => Math.abs(p.x) <= 180 && Math.abs(p.y) <= 90) && all.some((p) => p.x % 1 || p.y % 1));
    const T = lonlat ? (p) => latLonToGeo(d.ext.geo, p.y, p.x) : (p) => ({ x: p.x * (o.scale || 1), y: p.y * (o.scale || 1) });
    const layer = 'GIS_' + name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 30);
    d.begin('GISIMPORT'); d.touchTables(); d.ensureLayer(layer, { color: 3 });
    if (lonlat && !d.ext.geo) { const b = G.bbNew(); for (const p of all) G.bbAdd(b, p); d.ext.geo = { lat: (b.y1 + b.y2) / 2, lon: (b.x1 + b.x2) / 2, dp: { x: 0, y: 0 }, north: 0, unit: 1, map: 'off' }; }
    let n = 0;
    for (const g of geoms) {
      if (!g) continue;
      const attrs = g.props && Object.keys(g.props).length ? { GIS: pairsToLisp(Object.entries(g.props).slice(0, 40).map(([k, v]) => [1000, `${k}=${v ?? ''}`])) } : null;
      const base = { layer, ...(attrs ? { xd: attrs } : {}) };
      if (g.kind === 'point') for (const [p] of g.pts) { d.add({ type: 'POINT', p: T(p), ...base }); n++; }
      else for (const ring of g.pts) {
        let pts = ring.map(T); const closed = g.kind === 'poly';
        if (closed && pts.length > 2 && G.eq(pts[0], pts.at(-1), 1e-9)) pts = pts.slice(0, -1);
        if (pts.length < 2) continue;
        d.add({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ ...p, b: 0 })), closed, ...base }); n++;
      }
    }
    d.end(); return n;
  };
  app.importGeo = addGeoms; app.parseSHP = parseSHP; app.parseDBF = parseDBF; app.parseGeoJSON = parseGeoJSON;
  R('GISIMPORT', async (c) => {
    const files = await pickFiles('.shp,.dbf,.prj,.geojson,.json'); if (!files.length) return;
    for (const f of files.filter((x) => /\.(geo)?json$/i.test(x.name))) { const o = JSON.parse(await f.text()); const crs = o.crs?.properties?.name || ''; const n = addGeoms(parseGeoJSON(o), f.name, { lonlat: !crs || /4326|CRS84/i.test(crs) }); c.print(`${f.name}: ${n} object(s) imported.`); }
    for (const f of files.filter((x) => /\.shp$/i.test(x.name))) {
      const geoms = parseSHP(await f.arrayBuffer());
      const dbf = files.find((x) => x.name.replace(/\.dbf$/i, '').toLowerCase() === f.name.replace(/\.shp$/i, '').toLowerCase() && /\.dbf$/i.test(x.name));
      if (dbf) { const rows = parseDBF(await dbf.arrayBuffer()); geoms.forEach((g, i) => { if (g) g.props = rows[i] || {}; }); }
      const base = f.name.replace(/\.shp$/i, '').toLowerCase(), prj = files.find((x) => /\.prj$/i.test(x.name) && x.name.replace(/\.prj$/i, '').toLowerCase() === base);
      const wkt = prj ? await prj.text() : '';
      const n = addGeoms(geoms, f.name, wkt ? { lonlat: /^\s*GEOGCS/i.test(wkt) } : {}); c.print(`${f.name}: ${n} object(s) imported${dbf ? ' with attributes' : ''}.`);
    }
    app.view.zoomExtents(); redraw();
  }, { alias: ['MAPIMPORT', 'SHPIN', 'GEOJSONIN'] });

  // ---------- conversor DWG externo (servicio propio del usuario, p. ej. con ODA File Converter)
  R('DWGCONVERTER', async () => {
    const s = app.settings;
    const r = await app.ui.dlg.form('Conversor DWG externo (opcional)', [{ k: 'url', l: 'URL del servicio (POST con el DXF, devuelve DWG)', v: s.dwgConverter?.url || '' }, { k: 'ver', l: 'Versión DWG', v: s.dwgConverter?.ver || 'ACAD2018', t: 'select', opts: ['ACAD2018', 'ACAD2013', 'ACAD2010', 'ACAD2007', 'ACAD2004', 'ACAD2000'] }, { k: 'token', l: 'Clave de acceso (opcional)', v: s.dwgConverter?.token || '' }]);
    if (!r) return;
    s.dwgConverter = { url: r.url.trim(), ver: r.ver, token: r.token.trim() }; app.saveSettings?.();
  });
  R('DWGOUT', async (c) => {
    const cfg = app.settings.dwgConverter;
    if (!cfg?.url) { c.print('DWG writing needs an external converter service. Configure it with DWGCONVERTER (see tools/dwg-converter.md) or save as DXF 2000.'); return; }
    const dxf = app.io.content('dxf');
    try {
      const res = await fetch(cfg.url, { method: 'POST', headers: { 'Content-Type': 'application/dxf', 'X-Target-Version': cfg.ver || 'ACAD2018', ...(cfg.token ? { Authorization: 'Bearer ' + cfg.token } : {}) }, body: dxf });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      await app.io.deliver(doc().name.replace(/\.[^.]+$/, '') + '.dwg', blob, 'application/acad');
      c.print('DWG file created by the external converter.');
    } catch (err) { c.print(`DWG conversion failed: ${err.message}`); }
  }, { alias: ['SAVEDWG', 'EXPORTDWG'] });
  void need;
}
