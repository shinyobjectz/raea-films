// v3's opening: one walk forward through doors (0 to 33.77 s). the director, 11-11: "the first 30-40s econds right now is
// all ofcicie id rather not be there and shift into amny other places we can build and center on something liek a
// door for match cuts" and "we cant linger it gets boring otherwise".
// Every shot is the same move: down the middle of a room toward the door in its far wall, at walking pace, the door
// held at the centre of the frame. The cut to the next room is made as we reach the door, so the walk never breaks
// and the door is the thing each cut is made on. A few seconds a room, one thing in each:
//   hallway     (0)      out of black, its lines; the cursor comes in, a small round window of the real room round it
//   kitchen     (2.75)   a drawing; the cursor rests on the plant by the door (real in its pick box), then opens the door
//   living      (7.11)   a drawing; it rests on the lounge chair, then opens the door
//   study       (12.19)  the drop: it clicks, and the real room spreads out from the click; the door
//   workshop    (15.01)  real; it carries a stool out of our way; the door
//   greenhouse  (18.36)  real; it carries a plant across to the bench; the door
//   dining      (23.48)  real; it carries a chair back to the table; the door
//   cellar      (27.70)  real, lamplit; it clicks and the drawing spreads back over the frame; the last door opens on the canyon's lines
// (The office is out of the opening: "id rather not be there". Its walk is kept below, unused.)
// The cursor is a thing in each room (v3/hand3d.tsx): it comes in past the lens, goes to what it touches, and its
// clicks and rests are refused at render if they fall outside the middle of the frame.
import { ROOM, officeRoom } from "../sets/office-room";
import { DOOR, RH, RZ, roomItems, shell } from "../sets/rooms";
import { doorGarden } from "../sets/outdoors";
import { CANYON, TURN } from "../sets/canyon";
import { CANYON_DOOR, CUT } from "./canyon-door";
import SIZES from "../sets/rooms.sizes.json";
import type { V3 } from "../v2/math";
import { PickBox } from "../v2/ui";
import { camAt, type Dolly } from "./cam";
import { boxOf, carried as carriedOn, pulseOf, spread, rectOf } from "./hand";
import { Box3D, Hand3D, JOIN, at, edge, follow, front, handAt, type Key } from "./hand3d";
import { TAKE_KEYS } from "./takekeys";
import type { Look } from "./look";
import type { Cam } from "./cam";
import { tallTake } from "./tall";
import { H, W, shot as shotOf, type Shot } from "./plan";
import { Img, staticFile } from "raea";
const shotFrom = (id: string) => shotOf(id).from;
import { DOOR_HOLD, ROOM_T, ROOM_TAPS } from "./times";
import { Panel3D, SLIDER, SWATCH, Slider, Swatches, TOGGLE, TOGGLE_AT, Toggle, onPanel, sliderX, spring, swatchX, type Panel } from "./controls";
import { Scene, type Env, type Glow, type Item, type Sun } from "./scene";
import { PortalBox } from "./kit";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const mix3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const Q = Math.PI / 2;

/** where a room door's knob is, the leaf `open` (0..1 of its 105 degrees) */
const knob = (open: number): V3 => { const a = (105 * Math.PI) / 180 * open; return [DOOR.hinge[0] + Math.cos(a) * 0.868, 1.02, DOOR.hinge[2] - Math.sin(a) * 0.868 + 0.075]; };
/** a painting hung as a door: its frame's middle and its turn when it has swung `open` (0..1 of 100 degrees) into the room
 *  about its left edge; and the point on its right edge the cursor takes it by */
const PAINT_W = 1.5, PAINT_Z = -RZ + 0.2;
const paintAt = (open: number): { at: V3; yaw: number } => { const a = ((100 * Math.PI) / 180) * open; return { at: [-PAINT_W / 2 + (PAINT_W / 2) * Math.cos(a), 1.09, PAINT_Z + (PAINT_W / 2) * Math.sin(a)], yaw: -a }; };
const paintEdge = (open: number): V3 => { const a = ((100 * Math.PI) / 180) * open; return [-PAINT_W / 2 + (PAINT_W - 0.06) * Math.cos(a), 1.05, PAINT_Z + (PAINT_W - 0.06) * Math.sin(a) + 0.02]; };
/** the walk: from z0 down the room's middle at `speed` m/s, the lens level with the door's middle */
const walk = (z0: number, speed: number, x = 0, fov = 50): Dolly => ({ eye: [x, 1.45, z0], yaw: 0, pitch: -1.2, vel: [0, 0, -speed], fov });

type Carry = { name: string; a: V3; b: V3; from: number; to: number; half: V3; up: number };
type Rest = { at: V3; half: V3; from: number; to: number; what: string };
type RoomShot = {
  /** where we come into it: the place's own z of the doorway behind us (a room: its back wall, 3.2) */ back?: number;
  /** this world's way out is not a door: a tall framed painting hung over the opening, which swings into the room like
   *  one (the director, 11-11: "rethink in every world what and where a door is") */ painting?: boolean;
  /** not a room: the slot canyon the last door opens on (it is the next shot's place, v3/places.tsx) */ canyon?: boolean;
  /** a thing the cursor's rest lights: where its flame is */ lights?: V3;
  /** the black abyss the film opens in: a floor, a door standing alone, one light over it */ abyss?: boolean;
  place: string; /** not a room: the door in the garden (sets/outdoors.ts doorGarden), its wall and door this place's */ outdoor?: boolean; cam: Dolly; drawing: boolean; /** the side the cursor comes in from (1 right, the default; -1 left) */ enter?: number;
  /** the door: the second it is clicked; it swings from then to the cut (99: it stays shut) */
  door: number;
  /** the film's first shot comes up out of black over these seconds */
  fadeIn?: [number, number];
  rest?: Rest; carry?: Carry;
  /** a click that turns the drawing real (or, `toDrawing`, the real room back to its drawing): its second and its point in the room */
  click?: { t: number; at: V3; toDrawing?: boolean; over: number };
  /** the day's slider on the wall: as the cursor drags it the sun goes down and the lamp comes up (from, to, the lamp's bulb) */
  dusk?: { t: number; to: number; lamp: V3 };
  /** a row of swatches on the wall: the one the cursor clicks is what the walls are painted (the second; the colours; which) */
  swatch?: { t: number; colors: string[]; pick: number };
  /** the rest is on a toggle on the wall (a switch plate), not on a thing: no pick box round it */ toggle?: boolean;
  sun: Sun; env: Env; ev: number; warm: number; glows?: Glow[];
};
const size = (place: string, name: string) => (SIZES as Record<string, Record<string, [number, number, number]>>)[place][name];
const WALL_IN = 0.17;                                                       // the far wall's face, in from its line
const DAYSKY = "kloofendal_48d_partly_cloudy_puresky";

