// Productividad: grupos, edición de matrices asociativas desde la paleta y utilidades.
import { Cancel } from './engine.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;

  // ---- grupos (PICKSTYLE 1: al designar un miembro se designa el grupo entero; Ctrl+Mayús+A conmuta)
  const groupsOf = (e) => Object.entries(doc().groups || {}).filter(([, g]) => g.hids?.includes(e.hid));
  const uniqName = () => { let i = 1; while (doc().groups[`GRUPO${i}`]) i++; return `GRUPO${i}`; };
  R('GROUP', async (c) => {
    const d = doc();
    let name = await c.getString(`Enter group name or [?] <${uniqName()}>:`, { def: uniqName() });
    if (name === '?') { c.print(Object.entries(d.groups).map(([n, g]) => `${n}: ${g.hids.length} ${g.desc || ''}`).join('\n') || '0'); return; }
    name = String(name || uniqName()).toUpperCase();
    if (d.groups[name]) { c.print(`Group ${name} already exists.`); return; }
    const desc = await c.getString('Enter group description:', { spaces: true, def: '' });
    const pick = d.vars.PICKSTYLE; d.vars.PICKSTYLE = 0;
    let s; try { s = await c.select(); } finally { d.vars.PICKSTYLE = pick; }
    if (!s.length) return;
    d.begin('GROUP'); d.touchTables();
    d.groups[name] = { desc: desc || '', selectable: true, hids: s.map((e) => e.hid) };
    d.end();
    c.print(`Group "${name}" has been created.`);
  }, { alias: ['G', '-GROUP', 'CLASSICGROUP'] });
  R('UNGROUP', async (c) => {
    const d = doc();
    const s = await c.select(); if (!s.length) return;
    const names = new Set(); for (const e of s) for (const [n] of groupsOf(e)) names.add(n);
    if (!names.size) { c.print('Object is not a member of a group.'); return; }
    d.begin('UNGROUP'); d.touchTables(); for (const n of names) delete d.groups[n]; d.end();
    c.print(`Group ${[...names].join(', ')} exploded.`);
  });
  R('GROUPEDIT', async (c) => {
    const d = doc();
    const pick = d.vars.PICKSTYLE; d.vars.PICKSTYLE = 0;
    try {
      const r = need(await c.entsel('Select group:', { filter: (e) => groupsOf(e).length > 0 }));
      const [name, g] = groupsOf(r.e)[0];
      const k = await c.getKw('Enter an option [Add objects/Remove objects/REName] <Add objects>:', 'Add objects');
      d.begin('GROUPEDIT'); d.touchTables();
      if (k === 'Add objects') { const s = await c.select(); for (const e of s) if (!g.hids.includes(e.hid)) g.hids.push(e.hid); }
      else if (k === 'Remove objects') { const s = await c.select(); g.hids = g.hids.filter((h) => !s.some((e) => e.hid === h)); if (!g.hids.length) delete d.groups[name]; }
      else if (k === 'REName') { const nn = String(need(await c.getString(`Enter new name for group <${name}>:`, { def: name }))).toUpperCase(); if (nn && nn !== name) { d.groups[nn] = g; delete d.groups[name]; } }
      d.end();
    } finally { d.vars.PICKSTYLE = pick; }
  });
}
