// Diálogos adicionales: tabla de consulta de bloques dinámicos y cuadros DCL de AutoLISP.
import { h } from './dom.js';
import * as G from '../core/geom.js';

export function extendDialogs(app, dlg) {
  // ---- tabla de consulta (BLOOKUPTABLE): cada fila = etiqueta + valores de los parámetros
  dlg.lookupTable = async (be, lp) => {
    const params = be.params.filter((p) => ['linear', 'rotation', 'xy', 'polar'].includes(p.type));
    const cols = [];
    for (const p of params) {
      if (p.type === 'linear') cols.push({ p, k: null, l: p.name });
      else if (p.type === 'rotation') cols.push({ p, k: 'deg', l: `${p.name} (°)` });
      else if (p.type === 'xy') { cols.push({ p, k: 'x', l: `${p.name} X` }); cols.push({ p, k: 'y', l: `${p.name} Y` }); }
      else if (p.type === 'polar') { cols.push({ p, k: 'd', l: `${p.name} d` }); cols.push({ p, k: 'a', l: `${p.name} (°)` }); }
    }
    const get = (row, c) => { const v = row.values?.[c.p.name]; if (v == null) return ''; if (c.k === 'deg') return +G.deg(v).toFixed(4); if (c.k === 'a') return +G.deg(v.a).toFixed(4); return c.k ? v[c.k] : v; };
    let rows = (lp.rows || []).map((r) => ({ label: r.label, cells: cols.map((c) => get(r, c)) }));
    if (!rows.length) rows = [{ label: 'Tamaño 1', cells: cols.map(() => '') }];
    const tb = h('tbody');
    const render = () => {
      tb.replaceChildren(...rows.map((r, i) => h('tr', {},
        h('td', {}, h('input', { type: 'text', value: r.label, oninput: (e) => (r.label = e.target.value), onkeydown: (e) => e.stopPropagation() })),
        cols.map((c, j) => h('td', {}, h('input', { type: 'number', step: 'any', value: r.cells[j], style: { width: '80px' }, oninput: (e) => (r.cells[j] = e.target.value), onkeydown: (e) => e.stopPropagation() }))),
        h('td', {}, h('button', { class: 'tbtn', type: 'button', text: '×', title: 'Suprimir', onclick: () => { rows.splice(i, 1); render(); } })))));
    };
    render();
    const ok = await dlg.open({ title: `Tabla de consulta — ${lp.name}`, body: [
      h('p', { class: 'hint', text: 'Cada fila es una opción del desplegable del bloque; al elegirla se aplican estos valores. Deje vacío lo que no deba cambiar.' }),
      h('div', { style: { overflow: 'auto', maxHeight: '50vh' } }, h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, h('th', { text: 'Etiqueta' }), cols.map((c) => h('th', { text: c.l })), h('th', {}))), tb)),
      h('button', { class: 'btn', type: 'button', text: 'Añadir fila', onclick: () => { rows.push({ label: `Tamaño ${rows.length + 1}`, cells: cols.map(() => '') }); render(); } }),
    ] });
    if (!ok) return false;
    lp.rows = rows.filter((r) => r.label).map((r) => {
      const values = {};
      cols.forEach((c, j) => {
        const raw = r.cells[j]; if (raw === '' || raw == null) return; const v = +raw; if (!Number.isFinite(v)) return;
        const name = c.p.name;
        if (!c.k) values[name] = v;
        else if (c.k === 'deg') values[name] = G.rad(v);
        else if (c.k === 'x' || c.k === 'y') values[name] = { ...(values[name] || { x: c.p.p2.x - c.p.p1.x, y: c.p.p2.y - c.p.p1.y }), [c.k]: v };
        else if (c.k === 'd') values[name] = { ...(values[name] || { a: G.ang(c.p.p1, c.p.p2) }), d: v };
        else if (c.k === 'a') values[name] = { ...(values[name] || { d: G.dist(c.p.p1, c.p.p2) }), a: G.rad(v) };
      });
      return { label: r.label, values };
    });
    return true;
  };
}
