// Lectura y escritura DXF
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { Doc, newLayer } from '../core/document.js';
import { LINETYPES } from '../core/tables.js';

const D2R = Math.PI / 180;

// ============ LECTURA
export function parseDXF(text) {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (isNaN(code)) { i--; continue; }
    pairs.push([code, lines[i + 1]]);
  }
  return pairs;
}

export function readDXF(text, name = 'Drawing.dxf') {
  const pairs = parseDXF(text);
  const doc = new Doc();
  doc.reset(name.replace(/\.dxf$/i, '.dwg'));
  doc.layers = { '0': newLayer('0') };
  let i = 0;
  const peek = () => pairs[i];
  const blockRecords = {};
  const layoutNames = {};
  const ents = []; // model
  const paper = [];
  const stats = { unsupported: {} };

  const readEntity = () => { // devuelve [type, groups]
    const type = pairs[i][1].trim(); i++;
    const g = [];
    while (i < pairs.length && pairs[i][0] !== 0) { g.push(pairs[i]); i++; }
    return [type, g];
  };
  const readEntities = (endTokens) => { // lista de entidades hasta ENDSEC/ENDBLK
    const out = [];
    while (i < pairs.length) {
      const p = peek();
      if (p[0] === 0 && endTokens.includes(p[1].trim())) break;
      if (p[0] !== 0) { i++; continue; }
      const [type, g] = readEntity();
      if (type === 'POLYLINE') {
        const verts = [];
        while (i < pairs.length && pairs[i][1].trim() === 'VERTEX') { const [, vg] = readEntity(); verts.push(vg); }
        if (i < pairs.length && pairs[i][1].trim() === 'SEQEND') readEntity();
        out.push(['POLYLINE', g, verts]);
      } else if (type === 'INSERT' && gv(g, 66) && +gv(g, 66) === 1) {
        const atts = [];
        while (i < pairs.length && pairs[i][1].trim() === 'ATTRIB') { const [, ag] = readEntity(); atts.push(ag); }
        if (i < pairs.length && pairs[i][1].trim() === 'SEQEND') readEntity();
        out.push(['INSERT', g, atts]);
      } else out.push([type, g]);
    }
    return out;
  };

  while (i < pairs.length) {
    const p = pairs[i];
    if (p[0] === 0 && p[1].trim() === 'SECTION') {
      const sec = pairs[i + 1][1].trim(); i += 2;
      if (sec === 'HEADER') {
        let v = null;
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDSEC')) {
          const [c, val] = pairs[i];
          if (c === 9) v = val.trim();
          else if (v === '$LTSCALE' && c === 40) doc.vars.LTSCALE = +val;
          else if (v === '$TEXTSIZE' && c === 40) doc.vars.TEXTSIZE = +val;
          else if (v === '$DIMSCALE' && c === 40) doc.dimstyle.dimscale = +val;
          else if (v === '$DIMTXT' && c === 40) doc.dimstyle.dimtxt = +val;
          else if (v === '$DIMASZ' && c === 40) doc.dimstyle.dimasz = +val;
          else if (v === '$INSUNITS' && c === 70) doc.vars.INSUNITS = +val;
          else if (v === '$CLAYER' && c === 8) doc._clayer = val.trim();
          else if (v === '$PDMODE' && c === 70) doc.vars.PDMODE = +val;
          else if (v === '$PDSIZE' && c === 40) doc.vars.PDSIZE = +val;
          else if (v === '$HANDSEED' && c === 5) doc.handseed = parseInt(val, 16) || doc.handseed;
          i++;
        }
      } else if (sec === 'TABLES') {
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDSEC')) {
          if (pairs[i][0] === 0 && pairs[i][1].trim() === 'TABLE') {
            const tname = pairs[i + 1][1].trim(); i += 2;
            while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDTAB')) {
              if (pairs[i][0] !== 0) { i++; continue; }
              const [type, g] = readEntity();
              if (type === 'LAYER') {
                const nm = gv(g, 2); if (nm == null) continue;
                const col = +(gv(g, 62) ?? 7), fl = +(gv(g, 70) ?? 0);
                const l = newLayer(nm, { color: Math.abs(col) || 7, on: col >= 0, frozen: !!(fl & 1), locked: !!(fl & 4), ltype: (gv(g, 6) || 'CONTINUOUS').toUpperCase(), lw: gv(g, 370) != null ? +gv(g, 370) : -3, plot: gv(g, 290) == null ? true : +gv(g, 290) !== 0 });
                if (gv(g, 420) != null) l.tc = '#' + (+gv(g, 420)).toString(16).padStart(6, '0');
                if (l.tc) l.color = l.tc;
                doc.layers[nm] = l;
              } else if (type === 'LTYPE') {
                const nm = (gv(g, 2) || '').toUpperCase(); if (!nm || nm === 'BYLAYER' || nm === 'BYBLOCK') continue;
                const pat = ga(g, 49).map(Number);
                doc.ltypes[nm] = { desc: gv(g, 3) || '', pat: nm === 'CONTINUOUS' ? [] : pat };
              } else if (type === 'STYLE') {
                const nm = gv(g, 2); if (nm) doc.styles[nm] = { name: nm, font: gv(g, 3) || 'Arial', h: +(gv(g, 40) || 0), wf: +(gv(g, 41) || 1) };
              } else if (type === 'BLOCK_RECORD') {
                blockRecords[gv(g, 5)] = gv(g, 2);
              } else if (type === 'DIMSTYLE') {
                // se conserva el estilo actual
              }
            }
            i++;
          } else i++;
        }
      } else if (sec === 'BLOCKS') {
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDSEC')) {
          if (pairs[i][0] === 0 && pairs[i][1].trim() === 'BLOCK') {
            const [, g] = readEntity();
            const nm = gv(g, 2) || gv(g, 3);
            const base = { x: +(gv(g, 10) || 0), y: +(gv(g, 20) || 0) };
            const raw = readEntities(['ENDBLK']);
            if (i < pairs.length) readEntity();
            const conv = raw.map((r) => convEntity(r, stats)).flat().filter(Boolean);
            if (/^\*Model_Space$/i.test(nm)) continue;
            if (/^\*Paper_Space$/i.test(nm)) { paper.push(...conv); continue; }
            if (/^\*Paper_Space\d+$/i.test(nm)) continue;
            conv.forEach((e, k) => (e.bid = k));
            doc.blocks[nm] = { name: nm, base, ents: conv, params: [], _ver: 1 };
          } else i++;
        }
      } else if (sec === 'ENTITIES') {
        const raw = readEntities(['ENDSEC']);
        for (const r of raw) {
          const conv = [convEntity(r, stats)].flat().filter(Boolean);
          const ps = +(gv(r[1], 67) || 0) === 1;
          (ps ? paper : ents).push(...conv);
        }
      } else if (sec === 'OBJECTS') {
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDSEC')) {
          if (pairs[i][0] === 0 && pairs[i][1].trim() === 'LAYOUT') { const [, g] = readEntity(); const nm = gv(g, 1); if (nm && nm !== 'Model') layoutNames[nm] = { w: +(gv(g, 44) || 420), h: +(gv(g, 45) || 297) }; }
          else i++;
        }
      } else {
        while (i < pairs.length && !(pairs[i][0] === 0 && pairs[i][1].trim() === 'ENDSEC')) i++;
      }
    }
    i++;
  }
  doc.model = ents;
  const firstLayout = Object.keys(layoutNames)[0] || 'Layout1';
  doc.layouts = [{ name: firstLayout, paper: 'A3', w: 420, h: 297, ents: paper.filter((e) => !(e.type === 'VIEWPORT' && e.vpid === 1)) }];
  for (const e of [...doc.model, ...doc.layouts[0].ents]) if (!doc.layers[e.layer]) doc.ensureLayer(e.layer);
  for (const b of Object.values(doc.blocks)) for (const e of b.ents) if (!doc.layers[e.layer]) doc.ensureLayer(e.layer);
  for (const lt of Object.values(doc.layers)) if (!doc.ltypes[lt.ltype] && LINETYPES[lt.ltype]) doc.ltypes[lt.ltype] = LINETYPES[lt.ltype];
  if (doc._clayer && doc.layers[doc._clayer]) doc.clayer = doc._clayer;
  delete doc._clayer;
  doc.fixHandles();
  doc.importStats = stats;
  void blockRecords;
  return doc;
}
const gv = (g, c) => { const x = g.find((p) => p[0] === c); return x ? x[1].trim() : undefined; };
const ga = (g, c) => g.filter((p) => p[0] === c).map((p) => p[1].trim());
const gn = (g, c, d = 0) => { const v = gv(g, c); return v == null || v === '' ? d : +v; };
const pt = (g, c) => ({ x: gn(g, c), y: gn(g, c + 10) });

