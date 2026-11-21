// Generated rooms, side by side: the furnisher's output for each atlas entry (interiors/atlas.ts), with a view camera
// from the window and the five atlas faces from the room's centre. What the city's thousands of rooms look like
// before anyone dresses one by hand.
import { RECIPES } from "../../research/catalogue/rooms";
import { ATLAS, type AtlasRoom } from "../atlas";
import { furnish, shellFor } from "../furnish";
import { def } from "../kit/prop";
import { shopSet } from "../shops";
import { atticLoft, LOFT } from "../attic";
import { cellarSlice, SLICE } from "../cellars";
import { stairDims, stairSet, STOREYS } from "../stair";
import type { Cam, Room, Set } from "./types";

export const FACES = ["back", "left", "right", "floor", "ceiling"] as const;

/** Mid-room props are ghosts in the atlas (light, no geometry): a cubemap only holds what stands against its walls. A
 *  deep piece on a wall (a roll-top with its chair) has its middle well out, so its own footprint decides: within
 *  10 cm of a wall, it stands on the wall. */
const midRoom = (p: { prop: string; at: [number, number, number] }, l: number, d: number) => {
  const gap = Math.min(p.at[0], l - p.at[0], p.at[2], d - p.at[2]), s = def(p.prop)?.size ?? [0, 0, 0];
  return gap > 0.6 && gap - Math.max(s[0], s[2]) / 2 > 0.1;
};

/** A shop's display: the shopfront and what stands behind its glass. Left out of the atlas faces (the window shows the
 *  room behind it; the display is in front of the cubemap's centre, so its faces would smear it). */
const DISPLAY = new globalThis.Set(["shopfront-pair", "shopfront-small-green", "shopfront-small-brown", "display-steps", "window-podium", "ration-notice"]);

