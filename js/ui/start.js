// Pestaña Inicio (Start)
import { h } from './dom.js';
import { LOGO } from './icons.js';
import { LANGS } from '../core/i18n.js';

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
    const seg = (cur, opts, set, cls = '') => h('div', { class: 'seg ' + cls }, opts.map(([v, l]) => h('button', { type: 'button', class: v === cur ? 'on' : '', 'aria-pressed': String(v === cur), onclick: () => { set(v); S.show(); } }, l)));
    el.replaceChildren(
      h('div', { class: 'side' },
        h('div', { class: 'brand', html: LOGO }, h('h1', {}, 'WebCAD', h('i', { text: 'Libre' }))),
        h('p', { class: 'tag', text: 'Dibujo técnico 2D, libre y en el navegador.' }),
        h('button', { class: 'btn pri', type: 'button', onclick: () => { S.hide(); app.io.open(); } }, 'Abrir...'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.io.newDrawing(true); } }, 'Nuevo'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.cmd.run('NEW'); } }, 'Nuevo desde plantilla...'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.ui.loadSample(); } }, 'Dibujo de ejemplo'),
        h('div', { class: 'sep' }),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.cmd.run('APPLOAD'); } }, 'Cargar aplicación (LISP)...'),
        h('button', { class: 'btn', type: 'button', onclick: () => { S.hide(); app.cmd.run('HELP'); } }, 'Comandos y ayuda'),
        h('div', { class: 'prefs' },
          h('label', { text: 'Tema' }), seg(app.settings.theme, [['dark', 'Oscuro'], ['mid', 'Intermedio'], ['light', 'Claro']], (v) => app.ui.setTheme(v)),
          h('label', { text: 'Idioma' }), seg(app.settings.lang || 'es', Object.entries(LANGS), (v) => app.ui.setLang(v), 'langs')),
        h('p', { class: 'hint', text: 'Arrastre aquí archivos .dwg, .dxf, .lsp o .scr para abrirlos o cargarlos.' })),
      h('div', { class: 'main' }, h('h2', { text: 'Recientes' }), grid));
    app.ui.renderFileTabs();
  };
  S.hide = () => { if (el) el.hidden = true; app.ui.renderFileTabs(); };
  S.visible = () => el && !el.hidden;
  return S;
}
