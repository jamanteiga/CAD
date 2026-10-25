// Pestaña Inicio (Start)
import { h } from './dom.js';

export function createStart(app) {
  const host = document.getElementById('host');
  let el = null;
  const S = {};
  S.show = async () => {
    if (!el) {
      el = h('div', { id: 'start' });
      host.append(el);
    }
    el.hidden = false;
    const recents = await app.io.listRecent();
    const grid = h('div', { class: 'recent' }, recents.length ? recents.map((r) => h('div', { class: 'rcard', onclick: () => { S.hide(); app.io.openRecent(r.name); } },
      h('div', { class: 'img', style: r.thumb ? { backgroundImage: `url(${r.thumb})` } : {} }, r.thumb ? '' : 'DWG'),
      h('div', { class: 'nm', text: r.name }), h('div', { class: 'dt', text: new Date(r.t).toLocaleString() }))) : h('div', { class: 'hint', text: 'Todavía no hay dibujos recientes. Abra un DWG/DXF o empiece uno nuevo.' }));
    el.replaceChildren(
      h('div', { class: 'side' }, h('h1', { text: 'WebCAD 2023' }),
        h('button', { class: 'btn pri', type: 'button', onclick: () => { S.hide(); app.io.open(); } }, 'Open...'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.io.newDrawing(true); } }, 'New'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.ui.loadSample(); } }, 'Dibujo de ejemplo'),
        h('div', { style: { height: '12px' } }),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.cmd.run('APPLOAD'); } }, 'Load Application (LISP)...'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.cmd.run('HELP'); } }, 'Commands & Help'),
        h('p', { class: 'hint', style: { color: '#c9d1dc', marginTop: 'auto' }, text: 'Arrastre aquí archivos .dwg, .dxf, .lsp o .scr para abrirlos o cargarlos.' })),
      h('div', { class: 'main' }, h('h2', { text: 'Recent' }), grid));
    app.ui.renderFileTabs();
  };
  S.hide = () => { if (el) el.hidden = true; app.ui.renderFileTabs(); };
  S.visible = () => el && !el.hidden;
  return S;
}
