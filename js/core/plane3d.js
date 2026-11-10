// Planos de trabajo 3D (SCP 3D) y cámara de la vista principal.
// Un plano es { o: [x,y,z], u: [x,y,z], v: [x,y,z] } con u y v unitarios y perpendiculares; n = u × v.
// Las entidades dibujadas sobre un plano guardan sus coordenadas 2D locales y el plano en e.wp
// (como la dirección de extrusión de un DXF). Sin e.wp, la entidad está en el plano XY universal (z = 0).
export const WORLD = Object.freeze({ o: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] });
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const unit = (a) => { const l = Math.hypot(...a) || 1; return a.map((x) => x / l); };
export const normal = (pl) => cross(pl.u, pl.v);
const clean = (a) => a.map((x) => (Math.abs(x) < 1e-12 ? 0 : Math.round(x * 1e12) / 1e12));
export const plane = (o, u, v) => ({ o: clean(o), u: clean(unit(u)), v: clean(unit(v)) });
export const isWorld = (pl) => !pl || (pl.o.every((x) => Math.abs(x) < 1e-12) && Math.abs(pl.u[0] - 1) < 1e-12 && Math.abs(pl.v[1] - 1) < 1e-12);
export const key = (pl) => (isWorld(pl) ? 'W' : [...pl.o, ...pl.u, ...pl.v].map((x) => x.toFixed(9)).join(','));
export const same = (a, b) => key(a) === key(b);
// punto local {x, y, z?} -> universal [x, y, z]
export const toW = (pl, p) => { pl ||= WORLD; const n = normal(pl), z = p.z || 0; return [pl.o[0] + p.x * pl.u[0] + p.y * pl.v[0] + z * n[0], pl.o[1] + p.x * pl.u[1] + p.y * pl.v[1] + z * n[1], pl.o[2] + p.x * pl.u[2] + p.y * pl.v[2] + z * n[2]]; };
export const fromW = (pl, P) => { pl ||= WORLD; const d = sub(P, pl.o); return { x: dot(d, pl.u), y: dot(d, pl.v), z: dot(d, normal(pl)) }; };

// planos con nombre (orientación de la cara del cubo de vistas), con origen dado
export const NAMED = {
  Top: [[1, 0, 0], [0, 1, 0]], Bottom: [[1, 0, 0], [0, -1, 0]], Front: [[1, 0, 0], [0, 0, 1]], Back: [[-1, 0, 0], [0, 0, 1]],
  Left: [[0, -1, 0], [0, 0, 1]], Right: [[0, 1, 0], [0, 0, 1]],
};
export const named = (name, o = [0, 0, 0]) => { const a = NAMED[name]; return a ? plane(o, a[0], a[1]) : null; };
// giro del plano alrededor de uno de sus ejes (ángulo en radianes, regla de la mano derecha)
export function rotate(pl, axis, ang) {
  const n = normal(pl), c = Math.cos(ang), s = Math.sin(ang);
  const rot = (w, k) => add(add(mul(w, c), mul(cross(k, w), s)), mul(k, dot(k, w) * (1 - c)));
  const k = axis === 'X' ? pl.u : axis === 'Y' ? pl.v : n;
  return plane(pl.o, rot(pl.u, k), rot(pl.v, k));
}
// plano por tres puntos universales: origen, punto del eje X positivo y punto del lado Y positivo
export function from3(p0, p1, p2) {
  const u = unit(sub(p1, p0)); let w = sub(p2, p0); w = sub(w, mul(u, dot(w, u)));
  if (Math.hypot(...w) < 1e-9) return null;
  return plane(p0, u, unit(w));
}

// ---- cámara (proyección paralela): az, el en radianes; null = planta (vista superior)
export const SWISO = { az: -0.75 * Math.PI, el: Math.atan(1 / Math.SQRT2) };
export const PRESETS = { Top: [-90, 90], Bottom: [-90, -90], Front: [-90, 0], Back: [90, 0], Left: [180, 0], Right: [0, 0], SWiso: [-135, 35.264], SEiso: [-45, 35.264], NEiso: [45, 35.264], NWiso: [135, 35.264] };
export const presetCam = (k) => { const p = PRESETS[k]; return p ? { az: p[0] * Math.PI / 180, el: p[1] * Math.PI / 180 } : null; };
export function basis(cam) {
  if (!cam) return { R: [1, 0, 0], U: [0, 1, 0], F: [0, 0, -1] };
  const el = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cam.el));
  const ca = Math.cos(cam.az), sa = Math.sin(cam.az), ce = Math.cos(el), se = Math.sin(el);
  const F = [-ce * ca, -ce * sa, -se];
  let R = [-sa, ca, 0];
  if (Math.abs(ce) < 1e-9) R = [-sa, ca, 0];
  const U = cross(R, F);
  return { R, U, F };
}
// afín plano local -> coordenadas 2D de vista: x' = a x + c y + e (+ zx z), y' = b x + d y + f (+ zy z)
export function affine(pl, B) {
  pl ||= WORLD; const n = normal(pl);
  return { a: dot(pl.u, B.R), b: dot(pl.u, B.U), c: dot(pl.v, B.R), d: dot(pl.v, B.U), e: dot(pl.o, B.R), f: dot(pl.o, B.U), zx: dot(n, B.R), zy: dot(n, B.U) };
}
export const det = (A) => A.a * A.d - A.b * A.c;
