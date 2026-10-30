// Menús AutoCAD R12: menús desplegables (POP), menú de pantalla lateral (SCREEN), cargador .MNU y macros
import { h } from './dom.js';
import { saveSettings } from '../app.js';

export const ACAD12_MNU = String.raw`
***POP1
[Archivo]
[Nuevo...]^C^C_new
[Abrir...]^C^C_open
[Guardar]^C^C_qsave
[Guardar como...]^C^C_saveas
[Recuperar...]^C^C_recover
[--]
[Trazar...]^C^C_plot
[--]
[->Importar/Exportar]
  [Entrada DXF...]^C^C_dxfin
  [Salida DXF...]^C^C_dxfout
  [Salida PDF...]^C^C_exportpdf
  [Salida SVG...]^C^C_svgout
  [<-Salida PNG...]^C^C_pngout
[->Referencia externa]
  [Enlazar...]^C^C_xattach
  [<-Bloque a disco...]^C^C_wblock
[--]
[Aplicaciones...]^C^C_appload
[Ejecutar script...]^C^C_script
[Visual LISP...]^C^C_vlisp
[--]
[Salir]^C^C_quit
***POP2
[Ayuda]
[¡Ayuda!]'_help
[--]
[Cancelar]^C^C
[Deshacer]^C^C_u
[Rehacer]^C^C_redo
[--]
[->Referencia a objetos]
  [Centro]_cen
  [Punto final]_endp
  [Inserción]_ins
  [Intersección]_int
  [Punto medio]_mid
  [Cercano]_nea
  [Nodo]_nod
  [Perpendicular]_per
  [Cuadrante]_qua
  [Tangente]_tan
  [<-Ninguno]_non
[Referencia a objetos implícita...]'_dsettings
[--]
[->Consultar]
  [Lista]^C^C_list
  [Distancia]'_dist
  [Área]^C^C_area
  [Punto ID]'_id
  [Hora]^C^C_time
  [<-Estado]^C^C_status
[->Designar]
  [Selección rápida...]^C^C_qselect
  [Seleccionar similares]^C^C_selectsimilar
  [<-Designar todo]^C^C_select all;
[--]
[Calculadora]'_cal
***POP3
[Dibujo]
[Línea]^C^C_line
[Línea auxiliar]^C^C_xline
[Rayo]^C^C_ray
[Polilínea]^C^C_pline
[Spline]^C^C_spline
[--]
[->Arco]
  [3 puntos]^C^C_arc
  [Inicio, centro, fin]^C^C_arc \_c
  [Inicio, fin, radio]^C^C_arc \_e \_r
  [Inicio, fin, centro]^C^C_arc \_e
  [<-Centro, inicio, fin]^C^C_arc _c
[->Círculo]
  [Centro, radio]^C^C_circle
  [Centro, diámetro]^C^C_circle \_d
  [2 puntos]^C^C_circle _2p
  [3 puntos]^C^C_circle _3p
  [<-Tan, tan, radio]^C^C_circle _ttr
[Punto]^C^C_point
[Arandela]^C^C_donut
[Elipse]^C^C_ellipse
[->Polígono]
  [Rectángulo]^C^C_rectang
  [<-Polígono]^C^C_polygon
[--]
[->Texto]
  [Dinámico]^C^C_dtext
  [<-Líneas múltiples...]^C^C_mtext
[->Cotas]
  [Lineal]^C^C_dimlinear
  [Alineada]^C^C_dimaligned
  [Radio]^C^C_dimradius
  [Diámetro]^C^C_dimdiameter
  [Angular]^C^C_dimangular
  [Por coordenadas]^C^C_dimordinate
  [Continua]^C^C_dimcontinue
  [Línea base]^C^C_dimbaseline
  [<-Directriz]^C^C_qleader
[Sombreado...]^C^C_hatch
[Contorno...]^C^C_boundary
[Nube de revisión]^C^C_revcloud
[--]
[Insertar bloque...]^C^C_insert
***POP4
[Construir]
[Matriz]^C^C_array
[Copiar]^C^C_copy
[Simetría]^C^C_mirror
[Chaflán]^C^C_chamfer
[Empalme]^C^C_fillet
[Desfase]^C^C_offset
[Dividir]^C^C_divide
[Graduar]^C^C_measure
[--]
[Bloque...]^C^C_block
[Editor de bloques...]^C^C_bedit
[Atributo...]^C^C_attdef
***POP5
[Modificar]
[Entidad...]^C^C_properties
[Igualar propiedades]^C^C_matchprop
[--]
[Borrar]^C^C_erase
[¡Uy!]^C^C_oops
[Desplazar]^C^C_move
[Girar]^C^C_rotate
[Escala]^C^C_scale
[Estirar]^C^C_stretch
[Cambiar propiedades]^C^C_chprop
[--]
[Recortar]^C^C_trim
[Alargar]^C^C_extend
[Partir]^C^C_break
[Juntar]^C^C_join
[Longitud]^C^C_lengthen
[Alinear]^C^C_align
[--]
[Editar polilínea]^C^C_pedit
[Editar texto...]^C^C_ddedit
[Editar atributos...]^C^C_eattedit
[Descomponer]^C^C_explode
***POP6
[Ver]
[Redibujar]'_redraw
[Regenerar]^C^C_regen
[--]
[->Zoom]
  [Ventana]'_zoom _w
  [Todo]'_zoom _a
  [Previo]'_zoom _p
  [Extensión]'_zoom _e
  [<-Escala]'_zoom _s
[Encuadre]'_pan
[Vistas guardadas...]^C^C_view
[--]
[->Modelo/Papel]
  [Espacio modelo]^C^C_layout _s Model
  [<-Espacio papel (Presentación1)]^C^C_layout _s "Presentación1"
[->Ventanas múltiples]
  [Crear ventanas]^C^C_mview
  [Espacio modelo (en ventana)]^C^C_mspace
  [<-Espacio papel]^C^C_pspace
***POP7
[Parámetros]
[Ayudas al dibujo...]'_dsettings
[Control de capas...]'_layer
[Referencia a objetos...]'_dsettings
[--]
[Color...]'_color
[Tipo de línea...]'_linetype
[Grosor de línea...]'_lweight
[--]
[Control de unidades...]'_units
[Estilo de cota...]^C^C_dimstyle
[Estilo de texto...]^C^C_style
[Estilo de punto...]^C^C_ddptype
[--]
[Opciones...]'_options
[Personalizar (CUI)...]^C^C_cui
[Cargar menú (.MNU)...]^C^C_menu

***SCREEN
**S
[WebCAD]$S=S
[* * * *]$S=OSNAP
[]
[BLOQUES]$S=BL
[ACOTAR:]$S=DIM
[VISUALIZ]$S=DS
[DIBUJO]$S=DR
[EDITAR]$S=ED
[CONSULTA]$S=INQ
[CAPA...]'_layer
[VMULT]$S=MV
[TRAZAR...]^C^C_plot
[PARAMS]$S=SET
[UTILIDAD]$S=UT
[LISP]$S=LSP
[]
[]
[GUARDAR:]^C^C_qsave
**DR
[WebCAD]$S=S
[* * * *]$S=OSNAP
[DIBUJO]
[ARCO]$S=ARC
[ATRDEF:]^C^C_attdef
[SOMBCONT:]^C^C_hatch
[CIRCULO]$S=CIR
[ARANDELA:]^C^C_donut
[TEXTODIN:]^C^C_dtext
[ELIPSE:]^C^C_ellipse
[-SOMBCON:]^C^C_-hatch
[INSERTAR:]^C^C_-insert
[LINEA:]^C^C_line
[TEXTOM:]^C^C_mtext
[POL:]^C^C_pline
[PUNTO:]^C^C_point
[POLIGONO:]^C^C_polygon
[RECTANGULO:]^C^C_rectang
[SPLINE:]^C^C_spline
[LINEAX:]^C^C_xline
[]
[ ULTIMO ]$S=
[ EDITAR ]$S=ED
**ARC
[WebCAD]$S=S
[* * * *]$S=OSNAP
[ARCO]
[3 puntos:]^C^C_arc
[I,C,F:]^C^C_arc \_c
[I,F,R:]^C^C_arc \_e \_r
[I,F,C:]^C^C_arc \_e
[C,I,F:]^C^C_arc _c
[]
[ ULTIMO ]$S=
[ DIBUJO ]$S=DR
**CIR
[WebCAD]$S=S
[* * * *]$S=OSNAP
[CIRCULO]
[CEN,RAD:]^C^C_circle
[CEN,DIA:]^C^C_circle \_d
[2PUNTOS:]^C^C_circle _2p
[3PUNTOS:]^C^C_circle _3p
[TTR:]^C^C_circle _ttr
[]
[ ULTIMO ]$S=
[ DIBUJO ]$S=DR
**ED
[WebCAD]$S=S
[* * * *]$S=OSNAP
[EDITAR]
[MATRIZ:]^C^C_array
[EDITATR:]^C^C_eattedit
[PARTE:]^C^C_break
[CHAFLAN:]^C^C_chamfer
[CAMBIAPR:]^C^C_chprop
[COPIA:]^C^C_copy
[DDEDIC:]^C^C_ddedit
[DIVIDE:]^C^C_divide
[BORRA:]^C^C_erase
[DESCOMP:]^C^C_explode
[ALARGA:]^C^C_extend
[EMPALME:]^C^C_fillet
[GRADUA:]^C^C_measure
[SIMETRIA:]^C^C_mirror
[DESPLAZA:]^C^C_move
[EQDIST:]^C^C_offset
[EDITPOL:]^C^C_pedit
[GIRA:]^C^C_rotate
[ESCALA:]^C^C_scale
[ESTIRA:]^C^C_stretch
[RECORTA:]^C^C_trim
[DESHACER:]^C^C_undo
[ ULTIMO ]$S=
[ DIBUJO ]$S=DR
**DS
[WebCAD]$S=S
[* * * *]$S=OSNAP
[VISUALIZ]
[ENCUADRE:]'_pan
[REDIBUJA:]'_redraw
[REGEN:]^C^C_regen
[VISTA:]^C^C_view
[ZOOM:]'_zoom
[]
[ZOOM V]'_zoom _w
[ZOOM E]'_zoom _e
[ZOOM P]'_zoom _p
[ZOOM T]'_zoom _a
[]
[ ULTIMO ]$S=
**INQ
[WebCAD]$S=S
[* * * *]$S=OSNAP
[CONSULTA]
[AREA:]^C^C_area
[LISTBD:]^C^C_list
[DIST:]'_dist
[ID:]'_id
[LISTA:]^C^C_list
[ESTADO:]^C^C_status
[HORA:]^C^C_time
[]
[ ULTIMO ]$S=
**BL
[WebCAD]$S=S
[* * * *]$S=OSNAP
[BLOQUES]
[ATRDEF:]^C^C_attdef
[EDITATR:]^C^C_eattedit
[BASE:]^C^C_base
[EDITBLOQ:]^C^C_bedit
[BLOQUE:]^C^C_-block
[DESCOMP:]^C^C_explode
[INSERTAR:]^C^C_-insert
[LIMPIA:]^C^C_purge
[BLOQDISC:]^C^C_wblock
[REFX:]^C^C_xattach
[]
[PARAMB:]^C^C_bparameter
[ACCIONB:]^C^C_baction
[ESTADOVI:]^C^C_bvstate
[CERRARBL:]^C^C_bclose
[ ULTIMO ]$S=
**DIM
[WebCAD]$S=S
[* * * *]$S=OSNAP
[ACOTAR:]
[LINEAL]^C^C_dimlinear
[ALINEADA]^C^C_dimaligned
[ANGULAR]^C^C_dimangular
[RADIO]^C^C_dimradius
[DIAMETRO]^C^C_dimdiameter
[COORDEN]^C^C_dimordinate
[CONTINUA]^C^C_dimcontinue
[LINBASE]^C^C_dimbaseline
[DIRECTRZ]^C^C_qleader
[EDITTEXT]^C^C_dimtedit
[ESTILO...]^C^C_dimstyle
[]
[ ULTIMO ]$S=
**MV
[WebCAD]$S=S
[* * * *]$S=OSNAP
[VMULT]
[VMULT:]^C^C_mview
[EMODELO:]^C^C_mspace
[EPAPEL:]^C^C_pspace
[PRESENT:]^C^C_layout
[MODELO]^C^C_layout _s Model
[]
[ ULTIMO ]$S=
**SET
[WebCAD]$S=S
[* * * *]$S=OSNAP
[PARAMS]
[AYUDAS]'_dsettings
[UNIDADES]'_units
[COLOR:]'_color
[REJILLA:]'_grid
[LIMITES:]^C^C_limits
[TIPOLIN:]'_linetype
[ESCALATL:]'_ltscale
[ORTO:]'_ortho
[REFENT:]'_-osnap
[PDMODE:]'_ddptype
[MODIVAR:]'_setvar
[FORZCURS:]'_snap
[ESTILO:]^C^C_style
[OPCIONES]'_options
[ ULTIMO ]$S=
**UT
[WebCAD]$S=S
[* * * *]$S=OSNAP
[UTILIDAD]
[CARGAAP]^C^C_appload
[AUDITAR:]^C^C_audit
[ENTDXF:]^C^C_dxfin
[SALDXF:]^C^C_dxfout
[MENU:]^C^C_menu
[NUEVO:]^C^C_new
[ABRIR:]^C^C_open
[LIMPIA:]^C^C_purge
[CAMBIANOM:]^C^C_rename
[GUARDCOM:]^C^C_saveas
[SCRIPT:]^C^C_script
[]
[ ULTIMO ]$S=
**LSP
[WebCAD]$S=S
[* * * *]$S=OSNAP
[LISP]
[CARGAAP]^C^C_appload
[VLISP]^C^C_vlisp
[SCRIPT:]^C^C_script
[]
[ ULTIMO ]$S=
**OSNAP
[-REFENT-]
[CENtro]_cen
[FINal]_endp
[INSerción]_ins
[INTersec]_int
[MEDio]_mid
[CERcano]_nea
[NODo]_nod
[PERpend]_per
[CUAdrante]_qua
[TANgente]_tan
[NINGUNO]_non
[]
[REFENT:]'_-osnap
[]
[ ULTIMO ]$S=
`;

