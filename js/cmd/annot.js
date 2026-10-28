// Texto, cotas, directrices y sombreado
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';
import { HATCHES } from '../core/tables.js';
import { findBoundary } from './boundary.js';
import { listUserShx, addUserShx, parseSHX } from '../core/fonts.js';
const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v, d = 4) => G.fmt(v, d);
const JUST = { L: [0, 0], C: [1, 0], R: [2, 0], A: [3, 0], M: [4, 0], F: [5, 0], TL: [0, 3], TC: [1, 3], TR: [2, 3], ML: [0, 2], MC: [1, 2], MR: [2, 2], BL: [0, 1], BC: [1, 1], BR: [2, 1] };

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, fn, o) => eng.register(n, fn, o);
  const typed = () => app.ui?.cmdline?.value?.() ?? '';

  // ---------------- TEXT (DTEXT)
  R('TEXT', async (c) => {
    const v = doc().vars;
    c.print(`Current text style:  "${v.TEXTSTYLE}"  Text height:  ${F(v.TEXTSIZE)}  Annotative:  No  Justify:  ${c._just || 'Left'}`);
    let just = c._justKey || 'L';
    let p = need(await c.getPoint('Specify start point of text or [Justify/Style]:'));
    while (!isPt(p)) {
      if (p === 'Justify') {
        const j = await c.getKw('Enter an option [Left/Center/Right/Align/Middle/Fit/TL/TC/TR/ML/MC/MR/BL/BC/BR]:');
        if (j) { just = { Left: 'L', Center: 'C', Right: 'R', Align: 'A', Middle: 'M', Fit: 'F' }[j] || j; c._justKey = just; c._just = j; }
      } else if (p === 'Style') { const s = await c.getString(`Enter style name or [?] <${v.TEXTSTYLE}>:`, { def: v.TEXTSTYLE }); if (s && doc().styles[s]) v.TEXTSTYLE = s; }
      p = need(await c.getPoint(just === 'L' ? 'Specify start point of text or [Justify/Style]:' : 'Specify insertion point of text:'));
    }
    let p2 = null;
    if (just === 'A' || just === 'F') p2 = need(await c.getPoint('Specify second endpoint of text baseline:', { base: p }));
    let h = v.TEXTSIZE;
    if (just !== 'A') { h = need(await c.getDist(`Specify height <${F(v.TEXTSIZE)}>:`, { base: p, def: v.TEXTSIZE })); v.TEXTSIZE = h; }
    let rot = 0;
    if (!p2) rot = need(await c.getAngle(`Specify rotation angle of text <${F(G.deg(c._trot || 0), 0)}>:`, { base: p, def: c._trot || 0 }));
    c._trot = rot;
    const [ha, va] = JUST[just] || [0, 0];
    let cur = p;
    const mk = (s, at) => { const e = { type: 'TEXT', p: at, h, rot, text: s, ha, va, style: v.TEXTSTYLE }; if (ha || va) e.p2 = p2 && (ha === 3 || ha === 5) ? p2 : at; if (p2 && (ha === 3 || ha === 5)) { e.p = at; e.p2 = G.add(at, G.sub(p2, p)); } return e; };
    for (;;) {
      const s = await c.ask({ kind: 'string', prompt: 'Enter text:', spaces: true, preview: () => [mk(typed() || '|', cur)] });
      if (s == null || s === '') return;
      doc().add(mk(s, cur));
      cur = G.add(cur, G.rotate({ x: 0, y: -h * 5 / 3 }, { x: 0, y: 0 }, rot));
      app.view.redraw();
    }
  }, { alias: ['DTEXT'] });

  // ---------------- MTEXT
  R('MTEXT', async (c) => {
    const v = doc().vars;
    c.print(`Current text style:  "${v.TEXTSTYLE}"  Text height:  ${F(v.TEXTSIZE)}  Annotative:  No`);
    const p1 = need(await c.getPoint('Specify first corner:'));
    let h = v.TEXTSIZE, att = 1, rot = 0, p2;
    for (;;) {
      p2 = need(await c.getPoint('Specify opposite corner or [Height/Justify/Line spacing/Rotation/Style/Width/Columns]:', { base: p1, rubber: 'rect' }));
      if (isPt(p2)) break;
      if (p2 === 'Height') { h = need(await c.getDist(`Specify height <${F(h)}>:`, { base: p1, def: h })); v.TEXTSIZE = h; }
      if (p2 === 'Rotation') rot = need(await c.getAngle('Specify rotation angle <0>:', { base: p1, def: 0 }));
      if (p2 === 'Justify') { const j = await c.getKw('Enter justification [TL/TC/TR/ML/MC/MR/BL/BC/BR] <TL>:', 'TL'); att = ['TL', 'TC', 'TR', 'ML', 'MC', 'MR', 'BL', 'BC', 'BR'].indexOf(j) + 1 || 1; }
      if (p2 === 'Width') { const w = need(await c.getDist('Specify width:', { base: p1 })); p2 = G.add(p1, { x: w, y: -h }); break; }
    }
    const w = Math.abs(p2.x - p1.x);
    const top = { x: Math.min(p1.x, p2.x), y: Math.max(p1.y, p2.y) };
    const res = await app.ui.dlg.mtext({ text: '', h, w });
    if (!res || !res.text) return;
    const col = (att - 1) % 3, row = Math.floor((att - 1) / 3);
    const H = Math.abs(p2.y - p1.y);
    const ins = { x: top.x + (col === 1 ? w / 2 : col === 2 ? w : 0), y: top.y - (row === 1 ? H / 2 : row === 2 ? H : 0) };
    doc().add({ type: 'MTEXT', p: ins, h: res.h || h, w, text: res.text, att, rot, style: v.TEXTSTYLE });
  });

  // ---------------- DDEDIT / TEXTEDIT
  R('DDEDIT', async (c) => {
    for (;;) {
      const s = await c.select('Select an annotation object or [Undo]:', { single: true, filter: (e) => ['TEXT', 'MTEXT', 'ATTDEF', 'DIMENSION', 'INSERT'].includes(e.type) });
      const e = s[0]; if (!e) return;
      if (e.type === 'TEXT') { const t = await app.ui.dlg.prompt('Editar texto', 'Texto:', e.text); if (t != null) doc().mod(e, (x) => (x.text = t)); }
      else if (e.type === 'MTEXT') { const r = await app.ui.dlg.mtext({ text: e.text.replace(/\\P/g, '\n'), h: e.h, w: e.w }); if (r) doc().mod(e, (x) => { x.text = r.text; x.h = r.h; }); }
      else if (e.type === 'ATTDEF') { const r = await app.ui.dlg.form('Editar definición de atributo', [{ k: 'tag', l: 'Identificador', v: e.tag }, { k: 'prompt', l: 'Mensaje', v: e.prompt || '' }, { k: 'def', l: 'Valor por defecto', v: e.def || '' }]); if (r) doc().mod(e, (x) => Object.assign(x, r)); }
      else if (e.type === 'DIMENSION') { const t = await app.ui.dlg.prompt('Editar texto de cota', 'Texto (<> = medida):', e.text || '<>'); if (t != null) doc().mod(e, (x) => (x.text = t)); }
      else if (e.type === 'INSERT') { c.sel = [e]; await editAttribs(c, e); }
      app.view.redraw();
      if (c.pickfirst?.length === 0 && !c.req) { /* continuar */ }
      return;
    }
  }, { alias: ['TEXTEDIT', 'ED'] });
  const editAttribs = async (c, e) => {
    if (!e.attribs || !e.attribs.length) { c.print('Block has no attributes.'); return; }
    const r = await app.ui.dlg.form(`Editor de atributos mejorado — ${e.name}`, e.attribs.map((a, i) => ({ k: 'a' + i, l: a.tag, v: a.text })));
    if (!r) return;
    doc().mod(e, (x) => x.attribs.forEach((a, i) => { a.text = r['a' + i]; E.invalidate(a); }));
    app.view.redraw();
  };
  R('EATTEDIT', async (c) => { const s = await c.select('Select a block:', { single: true, filter: (e) => e.type === 'INSERT' }); if (s[0]) await editAttribs(c, s[0]); }, { alias: ['ATTEDIT', 'DDATTE'] });

  // ---------------- STYLE
  R('STYLE', async (c) => {
    const d = doc();
    const cur = d.styles[d.vars.TEXTSTYLE]?.font || 'Arial';
    const fontOpts = [...['Arial', 'Times New Roman', 'Courier New', 'Verdana'].map((f) => ({ v: f, l: f + ' (TrueType)' })),
      ...['txt', 'simplex', 'romans', 'romand', 'romanc', 'romant', 'isocp', 'isoct', 'iso3098', 'italic', 'gothice', 'greeks', 'scripts', 'scriptc'].map((f) => ({ v: f + '.shx', l: f + '.shx' })),
      ...listUserShx().map((f) => ({ v: f + '.shx', l: f + '.shx ★' })), { v: '__load', l: 'Cargar archivo SHX…' }];
    if (!fontOpts.some((o) => o.v.toLowerCase() === cur.toLowerCase())) fontOpts.unshift({ v: cur, l: cur });
    const r = await app.ui.dlg.form('Estilo de texto', [
      { k: 'name', l: 'Nombre de estilo', v: d.vars.TEXTSTYLE }, { k: 'font', l: 'Fuente', v: fontOpts.find((o) => o.v.toLowerCase() === cur.toLowerCase())?.v || cur, t: 'select', opts: fontOpts },
      { k: 'h', l: 'Altura (0 = variable)', v: d.styles[d.vars.TEXTSTYLE]?.h || 0, t: 'number' }, { k: 'wf', l: 'Factor de anchura', v: d.styles[d.vars.TEXTSTYLE]?.wf || 1, t: 'number' },
    ]);
    if (!r) return;
    if (r.font === '__load') { const f = await loadShxFile(); if (!f) return; r.font = f; }
    d.touchTables(); d.styles[r.name] = { name: r.name, font: r.font, h: +r.h, wf: +r.wf }; d.vars.TEXTSTYLE = r.name;
    for (const e of d.allEntsDeep()) if (/TEXT|ATT|DIMENSION/.test(e.type)) E.invalidate(e);
    if (+r.h > 0) d.vars.TEXTSIZE = +r.h;
    c.print(`Text style "${r.name}" is now current.`);
  }, { alias: ['ST'] });
  // carga de archivos SHX propios (se guardan en el navegador)
  const loadShxFile = async () => {
    const f = await app.io.pickFile('.shx'); if (!f) return null;
    try { const buf = await f.arrayBuffer(); parseSHX(buf, f.name); await addUserShx(f.name, buf); app.log(`Fuente ${f.name} cargada.`); return f.name.toLowerCase(); }
    catch (err) { app.log(`${f.name}: no es un archivo SHX válido (${err.message}).`); return null; }
  };
  R('SHXLOAD', async () => { await loadShxFile(); for (const e of doc().allEntsDeep()) if (/TEXT|ATT|DIMENSION/.test(e.type)) E.invalidate(e); app.view.redraw(); }, { alias: ['CARGASHX'] });

  // ---------------- COTAS
  const addDim = (o) => { const e = doc().add({ type: 'DIMENSION', ...o }); eng.lastDim = e; eng.print(`Dimension text = ${E.decodeSpecial(E.dimText(e, { ...E.DIMDEF, ...doc().dimstyle }))}`); return e; };
  const dimLocation = async (c, base, kinds) => {
    let text = null, forced = null, rot = 0;
    for (;;) {
      const p = need(await c.getPoint(kinds, { preview: (q) => [base(q, forced, rot, text)] }));
      if (isPt(p)) return base(p, forced, rot, text);
      if (p === 'Horizontal') forced = 'h';
      else if (p === 'Vertical') forced = 'v';
      else if (p === 'Rotated') { rot = need(await c.getAngle('Specify angle of dimension line <0>:', { def: 0 })); forced = 'r'; }
      else if (p === 'Text' || p === 'Mtext') { text = await c.getString('Enter dimension text <>:', { spaces: true, def: '<>' }); }
      else if (p === 'Angle') { await c.getAngle('Specify angle of dimension text:'); }
    }
  };
  const pickExtPoints = async (c, allowAngular = false) => {
    let p1 = need(await c.getPoint('Specify first extension line origin or <select object>:', { def: 'select' }));
    if (p1 === 'select') {
      const s = need(await c.entsel('Select object to dimension:', { filter: (e) => ['LINE', 'ARC', 'CIRCLE', 'LWPOLYLINE'].includes(e.type) }));
      const e = s.e;
      if (e.type === 'LINE') return [e.p1, e.p2];
      if (e.type === 'ARC') return [G.polar(e.c, e.a1, e.r), G.polar(e.c, e.a2, e.r)];
      if (e.type === 'CIRCLE') { const a = G.ang(e.c, s.p); return [G.polar(e.c, a, e.r), G.polar(e.c, a + Math.PI, e.r)]; }
      if (e.type === 'LWPOLYLINE') { const sg = E.polySegs(e).sort((a, b) => G.primDist(a, s.p) - G.primDist(b, s.p))[0]; return sg.k === 'L' ? [sg.a, sg.b] : [G.polar(sg.c, sg.a1, sg.r), G.polar(sg.c, sg.a2, sg.r)]; }
    }
    void allowAngular;
    const p2 = need(await c.getPoint('Specify second extension line origin:', { base: p1 }));
    return [p1, p2];
  };
  R('DIMLINEAR', async (c) => {
    const [p1, p2] = await pickExtPoints(c);
    const build = (q, forced, rot, text) => {
      let r = 0;
      if (forced === 'h') r = 0; else if (forced === 'v') r = Math.PI / 2; else if (forced === 'r') r = rot;
      else {
        const inX = q.x > Math.min(p1.x, p2.x) && q.x < Math.max(p1.x, p2.x), inY = q.y > Math.min(p1.y, p2.y) && q.y < Math.max(p1.y, p2.y);
        if (inY && !inX) r = Math.PI / 2; else if (inX && !inY) r = 0; else r = Math.abs(q.x - (p1.x + p2.x) / 2) > Math.abs(q.y - (p1.y + p2.y) / 2) ? Math.PI / 2 : 0;
      }
      return { type: 'DIMENSION', dt: 'linear', p1, p2, dp: q, rot: r, text: text ?? undefined };
    };
    const d = await dimLocation(c, build, 'Specify dimension line location or [Mtext/Text/Angle/Horizontal/Vertical/Rotated]:');
    addDim(d);
  }, { alias: ['DIMLIN'] });
  R('DIMALIGNED', async (c) => {
    const [p1, p2] = await pickExtPoints(c);
    const d = await dimLocation(c, (q, f, r, text) => ({ type: 'DIMENSION', dt: 'aligned', p1, p2, dp: q, text: text ?? undefined }), 'Specify dimension line location or [Mtext/Text/Angle]:');
    addDim(d);
  }, { alias: ['DIMALI'] });
  const radial = (dia) => async (c) => {
    const s = need(await c.entsel(`Select arc or circle:`, { filter: (e) => e.type === 'ARC' || e.type === 'CIRCLE' || (e.type === 'LWPOLYLINE' && e.pts.some((p) => p.b)) }));
    let cc = s.e.c, r = s.e.r;
    if (s.e.type === 'LWPOLYLINE') { const sg = E.polySegs(s.e).filter((x) => x.k === 'A').sort((a, b) => G.primDist(a, s.p) - G.primDist(b, s.p))[0]; cc = sg.c; r = sg.r; }
    const build = (q, f, rr, text) => { const a = G.ang(cc, q); return dia ? { type: 'DIMENSION', dt: 'diameter', p1: G.polar(cc, a, r), p2: G.polar(cc, a + Math.PI, r), dp: q, text: text ?? undefined } : { type: 'DIMENSION', dt: 'radius', c: cc, p1: G.polar(cc, a, r), dp: q, text: text ?? undefined }; };
    addDim(await dimLocation(c, build, 'Specify dimension line location or [Mtext/Text/Angle]:'));
  };
  R('DIMRADIUS', radial(false), { alias: ['DIMRAD'] });
  R('DIMDIAMETER', radial(true), { alias: ['DIMDIA'] });
  R('DIMANGULAR', async (c) => {
    const s = await c.entsel('Select arc, circle, line, or <specify vertex>:', {});
    let cc, p1, p2;
    if (s == null || typeof s !== 'object') {
      cc = need(await c.getPoint('Specify angle vertex:'));
      p1 = need(await c.getPoint('Specify first angle endpoint:', { base: cc }));
      p2 = need(await c.getPoint('Specify second angle endpoint:', { base: cc }));
    } else if (s.e.type === 'ARC') { cc = s.e.c; p1 = G.polar(cc, s.e.a1, s.e.r); p2 = G.polar(cc, s.e.a2, s.e.r); }
    else if (s.e.type === 'CIRCLE') { cc = s.e.c; p1 = s.p; p2 = need(await c.getPoint('Specify second angle endpoint:', { base: cc })); }
    else if (s.e.type === 'LINE') {
      const s2 = need(await c.entsel('Select second line:', { filter: (e) => e.type === 'LINE' }));
      const x = G.llInter(s.e.p1, s.e.p2, s2.e.p1, s2.e.p2, true, true)[0];
      if (!x) { c.print('Lines are parallel.'); return; }
      cc = x; p1 = s.p; p2 = s2.p;
    } else { c.print('Object selected is not an arc, circle or line.'); return; }
    const build = (q, f, r, text) => ({ type: 'DIMENSION', dt: 'angular', c: cc, p1, p2, dp: q, text: text ?? undefined });
    addDim(await dimLocation(c, build, 'Specify dimension arc line location or [Mtext/Text/Angle/Quadrant]:'));
  }, { alias: ['DIMANG'] });
  R('DIMORDINATE', async (c) => {
    const p = need(await c.getPoint('Specify feature location:'));
    let forced = null;
    for (;;) {
      const q = need(await c.getPoint('Specify leader endpoint or [Xdatum/Ydatum/Mtext/Text/Angle]:', { base: p, preview: (x) => [{ type: 'DIMENSION', dt: 'ordinate', p1: p, dp: x, xord: forced ? forced === 'x' : Math.abs(x.y - p.y) > Math.abs(x.x - p.x) }] }));
      if (q === 'Xdatum') { forced = 'x'; continue; } if (q === 'Ydatum') { forced = 'y'; continue; }
      if (!isPt(q)) continue;
      addDim({ dt: 'ordinate', p1: p, dp: q, xord: forced ? forced === 'x' : Math.abs(q.y - p.y) > Math.abs(q.x - p.x) }); return;
    }
  }, { alias: ['DIMORD'] });
  const contBase = (baseline) => async (c) => {
    let last = eng.lastDim && doc().space.includes(eng.lastDim) && ['linear', 'aligned'].includes(eng.lastDim.dt) ? eng.lastDim : null;
    if (!last) { const s = need(await c.entsel(`Select ${baseline ? 'base' : 'continued'} dimension:`, { filter: (e) => e.type === 'DIMENSION' && ['linear', 'aligned'].includes(e.dt) })); last = s.e; }
    const st = { ...E.DIMDEF, ...doc().dimstyle };
    const step = (st.dimdli ?? 3.75) * (st.dimscale || 1);
    for (;;) {
      const from = baseline ? last.p1 : last.p2;
      const build = (q) => {
        const r = last.dt === 'aligned' ? G.ang(from, q) : last.rot || 0;
        let dp = last.dp;
        if (baseline) { const n = G.perp({ x: Math.cos(r), y: Math.sin(r) }); const side = Math.sign(G.dot(G.sub(last.dp, last.p1), n)) || 1; dp = G.add(last.dp, G.mul(n, side * step)); }
        return { type: 'DIMENSION', dt: last.dt === 'aligned' ? 'aligned' : 'linear', p1: from, p2: q, dp, rot: r };
      };
      const q = await c.getPoint('Specify a second extension line origin or [Select/Undo] <Select>:', { preview: (x) => [build(x)] });
      if (q == null) return;
      if (q === 'Undo') { doc().undo(); return; }
      if (!isPt(q)) continue;
      const d = addDim(build(q)); if (baseline) { last = { ...d, p2: last.p2, dp: d.dp, p1: last.p1 }; } else last = d;
      app.view.redraw();
    }
  };
  R('DIMCONTINUE', contBase(false), { alias: ['DCO', 'DIMCONT'] });
  R('DIMBASELINE', contBase(true), { alias: ['DBA', 'DIMBASE'] });
  R('DIMTEDIT', async (c) => {
    const s = need(await c.entsel('Select dimension:', { filter: (e) => e.type === 'DIMENSION' && e.dt }));
    const p = need(await c.getPoint('Specify new location for dimension text or [Left/Right/Center/Home/Angle]:'));
    doc().mod(s.e, (x) => { if (isPt(p)) x.tp = p; else if (p === 'Home') delete x.tp; });
  }, { alias: ['DIMED', 'DIMEDIT'] });
  R('DIMSTYLE', async (c) => {
    const d = doc(), st = { ...E.DIMDEF, ...d.dimstyle };
    const r = await app.ui.dlg.form('Administrador de estilos de cota — ISO-25', [
      { k: 'dimscale', l: 'Escala global (DIMSCALE)', v: st.dimscale, t: 'number' }, { k: 'dimtxt', l: 'Altura de texto (DIMTXT)', v: st.dimtxt, t: 'number' },
      { k: 'dimasz', l: 'Tamaño de flecha (DIMASZ)', v: st.dimasz, t: 'number' }, { k: 'dimexo', l: 'Desfase línea de referencia (DIMEXO)', v: st.dimexo, t: 'number' },
      { k: 'dimexe', l: 'Ampliación sobre línea de cota (DIMEXE)', v: st.dimexe, t: 'number' }, { k: 'dimgap', l: 'Desfase del texto (DIMGAP)', v: st.dimgap, t: 'number' },
      { k: 'dimdec', l: 'Decimales (DIMDEC)', v: st.dimdec, t: 'number' }, { k: 'dimlfac', l: 'Factor de escala lineal (DIMLFAC)', v: st.dimlfac ?? 1, t: 'number' },
      { k: 'dimtad', l: 'Texto sobre la línea (DIMTAD 0/1)', v: st.dimtad, t: 'number' }, { k: 'dimpost', l: 'Sufijo (DIMPOST)', v: st.dimpost || '' },
      { k: 'dimclrd', l: 'Color línea de cota (ACI, 256=PorCapa)', v: st.dimclrd, t: 'number' }, { k: 'dimclrt', l: 'Color del texto (ACI)', v: st.dimclrt, t: 'number' },
    ]);
    if (!r) return;
    d.touchTables();
    for (const [k, v] of Object.entries(r)) d.dimstyle[k] = k === 'dimpost' ? v : +v;
    d.invalidateDims(); app.view.redraw();
  }, { alias: ['DDIM', 'D'] });

  // ---------------- DIRECTRICES
  const leader = async (c, ml) => {
    const p1 = need(await c.getPoint(ml ? 'Specify leader arrowhead location or [leader Landing first/Content first/Options] <Options>:' : 'Specify first leader point, or [Settings] <Settings>:'));
    if (!isPt(p1)) return;
    const pts = [p1];
    for (;;) {
      const q = await c.getPoint(ml ? 'Specify leader landing location:' : 'Specify next point:', { base: pts[pts.length - 1], preview: (x) => [{ type: 'LEADER', pts: [...pts, x] }] });
      if (!isPt(q)) break; pts.push(q);
      if (ml || pts.length >= 3) break;
    }
    if (pts.length < 2) return;
    const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const dir = last.x >= prev.x ? 1 : -1;
    const st = { ...E.DIMDEF, ...doc().dimstyle }, h = st.dimtxt * (st.dimscale || 1);
    const land = G.add(last, { x: dir * h, y: 0 });
    let text;
    if (ml) { const r = await app.ui.dlg.mtext({ text: '', h }); text = r?.text; }
    else {
      const lines = [];
      for (;;) { const s = await c.getString(lines.length ? 'Enter next line of annotation text:' : 'Enter first line of annotation text <Mtext>:', { spaces: true }); if (!s) break; lines.push(s); }
      text = lines.join('\\P');
    }
    doc().add({ type: 'LEADER', pts: [...pts, land], arrow: true });
    if (text) doc().add({ type: 'MTEXT', p: G.add(land, { x: dir * st.dimgap * (st.dimscale || 1), y: h / 2 }), h, w: 0, text, att: dir > 0 ? 1 : 3 });
  };
  R('QLEADER', (c) => leader(c, false), { alias: ['LEADER', 'LE', 'LEAD'] });
  R('MLEADER', (c) => leader(c, true), { alias: ['MLD'] });

  // ---------------- SOMBREADO
  c_hatch(eng, app, doc);
}

