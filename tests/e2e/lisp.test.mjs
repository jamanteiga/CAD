// AutoLISP: funciones C:, command, ssget y cuadros DCL
import { ready, typer, model, last } from './helpers.mjs';
export default async (page, t) => {
  await ready(page); const type = typer(page);
  await type('(defun c:aro () (command "_.circle" \'(300 300) 10) (princ))', 'ARO');
  await page.waitForTimeout(200);
  t.eq((await last(page)).type, 'CIRCLE', 'función C: con command');
  t.eq(await page.evaluate(async () => webcad.lisp.evalString('(sslength (ssget "X" \'((0 . "CIRCLE"))))')), 1, 'ssget con filtro');
  t.eq(await page.evaluate(async () => webcad.lisp.evalString('(strcat "a" (itoa (+ 1 2)))')), 'a3', 'aritmética y cadenas');
  await page.evaluate(() => webcad.lisp.addFile('caja.dcl', 'caja : dialog { label = "Caja"; : edit_box { key = "ancho"; label = "Ancho"; value = "100"; } ok_cancel; }'));
  await page.evaluate(() => webcad.lisp.loadText('(defun c:caja ( / id w) (setq id (load_dialog "caja.dcl")) (new_dialog "caja" id) (action_tile "accept" "(setq w (atof (get_tile \\"ancho\\"))) (done_dialog 1)") (if (= (start_dialog) 1) (command "_.rectang" "0,0" (list w 50))) (unload_dialog id) (princ))'));
  await type('CAJA'); await page.waitForTimeout(300);
  t.ok(await page.evaluate(() => !!document.querySelector('.modal')), 'el cuadro DCL se abre');
  await page.fill('.modal input.fld >> nth=0', '220'); await page.click('.modal .btn.pri'); await page.waitForTimeout(300);
  const r = await last(page); t.ok(r.type === 'LWPOLYLINE' && r.pts.some((p) => Math.abs(p.x - 220) < 1e-6), 'el valor del cuadro DCL llega a la rutina');
};
