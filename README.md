# WebCAD Libre

CAD 2D en el navegador con flujo de trabajo clásico de CAD e imagen propia: cinta de opciones, línea de comandos, referencias a objetos con rastreo, pinzamientos, bloques dinámicos, restricciones paramétricas, AutoLISP con DCL, herramientas de instalaciones (conductos, tuberías, P&ID) y menús clásicos. Funciona sin servidor y sin conexión, en cinco idiomas.

## Puesta en marcha

Los módulos JavaScript necesitan servirse por HTTP (no funcionan abriendo `index.html` con doble clic).

```bash
cd webcad
npm start                 # servidor local en http://localhost:8080 (o: python -m http.server 8080)
```

**GitHub Pages:** sube la carpeta a un repositorio y activa *Settings → Pages → Deploy from a branch → main / (root)*. Todo lo necesario está en `vendor/` (LibreDWG, jsPDF, SheetJS, supabase-js y tipografías), así que funciona también sin conexión.

**Instalar como aplicación (PWA):** desde Chrome/Edge, *Instalar WebCAD Libre* en la barra de direcciones; en iPhone/iPad, *Compartir → Añadir a pantalla de inicio*. El service worker (`sw.js`) guarda la aplicación para usarla sin conexión. Si cambias archivos, regenera la lista con `npm run build:sw`.

## Imagen, temas e idiomas

- **Tres temas**: oscuro (pizarra), intermedio (granito) y claro (papel vegetal). Se eligen en la pestaña Inicio, en *Vista › Interfaz › Tema* o en *OPCIONES › Visualización*.
- **Cinco idiomas**: castellano, galego, português, català e English. Selector ES/GL/PT/CA/EN de la barra de título, pestaña Inicio u *OPCIONES*. Se traduce toda la interfaz y la línea de comandos, sin recargar.
- **Línea de comandos multilingüe**:
  - Comandos en cualquiera de los idiomas: `LINEA`, `LIÑA`, `LINHA`, `LÍNIA` o `LINE`; `DESPLAZA`, `DESPRAZA`, `MOVER`, `DESPLAÇA` o `MOVE`… Con o sin tildes. Los alias ingleses (`L`, `C`, `M`…) siguen funcionando. `POL` es polilínea.
  - Opciones en el idioma activo (letra en mayúscula) o en inglés. Si dos opciones de un mensaje empiezan igual, la segunda se alarga (`EScala` frente a `Extensión`).
  - Referencias a objetos `FIN`, `MED`, `CEN`, `INT`, `PER`, `TAN`, `CER`… o `END`, `MID`….
  - El prefijo `_` fuerza el inglés (`_POL` = POLYGON, `_U` = Undo): los menús y rutinas LISP de la versión inglesa funcionan sin cambios.
  - `F1` lista cada comando en los cinco idiomas con sus alias.
- Textos en `js/core/ui-strings.js` (castellano | galego | English), `js/core/ui-ptca.js` (castellano | português | català) y, para la línea de comandos, `i18n.js`, `i18n-gl.js`, `lang-pt.js` y `lang-ca.js`. Cada texto es una línea.

## Qué incluye

