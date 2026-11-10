// Pestaña Inicio: columna con Abrir/Nuevo y enlaces, y «Recientes» en tarjetas o en lista
import { h } from './dom.js';
import { LOGO } from './icons.js';
import { LANGS } from '../core/i18n.js';
import { TEMPLATES } from '../core/templates.js';

const FILE_ICON = '<svg viewBox="0 0 46 56" aria-hidden="true"><path d="M2 2h28l14 14v38H2z" fill="#c9d1dc"/><path d="M30 2v14h14" fill="#9aa5b4"/></svg>';
const GRID_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z" fill="currentColor"/></svg>';
const LIST_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2h14v2H1zM1 7h14v2H1zM1 12h14v2H1z" fill="currentColor"/></svg>';

export function createStart(app) {
  const host = document.getElementById('host');
  let el = null, view = 'grid', page = 'recent';
  const S = {};
  const menu = (ev, items) => { const r = ev.currentTarget.getBoundingClientRect(); app.ui.popup(r.left, r.bottom, items); };
  S.show = async () => {
    if (!el) { el = h('div', { id: 'start' }); host.append(el); }
    el.hidden = false;
    const recents = await app.io.listRecent();
    const go = (fn) => () => { S.hide(); fn(); };
    const card = (r) => h('div', { class: 'rcard', title: r.name, onclick: go(() => app.io.openRecent(r.name)) },
      r.thumb ? h('div', { class: 'img', style: { backgroundImage: `url(${r.thumb})` } }) : h('div', { class: 'img blank', html: FILE_ICON }),
      h('div', { class: 'nm', text: r.name.replace(/\.(dwg|dxf|wcad)$/i, '') }), h('div', { class: 'dt', text: new Date(r.t).toLocaleString() }),
      h('button', { class: 'kebab', type: 'button', title: 'Opciones', text: '⋮', onclick: (e) => { e.stopPropagation(); menu(e, [['Abrir', () => { S.hide(); app.io.openRecent(r.name); }], ['Quitar de la lista', async () => { await app.io.removeRecent(r.name); S.show(); }]]); } }));
    const seg = (cur, opts, set, cls = '') => h('div', { class: 'seg ' + cls }, opts.map(([v, l]) => h('button', { type: 'button', class: v === cur ? 'on' : '', 'aria-pressed': String(v === cur), onclick: () => { set(v); S.show(); } }, l)));
    const split = (label, fn, items) => h('div', { class: 'split' }, h('button', { class: 'm', type: 'button', onclick: go(fn) }, label), h('button', { class: 'd', type: 'button', title: 'Más opciones', text: '▾', onclick: (e) => menu(e, items) }));
    const nav = (id, label) => h('a', { class: page === id ? 'on' : '', onclick: () => { page = id; S.show(); } }, label);
    let main;
    if (page === 'recent') {
      main = [h('div', { class: 'mh' }, h('h2', { text: 'Recientes' })),
        h('div', { class: 'views' }, h('button', { type: 'button', class: view === 'list' ? 'on' : '', title: 'Lista', html: LIST_ICON, onclick: () => { view = 'list'; S.show(); } }), h('button', { type: 'button', class: view === 'grid' ? 'on' : '', title: 'Miniaturas', html: GRID_ICON, onclick: () => { view = 'grid'; S.show(); } })),
        recents.length ? h('div', { class: 'recent' + (view === 'list' ? ' list' : '') }, recents.map(card)) : h('div', { class: 'hint', text: 'Todavía no hay dibujos recientes. Abra un DWG/DXF o empiece uno nuevo.' })];
    } else {
      main = [h('div', { class: 'mh' }, h('h2', { text: 'Aprendizaje' })),
        h('div', { class: 'recent' }, [['Dibujo de ejemplo', 'Brida con cotas, sombreado y un bloque dinámico.', () => app.ui.loadSample()], ['Referencia de comandos', 'Todos los comandos en castellano e inglés, con sus alias.', () => app.cmd.run('HELP')], ['Rutinas LISP', 'Cargue rutinas .lsp, .dcl y guiones .scr.', () => app.cmd.run('APPLOAD')], ['Plantillas', 'Nuevo dibujo con capas normalizadas y cajetín.', () => app.cmd.run('NEW')]]
          .map(([t, d, fn]) => h('div', { class: 'rcard', onclick: go(fn) }, h('div', { class: 'img blank', html: FILE_ICON }), h('div', { class: 'nm', text: t }), h('div', { class: 'dt', text: d }))))];
    }
    el.replaceChildren(
      h('div', { class: 'side' },
        h('div', { class: 'brand', html: LOGO }, h('h1', {}, 'WebCAD', h('i', { text: 'Libre' }))),
        split('Abrir...', () => app.io.open(), [['Abrir...', () => { S.hide(); app.io.open(); }], ['Abrir de la nube...', () => { S.hide(); app.cmd.run('CLOUDOPEN'); }], ['Dibujo de ejemplo', () => { S.hide(); app.ui.loadSample(); }]]),
        split('Nuevo', () => app.io.newDrawing(true), [['Nuevo', () => { S.hide(); app.io.newDrawing(true); }], null, ...TEMPLATES.map((t) => [t.name, () => { S.hide(); app.io.newFromTemplate(t.id); }, t.ws3d ? 'box' : 'template']), null, ['Examinar plantillas...', () => { S.hide(); app.cmd.run('NEW'); }]]),
        h('nav', {}, nav('recent', 'Recientes'), nav('learn', 'Aprendizaje')),
        h('div', { class: 'prefs' },
          h('label', { text: 'Tema' }), seg(app.settings.theme, [['light', 'Claro'], ['mid', 'Intermedio'], ['dark', 'Oscuro']], (v) => app.ui.setTheme(v)),
          h('label', { text: 'Idioma' }), seg(app.settings.lang || 'es', Object.entries(LANGS), (v) => app.ui.setLang(v), 'langs')),
        h('div', { class: 'links' },
          h('a', { onclick: go(() => app.cmd.run('HELP')) }, 'Comandos y ayuda'),
          h('a', { onclick: go(() => app.cmd.run('APPLOAD')) }, 'Cargar aplicación (LISP)...'),
          h('a', { onclick: go(() => app.cmd.run('OPTIONS')) }, 'Opciones'),
          h('a', { onclick: go(() => app.cmd.run('ABOUT')) }, 'Acerca de WebCAD Libre')),
        h('p', { class: 'hint', text: 'Arrastre aquí archivos .dwg, .dxf, .lsp o .scr para abrirlos o cargarlos.' })),
      h('div', { class: 'main' }, ...main));
    app.ui.renderFileTabs();
  };
  S.hide = () => { if (el) el.hidden = true; app.ui.renderFileTabs(); };
  S.visible = () => el && !el.hidden;
  return S;
}
