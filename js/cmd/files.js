// Plantillas, propiedades del dibujo y campos.
// NEW / QNEW con plantillas (incluidas o .dwt/.dxf/.wcad propias), DWGPROPS, FIELD, UPDATEFIELD.
import * as E from '../core/entities.js';
import { h } from '../ui/dom.js';
import { TEMPLATES, buildTemplate } from '../core/templates.js';
import { docBase, t } from '../core/i18n.js';

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const dlg = () => app.ui.dlg;

  // ---- nuevo dibujo desde plantilla
  const nextName = () => { const n = (app.io._newN = (app.io._newN || 1) + 1); return `${docBase()}${n}.dwg`; };
  app.io.newFromTemplate = async (id) => {
    const s = app.settings;
    id = id || s.template || 'iso-a3';
    let d;
    if (id.startsWith('file:')) {
      const saved = (s.userTemplates || []).find((t) => 'file:' + t.name === id);
      if (!saved) return app.io.newFromTemplate('iso-a3');
      d = await app.io.docFromText(saved.name, saved.data);
      d.name = nextName(); d._fh = null; d.modified = false;
    } else d = buildTemplate(id, { name: nextName() });
    app.addDoc(d);
    app.view.zoomExtents?.();
    return d;
  };
  dlg().template = async () => {
    const s = app.settings;
    let sel = s.template || 'iso-a3';
    const list = h('div', { class: 'list', style: { minWidth: 'min(420px, 80vw)', maxHeight: '320px' } });
    const render = () => {
      list.innerHTML = '';
      const all = [...TEMPLATES.map((t) => ({ id: t.id, name: t.name })), ...(s.userTemplates || []).map((t) => ({ id: 'file:' + t.name, name: t.name, user: true }))];
      for (const t of all) list.append(h('div', { class: 'li' + (t.id === sel ? ' on' : ''), onclick: () => { sel = t.id; render(); }, ondblclick: () => box?.querySelector('.btn.pri')?.click() }, h('span', { text: t.name }), t.user ? h('small', { class: 'hint', text: 'plantilla propia' }) : ''));
    };
    render();
    const def = h('input', { type: 'checkbox', checked: true });
    const add = h('button', { class: 'btn', type: 'button', text: 'Añadir plantilla (.dwt/.dxf/.wcad)...', onclick: async () => {
      const f = await app.io.pickFile('.dwt,.dxf,.wcad,.dwg'); if (!f) return;
      const data = /\.(dwg|dwt)$/i.test(f.name) ? { b64: btoa(String.fromCharCode(...new Uint8Array(await f.arrayBuffer()))) } : await f.text();
      s.userTemplates = [...(s.userTemplates || []).filter((t) => t.name !== f.name), { name: f.name, data }];
      sel = 'file:' + f.name; app.saveSettings(); render();
    } });
    let box;
    const r = await dlg().open({ title: 'Seleccionar plantilla', init: (b) => (box = b), body: [list, h('div', { class: 'row' }, add), h('label', { class: 'row' }, def, 'Usar como plantilla predeterminada (QNEW)')], onOk: () => sel });
    if (!r) return null;
    if (def.checked) { s.template = r; app.saveSettings(); }
    return r;
  };
  R('NEW', async () => { const id = await dlg().template(); if (id) await app.io.newFromTemplate(id); }, {});
  R('QNEW', async () => app.io.newFromTemplate());

  // ---- propiedades del dibujo
  R('DWGPROPS', async () => {
    const d = doc(), p = d.props;
    const custom = h('textarea', { class: 'fld', rows: 5, style: { width: '100%' } });
    custom.value = Object.entries(p.custom || {}).map(([k, v]) => `${k}=${v}`).join('\n');
    const r = await dlg().form('Propiedades del dibujo', [
      { k: 'title', l: 'Título', v: p.title }, { k: 'subject', l: 'Asunto', v: p.subject }, { k: 'author', l: 'Autor', v: p.author },
      { k: 'keywords', l: 'Palabras clave', v: p.keywords }, { k: 'comments', l: 'Comentarios', v: p.comments }, { k: 'revision', l: 'Revisión', v: p.revision },
    ], h('div', { class: 'frm' }, h('label', { text: 'Personalizadas (NOMBRE=valor)' }), custom));
    if (!r) return;
    d.begin('DWGPROPS'); d.touchTables();
    Object.assign(p, r);
    p.custom = Object.fromEntries(custom.value.split('\n').map((l) => l.split('=')).filter((a) => a[0]?.trim()).map(([k, ...v]) => [k.trim().toUpperCase(), v.join('=').trim()]));
    d.end();
    refreshFields();
  });

  // ---- campos
  const FIELDS = [
    ['Título', '%<\\AcVar Title>%'], ['Asunto', '%<\\AcVar Subject>%'], ['Autor', '%<\\AcVar Author>%'], ['Palabras clave', '%<\\AcVar Keywords>%'],
    ['Comentarios', '%<\\AcVar Comments>%'], ['Número de revisión', '%<\\AcVar RevisionNumber>%'], ['Nombre de archivo', '%<\\AcVar Filename \\f "%fn2">%'],
    ['Fecha de hoy', '%<\\AcVar Date \\f "dd/MM/yyyy">%'], ['Fecha de guardado', '%<\\AcVar SaveDate \\f "dd/MM/yyyy">%'], ['Fecha de trazado', '%<\\AcVar PlotDate \\f "dd/MM/yyyy">%'],
    ['Presentación actual', '%<\\AcVar ctab>%'],
  ];
  const refreshFields = () => { for (const d of app.docs) for (const e of d.allEntsDeep()) if (E.hasFields(e.text) || e.attribs?.some((a) => E.hasFields(a.text))) { E.invalidate(e); e.attribs?.forEach(E.invalidate); } app.view.redraw(); };
  app.refreshFields = refreshFields;
  dlg().field = async () => {
    const d = doc();
    const custom = Object.keys(d.props.custom || {}).map((k) => [`Personalizada: ${k}`, `%<\\AcVar CustomDP.${k}>%`]);
    const all = [...FIELDS, ...custom];
    const r = await dlg().form('Campo', [{ k: 'f', l: 'Campo', v: all[0][1], t: 'select', opts: all.map(([l, v]) => ({ v, l: `${l} — ${E.decodeSpecial(v) || '—'}` })) }]);
    return r?.f || null;
  };
  R('FIELD', async (c) => {
    const code = await dlg().field(); if (!code) return;
    const p = await c.getPoint('Specify start point of text:'); if (!p || typeof p !== 'object') return;
    const ht = await c.getDist(`Specify height <${doc().vars.TEXTSIZE}>:`, { base: p, def: doc().vars.TEXTSIZE });
    const d = doc(); d.begin('FIELD');
    d.add({ type: 'TEXT', p, h: ht || d.vars.TEXTSIZE, text: code, rot: 0, style: d.vars.TEXTSTYLE, layer: d.clayer, color: d.vars.CECOLOR }, d.space);
    d.end();
  });
  // ---- referencias externas: lista, cargar/recargar, unir y desenlazar
  R('XREF', async () => {
    const d = doc();
    const render = (list) => {
      list.innerHTML = '';
      const xr = Object.values(d.blocks).filter((b) => b.xref);
      if (!xr.length) list.append(h('div', { class: 'hint', text: 'El dibujo no tiene referencias externas. Use Enlazar para añadir una.' }));
      for (const b of xr) {
        const n = [...d.allEntsDeep()].filter((e) => e.type === 'INSERT' && e.name === b.name).length;
        list.append(h('div', { class: 'row', style: { justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '4px 0' } },
          h('span', {}, h('b', { text: b.name }), ' ', h('small', { class: 'hint', text: `${b.xref.path || ''} · ${b.xref.loaded ? t('cargada') : t('sin cargar')} · ${n} ${t('inserciones')}` })),
          h('span', { class: 'row' },
            h('button', { class: 'btn', type: 'button', text: b.xref.loaded ? 'Recargar...' : 'Cargar...', onclick: async () => { const f = await app.io.pickFile('.dwg,.dxf,.wcad'); if (!f) return; d.begin('XREF'); d.touchTables(); await app.io.importAsBlock(f, { name: b.name, xref: true }); d.end(); app.view.redraw(); render(list); } }),
            h('button', { class: 'btn', type: 'button', text: 'Unir', onclick: () => { d.begin('XREF'); d.touchTables(); delete b.xref; d.end(); render(list); } }),
            h('button', { class: 'btn', type: 'button', text: 'Desenlazar', onclick: () => { d.begin('XREF'); for (const e of [...d.allEntsDeep()]) if (e.type === 'INSERT' && e.name === b.name) d.remove(e); d.touchTables(); delete d.blocks[b.name]; d.end(); render(list); } }))));
      }
    };
    const list = h('div', { style: { minWidth: 'min(560px, 85vw)' } }); render(list);
    await dlg().open({ title: 'Referencias externas', body: [list, h('button', { class: 'btn', type: 'button', text: 'Enlazar...', onclick: async () => { const f = await app.io.pickFile('.dwg,.dxf,.wcad'); if (!f) return; d.begin('XREF'); d.touchTables(); await app.io.importAsBlock(f, { xref: true }); d.end(); render(list); } })], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
  }, { alias: ['EXTERNALREFERENCES', 'XR'] });
  R('UPDATEFIELD', async () => { refreshFields(); }, { alias: ['UPDATEFIELDS'] });
}
