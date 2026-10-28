// Comandos de dibujo
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Cancel } from './engine.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const F = (v) => G.fmt(v, 4);

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, fn, o) => eng.register(n, fn, o);

  // ---------------- LINE
  R('LINE', async (c) => {
    let p0 = await c.getPoint('Specify first point:');
    if (!isPt(p0)) { if (c.lastLineEnd) p0 = c.lastLineEnd; else return; }
    const start = p0, made = [];
    let prev = p0;
    for (;;) {
      const prompt = made.length >= 2 ? 'Specify next point or [Close/Undo]:' : 'Specify next point or [Undo]:';
      const p = await c.getPoint(prompt, { base: prev, preview: (q) => [{ type: 'LINE', p1: prev, p2: q }] });
      if (p == null) break;
      if (p === 'Undo') { const l = made.pop(); if (l) { doc().remove(l); prev = l.p1; } else c.print('All segments already undone.'); continue; }
      if (p === 'Close') { if (made.length) made.push(doc().add({ type: 'LINE', p1: prev, p2: start })); break; }
      made.push(doc().add({ type: 'LINE', p1: prev, p2: p }));
      prev = p; c.lastLineEnd = p; app.view.redraw();
    }
  });

  // ---------------- PLINE
  R('PLINE', async (c) => {
    const p0 = need(await c.getPoint('Specify start point:'));
    if (!isPt(p0)) return;
    let width = doc().vars.PLINEWID || 0;
    c.print(`Current line-width is ${F(width)}`);
    const pts = [{ x: p0.x, y: p0.y, b: 0 }];
    let arc = false, dir = null;
    const ent = () => ({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ ...p })), closed: false, cw_: width || undefined });
    const tangentDir = () => {
      if (pts.length < 2) return dir;
      const a = pts[pts.length - 2], b = pts[pts.length - 1];
      if (!a.b) return G.norm(G.sub(b, a));
      const arcG = G.bulgeArc(a, b, a.b); const r = G.norm(G.sub(b, arcG.c));
      return a.b > 0 ? G.perp(r) : G.mul(G.perp(r), -1);
    };
    const bulgeTo = (from, to) => {
      const d = tangentDir() || G.norm(G.sub(to, from));
      const ch = G.sub(to, from), a = Math.atan2(G.cross(d, ch), G.dot(d, ch));
      return Math.tan(a / 2);
    };
    const finish = (closed) => { if (pts.length > 1) { const e = ent(); e.closed = closed; if (closed) e.pts[e.pts.length - 1].b = e.pts[e.pts.length - 1].b || 0; doc().add(e); } };
    for (;;) {
      const last = pts[pts.length - 1];
      const prompt = arc
        ? 'Specify endpoint of arc or [Angle/CEnter/CLose/Direction/Halfwidth/Line/Radius/Second pt/Undo/Width]:'
        : (pts.length > 2 ? 'Specify next point or [Arc/Close/Halfwidth/Length/Undo/Width]:' : 'Specify next point or [Arc/Halfwidth/Length/Undo/Width]:');
      const p = await c.getPoint(prompt, {
        base: arc ? null : last, rubber: arc ? false : 'line',
        preview: (q) => { const e = ent(); const l = e.pts[e.pts.length - 1]; if (arc) l.b = bulgeTo(last, q); e.pts.push({ x: q.x, y: q.y, b: 0 }); return [e]; },
      });
      if (p == null) { finish(false); return; }
      if (isPt(p)) {
        if (arc) last.b = bulgeTo(last, p);
        pts.push({ x: p.x, y: p.y, b: 0 }); app.view.redrawOverlay(); continue;
      }
      switch (p) {
        case 'Arc': arc = true; break;
        case 'Line': arc = false; break;
        case 'Close': case 'CLose':
          if (arc && pts.length > 1) { last.b = bulgeTo(last, pts[0]); }
          finish(true); return;
        case 'Undo': if (pts.length > 1) { pts.pop(); pts[pts.length - 1].b = 0; } break;
        case 'Width': case 'Halfwidth': {
          const w = await c.getDist(`Specify starting ${p === 'Halfwidth' ? 'half-' : ''}width <${F(width)}>:`, { base: last, def: width });
          width = (w ?? width) * (p === 'Halfwidth' ? 2 : 1);
          await c.getDist(`Specify ending width <${F(width)}>:`, { base: last, def: width }); break;
        }
        case 'Length': {
          const L = await c.getDist('Specify length of line:', { base: last });
          const d = tangentDir() || { x: 1, y: 0 };
          if (L) pts.push({ ...G.add(last, G.mul(d, L)), b: 0 }); break;
        }
        case 'CEnter': {
          const cc = need(await c.getPoint('Specify center point of arc:', { base: last }));
          const r = G.dist(cc, last);
          const e2 = need(await c.getPoint('Specify endpoint of arc or [Angle/Length]:', { base: cc, preview: (q) => { const a1 = G.ang(cc, last), a2 = G.ang(cc, q); return [{ type: 'ARC', c: cc, r, a1, a2 }]; } }));
          if (!isPt(e2)) break;
          const a1 = G.ang(cc, last), a2 = G.ang(cc, e2), sw = G.arcSweep(a1, a2);
          last.b = Math.tan(sw / 4); const ep = G.polar(cc, a2, r); pts.push({ x: ep.x, y: ep.y, b: 0 }); break;
        }
        case 'Radius': {
          const r = need(await c.getDist('Specify radius of arc:', { base: last }));
          const ep = need(await c.getPoint('Specify endpoint of arc:', { base: last }));
          const d = G.dist(last, ep); if (d > 2 * r) { c.print('Invalid'); break; }
          const sw = 2 * Math.asin(d / (2 * r)); last.b = Math.tan(sw / 4); pts.push({ x: ep.x, y: ep.y, b: 0 }); break;
        }
        case 'Second pt': {
          const s2 = need(await c.getPoint('Specify second point on arc:'));
          const ep = need(await c.getPoint('Specify end point of arc:'));
          const cc = circle3(last, s2, ep); if (!cc) break;
          let a1 = G.ang(cc.c, last), a2 = G.ang(cc.c, ep);
          const ccw = G.cross(G.sub(s2, last), G.sub(ep, s2)) > 0;
          last.b = ccw ? Math.tan(G.arcSweep(a1, a2) / 4) : -Math.tan(G.arcSweep(a2, a1) / 4);
          pts.push({ x: ep.x, y: ep.y, b: 0 }); break;
        }
        case 'Direction': { const q = need(await c.getPoint('Specify the tangent direction for the start point of arc:', { base: last })); dir = G.norm(G.sub(q, last)); break; }
        case 'Angle': {
          const a = need(await c.getAngle('Specify included angle:'));
          const ep = need(await c.getPoint('Specify endpoint of arc:', { base: last }));
          last.b = Math.tan(a / 4); pts.push({ x: ep.x, y: ep.y, b: 0 }); break;
        }
      }
    }
  });

  // ---------------- CIRCLE
  R('CIRCLE', async (c) => {
    const p = need(await c.getPoint('Specify center point for circle or [3P/2P/Ttr (tan tan radius)]:'));
    if (p === '3P') {
      const a = need(await c.getPoint('Specify first point on circle:'));
      const b = need(await c.getPoint('Specify second point on circle:', { base: a }));
      const q = need(await c.getPoint('Specify third point on circle:', { preview: (x) => { const cc = circle3(a, b, x); return cc ? [{ type: 'CIRCLE', c: cc.c, r: cc.r }] : null; } }));
      const cc = circle3(a, b, q); if (cc) doc().add({ type: 'CIRCLE', c: cc.c, r: cc.r }); return;
    }
    if (p === '2P') {
      const a = need(await c.getPoint('Specify first end point of circle\'s diameter:'));
      const b = need(await c.getPoint('Specify second end point of circle\'s diameter:', { base: a, preview: (x) => [{ type: 'CIRCLE', c: G.mid(a, x), r: G.dist(a, x) / 2 }] }));
      doc().add({ type: 'CIRCLE', c: G.mid(a, b), r: G.dist(a, b) / 2 }); return;
    }
    if (p.startsWith?.('Ttr')) {
      const s1 = need(await c.entsel('Specify point on object for first tangent of circle:'));
      const s2 = need(await c.entsel('Specify point on object for second tangent of circle:'));
      const r = need(await c.getDist(`Specify radius of circle <${F(doc().vars.CIRCLERAD || 10)}>:`, { def: doc().vars.CIRCLERAD || 10 }));
      const cc = ttr(E.prims(s1.e, doc()), s1.p, E.prims(s2.e, doc()), s2.p, r);
      if (!cc) { c.print('Circle does not exist.'); return; }
      doc().add({ type: 'CIRCLE', c: cc, r }); doc().vars.CIRCLERAD = r; return;
    }
    if (!isPt(p)) return;
    const def = doc().vars.CIRCLERAD || 0;
    const r = await c.getDist(`Specify radius of circle or [Diameter]${def ? ` <${F(def)}>` : ''}:`, { base: p, def: def || undefined, preview: (q) => [{ type: 'CIRCLE', c: p, r: G.dist(p, q) }] });
    let rad = r;
    if (r === 'Diameter') { const d = need(await c.getDist(`Specify diameter of circle${def ? ` <${F(def * 2)}>` : ''}:`, { base: p, def: def * 2 || undefined, preview: (q) => [{ type: 'CIRCLE', c: p, r: G.dist(p, q) / 2 }] })); rad = d / 2; }
    if (!(rad > 0)) return;
    doc().add({ type: 'CIRCLE', c: p, r: rad }); doc().vars.CIRCLERAD = rad;
  }, { alias: [] });

  // ---------------- ARC
  R('ARC', async (c) => {
    let p = need(await c.getPoint('Specify start point of arc or [Center]:'));
    const add = (cc, r, a1, a2) => doc().add({ type: 'ARC', c: cc, r, a1, a2 });
    if (p === 'Center') {
      const cc = need(await c.getPoint('Specify center point of arc:'));
      const s = need(await c.getPoint('Specify start point of arc:', { base: cc }));
      const r = G.dist(cc, s), a1 = G.ang(cc, s);
      const e = need(await c.getPoint('Specify end point of arc or [Angle/chord Length]:', { base: cc, preview: (q) => [{ type: 'ARC', c: cc, r, a1, a2: G.ang(cc, q) }] }));
      if (e === 'Angle') { const a = need(await c.getAngle('Specify included angle:', { base: cc })); return add(cc, r, a1, a1 + a); }
      if (isPt(e)) add(cc, r, a1, G.ang(cc, e)); return;
    }
    if (!isPt(p)) return;
    const q = need(await c.getPoint('Specify second point of arc or [Center/End]:', { base: p }));
    if (q === 'Center') {
      const cc = need(await c.getPoint('Specify center point of arc:', { base: p }));
      const r = G.dist(cc, p), a1 = G.ang(cc, p);
      const e = need(await c.getPoint('Specify end point of arc or [Angle/chord Length]:', { base: cc, preview: (x) => [{ type: 'ARC', c: cc, r, a1, a2: G.ang(cc, x) }] }));
      if (e === 'Angle') { const a = need(await c.getAngle('Specify included angle:', { base: cc })); return add(cc, r, a1, a1 + a); }
      if (isPt(e)) add(cc, r, a1, G.ang(cc, e)); return;
    }
    if (q === 'End') {
      const e = need(await c.getPoint('Specify end point of arc:', { base: p }));
      const o = need(await c.getPoint('Specify center point of arc or [Angle/Direction/Radius]:', { base: e, preview: (x) => { const r = G.dist(x, p); return [{ type: 'ARC', c: x, r, a1: G.ang(x, p), a2: G.ang(x, e) }]; } }));
      if (o === 'Radius') {
        const r = need(await c.getDist('Specify radius of arc:', { base: e }));
        const d = G.dist(p, e); if (d > 2 * r) { c.print('Invalid'); return; }
        const m = G.mid(p, e), h = Math.sqrt(r * r - d * d / 4), cc = G.add(m, G.mul(G.perp(G.norm(G.sub(e, p))), h));
        return add(cc, r, G.ang(cc, p), G.ang(cc, e));
      }
      if (o === 'Angle') {
        const a = need(await c.getAngle('Specify included angle:'));
        const d = G.dist(p, e), r = d / (2 * Math.sin(a / 2)), m = G.mid(p, e), h = r * Math.cos(a / 2);
        const cc = G.add(m, G.mul(G.perp(G.norm(G.sub(e, p))), h));
        return add(cc, Math.abs(r), G.ang(cc, p), G.ang(cc, e));
      }
      if (o === 'Direction') {
        const dq = need(await c.getPoint('Specify tangent direction for the start point of arc:', { base: p }));
        const t = G.norm(G.sub(dq, p)), n = G.perp(t), ch = G.sub(e, p);
        const k = G.dot(ch, ch) / (2 * G.dot(ch, n)), cc = G.add(p, G.mul(n, k));
        return k > 0 ? add(cc, Math.abs(k), G.ang(cc, p), G.ang(cc, e)) : add(cc, Math.abs(k), G.ang(cc, e), G.ang(cc, p));
      }
      if (isPt(o)) add(o, G.dist(o, p), G.ang(o, p), G.ang(o, e)); return;
    }
    if (!isPt(q)) return;
    const e = need(await c.getPoint('Specify end point of arc:', { preview: (x) => { const a = arc3(p, q, x); return a ? [{ type: 'ARC', ...a }] : null; } }));
    const a = arc3(p, q, e); if (a) doc().add({ type: 'ARC', ...a });
  });

  // ---------------- RECTANG
  R('RECTANG', async (c) => {
    let fr = c._recFillet || 0, ch = c._recChamfer || 0, w = c._recW || 0, rot = 0;
    let p1;
    for (;;) {
      p1 = need(await c.getPoint('Specify first corner point or [Chamfer/Elevation/Fillet/Thickness/Width]:'));
      if (isPt(p1)) break;
      if (p1 === 'Fillet') { fr = c._recFillet = need(await c.getDist(`Specify fillet radius for rectangles <${F(fr)}>:`, { def: fr })); ch = c._recChamfer = 0; }
      else if (p1 === 'Chamfer') { ch = c._recChamfer = need(await c.getDist(`Specify first chamfer distance for rectangles <${F(ch)}>:`, { def: ch })); await c.getDist(`Specify second chamfer distance for rectangles <${F(ch)}>:`, { def: ch }); fr = c._recFillet = 0; }
      else if (p1 === 'Width') w = c._recW = need(await c.getDist(`Specify line width for rectangles <${F(w)}>:`, { def: w }));
      else await c.getDist('Specify value <0.0000>:', { def: 0 });
    }
    const make = (a, b) => rectPoly(a, b, fr, ch, rot, w);
    for (;;) {
      const p2 = need(await c.getPoint('Specify other corner point or [Area/Dimensions/Rotation]:', { preview: (q) => [make(p1, q)] }));
      if (isPt(p2)) { doc().add(make(p1, p2)); return; }
      if (p2 === 'Rotation') rot = need(await c.getAngle('Specify rotation angle or [Pick points] <0>:', { base: p1, def: 0 }));
      if (p2 === 'Dimensions') {
        const L = need(await c.getDist(`Specify length for rectangles <${F(c._recL || 10)}>:`, { def: c._recL || 10 }));
        const H = need(await c.getDist(`Specify width for rectangles <${F(c._recH || 10)}>:`, { def: c._recH || 10 }));
        c._recL = L; c._recH = H;
        const q = need(await c.getPoint('Specify other corner point or [Area/Dimensions/Rotation]:', { preview: (x) => [make(p1, G.add(p1, { x: Math.sign(x.x - p1.x || 1) * L, y: Math.sign(x.y - p1.y || 1) * H }))] }));
        if (isPt(q)) { doc().add(make(p1, G.add(p1, { x: Math.sign(q.x - p1.x || 1) * L, y: Math.sign(q.y - p1.y || 1) * H }))); return; }
      }
      if (p2 === 'Area') {
        const A = need(await c.getReal('Enter area of rectangle in current units <100.0000>:', { def: 100 }));
        const L = need(await c.getDist('Enter rectangle length <10.0000>:', { def: 10 }));
        doc().add(make(p1, G.add(p1, { x: L, y: A / L }))); return;
      }
    }
  });

  // ---------------- POLYGON
  R('POLYGON', async (c) => {
    const n = need(await c.getInt(`Enter number of sides <${doc().vars.POLYSIDES}>:`, { def: doc().vars.POLYSIDES }));
    if (n < 3 || n > 1024) { c.print('Requires an integer between 3 and 1024.'); return; }
    doc().vars.POLYSIDES = n;
    const cc = need(await c.getPoint('Specify center of polygon or [Edge]:'));
    const mk = (pts) => ({ type: 'LWPOLYLINE', pts: pts.map((p) => ({ x: p.x, y: p.y, b: 0 })), closed: true });
    if (cc === 'Edge') {
      const a = need(await c.getPoint('Specify first endpoint of edge:'));
      const b = need(await c.getPoint('Specify second endpoint of edge:', { base: a, preview: (q) => [mk(edgePoly(a, q, n))] }));
      doc().add(mk(edgePoly(a, b, n))); return;
    }
    const mode = (await c.getKw(`Enter an option [Inscribed in circle/Circumscribed about circle] <${c._polyMode || 'I'}>:`, c._polyMode || 'Inscribed in circle')) || 'Inscribed in circle';
    c._polyMode = mode[0];
    const ins = mode.startsWith('I');
    const gen = (q) => { const r = G.dist(cc, q), a0 = G.ang(cc, q), pts = []; const R_ = ins ? r : r / Math.cos(Math.PI / n); const off = ins ? 0 : Math.PI / n; for (let i = 0; i < n; i++) pts.push(G.polar(cc, a0 + off + i * G.TAU / n, R_)); return pts; };
    const r = need(await c.getPoint('Specify radius of circle:', { base: cc, allowNumber: true, preview: (q) => [mk(gen(q))] }));
    const q = typeof r === 'number' ? G.add(cc, { x: ins ? 0 : 0, y: r }) : r;
    doc().add(mk(gen(typeof r === 'number' ? G.polar(cc, Math.PI / 2, r) : q)));
  });

  // ---------------- ELLIPSE
  R('ELLIPSE', async (c) => {
    let p = need(await c.getPoint('Specify axis endpoint of ellipse or [Arc/Center]:'));
    let arcMode = false;
    if (p === 'Arc') { arcMode = true; p = need(await c.getPoint('Specify axis endpoint of elliptical arc or [Center]:')); }
    let cc, major;
    if (p === 'Center') {
      cc = need(await c.getPoint('Specify center of ellipse:'));
      const a = need(await c.getPoint('Specify endpoint of axis:', { base: cc }));
      major = G.sub(a, cc);
    } else {
      const b = need(await c.getPoint('Specify other endpoint of axis:', { base: p }));
      cc = G.mid(p, b); major = G.sub(b, cc);
    }
    const mk = (q) => { const r = G.dist(cc, q) / G.len(major); return { type: 'ELLIPSE', c: cc, major, ratio: Math.min(1, Math.max(1e-6, r)), a1: 0, a2: G.TAU }; };
    const o = need(await c.getPoint('Specify distance to other axis or [Rotation]:', { base: cc, allowNumber: true, preview: (q) => [mk(q)] }));
    let e;
    if (o === 'Rotation') { const a = need(await c.getAngle('Specify rotation around major axis:', { base: cc })); e = { type: 'ELLIPSE', c: cc, major, ratio: Math.max(1e-6, Math.abs(Math.cos(a))), a1: 0, a2: G.TAU }; }
    else if (typeof o === 'number') e = { type: 'ELLIPSE', c: cc, major, ratio: Math.min(1, o / G.len(major)), a1: 0, a2: G.TAU };
    else e = mk(o);
    if (e.ratio > 1) { const minor = G.mul(G.perp(major), e.ratio); e.major = minor; e.ratio = 1 / e.ratio; }
    if (arcMode) {
      const rot = Math.atan2(e.major.y, e.major.x);
      const param = (q) => { const l = G.rotate(G.sub(q, cc), { x: 0, y: 0 }, -rot); return Math.atan2(l.y / e.ratio, l.x); };
      const s = need(await c.getPoint('Specify start angle or [Parameter]:', { base: cc }));
      const a1 = isPt(s) ? param(s) : 0;
      const t = need(await c.getPoint('Specify end angle or [Parameter/Included angle]:', { base: cc, preview: (q) => [{ ...e, a1, a2: param(q) }] }));
      e.a1 = a1; e.a2 = isPt(t) ? param(t) : a1 + Math.PI;
    }
    doc().add(e);
  });

  // ---------------- SPLINE
  R('SPLINE', async (c) => {
    const fit = [];
    const p0 = need(await c.getPoint('Specify first point or [Method/Knots/Object]:'));
    if (p0 === 'Object') {
      const s = await c.select('Select polylines to convert to splines:', { filter: (e) => e.type === 'LWPOLYLINE' });
      for (const e of s) { doc().add({ type: 'SPLINE', layer: e.layer, color: e.color, fit: e.pts.map((p) => ({ x: p.x, y: p.y })), closed: e.closed }); doc().remove(e); }
      return;
    }
    if (!isPt(p0)) return;
    fit.push(p0);
    for (;;) {
      const p = await c.getPoint(fit.length > 2 ? 'Enter next point or [end Tangency/toLerance/Undo/Close]:' : 'Enter next point or [start Tangency/toLerance/Undo]:', { base: fit[fit.length - 1], preview: (q) => [{ type: 'SPLINE', fit: [...fit, q] }] });
      if (p == null) break;
      if (p === 'Undo') { if (fit.length > 1) fit.pop(); continue; }
      if (p === 'Close') { doc().add({ type: 'SPLINE', fit: fit.slice(), closed: true }); return; }
      if (isPt(p)) fit.push(p);
    }
    if (fit.length > 1) doc().add({ type: 'SPLINE', fit });
  });

  // ---------------- POINT
  R('POINT', async (c) => {
    c.print(`Current point modes:  PDMODE=${doc().vars.PDMODE}  PDSIZE=${F(doc().vars.PDSIZE)}`);
    for (;;) { const p = await c.getPoint('Specify a point:'); if (!isPt(p)) return; doc().add({ type: 'POINT', p }); app.view.redraw(); }
  }, { alias: ['MULTIPLEPOINT'] });

  // ---------------- XLINE / RAY
  R('XLINE', async (c) => {
    const p = need(await c.getPoint('Specify a point or [Hor/Ver/Ang/Bisect/Offset]:'));
    const loopThrough = async (dirOf) => { for (;;) { const q = await c.getPoint('Specify through point:', { preview: (x) => [{ type: 'XLINE', ...dirOf(x) }] }); if (!isPt(q)) return; doc().add({ type: 'XLINE', ...dirOf(q) }); app.view.redraw(); } };
    if (p === 'Hor') return loopThrough((q) => ({ p: q, dir: { x: 1, y: 0 } }));
    if (p === 'Ver') return loopThrough((q) => ({ p: q, dir: { x: 0, y: 1 } }));
    if (p === 'Ang') { const a = need(await c.getAngle('Enter angle of xline (0) or [Reference]:')); return loopThrough((q) => ({ p: q, dir: { x: Math.cos(a), y: Math.sin(a) } })); }
    if (p === 'Bisect') {
      const v = need(await c.getPoint('Specify angle vertex point:'));
      const a = need(await c.getPoint('Specify angle start point:', { base: v }));
      return loopThrough((q) => { const d = G.add(G.norm(G.sub(a, v)), G.norm(G.sub(q, v))); return { p: v, dir: G.len(d) > 1e-9 ? G.norm(d) : G.perp(G.norm(G.sub(a, v))) }; });
    }
    if (p === 'Offset') {
      const d = need(await c.getDist('Specify offset distance or [Through]:'));
      const s = need(await c.entsel('Select a line object:', { filter: (e) => ['LINE', 'XLINE', 'RAY'].includes(e.type) }));
      const side = need(await c.getPoint('Specify side to offset:'));
      const e = s.e, dir = e.type === 'LINE' ? G.norm(G.sub(e.p2, e.p1)) : e.dir, base = e.type === 'LINE' ? e.p1 : e.p;
      const n = G.perp(dir), sg = G.dot(G.sub(side, base), n) >= 0 ? 1 : -1;
      doc().add({ type: 'XLINE', p: G.add(base, G.mul(n, d * sg)), dir }); return;
    }
    if (!isPt(p)) return;
    for (;;) { const q = await c.getPoint('Specify through point:', { base: p, preview: (x) => G.dist(p, x) > 1e-9 ? [{ type: 'XLINE', p, dir: G.norm(G.sub(x, p)) }] : null }); if (!isPt(q)) return; doc().add({ type: 'XLINE', p, dir: G.norm(G.sub(q, p)) }); app.view.redraw(); }
  });
  R('RAY', async (c) => {
    const p = need(await c.getPoint('Specify start point:'));
    for (;;) { const q = await c.getPoint('Specify through point:', { base: p, preview: (x) => G.dist(p, x) > 1e-9 ? [{ type: 'RAY', p, dir: G.norm(G.sub(x, p)) }] : null }); if (!isPt(q)) return; doc().add({ type: 'RAY', p, dir: G.norm(G.sub(q, p)) }); app.view.redraw(); }
  });

  // ---------------- DONUT
  R('DONUT', async (c) => {
    const di = need(await c.getDist(`Specify inside diameter of donut <${F(c._dI ?? 0.5)}>:`, { def: c._dI ?? 0.5 }));
    const de = need(await c.getDist(`Specify outside diameter of donut <${F(c._dE ?? 1)}>:`, { def: c._dE ?? 1 }));
    c._dI = di; c._dE = de;
    const r = (di + de) / 4, w = (de - di) / 2;
    const mk = (p) => ({ type: 'LWPOLYLINE', pts: [{ x: p.x - r, y: p.y, b: 1 }, { x: p.x + r, y: p.y, b: 1 }], closed: true, cw_: w || r * 2 });
    for (;;) { const p = await c.getPoint('Specify center of donut or <exit>:', { preview: (q) => [mk(q)] }); if (!isPt(p)) return; doc().add(mk(p)); app.view.redraw(); }
  }, { alias: ['DOUGHNUT'] });

  // ---------------- REVCLOUD
  R('REVCLOUD', async (c) => {
    const arcL = c._rcl || 15;
    const p = need(await c.getPoint(`Minimum arc length: ${F(arcL)}  Specify first corner point or [Arc length/Object/Rectangular/Polygonal/Freehand/Style/Modify] <Object>:`));
    let poly = null;
    if (p === 'Arc length') { c._rcl = need(await c.getDist('Specify minimum length of arc:', { def: arcL })); return; }
    if (isPt(p)) {
      const q = need(await c.getCorner('Specify opposite corner:', p));
      poly = [p, { x: q.x, y: p.y }, q, { x: p.x, y: q.y }];
    } else {
      const s = need(await c.entsel('Select object:', { filter: (e) => e.type === 'LWPOLYLINE' || e.type === 'CIRCLE' }));
      poly = s.e.type === 'CIRCLE' ? G.tessArc(s.e.c, s.e.r, 0, G.TAU - 1e-6, 16) : E.polyPoints({ ...s.e, closed: true });
      doc().remove(s.e);
    }
    const pts = [];
    if (G.polyArea(poly) < 0) poly.reverse();
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = G.dist(a, b), n = Math.max(1, Math.round(L / arcL));
      for (let k = 0; k < n; k++) { const q = G.lerp(a, b, k / n); pts.push({ x: q.x, y: q.y, b: -0.55 }); }
    }
    doc().add({ type: 'LWPOLYLINE', pts, closed: true });
  });

  // ---------------- WIPEOUT
  R('WIPEOUT', async (c) => {
    const pts = [];
    const p0 = need(await c.getPoint('Specify first point or [Frames/Polyline] <Polyline>:'));
    if (p0 === 'Frames') { c.print('Frames are displayed.'); return; }
    if (!isPt(p0)) return;
    pts.push(p0);
    for (;;) { const p = await c.getPoint('Specify next point or [Undo]:', { base: pts[pts.length - 1], preview: (q) => [{ type: 'LWPOLYLINE', pts: [...pts, q].map((x) => ({ ...x, b: 0 })), closed: true }] }); if (!isPt(p)) break; pts.push(p); }
    if (pts.length > 2) doc().add({ type: 'WIPEOUT', pts });
  });

  // ---------------- BOUNDARY
  R('BOUNDARY', async (c) => {
    const { findBoundary } = await import('./boundary.js');
    for (;;) {
      const p = await c.getPoint('Pick internal point:');
      if (!isPt(p)) return;
      const loops = findBoundary(app, p);
      if (!loops) { c.print('Valid hatch boundary not found.'); continue; }
      for (const l of loops) doc().add({ type: 'LWPOLYLINE', pts: l, closed: true });
      c.print(`BOUNDARY created ${loops.length} polyline${loops.length > 1 ? 's' : ''}`);
      app.view.redraw();
    }
  }, { alias: ['BO'] });
}

