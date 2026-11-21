// Berlin's street pumps (catalogue street-pump). Piped water reached the houses from 1856, but the city kept its
// pumps for emergencies and the fire brigade. From 1894 to 1897 it set up about 320 neo-baroque cast-iron pumps,
// designed by Otto Stahn and cast at Lauchhammer. They are broad and squat: a square foot, a round body with the spout
// at hip height, a column, a square head, a long handle. Seen whole they stand about 2 m. A granite trough stone
// (Tränkstein) was set in the kerb under the spout for horses, dogs and birds. They came in three types (de.wikipedia
// "Formen Berliner Straßenbrunnen"; Berliner Mieterverein 4/2020):
//   pump-fish          type I: a flat dome with a pine cone, a fish's head for the spout, fish on the foot, a frog on
//                      the head opposite the handle's hook
//   pump-dragon        type II: a taller scaled cone with a knob, a dragon's head for the spout
//   pump-crown         type III: a mural crown on the head like the Berlin bear's, a fabled beast for the spout,
//                      the Berlin arms (the bear on a shield) on all four faces of the foot
//   pump-fish-ice      type I in a hard frost: snow on the head and cornices, icicles at the spout, the trough
//                      frozen and a frozen spill running to the gutter
// The (slender, fluted) Krause pumps came only from 1925, so they are left out.
// ASSUMED: the dimensions, taken from photographs; the dark green paint; the handle resting raised.
// Frame: the foot on the pavement, the spout toward +z (the road), the handle toward -z; the trough stone flush with
// the pavement in front.
import { crossSection, type Solid } from "raea/3d";
import { ball, box, lathe, union } from "./geo";
import type { MatId } from "./mats";
import { rod, scanned } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
type Kind = "fish" | "dragon" | "crown";

/** A polygon wound counter-clockwise, whichever way it was written. */
const poly = (pts: [number, number][]) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return crossSection.polygon(a < 0 ? [...pts].reverse() : pts);
};
/** Flat reliefs, built facing +z about the origin. */
function fish(): Solid {
  return union(ball(0.03).scale(2.2, 0.9, 0.35), poly([[0.06, 0], [0.1, 0.035], [0.1, -0.035]]).extrude(0.01), ball(0.006).move(-0.045, 0.008, 0.008), poly([[-0.01, 0.02], [0.03, 0.02], [0.02, 0.04]]).extrude(0.006));
}
function bear(): Solid {
  return union(
    ball(0.035).scale(0.75, 1.25, 0.35).rotate(0, 0, -20).move(0.005, 0, 0),
    ball(0.02).scale(1, 0.9, 0.45).move(-0.025, 0.045, 0), ball(0.011).scale(1.4, 0.8, 0.45).move(-0.045, 0.04, 0), ball(0.008).move(-0.017, 0.066, 0),
    rod([-0.01, 0.025, 0], [-0.05, 0.015, 0], 0.008), rod([-0.005, 0.005, 0], [-0.045, -0.01, 0], 0.008),
    rod([0.008, -0.03, 0], [-0.002, -0.07, 0], 0.009), rod([0.025, -0.025, 0], [0.032, -0.07, 0], 0.009),
  );
}
function shield(): Solid {
  return poly([[-0.08, 0.1], [0.08, 0.1], [0.08, -0.02], [0.04, -0.08], [0, -0.1], [-0.04, -0.08], [-0.08, -0.02]]).extrude(0.012);
}
function lozenge(): Solid {
  return union(box(0.09, 0.09, 0.01, 0, -0.045, 0).rotate(0, 0, 45), ball(0.025).scale(1, 1, 0.5).move(0, 0, 0.01));
}

/** A spout head scanned through Idol (scan/pump-heads.sh draws it, tools/scan.sh idol and fit make assets/scan/NAME.obj),
 *  turned so its snout runs along +z, scaled to length L, its collar set into the body at z 0.17 and its middle at
 *  y 0.84; null when the scan isn't there. The turns were measured on the meshes as Idol made them: the fish's snout
 *  along +x tipped 31 degrees down by the drawing's high camera, the dragon's 41 degrees off +z toward +x. Both are
 *  left tipped about 8 degrees down, as the spouts hang. The mesh's colours are dropped: the kit's paint draws it. */
