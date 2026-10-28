// Idiomas de WebCAD Libre: castellano (es), galego (gl), português (pt), català (ca) e inglés (en).
// Los comandos y opciones internos están en inglés; los mensajes se traducen al mostrarlos.
// La línea de comandos acepta el idioma activo y el inglés; el prefijo "_" fuerza el inglés (como en AutoCAD: _LINE, _Undo).
// Los nombres de comando en castellano, gallego, portugués y catalán se aceptan siempre.
import * as GL from './i18n-gl.js';
import * as PT from './lang-pt.js';
import * as CA from './lang-ca.js';
import { UI, UI_RE } from './ui-strings.js';
import { TXT_PTCA, RE_PTCA } from './ui-ptca.js';

export const LANGS = { es: 'Castellano', gl: 'Galego', pt: 'Português', ca: 'Català', en: 'English' };
// diccionarios de interfaz de portugués y catalán (clave en castellano)
let UIX = null;
const uix = () => {
  if (UIX) return UIX;
  UIX = { pt: {}, ca: {} };
  for (const t of TXT_PTCA) for (const l of t.split('\n')) { const p = l.split(' | '); if (p.length === 3) { const k = p[0].replace(/\\n/g, '\n'); UIX.pt[k] = p[1].replace(/\\n/g, '\n'); UIX.ca[k] = p[2].replace(/\\n/g, '\n'); } }
  return UIX;
};
let LANG = 'es';
export const getLang = () => LANG;
export function setLang(l) { LANG = LANGS[l] ? l : 'es'; if (typeof document !== 'undefined') document.documentElement.lang = LANG; }

// Textos de la interfaz: la clave es el texto en castellano; UI[clave] = [galego, inglés]
export const missing = new Set();
const pick = (e) => e[LANG === 'gl' ? 0 : 1] ?? null;
function lookup(s) {
  if (LANG === 'pt' || LANG === 'ca') { const v = uix()[LANG][s]; if (v != null) return v; }
  else { const e = UI[s]; if (e) return pick(e); }
  let m = /^(.+?)(\.\.\.|…|:|\s+)$/.exec(s); // sufijos «...», «:» y espacios
  if (m) { const r = lookup(m[1]); return r == null ? null : r + m[2]; }
  m = /^(\s+)(.+)$/.exec(s);
  if (m) { const r = lookup(m[2]); return r == null ? null : m[1] + r; }
  m = /^(.+) \(([^()]*[A-Z][^()]*)\)$/.exec(s); // «Línea (LINE)», «Trazar (Ctrl+P)»
  if (m) { const r = lookup(m[1]); return r == null ? null : `${r} (${lookup(m[2]) ?? m[2]})`; }
  m = /^(.+) ([XYZ])$/.exec(s); // «Posición X»
  if (m) { const r = lookup(m[1]); return r == null ? null : `${r} ${m[2]}`; }
  m = /^(.+) \((\d+)\)$/.exec(s); // «Cota (3)»
  if (m) { const r = lookup(m[1]); return r == null ? null : `${r} (${m[2]})`; }
  m = /^([■▸▾•] )(.+)$/.exec(s);
  if (m) { const r = lookup(m[2]); return r == null ? null : m[1] + r; }
  if (LANG === 'pt' || LANG === 'ca') { for (const [re, pt, ca] of RE_PTCA) if (re.test(s)) return s.replace(re, LANG === 'pt' ? pt : ca); return null; }
  for (const [re, gl, en] of UI_RE) if (re.test(s)) return s.replace(re, LANG === 'gl' ? gl : en);
  return null;
}
export function t(s, ...args) {
  if (typeof s !== 'string') return s;
  let r = s;
  if (LANG !== 'es') { const x = lookup(s); if (x != null) r = x; else if (/[a-záéíóúñ]{3}/i.test(s)) missing.add(s); }
  return args.length ? r.replace(/\{(\d)\}/g, (m, i) => args[i] ?? '') : r;
}
// solo traduce lo que está en el diccionario (para el DOM: no toca nombres de capa, textos del dibujo, etc.)
export function tKnown(s) {
  if (LANG === 'es' || typeof s !== 'string' || !s) return s;
  const x = lookup(s);
  if (x != null) return x;
  if (/[a-záéíóúñ]{3}/.test(s)) missing.add(s);
  return s;
}
export const _lookup = lookup;
// nombres por defecto de dibujos y presentaciones
export const docBase = () => ({ es: 'Dibujo', gl: 'Debuxo', pt: 'Desenho', ca: 'Dibuix', en: 'Drawing' })[LANG];
export const layoutBase = () => ({ es: 'Presentación', gl: 'Presentación', pt: 'Layout', ca: 'Presentació', en: 'Layout' })[LANG];

export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

