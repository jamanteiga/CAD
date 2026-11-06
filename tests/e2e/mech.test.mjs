// Ficha Mecánica: tubería, bridas ASME B16.5 y accesorios B16.9/B16.11
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  const setSpec = (sp) => ev((sp) => { const d = webcad.doc; d.ext.mec = { std: 'ASME', nps: '4', sch: 'STD', od: 114.3, t: 6.0, cls: '150', face: 'RF', kind: 'WN', elbow: 'LR', view: 'side', mode: 'double', ccls: '3000', ...sp }; }, sp);
  const dlgOk = async () => { await page.waitForSelector('.dlg'); await page.waitForTimeout(60); const info = await ev(() => document.querySelector('.dlg .hint')?.textContent || ''); await page.keyboard.press('Enter'); await page.waitForTimeout(60); return info; };
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.setvar('OSMODE', 0); webcad.view.setCur({ cx: 0, cy: 0, s: 1 }); });

  // datos B16.5 (comprobación con valores de la norma)
  const fl = await ev(() => { const f = webcad.mec.flangeOf; const a = f('150', '6'), b = f('300', '2'), c = f('900', '3'), d = f('2500', '12'); return [a.O, a.n, a.bolt, a.Y, b.BC, b.n, c.O, c.ring, d.O, f('2500', '14')]; });
  t.eq(fl.map((v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v)), [279.4, 8, '3/4', 88.9, 127, 8, 241.3, 31, 762, null], 'Bridas B16.5: O, taladros, tornillos, Y, círculo, anillo RTJ y límites de clase');
  const pp = await ev(() => { const p = webcad.mec.pipeOf; const a = p({ std: 'ASME', nps: '8', sch: '40' }), b = p({ std: 'EN', od: 168.3, t: 7.1 }); return [Math.round(a.od * 10) / 10, Math.round(a.t * 100) / 100, b.dn, b.nps]; });
  t.eq(pp, [219.1, 8.18, 150, '6'], 'Tubo ASME B36.10 y EN 10220');

  // brida WN clase 300 NPS 4 en vista lateral
  await setSpec({ kind: 'WN', face: 'RF', cls: '300', nps: '4', sch: '40' });
  await type('_MFLANGE'); const info = await dlgOk(); await type('0,0', '');
  const ins = await ev(() => { const e = webcad.doc.model.at(-1); const b = webcad.E.entBBox(e, webcad.doc); return [e.type, e.name, e.layer, e.mec?.kind, Math.round(b.y2 - b.y1), Math.round(b.x2 - b.x1)]; });
  t.eq(ins.slice(0, 5), ['INSERT', 'MEC_BRIDA_B165_WN_RF_300_NPS4_40_L', 'MEC_BRIDAS', 'FLANGE', 254], 'MFLANGE inserta la brida WN Cl.300 NPS 4 (Ø 254)');
  t.ok(/8 × 3\/4"/.test(info) && /X 146/.test(info), `ficha de la brida: ${info.replace(/\n/g, ' | ')}`);
  t.ok(Math.abs(ins[5] - (85.9 + 12)) < 1, `longitud a través del cubo Y = 85,9 mm (${ins[5] - 12})`);

  // RTJ clase 1500, SO clase 2500 no existe
  await setSpec({ kind: 'WN', face: 'RTJ', cls: '1500', nps: '6', sch: '160' });
  await type('_MFLANGE'); const rtj = await dlgOk(); await type('600,0', '');
  t.ok(/R-46/.test(rtj), 'RTJ: anillo R-46 en Cl.1500 NPS 6');
  await setSpec({ kind: 'SO', face: 'RF', cls: '2500', nps: '4' });
  await type('_MFLANGE'); await page.waitForSelector('.dlg'); const so = await ev(() => document.querySelector('.dlg .hint')?.textContent || ''); await page.keyboard.press('Escape');
  t.ok(/SO/.test(so), `SO Cl.2500 no normalizada: ${so}`);

  // codo LR 90 NPS 4: R = 152,4
  await setSpec({ elbow: 'LR', ang: 90, nps: '4' });
  await type('_MELBOW'); const el = await dlgOk(); await type('', '0,-400', '');
  t.ok(/R 152\.4/.test(el), `codo LR NPS 4: ${el}`);
  // reducción excéntrica 6x4, te reducida, cruz, casquete y manguito
  await setSpec({ rtype: 'ECC', flat: 'BOT', nps: '6', nps2: '4' }); await type('_MREDUCER'); const rd = await dlgOk(); await type('400,-400', '');
  t.ok(/H 139\.7/.test(rd) && /excentricidad 27/.test(rd), `reducción excéntrica 6×4: ${rd}`);
  await setSpec({ red: '1', nps: '6', nps2: '3' }); await type('_MTEE'); await dlgOk(); await type('800,-400', '');
  await setSpec({ red: '0', nps: '6' }); await type('_MCROSS'); await dlgOk(); await type('1200,-400', '');
  await setSpec({ nps: '6' }); await type('_MCAP'); await dlgOk(); await type('1500,-400', '');
  await setSpec({ ctype: 'FSW', ccls: '3000', cnps: '2' }); await type('_MCOUPLING'); const cp = await dlgOk(); await type('1700,-400', '');
  t.ok(/L 51/.test(cp), `manguito SW 2" Cl.3000: ${cp}`);

  // tubería con codo automático
  await setSpec({ std: 'EN', od: 168.3, t: 7.1, elbow: 'LR', mode: 'double' });
  await type('_MPIPE'); await dlgOk(); await type('0,-1000', '1000,-1000', '1000,-2000', '');
  const bom = await ev(() => webcad.mecBom([...webcad.doc.model]));
  const pipe = bom.find((r) => r.kind === 'PIPE');
  t.ok(pipe && Math.abs(pipe.len - (2000 - 2 * 228.6)) < 0.5, `tubería: longitud recta descontando el codo (${pipe && Math.round(pipe.len)})`);
  t.ok(Math.abs(pipe.kg - 28.22 * pipe.len / 1000) < 0.2, 'peso del tubo (kg/m acero)');
  t.eq(bom.filter((r) => r.kind !== 'PIPE').length, 9, 'lista de materiales: bridas y accesorios agrupados');
  t.ok(bom.some((r) => /Codo 90° radio largo DN150/.test(r.desc)), 'codo automático EN 10253 en la lista');

  // lista de materiales en tabla
  await type('_MBOM', ''); await type('3000,0');
  t.ok(await ev(() => webcad.doc.model.some((e) => e.type === 'TABLE' && e.cells.some((r) => /Brida WN RF Cl\.300/.test(r[1])))), 'MBOM inserta la tabla');

  // ficha de cinta y traducción
  t.ok(await ev(() => !!document.querySelector('#ribbon') && webcad.help.card('MFLANGE').ribbon?.[0] === 'Mecánica'), 'ficha Mecánica en la cinta');
  t.eq(errs, [], 'sin errores');
};
