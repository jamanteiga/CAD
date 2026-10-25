// Vista, capas, ajustes, archivos, presentaciones, portapapeles y utilidades
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { LINETYPES } from '../core/tables.js';
import { parseColor } from './modify.js';
const { M } = G;
const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);

export function register(eng, app) {
  const doc = () => app.doc, view = () => app.view;
  const R = (n, fn, o) => eng.register(n, fn, o);
  const hist = [];
  const pushView = () => { hist.push({ ...view().cur }); if (hist.length > 30) hist.shift(); };

  // ---------------- ZOOM / PAN
  R('ZOOM', async (c) => {
    pushView();
    const r = await c.getPoint('Specify corner of window, enter a scale factor (nX or nXP), or\n[All/Center/Dynamic/Extents/Previous/Scale/Window/Object] <real time>:', { allowString: true, allowNumber: true });
    const v = view();
    if (r == null) { await c.ask({ kind: 'pan', prompt: 'Press ESC or ENTER to exit. Use the mouse wheel to zoom and drag to pan.' }).catch(() => {}); return; }
    if (isPt(r)) { const q = need(await c.getCorner('Specify opposite corner:', r)); if (isPt(q)) v.zoomWindow({ x1: Math.min(r.x, q.x), y1: Math.min(r.y, q.y), x2: Math.max(r.x, q.x), y2: Math.max(r.y, q.y) }, 1); return; }
    const scaleStr = async (s) => {
      const m = /^([\d.]+)\s*(x|xp)?$/i.exec(String(s).trim()); if (!m) return false;
      const k = +m[1], cur = v.cur;
      if ((m[2] || '').toLowerCase() === 'xp' && doc().mspace) { const pv = v.paperView(); v.setCur({ ...cur, s: pv.s * k }); return true; }
      v.setCur({ ...cur, s: (m[2] ? cur.s * k : cur.s * k) }); return true;
    };
    if (typeof r === 'number') { await scaleStr(String(r)); return; }
    if (r.str) { if (!(await scaleStr(r.str))) c.print('Requires a distance, numberX, or option keyword.'); return; }
    switch (r) {
      case 'All': case 'Extents': v.zoomExtents(); break;
      case 'Previous': hist.pop(); { const p = hist.pop(); if (p) v.setCur(p); else c.print('No previous view saved.'); } break;
      case 'Window': { const a = need(await c.getPoint('Specify first corner:')); const b = need(await c.getCorner('Specify opposite corner:', a)); v.zoomWindow({ x1: Math.min(a.x, b.x), y1: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y) }, 1); break; }
      case 'Center': { const p = need(await c.getPoint('Specify center point:')); const h = need(await c.getDist(`Enter magnification or height <${F(v.H / v.cur.s)}>:`, { def: v.H / v.cur.s })); v.setCur({ cx: p.x, cy: p.y, s: v.H / h }); break; }
      case 'Scale': { const s = need(await c.getString('Enter a scale factor (nX or nXP):')); await scaleStr(s); break; }
      case 'Object': { const s = await c.select(); const bb = doc().extents(s); if (bb) v.zoomWindow(bb); break; }
      case 'Dynamic': v.zoomExtents(); break;
    }
  }, { transparent: true, pickfirst: false, keepSel: true });
  R('PAN', async (c) => { pushView(); await c.ask({ kind: 'pan', prompt: 'Press ESC or ENTER to exit, or right-click to display shortcut menu.' }).catch(() => {}); }, { transparent: true, keepSel: true });
  R('-PAN', async (c) => { const a = need(await c.getPoint('Specify base point or displacement:')); const b = need(await c.getPoint('Specify second point:', { base: a })); const v = view().cur; view().setCur({ ...v, cx: v.cx - (b.x - a.x), cy: v.cy - (b.y - a.y) }); }, { transparent: true });
  R('REGEN', async () => { for (const e of doc().allEntsDeep()) E.invalidate(e); view().redraw(); app.log('Regenerating model.'); }, { alias: ['REGENALL', 'RE', 'REA'], keepSel: true });
  R('REDRAW', async () => view().redraw(), { transparent: true, alias: ['R', 'REDRAWALL'], keepSel: true });
  R('VIEW', async (c) => {
    const k = await c.getKw('Enter an option [?/Delete/Orthographic/Restore/Save/sEttings/Window]:');
    const vs = doc().views;
    if (k === '?') c.print(Object.keys(vs).join('\n') || 'No named views.');
    if (k === 'Save') { const n = need(await c.getString('Enter view name to save:')); vs[n] = { ...view().cur, space: doc().active }; }
    if (k === 'Restore') { const n = need(await c.getString('Enter view name to restore:')); if (vs[n]) view().setCur(vs[n]); else c.print('View not found.'); }
    if (k === 'Delete') { const n = need(await c.getString('Enter view name(s) to delete:')); delete vs[n]; }
    if (k === 'Window') { const n = need(await c.getString('Enter view name to save:')); const a = need(await c.getPoint('Specify first corner:')); const b = need(await c.getCorner('Specify opposite corner:', a)); vs[n] = { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, s: Math.min(view().W / Math.abs(b.x - a.x), view().H / Math.abs(b.y - a.y)) }; }
  }, { alias: ['-VIEW', 'V'] });

  // ---------------- conmutadores
  const toggle = (name, label) => async (c) => {
    const d = doc(), cur = d.vars[name];
    const r = await c.getString(`Enter mode [ON/OFF] <${cur ? 'ON' : 'OFF'}>:`, { def: cur ? 'ON' : 'OFF' });
    if (r == null) return;
    const U = String(r).toUpperCase();
    if (U === 'ON' || U === 'OFF') d.setvar(name, U === 'ON' ? 1 : 0);
    else if (!isNaN(+U) && label) { d.setvar(label, +U); d.setvar(name, 1); }
    view().redraw(); app.ui?.status?.update?.();
  };
  R('ORTHO', toggle('ORTHOMODE'), { transparent: true });
  R('GRID', toggle('GRIDMODE', 'GRIDUNIT'), { transparent: true });
  R('SNAP', toggle('SNAPMODE', 'SNAPUNIT'), { transparent: true });
  R('FILL', toggle('FILLMODE'), { transparent: true });
  R('QTEXT', toggle('QTEXTMODE'), { transparent: true });
  R('LWDISPLAY', toggle('LWDISPLAY'), { transparent: true });
  R('-OSNAP', async (c) => {
    const r = need(await c.getString('Enter list of object snap modes:'));
    const map = { END: 1, MID: 2, CEN: 4, NOD: 8, QUA: 16, INT: 32, INS: 64, PER: 128, TAN: 256, NEA: 512, APP: 2048, EXT: 4096, PAR: 8192, NON: 0, OFF: 0 };
    let v = 0; for (const t of r.toUpperCase().split(',')) v |= map[t.trim().slice(0, 3)] || 0;
    doc().setvar('OSMODE', v); app.ui?.status?.update?.();
  }, { transparent: true });
  R('DSETTINGS', async () => { await app.ui.dlg.dsettings(); app.ui?.status?.update?.(); view().redraw(); }, { alias: ['DS', 'SE', 'OSNAP', 'OS', 'DDOSNAP', 'DDRMODES', 'RM'], transparent: true, keepSel: true });
  R('SETVAR', async (c) => {
    const n = need(await c.getString('Enter variable name or [?]:'));
    if (n === '?') { const all = { ...doc().vars }; c.print(Object.keys(all).sort().map((k) => `${k.padEnd(16)} ${JSON.stringify(all[k])}`).join('\n')); app.ui?.cmdline?.expand?.(true); return; }
    await c.sysvarPrompt(n);
  }, { transparent: true, alias: ['SET'] });
  eng.sysvarPrompt = async (n) => {
    const d = doc(), cur = d.getvar(n);
    if (cur === undefined) { eng.print(`Unknown variable name.  Type SETVAR ? for a list of variables.`); return; }
    const show = typeof cur === 'object' && cur ? `${F(cur.x)},${F(cur.y)}` : typeof cur === 'number' ? F(cur, 6) : cur;
    const v = await eng.getString(`Enter new value for ${n.toUpperCase()} <${show}>:`, { spaces: typeof cur === 'string' });
    if (v == null || v === '') return;
    try { d.setvar(n, typeof cur === 'number' ? +v : v); } catch (e) { eng.print(e.message); }
    view().redraw(); app.ui?.status?.update?.(); app.ui?.refresh?.();
  };
  R('LTSCALE', async (c) => { const v = need(await c.getReal(`Enter new linetype scale factor <${F(doc().vars.LTSCALE)}>:`, { def: doc().vars.LTSCALE, positive: true })); doc().setvar('LTSCALE', v); view().redraw(); }, { alias: ['LTS'], transparent: true });
  R('CELTSCALE', async (c) => { const v = need(await c.getReal(`Enter new value for CELTSCALE <${F(doc().vars.CELTSCALE)}>:`, { def: doc().vars.CELTSCALE })); doc().setvar('CELTSCALE', v); }, { transparent: true });
  R('PDMODE', async () => eng.sysvarPrompt('PDMODE'), { transparent: true });
  R('DDPTYPE', async () => { await app.ui.dlg.ptype(); view().redraw(); }, { alias: ['PTYPE'] });
  R('LIMITS', async (c) => { const a = await c.getPoint('Specify lower left corner or [ON/OFF] <0.0000,0.0000>:', { def: { x: 0, y: 0 } }); if (isPt(a)) { const b = await c.getPoint('Specify upper right corner <420.0000,297.0000>:', { def: { x: 420, y: 297 } }); if (isPt(b)) { doc().vars.LIMMIN = a; doc().vars.LIMMAX = b; } } });
  R('UNITS', async () => { await app.ui.dlg.units(); }, { alias: ['UN', 'DDUNITS'], transparent: true });

  // ---------------- capas
  R('LAYER', async () => app.ui.layers.show(), { alias: ['LA', 'DDLMODES', 'LAYERPALETTE'], transparent: true, keepSel: true });
  R('LAYERCLOSE', async () => app.ui.layers.hide());
  R('-LAYER', async (c) => {
    const d = doc();
    for (;;) {
      c.print(`Current layer:  "${d.clayer}"`);
      const k = await c.getKw('Enter an option [?/Make/Set/New/Rename/ON/OFF/Color/Ltype/LWeight/TRansparency/MATerial/Plot/Freeze/Thaw/LOck/Unlock/stAte/Description/rEconcile]:');
      if (!k) return;
      const names = async (msg) => { const r = String(need(await c.getString(msg, { spaces: true }))).split(',').map((s) => s.trim()).filter(Boolean); return r.length ? r : [d.clayer]; };
      const each = (list, fn) => { d.touchTables(); for (const n of list) { const ks = Object.keys(d.layers).filter((x) => wild(x, n)); for (const x of ks) fn(d.layers[x]); } app.ui?.refresh?.(); view().redraw(); };
      if (k === '?') c.print(Object.values(d.layers).map((l) => `${l.name.padEnd(24)} ${l.on ? 'On ' : 'Off'} ${l.frozen ? 'Frozen' : '      '} ${l.locked ? 'Lck' : '   '} ${String(l.color).padStart(3)} ${l.ltype}`).join('\n'));
      if (k === 'Make' || k === 'New') { const ns = await names(`Enter name${k === 'New' ? 's' : ''} for new layer${k === 'New' ? '(s)' : ''}:`); d.touchTables(); for (const n of ns) d.ensureLayer(n); if (k === 'Make') d.clayer = ns[0]; app.ui?.refresh?.(); }
      if (k === 'Set') { const n = need(await c.getString('Enter layer name to make current or <select object>:', { spaces: true })); if (d.layers[n]) { d.clayer = n; app.ui?.refresh?.(); } else c.print(`Cannot find layer "${n}".`); }
      if (k === 'ON') each(await names('Enter name list of layers to turn On:'), (l) => (l.on = true));
      if (k === 'OFF') each(await names('Enter name list of layers to turn Off or <select objects>:'), (l) => (l.on = false));
      if (k === 'Freeze') each(await names('Enter name list of layer(s) to freeze or <select objects>:'), (l) => { if (l.name !== d.clayer) l.frozen = true; });
      if (k === 'Thaw') each(await names('Enter name list of layer(s) to thaw:'), (l) => (l.frozen = false));
      if (k === 'LOck') each(await names('Enter name list of layer(s) to lock or <select objects>:'), (l) => (l.locked = true));
      if (k === 'Unlock') each(await names('Enter name list of layer(s) to unlock or <select objects>:'), (l) => (l.locked = false));
      if (k === 'Color') { const col = parseColor(need(await c.getString('New color [Truecolor/COlorbook]:'))); each(await names(`Enter name list of layer(s) for color ${col} <${d.clayer}>:`), (l) => (l.color = col)); }
      if (k === 'Ltype') { const lt = need(await c.getString('Enter a loaded linetype name or [?] <CONTINUOUS>:', { def: 'CONTINUOUS' })).toUpperCase(); loadLt(lt); each(await names(`Enter name list of layers for linetype "${lt}" <${d.clayer}>:`), (l) => (l.ltype = lt)); }
      if (k === 'LWeight') { const w = parseFloat(need(await c.getString('Enter lineweight (0.0mm - 2.11mm):'))); each(await names('Enter name list of layers for lineweight:'), (l) => (l.lw = Math.round(w * 100))); }
      if (k === 'Plot') { const p = await c.getKw('Enter a plotting preference [Plot/No plot] <Plot>:', 'Plot'); each(await names('Enter layer names for this plot preference:'), (l) => (l.plot = p !== 'No plot')); }
      if (k === 'Rename') { const a = need(await c.getString('Enter old layer name:', { spaces: true })), b = need(await c.getString('Enter new layer name:', { spaces: true })); if (d.layers[a]) { d.touchTables(); d.layers[b] = { ...d.layers[a], name: b }; delete d.layers[a]; for (const e of d.allEntsDeep()) if (e.layer === a) e.layer = b; if (d.clayer === a) d.clayer = b; } }
      if (k === 'Description') { const t = await c.getString('Enter layer description:', { spaces: true }); each(await names('Enter name list of layers:'), (l) => (l.desc = t)); }
    }
  });
  const wild = (name, pat) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i').test(name);
  const layerTool = (name, prompt, fn, all) => R(name, async (c) => {
    const d = doc();
    if (all) { d.touchTables(); all(d); app.ui?.refresh?.(); view().redraw(); return; }
    const s = await c.select(prompt, { allowLocked: true });
    if (!s.length) return;
    d.touchTables();
    const layers = [...new Set(s.map((e) => e.layer))];
    fn(d, layers, s, c);
    app.ui?.refresh?.(); view().redraw();
  });
  layerTool('LAYOFF', 'Select an object on the layer to be turned off:', (d, ls) => { for (const l of ls) if (l === d.clayer) { app.log('Really want layer ' + l + ' (the CURRENT layer) off?'); d.layers[l].on = false; } else d.layers[l].on = false; });
  layerTool('LAYFRZ', 'Select an object on the layer to be frozen:', (d, ls) => { for (const l of ls) if (l !== d.clayer) d.layers[l].frozen = true; else app.log('Cannot freeze layer "' + l + '".  It is the CURRENT layer.'); });
  layerTool('LAYLCK', 'Select an object on the layer to be locked:', (d, ls) => { for (const l of ls) d.layers[l].locked = true; });
  layerTool('LAYULK', 'Select an object on the layer to be unlocked:', (d, ls) => { for (const l of ls) d.layers[l].locked = false; });
  layerTool('LAYISO', 'Select objects on the layer(s) to be isolated:', (d, ls) => { d._iso = Object.fromEntries(Object.values(d.layers).map((l) => [l.name, l.on])); for (const l of Object.values(d.layers)) l.on = ls.includes(l.name); if (!ls.includes(d.clayer)) d.clayer = ls[0]; app.log(`Layer${ls.length > 1 ? 's' : ''} ${ls.join(', ')} ha${ls.length > 1 ? 've' : 's'} been isolated.`); });
  layerTool('LAYUNISO', '', null, (d) => { if (d._iso) for (const [k, v] of Object.entries(d._iso)) if (d.layers[k]) d.layers[k].on = v; d._iso = null; app.log('Layers isolated by LAYISO have been restored.'); });
  layerTool('LAYON', '', null, (d) => { for (const l of Object.values(d.layers)) l.on = true; app.log('All layers have been turned on.'); });
  layerTool('LAYTHW', '', null, (d) => { for (const l of Object.values(d.layers)) l.frozen = false; app.log('All layers have been thawed.'); });
  layerTool('LAYMCUR', 'Select object whose layer will become current:', (d, ls) => { d.clayer = ls[0]; app.log(`${ls[0]} is now the current layer.`); });
  R('LAYCUR', async (c) => { const s = await c.select('Select objects to be changed to the current layer:'); for (const e of s) doc().mod(e, (x) => (x.layer = doc().clayer)); app.log(`${s.length} object(s) changed to layer "${doc().clayer}" (the current layer).`); });
  R('LAYMRG', async (c) => {
    const s = await c.select('Select object on layer to merge:', { allowLocked: true }); if (!s.length) return;
    const t = need(await c.entsel('Select object on target layer:'));
    const from = [...new Set(s.map((e) => e.layer))].filter((l) => l !== t.e.layer);
    const d = doc(); d.touchTables();
    for (const e of d.allEntsDeep()) if (from.includes(e.layer)) { d.touch(e); e.layer = t.e.layer; }
    for (const l of from) if (l !== '0' && l !== d.clayer) delete d.layers[l];
    app.ui?.refresh?.(); view().redraw();
  });
  R('LAYDEL', async (c) => {
    const s = await c.select('Select object on layer to delete:', { allowLocked: true }); if (!s.length) return;
    const ls = [...new Set(s.map((e) => e.layer))].filter((l) => l !== '0' && l !== doc().clayer);
    if ((await c.getKw(`Delete layer(s) ${ls.join(', ')} and all objects on them? [Yes/No] <No>:`, 'No')) !== 'Yes') return;
    const d = doc(); d.touchTables();
    for (const arr of [d.model, ...d.layouts.map((l) => l.ents)]) for (const e of [...arr]) if (ls.includes(e.layer)) d.remove(e, arr);
    for (const l of ls) delete d.layers[l];
    app.ui?.refresh?.(); view().redraw();
  });
  R('COLOR', async () => { const v = await app.ui.dlg.color(doc().vars.CECOLOR); if (v != null) doc().setvar('CECOLOR', v); app.ui?.refresh?.(); }, { alias: ['COL', 'COLOUR', 'DDCOLOR'], transparent: true });
  const loadLt = (name) => { const d = doc(); name = name.toUpperCase(); if (!d.ltypes[name] && LINETYPES[name]) { d.ltypes[name] = LINETYPES[name]; } return !!d.ltypes[name]; };
  app.loadLinetype = loadLt;
  R('LINETYPE', async () => { await app.ui.dlg.linetype(); app.ui?.refresh?.(); view().redraw(); }, { alias: ['LT', 'DDLTYPE', 'LTYPE'], transparent: true });
  R('-LINETYPE', async (c) => {
    const k = await c.getKw('Enter an option [?/Create/Load/Set]:');
    if (k === '?') c.print(Object.keys(LINETYPES).join('\n'));
    if (k === 'Load') { const n = need(await c.getString('Enter linetype(s) to load:')); for (const x of n.split(',')) if (!loadLt(x.trim())) c.print(`Linetype "${x}" not found.`); else c.print(`Linetype "${x.toUpperCase()}" loaded.`); }
    if (k === 'Set') { const n = need(await c.getString('Specify linetype name or [?] <BYLAYER>:', { def: 'BYLAYER' })).toUpperCase(); if (n === 'BYLAYER' || n === 'BYBLOCK' || loadLt(n)) doc().setvar('CELTYPE', n); }
  });
  R('LWEIGHT', async () => { await app.ui.dlg.lweight(); app.ui?.refresh?.(); }, { alias: ['LW', 'LINEWEIGHT'], transparent: true });

  // ---------------- archivo
  R('NEW', async () => app.io.newDrawing(), { alias: ['QNEW'] });
  R('OPEN', async () => app.io.open(), { alias: ['RECOVER', 'FILEOPEN'] });
  R('QSAVE', async () => app.io.save(), { alias: ['SAVE'] });
  R('SAVEAS', async () => app.io.saveAs());
  R('DXFOUT', async () => app.io.saveAs('dxf'), { alias: ['EXPORT', 'SAVEDXF'] });
  R('DXFIN', async () => app.io.importFile(), { alias: ['IMPORT'] });
  R('PLOT', async () => app.io.plotDialog(), { alias: ['PRINT', 'EXPORTPDF', 'PUBLISH', 'PAGESETUP'] });
  R('PNGOUT', async () => app.io.exportImage('png'), { alias: ['JPGOUT', 'BMPOUT'] });
  R('SVGOUT', async () => app.io.exportSVG());
  R('CLOSE', async () => app.io.newDrawing(), { alias: ['CLOSEALL', 'QUIT', 'EXIT'] });
  R('AUDIT', async (c) => { const n = doc().handseed; doc().fixHandles(); for (const e of doc().allEntsDeep()) E.invalidate(e); c.print(`Auditing Header\nAuditing Tables\nAuditing Entities Pass 1\nTotal errors found 0 fixed 0\nHandle seed ${n.toString(16)} → ${doc().handseed.toString(16)}`); view().redraw(); });

  // ---------------- presentaciones
  app.setLayout = (name) => {
    const d = doc();
    if (d.blockEdit) { app.log('** Close the Block Editor first **'); return; }
    if (name !== 'Model' && !d.layouts.find((l) => l.name === name)) return;
    d.active = name; d.mspace = null;
    eng.clearSel();
    if (name !== 'Model') {
      const l = d.layout;
      if (!l._init) { l._init = true; if (!l.ents.some((e) => e.type === 'VIEWPORT')) { const bb = d.extents(d.model); const vp = makeVP({ x: 10, y: 10 }, { x: l.w - 10, y: l.h - 10 }, bb); d.stamp(vp); l.ents.push(vp); } }
    }
    view().redraw(); app.ui?.refresh?.(); app.ui?.status?.update?.();
  };
  const makeVP = (a, b, bb) => {
    const c = G.mid(a, b), w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
    let vc = { x: 0, y: 0 }, scale = 1;
    if (bb) { vc = { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 }; scale = Math.min(w / ((bb.x2 - bb.x1) * 1.05 || 1), h / ((bb.y2 - bb.y1) * 1.05 || 1)); }
    return { type: 'VIEWPORT', c, w, h, vc, scale: isFinite(scale) && scale > 0 ? scale : 1, layer: 'Defpoints' in doc().layers ? doc().clayer : '0' };
  };
  R('LAYOUT', async (c) => {
    const d = doc();
    const k = await c.getKw(`Enter layout option [Copy/Delete/New/Template/Rename/SAveas/Set/?] <set>:`, 'Set');
    if (!k) return;
    if (k === '?') { c.print(d.layouts.map((l) => l.name).join('\n')); return; }
    const uniq = (b) => { let n = 1, nm = b; while (d.layouts.some((l) => l.name === nm)) nm = `${b.replace(/\d+$/, '')}${++n}`; return nm; };
    d.touchTables();
    if (k === 'New') { const n = (await c.getString(`Enter name of new layout <${uniq('Layout1')}>:`, { spaces: true, def: uniq('Layout1') })) || uniq('Layout1'); d.layouts.push({ name: n, paper: 'A3', w: 420, h: 297, ents: [] }); app.setLayout(n); }
    if (k === 'Copy') { const src = d.layout || d.layouts[0]; const n = uniq(src.name + ' (2)'); d.layouts.push({ ...JSON.parse(JSON.stringify({ ...src, ents: src.ents.map(E.cloneEnt) })), name: n }); }
    if (k === 'Delete') { const n = need(await c.getString(`Enter name of layout to delete <${d.active}>:`, { spaces: true, def: d.active })); if (d.layouts.length > 1) { d.layouts = d.layouts.filter((l) => l.name !== n); if (d.active === n) app.setLayout('Model'); } else c.print('Cannot delete the only layout.'); }
    if (k === 'Rename') { const a = need(await c.getString(`Enter layout to rename <${d.active}>:`, { spaces: true, def: d.active })); const b = need(await c.getString('Enter new layout name:', { spaces: true })); const l = d.layouts.find((x) => x.name === a); if (l) { l.name = b; if (d.active === a) d.active = b; } }
    if (k === 'Set') { const n = need(await c.getString(`Enter layout to make current <${d.active}>:`, { spaces: true, def: d.active })); app.setLayout(n); }
    app.ui?.refresh?.();
  }, { alias: ['LO'] });
  R('MVIEW', async (c) => {
    const d = doc();
    if (d.active === 'Model') { c.print('** Command not allowed in Model Tab **'); return; }
    if (d.mspace) d.mspace = null;
    const a = need(await c.getPoint('Specify corner of viewport or [ON/OFF/Fit/Shadeplot/Lock/NEw/NAmed/Object/Polygonal/Restore/LAyer/2/3/4] <Fit>:', { def: 'Fit' }));
    let p1 = a, p2;
    const l = d.layout;
    if (a === 'Fit') { p1 = { x: 10, y: 10 }; p2 = { x: l.w - 10, y: l.h - 10 }; }
    else if (a === 'ON' || a === 'OFF') { const s = await c.select('Select objects:', { filter: (e) => e.type === 'VIEWPORT' }); for (const e of s) d.mod(e, (x) => (x.on = a === 'ON')); return; }
    else if (a === 'Lock') { const on = (await c.getKw('Viewport View Locking [ON/OFF]:')) === 'ON'; const s = await c.select('Select objects:', { filter: (e) => e.type === 'VIEWPORT' }); for (const e of s) d.mod(e, (x) => (x.locked = on)); return; }
    else if (isPt(a)) p2 = need(await c.getCorner('Specify opposite corner:', a));
    else return;
    d.add(makeVP(p1, p2, d.extents(d.model)));
    view().redraw();
  }, { alias: ['MV'] });
  R('MSPACE', async (c) => {
    const d = doc(); if (d.active === 'Model') { c.print('** Command not allowed in Model Tab **'); return; }
    const vps = d.layout.ents.filter((e) => e.type === 'VIEWPORT' && e.on !== false);
    if (!vps.length) { c.print('There are no active model space viewports.'); return; }
    const pc = view().toWorld(view().mouse.x, view().mouse.y, view().paperView());
    d.mspace = vps.find((v) => Math.abs(pc.x - v.c.x) <= v.w / 2 && Math.abs(pc.y - v.c.y) <= v.h / 2) || vps[0];
    eng.clearSel(); view().redraw(); app.ui?.status?.update?.();
  }, { alias: ['MS'] });
  R('PSPACE', async () => { doc().mspace = null; eng.clearSel(); view().redraw(); app.ui?.status?.update?.(); }, { alias: ['PS'] });

  // ---------------- portapapeles
  const toClip = async (ents, base) => {
    const data = { webcad: 1, base, ents: ents.map(E.cloneEnt), blocks: {} };
    const need_ = new Set(); const scan = (es) => { for (const e of es) if (e.type === 'INSERT' && !need_.has(e.name)) { need_.add(e.name); const b = doc().blocks[e.name]; if (b) scan(b.ents); } };
    scan(ents); for (const n of need_) if (doc().blocks[n]) data.blocks[n] = JSON.parse(JSON.stringify(doc().blocks[n], (k, v) => (k[0] === '_' ? undefined : v)));
    app.clip = data;
    try { await navigator.clipboard.writeText(JSON.stringify(data)); } catch (_) { /* portapapeles del sistema no disponible */ }
  };
  const fromClip = async () => {
    try { const t = await navigator.clipboard.readText(); if (t && t.startsWith('{"webcad"')) return JSON.parse(t); } catch (_) { /* sin acceso */ }
    return app.clip;
  };
  const clipBase = (ents) => { const bb = doc().extents(ents); return bb ? { x: bb.x1, y: bb.y1 } : { x: 0, y: 0 }; };
  R('COPYCLIP', async (c) => { const s = await c.select(); if (s.length) await toClip(s, clipBase(s)); c.sel = []; }, { alias: ['COPYC'] });
  R('CUTCLIP', async (c) => { const s = await c.select(); if (!s.length) return; await toClip(s, clipBase(s)); for (const e of s) doc().remove(e); });
  R('COPYBASE', async (c) => { const b = need(await c.getPoint('Specify base point:')); const s = await c.select(); if (s.length) await toClip(s, b); });
  const paste = (mode) => async (c) => {
    const data = await fromClip();
    if (!data || !data.ents?.length) { c.print('Clipboard is empty.'); return; }
    const d = doc();
    for (const [n, b] of Object.entries(data.blocks || {})) if (!d.blocks[n]) { d.touchTables(); d.blocks[n] = b; }
    let to = data.base;
    const mk = (q) => data.ents.map((e) => E.transformEnt(E.cloneEnt(e), M.tr(q.x - data.base.x, q.y - data.base.y)));
    if (mode !== 'orig') to = need(await c.getPoint('Specify insertion point:', { preview: (q) => mk(q) }));
    if (!isPt(to)) return;
    const ents = mk(to).map((e) => { delete e.hid; return e; });
    if (mode === 'block') {
      const name = 'A$C' + Math.random().toString(16).slice(2, 10).toUpperCase();
      d.touchTables(); d.blocks[name] = { name, base: to, ents: ents.map((e, i) => ({ ...e, bid: i })), params: [] };
      d.add({ type: 'INSERT', name, p: to, sx: 1, sy: 1, rot: 0 });
    } else { const added = ents.map((e) => d.add(e)); eng.setSel(added); }
    view().redraw();
  };
  R('PASTECLIP', paste('normal'));
  R('PASTEORIG', paste('orig'));
  R('PASTEBLOCK', paste('block'));

  // ---------------- selección
  R('SELECT', async (c) => { const s = await c.select(); eng.setSel(s); }, { keepSel: false });
  R('QSELECT', async () => { const s = await app.ui.dlg.qselect(); if (s) eng.setSel(s); }, { keepSel: true });
  R('SELECTSIMILAR', async (c) => {
    const s = await c.select(); if (!s.length) return;
    const keys = new Set(s.map((e) => e.type + '|' + e.layer + '|' + (e.name || '')));
    eng.setSel(doc().space.filter((e) => doc().isVisible(e) && keys.has(e.type + '|' + e.layer + '|' + (e.name || ''))));
    c.print(`${eng.sel.length} objects selected.`);
  });
  R('ISOLATEOBJECTS', async (c) => { const s = await c.select(); const set = new Set(s); for (const e of doc().space) if (!set.has(e)) e.visible = false; view().redraw(); }, { alias: ['ISOLATE'] });
  R('HIDEOBJECTS', async (c) => { const s = await c.select(); for (const e of s) e.visible = false; view().redraw(); }, { alias: ['HIDE'] });
  R('UNISOLATEOBJECTS', async () => { for (const e of doc().allEnts()) delete e.visible; view().redraw(); }, { alias: ['UNISOLATE', 'UNHIDE'] });

  // ---------------- propiedades / interfaz
  R('PROPERTIES', async () => app.ui.showProperties(true), { alias: ['PR', 'CH', 'MO', 'DDMODIFY', 'DDCHPROP', 'PROPS'], keepSel: true, pickfirst: false });
  R('PROPERTIESCLOSE', async () => app.ui.showProperties(false), { alias: ['PRCLOSE'], keepSel: true });
  R('OPTIONS', async () => app.ui.dlg.options(), { alias: ['OP', 'PREFERENCES', 'CONFIG'], transparent: true, keepSel: true });
  R('CUI', async () => app.ui.dlg.options('keys'), { alias: ['ALIASEDIT', 'TOOLBAR', 'CUSTOMIZE'], keepSel: true });
  R('MENUBAR', async () => { app.settings.menuBar = !app.settings.menuBar; app.ui.applyLayout(); }, { transparent: true });
  R('SCREENMENU', async () => { app.settings.screenMenu = !app.settings.screenMenu; app.ui.applyLayout(); }, { transparent: true });
  R('RIBBON', async () => { app.settings.ribbon = true; app.ui.applyLayout(); });
  R('RIBBONCLOSE', async () => { app.settings.ribbon = false; app.ui.applyLayout(); });
  R('CLASSIC', async () => { Object.assign(app.settings, { ribbon: false, menuBar: true, screenMenu: true }); app.ui.applyLayout(); app.log('Interfaz clásica (R12): barra de menús + menú de pantalla.'); });
  R('MENU', async () => { const f = await app.io.pickFile('.mnu,.mns,.mnc,.txt'); if (!f) return; const t = await f.text(); app.ui.menu12.loadMNU(t, f.name); }, { alias: ['MENULOAD'] });
  R('TEXTSCR', async () => app.ui.cmdline.expand(), { transparent: true, keepSel: true });
  R('GRAPHSCR', async () => app.ui.cmdline.expand(false), { transparent: true, keepSel: true });
  R('HELP', async () => app.ui.dlg.help(), { alias: ['?'], transparent: true, keepSel: true });
  R('ABOUT', async () => app.ui.dlg.about(), { keepSel: true });
  R('TIME', async (c) => { c.print(`Current time:             ${new Date().toLocaleString()}\nThis drawing has ${doc().model.length} objects in model space.`); });
  R('STATUS', async (c) => { const d = doc(), bb = d.extents(d.model); c.print(`${d.model.length} objects in ${d.name}\nModel space uses        ${bb ? `X: ${F(bb.x1)} Y: ${F(bb.y1)}  X: ${F(bb.x2)} Y: ${F(bb.y2)}` : '(empty)'}\nCurrent layer:   ${d.clayer}\nBlocks: ${Object.keys(d.blocks).length}  Layers: ${Object.keys(d.layers).length}`); app.ui.cmdline.expand(true); });
  R('CAL', async (c) => { const ex = need(await c.getString('>> Expression:', { spaces: true })); try { c.print(String(calc(ex))); } catch (e) { c.print('Error: ' + e.message); } }, { transparent: true });
  R('QUICKCALC', async (c) => eng.run('CAL'), { alias: ['QC'] });
  R('FIND', async () => {
    const r = await app.ui.dlg.form('Find and Replace', [{ k: 'find', l: 'Find what', v: '' }, { k: 'rep', l: 'Replace with', v: '' }, { k: 'doRep', l: 'Replace all', v: false, t: 'check' }]);
    if (!r || !r.find) return;
    const found = [];
    for (const e of doc().space) {
      const hit = (s) => String(s || '').toLowerCase().includes(r.find.toLowerCase());
      if ((e.type === 'TEXT' || e.type === 'MTEXT') && hit(e.text)) { found.push(e); if (r.doRep) doc().mod(e, (x) => (x.text = x.text.split(r.find).join(r.rep))); }
      if (e.type === 'INSERT' && (e.attribs || []).some((a) => hit(a.text))) { found.push(e); if (r.doRep) doc().mod(e, (x) => x.attribs.forEach((a) => { a.text = a.text.split(r.find).join(r.rep); E.invalidate(a); })); }
    }
    app.log(`${found.length} match${found.length === 1 ? '' : 'es'} found.`);
    if (found.length) { eng.setSel(found); const bb = doc().extents(found); if (bb) view().zoomWindow(bb, 1.6); }
    view().redraw();
  });
  R('COUNT', async (c) => { const s = await c.select('Select a block reference:', { single: true, filter: (e) => e.type === 'INSERT' }); if (!s[0]) return; const n = doc().space.filter((e) => e.type === 'INSERT' && e.name === s[0].name); c.print(`${n.length} instances of block "${s[0].name}".`); eng.setSel(n); });
  R('APPLOAD', async () => app.ui.dlg.appload(), { alias: ['AP'] });
  R('VLISP', async () => app.ui.vlide.show(), { alias: ['VLIDE', 'VLISP'] });
  R('SCRIPT', async () => { const f = await app.io.pickFile('.scr,.txt'); if (!f) return; const t = await f.text(); app.lisp.runScript(t); }, { alias: ['SCR'] });
  R('LOAD', async () => app.ui.dlg.appload());
}

