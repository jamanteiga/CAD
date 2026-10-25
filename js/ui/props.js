// Paleta de propiedades (Ctrl+1)
import { h, draggable } from './dom.js';
import { icon } from './icons.js';
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { aciCss, colorName, lwName, LWEIGHTS, HATCHES } from '../core/tables.js';

const TNAME = { LINE: 'Line', CIRCLE: 'Circle', ARC: 'Arc', LWPOLYLINE: 'Polyline', POINT: 'Point', TEXT: 'Text', MTEXT: 'MText', INSERT: 'Block Reference', ELLIPSE: 'Ellipse', SPLINE: 'Spline', HATCH: 'Hatch', DIMENSION: 'Dimension', SOLID: '2D Solid', XLINE: 'Xline', RAY: 'Ray', LEADER: 'Leader', ATTDEF: 'Attribute Definition', VIEWPORT: 'Viewport', WIPEOUT: 'Wipeout' };

export function createProps(app) {
  const host = document.getElementById('host');
  let pal = null, filterType = null, vtx = 0;
  const collapsed = new Set();
  const P = {};
  P.show = (on = true) => {
    if (!pal) {
      pal = h('div', { class: 'palette', id: 'propspal', style: { left: '12px', top: '40px', width: '290px' } },
        h('div', { class: 'pal-h' }, 'Properties', h('span', { class: 'sp' }), h('button', { class: 'tbtn', title: 'Quick Select', html: icon('qselect'), onclick: () => app.cmd.run('QSELECT') }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => P.show(false) })),
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
      !all.length ? h('option', { text: 'No selection' }) : [h('option', { value: '', text: types.length > 1 ? `All (${all.length})` : `${TNAME[types[0]] || types[0]}${all.length > 1 ? ` (${all.length})` : ''}` }), ...(types.length > 1 ? types.map((t) => h('option', { value: t, selected: t === filterType, text: `${TNAME[t] || t} (${all.filter((e) => e.type === t).length})` })) : [])]);
    const tb = h('tbody');
    const cat = (name) => { tb.append(h('tr', { class: 'cat', onclick: () => { if (collapsed.has(name)) collapsed.delete(name); else collapsed.add(name); P.render(); } }, h('td', { colspan: 2, text: (collapsed.has(name) ? '▸ ' : '▾ ') + name }))); return !collapsed.has(name); };
    const commit = (fn) => { doc.begin('PROPERTIES'); for (const e of sel) doc.mod(e, fn); doc.end(); app.view.redraw(); app.cmd.updateGrips(); app.ui.refresh(); };
    const common = (get) => { const v = sel.map(get); return v.every((x) => JSON.stringify(x) === JSON.stringify(v[0])) ? v[0] : undefined; };
    const row = (label, ctrl) => tb.append(h('tr', {}, h('td', { text: label }), h('td', {}, ctrl)));
    const ro = (label, v) => tb.append(h('tr', {}, h('td', { text: label }), h('td', { class: 'ro', text: v })));
    const num = (label, get, set, isAng = false) => {
      const v = common(get);
      const inp = h('input', { type: 'text', value: v === undefined ? '*VARIES*' : G.fmt(isAng ? G.deg(v) : v, 4), onchange: () => { const n = parseFloat(inp.value); if (isNaN(n)) return P.render(); commit((e) => set(e, isAng ? G.rad(n) : n)); } , onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); } });
      row(label, inp);
    };
    const txt = (label, get, set) => { const v = common(get); const inp = h('input', { type: 'text', value: v === undefined ? '*VARIES*' : v ?? '', onchange: () => commit((e) => set(e, inp.value)), onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); } }); row(label, inp); };
    const sel_ = (label, get, opts, set) => { const v = common(get); const s = h('select', { onchange: () => commit((e) => set(e, opts.find((o) => String(o.v) === s.value)?.v)) }, v === undefined ? h('option', { text: '*VARIES*', selected: true }) : '', opts.map((o) => h('option', { value: o.v, selected: o.v === v, text: o.l }))); row(label, s); };
    if (!sel.length) {
      if (cat('General')) {
        const v = doc.vars;
        row('Color', h('select', { onchange: (e) => { doc.setvar('CECOLOR', +e.target.value); app.ui.refresh(); } }, [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: v.CECOLOR === c, text: colorName(c) }))));
        row('Layer', h('select', { onchange: (e) => { doc.clayer = e.target.value; app.ui.refresh(); } }, Object.keys(doc.layers).map((n) => h('option', { value: n, selected: n === doc.clayer, text: n }))));
        row('Linetype', h('select', { onchange: (e) => { doc.setvar('CELTYPE', e.target.value); app.ui.refresh(); } }, ['BYLAYER', 'BYBLOCK', ...Object.keys(doc.ltypes)].map((n) => h('option', { value: n, selected: n === v.CELTYPE, text: n }))));
        num('Linetype scale', () => v.CELTSCALE, (_, n) => doc.setvar('CELTSCALE', n));
        row('Lineweight', h('select', { onchange: (e) => doc.setvar('CELWEIGHT', +e.target.value) }, LWEIGHTS.map((w) => h('option', { value: w, selected: w === v.CELWEIGHT, text: lwName(w) }))));
      }
      if (cat('View')) { const c = app.view.cur; ro('Center X', G.fmt(c.cx, 4)); ro('Center Y', G.fmt(c.cy, 4)); ro('Height', G.fmt(app.view.H / c.s, 4)); ro('Width', G.fmt(app.view.W / c.s, 4)); }
      if (cat('Misc')) { ro('Annotation scale', '1:1'); ro('UCS icon On', app.settings.ucsIcon ? 'Yes' : 'No'); ro('Drawing', doc.name); ro('Space', doc.blockEdit ? `Block Editor: ${doc.blockEdit.name}` : doc.active); }
      body.replaceChildren(head, h('table', { class: 'pgrid' }, tb));
      return;
    }
    if (cat('General')) {
      const cv = common((e) => e.color ?? 256);
      row('Color', h('select', { onchange: async (e) => { let c = e.target.value; if (c === 'more') { c = await app.ui.dlg.color(cv ?? 256); if (c == null) return P.render(); } commit((x) => { x.color = +c; delete x.tc; }); } },
        cv === undefined ? h('option', { text: '*VARIES*', selected: true }) : '', [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: cv === c, text: colorName(c) })), cv !== undefined && ![256, 0, 1, 2, 3, 4, 5, 6, 7].includes(cv) ? h('option', { value: cv, selected: true, text: colorName(cv) }) : '', h('option', { value: 'more', text: 'Select Color...' })));
      sel_('Layer', (e) => e.layer, Object.keys(doc.layers).map((n) => ({ v: n, l: n })), (e, v) => (e.layer = v));
      sel_('Linetype', (e) => (e.ltype || 'BYLAYER').toUpperCase(), ['BYLAYER', 'BYBLOCK', ...Object.keys(doc.ltypes)].map((n) => ({ v: n, l: n === 'BYLAYER' ? 'ByLayer' : n === 'BYBLOCK' ? 'ByBlock' : n })), (e, v) => (e.ltype = v));
      num('Linetype scale', (e) => e.lts ?? 1, (e, v) => (e.lts = v));
      sel_('Lineweight', (e) => e.lw ?? -1, LWEIGHTS.map((w) => ({ v: w, l: lwName(w) })), (e, v) => (e.lw = v));
    }
    const t = common((e) => e.type);
    if (t && cat(t === 'TEXT' || t === 'MTEXT' ? 'Text' : 'Geometry')) {
      const P2 = (label, k) => { num(label + ' X', (e) => e[k].x, (e, v) => (e[k] = { ...e[k], x: v })); num(label + ' Y', (e) => e[k].y, (e, v) => (e[k] = { ...e[k], y: v })); };
      switch (t) {
        case 'LINE': P2('Start', 'p1'); P2('End', 'p2'); ro('Delta X', G.fmt(sel[0].p2.x - sel[0].p1.x)); ro('Delta Y', G.fmt(sel[0].p2.y - sel[0].p1.y));
          num('Length', (e) => G.dist(e.p1, e.p2), (e, v) => { e.p2 = G.polar(e.p1, G.ang(e.p1, e.p2), v); });
          num('Angle', (e) => G.normA(G.ang(e.p1, e.p2)), (e, v) => { e.p2 = G.polar(e.p1, v, G.dist(e.p1, e.p2)); }, true); break;
        case 'CIRCLE': P2('Center', 'c'); num('Radius', (e) => e.r, (e, v) => (e.r = v)); num('Diameter', (e) => e.r * 2, (e, v) => (e.r = v / 2));
          num('Circumference', (e) => G.TAU * e.r, (e, v) => (e.r = v / G.TAU)); num('Area', (e) => Math.PI * e.r * e.r, (e, v) => (e.r = Math.sqrt(v / Math.PI))); break;
        case 'ARC': P2('Center', 'c'); num('Radius', (e) => e.r, (e, v) => (e.r = v)); num('Start angle', (e) => G.normA(e.a1), (e, v) => (e.a1 = v), true); num('End angle', (e) => G.normA(e.a2), (e, v) => (e.a2 = v), true);
          ro('Total angle', G.fmt(G.deg(G.arcSweep(sel[0].a1, sel[0].a2)), 2)); ro('Arc length', G.fmt(E.entLength(sel[0]))); break;
        case 'LWPOLYLINE': {
          const e0 = sel[0];
          if (sel.length === 1) {
            vtx = Math.min(vtx, e0.pts.length - 1);
            const vs = h('input', { type: 'number', min: 1, max: e0.pts.length, value: vtx + 1, onchange: () => { vtx = Math.max(0, Math.min(e0.pts.length - 1, (+vs.value || 1) - 1)); P.render(); } });
            row('Current Vertex', vs);
            num('Vertex X', (e) => e.pts[vtx].x, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], x: v }));
            num('Vertex Y', (e) => e.pts[vtx].y, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], y: v }));
            num('Bulge', (e) => e.pts[vtx].b || 0, (e, v) => (e.pts[vtx] = { ...e.pts[vtx], b: v }));
          }
          num('Global width', (e) => e.cw_ || 0, (e, v) => (e.cw_ = v || undefined));
          sel_('Closed', (e) => !!e.closed, [{ v: false, l: 'No' }, { v: true, l: 'Yes' }], (e, v) => (e.closed = v));
          ro('Length', G.fmt(E.entLength(e0))); ro('Area', G.fmt(E.entArea(e0))); break;
        }
        case 'POINT': P2('Position', 'p'); break;
        case 'ELLIPSE': P2('Center', 'c'); num('Major radius', (e) => G.len(e.major), (e, v) => (e.major = G.mul(G.norm(e.major), v))); num('Minor radius', (e) => G.len(e.major) * e.ratio, (e, v) => (e.ratio = Math.min(1, v / G.len(e.major)))); num('Radius ratio', (e) => e.ratio, (e, v) => (e.ratio = v)); break;
        case 'TEXT': case 'ATTDEF':
          txt('Contents', (e) => (t === 'ATTDEF' ? e.def ?? '' : e.text), (e, v) => { if (t === 'ATTDEF') { e.def = v; e.text = v; } else e.text = v; });
          if (t === 'ATTDEF') { txt('Tag', (e) => e.tag, (e, v) => (e.tag = v.toUpperCase())); txt('Prompt', (e) => e.prompt || '', (e, v) => (e.prompt = v)); }
          sel_('Style', (e) => e.style || 'Standard', Object.keys(doc.styles).map((n) => ({ v: n, l: n })), (e, v) => (e.style = v));
          sel_('Justify', (e) => `${e.ha || 0},${e.va || 0}`, [['Left', '0,0'], ['Center', '1,0'], ['Right', '2,0'], ['Middle', '4,0'], ['Top left', '0,3'], ['Top center', '1,3'], ['Top right', '2,3'], ['Middle left', '0,2'], ['Middle center', '1,2'], ['Middle right', '2,2'], ['Bottom left', '0,1'], ['Bottom center', '1,1'], ['Bottom right', '2,1']].map(([l, v]) => ({ v, l })), (e, v) => { const f = E.textFrame(e); const [ha, va] = v.split(',').map(Number); e.ha = ha; e.va = va; if (ha || va) { const nf = E.textFrame({ ...e, p: { x: 0, y: 0 }, p2: { x: 0, y: 0 } }); const a = G.sub(f.o, nf.o); e.p = a; e.p2 = a; } else { e.p = f.o; delete e.p2; } });
          num('Height', (e) => e.h, (e, v) => (e.h = v)); num('Rotation', (e) => e.rot || 0, (e, v) => (e.rot = v), true); num('Width factor', (e) => e.wf || 1, (e, v) => (e.wf = v));
          P2('Position', 'p'); break;
        case 'MTEXT':
          txt('Contents', (e) => e.text.replace(/\\P/g, '¶'), (e, v) => (e.text = v.replace(/¶/g, '\\P')));
          row('', h('button', { class: 'btn', type: 'button', text: 'Edit text...', onclick: () => { app.cmd.sel = sel.slice(); app.cmd.run('DDEDIT'); } }));
          sel_('Attachment', (e) => e.att || 1, ['Top left', 'Top center', 'Top right', 'Middle left', 'Middle center', 'Middle right', 'Bottom left', 'Bottom center', 'Bottom right'].map((l, i) => ({ v: i + 1, l })), (e, v) => (e.att = v));
          num('Text height', (e) => e.h, (e, v) => (e.h = v)); num('Rotation', (e) => e.rot || 0, (e, v) => (e.rot = v), true); num('Defined width', (e) => e.w || 0, (e, v) => (e.w = v)); num('Line space factor', (e) => e.ls || 1, (e, v) => (e.ls = v));
          P2('Position', 'p'); break;
        case 'INSERT': {
          ro('Name', sel.length === 1 ? sel[0].name : common((e) => e.name) ?? '*VARIES*');
          P2('Position', 'p'); num('Scale X', (e) => e.sx ?? 1, (e, v) => (e.sx = v)); num('Scale Y', (e) => e.sy ?? 1, (e, v) => (e.sy = v)); num('Rotation', (e) => e.rot || 0, (e, v) => (e.rot = v), true);
          const blk = doc.blocks[sel[0].name];
          if (sel.length === 1 && blk?.params?.length && cat('Custom (Dynamic Block)')) {
            const dyn = { ...E.dynDefaults(blk), ...(sel[0].dyn || {}) };
            for (const p of blk.params) {
              if (p.type === 'linear') num(p.name, () => dyn[p.name], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: Math.max(0, v) }; E.invalidate(e); });
              else if (p.type === 'rotation') num(p.name, () => dyn[p.name], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); }, true);
              else if (p.type === 'flip') sel_(p.name, () => dyn[p.name] ? 1 : 0, [{ v: 0, l: 'Not flipped' }, { v: 1, l: 'Flipped' }], (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); });
              else if (p.type === 'visibility') sel_(p.name, () => dyn[p.name], p.states.map((s) => ({ v: s.name, l: s.name })), (e, v) => { e.dyn = { ...dyn, ...(e.dyn || {}), [p.name]: v }; E.invalidate(e); });
            }
          }
          if (sel.length === 1 && sel[0].attribs?.length && cat('Attributes')) for (const [i, a] of sel[0].attribs.entries()) txt(a.tag, (e) => e.attribs[i]?.text ?? '', (e, v) => { e.attribs[i] = { ...e.attribs[i], text: v }; E.invalidate(e.attribs[i]); });
          break;
        }
        case 'HATCH':
          sel_('Pattern', (e) => (e.solid ? 'SOLID' : (e.pattern || 'ANSI31').toUpperCase()), Object.keys(HATCHES).concat(sel.some((e) => !HATCHES[(e.pattern || '').toUpperCase()]) ? [(sel[0].pattern || '').toUpperCase()] : []).map((n) => ({ v: n, l: n })), (e, v) => { e.pattern = v; e.solid = v === 'SOLID'; delete e.pdef; });
          num('Scale', (e) => e.scale || 1, (e, v) => { e.scale = v; delete e.pdef; }); num('Angle', (e) => e.angle || 0, (e, v) => { e.angle = v; delete e.pdef; }, true); ro('Area', G.fmt(E.entArea(sel[0]))); break;
        case 'DIMENSION':
          ro('Measurement', G.fmt(E.dimMeasure(sel[0]), 4)); txt('Text override', (e) => e.text || '', (e, v) => (e.text = v || undefined));
          num('Dim scale overall', (e) => e.st?.dimscale ?? doc.dimstyle.dimscale, (e, v) => (e.st = { ...(e.st || {}), dimscale: v }));
          num('Text height', (e) => e.st?.dimtxt ?? doc.dimstyle.dimtxt, (e, v) => (e.st = { ...(e.st || {}), dimtxt: v }));
          num('Arrow size', (e) => e.st?.dimasz ?? doc.dimstyle.dimasz, (e, v) => (e.st = { ...(e.st || {}), dimasz: v }));
          num('Precision', (e) => e.st?.dimdec ?? doc.dimstyle.dimdec, (e, v) => (e.st = { ...(e.st || {}), dimdec: Math.round(v) })); break;
        case 'VIEWPORT':
          P2('Center', 'c'); num('Width', (e) => e.w, (e, v) => (e.w = v)); num('Height', (e) => e.h, (e, v) => (e.h = v));
          sel_('Standard scale', (e) => +e.scale.toFixed(6), [[1, '1:1'], [0.5, '1:2'], [0.2, '1:5'], [0.1, '1:10'], [0.05, '1:20'], [0.04, '1:25'], [0.02, '1:50'], [0.01, '1:100'], [0.005, '1:200'], [2, '2:1'], [5, '5:1'], [10, '10:1']].map(([v, l]) => ({ v, l })), (e, v) => (e.scale = v));
          num('Custom scale', (e) => e.scale, (e, v) => (e.scale = v));
          sel_('Display locked', (e) => !!e.locked, [{ v: false, l: 'No' }, { v: true, l: 'Yes' }], (e, v) => (e.locked = v)); break;
        case 'XLINE': case 'RAY': P2('Base point', 'p'); break;
        case 'SPLINE': ro('Fit points', String((sel[0].fit || []).length)); ro('Control points', String((sel[0].cps || []).length)); ro('Length', G.fmt(E.entLength(sel[0]))); break;
      }
    }
    body.replaceChildren(head, h('table', { class: 'pgrid' }, tb));
    void aciCss;
  };
  return P;
}
