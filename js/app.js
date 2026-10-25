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
  theme: 'dark', bgModel: '#212830', bgPaper: '#ffffff', bgLayoutOut: '#8c8c8c', crosshair: 100,
  screenMenu: false, menuBar: false, ribbon: true, toolbarsR12: false, ribbonMin: false,
  aliases: {}, shortcuts: {}, startupLisp: [], recent: [], autocomplete: true, gripSize: 6, pickbox: 4,
  cmdlineLines: 3, fileTabs: true, layoutTabs: true, statusBar: true, ucsIcon: true, gridStyle: 'lines',
};
export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { s = {}; }
  return { ...structuredClone(DEFAULT_SETTINGS), ...s };
}
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(app.settings)); } catch (_) { /* almacenamiento no disponible */ }
}