function common(g) {
  const e = { layer: gv(g, 8) ?? '0' };
  const col = gv(g, 62); e.color = col != null ? +col : 256;
  if (gv(g, 420) != null) e.tc = '#' + (+gv(g, 420)).toString(16).padStart(6, '0');
  const lt = gv(g, 6); if (lt) e.ltype = lt.toUpperCase(); else e.ltype = 'BYLAYER';
  const lw = gv(g, 370); e.lw = lw != null ? +lw : -1;
  const lts = gv(g, 48); if (lts != null && +lts !== 1) e.lts = +lts;
  if (+(gv(g, 60) || 0) === 1) e.visible = false;
  const h = gv(g, 5); if (h) e.hid = h.toUpperCase();
  return e;
}
const ocsFlip = (g) => +(gv(g, 230) ?? 1) < 0;

function convEntity(r, stats) {
  const [type, g, extra] = r;
  const c = common(g);
  const flip = ocsFlip(g);
  const fx = (p) => (flip ? { x: -p.x, y: p.y } : p);
  switch (type) {
    case 'LINE': return { type: 'LINE', ...c, p1: pt(g, 10), p2: pt(g, 11) };
    case 'XLINE': case 'RAY': return { type, ...c, p: pt(g, 10), dir: G.norm(pt(g, 11)) };
    case 'POINT': return { type: 'POINT', ...c, p: pt(g, 10) };
    case 'CIRCLE': return { type: 'CIRCLE', ...c, c: fx(pt(g, 10)), r: gn(g, 40) };
    case 'ARC': {
      let a1 = gn(g, 50) * D2R, a2 = gn(g, 51) * D2R;
      if (flip) [a1, a2] = [Math.PI - a2, Math.PI - a1];
      return { type: 'ARC', ...c, c: fx(pt(g, 10)), r: gn(g, 40), a1, a2 };
    }
    case 'LWPOLYLINE': {
      const pts = []; let cur = null;
      for (const [code, v] of g) {
        if (code === 10) { cur = { x: +v, y: 0, b: 0 }; pts.push(cur); }
        else if (code === 20 && cur) cur.y = +v;
        else if (code === 42 && cur) cur.b = +v;
      }
      const e = { type: 'LWPOLYLINE', ...c, pts: flip ? pts.map((p) => ({ x: -p.x, y: p.y, b: -p.b })) : pts, closed: !!(gn(g, 70) & 1) };
      if (gn(g, 43) > 0) e.cw_ = gn(g, 43);
      return e;
    }
    case 'POLYLINE': {
      const fl = gn(g, 70);
      const verts = (extra || []).filter((v) => !(gn(v, 70) & 16));
      if (fl & 64) { // malla de caras
        const vs = verts.filter((v) => gn(v, 70) & 64).map((v) => pt(v, 10));
        const out = [];
        for (const v of verts) if ((gn(v, 70) & 128) && !(gn(v, 70) & 64)) {
          const idx = [71, 72, 73, 74].map((k) => gn(v, k)).filter((k) => k !== 0);
          for (let k = 0; k < idx.length; k++) { const a = idx[k], b = idx[(k + 1) % idx.length]; if (a > 0 && vs[Math.abs(a) - 1] && vs[Math.abs(b) - 1]) out.push({ type: 'LINE', ...c, p1: vs[Math.abs(a) - 1], p2: vs[Math.abs(b) - 1] }); }
        }
        return out;
      }
      if (fl & 16) { const m = gn(g, 71), n = gn(g, 72); const vs = verts.map((v) => pt(v, 10)); const out = []; for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) { const p = vs[a * n + b]; if (b + 1 < n) out.push({ type: 'LINE', ...c, p1: p, p2: vs[a * n + b + 1] }); if (a + 1 < m) out.push({ type: 'LINE', ...c, p1: p, p2: vs[(a + 1) * n + b] }); } return out; }
      const pts = verts.map((v) => ({ ...fx(pt(v, 10)), b: (flip ? -1 : 1) * gn(v, 42) }));
      const e = { type: 'LWPOLYLINE', ...c, pts, closed: !!(fl & 1) };
      if (gn(g, 40) > 0 && gn(g, 40) === gn(g, 41)) e.cw_ = gn(g, 40);
      return e;
    }
    case 'TEXT': case 'ATTDEF': case 'ATTRIB': {
      const e = { type, ...c, p: pt(g, 10), h: gn(g, 40, 2.5), text: gv(g, 1) ?? '', rot: gn(g, 50) * D2R, wf: gn(g, 41, 1), style: gv(g, 7) || 'Standard', ha: gn(g, 72), va: gn(g, 74, gn(g, 73)) };
      if (type !== 'TEXT') e.va = gn(g, 74);
      if (type === 'TEXT') e.va = gn(g, 73);
      if (e.ha || e.va) e.p2 = pt(g, 11);
      if (type !== 'TEXT') { e.tag = gv(g, 2) || ''; const fl = gn(g, 70); e.invisible = !!(fl & 1); e.constant = !!(fl & 2); }
      if (type === 'ATTDEF') { e.prompt = gv(g, 3) || ''; e.def = e.text; }
      if (gn(g, 71) & 2) e.rot = e.rot; // generación espejo ignorada
      return e;
    }
    case 'MTEXT': {
      const text = ga(g, 3).join('') + (gv(g, 1) ?? '');
      let rot = gn(g, 50) * D2R;
      if (gv(g, 11) != null) rot = Math.atan2(gn(g, 21), gn(g, 11));
      return { type: 'MTEXT', ...c, p: pt(g, 10), h: gn(g, 40, 2.5), w: gn(g, 41), att: gn(g, 71, 1), text, rot, ls: gn(g, 44, 1), style: gv(g, 7) || 'Standard' };
    }
    case 'INSERT': case 'ACAD_TABLE': {
      let p = pt(g, 10), rot = gn(g, 50) * D2R, sx = gn(g, 41, 1), sy = gn(g, 42, 1);
      if (flip) { p = { x: -p.x, y: p.y }; rot = Math.PI - rot; sy = -sy; }
      const e = { type: 'INSERT', ...c, name: gv(g, 2), p, sx, sy, rot };
      if (gn(g, 70) > 1 || gn(g, 71) > 1) { e.cols = Math.max(1, gn(g, 70)); e.rows = Math.max(1, gn(g, 71)); e.cs = gn(g, 44); e.rs = gn(g, 45); }
      if (extra && extra.length) e.attribs = extra.map((ag) => convEntity(['ATTRIB', ag], stats)).filter(Boolean);
      return e;
    }
    case 'ELLIPSE': return { type: 'ELLIPSE', ...c, c: pt(g, 10), major: pt(g, 11), ratio: gn(g, 40, 1), a1: gn(g, 41, 0), a2: gn(g, 42, G.TAU) };
    case 'SPLINE': {
      const xs = ga(g, 10).map(Number), ys = ga(g, 20).map(Number);
      const fxs = ga(g, 11).map(Number), fys = ga(g, 21).map(Number);
      const e = { type: 'SPLINE', ...c, deg: gn(g, 71, 3), knots: ga(g, 40).map(Number), closed: !!(gn(g, 70) & 1) };
      const w = ga(g, 41).map(Number); if (w.length) e.w = w;
      if (xs.length) e.cps = xs.map((x, k) => ({ x, y: ys[k] }));
      if (fxs.length && !xs.length) e.fit = fxs.map((x, k) => ({ x, y: fys[k] }));
      return e;
    }
    case 'SOLID': case 'TRACE': return { type: 'SOLID', ...c, pts: [pt(g, 10), pt(g, 11), pt(g, 12), gv(g, 13) != null ? pt(g, 13) : pt(g, 12)] };
    case '3DFACE': return { type: 'LWPOLYLINE', ...c, pts: [10, 11, 12, 13].map((k) => ({ ...pt(g, k), b: 0 })), closed: true };
    case 'LEADER': { const xs = ga(g, 10).map(Number), ys = ga(g, 20).map(Number); return { type: 'LEADER', ...c, pts: xs.map((x, k) => ({ x, y: ys[k] })), arrow: gn(g, 71, 1) !== 0 }; }
    case 'DIMENSION': {
      const e = { type: 'DIMENSION', ...c, block: gv(g, 2), text: gv(g, 1) || undefined };
      e.ip = { p10: pt(g, 10), p13: pt(g, 13), p14: pt(g, 14), p15: pt(g, 15), t: gn(g, 70) & 7, m: gn(g, 42) };
      return e;
    }
    case 'HATCH': return hatchFrom(g, c);
    case 'VIEWPORT': {
      const id = gn(g, 69);
      const h = gn(g, 41), vh = gn(g, 45, h);
      return { type: 'VIEWPORT', ...c, vpid: id, c: pt(g, 10), w: gn(g, 40), h, vc: pt(g, 12), scale: vh ? h / vh : 1 };
    }
    case 'WIPEOUT': return null;
    case 'MULTILEADER': case 'MLEADER': {
      const t = gv(g, 304); const p = gv(g, 12) != null ? pt(g, 12) : pt(g, 10);
      const out = [];
      if (t) out.push({ type: 'MTEXT', ...c, p, h: gn(g, 41, 2.5), text: t, att: 1, w: 0 });
      const lx = ga(g, 10).map(Number), ly = ga(g, 20).map(Number);
      if (lx.length > 1) out.push({ type: 'LEADER', ...c, pts: lx.map((x, k) => ({ x, y: ly[k] })), arrow: true });
      return out;
    }
    default:
      stats.unsupported[type] = (stats.unsupported[type] || 0) + 1;
      return null;
  }
}

