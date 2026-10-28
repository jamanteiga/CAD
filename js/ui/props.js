// Paleta de propiedades (Ctrl+1)
import { h, draggable } from './dom.js';
import { icon } from './icons.js';
import { t as tr } from '../core/i18n.js';
import * as D from '../core/duct.js';
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { aciCss, colorName, lwName, LWEIGHTS, HATCHES } from '../core/tables.js';

export const TNAME = { LINE: 'Línea', CIRCLE: 'Círculo', ARC: 'Arco', LWPOLYLINE: 'Polilínea', POINT: 'Punto', TEXT: 'Texto', MTEXT: 'Texto de líneas múltiples', INSERT: 'Referencia a bloque', ELLIPSE: 'Elipse', SPLINE: 'Spline', HATCH: 'Sombreado', DIMENSION: 'Cota', SOLID: 'Sólido 2D', XLINE: 'Línea auxiliar', RAY: 'Rayo', LEADER: 'Directriz', ATTDEF: 'Definición de atributo', VIEWPORT: 'Ventana gráfica', WIPEOUT: 'Cobertura', TABLE: 'Tabla', DUCT: 'Conducto' };

export function createProps(app) {
  const host = document.getElementById('host');
  let pal = null, filterType = null, vtx = 0;
  const collapsed = new Set();
  const P = {};
  P.rebuild = () => { if (!pal) return; const vis = !pal.hidden; pal.remove(); pal = null; if (vis) P.show(true); };
  P.show = (on = true) => {
    if (!pal) {
      pal = h('div', { class: 'palette', id: 'propspal', style: { left: '12px', top: '40px', width: '290px' } },
        h('div', { class: 'pal-h' }, 'Propiedades', h('span', { class: 'sp' }), h('button', { class: 'tbtn', title: 'Selección rápida', html: icon('qselect'), onclick: () => app.cmd.run('QSELECT') }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => P.show(false) })),
        h('div', { class: 'pal-b' }));
      host.append(pal); draggable(pal, pal.querySelector('.pal-h'));
    }
    pal.hidden = !on;
    P.render();
  };
  P.visible = () => pal && !pal.hidden;
  P.render = () => {
    if (!pal || pal.hidden) return;
    const doc = app.doc, all = app.cmd.sel.filter((e) => doc.space.includes(e) || doc.model.includes(e));
    const types = [...new Set(all.map((e) => e.type))];
    if (filterType && !types.includes(filterType)) filterType = null;
    const sel = filterType ? all.filter((e) => e.type === filterType) : all;
    const body = pal.querySelector('.pal-b');
    const head = h('select', { class: 'psel', onchange: () => { filterType = head.value || null; P.render(); } },
      !all.length ? h('option', { text: 'Sin selección' }) : [h('option', { value: '', text: types.length > 1 ? `Todo (${all.length})` : `${tr(TNAME[types[0]] || types[0])}${all.length > 1 ? ` (${all.length})` : ''}` }), ...(types.length > 1 ? types.map((t) => h('option', { value: t, selected: t === filterType, text: `${tr(TNAME[t] || t)} (${all.filter((e) => e.type === t).length})` })) : [])]);
    const tb = h('tbody');
    const cat = (name) => { tb.append(h('tr', { class: 'cat', onclick: () => { if (collapsed.has(name)) collapsed.delete(name); else collapsed.add(name); P.render(); } }, h('td', { colspan: 2, text: (collapsed.has(name) ? '▸ ' : '▾ ') + name }))); return !collapsed.has(name); };
    const commit = (fn) => { doc.begin('PROPERTIES'); for (const e of sel) doc.mod(e, fn); doc.end(); app.view.redraw(); app.cmd.updateGrips(); app.ui.refresh(); };
    const common = (get) => { const v = sel.map(get); return v.every((x) => JSON.stringify(x) === JSON.stringify(v[0])) ? v[0] : undefined; };
    const row = (label, ctrl) => tb.append(h('tr', {}, h('td', { text: label }), h('td', {}, ctrl)));
    const ro = (label, v) => tb.append(h('tr', {}, h('td', { text: label }), h('td', { class: 'ro', text: v })));
    const num = (label, get, set, isAng = false) => {
      const v = common(get);
      const inp = h('input', { type: 'text', value: v === undefined ? '*VARÍA*' : G.fmt(isAng ? G.deg(v) : v, 4), onchange: () => { const n = parseFloat(inp.value); if (isNaN(n)) return P.render(); commit((e) => set(e, isAng ? G.rad(n) : n)); } , onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); } });
      row(label, inp);
    };
    const txt = (label, get, set) => { const v = common(get); const inp = h('input', { type: 'text', value: v === undefined ? '*VARÍA*' : v ?? '', onchange: () => commit((e) => set(e, inp.value)), onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); } }); row(label, inp); };
    const sel_ = (label, get, opts, set) => { const v = common(get); const s = h('select', { onchange: () => commit((e) => set(e, opts.find((o) => String(o.v) === s.value)?.v)) }, v === undefined ? h('option', { text: '*VARÍA*', selected: true }) : '', opts.map((o) => h('option', { value: o.v, selected: o.v === v, text: o.l }))); row(label, s); };
    if (!sel.length) {
      if (cat('General')) {
        const v = doc.vars;
        row('Color', h('select', { onchange: (e) => { doc.setvar('CECOLOR', +e.target.value); app.ui.refresh(); } }, [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: v.CECOLOR === c, text: colorName(c) }))));
        row('Capa', h('select', { onchange: (e) => { doc.clayer = e.target.value; app.ui.refresh(); } }, Object.keys(doc.layers).map((n) => h('option', { value: n, selected: n === doc.clayer, text: n }))));
        row('Tipo de línea', h('select', { onchange: (e) => { doc.setvar('CELTYPE', e.target.value); app.ui.refresh(); } }, ['BYLAYER', 'BYBLOCK', ...Object.keys(doc.ltypes)].map((n) => h('option', { value: n, selected: n === v.CELTYPE, text: n }))));
        num('Escala de tipo de línea', () => v.CELTSCALE, (_, n) => doc.setvar('CELTSCALE', n));
        row('Grosor de línea', h('select', { onchange: (e) => doc.setvar('CELWEIGHT', +e.target.value) }, LWEIGHTS.map((w) => h('option', { value: w, selected: w === v.CELWEIGHT, text: lwName(w) }))));
      }
      if (cat('Vista')) { const c = app.view.cur; ro('Centro X', G.fmt(c.cx, 4)); ro('Centro Y', G.fmt(c.cy, 4)); ro('Altura', G.fmt(app.view.H / c.s, 4)); ro('Anchura', G.fmt(app.view.W / c.s, 4)); }
      if (cat('Varios')) { ro('Escala de anotación', '1:1'); ro('Icono SCP activado', app.settings.ucsIcon ? 'Sí' : 'No'); ro('Archivo', doc.name); ro('Espacio', doc.blockEdit ? `Editor de bloques: ${doc.blockEdit.name}` : doc.active === 'Model' ? 'Modelo' : doc.active); }
      body.replaceChildren(head, h('table', { class: 'pgrid' }, tb));
      return;
    }
    if (cat('General')) {
      const cv = common((e) => e.color ?? 256);
      row('Color', h('select', { onchange: async (e) => { let c = e.target.value; if (c === 'more') { c = await app.ui.dlg.color(cv ?? 256); if (c == null) return P.render(); } commit((x) => { x.color = +c; delete x.tc; }); } },
        cv === undefined ? h('option', { text: '*VARÍA*', selected: true }) : '', [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: cv === c, text: colorName(c) })), cv !== undefined && ![256, 0, 1, 2, 3, 4, 5, 6, 7].includes(cv) ? h('option', { value: cv, selected: true, text: colorName(cv) }) : '', h('option', { value: 'more', text: 'Seleccionar color...' })));
      sel_('Capa', (e) => e.layer, Object.keys(doc.layers).map((n) => ({ v: n, l: n })), (e, v) => (e.layer = v));
      sel_('Tipo de línea', (e) => (e.ltype || 'BYLAYER').toUpperCase(), ['BYLAYER', 'BYBLOCK', ...Object.keys(doc.ltypes)].map((n) => ({ v: n, l: n === 'BYLAYER' ? 'PorCapa' : n === 'BYBLOCK' ? 'PorBloque' : n })), (e, v) => (e.ltype = v));
      num('Escala de tipo de línea', (e) => e.lts ?? 1, (e, v) => (e.lts = v));
      sel_('Grosor de línea', (e) => e.lw ?? -1, LWEIGHTS.map((w) => ({ v: w, l: lwName(w) })), (e, v) => (e.lw = v));
    }
    const t = common((e) => e.type);
    if (t && cat(t === 'TEXT' || t === 'MTEXT' ? 'Texto' : 'Geometría')) {
      const P2 = (label, k) => { num(label + ' X', (e) => e[k].x, (e, v) => (e[k] = { ...e[k], x: v })); num(label + ' Y', (e) => e[k].y, (e, v) => (e[k] = { ...e[k], y: v })); };
      switch (t) {
        case 'LINE': P2('Inicio', 'p1'); P2('Fin', 'p2'); ro('Incremento X', G.fmt(sel[0].p2.x - sel[0].p1.x)); ro('Incremento Y', G.fmt(sel[0].p2.y - sel[0].p1.y));
          num('Longitud', (e) => G.dist(e.p1, e.p2), (e, v) => { e.p2 = G.polar(e.p1, G.ang(e.p1, e.p2), v); });
          num('Ángulo', (e) => G.normA(G.ang(e.p1, e.p2)), (e, v) => { e.p2 = G.polar(e.p1, v, G.dist(e.p1, e.p2)); }, true); break;
        case 'CIRCLE': P2('Centro', 'c'); num('Radio', (e) => e.r, (e, v) => (e.r = v)); num('Diámetro', (e) => e.r * 2, (e, v) => (e.r = v / 2));
          num('Circunferencia', (e) => G.TAU * e.r, (e, v) => (e.r = v / G.TAU)); num('Área', (e) => Math.PI * e.r * e.r, (e, v) => (e.r = Math.sqrt(v / Math.PI))); break;
        case 'ARC': P2('Centro', 'c'); num('Radio', (e) => e.r, (e, v) => (e.r = v)); num('Ángulo inicial', (e) => G.normA(e.a1), (e, v) => (e.a1 = v), true); num('Ángulo final', (e) => G.normA(e.a2), (e, v) => (e.a2 = v), true);
          ro('Ángulo total', G.fmt(G.deg(G.arcSweep(sel[0].a1, sel[0].a2)), 2)); ro('Longitud de arco', G.fmt(E.entLength(sel[0]))); break;
        case 'LWPOLYLINE': {
          const e0 = sel[0];
          if (sel.length === 1) {
            vtx = Math.min(vtx, e0.pts.length - 1);
            const vs = h('input', { type: 'number', min: 1, max: e0.pts.length, value: vtx + 1, onchange: () => { vtx = Math.max(0, Math.min(e0.pts.length - 1, (+vs.value || 1) - 1)); P.render(); } });
            row('Vértice actual', vs);
            num('Vértice X', (e) => e.pts[vtx].x, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], x: v }));
            num('Vértice Y', (e) => e.pts[vtx].y, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], y: v }));
            num('Curvatura', (e) => e.pts[vtx].b || 0, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], b: v }));
          }
          num('Anchura global', (e) => e.cw_ || 0, (e, v) => (e.cw_ = v || undefined));
          sel_('Cerrada', (e) => !!e.closed, [{ v: false, l: 'No' }, { v: true, l: 'Sí' }], (e, v) => (e.closed = v));
          ro('Longitud', G.fmt(E.entLength(e0))); ro('Área', G.fmt(E.entArea(e0))); break;
        }
        case 'POINT': P2('Posición', 'p'); break;
        case 'ELLIPSE': P2('Centro', 'c'); num('Radio mayor', (e) => G.len(e.major), (e, v) => (e.major = G.mul(G.norm(e.major), v))); num('Radio menor', (e) => G.len(e.major) * e.ratio, (e, v) => (e.ratio = Math.min(1, v / G.len(e.major)))); num('Relación de radios', (e) => e.ratio, (e, v) => (e.ratio = v)); break;
        case 'TEXT': case 'ATTDEF':
          txt('Contenido', (e) => (t === 'ATTDEF' ? e.def ?? '' : e.text), (e, v) => { if (t === 'ATTDEF') { e.def = v; e.text = v; } else e.text = v; });
          if (t === 'ATTDEF') { txt('Identificador', (e) => e.tag, (e, v) => (e.tag = v.toUpperCase())); txt('Mensaje', (e) => e.prompt || '', (e, v) => (e.prompt = v)); }
          sel_('Estilo', (e) => e.style || 'Standard', Object.keys(doc.styles).map((n) => ({ v: n, l: n })), (e, v) => (e.style = v));
          sel_('Justificación', (e) => `${e.ha || 0},${e.va || 0}`, [['Izquierda', '0,0'], ['Centro', '1,0'], ['Derecha', '2,0'], ['Medio', '4,0'], ['Superior izquierda', '0,3'], ['Superior centro', '1,3'], ['Superior derecha', '2,3'], ['Medio izquierda', '0,2'], ['Medio centro', '1,2'], ['Medio derecha', '2,2'], ['Inferior izquierda', '0,1'], ['Inferior centro', '1,1'], ['Inferior derecha', '2,1']].map(([l, v]) => ({ v, l })), (e, v) => { const f = E.textFrame(e); const [ha, va] = v.split(',').map(Number); e.ha = ha; e.va = va; if (ha || va) { const nf = E.textFrame({ ...e, p: { x: 0, y: 0 }, p2: { x: 0, y: 0 } }); const a = G.sub(f.o, nf.o); e.p = a; e.p2 = a; } else { e.p = f.o; delete e.p2; } });
          num('Altura', (e) => e.h, (e, v) => (e.h = v)); num('Rotación', (e) => e.rot || 0, (e, v) => (e.rot = v), true); num('Factor de anchura', (e) => e.wf || 1, (e, v) => (e.wf = v));
          P2('Posición', 'p'); break;
        case 'MTEXT':
          txt('Contenido', (e) => e.text.replace(/\\P/g, '¶'), (e, v) => (e.text = v.replace(/¶/g, '\\P')));
          row('', h('button', { class: 'btn', type: 'button', text: 'Editar texto...', onclick: () => { app.cmd.sel = sel.slice(); app.cmd.run('DDEDIT'); } }));
          sel_('Enlace', (e) => e.att || 1, ['Superior izquierda', 'Superior centro', 'Superior derecha', 'Medio izquierda', 'Medio centro', 'Medio derecha', 'Inferior izquierda', 'Inferior centro', 'Inferior derecha'].map((l, i) => ({ v: i + 1, l })), (e, v) => (e.att = v));
          num('Altura de texto', (e) => e.h, (e, v) => (e.h = v)); num('Rotación', (e) => e.rot || 0, (e, v) => (e.rot = v), true); num('Anchura definida', (e) => e.w || 0, (e, v) => (e.w = v)); num('Factor de interlineado', (e) => e.ls || 1, (e, v) => (e.ls = v));
          P2('Posición', 'p'); break;
        case 'INSERT': {
          ro('Nombre', sel.length === 1 ? sel[0].name : common((e) => e.name) ?? '*VARÍA*');
          P2('Posición', 'p'); num('Escala X', (e) => e.sx ?? 1, (e, v) => (e.sx = v)); num('Escala Y', (e) => e.sy ?? 1, (e, v) => (e.sy = v)); num('Rotación', (e) => e.rot || 0, (e, v) => (e.rot = v), true);
          if (sel.length === 1 && sel[0].arr && cat('Matriz (asociativa)')) {
            const a = sel[0].arr, upd = (fn) => (e) => { doc.touchTables(); fn(e.arr); app.rebuildArray?.(e, doc); };
            ro('Tipo', { rect: 'Rectangular', polar: 'Polar', path: 'Camino' }[a.kind]);
            if (a.kind === 'rect') {
              num('Columnas', (e) => e.arr.cols, (e, v) => upd((x) => (x.cols = Math.max(1, Math.round(v))))(e));
              num('Filas', (e) => e.arr.rows, (e, v) => upd((x) => (x.rows = Math.max(1, Math.round(v))))(e));
              num('Separación entre columnas', (e) => e.arr.dx, (e, v) => upd((x) => (x.dx = v))(e));
              num('Separación entre filas', (e) => e.arr.dy, (e, v) => upd((x) => (x.dy = v))(e));
            } else {
              num('Elementos', (e) => e.arr.n, (e, v) => upd((x) => (x.n = Math.max(1, Math.round(v))))(e));
              if (a.kind === 'polar') { num('Ángulo de relleno', (e) => e.arr.fill, (e, v) => upd((x) => (x.fill = v))(e), true); sel_('Girar elementos', (e) => !!e.arr.rot, [{ v: false, l: 'No' }, { v: true, l: 'Sí' }], (e, v) => upd((x) => (x.rot = v))(e)); }
              else sel_('Alinear elementos', (e) => !!e.arr.align, [{ v: false, l: 'No' }, { v: true, l: 'Sí' }], (e, v) => upd((x) => (x.align = v))(e));
            }
          }
          const blk = doc.blocks[sel[0].name];
          if (sel.length === 1 && blk?.params?.length && cat('Personalizado (bloque dinámico)')) {
            const dyn = { ...E.dynDefaults(blk), ...(sel[0].dyn || {}) };
            for (const p of blk.params) {
              const setD = (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); };
              if (p.type === 'linear' && p.vals?.length) sel_(p.name, () => dyn[p.name], p.vals.map((v) => ({ v, l: G.fmt(v, 4) })), (e, v) => setD(e, +v));
              else if (p.type === 'xy') { num(p.name + ' X', () => dyn[p.name]?.x, (e, v) => setD(e, { ...dyn[p.name], x: v })); num(p.name + ' Y', () => dyn[p.name]?.y, (e, v) => setD(e, { ...dyn[p.name], y: v })); }
              else if (p.type === 'polar') { num(p.name + ' — ' + tr('Distancia'), () => dyn[p.name]?.d, (e, v) => setD(e, { ...dyn[p.name], d: Math.max(0, v) })); num(p.name + ' — ' + tr('Ángulo'), () => dyn[p.name]?.a, (e, v) => setD(e, { ...dyn[p.name], a: v }), true); }
              else if (p.type === 'lookup') sel_(p.name, () => dyn[p.name], (p.rows || []).map((r) => ({ v: r.label, l: r.label })), (e, v) => setD(e, v));
              else if (p.type === 'linear') num(p.name, () => dyn[p.name], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: Math.max(0, v) }; E.invalidate(e); });
              else if (p.type === 'rotation') num(p.name, () => dyn[p.name], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); }, true);
              else if (p.type === 'flip') sel_(p.name, () => dyn[p.name] ? 1 : 0, [{ v: 0, l: 'Sin simetría' }, { v: 1, l: 'Con simetría' }], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); });
              else if (p.type === 'visibility') sel_(p.name, () => dyn[p.name], p.states.map((s) => ({ v: s.name, l: s.name })), (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); });
            }
          }
          if (sel.length === 1 && sel[0].attribs?.length && cat('Atributos')) for (const [i, a] of sel[0].attribs.entries()) txt(a.tag, (e) => e.attribs[i]?.text ?? '', (e, v) => { e.attribs[i] = { ...e.attribs[i], text: v }; E.invalidate(e.attribs[i]); });
          break;
        }
        case 'DUCT': {
          const one = sel[0], k = D.ductCalc(one), nf = (v, d = 2) => G.fmt(v, d);
          sel_('Sistema', (e) => e.sys, Object.entries(D.SYSTEMS).map(([v, x]) => ({ v, l: x.label })), (e, v) => { e.sys = v; const L = D.SYSTEMS[v].layer; if (!doc.layers[L]) { doc.touchTables(); doc.ensureLayer(L, { color: D.SYSTEMS[v].color, lw: 35 }); } e.layer = L; });
          sel_('Forma', (e) => e.shape, [{ v: 'rect', l: 'Rectangular' }, { v: 'round', l: 'Circular' }], (e, v) => (e.shape = v));
          if (common((e) => e.shape) === 'round') num('Diámetro', (e) => e.d, (e, v) => (e.d = v)); else { num('Anchura', (e) => e.w, (e, v) => (e.w = v)); num('Altura', (e) => e.h, (e, v) => (e.h = v)); }
          num('Caudal (m³/h)', (e) => e.flow || 0, (e, v) => (e.flow = v)); num('Radio de codo R/W', (e) => e.ratio ?? 1, (e, v) => (e.ratio = v)); num('Pérdidas singulares Σζ', (e) => +e.zeta || 0, (e, v) => (e.zeta = v));
          sel_('Etiqueta', (e) => e.label !== false, [{ v: true, l: 'Sí' }, { v: false, l: 'No' }], (e, v) => (e.label = v));
          if (sel.length === 1 && cat('Cálculo')) { ro('Velocidad (m/s)', nf(k.v)); ro('Diámetro equivalente (mm)', nf(k.De, 0)); ro('Pérdida unitaria (Pa/m)', nf(k.R, 3)); ro('Longitud (m)', nf(k.L)); ro('Codos', String(k.elbows)); ro('Σζ', nf(k.zeta)); ro('ΔP total (Pa)', nf(k.dp)); ro('Superficie de chapa (m²)', nf(k.sheet)); }
          break;
        }
        case 'TABLE': {
          const resize = (e, nr, nc) => { nr = Math.max(1, Math.round(nr)); nc = Math.max(1, Math.round(nc)); e.cells = Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => e.cells[i]?.[j] ?? '')); e.rows = Array.from({ length: nr }, (_, i) => e.rows[i] ?? e.rows.at(-1)); e.cols = Array.from({ length: nc }, (_, j) => e.cols[j] ?? e.cols.at(-1)); };
          P2('Posición', 'p');
          num('Filas', (e) => e.rows.length, (e, v) => resize(e, v, e.cols.length)); num('Columnas', (e) => e.cols.length, (e, v) => resize(e, e.rows.length, v));
          num('Altura de texto', (e) => e.th, (e, v) => (e.th = v)); num('Ancho de columna', (e) => common((x) => x.cols[0]) ?? e.cols[0], (e, v) => (e.cols = e.cols.map(() => v)));
          num('Alto de fila', (e) => e.rows[0], (e, v) => (e.rows = e.rows.map(() => v))); num('Rotación', (e) => e.rot || 0, (e, v) => (e.rot = v), true);
          sel_('Alineación', (e) => (Array.isArray(e.align) ? 'MC' : e.align || 'MC'), [{ v: 'ML', l: 'Izquierda' }, { v: 'MC', l: 'Centro' }, { v: 'MR', l: 'Derecha' }], (e, v) => (e.align = v));
          row('', h('button', { class: 'btn', type: 'button', text: 'Editar celdas...', onclick: () => { app.cmd.sel = sel.slice(); app.cmd.run('TABLEDIT'); } }));
          break;
        }
        case 'HATCH':
          sel_('Patrón', (e) => (e.solid ? 'SOLID' : (e.pattern || 'ANSI31').toUpperCase()), Object.keys(HATCHES).concat(sel.some((e) => !HATCHES[(e.pattern || '').toUpperCase()]) ? [(sel[0].pattern || '').toUpperCase()] : []).map((n) => ({ v: n, l: n })), (e, v) => { e.pattern = v; e.solid = v === 'SOLID'; delete e.pdef; });
          num('Escala', (e) => e.scale || 1, (e, v) => { e.scale = v; delete e.pdef; }); num('Ángulo', (e) => e.angle || 0, (e, v) => { e.angle = v; delete e.pdef; }, true); ro('Área', G.fmt(E.entArea(sel[0]))); break;
        case 'DIMENSION':
          ro('Medida', G.fmt(E.dimMeasure(sel[0]), 4)); txt('Sustitución de texto', (e) => e.text || '', (e, v) => (e.text = v || undefined));
          num('Escala global de cota', (e) => e.st?.dimscale ?? doc.dimstyle.dimscale, (e, v) => (e.st = { ...(e.st || {}), dimscale: v }));
          num('Altura de texto', (e) => e.st?.dimtxt ?? doc.dimstyle.dimtxt, (e, v) => (e.st = { ...(e.st || {}), dimtxt: v }));
          num('Tamaño de flecha', (e) => e.st?.dimasz ?? doc.dimstyle.dimasz, (e, v) => (e.st = { ...(e.st || {}), dimasz: v }));
          num('Precisión', (e) => e.st?.dimdec ?? doc.dimstyle.dimdec, (e, v) => (e.st = { ...(e.st || {}), dimdec: Math.round(v) })); break;
        case 'VIEWPORT':
          P2('Centro', 'c'); num('Anchura', (e) => e.w, (e, v) => (e.w = v)); num('Altura', (e) => e.h, (e, v) => (e.h = v));
          sel_('Escala estándar', (e) => +e.scale.toFixed(6), [[1, '1:1'], [0.5, '1:2'], [0.2, '1:5'], [0.1, '1:10'], [0.05, '1:20'], [0.04, '1:25'], [0.02, '1:50'], [0.01, '1:100'], [0.005, '1:200'], [2, '2:1'], [5, '5:1'], [10, '10:1']].map(([v, l]) => ({ v, l })), (e, v) => (e.scale = v));
          num('Escala personalizada', (e) => e.scale, (e, v) => (e.scale = v));
          sel_('Visualización bloqueada', (e) => !!e.locked, [{ v: false, l: 'No' }, { v: true, l: 'Sí' }], (e, v) => (e.locked = v)); break;
        case 'XLINE': case 'RAY': P2('Punto base', 'p'); break;
        case 'SPLINE': ro('Puntos de ajuste', String((sel[0].fit || []).length)); ro('Puntos de control', String((sel[0].cps || []).length)); ro('Longitud', G.fmt(E.entLength(sel[0]))); break;
      }
    }
    body.replaceChildren(head, h('table', { class: 'pgrid' }, tb));
    void aciCss;
  };
  return P;
}
