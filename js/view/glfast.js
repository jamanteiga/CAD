// v8 — dibujo acelerado con WebGL para modelos grandes (WEBGLMODE). Las curvas de trazo continuo se
// envían a la GPU como segmentos (búfer guardado mientras el dibujo no cambie); textos, sombreados,
// imágenes, líneas con tipo de línea o grosor visible y transparencias siguen dibujándose en 2D.
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { resolveStyle, layerVisible, drawEnts } from './renderer.js';

const GL_TYPES = new Set(['LINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'ELLIPSE', 'SPLINE', 'POINT', 'INSERT', 'LEADER', 'SOLID', '3DFACE', 'XLINE', 'RAY']);
const cssCache = new Map();
let cssCtx = null;
export function cssRGB(css) {
  let v = cssCache.get(css); if (v) return v;
  let m = /^#([0-9a-f]{6})$/i.exec(css || '');
  if (m) v = [parseInt(m[1].slice(0, 2), 16) / 255, parseInt(m[1].slice(2, 4), 16) / 255, parseInt(m[1].slice(4, 6), 16) / 255];
  else if ((m = /^#([0-9a-f]{3})$/i.exec(css || ''))) v = [...m[1]].map((c) => parseInt(c + c, 16) / 255);
  else if ((m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(css || ''))) v = [m[1] / 255, m[2] / 255, m[3] / 255];
  else if (typeof document !== 'undefined') { cssCtx ||= document.createElement('canvas').getContext('2d'); cssCtx.fillStyle = '#000'; cssCtx.fillStyle = css; v = cssRGB(cssCtx.fillStyle === css ? '#ffffff' : cssCtx.fillStyle); }
  else v = [1, 1, 1];
  cssCache.set(css, v); return v;
}
// ¿se puede dibujar este objeto como segmentos simples sin perder aspecto?
function glable(e, doc, st) {
  if (!GL_TYPES.has(e.type)) return false;
  if (e.transp > 0) return false;
  const s = resolveStyle(e, doc, st);
  const lt = doc.ltypes[s.lt];
  if (lt?.pat?.length) return false;
  if (st.lwdisplay && s.lw > 25) return false;
  if (e.type === 'LWPOLYLINE' && (e.cw || e.pts?.some((p) => p.sw || p.ew))) return false;
  if (e.type === 'INSERT') { const b = doc.blocks[e.name]; if (!b || b.ents.some((x) => x.type === 'HATCH' || x.type === 'TEXT' || x.type === 'MTEXT' || x.type === 'ATTDEF' || x.type === 'IMAGE' || x.type === 'WIPEOUT')) return false; if (e.attribs?.length) return false; }
  return true;
}
// Construye los segmentos (x1,y1,x2,y2) y colores (r,g,b por vértice) para la lista de objetos
export function buildSegments(ents, doc, st) {
  let pos = new Float32Array(1 << 16), col = new Float32Array(3 << 15), n = 0;
  const rest = [];
  const grow = () => { const p = new Float32Array(pos.length * 2); p.set(pos); pos = p; const c = new Float32Array(col.length * 2); c.set(col); col = c; };
  const seg = (a, b, rgb) => { if (n * 4 + 4 > pos.length) grow(); pos[n * 4] = a.x; pos[n * 4 + 1] = a.y; pos[n * 4 + 2] = b.x; pos[n * 4 + 3] = b.y; col.set(rgb, n * 6); col.set(rgb, n * 6 + 3); n++; };
  const ox = st.origin?.x || 0, oy = st.origin?.y || 0;
  const P = (p) => ({ x: p.x - ox, y: p.y - oy });
  for (const e of ents) {
    if (!layerVisible(e, doc, st)) continue;
    if (!glable(e, doc, st)) { rest.push(e); continue; }
    const rgb = cssRGB(resolveStyle(e, doc, st).css);
    for (const p of E.prims(e, doc)) {
      if (p.k === 'L') { seg(P(p.a), P(p.b), rgb); continue; }
      const a1 = p.full ? 0 : p.a1, a2 = p.full ? G.TAU : p.a2;
      const sw = p.full ? G.TAU : G.arcSweep(a1, a2), k = Math.max(8, Math.min(128, Math.ceil(sw / G.TAU * 96)));
      let q = P(G.polar(p.c, a1, p.r));
      for (let i = 1; i <= k; i++) { const r = P(G.polar(p.c, a1 + sw * i / k, p.r)); seg(q, r, rgb); q = r; }
    }
  }
  return { pos: pos.subarray(0, n * 4), col: col.subarray(0, n * 6), n, rest };
}

const VS = 'attribute vec2 p;attribute vec3 c;uniform vec4 m;varying vec3 vc;void main(){gl_Position=vec4(p.x*m.x+m.z,p.y*m.y+m.w,0.,1.);vc=c;}';
const FS = 'precision mediump float;varying vec3 vc;void main(){gl_FragColor=vec4(vc,1.);}';
export class GLLayer {
  constructor() {
    this.cv = document.createElement('canvas');
    const gl = (this.gl = this.cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true }));
    if (!gl) throw new Error('WebGL no disponible');
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const pr = (this.pr = gl.createProgram()); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    this.bp = gl.createBuffer(); this.bc = gl.createBuffer(); this.uM = gl.getUniformLocation(pr, 'm'); this.aP = gl.getAttribLocation(pr, 'p'); this.aC = gl.getAttribLocation(pr, 'c');
    this.key = null; this.n = 0;
  }
  upload(data) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bp); gl.bufferData(gl.ARRAY_BUFFER, data.pos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bc); gl.bufferData(gl.ARRAY_BUFFER, data.col, gl.STATIC_DRAW);
    this.n = data.n;
  }
  draw(w, h, v, origin) {
    const gl = this.gl;
    if (this.cv.width !== w || this.cv.height !== h) { this.cv.width = w; this.cv.height = h; }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.pr);
    // mundo (relativo a origin) -> NDC; v = {cx, cy, s} en px CSS, w/h en px de dispositivo
    const r = w / v.W, sx = 2 * v.s * r / w, sy = 2 * v.s * r / h;
    gl.uniform4f(this.uM, sx, sy, (origin.x - v.cx) * sx, (origin.y - v.cy) * sy);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bp); gl.enableVertexAttribArray(this.aP); gl.vertexAttribPointer(this.aP, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bc); gl.enableVertexAttribArray(this.aC); gl.vertexAttribPointer(this.aC, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, this.n * 2);
  }
}

