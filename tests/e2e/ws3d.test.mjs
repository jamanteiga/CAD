// Plantillas A2/A1/A0 y 3D, espacio de trabajo Modelado 3D con vista acoplada, primitivas cuña/pirámide/toroide
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);

  // plantillas A2, A1 y A0 y modelado 3D
  const tp = await ev(async () => { const T = await import('./js/core/templates.js'); return ['iso-a2', 'iso-a1', 'iso-a0', 'iso-3d'].map((id) => { const d = T.buildTemplate(id); const L = d.layouts[0]; return [L.paper, L.w, L.h, d.ext.ws || '']; }); });
  t.eq(tp, [['A2', 594, 420, ''], ['A1', 841, 594, ''], ['A0', 1189, 841, ''], ['A3', 420, 297, '3d']], 'Plantillas A2, A1, A0 y Modelado 3D');

  // menú Nuevo de la pestaña Inicio con todas las plantillas
  await ev(() => webcad.ui.start.show()); await page.waitForTimeout(150);
  await ev(() => document.querySelectorAll('#start .split')[1].querySelector('.d').click()); await page.waitForTimeout(80);
  const items = await ev(() => [...document.querySelectorAll('.dropmenu .it')].map((x) => x.textContent.trim()));
  t.ok(['ISO A2 apaisado — mm', 'ISO A1 apaisado — mm', 'ISO A0 apaisado — mm', 'Modelado 3D ISO — mm'].every((n) => items.includes(n)), `menú Nuevo: ${items.join(' · ')}`);
  await page.keyboard.press('Escape'); await ev(() => document.querySelector('.dropmenu')?.remove());

  // nuevo dibujo desde la plantilla 3D: activa el espacio Modelado 3D con la vista acoplada
  await ev(async () => { webcad.ui.start.hide(); await webcad.io.newFromTemplate('iso-3d'); }); await page.waitForTimeout(200);
  const ws = await ev(() => [document.getElementById('wsSel').value, !!document.querySelector('#work > .v3d.dock'), [...document.querySelectorAll('#ribbon .rt')].slice(0, 3).map((x) => x.textContent)]);
  t.eq(ws, ['3d', true, ['Inicio', 'Sólido', 'Visualizar']], 'Espacio Modelado 3D: fichas Inicio/Sólido/Visualizar y vista 3D acoplada');

  // primitivas nuevas; la vista acoplada se actualiza sola
  await ev(() => { webcad.doc.setvar('OSMODE', 0); webcad.view.setCur({ cx: 200, cy: 50, s: 1 }); });
  await type('_WEDGE', '0,0', '100,50', '40');
  await type('_PYRAMID', 'S', '6', '200,0', '30', '60');
  await type('_TORUS', '350,0', '50', '10');
  await page.waitForTimeout(200);
  const vol = await ev(async () => { const S = await import('./js/cmd/solid3d.js'); return webcad.doc.model.filter((e) => e.type === '3DSOLID').map((e) => Math.round(S.meshVolume(S.meshOf(e)))); });
  // cuña 100·50·40/2 = 100 000; pirámide hexagonal r 30: (3√3/2·900)·60/3 = 46 765; toroide 2π²·50·10² ≈ 98 696 (malla 36×24: algo menos)
  t.eq(vol.slice(0, 2), [100000, 46765], 'Volumen de la cuña y de la pirámide hexagonal');
  t.ok(vol[2] > 96000 && vol[2] < 98696, `volumen del toroide ${vol[2]}`);
  t.ok(await ev(() => webcad.v3d?.dock && webcad.v3d.meshes.length === 3), 'la vista 3D acoplada muestra los 3 sólidos');
  await type('_VIEWPRESET', 'SEiso');
  t.ok(await ev(() => Math.abs(webcad.v3d.cam.az + Math.PI / 4) < 1e-6), 'VISTAPREDEF isométrica SE');

  // volver a Dibujo y anotación cierra la vista acoplada
  await ev(() => webcad.ui.setWorkspace('ribbon')); await page.waitForTimeout(100);
  t.eq(await ev(() => [document.getElementById('wsSel').value, !!document.querySelector('.v3d.dock'), document.querySelector('#ribbon .rt.on')?.textContent]), ['ribbon', false, 'Inicio'], 'Dibujo y anotación restaura la cinta 2D');
  t.eq(errs, [], 'sin errores');
};
