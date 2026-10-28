// Contenedor global de la aplicación (se rellena en main.js)
export const app = {
  doc: null, view: null, cmd: null, ui: null, lisp: null,
  settings: null,
  clip: null, // portapapeles interno
  log(msg) { app.ui?.cmdline?.print(msg); },
};
export default app;

// Preferencias de usuario (por navegador)
const KEY = 'webcad.settings.v1';
export const DEFAULT_SETTINGS = {
  theme: 'dark', lang: 'es', bgModel: '#1b2226', bgPaper: '#ffffff', bgLayoutOut: '#5a6468', crosshair: 100,
  screenMenu: false, menuBar: false, ribbon: true, toolbarsR12: false, ribbonMin: false,
  aliases: {}, shortcuts: {}, startupLisp: [], recent: [], autocomplete: true, gripSize: 6, pickbox: 4,
  cmdlineLines: 3, fileTabs: true, layoutTabs: true, statusBar: true, ucsIcon: true, gridStyle: 'lines',
};
export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { s = {}; }
  const r = { ...structuredClone(DEFAULT_SETTINGS), ...s };
  if (r.bgModel === '#212830') r.bgModel = THEMES.dark.model; // valores de versiones anteriores
  if (r.bgLayoutOut === '#8c8c8c') r.bgLayoutOut = THEMES.dark.out;
  if (!THEMES[r.theme]) r.theme = 'dark';
  return r;
}
// Fondos de dibujo por defecto de cada tema (el usuario puede cambiarlos en Opciones)
export const THEMES = {
  dark: { model: '#1b2226', out: '#5a6468', bedit: '#263034', meta: '#161c1f' },
  mid: { model: '#2b3235', out: '#737d81', bedit: '#353d41', meta: '#444b4f' },
  light: { model: '#fbfdfd', out: '#c6cfd0', bedit: '#eef3f3', meta: '#f3f6f6' },
};
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(app.settings)); } catch (_) { /* almacenamiento no disponible */ }
}
