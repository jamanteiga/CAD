// Cinta de opciones (Ribbon) estilo AutoCAD 2023
import { h } from './dom.js';
import { icon } from './icons.js';
import { aciCss, colorName, lwName, LWEIGHTS, HATCHES } from '../core/tables.js';
import { hatchSwatch } from './thumb.js';
import { saveSettings } from '../app.js';
import { dispCmd } from '../core/i18n.js';

const B = (cmd, label, ic, dd) => ({ big: cmd, label, icon: ic, dd });
const S = (cmd, label, ic, dd) => ({ cmd, label, icon: ic, dd });
const COL = (...items) => ({ col: items });

export const TABS = [
  { id: 'home', name: 'Principal', panels: [
    { name: 'Dibujo', items: [B('LINE', 'Línea', 'line'), B('PLINE', 'Polilínea', 'pline'),
      B('CIRCLE', 'Círculo', 'circle', [S('^C^CCIRCLE', 'Centro, radio', 'circle'), S('^C^CCIRCLE \\_D', 'Centro, diámetro', 'circle'), S('^C^CCIRCLE _2P', '2 puntos', 'circle3p'), S('^C^CCIRCLE _3P', '3 puntos', 'circle3p'), S('^C^CCIRCLE _TTR', 'Tan, tan, radio', 'ttr')]),
      B('ARC', 'Arco', 'arc', [S('^C^CARC', '3 puntos', 'arc'), S('^C^CARC \\_C', 'Inicio, centro, fin', 'arc'), S('^C^CARC \\_E', 'Inicio, fin, centro', 'arc'), S('^C^CARC \\_E \\_R', 'Inicio, fin, radio', 'arc'), S('^C^CARC _C', 'Centro, inicio, fin', 'arc')]),
      COL(S('RECTANG', 'Rectángulo', 'rect', [S('RECTANG', 'Rectángulo', 'rect'), S('POLYGON', 'Polígono', 'polygon')]), S('HATCH', 'Sombreado', 'hatch', [S('HATCH', 'Sombreado', 'hatch'), S('GRADIENT', 'Degradado', 'gradient'), S('BOUNDARY', 'Contorno', 'boundary')]), S('ELLIPSE', 'Elipse', 'ellipse', [S('ELLIPSE', 'Eje, fin', 'ellipse'), S('^C^CELLIPSE _C', 'Centro', 'ellipse'), S('^C^CELLIPSE _A', 'Arco elíptico', 'ellipse')])),
      COL(S('SPLINE', 'Spline', 'spline'), S('XLINE', 'Línea auxiliar', 'xline', [S('XLINE', 'Línea auxiliar', 'xline'), S('RAY', 'Rayo', 'ray')]), S('POINT', 'Punto', 'point', [S('POINT', 'Punto múltiple', 'point'), S('DIVIDE', 'Dividir', 'divide'), S('MEASURE', 'Medir', 'divide'), S('DONUT', 'Arandela', 'donut'), S('REVCLOUD', 'Nube de revisión', 'revcloud'), S('WIPEOUT', 'Cobertura', 'wipeout')]))] },
    { name: 'Modificar', items: [COL(S('MOVE', 'Desplazar', 'move'), S('COPY', 'Copiar', 'copy'), S('STRETCH', 'Estirar', 'stretch')), COL(S('ROTATE', 'Girar', 'rotate'), S('MIRROR', 'Simetría', 'mirror'), S('SCALE', 'Escala', 'scale')),
      COL(S('TRIM', 'Recortar', 'trim', [S('TRIM', 'Recortar', 'trim'), S('EXTEND', 'Alargar', 'extend')]), S('FILLET', 'Empalme', 'fillet', [S('FILLET', 'Empalme', 'fillet'), S('CHAMFER', 'Chaflán', 'chamfer')]), S('ARRAY', 'Matriz', 'array', [S('ARRAYRECT', 'Matriz rectangular', 'array'), S('ARRAYPATH', 'Matriz de camino', 'array'), S('ARRAYPOLAR', 'Matriz polar', 'arraypolar')])),
      COL(S('ERASE', 'Borrar', 'erase'), S('EXPLODE', 'Descomponer', 'explode'), S('OFFSET', 'Desfase', 'offset')), COL(S('BREAK', 'Partir', 'break', [S('BREAK', 'Partir', 'break'), S('BREAKATPOINT', 'Partir en punto', 'break')]), S('JOIN', 'Juntar', 'join'), S('PEDIT', 'Editar polilínea', 'pedit', [S('PEDIT', 'Editar polilínea', 'pedit'), S('LENGTHEN', 'Longitud', 'lengthen'), S('ALIGN', 'Alinear', 'align'), S('DRAWORDER', 'Ordenar objetos', 'draworder')]))] },
    { name: 'Anotación', items: [B('MTEXT', 'Texto', 'text', [S('MTEXT', 'Texto de líneas múltiples', 'mtext'), S('TEXT', 'Una línea', 'text')]), B('DIMLINEAR', 'Cota', 'dimlinear'),
      COL(S('DIMLINEAR', 'Lineal', 'dimlinear', [S('DIMLINEAR', 'Lineal', 'dimlinear'), S('DIMALIGNED', 'Alineada', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular'), S('DIMRADIUS', 'Radio', 'dimradius'), S('DIMDIAMETER', 'Diámetro', 'dimdiameter'), S('DIMORDINATE', 'Por coordenadas', 'dimordinate')]), S('MLEADER', 'Directriz', 'leader', [S('MLEADER', 'Directriz múltiple', 'leader'), S('QLEADER', 'Directriz rápida', 'leader')]), S('DIMSTYLE', 'Estilo de cota', 'dimstyle'))] },
    { name: 'Capas', items: [B('LAYER', 'Propiedades de capa', 'layers'), { combo: 'layer' }] },
    { name: 'Bloque', items: [B('INSERT', 'Insertar', 'insert'), COL(S('BLOCK', 'Crear', 'block'), S('BEDIT', 'Editar', 'bedit'), S('EATTEDIT', 'Editar atributos', 'attedit'))] },
    { name: 'Propiedades', items: [B('MATCHPROP', 'Igualar propiedades', 'matchprop'), { combo: 'props' }] },
    { name: 'Utilidades', items: [B('DIST', 'Medir', 'measure', [S('DIST', 'Distancia', 'dist'), S('AREA', 'Área', 'area'), S('ID', 'Punto ID', 'id'), S('LIST', 'Lista', 'list')]), COL(S('QSELECT', 'Selección rápida', 'qselect'), S('SELECTSIMILAR', 'Seleccionar similares', 'qselect'), S('FIND', 'Buscar', 'find'))] },
    { name: 'Grupos', items: [B('GROUP', 'Grupo', 'group'), COL(S('UNGROUP', 'Desagrupar', 'ungroup'), S('GROUPEDIT', 'Editar grupo', 'groupedit'))] },
    { name: 'Portapapeles', items: [B('PASTECLIP', 'Pegar', 'paste', [S('PASTECLIP', 'Pegar', 'paste'), S('PASTEBLOCK', 'Pegar como bloque', 'paste'), S('PASTEORIG', 'Pegar en coordenadas originales', 'paste')]), COL(S('COPYCLIP', 'Copiar en portapapeles', 'copyclip'), S('CUTCLIP', 'Cortar', 'cutclip'), S('COPYBASE', 'Copiar con punto base', 'copyclip'))] },
    { name: 'Vista', items: [COL(S('ZOOM _E', 'Extensión', 'zoomext'), S('ZOOM _W', 'Ventana', 'zoomwin'), S('PAN', 'Encuadre', 'pan'))] },
  ] },
  { id: 'insert', name: 'Bloques', panels: [
    { name: 'Bloque', items: [B('INSERT', 'Insertar', 'insert'), B('EATTEDIT', 'Editar atributo', 'attedit')] },
    { name: 'Definición de bloque', items: [B('BLOCK', 'Crear bloque', 'block'), B('ATTDEF', 'Definir atributos', 'attdef'), B('ATTSYNC', 'Sincronizar', 'attsync'), B('BEDIT', 'Editor de bloques', 'bedit')] },
    { name: 'Referencia', items: [B('XATTACH', 'Enlazar', 'xref'), B('XREF', 'Referencias externas', 'xref'), B('WBLOCK', 'Bloque a disco', 'save')] },
    { name: 'Biblioteca', items: [B('BIBLIOTECA', 'Biblioteca de bloques', 'library')] },
    { name: 'Datos', items: [B('TABLE', 'Tabla', 'table'), COL(S('FIELD', 'Campo', 'field'), S('UPDATEFIELD', 'Actualizar campos', 'regen'), S('DATAEXTRACTION', 'Extracción de datos', 'dataext'))] },
    { name: 'Importar', items: [B('DXFIN', 'Importar DXF/DWG', 'dxf')] },
  ] },
  { id: 'annotate', name: 'Anotación', panels: [
    { name: 'Texto', items: [B('MTEXT', 'Texto de líneas múltiples', 'mtext'), COL(S('TEXT', 'Una línea', 'text'), S('STYLE', 'Estilo de texto', 'text'), S('FIND', 'Buscar texto', 'find'))] },
    { name: 'Cotas', items: [B('DIMLINEAR', 'Cota', 'dimlinear'), COL(S('DIMLINEAR', 'Lineal', 'dimlinear'), S('DIMALIGNED', 'Alineada', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular')), COL(S('DIMRADIUS', 'Radio', 'dimradius'), S('DIMDIAMETER', 'Diámetro', 'dimdiameter'), S('DIMORDINATE', 'Por coordenadas', 'dimordinate')), COL(S('DIMCONTINUE', 'Continua', 'dimcontinue'), S('DIMBASELINE', 'Línea base', 'dimbaseline'), S('DIMTEDIT', 'Editar texto', 'dimstyle')), B('DIMSTYLE', 'Estilo de cota', 'dimstyle')] },
    { name: 'Tablas', items: [B('TABLE', 'Tabla', 'table'), COL(S('TABLEDIT', 'Editar tabla', 'tableedit'), S('TABLEEXPORT', 'Exportar tabla', 'tableexport'))] },
    { name: 'Directrices', items: [B('MLEADER', 'Directriz múltiple', 'leader'), B('QLEADER', 'Directriz', 'leader')] },
    { name: 'Revisión', items: [B('REVCLOUD', 'Nube de revisión', 'revcloud'), B('WIPEOUT', 'Cobertura', 'wipeout')] },
  ] },
  { id: 'view', name: 'Vista', panels: [
    { name: 'Herramientas de ventana', items: [{ toggle: 'ucsIcon', label: 'Icono SCP', icon: 'ucs' }] },
    { name: 'Navegar', items: [B('ZOOM _E', 'Extensión', 'zoomext'), B('ZOOM _W', 'Ventana', 'zoomwin'), B('ZOOM _P', 'Previo', 'zoomext'), B('PAN', 'Encuadre', 'pan')] },
    { name: 'Vistas guardadas', items: [B('VIEW', 'Administrador de vistas', 'view'), B('REGEN', 'Regenerar', 'regen')] },
    { name: 'Paletas', items: [B('PROPERTIES', 'Propiedades', 'properties'), B('LAYER', 'Capas', 'layers'), B('VLISP', 'Visual LISP', 'vlisp'), B('TEXTSCR', 'Historial de comandos', 'cmdline')] },
    { name: 'Interfaz', items: [{ toggle: 'fileTabs', label: 'Fichas de archivo', icon: 'filetabs' }, { toggle: 'layoutTabs', label: 'Fichas de presentación', icon: 'layout' }, { toggle: 'menuBar', label: 'Barra de menús clásica', icon: 'menubar' }, { toggle: 'screenMenu', label: 'Menú de pantalla clásico', icon: 'screenmenu' }, { toggle: 'theme', label: 'Tema', icon: 'theme' }] },
  ] },
  { id: 'manage', name: 'Configuración', panels: [
    { name: 'Dibujo', items: [B('NEW', 'Nuevo desde plantilla', 'template'), B('DWGPROPS', 'Propiedades del dibujo', 'dwgprops'), B('TITLEBLOCK', 'Cajetín', 'titleblk')] },
    { name: 'Personalización', items: [B('CUI', 'Interfaz de usuario', 'cui'), B('ALIASEDIT', 'Editar alias', 'aliases'), B('MENU', 'Cargar .MNU', 'menubar')] },
    { name: 'Aplicaciones', items: [B('APPLOAD', 'Cargar aplicación', 'appload'), B('SCRIPT', 'Ejecutar script', 'script'), B('VLISP', 'Editor de Visual LISP', 'vlisp')] },
    { name: 'Limpiar', items: [B('PURGE', 'Limpiar', 'purge'), COL(S('OVERKILL', 'Suprimir duplicados', 'overkill'), S('AUDIT', 'Auditar', 'audit'), S('SETVAR ?', 'Variables de sistema', 'setvar'))] },
    { name: 'Parámetros', items: [COL(S('UNITS', 'Unidades', 'units'), S('DSETTINGS', 'Parámetros de dibujo', 'options'), S('OPTIONS', 'Opciones', 'options')), COL(S('LINETYPE', 'Tipos de línea', 'line'), S('LWEIGHT', 'Grosores de línea', 'line'), S('DDPTYPE', 'Estilo de punto', 'point'))] },
  ] },
  { id: 'output', name: 'Impresión', panels: [
    { name: 'Trazar', items: [B('PLOT', 'Trazar', 'plot'), B('PAGESETUP', 'Configurar página', 'layout'), B('PUBLISH', 'Publicar', 'publish'), B('STYLESMANAGER', 'Estilos de trazado', 'styles')] },
    { name: 'Exportar', items: [B('EXPORTPDF', 'Exportar PDF', 'pdf'), B('SVGOUT', 'SVG', 'svg'), B('PNGOUT', 'Imagen', 'png'), B('DXFOUT', 'DXF', 'dxf')] },
  ] },
  { id: 'param', name: 'Restricciones', panels: [
    { name: 'Geométricas', items: [B('AUTOCONSTRAIN', 'Restricción automática', 'cAuto'),
      COL(S('GEOMCONSTRAINT _Coincident', 'Coincidente', 'cCoin'), S('GEOMCONSTRAINT _COLlinear', 'Colineal', 'cColl'), S('GEOMCONSTRAINT _CONcentric', 'Concéntrica', 'cConc')),
      COL(S('GEOMCONSTRAINT _Fix', 'Fija', 'cFix'), S('GEOMCONSTRAINT _Parallel', 'Paralela', 'cPar'), S('GEOMCONSTRAINT _Perpendicular', 'Perpendicular', 'cPerp')),
      COL(S('GEOMCONSTRAINT _Horizontal', 'Horizontal', 'cHoriz'), S('GEOMCONSTRAINT _Vertical', 'Vertical', 'cVert'), S('GEOMCONSTRAINT _Tangent', 'Tangente', 'cTan')),
      COL(S('GEOMCONSTRAINT _Equal', 'Igual', 'cEq'), S('CONSTRAINTBAR', 'Barras de restricción', 'cBar'))] },
    { name: 'Por cota', items: [B('DIMCONSTRAINT _LInear', 'Lineal', 'cDim'),
      COL(S('DIMCONSTRAINT _Horizontal', 'Horizontal', 'dimlinear'), S('DIMCONSTRAINT _Vertical', 'Vertical', 'dimlinear'), S('DIMCONSTRAINT _Aligned', 'Alineada', 'dimaligned')),
      COL(S('DIMCONSTRAINT _Radius', 'Radio', 'dimradius'), S('DIMCONSTRAINT _Diameter', 'Diámetro', 'dimdiameter'), S('DIMCONSTRAINT _ANgular', 'Angular', 'dimangular')),
      COL(S('DCDISPLAY', 'Mostrar/ocultar', 'cBar'))] },
    { name: 'Administrar', items: [B('DELCONSTRAINT', 'Suprimir restricciones', 'cDel'), B('PARAMETERS', 'Administrador de parámetros', 'params')] },
  ] },
  { id: 'mep', name: 'Instalaciones', panels: [
    { name: 'Conductos', items: [B('DUCT', 'Conducto', 'duct'), B('DUCTSIZE', 'Dimensionar', 'ductsize'), B('DUCTCALC', 'Pérdida de carga', 'ductcalc')] },
    { name: 'Tuberías', items: [B('PIPE', 'Tubería', 'pipe')] },
    { name: 'Biblioteca', items: [B('BIBLIOTECA', 'Biblioteca de bloques', 'library')] },
    { name: 'Isométrico', items: [B('ISODRAFT', 'Dibujo isométrico', 'iso'), COL(S('ISOPLANE', 'Plano isométrico', 'isoplane'), S('ISOCIRCLE', 'Círculo isométrico', 'isocircle'))] },
    { name: 'Mediciones', items: [B('DATAEXTRACTION', 'Extracción de datos', 'dataext'), B('TITLEBLOCK', 'Cajetín', 'titleblk')] },
  ] },
  { id: 'collab', name: 'Nube', panels: [
    { name: 'Nube', items: [B('CLOUD', 'Configurar nube', 'cloud'), B('CLOUDSAVE', 'Guardar en la nube', 'cloudsave'), B('CLOUDOPEN', 'Abrir de la nube', 'cloudopen'), B('CLOUDVERSIONS', 'Versiones', 'versions')] },
    { name: 'Revisión', items: [B('MARKUP', 'Marca de revisión', 'markup'), B('MARKUPS', 'Marcas', 'markups'), B('REVCLOUD', 'Nube de revisión', 'revcloud')] },
  ] },
  { id: 'express', name: 'Utilidades', panels: [
    { name: 'Bloques', items: [B('EXPLODE', 'Descomponer atributos', 'explode'), B('COUNT', 'Contar', 'count')] },
    { name: 'Capas', items: [COL(S('LAYISO', 'Aislar', 'layiso'), S('LAYUNISO', 'Desaislar', 'layiso'), S('LAYOFF', 'Desactivar', 'layoff')), COL(S('LAYFRZ', 'Inutilizar', 'layfrz'), S('LAYTHW', 'Reutilizar todas', 'layfrz'), S('LAYON', 'Activar todas', 'layoff')), COL(S('LAYMRG', 'Fusionar', 'layers'), S('LAYDEL', 'Suprimir', 'purge'), S('LAYCUR', 'Cambiar a actual', 'laymcur'))] },
    { name: 'Modificar', items: [COL(S('ISOLATEOBJECTS', 'Aislar objetos', 'isolate'), S('HIDEOBJECTS', 'Ocultar objetos', 'isolate'), S('UNISOLATEOBJECTS', 'Terminar aislamiento', 'isolate'))] },
    { name: 'Herramientas', items: [B('ALIASEDIT', 'Alias de comandos', 'aliases'), B('SETVAR ?', 'Variables de sistema', 'setvar'), B('CAL', 'Calculadora', 'units')] },
  ] },
];
const LAYOUT_TAB = { id: 'layout', name: 'Lámina', panels: [
  { name: 'Presentación', items: [B('LAYOUT _N', 'Nueva', 'layout'), B('PAGESETUP', 'Configurar página', 'plot')] },
  { name: 'Ventanas de presentación', items: [B('MVIEW', 'Rectangular', 'mview'), COL(S('MSPACE', 'Espacio modelo', 'mspace'), S('PSPACE', 'Espacio papel', 'layout'), S('MVIEW _LOCK', 'Bloquear', 'laylck'))] },
] };
const BEDIT_TAB = { id: 'bedit', name: 'Editor de bloques', ctx: true, panels: [
  { name: 'Abrir/Guardar', items: [B('BSAVE', 'Guardar bloque', 'bsave'), B('BEDIT', 'Editar bloque', 'bedit')] },
  { name: 'Geometría', items: [COL(S('LINE', 'Línea', 'line'), S('CIRCLE', 'Círculo', 'circle'), S('PLINE', 'Polilínea', 'pline')), COL(S('ATTDEF', 'Definición de atributo', 'attdef'), S('BASE', 'Punto base', 'id'))] },
  { name: 'Parámetros', items: [B('^C^CBPARAMETER _L', 'Lineal', 'bparamlin'), B('^C^CBPARAMETER _R', 'Rotación', 'bparamrot'), B('^C^CBPARAMETER _F', 'Simetría', 'bparamflip'), B('^C^CBPARAMETER _V', 'Visibilidad', 'bparamvis')] },
  { name: 'Acciones', items: [B('BACTION', 'Acción', 'baction'), B('BPARAMDEL', 'Suprimir parámetro', 'close')] },
  { name: 'Visibilidad', items: [B('BVSTATE', 'Estados de visibilidad', 'bvstate'), COL(S('BVHIDE', 'Hacer invisible', 'bvhide'), S('BVSHOW', 'Hacer visible', 'bvshow'))] },
  { name: 'Cerrar', items: [B('BCLOSE', 'Cerrar Editor de bloques', 'bclose')] },
] };
const HATCH_TAB = { id: 'hatch', name: 'Sombreado', ctx: true, panels: [
  { name: 'Contornos', items: [B('', 'Designar puntos', 'boundary', null, 'pick'), B('>_S', 'Designar', 'qselect')] },
  { name: 'Patrón', items: [{ custom: 'hpat' }] },
  { name: 'Propiedades', items: [{ custom: 'hprops' }] },
  { name: 'Cerrar', items: [B('', 'Cerrar Creación de sombreado', 'bclose')] },
] };

const TAB_ICON = { home: 'pline', insert: 'block', annotate: 'dimlinear', view: 'zoomext', manage: 'options', output: 'plot', param: 'cHoriz', mep: 'duct', collab: 'cloud', express: 'setvar', layout: 'layout', bedit: 'bedit', hatch: 'hatch' };

export function createRibbon(app) {
  const root = document.getElementById('ribbon'), tabsEl = document.getElementById('rtabs'), panels = document.getElementById('rpanels');
  const rb = { active: 'home', ctx: new Set() };
  if (window.innerWidth < 760) root.classList.add('min'); // en pantallas estrechas el panel arranca plegado
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
    const b = h('button', { class: 'big', type: 'button', title: it.label + (it.big ? ` (${dispCmd(it.big)})` : '') }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label), it.dd ? h('span', { html: icon('caret'), style: { width: '10px', height: '10px', marginTop: '1px' } }) : '');
    b.onclick = (e) => { if (it.dd && e.offsetY > b.clientHeight - 16) return showDrop(b, it.dd); if (it.big === '' && it.label.startsWith('Cerrar')) return app.cmd.submit(''); if (it.big === '' && it.label === 'Designar puntos') return; run(it.big); };
    if (it.dd) b.oncontextmenu = (e) => { e.preventDefault(); showDrop(b, it.dd); };
    return b;
  };
  const smBtn = (it) => {
    const lbl = it.label || it.dd?.[0]?.label || dispCmd(it.cmd);
    const b = h('button', { class: 'sm', type: 'button', title: lbl + ' (' + dispCmd(it.cmd) + ')' }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', { class: 'lbl', text: lbl }), it.dd ? h('span', { html: icon('caret'), style: { width: '9px', height: '9px' } }) : '');
    b.onclick = (e) => { if (it.dd && e.offsetX > b.clientWidth - 14) return showDrop(b, it.dd); run(it.cmd); };
    if (it.dd) b.oncontextmenu = (e) => { e.preventDefault(); showDrop(b, it.dd); };
    return b;
  };
  const toggleBtn = (it) => {
    const on = it.toggle === 'theme' ? app.settings.theme !== 'dark' : !!app.settings[it.toggle];
    const b = h('button', { class: 'big' + (on ? ' on' : ''), type: 'button', title: it.label }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label));
    b.onclick = () => { if (it.toggle === 'theme') return app.ui.setTheme({ dark: 'mid', mid: 'light', light: 'dark' }[app.settings.theme] || 'dark'); app.settings[it.toggle] = !app.settings[it.toggle]; saveSettings(); app.ui.applyLayout(); rb.render(); };
    return b;
  };
  // combos
  const layerCombo = () => {
    const d = app.doc;
    const sel = app.cmd.sel;
    const curName = sel.length ? (new Set(sel.map((e) => e.layer)).size === 1 ? sel[0].layer : '') : d.clayer;
    const L = d.layers[curName];
    const face = h('button', { class: 'rcombo', type: 'button', style: { display: 'flex', alignItems: 'center', gap: '4px', width: '100%', textAlign: 'left' } },
      L ? [h('span', { style: { width: '14px', height: '14px', display: 'inline-block' }, html: icon(L.on ? 'bulbOn' : 'bulbOff') }), h('span', { style: { width: '14px', height: '14px', display: 'inline-block' }, html: icon(L.frozen ? 'snow' : 'sun') }), h('span', { class: 'swatch', style: { background: layerCss(L) } }), h('span', { text: curName })] : h('span', { class: 'hint', text: sel.length ? '(varía)' : '' }), h('span', { style: { marginLeft: 'auto', width: '10px' }, html: icon('caret') }));
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
        } }, tog('on', 'Activar/Desactivar', 'bulbOn', 'bulbOff'), tog('frozen', 'Inutilizar', 'snow', 'sun'), tog('locked', 'Bloquear', 'lockOn', 'lockOff'), h('span', { class: 'swatch', style: { background: layerCss(l) } }), h('span', { text: l.name, style: { fontWeight: l.name === d.clayer ? 700 : 400 } })));
      }
      document.body.append(list); dropdown = list;
    };
    const tools = h('div', { class: 'row', style: { gap: '1px' } }, [['LAYOFF', 'layoff', 'Desactivar'], ['LAYISO', 'layiso', 'Aislar'], ['LAYFRZ', 'layfrz', 'Inutilizar'], ['LAYLCK', 'laylck', 'Bloquear'], ['LAYUNISO', 'layiso', 'Desaislar'], ['LAYON', 'layoff', 'Activar todas'], ['LAYTHW', 'layfrz', 'Reutilizar todas'], ['LAYULK', 'laylck', 'Desbloquear']].map(([c, i, t]) => h('button', { class: 'sm iconly', type: 'button', title: t, html: `<span class="ico">${icon(i)}</span>`, onclick: () => run(c) })));
    const row2 = h('div', { class: 'row', style: { gap: '2px' } }, h('button', { class: 'sm', type: 'button', onclick: () => run('LAYMCUR') }, h('span', { class: 'ico', html: icon('laymcur') }), 'Establecer como actual'), h('button', { class: 'sm', type: 'button', onclick: () => run('LAYMRG') }, h('span', { class: 'ico', html: icon('matchlayer') }), 'Igualar capa'));
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
    const colSel = h('select', { class: 'rcombo', title: 'Color de objeto', onchange: async () => { let v = colSel.value; if (v === 'more') { const c = await app.ui.dlg.color(typeof cv === 'number' ? cv : 256); if (c == null) return app.ui.refresh(); v = c; } apply('color', +v); } },
      cv === '*varies*' ? h('option', { value: '', selected: true }, '*VARÍA*') : '', [256, 0, 1, 2, 3, 4, 5, 6, 7].map((c) => h('option', { value: c, selected: cv === c }, (c > 0 && c < 256 ? '■ ' : '') + colorName(c))), typeof cv === 'number' && ![256, 0, 1, 2, 3, 4, 5, 6, 7].includes(cv) ? h('option', { value: cv, selected: true }, colorName(cv)) : '', h('option', { value: 'more' }, 'Más colores...'));
    const lv = common('ltype', d.vars.CELTYPE);
    const ltSel = h('select', { class: 'rcombo', title: 'Tipo de línea', onchange: async () => { let v = ltSel.value; if (v === 'other') { v = await app.ui.dlg.pickLinetype(); if (!v) return app.ui.refresh(); } apply('ltype', v); } },
      lv === '*varies*' ? h('option', { value: '', selected: true }, '*VARÍA*') : '', ['BYLAYER', 'BYBLOCK', ...Object.keys(d.ltypes)].map((n) => h('option', { value: n, selected: String(lv).toUpperCase() === n }, n === 'BYLAYER' ? 'PorCapa' : n === 'BYBLOCK' ? 'PorBloque' : n)), h('option', { value: 'other' }, 'Otro...'));
    const wv = common('lw', d.vars.CELWEIGHT);
    const lwSel = h('select', { class: 'rcombo', title: 'Grosor de línea', onchange: () => apply('lw', +lwSel.value) }, wv === '*varies*' ? h('option', { value: '', selected: true }, '*VARÍA*') : '', LWEIGHTS.map((w) => h('option', { value: w, selected: wv === w }, lwName(w))));
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
    return h('div', { class: 'col', style: { gap: '3px' } }, h('label', { class: 'rlbl' }, 'Color de sombreado', col), h('label', { class: 'rlbl' }, 'Ángulo', an), h('label', { class: 'rlbl' }, 'Escala', sc));
  };

  rb.render = () => {
    closeDrop();
    tabsEl.innerHTML = ''; panels.innerHTML = '';
    const tabs = [...TABS];
    if (app.doc.active !== 'Model' && !app.doc.blockEdit) tabs.splice(1, 0, LAYOUT_TAB);
    if (rb.ctx.has('bedit')) tabs.push(BEDIT_TAB);
    if (rb.ctx.has('hatch')) tabs.push(HATCH_TAB);
    if (!tabs.find((t) => t.id === rb.active)) rb.active = 'home';
    for (const t of tabs) tabsEl.append(h('div', { class: 'rt' + (t.id === rb.active ? ' on' : '') + (t.ctx ? ' ctx' : ''), title: t.name, onclick: () => { if (rb.active === t.id && !t.ctx) { root.classList.toggle('min'); rb.render(); app.view.resize(); app.view.redraw(); return; } const wasMin = root.classList.contains('min'); root.classList.remove('min'); if (wasMin) requestAnimationFrame(() => { app.view.resize(); app.view.redraw(); }); rb.active = t.id; rb.render(); } }, h('span', { class: 'ico', html: icon(TAB_ICON[t.id] || 'options') }), h('span', { text: t.name })));
    tabsEl.append(h('span', { class: 'rmin', title: 'Ocultar o mostrar el panel de herramientas', text: root.classList.contains('min') ? '»' : '«', onclick: () => { root.classList.toggle('min'); rb.render(); app.view.resize(); app.view.redraw(); } }));
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
export { LAYOUT_TAB, BEDIT_TAB, HATCH_TAB };
