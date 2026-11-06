// v8 — 3D útil: pinzamientos de sólidos, empalme y chaflán de aristas de perfil, SLICE, SECTION,
// vistas 2D desde el modelo 3D (VIEWBASE), exportación STEP/IFC e importación IFC/STEP (B-rep facetado).
import * as G from '../core/geom.js';
import * as E from '../core/entities.js';
import * as CSG from '../core/csg.js';
import { Cancel } from './engine.js';
import { meshOf, featureEdges } from './solid3d.js';

const isPt = (p) => p && typeof p === 'object' && 'x' in p;
const need = (p) => { if (p == null) throw new Cancel(); return p; };
const SOL = E.GEN['3DSOLID'];

// ---------- pinzamientos de sólidos en planta
SOL.grips = (e, add) => {
  if (e.kind === 'sphere') { add(e.c, (x, p) => (x.c = p)); add(G.add(e.c, { x: e.r, y: 0 }), (x, p) => (x.r = Math.max(1e-6, G.dist(x.c, p)))); return; }
  if (e.kind === 'mesh') { const b = E.entBBox(e, null); if (G.bbValid(b)) add({ x: (b.x1 + b.x2) / 2, y: (b.y1 + b.y2) / 2 }, (x, p) => { const b2 = E.entBBox(x, null), c = { x: (b2.x1 + b2.x2) / 2, y: (b2.y1 + b2.y2) / 2 }; E.transformEnt(x, G.M.tr(p.x - c.x, p.y - c.y)); }); return; }
  (e.prof || []).forEach((l, li) => l.forEach((v, vi) => add(v, (x, p) => { x.prof[li][vi] = { ...x.prof[li][vi], x: p.x, y: p.y }; delete x.c; })));
  if (e.prof?.[0]) { const pts = E.polyPoints({ pts: e.prof[0], closed: true }); const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 }); add(c, (x, p) => { const d = G.sub(p, c); x.prof = x.prof.map((l) => l.map((q) => ({ ...q, x: q.x + d.x, y: q.y + d.y }))); if (x.axis) x.axis = x.axis.map((q) => G.add(q, d)); if (x.c) x.c = G.add(x.c, d); }); }
};