// Sustituye el dibujo del espacio modelo cuando hay muchos objetos
export function installGL(View, app) {
  const proto = View.prototype;
  if (proto._glInstalled) return; proto._glInstalled = true;
  const orig = proto.renderSingle;
  app.glStats = { active: false, segs: 0, rest: 0, ms: 0 };
  proto.renderSingle = function () {
    const d = this.doc, mode = d.vars.WEBGLMODE ?? 1, nEnts = d.model.length;
    const thr = app.settings.glThreshold || 20000;
    const want = !d.blockEdit && d.active === 'Model' && this._rt === undefined && !d.paperMode && (mode === 2 || (mode === 1 && nEnts >= thr));
    if (!want) { app.glStats.active = false; return orig.call(this); }
    if (!this._gl && !this._glFail) { try { this._gl = new GLLayer(); } catch (e) { this._glFail = true; app.log?.('WebGL: ' + e.message); } }
    if (!this._gl) { app.glStats.active = false; return orig.call(this); }
    const t0 = performance.now(), ctx = this.ctx, v = this.cur, gl = this._gl;
    const st = this.baseStyle(v); st.viewBB = null;
    const lstate = Object.values(d.layers).map((l) => `${l.on ? 1 : 0}${l.frozen ? 1 : 0}${l.color}`).join('');
    const key = `${d.rev}|${st.bgDark}|${st.lwdisplay}|${lstate.length}:${hash(lstate)}`;
    if (gl.key !== key) {
      const ext = d.extents(d.model);
      gl.origin = ext ? { x: (ext.x1 + ext.x2) / 2, y: (ext.y1 + ext.y2) / 2 } : { x: 0, y: 0 };
      const data = buildSegments(d.model, d, { ...st, origin: gl.origin });
      gl.upload(data); gl.rest = data.rest; gl.key = key;
      app.glStats.segs = data.n; app.glStats.rest = data.rest.length;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = this.bg(); ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    this.app.drawUnderlay?.(ctx, this, v);
    if (d.vars.GRIDMODE) this.drawGrid(ctx, v);
    gl.draw(this.cv.width, this.cv.height, { ...v, W: this.W }, gl.origin);
    ctx.drawImage(gl.cv, 0, 0);
    this.setWorld(ctx, v);
    const vb = this.worldBB(v);
    drawEnts(ctx, gl.rest.filter((e) => { const b = E.entBBox(e, d); return !G.bbValid(b) || G.bbOverlap(b, vb); }), d, this.baseStyle(v));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this._last = null;
    app.glStats.active = true; app.glStats.ms = performance.now() - t0;
  };
}
function hash(s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return x; }