// (the workshop is out and the door in the garden is in, 11-11: "some of the door scenes be more surreal ... not just a dark room")
export const WALK = ["hallway", "kitchen", "living", "study", "greenhouse", "gardendoor", "dining", "cellar"];
/** the walk's shots that are worlds of their own (v3/worlds.tsx), not rooms: all but the garden's door */
export const WORLD_IDS = ["hallway", "kitchen", "living", "study", "greenhouse", "dining", "cellar"];
const world = (back: number): RoomShot => ({ place: "world", back, cam: walk(back, 1), drawing: false, door: 99, sun: { lux: 0, from: [0, 1, 0] }, env: { src: DAYSKY, intensity: 0 }, ev: 0, warm: 0 });
const ROOMS: Record<string, RoomShot> = {
  // (the door in the rock, v3/worlds.tsx: only its length is used here, for the take: 17 m of sea before the rock)
  kitchen: {
    place: "kitchen", back: 14, cam: walk(2.9, 1.12), drawing: true, door: 2.95, enter: -1,   // (in from the left: from the right its way lay through the table)
    // (it rests on the wall clock by the door: the plant it used to rest on stood behind the table at the frame's edge)
    rest: { at: [-1.35, 1.95, -RZ + WALL_IN], half: [0.17, 0.17, 0.03], from: 1.19, to: 2.2, what: "rest on the clock" },
    sun: { lux: 60000, from: [30, 16, 8], to: [0, 0.8, 0], color: "#ffe2bd" }, env: { src: DAYSKY, intensity: 1.2, rotation: 1.2 }, ev: 2.5, warm: 0.4,
  },
  // the door in the garden: a meadow, a wall with a door standing alone in it, the dining room behind the wall
  gardendoor: {
    // (we come to it from across the meadow, twice a room's length away, so the wall stands small in the garden with the
    // sky over it; at a room's length it filled the frame and was only a white wall)
    place: "dining", outdoor: true, back: 6.4, cam: walk(8.2, 1.95), drawing: false, door: 3.6,
    carry: { name: "watering-can", a: [0.45, 0, -0.3], b: [-0.8, 0, -2.3], from: 0.9, to: 2.5, half: [0.12, 0.12, 0.24], up: 0.12 },
    sun: { lux: 70000, from: [-18, 30, 16], to: [0, 0.8, -3], color: "#fff1d6" }, env: { src: DAYSKY, intensity: 1.0, rotation: 2.6 }, ev: -0.7, warm: 0.35,
  },
  // the film opens in the dark (the director, 11-11, on assembly 19: "maybe this could just be a blakc abyss with some ambient
  // lighting and floor as the first door"): a floor, a door standing by itself, a light over it
  hallway: {
    place: "hallway", abyss: true, back: 1.7, cam: walk(1.4, 1.6), drawing: false, door: 1.65, fadeIn: [0.2, 1.6],
    sun: { lux: 0, from: [30, 8, 2], to: [0, 0.8, 0], color: "#ffffff" }, env: { src: DAYSKY, intensity: 0.0002, rotation: 1.2 }, ev: 3.2, warm: 0.2,
    glows: [{ at: [0.5, 3.6, -RZ + 2.3], half: [0.22, 0.008, 0.22], lum: 420000, color: [1, 0.8, 0.56] }, { at: [-3.5, 5.5, -1.5], half: [0.5, 0.01, 0.5], lum: 9000, color: [0.6, 0.72, 1] }],
  },
  // the new worlds (v3/worlds.tsx draws them; the director, 11-11: "i really do want every time that door opens its a whole new
  // world"): here only how far each is entered from its door counts, for the take
  living: world(10), study: world(6), greenhouse: world(5), dining: world(9), cellar: world(9),
};

/** what stands beyond a room's door: the next room of the walk, whole, on the far side of the wall (the director, 11-11,
 *  assembly 18: "in each doorway when we open it lets have a new world on the othersde"). Its back wall is left out
 *  (it would stand in the doorway); its own door is shut. The cut goes through the door into it. */
