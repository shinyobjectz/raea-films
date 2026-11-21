// Tiled stoves (Kachelöfen), one generator for every glazed stove in the city. Nearly every heated room of a Berlin
// tenement had one in a corner, so the stove repeats from room to room and must never look the same twice in a row
// (the director, a review note: "we reuse this way too much"). Each variant is a different glaze, tile, body, cornice and
// crown; the furnisher draws one per room by its seed from the props on the room's item:
//   tiled-stove         stoked from the room: an iron fire door and ash door in front (the Stube, the Kammer, the
//                       petty and the good bedroom); plainer, more often white or brown
//   stove-hinterlader   the good flat's salon and dining room: stoked from the corridor behind the wall, so no door
//                       shows; relief tiles, cornices, a crown (kit/salon.ts salon-stove is one of these)
// Sources: research/catalogue/interior.ts "tiled-stove" and "stove-hinterlader" (Berliner Ofen: white melt glaze most
// often, tiles about 22 cm, two bodies with a cornice between, the warming niche with its brass doors).
// A new body is one line in ROOM_BODIES or SALON_BODIES, a new glaze one line in their glazes: every body is made in
// every glaze, 49 stoked from the room and 12 for the salon (with kit/salon.ts salon-stove, 13)
import type { Solid } from "raea/3d";
import { ball, box, lathe, union } from "./geo";
import type { MatId } from "./mats";
import { prop } from "./prop";

type Crown = "none" | "flat" | "steps" | "urn";
interface Kachel {
  glaze: MatId;
  joint: MatId;
  /** the lower body's width and depth (to the tiles' faces) */
  w: number;
  d: number;
  /** a tile's width and height */
  tw: number;
  th: number;
  /** rows of tiles below and above the middle cornice */
  lower: number;
  upper: number;
  /** how far the upper body is set in at each side and at the front */
  step: number;
  /** a raised panel on each tile */
  relief: boolean;
  /** a moulded middle cornice (else a plain band) */
  mid: boolean;
  crown: Crown;
  /** the warming niche (Röhre) behind two pierced brass doors, in the lower body's second row from the top */
  niche: boolean;
  /** stoked from the room: the iron fire door over the ash door */
  door: boolean;
  /** the plinth, the cornices and the crown in a second glaze (a white stove with green or brown mouldings) */
  trim?: MatId;
  /** the upper body's top row of tiles in a second glaze: the frieze under the top cornice */
  frieze?: MatId;
}

/** the stove's outer size and a triangle estimate, without building it */
function sizeOf(k: Kachel) {
  const crown = { none: 0, flat: 0.16, steps: 0.24, urn: 0.44 }[k.crown];
  const top = 0.16 + k.lower * k.th + (k.mid ? 0.12 : 0.06) + k.upper * k.th + 0.12 + crown;
  const per = (w: number, d: number) => Math.max(2, Math.round(w / k.tw)) + 2 * Math.max(2, Math.round(d / k.tw));
  const tiles = per(k.w, k.d) * k.lower + per(k.w - 2 * k.step, k.d - k.step) * k.upper;
  return { size: [+(k.w + 0.1).toFixed(2), +top.toFixed(2), +(k.d + 0.06).toFixed(2)] as [number, number, number], tris: 12 * tiles * (k.relief ? 2 : 1) + 600 };
}

