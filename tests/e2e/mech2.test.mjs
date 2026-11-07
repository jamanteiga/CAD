// Ficha Mecánica (2 y 3): válvulas, uniones bridadas, forjados, olets, soportes, equipos, 3D e isométrica
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  const base = { std: 'ASME', nps: '4', sch: 'STD', od: 114.3, t: 6.0, cls: '150', face: 'RF', kind: 'WN', elbow: 'LR', view: 'side', mode: 'double', ccls: '3000' };
  const setSpec = (sp) => ev(([b, sp]) => { webcad.doc.ext.mec = { ...b, ...sp }; }, [base, sp]);
  const dlgOk = async () => { await page.waitForSelector('.dlg'); await page.waitForTimeout(60); const i = await ev(() => document.querySelector('.dlg .hint')?.textContent || ''); await page.keyboard.press('Enter'); await page.waitForTimeout(60); return i; };
  const clickW = async (x, y) => page.mouse.click(...(await ev(([x, y]) => { const s = webcad.view.toScreen({ x, y }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; }, [x, y])));
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.setvar('OSMODE', 0); webcad.view.setCur({ cx: 0, cy: 0, s: 0.6 }); });

  // datos de válvulas (ASME B16.10) y espárragos
  const vl = await ev(async () => { const m = await import('./js/cmd/mech2.js'); return [m.valveLen('gate', '150', '6', 'RF').L, m.valveLen('globe', '300', '4', 'RF').L, m.valveLen('ball', '600', '2', 'RF').L, m.valveLen('gate', '900', '3', 'RF').L, m.valveLen('gate', '150', '6', 'BW').L, m.valveLen('bfly', '150', '8', 'RF').L, m.valveLen('gate', '2500', '14', 'RF')]; });
  t.eq(vl, [267, 356, 292, 381, 403, 60, null], 'Cara a cara B16.10: compuerta, globo, bola, Class 900 3", BW y mariposa');
  const st = await ev(async () => { const m = await import('./js/cmd/mech2.js'); const fl = webcad.mec.flangeOf('150', '8'); const a = m.studLength(fl, 'RF', 4.5), b = m.studLength(fl, 'RF', 4.5, { asm: 'BOLT' }), c = m.studLength(fl, 'RF', 4.5, { sys: 'M' }); return [a.txt, Math.round(a.raw * 10) / 10, b.txt, c.f.thread, c.txt, Math.round(c.raw * 10) / 10]; });
  // espárrago 3/4"-10 UNC: 2·26,9 + 4,5 + 2·(arandela 4,0 + tuerca 19,05 + 2 hilos 5,08) = 114,5 → 4-3/4"; tornillo: 58,3 + 4,0 + 19,05 + 5,08 = 86,4 → 3-1/2"
  // métrica M20: 58,3 + 2·(3 + 18 + 10) = 120,3 → 125 mm
  t.eq(st, ['4-3/4" (121 mm)', 114.5, '3-1/2" (89 mm)', 'M20×2.5', '125 mm', 120.3], 'Longitud: apriete + arandelas + tuercas + saliente (2 hilos UNC / 10 mm métrica)');

  // válvula de compuerta en alzado conectada a una brida
  await setSpec({ fstd: 'B16.5', kind: 'WN', cls: '300', nps: '4', sch: '40' });
  await type('_MFLANGE'); await dlgOk(); await type('0,0', '');
  await setSpec({ vtype: 'gate', vview: 'side', ends: 'RF', cls: '300', act: 'hand', nps: '4' });
  await type('_MVALVE'); const vi = await dlgOk(); await clickW(0, 0); await page.waitForTimeout(100);
  const vv = await ev(() => { const e = webcad.doc.model.at(-1); return [e.mec.kind, Math.round(e.p.x), Math.round(e.p.y), ((Math.round(e.rot * 180 / Math.PI) % 360) + 360) % 360]; });
  t.eq(vv, ['VALVE', 0, 0, 180], 'MVALVE se conecta automáticamente a la cara de la brida');
  t.ok(/L 305/.test(vi), `compuerta Cl.300 NPS 4: ${vi}`);

  // unión bridada: junta + brida opuesta + espárragos
  await ev(() => { webcad.doc.model.length = 0; });
  await setSpec({ fstd: 'B16.5', kind: 'WN', cls: '300', nps: '6', sch: '40' });
  await type('_MFLANGE'); await dlgOk(); await type('0,0', '');
  await setSpec({ gk: 'SW', mate: '1', studs: '1' });
  await type('_MGASKET'); await clickW(15, 158.75); await dlgOk();
  const bom = await ev(() => webcad.mecBom([...webcad.doc.model]).map((r) => [r.kind, r.n]));
  t.eq(bom, [['FLANGE', 2], ['GASKET', 1], ['BOLT', 12], ['NUT', 24], ['WASHER', 24]], 'MGASKET: brida opuesta, junta, 12 espárragos, 24 tuercas y 24 arandelas');

  // forjados, olets
  await ev(() => { webcad.doc.model.length = 0; });
  await setSpec({ ftype: 'E90', fend: 'SW', fcls: '3000', fnps: '1' }); await type('_MFORGED'); const fi = await dlgOk(); await type('0,0', '');
  t.ok(/centro a cara 35/.test(fi), `codo SW 1" Cl.3000: A + J = 22 + 13 (${fi})`);
  await setSpec({ otype: 'WOL', nps: '8', sch: '40', onps: '2' }); await type('_MOLET'); const oi = await dlgOk(); await type('500,0', '');
  t.ok(/A 38\.1/.test(oi), `weldolet 2": A = 38,1 (${oi})`);

  // tubería, soportes por separación e instrumentos
  await ev(() => { webcad.doc.model.length = 0; });
  await setSpec({ std: 'ASME', nps: '2', sch: '40', mode: 'double' }); await type('_MPIPE'); await dlgOk(); await type('0,0', '12000,0', '');
  await type('_MSPAN', 'C', '-100,100', '12100,-100', ''); await setSpec({ fluid: 'water', stype: 'SHOE', sh: 150 }); await dlgOk();
  const sup = await ev(() => webcad.doc.model.filter((e) => e.mec?.kind === 'SUPPORT').length);
  t.eq(sup, 5, 'MSPAN: NPS 2 con agua cada 3,0 m en 12 m → 5 soportes');

  // recipiente y bomba
  await setSpec({ orient: 'V', da: 1000, vs: 8, vl: 2000, head: 'DIN28011', sup: 'LEGS', ntop: '3', nbot: '2', nside: '0' }); await type('_MVESSEL'); const ri = await dlgOk(); await type('5000,3000');
  t.ok(/R 1000 · r 100/.test(ri), `fondo DIN 28011: R = Da, r = 0,1·Da (${ri})`);
  await setSpec({ snps: '4', dnps: '3', cls: '150', kw: 15 }); await type('_MPUMP'); await dlgOk(); await type('9000,3000', '');
  t.ok(await ev(() => webcad.doc.model.filter((e) => e.mec?.kind === 'EQUIPMENT').length === 2), 'MVESSEL y MPUMP insertados');

  // tubería 3D, spools e isométrica
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.ext.mecLines = []; });
  await setSpec({ std: 'ASME', nps: '4', sch: '40', elbow: 'LR', fends: '0' });
  await type('_MPIPE3D'); await dlgOk(); await type('L-100', '0,0', '0', '5000,0', '', 'Up', '3000', '5000,7000', '', '');
  const ln = await ev(() => { const l = webcad.doc.ext.mecLines[0]; const sp = webcad.mecSpools(l, 6000); const cl = webcad.mecCutList(l, sp); return [l.tag, l.pts.length, sp.geo.bends.length, Math.round(cl.reduce((a, x) => a + x.len, 0)), sp.n, webcad.doc.model.filter((e) => e.type === '3DSOLID').length]; });
  t.eq(ln, ['L-100', 4, 2, Math.round(15000 - 4 * 152.4), 3, 5], 'MPIPE3D: 3 tramos, 2 codos; lista de corte = 15 m menos los codos; 3 spools de 6 m');
  await setSpec({ maxl: 6, isc: 'auto' }); await type('_MISO'); await dlgOk(); await type('20000,0');
  t.ok(await ev(() => webcad.doc.model.filter((e) => e.layer === 'MEC_ISO').length > 30 && webcad.doc.model.some((e) => e.type === 'TABLE' && e.cells.some((r) => r[0] === 'Pieza'))), 'MISO: isométrica con lista de corte');
  t.eq(errs, [], 'sin errores');
};
