// Batería de pruebas de WebCAD Libre.
//   npm test            unitarias (Node) + extremo a extremo (Playwright/Chromium)
//   npm run test:unit   solo unitarias          npm run test:e2e   solo extremo a extremo
// Cada archivo *.test.mjs exporta por defecto una función async (t) [unitarias] o (page, t) [e2e].
import fs from 'fs'; import path from 'path'; import { createRequire } from 'module'; import { serve } from './serve.mjs';
const dir = path.dirname(new URL(import.meta.url).pathname);
const only = process.argv[2];
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
let pass = 0, fail = 0; const failures = [];
const mk = (name) => ({
  ok(c, msg) { if (c) pass++; else { fail++; failures.push(`${name}: ${msg}`); console.log(`  ✗ ${msg}`); } },
  eq(a, b, msg) { const ok = JSON.stringify(a) === JSON.stringify(b); this.ok(ok, `${msg} (obtenido ${JSON.stringify(a)}, esperado ${JSON.stringify(b)})`); },
  near(a, b, tol, msg) { this.ok(Math.abs(a - b) <= tol, `${msg} (obtenido ${a}, esperado ${b} ± ${tol})`); },
});
const list = (sub) => fs.readdirSync(path.join(dir, sub)).filter((f) => f.endsWith('.test.mjs') && (!filter || filter.test(f))).sort();

if (only !== 'e2e') {
  console.log('Pruebas unitarias');
  for (const f of list('unit')) {
    console.log(`• ${f}`); const t = mk(f);
    try { await (await import(path.join(dir, 'unit', f))).default(t); } catch (e) { t.ok(false, `excepción: ${e.stack || e}`); }
  }
}
if (only !== 'unit') {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch (_) { try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (__) { /* no instalado */ } }
  if (!chromium) { console.log('Playwright no está instalado (npm install); se omiten las pruebas extremo a extremo.'); }
  if (chromium) {
    console.log('Pruebas extremo a extremo');
    const srv = await serve(0); const base = `http://127.0.0.1:${srv.address().port}/`;
    const browser = await chromium.launch();
    for (const f of list('e2e')) {
      console.log(`• ${f}`); const t = mk(f);
      const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
      page.on('pageerror', (e) => t.ok(false, `error en la página: ${e.message}`));
      page.on('dialog', (d) => d.dismiss().catch(() => {}));
      try {
        await page.goto(base + 'index.html'); await page.waitForFunction(() => window.webcad?.ui?.start);
        await (await import(path.join(dir, 'e2e', f))).default(page, t);
      } catch (e) { t.ok(false, `excepción: ${e.stack || e}`); }
      await page.close();
    }
    await browser.close(); srv.close();
  }
}
console.log(`\n${pass} correctas, ${fail} fallidas`);
if (fail) { console.log(failures.map((f) => '  - ' + f).join('\n')); process.exit(1); }