// ---------- opciones (EN -> ES; las mayúsculas marcan la abreviatura)
export const KW = {
  Undo: 'desHacer', Close: 'Cerrar', CLose: 'CErrar', Arc: 'Arco', Halfwidth: 'Mitad grosor', Length: 'Longitud', Width: 'Grosor', Line: 'Línea',
  Angle: 'Ángulo', CEnter: 'CEntro', Center: 'Centro', Direction: 'Dirección', Radius: 'Radio', 'Second pt': 'Segundo pto', End: 'Final',
  'chord Length': 'longitud de Cuerda', '3P': '3P', '2P': '2P', 'Ttr (tan tan radius)': 'Ttr (tangente tangente radio)', Diameter: 'Diámetro',
  Chamfer: 'Chaflán', Elevation: 'Elevación', Fillet: 'eMpalme', Thickness: 'Altura de objeto', Area: 'Área', Dimensions: 'Cotas', Rotation: 'Rotación',
  Edge: 'Lado', 'Inscribed in circle': 'Inscrito en el círculo', 'Circumscribed about circle': 'Circunscrito alrededor del círculo',
  Parameter: 'Parámetro', 'Included angle': 'ángulo Incluido', Method: 'Método', Knots: 'Nudos', Object: 'Objeto', 'start Tangency': 'Tangencia inicial',
  'end Tangency': 'Tangencia final', toLerance: 'toLerancia', Hor: 'Hor', Ver: 'Ver', Ang: 'Ang', Bisect: 'Bisectriz', Offset: 'Desfase',
  'Arc length': 'Longitud de arco', Rectangular: 'Rectangular', Polygonal: 'Poligonal', Freehand: 'a mano Alzada', Style: 'Estilo', Modify: 'Modificar',
  Frames: 'Marcos', Polyline: 'Polilínea', Displacement: 'Desplazamiento', Array: 'Matriz', Fit: 'Ajustar', Copy: 'Copiar', Reference: 'Referencia',
  Points: 'Puntos', Yes: 'Sí', No: 'No', Through: 'Punto', Erase: 'Borrar', Layer: 'Capa', Current: 'Actual', Source: 'Origen', Exit: 'Salir',
  Multiple: 'Múltiple', 'cuTting edges': 'Aristas de corte', Fence: 'Borde', Crossing: 'Captura', mOde: 'mOdo', Project: 'Proyección', eRase: 'Eliminar',
  Quick: 'Rápido', Standard: 'Estándar', 'First point': 'Primer punto', Polyline_: 'Polilínea', Trim: 'recorTar', Distance: 'Distancia', mEthod: 'méTodo',
  PAth: 'Camino', POlar: 'Polar', 'Base point': 'Punto base', 'Axis of rotation': 'Eje de rotación', DElta: 'Incremento', Percent: 'Porcentaje',
  Total: 'Total', DYnamic: 'Dinámica', Open: 'Abrir', Join: 'Juntar', 'Edit vertex': 'Editar vértices', Spline: 'Spline', Decurve: 'Rectificar',
  'Ltype gen': 'generación tipoLín', Reverse: 'Invertir', Settings: 'Parámetros', Color: 'Color', LAyer: 'cApa', LType: 'tipoLín', ltScale: 'Escala tl',
  LWeight: 'Grosor lín', TRansparency: 'tRansparencia', Material: 'Material', PLotstyle: 'estilo de Trazado', 'Above objects': 'Encima de objetos',
  'Under objects': 'Debajo de objetos', Front: 'Frente', Back: 'Atrás', 'Multiple points': 'Múltiples puntos', 'Add area': 'Añadir área',
  'Subtract area': 'Sustraer área', Block: 'Bloque', Auto: 'Auto', Control: 'Control', BEgin: 'Inicio', Mark: 'Marca',
  Justify: 'Justificar', Left: 'Izquierda', Right: 'Derecha', Align: 'aLinear', Middle: 'Medio', TL: 'SI', TC: 'SC', TR: 'SD', ML: 'MI', MC: 'MC', MR: 'MD',
  BL: 'II', BC: 'IC', BR: 'ID', Height: 'Altura', 'Line spacing': 'Interlineado', Columns: 'Columnas', Mtext: 'textoM', Text: 'Texto', Horizontal: 'Horizontal',
  Vertical: 'Vertical', Rotated: 'Girada', Quadrant: 'Cuadrante', Xdatum: 'Xbase', Ydatum: 'Ybase', Select: 'Designar', Home: 'Restablecer',
  'leader Landing first': 'primero eNlace', 'Content first': 'primero Contenido', Options: 'Opciones', 'Select objects': 'Seleccionar objetos',
  seTtings: 'parámeTros', sEttings: 'parámeTros', Properties: 'Propiedades', 'draW boundary': 'dibujar Contorno', 'remove Boundaries': 'Eliminar contornos',
  Advanced: 'Avanzado', 'DRaw order': 'Orden de dibujo', Origin: 'oRigen', ANnotative: 'aNotativo', 'hatch Color': 'color de soMbreado', Transparency: 'Transparencia',
  Solid: 'Sólido', 'User defined': 'Usuario', Gradient: 'deGradado', Basepoint: 'Punto base', Scale: 'Escala', Rotate: 'Rotar', Corner: 'Esquina', XYZ: 'XYZ',
  'Entire drawing': 'Todo el dibujo', Objects: 'Objetos', Cancel: 'Cancelar', Alignment: 'Alineación', Linear: 'Lineal', Polar: 'Polar', Flip: 'Simetría',
  Visibility: 'Visibilidad', XY: 'XY', Lookup: 'Consulta', Name: 'Nombre', Label: 'Etiqueta', Chain: 'Cadena', Description: 'Descripción', Base: 'Base',
  Palette: 'Paleta', 'Value set': 'conjunto de Valores', Stretch: 'Estirar', Move: 'Desplazar', None: 'Ninguna', New: 'Nuevo', 'Set current': 'Definir actual',
  Rename: 'Renombrar', Delete: 'Suprimir', 'Hide all': 'Ocultar todos', 'Show all': 'Mostrar todos', 'Leave unchanged': 'Dejar sin cambios',
  'Current state': 'Estado actual', 'All visibility states': 'Todos los estados', All: 'Todo', Dynamic: 'Dinámico', Extents: 'Extensión', Previous: 'Previo',
  Window: 'Ventana', Orthographic: 'Ortogonal', Restore: 'Restituir', Save: 'Guardar', '?': '?', Template: 'Plantilla', SAveas: 'Guardar como', Set: 'Definir',
  Make: 'Hacer', ON: 'ACT', OFF: 'DES', Ltype: 'tipoLín', Plot: 'TRazar', Freeze: 'Inutilizar', Thaw: 'REutilizar', LOck: 'BLoquear', Unlock: 'DESBloquear',
  stAte: 'eStado', rEconcile: 'rECONciliar', MATerial: 'MATerial', 'No plot': 'No trazar', Load: 'Cargar', Create: 'Crear', Truecolor: 'Color verdadero',
  COlorbook: 'Cuaderno de colores', Lock: 'Bloquear', Shadeplot: 'Trazado sombreado', NEw: 'Nueva', NAmed: 'Guardada', Pick: 'Designar',
  'Pick points': 'Designar puntos', Ascending: 'Ascendente',
};
// opciones añadidas con las funciones nuevas (conductos, restricciones, grupos, tablas, isométrico…)
Object.assign(KW, {
  Annotative: 'Anotativo', CPolygon: 'PolígonoC', SYstem: 'SIstema', SHape: 'FOrma', WIdth: 'ANcho', HEight: 'ALto', DIameter: 'DIámetro', FLow: 'CAudal', RAdius: 'RAdio',
  Supply: 'Impulsión', Return: 'Retorno', Exhaust: 'Extracción', Outdoor: 'aire eXterior', Round: 'Circular', COUnt: 'Número', Spacing: 'sEparación', eXit: 'Salir',
  Items: 'Elementos', 'Fill angle': 'Ángulo de relleno', 'ROTate items': 'Girar elementos', Show: 'Mostrar', Hide: 'Ocultar', 'Add objects': 'Añadir objetos',
  'Remove objects': 'Eliminar objetos', REName: 'Renombrar', Excel: 'Excel', Csv: 'Csv', Isometric: 'Isométrico', Top: 'Superior', Coincident: 'Coincidente',
  Parallel: 'Paralela', Perpendicular: 'Perpendicular', Equal: 'Igual', Fix: 'Fija', CONcentric: 'COncéntrica', COLlinear: 'COLineal', Tangent: 'Tangente',
  LInear: 'LIneal', Aligned: 'Alineada', ANgular: 'ANgular', Alignment: 'Alineación', Lookup: 'Consulta', 'Value set': 'conjunto de Valores',
});
// valores por defecto entre <>
const DEFW = { Exit: 'Salir', Displacement: 'Desplazamiento', 'real time': 'tiempo real', 'select object': 'designar objeto', Object: 'Objeto', Total: 'Total',
  Yes: 'Sí', No: 'No', Y: 'S', N: 'N', Through: 'Punto', Stretch: 'Estirar', Linear: 'Lineal', Settings: 'Parámetros', Fit: 'Ajustar', Back: 'Atrás',
  'Set current': 'Definir actual', 'Current state': 'Estado actual', 'Leave unchanged': 'Dejar sin cambios', Rectangular: 'Rectangular', Objects: 'Objetos',
  Quick: 'Rápido', Standard: 'Estándar', Source: 'Origen', 'specify vertex': 'precise vértice', 'use X scale factor': 'usar factor de escala X',
  'use first point as displacement': 'usar primer punto como desplazamiento', 'select all': 'designar todo', Select: 'Designar', Polyline: 'Polilínea',
  exit: 'salir', Mtext: 'textoM', BYLAYER: 'PORCAPA', BYBLOCK: 'PORBLOQUE', ByLayer: 'PorCapa', CONTINUOUS: 'CONTINUOUS', set: 'definir', Options: 'Opciones', Inscribed: 'Inscrito' };

