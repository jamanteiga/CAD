// Vista: canvas de dibujo + overlay, zoom/encuadre, rejilla, cursor, osnaps, pinzamientos
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { drawEnts, drawEnt } from './renderer.js';
import { osnap, orthoPoint, polarPoint, gridSnap, OSLABEL } from './snap.js';
import { PAPER } from '../core/tables.js';

export class View {
  constructor(app, host) {
    this.app = app; this.host = host;
    this.cv = document.createElement('canvas'); this.cv.className = 'cv-main';
    this.ov = document.createElement('canvas'); this.ov.className = 'cv-over';
    host.append(this.cv, this.ov);
    this.ctx = this.cv.getContext('2d'); this.octx = this.ov.getContext('2d');
    this.views = { Model: { cx: 0, cy: 0, s: 2 } };
    this.bedView = { cx: 0, cy: 0, s: 4 };
    this.mouse = { x: 0, y: 0, in: false };
    this.cursor = { x: 0, y: 0 }; this.snapped = { x: 0, y: 0 }; this.snapInfo = null; this.trackInfo = null;
    this.dirty = true; this.odirty = true;
    this.dpr = window.devicePixelRatio || 1;
    new ResizeObserver(() => this.resize()).observe(host);
    this.resize();
    this.bindEvents();
    const loop = () => { if (this.dirty) { this.dirty = false; this.render(); this.odirty = true; } if (this.odirty) { this.odirty = false; this.renderOverlay(); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  get doc() { return this.app.doc; }
  get eng() { return this.app.cmd; }
  get W() { return this.host.clientWidth; }
  get H() { return this.host.clientHeight; }
  resize() {
    this.dpr = window.devicePixelRatio || 1;
    for (const c of [this.cv, this.ov]) { c.width = Math.max(1, this.W * this.dpr); c.height = Math.max(1, this.H * this.dpr); }
    this.dirty = true;
  }
  redraw() { this.dirty = true; }
  redrawOverlay() { this.odirty = true; }

  // ---- vista actual
  paperView() {
    const d = this.doc, name = d.active;
    if (!this.views[name]) { const l = d.layout; this.views[name] = { cx: (l?.w || 420) / 2, cy: (l?.h || 297) / 2, s: Math.min(this.W / ((l?.w || 420) * 1.15), this.H / ((l?.h || 297) * 1.15)) || 1 }; }
    return this.views[name];
  }
  get cur() {
    const d = this.doc;
    if (d.blockEdit) return this.bedView;
    if (d.active === 'Model') return this.views.Model;
    const pv = this.paperView();
    if (d.mspace) { const vp = d.mspace; return { cx: vp.vc.x + (pv.cx - vp.c.x) / vp.scale, cy: vp.vc.y + (pv.cy - vp.c.y) / vp.scale, s: pv.s * vp.scale }; }
    return pv;
  }
  setCur(v) {
    const d = this.doc;
    if (d.blockEdit) Object.assign(this.bedView, v);
    else if (d.active === 'Model') Object.assign(this.views.Model, v);
    else if (d.mspace) {
      const pv = this.paperView(), vp = d.mspace;
      d.touch(vp);
      vp.scale = v.s / pv.s;
      vp.vc = { x: v.cx - (pv.cx - vp.c.x) / vp.scale, y: v.cy - (pv.cy - vp.c.y) / vp.scale };
    } else Object.assign(this.paperView(), v);
    this.redraw();
    this.app.ui?.status?.update?.();
  }
  get scale() { return this.cur.s; }
  toScreen(p, v = this.cur) { return { x: (p.x - v.cx) * v.s + this.W / 2, y: this.H / 2 - (p.y - v.cy) * v.s }; }
  toWorld(x, y, v = this.cur) { return { x: (x - this.W / 2) / v.s + v.cx, y: (this.H / 2 - y) / v.s + v.cy }; }
  worldBB(v = this.cur) { const a = this.toWorld(0, this.H, v), b = this.toWorld(this.W, 0, v); return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }; }

  zoomAt(f, sx, sy) {
    const v = { ...this.cur }, w0 = this.toWorld(sx, sy, v);
    v.s = Math.min(1e7, Math.max(1e-7, v.s * f));
    v.cx = w0.x - (sx - this.W / 2) / v.s; v.cy = w0.y + (sy - this.H / 2) / v.s;
    this.setCur(v);
  }
  panPx(dx, dy) { const v = { ...this.cur }; v.cx -= dx / v.s; v.cy += dy / v.s; this.setCur(v); }
  zoomWindow(bb, margin = 1.05) {
    if (!bb || !isFinite(bb.x1)) return;
    const w = Math.max(bb.x2 - bb.x1, 1e-6), h = Math.max(bb.y2 - bb.y1, 1e-6);
    const s = Math.min(this.W / (w * margin), this.H / (h * margin));
    this.setCur({ cx: (bb.x1 + bb.x2) / 2, cy: (bb.y1 + bb.y2) / 2, s: isFinite(s) && s > 0 ? s : 1 });
  }
  zoomExtents() {
    const d = this.doc;
    if (d.paperMode) { const l = d.layout; const bb = d.extents(l.ents) || { x1: 0, y1: 0, x2: l.w, y2: l.h }; G.bbUnion(bb, { x1: 0, y1: 0, x2: l.w, y2: l.h }); this.zoomWindow(bb, 1.1); return; }
    const bb = d.extents(d.space);
    if (bb) this.zoomWindow(bb); else this.setCur({ cx: 0, cy: 0, s: Math.min(this.W / 420, this.H / 297) });
  }

  snapEnts() { return this.doc.space; }

  // ---- entrada de cursor: calcula punto con forzados
  updateCursor() {
    const raw = this.toWorld(this.mouse.x, this.mouse.y);
    this.cursor = raw;
    const req = this.eng?.req;
    let p = raw; this.snapInfo = null; this.trackInfo = null;
    const wantsPoint = req && req.wantsPoint;
    if (wantsPoint || this.eng?.gripDrag) {
      const base = req?.base || this.eng?.gripDrag?.base;
      const os = osnap(this.app, raw, base, this.eng.osOverride);
      if (os) { p = os.p; this.snapInfo = os; }
      else {
        const d = this.doc;
        if (d.vars.SNAPMODE) p = gridSnap(p, d.vars.SNAPUNIT || 1);
        if (base && d.vars.ORTHOMODE) p = orthoPoint(base, p, d.vars.SNAPANG || 0);
        else if (base && d.vars.POLARMODE) { const pp = polarPoint(base, p, d.vars.POLARANG || 90); if (pp) { p = pp.p; this.trackInfo = { base, ang: pp.ang, d: G.dist(base, p) }; } }
      }
    }
    this.snapped = p;
  }

  // ---- render principal
  bg() {
    const s = this.app.settings;
    if (this.doc.paperMode || (this.doc.active !== 'Model' && !this.doc.blockEdit)) return s.bgLayoutOut;
    return this.doc.blockEdit ? '#3b4350' : s.bgModel;
  }
  isDarkBg(c) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c || ''); if (!m) return true; return (parseInt(m[1], 16) * 0.3 + parseInt(m[2], 16) * 0.59 + parseInt(m[3], 16) * 0.11) < 128; }
  setWorld(ctx, v) { const r = this.dpr; ctx.setTransform(r * v.s, 0, 0, -r * v.s, r * (this.W / 2 - v.cx * v.s), r * (this.H / 2 + v.cy * v.s)); }
  baseStyle(v, extra = {}) {
    const bg = this.bg(), d = this.doc;
    return { px: v.s * this.dpr, bgDark: this.isDarkBg(bg), bg, lwdisplay: d.vars.LWDISPLAY, viewBB: this.worldBB(v), vh: this.H / v.s, qtext: d.vars.QTEXTMODE, showAttdefValue: false, ...extra };
  }
  render() {
    const ctx = this.ctx, d = this.doc;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bg(); ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    if (d.blockEdit || d.active === 'Model') {
      const v = this.cur;
      if (d.vars.GRIDMODE) this.drawGrid(ctx, v);
      this.setWorld(ctx, v);
      drawEnts(ctx, d.space, d, this.baseStyle(v));
      if (d.blockEdit) this.drawBlockEditMarkers(ctx, v);
    } else this.renderLayout(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  renderLayout(ctx) {
    const d = this.doc, l = d.layout, pv = this.paperView();
    const a = this.toScreen({ x: 0, y: l.h }, pv);
    const r = this.dpr;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect((a.x + 5) * r, (a.y + 5) * r, l.w * pv.s * r, l.h * pv.s * r);
    ctx.fillStyle = this.app.settings.bgPaper; ctx.fillRect(a.x * r, a.y * r, l.w * pv.s * r, l.h * pv.s * r);
    // márgenes imprimibles
    this.setWorld(ctx, pv);
    ctx.setLineDash([2 / pv.s, 2 / pv.s]); ctx.strokeStyle = '#999'; ctx.lineWidth = 1 / (pv.s * r);
    ctx.strokeRect(5, 5, l.w - 10, l.h - 10); ctx.setLineDash([]);
    const stP = this.baseStyle(pv, { bgDark: this.isDarkBg(this.app.settings.bgPaper), bg: this.app.settings.bgPaper });
    // contenido de ventanas
    for (const vp of l.ents) {
      if (vp.type !== 'VIEWPORT' || vp.on === false || !d.isVisible(vp)) continue;
      const mv = { cx: vp.vc.x + (pv.cx - vp.c.x) / vp.scale, cy: vp.vc.y + (pv.cy - vp.c.y) / vp.scale, s: pv.s * vp.scale };
      ctx.save();
      this.setWorld(ctx, pv);
      ctx.beginPath(); ctx.rect(vp.c.x - vp.w / 2, vp.c.y - vp.h / 2, vp.w, vp.h); ctx.clip();
      this.setWorld(ctx, mv);
      const vbb = { x1: vp.vc.x - vp.w / 2 / vp.scale, x2: vp.vc.x + vp.w / 2 / vp.scale, y1: vp.vc.y - vp.h / 2 / vp.scale, y2: vp.vc.y + vp.h / 2 / vp.scale };
      const frozen = new Set(vp.frozen || []);
      const ents = frozen.size ? d.model.filter((e) => !frozen.has(e.layer)) : d.model;
      drawEnts(ctx, ents, d, { ...stP, px: mv.s * r, viewBB: vbb, ltk: d.vars.PSLTSCALE ? 1 / vp.scale : 1 });
      ctx.restore();
    }
    this.setWorld(ctx, pv);
    drawEnts(ctx, l.ents, d, stP);
    if (d.mspace) { const vp = d.mspace; ctx.lineWidth = 3 / (pv.s * r); ctx.strokeStyle = '#2b8cff'; ctx.strokeRect(vp.c.x - vp.w / 2, vp.c.y - vp.h / 2, vp.w, vp.h); }
  }
  drawGrid(ctx, v) {
    const d = this.doc, r = this.dpr;
    let u = d.vars.GRIDUNIT || 10;
    while (u * v.s < 8) u *= 5;
    while (u * v.s > 200) u /= 5;
    const bb = this.worldBB(v);
    const dark = this.isDarkBg(this.bg());
    const minor = dark ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.06)', major = dark ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.13)';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.lineWidth = 1;
    const x0 = Math.floor(bb.x1 / u), x1 = Math.ceil(bb.x2 / u), y0 = Math.floor(bb.y1 / u), y1 = Math.ceil(bb.y2 / u);
    if ((x1 - x0) + (y1 - y0) > 3000) return;
    for (const majorPass of [false, true]) {
      ctx.strokeStyle = majorPass ? major : minor; ctx.beginPath();
      for (let i = x0; i <= x1; i++) { if ((i % 5 === 0) !== majorPass) continue; const sx = Math.round(this.toScreen({ x: i * u, y: 0 }, v).x * r) + 0.5; ctx.moveTo(sx, 0); ctx.lineTo(sx, this.cv.height); }
      for (let j = y0; j <= y1; j++) { if ((j % 5 === 0) !== majorPass) continue; const sy = Math.round(this.toScreen({ x: 0, y: j * u }, v).y * r) + 0.5; ctx.moveTo(0, sy); ctx.lineTo(this.cv.width, sy); }
      ctx.stroke();
    }
    // ejes
    const o = this.toScreen({ x: 0, y: 0 }, v);
    ctx.strokeStyle = dark ? 'rgba(200,80,80,.35)' : 'rgba(200,0,0,.3)'; ctx.beginPath(); ctx.moveTo(0, Math.round(o.y * r) + 0.5); ctx.lineTo(this.cv.width, Math.round(o.y * r) + 0.5); ctx.stroke();
    ctx.strokeStyle = dark ? 'rgba(80,200,80,.35)' : 'rgba(0,150,0,.3)'; ctx.beginPath(); ctx.moveTo(Math.round(o.x * r) + 0.5, 0); ctx.lineTo(Math.round(o.x * r) + 0.5, this.cv.height); ctx.stroke();
  }
  drawBlockEditMarkers(ctx, v) {
    const be = this.doc.blockEdit; if (!be) return;
    const px = v.s * this.dpr;
    ctx.save();
    ctx.lineWidth = 1 / px; ctx.strokeStyle = '#7fd4ff'; ctx.fillStyle = '#7fd4ff';
    // punto base
    const b = be.base || { x: 0, y: 0 }; const k = 8 / v.s;
    ctx.beginPath(); ctx.moveTo(b.x - k, b.y); ctx.lineTo(b.x + k, b.y); ctx.moveTo(b.x, b.y - k); ctx.lineTo(b.x, b.y + k); ctx.stroke();
    const label = (p, t) => { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1 / v.s, -1 / v.s); ctx.font = '11px system-ui, sans-serif'; ctx.fillText(t, 6, -6); ctx.restore(); };
    for (const p of be.params || []) {
      ctx.setLineDash([4 / v.s, 3 / v.s]);
      if (p.type === 'linear' || p.type === 'flip') { ctx.beginPath(); ctx.moveTo(p.p1.x, p.p1.y); ctx.lineTo(p.p2.x, p.p2.y); ctx.stroke(); label(G.mid(p.p1, p.p2), `${p.name}${p.type === 'linear' ? ' = ' + G.fmt(G.dist(p.p1, p.p2), 3) : ''}`); }
      if (p.type === 'rotation') { ctx.beginPath(); ctx.arc(p.c.x, p.c.y, p.r || 1, 0, G.TAU); ctx.stroke(); label(p.c, p.name); }
      if (p.type === 'visibility') label(p.p || b, `${p.name} [${(p.states || []).map((s) => s.name).join(', ')}]`);
      ctx.setLineDash([]);
      for (const ac of p.actions || []) if (ac.frame) { ctx.strokeStyle = '#ffb84d'; ctx.setLineDash([2 / v.s, 2 / v.s]); ctx.strokeRect(ac.frame.x1, ac.frame.y1, ac.frame.x2 - ac.frame.x1, ac.frame.y2 - ac.frame.y1); ctx.setLineDash([]); ctx.strokeStyle = '#7fd4ff'; }
    }
    ctx.restore();
  }

