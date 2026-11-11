// Selección con rectángulo: clic-clic o arrastrar; izquierda→derecha = ventana, derecha→izquierda = captura; en 2D y en 3D
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  for (const mode of ['2D', '3D']) {
    await ev(async (m) => { if (m === '3D') await webcad.io.newFromTemplate('iso-3d'); webcad.ui.start.hide(); webcad.doc.model.length = 0; webcad.doc.setvar('OSMODE', 0); webcad.cmd.clearSel(); }, mode);
    await type('_LINE', '0,0', '100,0', ''); await type('_CIRCLE', '50,50', '20'); await type('_LINE', '160,120', '200,120', '');
    await type('_ZOOM', 'E'); await ev(() => { const v = webcad.view; v.setCur({ ...v.cur, s: v.cur.s * 0.4 }); });
    // rectángulo en pantalla que encierra la línea inferior y el círculo, sin la tercera línea
    const box = await ev(() => { const v = webcad.view, r = v.host.getBoundingClientRect(), bb = { x1: 1e9, y1: 1e9, x2: -1e9, y2: -1e9 };
      for (const e of webcad.doc.model.slice(0, 2)) { let b = v.P && v.screenBB(e); if (!b) { const q = webcad.E.entBBox(e, webcad.doc), A = v.toScreen({ x: q.x1, y: q.y1 }), B = v.toScreen({ x: q.x2, y: q.y2 }); b = { x1: Math.min(A.x, B.x), y1: Math.min(A.y, B.y), x2: Math.max(A.x, B.x), y2: Math.max(A.y, B.y) }; } bb.x1 = Math.min(bb.x1, b.x1); bb.y1 = Math.min(bb.y1, b.y1); bb.x2 = Math.max(bb.x2, b.x2); bb.y2 = Math.max(bb.y2, b.y2); }
      return [r.left + bb.x1 - 12, r.top + bb.y2 + 12, r.left + bb.x2 + 12, r.top + bb.y1 - 12]; });
    const a = [box[0], box[1]], b = [box[2], box[3]];
    const sel = async () => { const n = await ev(() => webcad.cmd.sel.length); await page.keyboard.press('Escape'); await ev(() => webcad.cmd.clearSel()); return n; };
    await page.mouse.click(...a); await page.mouse.move(...b, { steps: 4 }); await page.mouse.click(...b); await page.waitForTimeout(60);
    t.eq(await sel(), 2, `${mode}: ventana con clic-clic`);
    await page.mouse.move(...a); await page.mouse.down(); await page.mouse.move(...b, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(60);
    t.eq(await sel(), 2, `${mode}: ventana arrastrando con el botón pulsado`);
    // captura de derecha a izquierda sobre la línea inferior: solo la toca
    const c = await ev(() => { const v = webcad.view, r = v.host.getBoundingClientRect(), q = v.toScreen({ x: 90, y: 0 }); return [r.left + q.x, r.top + q.y]; });
    await page.mouse.move(c[0] + 8, c[1] + 8); await page.mouse.down(); await page.mouse.move(c[0] - 8, c[1] - 8, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(60);
    t.eq(await sel(), 1, `${mode}: captura de derecha a izquierda`);
    await type('_ERASE'); await page.mouse.click(...a); await page.mouse.click(...b); await page.waitForTimeout(60); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    t.eq(await ev(() => webcad.doc.model.length), 1, `${mode}: BORRAR con ventana dentro del comando`);
  }
  t.eq(errs, [], 'sin errores');
};