function kachel(k: Kachel) {
  const tiles: Solid[] = [], relief: Solid[] = [], core: Solid[] = [], trim: Solid[] = [], brass: Solid[] = [], iron: Solid[] = [], fr: Solid[] = [];
  // one body of tiles: w x d, `rows` high from y0, its back against the wall at z = -k.d / 2
  const body = (y0: number, w: number, d: number, rows: number, skip: (i: number, j: number, nx: number) => boolean = () => false, top = false) => {
    const zc = -k.d / 2 + d / 2, nx = Math.max(2, Math.round(w / k.tw)), ns = Math.max(2, Math.round(d / k.tw)), tw = w / nx, sw = d / ns;
    core.push(box(w - 0.012, rows * k.th, d - 0.012, 0, y0, zc));
    for (let j = 0; j < rows; j++) {
      const y = y0 + j * k.th + 0.004, T = top && k.frieze && j === rows - 1 ? fr : tiles, R = T === fr ? fr : relief;
      for (let i = 0; i < nx; i++) {
        if (skip(i, j, nx)) continue;
        const u = (i - (nx - 1) / 2) * tw;
        T.push(box(tw - 0.008, k.th - 0.008, 0.022, u, y, zc + d / 2));
        if (k.relief) R.push(box(tw - 0.06, k.th - 0.06, 0.01, u, y + 0.026, zc + d / 2 + 0.014));
      }
      for (const s of [-1, 1]) for (let i = 0; i < ns; i++) {
        const v = zc + (i - (ns - 1) / 2) * sw;
        T.push(box(0.022, k.th - 0.008, sw - 0.008, (s * w) / 2, y, v));
        if (k.relief) R.push(box(0.01, k.th - 0.06, sw - 0.06, s * (w / 2 + 0.014), y + 0.026, v));
      }
    }
    return { nx, tw, zc };
  };
  // the plinth: a step and a roll
  trim.push(box(k.w + 0.1, 0.1, k.d + 0.06, 0, 0, 0.03 / 2), box(k.w + 0.06, 0.06, k.d + 0.03, 0, 0.1, 0.03 / 4));
  const y0 = 0.16, nicheRow = k.lower - 2;
  const lo = body(y0, k.w, k.d, k.lower, (i, j, nx) => k.niche && j === nicheRow && (nx >= 4 ? i === nx / 2 - 1 || i === nx / 2 : i === Math.floor(nx / 2)));
  const front = k.d / 2 + 0.012;
  if (k.niche) {
    const half = lo.nx >= 4 ? lo.tw : lo.tw / 2, y = y0 + nicheRow * k.th + 0.01;
    brass.push(box(half - 0.012, k.th - 0.02, 0.012, -half / 2, y, front), box(half - 0.012, k.th - 0.02, 0.012, half / 2, y, front));
    brass.push(ball(0.012).move(-0.03, y + k.th / 2, front + 0.012), ball(0.012).move(0.03, y + k.th / 2, front + 0.012));
  }
  if (k.door) {
    // the fire door one row up, the ash door under it, both cast iron with a brass knob
    iron.push(box(0.24, 0.2, 0.02, 0, y0 + k.th + 0.02, front), box(0.18, 0.1, 0.02, 0, y0 + 0.04, front));
    brass.push(ball(0.014).move(0.09, y0 + k.th + 0.12, front + 0.016));
  }
  // the middle: a moulded cornice of two steps, or a plain band
  const y1 = y0 + k.lower * k.th;
  if (k.mid) trim.push(box(k.w + 0.08, 0.05, k.d + 0.04, 0, y1, 0.02), box(k.w + 0.03, 0.07, k.d + 0.015, 0, y1 + 0.05, 0.0075));
  else trim.push(box(k.w + 0.03, 0.06, k.d + 0.015, 0, y1, 0.0075));
  const y2 = y1 + (k.mid ? 0.12 : 0.06), w2 = k.w - 2 * k.step, d2 = k.d - k.step;
  const up = body(y2, w2, d2, k.upper, undefined, true);
  // the top cornice
  const y3 = y2 + k.upper * k.th;
  trim.push(box(w2 + 0.05, 0.05, d2 + 0.025, 0, y3, up.zc + 0.0125), box(w2 + 0.14, 0.07, d2 + 0.07, 0, y3 + 0.05, up.zc + 0.035));
  let top = y3 + 0.12;
  if (k.crown === "flat") { trim.push(box(w2 - 0.08, 0.12, d2 - 0.08, 0, top, up.zc), box(w2 - 0.02, 0.04, d2 - 0.02, 0, top + 0.12, up.zc)); top += 0.16; }
  if (k.crown === "steps") { trim.push(box(w2 * 0.8, 0.09, d2 * 0.8, 0, top, up.zc), box(w2 * 0.6, 0.08, d2 * 0.6, 0, top + 0.09, up.zc), box(w2 * 0.36, 0.07, d2 * 0.4, 0, top + 0.17, up.zc)); top += 0.24; }
  if (k.crown === "urn") {
    trim.push(box(w2 - 0.1, 0.16, d2 - 0.1, 0, top, up.zc), box(w2 - 0.2, 0.05, d2 - 0.16, 0, top + 0.16, up.zc));
    trim.push(lathe([[0, 0], [0.07, 0], [0.04, 0.03], [0.09, 0.12], [0.05, 0.2], [0.03, 0.22], [0, 0.23]], 0, top + 0.21, up.zc, 16));
    top += 0.44;
  }
  const parts = [
    { mat: k.joint, solid: union(...core) },
    { mat: k.glaze, overlap: true, solid: union(...(k.trim ? [] : trim), ...tiles) },
    ...(k.trim ? [{ mat: k.trim, overlap: true, solid: union(...trim) }] : []),
    ...(fr.length && k.frieze ? [{ mat: k.frieze, overlap: true, solid: union(...fr) }] : []),
    ...(relief.length ? [{ mat: k.glaze, overlap: true, solid: union(...relief) }] : []),
    ...(brass.length ? [{ mat: "brass" as MatId, overlap: true, solid: union(...brass) }] : []),
    ...(iron.length ? [{ mat: "iron" as MatId, overlap: true, solid: union(...iron) }] : []),
  ];
  void top;
  return parts;
}

/** A stove's body (its shape) apart from its glaze; every body is made in every glaze of its kind. */
type Body = Omit<Kachel, "glaze" | "joint" | "trim" | "frieze">;
type Glaze = { glaze: MatId; joint: MatId; trim?: MatId; frieze?: MatId };

/** Glazes for the stoves stoked from the room. White melt glaze was the most common in Berlin, so three of the seven
 *  are white, but two of those carry their mouldings and frieze in a second glaze, and the rest are cream, manganese
 *  brown, green and grey blue with white mouldings: no two neighbours in a row of rooms look alike. */
