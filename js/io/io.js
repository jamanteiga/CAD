// Archivos: abrir/guardar (DXF, DWG, nativo), importar, exportar PDF/PNG/SVG, recientes
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Doc } from '../core/document.js';
import { readDXF, writeDXF, setPatterns } from './dxf.js';
import { HATCHES, PAPER } from '../core/tables.js';
import { drawEnts } from '../view/renderer.js';
import { svgContext } from './svgctx.js';
setPatterns(HATCHES);

const JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function createIO(app) {
  const io = {};
  const log = (s) => app.log(s);
  let pendingHandle = null;

  io.pickFile = (accept = '') => new Promise((res) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => res(inp.files[0] || null);
    inp.addEventListener('cancel', () => res(null));
    inp.click();
  });

  // ---------- carga
  async function parseFile(f) {
    const nm = f.name, ext = nm.split('.').pop().toLowerCase();
    if (ext === 'dwg') {
      log('Cargando lector DWG (LibreDWG/WebAssembly)...');
      const { readDWG } = await import('./dwg.js');
      return readDWG(await f.arrayBuffer(), nm, log);
    }
    const text = await f.text();
    if (ext === 'wcad' || ext === 'json' || text.trimStart().startsWith('{')) { const d = new Doc(); d.load(JSON.parse(text)); d.name = nm.replace(/\.(wcad|json)$/i, '.dwg'); return d; }
    return readDXF(text, nm);
  }
  function adopt(d, f) {
    d.modified = false;
    app.addDoc(d);
    app.view.zoomExtents();
    const st = d.importStats;
    log(`${f ? f.name : d.name}: ${d.model.length} objetos en espacio modelo, ${Object.keys(d.blocks).length} bloques, ${Object.keys(d.layers).length} capas.`);
    if (st && Object.keys(st.unsupported).length) log('Objetos no soportados (omitidos): ' + Object.entries(st.unsupported).map(([k, v]) => `${k}×${v}`).join(', '));
  }
  io.open = async () => {
    let f = null;
    if (window.showOpenFilePicker && !io.inArtifact()) {
      try { const [h] = await window.showOpenFilePicker({ types: [{ description: 'Dibujos', accept: { 'application/octet-stream': ['.dwg', '.dxf', '.wcad'] } }] }); f = await h.getFile(); pendingHandle = /\.dwg$/i.test(f.name) ? null : h; }
      catch (_) { return; }
    } else f = await io.pickFile('.dwg,.dxf,.wcad,.json');
    if (!f) return;
    try { const d = await parseFile(f); d._fh = pendingHandle; pendingHandle = null; d._fmt = /\.wcad$/i.test(f.name) ? 'wcad' : 'dxf'; adopt(d, f); io.addRecent(f.name, app.doc.serialize()); }
    catch (e) { console.error(e); log('Error al abrir: ' + e.message); app.ui.dlg.alert('No se pudo abrir el archivo:\n' + e.message); }
  };
  io.openFile = async (f) => { try { const d = await parseFile(f); adopt(d, f); io.addRecent(f.name, app.doc.serialize()); } catch (e) { log('Error al abrir: ' + e.message); } };
  io.newDrawing = async () => {
    const n = (io._newN = (io._newN || 1) + 1);
    const d = new Doc(); d.reset(`Drawing${n}.dwg`);
    app.addDoc(d);
    app.view.setCur({ cx: 0, cy: 0, s: Math.min(app.view.W / 420, app.view.H / 297) || 2 });
  };
  io.importFile = async () => {
    const f = await io.pickFile('.dxf,.dwg,.wcad'); if (!f) return;
    const d = await parseFile(f);
    const doc = app.doc;
    doc.begin('IMPORT'); doc.touchTables();
    for (const [k, l] of Object.entries(d.layers)) if (!doc.layers[k]) doc.layers[k] = l;
    for (const [k, b] of Object.entries(d.blocks)) if (!doc.blocks[k]) doc.blocks[k] = b;
    for (const [k, l] of Object.entries(d.ltypes)) if (!doc.ltypes[k]) doc.ltypes[k] = l;
    for (const e of d.model) { delete e.hid; doc.add(e, doc.model); }
    doc.end();
    log(`${d.model.length} objetos importados de ${f.name}.`);
    app.view.zoomExtents();
  };
  io.importAsBlock = async (f) => {
    const d = await parseFile(f);
    const doc = app.doc;
    let name = f.name.replace(/\.[^.]+$/, '');
    doc.touchTables();
    for (const [k, l] of Object.entries(d.layers)) if (!doc.layers[k]) doc.layers[k] = l;
    for (const [k, b] of Object.entries(d.blocks)) if (!doc.blocks[k]) doc.blocks[k] = b;
    doc.blocks[name] = { name, base: { x: 0, y: 0 }, ents: d.model.map((e, i) => ({ ...e, bid: i })), params: [], _ver: 1 };
    return name;
  };

  // ---------- guardado
  io.inArtifact = () => !!(window.claude && typeof window.claude.use === 'function');
  async function deliver(filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    if (io.inArtifact()) {
      try {
        const dl = await window.claude.use('downloads');
        if (dl) {
          const ext = filename.split('.').pop().toLowerCase();
          const ok = ['pdf', 'png', 'svg', 'json', 'txt', 'zip', 'csv', 'jpg'].includes(ext);
          if (ok) { await dl.save({ filename, data: blob }); log(`Guardado: ${filename}`); return true; }
          const zip = await zipStore([{ name: filename, data: new Uint8Array(await blob.arrayBuffer()) }]);
          await dl.save({ filename: filename + '.zip', data: zip }); log(`Guardado: ${filename}.zip (contiene ${filename})`); return true;
        }
      } catch (e) { log('Descarga cancelada: ' + (e.message || e.code || e)); return false; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    log(`Guardado: ${filename}`);
    return true;
  }
  io.deliver = deliver;
  const baseName = () => app.doc.name.replace(/\.(dwg|dxf|wcad)$/i, '');
  const content = (fmt) => (fmt === 'wcad' ? app.doc.serialize() : writeDXF(app.doc, { paper: app.doc.layouts[0]?.ents.filter((e) => e.type !== 'VIEWPORT') }));
  io.save = async () => {
    const fh = app.doc._fh;
    if (fh && !io.inArtifact()) {
      try { const w = await fh.createWritable(); await w.write(content(app.doc._fmt || 'dxf')); await w.close(); app.doc.modified = false; log(`Guardado ${fh.name}`); app.ui?.setTitle?.(); io.addRecent(fh.name, app.doc.serialize()); return; }
      catch (e) { log('No se pudo guardar en el archivo original: ' + e.message); }
    }
    return io.saveAs(app.doc._fmt || null, !!app.doc._fmt);
  };
  io.saveAs = async (fmt, quick = false) => {
    if (!fmt || !quick) {
      if (!fmt) fmt = await app.ui.dlg.saveFormat(app.doc._fmt || 'dxf');
      if (!fmt) return;
    }
    if (fmt === 'dxf' || fmt === 'wcad') app.doc._fmt = fmt;
    const name = `${baseName()}.${fmt}`;
    if (window.showSaveFilePicker && !io.inArtifact()) {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: fmt === 'dxf' ? 'AutoCAD DXF (R12)' : 'Dibujo WebCAD', accept: { 'application/octet-stream': ['.' + fmt] } }] });
        const w = await h.createWritable(); await w.write(content(fmt)); await w.close(); app.doc._fh = h;
        app.doc.name = h.name.replace(/\.(dxf|wcad)$/i, '.dwg'); app.doc.modified = false; log(`Guardado ${h.name}`); app.ui?.setTitle?.(); io.addRecent(h.name, app.doc.serialize());
        return;
      } catch (e) { if (e.name === 'AbortError') return; }
    }
    if (await deliver(name, content(fmt), 'application/octet-stream')) { app.doc.modified = false; app.ui?.setTitle?.(); io.addRecent(name, app.doc.serialize()); }
  };
  io.exportEnts = async (ents, filename) => {
    const d = app.doc;
    const need = new Set(); const scan = (es) => { for (const e of es) if (e.type === 'INSERT' && !need.has(e.name) && d.blocks[e.name]) { need.add(e.name); scan(d.blocks[e.name].ents); } };
    scan(ents);
    const blocks = Object.fromEntries([...need].map((n) => [n, d.blocks[n]]));
    await deliver(filename, writeDXF(d, { ents, blocks }), 'application/dxf');
  };

  // ---------- recientes (IndexedDB)
  const idb = () => new Promise((res, rej) => { try { const r = indexedDB.open('webcad', 1); r.onupgradeneeded = () => r.result.createObjectStore('recent'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  io.addRecent = async (name, data) => {
    try {
      const db = await idb(); const tx = db.transaction('recent', 'readwrite');
      tx.objectStore('recent').put({ name, data, t: Date.now(), thumb: io.thumbnail() }, name);
      const s = app.settings; s.recent = [name, ...(s.recent || []).filter((x) => x !== name)].slice(0, 12);
      app.saveSettings?.();
    } catch (_) { /* almacenamiento no disponible */ }
  };
  io.listRecent = async () => {
    try { const db = await idb(); return await new Promise((res) => { const r = db.transaction('recent').objectStore('recent').getAll(); r.onsuccess = () => res((r.result || []).sort((a, b) => b.t - a.t)); r.onerror = () => res([]); }); } catch (_) { return []; }
  };
  io.openRecent = async (name) => {
    try {
      const db = await idb(); const rec = await new Promise((res) => { const r = db.transaction('recent').objectStore('recent').get(name); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
      if (!rec) return;
      const d = new Doc(); d.load(JSON.parse(rec.data)); d.name = name.replace(/\.(dxf|wcad|json)$/i, '.dwg').replace(/^~/, ''); adopt(d, { name });
    } catch (e) { log('No se pudo abrir: ' + e.message); }
  };
  io.autosave = async () => { if (!app.doc.modified || !app.doc.model.length) return; await io.addRecent('~' + app.doc.name.replace(/\.dwg$/i, '') + ' (autosave)', app.doc.serialize()); };
  io.thumbnail = () => { try { const c = document.createElement('canvas'); c.width = 240; c.height = 160; const ctx = c.getContext('2d'); ctx.drawImage(app.view.cv, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); } catch (_) { return null; } };

  // ---------- trazado (PDF / PNG / SVG)
  function plotSetup(o) {
    const d = app.doc;
    let w = o.w, h = o.h;
    if (o.landscape && h > w) [w, h] = [h, w];
    if (!o.landscape && w > h) [w, h] = [h, w];
    let bb, ents, paper = false;
    if (o.area === 'Layout' && d.active !== 'Model') { paper = true; const l = d.layout; bb = { x1: 0, y1: 0, x2: l.w, y2: l.h }; w = l.w; h = l.h; }
    else if (o.area === 'Window' && o.win) bb = o.win;
    else if (o.area === 'Display') bb = app.view.worldBB(app.view.views.Model);
    else bb = d.extents(d.model) || { x1: 0, y1: 0, x2: 100, y2: 100 };
    ents = d.model;
    const margin = paper ? 0 : 10;
    const bw = bb.x2 - bb.x1 || 1, bh = bb.y2 - bb.y1 || 1;
    let s = paper ? 1 : (o.fit ? Math.min((w - 2 * margin) / bw, (h - 2 * margin) / bh) : 1 / (o.scale || 1));
    const ox = paper ? 0 : (w - bw * s) / 2, oy = paper ? 0 : (h - bh * s) / 2;
    return { w, h, bb, s, ox, oy, ents, paper };
  }
  function renderPlot(ctx, ps, o, pxPerMm) {
    const d = app.doc;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, ps.w * pxPerMm, ps.h * pxPerMm);
    const k = pxPerMm * ps.s;
    const st = { px: k, bgDark: false, bg: '#fff', plotting: true, plotDpmm: pxPerMm, lwdisplay: 1, override: o.mono ? '#000' : null, viewBB: null };
    const setT = (scale, cx, cy) => ctx.setTransform(scale, 0, 0, -scale, cx, cy);
    if (ps.paper) {
      const l = d.layout;
      for (const vp of l.ents) if (vp.type === 'VIEWPORT' && vp.on !== false) {
        ctx.save(); setT(pxPerMm, 0, l.h * pxPerMm);
        ctx.beginPath(); ctx.rect(vp.c.x - vp.w / 2, vp.c.y - vp.h / 2, vp.w, vp.h); ctx.clip();
        const ms = pxPerMm * vp.scale;
        setT(ms, (vp.c.x - vp.vc.x * vp.scale) * pxPerMm, (l.h - vp.c.y + vp.vc.y * vp.scale) * pxPerMm);
        const frozen = new Set(vp.frozen || []);
        drawEnts(ctx, d.model.filter((e) => !frozen.has(e.layer)), d, { ...st, px: ms, ltk: d.vars.PSLTSCALE ? 1 / vp.scale : 1 });
        ctx.restore();
      }
      setT(pxPerMm, 0, l.h * pxPerMm);
      drawEnts(ctx, l.ents.filter((e) => e.type !== 'VIEWPORT'), d, { ...st, px: pxPerMm });
    } else {
      setT(k, (ps.ox - ps.bb.x1 * ps.s) * pxPerMm, (ps.h - ps.oy + ps.bb.y1 * ps.s) * pxPerMm);
      drawEnts(ctx, ps.ents, d, st);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  const loadScript = (src) => new Promise((res, rej) => { if ([...document.scripts].some((s) => s.src === src)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('No se pudo cargar ' + src)); document.head.append(s); });
  io.plotDialog = async () => {
    const o = await app.ui.dlg.plot(app.doc);
    if (!o) return;
    if (o.area === 'Window') {
      const a = await app.cmd.getPoint('Specify first corner:'); if (!a || typeof a !== 'object') return;
      const b = await app.cmd.getCorner('Specify opposite corner:', a); if (!b || typeof b !== 'object') return;
      o.win = { x1: Math.min(a.x, b.x), y1: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y) };
    }
    const [pw, ph] = PAPER[o.paper] || PAPER.A3;
    o.w = pw; o.h = ph;
    const ps = plotSetup(o);
    const dpmm = (o.dpi || 200) / 25.4;
    const cv = document.createElement('canvas'); cv.width = Math.round(ps.w * dpmm); cv.height = Math.round(ps.h * dpmm);
    renderPlot(cv.getContext('2d'), ps, o, dpmm);
    if (o.format === 'png') { const blob = await new Promise((r) => cv.toBlob(r, 'image/png')); return deliver(`${baseName()}-${app.doc.active}.png`, blob); }
    if (o.format === 'svg') return io.exportSVG(o);
    log('Generando PDF...');
    if (!window.jspdf) { try { await loadScript(new URL('./vendor/jspdf/jspdf.umd.min.js', document.baseURI).href); } catch (_) { await loadScript(JSPDF); } }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: ps.w > ps.h ? 'landscape' : 'portrait', unit: 'mm', format: [ps.w, ps.h], compress: true });
    pdf.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, ps.w, ps.h, undefined, 'FAST');
    pdf.setProperties({ title: app.doc.name, creator: 'WebCAD' });
    await deliver(`${baseName()}-${app.doc.active}.pdf`, pdf.output('blob'), 'application/pdf');
  };
  io.exportImage = async () => {
    const blob = await new Promise((r) => app.view.cv.toBlob(r, 'image/png'));
    await deliver(`${baseName()}.png`, blob, 'image/png');
  };
  io.exportSVG = async (o = {}) => {
    const d = app.doc;
    const bb = d.extents(d.model) || { x1: 0, y1: 0, x2: 100, y2: 100 };
    const w = bb.x2 - bb.x1, h = bb.y2 - bb.y1;
    const sc = svgContext(w, h);
    sc.setTransform(1, 0, 0, -1, -bb.x1, bb.y2);
    drawEnts(sc, d.model, d, { px: Math.max(1, 800 / Math.max(w, h)), bgDark: false, bg: '#fff', viewBB: null, override: o.mono ? '#000' : null });
    await deliver(`${baseName()}.svg`, sc.toSVG(), 'image/svg+xml');
  };
  void E; void G;
  return io;
}

// ---------- ZIP sin compresión (para descargas dentro del visor)
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export async function zipStore(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  }
  const csize = central.reduce((s, x) => s + x.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csize, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