function hatchFrom(g, c) {
  let k = 0;
  const e = { type: 'HATCH', ...c, pattern: (gv(g, 2) || 'SOLID').toUpperCase(), solid: gn(g, 70) === 1, loops: [] };
  const nx = () => g[k++];
  const val = () => +g[k - 1][1];
  // avanzar hasta 91
  while (k < g.length && g[k][0] !== 91) k++;
  if (k >= g.length) return null;
  k++; const np = +g[k - 1][1];
  for (let pth = 0; pth < np; pth++) {
    while (k < g.length && g[k][0] !== 92) k++;
    if (k >= g.length) break;
    nx(); const flag = val();
    const loop = [];
    if (flag & 2) {
      let hasB = 0, n = 0;
      while (k < g.length && g[k][0] !== 93) { if (g[k][0] === 72) hasB = +g[k][1]; k++; }
      nx(); n = val();
      for (let v = 0; v < n; v++) {
        while (k < g.length && g[k][0] !== 10) k++;
        nx(); const x = val(); nx(); const y = val();
        let b = 0; if (hasB && g[k] && g[k][0] === 42) { nx(); b = val(); }
        loop.push({ x, y, b });
      }
    } else {
      while (k < g.length && g[k][0] !== 93) k++;
      nx(); const ne = val();
      for (let ed = 0; ed < ne; ed++) {
        while (k < g.length && g[k][0] !== 72) k++;
        nx(); const et = val();
        const rd = (code) => { while (k < g.length && g[k][0] !== code) k++; nx(); return val(); };
        if (et === 1) { const x1 = rd(10), y1 = rd(20); rd(11); rd(21); loop.push({ x: x1, y: y1, b: 0 }); }
        else if (et === 2) {
          const cx = rd(10), cy = rd(20), r = rd(40); let a1 = rd(50) * D2R, a2 = rd(51) * D2R; const ccw = rd(73);
          if (!ccw) { a1 = -a1; a2 = -a2; }
          const sw = ccw ? G.arcSweep(a1, a2) : -G.arcSweep(a2, a1);
          const s = G.polar({ x: cx, y: cy }, a1, r);
          loop.push({ x: s.x, y: s.y, b: Math.tan(sw / 4) });
        } else if (et === 3) {
          const cx = rd(10), cy = rd(20), mx = rd(11), my = rd(21), ratio = rd(40); let a1 = rd(50) * D2R, a2 = rd(51) * D2R; const ccw = rd(73);
          if (!ccw) { a1 = -a1; a2 = -a2; }
          const pts = E.ellipsePoints({ c: { x: cx, y: cy }, major: { x: mx, y: my }, ratio, a1: ccw ? a1 : a2, a2: ccw ? a2 : a1 }, 64);
          if (!ccw) pts.reverse();
          for (const p of pts.slice(0, -1)) loop.push({ x: p.x, y: p.y, b: 0 });
        } else if (et === 4) {
          const deg = rd(94); rd(73); rd(74); const nk = rd(95), nc = rd(96);
          const knots = []; for (let q = 0; q < nk; q++) knots.push(rd(40));
          const cps = []; for (let q = 0; q < nc; q++) { const x = rd(10), y = rd(20); cps.push({ x, y }); }
          const pts = G.splinePoints(deg, cps, knots, null, 48);
          for (const p of pts.slice(0, -1)) loop.push({ x: p.x, y: p.y, b: 0 });
        }
      }
    }
    if (loop.length >= 2) e.loops.push(loop);
  }
  // patrón
  const rest = g.slice(k);
  const ang = rest.find((p) => p[0] === 52); if (ang) e.angle = +ang[1] * D2R;
  const sc = rest.find((p) => p[0] === 41); if (sc) e.scale = +sc[1];
  const nlIdx = rest.findIndex((p) => p[0] === 78);
  if (nlIdx >= 0 && !e.solid) {
    const pdef = []; let j = nlIdx + 1; const nl = +rest[nlIdx][1];
    for (let q = 0; q < nl; q++) {
      const get = (code) => { while (j < rest.length && rest[j][0] !== code) j++; return j < rest.length ? +rest[j++][1] : 0; };
      const a = get(53), bx = get(43), by = get(44), dx = get(45), dy = get(46), nd = get(79);
      const dash = []; for (let z = 0; z < nd; z++) dash.push(get(49));
      pdef.push({ a, o: [bx, by], d: [dx, dy], dash, world: true });
    }
    if (pdef.length) e.pdef = pdef;
  }
  if (!e.loops.length) return null;
  return e;
}

