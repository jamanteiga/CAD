// Dibujo de entidades sobre canvas 2D (coordenadas mundo ya transformadas)
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { aciCss, HATCHES } from '../core/tables.js';
import { tableEnts } from '../core/table.js';
import { ductEnts } from '../core/duct.js';
import { strokeText } from '../core/fonts.js';
const { M } = G;

export function resolveStyle(e, doc, st) {
  let layName = e.layer || '0';
  if (layName === '0' && st.blockLayer) layName = st.blockLayer;
  const L = doc.layers[layName] || doc.layers['0'];
  let c = e.color ?? 256, css;
  if (e.tc) css = e.tc;
  else {
    if (c === 256) c = L.color; else if (c === 0) { c = st.byBlockColor ?? 7; if (st.byBlockCss) css = st.byBlockCss; }
    css = css || (typeof c === 'string' ? c : aciCss(c, st.bgDark));
    if (!st.bgDark && (c === 7 || c === 255) && !e.tc) css = '#000';
  }
  let lt = (e.ltype || 'BYLAYER').toUpperCase();
  if (lt === 'BYLAYER') lt = (L.ltype || 'CONTINUOUS').toUpperCase();
  else if (lt === 'BYBLOCK') lt = st.byBlockLtype || 'CONTINUOUS';
  let lw = e.lw ?? -1;
  if (lw === -1) lw = L.lw; if (lw === -2) lw = st.byBlockLw ?? -3; if (lw == null || lw < 0) lw = 25;
  if (st.pstyle) { const r = st.pstyle(c, css, lw, L, e); css = r.css; lw = r.lw; }
  return { L, css, lt, lw, c };
}
export function layerVisible(e, doc, st) {
  let layName = e.layer || '0';
  if (layName === '0' && st.blockLayer) layName = st.blockLayer;
  const L = doc.layers[layName] || doc.layers['0'];
  return L.on && !L.frozen && e.visible !== false && (!st.plotting || L.plot !== false);
}

function setStroke(ctx, s, e, doc, st) {
  if (st.override) { ctx.strokeStyle = st.override; ctx.fillStyle = st.override; } else { ctx.strokeStyle = s.css; ctx.fillStyle = s.css; }
  let w = 1;
  if (st.lwdisplay || st.plotting) w = Math.max(1, s.lw / 100 * (st.plotting ? st.plotDpmm : 96 / 25.4));
  ctx.lineWidth = (w + (st.extraW || 0)) / st.px;
  const lt = doc.ltypes[s.lt] || null;
  if (lt && lt.pat && lt.pat.length && !st.noDash) {
    const k = (doc.vars.LTSCALE || 1) * (e.lts || 1) * (st.ltk || 1);
    const tot = lt.pat.reduce((a, b) => a + Math.abs(b), 0) * k;
    if (tot * st.px > 4) { ctx.setLineDash(lt.pat.map((v) => Math.max(Math.abs(v) * k, v === 0 ? 1 / st.px : 0))); return; }
  }
  ctx.setLineDash([]);
}

export function drawEnts(ctx, ents, doc, st) {
  for (const e of ents) {
    if (!layerVisible(e, doc, st)) continue;
    if (st.viewBB && e.type !== 'XLINE' && e.type !== 'RAY') { const bb = E.entBBox(e, doc); if (G.bbValid(bb) && !G.bbOverlap(bb, st.viewBB)) continue; }
    drawEnt(ctx, e, doc, st);
  }
}

function pathPolyline(ctx, pts) {
  if (!pts.length) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
}
function pathPoly(ctx, e) {
  const segs = E.polySegs(e);
  if (!segs.length) { if (e.pts.length) { ctx.moveTo(e.pts[0].x, e.pts[0].y); ctx.lineTo(e.pts[0].x, e.pts[0].y); } return; }
  const s0 = segs[0];
  ctx.moveTo(e.pts[0].x, e.pts[0].y);
  for (const s of segs) {
    if (s.k === 'L') ctx.lineTo(s.b.x, s.b.y);
    else ctx.arc(s.c.x, s.c.y, s.r, s.cw ? s.a2 : s.a1, s.cw ? s.a1 : s.a2, !!s.cw);
  }
  if (e.closed) ctx.closePath();
  void s0;
}

