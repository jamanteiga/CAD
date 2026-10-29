// Ensamblado de la interfaz
import { h } from './dom.js';
import { icon } from './icons.js';
import { createDialogs, keyName } from './dialogs.js';
import { extendDialogs } from './dialogs2.js';
import { createCmdline, createDyn } from './cmdline.js';
import { createRibbon } from './ribbon.js';
import { createMenu12, createMacroRunner } from './menu12.js';
import { createLayers } from './layers.js';
import { createProps } from './props.js';
import { createVlide } from './vlide.js';
import { createStart } from './start.js';
import { createLibrary } from './library.js';
import { saveSettings, THEMES } from '../app.js';
import { setLang, t, tKnown, trPrompt, kwInfos, missing, dispCmd } from '../core/i18n.js';
import { fmt } from '../core/geom.js';
import * as E from '../core/entities.js';

export function createUI(app) {
  const ui = {};
  app.ui = ui;
  ui.dlg = createDialogs(app);
  extendDialogs(app, ui.dlg);
  ui.cmdline = createCmdline(app);
  ui.dyn = createDyn(app);
  ui.runMacro = createMacroRunner(app);
  ui.ribbon = createRibbon(app);
  ui.menu12 = createMenu12(app);
  ui.layers = createLayers(app);
  ui.props = createProps(app);
  ui.vlide = createVlide(app);
  ui.start = createStart(app);
  ui.library = createLibrary(app);
  ui.showProperties = (on) => ui.props.show(on);

  // ---- barra de título / acceso rápido
  const qat = document.getElementById('qat');
  const buildQat = () => { qat.innerHTML = ''; for (const [c, i, t] of [['NEW', 'new', 'Nuevo (Ctrl+N)'], ['OPEN', 'open', 'Abrir (Ctrl+O)'], ['QSAVE', 'save', 'Guardar (Ctrl+S)'], ['SAVEAS', 'saveas', 'Guardar como (Ctrl+Mayús+S)'], ['PLOT', 'plot', 'Trazar (Ctrl+P)'], ['U', 'undo', 'Deshacer (Ctrl+Z)'], ['REDO', 'redo', 'Rehacer (Ctrl+Y)']]) qat.append(h('button', { title: t, html: icon(i), onclick: () => ui.runMacro('^C^C' + c) })); };
  buildQat();
  document.getElementById('appbtn').onclick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    ui.popup(r.left, r.bottom, [['Nuevo', 'NEW', 'new'], ['Abrir...', 'OPEN', 'open'], ['Guardar', 'QSAVE', 'save'], ['Guardar como...', 'SAVEAS', 'saveas'], null, ['Importar...', 'DXFIN', 'dxf'], ['Exportar DXF...', 'DXFOUT', 'dxf'], ['Exportar PDF...', 'EXPORTPDF', 'pdf'], ['Exportar SVG...', 'SVGOUT', 'svg'], ['Exportar PNG...', 'PNGOUT', 'png'], null, ['Imprimir / Trazar...', 'PLOT', 'plot'], ['Utilidades de dibujo: Limpiar', 'PURGE', 'purge'], ['Utilidades de dibujo: Revisar', 'AUDIT', 'audit'], null, ['Cerrar', 'CLOSE', 'close'], ['Opciones', 'OPTIONS', 'options'], ['Acerca de', 'ABOUT', 'help']]);
  };
  const ws = document.getElementById('wsSel');
  ws.onchange = () => {
    const s = app.settings;
    if (ws.value === 'classic') Object.assign(s, { ribbon: false, menuBar: true, screenMenu: true });
    else if (ws.value === 'both') Object.assign(s, { ribbon: true, menuBar: true, screenMenu: true });
    else Object.assign(s, { ribbon: true, menuBar: false, screenMenu: false });
    saveSettings(); ui.applyLayout();
  };
  const search = document.getElementById('searchBox');
  search.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') { const q = search.value.trim(); search.value = ''; if (q) app.cmd.run(q); ui.cmdline.forceFocus(); } };

  ui.setTitle = () => {
    const d = app.doc;
    document.getElementById('title').innerHTML = '';
    document.getElementById('title').append(h('b', { text: d.name + (d.modified ? '*' : '') }), ' — WebCAD Libre');
    document.title = `${d.name.replace(/\.dwg$/i, '')} — WebCAD Libre`;
    ui.renderFileTabs();
  };
  ui.renderFileTabs = () => {
    const ft = document.getElementById('filetabs'); ft.innerHTML = '';
    const startOn = ui.start.visible?.();
    ft.append(h('div', { class: 'ft' + (startOn ? ' on' : ''), text: 'Inicio', onclick: () => ui.start.show() }));
    for (const d of app.docs) ft.append(h('div', { class: 'ft' + (!startOn && d === app.doc ? ' on' : ''), onclick: () => { ui.start.hide(); app.switchDoc(d); } }, d.name.replace(/\.dwg$/i, '') + (d.modified ? '*' : ''), h('span', { class: 'x', text: '×', title: 'Cerrar', onclick: (e) => { e.stopPropagation(); app.closeDoc(d); } })));
    ft.append(h('span', { class: 'plus', text: '+', title: 'Dibujo nuevo', onclick: () => { ui.start.hide(); app.io.newDrawing(true); } }));
  };
  ui.renderLayoutTabs = () => {
    const lt = document.getElementById('ltabs'); lt.innerHTML = '';
    const d = app.doc;
    const tab = (name) => {
      const el = h('div', { class: 'lt' + (d.active === name ? ' on' : ''), text: name === 'Model' ? 'Modelo' : name, onclick: () => app.setLayout(name) });
      if (name !== 'Model') el.oncontextmenu = (e) => { e.preventDefault(); ui.popup(e.clientX, e.clientY - 120, [['Nueva presentación', 'LAYOUT _N'], ['Renombrar...', `LAYOUT _R "${name}"`], ['Suprimir', `LAYOUT _D "${name}"`], ['Copiar (desplazar o copiar)', 'LAYOUT _C'], ['Configurar página / Trazar...', 'PLOT']]); };
      lt.append(el);
    };
    tab('Model'); for (const l of d.layouts) tab(l.name);
    lt.append(h('span', { class: 'plus', text: '+', title: 'Nueva presentación', onclick: () => ui.runMacro('^C^CLAYOUT _N ;') }));
  };

  // ---- barra de estado
  const status = document.getElementById('status'), coords = document.getElementById('coords');
  const sbtn = (label, title, on, fn, menu) => { const b = h('button', { class: 'stb' + (on ? ' on' : ''), title, text: label, onclick: fn }); if (menu) b.oncontextmenu = (e) => { e.preventDefault(); menu(e); }; return b; };
  const chk = (label, title, on, fn) => h('label', { class: 'stchk', title }, h('input', { type: 'checkbox', checked: on, onchange: (e) => fn(e.target.checked) }), label);
  ui.status = {
    update() {
      const d = app.doc, v = d.vars, s = app.settings;
      status.innerHTML = '';
      const tog = (n) => () => { d.setvar(n, v[n] ? 0 : 1); ui.status.update(); app.view.redraw(); };
      status.append(
        sbtn(d.active === 'Model' ? 'MODELO' : d.mspace ? 'MODELO' : 'PAPEL', 'Espacio modelo o papel', d.active !== 'Model' && !d.mspace, () => { if (d.active !== 'Model') app.cmd.run(d.mspace ? 'PSPACE' : 'MSPACE'); }),
        sbtn('REJILLA', 'Mostrar rejilla del dibujo (F7)', v.GRIDMODE, tog('GRIDMODE')),
        sbtn('FORZC', 'Modo forzcursor (F9)', v.SNAPMODE, tog('SNAPMODE')),
        sbtn('ORTO', 'Modo orto (F8)', v.ORTHOMODE, () => { d.setvar('ORTHOMODE', v.ORTHOMODE ? 0 : 1); if (v.ORTHOMODE) d.setvar('POLARMODE', 0); ui.status.update(); }),
        sbtn('POLAR', 'Rastreo polar (F10)', v.POLARMODE, () => { d.setvar('POLARMODE', v.POLARMODE ? 0 : 1); if (v.POLARMODE) d.setvar('ORTHOMODE', 0); ui.status.update(); }, () => app.cmd.run('DSETTINGS')),
        sbtn('REFENT', 'Referencia a objetos (F3) — clic derecho: modos', !(v.OSMODE & 16384), () => { d.setvar('OSMODE', v.OSMODE ^ 16384); ui.status.update(); }, (e) => ui.osnapMenu(e)),
        sbtn('RASTREO', 'Rastreo de referencias a objetos (F11)', !!(v.AUTOSNAP & 16), () => { d.setvar('AUTOSNAP', v.AUTOSNAP ^ 16); ui.status.update(); }),
        sbtn('GLN', 'Mostrar/ocultar grosor de línea', v.LWDISPLAY, () => { d.setvar('LWDISPLAY', v.LWDISPLAY ? 0 : 1); ui.status.update(); app.view.redraw(); }),
        sbtn('DIN', 'Entrada dinámica (F12)', v.DYNMODE, tog('DYNMODE')),
        chk('Menú clásico', 'Mostrar el menú de pantalla lateral clásico', !!s.screenMenu, (on) => { s.screenMenu = on; saveSettings(); ui.applyLayout(); }),
        chk('Barra menús', 'Mostrar la barra de menús clásica', !!s.menuBar, (on) => { s.menuBar = on; saveSettings(); ui.applyLayout(); }),
        h('button', { class: 'stb', title: 'Personalización', html: '≡', onclick: (e) => ui.popup(e.clientX - 200, e.clientY - 230, [['Opciones...', 'OPTIONS'], ['Parámetros de dibujo...', 'DSETTINGS'], ['Atajos y alias (CUI)...', 'CUI'], ['Cargar menú .MNU...', 'MENU'], null, ['Pantalla limpia (cinta sí/no)', () => { s.ribbon = !s.ribbon; saveSettings(); ui.applyLayout(); }], ['Historial de comandos (F2)', 'TEXTSCR']]) }),
      );
    },
    coords(p) { coords.textContent = `${fmt(p.x, 4)}, ${fmt(p.y, 4)}, 0.0000`; },
  };
  ui.osnapMenu = (e) => {
    const v = app.doc.vars;
    const modes = [['Punto final', 1], ['Punto medio', 2], ['Centro', 4], ['Punto', 8], ['Cuadrante', 16], ['Intersección', 32], ['Inserción', 64], ['Perpendicular', 128], ['Tangente', 256], ['Cercano', 512], ['Intersección ficticia', 2048]];
    ui.popup(e.clientX - 120, e.clientY - 330, [...modes.map(([n, b]) => [n, () => { v.OSMODE ^= b; ui.status.update(); }, null, !!(v.OSMODE & b)]), null, ['Parámetros de referencia a objetos...', 'DSETTINGS']]);
  };

  // ---- menú emergente genérico: items [label, cmd|fn, icon, checked] | null
  let popEl = null;
  ui.popup = (x, y, items) => {
    popEl?.remove();
    popEl = h('div', { class: 'dropmenu ctxmenu', style: { left: Math.max(0, x) + 'px', top: Math.max(0, y) + 'px' } }, items.map((it) => (it ? h('div', { class: 'it' + (it[3] ? ' chk' : ''), onclick: () => { popEl?.remove(); popEl = null; if (typeof it[1] === 'function') it[1](); else ui.runMacro('^C^C' + it[1]); } }, it[2] ? h('span', { class: 'ico', html: icon(it[2]) }) : h('span', { class: 'ico' }), it[0]) : h('div', { class: 'sep' }))));
    document.body.append(popEl);
    const r = popEl.getBoundingClientRect();
    if (r.right > innerWidth) popEl.style.left = innerWidth - r.width - 4 + 'px';
    if (r.bottom > innerHeight) popEl.style.top = Math.max(0, innerHeight - r.height - 4) + 'px';
  };
  document.addEventListener('pointerdown', (e) => { if (popEl && !popEl.contains(e.target)) { popEl.remove(); popEl = null; } }, true);
  ui.gripMenu = (g, sx, sy) => {
    const r = document.getElementById('host').getBoundingClientRect(), eng = app.cmd, items = [['Estirar', () => eng.gripAction(g, 'stretch')]];
    if (g.vi != null) { items.push(['Añadir vértice', () => eng.gripAction(g, 'add')]); if (g.ent.pts.length > 2) items.push(['Eliminar vértice', () => eng.gripAction(g, 'del')]); }
    else if (g.si != null) { items.push(['Añadir vértice', () => eng.gripAction(g, 'add')]); items.push(g.arcSeg ? ['Convertir en línea', () => eng.gripAction(g, 'line')] : ['Convertir en arco', () => eng.gripAction(g, 'arc')]); }
    else if (g.le) items.push(['Alargar', () => eng.gripAction(g, 'lengthen')]);
    ui.popup(r.left + sx + 10, r.top + sy + 10, items);
  };
  ui.contextMenu = (info) => {
    const eng = app.cmd, x = info.ev.clientX, y = info.ev.clientY;
    const items = [];
    if (eng.lastCmd) { const rn = eng.resolveName(eng.lastCmd); items.push([t('Repetir {0}', rn && !rn.startsWith('C:') ? dispCmd(rn) : String(eng.lastCmd).toUpperCase()), eng.lastCmd]); }
    items.push(null);
    if (eng.sel.length) items.push(['Borrar', 'ERASE', 'erase'], ['Desplazar', 'MOVE', 'move'], ['Copiar selección', 'COPY', 'copy'], ['Escala', 'SCALE', 'scale'], ['Girar', 'ROTATE', 'rotate'], null, ['Cortar', 'CUTCLIP', 'cutclip'], ['Copiar', 'COPYCLIP', 'copyclip'], ['Copiar con punto base', 'COPYBASE', 'copyclip']);
    items.push(['Pegar', 'PASTECLIP', 'paste'], ['Pegar como bloque', 'PASTEBLOCK', 'paste'], null);
    if (eng.sel.length) items.push(['Seleccionar similares', 'SELECTSIMILAR', 'qselect'], ['Deseleccionar todo', () => eng.clearSel()], null);
    if (eng.sel.length === 1 && eng.sel[0].type === 'INSERT') items.push(['Editor de bloques', () => { eng.bedName = eng.sel[0].name; eng.clearSel(); eng.run('BEDIT'); }, 'bedit'], ['Editar atributos...', 'EATTEDIT', 'attedit']);
    items.push(['Deshacer', 'U', 'undo'], ['Rehacer', 'REDO', 'redo'], ['Encuadre', 'PAN', 'pan'], ['Zoom extensión', 'ZOOM _E', 'zoomext'], null, ['Selección rápida...', 'QSELECT', 'qselect'], ['Buscar...', 'FIND', 'find'], ['Propiedades', 'PROPERTIES', 'properties'], ['Opciones...', 'OPTIONS', 'options']);
    ui.popup(x, y, items);
  };
  ui.visMenu = (g) => {
    const s = app.view.toScreen(g.p), r = document.getElementById('host').getBoundingClientRect();
    const e = g.ent, blk = app.doc.blocks[e.name], cur = (e.dyn || {})[g.param.name] ?? E.dynDefaults(blk)[g.param.name];
    const states = g.param.type === 'lookup' ? (g.param.rows || []).map((x) => ({ name: x.label })) : g.param.states;
    ui.popup(r.left + s.x + 8, r.top + s.y + 8, states.map((st) => [st.name, () => { app.doc.begin('GRIP'); app.doc.touch(e); e.dyn = { ...E.dynDefaults(blk), ...(e.dyn || {}), [g.param.name]: st.name }; E.invalidate(e); app.doc.end(); app.cmd.updateGrips(); app.view.redraw(); }, null, st.name === cur]));
  };

  // ---- editor de bloques
  ui.enterBlockEditor = (name) => { ui.ribbon.showContext('bedit'); ui.refresh(); void name; };
  ui.exitBlockEditor = () => { ui.ribbon.hideContext('bedit'); ui.refresh(); };

  // ---- disposición
  // ---- tema (oscuro / intermedio / claro)
  ui.setTheme = (th) => {
    const s = app.settings, old = THEMES[s.theme] || THEMES.dark, nu = THEMES[th] || THEMES.dark;
    if (!s.bgModel || s.bgModel === old.model) s.bgModel = nu.model; // conserva un fondo elegido por el usuario
    if (!s.bgLayoutOut || s.bgLayoutOut === old.out) s.bgLayoutOut = nu.out;
    s.theme = THEMES[th] ? th : 'dark';
    saveSettings(); ui.applyLayout(); ui.refresh(); app.view.redraw();
    if (ui.start.visible?.()) ui.start.show();
  };
  // ---- idioma de la interfaz (castellano / galego / English)
  const staticEls = [...document.querySelectorAll('#titlebar [title], #titlebar [placeholder], #titlebar [aria-label], #cmd [title], #cmd [placeholder], #cmd [aria-label], #wsSel option')];
  for (const el of staticEls) for (const a of ['title', 'placeholder', 'aria-label']) if (el.hasAttribute(a)) el.dataset['es' + a.replace('-', '')] = el.getAttribute(a);
  for (const el of document.querySelectorAll('#wsSel option')) el.dataset.estext = el.textContent;
  ui.translateStatic = () => {
    for (const el of staticEls) for (const a of ['title', 'placeholder', 'aria-label']) { const v = el.dataset['es' + a.replace('-', '')]; if (v != null) el.setAttribute(a, tKnown(v)); }
    for (const el of document.querySelectorAll('#wsSel option')) el.textContent = tKnown(el.dataset.estext);
    document.getElementById('langSel').value = app.settings.lang || 'es';
  };
  ui.setLang = (l) => {
    setLang(l); app.settings.lang = l; saveSettings();
    ui.translateStatic(); buildQat();
    ui.menu12.renderBar(); ui.menu12.renderScreen();
    ui.layers.rebuild?.(); ui.props.rebuild?.(); ui.vlide.rebuild?.(); ui.library.rebuild?.();
    const r = app.cmd.req;
    if (r && !r.raw) { const li = kwInfos((r.kws || []).map((k) => k.name)); r.kws = (r.kws || []).map((k, i) => { const { es, esKey, ...rest } = k; void es; void esKey; return { ...rest, ...li[i] }; }); r.display = trPrompt(r.prompt); ui.cmdline.setPrompt(r.display, r.kws); }
    else if (!r) ui.cmdline.setPrompt('');
    if (ui.start.visible?.()) ui.start.show();
    ui.refresh(); ui.status.update(); app.view.redraw();
  };
  ui.missingStrings = () => [...missing];
  document.getElementById('langSel').onchange = (e) => ui.setLang(e.target.value);
  ui.applyLayout = () => {
    const s = app.settings;
    document.documentElement.dataset.ui = THEMES[s.theme] ? s.theme : 'dark';
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', (THEMES[s.theme] || THEMES.dark).meta);
    document.getElementById('ribbon').hidden = !s.ribbon;
    document.getElementById('menubar').hidden = !s.menuBar;
    document.getElementById('screen').hidden = !s.screenMenu;
    document.getElementById('filetabs').hidden = s.fileTabs === false;
    document.getElementById('ltabs').hidden = s.layoutTabs === false;
    ws.value = !s.ribbon && s.menuBar ? 'classic' : s.ribbon && (s.menuBar || s.screenMenu) ? 'both' : 'ribbon';
    app.doc.vars.PICKBOX = s.pickbox || app.doc.vars.PICKBOX;
    ui.ribbon.render(); ui.status.update();
    app.view.resize(); app.view.redraw();
  };
  ui.refresh = () => {
    if (ui._rq) return;
    ui._rq = requestAnimationFrame(() => {
      ui._rq = null;
      ui.ribbon.render(); ui.props.render(); ui.layers.render(); ui.status.update(); ui.renderLayoutTabs(); ui.setTitle();
      const d = app.doc, tag = document.getElementById('vptag');
      tag.innerHTML = '';
      tag.append(t('[-][Superior][Estructura alámbrica 2D]'), d.blockEdit ? h('b', { text: `  Editor de bloques: ${d.blockEdit.name}` }) : '', d.active !== 'Model' ? '  ' + t(d.mspace ? 'MODELO (ventana)' : 'PAPEL') : '');
      const be = d.blockEdit;
      let bar = document.getElementById('bedbar');
      if (be) {
        const vis = be.params.find((p) => p.type === 'visibility');
        if (!bar) { bar = h('div', { id: 'bedbar' }); document.getElementById('host').append(bar); }
        bar.replaceChildren(t('Editor de bloques — {0}', be.name), vis ? h('select', { title: 'Estado de visibilidad', onchange: (e) => ui.runMacro(`^C^CBVSTATE _S "${e.target.value}"`) }, vis.states.map((s) => h('option', { value: s.name, selected: s.name === be.curVis, text: s.name }))) : '', h('button', { type: 'button', text: 'Cerrar editor de bloques', onclick: () => ui.runMacro('^C^CBCLOSE') }));
      } else bar?.remove();
    });
  };

  // ---- teclado global
  window.addEventListener('keydown', (e) => {
    if (document.querySelector('.modal')) return;
    const t = e.target, eng = app.cmd;
    const inOther = t && t !== ui.cmdline._input && /INPUT|TEXTAREA|SELECT/.test(t.tagName) && t.id !== 'cmdin';
    const kn = keyName(e);
    const user = app.settings.shortcuts?.[kn];
    if (user && !inOther) { e.preventDefault(); ui.runMacro(/[;^\\ ]/.test(user) ? user : '^C^C' + user); return; }
    if (e.key === 'Escape') { if (inOther) return; e.preventDefault(); eng.cancel(); document.getElementById('cmdin').value = ''; ui.start.visible?.() && app.docs.length && ui.start.hide(); return; }
    const fk = { F1: 'HELP', F2: 'TEXTSCR' }[e.key];
    if (fk) { e.preventDefault(); eng.run(fk, { transparent: !!eng.active }); return; }
    const tg = { F3: () => app.doc.setvar('OSMODE', app.doc.vars.OSMODE ^ 16384), F7: () => app.doc.setvar('GRIDMODE', app.doc.vars.GRIDMODE ? 0 : 1), F8: () => { app.doc.setvar('ORTHOMODE', app.doc.vars.ORTHOMODE ? 0 : 1); if (app.doc.vars.ORTHOMODE) app.doc.setvar('POLARMODE', 0); }, F9: () => app.doc.setvar('SNAPMODE', app.doc.vars.SNAPMODE ? 0 : 1), F10: () => { app.doc.setvar('POLARMODE', app.doc.vars.POLARMODE ? 0 : 1); if (app.doc.vars.POLARMODE) app.doc.setvar('ORTHOMODE', 0); }, F5: () => app.cycleIsoplane?.(), F11: () => app.doc.setvar('AUTOSNAP', app.doc.vars.AUTOSNAP ^ 16), F12: () => app.doc.setvar('DYNMODE', app.doc.vars.DYNMODE ? 0 : 1) }[e.key];
    if (tg) { e.preventDefault(); tg(); app.log(`<${e.key} toggled>`); ui.status.update(); app.view.updateCursor(); app.view.redraw(); return; }
    if (inOther) return;
    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      const map = { z: 'U', y: 'REDO', c: 'COPYCLIP', x: 'CUTCLIP', v: e.shiftKey ? 'PASTEBLOCK' : 'PASTECLIP', s: e.shiftKey ? 'SAVEAS' : 'QSAVE', o: 'OPEN', n: 'NEW', p: 'PLOT', 1: 'PROPERTIES', 2: 'INSERT', 3: 'LAYER', 9: null, 0: null, a: null, f: 'FIND' };
      if (k in map) {
        e.preventDefault();
        if (k === 'a' && e.shiftKey) { app.doc.setvar('PICKSTYLE', app.doc.vars.PICKSTYLE & 1 ? 0 : 1); app.log(`<Grupos ${app.doc.vars.PICKSTYLE & 1 ? 'activados' : 'desactivados'}>`); return; }
        if (k === 'a') { eng.setSel(app.doc.space.filter((x) => app.doc.isVisible(x))); return; }
        if (k === '9') { document.getElementById('cmd').classList.toggle('nohist'); return; }
        if (k === '0') { app.settings.ribbon = !app.settings.ribbon; ui.applyLayout(); return; }
        if (k === 'c' && document.getSelection()?.toString()) return;
        ui.runMacro('^C^C' + map[k]); return;
      }
      return;
    }
    if (e.key === 'Delete' && !eng.req && eng.sel.length && !document.getElementById('cmdin').value) { e.preventDefault(); eng.run('ERASE'); return; }
    if (t !== document.getElementById('cmdin') && e.key.length === 1 && !e.altKey) document.getElementById('cmdin').focus({ preventScroll: true });
    if (t !== document.getElementById('cmdin') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ui.cmdline.submit(document.getElementById('cmdin').value); }
  });

  // arrastrar y soltar archivos
  const host = document.getElementById('app');
  host.addEventListener('dragover', (e) => { e.preventDefault(); });
  host.addEventListener('drop', async (e) => {
    e.preventDefault();
    for (const f of e.dataTransfer.files) {
      if (/\.(lsp|mnl)$/i.test(f.name)) { const t = await f.text(); app.lisp.addFile(f.name, t); await app.lisp.loadText(t, f.name); app.log(`${f.name} successfully loaded.`); }
      else if (/\.scr$/i.test(f.name)) app.lisp.runScript(await f.text());
      else if (/\.(mnu|mns)$/i.test(f.name)) ui.menu12.loadMNU(await f.text(), f.name);
      else if (/\.(dwg|dxf|wcad|json)$/i.test(f.name)) { ui.start.hide(); await app.io.openFile(f); }
    }
  });
  return ui;
}
