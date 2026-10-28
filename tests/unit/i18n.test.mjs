// Idiomas: diccionarios completos, abreviaturas sin conflicto y traducción de mensajes.
import fs from 'fs'; import path from 'path';
import * as I from '../../js/core/i18n.js';
import { UI } from '../../js/core/ui-strings.js';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../js');

export default async (t) => {
  t.eq(Object.keys(I.LANGS), ['es', 'gl', 'pt', 'ca', 'en'], 'cinco idiomas');
  // diccionario de interfaz: cada entrada tiene gallego e inglés, y portugués y catalán existen para todas
  const bad = Object.entries(UI).filter(([, v]) => !v[0] || !v[1]).map(([k]) => k);
  t.eq(bad, [], 'entradas de interfaz sin gallego o inglés');
  for (const L of ['gl', 'pt', 'ca', 'en']) {
    I.setLang(L);
    const miss = Object.keys(UI).filter((k) => I._lookup(k) == null);
    t.eq(miss, [], `textos de interfaz sin traducir en ${L}`);
  }
  // abreviaturas de opciones: dentro de un mismo mensaje no se repiten en ningún idioma
  const prompts = new Set();
  for (const f of fs.readdirSync(path.join(root, 'cmd'))) for (const m of fs.readFileSync(path.join(root, 'cmd', f), 'utf8').matchAll(/\[([A-Za-z0-9?_ ()]+(?:\/[A-Za-z0-9?_ ()]+)+)\]/g)) prompts.add(m[1]);
  t.ok(prompts.size > 60, `mensajes con opciones encontrados: ${prompts.size}`);
  for (const L of ['es', 'gl', 'pt', 'ca']) {
    I.setLang(L); const clash = [];
    for (const p of prompts) { const keys = I.kwInfos(p.split('/').map((x) => x.trim())).map((x) => x.esKey); if (new Set(keys).size !== keys.length) clash.push(p); }
    t.eq(clash, [], `abreviaturas repetidas en ${L}`);
  }
  // mensajes de solicitud
  const P = 'Specify next point or [Close/Undo]:';
  const exp = { es: 'Precise punto siguiente o [Cerrar/desHacer]:', gl: 'Especifique o seguinte punto ou [Pechar/desFacer]:', en: P };
  for (const [L, s] of Object.entries(exp)) { I.setLang(L); t.eq(I.trPrompt(P), s, `trPrompt en ${L}`); }
  I.setLang('pt'); t.ok(/^Especifique o ponto seguinte ou \[Fechar\/D/.test(I.trPrompt(P)), 'trPrompt en pt');
  I.setLang('ca'); t.ok(/^Precisi el punt següent o \[Tancar\/Desfer\]:$/.test(I.trPrompt(P)), 'trPrompt en ca');
  // nombres de comando del idioma activo
  const cases = [['gl', 'LINA', 'LINE'], ['pt', 'LINHA', 'LINE'], ['ca', 'LINIA', 'LINE'], ['gl', 'XIRA', 'ROTATE'], ['pt', 'APARAR', 'TRIM'], ['ca', 'RETALLA', 'TRIM']];
  for (const [L, u, c] of cases) { I.setLang(L); t.eq(I.locCmd(u), c, `${u} en ${L}`); }
  I.setLang('es'); t.eq(I.locName('PLINE'), 'POL', 'nombre castellano de PLINE');
  // mensajes de salida
  I.setLang('gl'); t.eq(I.trMsg('Command: LINE'), 'Comando: LINE', 'trMsg gl');
  I.setLang('en'); t.eq(I.tKnown('Línea (LINE)'), 'Line (LINE)', 'lookup con comando entre paréntesis');
  t.eq(I.tKnown('Posición X'), 'Position X', 'lookup con eje');
  t.eq(I.tKnown('CAPA-MUROS'), 'CAPA-MUROS', 'los datos del dibujo no se traducen');
  I.setLang('es');
};
