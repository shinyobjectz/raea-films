// Berlin's older street pumps, the iron tube pumps (catalogue pump-tube, Rohrbrunnen). From the 1870s to 1890 the city
// set up 450 of them in six forms, three by the engineer Otto Greiner and three by the well-builder Louis Lohde; 118
// still stood in 1937 (de.wikipedia "Formen Berliner Straßenbrunnen"; Commons "Eiserner Rohrbrunnen Lohde I-III" and
// "Greiner I-III", archive photographs of 1930, public domain). Each is a tall tapering iron column with a capital, a
// lidded top and a finial, a spout two thirds up, and at its foot the pull handle: a short baluster with a stirrup grip
// drawn straight up and pushed down, not a swinging lever. A round drain is let into the pavement under the spout.
//   pump-lohde           Lohde I: a drum foot, the column swelling over it with a band of foliage, a framed panel on
//                        the taper, a cushion capital and a leafy dome, a beast's head for the spout, a tall curved
//                        blade beside the handle
//   pump-greiner         Greiner II: a bell foot, a plain column scattered with rosettes, an ornamented band round the
//                        spout, a long tube spout with a bell mouth, a broad flat cap, a flame finial, a rounded plate
//                        beside the handle
//   pump-greiner-square  Greiner III: a square column waisted between foot and head on a stone plinth, a cartouche
//                        and a hanging garland on its faces, a cornice with shells, a square dome, a crown finial, a
//                        beast's head for the spout from its side
// ASSUMED: the sizes, scaled from the photographs on the setts and kerbs (about 2.2 m to the finial); the dark green
// paint of the Lauchhammer pumps; the blade and plate as guards for the handle's rod; the drain's grate.
// Frame: the column's axis at the origin on the pavement, the spout toward +z (the road), the handle at +x.
import { crossSection, type Solid } from "raea/3d";
import { tube } from "./forms";
import { ball, box, lathe, ring, union, type V3 } from "./geo";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";
import { spout } from "./pumps";

type P2 = [number, number];
const D = Math.PI / 180;

