// Climatización: CONDUCTO (DUCT), DIMENSIONAR CONDUCTO (DUCTSIZE) y CÁLCULO DE PÉRDIDAS (DUCTCALC).
import * as G from '../core/geom.js';
import * as D from '../core/duct.js';
import * as T from '../core/table.js';
import { LINETYPES } from '../core/tables.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t, getLang } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };
const isPt = (p) => p && typeof p === 'object' && 'x' in p;

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const nf = (v, d = 1) => (+v).toLocaleString(getLang() === 'en' ? 'en-GB' : 'es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  const defaults = () => (app.settings.duct ||= { shape: 'rect', w: 400, h: 300, d: 250, flow: 1500, sys: 'IMPULSION', ratio: 1 });
  const prepare = (d, sys) => {
    const s = D.SYSTEMS[sys] || D.SYSTEMS.IMPULSION;
    if (!d.layers[s.layer]) { d.touchTables(); d.ensureLayer(s.layer, { color: s.color, lw: 35 }); }
    if (!d.ltypes.CENTER && LINETYPES.CENTER) { d.touchTables(); d.ltypes.CENTER = LINETYPES.CENTER; }
    return s.layer;
  };

  R('DUCT', async (c) => {
    const o = defaults();
    for (;;) {
      const sec = o.shape === 'round' ? `Ø${o.d}` : `${o.w}×${o.h}`;
      c.print(`Duct: ${sec} mm, ${o.flow} m³/h, ${D.SYSTEMS[o.sys]?.label || o.sys}`);
      const r = await c.getPoint('Specify start point or [SYstem/SHape/WIdth/HEight/DIameter/FLow/RAdius]:');
      if (r === 'SYstem') { const k = await c.getKw('Enter duct system [Supply/Return/Exhaust/Outdoor] <Supply>:', 'Supply'); o.sys = { Supply: 'IMPULSION', Return: 'RETORNO', Exhaust: 'EXTRACCION', Outdoor: 'EXTERIOR' }[k] || 'IMPULSION'; continue; }
      if (r === 'SHape') { const k = await c.getKw('Enter duct shape [Rectangular/Round] <Rectangular>:', o.shape === 'round' ? 'Round' : 'Rectangular'); o.shape = k === 'Round' ? 'round' : 'rect'; continue; }
      if (r === 'WIdth') { o.w = need(await c.getDist(`Specify duct width <${o.w}>:`, { def: o.w })); continue; }
      if (r === 'HEight') { o.h = need(await c.getDist(`Specify duct height <${o.h}>:`, { def: o.h })); continue; }
      if (r === 'DIameter') { o.d = need(await c.getDist(`Specify duct diameter <${o.d}>:`, { def: o.d })); o.shape = 'round'; continue; }
      if (r === 'FLow') { o.flow = need(await c.getReal(`Enter air flow (m³/h) <${o.flow}>:`, { def: o.flow })); continue; }
      if (r === 'RAdius') { o.ratio = need(await c.getReal(`Enter elbow radius ratio R/W <${o.ratio}>:`, { def: o.ratio })); continue; }
      if (!isPt(r)) return;
      app.saveSettings();
      const pts = [{ x: r.x, y: r.y }];
      const proto = () => ({ type: 'DUCT', pts: [...pts], shape: o.shape, w: o.w, h: o.h, d: o.d, flow: o.flow, sys: o.sys, ratio: o.ratio, layer: D.SYSTEMS[o.sys]?.layer || '0', color: 256 });
      for (;;) {
        const q = await c.getPoint(pts.length > 1 ? 'Specify next point or [Undo]:' : 'Specify next point:', { base: pts[pts.length - 1], preview: (p) => [{ ...proto(), pts: [...pts, { x: p.x, y: p.y }] }] });
        if (q === 'Undo') { if (pts.length > 1) pts.pop(); continue; }
        if (!isPt(q)) break;
        if (G.dist(q, pts[pts.length - 1]) > 1e-9) pts.push({ x: q.x, y: q.y });
      }
      if (pts.length < 2) return;
      const d = doc(); d.begin('DUCT'); const layer = prepare(d, o.sys);
      const e = { ...proto(), layer }; d.add(e); d.end();
      const k = D.ductCalc(e);
      c.print(`v = ${nf(k.v)} m/s · R = ${nf(k.R, 2)} Pa/m · ΔP = ${nf(k.dp)} Pa`);
      return;
    }
  }, { alias: ['CONDUCTO', 'DU'] });

  // ---- dimensionado
  R('DUCTSIZE', async (c) => {
    const o = defaults();
    const r = await app.ui.dlg.form('Dimensionar conducto', [
      { k: 'flow', l: 'Caudal (m³/h)', v: o.flow, t: 'number' },
      { k: 'shape', l: 'Forma', v: o.shape, t: 'select', opts: [{ v: 'rect', l: 'Rectangular' }, { v: 'round', l: 'Circular' }] },
      { k: 'h', l: 'Alto fijo (mm, rectangular)', v: o.h, t: 'number' },
      { k: 'vmax', l: 'Velocidad máxima (m/s)', v: 6, t: 'number' },
      { k: 'rmax', l: 'Pérdida unitaria máxima (Pa/m)', v: 1, t: 'number' },
    ]);
    if (!r) return;
    const res = D.sizeDuct({ flow: +r.flow, shape: r.shape, h: +r.h, vmax: +r.vmax, rmax: +r.rmax });
    if (!res) { c.print('No standard size meets the criteria.'); return; }
    const k = res.calc;
    c.print(`${D.sectionText(res)} mm → v = ${nf(k.v)} m/s · R = ${nf(k.R, 2)} Pa/m · Deq = ${nf(k.De, 0)} mm`);
    const sel = eng.sel.filter((e) => e.type === 'DUCT');
    Object.assign(o, { flow: +r.flow, shape: r.shape, ...(r.shape === 'round' ? { d: res.d } : { w: res.w, h: res.h }) }); app.saveSettings();
    if (sel.length && await app.ui.dlg.confirm(t('¿Aplicar {0} a los {1} conductos designados?', D.sectionText(res), sel.length))) {
      const d = doc(); d.begin('DUCTSIZE');
      for (const e of sel) d.mod(e, (x) => { x.flow = +r.flow; x.shape = r.shape; if (r.shape === 'round') x.d = res.d; else { x.w = res.w; x.h = res.h; } });
      d.end();
    }
  }, { alias: ['DIMCONDUCTO'] });

  // ---- cálculo de pérdidas de carga
  const calcRows = (ducts) => {
    const head = ['Id', 'Sistema', 'Sección (mm)', 'Caudal (m³/h)', 'v (m/s)', 'Deq (mm)', 'R (Pa/m)', 'L (m)', 'Codos', 'Σζ', 'ΔP (Pa)', 'Chapa (m²)'].map((x) => t(x));
    let tot = 0, sheet = 0;
    const rows = ducts.map((e, i) => { const k = D.ductCalc(e); tot += k.dp; sheet += k.sheet; return [String(i + 1), t(D.SYSTEMS[e.sys]?.label || e.sys || ''), D.sectionText(e), nf(e.flow || 0, 0), nf(k.v), nf(k.De, 0), nf(k.R, 2), nf(k.L, 2), String(k.elbows), nf(k.zeta, 2), nf(k.dp), nf(k.sheet, 2)]; });
    rows.push(['', t('Total'), '', '', '', '', '', nf(ducts.reduce((a, e) => a + D.ductCalc(e).L, 0), 2), '', '', nf(tot), nf(sheet, 2)]);
    return [head, ...rows];
  };
  app.ductTable = calcRows;
  R('DUCTCALC', async (c) => {
    let s = eng.sel.filter((e) => e.type === 'DUCT');
    if (!s.length) s = (await c.select()).filter((e) => e.type === 'DUCT');
    if (!s.length) { c.print('No ducts selected.'); return; }
    const cells = calcRows(s);
    const tb = h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, cells[0].map((x) => h('th', { text: x })))), h('tbody', {}, cells.slice(1).map((r) => h('tr', {}, r.map((x) => h('td', { text: x }))))));
    const act = await app.ui.dlg.open({ title: 'Pérdida de carga en conductos', body: [h('p', { class: 'hint', text: 'Darcy-Weisbach con Colebrook-White; aire a 20 °C (ρ = 1,2 kg/m³), chapa galvanizada (ε = 0,15 mm), codos según R/W. Rectangulares con diámetro equivalente de Huebscher.' }), h('div', { style: { overflow: 'auto', maxWidth: 'min(1000px, 90vw)', maxHeight: '55vh' } }, tb)],
      buttons: [{ t: 'Insertar tabla', v: 'table', pri: true }, { t: 'Exportar Excel', v: 'xlsx' }, { t: 'Cerrar', v: null }] });
    if (act === 'xlsx') await app.writeCells(cells, 'perdidas-conductos', 'xlsx');
    if (act === 'table') {
      const p = need(await c.getPoint('Specify insertion point:'));
      const d = doc(); const e = T.newTable(p, cells.length, cells[0].length, { th: 2.5, head: 1 });
      e.cells = cells; e.cols = cells[0].map((_, j) => Math.max(...cells.map((r) => String(r[j]).length)) * 2.5 * 0.75 + 4); e.rows = cells.map(() => 6.5);
      e.layer = d.clayer; e.color = 256; d.begin('TABLE'); d.add(e); d.end();
    }
  }, { alias: ['PERDIDAS'] });
}
