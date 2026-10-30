// Línea de comandos en los cinco idiomas
import { ready, typer, model, prompt } from './helpers.mjs';
const cases = [
  ['es', 'LINEA', 'H', 'C', /^Precise punto siguiente/],
  ['gl', 'LIÑA', 'F', 'P', /^Especifique o seguinte punto/],
  ['pt', 'LINHA', 'DE', 'F', /^Especifique o ponto seguinte/],
  ['ca', 'LÍNIA', 'D', 'T', /^Precisi el punt següent/],
  ['en', 'LINE', 'U', 'C', /^Specify next point/],
];
export default async (page, t) => {
  for (const [lang, cmd, undo, close, re] of cases) {
    await ready(page, lang); const type = typer(page);
    await page.evaluate(() => { const d = webcad.doc; d.begin('x'); for (const e of [...d.model]) d.remove(e); d.end(); });
    await type(cmd, '0,0', '100,0');
    t.ok(re.test(await prompt(page)), `${lang}: mensaje traducido («${await prompt(page)}»)`);
    await type('50,50', undo, '100,50', close);
    t.eq((await model(page)).length, 3, `${lang}: ${cmd} con deshacer (${undo}) y cerrar (${close})`);
    await type('_LINE', '0,200', '10,200', '_U', '');
    t.eq((await model(page)).length, 3, `${lang}: prefijo _ en comando y opción`);
    const ribbon = await page.evaluate(() => document.querySelector('#rtabs .rt').textContent);
    t.eq(ribbon, { es: 'Inicio', gl: 'Inicio', pt: 'Início', ca: 'Inici', en: 'Home' }[lang], `${lang}: cinta traducida`);
  }
  await ready(page, 'es'); const type = typer(page);
  await type('POL'); t.eq(await page.evaluate(() => webcad.cmd.active), 'PLINE', 'POL = POLILINEA en castellano'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await type('_POL'); t.eq(await page.evaluate(() => webcad.cmd.active), 'POLYGON', '_POL = POLYGON'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
};
