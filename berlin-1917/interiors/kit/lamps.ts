// Berlin's gas street lamps by winter 1917-18, every one with Auer mantles since 1898 (27,000 lamps), in cast iron
// (no brass: copper and brass fittings were seized in 1917):
//   lamp-model        the Modellleuchte of 1892-93: a six-sided lantern widening upward under a six-sided hood with a
//                     finial, on a Bündelpfeilermast (a bundled-pier mast) with the lamplighter's ladder bar
//   lamp-candelabra   a three-armed candelabrum on a tall fluted mast, for squares and bridges, three small lanterns
//   lamp-hanging      a hanging lamp from a Bischofsstab (crozier) mast of 1908, the pressure-gas lantern hung from the
//                     hook's end over the carriageway
//   lamp-wall         a four-sided lantern on a scroll bracket, for a gateway or a court
//   lamp-arc          an electric arc lamp, only on the prestige streets (Leipziger Straße and Potsdamer Platz from
//                     1882, the Linden; catalogue arc-lamp): a tall mast whose crook hangs the lamp over the kerb's edge
//                     of the carriageway, an opal globe under a hood that holds the carbons' regulator, the winch box
//                     at the mast's foot to lower it for new carbons. Heights ASSUMED (lantern at 7.5 m)
// Origin at the foot of the mast (the wall's face for lamp-wall, the lantern toward +z). The mantles are their own
// part (mat mantle): the world lane lights or darkens them, since gas was rationed and many lamps stood dark.
// Paint: dark green-grey (ASSUMED: modern restorations; period photographs are black and white).
import type { Solid } from "raea/3d";
import { ball, box, lathe, post, rodX, taper, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const PAINT: MatId = "iron";

/** The six-sided lantern: its frame, glass, hood and finial, and its mantles; s scales it, the base at y. */
function lantern6(s: number, y: number): { frame: Solid; glass: Solid; mantle: Solid } {
  const r0 = 0.16 * s, r1 = 0.27 * s, h = 0.55 * s, frame: Solid[] = [];
  frame.push(lathe([[0, 0], [r0 + 0.02, 0], [r0 + 0.02, 0.04 * s], [0, 0.04 * s]], 0, y, 0, 6)); // the bottom ring
  frame.push(lathe([[0, -0.14 * s], [0.04 * s, -0.14 * s], [r0, 0], [0, 0]], 0, y, 0, 6)); // the drip cone under it
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; frame.push(rod([r0 * Math.cos(a), y, r0 * Math.sin(a)], [r1 * Math.cos(a), y + h, r1 * Math.sin(a)], 0.012 * s)); }
  frame.push(lathe([[0, 0], [r1 + 0.04 * s, 0], [r1 + 0.05 * s, 0.03 * s], [0.06 * s, 0.28 * s], [0.06 * s, 0.32 * s], [0, 0.32 * s]], 0, y + h, 0, 6)); // the hood
  frame.push(lathe([[0, 0], [0.05 * s, 0], [0.07 * s, 0.05 * s], [0.03 * s, 0.1 * s], [0.04 * s, 0.14 * s], [0, 0.2 * s]], 0, y + h + 0.32 * s, 0, 8)); // the vent cap and finial
  const glass = lathe([[0, 0.02 * s], [r0 - 0.005, 0.02 * s], [r1 - 0.01, h - 0.01], [0, h - 0.01]], 0, y, 0, 6);
  const mantle = union(...[-1, 0, 1].map((k) => ball(0.025 * s).scale(1, 1.6, 1).move(k * 0.05 * s, y + 0.2 * s, 0)));
  return { frame: union(...frame), glass, mantle };
}

/** A bundled-pier mast: four slender shafts round a core from y0 to y1, rings binding them. */
function bundle(y0: number, y1: number, r: number): Solid {
  const s: Solid[] = [post(r * 0.8, y1 - y0, 0, y0, 0)];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; s.push(post(r * 0.45, y1 - y0, r * Math.cos(a), y0, r * Math.sin(a))); }
  for (const f of [0, 0.33, 0.66, 1]) s.push(lathe([[0, -0.02], [r * 1.55, -0.02], [r * 1.55, 0.02], [0, 0.02]], 0, y0 + (y1 - y0) * f, 0, 12));
  return union(...s);
}

function model(): Part[] {
  const base = lathe([[0, 0], [0.2, 0], [0.2, 0.08], [0.16, 0.12], [0.15, 0.42], [0.18, 0.46], [0.13, 0.52], [0, 0.52]], 0, 0, 0, 8);
  const mast = bundle(0.52, 3.05, 0.07);
  const cap = lathe([[0, 0], [0.09, 0], [0.16, 0.12], [0.17, 0.16], [0, 0.16]], 0, 3.05, 0, 8);
  const ladder = rodX(0.018, 0.62, 0, 2.9, 0); // the lamplighter's ladder rests on this bar
  const l = lantern6(1, 3.21);
  return [{ mat: PAINT, solid: union(base, mast, cap, ladder, l.frame) }, { mat: "glass-plate", solid: l.glass, overlap: true }, { mat: "mantle", solid: l.mantle, overlap: true }];
}

