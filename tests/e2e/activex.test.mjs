// ActiveX / Visual LISP: modelo de objetos, safearrays, colecciones, diccionarios, xdata, reactores…
// Cada caso es una rutina como las que circulan para AutoCAD, sin adaptar.
import fs from 'fs';
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const ev = (src) => page.evaluate(async (s) => { try { return await webcad.lisp.evalString(`(vl-prin1-to-string (progn ${s}))`); } catch (e) { return 'ERR: ' + e.message; } }, src);
  await ev(`(vl-load-com) (setq acad (vlax-get-acad-object) doc (vla-get-activedocument acad) ms (vla-get-modelspace doc) util (vla-get-utility doc))`);

  // líneas y variants
  await ev(`(setq ln (vla-addline ms (vlax-3d-point '(0 0 0)) (vlax-3d-point '(100 0 0))))`);
  t.eq(await ev(`(vla-get-length ln)`), '100.0', 'vla-addline + vla-get-length');
  t.eq(await ev(`(vlax-safearray->list (vlax-variant-value (vla-get-startpoint ln)))`), '(0.0 0.0 0.0)', 'punto como variant/safearray');
  t.eq(await ev(`(vlax-get ln 'EndPoint)`), '(100.0 0.0 0.0)', 'vlax-get devuelve listas');
  t.eq(await ev(`(list (type ln) (type (vla-get-startpoint ln)) (vlax-variant-type (vla-get-startpoint ln)))`), '(VLA-OBJECT VARIANT 8197)', 'tipos VLA-OBJECT, VARIANT y vbArray|vbDouble');
  t.eq(await ev(`(vla-get-objectname ln)`), '"AcDbLine"', 'ObjectName');
  t.eq(await ev(`(eq (vlax-ename->vla-object (vlax-vla-object->ename ln)) ln)`), 'T', 'ename ↔ vla-object conserva la identidad');

  // capas
  await ev(`(setq lay (vla-add (vla-get-layers doc) "MUROS")) (vla-put-color lay acRed) (vla-put-lineweight lay acLnWt050) (vla-put-layer ln "MUROS")`);
  t.eq(await page.evaluate(() => [webcad.doc.layers.MUROS?.color, webcad.doc.layers.MUROS?.lw, webcad.doc.model[0].layer]), [1, 50, 'MUROS'], 'Layers.Add, Color, Lineweight y Layer');
  t.eq(await ev(`(vl-catch-all-error-p (vl-catch-all-apply 'vla-item (list (vla-get-layers doc) "NOEXISTE")))`), 'T', 'Item inexistente da error capturable');
  t.eq(await ev(`(progn (setq n nil) (vlax-for l (vla-get-layers doc) (setq n (cons (vla-get-name l) n))) (vl-sort n '<))`), '("0" "Defpoints" "MUROS")', 'vlax-for sobre Layers');
  t.eq(await ev(`(progn (vla-put-lock lay :vlax-true) (vla-get-lock lay))`), ':VLAX-TRUE', 'booleanos :vlax-true');
  await ev(`(vla-put-lock lay :vlax-false)`);

  // polilínea desde safearray y vlax-curve
  await ev(`(setq arr (vlax-make-safearray vlax-vbDouble '(0 . 7))) (vlax-safearray-fill arr '(0 0 50 0 50 30 0 30)) (setq pl (vla-addlightweightpolyline ms arr)) (vla-put-closed pl :vlax-true)`);
  t.eq(await ev(`(vla-get-area pl)`), '1500.0', 'AddLightweightPolyline + Closed + Area');
  t.eq(await ev(`(list (vlax-curve-getendparam pl) (vlax-curve-getpointatparam pl 1.5) (vlax-curve-getdistatparam pl 2))`), '(4.0 (50.0 15.0 0.0) 80.0)', 'parámetros de polilínea por vértice');
  t.eq(await ev(`(vlax-curve-getparamatpoint pl '(25 30 0))`), '2.5', 'vlax-curve-getparamatpoint');
  t.eq(await ev(`(vlax-safearray->list (vlax-variant-value (vla-get-coordinate pl 1)))`), '(50.0 0.0)', 'propiedad indexada Coordinate');
  t.eq(await ev(`(progn (vla-put-coordinate pl 2 (vlax-3d-point '(60 30 0))) (nth 4 (vlax-get pl 'Coordinates)))`), '60.0', 'vla-put-coordinate');
  t.eq(await ev(`(progn (setq ar (vla-addarc ms (vlax-3d-point '(0 0 0)) 10 0 (/ pi 2))) (list (vlax-curve-getendparam ar) (vlax-curve-getpointatparam ar (/ pi 2))))`), '(1.5708 (6.12323e-016 10.0 0.0))', 'parámetro angular en arcos');

  // intersecciones
  await ev(`(setq c (vla-addcircle ms (vlax-3d-point '(0 0 0)) 10))`);
  t.eq(await ev(`(vlax-safearray-get-u-bound (vlax-variant-value (vla-intersectwith ln c acExtendNone)) 1)`), '2', 'IntersectWith (un punto)');
  t.eq(await ev(`(length (vlax-invoke ln 'IntersectWith c acExtendThisEntity))`), '6', 'IntersectWith prolongando');
  t.eq(await ev(`(vlax-safearray-get-u-bound (vlax-variant-value (vla-intersectwith c (vla-addline ms (vlax-3d-point '(500 500 0)) (vlax-3d-point '(600 500 0))) acExtendNone)) 1)`), '-1', 'sin intersección: safearray vacío');

  // edición
  t.eq(await ev(`(vla-get-radius (car (vlax-invoke c 'Offset 5)))`), '15.0', 'Offset positivo hacia fuera');
  t.eq(await ev(`(vla-get-radius (vlax-safearray-get-element (vlax-variant-value (vla-offset c -2)) 0))`), '8.0', 'Offset negativo devuelve variant de objetos');
  t.eq(await ev(`(progn (setq m (vla-mirror ln (vlax-3d-point '(0 0 0)) (vlax-3d-point '(0 10 0)))) (equal (vlax-get m 'EndPoint) '(-100.0 0.0 0.0) 1e-9))`), 'T', 'Mirror crea copia');
  t.eq(await ev(`(progn (setq cp (vla-copy c)) (vla-move cp (vlax-3d-point '(0 0 0)) (vlax-3d-point '(300 0 0))) (vlax-get cp 'Center))`), '(300.0 0.0 0.0)', 'Copy + Move');
  t.eq(await ev(`(progn (vla-getboundingbox c 'mn 'mx) (list (vlax-safearray->list mn) (vlax-safearray->list mx)))`), '((-10.0 -10.0 0.0) (10.0 10.0 0.0))', 'GetBoundingBox con argumentos de salida');
  t.eq(await ev(`(length (vlax-invoke pl 'Explode))`), '4', 'Explode');

  // texto
  await ev(`(setq tx (vla-addtext ms "Hola" (vlax-3d-point '(0 50 0)) 3.5)) (vla-put-alignment tx acAlignmentMiddleCenter) (vla-put-textalignmentpoint tx (vlax-3d-point '(5 50 0)))`);
  t.eq(await page.evaluate(() => { const e = webcad.doc.model.find((x) => x.type === 'TEXT'); return [e.ha, e.va, e.p2.x]; }), [1, 2, 5], 'Alignment y TextAlignmentPoint');

  // bloques y atributos
  await ev(`(setq blk (vla-add (vla-get-blocks doc) (vlax-3d-point '(0 0 0)) "ETIQ")) (vla-addcircle blk (vlax-3d-point '(0 0 0)) 5) (vla-addattribute blk 2.5 acAttributeModeNormal "Código" (vlax-3d-point '(0 -8 0)) "COD" "X1")`);
  await ev(`(setq br (vla-insertblock ms (vlax-3d-point '(200 0 0)) "ETIQ" 1 1 1 0))`);
  t.eq(await ev(`(list (vla-get-hasattributes br) (vla-get-effectivename br) (vla-get-count blk))`), '(:VLAX-TRUE "ETIQ" 2)', 'Blocks.Add, AddAttribute e InsertBlock');
  await ev(`(foreach a (vlax-invoke br 'GetAttributes) (if (= (vla-get-tagstring a) "COD") (vla-put-textstring a "B-22")))`);
  t.eq(await page.evaluate(() => webcad.doc.model.find((x) => x.type === 'INSERT').attribs[0].text), 'B-22', 'GetAttributes + TextString cambia el atributo');
  t.eq(await ev(`(progn (vla-put-insertionpoint br (vlax-3d-point '(210 0 0))) (vlax-get (car (vlax-invoke br 'GetAttributes)) 'InsertionPoint))`), '(210.0 -8.0 0.0)', 'mover la referencia mueve sus atributos');

  // bloque dinámico (visibilidad)
  await page.evaluate(() => { webcad.doc.blocks.DYN = { name: 'DYN', base: { x: 0, y: 0 }, ents: [{ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 2, bid: 0, layer: '0' }, { type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 5, y: 0 }, bid: 1, layer: '0' }], params: [{ type: 'visibility', name: 'Visibilidad', states: [{ name: 'Todo', hidden: [] }, { name: 'Solo círculo', hidden: [1] }] }], _ver: 1 }; });
  await ev(`(setq dy (vla-insertblock ms (vlax-3d-point '(0 200 0)) "DYN" 1 1 1 0))`);
  t.eq(await ev(`(mapcar 'vla-get-propertyname (vlax-invoke dy 'GetDynamicBlockProperties))`), '("Visibilidad")', 'GetDynamicBlockProperties');
  t.eq(await ev(`(progn (setq dp (car (vlax-invoke dy 'GetDynamicBlockProperties))) (vla-put-value dp (vlax-make-variant "Solo círculo" vlax-vbString)) (vlax-variant-value (vla-get-value dp)))`), '"Solo círculo"', 'cambiar el valor de una propiedad dinámica');
  t.eq(await ev(`(vlax-get dp 'AllowedValues)`), '("Todo" "Solo círculo")', 'AllowedValues');

  // ldata, diccionarios y xrecords
  t.eq(await ev(`(progn (vlax-ldata-put "MIAPP" "clave" '(1 2.5 "tres")) (vlax-ldata-get "MIAPP" "clave"))`), '(1 2.5 "tres")', 'vlax-ldata en diccionario');
  t.eq(await ev(`(progn (vlax-ldata-put ln "id" 42) (vlax-ldata-get ln "id"))`), '42', 'vlax-ldata en objeto');
  t.eq(await ev(`(progn (dictadd (namedobjdict) "MIDATO" (entmakex '((0 . "XRECORD") (100 . "AcDbXrecord") (1 . "dato") (40 . 3.5)))) (cdr (assoc 1 (dictsearch (namedobjdict) "MIDATO"))))`), '"dato"', 'entmakex XRECORD + dictadd + dictsearch');
  t.eq(await ev(`(progn (setq xr (vla-addxrecord (vla-add (vla-get-dictionaries doc) "CONF") "K")) (vla-setxrecorddata xr (progn (setq ty (vlax-make-safearray vlax-vbInteger '(0 . 1))) (vlax-safearray-fill ty '(1 70)) ty) (progn (setq va (vlax-make-safearray vlax-vbVariant '(0 . 1))) (vlax-safearray-fill va (list "x" 7)) va)) (vla-getxrecorddata xr 'oty 'ova) (mapcar 'vlax-variant-value (vlax-safearray->list ova)))`), '("x" 7)', 'Dictionaries + XRecord');
  t.ok(await page.evaluate(() => JSON.parse(webcad.doc.serialize()).dicts.MIAPP != null), 'los datos se guardan con el dibujo');

  // xdata
  await ev(`(regapp "MIAPP") (setq en (vlax-vla-object->ename ln)) (entmod (append (entget en) '((-3 ("MIAPP" (1000 . "hola") (1070 . 5))))))`);
  t.eq(await ev(`(cdr (assoc -3 (entget en '("MIAPP"))))`), '(("MIAPP" (1000 . "hola") (1070 . 5)))', 'entget con datos extendidos');
  t.eq(await ev(`(progn (vla-getxdata ln "MIAPP" 'typ 'val) (vlax-safearray->list typ))`), '(1001 1000 1070)', 'GetXData');

  // conjuntos de selección ActiveX
  t.eq(await ev(`(progn (setq ss (vla-add (vla-get-selectionsets doc) "SS1")) (setq ft (vlax-make-safearray vlax-vbInteger '(0 . 0)) fd (vlax-make-safearray vlax-vbVariant '(0 . 0))) (vlax-safearray-fill ft '(0)) (vlax-safearray-fill fd '("CIRCLE")) (vla-select ss acSelectionSetAll nil nil ft fd) (vla-get-count ss))`),
    String(await page.evaluate(() => webcad.doc.model.filter((e) => e.type === 'CIRCLE').length)), 'SelectionSets.Add + Select con filtro');
  t.eq(await ev(`(vl-catch-all-error-p (vl-catch-all-apply 'vla-add (list (vla-get-selectionsets doc) "SS1")))`), 'T', 'nombre de selección duplicado da error');
  await ev(`(vla-delete ss)`);

  // utilidades y documento
  t.eq(await ev(`(vlax-safearray->list (vlax-variant-value (vla-polarpoint util (vlax-3d-point '(0 0 0)) 0 10)))`), '(10.0 0.0 0.0)', 'Utility.PolarPoint');
  t.eq(await ev(`(vla-realtostring util 3.14159 acDecimal 2)`), '"3.14"', 'Utility.RealToString');
  t.eq(await ev(`(progn (vla-setvariable doc "USERI1" 7) (list (getvar "USERI1") (vla-getvariable doc "USERI1")))`), '(7 7)', 'Get/SetVariable');
  t.eq(await ev(`(progn (setq col (vla-getinterfaceobject acad "AutoCAD.AcCmColor.24")) (vla-setrgb col 255 128 0) (vla-put-truecolor c col) (vla-get-red (vla-get-truecolor c)))`), '255', 'AcCmColor + TrueColor');
  t.eq(await page.evaluate(() => webcad.doc.model.find((e) => e.type === 'CIRCLE').color), '#ff8000', 'color verdadero aplicado');
  t.eq(await ev(`(progn (setq tb (vla-addtable ms (vlax-3d-point '(0 -100 0)) 3 2 8 30)) (vla-settext tb 0 0 "Título") (list (vla-gettext tb 0 0) (vla-get-rows tb) (vla-get-columns tb)))`), '("Título" 3 2)', 'AddTable + SetText');
  t.eq(await ev(`(list (vlax-method-applicable-p ln 'Offset) (vlax-method-applicable-p ln 'GetAttributes) (vlax-property-available-p c 'Radius) (vlax-property-available-p c 'TextString) (vlax-property-available-p c 'Length T))`), '(T nil T nil nil)', 'method/property-available-p');
  t.eq(await ev(`(getpropertyvalue (vlax-vla-object->ename c) "Radius")`), '10.0', 'getpropertyvalue');
  t.eq(await ev(`(vla-get-name (vla-get-activelayout doc))`), '"Model"', 'ActiveLayout');
  t.eq(await ev(`(progn (setq n 0) (vlax-for o ms (setq n (1+ n))) (= n (vla-get-count ms)))`), 'T', 'vlax-for sobre ModelSpace');
  await ev(`(vlax-dump-object ln T)`);
  t.ok(await page.evaluate(() => document.getElementById('cmdhist').textContent.includes('IWcadLine')), 'vlax-dump-object');

  // SendCommand y reactores de comando
  await ev(`(defun fin (r c) (setq *ult* (car c))) (setq rc (vlr-command-reactor nil '((:vlr-commandEnded . fin))))`);
  const before = await page.evaluate(() => webcad.doc.model.length);
  await ev(`(vla-sendcommand doc "_.CIRCLE 400,400 3 ")`);
  await page.waitForTimeout(300);
  t.eq(await page.evaluate(() => webcad.doc.model.length), before + 1, 'SendCommand ejecuta la orden');
  t.eq(await ev(`*ult*`), '"CIRCLE"', 'reactor :vlr-commandEnded');
  await ev(`(vlr-remove rc)`);

  // patrones habituales de rutinas publicadas
  t.eq(await ev(`(progn (defun lm:len (e) (vlax-curve-getdistatparam e (vlax-curve-getendparam e))) (mapcar '(lambda (o) (atof (rtos (lm:len o) 2 3))) (list ln c ar)))`), '(100.0 62.832 15.708)', 'longitud con vlax-curve-getdistatparam/getendparam');
  await ev(`(vlax-for b (vla-get-blocks doc) (vlax-for o b (if (wcmatch (vla-get-objectname o) "AcDb*Text,AcDbAttributeDefinition") (vla-put-height o 1.8))))`);
  t.ok(await page.evaluate(() => [...webcad.doc.allEntsDeep()].filter((e) => /TEXT|ATTDEF/.test(e.type)).every((e) => e.h === 1.8)), 'recorrer todos los bloques y cambiar la altura de los textos');
  t.eq(await ev(`(progn (defun getdyn (blk prp) (setq prp (strcase prp)) (vl-some '(lambda (x) (if (= prp (strcase (vla-get-propertyname x))) (vlax-get x 'value))) (vlax-invoke blk 'getdynamicblockproperties))) (getdyn dy "visibilidad"))`), '"Solo círculo"', 'LM:getdynpropvalue');
  t.eq(await ev(`(vla-get-name (vla-get-block (vla-get-activelayout doc)))`), '"*Model_Space"', 'Layout.Block');

  // otras funciones
  t.eq(await ev(`(list (vl-string-mismatch "VL-FUN" "VL-VAR") (snvalid "Capa 1") (snvalid "a<b") (xstrcase "abc") (layoutlist))`), '(3 T nil "ABC" ("Presentación1"))', 'vl-string-mismatch, snvalid, layoutlist');
  t.eq(await ev(`(progn (vl-registry-write "HKEY_CURRENT_USER\\\\Software\\\\Prueba" "v" "1") (vl-registry-read "HKEY_CURRENT_USER\\\\Software\\\\Prueba" "v"))`), '"1"', 'vl-registry');
  t.eq(await ev(`(progn (layerstate-save "Base" nil nil) (vla-put-layeron lay :vlax-false) (layerstate-restore "Base" nil) (vla-get-layeron lay))`), ':VLAX-TRUE', 'layerstate-save/restore');
  t.eq(await ev(`(progn (vla-startundomark doc) (vla-addpoint ms (vlax-3d-point '(1 1 0))) (vla-addpoint ms (vlax-3d-point '(2 2 0))) (vla-endundomark doc) (length (vl-remove-if-not '(lambda (o) (= (vla-get-objectname o) "AcDbPoint")) (progn (setq l nil) (vlax-for o ms (setq l (cons o l))) l))))`), '2', 'Start/EndUndoMark agrupan');
  await page.evaluate(() => webcad.doc.undo());
  t.eq(await page.evaluate(() => webcad.doc.model.filter((e) => e.type === 'POINT').length), 0, 'un solo deshacer quita el grupo');

  // rutinas de ejemplo (samples/rutinas-activex.lsp)
  const src = fs.readFileSync(new URL('../../samples/rutinas-activex.lsp', import.meta.url), 'utf8');
  await page.evaluate((x) => webcad.lisp.loadText(x), src);
  const type = typer(page);
  await type('INFOCAPAS'); await page.waitForTimeout(200);
  t.ok(await page.evaluate(() => /MUROS: \d+ objetos/.test(document.getElementById('cmdhist').textContent)), 'INFOCAPAS lista las capas');
  await page.evaluate(() => webcad.cmd.setSel(webcad.doc.model.filter((e) => e.type === 'LINE' && e.layer === 'MUROS')));
  await type('LONGTOTAL'); await page.waitForTimeout(200);
  t.ok(await page.evaluate(() => /Longitud total de \d+ objetos: 200\.000/.test(document.getElementById('cmdhist').textContent)), 'LONGTOTAL suma con vlax-curve');
};
