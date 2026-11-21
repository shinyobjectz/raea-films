// The plates that tell a walker where they are in Berlin, winter 1917-18: street names and house numbers.
//   street-plate-SLUG   the old street-name plate fixed to a corner house: painted sheet iron, white letters on blue.
//                       Until 1905 Berlin's only kind ("painted metal plates with white letters on blue background,
//                       fixed directly on the corner houses": V. Gerlach, CST Street Types); in 1917 many still hung
//                       where no lamp sign had replaced them (ASSUMED). Its twin -worn has the paint gone at the edges.
//   street-sign-SLUG    the sign of 1905-08 on a lamp mast at the kerb, so drivers could read it: black letters on
//                       white, both faces, a very narrow monolinear slab serif (Schmale Egyptienne; same source). Drawn
//                       in Inter narrowed to 62% until the engine has a narrow slab face (ASSUMED stand-in).
//   house-plate-oval, house-plate-rect   a house number's enamel plate over the door, blank: white rim on blue
//                       (ASSUMED: Prussian practice; Berlin left the look to the owner)
//   house-digit-N       a white enamel digit for it, 0-9
//   house-digit-paint-N a big digit painted straight on the wall, 0-9 (a corner house in 1886 "trägt die Nummer 21
//                       mit großen Zahlen an der Wand", while the right one was "nur auf einem kleinen Schilde über
//                       der Hausthür": Neueste Nachrichten via mitteNdran)
// houseNumber(n, kind) composes a number from those atoms, so 2,385 numbers need 22 props, not 2,385.
// SLUG is slug(name) of a name in STREET_NAMES (kit/streetnames.ts, from the 1917 map).
// Frames: street-plate and the house pieces on the wall's face (z 0, out to +z), the street plate at its bottom edge's
// middle, a house plate or digit at its centre; street-sign on the mast's axis at the plate's bottom edge, the plate
// flagged out along +x beside the mast (its clamps fit a mast up to 0.12 m in radius: the Modellleuchte's is 0.11).
import { crossSection, type Solid } from "raea/3d";
import { box, lathe, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { sign } from "./outgeo";
import { prop } from "./prop";
import { STREET_NAMES } from "./streetnames";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const parts = (...p: [MatId, Solid | Solid[]][]): Part[] => p.filter(([, s]) => !Array.isArray(s) || s.length).map(([mat, s], i) => ({ mat, solid: Array.isArray(s) ? union(...s) : s, overlap: i > 0 }));

/** A street name as a prop id's tail: lower case, umlauts and ß spelt out, words joined by -. */
export const slug = (name: string) => name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function extent(s: Solid): [number, number] {
  const b = s.bounds(), lo = b.min as unknown as number[], hi = b.max as unknown as number[];
  return [hi[0] - lo[0], hi[1] - lo[1]];
}
/** A plate's outline with rounded corners, w x h, centred on x, from y 0, t thick from z 0. */
function plate(w: number, h: number, t: number, r: number): Solid {
  const pts: [number, number][] = [];
  for (const [cx, cy, a0] of [[w / 2 - r, h - r, 0], [-w / 2 + r, h - r, 90], [-w / 2 + r, r, 180], [w / 2 - r, r, 270]] as [number, number, number][])
    for (let i = 0; i <= 4; i++) { const a = ((a0 + i * 22.5) * Math.PI) / 180; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return crossSection.polygon(pts).extrude(t);
}
const ring = (w: number, h: number, t: number, r: number, band: number) => plate(w, h, t, r).minus(plate(w - 2 * band, h - 2 * band, t + 0.002, Math.max(0.002, r - band)).move(0, band, -0.001));

// ── street names ─────────────────────────────────────────────────────────────────────────────────────────────────
/** The old corner-house plate: blue sheet with a white line round it, the name in white, four screws. */
function streetPlate(name: string, worn: boolean): Part[] {
  const H = 0.3, T = 0.004, size = 0.13;
  const words = sign(name, size, 0.0012, 600);
  const W = extent(words)[0] + 0.22;
  const field = plate(W, H, T, 0.015), line = ring(W - 0.04, H - 0.04, 0.0012, 0.008, 0.012).move(0, 0.02, T);
  const heads = [-1, 1].flatMap((s) => [0.05, H - 0.05].map((y) => box(0.012, 0.012, 0.004, s * (W / 2 - 0.035), y - 0.006, T + 0.001)));
  const paint = [words.move(0, H / 2, T), line];
  // worn: the blue gone to rust in a band round the edge and at the screws
  const rust = worn ? [ring(W, H, T + 0.0004, 0.015, 0.018).move(0, 0, -0.0002)] : [];
  return parts(["enamel-blue", field], ["sign-white", paint], ["iron", heads], ...(worn ? [["iron-rust", rust] as [MatId, Solid[]]] : []));
}
/** The lamp sign of 1905-08: a white plate flagged out from the mast on two arms with clamps, the name in black on
 *  both faces in a narrow face, a thin black line inside its edge. */
function streetSign(name: string): Part[] {
  const H = 0.2, T = 0.004, size = 0.105, X0 = 0.16;
  const words = sign(name, size, 0.0012, 600).scale(0.62, 1, 1);
  const W = extent(words)[0] + 0.14, cx = X0 + W / 2;
  const field = plate(W, H, T, 0.01).move(cx, 0, -T / 2);
  const line = [ring(W - 0.025, H - 0.025, 0.0012, 0.005, 0.006).move(cx, 0.0125, T / 2), ring(W - 0.025, H - 0.025, 0.0012, 0.005, 0.006).rotate(0, 180, 0).move(cx, 0.0125, -T / 2)];
  const front = words.move(cx, H / 2, T / 2), back = words.rotate(0, 180, 0).move(cx, H / 2, -T / 2);
  // the arms: a flat bar along the top and bottom edges back to a clamp band round the mast
  const iron: Solid[] = [];
  for (const y of [-0.012, H + 0.002]) {
    iron.push(box(X0 + 0.04, 0.01, 0.012, (X0 + 0.04) / 2, y, 0));
    iron.push(lathe([[0.12, -0.02], [0.13, -0.02], [0.13, 0.02], [0.12, 0.02]], 0, y + 0.005, 0, 16));
    iron.push(box(0.03, 0.03, 0.012, 0.145, y - 0.01, 0)); // the clamp's bolt lug
  }
  iron.push(box(0.012, H + 0.03, 0.012, X0 + W + 0.004, -0.015, 0)); // the stiffener down the outer end
  return parts(["sign-white", field], ["enamel-black", [front, back, ...line]], ["iron", iron]);
}

// ── house numbers ────────────────────────────────────────────────────────────────────────────────────────────────
const DIGIT = 0.09, PAINT = 0.34, PLATE_T = 0.003;
/** Where a digit's centre goes, for a number of n digits: advances of 0.62 the digit's height (Inter's figures). */
const advance = (h: number) => h * 0.62;
function housePlate(oval: boolean): Part[] {
  const W = 0.26, H = 0.18;
  let field: Solid, rim: Solid;
  if (oval) {
    const e = (a: number, b: number, t: number) => { const p: [number, number][] = []; for (let i = 0; i < 40; i++) { const g = (i / 40) * Math.PI * 2; p.push([a * Math.cos(g), b * Math.sin(g)]); } return crossSection.polygon(p).extrude(t); };
    field = e(W / 2, H / 2, PLATE_T);
    rim = e(W / 2 - 0.008, H / 2 - 0.008, 0.0012).minus(e(W / 2 - 0.016, H / 2 - 0.016, 0.004).move(0, 0, -0.001)).move(0, 0, PLATE_T);
  } else {
    field = plate(W, H, PLATE_T, 0.012).move(0, -H / 2, 0);
    rim = ring(W - 0.016, H - 0.016, 0.0012, 0.008, 0.008).move(0, -H / 2 + 0.008, PLATE_T);
  }
  const lugs = [-1, 1].map((s) => box(0.01, 0.01, 0.002, s * (W / 2 - 0.022), -0.005, PLATE_T));
  return parts(["enamel-blue", field], ["sign-white", rim], ["iron", lugs]);
}
const digit = (d: number, paint: boolean): Part[] => parts([paint ? "enamel-black" : "sign-white", sign(String(d), paint ? PAINT : DIGIT, 0.0012, paint ? 700 : 600).move(0, 0, paint ? 0 : PLATE_T)]);

export type Placement = { prop: string; at: V3 };
/** House number n as atoms, in the wall's frame with (0, 0) at the number's centre: a plate and its digits, or the
 *  digits painted big. `oval` picks the plate. Numbers wider than a plate get a wider spacing of two plates' worth
 *  (none on the slice: the highest is 3 digits). */
export function houseNumber(n: number, kind: "plate" | "paint", oval = false): Placement[] {
  const s = String(Math.max(0, Math.round(n))), h = kind === "paint" ? PAINT : DIGIT, a = advance(h);
  const out: Placement[] = kind === "plate" ? [{ prop: oval ? "house-plate-oval" : "house-plate-rect", at: [0, 0, 0] }] : [];
  [...s].forEach((c, i) => out.push({ prop: kind === "paint" ? `house-digit-paint-${c}` : `house-digit-${c}`, at: [(i - (s.length - 1) / 2) * a, 0, 0] }));
  return out;
}

// ── registration ─────────────────────────────────────────────────────────────────────────────────────────────────
for (const name of STREET_NAMES) {
  const w = Math.max(0.6, name.length * 0.075 + 0.25);
  prop({ id: `street-plate-${slug(name)}`, items: ["street-sign"], size: [w * 1.3, 0.32, 0.02], place: "wall", where: "set", tris: 30000, parts: () => streetPlate(name, false) });
  prop({ id: `street-plate-${slug(name)}-worn`, items: ["street-sign"], size: [w * 1.3, 0.32, 0.02], place: "wall", where: "set", tris: 32000, parts: () => streetPlate(name, true) });
  prop({ id: `street-sign-${slug(name)}`, items: ["street-sign"], size: [w + 0.6, 0.26, 0.28], place: "floor", where: "set", tris: 40000, parts: () => streetSign(name) });
}
prop({ id: "house-plate-oval", items: ["house-number"], size: [0.27, 0.19, 0.01], place: "wall", where: "set", tris: 800, parts: () => housePlate(true) });
prop({ id: "house-plate-rect", items: ["house-number"], size: [0.27, 0.19, 0.01], place: "wall", where: "set", tris: 600, parts: () => housePlate(false) });
for (let d = 0; d < 10; d++) {
  prop({ id: `house-digit-${d}`, items: ["house-number"], size: [0.08, 0.1, 0.006], place: "wall", where: "set", tris: 1500, parts: () => digit(d, false) });
  prop({ id: `house-digit-paint-${d}`, items: ["house-number"], size: [0.3, 0.37, 0.004], place: "wall", where: "set", tris: 1500, parts: () => digit(d, true) });
}

export const KIT_PLATES = true;

/** The street-name props a check builds: one function draws all of them from a name, so the longest names, the
 *  shortest and those with ß, umlauts, a hyphen or a dot stand for the rest (building all 486 holds about 6 GB). */
export const PLATE_SAMPLE: string[] = (() => {
  const by = [...STREET_NAMES].sort((a, b) => b.length - a.length);
  const pick = new Set([...by.slice(0, 2), ...by.slice(-2), ...STREET_NAMES.filter((n) => /[ßäöü\-.]/.test(n)).slice(0, 4)]);
  return [...pick].flatMap((n) => [`street-plate-${slug(n)}`, `street-plate-${slug(n)}-worn`, `street-sign-${slug(n)}`]);
})();
