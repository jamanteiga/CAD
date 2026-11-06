// v8 — lectura DWG en un hilo aparte (Web Worker de módulo): la interfaz no se bloquea con archivos grandes.
// Recibe { buf, base } y devuelve { db } (la base de datos convertida por libredwg-web) o { error }.
const VER = '0.7.15';
const SOURCES = [
  { js: './vendor/libredwg/dist/libredwg-web.js', wasm: './vendor/libredwg/wasm' },
  { js: `https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@${VER}/dist/libredwg-web.js`, wasm: `https://cdn.jsdelivr.net/npm/@mlightcad/libredwg-web@${VER}/wasm` },
];
let lib = null;
async function load(base) {
  if (lib) return lib;
  let last;
  for (const s of SOURCES) {
    try { const mod = await import(new URL(s.js, base).href); const inst = await mod.LibreDwg.create(new URL(s.wasm, base).href); return (lib = { mod, inst }); } catch (e) { last = e; }
  }
  throw new Error('No se pudo cargar libredwg-web: ' + (last?.message || last));
}
self.onmessage = async (ev) => {
  const { buf, base, id } = ev.data;
  try {
    const { mod, inst } = await load(base);
    const ptr = inst.dwg_read_data(buf, mod.Dwg_File_Type.DWG);
    if (ptr == null) throw new Error('El archivo DWG no se pudo leer (versión no soportada o archivo dañado).');
    let db; try { db = inst.convert(ptr); } finally { try { inst.dwg_free(ptr); } catch (_) { /* nada */ } }
    self.postMessage({ id, db });
  } catch (e) { self.postMessage({ id, error: e.message || String(e) }); }
};