// ---------- frases (base del mensaje, sin opciones ni valor por defecto)
export const SENT = {
  'Select continued dimension': 'Designe cota continua', 'Specify objects to stretch': 'Precise objetos para estirar', 'Specify objects for Rotate action': 'Precise objetos para la acción Girar',
  'Specify objects for Flip action': 'Precise objetos para la acción Simetría', "Specify first end point of circle's diameter": 'Precise primer punto final del diámetro del círculo',
  "Specify second end point of circle's diameter": 'Precise segundo punto final del diámetro del círculo', 'Specify diameter of circle': 'Precise diámetro del círculo',
  'Enter name for new layer': 'Indique nombre para la nueva capa', 'Enter names for new layer(s)': 'Indique nombres para las nuevas capas', 'Enter name of new layout': 'Indique nombre de la nueva presentación',
  'Select cutting edges ...': 'Designe aristas de corte...', 'Select object to trim': 'Designe el objeto que desea recortar', 'Select object to extend': 'Designe el objeto que desea alargar',
  'Enter a extend mode option': 'Indique una opción de modo de alargamiento', 'Select object to measure': 'Designe objeto que desea medir', 'Select object to divide': 'Designe objeto que desea dividir',
  'Specify starting width': 'Precise grosor inicial', 'Specify starting half-width': 'Precise mitad de grosor inicial', 'Specify ending width': 'Precise grosor final', 'Specify ending half-width': 'Precise mitad de grosor final',
  'Align arrayed items to path?': '¿Alinear elementos de matriz con el camino?', 'Align block with object?': '¿Alinear bloque con objeto?',
  'Do you want to turn it into one?': '¿Desea convertirlo en polilínea?', 'Object selected is not a polyline': 'El objeto designado no es una polilínea',
  'Enter X scale factor, specify opposite corner,': 'Indique factor de escala X, precise esquina opuesta,', 'Enter Y scale factor': 'Indique factor de escala Y',
  'Enter a loaded linetype name': 'Indique nombre de un tipo de línea cargado', 'Enter a pattern name': 'Indique nombre de patrón', 'Enter a plotting preference': 'Indique preferencia de trazado',
  'Enter a scale factor (nX or nXP)': 'Indique un factor de escala (nX o nXP)', 'Enter an option': 'Indique una opción', 'Enter angle of xline (0)': 'Indique ángulo de la línea auxiliar (0)',
  'Enter area of rectangle in current units': 'Indique área del rectángulo en unidades actuales', 'Enter array type': 'Indique tipo de matriz', 'Enter base point': 'Indique punto base',
  'Enter block name': 'Indique nombre de bloque', 'Enter delta length': 'Indique incremento de longitud', 'Enter dimension text': 'Indique texto de cota',
  'Enter distance increment': 'Indique incremento de distancia', 'Enter first line of annotation text': 'Indique primera línea del texto de anotación',
  'Enter justification': 'Indique justificación', 'Enter layer description': 'Indique descripción de capa', 'Enter layer name to make current': 'Indique nombre de la capa que desea hacer actual',
  'Enter layer names for this plot preference': 'Indique nombres de capa para esta preferencia de trazado', 'Enter layer option for offset objects': 'Indique opción de capa para objetos desfasados',
  'Enter layout option': 'Indique opción de presentación', 'Enter layout to make current': 'Indique presentación que desea hacer actual', 'Enter layout to rename': 'Indique presentación que desea renombrar',
  'Enter linetype(s) to load': 'Indique tipo(s) de línea que desea cargar', 'Enter lineweight (0.0mm - 2.11mm)': 'Indique grosor de línea (0.0mm - 2.11mm)',
  'Enter list of object snap modes': 'Indique lista de modos de referencia a objetos', 'Enter magnification or height': 'Indique ampliación o altura',
  'Enter name for new visibility state': 'Indique nombre del nuevo estado de visibilidad', 'Enter name list of layer(s) to freeze': 'Indique lista de nombres de capa(s) que desea inutilizar',
  'Enter name list of layer(s) to lock': 'Indique lista de nombres de capa(s) que desea bloquear', 'Enter name list of layer(s) to thaw': 'Indique lista de nombres de capa(s) que desea reutilizar',
  'Enter name list of layer(s) to unlock': 'Indique lista de nombres de capa(s) que desea desbloquear', 'Enter name list of layers': 'Indique lista de nombres de capa',
  'Enter name list of layers for lineweight': 'Indique lista de nombres de capa para el grosor de línea', 'Enter name list of layers to turn Off': 'Indique lista de nombres de capa que desea desactivar',
  'Enter name list of layers to turn On': 'Indique lista de nombres de capa que desea activar', 'Enter name of block to insert': 'Indique nombre del bloque que desea insertar',
  'Enter name of block to sync': 'Indique nombre del bloque que desea sincronizar', 'Enter name of existing block': 'Indique nombre de bloque existente',
  'Enter name of layout to delete': 'Indique nombre de la presentación que desea suprimir', 'Enter new color': 'Indique nuevo color', 'Enter new layer name': 'Indique nuevo nombre de capa',
  'Enter new layout name': 'Indique nuevo nombre de presentación', 'Enter new linetype name': 'Indique nuevo nombre de tipo de línea', 'Enter new linetype scale factor': 'Indique nuevo factor de escala de tipo de línea',
  'Enter new lineweight': 'Indique nuevo grosor de línea', 'Enter new name for current state': 'Indique nuevo nombre para el estado actual', 'Enter new value for CELTSCALE': 'Indique nuevo valor para CELTSCALE',
  'Enter next line of annotation text': 'Indique siguiente línea del texto de anotación', 'Enter next point': 'Indique siguiente punto', 'Enter number of items along path': 'Indique número de elementos a lo largo del camino',
  'Enter number of items to array': 'Indique número de elementos de la matriz', 'Enter number of sides': 'Indique número de lados', 'Enter object ordering option': 'Indique opción de ordenación de objetos',
  'Enter object type to rename': 'Indique tipo de objeto que desea renombrar', 'Enter old layer name': 'Indique nombre antiguo de capa', 'Enter parameter label': 'Indique etiqueta de parámetro',
  'Enter parameter type': 'Indique tipo de parámetro', 'Enter percentage length': 'Indique porcentaje de longitud', 'Enter property to change': 'Indique propiedad que desea cambiar',
  'Enter rectangle length': 'Indique longitud del rectángulo', 'Enter style name': 'Indique nombre de estilo', 'Enter text': 'Indique texto',
  'Enter the distance between rows or specify unit cell (---)': 'Indique distancia entre filas o precise celda unitaria (---)', 'Enter the number of columns (|||)': 'Indique número de columnas (|||)',
  'Enter the number of items in the array': 'Indique número de elementos de la matriz', 'Enter the number of operations to undo': 'Indique número de operaciones que desea deshacer',
  'Enter the number of rows (---)': 'Indique número de filas (---)', 'Enter the number of segments': 'Indique número de segmentos', 'Enter variable name': 'Indique nombre de variable',
  'Enter view name to restore': 'Indique nombre de la vista que desea restituir', 'Enter view name to save': 'Indique nombre de la vista que desea guardar', 'Enter view name(s) to delete': 'Indique nombre(s) de vista(s) que desea suprimir',
  'Erase source object after offsetting?': '¿Borrar objeto de origen tras desfasar?', 'Erase source objects?': '¿Borrar objetos de origen?', 'First polygon point': 'Primer punto del polígono',
  'Make visible for': 'Hacer visible para', 'New color': 'Nuevo color', 'Parameter name to delete': 'Nombre del parámetro que desea suprimir', 'Pick internal point': 'Designe punto interno',
  'Remove objects': 'Eliminar objetos', 'Rotate arrayed objects?': '¿Girar objetos de la matriz?', 'Save changes to block?': '¿Guardar cambios en el bloque?',
  'Scale objects based on alignment points?': '¿Escalar objetos según los puntos de alineación?', 'Select 2D polyline': 'Designe polilínea 2D', 'Select a block': 'Designe un bloque',
  'Select a block reference': 'Designe una referencia a bloque', 'Select a line object': 'Designe un objeto de línea', 'Select an annotation object': 'Designe un objeto de anotación',
  'Select an object on the layer to be frozen': 'Designe un objeto de la capa que desea inutilizar', 'Select an object on the layer to be locked': 'Designe un objeto de la capa que desea bloquear',
  'Select an object on the layer to be turned off': 'Designe un objeto de la capa que desea desactivar', 'Select an object on the layer to be unlocked': 'Designe un objeto de la capa que desea desbloquear',
  'Select an object to change': 'Designe un objeto para cambiar', 'Select an object to measure': 'Designe un objeto para medir', 'Select arc or circle': 'Designe arco o círculo',
  'Select arc, circle, line,': 'Designe arco, círculo, línea,', 'Select cutting edges': 'Designe aristas de corte', 'Select destination object(s)': 'Designe objeto(s) de destino',
  'Select dimension': 'Designe cota', 'Select first line': 'Designe primera línea', 'Select first object': 'Designe primer objeto', 'Select hatch object': 'Designe objeto de sombreado',
  'Select object': 'Designe objeto', 'Select object on layer to delete': 'Designe objeto de la capa que desea suprimir', 'Select object on layer to merge': 'Designe objeto de la capa que desea fusionar',
  'Select object on target layer': 'Designe objeto de la capa de destino', 'Select object to dimension': 'Designe objeto que desea acotar', 'Select object to offset': 'Designe objeto a desplazar',
  'Select object whose layer will become current': 'Designe objeto cuya capa pasará a ser la actual', 'Select objects': 'Designe objetos',
  'Select objects on the layer(s) to be isolated': 'Designe objetos de la(s) capa(s) que desea aislar', 'Select objects to be changed to the current layer': 'Designe objetos que desea pasar a la capa actual',
  'Select objects to erase': 'Designe objetos que desea borrar', 'Select objects to hide': 'Designe objetos que desea ocultar', 'Select path curve': 'Designe curva de camino', 'Select polyline': 'Designe polilínea',
  'Select polylines to convert to splines': 'Designe polilíneas que desea convertir en splines', 'Select reference objects': 'Designe objetos de referencia', 'Select second line': 'Designe segunda línea',
  'Select second line or shift-select to apply corner': 'Designe segunda línea o pulse Mayús mientras designa para aplicar esquina',
  'Select second object or shift-select to apply corner': 'Designe segundo objeto o pulse Mayús mientras designa para aplicar esquina', 'Select source object': 'Designe objeto de origen',
  'Select source object or multiple objects to join at once': 'Designe objeto de origen o varios objetos para juntarlos a la vez', 'Source': 'Origen', 'Specify X scale factor': 'Precise factor de escala X',
  'Specify Y scale factor': 'Precise factor de escala Y', 'Specify a point': 'Precise un punto', 'Specify a scale for the pattern': 'Precise escala para el patrón',
  'Specify a second extension line origin': 'Precise origen de la segunda línea de referencia', 'Specify an angle for the pattern': 'Precise ángulo para el patrón',
  'Specify angle of dimension line': 'Precise ángulo de la línea de cota', 'Specify angle of dimension text': 'Precise ángulo del texto de cota', 'Specify angle start point': 'Precise punto inicial del ángulo',
  'Specify angle vertex': 'Precise vértice del ángulo', 'Specify angle vertex point': 'Precise punto de vértice del ángulo', 'Specify axis endpoint of ellipse': 'Precise punto final de eje de elipse',
  'Specify axis endpoint of elliptical arc': 'Precise punto final de eje del arco elíptico', 'Specify base point': 'Precise punto base', 'Specify base point of reflection line': 'Precise punto base de la línea de reflexión',
  'Specify base point or displacement': 'Precise punto base o desplazamiento', 'Specify break point': 'Precise punto de ruptura', 'Specify center of donut': 'Precise centro de la arandela',
  'Specify center of ellipse': 'Precise centro de la elipse', 'Specify center of polygon': 'Precise centro del polígono', 'Specify center point': 'Precise punto central',
  'Specify center point for circle': 'Precise punto central para círculo', 'Specify center point of arc': 'Precise punto central del arco', 'Specify center point of array': 'Precise punto central de la matriz',
  'Specify corner of viewport': 'Precise esquina de la ventana', 'Specify corner of window, enter a scale factor (nX or nXP),': 'Precise esquina de ventana, indique un factor de escala (nX o nXP),',
  'Specify dimension arc line location': 'Precise ubicación del arco de cota', 'Specify dimension line location': 'Precise ubicación de línea de cota', 'Specify displacement': 'Precise desplazamiento',
  'Specify distance to other axis': 'Precise distancia al otro eje', 'Specify end angle': 'Precise ángulo final', 'Specify end point of arc': 'Precise punto final del arco', 'Specify ending width': 'Precise grosor final',
  'Specify endpoint': 'Precise punto final', 'Specify endpoint of arc': 'Precise punto final del arco', 'Specify endpoint of axis': 'Precise punto final del eje', 'Specify endpoint of line': 'Precise punto final de la línea',
  'Specify endpoint of reflection line': 'Precise punto final de la línea de reflexión', 'Specify feature location': 'Precise ubicación de la característica', 'Specify fillet radius': 'Precise radio de empalme',
  'Specify fillet radius for rectangles': 'Precise radio de empalme de rectángulos', 'Specify first angle endpoint': 'Precise primer punto final del ángulo', 'Specify first break point': 'Precise primer punto de ruptura',
  'Specify first chamfer distance': 'Precise primera distancia de chaflán', 'Specify first chamfer distance for rectangles': 'Precise primera distancia de chaflán de rectángulos', 'Specify first corner': 'Precise primera esquina',
  'Specify first corner of stretch frame': 'Precise primera esquina del marco de estiramiento', 'Specify first corner point': 'Precise primer punto de esquina', 'Specify first destination point': 'Precise primer punto de destino',
  'Specify first endpoint of edge': 'Precise primer punto final del lado', 'Specify first extension line origin': 'Precise origen de la primera línea de referencia', 'Specify first fence point': 'Precise primer punto de borde',
  'Specify first leader point,': 'Precise primer punto de directriz,', 'Specify first point': 'Precise primer punto', 'Specify first point of mirror line': 'Precise primer punto de línea de simetría',
  'Specify first point on circle': 'Precise primer punto en el círculo', 'Specify first source point': 'Precise primer punto de origen', 'Specify height': 'Precise altura', 'Specify included angle': 'Precise ángulo incluido',
  'Specify insertion base point': 'Precise punto base de inserción', 'Specify insertion point': 'Precise punto de inserción', 'Specify insertion point of text': 'Precise punto de inserción del texto',
  'Specify inside diameter of donut': 'Precise diámetro interior de la arandela', 'Specify internal point': 'Precise punto interno', 'Specify leader arrowhead location': 'Precise ubicación de la punta de flecha de la directriz',
  'Specify leader endpoint': 'Precise punto final de directriz', 'Specify leader landing location': 'Precise ubicación del enlace de directriz', 'Specify length for rectangles': 'Precise longitud de rectángulos',
  'Specify length of line': 'Precise longitud de la línea', 'Specify length of segment': 'Precise longitud del segmento', 'Specify line width for rectangles': 'Precise grosor de línea de rectángulos',
  'Specify linetype name': 'Precise nombre de tipo de línea', 'Specify lower left corner': 'Precise esquina inferior izquierda', 'Specify minimum length of arc': 'Precise longitud mínima de arco',
  'Specify new end point': 'Precise nuevo punto final', 'Specify new length': 'Precise nueva longitud', 'Specify new linetype scale': 'Precise nueva escala de tipo de línea',
  'Specify new location for dimension text': 'Precise nueva ubicación del texto de cota', 'Specify new width for all segments': 'Precise nuevo grosor para todos los segmentos',
  'Specify next fence point': 'Precise siguiente punto de borde', 'Specify next point': 'Precise punto siguiente', 'Specify offset distance': 'Precise distancia de desfase', 'Specify opposite corner': 'Precise esquina opuesta',
  'Specify other corner point': 'Precise esquina opuesta', 'Specify other endpoint of axis': 'Precise otro punto final del eje', 'Specify outside diameter of donut': 'Precise diámetro exterior de la arandela',
  'Specify parameter location': 'Precise ubicación del parámetro', 'Specify point': 'Precise punto', 'Specify point on object for first tangent of circle': 'Precise punto en objeto para primera tangente del círculo',
  'Specify point on object for second tangent of circle': 'Precise punto en objeto para segunda tangente del círculo', 'Specify point on side to offset': 'Precise punto en lado a desplazar',
  'Specify radius of arc': 'Precise radio del arco', 'Specify radius of circle': 'Precise radio de círculo', 'Specify radius of parameter': 'Precise radio del parámetro', 'Specify reference length': 'Precise longitud de referencia',
  'Specify rotation angle': 'Precise ángulo de rotación', 'Specify rotation angle of text': 'Precise ángulo de rotación del texto', 'Specify rotation around major axis': 'Precise rotación alrededor del eje mayor',
  'Specify scale factor': 'Precise factor de escala', 'Specify scale factor for XYZ axes': 'Precise factor de escala para ejes XYZ', 'Specify second angle endpoint': 'Precise segundo punto final del ángulo',
  'Specify second break point': 'Precise segundo punto de ruptura', 'Specify second chamfer distance': 'Precise segunda distancia de chaflán', 'Specify second chamfer distance for rectangles': 'Precise segunda distancia de chaflán de rectángulos',
  'Specify second destination point': 'Precise segundo punto de destino', 'Specify second endpoint of edge': 'Precise segundo punto final del lado', 'Specify second endpoint of text baseline': 'Precise segundo punto final de la línea base del texto',
  'Specify second extension line origin': 'Precise origen de la segunda línea de referencia', 'Specify second point': 'Precise segundo punto', 'Specify second point of arc': 'Precise segundo punto del arco',
  'Specify second point of mirror line': 'Precise segundo punto de línea de simetría', 'Specify second point on arc': 'Precise segundo punto en el arco', 'Specify second point on circle': 'Precise segundo punto en el círculo',
  'Specify second source point': 'Precise segundo punto de origen', 'Specify side to offset': 'Precise lado a desplazar', 'Specify start angle': 'Precise ángulo inicial', 'Specify start point': 'Precise punto inicial',
  'Specify start point of arc': 'Precise punto inicial del arco', 'Specify start point of text': 'Precise punto inicial del texto', 'Specify tangent direction for the start point of arc': 'Precise dirección tangente para el punto inicial del arco',
  'Specify the angle to fill (+=ccw, -=cw)': 'Precise ángulo que desea rellenar (+=antihorario, -=horario)', 'Specify the distance between columns (|||)': 'Precise distancia entre columnas (|||)', 'Specify the new angle': 'Precise el nuevo ángulo',
  'Specify the reference angle': 'Precise el ángulo de referencia', 'Specify the tangent direction for the start point of arc': 'Precise dirección tangente para el punto inicial del arco', 'Specify third point on circle': 'Precise tercer punto en el círculo',
  'Specify third source point': 'Precise tercer punto de origen', 'Specify through point': 'Precise punto por el que pasa', 'Specify total length': 'Precise longitud total', 'Specify upper right corner': 'Precise esquina superior derecha',
  'Specify value': 'Precise valor', 'Specify width': 'Precise anchura', 'Specify width for rectangles': 'Precise grosor de rectángulos', 'Text': 'Texto', 'Viewport View Locking': 'Bloqueo de vista de ventana',
  'Visibility of existing objects in new state': 'Visibilidad de los objetos existentes en el nuevo estado', 'Specify first corner of window': 'Precise primera esquina de ventana',
  'Specify endpoint of arc or': 'Precise punto final del arco o', 'Specify stretch point': 'Precise punto de estiramiento', 'Specify start point or': 'Precise punto inicial o',
  'Specify center point of arc or': 'Precise punto central del arco o', 'Select object to trim or shift-select to extend': 'Designe el objeto que desea recortar o pulse Mayús mientras designa para alargar',
  'Select object to extend or shift-select to trim': 'Designe el objeto que desea alargar o pulse Mayús mientras designa para recortar', 'Enter a trim mode option': 'Indique una opción de modo de recorte',
  'Enter an extend mode option': 'Indique una opción de modo de alargamiento', 'Specify fillet radius ': 'Precise radio de empalme', 'Enter attribute values': 'Indique valores de atributo',
  'Enter mode': 'Indique modo', 'Enter new value for SNAPUNIT': 'Indique nuevo valor para SNAPUNIT', 'Specify point on arc': 'Precise punto en el arco', 'Specify insertion point or': 'Precise punto de inserción o',
  'Specify the tangent direction': 'Precise la dirección tangente', 'Specify new location': 'Precise nueva ubicación', 'Specify base point or': 'Precise punto base o',
  'Pick internal point or': 'Designe punto interno o', 'Specify internal point or': 'Precise punto interno o', 'Specify scale factor or': 'Precise factor de escala o', 'Specify rotation angle or': 'Precise ángulo de rotación o',
  'Specify start angle or': 'Precise ángulo inicial o', 'Specify end angle or': 'Precise ángulo final o', 'Enter new value': 'Indique nuevo valor', 'Press ESC or ENTER to exit, or right-click to display shortcut menu.': 'Pulse ESC o INTRO para salir, o haga clic con el botón derecho para ver el menú contextual.',
  'Press ESC or ENTER to exit. Use the mouse wheel to zoom and drag to pan.': 'Pulse ESC o INTRO para salir. Use la rueda para zoom y arrastre para encuadrar.', '>> Expression': '>> Expresión',
  'Enter the number of segments or': 'Indique número de segmentos o', 'Specify length of segment or': 'Precise longitud del segmento o', 'Enter name of block to insert ': 'Indique nombre del bloque',
  'Specify start point of text or': 'Precise punto inicial del texto o', 'Select an object to measure or': 'Designe un objeto para medir o', 'Select objects to stretch by crossing-window or crossing-polygon...': 'Designe objetos para estirar con ventana o polígono de captura...',
  'Specify first point of mirror line ': 'Precise primer punto de línea de simetría', 'Enter dimension text ': 'Indique texto de cota', 'Specify dimension line location or': 'Precise ubicación de línea de cota o',
};
Object.assign(SENT, {
  'Specify markup location': 'Precise la ubicación de la marca', 'Enter value set (comma-separated)': 'Indique el conjunto de valores (separados por comas)',
  'Enter duct system': 'Indique el sistema del conducto', 'Enter duct shape': 'Indique la forma del conducto', 'Specify duct width': 'Precise el ancho del conducto',
  'Specify duct height': 'Precise el alto del conducto', 'Specify duct diameter': 'Precise el diámetro del conducto', 'Enter air flow (m³/h)': 'Indique el caudal de aire (m³/h)',
  'Enter elbow radius ratio R/W': 'Indique la relación de radio de codo R/W', 'Select array': 'Designe la matriz', 'Select first point': 'Designe el primer punto',
  'Select second point': 'Designe el segundo punto', 'Select an object': 'Designe un objeto', 'Select second object': 'Designe el segundo objeto', 'Select point': 'Designe un punto',
  'Enter constraint type': 'Indique el tipo de restricción', 'Specify first constraint point': 'Precise el primer punto de restricción', 'Specify second constraint point': 'Precise el segundo punto de restricción',
  'Enter group name': 'Indique el nombre del grupo', 'Enter group description': 'Indique la descripción del grupo', 'Select group': 'Designe el grupo',
  'Enter new name for group': 'Indique el nuevo nombre del grupo', 'Select table': 'Designe la tabla', 'Enter file format': 'Indique el formato de archivo',
  'Enter isometric plane setting': 'Indique el plano isométrico', 'Specify center of isocircle': 'Precise el centro del círculo isométrico',
  'Specify radius of isocircle': 'Precise el radio del círculo isométrico', 'Enter line tag': 'Indique el identificador de la línea', 'Select objects or': 'Designe objetos o',
  'Select objects to erase or': 'Designe objetos que desea borrar o', 'Specify second point or': 'Precise el segundo punto o', 'Specify third source point or': 'Precise el tercer punto de origen o',
  'Select 1 dimension': 'Designe 1 cota', 'Select polyline or': 'Designe polilínea o', 'Specify first corner of stretch frame or': 'Precise la primera esquina del marco de estiramiento o',
});
const SENT_RE = [
  [/^Delete layer\(s\) (.*) and all objects on them\?$/, '¿Suprimir capa(s) $1 y todos sus objetos?'],
  [/^Block "(.*)" already exists\. Redefine it\?$/, 'El bloque "$1" ya existe. ¿Redefinirlo?'],
  [/^Enter name list of layer\(s\) for color (.*)$/, 'Indique lista de nombres de capa(s) para el color $1'],
  [/^Enter name list of layers for linetype "(.*)"$/, 'Indique lista de nombres de capa para el tipo de línea "$1"'],
  [/^Enter new (.*) name$/, 'Indique nuevo nombre de $1'], [/^Enter old (.*) name$/, 'Indique nombre antiguo de $1'],
  [/^Enter new value for (\S+)$/, 'Indique nuevo valor para $1'], [/^Minimum arc length: (\S+)\s+Specify first corner point$/, 'Longitud mínima de arco: $1  Precise primer punto de esquina'],
  [/^Select parameter by name$/, 'Designe parámetro por nombre'], [/^Enter visibility state name$/, 'Indique nombre del estado de visibilidad'],
  [/^Specify (.*) width$/, 'Precise grosor $1'],
  [/^Specify starting (half-)?width$/, 'Precise grosor inicial'],
];
export function trSentence(s) {
  if (!s) return s;
  const P = pack(); if (!P) return s;
  const t = s.trim();
  if (P.SENT[t]) return P.SENT[t];
  for (const [re, rep] of P.SENT_RE) if (re.test(t)) return t.replace(re, rep);
  return s;
}
const caps = (s) => norm(s).replace(/[^A-Z0-9?]/g, '') || norm(s);
export function kwInfo(name) {
  const P = pack(); if (!P) return {};
  const es = P.KW[name] ?? name;
  const esKey = (es.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9?]/g, '')) || norm(es);
  return { es, esKey: esKey.toUpperCase() };
}
// opciones de un mismo mensaje: si dos comparten abreviatura, la segunda se alarga (Escala/Extensión -> EScala)
export function kwInfos(names) {
  const used = new Set(), out = [];
  for (const n of names) {
    const info = kwInfo(n);
    if (info.es && used.has(info.esKey)) {
      const letters = norm(info.es).replace(/[^A-Z0-9]/g, '');
      let L = 2; while (L < letters.length && used.has(letters.slice(0, L))) L++;
      const key = letters.slice(0, L);
      if (!used.has(key)) {
        let c = 0; const es = [...info.es.toLowerCase()].map((ch) => (/[\p{L}\d]/u.test(ch) && c < L ? (c++, ch.toUpperCase()) : ch)).join('');
        out.push({ es, esKey: key }); used.add(key); continue;
      }
    }
    if (info.esKey) used.add(info.esKey);
    out.push(info);
  }
  return out;
}
// traduce un mensaje completo con opciones [..] y valores <..>
export function trPrompt(prompt) {
  const P = pack(); if (!P) return String(prompt || '');
  const { KW, DEFW } = P;
  return String(prompt || '').split('\n').map((line) => {
    if (!line.trim()) return line;
    let rest = line, br = '', def = '';
    const mb = /\[([^\]]*)\]/.exec(rest);
    if (mb) { br = '[' + kwInfos(mb[1].split('/').map((k) => k.trim())).map((x) => x.es).join('/') + ']'; rest = rest.replace(mb[0], '\u0001'); }
    rest = rest.replace(/<([^>]*)>/g, (m, v) => { def += ` <${DEFW[v] ?? (KW[v] && !/^\d/.test(v) ? KW[v] : v)}>`; return ''; });
    const colon = /:\s*$/.test(rest);
    let base = rest.replace(/:\s*$/, '').replace('\u0001', '').trim();
    const hadOr = /\s+or$/.test(base) || /,\s*or$/.test(base);
    base = base.replace(/,?\s+or$/, (m) => (m.startsWith(',') ? ',' : '')).trim();
    let tb = trSentence(base);
    if (tb === base && hadOr) tb = trSentence(base + (base.endsWith(',') ? '' : ''));
    let out = tb;
    if (br) out += (hadOr ? (out ? P.or : '') : (out ? ' ' : '')) + br;
    out += def;
    if (colon) out += ':';
    return out;
  }).join('\n');
}

