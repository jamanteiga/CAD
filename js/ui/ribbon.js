// Cinta de opciones (Ribbon) estilo AutoCAD 2023
import { h } from './dom.js';
import { icon } from './icons.js';
import { aciCss, colorName, lwName, LWEIGHTS, HATCHES } from '../core/tables.js';
import { hatchSwatch } from './thumb.js';
import { saveSettings } from '../app.js';

const B = (cmd, label, ic, dd) => ({ big: cmd, label, icon: ic, dd });
const S = (cmd, label, ic, dd) => ({ cmd, label, icon: ic, dd });
const COL = (...items) => ({ col: items });

export const TABS = [
  { id: 'home', name: 'Home', panels: [
    { name: 'Draw', items: [B('LINE', 'Line', 'line'), B('PLINE', 'Polyline', 'pline'),
      B('CIRCLE', 'Circle', 'circle', [S('^C^CCIRCLE', 'Center, Radius', 'circle'), S('^C^CCIRCLE \\D', 'Center, Diameter', 'circle'), S('^C^CCIRCLE 2P', '2-Point', 'circle3p'), S('^C^CCIRCLE 3P', '3-Point', 'circle3p'), S('^C^CCIRCLE TTR', 'Tan, Tan, Radius', 'ttr')]),
      B('ARC', 'Arc', 'arc', [S('^C^CARC', '3-Point', 'arc'), S('^C^CARC \\C', 'Start, Center, End', 'arc'), S('^C^CARC \\E', 'Start, End, Center', 'arc'), S('^C^CARC \\E \\R', 'Start, End, Radius', 'arc'), S('^C^CARC C', 'Center, Start, End', 'arc')]),
      COL(S('RECTANG', '', 'rect', [S('RECTANG', 'Rectangle', 'rect'), S('POLYGON', 'Polygon', 'polygon')]), S('HATCH', '', 'hatch', [S('HATCH', 'Hatch', 'hatch'), S('GRADIENT', 'Gradient', 'gradient'), S('BOUNDARY', 'Boundary', 'boundary')]), S('ELLIPSE', '', 'ellipse', [S('ELLIPSE', 'Axis, End', 'ellipse'), S('^C^CELLIPSE C', 'Center', 'ellipse'), S('^C^CELLIPSE A', 'Elliptical Arc', 'ellipse')])),
      COL(S('SPLINE', '', 'spline'), S('XLINE', '', 'xline', [S('XLINE', 'Construction Line', 'xline'), S('RAY', 'Ray', 'ray')]), S('POINT', '', 'point', [S('POINT', 'Multiple Points', 'point'), S('DIVIDE', 'Divide', 'divide'), S('MEASURE', 'Measure', 'divide'), S('DONUT', 'Donut', 'donut'), S('REVCLOUD', 'Revision Cloud', 'revcloud'), S('WIPEOUT', 'Wipeout', 'wipeout')]))] },
    { name: 'Modify', items: [COL(S('MOVE', 'Move', 'move'), S('COPY', 'Copy', 'copy'), S('STRETCH', 'Stretch', 'stretch')), COL(S('ROTATE', 'Rotate', 'rotate'), S('MIRROR', 'Mirror', 'mirror'), S('SCALE', 'Scale', 'scale')),
      COL(S('TRIM', 'Trim', 'trim', [S('TRIM', 'Trim', 'trim'), S('EXTEND', 'Extend', 'extend')]), S('FILLET', 'Fillet', 'fillet', [S('FILLET', 'Fillet', 'fillet'), S('CHAMFER', 'Chamfer', 'chamfer')]), S('ARRAY', 'Array', 'array', [S('ARRAYRECT', 'Rectangular Array', 'array'), S('ARRAYPATH', 'Path Array', 'array'), S('ARRAYPOLAR', 'Polar Array', 'arraypolar')])),
      COL(S('ERASE', '', 'erase'), S('EXPLODE', '', 'explode'), S('OFFSET', '', 'offset')), COL(S('BREAK', '', 'break', [S('BREAK', 'Break', 'break'), S('BREAKATPOINT', 'Break at Point', 'break')]), S('JOIN', '', 'join'), S('PEDIT', '', 'pedit', [S('PEDIT', 'Edit Polyline', 'pedit'), S('LENGTHEN', 'Lengthen', 'lengthen'), S('ALIGN', 'Align', 'align'), S('DRAWORDER', 'Draw Order', 'draworder')]))] },
    { name: 'Annotation', items: [B('MTEXT', 'Text', 'text', [S('MTEXT', 'Multiline Text', 'mtext'), S('TEXT', 'Single Line', 'text')]), B('DIMLINEAR', 'Dimension', 'dimlinear'),
      COL(S('DIMLINEAR', 'Linear', 'dimlinear', [S('DIMLINEAR', 'Linear', 'dimlinear'), S('DIMALIGNED', 'Aligned', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular'), S('DIMRADIUS', 'Radius', 'dimradius'), S('DIMDIAMETER', 'Diameter', 'dimdiameter'), S('DIMORDINATE', 'Ordinate', 'dimordinate')]), S('MLEADER', 'Leader', 'leader', [S('MLEADER', 'Multileader', 'leader'), S('QLEADER', 'Quick Leader', 'leader')]), S('DIMSTYLE', 'Dim Style', 'dimstyle'))] },
    { name: 'Layers', items: [B('LAYER', 'Layer Properties', 'layers'), { combo: 'layer' }] },
    { name: 'Block', items: [B('INSERT', 'Insert', 'insert'), COL(S('BLOCK', 'Create', 'block'), S('BEDIT', 'Edit', 'bedit'), S('EATTEDIT', 'Edit Attributes', 'attedit'))] },
    { name: 'Properties', items: [B('MATCHPROP', 'Match Properties', 'matchprop'), { combo: 'props' }] },
    { name: 'Utilities', items: [B('DIST', 'Measure', 'measure', [S('DIST', 'Distance', 'dist'), S('AREA', 'Area', 'area'), S('ID', 'ID Point', 'id'), S('LIST', 'List', 'list')]), COL(S('QSELECT', 'Quick Select', 'qselect'), S('SELECTSIMILAR', 'Select Similar', 'qselect'), S('FIND', 'Find', 'find'))] },
    { name: 'Clipboard', items: [B('PASTECLIP', 'Paste', 'paste', [S('PASTECLIP', 'Paste', 'paste'), S('PASTEBLOCK', 'Paste as Block', 'paste'), S('PASTEORIG', 'Paste to Original Coordinates', 'paste')]), COL(S('COPYCLIP', 'Copy Clip', 'copyclip'), S('CUTCLIP', 'Cut', 'cutclip'), S('COPYBASE', 'Copy with Base Point', 'copyclip'))] },
    { name: 'View', items: [COL(S('ZOOM E', 'Extents', 'zoomext'), S('ZOOM W', 'Window', 'zoomwin'), S('PAN', 'Pan', 'pan'))] },
  ] },
  { id: 'insert', name: 'Insert', panels: [
    { name: 'Block', items: [B('INSERT', 'Insert', 'insert'), B('EATTEDIT', 'Edit Attribute', 'attedit')] },
    { name: 'Block Definition', items: [B('BLOCK', 'Create Block', 'block'), B('ATTDEF', 'Define Attributes', 'attdef'), B('ATTSYNC', 'Synchronize', 'attsync'), B('BEDIT', 'Block Editor', 'bedit')] },
    { name: 'Reference', items: [B('XATTACH', 'Attach', 'insert'), B('WBLOCK', 'Write Block', 'save')] },
    { name: 'Import', items: [B('DXFIN', 'Import DXF/DWG', 'dxf')] },
  ] },
  { id: 'annotate', name: 'Annotate', panels: [
    { name: 'Text', items: [B('MTEXT', 'Multiline Text', 'mtext'), COL(S('TEXT', 'Single Line', 'text'), S('STYLE', 'Text Style', 'text'), S('FIND', 'Find text', 'find'))] },
    { name: 'Dimensions', items: [B('DIMLINEAR', 'Dimension', 'dimlinear'), COL(S('DIMLINEAR', 'Linear', 'dimlinear'), S('DIMALIGNED', 'Aligned', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular')), COL(S('DIMRADIUS', 'Radius', 'dimradius'), S('DIMDIAMETER', 'Diameter', 'dimdiameter'), S('DIMORDINATE', 'Ordinate', 'dimordinate')), COL(S('DIMCONTINUE', 'Continue', 'dimcontinue'), S('DIMBASELINE', 'Baseline', 'dimbaseline'), S('DIMTEDIT', 'Text Edit', 'dimstyle')), B('DIMSTYLE', 'Dim Style', 'dimstyle')] },
    { name: 'Leaders', items: [B('MLEADER', 'Multileader', 'leader'), B('QLEADER', 'Leader', 'leader')] },
    { name: 'Markup', items: [B('REVCLOUD', 'Revision Cloud', 'revcloud'), B('WIPEOUT', 'Wipeout', 'wipeout')] },
  ] },
  { id: 'view', name: 'View', panels: [
    { name: 'Viewport Tools', items: [{ toggle: 'ucsIcon', label: 'UCS Icon', icon: 'ucs' }] },
    { name: 'Navigate', items: [B('ZOOM E', 'Extents', 'zoomext'), B('ZOOM W', 'Window', 'zoomwin'), B('ZOOM P', 'Previous', 'zoomext'), B('PAN', 'Pan', 'pan')] },
    { name: 'Named Views', items: [B('VIEW', 'View Manager', 'view'), B('REGEN', 'Regen', 'regen')] },
    { name: 'Palettes', items: [B('PROPERTIES', 'Properties', 'properties'), B('LAYER', 'Layers', 'layers'), B('VLISP', 'Visual LISP', 'vlisp'), B('TEXTSCR', 'Command History', 'cmdline')] },
    { name: 'Interface', items: [{ toggle: 'fileTabs', label: 'File Tabs', icon: 'filetabs' }, { toggle: 'layoutTabs', label: 'Layout Tabs', icon: 'layout' }, { toggle: 'menuBar', label: 'Menu Bar R12', icon: 'menubar' }, { toggle: 'screenMenu', label: 'Screen Menu R12', icon: 'screenmenu' }, { toggle: 'theme', label: 'Light/Dark', icon: 'theme' }] },
  ] },
  { id: 'manage', name: 'Manage', panels: [
    { name: 'Customization', items: [B('CUI', 'User Interface', 'cui'), B('ALIASEDIT', 'Edit Aliases', 'aliases'), B('MENU', 'Load .MNU', 'menubar')] },
    { name: 'Applications', items: [B('APPLOAD', 'Load Application', 'appload'), B('SCRIPT', 'Run Script', 'script'), B('VLISP', 'Visual LISP Editor', 'vlisp')] },
    { name: 'Cleanup', items: [B('PURGE', 'Purge', 'purge'), COL(S('OVERKILL', 'Overkill', 'overkill'), S('AUDIT', 'Audit', 'audit'), S('SETVAR ?', 'System Variables', 'setvar'))] },
    { name: 'Settings', items: [COL(S('UNITS', 'Units', 'units'), S('DSETTINGS', 'Drafting Settings', 'options'), S('OPTIONS', 'Options', 'options')), COL(S('LINETYPE', 'Linetypes', 'line'), S('LWEIGHT', 'Lineweights', 'line'), S('DDPTYPE', 'Point Style', 'point'))] },
  ] },
  { id: 'output', name: 'Output', panels: [
    { name: 'Plot', items: [B('PLOT', 'Plot', 'plot'), B('PAGESETUP', 'Page Setup', 'layout')] },
    { name: 'Export', items: [B('EXPORTPDF', 'Export PDF', 'pdf'), B('SVGOUT', 'SVG', 'svg'), B('PNGOUT', 'Image', 'png'), B('DXFOUT', 'DXF', 'dxf')] },
  ] },
  { id: 'express', name: 'Express Tools', panels: [
    { name: 'Blocks', items: [B('EXPLODE', 'Explode Attributes', 'explode'), B('COUNT', 'Count', 'count')] },
    { name: 'Layers', items: [COL(S('LAYISO', 'Isolate', 'layiso'), S('LAYUNISO', 'Unisolate', 'layiso'), S('LAYOFF', 'Off', 'layoff')), COL(S('LAYFRZ', 'Freeze', 'layfrz'), S('LAYTHW', 'Thaw All', 'layfrz'), S('LAYON', 'All On', 'layoff')), COL(S('LAYMRG', 'Merge', 'layers'), S('LAYDEL', 'Delete', 'purge'), S('LAYCUR', 'Change to Current', 'laymcur'))] },
    { name: 'Modify', items: [COL(S('ISOLATEOBJECTS', 'Isolate Objects', 'isolate'), S('HIDEOBJECTS', 'Hide Objects', 'isolate'), S('UNISOLATEOBJECTS', 'End Isolation', 'isolate'))] },
    { name: 'Tools', items: [B('ALIASEDIT', 'Command Aliases', 'aliases'), B('SETVAR ?', 'System Variables', 'setvar'), B('CAL', 'Calculator', 'units')] },
  ] },
];
const LAYOUT_TAB = { id: 'layout', name: 'Layout', panels: [
  { name: 'Layout', items: [B('LAYOUT N', 'New', 'layout'), B('PAGESETUP', 'Page Setup', 'plot')] },
  { name: 'Layout Viewports', items: [B('MVIEW', 'Rectangular', 'mview'), COL(S('MSPACE', 'Model Space', 'mspace'), S('PSPACE', 'Paper Space', 'layout'), S('MVIEW LOCK', 'Lock', 'laylck'))] },
] };
const BEDIT_TAB = { id: 'bedit', name: 'Block Editor', ctx: true, panels: [
  { name: 'Open/Save', items: [B('BSAVE', 'Save Block', 'bsave'), B('BEDIT', 'Edit Block', 'bedit')] },
  { name: 'Geometry', items: [COL(S('LINE', 'Line', 'line'), S('CIRCLE', 'Circle', 'circle'), S('PLINE', 'Polyline', 'pline')), COL(S('ATTDEF', 'Attribute Definition', 'attdef'), S('BASE', 'Base Point', 'id'))] },
  { name: 'Parameters', items: [B('^C^CBPARAMETER L', 'Linear', 'bparamlin'), B('^C^CBPARAMETER R', 'Rotation', 'bparamrot'), B('^C^CBPARAMETER F', 'Flip', 'bparamflip'), B('^C^CBPARAMETER V', 'Visibility', 'bparamvis')] },
  { name: 'Actions', items: [B('BACTION', 'Action', 'baction'), B('BPARAMDEL', 'Delete Param', 'close')] },
  { name: 'Visibility', items: [B('BVSTATE', 'Visibility States', 'bvstate'), COL(S('BVHIDE', 'Make Invisible', 'bvhide'), S('BVSHOW', 'Make Visible', 'bvshow'))] },
  { name: 'Close', items: [B('BCLOSE', 'Close Block Editor', 'bclose')] },
] };
const HATCH_TAB = { id: 'hatch', name: 'Hatch Creation', ctx: true, panels: [
  { name: 'Boundaries', items: [B('', 'Pick Points', 'boundary', null, 'pick'), B('>S', 'Select', 'qselect')] },
  { name: 'Pattern', items: [{ custom: 'hpat' }] },
  { name: 'Properties', items: [{ custom: 'hprops' }] },
  { name: 'Close', items: [B('', 'Close Hatch Creation', 'bclose')] },
] };

export function createRibbon(app) {
  const root = document.getElementById('ribbon'), tabsEl = document.getElementById('rtabs'), panels = document.getElementById('rpanels');
  const rb = { active: 'home', ctx: new Set() };
  let dropdown = null;
  const closeDrop = () => { dropdown?.remove(); dropdown = null; };
  document.addEventListener('pointerdown', (e) => { if (dropdown && !dropdown.contains(e.target)) closeDrop(); }, true);
  const run = (cmd) => app.ui.runMacro(cmd);
  const showDrop = (anchor, items) => {
    closeDrop();
    const r = anchor.getBoundingClientRect();
    dropdown = h('div', { class: 'dropmenu', style: { left: r.left + 'px', top: r.bottom + 'px' } }, items.map((it) => h('div', { class: 'it', onclick: () => { closeDrop(); run(it.cmd); } }, h('span', { class: 'ico', html: icon(it.icon) }), it.label)));
    document.body.append(dropdown);
  };
  rb.showDropdown = showDrop; rb.closeDropdown = closeDrop;
  panels.addEventListener('wheel', (e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { panels.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });

  const bigBtn = (it) => {
    const b = h('button', { class: 'big', type: 'button', title: it.label + (it.big ? ` (${it.big.replace(/\^C/g, '')})` : '') }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label), it.dd ? h('span', { html: icon('caret'), style: { width: '10px', height: '10px', marginTop: '1px' } }) : '');
    b.onclick = (e) => { if (it.dd && e.offsetY > b.clientHeight - 16) return showDrop(b, it.dd); if (it.big === '' && it.label.startsWith('Close')) return app.cmd.submit(''); if (it.big === '' && it.label === 'Pick Points') return; run(it.big); };
    if (it.dd) b.oncontextmenu = (e) => { e.preventDefault(); showDrop(b, it.dd); };
    return b;
  };
  const smBtn = (it) => {
    const b = h('button', { class: 'sm' + (it.label ? '' : ' iconly'), type: 'button', title: (it.label || it.cmd).replace(/\^C/g, '') }, h('span', { class: 'ico', html: icon(it.icon) }), it.label || '', it.dd ? h('span', { html: icon('caret'), style: { width: '9px', height: '9px' } }) : '');
    b.onclick = (e) => { if (it.dd && (e.offsetX > b.clientWidth - 12 || !it.label)) { if (!it.label && e.offsetX < b.clientWidth - 12) return run(it.cmd); return showDrop(b, it.dd); } run(it.cmd); };
    return b;
  };
  const toggleBtn = (it) => {
    const on = it.toggle === 'theme' ? app.settings.theme === 'light' : !!app.settings[it.toggle];
    const b = h('button', { class: 'big' + (on ? ' on' : ''), type: 'button', title: it.label }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label));
    b.onclick = () => { if (it.toggle === 'theme') app.settings.theme = app.settings.theme === 'light' ? 'dark' : 'light'; else app.settings[it.toggle] = !app.settings[it.toggle]; saveSettings(); app.ui.applyLayout(); rb.render(); };
    return b;
  };
  // combos
  const layerCombo = () => {
    const d = app.doc;
    const sel = app.cmd.sel;
    const curName = sel.length ? (new Set(sel.map((e) => e.layer)).size === 1 ? sel[0].layer : '') : d.clayer;
    const L = d.layers[curName];
    const face = h('button', { class: 'rcombo', type: 'button', style: { display: 'flex', alignItems: 'center', gap: '4px', minWidth: '210px', textAlign: 'left' } },
      L ? [h('span', { style: { width: '14px', height: '14px', display: 'inline-block' }, html: icon(L.on ? 'bulbOn' : 'bulbOff') }), h('span', { style: { width: '14px', height: '14px', display: 'inline-block' }, html: icon(L.frozen ? 'snow' : 'sun') }), h('span', { class: 'swatch', style: { background: layerCss(L) } }), h('span', { text: curName })] : h('span', { class: 'hint', text: sel.length ? '(varies)' : '' }), h('span', { style: { marginLeft: 'auto', width: '10px' }, html: icon('caret') }));
    face.onclick = () => {
      closeDrop();
      const r = face.getBoundingClientRect();
      const list = h('div', { class: 'dropmenu', style: { left: r.left + 'px', top: r.bottom + 'px', minWidth: r.width + 40 + 'px' } });
      for (const l of Object.values(d.layers).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
        const tog = (k, t, onTxt, offTxt) => h('span', { class: 'ico', title: t, style: { width: '16px', height: '16px', cursor: 'pointer' }, html: icon(l[k] ? onTxt : offTxt), onclick: (e) => { e.stopPropagation(); d.begin('LAYER'); d.touchTables(); l[k] = !l[k]; d.end(); app.view.redraw(); closeDrop(); face.click(); } });
        list.append(h('div', { class: 'it', onclick: () => {
          closeDrop();
          if (app.cmd.sel.length) { d.begin('CHPROP'); for (const e of app.cmd.sel) d.mod(e, (x) => (x.layer = l.name)); d.end(); app.view.redraw(); }
          else { if (l.frozen) { app.log('Cannot set a frozen layer current.'); return; } d.clayer = l.name; }
          app.ui.refresh();
        } }, tog('on', 'On/Off', 'bulbOn', 'bulbOff'), tog('frozen', 'Freeze', 'snow', 'sun'), tog('locked', 'Lock', 'lockOn', 'lockOff'), h('span', { class: 'swatch', style: { background: layerCss(l) } }), h('span', { text: l.name, style: { fontWeight: l.name === d.clayer ? 700 : 400 } })));
      }
      document.body.append(list); dropdown = list;
    };
    const tools = h('div', { class: 'row', style: { gap: '1px' } }, [['LAYOFF', 'layoff', 'Off'], ['LAYISO', 'layiso', 'Isolate'], ['LAYFRZ', 'layfrz', 'Freeze'], ['LAYLCK', 'laylck', 'Lock'], ['LAYUNISO', 'layiso', 'Unisolate'], ['LAYON', 'layoff', 'All on'], ['LAYTHW', 'layfrz', 'Thaw all'], ['LAYULK', 'laylck', 'Unlock']].map(([c, i, t]) => h('button', { class: 'sm iconly', type: 'button', title: t, html: `<span class="ico">${icon(i)}</span>`, onclick: () => run(c) })));
    const row2 = h('div', { class: 'row', style: { gap: '2px' } }, h('button', { class: 'sm', type: 'button', onclick: () => run('LAYMCUR') }, h('span', { class: 'ico', html: icon('laymcur') }), 'Make Current'), h('button', { class: 'sm', type: 'button', onclick: () => run('LAYMRG') }, h('span', { class: 'ico', html: icon('matchlayer') }), 'Match Layer'));
    return h('div', { class: 'col', style: { gap: '2px' } }, face, tools, row2);
  };
  const layerCss = (l) => (typeof l.color === 'string' ? l.color : aciCss(l.color));
  const propsCombos = () => {
    const d = app.doc, sel = app.cmd.sel;
    const common = (k, def) => { if (!sel.length) return def; const vals = new Set(sel.map((e) => e[k] ?? (k === 'color' ? 256 : k === 'lw' ? -1 : 'BYLAYER'))); return vals.size === 1 ? [...vals][0] : '*varies*'; };
    const apply = (k, v) => {
      if (sel.length) { d.begin('PROPERTIES'); for (const e of sel) d.mod(e, (x) => (x[k] = v)); d.end(); app.view.redraw(); }
      else d.setvar({ color: 'CECOLOR', ltype: 'CELTYPE', lw: 'CELWEIGHT' }[k], v);
      app.ui.refresh();
    };
    const cv = common('color', d.vars.CECOLOR);
    const colSel = h('select', { class: 'rcombo', title: 'Object Color', onchange: async () => { let v = colSel.value; if (v === 'more') { const c = await app.ui.dlg.color(typeof cv === 'number' ? cv : 256); if (c == null) return app.ui.refresh(); v = c; } apply('color', +v); } },
      cv === '*varies*' ? h('option', { value: '', selected: true }, '*VARIES*') : '', [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: cv === c }, (c > 0 && c < 256 ? '■ ' : '') + colorName(c))), typeof cv === 'number' && ![256, 0, 1, 2, 3, 4, 5, 6, 7].includes(cv) ? h('option', { value: cv, selected: true }, colorName(cv)) : '', h('option', { value: 'more' }, 'More Colors...'));
    const lv = common('ltype', d.vars.CELTYPE);
    const ltSel = h('select', { class: 'rcombo', title: 'Linetype', onchange: async () => { let v = ltSel.value; if (v === 'other') { v = await app.ui.dlg.pickLinetype(); if (!v) return app.ui.refresh(); } apply('ltype', v); } },
      lv === '*varies*' ? h('option', { value: '', selected: true }, '*VARIES*') : '', ['BYLAYER', 'BYBLOCK', ...Object.keys(d.ltypes)].map((n) => h('option', { value: n, selected: String(lv).toUpperCase() === n }, n === 'BYLAYER' ? 'ByLayer' : n === 'BYBLOCK' ? 'ByBlock' : n)), h('option', { value: 'other' }, 'Other...'));
    const wv = common('lw', d.vars.CELWEIGHT);
    const lwSel = h('select', { class: 'rcombo', title: 'Lineweight', onchange: () => apply('lw', +lwSel.value) }, wv === '*varies*' ? h('option', { value: '', selected: true }, '*VARIES*') : '', LWEIGHTS.map((w) => h('option', { value: w, selected: wv === w }, lwName(w))));
    return h('div', { class: 'col', style: { gap: '2px' } }, colSel, lwSel, ltSel);
  };
  const hatchPat = () => {
    const o = app.cmd.hatchOpts;
    const g = h('div', { class: 'hpat' });
    for (const p of Object.keys(HATCHES)) {
      const cv = h('canvas');
      g.append(h('button', { type: 'button', class: p === o.pattern ? 'on' : '', title: p, onclick: () => { o.pattern = p; app.view.redrawOverlay(); rb.render(); } }, cv));
      requestAnimationFrame(() => hatchSwatch(cv, p, app.doc));
    }
    return g;
  };
  const hatchProps = () => {
    const o = app.cmd.hatchOpts;
    const sc = h('input', { class: 'rnum', type: 'number', step: 'any', value: o.scale, onchange: () => { o.scale = +sc.value || 1; app.view.redrawOverlay(); } });
    const an = h('input', { class: 'rnum', type: 'number', step: 'any', value: o.angle, onchange: () => { o.angle = +an.value || 0; app.view.redrawOverlay(); } });
    const col = h('button', { class: 'rcombo', type: 'button', text: colorName(o.color ?? 256), onclick: async () => { const c = await app.ui.dlg.color(o.color ?? 256); if (c != null) { o.color = c; rb.render(); } } });
    return h('div', { class: 'col', style: { gap: '3px' } }, h('label', { class: 'rlbl' }, 'Hatch Color', col), h('label', { class: 'rlbl' }, 'Angle', an), h('label', { class: 'rlbl' }, 'Scale', sc));
  };

  rb.render = () => {
    closeDrop();
    tabsEl.innerHTML = ''; panels.innerHTML = '';
    const tabs = [...TABS];
    if (app.doc.active !== 'Model' && !app.doc.blockEdit) tabs.splice(1, 0, LAYOUT_TAB);
    if (rb.ctx.has('bedit')) tabs.push(BEDIT_TAB);
    if (rb.ctx.has('hatch')) tabs.push(HATCH_TAB);
    if (!tabs.find((t) => t.id === rb.active)) rb.active = 'home';
    for (const t of tabs) tabsEl.append(h('div', { class: 'rt' + (t.id === rb.active ? ' on' : '') + (t.ctx ? ' ctx' : ''), text: t.name, onclick: () => { if (rb.active === t.id && !t.ctx) { root.classList.toggle('min'); return; } root.classList.remove('min'); rb.active = t.id; rb.render(); } }));
    tabsEl.append(h('span', { class: 'rmin', title: 'Minimizar cinta', text: '▭', onclick: () => root.classList.toggle('min') }));
    const tab = tabs.find((t) => t.id === rb.active);
    for (const p of tab.panels) {
      const body = h('div', { class: 'rp-body' });
      for (const it of p.items) {
        if (it.big !== undefined) body.append(bigBtn(it));
        else if (it.col) body.append(h('div', { class: 'col' }, it.col.map(smBtn)));
        else if (it.combo === 'layer') body.append(layerCombo());
        else if (it.combo === 'props') body.append(propsCombos());
        else if (it.toggle) body.append(toggleBtn(it));
        else if (it.custom === 'hpat') body.append(hatchPat());
        else if (it.custom === 'hprops') body.append(hatchProps());
      }
      panels.append(h('div', { class: 'rp' }, body, h('div', { class: 'rp-label', text: p.name })));
    }
  };
  rb.showContext = (id) => { rb.ctx.add(id); rb.active = id; root.classList.remove('min'); rb.render(); };
  rb.hideContext = (id) => { rb.ctx.delete(id); if (rb.active === id) rb.active = 'home'; rb.render(); };
  rb.refreshCombos = () => { if (['home'].includes(rb.active) || rb.ctx.size) rb.render(); };
  return rb;
}