const GARDEN_DOOR = (doorGarden() as unknown as Item[]).map((p) => ({ ...p, place: p.place ?? "garden" }));
// the garden's cottage (blender/components/cottage): the house with its front door's sill on the walk's door line, its
// door on the rooms' hinge (so the cursor's knob and the doorway are where they always were), its ivy and its flowers
const COTTAGE_PARTS = ["house", "ivy", "blooms"];
const cottage = (open: number): Item[] => [
  // (the ivy and the flowers grow on the house and in its boxes: they stand into it by design)
  ...COTTAGE_PARTS.map((file): Item => ({ place: "cottage", file, name: file === "house" ? "wall-door" : `cottage-${file}`, at: [0, 0, -RZ], yaw: 0, overlap: file !== "house" })),
  { place: "cottage", file: "door", name: "door", at: DOOR.hinge, yaw: 0, clip: "open", t: open },
];
// the canyon, stood beyond a door: its own pieces put back as built (the set is turned 28 degrees for its sun) and moved
// so that the point the lens comes in at is the middle of the doorway
const CANYON_NEXT: RoomShot = { place: "canyon", canyon: true, back: 0, cam: walk(0, 1), drawing: true, door: 99, sun: { lux: 0, from: [0, 10, 0] }, env: { src: DAYSKY, intensity: 1 }, ev: 1, warm: 0.2 };
const CANYON_ITEMS: Item[] = CANYON.filter((p) => p.file !== "sky" && p.file !== "sun").map((p, i) => {
  const c = Math.cos(TURN), sn = Math.sin(TURN), u: V3 = [p.at[0] * c - p.at[2] * sn, p.at[1], p.at[0] * sn + p.at[2] * c];
  return { place: "canyon", file: CUT[p.file] ?? p.file, name: p.name ?? `${p.file}-${i}`, at: [u[0] - CANYON_DOOR[0], u[1], u[2] - CANYON_DOOR[2]] as V3, yaw: (p.yaw ?? 0) - TURN, scale: p.scale, clip: p.clip, t: 0 };
});
/** everything that stands in a shot of the walk: a room, the garden with a wall and a door standing in it, or the abyss and its door */
const placeItems = (spec: RoomShot, open: number): Item[] =>
  spec.canyon ? CANYON_ITEMS
  : spec.abyss ? shell(spec.place, open).filter((p) => p.name === "door" || p.name === "wall-door").map((p) => (p.name === "wall-door" ? { ...p, finish: ABYSS_WALL } : p))
  : spec.outdoor ? [...cottage(open), ...GARDEN_DOOR]
  : roomItems(spec.place, open);
// (the abyss's door stands in a wall that is painted out to black, so only the door and its casing are there to see and
// the room behind it is hidden)
const ABYSS_WALL = ["hallway_plaster", "hallway_skirting", "hallway_wall", "hallway_paint"].map((material) => ({ material, color: "#000000", map: null, roughness: 1 }));
const backOf = (spec: RoomShot) => spec.back ?? RZ;
// (seen through a door, the garden is without the trees on its sunward side, which stood between this room's window and
// its sun, and without anything of it that would stand inside this room: its meadow's tiles reach back past the door)
const beyond = (next: RoomShot): Item[] => { const shift = RZ + backOf(next); return placeItems(next, 0).filter((p) => p.name !== "wall-back" && !(next.outdoor && p.at[0] > 3.5 && /^(fir|tree|bank)/.test(p.name)))
  .map((p) => ({ ...p, name: `next-${p.name}`, at: [p.at[0], p.at[1], p.at[2] - shift] as V3 }))
  .filter((p) => !next.outdoor || /lawn/.test(p.name) || p.at[2] < (/meadow/.test(p.name) ? -RZ - 2.6 : -RZ - 0.3)); };
/** the door we have just come through: the last world's wall and its open door, behind us and at the frame's edge */
const behind = (prev: RoomShot, here: RoomShot): Item[] => shell(prev.place, 0.9).filter((p) => p.name === "wall-door" || p.name === "door").map((p) => ({ ...p, name: `prev-${p.name}`, at: [p.at[0], p.at[1], p.at[2] + backOf(here) + RZ] as V3 }));

// the controls' places: each on the far wall, beside the door, like a dimmer or a switch plate
const WALL_Z = -RZ + WALL_IN + 0.004;
const WALL_OWN = [164, 187, 206];                                            // the dining room's plaster, as built (its material's own colour)
const SLIDER_PANEL: Panel = { at: [-1.2, 1.55, WALL_Z], w: 0.8, res: SLIDER };
const TOGGLE_PANEL: Panel = { at: [0.98, 1.3, WALL_Z], w: 0.3, res: TOGGLE };
const SWATCH_PANEL: Panel = { at: [1.2, 1.52, WALL_Z], w: 0.74, res: SWATCH };

// ---- the take: ONE camera move through every world (the director, 11-11, on assembly 19: "we shoudl probably have the openign
// shot be a continuous camera shot between world sthe next leading to another"). The worlds stand end to end on one
// line, each one's far door the next one's way in. The lens goes down that line without stopping and is in a doorway
// at each of the song's beats the walk was cut on; between doors its speed changes smoothly (a monotone curve through
// those points). It is still rendered a world at a time, and the joins fall where the lens is in a doorway: both sides
// of a join show the same world under the same light, so there is no cut to see.
const TAKE = (() => {
  const ts = [0], zs = [backOf(ROOMS[WALK[0]]) - 0.3];
  let entrance = backOf(ROOMS[WALK[0]]);
  const starts: Record<string, number> = {};
  for (const [i, id] of WALK.entries()) {
    starts[id] = entrance - backOf(ROOMS[id]);                                // the world's own z 0, on the line
    const door = starts[id] - RZ;
    ts.push(shotFrom(WALK[i + 1] ?? "canyon")); zs.push(door); entrance = door;
  }
  // a monotone cubic through the doors (Fritsch-Carlson), so the lens never slows to a stop or runs backward
  const n = ts.length, h = ts.slice(1).map((t, i) => t - ts[i]), d = h.map((hh, i) => (zs[i + 1] - zs[i]) / hh), m = new Array<number>(n).fill(0);
  m[0] = d[0]; m[n - 1] = -1.0;                                              // (it goes into the canyon at the canyon's own metre a second)
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / d[i - 1] + (h[i] + 2 * h[i - 1]) / d[i]);
  const z = (t: number) => {
    let i = 0; while (i < n - 2 && t >= ts[i + 1]) i++;
    const u = Math.min(1, Math.max(0, (t - ts[i]) / h[i])), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * zs[i] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * zs[i + 1] + (u3 - u2) * h[i] * m[i + 1];
  };
  return { z, starts };
})();
/** the lens at a second of the film, in a world's own space */
export const takeCam = (id: string, abs: number): Cam => { const eye: V3 = [0, 1.45, TAKE.z(abs) - TAKE.starts[id]]; return tallTake({ eye, look: [0, 1.45 - 0.21, eye[2] - 10], fov: 50 }, abs); };
export const TAKE_SPEED = (abs: number) => (TAKE.z(abs - 0.05) - TAKE.z(abs + 0.05)) / 0.1;
/** how far along the take's line world `to` stands from world `from`: a point of `to` is at its own place plus (0, 0, this) in `from` */
export const shiftOf = (from: string, to: string) => TAKE.starts[to] - TAKE.starts[from];

