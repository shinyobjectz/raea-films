// The Litfaß column (catalogue advertising-column): Ernst Litfaß's "Annoncir-Säule", the first set up on 15 April
// 1855 in the Münzstraße, a hundred more that July; hollow sheet iron about 1.4 m across and 2.6-3.6 m high on a broad
// foot under a round hood, its edge sometimes decorated (de.wikipedia Litfaßsäule; Stadtmuseum Berlin). By 1917 its
// posters were the war's: official notices (BEKANNTMACHUNG), the war loan, ration cards and coal, theatre and cinema.
//   column-litfass        the hooded column, posters pasted over older ones, the hood's edge scalloped
//   column-litfass-worn   the same in the war's fourth winter: posters peeling, torn at their feet, paste stains, rust
//                         at the foot
//   column-litfass-flat   a plainer one closed by a flat plate instead of the hood
// Posters carry generic words only (no firm's name). ASSUMED: 3.3 m high, 1.4 m across; the posters' sizes and words.
// Frame: on the pavement at its foot, round about y.
import type { Solid } from "raea/3d";
import { ball, box, lathe, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { sign } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const R = 0.7, Y0 = 0.5, Y1 = 3.0;

/** A flat solid built at z 0 facing +z, x along the column's girth, wrapped round the shaft at angle a0 (radians),
 *  standing out d from the iron. */
const wrap = (s: Solid, a0: number, d: number) => s.refineToLength(0.05).warp((x, y, z): V3 => { const r = R + d + z, a = a0 + x / R; return [r * Math.sin(a), y, r * Math.cos(a)]; });

type Poster = { a: number; y: number; w: number; h: number; mat: MatId; text?: string; ts?: number; ink?: MatId; torn?: boolean };
/** The posters round the shaft: angle of their centre (degrees), foot, width, height, paper, a headline. */
const POSTERS: Poster[] = [
  { a: 0, y: 1.25, w: 0.62, h: 0.9, mat: "paper", text: "BEKANNTMACHUNG", ts: 0.045, ink: "flag-black" },
  { a: 48, y: 0.75, w: 0.7, h: 1.05, mat: "poster-red", text: "KRIEGSANLEIHE", ts: 0.06, ink: "flag-white" },
  { a: 105, y: 1.55, w: 0.55, h: 0.75, mat: "poster-yellow", text: "THEATER", ts: 0.08, ink: "flag-black" },
  { a: 105, y: 0.7, w: 0.6, h: 0.75, mat: "paper", text: "KOHLEN", ts: 0.09, ink: "flag-red", torn: true },
  { a: 160, y: 1.0, w: 0.75, h: 1.3, mat: "poster-green", text: "KINO", ts: 0.14, ink: "poster-yellow" },
  { a: 215, y: 1.6, w: 0.55, h: 0.8, mat: "paper", text: "LEBENSMITTELKARTEN", ts: 0.032, ink: "flag-black" },
  { a: 212, y: 0.7, w: 0.5, h: 0.8, mat: "paper-poster", torn: true },
  { a: 262, y: 0.95, w: 0.66, h: 1.15, mat: "poster-red", text: "ZEICHNET!", ts: 0.09, ink: "flag-white" },
  { a: 315, y: 1.45, w: 0.6, h: 0.85, mat: "paper-blue", text: "KONZERT", ts: 0.08, ink: "paper" },
  { a: 318, y: 0.65, w: 0.55, h: 0.7, mat: "paper", text: "VERLOREN", ts: 0.07, ink: "flag-black", torn: true },
  // the top row, pasted from a ladder
  { a: 20, y: 2.2, w: 0.9, h: 0.6, mat: "poster-yellow", text: "ZIRKUS", ts: 0.12, ink: "poster-red" },
  { a: 95, y: 2.35, w: 0.8, h: 0.45, mat: "paper", text: "BEKANNTMACHUNG", ts: 0.05, ink: "flag-black" },
  { a: 180, y: 2.4, w: 1.0, h: 0.42, mat: "poster-red", text: "OPERETTE", ts: 0.11, ink: "poster-yellow" },
  { a: 270, y: 2.2, w: 0.85, h: 0.6, mat: "poster-green", text: "VARIETÉ", ts: 0.11, ink: "paper" },
];

function column(kind: "hood" | "flat", worn: boolean): Part[] {
  const iron: Solid[] = [], by: Partial<Record<MatId, Solid[]>> = {};
  const add = (m: MatId, ...s: Solid[]) => (by[m] ??= []).push(...s);
  // the foot, the shaft, the cornice under the head
  iron.push(lathe([[0, 0], [0.84, 0], [0.84, 0.1], [0.78, 0.16], [0.74, 0.4], [0.71, 0.46], [0.71, Y0 + 0.02], [0, Y0 + 0.02]], 0, 0, 0, 32));
  iron.push(lathe([[0, 0], [R, 0], [R, Y1 - Y0], [0, Y1 - Y0]], 0, Y0, 0, 32));
  iron.push(lathe([[0, 0], [0.74, 0], [0.8, 0.05], [0.8, 0.11], [0.76, 0.15], [0, 0.15]], 0, Y1, 0, 32));
  if (kind === "hood") {
    // the scalloped edge, the dome, a knob and spike
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; iron.push(ball(0.05).scale(1.4, 1, 0.6).rotate(0, (a * 180) / Math.PI, 0).move(0.79 * Math.sin(a), Y1 + 0.02, 0.79 * Math.cos(a))); }
    iron.push(lathe([[0, 0], [0.76, 0], [0.66, 0.2], [0.46, 0.4], [0.2, 0.52], [0, 0.55]], 0, Y1 + 0.15, 0, 32));
    iron.push(ball(0.08).move(0, Y1 + 0.72, 0), lathe([[0, 0], [0.02, 0], [0, 0.18]], 0, Y1 + 0.78, 0, 8));
  } else {
    iron.push(lathe([[0, 0], [0.82, 0], [0.82, 0.06], [0, 0.06]], 0, Y1 + 0.15, 0, 32));
  }
  // the old posters' ground over the whole shaft, then this week's on top
  add("paper-poster", lathe([[R - 0.002, 0], [R + 0.003, 0], [R + 0.003, Y1 - Y0 - 0.15], [R - 0.002, Y1 - Y0 - 0.15]], 0, Y0 + 0.08, 0, 48));
  POSTERS.forEach((p, i) => {
    const a = (p.a * Math.PI) / 180, d = 0.004 + (i % 3) * 0.0015;
    let sheet = box(p.w, p.h, 0.002, 0, p.y, 0);
    if (worn && p.torn) sheet = sheet.minus(box(p.w * 0.7, 0.4, 0.1, p.w * 0.1, p.y - 0.25, 0).rotate(0, 0, 12)); // torn off at the foot
    if (worn && i % 4 === 1) sheet = sheet.minus(box(0.3, 0.3, 0.1, p.w / 2, p.y + p.h - 0.12, 0).rotate(0, 0, 40)); // a corner gone
    add(p.mat, wrap(sheet, a, d));
    if (p.text) add(p.ink ?? "flag-black", wrap(sign(p.text, p.ts ?? 0.06, 0.002).move(0, p.y + p.h - (p.ts ?? 0.06) * 1.6, 0), a, d + 0.002));
    // the small print under the headline: grey bars
    if (p.text && p.h > 0.5) for (let k = 0; k < 4; k++) add("flag-black", wrap(box(p.w * (0.72 - (k % 2) * 0.12), 0.012, 0.001, 0, p.y + p.h * (0.55 - k * 0.1), 0), a, d + 0.002));
  });
  if (worn) {
    // paste stains and a peeled sheet curling off; rust bleeding at the foot
    for (const [a, y] of [[30, 2.2], [140, 0.9], [250, 2.3]]) add("paper-poster", wrap(box(0.25, 0.4, 0.001, 0, y, 0), (a * Math.PI) / 180, 0.007));
    add("paper", box(0.4, 0.3, 0.002, 0, -0.3, 0).rotate(-35, 0, 0).rotate(0, (1.2 * 180) / Math.PI, 0).move(Math.sin(1.2) * (R + 0.01), 2.6, Math.cos(1.2) * (R + 0.01)));
    add("iron-rust", lathe([[0.7, 0], [0.845, 0], [0.845, 0.2], [0.7, 0.2]], 0, 0.005, 0, 32));
  }
  const parts: Part[] = [{ mat: worn ? "iron-cast" : "paint-green", solid: union(...iron) }];
  Object.entries(by).forEach(([m, s]) => parts.push({ mat: m as MatId, solid: union(...(s as Solid[])), overlap: true }));
  return parts;
}

const P = (id: string, tris: number, f: () => Part[]) => prop({ id, items: ["advertising-column"], size: [1.7, 3.6, 1.7], place: "floor", where: "set", tris, parts: f });
P("column-litfass", 40000, () => column("hood", false));
P("column-litfass-worn", 40000, () => column("hood", true));
P("column-litfass-flat", 36000, () => column("flat", false));

export const KIT_LITFASS = true;
