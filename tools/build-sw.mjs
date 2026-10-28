// Genera sw.js con la lista de archivos de la aplicación (ejecutar tras cambiar archivos: node tools/build-sw.mjs)
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const files = [];
const walk = (d) => { for (const f of fs.readdirSync(path.join(root, d))) { const rel = path.posix.join(d, f); const st = fs.statSync(path.join(root, rel)); if (st.isDirectory()) walk(rel); else if (!/\.(md|txt|map)$/i.test(f) && !rel.startsWith('tests') && !rel.startsWith('tools') && !rel.startsWith('supabase')) files.push(rel); } };
for (const d of ['js', 'css', 'img', 'vendor']) walk(d);
files.push('index.html', 'manifest.webmanifest');
const hash = crypto.createHash('sha1'); for (const f of files.sort()) hash.update(f + fs.statSync(path.join(root, f)).size + fs.statSync(path.join(root, f)).mtimeMs);
const ver = hash.digest('hex').slice(0, 10);
const sw = `// Service worker de WebCAD Libre (generado por tools/build-sw.mjs): funciona sin conexión.
const CACHE = 'webcad-${ver}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 0)};
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('webcad-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // primero la caché; en segundo plano se actualiza desde la red
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
`;
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(`sw.js: ${files.length} archivos, caché ${ver}`);
