// FLOOR3, floor 3: the level as data. Engine-free (runs under bun): the game's step, the bot, the glTF writer, the audio
// engine and the renderer all read this one file. Metres; x east, y up, z south. Yaw 0 looks north (-z).

import GEN from "./sizes.gen.json";
export type V3 = [number, number, number];
export type Rect = { x0: number; z0: number; x1: number; z1: number };
export const H = 2.7; // ceiling height
export const DOOR_H = 2.1;

export type RoomId = "bay" | "cor" | "copy" | "wing" | "lobby";
export type Surface = "carpet" | "lino" | "concrete";
export interface Room extends Rect { id: RoomId; floor: Surface; wall: "beige" | "paper" | "white"; reverb: number }

export const ROOMS: Room[] = [
  { id: "bay", x0: 0, z0: 0, x1: 12, z1: 10, floor: "carpet", wall: "beige", reverb: 0.22 },
  { id: "cor", x0: -6, z0: -2.4, x1: 30, z1: -0.2, floor: "carpet", wall: "paper", reverb: 0.3 },
  { id: "copy", x0: 16, z0: -7.8, x1: 21, z1: -2.6, floor: "lino", wall: "beige", reverb: 0.35 },
  { id: "wing", x0: 30.2, z0: -9, x1: 48, z1: 6, floor: "concrete", wall: "white", reverb: 0.75 },
  { id: "lobby", x0: 48.2, z0: -4.3, x1: 54, z1: 1.7, floor: "lino", wall: "beige", reverb: 0.5 },
];
export const room = (id: RoomId) => ROOMS.find((r) => r.id === id)!;
export function roomAt(x: number, z: number): Room | null {
  for (const r of ROOMS) if (x >= r.x0 - 0.2 && x <= r.x1 + 0.2 && z >= r.z0 - 0.2 && z <= r.z1 + 0.2) return r;
  return null;
}

/** A wall: a box footprint, with openings along its long axis (a..b in that axis's world coordinate, up to `h`). */
export interface Wall extends Rect { name: string; openings: { a: number; b: number; h: number; name: string }[] }
export const COPY_OPEN = { a: 18.0, b: 19.15 }; // the copy room's opening at its widest; the game narrows it
export const WALLS: Wall[] = [
  { name: "bay-s", x0: -0.2, z0: 10, x1: 12.2, z1: 10.2, openings: [] },
  { name: "bay-w", x0: -0.2, z0: 0, x1: 0, z1: 10, openings: [] },
  { name: "bay-e", x0: 12, z0: 0, x1: 12.2, z1: 10, openings: [] },
  { name: "cor-s", x0: -6.2, z0: -0.2, x1: 30, z1: 0, openings: [{ a: 10, b: 11, h: DOOR_H, name: "bay-door" }] },
  { name: "cor-n", x0: -6.2, z0: -2.6, x1: 30, z1: -2.4, openings: [{ a: COPY_OPEN.a, b: COPY_OPEN.b, h: DOOR_H, name: "copy-door" }] },
  { name: "cor-w", x0: -6.2, z0: -2.4, x1: -6, z1: -0.2, openings: [] },
  { name: "copy-w", x0: 15.8, z0: -8, x1: 16, z1: -2.6, openings: [] },
  { name: "copy-e", x0: 21, z0: -8, x1: 21.2, z1: -2.6, openings: [] },
  { name: "copy-n", x0: 15.8, z0: -8, x1: 21.2, z1: -7.8, openings: [] },
  { name: "wing-w", x0: 30, z0: -9.2, x1: 30.2, z1: 6.2, openings: [{ a: -2.4, b: -0.2, h: 2.4, name: "wing-mouth" }] },
  { name: "wing-n", x0: 30.2, z0: -9.2, x1: 48, z1: -9, openings: [] },
  { name: "wing-s", x0: 30.2, z0: 6, x1: 48, z1: 6.2, openings: [] },
  { name: "wing-e", x0: 48, z0: -9.2, x1: 48.2, z1: 6.2, openings: [{ a: -1.9, b: -0.7, h: DOOR_H, name: "lobby-door" }] },
  { name: "lobby-n", x0: 48.2, z0: -4.5, x1: 54.2, z1: -4.3, openings: [] },
  { name: "lobby-s", x0: 48.2, z0: 1.7, x1: 54.2, z1: 1.9, openings: [] },
  { name: "lobby-e", x0: 54, z0: -4.3, x1: 54.2, z1: 1.7, openings: [{ a: -1.8, b: -0.8, h: DOOR_H, name: "stair-door" }] },
];
export const wallAxis = (w: Wall): "x" | "z" => (w.x1 - w.x0 >= w.z1 - w.z0 ? "x" : "z");

