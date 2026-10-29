// Arranque de WebCAD
import { app, loadSettings, saveSettings } from './app.js';
import { Doc } from './core/document.js';
import { View } from './view/viewport.js';
import { Engine } from './cmd/engine.js';
import * as Draw from './cmd/draw.js';
import * as Modify from './cmd/modify.js';
import * as Annot from './cmd/annot.js';
import * as Blocks from './cmd/blocks.js';
import * as Misc from './cmd/misc.js';
import * as Files from './cmd/files.js';
import * as Prod from './cmd/prod.js';
import * as Param from './cmd/param.js';
import * as Table from './cmd/table.js';
import * as Hvac from './cmd/hvac.js';
import * as Tools from './cmd/tools.js';
import * as Output from './cmd/output.js';
import * as Collab from './cmd/collab.js';
import { Lisp } from './lisp/lisp.js';
import { createIO } from './io/io.js';
import { createUI } from './ui/ui.js';
import { setLang, docBase } from './core/i18n.js';
import { setStyleSource, onFontLoaded } from './core/fonts.js';
import { invalidate, setFieldContext } from './core/entities.js';
import { osnap } from './view/snap.js';
import { LINETYPES } from './core/tables.js';
import * as G from './core/geom.js';

app.settings = loadSettings();
setStyleSource(() => app.doc?.styles);
onFontLoaded(() => { for (const d of app.docs || []) for (const e of d.allEntsDeep()) if (/TEXT|ATT|DIMENSION|INSERT/.test(e.type)) invalidate(e); app.view?.redraw(); });
setLang(app.settings.lang || 'es');
app.saveSettings = saveSettings;
app.docs = [];
app.doc = new Doc();
app.view = new View(app, document.getElementById('host'));
app.cmd = new Engine(app);
for (const m of [Draw, Modify, Annot, Blocks, Misc, Prod, Table, Hvac, Tools, Output]) m.register(app.cmd, app);
app.cmd.register('OVERKILL', async (c) => {
  const s = await c.select(); const seen = new Map(); let n = 0;
  for (const e of s) { const k = JSON.stringify({ ...e, hid: 0 }, (key, v) => (key[0] === '_' ? undefined : typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v)); if (seen.has(k)) { app.doc.remove(e); n++; } else seen.set(k, e); }
  c.print(`${n} duplicate(s) deleted`);
});
app.lisp = new Lisp(app);
app.io = createIO(app);
app.osnapAt = (p, mode) => osnap(app, p, null, mode);
setFieldContext(() => ({ props: app.doc?.props, name: app.doc?.name, ctab: app.doc?.active === 'Model' ? 'Model' : app.doc?.active, saveDate: app.doc?.saveDate }));

function attach(d) {
  if (d._attached) return; d._attached = true;
  d.on('change', () => { app.cmd.sel = app.cmd.sel.filter((e) => d.ownerOf(e)); app.cmd.updateGrips(); app.view.redraw(); app.ui?.refresh(); });
  d.on('layers', () => { app.view.redraw(); app.ui?.refresh(); });
  d.on('var', () => app.ui?.status?.update());
  d.on('reset', () => { app.view.redraw(); app.ui?.refresh(); });
}
app.addDoc = (d) => {
  const cur = app.doc;
  // reemplaza el dibujo inicial vacío y sin modificar
  if (cur && app.docs.length === 1 && !cur.modified && !cur.model.length && !cur.undoStack.length && /^(Plano|Plànol|Desenho|Drawing|Dibujo|Debuxo)1(\.dwg)?$/i.test(cur.name)) app.docs = [];
  for (const k of Object.keys(d.ltypes)) if (!d.ltypes[k] && LINETYPES[k]) d.ltypes[k] = LINETYPES[k];
  app.docs.push(d); attach(d); app.switchDoc(d);
};
app.switchDoc = (d) => {
  if (app.cmd.active) app.cmd.cancel();
  if (app.doc) app.doc._views = { views: app.view.views, bed: app.view.bedView };
  app.doc = d;
  if (d._views) { app.view.views = d._views.views; app.view.bedView = d._views.bed; } else app.view.views = { Model: { cx: 0, cy: 0, s: 2 } };
  app.cmd.clearSel(false);
  app.ui?.ribbon && (d.blockEdit ? app.ui.ribbon.showContext('bedit') : app.ui.ribbon.hideContext('bedit'));
  app.view.redraw(); app.ui?.refresh(); app.ui?.status?.update();
};
app.closeDoc = async (d) => {
  if (d.modified && !(await app.ui.dlg.confirm(`¿Cerrar ${d.name} sin guardar los cambios?`))) return;
  app.docs = app.docs.filter((x) => x !== d);
  if (!app.docs.length) { app.ui.start.show(); const nd = new Doc(); nd.reset(); app.docs.push(nd); attach(nd); app.switchDoc(nd); return; }
  if (app.doc === d) app.switchDoc(app.docs[app.docs.length - 1]); else app.ui.refresh();
};
app.cmd.register('CLOSE', async () => app.closeDoc(app.doc), { alias: ['CLOSEALL', 'QUIT', 'EXIT'] });

