// Salida: tablas de estilos de trazado CTB (por color) y STB (con nombre, por capa), editor STYLESMANAGER
// y publicación por lotes de presentaciones en un único PDF (PUBLISH).
import { h } from '../ui/dom.js';
import { aciCss, ACI, LWEIGHTS } from '../core/tables.js';
import { t } from '../core/i18n.js';

const HEX = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
const gray = (css) => { const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css) || /#(..)(..)(..)/.exec(css); if (!m) return css; const [r, g, b] = m.slice(1, 4).map((x) => (x.length === 2 && /[a-f]/i.test(x) ? parseInt(x, 16) : +x)); const y = Math.round(0.3 * r + 0.59 * g + 0.11 * b); return `rgb(${y},${y},${y})`; };
const screen = (css, pct) => { if (pct >= 100) return css; const m = /rgb\((\d+),(\d+),(\d+)\)/.exec(css) || /#(..)(..)(..)/.exec(css); if (!m) return css; const v = m.slice(1, 4).map((x) => (x.length === 2 && /[a-f]/i.test(x) ? parseInt(x, 16) : +x)); const k = pct / 100; return `rgb(${v.map((c) => Math.round(255 - (255 - c) * k)).join(',')})`; };

export const BUILTIN_STYLES = {
  'monochrome.ctb': { type: 'ctb', all: { color: '#000000' }, colors: {} },
  'grayscale.ctb': { type: 'ctb', all: { color: 'gray' }, colors: {} },
  'acad.ctb': { type: 'ctb', all: {}, colors: {} },
  'Screening 50%.ctb': { type: 'ctb', all: { screen: 50 }, colors: {} },
  'monochrome.stb': { type: 'stb', styles: { Normal: {}, Monocromo: { color: '#000000' } }, layers: {}, def: 'Monocromo' },
};
// función de estilo para el renderizador: (aci, css, lw, capa) -> { css, lw }
export function plotStyleFn(tbl) {
  if (!tbl) return null;
  return (c, css, lw, L) => {
    let r = tbl.type === 'stb' ? { ...(tbl.styles?.[tbl.layers?.[L?.name] || tbl.def || 'Normal'] || {}) } : { ...(tbl.all || {}), ...(tbl.colors?.[c] || {}) };
    let out = css, w = lw;
    if (r.color === 'gray') out = gray(css); else if (r.color && r.color !== 'obj') out = typeof r.color === 'number' ? aciCss(r.color, false) : r.color;
    if (r.screen != null) out = screen(out, +r.screen);
    if (r.lw != null && r.lw >= 0) w = r.lw;
    return { css: out, lw: w };
  };
}

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const tables = () => ({ ...BUILTIN_STYLES, ...(app.settings.plotStyles || {}) });
  app.plotStyles = tables;
  app.plotStyleFn = (name) => plotStyleFn(tables()[name]);

  // ---- editor de tablas de estilos de trazado
  R('STYLESMANAGER', async () => {
    const all = tables();
    let name = Object.keys(app.settings.plotStyles || {})[0] || 'nuevo.ctb';
    let tbl = structuredClone(all[name] || { type: 'ctb', all: {}, colors: {} });
    const box = h('div', { style: { minWidth: 'min(640px, 88vw)' } });
    const used = [...new Set([...doc().allEntsDeep()].map((e) => (e.color === 256 || e.color == null ? doc().layers[e.layer]?.color : e.color)).filter((c) => typeof c === 'number' && c > 0 && c < 256))].sort((a, b) => a - b);
    const lwOpts = [{ v: -1, l: t('Usar grosor del objeto') }, ...LWEIGHTS.filter((w) => w >= 0).map((w) => ({ v: w, l: (w / 100).toFixed(2) + ' mm' }))];
    const colorSel = (val, onch) => { const s = h('select', { class: 'fld', onchange: () => onch(s.value) }, [['obj', 'Usar color del objeto'], ['#000000', 'Negro'], ['gray', 'Escala de grises'], ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => [String(k), `ACI ${k}`])].map(([v, l]) => h('option', { value: v, selected: String(val ?? 'obj') === v, text: t(l) }))); return s; };
    const lwSel = (val, onch) => { const s = h('select', { class: 'fld', onchange: () => onch(+s.value) }, lwOpts.map((o) => h('option', { value: o.v, selected: (val ?? -1) === o.v, text: o.l }))); return s; };
    const num = (val, onch) => h('input', { class: 'fld', type: 'number', min: 0, max: 100, value: val ?? 100, style: { width: '70px' }, onchange: (e) => onch(+e.target.value) });
    const parse = (v) => (v === 'obj' || v === 'gray' || v.startsWith('#') ? v : +v);
    const render = () => {
      const rows = [];
      if (tbl.type === 'ctb') {
        const line = (label, o, sw) => h('tr', {}, h('td', {}, sw ? h('span', { class: 'swatch', style: { background: sw } }) : '', label), h('td', {}, colorSel(o.color, (v) => (o.color = parse(v)))), h('td', {}, lwSel(o.lw, (v) => (o.lw = v))), h('td', {}, num(o.screen, (v) => (o.screen = v))));
        tbl.all ||= {}; rows.push(line(t('Todos los colores'), tbl.all));
        for (const c of [...new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, ...used])]) { tbl.colors[c] ||= {}; rows.push(line(`ACI ${c}`, tbl.colors[c], aciCss(c, true))); }
      } else {
        tbl.styles ||= { Normal: {} };
        for (const [sn, o] of Object.entries(tbl.styles)) rows.push(h('tr', {}, h('td', { text: sn }), h('td', {}, colorSel(o.color, (v) => (o.color = parse(v)))), h('td', {}, lwSel(o.lw, (v) => (o.lw = v))), h('td', {}, num(o.screen, (v) => (o.screen = v)))));
      }
      const layerMap = tbl.type === 'stb' ? h('fieldset', {}, h('legend', { text: 'Estilo por capa' }), h('div', { class: 'frm' }, Object.keys(doc().layers).flatMap((ln) => [h('label', { text: ln }), h('select', { class: 'fld', onchange: (e) => { tbl.layers ||= {}; tbl.layers[ln] = e.target.value; } }, Object.keys(tbl.styles).map((sn) => h('option', { value: sn, selected: (tbl.layers?.[ln] || tbl.def || 'Normal') === sn, text: sn })))]))) : '';
      const addStyle = tbl.type === 'stb' ? h('button', { class: 'btn', type: 'button', text: 'Añadir estilo...', onclick: async () => { const n = await app.ui.dlg.prompt('Estilo de trazado', 'Nombre:', ''); if (n) { tbl.styles[n] = {}; render(); } } }) : '';
      box.replaceChildren(
        h('div', { class: 'frm' }, h('label', { text: 'Nombre de la tabla' }), h('input', { class: 'fld', type: 'text', value: name, onchange: (e) => { name = e.target.value.trim() || name; } }),
          h('label', { text: 'Tipo' }), h('select', { class: 'fld', onchange: (e) => { tbl = e.target.value === 'stb' ? { type: 'stb', styles: { Normal: {} }, layers: {}, def: 'Normal' } : { type: 'ctb', all: {}, colors: {} }; if (!/\.(ctb|stb)$/i.test(name)) name += '.' + e.target.value; else name = name.replace(/\.(ctb|stb)$/i, '.' + e.target.value); render(); } }, [['ctb', 'CTB (dependiente del color)'], ['stb', 'STB (estilos con nombre)']].map(([v, l]) => h('option', { value: v, selected: tbl.type === v, text: t(l) }))),
          h('label', { text: 'Partir de' }), h('select', { class: 'fld', onchange: (e) => { if (!e.target.value) return; tbl = structuredClone(all[e.target.value]); render(); } }, h('option', { value: '', text: '—' }), Object.keys(all).map((n) => h('option', { value: n, text: n })))),
        h('div', { style: { overflow: 'auto', maxHeight: '45vh' } }, h('table', { class: 'kv' }, h('thead', {}, h('tr', {}, ['Estilo', 'Color', 'Grosor de línea', 'Intensidad %'].map((x) => h('th', { text: x })))), h('tbody', {}, rows))),
        addStyle, layerMap);
    };
    render();
    const ok = await app.ui.dlg.open({ title: 'Administrador de estilos de trazado', body: [box] });
    if (!ok) return;
    app.settings.plotStyles = { ...(app.settings.plotStyles || {}), [name]: tbl }; app.saveSettings();
    app.log(t('Tabla de estilos «{0}» guardada.', name));
  }, { alias: ['PLOTSTYLE', 'CTB'] });

  // ---- publicación por lotes: varias presentaciones en un PDF
  R('PUBLISH', async () => {
    const d = doc();
    const names = ['Model', ...d.layouts.map((l) => l.name)];
    const checks = names.map((n) => { const cb = h('input', { type: 'checkbox', checked: n !== 'Model' || !d.layouts.length }); return { n, cb }; });
    const style = h('select', { class: 'fld' }, h('option', { value: '', text: t('Ninguno') }), Object.keys(tables()).map((n) => h('option', { value: n, text: n })));
    const dpi = h('select', { class: 'fld' }, [150, 200, 300].map((v) => h('option', { value: v, selected: v === 200, text: String(v) })));
    const ok = await app.ui.dlg.open({ title: 'Publicar', body: [
      h('p', { class: 'hint', text: 'Cada presentación se traza en su tamaño de papel; el modelo se ajusta a A3 apaisado. Se genera un solo PDF.' }),
      h('div', {}, checks.map(({ n, cb }) => h('label', { class: 'row' }, cb, n === 'Model' ? t('Modelo') : n))),
      h('div', { class: 'frm' }, h('label', { text: 'Tabla de estilos de trazado' }), style, h('label', { text: 'Calidad (ppp)' }), dpi)] });
    if (!ok) return;
    const sel = checks.filter((x) => x.cb.checked).map((x) => x.n);
    if (!sel.length) return;
    await app.io.publishPDF(sel, { ctb: style.value, dpi: +dpi.value });
  }, { alias: ['PUBLICAR'] });
}