function candelabra(): Part[] {
  const fr: Solid[] = [], gl: Solid[] = [], ma: Solid[] = [];
  fr.push(lathe([[0, 0], [0.32, 0], [0.32, 0.12], [0.26, 0.18], [0.24, 0.7], [0.28, 0.76], [0.18, 0.86], [0, 0.86]], 0, 0, 0, 8));
  // the fluted shaft: a core with eight flutes standing proud, tapering
  fr.push(lathe([[0, 0], [0.1, 0], [0.075, 3.6], [0, 3.6]], 0, 0.86, 0, 8));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; fr.push(rod([0.1 * Math.cos(a), 0.9, 0.1 * Math.sin(a)], [0.075 * Math.cos(a), 4.4, 0.075 * Math.sin(a)], 0.014)); }
  fr.push(lathe([[0, 0], [0.12, 0], [0.2, 0.15], [0.12, 0.25], [0, 0.25]], 0, 4.46, 0, 8), rodX(0.016, 0.7, 0, 4.1, 0));
  const lan = lantern6(0.8, 0);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 2, c = Math.cos(a), s = Math.sin(a), R = 0.75;
    // each arm sweeps out and up: three straight pieces and a scroll under them
    fr.push(rod([0.08 * c, 4.55, 0.08 * s], [0.45 * c, 4.7, 0.45 * s], 0.025), rod([0.45 * c, 4.7, 0.45 * s], [R * c, 4.66, R * s], 0.025), rod([R * c, 4.66, R * s], [R * c, 4.78, R * s], 0.025));
    fr.push(rod([0.1 * c, 4.35, 0.1 * s], [0.4 * c, 4.62, 0.4 * s], 0.012));
    fr.push(lan.frame.move(R * c, 4.8, R * s)); gl.push(lan.glass.move(R * c, 4.8, R * s)); ma.push(lan.mantle.move(R * c, 4.8, R * s));
  }
  // the top: a fourth lantern on the shaft's crown
  fr.push(lan.frame.move(0, 4.71, 0)); gl.push(lan.glass.move(0, 4.71, 0)); ma.push(lan.mantle.move(0, 4.71, 0));
  return [{ mat: PAINT, solid: union(...fr) }, { mat: "glass-plate", solid: union(...gl), overlap: true }, { mat: "mantle", solid: union(...ma), overlap: true }];
}

function hanging(): Part[] {
  const fr: Solid[] = [];
  fr.push(lathe([[0, 0], [0.22, 0], [0.22, 0.1], [0.17, 0.16], [0.15, 0.9], [0.19, 0.95], [0.11, 1.05], [0, 1.05]], 0, 0, 0, 8));
  fr.push(lathe([[0, 0], [0.085, 0], [0.06, 5.0], [0, 5.0]], 0, 1.05, 0, 10));
  // the crozier: the mast bends over toward +z in a quarter circle and curls back at its end
  const R = 0.85, Y = 6.05, pts: V3[] = [];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 0.75; pts.push([0, Y + R * Math.sin(a), R - R * Math.cos(a)]); }
  for (let i = 1; i < pts.length; i++) fr.push(rod(pts[i - 1], pts[i], 0.05));
  // the arm out to the hanger, a scroll under it
  const end: V3 = [0, Y + 0.45, 1.75];
  fr.push(rod(pts[pts.length - 1], end, 0.04), rod([0, Y - 0.4, 0.05], [0, Y + 0.3, 1.2], 0.018));
  fr.push(lathe([[0, 0], [0.12, 0], [0.12, 0.03], [0, 0.03]], end[0], end[1], end[2], 10));
  // the pressure-gas lantern: a bell hood, a round glass body, a bowl under it, hung on a short rod
  const ly = end[1] - 0.75;
  fr.push(rod([0, end[1], 1.75], [0, ly + 0.55, 1.75], 0.012), lathe([[0, 0], [0.26, 0], [0.22, 0.08], [0.1, 0.18], [0.05, 0.22], [0, 0.22]], 0, ly + 0.36, 1.75, 16));
  const glass = lathe([[0, 0], [0.12, 0.01], [0.2, 0.12], [0.22, 0.24], [0.21, 0.36], [0, 0.36]], 0, ly, 1.75, 16);
  const mantle = union(...[0, 1, 2, 3].map((k) => ball(0.03).scale(1, 1.6, 1).move(0.06 * Math.cos(k * 1.57), ly + 0.18, 1.75 + 0.06 * Math.sin(k * 1.57))));
  return [{ mat: PAINT, solid: union(...fr) }, { mat: "glass-frost", solid: glass, overlap: true }, { mat: "mantle", solid: mantle, overlap: true }];
}

