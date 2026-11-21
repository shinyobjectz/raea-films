// The Untergrundbahn's street entrances, winter 1917-18 (catalogue ubahn-entrance). The slice's underground stations
// opened 1907-13 (map/1917/underground.geojson): Leipziger Platz, Kaiserhof, Friedrichstraße, Hausvogteiplatz,
// Spittelmarkt, Inselbrücke, Klosterstraße, Alexanderplatz.
//   ubahn-kaiserhof   the Kaiserhof station's west entrance on Wilhelmplatz, Alfred Grenander, 1908 (destroyed 1936):
//                     after Berliner Architekturwelt 11 (March 1909) p. 472 and the Library of Congress's Bain photograph
//                     ggbain.27104 (both public domain). A long enclosure round the stair's opening: square piers of
//                     light stone studded with rosettes in a column on each outer face, a frieze beam along their tops,
//                     a low plinth and between the piers tall iron grilles with a band of ovals under their top rail; at
//                     the entrance two taller piers carry square lanterns, and an arched black board between them
//                     reads UNTERGRUNDBAHN. Below the street, the stair's tiled well: two flights of granite steps and
//                     a landing, iron handrails on brackets, the passage on to the booking hall at the bottom.
// Frame: origin on the ground at the entrance's middle, the stair going down toward -z. The world lane cuts the
// ground over UBAHN_CUT. ASSUMED: the sizes, scaled from the photographs on a 1.7 m walker (enclosure 3.2 by 9 m, piers
// 2.45 m to the frieze); the plan drawn straight (the photograph's is gently curved round its path); the stone a light
// sandstone (cast stone or painted iron would look alike in the photographs); the stair's depth and its landing.
import type { Solid } from "raea/3d";
import { manifold } from "raea/3d";
import { box, lathe, ring } from "./geo";
import { rod, sign } from "./outgeo";
import { type Part, prop } from "./prop";
import { Build } from "./vehicles";

/** The opening in the ground the world lane cuts for the stair: x within +-w/2, z from z0 down to z1. */
export const UBAHN_CUT = { w: 2.6, z0: -0.4, z1: -8.6 };

const PX = 1.45, PS = 0.32, FY = 2.45, PL = 0.5, ZP = [-0.16, -2.3, -4.45, -6.6, -8.75], ZF = ZP[ZP.length - 1];
const rosette = lathe([[0, 0], [0.05, 0], [0.046, 0.008], [0.028, 0.017], [0, 0.021]], 0, 0, 0, 8);
const facing = { px: (q: Solid) => q.rotate(0, 0, -90), nx: (q: Solid) => q.rotate(0, 0, 90), pz: (q: Solid) => q.rotate(90, 0, 0), nz: (q: Solid) => q.rotate(-90, 0, 0) };

/** A square lantern on a pedestal, its sides flaring upward under a hipped hood and finial; base at y. */
function lantern4(b: Build, x: number, y: number, z: number, s: number) {
  const r0 = 0.15 * s, r1 = 0.21 * s, h = 0.5 * s, at = (q: Solid) => q.rotate(0, 45, 0).move(x, y, z);
  b.add("iron-cast", at(lathe([[0, 0], [0.09, 0], [0.07, 0.06], [0.05, 0.16], [0.11 * s, 0.22], [r0 + 0.02, 0.24], [r0 + 0.02, 0.27], [0, 0.27]], 0, 0, 0, 4)));
  const y0 = 0.27, frame: Solid[] = [];
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; frame.push(rod([r0 * Math.cos(a), y0, r0 * Math.sin(a)], [r1 * Math.cos(a), y0 + h, r1 * Math.sin(a)], 0.014 * s)); }
  frame.push(lathe([[0, 0], [r1 + 0.05 * s, 0], [r1 + 0.06 * s, 0.03 * s], [0.07 * s, 0.26 * s], [0.07 * s, 0.3 * s], [0, 0.3 * s]], 0, y0 + h, 0, 4));
  frame.push(lathe([[0, 0], [0.04 * s, 0], [0.06 * s, 0.06 * s], [0.025 * s, 0.12 * s], [0.035 * s, 0.16 * s], [0, 0.24 * s]], 0, y0 + h + 0.3 * s, 0, 8));
  b.add("iron-cast", ...frame.map(at));
  b.add("glass-frost", at(lathe([[0, y0 + 0.01], [r0 - 0.006, y0 + 0.01], [r1 - 0.01, y0 + h - 0.01], [0, y0 + h - 0.01]], 0, 0, 0, 4)));
}

/** One bay of grille between two piers, in the plane x = 0 from z0 to z1 (moved into place after): bars on the plinth,
 *  a bottom rail, a top rail and under it a band of upright ovals. */