function scannedHead(kind: Kind): Solid | null {
  const s = scanned(kind === "fish" ? "assets/scan/pump-fish.obj" : "assets/scan/pump-dragon.obj");
  if (!s) return null;
  const r = kind === "fish" ? s.rotate(0, 0, 23).rotate(0, -90, 0) : s.rotate(0, -40.8, 0).rotate(-6, 0, 0);
  const L = kind === "fish" ? 0.36 : 0.4, b = r.bounds(), lo = b.min as unknown as number[], hi = b.max as unknown as number[];
  const k = L / (hi[2] - lo[2]);
  const head = r.move(-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2, -lo[2]).scale(k, k, k).simplify(0.0006).move(0, 0.84, 0.17);
  // Idol guessed the back (the side the drawing never showed) as ragged flaps: keep the front two thirds and close it
  // with our own turned collar, a neck out of the body and a flange with four bolts, as the drawing has
  const cut = 0.17 + 0.32 * L, alongZ = (s: Solid) => s.rotate(90, 0, 0);
  const collar: Solid[] = [
    alongZ(lathe([[0, 0], [0.075, 0], [0.075, cut - 0.15], [0, cut - 0.15]], 0, 0, 0, 20)).move(0, 0.84, 0.15),
    alongZ(lathe([[0, 0], [0.105, 0], [0.105, 0.018], [0.095, 0.03], [0, 0.03]], 0, 0, 0, 24)).move(0, 0.84, cut - 0.03),
  ];
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; collar.push(ball(0.011).scale(1, 1, 0.6).move(0.085 * Math.cos(a), 0.84 + 0.085 * Math.sin(a), cut)); }
  return union(head.intersect(box(0.8, 0.8, L, 0, 0.44, cut + L / 2)), ...collar);
}

/** The head of the spout, out of the body at +z, its mouth at about (0, 0.8, 0.42): the scan when it is there, else a
 *  stand-in of balls. */
export function spout(kind: Kind): Solid[] {
  const head = scannedHead(kind);
  if (head) return [head];
  const s: Solid[] = [rod([0, 0.82, 0.12], [0, 0.8, 0.42], 0.022)];
  if (kind === "fish") {
    s.push(ball(0.07).scale(0.8, 0.75, 1.6).rotate(14, 0, 0).move(0, 0.84, 0.3));
    for (const x of [-1, 1]) s.push(ball(0.016).move(x * 0.045, 0.87, 0.35), ball(0.03).scale(0.3, 0.6, 1.2).rotate(0, x * 25, 0).move(x * 0.05, 0.8, 0.26));
    s.push(poly([[0.2, 0.89], [0.36, 0.9], [0.22, 0.98]]).extrude(0.012).rotate(0, -90, 0).move(0.006, 0, 0));
  } else {
    s.push(ball(0.08).scale(1, 0.9, 1).move(0, 0.86, 0.22), ball(0.05).scale(0.9, 0.6, 2.6).rotate(8, 0, 0).move(0, 0.87, 0.34), ball(0.04).scale(0.8, 0.4, 2.2).rotate(28, 0, 0).move(0, 0.8, 0.31));
    for (const x of [-1, 1]) {
      s.push(ball(0.015).move(x * 0.05, 0.9, 0.27), ball(0.008).move(x * 0.02, 0.872, 0.43));
      s.push(rod([x * 0.04, 0.92, 0.24], [x * 0.065, 0.98, 0.17], 0.012), rod([x * 0.065, 0.98, 0.17], [x * 0.07, 0.99, 0.1], 0.007));
    }
    for (let i = 0; i < 3; i++) s.push(lathe([[0, 0], [0.014, 0], [0, 0.035]], 0, 0.93 - i * 0.01, 0.3 - i * 0.07, 6));
    if (kind === "crown") s.push(ball(0.06).scale(1.6, 0.25, 1).move(0, 0.95, 0.2)); // the beast's ruff
  }
  return s;
}

