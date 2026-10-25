// Menús AutoCAD R12: menús desplegables (POP), menú de pantalla lateral (SCREEN), cargador .MNU y macros
import { h } from './dom.js';
import { saveSettings } from '../app.js';

export const ACAD12_MNU = String.raw`
***POP1
[File]
[New...]^C^C_new
[Open...]^C^C_open
[Save]^C^C_qsave
[Save As...]^C^C_saveas
[Recover...]^C^C_recover
[--]
[Plot...]^C^C_plot
[--]
[->Import/Export]
  [DXF In...]^C^C_dxfin
  [DXF Out...]^C^C_dxfout
  [PDF Out...]^C^C_exportpdf
  [SVG Out...]^C^C_svgout
  [<-PNG Out...]^C^C_pngout
[->Xref]
  [Attach...]^C^C_xattach
  [<-Write Block...]^C^C_wblock
[--]
[Applications...]^C^C_appload
[Run Script...]^C^C_script
[Visual LISP...]^C^C_vlisp
[--]
[Exit AutoCAD]^C^C_quit
***POP2
[Assist]
[Help!]'_help
[--]
[Cancel]^C^C
[Undo]^C^C_u
[Redo]^C^C_redo
[--]
[->Object Snap]
  [Center]_cen
  [Endpoint]_endp
  [Insertion]_ins
  [Intersection]_int
  [Midpoint]_mid
  [Nearest]_nea
  [Node]_nod
  [Perpendicular]_per
  [Quadrant]_qua
  [Tangent]_tan
  [<-None]_non
[Running Object Snap...]'_dsettings
[--]
[->Inquiry]
  [List]^C^C_list
  [Distance]'_dist
  [Area]^C^C_area
  [ID Point]'_id
  [Time]^C^C_time
  [<-Status]^C^C_status
[->Select]
  [Quick Select...]^C^C_qselect
  [Select Similar]^C^C_selectsimilar
  [<-Select All]^C^C_select all;
[--]
[Calculator]'_cal
***POP3
[Draw]
[Line]^C^C_line
[Construction Line]^C^C_xline
[Ray]^C^C_ray
[Polyline]^C^C_pline
[Spline]^C^C_spline
[--]
[->Arc]
  [3-Point]^C^C_arc
  [Start, Center, End]^C^C_arc \_c
  [Start, End, Radius]^C^C_arc \_e \_r
  [Start, End, Center]^C^C_arc \_e
  [<-Center, Start, End]^C^C_arc _c
[->Circle]
  [Center, Radius]^C^C_circle
  [Center, Diameter]^C^C_circle \_d
  [2-Point]^C^C_circle _2p
  [3-Point]^C^C_circle _3p
  [<-Tan, Tan, Radius]^C^C_circle _ttr
[Point]^C^C_point
[Donut]^C^C_donut
[Ellipse]^C^C_ellipse
[->Polygon]
  [Rectangle]^C^C_rectang
  [<-Polygon]^C^C_polygon
[--]
[->Text]
  [Dynamic]^C^C_dtext
  [<-Multiline...]^C^C_mtext
[->Dimensions]
  [Linear]^C^C_dimlinear
  [Aligned]^C^C_dimaligned
  [Radial]^C^C_dimradius
  [Diameter]^C^C_dimdiameter
  [Angular]^C^C_dimangular
  [Ordinate]^C^C_dimordinate
  [Continue]^C^C_dimcontinue
  [Baseline]^C^C_dimbaseline
  [<-Leader]^C^C_qleader
[Hatch...]^C^C_hatch
[Boundary...]^C^C_boundary
[Revision Cloud]^C^C_revcloud
[--]
[Insert Block...]^C^C_insert
***POP4
[Construct]
[Array]^C^C_array
[Copy]^C^C_copy
[Mirror]^C^C_mirror
[Chamfer]^C^C_chamfer
[Fillet]^C^C_fillet
[Offset]^C^C_offset
[Divide]^C^C_divide
[Measure]^C^C_measure
[--]
[Block...]^C^C_block
[Block Editor...]^C^C_bedit
[Attribute...]^C^C_attdef
***POP5
[Modify]
[Entity...]^C^C_properties
[Match Properties]^C^C_matchprop
[--]
[Erase]^C^C_erase
[Oops!]^C^C_oops
[Move]^C^C_move
[Rotate]^C^C_rotate
[Scale]^C^C_scale
[Stretch]^C^C_stretch
[Change Properties]^C^C_chprop
[--]
[Trim]^C^C_trim
[Extend]^C^C_extend
[Break]^C^C_break
[Join]^C^C_join
[Lengthen]^C^C_lengthen
[Align]^C^C_align
[--]
[Edit Polyline]^C^C_pedit
[Edit Text...]^C^C_ddedit
[Edit Attributes...]^C^C_eattedit
[Explode]^C^C_explode
***POP6
[View]
[Redraw]'_redraw
[Regen]^C^C_regen
[--]
[->Zoom]
  [Window]'_zoom _w
  [All]'_zoom _a
  [Previous]'_zoom _p
  [Extents]'_zoom _e
  [<-Scale]'_zoom _s
[Pan]'_pan
[Named Views...]^C^C_view
[--]
[->Tilemode]
  [Model Space]^C^C_layout _s Model
  [<-Paper Space (Layout1)]^C^C_layout _s Layout1
[->Mview]
  [Make Viewports]^C^C_mview
  [Model Space (in viewport)]^C^C_mspace
  [<-Paper Space]^C^C_pspace
***POP7
[Settings]
[Drawing Aids...]'_dsettings
[Layer Control...]'_layer
[Object Snap...]'_dsettings
[--]
[Color...]'_color
[Linetype...]'_linetype
[Lineweight...]'_lweight
[--]
[Units Control...]'_units
[Dimension Style...]^C^C_dimstyle
[Text Style...]^C^C_style
[Point Style...]^C^C_ddptype
[--]
[Options...]'_options
[Customize (CUI)...]^C^C_cui
[Load Menu (.MNU)...]^C^C_menu

***SCREEN
**S
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[]
[BLOCKS]$S=BL
[DIM:]$S=DIM
[DISPLAY]$S=DS
[DRAW]$S=DR
[EDIT]$S=ED
[INQUIRY]$S=INQ
[LAYER...]'_layer
[MVIEW]$S=MV
[PLOT...]^C^C_plot
[SETTINGS]$S=SET
[UTILITY]$S=UT
[LISP]$S=LSP
[]
[]
[SAVE:]^C^C_qsave
**DR
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[DRAW]
[ARC]$S=ARC
[ATTDEF:]^C^C_attdef
[BHATCH:]^C^C_hatch
[CIRCLE]$S=CIR
[DONUT:]^C^C_donut
[DTEXT:]^C^C_dtext
[ELLIPSE:]^C^C_ellipse
[HATCH:]^C^C_-hatch
[INSERT:]^C^C_-insert
[LINE:]^C^C_line
[MTEXT:]^C^C_mtext
[PLINE:]^C^C_pline
[POINT:]^C^C_point
[POLYGON:]^C^C_polygon
[RECTANG:]^C^C_rectang
[SPLINE:]^C^C_spline
[XLINE:]^C^C_xline
[]
[  LAST  ]$S=
[  EDIT  ]$S=ED
**ARC
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[ARC]
[3-point:]^C^C_arc
[S,C,E:]^C^C_arc \_c
[S,E,R:]^C^C_arc \_e \_r
[S,E,C:]^C^C_arc \_e
[C,S,E:]^C^C_arc _c
[]
[  LAST  ]$S=
[  DRAW  ]$S=DR
**CIR
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[CIRCLE]
[CEN,RAD:]^C^C_circle
[CEN,DIA:]^C^C_circle \_d
[2-POINT:]^C^C_circle _2p
[3-POINT:]^C^C_circle _3p
[TTR:]^C^C_circle _ttr
[]
[  LAST  ]$S=
[  DRAW  ]$S=DR
**ED
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[EDIT]
[ARRAY:]^C^C_array
[ATTEDIT:]^C^C_eattedit
[BREAK:]^C^C_break
[CHAMFER:]^C^C_chamfer
[CHPROP:]^C^C_chprop
[COPY:]^C^C_copy
[DDEDIT:]^C^C_ddedit
[DIVIDE:]^C^C_divide
[ERASE:]^C^C_erase
[EXPLODE:]^C^C_explode
[EXTEND:]^C^C_extend
[FILLET:]^C^C_fillet
[MEASURE:]^C^C_measure
[MIRROR:]^C^C_mirror
[MOVE:]^C^C_move
[OFFSET:]^C^C_offset
[PEDIT:]^C^C_pedit
[ROTATE:]^C^C_rotate
[SCALE:]^C^C_scale
[STRETCH:]^C^C_stretch
[TRIM:]^C^C_trim
[UNDO:]^C^C_undo
[  LAST  ]$S=
[  DRAW  ]$S=DR
**DS
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[DISPLAY]
[PAN:]'_pan
[REDRAW:]'_redraw
[REGEN:]^C^C_regen
[VIEW:]^C^C_view
[ZOOM:]'_zoom
[]
[ZOOM W]'_zoom _w
[ZOOM E]'_zoom _e
[ZOOM P]'_zoom _p
[ZOOM A]'_zoom _a
[]
[  LAST  ]$S=
**INQ
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[INQUIRY]
[AREA:]^C^C_area
[DBLIST:]^C^C_list
[DIST:]'_dist
[ID:]'_id
[LIST:]^C^C_list
[STATUS:]^C^C_status
[TIME:]^C^C_time
[]
[  LAST  ]$S=
**BL
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[BLOCKS]
[ATTDEF:]^C^C_attdef
[ATTEDIT:]^C^C_eattedit
[BASE:]^C^C_base
[BEDIT:]^C^C_bedit
[BLOCK:]^C^C_-block
[EXPLODE:]^C^C_explode
[INSERT:]^C^C_-insert
[PURGE:]^C^C_purge
[WBLOCK:]^C^C_wblock
[XREF:]^C^C_xattach
[]
[BPARAM:]^C^C_bparameter
[BACTION:]^C^C_baction
[BVSTATE:]^C^C_bvstate
[BCLOSE:]^C^C_bclose
[  LAST  ]$S=
**DIM
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[DIM:]
[LINEAR]^C^C_dimlinear
[ALIGNED]^C^C_dimaligned
[ANGULAR]^C^C_dimangular
[RADIUS]^C^C_dimradius
[DIAMETR]^C^C_dimdiameter
[ORDINATE]^C^C_dimordinate
[CONTINUE]^C^C_dimcontinue
[BASELINE]^C^C_dimbaseline
[LEADER]^C^C_qleader
[TEDIT]^C^C_dimtedit
[STYLE...]^C^C_dimstyle
[]
[  LAST  ]$S=
**MV
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[MVIEW]
[MVIEW:]^C^C_mview
[MSPACE:]^C^C_mspace
[PSPACE:]^C^C_pspace
[LAYOUT:]^C^C_layout
[MODEL]^C^C_layout _s Model
[]
[  LAST  ]$S=
**SET
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[SETTINGS]
[DDRMODES]'_dsettings
[DDUNITS]'_units
[COLOR:]'_color
[GRID:]'_grid
[LIMITS:]^C^C_limits
[LINETYP:]'_linetype
[LTSCALE:]'_ltscale
[ORTHO:]'_ortho
[OSNAP:]'_-osnap
[PDMODE:]'_ddptype
[SETVAR:]'_setvar
[SNAP:]'_snap
[STYLE:]^C^C_style
[OPTIONS]'_options
[  LAST  ]$S=
**UT
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[UTILITY]
[APPLOAD]^C^C_appload
[AUDIT:]^C^C_audit
[DXFIN:]^C^C_dxfin
[DXFOUT:]^C^C_dxfout
[MENU:]^C^C_menu
[NEW:]^C^C_new
[OPEN:]^C^C_open
[PURGE:]^C^C_purge
[RENAME:]^C^C_rename
[SAVEAS:]^C^C_saveas
[SCRIPT:]^C^C_script
[]
[  LAST  ]$S=
**LSP
[AutoCAD]$S=S
[* * * *]$S=OSNAP
[LISP]
[APPLOAD]^C^C_appload
[VLISP]^C^C_vlisp
[SCRIPT:]^C^C_script
[]
[  LAST  ]$S=
**OSNAP
[-OSNAPS-]
[CENter]_cen
[ENDpoint]_endp
[INSert]_ins
[INTersec]_int
[MIDpoint]_mid
[NEArest]_nea
[NODe]_nod
[PERpend]_per
[QUAdrant]_qua
[TANgent]_tan
[NONE]_non
[]
[OSNAP:]'_-osnap
[]
[  LAST  ]$S=
`;

