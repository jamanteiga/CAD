// Funciones avanzadas: grupos, matrices asociativas, tablas, restricciones, conductos, isométrico
import { ready, typer, model, last } from './helpers.mjs';
export default async (page, t) => {
  await ready(page); const type = typer(page);
  await type('CIRCLE', '0,0', '5', 'LINE', '-5,0', '5,0', '');
  await type('GROUP', '', '', 'ALL', '');
  t.eq(await page.evaluate(() => Object.keys(webcad.doc.groups).length), 1, 'GRUPO crea un grupo');
  await type('ARRAYRECT', 'ALL', '', '2', '3', '20', '30');
  const a = await last(page); t.ok(a.type === 'INSERT' && a.arr, 'MATRIZRECT crea una matriz asociativa');
  // restricciones
  await page.evaluate(() => { const d = webcad.doc; d.begin('x'); for (const e of [...d.model]) d.remove(e); d.end(); webcad.view.setCur({ cx: 60, cy: 30, s: 6 }); });
  await type('RECTANG', '0,0', '100,50', 'AUTOCONSTRAIN', 'L', '');
  t.ok(await page.evaluate(() => webcad.doc.constraints.length >= 4), 'RESTAUTO aplica restricciones a un rectángulo');
  await type('DCHORIZONTAL', '1,0', '99,0', '50,-10', '120');
  const pts = (await last(page)).pts.map((p) => Math.round(p.x));
  t.ok(pts.includes(120), `la restricción de cota cambia la geometría (${pts})`);
  // conductos
  await type('DUCT', '0,0', '3000,0', '3000,2000', '');
  const d = await last(page); t.eq([d.type, d.pts.length], ['DUCT', 3], 'CONDUCTO');
  const calc = await page.evaluate(async () => { const D = await import('./js/core/duct.js'); return D.ductCalc(webcad.doc.model.at(-1)); });
  t.ok(calc.v > 0 && calc.R > 0 && calc.elbows === 1, `cálculo del conducto (v=${calc.v?.toFixed(2)} m/s, R=${calc.R?.toFixed(2)} Pa/m, codos=${calc.elbows})`);
  // tabla y exportación de su contenido al DXF 2000
  const rt = await page.evaluate(async () => {
    const T = await import('./js/core/table.js'); const doc = webcad.doc;
    const e = T.newTable({ x: 0, y: -40 }, 2, 2, { cw: 20, rh: 6 }); e.cells = [['A', 'B'], ['1', 'Ñ']]; e.layer = '0';
    doc.begin('t'); doc.add(e); doc.end();
    const { writeDXF2000 } = await import('./js/io/dxfw.js'); const { readDXF } = await import('./js/io/dxf.js');
    let txt = writeDXF2000(doc); if (typeof txt !== 'string') txt = new TextDecoder('windows-1252').decode(txt);
    const r = readDXF(txt, 'x.dxf'); const tb = r.model.find((x) => x.type === 'TABLE');
    return { tb: tb && tb.cells, duct: r.model.some((x) => x.type === 'DUCT'), cons: (r.constraints || []).length };
  });
  t.eq(rt.tb, [['A', 'B'], ['1', 'Ñ']], 'TABLA sobrevive al DXF 2000');
  t.ok(rt.duct, 'CONDUCTO sobrevive al DXF 2000');
  t.ok(rt.cons >= 4, 'las restricciones sobreviven al DXF 2000');
  // isométrico
  await type('ISODRAFT', 'I');
  t.eq(await page.evaluate(() => webcad.doc.vars.SNAPSTYL), 1, 'DIBISO activa el modo isométrico');
  await type('ISODRAFT', 'O');
};
