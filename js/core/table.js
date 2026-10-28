// Tablas (TABLE): rejilla de celdas con texto. Geometría derivada: líneas + textos.
// e = { type:'TABLE', p:{x,y} (esquina superior izquierda), rot, cols:[anchos], rows:[altos], cells:[[texto]], th (altura de texto),
//       align: 'MC'|'ML'|'MR' o por columna [..], head: n filas de cabecera }
import * as G from './geom.js';

export function newTable(p, nr, nc, opts = {}) {
  const cw = opts.cw || 25, rh = opts.rh || 8;
  return { type: 'TABLE', p: { x: p.x, y: p.y }, rot: 0, cols: Array(nc).fill(cw), rows: Array(nr).fill(rh), cells: Array.from({ length: nr }, () => Array(nc).fill('')), th: opts.th || 2.5, align: opts.align || 'MC', head: opts.head ?? 1 };
}
export function tableEnts(e) {
  if (e._tbl) return e._tbl;
  const out = [], rot = e.rot || 0;
  const W = e.cols.reduce((a, b) => a + b, 0), H = e.rows.reduce((a, b) => a + b, 0);
  const T = (x, y) => G.add(e.p, G.rotate({ x, y }, { x: 0, y: 0 }, rot));
  const L = (x1, y1, x2, y2) => out.push({ type: 'LINE', p1: T(x1, y1), p2: T(x2, y2), layer: e.layer, color: 0 });
  let y = 0;
  L(0, 0, W, 0);
  e.rows.forEach((rh) => { y -= rh; L(0, y, W, y); });
  let x = 0;
  L(0, 0, 0, -H);
  e.cols.forEach((cw) => { x += cw; L(x, 0, x, -H); });
  y = 0;
  e.rows.forEach((rh, i) => {
    let cx = 0;
    e.cols.forEach((cw, j) => {
      const txt = String(e.cells?.[i]?.[j] ?? '');
      if (txt) {
        const al = Array.isArray(e.align) ? e.align[j] || 'MC' : e.align || 'MC';
        const head = i < (e.head || 0);
        const ht = Math.min(e.th * (head ? 1.2 : 1), rh * 0.7);
        const ax = al === 'ML' ? cx + ht * 0.6 : al === 'MR' ? cx + cw - ht * 0.6 : cx + cw / 2;
        const ha = al === 'ML' ? 0 : al === 'MR' ? 2 : 4; // TEXT: 0 izq, 2 der, 4 medio
        const ap = T(ax, y - rh / 2);
        out.push({ type: 'TEXT', p: ap, p2: ap, h: ht, text: txt, rot, ha, va: ha === 4 ? 0 : 2, style: e.style || 'Standard', layer: e.layer, color: 0 });
      }
      cx += cw;
    });
    y -= rh;
  });
  e._tbl = out;
  return out;
}
export function tableSize(e) { return { w: e.cols.reduce((a, b) => a + b, 0), h: e.rows.reduce((a, b) => a + b, 0) }; }
// celda bajo un punto
export function cellAt(e, p) {
  const q = G.rotate(G.sub(p, e.p), { x: 0, y: 0 }, -(e.rot || 0));
  let x = 0, c = -1; for (let j = 0; j < e.cols.length; j++) { if (q.x >= x && q.x <= x + e.cols[j]) { c = j; break; } x += e.cols[j]; }
  let y = 0, r = -1; for (let i = 0; i < e.rows.length; i++) { if (-q.y >= y && -q.y <= y + e.rows[i]) { r = i; break; } y += e.rows[i]; }
  return r >= 0 && c >= 0 ? { r, c } : null;
}
// CSV (separador ; o , detectado) <-> celdas
export function parseCSV(text) {
  const first = text.split(/\r?\n/)[0] || '';
  const sep = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : first.includes('\t') ? '\t' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; continue; }
    if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const n = Math.max(...rows.map((r) => r.length));
  return rows.filter((r) => r.some((x) => x !== '')).map((r) => [...r, ...Array(n - r.length).fill('')]);
}
export function toCSV(cells, sep = ';') {
  return cells.map((r) => r.map((v) => { const s = String(v ?? ''); return /[";\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(sep)).join('\r\n');
}