export function parseMNU(text) {
  const res = { pops: [], screen: {} };
  let sec = null, sub = null, stack = null, pop = null;
  for (let raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('//')) continue;
    const t = line.trim();
    if (t.startsWith('***')) {
      sec = t.slice(3).toUpperCase(); sub = null;
      if (/^POP\d+/.test(sec)) { pop = { title: null, items: [] }; res.pops.push(pop); stack = [pop.items]; }
      continue;
    }
    if (!sec) continue;
    if (sec === 'SCREEN') {
      if (t.startsWith('**')) { sub = t.slice(2).split(/\s+/)[0].toUpperCase(); res.screen[sub] = []; continue; }
      if (!sub) { sub = 'S'; res.screen[sub] = []; }
      const m = /^\[([^\]]*)\](.*)$/.exec(t);
      res.screen[sub].push(m ? { label: m[1], macro: m[2] } : { label: t, macro: t });
      continue;
    }
    if (/^POP\d+/.test(sec)) {
      if (t.startsWith('**')) continue;
      const m = /^(?:ID_\w+\s*)?\[([^\]]*)\](.*)$/.exec(t);
      if (!m) continue;
      let label = m[1], macro = m[2];
      if (pop.title == null) { pop.title = label.replace(/^&/, '').replace(/&/g, ''); continue; }
      let ends = 0;
      while (label.startsWith('<-')) { ends++; label = label.slice(2); }
      if (label.startsWith('->')) { const it = { label: label.slice(2).replace(/&/g, ''), items: [] }; stack[stack.length - 1].push(it); stack.push(it.items); continue; }
      const it = label === '--' || label === '' ? { sep: true } : { label: label.replace(/^~/, '').replace(/&/g, ''), macro, dis: label.startsWith('~') };
      stack[stack.length - 1].push(it);
      for (let k = 0; k < ends && stack.length > 1; k++) stack.pop();
    }
  }
  return res;
}