/** A flat cast strip along a centreline of (z, y) points, its half-depth by t along it (0 to 1), thick across x. */
function strip(c: [number, number][], half: (t: number) => number, thick: number): Solid {
  const up: [number, number][] = [], lo: [number, number][] = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const dz = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dz, dy) || 1, h = half(i / (c.length - 1));
    up.push([p[0] - (dy / l) * h, p[1] + (dz / l) * h]);
    lo.push([p[0] + (dy / l) * h, p[1] - (dz / l) * h]);
  });
  return poly([...up, ...lo.reverse()]).extrude(thick).rotate(0, -90, 0).move(thick / 2, 0, 0);
}
const bezier = (P: [number, number][], n: number): [number, number][] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [w.reduce((s, k, j) => s + k * P[j][0], 0), w.reduce((s, k, j) => s + k * P[j][1], 0)];
  });
/** A turned piece built along +y, laid along the (z, y) direction d and moved to (z, y). */
const along = (s: Solid, d: [number, number], at: [number, number]) => s.rotate(90, 0, 0).rotate((Math.atan2(-d[1], d[0]) * 180) / Math.PI, 0, 0).move(0, at[1], at[0]);

/** The handle (Schwengel): a bracket on the back of the head with two cheeks and the pin through them, the lever as a
 *  flat cast bar deep at the pin and tapering, curving up and back to rest raised, a scroll under it, a turned knob. */
function handle(): Solid[] {
  // the bracket is a plate cast on the head's back face (1.53-1.70 m), its two cheeks out from it, the pin at 1.6 m
  const s: Solid[] = [box(0.14, 0.15, 0.045, 0, 1.535, -0.19), box(0.11, 0.03, 0.06, 0, 1.535, -0.2)];
  for (const x of [-1, 1]) s.push(box(0.014, 0.1, 0.1, x * 0.045, 1.55, -0.25), ball(0.02).scale(0.5, 1, 1).move(x * 0.058, 1.6, -0.265));
  s.push(rod([-0.06, 1.6, -0.265], [0.06, 1.6, -0.265], 0.014), rod([-0.019, 1.6, -0.265], [0.019, 1.6, -0.265], 0.036));
  const c = bezier([[-0.2, 1.6], [-0.49, 1.67], [-0.75, 1.86], [-0.98, 1.92]], 24);
  s.push(strip(c, (t) => 0.034 - 0.016 * t, 0.026));
  const sc: [number, number][] = [];
  for (let i = 0; i <= 32; i++) { const t = i / 32, th = Math.PI / 2 + t * Math.PI * 2.4, r = 0.075 * (1 - 0.72 * t); sc.push([-0.41 + r * Math.cos(th), 1.572 + r * Math.sin(th)]); }
  s.push(strip(sc, () => 0.007, 0.018));
  const e = c[c.length - 1], p = c[c.length - 2], l = Math.hypot(e[0] - p[0], e[1] - p[1]), d: [number, number] = [(e[0] - p[0]) / l, (e[1] - p[1]) / l];
  s.push(along(lathe([[0, 0], [0.02, 0], [0.03, 0.04], [0.028, 0.09], [0.016, 0.12], [0, 0.125]], 0, 0, 0, 12), d, [e[0] - d[0] * 0.01, e[1] - d[1] * 0.01]));
  s.push(along(lathe([[0.016, 0], [0.026, 0], [0.026, 0.014], [0.016, 0.014]], 0, 0, 0, 12), d, [e[0] - d[0] * 0.03, e[1] - d[1] * 0.03]));
  return s;
}