const ROOM_GLAZES: [string, Glaze][] = [
  ["white", { glaze: "glaze-white", joint: "stove-joint" }],
  ["white-green", { glaze: "glaze-white", joint: "stove-joint", trim: "glaze-green", frieze: "glaze-green" }],
  ["white-bordeaux", { glaze: "glaze-white", joint: "joint-dark", trim: "glaze-bordeaux", frieze: "glaze-bordeaux" }],
  ["cream", { glaze: "glaze-cream", joint: "stove-joint" }],
  ["brown", { glaze: "glaze-brown", joint: "joint-dark" }],
  ["green", { glaze: "glaze-green", joint: "joint-dark", frieze: "glaze-ochre" }],
  ["blue", { glaze: "glaze-blue", joint: "stove-joint", trim: "glaze-white" }],
];
/** Stoked from the room (tiled-stove): an iron fire door over the ash door. */
const ROOM_BODIES: [string, Body][] = [
  ["berlin", { w: 0.7, d: 0.55, tw: 0.22, th: 0.22, lower: 4, upper: 4, step: 0.04, relief: false, mid: true, crown: "none", niche: false, door: true }],
  ["tall", { w: 0.62, d: 0.5, tw: 0.2, th: 0.22, lower: 5, upper: 4, step: 0, relief: false, mid: false, crown: "steps", niche: false, door: true }],
  ["squat", { w: 0.66, d: 0.52, tw: 0.22, th: 0.25, lower: 3, upper: 4, step: 0, relief: false, mid: false, crown: "flat", niche: false, door: true }],
  ["niche", { w: 0.64, d: 0.5, tw: 0.21, th: 0.21, lower: 4, upper: 3, step: 0.06, relief: true, mid: true, crown: "flat", niche: true, door: true }],
  ["wide", { w: 0.74, d: 0.56, tw: 0.24, th: 0.24, lower: 4, upper: 4, step: 0.05, relief: false, mid: true, crown: "steps", niche: true, door: true }],
  ["relief", { w: 0.68, d: 0.52, tw: 0.22, th: 0.21, lower: 4, upper: 4, step: 0.04, relief: true, mid: false, crown: "none", niche: true, door: true }],
  ["small", { w: 0.56, d: 0.46, tw: 0.18, th: 0.2, lower: 4, upper: 3, step: 0.03, relief: false, mid: false, crown: "flat", niche: false, door: true }],
];
/** Glazes for the good flat's salon stove: white with gilt mouldings, cream, green majolica with a gilt frieze, ochre. */
const SALON_GLAZES: [string, Glaze][] = [
  ["white-gilt", { glaze: "glaze-white", joint: "stove-joint", trim: "glaze-ochre", frieze: "glaze-ochre" }],
  ["cream", { glaze: "stove-glaze", joint: "stove-joint" }],
  ["green", { glaze: "glaze-green", joint: "joint-dark", frieze: "glaze-ochre" }],
  ["ochre", { glaze: "glaze-ochre", joint: "joint-dark" }],
];
/** Stoked from the corridor (stove-hinterlader): relief tiles, cornices, a crown; no door. */
const SALON_BODIES: [string, Body][] = [
  ["urn", { w: 0.84, d: 0.62, tw: 0.2, th: 0.26, lower: 4, upper: 4, step: 0.06, relief: true, mid: true, crown: "urn", niche: true, door: false }],
  ["steps", { w: 0.86, d: 0.64, tw: 0.21, th: 0.24, lower: 4, upper: 5, step: 0.07, relief: true, mid: true, crown: "steps", niche: true, door: false }],
  ["flat", { w: 0.8, d: 0.6, tw: 0.2, th: 0.26, lower: 4, upper: 4, step: 0.05, relief: true, mid: true, crown: "flat", niche: false, door: false }],
];

/** Every stove of the family, a row per glaze (for compositions/stove-family.tsx): ids stove-BODY-GLAZE and
 *  stove-salon-BODY-GLAZE. kit/salon.ts salon-stove is the salon's one hand-built stove beside them. */
export const STOVE_ROWS: { label: string; ids: string[] }[] = [];
const family = (pre: string, item: string, glazes: [string, Glaze][], bodies: [string, Body][], label: string) => {
  for (const [g, gz] of glazes) {
    const ids: string[] = [];
    for (const [b, body] of bodies) {
      const id = `${pre}-${b}-${g}`, k: Kachel = { ...body, ...gz };
      prop({ id, items: [item], place: "corner", ...sizeOf(k), parts: () => kachel(k) });
      ids.push(id);
    }
    STOVE_ROWS.push({ label: `${label}, ${g.replace("-", " with ")}`, ids });
  }
};
family("stove", "tiled-stove", ROOM_GLAZES, ROOM_BODIES, "stoked from the room");
family("stove-salon", "stove-hinterlader", SALON_GLAZES, SALON_BODIES, "the salon's, stoked from the corridor");

export const KIT_STOVES = true;
