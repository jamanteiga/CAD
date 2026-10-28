// Català: missatges de sol·licitud, opcions i noms d'ordre de la línia d'ordres.
// Les claus són els textos interns en anglès; les majúscules de les opcions marquen l'abreviatura.
const parse = (txt) => { const o = {}; for (const l of txt.split('\n')) { const i = l.indexOf(' | '); if (i > 0) o[l.slice(0, i)] = l.slice(i + 3); } return o; };

export const KW = {
  Undo: 'Desfer', Close: 'Tancar', CLose: 'TAncar', Arc: 'Arc', Halfwidth: 'Mitja amplada', Length: 'Longitud', Width: 'Amplada', Line: 'Línia',
  Angle: 'Angle', CEnter: 'CEntre', Center: 'Centre', Direction: 'Direcció', Radius: 'Radi', 'Second pt': 'Segon pt', End: 'Final',
  'chord Length': 'longitud de Corda', '3P': '3P', '2P': '2P', 'Ttr (tan tan radius)': 'Ttr (tangent tangent radi)', Diameter: 'Diàmetre',
  Chamfer: 'Xamfrà', Elevation: 'Elevació', Fillet: 'eMpalmament', Thickness: "Alçada d'objecte", Area: 'Àrea', Dimensions: 'Cotes', Rotation: 'Rotació',
  Edge: 'Costat', 'Inscribed in circle': 'Inscrit al cercle', 'Circumscribed about circle': 'Circumscrit al cercle',
  Parameter: 'Paràmetre', 'Included angle': 'angle Inclòs', Method: 'Mètode', Knots: 'Nusos', Object: 'Objecte', 'start Tangency': 'Tangència inicial',
  'end Tangency': 'Tangència final', toLerance: 'toLerància', Hor: 'Hor', Ver: 'Ver', Ang: 'Ang', Bisect: 'Bisectriu', Offset: 'Desfasament',
  'Arc length': "Longitud d'arc", Rectangular: 'Rectangular', Polygonal: 'Poligonal', Freehand: 'a mà Alçada', Style: 'Estil', Modify: 'Modificar',
  Frames: 'Marcs', Polyline: 'Polilínia', Displacement: 'Desplaçament', Array: 'Matriu', Fit: 'Ajustar', Copy: 'Copiar', Reference: 'Referència',
  Points: 'Punts', Yes: 'Sí', No: 'No', Through: 'Punt', Erase: 'Esborrar', Layer: 'Capa', Current: 'Actual', Source: 'Origen', Exit: 'Sortir',
  Multiple: 'Múltiple', 'cuTting edges': 'Arestes de tall', Fence: 'Tanca', Crossing: 'Captura', mOde: 'mOde', Project: 'Projecció', eRase: 'Eliminar',
  Quick: 'Ràpid', Standard: 'Estàndard', 'First point': 'Primer punt', Polyline_: 'Polilínia', Trim: 'reTallar', Distance: 'Distància', mEthod: 'mèTode',
  PAth: 'Camí', POlar: 'Polar', 'Base point': 'Punt base', 'Axis of rotation': 'Eix de rotació', DElta: 'Increment', Percent: 'Percentatge',
  Total: 'Total', DYnamic: 'Dinàmica', Open: 'Obrir', Join: 'Unir', 'Edit vertex': 'Editar vèrtexs', Spline: 'Spline', Decurve: 'Rectificar',
  'Ltype gen': 'generació tipusLín', Reverse: 'Invertir', Settings: 'Paràmetres', Color: 'Color', LAyer: 'cApa', LType: 'tipusLín', ltScale: 'Escala tl',
  LWeight: 'Gruix lín', TRansparency: 'tRansparència', Material: 'Material', PLotstyle: 'estil de Traçat', 'Above objects': 'Sobre els objectes',
  'Under objects': 'Sota els objectes', Front: 'Davant', Back: 'Darrere', 'Multiple points': 'Punts múltiples', 'Add area': 'Afegir àrea',
  'Subtract area': 'Restar àrea', Block: 'Bloc', Auto: 'Auto', Control: 'Control', BEgin: 'Inici', Mark: 'Marca',
  Justify: 'Justificar', Left: 'Esquerra', Right: 'Dreta', Align: 'aLinear', Middle: 'Mig', TL: 'SE', TC: 'SC', TR: 'SD', ML: 'ME', MC: 'MC', MR: 'MD',
  BL: 'IE', BC: 'IC', BR: 'ID', Height: 'Alçada', 'Line spacing': 'Interlineat', Columns: 'Columnes', Mtext: 'textM', Text: 'Text', Horizontal: 'Horitzontal',
  Vertical: 'Vertical', Rotated: 'Girada', Quadrant: 'Quadrant', Xdatum: 'Xbase', Ydatum: 'Ybase', Select: 'Designar', Home: 'Restablir',
  'leader Landing first': 'primer eNllaç', 'Content first': 'primer Contingut', Options: 'Opcions', 'Select objects': 'Designar objectes',
  seTtings: 'paràmeTres', sEttings: 'paràmeTres', Properties: 'Propietats', 'draW boundary': 'dibuixar Contorn', 'remove Boundaries': 'Eliminar contorns',
  Advanced: 'Avançat', 'DRaw order': 'Ordre de dibuix', Origin: 'oRigen', ANnotative: 'aNotatiu', 'hatch Color': "color d'oMbrejat", Transparency: 'Transparència',
  Solid: 'Sòlid', 'User defined': 'Usuari', Gradient: 'deGradat', Basepoint: 'Punt base', Scale: 'Escala', Rotate: 'Girar', Corner: 'Cantonada', XYZ: 'XYZ',
  'Entire drawing': 'Tot el dibuix', Objects: 'Objectes', Cancel: 'Cancel·lar', Alignment: 'Alineació', Linear: 'Lineal', Polar: 'Polar', Flip: 'Simetria',
  Visibility: 'Visibilitat', XY: 'XY', Lookup: 'Consulta', Name: 'Nom', Label: 'Etiqueta', Chain: 'Cadena', Description: 'Descripció', Base: 'Base',
  Palette: 'Paleta', 'Value set': 'conjunt de Valors', Stretch: 'Estirar', Move: 'Desplaçar', None: 'Cap', New: 'Nou', 'Set current': 'Definir actual',
  Rename: 'Canviar nom', Delete: 'Suprimir', 'Hide all': 'Amagar-los tots', 'Show all': 'Mostrar-los tots', 'Leave unchanged': 'Deixar sense canvis',
  'Current state': 'Estat actual', 'All visibility states': 'Tots els estats', All: 'Tot', Dynamic: 'Dinàmic', Extents: 'Extensió', Previous: 'Previ',
  Window: 'Finestra', Orthographic: 'Ortogonal', Restore: 'Restaurar', Save: 'Desar', '?': '?', Template: 'Plantilla', SAveas: 'Desar com', Set: 'Definir',
  Make: 'Fer', ON: 'ACT', OFF: 'DES', Ltype: 'tipusLín', Plot: 'TRaçar', Freeze: 'Inutilitzar', Thaw: 'REutilitzar', LOck: 'BLoquejar', Unlock: 'DESBloquejar',
  stAte: 'eStat', rEconcile: 'rECONciliar', MATerial: 'MATerial', 'No plot': 'No traçar', Load: 'Carregar', Create: 'Crear', Truecolor: 'Color veritable',
  COlorbook: 'Llibre de colors', Lock: 'Bloquejar', Shadeplot: 'Traçat ombrejat', NEw: 'Nova', NAmed: 'Desada', Pick: 'Designar',
  'Pick points': 'Designar punts', Ascending: 'Ascendent', Annotative: 'Anotatiu', CPolygon: 'PolígonC', SYstem: 'SIstema', SHape: 'FOrma', WIdth: 'AMplada',
  HEight: 'ALçada', DIameter: 'DIàmetre', FLow: 'CAbal', RAdius: 'RAdi', Supply: 'Impulsió', Return: 'Retorn', Exhaust: 'Extracció', Outdoor: 'aire eXterior',
  Round: 'Circular', COUnt: 'Nombre', Spacing: 'sEparació', eXit: 'Sortir', Items: 'Elements', 'Fill angle': "Angle d'emplenament", 'ROTate items': 'Girar elements',
  Show: 'Mostrar', Hide: 'Amagar', 'Add objects': 'Afegir objectes', 'Remove objects': 'Treure objectes', REName: 'Canviar nom', Excel: 'Excel', Csv: 'Csv',
  Isometric: 'Isomètric', Top: 'Superior', Coincident: 'Coincident', Parallel: 'Paral·lela', Perpendicular: 'Perpendicular', Equal: 'Igual', Fix: 'Fixa',
  CONcentric: 'COncèntrica', COLlinear: 'COLineal', Tangent: 'Tangent', LInear: 'LIneal', Aligned: 'Alineada', ANgular: 'ANgular',
};
export const DEFW = { Exit: 'Sortir', Displacement: 'Desplaçament', 'real time': 'temps real', 'select object': 'designar objecte', Object: 'Objecte', Total: 'Total',
  Yes: 'Sí', No: 'No', Y: 'S', N: 'N', Through: 'Punt', Stretch: 'Estirar', Linear: 'Lineal', Settings: 'Paràmetres', Fit: 'Ajustar', Back: 'Darrere',
  'Set current': 'Definir actual', 'Current state': 'Estat actual', 'Leave unchanged': 'Deixar sense canvis', Rectangular: 'Rectangular', Objects: 'Objectes',
  Quick: 'Ràpid', Standard: 'Estàndard', Source: 'Origen', 'specify vertex': 'precisi el vèrtex', 'use X scale factor': "usar el factor d'escala X",
  'use first point as displacement': 'usar el primer punt com a desplaçament', 'select all': 'designar-ho tot', Select: 'Designar', Polyline: 'Polilínia',
  exit: 'sortir', Mtext: 'textM', BYLAYER: 'PERCAPA', BYBLOCK: 'PERBLOC', ByLayer: 'PerCapa', CONTINUOUS: 'CONTINUOUS', set: 'definir', Options: 'Opcions',
  Inscribed: 'Inscrit', none: 'cap', continue: 'continuar' };