/** A solid the player and the hand can't pass: a box. `y1` under 0.5 m is stepped over by nothing (all are walls or furniture). */
export interface Solid extends Rect { y0: number; y1: number; name: string }

/** The static wall solids: each wall split round its openings, with a lintel over each. */
export function wallSolids(): Solid[] {
  const out: Solid[] = [];
  for (const w of WALLS) {
    const ax = wallAxis(w);
    const lo = ax === "x" ? w.x0 : w.z0, hi = ax === "x" ? w.x1 : w.z1;
    let at = lo;
    const ops = [...w.openings].sort((p, q) => p.a - q.a);
    const piece = (a: number, b: number, y0: number, y1: number, n: string) => {
      if (b - a < 1e-6) return;
      out.push(ax === "x" ? { x0: a, x1: b, z0: w.z0, z1: w.z1, y0, y1, name: n } : { x0: w.x0, x1: w.x1, z0: a, z1: b, y0, y1, name: n });
    };
    ops.forEach((o, i) => {
      piece(at, o.a, 0, H, `${w.name}-${i}`);
      piece(o.a, o.b, o.h, H, `${w.name}-lintel-${o.name}`);
      at = o.b;
    });
    piece(at, hi, 0, H, `${w.name}-${ops.length}`);
  }
  return out;
}

// ---- lights ---------------------------------------------------------------------------------------------------------
export type LightKind = "always" | "dead" | "flicker" | "sensor";
export interface Fixture { id: number; x: number; z: number; room: RoomId; kind: LightKind; along: "x" | "z" }
const fx: Omit<Fixture, "id">[] = [];
for (const z of [2.5, 7.5]) for (const x of [2.4, 6, 9.6]) fx.push({ x, z, room: "bay", kind: "always", along: "x" });
[-3.6, 1.2, 6.0, 10.8, 14.4, 19.2, 24.0, 28.8].forEach((x, i) => fx.push({ x, z: -1.3, room: "cor", kind: i < 2 ? "dead" : i === 2 ? "flicker" : "always", along: "x" }));
fx.push({ x: 18.6, z: -5.2, room: "copy", kind: "flicker", along: "z" });
for (const z of [-6.5, -1.3, 3.5]) for (const x of [32.4, 37.2, 42.0, 46.8]) fx.push({ x, z, room: "wing", kind: "sensor", along: "x" });
for (const x of [49.8, 52.2]) fx.push({ x, z: -1.3, room: "lobby", kind: "always", along: "x" });
export const FIXTURES: Fixture[] = fx.map((f, id) => ({ ...f, id }));
/** where it is seen in the wing: under these three far fixtures, in turn */
export const GHOST_AT: [number, number][] = [[46.8, -6.5], [42.0, -6.5], [37.2, -6.5]];
export const fixtureAt = (x: number, z: number) => FIXTURES.find((f) => Math.abs(f.x - x) < 0.01 && Math.abs(f.z - z) < 0.01)!;

// ---- props ----------------------------------------------------------------------------------------------------------
/** A placed model. `size` is its box (w, h, d) before the yaw; `solid` makes it block the player. */
export interface Prop { name: string; file: string; at: V3; yaw: number; size: V3; solid: boolean; scale?: number }
const P: Prop[] = [];
// each model's box, from its sidecar (tools/sizes.sh), and the two the renderer builds itself rather than loading
const SIZES: Record<string, V3> = { ...(GEN as unknown as Record<string, V3>), "afk/column": [0.5, H, 0.5], "afk/carpet-roll": [0.36, 0.36, 3.2] };
function put(name: string, file: string, at: V3, yaw = 0, solid?: boolean, scale = 1) {
  const s = SIZES[file];
  if (!s) throw new Error("no size for " + file);
  P.push({ name, file, at, yaw, size: [s[0] * scale, s[1] * scale, s[2] * scale], solid: solid ?? (s[1] * scale > 0.25 && at[1] < 0.3), scale });
}
// what stands on a desk stands 0.5 mm above its top (f3/desk: exactly 0.787), so no face lies in another's plane
const DESK_TOP = 0.7875;
const PI = Math.PI;

