// Utilidades DOM
import { tKnown } from '../core/i18n.js';
const TR_ATTR = new Set(['title', 'placeholder', 'aria-label', 'label']);
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = tKnown(v);
    else if (TR_ATTR.has(k) && typeof v === 'string') el.setAttribute(k, tKnown(v));
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(tKnown(String(c))));
  return el;
}
export function draggable(el, handle) {
  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button,input,select')) return;
    const r = el.getBoundingClientRect(), pr = el.offsetParent?.getBoundingClientRect() || { left: 0, top: 0 };
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const move = (ev) => {
      const W = el.offsetParent?.clientWidth || innerWidth, H = el.offsetParent?.clientHeight || innerHeight;
      el.style.left = Math.max(0, Math.min(W - 60, ev.clientX - pr.left - ox)) + 'px';
      el.style.top = Math.max(0, Math.min(H - 30, ev.clientY - pr.top - oy)) + 'px';
      el.style.right = 'auto'; el.style.transform = 'none';
    };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  });
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