export const SENT = parse(`
Select continued dimension | Designi la cota contínua
Specify objects to stretch | Precisi els objectes per estirar
Specify objects for Rotate action | Precisi els objectes per a l'acció Girar
Specify objects for Flip action | Precisi els objectes per a l'acció Simetria
Specify first end point of circle's diameter | Precisi el primer punt final del diàmetre del cercle
Specify second end point of circle's diameter | Precisi el segon punt final del diàmetre del cercle
Specify diameter of circle | Precisi el diàmetre del cercle
Enter name for new layer | Indiqui el nom de la capa nova
Enter names for new layer(s) | Indiqui els noms de les capes noves
Enter name of new layout | Indiqui el nom de la presentació nova
Select cutting edges ... | Designi les arestes de tall...
Select object to trim | Designi l'objecte que vol retallar
Select object to extend | Designi l'objecte que vol allargar
Enter a extend mode option | Indiqui una opció de mode d'allargament
Select object to measure | Designi l'objecte que vol graduar
Select object to divide | Designi l'objecte que vol dividir
Specify starting width | Precisi l'amplada inicial
Specify starting half-width | Precisi la mitja amplada inicial
Specify ending width | Precisi l'amplada final
Specify ending half-width | Precisi la mitja amplada final
Align arrayed items to path? | Alinear els elements de la matriu amb el camí?
Align block with object? | Alinear el bloc amb l'objecte?
Do you want to turn it into one? | Voleu convertir-lo en polilínia?
Object selected is not a polyline | L'objecte designat no és una polilínia
Enter X scale factor, specify opposite corner, | Indiqui el factor d'escala X, precisi la cantonada oposada,
Enter Y scale factor | Indiqui el factor d'escala Y
Enter a loaded linetype name | Indiqui el nom d'un tipus de línia carregat
Enter a pattern name | Indiqui el nom del patró
Enter a plotting preference | Indiqui la preferència de traçat
Enter a scale factor (nX or nXP) | Indiqui un factor d'escala (nX o nXP)
Enter an option | Indiqui una opció
Enter angle of xline (0) | Indiqui l'angle de la línia auxiliar (0)
Enter area of rectangle in current units | Indiqui l'àrea del rectangle en unitats actuals
Enter array type | Indiqui el tipus de matriu
Enter base point | Indiqui el punt base
Enter block name | Indiqui el nom del bloc
Enter delta length | Indiqui l'increment de longitud
Enter dimension text | Indiqui el text de la cota
Enter distance increment | Indiqui l'increment de distància
Enter first line of annotation text | Indiqui la primera línia del text d'anotació
Enter justification | Indiqui la justificació
Enter layer description | Indiqui la descripció de la capa
Enter layer name to make current | Indiqui el nom de la capa que vol fer actual
Enter layer names for this plot preference | Indiqui els noms de capa per a aquesta preferència de traçat
Enter layer option for offset objects | Indiqui l'opció de capa per als objectes desfasats
Enter layout option | Indiqui l'opció de presentació
Enter layout to make current | Indiqui la presentació que vol fer actual
Enter layout to rename | Indiqui la presentació que vol reanomenar
Enter linetype(s) to load | Indiqui el(s) tipus de línia que vol carregar
Enter lineweight (0.0mm - 2.11mm) | Indiqui el gruix de línia (0.0mm - 2.11mm)
Enter list of object snap modes | Indiqui la llista de modes de referència a objectes
Enter magnification or height | Indiqui l'ampliació o l'alçada
Enter name for new visibility state | Indiqui el nom del nou estat de visibilitat
Enter name list of layer(s) to freeze | Indiqui la llista de noms de capa(es) que vol inutilitzar
Enter name list of layer(s) to lock | Indiqui la llista de noms de capa(es) que vol bloquejar
Enter name list of layer(s) to thaw | Indiqui la llista de noms de capa(es) que vol reutilitzar
Enter name list of layer(s) to unlock | Indiqui la llista de noms de capa(es) que vol desbloquejar
Enter name list of layers | Indiqui la llista de noms de capes
Enter name list of layers for lineweight | Indiqui la llista de noms de capes per al gruix de línia
Enter name list of layers to turn Off | Indiqui la llista de noms de capes que vol desactivar
Enter name list of layers to turn On | Indiqui la llista de noms de capes que vol activar
Enter name of block to insert | Indiqui el nom del bloc que vol inserir
Enter name of block to sync | Indiqui el nom del bloc que vol sincronitzar
Enter name of existing block | Indiqui el nom d'un bloc existent
Enter name of layout to delete | Indiqui el nom de la presentació que vol suprimir
Enter new color | Indiqui el color nou
Enter new layer name | Indiqui el nom nou de capa
Enter new layout name | Indiqui el nom nou de presentació
Enter new linetype name | Indiqui el nom nou de tipus de línia
Enter new linetype scale factor | Indiqui el nou factor d'escala de tipus de línia
Enter new lineweight | Indiqui el gruix de línia nou
Enter new name for current state | Indiqui el nom nou de l'estat actual
Enter new value for CELTSCALE | Indiqui el valor nou de CELTSCALE
Enter next line of annotation text | Indiqui la línia següent del text d'anotació
Enter next point | Indiqui el punt següent
Enter number of items along path | Indiqui el nombre d'elements al llarg del camí
Enter number of items to array | Indiqui el nombre d'elements de la matriu
Enter number of sides | Indiqui el nombre de costats
Enter object ordering option | Indiqui l'opció d'ordenació dels objectes
Enter object type to rename | Indiqui el tipus d'objecte que vol reanomenar
Enter old layer name | Indiqui el nom antic de la capa
Enter parameter label | Indiqui l'etiqueta del paràmetre
Enter parameter type | Indiqui el tipus de paràmetre
Enter percentage length | Indiqui el percentatge de longitud
Enter property to change | Indiqui la propietat que vol canviar
Enter rectangle length | Indiqui la longitud del rectangle
Enter style name | Indiqui el nom de l'estil
Enter text | Indiqui el text
Enter the distance between rows or specify unit cell (---) | Indiqui la distància entre files o precisi la cel·la unitària (---)
Enter the number of columns (|||) | Indiqui el nombre de columnes (|||)
Enter the number of items in the array | Indiqui el nombre d'elements de la matriu
Enter the number of operations to undo | Indiqui el nombre d'operacions que vol desfer
Enter the number of rows (---) | Indiqui el nombre de files (---)
Enter the number of segments | Indiqui el nombre de segments
Enter variable name | Indiqui el nom de la variable
Enter view name to restore | Indiqui el nom de la vista que vol restaurar
Enter view name to save | Indiqui el nom de la vista que vol desar
Enter view name(s) to delete | Indiqui el(s) nom(s) de la(es) vista(es) que vol suprimir
Erase source object after offsetting? | Esborrar l'objecte d'origen després de desfasar?
Erase source objects? | Esborrar els objectes d'origen?
First polygon point | Primer punt del polígon
Make visible for | Fer visible per a
New color | Color nou
Parameter name to delete | Nom del paràmetre que vol suprimir
Pick internal point | Designi un punt intern
Remove objects | Treure objectes
Rotate arrayed objects? | Girar els objectes de la matriu?
Save changes to block? | Desar els canvis al bloc?
Scale objects based on alignment points? | Escalar els objectes segons els punts d'alineació?
Select 2D polyline | Designi la polilínia 2D
Select a block | Designi un bloc
Select a block reference | Designi una referència a bloc
Select a line object | Designi un objecte de línia
Select an annotation object | Designi un objecte d'anotació
Select an object on the layer to be frozen | Designi un objecte de la capa que vol inutilitzar
Select an object on the layer to be locked | Designi un objecte de la capa que vol bloquejar
Select an object on the layer to be turned off | Designi un objecte de la capa que vol desactivar
Select an object on the layer to be unlocked | Designi un objecte de la capa que vol desbloquejar
Select an object to change | Designi un objecte per canviar
Select an object to measure | Designi un objecte per mesurar
Select arc or circle | Designi un arc o un cercle
Select arc, circle, line, | Designi arc, cercle, línia,
Select cutting edges | Designi les arestes de tall
Select destination object(s) | Designi l'objecte o objectes de destinació
Select dimension | Designi la cota
Select first line | Designi la primera línia
Select first object | Designi el primer objecte
Select hatch object | Designi l'objecte d'ombrejat
Select object | Designi un objecte
Select object on layer to delete | Designi un objecte de la capa que vol suprimir
Select object on layer to merge | Designi un objecte de la capa que vol fusionar
Select object on target layer | Designi un objecte de la capa de destinació
Select object to dimension | Designi l'objecte que vol acotar
Select object to offset | Designi l'objecte que vol desfasar
Select object whose layer will become current | Designi l'objecte la capa del qual passarà a ser l'actual
Select objects | Designi objectes
Select objects on the layer(s) to be isolated | Designi objectes de la(es) capa(es) que vol aïllar
Select objects to be changed to the current layer | Designi els objectes que vol passar a la capa actual
Select objects to erase | Designi els objectes que vol esborrar
Select objects to hide | Designi els objectes que vol amagar
Select path curve | Designi la corba del camí
Select polyline | Designi la polilínia
Select polylines to convert to splines | Designi les polilínies que vol convertir en splines
Select reference objects | Designi els objectes de referència
Select second line | Designi la segona línia
Select second line or shift-select to apply corner | Designi la segona línia o premi Maj mentre designa per aplicar la cantonada
Select second object or shift-select to apply corner | Designi el segon objecte o premi Maj mentre designa per aplicar la cantonada
Select source object | Designi l'objecte d'origen
Select source object or multiple objects to join at once | Designi l'objecte d'origen o diversos objectes per unir-los alhora
Source | Origen
Specify X scale factor | Precisi el factor d'escala X
Specify Y scale factor | Precisi el factor d'escala Y
Specify a point | Precisi un punt
Specify a scale for the pattern | Precisi l'escala del patró
Specify a second extension line origin | Precisi l'origen de la segona línia de referència
Specify an angle for the pattern | Precisi l'angle del patró
Specify angle of dimension line | Precisi l'angle de la línia de cota
Specify angle of dimension text | Precisi l'angle del text de cota
Specify angle start point | Precisi el punt inicial de l'angle
Specify angle vertex | Precisi el vèrtex de l'angle
Specify angle vertex point | Precisi el punt del vèrtex de l'angle
Specify axis endpoint of ellipse | Precisi el punt final de l'eix de l'el·lipse
Specify axis endpoint of elliptical arc | Precisi el punt final de l'eix de l'arc el·líptic
Specify base point | Precisi el punt base
Specify base point of reflection line | Precisi el punt base de la línia de reflexió
Specify base point or displacement | Precisi el punt base o el desplaçament
Specify break point | Precisi el punt de ruptura
Specify center of donut | Precisi el centre de la volandera
Specify center of ellipse | Precisi el centre de l'el·lipse
Specify center of polygon | Precisi el centre del polígon
Specify center point | Precisi el punt central
Specify center point for circle | Precisi el punt central del cercle
Specify center point of arc | Precisi el punt central de l'arc
Specify center point of array | Precisi el punt central de la matriu
Specify corner of viewport | Precisi la cantonada de la finestra
Specify corner of window, enter a scale factor (nX or nXP), | Precisi la cantonada de la finestra, indiqui un factor d'escala (nX o nXP),
Specify dimension arc line location | Precisi la posició de l'arc de cota
Specify dimension line location | Precisi la posició de la línia de cota
Specify displacement | Precisi el desplaçament
Specify distance to other axis | Precisi la distància a l'altre eix
Specify end angle | Precisi l'angle final
Specify end point of arc | Precisi el punt final de l'arc
Specify endpoint | Precisi el punt final
Specify endpoint of arc | Precisi el punt final de l'arc
Specify endpoint of axis | Precisi el punt final de l'eix
Specify endpoint of line | Precisi el punt final de la línia
Specify endpoint of reflection line | Precisi el punt final de la línia de reflexió
Specify feature location | Precisi la posició de l'element
Specify fillet radius | Precisi el radi d'empalmament
Specify fillet radius for rectangles | Precisi el radi d'empalmament dels rectangles
Specify first angle endpoint | Precisi el primer punt final de l'angle
Specify first break point | Precisi el primer punt de ruptura
Specify first chamfer distance | Precisi la primera distància de xamfrà
Specify first chamfer distance for rectangles | Precisi la primera distància de xamfrà dels rectangles
Specify first corner | Precisi la primera cantonada
Specify first corner of stretch frame | Precisi la primera cantonada del marc d'estirament
Specify first corner point | Precisi el primer punt de cantonada
Specify first destination point | Precisi el primer punt de destinació
Specify first endpoint of edge | Precisi el primer punt final del costat
Specify first extension line origin | Precisi l'origen de la primera línia de referència
Specify first fence point | Precisi el primer punt de la tanca
Specify first leader point, | Precisi el primer punt de la directriu,
Specify first point | Precisi el primer punt
Specify first point of mirror line | Precisi el primer punt de la línia de simetria
Specify first point on circle | Precisi el primer punt del cercle
Specify first source point | Precisi el primer punt d'origen
Specify height | Precisi l'alçada
Specify included angle | Precisi l'angle inclòs
Specify insertion base point | Precisi el punt base d'inserció
Specify insertion point | Precisi el punt d'inserció
Specify insertion point of text | Precisi el punt d'inserció del text
Specify inside diameter of donut | Precisi el diàmetre interior de la volandera
Specify internal point | Precisi un punt intern
Specify leader arrowhead location | Precisi la posició de la fletxa de la directriu
Specify leader endpoint | Precisi el punt final de la directriu
Specify leader landing location | Precisi la posició de l'enllaç de la directriu
Specify length for rectangles | Precisi la longitud dels rectangles
Specify length of line | Precisi la longitud de la línia
Specify length of segment | Precisi la longitud del segment
Specify line width for rectangles | Precisi el gruix de línia dels rectangles
Specify linetype name | Precisi el nom del tipus de línia
Specify lower left corner | Precisi la cantonada inferior esquerra
Specify minimum length of arc | Precisi la longitud mínima d'arc
Specify new end point | Precisi el punt final nou
Specify new length | Precisi la longitud nova
Specify new linetype scale | Precisi l'escala nova del tipus de línia
Specify new location for dimension text | Precisi la posició nova del text de cota
Specify new width for all segments | Precisi l'amplada nova de tots els segments
Specify next fence point | Precisi el punt següent de la tanca
Specify next point | Precisi el punt següent
Specify offset distance | Precisi la distància de desfasament
Specify opposite corner | Precisi la cantonada oposada
Specify other corner point | Precisi la cantonada oposada
Specify other endpoint of axis | Precisi l'altre punt final de l'eix
Specify outside diameter of donut | Precisi el diàmetre exterior de la volandera
Specify parameter location | Precisi la posició del paràmetre
Specify point | Precisi un punt
Specify point on object for first tangent of circle | Precisi un punt de l'objecte per a la primera tangent del cercle
Specify point on object for second tangent of circle | Precisi un punt de l'objecte per a la segona tangent del cercle
Specify point on side to offset | Precisi un punt al costat que vol desfasar
Specify radius of arc | Precisi el radi de l'arc
Specify radius of circle | Precisi el radi del cercle
Specify radius of parameter | Precisi el radi del paràmetre
Specify reference length | Precisi la longitud de referència
Specify rotation angle | Precisi l'angle de rotació
Specify rotation angle of text | Precisi l'angle de rotació del text
Specify rotation around major axis | Precisi la rotació al voltant de l'eix major
Specify scale factor | Precisi el factor d'escala
Specify scale factor for XYZ axes | Precisi el factor d'escala dels eixos XYZ
Specify second angle endpoint | Precisi el segon punt final de l'angle
Specify second break point | Precisi el segon punt de ruptura
Specify second chamfer distance | Precisi la segona distància de xamfrà
Specify second chamfer distance for rectangles | Precisi la segona distància de xamfrà dels rectangles
Specify second destination point | Precisi el segon punt de destinació
Specify second endpoint of edge | Precisi el segon punt final del costat
Specify second endpoint of text baseline | Precisi el segon punt final de la línia base del text
Specify second extension line origin | Precisi l'origen de la segona línia de referència
Specify second point | Precisi el segon punt
Specify second point of arc | Precisi el segon punt de l'arc
Specify second point of mirror line | Precisi el segon punt de la línia de simetria
Specify second point on arc | Precisi el segon punt de l'arc
Specify second point on circle | Precisi el segon punt del cercle
Specify second source point | Precisi el segon punt d'origen
Specify side to offset | Precisi el costat que vol desfasar
Specify start angle | Precisi l'angle inicial
Specify start point | Precisi el punt inicial
Specify start point of arc | Precisi el punt inicial de l'arc
Specify start point of text | Precisi el punt inicial del text
Specify tangent direction for the start point of arc | Precisi la direcció tangent al punt inicial de l'arc
Specify the angle to fill (+=ccw, -=cw) | Precisi l'angle que vol emplenar (+=antihorari, -=horari)
Specify the distance between columns (|||) | Precisi la distància entre columnes (|||)
Specify the new angle | Precisi l'angle nou
Specify the reference angle | Precisi l'angle de referència
Specify the tangent direction for the start point of arc | Precisi la direcció tangent al punt inicial de l'arc
Specify third point on circle | Precisi el tercer punt del cercle
Specify third source point | Precisi el tercer punt d'origen
Specify through point | Precisi el punt de pas
Specify total length | Precisi la longitud total
Specify upper right corner | Precisi la cantonada superior dreta
Specify value | Precisi el valor
Specify width | Precisi l'amplada
Specify width for rectangles | Precisi el gruix dels rectangles
Text | Text
Viewport View Locking | Bloqueig de la vista de la finestra
Visibility of existing objects in new state | Visibilitat dels objectes existents al nou estat
Specify first corner of window | Precisi la primera cantonada de la finestra
Specify endpoint of arc or | Precisi el punt final de l'arc o
Specify stretch point | Precisi el punt d'estirament
Specify start point or | Precisi el punt inicial o
Specify center point of arc or | Precisi el punt central de l'arc o
Select object to trim or shift-select to extend | Designi l'objecte que vol retallar o premi Maj mentre designa per allargar
Select object to extend or shift-select to trim | Designi l'objecte que vol allargar o premi Maj mentre designa per retallar
Enter a trim mode option | Indiqui una opció de mode de retall
Enter an extend mode option | Indiqui una opció de mode d'allargament
Specify fillet radius  | Precisi el radi d'empalmament
Enter attribute values | Indiqui els valors de l'atribut
Enter mode | Indiqui el mode
Enter new value for SNAPUNIT | Indiqui el valor nou de SNAPUNIT
Specify point on arc | Precisi un punt de l'arc
Specify insertion point or | Precisi el punt d'inserció o
Specify the tangent direction | Precisi la direcció tangent
Specify new location | Precisi la posició nova
Specify base point or | Precisi el punt base o
Pick internal point or | Designi un punt intern o
Specify internal point or | Precisi un punt intern o
Specify scale factor or | Precisi el factor d'escala o
Specify rotation angle or | Precisi l'angle de rotació o
Specify start angle or | Precisi l'angle inicial o
Specify end angle or | Precisi l'angle final o
Enter new value | Indiqui el valor nou
Press ESC or ENTER to exit, or right-click to display shortcut menu. | Premi ESC o INTRO per sortir, o faci clic amb el botó dret per veure el menú contextual.
Press ESC or ENTER to exit. Use the mouse wheel to zoom and drag to pan. | Premi ESC o INTRO per sortir. Utilitzi la roda per fer zoom i arrossegui per desplaçar la vista.
>> Expression | >> Expressió
Enter the number of segments or | Indiqui el nombre de segments o
Specify length of segment or | Precisi la longitud del segment o
Enter name of block to insert  | Indiqui el nom del bloc
Specify start point of text or | Precisi el punt inicial del text o
Select an object to measure or | Designi un objecte per mesurar o
Select objects to stretch by crossing-window or crossing-polygon... | Designi els objectes que vol estirar amb finestra o polígon de captura...
Specify first point of mirror line  | Precisi el primer punt de la línia de simetria
Enter dimension text  | Indiqui el text de la cota
Specify dimension line location or | Precisi la posició de la línia de cota o
Specify markup location | Precisi la posició de la marca
Enter value set (comma-separated) | Indiqui el conjunt de valors (separats per comes)
Enter duct system | Indiqui el sistema del conducte
Enter duct shape | Indiqui la forma del conducte
Specify duct width | Precisi l'amplada del conducte
Specify duct height | Precisi l'alçada del conducte
Specify duct diameter | Precisi el diàmetre del conducte
Enter air flow (m³/h) | Indiqui el cabal d'aire (m³/h)
Enter elbow radius ratio R/W | Indiqui la relació de radi del colze R/W
Select array | Designi la matriu
Select first point | Designi el primer punt
Select second point | Designi el segon punt
Select an object | Designi un objecte
Select second object | Designi el segon objecte
Select point | Designi un punt
Enter constraint type | Indiqui el tipus de restricció
Specify first constraint point | Precisi el primer punt de restricció
Specify second constraint point | Precisi el segon punt de restricció
Enter group name | Indiqui el nom del grup
Enter group description | Indiqui la descripció del grup
Select group | Designi el grup
Enter new name for group | Indiqui el nom nou del grup
Select table | Designi la taula
Enter file format | Indiqui el format del fitxer
Enter isometric plane setting | Indiqui el pla isomètric
Specify center of isocircle | Precisi el centre del cercle isomètric
Specify radius of isocircle | Precisi el radi del cercle isomètric
Enter line tag | Indiqui l'identificador de la línia
Select objects or | Designi objectes o
Select objects to erase or | Designi els objectes que vol esborrar o
Specify second point or | Precisi el segon punt o
Specify third source point or | Precisi el tercer punt d'origen o
Select 1 dimension | Designi 1 cota
Select polyline or | Designi la polilínia o
Specify first corner of stretch frame or | Precisi la primera cantonada del marc d'estirament o
`);
export const SENT_RE = [
  [/^Delete layer\(s\) (.*) and all objects on them\?$/, 'Suprimir la(es) capa(es) $1 i tots els seus objectes?'],
  [/^Block "(.*)" already exists\. Redefine it\?$/, 'El bloc "$1" ja existeix. El voleu redefinir?'],
  [/^Enter name list of layer\(s\) for color (.*)$/, 'Indiqui la llista de noms de capa(es) per al color $1'],
  [/^Enter name list of layers for linetype "(.*)"$/, 'Indiqui la llista de noms de capes per al tipus de línia "$1"'],
  [/^Enter new (.*) name$/, 'Indiqui el nom nou de $1'], [/^Enter old (.*) name$/, 'Indiqui el nom antic de $1'],
  [/^Enter new value for (\S+)$/, 'Indiqui el valor nou de $1'], [/^Minimum arc length: (\S+)\s+Specify first corner point$/, "Longitud mínima d'arc: $1  Precisi el primer punt de cantonada"],
  [/^Select parameter by name$/, 'Designi el paràmetre pel nom'], [/^Enter visibility state name$/, "Indiqui el nom de l'estat de visibilitat"],
  [/^Specify (.*) width$/, "Precisi l'amplada $1"],
];

