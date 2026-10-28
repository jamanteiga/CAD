// Colaboración: nube (NUBE, GUARDARNUBE, ABRIRNUBE, VERSIONES) y marcas de revisión (MARCA, MARCAS).
import { h } from '../ui/dom.js';
import { Doc } from '../core/document.js';
import { createCloud } from '../io/cloud.js';
import { Cancel } from './engine.js';
import { t, getLang } from '../core/i18n.js';

const need = (v) => { if (v == null) throw new Cancel(); return v; };

export function register(eng, app) {
  const R = (n, fn, o) => eng.register(n, fn, o);
  const doc = () => app.doc;
  const cloud = (app.cloud = createCloud(app));
  const when = (s) => new Date(s).toLocaleString(getLang() === 'en' ? 'en-GB' : 'es-ES');
  const fail = (e) => { app.log(t('Nube: {0}', e.message || String(e))); };

  // ---- configuración y sesión
  R('CLOUD', async () => {
    const s = app.settings.cloud ||= {};
    const url = h('input', { class: 'fld', type: 'text', value: s.url || '', placeholder: 'https://xxxx.supabase.co' });
    const key = h('input', { class: 'fld', type: 'password', value: s.key || '', placeholder: 'clave anon pública' });
    const email = h('input', { class: 'fld', type: 'email', value: s.email || '' });
    const pass = h('input', { class: 'fld', type: 'password', value: '' });
    const info = h('p', { class: 'hint' });
    const refresh = () => { info.textContent = cloud.user ? t('Sesión iniciada como {0}', cloud.user.email) : cloud.configured() ? t('Sin sesión iniciada') : t('La nube no está configurada.'); };
    try { if (cloud.configured()) await cloud.connect(); } catch (e) { fail(e); }
    refresh();
    const save = () => { s.url = url.value.trim(); s.key = key.value.trim(); s.email = email.value.trim(); app.saveSettings(); cloud.reset(); };
    const act = (fn) => async () => { try { save(); await fn(); } catch (e) { info.textContent = e.message; return; } refresh(); };
    await app.ui.dlg.open({ title: 'Nube (Supabase)', body: [
      h('p', { class: 'hint', text: 'Guarde dibujos en su propio proyecto de Supabase para trabajar en equipo, con historial de versiones y marcas de revisión. El esquema está en supabase/schema.sql.' }),
      h('div', { class: 'frm' }, h('label', { text: 'URL del proyecto' }), url, h('label', { text: 'Clave anon' }), key, h('label', { text: 'Correo' }), email, h('label', { text: 'Contraseña' }), pass),
      h('div', { class: 'row' },
        h('button', { class: 'btn pri', type: 'button', text: 'Iniciar sesión', onclick: act(() => cloud.signIn(email.value.trim(), pass.value)) }),
        h('button', { class: 'btn', type: 'button', text: 'Crear cuenta', onclick: act(() => cloud.signUp(email.value.trim(), pass.value)) }),
        h('button', { class: 'btn', type: 'button', text: 'Enlace por correo', onclick: act(async () => { await cloud.magicLink(email.value.trim()); info.textContent = t('Revise su correo.'); }) }),
        h('button', { class: 'btn', type: 'button', text: 'Cerrar sesión', onclick: act(() => cloud.signOut()) })),
      info], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
    save();
  }, { alias: ['NUBE'] });

  R('CLOUDSAVE', async (c) => {
    try {
      await cloud.connect(); if (!cloud.user) { c.print('Inicie sesión en la nube (NUBE).'); return; }
      const d = doc();
      const r = await app.ui.dlg.form('Guardar en la nube', [{ k: 'name', l: 'Nombre', v: d.name }, { k: 'comment', l: 'Comentario de la versión', v: '' }, { k: 'team', l: 'Compartir con el equipo', v: !!d._cloudTeam, t: 'check' }]);
      if (!r) return;
      d.name = r.name || d.name; d._cloudTeam = r.team;
      const v = await cloud.save(d, r.comment, r.team);
      d.modified = false; app.ui.setTitle();
      // marcas locales aún no subidas
      for (const m of d.markups || []) if (!m.cid) { const row = await cloud.addMarkup(d._cloudId, m); m.cid = row.id; }
      app.log(t('Guardado en la nube: {0} (versión {1}).', d.name, v));
    } catch (e) { fail(e); }
  }, { alias: ['GUARDARNUBE'] });

  const openRow = async (row, data) => {
    const d = new Doc(); d.load(data || row.data); d.name = row.name; d._cloudId = row.id; d._cloudVer = row.version; d._cloudTeam = row.team; d.modified = false;
    try { d.markups = (await cloud.markups(row.id)).map((m) => ({ cid: m.id, x: m.x, y: m.y, space: m.space, text: m.text, author: m.author_name, resolved: m.resolved, t: m.created_at })); } catch (_) { /* sin marcas */ }
    app.addDoc(d); app.view.zoomExtents?.();
  };
  R('CLOUDOPEN', async (c) => {
    try {
      await cloud.connect(); if (!cloud.user) { c.print('Inicie sesión en la nube (NUBE).'); return; }
      const rows = await cloud.list();
      if (!rows.length) { c.print('No hay dibujos en la nube.'); return; }
      let sel = null;
      const list = h('div', { class: 'list', style: { minWidth: 'min(520px, 86vw)', maxHeight: '50vh' } }, rows.map((r) => { const el = h('div', { class: 'li', onclick: () => { sel = r; list.querySelectorAll('.li').forEach((x) => x.classList.remove('on')); el.classList.add('on'); } }, h('b', { text: r.name }), h('small', { class: 'hint', text: `v${r.version} · ${when(r.updated_at)}${r.team ? ' · ' + t('equipo') : ''}` })); return el; }));
      const ok = await app.ui.dlg.open({ title: 'Abrir desde la nube', body: [list], onOk: () => sel });
      if (!ok) return;
      await openRow(await cloud.load(ok.id));
    } catch (e) { fail(e); }
  }, { alias: ['ABRIRNUBE'] });

  R('CLOUDVERSIONS', async (c) => {
    try {
      const d = doc(); if (!d._cloudId) { c.print('El dibujo no está en la nube.'); return; }
      const vs = await cloud.versions(d._cloudId);
      let sel = null;
      const list = h('div', { class: 'list', style: { minWidth: 'min(520px, 86vw)', maxHeight: '50vh' } }, vs.map((v) => { const el = h('div', { class: 'li', onclick: () => { sel = v; list.querySelectorAll('.li').forEach((x) => x.classList.remove('on')); el.classList.add('on'); } }, h('b', { text: `v${v.version}` }), h('span', { text: v.comment || '' }), h('small', { class: 'hint', text: when(v.created_at) })); return el; }));
      const ok = await app.ui.dlg.open({ title: 'Historial de versiones', body: [h('p', { class: 'hint', text: 'Al abrir una versión anterior se crea una pestaña nueva; guárdela en la nube para convertirla en la versión actual.' }), list], onOk: () => sel });
      if (!ok) return;
      const v = await cloud.version(ok.id);
      await openRow({ id: d._cloudId, name: d.name.replace(/(\.\w+)?$/, ` (v${v.version})$1`), version: v.version, team: d._cloudTeam }, v.data);
    } catch (e) { fail(e); }
  }, { alias: ['VERSIONES'] });

  // ---- marcas de revisión (también sin nube: se guardan en el dibujo)
  R('MARKUP', async (c) => {
    const d = doc();
    const p = need(await c.getPoint('Specify markup location:'));
    const text = await app.ui.dlg.prompt('Marca de revisión', 'Comentario:', '');
    if (!text) return;
    const m = { id: Math.random().toString(36).slice(2), x: p.x, y: p.y, space: d.active, text, author: cloud.user?.email || app.settings.cloud?.email || '', resolved: false, t: new Date().toISOString() };
    d.begin('MARKUP'); d.touchTables(); (d.markups ||= []).push(m); d.end();
    if (d._cloudId && cloud.user) { try { const row = await cloud.addMarkup(d._cloudId, m); m.cid = row.id; } catch (e) { fail(e); } }
    app.view.redraw();
  }, { alias: ['MARCA', 'COMENTARIO'] });
  R('MARKUPS', async () => {
    const d = doc();
    if (d._cloudId && cloud.user) { try { const rows = await cloud.markups(d._cloudId); const known = new Set(d.markups.map((m) => m.cid).filter(Boolean)); for (const r of rows) if (!known.has(r.id)) d.markups.push({ cid: r.id, x: r.x, y: r.y, space: r.space, text: r.text, author: r.author_name, resolved: r.resolved, t: r.created_at }); else { const m = d.markups.find((x) => x.cid === r.id); if (m) m.resolved = r.resolved; } } catch (e) { fail(e); } }
    const list = h('div', { style: { minWidth: 'min(560px, 88vw)', maxHeight: '55vh', overflow: 'auto' } });
    const render = () => {
      list.replaceChildren(...(d.markups.length ? d.markups.map((m, i) => h('div', { class: 'row', style: { justifyContent: 'space-between', borderBottom: '1px solid var(--border)', padding: '6px 0', opacity: m.resolved ? 0.55 : 1 } },
        h('div', {}, h('b', { text: `#${i + 1} ` }), m.text, h('div', { class: 'hint', text: `${m.author || ''} · ${m.t ? when(m.t) : ''} · ${m.space === 'Model' ? t('Modelo') : m.space}` })),
        h('div', { class: 'row' },
          h('button', { class: 'btn', type: 'button', text: 'Ir', onclick: () => { if (m.space && m.space !== d.active) app.setLayout(m.space); app.view.setCur({ ...app.view.cur, cx: m.x, cy: m.y }); app.view.redraw(); } }),
          h('button', { class: 'btn', type: 'button', text: m.resolved ? 'Reabrir' : 'Resolver', onclick: async () => { d.begin('MARKUP'); d.touchTables(); m.resolved = !m.resolved; d.end(); if (m.cid && cloud.user) { try { await cloud.resolveMarkup(m.cid, m.resolved); } catch (e) { fail(e); } } render(); app.view.redraw(); } })))) : [h('p', { class: 'hint', text: 'No hay marcas de revisión. Use MARCA para añadir una.' })]));
    };
    render();
    await app.ui.dlg.open({ title: 'Marcas de revisión', body: [list], buttons: [{ t: 'Cerrar', v: true, pri: true }] });
  }, { alias: ['MARCAS'] });

  // chinchetas en pantalla
  app.drawMarkups = (cx, view, dark) => {
    const d = doc(); if (!d.markups?.length || app.settings.showMarkups === false) return;
    const r = view.dpr;
    cx.save(); cx.font = `600 ${11 * r}px Barlow, system-ui, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    d.markups.forEach((m, i) => {
      if ((m.space || 'Model') !== (d.mspace ? 'Model' : d.active)) return;
      const s = view.toScreen(m), x = s.x * r, y = s.y * r;
      cx.fillStyle = m.resolved ? (dark ? '#4b5b60' : '#a9b6b8') : '#e8833a';
      cx.beginPath(); cx.arc(x, y - 14 * r, 9 * r, 0, Math.PI * 2); cx.fill();
      cx.beginPath(); cx.moveTo(x - 5 * r, y - 9 * r); cx.lineTo(x, y); cx.lineTo(x + 5 * r, y - 9 * r); cx.fill();
      cx.fillStyle = '#fff'; cx.fillText(String(i + 1), x, y - 14 * r);
    });
    cx.restore();
  };
}
