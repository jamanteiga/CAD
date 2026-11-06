// Conversión entre los datos extendidos guardados como texto LISP ((1000 . "a") (1040 . 1.5) (1010 1 2 0))
// y los pares de códigos DXF.
export function lispToPairs(s) {
  const out = []; let i = 0; s = String(s || '');
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const atom = () => {
    ws();
    if (s[i] === '"') { let j = i + 1, r = ''; while (j < s.length && s[j] !== '"') { if (s[j] === '\\' && j + 1 < s.length) { r += s[j + 1]; j += 2; continue; } r += s[j++]; } i = j + 1; return r; }
    const m = /^[^\s()]+/.exec(s.slice(i)); if (!m) return null; i += m[0].length; const n = Number(m[0]); return Number.isFinite(n) ? n : m[0];
  };
  ws(); if (s[i] !== '(') return out; i++;
  for (;;) {
    ws(); if (i >= s.length || s[i] === ')') break;
    if (s[i] !== '(') { atom(); continue; }
    i++; const code = atom(); ws();
    if (s[i] === '.') { i++; const v = atom(); out.push([code, v]); }
    else { const vals = []; while (i < s.length && s[i] !== ')') { ws(); if (s[i] === ')') break; vals.push(atom()); ws(); } out.push([code, vals]); }
    ws(); if (s[i] === ')') i++;
  }
  return out;
}
const q = (v) => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
export function pairsToLisp(pairs) {
  return '(' + pairs.map(([c, v]) => (Array.isArray(v) ? `(${c} ${v.join(' ')})` : `(${c} . ${typeof v === 'number' ? v : q(v)})`)).join(' ') + ')';
}
// valor DXF -> tipo según el código
export function xdValue(code, raw) {
  if (code >= 1010 && code <= 1013) return null; // puntos: se tratan aparte
  if ((code >= 1040 && code <= 1042) || code === 1070 || code === 1071) return +raw;
  return raw;
}