// ---------- mensajes de la línea de comandos (salida)
const MSG = {
  '*Cancel*': '*Cancelar*', 'Nothing selected.': 'No se ha designado nada.', 'Object is not valid.': 'El objeto no es válido.', 'Invalid selection.': 'Designación no válida.',
  'Invalid option keyword.': 'Opción no válida.', 'Point or option keyword required.': 'Se requiere un punto o una opción.', 'Requires an integer value.': 'Se requiere un valor entero.',
  'Value must be positive and nonzero.': 'El valor debe ser positivo y distinto de cero.', 'Requires numeric distance, second point, or option keyword.': 'Se requiere una distancia numérica, un segundo punto o una opción.',
  'Requires a distance, numberX, or option keyword.': 'Se requiere una distancia, un númeroX o una opción.', 'Requires an integer between 3 and 1024.': 'Se requiere un entero entre 3 y 1024.',
  'All segments already undone.': 'Se han deshecho todos los segmentos.', 'Everything has been undone': 'Se ha deshecho todo', 'Nothing to redo': 'No hay nada que rehacer',
  'Regenerating model.': 'Regenerando modelo.', 'Lines are parallel.': 'Las líneas son paralelas.', 'Radius is too large.': 'El radio es demasiado grande.', 'Circle does not exist.': 'El círculo no existe.',
  'Cannot offset that object.': 'No se puede desfasar ese objeto.', 'Object does not intersect an edge.': 'El objeto no interseca con una arista.', 'Valid hatch boundary not found.': 'No se ha encontrado un contorno de sombreado válido.',
  'Clipboard is empty.': 'El portapapeles está vacío.', 'No previous view saved.': 'No hay vista previa guardada.', 'View not found.': 'Vista no encontrada.', 'Block not found.': 'Bloque no encontrado.',
  'Block name required.': 'Se requiere el nombre del bloque.', 'No objects selected.': 'No hay objetos designados.', 'Block has no attributes.': 'El bloque no tiene atributos.', 'Name not found.': 'Nombre no encontrado.',
  'Object selected is not a polyline.': 'El objeto designado no es una polilínea.', 'Object selected is not an arc, circle or line.': 'El objeto designado no es un arco, círculo o línea.',
  'Use grips to edit vertices.': 'Use los pinzamientos para editar los vértices.', 'Invalid length.': 'Longitud no válida.', 'Invalid': 'No válido', 'Rotating a copy of the selected objects.': 'Girando una copia de los objetos designados.',
  'Current settings:  Copy mode = Multiple': 'Parámetros actuales:  Modo de copia = Múltiple', 'Current positive angle in UCS:  ANGDIR=counterclockwise  ANGBASE=0': 'Ángulo positivo actual en SCP:  ANGDIR=antihorario  ANGBASE=0',
  'Select cutting edges ...': 'Designe aristas de corte...', 'Selecting everything...': 'Designando todo...', 'Analyzing the selected data...': 'Analizando los datos designados...',
  'Select objects to stretch by crossing-window or crossing-polygon...': 'Designe objetos para estirar con ventana o polígono de captura...', 'Frames are displayed.': 'Se muestran los marcos.',
  'Enter attribute values': 'Indique valores de atributo', '** Command not allowed in Model Tab **': '** Comando no permitido en la ficha Modelo **', '** Close the Block Editor first **': '** Cierre primero el Editor de bloques **',
  '** Command only valid in Block Editor **': '** Comando válido solo en el Editor de bloques **', '** That command may not be invoked transparently **': '** Ese comando no se puede ejecutar de forma transparente **',
  'Already in Block Editor.': 'Ya está en el Editor de bloques.', 'Not in Block Editor.': 'No está en el Editor de bloques.', 'No parameters defined.': 'No hay parámetros definidos.', 'Parameter not found.': 'Parámetro no encontrado.',
  'Block already has a visibility parameter.': 'El bloque ya tiene un parámetro de visibilidad.', 'Add a Visibility parameter first (BPARAMETER > Visibility).': 'Añada primero un parámetro de visibilidad (PARAMB > Visibilidad).',
  'Use BVSTATE to create visibility states and BVHIDE/BVSHOW to set object visibility.': 'Use ESTADOVISB para crear estados de visibilidad y OCULTARVISB/MOSTRARVISB para la visibilidad de objetos.',
  'No visibility parameter.': 'No hay parámetro de visibilidad.', 'State not found.': 'Estado no encontrado.', 'Cannot delete the only state.': 'No se puede suprimir el único estado.',
  'Specify objects to stretch': 'Precise objetos para estirar', 'Specify objects for Rotate action': 'Precise objetos para la acción Girar', 'Specify objects for Flip action': 'Precise objetos para la acción Simetría',
  'All layers have been turned on.': 'Se han activado todas las capas.', 'All layers have been thawed.': 'Se han reutilizado todas las capas.', 'Layers isolated by LAYISO have been restored.': 'Se han restablecido las capas aisladas por CAPAISO.',
  'Cannot freeze the current layer.': 'No se puede inutilizar la capa actual.', 'Cannot set a frozen layer current.': 'No se puede hacer actual una capa inutilizada.', 'There are no active model space viewports.': 'No hay ventanas de espacio modelo activas.',
  'Cannot delete the only layout.': 'No se puede suprimir la única presentación.', '0 objects joined': '0 objetos unidos', 'Radius must be > 0 for arcs.': 'El radio debe ser > 0 para arcos.',
  'Unknown variable name.  Type SETVAR ? for a list of variables.': 'Nombre de variable desconocido. Escriba MODIVAR ? para ver la lista de variables.',
  'Current active settings:  Color Layer Ltype Ltscale Lineweight Transparency Thickness PlotStyle Dim Text Hatch Polyline Viewport Table Material Multileader Center object': 'Parámetros activos actuales:  Color Capa Tipolín Escalatl Grosorlín Transparencia Altura Estilotrazado Cota Texto Sombreado Polilínea Ventana Tabla Material Directrizm',
  'Interfaz clásica (R12): barra de menús + menú de pantalla.': 'Interfaz clásica (R12): barra de menús + menú de pantalla.', 'Auditing Header': 'Auditando cabecera', 'Auditing Tables': 'Auditando tablas',
  'Auditing Entities Pass 1': 'Auditando entidades, paso 1', 'Total errors found 0 fixed 0': 'Total de errores encontrados 0 corregidos 0', 'of': 'de', '1 was on a locked layer.': '1 estaba en una capa bloqueada.',
  'Expects a point or Window/Last/Crossing/BOX/ALL/Fence/WPolygon/CPolygon/Add/Remove/Previous': 'Se espera un punto o Ventana/Último/Captura/Todo/Borde/PolígonoV/PolígonoC/Añadir/Suprimir/Previo',
  '*Invalid selection*': '*Designación no válida*', 'Linetype not found.': 'Tipo de línea no encontrado.',
  'Value must be nonzero.': 'El valor debe ser distinto de cero.', 'Value must be positive.': 'El valor debe ser positivo.',
  'Cannot fillet those objects.': 'No se pueden empalmar esos objetos.', 'Cannot chamfer those objects.': 'No se pueden achaflanar esos objetos.',
};
const MSG_RE = [
  [/^Command: (.*)$/, 'Comando: $1'], [/^(\d+) found, (\d+) total$/, '$1 encontrado(s), $2 total'], [/^(\d+) found$/, '$1 encontrado(s)'],
  [/^Unknown command "(.*)"\.\s+Press F1 for help\.$/, 'Comando desconocido "$1". Pulse F1 para obtener ayuda.'],
  [/^\*\* (.*) command not allowed while (.*) is active \*\*$/, '** El comando $1 no está permitido mientras $2 está activo **'],
  [/^Resuming (.*) command\.$/, 'Reanudando el comando $1.'], [/^Dimension text = (.*)$/, 'Texto de cota = $1'],
  [/^Current line-width is (.*)$/, 'El grosor de línea actual es $1'], [/^Current settings: Mode = TRIM, Radius = (.*)$/, 'Parámetros actuales: Modo = RECORTAR, Radio = $1'],
  [/^\("TRIM" mode\) Current chamfer Dist1 = (.*), Dist2 = (.*)$/, '(Modo "RECORTAR") Distancia1 de chaflán actual = $1, Distancia2 = $2'],
  [/^Current settings: Projection=UCS, Edge=None, Mode=(\w+)$/, 'Parámetros actuales: Proyección=SCP, Arista=Ninguna, Modo=$1'],
  [/^Current settings: Erase source=(\w+)\s+Layer=Source\s+OFFSETGAPTYPE=0$/, 'Parámetros actuales: Borrar origen=$1  Capa=Origen  OFFSETGAPTYPE=0'],
  [/^Current text style:\s+"(.*)"\s+Text height:\s+(\S+)\s+Annotative:\s+No(.*)$/, 'Estilo de texto actual: "$1"  Altura de texto: $2  Anotativo: No$3'],
  [/^Current point modes:\s+PDMODE=(\S+)\s+PDSIZE=(\S+)$/, 'Modos de punto actuales: PDMODE=$1  PDSIZE=$2'], [/^Current layer:\s+"(.*)"$/, 'Capa actual: "$1"'],
  [/^Current length: (.*)$/, 'Longitud actual: $1'], [/^Distance = (.*),\s+Angle in XY Plane = (.*), Angle from XY Plane = 0$/, 'Distancia = $1,  Ángulo en plano XY = $2, Ángulo desde plano XY = 0'],
  [/^Area = (.*), (Perimeter|Circumference) = (.*)$/, (m, a, k, p) => `Área = ${a}, ${k === 'Perimeter' ? 'Perímetro' : 'Circunferencia'} = ${p}`],
  [/^(\d+) objects? exploded\.$/, '$1 objeto(s) descompuesto(s).'], [/^1 object not able to be exploded\.$/, '1 objeto no se ha podido descomponer.'], [/^1 was not able to be exploded\.$/, '1 objeto no se ha podido descomponer.'],
  [/^Block "(.*)" defined with (\d+) objects\.$/, 'Bloque "$1" definido con $2 objetos.'], [/^Block "(.*)" saved\.$/, 'Bloque "$1" guardado.'], [/^Block "(.*)" not found\.$/, 'No se encuentra el bloque "$1".'],
  [/^(\d+) blocks? deleted\. (\d+) layers? deleted\.$/, '$1 bloque(s) suprimido(s). $2 capa(s) suprimida(s).'], [/^(\d+) objects converted to (\d+) polylines?$/, '$1 objetos convertidos en $2 polilínea(s)'],
  [/^(\d+) segments added to polyline$/, '$1 segmentos añadidos a la polilínea'], [/^(\d+) lines were (filleted|chamfered)$/, (m, n, k) => `${n} líneas ${k === 'filleted' ? 'empalmadas' : 'achaflanadas'}`],
  [/^(\d+) duplicate\(s\) deleted$/, '$1 duplicado(s) suprimido(s)'], [/^(\d+) objects selected\.$/, '$1 objetos designados.'], [/^(\d+) instances of block "(.*)"\.$/, '$1 inserciones del bloque "$2".'],
  [/^(.*) is now the current layer\.$/, '$1 es ahora la capa actual.'], [/^(.*) successfully loaded\.$/, '$1 cargado correctamente.'], [/^(.*) loaded \(Startup Suite\)\.$/, '$1 cargado (Grupo de inicio).'],
  [/^Text style "(.*)" is now current\.$/, 'El estilo de texto "$1" es ahora el actual.'], [/^Linetype "(.*)" loaded\.$/, 'Tipo de línea "$1" cargado.'], [/^Linetype "(.*)" not found\.$/, 'Tipo de línea "$1" no encontrado.'],
  [/^Cannot find layer "(.*)"\.$/, 'No se encuentra la capa "$1".'], [/^Cannot freeze layer "(.*)"\.\s+It is the CURRENT layer\.$/, 'No se puede inutilizar la capa "$1". Es la capa ACTUAL.'],
  [/^Layers? (.*) ha(s|ve) been isolated\.$/, 'Capa(s) $1 aislada(s).'], [/^(\d+) object\(s\) changed to layer "(.*)" \(the current layer\)\.$/, '$1 objeto(s) cambiado(s) a la capa "$2" (la capa actual).'],
  [/^(.*) parameter is not supported in this version\. Use Linear, Rotation, Flip or Visibility\.$/, 'El parámetro $1 no está disponible. Use Lineal, Rotación, Simetría o Visibilidad.'],
  [/^Visibility states: (.*)$/, 'Estados de visibilidad: $1'], [/^Delete layer\(s\) (.*) and all objects on them\?(.*)$/, '¿Suprimir capa(s) $1 y todos sus objetos?$2'],
  [/^BOUNDARY created (\d+) polylines?$/, 'CONTORNO ha creado $1 polilínea(s)'], [/^Current time:\s+(.*)$/, 'Hora actual:             $1'], [/^This drawing has (\d+) objects in model space\.$/, 'Este dibujo tiene $1 objetos en el espacio modelo.'],
  [/^(\d+) objects in (.*)$/, '$1 objetos en $2'], [/^Model space uses\s+(.*)$/, 'El espacio modelo usa  $1'], [/^Blocks: (\d+)\s+Layers: (\d+)$/, 'Bloques: $1  Capas: $2'],
  [/^Handle seed (.*)$/, 'Semilla de identificadores $1'], [/^Really want layer (.*) \(the CURRENT layer\) off\?$/, '¿Desactivar la capa $1 (la capa ACTUAL)?'],
  [/^<(F\d+) toggled>$/, '<$1 conmutado>'], [/^; error en (.*)$/, '; error en $1'], [/^Rotating a copy/, 'Girando una copia'],
  [/^Unknown command "(.*)"\.$/, 'Comando desconocido "$1".'], [/^Error: (.*)$/, 'Error: $1'],
  [/^Specify objects/, (m) => m],
];
Object.assign(MSG, {
  'No lookup parameter.': 'No hay parámetro de consulta.', 'No ducts selected.': 'No hay conductos designados.', 'No standard size meets the criteria.': 'Ningún tamaño normalizado cumple los criterios.',
  'No objects found.': 'No se han encontrado objetos.', 'Object is not a member of a group.': 'El objeto no pertenece a ningún grupo.', 'Requires a value.': 'Se requiere un valor.',
});
MSG_RE.unshift(
  [/^(.*) parameter is not supported in this version\. Use Linear, Polar, XY, Rotation, Flip, Visibility or Lookup\.$/, 'El parámetro $1 no está disponible. Use Lineal, Polar, XY, Rotación, Simetría, Visibilidad o Consulta.'],
  [/^(\d+) constraint\(s\) applied\.$/, '$1 restricción(es) aplicada(s).'], [/^(\d+) constraint\(s\) removed\.$/, '$1 restricción(es) suprimida(s).'],
  [/^Group "(.*)" has been created\.$/, 'Se ha creado el grupo "$1".'], [/^Group (.*) already exists\.$/, 'El grupo $1 ya existe.'], [/^Group (.*) exploded\.$/, 'Grupo $1 descompuesto.'],
  [/^Duct: (.*) mm, (.*) m³\/h, (.*)$/, 'Conducto: $1 mm, $2 m³/h, $3'], [/^Delta X = (.*), Delta Y = (.*), Delta Z = 0\.0000$/, 'Incremento X = $1, Incremento Y = $2, Incremento Z = 0.0000'],
  [/^Distance = (.*),\s+Angle in XY Plane = (.*), Angle from XY Plane = 0\nDelta X = (.*), Delta Y = (.*), Delta Z = 0\.0000$/, 'Distancia = $1,  Ángulo en plano XY = $2, Ángulo desde plano XY = 0\nIncremento X = $3, Incremento Y = $4, Incremento Z = 0.0000'],
);
export function trMsg(s) {
  const str = String(s);
  const P = pack();
  if (P) {
    if (P.MSG[str]) return P.MSG[str];
    for (const [re, rep] of P.MSG_RE) if (re.test(str)) return str.replace(re, rep);
  }
  return tKnown(str); // mensajes escritos en castellano en el código
}

