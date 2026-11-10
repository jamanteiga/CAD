// Ratón 3D (3Dconnexion SpaceMouse y compatibles) mediante WebHID (Chrome y Edge de escritorio).
// Giro: inclinar = elevación, girar el tapón = acimut. Desplazar el tapón = encuadre; empujar/tirar = zoom.
import * as P3 from '../core/plane3d.js';

const FILTERS = [{ vendorId: 0x256f }, { vendorId: 0x046d, usagePage: 0x01, usage: 0x08 }, { usagePage: 0x01, usage: 0x08 }];

export function installSpaceMouse(app) {
  const st = { dev: null, t: [0, 0, 0], r: [0, 0, 0], raf: 0, last: 0 };
  const v = () => app.view;
  const i16 = (dv, o) => (o + 1 < dv.byteLength ? dv.getInt16(o, true) : 0);
  const onReport = (ev) => {
    const dv = ev.data, id = ev.reportId;
    if (id === 1) { st.t = [i16(dv, 0), i16(dv, 2), i16(dv, 4)]; if (dv.byteLength >= 12) st.r = [i16(dv, 6), i16(dv, 8), i16(dv, 10)]; }
    else if (id === 2) st.r = [i16(dv, 0), i16(dv, 2), i16(dv, 4)];
    else return;
    if (!st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(tick); }
  };
  const dead = (x) => (Math.abs(x) < 12 ? 0 : x);
  function tick(now) {
    const dt = Math.min(0.05, (now - st.last) / 1000); st.last = now;
    const [tx, ty, tz] = st.t.map(dead), [rx, , rz] = st.r.map(dead);
    const view = v(), d = app.doc;
    if (!view || !d || d.active !== 'Model' || d.blockEdit || ![tx, ty, tz, rx, rz].some(Boolean)) { st.raf = 0; return; }
    const k = (app.settings.mouse3dSpeed || 1) * dt;
    if (rx || rz) {
      const c = view.cam || P3.SWISO;
      view.setCam({ az: c.az + rz * k * 0.006, el: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, c.el - rx * k * 0.006)) });
    }
    if (tx || ty) view.panPx(-tx * k * 2.2, -ty * k * 2.2);
    if (tz) view.zoomAt(Math.exp(-tz * k * 0.006), view.W / 2, view.H / 2);
    view.updateCursor?.(); view.redrawOverlay();
    st.raf = requestAnimationFrame(tick);
  }
  const attach = async (dev) => {
    if (!dev.opened) await dev.open();
    st.dev = dev; dev.addEventListener('inputreport', onReport);
    app.log(`3D mouse connected: ${dev.productName || 'SpaceMouse'}.`);
  };
  app.spaceMouse = {
    supported: () => 'hid' in navigator,
    connect: async () => {
      if (!('hid' in navigator)) { app.log('This browser cannot read 3D mice (WebHID): use Chrome or Edge on a computer.'); return false; }
      try {
        const [dev] = await navigator.hid.requestDevice({ filters: FILTERS });
        if (!dev) return false;
        await attach(dev); return true;
      } catch (e) { app.log('3D mouse not available: ' + e.message); return false; }
    },
    get device() { return st.dev; },
  };
  // reconexión automática a un ratón 3D ya autorizado
  if ('hid' in navigator) navigator.hid.getDevices().then((ds) => { const d = ds.find((x) => x.vendorId === 0x256f || x.collections?.some((c) => c.usagePage === 1 && c.usage === 8)); if (d) attach(d).catch(() => {}); }).catch(() => {});
  app.cmd.register('3DMOUSE', async (c) => { if (app.spaceMouse.device) { c.print(`3D mouse connected: ${app.spaceMouse.device.productName || 'SpaceMouse'}.`); return; } await app.spaceMouse.connect(); }, { alias: ['RATON3D', 'SPACEMOUSE', '3DCONNEXION'] });
}
