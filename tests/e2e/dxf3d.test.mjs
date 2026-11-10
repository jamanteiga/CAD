// DXF 3D: Z, OCS, polilíneas 3D, caras 3D, mallas y bloques 3D; vista isométrica al abrir; órbita con botón derecho
import { ready, typer } from './helpers.mjs';
const DXF = (ents, blocks = '') => ['0', 'SECTION', '2', 'BLOCKS', blocks, '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES', ents, '0', 'ENDSEC', '0', 'EOF'].filter((x) => x !== '').join('\n');
const L = (...a) => a.join('\n');
const face = (pts) => L('0', '3DFACE', '8', 'CARAS', ...pts.flatMap((p, k) => [String(10 + k), p[0], String(20 + k), p[1], String(30 + k), p[2]]));
const cube = [
  [[0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0]], [[0, 0, 100], [100, 0, 100], [100, 100, 100], [0, 100, 100]],
  [[0, 0, 0], [100, 0, 0], [100, 0, 100], [0, 0, 100]], [[0, 100, 0], [100, 100, 0], [100, 100, 100], [0, 100, 100]],
  [[0, 0, 0], [0, 100, 0], [0, 100, 100], [0, 0, 100]], [[100, 0, 0], [100, 100, 0], [100, 100, 100], [100, 0, 100]],
].map(face).join('\n');
const ents = [
  L('0', 'LINE', '8', 'L', '10', '0', '20', '0', '30', '0', '11', '0', '21', '0', '31', '250'),
  L('0', 'CIRCLE', '8', 'C', '10', '50', '20', '50', '30', '200', '40', '30', '210', '1', '220', '0', '230', '0'),
  L('0', 'LWPOLYLINE', '8', 'P', '90', '4', '70', '1', '38', '120', '10', '0', '20', '0', '10', '100', '20', '0', '10', '100', '20', '100', '10', '0', '20', '100'),
  L('0', 'POLYLINE', '8', 'P3', '66', '1', '70', '8', '10', '0', '20', '0', '30', '0', '0', 'VERTEX', '8', 'P3', '70', '32', '10', '0', '20', '0', '30', '0', '0', 'VERTEX', '8', 'P3', '70', '32', '10', '100', '20', '0', '30', '50', '0', 'VERTEX', '8', 'P3', '70', '32', '10', '100', '20', '100', '30', '0', '0', 'VERTEX', '8', 'P3', '70', '32', '10', '0', '20', '100', '30', '80', '0', 'SEQEND'),
  cube,
  L('0', 'INSERT', '8', 'B', '2', 'POSTE', '10', '300', '20', '0', '30', '0', '41', '2', '42', '2', '43', '2'),
].join('\n');
const blk = L('0', 'BLOCK', '8', '0', '2', 'POSTE', '70', '0', '10', '0', '20', '0', '30', '0', '3', 'POSTE', '0', 'LINE', '8', '0', '10', '0', '20', '0', '30', '0', '11', '0', '21', '0', '31', '100', '0', 'ENDBLK');
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  const r = await ev(async (txt) => {
    const f = new File([txt], 'pieza3d.dxf');
    await webcad.io.openFile(f);
    const d = webcad.doc, P3 = await import('./js/core/plane3d.js');
    const w = (e, p) => P3.toW(e.wp, p).map((x) => Math.round(x * 1000) / 1000);
    const byL = (l) => d.model.filter((e) => e.layer === l);
    const line = byL('L')[0], circ = byL('C')[0], lw = byL('P')[0], p3 = byL('P3'), caras = byL('CARAS'), poste = d.model.filter((e) => e.type === 'LINE' && e.layer === 'B');
    return {
      view: !!d.ext.view3d && !!webcad.view.P,
      line: [w(line, line.p1), w(line, line.p2)],
      circ: [w(circ, circ.c), P3.normal(circ.wp).map(Math.round), circ.r],
      lw: w(lw, lw.pts[2]),
      p3: p3.length,
      caras: [caras.length, caras[0]?.type, caras[0]?.polys.length],
      poste: poste.map((e) => [w(e, e.p1), w(e, e.p2)]),
      solids: webcad.view._solidScr?.size,
    };
  }, DXF(ents, blk));
  t.ok(r.view, 'un DXF con Z se abre en vista isométrica');
  t.eq(r.line, [[0, 0, 0], [0, 0, 250]], 'LINE vertical: Z conservada');
  t.eq(r.circ, [[200, 50, 50], [1, 0, 0], 30], 'CIRCLE con extrusión (1,0,0): en el plano YZ, centro OCS (50,50) a elevación 200');
  t.eq(r.lw, [100, 100, 120], 'LWPOLYLINE con elevación 120');
  t.eq(r.p3, 3, 'POLYLINE 3D no plana: un tramo por segmento');
  t.eq(r.caras, [1, '3DSOLID', 6], 'seis 3DFACE consecutivas: una superficie de malla');
  t.eq(r.poste, [[[300, 0, 0], [300, 0, 200]]], 'bloque con Z insertado a escala 2: descompuesto en 3D');
  t.eq(r.solids, 1, 'la superficie se dibuja en la vista 3D');

  // órbita con el botón derecho mantenido
  const az0 = await ev(() => webcad.doc.ext.view3d.az);
  const box = await ev(() => { const b = webcad.view.host.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await page.mouse.move(box[0], box[1]); await page.mouse.down({ button: 'right' }); await page.mouse.move(box[0] + 80, box[1] + 20, { steps: 5 }); await page.mouse.up({ button: 'right' });
  t.ok(await ev((a) => Math.abs(webcad.doc.ext.view3d.az - a) > 0.2, az0), 'botón derecho + arrastrar: órbita');

  // importar un DXF 3D en un dibujo 2D: pasa a vista 3D
  await ev(async (txt) => { await webcad.io.blankDrawing(); }, null);
  const imp = await ev(async (txt) => { webcad.io.pickFile = async () => new File([txt], 'pieza3d.dxf'); await webcad.io.importFile(); return [!!webcad.doc.ext.view3d, webcad.doc.model.filter((e) => e.wp && e.wp.o).length > 2]; }, DXF(ents, blk));
  t.eq(imp, [true, true], 'IMPORTAR un DXF 3D en un dibujo abierto: objetos en 3D y vista isométrica');
  t.ok(typeof (await ev(() => webcad.spaceMouse?.supported())) === 'boolean', 'soporte de ratón 3D instalado');
  t.eq(errs, [], 'sin errores');
};