// ---------- nombres de comando en castellano (AutoCAD en español) -> comando interno
export const CMD_ES = {
  LINEA: 'LINE', POL: 'PLINE', POLILINEA: 'PLINE', CIRCULO: 'CIRCLE', ARCO: 'ARC', RECTANGULO: 'RECTANG', POLIGONO: 'POLYGON', ELIPSE: 'ELLIPSE', PUNTO: 'POINT',
  LINEAX: 'XLINE', RAYO: 'RAY', ARANDELA: 'DONUT', NUBEREV: 'REVCLOUD', COBERTURA: 'WIPEOUT', CONTORNO: 'BOUNDARY', DESPLAZA: 'MOVE', COPIA: 'COPY', GIRA: 'ROTATE',
  ESCALA: 'SCALE', SIMETRIA: 'MIRROR', EQDIST: 'OFFSET', DESFASE: 'OFFSET', RECORTA: 'TRIM', ALARGA: 'EXTEND', BORRA: 'ERASE', UY: 'OOPS', DESCOMP: 'EXPLODE',
  EMPALME: 'FILLET', CHAFLAN: 'CHAMFER', MATRIZ: 'ARRAY', MATRIZRECT: 'ARRAYRECT', MATRIZPOLAR: 'ARRAYPOLAR', MATRIZCAMINO: 'ARRAYPATH', ESTIRA: 'STRETCH',
  PARTE: 'BREAK', PARTEENPUNTO: 'BREAKATPOINT', JUNTA: 'JOIN', LONGITUD: 'LENGTHEN', EDITPOL: 'PEDIT', IGUALARPROP: 'MATCHPROP', CAMBIAPROP: 'CHPROP', CAMBIA: 'CHPROP',
  ORDENAOBJETOS: 'DRAWORDER', ALINEAR: 'ALIGN', DIST: 'DIST', AREA: 'AREA', LIST: 'LIST', LISTA: 'LIST', DIVIDE: 'DIVIDE', GRADUA: 'MEASURE', DESHACER: 'UNDO',
  REHACER: 'REDO', TEXTO: 'TEXT', TEXTODIN: 'TEXT', TEXTOM: 'MTEXT', DDEDIC: 'DDEDIT', EDITTEXTO: 'DDEDIT', ESTILO: 'STYLE', ACOLINEAL: 'DIMLINEAR', ACOALINEADA: 'DIMALIGNED',
  ACORADIO: 'DIMRADIUS', ACODIAMETRO: 'DIMDIAMETER', ACOANGULO: 'DIMANGULAR', ACOCOORDENADA: 'DIMORDINATE', ACOCONTINUA: 'DIMCONTINUE', ACOLINEABASE: 'DIMBASELINE',
  ACOTEDIC: 'DIMTEDIT', ACOESTIL: 'DIMSTYLE', ESTILOCOTA: 'DIMSTYLE', DIRECTRIZ: 'QLEADER', DIRECTRIZR: 'QLEADER', DIRECTRIZM: 'MLEADER', SOMBCONT: 'HATCH', SOMBREADO: 'HATCH',
  '-SOMBCONT': '-HATCH', EDITSOMB: 'HATCHEDIT', BLOQUE: 'BLOCK', '-BLOQUE': '-BLOCK', INSERTAR: 'INSERT', BLOQUEDISC: 'WBLOCK', ATRDEF: 'ATTDEF', EDITATRMEJ: 'EATTEDIT',
  EDITATR: 'EATTEDIT', SINCATR: 'ATTSYNC', EDITARBLOQUE: 'BEDIT', CERRARBLOQUE: 'BCLOSE', GUARDARBLOQUE: 'BSAVE', PARAMB: 'BPARAMETER', ACCIONB: 'BACTION',
  ESTADOVISB: 'BVSTATE', OCULTARVISB: 'BVHIDE', MOSTRARVISB: 'BVSHOW', LIMPIA: 'PURGE', CAMBIANOM: 'RENAME', CAPA: 'LAYER', '-CAPA': '-LAYER', CAPAISO: 'LAYISO',
  CAPADESAISLAR: 'LAYUNISO', CAPADES: 'LAYOFF', CAPAACT: 'LAYON', CAPAINUT: 'LAYFRZ', CAPAREUT: 'LAYTHW', CAPABLOQ: 'LAYLCK', CAPADESBLOQ: 'LAYULK', CAPAACTUAL: 'LAYMCUR',
  CAPAFUS: 'LAYMRG', CAPASUP: 'LAYDEL', CAPACAMB: 'LAYCUR', TIPOLIN: 'LINETYPE', ESCALATL: 'LTSCALE', GROSORLIN: 'LWEIGHT', UNIDADES: 'UNITS', OPCIONES: 'OPTIONS',
  PARAMSDIB: 'DSETTINGS', REFENT: 'DSETTINGS', '-REFENT': '-OSNAP', ORTO: 'ORTHO', REJILLA: 'GRID', FORZCURSOR: 'SNAP', MODIVAR: 'SETVAR', ENCUADRE: 'PAN', REDIBUJA: 'REDRAW',
  VISTA: 'VIEW', NUEVO: 'NEW', ABRIR: 'OPEN', GUARDAR: 'QSAVE', GUARDARR: 'QSAVE', GUARDARCOMO: 'SAVEAS', SALDXF: 'DXFOUT', ENTDXF: 'DXFIN', IMPORTAR: 'IMPORT',
  EXPORTAR: 'EXPORT', EXPORTARPDF: 'EXPORTPDF', TRAZAR: 'PLOT', IMPRIMIR: 'PLOT', CERRAR: 'CLOSE', PRESENTACION: 'LAYOUT', VMULT: 'MVIEW', EMODELO: 'MSPACE', EPAPEL: 'PSPACE',
  COPIARPORTA: 'COPYCLIP', CORTARPORTA: 'CUTCLIP', PEGARPORTA: 'PASTECLIP', COPIABASE: 'COPYBASE', PEGABLOQUE: 'PASTEBLOCK', PEGAORIG: 'PASTEORIG', DESIGNA: 'SELECT',
  SELECRAPIDA: 'QSELECT', SELECCIONARSIMILAR: 'SELECTSIMILAR', PROPIEDADES: 'PROPERTIES', AYUDA: 'HELP', BUSCAR: 'FIND', CARGAAP: 'APPLOAD', PERSONALIZAR: 'CUI',
  PANTTEXT: 'TEXTSCR', PANTGRAF: 'GRAPHSCR', CALCULADORA: 'CAL', CUENTA: 'COUNT', CONTAR: 'COUNT', AUDITAR: 'AUDIT', SUPRIMIRDUP: 'OVERKILL', AISLAROBJETOS: 'ISOLATEOBJECTS',
  OCULTAROBJETOS: 'HIDEOBJECTS', DESAISLAROBJETOS: 'UNISOLATEOBJECTS', ESTADO: 'STATUS', HORA: 'TIME', LIMITES: 'LIMITS', TIPODEPUNTO: 'DDPTYPE', ESTILOPUNTO: 'DDPTYPE',
  RELLENA: 'FILL', TEXTORAP: 'QTEXT', VISGROSORLIN: 'LWDISPLAY', MENUPANTALLA: 'SCREENMENU', BARRAMENUS: 'MENUBAR', CINTA: 'RIBBON', CERRARCINTA: 'RIBBONCLOSE', CLASICO: 'CLASSIC',
  GRUPO: 'GROUP', DESAGRUPAR: 'UNGROUP', EDITARGRUPO: 'GROUPEDIT', RESTGEOM: 'GEOMCONSTRAINT', RESTCOTA: 'DIMCONSTRAINT', RESTAUTO: 'AUTOCONSTRAIN',
  SUPRRESTR: 'DELCONSTRAINT', BARRARESTR: 'CONSTRAINTBAR', VISRESTCOTA: 'DCDISPLAY', PARAMETROS: 'PARAMETERS', TABLA: 'TABLE', EDITTABLA: 'TABLEDIT', EXPORTTABLA: 'TABLEEXPORT',
  CONDUCTO: 'DUCT', NUBE: 'CLOUD', DIMCONDUCTO: 'DUCTSIZE', PERDIDAS: 'DUCTCALC', INSERTBIBL: 'LIBINSERT', EXTRACCIONDATOS: 'DATAEXTRACTION', CAJETIN: 'TITLEBLOCK', DIBISO: 'ISODRAFT', PLANOISO: 'ISOPLANE',
  CIRCULOISO: 'ISOCIRCLE', TUBERIA: 'PIPE', ADMESTILOS: 'STYLESMANAGER', PUBLICAR: 'PUBLISH', GUARDARNUBE: 'CLOUDSAVE', ABRIRNUBE: 'CLOUDOPEN', VERSIONES: 'CLOUDVERSIONS',
  MARCA: 'MARKUP', MARCAS: 'MARKUPS', REFX: 'XREF', PROPSDIB: 'DWGPROPS', CAMPO: 'FIELD', ACTCAMPO: 'UPDATEFIELD', NUEVORAPIDO: 'QNEW',
  PALETAPROPCERRAR: 'PROPERTIESCLOSE', ACERCADE: 'ABOUT', RESTAURA: 'RECOVER', ENVIARATRAS: 'HATCHTOBACK', TEXTODELANTE: 'TEXTTOFRONT',
};
// alias cortos en castellano (no pisan alias ingleses)
export const ALIAS_ES = {
  LI: 'LINE', CI: 'CIRCLE', AR: 'ARC', DS: 'MOVE', GI: 'ROTATE', ES: 'SCALE', SI: 'MIRROR', EQ: 'OFFSET', RR: 'TRIM', AL: 'EXTEND', B: 'ERASE', DC: 'EXPLODE',
  EM: 'FILLET', CH: 'CHAMFER', MZ: 'ARRAY', ET: 'STRETCH', PA: 'BREAK', JU: 'JOIN', EP: 'PEDIT', IP: 'MATCHPROP', TX: 'TEXT', TM: 'MTEXT', SB: 'HATCH', BL: 'BLOCK',
  IN: 'INSERT', CA: 'LAYER', TL: 'LINETYPE', EN: 'PAN', AC: 'DIMLINEAR', AA: 'AREA', PR: 'PROPERTIES', DR: 'DRAWORDER', RG: 'REGEN', DB: 'BEDIT',
};
// nombre en castellano para mostrar (eco y ayuda)
const revName = (map) => { const m = {}; for (const [k, en] of Object.entries(map)) if (!m[en] && !k.startsWith('-')) m[en] = k; return m; };
export const ES_NAME = revName(CMD_ES);
export const GL_NAME = revName(GL.CMD_GL);
const normKeys = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [norm(k), v]));
export const CMD_GL = normKeys(GL.CMD_GL), ALIAS_GL = GL.ALIAS_GL, OSNAP_GL = GL.OSNAP_GL;
export const CMD_PT = normKeys(PT.CMD), CMD_CA = normKeys(CA.CMD);
export const PT_NAME = revName(PT.CMD), CA_NAME = revName(CA.CMD);
// comandos del idioma activo (tienen prioridad sobre los alias)
export const locCmd = (u) => (LANG === 'gl' ? CMD_GL[u] : LANG === 'pt' ? CMD_PT[u] : LANG === 'ca' ? CMD_CA[u] : null) || null;
// nombre del comando en el idioma activo ('' en inglés)
export const locName = (n) => (LANG === 'es' ? ES_NAME[n] : LANG === 'gl' ? GL_NAME[n] || ES_NAME[n] : LANG === 'pt' ? PT_NAME[n] : LANG === 'ca' ? CA_NAME[n] : '') || '';
// referencias a objetos del idioma activo
export const locOsnap = (u) => (LANG === 'es' ? OSNAP_ES[u] : LANG === 'gl' ? (GL.OSNAP_GL[u] || OSNAP_ES[u]) : LANG === 'pt' ? (PT.OSNAP[u] || OSNAP_ES[u]) : LANG === 'ca' ? (CA.OSNAP[u] || OSNAP_ES[u]) : null);

