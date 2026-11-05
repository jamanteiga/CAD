// Referencias: imágenes ráster (IMAGEATTACH, IMAGECLIP, IMAGEADJUST, TRANSPARENCY, IMAGEFRAME),
// PDF como imagen (PDFATTACH) o como geometría (PDFIMPORT) e hipervínculos (HYPERLINK).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { t as T } from '../core/i18n.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };

// ---------- caché de imágenes (id -> HTMLImageElement)
const IMG = new Map();
let redrawSoon = null;
function imgOf(doc, id) {
  let im = IMG.get(id);
  if (!im) {
    const src = doc.ext?.images?.[id]?.data; if (!src) return null;
    im = new Image(); im.decoding = 'async';
    im.onload = () => { clearTimeout(redrawSoon); redrawSoon = setTimeout(() => globalThis.webcad?.view?.redraw?.(), 20); };
    im.src = src; IMG.set(id, im);
  }
  return im.complete && im.naturalWidth ? im : null;
}
// esquinas de la imagen (unidad -> mundo)
const uv = (e, s, t) => ({ x: e.p.x + e.u.x * s + e.v.x * t, y: e.p.y + e.u.y * s + e.v.y * t });
const frameLoop = (e) => (e.clipOn && e.clip?.length > 2 ? e.clip : [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]).map((q) => uv(e, q.x, q.y));
const toUnit = (e, p) => { const det = e.u.x * e.v.y - e.u.y * e.v.x || 1e-12, dx = p.x - e.p.x, dy = p.y - e.p.y; return { x: (dx * e.v.y - dy * e.v.x) / det, y: (e.u.x * dy - e.u.y * dx) / det }; };

E.GEN.IMAGE = {
  imgOf,
  pts: ['p'], vecs: ['u', 'v'],
  ents(e) { return [{ type: 'LWPOLYLINE', pts: frameLoop(e).map((p) => ({ ...p, b: 0 })), closed: true, layer: e.layer }]; },
  explode(e) { return [{ type: 'LWPOLYLINE', pts: frameLoop(e).map((p) => ({ ...p, b: 0 })), closed: true, layer: e.layer, color: e.color }]; },
  inside(e, p) { const q = toUnit(e, p); if (q.x < 0 || q.y < 0 || q.x > 1 || q.y > 1) return false; return !(e.clipOn && e.clip?.length > 2) || G.ptInPoly(q, e.clip); },
  snaps(e, push) { for (const p of frameLoop(e)) push(p, 'end'); push(e.p, 'ins'); },
  grips(e, add) { add(e.p, (x, p) => (x.p = p)); add(uv(e, 1, 1), (x, p) => { const k = G.dist(x.p, p) / Math.max(1e-9, G.dist(x.p, uv(x, 1, 1))); x.u = G.mul(x.u, k); x.v = G.mul(x.v, k); }); },
  draw(ctx, e, doc, st) {
    const im = imgOf(doc, e.img);
    const fr = doc.vars.IMAGEFRAME ?? 1;
    const loop = frameLoop(e);
    if (im && e.show !== false && !st.override) {
      ctx.save();
      ctx.beginPath(); loop.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.clip();
      ctx.transform(e.u.x, e.u.y, e.v.x, e.v.y, e.p.x, e.p.y);
      ctx.translate(0, 1); ctx.scale(1, -1);
      const b = e.bright ?? 50, c = e.contrast ?? 50, f = e.fade ?? 0;
      if (b !== 50 || c !== 50) ctx.filter = `brightness(${b * 2}%) contrast(${c * 2}%)`;
      if (f) ctx.globalAlpha *= 1 - f / 100;
      if (e.transp === false) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1, 1); }
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(im, 0, 0, 1, 1);
      ctx.restore();
    }
    if (fr === 1 || (fr === 2 && !st.plotting) || !im || st.override) {
      ctx.beginPath(); loop.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.stroke();
      if (!im) { ctx.beginPath(); ctx.moveTo(loop[0].x, loop[0].y); ctx.lineTo(loop[2].x, loop[2].y); ctx.stroke(); }
    }
  },
};