// --- the bay: a spine of partitions along z = 5, three desks a side
export const SPINE_Z = 5;
// the spine: five panels end to end (1.6 m each), so no two share a plane
[2.2, 3.8, 5.4, 7.0, 8.6].forEach((x, i) => put(`bay-part-${i}`, "office/partition", [x, 0, SPINE_Z], 0));
[2.8, 5.4, 8.0].forEach((x, i) => {
  // north desks: the user sits north of the desk, facing south
  put(`bay-desk-n${i}`, "f3/desk", [x, 0, SPINE_Z - 0.21 - 0.5], PI);
  put(`bay-chair-n${i}`, "office/chair", [x + (i === 1 ? 0.35 : -0.1), 0, SPINE_Z - 1.75 - (i === 1 ? 0.5 : 0)], i === 1 ? 2.2 : 0.15);
  // south desks: the user sits south, facing north
  put(`bay-desk-s${i}`, "f3/desk", [x, 0, SPINE_Z + 0.21 + 0.5], 0);
  if (i !== 0) put(`bay-chair-s${i}`, "office/chair", [x + 0.2, 0, SPINE_Z + 1.72], PI + (i === 2 ? -0.5 : 0.1));
});
// dividers between neighbours, across the spine
[4.1, 6.7].forEach((x, i) => {
  put(`bay-div-n${i}`, "office/partition", [x, 0, SPINE_Z - 1.0], PI / 2);
  put(`bay-div-s${i}`, "office/partition", [x, 0, SPINE_Z + 1.0], PI / 2);
});
// the player's own desk (s0) and its things; their chair is pushed back behind them
put("bay-chair-s0", "office/chair", [2.2, 0, 7.75], PI - 0.9);
put("bay-kb-s0", "office/keyboard", [2.8, DESK_TOP, 5.95], 0);
put("bay-mug-s0", "office/mug", [3.45, DESK_TOP, 5.9], 0.6);
put("bay-crt-s0", "afk/crt", [2.8, DESK_TOP, 5.52], 0);
put("bay-notes-s0", "f3/clipboard", [2.1, DESK_TOP, 5.95], 0.2);
put("bay-crt-s1", "afk/crt", [5.3, DESK_TOP, 5.52], 0.12);
put("bay-kb-s1", "office/keyboard", [5.4, DESK_TOP, 5.98], 0.05);
put("bay-crt-s2", "afk/crt", [8.1, DESK_TOP, 5.52], -0.1);
put("bay-stationery-s2", "f3/pencup", [8.75, DESK_TOP, 5.6], 0);
put("bay-crt-n0", "afk/crt", [2.8, DESK_TOP, 4.48], PI);
put("bay-kb-n0", "office/keyboard", [2.75, DESK_TOP, 4.02], PI);
put("bay-lamp-n0", "f3/lamp", [3.5, DESK_TOP, 4.4], PI + 0.5);
put("bay-crt-n1", "afk/crt", [5.5, DESK_TOP, 4.48], PI + 0.1);
put("bay-stapler-n1", "f3/stapler", [4.85, DESK_TOP, 4.1], 1.0);
put("bay-crt-n2", "afk/crt", [7.75, DESK_TOP, 4.48], PI - 0.08);
put("bay-kb-n2", "office/keyboard", [7.8, DESK_TOP, 4.02], PI);
/** the ringing phone: north desk 2, at its east end */
export const PHONE1: V3 = [8.72, DESK_TOP, 4.12];
put("phone-1", "office/phone", PHONE1, PI + 0.25);
put("bay-mug-n2", "office/mug", [8.35, DESK_TOP, 4.45], 2.0);
// what the others left on their desks: photos turned to their chairs, paperwork, a cardigan for the air conditioning
put("bay-photo-n0", "f3/photo-dog", [2.05, DESK_TOP + 0.0005, 4.55], PI - 0.25); // its strut's foot dips 0.2 mm under its origin
put("bay-papers-n0", "f3/papers", [2.12, DESK_TOP, 4.08], PI + 0.12);
put("bay-kb-n1", "office/keyboard", [5.45, DESK_TOP, 4.02], PI + 0.06);
put("bay-papers-n1", "f3/papers", [6.02, DESK_TOP, 4.12], PI - 0.2);
put("bay-pencup-n1", "f3/pencup", [4.62, DESK_TOP, 4.55], 0.7);
put("bay-photo-n2", "f3/photo-beach", [7.18, DESK_TOP + 0.0005, 4.56], PI + 0.2);
put("bay-pencup-s0", "f3/pencup", [3.58, DESK_TOP, 5.45], 2.1);
put("bay-papers-s1", "f3/papers", [6.08, DESK_TOP, 5.86], 0.18);
put("bay-mug-s1", "office/mug", [4.72, DESK_TOP, 5.98], 4.1);
put("bay-kb-s2", "office/keyboard", [8.05, DESK_TOP, 5.97], -0.04);
put("bay-lamp-s2", "f3/lamp", [7.28, DESK_TOP, 5.48], 0.45);
put("bay-cardigan-s2", "f3/cardigan", [8.72, DESK_TOP, 6.0], 0.3);
put("bay-calendar", "f3/calendar", [3.2, 1.78, 0.0005], 0);
put("cor-poster", "f3/poster-exits", [10.6, 1.55, -2.3996], 0); // its sheet (0.6 mm in front of its origin) a millimetre off the wall: a bare sheet facing as the wall does needs that much between them
put("bay-cab-0", "office/filing-cabinet", [11.62, 0, 3.2], -PI / 2);
put("bay-cab-1", "office/filing-cabinet", [11.62, 0, 3.7], -PI / 2);
put("bay-cab-2", "office/filing-cabinet", [11.62, 0, 4.2], -PI / 2);
put("bay-cooler", "office/water-cooler", [9.0, 0, 0.3], 0);
put("bay-plant", "f3/plant-corn", [0.55, 0, 0.6], 0.4);
put("bay-plant-b", "f3/plant-snake", [11.4, 0, 9.4], 2.0);
put("bay-printer", "office/printer", [0.45, 0, 8.6], PI / 2);
put("bay-bin-0", "office/bin", [1.5, 0, 6.2], 0);
put("bay-bin-1", "office/bin", [6.75, 0, 3.0], 0);
put("bay-shelf", "f3/bookcase", [5.0, 0, 9.72], PI);
put("bay-whiteboard", "office/whiteboard", [0.0015, 1.0, 4.2], PI / 2); // its back (1 mm behind its origin) half a millimetre off the wall
put("bay-clock", "f3/clock", [6.0, 2.0, 0.001], 0);
put("bay-exit", "office/exit-sign", [10.5, H, 0.05], 0); // hung from the ceiling by its rods (its origin is the rods' top)
put("bay-alarm", "f3/alarm", [11.5, 1.3, 0.001], 0);

