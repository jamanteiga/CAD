// Cálculo de conductos (Darcy-Weisbach / Colebrook-White)
import * as D from '../../js/core/duct.js';
export default async (t) => {
  const e = { type: 'DUCT', pts: [{ x: 0, y: 0 }, { x: 10000, y: 0 }], shape: 'round', d: 400, flow: 3000, ratio: 1 };
  const k = D.ductCalc(e);
  const v = 3000 / 3600 / (Math.PI * 0.2 * 0.2);
  t.near(k.v, v, 0.01, 'velocidad = caudal / sección');
  t.near(k.L, 10, 1e-9, 'longitud en metros');
  const Re = v * 0.4 / D.NU, fr = D.colebrook(Re, 0.15 / 400), R = fr / 0.4 * D.RHO * v * v / 2;
  t.near(k.R, R, 1e-6, 'pérdida unitaria = f/D · ρv²/2');
  t.ok(k.R > 1.0 && k.R < 1.4, `orden de magnitud para Ø400 a 6,6 m/s: ${k.R.toFixed(3)} Pa/m`);
  t.near(k.dp, k.R * k.L, 1e-6, 'tramo recto: ΔP = R·L');
  const f = D.colebrook(1e5, 0.15 / 400); t.ok(f > 0.015 && f < 0.025, `factor de fricción Colebrook: ${f.toFixed(4)}`);
  t.near(D.eqDiameter({ shape: 'rect', w: 600, h: 300 }), 1.3 * Math.pow(600 * 300, 0.625) / Math.pow(900, 0.25), 1e-9, 'diámetro equivalente de Huebscher');
  const s = D.sizeDuct({ flow: 5000, shape: 'rect', h: 300, vmax: 6, rmax: 1 });
  t.ok(s && s.w >= 500, `dimensionado rectangular para 5000 m³/h: ${s && D.sectionText(s)}`);
};