let PACKS = null;
function pack() {
  PACKS ||= {
    es: { KW, DEFW, SENT, SENT_RE, MSG, MSG_RE, or: ' o ' },
    gl: { KW: GL.KW_GL, DEFW: GL.DEFW_GL, SENT: GL.SENT_GL, SENT_RE: GL.SENT_RE_GL, MSG: GL.MSG_GL, MSG_RE: GL.MSG_RE_GL, or: ' ou ' },
    pt: { KW: PT.KW, DEFW: PT.DEFW, SENT: PT.SENT, SENT_RE: PT.SENT_RE, MSG: PT.MSG, MSG_RE: PT.MSG_RE, or: ' ou ' },
    ca: { KW: CA.KW, DEFW: CA.DEFW, SENT: CA.SENT, SENT_RE: CA.SENT_RE, MSG: CA.MSG, MSG_RE: CA.MSG_RE, or: ' o ' },
  };
  return PACKS[LANG] || null;
}

// referencias a objetos en castellano (modificadores de un uso)
export const OSNAP_ES = { FIN: 'end', MED: 'mid', CEN: 'cen', NOD: 'nod', CUA: 'qua', INT: 'int', INS: 'ins', PER: 'per', TAN: 'tan', CER: 'nea', NIN: 'non', NINGUNO: 'non', EXT: 'ext', APA: 'app' };
