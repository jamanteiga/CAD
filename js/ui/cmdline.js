// Línea de comandos (historial, solicitud con opciones, autocompletado) y entrada dinámica
import { h } from './dom.js';
import { icon } from './icons.js';
import { fmt } from '../core/geom.js';
import { trMsg, norm, dispCmd, getLang, t as tr } from '../core/i18n.js';

export function createCmdline(app) {
  const root = document.getElementById('cmd');
  const hist = document.getElementById('cmdhist'), prompt = document.getElementById('cmdprompt'), inp = document.getElementById('cmdin'), ac = document.getElementById('ac');
  document.getElementById('cmdX').innerHTML = icon('close');
  document.getElementById('cmdCfg').innerHTML = icon('cmdline');
  document.getElementById('cmdX').onclick = () => { app.cmd.cancel(); inp.value = ''; };
  document.getElementById('cmdCfg').onclick = () => app.cmd.run('OPTIONS');
  const cl = {};
  let lines = [], curPrompt = '', histCmds = [], hpos = -1, acItems = [], acSel = -1;

  cl.print = (msg) => {
    const s = String(msg ?? '');
    for (const line of s.split('\n')) lines.push(trMsg(line));
    if (lines.length > 600) lines = lines.slice(-500);
    hist.textContent = lines.join('\n');
    hist.scrollTop = hist.scrollHeight;
  };
  cl.echoCommand = (name) => { cl.print(`Comando: ${name}`); };
  cl.setPrompt = (text, kws) => {
    text = String(text || '');
    const parts = text.split('\n');
    for (const p of parts.slice(0, -1)) cl.print(p);
    curPrompt = parts[parts.length - 1];
    renderPrompt(curPrompt, kws);
    updateAC();
    app.ui?.dyn?.update?.();
  };
  function renderPrompt(t, kws) {
    prompt.innerHTML = '';
    const idle = !app.cmd?.req && !app.cmd?.active;
    if (!t) { if (!idle) prompt.textContent = ''; inp.placeholder = idle ? tr('Escriba un comando') : ''; return; }
    inp.placeholder = '';
    const m = /^(.*?)\[([^\]]+)\](.*)$/.exec(t);
    if (!m || !kws?.length) { prompt.textContent = t + ' '; return; }
    prompt.append(m[1], '[');
    const names = m[2].split('/');
    names.forEach((n, i) => {
      const k = kws.find((x) => (x.es ?? x.name) === n.trim()) || kws.find((x) => x.name === n.trim()) || { name: n.trim() };
      prompt.append(h('span', { class: 'kw', text: n, onmousedown: (e) => { e.preventDefault(); cl.submit(k.es ? k.esKey : (k.key || k.name)); } }));
      if (i < names.length - 1) prompt.append('/');
    });
    prompt.append(']' + m[3] + ' ');
  }
  cl.value = () => inp.value;
  cl.focus = () => { if (!document.querySelector('.modal') && document.activeElement !== inp && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement !== document.body)) inp.focus({ preventScroll: true }); };
  cl.forceFocus = () => inp.focus({ preventScroll: true });
  cl.expand = (on) => { const v = on ?? !root.classList.contains('exp'); root.classList.toggle('exp', v); hist.scrollTop = hist.scrollHeight; };
  cl.submit = (text) => {
    const req = app.cmd.req;
    if (req || app.cmd.active) cl.print(`${curPrompt} ${text}`.trimEnd());
    else if (/^[(!]/.test(text.trim())) cl.print(`Comando: ${text}`);
    if (text && !req) { histCmds.push(text); if (histCmds.length > 100) histCmds.shift(); }
    hpos = -1; inp.value = ''; hideAC();
    app.cmd.submit(text);
  };

  // autocompletado
  function hideAC() { ac.hidden = true; acItems = []; acSel = -1; }
  function updateAC() {
    const t = norm(inp.value.trim());
    if (!app.settings.autocomplete || app.cmd.req || !t || /[^A-Z0-9_\-.'ÁÉÍÓÚÑÜ]/.test(t)) { hideAC(); return; }
    const eng = app.cmd, out = [];
    const aliases = { ...eng.aliases, ...(app.settings.aliases || {}) };
    // en pantalla, los comandos en el idioma activo; se encuentran tanto por su nombre traducido como por el inglés
    const loc = getLang() !== 'en';
    const names = Object.keys(eng.commands).map((n) => ({ en: n, d: loc ? dispCmd(n) : n }));
    const exact = names.find((x) => norm(x.d) === t) || (eng.commands[t] && names.find((x) => x.en === t));
    if (exact) out.push({ n: exact.d, d: '' });
    for (const [a, c] of Object.entries(aliases)) if (c && a === t) out.push({ n: a, d: dispCmd(c) });
    for (const x of names.filter((x) => norm(x.d).startsWith(t)).sort((p, q) => p.d.localeCompare(q.d))) out.push({ n: x.d, d: '' });
    if (loc) for (const x of names.filter((x) => x.en.startsWith(t) && !norm(x.d).startsWith(t)).sort((p, q) => p.d.localeCompare(q.d))) out.push({ n: x.d, d: '' });
    if (app.lisp) for (const k of app.lisp.g.keys()) if (k.startsWith('C:') && k.slice(2).startsWith(t)) out.push({ n: k.slice(2), d: 'LISP' });
    for (const [a, c] of Object.entries(aliases)) if (c && a.startsWith(t) && a !== t) out.push({ n: a, d: dispCmd(c) });
    for (const k of Object.keys(app.doc.vars)) if (k.startsWith(t)) out.push({ n: k, d: 'variable' });
    acItems = out.filter((x, i) => out.findIndex((y) => y.n === x.n) === i).slice(0, 14);
    if (!acItems.length) { hideAC(); return; }
    acSel = 0; renderAC();
  }
  function renderAC() {
    ac.innerHTML = '';
    acItems.forEach((it, i) => ac.append(h('div', { class: 'a' + (i === acSel ? ' on' : ''), onmousedown: (e) => { e.preventDefault(); inp.value = it.n; cl.submit(it.n); } }, h('span', { text: it.n }), h('small', { text: it.d }))));
    ac.hidden = false;
  }
  const parenOpen = (s) => { let n = 0, q = false; for (const c of s) { if (c === '"') q = !q; else if (!q && c === '(') n++; else if (!q && c === ')') n--; } return n > 0 || q; };
  inp.addEventListener('input', () => { updateAC(); app.view?.redrawOverlay(); app.ui?.dyn?.update?.(); });
  inp.addEventListener('keydown', (e) => {
    const req = app.cmd.req;
    if (e.key === 'Tab') { e.preventDefault(); if (acItems.length) { inp.value = acItems[Math.max(0, acSel)].n; hideAC(); } return; }
    if (e.key === 'ArrowDown' && !ac.hidden) { e.preventDefault(); acSel = (acSel + 1) % acItems.length; renderAC(); return; }
    if (e.key === 'ArrowUp' && !ac.hidden) { e.preventDefault(); acSel = (acSel - 1 + acItems.length) % acItems.length; renderAC(); return; }
    if (e.key === 'ArrowUp' && histCmds.length && !req) { e.preventDefault(); hpos = hpos < 0 ? histCmds.length - 1 : Math.max(0, hpos - 1); inp.value = histCmds[hpos]; return; }
    if (e.key === 'ArrowDown' && hpos >= 0 && !req) { e.preventDefault(); hpos++; inp.value = hpos < histCmds.length ? histCmds[hpos] : ''; if (hpos >= histCmds.length) hpos = -1; return; }
    if (e.key === 'Enter' || (e.key === ' ' && !(req && req.kind === 'string' && req.spaces) && !parenOpen(inp.value) && !(app.cmd.gripDrag))) {
      e.preventDefault();
      if (!ac.hidden && acSel >= 0 && acItems[acSel] && !req && inp.value.trim().toUpperCase() !== acItems[acSel].n) inp.value = acItems[acSel].n;
      if (e.key === ' ' && app.cmd.gripDrag) return;
      cl.submit(inp.value);
      return;
    }
    if (e.key === ' ' && app.cmd.gripDrag && !inp.value) { e.preventDefault(); app.cmd.cycleGripMode(); }
  });
  inp.addEventListener('blur', () => setTimeout(hideAC, 150));
  cl.setPrompt('');
  return cl;
}

// entrada dinámica junto al cursor
export function createDyn(app) {
  const el = document.getElementById('dyn');
  return {
    update() {
      const v = app.view, eng = app.cmd;
      if (!app.doc.vars.DYNMODE || !v.mouse.in || (!eng.req && !eng.gripDrag)) { el.hidden = true; return; }
      const req = eng.req;
      let t = req ? (req.display ?? req.prompt ?? '').split('\n').pop().replace(/\s*\[.*\]/, '').replace(/<.*>/, '').replace(/:\s*$/, '') : tr('** ESTIRAR **');
      const typed = app.ui.cmdline.value();
      let val = typed;
      if (!val && req?.wantsPoint) {
        const p = v.snapped;
        if (req.base) { const dx = p.x - req.base.x, dy = p.y - req.base.y; val = `${fmt(Math.hypot(dx, dy), 3)} < ${fmt((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, 1)}°`; }
        else val = `${fmt(p.x, 3)}, ${fmt(p.y, 3)}`;
      }
      el.innerHTML = '';
      el.append(t || '', val ? Object.assign(document.createElement('span'), { className: 'v', textContent: val }) : '');
      el.style.left = Math.min(v.mouse.x + 22, v.W - el.offsetWidth - 4) + 'px';
      el.style.top = Math.min(v.mouse.y + 22, v.H - 30) + 'px';
      el.hidden = false;
    },
  };
}
