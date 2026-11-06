// Funciones v8
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  const esc = () => page.keyboard.press('Escape');
  const clickW = async (x, y) => page.mouse.click(...(await ev(([x, y]) => { const s = webcad.view.toScreen({ x, y }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; }, [x, y])));

  // ---- A: booleanas de sólidos 3D
  await ev(() => { webcad.doc.model.length = 0; webcad.view.setCur({ cx: 10, cy: 10, s: 8 }); });
  await type('_BOX', '0,0', '10,10', '10', '_BOX', '5,5', '15,15', '10');
  await type('_UNION', 'all', '');
  t.near(await ev(() => webcad.E.GEN['3DSOLID'].volume(webcad.doc.model[0])), 1750, 1, 'UNION de sólidos 3D (CSG)');
  await ev(() => { webcad.doc.model.length = 0; });
  await type('_BOX', '0,0', '10,10', '10', '_CYLINDER', '5,5', '2', '20');
  const v = await ev(() => { const [a, b] = webcad.doc.model; return webcad.E.GEN['3DSOLID'].volume(webcad.solidBoolean('subtract', a, b)); });
  t.near(v, 1000 - 4 * Math.PI * 10, 3, 'SUBTRACT: taladro en un prisma');
  t.near(await ev(() => { const [a, b] = webcad.doc.model; return webcad.E.GEN['3DSOLID'].volume(webcad.solidBoolean('intersect', a, b)); }), 4 * Math.PI * 10, 2, 'INTERSECT de sólidos');

  // ---- A: MLEDIT
  await ev(() => { const d = webcad.doc; d.model.length = 0; webcad.view.setCur({ cx: 50, cy: 50, s: 4 }); d.add({ type: 'MLINE', pts: [{ x: 0, y: 50 }, { x: 100, y: 50 }], scale: 10, just: 1, style: 'STANDARD' }); d.add({ type: 'MLINE', pts: [{ x: 50, y: 0 }, { x: 50, y: 100 }], scale: 10, just: 1, style: 'STANDARD' }); });
  await type('_MLEDIT', '_O');
  await clickW(20, 55); await clickW(55, 20);
  t.eq(await ev(() => webcad.doc.model.map((e) => webcad.E.explodeEnt(e, webcad.doc).length)), [4, 4], 'MLEDIT cruz abierta: cada multilínea queda en 4 tramos');
  await type('_MLEDIT', '_W'); await clickW(20, 55);
  t.eq(await ev(() => webcad.E.explodeEnt(webcad.doc.model[0], webcad.doc).length), 2, 'MLEDIT soldar todo');

  // ---- A: cortes de cota automáticos
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } }); d.add({ type: 'LINE', p1: { x: 50, y: -20 }, p2: { x: 50, y: 30 } }); webcad.doc.setvar('OSMODE', 0); });
  await type('_DIMLINEAR', '0,0', '100,0', '50,10', '_DIMBREAK', '_M', 'L', '', '');
  const b0 = await ev(() => webcad.doc.model.at(-1).brk.map((p) => Math.round(p.x)));
  await ev(() => { const d = webcad.doc, l = d.model[1]; d.begin('MOVE'); d.mod(l, (x) => { x.p1 = { x: 70, y: -20 }; x.p2 = { x: 70, y: 30 }; }); d.end(); });
  const b1 = await ev(() => webcad.doc.model.at(-1).brk.map((p) => Math.round(p.x)));
  t.eq([b0, b1], [[50], [70]], 'DIMBREAK automático: el corte sigue al objeto');

  // ---- A: LAS binario y sección
  const las = await ev(async () => {
    const n = 400, rl = 26, off = 227; const buf = new ArrayBuffer(off + n * rl); const dv = new DataView(buf);
    'LASF'.split('').forEach((c, i) => dv.setUint8(i, c.charCodeAt(0))); dv.setUint8(24, 1); dv.setUint8(25, 2); dv.setUint16(94, 227, true); dv.setUint32(96, off, true); dv.setUint8(104, 2); dv.setUint16(105, rl, true); dv.setUint32(107, n, true);
    [0.01, 0.01, 0.01].forEach((v, i) => dv.setFloat64(131 + i * 8, v, true)); [500000, 4700000, 0].forEach((v, i) => dv.setFloat64(155 + i * 8, v, true));
    for (let i = 0; i < n; i++) { const o = off + i * rl; dv.setInt32(o, (i % 20) * 100, true); dv.setInt32(o + 4, Math.floor(i / 20) * 100, true); dv.setInt32(o + 8, 1000 + (i % 20) * 10, true); dv.setUint16(o + 20, 65535, true); }
    webcad.doc.model.length = 0;
    const e = await webcad.attachCloud(new File([buf], 'prueba.las'));
    const c = webcad.doc.ext.clouds[e.cloud];
    return [c.n, Math.round(c.bb.x1), Math.round(c.bb.z2 * 10) / 10, !!c.rgb];
  });
  t.eq(las, [400, 500000, 11.9, true], 'LAS binario (formato 2, con color)');
  await ev(() => webcad.view.setCur({ cx: 500010, cy: 4700010, s: 20 }));
  await type('_POINTCLOUDSECTION'); await clickW(500005, 4700005);
  await type('500000,4700010', '500019,4700010', '0.5', '500000,4700100');
  t.ok(await ev(() => webcad.doc.model.some((e) => e.type === 'LWPOLYLINE' && e.pts.length > 3)), 'POINTCLOUDSECTION: perfil de la sección');
  t.eq(errs, [], 'sin errores (A)');

  // ---- B: sombreado asociativo
  await ev(() => { const d = webcad.doc; d.model.length = 0; webcad.view.setCur({ cx: 10, cy: 10, s: 8 }); d.add({ type: 'LWPOLYLINE', pts: [{ x: 0, y: 0, b: 0 }, { x: 10, y: 0, b: 0 }, { x: 10, y: 10, b: 0 }, { x: 0, y: 10, b: 0 }], closed: true }); webcad.cmd.sel = [d.model[0]]; });
  await type('_HATCH', '');
  t.ok(await ev(() => !!webcad.doc.model[1].hsrc), 'HATCH desde objeto: queda asociado');
  await ev(() => { const d = webcad.doc, pl = d.model[0]; d.begin('GRIP'); d.mod(pl, (x) => { x.pts[2] = { x: 20, y: 10, b: 0 }; x.pts[1] = { x: 20, y: 0, b: 0 }; }); d.end(); });
  t.near(await ev(() => webcad.E.entArea(webcad.doc.model[1])), 200, 0.01, 'el sombreado se actualiza al estirar el contorno');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }); d.add({ type: 'LINE', p1: { x: 10, y: 0 }, p2: { x: 10, y: 10 } }); d.add({ type: 'LINE', p1: { x: 10, y: 10 }, p2: { x: 0, y: 10 } }); d.add({ type: 'LINE', p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } }); webcad.cmd.sel = []; });
  await type('_HATCH', '5,5', '');
  await ev(() => { const d = webcad.doc; d.begin('STRETCH'); d.mod(d.model[1], (x) => { x.p1 = { x: 15, y: 0 }; x.p2 = { x: 15, y: 10 }; }); d.mod(d.model[0], (x) => (x.p2 = { x: 15, y: 0 })); d.mod(d.model[2], (x) => (x.p1 = { x: 15, y: 10 })); d.end(); });
  t.near(await ev(() => webcad.E.entArea(webcad.doc.model.find((e) => e.type === 'HATCH'))), 150, 0.01, 'sombreado por punto interior asociativo');

  // ---- B: pinzamientos múltiples y menú de cota
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }); d.add({ type: 'LINE', p1: { x: 0, y: 5 }, p2: { x: 10, y: 5 } }); webcad.cmd.setSel([...d.model]); });
  const gp = async (x, y) => ev(([x, y]) => { const s = webcad.view.toScreen({ x, y }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; }, [x, y]);
  await page.keyboard.down('Shift'); await page.mouse.click(...(await gp(10, 0))); await page.mouse.click(...(await gp(10, 5))); await page.keyboard.up('Shift');
  t.eq(await ev(() => webcad.cmd.hotGrips.length), 2, 'Mayús+clic: dos pinzamientos activos');
  await page.mouse.click(...(await gp(10, 5))); await page.mouse.click(...(await gp(14, 7)));
  t.eq(await ev(() => webcad.doc.model.map((e) => [e.p2.x, e.p2.y])), [[14, 2], [14, 7]], 'estiramiento simultáneo de varios pinzamientos');
  await esc();

  // ---- B: matriz y alineación en bloques dinámicos
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.begin('b'); d.touchTables(); d.blocks.VALLA = { name: 'VALLA', base: { x: 0, y: 0 }, ents: [{ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 0, y: 10 }, bid: 0 }], params: [{ type: 'linear', name: 'Largo', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, actions: [{ type: 'array', ids: [0], cs: 2 }] }, { type: 'alignment', name: 'Alin', p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } }] }; d.end(); d.add({ type: 'INSERT', name: 'VALLA', p: { x: 0, y: 0 }, sx: 1, sy: 1, rot: 0, dyn: { Largo: 10 } }); });
  t.eq(await ev(() => webcad.E.explodeEnt(webcad.doc.model[0], webcad.doc).length), 6, 'acción de matriz: 10/2+1 postes');
  t.eq(await ev(() => { const d = webcad.doc; d.add({ type: 'LINE', p1: { x: 50, y: 50 }, p2: { x: 100, y: 100 } }); const e = d.model[0]; const g = webcad.E.dynGrips(e, d).find((x) => x.kind === 'dalign'); webcad.E.dynSetFromPoint(e, d, g, { x: 70, y: 71 }); return [Math.round(e.rot * 180 / Math.PI), Math.round(e.p.x * 10) / 10]; }), [45, 70.5], 'parámetro de alineación: gira y se apoya en la línea');

  // ---- B: propiedades rápidas al pasar el cursor
  t.eq(await ev(() => webcad.rolloverInfo({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 2, layer: '0' }).map((r) => r[0]).slice(0, 2)), ['Círculo', 'Color'], 'información de propiedades al pasar el cursor');
  t.eq(errs, [], 'sin errores (B)');

  // ---- C: 3D
  await ev(() => { const d = webcad.doc; d.model.length = 0; webcad.view.setCur({ cx: 10, cy: 10, s: 8 }); });
  await type('_BOX', '0,0', '10,10', '10');
  await type('_FILLETEDGE'); await clickW(10, 10); await type('2', '');
  t.near(await ev(() => webcad.E.GEN['3DSOLID'].volume(webcad.doc.model[0])), 1000 - (4 - Math.PI) * 10, 1.5, 'FILLETEDGE: arista vertical redondeada');
  await type('_SLICE', 'all', '', '5,-5', '5,20', '');
  t.eq(await ev(() => webcad.doc.model.length), 2, 'SLICE en dos partes');
  t.near(await ev(() => webcad.doc.model.reduce((s, e) => s + webcad.E.GEN['3DSOLID'].volume(e), 0)), 1000 - (4 - Math.PI) * 10, 2, 'SLICE conserva el volumen');
  await ev(() => { webcad.doc.model.length = 0; });
  await type('_BOX', '0,0', '10,10', '10', '_SECTION', 'all', '', '_XY', '5');
  t.near(await ev(() => webcad.E.entArea(webcad.doc.model.find((e) => e.type === 'REGION'))), 100, 0.01, 'SECTION por plano XY');
  const pv = await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: '3DSOLID', kind: 'extrude', prof: [[{ x: 0, y: 0, b: 0 }, { x: 10, y: 0, b: 0 }, { x: 10, y: 10, b: 0 }, { x: 0, y: 10, b: 0 }]], h: 10 }); d.add({ type: '3DSOLID', kind: 'extrude', prof: [[{ x: 3, y: 20, b: 0 }, { x: 7, y: 20, b: 0 }, { x: 7, y: 24, b: 0 }, { x: 3, y: 24, b: 0 }]], h: 4, z0: 2 }); const r = webcad.projectView(d.model, 'Front'); return [r.vis.length, r.hid.length]; });
  t.ok(pv[0] >= 4 && pv[1] >= 3, `VIEWBASE: alzado con líneas ocultas (${pv})`);
  const rt = await ev(async () => { const d = webcad.doc; d.model.length = 0; d.add({ type: '3DSOLID', kind: 'extrude', prof: [[{ x: 0, y: 0, b: 0 }, { x: 10, y: 0, b: 0 }, { x: 10, y: 10, b: 0 }, { x: 0, y: 10, b: 0 }]], h: 5 }); webcad.cmd.sel = [d.model[0]]; await webcad.cmd.run('IFCOUT'); await new Promise((r) => setTimeout(r, 200)); const ifc = webcad._lastIfc; webcad.cmd.sel = [d.model[0]]; await webcad.cmd.run('STEPOUT'); await new Promise((r) => setTimeout(r, 200)); const stp = webcad._lastStep; d.model.length = 0; const n1 = webcad.import3D('a.ifc', ifc); const v1 = webcad.E.GEN['3DSOLID'].volume(d.model[0]); d.model.length = 0; const n2 = webcad.import3D('a.stp', stp); const v2 = webcad.E.GEN['3DSOLID'].volume(d.model[0]); return [n1, Math.round(v1), n2, Math.round(v2), /IFC4/.test(ifc), /FACETED_BREP/.test(stp)]; });
  t.eq(rt, [1, 500, 1, 500, true, true], 'exportar e importar IFC4 y STEP (B-rep facetado)');
  const ext = await ev(() => { const txt = "ISO-10303-21;\nHEADER;\nENDSEC;\nDATA;\n#1=IFCCARTESIANPOINT((0.,0.,0.));\n#2=IFCAXIS2PLACEMENT3D(#1,$,$);\n#3=IFCLOCALPLACEMENT($,#2);\n#4=IFCCARTESIANPOINT((0.,0.));\n#5=IFCAXIS2PLACEMENT2D(#4,$);\n#6=IFCRECTANGLEPROFILEDEF(.AREA.,$,#5,200.,100.);\n#7=IFCDIRECTION((0.,0.,1.));\n#8=IFCEXTRUDEDAREASOLID(#6,#2,#7,3000.);\n#9=IFCSHAPEREPRESENTATION($,'Body','SweptSolid',(#8));\n#10=IFCPRODUCTDEFINITIONSHAPE($,$,(#9));\n#11=IFCCOLUMN('x',$,'Pilar',$,$,#3,#10,$,$);\nENDSEC;\nEND-ISO-10303-21;\n"; webcad.doc.model.length = 0; webcad.import3D('c.ifc', txt); return Math.round(webcad.E.GEN['3DSOLID'].volume(webcad.doc.model[0]) / 1e6); });
  t.eq(ext, 60, 'importar IFC con IfcExtrudedAreaSolid (pilar 200x100x3000)');
  t.eq(errs, [], 'sin errores (C)');

  // ---- D: climatización y naval
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'DUCT', pts: [{ x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 3000 }], shape: 'rect', w: 400, h: 300, flow: 2000, sys: 'IMPULSION', ratio: 1, z: 3000 }); d.add({ type: 'DUCT', pts: [{ x: 0, y: 1000 }, { x: 2000, y: 1000 }], shape: 'round', d: 250, flow: 500, sys: 'RETORNO', ratio: 1 }); });
  t.eq(await ev(() => webcad.ductBom(webcad.doc.model).map((r) => [r.sec, +r.L.toFixed(2), +r.A.toFixed(2), r.el])), [['400×300', 8, 11.2, 1], ['Ø250', 2, 1.57, 0]], 'DUCTBOM: longitudes, chapa y codos');
  await type('_DUCT3D', 'all', '');
  t.eq(await ev(() => webcad.doc.model.filter((e) => e.type === '3DSOLID').length), 3, 'DUCT3D: un sólido por tramo');
  t.near(await ev(() => webcad.E.GEN['3DSOLID'].volume(webcad.doc.model.find((e) => e.type === '3DSOLID')) / 1e9), 0.4 * 0.3 * 5.2, 0.001, 'DUCT3D: volumen del tramo con solape en el codo');
  t.eq(await ev(async () => { const m = await import('./js/cmd/v8d.js'); return [m.pedCategory({ kind: 'vessel', state: 'gas', group: 2, PS: 10, V: 500 }).cat, m.pedCategory({ kind: 'vessel', state: 'gas', group: 2, PS: 10, V: 10 }).cat, m.pedCategory({ kind: 'vessel', state: 'liquid', group: 2, PS: 10, V: 1000 }).cat, m.pedCategory({ kind: 'piping', state: 'gas', group: 1, PS: 16, DN: 100 }).cat]; }), ['IV', 'I', 'Art. 4.3', 'II'], 'categoría PED según el anexo II');
  const pc = await ev(async () => { const m = await import('./js/cmd/v8d.js'); const r = m.pipeCalc({ Q: 10, Di: 52.5, L: 50, eps: 0.045, K: 5, T: 20, Pabs: 101325, Hs: 1 }); return [+r.v.toFixed(3), +r.hf.toFixed(2), +r.npsha.toFixed(1)]; });
  t.ok(Math.abs(pc[0] - 1.283) < 0.002 && pc[1] > 1.5 && pc[1] < 2.5 && pc[2] > 8 && pc[2] < 10, `PIPECALC: velocidad, pérdidas y NPSH (${pc})`);
  t.eq(await ev(() => { const d = webcad.doc; d.begin('x'); const n = webcad.flangeBlock(16, 100); d.end(); return [n, d.blocks[n].ents.filter((e) => e.type === 'CIRCLE').length]; }), ['BRIDA_EN1092_PN16_DN100', 11], 'brida EN 1092-1 DN100 PN16 (8 taladros)');
  const loads = await ev(async () => { const m = await import('./js/cmd/v8d.js'); const r = m.roomLoads({ area: 20, perim: 18, h: 2.7, extFrac: 0.5, glazing: 0.3, orient: 'S', Uw: 0.49, Ug: 2.1, g: 0.6, tout_w: 1, tin_w: 21, tout_s: 30, tin_s: 25, lsPerson: 12.5, use: 'Oficina' }); return [r.people, Math.round(r.heat), Math.round(r.total)]; });
  t.ok(loads[0] === 2 && loads[1] > 1000 && loads[1] < 3000 && loads[2] > 1500 && loads[2] < 4000, `cargas térmicas de un despacho (${loads})`);
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.begin('x'); d.touchTables(); d.blocks.PID_VALVULA_BOLA = { name: 'PID_VALVULA_BOLA', base: { x: 0, y: 0 }, ents: [{ type: 'ATTDEF', tag: 'TAG', def: 'V-1', p: { x: 0, y: 5 }, h: 2 }] }; d.end(); for (let i = 0; i < 3; i++) webcad.blocks.insertBlock('PID_VALVULA_BOLA', { x: i * 20, y: 0 }, 1, 1, 0, {}, d.model); });
  await type('_PIDTAG', 'all', '', '101');
  t.eq(await ev(() => webcad.pidList().map((r) => r[0])), ['V-101', 'V-102', 'V-103'], 'PIDTAG y PIDLIST');
  t.eq(errs, [], 'sin errores (D)');

  // ---- E: DXF con datos extendidos, diccionarios, ldata, transparencia y vínculos
  const rx = await ev(async () => {
    const d = webcad.doc; d.model.length = 0;
    const e = d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, transp: 40, url: 'https://ejemplo.org', urlDesc: 'Ej', ldata: { CLAVE: { type: 'LDATA', data: '(1 2 3)' } } });
    e.xd = { MIAPP: '((1000 . "hola") (1040 . 2.5) (1070 . 7) (1010 1 2 3))' };
    d.dicts = { MIDICT: { type: 'DICTIONARY', items: { REG1: { type: 'XRECORD', data: '((1 . "texto") (40 . 3.5))' } } } };
    const W = await import('./js/io/dxfw.js'), R = await import('./js/io/dxf.js');
    const raw = W.writeDXF2000(d); const txt = typeof raw === 'string' ? raw : new TextDecoder('windows-1252').decode(raw); const o = R.readDXF(txt, 'x.dxf'); const l = o.model[0];
    return [l.transp, l.url, l.urlDesc, l.xd?.MIAPP, JSON.stringify(l.ldata), o.dicts?.MIDICT?.items?.REG1?.data];
  });
  t.eq(rx, [40, 'https://ejemplo.org', 'Ej', '((1000 . "hola") (1040 . 2.5) (1070 . 7) (1010 1 2 3))', '{"CLAVE":{"type":"LDATA","data":"(1 2 3)"}}', '((1 . "texto") (40 . 3.5))'], 'DXF 2000: xdata, diccionarios, ldata, transparencia e hipervínculos de ida y vuelta');
  // ---- E: GeoJSON y SHP/DBF
  const gj = await ev(() => {
    const d = webcad.doc; d.model.length = 0; d.ext.geo = null;
    const n = webcad.importGeo(webcad.parseGeoJSON({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: { nombre: 'Parcela 1', ref: 7 }, geometry: { type: 'Polygon', coordinates: [[[-8.30, 43.20], [-8.29, 43.20], [-8.29, 43.21], [-8.30, 43.21], [-8.30, 43.20]]] } }, { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [-8.295, 43.205] } }] }), 'parcelas.geojson');
    const pl = d.model.find((e) => e.type === 'LWPOLYLINE');
    return [n, pl.pts.length, pl.closed, Math.round(webcad.E.entArea(pl) / 1000), pl.layer, /nombre=Parcela 1/.test(pl.xd.GIS), !!d.ext.geo];
  });
  t.ok(gj[0] === 2 && gj[1] === 4 && gj[2] && gj[3] > 850 && gj[3] < 950 && gj[4] === 'GIS_parcelas' && gj[5] && gj[6], `GeoJSON: polígono en metros con atributos (${gj})`);
  const shp = await ev(() => {
    // shapefile de un polígono (tipo 5) y su DBF con un campo
    const pts = [[0, 0], [100, 0], [100, 50], [0, 50], [0, 0]], rec = 44 + 4 + pts.length * 16, buf = new ArrayBuffer(100 + 8 + rec), dv = new DataView(buf);
    dv.setInt32(0, 9994, false); dv.setInt32(24, (100 + 8 + rec) / 2, false); dv.setInt32(28, 1000, true); dv.setInt32(32, 5, true);
    dv.setInt32(100, 1, false); dv.setInt32(104, rec / 2, false); const c = 108; dv.setInt32(c, 5, true); dv.setInt32(c + 36, 1, true); dv.setInt32(c + 40, pts.length, true); dv.setInt32(c + 44, 0, true);
    pts.forEach(([x, y], i) => { dv.setFloat64(c + 48 + i * 16, x, true); dv.setFloat64(c + 56 + i * 16, y, true); });
    const db = new ArrayBuffer(32 + 32 + 1 + 1 + 10), dd = new DataView(db), enc = (o, s) => [...s].forEach((ch, i) => dd.setUint8(o + i, ch.charCodeAt(0)));
    dd.setUint8(0, 3); dd.setUint32(4, 1, true); dd.setUint16(8, 65, true); dd.setUint16(10, 11, true); enc(32, 'USO'); dd.setUint8(43, 67); dd.setUint8(48, 10); dd.setUint8(64, 0x0d); enc(65, ' '); enc(66, 'Industrial');
    const g = webcad.parseSHP(buf), rows = webcad.parseDBF(db); g[0].props = rows[0];
    const d = webcad.doc; d.model.length = 0; d.ext.geo = null; webcad.importGeo(g, 'zonas.shp');
    const e = d.model[0]; return [g.length, e.pts.length, webcad.E.entArea(e), rows[0].USO, /USO=Industrial/.test(e.xd.GIS)];
  });
  t.eq(shp, [1, 4, 5000, 'Industrial', true], 'SHP + DBF: polígono con atributos');
  t.eq(await ev(async () => { const lines = []; const c = { print: (s) => lines.push(s) }; webcad.settings.dwgConverter = null; await webcad.cmd.commands.DWGOUT.fn(c); return /external converter/.test(lines[0]); }), true, 'DWGOUT sin servicio: explica cómo configurarlo');

  // ---- F: colaboración (mensajes entre dos copias del dibujo)
  const co = await ev(async () => {
    const m = await import('./js/cmd/v8f.js'), { Doc } = await import('./js/core/document.js');
    const a = webcad.doc; a.model.length = 0;
    const b = new Doc(); b.load(JSON.parse(a.serialize()));
    a.begin('LINE'); const l = a.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 5, y: 0 } }); a.end();
    m.applyMsgs(b, m.txToMsgs(a, a.undoStack.at(-1).ops));
    a.begin('MOVE'); a.mod(l, (x) => { x.p2 = { x: 9, y: 0 }; }); a.end();
    m.applyMsgs(b, m.txToMsgs(a, a.undoStack.at(-1).ops));
    const r1 = [b.model.length, b.model[0].p2.x];
    a.begin('ERASE'); a.remove(l); a.end(); m.applyMsgs(b, m.txToMsgs(a, a.undoStack.at(-1).ops));
    return [...r1, b.model.length];
  });
  t.eq(co, [1, 9, 0], 'COLLAB: alta, modificación y borrado se replican');
  const lk = await ev(async () => {
    const d = webcad.doc; d.model.length = 0; d.ensureLayer('MUROS');
    const e = d.add({ type: 'LINE', layer: 'MUROS', p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } });
    d.ext.layerLocks = { MUROS: { id: 'otro', name: 'Ana' } }; const a = d.isLocked(e);
    d.ext.layerLocks = { MUROS: { id: webcad.settings.collabId, name: 'Yo' } }; const b = d.isLocked(e);
    d.ext.layerLocks = {}; return [a, b];
  });
  t.eq(lk, [true, false], 'LAYERCLAIM: capa reservada por otro usuario queda bloqueada');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.markups = []; d.add({ type: 'CIRCLE', c: { x: 10, y: 10 }, r: 5 }); webcad.view.setCur({ cx: 10, cy: 10, s: 8 }); });
  await type('_COMMENT'); await clickW(15, 10);
  await page.waitForSelector('.dlg input.fld'); await page.fill('.dlg input.fld', 'Revisar radio'); await page.keyboard.press('Enter');
  const cm = await ev(() => { const d = webcad.doc, c = d.model[0]; d.begin('MOVE'); d.mod(c, (x) => { x.c = { x: 40, y: 10 }; }); d.end(); const m = d.markups[0]; const p = webcad.commentPos(m); return [m.text, m.h === c.hid, Math.round(p.x), Math.round(p.y)]; });
  t.eq(cm, ['Revisar radio', true, 45, 10], 'COMMENT anclado: la chincheta sigue al objeto');

  // ---- G: WebGL, ayuda F1, modo tableta
  const gs = await ev(async () => {
    const m = await import('./js/view/glfast.js'), d = webcad.doc; d.model.length = 0;
    d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } }); d.add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 1 }); d.add({ type: 'TEXT', p: { x: 0, y: 0 }, h: 1, text: 'A' });
    const r = m.buildSegments(d.model, d, webcad.view.baseStyle(webcad.view.cur));
    return [r.n > 60, r.rest.length, r.rest[0].type, m.cssRGB('#ff0000').join(',')];
  });
  t.eq(gs, [true, 1, 'TEXT', '1,0,0'], 'WebGL: segmentos para curvas, el texto queda en 2D');
  const glOn = await ev(async () => { const d = webcad.doc; d.model.length = 0; for (let i = 0; i < 300; i++) d.add({ type: 'LINE', p1: { x: i, y: 0 }, p2: { x: i, y: 50 } }); d.setvar('WEBGLMODE', 2); webcad.view.redraw(); await new Promise((r) => setTimeout(r, 120)); const s = { ...webcad.glStats }; d.setvar('WEBGLMODE', 1); webcad.view.redraw(); return s; });
  t.ok(glOn.active === true && glOn.segs === 300, `WEBGLMODE=2 fuerza la GPU (${JSON.stringify(glOn)})`);
  const hc = await ev(() => { const c = webcad.help.card('L'); const s = webcad.help.card('SLICE'); return [c.name, !!c.desc, c.ribbon?.[0], s.ribbon?.[0] || null]; });
  t.eq(hc.slice(0, 3), ['LINE', true, 'Inicio'], 'Ayuda F1: ficha por comando con alias y ubicación en la cinta');
  await ev(() => webcad.setTablet(true));
  t.ok(await ev(() => document.body.classList.contains('tablet') && webcad.settings.gripSize >= 12), 'TOUCHMODE: interfaz táctil');
  await ev(() => webcad.setTablet(false));
  t.eq(errs, [], 'sin errores (E/F/G)');
};