// ejecuta una macro de menú estilo AutoCAD (^C, ;, espacio, \ pausa, $S=)
export function createMacroRunner(app) {
  return async function runMacro(macro) {
    if (macro == null) return;
    let m = String(macro);
    const eng = app.cmd;
    if (m.startsWith('>')) { app.ui.cmdline.submit(m.slice(1)); return; }
    m = m.replace(/\^P/g, '').replace(/\^M/g, ';');
    const screens = [...m.matchAll(/\$S=([\w-]*)/gi)].map((x) => x[1]);
    m = m.replace(/\$[SPMI]\d*=[\w.*-]*/gi, '').replace(/\$[SPMI]\d*=\s/gi, ' ');
    if (screens.length) app.ui.menu12.goto(screens[screens.length - 1]);
    let cancels = 0; while (m.startsWith('^C')) { cancels++; m = m.slice(2); }
    m = m.replace(/^\*/, '');
    if (!m.trim()) { if (cancels) eng.cancel(); return; }
    if (m.trim().startsWith('(')) { await app.lisp.evalTyped(m.trim()); return; }
    // tokens
    const toks = []; let buf = '', q = false;
    for (const ch of m) {
      if (ch === '"') { q = !q; continue; }
      if (!q && (ch === ' ' || ch === ';')) { toks.push(buf); buf = ''; continue; }
      if (!q && ch === '\\') { if (buf) toks.push(buf); buf = ''; toks.push('\\'); continue; }
      buf += ch;
    }
    if (buf) toks.push(buf);
    while (toks.length && toks[0] === '') toks.shift();
    if (!toks.length) return;
    const first = toks[0];
    const transp = first.startsWith("'");
    const name = eng.resolveName(first.replace(/^'/, ''));
    const cmd = name && eng.commands[name];
    if (cmd && (cancels || !transp || !eng.active)) {
      if (eng.active && !(transp && cmd.transparent)) { eng.cancel(); await new Promise((r) => setTimeout(r, 0)); if (eng.active) eng.cancel(); await new Promise((r) => setTimeout(r, 0)); }
    } else if (cancels && eng.active) { eng.cancel(); await new Promise((r) => setTimeout(r, 0)); }
    if (transp && eng.active && eng.req && cmd?.transparent) {
      eng.submit("'" + first.replace(/^'/, ''));
      await eng.waitSettled();
      const rest = toks.slice(1); if (rest.length) await app.lisp.command(rest).catch((e) => app.log(e.message));
      return;
    }
    if (!eng.active && !name) {
      if (eng.doc.getvar(first) !== undefined) { eng.run(first); await eng.waitSettled(); const rest = toks.slice(1); if (rest.length) await app.lisp.command(rest).catch(() => {}); return; }
      eng.submit(first); return;
    }
    try { await app.lisp.command(toks.map((t) => t.replace(/^'/, ''))); } catch (e) { app.log(e.message); }
  };
}

export function createMenu12(app) {
  const bar = document.getElementById('menubar'), scr = document.getElementById('screen');
  const m12 = { page: 'S', history: [] };
  let menus = parseMNU(app.settings.customMenu || ACAD12_MNU);
  if (!menus.pops.length || !Object.keys(menus.screen).length) { const def = parseMNU(ACAD12_MNU); if (!menus.pops.length) menus.pops = def.pops; if (!Object.keys(menus.screen).length) menus.screen = def.screen; }
  let openMenu = null;
  const closeAll = () => { document.querySelectorAll('.dropmenu.r12').forEach((x) => x.remove()); bar.querySelectorAll('.mi.open').forEach((x) => x.classList.remove('open')); openMenu = null; };
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.dropmenu.r12') && !e.target.closest('#menubar')) closeAll(); }, true);
  const showItems = (items, x, y, level = 0) => {
    document.querySelectorAll('.dropmenu.r12').forEach((el) => { if (+el.dataset.level >= level) el.remove(); });
    const box = h('div', { class: 'dropmenu r12', 'data-level': level, style: { left: x + 'px', top: y + 'px' } });
    for (const it of items) {
      if (it.sep) { box.append(h('div', { class: 'sep' })); continue; }
      const row = h('div', { class: 'it' + (it.items ? ' sub' : '') + (it.dis ? ' dis' : ''), text: it.label });
      if (it.items) row.onpointerenter = () => { const r = row.getBoundingClientRect(); showItems(it.items, r.right - 2, r.top - 3, level + 1); };
      else { row.onpointerenter = () => document.querySelectorAll('.dropmenu.r12').forEach((el) => { if (+el.dataset.level > level) el.remove(); }); row.onclick = () => { closeAll(); if (!it.dis) app.ui.runMacro(it.macro); }; }
      box.append(row);
    }
    document.body.append(box);
    const r = box.getBoundingClientRect();
    if (r.right > innerWidth) box.style.left = Math.max(0, innerWidth - r.width - 4) + 'px';
    if (r.bottom > innerHeight) box.style.top = Math.max(0, innerHeight - r.height - 4) + 'px';
  };
  m12.renderBar = () => {
    bar.innerHTML = '';
    for (const p of menus.pops) {
      const mi = h('div', { class: 'mi', text: p.title });
      const openIt = () => { closeAll(); mi.classList.add('open'); openMenu = mi; const r = mi.getBoundingClientRect(); showItems(p.items, r.left, r.bottom); };
      mi.onclick = () => (openMenu === mi ? closeAll() : openIt());
      mi.onpointerenter = () => { if (openMenu && openMenu !== mi) openIt(); };
      bar.append(mi);
    }
  };
  m12.goto = (name) => {
    name = String(name || '').toUpperCase();
    if (!name) { const prev = m12.history.pop(); m12.page = prev || 'S'; }
    else if (name === 'X') return;
    else if (menus.screen[name]) { if (m12.page !== name) m12.history.push(m12.page); m12.page = name; }
    m12.renderScreen();
  };
  m12.renderScreen = () => {
    scr.innerHTML = '';
    const items = menus.screen[m12.page] || menus.screen.S || [];
    for (const it of items) {
      const isTitle = !it.macro && it.label;
      const el = h('div', { class: 'sh' + (isTitle ? ' title' : '') + (!it.label ? ' blank' : ''), text: it.label || ' ' });
      if (it.macro) el.onclick = () => app.ui.runMacro(it.macro);
      scr.append(el);
    }
  };
  m12.loadMNU = (text, name = 'menu') => {
    const parsed = parseMNU(text);
    if (!parsed.pops.length && !Object.keys(parsed.screen).length) { app.log(`${name}: no contiene secciones ***POP ni ***SCREEN.`); return; }
    if (parsed.pops.length) menus.pops = parsed.pops;
    if (Object.keys(parsed.screen).length) { menus.screen = parsed.screen; m12.page = parsed.screen.S ? 'S' : Object.keys(parsed.screen)[0]; m12.history = []; }
    app.settings.customMenu = text; saveSettings();
    m12.renderBar(); m12.renderScreen();
    app.log(`Menú "${name}" cargado: ${parsed.pops.length} menús desplegables, ${Object.keys(parsed.screen).length} páginas de pantalla.`);
  };
  m12.resetMenus = () => { delete app.settings.customMenu; saveSettings(); menus = parseMNU(ACAD12_MNU); m12.page = 'S'; m12.renderBar(); m12.renderScreen(); app.log('Menú AutoCAD R12 restaurado.'); };
  m12.menus = () => menus;
  m12.renderBar(); m12.renderScreen();
  return m12;
}
