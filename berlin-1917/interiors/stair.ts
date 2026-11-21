// A tenement's stairwell from its kind and a seed (interiors/kit/stair.ts): the dog-leg stair every Berlin house is
// climbed by, three storeys of it, as a set to look at and walk (tier 2/3), and one storey as the atlas room behind a
// stair pane (tier 0). One function fills every stairwell of its kind, as shops.ts and corner.ts fill every shop.
//
// The stair hall's frame (the room convention, interiors/shell.ts): x across the hall (0..B), z from the landings'
// wall (0) to the court wall (d) where the half-landings' windows are, y up. Each storey k: the floor landing along
// the back (z 0..dl) with the flat doors; flight A up the right side toward the court to the half-landing (z d-dh..d)
// under the window; flight B back up the left side to the next floor landing. The ground floor's landing is the hall's
// floor, entered from the hall (front building) or the court (rear) through the left wall.
import { hash, type V3 } from "./kit/geo";
import { breadth, flightId, flightRun, SLAB, STAIR, type StairStyle } from "./kit/stair";
import type { Opening, Shell } from "./shell";
import { onWall, type Place, type Room, type Set } from "./sets/types";

export const STOREYS = 3;
/** The half-landings' windows: the openings, and the pane a stair atlas room is seen through. */
export const STAIR_WINDOW = { front: { w: 1.1, h: 1.7 }, rear: { w: 0.8, h: 1.1 } };
const WIN = STAIR_WINDOW;

export function stairDims(kind: StairStyle, seed: number) {
  const S = STAIR[kind], H = S.H[Math.floor(hash(seed, 1, 601) * S.H.length)], run = flightRun(kind, H);
  return { ...S, H, B: breadth(kind), run, d: S.dl + run + S.dh };
}

export function stairShell(kind: StairStyle, seed: number): Shell {
  const { H, B, d, dl } = stairDims(kind, seed), front = kind === "front", win = WIN[kind];
  return {
    l: B, d, h: STOREYS * H + 3.1, // the top landing's attic door and the flats' doors (2.9 m) under the roof t: { back: 0.38, front: 0.38, left: 0.25, right: 0.38 }, seed: Math.floor(seed * 7) % 997,
    walls: front ? "lime-wash" : "lime-dirty", dado: { mat: front ? "dado-brown" : "oil-dado", h: 1.25 },
    floor: front ? "tiles" : "cement", ceiling: "plaster",
    openings: [
      ...Array.from({ length: STOREYS }, (_, k) => ({ wall: "front" as const, u: B / 2, w: win.w, y: k * H + H / 2 + 0.9, h: win.h, kind: "window" as const })),
      { wall: "left", u: d - dl / 2, w: front ? 1.3 : 1.0, y: 0, h: front ? 2.6 : 2.1, kind: front ? "arch" : "door" }, // from the hall, or the court
    ],
  };
}

/** What a stairwell holds, placed: flights, landings, windows, doors and their mats, the gas lamps, and the rear
 *  stair's WC doors, sinks and flaking walls. `lit`: the landings' gas (some burn, as the war's economy allowed). */