export function parseMNU(text) {
  const res = { pops: [], screen: {} };
  let sec = null, sub = null, stack = null, pop = null;
  for (let raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.trim().startsWith('//')) continue;
    const t = line.trim();
    if (t.startsWith('***')) {
      sec = t.slice(3).toUpperCase(); sub = null;
      if (/^POP\d+/.test(sec)) { pop = { title: null, items: [] }; res.pops.push(pop); stack = [pop.items]; }
      continue;
    }
    if (!sec) continue;
    if (sec === 'SCREEN') {
      if (t.startsWith('**')) { sub = t.slice(2).split(/\s+/)[0].toUpperCase(); res.screen[sub] = []; continue; }
      if (!sub) { sub = 'S'; res.screen[sub] = []; }
      const m = /^\[([^\]]*)\](.*)$/.exec(t);
      res.screen[sub].push(m ? { label: m[1], macro: m[2] } : { label: t, macro: t });
      continue;
    }
    if (/^POP\d+/.test(sec)) {
      if (t.startsWith('**')) continue;
      const m = /^(?:ID_\w+\s*)?\[([^\]]*)\](.*)$/.exec(t);
      if (!m) continue;
      let label = m[1], macro = m[2];
      if (pop.title == null) { pop.title = label.replace(/^&/, '').replace(/&/g, ''); continue; }
      let ends = 0;
      while (label.startsWith('<-')) { ends++; label = label.slice(2); }
      if (label.startsWith('->')) { const it = { label: label.slice(2).replace(/&/g, ''), items: [] }; stack[stack.length - 1].push(it); stack.push(it.items); continue; }
      const it = label === '--' || label === '' ? { sep: true } : { label: label.replace(/^~/, '').replace(/&/g, ''), macro, dis: label.startsWith('~') };
      stack[stack.length - 1].push(it);
      for (let k = 0; k < ends && stack.length > 1; k++) stack.pop();
    }
  }
  return res;
}

