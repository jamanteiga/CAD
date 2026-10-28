// Editor Visual LISP (editor + consola)
import { h, draggable } from './dom.js';
import { icon } from './icons.js';
import { show } from '../lisp/lisp.js';

const SAMPLE = `;;; Ejemplo: dibuja una brida con N agujeros
;;; Comando: BRIDA
(defun c:brida (/ c re ri n rb a i)
  (setq c  (getpoint "\\nCentro de la brida: ")
        re (getdist c "\\nRadio exterior <100>: "))
  (if (not re) (setq re 100.0))
  (initget 6)
  (setq n (getint "\\nNúmero de agujeros <8>: "))
  (if (not n) (setq n 8))
  (setq ri (* re 0.5) rb (* re 0.75))
  (command "_.circle" c re)
  (command "_.circle" c ri)
  (setq i 0)
  (repeat n
    (setq a (/ (* 2 pi i) n))
    (command "_.circle" (polar c a rb) (* re 0.06))
    (setq i (1+ i)))
  (princ (strcat "\\nBrida creada con " (itoa n) " agujeros."))
  (princ))
`;

export function createVlide(app) {
  const host = document.getElementById('host');
  let pal = null, code, con, inp, fname = 'sinnombre.lsp';
  const V = {};
  const out = (s) => { con.textContent += s + '\n'; con.scrollTop = con.scrollHeight; };
  V.rebuild = () => { if (!pal) return; try { localStorage.setItem('webcad.vlide', code.value); } catch (_) { /* sin almacenamiento */ } const vis = !pal.hidden; pal.remove(); pal = null; if (vis) V.show(); };
  V.show = () => {
    if (pal) { pal.hidden = false; code.focus(); return; }
    code = h('textarea', { id: 'vlcode', spellcheck: false });
    try { code.value = localStorage.getItem('webcad.vlide') || SAMPLE; } catch (_) { code.value = SAMPLE; }
    con = h('div', { id: 'vlcon', text: '_$ Consola de Visual LISP — escriba expresiones abajo.\n' });
    inp = h('input', { id: 'vlin', placeholder: '_$ (+ 1 2)', autocomplete: 'off' });
    const btn = (label, ic, fn) => h('button', { class: 'sm', type: 'button', title: label, onclick: fn }, h('span', { class: 'ico', html: icon(ic) }), label);
    const bar = h('div', { class: 'ltool' },
      btn('Nuevo', 'new', () => { code.value = ''; fname = 'sinnombre.lsp'; }),
      btn('Abrir', 'open', async () => { const f = await app.io.pickFile('.lsp,.txt,.mnl'); if (!f) return; code.value = await f.text(); fname = f.name; app.lisp.addFile(f.name, code.value); }),
      btn('Guardar', 'save', () => app.io.deliver(fname.endsWith('.lsp') ? fname + '.txt' : fname, code.value, 'text/plain')),
      btn('Cargar ventana activa', 'appload', async () => { app.lisp.addFile(fname, code.value); const r = await app.lisp.loadText(code.value, fname); out(`; ${fname} cargado${r !== undefined ? ' → ' + show(r) : ''}`); }),
      btn('Comprobar paréntesis', 'audit', () => { let n = 0, q = false, line = 1, bad = 0; for (const ch of code.value) { if (ch === '\n') line++; if (ch === '"') q = !q; else if (!q && ch === '(') n++; else if (!q && ch === ')') { n--; if (n < 0 && !bad) bad = line; } } out(n === 0 && !bad ? '; Paréntesis equilibrados.' : `; Desequilibrio: ${n > 0 ? n + ' sin cerrar' : 'sobra ")" en línea ' + bad}`); }));
    pal = h('div', { class: 'palette', id: 'vlide', style: { right: '20px', top: '30px' } },
      h('div', { class: 'pal-h' }, 'Visual LISP para WebCAD', h('span', { class: 'sp' }), h('button', { class: 'tbtn', title: 'Cerrar', html: icon('close'), onclick: () => { pal.hidden = true; } })),
      bar, h('div', { class: 'pal-b' }, code, con, inp));
    host.append(pal); draggable(pal, pal.querySelector('.pal-h'));
    code.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Tab') { e.preventDefault(); code.setRangeText('  ', code.selectionStart, code.selectionEnd, 'end'); } });
    code.addEventListener('input', () => { try { localStorage.setItem('webcad.vlide', code.value); } catch (_) { /* nada */ } });
    const hist = []; let hp = -1;
    inp.addEventListener('keydown', async (e) => {
      e.stopPropagation();
      if (e.key === 'ArrowUp' && hist.length) { hp = hp < 0 ? hist.length - 1 : Math.max(0, hp - 1); inp.value = hist[hp]; return; }
      if (e.key !== 'Enter') return;
      const t = inp.value.trim(); if (!t) return;
      hist.push(t); hp = -1; inp.value = '';
      out('_$ ' + t);
      const orig = app.log; const buf = [];
      app.log = (s) => { buf.push(s); orig(s); };
      try { const r = await app.lisp.guarded(() => app.lisp.evalString(t)); if (buf.length) out(buf.join('\n')); if (r !== undefined) out(show(r)); }
      finally { app.log = orig; }
    });
    code.focus();
  };
  return V;
}