export function stairProps(kind: StairStyle, seed: number, lit = true): Place[] {
  const { H, B, d, dl, dh, w, run } = stairDims(kind, seed), sh = stairShell(kind, seed), front = kind === "front";
  const r = (k: number) => hash(seed, k, 602), p: Place[] = [];
  const runner = front && r(1) < 0.55; // in some houses the runner stayed; elsewhere it went with its brass rods
  const door = front ? "flat-door-oak" : "flat-door-plain", dd = front ? 0.1 : 0.08;
  for (let k = 0; k < STOREYS; k++) {
    const y0 = k * H;
    p.push({ prop: flightId(kind, H, runner), at: [B - w / 2, y0, dl + run / 2], yaw: Math.PI, name: `flight-${k}a` });
    p.push({ prop: flightId(kind, H, runner), at: [w / 2, y0 + H / 2, dl + run / 2], yaw: 0, name: `flight-${k}b` });
    p.push({ prop: `landing-${kind}-half`, at: [B / 2, y0 + H / 2 - SLAB, d - dh / 2], yaw: Math.PI, name: `half-${k}` });
    p.push({ prop: front ? "stair-window-leaded" : "stair-window-plain", at: [B / 2, y0 + H / 2 + 0.9, d + 0.1], yaw: Math.PI, name: `window-${k}` });
    if (!front) {
      // the shared WC off each half-landing, and the walls flaking along the flights
      p.push({ prop: "wc-door", ...onWall(sh, "left", dh / 2, 0.07, y0 + H / 2), name: `wc-${k}` });
      if (r(40 + k) < 0.7) {
        const z = dl + run * (0.3 + 0.4 * r(44 + k));
        p.push({ prop: `plaster-loss-${"abc"[Math.floor(r(48 + k) * 3)]}`, ...onWall(sh, "right", z, 0.012, y0 + ((z - dl) / run) * (H / 2) + 1.55) });
      }
      if (r(52 + k) < 0.5) p.push({ prop: `plaster-loss-${"abc"[Math.floor(r(56 + k) * 3)]}`, ...onWall(sh, "right", d - dh / 2, 0.012, y0 + H / 2 + 1.4) });
    }
  }
  for (let k = 0; k <= STOREYS; k++) {
    const y = k * H, top = k === STOREYS;
    if (k > 0) p.push({ prop: `landing-${kind}-floor`, at: [B / 2, y - SLAB, dl / 2], yaw: 0, name: `landing-${k}` });
    // the flats' doors: left (the ground floor's is the way in), right, and the back wall's in a three-flat house; the
    // top floor's back door is the attic's
    const doors: { wall: "left" | "right" | "back"; u: number }[] = [{ wall: "right", u: dl / 2 }];
    if (k > 0) doors.push({ wall: "left", u: d - dl / 2 });
    // a front house can have three flats a floor; a rear one has two (its landing is too shallow for a third door)
    const back = top ? "board-door" : front && r(10 + k) < 0.55 ? door : null;
    for (const dr of doors) {
      p.push({ prop: door, ...onWall(sh, dr.wall, dr.u, dd, y), name: `door-${k}-${dr.wall}` });
      if (r(20 + k + (dr.wall === "left" ? 5 : 0)) < 0.6) p.push({ prop: "doormat", at: [dr.wall === "left" ? 0.42 : B - 0.42, y, dl / 2] as V3, yaw: Math.PI / 2 });
    }
    if (back) p.push({ prop: back, ...onWall(sh, "back", B / 2, back === "board-door" ? 0.07 : dd, y), name: `door-${k}-back` });
    // the gas on the landing, left of the back door
    p.push({ prop: "stair-lamp", ...onWall(sh, "back", front ? 0.35 : 0.25, 0.32, y + 1.85), name: `lamp-${k}`, lit: lit && r(30 + k) < (front ? 0.7 : 0.45) });
    // the rear landings' shared tap, on the back wall where a house of two flats a floor has no third door
    if (!front && k > 0 && !top && r(60 + k) < 0.8) p.push({ prop: "landing-sink", ...onWall(sh, "back", B / 2 + 0.1, 0.36, y) });
  }
  // the hall: the house rules by the way in, a pram (front) or a coal box (rear) under the first half-landing
  p.push({ prop: "house-rules", ...onWall(sh, "back", front ? B - 0.4 : B / 2, 0.03, 1.4) });
  if (front) p.push({ prop: "pram-cradle", at: [0.62, 0, d - dh / 2 - 0.05], yaw: Math.PI / 2 + (r(70) - 0.5) * 0.2 });
  else p.push({ prop: "bucket", at: [0.3, 0, d - 0.35], yaw: r(71) * 6 });
  return p;
}

/** The court the half-landings look onto, as a stand-in (the kitchen set's way): its three far walls of windows, each a
 *  room from the atlas, a third lit at dusk. A front stair looks onto the first court, a rear one onto a narrower one. */