/** a room's times, each on the song's grid: the clicks, the pick-up and the put-down, the door (v3/times.ts, which the
 *  sound is made from too) */
function timed(id: string, spec: RoomShot): RoomShot {
  const T = ROOM_T[id];
  return {
    ...spec, door: T.door ?? 99,
    rest: spec.rest && { ...spec.rest, from: T.rest! },
    carry: spec.carry && { ...spec.carry, from: T.carry![0], to: T.carry![1] },
    click: spec.click && { ...spec.click, t: T.click! },
    dusk: spec.dusk && { ...spec.dusk, t: T.slide![0], to: T.slide![1] },
    swatch: spec.swatch && { ...spec.swatch, t: T.swatch! },
  };
}
export const ROOM_TIMES = (id: string) => timed(id, ROOMS[id]);
const timedSpec = ROOM_TIMES;

/** a room's door, how far open at t (0..0.9: fully open as we go through it; the click unlatches it with a small jolt
 *  before it swings) */
const openOf = (spec: RoomShot, t: number, len: number) => 0.865 * jerk(ramp(t, spec.door + 0.02, len - 0.04)) + (t >= spec.door ? 0.035 * (1 - Math.exp(-(t - spec.door) * 28)) : 0);   // (no hard stop at 0.9: the cursor rides the knob)
/** the cursor's path through a room without taps (the garden's door): in through the last doorway, to what it carries,
 *  rests on or drags, to the door's knob, and on with the door; and the lens that leans toward it. The other worlds'
 *  doorways show the garden from this lens (v3/kit.tsx) */
export function roomView(s: Shot, t: number): { cam: Cam; hand: ReturnType<typeof handAt> } {
  if ((ROOM_TAPS[s.id] ?? []).length) throw new Error(`roomView: ${s.id} has taps, which need its items`);
  return takeView(s, t);
}
/** a room of the take's own keys at t (no taps) */
const roomTakeKeys = (id: string) => (t: number): Key[] => { const s = shotOf(id), spec = timed(id, ROOMS[id]); return roomKeys(s, t, spec, openOf(spec, t, s.seconds), [], WALK.indexOf(id) > 0); };
TAKE_KEYS.gardendoor = roomTakeKeys("gardendoor");

/** The whole take's cursor keys, seen from world `id` at its t: every world's own keys (v3/takekeys.ts), moved into this
 *  world's space and seconds. A point of world w is at its own place plus (0, 0, shiftOf(id, w)) here, and the key's
 *  own function is asked with the lens moved into w's space. */
export function takeKeys(id: string, t: number): Key[] {
  const here = shotOf(id), out: Key[] = [];
  for (const w of WALK) {
    const make = TAKE_KEYS[w];
    if (!make) continue;
    const dt = shotOf(w).from - here.from, dz = shiftOf(id, w);
    for (const k of make(t - dt)) {
      out.push({ ...k, t: k.t + dt, p: dz === 0 ? k.p : (cam: Cam): V3 => {
        const q = k.p({ ...cam, eye: [cam.eye[0], cam.eye[1], cam.eye[2] - dz], look: [cam.look[0], cam.look[1], cam.look[2] - dz] });
        return [q[0], q[1], q[2] + dz];
      } });
    }
  }
  out.sort((a, b) => a.t - b.t);
  // (after the take's last key it stays where it is a second more, through the last world's tail frames)
  const last = out[out.length - 1];
  if (last) out.push({ t: last.t + 1, p: last.p, glide: true });
  return out;
}
/** the take's lens in world `id` at t, leaned toward the cursor, and the cursor: one path and one lean for the whole
 *  opening (v3/takekeys.ts), so both are the same on each side of every door */