export const MSG = parse(`
*Cancel* | *Cancel·la*
Nothing selected. | No s'ha designat res.
Object is not valid. | L'objecte no és vàlid.
Invalid selection. | Designació no vàlida.
Invalid option keyword. | Opció no vàlida.
Point or option keyword required. | Cal un punt o una opció.
Requires an integer value. | Cal un valor enter.
Value must be positive and nonzero. | El valor ha de ser positiu i diferent de zero.
Requires numeric distance, second point, or option keyword. | Cal una distància numèrica, un segon punt o una opció.
Requires a distance, numberX, or option keyword. | Cal una distància, un nombreX o una opció.
Requires an integer between 3 and 1024. | Cal un enter entre 3 i 1024.
All segments already undone. | Ja s'han desfet tots els segments.
Everything has been undone | S'ha desfet tot
Nothing to redo | No hi ha res per refer
Regenerating model. | S'està regenerant el model.
Lines are parallel. | Les línies són paral·leles.
Radius is too large. | El radi és massa gran.
Circle does not exist. | El cercle no existeix.
Cannot offset that object. | No es pot desfasar aquest objecte.
Object does not intersect an edge. | L'objecte no talla cap aresta.
Valid hatch boundary not found. | No s'ha trobat cap contorn d'ombrejat vàlid.
Clipboard is empty. | El porta-retalls és buit.
No previous view saved. | No hi ha cap vista prèvia desada.
View not found. | No s'ha trobat la vista.
Block not found. | No s'ha trobat el bloc.
Block name required. | Cal el nom del bloc.
No objects selected. | No hi ha objectes designats.
Block has no attributes. | El bloc no té atributs.
Name not found. | No s'ha trobat el nom.
Object selected is not a polyline. | L'objecte designat no és una polilínia.
Object selected is not an arc, circle or line. | L'objecte designat no és un arc, un cercle ni una línia.
Use grips to edit vertices. | Utilitzi els pinçaments per editar els vèrtexs.
Invalid length. | Longitud no vàlida.
Invalid | No vàlid
Rotating a copy of the selected objects. | S'està girant una còpia dels objectes designats.
Current settings:  Copy mode = Multiple | Paràmetres actuals:  Mode de còpia = Múltiple
Current positive angle in UCS:  ANGDIR=counterclockwise  ANGBASE=0 | Angle positiu actual al SCP:  ANGDIR=antihorari  ANGBASE=0
Select cutting edges ... | Designi les arestes de tall...
Selecting everything... | S'està designant tot...
Analyzing the selected data... | S'estan analitzant les dades designades...
Select objects to stretch by crossing-window or crossing-polygon... | Designi els objectes que vol estirar amb finestra o polígon de captura...
Frames are displayed. | Es mostren els marcs.
Enter attribute values | Indiqui els valors de l'atribut
** Command not allowed in Model Tab ** | ** Ordre no permesa a la pestanya Model **
** Close the Block Editor first ** | ** Tanqui primer l'editor de blocs **
** Command only valid in Block Editor ** | ** Ordre vàlida només a l'editor de blocs **
** That command may not be invoked transparently ** | ** Aquesta ordre no es pot executar de manera transparent **
Already in Block Editor. | Ja és a l'editor de blocs.
Not in Block Editor. | No és a l'editor de blocs.
No parameters defined. | No hi ha paràmetres definits.
Parameter not found. | No s'ha trobat el paràmetre.
Block already has a visibility parameter. | El bloc ja té un paràmetre de visibilitat.
Add a Visibility parameter first (BPARAMETER > Visibility). | Afegiu primer un paràmetre de visibilitat (BPARAMETER > Visibilitat).
Use BVSTATE to create visibility states and BVHIDE/BVSHOW to set object visibility. | Utilitzi BVSTATE per crear estats de visibilitat i BVHIDE/BVSHOW per a la visibilitat dels objectes.
No visibility parameter. | No hi ha paràmetre de visibilitat.
State not found. | No s'ha trobat l'estat.
Cannot delete the only state. | No es pot suprimir l'únic estat.
Specify objects to stretch | Precisi els objectes per estirar
Specify objects for Rotate action | Precisi els objectes per a l'acció Girar
Specify objects for Flip action | Precisi els objectes per a l'acció Simetria
All layers have been turned on. | S'han activat totes les capes.
All layers have been thawed. | S'han reutilitzat totes les capes.
Layers isolated by LAYISO have been restored. | S'han restablert les capes aïllades per LAYISO.
Cannot freeze the current layer. | No es pot inutilitzar la capa actual.
Cannot set a frozen layer current. | No es pot fer actual una capa inutilitzada.
There are no active model space viewports. | No hi ha finestres d'espai model actives.
Cannot delete the only layout. | No es pot suprimir l'única presentació.
0 objects joined | 0 objectes units
Radius must be > 0 for arcs. | El radi ha de ser > 0 per als arcs.
Unknown variable name.  Type SETVAR ? for a list of variables. | Nom de variable desconegut. Escrigui SETVAR ? per veure la llista de variables.
Current active settings:  Color Layer Ltype Ltscale Lineweight Transparency Thickness PlotStyle Dim Text Hatch Polyline Viewport Table Material Multileader Center object | Paràmetres actius:  Color Capa Tipuslín Escalatl Gruixlín Transparència Alçada Estiltraçat Cota Text Ombrejat Polilínia Finestra Taula Material Directriumúltiple
Auditing Header | S'està auditant la capçalera
Auditing Tables | S'estan auditant les taules
Auditing Entities Pass 1 | S'estan auditant les entitats, pas 1
Total errors found 0 fixed 0 | Total d'errors trobats 0 corregits 0
of | de
1 was on a locked layer. | 1 era en una capa bloquejada.
Expects a point or Window/Last/Crossing/BOX/ALL/Fence/WPolygon/CPolygon/Add/Remove/Previous | S'espera un punt o Finestra/Darrer/Captura/Caixa/Tot/Tanca/PolígonF/PolígonC/Afegir/Treure/Previ
*Invalid selection* | *Designació no vàlida*
Linetype not found. | No s'ha trobat el tipus de línia.
Value must be nonzero. | El valor ha de ser diferent de zero.
Value must be positive. | El valor ha de ser positiu.
Cannot fillet those objects. | No es poden empalmar aquests objectes.
Cannot chamfer those objects. | No es poden aixamfranar aquests objectes.
No lookup parameter. | No hi ha paràmetre de consulta.
No ducts selected. | No hi ha conductes designats.
No standard size meets the criteria. | Cap mida normalitzada no compleix els criteris.
No objects found. | No s'han trobat objectes.
Object is not a member of a group. | L'objecte no pertany a cap grup.
Requires a value. | Cal un valor.
`);
export const MSG_RE = [
  [/^Command: (.*)$/, 'Ordre: $1'], [/^(\d+) found, (\d+) total$/, "$1 trobat(s), $2 en total"], [/^(\d+) found$/, '$1 trobat(s)'],
  [/^Unknown command "(.*)"\.\s+Press F1 for help\.$/, 'Ordre desconeguda "$1". Premi F1 per obtenir ajuda.'],
  [/^Unknown command "(.*)"\.$/, 'Ordre desconeguda "$1".'], [/^Error: (.*)$/, 'Error: $1'],
  [/^\*\* (.*) command not allowed while (.*) is active \*\*$/, "** L'ordre $1 no està permesa mentre $2 està activa **"],
  [/^Resuming (.*) command\.$/, "Es reprèn l'ordre $1."], [/^Dimension text = (.*)$/, 'Text de cota = $1'],
  [/^Current line-width is (.*)$/, "L'amplada de línia actual és $1"], [/^Current settings: Mode = TRIM, Radius = (.*)$/, 'Paràmetres actuals: Mode = RETALLAR, Radi = $1'],
  [/^\("TRIM" mode\) Current chamfer Dist1 = (.*), Dist2 = (.*)$/, '(Mode "RETALLAR") Distància1 de xamfrà actual = $1, Distància2 = $2'],
  [/^Current settings: Projection=UCS, Edge=None, Mode=(\w+)$/, 'Paràmetres actuals: Projecció=SCP, Aresta=Cap, Mode=$1'],
  [/^Current settings: Erase source=(\w+)\s+Layer=Source\s+OFFSETGAPTYPE=0$/, 'Paràmetres actuals: Esborrar origen=$1  Capa=Origen  OFFSETGAPTYPE=0'],
  [/^Current text style:\s+"(.*)"\s+Text height:\s+(\S+)\s+Annotative:\s+No(.*)$/, 'Estil de text actual: "$1"  Alçada del text: $2  Anotatiu: No$3'],
  [/^Current point modes:\s+PDMODE=(\S+)\s+PDSIZE=(\S+)$/, 'Modes de punt actuals: PDMODE=$1  PDSIZE=$2'], [/^Current layer:\s+"(.*)"$/, 'Capa actual: "$1"'],
  [/^Current length: (.*)$/, 'Longitud actual: $1'], [/^Distance = (.*),\s+Angle in XY Plane = (.*), Angle from XY Plane = 0$/, 'Distància = $1,  Angle al pla XY = $2, Angle des del pla XY = 0'],
  [/^Delta X = (.*), Delta Y = (.*), Delta Z = 0\.0000$/, 'Increment X = $1, Increment Y = $2, Increment Z = 0.0000'],
  [/^Area = (.*), (Perimeter|Circumference) = (.*)$/, (m, a, k, p) => `Àrea = ${a}, ${k === 'Perimeter' ? 'Perímetre' : 'Circumferència'} = ${p}`],
  [/^(\d+) objects? exploded\.$/, '$1 objecte(s) descompost(os).'], [/^1 object not able to be exploded\.$/, "No s'ha pogut descompondre 1 objecte."], [/^1 was not able to be exploded\.$/, "No s'ha pogut descompondre 1 objecte."],
  [/^Block "(.*)" defined with (\d+) objects\.$/, 'Bloc "$1" definit amb $2 objectes.'], [/^Block "(.*)" saved\.$/, 'Bloc "$1" desat.'], [/^Block "(.*)" not found\.$/, 'No s\'ha trobat el bloc "$1".'],
  [/^(\d+) blocks? deleted\. (\d+) layers? deleted\.$/, '$1 bloc(s) suprimit(s). $2 capa(es) suprimida(es).'], [/^(\d+) objects converted to (\d+) polylines?$/, '$1 objectes convertits en $2 polilínia(es)'],
  [/^(\d+) segments added to polyline$/, "$1 segments afegits a la polilínia"], [/^(\d+) lines were (filleted|chamfered)$/, (m, n, k) => `${n} línies ${k === 'filleted' ? 'empalmades' : 'aixamfranades'}`],
  [/^(\d+) duplicate\(s\) deleted$/, '$1 duplicat(s) suprimit(s)'], [/^(\d+) objects selected\.$/, '$1 objectes designats.'], [/^(\d+) instances of block "(.*)"\.$/, '$1 insercions del bloc "$2".'],
  [/^(.*) is now the current layer\.$/, '$1 és ara la capa actual.'], [/^(.*) successfully loaded\.$/, "$1 s'ha carregat correctament."], [/^(.*) loaded \(Startup Suite\)\.$/, "$1 carregat (grup d'inici)."],
  [/^Text style "(.*)" is now current\.$/, 'L\'estil de text "$1" és ara l\'actual.'], [/^Linetype "(.*)" loaded\.$/, 'Tipus de línia "$1" carregat.'], [/^Linetype "(.*)" not found\.$/, 'No s\'ha trobat el tipus de línia "$1".'],
  [/^Cannot find layer "(.*)"\.$/, 'No es troba la capa "$1".'], [/^Cannot freeze layer "(.*)"\.\s+It is the CURRENT layer\.$/, 'No es pot inutilitzar la capa "$1". És la capa ACTUAL.'],
  [/^Layers? (.*) ha(s|ve) been isolated\.$/, 'Capa(es) $1 aïllada(es).'], [/^(\d+) object\(s\) changed to layer "(.*)" \(the current layer\)\.$/, '$1 objecte(s) canviat(s) a la capa "$2" (la capa actual).'],
  [/^(.*) parameter is not supported in this version\. Use Linear, Polar, XY, Rotation, Flip, Visibility or Lookup\.$/, 'El paràmetre $1 no està disponible. Utilitzi Lineal, Polar, XY, Rotació, Simetria, Visibilitat o Consulta.'],
  [/^Visibility states: (.*)$/, 'Estats de visibilitat: $1'], [/^Delete layer\(s\) (.*) and all objects on them\?(.*)$/, 'Suprimir la(es) capa(es) $1 i tots els seus objectes?$2'],
  [/^BOUNDARY created (\d+) polylines?$/, 'CONTORN ha creat $1 polilínia(es)'], [/^Current time:\s+(.*)$/, 'Hora actual:             $1'], [/^This drawing has (\d+) objects in model space\.$/, "Aquest dibuix té $1 objectes a l'espai model."],
  [/^(\d+) objects in (.*)$/, '$1 objectes a $2'], [/^Model space uses\s+(.*)$/, "L'espai model utilitza  $1"], [/^Blocks: (\d+)\s+Layers: (\d+)$/, 'Blocs: $1  Capes: $2'],
  [/^Handle seed (.*)$/, "Llavor d'identificadors $1"], [/^Really want layer (.*) \(the CURRENT layer\) off\?$/, 'Desactivar la capa $1 (la capa ACTUAL)?'],
  [/^<(F\d+) toggled>$/, '<$1 commutat>'], [/^Rotating a copy/, "S'està girant una còpia"],
  [/^(\d+) constraint\(s\) applied\.$/, '$1 restricció(ns) aplicada(es).'], [/^(\d+) constraint\(s\) removed\.$/, '$1 restricció(ns) suprimida(es).'],
  [/^Group "(.*)" has been created\.$/, 'S\'ha creat el grup "$1".'], [/^Group (.*) already exists\.$/, 'El grup $1 ja existeix.'], [/^Group (.*) exploded\.$/, 'Grup $1 descompost.'],
  [/^Duct: (.*) mm, (.*) m³\/h, (.*)$/, 'Conducte: $1 mm, $2 m³/h, $3'],
];