// ---------- lector STEP/IFC (ISO 10303-21)
export function parseSPF(text) {
  const ents = new Map();
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(([\s\S]*?)\)\s*;(?=\s*(?:#\d+\s*=|ENDSEC))/g;
  let m;
  while ((m = re.exec(body))) ents.set(+m[1], { t: m[2], a: parseArgs(m[3]) });
  return ents;
}
function parseArgs(s) {
  let i = 0;
  const val = () => {
    while (s[i] === ' ' || s[i] === '\n' || s[i] === '\r' || s[i] === '\t') i++;
    const c = s[i];
    if (c === '(') { i++; const arr = []; while (s[i] !== ')' && i < s.length) { arr.push(val()); while (/[\s,]/.test(s[i])) i++; } i++; return arr; }
    if (c === "'") { let j = i + 1, out = ''; while (j < s.length) { if (s[j] === "'" && s[j + 1] === "'") { out += "'"; j += 2; continue; } if (s[j] === "'") break; out += s[j++]; } i = j + 1; return out; }
    if (c === '#') { const mm = /^#(\d+)/.exec(s.slice(i)); i += mm[0].length; return { ref: +mm[1] }; }
    if (c === '$' || c === '*') { i++; return null; }
    if (c === '.') { const mm = /^\.([A-Z0-9_]+)\./.exec(s.slice(i)); i += mm[0].length; return mm[1]; }
    const mm = /^([A-Z0-9_]+)\s*\(/.exec(s.slice(i));
    if (mm) { i += mm[0].length - 1; const inner = val(); return { typed: mm[1], v: inner }; }
    const num = /^[-+]?[\d.]+(?:[Ee][-+]?\d+)?/.exec(s.slice(i)); if (num) { i += num[0].length; return +num[0]; }
    i++; return null;
  };
  const out = [];
  while (i < s.length) { while (/[\s,]/.test(s[i])) i++; if (i >= s.length) break; out.push(val()); }
  return out;
}
// matrices 4x4 (por columnas reducidas a 3x4: [r00,r01,r02,tx, r10,...])
const mul = (A, B) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) r[i * 4 + j] = A[i * 4] * B[j] + A[i * 4 + 1] * B[4 + j] + A[i * 4 + 2] * B[8 + j] + (j === 3 ? A[i * 4 + 3] : 0); return r; };
const apply = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3], M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7], M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]];
const I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
export function importSPF(text, opts = {}) {
  const ents = parseSPF(text), get = (r) => (r && r.ref != null ? ents.get(r.ref) : null);
  const pt = (r) => { const e = get(r); const c = (e && (/^IFC/.test(e.t) ? e.a : e.a.slice(1))[0]) || [0, 0, 0]; return [c[0] || 0, c[1] || 0, c[2] || 0]; };
  const dir = (r, d) => { const e = get(r); if (!e) return d; const c = e.a[0]; const l = Math.hypot(...c) || 1; return [c[0] / l, c[1] / l, (c[2] || 0) / l]; };
  const axis3 = (r) => {
    const e = get(r); if (!e) return I4;
    const o = pt(e.a[0]), z = dir(e.a[1], [0, 0, 1]); let x = dir(e.a[2], [1, 0, 0]);
    const dz = x[0] * z[0] + x[1] * z[1] + x[2] * z[2]; x = [x[0] - dz * z[0], x[1] - dz * z[1], x[2] - dz * z[2]]; const lx = Math.hypot(...x) || 1; x = x.map((v) => v / lx);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], o[0], x[1], y[1], z[1], o[1], x[2], y[2], z[2], o[2]];
  };
  const axis2 = (r) => { const e = get(r); if (!e) return I4; const o = pt(e.a[0]); const x = dir(e.a[1], [1, 0, 0]); return [x[0], -x[1], 0, o[0], x[1], x[0], 0, o[1], 0, 0, 1, 0]; };
  const placement = (r, depth = 0) => {
    const e = get(r); if (!e || depth > 40) return I4;
    if (e.t === 'IFCLOCALPLACEMENT') return mul(placement(e.a[0], depth + 1), axis3(e.a[1]));
    return I4;
  };
  const solids = [];
  const pushPolys = (polys, M, name) => { const p = polys.map((f) => f.map((q) => apply(M, q))).filter((f) => f.length >= 3); if (p.length) solids.push({ polys: p, name }); };
  // argumentos sin el nombre inicial de las entidades STEP (las IFC no lo llevan)
  const args = (e) => (/^IFC/.test(e.t) ? e.a : e.a.slice(1));
  const brepFaces = (shellRef) => {
    const sh = get(shellRef); if (!sh) return [];
    const out = [];
    for (const fr of args(sh)[0] || []) {
      const f = get(fr); if (!f) continue;
      for (const br of args(f)[0] || []) {
        const b = get(br); if (!b || !/OUTER_?BOUND/.test(b.t)) continue;
        const [lr, ori] = args(b); const lp = get(lr); if (!lp || !/POLY_?LOOP/.test(lp.t)) continue;
        const poly = (args(lp)[0] || []).map(pt);
        if (poly.length >= 3) out.push(ori === 'F' ? poly.reverse() : poly);
      }
    }
    return out;
  };
  const profilePts = (r) => {
    const p = get(r); if (!p) return null;
    if (p.t === 'IFCRECTANGLEPROFILEDEF') { const M = axis2(p.a[2]); const X = p.a[3] / 2, Y = p.a[4] / 2; return [[-X, -Y], [X, -Y], [X, Y], [-X, Y]].map(([x, y]) => apply(M, [x, y, 0])); }
    if (p.t === 'IFCCIRCLEPROFILEDEF') { const M = axis2(p.a[2]), R = p.a[3]; return Array.from({ length: 32 }, (_, i) => apply(M, [R * Math.cos(i * Math.PI / 16), R * Math.sin(i * Math.PI / 16), 0])); }
    if (p.t === 'IFCARBITRARYCLOSEDPROFILEDEF') { const c = get(p.a[2]); if (c?.t === 'IFCPOLYLINE') { const pts = c.a[0].map(pt); if (pts.length > 1 && Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]) < 1e-9) pts.pop(); return pts; } }
    return null;
  };
  const extrude = (e) => {
    const prof = profilePts(e.a[0]); if (!prof || prof.length < 3) return null;
    const M = axis3(e.a[1]), d = dir(e.a[2], [0, 0, 1]), h = e.a[3];
    let ring = prof; const ar = ring.reduce((s, p, i) => s + (p[0] * ring[(i + 1) % ring.length][1] - ring[(i + 1) % ring.length][0] * p[1]), 0); if (ar < 0) ring = ring.slice().reverse();
    const top = ring.map((p) => [p[0] + d[0] * h, p[1] + d[1] * h, p[2] + d[2] * h]);
    const polys = [ring.slice().reverse(), top];
    for (let i = 0; i < ring.length; i++) { const j = (i + 1) % ring.length; polys.push([ring[i], ring[j], top[j], top[i]]); }
    return polys.map((f) => f.map((q) => apply(M, q)));
  };
  const itemPolys = (r) => {
    const it = get(r); if (!it) return [];
    if (it.t === 'IFCFACETEDBREP' || it.t === 'FACETED_BREP' || it.t === 'MANIFOLD_SOLID_BREP') return brepFaces(args(it)[0]);
    if (it.t === 'IFCEXTRUDEDAREASOLID') return extrude(it) || [];
    if (it.t === 'IFCTRIANGULATEDFACESET') { const pl = get(it.a[0]); const P = pl?.a[0] || []; return (it.a[3] || []).map((t) => t.map((k) => P[k - 1]).filter(Boolean).map((c) => [c[0], c[1], c[2] || 0])); }
    if (it.t === 'IFCPOLYGONALFACESET') { const pl = get(it.a[0]); const P = pl?.a[0] || []; return (it.a[2] || []).map((fr) => { const f = get(fr); return (f?.a[0] || []).map((k) => P[k - 1]).filter(Boolean).map((c) => [c[0], c[1], c[2] || 0]); }); }
    if (it.t === 'IFCMAPPEDITEM') { const src = get(it.a[0]); const rep = get(src?.a[1]); const M = axis3(src?.a[0]); return (rep?.a[3] || []).flatMap((x) => itemPolys(x)).map((f) => f.map((q) => apply(M, q))); }
    return [];
  };
  const scale = opts.scale || 1;
  for (const [id, e] of ents) {
    if (/^IFC/.test(e.t) && e.a.length >= 7 && e.a[5] && e.a[6] && get(e.a[6])?.t === 'IFCPRODUCTDEFINITIONSHAPE') {
      const M = placement(e.a[5]), pds = get(e.a[6]);
      const polys = [];
      for (const rr of pds.a[2] || []) { const rep = get(rr); for (const it of rep?.a[3] || []) polys.push(...itemPolys(it)); }
      pushPolys(polys.map((f) => f.map((q) => q.map((v) => v * scale))), [M[0], M[1], M[2], M[3] * scale, M[4], M[5], M[6], M[7] * scale, M[8], M[9], M[10], M[11] * scale], e.a[2] || e.t);
      void id;
    }
  }
  if (!solids.length) for (const [, e] of ents) if (e.t === 'FACETED_BREP' || e.t === 'MANIFOLD_SOLID_BREP') pushPolys(itemPolys({ ref: [...ents].find(([, x]) => x === e)[0] }).map((f) => f.map((q) => q.map((v) => v * scale))), I4, e.a[0] || 'B-rep');
  return solids;
}