// --- the corridor: closed doors, a notice board, an extinguisher
[[6.0, "n"], [12.6, "n"], [25.2, "n"], [15.0, "s"], [21.6, "s"], [27.0, "s"], [2.0, "s"], [-2.5, "n"]].forEach(([x, side], i) => {
  put(`cor-door-${i}`, "hallway/door", [x as number, 0, side === "n" ? -2.4 : -0.2], side === "n" ? 0 : PI, false);
});
put("cor-board", "stairwell/notice-board", [14.3, 1.25, -2.3995], 0);
put("cor-ext", "f3/extinguisher", [22.6, 0, -0.3125], PI); // in its floor stand, its back clear of the 12 mm cove base
put("cor-clock", "f3/clock", [20.2, 2.05, -0.201], PI);
put("cor-frame-0", "f3/frame-teamwork", [8.6, 1.45, -2.399], 0); // hung on its back face, flat to the wall
put("cor-frame-1", "f3/frame-lake", [23.4, 1.5, -2.399], 0);
put("cor-plant", "f3/plant-corn", [29.45, 0, -0.62], 1.0);
put("cor-alarm", "f3/alarm", [17.3, 1.3, -2.399], 0);
put("cor-wet", "f3/wet-sign", [26.1, 0, -1.85], 0.5);