// ============ ESCRITURA (AutoCAD R12 / AC1009)
export function writeDXF(doc, opts = {}) {
  const out = [];
  const w = (c, v) => { out.push(String(c)); out.push(typeof v === 'number' ? fmt(v) : String(v)); };
  const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(10)));
  const P = (code, p) => { w(code, p.x); w(code + 10, p.y); w(code + 20, 0); };
  const R2D = 180 / Math.PI;
  const model = opts.ents || doc.model;
  const blocks = opts.blocks || doc.blocks;
  const bb = doc.extents(model) || { x1: 0, y1: 0, x2: 100, y2: 100 };
  // cabecera
  w(0, 'SECTION'); w(2, 'HEADER');
  w(9, '$ACADVER'); w(1, 'AC1009');
  w(9, '$INSBASE'); P(10, { x: 0, y: 0 });
  w(9, '$EXTMIN'); P(10, { x: bb.x1, y: bb.y1 });
  w(9, '$EXTMAX'); P(10, { x: bb.x2, y: bb.y2 });
  w(9, '$LTSCALE'); w(40, doc.vars.LTSCALE || 1);
  w(9, '$TEXTSIZE'); w(40, doc.vars.TEXTSIZE || 2.5);
  w(9, '$DIMSCALE'); w(40, doc.dimstyle.dimscale || 1);
  w(9, '$DIMTXT'); w(40, doc.dimstyle.dimtxt || 2.5);
  w(9, '$DIMASZ'); w(40, doc.dimstyle.dimasz || 2.5);
  w(9, '$CLAYER'); w(8, doc.clayer);
  w(9, '$PDMODE'); w(70, doc.vars.PDMODE | 0);
  w(9, '$PDSIZE'); w(40, doc.vars.PDSIZE || 0);
  w(0, 'ENDSEC');
  // tablas
  w(0, 'SECTION'); w(2, 'TABLES');
  const lts = { CONTINUOUS: { desc: 'Solid line', pat: [] }, ...doc.ltypes };
  w(0, 'TABLE'); w(2, 'LTYPE'); w(70, Object.keys(lts).length);
  for (const [n, lt] of Object.entries(lts)) {
    w(0, 'LTYPE'); w(2, n); w(70, 0); w(3, lt.desc || ''); w(72, 65); w(73, (lt.pat || []).length); w(40, (lt.pat || []).reduce((s, x) => s + Math.abs(x), 0));
    for (const d of lt.pat || []) w(49, d);
  }
  w(0, 'ENDTAB');
  w(0, 'TABLE'); w(2, 'LAYER'); w(70, Object.keys(doc.layers).length);
  for (const l of Object.values(doc.layers)) {
    const col = typeof l.color === 'number' ? l.color : 7;
    w(0, 'LAYER'); w(2, l.name); w(70, (l.frozen ? 1 : 0) | (l.locked ? 4 : 0)); w(62, l.on ? col : -col); w(6, l.ltype || 'CONTINUOUS');
  }
  w(0, 'ENDTAB');
  w(0, 'TABLE'); w(2, 'STYLE'); w(70, Object.keys(doc.styles).length);
  for (const s of Object.values(doc.styles)) { w(0, 'STYLE'); w(2, s.name); w(70, 0); w(40, s.h || 0); w(41, s.wf || 1); w(50, 0); w(71, 0); w(42, 2.5); w(3, 'txt'); w(4, ''); }
  w(0, 'ENDTAB');
  w(0, 'ENDSEC');
  // bloques
  const anon = [];
  w(0, 'SECTION'); w(2, 'BLOCKS');
  const writeBlock = (name, base, ents) => {
    w(0, 'BLOCK'); w(8, '0'); w(2, name); w(70, name.startsWith('*') ? 1 : (ents.some((e) => e.type === 'ATTDEF') ? 2 : 0)); P(10, base); w(3, name); w(1, '');
    for (const e of ents) writeEnt(e, true);
    w(0, 'ENDBLK'); w(8, '0');
  };
  const writeEnt = (e, inBlock) => {
    const base = () => {
      w(8, e.layer || '0');
      const lt = (e.ltype || 'BYLAYER').toUpperCase(); if (lt !== 'BYLAYER') w(6, lt);
      if (e.color != null && e.color !== 256 && typeof e.color === 'number') w(62, e.color);
    };
    switch (e.type) {
      case 'LINE': w(0, 'LINE'); base(); P(10, e.p1); P(11, e.p2); break;
      case 'POINT': w(0, 'POINT'); base(); P(10, e.p); break;
      case 'CIRCLE': w(0, 'CIRCLE'); base(); P(10, e.c); w(40, e.r); break;
      case 'ARC': w(0, 'ARC'); base(); P(10, e.c); w(40, e.r); w(50, G.normA(e.a1) * R2D); w(51, G.normA(e.a2) * R2D); break;
      case 'LWPOLYLINE': {
        w(0, 'POLYLINE'); base(); w(66, 1); P(10, { x: 0, y: 0 }); w(70, e.closed ? 1 : 0); if (e.cw_) { w(40, e.cw_); w(41, e.cw_); }
        for (const v of e.pts) { w(0, 'VERTEX'); w(8, e.layer || '0'); P(10, v); if (v.b) w(42, v.b); }
        w(0, 'SEQEND'); w(8, e.layer || '0'); break;
      }
      case 'TEXT': case 'ATTDEF': case 'ATTRIB': {
        w(0, e.type); base(); P(10, e.p); w(40, e.h || 2.5); w(1, e.type === 'ATTDEF' ? (e.def ?? '') : (e.text ?? '')); if (e.rot) w(50, e.rot * R2D); if (e.wf && e.wf !== 1) w(41, e.wf);
        w(7, e.style || 'STANDARD');
        if (e.ha) w(72, e.ha); if (e.ha || e.va) P(11, e.p2 || e.p);
        if (e.type === 'ATTDEF') { w(3, e.prompt || ''); w(2, e.tag); w(70, (e.invisible ? 1 : 0) | (e.constant ? 2 : 0)); if (e.va) w(74, e.va); }
        else if (e.type === 'ATTRIB') { w(2, e.tag); w(70, e.invisible ? 1 : 0); if (e.va) w(74, e.va); }
        else if (e.va) w(73, e.va);
        break;
      }
      case 'MTEXT': for (const t of E.explodeEnt(e)) writeEnt({ ...t, layer: e.layer, color: e.color }, inBlock); break;
      case 'INSERT': {
        w(0, 'INSERT'); base(); if (e.attribs?.length) w(66, 1);
        let name = e.name;
        if (e.dyn && doc.blocks[e.name]?.params?.length) { // bloque dinámico → bloque anónimo con la geometría efectiva
          name = `*U${anon.length + 1}`; anon.push({ name, base: doc.blocks[e.name].base, ents: E.blockEntsFor(e, doc) });
        }
        w(2, name); P(10, e.p); if ((e.sx ?? 1) !== 1) w(41, e.sx); if ((e.sy ?? 1) !== 1) w(42, e.sy); if (e.rot) w(50, e.rot * R2D);
        if (e.cols > 1) { w(70, e.cols); w(44, e.cs || 0); } if (e.rows > 1) { w(71, e.rows); w(45, e.rs || 0); }
        if (e.attribs?.length) { for (const a of e.attribs) writeEnt({ ...a, type: 'ATTRIB' }, inBlock); w(0, 'SEQEND'); w(8, e.layer || '0'); }
        break;
      }
      case 'ELLIPSE': case 'SPLINE': case 'LEADER': {
        const parts = E.explodeEnt(e, doc); for (const p of parts || []) writeEnt({ ...p, layer: e.layer, color: e.color, ltype: e.ltype }, inBlock); break;
      }
      case 'XLINE': case 'RAY': { const d = G.norm(e.dir); const L = 1e5; writeEnt({ type: 'LINE', layer: e.layer, color: e.color, p1: e.type === 'RAY' ? e.p : G.sub(e.p, G.mul(d, L)), p2: G.add(e.p, G.mul(d, L)) }, inBlock); break; }
      case 'SOLID': w(0, 'SOLID'); base(); e.pts.forEach((p, k) => P(10 + k, p)); if (e.pts.length === 3) P(13, e.pts[2]); break;
      case 'HATCH': {
        if (e.solid || (e.pattern || '').toUpperCase() === 'SOLID') {
          for (const l of e.loops) { const pts = E.polyPoints({ pts: l, closed: true }); writeEnt({ type: 'LWPOLYLINE', layer: e.layer, color: e.color, pts: pts.map((p) => ({ ...p, b: 0 })), closed: true }, inBlock); }
        } else {
          const lines = hatchLines(e, doc); for (const l of lines) writeEnt({ type: 'LINE', layer: e.layer, color: e.color, p1: l[0], p2: l[1] }, inBlock);
        }
        break;
      }
      case 'DIMENSION': {
        const ents = E.dimEnts(e, doc).map((x) => ({ ...x, layer: x.layer || e.layer }));
        const name = `*D${anon.length + 1}`; anon.push({ name, base: { x: 0, y: 0 }, ents });
        w(0, 'DIMENSION'); base(); w(2, name); P(10, e.dp || e.p1 || { x: 0, y: 0 }); P(11, e.tp || e.dp || { x: 0, y: 0 });
        w(70, { linear: 0, aligned: 1, angular: 2, diameter: 3, radius: 4, ordinate: 6 }[e.dt] ?? 0); if (e.text) w(1, e.text);
        if (e.p1) P(13, e.p1); if (e.p2) P(14, e.p2); if (e.c) P(15, e.c); if (e.dt === 'linear') w(50, (e.rot || 0) * R2D);
        break;
      }
      case 'WIPEOUT': break;
      case 'VIEWPORT': break;
    }
  };
  for (const b of Object.values(blocks)) { if (b.name.startsWith('*Model') || b.name.startsWith('*Paper')) continue; writeBlock(b.name, b.base, b.ents); }
  // entidades (primero se recogen los anónimos)
  const entOut = out.length;
  w(0, 'ENDSEC');
  w(0, 'SECTION'); w(2, 'ENTITIES');
  for (const e of model) writeEnt(e, false);
  if (opts.paper) for (const e of opts.paper) { const before = out.length; writeEnt(e, false); void before; }
  w(0, 'ENDSEC'); w(0, 'EOF');
  // insertar bloques anónimos antes de cerrar BLOCKS
  const anonOut = [];
  const save = out.splice(entOut); // ENDSEC(BLOCKS) + entidades
  for (const a of anon) {
    const tmp = out.length; writeBlock(a.name, a.base, a.ents);
    anonOut.push(...out.splice(tmp));
  }
  out.push(...anonOut, ...save);
  return out.join('\r\n') + '\r\n';
}