| Área | Contenido |
|---|---|
| Dibujo | LINE, PLINE (arcos, anchos), CIRCLE (CR, CD, 2P, 3P, TTR), ARC, RECTANG, POLYGON, ELLIPSE, SPLINE, POINT, XLINE, RAY, DONUT, REVCLOUD, WIPEOUT, BOUNDARY |
| Edición | MOVE, COPY, ROTATE, SCALE, MIRROR, OFFSET, TRIM/EXTEND, FILLET/CHAMFER, ARRAY rectangular/polar/camino **asociativas** (editables desde Propiedades), STRETCH, BREAK, JOIN, LENGTHEN, EXPLODE, PEDIT, ALIGN, MATCHPROP, DRAWORDER, **GROUP/UNGROUP/GROUPEDIT** (Ctrl+Mayús+A activa o desactiva la selección por grupos), pinzamientos multifunción en polilíneas (añadir/eliminar vértice, convertir en arco o línea) |
| Ayudas | Referencias a objetos, **rastreo de referencias (OTRACK, F11)**, ORTHO (F8), POLAR (F10), SNAP/GRID (F9/F7), entrada dinámica (F12), coordenadas `@x,y` y `@d<a`, distancia directa, **dibujo isométrico** (ISODRAFT, ISOPLANE con F5, ISOCIRCLE) |
| Paramétrico | Restricciones geométricas (coincidente, horizontal, vertical, paralela, perpendicular, igual, fija, concéntrica, colineal, tangente) y por cota (lineal, horizontal, vertical, alineada, radio, diámetro, angular), AUTOCONSTRAIN, administrador de parámetros con expresiones (`d1/2 + 10`) |
| Anotación | TEXT, MTEXT, DIM*, QLEADER, MLEADER, HATCH, **TABLE** (vacía o desde CSV/Excel, editor de celdas, exportación a CSV/Excel), **campos** (FIELD: fecha, autor, título, nombre de archivo…), **tipografías de trazo** que sustituyen a las SHX (txt, simplex, romans, isocp…) y lector de archivos `.SHX` propios |
| Bloques | BLOCK, INSERT, WBLOCK, ATTDEF, EATTEDIT, ATTSYNC, BEDIT con parámetros dinámicos lineal, polar, XY, rotación, simetría, visibilidad y **consulta (lookup)**, con **conjuntos de valores**; **referencias externas** (XATTACH, XREF: recargar, unir, desenlazar) |
| Instalaciones | **Conductos** (DUCT: rectangulares o circulares, por sistema —impulsión, retorno, extracción, aire exterior— con codos y capas propias), **dimensionado** por velocidad y pérdida unitaria (DUCTSIZE), **pérdida de carga** Darcy-Weisbach/Colebrook-White con codos (DUCTCALC, tabla y Excel), **tuberías de esquema** con identificador (PIPE) |
| Bibliotecas | Paleta BIBLIOTECA: climatización (rejillas, difusores, compuertas, UTA, fancoil…), valvulería y símbolos P&ID ISO 10628, perfiles de acero en sección (IPE, HEB, UPN, tubos rectangulares y circulares); los símbolos con parámetros dinámicos se ajustan con pinzamientos |
| Mediciones | DATAEXTRACTION: recuento de bloques y atributos, longitudes y áreas por capa, mediciones de conductos; a tabla en el dibujo o a Excel/CSV |
| Plantillas | NEW con plantillas incluidas (ISO A0–A4, climatización A1, naval A1, P&ID A3, vacía) o propias `.dwt/.dxf/.wcad`; capas normalizadas y **cajetín** con campos (TITLEBLOCK); DWGPROPS |
| Capas y propiedades | Administrador de capas, -LAYER, LAYISO/LAYOFF/LAYFRZ…, paleta Propiedades con bloques dinámicos, matrices, tablas y conductos |
| Salida | PLOT a PDF/PNG, SVG, **PUBLISH** (todas las presentaciones en un único PDF), **estilos de trazado CTB y STB** editables (STYLESMANAGER) |
| Archivos | Abre DXF (versiones 12 a 2018, incluidos MLINE, TABLE, TOLERANCE y MLEADER) y DWG (R13–2018 vía LibreDWG). Guarda **DXF 2000** (AC1015, por defecto), DXF 12 o `.wcad` nativo. WebCAD recupera de su propio DXF los bloques dinámicos, restricciones, grupos y propiedades |
| Colaboración | **Nube opcional con Supabase** (NUBE, GUARDARNUBE, ABRIRNUBE, VERSIONES): dibujos compartidos con el equipo e historial de versiones; **marcas de revisión** (MARCA, MARCAS) guardadas en el dibujo y en la nube. Esquema en `supabase/schema.sql` |
| AutoLISP | Intérprete propio (`defun`, `command` con `pause`, `getpoint`…, `entget`/`entmod` con datos extendidos, `ssget` con filtros, diccionarios y `vlax-ldata-*`, reactores de comando `vlr-*`) y **cuadros DCL** (`load_dialog`, `new_dialog`, `action_tile`, `get_tile`, listas, botones de opción…). APPLOAD carga `.lsp`, `.scr` y `.dcl`; editor Visual LISP con consola |
| ActiveX (`vla-*`, `vlax-*`) | Modelo de objetos compatible: Application, Document, ModelSpace/PaperSpace, colecciones (Layers, Blocks, Layouts, TextStyles, Linetypes, Groups, Dictionaries, SelectionSets…), Utility, SummaryInfo y AcCmColor. Propiedades y métodos de cada tipo de entidad (`AddLine`…`AddTable`, `InsertBlock`, `Offset`, `Mirror`, `IntersectWith`, `GetAttributes`, `GetDynamicBlockProperties`, `GetXData`…), variants y safearrays, `vlax-curve-*` con parámetros estándar, `SendCommand`, `vlax-dump-object` |
| Cotas (v7) | **Varios estilos de cota** (administrador DIMSTYLE: crear, modificar, renombrar, tolerancias, prefijo/sufijo, anotativo), **cotas asociativas** (DIMASSOC: se actualizan al modificar la geometría; DIMREASSOCIATE, DIMDISASSOCIATE), DIMARC, DIMJOGGED, **QDIM** (continua, línea base, coordenadas, radio, diámetro), DIMSPACE, DIMBREAK (automático y manual), **TOLERANCE** (marco de control geométrico) |
| Anotación (v7) | **Escala de anotación** (CANNOSCALE, ANNOSCALE, ANNOTATIVE; selector en la barra de estado), estilos de **directriz múltiple** (MLEADERSTYLE) y de **tabla** (TABLESTYLE), **editor de texto in situ** para MTEXT, TEXTALIGN, **SPELL** (con el corrector del navegador), ARCTEXT |
| Referencias (v7) | **IMAGEATTACH** (PNG/JPG/GIF/WebP; también arrastrando), IMAGECLIP rectangular o poligonal, IMAGEADJUST, TRANSPARENCY, IMAGEFRAME; **PDFATTACH** (página como imagen a escala real) y **PDFIMPORT** (líneas, rellenos y texto vectoriales); **HYPERLINK** (Ctrl+clic para abrir) |
| Capas y vista (v7) | **Transparencia** por capa, por objeto (CETRANSPARENCY) y por ventana; **administrador de estados de capa** (LAYERSTATE, exportar/importar); **VPLAYER** y columnas por ventana en el administrador de capas (inutilizar, color, transparencia); LAYWALK; LAYTRANS; **SCP** (UCS, UCSMAN, UCSICON: coordenadas escritas, orto y coordenadas de estado en el SCP; prefijo `*` = universales); **ventanas en mosaico** del modelo (VPORTS/-VPORTS) |
| Productividad (v7) | **Grabadora de acciones** (ACTRECORD, ACTSTOP, ACTPLAY, ACTMANAGER, exportación a LISP), **DWGCOMPARE** (diferencias en verde/rojo, informe, insertar diferencias), **conjunto de planos** (SHEETSET, lista de planos, publicar), **ETRANSMIT** (ZIP con DXF, .wcad, imágenes, LISP e informe), **selección por lazo** (arrastrar), ciclo de selección, **MLINE/MLSTYLE**, **REGION** con UNION/SUBTRACT/INTERSECT y **MASSPROP**, MOCORO, SUPERHATCH (bloque o imagen), CHSPACE |
| 3D básico (v7) | Pestaña Modelado 3D: BOX, CYLINDER, CONE, SPHERE, EXTRUDE (con ahusamiento), REVOLVE; **visor 3D** con órbita, encuadre, zoom, **ViewCube**, estilos visuales (alámbrico, oculto, sombreado, realista) y RENDER a PNG; exportación **STL** y OBJ; volumen en MASSPROP |
| Nubes y geolocalización (v7) | **Nubes de puntos** XYZ/TXT/CSV/PTS/PLY ASCII con color RGB o por elevación (POINTCLOUDATTACH, POINTCLOUDCROP, POINTCLOUDCOLORMAP), visibles también en el visor 3D; **GEOGRAPHICLOCATION** con mapa callejero de OpenStreetMap de fondo (GEOMAP, requiere conexión), GEOLATLONG, GEOMARKLATLONG |
| Edición (v8) | **MLEDIT** (cruces y uniones en T cerradas/abiertas/fusionadas, esquina, añadir/suprimir vértice, cortar, soldar); **DIMBREAK automático** que sigue a los objetos; **pinzamientos de cota** (mover texto, con línea, restablecer, continua, línea base); **varios pinzamientos** a la vez (Mayús+clic) y Ctrl para cambiar de modo; **sombreado asociativo** (HPASSOC); **propiedades rápidas** al pasar el cursor (ROLLOVERTIPS); información ampliada en la cinta; bloques dinámicos con parámetros de **matriz** y **alineación** |
| 3D (v8) | **Booleanas de sólidos** (UNION, SUBTRACT, INTERSECT por CSG), **SLICE**, **SECTION**, FILLETEDGE/CHAMFEREDGE (aristas verticales), pinzamientos 3D, **VIEWBASE** (planta, alzados e isométrica con líneas ocultas), **IFCIMPORT** (IFC y STEP facetados), **STEPOUT** (AP214) e **IFCOUT** (IFC4), nubes **LAS** binarias y POINTCLOUDSECTION, mapa **aéreo** en GEOMAP |
| Instalaciones (v8) | DUCTELEV, **DUCT3D**, DUCTISO, **DUCTBOM**; **ROOMLOADS** (cargas por recinto, CTE/RITE orientativo); **PEDSHEET** (categoría PED 2014/68/UE y hoja de datos); **FLANGE** (EN 1092-1, PN10–40, DN15–300); **PIPECALC** (Darcy-Weisbach/Colebrook y NPSH); **PIDTAG** y **PIDLIST** |
| Archivos (v8) | DXF con **datos extendidos** (xdata), **diccionarios**, ldata, transparencia e hipervínculos; **GISIMPORT** (SHP+DBF+PRJ y GeoJSON, con atributos); lectura **DWG en Web Worker**; **DWGOUT** mediante un conversor externo propio (ver `tools/dwg-converter.md`) |
| Colaboración (v8) | **COLLAB**: edición en tiempo real con Supabase Realtime (o entre pestañas del navegador sin nube), cursores de los demás, deshacer compartido; **LAYERCLAIM** (reserva de capas por usuario); **COMMENT/COMMENTS** (comentarios anclados a objetos, con respuestas) |
| Tableta y rendimiento (v8) | **TOUCHMODE**: interfaz táctil, pellizco y arrastre con dos dedos, pulsación larga = clic derecho, lápiz como ratón; **WebGL** para modelos grandes (WEBGLMODE: 0 no, 1 auto a partir de 20 000 objetos, 2 siempre); **F1** con ficha de ayuda por comando en 5 idiomas |
| Mecánica (v8.1) | Ficha **Mecánica**: **MPIPE** (tubería ASME B36.10M/19M o EN 10220 a doble línea o unifilar, codos automáticos), **MFLANGE** (bridas ASME B16.5 WN, SO, LWN y ciegas; caras RF, FF y RTJ; clases 150–2500; vista lateral o frontal), **MELBOW** (codos LR/SR 90°, 45°, 180°), **MREDUCER** (concéntrica/excéntrica), **MTEE**, **MCROSS**, **MCAP** (B16.9), **MCOUPLING** (manguitos B16.11 SW y NPT), **MBOM** (lista de materiales con pesos) y **MFLANGETABLE** |
| Mecánica (v8.2) | **MVALVE** (compuerta, globo, retención, bola, macho, mariposa, filtros Y/cesta, mirillas; cara a cara ASME B16.10; actuadores manual/reductor/neumático/eléctrico; símbolos P&ID), **MGASKET** (junta B16.20/B16.21/RTJ, brida opuesta y espárragos con longitud calculada), **MFORGED** (B16.11 SW/NPT), **MOLET** (MSS SP-97), bridas SW, roscadas, locas + **MSTUBEND**, Class 400, **ASME B16.47 A** y **EN 1092-1**, **MORIFICE** (B16.36), **MBLIND** (B16.48), **MSUPPORT**/**MSPAN** (B31.1), **MPUMP**, **MVESSEL** (DIN 28011/28013), **MNOZZLE**, **MINSTR**, **MINSUL**, **MPIPE3D**, **MISO** y **MSPOOL**; encaje automático en extremos libres |
| Interfaz | Cinta con pestañas Inicio, Insertar, Anotar, Vista, Administrar, Salida, **Paramétrico**, **Instalaciones**, **Colaborar** y Herramientas extra; barra de menús y menú de pantalla clásicos; cargador `.MNU`; alias y atajos personalizables |
| Rendimiento | Índice espacial para designar, referenciar y dibujar; encuadre rápido con imagen en caché en dibujos grandes |

Ejemplos en `samples/`: `rutinas-ejemplo.lsp` (BRIDA, CAPAS, LONG, CAMBIACAPA), `rutinas-activex.lsp` (LONGTOTAL, ALTURATEXTO, NUMERAR, INFOCAPAS) y `menu-ejemplo.mnu`.

## Nube (opcional)

1. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta `supabase/schema.sql` en su editor SQL.
2. En WebCAD: *Colaborar › Configurar nube* (comando NUBE), pega la URL del proyecto y la clave pública «anon», e inicia sesión o crea una cuenta.
3. *Guardar en la nube* sube el dibujo con un comentario de versión; marca *Compartir con el equipo* para que lo vean y editen los demás usuarios del proyecto.

## Pruebas

```bash
npm install          # instala Playwright (solo para las pruebas en navegador)
npx playwright install chromium
npm test             # unitarias (Node) + extremo a extremo (Chromium)
npm run test:unit    # solo unitarias
```

Las pruebas están en `tests/unit` (idiomas, geometría, conductos, DXF) y `tests/e2e` (dibujo, idiomas, funciones avanzadas, LISP/DCL, ActiveX, interfaz, archivos).

## Atajos

`Ctrl+Z/Y` deshacer/rehacer · `Ctrl+C/X/V` portapapeles (`Ctrl+Mayús+V` pegar como bloque) · `Ctrl+S/O/N/P` · `Ctrl+A` seleccionar todo · `Ctrl+Mayús+A` grupos · `Ctrl+1` propiedades · `Ctrl+3` capas · `F1` ayuda · `F2` historial · `F3` referencias · `F5` isoplano · `F7` rejilla · `F8` orto · `F9` forzcursor · `F10` polar · `F11` rastreo · `F12` entrada dinámica · `Supr` borrar · `Esc` cancelar · `Espacio/Intro` repetir el último comando.

## Limitaciones conocidas

- 3D básico: sólidos por extrusión, revolución y primitivas, sin edición de caras ni booleanas entre sólidos (las booleanas son de regiones). Los sólidos se exportan a DXF como su contorno en planta y a STL/OBJ completos. Los sólidos ACIS de un DWG/DXF se omiten al importar.
- DWG es de solo lectura: LibreDWG no ofrece escritura fiable de DWG y el formato es cerrado. Para intercambiar con otros programas se usa DXF 2000.
- No hay API .NET ni VBA (no pueden ejecutarse en un navegador); AutoLISP con ActiveX (`vla-*`) cubre la automatización.
- Nubes de puntos solo en formatos de texto (no RCP/RCS ni LAS binario). El mapa de geolocalización es callejero (OpenStreetMap) y necesita conexión; no hay vista aérea.
- DIMBREAK calcula los cortes al ejecutarlo (no se recalculan solos al mover objetos). MLEDIT no está: se descompone la multilínea y se edita.
- ActiveX: sin objetos 3D, regiones ni objetos COM externos (`vlax-create-object` devuelve nil). Los reactores que no son de comando se registran pero no se disparan.

## Estructura

```
index.html            interfaz
css/cad.css           estilos (temas oscuro, intermedio y claro)
js/core/              geometría, entidades, documento, restricciones, tablas, conductos, bibliotecas, plantillas, tipografías, idiomas
js/view/              render en canvas, referencias, rastreo, índice espacial
js/cmd/               motor de comandos y comandos (dibujo, edición, anotación, bloques, paramétrico, instalaciones, salida, nube…)
js/lisp/              intérprete AutoLISP, modelo ActiveX (vla-/vlax-) y cuadros DCL
js/io/                DXF (lectura, escritura 12 y 2000), DWG, SVG, PDF, nube
js/ui/                cinta, menús clásicos, paletas, diálogos, biblioteca, línea de comandos
tests/                pruebas unitarias y extremo a extremo (npm test)
tools/build-sw.mjs    genera la lista del service worker
supabase/schema.sql   esquema de la nube opcional
vendor/               LibreDWG, jsPDF, SheetJS, supabase-js, pdf.js, polygon-clipping, earcut y tipografías
```

## Licencia

GPL-3.0-or-later (por incluir LibreDWG, GPL-3.0). jsPDF y supabase-js se distribuyen bajo MIT; SheetJS bajo Apache-2.0; las tipografías de trazo Hershey/LibreCAD bajo GPL-2.0+ o dominio público; Barlow y Spline Sans Mono bajo SIL Open Font License.
