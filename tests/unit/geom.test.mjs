// Geometría básica
import * as G from '../../js/core/geom.js';
export default async (t) => {
  t.near(G.dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5, 1e-12, 'distancia');
  const p = G.polar({ x: 1, y: 1 }, Math.PI / 2, 2); t.near(p.x, 1, 1e-12, 'polar x'); t.near(p.y, 3, 1e-12, 'polar y');
  const [i] = G.llInter({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 });
  t.ok(i && Math.abs(i.x - 5) < 1e-9 && Math.abs(i.y - 5) < 1e-9, 'intersección de segmentos');
  t.eq(G.llInter({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }), [], 'rectas paralelas sin intersección');
  t.near(G.polyArea([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }]), 12, 1e-9, 'área de polígono');
  t.ok(G.ptInPoly({ x: 1, y: 1 }, [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }, { x: 0, y: 3 }]), 'punto dentro de polígono');
  t.near(G.normA(-Math.PI / 2), 3 * Math.PI / 2, 1e-12, 'normalización de ángulos');
};