export function drawText(ctx, str, o, rot, h, wf, px, st, font = null) {
  const pxh = h * px;
  if (pxh < 0.6) return;
  if (pxh < 2.5 || st.qtext) { // simplificado
    const w = E.textWidth(str, h, wf, font);
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(rot); ctx.beginPath(); ctx.moveTo(0, h * 0.4); ctx.lineTo(w, h * 0.4); ctx.lineWidth = Math.max(1 / px, h * 0.5); ctx.globalAlpha *= 0.5; ctx.stroke(); ctx.restore();
    return;
  }
  if (font) { // fuente de trazo (SHX o equivalente libre)
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(rot);
    ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); strokeText(ctx, font, str, h, wf); ctx.stroke(); ctx.restore();
    return;
  }
  const k = h / E.CAP / 100;
  ctx.save();
  ctx.translate(o.x, o.y); ctx.rotate(rot); ctx.scale(k * wf, -k);
  ctx.font = `100px ${E.FONT}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

function hatchPattern(ctx, e, doc, st, path, bb) {
  let def = e.pdef && e.pdef.length ? e.pdef : HATCHES[(e.pattern || 'ANSI31').toUpperCase()];
  if (!def) def = HATCHES.ANSI31;
  const sc = e.pdef && e.pdef.length ? 1 : (e.scale || 1), an = e.pdef && e.pdef.length ? 0 : (e.angle || 0);
  ctx.save();
  ctx.clip(path, 'evenodd');
  ctx.lineWidth = 1 / st.px;
  const corners = [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x1, y: bb.y2 }, { x: bb.x2, y: bb.y2 }];
  let total = 0;
  for (const d of def) {
    const a = G.rad(d.a) + an;
    const u = { x: Math.cos(a), y: Math.sin(a) }, n = G.perp(u);
    const o = d.world ? { x: d.o[0], y: d.o[1] } : G.add(G.rotate({ x: d.o[0] * sc, y: d.o[1] * sc }, { x: 0, y: 0 }, an), e.origin || { x: 0, y: 0 });
    const off = d.world ? { x: d.d[0], y: d.d[1] } : G.rotate({ x: d.d[0] * sc, y: d.d[1] * sc }, { x: 0, y: 0 }, a);
    const sp = G.dot(off, n);
    if (Math.abs(sp) * st.px < 1.2) { ctx.globalAlpha *= 0.35; ctx.fill(path, 'evenodd'); ctx.globalAlpha /= 0.35; continue; }
    let nmin = Infinity, nmax = -Infinity, umin = Infinity, umax = -Infinity;
    for (const c of corners) { const q = G.sub(c, o); const pn = G.dot(q, n), pu = G.dot(q, u); nmin = Math.min(nmin, pn); nmax = Math.max(nmax, pn); umin = Math.min(umin, pu); umax = Math.max(umax, pu); }
    let k1 = Math.ceil(nmin / sp), k2 = Math.floor(nmax / sp); if (k1 > k2) [k1, k2] = [k2, k1];
    if (k2 - k1 > 4000) { ctx.globalAlpha *= 0.35; ctx.fill(path, 'evenodd'); ctx.globalAlpha /= 0.35; continue; }
    const dash = (d.dash || []).map((v) => Math.max(Math.abs(v) * sc, v === 0 ? 1.5 / st.px : 0));
    const plen = dash.reduce((s, v) => s + v, 0);
    ctx.setLineDash(dash.length && plen * st.px > 2 ? dash : []);
    ctx.beginPath();
    for (let k = k1; k <= k2; k++) {
      const base = G.add(o, G.mul(off, k));
      const shift = G.dot(G.sub(base, o), u);
      const s = G.add(base, G.mul(u, umin - 1 - shift + 0)), t = G.add(base, G.mul(u, umax + 1 - shift));
      if (dash.length && plen) {
        // alinear el patrón con el origen de la familia
        const ph = ((umin - 1 - shift) % plen + plen) % plen;
        ctx.stroke(); ctx.lineDashOffset = ph; ctx.beginPath();
      }
      ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y);
      if (++total > 20000) break;
    }
    ctx.stroke(); ctx.lineDashOffset = 0;
  }
  ctx.restore();
}

export function drawEnt(ctx, e, doc, st) {
  const s = resolveStyle(e, doc, st);
  setStroke(ctx, s, e, doc, st);
  switch (e.type) {
    case 'LINE': case 'XLINE': case 'RAY': {
      ctx.beginPath();
      if (e.type === 'LINE') { ctx.moveTo(e.p1.x, e.p1.y); ctx.lineTo(e.p2.x, e.p2.y); }
      else { const p = E.localPrims(e, doc)[0]; ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(p.b.x, p.b.y); }
      ctx.stroke(); break;
    }
    case 'CIRCLE': ctx.beginPath(); ctx.arc(e.c.x, e.c.y, e.r, 0, G.TAU); ctx.stroke(); break;
    case 'ARC': ctx.beginPath(); ctx.arc(e.c.x, e.c.y, e.r, e.a1, e.a2, false); ctx.stroke(); break;
    case 'LWPOLYLINE': {
      const w = e.cw_ || 0;
      ctx.beginPath(); pathPoly(ctx, e);
      if (w > 0 && !st.override) { const lw0 = ctx.lineWidth; ctx.lineWidth = Math.max(w, lw0); ctx.lineJoin = 'round'; ctx.stroke(); ctx.lineWidth = lw0; }
      else ctx.stroke();
      break;
    }
    case 'ELLIPSE': ctx.beginPath(); pathPolyline(ctx, E.ellipsePoints(e, 128)); ctx.stroke(); break;
    case 'SPLINE': ctx.beginPath(); pathPolyline(ctx, E.splineTess(e)); if (e.closed) ctx.closePath(); ctx.stroke(); break;
    case 'LEADER': {
      ctx.beginPath(); pathPolyline(ctx, e.pts); ctx.stroke();
      if (e.arrow !== false && e.pts.length > 1) {
        const asz = (doc.dimstyle.dimasz || 2.5) * (doc.dimstyle.dimscale || 1), t = e.pts[0], u = G.norm(G.sub(e.pts[1], t)), n = G.perp(u), b = G.add(t, G.mul(u, asz));
        ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(b.x + n.x * asz / 6, b.y + n.y * asz / 6); ctx.lineTo(b.x - n.x * asz / 6, b.y - n.y * asz / 6); ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'POINT': {
      const pd = doc.vars.PDMODE | 0, sz = doc.vars.PDSIZE > 0 ? doc.vars.PDSIZE : doc.vars.PDSIZE < 0 ? -doc.vars.PDSIZE * st.vh / 100 : 5 / st.px * 1.0;
      const r = (doc.vars.PDSIZE ? sz : 6 / st.px) / 2, p = e.p;
      ctx.setLineDash([]); ctx.beginPath();
      const b = pd % 32;
      if (b === 0) { ctx.rect(p.x - 0.5 / st.px, p.y - 0.5 / st.px, 1.5 / st.px, 1.5 / st.px); ctx.fill(); }
      if (b === 2) { ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y); ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r); }
      if (b === 3) { ctx.moveTo(p.x - r, p.y - r); ctx.lineTo(p.x + r, p.y + r); ctx.moveTo(p.x - r, p.y + r); ctx.lineTo(p.x + r, p.y - r); }
      if (b === 4) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + r); }
      if (pd & 32) { ctx.moveTo(p.x + r, p.y); ctx.arc(p.x, p.y, r, 0, G.TAU); }
      if (pd & 64) ctx.rect(p.x - r, p.y - r, 2 * r, 2 * r);
      ctx.stroke(); break;
    }
    case 'TEXT': case 'ATTRIB': case 'ATTDEF': {
      if (e.invisible && e.type === 'ATTRIB') break;
      const f = E.textFrame(e);
      const str = e.type === 'ATTDEF' && !e.constant && !st.showAttdefValue ? e.tag : f.str;
      drawText(ctx, str, f.o, f.rot, f.h, f.wf, st.px, st, f.font);
      break;
    }
    case 'MTEXT': {
      const lay = E.mtextLayout(e), rot = e.rot || 0;
      lay.lines.forEach((t, i) => {
        const dx = lay.ox + (lay.col === 1 ? (lay.W - lay.widths[i]) / 2 : lay.col === 2 ? lay.W - lay.widths[i] : 0);
        const o = G.add(e.p, G.rotate({ x: dx, y: lay.oy - lay.h - i * lay.ls }, { x: 0, y: 0 }, rot));
        drawText(ctx, t, o, rot, lay.h, 1, st.px, st, lay.font);
      });
      break;
    }
    case 'SOLID': {
      ctx.beginPath(); const p = e.pts;
      // orden DXF: 1-2-4-3
      ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); if (p[3]) ctx.lineTo(p[3].x, p[3].y); ctx.lineTo(p[2].x, p[2].y); ctx.closePath();
      if (doc.vars.FILLMODE !== 0 && !st.override) ctx.fill(); else { ctx.fill(); }
      break;
    }
    case 'WIPEOUT': { ctx.save(); ctx.fillStyle = st.bg || '#000'; ctx.beginPath(); pathPolyline(ctx, e.pts); ctx.closePath(); ctx.fill(); ctx.restore(); break; }
    case 'HATCH': {
      const path = ctx.createPath ? ctx.createPath() : new Path2D(), bb = E.entBBox(e, doc);
      for (const lp of e.loops) { const pts = E.polyPoints({ pts: lp, closed: true }); if (!pts.length) continue; path.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y); path.closePath(); }
      if (st.override) { ctx.save(); ctx.globalAlpha *= 0.25; ctx.fill(path, 'evenodd'); ctx.restore(); ctx.stroke(path); break; }
      if ((e.pattern || '').toUpperCase() === 'SOLID' || e.solid) { if (e.tc2) { ctx.save(); ctx.fillStyle = e.tc2; ctx.fill(path, 'evenodd'); ctx.restore(); } else ctx.fill(path, 'evenodd'); }
      else hatchPattern(ctx, e, doc, st, path, bb);
      break;
    }
    case 'INSERT': {
      const blk = doc.blocks[e.name];
      if (!blk) { ctx.beginPath(); ctx.arc(e.p.x, e.p.y, 3 / st.px, 0, G.TAU); ctx.stroke(); break; }
      if (st.depth > 10) break;
      const m = E.insertMatrix(e, blk);
      const sub = { ...st, viewBB: null, depth: (st.depth || 0) + 1, byBlockColor: s.c, byBlockCss: s.css, byBlockLtype: s.lt, byBlockLw: s.lw, blockLayer: e.layer === '0' ? st.blockLayer : e.layer };
      const ents = E.blockEntsFor(e, doc);
      const cols = e.cols || 1, rows = e.rows || 1;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        let mm = m;
        if (i || j) { const off = G.rotate({ x: i * (e.cs || 0), y: j * (e.rs || 0) }, { x: 0, y: 0 }, e.rot || 0); mm = M.mul(M.tr(off.x, off.y), m); }
        ctx.save(); ctx.transform(mm[0], mm[1], mm[2], mm[3], mm[4], mm[5]);
        sub.px = st.px * M.scaleOf(mm); sub.ltk = (st.ltk || 1) / (M.scaleOf(mm) || 1) * 1;
        sub.ltk = st.ltk || 1;
        drawEnts(ctx, ents, doc, sub);
        ctx.restore();
      }
      for (const a of e.attribs || []) if (!a.invisible) drawEnt(ctx, a, doc, { ...st, byBlockColor: s.c, byBlockCss: s.css, blockLayer: e.layer });
      break;
    }
    case 'DUCT': {
      drawEnts(ctx, ductEnts(e), doc, { ...st, viewBB: null, byBlockColor: s.c, byBlockCss: s.css, blockLayer: e.layer });
      break;
    }
    case 'TABLE': {
      drawEnts(ctx, tableEnts(e), doc, { ...st, viewBB: null, byBlockColor: s.c, byBlockCss: s.css, blockLayer: e.layer });
      break;
    }
    case 'DIMENSION': {
      const ents = E.dimEnts(e, doc);
      const sub = { ...st, viewBB: null, byBlockColor: s.c, byBlockCss: s.css, blockLayer: e.layer };
      drawEnts(ctx, ents, doc, sub);
      break;
    }
    case 'VIEWPORT': {
      ctx.beginPath(); ctx.rect(e.c.x - e.w / 2, e.c.y - e.h / 2, e.w, e.h); ctx.stroke(); break;
    }
  }
}