// evaluador de expresiones (CAL)
export function calc(src) {
  const toks = String(src).match(/\d*\.?\d+(?:[eE][-+]?\d+)?|[A-Za-z_]\w*|\*\*|[-+*/^(),]/g) || [];
  let i = 0;
  const fns = { sin: (x) => Math.sin(x * Math.PI / 180), cos: (x) => Math.cos(x * Math.PI / 180), tan: (x) => Math.tan(x * Math.PI / 180), asin: (x) => Math.asin(x) * 180 / Math.PI, acos: (x) => Math.acos(x) * 180 / Math.PI, atan: (x) => Math.atan(x) * 180 / Math.PI, sqrt: Math.sqrt, sqr: (x) => x * x, abs: Math.abs, ln: Math.log, log: Math.log10, exp: Math.exp, round: Math.round, trunc: Math.trunc, r2d: (x) => x * 180 / Math.PI, d2r: (x) => x * Math.PI / 180 };
  const peek = () => toks[i], next = () => toks[i++];
  const prim = () => {
    const t = next();
    if (t === '(') { const v = expr(); next(); return v; }
    if (t === '-') return -prim();
    if (t === '+') return prim();
    if (/^[\d.]/.test(t)) return parseFloat(t);
    if (/^pi$/i.test(t)) return Math.PI;
    const f = fns[String(t).toLowerCase()];
    if (f) { next(); const v = expr(); next(); return f(v); }
    throw new Error('Unexpected ' + t);
  };
  const pow = () => { let v = prim(); while (peek() === '^' || peek() === '**') { next(); v = Math.pow(v, prim()); } return v; };
  const term = () => { let v = pow(); while (peek() === '*' || peek() === '/') { const o = next(); const r = pow(); v = o === '*' ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(); const r = term(); v = o === '+' ? v + r : v - r; } return v; };
  const v = expr(); if (i < toks.length) throw new Error('Unexpected ' + toks[i]); return v;
}
