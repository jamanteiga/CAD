// Contexto tipo Canvas2D que registra el dibujo como SVG vectorial
const f = (v) => +v.toFixed(4);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

class RecPath {
  constructor() { this.ops = []; }
  moveTo(x, y) { this.ops.push(['M', x, y]); }
  lineTo(x, y) { this.ops.push(['L', x, y]); }
  closePath() { this.ops.push(['Z']); }
  arc(cx, cy, r, a1, a2, ccw) { this.ops.push(['A', cx, cy, r, a1, a2, !!ccw]); }
  rect(x, y, w, h) { this.ops.push(['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']); }
}

export function svgContext(w, h) {
  const out = [], defs = [];
  let clipN = 0;
  const st = { m: [1, 0, 0, 1, 0, 0], clip: null };
  const stack = [];
  let path = new RecPath();
  const ctx = {
    strokeStyle: '#000', fillStyle: '#000', lineWidth: 1, globalAlpha: 1, font: '10px sans-serif', textBaseline: 'alphabetic', lineDashOffset: 0, lineJoin: 'miter', lineCap: 'butt', _dash: [],
    save() { stack.push({ m: st.m.slice(), clip: st.clip, sS: this.strokeStyle, fS: this.fillStyle, lw: this.lineWidth, ga: this.globalAlpha, font: this.font, dash: this._dash }); },
    restore() { const s = stack.pop(); if (!s) return; st.m = s.m; st.clip = s.clip; this.strokeStyle = s.sS; this.fillStyle = s.fS; this.lineWidth = s.lw; this.globalAlpha = s.ga; this.font = s.font; this._dash = s.dash; },
    setTransform(a, b, c, d, e, f_) { st.m = [a, b, c, d, e, f_]; },
    transform(a, b, c, d, e, f_) { st.m = mul(st.m, [a, b, c, d, e, f_]); },
    translate(x, y) { st.m = mul(st.m, [1, 0, 0, 1, x, y]); },
    rotate(a) { const c = Math.cos(a), s = Math.sin(a); st.m = mul(st.m, [c, s, -s, c, 0, 0]); },
    scale(x, y) { st.m = mul(st.m, [x, 0, 0, y, 0, 0]); },
    getTransform() { const [a, b, c, d, e, f_] = st.m; return { a, b, c, d, e, f: f_ }; },
    beginPath() { path = new RecPath(); },
    moveTo(x, y) { path.moveTo(x, y); }, lineTo(x, y) { path.lineTo(x, y); }, closePath() { path.closePath(); },
    arc(cx, cy, r, a1, a2, ccw) { path.arc(cx, cy, r, a1, a2, ccw); },
    rect(x, y, w_, h_) { path.rect(x, y, w_, h_); },
    createPath() { return new RecPath(); },
    setLineDash(d) { this._dash = d || []; },
    measureText(t) { const m = /([\d.]+)px/.exec(this.font); return { width: String(t).length * (m ? +m[1] : 10) * 0.55 }; },
    stroke(p) { emit(p || path, 'stroke'); },
    fill(p, rule) { if (typeof p === 'string') { rule = p; p = null; } emit(p || path, 'fill', rule); },
    clip(p, rule) { if (typeof p === 'string') { rule = p; p = null; } const id = 'c' + ++clipN; defs.push(`<clipPath id="${id}"><path d="${pathD(p || path)}" clip-rule="${rule === 'evenodd' ? 'evenodd' : 'nonzero'}"/></clipPath>`); st.clip = id; },
    fillRect(x, y, w_, h_) { const p = new RecPath(); p.rect(x, y, w_, h_); emit(p, 'fill'); },
    strokeRect(x, y, w_, h_) { const p = new RecPath(); p.rect(x, y, w_, h_); emit(p, 'stroke'); },
    fillText(t, x, y) {
      const m = mul(st.m, [1, 0, 0, 1, x, y]);
      const sz = (/([\d.]+)px/.exec(this.font) || [0, 10])[1];
      const fam = this.font.replace(/^.*?px\s*/, '').replace(/"/g, "'");
      out.push(`<text transform="matrix(${m.map(f).join(' ')})" font-size="${sz}" font-family="${fam}" fill="${this.fillStyle}"${op()}${cl()}>${esc(t)}</text>`);
    },
    toSVG() { return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}mm" height="${f(h)}mm" viewBox="0 0 ${f(w)} ${f(h)}">\n<defs>${defs.join('')}</defs>\n<rect width="100%" height="100%" fill="#fff"/>\n${out.join('\n')}\n</svg>`; },
  };
  const scl = () => Math.sqrt(Math.abs(st.m[0] * st.m[3] - st.m[1] * st.m[2]));
  const T = (x, y) => [st.m[0] * x + st.m[2] * y + st.m[4], st.m[1] * x + st.m[3] * y + st.m[5]];
  const op = () => (ctx.globalAlpha < 1 ? ` opacity="${f(ctx.globalAlpha)}"` : '');
  const cl = () => (st.clip ? ` clip-path="url(#${st.clip})"` : '');
  function pathD(p) {
    const d = []; let has = false;
    const det = st.m[0] * st.m[3] - st.m[1] * st.m[2], k = scl();
    for (const o of p.ops) {
      if (o[0] === 'M') { const [x, y] = T(o[1], o[2]); d.push(`M${f(x)} ${f(y)}`); has = true; }
      else if (o[0] === 'L') { const [x, y] = T(o[1], o[2]); d.push(`L${f(x)} ${f(y)}`); has = true; }
      else if (o[0] === 'Z') d.push('Z');
      else if (o[0] === 'A') {
        const [, cx, cy, r, a1, a2_, ccw] = o;
        let a2 = a2_, sw = ccw ? a1 - a2 : a2 - a1;
        const TAU = Math.PI * 2;
        if (sw >= TAU - 1e-9) sw = TAU; else { sw = ((sw % TAU) + TAU) % TAU; }
        const pAt = (a) => T(cx + r * Math.cos(a), cy + r * Math.sin(a));
        const [sx, sy] = pAt(a1);
        d.push(`${has ? 'L' : 'M'}${f(sx)} ${f(sy)}`); has = true;
        const sweepFlag = (det > 0) === !ccw ? 1 : 0;
        const R = f(r * k);
        if (sw >= TAU - 1e-9) {
          const mid = ccw ? a1 - Math.PI : a1 + Math.PI; const [mx, my] = pAt(mid); const [ex, ey] = pAt(a1);
          d.push(`A${R} ${R} 0 0 ${sweepFlag} ${f(mx)} ${f(my)}`, `A${R} ${R} 0 0 ${sweepFlag} ${f(ex)} ${f(ey)}`);
        } else { const end = ccw ? a1 - sw : a1 + sw; const [ex, ey] = pAt(end); d.push(`A${R} ${R} 0 ${sw > Math.PI ? 1 : 0} ${sweepFlag} ${f(ex)} ${f(ey)}`); }
      }
    }
    return d.join('');
  }
  function emit(p, mode, rule) {
    const d = pathD(p); if (!d) return;
    if (mode === 'stroke') {
      const k = scl(), lw = Math.max(0.05, ctx.lineWidth * k);
      const dash = ctx._dash && ctx._dash.length ? ` stroke-dasharray="${ctx._dash.map((v) => f(v * k)).join(' ')}"` : '';
      out.push(`<path d="${d}" fill="none" stroke="${ctx.strokeStyle}" stroke-width="${f(lw)}"${dash}${op()}${cl()}/>`);
    } else out.push(`<path d="${d}" fill="${ctx.fillStyle}" fill-rule="${rule === 'evenodd' ? 'evenodd' : 'nonzero'}"${op()}${cl()}/>`);
  }
  return ctx;
}
