// Textos de la interfaz de WebCAD Libre.
// Cada línea: castellano | galego | English. El castellano es la clave (es el texto que aparece en el código).
// Las variantes con «...», «:», «(COMANDO)», «(n)» o « X/Y» se resuelven solas (ver lookup en i18n.js).
const TXT = `
Menú de aplicación | Menú da aplicación | Application menu
Nuevo | Novo | New
Nueva | Nova | New
Abrir | Abrir | Open
Guardar | Gardar | Save
Guardar como | Gardar como | Save as
Trazar | Trazar | Plot
Deshacer | Desfacer | Undo
Rehacer | Refacer | Redo
Ctrl+Mayús+S | Ctrl+Maiús+S | Ctrl+Shift+S
Espacio de trabajo | Espazo de traballo | Workspace
Idioma | Idioma | Language
Escriba una palabra clave o frase | Escriba unha palabra clave ou frase | Type a keyword or phrase
Buscar comando | Buscar comando | Search command
Cancelar | Cancelar | Cancel
Esc | Esc | Esc
Personalizar | Personalizar | Customize
Escriba un comando | Escriba un comando | Type a command
Línea de comandos | Liña de comandos | Command line
Dibujo y anotación | Debuxo e anotación | Drafting & annotation
Clásico | Clásico | Classic
Cinta + menús clásicos | Cinta + menús clásicos | Ribbon + classic menus
Archivo | Ficheiro | File
Ayuda | Axuda | Help
Dibujo | Debuxo | Draw
Construir | Construír | Construct
Modificar | Modificar | Modify
Parámetros | Parámetros | Settings
Ver | Ver | View
Espacio modelo o papel | Espazo modelo ou papel | Model or paper space
Mostrar rejilla del dibujo | Amosar a grella do debuxo | Display drawing grid
Modo forzcursor | Modo forzar cursor | Snap mode
Modo orto | Modo orto | Ortho mode
Rastreo polar | Rastrexo polar | Polar tracking
Referencia a objetos (F3) — clic derecho: modos | Referencia a obxectos (F3) — clic dereito: modos | Object snap (F3) — right-click: modes
Mostrar/ocultar grosor de línea | Amosar/ocultar grosor de liña | Show/hide lineweight
Entrada dinámica | Entrada dinámica | Dynamic input
Mostrar el menú de pantalla lateral clásico | Amosar o menú de pantalla lateral clásico | Show the classic side screen menu
Menú clásico | Menú clásico | Classic menu
Mostrar la barra de menús clásica | Amosar a barra de menús clásica | Show the classic menu bar
Barra menús | Barra de menús | Menu bar
Personalización | Personalización | Customization
Inicio | Inicio | Home
Insertar | Inserir | Insert
Anotar | Anotar | Annotate
Vista | Vista | View
Administrar | Administrar | Manage
Salida | Saída | Output
Herramientas extra | Ferramentas extra | Extra tools
Minimizar cinta | Minimizar a cinta | Minimize ribbon
Línea | Liña | Line
Polilínea | Poliliña | Polyline
Círculo | Círculo | Circle
Arco | Arco | Arc
Desplazar | Desprazar | Move
Copiar | Copiar | Copy
Estirar | Estirar | Stretch
Girar | Xirar | Rotate
Simetría | Simetría | Mirror
Escala | Escala | Scale
Recortar | Recortar | Trim
Empalme | Empalme | Fillet
Matriz | Matriz | Array
Texto | Texto | Text
Cota | Cota | Dimension
Lineal | Lineal | Linear
Directriz | Directriz | Leader
Estilo de cota | Estilo de cota | Dimension style
Anotación | Anotación | Annotation
Propiedades de capa | Propiedades de capa | Layer properties
Desactivar | Desactivar | Off
Aislar | Illar | Isolate
Inutilizar | Inutilizar | Freeze
Bloquear | Bloquear | Lock
Desaislar | Desillar | Unisolate
Activar todas | Activar todas | Turn all on
Reutilizar todas | Reutilizar todas | Thaw all
Desbloquear | Desbloquear | Unlock
Establecer como actual | Establecer como actual | Set current
Igualar capa | Igualar capa | Match layer
Capas | Capas | Layers
Crear | Crear | Create
Editar | Editar | Edit
Editar atributos | Editar atributos | Edit attributes
Bloque | Bloque | Block
Igualar propiedades | Igualar propiedades | Match properties
PorCapa | PorCapa | ByLayer
PorBloque | PorBloque | ByBlock
PORCAPA | PORCAPA | BYLAYER
PORBLOQUE | PORBLOQUE | BYBLOCK
Rojo | Vermello | Red
Amarillo | Amarelo | Yellow
Verde | Verde | Green
Cian | Ciano | Cyan
Azul | Azul | Blue
Magenta | Maxenta | Magenta
Blanco | Branco | White
Más colores | Máis cores | More colors
Color de objeto | Cor do obxecto | Object color
Otro | Outro | Other
Tipo de línea | Tipo de liña | Linetype
Por defecto | Por defecto | Default
Grosor de línea | Grosor de liña | Lineweight
Propiedades | Propiedades | Properties
Medir | Medir | Measure
Selección rápida | Selección rápida | Quick select
Seleccionar similares | Seleccionar similares | Select similar
Buscar | Buscar | Find
Utilidades | Utilidades | Utilities
Pegar | Pegar | Paste
Copiar en portapapeles | Copiar no portapapeis | Copy to clipboard
Cortar | Cortar | Cut
Copiar con punto base | Copiar con punto base | Copy with base point
Portapapeles | Portapapeis | Clipboard
Extensión | Extensión | Extents
Ventana | Ventá | Window
Encuadre | Encadre | Pan
Modelo | Modelo | Model
Presentación | Presentación | Layout
Nueva presentación | Nova presentación | New layout
Cerrar | Pechar | Close
Dibujo nuevo | Debuxo novo | New drawing
[-][Superior][Estructura alámbrica 2D] | [-][Superior][Estrutura de arames 2D] | [-][Top][2D Wireframe]
Todavía no hay dibujos recientes. Abra un DWG/DXF o empiece uno nuevo. | Aínda non hai debuxos recentes. Abra un DWG/DXF ou comece un novo. | No recent drawings yet. Open a DWG/DXF or start a new one.
Dibujo técnico 2D, libre y en el navegador. | Debuxo técnico 2D, libre e no navegador. | Free 2D technical drawing in your browser.
Dibujo de ejemplo | Debuxo de exemplo | Sample drawing
Cargar aplicación | Cargar aplicación | Load application
Cargar aplicación (LISP) | Cargar aplicación (LISP) | Load application (LISP)
Comandos y ayuda | Comandos e axuda | Commands and help
Tema | Tema | Theme
Oscuro | Escuro | Dark
Intermedio | Intermedio | Medium
Claro | Claro | Light
Arrastre aquí archivos .dwg, .dxf, .lsp o .scr para abrirlos o cargarlos. | Arrastre aquí ficheiros .dwg, .dxf, .lsp ou .scr para abrilos ou cargalos. | Drop .dwg, .dxf, .lsp or .scr files here to open or load them.
Recientes | Recentes | Recent
Dibujo de ejemplo cargado. Seleccione una PUERTA para ver sus pinzamientos dinámicos (ancho, giro y visibilidad). | Debuxo de exemplo cargado. Seleccione unha PORTA para ver os seus pinzamentos dinámicos (largo, xiro e visibilidade). | Sample drawing loaded. Select a door (PUERTA) to see its dynamic grips (width, swing and visibility).
Centro, radio | Centro, raio | Center, radius
Centro, diámetro | Centro, diámetro | Center, diameter
2 puntos | 2 puntos | 2-point
3 puntos | 3 puntos | 3-point
Tan, tan, radio | Tan, tan, raio | Tan, tan, radius
Inicio, centro, fin | Inicio, centro, fin | Start, center, end
Inicio, fin, centro | Inicio, fin, centro | Start, end, center
Inicio, fin, radio | Inicio, fin, raio | Start, end, radius
Centro, inicio, fin | Centro, inicio, fin | Center, start, end
Rectángulo | Rectángulo | Rectangle
Polígono | Polígono | Polygon
Sombreado | Sombreado | Hatch
Degradado | Degradado | Gradient
Contorno | Contorno | Boundary
Contornos | Contornos | Boundaries
Eje, fin | Eixo, fin | Axis, end
Centro | Centro | Center
Arco elíptico | Arco elíptico | Elliptical arc
Línea auxiliar | Liña auxiliar | Construction line
Rayo | Raio | Ray
Punto múltiple | Punto múltiple | Multiple points
Dividir | Dividir | Divide
Arandela | Arandela | Donut
Nube de revisión | Nube de revisión | Revision cloud
Cobertura | Cobertura | Wipeout
Alargar | Estender | Extend
Chaflán | Chafrán | Chamfer
Matriz rectangular | Matriz rectangular | Rectangular array
Matriz de camino | Matriz de camiño | Path array
Matriz polar | Matriz polar | Polar array
Partir | Partir | Break
Partir en punto | Partir nun punto | Break at point
Editar polilínea | Editar poliliña | Edit polyline
Longitud | Lonxitude | Lengthen
Alinear | Aliñar | Align
Ordenar objetos | Ordenar obxectos | Draw order
Texto de líneas múltiples | Texto de liñas múltiples | Multiline text
Una línea | Unha liña | Single line
Alineada | Aliñada | Aligned
Angular | Angular | Angular
Radio | Raio | Radius
Diámetro | Diámetro | Diameter
Por coordenadas | Por coordenadas | Ordinate
Directriz múltiple | Directriz múltiple | Multileader
Directriz rápida | Directriz rápida | Quick leader
Distancia | Distancia | Distance
Área | Área | Area
Punto ID | Punto ID | ID point
Lista | Lista | List
Pegar como bloque | Pegar como bloque | Paste as block
Pegar en coordenadas originales | Pegar nas coordenadas orixinais | Paste to original coordinates
Editar atributo | Editar atributo | Edit attribute
Definición de bloque | Definición de bloque | Block definition
Crear bloque | Crear bloque | Create block
Definir atributos | Definir atributos | Define attributes
Sincronizar | Sincronizar | Synchronize
Editor de bloques | Editor de bloques | Block editor
Referencia | Referencia | Reference
Enlazar | Ligar | Attach
Bloque a disco | Bloque a disco | Write block
Importar | Importar | Import
Importar DXF/DWG | Importar DXF/DWG | Import DXF/DWG
Estilo de texto | Estilo de texto | Text style
Buscar texto | Buscar texto | Find text
Cotas | Cotas | Dimensions
Continua | Continua | Continue
Línea base | Liña base | Baseline
Editar texto | Editar texto | Edit text
Directrices | Directrices | Leaders
Revisión | Revisión | Review
Herramientas de ventana | Ferramentas de ventá | Viewport tools
Icono SCP | Icona SCP | UCS icon
Navegar | Navegar | Navigate
Previo | Anterior | Previous
Vistas guardadas | Vistas gardadas | Named views
Administrador de vistas | Administrador de vistas | View manager
Regenerar | Rexenerar | Regen
Paletas | Paletas | Palettes
Visual LISP | Visual LISP | Visual LISP
Historial de comandos | Historial de comandos | Command history
Interfaz | Interface | Interface
Fichas de archivo | Lapelas de ficheiro | File tabs
Fichas de presentación | Lapelas de presentación | Layout tabs
Barra de menús clásica | Barra de menús clásica | Classic menu bar
Menú de pantalla clásico | Menú de pantalla clásico | Classic screen menu
Claro/Oscuro | Tema | Theme
Interfaz de usuario | Interface de usuario | User interface
Editar alias | Editar alias | Edit aliases
Cargar .MNU | Cargar .MNU | Load .MNU
Aplicaciones | Aplicacións | Applications
Ejecutar script | Executar script | Run script
Editor de Visual LISP | Editor de Visual LISP | Visual LISP editor
Limpiar | Limpar | Purge
Suprimir duplicados | Suprimir duplicados | Delete duplicates
Auditar | Auditar | Audit
Variables de sistema | Variables do sistema | System variables
Unidades | Unidades | Units
Parámetros de dibujo | Parámetros de debuxo | Drafting settings
Opciones | Opcións | Options
Tipos de línea | Tipos de liña | Linetypes
Grosores de línea | Grosores de liña | Lineweights
Estilo de punto | Estilo de punto | Point style
Configurar página | Configurar páxina | Page setup
Exportar | Exportar | Export
Exportar PDF | Exportar PDF | Export PDF
Exportar DXF | Exportar DXF | Export DXF
Exportar SVG | Exportar SVG | Export SVG
Exportar PNG | Exportar PNG | Export PNG
Imagen | Imaxe | Image
Bloques | Bloques | Blocks
Descomponer atributos | Descompoñer atributos | Burst
Contar | Contar | Count
Fusionar | Fusionar | Merge
Suprimir | Suprimir | Delete
Cambiar a actual | Cambiar á actual | Change to current
Aislar objetos | Illar obxectos | Isolate objects
Ocultar objetos | Ocultar obxectos | Hide objects
Terminar aislamiento | Rematar illamento | End isolation
Herramientas | Ferramentas | Tools
Alias de comandos | Alias de comandos | Command aliases
Calculadora | Calculadora | Calculator
Ventanas de presentación | Ventás de presentación | Layout viewports
Rectangular | Rectangular | Rectangular
Espacio modelo | Espazo modelo | Model space
Espacio papel | Espazo papel | Paper space
Abrir/Guardar | Abrir/Gardar | Open/Save
Guardar bloque | Gardar bloque | Save block
Editar bloque | Editar bloque | Edit block
Geometría | Xeometría | Geometry
Definición de atributo | Definición de atributo | Attribute definition
Punto base | Punto base | Base point
Rotación | Rotación | Rotation
Visibilidad | Visibilidade | Visibility
Acciones | Accións | Actions
Acción | Acción | Action
Suprimir parámetro | Suprimir parámetro | Delete parameter
Estados de visibilidad | Estados de visibilidade | Visibility states
Hacer invisible | Facer invisible | Make invisible
Hacer visible | Facer visible | Make visible
Cerrar Editor de bloques | Pechar o editor de bloques | Close block editor
Cerrar editor de bloques | Pechar o editor de bloques | Close block editor
Creación de sombreado | Creación de sombreado | Hatch creation
Designar puntos | Seleccionar puntos | Pick points
Designar | Seleccionar | Select
Patrón | Patrón | Pattern
Cerrar Creación de sombreado | Pechar a creación de sombreado | Close hatch creation
Punto | Punto | Point
Referencia a bloque | Referencia a bloque | Block reference
Elipse | Elipse | Ellipse
Spline | Spline | Spline
Sólido 2D | Sólido 2D | 2D solid
Ventana gráfica | Ventá gráfica | Viewport
Recuperar | Recuperar | Recover
Importar/Exportar | Importar/Exportar | Import/Export
Entrada DXF | Entrada DXF | DXF in
Salida DXF | Saída DXF | DXF out
Salida PDF | Saída PDF | PDF out
Salida SVG | Saída SVG | SVG out
Salida PNG | Saída PNG | PNG out
Referencia externa | Referencia externa | External reference
Salir | Saír | Exit
¡Ayuda! | Axuda! | Help!
Referencia a objetos | Referencia a obxectos | Object snap
Punto final | Punto final | Endpoint
Inserción | Inserción | Insertion
Intersección | Intersección | Intersection
Punto medio | Punto medio | Midpoint
Cercano | Próximo | Nearest
Nodo | Nodo | Node
Perpendicular | Perpendicular | Perpendicular
Cuadrante | Cuadrante | Quadrant
Tangente | Tanxente | Tangent
Ninguno | Ningunha | None
Extensión de línea | Extensión de liña | Extension
Referencia a objetos implícita | Referencia a obxectos implícita | Running object snap
Consultar | Consultar | Inquiry
Hora | Hora | Time
Estado | Estado | Status
Designar todo | Seleccionar todo | Select all
Dinámico | Dinámico | Dynamic
Líneas múltiples | Liñas múltiples | Multiline
Insertar bloque | Inserir bloque | Insert block
Desfase | Equidistancia | Offset
Graduar | Graduar | Measure
Atributo | Atributo | Attribute
Entidad | Entidade | Entity
Borrar | Borrar | Erase
¡Uy! | Ai! | Oops!
Cambiar propiedades | Cambiar propiedades | Change properties
Juntar | Xuntar | Join
Descomponer | Descompoñer | Explode
Redibujar | Redebuxar | Redraw
Zoom | Zoom | Zoom
Todo | Todo | All
Modelo/Papel | Modelo/Papel | Model/Paper
Espacio papel (Presentación1) | Espazo papel (Presentación1) | Paper space (Presentación1)
Ventanas múltiples | Ventás múltiples | Multiple viewports
Crear ventanas | Crear ventás | Create viewports
Espacio modelo (en ventana) | Espazo modelo (na ventá) | Model space (floating)
Ayudas al dibujo | Axudas ao debuxo | Drawing aids
Control de capas | Control de capas | Layer control
Color | Cor | Color
Control de unidades | Control de unidades | Units control
Cargar menú | Cargar menú | Load menu
Personalizar (CUI) | Personalizar (CUI) | Customize (CUI)
Cargar menú (.MNU) | Cargar menú (.MNU) | Load menu (.MNU)
Color de sombreado | Cor do sombreado | Hatch color
Ángulo | Ángulo | Angle
Imprimir / Trazar | Imprimir / Trazar | Print / Plot
Utilidades de dibujo: Limpiar | Utilidades de debuxo: Limpar | Drawing utilities: Purge
Utilidades de dibujo: Revisar | Utilidades de debuxo: Revisar | Drawing utilities: Audit
Acerca de | Acerca de | About
Intersección ficticia | Intersección aparente | Apparent intersection
Parámetros de referencia a objetos | Parámetros de referencia a obxectos | Object snap settings
Zoom extensión | Zoom extensión | Zoom extents
Copiar selección | Copiar selección | Copy selection
Deseleccionar todo | Deseleccionar todo | Deselect all
Importar... | Importar... | Import...
(varía) | (varía) | (varies)
*VARÍA* | *VARÍA* | *VARIES*
Sin selección | Sen selección | No selection
General | Xeral | General
Capa | Capa | Layer
Escala de tipo de línea | Escala do tipo de liña | Linetype scale
Altura | Altura | Height
Anchura | Largura | Width
Varios | Varios | Misc
Escala de anotación | Escala de anotación | Annotation scale
Icono SCP activado | Icona SCP activada | UCS icon on
Espacio | Espazo | Space
Seleccionar color | Seleccionar cor | Select color
Circunferencia | Circunferencia | Circumference
Inicio X | Inicio X | Start X
Incremento X | Incremento X | Delta X
Incremento Y | Incremento Y | Delta Y
Vértice actual | Vértice actual | Current vertex
Vértice | Vértice | Vertex
Curvatura | Curvatura | Bulge
Anchura global | Largura global | Global width
Cerrada | Pechada | Closed
Sí | Si | Yes
No | Non | No
Medida | Medida | Measurement
Sustitución de texto | Substitución de texto | Text override
Escala global de cota | Escala global de cota | Dim scale overall
Altura de texto | Altura do texto | Text height
Tamaño de flecha | Tamaño da frecha | Arrow size
Precisión | Precisión | Precision
Contenido | Contido | Contents
Superior izquierda | Superior esquerda | Top left
Superior centro | Superior centro | Top center
Superior derecha | Superior dereita | Top right
Medio izquierda | Medio esquerda | Middle left
Medio centro | Medio centro | Middle center
Medio derecha | Medio dereita | Middle right
Inferior izquierda | Inferior esquerda | Bottom left
Inferior centro | Inferior centro | Bottom center
Inferior derecha | Inferior dereita | Bottom right
Izquierda | Esquerda | Left
Derecha | Dereita | Right
Medio | Medio | Middle
Enlace | Ligazón | Attachment
Anchura definida | Largura definida | Defined width
Factor de interlineado | Factor de entreliñado | Line space factor
Posición | Posición | Position
Nombre | Nome | Name
Estilo | Estilo | Style
Justificación | Xustificación | Justify
Factor de anchura | Factor de largura | Width factor
Fin | Fin | End
Radio mayor | Raio maior | Major radius
Radio menor | Raio menor | Minor radius
Relación de radios | Relación de raios | Radius ratio
Identificador | Identificador | Tag
Mensaje | Mensaxe | Prompt
Ángulo inicial | Ángulo inicial | Start angle
Ángulo final | Ángulo final | End angle
Ángulo total | Ángulo total | Total angle
Longitud de arco | Lonxitude de arco | Arc length
Personalizado (bloque dinámico) | Personalizado (bloque dinámico) | Custom (dynamic block)
Sin simetría | Sen simetría | Not flipped
Con simetría | Con simetría | Flipped
Atributos | Atributos | Attributes
Escala estándar | Escala estándar | Standard scale
Escala personalizada | Escala personalizada | Custom scale
Visualización bloqueada | Visualización bloqueada | Display locked
Puntos de ajuste | Puntos de axuste | Fit points
Puntos de control | Puntos de control | Control points
Editar texto... | Editar texto... | Edit text...
Seleccionar color... | Seleccionar cor... | Select color...
Línea auxiliar | Liña auxiliar | Construction line
Texto de líneas múltiples | Texto de liñas múltiples | Multiline text
Buscar capa | Buscar capa | Search layer
Nueva capa | Nova capa | New layer
Suprimir capa | Suprimir capa | Delete layer
Actual | Actual | Current
Administrador de propiedades de capas | Administrador de propiedades de capas | Layer properties manager
Todas: {0} de {1} capas | Todas: {0} de {1} capas | All: {0} of {1} layers
Capa actual | Capa actual | Current layer
Activada | Activada | On
Act. | Act. | On
E.. | E.. | S..
Capa en uso | Capa en uso | Layer in use
Capa vacía | Capa baleira | Empty layer
Descripción | Descrición | Description
Continuous | Continuous | Continuous
_$ Consola de Visual LISP — escriba expresiones abajo.\\n | _$ Consola de Visual LISP — escriba expresións abaixo.\\n | _$ Visual LISP console — type expressions below.\\n
Cargar ventana activa | Cargar a ventá activa | Load active window
Comprobar paréntesis | Comprobar parénteses | Check parentheses
Visual LISP para WebCAD | Visual LISP para WebCAD | Visual LISP for WebCAD
Intro = nuevo párrafo. Ancho de columna: sin límite. | Intro = novo parágrafo. Largura de columna: sen límite. | Enter = new paragraph. Column width: no limit.
Aceptar | Aceptar | OK
Editor de texto | Editor de texto | Text editor
Bloque que desea crear o editar | Bloque que desexa crear ou editar | Block to create or edit
Editar definición de bloque | Editar definición de bloque | Edit block definition
Sombreado y degradado | Sombreado e degradado | Hatch and gradient
DXF versión 12 (*.dxf) | DXF versión 12 (*.dxf) | DXF version 12 (*.dxf)
WebCAD nativo — conserva bloques dinámicos (*.wcad) | WebCAD nativo — conserva os bloques dinámicos (*.wcad) | Native WebCAD — keeps dynamic blocks (*.wcad)
Nombre de archivo | Nome do ficheiro | File name
Tipo de archivo | Tipo de ficheiro | File type
DXF 2000 conserva capas, grosores, sombreados, splines, presentaciones y grupos, y lo abre cualquier programa de CAD. El formato .wcad guarda además bloques dinámicos y restricciones (WebCAD también los recupera desde su propio DXF). | DXF 2000 conserva capas, grosores, sombreados, splines, presentacións e grupos, e ábreo calquera programa de CAD. O formato .wcad garda ademais os bloques dinámicos e as restricións (WebCAD tamén os recupera desde o seu propio DXF). | DXF 2000 keeps layers, lineweights, hatches, splines, layouts and groups, and opens in any CAD program. The .wcad format also keeps dynamic blocks and constraints (WebCAD also recovers them from its own DXF).
DXF versión 2000 (*.dxf) | DXF versión 2000 (*.dxf) | DXF version 2000 (*.dxf)
Guardar dibujo como | Gardar debuxo como | Save drawing as
Color de índice | Cor de índice | Index color
Estado de visibilidad | Estado de visibilidade | Visibility state
Editor de bloques — {0} | Editor de bloques — {0} | Block editor — {0}
MODELO (ventana) | MODELO (ventá) | MODEL (viewport)
PAPEL | PAPEL | PAPER
MODELO | MODELO | MODEL
REJILLA | GRELLA | GRID
FORZC | FORZC | SNAP
ORTO | ORTO | ORTHO
POLAR | POLAR | POLAR
REFENT | REFOBX | OSNAP
GLN | GLÑ | LWT
DIN | DIN | DYN
Opciones... | Opcións... | Options...
Parámetros de dibujo... | Parámetros de debuxo... | Drafting settings...
Atajos y alias (CUI) | Atallos e alias (CUI) | Shortcuts and aliases (CUI)
Cargar menú .MNU | Cargar menú .MNU | Load .MNU menu
Pantalla limpia (cinta sí/no) | Pantalla limpa (cinta si/non) | Clean screen (ribbon on/off)
Historial de comandos (F2) | Historial de comandos (F2) | Command history (F2)
Copiar (desplazar o copiar) | Copiar (desprazar ou copiar) | Copy (move or copy)
Renombrar | Renomear | Rename
Configurar página / Trazar | Configurar páxina / Trazar | Page setup / Plot
Forzcursor activado | Forzar cursor activado | Snap on
Rejilla activada | Grella activada | Grid on
Intervalo de forzcursor | Intervalo de forzar cursor | Snap spacing
Intervalo de rejilla | Intervalo da grella | Grid spacing
Rastreo polar activado | Rastrexo polar activado | Polar tracking on
Ángulo de incremento | Ángulo de incremento | Increment angle
Referencia a objetos activada | Referencia a obxectos activada | Object snap on
Modos de referencia a objetos | Modos de referencia a obxectos | Object snap modes
Seleccionar todo | Seleccionar todo | Select all
Borrar todo | Borrar todo | Clear all
Activar entrada dinámica | Activar entrada dinámica | Enable dynamic input
Muestra el mensaje del comando y las coordenadas junto al cursor. | Amosa a mensaxe do comando e as coordenadas xunto ao cursor. | Shows the command prompt and coordinates next to the cursor.
Forzcursor y rejilla | Forzar cursor e grella | Snap and grid
Rastreo polar | Rastrexo polar | Polar tracking
variable | variable | variable
Tema de color | Tema de cor | Color theme
Fondo del espacio modelo | Fondo do espazo modelo | Model space background
Fondo del papel | Fondo do papel | Paper background
Fondo de presentación | Fondo da presentación | Layout background
Tamaño del cursor en cruz | Tamaño do cursor en cruz | Crosshair size
Tamaño de la mira | Tamaño da mira | Pickbox size
Tamaño de pinzamiento | Tamaño do pinzamento | Grip size
Apertura de AutoSnap | Apertura de AutoSnap | AutoSnap aperture
Mostrar cinta de opciones | Amosar a cinta de opcións | Show ribbon
Mostrar barra de menús clásica | Amosar a barra de menús clásica | Show classic menu bar
Mostrar menú de pantalla lateral | Amosar o menú de pantalla lateral | Show side screen menu
Mostrar menú de pantalla lateral clásico | Amosar o menú de pantalla lateral clásico | Show classic side screen menu
Fichas Modelo/Presentación | Lapelas Modelo/Presentación | Model/Layout tabs
Autocompletar en la línea de comandos | Autocompletar na liña de comandos | Command line autocomplete
Restaurar menú clásico | Restaurar o menú clásico | Restore classic menu
Eliminar | Eliminar | Remove
Alias | Alias | Alias
Pulse la combinación | Prema a combinación | Press the key combination
COMANDO o macro | COMANDO ou macro | COMMAND or macro
Alias de comandos (.pgp) | Alias de comandos (.pgp) | Command aliases (.pgp)
Repetir {0} | Repetir {0} | Repeat {0}
Papel | Papel | Paper
Polar | Polar | Polar
Orto | Orto | Ortho
Configuración | Configuración | Settings
Principal | Principal | Main
Impresión | Impresión | Printing
Restricciones | Restricións | Constraints
Lámina | Lámina | Sheet
Rejilla | Grella | Grid
Referencias | Referencias | Object snap
Grosor | Grosor | Lineweight
Dinámica | Dinámica | Dynamic
Forzado | Forzado | Snap
Tema claro | Tema claro | Light theme
Tema intermedio | Tema intermedio | Medium theme
Tema oscuro | Tema escuro | Dark theme
Disposición | Disposición | Layout
Plano nuevo | Plano novo | New drawing
Barra lateral | Barra lateral | Side toolbar
Menús clásicos | Menús clásicos | Classic menus
Barra lateral + menús clásicos | Barra lateral + menús clásicos | Side toolbar + classic menus
Barra lateral de herramientas | Barra lateral de ferramentas | Side toolbar
Ocultar o mostrar el panel de herramientas | Ocultar ou amosar o panel de ferramentas | Hide or show the tools panel
Forzado del cursor a la rejilla (F9) | Forzado do cursor á grella (F9) | Snap cursor to grid (F9)
Modelo en ventana | Modelo en xanela | Model in viewport
Espacio papel (primera lámina) | Espazo papel (primeira lámina) | Paper space (first sheet)
La capa "{0}" contiene objetos. Use {1} para borrarla con sus objetos. | A capa "{0}" contén obxectos. Use {1} para borrala cos seus obxectos. | Layer "{0}" contains objects. Use {1} to delete it with its objects.
Inglés | Inglés | English
Añadir | Engadir | Add
Filtrar | Filtrar | Filter
Comando | Comando | Command
Importar acad.pgp | Importar acad.pgp | Import acad.pgp
Atajos de teclado | Atallos de teclado | Keyboard shortcuts
Asignar | Asignar | Assign
Tecla | Tecla | Key
Comando / macro | Comando / macro | Command / macro
Atajos fijos: Ctrl+Z/Y, Ctrl+C/X/V, Ctrl+S/O/N/P, Ctrl+A, Ctrl+1 (propiedades), F1-F12, Supr, Esc, Espacio/Intro (repetir). | Atallos fixos: Ctrl+Z/Y, Ctrl+C/X/V, Ctrl+S/O/N/P, Ctrl+A, Ctrl+1 (propiedades), F1-F12, Supr, Esc, Espazo/Intro (repetir). | Fixed shortcuts: Ctrl+Z/Y, Ctrl+C/X/V, Ctrl+S/O/N/P, Ctrl+A, Ctrl+1 (properties), F1-F12, Del, Esc, Space/Enter (repeat).
Grupo de inicio | Grupo de inicio | Startup suite
Grupo de inicio (rutinas LISP cargadas al iniciar) | Grupo de inicio (rutinas LISP cargadas ao iniciar) | Startup suite (LISP routines loaded at startup)
Visualización | Visualización | Display
Selección | Selección | Selection
Atajos y alias | Atallos e alias | Shortcuts and aliases
Archivos / LISP | Ficheiros / LISP | Files / LISP
Doble clic para ejecutar. Escriba el comando en cualquiera de los idiomas o su alias en la línea de comandos (el prefijo _ fuerza el inglés); Intro/Espacio repite el último. Las expresiones (…) se evalúan como AutoLISP. | Dobre clic para executar. Escriba o comando en calquera dos idiomas ou o seu alias na liña de comandos (o prefixo _ forza o inglés); Intro/Espazo repite o último. As expresións (…) avalíanse como AutoLISP. | Double-click to run. Type the command in any of the languages, or its alias, at the command line (the _ prefix forces English); Enter/Space repeats the last one. (…) expressions are evaluated as AutoLISP.
Ayuda — Referencia de comandos | Axuda — Referencia de comandos | Help — Command reference
Buscar comando… | Buscar comando… | Search command…
Alias | Alias | Aliases
Científico | Científico | Scientific
Decimal | Decimal | Decimal
Pies y pulgadas I | Pés e polgadas I | Architectural
Pies y pulgadas II | Pés e polgadas II | Engineering
Fraccionario | Fraccionario | Fractional
Tipo de longitud | Tipo de lonxitude | Length type
Grados decimales | Graos decimais | Decimal degrees
Grados/min/seg | Graos/min/seg | Deg/min/sec
Grados centesimales | Graos centesimais | Grads
Radianes | Radiáns | Radians
Tipo de ángulo | Tipo de ángulo | Angle type
Precisión angular | Precisión angular | Angle precision
Sin unidades | Sen unidades | Unitless
Pulgadas | Polgadas | Inches
Pies | Pés | Feet
Milímetros | Milímetros | Millimeters
Centímetros | Centímetros | Centimeters
Metros | Metros | Meters
Escala de inserción | Escala de inserción | Insertion scale
Unidades de dibujo | Unidades de debuxo | Drawing units
Nombre de estilo | Nome do estilo | Style name
Fuente | Fonte | Font
Altura (0 = variable) | Altura (0 = variable) | Height (0 = variable)
Escala global | Escala global | Overall scale
Desfase línea de referencia | Desfase da liña de referencia | Extension line offset
Ampliación sobre línea de cota | Ampliación sobre a liña de cota | Extend beyond dim line
Desfase del texto | Desfase do texto | Text offset
Decimales | Decimais | Decimals
Factor de escala lineal | Factor de escala lineal | Linear scale factor
Texto sobre la línea | Texto sobre a liña | Text above line
Sufijo | Sufixo | Suffix
Color línea de cota | Cor da liña de cota | Dimension line color
Color del texto | Cor do texto | Text color
Administrador de estilos de cota — ISO-25 | Administrador de estilos de cota — ISO-25 | Dimension style manager — ISO-25
Designar punto | Seleccionar punto | Pick point
Objetos | Obxectos | Objects
Designar objetos | Seleccionar obxectos | Select objects
Conservar | Conservar | Retain
Convertir en bloque | Converter en bloque | Convert to block
0 objetos designados | 0 obxectos seleccionados | 0 objects selected
Examinar | Examinar | Browse
Bloques del dibujo actual | Bloques do debuxo actual | Current drawing blocks
Uniforme | Uniforme | Uniform
Rotación° | Rotación° | Rotation°
Insertar (bloques) | Inserir (bloques) | Insert (blocks)
PublishToWeb PNG.pc3 (imagen) | PublishToWeb PNG.pc3 (imaxe) | PublishToWeb PNG.pc3 (image)
SVG (vectorial) | SVG (vectorial) | SVG (vector)
Impresora/trazador | Impresora/trazador | Printer/plotter
Tamaño de papel | Tamaño do papel | Paper size
Pantalla | Pantalla | Display
Área de trazado | Área de trazado | Plot area
Ajustar al papel | Axustar ao papel | Fit to paper
Horizontal | Horizontal | Landscape
Vertical | Vertical | Portrait
monochrome.ctb (monocromo) | monochrome.ctb (monocromo) | monochrome.ctb (monochrome)
Calidad (ppp) | Calidade (ppp) | Quality (dpi)
Trazar - Modelo | Trazar - Modelo | Plot - Model
Estilo de trazado | Estilo de trazado | Plot style
Orientación | Orientación | Orientation
Escala de trazado | Escala de trazado | Plot scale
Límites | Límites | Limits
Ninguno (color) | Ningún (cor) | None (color)
(Múltiple) | (Múltiple) | (Multiple)
Tipo de objeto | Tipo de obxecto | Object type
Nombre de bloque | Nome do bloque | Block name
Contenido de texto | Contido do texto | Text contents
= Igual a | = Igual a | = Equals
<> Distinto de | <> Distinto de | <> Not equal
* Coincidencia con comodines | * Coincidencia con comodíns | * Wildcard match
Operador | Operador | Operator
Valor | Valor | Value
Aplicar a | Aplicar a | Apply to
Todo el dibujo | Todo o debuxo | Entire drawing
Selección actual | Selección actual | Current selection
Reemplazar por | Substituír por | Replace with
Reemplazar todo | Substituír todo | Replace all
Buscar y reemplazar | Buscar e substituír | Find and replace
Solid line | Liña continua | Solid line
Cargar | Cargar | Load
Factor de escala global | Factor de escala global | Global scale factor
Administrador de tipos de línea | Administrador de tipos de liña | Linetype manager
Mostrar grosor de línea | Amosar grosor de liña | Display lineweight
Parámetros de grosor de línea | Parámetros de grosor de liña | Lineweight settings
Tamaño de punto | Tamaño do punto | Point size
Invisible | Invisible | Invisible
Constante | Constante | Constant
Valor por defecto | Valor por defecto | Default
Editar texto de cota | Editar texto de cota | Edit dimension text
Texto (<> = medida) | Texto (<> = medida) | Text (<> = measurement)
Editar definición de atributo | Editar definición de atributo | Edit attribute definition
Editor de atributos mejorado — {0} | Editor de atributos mellorado — {0} | Enhanced attribute editor — {0}
Definición de atributo | Definición de atributo | Attribute definition
Estilo de texto | Estilo de texto | Text style
Editar atributos | Editar atributos | Edit attributes
Centro | Centro | Center
Grupo de inicio (rutinas LISP cargadas al iniciar): | Grupo de inicio (rutinas LISP cargadas ao iniciar): | Startup suite (LISP routines loaded at startup):
Puntos | Puntos | Points
Insertar | Inserir | Insert
Escala Y | Escala Y | Scale Y
Clic derecho | Clic dereito | Right-click
Interfaz clásica: barra de menús + menú de pantalla. | Interface clásica: barra de menús + menú de pantalla. | Classic interface: menu bar + screen menu.
Menú clásico restaurado. | Menú clásico restaurado. | Classic menu restored.
No se puede borrar la capa 0, Defpoints, la actual o una capa con objetos. | Non se pode borrar a capa 0, Defpoints, a actual nin unha capa con obxectos. | Can't delete layer 0, Defpoints, the current layer or a layer with objects.
No se puede borrar un tipo de línea en uso. | Non se pode borrar un tipo de liña en uso. | Can't delete a linetype in use.
No se puede inutilizar la capa actual. | Non se pode inutilizar a capa actual. | Can't freeze the current layer.
WebCAD Libre — dibujo técnico 2D. Escriba los comandos en castellano o en inglés (p. ej. LINEA, LINE o L). F1: ayuda. | WebCAD Libre — debuxo técnico 2D. Escriba os comandos en galego, castelán ou inglés (p. ex. LIÑA, LINEA, LINE ou L). F1: axuda. | WebCAD Libre — 2D technical drawing. Type commands in English or Spanish (e.g. LINE, LINEA or L). F1: help.
Cargando lector DWG (LibreDWG/WebAssembly) | Cargando o lector DWG (LibreDWG/WebAssembly) | Loading DWG reader (LibreDWG/WebAssembly)
WebCAD Libre\\nCAD 2D en el navegador: dibujo, edición, bloques dinámicos, restricciones, AutoLISP con DCL, lectura y escritura DXF (versiones 12 y 2000) y lectura DWG mediante LibreDWG (WebAssembly).\\n\\nSoftware libre. Funciona sin conexión y sin servidor. | WebCAD Libre\\nCAD 2D no navegador: debuxo, edición, bloques dinámicos, restricións, AutoLISP con DCL, lectura e escritura DXF (versións 12 e 2000) e lectura DWG mediante LibreDWG (WebAssembly).\\n\\nSoftware libre. Funciona sen conexión e sen servidor. | WebCAD Libre\\n2D CAD in the browser: drawing, editing, dynamic blocks, constraints, AutoLISP with DCL, DXF read/write (versions 12 and 2000) and DWG reading via LibreDWG (WebAssembly).\\n\\nFree software. Works offline, no server needed.
Comandos | Comandos | Commands
Aplicar | Aplicar | Apply
Restablecer | Restablecer | Reset
Examinar... | Examinar... | Browse...
Ruta | Ruta | Path
Cargadas | Cargadas | Loaded
Quitar | Quitar | Remove
BLOQUES | BLOQUES | BLOCKS
ACOTAR | COTAR | DIM
VISUALIZ | VISUALIZ | DISPLAY
DIBUJO | DEBUXO | DRAW
EDITAR | EDITAR | EDIT
CONSULTA | CONSULTA | INQUIRY
CAPA | CAPA | LAYER
VMULT | VMULT | MVIEW
TRAZAR | TRAZAR | PLOT
PARAMS | PARAMS | SETTINGS
UTILIDAD | UTILIDADE | UTILITY
GUARDAR | GARDAR | SAVE
ARCO | ARCO | ARC
ATRDEF | ATRDEF | ATTDEF
SOMBCONT | SOMBCONT | HATCH
CIRCULO | CÍRCULO | CIRCLE
ARANDELA | ARANDELA | DONUT
TEXTODIN | TEXTODIN | DTEXT
ELIPSE | ELIPSE | ELLIPSE
SOMBCON | SOMBCON | BHATCH
INSERT | INSERIR | INSERT
LINEA | LIÑA | LINE
TEXTOM | TEXTOM | MTEXT
POL | POL | PLINE
PUNTO | PUNTO | POINT
POLIGONO | POLÍGONO | POLYGON
RECTANG | RECTANG | RECTANG
SPLINE | SPLINE | SPLINE
LINEAX | LIÑAX | XLINE
ULTIMO | ÚLTIMO | LAST
I,C,F | I,C,F | S,C,E
I,F,R | I,F,R | S,E,R
I,F,C | I,F,C | S,E,C
C,I,F | C,I,F | C,S,E
CEN,RAD | CEN,RAI | CEN,RAD
CEN,DIA | CEN,DIA | CEN,DIA
2PUNTOS | 2PUNTOS | 2POINT
3PUNTOS | 3PUNTOS | 3POINT
TTR | TTR | TTR
MATRIZ | MATRIZ | ARRAY
EDITATR | EDITATR | ATTEDIT
PARTE | PARTE | BREAK
CHAFLAN | CHAFRÁN | CHAMFER
CAMBIAPR | CAMBIAPR | CHPROP
COPIA | COPIA | COPY
DDEDIC | DDEDIC | DDEDIT
DIVIDE | DIVIDE | DIVIDE
BORRA | BORRA | ERASE
DESCOMP | DESCOMP | EXPLODE
ALARGA | ESTENDE | EXTEND
EMPALME | EMPALME | FILLET
GRADUA | GRADÚA | MEASURE
SIMETRIA | SIMETRÍA | MIRROR
DESPLAZA | DESPRAZA | MOVE
EQDIST | EQDIST | OFFSET
EDITPOL | EDITPOL | PEDIT
GIRA | XIRA | ROTATE
ESCALA | ESCALA | SCALE
ESTIRA | ESTIRA | STRETCH
RECORTA | RECORTA | TRIM
DESHACER | DESFACER | UNDO
ENCUADRE | ENCADRE | PAN
REDIBUJA | REDEBUXA | REDRAW
REGEN | REXEN | REGEN
VISTA | VISTA | VIEW
ZOOM | ZOOM | ZOOM
ZOOM V | ZOOM V | ZOOM W
ZOOM E | ZOOM E | ZOOM E
ZOOM P | ZOOM A | ZOOM P
ZOOM T | ZOOM T | ZOOM A
AREA | ÁREA | AREA
LISTBD | LISTBD | DBLIST
DIST | DIST | DIST
ID | ID | ID
LIST | LISTA | LIST
ESTADO | ESTADO | STATUS
HORA | HORA | TIME
BASE | BASE | BASE
EDITBLOQ | EDITBLOQ | BEDIT
BLOQUE | BLOQUE | BLOCK
LIMPIA | LIMPA | PURGE
BLOQDISC | BLOQDISC | WBLOCK
REFX | REFX | XREF
PARAMB | PARAMB | BPARAM
ACCIONB | ACCIÓNB | BACTION
ESTADOVI | ESTADOVI | BVSTATE
CERRARBL | PECHARBL | BCLOSE
LINEAL | LINEAL | LINEAR
ALINEADA | ALIÑADA | ALIGNED
ANGULAR | ANGULAR | ANGULAR
RADIO | RAIO | RADIUS
DIAMETRO | DIÁMETRO | DIAMETER
COORDEN | COORDEN | ORDINATE
CONTINUA | CONTINUA | CONTINUE
LINBASE | LIÑBASE | BASELINE
DIRECTRZ | DIRECTRIZ | LEADER
EDITTEXT | EDITTEXT | TEDIT
ESTILO | ESTILO | STYLE
EMODELO | EMODELO | MSPACE
EPAPEL | EPAPEL | PSPACE
PRESENT | PRESENT | LAYOUT
AYUDAS | AXUDAS | AIDS
UNIDADES | UNIDADES | UNITS
COLOR | COR | COLOR
REJILLA | GRELLA | GRID
LIMITES | LÍMITES | LIMITS
TIPOLIN | TIPOLIÑ | LINETYPE
ESCALATL | ESCALATL | LTSCALE
REFENT | REFOBX | OSNAP
PDMODE | PDMODE | PDMODE
MODIVAR | MODIVAR | SETVAR
FORZCURS | FORZCURS | SNAP
OPCIONES | OPCIÓNS | OPTIONS
CARGAAP | CARGAAP | APPLOAD
AUDITAR | AUDITAR | AUDIT
ENTDXF | ENTDXF | DXFIN
SALDXF | SAÍDXF | DXFOUT
MENU | MENÚ | MENU
NUEVO | NOVO | NEW
ABRIR | ABRIR | OPEN
CAMBIANOM | RENOMEA | RENAME
GUARDCOM | GARDCOMO | SAVEAS
SCRIPT | SCRIPT | SCRIPT
VLISP | VLISP | VLISP
REFENT- | REFOBX- | OSNAP-
CENtro | CENtro | CENter
FINal | FINal | ENDpoint
INSerción | INSerción | INSert
INTersec | INTersec | INTersec
MEDio | MEDio | MIDpoint
CERcano | PROximo | NEArest
NODo | NODo | NODe
PERpend | PERpend | PERpend
CUAdrante | CUAdrante | QUAdrant
TANgente | TANxente | TANgent
NINGUNO | NINGUNHA | NONE
Paramétrico | Paramétrico | Parametric
Instalaciones | Instalacións | MEP
Colaborar | Colaborar | Collaborate
Grupo | Grupo | Group
Grupos | Grupos | Groups
Desagrupar | Desagrupar | Ungroup
Editar grupo | Editar grupo | Edit group
Referencias externas | Referencias externas | External references
Biblioteca | Biblioteca | Library
Biblioteca de bloques | Biblioteca de bloques | Block library
Datos | Datos | Data
Tabla | Táboa | Table
Tablas | Táboas | Tables
Campo | Campo | Field
Actualizar campos | Actualizar campos | Update fields
Extracción de datos | Extracción de datos | Data extraction
Editar tabla | Editar táboa | Edit table
Exportar tabla | Exportar táboa | Export table
Nuevo desde plantilla | Novo desde modelo | New from template
Propiedades del dibujo | Propiedades do debuxo | Drawing properties
Cajetín | Caixetín | Title block
Publicar | Publicar | Publish
Estilos de trazado | Estilos de trazado | Plot styles
Geométricas | Xeométricas | Geometric
Restricción automática | Restrición automática | Auto constrain
Coincidente | Coincidente | Coincident
Colineal | Colineal | Collinear
Concéntrica | Concéntrica | Concentric
Fija | Fixa | Fix
Paralela | Paralela | Parallel
Igual | Igual | Equal
Barras de restricción | Barras de restrición | Constraint bars
Por cota | Por cota | Dimensional
Mostrar/ocultar | Amosar/ocultar | Show/hide
Suprimir restricciones | Suprimir restricións | Delete constraints
Administrador de parámetros | Administrador de parámetros | Parameters manager
Conductos | Condutos | Ducts
Conducto | Conduto | Duct
Dimensionar | Dimensionar | Size
Pérdida de carga | Perda de carga | Pressure drop
Tuberías | Tubaxes | Piping
Tubería | Tubaxe | Pipe
Isométrico | Isométrico | Isometric
Dibujo isométrico | Debuxo isométrico | Isometric drafting
Plano isométrico | Plano isométrico | Isoplane
Círculo isométrico | Círculo isométrico | Isocircle
Isoplano | Isoplano | Isoplane
Left | Esquerdo | Left
Top | Superior | Top
Right | Dereito | Right
Mediciones | Medicións | Takeoff
Nube | Nube | Cloud
Configurar nube | Configurar a nube | Cloud setup
Guardar en la nube | Gardar na nube | Save to cloud
Abrir de la nube | Abrir da nube | Open from cloud
Abrir desde la nube | Abrir desde a nube | Open from cloud
Versiones | Versións | Versions
Marca de revisión | Marca de revisión | Review markup
Marcas | Marcas | Markups
Marcas de revisión | Marcas de revisión | Review markups
Nube (Supabase) | Nube (Supabase) | Cloud (Supabase)
clave anon pública | clave anon pública | public anon key
Sin sesión iniciada | Sen sesión iniciada | Not signed in
Sesión iniciada como {0} | Sesión iniciada como {0} | Signed in as {0}
Nube: {0} | Nube: {0} | Cloud: {0}
La nube no está configurada. | A nube non está configurada. | The cloud is not configured.
La nube no está configurada (NUBE > Configurar). | A nube non está configurada (NUBE > Configurar). | The cloud is not configured (CLOUD > Setup).
Guarde dibujos en su propio proyecto de Supabase para trabajar en equipo, con historial de versiones y marcas de revisión. El esquema está en supabase/schema.sql. | Garde debuxos no seu propio proxecto de Supabase para traballar en equipo, con historial de versións e marcas de revisión. O esquema está en supabase/schema.sql. | Save drawings to your own Supabase project to work as a team, with version history and review markups. The schema is in supabase/schema.sql.
URL del proyecto | URL do proxecto | Project URL
Clave anon | Clave anon | Anon key
Correo | Correo | Email
Contraseña | Contrasinal | Password
Iniciar sesión | Iniciar sesión | Sign in
Crear cuenta | Crear conta | Create account
Enlace por correo | Ligazón por correo | Email link
Revise su correo. | Revise o seu correo. | Check your email.
Cerrar sesión | Pechar sesión | Sign out
Inicie sesión en la nube (NUBE). | Inicie sesión na nube (NUBE). | Sign in to the cloud (CLOUD).
Inicie sesión en la nube. | Inicie sesión na nube. | Sign in to the cloud.
Comentario de la versión | Comentario da versión | Version comment
Compartir con el equipo | Compartir co equipo | Share with the team
No hay dibujos en la nube. | Non hai debuxos na nube. | No drawings in the cloud.
El dibujo no está en la nube. | O debuxo non está na nube. | The drawing isn't in the cloud.
Historial de versiones | Historial de versións | Version history
Al abrir una versión anterior se crea una pestaña nueva; guárdela en la nube para convertirla en la versión actual. | Ao abrir unha versión anterior créase unha lapela nova; gárdea na nube para convertela na versión actual. | Opening an earlier version creates a new tab; save it to the cloud to make it the current version.
Guardado en la nube: {0} (versión {1}). | Gardado na nube: {0} (versión {1}). | Saved to the cloud: {0} (version {1}).
Comentario | Comentario | Comment
Ir | Ir | Go
Reabrir | Reabrir | Reopen
Resolver | Resolver | Resolve
No hay marcas de revisión. Use MARCA para añadir una. | Non hai marcas de revisión. Use MARCA para engadir unha. | No review markups. Use MARKUP to add one.
equipo | equipo | team
Autor | Autor | Author
Fecha | Data | Date
Añadir plantilla (.dwt/.dxf/.wcad) | Engadir modelo (.dwt/.dxf/.wcad) | Add template (.dwt/.dxf/.wcad)
Seleccionar plantilla | Seleccionar modelo | Select template
plantilla propia | modelo propio | custom template
Título | Título | Title
Asunto | Asunto | Subject
Palabras clave | Palabras clave | Keywords
Comentarios | Comentarios | Comments
Número de revisión | Número de revisión | Revision number
Personalizadas (NOMBRE=valor) | Personalizadas (NOME=valor) | Custom (NAME=value)
Fecha de hoy | Data de hoxe | Today's date
Fecha de guardado | Data de gardado | Save date
Fecha de trazado | Data de trazado | Plot date
Presentación actual | Presentación actual | Current layout
El dibujo no tiene referencias externas. Use Enlazar para añadir una. | O debuxo non ten referencias externas. Use Ligar para engadir unha. | The drawing has no external references. Use Attach to add one.
Recargar | Recargar | Reload
Unir | Unir | Bind
Desenlazar | Desligar | Detach
sin cargar | sen cargar | not loaded
cargada | cargada | loaded
inserciones | insercións | instances
Dimensionar conducto | Dimensionar conduto | Size duct
Forma | Forma | Shape
Circular | Circular | Round
Velocidad máxima (m/s) | Velocidade máxima (m/s) | Maximum velocity (m/s)
Pérdida unitaria máxima (Pa/m) | Perda unitaria máxima (Pa/m) | Maximum friction loss (Pa/m)
Alto fijo (mm, rectangular) | Altura fixa (mm, rectangular) | Fixed height (mm, rectangular)
¿Aplicar {0} a los {1} conductos designados? | Aplicar {0} aos {1} condutos seleccionados? | Apply {0} to the {1} selected ducts?
Id | Id | Id
Sistema | Sistema | System
Sección (mm) | Sección (mm) | Size (mm)
Caudal (m³/h) | Caudal (m³/h) | Airflow (m³/h)
v (m/s) | v (m/s) | v (m/s)
Codos | Cóbados | Elbows
Chapa (m²) | Chapa (m²) | Sheet metal (m²)
ΔP (Pa) | ΔP (Pa) | ΔP (Pa)
Total | Total | Total
Pérdida de carga en conductos | Perda de carga en condutos | Duct pressure drop
Darcy-Weisbach con Colebrook-White; aire a 20 °C (ρ = 1,2 kg/m³), chapa galvanizada (ε = 0,15 mm), codos según R/W. Rectangulares con diámetro equivalente de Huebscher. | Darcy-Weisbach con Colebrook-White; aire a 20 °C (ρ = 1,2 kg/m³), chapa galvanizada (ε = 0,15 mm), cóbados segundo R/W. Rectangulares co diámetro equivalente de Huebscher. | Darcy-Weisbach with Colebrook-White; air at 20 °C (ρ = 1.2 kg/m³), galvanized sheet (ε = 0.15 mm), elbows by R/W. Rectangular ducts use Huebscher's equivalent diameter.
Insertar tabla | Inserir táboa | Insert table
Exportar Excel | Exportar Excel | Export to Excel
Exportar CSV | Exportar CSV | Export to CSV
Importar CSV/Excel | Importar CSV/Excel | Import CSV/Excel
Impulsión | Impulsión | Supply
Retorno | Retorno | Return
Extracción | Extracción | Exhaust
Aire exterior | Aire exterior | Outdoor air
Radio de codo R/W | Raio de cóbado R/W | Elbow radius R/W
Pérdidas singulares Σζ | Perdas singulares Σζ | Fitting losses Σζ
Cálculo | Cálculo | Calculation
Diámetro equivalente (mm) | Diámetro equivalente (mm) | Equivalent diameter (mm)
Pérdida unitaria (Pa/m) | Perda unitaria (Pa/m) | Friction loss (Pa/m)
Superficie de chapa (m²) | Superficie de chapa (m²) | Sheet metal area (m²)
Monocromo | Monocromo | Monochrome
Normal | Normal | Normal
Usar grosor del objeto | Usar o grosor do obxecto | Use object lineweight
Usar color del objeto | Usar a cor do obxecto | Use object color
Negro | Negro | Black
Escala de grises | Escala de grises | Grayscale
Todos los colores | Todas as cores | All colors
Estilo por capa | Estilo por capa | Style by layer
Añadir estilo | Engadir estilo | Add style
Nombre de la tabla | Nome da táboa | Table name
Tipo | Tipo | Type
CTB (dependiente del color) | CTB (dependente da cor) | CTB (color-dependent)
STB (estilos con nombre) | STB (estilos con nome) | STB (named styles)
Partir de | Partir de | Start from
Administrador de estilos de trazado | Administrador de estilos de trazado | Plot style manager
Tabla de estilos «{0}» guardada. | Táboa de estilos «{0}» gardada. | Plot style table «{0}» saved.
Tabla de estilos de trazado | Táboa de estilos de trazado | Plot style table
Cada presentación se traza en su tamaño de papel; el modelo se ajusta a A3 apaisado. Se genera un solo PDF. | Cada presentación trázase no seu tamaño de papel; o modelo axústase a A3 apaisado. Xérase un só PDF. | Each layout is plotted at its paper size; the model is fitted to A3 landscape. A single PDF is produced.
No hay restricciones de cota en el dibujo. | Non hai restricións de cota no debuxo. | There are no dimensional constraints in the drawing.
Escriba un valor o una expresión con otros parámetros (p. ej. d1/2 + 10). | Escriba un valor ou unha expresión con outros parámetros (p. ex. d1/2 + 10). | Enter a value or an expression using other parameters (e.g. d1/2 + 10).
Expresión | Expresión | Expression
Editor de tabla | Editor de táboas | Table editor
Añadir fila | Engadir fila | Add row
Quitar fila | Quitar fila | Remove row
Añadir columna | Engadir columna | Add column
Quitar columna | Quitar columna | Remove column
Columna | Columna | Column
Origen | Orixe | Source
Tabla vacía | Táboa baleira | Empty table
Desde archivo CSV/Excel | Desde ficheiro CSV/Excel | From CSV/Excel file
Filas | Filas | Rows
Columnas | Columnas | Columns
Ancho de columna | Largura de columna | Column width
Alto de fila | Altura de fila | Row height
Filas de cabecera | Filas de cabeceira | Header rows
Editar celdas | Editar celas | Edit cells
Bloques y atributos (recuento) | Bloques e atributos (reconto) | Blocks and attributes (count)
Longitudes y áreas por capa | Lonxitudes e áreas por capa | Lengths and areas by layer
Conductos (mediciones) | Condutos (medicións) | Ducts (takeoff)
Ámbito | Ámbito | Scope
Cantidad | Cantidade | Quantity
Área (m²) | Área (m²) | Area (m²)
Longitud (m) | Lonxitude (m) | Length (m)
Climatización | Climatización | HVAC
Valvulería y P&ID | Valvularía e P&ID | Valves and P&ID
Perfiles de acero | Perfís de aceiro | Steel sections
Rejilla de impulsión | Reixa de impulsión | Supply grille
Rejilla de retorno | Reixa de retorno | Return grille
Rejilla de pared, ancho ajustable | Reixa de parede, largura axustable | Wall grille, adjustable width
Difusor rotacional | Difusor rotacional | Swirl diffuser
Difusor rotacional de techo 600×600 | Difusor rotacional de teito 600×600 | Ceiling swirl diffuser 600×600
Difusor lineal | Difusor lineal | Linear diffuser
Compuerta de regulación | Comporta de regulación | Volume damper
Compuerta cortafuegos | Comporta cortalumes | Fire damper
Silenciador | Silenciador | Silencer
Ventilador | Ventilador | Fan
Unidad de tratamiento de aire | Unidade de tratamento de aire | Air handling unit
Climatizador (UTA) 3600×1200 | Climatizador (UTA) 3600×1200 | Air handling unit (AHU) 3600×1200
Fancoil | Fancoil | Fan coil
Split interior | Split interior | Indoor split unit
Unidad exterior | Unidade exterior | Outdoor unit
Termostato | Termóstato | Thermostat
Toma de aire exterior | Toma de aire exterior | Outdoor air intake
Válvula de compuerta | Válvula de comporta | Gate valve
Válvula de globo | Válvula de globo | Globe valve
Válvula de bola | Válvula de bóla | Ball valve
Válvula de mariposa | Válvula de bolboreta | Butterfly valve
Válvula de retención | Válvula de retención | Check valve
Válvula de tres vías | Válvula de tres vías | Three-way valve
Válvula de control | Válvula de control | Control valve
Válvula de seguridad | Válvula de seguridade | Safety valve
Filtro en Y | Filtro en Y | Y-strainer
Bomba centrífuga | Bomba centrífuga | Centrifugal pump
Manómetro | Manómetro | Pressure gauge
Termómetro | Termómetro | Thermometer
Instrumento (ISA) | Instrumento (ISA) | Instrument (ISA)
Vaso de expansión | Vaso de expansión | Expansion vessel
Intercambiador de calor | Intercambiador de calor | Heat exchanger
Depósito | Depósito | Tank
Purgador | Purgador | Steam trap
Brida | Brida | Flange
Reducción | Redución | Reducer
Flecha de flujo | Frecha de fluxo | Flow arrow
Ancho | Largo | Width
Climatización (HVAC) A1 — mm | Climatización (HVAC) A1 — mm | HVAC A1 — mm
Vacío (sin marco) — mm | Baleiro (sen marco) — mm | Blank (no frame) — mm
ISO A0 — mm | ISO A0 — mm | ISO A0 — mm
ISO A1 — mm | ISO A1 — mm | ISO A1 — mm
ISO A2 — mm | ISO A2 — mm | ISO A2 — mm
ISO A3 apaisado — mm | ISO A3 apaisado — mm | ISO A3 landscape — mm
ISO A4 vertical — mm | ISO A4 vertical — mm | ISO A4 portrait — mm
Naval A1 — mm | Naval A1 — mm | Marine A1 — mm
P&ID / esquemas A3 — mm | P&ID / esquemas A3 — mm | P&ID / schematics A3 — mm
Proyecto | Proxecto | Project
Título del plano | Título do plano | Drawing title
Dibujado | Debuxado | Drawn
Dibujado por | Debuxado por | Drawn by
Revisado | Revisado | Checked
Revisado por | Revisado por | Checked by
Número de plano | Número de plano | Drawing number
Hoja | Folla | Sheet
Etiqueta | Etiqueta | Label
Camino | Camiño | Path
Separación entre columnas | Separación entre columnas | Column spacing
Separación entre filas | Separación entre filas | Row spacing
Elementos | Elementos | Items
Ángulo de relleno | Ángulo de recheo | Fill angle
Girar elementos | Xirar elementos | Rotate items
Alinear elementos | Aliñar elementos | Align items
Alineación | Aliñamento | Alignment
Cada fila es una opción del desplegable del bloque; al elegirla se aplican estos valores. Deje vacío lo que no deba cambiar. | Cada fila é unha opción do despregable do bloque; ao escollela aplícanse estes valores. Deixe baleiro o que non deba cambiar. | Each row is an option in the block's drop-down; choosing it applies these values. Leave blank whatever shouldn't change.
Cargar o recargar tipos de línea | Cargar ou recargar tipos de liña | Load or reload linetypes
Seleccionar tipo de línea | Seleccionar tipo de liña | Select linetype
No hay bloques en el dibujo. Use "Examinar…" para insertar un archivo DXF/DWG como bloque. | Non hai bloques no debuxo. Use "Examinar…" para inserir un ficheiro DXF/DWG como bloque. | There are no blocks in the drawing. Use "Browse…" to insert a DXF/DWG file as a block.
Ninguna aplicación cargada. | Ningunha aplicación cargada. | No applications loaded.
Cargar al seleccionar | Cargar ao seleccionar | Load on select
Añadir al Grupo de inicio | Engadir ao grupo de inicio | Add to startup suite
Aplicaciones cargadas | Aplicacións cargadas | Loaded applications
Rutinas .lsp (AutoLISP), .scr (scripts) y .dcl (cuadros de diálogo). Las funciones C:XXX quedan disponibles como comandos. | Rutinas .lsp (AutoLISP), .scr (scripts) e .dcl (caixas de diálogo). As funcións C:XXX quedan dispoñibles como comandos. | .lsp (AutoLISP) routines, .scr scripts and .dcl dialogs. C:XXX functions become available as commands.
Cargador DWG no disponible | Cargador DWG non dispoñible | DWG loader not available
El archivo DWG no se pudo leer (versión no soportada o archivo dañado). | Non se puido ler o ficheiro DWG (versión non admitida ou ficheiro danado). | The DWG file couldn't be read (unsupported version or damaged file).
Dibujos | Debuxos | Drawings
Generando PDF | Xerando PDF | Generating PDF
Capa no existe | A capa non existe | Layer doesn't exist
No es un archivo SHX | Non é un ficheiro SHX | Not an SHX file
Potencia (kW) | Potencia (kW) | Power (kW)
Función | Función | Function
Lazo | Lazo | Loop
** ESTIRAR ** | ** ESTIRAR ** | ** STRETCH **
RASTREO | RASTREXO | OTRACK
Añadir vértice | Engadir vértice | Add vertex
Eliminar vértice | Eliminar vértice | Remove vertex
Convertir en arco | Converter en arco | Convert to arc
Convertir en línea | Converter en liña | Convert to line
Rastreo de referencias a objetos (F11) | Rastrexo de referencias a obxectos (F11) | Object snap tracking (F11)
Rastreo | Rastrexo | Track
Precise punto de estiramiento (Espacio = siguiente modo, Esc = cancelar): | Especifique o punto de estiramento (Espazo = seguinte modo, Esc = cancelar): | Specify stretch point (Space = next mode, Esc = cancel):
ESTIRAR | ESTIRAR | STRETCH
DESPLAZAR | DESPRAZAR | MOVE
GIRAR | XIRAR | ROTATE
SIMETRÍA | SIMETRÍA | MIRROR
`;
export const UI = {};
for (const line of TXT.split('\n')) {
  const p = line.split(' | ');
  if (p.length === 3) UI[p[0].replace(/\\n/g, '\n')] = [p[1].replace(/\\n/g, '\n'), p[2].replace(/\\n/g, '\n')];
}
// Textos con partes variables: [expresión, galego, English]
export const UI_RE = [
  [/^Comando: (.*)$/s, 'Comando: $1', 'Command: $1'],
  [/^Color de índice: (\d+)$/, 'Cor de índice: $1', 'Index color: $1'],
  [/^Editor de bloques: (.*)$/, 'Editor de bloques: $1', 'Block editor: $1'],
  [/^Todo \((\d+)\)$/, 'Todo ($1)', 'All ($1)'],
  [/^La capa "(.*)" contiene objetos\. Use LAYDEL para borrarla con sus objetos\.$/, 'A capa "$1" contén obxectos. Use LAYDEL para borrala cos seus obxectos.', 'Layer "$1" contains objects. Use LAYDEL to delete it with its objects.'],
  [/^Menú "(.*)" cargado: (\d+) menús desplegables, (\d+) páginas de pantalla\.$/, 'Menú "$1" cargado: $2 menús despregables, $3 páxinas de pantalla.', 'Menu "$1" loaded: $2 pull-down menus, $3 screen pages.'],
  [/^(.*): no contiene secciones \*\*\*POP ni \*\*\*SCREEN\.$/, '$1: non contén seccións ***POP nin ***SCREEN.', '$1: contains no ***POP or ***SCREEN sections.'],
  [/^(\d+) alias importados de (.*)$/, '$1 alias importados de $2', '$1 aliases imported from $2'],
  [/^(\d+) objetos importados de (.*)\.$/, '$1 obxectos importados de $2.', '$1 objects imported from $2.'],
  [/^(.*): (\d+) objetos en espacio modelo, (\d+) bloques, (\d+) capas\.$/, '$1: $2 obxectos no espazo modelo, $3 bloques, $4 capas.', '$1: $2 objects in model space, $3 blocks, $4 layers.'],
  [/^Guardado:? (.*)\.zip \(contiene (.*)\)$/, 'Gardado: $1.zip (contén $2)', 'Saved: $1.zip (contains $2)'],
  [/^Guardado:? (.*)$/, 'Gardado: $1', 'Saved: $1'],
  [/^No se pudo abrir: (.*)$/s, 'Non se puido abrir: $1', 'Could not open: $1'],
  [/^No se pudo abrir el archivo:\n(.*)$/s, 'Non se puido abrir o ficheiro:\n$1', 'Could not open the file:\n$1'],
  [/^Error al abrir: (.*)$/s, 'Erro ao abrir: $1', 'Error opening: $1'],
  [/^No se pudo guardar en el archivo original: (.*)$/s, 'Non se puido gardar no ficheiro orixinal: $1', 'Could not save to the original file: $1'],
  [/^Objetos no soportados \(omitidos\): (.*)$/s, 'Obxectos non admitidos (omitidos): $1', 'Unsupported objects (skipped): $1'],
  [/^¿Cerrar (.*) sin guardar los cambios\?$/, 'Pechar $1 sen gardar os cambios?', 'Close $1 without saving changes?'],
  [/^(\d+) coincidencia\(s\) encontrada\(s\)\.$/, '$1 coincidencia(s) atopada(s).', '$1 match(es) found.'],
  [/^No hay vistas guardadas\.$/, 'Non hai vistas gardadas.', 'No named views.'],
  [/^(\d+) objetos designados$/, '$1 obxectos seleccionados', '$1 objects selected'],
  [/^(.*): no es un archivo SHX válido \((.*)\)\.$/, '$1: non é un ficheiro SHX válido ($2).', '$1: not a valid SHX file ($2).'],
  [/^Fuente (.*) cargada\.$/, 'Fonte $1 cargada.', 'Font $1 loaded.'],
  [/^Cargador DWG: (.*) no disponible$/, 'Cargador DWG: $1 non dispoñible', 'DWG loader: $1 not available'],
  [/^No se pudo cargar el lector DWG \(libredwg-web\): (.*)$/s, 'Non se puido cargar o lector DWG (libredwg-web): $1', 'Could not load the DWG reader (libredwg-web): $1'],
  [/^No se pudo cargar (.*)$/s, 'Non se puido cargar $1', 'Could not load $1'],
  [/^Descarga cancelada: (.*)$/s, 'Descarga cancelada: $1', 'Download cancelled: $1'],
  [/^Seleccione el archivo (.*)$/s, 'Seleccione o ficheiro $1', 'Select the file $1'],
  [/^Intro = nuevo párrafo\. Ancho de columna: (.*)\.$/, 'Intro = novo parágrafo. Largura de columna: $1.', 'Enter = new paragraph. Column width: $1.'],
  [/^Tamaño (.*)$/, 'Tamaño $1', 'Size $1'],
  [/^<Isoplano (.*)>$/, '<Isoplano $1>', '<Isoplane $1>'],
  [/^Modelo: (.*)$/, 'Modelo: $1', 'Model: $1'],
  [/^<Grupos activados>$/, '<Grupos activados>', '<Groups on>'], [/^<Grupos desactivados>$/, '<Grupos desactivados>', '<Groups off>'],
];
