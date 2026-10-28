// Miniaturas de bloques y patrones
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import { drawEnts } from '../view/renderer.js';

export function drawThumb(cv, ents, doc, { bg = '#212830', dark = true, pad = 0.1 } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || cv.width, H = cv.clientHeight || cv.height;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cv.width, cv.height);
  const bb = G.bbNew(); let any = false;
  for (const e of ents) { const b = E.entBBox(e, doc); if (G.bbValid(b)) { G.bbUnion(bb, b); any = true; } }
  if (!any) return;
  const w = Math.max(bb.x2 - bb.x1, 1e-6), h = Math.max(bb.y2 - bb.y1, 1e-6);
  const s = Math.min(W * (1 - 2 * pad) / w, H * (1 - 2 * pad) / h) * dpr;
  const cx = (bb.x1 + bb.x2) / 2, cy = (bb.y1 + bb.y2) / 2;
  ctx.setTransform(s, 0, 0, -s, cv.width / 2 - cx * s, cv.height / 2 + cy * s);
  drawEnts(ctx, ents, doc, { px: s, bgDark: dark, bg, viewBB: null });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export function hatchSwatch(cv, pattern, doc) {
  const sq = [{ x: 0, y: 0, b: 0 }, { x: 20, y: 0, b: 0 }, { x: 20, y: 16, b: 0 }, { x: 0, y: 16, b: 0 }];
  const e = { type: 'HATCH', loops: [sq], pattern, scale: 0.7, angle: 0, solid: pattern === 'SOLID', color: 250, layer: '0' };
  drawThumb(cv, [e], doc, { bg: '#ffffff', dark: false, pad: 0 });
}
