// Archivos: dibujo de ejemplo, DXF de ida y vuelta, formato nativo, PDF
import { ready } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const r = await page.evaluate(async () => {
    webcad.ui.loadSample();
    const d = webcad.doc, n = d.model.length;
    const txt = webcad.io.content('dxf'); const bytes = typeof txt === 'string' ? new TextEncoder().encode(txt) : txt;
    await webcad.io.openFile(new File([bytes], 'ida-vuelta.dxf'));
    const d2 = webcad.doc; const dyn = d2.model.find((e) => e.type === 'INSERT' && e.dyn);
    const json = d2.serialize(); const d3 = new d2.constructor(); d3.load(JSON.parse(json));
    return { n, n2: d2.model.length, dyn: !!dyn, n3: d3.model.length, name: d2.name };
  });
  t.ok(r.n > 10, `dibujo de ejemplo: ${r.n} objetos`);
  t.ok(Math.abs(r.n2 - r.n) <= 2, `DXF de ida y vuelta conserva los objetos (${r.n} → ${r.n2})`);
  t.ok(r.dyn, 'el bloque dinámico se recupera del DXF de WebCAD');
  t.eq(r.n3, r.n2, 'formato nativo (serialize/load)');
  const wait = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
  await page.evaluate(() => { webcad.cmd.run('EXPORTPDF'); });
  await page.waitForTimeout(400);
  if (await page.$('.modal .btn.pri')) await page.click('.modal .btn.pri');
  const dl = await wait;
  t.ok(dl && /\.pdf$/i.test(dl.suggestedFilename()), `PDF exportado (${dl && dl.suggestedFilename()})`);
};
