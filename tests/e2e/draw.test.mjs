// Dibujo y edición básicos desde la línea de comandos
import { ready, typer, model, last } from './helpers.mjs';
export default async (page, t) => {
  t.eq(await page.evaluate(() => document.documentElement.dataset.ui), 'light', 'arranca con el tema claro');
  await ready(page); const type = typer(page);
  await type('LINE', '0,0', '100,0', '@0,50', 'C');
  t.eq(await model(page), ['LINE', 'LINE', 'LINE'], 'triángulo con LINE + Cerrar');
  await type('CIRCLE', '50,25', '20');
  t.near((await last(page)).r, 20, 1e-9, 'círculo por centro y radio');
  await type('RECTANG', '200,0', '@80,40');
  const r = await last(page); t.eq([r.type, r.pts.length, r.closed], ['LWPOLYLINE', 4, true], 'rectángulo');
  await type('LINE', '20,25', '80,25', '');
  const before = (await model(page)).length;
  await type('TRIM', '50,25', '');
  t.eq((await model(page)).length, before + 1, 'RECORTA parte la línea en dos dentro del círculo');
  await type('OFFSET', '5', '240,40', '240,60', '');
  t.eq((await last(page)).type, 'LWPOLYLINE', 'EQDIST crea una polilínea desfasada');
  const n = (await model(page)).length;
  await type('U'); t.eq((await model(page)).length, n - 1, 'deshacer');
  await type('REDO'); t.eq((await model(page)).length, n, 'rehacer');
  await type('MOVE', 'L', '', '0,0', '10,0');
  t.ok(((await last(page)).pts || []).some((p) => Math.abs(p.x - 205) < 1e-6 || Math.abs(p.x - 295) < 1e-6), 'DESPLAZA el último objeto');
};