function c_hatch(eng, app, doc) {
  eng.hatchOpts = { pattern: 'ANSI31', scale: 1, angle: 0, color: 256 };
  const mkHatch = (loops) => ({ type: 'HATCH', loops, pattern: eng.hatchOpts.pattern, scale: eng.hatchOpts.scale, angle: G.rad(eng.hatchOpts.angle || 0), solid: eng.hatchOpts.pattern === 'SOLID', color: eng.hatchOpts.color ?? 256 });
  const loopFrom = (e) => {
    if (e.type === 'CIRCLE') return [{ x: e.c.x - e.r, y: e.c.y, b: 1 }, { x: e.c.x + e.r, y: e.c.y, b: 1 }];
    if (e.type === 'LWPOLYLINE' && (e.closed || G.eq(e.pts[0], e.pts[e.pts.length - 1], 1e-6))) return e.pts.map((p) => ({ ...p }));
    if (e.type === 'ELLIPSE' || e.type === 'SPLINE') return (e.type === 'ELLIPSE' ? E.ellipsePoints(e) : E.splineTess(e)).map((p) => ({ x: p.x, y: p.y, b: 0 }));
    if (e.type === 'SOLID') return e.pts.map((p) => ({ ...p, b: 0 }));
    return null;
  };
  const run = async (c, dash) => {
    const o = eng.hatchOpts;
    o.pattern = doc().vars.HPNAME || o.pattern; o.scale = doc().vars.HPSCALE || o.scale; o.angle = doc().vars.HPANG || 0;
    app.ui?.ribbon?.showContext?.('hatch');
    try {
      const loops = [];
      if (dash) {
        for (;;) {
          const k = await c.getKw(`Specify internal point or [Properties/Select objects/draW boundary/remove Boundaries/Advanced/DRaw order/Origin/ANnotative/hatch Color/Layer/Transparency]:`);
          if (k === 'Properties') {
            const pn = await c.getString(`Enter a pattern name or [?/Solid/User defined/Gradient] <${o.pattern}>:`, { def: o.pattern });
            o.pattern = String(pn).toUpperCase() === 'S' ? 'SOLID' : String(pn).toUpperCase();
            if (o.pattern !== 'SOLID') { o.scale = (await c.getReal(`Specify a scale for the pattern <${F(o.scale)}>:`, { def: o.scale })) ?? o.scale; o.angle = G.deg((await c.getAngle(`Specify an angle for the pattern <${F(o.angle, 0)}>:`, { def: G.rad(o.angle) })) ?? 0); }
            continue;
          }
          break;
        }
      }
      for (;;) {
        const p = await c.getPoint('Pick internal point or [Select objects/Undo/seTtings]:', { preview: () => (loops.length ? [{ ...mkHatch(loops) }] : null) });
        if (p == null) break;
        if (p === 'Undo') { loops.pop(); continue; }
        if (p === 'seTtings') { const r = await app.ui.dlg.hatch(o); if (r) Object.assign(o, r); continue; }
        if (p === 'Select objects') {
          const s = await c.select('Select objects:', { noPickfirst: true });
          for (const e of s) { const l = loopFrom(e); if (l) loops.push(l); }
          continue;
        }
        if (isPt(p)) {
          c.print('Selecting everything...\nAnalyzing the selected data...');
          const ls = findBoundary(app, p);
          if (!ls) { c.print('Valid hatch boundary not found.'); continue; }
          loops.push(...ls);
          app.view.redrawOverlay();
        }
      }
      if (!loops.length) {
        if (c.pickfirst?.length) { for (const e of c.pickfirst) { const l = loopFrom(e); if (l) loops.push(l); } }
        if (!loops.length) return;
      }
      doc().add(mkHatch(loops));
      doc().vars.HPNAME = o.pattern; doc().vars.HPSCALE = o.scale; doc().vars.HPANG = o.angle;
    } finally { app.ui?.ribbon?.hideContext?.('hatch'); }
  };
  eng.register('HATCH', (c) => run(c, false), { alias: ['BHATCH', 'H', 'BH', 'GRADIENT'] });
  eng.register('-HATCH', (c) => run(c, true));
  eng.register('HATCHEDIT', async (c) => {
    const s = await c.select('Select hatch object:', { single: true, filter: (e) => e.type === 'HATCH' });
    const e = s[0]; if (!e) return;
    const r = await app.ui.dlg.hatch({ pattern: e.solid ? 'SOLID' : e.pattern, scale: e.scale || 1, angle: G.deg(e.angle || 0), color: e.color ?? 256 });
    if (!r) return;
    doc().mod(e, (x) => { x.pattern = r.pattern; x.solid = r.pattern === 'SOLID'; x.scale = +r.scale; x.angle = G.rad(+r.angle); x.color = r.color; delete x.pdef; });
    app.view.redraw();
  }, { alias: ['HE'] });
  void HATCHES;
}
