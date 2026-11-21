// The coke basket (Kokskorb), the open coke fire of winter building work (catalogue brazier). Deutsche Bauzeitung
// 26 (1892), No. 40, p. 237, "Verbesserte Kokskörbe" (Internet Archive deutschebauzeitu1892verb; public domain): "A ist
// ein Kokskorb gewöhnlicher Konstruktion", drawn to a scale bar, and the coke basket is called indispensable for winter
// building work in the northern climate. Berlin's police barred work in rooms heated by them (Centralblatt der
// Bauverwaltung 1891, "Kokskörbe zum rascheren Austrocknen von Neubauten"). From the drawing: a cylindrical cage
// about 0.31 m across and 0.47 m tall, a grate of parallel bars at its foot, short legs about 0.18 m, lugs on the top
// hoop.
//   coke-basket        burning: the cage full of coke glowing through the bars, a crust of grey lumps on top, ash
//                      fallen through the grate onto the ground
//   coke-basket-cold   gone out: half full of dead coke, ash on the grate and under it
// ASSUMED: the bars (16 flat bars 30 x 6 mm between two hoops), the three splayed legs, the four lugs' size.
// Its documented place is the building site and the new building being dried out; braziers in the street for
// watchmen and cabmen are still unconfirmed (research/outdoor.md), so the world lane should keep it to the works.
// Frame: the legs' feet on the ground, the cage's axis on y.
import type { Solid } from "raea/3d";
import { manifold } from "raea/3d";
import { box, lathe, union, type V3 } from "./geo";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

const R = 0.155, Y0 = 0.18, Y1 = 0.65, NB = 16;

/** A hoop of flat bar round the cage: 6 mm thick, h high, its bottom at y. */
const hoop = (y: number, h: number) => lathe([[R - 0.004, y], [R + 0.004, y], [R + 0.004, y + h], [R - 0.004, y + h]], 0, 0, 0, 28);

/** A coke lump: the hull of seven points scattered about its centre, seeded. */
function lumps(n: number, seed: number, at: (i: number, r: () => number) => V3, size: number): Solid[] {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, (_, i) => {
    const c = at(i, r), k = size * (0.7 + 0.6 * r()), pts: V3[] = [];
    for (let j = 0; j < 7; j++) pts.push([c[0] + k * (r() - 0.5), c[1] + k * 0.8 * (r() - 0.5), c[2] + k * (r() - 0.5)]);
    return manifold.hull(pts);
  });
}

function cage(): Solid {
  const s: Solid[] = [hoop(Y0, 0.04), hoop(Y1 - 0.04, 0.04)];
  for (let i = 0; i < NB; i++) s.push(box(0.03, Y1 - Y0, 0.006, 0, Y0, R - 0.001).rotate(0, (360 * i) / NB, 0));
  // the grate: seven bars across the bottom hoop
  for (let i = -3; i <= 3; i++) { const x = i * 0.04, h = Math.sqrt(R * R - x * x); s.push(box(0.012, 0.012, 2 * h, x, Y0 + 0.006, 0)); }
  // three legs splayed from the bottom hoop to feet on the ground, four lugs on the top hoop
  for (let i = 0; i < 3; i++) {
    const a = (2 * Math.PI * i) / 3 + Math.PI / 6, c = Math.cos(a), n = Math.sin(a);
    s.push(rod([R * c, Y0 + 0.03, R * n], [(R + 0.035) * c, 0.012, (R + 0.035) * n], 0.011), box(0.04, 0.012, 0.04, (R + 0.035) * c, 0, (R + 0.035) * n));
  }
  for (let i = 0; i < 4; i++) s.push(box(0.03, 0.035, 0.03, 0, Y1 - 0.04, R + 0.012).rotate(0, 90 * i, 0));
  return union(...s);
}

const inCage = (y0: number, y1: number, rr: number) => (i: number, r: () => number): V3 => { const a = r() * 2 * Math.PI, d = rr * Math.sqrt(r()); return [d * Math.cos(a), y0 + (y1 - y0) * r(), d * Math.sin(a)]; };
const onRing = (y0: number, y1: number) => (i: number, r: () => number): V3 => { const a = r() * 2 * Math.PI, d = R - 0.03 - 0.012 * r(); return [d * Math.cos(a), y0 + (y1 - y0) * r(), d * Math.sin(a)]; };

function burning(): Part[] {
  // the lumps packed against the bars, three in five glowing through and the rest grey with ash; the dark between
  const wall = lumps(80, 23, onRing(Y0 + 0.03, Y1 - 0.06), 0.06), top = lumps(26, 11, inCage(Y1 - 0.07, Y1 - 0.02, R - 0.04), 0.055);
  const hot = (s: Solid[], k: number) => s.filter((_, i) => i % 5 < k), dead = (s: Solid[], k: number) => s.filter((_, i) => i % 5 >= k);
  return [
    { mat: "iron-rust", solid: cage() },
    { mat: "coal", solid: lathe([[0, Y0 + 0.014], [R - 0.05, Y0 + 0.014], [R - 0.05, Y1 - 0.06], [0, Y1 - 0.05]], 0, 0, 0, 16), overlap: true },
    { mat: "ember", solid: union(...hot(wall, 3), ...hot(top, 2)), overlap: true },
    { mat: "coke", solid: union(...dead(wall, 3), ...dead(top, 2)), overlap: true },
    { mat: "ash", solid: lathe([[0, 0], [0.13, 0], [0.09, 0.012], [0, 0.02]], 0, 0, 0, 16) },
  ];
}

function cold(): Part[] {
  return [
    { mat: "iron-rust", solid: cage() },
    { mat: "coke", solid: union(lathe([[0, Y0 + 0.014], [R - 0.012, Y0 + 0.014], [R - 0.012, Y0 + 0.17], [0, Y0 + 0.2]], 0, 0, 0, 20), ...lumps(20, 37, inCage(Y0 + 0.17, Y0 + 0.23, R - 0.04), 0.05)), overlap: true },
    { mat: "ash", solid: union(lathe([[0, 0], [0.16, 0], [0.11, 0.018], [0, 0.03]], 0, 0, 0, 16), ...lumps(6, 51, inCage(Y0 + 0.2, Y0 + 0.23, R - 0.05), 0.04)), overlap: true },
  ];
}

const P = (id: string, tris: number, f: () => Part[]) => prop({ id, items: ["brazier"], size: [0.4, 0.68, 0.4], place: "floor", where: "set", tris, parts: f });
P("coke-basket", 3400, burning);
P("coke-basket-cold", 2300, cold);

export const KIT_COKEBASKET = true;