export function takeView(s: Shot, t: number): { cam: Cam; hand: ReturnType<typeof handAt> } {
  const cam = takeCam(s.id, s.from + t), keys = takeKeys(s.id, t);
  const hand = handAt(keys, t, cam, s.from, (x) => ({ keys: takeKeys(s.id, x), cam: takeCam(s.id, s.from + x) }));
  return { cam: follow(cam, keys, t), hand };
}
function roomKeys(s: Shot, t: number, spec: RoomShot, open: number, taps: { t: number; file: string; mid: V3; half: V3 }[], cameIn: boolean): Key[] {
  const len = s.seconds;
  const handle = (o: number): V3 => (spec.painting ? paintEdge(o) : knob(o));
  const entry: V3 = [0.12, 1.2, backOf(spec) - 0.9];
  const c = spec.carry;
  const carriedAt = c ? carriedOn(t, c.a, c.b, c.from, c.to, 0.16) : null;
  const keys: Key[] = [];
  const k = (tt: number, p: Key["p"], more: Partial<Key> = {}) => keys.push({ t: tt, p, ...more });
  const grip = () => [carriedAt![0], carriedAt![1] + (c?.up ?? 0) + (c?.half[1] ?? 0) * 0.5, carriedAt![2]] as V3;
  // it comes through each doorway ahead of us (the take's first world aside, where it comes in past the lens)
  // (in the take it comes through the last world's door with us, on the take's one path: v3/takekeys.ts)
  if (!cameIn) k(0.5, edge(1, 1));
  if (spec.click && spec.click.t < 0.3) k(spec.click.t, at(entry), { seen: "click that makes the room real" });
  // it rests in front of the thing's upper half, clear of it
  const restAt = spec.rest ? front([spec.rest.at[0], spec.rest.at[1] + spec.rest.half[1] * 0.35, spec.rest.at[2]], Math.min(spec.rest.half[0], spec.rest.half[2]) + 0.02) : undefined;
  if (spec.rest && spec.toggle) { const p = onPanel(TOGGLE_PANEL, TOGGLE_AT[0], TOGGLE_AT[1]); k(spec.rest.from, at(p), { seen: spec.rest.what, click: true }); k(spec.rest.from + 0.4, at(p)); }
  else if (spec.rest) { k(spec.rest.from, restAt!, { seen: spec.rest.what, click: true }); k(spec.rest.to, restAt!); }
  if (c) { const g = front(grip, Math.max(c.half[0], c.half[2]) * 0.6 + 0.02); k(c.from, g, { press: true, seen: `pick up the ${c.name}` }); k(c.to, g, { seen: `put down the ${c.name}` }); }
  // the slider's knob, where the drag has it
  const slide = spec.dusk ? jerk(ramp(t, spec.dusk.t, spec.dusk.to)) : 0;
  const knobAt = (): V3 => onPanel(SLIDER_PANEL, sliderX(0.06 + 0.88 * slide), 95);
  if (spec.dusk) { k(spec.dusk.t, knobAt, { press: true, seen: "take the slider's knob" }); k(spec.dusk.to, knobAt, { seen: "let the slider go" }); k(spec.dusk.to + 0.2, knobAt); }
  const sw = spec.swatch;
  if (sw) { const p = onPanel(SWATCH_PANEL, swatchX(sw.pick, sw.colors.length), 95); k(sw.t, at(p), { click: true, seen: "click a swatch" }); k(sw.t + 0.3, at(p)); }
  if (spec.click && spec.click.t >= 0.3) { k(spec.click.t, at(spec.click.at), { seen: "click" }); k(spec.click.t + 0.25, at(spec.click.at)); }
  if (spec.click && spec.click.t < 0.3) k(0.35, at(entry));
  for (const tap of taps) k(tap.t, front(tap.mid, Math.min(tap.half[0], tap.half[2]) * 0.8 + 0.02), { click: true, seen: `click on the ${tap.file}`, margin: 0.03 });
  keys.sort((a, b) => a.t - b.t);
  // (the last two keys ride the knob: the point itself is the knob where the door now is)
  // it clicks the knob, goes a moment with the leaf as it swings, lets it go and leads us through the doorway
  k(spec.door, front(() => handle(open), 0.05), { press: true, seen: "click on the door" });
  k(spec.door + DOOR_HOLD, front(() => handle(open), 0.05));
  // and goes through the door with us, riding the lens (hand3d.tsx JOIN), on into the next world
  k(len, JOIN);
  return keys;
}

