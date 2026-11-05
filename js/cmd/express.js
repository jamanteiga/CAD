// Herramientas extra (como las «Express Tools»): bloques, texto, dibujo, datos extendidos y anotación.
// BURST, BLOCKREPLACE, XLIST, ATTOUT, ATTIN, TXT2MTXT, TCOUNT, TCIRCLE, BREAKLINE, XDATA, XDLIST, CENTERMARK, CENTERLINE.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { parseCSV, toCSV } from '../core/table.js';

const need = (v) => { if (v == null || v === '') throw new Cancel(); return v; };
const isPt = (p) => p && typeof p === 'object' && 'x' in p;

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const dlg = () => app.ui.dlg;
  const redraw = () => app.view.redraw();

  // ---- bloques
  R('BURST', async (c) => { // descomponer conservando el valor de los atributos (como texto)
    const s = (await c.select('Select objects:')).filter((e) => e.type === 'INSERT');
    const d = doc(); d.begin('BURST'); let n = 0;
    for (const e of s) { const parts = E.explodeEnt(e, d); if (!parts) continue; const arr = d.ownerOf(e); for (const p of parts) d.add(p, arr); d.remove(e, arr); n++; }
    d.end(); c.print(`${n} block(s) exploded.`); redraw();
  });
  R('BLOCKREPLACE', async () => {
    const d = doc(), names = Object.keys(d.blocks).filter((n) => !n.startsWith('*')).sort();
    if (names.length < 2) { app.log('The drawing needs at least two blocks.'); return; }
    const r = await dlg().form('Reemplazar bloque', [{ k: 'from', l: 'Bloque que se reemplaza', v: names[0], t: 'select', opts: names }, { k: 'to', l: 'Bloque nuevo', v: names[1], t: 'select', opts: names }, { k: 'purge', l: 'Limpiar el bloque reemplazado', v: true, t: 'check' }]);
    if (!r || r.from === r.to) return;
    d.begin('BLOCKREPLACE'); let n = 0;
    for (const e of d.allEntsDeep()) if (e.type === 'INSERT' && e.name === r.from) { d.touch(e); e.name = r.to; const b = d.blocks[r.to]; if (b.params?.length) e.dyn = E.dynDefaults(b); else delete e.dyn; if (app.blocks?.attribsFor) { const vals = Object.fromEntries((e.attribs || []).map((a) => [a.tag, a.text])); e.attribs = app.blocks.attribsFor(r.to, e, vals); if (!e.attribs.length) delete e.attribs; } E.invalidate(e); n++; }
    if (r.purge) { d.touchTables(); delete d.blocks[r.from]; }
    d.end(); app.log(`${n} block reference(s) replaced.`); redraw();
  });
  R('XLIST', async (c) => {
    const r = need(await c.entsel('Select object:'));
    const e = r.e, d = doc();
    const lay = d.layerOf(e);
    const col = e.color == null || e.color === 256 ? 'BYLAYER' : e.color === 0 ? 'BYBLOCK' : String(e.color);
    c.print(`Object: ${e.type}${e.type === 'INSERT' ? ` (${e.name})` : ''}\nLayer: ${e.layer || '0'}\nColor: ${col}  (layer: ${lay.color})\nLinetype: ${e.ltype || 'BYLAYER'}  (layer: ${lay.ltype})\nHandle: ${e.hid || '-'}`);
    app.ui.cmdline.expand(true);
  });
  R('ATTOUT', async (c) => {
    const s = (await c.select('Select objects:')).filter((e) => e.type === 'INSERT' && e.attribs?.length);
    if (!s.length) { c.print('No blocks with attributes selected.'); return; }
    const tags = [...new Set(s.flatMap((e) => e.attribs.map((a) => a.tag)))];
    const rows = [['HANDLE', 'BLOCKNAME', ...tags], ...s.map((e) => ["'" + e.hid, e.name, ...tags.map((t) => e.attribs.find((a) => a.tag === t)?.text ?? '<>')])];
    await app.io.deliver((doc().name.replace(/\.(dwg|dxf|wcad)$/i, '') || 'atributos') + '.txt', toCSV(rows, '\t'), 'text/plain');
    c.print(`${s.length} block(s) exported.`);
  });
  R('ATTIN', async (c) => {
    const f = await app.io.pickFile('.txt,.csv,.tsv'); if (!f) return;
    const text = await f.text(); const sep = text.includes('\t') ? '\t' : text.includes(';') ? ';' : ',';
    const rows = text.split(/\r?\n/).filter((l) => l.trim()).map((l) => l.split(sep).map((x) => x.replace(/^"|"$/g, '')));
    if (rows.length < 2 || rows[0][0].toUpperCase() !== 'HANDLE') { c.print('The file must start with HANDLE and BLOCKNAME columns.'); return; }
    const head = rows[0], d = doc(); d.begin('ATTIN'); let n = 0;
    for (const r of rows.slice(1)) {
      const e = d.findHandle(r[0].replace(/^'/, '')); if (!e || e.type !== 'INSERT') continue;
      d.touch(e);
      head.forEach((t, i) => { if (i < 2) return; const a = e.attribs?.find((x) => x.tag === t); if (a && r[i] != null && r[i] !== '<>') a.text = r[i]; });
      E.invalidate(e); n++;
    }
    d.end(); c.print(`${n} block(s) updated.`); redraw();
    void parseCSV;
  });

  // ---- texto
  R('TXT2MTXT', async (c) => {
    const s = (await c.select('Select objects:')).filter((e) => e.type === 'TEXT');
    if (!s.length) return;
    s.sort((a, b) => b.p.y - a.p.y || a.p.x - b.p.x);
    const d = doc(), f = s[0];
    const w = Math.max(...s.map((e) => E.textWidth(e.text || '', e.h || 2.5, e.wf || 1)));
    d.begin('TXT2MTXT');
    d.add({ type: 'MTEXT', p: { x: f.p.x, y: f.p.y + (f.h || 2.5) }, h: f.h || 2.5, w: w * 1.05, att: 1, rot: f.rot || 0, style: f.style, layer: f.layer, color: f.color, text: s.map((e) => e.text).join('\\P') }, d.ownerOf(f));
    for (const e of s) d.remove(e);
    d.end(); redraw();
  });
  R('TCOUNT', async (c) => {
    const s = (await c.select('Select objects:')).filter((e) => e.type === 'TEXT' || e.type === 'MTEXT');
    if (!s.length) return;
    const r = await dlg().form('Numeración automática', [
      { k: 'sort', l: 'Ordenar por', v: 'y', t: 'select', opts: [{ v: 'y', l: 'Y (de arriba abajo)' }, { v: 'x', l: 'X (de izquierda a derecha)' }, { v: 'sel', l: 'Orden de designación' }] },
      { k: 'start', l: 'Número inicial', v: 1, t: 'number' }, { k: 'inc', l: 'Incremento', v: 1, t: 'number' },
      { k: 'mode', l: 'Colocación', v: 'prefix', t: 'select', opts: [{ v: 'prefix', l: 'Prefijo' }, { v: 'suffix', l: 'Sufijo' }, { v: 'over', l: 'Sobrescribir' }] },
    ]);
    if (!r) return;
    const list = s.slice();
    if (r.sort === 'y') list.sort((a, b) => b.p.y - a.p.y || a.p.x - b.p.x); else if (r.sort === 'x') list.sort((a, b) => a.p.x - b.p.x || b.p.y - a.p.y);
    const d = doc(); d.begin('TCOUNT');
    list.forEach((e, i) => { const n = String(+r.start + i * +r.inc); d.mod(e, (x) => { x.text = r.mode === 'over' ? n : r.mode === 'suffix' ? `${x.text} ${n}` : `${n} ${x.text}`; }); });
    d.end(); redraw();
  });
  R('TCIRCLE', async (c) => {
    const s = (await c.select('Select objects:')).filter((e) => e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTRIB');
    if (!s.length) return;
    const r = await dlg().form('Encerrar texto en objeto', [{ k: 'shape', l: 'Forma', v: 'rect', t: 'select', opts: [{ v: 'circle', l: 'Círculo' }, { v: 'rect', l: 'Rectángulo' }, { v: 'slot', l: 'Ranura' }] }, { k: 'off', l: 'Separación (× altura de texto)', v: 0.35, t: 'number' }]);
    if (!r) return;
    const d = doc(); d.begin('TCIRCLE');
    for (const e of s) {
      const bb = E.entBBox(e, d); if (!G.bbValid(bb)) continue;
      const o = (+r.off || 0) * (e.h || 2.5), x1 = bb.x1 - o, y1 = bb.y1 - o, x2 = bb.x2 + o, y2 = bb.y2 + o, base = { layer: e.layer, color: e.color };
      if (r.shape === 'circle') d.add({ type: 'CIRCLE', ...base, c: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }, r: Math.hypot(x2 - x1, y2 - y1) / 2 }, d.ownerOf(e));
      else if (r.shape === 'slot') { const rr = (y2 - y1) / 2; d.add({ type: 'LWPOLYLINE', ...base, closed: true, pts: [{ x: x1, y: y1, b: 0 }, { x: x2, y: y1, b: 1 }, { x: x2, y: y2, b: 0 }, { x: x1, y: y2, b: 1 }] }, d.ownerOf(e)); void rr; }
      else d.add({ type: 'LWPOLYLINE', ...base, closed: true, pts: [{ x: x1, y: y1, b: 0 }, { x: x2, y: y1, b: 0 }, { x: x2, y: y2, b: 0 }, { x: x1, y: y2, b: 0 }] }, d.ownerOf(e));
    }
    d.end(); redraw();
  });

  // ---- dibujo: símbolo de línea de rotura
  R('BREAKLINE', async (c) => {
    const p1 = need(await c.getPoint('Specify first point:'));
    const sym = (p2) => {
      const L = G.dist(p1, p2), a = G.ang(p1, p2), m = G.mid(p1, p2), s = Math.min(L / 6, Math.max(L / 20, 2.5)) || 1;
      const loc = (u, v) => G.add(m, G.rotate({ x: u, y: v }, { x: 0, y: 0 }, a));
      const ext = s * 0.6;
      return [G.polar(p1, a + Math.PI, ext), loc(-s / 2, 0), loc(-s / 6, s), loc(s / 6, -s), loc(s / 2, 0), G.polar(p2, a, ext)].map((q) => ({ x: q.x, y: q.y, b: 0 }));
    };
    const p2 = need(await c.getPoint('Specify second point:', { base: p1, preview: (q) => [{ type: 'LWPOLYLINE', pts: sym(q), closed: false }] }));
    if (!isPt(p2)) return;
    const d = doc(); d.begin('BREAKLINE'); d.add({ type: 'LWPOLYLINE', pts: sym(p2), closed: false }); d.end(); redraw();
  });

  // ---- datos extendidos
  R('XDATA', async (c) => {
    const r0 = need(await c.entsel('Select object:'));
    const r = await dlg().form('Adjuntar datos extendidos', [{ k: 'app', l: 'Aplicación', v: 'WEBCAD' }, { k: 'type', l: 'Tipo', v: '1000', t: 'select', opts: [{ v: '1000', l: 'Cadena (1000)' }, { v: '1040', l: 'Real (1040)' }, { v: '1070', l: 'Entero (1070)' }] }, { k: 'val', l: 'Valor', v: '' }]);
    if (!r || !r.app) return;
    const lisp = app.lisp, e = r0.e, code = +r.type, v = code === 1000 ? JSON.stringify(String(r.val)) : code === 1040 ? String(+r.val || 0).replace(/^(-?\d+)$/, '$1.0') : String(Math.trunc(+r.val || 0));
    const d = doc(); d.begin('XDATA'); d.touch(e);
    e.xd ||= {}; const app_ = r.app.toUpperCase();
    const prev = e.xd[app_] ? e.xd[app_].replace(/^\(|\)$/g, '') : '';
    e.xd[app_] = `(${prev ? prev + ' ' : ''}(${code} . ${v}))`;
    d.end(); c.print(`Extended data attached to ${e.type}.`); void lisp;
  });
  R('XDLIST', async (c) => {
    const r = need(await c.entsel('Select object:'));
    const xd = r.e.xd || {};
    if (!Object.keys(xd).length) { c.print('Object has no extended data.'); return; }
    for (const [k, v] of Object.entries(xd)) c.print(`* Registered application: ${k}\n  ${v}`);
    app.ui.cmdline.expand(true);
  });

  // ---- líneas de centro
  R('CENTERMARK', async (c) => {
    const d = doc(); d.begin('CENTERMARK');
    for (;;) {
      const r = await c.entsel('Select object:', { filter: (e) => e.type === 'CIRCLE' || e.type === 'ARC', filterMsg: 'Select a circle or an arc.' });
      if (!r || typeof r !== 'object') break;
      const e = r.e, ext = e.r * 1.25, sm = Math.max(e.r * 0.12, 0.5);
      if (d.ltypes.CENTER == null && app.doc.ltypes) { /* el tipo CENTER se carga si existe en la biblioteca */ }
      for (const a of [0, Math.PI / 2]) {
        d.add({ type: 'LINE', p1: G.polar(e.c, a, -ext), p2: G.polar(e.c, a, -sm), layer: d.clayer });
        d.add({ type: 'LINE', p1: G.polar(e.c, a, -sm * 0.5), p2: G.polar(e.c, a, sm * 0.5), layer: d.clayer });
        d.add({ type: 'LINE', p1: G.polar(e.c, a, sm), p2: G.polar(e.c, a, ext), layer: d.clayer });
      }
      redraw();
    }
    d.end();
  });
  R('CENTERLINE', async (c) => {
    const a = need(await c.entsel('Select first line:', { filter: (e) => e.type === 'LINE', filterMsg: 'Select a line.' }));
    const b = need(await c.entsel('Select second line:', { filter: (e) => e.type === 'LINE', filterMsg: 'Select a line.' }));
    const l1 = a.e, l2 = b.e;
    const same = G.dot(G.sub(l1.p2, l1.p1), G.sub(l2.p2, l2.p1)) >= 0;
    const q1 = same ? l2.p1 : l2.p2, q2 = same ? l2.p2 : l2.p1;
    const m1 = G.mid(l1.p1, q1), m2 = G.mid(l1.p2, q2), dir = G.norm(G.sub(m2, m1)), ext = G.dist(m1, m2) * 0.08;
    const d = doc(); d.begin('CENTERLINE');
    if (!d.ltypes.CENTER) { const { LINETYPES } = await import('../core/tables.js'); d.touchTables(); d.ltypes.CENTER = LINETYPES.CENTER; }
    d.add({ type: 'LINE', p1: G.sub(m1, G.mul(dir, ext)), p2: G.add(m2, G.mul(dir, ext)), ltype: 'CENTER' });
    d.end(); redraw();
  });
}
