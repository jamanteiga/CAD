// Cuadros de diálogo
import { h, draggable } from './dom.js';
import { ACI, aciCss, LINETYPES, LWEIGHTS, lwName, HATCHES, PAPER, colorName } from '../core/tables.js';
import { drawThumb, hatchSwatch } from './thumb.js';
import { icon } from './icons.js';
import * as E from '../core/entities.js';
import { OS } from '../view/snap.js';
import { DEFAULT_ALIASES } from '../cmd/engine.js';
import { saveSettings } from '../app.js';
import { ES_NAME, GL_NAME, PT_NAME, CA_NAME, norm, LANGS, t, dispCmd } from '../core/i18n.js';

export function createDialogs(app) {
  const dlg = {};
  const doc = () => app.doc;

  function open({ title, body, buttons = [{ t: 'Aceptar', v: 'ok', pri: true }, { t: 'Cancelar', v: null }], onOk, width, init }) {
    return new Promise((resolve) => {
      const prevFocus = document.activeElement;
      const close = (v) => { m.remove(); document.removeEventListener('keydown', key, true); prevFocus?.focus?.(); app.ui?.cmdline?.focus?.(); resolve(v); };
      const bodyEl = h('div', { class: 'dlg-b' }, body);
      const foot = h('div', { class: 'dlg-f' }, buttons.map((b) => h('button', { class: 'btn' + (b.pri ? ' pri' : ''), type: 'button', onclick: async () => { if (b.v === 'ok' && onOk) { const r = await onOk(); if (r === false) return; close(r); } else close(typeof b.v === 'function' ? b.v() : b.v); } }, b.t)));
      const head = h('div', { class: 'dlg-h' }, h('span', { text: title }), h('span', { class: 'sp' }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => close(null) }));
      const box = h('div', { class: 'dlg', role: 'dialog', 'aria-label': title, style: width ? { width } : {} }, head, bodyEl, foot);
      const m = h('div', { class: 'modal' }, box);
      const key = (e) => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(null); }
        if (e.key === 'Enter' && !(e.target.tagName === 'TEXTAREA') && !e.target.readOnly && e.target.tagName !== 'BUTTON' && !e.shiftKey) { e.stopPropagation(); e.preventDefault(); foot.querySelector('.pri')?.click(); }
      };
      document.addEventListener('keydown', key, true);
      document.body.append(m);
      box.style.position = 'relative';
      draggable(box, head);
      init?.(box, close);
      setTimeout(() => (box.querySelector('[autofocus]') || box.querySelector('input,select,textarea,.btn.pri'))?.focus(), 30);
    });
  }
  dlg.open = open;
  dlg.alert = (msg) => open({ title: 'WebCAD', body: h('div', { style: { whiteSpace: 'pre-wrap', maxWidth: '520px' } }, msg), buttons: [{ t: 'Aceptar', v: true, pri: true }] });
  dlg.confirm = async (msg) => !!(await open({ title: 'WebCAD - Alerta', body: h('div', { style: { whiteSpace: 'pre-wrap' } }, msg), buttons: [{ t: 'Sí', v: true, pri: true }, { t: 'No', v: false }] }));
  dlg.prompt = (title, label, val = '') => { const inp = h('input', { class: 'fld', type: 'text', value: val, autofocus: true }); return open({ title, body: h('div', { class: 'frm' }, h('label', { text: label }), inp), onOk: () => inp.value }); };

  // formulario genérico: fields [{k,l,v,t:'text'|'number'|'check'|'select'|'color',opts}]
  dlg.form = (title, fields, extra) => {
    const inputs = {};
    const rows = fields.map((f) => {
      let el;
      if (f.t === 'check') el = h('input', { type: 'checkbox', checked: !!f.v });
      else if (f.t === 'select') el = h('select', {}, (f.opts || []).map((o) => h('option', { value: typeof o === 'object' ? o.v : o, selected: (typeof o === 'object' ? o.v : o) == f.v }, typeof o === 'object' ? o.l : o)));
      else el = h('input', { type: f.t === 'number' ? 'number' : 'text', value: f.v ?? '', step: 'any' });
      inputs[f.k] = el;
      return [h('label', { text: f.l }), el];
    });
    return open({ title, body: [h('div', { class: 'frm' }, rows.flat()), extra], onOk: () => Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, el.type === 'checkbox' ? el.checked : el.value])) });
  };

  // editor de texto de líneas múltiples
  dlg.mtext = ({ text = '', h: ht = 2.5, w = 0 }) => {
    const ta = h('textarea', { class: 'fld', rows: 8, style: { width: 'min(560px, 80vw)', fontFamily: 'Arial, sans-serif', fontSize: '14px' }, autofocus: true });
    ta.value = String(text).replace(/\\P/g, '\n');
    const hi = h('input', { type: 'number', value: ht, step: 'any', class: 'fld', style: { width: '90px' } });
    const sym = (s) => h('button', { class: 'btn', type: 'button', style: { minWidth: '34px' }, onclick: () => { ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); } }, s);
    return open({
      title: 'Editor de texto', width: 'auto',
      body: [h('div', { class: 'row' }, h('label', { text: 'Altura de texto' }), hi, h('span', { class: 'sp', style: { flex: 1 } }), sym('Ø'), sym('°'), sym('±'), sym('²'), sym('³')), ta, h('div', { class: 'hint', text: `Intro = nuevo párrafo. Ancho de columna: ${w ? w.toFixed(2) : 'sin límite'}.` })],
      onOk: () => ({ text: ta.value.replace(/\r?\n/g, '\\P'), h: +hi.value || ht }),
    });
  };

  // selector de color (índice ACI)
  dlg.color = (cur = 256) => {
    let val = cur;
    const show = h('input', { class: 'fld', type: 'text', value: colorName(cur), style: { width: '160px' } });
    const sw = h('span', { class: 'swatch', style: { width: '40px', height: '20px', background: typeof cur === 'number' && cur > 0 && cur < 256 ? aciCss(cur) : '#888' } });
    const set = (v) => { val = v; show.value = colorName(v); sw.style.background = v > 0 && v < 256 ? aciCss(v) : '#888'; };
    const grid = h('div', { class: 'aci' });
    for (let r = 0; r < 10; r++) for (let c = 0; c < 24; c++) { const i = 10 + c * 10 + r; if (i > 249) { grid.append(h('div', { style: { visibility: 'hidden' } })); continue; } grid.append(h('div', { title: `Color de índice: ${i}`, style: { background: aciCss(i) }, onclick: () => set(i), ondblclick: () => { set(i); box?.querySelector('.btn.pri')?.click(); } })); }
    const std = h('div', { class: 'row' }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 250, 251, 252, 253, 254, 255].map((i) => h('div', { title: `Color de índice: ${i}`, style: { width: '18px', height: '18px', background: aciCss(i), cursor: 'pointer', border: '1px solid #000' }, onclick: () => set(i) })));
    let box = null;
    return open({
      title: 'Seleccionar color', init: (b) => (box = b),
      body: [h('div', { class: 'tabsbar' }, h('div', { class: 't on', text: 'Color de índice' })), grid, std,
        h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => set(256) }, 'PorCapa'), h('button', { class: 'btn', type: 'button', onclick: () => set(0) }, 'PorBloque'), h('label', { text: 'Color:' }), show, sw)],
      onOk: () => { const t = show.value.trim(); const n = /^\d+$/.test(t) ? +t : /bylayer/i.test(t) ? 256 : /byblock/i.test(t) ? 0 : val; return n; },
    });
  };

  // administrador de tipos de línea
  dlg.linetype = () => {
    const d = doc();
    const list = h('div', { class: 'list', style: { width: 'min(520px, 80vw)', height: '200px' } });
    let selN = d.vars.CELTYPE;
    const render = () => {
      list.innerHTML = '';
      for (const n of ['BYLAYER', 'BYBLOCK', ...Object.keys(d.ltypes)]) {
        const lt = d.ltypes[n];
        list.append(h('div', { class: 'li' + (n === selN ? ' on' : ''), onclick: () => { selN = n; render(); } }, h('b', { style: { width: '150px' } }, n === d.vars.CELTYPE ? '▶ ' + n : n), h('span', { class: 'hint' }, lt ? lt.desc : '')));
      }
    };
    render();
    const gs = h('input', { class: 'fld', type: 'number', step: 'any', value: d.vars.LTSCALE, style: { width: '100px' } });
    const loadBtn = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const avail = Object.keys(LINETYPES).filter((n) => !d.ltypes[n]);
      const picks = new Set();
      const l2 = h('div', { class: 'list', style: { width: '420px', height: '260px' } }, avail.map((n) => { const it = h('div', { class: 'li', onclick: () => { if (picks.has(n)) picks.delete(n); else picks.add(n); it.classList.toggle('on'); } }, h('b', { style: { width: '150px' } }, n), h('span', { class: 'hint' }, LINETYPES[n].desc)); return it; }));
      const r = await open({ title: 'Cargar o recargar tipos de línea', body: [h('div', { class: 'hint', text: 'Archivo: acadiso.lin' }), l2] });
      if (r) { d.touchTables(); for (const n of picks) d.ltypes[n] = LINETYPES[n]; render(); }
    } }, 'Cargar...');
    const delBtn = h('button', { class: 'btn', type: 'button', onclick: () => { if (selN && d.ltypes[selN] && selN !== 'CONTINUOUS' && ![...d.allEntsDeep()].some((e) => (e.ltype || '').toUpperCase() === selN) && !Object.values(d.layers).some((l) => l.ltype === selN)) { d.touchTables(); delete d.ltypes[selN]; render(); } else app.log('No se puede borrar un tipo de línea en uso.'); } }, 'Suprimir');
    const curBtn = h('button', { class: 'btn', type: 'button', onclick: () => { d.setvar('CELTYPE', selN); render(); } }, 'Actual');
    return open({ title: 'Administrador de tipos de línea', body: [h('div', { class: 'row' }, loadBtn, delBtn, curBtn), list, h('div', { class: 'frm' }, h('label', { text: 'Factor de escala global:' }), gs)], onOk: () => { d.setvar('LTSCALE', +gs.value || 1); app.view.redraw(); return true; } });
  };
  dlg.pickLinetype = async (cur) => {
    const d = doc(); let sel = cur;
    const list = h('div', { class: 'list', style: { width: '420px', height: '220px' } });
    const render = () => { list.innerHTML = ''; for (const n of Object.keys(d.ltypes)) list.append(h('div', { class: 'li' + (n === sel ? ' on' : ''), onclick: () => { sel = n; render(); }, ondblclick: () => box.querySelector('.pri').click() }, h('b', { style: { width: '150px' } }, n), h('span', { class: 'hint' }, d.ltypes[n].desc))); };
    render(); let box;
    const more = h('button', { class: 'btn', type: 'button', onclick: async () => { await dlg.linetype(); render(); } }, 'Cargar...');
    return open({ title: 'Seleccionar tipo de línea', body: [list, more], init: (b) => (box = b), onOk: () => sel });
  };
  dlg.lweight = async (cur) => {
    let sel = cur ?? doc().vars.CELWEIGHT;
    const list = h('div', { class: 'list', style: { width: '260px', height: '260px' } });
    const render = () => { list.innerHTML = ''; for (const w of LWEIGHTS) list.append(h('div', { class: 'li' + (w === sel ? ' on' : ''), onclick: () => { sel = w; render(); } }, h('span', { style: { display: 'inline-block', width: '60px', height: Math.max(1, w > 0 ? w / 25 : 1) + 'px', background: 'currentColor' } }), lwName(w))); };
    render();
    const disp = h('input', { type: 'checkbox', checked: !!doc().vars.LWDISPLAY });
    const r = await open({ title: 'Parámetros de grosor de línea', body: [list, h('label', { class: 'row' }, disp, 'Mostrar grosor de línea')], onOk: () => sel });
    if (r == null) return null;
    if (cur === undefined) { doc().setvar('CELWEIGHT', r); doc().setvar('LWDISPLAY', disp.checked ? 1 : 0); app.view.redraw(); }
    return r;
  };
  dlg.units = () => {
    const v = doc().vars;
    return dlg.form('Unidades de dibujo', [
      { k: 'LUNITS', l: 'Tipo de longitud', v: v.LUNITS, t: 'select', opts: [{ v: 1, l: 'Científico' }, { v: 2, l: 'Decimal' }, { v: 3, l: 'Pies y pulgadas I' }, { v: 4, l: 'Pies y pulgadas II' }, { v: 5, l: 'Fraccionario' }] },
      { k: 'LUPREC', l: 'Precisión', v: v.LUPREC, t: 'select', opts: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ v: n, l: (0).toFixed(n) })) },
      { k: 'AUNITS', l: 'Tipo de ángulo', v: v.AUNITS, t: 'select', opts: [{ v: 0, l: 'Grados decimales' }, { v: 1, l: 'Grados/min/seg' }, { v: 2, l: 'Grados centesimales' }, { v: 3, l: 'Radianes' }] },
      { k: 'AUPREC', l: 'Precisión angular', v: v.AUPREC, t: 'select', opts: [0, 1, 2, 3, 4].map((n) => ({ v: n, l: (0).toFixed(n) })) },
      { k: 'INSUNITS', l: 'Escala de inserción', v: v.INSUNITS, t: 'select', opts: [{ v: 0, l: 'Sin unidades' }, { v: 1, l: 'Pulgadas' }, { v: 2, l: 'Pies' }, { v: 4, l: 'Milímetros' }, { v: 5, l: 'Centímetros' }, { v: 6, l: 'Metros' }] },
    ]).then((r) => { if (r) for (const [k, x] of Object.entries(r)) v[k] = +x; return r; });
  };

  // parámetros de dibujo
  dlg.dsettings = (tab = 'osnap') => {
    const v = doc().vars;
    const tabs = { snap: 'Forzcursor y rejilla', polar: 'Rastreo polar', osnap: 'Referencia a objetos', dyn: 'Entrada dinámica' };
    const pages = {};
    const chk = (label, on) => { const i = h('input', { type: 'checkbox', checked: !!on }); return [i, h('label', { class: 'row' }, i, label)]; };
    const [snapOn, l1] = chk('Forzcursor activado (F9)', v.SNAPMODE), [gridOn, l2] = chk('Rejilla activada (F7)', v.GRIDMODE);
    const su = h('input', { class: 'fld', type: 'number', step: 'any', value: v.SNAPUNIT }), gu = h('input', { class: 'fld', type: 'number', step: 'any', value: v.GRIDUNIT });
    pages.snap = h('div', { class: 'frm' }, l1, h('span'), h('label', { text: 'Intervalo de forzcursor' }), su, l2, h('span'), h('label', { text: 'Intervalo de rejilla' }), gu);
    const [polOn, l3] = chk('Rastreo polar activado (F10)', v.POLARMODE);
    const pa = h('select', { class: 'fld' }, [90, 45, 30, 22.5, 18, 15, 10, 5].map((a) => h('option', { value: a, selected: +v.POLARANG === a }, String(a))));
    pages.polar = h('div', { class: 'frm' }, l3, h('span'), h('label', { text: 'Ángulo de incremento' }), pa);
    const modes = [['end', 'Punto final'], ['mid', 'Punto medio'], ['cen', 'Centro'], ['nod', 'Punto'], ['qua', 'Cuadrante'], ['int', 'Intersección'], ['ins', 'Inserción'], ['per', 'Perpendicular'], ['tan', 'Tangente'], ['nea', 'Cercano'], ['app', 'Intersección ficticia']];
    const boxes = {};
    const [osOn, l4] = chk('Referencia a objetos activada (F3)', !(v.OSMODE & 16384));
    pages.osnap = h('div', {}, l4, h('fieldset', {}, h('legend', { text: 'Modos de referencia a objetos' }), h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))', gap: '4px 18px' } }, modes.map(([k, n]) => { const i = h('input', { type: 'checkbox', checked: !!(v.OSMODE & OS[k]) }); boxes[k] = i; return h('label', { class: 'row' }, i, n); }))),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => Object.values(boxes).forEach((b) => (b.checked = true)) }, 'Seleccionar todo'), h('button', { class: 'btn', type: 'button', onclick: () => Object.values(boxes).forEach((b) => (b.checked = false)) }, 'Borrar todo')));
    const [dynOn, l5] = chk('Activar entrada dinámica (F12)', v.DYNMODE);
    pages.dyn = h('div', {}, l5, h('p', { class: 'hint', text: 'Muestra el mensaje del comando y las coordenadas junto al cursor.' }));
    const bar = h('div', { class: 'tabsbar' });
    const holder = h('div', { style: { minWidth: 'min(440px, 80vw)', minHeight: '220px' } });
    const sel = (k) => { bar.querySelectorAll('.t').forEach((t) => t.classList.toggle('on', t.dataset.k === k)); holder.replaceChildren(pages[k]); };
    for (const [k, n] of Object.entries(tabs)) bar.append(h('div', { class: 't', 'data-k': k, text: n, onclick: () => sel(k) }));
    sel(tab);
    return open({ title: 'Parámetros de dibujo', body: [bar, holder], onOk: () => {
      v.SNAPMODE = snapOn.checked ? 1 : 0; v.GRIDMODE = gridOn.checked ? 1 : 0; v.SNAPUNIT = +su.value || 10; v.GRIDUNIT = +gu.value || 10;
      v.POLARMODE = polOn.checked ? 1 : 0; v.POLARANG = +pa.value; v.DYNMODE = dynOn.checked ? 1 : 0;
      let m = 0; for (const [k] of modes) if (boxes[k].checked) m |= OS[k]; if (!osOn.checked) m |= 16384; v.OSMODE = m;
      app.ui?.status?.update?.(); app.view.redraw(); return true;
    } });
  };

  // opciones (interfaz, colores, atajos, alias)
  dlg.options = (tab = 'display') => {
    const s = app.settings, v = doc().vars;
    const pages = {};
    const color = (val) => h('input', { type: 'color', value: val });
    const bgM = color(s.bgModel), bgP = color(s.bgPaper), bgL = color(s.bgLayoutOut);
    const theme = h('select', { class: 'fld' }, [['dark', 'Oscuro'], ['mid', 'Intermedio'], ['light', 'Claro']].map(([v, l]) => h('option', { value: v, selected: s.theme === v }, l)));
    const lang = h('select', { class: 'fld' }, Object.entries(LANGS).map(([v, l]) => h('option', { value: v, selected: (s.lang || 'es') === v, text: l })));
    const cross = h('input', { type: 'range', min: 1, max: 100, value: s.crosshair });
    pages.display = h('div', { class: 'frm' }, h('label', { text: 'Idioma' }), lang, h('label', { text: 'Tema de color' }), theme, h('label', { text: 'Fondo del espacio modelo' }), bgM, h('label', { text: 'Fondo del papel' }), bgP, h('label', { text: 'Fondo de presentación' }), bgL, h('label', { text: 'Tamaño del cursor en cruz' }), cross);
    const pick = h('input', { type: 'range', min: 1, max: 15, value: v.PICKBOX }), grip = h('input', { type: 'range', min: 3, max: 15, value: s.gripSize }), ap = h('input', { type: 'range', min: 3, max: 30, value: v.APERTURE });
    pages.selection = h('div', { class: 'frm' }, h('label', { text: 'Tamaño de la mira' }), pick, h('label', { text: 'Tamaño de pinzamiento' }), grip, h('label', { text: 'Apertura de AutoSnap' }), ap);
    const ck = (k, label) => { const i = h('input', { type: 'checkbox', checked: !!s[k] }); i.dataset.k = k; return h('label', { class: 'row' }, i, label); };
    pages.interface = h('div', { style: { display: 'grid', gap: '6px' } }, ck('ribbon', 'Mostrar cinta de opciones (Ribbon)'), ck('menuBar', 'Mostrar barra de menús clásica'), ck('screenMenu', 'Mostrar menú de pantalla lateral clásico'), ck('fileTabs', 'Fichas de archivo'), ck('layoutTabs', 'Fichas Modelo/Presentación'), ck('ucsIcon', 'Icono SCP'), ck('autocomplete', 'Autocompletar en la línea de comandos'),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: async () => { const f = await app.io.pickFile('.mnu,.mns,.txt'); if (f) app.ui.menu12.loadMNU(await f.text(), f.name); } }, 'Cargar menú .MNU...'), h('button', { class: 'btn', type: 'button', onclick: () => app.ui.menu12.resetMenus() }, 'Restaurar menú clásico')));
    // alias y atajos
    const aliasRows = h('tbody');
    const userA = { ...(s.aliases || {}) };
    const allA = { ...DEFAULT_ALIASES, ...userA };
    const toCmd = (v) => { v = String(v).trim().toUpperCase(); const r = app.cmd.resolveName(v); return r && !r.startsWith('C:') ? r : v; };
    const renderA = (filter = '') => {
      aliasRows.innerHTML = '';
      for (const [k, cmd] of Object.entries(allA).sort()) {
        if (filter && !k.includes(filter) && !String(cmd).includes(filter) && !dispCmd(cmd).includes(filter)) continue;
        const inp = h('input', { value: dispCmd(cmd), onchange: () => { const c = toCmd(inp.value); allA[k] = c; userA[k] = c; } });
        aliasRows.append(h('tr', {}, h('td', { class: 'kbd', text: k }), h('td', {}, inp), h('td', {}, h('button', { class: 'tbtn', title: 'Eliminar', html: icon('close'), onclick: () => { delete allA[k]; userA[k] = ''; renderA(filter); } }))));
      }
    };
    renderA();
    const newA = h('input', { class: 'fld', placeholder: 'Alias', style: { width: '90px' } }), newC = h('input', { class: 'fld', placeholder: 'COMANDO', style: { width: '140px' } });
    const keys = { ...(s.shortcuts || {}) };
    const keyRows = h('tbody');
    const renderK = () => { keyRows.innerHTML = ''; for (const [k, c] of Object.entries(keys)) keyRows.append(h('tr', {}, h('td', { class: 'kbd', text: k }), h('td', { text: c }), h('td', {}, h('button', { class: 'tbtn', html: icon('close'), onclick: () => { delete keys[k]; renderK(); } })))); };
    renderK();
    const kIn = h('input', { class: 'fld', placeholder: 'Pulse la combinación…', style: { width: '170px' }, readOnly: true, onkeydown: (e) => { e.preventDefault(); e.stopPropagation(); if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return; kIn.value = keyName(e); } });
    const kC = h('input', { class: 'fld', placeholder: 'COMANDO o macro (^C^CLINEA)', style: { width: '200px' } });
    pages.keys = h('div', { style: { display: 'grid', gap: '10px', minWidth: 'min(560px, 82vw)' } },
      h('fieldset', {}, h('legend', { text: 'Alias de comandos (.pgp)' }),
        h('div', { class: 'row' }, newA, newC, h('button', { class: 'btn', type: 'button', onclick: () => { const a = newA.value.trim().toUpperCase(), c = toCmd(newC.value); if (a && c) { allA[a] = c; userA[a] = c; renderA(); newA.value = newC.value = ''; } } }, 'Añadir'),
          h('input', { class: 'fld', placeholder: 'Filtrar…', style: { width: '120px', marginLeft: 'auto' }, oninput: (e) => renderA(e.target.value.toUpperCase()) })),
        h('div', { style: { maxHeight: '200px', overflow: 'auto', marginTop: '6px' } }, h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, h('th', { text: 'Alias' }), h('th', { text: 'Comando' }), h('th'))), aliasRows)),
        h('div', { class: 'row', style: { marginTop: '6px' } }, h('button', { class: 'btn', type: 'button', onclick: async () => { const f = await app.io.pickFile('.pgp,.txt'); if (!f) return; const t = await f.text(); let n = 0; for (const line of t.split(/\r?\n/)) { const m = /^\s*([^;,\s]+)\s*,\s*\*\s*(\S+)/.exec(line); if (m) { allA[m[1].toUpperCase()] = m[2].toUpperCase(); userA[m[1].toUpperCase()] = m[2].toUpperCase(); n++; } } renderA(); app.log(`${n} alias importados de ${f.name}`); } }, 'Importar acad.pgp...'),
          h('button', { class: 'btn', type: 'button', onclick: () => app.io.deliver('alias.pgp', Object.entries(allA).map(([a, c]) => `${a.padEnd(8)},*${c}`).join('\r\n'), 'text/plain') }, 'Exportar'))),
      h('fieldset', {}, h('legend', { text: 'Atajos de teclado' }),
        h('div', { class: 'row' }, kIn, kC, h('button', { class: 'btn', type: 'button', onclick: () => { if (kIn.value && kC.value) { keys[kIn.value] = kC.value; renderK(); kIn.value = kC.value = ''; } } }, 'Asignar')),
        h('div', { style: { maxHeight: '140px', overflow: 'auto', marginTop: '6px' } }, h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, h('th', { text: 'Tecla' }), h('th', { text: 'Comando / macro' }), h('th'))), keyRows)),
        h('p', { class: 'hint', text: 'Atajos fijos: Ctrl+Z/Y, Ctrl+C/X/V, Ctrl+S/O/N/P, Ctrl+A, Ctrl+1 (propiedades), F1-F12, Supr, Esc, Espacio/Intro (repetir).' })));
    const startList = h('div', { class: 'list', style: { height: '120px', width: 'min(520px, 80vw)' } });
    const renderS = () => { startList.innerHTML = ''; for (const f of s.startupLisp || []) startList.append(h('div', { class: 'li' }, h('span', { style: { flex: 1 } }, f.name), h('button', { class: 'tbtn', html: icon('close'), onclick: () => { s.startupLisp = s.startupLisp.filter((x) => x !== f); renderS(); } }))); };
    renderS();
    pages.files = h('div', { style: { display: 'grid', gap: '8px' } }, h('div', { text: 'Grupo de inicio (rutinas LISP cargadas al iniciar):' }), startList,
      h('button', { class: 'btn', type: 'button', onclick: async () => { const f = await app.io.pickFile('.lsp,.fas,.txt'); if (!f) return; (s.startupLisp ||= []).push({ name: f.name, code: await f.text() }); renderS(); } }, 'Añadir...'));
    const bar = h('div', { class: 'tabsbar' });
    const holder = h('div', { style: { minWidth: 'min(520px, 82vw)', minHeight: '260px' } });
    const names = { display: 'Visualización', selection: 'Selección', interface: 'Interfaz', keys: 'Atajos y alias (CUI)', files: 'Archivos / LISP' };
    const sel = (k) => { bar.querySelectorAll('.t').forEach((t) => t.classList.toggle('on', t.dataset.k === k)); holder.replaceChildren(pages[k]); };
    for (const [k, n] of Object.entries(names)) bar.append(h('div', { class: 't', 'data-k': k, text: n, onclick: () => sel(k) }));
    sel(tab);
    return open({ title: 'Opciones', body: [bar, holder], onOk: () => {
      s.bgModel = bgM.value; s.bgPaper = bgP.value; s.bgLayoutOut = bgL.value; s.crosshair = +cross.value;
      v.PICKBOX = +pick.value; s.pickbox = +pick.value; s.gripSize = +grip.value; v.APERTURE = +ap.value;
      pages.interface.querySelectorAll('input[data-k]').forEach((i) => (s[i.dataset.k] = i.checked));
      s.aliases = Object.fromEntries(Object.entries(userA));
      s.shortcuts = keys;
      saveSettings(); app.ui.applyLayout(); app.view.redraw();
      if (theme.value !== s.theme) app.ui.setTheme(theme.value);
      if (lang.value !== (s.lang || 'es')) app.ui.setLang(lang.value);
      return true;
    } });
  };

  dlg.ptype = () => {
    const v = doc().vars; let mode = v.PDMODE;
    const modes = [0, 1, 2, 3, 4, 32, 33, 34, 35, 36, 64, 65, 66, 67, 68, 96, 97, 98, 99, 100];
    const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 48px)', gap: '6px' } });
    const draw = (m) => { const c = h('canvas', { width: 46, height: 40 }); const x = c.getContext('2d'); x.strokeStyle = '#ddd'; x.fillStyle = '#ddd'; const p = { x: 23, y: 20 }, r = 9; x.beginPath(); const b = m % 32; if (b === 0) x.fillRect(22, 19, 2, 2); if (b === 2) { x.moveTo(p.x - r, p.y); x.lineTo(p.x + r, p.y); x.moveTo(p.x, p.y - r); x.lineTo(p.x, p.y + r); } if (b === 3) { x.moveTo(p.x - r, p.y - r); x.lineTo(p.x + r, p.y + r); x.moveTo(p.x - r, p.y + r); x.lineTo(p.x + r, p.y - r); } if (b === 4) { x.moveTo(p.x, p.y); x.lineTo(p.x, p.y - r); } if (m & 32) { x.moveTo(p.x + r, p.y); x.arc(p.x, p.y, r, 0, 7); } if (m & 64) x.rect(p.x - r, p.y - r, 2 * r, 2 * r); x.stroke(); return c; };
    const render = () => { grid.innerHTML = ''; for (const m of modes) grid.append(h('div', { style: { border: '1px solid ' + (m === mode ? 'var(--accent)' : 'var(--border-soft)'), cursor: 'pointer', background: '#1d2229' }, onclick: () => { mode = m; render(); } }, draw(m))); };
    render();
    const sz = h('input', { class: 'fld', type: 'number', step: 'any', value: v.PDSIZE, style: { width: '100px' } });
    return open({ title: 'Estilo de punto', body: [grid, h('div', { class: 'frm' }, h('label', { text: 'Tamaño de punto' }), sz)], onOk: () => { v.PDMODE = mode; v.PDSIZE = +sz.value; return true; } });
  };

  dlg.help = () => {
    const eng = app.cmd;
    const q = h('input', { class: 'fld', placeholder: 'Buscar comando…', autofocus: true });
    const tb = h('tbody');
    const nm = (M, n, d) => M[n] || (n.startsWith('-') && M[n.slice(1)] ? '-' + M[n.slice(1)] : d);
    const rev = {}; for (const [a, c] of Object.entries({ ...eng.aliases, ...(app.settings.aliases || {}) })) if (c) (rev[c] ||= []).push(a);
    const render = () => { tb.innerHTML = ''; const f = norm(q.value); for (const n of Object.keys(eng.commands).sort((a, b) => nm(ES_NAME, a, a).localeCompare(nm(ES_NAME, b, b)))) { const es = nm(ES_NAME, n, n), gl = nm(GL_NAME, n, es), pt = nm(PT_NAME, n, ''), ca = nm(CA_NAME, n, ''); const names = [es, gl, pt, ca].map(norm); const al = (rev[n] || []).filter((a) => !names.includes(norm(a))); if (f && !n.includes(f) && !names.some((x) => x.includes(f)) && !al.some((a) => a.includes(f))) continue; tb.append(h('tr', { ondblclick: () => { box.querySelector('.btn.pri').click(); eng.run(n); } }, h('td', { class: 'kbd', text: es }), h('td', { class: 'kbd', text: n }), h('td', { class: 'kbd', text: gl }), h('td', { class: 'kbd', text: pt }), h('td', { class: 'kbd', text: ca }), h('td', { text: al.join(', ') }))); } };
    q.oninput = render; render(); let box;
    return open({ title: 'Ayuda — Referencia de comandos', init: (b) => (box = b), body: [h('p', { class: 'hint', text: 'Doble clic para ejecutar. Escriba el comando en cualquiera de los idiomas o su alias en la línea de comandos (el prefijo _ fuerza el inglés); Intro/Espacio repite el último. Las expresiones (…) se evalúan como AutoLISP.' }), q, h('div', { style: { maxHeight: '50vh', overflow: 'auto', minWidth: 'min(480px, 80vw)' } }, h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, h('th', { text: 'Castellano' }), h('th', { text: 'Inglés' }), h('th', { text: 'Galego' }), h('th', { text: 'Português' }), h('th', { text: 'Català' }), h('th', { text: 'Alias' }))), tb))], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
  };
  dlg.about = () => dlg.alert('WebCAD Libre\nCAD 2D en el navegador: dibujo, edición, bloques dinámicos, restricciones, AutoLISP con DCL, lectura y escritura DXF (versiones 12 y 2000) y lectura DWG mediante LibreDWG (WebAssembly).\n\nSoftware libre. Funciona sin conexión y sin servidor.');

  dlg.saveFormat = (cur) => {
    const sel = h('select', { class: 'fld' }, h('option', { value: 'dxf', selected: cur === 'dxf' }, 'DXF versión 2000 (*.dxf)'), h('option', { value: 'dxf12', selected: cur === 'dxf12' }, 'DXF versión 12 (*.dxf)'), h('option', { value: 'wcad', selected: cur === 'wcad' }, 'WebCAD nativo — conserva bloques dinámicos (*.wcad)'));
    return open({ title: 'Guardar dibujo como', body: [h('div', { class: 'frm' }, h('label', { text: 'Nombre de archivo' }), h('input', { class: 'fld', type: 'text', value: doc().name.replace(/\.dwg$/i, ''), readOnly: true }), h('label', { text: 'Tipo de archivo' }), sel), h('p', { class: 'hint', text: 'DXF 2000 conserva capas, grosores, sombreados, splines, presentaciones y grupos, y lo abre cualquier programa de CAD. El formato .wcad guarda además bloques dinámicos y restricciones (WebCAD también los recupera desde su propio DXF).' })], onOk: () => sel.value });
  };

  dlg.plot = (d) => {
    const inLayout = d.active !== 'Model';
    const fields = [
      { k: 'format', l: 'Impresora/trazador', v: 'pdf', t: 'select', opts: [{ v: 'pdf', l: 'DWG To PDF.pc3' }, { v: 'png', l: 'PublishToWeb PNG.pc3 (imagen)' }, { v: 'svg', l: 'SVG (vectorial)' }] },
      { k: 'paper', l: 'Tamaño de papel', v: 'A3', t: 'select', opts: Object.keys(PAPER).map((p) => ({ v: p, l: `ISO ${p} (${PAPER[p][0]} x ${PAPER[p][1]} mm)` })) },
      { k: 'area', l: 'Área de trazado', v: inLayout ? 'Layout' : 'Extents', t: 'select', opts: inLayout ? [{ v: 'Layout', l: 'Presentación' }, { v: 'Extents', l: 'Extensión' }, { v: 'Display', l: 'Pantalla' }, { v: 'Window', l: 'Ventana' }] : [{ v: 'Extents', l: 'Extensión' }, { v: 'Display', l: 'Pantalla' }, { v: 'Window', l: 'Ventana' }] },
      { k: 'fit', l: 'Ajustar al papel', v: true, t: 'check' },
      { k: 'scale', l: 'Escala 1:', v: 1, t: 'number' },
      { k: 'landscape', l: 'Horizontal', v: true, t: 'check' },
      { k: 'ctb', l: 'Tabla de estilos de trazado', v: '', t: 'select', opts: [{ v: '', l: 'Ninguno' }, ...Object.keys(app.plotStyles?.() || {}).map((n) => ({ v: n, l: n }))] },
      { k: 'dpi', l: 'Calidad (ppp)', v: 200, t: 'select', opts: [100, 150, 200, 300] },
    ];
    return dlg.form('Trazar - ' + (d.active === 'Model' ? 'Modelo' : d.active), fields).then((r) => (r ? { ...r, fit: r.fit, scale: +r.scale || 1, dpi: +r.dpi } : null));
  };

  // definición de bloque
  dlg.blockDef = (st, names) => {
    const nm = h('input', { class: 'fld', type: 'text', value: st.name, list: 'blkNames', autofocus: true });
    const dl = h('datalist', { id: 'blkNames' }, names.filter((n) => !n.startsWith('*')).map((n) => h('option', { value: n })));
    const bx = h('input', { class: 'fld', type: 'number', step: 'any', value: st.base.x }), by = h('input', { class: 'fld', type: 'number', step: 'any', value: st.base.y });
    const mode = (v, t) => h('label', { class: 'row' }, h('input', { type: 'radio', name: 'bm', value: v, checked: st.mode === v }), t);
    const desc = h('input', { class: 'fld', type: 'text', value: st.desc || '' });
    let action = null;
    const read = () => ({ name: nm.value.trim(), base: { x: +bx.value, y: +by.value }, mode: box.querySelector('input[name=bm]:checked')?.value || 'convert', desc: desc.value });
    let box;
    return open({
      title: 'Definición de bloque', init: (b) => (box = b),
      body: [h('div', { class: 'frm' }, h('label', { text: 'Nombre:' }), nm), dl,
        h('div', { class: 'row', style: { alignItems: 'stretch' } },
          h('fieldset', {}, h('legend', { text: 'Punto base' }), h('button', { class: 'btn', type: 'button', onclick: () => { action = 'pick'; box.querySelector('.btn.pri').click(); } }, 'Designar punto'), h('div', { class: 'frm', style: { marginTop: '6px' } }, h('label', { text: 'X:' }), bx, h('label', { text: 'Y:' }), by)),
          h('fieldset', {}, h('legend', { text: 'Objetos' }), h('button', { class: 'btn', type: 'button', onclick: () => { action = 'select'; box.querySelector('.btn.pri').click(); } }, 'Designar objetos'), mode('retain', 'Conservar'), mode('convert', 'Convertir en bloque'), mode('delete', 'Suprimir'), h('div', { class: 'hint', text: `${st.ents.length} objetos designados` }))),
        h('div', { class: 'frm' }, h('label', { text: 'Descripción:' }), desc)],
      onOk: () => { const r = { ...read(), action }; action = null; return r; },
    });
  };

  // insertar bloque
  dlg.insert = (d, last) => {
    const names = Object.keys(d.blocks).filter((n) => !n.startsWith('*')).sort();
    let sel = names.includes(last) ? last : names[0];
    const grid = h('div', { class: 'thumbs', style: { width: 'min(620px, 82vw)' } });
    let box;
    const render = () => {
      grid.innerHTML = '';
      for (const n of names) {
        const cv = h('canvas');
        const card = h('div', { class: 'thumb' + (n === sel ? ' on' : ''), onclick: () => { sel = n; render(); }, ondblclick: () => { sel = n; box.querySelector('.btn.pri').click(); } }, cv, h('div', { text: n, style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }));
        grid.append(card);
        requestAnimationFrame(() => { const b = d.blocks[n]; drawThumb(cv, E.blockEntsFor({ type: 'INSERT', name: n, dyn: b.params?.length ? E.dynDefaults(b) : undefined }, d), d); });
      }
      if (!names.length) grid.append(h('div', { class: 'hint', text: 'No hay bloques en el dibujo. Use "Examinar…" para insertar un archivo DXF/DWG como bloque.' }));
    };
    render();
    let file = null;
    const W = { width: '80px' };
    const sx = h('input', { class: 'fld', type: 'number', step: 'any', value: 1, style: W }), sy = h('input', { class: 'fld', type: 'number', step: 'any', value: 1, style: W }), rot = h('input', { class: 'fld', type: 'number', step: 'any', value: 0, style: W });
    const ex = h('input', { type: 'checkbox' }), uni = h('input', { type: 'checkbox', checked: true });
    const browse = h('button', { class: 'btn', type: 'button', onclick: async () => { file = await app.io.pickFile('.dxf,.dwg,.wcad'); if (file) box.querySelector('.btn.pri').click(); } }, 'Examinar…');
    return open({
      title: 'Insertar (bloques)', init: (b) => (box = b),
      body: [h('div', { class: 'row' }, h('b', { text: 'Bloques del dibujo actual' }), h('span', { style: { flex: 1 } }), browse), grid,
        h('div', { class: 'row' }, h('label', { text: 'Escala X' }), sx, h('label', { class: 'row' }, uni, 'Uniforme'), h('label', { text: 'Y' }), sy, h('label', { text: 'Rotación°' }), rot, h('label', { class: 'row' }, ex, 'Descomponer'))],
      onOk: () => (file ? { file, sx: +sx.value, sy: uni.checked ? +sx.value : +sy.value, rot: +rot.value, explode: ex.checked } : sel ? { name: sel, sx: +sx.value || 1, sy: uni.checked ? +sx.value || 1 : +sy.value || 1, rot: +rot.value || 0, explode: ex.checked, pick: true } : null),
    });
  };
  dlg.bedit = (d) => {
    const names = Object.keys(d.blocks).filter((n) => !n.startsWith('*')).sort();
    let sel = names[0] || '';
    const nm = h('input', { class: 'fld', type: 'text', value: sel, autofocus: true });
    const list = h('div', { class: 'list', style: { width: '220px', height: '240px' } });
    const cv = h('canvas', { style: { width: '240px', height: '240px', border: '1px solid var(--border-soft)' } });
    const render = () => { list.innerHTML = ''; for (const n of names) list.append(h('div', { class: 'li' + (n === sel ? ' on' : ''), onclick: () => { sel = n; nm.value = n; render(); } }, n)); const b = d.blocks[sel]; if (b) requestAnimationFrame(() => drawThumb(cv, b.ents, d)); };
    render();
    return open({ title: 'Editar definición de bloque', body: [h('div', { class: 'frm' }, h('label', { text: 'Bloque que desea crear o editar' }), nm), h('div', { class: 'row', style: { alignItems: 'flex-start' } }, list, cv)], onOk: () => nm.value.trim() || null });
  };

  // sombreado
  dlg.hatch = (o) => {
    let pat = o.pattern || 'ANSI31';
    const grid = h('div', { class: 'hpat', style: { gridTemplateColumns: 'repeat(6, 50px)', maxHeight: '240px' } });
    const render = () => { grid.innerHTML = ''; for (const p of Object.keys(HATCHES)) { const cv = h('canvas'); const b = h('button', { type: 'button', class: p === pat ? 'on' : '', title: p, style: { width: '50px', height: '40px' }, onclick: () => { pat = p; render(); } }, cv); grid.append(b); requestAnimationFrame(() => hatchSwatch(cv, p, doc())); } };
    render();
    const sc = h('input', { class: 'fld', type: 'number', step: 'any', value: o.scale ?? 1 }), an = h('input', { class: 'fld', type: 'number', step: 'any', value: o.angle ?? 0 });
    let col = o.color ?? 256;
    const cb = h('button', { class: 'btn', type: 'button', text: colorName(col), onclick: async () => { const c = await dlg.color(col); if (c != null) { col = c; cb.textContent = colorName(c); } } });
    return open({ title: 'Sombreado y degradado', body: [grid, h('div', { class: 'frm' }, h('label', { text: 'Escala' }), sc, h('label', { text: 'Ángulo' }), an, h('label', { text: 'Color' }), cb)], onOk: () => ({ pattern: pat, scale: +sc.value || 1, angle: +an.value || 0, color: col }) });
  };

  dlg.qselect = async () => {
    const d = doc();
    const types = ['(Múltiple)', ...new Set(d.space.map((e) => e.type))];
    const r = await dlg.form('Selección rápida', [
      { k: 'type', l: 'Tipo de objeto', v: '(Múltiple)', t: 'select', opts: types },
      { k: 'prop', l: 'Propiedades', v: 'Layer', t: 'select', opts: [{ v: 'Layer', l: 'Capa' }, { v: 'Color', l: 'Color' }, { v: 'Linetype', l: 'Tipo de línea' }, { v: 'Block name', l: 'Nombre de bloque' }, { v: 'Text contents', l: 'Contenido de texto' }] },
      { k: 'op', l: 'Operador', v: '=', t: 'select', opts: [{ v: '=', l: '= Igual a' }, { v: '!=', l: '<> Distinto de' }, { v: '*', l: '* Coincidencia con comodines' }, { v: 'all', l: 'Seleccionar todo' }] },
      { k: 'val', l: 'Valor', v: d.clayer },
    ]);
    if (!r) return null;
    const getp = (e) => ({ Layer: e.layer, Color: String(e.color ?? 256), Linetype: e.ltype || 'BYLAYER', 'Block name': e.name || '', 'Text contents': e.text || '' }[r.prop]);
    const re = new RegExp('^' + r.val.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return d.space.filter((e) => d.isVisible(e) && (r.type === '(Múltiple)' || e.type === r.type) && (r.op === 'all' || (r.op === '=' ? String(getp(e)).toUpperCase() === r.val.toUpperCase() : r.op === '!=' ? String(getp(e)).toUpperCase() !== r.val.toUpperCase() : re.test(getp(e)))));
  };

  dlg.appload = () => {
    const L = app.lisp;
    const list = h('div', { class: 'list', style: { width: 'min(520px, 80vw)', height: '170px' } });
    const render = () => { list.innerHTML = ''; for (const k of L.fs.keys()) list.append(h('div', { class: 'li' }, h('span', { style: { flex: 1 } }, k), h('button', { class: 'btn', type: 'button', onclick: async () => { await L.loadText(L.fs.get(k), k); app.log(`${k} successfully loaded.`); } }, 'Cargar'))); if (!L.fs.size) list.append(h('div', { class: 'hint', style: { padding: '8px' }, text: 'Ninguna aplicación cargada.' })); };
    render();
    const auto = h('input', { type: 'checkbox', checked: true });
    const add = h('input', { type: 'checkbox' });
    const pick = h('button', { class: 'btn pri', type: 'button', onclick: async () => {
      const inp = h('input', { type: 'file', accept: '.lsp,.scr,.txt,.mnl,.dcl', multiple: true });
      inp.onchange = async () => {
        for (const f of inp.files) {
          const t = await f.text();
          if (/\.scr$/i.test(f.name)) { await L.runScript(t); continue; }
          L.addFile(f.name, t);
          if (auto.checked && /\.(lsp|mnl)$/i.test(f.name)) { await L.loadText(t, f.name); app.log(`${f.name} successfully loaded.`); }
          if (add.checked) { (app.settings.startupLisp ||= []).push({ name: f.name, code: t }); saveSettings(); }
        }
        render();
      };
      inp.click();
    } }, 'Cargar...');
    return open({ title: 'Cargar/descargar aplicaciones', body: [h('div', { class: 'row' }, pick, h('label', { class: 'row' }, auto, 'Cargar al seleccionar'), h('label', { class: 'row' }, add, 'Añadir al Grupo de inicio')), h('div', { text: 'Aplicaciones cargadas' }), list, h('p', { class: 'hint', text: 'Rutinas .lsp (AutoLISP), .scr (scripts) y .dcl (cuadros de diálogo). Las funciones C:XXX quedan disponibles como comandos.' })], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
  };
  return dlg;
}

export function keyName(e) {
  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl'); if (e.altKey) parts.push('Alt'); if (e.shiftKey) parts.push('Shift');
  let k = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  if (k === ' ') k = 'Space';
  parts.push(k); return parts.join('+');
}