export function Room({ s, t, spec: raw, override }: { s: Shot; t: number; spec: RoomShot; /** a portal's render of this room: another world's lens, and the take's cursor in it */ override?: { cam: Cam; hand: ReturnType<typeof handAt> } }) {
  const spec = timed(s.id, raw);
  const cam = takeCam(s.id, s.from + t), len = s.seconds;
  const open = openOf(spec, t, len);
  let items = placeItems(spec, open);
  // a world whose way out is a painting: no door in the opening, and the living room's tall picture, made the size of a
  // door, hung over it on this side
  const handle = (o: number): V3 => (spec.painting ? paintEdge(o) : knob(o));
  if (spec.painting) { const pa = paintAt(open / 0.9); items = [...items.filter((p) => p.name !== "door"), { place: "living", name: "painting", file: "frame-b", at: pa.at, yaw: pa.yaw, scale: 2.5 }]; }
  const nextId = WALK[WALK.indexOf(s.id) + 1], prevId = WALK[WALK.indexOf(s.id) - 1];
  // (a world of its own beyond the door is not stood there: its frames are shown in the doorway, v3/kit.tsx Portal)
  const nextWorld = nextId && WORLD_IDS.includes(nextId) ? nextId : undefined;
  const next = nextId && !nextWorld ? timedSpec(nextId) : s.id === WALK[WALK.length - 1] ? CANYON_NEXT : undefined;
  if (next) items = [...items, ...beyond(next)];
  // (this world's own back wall is out when we came in through it: the doorway we are standing in is in its place)
  if (prevId) items = [...items.filter((p) => p.name !== "wall-back"), ...(WORLD_IDS.includes(prevId) ? [] : behind(ROOMS[prevId], spec))];
  // where the cursor is as we come through a doorway: just ahead of the lens, in the middle of the way
  const entry: V3 = [0.12, 1.2, backOf(spec) - 0.9];
  const c = spec.carry;
  let carriedAt: V3 | null = null;
  if (c) {
    // a thing carried is lifted, leans back against the way it is going, and settles with a small bounce where it is put
    carriedAt = carriedOn(t, c.a, c.b, c.from, c.to, 0.16);
    const was = carriedOn(t - 1 / 30, c.a, c.b, c.from, c.to, 0.16), vx = (carriedAt[0] - was[0]) * 30, vz = (carriedAt[2] - was[2]) * 30;
    const i = items.findIndex((p) => p.file === c.name);
    if (i < 0) throw new Error(`${spec.place}: nothing called ${c.name} to carry`);
    items = items.map((p, j) => (j === i ? { ...p, at: carriedAt!, rot: [Math.max(-0.2, Math.min(0.2, vz * 0.09)), p.yaw ?? 0, Math.max(-0.2, Math.min(0.2, -vx * 0.09))] as V3 } : p));
  }
  // the things it taps on its way (v3/times.ts ROOM_TAPS): where each is, and how each answers: a thing on a surface
  // hops and is squashed a moment, a thing that hangs swings
  const taps = (ROOM_TAPS[s.id] ?? []).map((tap) => {
    const it = items.find((p) => p.file === tap.file && !p.name.startsWith("next-") && !p.name.startsWith("prev-"));
    if (!it) throw new Error(`${spec.place}: nothing called ${tap.file} to tap`);
    const sz = size(it.place, it.file), kk = it.scale ?? 1, h = sz[1] * kk, hung = Math.abs(it.at[1] - RH) < 0.01;
    const mid: V3 = [it.at[0], hung ? it.at[1] - h + 0.18 : it.at[1] + h * 0.55, it.at[2]];
    return { ...tap, name: it.name, mid, half: [Math.min(0.5, (sz[0] * kk) / 2), Math.min(0.5, h / 2), Math.min(0.5, (sz[2] * kk) / 2)] as V3, hung, len: h };
  });
  items = items.map((p) => {
    const tap = taps.find((x) => x.name === p.name && t >= x.t);
    if (!tap) return p;
    const tau = t - tap.t;
    if (tap.hung) return { ...p, rot: [0, p.yaw ?? 0, 0.17 * Math.exp(-1.6 * tau) * Math.sin(6.6 * tau)] as V3 };
    const a = 0.085 * Math.exp(-9 * tau) * Math.cos(24 * tau), hop = tau < 0.28 ? 0.045 * Math.sin((Math.PI * tau) / 0.28) : 0, k0 = p.scale ?? 1;
    return { ...p, at: [p.at[0], p.at[1] + hop, p.at[2]] as V3, scale3: [k0 * (1 + a), k0 * (1 - 1.5 * a), k0 * (1 + a)] as V3 };
  });
  const tapping = taps.find((x) => t >= x.t - 0.06 && t < x.t + 0.5);
  // the cursor's path through the room (roomKeys, which the other worlds' doorways use too)
  const keys = roomKeys(s, t, spec, open, taps, !!prevId);
  const slide = spec.dusk ? jerk(ramp(t, spec.dusk.t, spec.dusk.to)) : 0;
  const sw = spec.swatch;
  const tv = override ? null : WALK.includes(s.id) ? takeView(s, t) : { cam: follow(cam, keys, t), hand: handAt(keys, t, cam, s.from) };
  const hand = override ? override.hand : (tv?.hand ?? null);
  const camF = override ? override.cam : tv!.cam;              // (the lens leans a little toward the cursor's work: hand3d.tsx follow)
  // the picture: a drawing with a round window of the real room about the cursor, or the real room
  const look: Look = { warm: spec.warm };
  if (spec.abyss) look.void = { z: -RZ + 0.15, x0: -0.565, x1: 0.565, y1: 2.17 };   // (the wall's face, and its casing's outside: media/models/hallway/wall-door.glb)
  if (spec.fadeIn) look.fade = 1 - (1 - ramp(t, spec.fadeIn[0], spec.fadeIn[1])) ** 3;
  const cl = spec.click;
  let drawing = spec.drawing;
  if (cl && !cl.toDrawing && t >= cl.t + cl.over) drawing = false;
  if (cl && cl.toDrawing && t >= cl.t + cl.over) drawing = true;
  look.base = drawing ? 1 : 0;
  const growing = cl && t >= cl.t && t < cl.t + cl.over;
  // the click's reveal is a sphere in the room, going out from where the cursor clicked; until then the cursor carries
  // a small sphere of the real room with it
  const clickAt: V3 = cl ? (cl.t < 0.3 ? entry : cl.at) : [0, 0, 0];
  if (growing) look.sphere = [clickAt, spread(t - cl!.t, cl!.over, 9)];
  else if (drawing && hand) look.sphere = [hand.pos, 0.3];
  const r = spec.rest, resting = r && !spec.toggle && t >= r.from - 0.1 && t <= r.to + 0.1;
  const boxes: [V3, V3][] = [];
  if (drawing && resting) boxes.push(boxOf(r!.at, r!.half));
  else if (drawing && tapping) boxes.push(boxOf(tapping.mid, tapping.half));
  const carrying = c && t >= c.from - 0.1 && t <= c.to + 0.2;
  // the doorway: once the door is clicked, what is beyond it shows as the next shot will open, a real room through a
  // drawn wall or a drawing through a real one
  const DOORWAY: V3 = [0, DOOR.h / 2, -RZ];
  // (the doorway is the whole space beyond the door's wall: what stands there is in the next world's state, by where it is)
  if (next && t >= spec.door && next.drawing !== drawing) boxes.push([[-60, -5, -RZ - 400], [60, 80, -RZ - 0.004]]);
  if (boxes.length) look.boxes = boxes;
  // every click sends a shell of light over the surfaces round it
  look.pulse = pulseOf(t, [...(r ? [{ t: r.from, at: r.at }] : []),  ...(cl ? [{ t: cl.t, at: clickAt }] : []), ...(c ? [{ t: c.from, at: [c.a[0], c.a[1] + c.up, c.a[2]] as V3 }, { t: c.to, at: [c.b[0], c.b[1] + 0.02, c.b[2]] as V3 }] : []), { t: spec.door, at: handle(0) }, ...(sw ? [{ t: sw.t, at: SWATCH_PANEL.at }] : []), ...taps.map((x) => ({ t: x.t, at: x.mid }))]);
  // the hour: day until the lamp is clicked, dusk a second and a half after
  const dk = slide;
  const mixn = (a: number, b: number, kk = dk) => a + (b - a) * kk;
  let sun: Sun = spec.dusk ? { lux: mixn(spec.sun.lux, 900), from: [spec.sun.from[0], mixn(spec.sun.from[1], 2.2), spec.sun.from[2]], to: spec.sun.to, color: dk < 0.5 ? spec.sun.color : "#ff8e52" } : spec.sun;
  let env: Env = spec.dusk ? { ...spec.env, intensity: mixn(spec.env.intensity ?? 1, 0.1) } : spec.env;
  let ev = spec.dusk ? mixn(spec.ev, spec.ev + 0.5) : spec.ev;
  const bulb: V3 = spec.dusk?.lamp ?? [0, 0, 0];
  // the swatch: the walls take its colour, over half a second from the click
  // (the walls carry their finish from the first frame, at the plaster's own colour: a render keeps what it starts with)
  if (sw) {
    const kk = jerk(ramp(t, sw.t, sw.t + 0.55)), from = WALL_OWN, to = [1, 3, 5].map((i) => parseInt(sw.colors[sw.pick].slice(i, i + 2), 16));
    const col = "#" + from.map((v, i) => Math.round(v + (to[i] - v) * kk).toString(16).padStart(2, "0")).join("");
    items = items.map((p) => (/^wall-/.test(p.file) && p.place === spec.place && !p.name.startsWith("next-") ? { ...p, finish: [{ material: `${spec.place}_plaster`, color: col }] } : p));
  }
  const lampGlow: Glow[] = spec.dusk ? [{ at: bulb, half: [0.05, 0.05, 0.05], lum: Math.round(150000 * dk / 10000) * 10000, color: [1, 0.7, 0.42] }] : [];
  if (spec.dusk) look.warm = mixn(spec.warm, 0.9);
  // the light of the world ahead: this world's light becomes the next one's as the doorway fills the frame, so the join
  // in the doorway has the same light on both sides. A world that is a drawing shows no light at all, so a drawing takes
  // the next world's light as soon as its door is clicked, and nothing is changed for a world that will first be seen drawn.
  if (next && !next.drawing) {
    // (toward a brighter world the exposure comes down from the moment the door starts to open, as an eye's would; toward
    // a darker one it waits until the doorway fills the frame, or the place we are in would burn out)
    const r0 = ramp(t, next.ev < ev - 1 ? spec.door + 0.1 : len - 0.5, len - 0.03);
    const w = drawing ? (t >= spec.door ? 1 : 0) : r0 * r0 * (3 - 2 * r0);
    if (w > 0) {
      const hexMix = (a: string, b: string) => "#" + [1, 3, 5].map((i) => Math.round(mixn(parseInt(a.slice(i, i + 2), 16), parseInt(b.slice(i, i + 2), 16), w)).toString(16).padStart(2, "0")).join("");
      const shift = RZ + backOf(next), to = next.sun.to ?? [0, 0, 0], from0 = sun.to ?? [0, 0, 0];
      sun = { lux: mixn(sun.lux, next.sun.lux, w), from: [0, 1, 2].map((i) => mixn(sun.from[i], next.sun.from[i] - (i === 2 ? shift : 0), w)) as V3, to: [0, 1, 2].map((i) => mixn(from0[i], to[i] - (i === 2 ? shift : 0), w)) as V3, color: hexMix(sun.color ?? "#ffffff", next.sun.color ?? "#ffffff") };
      env = { src: env.src, intensity: mixn(env.intensity ?? 1, next.env.intensity ?? 1, w), rotation: mixn(env.rotation ?? 0, next.env.rotation ?? 0, w) };
      ev = mixn(ev, next.ev, w); look.warm = mixn(look.warm ?? 0, next.warm, w);
    }
  }
  const lit = spec.lights && spec.rest ? jerk(ramp(t, spec.rest.from, spec.rest.from + 0.4)) : 0;
  const litGlow: Glow[] = spec.lights ? [{ at: spec.lights, half: [0.02, 0.035, 0.02], lum: Math.round(lit * 30) * 30000, color: [1, 0.62, 0.3] }] : [];
  const nextGlows = next ? (next.glows ?? []).map((g) => ({ ...g, at: [g.at[0], g.at[1], g.at[2] - RZ - backOf(next)] as V3 })) : [];
  return (
    <Scene items={items} cam={camF} sun={sun} env={env} ev={ev} glows={[...lampGlow, ...litGlow, ...(spec.glows ?? []), ...nextGlows]} look={look} seed={s.f0} finish={!override} ground={spec.abyss ? "#07070a" : undefined} bloom={spec.outdoor ? 0.3 : undefined}
      /* the film's one line of words before its end card (the director, 11-11, on assembly 20: "text that is on screen frame 0
         but wiht a warping animation on it that says made in raea"): there on frame 0, warping, settling, then pulled
         apart as the door comes out of the dark (media/title, 48 frames, warped in ffmpeg) */
      over={spec.abyss && t * 30 < 47.5 ? <Img src={staticFile(`title/made-${String(Math.min(48, Math.floor(t * 30 + 0.001) + 1)).padStart(2, "0")}.png`)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} /> : undefined}
      >
      <Hand3D hand={hand} cam={camF} ev={ev} />
      {/* a world of its own beyond the door: its frames on the inside of a box behind the doorway (v3/kit.tsx) */}
      {nextWorld && <PortalBox next={nextWorld} abs={s.from + t} door={[0, DOOR.h / 2 + 0.065, -RZ - 0.06]} half={[0.62, DOOR.h / 2 + 0.06]} depth={1.15} cam={camF} />}
      {/* the controls: each pops out of the wall a little before it is used */}
      {spec.dusk && <Panel3D name="slider" panel={SLIDER_PANEL} ev={ev} show={spring(t - spec.dusk.t + 0.9)}><Slider v={0.06 + 0.88 * slide} press={hand?.press ?? 0} /></Panel3D>}
      {spec.toggle && r && <Panel3D name="toggle" panel={TOGGLE_PANEL} ev={ev} show={spring(t - r.from + 0.9)}><Toggle on={spring(t - r.from, 12, 8)} press={hand && Math.abs(t - r.from) < 0.15 ? hand.press : 0} /></Panel3D>}
      {sw && <Panel3D name="swatches" panel={SWATCH_PANEL} ev={ev} show={spring(t - sw.t + 0.9)}><Swatches colors={sw.colors} picked={t >= sw.t ? sw.pick : -1} k={spring(t - sw.t, 12, 7)} /></Panel3D>}
      <Box3D cam={camF} ev={ev} show={!!(resting || carrying || tapping)} at={resting ? r!.at : carrying && c && carriedAt ? [carriedAt[0], carriedAt[1] + c.up, carriedAt[2]] : tapping ? tapping.mid : [0, 0, 0]} half={resting ? r!.half : carrying && c ? c.half : tapping ? tapping.half : [0.1, 0.1, 0.1]} />
    </Scene>
  );
}

