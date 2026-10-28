// Utilidades comunes de las pruebas extremo a extremo
export const ready = async (page, lang = 'es') => {
  await page.evaluate((l) => { webcad.ui.setLang(l); webcad.ui.start.hide(); webcad.doc.setvar('OSMODE', 0); webcad.view.setCur({ cx: 100, cy: 50, s: 3 }); }, lang);
};
export const typer = (page) => async (...xs) => { for (const s of xs) { await page.keyboard.type(String(s)); await page.keyboard.press('Enter'); await page.waitForTimeout(50); } };
export const model = (page) => page.evaluate(() => webcad.doc.model.map((e) => e.type));
export const prompt = (page) => page.evaluate(() => document.getElementById('cmdprompt').textContent.trim());
export const last = (page) => page.evaluate(() => JSON.parse(JSON.stringify(webcad.doc.model.at(-1) || null, (k, v) => (k.startsWith('_') ? undefined : v))));
