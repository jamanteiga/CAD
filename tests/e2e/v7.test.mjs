// Funciones v7: cotas y anotación, referencias, capas y visualización, productividad, 3D, nubes de puntos.
import { ready, typer } from './helpers.mjs';
export default async (page, t) => {
  await ready(page);
  const type = typer(page);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  const ev = (f, a) => page.evaluate(f, a);
  const esc = () => page.keyboard.press('Escape');

  // ---- estilos de cota múltiples
  await ev(() => { const d = webcad.doc; d.begin('t'); d.touchTables(); d.dimstyles.MIO = { ...d.dimstyle, dimtxt: 5 }; d.end(); d.setDimStyle('MIO'); });
  await type('_DIMLINEAR', '0,0', '50,0', '25,10');
  const dim = await ev(() => { const e = webcad.doc.model.at(-1); return { ds: e.dstyle, h: webcad.E.dimEnts(e, webcad.doc).find((x) => x.type === 'TEXT')?.h }; });
  t.eq(dim, { ds: 'MIO', h: 5 }, 'cota con estilo propio (dstyle) y altura del estilo');
  await ev(() => webcad.doc.setDimStyle('ISO-25'));
  t.eq(await ev(() => webcad.E.dimEnts(webcad.doc.model.at(-1), webcad.doc).find((x) => x.type === 'TEXT')?.h), 5, 'cambiar el estilo actual no altera cotas existentes');

  // ---- cotas asociativas
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.setvar('OSMODE', 1); });
  await type('_LINE', '0,0', '80,0', '');
  await type('_DIMLINEAR', '0,0', '80,0', '40,-15');
  t.ok(await ev(() => !!webcad.doc.model.at(-1).assoc), 'DIMASSOC 2: la cota queda asociada a la línea');
  await ev(() => { const d = webcad.doc, l = d.model[0]; d.begin('MOVE'); d.mod(l, (x) => (x.p2 = { x: 100, y: 0 })); d.end(); });
  t.eq(await ev(() => Math.round(webcad.E.dimMeasure(webcad.doc.model.at(-1)))), 100, 'la cota se actualiza al modificar la geometría');
  await ev(() => webcad.doc.undo());
  t.eq(await ev(() => Math.round(webcad.E.dimMeasure(webcad.doc.model.at(-1)))), 80, 'deshacer revierte geometría y cota en un paso');
  await ev(() => webcad.doc.setvar('OSMODE', 0));

  // ---- longitud de arco, radio con recodo, tolerancia, cota rápida, espaciado, cortes
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.add({ type: 'ARC', c: { x: 0, y: 0 }, r: 20, a1: 0, a2: Math.PI / 2 }); });
  await type('_DIMARC'); await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 14.142, y: 14.142 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('30,30');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.dt, +webcad.E.dimMeasure(e).toFixed(3), webcad.E.dimText(e, { ...webcad.E.DIMDEF, ...webcad.doc.dimstyle }).startsWith('⌒')]; }), ['arclen', 31.416, true], 'DIMARC: longitud de arco con símbolo');
  await ev(() => { webcad.doc.model.length = 0; webcad.doc.add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 40 }); });
  await type('_DIMJOGGED'); await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 40, y: 0 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('60,60', '30,20', '20,10');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.dt, Math.round(webcad.E.dimMeasure(e)), webcad.E.dimEnts(e, webcad.doc).filter((x) => x.type === 'LINE').length >= 4]; }), ['jogged', 40, true], 'DIMJOGGED: radio con recodo');
  await ev(() => { webcad.doc.model.length = 0; const d = webcad.doc; d.add({ type: 'LWPOLYLINE', pts: [{ x: 0, y: 0, b: 0 }, { x: 30, y: 0, b: 0 }, { x: 30, y: 20, b: 0 }, { x: 70, y: 20, b: 0 }], closed: false }); });
  await type('_QDIM', 'all', '', '35,-20');
  t.eq(await ev(() => webcad.doc.model.filter((e) => e.type === 'DIMENSION').map((e) => Math.round(webcad.E.dimMeasure(e)))), [30, 40], 'QDIM continua');
  await type('_DIMSPACE'); await ev(() => { webcad.cmd.submit && 0; });
  await esc(); await esc();
  const sp = await ev(() => { const d = webcad.doc, ds = d.model.filter((e) => e.type === 'DIMENSION'); d.begin('x'); d.mod(ds[1], (x) => (x.dp = { x: ds[1].dp.x, y: -22 })); d.end(); webcad.cmd.pickfirst = []; return ds.map((e) => e.hid); });
  void sp;
  await ev(async () => { const c = webcad.cmd; const p = c.run('DIMSPACE'); return true; });
  await page.mouse.click(...(await ev(() => { const e = webcad.doc.model.find((x) => x.type === 'DIMENSION'); const ln = webcad.E.dimEnts(e, webcad.doc).find((x) => x.type === 'LINE'); const s = webcad.view.toScreen(ln.p1.y === ln.p2.y ? { x: (ln.p1.x + ln.p2.x) / 2, y: ln.p1.y } : ln.p1); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('L');
  await type('', '10');
  t.eq(await ev(() => { const ds = webcad.doc.model.filter((e) => e.type === 'DIMENSION'); return Math.round(Math.abs(ds[1].dp.y - ds[0].dp.y)); }), 10, 'DIMSPACE con separación fija');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 100, y: 0 } }); d.add({ type: 'LINE', p1: { x: 50, y: -20 }, p2: { x: 50, y: 30 } }); });
  await type('_DIMLINEAR', '0,0', '100,0', '50,10', '_DIMBREAK', 'L', '_M', 'L', '', '');
  t.ok(await ev(() => (webcad.doc.model.at(-1).brk || []).length >= 1), 'DIMBREAK: puntos de corte automáticos');
  await ev(() => { webcad.doc.add({ type: 'TOLERANCE', p: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, h: 2.5, rows: [['⌖', '⌀0.05Ⓜ', 'A']] }); });
  t.eq(await ev(() => webcad.E.explodeEnt(webcad.doc.model.at(-1), webcad.doc).map((e) => e.type).join()), 'LWPOLYLINE,TEXT,LWPOLYLINE,TEXT,LWPOLYLINE,TEXT', 'TOLERANCE: marco de control con 3 casillas');

  // ---- escala de anotación
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'TEXT', p: { x: 0, y: 0 }, h: 2.5, text: 'A' }); });
  await type('_ANNOTATIVE', 'L', '', '');
  await type('_CANNOSCALE', '1:50');
  t.eq(await ev(() => webcad.doc.model.at(-1).h), 125, 'texto anotativo a escala 1:50');
  await type('_CANNOSCALE', '1:1');
  t.eq(await ev(() => webcad.doc.model.at(-1).h), 2.5, 'vuelve a 1:1');

  // ---- estilos de directriz y de tabla
  await ev(() => { const d = webcad.doc; webcad.cmd.ensureStdStyles(); d.begin('x'); d.touchTables(); d.ext.mleaderstyles.GRANDE = { ...d.ext.mleaderstyles.Standard, txt: 5, land: 3 }; d.end(); d.setvar('CMLEADERSTYLE', 'GRANDE'); });
  t.ok(await ev(() => webcad.cmd.tableStyle().rowh === 7 && webcad.doc.vars.CMLEADERSTYLE === 'GRANDE'), 'estilos de directriz múltiple y de tabla');

  // ---- alinear textos
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'TEXT', p: { x: 0, y: 0 }, h: 2.5, text: 'A' }); d.add({ type: 'TEXT', p: { x: 7, y: 10 }, h: 2.5, text: 'B' }); d.add({ type: 'TEXT', p: { x: -4, y: 20 }, h: 2.5, text: 'C' }); webcad.cmd.sel = [d.model[1], d.model[2]]; });
  await type('_TEXTALIGN');
  await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 0.5, y: 1 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('0,50');
  t.eq(await ev(() => webcad.doc.model.map((e) => Math.round(e.p.x))), [0, 0, 0], 'TEXTALIGN alinea en vertical');

  // ---- editor in situ
  await type('_MTEXT', '0,0', '40,-10');
  await page.waitForSelector('.ipm textarea');
  await page.keyboard.type('Hola');
  await page.keyboard.press('Control+Enter');
  t.eq(await ev(() => webcad.doc.model.at(-1).text), 'Hola', 'MTEXT con editor de texto in situ');
  t.eq(errs, [], 'sin errores de página (anotación)');

  // ---- imágenes
  const png = await ev(() => { const c = document.createElement('canvas'); c.width = 40; c.height = 20; const x = c.getContext('2d'); x.fillStyle = '#c00'; x.fillRect(0, 0, 40, 20); return c.toDataURL(); });
  await ev(async (src) => { webcad.doc.model.length = 0; await webcad.attachImage('rojo.png', src, { x: 0, y: 0 }, 40); }, png);
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.type, e.u.x, e.v.y, !!webcad.doc.ext.images[e.img]?.data]; }), ['IMAGE', 40, 20, true], 'IMAGEATTACH: imagen con tamaño y datos incrustados');
  await page.waitForTimeout(150);
  await ev(() => { webcad.view.setCur({ cx: 20, cy: 10, s: 5 }); webcad.view.redraw(); }); await page.waitForTimeout(150);
  const px = await ev(() => { const s = webcad.view.toScreen({ x: 20, y: 10 }); const cv = webcad.view.cv, r = webcad.view.dpr, hr = webcad.view.host.getBoundingClientRect(), cr = cv.getBoundingClientRect(); return [...cv.getContext('2d').getImageData(Math.round((hr.left + s.x - cr.left) * r), Math.round((hr.top + s.y - cr.top) * r), 1, 1).data].slice(0, 3); });
  t.ok(px[0] > 150 && px[1] < 80, `la imagen se dibuja en pantalla (${px})`);
  t.eq(await ev(() => webcad.view.pickAt({ x: 20, y: 10 })?.type), 'IMAGE', 'designar la imagen pulsando dentro');
  await type('_IMAGECLIP'); await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 20, y: 10 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('', 'R', '0,0', '20,20');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.clipOn, e.clip.length, webcad.E.entBBox(e, webcad.doc).x2]; }), [true, 4, 20], 'IMAGECLIP rectangular');
  await ev(() => webcad.view.setCur({ cx: 100, cy: 50, s: 3 }));

  // ---- PDF: importación vectorial y adjunto
  const pdfb64 = await ev(async () => {
    if (!window.jspdf) await new Promise((ok) => { const s = document.createElement('script'); s.src = 'vendor/jspdf/jspdf.umd.min.js'; s.onload = ok; document.head.append(s); });
    const p = new jspdf.jsPDF({ unit: 'mm', format: [100, 50], orientation: 'landscape' }); p.line(10, 10, 90, 10); p.rect(10, 20, 30, 20); p.setFontSize(20); p.text('Hola PDF', 50, 30);
    const u8 = new Uint8Array(p.output('arraybuffer')); let s = ''; for (const b of u8) s += String.fromCharCode(b); return btoa(s);
  });
  const imp = await ev(async (b64) => {
    const u8 = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const pdf = await webcad.openPdf(u8.buffer); const page = await pdf.getPage(1);
    const ents = await webcad.pdfPageToEnts(page, {});
    const ln = ents.find((e) => e.type === 'LINE' || (e.type === 'LWPOLYLINE' && !e.closed));
    const rc = ents.find((e) => e.type === 'LWPOLYLINE' && e.closed);
    const tx = ents.find((e) => e.type === 'TEXT');
    const len = ln ? (ln.type === 'LINE' ? Math.hypot(ln.p2.x - ln.p1.x, ln.p2.y - ln.p1.y) : Math.hypot(ln.pts.at(-1).x - ln.pts[0].x, ln.pts.at(-1).y - ln.pts[0].y)) : 0;
    return { n: pdf.numPages, len: Math.round(len), rect: rc ? Math.round(webcad.E.entArea(rc)) : 0, text: tx?.text, y: ln ? Math.round(ln.p1?.y ?? ln.pts[0].y) : null };
  }, pdfb64);
  t.eq(imp, { n: 1, len: 80, rect: 600, text: 'Hola PDF', y: 40 }, 'PDFIMPORT: líneas, rectángulos y texto a escala real (mm)');

  // ---- hipervínculos
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 5 }); webcad.cmd.sel = [d.model[0]]; });
  await type('_-HYPERLINK', 'I', 'https://example.org', 'Ejemplo');
  t.eq(await ev(() => [webcad.doc.model[0].url, webcad.doc.model[0].urlDesc]), ['https://example.org', 'Ejemplo'], '-HYPERLINK inserta vínculo');
  t.eq(errs, [], 'sin errores de página (referencias)');

  // ---- transparencia
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.begin('x'); d.touchTables(); d.ensureLayer('T50', {}); d.layers.T50.transp = 50; d.end(); d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, layer: 'T50' }); d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 }, transp: 80 }); });
  t.eq(await ev(async () => { const R = await import('./js/view/renderer.js'); const d = webcad.doc; return d.model.map((e) => +R.entAlpha(e, d, {}).toFixed(2)); }), [0.5, 0.2], 'transparencia por capa y por objeto');
  await ev(() => webcad.doc.setvar('CETRANSPARENCY', 30)); await type('_LINE', '0,0', '5,5', '');
  t.eq(await ev(() => webcad.doc.model.at(-1).transp), 30, 'CETRANSPARENCY en objetos nuevos');
  await ev(() => webcad.doc.setvar('CETRANSPARENCY', -1));

  // ---- estados de capa
  await ev(() => { webcad.layerStates.save('TODO'); const d = webcad.doc; d.layers.T50.on = false; d.layers.T50.color = 3; });
  await type('_-LAYERSTATE', 'R', 'TODO');
  t.eq(await ev(() => [webcad.doc.layers.T50.on, webcad.doc.layers.T50.color]), [true, 7], 'guardar y restaurar estado de capa');

  // ---- SCP
  await type('_UCS', '100,100', '100,200');
  t.eq(await ev(() => { const u = webcad.doc.ext.ucs; return [u.o.x, u.o.y, Math.round(u.a * 180 / Math.PI)]; }), [100, 100, 90], 'UCS por origen y eje X');
  await type('_LINE', '0,0', '10,0', '');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.p1.x, e.p1.y, Math.round(e.p2.x), Math.round(e.p2.y)]; }), [100, 100, 100, 110], 'coordenadas escritas en el SCP');
  await type('_LINE', '*0,0', '*5,0', '');
  t.eq(await ev(() => webcad.doc.model.at(-1).p1.x), 0, 'prefijo * = coordenadas universales');
  await type('_UCS', '_W');
  t.eq(await ev(() => webcad.doc.ext.ucs), null, 'UCS Universal');

  // ---- VPLAYER
  await ev(() => { const d = webcad.doc; webcad.setLayout(d.layouts[0].name); });
  const inLayout = await ev(() => webcad.doc.active !== 'Model');
  if (inLayout) {
    await ev(() => { const d = webcad.doc; if (!d.layout.ents.some((e) => e.type === 'VIEWPORT')) d.add({ type: 'VIEWPORT', c: { x: 150, y: 100 }, w: 200, h: 150, vc: { x: 0, y: 0 }, scale: 1 }, d.layout.ents); });
    await type('_VPLAYER', '_F', 'T50', '_A', '');
    t.ok(await ev(() => webcad.doc.layout.ents.filter((e) => e.type === 'VIEWPORT').every((v) => (v.frozen || []).includes('T50'))), 'VPLAYER inutiliza capa en todas las ventanas');
    await type('_VPLAYER', '_C', 'T50', '1', '_A', '');
    t.ok(await ev(() => webcad.doc.layout.ents.find((e) => e.type === 'VIEWPORT').ovr?.T50?.color === 1), 'VPLAYER color de capa por ventana');
    await ev(() => { webcad.setLayout('Model'); });
  } else t.ok(false, 'no se pudo activar la presentación');

  // ---- VPORTS
  await ev(() => { if (webcad.doc.active !== 'Model') webcad.setLayout('Model'); });
  await type('_-VPORTS', '4');
  await page.waitForTimeout(100);
  const vpinfo = await ev(() => ({ n: webcad.doc.ext.vports?.tiles.length, w: webcad.view.W, hw: webcad.view.host.clientWidth, ovw: webcad.view.ov.style.width }));
  t.ok(vpinfo.n === 4 && Math.abs(vpinfo.w - vpinfo.hw / 2) <= 1 && vpinfo.ovw.endsWith('px'), `VPORTS 4 ventanas (${JSON.stringify(vpinfo)})`);
  await page.mouse.click(...(await ev(() => { const r = webcad.view.host.getBoundingClientRect(); return [r.left + r.width * 0.75, r.top + r.height * 0.75]; })));
  t.eq(await ev(() => webcad.doc.ext.vports.act), 3, 'pulsar en otra ventana la activa');
  await type('_LINE', '0,0', '20,20', '');
  t.eq(await ev(() => webcad.doc.model.at(-1).p2.x), 20, 'dibujar en una ventana en mosaico');
  await type('_-VPORTS', '_SI');
  t.eq(await ev(() => [webcad.doc.ext.vports, webcad.view.W === webcad.view.host.clientWidth]), [null, true], 'volver a una sola ventana');
  t.eq(errs, [], 'sin errores de página (capas y visualización)');

  // ---- grabadora de acciones
  await ev(() => { webcad.doc.model.length = 0; localStorage.removeItem('webcad.actions.v1'); });
  await type('_ACTRECORD', '_LINE', '0,0', '10,0', '', '_CIRCLE', '5,5', '2', '_ACTSTOP', 'PRUEBA');
  t.eq(await ev(() => webcad.doc.model.map((e) => e.type)), ['LINE', 'CIRCLE'], 'grabación de acciones');
  await ev(() => { webcad.doc.model.length = 0; });
  await type('_ACTPLAY', 'PRUEBA');
  await page.waitForTimeout(300);
  t.eq(await ev(() => webcad.doc.model.map((e) => [e.type, e.p2?.x ?? e.r])), [['LINE', 10], ['CIRCLE', 2]], 'reproducción de la macro de acción');

  // ---- comparar dibujos
  const cmpres = await ev(async () => { const d = webcad.doc; const other = await webcad.io.docFromText?.('b.wcad', d.serialize()); return !!other; });
  void cmpres;
  t.eq(await ev(async () => { const D = (await import('./js/core/document.js')).Doc; const o = new D(); o.load(JSON.parse(webcad.doc.serialize())); o.model.pop(); o.model.push({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 0, y: 9 } }); const r = webcad.compareDocs(o); return [r.a.length, r.b.length, r.same]; }), [1, 1, 1], 'DWGCOMPARE: diferencias en ambos sentidos');

  // ---- líneas múltiples
  await ev(() => { webcad.doc.model.length = 0; });
  await type('_MLINE', '_J', '_Z', '_S', '20', '0,0', '100,0', '100,50', '');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); const sub = webcad.E.explodeEnt(e, webcad.doc); return [e.type, sub.length, sub[0].pts.map((p) => [Math.round(p.x), Math.round(p.y)])]; }), ['MLINE', 2, [[0, 10], [90, 10], [90, 50]]], 'MLINE con escala y justificación cero (inglete)');

  // ---- regiones y booleanas
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LWPOLYLINE', pts: [{ x: 0, y: 0, b: 0 }, { x: 10, y: 0, b: 0 }, { x: 10, y: 10, b: 0 }, { x: 0, y: 10, b: 0 }], closed: true }); d.add({ type: 'LINE', p1: { x: 5, y: 5 }, p2: { x: 15, y: 5 } }); d.add({ type: 'LINE', p1: { x: 15, y: 5 }, p2: { x: 15, y: 15 } }); d.add({ type: 'LINE', p1: { x: 15, y: 15 }, p2: { x: 5, y: 15 } }); d.add({ type: 'LINE', p1: { x: 5, y: 15 }, p2: { x: 5, y: 5 } }); });
  await type('_REGION', 'all', '');
  t.eq(await ev(() => webcad.doc.model.map((e) => [e.type, Math.round(webcad.E.entArea(e))])), [['REGION', 100], ['REGION', 100]], 'REGION desde polilínea y desde líneas encadenadas');
  await type('_UNION', 'all', '');
  await page.waitForTimeout(300);
  t.eq(await ev(() => webcad.doc.model.map((e) => [e.type, Math.round(webcad.E.entArea(e))])), [['REGION', 175]], 'UNION de regiones');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'REGION', loops: [[{ x: 0, y: 0, b: 0 }, { x: 20, y: 0, b: 0 }, { x: 20, y: 20, b: 0 }, { x: 0, y: 20, b: 0 }]] }); d.add({ type: 'REGION', loops: [[{ x: 5, y: 5, b: 0 }, { x: 15, y: 5, b: 0 }, { x: 15, y: 15, b: 0 }, { x: 5, y: 15, b: 0 }]] }); webcad.cmd.sel = []; });
  await type('_SUBTRACT');
  await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 1, y: 1 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('');
  await page.mouse.click(...(await ev(() => { const s = webcad.view.toScreen({ x: 10, y: 10 }); const r = webcad.view.host.getBoundingClientRect(); return [r.left + s.x, r.top + s.y]; })));
  await type('');
  await page.waitForTimeout(300);
  t.eq(await ev(() => webcad.doc.model.map((e) => [e.type, Math.round(webcad.E.entArea(e)), e.loops?.length])), [['REGION', 300, 2]], 'SUBTRACT: región con hueco');
  await type('_MASSPROP', 'all', '');
  t.ok(await ev(() => /Centroid:\s+X: 10\b/.test(document.getElementById('cmdhist').textContent)), 'MASSPROP: centroide');

  // ---- texto en arco, supersombreado, MOCORO, CHSPACE
  const at = await ev(() => { const d = webcad.doc; d.model.length = 0; const e = d.add({ type: 'ARCTEXT', c: { x: 0, y: 0 }, r: 50, a1: 0, a2: Math.PI, text: 'ABC', h: 5, off: 2.5 }); const s = webcad.E.explodeEnt(e, d); return [s.length, Math.round(Math.hypot(s[1].p.x, s[1].p.y) * 10) / 10, Math.round(s[1].p.x), Math.round(s[1].rot * 100) / 100]; });
  t.eq(at, [3, 52.5, 0, 0], 'ARCTEXT: caracteres sobre el arco, centrados');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } }); webcad.cmd.sel = [d.model[0]]; });
  await type('_MOCORO', '0,0', '_C', '0,10', '0,20', '_R', '0,10', '');
  t.eq(await ev(() => webcad.doc.model.map((e) => [Math.round(e.p1.x), Math.round(e.p1.y), Math.round(e.p2.x), Math.round(e.p2.y)])), [[0, 0, 0, 10], [0, 10, 10, 10], [0, 20, 10, 20]], 'MOCORO: copiar y girar');
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.begin('b'); d.touchTables(); d.blocks.PUNTO = { name: 'PUNTO', base: { x: 0, y: 0 }, ents: [{ type: 'CIRCLE', c: { x: 2, y: 2 }, r: 2 }] }; d.end(); d.add({ type: 'SUPERHATCH', loops: [[{ x: 0, y: 0, b: 0 }, { x: 20, y: 0, b: 0 }, { x: 20, y: 20, b: 0 }, { x: 0, y: 20, b: 0 }]], block: 'PUNTO', dx: 4, dy: 4, sc: 1, org: { x: 0, y: 0 } }); });
  t.ok(await ev(() => webcad.E.explodeEnt(webcad.doc.model[0], webcad.doc).filter((e) => e.type === 'INSERT').length >= 25), 'SUPERHATCH: mosaico de bloques recortado');
  await ev(() => { webcad.setLayout(webcad.doc.layouts[0].name); const d = webcad.doc; const vp = d.layout.ents.find((e) => e.type === 'VIEWPORT'); vp.vc = { x: 0, y: 0 }; vp.c = { x: 150, y: 100 }; vp.scale = 0.5; d.add({ type: 'LINE', p1: { x: 150, y: 100 }, p2: { x: 160, y: 100 } }, d.layout.ents); webcad.cmd.sel = [d.layout.ents.at(-1)]; });
  await type('_CHSPACE');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.type, e.p1.x, e.p2.x]; }), ['LINE', 0, 20], 'CHSPACE papel → modelo con escala');
  await ev(() => webcad.setLayout('Model'));

  // ---- lazo
  await esc(); await esc();
  await ev(() => { const d = webcad.doc; d.model.length = 0; d.add({ type: 'CIRCLE', c: { x: 50, y: 50 }, r: 3 }); d.add({ type: 'CIRCLE', c: { x: 80, y: 50 }, r: 3 }); webcad.cmd.sel = []; webcad.view.setCur({ cx: 60, cy: 50, s: 4 }); });
  const S = await ev(() => { const r = webcad.view.host.getBoundingClientRect(); return [[40, 40], [62, 40], [62, 60], [40, 60]].map(([x, y]) => { const s = webcad.view.toScreen({ x, y }); return [r.left + s.x, r.top + s.y]; }); });
  await page.mouse.move(...S[0]); await page.mouse.down(); for (const p of [S[1], S[2], S[3]]) await page.mouse.move(...p, { steps: 6 }); await page.mouse.up();
  t.eq(await ev(() => webcad.cmd.sel.map((e) => e.c.x)), [50], 'selección por lazo');
  await esc();
  t.eq(errs, [], 'sin errores de página (productividad)');

  // ---- 3D
  await ev(() => { webcad.doc.model.length = 0; });
  await type('_BOX', '0,0', '10,20', '30');
  await type('_CYLINDER', '50,0', '5', '10');
  await type('_SPHERE', '80,0', '10');
  t.eq(await ev(() => webcad.doc.model.map((e) => Math.round(webcad.E.GEN['3DSOLID'].volume(e)))), [6000, 784, 4071], 'BOX, CYLINDER y SPHERE: volúmenes (teselados)');
  await ev(() => { const d = webcad.doc; d.add({ type: 'LWPOLYLINE', pts: [{ x: 100, y: 0, b: 0 }, { x: 110, y: 0, b: 0 }, { x: 110, y: 10, b: 0 }, { x: 100, y: 10, b: 0 }], closed: true }); webcad.cmd.sel = [d.model.at(-1)]; });
  await type('_EXTRUDE', '5');
  t.eq(await ev(() => { const e = webcad.doc.model.at(-1); return [e.type, Math.round(webcad.E.GEN['3DSOLID'].volume(e))]; }), ['3DSOLID', 500], 'EXTRUDE de polilínea cerrada');
  await ev(() => { const d = webcad.doc; d.add({ type: 'LWPOLYLINE', pts: [{ x: 200, y: 0, b: 0 }, { x: 205, y: 0, b: 0 }, { x: 205, y: 10, b: 0 }, { x: 200, y: 10, b: 0 }], closed: true }); webcad.cmd.sel = [d.model.at(-1)]; });
  await type('_REVOLVE', '200,0', '200,10', '');
  t.near(await ev(() => webcad.E.GEN['3DSOLID'].volume(webcad.doc.model.at(-1))), Math.PI * 25 * 10, 15, 'REVOLVE: cilindro por revolución');
  t.eq(await ev(async () => (await webcad.solidTriangles(webcad.doc.model.filter((e) => e.type === '3DSOLID').slice(0, 1))).length), 12, 'triangulación para STL (prisma = 12 triángulos)');
  await type('_3DORBIT');
  t.ok(await ev(() => !!document.getElementById('v3d') && webcad.v3d.faces() > 100), 'visor 3D abierto con las caras de los sólidos');
  await page.mouse.move(700, 400); await page.mouse.down(); await page.mouse.move(760, 430, { steps: 4 }); await page.mouse.up();
  t.ok(await ev(() => Math.abs(webcad.v3d.cam.az - (-60 * Math.PI / 180)) > 0.1), 'órbita con el ratón');
  await page.keyboard.press('Escape');
  t.ok(await ev(() => !document.getElementById('v3d')), 'cerrar el visor 3D');

  // ---- nubes de puntos
  const pts = Array.from({ length: 500 }, (_, i) => `${500000 + (i % 25)} ${4700000 + Math.floor(i / 25)} ${100 + (i % 7)} 255 0 0`).join('\n');
  t.eq(await ev(async (txt) => { webcad.doc.model.length = 0; const e = await webcad.cloudFromText('nube.xyz', txt); const c = webcad.doc.ext.clouds[e.cloud]; const bb = webcad.E.entBBox(e, webcad.doc); return [c.n, Math.round(bb.x1), Math.round(bb.y2), !!c.rgb]; }, pts), [500, 500000, 4700019, true], 'POINTCLOUDATTACH: XYZ con color en coordenadas UTM');

  // ---- geolocalización
  t.eq(await ev(() => { const d = webcad.doc; d.ext.geo = { lat: 43.25, lon: -8.35, dp: { x: 0, y: 0 }, north: 0, unit: 1, map: 'off' }; const g = webcad.geo.toLatLon({ x: 1000, y: 1000 }); const p = webcad.geo.fromLatLon(g.lat, g.lon); return [g.lat > 43.25 && g.lon > -8.35, Math.round(p.x), Math.round(p.y)]; }), [true, 1000, 1000], 'geolocalización: XY ↔ latitud/longitud');
  t.eq(errs, [], 'sin errores de página (3D, nubes, geo)');

  // ---- guardar / exportar los tipos nuevos
  const io = await ev(async () => {
    const d = webcad.doc; d.model.length = 0;
    const png = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 4; return c.toDataURL(); })();
    await webcad.attachImage('a.png', png, { x: 0, y: 0 }, 10);
    d.add({ type: 'MLINE', pts: [{ x: 0, y: 0 }, { x: 50, y: 0 }], style: 'STANDARD', scale: 2, just: 1 });
    d.add({ type: 'REGION', loops: [[{ x: 0, y: 0, b: 0 }, { x: 5, y: 0, b: 0 }, { x: 5, y: 5, b: 0 }]] });
    d.add({ type: '3DSOLID', kind: 'extrude', prof: [[{ x: 0, y: 0, b: 0 }, { x: 5, y: 0, b: 0 }, { x: 5, y: 5, b: 0 }, { x: 0, y: 5, b: 0 }]], h: 3 });
    d.add({ type: 'ARCTEXT', c: { x: 0, y: 0 }, r: 20, a1: 0, a2: Math.PI, text: 'AB', h: 2 });
    d.add({ type: 'TOLERANCE', p: { x: 0, y: 0 }, dir: { x: 1, y: 0 }, h: 2.5, rows: [['⌖', '0.1', 'A']] });
    const D = (await import('./js/io/dxfw.js'));
    const w = Object.values(D).filter((f) => typeof f === 'function');
    const outs = w.map((f) => { try { return String(f(d) || '').length; } catch (e) { return 'ERR ' + e.message; } });
    const json = d.serialize(); const Doc = (await import('./js/core/document.js')).Doc; const o = new Doc(); o.load(JSON.parse(json));
    return { outs: outs.every((x) => typeof x === 'number'), types: o.model.map((e) => e.type), img: !!Object.keys(o.ext.images).length, ds: Object.keys(o.dimstyles).includes('MIO') };
  });
  t.eq(io, { outs: true, types: ['IMAGE', 'MLINE', 'REGION', '3DSOLID', 'ARCTEXT', 'TOLERANCE'], img: true, ds: true }, 'DXF y formato nativo con los tipos nuevos, imágenes y estilos de cota');
  t.eq(errs, [], 'sin errores de página (guardar)');
};
