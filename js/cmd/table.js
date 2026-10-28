// Tablas: TABLE (nueva, vacía o desde CSV/Excel), TABLEDIT (editor de celdas), TABLEEXPORT (CSV/Excel).
import * as T from '../core/table.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { t } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const dlg = () => app.ui.dlg;

  // lee un CSV o una hoja de Excel/ODS y devuelve las celdas
  app.readCells = async (f) => {
    if (/\.(xlsx|xls|ods)$/i.test(f.name)) {
      const X = await app.io.xlsx();
      const wb = X.read(await f.arrayBuffer(), { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      return X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' }).filter((r) => r.some((v) => v !== ''));
    }
    return T.parseCSV(await f.text());
  };
  app.writeCells = async (cells, base, fmt = 'xlsx') => {
    if (fmt === 'csv') return app.io.deliver(`${base}.csv`, '﻿' + T.toCSV(cells), 'text/csv');
    const X = await app.io.xlsx();
    const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(cells), 'Datos');
    const out = X.write(wb, { type: 'array', bookType: 'xlsx' });
    return app.io.deliver(`${base}.xlsx`, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  };

  // editor de celdas (rejilla de entradas)
  const editor = async (cells, title = 'Editor de tabla') => {
    let data = cells.map((r) => [...r]);
    const grid = h('div', { style: { overflow: 'auto', maxHeight: '55vh', maxWidth: 'min(900px, 86vw)' } });
    const render = () => {
      const tb = h('tbody');
      data.forEach((row, i) => tb.append(h('tr', {}, h('td', { class: 'hint', text: String(i + 1) }), row.map((v, j) => h('td', {}, h('input', { type: 'text', value: v, style: { width: '110px' }, oninput: (ev) => { data[i][j] = ev.target.value; }, onkeydown: (ev) => ev.stopPropagation() }))))));
      grid.replaceChildren(h('table', { class: 'kv' }, tb));
    };
    render();
    const btn = (l, fn) => h('button', { class: 'btn', type: 'button', text: l, onclick: () => { fn(); render(); } });
    const tools = h('div', { class: 'row' },
      btn('Añadir fila', () => data.push(Array(data[0]?.length || 1).fill(''))),
      btn('Quitar fila', () => data.length > 1 && data.pop()),
      btn('Añadir columna', () => data.forEach((r) => r.push(''))),
      btn('Quitar columna', () => data[0]?.length > 1 && data.forEach((r) => r.pop())),
      h('button', { class: 'btn', type: 'button', text: 'Importar CSV/Excel...', onclick: async () => { const f = await app.io.pickFile('.csv,.txt,.xlsx,.xls,.ods'); if (!f) return; data = await app.readCells(f); if (!data.length) data = [['']]; render(); } }),
      h('button', { class: 'btn', type: 'button', text: 'Exportar Excel', onclick: () => app.writeCells(data, 'tabla', 'xlsx') }),
      h('button', { class: 'btn', type: 'button', text: 'Exportar CSV', onclick: () => app.writeCells(data, 'tabla', 'csv') }));
    const ok = await dlg().open({ title, body: [tools, grid] });
    return ok ? data : null;
  };
  app.tableEditor = editor;

  const fit = (e) => { // ajusta columnas al texto más largo
    const nc = e.cells[0]?.length || 1;
    e.cols = Array.from({ length: nc }, (_, j) => Math.max(e.cols[j] || 0, ...e.cells.map((r) => E.textWidth(String(r[j] ?? ''), e.th, 1) + e.th * 1.4)));
    e.rows = e.cells.map((_, i) => e.rows[i] || e.th * 2.6);
  };

  R('TABLE', async (c) => {
    const d = doc();
    const r = await dlg().form('Insertar tabla', [
      { k: 'src', l: 'Origen', v: 'empty', t: 'select', opts: [{ v: 'empty', l: 'Tabla vacía' }, { v: 'file', l: 'Desde archivo CSV/Excel...' }] },
      { k: 'rows', l: 'Filas', v: 5, t: 'number' }, { k: 'cols', l: 'Columnas', v: 4, t: 'number' },
      { k: 'cw', l: 'Ancho de columna', v: 30, t: 'number' }, { k: 'rh', l: 'Alto de fila', v: 7, t: 'number' },
      { k: 'th', l: 'Altura de texto', v: d.vars.TEXTSIZE || 2.5, t: 'number' }, { k: 'head', l: 'Filas de cabecera', v: 1, t: 'number' },
    ]);
    if (!r) return;
    let cells = null;
    if (r.src === 'file') { const f = await app.io.pickFile('.csv,.txt,.xlsx,.xls,.ods'); if (!f) return; cells = await app.readCells(f); if (!cells.length) return; }
    const p = need(await c.getPoint('Specify insertion point:'));
    const e = T.newTable(p, cells ? cells.length : Math.max(1, +r.rows), cells ? cells[0].length : Math.max(1, +r.cols), { cw: +r.cw, rh: +r.rh, th: +r.th, head: +r.head });
    if (cells) { e.cells = cells.map((row) => row.map((v) => String(v))); e.cols = []; e.rows = []; fit(e); }
    else { e.cells[0] = e.cells[0].map((_, j) => `${t('Columna')} ${j + 1}`); }
    e.layer = d.clayer; e.color = 256; e.style = d.vars.TEXTSTYLE;
    d.begin('TABLE'); d.add(e); d.end();
  }, { alias: ['TB'] });

  const pickTable = async (c) => (eng.sel.length === 1 && eng.sel[0].type === 'TABLE' ? eng.sel[0] : need(await c.entsel('Select table:', { filter: (x) => x.type === 'TABLE' })).e);
  R('TABLEDIT', async (c) => {
    const e = await pickTable(c);
    const data = await editor(e.cells);
    if (!data) return;
    const d = doc(); d.begin('TABLEDIT'); d.touch(e);
    const nr = data.length, nc = data[0]?.length || 1;
    e.cells = data; e.rows = Array.from({ length: nr }, (_, i) => e.rows[i] || e.rows.at(-1) || e.th * 2.6); e.cols = Array.from({ length: nc }, (_, j) => e.cols[j] || e.cols.at(-1) || 25);
    E.invalidate(e); d.end();
  }, { alias: ['TABLEEDIT'] });
  R('TABLEEXPORT', async (c) => {
    const e = await pickTable(c);
    const k = await c.getKw('Enter file format [Excel/Csv] <Excel>:', 'Excel');
    await app.writeCells(e.cells, (doc().name.replace(/\.\w+$/, '') || 'tabla') + '-tabla', k === 'Csv' ? 'csv' : 'xlsx');
  });
}