// --- the copy room
export const RECORDER: V3 = [20.3, DESK_TOP, -4.55];
export const BADGE: V3 = [20.26, DESK_TOP + 0.0005, -5.2]; // its card dips 0.1 mm under its origin
put("copy-desk", "f3/desk", [20.5, 0, -4.9], -PI / 2);
put("recorder", "afk/recorder", RECORDER, -PI / 2 + 0.15);
put("copy-copier", "afk/copier", [18.3, 0, -7.42], 0);
put("copy-shelf", "f3/bookcase", [16.3, 0, -5.6], PI / 2);
put("copy-cab", "office/filing-cabinet", [16.38, 0, -3.3], PI / 2);
put("copy-bin", "office/bin", [19.4, 0, -7.5], 0);
put("copy-notes", "f3/papers", [20.7, DESK_TOP, -4.3], -PI / 2);
put("copy-clipboard", "f3/clipboard", [20.35, DESK_TOP, -5.68], -1.2);

// --- the wing: columns, and what the fitters left
export const COLUMNS: [number, number][] = [[34.8, -4.4], [39.3, -4.4], [43.8, -4.4], [34.8, 1.6], [39.3, 1.6], [43.8, 1.6]];
COLUMNS.forEach(([x, z], i) => put(`wing-col-${i}`, "afk/column", [x, 0, z], 0, true));
put("wing-desk-0", "f3/desk", [44.9, 0, 4.9], 0.2);
put("wing-desk-1", "f3/desk", [46.6, 0, 3.4], PI / 2 + 0.1);
put("wing-chair-0", "office/chair", [43.3, 0, 5.2], 2.4);
put("wing-chair-1", "office/chair", [45.5, 0, 3.3], 0.7);
put("wing-chair-2", "office/chair", [36.2, 0, -7.9], 3.6);
put("wing-cab-0", "office/filing-cabinet", [47.6, 0, -6.2], -PI / 2);
put("wing-cab-1", "office/filing-cabinet", [47.6, 0, -6.75], -PI / 2);
put("wing-part-0", "office/partition", [33.2, 0, 5.75], 0);
put("wing-part-1", "office/partition", [35.0, 0, 5.75], 0);
put("wing-part-2", "office/partition", [40.3, 0, -8.72], 0);
put("wing-roll-0", "afk/carpet-roll", [38.0, 0, 5.55], PI / 2); // two rolls side by side along the wall
put("wing-roll-1", "afk/carpet-roll", [38.15, 0, 5.15], PI / 2);
put("wing-bin", "office/bin", [41.0, 0, 2.2], 0);
put("wing-wet", "f3/wet-sign", [33.4, 0, -3.6], 2.2);
put("wing-radiator", "stairwell/radiator", [39.0, 0, -9.0275], 0, false); // on its feet, its back (40 mm behind its origin) clear of the cove base

// --- the lobby: the security desk, the stair door
export const MACHINE: V3 = [51.55, DESK_TOP + 0.011, -3.42]; // its feet reach 11 mm under its origin
export const READER: V3 = [53.9995, 1.22, -0.52];
export const STAIR_DOOR: V3 = [54.0, 0, -1.3];
put("lobby-desk", "f3/desk", [51.0, 0, -3.55], 0);
put("lobby-chair", "office/chair", [49.6, 0, -3.3], 2.4); // rolled away from the desk, which stands against the wall
put("lobby-crt", "afk/crt", [50.45, DESK_TOP, -3.6], 0.25);
put("lobby-kb", "office/keyboard", [50.5, DESK_TOP, -3.215], 0.2); // its cable ends a centimetre short of the CRT's foot, under its bezel
put("machine", "afk/answering", MACHINE, 0);
put("phone-2", "office/phone", [51.82, DESK_TOP, -3.5], -0.2);
put("lobby-mug", "office/mug", [51.1, DESK_TOP, -3.3], 1.0);
put("stair-door", "stairwell/door", STAIR_DOOR, -PI / 2, false);
put("reader", "afk/reader", READER, -PI / 2, false);
put("lobby-exit", "stairwell/exit-sign", [53.6, H, -1.3], -PI / 2);
put("lobby-sign", "stairwell/stair-sign", [53.9975, 1.6, -2.15], -PI / 2);
put("lobby-plant", "f3/plant-corn", [53.5, 0, 1.2], 2.5);
put("lobby-ext", "f3/extinguisher", [48.3125, 0, 0.6], PI / 2);
put("lobby-clock", "f3/clock", [51.0, 2.05, 1.699], PI);
put("lobby-cab", "office/filing-cabinet", [48.62, 0, -3.9], PI / 2);
put("lobby-board", "stairwell/notice-board", [51.6, 1.3, 1.6995], PI);
export const PROPS: Prop[] = P;
export const prop = (name: string) => PROPS.find((p) => p.name === name)!;

