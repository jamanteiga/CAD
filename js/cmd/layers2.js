// Capas y visualización: transparencia, estados de capa, propiedades de capa por ventana (VPLAYER),
// recorrido de capas (LAYWALK), traductor de capas (LAYTRANS), sistemas de coordenadas personales (SCP/UCS)
// y ventanas en mosaico del espacio modelo (VPORTS).
import * as G from '../core/geom.js';
import { Cancel } from './engine.js';
import { h } from '../ui/dom.js';
import { listManager } from '../ui/mgr.js';
import { t as T } from '../core/i18n.js';
import { saveSettings } from '../app.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };

// disposiciones de VPORTS (fracciones del área de dibujo)
export const VPORT_CFG = {
  '1': [[0, 0, 1, 1]],
  '2V': [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]],
  '2H': [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]],
  '3R': [[0, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0, 0.5, 1]],
  '3L': [[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '3A': [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '3B': [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]],
  '3V': [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]],
  '3H': [[0, 0, 1, 1 / 3], [0, 1 / 3, 1, 1 / 3], [0, 2 / 3, 1, 1 / 3]],
  '4': [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
};
const CFG_NAMES = { '1': 'Una', '2V': 'Dos: vertical', '2H': 'Dos: horizontal', '3R': 'Tres: derecha', '3L': 'Tres: izquierda', '3A': 'Tres: arriba', '3B': 'Tres: abajo', '3V': 'Tres: vertical', '3H': 'Tres: horizontal', '4': 'Cuatro: iguales' };

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); app.ui.layers?.render?.(); };
  const edit = (name, fn) => { const d = doc(); d.begin(name); d.touchTables(); try { fn(d); } finally { d.end(); } redraw(); };

  // ======================= TRANSPARENCIA =======================
  R('CETRANSPARENCY', async (c) => {
    const d = doc(), cur = d.vars.CETRANSPARENCY ?? -1;
    const v = await c.getString(`Enter new value for CETRANSPARENCY <"${cur < 0 ? 'ByLayer' : cur === -2 ? 'ByBlock' : cur}">:`, { def: String(cur) });
    if (v == null) return;
    const n = /^bylayer|^porcapa/i.test(v) ? -1 : /^byblock|^porbloque/i.test(v) ? -2 : Math.max(0, Math.min(90, Math.round(+v)));
    if (Number.isNaN(n)) { c.print('Requires an integer between 0 and 90.'); return; }
    d.setvar('CETRANSPARENCY', n);
  });
  R('SETTRANSPARENCY', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const v = await c.getString('Enter transparency value (0-90) or [ByLayer/ByBlock] <ByLayer>:', { def: 'ByLayer' }); if (v == null) return;
    const n = /^bylayer|^porcapa/i.test(v) ? -1 : /^byblock|^porbloque/i.test(v) ? -2 : Math.max(0, Math.min(90, Math.round(+v) || 0));
    const d = doc(); d.begin('TRANSPARENCY'); for (const e of s) d.mod(e, (x) => { if (n === -1) delete x.transp; else x.transp = n; }); d.end(); redraw();
  }, { alias: ['OBJTRANSP'] });
  R('LAYTRANSP', async (c) => {
    const names = need(await c.getString('Enter layer name(s) for transparency <current>:', { def: doc().clayer, spaces: true }));
    const v = need(await c.getInt('Enter transparency value (0-90) <0>:', { def: 0 }));
    edit('LAYER', (d) => { for (const n of String(names).split(',').map((x) => x.trim())) for (const l of Object.values(d.layers)) if (wc(l.name, n)) l.transp = Math.max(0, Math.min(90, v)); });
  });
  const wc = (name, pat) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i').test(name);

  // ======================= ESTADOS DE CAPA =======================
  const states = () => (doc().layerStates ||= {});
  const snapLayers = (d) => Object.fromEntries(Object.values(d.layers).map((l) => [l.name, { on: l.on, frozen: l.frozen, locked: l.locked, color: l.color, ltype: l.ltype, lw: l.lw, plot: l.plot, transp: l.transp || 0 }]));
  const saveState = (name, desc = '') => edit('LAYERSTATE', (d) => { states()[name] = { mask: 255, layers: snapLayers(d), clayer: d.clayer, desc }; });
  const restoreState = (name, o = {}) => {
    const st = states()[name]; if (!st) return false;
    edit('LAYERSTATE', (d) => {
      for (const [n, v] of Object.entries(st.layers)) { const l = d.layers[n]; if (l) Object.assign(l, v); else if (o.addMissing) d.ensureLayer(n, v); }
      if (o.offOthers) for (const l of Object.values(d.layers)) if (!st.layers[l.name]) l.on = false;
      if (st.clayer && d.layers[st.clayer] && !d.layers[st.clayer].frozen) d.clayer = st.clayer;
    });
    return true;
  };
  app.layerStates = { save: saveState, restore: restoreState };
  R('LAYERSTATE', async () => {
    await listManager(app, {
      title: 'Administrador de estados de capa',
      names: () => Object.keys(states()),
      info: (n) => { const s = states()[n]; if (!s) return ''; const ls = Object.values(s.layers); return `${s.desc ? s.desc + '\n\n' : ''}${tr('Capas')}: ${ls.length}\n${tr('Activadas')}: ${ls.filter((l) => l.on).length}\n${tr('Inutilizadas')}: ${ls.filter((l) => l.frozen).length}\n${tr('Bloqueadas')}: ${ls.filter((l) => l.locked).length}\n${tr('Capa actual')}: ${s.clayer || '0'}`; },
      buttons: [
        { t: 'Nuevo...', fn: async () => { const r = await app.ui.dlg.form('Nuevo estado de capa', [{ k: 'n', l: 'Nombre del estado de capa nuevo', v: `${tr('Estado')} ${Object.keys(states()).length + 1}` }, { k: 'd', l: 'Descripción', v: '' }]); if (!r || !r.n.trim()) return; saveState(r.n.trim(), r.d); return r.n.trim(); } },
        { t: 'Guardar', fn: (n) => { if (n) saveState(n, states()[n]?.desc || ''); } },
        { t: 'Restaurar', dbl: true, fn: (n) => { if (n) restoreState(n); } },
        { t: 'Restaurar (desactivar el resto)', fn: (n) => { if (n) restoreState(n, { offOthers: true }); } },
        { t: 'Renombrar...', fn: async (n) => { const nn = await app.ui.dlg.prompt('Renombrar', 'Nombre:', n); if (!nn || states()[nn]) return; edit('LAYERSTATE', () => { states()[nn] = states()[n]; delete states()[n]; }); return nn; } },
        { t: 'Suprimir', fn: (n) => edit('LAYERSTATE', () => delete states()[n]) },
        { t: 'Exportar...', fn: (n) => { if (!n) return; app.io.deliver(`${n}.las.json`, JSON.stringify({ name: n, ...states()[n] }, null, 1), 'application/json'); } },
        { t: 'Importar...', fn: async () => { const f = await app.io.pickFile('.json,.las'); if (!f) return; try { const o = JSON.parse(await f.text()); const n = o.name || f.name.replace(/\..*$/, ''); edit('LAYERSTATE', () => { states()[n] = { mask: 255, layers: o.layers || {}, clayer: o.clayer, desc: o.desc || '' }; }); return n; } catch (err) { app.ui.dlg.alert(err.message); } } },
      ],
    });
  }, { alias: ['LAS', 'LMAN'] });
  R('-LAYERSTATE', async (c) => {
    const k = await c.getKw('Enter an option [?/Save/Restore/Delete/Rename] <Save>:', 'Save'); if (k == null) return;
    if (k === '?') { c.print(Object.keys(states()).join(', ') || '*none*'); return; }
    const n = need(await c.getString('Enter layer state name:', { spaces: true }));
    if (k === 'Save') saveState(n);
    else if (k === 'Restore') { if (!restoreState(n)) c.print(`Layer state "${n}" not found.`); }
    else if (k === 'Delete') edit('LAYERSTATE', () => delete states()[n]);
    else if (k === 'Rename') { const nn = need(await c.getString('Enter new name:', { spaces: true })); edit('LAYERSTATE', () => { states()[nn] = states()[n]; delete states()[n]; }); }
  });

  // ======================= VPLAYER =======================
  const curVp = () => { const d = doc(); if (d.mspace) return d.mspace; return null; };
  R('VPLAYER', async (c) => {
    const d = doc();
    if (d.active === 'Model') { c.print('** Command not allowed in Model Tab **'); return; }
    for (;;) {
      const k = await c.getKw('Enter an option [?/Color/Freeze/Thaw/Reset/Transparency]:'); if (k == null) return;
      const vpAll = () => d.layout.ents.filter((e) => e.type === 'VIEWPORT');
      if (k === '?') { const vp = curVp() || vpAll()[0]; c.print(`${tr('Inutilizadas')}: ${(vp?.frozen || []).join(', ') || '*none*'}`); continue; }
      const names = need(await c.getString('Enter layer name(s) to apply:', { spaces: true }));
      let color = null, transp = null;
      if (k === 'Color') { const v = await c.getString('Enter color name or number (1-255):'); if (v == null) return; color = +v || ({ rojo: 1, red: 1, amarillo: 2, yellow: 2, verde: 3, green: 3, cian: 4, cyan: 4, azul: 5, blue: 5, magenta: 6, blanco: 7, white: 7 }[v.toLowerCase()] ?? 7); }
      if (k === 'Transparency') { const v = await c.getInt('Enter transparency value (0-90):'); if (v == null) return; transp = Math.max(0, Math.min(90, v)); }
      const w = await c.getKw('Specify viewports [All/Select/Current/Except current] <Current>:', 'Current'); if (w == null) return;
      let vps = [];
      if (w === 'All') vps = vpAll();
      else if (w === 'Select') vps = (await c.select('Select objects:', { filter: (e) => e.type === 'VIEWPORT' }));
      else if (w === 'Except current') vps = vpAll().filter((v) => v !== curVp());
      else vps = curVp() ? [curVp()] : [];
      if (!vps.length) { c.print('No viewport selected.'); continue; }
      const lays = Object.keys(d.layers).filter((n) => String(names).split(',').some((p) => wc(n, p.trim())));
      d.begin('VPLAYER');
      for (const vp of vps) d.mod(vp, (x) => {
        if (k === 'Freeze') x.frozen = [...new Set([...(x.frozen || []), ...lays])];
        else if (k === 'Thaw') x.frozen = (x.frozen || []).filter((n) => !lays.includes(n));
        else if (k === 'Reset') { x.frozen = (x.frozen || []).filter((n) => !lays.includes(n)); if (x.ovr) { x.ovr = { ...x.ovr }; for (const n of lays) delete x.ovr[n]; } }
        else { x.ovr = { ...(x.ovr || {}) }; for (const n of lays) x.ovr[n] = { ...(x.ovr[n] || {}), ...(color != null ? { color } : {}), ...(transp != null ? { transp } : {}) }; }
      });
      d.end(); redraw();
    }
  });

  // ======================= LAYWALK =======================
  R('LAYWALK', async () => {
    const d = doc(), saved = Object.fromEntries(Object.values(d.layers).map((l) => [l.name, { on: l.on, frozen: l.frozen }]));
    const names = Object.keys(d.layers).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const list = h('select', { multiple: true, size: Math.min(18, Math.max(8, names.length)), class: 'fld', style: { width: '280px' } }, names.map((n) => h('option', { value: n, text: n })));
    const filt = h('input', { class: 'fld', placeholder: '*', style: { width: '280px' } });
    const keep = h('input', { type: 'checkbox' });
    const apply = () => {
      const on = new Set([...list.selectedOptions].map((o) => o.value));
      for (const l of Object.values(d.layers)) { if (on.size) { l.on = on.has(l.name); l.frozen = on.has(l.name) ? false : saved[l.name].frozen; } else Object.assign(l, saved[l.name]); }
      d.rev++; app.view.redraw();
    };
    list.onchange = apply;
    filt.oninput = () => { const p = filt.value.trim(); for (const o of list.options) o.selected = !!p && p.split(',').some((x) => wc(o.value, x.trim() + (/[*?]/.test(x) ? '' : '*'))); apply(); };
    filt.onkeydown = (e) => e.stopPropagation();
    await app.ui.dlg.open({ title: 'Recorrido de capas', width: 'auto', body: [h('div', { class: 'hint', text: tr('Seleccione capas para ver solo su contenido (Ctrl o Mayús para varias).') }), filt, list, h('label', { class: 'row' }, keep, h('span', { text: tr('Conservar los cambios al cerrar') }))], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
    const sel = new Set([...list.selectedOptions].map((o) => o.value));
    for (const l of Object.values(d.layers)) Object.assign(l, saved[l.name]);
    if (keep.checked && sel.size) edit('LAYWALK', (dd) => { for (const l of Object.values(dd.layers)) { l.on = sel.has(l.name); if (sel.has(l.name)) l.frozen = false; } });
    d.rev++; redraw();
  }, { alias: ['LAYW'] });

  // ======================= LAYTRANS =======================
  R('LAYTRANS', async (c) => {
    const d = doc();
    let std = {}; // capas de la norma: nombre -> propiedades
    const rows = Object.keys(d.layers).filter((n) => n !== '0' && n !== 'Defpoints').sort();
    const tb = h('tbody');
    const dl = h('datalist', { id: 'laytrans-dl' });
    const fillDl = () => dl.replaceChildren(...[...new Set([...Object.keys(d.layers), ...Object.keys(std)])].map((n) => h('option', { value: n })));
    fillDl();
    const inputs = {};
    for (const n of rows) { const inp = h('input', { class: 'fld', list: 'laytrans-dl', value: '', placeholder: '—', onkeydown: (e) => e.stopPropagation() }); inputs[n] = inp; tb.append(h('tr', {}, h('td', { text: n }), h('td', { text: '→' }), h('td', {}, inp))); }
    const loadStd = h('button', { class: 'btn', type: 'button', text: tr('Cargar norma (DXF, JSON)...'), onclick: async () => {
      const f = await app.io.pickFile('.dxf,.dws,.dwt,.json'); if (!f) return;
      try {
        if (/\.json$/i.test(f.name)) { const o = JSON.parse(await f.text()); std = o.layers || o; }
        else { const o = await app.io.parseFile?.(f); std = o?.layers || {}; }
        fillDl(); for (const n of rows) if (std[n]) inputs[n].value = n; c.print(`${Object.keys(std).length} standard layer(s) loaded.`);
      } catch (err) { app.ui.dlg.alert(err.message); }
    } });
    const auto = h('button', { class: 'btn', type: 'button', text: tr('Asignar por nombre igual'), onclick: () => { for (const n of rows) { const m = Object.keys(std).find((k) => k.toLowerCase() === n.toLowerCase()); if (m) inputs[n].value = m; } } });
    const purge = h('input', { type: 'checkbox', checked: true });
    const ok = await app.ui.dlg.open({ title: 'Traductor de capas', width: 'auto', body: [h('div', { class: 'row', style: { gap: '6px' } }, loadStd, auto), dl, h('div', { style: { maxHeight: '50vh', overflow: 'auto' } }, h('table', { class: 'pgrid' }, h('thead', {}, h('tr', {}, h('th', { text: tr('Traducir de') }), h('th'), h('th', { text: tr('Traducir a') }))), tb)), h('label', { class: 'row' }, purge, h('span', { text: tr('Limpiar las capas traducidas') }))], onOk: () => true });
    if (!ok) return;
    const map = Object.fromEntries(rows.map((n) => [n, inputs[n].value.trim()]).filter(([n, v]) => v && v !== n));
    if (!Object.keys(map).length) return;
    let k = 0;
    d.begin('LAYTRANS'); d.touchTables();
    for (const to of new Set(Object.values(map))) if (!d.layers[to]) d.ensureLayer(to, std[to] ? { color: std[to].color, ltype: std[to].ltype, lw: std[to].lw } : {});
    for (const e of d.allEntsDeep()) if (map[e.layer]) { d.touch(e); e.layer = map[e.layer]; k++; }
    if (purge.checked) for (const n of Object.keys(map)) if (n !== d.clayer) delete d.layers[n];
    if (map[d.clayer]) d.clayer = map[d.clayer];
    d.end(); c.print(`${k} object(s) translated.`); redraw();
  });

  // ======================= SCP (UCS) =======================
  const ucs = () => doc().ext.ucs;
  const setUcs = (u, name = '') => edit('UCS', (d) => { if (d.ext.ucs !== undefined) (d.ext.ucsPrev ||= []).push(d.ext.ucs); d.ext.ucs = u && (Math.abs(u.a) > 1e-12 || Math.abs(u.o.x) > 1e-12 || Math.abs(u.o.y) > 1e-12) ? { o: { x: u.o.x, y: u.o.y }, a: G.normA(u.a) } : null; d.vars.UCSNAME = d.ext.ucs ? name : 'WORLD'; });
  app.setUcs = setUcs;
  const toW = (p) => { const u = ucs(); return u ? G.add(u.o, G.rotate(p, { x: 0, y: 0 }, u.a)) : p; };
  R('UCS', async (c) => {
    const u = ucs() || { o: { x: 0, y: 0 }, a: 0 };
    c.print(`Current ucs name:  *${u === ucs() ? (doc().vars.UCSNAME || 'NO NAME') : 'WORLD'}*`);
    const k = await c.getPoint('Specify origin of UCS or [Face/NAmed/OBject/Previous/View/World/X/Y/Z/ZAxis] <World>:', { def: 'World' });
    if (k == null) return;
    if (isPt(k)) {
      const o = k;
      const p2 = await c.getPoint('Specify point on X-axis or <Accept>:', { base: o });
      if (p2 == null) return;
      setUcs({ o, a: isPt(p2) ? G.ang(o, p2) : u.a }); return;
    }
    if (k === 'World') return setUcs(null);
    if (k === 'Previous') { const d = doc(); const prev = (d.ext.ucsPrev || []).pop(); edit('UCS', (dd) => { dd.ext.ucs = prev || null; }); void prev; return; }
    if (k === 'Z' || k === 'ZAxis') { const a = need(await c.getAngle('Specify rotation angle about Z axis <90>:', { def: Math.PI / 2 })); setUcs({ o: u.o, a: u.a + a }); return; }
    if (k === 'X' || k === 'Y') { c.print('Only rotation about Z is available in 2D.'); return; }
    if (k === 'View') return setUcs({ o: u.o, a: 0 });
    if (k === 'OBject' || k === 'Face') {
      const r = need(await c.entsel('Select object to align UCS:'));
      const e = r.e; let o = r.p, a = 0;
      if (e.type === 'LINE') { o = G.dist(r.p, e.p1) < G.dist(r.p, e.p2) ? e.p1 : e.p2; a = G.ang(e.p1, e.p2); }
      else if (e.type === 'LWPOLYLINE') { o = e.pts[0]; a = G.ang(e.pts[0], e.pts[1]); }
      else if (e.type === 'CIRCLE' || e.type === 'ARC') { o = e.c; a = e.type === 'ARC' ? e.a1 : 0; }
      else if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'INSERT') { o = e.p; a = e.rot || 0; }
      else if (e.type === 'DIMENSION') { o = e.dp || e.p1; a = e.rot || 0; }
      setUcs({ o: { x: o.x, y: o.y }, a }); return;
    }
    if (k === 'NAmed') {
      const kk = await c.getKw('Enter an option [Restore/Save/Delete/?]:'); if (kk == null) return;
      const named = doc().ext.ucsNamed;
      if (kk === '?') { c.print(Object.keys(named).join(', ') || '*none*'); return; }
      const n = need(await c.getString('Enter name of UCS:'));
      if (kk === 'Save') edit('UCS', () => { named[n] = ucs() ? JSON.parse(JSON.stringify(ucs())) : null; });
      else if (kk === 'Restore') { if (n in named) setUcs(named[n], n); else c.print(`Cannot find UCS ${n}.`); }
      else if (kk === 'Delete') edit('UCS', () => delete named[n]);
    }
  }, { alias: ['SCP'] });
  R('UCSMAN', async () => {
    const d = doc(), named = d.ext.ucsNamed;
    await listManager(app, {
      title: 'SCP',
      names: () => ['Universal', ...Object.keys(named)], cur: () => (ucs() ? d.vars.UCSNAME || tr('Sin nombre') : 'Universal'),
      info: (n) => { const u = n === 'Universal' ? null : named[n]; return u ? `${tr('Origen')}: ${G.fmt(u.o.x)}, ${G.fmt(u.o.y)}\n${tr('Ángulo')}: ${G.fmt(G.deg(u.a), 2)}°` : `${tr('Origen')}: 0, 0\n${tr('Ángulo')}: 0°`; },
      buttons: [
        { t: 'Definir actual', dbl: true, fn: (n) => setUcs(n === 'Universal' ? null : named[n], n) },
        { t: 'Guardar actual como...', fn: async () => { const n = await app.ui.dlg.prompt('SCP', 'Nombre:', ''); if (!n) return; edit('UCS', () => { named[n] = ucs() ? JSON.parse(JSON.stringify(ucs())) : { o: { x: 0, y: 0 }, a: 0 }; }); d.vars.UCSNAME = n; return n; } },
        { t: 'Suprimir', fn: (n) => { if (n !== 'Universal') edit('UCS', () => delete named[n]); } },
      ],
    });
  }, { alias: ['UC', 'DDUCS'] });
  R('UCSICON', async (c) => {
    const k = await c.getKw(`Enter an option [ON/OFF/All/Noorigin/ORigin] <${app.settings.ucsIcon ? 'ON' : 'OFF'}>:`, app.settings.ucsIcon ? 'ON' : 'OFF'); if (k == null) return;
    if (k === 'ON' || k === 'OFF') app.settings.ucsIcon = k === 'ON';
    if (k === 'ORigin' || k === 'Noorigin') app.settings.ucsIconOrigin = k === 'ORigin';
    saveSettings(); app.view.redrawOverlay();
  });
  R('PLAN', async (c) => { const k = await c.getKw('Enter an option [Current ucs/Ucs/World] <Current ucs>:', 'Current ucs'); if (k == null) return; app.view.zoomExtents(); });
  app.ucsToWorld = toW;

  // ======================= VPORTS =======================
  const applyTiles = (cfg) => {
    const d = doc(), v0 = { ...app.view.views.Model };
    if (cfg === '1' || !VPORT_CFG[cfg]) { const cur = d.ext.vports; if (cur?.tiles?.length > 1) app.view.views.Model = { ...cur.tiles[cur.act].v }; d.ext.vports = null; app.view.syncTiles(); app.view.redraw(); return; }
    d.ext.vports = { cfg, act: 0, tiles: VPORT_CFG[cfg].map(([x, y, w, hh]) => ({ x, y, w, h: hh, v: { ...v0 } })) };
    app.view.syncTiles();
    // cada ventana se ajusta a su tamaño mostrando la misma zona
    const bb = app.view.worldBB(v0);
    d.ext.vports.tiles.forEach((_, i) => { d.ext.vports.act = i; app.view.syncTiles(); app.view.zoomWindow(bb, 1); });
    d.ext.vports.act = 0; app.view.syncTiles(); app.view.redraw();
  };
  app.setVports = applyTiles;
  R('VPORTS', async (c) => {
    const d = doc();
    if (d.active !== 'Model') { c.print('Use MVIEW in a layout.'); return eng.run('MVIEW'); }
    const named = (d.ext.vportsNamed ||= {});
    const r = await app.ui.dlg.form('Ventanas', [
      { k: 'cfg', l: 'Ventanas estándar', v: d.ext.vports?.cfg || '1', t: 'select', opts: Object.entries(CFG_NAMES).map(([v, l]) => ({ v, l: tr(l) })) },
      { k: 'name', l: 'Nombre de configuración nueva (opcional)', v: '' },
      { k: 'restore', l: 'Ventanas guardadas', v: '', t: 'select', opts: [{ v: '', l: '—' }, ...Object.keys(named).map((n) => ({ v: n, l: n }))] },
    ]);
    if (!r) return;
    if (r.restore) { d.ext.vports = JSON.parse(JSON.stringify(named[r.restore])); app.view.syncTiles(); app.view.redraw(); return; }
    applyTiles(r.cfg);
    if (r.name?.trim() && d.ext.vports) named[r.name.trim()] = JSON.parse(JSON.stringify(d.ext.vports));
  }, { alias: ['VENTANAS'] });
  R('-VPORTS', async (c) => {
    const d = doc();
    const k = await c.getKw('Enter an option [Save/Restore/Delete/Join/SIngle/?/2/3/4] <3>:', '3'); if (k == null) return;
    const named = (d.ext.vportsNamed ||= {});
    if (k === 'SIngle' || k === 'Join') return applyTiles('1');
    if (k === '?') { c.print(Object.keys(named).join(', ') || '*none*'); return; }
    if (k === 'Save') { const n = need(await c.getString('Enter name for new viewport configuration:')); named[n] = d.ext.vports ? JSON.parse(JSON.stringify(d.ext.vports)) : null; return; }
    if (k === 'Restore') { const n = need(await c.getString('Enter name of viewport configuration to restore:')); if (named[n]) { d.ext.vports = JSON.parse(JSON.stringify(named[n])); app.view.syncTiles(); app.view.redraw(); } else applyTiles('1'); return; }
    if (k === 'Delete') { const n = need(await c.getString('Enter name of viewport configuration to delete:')); delete named[n]; return; }
    if (k === '2') { const o = await c.getKw('Enter a configuration option [Horizontal/Vertical] <Vertical>:', 'Vertical'); if (o == null) return; return applyTiles(o === 'Horizontal' ? '2H' : '2V'); }
    if (k === '3') { const o = await c.getKw('Enter a configuration option [Horizontal/Vertical/Above/Below/Left/Right] <Right>:', 'Right'); if (o == null) return; return applyTiles({ Horizontal: '3H', Vertical: '3V', Above: '3A', Below: '3B', Left: '3L', Right: '3R' }[o]); }
    if (k === '4') return applyTiles('4');
  });
}
