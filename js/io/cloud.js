// Nube opcional con Supabase: dibujos compartidos, historial de versiones y marcas de revisión.
// La configuración (URL y clave pública «anon» del proyecto) se guarda en el navegador; el esquema está en supabase/schema.sql.
export function createCloud(app) {
  const C = { client: null, user: null };
  const cfg = () => app.settings.cloud || {};
  C.configured = () => !!(cfg().url && cfg().key);
  C.connect = async () => {
    if (C.client) return C.client;
    if (!C.configured()) throw new Error('La nube no está configurada (NUBE > Configurar).');
    if (!window.supabase) {
      try { await app.io.loadScript(new URL('./vendor/supabase/supabase.min.js', document.baseURI).href); }
      catch (_) { await app.io.loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'); }
    }
    C.client = window.supabase.createClient(cfg().url, cfg().key, { auth: { persistSession: true, storageKey: 'webcad.supabase' } });
    const { data } = await C.client.auth.getUser(); C.user = data?.user || null;
    return C.client;
  };
  C.reset = () => { C.client = null; C.user = null; };
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  C.signIn = async (email, password) => { const c = await C.connect(); const d = ok(await c.auth.signInWithPassword({ email, password })); C.user = d.user; return C.user; };
  C.signUp = async (email, password) => { const c = await C.connect(); const d = ok(await c.auth.signUp({ email, password })); C.user = d.user; return C.user; };
  C.magicLink = async (email) => { const c = await C.connect(); ok(await c.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href.split('#')[0] } })); };
  C.signOut = async () => { const c = await C.connect(); await c.auth.signOut(); C.user = null; };
  C.list = async () => { const c = await C.connect(); return ok(await c.from('webcad_drawings').select('id,name,version,updated_at,team,owner').order('updated_at', { ascending: false })); };
  C.save = async (doc, comment = '', team = false) => {
    const c = await C.connect(); if (!C.user) throw new Error('Inicie sesión en la nube.');
    const data = JSON.parse(doc.serialize());
    if (doc._cloudId) {
      const cur = ok(await c.from('webcad_drawings').select('version').eq('id', doc._cloudId).single());
      const version = (cur?.version || 0) + 1;
      ok(await c.from('webcad_drawings').update({ name: doc.name, data, version, updated_at: new Date().toISOString(), team }).eq('id', doc._cloudId));
      ok(await c.from('webcad_versions').insert({ drawing_id: doc._cloudId, version, data, comment }));
      doc._cloudVer = version; return version;
    }
    const row = ok(await c.from('webcad_drawings').insert({ name: doc.name, data, version: 1, team }).select('id').single());
    doc._cloudId = row.id; doc._cloudVer = 1;
    ok(await c.from('webcad_versions').insert({ drawing_id: row.id, version: 1, data, comment }));
    return 1;
  };
  C.load = async (id) => { const c = await C.connect(); return ok(await c.from('webcad_drawings').select('*').eq('id', id).single()); };
  C.versions = async (id) => { const c = await C.connect(); return ok(await c.from('webcad_versions').select('id,version,comment,created_at,author').eq('drawing_id', id).order('version', { ascending: false })); };
  C.version = async (vid) => { const c = await C.connect(); return ok(await c.from('webcad_versions').select('*').eq('id', vid).single()); };
  C.markups = async (id) => { const c = await C.connect(); return ok(await c.from('webcad_markups').select('*').eq('drawing_id', id).order('created_at')); };
  C.addMarkup = async (id, m) => { const c = await C.connect(); return ok(await c.from('webcad_markups').insert({ drawing_id: id, space: m.space, x: m.x, y: m.y, text: m.text, author_name: m.author }).select('*').single()); };
  C.resolveMarkup = async (mid, resolved) => { const c = await C.connect(); ok(await c.from('webcad_markups').update({ resolved }).eq('id', mid)); };
  return C;
}