  // ---- overlay
  renderOverlay() {
    const c = this.octx, r = this.dpr, d = this.doc, eng = this.eng, v = this.cur;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.ov.width, this.ov.height);
    if (!eng) return;
    const dark = this.isDarkBg(this.bg());
    const st = this.baseStyle(v, { viewBB: null });
    // selección y hover
    this.setWorld(c, v);
    const selSet = new Set([...(eng.sel || []), ...(eng.req?.sel || [])]);
    let n = 0;
    for (const e of selSet) { if (n++ > 3000) break; drawEnt(c, e, d, { ...st, override: dark ? '#5fb2ff' : '#1565c0', extraW: 1.5, noDash: false }); }
    if (eng.hover && !selSet.has(eng.hover)) { c.globalAlpha = 0.85; drawEnt(c, eng.hover, d, { ...st, extraW: 2, noDash: true }); c.globalAlpha = 1; }
    // previsualización
    const prev = eng.preview ? eng.preview(this.snapped) : null;
    if (prev) for (const e of prev) { if (!e) continue; if (e.layer == null) { e.layer = d.clayer; e.color ??= d.vars.CECOLOR; e.ltype ??= d.vars.CELTYPE; } drawEnt(c, e, d, { ...st, override: e._ghost ? (dark ? 'rgba(200,200,200,.55)' : 'rgba(60,60,60,.6)') : null }); }
    const base = eng.req?.base;
    if (base && eng.req?.rubber !== false && eng.req?.wantsPoint) {
      c.setLineDash([6 / v.s, 4 / v.s]); c.lineWidth = 1 / (v.s * r); c.strokeStyle = dark ? '#cfd8e3' : '#333';
      c.beginPath();
      if (eng.req.rubber === 'rect') { const p = this.snapped; c.rect(base.x, base.y, p.x - base.x, p.y - base.y); } else { c.moveTo(base.x, base.y); c.lineTo(this.snapped.x, this.snapped.y); }
      c.stroke(); c.setLineDash([]);
    }
    // ventana de selección
    const win = eng.win;
    if (win) {
      const p1 = win.p1, p2 = this.cursor;
      const crossing = p2.x < p1.x;
      c.fillStyle = crossing ? 'rgba(60,180,80,.18)' : 'rgba(60,110,230,.18)';
      c.strokeStyle = crossing ? '#3c3' : '#4a8cff'; c.lineWidth = 1 / (v.s * r);
      if (crossing) c.setLineDash([5 / v.s, 3 / v.s]);
      c.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y); c.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y); c.setLineDash([]);
    }
    c.setTransform(1, 0, 0, 1, 0, 0);
    // grips
    if (eng.grips && eng.grips.length) {
      const gs = this.app.settings.gripSize || 6;
      for (const g of eng.grips) {
        const s = this.toScreen(g.p); const x = s.x * r, y = s.y * r, h = gs * r / 2 + 0.5;
        const hot = eng.gripDrag && eng.gripDrag.grip === g, near = eng.hoverGrip === g;
        c.fillStyle = hot ? '#ff3030' : near ? '#ff9a3c' : g.kind?.startsWith('d') ? '#26c6da' : g.kind === 'mid' ? '#5aa0ff' : '#2a6dff';
        c.strokeStyle = '#0a1a33'; c.lineWidth = 1;
        c.beginPath();
        if (g.kind === 'dlin') { c.moveTo(x - h * 1.4, y - h); c.lineTo(x + h * 1.4, y); c.lineTo(x - h * 1.4, y + h); c.closePath(); }
        else if (g.kind === 'drot') c.arc(x, y, h * 1.2, 0, G.TAU);
        else if (g.kind === 'dflip') { c.moveTo(x - h * 1.4, y); c.lineTo(x, y - h * 1.3); c.lineTo(x + h * 1.4, y); c.lineTo(x, y + h * 1.3); c.closePath(); }
        else if (g.kind === 'dvis') { c.moveTo(x - h * 1.3, y - h); c.lineTo(x + h * 1.3, y - h); c.lineTo(x, y + h); c.closePath(); }
        else if (g.kind === 'mid') c.rect(x - h, y - h * 0.6, 2 * h, h * 1.2);
        else c.rect(x - h, y - h, 2 * h, 2 * h);
        c.fill(); c.stroke();
      }
    }
    // marcador osnap
    if (this.snapInfo && this.mouse.in) this.drawSnapMarker(c, this.snapInfo);
    if (this.trackInfo && this.mouse.in) {
      const a = this.toScreen(this.trackInfo.base), b = this.toScreen(this.snapped);
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      c.strokeStyle = '#4caf50'; c.setLineDash([3 * r, 3 * r]); c.lineWidth = r; c.beginPath(); c.moveTo(a.x * r, a.y * r); c.lineTo((a.x + dx / L * 4000) * r, (a.y + dy / L * 4000) * r); c.stroke(); c.setLineDash([]);
    }
    // cursor
    if (this.mouse.in) this.drawCursor(c, dark);
    this.app.ui?.dyn?.update?.();
  }
  drawSnapMarker(c, s) {
    const r = this.dpr, p = this.toScreen(s.p), x = p.x * r, y = p.y * r, k = 6 * r;
    c.strokeStyle = '#2bff2b'; c.lineWidth = 2 * r; c.beginPath();
    switch (s.t) {
      case 'end': c.rect(x - k, y - k, 2 * k, 2 * k); break;
      case 'mid': c.moveTo(x - k, y + k); c.lineTo(x + k, y + k); c.lineTo(x, y - k); c.closePath(); break;
      case 'cen': c.arc(x, y, k, 0, G.TAU); break;
      case 'nod': c.arc(x, y, k, 0, G.TAU); c.moveTo(x - k, y - k); c.lineTo(x + k, y + k); c.moveTo(x + k, y - k); c.lineTo(x - k, y + k); break;
      case 'qua': c.moveTo(x, y - k); c.lineTo(x + k, y); c.lineTo(x, y + k); c.lineTo(x - k, y); c.closePath(); break;
      case 'int': c.moveTo(x - k, y - k); c.lineTo(x + k, y + k); c.moveTo(x + k, y - k); c.lineTo(x - k, y + k); break;
      case 'ins': c.rect(x - k, y - k, k, k); c.rect(x, y, k, k); break;
      case 'per': c.moveTo(x - k, y - k); c.lineTo(x - k, y + k); c.lineTo(x + k, y + k); c.moveTo(x - k, y); c.lineTo(x, y); c.lineTo(x, y + k); break;
      case 'tan': c.arc(x, y, k * 0.8, 0, G.TAU); c.moveTo(x - k, y - k); c.lineTo(x + k, y - k); break;
      case 'nea': c.moveTo(x - k, y - k); c.lineTo(x + k, y + k); c.lineTo(x - k, y + k); c.lineTo(x + k, y - k); c.closePath(); break;
      default: c.rect(x - k, y - k, 2 * k, 2 * k);
    }
    c.stroke();
    c.font = `${11 * r}px system-ui, sans-serif`;
    const t = OSLABEL[s.t] || s.t, tw = c.measureText(t).width;
    c.fillStyle = 'rgba(255,255,220,.95)'; c.fillRect(x + 12 * r, y + 10 * r, tw + 8 * r, 17 * r);
    c.fillStyle = '#222'; c.fillText(t, x + 16 * r, y + 23 * r);
  }
  drawCursor(c, dark) {
    const r = this.dpr, eng = this.eng, req = eng.req;
    const p = (req?.wantsPoint || eng.gripDrag) ? this.toScreen(this.snapped) : { x: this.mouse.x, y: this.mouse.y };
    const x = Math.round(p.x * r) + 0.5, y = Math.round(p.y * r) + 0.5;
    const size = this.app.settings.crosshair >= 100 ? 1e5 : (this.app.settings.crosshair / 100) * Math.max(this.W, this.H) / 2 * r;
    c.strokeStyle = dark ? '#e8e8e8' : '#111'; c.lineWidth = 1; c.beginPath();
    const showCross = !req || req.wantsPoint || eng.gripDrag;
    const pb = (this.doc.vars.PICKBOX || 4) * r;
    if (showCross) { c.moveTo(x - size, y); c.lineTo(x + size, y); c.moveTo(x, y - size); c.lineTo(x, y + size); }
    if (!req || req.kind === 'select' || req.kind === 'entity') c.rect(x - pb, y - pb, 2 * pb, 2 * pb);
    if (req?.wantsPoint) { const ap = 0; void ap; }
    c.stroke();
    // icono SCU
    if (this.app.settings.ucsIcon) {
      const o = { x: 40 * r, y: (this.H - 40) * r }, L = 30 * r;
      c.strokeStyle = dark ? '#d33' : '#c00'; c.lineWidth = 2 * r; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + L, o.y); c.stroke();
      c.strokeStyle = dark ? '#3c3' : '#090'; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x, o.y - L); c.stroke();
      c.fillStyle = dark ? '#ccc' : '#333'; c.font = `${10 * r}px system-ui`; c.fillText('X', o.x + L + 3 * r, o.y + 4 * r); c.fillText('Y', o.x - 3 * r, o.y - L - 4 * r);
    }
  }

  // ---- eventos
  bindEvents() {
    const el = this.ov;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = e.clientX - r.left, ny = e.clientY - r.top;
      if (this.panning) { this.panPx(nx - this.mouse.x, ny - this.mouse.y); }
      this.mouse = { x: nx, y: ny, in: true };
      this.updateCursor();
      this.eng?.pointerMove(this.ptInfo(e));
      this.redrawOverlay();
      this.app.ui?.status?.coords?.(this.snapped);
    });
    el.addEventListener('pointerleave', () => { this.mouse.in = false; this.redrawOverlay(); });
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture?.(e.pointerId); this.lastShift = e.shiftKey;
      const r = el.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top, in: true };
      this.updateCursor();
      if (e.button === 1) {
        e.preventDefault();
        const now = performance.now();
        if (now - (this._lastMid || 0) < 350) { this.zoomExtents(); this._lastMid = 0; return; }
        this._lastMid = now; this.panning = true; el.style.cursor = 'grabbing'; return;
      }
      this.app.ui?.cmdline?.focus?.();
      if (this.eng?.req?.kind === 'pan' && e.button === 0) { this.panning = true; el.style.cursor = 'grabbing'; return; }
      this.eng?.pointerDown(this.ptInfo(e));
    });
    el.addEventListener('pointerup', (e) => {
      if (e.button === 1 || this.panning) { this.panning = false; el.style.cursor = ''; return; }
      this.eng?.pointerUp(this.ptInfo(e));
    });
    el.addEventListener('dblclick', (e) => { if (e.button === 0) this.eng?.dblClick(this.ptInfo(e)); });
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const f = Math.pow(1.0015, -e.deltaY * (e.deltaMode === 1 ? 30 : 1));
      this.zoomAt(f, e.clientX - r.left, e.clientY - r.top);
      this.updateCursor(); this.redrawOverlay();
    }, { passive: false });
  }
  ptInfo(e) {
    return { raw: this.cursor, p: this.snapped, sx: this.mouse.x, sy: this.mouse.y, button: e.button, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey, alt: e.altKey, ev: e };
  }
  pickTol() { return (this.doc.vars.PICKBOX || 4) / this.scale; }
  pickAt(p, ents = this.doc.space) {
    const tol = this.pickTol(), d = this.doc;
    let best = null, bd = Infinity;
    const bb = { x1: p.x - tol, y1: p.y - tol, x2: p.x + tol, y2: p.y + tol };
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      if (!d.isVisible(e)) continue;
      if (e.type !== 'XLINE' && e.type !== 'RAY') { const b = E.entBBox(e, d); if (G.bbValid(b) && !G.bbOverlap(b, bb)) continue; }
      const dd = E.entDist(e, p, d);
      if (dd <= tol && dd < bd - 1e-12) { bd = dd; best = e; if (dd === 0 && e.type !== 'HATCH') break; }
    }
    return best;
  }
}
export { PAPER };
