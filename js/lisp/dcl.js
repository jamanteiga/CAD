// Cuadros de diálogo DCL para AutoLISP: load_dialog, new_dialog, start_dialog, done_dialog, action_tile,
// set_tile, get_tile, mode_tile, get_attr, start_list/add_list/end_list, client_data_tile, term_dialog,
// start_image/fill_image/vector_image/end_image, dimx_tile/dimy_tile.
import { T, Real, LispError, show } from './lisp.js';
import { aciCss } from '../core/tables.js';

// ---------- análisis del lenguaje DCL
function tokenize(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (src.startsWith('//', i)) { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (src.startsWith('/*', i)) { const j = src.indexOf('*/', i + 2); i = j < 0 ? src.length : j + 2; continue; }
    if (ch === '"') { let s = ''; i++; while (i < src.length && src[i] !== '"') { if (src[i] === '\\' && i + 1 < src.length) { const n = src[++i]; s += n === 'n' ? '\n' : n === 't' ? '\t' : n; } else s += src[i]; i++; } i++; out.push({ t: 'str', v: s }); continue; }
    if ('{}:;='.includes(ch)) { out.push({ t: ch }); i++; continue; }
    let j = i; while (j < src.length && !/[\s{}:;="]/.test(src[j])) j++;
    out.push({ t: 'id', v: src.slice(i, j) }); i = j;
  }
  return out;
}
export function parseDCL(src) {
  const tk = tokenize(src); let k = 0;
  const peek = (o = 0) => tk[k + o]; const next = () => tk[k++];
  const defs = {};
  const parseBody = () => { // tras '{'
    const attrs = {}, children = [];
    while (k < tk.length && peek().t !== '}') {
      const a = peek();
      if (a.t === ':') { next(); const type = next().v; next(); /* { */ const b = parseBody(); children.push({ type, ...b }); continue; }
      if (a.t === 'id' && peek(1)?.t === '=') { next(); next(); const v = next(); attrs[a.v.toLowerCase()] = v.v; if (peek()?.t === ';') next(); continue; }
      if (a.t === 'id' && peek(1)?.t === ';') { next(); next(); children.push({ type: a.v, attrs: {}, children: [], ref: true }); continue; }
      if (a.t === 'id' && peek(1)?.t === ':') { // nombre : tipo { } dentro de un diálogo
        const name = next().v; next(); const type = next().v; next(); const b = parseBody(); children.push({ type, name, ...b }); continue;
      }
      next();
    }
    next(); // }
    return { attrs, children };
  };
  while (k < tk.length) {
    const a = next();
    if (a.t === 'id' && a.v.startsWith('@')) { next(); continue; } // @include "archivo"
    if (a.t === 'id' && peek()?.t === ':') { next(); const type = next().v; if (peek()?.t === '{') { next(); const b = parseBody(); defs[a.v.toLowerCase()] = { name: a.v, type, ...b }; } continue; }
  }
  return defs;
}

const truthyAttr = (v) => v === true || v === 'true' || v === '1';
export function installDcl(lisp) {
  const def = (n, f) => { const g = function (args) { return f.call(this, args, this); }; g.lname = n; lisp.g.set(n.toUpperCase(), g); };
  const S = (x) => { if (typeof x !== 'string') throw new LispError(`bad argument type: stringp ${show(x)}`); return x; };
  const N = (x) => (typeof x === 'number' ? x : x instanceof Real ? x.v : +x);
  const files = new Map(); let nextId = 1;
  let cur = null; // diálogo en preparación o abierto
  const stack = [];
  const app = lisp.app;

  def('load_dialog', async function (a) {
    const name = S(a[0]).replace(/\\/g, '/').split('/').pop().toLowerCase();
    let text = this.fs.get(name) ?? this.fs.get(name + '.dcl') ?? this.fs.get(name.replace(/\.dcl$/, '') + '.dcl');
    if (text == null) {
      app.log(`Seleccione el archivo ${name.endsWith('.dcl') ? name : name + '.dcl'}`);
      const f = await app.io.pickFile('.dcl'); if (!f) return -1;
      text = await f.text(); this.addFile(f.name, text);
    }
    const id = nextId++; files.set(id, parseDCL(text)); return id;
  });
  def('unload_dialog', (a) => { files.delete(N(a[0])); return null; });
  def('new_dialog', function (a) {
    const defs = files.get(N(a[1])); const d = defs?.[S(a[0]).toLowerCase()];
    if (!d) return null;
    cur = { def: d, defs, values: {}, actions: {}, attrs: {}, lists: {}, data: {}, modes: {}, images: {}, defaultAction: a[2] ? S(a[2]) : null, status: 0 };
    collect(cur, d);
    return T;
  });
  // valores iniciales y atributos por clave
  function collect(dl, node, inherited = {}) {
    let n = node;
    if (node.ref || dl.defs[String(node.type).toLowerCase()]) { // prototipo definido en el archivo
      const proto = dl.defs[String(node.type).toLowerCase()];
      if (proto) n = { ...proto, attrs: { ...proto.attrs, ...node.attrs }, children: [...proto.children, ...(node.children || [])], type: proto.type };
    }
    node._r = n;
    const at = n.attrs || {};
    if (at.key) { dl.attrs[at.key] = { ...at, type: n.type }; if (at.value != null) dl.values[at.key] = at.value; if (at.action) dl.actions[at.key] = at.action; if (at.list) dl.lists[at.key] = String(at.list).split('\n'); }
    for (const c of n.children || []) collect(dl, c, inherited);
  }
  def('set_tile', (a) => { if (!cur) return null; const k = S(a[0]), v = S(a[1]); cur.values[k] = v; cur.el?.(k)?.setValue(v); return v; });
  def('get_tile', (a) => { if (!cur) return null; const k = S(a[0]); return cur.get?.(k) ?? cur.values[k] ?? ''; });
  def('get_attr', (a) => { if (!cur) return null; const at = cur.attrs[S(a[0])]; const v = at?.[S(a[1]).toLowerCase()]; return v == null ? '' : String(v); });
  def('action_tile', (a) => { if (!cur) return null; cur.actions[S(a[0])] = S(a[1]); return T; });
  def('mode_tile', (a) => { if (!cur) return null; const k = S(a[0]), m = N(a[1]); cur.modes[k] = m; cur.el?.(k)?.mode(m); return null; });
  def('client_data_tile', (a) => { if (!cur) return null; cur.data[S(a[0])] = S(a[1]); return null; });
  let listKey = null, listOp = 3, listIdx = 0, listBuf = [];
  def('start_list', (a) => { listKey = S(a[0]); listOp = a[1] != null ? N(a[1]) : 3; listIdx = a[2] != null ? N(a[2]) : 0; listBuf = []; return listKey; });
  def('add_list', (a) => { listBuf.push(S(a[0])); return a[0]; });
  def('end_list', () => {
    if (!cur || !listKey) return null;
    const old = cur.lists[listKey] || [];
    cur.lists[listKey] = listOp === 1 ? old.map((v, i) => (i === listIdx ? listBuf[0] ?? v : v)) : listOp === 2 ? [...old, ...listBuf] : listBuf;
    cur.el?.(listKey)?.setList(cur.lists[listKey]);
    listKey = null; return null;
  });
  // imágenes
  let img = null;
  def('dimx_tile', (a) => N(cur?.attrs[S(a[0])]?.width || 10) * 8);
  def('dimy_tile', (a) => N(cur?.attrs[S(a[0])]?.height || 3) * 16);
  def('start_image', (a) => { img = S(a[0]); if (cur) cur.images[img] = []; return img; });
  def('fill_image', (a) => { if (cur && img) cur.images[img].push({ k: 'f', x: N(a[0]), y: N(a[1]), w: N(a[2]), h: N(a[3]), c: N(a[4]) }); return a[4]; });
  def('vector_image', (a) => { if (cur && img) cur.images[img].push({ k: 'v', x1: N(a[0]), y1: N(a[1]), x2: N(a[2]), y2: N(a[3]), c: N(a[4]) }); return a[4]; });
  def('end_image', () => { if (cur && img) cur.el?.(img)?.paint(cur.images[img]); img = null; return null; });
  def('done_dialog', (a) => { if (cur) { cur.status = a[0] != null ? N(a[0]) : 1; cur.close?.(); } return [new Real(0), new Real(0)]; });
  def('term_dialog', () => { for (const d of [...stack]) { d.status = 0; d.close?.(); } return null; });
  def('start_dialog', async function () {
    if (!cur) return -1;
    const dl = cur; stack.push(dl);
    try { return await show_(this, dl); } finally { stack.pop(); cur = stack[stack.length - 1] || null; }
  });

  // ---------- presentación HTML
  async function show_(L, dl) {
    const { h } = await import('../ui/dom.js');
    const els = {};
    dl.el = (k) => els[k];
    dl.get = (k) => els[k]?.getValue?.();
    const run = async (key, reason = 1) => {
      const expr = dl.actions[key] ?? (dl.defaultAction && key !== 'accept' && key !== 'cancel' ? dl.defaultAction : null);
      const at = dl.attrs[key] || {};
      if (expr) {
        const saved = ['$KEY', '$VALUE', '$REASON', '$DATA'].map((n) => L.g.get(n));
        L.g.set('$KEY', key); L.g.set('$VALUE', dl.get(key) ?? ''); L.g.set('$REASON', reason); L.g.set('$DATA', dl.data[key] ?? null);
        try { await L.evalString(expr); } catch (e) { app.log('; error: ' + (e.message || e)); }
        finally { ['$KEY', '$VALUE', '$REASON', '$DATA'].forEach((n, i) => (saved[i] === undefined ? L.g.delete(n) : L.g.set(n, saved[i]))); }
      } else if (key === 'accept' || truthyAttr(at.is_default)) { dl.status = 1; dl.close(); }
      else if (key === 'cancel' || truthyAttr(at.is_cancel)) { dl.status = 0; dl.close(); }
    };
    const label = (at) => (at.label ?? '').replace(/&(.)/g, '$1');
    const build = (node) => {
      const n = node._r || node, at = n.attrs || {}, type = String(n.type).toLowerCase();
      const kids = () => (n.children || []).map(build);
      const box = (dir, boxed, radio) => {
        const el = h(boxed ? 'fieldset' : 'div', { class: 'dcl-' + dir, style: { display: 'flex', flexDirection: dir === 'row' ? 'row' : 'column', gap: '6px', alignItems: dir === 'row' ? 'center' : 'stretch', margin: 0 } }, boxed && label(at) ? h('legend', { text: label(at) }) : '', kids());
        if (radio && at.key) { els[at.key] = { getValue: () => el.querySelector('input[type=radio]:checked')?.dataset.key ?? '', setValue: (v) => { const r = el.querySelector(`input[data-key="${v}"]`); if (r) r.checked = true; }, mode: (m) => el.querySelectorAll('input').forEach((x) => (x.disabled = m === 1)) }; }
        return el;
      };
      const reg = (key, o) => { if (key) els[key] = o; };
      switch (type) {
        case 'dialog': return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, kids());
        case 'row': case 'concatenation': return box('row', false);
        case 'column': case 'paragraph': return box('column', false);
        case 'boxed_row': return box('row', true);
        case 'boxed_column': return box('column', true);
        case 'radio_row': return box('row', false, true);
        case 'radio_column': return box('column', false, true);
        case 'boxed_radio_row': return box('row', true, true);
        case 'boxed_radio_column': return box('column', true, true);
        case 'spacer': case 'spacer_0': case 'spacer_1': return h('div', { style: { minWidth: '6px', minHeight: '6px' } });
        case 'text': case 'text_part': case 'errtile': {
          const el = h('div', { class: type === 'errtile' ? 'hint' : '', text: dl.values[at.key] ?? at.value ?? label(at) });
          reg(at.key || (type === 'errtile' ? 'error' : null), { getValue: () => el.textContent, setValue: (v) => (el.textContent = v), mode: () => {} });
          return el;
        }
        case 'button': {
          const el = h('button', { class: 'btn' + (truthyAttr(at.is_default) ? ' pri' : ''), type: 'button', text: label(at), onclick: () => run(at.key) });
          reg(at.key, { getValue: () => '', setValue: (v) => (el.textContent = v), mode: (m) => { el.disabled = m === 1; if (m === 2) el.focus(); } });
          return el;
        }
        case 'ok_only': case 'ok_cancel': case 'ok_cancel_help': case 'ok_cancel_help_info': case 'ok_cancel_help_errtile': {
          const btns = [['accept', 'Aceptar', true]];
          if (type !== 'ok_only') btns.push(['cancel', 'Cancelar']);
          if (type.includes('help')) btns.push(['help', 'Ayuda']);
          const row = h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '6px' } }, btns.map(([k, l, d]) => { const b = h('button', { class: 'btn' + (d ? ' pri' : ''), type: 'button', text: l, onclick: () => run(k) }); reg(k, { getValue: () => '', setValue: (v) => (b.textContent = v), mode: (m) => { b.disabled = m === 1; } }); return b; }));
          return type.endsWith('errtile') ? h('div', {}, row, build({ type: 'errtile', attrs: { key: 'error' } })) : row;
        }
        case 'edit_box': {
          const inp = h('input', { type: 'text', class: 'fld', value: dl.values[at.key] ?? at.value ?? '', style: { width: at.edit_width ? `${N(at.edit_width) * 0.8}em` : '12em' }, onchange: () => run(at.key, 2), onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); run(at.key, 1); } } });
          reg(at.key, { getValue: () => inp.value, setValue: (v) => (inp.value = v), mode: (m) => { inp.disabled = m === 1; if (m === 2) inp.focus(); if (m === 3) inp.select(); } });
          return h('label', { class: 'row', style: { justifyContent: 'space-between', gap: '8px' } }, label(at), inp);
        }
        case 'toggle': {
          const inp = h('input', { type: 'checkbox', checked: (dl.values[at.key] ?? at.value) === '1', onchange: () => run(at.key) });
          reg(at.key, { getValue: () => (inp.checked ? '1' : '0'), setValue: (v) => (inp.checked = v === '1'), mode: (m) => { inp.disabled = m === 1; } });
          return h('label', { class: 'row' }, inp, label(at));
        }
        case 'radio_button': {
          const inp = h('input', { type: 'radio', name: 'dcl-' + (node._grp || 'g'), checked: (dl.values[at.key] ?? at.value) === '1', onchange: () => run(at.key) });
          inp.dataset.key = at.key || '';
          reg(at.key, { getValue: () => (inp.checked ? '1' : '0'), setValue: (v) => (inp.checked = v === '1'), mode: (m) => { inp.disabled = m === 1; } });
          return h('label', { class: 'row' }, inp, label(at));
        }
        case 'popup_list': case 'list_box': {
          const multi = truthyAttr(at.multiple_select);
          const sel = h('select', { class: 'fld', multiple: type === 'list_box' && multi, size: type === 'list_box' ? Math.max(3, N(at.height || 6)) : undefined, onchange: () => run(at.key), ondblclick: () => run(at.key, 4) });
          const fill = (items) => { sel.replaceChildren(...items.map((t, i) => h('option', { value: String(i), text: t }))); };
          fill(dl.lists[at.key] || []);
          const v0 = dl.values[at.key] ?? at.value; if (v0 != null) sel.value = String(v0).split(' ')[0];
          reg(at.key, { getValue: () => (multi ? [...sel.selectedOptions].map((o) => o.value).join(' ') : sel.value), setValue: (v) => { const parts = String(v).split(' '); [...sel.options].forEach((o) => (o.selected = parts.includes(o.value))); }, setList: fill, mode: (m) => { sel.disabled = m === 1; } });
          return h('label', { style: { display: 'flex', flexDirection: type === 'list_box' ? 'column' : 'row', gap: '6px', justifyContent: 'space-between' } }, label(at), sel);
        }
        case 'slider': {
          const inp = h('input', { type: 'range', min: at.min_value ?? 0, max: at.max_value ?? 10000, value: dl.values[at.key] ?? at.value ?? 0, oninput: () => run(at.key, 3), onchange: () => run(at.key, 1) });
          reg(at.key, { getValue: () => inp.value, setValue: (v) => (inp.value = v), mode: (m) => { inp.disabled = m === 1; } });
          return h('label', { class: 'row' }, label(at), inp);
        }
        case 'image': case 'image_button': {
          const w = N(at.width || 10) * 8, hh = N(at.height || 3) * 16;
          const cv = h('canvas', { width: w, height: hh, style: { width: w + 'px', height: hh + 'px', background: '#000', cursor: type === 'image_button' ? 'pointer' : 'default' } });
          if (type === 'image_button') cv.onclick = () => run(at.key);
          const paint = (ops) => { const c = cv.getContext('2d'); for (const o of ops) { const col = o.c === -2 ? '#000' : o.c === -15 ? '#888' : aciCss(o.c); if (o.k === 'f') { c.fillStyle = col; c.fillRect(o.x, o.y, o.w, o.h); } else { c.strokeStyle = col; c.beginPath(); c.moveTo(o.x1 + 0.5, o.y1 + 0.5); c.lineTo(o.x2 + 0.5, o.y2 + 0.5); c.stroke(); } } };
          reg(at.key, { getValue: () => '', setValue: () => {}, mode: () => {}, paint });
          return cv;
        }
        default: // tipo desconocido: se muestran sus hijos
          return h('div', {}, label(at) ? h('div', { text: label(at) }) : '', kids());
      }
    };
    // grupos de radio: los botones de un mismo grupo comparten nombre
    let g = 0; const mark = (node, grp) => { const n = node._r || node; const t = String(n.type).toLowerCase(); const ng = t.includes('radio_') ? 'r' + (++g) : grp; node._grp = grp; for (const c of n.children || []) mark(c, ng); };
    mark(dl.def, null);
    const body = build(dl.def);
    return new Promise((resolve) => {
      let closeFn;
      dl.close = () => closeFn?.();
      app.ui.dlg.open({ title: label(dl.def.attrs || {}) || 'AutoLISP', body: [body], buttons: [], init: (box, close) => { closeFn = () => close(dl.status); for (const [k, ops] of Object.entries(dl.images)) els[k]?.paint?.(ops); } }).then((v) => resolve(v == null ? 0 : v));
      for (const [k, m] of Object.entries(dl.modes)) els[k]?.mode(m);
    });
  }
}
