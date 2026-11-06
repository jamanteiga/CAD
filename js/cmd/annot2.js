// Cotas y anotación avanzadas: estilos de cota múltiples, cotas asociativas, longitud de arco, radio con recodo,
// cota rápida, espaciado y cortes de cota, tolerancias geométricas, estilos de directriz y de tabla,
// escala de anotación, editor de texto in situ, alineación de textos y revisión ortográfica.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { listManager } from '../ui/mgr.js';
import { h } from '../ui/dom.js';
import { Doc } from '../core/document.js';
import { t as T } from '../core/i18n.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);
export const annoFactor = (s) => { const m = /^\s*([\d.]+)\s*:\s*([\d.]+)\s*$/.exec(String(s || '1:1')); return m ? (+m[2] / +m[1]) || 1 : 1; };

// ---------- TOLERANCIA GEOMÉTRICA (marco de control de característica)
export const GDT_SYMS = [['', 'Ninguno'], ['⌖', 'Posición'], ['◎', 'Concentricidad'], ['⌯', 'Simetría'], ['∥', 'Paralelismo'], ['⟂', 'Perpendicularidad'], ['∠', 'Inclinación'],
  ['⌭', 'Cilindricidad'], ['⏥', 'Planitud'], ['○', 'Redondez'], ['⏤', 'Rectitud'], ['⌓', 'Perfil de superficie'], ['⌒', 'Perfil de línea'], ['↗', 'Oscilación circular'], ['⌰', 'Oscilación total']];