export function generated(a: AtlasRoom, atlas = false): Set {
  if (a.cellar) {
    // the compartment under a cellar window (interiors/cellars.ts cellarSlice): the box is the compartment, the cube's
    // centre at its middle; daylight from the window's light well, or one candle at dusk
    const S = SLICE, c: [number, number, number] = [S.l / 2, S.cam_y, S.d / 2];
    const dir = { back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], floor: [0, -1, -0.001], ceiling: [0, 1, -0.001] } as const;
    const W = S.window, top = W.sill + W.h / 2;
    return {
      id: `${atlas ? "atlas" : "room"}-${String(a.n).padStart(2, "0")}`,
      title: `Atlas room ${a.n}: ${a.note}`,
      use: `atlas room ${a.n}: ${a.note}`,
      rooms: [cellarSlice(a.seed, a.lit)],
      cams: [
        { id: "view", eye: [S.l / 2 + 0.1, top + 0.15, S.d + 1.0], at: [S.l / 2 - 0.05, 0.2, 0.9], fov: 55, note: "through the cellar window, from the pavement" },
        ...FACES.map((f) => ({ id: f, eye: c, at: [c[0] + dir[f][0], c[1] + dir[f][1], c[2] + dir[f][2]] as [number, number, number], fov: 90, note: `atlas face ${f}` })),
      ],
      sky: a.lit ? [] : [{ at: [S.l / 2, top, S.d + 0.4], look: [S.l / 2, 0, S.d - 1.2], w: W.w, h: W.h, lumens: 700, color: "#a9b6c9" }],
      ambient: a.lit ? { color: "#3a2e24", brightness: 4 } : { color: "#6d7686", brightness: 14 },
      exposure: a.lit ? 3.5 : -3,
      wear: { dust: 0.55, dirt: 0.6, edges: 0.4 },
    };
  }
  if (a.loft) {
    // the drying loft behind a dormer (interiors/attic.ts): the cube's centre mid-room at a standing child's eye, so the
    // lattice and the rafters both reach the faces; daylight through the dormer, or someone's lantern
    const L = LOFT, c: [number, number, number] = [L.l / 2, L.cam_y, L.d / 2];
    const dir = { back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], floor: [0, -1, -0.001], ceiling: [0, 1, -0.001] } as const;
    const W = L.dormer;
    return {
      id: `${atlas ? "atlas" : "room"}-${String(a.n).padStart(2, "0")}`,
      title: `Atlas room ${a.n}: ${a.note}`,
      use: `atlas room ${a.n}: ${a.note}`,
      rooms: [atticLoft(a.seed, a.lit)],
      cams: [
        { id: "view", eye: [L.l / 2 + 0.15, 1.5, L.d - 0.25], at: [L.l / 2 - 0.25, 1.0, 0.3], fov: 74, note: "from the dormer" },
        ...FACES.map((f) => ({ id: f, eye: c, at: [c[0] + dir[f][0], c[1] + dir[f][1], c[2] + dir[f][2]] as [number, number, number], fov: 90, note: `atlas face ${f}` })),
      ],
      sky: [{ at: [L.l / 2, W.y + W.h / 2, L.d + 0.4], look: [L.l / 2, 0.4, 0], w: W.w, h: W.h, lumens: a.lit ? 40 : 1600, color: a.lit ? "#3a4866" : "#c9d6e8" }],
      ambient: a.lit ? { color: "#3a2e24", brightness: 8 } : { color: "#9aa8bd", brightness: 40 },
      exposure: a.lit ? 0.8 : -4,
      wear: { dust: 0.6, dirt: 0.5, edges: 0.4 },
    };
  }
  if (a.stair) {
    // one storey of the stairwell round the middle half-landing (storey 1 of 3, so flights rise and fall on both sides):
    // the box over the half-landing, its window 0.9 m up, the cube's centre over the well (window.ts paneFor). No
    // ghosts: the flights are the room. No court (its panes would read this very array).
    const s = stairSet(a.stair, a.seed, a.lit), { B, d, H } = stairDims(a.stair, a.seed), y = H + H / 2;
    const room: Room = { ...s.rooms[0], props: s.rooms[0].props.map((p) => (p.prop === "stair-lamp" ? { ...p, lit: a.lit } : p)) };
    const c: [number, number, number] = [B / 2, y + 1.3, d / 2];
    const dir = { back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], floor: [0, -1, -0.001], ceiling: [0, 1, -0.001] } as const;
    return {
      ...s,
      id: `${atlas ? "atlas" : "room"}-${String(a.n).padStart(2, "0")}`,
      use: `atlas room ${a.n}: ${a.note}`,
      rooms: [room],
      cams: [
        { id: "view", eye: [B / 2 + 0.2, y + 1.5, d - 0.25], at: [B / 2 - 0.2, y + 0.9, 0.3], fov: 74, note: "from the half-landing's window" },
        ...FACES.map((f) => ({ id: f, eye: c, at: [c[0] + dir[f][0], c[1] + dir[f][1], c[2] + dir[f][2]] as [number, number, number], fov: 90, note: `atlas face ${f}` })),
      ],
      // lit: the landing's gas jet carries it, a stop over a flat's lamp (one jet lights a whole well), the dusk sky
      // through the stair window kept low so the pane reads warm from the court, not grey (court-1845, 11-17)
      sky: (s.sky ?? []).slice(0, STOREYS).map((k) => ({ ...k, lumens: a.lit ? k.lumens * 0.12 : 1400 })),
      windows: undefined,
      ambient: a.lit ? { color: "#5a4a3a", brightness: 20 } : { color: "#9aa8bd", brightness: 60 },
      exposure: a.lit ? -1.4 : -5,
    };
  }
  if (a.shop) {
    const s = shopSet(a.shop, a.seed), sh = s.rooms[0].shell;
    const near = (p: { at: [number, number, number] }) => p.at[2] > sh.d - 1.2; // the window stages and their dressing
    const props = s.rooms[0].props.filter((p) => !(atlas && (DISPLAY.has(p.prop) || near(p))));
    const room: Room = { ...s.rooms[0], props: atlas ? props.map((p) => (midRoom(p, sh.l, sh.d) && !p.prop.includes("pendant") && p.prop !== "chandelier" ? { ...p, ghost: true } : p)) : props };
    const c: [number, number, number] = [sh.l / 2, 1.5, sh.d / 2];
    const dir = { back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], floor: [0, -1, -0.001], ceiling: [0, 1, -0.001] } as const;
    return {
      ...s,
      id: `${atlas ? "atlas" : "room"}-${String(a.n).padStart(2, "0")}`,
      use: `atlas room ${a.n}: ${a.note}`,
      rooms: [room],
      cams: [s.cams[0], ...FACES.map((f) => ({ id: f, eye: c, at: [c[0] + dir[f][0], c[1] + dir[f][1], c[2] + dir[f][2]] as [number, number, number], fov: 90, note: `atlas face ${f}` }))],
      outside: [],
      ambient: { color: "#5a4a3a", brightness: 20 },
      exposure: -1.2,
    };
  }
  const r = RECIPES.find((x) => x.id === a.recipe)!;
  const sh = shellFor(r, a.seed, true);
  // the room's gas lamp is what's lit; a room without one (an attic, a maid's room) lights its candle or petroleum lamp
  const LAMPS = ["hoop-lamp", "wall-lamp", "office-pendant", "palais-chandelier", "desk-lamp"];
  const all = furnish(r, sh, a.seed), gas = all.some((p) => LAMPS.includes(p.prop));
  const props = all.map((p) => ((gas ? LAMPS.includes(p.prop) : p.prop === "candle" || p.prop === "petroleum-lamp") ? { ...p, lit: a.lit } : p));
  // a ceiling rose lies flat on the ceiling, so the ceiling face holds it as it is; the chandelier hangs from it
  const room: Room = { id: `${a.recipe}-${a.seed}`, shell: sh, at: [0, 0, 0], props: atlas ? props.map((p) => (midRoom(p, sh.l, sh.d) && p.prop !== "palais-chandelier" && p.prop !== "ceiling-rose" ? { ...p, ghost: true } : p)) : props };
  const c: [number, number, number] = [sh.l / 2, Math.min(1.5, sh.h / 2), sh.d / 2];
  // floor and ceiling lean a hair toward the back so their tops meet the back face in the cross (camera up = +y)
  const dir = { back: [0, 0, -1], left: [-1, 0, 0], right: [1, 0, 0], floor: [0, -1, -0.001], ceiling: [0, 1, -0.001] } as const;
  const cams: Cam[] = [
    { id: "view", eye: [sh.l / 2 + 0.25, 1.55, sh.d - 0.3], at: [sh.l / 2 - 0.25, 1.0, 0.2], fov: 74, note: "from the window" },
    ...FACES.map((f) => ({ id: f, eye: c, at: [c[0] + dir[f][0], c[1] + dir[f][1], c[2] + dir[f][2]] as [number, number, number], fov: 90, note: `atlas face ${f}` })),
  ];
  return {
    id: `${atlas ? "atlas" : "room"}-${String(a.n).padStart(2, "0")}`,
    title: `${r.name} (seed ${a.seed})`,
    use: `atlas room ${a.n}: ${a.note}`,
    rooms: [room],
    cams,
    sky: (sh.openings ?? []).filter((o) => o.kind === "window").map((o) => ({ at: [sh.l - o.u, o.y + o.h / 2, sh.d + 0.4] as [number, number, number], look: [sh.l - o.u, o.y, 0] as [number, number, number], w: o.w, h: o.h, lumens: a.lit ? 60 : 1400, color: a.lit ? "#3a4866" : "#c9d6e8" })),
    ambient: a.lit ? { color: "#5a4a3a", brightness: 20 } : { color: "#9aa8bd", brightness: 60 },
    exposure: a.lit ? (gas ? -2.4 : -0.2) : -5, // a candle is two stops under a gas mantle
    wear: { dust: 0.35, dirt: 0.45, edges: 0.35 },
  };
}
export const GALLERY: Set[] = ATLAS.map((a) => generated(a));
export const ATLAS_SETS: Set[] = ATLAS.map((a) => generated(a, true));