// ejecuta una macro de menú estilo AutoCAD (^C, ;, espacio, \ pausa, $S=)
export function createMacroRunner(app) {
  return async function runMacro(macro) {
    if (macro == null) return;
    let m = String(macro);
    const eng = app.cmd;
    if (m.startsWith('>')) { app.ui.cmdline.submit(m.slice(1)); return; }
    m = m.replace(/\^P/g, '').replace(/\^M/g, ';');
    const screens = [...m.matchAll(/\$S=([\w-]*)/gi)].map((x) => x[1]);
    m = m.replace(/\$[SPMI]\d*=[\w.*-]*/gi, '').replace(/\$[SPMI]\d*=\s/gi, ' ');
    if (screens.length) app.ui.menu12.goto(screens[screens.length - 1]);
    let cancels = 0; while (m.startsWith('^C')) { cancels++; m = m.slice(2); }
    m = m.replace(/^\*/, '');
    if (!m.trim()) { if (cancels) eng.cancel(); return; }
    if (m.trim().startsWith('(')) { await app.lisp.evalTyped(m.trim()); return; }
    // tokens
    const toks = []; let buf = '', q = false;
    for (const ch of m) {
      if (ch === '"') { q = !q; continue; }
      if (!q && (ch === ' ' || ch === ';')) { toks.push(buf); buf = ''; continue; }
      if (!q && ch === '\\') { if (buf) toks.push(buf); buf = ''; toks.push('\\'); continue; }
      buf += ch;
    }
    if (buf) toks.push(buf);
    while (toks.length && toks[0] === '') toks.shift();
    if (!toks.length) return;
    const first = toks[0];
    const transp = first.startsWith("'");
    const name = eng.resolveName(first.replace(/^'/, ''));
    const cmd = name && eng.commands[name];
    if (cmd && (cancels || !transp || !eng.active)) {
      if (eng.active && !(transp && cmd.transparent)) { eng.cancel(); await new Promise((r) => setTimeout(r, 0)); if (eng.active) eng.cancel(); await new Promise((r) => setTimeout(r, 0)); }
    } else if (cancels && eng.active) { eng.cancel(); await new Promise((r) => setTimeout(r, 0)); }
    if (transp && eng.active && eng.req && cmd?.transparent) {
      eng.submit("'" + first.replace(/^'/, ''));
      await eng.waitSettled();
      const rest = toks.slice(1); if (rest.length) await app.lisp.command(rest).catch((e) => app.log(e.message));
      return;
    }
    if (!eng.active && !name) {
      if (eng.doc.getvar(first) !== undefined) { eng.run(first); await eng.waitSettled(); const rest = toks.slice(1); if (rest.length) await app.lisp.command(rest).catch(() => {}); return; }
      eng.submit(first); return;
    }
    try { await app.lisp.command(toks.map((t) => t.replace(/^'/, ''))); } catch (e) { app.log(e.message); }
  };
}

export function createMenu12(app) {
  const bar = document.getElementById('menubar'), scr = document.getElementById('screen');
  const m12 = { page: 'S', history: [] };
  let menus = parseMNU(app.settings.customMenu || ACAD12_MNU);
  if (!menus.pops.length || !Object.keys(menus.screen).length) { const def = parseMNU(ACAD12_MNU); if (!menus.pops.length) menus.pops = def.pops; if (!Object.keys(menus.screen).length) menus.screen = def.screen; }
  let openMenu = null;
  const closeAll = () => { document.querySelectorAll('.dropmenu.r12').forEach((x) => x.remove()); bar.querySelectorAll('.mi.open').forEach((x) => x.classList.remove('open')); openMenu = null; };
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.dropmenu.r12') && !e.target.closest('#menubar')) closeAll(); }, true);
  const showItems = (items, x, y, level = 0) => {
    document.querySelectorAll('.dropmenu.r12').forEach((el) => { if (+el.dataset.level >= level) el.remove(); });
    const box = h('div', { class: 'dropmenu r12', 'data-level': level, style: { left: x + 'px', top: y + 'px' } });
    for (const it of items) {
      if (it.sep) { box.append(h('div', { class: 'sep' })); continue; }
      const row = h('div', { class: 'it' + (it.items ? ' sub' : '') + (it.dis ? ' dis' : ''), text: it.label });
      if (it.items) row.onpointerenter = () => { const r = row.getBoundingClientRect(); showItems(it.items, r.right - 2, r.top - 3, level + 1); };
      else { row.onpointerenter = () => document.querySelectorAll('.dropmenu.r12').forEach((el) => { if (+el.dataset.level > level) el.remove(); }); row.onclick = () => { closeAll(); if (!it.dis) app.ui.runMacro(it.macro); }; }
      box.append(row);
    }
    document.body.append(box);
    const r = box.getBoundingClientRect();
    if (r.right > innerWidth) box.style.left = Math.max(0, innerWidth - r.width - 4) + 'px';
    if (r.bottom > innerHeight) box.style.top = Math.max(0, innerHeight - r.height - 4) + 'px';
  };
  m12.renderBar = () => {
    bar.innerHTML = '';
    for (const p of menus.pops) {
      const mi = h('div', { class: 'mi', text: p.title });
      const openIt = () => { closeAll(); mi.classList.add('open'); openMenu = mi; const r = mi.getBoundingClientRect(); showItems(p.items, r.left, r.bottom); };
      mi.onclick = () => (openMenu === mi ? closeAll() : openIt());
      mi.onpointerenter = () => { if (openMenu && openMenu !== mi) openIt(); };
      bar.append(mi);
    }
  };
  m12.goto = (name) => {
    name = String(name || '').toUpperCase();
    if (!name) { const prev = m12.history.pop(); m12.page = prev || 'S'; }
    else if (name === 'X') return;
    else if (menus.screen[name]) { if (m12.page !== name) m12.history.push(m12.page); m12.page = name; }
    m12.renderScreen();
  };
  m12.renderScreen = () => {
    scr.innerHTML = '';
    const items = menus.screen[m12.page] || menus.screen.S || [];
    for (const it of items) {
      const isTitle = !it.macro && it.label;
      const el = h('div', { class: 'sh' + (isTitle ? ' title' : '') + (!it.label ? ' blank' : ''), text: it.label || ' ' });
      if (it.macro) el.onclick = () => app.ui.runMacro(it.macro);
      scr.append(el);
    }
  };
  m12.loadMNU = (text, name = 'menu') => {
    const parsed = parseMNU(text);
    if (!parsed.pops.length && !Object.keys(parsed.screen).length) { app.log(`${name}: no contiene secciones ***POP ni ***SCREEN.`); return; }
    if (parsed.pops.length) menus.pops = parsed.pops;
    if (Object.keys(parsed.screen).length) { menus.screen = parsed.screen; m12.page = parsed.screen.S ? 'S' : Object.keys(parsed.screen)[0]; m12.history = []; }
    app.settings.customMenu = text; saveSettings();
    m12.renderBar(); m12.renderScreen();
    app.log(`Menú "${name}" cargado: ${parsed.pops.length} menús desplegables, ${Object.keys(parsed.screen).length} páginas de pantalla.`);
  };
  m12.resetMenus = () => { delete app.settings.customMenu; saveSettings(); menus = parseMNU(ACAD12_MNU); m12.page = 'S'; m12.renderBar(); m12.renderScreen(); app.log('Menú clásico restaurado.'); };
  m12.menus = () => menus;
  m12.renderBar(); m12.renderScreen();
  return m12;
}