app.docs.push(app.doc); attach(app.doc);
app.doc.name = docBase() + '1';
createUI(app);
Files.register(app.cmd, app);
Param.register(app.cmd, app);
Collab.register(app.cmd, app);
app.ui.applyLayout();
app.ui.translateStatic();

// dibujo de ejemplo (marcado como ejemplo)
app.ui.loadSample = () => {
  const d = new Doc(); d.reset('Ejemplo-Brida');
  d.ensureLayer('CONTORNO', { color: 7, lw: 50 }); d.ensureLayer('EJES', { color: 1, ltype: 'CENTER' }); d.ensureLayer('COTAS', { color: 3 }); d.ensureLayer('SOMBREADO', { color: 8 }); d.ensureLayer('TEXTO', { color: 2 });
  d.ltypes.CENTER = LINETYPES.CENTER; d.vars.LTSCALE = 5; d.dimstyle.dimscale = 4;
  const add = (e) => { d.stamp(e); d.model.push(e); return e; };
  add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 100, layer: 'CONTORNO' });
  add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 45, layer: 'CONTORNO' });
  for (let i = 0; i < 8; i++) add({ type: 'CIRCLE', c: G.polar({ x: 0, y: 0 }, i * Math.PI / 4, 75), r: 9, layer: 'CONTORNO' });
  add({ type: 'CIRCLE', c: { x: 0, y: 0 }, r: 75, layer: 'EJES' });
  add({ type: 'LINE', p1: { x: -115, y: 0 }, p2: { x: 115, y: 0 }, layer: 'EJES' });
  add({ type: 'LINE', p1: { x: 0, y: -115 }, p2: { x: 0, y: 115 }, layer: 'EJES' });
  add({ type: 'HATCH', layer: 'SOMBREADO', pattern: 'ANSI31', scale: 2, angle: 0, loops: [[{ x: 160, y: -100, b: 0 }, { x: 260, y: -100, b: 0 }, { x: 260, y: -45, b: 0 }, { x: 160, y: -45, b: 0 }], [{ x: 160, y: 45, b: 0 }, { x: 260, y: 45, b: 0 }, { x: 260, y: 100, b: 0 }, { x: 160, y: 100, b: 0 }]] });
  add({ type: 'LWPOLYLINE', layer: 'CONTORNO', closed: true, pts: [{ x: 160, y: -100, b: 0 }, { x: 260, y: -100, b: 0 }, { x: 260, y: 100, b: 0 }, { x: 160, y: 100, b: 0 }] });
  add({ type: 'LINE', p1: { x: 160, y: -45 }, p2: { x: 260, y: -45 }, layer: 'CONTORNO' });
  add({ type: 'LINE', p1: { x: 160, y: 45 }, p2: { x: 260, y: 45 }, layer: 'CONTORNO' });
  add({ type: 'DIMENSION', dt: 'diameter', p1: G.polar({ x: 0, y: 0 }, Math.PI * 0.75, 100), p2: G.polar({ x: 0, y: 0 }, -Math.PI * 0.25, 100), dp: G.polar({ x: 0, y: 0 }, Math.PI * 0.75, 140), layer: 'COTAS' });
  add({ type: 'DIMENSION', dt: 'linear', p1: { x: 160, y: 100 }, p2: { x: 260, y: 100 }, dp: { x: 210, y: 125 }, rot: 0, layer: 'COTAS' });
  add({ type: 'DIMENSION', dt: 'linear', p1: { x: 260, y: -100 }, p2: { x: 260, y: 100 }, dp: { x: 290, y: 0 }, rot: Math.PI / 2, layer: 'COTAS' });
  add({ type: 'MTEXT', p: { x: -100, y: -130 }, h: 7, w: 0, att: 1, text: 'BRIDA DN200 PN16\\P8 TALADROS Ø18 EN PCD 150 (EJEMPLO)', layer: 'TEXTO' });
  // bloque dinámico de ejemplo: puerta con ancho variable y estado abierto/cerrado
  d.ensureLayer('PUERTAS', { color: 4 });
  d.blocks.PUERTA = { name: 'PUERTA', base: { x: 0, y: 0 }, _ver: 1, ents: [
    { type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 0, y: 80 }, layer: '0', bid: 0 },
    { type: 'ARC', c: { x: 0, y: 0 }, r: 80, a1: 0, a2: Math.PI / 2, layer: '0', bid: 1 },
    { type: 'LINE', p1: { x: 0, y: 0 }, p2: { x: 80, y: 0 }, layer: '0', bid: 2, ltype: 'BYBLOCK' },
  ].map((e) => { d.stamp(e); return e; }), params: [
    { type: 'linear', name: 'Ancho', p1: { x: 0, y: 0 }, p2: { x: 80, y: 0 }, inc: 10, actions: [{ type: 'scale', ids: [0, 1, 2] }] },
    { type: 'flip', name: 'Giro', p1: { x: 40, y: -5 }, p2: { x: 40, y: 5 }, actions: [{ type: 'flip', ids: [0, 1, 2] }] },
    { type: 'visibility', name: 'Visibilidad', p: { x: 0, y: -15 }, states: [{ name: 'Con barrido', hidden: [] }, { name: 'Sin barrido', hidden: [1] }] },
  ] };
  add({ type: 'INSERT', name: 'PUERTA', p: { x: 320, y: -100 }, sx: 1, sy: 1, rot: 0, layer: 'PUERTAS', dyn: { Ancho: 80, Giro: 0, Visibilidad: 'Con barrido' } });
  add({ type: 'INSERT', name: 'PUERTA', p: { x: 430, y: -100 }, sx: 1, sy: 1, rot: 0, layer: 'PUERTAS', dyn: { Ancho: 60, Giro: 1, Visibilidad: 'Sin barrido' } });
  add({ type: 'TEXT', p: { x: 320, y: 0 }, h: 6, text: 'Bloque dinámico PUERTA (pinzamientos)', layer: 'TEXTO', rot: 0 });
  d.modified = false;
  app.addDoc(d);
  app.view.zoomExtents();
  app.log('Dibujo de ejemplo cargado. Seleccione una PUERTA para ver sus pinzamientos dinámicos (ancho, giro y visibilidad).');
};

// rutinas LISP de inicio
(async () => {
  for (const f of app.settings.startupLisp || []) { app.lisp.addFile(f.name, f.code); if (/\.dcl$/i.test(f.name)) continue; await app.lisp.loadText(f.code, f.name); app.log(`${f.name} loaded (Startup Suite).`); }
})();
setInterval(() => app.io.autosave(), 5 * 60 * 1000);
window.addEventListener('beforeunload', (e) => { if (app.docs.some((d) => d.modified)) { e.preventDefault(); e.returnValue = ''; } });

app.log('WebCAD Libre — dibujo técnico 2D. Escriba los comandos en castellano o en inglés (p. ej. LINEA, LINE o L). F1: ayuda.');
app.log('Regenerating model.');
app.view.setCur({ cx: 210, cy: 148, s: Math.min(app.view.W / 460, app.view.H / 330) || 2 });
app.ui.refresh();
app.ui.start.show();
app.ui.cmdline.forceFocus();
window.webcad = app;

// aplicación instalable y sin conexión (no dentro de visores incrustados)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !app.io.inArtifact() && window.top === window.self) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sin service worker */ });
}
