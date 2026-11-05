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
  theme: 'light', lang: 'es', bgModel: '#ffffff', bgPaper: '#ffffff', bgLayoutOut: '#c8ccd2', crosshair: 100, uiVersion: 4,
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
  if (!THEMES[r.theme]) r.theme = 'light';
  if ((s.uiVersion || 1) < 2) { // tema claro por defecto con sus fondos
    Object.assign(r, { theme: 'light', bgModel: THEMES.light.model, bgLayoutOut: THEMES.light.out });
  }
  if ((s.uiVersion || 1) < 3) Object.assign(r, { crosshair: 100, ribbon: true }); // vuelta a la disposición clásica
  if ((s.uiVersion || 1) < 4) { // colores del entorno de referencia: fondos por defecto del tema actual
    const th = THEMES[r.theme] || THEMES.light;
    if (OLD_BG.includes(r.bgModel)) r.bgModel = th.model;
    if (OLD_BG.includes(r.bgLayoutOut)) r.bgLayoutOut = th.out;
    r.uiVersion = 4;
  }
  return r;
}
// Fondos de dibujo por defecto de cada tema (el usuario puede cambiarlos en Opciones)
export const THEMES = {
  dark: { model: '#212830', out: '#8a8a8a', bedit: '#2b3340', meta: '#222933' },
  mid: { model: '#2b3340', out: '#8a8a8a', bedit: '#353e4c', meta: '#4a5262' },
  light: { model: '#ffffff', out: '#c8ccd2', bedit: '#f0f2f5', meta: '#f3f4f6' },
};
const OLD_BG = ['#1b2226', '#2b3235', '#fbfdfd', '#212830', '#5a6468', '#737d81', '#c6cfd0', '#8c8c8c'];
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(app.settings)); } catch (_) { /* almacenamiento no disponible */ }
}
