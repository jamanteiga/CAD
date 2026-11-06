// v8 — dibujo y edición: sombreado asociativo, propiedades rápidas al pasar el cursor e información
// ampliada sobre herramientas en la cinta.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Doc } from '../core/document.js';
import { findBoundary } from './boundary.js';
import { t as T, dispCmd } from '../core/i18n.js';
import { colorName, lwName } from '../core/tables.js';
import { h } from '../ui/dom.js';

export function register(eng, app) {
  const doc = () => app.doc;
  const tr = (s) => T(s);

  // ======================= SOMBREADO ASOCIATIVO =======================
  const hatchHook = (d, tx) => {
    if (tx.name === 'UNDO' || tx.name === 'REDO' || !eng.hatchLoopFrom) return;
    const touched = new Map(); const killed = new Set();
    for (const o of tx.ops) { if (!o.e?.hid) continue; if (o.k === 'del') killed.add(o.e.hid); else if (o.k === 'mod' || o.k === 'add') touched.set(o.e.hid, o.e); }
    if (!touched.size && !killed.size) return;
    const tbb = [...touched.values()].filter((e) => e.type !== 'HATCH').map((e) => E.entBBox(e, d)).filter((b) => G.bbValid(b));
    for (const hEnt of [...d.allEnts()]) {
      if (hEnt.type !== 'HATCH' || !hEnt.hsrc) continue;
      // si se modifica el propio sombreado sin su contorno, pierde la asociatividad
      const selfMod = tx.ops.some((o) => o.e === hEnt && o.k === 'mod') && !hEnt.hsrc.some((s) => s.h && touched.has(s.h));
      if (selfMod && !tx._hatchUpd?.has(hEnt)) { delete hEnt.hsrc; continue; }
      const srcHit = hEnt.hsrc.some((s) => s.h && (touched.has(s.h) || killed.has(s.h)));
      const hb = E.entBBox(hEnt, d);
      const seedHit = hEnt.hsrc.some((s) => s.seed) && tbb.some((b) => G.bbOverlap(b, hb) || hEnt.hsrc.some((s) => s.seed && G.ptInBB(s.seed, b)));
      if (!srcHit && !seedHit) continue;
      const loops = [], src = [];
      let ok = true;
      for (const s of hEnt.hsrc) {
        if (s.h) { if (killed.has(s.h)) { ok = false; break; } const o = d.findHandle(s.h); const l = o && eng.hatchLoopFrom(o); if (!l) { ok = false; break; } loops.push(l); src.push(s); }
        else if (s.seed) { const ls = findBoundary(app, s.seed); if (!ls?.length) { ok = false; break; } loops.push(...ls); src.push({ ...s, n: ls.length }); }
      }
      (tx._hatchUpd ||= new Set()).add(hEnt);
      if (!ok) { d.mod(hEnt, (x) => delete x.hsrc); continue; }
      d.mod(hEnt, (x) => { x.loops = loops; x.hsrc = src; });
    }
  };
  if (!Doc.hooks.includes(hatchHook)) Doc.hooks.push(hatchHook);

  // ======================= PROPIEDADES RÁPIDAS AL PASAR EL CURSOR =======================
  const TN = { LINE: 'Línea', CIRCLE: 'Círculo', ARC: 'Arco', LWPOLYLINE: 'Polilínea', TEXT: 'Texto', MTEXT: 'Texto M', DIMENSION: 'Cota', HATCH: 'Sombreado', INSERT: 'Referencia a bloque', ELLIPSE: 'Elipse', SPLINE: 'Spline', POINT: 'Punto', LEADER: 'Directriz', TABLE: 'Tabla', IMAGE: 'Imagen ráster', REGION: 'Región', MLINE: 'Línea múltiple', '3DSOLID': 'Sólido 3D', POINTCLOUD: 'Nube de puntos', TOLERANCE: 'Tolerancia', DUCT: 'Conducto', VIEWPORT: 'Ventana' };
  const F = (v) => G.fmt(v, 4);
  app.rolloverInfo = (e) => {
    const d = doc(), rows = [[tr(TN[e.type] || e.type), '']];
    const col = e.color ?? 256;
    rows.push([tr('Color'), col === 256 ? tr('PorCapa') : col === 0 ? tr('PorBloque') : typeof col === 'string' ? col : tr(colorName(col))]);
    rows.push([tr('Capa'), e.layer || '0']);
    rows.push([tr('Tipo de línea'), !e.ltype || /^bylayer$/i.test(e.ltype) ? tr('PorCapa') : e.ltype]);
    if (e.lw != null && e.lw !== -1) rows.push([tr('Grosor de línea'), lwName(e.lw)]);
    if (e.type === 'LINE') rows.push([tr('Longitud'), F(G.dist(e.p1, e.p2))]);
    else if (e.type === 'CIRCLE') rows.push([tr('Radio'), F(e.r)], [tr('Área'), F(Math.PI * e.r * e.r)]);
    else if (e.type === 'ARC') rows.push([tr('Radio'), F(e.r)], [tr('Longitud'), F(E.entLength(e))]);
    else if (e.type === 'LWPOLYLINE' || e.type === 'SPLINE' || e.type === 'ELLIPSE') { rows.push([tr('Longitud'), F(E.entLength(e))]); if (e.closed || e.type === 'ELLIPSE') rows.push([tr('Área'), F(E.entArea(e))]); }
    else if (e.type === 'TEXT' || e.type === 'MTEXT') rows.push([tr('Contenido'), String(e.text).replace(/\\P/g, ' ').slice(0, 40)], [tr('Altura'), F(e.h)]);
    else if (e.type === 'INSERT') rows.push([tr('Nombre'), e.name]);
    else if (e.type === 'DIMENSION') rows.push([tr('Medida'), F(E.dimMeasure(e))], [tr('Estilo'), e.dstyle || d.vars.DIMSTYLE]);
    else if (e.type === 'HATCH') rows.push([tr('Patrón'), e.pattern || 'ANSI31'], [tr('Área'), F(E.entArea(e))], ...(e.hsrc ? [[tr('Asociativo'), tr('Sí')]] : []));
    else if (e.type === 'REGION') rows.push([tr('Área'), F(E.entArea(e))]);
    else if (e.type === '3DSOLID') rows.push([tr('Volumen'), F(E.GEN['3DSOLID'].volume(e))]);
    if (e.transp > 0) rows.push([tr('Transparencia'), String(e.transp)]);
    return rows;
  };
  app.drawRollover = (c, view, e, dark) => {
    if (doc().vars.ROLLOVERTIPS === 0) return;
    const rows = app.rolloverInfo(e), r = view.dpr;
    c.save(); c.setTransform(r, 0, 0, r, 0, 0);
    c.font = '12px Segoe UI, Arial, sans-serif';
    const w1 = Math.max(...rows.map((x) => c.measureText(x[0]).width)), w2 = Math.max(...rows.map((x) => c.measureText(x[1]).width));
    const W = w1 + w2 + 22, H = rows.length * 17 + 8;
    let x = view.mouse.x + 16, y = view.mouse.y + 18;
    if (x + W > view.W) x = view.mouse.x - W - 10; if (y + H > view.H) y = view.mouse.y - H - 10;
    c.fillStyle = dark ? 'rgba(40,46,56,.96)' : 'rgba(255,255,255,.97)'; c.strokeStyle = dark ? '#5b6577' : '#9aa3ad';
    c.fillRect(x, y, W, H); c.strokeRect(x + 0.5, y + 0.5, W, H);
    rows.forEach(([a, b], i) => {
      c.fillStyle = dark ? '#e6e6e6' : '#1d1d1d';
      c.font = i === 0 ? 'bold 12px Segoe UI, Arial, sans-serif' : '12px Segoe UI, Arial, sans-serif';
      c.fillText(a, x + 6, y + 16 + i * 17);
      c.fillStyle = dark ? '#b9c4d2' : '#40566b'; c.fillText(b, x + 14 + w1, y + 16 + i * 17);
    });
    c.restore();
  };

  // ======================= INFORMACIÓN AMPLIADA EN LA CINTA =======================
  let tip = null, tipT = null, tipFor = null;
  const hideTip = () => { clearTimeout(tipT); tip?.remove(); tip = null; tipFor = null; };
  const ribbon = document.getElementById('ribbon');
  ribbon?.addEventListener('mouseover', (ev) => {
    const b = ev.target.closest('button[data-cmd]');
    if (!b || b === tipFor) return;
    hideTip(); tipFor = b;
    const raw = b.getAttribute('data-cmd');
    if (!raw) return;
    if (b.title) { b.dataset.tt = b.title; b.removeAttribute('title'); }
    tipT = setTimeout(() => {
      const name = raw.replace(/\^C/gi, '').trim().split(/[\s;]+/)[0].replace(/^[._']+/, '').toUpperCase();
      const info = app.help?.card?.(name);
      const r = b.getBoundingClientRect();
      tip = h('div', { class: 'rtip', style: { left: Math.min(window.innerWidth - 330, r.left) + 'px', top: r.bottom + 6 + 'px' } },
        h('div', { class: 'rtip-t', text: (b.dataset.tt || '').replace(/\s*\(.*\)$/, '') || dispCmd(name) }),
        info?.desc ? h('div', { class: 'rtip-d', text: info.desc }) : '',
        h('div', { class: 'rtip-c' }, h('span', { class: 'rtip-k', text: dispCmd(name) }), name !== dispCmd(name) ? h('span', { class: 'rtip-k en', text: name }) : ''),
        h('div', { class: 'rtip-f', text: tr('Pulse F1 para obtener más ayuda') }));
      document.body.append(tip);
    }, 800);
  });
  ribbon?.addEventListener('mouseout', (ev) => { if (!ev.relatedTarget || !tipFor?.contains(ev.relatedTarget)) hideTip(); });
  ribbon?.addEventListener('mousedown', hideTip);
  // F1 sobre un botón de la cinta abre la ficha de ayuda del comando
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'F1' && tipFor) { ev.preventDefault(); ev.stopPropagation(); const raw = tipFor.getAttribute('data-cmd'); hideTip(); app.help?.show?.(raw.replace(/\^C/gi, '').trim().split(/[\s;]+/)[0].replace(/^[._']+/, '').toUpperCase()); }
  }, true);
}