function grille(z0: number, z1: number): Solid[] {
  const s: Solid[] = [], n = Math.round(Math.abs(z1 - z0) / 0.11), dz = (z1 - z0) / n;
  for (let i = 1; i < n; i++) s.push(rod([0, PL + 0.06, z0 + i * dz], [0, 2.3, z0 + i * dz], 0.011));
  s.push(box(0.03, 0.04, Math.abs(z1 - z0), 0, PL + 0.1, (z0 + z1) / 2), box(0.03, 0.05, Math.abs(z1 - z0), 0, 2.26, (z0 + z1) / 2), box(0.03, 0.03, Math.abs(z1 - z0), 0, 1.93, (z0 + z1) / 2));
  for (let i = 1; i + 1 < n; i += 2) s.push(ring(0.085, 0.011, 12, 4).rotate(0, 90, 0).scale(1, 1.7, 1).move(0, 2.11, z0 + (i + 1) * dz));
  return s;
}

function kaiserhof(): Part[] {
  const b = new Build(), stone: Solid[] = [], studs: Solid[] = [], iron: Solid[] = [];
  // the piers along both long sides and the far end, each with a column of rosettes on its outer face; the plinth and
  // its coping; the frieze along the tops
  for (const s of [-1, 1]) for (const z of ZP.slice(1)) {
    stone.push(box(PS, FY, PS, s * PX, 0, z), box(PS + 0.06, 0.2, PS + 0.06, s * PX, 0, z));
    for (let k = 0; k < 9; k++) studs.push((s > 0 ? facing.px : facing.nx)(rosette).move(s * (PX + PS / 2), 0.62 + k * 0.2, z));
  }
  stone.push(box(PS, FY, PS, 0, 0, ZF), box(PS + 0.06, 0.2, PS + 0.06, 0, 0, ZF));
  for (const x of [-PX, 0, PX]) for (let k = 0; k < 9; k++) studs.push(facing.nz(rosette).move(x, 0.62 + k * 0.2, ZF - PS / 2));
  const L = Math.abs(ZF - ZP[0]) + PS, zm = (ZF + ZP[0]) / 2;
  for (const s of [-1, 1]) {
    stone.push(box(0.3, PL, L - 0.1, s * PX, 0, zm), box(0.36, 0.06, L - 0.1, s * PX, PL, zm), box(0.3, 0.27, L, s * PX, FY, zm), box(0.34, 0.05, L + 0.04, s * PX, FY + 0.27, zm));
    for (let z = ZP[0] - 0.3; z > ZF; z -= 0.3) studs.push((s > 0 ? facing.px : facing.nx)(rosette).move(s * (PX + 0.15), FY + 0.135, z));
  }
  stone.push(box(2 * PX, PL, 0.3, 0, 0, ZF), box(2 * PX, 0.06, 0.36, 0, PL, ZF), box(2 * PX + 0.3, 0.27, 0.3, 0, FY, ZF), box(2 * PX + 0.34, 0.05, 0.34, 0, FY + 0.27, ZF));
  for (let x = -PX + 0.3; x < PX - 0.1; x += 0.3) studs.push(facing.nz(rosette).move(x, FY + 0.135, ZF - 0.15));
  // the entrance piers, taller, with capitals, rosettes on their street faces and on their inner faces
  for (const s of [-1, 1]) {
    stone.push(box(0.36, 3.05, 0.36, s * PX, 0, ZP[0]), box(0.42, 0.2, 0.42, s * PX, 0, ZP[0]), box(0.44, 0.08, 0.44, s * PX, 2.9, ZP[0]), box(0.4, 0.07, 0.4, s * PX, 2.98, ZP[0]));
    for (let k = 0; k < 11; k++) studs.push(facing.pz(rosette).move(s * PX, 0.62 + k * 0.2, ZP[0] + 0.18), (s > 0 ? facing.nx : facing.px)(rosette).move(s * (PX - 0.18), 0.62 + k * 0.2, ZP[0]));
    lantern4(b, s * PX, 3.05, ZP[0], 1.3);
  }
  b.add("sandstone", ...stone);
  b.add("sandstone", ...studs);
  // the grilles: the long sides' four bays a side, the far end's two
  for (const s of [-1, 1]) for (let i = 0; i + 1 < ZP.length; i++) iron.push(...grille(ZP[i] - (i === 0 ? 0.18 : PS / 2), ZP[i + 1] + PS / 2).map((q) => q.move(s * PX, 0, 0)));
  for (const [x0, x1] of [[-PX + PS / 2, -PS / 2], [PS / 2, PX - PS / 2]]) iron.push(...grille(x0, x1).map((q) => q.rotate(0, 90, 0).move(0, 0, ZF)));
  b.add("iron-cast", ...iron);
  // the arched board between the lanterns: black, the letters set along the arch, an iron edge and end scrolls
  const R = 2.354, yc = 0.896, A = Math.asin(1.15 / R), zs = ZP[0], seg = 16, board: Solid[] = [];
  const pt = (r: number, t: number, z: number): [number, number, number] => [r * Math.sin(t), yc + r * Math.cos(t), z];
  for (let k = 0; k < seg; k++) {
    const t0 = -A + (2 * A * k) / seg, t1 = -A + (2 * A * (k + 1)) / seg;
    board.push(manifold.hull([pt(R - 0.17, t0, zs - 0.025), pt(R + 0.17, t0, zs - 0.025), pt(R - 0.17, t1, zs - 0.025), pt(R + 0.17, t1, zs - 0.025), pt(R - 0.17, t0, zs + 0.025), pt(R + 0.17, t0, zs + 0.025), pt(R - 0.17, t1, zs + 0.025), pt(R + 0.17, t1, zs + 0.025)]));
  }
  b.add("enamel-black", ...board);
  const word = "UNTERGRUNDBAHN", AL = A * 0.86, letters: Solid[] = [];
  for (let i = 0; i < word.length; i++) {
    const t = -AL + ((i + 0.5) * 2 * AL) / word.length, [x, y] = pt(R, t, 0);
    letters.push(sign(word[i], 0.19).rotate(0, 0, (-t * 180) / Math.PI).move(x, y, zs + 0.027));
  }
  b.add("paint-white", ...letters);
  const rim: Solid[] = [];
  for (const r of [R + 0.18, R - 0.18]) for (let k = 0; k < seg; k++) rim.push(rod(pt(r, -A + (2 * A * k) / seg, zs), pt(r, -A + (2 * A * (k + 1)) / seg, zs), 0.012));
  for (const s of [-1, 1]) rim.push(ring(0.07, 0.01, 14, 4).move(s * 1.2, 2.83, zs), rod([s * 1.15, 3.06, zs], [s * 1.27, 3.06, zs], 0.012), rod([s * 1.15, 2.72, zs], [s * 1.27, 2.72, zs], 0.012));
  b.add("iron-cast", ...rim);
  // ── below the street: the stair's tiled well, two flights of granite steps and a landing, handrails, the passage
  const { w, z0 } = UBAHN_CUT, RI = 0.16, GO = 0.3, n = 12, steps: Solid[] = [], ZB = -10.2;
  for (let i = 0; i < n; i++) steps.push(box(w, 0.22, GO + 0.02, 0, -RI * (i + 1) - 0.22 + 0.0, z0 - GO * (i + 0.5)));
  const zl0 = z0 - GO * n, zl1 = zl0 - 1.4, yl = -RI * n;
  steps.push(box(w, 0.22, 1.4, 0, yl - 0.22, (zl0 + zl1) / 2));
  for (let i = 0; i < n; i++) steps.push(box(w, 0.22, GO + 0.02, 0, yl - RI * (i + 1) - 0.22, zl1 - GO * (i + 0.5)));
  const zb = zl1 - GO * n, yb = yl - RI * n;
  steps.push(box(w, 0.22, Math.abs(ZB - zb), 0, yb - 0.22, (zb + ZB) / 2), box(w + 0.3, 0.12, 0.4, 0, -0.12, z0 + 0.2));
  b.add("granite", ...steps);
  const D = -yb + 0.4;
  b.add("tile-white", ...[-1, 1].map((s) => box(0.15, D, Math.abs(ZB - z0), s * (w / 2 + 0.075), -D, (z0 + ZB) / 2)), box(w + 0.3, 0.3, Math.abs(ZB - UBAHN_CUT.z1), 0, -0.3, (UBAHN_CUT.z1 + ZB) / 2), box(w + 0.3, D, 0.15, 0, -D, ZB - 0.075).minus(box(1.9, 2.4, 0.4, 0, yb, ZB - 0.075)));
  b.add("cloth-black", box(1.9, 2.4, 0.05, 0, yb, ZB - 0.6));
  const rail: Solid[] = [], H = 0.9, line: [number, number][] = [[z0, 0], [zl0, yl], [zl1, yl], [zb, yb], [ZB + 0.3, yb]];
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.07);
    for (let i = 0; i + 1 < line.length; i++) rail.push(rod([x, line[i][1] + H, line[i][0]], [x, line[i + 1][1] + H, line[i + 1][0]], 0.022));
    for (const [zz, yy] of [[(zl0 + zl1) / 2, yl], [zl1 - 1.2, yl - 0.64], [zl1 - 2.6, yl - 1.39]]) rail.push(rod([x, yy + H, zz], [s * (w / 2), yy + H - 0.06, zz], 0.01));
    // the upper flight, the one seen from the street, has a barred balustrade under its rail and a newel at the top
    for (let z = z0 - 0.15; z > zl0; z -= 0.15) {
      const top = -RI * (Math.floor((z0 - z) / GO) + 1), yr = ((z0 - z) / (z0 - zl0)) * yl + H;
      rail.push(rod([x, top, z], [x, yr, z], 0.009));
    }
    rail.push(rod([x, 0, z0], [x, H + 0.08, z0], 0.022), rod([x, 0.1, z0], [x, yl + 0.1, zl0], 0.012));
  }
  b.add("iron", ...rail);
  return b.parts();
}

prop({ id: "ubahn-kaiserhof", items: ["ubahn-entrance"], size: [3.4, 4.3, 10.4], place: "floor", where: "set", tris: 52000, parts: kaiserhof });

export const KIT_UBAHN = true;
