// Administrador de propiedades de capas (paleta)
import { h, draggable } from './dom.js';
import { icon } from './icons.js';
import { aciCss, colorName, lwName } from '../core/tables.js';

export function createLayers(app) {
  const host = document.getElementById('host');
  let pal = null, selName = null, filter = '';
  const d = () => app.doc;
  const L = {};
  const edit = (fn) => { const doc = d(); doc.begin('LAYER'); doc.touchTables(); fn(doc); doc.end(); app.view.redraw(); app.ui.refresh(); };
  const uniq = (base) => { let i = 1; while (d().layers[`${base}${i}`]) i++; return `${base}${i}`; };
  L.show = () => {
    if (pal) { pal.hidden = false; L.render(); return; }
    const body = h('div', { class: 'pal-b' });
    const search = h('input', { type: 'text', placeholder: 'Search for layer', oninput: () => { filter = search.value.toLowerCase(); L.render(); } });
    const tb = h('div', { class: 'ltool' },
      h('button', { class: 'sm', type: 'button', title: 'New Layer', onclick: () => edit((doc) => { const n = uniq('Layer'); doc.ensureLayer(n); selName = n; }) }, h('span', { class: 'ico', html: icon('layers') }), 'New'),
      h('button', { class: 'sm', type: 'button', title: 'Delete Layer', onclick: () => {
        const doc = d(); const n = selName; if (!n || n === '0' || n === 'Defpoints' || n === doc.clayer) { app.log('No se puede borrar la capa 0, Defpoints, la actual o una capa con objetos.'); return; }
        if ([...doc.allEntsDeep()].some((e) => e.layer === n)) { app.log(`La capa "${n}" contiene objetos. Use LAYDEL para borrarla con sus objetos.`); return; }
        edit((dd) => { delete dd.layers[n]; selName = null; });
      } }, h('span', { class: 'ico', html: icon('erase') }), 'Delete'),
      h('button', { class: 'sm', type: 'button', title: 'Set Current', onclick: () => { if (selName && d().layers[selName] && !d().layers[selName].frozen) { d().clayer = selName; app.ui.refresh(); } } }, h('span', { class: 'ico', html: icon('laymcur') }), 'Set Current'),
      search);
    pal = h('div', { class: 'palette', id: 'layerpal', style: { left: '60px', top: '40px' } },
      h('div', { class: 'pal-h' }, 'Layer Properties Manager', h('span', { class: 'sp' }), h('span', { class: 'hint', id: 'laycount' }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => { pal.hidden = true; } })), tb, body);
    host.append(pal);
    draggable(pal, pal.querySelector('.pal-h'));
    L.render();
  };
  L.hide = () => { if (pal) pal.hidden = true; };
  L.render = () => {
    if (!pal || pal.hidden) return;
    const doc = d(), body = pal.querySelector('.pal-b');
    const used = new Set(); for (const e of doc.allEntsDeep()) used.add(e.layer);
    const rows = Object.values(doc.layers).filter((l) => !filter || l.name.toLowerCase().includes(filter)).sort((a, b) => (a.name === '0' ? -1 : b.name === '0' ? 1 : a.name.localeCompare(b.name, undefined, { numeric: true })));
    pal.querySelector('#laycount').textContent = `All: ${rows.length} of ${Object.keys(doc.layers).length} layers`;
    const ic = (name, title, fn) => h('span', { class: 'ic', title, html: icon(name), onclick: (e) => { e.stopPropagation(); fn(); } });
    const tbody = h('tbody');
    for (const l of rows) {
      const tr = h('tr', { class: l.name === selName ? 'sel' : '', onclick: () => { selName = l.name; L.render(); }, ondblclick: (e) => { if (e.target.closest('.nmcell')) return; if (!l.frozen) { doc.clayer = l.name; app.ui.refresh(); } } });
      const nameCell = h('td', { class: 'nmcell', text: l.name, ondblclick: () => {
        if (l.name === '0' || l.name === 'Defpoints') return;
        const inp = h('input', { class: 'nm', value: l.name });
        nameCell.replaceChildren(inp); inp.focus(); inp.select();
        const done = (ok) => { const nv = inp.value.trim(); if (ok && nv && nv !== l.name && !doc.layers[nv]) edit((dd) => { const old = l.name; dd.layers[nv] = { ...l, name: nv }; delete dd.layers[old]; for (const e of dd.allEntsDeep()) if (e.layer === old) e.layer = nv; if (dd.clayer === old) dd.clayer = nv; selName = nv; }); else L.render(); };
        inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') done(true); if (e.key === 'Escape') done(false); };
        inp.onblur = () => done(true);
      } });
      tr.append(
        h('td', { class: 'cur', text: l.name === doc.clayer ? '✓' : used.has(l.name) ? '▰' : '▱', title: l.name === doc.clayer ? 'Current layer' : used.has(l.name) ? 'Layer in use' : 'Layer empty' }),
        nameCell,
        h('td', {}, ic(l.on ? 'bulbOn' : 'bulbOff', 'On', () => edit(() => (l.on = !l.on)))),
        h('td', {}, ic(l.frozen ? 'snow' : 'sun', 'Freeze', () => edit(() => { if (l.name === doc.clayer && !l.frozen) { app.log('Cannot freeze the current layer.'); return; } l.frozen = !l.frozen; }))),
        h('td', {}, ic(l.locked ? 'lockOn' : 'lockOff', 'Lock', () => edit(() => (l.locked = !l.locked)))),
        h('td', {}, ic(l.plot !== false ? 'printOn' : 'printOff', 'Plot', () => edit(() => (l.plot = l.plot === false)))),
        h('td', { style: { cursor: 'pointer' }, onclick: async () => { const c = await app.ui.dlg.color(l.color); if (c != null && c !== 0 && c !== 256) edit(() => (l.color = c)); } }, h('span', { class: 'swatch', style: { background: typeof l.color === 'string' ? l.color : aciCss(l.color) } }), typeof l.color === 'string' ? l.color : colorName(l.color).replace('Color ', '')),
        h('td', { style: { cursor: 'pointer' }, onclick: async () => { const n = await app.ui.dlg.pickLinetype(l.ltype); if (n) edit(() => (l.ltype = n)); } }, l.ltype === 'CONTINUOUS' ? 'Continuous' : l.ltype),
        h('td', { style: { cursor: 'pointer' }, onclick: async () => { const w = await app.ui.dlg.lweight(l.lw); if (w != null && w > -2) edit(() => (l.lw = w === -1 ? -3 : w)); } }, lwName(l.lw)),
        h('td', { style: { color: 'var(--fg-faint)' }, text: l.desc || '' }),
      );
      tbody.append(tr);
    }
    body.replaceChildren(h('table', { class: 'ltab' }, h('thead', {}, h('tr', {}, ['S..', 'Name', 'On', 'Freeze', 'Lock', 'Plot', 'Color', 'Linetype', 'Lineweight', 'Description'].map((t) => h('th', { text: t })))), tbody));
  };
  return L;
}