// ---------- utilidades geométricas
export function circle3(a, b, c) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) return null;
  const ux = ((a.x ** 2 + a.y ** 2) * (b.y - c.y) + (b.x ** 2 + b.y ** 2) * (c.y - a.y) + (c.x ** 2 + c.y ** 2) * (a.y - b.y)) / d;
  const uy = ((a.x ** 2 + a.y ** 2) * (c.x - b.x) + (b.x ** 2 + b.y ** 2) * (a.x - c.x) + (c.x ** 2 + c.y ** 2) * (b.x - a.x)) / d;
  const cc = { x: ux, y: uy };
  return { c: cc, r: G.dist(cc, a) };
}
export function arc3(p, q, e) {
  const cc = circle3(p, q, e); if (!cc) return null;
  const ccw = G.cross(G.sub(q, p), G.sub(e, q)) > 0;
  const a1 = G.ang(cc.c, p), a2 = G.ang(cc.c, e);
  return ccw ? { c: cc.c, r: cc.r, a1, a2 } : { c: cc.c, r: cc.r, a1: a2, a2: a1 };
}
function edgePoly(a, b, n) {
  const L = G.dist(a, b), R_ = L / (2 * Math.sin(Math.PI / n)), m = G.mid(a, b), h = L / (2 * Math.tan(Math.PI / n));
  const cc = G.add(m, G.mul(G.perp(G.norm(G.sub(b, a))), h));
  const a0 = G.ang(cc, a), pts = [];
  for (let i = 0; i < n; i++) pts.push(G.polar(cc, a0 + i * G.TAU / n, R_));
  return pts;
}
export function rectPoly(a, b, fr, ch, rot = 0, w = 0) {
  let corners;
  if (rot) {
    const d = G.rotate(G.sub(b, a), { x: 0, y: 0 }, -rot);
    corners = [{ x: 0, y: 0 }, { x: d.x, y: 0 }, d, { x: 0, y: d.y }].map((q) => G.add(a, G.rotate(q, { x: 0, y: 0 }, rot)));
  } else corners = [a, { x: b.x, y: a.y }, b, { x: a.x, y: b.y }];
  if (G.polyArea(corners) < 0) corners = [corners[0], corners[3], corners[2], corners[1]];
  const W = G.dist(corners[0], corners[1]), H = G.dist(corners[1], corners[2]);
  let pts = [];
  const k = Math.min(fr || ch, W / 2, H / 2);
  if ((fr || ch) && k > 1e-9) {
    for (let i = 0; i < 4; i++) {
      const p = corners[i], prev = corners[(i + 3) % 4], next = corners[(i + 1) % 4];
      const p1 = G.add(p, G.mul(G.norm(G.sub(prev, p)), k)), p2 = G.add(p, G.mul(G.norm(G.sub(next, p)), k));
      pts.push({ x: p1.x, y: p1.y, b: fr ? Math.tan(Math.PI / 8) : 0 }, { x: p2.x, y: p2.y, b: 0 });
    }
  } else pts = corners.map((p) => ({ x: p.x, y: p.y, b: 0 }));
  const e = { type: 'LWPOLYLINE', pts, closed: true };
  if (w) e.cw_ = w;
  return e;
}
function ttr(pr1, pick1, pr2, pick2, r) {
  const offs = (prs, pick) => {
    const out = [];
    for (const p of prs) {
      if (p.k === 'L') { const n = G.perp(G.norm(G.sub(p.b, p.a))); for (const s of [1, -1]) out.push({ k: 'L', a: G.add(p.a, G.mul(n, r * s)), b: G.add(p.b, G.mul(n, r * s)) }); }
      else { out.push({ k: 'A', c: p.c, r: p.r + r, a1: 0, a2: G.TAU, full: true }); if (p.r > r) out.push({ k: 'A', c: p.c, r: p.r - r, a1: 0, a2: G.TAU, full: true }); }
    }
    void pick; return out;
  };
  const o1 = offs(pr1, pick1), o2 = offs(pr2, pick2);
  let best = null, bd = Infinity;
  for (const a of o1) for (const b of o2) for (const x of G.primInter(a, b, true, true)) {
    const d = G.dist(x, pick1) + G.dist(x, pick2);
    if (d < bd) { bd = d; best = x; }
  }
  return best;
}
