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
  { id: 'home', name: 'Inicio', panels: [
    { name: 'Dibujo', more: [S('SPLINE', 'Spline', 'spline'), S('XLINE', 'Línea auxiliar', 'xline'), S('RAY', 'Rayo', 'ray'), S('POINT', 'Punto múltiple', 'point'), S('DIVIDE', 'Dividir', 'divide'), S('MEASURE', 'Medir', 'divide'), S('BOUNDARY', 'Contorno', 'boundary'), S('DONUT', 'Arandela', 'donut'), S('REVCLOUD', 'Nube de revisión', 'revcloud'), S('WIPEOUT', 'Cobertura', 'wipeout'), S('BREAKLINE', 'Símbolo de línea de rotura', 'breakline')], items: [B('LINE', 'Línea', 'line'), B('PLINE', 'Polilínea', 'pline'),
      B('CIRCLE', 'Círculo', 'circle', [S('^C^CCIRCLE', 'Centro, radio', 'circle'), S('^C^CCIRCLE \\_D', 'Centro, diámetro', 'circle'), S('^C^CCIRCLE _2P', '2 puntos', 'circle3p'), S('^C^CCIRCLE _3P', '3 puntos', 'circle3p'), S('^C^CCIRCLE _TTR', 'Tan, tan, radio', 'ttr')]),
      B('ARC', 'Arco', 'arc', [S('^C^CARC', '3 puntos', 'arc'), S('^C^CARC \\_C', 'Inicio, centro, fin', 'arc'), S('^C^CARC \\_E', 'Inicio, fin, centro', 'arc'), S('^C^CARC \\_E \\_R', 'Inicio, fin, radio', 'arc'), S('^C^CARC _C', 'Centro, inicio, fin', 'arc')]),
      COL(S('RECTANG', '', 'rect', [S('RECTANG', 'Rectángulo', 'rect'), S('POLYGON', 'Polígono', 'polygon')]), S('HATCH', '', 'hatch', [S('HATCH', 'Sombreado', 'hatch'), S('GRADIENT', 'Degradado', 'gradient'), S('BOUNDARY', 'Contorno', 'boundary')]), S('ELLIPSE', '', 'ellipse', [S('ELLIPSE', 'Eje, fin', 'ellipse'), S('^C^CELLIPSE _C', 'Centro', 'ellipse'), S('^C^CELLIPSE _A', 'Arco elíptico', 'ellipse')])),
      COL(S('SPLINE', '', 'spline'), S('XLINE', '', 'xline', [S('XLINE', 'Línea auxiliar', 'xline'), S('RAY', 'Rayo', 'ray')]), S('POINT', '', 'point', [S('POINT', 'Punto múltiple', 'point'), S('DIVIDE', 'Dividir', 'divide'), S('MEASURE', 'Medir', 'divide'), S('DONUT', 'Arandela', 'donut'), S('REVCLOUD', 'Nube de revisión', 'revcloud'), S('WIPEOUT', 'Cobertura', 'wipeout')]))] },
    { name: 'Modificar', more: [S('EXTEND', 'Alargar', 'extend'), S('CHAMFER', 'Chaflán', 'chamfer'), S('BREAKATPOINT', 'Partir en punto', 'break'), S('LENGTHEN', 'Longitud', 'lengthen'), S('ALIGN', 'Alinear', 'align'), S('DRAWORDER', 'Ordenar objetos', 'draworder'), S('ARRAYEDIT', 'Editar matriz', 'array'), S('OVERKILL', 'Suprimir duplicados', 'overkill')], items: [COL(S('MOVE', 'Desplazar', 'move'), S('COPY', 'Copiar', 'copy'), S('STRETCH', 'Estirar', 'stretch')), COL(S('ROTATE', 'Girar', 'rotate'), S('MIRROR', 'Simetría', 'mirror'), S('SCALE', 'Escala', 'scale')),
      COL(S('TRIM', 'Recortar', 'trim', [S('TRIM', 'Recortar', 'trim'), S('EXTEND', 'Alargar', 'extend')]), S('FILLET', 'Empalme', 'fillet', [S('FILLET', 'Empalme', 'fillet'), S('CHAMFER', 'Chaflán', 'chamfer')]), S('ARRAY', 'Matriz', 'array', [S('ARRAYRECT', 'Matriz rectangular', 'array'), S('ARRAYPATH', 'Matriz de camino', 'array'), S('ARRAYPOLAR', 'Matriz polar', 'arraypolar')])),
      COL(S('ERASE', '', 'erase'), S('EXPLODE', '', 'explode'), S('OFFSET', '', 'offset')), COL(S('BREAK', '', 'break', [S('BREAK', 'Partir', 'break'), S('BREAKATPOINT', 'Partir en punto', 'break')]), S('JOIN', '', 'join'), S('PEDIT', '', 'pedit', [S('PEDIT', 'Editar polilínea', 'pedit'), S('LENGTHEN', 'Longitud', 'lengthen'), S('ALIGN', 'Alinear', 'align'), S('DRAWORDER', 'Ordenar objetos', 'draworder')]))] },
    { name: 'Anotación', items: [B('MTEXT', 'Texto', 'text', [S('MTEXT', 'Texto de líneas múltiples', 'mtext'), S('TEXT', 'Una línea', 'text')]), B('DIMLINEAR', 'Cota', 'dimlinear'),
      COL(S('DIMLINEAR', 'Lineal', 'dimlinear', [S('DIMLINEAR', 'Lineal', 'dimlinear'), S('DIMALIGNED', 'Alineada', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular'), S('DIMRADIUS', 'Radio', 'dimradius'), S('DIMDIAMETER', 'Diámetro', 'dimdiameter'), S('DIMORDINATE', 'Por coordenadas', 'dimordinate')]), S('MLEADER', 'Directriz', 'leader', [S('MLEADER', 'Directriz múltiple', 'leader'), S('QLEADER', 'Directriz rápida', 'leader')]), S('DIMSTYLE', 'Estilo de cota', 'dimstyle'))] },
    { name: 'Capas', more: [S('LAYOFF', 'Desactivar', 'layoff'), S('LAYISO', 'Aislar', 'layiso'), S('LAYUNISO', 'Desaislar', 'layiso'), S('LAYFRZ', 'Inutilizar', 'layfrz'), S('LAYTHW', 'Reutilizar todas', 'layfrz'), S('LAYON', 'Activar todas', 'layoff'), S('LAYMRG', 'Fusionar', 'layers'), S('LAYDEL', 'Suprimir', 'purge'), S('LAYCUR', 'Cambiar a capa actual', 'laymcur')], items: [B('LAYER', 'Propiedades de capa', 'layers'), { combo: 'layer' }] },
    { name: 'Bloque', more: [S('ATTDEF', 'Definir atributos', 'attdef'), S('ATTSYNC', 'Sincronizar atributos', 'attsync'), S('WBLOCK', 'Bloque a disco', 'save'), S('BASE', 'Punto base', 'id')], items: [B('INSERT', 'Insertar', 'insert'), COL(S('BLOCK', 'Crear', 'block'), S('BEDIT', 'Editar', 'bedit'), S('EATTEDIT', 'Editar atributos', 'attedit'))] },
    { name: 'Propiedades', items: [B('MATCHPROP', 'Igualar propiedades', 'matchprop'), { combo: 'props' }] },
    { name: 'Utilidades', items: [B('DIST', 'Medir', 'measure', [S('DIST', 'Distancia', 'dist'), S('AREA', 'Área', 'area'), S('ID', 'Punto ID', 'id'), S('LIST', 'Lista', 'list')]), COL(S('QSELECT', 'Selección rápida', 'qselect'), S('SELECTSIMILAR', 'Seleccionar similares', 'qselect'), S('FIND', 'Buscar', 'find'))] },
    { name: 'Grupos', items: [B('GROUP', 'Grupo', 'group'), COL(S('UNGROUP', 'Desagrupar', 'ungroup'), S('GROUPEDIT', 'Editar grupo', 'groupedit'))] },
    { name: 'Portapapeles', items: [B('PASTECLIP', 'Pegar', 'paste', [S('PASTECLIP', 'Pegar', 'paste'), S('PASTEBLOCK', 'Pegar como bloque', 'paste'), S('PASTEORIG', 'Pegar en coordenadas originales', 'paste')]), COL(S('COPYCLIP', 'Copiar en portapapeles', 'copyclip'), S('CUTCLIP', 'Cortar', 'cutclip'), S('COPYBASE', 'Copiar con punto base', 'copyclip'))] },
    { name: 'Vista', items: [COL(S('ZOOM _E', 'Extensión', 'zoomext'), S('ZOOM _W', 'Ventana', 'zoomwin'), S('PAN', 'Encuadre', 'pan'))] },
  ] },
  { id: 'insert', name: 'Insertar', panels: [
    { name: 'Bloque', items: [B('INSERT', 'Insertar', 'insert', [S('INSERT', 'Bloques del dibujo...', 'insert'), S('BIBLIOTECA', 'Biblioteca de bloques...', 'library'), S('XATTACH', 'Desde archivo (referencia)...', 'xref')]), B('EATTEDIT', 'Editar atributo', 'attedit', [S('EATTEDIT', 'Atributo único', 'attedit'), S('ATTSYNC', 'Sincronizar', 'attsync')])] },
    { name: 'Definición de bloque', items: [B('BLOCK', 'Crear bloque', 'block'), B('ATTDEF', 'Definir atributos', 'attdef'), B('ATTSYNC', 'Gestionar atributos', 'attsync'), B('BEDIT', 'Editor de bloques', 'bedit')] },
    { name: 'Referencia', items: [B('XATTACH', 'Enlazar', 'xref'), B('XREF', 'Referencias externas', 'xref'), COL(S('WBLOCK', 'Bloque a disco', 'save'), S('BIBLIOTECA', 'Biblioteca de bloques', 'library'))] },
    { name: 'Importar', items: [B('DXFIN', 'Importar DXF/DWG', 'dxf'), COL(S('SHXLOAD', 'Cargar fuente SHX', 'text'), S('PASTEORIG', 'Pegar en coordenadas originales', 'paste'))] },
    { name: 'Datos', items: [B('FIELD', 'Campo', 'field'), COL(S('UPDATEFIELD', 'Actualizar campos', 'regen'), S('TABLE', 'Tabla', 'table'), S('DWGPROPS', 'Propiedades del dibujo', 'dwgprops'))] },
    { name: 'Vinculación y extracción', items: [B('DATAEXTRACTION', 'Extraer datos', 'dataext'), COL(S('TABLEEXPORT', 'Exportar tabla', 'tableexport'), S('ATTOUT', 'Exportar atributos', 'attout'), S('ATTIN', 'Importar atributos', 'attin'))] },
  ] },
  { id: 'annotate', name: 'Anotar', panels: [
    { name: 'Texto', more: [S('TEXT', 'Texto de una línea', 'text'), S('DDEDIT', 'Editar texto', 'text'), S('TXT2MTXT', 'Convertir a texto de líneas múltiples', 'txt2mtxt'), S('TCOUNT', 'Numeración automática', 'tcount'), S('TCIRCLE', 'Encerrar en objeto', 'tcircle')], items: [B('MTEXT', 'Texto de líneas múltiples', 'mtext', [S('MTEXT', 'Texto de líneas múltiples', 'mtext'), S('TEXT', 'Texto de una línea', 'text')]), { combo: 'textstyle' }] },
    { name: 'Cotas', more: [S('DIMCONTINUE', 'Continua', 'dimcontinue'), S('DIMBASELINE', 'Línea base', 'dimbaseline'), S('DIMTEDIT', 'Editar texto de cota', 'dimlinear'), S('DIMSTYLE', 'Administrador de estilos de cota', 'dimstyle')], items: [B('DIMLINEAR', 'Cota', 'dimlinear'), { combo: 'dimstyle' }] },
    { name: 'Líneas de centro', items: [B('CENTERMARK', 'Marca de centro', 'centermark'), B('CENTERLINE', 'Línea de centro', 'centerline')] },
    { name: 'Directrices', items: [B('MLEADER', 'Directriz múltiple', 'leader'), COL(S('QLEADER', 'Directriz rápida', 'leader'), S('DIMTEDIT', 'Editar texto de cota', 'dimlinear'))] },
    { name: 'Tablas', items: [B('TABLE', 'Tabla', 'table'), COL(S('TABLEDIT', 'Editar tabla', 'tableedit'), S('DATAEXTRACTION', 'Extraer datos', 'dataext'), S('TABLEEXPORT', 'Exportar tabla', 'tableexport'))] },
    { name: 'Marca de revisión', items: [B('WIPEOUT', 'Cobertura', 'wipeout'), B('REVCLOUD', 'Nube de revisión', 'revcloud')] },
  ] },
  { id: 'param', name: 'Paramétrico', panels: [
    { name: 'Geométricas', items: [B('AUTOCONSTRAIN', 'Restricción automática', 'cAuto'),
      COL(S('GEOMCONSTRAINT _Coincident', '', 'cCoin'), S('GEOMCONSTRAINT _COLlinear', '', 'cColl'), S('GEOMCONSTRAINT _CONcentric', '', 'cConc')),
      COL(S('GEOMCONSTRAINT _Fix', '', 'cFix'), S('GEOMCONSTRAINT _Parallel', '', 'cPar'), S('GEOMCONSTRAINT _Perpendicular', '', 'cPerp')),
      COL(S('GEOMCONSTRAINT _Horizontal', '', 'cHoriz'), S('GEOMCONSTRAINT _Vertical', '', 'cVert'), S('GEOMCONSTRAINT _Tangent', '', 'cTan')),
      COL(S('GEOMCONSTRAINT _Equal', '', 'cEq')),
      COL(S('CONSTRAINTBAR', 'Mostrar/ocultar', 'cBar'), S('CONSTRAINTBAR _S', 'Mostrar todas', 'cBar'), S('CONSTRAINTBAR _H', 'Ocultar todas', 'cBar'))] },
    { name: 'Por cota', items: [B('DIMCONSTRAINT _LInear', 'Lineal', 'cDim', [S('DIMCONSTRAINT _LInear', 'Lineal', 'cDim'), S('DIMCONSTRAINT _Horizontal', 'Horizontal', 'dimlinear'), S('DIMCONSTRAINT _Vertical', 'Vertical', 'dimlinear')]), B('DIMCONSTRAINT _Aligned', 'Alineada', 'dimaligned'),
      COL(S('DIMCONSTRAINT _Radius', '', 'dimradius'), S('DIMCONSTRAINT _Diameter', '', 'dimdiameter'), S('DIMCONSTRAINT _ANgular', '', 'dimangular')),
      COL(S('DCDISPLAY', 'Mostrar/ocultar', 'cBar'), S('DCDISPLAY _S', 'Mostrar todas', 'cBar'), S('DCDISPLAY _H', 'Ocultar todas', 'cBar'))] },
    { name: 'Administrar', items: [B('DELCONSTRAINT', 'Suprimir restricciones', 'cDel'), B('PARAMETERS', 'Administrador de parámetros', 'params')] },
  ] },
  { id: 'view', name: 'Vista', panels: [
    { name: 'Herramientas de ventana gráfica', items: [{ toggle: 'ucsIcon', label: 'Icono SCP', icon: 'ucs' }, B('ZOOM _E', 'Zoom extensión', 'zoomext', [S('ZOOM _E', 'Extensión', 'zoomext'), S('ZOOM _W', 'Ventana', 'zoomwin'), S('ZOOM _P', 'Previo', 'zoomext'), S('ZOOM _A', 'Todo', 'zoomext'), S('PAN', 'Encuadre', 'pan')])] },
    { name: 'Vistas guardadas', items: [{ combo: 'views' }] },
    { name: 'Ventanas gráficas del modelo', items: [B('MVIEW', 'Configuración de ventana gráfica', 'mview'), COL(S('REGEN', 'Regenerar', 'regen'), S('REDRAW', 'Redibujar', 'regen'))] },
    { name: 'Paletas', items: [B('BIBLIOTECA', 'Paletas de herramientas', 'library'), B('PROPERTIES', 'Propiedades', 'properties'), B('INSERT', 'Bloques', 'insert'), B('COUNT', 'Contar', 'count'), COL(S('LAYER', 'Capas', 'layers'), S('VLISP', 'Visual LISP', 'vlisp'), S('TEXTSCR', 'Historial de comandos', 'cmdline'))] },
    { name: 'Interfaz', items: [{ toggle: 'fileTabs', label: 'Fichas de archivo', icon: 'filetabs' }, { toggle: 'layoutTabs', label: 'Fichas de presentación', icon: 'layout' }, COL({ toggle: 'menuBar', label: 'Barra de menús clásica', icon: 'menubar', small: true }, { toggle: 'screenMenu', label: 'Menú de pantalla clásico', icon: 'screenmenu', small: true }, { toggle: 'theme', label: 'Tema', icon: 'theme', small: true })] },
  ] },
  { id: 'manage', name: 'Administrar', panels: [
    { name: 'Personalización', items: [B('CUI', 'Interfaz de usuario', 'cui'), B('BIBLIOTECA', 'Paletas de herramientas', 'library'), COL(S('MENU', 'Importar menú .MNU', 'menubar'), S('ALIASEDIT', 'Editar alias', 'aliases'))] },
    { name: 'Aplicaciones', items: [B('APPLOAD', 'Cargar aplicación', 'appload'), B('SCRIPT', 'Ejecutar script', 'script'), COL(S('VLISP', 'Editor de Visual LISP', 'vlisp'), S('LOAD', 'Cargar formas', 'appload'))] },
    { name: 'Limpieza', items: [B('PURGE', 'Limpiar', 'purge'), COL(S('OVERKILL', 'Suprimir duplicados', 'overkill'), S('AUDIT', 'Auditar', 'audit'))] },
    { name: 'Dibujo', items: [B('NEW', 'Nuevo desde plantilla', 'template'), B('DWGPROPS', 'Propiedades del dibujo', 'dwgprops'), B('TITLEBLOCK', 'Cajetín', 'titleblk')] },
    { name: 'Parámetros', items: [COL(S('UNITS', 'Unidades', 'units'), S('DSETTINGS', 'Parámetros de dibujo', 'options'), S('OPTIONS', 'Opciones', 'options')), COL(S('LINETYPE', 'Tipos de línea', 'line'), S('LWEIGHT', 'Grosores de línea', 'line'), S('DDPTYPE', 'Estilo de punto', 'point'))] },
  ] },
  { id: 'output', name: 'Salida', panels: [
    { name: 'Trazar', items: [B('PLOT', 'Trazar', 'plot'), B('PUBLISH', 'Trazar lotes', 'publish'), B('PLOT', 'Vista preliminar', 'preview'), COL(S('PAGESETUP', 'Administrador de configuraciones de página', 'pagesetup'), S('LIST', 'Ver detalles', 'list'), S('STYLESMANAGER', 'Administrador de trazadores', 'plotter'))] },
    { name: 'Exportar a PDF', items: [B('EXPORTPDF', 'Exportar', 'pdf', [S('EXPORTPDF', 'PDF', 'pdf'), S('SVGOUT', 'SVG', 'svg'), S('PNGOUT', 'Imagen PNG', 'png'), S('DXFOUT', 'DXF', 'dxf')]), { combo: 'exportwhat' }] },
  ] },
  { id: 'collab', name: 'Colaborar', panels: [
    { name: 'Compartir', items: [B('CLOUDSAVE', 'Compartir dibujo', 'share'), B('CLOUDOPEN', 'Abrir de la nube', 'cloudopen')] },
    { name: 'Nube', items: [B('CLOUDVERSIONS', 'Versiones', 'versions'), B('CLOUD', 'Configurar nube', 'cloud')] },
    { name: 'Marcas', items: [B('MARKUP', 'Marca de revisión', 'markup'), B('MARKUPS', 'Paleta de marcas', 'markups')] },
  ] },
  { id: 'express', name: 'Herramientas extra', panels: [
    { name: 'Bloques', items: [B('BURST', 'Descomponer atributos', 'explode'), B('BLOCKREPLACE', 'Reemplazar bloque', 'blockreplace'), COL(S('XLIST', 'Lista de propiedades', 'list'), S('ATTIN', 'Importar atributos', 'attin'), S('ATTOUT', 'Exportar atributos', 'attout'))] },
    { name: 'Texto', items: [B('TCOUNT', 'Numeración automática', 'tcount'), COL(S('TXT2MTXT', 'Convertir a texto M', 'txt2mtxt'), S('TCIRCLE', 'Encerrar en objeto', 'tcircle'), S('DDEDIT', 'Modificar texto', 'text'))] },
    { name: 'Capas', items: [COL(S('LAYISO', 'Aislar', 'layiso'), S('LAYUNISO', 'Desaislar', 'layiso'), S('LAYOFF', 'Desactivar', 'layoff')), COL(S('LAYFRZ', 'Inutilizar', 'layfrz'), S('LAYTHW', 'Reutilizar todas', 'layfrz'), S('LAYON', 'Activar todas', 'layoff')), COL(S('LAYMRG', 'Fusionar', 'layers'), S('LAYDEL', 'Suprimir', 'purge'), S('LAYCUR', 'Cambiar a actual', 'laymcur'))] },
    { name: 'Modificar', items: [COL(S('ISOLATEOBJECTS', 'Aislar objetos', 'isolate'), S('HIDEOBJECTS', 'Ocultar objetos', 'isolate'), S('UNISOLATEOBJECTS', 'Terminar aislamiento', 'isolate'))] },
    { name: 'Dibujo', items: [B('BREAKLINE', 'Símbolo de línea de rotura', 'breakline'), B('COUNT', 'Contar', 'count')] },
    { name: 'Herramientas', items: [B('ALIASEDIT', 'Alias de comandos', 'aliases'), COL(S('XDATA', 'Adjuntar datos X', 'xdata'), S('XDLIST', 'Listar datos X', 'xdata'), S('SETVAR ?', 'Variables de sistema', 'setvar')), B('CAL', 'Calculadora', 'units')] },
  ] },
  { id: 'mep', name: 'Instalaciones', panels: [
    { name: 'Conductos', items: [B('DUCT', 'Conducto', 'duct'), B('DUCTSIZE', 'Dimensionar', 'ductsize'), B('DUCTCALC', 'Pérdida de carga', 'ductcalc')] },
    { name: 'Tuberías', items: [B('PIPE', 'Tubería', 'pipe')] },
    { name: 'Biblioteca', items: [B('BIBLIOTECA', 'Biblioteca de bloques', 'library')] },
    { name: 'Isométrico', items: [B('ISODRAFT', 'Dibujo isométrico', 'iso'), COL(S('ISOPLANE', 'Plano isométrico', 'isoplane'), S('ISOCIRCLE', 'Círculo isométrico', 'isocircle'))] },
    { name: 'Mediciones', items: [B('DATAEXTRACTION', 'Extracción de datos', 'dataext'), B('TITLEBLOCK', 'Cajetín', 'titleblk')] },
  ] },
];
// ---- funciones v7: cotas y anotación avanzadas, referencias, SCP, ventanas, productividad, 3D
{
  const tab = (id) => TABS.find((t) => t.id === id), panel = (id, name) => tab(id).panels.find((p) => p.name === name);
  panel('home', 'Dibujo').more.push(S('MLINE', 'Multilínea', 'mline'), S('REGION', 'Región', 'region'), S('SUPERHATCH', 'Supersombreado', 'superhatch'));
  panel('home', 'Capas').more.push(S('LAYERSTATE', 'Estados de capa', 'laystate'), S('LAYWALK', 'Recorrer capas', 'laywalk'), S('LAYTRANS', 'Traductor de capas', 'laytrans'), S('VPLAYER', 'Capas por ventana', 'layfrz'), S('SETTRANSPARENCY', 'Transparencia', 'transp'));
  panel('home', 'Modificar').more.push(S('MOCORO', 'Mover, copiar, girar', 'mocoro'), S('CHSPACE', 'Cambiar espacio', 'chspace'));
  const cot = panel('annotate', 'Cotas');
  cot.more.push(S('DIMREASSOCIATE', 'Volver a asociar', 'dimassoc'), S('DIMDISASSOCIATE', 'Disociar', 'dimassoc'), S('-DIMSTYLE', 'Estilo de cota', 'dimstyle'));
  cot.items.push(COL(S('QDIM', 'Cota rápida', 'qdim'), S('DIMARC', 'Longitud de arco', 'dimarc'), S('DIMJOGGED', 'Radio con recodo', 'dimjogged')), COL(S('DIMSPACE', 'Ajustar espacio', 'dimspace'), S('DIMBREAK', 'Cortar cota', 'dimbreak'), S('TOLERANCE', 'Tolerancia', 'tolerance')));
  panel('annotate', 'Texto').more.push(S('TEXTALIGN', 'Alinear textos', 'textalign'), S('SPELL', 'Ortografía', 'spell'), S('ARCTEXT', 'Texto en arco', 'arctext'));
  panel('annotate', 'Directrices').items.push(COL(S('MLEADERSTYLE', 'Estilo de directriz', 'leader')));
  panel('annotate', 'Tablas').items.push(COL(S('TABLESTYLE', 'Estilo de tabla', 'table')));
  tab('annotate').panels.push({ name: 'Escala de anotación', items: [B('ANNOSCALE', 'Escala de anotación…', 'annoscale'), COL(S('ANNOTATIVE', 'Hacer anotativo', 'annotative'), S('TEXTALIGN', 'Alinear textos', 'textalign'), S('SPELL', 'Ortografía', 'spell'))] });
  tab('insert').panels.splice(3, 0,
    { name: 'Referencias e imágenes', items: [B('IMAGEATTACH', 'Imagen', 'image', [S('IMAGEATTACH', 'Imagen', 'image'), S('PDFATTACH', 'Adjuntar PDF', 'pdf'), S('PDFIMPORT', 'Importar PDF', 'pdf')]), B('PDFIMPORT', 'Importar PDF', 'pdf'), COL(S('IMAGECLIP', 'Delimitar', 'imageclip'), S('IMAGEADJUST', 'Ajustar', 'imageadjust'), S('HYPERLINK', 'Hipervínculo', 'hyperlink'))] },
    { name: 'Nubes de puntos', items: [B('POINTCLOUDATTACH', 'Nube de puntos', 'pointcloud'), COL(S('POINTCLOUDCROP', 'Recortar nube', 'imageclip'), S('POINTCLOUDCOLORMAP', 'Colores de nube', 'pointcloud'))] },
    { name: 'Ubicación', items: [B('GEOGRAPHICLOCATION', 'Ubicación', 'geo'), COL(S('GEOMAP', 'Mapa', 'geo'), S('GEOLATLONG', 'Coordenadas', 'id'), S('GEOMARKLATLONG', 'Marcar posición', 'point'))] });
  panel('view', 'Ventanas gráficas del modelo').items.unshift(B('VPORTS', 'Ventanas del modelo', 'vports', [S('^C^C-VPORTS _SI', 'Una', 'vports'), S('^C^C-VPORTS _2 _V', 'Dos: vertical', 'vports'), S('^C^C-VPORTS _2 _H', 'Dos: horizontal', 'vports'), S('^C^C-VPORTS _3 _R', 'Tres: derecha', 'vports'), S('^C^C-VPORTS _4', 'Cuatro: iguales', 'vports'), S('VPORTS', 'Ventanas...', 'vports')]));
  tab('view').panels.splice(1, 0, { name: 'Coordenadas', items: [B('UCS', 'SCP', 'ucs', [S('UCS', 'SCP', 'ucs'), S('^C^CUCS _W', 'SCP universal', 'ucs'), S('^C^CUCS _OB', 'SCP por objeto', 'ucs'), S('^C^CUCS _Z', 'Z', 'ucs'), S('^C^CUCS _P', 'Previo', 'ucs')]), COL(S('UCSMAN', 'Administrador de SCP', 'ucs'), S('^C^CUCS _W', 'SCP universal', 'ucs'), S('UCSICON', 'Icono SCP', 'ucs'))] });
  tab('manage').panels.splice(2, 0, { name: 'Grabadora de acciones', items: [B('ACTRECORD', 'Grabar', 'record'), COL(S('ACTSTOP', 'Detener', 'stop'), S('ACTPLAY', 'Reproducir', 'play'), S('ACTMANAGER', 'Administrador de acciones', 'list'))] }, { name: 'Comparar', items: [B('DWGCOMPARE', 'Comparar dibujos', 'compare'), COL(S('DWGCOMPAREEXIT', 'Salir', 'close'))] });
  tab('output').panels.push({ name: 'Publicar', items: [B('SHEETSET', 'Conjuntos de planos', 'sheetset'), B('ETRANSMIT', 'Transmitir', 'etransmit'), COL(S('SHEETLIST', 'Lista de planos', 'table'), S('STLOUT', 'Exportar STL', 'printer3d'), S('OBJOUT', 'OBJ', 'printer3d'))] });
  panel('express', 'Texto').items.push(B('ARCTEXT', 'Texto en arco', 'arctext'));
  panel('express', 'Modificar').items.push(COL(S('MOCORO', 'Mover, copiar, girar', 'mocoro'), S('CHSPACE', 'Cambiar espacio', 'chspace'), S('LAYTRANS', 'Traductor de capas', 'laytrans')));
  panel('express', 'Dibujo').items.push(B('SUPERHATCH', 'Supersombreado', 'superhatch'));
  TABS.splice(TABS.findIndex((t) => t.id === 'view') + 1, 0, { id: '3d', name: 'Modelado 3D', panels: [
    { name: 'Modelado', items: [B('BOX', 'Prisma rectangular', 'box', [S('BOX', 'Prisma rectangular', 'box'), S('CYLINDER', 'Cilindro', 'cylinder'), S('CONE', 'Cono', 'cone'), S('SPHERE', 'Esfera', 'sphere')]), B('EXTRUDE', 'Extrusión', 'extrude'), B('REVOLVE', 'Revolución', 'revolve'), COL(S('CYLINDER', 'Cilindro', 'cylinder'), S('CONE', 'Cono', 'cone'), S('SPHERE', 'Esfera', 'sphere'))] },
    { name: 'Edición de sólidos', items: [COL(S('UNION', 'Unión', 'union'), S('SUBTRACT', 'Diferencia', 'subtract'), S('INTERSECT', 'Intersección', 'intersect')), COL(S('REGION', 'Región', 'region'), S('MASSPROP', 'Propiedades físicas', 'list'))] },
    { name: 'Vista', items: [B('3DORBIT', 'Órbita 3D', 'orbit'), COL(S('VSCURRENT', 'Estilo visual', 'visualstyle'), S('RENDER', 'Renderizar', 'render'), S('VPORTS', 'Ventanas del modelo', 'vports'))] },
    { name: 'Nubes de puntos', items: [B('POINTCLOUDATTACH', 'Nube de puntos', 'pointcloud'), COL(S('POINTCLOUDCROP', 'Recortar nube', 'imageclip'), S('POINTCLOUDCOLORMAP', 'Colores de nube', 'pointcloud'))] },
    { name: 'Exportar', items: [B('STLOUT', 'Exportar STL', 'printer3d', [S('STLOUT', 'STL', 'printer3d'), S('OBJOUT', 'OBJ', 'printer3d')])] },
  ] });
}
// ---- funciones v8: multilíneas, sólidos, vistas 2D, instalaciones, SIG/DWG, colaboración en tiempo real
{
  const tab = (id) => TABS.find((t) => t.id === id), panel = (id, name) => tab(id).panels.find((p) => p.name === name);
  panel('home', 'Dibujo').more.push(S('MLEDIT', 'Editar multilínea', 'mline'));
  const sol = panel('3d', 'Edición de sólidos');
  sol.items.push(COL(S('SLICE', 'Corte', 'subtract'), S('SECTION', 'Sección', 'region'), S('CONVTOMESH', 'Convertir en malla', 'box')), COL(S('FILLETEDGE', 'Empalmar arista', 'fillet'), S('CHAMFEREDGE', 'Achaflanar arista', 'chamfer')));
  tab('3d').panels.splice(2, 0, { name: 'Vistas de dibujo', items: [B('VIEWBASE', 'Vista base', 'view')] });
  const ex = panel('3d', 'Exportar'); ex.name = 'Importar y exportar';
  ex.items = [B('IFCIMPORT', 'Importar IFC/STEP', 'open'), B('STLOUT', 'Exportar', 'printer3d', [S('STLOUT', 'STL', 'printer3d'), S('OBJOUT', 'OBJ', 'printer3d'), S('STEPOUT', 'STEP', 'printer3d'), S('IFCOUT', 'IFC', 'printer3d')])];
  panel('3d', 'Nubes de puntos').items.push(COL(S('POINTCLOUDSECTION', 'Sección de nube', 'region')));
  tab('insert').panels.splice(4, 0, { name: 'SIG y DWG', items: [B('GISIMPORT', 'Importar SHP/GeoJSON', 'geo'), COL(S('DWGOUT', 'Guardar como DWG', 'save'), S('DWGCONVERTER', 'Conversor DWG', 'options'))] });
  tab('collab').panels.splice(0, 0, { name: 'Tiempo real', items: [B('COLLAB', 'Colaborar en directo', 'share'), COL(S('LAYERCLAIM', 'Reservar capa', 'laylck'), S('COMMENT', 'Comentar', 'markup'), S('COMMENTS', 'Comentarios', 'markups'))] });
  panel('view', 'Interfaz').items.push(B('TOUCHMODE', 'Modo tableta', 'cmdline'));
  const mep = tab('mep');
  mep.panels.find((p) => p.name === 'Conductos').items.push(COL(S('DUCTELEV', 'Cota de conducto', 'duct'), S('DUCT3D', 'Conductos 3D', 'box'), S('DUCTISO', 'Isométrica', 'iso')), COL(S('DUCTBOM', 'Lista de materiales', 'table'), S('ROOMLOADS', 'Cargas térmicas', 'ductcalc')));
  mep.panels.find((p) => p.name === 'Tuberías').items.push(COL(S('PIPECALC', 'Pérdida de carga y NPSH', 'ductcalc'), S('FLANGE', 'Brida EN 1092-1', 'circle')));
  mep.panels.splice(2, 0, { name: 'Presión y P&ID', items: [B('PEDSHEET', 'Hoja PED', 'list'), COL(S('PIDTAG', 'Etiquetar P&ID', 'tcount'), S('PIDLIST', 'Lista de válvulas', 'table'))] });
}
const LAYOUT_TAB = { id: 'layout', name: 'Presentación', ctx: true, panels: [
  { name: 'Presentación', items: [B('LAYOUT _N', 'Nueva', 'layout'), B('PAGESETUP', 'Configurar página', 'pagesetup')] },
  { name: 'Ventanas de presentación', items: [B('MVIEW', 'Insertar vista', 'mview', [S('MVIEW', 'Rectangular', 'mview'), S('MVIEW _P', 'Poligonal', 'mview')]), COL(S('MSPACE', 'Espacio modelo', 'mspace'), S('PSPACE', 'Espacio papel', 'layout'), S('MVIEW _LOCK', 'Bloquear', 'laylck'))] },
  { name: 'Estilos y normas', items: [B('STYLESMANAGER', 'Estilos de trazado', 'styles'), B('TITLEBLOCK', 'Cajetín', 'titleblk')] },
] };
const BEDIT_TAB = { id: 'bedit', name: 'Editor de bloques', ctx: true, panels: [
  { name: 'Abrir/Guardar', items: [B('BSAVE', 'Guardar bloque', 'bsave'), B('BEDIT', 'Editar bloque', 'bedit')] },
  { name: 'Geometría', items: [COL(S('LINE', 'Línea', 'line'), S('CIRCLE', 'Círculo', 'circle'), S('PLINE', 'Polilínea', 'pline')), COL(S('ATTDEF', 'Definición de atributo', 'attdef'), S('BASE', 'Punto base', 'id'))] },
  { name: 'Parámetros', items: [B('^C^CBPARAMETER _L', 'Lineal', 'bparamlin'), B('^C^CBPARAMETER _R', 'Rotación', 'bparamrot'), B('^C^CBPARAMETER _F', 'Simetría', 'bparamflip'), B('^C^CBPARAMETER _V', 'Visibilidad', 'bparamvis')] },
  { name: 'Acciones', items: [B('BACTION', 'Acción', 'baction'), B('BPARAMDEL', 'Suprimir parámetro', 'close')] },
  { name: 'Visibilidad', items: [B('BVSTATE', 'Estados de visibilidad', 'bvstate'), COL(S('BVHIDE', 'Hacer invisible', 'bvhide'), S('BVSHOW', 'Hacer visible', 'bvshow'))] },
  { name: 'Cerrar', items: [B('BCLOSE', 'Cerrar Editor de bloques', 'bclose')] },
] };
const HATCH_TAB = { id: 'hatch', name: 'Creación de sombreado', ctx: true, panels: [
  { name: 'Contornos', items: [B('', 'Designar puntos', 'boundary', null, 'pick'), B('>_S', 'Designar', 'qselect')] },
  { name: 'Patrón', items: [{ custom: 'hpat' }] },
  { name: 'Propiedades', items: [{ custom: 'hprops' }] },
  { name: 'Cerrar', items: [B('', 'Cerrar Creación de sombreado', 'bclose')] },
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
    const b = h('button', { class: 'big', type: 'button', 'data-cmd': it.big || '', title: it.label + (it.big ? ` (${dispCmd(it.big)})` : '') }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label), it.dd ? h('span', { html: icon('caret'), style: { width: '10px', height: '10px', marginTop: '1px' } }) : '');
    b.onclick = (e) => { if (it.dd && e.offsetY > b.clientHeight - 16) return showDrop(b, it.dd); if (it.big === '' && it.label.startsWith('Cerrar')) return app.cmd.submit(''); if (it.big === '' && it.label === 'Designar puntos') return; run(it.big); };
    if (it.dd) b.oncontextmenu = (e) => { e.preventDefault(); showDrop(b, it.dd); };
    return b;
  };
  const smBtn = (it) => {
    const b = h('button', { class: 'sm' + (it.label ? '' : ' iconly'), type: 'button', 'data-cmd': it.cmd || '', title: it.label || dispCmd(it.cmd) }, h('span', { class: 'ico', html: icon(it.icon) }), it.label || '', it.dd ? h('span', { html: icon('caret'), style: { width: '9px', height: '9px' } }) : '');
    b.onclick = (e) => { if (it.dd && (e.offsetX > b.clientWidth - 12 || !it.label)) { if (!it.label && e.offsetX < b.clientWidth - 12) return run(it.cmd); return showDrop(b, it.dd); } run(it.cmd); };
    return b;
  };
  const toggleBtn = (it) => {
    const on = toggleOn(it);
    const b = h('button', { class: 'big' + (on ? ' on' : ''), type: 'button', title: it.label }, h('span', { class: 'ico', html: icon(it.icon) }), h('span', {}, it.label));
    b.onclick = () => toggleRun(it);
    return b;
  };
  // combos
  const layerCombo = () => {
    const d = app.doc;
    const sel = app.cmd.sel;
    const curName = sel.length ? (new Set(sel.map((e) => e.layer)).size === 1 ? sel[0].layer : '') : d.clayer;
    const L = d.layers[curName];
    const face = h('button', { class: 'rcombo', type: 'button', style: { display: 'flex', alignItems: 'center', gap: '4px', minWidth: '210px', textAlign: 'left' } },
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

  const toggleOn = (it) => (it.toggle === 'theme' ? app.settings.theme !== 'light' : !!app.settings[it.toggle]);
  const toggleRun = (it) => { if (it.toggle === 'theme') return app.ui.setTheme({ light: 'mid', mid: 'dark', dark: 'light' }[app.settings.theme] || 'light'); app.settings[it.toggle] = !app.settings[it.toggle]; saveSettings(); app.ui.applyLayout(); rb.render(); };
  const smToggle = (it) => { const b = h('button', { class: 'sm' + (toggleOn(it) ? ' on' : ''), type: 'button', title: it.label }, h('span', { class: 'ico', html: icon(it.icon) }), it.label); b.onclick = () => toggleRun(it); return b; };
  const lbl = (text, el) => h('label', { class: 'rlbl' }, text ? h('span', { text, style: { minWidth: '18px' } }) : '', el);
  const COMBOS = {
    textstyle: () => {
      const d = app.doc;
      const st = h('select', { class: 'rcombo', title: 'Estilo de texto', onchange: () => { d.setvar('TEXTSTYLE', st.value); app.ui.refresh(); } }, Object.keys(d.styles).map((n) => h('option', { value: n, selected: n === d.vars.TEXTSTYLE, text: n })));
      const find = h('input', { class: 'rcombo', type: 'search', placeholder: 'Buscar texto', onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') run('FIND'); } });
      const hgt = h('input', { class: 'rcombo', type: 'number', step: 'any', min: 0, title: 'Altura de texto', value: d.vars.TEXTSIZE, onchange: () => { if (+hgt.value > 0) d.setvar('TEXTSIZE', +hgt.value); } });
      return h('div', { class: 'col', style: { gap: '2px' } }, st, find, hgt);
    },
    dimstyle: () => {
      const d = app.doc;
      const ds = h('select', { class: 'rcombo', title: 'Estilo de cota', onchange: () => { if (ds.value === 'edit') run('DIMSTYLE'); else { d.setDimStyle(ds.value); app.ui.refresh(); } } }, Object.keys(d.dimstyles || { [d.vars.DIMSTYLE]: 1 }).map((n) => h('option', { value: n, selected: n === d.vars.DIMSTYLE, text: n })), h('option', { value: 'edit', text: 'Administrar estilos de cota...' }));
      const ly = h('select', { class: 'rcombo', title: 'Capa para las cotas' }, h('option', { text: 'Usar capa actual' }), Object.keys(d.layers).map((n) => h('option', { value: n, text: n })));
      const row = h('div', { class: 'row', style: { gap: '1px' } }, S2('DIMLINEAR', 'Lineal', 'dimlinear', [S('DIMLINEAR', 'Lineal', 'dimlinear'), S('DIMALIGNED', 'Alineada', 'dimaligned'), S('DIMANGULAR', 'Angular', 'dimangular'), S('DIMRADIUS', 'Radio', 'dimradius'), S('DIMDIAMETER', 'Diámetro', 'dimdiameter'), S('DIMORDINATE', 'Por coordenadas', 'dimordinate')]), S2('DIMCONTINUE', 'Continua', 'dimcontinue', [S('DIMCONTINUE', 'Continua', 'dimcontinue'), S('DIMBASELINE', 'Línea base', 'dimbaseline')]));
      return h('div', { class: 'col', style: { gap: '2px' } }, ds, ly, row);
    },
    views: () => {
      const d = app.doc;
      const vs = h('select', { class: 'rcombo', title: 'Vistas guardadas', onchange: () => { const v = d.views?.[vs.value]; if (v) { app.view.setCur({ ...app.view.cur, cx: v.cx, cy: v.cy, s: v.s }); app.view.redraw(); } } }, h('option', { value: '', text: 'Vista no guardada' }), Object.keys(d.views || {}).map((n) => h('option', { value: n, text: n })));
      return h('div', { class: 'col', style: { gap: '2px' } }, vs, smBtn(S('VIEW', 'Nueva vista', 'view')), smBtn(S('VIEW', 'Administrador de vistas', 'view')));
    },
    exportwhat: () => h('div', { class: 'col', style: { gap: '2px' } },
      h('select', { class: 'rcombo', title: 'Qué exportar' }, h('option', { text: app.doc.active === 'Model' ? 'Exportar: Pantalla' : 'Exportar: Presentación actual' }), h('option', { text: 'Exportar: Todas las presentaciones' })),
      h('select', { class: 'rcombo', title: 'Configuración de página' }, h('option', { text: 'Configuración de página: Actual' }))),
  };
  const S2 = (cmd, label, ic, dd) => smBtn(S(cmd, label, ic, dd));
  rb.render = () => {
    closeDrop();
    tabsEl.innerHTML = ''; panels.innerHTML = '';
    const tabs = [...TABS];
    if (app.doc.active !== 'Model' && !app.doc.blockEdit) tabs.push(LAYOUT_TAB);
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
        else if (it.col) body.append(h('div', { class: 'col' }, it.col.map((x) => (x.toggle ? smToggle(x) : smBtn(x)))));
        else if (it.combo && COMBOS[it.combo]) body.append(COMBOS[it.combo]());
        else if (it.combo === 'layer') body.append(layerCombo());
        else if (it.combo === 'props') body.append(propsCombos());
        else if (it.toggle) body.append(toggleBtn(it));
        else if (it.custom === 'hpat') body.append(hatchPat());
        else if (it.custom === 'hprops') body.append(hatchProps());
      }
      const lbl = h('div', { class: 'rp-label' + (p.more ? ' more' : ''), text: p.name });
      if (p.more) lbl.onclick = () => showDrop(lbl, p.more);
      panels.append(h('div', { class: 'rp' }, body, lbl));
    }
  };
  rb.showContext = (id) => { rb.ctx.add(id); rb.active = id; root.classList.remove('min'); rb.render(); };
  rb.hideContext = (id) => { rb.ctx.delete(id); if (rb.active === id) rb.active = 'home'; rb.render(); };
  rb.refreshCombos = () => { if (['home'].includes(rb.active) || rb.ctx.size) rb.render(); };
  return rb;
}
export { LAYOUT_TAB, BEDIT_TAB, HATCH_TAB };