// noms d'ordre en català (s'accepten sempre, a més del castellà, el gallec i l'anglès)
export const CMD = {
  LÍNIA: 'LINE', POLILÍNIA: 'PLINE', CERCLE: 'CIRCLE', RECTANGLE: 'RECTANG', POLÍGON: 'POLYGON', EL·LIPSE: 'ELLIPSE', ELIPSE: 'ELLIPSE', LÍNIAX: 'XLINE', RAIG: 'RAY',
  VOLANDERA: 'DONUT', DESPLAÇA: 'MOVE', CÒPIA: 'COPY', GIRA: 'ROTATE', ESCALA: 'SCALE', SIMETRIA: 'MIRROR', EQUIDIST: 'OFFSET', RETALLA: 'TRIM', ALLARGA: 'EXTEND',
  ESBORRA: 'ERASE', DESCOMPON: 'EXPLODE', EMPALMA: 'FILLET', XAMFRÀ: 'CHAMFER', MATRIU: 'ARRAY', ESTIRA: 'STRETCH', TRENCA: 'BREAK', UNEIX: 'JOIN', DESFÉS: 'UNDO',
  REFÉS: 'REDO', TEXT: 'TEXT', TEXTM: 'MTEXT', OMBREJAT: 'HATCH', BLOC: 'BLOCK', INSEREIX: 'INSERT', CAPA: 'LAYER', '-CAPA': '-LAYER', TIPUSLÍNIA: 'LINETYPE',
  GRUIXLÍNIA: 'LWEIGHT', OPCIONS: 'OPTIONS', REIXETA: 'GRID', ENQUADRA: 'PAN', NOU: 'NEW', OBRE: 'OPEN', DESA: 'QSAVE', DESACOM: 'SAVEAS', TRAÇA: 'PLOT', TANCA: 'CLOSE',
  AJUDA: 'HELP', PURGA: 'PURGE', REANOMENA: 'RENAME', COTALINEAL: 'DIMLINEAR', COTAALINEADA: 'DIMALIGNED', COTARADI: 'DIMRADIUS', COTADIÀMETRE: 'DIMDIAMETER',
  COTAANGLE: 'DIMANGULAR', ESTILCOTA: 'DIMSTYLE', TAULA: 'TABLE', CONDUCTE: 'DUCT', CANONADA: 'PIPE', GRUP: 'GROUP', DESAGRUPA: 'UNGROUP', PUBLICA: 'PUBLISH',
  NÚVOL: 'CLOUD', CAMP: 'FIELD', PROPIETATS: 'PROPERTIES', DIVIDEIX: 'DIVIDE', ALINEA: 'ALIGN', ARC: 'ARC', PUNT: 'POINT',
};
export const ALIAS = {};
export const OSNAP = { FIN: 'end', MIG: 'mid', CEN: 'cen', NOD: 'nod', QUA: 'qua', INT: 'int', INS: 'ins', PER: 'per', TAN: 'tan', PRO: 'nea', CAP: 'non', EXT: 'ext', APA: 'app' };
