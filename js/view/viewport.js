// Vista: canvas de dibujo + overlay, zoom/encuadre, rejilla, cursor, osnaps, pinzamientos
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { drawEnts, drawEnt } from './renderer.js';
import { osnap, orthoPoint, isoOrthoPoint, polarPoint, gridSnap, OSLABEL } from './snap.js';
import { PAPER, aciCss } from '../core/tables.js';
import { THEMES } from '../app.js';
import { GridIndex } from '../core/spatial.js';
import { tKnown } from '../core/i18n.js';
import * as P3 from '../core/plane3d.js';

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
  // ventanas en mosaico del espacio modelo (VPORTS): doc.ext.vports = { cfg, act, tiles: [{ x, y, w, h (fracciones), v: {cx, cy, s} }] }
  get tiles() { const d = this.doc; if (!d || d.blockEdit || d.active !== 'Model') return null; const t = d.ext?.vports; return t && t.tiles?.length > 1 ? t : null; }
  tileRect(i) {
    const t = this.tiles; if (!t) return null; const k = t.tiles[i ?? (this._rt ?? t.act)] || t.tiles[0];
    const HW = this.host.clientWidth, HH = this.host.clientHeight;
    const x = Math.round(k.x * HW), y = Math.round(k.y * HH);
    return { x, y, w: Math.round((k.x + k.w) * HW) - x, h: Math.round((k.y + k.h) * HH) - y };
  }
  get W() { const t = this.tileRect(); return t ? t.w : this.host.clientWidth; }
  get H() { const t = this.tileRect(); return t ? t.h : this.host.clientHeight; }
  resize() {
    this.dpr = window.devicePixelRatio || 1;
    const HW = this.host.clientWidth, HH = this.host.clientHeight;
    this.cv.width = Math.max(1, HW * this.dpr); this.cv.height = Math.max(1, HH * this.dpr);
    const t = this.tileRect();
    this.ov.width = Math.max(1, this.W * this.dpr); this.ov.height = Math.max(1, this.H * this.dpr);
    Object.assign(this.ov.style, t ? { left: t.x + 'px', top: t.y + 'px', width: t.w + 'px', height: t.h + 'px' } : { left: '', top: '', width: '', height: '' });
    this.dirty = true; this.odirty = true;
  }
  syncTiles() {
    const t = this.tiles;
    if (t) { this.views.Model = t.tiles[t.act].v; this._tileKey !== JSON.stringify([t.cfg, t.act, t.tiles.length]) && ((this._tileKey = JSON.stringify([t.cfg, t.act, t.tiles.length])), this.resize()); }
    else if (this._tileKey) { this._tileKey = null; this.resize(); }
  }
  setActiveTile(i) { const t = this.tiles; if (!t || i === t.act || !t.tiles[i]) return; t.act = i; this.views.Model = t.tiles[i].v; this.syncTiles(); this.updateCursor?.(); this.redraw(); this.app.ui?.status?.update?.(); }
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
  // ---- 3D: cámara de la vista principal (doc.ext.view3d) y plano de trabajo actual (doc.ext.wp)
  get cam() { return this.doc?.ext?.view3d || null; }
  get wp() { return this.doc?.ext?.wp || null; }
  hasWp() { const d = this.doc; if (!d) return false; if (this._wpRev !== d.rev || this._wpDoc !== d) { this._wpRev = d.rev; this._wpDoc = d; this._wpHas = d.model.some((e) => e.wp && !P3.isWorld(e.wp)); this._solHas = d.model.some((e) => e.type === '3DSOLID'); } return this._wpHas; }
  // proyección activa: solo en el espacio modelo, fuera del editor de bloques
  get P() {
    const d = this.doc; if (!d || d.blockEdit || d.active !== 'Model') return null;
    if (!this.cam && !this.hasWp() && P3.isWorld(this.wp) && !(this._solHas && (d.vars.VSCURRENT || '2dWireframe') !== '2dWireframe')) return null;
    const k = JSON.stringify([this.cam, this.wp]);
    if (this._pk !== k) { this._pk = k; const B = P3.basis(this.cam); const A = P3.affine(this.wp, B); const dt = P3.det(A); this._P = { B, A, det: dt, inv: Math.abs(dt) > 1e-9 ? { a: A.d / dt, b: -A.b / dt, c: -A.c / dt, d: A.a / dt } : null }; }
    return this._P;
  }
  affOf(pl) { const P = this.P; return P ? (P3.same(pl, this.wp) ? P.A : P3.affine(pl, P.B)) : null; }
  // coordenadas 2D de vista <-> pantalla
  v2s(q, v = this.cur) { return { x: (q.x - v.cx) * v.s + this.W / 2, y: this.H / 2 - (q.y - v.cy) * v.s }; }
  s2v(x, y, v = this.cur) { return { x: (x - this.W / 2) / v.s + v.cx, y: (this.H / 2 - y) / v.s + v.cy }; }
  // punto local de un plano -> 2D de vista
  l2v(p, A) { const z = p.z || 0; return { x: A.a * p.x + A.c * p.y + A.e + A.zx * z, y: A.b * p.x + A.d * p.y + A.f + A.zy * z }; }
  v2l(q, A) { const dt = P3.det(A); if (Math.abs(dt) < 1e-9) return null; const x = q.x - A.e, y = q.y - A.f; return { x: (A.d * x - A.c * y) / dt, y: (-A.b * x + A.a * y) / dt }; }
  toScreen(p, v = this.cur) { const P = v === this.cur ? this.P : null; return this.v2s(P ? this.l2v(p, P.A) : p, v); }
  toWorld(x, y, v = this.cur) { const q = this.s2v(x, y, v), P = v === this.cur ? this.P : null; if (!P) return q; return this.v2l(q, P.A) || q; }
  // punto del plano de trabajo actual -> universal 3D
  toW3(p) { const w = P3.toW(this.wp, p); return { x: w[0], y: w[1], z: w[2] }; }
  w3ToScreen(W, v = this.cur) { const B = this.P?.B || P3.basis(null); return this.v2s({ x: P3.dot(W, B.R), y: P3.dot(W, B.U) }, v); }
  worldBB(v = this.cur) { const a = this.toWorld(0, this.H, v), b = this.toWorld(this.W, 0, v); return { x1: Math.min(a.x, b.x), y1: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y) }; }
  // cambia la cámara conservando en el centro de la pantalla el punto del plano de trabajo que estaba allí
  setCam(cam) {
    const d = this.doc, v = { ...this.cur }, B0 = this.P?.B || P3.basis(this.cam);
    let piv = null; const c = this.toWorld(this.W / 2, this.H / 2);
    if (this.P?.inv || !this.P) piv = this.P ? P3.toW(this.wp, c) : [c.x, c.y, 0];
    if (!piv) piv = P3.add(P3.mul(B0.R, v.cx), P3.mul(B0.U, v.cy));
    d.ext.view3d = cam ? { az: cam.az, el: cam.el } : null; this._pk = null;
    const B = P3.basis(d.ext.view3d);
    v.cx = P3.dot(piv, B.R); v.cy = P3.dot(piv, B.U);
    this.setCur(v); this.updateCursor?.(); this.redrawOverlay();
    this.app.ui?.refresh?.();
  }

  zoomAt(f, sx, sy) {
    const v = { ...this.cur }, w0 = this.s2v(sx, sy, v);
    v.s = Math.min(1e7, Math.max(1e-7, v.s * f));
    v.cx = w0.x - (sx - this.W / 2) / v.s; v.cy = w0.y + (sy - this.H / 2) / v.s;
    this.setCur(v);
  }
  panPx(dx, dy) { const v = { ...this.cur }; v.cx -= dx / v.s; v.cy += dy / v.s; this.setCur(v); }
  // caja (en coordenadas de vista) de unos objetos con proyección 3D
  projBB(ents) {
    const P = this.P, d = this.doc, bb = G.bbNew();
    for (const e of ents) {
      if (!d.isVisible(e)) continue;
      if (e.type === '3DSOLID') { const m = this.app.meshOf?.(e); if (m) for (const w of m.v) G.bbAdd(bb, { x: P3.dot(w, P.B.R), y: P3.dot(w, P.B.U) }); continue; }
      if (e.type === 'XLINE' || e.type === 'RAY') continue;
      const b = E.entBBox(e, d); if (!G.bbValid(b)) continue;
      const A = this.affOf(e.wp || P3.WORLD);
      for (const q of [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y1 }, { x: b.x2, y: b.y2 }, { x: b.x1, y: b.y2 }]) G.bbAdd(bb, this.l2v(q, A));
    }
    return G.bbValid(bb) ? bb : null;
  }
  zoomWindow(bb, margin = 1.05) {
    if (!bb || !isFinite(bb.x1)) return;
    if (this.P && !bb.view) { const A = this.P.A, b2 = G.bbNew(); for (const q of [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x2, y: bb.y2 }, { x: bb.x1, y: bb.y2 }]) G.bbAdd(b2, this.l2v(q, A)); bb = b2; }
    const w = Math.max(bb.x2 - bb.x1, 1e-6), h = Math.max(bb.y2 - bb.y1, 1e-6);
    const s = Math.min(this.W / (w * margin), this.H / (h * margin));
    this.setCur({ cx: (bb.x1 + bb.x2) / 2, cy: (bb.y1 + bb.y2) / 2, s: isFinite(s) && s > 0 ? s : 1 });
  }
  zoomExtents() {
    const d = this.doc;
    if (d.paperMode) { const l = d.layout; const bb = d.extents(l.ents) || { x1: 0, y1: 0, x2: l.w, y2: l.h }; G.bbUnion(bb, { x1: 0, y1: 0, x2: l.w, y2: l.h }); this.zoomWindow(bb, 1.1); return; }
    if (this.P) { const pb = this.projBB(d.space); if (pb) { pb.view = true; this.zoomWindow(pb); } else { const o = this.l2v({ x: 0, y: 0 }, this.P.A); this.setCur({ cx: o.x, cy: o.y, s: Math.min(this.W / 420, this.H / 297) }); } return; }
    const bb = d.extents(d.space);
    if (bb) this.zoomWindow(bb); else this.setCur({ cx: 0, cy: 0, s: Math.min(this.W / 420, this.H / 297) });
  }

  // índice espacial del espacio actual (se rehace cuando cambia el dibujo)
  index() {
    const d = this.doc, sp = d.space;
    if (sp.length < 400 || this.P) return null;
    if (!this._idx || this._idx.sp !== sp || this._idx.rev !== d.rev || this._idx.n !== sp.length) this._idx = { sp, rev: d.rev, n: sp.length, g: new GridIndex(sp, d) };
    return this._idx.g;
  }
  near(bb) { const g = this.index(); return g ? g.query(bb) : this.doc.space; }
  snapEnts(bb) { const all = bb ? this.near(bb) : this.doc.space; if (!this.P) return all; const k = P3.key(this.wp); return all.filter((e) => e.type !== '3DSOLID' && P3.key(e.wp) === k); }

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
      this.otrack = null;
      const otOn = (this.doc.vars.AUTOSNAP & 16) && !(this.doc.vars.OSMODE & 16384);
      if (otOn) this.otAcquire(os);
      if (os) { p = os.p; this.snapInfo = os; }
      else {
        const d = this.doc;
        const ot = otOn ? this.otAlign(raw, base) : null;
        if (ot) { p = ot.p; this.otrack = ot; }
        else {
          if (d.vars.SNAPMODE) p = gridSnap(p, d.vars.SNAPUNIT || 1);
          if (base && d.vars.ORTHOMODE) p = d.vars.SNAPSTYL === 1 ? isoOrthoPoint(base, p, d.vars.ISOPLANE || 0) : orthoPoint(base, p, (d.vars.SNAPANG || 0) + (d.ext?.ucs?.a || 0));
          else if (base && d.vars.POLARMODE) { const pp = polarPoint(base, p, d.vars.POLARANG || 90); if (pp) { p = pp.p; this.trackInfo = { base, ang: pp.ang, d: G.dist(base, p) }; } }
        }
      }
    } else if (!this.eng?.active) this.otPts = [];
    this.snapped = p;
  }
  // ---- rastreo de referencias a objetos (OTRACK): se adquiere un punto parando el cursor sobre él ~0,4 s
  otAcquire(os) {
    const now = performance.now();
    if (this.eng?.active !== this._otCmd) { this._otCmd = this.eng?.active; this.otPts = []; }
    this.otPts ||= [];
    if (!os) { this._otHover = null; return; }
    const key = `${os.p.x.toFixed(6)},${os.p.y.toFixed(6)}`;
    if (!this._otHover || this._otHover.key !== key) {
      this._otHover = { key, t: now, done: false, p: os.p };
      clearTimeout(this._otTimer);
      this._otTimer = setTimeout(() => { if (this._otHover?.key === key) { this.updateCursor(); this.redrawOverlay(); } }, 420);
      return;
    }
    if (!this._otHover.done && now - this._otHover.t > 400) {
      this._otHover.done = true;
      const i = this.otPts.findIndex((q) => G.dist(q, os.p) < 1e-9);
      if (i >= 0) this.otPts.splice(i, 1); else { this.otPts.push({ x: os.p.x, y: os.p.y }); if (this.otPts.length > 7) this.otPts.shift(); }
    }
  }
  otAlign(raw, base) {
    const pts = [...(this.otPts || [])];
    if (!pts.length) return null;
    const tol = 8 / this.scale, d = this.doc;
    const inc = d.vars.POLARMODE ? (d.vars.POLARANG || 90) : 90;
    const lines = [];
    for (const a of pts) {
      for (let k = 0; k < 360; k += inc) {
        const r = G.rad(k), dir = { x: Math.cos(r), y: Math.sin(r) };
        const t = G.dot(G.sub(raw, a), dir); if (t <= 0) continue;
        const q = G.add(a, G.mul(dir, t)), dd = G.dist(q, raw);
        if (dd < tol) lines.push({ a, dir, q, dd, ang: k });
      }
    }
    if (!lines.length) return null;
    lines.sort((x, y) => x.dd - y.dd);
    // dos alineaciones de puntos distintos: intersección
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
      const L1 = lines[i], L2 = lines[j];
      if (Math.abs(G.cross(L1.dir, L2.dir)) < 1e-9) continue;
      const x = G.lineLineInf ? G.lineLineInf(L1.a, G.add(L1.a, L1.dir), L2.a, G.add(L2.a, L2.dir)) : null;
      const ip = x || (() => { const w = G.sub(L2.a, L1.a), den = G.cross(L1.dir, L2.dir), t = G.cross(w, L2.dir) / den; return G.add(L1.a, G.mul(L1.dir, t)); })();
      if (G.dist(ip, raw) < tol * 1.5) return { p: ip, lines: [L1, L2] };
    }
    const L = lines[0];
    return { p: L.q, lines: [L] };
  }

  // ---- render principal
  bg() {
    const s = this.app.settings;
    if (this.doc.paperMode || (this.doc.active !== 'Model' && !this.doc.blockEdit)) return s.bgLayoutOut;
    return this.doc.blockEdit ? (THEMES[s.theme] || THEMES.dark).bedit : s.bgModel;
  }
  isDarkBg(c) { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(c || ''); if (!m) return true; return (parseInt(m[1], 16) * 0.3 + parseInt(m[2], 16) * 0.59 + parseInt(m[3], 16) * 0.11) < 128; }
  setWorld(ctx, v, pl) { const r = this.dpr; ctx.setTransform(r * v.s, 0, 0, -r * v.s, r * (this.W / 2 - v.cx * v.s), r * (this.H / 2 + v.cy * v.s)); const P = v === this.cur ? this.P : null; if (P) { const A = pl === undefined ? P.A : this.affOf(pl || P3.WORLD); ctx.transform(A.a, A.b, A.c, A.d, A.e, A.f); } }
  baseStyle(v, extra = {}) {
    const bg = this.bg(), d = this.doc;
    return { px: v.s * this.dpr, bgDark: this.isDarkBg(bg), bg, lwdisplay: d.vars.LWDISPLAY, viewBB: this.worldBB(v), vh: this.H / v.s, qtext: d.vars.QTEXTMODE, showAttdefValue: false, ...extra };
  }
  render() {
    this.syncTiles();
    const T = this.tiles;
    if (T) {
      const main = this.cv, mctx = this.ctx, r = this.dpr, keep = this.views.Model;
      mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.fillStyle = '#5a5f66'; mctx.fillRect(0, 0, main.width, main.height);
      this._tileCv ||= document.createElement('canvas');
      const tc = this._tileCv, tctx = tc.getContext('2d');
      T.tiles.forEach((k, i) => {
        this._rt = i; this.views.Model = k.v; this._last = null;
        const rc = this.tileRect(i);
        tc.width = Math.max(1, rc.w * r); tc.height = Math.max(1, rc.h * r);
        this.cv = tc; this.ctx = tctx;
        try { this.renderSingle(); } finally { this.cv = main; this.ctx = mctx; }
        mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.drawImage(tc, rc.x * r, rc.y * r);
        mctx.lineWidth = (i === T.act ? 2 : 1) * r; mctx.strokeStyle = i === T.act ? '#2b8cff' : '#8a8f96';
        mctx.strokeRect(rc.x * r + mctx.lineWidth / 2, rc.y * r + mctx.lineWidth / 2, rc.w * r - mctx.lineWidth, rc.h * r - mctx.lineWidth);
      });
      this._rt = undefined; this.views.Model = keep; this._last = null;
      return;
    }
    this.renderSingle();
  }
  renderSingle() {
    const ctx = this.ctx, d = this.doc;
    // encuadre rápido: si solo cambió la traslación y el último dibujo fue costoso, se desplaza la imagen
    // anterior y el dibujo completo se hace al parar
    const v0 = this.cur, L = this._last;
    if (L && !this.P && !this._full && this._rt === undefined && (d.blockEdit || d.active === 'Model') && L.cost > 25 && L.s === v0.s && L.rev === d.rev && L.sp === d.space && L.w === this.cv.width && L.h === this.cv.height && (L.cx !== v0.cx || L.cy !== v0.cy)) {
      const r = this.dpr, dx = (L.cx - v0.cx) * v0.s * r, dy = (v0.cy - L.cy) * v0.s * r;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = this.bg(); ctx.fillRect(0, 0, this.cv.width, this.cv.height);
      ctx.drawImage(L.img, dx, dy);
      clearTimeout(this._fullT); this._fullT = setTimeout(() => { this._full = true; this.redraw(); }, 90);
      return;
    }
    this._full = false;
    const t0 = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bg(); ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    if (d.blockEdit || d.active === 'Model') {
      const v = this.cur;
      if (this.P) { this.render3D(ctx, v); ctx.setTransform(1, 0, 0, 1, 0, 0); this._last = null; return; }
      if (!d.blockEdit) this.app.drawUnderlay?.(ctx, this, v);
      if (d.vars.GRIDMODE) this.drawGrid(ctx, v);
      this.setWorld(ctx, v);
      drawEnts(ctx, d.blockEdit ? d.space : this.near(this.worldBB(v)), d, this.baseStyle(v));
      if (d.blockEdit) this.drawBlockEditMarkers(ctx, v);
    } else this.renderLayout(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const cost = performance.now() - t0;
    if (cost > 25 && this._rt === undefined && (d.blockEdit || d.active === 'Model')) {
      const img = this._lastImg ||= document.createElement('canvas');
      if (img.width !== this.cv.width || img.height !== this.cv.height) { img.width = this.cv.width; img.height = this.cv.height; }
      img.getContext('2d').drawImage(this.cv, 0, 0);
      this._last = { cx: this.cur.cx, cy: this.cur.cy, s: this.cur.s, rev: d.rev, sp: d.space, w: this.cv.width, h: this.cv.height, img, cost };
    } else this._last = null;
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
      drawEnts(ctx, ents, d, { ...stP, px: mv.s * r, viewBB: vbb, ltk: d.vars.PSLTSCALE ? 1 / vp.scale : 1, vpOvr: vp.ovr || null });
      ctx.restore();
    }
    this.setWorld(ctx, pv);
    drawEnts(ctx, l.ents, d, stP);
    if (d.mspace) { const vp = d.mspace; ctx.lineWidth = 3 / (pv.s * r); ctx.strokeStyle = '#2b8cff'; ctx.strokeRect(vp.c.x - vp.w / 2, vp.c.y - vp.h / 2, vp.w, vp.h); }
  }
  // ---- vista 3D en la ventana principal: rejilla del plano de trabajo, sólidos y objetos de cada plano
  render3D(ctx, v) {
    const d = this.doc, P = this.P, r = this.dpr;
    if (d.vars.GRIDMODE) this.drawGrid3D(ctx, v);
    const vs = d.vars.VSCURRENT || '2dWireframe', shaded = vs === 'Shaded' || vs === 'Realistic', hidden = vs === 'Hidden';
    const ents = d.space.filter((e) => d.isVisible(e));
    // sólidos (algoritmo del pintor)
    const faces = [], light = P3.unit([0.4, -0.3, 0.86]);
    this._solidScr = new Map();
    for (const e of ents) {
      if (e.type !== '3DSOLID') continue;
      const m = this.app.meshOf?.(e); if (!m) continue;
      const pv = m.v.map((w) => { const q = this.v2s({ x: P3.dot(w, P.B.R), y: P3.dot(w, P.B.U) }, v); return [q.x, q.y, P3.dot(w, P.B.F)]; });
      const col = this.entCss(e), polys = [];
      const push = (idx, holes) => {
        if (idx.length < 3) return;
        let n = [0, 0, 0]; for (let i = 0; i < idx.length; i++) { const p = m.v[idx[i]], q = m.v[idx[(i + 1) % idx.length]]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); }
        n = P3.unit(n);
        let facing = P3.dot(n, P.B.F) < 0;
        if (e.surf && !facing) { n = P3.mul(n, -1); facing = true; } // superficies abiertas: se ven por las dos caras
        const z = idx.reduce((a, i) => a + pv[i][2], 0) / idx.length;
        const fe = { idx, holes, pv, n, z, col, facing, e, m }; faces.push(fe); polys.push(idx.map((i) => ({ x: pv[i][0], y: pv[i][1] }))); return fe;
      };
      for (const f of m.f) push(f);
      for (const cp of m.caps || []) push(cp.outer, cp.holes);
      const se = this.solidEdges(m, pv, P);
      this._solidScr.set(e, { polys, edges: se.list, keys: se.keys, vk: se.vk });
    }
    ctx.setTransform(r, 0, 0, r, 0, 0); ctx.lineJoin = 'round';
    const dark = this.isDarkBg(this.bg());
    const edgeCol = (e) => (shaded ? (vs === 'Realistic' ? 'rgba(0,0,0,.55)' : shadeCss(this.entCss(e), 0.45)) : hidden ? (dark ? '#ddd' : '#222') : this.entCss(e));
    if (shaded || hidden) {
      // pintor: de atrás adelante; cada cara se rellena y a continuación se trazan sus aristas vivas,
      // así las caras más cercanas tapan las aristas ocultas
      faces.sort((x, y) => y.z - x.z);
      for (const f of faces) {
        if (!f.facing) continue;
        ctx.beginPath(); f.idx.forEach((i, k) => (k ? ctx.lineTo(f.pv[i][0], f.pv[i][1]) : ctx.moveTo(f.pv[i][0], f.pv[i][1]))); ctx.closePath();
        for (const hl of f.holes || []) { hl.forEach((i, k) => (k ? ctx.lineTo(f.pv[i][0], f.pv[i][1]) : ctx.moveTo(f.pv[i][0], f.pv[i][1]))); ctx.closePath(); }
        if (hidden) ctx.fillStyle = this.bg(); else { const k = 0.38 + 0.62 * Math.abs(P3.dot(f.n, light)) * (P3.dot(f.n, light) < 0 ? 0.55 : 1); ctx.fillStyle = shadeCss(f.col, k); }
        ctx.fill('evenodd'); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.6; ctx.stroke();
        const sc = this._solidScr.get(f.e); if (!sc) continue;
        ctx.beginPath(); let any = false;
        for (const ring of [f.idx, ...(f.holes || [])]) for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length], ka = sc.vk[a], kb = sc.vk[b];
          if (!sc.keys.has(ka < kb ? ka + '|' + kb : kb + '|' + ka)) continue;
          ctx.moveTo(f.pv[a][0], f.pv[a][1]); ctx.lineTo(f.pv[b][0], f.pv[b][1]); any = true;
        }
        if (any) { ctx.strokeStyle = edgeCol(f.e); ctx.lineWidth = 1; ctx.stroke(); }
      }
    } else {
      // estructura alámbrica: aristas vivas y contorno aparente
      ctx.lineWidth = 1;
      for (const [e, s] of this._solidScr) { ctx.strokeStyle = edgeCol(e); ctx.beginPath(); for (const [a, b] of s.edges) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke(); }
    }
    // objetos 2D agrupados por plano
    const groups = new Map();
    for (const e of ents) { if (e.type === '3DSOLID') continue; const k = P3.key(e.wp); let g = groups.get(k); if (!g) groups.set(k, (g = { pl: e.wp || P3.WORLD, ents: [] })); g.ents.push(e); }
    for (const { pl, ents: list } of groups.values()) {
      const A = this.affOf(pl), dt = Math.abs(P3.det(A));
      this.setWorld(ctx, v, pl);
      drawEnts(ctx, list, d, this.baseStyle(v, { viewBB: null, px: v.s * r * Math.sqrt(Math.max(dt, 1e-4)) }));
    }
  }
  entCss(e) { const d = this.doc, L = d.layers[e.layer] || d.layers['0']; let c = e.color ?? 256; if (c === 256 || c === 0) c = L?.color ?? 7; return e.tc || (typeof c === 'string' ? c : aciCss(c, this.isDarkBg(this.bg()))); }
  // aristas de la malla que se dibujan: vivas (> 20°) y contorno aparente para esta vista
  solidEdges(m, pv, P) {
    const vk = m.v.map((p) => p.map((x) => x.toFixed(6)).join(',')), key = (i) => vk[i], E2 = new Map();
    const nrm = (f) => { let n = [0, 0, 0]; for (let i = 0; i < f.length; i++) { const p = m.v[f[i]], q = m.v[f[(i + 1) % f.length]]; n[0] += (p[1] - q[1]) * (p[2] + q[2]); n[1] += (p[2] - q[2]) * (p[0] + q[0]); n[2] += (p[0] - q[0]) * (p[1] + q[1]); } return P3.unit(n); };
    const all = [...m.f, ...(m.caps || []).flatMap((c) => [c.outer, ...(c.holes || [])])];
    for (const f of all) { const n = nrm(f); for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], ka = key(a), kb = key(b), k = ka < kb ? ka + '|' + kb : kb + '|' + ka; const o = E2.get(k); if (o) o.n.push(n); else E2.set(k, { a, b, n: [n] }); } }
    const out = [], keys = new Set(), cmax = Math.cos(20 * Math.PI / 180);
    for (const [k, { a, b, n }] of E2) {
      const sil = n.length > 1 && (P3.dot(n[0], P.B.F) < 0) !== (P3.dot(n[1], P.B.F) < 0);
      if (n.length < 2 || Math.abs(P3.dot(n[0], n[1])) < cmax || sil) { out.push([pv[a], pv[b]]); keys.add(k); }
    }
    return { list: out, keys, vk };
  }
  // arista visible si su punto medio no queda tapado por una cara más cercana de otro sólido (aproximado)
  edgeVisible(faces, e, a, b) {
    if (!this._occ || this._occ.faces !== faces) this._occ = { faces, list: faces.filter((f) => f.facing) };
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, mz = (a[2] + b[2]) / 2;
    for (const f of this._occ.list) {
      if (f.z >= mz - 1e-6) continue;
      const pts = f.idx.map((i) => ({ x: f.pv[i][0], y: f.pv[i][1] }));
      if (!G.ptInPoly({ x: mx, y: my }, pts)) continue;
      // profundidad de la cara en ese punto (plano por sus tres primeros vértices)
      const [p0, p1, p2] = f.idx.slice(0, 3).map((i) => f.pv[i]);
      const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], wx = p2[0] - p0[0], wy = p2[1] - p0[1], wz = p2[2] - p0[2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      if (Math.abs(nz) < 1e-12) continue;
      const zf = p0[2] - (nx * (mx - p0[0]) + ny * (my - p0[1])) / nz;
      if (zf < mz - Math.max(1e-6, Math.abs(mz) * 1e-6)) return false;
    }
    return true;
  }
  // rejilla sobre el plano de trabajo actual
  drawGrid3D(ctx, v) {
    const d = this.doc, P = this.P, r = this.dpr;
    if (!P.inv || Math.abs(P.det) < 0.02) return;
    let u = d.vars.GRIDUNIT || 10;
    const k = v.s * Math.sqrt(Math.abs(P.det));
    while (u * k < 10) u *= 5;
    while (u * k > 200) u /= 5;
    const bb = this.worldBB(v);
    const x0 = Math.floor(bb.x1 / u), x1 = Math.ceil(bb.x2 / u), y0 = Math.floor(bb.y1 / u), y1 = Math.ceil(bb.y2 / u);
    if ((x1 - x0) > 600 || (y1 - y0) > 600) return;
    const dark = this.isDarkBg(this.bg());
    const minor = dark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.07)', major = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.15)';
    ctx.setTransform(r, 0, 0, r, 0, 0); ctx.lineWidth = 1 / r;
    const line = (a, b) => { const A = this.toScreen(a), B = this.toScreen(b); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); };
    for (const majorPass of [false, true]) {
      ctx.strokeStyle = majorPass ? major : minor; ctx.beginPath();
      for (let i = x0; i <= x1; i++) if ((i % 5 === 0) === majorPass) line({ x: i * u, y: y0 * u }, { x: i * u, y: y1 * u });
      for (let j = y0; j <= y1; j++) if ((j % 5 === 0) === majorPass) line({ x: x0 * u, y: j * u }, { x: x1 * u, y: j * u });
      ctx.stroke();
    }
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = dark ? 'rgba(230,90,90,.55)' : 'rgba(200,0,0,.45)'; ctx.beginPath(); line({ x: x0 * u, y: 0 }, { x: x1 * u, y: 0 }); ctx.stroke();
    ctx.strokeStyle = dark ? 'rgba(90,210,90,.55)' : 'rgba(0,150,0,.45)'; ctx.beginPath(); line({ x: 0, y: y0 * u }, { x: 0, y: y1 * u }); ctx.stroke();
  }
  // selección por ventana con proyección: cajas en pantalla
  screenBB(e) {
    const d = this.doc, bb = G.bbNew();
    if (e.type === '3DSOLID') { const s = this._solidScr?.get(e); if (s) for (const pl of s.polys) for (const q of pl) G.bbAdd(bb, q); return G.bbValid(bb) ? bb : null; }
    const b = E.entBBox(e, d); if (!G.bbValid(b)) return null;
    const A = this.affOf(e.wp || P3.WORLD);
    for (const q of [{ x: b.x1, y: b.y1 }, { x: b.x2, y: b.y1 }, { x: b.x2, y: b.y2 }, { x: b.x1, y: b.y2 }]) G.bbAdd(bb, this.v2s(this.l2v(q, A)));
    return bb;
  }
  windowSelectProj(p1, p2, crossing) {
    const a = this.toScreen(p1), b = this.toScreen(p2), w = { x1: Math.min(a.x, b.x), y1: Math.min(a.y, b.y), x2: Math.max(a.x, b.x), y2: Math.max(a.y, b.y) };
    const d = this.doc, out = [];
    for (const e of d.space) { if (!d.isVisible(e)) continue; const bb = this.screenBB(e); if (!bb) continue; if (G.bbInside(bb, w) || (crossing && G.bbOverlap(bb, w))) out.push(e); }
    return out;
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
    if (d.vars.SNAPSTYL === 1) { // rejilla isométrica: verticales y líneas a 30° y 150°
      const t30 = Math.tan(Math.PI / 6), dx = u * Math.cos(Math.PI / 6);
      ctx.strokeStyle = minor; ctx.beginPath();
      const i0 = Math.floor(bb.x1 / dx), i1 = Math.ceil(bb.x2 / dx);
      if (i1 - i0 > 1500) return;
      for (let i = i0; i <= i1; i++) { const sx = Math.round(this.toScreen({ x: i * dx, y: 0 }, v).x * r) + 0.5; ctx.moveTo(sx, 0); ctx.lineTo(sx, this.cv.height); }
      const span = bb.x2 - bb.x1, k0 = Math.floor((bb.y1 - Math.abs(span) * t30 - Math.abs(bb.x1) * t30) / u) - 2, k1 = Math.ceil((bb.y2 + Math.abs(span) * t30 + Math.abs(bb.x2) * t30) / u) + 2;
      if (k1 - k0 > 3000) return;
      for (let k = k0; k <= k1; k++) for (const sgn of [1, -1]) { const a = this.toScreen({ x: bb.x1, y: k * u + sgn * t30 * bb.x1 }, v), b = this.toScreen({ x: bb.x2, y: k * u + sgn * t30 * bb.x2 }, v); ctx.moveTo(a.x * r, a.y * r); ctx.lineTo(b.x * r, b.y * r); }
      ctx.stroke();
      return;
    }
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
    const P = this.P;
    const hl = (e, o) => {
      if (!P) return drawEnt(c, e, d, o);
      if (e.type === '3DSOLID') { const s = this._solidScr?.get(e); if (!s) return; c.save(); c.setTransform(r, 0, 0, r, 0, 0); c.strokeStyle = o.override || (dark ? '#9fe' : '#06a'); c.lineWidth = 1 + (o.extraW || 0); if (!o.noDash) c.setLineDash([6, 3]); c.beginPath(); for (const [a, b] of s.edges) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); } c.stroke(); c.restore(); return; }
      this.setWorld(c, v, e.wp || P3.WORLD); drawEnt(c, e, d, { ...o, px: v.s * r * Math.sqrt(Math.max(Math.abs(P3.det(this.affOf(e.wp || P3.WORLD))), 1e-4)) }); this.setWorld(c, v);
    };
    for (const e of selSet) { if (n++ > 3000) break; hl(e, { ...st, override: dark ? '#4fd1c5' : '#0b6f6a', extraW: 1.5, noDash: false }); }
    if (eng.hover && !selSet.has(eng.hover)) { c.globalAlpha = 0.85; hl(eng.hover, { ...st, extraW: 2, noDash: true }); c.globalAlpha = 1; }
    if (eng.hover?.url && !eng.req) { c.save(); c.setTransform(r, 0, 0, r, 0, 0); c.font = '12px Segoe UI, Arial, sans-serif'; const tx = '🔗 ' + (eng.hover.urlDesc || eng.hover.url) + '  (Ctrl+clic)', tw = c.measureText(tx).width; c.fillStyle = dark ? '#2b3340' : '#ffffe1'; c.fillRect(this.mouse.x + 14, this.mouse.y + 12, tw + 8, 18); c.fillStyle = dark ? '#e6e6e6' : '#111'; c.fillText(tx, this.mouse.x + 18, this.mouse.y + 25); c.restore(); }
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
    if (win && win.lasso && win.path.length > 1) {
      const crossing = win.crossing;
      c.fillStyle = crossing ? 'rgba(60,180,80,.18)' : 'rgba(60,110,230,.18)';
      c.strokeStyle = crossing ? '#3c3' : '#4a8cff'; c.lineWidth = 1 / (v.s * r);
      if (crossing) c.setLineDash([5 / v.s, 3 / v.s]);
      c.beginPath(); win.path.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath(); c.fill(); c.stroke(); c.setLineDash([]);
    } else if (win && P) {
      const a = this.toScreen(win.p1), b = this.toScreen(this.cursor), crossing = b.x < a.x;
      c.save(); c.setTransform(r, 0, 0, r, 0, 0);
      c.fillStyle = crossing ? 'rgba(60,180,80,.18)' : 'rgba(60,110,230,.18)'; c.strokeStyle = crossing ? '#3c3' : '#4a8cff'; c.lineWidth = 1;
      if (crossing) c.setLineDash([5, 3]);
      c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); c.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); c.restore();
    } else if (win) {
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
      const wk = P ? P3.key(this.wp) : null;
      for (const g of eng.grips) {
        if (P && (g.ent?.type === '3DSOLID' || P3.key(g.ent?.wp) !== wk)) continue;
        const s = this.toScreen(g.p); const x = s.x * r, y = s.y * r, h = gs * r / 2 + 0.5;
        const hot = (eng.gripDrag && eng.gripDrag.grip === g) || eng.hotGrips?.includes(g), near = eng.hoverGrip === g;
        c.fillStyle = hot ? '#ff5a3c' : near ? '#ffb347' : g.kind?.startsWith('d') ? '#7fdcd0' : g.kind === 'mid' ? '#3fbfb2' : '#14a196';
        c.strokeStyle = dark ? '#0b1b1d' : '#ffffff'; c.lineWidth = 1;
        c.beginPath();
        if (g.kind === 'dlin') { c.moveTo(x - h * 1.4, y - h); c.lineTo(x + h * 1.4, y); c.lineTo(x - h * 1.4, y + h); c.closePath(); }
        else if (g.kind === 'drot') c.arc(x, y, h * 1.2, 0, G.TAU);
        else if (g.kind === 'dflip') { c.moveTo(x - h * 1.4, y); c.lineTo(x, y - h * 1.3); c.lineTo(x + h * 1.4, y); c.lineTo(x, y + h * 1.3); c.closePath(); }
        else if (g.kind === 'dvis' || g.kind === 'dlook') { c.moveTo(x - h * 1.3, y - h); c.lineTo(x + h * 1.3, y - h); c.lineTo(x, y + h); c.closePath(); }
        else if (g.kind === 'mid') c.rect(x - h, y - h * 0.6, 2 * h, h * 1.2);
        else c.rect(x - h, y - h, 2 * h, 2 * h);
        c.fill(); c.stroke();
      }
    }
    // marcador osnap
    if (this.snapInfo && this.mouse.in) this.drawSnapMarker(c, this.snapInfo);
    // puntos adquiridos y líneas de rastreo
    if (this.otPts?.length && this.mouse.in && (this.eng?.req?.wantsPoint || this.eng?.gripDrag)) {
      c.strokeStyle = '#3dd6c4'; c.lineWidth = r;
      for (const q of this.otPts) { const s = this.toScreen(q); c.beginPath(); c.moveTo((s.x - 4) * r, s.y * r); c.lineTo((s.x + 4) * r, s.y * r); c.moveTo(s.x * r, (s.y - 4) * r); c.lineTo(s.x * r, (s.y + 4) * r); c.stroke(); }
    }
    if (this.otrack && this.mouse.in) {
      c.strokeStyle = '#3dd6c4'; c.setLineDash([2 * r, 4 * r]); c.lineWidth = r;
      for (const L of this.otrack.lines) { const a = this.toScreen(L.a), b = this.toScreen(G.add(L.a, G.mul(L.dir, 1e7 / this.scale))); c.beginPath(); c.moveTo(a.x * r, a.y * r); c.lineTo(b.x * r, b.y * r); c.stroke(); }
      c.setLineDash([]);
      const s = this.toScreen(this.otrack.p); c.beginPath(); c.moveTo((s.x - 5) * r, (s.y - 5) * r); c.lineTo((s.x + 5) * r, (s.y + 5) * r); c.moveTo((s.x + 5) * r, (s.y - 5) * r); c.lineTo((s.x - 5) * r, (s.y + 5) * r); c.stroke();
      const L = this.otrack.lines[0], lab = this.otrack.lines.length > 1 ? tKnown('Intersección') : `${tKnown('Rastreo')}: ${G.fmt(G.dist(L.a, this.otrack.p), 4)} < ${L.ang}°`;
      c.font = `500 ${12 * r}px Barlow, system-ui, sans-serif`; const tw = c.measureText(lab).width;
      c.fillStyle = dark ? 'rgba(22,28,31,.94)' : 'rgba(255,255,255,.97)'; c.fillRect((s.x + 12) * r, (s.y - 30) * r, tw + 8 * r, 17 * r);
      c.fillStyle = dark ? '#e2eaea' : '#172225'; c.fillText(lab, (s.x + 16) * r, (s.y - 17) * r);
    }
    if (this.trackInfo && this.mouse.in) {
      const a = this.toScreen(this.trackInfo.base), b = this.toScreen(this.snapped);
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
      c.strokeStyle = '#4caf50'; c.setLineDash([3 * r, 3 * r]); c.lineWidth = r; c.beginPath(); c.moveTo(a.x * r, a.y * r); c.lineTo((a.x + dx / L * 4000) * r, (a.y + dy / L * 4000) * r); c.stroke(); c.setLineDash([]);
    }
    this.app.drawConstraints?.(c, this, dark);
    this.app.drawCompare?.(c, this, dark);
    if (eng.hover && !eng.req && !eng.gripDrag && !eng.hover.url && performance.now() - (eng.hoverT || 0) > 600) this.app.drawRollover?.(c, this, eng.hover, dark);
    this.app.drawMarkups?.(c, this, dark);
    if ((this.P || this.app.settings.ws3d) && d.active === 'Model' && !d.blockEdit) { this.drawTriad(c, dark); this.drawViewCube(c, dark); } else this._cube = null;
    // cursor
    if (this.mouse.in) this.drawCursor(c, dark);
    this.app.ui?.dyn?.update?.();
  }
  drawSnapMarker(c, s) {
    const r = this.dpr, p = this.toScreen(s.p), x = p.x * r, y = p.y * r, k = 6 * r, dark = this.isDarkBg(this.bg());
    c.strokeStyle = dark ? '#3dff8f' : '#0a8a3a'; c.lineWidth = 2 * r; c.beginPath();
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
    c.font = `500 ${12 * r}px Barlow, system-ui, sans-serif`;
    const t = tKnown(OSLABEL[s.t] || s.t), tw = c.measureText(t).width;
    c.fillStyle = dark ? 'rgba(22,28,31,.94)' : 'rgba(255,255,255,.97)'; c.fillRect(x + 12 * r, y + 10 * r, tw + 8 * r, 17 * r); c.fillStyle = '#14a196'; c.fillRect(x + 12 * r, y + 10 * r, 2 * r, 17 * r);
    c.fillStyle = dark ? '#e2eaea' : '#172225'; c.fillText(t, x + 16 * r, y + 23 * r);
  }
  drawCursor(c, dark) {
    const r = this.dpr, eng = this.eng, req = eng.req;
    const p = (req?.wantsPoint || eng.gripDrag) ? this.toScreen(this.snapped) : { x: this.mouse.x, y: this.mouse.y };
    const x = Math.round(p.x * r) + 0.5, y = Math.round(p.y * r) + 0.5;
    const size = this.app.settings.crosshair >= 100 ? 1e5 : (this.app.settings.crosshair / 100) * Math.max(this.W, this.H) / 2 * r;
    c.strokeStyle = dark ? '#e8e8e8' : '#111'; c.lineWidth = 1; c.beginPath();
    const showCross = !req || req.wantsPoint || eng.gripDrag;
    const pb = (this.doc.vars.PICKBOX || 4) * r;
    const P = this.P;
    if (showCross && P && P.inv && Math.abs(P.det) > 0.02) {
      // cursor en cruz alineado con los ejes X e Y del plano de trabajo
      for (const ax of [{ x: P.A.a, y: -P.A.b }, { x: P.A.c, y: -P.A.d }]) { const L = Math.hypot(ax.x, ax.y) || 1, ux = ax.x / L * Math.min(size, 4e4), uy = ax.y / L * Math.min(size, 4e4); c.moveTo(x - ux, y - uy); c.lineTo(x + ux, y + uy); }
    } else if (showCross) { c.moveTo(x - size, y); c.lineTo(x + size, y); c.moveTo(x, y - size); c.lineTo(x, y + size); }
    if (!req || req.kind === 'select' || req.kind === 'entity') c.rect(x - pb, y - pb, 2 * pb, 2 * pb);
    if (req?.wantsPoint) { const ap = 0; void ap; }
    c.stroke();
    if (P || this.app.settings.ws3d) return;
    // icono SCU
    if (this.app.settings.ucsIcon) {
      const u = this.doc.ext?.ucs, ang = u?.a || 0, L = 30 * r;
      let o = { x: 40 * r, y: (this.H - 40) * r };
      if (u && this.app.settings.ucsIconOrigin !== false) { const q = this.toScreen(u.o); if (q.x > 30 && q.x < this.W - 50 && q.y > 50 && q.y < this.H - 30) o = { x: q.x * r, y: q.y * r }; }
      const ax = { x: Math.cos(ang), y: -Math.sin(ang) }, ay = { x: -Math.sin(ang), y: -Math.cos(ang) };
      c.strokeStyle = dark ? '#d33' : '#c00'; c.lineWidth = 2 * r; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + ax.x * L, o.y + ax.y * L); c.stroke();
      c.strokeStyle = dark ? '#3c3' : '#090'; c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(o.x + ay.x * L, o.y + ay.y * L); c.stroke();
      c.fillStyle = dark ? '#ccc' : '#333'; c.font = `${10 * r}px system-ui`; c.fillText('X', o.x + ax.x * (L + 7 * r) - 3 * r, o.y + ax.y * (L + 7 * r) + 4 * r); c.fillText('Y', o.x + ay.x * (L + 7 * r) - 3 * r, o.y + ay.y * (L + 7 * r) + 4 * r);
      if (!u) { c.strokeStyle = dark ? '#ccc' : '#333'; c.lineWidth = r; c.strokeRect(o.x - 4 * r, o.y - 4 * r, 8 * r, 8 * r); }
    }
  }

  // tríada de ejes del plano de trabajo (X rojo, Y verde, Z azul): en su origen si se ve, si no abajo a la izquierda
  drawTriad(c, dark) {
    const r = this.dpr, B = this.P?.B || P3.basis(this.cam), pl = this.wp || P3.WORLD, n = P3.normal(pl), L = 46 * r;
    let o = { x: 56 * r, y: Math.max(140, this.H - 175) * r };
    const q = this.w3ToScreen(pl.o); if (q.x > 50 && q.x < this.W - 130 && q.y > 130 && q.y < this.H - 150) o = { x: q.x * r, y: q.y * r };
    const axes = [[pl.u, 'X', dark ? '#ff5a5a' : '#d01818'], [pl.v, 'Y', dark ? '#5ee05e' : '#108a10'], [n, 'Z', dark ? '#5aa8ff' : '#1450d0']]
      .map(([a, t, col]) => ({ dx: P3.dot(a, B.R), dy: -P3.dot(a, B.U), depth: P3.dot(a, B.F), t, col }))
      .sort((a, b) => b.depth - a.depth);
    c.save(); c.lineCap = 'round'; c.font = `600 ${11 * r}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const a of axes) {
      const ex = o.x + a.dx * L, ey = o.y + a.dy * L, short = Math.hypot(a.dx, a.dy) < 0.15;
      c.strokeStyle = a.col; c.fillStyle = a.col; c.lineWidth = 2.5 * r;
      c.beginPath(); c.moveTo(o.x, o.y); c.lineTo(ex, ey); c.stroke();
      if (short) { c.beginPath(); c.arc(o.x, o.y, 4 * r, 0, G.TAU); c.stroke(); }
      const ang = Math.atan2(ey - o.y, ex - o.x), h = 6 * r;
      if (!short) { c.beginPath(); c.moveTo(ex + Math.cos(ang) * h, ey + Math.sin(ang) * h); c.lineTo(ex + Math.cos(ang + 2.5) * h, ey + Math.sin(ang + 2.5) * h); c.lineTo(ex + Math.cos(ang - 2.5) * h, ey + Math.sin(ang - 2.5) * h); c.closePath(); c.fill(); }
      c.fillText(a.t, o.x + a.dx * (L + 15 * r) + (short ? 9 * r : 0), o.y + a.dy * (L + 15 * r));
    }
    if (P3.isWorld(this.wp)) { c.strokeStyle = dark ? '#ddd' : '#333'; c.lineWidth = r; c.strokeRect(o.x - 4 * r, o.y - 4 * r, 8 * r, 8 * r); }
    c.restore();
  }
  // cubo de vistas (arriba a la derecha): pulsar una cara orienta la vista; pulsar fuera de las caras, isométrica SO
  get cubeC() { return { x: this.W - 78, y: 82, s: 31 }; }
  drawViewCube(c, dark) {
    const r = this.dpr, B = this.P?.B || P3.basis(this.cam), { x: cx, y: cy, s } = this.cubeC;
    const P3s = (p) => [(cx + P3.dot(p, B.R) * s) * r, (cy - P3.dot(p, B.U) * s) * r, P3.dot(p, B.F)];
    const FACES = [['Top', [0, 0, 1], 'SUPERIOR'], ['Bottom', [0, 0, -1], 'INFERIOR'], ['Front', [0, -1, 0], 'FRONTAL'], ['Back', [0, 1, 0], 'POSTERIOR'], ['Right', [1, 0, 0], 'DERECHA'], ['Left', [-1, 0, 0], 'IZQUIERDA']];
    this._cube = [];
    const fs = FACES.map(([k, n, lab]) => {
      const u = n[0] ? [0, 1, 0] : [1, 0, 0], w = P3.cross(n, u);
      const corner = (a, b) => P3.add(n, P3.add(P3.mul(u, a), P3.mul(w, b)));
      const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map(P3s);
      return { k, lab, pts, dot: P3.dot(n, B.F), z: pts.reduce((a, p) => a + p[2], 0) / 4 };
    }).filter((f) => f.dot < -1e-6).sort((a, b) => b.z - a.z);
    c.save(); c.font = `600 ${7.5 * r}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    // brújula
    c.strokeStyle = dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; c.lineWidth = r; c.beginPath();
    for (let i = 0; i <= 48; i++) { const a = i / 48 * G.TAU, q = P3s([Math.cos(a) * 1.9, Math.sin(a) * 1.9, -1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
    const nq = P3s([0, 2.25, -1]); c.fillStyle = dark ? '#ccc' : '#444'; c.fillText('N', nq[0], nq[1]);
    for (const f of fs) {
      c.beginPath(); f.pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.fillStyle = dark ? `rgba(70,80,96,${0.8 + 0.2 * -f.dot})` : `rgba(236,240,245,${0.85 + 0.15 * -f.dot})`; c.fill(); c.strokeStyle = dark ? '#9aa6b5' : '#7f8b99'; c.stroke();
      const m = f.pts.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
      if (-f.dot > 0.3) { const tx = tKnown(f.lab[0] + f.lab.slice(1).toLowerCase()).toUpperCase(), fw = Math.min(Math.hypot(f.pts[1][0] - f.pts[0][0], f.pts[1][1] - f.pts[0][1]), Math.hypot(f.pts[2][0] - f.pts[1][0], f.pts[2][1] - f.pts[1][1])); let fz = 7.5; c.font = `600 ${fz * r}px system-ui, sans-serif`; while (c.measureText(tx).width > fw * 0.9 && fz > 4) { fz -= 0.5; c.font = `600 ${fz * r}px system-ui, sans-serif`; } c.fillStyle = dark ? '#e4e8ee' : '#334'; c.fillText(tx, m[0], m[1]); }
      this._cube.push({ k: f.k, pts: f.pts.map((p) => ({ x: p[0] / r, y: p[1] / r })) });
    }
    c.restore();
  }
  cubeHit(x, y) {
    if (!(this.P || this.app.settings.ws3d) || !this._cube) return null;
    const { x: cx, y: cy } = this.cubeC;
    if (Math.hypot(x - cx, y - cy) > 72) return null;
    for (const f of this._cube.slice().reverse()) if (G.ptInPoly({ x, y }, f.pts)) return f.k;
    return 'SWiso';
  }
  // órbita: arrastre horizontal = acimut, vertical = elevación
  orbitBy(dx, dy) {
    const c0 = this._orb.cam;
    this.setCam({ az: c0.az - dx * 0.008, el: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, c0.el + dy * 0.008)) });
    this._orb.cam = this.cam; this._orb.x += dx; this._orb.y += dy;
  }

  // ---- eventos
  bindEvents() {
    const el = this.ov;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    // pulsar en otra ventana en mosaico la activa
    this.cv.addEventListener('pointerdown', (e) => {
      const t = this.tiles; if (!t) return;
      const hr = this.host.getBoundingClientRect(), x = e.clientX - hr.left, y = e.clientY - hr.top;
      const i = t.tiles.findIndex((_, k) => { const rc = this.tileRect(k); return x >= rc.x && x < rc.x + rc.w && y >= rc.y && y < rc.y + rc.h; });
      if (i >= 0) this.setActiveTile(i);
    });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const nx = e.clientX - r.left, ny = e.clientY - r.top;
      if (this._orb?.pending) { if (Math.hypot(nx - this._orb.x, ny - this._orb.y) > 4) { this._orb.pending = false; el.style.cursor = 'grabbing'; } else return; }
      if (this._orb) { this.orbitBy(nx - this.mouse.x, ny - this.mouse.y); this.mouse = { x: nx, y: ny, in: true }; return; }
      if (this.panning) { this.panPx(nx - this.mouse.x, ny - this.mouse.y); }
      this.mouse = { x: nx, y: ny, in: true };
      this.updateCursor();
      this.eng?.pointerMove(this.ptInfo(e));
      this.redrawOverlay();
      this.app.ui?.status?.coords?.(this.P ? this.toW3(this.snapped) : this.snapped);
    });
    el.addEventListener('pointerleave', () => { this.mouse.in = false; this.redrawOverlay(); });
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture?.(e.pointerId); this.lastShift = e.shiftKey;
      const r = el.getBoundingClientRect(); this.mouse = { x: e.clientX - r.left, y: e.clientY - r.top, in: true };
      this.updateCursor();
      const ck = e.button === 0 ? this.cubeHit(this.mouse.x, this.mouse.y) : null;
      if (ck) { e.preventDefault(); this.setCam(ck === 'Top' && P3.isWorld(this.wp) && !this.app.settings.ws3d ? null : P3.presetCam(ck)); this.zoomExtents(); return; }
      // en 3D, botón derecho mantenido y arrastrado = órbita (pulsación corta = clic derecho normal)
      if (e.button === 2 && (this.P || this.app.settings.ws3d) && this.doc.active === 'Model' && !this.doc.blockEdit) {
        e.preventDefault(); this._orb = { x: this.mouse.x, y: this.mouse.y, cam: this.cam || { az: -Math.PI / 2, el: Math.PI / 2 }, pending: true, ev: e }; return;
      }
      if ((e.button === 1 && e.shiftKey) || (e.button === 0 && this.eng?.req?.kind === 'orbit')) {
        e.preventDefault(); this._orb = { x: this.mouse.x, y: this.mouse.y, cam: this.cam || { az: -Math.PI / 2, el: Math.PI / 2 } }; el.style.cursor = 'grabbing'; return;
      }
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
      if (this._orb) { const o = this._orb; this._orb = null; el.style.cursor = ''; if (o.pending && o.ev) { this.eng?.pointerDown(this.ptInfo(o.ev)); this.eng?.pointerUp(this.ptInfo(e)); } return; }
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
  // todos los objetos bajo el cursor (ciclo de selección)
  // con proyección: el punto se lleva al plano de cada objeto; los sólidos se prueban en pantalla
  pickProj(p, all) {
    const d = this.doc, s = this.toScreen(p), out = [], tolPx = d.vars.PICKBOX || 4;
    for (let i = d.space.length - 1; i >= 0; i--) {
      const e = d.space[i]; if (!d.isVisible(e)) continue;
      let dd;
      if (e.type === '3DSOLID') { const sc = this._solidScr?.get(e); if (!sc) continue; dd = sc.polys.some((pl) => G.ptInPoly(s, pl)) ? tolPx : Infinity; }
      else {
        const A = this.affOf(e.wp || P3.WORLD), dt = Math.abs(P3.det(A)); if (dt < 1e-6) continue;
        const q = this.v2l(this.s2v(s.x, s.y), A); if (!q) continue;
        const tol = tolPx / (this.scale * Math.sqrt(dt));
        const bb = { x1: q.x - tol, y1: q.y - tol, x2: q.x + tol, y2: q.y + tol };
        if (e.type !== 'XLINE' && e.type !== 'RAY') { const b = E.entBBox(e, d); if (G.bbValid(b) && !G.bbOverlap(b, bb)) continue; }
        const de = E.entDist(e, q, d); if (de > tol) continue; dd = de / tol * tolPx * 0.999;
      }
      if (dd <= tolPx) { out.push([e, dd]); if (!all && dd === 0 && e.type !== 'HATCH') break; }
    }
    if (all) return out.map((x) => x[0]);
    out.sort((a, b) => a[1] - b[1]);
    return out[0]?.[0] || null;
  }
  pickAll(p) {
    if (this.P) return this.pickProj(p, true);
    const tol = this.pickTol(), d = this.doc, out = [];
    const bb = { x1: p.x - tol, y1: p.y - tol, x2: p.x + tol, y2: p.y + tol };
    for (const e of this.near(bb)) {
      if (!d.isVisible(e)) continue;
      if (e.type !== 'XLINE' && e.type !== 'RAY') { const b = E.entBBox(e, d); if (G.bbValid(b) && !G.bbOverlap(b, bb)) continue; }
      if (E.entDist(e, p, d) <= tol) out.push(e);
    }
    return out.reverse();
  }
  pickAt(p, ents = null) {
    if (this.P && !ents) return this.pickProj(p, false);
    const tol = this.pickTol(), d = this.doc;
    let best = null, bd = Infinity;
    const bb = { x1: p.x - tol, y1: p.y - tol, x2: p.x + tol, y2: p.y + tol };
    if (!ents) ents = this.near(bb);
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
const shadeCss = (css, k) => { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(css) || /rgb\((\d+),\s*(\d+),\s*(\d+)/.exec(css); let [rr, gg, bb] = m ? (String(css).startsWith('rgb') ? [+m[1], +m[2], +m[3]] : [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]) : [200, 200, 200]; if (rr + gg + bb > 700 || rr + gg + bb < 60) rr = gg = bb = 205; return `rgb(${Math.round(rr * k)},${Math.round(gg * k)},${Math.round(bb * k)})`; };
export { PAPER };
