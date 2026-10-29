// Interfaz: temas, idiomas, pestañas de la cinta, diálogos y paletas sin errores
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page); const type = typer(page);
  for (const th of ['dark', 'mid', 'light']) {
    await page.evaluate((x) => webcad.ui.setTheme(x), th);
    t.eq(await page.evaluate(() => document.documentElement.dataset.ui), th, `tema ${th}`);
  }
  const n = await page.$$eval('#rtabs .rt', (x) => x.length);
  t.ok(n >= 10, `pestañas de la cinta: ${n}`);
  for (let i = 1; i <= n; i++) await page.click(`#rtabs .rt:nth-child(${i})`);
  for (const lang of ['gl', 'pt', 'ca', 'en', 'es']) {
    await page.evaluate((l) => webcad.ui.setLang(l), lang);
    t.eq(await page.evaluate(() => document.documentElement.lang), lang, `idioma ${lang}`);
  }
  for (const c of ['OPTIONS', 'HELP', 'UNITS', 'DSETTINGS', 'STYLESMANAGER', 'DWGPROPS', 'BIBLIOTECA', 'PUBLISH', 'CLOUD']) {
    await type(c); await page.waitForTimeout(150);
    const open = await page.evaluate(() => !!document.querySelector('.modal, .palette:not([hidden])'));
    t.ok(open, `${c} abre su ventana`);
    await page.evaluate(() => document.querySelectorAll('.modal .dlg-h .tbtn').forEach((b) => b.click()));
    await page.keyboard.press('Escape');
  }
  await type('LAYER', 'PROPERTIES');
  t.ok(await page.evaluate(() => !!document.querySelector('#layerpal') && !!document.querySelector('#propspal')), 'paletas de capas y propiedades');

  // sin referencias a AutoCAD y con los comandos en castellano en pantalla
  await page.evaluate(() => { webcad.ui.setLang('es'); webcad.settings.menuBar = true; webcad.settings.screenMenu = true; webcad.ui.applyLayout(); });
  const vis = await page.evaluate(async () => {
    const out = [];
    const grab = () => { out.push(document.body.innerText); document.querySelectorAll('[title],[aria-label],option').forEach((e) => out.push(e.getAttribute('title') || '', e.getAttribute('aria-label') || '', e.textContent)); };
    for (const tab of [...document.querySelectorAll('.rt')]) { tab.click(); await new Promise((r) => setTimeout(r, 30)); grab(); }
    return out.join('\n');
  });
  t.ok(!/autocad|autodesk|\bR12\b/i.test(vis), 'ninguna referencia visual a AutoCAD');
  t.ok(!/\((PLINE|CIRCLE|MTEXT|DIMLINEAR|LAYER|INSERT|MATCHPROP|EATTEDIT|BLOCK|PROPERTIES|PLOT|DUCT)\)/.test(vis) && /\(POL\)/.test(vis), 'la cinta muestra los comandos en castellano');
  await page.click('#cmdin'); await type('_circle', '500,500', '2');
  t.ok(await page.evaluate(() => /Comando: CIRCULO/.test(document.getElementById('cmdhist').textContent)), 'un comando escrito en inglés se muestra en castellano');
  await page.evaluate(() => { webcad.settings.menuBar = false; webcad.settings.screenMenu = false; webcad.ui.applyLayout(); });
};
