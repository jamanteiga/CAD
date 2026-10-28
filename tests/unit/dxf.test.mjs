// Lectura y escritura DXF (R12 y 2000) sin navegador
import { Doc } from '../../js/core/document.js';
import { readDXF, writeDXF } from '../../js/io/dxf.js';
import { writeDXF2000 } from '../../js/io/dxfw.js';
const sample = () => {
  const d = new Doc(); d.reset('prueba.dwg'); d.ensureLayer('MUROS');
  d.begin('t');
  d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 }, layer: 'MUROS', color: 1 });
  d.add({ type: 'CIRCLE', c: { x: 50, y: 50 }, r: 25, layer: '0' });
  d.add({ type: 'ARC', c: { x: 0, y: 0 }, r: 10, a1: 0, a2: Math.PI / 2, layer: '0' });
  d.add({ type: 'LWPOLYLINE', pts: [{ x: 0, y: 0, b: 0 }, { x: 10, y: 0, b: 0.5 }, { x: 10, y: 10, b: 0 }], closed: true, layer: '0' });
  d.add({ type: 'TEXT', p: { x: 0, y: -10 }, h: 2.5, text: 'Cañería Ø100', layer: '0' });
  d.end(); return d;
};
const types = (d) => d.model.map((e) => e.type).sort().join(',');
export default async (t) => {
  for (const [name, fn] of [['R12', (d) => writeDXF(d)], ['2000', (d) => writeDXF2000(d)]]) {
    const d = sample();
    let txt = fn(d); if (typeof txt !== 'string') txt = new TextDecoder('windows-1252').decode(txt);
    t.ok(/SECTION/.test(txt) && /EOF\s*$/.test(txt), `DXF ${name} bien formado`);
    if (name === '2000') t.ok(txt.includes('AC1015'), 'versión AC1015');
    const r = readDXF(txt, 'rt.dxf');
    t.eq(types(r), types(d), `DXF ${name}: mismos tipos de objeto`);
    t.ok(r.layers.MUROS, `DXF ${name}: conserva la capa MUROS`);
    const c = r.model.find((e) => e.type === 'CIRCLE'); t.near(c.r, 25, 1e-6, `DXF ${name}: radio del círculo`);
    t.eq(r.model.find((e) => e.type === 'TEXT').text, 'Cañería Ø100', `DXF ${name}: texto con acentos`);
    const pl = r.model.find((e) => e.type === 'LWPOLYLINE'); t.near(pl.pts[1].b, 0.5, 1e-6, `DXF ${name}: curvatura de polilínea`);
  }
};
