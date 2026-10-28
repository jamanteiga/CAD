// Biblioteca (LIBINSERT, BIBLIOTECA), extracción de datos (DATAEXTRACTION), cajetín (TITLEBLOCK),
// dibujo isométrico (ISODRAFT, ISOPLANE, ISOCIRCLE) y tuberías de esquema (PIPE).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import * as D from '../core/duct.js';
import * as T from '../core/table.js';
import { libBlock } from '../core/libblocks.js';
import { titleBlock } from '../core/templates.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t, getLang } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };
const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const LIB_LAYER = { hvac: ['CLIMA-EQUIPOS', 30], pid: ['PID-VALVULAS', 2], steel: ['ESTRUCTURA', 7] };

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const nf = (v, d = 2) => (+v).toLocaleString(getLang() === 'en' ? 'en-GB' : 'es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

  // ---- biblioteca
  R('BIBLIOTECA', async () => app.ui.library.show(!app.ui.library.visible()), { alias: ['TOOLPALETTES', 'LIBRARY', 'TP'] });
  R('LIBINSERT', async (c) => {
    const pend = app.libPending; app.libPending = null;
    if (!pend) return;
    const d = doc();
    const b = libBlock(pend.cat, pend.label); if (!b) return;
    d.begin('LIBINSERT');
    if (!d.blocks[b.name]) { d.touchTables(); d.blocks[b.name] = b; }
    const [ln, col] = pend.cat === 'hvac' && /Rejilla|Difusor|Toma/.test(pend.label) ? ['CLIMA-DIFUSORES', 4] : pend.cat === 'pid' && /Instrumento|Manómetro|Termómetro/.test(pend.label) ? ['PID-INSTRUMENTOS', 6] : pend.cat === 'pid' && /Bomba|Depósito|Vaso|Intercambiador/.test(pend.label) ? ['PID-EQUIPOS', 4] : LIB_LAYER[pend.cat];
    const prevL = d.clayer;
    if (!d.layers[ln]) { d.touchTables(); d.ensureLayer(ln, { color: col }); }
    d.clayer = ln;
    try { await app.placeInsert(c, b.name, {}); } finally { d.clayer = prevL; d.end(); }
  });

  // ---- extracción de datos: bloques con atributos, longitudes por capa, conductos y tablas
  R('DATAEXTRACTION', async (c) => {
    const d = doc();
    const r = await app.ui.dlg.form('Extracción de datos', [
      { k: 'what', l: 'Datos', v: 'blocks', t: 'select', opts: [{ v: 'blocks', l: 'Bloques y atributos (recuento)' }, { v: 'lengths', l: 'Longitudes y áreas por capa' }, { v: 'ducts', l: 'Conductos (mediciones)' }] },
      { k: 'scope', l: 'Ámbito', v: 'all', t: 'select', opts: [{ v: 'all', l: 'Todo el dibujo' }, { v: 'sel', l: 'Designar objetos' }] },
    ]);
    if (!r) return;
    const ents = r.scope === 'sel' ? await c.select() : d.space.filter((e) => d.isVisible(e));
    let cells;
    if (r.what === 'blocks') {
      const rows = new Map();
      for (const e of ents) {
        if (e.type !== 'INSERT' || e.name.startsWith('*')) continue;
        const vals = (e.attribs || []).map((a) => `${a.tag}=${E.decodeSpecial(a.text)}`).join(' | ');
        const k = `${e.name}\u0000${vals}\u0000${e.layer}`;
        rows.set(k, (rows.get(k) || 0) + 1);
      }
      cells = [[t('Bloque'), t('Atributos'), t('Capa'), t('Cantidad')], ...[...rows].sort().map(([k, n]) => { const [a, b, l] = k.split('\u0000'); return [a.replace(/^LIB_|^PID_|^PERFIL_/, ''), b, l, String(n)]; })];
    } else if (r.what === 'lengths') {
      const by = new Map();
      for (const e of ents) {
        const L = ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SPLINE', 'ELLIPSE'].includes(e.type) ? E.entLength(e) : 0;
        const A = (e.type === 'LWPOLYLINE' && e.closed) || e.type === 'CIRCLE' || e.type === 'HATCH' ? E.entArea(e) : 0;
        if (!L && !A) continue;
        const o = by.get(e.layer) || { n: 0, L: 0, A: 0 }; o.n++; o.L += L || 0; o.A += A || 0; by.set(e.layer, o);
      }
      const u = d.vars.INSUNITS === 4 ? 1000 : 1;
      cells = [[t('Capa'), t('Objetos'), t('Longitud'), t('Área')], ...[...by].sort().map(([l, o]) => [l, String(o.n), nf(o.L / u), nf(o.A / (u * u))])];
      if (u === 1000) cells[0] = [t('Capa'), t('Objetos'), t('Longitud (m)'), t('Área (m²)')];
    } else {
      const ducts = ents.filter((e) => e.type === 'DUCT');
      if (!ducts.length) { c.print('No ducts selected.'); return; }
      cells = app.ductTable(ducts);
    }
    if (cells.length < 2) { c.print('No objects found.'); return; }
    const tb = h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, cells[0].map((x) => h('th', { text: x })))), h('tbody', {}, cells.slice(1).map((row) => h('tr', {}, row.map((x) => h('td', { text: x }))))));
    const act = await app.ui.dlg.open({ title: 'Extracción de datos', body: [h('div', { style: { overflow: 'auto', maxHeight: '55vh', maxWidth: 'min(900px, 90vw)' } }, tb)], buttons: [{ t: 'Insertar tabla', v: 'table', pri: true }, { t: 'Exportar Excel', v: 'xlsx' }, { t: 'Exportar CSV', v: 'csv' }, { t: 'Cerrar', v: null }] });
    if (act === 'xlsx' || act === 'csv') await app.writeCells(cells, 'extraccion', act);
    if (act === 'table') {
      const p = need(await c.getPoint('Specify insertion point:'));
      const th = d.vars.INSUNITS === 4 && d.active === 'Model' ? 100 : 2.5;
      const e = T.newTable(p, cells.length, cells[0].length, { th, head: 1 });
      e.cells = cells; e.cols = cells[0].map((_, j) => Math.max(...cells.map((row) => String(row[j]).length)) * th * 0.75 + th * 1.6); e.rows = cells.map(() => th * 2.6);
      e.layer = d.clayer; e.color = 256; d.begin('TABLE'); d.add(e); d.end();
    }
  }, { alias: ['EXTRACCION', 'EATTEXT'] });

  // ---- cajetín con campos
  R('TITLEBLOCK', async (c) => {
    const d = doc();
    const b = titleBlock();
    d.begin('TITLEBLOCK');
    if (!d.blocks[b.name]) { d.touchTables(); d.blocks[b.name] = b; d.styles.ISO ||= { name: 'ISO', font: 'isocp.shx', h: 0, wf: 1 }; }
    try { await app.placeInsert(c, b.name, {}); } finally { d.end(); }
  }, { alias: ['CAJETIN'] });

  // ---- isométrico
  R('ISODRAFT', async (c) => {
    const d = doc();
    const k = await c.getKw(`Enter an option [Isometric/Orthographic] <${d.vars.SNAPSTYL ? 'Orthographic' : 'Isometric'}>:`, d.vars.SNAPSTYL ? 'Orthographic' : 'Isometric');
    d.setvar('SNAPSTYL', k === 'Isometric' ? 1 : 0); if (k === 'Isometric') d.setvar('ORTHOMODE', 1);
    app.view.redraw(); app.ui.status.update();
  });
  const planes = ['Left', 'Top', 'Right'];
  app.cycleIsoplane = () => { const d = doc(); d.setvar('ISOPLANE', ((d.vars.ISOPLANE || 0) + 1) % 3); app.log(`<${t('Isoplano')} ${t(planes[d.vars.ISOPLANE])}>`); app.view.updateCursor(); app.view.redraw(); };
  R('ISOPLANE', async (c) => {
    const d = doc();
    const k = await c.getKw('Enter isometric plane setting [Left/Top/Right] <Top>:', 'Top');
    d.setvar('ISOPLANE', Math.max(0, planes.indexOf(k)));
  }, { transparent: true });
  R('ISOCIRCLE', async (c) => {
    const d = doc();
    const cc = need(await c.getPoint('Specify center of isocircle:'));
    const r = need(await c.getDist('Specify radius of isocircle:', { base: cc }));
    // elipse isométrica: eje mayor en la diagonal del plano activo
    const majA = [G.rad(120), G.rad(0), G.rad(60)][d.vars.ISOPLANE || 0];
    const a = r * Math.sqrt(1.5), ratio = 1 / Math.sqrt(3);
    d.begin('ISOCIRCLE'); d.add({ type: 'ELLIPSE', c: cc, major: G.polar({ x: 0, y: 0 }, majA, a), ratio, a1: 0, a2: G.TAU, layer: d.clayer, color: d.vars.CECOLOR }); d.end();
  });

  // ---- tubería de esquema: polilínea en la capa de líneas, flecha de sentido y rótulo
  R('PIPE', async (c) => {
    const d = doc();
    const tag = (await c.getString('Enter line tag <none>:', { spaces: true, def: '' })) || '';
    const pts = [];
    for (;;) {
      const q = await c.getPoint(pts.length ? 'Specify next point or [Undo]:' : 'Specify start point:', { base: pts[pts.length - 1], preview: (p) => (pts.length ? [{ type: 'LWPOLYLINE', pts: [...pts, p].map((v) => ({ ...v, b: 0 })), closed: false }] : []) });
      if (q === 'Undo') { pts.pop(); continue; }
      if (!isPt(q)) break;
      pts.push({ x: q.x, y: q.y });
    }
    if (pts.length < 2) return;
    d.begin('PIPE');
    if (!d.layers['PID-LINEAS-PRINCIPALES']) { d.touchTables(); d.ensureLayer('PID-LINEAS-PRINCIPALES', { color: 7, lw: 50 }); }
    const layer = 'PID-LINEAS-PRINCIPALES';
    d.add({ type: 'LWPOLYLINE', pts: pts.map((v) => ({ ...v, b: 0 })), closed: false, layer, color: 256 });
    let bi = 0, bl = 0; for (let i = 1; i < pts.length; i++) { const l = G.dist(pts[i - 1], pts[i]); if (l > bl) { bl = l; bi = i; } }
    const a = pts[bi - 1], b = pts[bi], m = G.mid(a, b), ang = G.ang(a, b), sz = Math.max(2, Math.min(bl / 8, 4));
    const tip = G.polar(m, ang, sz / 2), l1 = G.polar(m, ang + Math.PI * 0.85, sz * 0.75), l2 = G.polar(m, ang - Math.PI * 0.85, sz * 0.75);
    d.add({ type: 'HATCH', solid: true, pattern: 'SOLID', loops: [[tip, l1, l2].map((p) => ({ ...p, b: 0 }))], layer, color: 256 });
    if (tag) { let ra = ang; if (ra > Math.PI / 2 || ra <= -Math.PI / 2) ra += Math.PI; const p = G.add(m, G.polar({ x: 0, y: 0 }, ra + Math.PI / 2, sz * 0.8)); d.add({ type: 'TEXT', p, p2: p, h: sz * 0.6, text: tag, rot: G.normA(ra), ha: 1, va: 1, layer, color: 256 }); }
    d.end();
  }, { alias: ['TUBERIA'] });
}