// ---- the office, twice: the film's first image as a drawing, and later for a few seconds as itself in the morning ----
const OFFICE_DOOR: V3 = [3.2, 1.05, ROOM.z1];                                // the middle of its doors, in the far wall
const OFFICE_KNOB = (open: number): V3 => { const a = (70 * Math.PI) / 180 * open; return [4.04 - Math.cos(a) * 0.74, 1.1, ROOM.z1 + 0.06 + Math.sin(a) * 0.74]; };
const CHAIR_A: V3 = [3.0, 0, -17.6], CHAIR_B: V3 = [1.7, 0, -18.3];
function OfficeWalk({ s, t, day }: { s: Shot; t: number; day: boolean }) {
  const cam = camAt(walk(day ? -12.4 : -9.6, 1.1, 3.2), t), len = s.seconds;
  const doorAt = day ? 2.9 : 99, open = day ? jerk(ramp(t, doorAt + 0.05, len + 0.25)) : 0;
  const chair = day ? mix3(CHAIR_A, CHAIR_B, jerk(ramp(t, 0.5, 1.9))) : CHAIR_A;
  const items = (officeRoom(1, { tubes: 0, blinds: day ? 0 : 0.82, hero: 5 }) as Item[]).map((p) => (p.file === "door" ? { ...p, t: open } : p));
  items.push({ place: "office", name: "chair-hero", file: "chair", at: chair, yaw: 0.6, clip: "swivel", t: 0 });
  const grip = (): V3 => [chair[0], 0.56, chair[2]];
  const keys: Key[] = day
    ? [{ t: 0.05, p: edge(1, 1) }, { t: 0.5, p: front(grip), press: true, seen: "pick up the chair" }, { t: 1.9, p: front(grip) }, { t: doorAt, p: front(() => OFFICE_KNOB(open), 0.08), press: true, seen: "click on the office doors" }, { t: len + 0.3, p: front(() => OFFICE_KNOB(open), 0.08) }]
    : [{ t: 0.9, p: edge(1, 1) }, { t: 2.3, p: front([3.2, 1.3, -17.5]), seen: "the cursor's first rest" }, { t: len + 0.3, p: front([3.2, 1.3, -18.5]) }];
  const hand = handAt(keys, t, cam);
  const look: Look = day ? { base: 0, warm: 0.9, sat: 1.0, contrast: 0.7 } : { base: 1, warm: -0.5, fade: 1 - (1 - ramp(t, 0.3, 2.4)) ** 3 };
  if (!day && hand) look.sphere = [hand.pos, 0.3];
  const mid = (ROOM.z0 + ROOM.z1) / 2, half = (ROOM.z0 - ROOM.z1) / 2;
  const glows: Glow[] = day ? [] : [-9.6, -12.8, -16, -19.2].flatMap((z) => [0, 3.4].map((cx): Glow => ({ at: [cx, ROOM.h - 0.012, z - 0.4], half: [0.26, 0.004, 0.56], lum: 9000, color: [1, 0.98, 0.94] })));
  return (
    <Scene items={items} cam={cam} ev={day ? 2.9 : 1.3} glows={glows} look={look} seed={s.f0}
      sun={{ lux: day ? 110000 : 0, from: [40, 7, 10], to: [0, 0.8, -6], color: "#ffb26a" }} env={{ src: DAYSKY, intensity: day ? 0.8 : 0.02, rotation: 1.2 }}
      roof={{ at: [0, ROOM.h + 0.3, mid], half: [ROOM.x + 1, 0.1, half + 1] }} air={{ at: [0, ROOM.h / 2, mid], size: [ROOM.x * 2, ROOM.h, half * 2], density: 0.03 }}
      over={<>{day && t >= 0.4 && t <= 2.1 && <PickBox cam={cam} at={grip()} half={[0.36, 0.56, 0.36]} />}</>}>
      <Hand3D hand={hand} cam={cam} ev={day ? 2.9 : 1.3} />
    </Scene>
  );
}

export function Walk({ s, t, override }: { s: Shot; t: number; override?: { cam: Cam; hand: ReturnType<typeof handAt> } }) {
  return <Room s={s} t={t} spec={ROOMS[s.id]} override={override} />;
}
export const WALK_CAMS = { W, H, Q, OFFICE_DOOR, RZ, size };
