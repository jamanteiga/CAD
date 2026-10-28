// Índice espacial en rejilla uniforme: acelera designación, referencias a objetos y dibujo con zoom.
import * as G from './geom.js';
import { entBBox } from './entities.js';

export class GridIndex {
  constructor(ents, doc) {
    this.ents = ents; this.always = []; this.cells = new Map();
    const boxes = new Array(ents.length);
    const all = G.bbNew(); let n = 0;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.type === 'XLINE' || e.type === 'RAY') { this.always.push(i); continue; }
      const b = entBBox(e, doc);
      if (!G.bbValid(b) || !isFinite(b.x1)) { this.always.push(i); continue; }
      boxes[i] = b; G.bbUnion(all, b); n++;
    }
    const W = Math.max(all.x2 - all.x1, 1e-9), H = Math.max(all.y2 - all.y1, 1e-9);
    this.s = Math.max(Math.sqrt((W * H) / Math.max(n, 1)) * 2, 1e-6); // ~0,5 objetos por celda
    this.x0 = all.x1; this.y0 = all.y1;
    for (let i = 0; i < ents.length; i++) {
      const b = boxes[i]; if (!b) continue;
      const i0 = Math.floor((b.x1 - this.x0) / this.s), i1 = Math.floor((b.x2 - this.x0) / this.s), j0 = Math.floor((b.y1 - this.y0) / this.s), j1 = Math.floor((b.y2 - this.y0) / this.s);
      if ((i1 - i0 + 1) * (j1 - j0 + 1) > 256) { this.always.push(i); continue; }
      for (let x = i0; x <= i1; x++) for (let y = j0; y <= j1; y++) { const k = x * 73856093 ^ y * 19349663; let c = this.cells.get(k); if (!c) this.cells.set(k, (c = [])); c.push(i); }
    }
  }
  // entidades cuya caja toca bb, en el orden del dibujo
  query(bb) {
    const i0 = Math.floor((bb.x1 - this.x0) / this.s), i1 = Math.floor((bb.x2 - this.x0) / this.s), j0 = Math.floor((bb.y1 - this.y0) / this.s), j1 = Math.floor((bb.y2 - this.y0) / this.s);
    if ((i1 - i0 + 1) * (j1 - j0 + 1) > this.cells.size * 2) return this.ents; // vista muy amplia: todo
    const set = new Set(this.always);
    for (let x = i0; x <= i1; x++) for (let y = j0; y <= j1; y++) { const c = this.cells.get(x * 73856093 ^ y * 19349663); if (c) for (const i of c) set.add(i); }
    return [...set].sort((a, b) => a - b).map((i) => this.ents[i]);
  }
}
