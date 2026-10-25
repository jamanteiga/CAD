# WebCAD Libre

CAD 2D en el navegador con la interfaz y el flujo de trabajo de AutoCAD 2023: cinta de opciones, línea de comandos, referencias a objetos, pinzamientos, bloques dinámicos, AutoLISP y los menús clásicos de AutoCAD R12 (barra de menús y menú de pantalla lateral). Sin servidor, sin instalación y sin dependencias de pago.

## Puesta en marcha

Los módulos JavaScript necesitan servirse por HTTP (no funcionan abriendo `index.html` con doble clic).

```bash
cd webcad
python -m http.server 8080
# abrir http://localhost:8080
```

**GitHub Pages:** sube la carpeta a un repositorio y activa *Settings → Pages → Deploy from a branch → main / (root)*. La carpeta `vendor/` contiene LibreDWG (WebAssembly, lectura DWG) y jsPDF, de modo que funciona también sin conexión.

## Qué incluye

| Área | Contenido |
|---|---|
| Dibujo | LINE, PLINE (arcos, anchos), CIRCLE (CR, CD, 2P, 3P, TTR), ARC (3P, SCE, SER, CSE, ángulo, dirección), RECTANG (empalme, chaflán, cotas, rotación, área), POLYGON, ELLIPSE (y arco elíptico), SPLINE, POINT, XLINE, RAY, DONUT, REVCLOUD, WIPEOUT, BOUNDARY |
| Edición | MOVE, COPY (múltiple, matriz), ROTATE (copia, referencia), SCALE, MIRROR (MIRRTEXT), OFFSET (distancia, punto, borrar), TRIM/EXTEND (modo rápido y estándar, borde, borde de captura, valla), FILLET/CHAMFER (líneas, arcos, polilíneas), ARRAY (rectangular, polar, trayectoria), STRETCH, BREAK, BREAKATPOINT, JOIN, LENGTHEN, EXPLODE, PEDIT, ALIGN, MATCHPROP, CHPROP, DRAWORDER, ERASE/OOPS, U/UNDO/REDO |
| Anotación | TEXT/DTEXT (justificaciones), MTEXT (editor), DDEDIT, STYLE, DIMLINEAR, DIMALIGNED, DIMRADIUS, DIMDIAMETER, DIMANGULAR, DIMORDINATE, DIMCONTINUE, DIMBASELINE, DIMTEDIT, DIMSTYLE, QLEADER, MLEADER, HATCH (detección de contorno por punto interior, islas, pestaña contextual), -HATCH, HATCHEDIT |
| Bloques | BLOCK (diálogo) y -BLOCK, INSERT (miniaturas) y -INSERT, WBLOCK, XATTACH, ATTDEF, EATTEDIT, ATTSYNC, BEDIT con parámetros dinámicos **Lineal** (estirar/mover/escalar), **Rotación**, **Simetría** y **Visibilidad** (BPARAMETER, BACTION, BVSTATE, BVHIDE, BVSHOW, BSAVE, BCLOSE), PURGE, RENAME |
| Capas y propiedades | Administrador de capas (encendido, inutilizar, bloquear, trazar, color, tipo de línea, grosor), -LAYER, LAYISO/LAYUNISO/LAYOFF/LAYFRZ/LAYLCK/LAYMCUR/LAYMRG/LAYDEL/LAYCUR, paleta Propiedades (Ctrl+1) con propiedades de bloques dinámicos, COLOR, LINETYPE, LWEIGHT, LTSCALE |
| Ayudas | OSNAP (FIN, MED, CEN, NOD, CUA, INT, INS, PER, TAN, CER; modificadores de un uso), ORTHO (F8), POLAR (F10), SNAP/GRID (F9/F7), entrada dinámica (F12), coordenadas absolutas, relativas `@x,y` y polares `@d<a`, distancia directa |
| Vistas y salida | ZOOM (ventana, extensión, previo, escala nX/nXP, objeto), PAN en tiempo real, VIEW, presentaciones (Layout) con ventanas MVIEW, MSPACE/PSPACE, PLOT a PDF/PNG, SVG vectorial |
| Archivos | Abre DXF (R12–2018) y DWG (R13–2018 vía LibreDWG). Guarda DXF R12 (AC1009, lo abre cualquier AutoCAD) o `.wcad` nativo (conserva bloques dinámicos). Varios dibujos en pestañas, recientes y autoguardado local |
| AutoLISP | Intérprete propio: `defun`, `setq`, `lambda`, `mapcar`, `foreach`, `while`, `repeat`, `cond`, `vl-*`, `command`/`vl-cmdf` con `pause`, `getpoint`/`getdist`/`getint`/`getkword`/`initget`, `entsel`, `entget`/`entmod`/`entmake`/`entnext`/`entlast`, `ssget` (X, W, C, F, filtros con `-4`), `tblsearch`, `getvar`/`setvar`, ficheros (`open`, `read-line`, `write-line`), `vlax-curve-*`, ActiveX básico (`vla-get-*`/`vla-put-*`). Funciones `C:` como comandos, `*error*`, APPLOAD, Startup Suite, editor Visual LISP con consola, scripts `.scr` |
| Interfaz | Cinta 2023 (Home, Insert, Annotate, View, Manage, Output, Express Tools, Layout, pestañas contextuales Hatch Creation y Block Editor), menú de aplicación, barra de acceso rápido, **barra de menús R12** y **menú de pantalla R12** (casillas en la barra de estado), cargador de menús `.MNU` (POP y SCREEN con macros `^C^C`, `;`, `\`, `$S=`), alias editables e importables desde `acad.pgp`, atajos de teclado personalizables, tema oscuro/claro |

Ejemplos en `samples/`: `rutinas-ejemplo.lsp` (BRIDA, CAPAS, LONG, CAMBIACAPA) y `menu-ejemplo.mnu`.

## Atajos

`Ctrl+Z/Y` deshacer/rehacer · `Ctrl+C/X/V` portapapeles (`Ctrl+Shift+V` pegar como bloque) · `Ctrl+S/O/N/P` · `Ctrl+A` seleccionar todo · `Ctrl+1` propiedades · `Ctrl+3` capas · `Ctrl+9` historial · `Ctrl+0` pantalla limpia · `F1` ayuda · `F2` historial · `F3/F7/F8/F9/F10/F12` · `Supr` borrar · `Esc` cancelar · `Espacio/Intro` repetir el último comando. Doble clic: texto → editar; bloque → editor de bloques; ventana de presentación → espacio modelo. Botón central: encuadre; doble clic central: zoom extensión.

## Limitaciones conocidas

- Solo 2D. Los sólidos 3D, regiones, MLINE, TOLERANCE, tablas y WIPEOUT de archivos externos se omiten al importar (se informa en la línea de comandos).
- DWG es de solo lectura (formato cerrado). Para devolver a AutoCAD se usa DXF.
- Las restricciones paramétricas (pestaña Parametric) y los cuadros DCL de AutoLISP no están implementados; ActiveX es parcial.
- Las fuentes SHX se sustituyen por Arial.

## Estructura

```
index.html            interfaz
css/cad.css           estilos (tema oscuro/claro)
js/core/              geometría, entidades, documento, tablas (ACI, tipos de línea, sombreados)
js/view/              render en canvas, osnap, vista
js/cmd/               motor de comandos y comandos
js/lisp/lisp.js       intérprete AutoLISP
js/io/                DXF, DWG, SVG, PDF, archivos
js/ui/                cinta, menús R12, paletas, diálogos, línea de comandos
vendor/               LibreDWG (GPL-3.0) y jsPDF (MIT)
```

## Licencia

GPL-3.0-or-later (por incluir LibreDWG, GPL-3.0). jsPDF se distribuye bajo MIT. AutoCAD es marca de Autodesk; este proyecto es independiente y no está afiliado a Autodesk.
