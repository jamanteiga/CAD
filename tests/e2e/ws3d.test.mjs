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

  // nuevo dibujo desde la plantilla 3D: espacio Modelado 3D, vista isométrica SO en la ventana principal (sin paneles)
  await ev(async () => { webcad.ui.start.hide(); await webcad.io.newFromTemplate('iso-3d'); }); await page.waitForTimeout(200);
  const ws = await ev(() => [document.getElementById('wsSel').value, !!document.querySelector('.v3d'), [...document.querySelectorAll('#ribbon .rt')].slice(0, 3).map((x) => x.textContent), !!webcad.view.P, Math.round(webcad.doc.ext.view3d.az * 180 / Math.PI), document.getElementById('vptag').textContent.trim()]);
  t.eq(ws, ['3d', false, ['Inicio', 'Sólido', 'Visualizar'], true, -135, '[-][Isométrica SO][Realista]'], 'Plantilla 3D: espacio Modelado 3D con la vista isométrica en la ventana principal');

  // primitivas nuevas
  await ev(() => { webcad.doc.setvar('OSMODE', 0); });
  await type('_WEDGE', '0,0', '100,50', '40');
  await type('_PYRAMID', 'S', '6', '200,0', '30', '60');
  await type('_TORUS', '350,0', '50', '10');
  await page.waitForTimeout(150);
  const vol = await ev(async () => { const S = await import('./js/cmd/solid3d.js'); return webcad.doc.model.filter((e) => e.type === '3DSOLID').map((e) => Math.round(S.meshVolume(S.meshOf(e)))); });
  // cuña 100·50·40/2 = 100 000; pirámide hexagonal r 30: (3√3/2·900)·60/3 = 46 765; toroide 2π²·50·10² ≈ 98 696 (malla 36×24: algo menos)
  t.eq(vol.slice(0, 2), [100000, 46765], 'Volumen de la cuña y de la pirámide hexagonal');
  t.ok(vol[2] > 96000 && vol[2] < 98696, `volumen del toroide ${vol[2]}`);

  // plano de trabajo frontal: el círculo y su extrusión quedan en vertical
  await type('_WORKPLANE', 'Front');
  await type('_CIRCLE', '500,30', '20');
  t.eq(await ev(() => webcad.doc.model.at(-1).wp), { o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1] }, 'el círculo se dibuja sobre el plano frontal (XZ)');
  await ev(() => { webcad.cmd.sel = [webcad.doc.model.at(-1)]; });
  await type('_EXTRUDE', '-80');
  const bb = await ev(() => { const m = webcad.meshOf(webcad.doc.model.at(-1)); const r = (i, f) => Math.round(f(...m.v.map((p) => p[i]))); return [r(0, Math.min), r(0, Math.max), r(1, Math.min), r(1, Math.max), r(2, Math.min), r(2, Math.max)]; });
  t.eq(bb, [480, 520, 0, 80, 10, 50], 'EXTRUDE sobre el plano frontal: cilindro horizontal según +Y');
  await type('_WORKPLANE', 'Top');
  await type('_WORKPLANE', 'Elevation', '40');
  t.eq(await ev(() => webcad.doc.ext.wp.o), [0, 0, 40], 'WORKPLANE Elevación desplaza el plano según su Z');
  await type('_WORKPLANE', 'World');
  t.ok(await ev(() => webcad.doc.ext.wp === null), 'WORKPLANE Universal');

  // designación en 3D: pulsar sobre la cuña la selecciona
  await type('_ZOOM', 'E');
  const hit = await ev(() => { const s = webcad.view._solidScr.get(webcad.doc.model[0]); const q = s.polys.flat(); const c = q.reduce((a, p) => ({ x: a.x + p.x / q.length, y: a.y + p.y / q.length }), { x: 0, y: 0 }); return webcad.view.pickAt(webcad.view.toWorld(c.x, c.y)) === webcad.doc.model[0]; });
  t.ok(hit, 'designar un sólido en la vista 3D');

  // cubo de vistas: la cara superior pone la vista en planta
  const cube = await ev(() => { const r = webcad.view.host.getBoundingClientRect(), f = webcad.view._cube.find((x) => x.k === 'Top'), c = f.pts.reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 }); return [r.left + c.x, r.top + c.y]; });
  await page.mouse.click(cube[0], cube[1]); await page.waitForTimeout(100);
  t.ok(await ev(() => Math.abs(webcad.doc.ext.view3d.el - Math.PI / 2) < 1e-6), 'cubo de vistas: SUPERIOR');
  await type('_VIEWPRESET', 'SEiso');
  t.ok(await ev(() => Math.abs(webcad.doc.ext.view3d.az + Math.PI / 4) < 1e-6), 'VISTAPREDEF isométrica SE');

  // volver a Dibujo y anotación conserva la vista y restaura la cinta 2D
  await ev(() => webcad.ui.setWorkspace('ribbon')); await page.waitForTimeout(100);
  t.eq(await ev(() => [document.getElementById('wsSel').value, document.querySelector('#ribbon .rt.on')?.textContent]), ['ribbon', 'Inicio'], 'Dibujo y anotación restaura la cinta 2D');
  t.eq(errs, [], 'sin errores');
};
