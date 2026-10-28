// Paleta Biblioteca: bloques de climatización, valvulería/P&ID y perfiles de acero, listos para insertar.
import { h, draggable } from './dom.js';
import { icon } from './icons.js';
import { drawThumb } from './thumb.js';
import { LIBRARY, libBlock } from '../core/libblocks.js';
import { tKnown } from '../core/i18n.js';

export function createLibrary(app) {
  const host = document.getElementById('host');
  let pal = null, cat = 'hvac', filter = '';
  const B = {};
  const cache = {};
  const thumbBlock = (catId, label) => (cache[catId + label] ||= libBlock(catId, label));
  B.rebuild = () => { if (!pal) return; const vis = !pal.hidden; pal.remove(); pal = null; if (vis) B.show(true); };
  B.show = (on = true) => {
    if (!pal) {
      const tabs = h('div', { class: 'tabsbar', style: { padding: '4px 6px 0' } });
      const search = h('input', { type: 'text', placeholder: 'Buscar', class: 'fld', style: { margin: '6px', width: 'calc(100% - 12px)' }, oninput: () => { filter = search.value.toLowerCase(); render(); }, onkeydown: (e) => e.stopPropagation() });
      const grid = h('div', { class: 'libgrid' });
      pal = h('div', { class: 'palette', id: 'libpal', style: { right: '12px', top: '40px', width: '330px', left: 'auto' } },
        h('div', { class: 'pal-h' }, 'Biblioteca', h('span', { class: 'sp' }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => B.show(false) })),
        h('div', { class: 'pal-b' }, tabs, search, grid));
      host.append(pal); draggable(pal, pal.querySelector('.pal-h'));
      const render = () => {
        tabs.replaceChildren(...LIBRARY.map((c) => h('div', { class: 't' + (c.id === cat ? ' on' : ''), text: c.name, onclick: () => { cat = c.id; render(); } })));
        const c = LIBRARY.find((x) => x.id === cat);
        const items = Object.keys(c.items).filter((k) => !filter || k.toLowerCase().includes(filter) || tKnown(k).toLowerCase().includes(filter));
        grid.replaceChildren(...items.map((label) => {
          const cv = h('canvas', { width: 92, height: 64 });
          const cell = h('div', { class: 'libitem', title: tKnown(label), onclick: () => { app.libPending = { cat, label }; app.cmd.run('LIBINSERT'); } }, cv, h('div', { class: 'nm', text: label }));
          requestAnimationFrame(() => { const b = thumbBlock(cat, label); const dark = document.documentElement.dataset.ui !== 'light'; drawThumb(cv, b.ents.filter((e) => e.type !== 'ATTDEF'), app.doc, { bg: dark ? '#1b2226' : '#ffffff', dark, pad: 0.12 }); });
          return cell;
        }));
      };
      render();
    }
    pal.hidden = !on;
  };
  B.visible = () => pal && !pal.hidden;
  return B;
}