/** A polygon wound counter-clockwise, whichever way it was written. */
const poly = (pts: P2[]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return crossSection.polygon(a < 0 ? [...pts].reverse() : pts);
};
/** A flat cast plate drawn in (x, y), t thick, centred on z. */
const plate = (pts: P2[], z: number, t = 0.024) => poly(pts).extrude(t).move(0, 0, z - t / 2);
/** A turned profile's radius at height y. */
function rAt(prof: P2[], y: number): number {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (y1 > y0 && y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return 0.2;
}
/** A relief lump on a turned surface: a flattened ellipsoid (w across, h up, d out) at angle a (degrees from +z). */
/** An ellipsoid of half-axes w, h, d, its facets those of a ball its own size. */
const ell = (w: number, h: number, d: number) => { const m = Math.max(w, h, d); return ball(m).scale(w / m, h / m, d / m); };
const lump = (r: number, y: number, a: number, w: number, h: number, d: number) => ell(w, h, d).rotate(0, a, 0).move(r * Math.sin(a * D), y, r * Math.cos(a * D));
/** A rosette stud facing out at angle a. */
const rosette = (r: number, y: number, a: number, s = 1) => lathe([[0, 0], [0.026 * s, 0], [0.022 * s, 0.008 * s], [0.012 * s, 0.014 * s], [0, 0.016 * s]], 0, 0, 0, 8).rotate(90, 0, 0).rotate(0, a, 0).move(r * Math.sin(a * D), y, r * Math.cos(a * D));

/** The pull handle at (x, z): a baluster housing the rod, the rod and its stirrup grip, the grip along z. */
function handle(x: number, z: number): Solid[] {
  return [
    lathe([[0, 0], [0.075, 0], [0.075, 0.04], [0.06, 0.06], [0.058, 0.32], [0.068, 0.34], [0.068, 0.37], [0.055, 0.39], [0.07, 0.46], [0.062, 0.53], [0.04, 0.58], [0.035, 0.62], [0.05, 0.64], [0.05, 0.67], [0, 0.67]], x, 0, z, 16),
    rod([x, 0.66, z], [x, 0.77, z], 0.014),
    rod([x, 0.76, z - 0.045], [x, 0.76, z + 0.045], 0.013),
    ...[-1, 1].map((k) => rod([x, 0.76, z + k * 0.045], [x, 0.85, z + k * 0.045], 0.011)),
    rod([x, 0.85, z - 0.068], [x, 0.85, z + 0.068], 0.016),
  ];
}

/** The drain under the spout at z: a granite ring and an iron grate of bars over a dark bottom, a few mm proud. */
function drain(z: number): { stone: Solid; iron: Solid } {
  const disc = (r: number, y0: number, y1: number) => lathe([[0, y0], [r, y0], [r, y1], [0, y1]], 0, 0, 0, 24);
  const bars = union(...Array.from({ length: 9 }, (_, i) => box(0.014, 0.02, 0.34, (i - 4) * 0.034, -0.016, 0)));
  return {
    stone: disc(0.24, -0.08, 0.003).minus(disc(0.16, -0.2, 0.1)).move(0, 0, z),
    iron: union(disc(0.16, -0.02, 0.001), bars.intersect(disc(0.155, -0.1, 0.1)), ring(0.155, 0.008, 24, 4).rotate(90, 0, 0).move(0, -0.004, 0)).move(0, 0, z),
  };
}

const LOHDE: P2[] = [[0, 0], [0.26, 0], [0.26, 0.05], [0.24, 0.07], [0.24, 0.3], [0.255, 0.32], [0.255, 0.36], [0.225, 0.4], [0.22, 0.43], [0.235, 0.58], [0.237, 0.8], [0.222, 1.0], [0.2, 1.3], [0.18, 1.6], [0.168, 1.74], [0.185, 1.75], [0.185, 1.79], [0.168, 1.81], [0.168, 1.85], [0.2, 1.89], [0.232, 1.94], [0.236, 1.99], [0.2, 2.01], [0.17, 2.03], [0.12, 2.08], [0.06, 2.11], [0.03, 2.12], [0.032, 2.14], [0.05, 2.17], [0.046, 2.21], [0.022, 2.24], [0, 2.25]];

function lohde(): Part[] {
  const iron: Solid[] = [lathe(LOHDE, 0, 0, 0, 32)];
  // the band of foliage round the swelling, between two rings
  for (const y of [0.6, 0.98]) iron.push(lathe([[0, 0], [rAt(LOHDE, y) + 0.012, 0], [rAt(LOHDE, y) + 0.012, 0.025], [0, 0.025]], 0, y, 0, 32));
  for (let k = 0; k < 14; k++) for (const [y, off] of [[0.7, 0], [0.87, 0.5]]) iron.push(lump(rAt(LOHDE, y) - 0.005, y, ((k + off) / 14) * 360, 0.042, 0.075, 0.018));
  // the leaves round the dome
  for (let k = 0; k < 10; k++) iron.push(lump(0.15, 2.05, (k / 10) * 360, 0.035, 0.03, 0.012));
  // the framed panel on the taper, toward the handle
  const shield: P2[] = [[-0.085, 1.68], [-0.06, 1.68], [-0.05, 1.66], [0.05, 1.66], [0.06, 1.68], [0.085, 1.68], [0.085, 1.36], [0.06, 1.29], [0, 1.24], [-0.06, 1.29], [-0.085, 1.36], [-0.085, 1.68]];
  iron.push(...tube(shield.map(([u, y]): V3 => { const r = rAt(LOHDE, y) + 0.003, p = u / r; return [r * Math.cos(p), y, r * Math.sin(p)]; }), 0.008));
  // the spout, a beast's head; the outlet knob on the drum behind; the blade beside the handle; the handle
  iron.push(...spout("dragon").map((s) => s.move(0, 0.62, 0.02)));
  iron.push(ball(0.08).scale(1, 0.9, 0.6).move(0, 0.2, -0.25));
  iron.push(plate([[0.17, 0], [0.37, 0], [0.395, 0.14], [0.37, 0.38], [0.31, 0.68], [0.25, 0.92], [0.2, 1.1], [0.17, 1.12]], 0.07));
  iron.push(...handle(0.34, -0.06));
  const dr = drain(0.52);
  return [{ mat: "paint-green", solid: union(...iron) }, { mat: "iron", solid: dr.iron, overlap: true }, { mat: "granite", solid: dr.stone, overlap: true }];
}

const GREINER: P2[] = [[0, 0], [0.29, 0], [0.29, 0.03], [0.27, 0.06], [0.245, 0.14], [0.222, 0.28], [0.21, 0.42], [0.215, 0.46], [0.215, 0.5], [0.2, 0.52], [0.195, 0.9], [0.185, 1.37], [0.205, 1.38], [0.205, 1.42], [0.188, 1.43], [0.185, 1.64], [0.205, 1.65], [0.205, 1.69], [0.182, 1.7], [0.175, 1.78], [0.195, 1.81], [0.212, 1.85], [0.212, 1.87], [0.24, 1.89], [0.245, 1.92], [0.238, 1.95], [0.2, 1.97], [0.15, 2.0], [0.09, 2.03], [0.04, 2.05], [0.028, 2.06], [0.04, 2.08], [0.052, 2.12], [0.045, 2.16], [0.025, 2.2], [0, 2.23]];

function greiner(): Part[] {
  const iron: Solid[] = [lathe(GREINER, 0, 0, 0, 32)];
  // the ornamented band round the spout, rosettes scattered on the column
  for (let k = 0; k < 16; k++) for (const [y, off] of [[1.48, 0], [1.59, 0.5]]) iron.push(lump(0.18, y, ((k + off) / 16) * 360, 0.03, 0.05, 0.016));
  for (const [a, y] of [[20, 0.75], [75, 1.05], [130, 0.85], [200, 1.2], [250, 0.7], [310, 1.0], [350, 1.25], [100, 1.3], [170, 0.62], [280, 1.28]]) iron.push(rosette(rAt(GREINER, y) - 0.002, y, a));
  // the tube spout with an acanthus collar and a bell mouth turned down
  const end: V3 = [0, 1.46, 0.46], dir = [0, 1.46 - 1.55, 0.46 - 0.17], th = Math.atan2(dir[2], dir[1]) / D;
  iron.push(rod([0, 1.55, 0.15], end, 0.03), ball(0.06).scale(1, 1, 0.8).move(0, 1.55, 0.2), lathe([[0, 0], [0.032, 0], [0.04, 0.03], [0.052, 0.06], [0.056, 0.075], [0, 0.075]], 0, 0, 0, 16).rotate(th, 0, 0).move(...end));
  // the rounded plate beside the handle, and the handle
  iron.push(plate([[0.18, 0.02], [0.33, 0], [0.41, 0.12], [0.44, 0.32], [0.42, 0.52], [0.36, 0.7], [0.27, 0.82], [0.19, 0.86]], 0.08));
  iron.push(...handle(0.38, -0.06));
  const dr = drain(0.6);
  return [{ mat: "paint-green", solid: union(...iron) }, { mat: "iron", solid: dr.iron, overlap: true }, { mat: "granite", solid: dr.stone, overlap: true }];
}

/** Greiner III's square shaft: its half-width at y, waisted to 0.165 a little above the middle. */
const Y0 = 0.36, Y1 = 1.72, half = (y: number) => 0.165 + 0.149 * ((y - Y0) / (Y1 - Y0) - 0.55) ** 2;

function greinerSquare(): Part[] {
  const iron: Solid[] = [], stone: Solid[] = [];
  // the plinth (stone) and the iron base moulding on it
  stone.push(box(0.5, 0.33, 0.5, 0, 0, 0), box(0.46, 0.02, 0.46, 0, 0.33, 0));
  iron.push(box(0.45, 0.03, 0.45, 0, 0.33, 0));
  // the waisted shaft: its side profile in x and in z, the corners chamfered by the same turned 45 degrees
  const edge: P2[] = [];
  for (let i = 0; i <= 14; i++) { const y = Y0 + ((Y1 - Y0) * i) / 14; edge.push([half(y), y]); }
  const prof = poly([...edge, ...edge.map(([x, y]): P2 => [-x, y]).reverse()]).extrude(0.8).move(0, 0, -0.4);
  const sq = prof.intersect(prof.rotate(0, 90, 0));
  iron.push(sq.intersect(sq.scale(1.32, 1, 1.32).rotate(0, 45, 0)));
  // the cornice, shells at its corners and mid-faces, the square dome, the crown
  iron.push(box(0.42, 0.03, 0.42, 0, Y1, 0), box(0.48, 0.05, 0.48, 0, Y1 + 0.03, 0), box(0.45, 0.03, 0.45, 0, Y1 + 0.08, 0));
  for (let k = 0; k < 4; k++) {
    const a = k * 90;
    iron.push(ell(0.055, 0.04, 0.02).rotate(0, a + 45, 0).move(0.2 * Math.sin((a + 45) * D) * 1.414, Y1 + 0.13, 0.2 * Math.cos((a + 45) * D) * 1.414));
    iron.push(ell(0.07, 0.045, 0.02).rotate(0, a, 0).move(0.205 * Math.sin(a * D), Y1 + 0.13, 0.205 * Math.cos(a * D)));
  }
  iron.push(lathe([[0, 0], [0.32, 0], [0.29, 0.05], [0.21, 0.1], [0.13, 0.13], [0.07, 0.14], [0, 0.14]], 0, 0, 0, 4).rotate(0, 45, 0).move(0, Y1 + 0.11, 0));
  const yc = Y1 + 0.25;
  iron.push(lathe([[0, 0], [0.06, 0], [0.045, 0.03], [0.035, 0.05], [0.05, 0.06], [0.068, 0.11], [0.07, 0.14], [0, 0.14]], 0, yc, 0, 16), ball(0.03).move(0, yc + 0.17, 0));
  for (let k = 0; k < 6; k++) iron.push(ball(0.017).move(0.062 * Math.sin((k * 60) * D), yc + 0.15, 0.062 * Math.cos((k * 60) * D)));
  // a cartouche on each face but the spout's: an oval frame, its field, scrolls, a crest, a garland hung beneath
  for (const a of [90, 180, 270]) {
    const out = (d: number, y: number, u: number): V3 => [d * Math.sin(a * D) + u * Math.cos(a * D), y, d * Math.cos(a * D) - u * Math.sin(a * D)];
    const at = (s: Solid, d: number, y: number, u = 0) => s.rotate(0, a, 0).move(...out(d, y, u));
    const yC = 1.43, d0 = half(yC);
    iron.push(at(ring(0.085, 0.013, 24, 6).scale(1, 1.3, 1), d0, yC), at(lathe([[0, 0], [0.08, 0], [0.078, 0.008], [0, 0.012]], 0, 0, 0, 20).rotate(90, 0, 0).scale(1, 1.3, 1), d0, yC));
    for (const [u, y] of [[-0.1, 1.55], [0.1, 1.55], [-0.1, 1.31], [0.1, 1.31]]) iron.push(at(ball(0.026).scale(1, 1, 0.5), half(y), y, u));
    iron.push(at(ball(0.035).scale(1.3, 0.8, 0.5), half(1.58), 1.58));
    for (let i = 0; i <= 8; i++) { const u = -0.1 + 0.025 * i, y = 1.24 - 0.11 * (1 - (u / 0.1) ** 2); iron.push(at(ball(0.02).scale(1, 1, 0.6), half(y), y, u)); }
    for (const y of [1.08, 1.02, 0.97]) iron.push(at(ball(0.022 - (1.08 - y) * 0.08).scale(1, 1.2, 0.6), half(y), y));
  }
  // the spout from the +z face, the handle in front
  iron.push(...spout("dragon").map((s) => s.move(0, 1.5 - 0.84, half(1.5) - 0.17)));
  iron.push(...handle(0.34, -0.06));
  const dr = drain(0.55);
  stone.push(dr.stone);
  return [{ mat: "paint-green", solid: union(...iron) }, { mat: "iron", solid: dr.iron, overlap: true }, { mat: "granite", solid: union(...stone), overlap: true }];
}

const P = (id: string, size: V3, tris: number, f: () => Part[]) => prop({ id, items: ["pump-tube"], size, place: "floor", where: "set", tris, parts: f });
P("pump-lohde", [0.6, 2.25, 0.85], 24000, lohde);
P("pump-greiner", [0.6, 2.23, 0.85], 8000, greiner);
P("pump-greiner-square", [0.5, 2.15, 0.85], 22000, greinerSquare);

export const KIT_TUBEPUMP = true;