// ---------- pdf.js (carga diferida)
let PDFJS = null;
async function pdfjs() {
  if (PDFJS) return PDFJS;
  const base = new URL('../../vendor/pdfjs/', import.meta.url).href;
  PDFJS = await import(base + 'pdf.min.mjs');
  PDFJS.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
  return PDFJS;
}
export async function openPdf(buf) { const L = await pdfjs(); return L.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise; }
const PT2MM = 25.4 / 72;

// convierte una página PDF en entidades (trayectos -> polilíneas/sombreados, texto -> TEXT)
export async function pdfPageToEnts(page, o = {}) {
  const L = await pdfjs(), OPS = L.OPS, sc = (o.scale || 1) * PT2MM, view = page.view; // [x0,y0,x1,y1]
  const org = o.p || { x: 0, y: 0 };
  const ops = await page.getOperatorList();
  const out = [];
  let ctm = [1, 0, 0, 1, 0, 0]; const stack = [];
  let stroke = '#000000', fill = '#000000', lwPt = 1;
  let path = [], cur = null, start = null;
  const mulM = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  const P = (x, y) => { const X = ctm[0] * x + ctm[2] * y + ctm[4], Y = ctm[1] * x + ctm[3] * y + ctm[5]; return { x: org.x + (X - view[0]) * sc, y: org.y + (Y - view[1]) * sc }; };
  const hex = (a) => { if (typeof a[0] === 'string') return a[0]; const [r, g, b] = a.map((v) => Math.round(v > 1 ? v : v * 255)); return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''); };
  const sub = () => { if (cur && cur.length > 1) path.push({ pts: cur, closed: false }); cur = null; };
  const bez = (p0, p1, p2, p3) => { const n = 8, r = []; for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; r.push({ x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y }); } return r; };
  const tcOf = (c) => (/^#0{6}$/i.test(c) ? undefined : c);
  const emit = (doStroke, doFill) => {
    sub();
    for (const sp of path) {
      const pts = sp.pts.filter((p, i, a) => !i || !G.eq(p, a[i - 1], 1e-9));
      if (pts.length < 2) continue;
      if (doFill && o.fills !== false && pts.length > 2) {
        if (/^#f{6}$/i.test(fill) && !doStroke) continue; // fondos blancos
        out.push({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [pts.map((p) => ({ ...p, b: 0 }))], color: 256, ...(tcOf(fill) ? { tc: fill } : {}), layer: o.layer });
      }
      if (doStroke || !doFill) {
        if (pts.length === 2 && !sp.closed) out.push({ type: 'LINE', p1: pts[0], p2: pts[1], ...(tcOf(stroke) ? { tc: stroke } : {}), layer: o.layer });
        else out.push({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ ...p, b: 0 })), closed: !!sp.closed, ...(tcOf(stroke) ? { tc: stroke } : {}), layer: o.layer, ...(o.lw && lwPt > 0.3 ? { lw: Math.min(211, Math.round(lwPt * PT2MM * 100)) } : {}) });
      }
    }
    path = [];
  };
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i], a = ops.argsArray[i];
    switch (fn) {
      case OPS.save: stack.push([ctm, stroke, fill, lwPt]); break;
      case OPS.restore: if (stack.length) [ctm, stroke, fill, lwPt] = stack.pop(); break;
      case OPS.transform: ctm = mulM(ctm, a); break;
      case OPS.setLineWidth: lwPt = a[0] * Math.hypot(ctm[0], ctm[1]); break;
      case OPS.setStrokeRGBColor: stroke = hex(a); break;
      case OPS.setFillRGBColor: fill = hex(a); break;
      case OPS.setStrokeGray: stroke = hex([a[0], a[0], a[0]]); break;
      case OPS.setFillGray: fill = hex([a[0], a[0], a[0]]); break;
      case OPS.constructPath: {
        const [opl, args] = a; let k = 0;
        for (const op of opl) {
          if (op === OPS.moveTo) { sub(); const p = P(args[k++], args[k++]); cur = [p]; start = p; }
          else if (op === OPS.lineTo) { const p = P(args[k++], args[k++]); (cur ||= [start || p]).push(p); }
          else if (op === OPS.curveTo) { const p1 = P(args[k++], args[k++]), p2 = P(args[k++], args[k++]), p3 = P(args[k++], args[k++]); cur ||= [p1]; cur.push(...bez(cur.at(-1), p1, p2, p3)); }
          else if (op === OPS.curveTo2) { const p2 = P(args[k++], args[k++]), p3 = P(args[k++], args[k++]); cur ||= [p2]; const p0 = cur.at(-1); cur.push(...bez(p0, p0, p2, p3)); }
          else if (op === OPS.curveTo3) { const p1 = P(args[k++], args[k++]), p3 = P(args[k++], args[k++]); cur ||= [p1]; cur.push(...bez(cur.at(-1), p1, p3, p3)); }
          else if (op === OPS.rectangle) { sub(); const x = args[k++], y = args[k++], w = args[k++], hh = args[k++]; path.push({ pts: [P(x, y), P(x + w, y), P(x + w, y + hh), P(x, y + hh)], closed: true }); }
          else if (op === OPS.closePath) { if (cur && cur.length > 1) { path.push({ pts: cur, closed: true }); start = cur[0]; } cur = null; }
        }
        break;
      }
      case OPS.stroke: emit(true, false); break;
      case OPS.closeStroke: if (cur) { path.push({ pts: cur, closed: true }); cur = null; } emit(true, false); break;
      case OPS.fill: case OPS.eoFill: emit(false, true); break;
      case OPS.fillStroke: case OPS.eoFillStroke: case OPS.closeFillStroke: case OPS.closeEOFillStroke: emit(true, true); break;
      case OPS.endPath: path = []; cur = null; break;
      default: break;
    }
  }
  if (o.text !== false) {
    const tc = await page.getTextContent();
    // une los fragmentos contiguos de una misma línea de texto
    const runs = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      const [a, b, , , x, y] = it.transform, size = Math.hypot(a, b), rot = Math.atan2(b, a);
      const r = runs.at(-1);
      if (r && Math.abs(r.rot - rot) < 1e-3 && Math.abs((y - r.y) * Math.cos(rot) - (x - r.x) * Math.sin(rot)) < size * 0.3) {
        const along = (x - r.x) * Math.cos(rot) + (y - r.y) * Math.sin(rot), gap = along - r.w;
        if (gap > -size * 0.3 && gap < size * 1.2) { r.str += (gap > size * 0.15 && !/\s$/.test(r.str) && !/^\s/.test(it.str) ? ' ' : '') + it.str; r.w = along + (it.width || it.str.length * size * 0.5); continue; }
      }
      runs.push({ x, y, size, rot, str: it.str, w: it.width || it.str.length * size * 0.5 });
    }
    for (const r of runs) {
      if (!r.str.trim()) continue;
      out.push({ type: 'TEXT', p: { x: org.x + (r.x - view[0]) * sc, y: org.y + (r.y - view[1]) * sc }, h: r.size * sc * 0.72, rot: r.rot, text: r.str.trim(), layer: o.layer });
    }
  }
  return out;
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const readUrl = (f) => new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(f); });
  const loadImg = (src) => new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ko(new Error('imagen no válida')); im.src = src; });
  const newImageDef = (name, data, w, h, extra = {}) => {
    const d = doc(); d.touchTables();
    const id = (name || 'img').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
    d.ext.images[id] = { name, data, w, h, ...extra };
    return id;
  };
  // inserta una imagen con punto, escala y rotación (preguntas de IMAGEATTACH)
  const placeImage = async (c, id, wpx, hpx, defW) => {
    const p = need(await c.getPoint('Specify insertion point <0,0>:', { def: { x: 0, y: 0 } }));
    const ins = isPt(p) ? p : { x: 0, y: 0 };
    const mk = (W, rot = 0) => { const k = W / wpx; return { type: 'IMAGE', p: ins, u: G.mul({ x: Math.cos(rot), y: Math.sin(rot) }, wpx * k), v: G.mul({ x: -Math.sin(rot), y: Math.cos(rot) }, hpx * k), img: id, transp: true }; };
    const W = need(await c.getDist(`Specify scale factor or [Unit] <${G.fmt(defW, 4)}>:`, { base: ins, def: defW, preview: (q) => [mk(G.dist(ins, q))] }));
    const rot = need(await c.getAngle('Specify rotation angle <0>:', { base: ins, def: 0, preview: (q) => [mk(W, G.ang(ins, q))] }));
    const e = doc().add(mk(typeof W === 'number' ? W : defW, typeof rot === 'number' ? rot : 0));
    app.view.redraw(); return e;
  };
  R('IMAGEATTACH', async (c) => {
    const f = await app.io.pickFile('image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg'); if (!f) return;
    const data = await readUrl(f); const im = await loadImg(data);
    const d = doc(); d.begin('IMAGEATTACH');
    try {
      const id = newImageDef(f.name, data, im.naturalWidth, im.naturalHeight);
      c.print(`Image "${f.name}": ${im.naturalWidth} x ${im.naturalHeight} px`);
      await placeImage(c, id, im.naturalWidth, im.naturalHeight, im.naturalWidth > 0 ? Math.max(1, im.naturalWidth / 10) : 100);
    } finally { d.end(); }
  }, { alias: ['IAT', 'IMAGE', 'IM'] });
  // inserción programática (arrastrar y soltar, LISP, pruebas)
  app.attachImage = async (name, data, p = { x: 0, y: 0 }, width = null) => {
    const im = await loadImg(data); const d = doc(); d.begin('IMAGEATTACH');
    const id = newImageDef(name, data, im.naturalWidth, im.naturalHeight);
    const W = width || im.naturalWidth / 10, k = W / im.naturalWidth;
    const e = d.add({ type: 'IMAGE', p, u: { x: W, y: 0 }, v: { x: 0, y: im.naturalHeight * k }, img: id, transp: true });
    d.end(); app.view.redraw(); return e;
  };
  const pickImage = async (c, prompt = 'Select image to clip:') => need(await c.entsel(prompt, { filter: (e) => e.type === 'IMAGE', filterMsg: 'Object is not an image.' })).e;
  R('IMAGECLIP', async (c) => {
    const e = await pickImage(c);
    const k = await c.getKw('Enter image clipping option [ON/OFF/Delete/New boundary] <New boundary>:', 'New boundary'); if (k == null) return;
    const d = doc();
    if (k === 'ON' || k === 'OFF') { d.begin('IMAGECLIP'); d.mod(e, (x) => (x.clipOn = k === 'ON')); d.end(); app.view.redraw(); return; }
    if (k === 'Delete') { d.begin('IMAGECLIP'); d.mod(e, (x) => { delete x.clip; x.clipOn = false; }); d.end(); app.view.redraw(); return; }
    const t = await c.getKw('Enter clipping type [Polygonal/Rectangular] <Rectangular>:', 'Rectangular'); if (t == null) return;
    let pts = [];
    if (t === 'Rectangular') {
      const a = need(await c.getPoint('Specify first corner point:')), b = need(await c.getCorner('Specify opposite corner point:', a));
      pts = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }];
    } else {
      pts.push(need(await c.getPoint('Specify first point:')));
      for (;;) { const q = await c.getPoint('Specify next point or [Undo]:', { base: pts.at(-1), preview: (q) => [{ type: 'LWPOLYLINE', pts: [...pts, q].map((p) => ({ ...p, b: 0 })), closed: true }] }); if (!isPt(q)) { if (q === 'Undo') { pts.pop(); continue; } break; } pts.push(q); }
      if (pts.length < 3) return;
    }
    d.begin('IMAGECLIP'); d.mod(e, (x) => { x.clip = pts.map((p) => toUnit(x, p)); x.clipOn = true; }); d.end(); app.view.redraw();
  }, { alias: ['ICL'] });
  R('IMAGEADJUST', async (c) => {
    const s = await c.select('Select image(s):', { filter: (e) => e.type === 'IMAGE' }); if (!s.length) return;
    const e0 = s[0];
    const r = await app.ui.dlg.form('Ajustar imagen', [{ k: 'bright', l: 'Brillo (0-100)', v: e0.bright ?? 50, t: 'number' }, { k: 'contrast', l: 'Contraste (0-100)', v: e0.contrast ?? 50, t: 'number' }, { k: 'fade', l: 'Atenuación (0-100)', v: e0.fade ?? 0, t: 'number' }]);
    if (!r) return;
    const cl = (v) => Math.max(0, Math.min(100, +v));
    const d = doc(); d.begin('IMAGEADJUST'); for (const e of s) d.mod(e, (x) => { x.bright = cl(r.bright); x.contrast = cl(r.contrast); x.fade = cl(r.fade); }); d.end(); app.view.redraw();
  }, { alias: ['IAD'] });
  R('TRANSPARENCY', async (c) => {
    const s = await c.select('Select image(s):', { filter: (e) => e.type === 'IMAGE' }); if (!s.length) return;
    const k = await c.getKw(`Enter transparency mode [ON/OFF] <${s[0].transp === false ? 'OFF' : 'ON'}>:`, s[0].transp === false ? 'OFF' : 'ON'); if (k == null) return;
    const d = doc(); d.begin('TRANSPARENCY'); for (const e of s) d.mod(e, (x) => (x.transp = k === 'ON')); d.end(); app.view.redraw();
  });
  R('IMAGEFRAME', async (c) => {
    const v = await c.getInt(`Enter new value for IMAGEFRAME <${doc().vars.IMAGEFRAME ?? 1}>:`, { def: doc().vars.IMAGEFRAME ?? 1 }); if (v == null) return;
    doc().setvar('IMAGEFRAME', Math.max(0, Math.min(2, v))); app.view.redraw();
  });
  R('IMAGEQUALITY', async (c) => { await c.getKw('Enter image quality setting [High/Draft] <High>:', 'High'); });

  // ---------- PDF
  const askPage = async (pdf) => {
    if (pdf.numPages === 1) return 1;
    const r = await app.ui.dlg.form('Adjuntar PDF', [{ k: 'n', l: `${tr('Página')} (1-${pdf.numPages})`, v: 1, t: 'number' }]);
    return r ? Math.max(1, Math.min(pdf.numPages, Math.round(+r.n || 1))) : null;
  };
  R('PDFATTACH', async (c) => {
    const f = await app.io.pickFile('.pdf,application/pdf'); if (!f) return;
    let pdf; try { pdf = await openPdf(await f.arrayBuffer()); } catch (err) { c.print(`${f.name}: ${err.message}`); return; }
    const n = await askPage(pdf); if (!n) return;
    const page = await pdf.getPage(n), vp = page.getViewport({ scale: 150 / 72 });
    const cv = document.createElement('canvas'); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: cx, viewport: vp }).promise;
    const data = cv.toDataURL('image/png');
    const wmm = page.view[2] - page.view[0], hmm = page.view[3] - page.view[1];
    const d = doc(); d.begin('PDFATTACH');
    try {
      const id = newImageDef(`${f.name} (${n})`, data, cv.width, cv.height, { pdf: true });
      c.print(`PDF "${f.name}", page ${n}: ${G.fmt(wmm * PT2MM, 1)} x ${G.fmt(hmm * PT2MM, 1)} mm`);
      await placeImage(c, id, cv.width, cv.height, wmm * PT2MM);
    } finally { d.end(); }
  }, { alias: ['PDFATT'] });
  R('PDFIMPORT', async (c) => {
    const f = await app.io.pickFile('.pdf,application/pdf'); if (!f) return;
    let pdf; try { pdf = await openPdf(await f.arrayBuffer()); } catch (err) { c.print(`${f.name}: ${err.message}`); return; }
    const n = await askPage(pdf); if (!n) return;
    const r = await app.ui.dlg.form('Importar PDF', [{ k: 'scale', l: 'Escala', v: 1, t: 'number' }, { k: 'fills', l: 'Rellenos sólidos', v: true, t: 'check' }, { k: 'text', l: 'Texto TrueType', v: true, t: 'check' }, { k: 'lw', l: 'Grosores de línea', v: true, t: 'check' }, { k: 'layer', l: 'Capa', v: 'PDF_' + f.name.replace(/\.pdf$/i, '').replace(/[^\w-]+/g, '_').slice(0, 24) }]);
    if (!r) return;
    const p = need(await c.getPoint('Specify insertion point <0,0>:', { def: { x: 0, y: 0 } }));
    const page = await pdf.getPage(n);
    const ents = await pdfPageToEnts(page, { p: isPt(p) ? p : { x: 0, y: 0 }, scale: +r.scale || 1, fills: r.fills, text: r.text, lw: r.lw, layer: r.layer });
    const d = doc(); d.begin('PDFIMPORT'); d.touchTables(); d.ensureLayer(r.layer, {});
    for (const e of ents) d.add(e);
    d.end(); c.print(`${ents.length} object(s) imported.`); app.view.zoomExtents?.(); app.view.redraw();
  }, { alias: ['PDFI'] });
  app.pdfPageToEnts = pdfPageToEnts; app.openPdf = openPdf;

  // ---------- HIPERVÍNCULOS
  R('HYPERLINK', async (c) => {
    const s = await c.select('Select objects:'); if (!s.length) return;
    const r = await app.ui.dlg.form('Insertar hipervínculo', [{ k: 'url', l: 'Escriba el nombre de archivo o la página web', v: s[0].url || 'https://' }, { k: 'desc', l: 'Texto que se mostrará', v: s[0].urlDesc || '' }]);
    if (!r) return;
    const d = doc(); d.begin('HYPERLINK');
    for (const e of s) d.mod(e, (x) => { if (r.url && r.url !== 'https://') { x.url = r.url.trim(); x.urlDesc = r.desc || undefined; } else { delete x.url; delete x.urlDesc; } });
    d.end(); c.print(`${s.length} object(s) with hyperlink.`);
  }, { alias: ['HL'] });
  R('-HYPERLINK', async (c) => {
    const k = await c.getKw('Enter an option [Remove/Insert] <Insert>:', 'Insert'); if (k == null) return;
    const s = await c.select('Select objects:'); if (!s.length) return;
    const d = doc();
    if (k === 'Remove') { d.begin('HYPERLINK'); for (const e of s) d.mod(e, (x) => { delete x.url; delete x.urlDesc; }); d.end(); c.print(`${s.length} hyperlink(s) removed.`); return; }
    const url = need(await c.getString('Enter hyperlink <current drawing>:', { spaces: true }));
    const desc = await c.getString('Enter display text:', { spaces: true });
    d.begin('HYPERLINK'); for (const e of s) d.mod(e, (x) => { x.url = url; if (desc) x.urlDesc = desc; }); d.end();
  });
  const openUrl = (e) => {
    if (!e?.url) return false;
    if (/^#/.test(e.url) || (!/^[a-z]+:/i.test(e.url) && doc().views?.[e.url])) { const v = doc().views[e.url.replace(/^#/, '')]; if (v) { app.view.setCur({ ...app.view.cur, cx: v.cx, cy: v.cy, s: v.s }); app.view.redraw(); return true; } }
    window.open(e.url, '_blank', 'noopener'); return true;
  };
  app.openHyperlink = openUrl;
  R('HYPERLINKOPEN', async (c) => { const r = need(await c.entsel('Select object with hyperlink:', { filter: (e) => !!e.url, filterMsg: 'Object has no hyperlink.' })); openUrl(r.e); }, { alias: ['OPENURL', 'GOTOURL'] });
}
