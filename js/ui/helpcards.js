// v8 — fichas de ayuda F1 por comando en castellano, galego, English, português y català.
import { getLang, dispCmd } from '../core/i18n.js';
import { TABS } from './ribbon.js';
import { h } from './dom.js';

// NOMBRE: [es, gl, en, pt, ca]
export const CARDS = {
  LINE: ['Crea segmentos de línea rectos consecutivos.', 'Crea segmentos de liña rectos consecutivos.', 'Creates straight line segments.', 'Cria segmentos de linha retos consecutivos.', 'Crea segments de línia rectes consecutius.'],
  PLINE: ['Crea una polilínea 2D formada por segmentos rectos y arcos.', 'Crea unha polilíña 2D de segmentos rectos e arcos.', 'Creates a 2D polyline of line and arc segments.', 'Cria uma polilinha 2D com segmentos retos e arcos.', 'Crea una polilínia 2D de segments rectes i arcs.'],
  CIRCLE: ['Crea un círculo por centro y radio, diámetro, 2P, 3P o tangentes.', 'Crea un círculo por centro e raio, diámetro, 2P, 3P ou tanxentes.', 'Creates a circle by center and radius, diameter, 2P, 3P or tangents.', 'Cria um círculo por centro e raio, diâmetro, 2P, 3P ou tangentes.', 'Crea un cercle per centre i radi, diàmetre, 2P, 3P o tangents.'],
  ARC: ['Crea un arco por tres puntos, centro, inicio y fin, o ángulo.', 'Crea un arco por tres puntos, centro, inicio e fin, ou ángulo.', 'Creates an arc from three points, center/start/end or angle.', 'Cria um arco por três pontos, centro, início e fim, ou ângulo.', 'Crea un arc per tres punts, centre, inici i final, o angle.'],
  RECTANG: ['Crea una polilínea rectangular, con chaflanes o empalmes opcionales.', 'Crea unha polilíña rectangular, con chafráns ou empalmes opcionais.', 'Creates a rectangular polyline, optionally chamfered or filleted.', 'Cria uma polilinha retangular, com chanfros ou concordâncias.', 'Crea una polilínia rectangular, amb xamfrans o arrodoniments.'],
  POLYGON: ['Crea un polígono regular inscrito o circunscrito.', 'Crea un polígono regular inscrito ou circunscrito.', 'Creates an inscribed or circumscribed regular polygon.', 'Cria um polígono regular inscrito ou circunscrito.', 'Crea un polígon regular inscrit o circumscrit.'],
  ELLIPSE: ['Crea una elipse o un arco elíptico.', 'Crea unha elipse ou un arco elíptico.', 'Creates an ellipse or elliptical arc.', 'Cria uma elipse ou um arco elíptico.', 'Crea una el·lipse o un arc el·líptic.'],
  SPLINE: ['Crea una curva suave por puntos de ajuste o de control.', 'Crea unha curva suave por puntos de axuste ou control.', 'Creates a smooth curve through fit or control points.', 'Cria uma curva suave por pontos de ajuste ou controlo.', 'Crea una corba suau per punts d’ajust o de control.'],
  HATCH: ['Rellena un área cerrada con un patrón, sólido o degradado; asociativo si HPASSOC=1.', 'Enche unha área pechada cun patrón, sólido ou degradado; asociativo se HPASSOC=1.', 'Fills an enclosed area with a pattern, solid or gradient; associative when HPASSOC=1.', 'Preenche uma área fechada com padrão, sólido ou gradiente; associativo se HPASSOC=1.', 'Omple una àrea tancada amb un patró, sòlid o degradat; associatiu si HPASSOC=1.'],
  TEXT: ['Crea texto de una línea.', 'Crea texto dunha liña.', 'Creates single-line text.', 'Cria texto de uma linha.', 'Crea text d’una línia.'],
  MTEXT: ['Crea texto de líneas múltiples con formato.', 'Crea texto de liñas múltiples con formato.', 'Creates formatted multiline text.', 'Cria texto multilinha formatado.', 'Crea text multilínia amb format.'],
  MOVE: ['Desplaza objetos una distancia y dirección.', 'Despraza obxectos unha distancia e dirección.', 'Moves objects a distance in a direction.', 'Desloca objetos uma distância e direção.', 'Desplaça objectes una distància i direcció.'],
  COPY: ['Copia objetos a una distancia y dirección.', 'Copia obxectos a unha distancia e dirección.', 'Copies objects a distance in a direction.', 'Copia objetos a uma distância e direção.', 'Copia objectes a una distància i direcció.'],
  ROTATE: ['Gira objetos alrededor de un punto base.', 'Xira obxectos arredor dun punto base.', 'Rotates objects around a base point.', 'Roda objetos em torno de um ponto base.', 'Gira objectes al voltant d’un punt base.'],
  SCALE: ['Amplía o reduce objetos manteniendo sus proporciones.', 'Amplía ou reduce obxectos mantendo as proporcións.', 'Enlarges or reduces objects proportionally.', 'Amplia ou reduz objetos mantendo as proporções.', 'Amplia o redueix objectes proporcionalment.'],
  MIRROR: ['Crea una copia simétrica de los objetos.', 'Crea unha copia simétrica dos obxectos.', 'Creates a mirrored copy of objects.', 'Cria uma cópia espelhada dos objetos.', 'Crea una còpia simètrica dels objectes.'],
  OFFSET: ['Crea curvas paralelas o círculos concéntricos.', 'Crea curvas paralelas ou círculos concéntricos.', 'Creates parallel curves and concentric circles.', 'Cria curvas paralelas e círculos concêntricos.', 'Crea corbes paral·leles i cercles concèntrics.'],
  TRIM: ['Recorta objetos hasta las aristas de otros.', 'Recorta obxectos ata as arestas doutros.', 'Trims objects to meet the edges of others.', 'Apara objetos até às arestas de outros.', 'Retalla objectes fins a les arestes d’altres.'],
  EXTEND: ['Alarga objetos hasta las aristas de otros.', 'Alonga obxectos ata as arestas doutros.', 'Extends objects to meet the edges of others.', 'Estende objetos até às arestas de outros.', 'Allarga objectes fins a les arestes d’altres.'],
  FILLET: ['Empalma dos objetos con un arco de radio dado.', 'Empalma dous obxectos cun arco de raio dado.', 'Rounds the corner between two objects with an arc.', 'Concorda dois objetos com um arco de raio dado.', 'Arrodoneix dos objectes amb un arc de radi donat.'],
  CHAMFER: ['Achaflana la esquina entre dos líneas.', 'Achafrana a esquina entre dúas liñas.', 'Bevels the corner between two lines.', 'Chanfra o canto entre duas linhas.', 'Xamfrana la cantonada entre dues línies.'],
  ARRAY: ['Crea copias en matriz rectangular, polar o en trayectoria.', 'Crea copias en matriz rectangular, polar ou en traxectoria.', 'Creates rectangular, polar or path arrays.', 'Cria matrizes retangulares, polares ou em trajetória.', 'Crea matrius rectangulars, polars o en trajectòria.'],
  STRETCH: ['Estira los objetos que cruza una ventana de captura.', 'Estira os obxectos que cruza unha xanela de captura.', 'Stretches objects crossed by a crossing window.', 'Estica os objetos cruzados por uma janela de captura.', 'Estira els objectes que creua una finestra de captura.'],
  ERASE: ['Borra objetos del dibujo.', 'Borra obxectos do debuxo.', 'Removes objects from the drawing.', 'Apaga objetos do desenho.', 'Esborra objectes del dibuix.'],
  EXPLODE: ['Descompone un objeto compuesto en sus componentes.', 'Descompón un obxecto composto nas súas partes.', 'Breaks a compound object into its components.', 'Decompõe um objeto composto nos seus componentes.', 'Descompon un objecte compost en els seus components.'],
  JOIN: ['Une objetos colineales o contiguos en uno solo.', 'Une obxectos colineais ou contiguos nun só.', 'Joins collinear or contiguous objects into one.', 'Une objetos colineares ou contíguos num só.', 'Uneix objectes col·lineals o contigus en un de sol.'],
  BREAK: ['Parte un objeto entre dos puntos.', 'Parte un obxecto entre dous puntos.', 'Breaks an object between two points.', 'Quebra um objeto entre dois pontos.', 'Trenca un objecte entre dos punts.'],
  DIMLINEAR: ['Acota distancias horizontales o verticales.', 'Cota distancias horizontais ou verticais.', 'Creates horizontal or vertical dimensions.', 'Cota distâncias horizontais ou verticais.', 'Acota distàncies horitzontals o verticals.'],
  DIMALIGNED: ['Acota alineado con los puntos de origen.', 'Cota aliñado cos puntos de orixe.', 'Creates a dimension aligned with the origin points.', 'Cota alinhado com os pontos de origem.', 'Acota alineat amb els punts d’origen.'],
  DIMRADIUS: ['Acota el radio de un círculo o arco.', 'Cota o raio dun círculo ou arco.', 'Dimensions the radius of a circle or arc.', 'Cota o raio de um círculo ou arco.', 'Acota el radi d’un cercle o arc.'],
  DIMANGULAR: ['Acota el ángulo entre líneas o de un arco.', 'Cota o ángulo entre liñas ou dun arco.', 'Dimensions the angle between lines or of an arc.', 'Cota o ângulo entre linhas ou de um arco.', 'Acota l’angle entre línies o d’un arc.'],
  DIMBREAK: ['Corta las líneas de cota donde cruzan otros objetos; en modo Auto se actualiza solo.', 'Corta as liñas de cota onde cruzan outros obxectos; en modo Auto actualízase só.', 'Breaks dimension lines where objects cross; Auto breaks update automatically.', 'Interrompe as linhas de cota onde cruzam objetos; em Auto atualiza-se sozinho.', 'Talla les línies de cota on creuen objectes; en Auto s’actualitza sol.'],
  MLEADER: ['Crea una directriz múltiple con texto o bloque.', 'Crea unha directriz múltiple con texto ou bloque.', 'Creates a multileader with text or block content.', 'Cria uma linha de chamada múltipla com texto ou bloco.', 'Crea una directriu múltiple amb text o bloc.'],
  BLOCK: ['Define un bloque a partir de objetos seleccionados.', 'Define un bloque a partir de obxectos seleccionados.', 'Defines a block from selected objects.', 'Define um bloco a partir de objetos selecionados.', 'Defineix un bloc a partir d’objectes seleccionats.'],
  INSERT: ['Inserta un bloque o un dibujo.', 'Insire un bloque ou un debuxo.', 'Inserts a block or drawing.', 'Insere um bloco ou desenho.', 'Insereix un bloc o un dibuix.'],
  BPARAMETER: ['Añade parámetros dinámicos (lineal, polar, XY, giro, alineación...) en el Editor de bloques.', 'Engade parámetros dinámicos (lineal, polar, XY, xiro, aliñamento...) no Editor de bloques.', 'Adds dynamic parameters (linear, polar, XY, rotation, alignment…) in the Block Editor.', 'Adiciona parâmetros dinâmicos (linear, polar, XY, rotação, alinhamento…) no Editor de blocos.', 'Afegeix paràmetres dinàmics (lineal, polar, XY, gir, alineació...) a l’Editor de blocs.'],
  LAYER: ['Abre el Administrador de propiedades de capas.', 'Abre o Administrador de propiedades de capas.', 'Opens the Layer Properties Manager.', 'Abre o Gestor de propriedades de camadas.', 'Obre l’Administrador de propietats de capes.'],
  MATCHPROP: ['Copia las propiedades de un objeto a otros.', 'Copia as propiedades dun obxecto a outros.', 'Copies properties from one object to others.', 'Copia as propriedades de um objeto para outros.', 'Copia les propietats d’un objecte a d’altres.'],
  PROPERTIES: ['Muestra y modifica las propiedades de los objetos.', 'Mostra e modifica as propiedades dos obxectos.', 'Displays and edits object properties.', 'Mostra e altera as propriedades dos objetos.', 'Mostra i modifica les propietats dels objectes.'],
  MEASUREGEOM: ['Mide distancia, radio, ángulo, área o volumen.', 'Mide distancia, raio, ángulo, área ou volume.', 'Measures distance, radius, angle, area or volume.', 'Mede distância, raio, ângulo, área ou volume.', 'Mesura distància, radi, angle, àrea o volum.'],
  PLOT: ['Imprime o exporta a PDF/PNG el modelo o una presentación.', 'Imprime ou exporta a PDF/PNG o modelo ou unha presentación.', 'Plots or exports the model or a layout to PDF/PNG.', 'Imprime ou exporta para PDF/PNG o modelo ou um layout.', 'Imprimeix o exporta a PDF/PNG el model o una presentació.'],
  MLINE: ['Dibuja líneas múltiples paralelas según un estilo.', 'Debuxa liñas múltiples paralelas segundo un estilo.', 'Draws parallel multilines using a style.', 'Desenha multilinhas paralelas segundo um estilo.', 'Dibuixa multilínies paral·leles segons un estil.'],
  MLEDIT: ['Edita intersecciones de líneas múltiples: cruces, uniones en T, esquinas, vértices y cortes.', 'Edita interseccións de liñas múltiples: cruces, unións en T, esquinas, vértices e cortes.', 'Edits multiline intersections: crosses, tees, corners, vertices and cuts.', 'Edita interseções de multilinhas: cruzamentos, T, cantos, vértices e cortes.', 'Edita interseccions de multilínies: creus, T, cantonades, vèrtexs i talls.'],
  BOX: ['Crea un prisma rectangular sólido.', 'Crea un prisma rectangular sólido.', 'Creates a solid box.', 'Cria uma caixa sólida.', 'Crea un prisma rectangular sòlid.'],
  EXTRUDE: ['Extruye una región o polilínea cerrada en un sólido.', 'Extrusiona unha rexión ou polilíña pechada nun sólido.', 'Extrudes a region or closed polyline into a solid.', 'Extruda uma região ou polilinha fechada num sólido.', 'Extrudeix una regió o polilínia tancada en un sòlid.'],
  UNION: ['Une sólidos o regiones.', 'Une sólidos ou rexións.', 'Unites solids or regions.', 'Une sólidos ou regiões.', 'Uneix sòlids o regions.'],
  SUBTRACT: ['Resta sólidos o regiones de otros.', 'Resta sólidos ou rexións doutros.', 'Subtracts solids or regions from others.', 'Subtrai sólidos ou regiões de outros.', 'Resta sòlids o regions d’altres.'],
  INTERSECT: ['Conserva el volumen o área común.', 'Conserva o volume ou área común.', 'Keeps the common volume or area.', 'Mantém o volume ou área comum.', 'Conserva el volum o l’àrea comuna.'],
  SLICE: ['Corta un sólido con un plano y conserva uno o ambos lados.', 'Corta un sólido cun plano e conserva un ou os dous lados.', 'Slices a solid with a plane, keeping one or both sides.', 'Corta um sólido com um plano, mantendo um ou ambos os lados.', 'Talla un sòlid amb un pla i conserva un o els dos costats.'],
  SECTION: ['Crea la región de sección de un sólido con un plano.', 'Crea a rexión de sección dun sólido cun plano.', 'Creates the section region of a solid on a plane.', 'Cria a região de secção de um sólido num plano.', 'Crea la regió de secció d’un sòlid amb un pla.'],
  FILLETEDGE: ['Redondea aristas verticales de un sólido extruido.', 'Arredonda arestas verticais dun sólido extruído.', 'Rounds vertical edges of an extruded solid.', 'Arredonda arestas verticais de um sólido extrudido.', 'Arrodoneix arestes verticals d’un sòlid extrudit.'],
  VIEWBASE: ['Genera vistas 2D (planta, alzados, isométrica) de sólidos con líneas ocultas.', 'Xera vistas 2D (planta, alzados, isométrica) de sólidos con liñas ocultas.', 'Generates 2D views (top, elevations, iso) of solids with hidden lines.', 'Gera vistas 2D (planta, alçados, isométrica) de sólidos com linhas ocultas.', 'Genera vistes 2D (planta, alçats, isomètrica) de sòlids amb línies ocultes.'],
  IFCIMPORT: ['Importa geometría de archivos IFC o STEP (facetada).', 'Importa xeometría de ficheiros IFC ou STEP (facetada).', 'Imports faceted geometry from IFC or STEP files.', 'Importa geometria facetada de ficheiros IFC ou STEP.', 'Importa geometria facetada de fitxers IFC o STEP.'],
  STEPOUT: ['Exporta sólidos a STEP AP214 (B-rep facetado).', 'Exporta sólidos a STEP AP214 (B-rep facetado).', 'Exports solids to STEP AP214 (faceted B-rep).', 'Exporta sólidos para STEP AP214 (B-rep facetado).', 'Exporta sòlids a STEP AP214 (B-rep facetat).'],
  DUCT: ['Dibuja conductos de climatización con su sección.', 'Debuxa condutos de climatización coa súa sección.', 'Draws HVAC ducts with their section.', 'Desenha condutas AVAC com a sua secção.', 'Dibuixa conductes de climatització amb la seva secció.'],
  DUCT3D: ['Genera el modelo 3D de los conductos según su cota.', 'Xera o modelo 3D dos condutos segundo a súa cota.', 'Builds the 3D model of ducts from their elevation.', 'Gera o modelo 3D das condutas segundo a cota.', 'Genera el model 3D dels conductes segons la cota.'],
  DUCTBOM: ['Lista de materiales de conductos: superficie de chapa y piezas.', 'Lista de materiais de condutos: superficie de chapa e pezas.', 'Duct bill of materials: sheet area and fittings.', 'Lista de materiais das condutas: área de chapa e peças.', 'Llista de materials de conductes: superfície de xapa i peces.'],
  ROOMLOADS: ['Calcula cargas térmicas por recinto (CTE/RITE).', 'Calcula cargas térmicas por recinto (CTE/RITE).', 'Calculates thermal loads per room (CTE/RITE).', 'Calcula cargas térmicas por espaço (CTE/RITE).', 'Calcula càrregues tèrmiques per recinte (CTE/RITE).'],
  PEDSHEET: ['Determina la categoría PED 2014/68/UE y genera la hoja de datos del equipo.', 'Determina a categoría PED 2014/68/UE e xera a folla de datos do equipo.', 'Determines the PED 2014/68/EU category and builds the equipment datasheet.', 'Determina a categoria PED 2014/68/UE e gera a folha de dados.', 'Determina la categoria PED 2014/68/UE i genera el full de dades.'],
  FLANGE: ['Inserta bridas EN 1092-1 por PN y DN.', 'Insire bridas EN 1092-1 por PN e DN.', 'Inserts EN 1092-1 flanges by PN and DN.', 'Insere flanges EN 1092-1 por PN e DN.', 'Insereix brides EN 1092-1 per PN i DN.'],
  PIPECALC: ['Pérdida de carga (Darcy-Weisbach/Colebrook) y NPSH disponible.', 'Perda de carga (Darcy-Weisbach/Colebrook) e NPSH dispoñible.', 'Head loss (Darcy-Weisbach/Colebrook) and available NPSH.', 'Perda de carga (Darcy-Weisbach/Colebrook) e NPSH disponível.', 'Pèrdua de càrrega (Darcy-Weisbach/Colebrook) i NPSH disponible.'],
  PIDTAG: ['Etiqueta inteligente P&ID con numeración automática.', 'Etiqueta intelixente P&ID con numeración automática.', 'Smart P&ID tag with automatic numbering.', 'Etiqueta inteligente P&ID com numeração automática.', 'Etiqueta intel·ligent P&ID amb numeració automàtica.'],
  PIDLIST: ['Genera la lista de válvulas e instrumentos del P&ID.', 'Xera a lista de válvulas e instrumentos do P&ID.', 'Builds the P&ID valve and instrument list.', 'Gera a lista de válvulas e instrumentos do P&ID.', 'Genera la llista de vàlvules i instruments del P&ID.'],
  GISIMPORT: ['Importa SHP (con DBF) y GeoJSON; las coordenadas geográficas se proyectan con la ubicación del dibujo.', 'Importa SHP (con DBF) e GeoJSON; as coordenadas xeográficas proxéctanse coa localización do debuxo.', 'Imports SHP (with DBF) and GeoJSON; lon/lat is projected with the drawing location.', 'Importa SHP (com DBF) e GeoJSON; lon/lat projeta-se com a localização do desenho.', 'Importa SHP (amb DBF) i GeoJSON; lon/lat es projecta amb la ubicació del dibuix.'],
  DWGOUT: ['Guarda en DWG mediante un servicio conversor externo configurado con DWGCONVERTER.', 'Garda en DWG mediante un servizo conversor externo configurado con DWGCONVERTER.', 'Saves DWG through an external converter service set with DWGCONVERTER.', 'Guarda em DWG através de um serviço conversor externo (DWGCONVERTER).', 'Desa en DWG mitjançant un servei conversor extern (DWGCONVERTER).'],
  COLLAB: ['Edición simultánea en tiempo real con otros usuarios (Supabase Realtime o pestañas locales).', 'Edición simultánea en tempo real con outros usuarios (Supabase Realtime ou lapelas locais).', 'Real-time co-editing with other users (Supabase Realtime or local tabs).', 'Edição simultânea em tempo real com outros utilizadores (Supabase Realtime ou separadores locais).', 'Edició simultània en temps real amb altres usuaris (Supabase Realtime o pestanyes locals).'],
  LAYERCLAIM: ['Reserva capas para que solo usted pueda modificarlas durante la colaboración.', 'Reserva capas para que só vostede poida modificalas durante a colaboración.', 'Reserves layers so only you can modify them while collaborating.', 'Reserva camadas para que só você as possa modificar.', 'Reserva capes perquè només vostè les pugui modificar.'],
  COMMENT: ['Añade un comentario anclado a un objeto o punto; admite respuestas.', 'Engade un comentario ancorado a un obxecto ou punto; admite respostas.', 'Adds a comment anchored to an object or point, with replies.', 'Adiciona um comentário ancorado a um objeto ou ponto, com respostas.', 'Afegeix un comentari ancorat a un objecte o punt, amb respostes.'],
  TOUCHMODE: ['Activa el modo tableta: interfaz grande, gestos con dos dedos y pulsación larga como clic derecho.', 'Activa o modo tableta: interface grande, xestos con dous dedos e pulsación longa como clic dereito.', 'Turns on tablet mode: larger UI, two-finger gestures, long press as right-click.', 'Ativa o modo tablet: interface maior, gestos com dois dedos e toque longo como clique direito.', 'Activa el mode tauleta: interfície gran, gestos amb dos dits i pulsació llarga com a clic dret.'],
  POINTCLOUDATTACH: ['Adjunta nubes de puntos XYZ, PTS, PLY o LAS.', 'Adxunta nubes de puntos XYZ, PTS, PLY ou LAS.', 'Attaches XYZ, PTS, PLY or LAS point clouds.', 'Anexa nuvens de pontos XYZ, PTS, PLY ou LAS.', 'Adjunta núvols de punts XYZ, PTS, PLY o LAS.'],
  GEOMAP: ['Muestra mapa de carreteras o aéreo bajo el dibujo geolocalizado.', 'Mostra mapa de estradas ou aéreo baixo o debuxo xeolocalizado.', 'Shows a road or aerial map under the geolocated drawing.', 'Mostra mapa de estradas ou aéreo sob o desenho geolocalizado.', 'Mostra mapa de carreteres o aeri sota el dibuix geolocalitzat.'],
};
const L = { es: 0, gl: 1, en: 2, pt: 3, ca: 4 };
const UI = {
  es: ['Comando', 'Alias', 'Cinta', 'Línea de comandos: escriba el nombre o un alias.', 'Ayuda de comandos', 'Referencia completa'],
  gl: ['Comando', 'Alias', 'Cinta', 'Liña de comandos: escriba o nome ou un alias.', 'Axuda de comandos', 'Referencia completa'],
  en: ['Command', 'Aliases', 'Ribbon', 'Command line: type the name or an alias.', 'Command help', 'Full reference'],
  pt: ['Comando', 'Alias', 'Friso', 'Linha de comandos: escreva o nome ou um alias.', 'Ajuda de comandos', 'Referência completa'],
  ca: ['Ordre', 'Àlies', 'Cinta', 'Línia d’ordres: escrigui el nom o un àlies.', 'Ajuda d’ordres', 'Referència completa'],
};
// ¿dónde está en la cinta? Ficha > Grupo
export function ribbonPath(name) {
  const hit = (it) => {
    if (!it) return false;
    const c = String(it.big || it.cmd || '').replace(/\^C/gi, '').trim().split(/[\s;]+/)[0].replace(/^[._']+/, '').toUpperCase();
    return c === name || (it.dd || []).some(hit) || (it.col || []).some(hit);
  };
  for (const t of TABS) for (const p of t.panels || []) if ((p.items || []).some(hit) || (p.more || []).some(hit)) return [t.name, p.name];
  return null;
}
export function createHelp(app) {
  const eng = app.cmd;
  const resolve = (n) => { n = String(n || '').toUpperCase(); return eng.commands[n] ? n : eng.aliases[n] || n; };
  const card = (name) => {
    const n = resolve(name), arr = CARDS[n], lang = getLang();
    const aliases = Object.entries(eng.aliases).filter(([k, v]) => v === n && k !== n).map(([k]) => k).slice(0, 8);
    return { name: n, disp: dispCmd(n), desc: arr ? arr[L[lang] ?? 0] || arr[2] : '', aliases, ribbon: ribbonPath(n), exists: !!eng.commands[n] };
  };
  const show = (name) => {
    const c = card(name), u = UI[getLang()] || UI.es, tr = app.tr || ((s) => s);
    if (!c.exists && !c.desc) return app.ui.dlg.help();
    return app.ui.dlg.open({ title: `${u[4]}: ${c.disp}`, body: [h('div', { class: 'helpcard', style: { maxWidth: '520px' } },
      h('h3', { text: c.disp + (c.disp !== c.name ? `  (${c.name})` : ''), style: { margin: '0 0 6px' } }),
      c.desc ? h('p', { text: c.desc }) : '',
      h('p', {}, h('b', { text: u[1] + ': ' }), c.aliases.join(', ') || '—'),
      c.ribbon ? h('p', {}, h('b', { text: u[2] + ': ' }), c.ribbon.map((x) => tr(x)).join(' › ')) : '',
      h('p', { class: 'hint', text: u[3] }))],
      buttons: [{ t: u[5], v: 'all' }, { t: 'Cerrar', v: true, pri: true }] }).then((r) => { if (r === 'all') app.ui.dlg.help(); });
  };
  return { card, show, CARDS };
}