function court(kind: StairStyle, seed: number): { room: Room; W: number; D: number } {
  const { H, B, d } = stairDims(kind, seed), W = 10.5, D = kind === "front" ? 9 : 6.5, openings: Opening[] = [];
  for (const wall of ["front", "left", "right"] as const) {
    const len = wall === "front" ? W : D;
    for (let s = 0; s < STOREYS + 1; s++) for (let u = 1.1; u < len - 0.8; u += 2.2) {
      if (hash(seed, s, u, wall.length) < 0.08) continue;
      openings.push({ wall, u, w: 1.0, y: 1.0 + s * H, h: 1.5, kind: "window" });
    }
  }
  return {
    W, D,
    room: { id: "court", shell: { l: W, d: D, h: (STOREYS + 1) * H + 1, t: 0.4, walls: "lime-dirty", floor: "snow", ceiling: "none", skip: ["back"], openings, seed: 11 }, at: [B / 2 - W / 2, 0, d + 0.38], props: [], panes: true },
  };
}

export function stairSet(kind: StairStyle, seed: number, lit = true): Set {
  const { H, B, d, dl, dh, w, run } = stairDims(kind, seed), sh = stairShell(kind, seed), front = kind === "front", win = WIN[kind];
  const ct = court(kind, seed);
  const cams = front
    ? [
      { id: "hall", eye: [B - w / 2, 1.6, dl - 0.7] as V3, at: [B / 2 + 0.3, H / 2 + 1.5, d] as V3, fov: 64, note: "in from the hall: the first flight up to the leaded light" },
      { id: "landing", eye: [0.55, H + 1.55, dl + 0.3] as V3, at: [B - 0.3, H + 1.15, 0.3] as V3, fov: 72, note: "the first floor: the flats' doors, the gas, the next flight" },
      { id: "well", eye: [B / 2, STOREYS * H + 1.55, dl + 0.12] as V3, at: [B / 2 + 0.1, 0.2, dl + run / 2 + 0.3] as V3, fov: 62, note: "over the rail from the top: down the well" },
    ]
    : [
      { id: "up", eye: [B - w / 2, H + 1.55, dl - 0.35] as V3, at: [B - w / 2, H + H / 2 + 1.0, d - 0.2] as V3, fov: 64, note: "at the foot of a flight, looking up it (Alexandrinenstraße 17)" },
      { id: "half", eye: [B - 0.4, H + H / 2 + 1.45, d - dh - 0.45] as V3, at: [0.2, H + H / 2 + 1.0, d - 0.4] as V3, fov: 70, note: "the half-landing: the WC door, the court window" },
      { id: "landing", eye: [B - 0.35, 2 * H + 1.55, dl + 0.25] as V3, at: [0.3, 2 * H + 1.0, 0.3] as V3, fov: 72, note: "a floor landing: the doors, the tap and sink" },
    ];
  return {
    id: `stair-${kind}-${Math.round(seed * 100)}`,
    title: `${front ? "Front" : "Rear"} stairwell, generated (seed ${seed})`,
    use: "every house's stair: the atlas room behind a stair pane, every house the films climb",
    rooms: [{ id: "stair", shell: sh, at: [0, 0, 0], props: stairProps(kind, seed, lit) }, ct.room],
    cams,
    // dusk through each half-landing's window
    sky: [
      ...Array.from({ length: STOREYS }, (_, k) => ({ at: [B / 2, k * H + H / 2 + 0.9 + win.h / 2, d + 0.5] as V3, look: [B / 2, k * H + H / 2 + 0.4, 0] as V3, w: win.w, h: win.h, lumens: front ? 160 : 90, color: "#7d8aa6" })),
      // the dusk over the court's mouth
      { at: [B / 2, (STOREYS + 1) * H + 1, d + 0.38 + ct.D / 2] as V3, look: [B / 2, 0, d + 0.38 + ct.D / 2] as V3, w: ct.W, h: ct.D, lumens: 60, color: "#3c4a66" },
    ],
    // the court's windows: a third lit at this hour, each throwing a little light
    windows: { lit: 0.33, glow: 220, dark: 0.05, lumens: 30, seed: Math.floor(seed * 100) % 97 },
    ambient: { color: "#5a5248", brightness: 18 },
    exposure: front ? -0.4 : -0.2,
    wear: front ? { dust: 0.25, dirt: 0.3, edges: 0.4 } : { dust: 0.4, dirt: 0.6, edges: 0.5 },
  };
}
