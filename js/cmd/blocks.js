// Bloques, atributos y bloques dinámicos (editor de bloques)
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
const { M } = G;
const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, fn, o) => eng.register(n, fn, o);

  const nextBid = (ents) => ents.reduce((m, e) => Math.max(m, e.bid ?? -1), -1) + 1;
  const ensureBids = (ents) => { let n = nextBid(ents); for (const e of ents) if (e.bid == null) e.bid = n++; };

  function makeBlock(name, base, ents, mode = 'convert', desc = '') {
    const d = doc();
    d.touchTables();
    const be = ents.map((e, i) => { const c = E.cloneEnt(e); delete c.hid; c.bid = i; d.stamp(c); return c; });
    d.blocks[name] = { name, base: { x: base.x, y: base.y }, ents: be, params: [], desc, _ver: 1 };
    if (mode === 'convert' || mode === 'delete') { const arr = d.ownerOf(ents[0]) || d.space; for (const e of ents) d.remove(e); if (mode === 'convert') insertBlock(name, base, 1, 1, 0, {}, arr); }
    return d.blocks[name];
  }
  function attribsFor(name, ins, values = {}) {
    const blk = doc().blocks[name]; if (!blk) return [];
    const m = E.insertMatrix(ins, blk), out = [];
    for (const a of blk.ents) if (a.type === 'ATTDEF' && !a.constant) {
      const t = E.cloneEnt(a); t.type = 'ATTRIB'; t.text = values[a.tag] ?? a.def ?? ''; delete t.bid; delete t.hid; delete t.prompt;
      E.transformEnt(t, m); t.type = 'ATTRIB'; out.push(t);
    }
    return out;
  }
  function insertBlock(name, p, sx, sy, rot, values, arr) {
    const ins = { type: 'INSERT', name, p, sx, sy, rot };
    const blk = doc().blocks[name];
    if (blk?.params?.length) ins.dyn = E.dynDefaults(blk);
    ins.attribs = attribsFor(name, ins, values);
    if (!ins.attribs.length) delete ins.attribs;
    return doc().add(ins, arr);
  }
  app.blocks = { makeBlock, insertBlock, attribsFor };

  // ---------------- BLOCK (diálogo) y -BLOCK
  R('BLOCK', async (c) => {
    let pre = c.pickfirst?.slice() || []; c.pickfirst = [];
    let st = { name: '', base: { x: 0, y: 0 }, ents: pre, mode: 'convert', desc: '' };
    for (;;) {
      const r = await app.ui.dlg.blockDef(st, Object.keys(doc().blocks));
      if (!r) return;
      st = { ...st, ...r };
      if (r.action === 'pick') { const p = await c.getPoint('Specify insertion base point:'); if (isPt(p)) st.base = p; continue; }
      if (r.action === 'select') { st.ents = await c.select('Select objects:', { noPickfirst: true }); continue; }
      if (!st.name) { c.print('Block name required.'); continue; }
      if (!st.ents.length) { c.print('No objects selected.'); continue; }
      makeBlock(st.name, st.base, st.ents, st.mode, st.desc);
      c.print(`Block "${st.name}" defined with ${st.ents.length} objects.`);
      return;
    }
  }, { alias: ['B', 'BMAKE'], pickfirst: true, keepSel: false });
  R('-BLOCK', async (c) => {
    const name = need(await c.getString('Enter block name or [?]:'));
    if (doc().blocks[name] && (await c.getKw(`Block "${name}" already exists. Redefine it? [Yes/No] <N>:`, 'No')) !== 'Yes') return;
    const base = need(await c.getPoint('Specify insertion base point or [Annotative]:'));
    const s = await c.select('Select objects:');
    if (!s.length) return;
    makeBlock(name, base, s, 'delete');
  });

  // ---------------- INSERT
  const placeInsert = async (c, name, o) => {
    const blk = doc().blocks[name];
    if (!blk) { c.print(`Block "${name}" not found.`); return null; }
    let sx = o.sx ?? 1, sy = o.sy ?? sx, rot = o.rot ?? 0;
    const ghost = (q) => { const t = { type: 'INSERT', name, p: q, sx, sy, rot }; if (blk.params?.length) t.dyn = E.dynDefaults(blk); return [t]; };
    let p = o.p;
    while (!isPt(p)) {
      p = need(await c.getPoint('Specify insertion point or [Basepoint/Scale/X/Y/Z/Rotate]:', { preview: ghost }));
      if (p === 'Scale') { sx = sy = need(await c.getReal('Specify scale factor for XYZ axes <1>:', { def: 1 })); }
      if (p === 'Rotate') { rot = need(await c.getAngle('Specify rotation angle <0>:', { def: 0 })); }
      if (p === 'X') sx = need(await c.getReal('Specify X scale factor <1>:', { def: 1 }));
      if (p === 'Y') sy = need(await c.getReal('Specify Y scale factor <1>:', { def: 1 }));
    }
    if (o.askScale) { const k = await c.getReal(`Enter X scale factor, specify opposite corner, or [Corner/XYZ] <1>:`, { def: 1 }); if (typeof k === 'number') { sx = k; sy = (await c.getReal(`Enter Y scale factor <use X scale factor>:`, { def: k })) ?? k; } }
    if (o.askRot) { const a = await c.getAngle('Specify rotation angle <0>:', { base: p, def: 0 }); if (typeof a === 'number') rot = a; }
    const values = {};
    const atts = blk.ents.filter((a) => a.type === 'ATTDEF' && !a.constant);
    if (atts.length && doc().vars.ATTREQ) {
      if (doc().vars.ATTDIA) { const r = await app.ui.dlg.form('Edit Attributes', atts.map((a) => ({ k: a.tag, l: a.prompt || a.tag, v: a.def || '' }))); if (r) Object.assign(values, r); }
      else { c.print('Enter attribute values'); for (const a of atts) { const v = await c.getString(`${a.prompt || a.tag} <${a.def || ''}>:`, { spaces: true, def: a.def || '' }); values[a.tag] = v ?? a.def ?? ''; } }
    }
    const ins = insertBlock(name, p, sx, sy, rot, values);
    if (o.explode) { const parts = E.explodeEnt(ins, doc()); doc().remove(ins); for (const x of parts) { delete x.hid; doc().add(x); } }
    return ins;
  };
  R('INSERT', async (c) => {
    const r = await app.ui.dlg.insert(doc(), c._lastIns);
    if (!r) return;
    if (r.file) { const name = await app.io.importAsBlock(r.file); if (!name) return; r.name = name; }
    c._lastIns = r.name;
    await placeInsert(c, r.name, { sx: r.sx, sy: r.sy, rot: G.rad(r.rot || 0), explode: r.explode, p: r.pick ? null : r.p, askScale: r.askScale, askRot: r.askRot });
  }, { alias: ['I', 'DDINSERT', 'CLASSICINSERT', 'BLOCKSPALETTE'] });
  R('-INSERT', async (c) => {
    let name = need(await c.getString(`Enter block name or [?] <${c._lastIns || ''}>:`, { def: c._lastIns }));
    if (name === '?') { c.print(Object.keys(doc().blocks).filter((n) => !n.startsWith('*')).join('\n')); return; }
    const k = Object.keys(doc().blocks).find((n) => n.toUpperCase() === name.toUpperCase()); if (k) name = k;
    c._lastIns = name;
    await placeInsert(c, name, { askScale: true, askRot: true });
  });
  R('XATTACH', async (c) => { const f = await app.io.pickFile('.dxf,.dwg,.wcad'); if (!f) return; const name = await app.io.importAsBlock(f); if (name) await placeInsert(c, name, {}); }, { alias: ['XREF', 'XA'] });

  // ---------------- WBLOCK
  R('WBLOCK', async (c) => {
    const k = await c.getKw('Source [Block/Entire drawing/Objects] <Objects>:', 'Objects');
    if (k === 'Entire drawing') return app.io.saveAs('dxf');
    if (k === 'Block') {
      const name = need(await c.getString('Enter name of existing block:'));
      const blk = doc().blocks[name]; if (!blk) { c.print('Block not found.'); return; }
      return app.io.exportEnts(blk.ents.map((e) => E.transformEnt(E.cloneEnt(e), M.tr(-blk.base.x, -blk.base.y))), name + '.dxf');
    }
    const s = await c.select(); if (!s.length) return;
    const base = need(await c.getPoint('Specify insertion base point <0,0,0>:', { def: { x: 0, y: 0 } }));
    return app.io.exportEnts(s.map((e) => E.transformEnt(E.cloneEnt(e), M.tr(-base.x, -base.y))), 'new block.dxf');
  }, { alias: ['W'] });

  // ---------------- ATTDEF
  R('ATTDEF', async (c) => {
    const r = await app.ui.dlg.form('Attribute Definition', [
      { k: 'tag', l: 'Tag', v: c._attTag || 'TAG' }, { k: 'prompt', l: 'Prompt', v: '' }, { k: 'def', l: 'Default', v: '' },
      { k: 'h', l: 'Text height', v: doc().vars.TEXTSIZE, t: 'number' }, { k: 'invisible', l: 'Invisible', v: false, t: 'check' }, { k: 'constant', l: 'Constant', v: false, t: 'check' },
      { k: 'just', l: 'Justification', v: 'Left', t: 'select', opts: ['Left', 'Center', 'Middle', 'Right'] },
    ]);
    if (!r || !r.tag) return;
    const p = need(await c.getPoint('Specify start point:', { preview: (q) => [{ type: 'ATTDEF', p: q, h: +r.h, tag: r.tag.toUpperCase() }] }));
    if (!isPt(p)) return;
    const ha = { Left: 0, Center: 1, Middle: 4, Right: 2 }[r.just] || 0;
    doc().add({ type: 'ATTDEF', p, p2: ha ? p : undefined, ha, h: +r.h, rot: 0, tag: r.tag.toUpperCase().replace(/\s/g, '_'), prompt: r.prompt, def: r.def, text: r.def, invisible: !!r.invisible, constant: !!r.constant });
    c._attTag = r.tag;
  }, { alias: ['ATT', 'DDATTDEF'] });
  R('ATTSYNC', async (c) => {
    const name = need(await c.getString('Enter name of block to sync:'));
    for (const e of doc().allEnts()) if (e.type === 'INSERT' && e.name === name) {
      const vals = Object.fromEntries((e.attribs || []).map((a) => [a.tag, a.text]));
      doc().mod(e, (x) => { x.attribs = attribsFor(name, x, vals); });
    }
    app.view.redraw();
  });

  // ---------------- EDITOR DE BLOQUES
  R('BEDIT', async (c) => {
    const d = doc();
    if (d.blockEdit) { c.print('Already in Block Editor.'); return; }
    let name = c.bedName; c.bedName = null;
    if (!name) { const sel = c.pickfirst?.find((e) => e.type === 'INSERT'); if (sel) name = sel.name; }
    if (!name) { name = await app.ui.dlg.bedit(d); if (!name) return; }
    if (!d.blocks[name]) { d.touchTables(); d.blocks[name] = { name, base: { x: 0, y: 0 }, ents: [], params: [], _ver: 1 }; }
    const blk = d.blocks[name];
    ensureBids(blk.ents);
    d.blockEdit = { name, ents: blk.ents.map((e) => E.cloneEnt(e)), params: JSON.parse(JSON.stringify(blk.params || [])), base: { ...blk.base }, curVis: null };
    const vis = d.blockEdit.params.find((p) => p.type === 'visibility');
    if (vis) d.blockEdit.curVis = vis.states[0]?.name;
    applyVisInEditor();
    const bb = d.extents(d.blockEdit.ents);
    app.ui?.enterBlockEditor?.(name);
    if (bb) app.view.zoomWindow(G.bbUnion(bb, { x1: blk.base.x, y1: blk.base.y, x2: blk.base.x, y2: blk.base.y }), 1.4); else app.view.setCur({ cx: blk.base.x, cy: blk.base.y, s: 4 });
    app.view.redraw();
  }, { pickfirst: true });
  const applyVisInEditor = () => {
    const be = doc().blockEdit; if (!be) return;
    const vis = be.params.find((p) => p.type === 'visibility');
    const st = vis?.states.find((s) => s.name === be.curVis);
    for (const e of be.ents) { if (st && (st.hidden || []).includes(e.bid)) e.visible = false; else delete e.visible; }
  };
  const bsave = () => {
    const d = doc(), be = d.blockEdit; if (!be) return;
    ensureBids(be.ents);
    d.touchTables();
    const blk = d.blocks[be.name];
    blk.ents = be.ents.map((e) => { const x = E.cloneEnt(e); delete x.visible; return x; });
    blk.params = JSON.parse(JSON.stringify(be.params));
    blk.base = { ...be.base };
    blk._ver = (blk._ver || 0) + 1;
    for (const e of d.allEntsDeep()) if (e.type === 'INSERT' && e.name === be.name) { E.invalidate(e); if (blk.params.length) e.dyn = { ...E.dynDefaults(blk), ...(e.dyn || {}) }; }
    app.log(`Block "${be.name}" saved.`);
  };
  R('BSAVE', async () => bsave());
  R('BCLOSE', async (c) => {
    const d = doc(); if (!d.blockEdit) { c.print('Not in Block Editor.'); return; }
    const k = await c.getKw('Save changes to block? [Yes/No/Cancel] <Yes>:', 'Yes');
    if (k === 'Cancel') return;
    if (k !== 'No') bsave();
    d.blockEdit = null;
    app.ui?.exitBlockEditor?.();
    app.view.redraw();
  }, { alias: ['BC'] });
  R('BASE', async (c) => {
    const d = doc();
    if (d.blockEdit) { const p = need(await c.getPoint('Specify base point:')); d.blockEdit.base = p; app.view.redraw(); return; }
    const p = need(await c.getPoint(`Enter base point <0,0,0>:`, { def: { x: 0, y: 0 } })); d.vars.INSBASE = p;
  });

  const inEditor = (c) => { if (!doc().blockEdit) { c.print('** Command only valid in Block Editor **'); return false; } return true; };
  const pickActionObjs = async (c) => { const s = await c.select('Select objects:', { noPickfirst: true }); ensureBids(doc().blockEdit.ents); return s.map((e) => e.bid); };
  const askAction = async (c, p, kinds) => {
    const t = await c.getKw(`Attach action [${kinds.join('/')}/None] <${kinds[0]}>:`, kinds[0]);
    if (!t || t === 'None') return;
    if (t === 'Stretch') {
      const a = need(await c.getPoint('Specify first corner of stretch frame or [CPolygon]:'));
      const b = need(await c.getCorner('Specify opposite corner:', a));
      const frame = { x1: Math.min(a.x, b.x), y1: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y) };
      c.print('Specify objects to stretch');
      const ids = await pickActionObjs(c);
      (p.actions ||= []).push({ type: 'stretch', frame, ids });
    } else {
      const ids = await pickActionObjs(c);
      (p.actions ||= []).push({ type: t.toLowerCase(), ids });
    }
  };
  R('BPARAMETER', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit;
    const t = await c.getKw('Enter parameter type [Alignment/Basepoint/Linear/Polar/Rotation/Flip/Visibility/XY/Lookup] <Linear>:', 'Linear');
    if (!t) return;
    const n = be.params.filter((p) => p.type === t.toLowerCase()).length + 1;
    doc().touchTables();
    if (t === 'Linear' || t === 'Polar' || t === 'XY') {
      const p1 = need(await c.getPoint('Specify start point or [Name/Label/Chain/Description/Base/Palette/Value set]:'));
      const p2 = need(await c.getPoint('Specify endpoint:', { base: p1 }));
      const nm = (await c.getString(`Enter parameter label <Distance${n}>:`, { def: `Distance${n}` })) || `Distance${n}`;
      const inc = await c.getReal('Enter distance increment <0 = none>:', { def: 0 });
      const p = { type: 'linear', name: nm, p1, p2, inc: inc || 0, actions: [] };
      be.params.push(p);
      await askAction(c, p, ['Stretch', 'Move', 'Scale']);
    } else if (t === 'Rotation') {
      const cc = need(await c.getPoint('Specify base point or [Name/Label/Chain/Description/Palette/Value set]:'));
      const rp = need(await c.getPoint('Specify radius of parameter:', { base: cc }));
      const nm = (await c.getString(`Enter parameter label <Angle${n}>:`, { def: `Angle${n}` })) || `Angle${n}`;
      const p = { type: 'rotation', name: nm, c: cc, r: G.dist(cc, rp), a0: G.ang(cc, rp), actions: [] };
      be.params.push(p);
      c.print('Specify objects for Rotate action'); p.actions.push({ type: 'rotate', ids: await pickActionObjs(c) });
    } else if (t === 'Flip') {
      const p1 = need(await c.getPoint('Specify base point of reflection line or [Name/Label/Description/Palette]:'));
      const p2 = need(await c.getPoint('Specify endpoint of reflection line:', { base: p1 }));
      const nm = (await c.getString(`Enter parameter label <Flip state${n}>:`, { def: `Flip state${n}` })) || `Flip state${n}`;
      const p = { type: 'flip', name: nm, p1, p2, actions: [] };
      be.params.push(p);
      c.print('Specify objects for Flip action'); p.actions.push({ type: 'flip', ids: await pickActionObjs(c) });
    } else if (t === 'Visibility') {
      if (be.params.some((p) => p.type === 'visibility')) { c.print('Block already has a visibility parameter.'); return; }
      const loc = need(await c.getPoint('Specify parameter location or [Name/Label/Description/Palette]:'));
      be.params.push({ type: 'visibility', name: 'Visibility1', p: loc, states: [{ name: 'VisibilityState0', hidden: [] }] });
      be.curVis = 'VisibilityState0';
      c.print('Use BVSTATE to create visibility states and BVHIDE/BVSHOW to set object visibility.');
    } else c.print(`${t} parameter is not supported in this version. Use Linear, Rotation, Flip or Visibility.`);
    app.view.redraw();
  }, { alias: ['BPARAM'] });
  R('BACTION', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit;
    if (!be.params.length) { c.print('No parameters defined.'); return; }
    const nm = need(await c.getString(`Select parameter by name [${be.params.map((p) => p.name).join('/')}]:`));
    const p = be.params.find((x) => x.name.toUpperCase() === String(nm).toUpperCase());
    if (!p) { c.print('Parameter not found.'); return; }
    doc().touchTables();
    if (p.type === 'linear') await askAction(c, p, ['Stretch', 'Move', 'Scale']);
    else if (p.type === 'rotation') (p.actions ||= []).push({ type: 'rotate', ids: await pickActionObjs(c) });
    else if (p.type === 'flip') (p.actions ||= []).push({ type: 'flip', ids: await pickActionObjs(c) });
  });
  R('BVSTATE', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit, vis = be.params.find((p) => p.type === 'visibility');
    if (!vis) { c.print('Add a Visibility parameter first (BPARAMETER > Visibility).'); return; }
    c.print(`Visibility states: ${vis.states.map((s) => (s.name === be.curVis ? `*${s.name}*` : s.name)).join(', ')}`);
    const k = await c.getKw('Enter an option [New/Set current/Rename/Delete] <Set current>:', 'Set current');
    if (!k) return;
    doc().touchTables();
    if (k === 'New') {
      const nm = need(await c.getString('Enter name for new visibility state:', { spaces: true }));
      const how = await c.getKw('Visibility of existing objects in new state [Hide all/Show all/Leave unchanged] <Leave unchanged>:', 'Leave unchanged');
      const cur = vis.states.find((s) => s.name === be.curVis);
      const hidden = how === 'Hide all' ? be.ents.map((e) => e.bid) : how === 'Show all' ? [] : [...(cur?.hidden || [])];
      vis.states.push({ name: nm, hidden }); be.curVis = nm;
    } else if (k === 'Set current') {
      const nm = need(await c.getString(`Enter visibility state name [${vis.states.map((s) => s.name).join('/')}]:`, { spaces: true }));
      const st = vis.states.find((s) => s.name.toUpperCase() === nm.toUpperCase()); if (st) be.curVis = st.name; else c.print('State not found.');
    } else if (k === 'Rename') {
      const nm = need(await c.getString('Enter new name for current state:', { spaces: true }));
      const st = vis.states.find((s) => s.name === be.curVis); if (st) { st.name = nm; be.curVis = nm; }
    } else if (k === 'Delete') {
      if (vis.states.length < 2) { c.print('Cannot delete the only state.'); return; }
      vis.states = vis.states.filter((s) => s.name !== be.curVis); be.curVis = vis.states[0].name;
    }
    applyVisInEditor(); app.view.redraw(); app.ui?.refresh?.();
  });
  R('BVHIDE', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit, vis = be.params.find((p) => p.type === 'visibility');
    if (!vis) { c.print('No visibility parameter.'); return; }
    const s = await c.select('Select objects to hide:');
    ensureBids(be.ents); doc().touchTables();
    const st = vis.states.find((x) => x.name === be.curVis);
    for (const e of s) if (!st.hidden.includes(e.bid)) st.hidden.push(e.bid);
    applyVisInEditor(); app.view.redraw();
  });
  R('BVSHOW', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit, vis = be.params.find((p) => p.type === 'visibility');
    if (!vis) return;
    const k = await c.getKw('Make visible for [Current state/All visibility states] <Current state>:', 'Current state');
    doc().touchTables();
    if (k === 'All visibility states') for (const s of vis.states) s.hidden = [];
    else { const st = vis.states.find((x) => x.name === be.curVis); st.hidden = []; }
    applyVisInEditor(); app.view.redraw();
  });
  R('BPARAMDEL', async (c) => {
    if (!inEditor(c)) return;
    const be = doc().blockEdit; const nm = need(await c.getString('Parameter name to delete:'));
    doc().touchTables(); be.params = be.params.filter((p) => p.name.toUpperCase() !== nm.toUpperCase()); app.view.redraw();
  });

  // ---------------- PURGE / RENAME
  R('PURGE', async (c) => {
    const d = doc(); let n = 0;
    d.touchTables();
    for (let pass = 0; pass < 5; pass++) {
      const used = new Set();
      const scan = (ents) => { for (const e of ents) { if (e.type === 'INSERT') used.add(e.name); if (e.type === 'DIMENSION' && e.block) used.add(e.block); } };
      scan(d.model); for (const l of d.layouts) scan(l.ents);
      for (const [k, b] of Object.entries(d.blocks)) if (used.has(k)) scan(b.ents);
      let removed = 0;
      for (const k of Object.keys(d.blocks)) if (!used.has(k) && !k.startsWith('*')) { delete d.blocks[k]; removed++; }
      n += removed; if (!removed) break;
    }
    const usedL = new Set([d.clayer, '0', 'Defpoints']);
    for (const e of d.allEntsDeep()) usedL.add(e.layer);
    let nl = 0; for (const k of Object.keys(d.layers)) if (!usedL.has(k)) { delete d.layers[k]; nl++; }
    c.print(`${n} block${n === 1 ? '' : 's'} deleted. ${nl} layer${nl === 1 ? '' : 's'} deleted.`);
    app.ui?.refresh?.();
  }, { alias: ['PU', '-PURGE'] });
  R('RENAME', async (c) => {
    const k = await c.getKw('Enter object type to rename [Block/Layer/Style]:');
    if (!k) return;
    const old = need(await c.getString(`Enter old ${k.toLowerCase()} name:`, { spaces: true }));
    const nw = need(await c.getString(`Enter new ${k.toLowerCase()} name:`, { spaces: true }));
    const d = doc(); d.touchTables();
    if (k === 'Block' && d.blocks[old]) { d.blocks[nw] = { ...d.blocks[old], name: nw }; delete d.blocks[old]; for (const e of d.allEntsDeep()) if (e.type === 'INSERT' && e.name === old) { d.touch(e); e.name = nw; } }
    else if (k === 'Layer' && d.layers[old] && old !== '0') { d.layers[nw] = { ...d.layers[old], name: nw }; delete d.layers[old]; if (d.clayer === old) d.clayer = nw; for (const e of d.allEntsDeep()) if (e.layer === old) { d.touch(e); e.layer = nw; } }
    else if (k === 'Style' && d.styles[old]) { d.styles[nw] = { ...d.styles[old], name: nw }; delete d.styles[old]; }
    else c.print('Name not found.');
    app.ui?.refresh?.(); app.view.redraw();
  }, { alias: ['REN', '-RENAME'] });
  void F;
}
