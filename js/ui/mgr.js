// Administrador genérico de estilos/estados con lista a la izquierda y botones (Definir actual, Nuevo, Modificar, Suprimir…)
import { h } from './dom.js';
import { t } from '../core/i18n.js';

export function listManager(app, o) {
  let selName = o.cur?.() ?? o.names()[0];
  const list = h('select', { size: 12, class: 'fld', style: { width: '220px', height: '260px' } });
  const info = h('div', { class: 'hint', style: { whiteSpace: 'pre-wrap', width: '300px', minHeight: '200px', fontFamily: 'Consolas, monospace', fontSize: '12px' } });
  const curLbl = h('div', { class: 'hint' });
  const fill = () => {
    const names = o.names(); if (!names.includes(selName)) selName = o.cur?.() ?? names[0];
    list.replaceChildren(...names.map((n) => h('option', { value: n, selected: n === selName, text: n + (o.cur && n === o.cur() ? '  ◀' : '') })));
    info.textContent = selName != null && o.info ? o.info(selName) : '';
    if (o.cur) curLbl.textContent = `${t('Actual')}: ${o.cur()}`;
  };
  list.onchange = () => { selName = list.value; fill(); };
  const act = (fn) => async () => { const r = await fn(selName); if (typeof r === 'string') selName = r; fill(); app.view?.redraw?.(); app.ui?.refresh?.(); };
  const btns = (o.buttons || []).map((b) => h('button', { class: 'btn', type: 'button', style: { display: 'block', width: '100%', marginBottom: '4px' }, text: b.t, onclick: act(b.fn) }));
  list.ondblclick = () => o.buttons?.find((b) => b.dbl)?.fn && act(o.buttons.find((b) => b.dbl).fn)();
  fill();
  return app.ui.dlg.open({
    title: o.title, width: 'auto',
    body: h('div', {}, curLbl, h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, list, info, h('div', { style: { width: '150px' } }, btns))),
    buttons: [{ t: 'Cerrar', v: true, pri: true }],
  });
}