// ---------- escritura STEP (AP214, B-rep facetado) e IFC4
const fx = (v) => { const s = (+v.toFixed(6)).toString(); return /[.eE]/.test(s) ? s : s + '.'; };
export function writeSTEP(solids, name = 'webcad') {
  let n = 0; const L = []; const id = () => ++n; const w = (s) => { const k = id(); L.push(`#${k}=${s};`); return k; };
  const ctxU = w("( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )"), angU = w("( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )"), solU = w("( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )");
  const unc = w(`UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-06),#${ctxU},'distance_accuracy_value','')`);
  const gctx = w(`( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${unc})) GLOBAL_UNIT_ASSIGNED_CONTEXT((#${ctxU},#${angU},#${solU})) REPRESENTATION_CONTEXT('Context','3D') )`);
  const app = w("APPLICATION_CONTEXT('automotive design')"); w(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${app})`);
  const pc = w(`PRODUCT_CONTEXT('',#${app},'mechanical')`), prod = w(`PRODUCT('${name}','${name}','',(#${pc}))`);
  const pdf = w(`PRODUCT_DEFINITION_FORMATION('','',#${prod})`), pdc = w(`PRODUCT_DEFINITION_CONTEXT('part definition',#${app},'design')`);
  const pd = w(`PRODUCT_DEFINITION('design','',#${pdf},#${pdc})`), pds = w(`PRODUCT_DEFINITION_SHAPE('','',#${pd})`);
  const items = [];
  for (const s of solids) {
    const faces = [];
    for (const f of s.polys) { const pts = f.map((p) => w(`CARTESIAN_POINT('',(${fx(p[0])},${fx(p[1])},${fx(p[2])}))`)); const lp = w(`POLY_LOOP('',(${pts.map((k) => '#' + k).join(',')}))`); const ob = w(`FACE_OUTER_BOUND('',#${lp},.T.)`); faces.push(w(`FACE('',(#${ob}))`)); }
    const sh = w(`CLOSED_SHELL('',(${faces.map((k) => '#' + k).join(',')}))`);
    items.push(w(`FACETED_BREP('${(s.name || 'solido').replace(/'/g, '')}',#${sh})`));
  }
  const org = w("CARTESIAN_POINT('',(0.,0.,0.))"), ax = w(`AXIS2_PLACEMENT_3D('',#${org},$,$)`);
  const rep = w(`FACETED_BREP_SHAPE_REPRESENTATION('',(#${ax},${items.map((k) => '#' + k).join(',')}),#${gctx})`);
  w(`SHAPE_DEFINITION_REPRESENTATION(#${pds},#${rep})`);
  const now = new Date().toISOString().slice(0, 19);
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('WebCAD Libre'),'2;1');\nFILE_NAME('${name}.stp','${now}',(''),(''),'WebCAD Libre','WebCAD Libre','');\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n${L.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}
const guid = () => { const c = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$'; let s = ''; for (let i = 0; i < 22; i++) s += c[i ? Math.floor(Math.random() * 64) : Math.floor(Math.random() * 4)]; return s; };
export function writeIFC(solids, name = 'webcad') {
  let n = 0; const L = []; const w = (s) => { const k = ++n; L.push(`#${k}=${s};`); return k; };
  const pers = w("IFCPERSON($,$,'WebCAD',$,$,$,$,$)"), org = w("IFCORGANIZATION($,'WebCAD Libre',$,$,$)"), po = w(`IFCPERSONANDORGANIZATION(#${pers},#${org},$)`);
  const appl = w(`IFCAPPLICATION(#${org},'8','WebCAD Libre','WebCAD')`), own = w(`IFCOWNERHISTORY(#${po},#${appl},$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)})`);
  const o0 = w('IFCCARTESIANPOINT((0.,0.,0.))'), ax0 = w(`IFCAXIS2PLACEMENT3D(#${o0},$,$)`);
  const ctx = w(`IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#${ax0},$)`);
  const lu = w('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)'), au = w('IFCSIUNIT(*,.PLANEANGLEUNIT.,$,.RADIAN.)'), un = w(`IFCUNITASSIGNMENT((#${lu},#${au}))`);
  const proj = w(`IFCPROJECT('${guid()}',#${own},'${name}',$,$,$,$,(#${ctx}),#${un})`);
  const pl = (rel) => w(`IFCLOCALPLACEMENT(${rel ? '#' + rel : '$'},#${ax0})`);
  const sp = pl(null), site = w(`IFCSITE('${guid()}',#${own},'Emplazamiento',$,$,#${sp},$,$,.ELEMENT.,$,$,$,$,$)`);
  const bp = pl(sp), bld = w(`IFCBUILDING('${guid()}',#${own},'Edificio',$,$,#${bp},$,$,.ELEMENT.,$,$,$)`);
  const stp = pl(bp), st = w(`IFCBUILDINGSTOREY('${guid()}',#${own},'Planta 0',$,$,#${stp},$,$,.ELEMENT.,0.)`);
  w(`IFCRELAGGREGATES('${guid()}',#${own},$,$,#${proj},(#${site}))`); w(`IFCRELAGGREGATES('${guid()}',#${own},$,$,#${site},(#${bld}))`); w(`IFCRELAGGREGATES('${guid()}',#${own},$,$,#${bld},(#${st}))`);
  const els = [];
  for (const s of solids) {
    const faces = s.polys.map((f) => { const pts = f.map((p) => w(`IFCCARTESIANPOINT((${fx(p[0])},${fx(p[1])},${fx(p[2])}))`)); const lp = w(`IFCPOLYLOOP((${pts.map((k) => '#' + k).join(',')}))`); const b = w(`IFCFACEOUTERBOUND(#${lp},.T.)`); return w(`IFCFACE((#${b}))`); });
    const sh = w(`IFCCLOSEDSHELL((${faces.map((k) => '#' + k).join(',')}))`), br = w(`IFCFACETEDBREP(#${sh})`);
    const rep = w(`IFCSHAPEREPRESENTATION(#${ctx},'Body','Brep',(#${br}))`), pds = w(`IFCPRODUCTDEFINITIONSHAPE($,$,(#${rep}))`);
    const ep = pl(stp);
    els.push(w(`IFCBUILDINGELEMENTPROXY('${guid()}',#${own},'${(s.name || 'Elemento').replace(/'/g, '')}',$,$,#${ep},#${pds},$,$)`));
  }
  if (els.length) w(`IFCRELCONTAINEDINSPATIALSTRUCTURE('${guid()}',#${own},$,$,(${els.map((k) => '#' + k).join(',')}),#${st})`);
  const now = new Date().toISOString().slice(0, 19);
  return `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');\nFILE_NAME('${name}.ifc','${now}',(''),(''),'WebCAD Libre','WebCAD Libre','');\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\n${L.join('\n')}\nENDSEC;\nEND-ISO-10303-21;\n`;
}

// ---------- sección de una malla por un plano: segmentos -> contornos cerrados
export function sectionLoops(m, n, w) {
  const segs = [];
  for (const f of m.f) {
    const pts = f.map((i) => m.v[i]), ds = pts.map((p) => p[0] * n[0] + p[1] * n[1] + p[2] * n[2] - w), cut = [];
    for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; if ((ds[i] > 0) !== (ds[j] > 0)) { const t = ds[i] / (ds[i] - ds[j]); cut.push(pts[i].map((v, k) => v + (pts[j][k] - v) * t)); } }
    if (cut.length >= 2) segs.push([cut[0], cut[1]]);
  }
  const key = (p) => p.map((v) => v.toFixed(5)).join(',');
  const adj = new Map(); for (const s of segs) for (const [a, b] of [[s[0], s[1]], [s[1], s[0]]]) { const k = key(a); if (!adj.has(k)) adj.set(k, []); adj.get(k).push(b); }
  const used = new Set(), loops = [];
  for (const s of segs) {
    const k0 = key(s[0]) + '|' + key(s[1]); if (used.has(k0)) continue;
    const loop = [s[0]]; let cur = s[1], prev = s[0]; used.add(k0); used.add(key(s[1]) + '|' + key(s[0]));
    for (let g = 0; g < segs.length; g++) {
      if (key(cur) === key(loop[0])) break;
      loop.push(cur);
      const nx = (adj.get(key(cur)) || []).find((q) => key(q) !== key(prev) && !used.has(key(cur) + '|' + key(q)));
      if (!nx) break;
      used.add(key(cur) + '|' + key(nx)); used.add(key(nx) + '|' + key(cur)); prev = cur; cur = nx;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

export function register(eng, app) {
  const doc = () => app.doc;
  const R = (n, f, o) => eng.register(n, f, o);
  const redraw = () => { app.view.redraw(); app.ui.refresh?.(); };
  const pickSolid = async (c, pr = 'Select solid:') => need(await c.entsel(pr, { filter: (e) => e.type === '3DSOLID', filterMsg: 'Object is not a 3D solid.' }));
  const toMesh = (e) => ({ type: '3DSOLID', kind: 'mesh', polys: CSG.polysToList(CSG.meshToPolys(meshOf(e))), layer: e.layer, color: e.color });

  // ======================= EMPALME / CHAFLÁN DE ARISTAS (de perfil) =======================
  const edgeOp = (fillet) => async (c) => {
    const r = await pickSolid(c, 'Select an edge:');
    const e = r.e;
    if (!e.prof || e.kind === 'revolve' || e.kind === 'sphere') { c.print('Only vertical (profile) edges of extruded solids can be edited.'); return; }
    const d = doc();
    const v = need(await c.getDist(fillet ? `Enter fillet radius <${G.fmt(eng.filletR3 ?? 1, 4)}>:` : `Enter base surface chamfer distance <${G.fmt(eng.chamferD3 ?? 1, 4)}>:`, { def: fillet ? eng.filletR3 ?? 1 : eng.chamferD3 ?? 1 }));
    if (fillet) eng.filletR3 = v; else eng.chamferD3 = v;
    const picks = [r.p];
    for (;;) { const q = await c.getPoint('Select an edge or [Chain/Loop/Radius]:'); if (!isPt(q)) break; picks.push(q); }
    d.begin(fillet ? 'FILLETEDGE' : 'CHAMFEREDGE');
    d.mod(e, (x) => {
      for (const p of picks) {
        const l = x.prof[0]; let k = 0, kd = Infinity; l.forEach((q, i) => { const dd = G.dist(q, p); if (dd < kd) { kd = dd; k = i; } });
        const n = l.length, A = l[(k - 1 + n) % n], B = l[k], C = l[(k + 1) % n];
        if (A.b || B.b) continue;
        const u1 = G.norm(G.sub(A, B)), u2 = G.norm(G.sub(C, B)), ang = Math.acos(Math.max(-1, Math.min(1, G.dot(u1, u2))));
        const t = fillet ? v / Math.tan(ang / 2) : v;
        if (t >= Math.min(G.dist(A, B), G.dist(B, C)) - 1e-9) continue;
        const P1 = G.add(B, G.mul(u1, t)), P2 = G.add(B, G.mul(u2, t));
        let bulge = 0;
        if (fillet) { const sweep = Math.PI - ang, cr = u1.x * u2.y - u1.y * u2.x; bulge = Math.tan(sweep / 4) * (cr > 0 ? -1 : 1); }
        l.splice(k, 1, { x: P1.x, y: P1.y, b: bulge }, { x: P2.x, y: P2.y, b: 0 });
      }
      delete x.c;
    });
    d.end(); redraw();
  };
  R('FILLETEDGE', edgeOp(true), { alias: ['FEDGE'] });
  R('CHAMFEREDGE', edgeOp(false), { alias: ['CHEDGE'] });

  // ======================= SLICE =======================
  R('SLICE', async (c) => {
    const s = await c.select('Select objects to slice:', { filter: (e) => e.type === '3DSOLID' }); if (!s.length) return;
    const k = await c.getPoint('Specify start point of slicing plane or [planar Object/Surface/Zaxis/View/XY/YZ/ZX/3points] <3points>:', { def: '3points' });
    if (k == null) return;
    let n, w;
    if (k === 'XY') { const z = need(await c.getReal('Specify Z elevation of the plane <0>:', { def: 0 })); n = [0, 0, 1]; w = z; }
    else if (isPt(k)) { const p2 = need(await c.getPoint('Specify second point on plane:', { base: k })); const u = G.norm(G.sub(p2, k)); n = [-u.y, u.x, 0]; w = n[0] * k.x + n[1] * k.y; }
    else { const p1 = need(await c.getPoint('Specify first point on plane:')), p2 = need(await c.getPoint('Specify second point on plane:', { base: p1 })); const u = G.norm(G.sub(p2, p1)); n = [-u.y, u.x, 0]; w = n[0] * p1.x + n[1] * p1.y; }
    const side = await c.getPoint('Specify a point on desired side or [keep Both sides] <Both>:', { def: 'Both' });
    const both = side == null || side === 'Both' || side === 'keep Both sides';
    const d = doc(); d.begin('SLICE');
    for (const e of s) {
      const P = CSG.meshToPolys(meshOf(e));
      const keepPos = both || !isPt(side) || n[2] !== 0 || n[0] * side.x + n[1] * side.y - w >= 0;
      const pos = CSG.intersect(P, CSG.halfSpace(n, w)), neg = CSG.intersect(P, CSG.halfSpace(n.map((v) => -v), -w));
      d.remove(e);
      if (both || keepPos) if (pos.length) d.add({ type: '3DSOLID', kind: 'mesh', polys: CSG.polysToList(pos), layer: e.layer, color: e.color });
      if (both || !keepPos) if (neg.length) d.add({ type: '3DSOLID', kind: 'mesh', polys: CSG.polysToList(neg), layer: e.layer, color: e.color });
    }
    d.end(); redraw();
  }, { alias: ['SL'] });

  // ======================= SECTION =======================
  R('SECTION', async (c) => {
    const s = await c.select('Select objects:', { filter: (e) => e.type === '3DSOLID' }); if (!s.length) return;
    const k = await c.getPoint('Specify first point on Section plane by [Object/Zaxis/View/XY/YZ/ZX/3points] <3points>:', { def: '3points' });
    if (k == null) return;
    const d = doc();
    if (k === 'XY') {
      const z = need(await c.getReal('Specify Z elevation of the plane <0>:', { def: 0 }));
      d.begin('SECTION'); let nr = 0;
      for (const e of s) for (const l of sectionLoops(meshOf(e), [0, 0, 1], z)) { d.add({ type: 'REGION', loops: [l.map((p) => ({ x: p[0], y: p[1], b: 0 }))], layer: e.layer }); nr++; }
      d.end(); c.print(`${nr} region(s) created.`); redraw(); return;
    }
    const p1 = isPt(k) ? k : need(await c.getPoint('Specify first point on plane:'));
    const p2 = need(await c.getPoint('Specify second point on plane:', { base: p1 }));
    const ins = need(await c.getPoint('Specify insertion point for the section:'));
    const u = G.norm(G.sub(p2, p1)), n = [-u.y, u.x, 0], w = n[0] * p1.x + n[1] * p1.y;
    d.begin('SECTION'); let nr = 0;
    for (const e of s) for (const l of sectionLoops(meshOf(e), n, w)) {
      const pts = l.map((p) => ({ x: ins.x + (p[0] - p1.x) * u.x + (p[1] - p1.y) * u.y, y: ins.y + p[2], b: 0 }));
      d.add({ type: 'REGION', loops: [pts], layer: e.layer }); d.add({ type: 'HATCH', loops: [pts.map((q) => ({ ...q }))], pattern: 'ANSI31', scale: 1, angle: 0, layer: e.layer }); nr++;
    }
    d.end(); c.print(`${nr} region(s) created.`); redraw();
  }, { alias: ['SEC'] });

  // ======================= VIEWBASE: vistas 2D (planta, alzados, isométrica) con líneas ocultas =======================
  const VIEWS = { Top: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], Front: [[1, 0, 0], [0, 0, 1], [0, -1, 0]], Right: [[0, 1, 0], [0, 0, 1], [1, 0, 0]], Left: [[0, -1, 0], [0, 0, 1], [-1, 0, 0]], Back: [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], Iso: null };
  const isoBasis = () => { const az = G.rad(-45), el = Math.atan(1 / Math.SQRT2); const f = [-Math.cos(el) * Math.cos(az), -Math.cos(el) * Math.sin(az), -Math.sin(el)]; const r = [-Math.sin(az), Math.cos(az), 0]; const up = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]]; return [r, up, f.map((x) => -x)]; };
  // proyecta las aristas vivas y clasifica cada tramo en visible u oculto
  const projectView = (meshes, B) => {
    const P = (p) => [p[0] * B[0][0] + p[1] * B[0][1] + p[2] * B[0][2], p[0] * B[1][0] + p[1] * B[1][1] + p[2] * B[1][2], p[0] * B[2][0] + p[1] * B[2][1] + p[2] * B[2][2]];
    const tris = [];
    for (const m of meshes) for (const f of m.f) { const q = f.map((i) => P(m.v[i])); for (let i = 1; i < q.length - 1; i++) tris.push([q[0], q[i], q[i + 1]]); }
    const occluded = (p) => {
      for (const t of tris) {
        const [a, b, c] = t, d0 = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(d0) < 1e-12) continue;
        const l1 = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / d0, l2 = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / d0, l3 = 1 - l1 - l2;
        if (l1 < 1e-6 || l2 < 1e-6 || l3 < 1e-6) continue;
        const z = l1 * a[2] + l2 * b[2] + l3 * c[2];
        if (z > p[2] + 1e-6 * (1 + Math.abs(z))) return true;
      }
      return false;
    };
    const vis = [], hid = [];
    for (const m of meshes) for (const [a3, b3] of featureEdges(m)) {
      const a = P(a3), b = P(b3); if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9) continue;
      const N = 8; let run = null, runVis = null;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N, tm = (t0 + t1) / 2;
        const mp = [a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm, a[2] + (b[2] - a[2]) * tm];
        const v = !occluded(mp);
        if (run && runVis === v) run[1] = t1; else { if (run) (runVis ? vis : hid).push([run[0], run[1], a, b]); run = [t0, t1]; runVis = v; }
      }
      if (run) (runVis ? vis : hid).push([run[0], run[1], a, b]);
    }
    const seg = ([t0, t1, a, b]) => [{ x: a[0] + (b[0] - a[0]) * t0, y: a[1] + (b[1] - a[1]) * t0 }, { x: a[0] + (b[0] - a[0]) * t1, y: a[1] + (b[1] - a[1]) * t1 }];
    const dedupe = (arr) => { const seen = new Set(); return arr.map(seg).filter(([p, q]) => { const k = [p.x, p.y, q.x, q.y].map((v) => v.toFixed(5)); const kk = k[0] + k[1] < k[2] + k[3] ? k.join() : [k[2], k[3], k[0], k[1]].join(); if (seen.has(kk)) return false; seen.add(kk); return true; }); };
    return { vis: dedupe(vis), hid: dedupe(hid) };
  };
  app.projectView = (ents, view = 'Front') => projectView(ents.map(meshOf), VIEWS[view] || isoBasis());
  R('VIEWBASE', async (c) => {
    const d = doc();
    let s = await c.select('Select solids <all>:', { filter: (e) => e.type === '3DSOLID' });
    if (!s.length) s = d.model.filter((e) => e.type === '3DSOLID');
    if (!s.length) { c.print('No solids.'); return; }
    const sc = need(await c.getReal('Enter view scale <1>:', { def: 1 }));
    const meshes = s.map(meshOf);
    d.begin('VIEWBASE'); d.touchTables();
    d.ensureLayer('VISTA_VISIBLE', { color: 7, lw: 35 }); d.ensureLayer('VISTA_OCULTA', { color: 8, ltype: 'HIDDEN' });
    if (!d.ltypes.HIDDEN) { const L = (await import('../core/tables.js')).LINETYPES; if (L?.HIDDEN) d.ltypes.HIDDEN = L.HIDDEN; }
    d.end();
    const place = async (view, base) => {
      const pv = projectView(meshes, VIEWS[view] || isoBasis());
      const bb = G.bbNew(); for (const [p, q] of [...pv.vis, ...pv.hid]) { G.bbAdd(bb, p); G.bbAdd(bb, q); }
      const c0 = { x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2 };
      const mk = (q, at) => [...pv.vis.map(([a, b]) => ({ type: 'LINE', p1: G.add(at, G.mul(G.sub(a, c0), sc)), p2: G.add(at, G.mul(G.sub(b, c0), sc)), layer: 'VISTA_VISIBLE' })), ...(view === 'Iso' ? [] : pv.hid.map(([a, b]) => ({ type: 'LINE', p1: G.add(at, G.mul(G.sub(a, c0), sc)), p2: G.add(at, G.mul(G.sub(b, c0), sc)), layer: 'VISTA_OCULTA' })))];
      const at = base || need(await c.getPoint(`Specify location of ${view} view:`, { preview: (q) => mk(null, q).slice(0, 4000) }));
      d.begin('VIEWBASE'); const ents = mk(null, at); for (const e of ents) d.add(e);
      const grp = 'VISTA_' + view.toUpperCase() + '_' + Math.random().toString(36).slice(2, 5);
      d.groups ||= {}; d.touchTables(); d.groups[grp] = { name: grp, hids: ents.map((e) => e.hid), selectable: true };
      d.end(); return at;
    };
    const k = await c.getKw('Select type of view [Top/Front/Right/Left/Back/Iso] <Front>:', 'Front'); if (k == null) return;
    const base = await place(k);
    // vistas proyectadas: el punto indica la dirección respecto a la vista base
    for (;;) {
      const q = await c.getPoint('Specify location of projected view or [eXit] <eXit>:', { base });
      if (!isPt(q)) break;
      const dx = q.x - base.x, dy = q.y - base.y;
      const view = Math.abs(dx) > Math.abs(dy) * 2 ? (dx > 0 ? (k === 'Top' ? 'Right' : 'Right') : 'Left') : Math.abs(dy) > Math.abs(dx) * 2 ? (dy > 0 ? (k === 'Top' ? 'Back' : 'Top') : (k === 'Top' ? 'Front' : 'Top')) : 'Iso';
      await place(view, q);
    }
    redraw();
  }, { alias: ['VB', 'BASEVIEW'] });

  // ======================= STEP / IFC =======================
  const solidsForExport = async (c) => { let s = await c.select('Select solids <all>:', { filter: (e) => e.type === '3DSOLID' }); if (!s.length) s = doc().model.filter((e) => e.type === '3DSOLID'); return s.map((e, i) => ({ polys: CSG.polysToList(CSG.meshToPolys(meshOf(e))), name: e.layer ? `${e.layer}_${i + 1}` : `Solido_${i + 1}` })); };
  const base = () => doc().name.replace(/\.[^.]+$/, '') || 'modelo';
  R('STEPOUT', async (c) => { const s = await solidsForExport(c); if (!s.length) { c.print('No solids.'); return; } const txt = writeSTEP(s, base()); app._lastStep = txt; await app.io.deliver(base() + '.stp', txt, 'application/step'); c.print(`${s.length} solid(s) exported to STEP.`); }, { alias: ['EXPORTSTEP'] });
  R('IFCOUT', async (c) => { const s = await solidsForExport(c); if (!s.length) { c.print('No solids.'); return; } const txt = writeIFC(s, base()); app._lastIfc = txt; await app.io.deliver(base() + '.ifc', txt, 'application/x-step'); c.print(`${s.length} solid(s) exported to IFC.`); }, { alias: ['EXPORTIFC'] });
  const importText = async (c, name, text) => {
    const r = await app.ui.dlg.form('Importar modelo 3D', [{ k: 'sc', l: 'Escala (unidades del archivo → dibujo)', v: 1, t: 'number' }, { k: 'layer', l: 'Capa', v: '3D_' + name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 24) }]);
    if (!r) return;
    const solids = importSPF(text, { scale: +r.sc || 1 });
    const d = doc(); d.begin('IMPORT3D'); d.touchTables(); d.ensureLayer(r.layer, {});
    for (const s of solids) d.add({ type: '3DSOLID', kind: 'mesh', polys: s.polys, layer: r.layer });
    d.end(); c.print(`${solids.length} solid(s) imported.`); app.view.zoomExtents(); redraw();
  };
  app.import3D = (name, text, scale = 1) => { const solids = importSPF(text, { scale }); const d = doc(); d.begin('IMPORT3D'); for (const s of solids) d.add({ type: '3DSOLID', kind: 'mesh', polys: s.polys }); d.end(); return solids.length; };
  R('IFCIMPORT', async (c) => { const f = await app.io.pickFile('.ifc,.stp,.step'); if (f) await importText(c, f.name, await f.text()); }, { alias: ['IMPORTIFC', 'STEPIN', 'IMPORTSTEP'] });
  R('CONVTOMESH', async (c) => { const s = await c.select('Select solids:', { filter: (e) => e.type === '3DSOLID' && e.kind !== 'mesh' }); const d = doc(); d.begin('CONVTOMESH'); for (const e of s) { d.remove(e); d.add(toMesh(e)); } d.end(); redraw(); });
}