E.GEN.TOLERANCE = {
  pts: ['p'], vecs: ['dir'], lens: ['h'],
  ents(e) {
    const out = [], h_ = e.h || 2.5, dir = G.norm(e.dir || { x: 1, y: 0 }), up = G.perp(dir), rot = Math.atan2(dir.y, dir.x);
    (e.rows || []).forEach((cells, li) => {
      let x = 0; const y = -li * h_ * 2;
      for (const raw of cells) {
        const t = String(raw ?? '');
        if (!t && x > 0) continue;
        const wc = Math.max(h_ * 2, E.textWidth(t, h_) + h_ * 0.8);
        const q = (dx, dy) => G.add(e.p, G.add(G.mul(dir, x + dx), G.mul(up, y + dy)));
        out.push({ type: 'LWPOLYLINE', pts: [q(0, h_), q(wc, h_), q(wc, -h_), q(0, -h_)].map((p) => ({ ...p, b: 0 })), closed: true, color: 0, layer: e.layer });
        if (t) out.push({ type: 'TEXT', p: q(wc / 2, 0), p2: q(wc / 2, 0), h: h_, rot, text: t, ha: 4, va: 0, color: 0, layer: e.layer });
        x += wc;
      }
    });
    return out;
  },
  snaps(e, push) { push(e.p, 'ins'); },
};

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const tr = (s) => T(s);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const invalidateDims = () => { for (const e of doc().allEntsDeep()) if (e.type === 'DIMENSION' || e.type === 'LEADER' || e.type === 'TOLERANCE') E.invalidate(e); };

  // ======================= ESTILOS DE COTA =======================
  const DS_FIELDS = (s) => [
    { t: 'sep', l: 'Líneas y flechas' },
    { k: 'dimclrd', l: 'Color de líneas de cota (ACI)', v: s.dimclrd ?? 256, t: 'number' },
    { k: 'dimexo', l: 'Desfase desde el origen', v: s.dimexo, t: 'number' }, { k: 'dimexe', l: 'Prolongación de líneas de referencia', v: s.dimexe, t: 'number' },
    { k: 'dimdli', l: 'Separación de líneas base', v: s.dimdli ?? 3.75, t: 'number' }, { k: 'dimasz', l: 'Tamaño de flecha', v: s.dimasz, t: 'number' },
    { k: 'dimbreak', l: 'Tamaño de corte de cota', v: s.dimbreak ?? 3.75, t: 'number' }, { k: 'dimjogang', l: 'Ángulo de recodo (°)', v: s.dimjogang ?? 45, t: 'number' },
    { k: 'dimarcsym', l: 'Símbolo de longitud de arco', v: s.dimarcsym ?? 0, t: 'select', opts: [{ v: 0, l: 'Delante del texto' }, { v: 2, l: 'Ninguno' }] },
    { t: 'sep', l: 'Texto' },
    { k: 'dimtxsty', l: 'Estilo de texto', v: s.dimtxsty || 'Standard', t: 'select', opts: Object.keys(doc().styles) },
    { k: 'dimclrt', l: 'Color de texto (ACI)', v: s.dimclrt ?? 256, t: 'number' }, { k: 'dimtxt', l: 'Altura de texto', v: s.dimtxt, t: 'number' },
    { k: 'dimgap', l: 'Desfase desde línea de cota', v: s.dimgap, t: 'number' },
    { k: 'dimtad', l: 'Posición vertical', v: s.dimtad ?? 1, t: 'select', opts: [{ v: 0, l: 'Centrado' }, { v: 1, l: 'Encima' }] },
    { t: 'sep', l: 'Ajustar' },
    { k: 'dimscale', l: 'Escala global', v: s.dimscale ?? 1, t: 'number' }, { k: 'anno', l: 'Anotativo', v: !!s.anno, t: 'check' },
    { t: 'sep', l: 'Unidades principales' },
    { k: 'dimdec', l: 'Precisión', v: s.dimdec ?? 2, t: 'number' }, { k: 'dimadec', l: 'Precisión angular', v: s.dimadec ?? 0, t: 'number' },
    { k: 'dimlfac', l: 'Factor de escala lineal', v: s.dimlfac ?? 1, t: 'number' }, { k: 'dimpre', l: 'Prefijo', v: s.dimpre || '' }, { k: 'dimpost', l: 'Sufijo', v: s.dimpost || '' },
    { t: 'sep', l: 'Tolerancias' },
    { k: 'tolmode', l: 'Método', v: s.dimlim ? 'lim' : s.dimtol ? (+s.dimtp === +s.dimtm ? 'sym' : 'dev') : 'none', t: 'select', opts: [{ v: 'none', l: 'Ninguno' }, { v: 'sym', l: 'Simétrico' }, { v: 'dev', l: 'Desviación' }, { v: 'lim', l: 'Límites' }] },
    { k: 'dimtp', l: 'Valor superior', v: s.dimtp ?? 0, t: 'number' }, { k: 'dimtm', l: 'Valor inferior', v: s.dimtm ?? 0, t: 'number' }, { k: 'dimtdec', l: 'Precisión de tolerancia', v: s.dimtdec ?? s.dimdec ?? 2, t: 'number' },
  ];
  const applyDsForm = (s, r) => {
    for (const k of ['dimclrd', 'dimexo', 'dimexe', 'dimdli', 'dimasz', 'dimbreak', 'dimjogang', 'dimarcsym', 'dimclrt', 'dimtxt', 'dimgap', 'dimtad', 'dimscale', 'dimdec', 'dimadec', 'dimlfac', 'dimtp', 'dimtm', 'dimtdec']) if (r[k] !== undefined && r[k] !== '') s[k] = +r[k];
    s.dimtxsty = r.dimtxsty; s.dimpre = r.dimpre; s.dimpost = r.dimpost; s.anno = !!r.anno;
    s.dimtol = r.tolmode === 'sym' || r.tolmode === 'dev'; s.dimlim = r.tolmode === 'lim';
    if (r.tolmode === 'sym') s.dimtm = s.dimtp;
  };
  const dsInfo = (n) => { const s = doc().dimstyles[n] || {}; return [`${tr('Altura de texto')}: ${s.dimtxt}`, `${tr('Tamaño de flecha')}: ${s.dimasz}`, `${tr('Escala global')}: ${s.dimscale ?? 1}`, `${tr('Precisión')}: ${s.dimdec ?? 2}`, `${tr('Anotativo')}: ${s.anno ? tr('Sí') : 'No'}`, `${tr('Tolerancias')}: ${s.dimlim ? tr('Límites') : s.dimtol ? '±' : tr('Ninguno')}`].join('\n'); };
  const newDimStyle = async (from) => {
    const d = doc();
    const r = await app.ui.dlg.form('Crear nuevo estilo de cota', [{ k: 'name', l: 'Nombre de estilo nuevo', v: `${tr('Copia de')} ${from}` }, { k: 'from', l: 'Empezar con', v: from, t: 'select', opts: Object.keys(d.dimstyles) }]);
    if (!r || !r.name.trim()) return null;
    const name = r.name.trim();
    d.begin('DIMSTYLE'); d.touchTables(); d.dimstyles[name] = JSON.parse(JSON.stringify(d.dimstyles[r.from] || d.dimstyle)); d.end();
    await modifyDimStyle(name);
    return name;
  };
  const modifyDimStyle = async (name) => {
    const d = doc(), s = d.dimstyles[name]; if (!s) return;
    const r = await app.ui.dlg.form(`${tr('Modificar estilo de cota')}: ${name}`, DS_FIELDS(s));
    if (!r) return;
    d.begin('DIMSTYLE'); d.touchTables(); applyDsForm(d.dimstyles[name], r); d.relinkDim(null, d.vars.DIMSTYLE); d.end();
    invalidateDims(); redraw();
  };
  R('DIMSTYLE', async (c) => {
    await listManager(app, {
      title: 'Administrador de estilos de cota',
      names: () => Object.keys(doc().dimstyles), cur: () => doc().vars.DIMSTYLE, info: dsInfo,
      buttons: [
        { t: 'Definir actual', dbl: true, fn: (n) => { doc().setDimStyle(n); c.print(`Current dimension style: ${n}`); } },
        { t: 'Nuevo...', fn: (n) => newDimStyle(n) },
        { t: 'Modificar...', fn: (n) => modifyDimStyle(n) },
        { t: 'Renombrar...', fn: async (n) => { const nn = await app.ui.dlg.prompt('Renombrar', 'Nombre:', n); if (!nn || nn === n || doc().dimstyles[nn]) return; const d = doc(); d.begin('RENAME'); d.touchTables(); d.dimstyles[nn] = d.dimstyles[n]; delete d.dimstyles[n]; if (d.vars.DIMSTYLE === n) d.vars.DIMSTYLE = nn; for (const e of d.allEntsDeep()) if (e.dstyle === n) e.dstyle = nn; d.end(); return nn; } },
        { t: 'Suprimir', fn: async (n) => { const d = doc(); if (n === d.vars.DIMSTYLE) return app.ui.dlg.alert(tr('No se puede suprimir el estilo actual.')); if ([...d.allEntsDeep()].some((e) => e.dstyle === n)) return app.ui.dlg.alert(tr('El estilo está en uso.')); d.begin('PURGE'); d.touchTables(); delete d.dimstyles[n]; d.end(); } },
        { t: 'Sustituir (actualizar cotas)', fn: (n) => { const d = doc(); d.begin('DIMSTYLE'); let k = 0; for (const e of d.allEnts()) if (e.type === 'DIMENSION' && e.dstyle !== n && eng.sel?.includes?.(e)) { d.mod(e, (x) => (x.dstyle = n)); k++; } d.end(); c.print(`${k} dimension(s) updated.`); } },
      ],
    });
    app.ui.ribbon?.render?.();
  }, { alias: ['DDIM', 'D', 'DST', 'DIMSTY'] });
  R('-DIMSTYLE', async (c) => {
    const d = doc();
    c.print(`Current dimension style: ${d.vars.DIMSTYLE}`);
    const k = await c.getKw('Enter a dimension style option [Save/Restore/STatus/Apply/?] <Restore>:', 'Restore');
    if (k == null) return;
    if (k === 'Save') { const n = need(await c.getString('Enter name for new dimension style or [?]:')); d.begin('DIMSTYLE'); d.touchTables(); d.dimstyles[n] = JSON.parse(JSON.stringify(d.dimstyle)); d.end(); d.setDimStyle(n); }
    else if (k === 'Restore') { const n = need(await c.getString('Enter dimension style name, [?] or <select dimension>:')); if (n === '?') c.print(Object.keys(d.dimstyles).join(', ')); else if (d.dimstyles[n]) d.setDimStyle(n); else if (!n) { const r = await c.entsel('Select dimension:', { filter: (e) => e.type === 'DIMENSION' }); if (r?.e?.dstyle) d.setDimStyle(r.e.dstyle); } else c.print(`Dimension style "${n}" not found.`); }
    else if (k === 'STatus') for (const [kk, v] of Object.entries(d.dimstyle)) c.print(`${kk.toUpperCase().padEnd(10)} ${v}`);
    else if (k === 'Apply') { const s = await c.select(); d.begin('DIMSTYLE'); for (const e of s) if (e.type === 'DIMENSION') d.mod(e, (x) => { x.dstyle = d.vars.DIMSTYLE; delete x.st; }); d.end(); }
    else c.print(Object.keys(d.dimstyles).join(', '));
    redraw();
  });

  // ======================= ASOCIATIVIDAD =======================
  const findRef = (p, exclude) => {
    const d = doc(), tol = 1e-7 * Math.max(1, Math.abs(p.x), Math.abs(p.y));
    for (const e of d.space) {
      if (e === exclude || e.type === 'DIMENSION' || /TEXT|HATCH|LEADER|TOLERANCE/.test(e.type)) continue;
      const sn = E.entSnaps(e, d);
      for (let i = 0; i < sn.length; i++) if (G.dist(sn[i].p, p) < tol) return { h: e.hid, i, t: sn[i].t };
    }
    return null;
  };
  const associate = (e) => {
    const d = doc(); if (!d.vars.DIMASSOC || d.vars.DIMASSOC < 2) return 0;
    const assoc = {};
    if (e.dt === 'radius' || e.dt === 'diameter' || e.dt === 'jogged' || e.dt === 'arclen') {
      const r = findRef(e.c, e); if (r) { const ce = d.findHandle(r.h); if (ce && (ce.type === 'CIRCLE' || ce.type === 'ARC')) assoc.circ = ce.hid; }
    } else for (const k of ['p1', 'p2', 'c']) if (e[k] && (e.dt !== 'ordinate' || k === 'p1')) { const r = findRef(e[k], e); if (r) assoc[k] = r; }
    if (Object.keys(assoc).length) { e.assoc = assoc; return 1; }
    delete e.assoc; return 0;
  };
  eng.onNewDim = (e) => {
    const d = doc(), st = d.dimStyleOf(e);
    associate(e);
    if (st.anno) { e.anno = 1; e.st = { ...(e.st || {}), dimscale: (st.dimscale || 1) * annoFactor(d.vars.CANNOSCALE) }; }
  };
  const updateDim = (d, e, killed) => {
    const a = e.assoc; let ch = false;
    if (a.circ) {
      const ce = d.findHandle(a.circ);
      if (!ce || killed.has(a.circ)) { d.mod(e, (x) => delete x.assoc); return; }
      const ang = G.ang(e.c, e.p1), ang2 = e.p2 ? G.ang(e.c, e.p2) : 0, dr = e.dp ? G.dist(e.c, e.dp) - G.dist(e.c, e.p1) : 0, da = e.dp ? G.ang(e.c, e.dp) : 0;
      d.mod(e, (x) => {
        const off = G.sub(ce.c, x.c);
        x.c = { ...ce.c }; x.p1 = G.polar(ce.c, ang, ce.r);
        if (x.dt === 'arclen' && ce.type === 'ARC') { x.p1 = G.polar(ce.c, ce.a1, ce.r); x.p2 = G.polar(ce.c, ce.a2, ce.r); } else if (x.p2) x.p2 = G.polar(ce.c, ang2, ce.r);
        if (x.dp) x.dp = G.polar(ce.c, da, ce.r + dr);
        if (x.jc) x.jc = G.add(x.jc, off); if (x.jp) x.jp = G.add(x.jp, off); delete x.tp;
      });
      return;
    }
    const upd = {};
    for (const [k, r] of Object.entries(a)) {
      const ce = d.findHandle(r.h);
      if (!ce || killed.has(r.h)) { upd[k] = null; continue; }
      const sn = E.entSnaps(ce, d)[r.i];
      if (sn && !G.eq(sn.p, e[k], 1e-9)) { upd[k] = sn.p; ch = true; }
    }
    if (!ch && !Object.values(upd).some((v) => v === null)) return;
    d.mod(e, (x) => {
      for (const [k, p] of Object.entries(upd)) { if (p === null) delete x.assoc[k]; else x[k] = { x: p.x, y: p.y }; }
      if (!Object.keys(x.assoc).length) delete x.assoc;
      delete x.tp;
    });
  };
  const assocHook = (d, tx) => {
    if (tx.name === 'UNDO' || tx.name === 'REDO') return;
    const touched = new Set(), killed = new Set();
    for (const op of tx.ops) { if (op.k === 'mod' && op.e.hid) touched.add(op.e.hid); if (op.k === 'del' && op.e.hid) { touched.add(op.e.hid); killed.add(op.e.hid); } }
    if (!touched.size) return;
    for (const e of d.allEnts()) {
      if (e.type !== 'DIMENSION' || !e.assoc) continue;
      const refs = e.assoc.circ ? [e.assoc.circ] : Object.values(e.assoc).map((r) => r.h);
      if (refs.some((x) => touched.has(x))) updateDim(d, e, killed);
    }
  };
  // anotativo: los objetos nuevos con estilo de texto anotativo adoptan la escala actual
  const annoHook = (d, tx) => {
    const f = annoFactor(d.vars.CANNOSCALE);
    for (const op of tx.ops) {
      if (op.k !== 'add') continue; const e = op.e;
      if ((e.type === 'TEXT' || e.type === 'MTEXT') && !e.anno && d.styles[e.style || d.vars.TEXTSTYLE]?.anno) { e.anno = 1; e.ph = e.h; e.h = e.ph * f; E.invalidate(e); }
    }
  };
  if (!Doc.hooks.includes(assocHook)) Doc.hooks.push(assocHook, annoHook);

  R('DIMREASSOCIATE', async (c) => {
    const s = await c.select('Select dimensions to reassociate:', { filter: (e) => e.type === 'DIMENSION' });
    const d = doc(); let n = 0; const old = d.vars.DIMASSOC; d.vars.DIMASSOC = 2;
    d.begin('DIMREASSOCIATE'); for (const e of s) d.mod(e, (x) => (n += associate(x))); d.end(); d.vars.DIMASSOC = old;
    c.print(`${n} dimension(s) associated.`);
  }, { alias: ['DRE'] });
  R('DIMDISASSOCIATE', async (c) => {
    const s = await c.select('Select dimensions to disassociate:', { filter: (e) => e.type === 'DIMENSION' && e.assoc });
    const d = doc(); d.begin('DIMDISASSOCIATE'); for (const e of s) d.mod(e, (x) => delete x.assoc); d.end();
    c.print(`${s.length} disassociated.`);
  }, { alias: ['DDA'] });
  R('DIMREGEN', async () => { invalidateDims(); app.view.redraw(); });

  // ======================= COTAS NUEVAS =======================
  const add = (o) => eng.addDim(o);
  R('DIMARC', async (c) => {
    const r = need(await c.entsel('Select arc or polyline arc segment:', { filter: (e) => e.type === 'ARC', filterMsg: 'Object selected is not an arc.' }));
    const a = r.e, p1 = G.polar(a.c, a.a1, a.r), p2 = G.polar(a.c, a.a2, a.r);
    let text = null;
    for (;;) {
      const mk = (q) => ({ type: 'DIMENSION', dt: 'arclen', c: a.c, p1, p2, dp: q, text: text ?? undefined, dstyle: doc().vars.DIMSTYLE });
      const q = need(await c.getPoint('Specify arc length dimension location, or [Mtext/Text/Angle/Partial]:', { preview: (q) => [mk(q)] }));
      if (isPt(q)) { add({ dt: 'arclen', c: { ...a.c }, p1, p2, dp: q, ...(text ? { text } : {}) }); return; }
      if (q === 'Mtext' || q === 'Text') text = await c.getString('Enter dimension text <>:', { spaces: true, def: '<>' });
      if (q === 'Partial') {
        const s1 = need(await c.getPoint('Specify first point for arc length dimension:'));
        const s2 = need(await c.getPoint('Specify second point for arc length dimension:'));
        const q2 = need(await c.getPoint('Specify arc length dimension location:', { preview: (q) => [{ ...mk(q), p1: G.polar(a.c, G.ang(a.c, s1), a.r), p2: G.polar(a.c, G.ang(a.c, s2), a.r) }] }));
        add({ dt: 'arclen', c: { ...a.c }, p1: G.polar(a.c, G.ang(a.c, s1), a.r), p2: G.polar(a.c, G.ang(a.c, s2), a.r), dp: q2 }); return;
      }
    }
  }, { alias: ['DAR'] });
  R('DIMJOGGED', async (c) => {
    const r = need(await c.entsel('Select arc or circle:', { filter: (e) => e.type === 'ARC' || e.type === 'CIRCLE', filterMsg: 'Object selected is not a circle or arc.' }));
    const a = r.e;
    const jc = need(await c.getPoint('Specify center location override:'));
    let ang = G.ang(a.c, r.p);
    c.print(`Dimension text = ${F(a.r, doc().dimstyle.dimdec ?? 2)}`);
    const dp = need(await c.getPoint('Specify dimension line location or [Mtext/Text/Angle]:', { preview: (q) => [{ type: 'DIMENSION', dt: 'jogged', c: a.c, p1: G.polar(a.c, G.ang(a.c, q), a.r), jc, dp: q }] }));
    if (isPt(dp)) ang = G.ang(a.c, dp);
    const p1 = G.polar(a.c, ang, a.r);
    const jp = need(await c.getPoint('Specify jog location:', { preview: (q) => [{ type: 'DIMENSION', dt: 'jogged', c: a.c, p1, jc, jp: q, dp }] }));
    add({ dt: 'jogged', c: { ...a.c }, p1, jc, jp, dp: isPt(dp) ? dp : undefined });
  }, { alias: ['JOG', 'DJO'] });

  // cota rápida: puntos característicos de la geometría designada
  const keyPoints = (ents) => {
    const pts = [];
    for (const e of ents) {
      switch (e.type) {
        case 'LINE': pts.push(e.p1, e.p2); break;
        case 'LWPOLYLINE': pts.push(...e.pts.map((p) => ({ x: p.x, y: p.y }))); break;
        case 'CIRCLE': pts.push(e.c); break;
        case 'ARC': pts.push(e.c, G.polar(e.c, e.a1, e.r), G.polar(e.c, e.a2, e.r)); break;
        case 'POINT': case 'INSERT': pts.push(e.p); break;
        default: for (const s of E.entSnaps(e, doc())) if (s.t === 'end' || s.t === 'cen') pts.push(s.p);
      }
    }
    return pts;
  };
  R('QDIM', async (c) => {
    const s = await c.select('Select geometry to dimension:', { filter: (e) => e.type !== 'DIMENSION' && !/TEXT/.test(e.type) });
    if (!s.length) return;
    const pts = keyPoints(s), bb = G.bbNew(); for (const p of pts) G.bbAdd(bb, p);
    let mode = 'Continuous';
    for (;;) {
      const build = (q) => {
        const horiz = q.y > bb.y2 || q.y < bb.y1 || (q.x >= bb.x1 && q.x <= bb.x2);
        const key = horiz ? 'x' : 'y', uniq = [];
        for (const p of [...pts].sort((a, b) => a[key] - b[key])) if (!uniq.length || Math.abs(p[key] - uniq.at(-1)[key]) > 1e-6) uniq.push(p);
        const out = [], dli = (doc().dimstyle.dimdli ?? 3.75) * (doc().dimstyle.dimscale || 1);
        if (mode === 'Ordinate') for (const p of uniq) out.push({ type: 'DIMENSION', dt: 'ordinate', p1: p, dp: horiz ? { x: p.x, y: q.y } : { x: q.x, y: p.y }, xord: horiz });
        else for (let i = 1; i < uniq.length; i++) {
          const a = mode === 'Baseline' ? uniq[0] : uniq[i - 1], b = uniq[i];
          const off = mode === 'Baseline' ? (i - 1) * dli * (q[horiz ? 'y' : 'x'] > (horiz ? bb.y2 : bb.x2) ? 1 : -1) : 0;
          out.push({ type: 'DIMENSION', dt: 'linear', p1: a, p2: b, dp: horiz ? { x: q.x, y: q.y + off } : { x: q.x + off, y: q.y }, rot: horiz ? 0 : Math.PI / 2 });
        }
        return out;
      };
      const q = need(await c.getPoint('Specify dimension line position, or [Continuous/Staggered/Baseline/Ordinate/Radius/Diameter]:', { preview: (q) => build(q) }));
      if (isPt(q)) {
        const d = doc(); d.begin('QDIM'); let n = 0;
        for (const o of build(q)) { const { type: _t, ...rest } = o; add(rest); n++; }
        d.end(); c.print(`${n} dimension(s) created.`); return;
      }
      if (q === 'Radius' || q === 'Diameter') {
        const d = doc(); d.begin('QDIM'); let n = 0;
        for (const e of s) if (e.type === 'CIRCLE' || e.type === 'ARC') { const a0 = Math.PI / 4; add({ dt: q === 'Radius' ? 'radius' : 'diameter', c: { ...e.c }, p1: G.polar(e.c, a0, e.r), ...(q === 'Diameter' ? { p2: G.polar(e.c, a0 + Math.PI, e.r) } : {}), dp: G.polar(e.c, a0, e.r * 1.4) }); n++; }
        d.end(); c.print(`${n} dimension(s) created.`); return;
      }
      if (q === 'Staggered') mode = 'Baseline'; else mode = q;
    }
  });

  R('DIMSPACE', async (c) => {
    const b = need(await c.entsel('Select base dimension:', { filter: (e) => e.type === 'DIMENSION' && (e.dt === 'linear' || e.dt === 'aligned'), filterMsg: 'Select a linear dimension.' })).e;
    const s = (await c.select('Select dimensions to space:', { filter: (e) => e.type === 'DIMENSION' && e !== b && (e.dt === 'linear' || e.dt === 'aligned') }));
    if (!s.length) return;
    const v = await c.ask({ kind: 'real', prompt: 'Enter value or [Auto] <Auto>:', def: 'Auto' });
    if (v == null) return;
    const st = { ...E.DIMDEF, ...doc().dimStyleOf(b) }, k = st.dimscale || 1;
    const gap = v === 'Auto' || typeof v !== 'number' ? st.dimtxt * k * 2 : v;
    // dirección normal a la línea de cota base
    const dir = b.dt === 'linear' ? (b.rot != null ? b.rot : Math.abs(b.dp.y - b.p1.y) > Math.abs(b.dp.x - b.p1.x) ? 0 : Math.PI / 2) : G.ang(b.p1, b.p2);
    const n = G.perp({ x: Math.cos(dir), y: Math.sin(dir) }), ref = G.dot(b.dp, n);
    const side = Math.sign(s.reduce((a, e) => a + G.dot(e.dp, n) - ref, 0)) || 1;
    const sorted = s.slice().sort((a, b2) => Math.abs(G.dot(a.dp, n) - ref) - Math.abs(G.dot(b2.dp, n) - ref));
    const d = doc(); d.begin('DIMSPACE');
    sorted.forEach((e, i) => { const target = ref + side * gap * (i + 1); d.mod(e, (x) => { x.dp = G.add(x.dp, G.mul(n, target - G.dot(x.dp, n))); delete x.tp; }); });
    d.end(); redraw();
  });

  // cortes de cota: intersecciones de las líneas de la cota con otros objetos
  const breakPoints = (e) => {
    const d = doc(), lines = E.dimEnts({ ...e, brk: null, brkm: null, _dim: null }, d).filter((x) => x.type === 'LINE');
    const bb = E.entBBox(e, d), out = [];
    for (const o of d.space) {
      if (o === e || /TEXT/.test(o.type)) continue;
      const ob = E.entBBox(o, d); if (!G.bbValid(ob) || !G.bbOverlap(ob, bb)) continue;
      const prims = o.type === 'DIMENSION' ? E.dimEnts(o, d).filter((x) => x.type === 'LINE').map((x) => ({ k: 'L', a: x.p1, b: x.p2 })) : E.localPrims(o, d);
      for (const l of lines) for (const p of prims) for (const q of G.primInter({ k: 'L', a: l.p1, b: l.p2 }, p)) out.push(q);
    }
    return out;
  };
  eng.dimBreakPoints = breakPoints;
  R('DIMBREAK', async (c) => {
    let k = 'auto';
    const r = await c.ask({ kind: 'entity', prompt: 'Select dimension to add/remove break or [Multiple]:', filter: (e) => e.type === 'DIMENSION' });
    if (r == null) return;
    let dims = [];
    if (r === 'Multiple') dims = await c.select('Select dimensions:', { filter: (e) => e.type === 'DIMENSION' });
    else dims = [r.e];
    if (!dims.length) return;
    if (dims.length === 1) {
      const q = await c.getKw('Select object to break dimension or [Auto/Manual/Remove] <Auto>:', 'Auto');
      if (q == null) return;
      k = q.toLowerCase();
    } else { const q = await c.getKw('Enter an option [Break/Remove] <Break>:', 'Break'); if (q == null) return; k = q === 'Remove' ? 'remove' : 'auto'; }
    const d = doc();
    if (k === 'manual') {
      const p1 = need(await c.getPoint('Specify first break point:')), p2 = need(await c.getPoint('Specify second break point:', { base: p1 }));
      const e = dims[0], line = E.dimEnts(e, d).filter((x) => x.type === 'LINE').sort((a, b) => G.segDist(p1, a.p1, a.p2) - G.segDist(p1, b.p1, b.p2))[0];
      if (!line) return;
      const pr = (p) => G.primNearest({ k: 'L', a: line.p1, b: line.p2 }, p);
      d.begin('DIMBREAK'); d.mod(e, (x) => (x.brkm = [...(x.brkm || []), [pr(p1), pr(p2)]])); d.end();
    } else {
      d.begin('DIMBREAK'); let n = 0;
      for (const e of dims) d.mod(e, (x) => { if (k === 'remove') { delete x.brk; delete x.brkm; delete x.brkAuto; } else { x.brk = breakPoints(x); x.brkAuto = true; n += x.brk.length; } });
      d.end(); c.print(`${dims.length} object(s) modified.`);
    }
    redraw();
  });

  R('TOLERANCE', async (c) => {
    const rows = [];
    const symOpts = GDT_SYMS.map(([v, l]) => ({ v, l: v ? `${v}  ${tr(l)}` : tr(l) }));
    const fld = [];
    for (let i = 0; i < 2; i++) fld.push({ t: 'sep', l: `${tr('Fila')} ${i + 1}` }, { k: `s${i}`, l: 'Símbolo', v: i ? '' : '⌖', t: 'select', opts: symOpts },
      { k: `d${i}`, l: 'Diámetro ⌀', v: !i, t: 'check' }, { k: `t1${i}`, l: 'Tolerancia 1', v: i ? '' : '0.05' }, { k: `m${i}`, l: 'Condición de material', v: '', t: 'select', opts: [{ v: '', l: tr('Ninguno') }, { v: 'Ⓜ', l: 'Ⓜ MMC' }, { v: 'Ⓛ', l: 'Ⓛ LMC' }, { v: 'Ⓢ', l: 'Ⓢ RFS' }] },
      { k: `t2${i}`, l: 'Tolerancia 2', v: '' }, { k: `a${i}`, l: 'Referencia 1', v: i ? '' : 'A' }, { k: `b${i}`, l: 'Referencia 2', v: '' }, { k: `c${i}`, l: 'Referencia 3', v: '' });
    const r = await app.ui.dlg.form('Tolerancia geométrica', fld);
    if (!r) return;
    for (let i = 0; i < 2; i++) {
      if (!r[`s${i}`] && !r[`t1${i}`]) continue;
      rows.push([r[`s${i}`], `${r[`d${i}`] ? '⌀' : ''}${r[`t1${i}`]}${r[`m${i}`]}`, r[`t2${i}`], r[`a${i}`], r[`b${i}`], r[`c${i}`]].filter((x, j) => j < 2 || x));
    }
    if (!rows.length) return;
    const st = doc().dimstyle, hh = st.dimtxt * (st.dimscale || 1);
    const p = need(await c.getPoint('Enter tolerance location:', { preview: (q) => [{ type: 'TOLERANCE', p: q, dir: { x: 1, y: 0 }, h: hh, rows }] }));
    doc().add({ type: 'TOLERANCE', p, dir: { x: 1, y: 0 }, h: hh, rows });
  }, { alias: ['TOL'] });

  // ======================= ESTILOS DE DIRECTRIZ MÚLTIPLE Y DE TABLA =======================
  const ensureStd = () => {
    const x = doc().ext;
    if (!x.mleaderstyles.Standard) x.mleaderstyles.Standard = { txt: 2.5, asz: 2.5, land: 8, scale: 1, arrow: true, frame: false, color: null, tstyle: 'Standard' };
    if (!x.tablestyles.Standard) x.tablestyles.Standard = { th: 2.5, tth: 4, rowh: 7, colw: 25, titleRow: true, headRow: true, align: 'MC', color: null };
    if (!x.mlstyles.STANDARD) x.mlstyles.STANDARD = { els: [{ off: 0.5, color: 256, lt: 'BYLAYER' }, { off: -0.5, color: 256, lt: 'BYLAYER' }], caps: { start: false, end: false }, fill: false, desc: '' };
  };
  ensureStd();
  eng.ensureStdStyles = ensureStd;
  const styleMgr = (title, key, varName, fields, apply, infoF) => async () => {
    ensureStd();
    const tab = () => doc().ext[key];
    const edit = async (n) => { const r = await app.ui.dlg.form(`${tr(title)}: ${n}`, fields(tab()[n])); if (!r) return; const d = doc(); d.begin(key); d.touchTables(); apply(tab()[n], r); d.end(); };
    await listManager(app, {
      title, names: () => Object.keys(tab()), cur: () => doc().vars[varName], info: (n) => infoF(tab()[n] || {}),
      buttons: [
        { t: 'Definir actual', dbl: true, fn: (n) => doc().setvar(varName, n) },
        { t: 'Nuevo...', fn: async (n) => { const nn = await app.ui.dlg.prompt('Nuevo estilo', 'Nombre:', `${tr('Copia de')} ${n}`); if (!nn || tab()[nn]) return; const d = doc(); d.begin(key); d.touchTables(); tab()[nn] = JSON.parse(JSON.stringify(tab()[n])); d.end(); await edit(nn); return nn; } },
        { t: 'Modificar...', fn: edit },
        { t: 'Suprimir', fn: (n) => { if (n === doc().vars[varName] || /^standard$/i.test(n)) return; const d = doc(); d.begin(key); d.touchTables(); delete tab()[n]; d.end(); } },
      ],
    });
  };
  R('MLEADERSTYLE', styleMgr('Administrador de estilos de directriz múltiple', 'mleaderstyles', 'CMLEADERSTYLE',
    (s) => [{ k: 'tstyle', l: 'Estilo de texto', v: s.tstyle || 'Standard', t: 'select', opts: Object.keys(doc().styles) }, { k: 'txt', l: 'Altura de texto', v: s.txt, t: 'number' }, { k: 'asz', l: 'Tamaño de flecha', v: s.asz, t: 'number' },
      { k: 'land', l: 'Longitud de apoyo', v: s.land, t: 'number' }, { k: 'scale', l: 'Escala', v: s.scale, t: 'number' }, { k: 'arrow', l: 'Flecha', v: s.arrow !== false, t: 'check' }, { k: 'frame', l: 'Marco de texto', v: !!s.frame, t: 'check' }, { k: 'color', l: 'Color (ACI, vacío = PorCapa)', v: s.color ?? '' }],
    (s, r) => { Object.assign(s, { tstyle: r.tstyle, txt: +r.txt, asz: +r.asz, land: +r.land, scale: +r.scale || 1, arrow: r.arrow, frame: r.frame, color: r.color === '' ? null : +r.color }); },
    (s) => `${tr('Altura de texto')}: ${s.txt}\n${tr('Tamaño de flecha')}: ${s.asz}\n${tr('Longitud de apoyo')}: ${s.land}\n${tr('Escala')}: ${s.scale}`), { alias: ['MLS'] });
  R('TABLESTYLE', styleMgr('Administrador de estilos de tabla', 'tablestyles', 'CTABLESTYLE',
    (s) => [{ k: 'th', l: 'Altura de texto de datos', v: s.th, t: 'number' }, { k: 'tth', l: 'Altura de texto de título', v: s.tth, t: 'number' }, { k: 'rowh', l: 'Alto de fila', v: s.rowh, t: 'number' }, { k: 'colw', l: 'Ancho de columna', v: s.colw, t: 'number' },
      { k: 'titleRow', l: 'Fila de título', v: s.titleRow !== false, t: 'check' }, { k: 'headRow', l: 'Fila de encabezado', v: s.headRow !== false, t: 'check' }, { k: 'align', l: 'Alineación', v: s.align || 'MC', t: 'select', opts: [{ v: 'ML', l: 'Izquierda' }, { v: 'MC', l: 'Centro' }, { v: 'MR', l: 'Derecha' }] }, { k: 'color', l: 'Color (ACI, vacío = PorCapa)', v: s.color ?? '' }],
    (s, r) => Object.assign(s, { th: +r.th, tth: +r.tth, rowh: +r.rowh, colw: +r.colw, titleRow: r.titleRow, headRow: r.headRow, align: r.align, color: r.color === '' ? null : +r.color }),
    (s) => `${tr('Altura de texto')}: ${s.th}\n${tr('Alto de fila')}: ${s.rowh}\n${tr('Ancho de columna')}: ${s.colw}`), { alias: ['TS'] });
  // las tablas nuevas toman el estilo actual
  eng.tableStyle = () => { ensureStd(); return doc().ext.tablestyles[doc().vars.CTABLESTYLE] || doc().ext.tablestyles.Standard; };

  // ======================= ESCALA DE ANOTACIÓN =======================
  const applyAnno = (d, f) => {
    for (const e of d.allEntsDeep()) {
      if (!e.anno) continue;
      if (e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTDEF') { if (e.ph == null) e.ph = e.h / (e.af || 1); e.h = e.ph * f; }
      else if (e.type === 'DIMENSION') { const base = d.dimStyleOf(e).dimscale || 1; e.st = { ...(e.st || {}), dimscale: base * f }; }
      else if (e.type === 'LEADER') { if (e.pasz == null) e.pasz = (e.asz || 2.5) / (e.af || 1); e.asz = e.pasz * f; }
      else if (e.type === 'HATCH') { if (e.pscale == null) e.pscale = (e.scale || 1) / (e.af || 1); e.scale = e.pscale * f; delete e.pdef; }
      else if (e.type === 'INSERT') { if (e.psx == null) { e.psx = (e.sx ?? 1) / (e.af || 1); e.psy = (e.sy ?? 1) / (e.af || 1); } e.sx = e.psx * f; e.sy = e.psy * f; }
      else if (e.type === 'TOLERANCE') { if (e.ph == null) e.ph = e.h / (e.af || 1); e.h = e.ph * f; }
      e.af = f; E.invalidate(e);
    }
  };
  const setAnnoScale = (s) => {
    const d = doc(); if (!/^\s*[\d.]+\s*:\s*[\d.]+\s*$/.test(s)) return false;
    s = s.replace(/\s/g, '');
    d.begin('CANNOSCALE'); d.touchTables();
    for (const e of d.allEntsDeep()) if (e.anno) d.touch(e);
    if (!d.ext.annoScales.includes(s)) d.ext.annoScales.push(s);
    d.vars.CANNOSCALE = s; applyAnno(d, annoFactor(s)); d.end(); d.emit('var', 'CANNOSCALE');
    redraw(); return true;
  };
  app.setAnnoScale = setAnnoScale;
  R('CANNOSCALE', async (c) => {
    const d = doc();
    const s = await c.getString(`Enter new value for CANNOSCALE <"${d.vars.CANNOSCALE}">:`, { def: d.vars.CANNOSCALE });
    if (s == null) return;
    if (!setAnnoScale(s)) c.print('Invalid scale. Use the form 1:50.');
  });
  R('ANNOSCALE', async () => {
    const d = doc();
    const r = await app.ui.dlg.form('Escala de anotación', [{ k: 's', l: 'Escala de anotación actual', v: d.vars.CANNOSCALE, t: 'select', opts: d.ext.annoScales }, { k: 'n', l: 'Añadir escala (p. ej. 1:75)', v: '' }]);
    if (!r) return;
    setAnnoScale(r.n?.trim() || r.s);
  }, { alias: ['SCALELISTEDIT'] });
  R('ANNOTATIVE', async (c) => {
    const s = await c.select('Select objects to make annotative:', { filter: (e) => /^(TEXT|MTEXT|DIMENSION|LEADER|HATCH|INSERT|TOLERANCE|ATTDEF)$/.test(e.type) });
    if (!s.length) return;
    const k = await c.getKw('Enter option [Yes/No] <Yes>:', 'Yes'); if (k == null) return;
    const d = doc(), f = annoFactor(d.vars.CANNOSCALE);
    d.begin('ANNOTATIVE');
    for (const e of s) d.mod(e, (x) => {
      if (k === 'No') { for (const kk of ['anno', 'ph', 'pasz', 'pscale', 'psx', 'psy', 'af']) delete x[kk]; return; }
      x.anno = 1; x.af = 1; // el tamaño actual pasa a ser el tamaño a escala 1:1 (en papel)
      if (x.type === 'DIMENSION') { /* usa la escala del estilo */ }
    });
    applyAnno(d, f);
    d.end(); c.print(`${s.length} object(s) changed.`); redraw();
  });

  // ======================= EDITOR DE TEXTO IN SITU =======================
  app.ui.mtextEdit = (o) => {
    if (app.settings.mtextDialog || !o.p || !app.view) return app.ui.dlg.mtext(o);
    return new Promise((resolve) => {
      const v = app.view, host = v.host, sp = v.toScreen(o.p), sc = v.cur.s;
      const px = Math.max(10, Math.min(72, (o.h || 2.5) * sc));
      const ta = h('textarea', { class: 'ipm-ta', spellcheck: 'true', style: { fontSize: px + 'px', lineHeight: '1.25', width: (o.w ? Math.max(80, o.w * sc) : Math.max(220, px * 12)) + 'px', fontFamily: (doc().styles[o.style]?.font || 'Arial').replace(/\.shx$/i, '') + ', Arial, sans-serif' } });
      ta.value = String(o.text || '').replace(/\\P/g, '\n');
      const hi = h('input', { type: 'number', step: 'any', value: o.h || 2.5, class: 'fld', title: tr('Altura de texto'), style: { width: '70px' } });
      const sym = (s) => h('button', { class: 'btn', type: 'button', text: s, onclick: () => { ta.setRangeText(s, ta.selectionStart, ta.selectionEnd, 'end'); ta.focus(); } });
      const wrap = h('div', { class: 'ipm', style: { left: sp.x + 'px', top: sp.y + 'px', transform: o.rot ? `rotate(${-o.rot}rad)` : '', transformOrigin: '0 0' } });
      const bar = h('div', { class: 'ipm-bar' }, h('span', { text: tr('Altura de texto') }), hi, sym('Ø'), sym('°'), sym('±'), sym('²'), sym('³'),
        h('button', { class: 'btn pri', type: 'button', text: tr('Cerrar editor de texto'), onclick: () => done(true) }), h('button', { class: 'btn', type: 'button', text: tr('Cancelar'), onclick: () => done(false) }));
      wrap.append(bar, ta);
      const done = (ok) => {
        wrap.remove(); document.removeEventListener('pointerdown', outside, true);
        app.ui?.cmdline?.focus?.();
        resolve(ok ? { text: ta.value.replace(/\r?\n/g, '\\P'), h: +hi.value || o.h } : null);
      };
      const outside = (e) => { if (!wrap.contains(e.target)) done(true); };
      ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); done(false); } else if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); done(true); } });
      hi.addEventListener('keydown', (e) => e.stopPropagation());
      hi.addEventListener('change', () => { ta.style.fontSize = Math.max(10, Math.min(72, (+hi.value || 2.5) * sc)) + 'px'; });
      host.append(wrap);
      setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); document.addEventListener('pointerdown', outside, true); }, 30);
    });
  };

  // ======================= ALINEAR TEXTOS =======================
  R('TEXTALIGN', async (c) => {
    const s = await c.select('Select text objects to align:', { filter: (e) => e.type === 'TEXT' || e.type === 'MTEXT' || e.type === 'ATTDEF' });
    if (!s.length) return;
    let base;
    for (;;) {
      const r = await c.ask({ kind: 'entity', prompt: 'Select text to align to or [Options/Points]:', filter: (e) => e.type === 'TEXT' || e.type === 'MTEXT' });
      if (r == null) return;
      if (r === 'Options') { const sp = await c.getKw('Enter alignment option [Distribute/Set spacing/Current vertical/Current horizontal] <Current vertical>:', 'Current vertical'); eng._taMode = sp; continue; }
      if (r === 'Points') { const p1 = need(await c.getPoint('Specify first point:')); base = { p: p1 }; break; }
      base = r.e; break;
    }
    const org = base.p, pick = need(await c.getPoint('Specify second point:', { base: org }));
    const u = G.norm(G.sub(pick, org));
    const others = s.filter((e) => e !== base);
    const anchor = (e) => (e.type === 'TEXT' && (e.ha || e.va) && e.p2 ? e.p2 : e.p);
    const mode = eng._taMode || 'Current vertical';
    const d = doc(); d.begin('TEXTALIGN');
    const sorted = others.slice().sort((a, b) => G.dot(G.sub(anchor(a), org), u) - G.dot(G.sub(anchor(b), org), u));
    const total = sorted.length ? G.dot(G.sub(anchor(sorted.at(-1)), org), u) : 0;
    sorted.forEach((e, i) => {
      const a = anchor(e);
      const t = mode === 'Distribute' ? total * (i + 1) / sorted.length : G.dot(G.sub(a, org), u);
      const np = G.add(org, G.mul(u, t)), dv = G.sub(np, a);
      d.mod(e, (x) => { x.p = G.add(x.p, dv); if (x.p2) x.p2 = G.add(x.p2, dv); });
    });
    d.end(); redraw();
  }, { alias: ['TA'] });

  // ======================= ORTOGRAFÍA =======================
  // Usa el corrector ortográfico del navegador (subrayado en rojo; clic derecho para sugerencias).
  R('SPELL', async (c) => {
    const d = doc();
    let ents = await c.select('Select objects or [All] <All>:', { filter: (e) => /TEXT|ATTDEF|TABLE/.test(e.type) || (e.type === 'INSERT' && e.attribs?.length) });
    if (!ents.length) ents = d.space.filter((e) => /TEXT|ATTDEF|TABLE/.test(e.type) || (e.type === 'INSERT' && e.attribs?.length));
    const items = [];
    for (const e of ents) {
      if (e.type === 'TEXT' || e.type === 'MTEXT') items.push({ e, get: () => E.decodeSpecial ? e.text.replace(/\\P/g, '\n') : e.text, set: (x, v) => (x.text = e.type === 'MTEXT' ? v.replace(/\n/g, '\\P') : v) });
      else if (e.type === 'ATTDEF') items.push({ e, get: () => e.prompt || '', set: (x, v) => (x.prompt = v) });
      else if (e.type === 'INSERT') e.attribs.forEach((a, i) => items.push({ e, get: () => a.text, set: (x, v) => { x.attribs[i] = { ...x.attribs[i], text: v }; E.invalidate(x.attribs[i]); } }));
      else if (e.type === 'TABLE') e.cells.forEach((row, i) => row.forEach((cv, j) => { if (cv && /[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2}/.test(cv)) items.push({ e, get: () => String(cv), set: (x, v) => (x.cells[i][j] = v) }); }));
    }
    if (!items.length) { c.print('No text found.'); return; }
    const lang = { es: 'es', gl: 'gl', pt: 'pt', ca: 'ca', en: 'en' }[app.settings.lang] || 'es';
    const tas = items.map((it) => { const t = h('textarea', { class: 'fld', spellcheck: 'true', lang, rows: Math.min(4, it.get().split('\n').length), style: { width: '520px', display: 'block', marginBottom: '4px' } }); t.value = it.get(); return t; });
    const res = await app.ui.dlg.open({ title: 'Revisar ortografía', width: 'auto', body: [h('div', { class: 'hint', text: tr('Las palabras desconocidas aparecen subrayadas; pulse con el botón derecho para ver sugerencias.') }), h('div', { style: { maxHeight: '60vh', overflow: 'auto' } }, tas)], onOk: () => true,
      init: (box) => setTimeout(() => tas.forEach((t) => { t.focus(); t.blur(); }), 50) });
    if (!res) return;
    let n = 0; d.begin('SPELL');
    items.forEach((it, i) => { if (tas[i].value !== it.get()) { d.mod(it.e, (x) => it.set(x, tas[i].value)); n++; } });
    d.end(); c.print(`Spelling check complete. ${n} change(s).`); redraw();
  }, { alias: ['SP'] });
}