function pump(kind: Kind, ice = false): Part[] {
  const iron: Solid[] = [], stone: Solid[] = [], snow: Solid[] = [], frozen: Solid[] = [];
  // the foot: plinth, pedestal with framed panels, cornice
  iron.push(box(0.62, 0.08, 0.62, 0, 0, 0), box(0.56, 0.04, 0.56, 0, 0.08, 0), box(0.48, 0.3, 0.48, 0, 0.12, 0), box(0.54, 0.04, 0.54, 0, 0.42, 0), box(0.5, 0.06, 0.5, 0, 0.46, 0));
  const relief = kind === "fish" ? fish() : kind === "crown" ? union(shield(), bear().scale(1.25, 1.25, 1).move(0, 0, 0.018)) : lozenge();
  const panel = union(box(0.38, 0.02, 0.012, 0, 0.1, 0), box(0.38, 0.02, 0.012, 0, -0.12, 0), box(0.02, 0.24, 0.012, -0.18, -0.12, 0), box(0.02, 0.24, 0.012, 0.18, -0.12, 0), relief);
  for (const f of [0, 90, 180, 270]) { const a = (f * Math.PI) / 180; iron.push(panel.rotate(0, f, 0).move(0.24 * Math.sin(a), 0.27, 0.24 * Math.cos(a))); }
  // the body: a torus, the bulge round the spout, a band, the column, a band, the neck
  iron.push(lathe([[0, 0], [0.215, 0], [0.235, 0.03], [0.235, 0.07], [0.2, 0.1], [0.19, 0.16], [0.215, 0.24], [0.225, 0.32], [0.21, 0.4], [0.17, 0.48], [0.15, 0.52], [0.155, 0.56], [0.14, 0.6], [0.135, 0.9], [0.15, 0.92], [0.15, 0.96], [0.135, 0.98], [0.17, 1.01], [0, 1.01]], 0, 0.52, 0, 28));
  for (const y of [0.74, 0.94]) iron.push(lathe([[0.2, 0], [0.228, 0], [0.228, 0.02], [0.2, 0.02]], 0, y, 0, 28));
  iron.push(...spout(kind));
  // the head with its four oval mirrors (a frog in the front one on type I), the cornice
  iron.push(box(0.34, 0.17, 0.34, 0, 1.53, 0), box(0.42, 0.04, 0.42, 0, 1.7, 0), box(0.38, 0.03, 0.38, 0, 1.74, 0));
  for (const f of [0, 90, 270]) { // the back face carries the handle's bracket
    const a = (f * Math.PI) / 180;
    const face = kind === "fish" && f === 0
      ? union(ball(0.035).scale(1.2, 0.7, 0.6), ball(0.014).move(-0.025, 0.02, 0.01), ball(0.014).move(0.025, 0.02, 0.01), rod([-0.03, -0.01, 0], [-0.06, -0.03, 0], 0.008), rod([0.03, -0.01, 0], [0.06, -0.03, 0], 0.008))
      : union(ball(0.06).scale(1, 1.3, 0.2), lathe([[0.058, -0.004], [0.068, -0.004], [0.068, 0.004], [0.058, 0.004]], 0, 0, 0, 16).rotate(90, 0, 0).scale(1, 1.3, 1));
    iron.push(face.rotate(0, f, 0).move(0.17 * Math.sin(a), 1.615, 0.17 * Math.cos(a)));
  }
  // the top
  const T = 1.77;
  if (kind === "fish") {
    iron.push(lathe([[0, 0], [0.19, 0], [0.18, 0.05], [0.14, 0.1], [0.07, 0.13], [0, 0.14]], 0, T, 0, 24));
    iron.push(lathe([[0, 0], [0.035, 0], [0.05, 0.04], [0.05, 0.08], [0.03, 0.13], [0, 0.16]], 0, T + 0.13, 0, 12));
    for (let k = 0; k < 4; k++) for (let i = 0; i < 8; i++) { const a = ((i + (k % 2) * 0.5) / 8) * Math.PI * 2, r = [0.048, 0.052, 0.045, 0.032][k]; iron.push(ball(0.011).move(r * Math.sin(a), T + 0.16 + k * 0.03, r * Math.cos(a))); }
  } else if (kind === "dragon") {
    iron.push(lathe([[0, 0], [0.19, 0], [0.16, 0.08], [0.11, 0.2], [0.06, 0.3], [0.02, 0.36], [0, 0.37]], 0, T, 0, 24));
    for (let k = 0; k < 5; k++) {
      const y = 0.03 + k * 0.065, r = 0.185 - k * 0.032, n = 14 - k * 2;
      for (let i = 0; i < n; i++) { const a = ((i + (k % 2) * 0.5) / n) * Math.PI * 2; iron.push(ball(0.028 - k * 0.003).scale(1, 0.7, 0.35).rotate(-30, (a * 180) / Math.PI, 0).move(r * Math.sin(a), T + y, r * Math.cos(a))); }
    }
    iron.push(ball(0.035).move(0, T + 0.4, 0), lathe([[0, 0], [0.015, 0], [0, 0.06]], 0, T + 0.43, 0, 8));
  } else {
    iron.push(lathe([[0, 0], [0.17, 0], [0.17, 0.13], [0.15, 0.13], [0.15, 0.03], [0, 0.03]], 0, T, 0, 24));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; iron.push(box(0.07, 0.05, 0.035, 0, 0, 0).rotate(0, (a * 180) / Math.PI, 0).move(0.16 * Math.sin(a), T + 0.13, 0.16 * Math.cos(a))); }
    for (const y of [0.045, 0.085]) iron.push(lathe([[0.17, 0], [0.176, 0], [0.176, 0.006], [0.17, 0.006]], 0, T + y, 0, 24));
    iron.push(lathe([[0, 0], [0.1, 0], [0.06, 0.08], [0, 0.1]], 0, T + 0.03, 0, 16));
  }
  iron.push(...handle());
  // the trough stone, flush with the pavement under the spout, its hollow worn smooth
  stone.push(box(0.7, 0.12, 0.45, 0, -0.1, 0.55).minus(ball(0.2).scale(1.3, 0.35, 0.8).move(0, 0.02, 0.55)));
  if (ice) {
    snow.push(box(0.4, 0.035, 0.4, 0, 1.77, 0), box(0.5, 0.03, 0.5, 0, 0.52, 0), box(0.6, 0.025, 0.6, 0, 0.12, 0));
    snow.push(kind === "fish" ? ball(0.17).scale(1, 0.35, 1).move(0, T + 0.1, 0) : ball(0.12).scale(1, 0.4, 1).move(0, T + 0.05, 0));
    for (const [x, l] of [[-0.012, 0.09], [0.004, 0.13], [0.016, 0.07]]) frozen.push(lathe([[0, 0], [0.009, 0], [0, l]], 0, 0, 0, 6).rotate(180, 0, 0).move(x, 0.785, 0.42));
    frozen.push(ball(0.19).scale(1.25, 0.12, 0.75).move(0, -0.005, 0.55), box(0.24, 0.008, 0.5, 0.03, 0.014, 1.02), box(0.14, 0.008, 0.2, -0.02, 0.014, 1.3));
  }
  const parts: Part[] = [{ mat: ice ? "iron-cast" : "paint-green", solid: union(...iron) }, { mat: "granite", solid: union(...stone), overlap: true }];
  if (snow.length) parts.push({ mat: "snow", solid: union(...snow), overlap: true });
  if (frozen.length) parts.push({ mat: "ice-grey", solid: union(...frozen), overlap: true });
  return parts;
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: ["street-pump"], size, place: "floor", where: "set", tris, parts: f });
P("pump-fish", [0.7, 2.1, 1.85], 20000, () => pump("fish"));
P("pump-dragon", [0.7, 2.25, 1.85], 20000, () => pump("dragon"));
P("pump-crown", [0.7, 2.0, 1.85], 20000, () => pump("crown"));
P("pump-fish-ice", [0.7, 2.1, 2.45], 22000, () => pump("fish", true));

export const KIT_PUMPS = true;