function wall(): Part[] {
  const fr: Solid[] = [];
  fr.push(box(0.14, 0.3, 0.02, 0, -0.15, 0.01)); // the wall plate
  fr.push(rod([0, 0.1, 0.02], [0, 0.1, 0.58], 0.016), rod([0, -0.12, 0.02], [0, 0.08, 0.35], 0.012));
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI * 1.5; fr.push(rod([0, -0.02 + 0.08 * Math.sin(a), 0.3 + 0.08 * Math.cos(a)], [0, -0.02 + 0.08 * Math.sin(a + 0.6), 0.3 + 0.08 * Math.cos(a + 0.6)], 0.008)); }
  const l = lantern6(0.75, 0.2); // standing on the arm
  return [{ mat: PAINT, solid: union(...fr, l.frame.move(0, 0, 0.58)) }, { mat: "glass-plate", solid: l.glass.move(0, 0, 0.58), overlap: true }, { mat: "mantle", solid: l.mantle.move(0, 0, 0.58), overlap: true }];
}

function arc(): Part[] {
  const H = 8.6, iron: Solid[] = [];
  iron.push(lathe([[0, 0], [0.26, 0], [0.26, 0.12], [0.2, 0.2], [0.17, 1.6], [0.21, 1.68], [0.13, 1.8], [0, 1.8]], 0, 0, 0, 12));
  iron.push(taper(0.11, 0.07, H - 1.8, 0, 1.8, 0));
  for (const y of [1.8, 4.2, 6.4]) iron.push(lathe([[0, -0.03], [0.14, -0.03], [0.14, 0.03], [0, 0.03]], 0, y + 0.03, 0, 12));
  // the crook: up and over toward +z in a quarter circle, the lamp's pulley at its end
  const R = 1.1, pts: V3[] = [];
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); pts.push([0, H + Math.sin(a) * R * 0.5, R - Math.cos(a) * R]); }
  for (let i = 0; i < 10; i++) iron.push(rod(pts[i], pts[i + 1], 0.045));
  const tip = pts[10];
  iron.push(lathe([[0, -0.03], [0.08, -0.03], [0.08, 0.03], [0, 0.03]], 0, 0, 0, 12).rotate(0, 0, 90).move(tip[0], tip[1] - 0.05, tip[2]));
  // the winch box at the foot, its crank's boss, and the lamp's rope up the mast
  iron.push(box(0.22, 0.4, 0.14, 0, 0.6, 0.24), lathe([[0, 0], [0.04, 0], [0.04, 0.05], [0, 0.05]], 0, 0, 0, 8).rotate(90, 0, 0).move(0, 0.82, 0.31));
  const LY = 7.5, lx = tip[0], lz = tip[2];
  const rope = rod([lx, tip[1] - 0.1, lz], [lx, LY + 0.9, lz], 0.006);
  // the lamp: its hood and the regulator's case above the globe, a drip ring, the opal globe, the ash pan
  iron.push(lathe([[0, 0], [0.32, 0], [0.12, 0.18], [0.1, 0.62], [0.06, 0.7], [0.03, 0.9], [0, 0.9]], lx, LY + 0.0, lz, 14));
  iron.push(lathe([[0.26, -0.02], [0.3, -0.02], [0.3, 0.02], [0.26, 0.02]], lx, LY - 0.03, lz, 14), lathe([[0, -0.06], [0.03, -0.06], [0.05, 0], [0, 0]], lx, LY - 0.6, lz, 10));
  const globe = lathe([[0, 0], [0.12, 0.02], [0.24, 0.16], [0.26, 0.3], [0.22, 0.46], [0.14, 0.56], [0, 0.56]], lx, LY - 0.58, lz, 18);
  const flame = ball(0.03).move(lx, LY - 0.25, lz);
  return [{ mat: PAINT, solid: union(...iron, rope) }, { mat: "glass-frost", solid: globe, overlap: true }, { mat: "mantle", solid: flame, overlap: true }];
}

prop({ id: "lamp-model", items: ["gas-lamp"], size: [0.62, 4.4, 0.62], place: "floor", where: "set", tris: 9000, parts: model });
prop({ id: "lamp-candelabra", items: ["gas-lamp"], size: [1.9, 5.6, 1.9], place: "floor", where: "set", tris: 22000, parts: candelabra });
prop({ id: "lamp-hanging", items: ["gas-lamp"], size: [0.6, 7.2, 2.1], place: "floor", where: "set", tris: 9000, parts: hanging });
prop({ id: "lamp-arc", items: ["arc-lamp"], size: [0.7, 9.3, 1.6], place: "floor", where: "set", tris: 12000, parts: arc, glow: [{ at: [0, 7.1, 1.1], lumens: 9000, color: "#eef2ff", range: 30, body: [0, 7.25, 1.1] }] });
prop({ id: "lamp-wall", items: ["gas-lamp"], size: [0.45, 1.0, 0.85], place: "wall", where: "set", tris: 5000, parts: wall });

export const KIT_LAMPS = true;