/** a prop's footprint as a solid: its box turned by its yaw (to the nearest quarter turn's bounds for others) */
export function propSolid(p: Prop): Solid {
  const c = Math.abs(Math.cos(p.yaw)), s = Math.abs(Math.sin(p.yaw));
  const hx = (p.size[0] * c + p.size[2] * s) / 2, hz = (p.size[0] * s + p.size[2] * c) / 2;
  return { x0: p.at[0] - hx, x1: p.at[0] + hx, z0: p.at[2] - hz, z1: p.at[2] + hz, y0: p.at[1], y1: p.at[1] + p.size[1], name: p.name };
}

/** every static solid: walls, then the props that block */
export const STATIC_SOLIDS: Solid[] = [
  ...wallSolids(),
  ...PROPS.filter((p) => p.solid).map(propSolid),
  // the stair door, closed
  { x0: 53.95, x1: 54.2, z0: -1.8, z1: -0.8, y0: 0, y1: DOOR_H, name: "stair-door-leaf" },
];
/** boxes the hand must not enter, besides the solids: everything on a desk or a wall */
export const HAND_SOLIDS: Solid[] = [...STATIC_SOLIDS, ...PROPS.filter((p) => !p.solid).map(propSolid)];

// ---- things the cursor acts on -----------------------------------------------------------------------------------------
export const LOCKED_DOOR: V3 = [12.6, 0, -2.4];
/** the facilities notice pinned on the corridor's board (its middle, on the board's face), and the copier's output tray */
export const NOTICE: V3 = [14.12, 1.32, -2.3855]; // pinned over the board's own papers (their faces 14 mm proud of its back)
export const TRAY: V3 = [17.93, 0.835, -7.42];
/** the office door across from the copy room that someone knocks on from inside */
export const KNOCK_DOOR: V3 = [21.6, 1.15, -0.2];
export type InteractId = "locked" | "phone1" | "copy-edge" | "recorder" | "badge" | "reader" | "machine" | "stair-handle" | "notice" | "printout";
export interface Interact { id: InteractId; at: V3; r: number; reach: number; kind: "press" | "grab" | "resize"; label: string }
export const INTERACTS: Interact[] = [
  { id: "phone1", at: [PHONE1[0] - 0.02, PHONE1[1] + 0.07, PHONE1[2] - 0.03], r: 0.16, reach: 1.25, kind: "press", label: "Play message" },
  { id: "copy-edge", at: [18.35, 1.15, -2.5], r: 0.2, reach: 1.3, kind: "resize", label: "Resize" },
  { id: "recorder", at: [RECORDER[0], RECORDER[1] + 0.05, RECORDER[2]], r: 0.15, reach: 1.25, kind: "press", label: "Play tape" },
  { id: "badge", at: [BADGE[0], BADGE[1] + 0.01, BADGE[2]], r: 0.12, reach: 1.25, kind: "grab", label: "Take badge" },
  { id: "reader", at: [READER[0] - 0.03, READER[1] + 0.02, READER[2]], r: 0.14, reach: 1.2, kind: "press", label: "Swipe badge" },
  { id: "machine", at: [MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], r: 0.15, reach: 1.25, kind: "press", label: "Answering machine" },
  { id: "locked", at: [LOCKED_DOOR[0] + 0.36, 1.0, -2.33], r: 0.16, reach: 1.2, kind: "press", label: "Open" },
  { id: "stair-handle", at: [53.93, 1.02, -0.98], r: 0.14, reach: 1.2, kind: "press", label: "Open" },
  { id: "notice", at: [NOTICE[0], NOTICE[1], NOTICE[2] + 0.01], r: 0.22, reach: 1.45, kind: "press", label: "Read" },
  { id: "printout", at: [TRAY[0], TRAY[1] + 0.01, TRAY[2]], r: 0.15, reach: 1.35, kind: "grab", label: "Take" },
];
export const interact = (id: InteractId) => INTERACTS.find((i) => i.id === id)!;

export const START = { x: 2.9, z: 7.05, yaw: 0.0, pitch: -0.32 };
export const EYE = 1.64;
export const RADIUS = 0.3;