// líneas de sombreado (para DXF R12)
export function hatchLines(e, doc) {
  const res = [];
  const loops = e.loops.map((l) => E.polyPoints({ pts: l, closed: true }));
  const bb = E.entBBox(e, doc);
  const segs = []; for (const l of loops) for (let k = 0; k < l.length; k++) segs.push([l[k], l[(k + 1) % l.length]]);
  const def = e.pdef?.length ? e.pdef : null;
  const pat = def || (patternsFor(e.pattern) || []);
  const sc = def ? 1 : e.scale || 1, an = def ? 0 : e.angle || 0;
  for (const d of pat) {
    const a = G.rad(d.a) + an, u = { x: Math.cos(a), y: Math.sin(a) }, n = G.perp(u);
    const o = d.world ? { x: d.o[0], y: d.o[1] } : G.rotate({ x: d.o[0] * sc, y: d.o[1] * sc }, { x: 0, y: 0 }, an);
    const off = d.world ? { x: d.d[0], y: d.d[1] } : G.rotate({ x: d.d[0] * sc, y: d.d[1] * sc }, { x: 0, y: 0 }, a);
    const sp = G.dot(off, n); if (Math.abs(sp) < 1e-9) continue;
    const cs = [{ x: bb.x1, y: bb.y1 }, { x: bb.x2, y: bb.y1 }, { x: bb.x1, y: bb.y2 }, { x: bb.x2, y: bb.y2 }].map((q) => G.dot(G.sub(q, o), n));
    let k1 = Math.ceil(Math.min(...cs) / sp), k2 = Math.floor(Math.max(...cs) / sp); if (k1 > k2) [k1, k2] = [k2, k1];
    if (k2 - k1 > 3000) continue;
    for (let k = k1; k <= k2; k++) {
      const base = G.add(o, G.mul(off, k));
      const A = G.add(base, G.mul(u, -1e6)), B = G.add(base, G.mul(u, 1e6));
      const ts = [];
      for (const s of segs) { const r = G.llInter(A, B, s[0], s[1]); if (r.length) ts.push(r[0].t); }
      ts.sort((x, y) => x - y);
      for (let q = 0; q + 1 < ts.length; q += 2) res.push([G.lerp(A, B, ts[q]), G.lerp(A, B, ts[q + 1])]);
      if (res.length > 50000) return res;
    }
  }
  return res;
}
let _pats = null;
function patternsFor(name) { return _pats ? _pats[(name || '').toUpperCase()] : null; }
export function setPatterns(p) { _pats = p; }
