// The film past the office: every shot of the chain (v2/plan.ts) as its own composition, v2-ID (rendered a shot at a
// time by tools/v2.sh: a render holds its first frame's lights and materials). The office's four are v2/office.tsx.
//
// the director's notes of 11-11 that shape this file:
//  - cameras never start or stop inside a shot: each runs at one speed along a curve, already moving at the cut;
//  - the cursor only moves things (position); no rings, no spins, no props doing tricks;
//  - a note names a change you then see, and the picture shows as its construction drawing for a few frames as the
//    note is taken up (the film's wireframe);
//  - the big type tells one sentence across the film and is set INTO each place (v2/type.tsx Word3D):
//      NOW IT'S A PLACE. (office)  GO IN. (canyon)  CHANGE ONE THING. (bedroom)  KEEP THE REST. (garage)  JUST THAT. (sea, the peak's line he approved on draft 1)
//    then raea's card. No slam names a look ("dont have golden hour be the text").
//  - every place stands under its own sky or roof and its own light, on the warm stock (v2/look.tsx).
import type React from "react";
import { AbsoluteFill, Composition, Img, registerRoot, staticFile, useCurrentFrame } from "raea";
import { LinearRgba } from "raea/color";
import { Cuboid, Mesh3d } from "raea/mesh";
import { BevyComponent, Canvas3D, Environment, Fog, MeshSequence, Model, Sphere, ToneMapping, Bloom } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight } from "raea/light";
import { FilmLook, type Look } from "./look";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { Part } from "../parts/library";
import { FACE, MONO, EndCard } from "../parts/type";
import { BACK as BED_BACK, CEILED, RIGHT as BED_RIGHT, d as onDesk } from "../sets/bedroom";
import { CANYON, spot, TURN as CANYON_TURN } from "../sets/canyon";
import { CATHEDRAL } from "../sets/cathedral";
import { CLOCKTOWER } from "../sets/clocktower";
import { COURT } from "../sets/court";
import { DINER, TOP as DINER_TOP } from "../sets/diner";
import { parts as FERRIS, WZ } from "../sets/ferris";
import { GARAGE, H as GARAGE_H } from "../sets/garage";
import { GYM } from "../sets/gym";
import { KELP } from "../sets/kelp";
import { KOI } from "../sets/koi";
import { DRY, DRYERS, LAUNDROMAT, OPEN } from "../sets/laundromat";
import { DECK as LH_DECK, LIGHTHOUSE } from "../sets/lighthouse";
import { MOON, ROOM as OBSERVATORY, turn as obs } from "../sets/observatory";
import { D as POOL_D, hall } from "../sets/pool";
import { ROAD, SEAT, Y as ROAD_Y } from "../sets/road";
import ride from "../media/ocean/storm.boat.json";
import { parts as STAIRS, TOP as STAIR_TOP } from "../sets/stairwell";
import { SUBWAY } from "../sets/subway";
import { CREST, TURBINES } from "../sets/turbines";
import { VINYL } from "../sets/vinyl";
import type { At } from "../board/thirds";
import { aim } from "./aim";
import { camOn } from "./path";
import { FPS, H, SHOTS, W, px, type Cut } from "./plan";
import { clamp01, ease, lerp, mix3, ramp, type Cam, type V3 } from "./stage";
import { Take, type Air, type Env, type Light, type Rig } from "./take";
import { Prompt, Word3D } from "./type";
import { CommentCard } from "./card";
import { Cursor, PickBox, along, project } from "./ui";
import { reach } from "./path";

type View = { eye: V3; look: V3; fov?: number };
/** a view pushed toward what it looks at by a share of the distance */
const push = (v: View, by: number): View => ({ ...v, eye: mix3(v.eye, v.look, by) });
const run = (clip: string | undefined, t: number) => ({ ...(clip ? { clip } : {}), t });
const hex = (a: number[], b: number[], k: number) => "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join("");

/** a note written in the shot: the cursor goes to \`pin\` (frame pixels), clicks at \`open\` seconds, the app's composer opens, is typed into and posts at \`sent\` */
type NoteSpec = { text: string; open: number; sent: number; pin: [number, number] };
/** the cursor moves a part: from \`from\` to \`to\` seconds it holds the part \`name\` and carries it from a to b (the pick box \`half\` its half-size, about a point \`up\` above its foot) */
type Move = { name: string; from: number; to: number; a: V3; b: V3; half: V3; up: number };
/** a light in a fitting: a glowing panel (Solari lights a room from what glows), its centre, half-size and strength */
type Glow = { at: V3; half: V3; lum: number; color?: [number, number, number] };
type Spec = {
  /** the stand's grey floor under a set that has none of its own */
  floor?: boolean;
  place: string; parts: Part[];
  /** the camera's views in order, evenly through the shot (two: one straight run at one speed) */
  views: View[];
  /** the point the cut is made on at each end, and where on the thirds (the chain's, unless given) */
  hook?: [V3, V3]; hookAt?: [At, At];
  rig: (k: number, t: number) => Rig;
  sun?: number; light?: (k: number, t: number) => Light; exposure?: (k: number, t: number) => number; ev?: number;
  env?: Env; ground?: string; air?: Air; glows?: (k: number, t: number) => Glow[]; roof?: { at: V3; half: V3 };
  finish?: (k: number, t: number) => Record<string, { material: string; color: string; roughness?: number }>;
  /** the shot opens on another set and view until \`until\` seconds (the road, from the driver's seat) */
  first?: { until: number; parts: Part[]; a: View; b: View; rig: (k: number, t: number) => Rig };
  move?: Move; note?: NoteSpec;
  /** the sentence's line in this place: it stands `dist` metres down the lens of the camera as it is `at` of the way
   *  through the shot, square to it, `fill` of the frame wide, lifted `up` metres: the place's things nearer than that cut into it */
  word?: { text: string; from: number; dist: number; at?: number; fill?: number; up?: number; side?: number; color?: string };
  /** the stock's settings for this place, where the warm print's own are wrong for it */
  stock?: Partial<Look>;
  /** the whole shot as its construction drawing */
  drawn?: boolean;
  over?: (k: number, t: number) => JSX.Element | null;
};

const NIGHT: Env = { src: "qwantani_moonrise_puresky", intensity: 0.5 };
const DAY: Env = { src: "kloofendal_48d_partly_cloudy_puresky", intensity: 1 };
const GREY: Env = { src: "kloofendal_overcast_puresky", intensity: 0.8 };
const DUSK: Env = { src: "the_sky_is_on_fire", intensity: 1 };
const sodium = (x: number, y: number): Glow => ({ at: [x, GARAGE_H - 0.13, -y], half: [0.6, 0.01, 0.2], lum: 60000, color: [1, 0.7, 0.36] });
const CART_A: V3 = [1.5, 0, 0.9], CART_B: V3 = [DRYERS[OPEN] + 0.05, 0, DRY + 1.05];
const GLOBE_A = onDesk(0.5, 0.13), GLOBE_B = onDesk(0.12, 0.2);
const CONE_A: V3 = [6.25, 0.02, -1.5], CONE_B: V3 = [8.2, 0.02, -1.0];
const LAMP_L: V3 = [5.62, 0.62, -1.82], LAMP_R: V3 = [6.88, 0.62, -1.82];   // the car stands nose-out: its headlamps face the aisle
const HUB: V3 = [0, CREST + 80, -1];
const NEAR_MOON: V3 = obs([0, 2.74 + Math.sin(0.576) * 30, -Math.cos(0.576) * 30]);
const CLOCK: V3 = [-1.0, POOL_D + 3.3, -15];

const SPECS: Record<string, Spec> = {
  "07-canyon": {
    place: "canyon", parts: CANYON.filter((p) => p.file !== "sky"), env: { ...DAY, intensity: 1.6, rotation: 1.0 }, views: [{ eye: spot([-0.4, 1.7, 6.5]), look: spot([0.9, 3.6, -10]), fov: 62 }, { eye: spot([0.1, 1.9, -1.5]), look: spot([1.6, 5.2, -12]), fov: 62 }],
    // what the note in the app asked for: later in the day. The sun comes down the slot from noon to a low gold that rakes the walls
    rig: (k) => ({ sun: run("height", 0.8 * ease(k)), "tumbleweed-roll": run("roll", k), "sand-streams": run("fall", k), dust: run("drift", k) }),
    light: (k) => ({ from: spot([5, 46 - 40 * ease(ramp(k, 0.1, 0.8)), -32]), to: spot([0, 1.5, 0]), lux: 60000 - 14000 * ease(k), color: hex([255, 255, 255], [255, 205, 150], ease(ramp(k, 0.1, 0.8))) }),
    exposure: (k) => 0.4 + 0.7 * ease(ramp(k, 0.1, 0.8)),
    // the cursor is in the place too: it drags a tumbleweed out of the way in
    move: { name: "tumbleweed-hop", from: 0.3, to: 1.15, a: spot([0.1, 0.08, 3.4]), b: spot([-0.55, 0.08, 2.6]), half: [0.3, 0.3, 0.3], up: 0.3 },
    word: { text: "GO IN.", from: 1.3, dist: 5.5, at: 1, fill: 0.6, up: -1.3, side: 0.35, color: "#fff3dc" },
    stock: { sat: 0.68 },
  },
  "08-laundromat": {
    // the cart is put under the open dryer, then the note: the sheet comes out slowly and floats down toward it
    move: { name: "laundry-cart", from: 0.35, to: 1.5, a: CART_A, b: CART_B, half: [0.36, 0.45, 0.5], up: 0.45 },
    note: { text: "slower. let it float.", open: 1.9, sent: 3.1, pin: [W * 0.26, H * 0.5] },
    // the open dryer's window is the circle the sun's disc cuts to (upper right); the sheet comes out of it over the lens
    hook: [[0.03, 1.57, -2.34], [0.03, 1.5, -2.0]],
    place: "laundromat", parts: LAUNDROMAT, views: [{ eye: [2.6, 1.6, 0.6], look: [0.6, 1.3, -2.7], fov: 50 }, { eye: [0.25, 1.5, -0.7], look: [0.03, 1.5, -2.3], fov: 50 }],
    env: { ...GREY, intensity: 1.4 }, sun: 0, ev: 1.4, roof: { at: [0, 3.75, 0], half: [5, 0.1, 4] },
    glows: () => [-2.6, -0.78, 1.0].map((x): Glow => ({ at: [x, 2.97, -2.3], half: [0.6, 0.006, 0.12], lum: 5200, color: [0.9, 1, 0.96] })),
    rig: (k) => ({ "dryer-3": run("door", 1), sheet: run("drift", k < 0.66 ? 0 : 0.74 * ease(ramp(k, 0.66, 1.25))), "dryer-1": run("drum", k), "dryer-2": run("drum", k), "dryer-4": run("drum", k), "laundry-upper-1": run("float", ease(ramp(k, 0.7, 1))), "laundry-upper-2": run("tumble", k), "laundry-upper-4": run("tumble", k) }),
  },
  "09-bedroom": {
    // the sheet settles; the globe is moved down the desk to where the light will find it
    move: { name: "globe", from: 1.5, to: 2.7, a: GLOBE_A, b: GLOBE_B, half: [0.17, 0.21, 0.17], up: 0.21 },
    hook: [[-0.52, 0.75, -1.24], [GLOBE_B[0], GLOBE_B[1] + 0.21, GLOBE_B[2]]],
    place: "bedroom", parts: CEILED.filter((p) => p.file !== "rain"), views: [{ eye: [-0.9, 1.7, 0.9], look: [-0.9, 1.1, -1.8], fov: 55 }, { eye: [0.5, 1.5, 0.3], look: [2.0, 0.92, -0.6], fov: 50 }],
    env: { src: "sunset_forest", intensity: 2.2, rotation: 2.2 }, ev: 2.3, air: { at: [0, 1.25, 0], size: [4.2, 2.5, 3.6], density: 0.05 },
    light: (k) => ({ from: [-3 + 3.5 * ease(k), 3.2, -9], to: [0.2, 0.9, -0.3], lux: 42000, color: "#ffc48a" }),
    rig: (k) => ({ sheet: run("settle", ease(ramp(k, 0, 0.3))), "wall-clock": run("hands", k), sun: run("arc", ease(ramp(k, 0.35, 1))), globe: run("spin", 0.4 * k), blinds: run("raise", 1), "model-planes": run("sway", k) }),
    word: { text: "CHANGE ONE THING.", from: 2.5, dist: 1.25, at: 1, fill: 0.84, up: 0.34, color: "#fff1d6" },
  },
  "10-bedroom-2": {
    note: { text: "rain on the glass.", open: 0.5, sent: 1.6, pin: [W * 0.2, H * 0.3] },
    hook: [[GLOBE_B[0], GLOBE_B[1] + 0.21, GLOBE_B[2]], [-0.6, 1.62, -1.8]],
    place: "bedroom", parts: CEILED.map((p) => (p.file === "globe" ? { ...p, at: GLOBE_B } : p.file === "rain" ? { ...p, name: "rain" } : p)), views: [{ eye: [0.5, 1.5, 0.3], look: [2.0, 0.92, -0.6], fov: 50 }, { eye: [-0.55, 1.55, -0.55], look: [-0.6, 1.62, -1.8], fov: 50 }],
    env: { src: "kloofendal_overcast_puresky", intensity: 1.0 }, ev: 0.5, sun: 0,
    rig: (k, t) => ({ sheet: run("settle", 1), sun: run("arc", 1), globe: run("spin", 0.16 + 0.4 * k), rain: run("fall", ramp(t, 1.75, 4.06)), blinds: run("raise", 1), "model-planes": run("sway", k) }),
  },
  "11-road": {
    // through the windscreen first: the wipers sweep the rain onto the road ahead; then outside as the car comes through
    first: { until: 3.43, parts: SEAT, a: { eye: [1.23, ROAD_Y + 1.14, 6.02], look: [1.4, ROAD_Y + 1.0, -6], fov: 62 }, b: { eye: [1.23, ROAD_Y + 1.14, 6.02], look: [1.4, ROAD_Y + 1.05, -6], fov: 58 }, rig: (q) => ({ windscreen: run("wipers", q), car: run("wipers", q), rain: run("fall", q) }) },
    note: { text: "soak the road.", open: 3.75, sent: 4.6, pin: [W * 0.3, H * 0.62] },
    place: "road", parts: ROAD.filter((p) => p.file !== "puddles"), views: [{ eye: [3.4, ROAD_Y + 1.75, 9.4], look: [-0.9, ROAD_Y + 1.3, -6], fov: 55 }, { eye: [2.6, ROAD_Y + 1.1, 6.0], look: [-1.4, ROAD_Y + 0.9, -6], fov: 55 }],
    env: { ...GREY, intensity: 0.45, rotation: 0.6 }, sun: 1800, ev: 2.3, ground: "#1c211a", air: { at: [0, 6, -12], size: [60, 14, 70], density: 0.012 }, stock: { sat: 0.8, contrast: 0.6 }, finish: () => ({ road: { material: "road_wet", color: "#59616a", roughness: 0.06 } }),
    rig: (k) => ({ car: run("drive", k), rain: run("fall", k), road: run("wet", ease(ramp(k, 0.72, 0.95))), spray: run("burst", ramp(k, 0.6, 1)) }),
  },
  "12-garage": {
    // a cone is moved out of the bay's mouth, then the note: the car's lamps come on and light the deck
    move: { name: "cone-a", from: 0.3, to: 1.4, a: CONE_A, b: CONE_B, half: [0.2, 0.36, 0.2], up: 0.36 },
    note: { text: "headlights on.", open: 1.5, sent: 2.5, pin: [W * 0.1, H * 0.6] },
    hook: [[6.25, 0.7, -4.1], LAMP_L],
    place: "garage", parts: GARAGE.filter((p) => p.name !== "car-in-aisle" && p.name !== "cone-a").concat([{ file: "cone", at: CONE_A, name: "cone-a" }]).map((p) => (p.name === "car-in-bay" ? { ...p, clip: undefined } : p)), views: [{ eye: [4.2, 2.2, 1.9], look: [6.25, 0.7, -4.1], fov: 46 }, { eye: [4.9, 0.85, 0.6], look: [5.62, 0.6, -2.0], fov: 42 }],
    env: { ...GREY, intensity: 0.25 }, sun: 0, ev: 1.6, roof: { at: [0, GARAGE_H + 0.45, -1], half: [14, 0.1, 9] }, ground: "#2a2a2c",
    glows: (_k, t) => [sodium(-7.5, 0.2), sodium(-2.5, 0.2), sodium(-7.5, 4.6), sodium(-2.5, 4.6), sodium(2.5, 0.2), sodium(7.5, 0.2), ...(t >= 2.62 ? [LAMP_L, LAMP_R].map((at): Glow => ({ at, half: [0.09, 0.05, 0.01], lum: 90000, color: [1, 0.93, 0.8] })) : [])],
    rig: (k) => ({ "barrier-arm": run("lift", k) }),
    word: { text: "KEEP THE REST.", from: 3.2, dist: 4.4, at: 1, fill: 0.66, up: 0.8, side: -0.75, color: "#ffe2b8" },
  },
  // ---- the montage: a circle handed on each beat, lower left through the centre to the upper right
  "13-vinyl": { hook: [[-1.62, 0.82, 0.5], [-1.62, 0.82, 0.5]], place: "vinyl", parts: VINYL, env: DAY, floor: true, views: [push({ eye: [1.6, 2.5, 6.4], look: [-1.62, 1.0, 0.5] }, 0.55), push({ eye: [1.6, 2.5, 6.4], look: [-1.62, 1.0, 0.5] }, 0.62)], rig: (k) => ({ turntable: run("needle", k) }) },
  "14-koi": { hook: [[-0.7, 0.73, 0.45], [-0.7, 0.73, 0.45]], place: "koi", parts: KOI, env: DAY, ground: "#5d6b45", views: [push({ eye: [2.4, 5.2, 9.0], look: [-0.7, 0.3, 0.45] }, 0.5), push({ eye: [2.4, 5.2, 9.0], look: [-0.7, 0.3, 0.45] }, 0.56)], rig: (k) => ({ ripples: run("spread", k), pebble: run("drop", clamp01(k * 3)) }) },
  "15-stairwell": { drawn: true, place: "stairwell", parts: STAIRS, env: { ...GREY, intensity: 0.4 }, views: [{ eye: [0.1, STAIR_TOP + 2.7, 0.25], look: [0, 0, 0], fov: 74 }, { eye: [0.1, STAIR_TOP + 2.2, 0.25], look: [0, 0, 0], fov: 74 }], rig: (k) => ({ "paper-plane": run("spiral", k) }) },
  "16-ferris": { hook: [[0, 10.2, WZ], [0, 10.2, WZ]], place: "ferris", parts: FERRIS, sun: 1200, env: { ...NIGHT, intensity: 1.2 }, ground: "#2b2b2e", ev: 1.5, views: [{ eye: [0, 3.2, 11.6], look: [0, 10.2, WZ], fov: 62 }, { eye: [0, 3.2, 10.6], look: [0, 10.2, WZ], fov: 62 }], rig: (k) => ({ wheel: run("spin and light", 0.1 + 0.25 * k), "string-lights": run("on", k) }) },
  "17-clocktower": { hook: [[0, 1.15, 0.3], [0, 1.15, 0.3]], place: "clocktower", parts: CLOCKTOWER, env: GREY, floor: true, views: [push({ eye: [0.7, 2.2, 8.6], look: [0, 1.15, 0.3], fov: 36 }, 0.55), push({ eye: [0.7, 2.2, 8.6], look: [0, 1.15, 0.3], fov: 36 }, 0.62)], rig: (k) => ({ movement: run("push", k), "clock-face": run("push", k), "leading-off": run("push", k), pendulum: run("swing", k) }) },
  "18-subway": { hook: [[-1.4, 3.95, -17], [-1.4, 3.95, -12]], place: "subway", parts: SUBWAY, views: [{ eye: [1.3, 2.9, 4.6], look: [0.5, 2.7, -18], fov: 50 }, { eye: [1.3, 2.9, 3.6], look: [0.5, 2.7, -18], fov: 50 }], rig: (k) => ({ train: run("arrive", k), signal: run("trip", k) }) },
  "19-diner": { place: "diner", parts: DINER, env: DAY, sun: 8000, views: [{ eye: [-0.75, DINER_TOP + 0.5, -0.979], look: [-0.75, DINER_TOP, -0.98] }, { eye: [-0.75, DINER_TOP + 0.44, -0.979], look: [-0.75, DINER_TOP, -0.98] }], rig: (k) => ({ "coffee-cup": run("swirl", k) }) },
  "20-gym": { hook: [[0.9, 1.0, 3.4], [0.9, 1.75, 3.4]], place: "gym", parts: GYM, env: DAY, views: [{ eye: [0.9, 1.3, 8.6], look: [0.9, 1.55, 0], fov: 40 }, { eye: [0.9, 1.3, 8.2], look: [0.9, 1.9, 0], fov: 40 }], rig: (k) => ({ basketball: run("bounce", 0.5 * k) }) },
  "21-cathedral": { drawn: true, hook: [[0, 8.6, -9], [0, 8.6, -9]], place: "cathedral", parts: CATHEDRAL, sun: 9000, views: [{ eye: [0.25, 1.7, 11.6], look: [0, 6.0, -9], fov: 62 }, { eye: [0.25, 1.7, 10.8], look: [0, 6.4, -9], fov: 62 }], rig: (k) => ({ "rose-window": run("light", 1), "light-shaft": run("swing", k) }) },
  "22-kelp": { hook: [[0, 12, -3.5], [0, 12, -3.5]], place: "kelp", parts: KELP, views: [{ eye: [0.2, 0.95, 9.2], look: [0, 4.9, -1.5], fov: 70 }, { eye: [0.2, 1.1, 8.6], look: [0, 5.2, -1.5], fov: 70 }], rig: (k) => ({ "kelp-a": run("stand", k), "kelp-b": run("stand", k), "kelp-c": run("stand", k), sun: run("shimmer", k) }) },
  "23-lighthouse": { hook: [[0, LH_DECK + 1.9, 0], [0, LH_DECK + 1.9, 0]], place: "lighthouse", parts: LIGHTHOUSE, views: [{ eye: [9, LH_DECK - 6, 30], look: [0, LH_DECK + 1.9, 0], fov: 30 }, { eye: [10, LH_DECK - 5, 28], look: [0, LH_DECK + 1.9, 0], fov: 30 }], rig: (k) => ({ "fresnel-lens": run("turn", 0.3 * k), beam: run("sweep", 0.3 * k), sea: run("swell", k) }) },
  "24-turbines": { hook: [HUB, HUB], place: "turbines", parts: TURBINES, views: [{ eye: [20, CREST + 40, 70], look: HUB, fov: 40 }, { eye: [20, CREST + 41, 67], look: HUB, fov: 40 }], rig: (k) => ({ "turbine-1": run("spin", 0.2 * k), "turbine-2": run("spin", 0.3 + 0.2 * k), "turbine-3": run("spin", 0.6 + 0.2 * k) }) },
  "25-court": { hook: [[0, 3.05, -5.42], [0, 3.05, -5.42]], place: "court", parts: COURT, sun: 150, env: NIGHT, ground: "#1d1d20", ev: 1.2, views: [{ eye: [-1.5, 1.75, -2.4], look: [0.15, 2.85, -5.5], fov: 42 }, { eye: [-1.4, 1.75, -2.6], look: [0.15, 2.85, -5.5], fov: 42 }], rig: (k) => ({ basketball: run("drop", k), hoop: run("net", k), rain: run("fall", k) }) },
  // the moon stands nearer than the set's own (30 m off, not 110) so its disc is the circle the cut is made on
  "26-observatory": { hook: [NEAR_MOON, NEAR_MOON], place: "observatory", parts: OBSERVATORY.map((p) => (p.file === "moon" ? { ...p, at: NEAR_MOON } : p)), sun: 40, env: { ...NIGHT, intensity: 0.25 }, ev: 1.9, views: [{ eye: obs([0.9, 1.5, 3.4]), look: NEAR_MOON, fov: 42 }, { eye: obs([0.8, 1.5, 3.1]), look: NEAR_MOON, fov: 42 }], rig: (k) => ({ dome: run("open", 1), moon: run("halo", k), telescope: run("slew", 0.2 * k), stars: run("drift", k) }) },
  // the last place of the montage is the pool (the canyon was here, a second time: nothing is used twice)
  "27-pool": { hook: [CLOCK, CLOCK], place: "pool", parts: hall(false), env: DAY, ev: 0.6, views: [{ eye: [-4.2, POOL_D + 2.1, -6.5], look: CLOCK, fov: 40 }, { eye: [-4.0, POOL_D + 2.1, -7.0], look: CLOCK, fov: 40 }], rig: (k) => ({ "pace-clock": run("sweep", k), flags: run("flutter", k) }) },
};

/** a comment being written: the cursor in from the lower right to the pin, a click, the card, and the cursor away once it is sent */
export function Note({ c, t }: { c: { text: string; open: number; sent: number; pin: [number, number] }; t: number }) {
  const [x, y] = along(t, [[c.open - 0.9, W * 0.96, H * 0.97], [c.open, c.pin[0], c.pin[1]], [c.sent + 0.2, c.pin[0], c.pin[1]], [c.sent + 1.0, W * 0.98, H * 0.6]]);
  return (
    <>
      <CommentCard text={c.text} t={t - c.open} sent={c.sent - c.open} at={c.pin} every={Math.min(0.055, (c.sent - c.open - 0.7) / c.text.length)} />
      {t > c.open - 0.9 && t < c.sent + 1.0 && <Cursor x={x} y={y} press={Math.abs(t - c.open) < 0.08 ? 1 : 0} ring={t >= c.open && t < c.open + 0.4 ? (t - c.open) / 0.4 : -1} />}
    </>
  );
}


// ---- the last place: the open sea at sundown and a boat on it (studies/ocean.tsx: Blender's FFT ocean baked a mesh a
// frame, the boat's heave, pitch and roll read off the sea under its hull). The sun sits on the upper-right third, where
// the montage left the eye; the last note is the one you leave when it is right; the sentence ends on the horizon.
type Ride = { frames: number; y: number[]; pitch: number[]; roll: number[] };
const SUN: V3 = [-640, 104, -736];
const SEA_NOTE: NoteSpec = { text: "that's the one. stay.", open: 1.2, sent: 3.0, pin: [W * 0.22, H * 0.2] };
const SEA_WORD = 4.96;   // the drop at 80.32
function Ocean({ s, guide }: { s: Cut; guide?: boolean }) {
  const f = useCurrentFrame(), n = s.f1 - s.f0, t = f / FPS, k = f / (n - 1);
  const r = ride as Ride, i = Math.min(r.frames - 1, f + 120);
  // a slow run in over the water, the sun held on its third at both ends
  const views = [{ eye: [15, 2.5, 9] as V3, look: [0, 1.6, 0] as V3, fov: 38 }, { eye: [12.6, 3.0, 7.2] as V3, look: [0, 1.6, 0] as V3, fov: 38 }].map((v) => aim(v, SUN, "TR"));
  const c = camOn(views.map((v, j) => ({ t: j, eye: v.eye, look: v.look, fov: v.fov })), k);
  const d = [SUN[0] - c.eye[0], 0, SUN[2] - c.eye[2]], l = Math.hypot(d[0], d[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.1, far: 6000 } }} />
        <ToneMapping exposure={-0.2} />
        <Fog color="#e89a6a" near={160} far={1700} />
        <Environment src={staticFile("hdri/the_sky_is_on_fire.hdr")} intensity={0.75} rotation={2.2} background />
        <DirectionalLight illuminance={30000} color="#ffb070" shadow_maps_enabled transform={Transform.fromXyz(SUN[0] / 6, SUN[1] / 6, SUN[2] / 6).lookingAt([0, 0, 0])} />
        <Mesh3d name="sun" castShadow={false} transform={Transform.fromXyz(...SUN)}><Sphere radius={24} /><StandardMaterial base_color="#ffe2a8" unlit /></Mesh3d>
        <MeshSequence name="sea" src={staticFile("ocean/storm.rseq")} frame={i} color="#ffffff" roughness={0.14} reflectance={0.35} metalness={0} clearcoat={0} />
        <MeshSequence name="spray" src={staticFile("ocean/storm-spray.rseq")} frame={i} color="#ffffff" roughness={0.9} metalness={0} clearcoat={0} opacity={0.75} />
        <Mesh3d name="far-sea" transform={Transform.fromXyz(0, -4.2, 0)}><Cuboid half_size={[5000, 0.5, 5000]} /><StandardMaterial base_color="#03131a" perceptual_roughness={0.2} reflectance={0.35} /></Mesh3d>
        <Model name="boat" src={staticFile("models/sea/boat.glb")} position={[0, r.y[i] - 0.85, 0]} rotation={[-r.pitch[i], 0, r.roll[i]]} />
        {/* the line stands far out on the water under the sun: the swell and the boat's mast cut into it */}
        <Word3D text="JUST THAT." t={t} from={SEA_WORD} at={[c.eye[0] + (d[0] / l) * 52 - 10, 4.6, c.eye[2] + (d[2] / l) * 52 + 8]} wide={34} turn={Math.atan2(-d[0], -d[2])} color="#1b0d0a" />
        <Bloom intensity={0.2} threshold={1.0} />
        {/* no drawing here: the pass's depth prepass can't bind this camera's multisampled frame (NOTES.md, engine gaps) */}
        <FilmLook look={{ warm: 1 }} seed={s.f0} />
      </Canvas3D>
      <Note c={SEA_NOTE} t={t} />
      {guide && <Guide s={s} />}
    </AbsoluteFill>
  );
}

/** the cursor moving a part: in to it, the app's pick box round it while it is held and carried, and away */
function Carry({ m, t, cam: c }: { m: Move; t: number; cam: Cam }) {
  if (t < m.from - 0.7 || t > m.to + 0.6) return null;
  const q = ease(clamp01((t - m.from) / (m.to - m.from)));
  const at = mix3(m.a, m.b, q), mid: V3 = [at[0], at[1] + m.up, at[2]];
  const p = project(c, mid), p0 = project(c, [m.a[0], m.a[1] + m.up, m.a[2]]);
  const held = t >= m.from && t <= m.to;
  const xy = t < m.from ? reach(t, [W * 0.97, H * 0.98], [p0.x, p0.y], m.from - 0.7, m.from) : held ? ([p.x, p.y] as [number, number]) : reach(t, [p.x, p.y], [p.x + 110, p.y + 90], m.to, m.to + 0.6);
  return (
    <>
      <PickBox cam={c} at={mid} half={m.half} show={held ? 1 : 0} />
      <Cursor x={xy[0]} y={xy[1]} press={held ? 1 : 0} ring={t >= m.from && t < m.from + 0.4 ? (t - m.from) / 0.4 : -1} />
    </>
  );
}

function Guide({ s }: { s: Cut }) {
  const ring = (at: At, out: boolean) => { const [x, y] = px(at); return <div style={{ position: "absolute", left: x - 38, top: y - 38, width: 76, height: 76, borderRadius: 38, boxSizing: "border-box", border: `3px ${out ? "solid #2bb3a6" : "dashed #e8a33d"}` }} />; };
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {[1 / 3, 2 / 3].map((q) => <div key={`v${q}`} style={{ position: "absolute", left: W * q, top: 0, width: 1, height: H, background: "rgba(255,255,255,0.45)" }} />)}
      {[1 / 3, 2 / 3].map((q) => <div key={`h${q}`} style={{ position: "absolute", top: H * q, left: 0, height: 1, width: W, background: "rgba(255,255,255,0.45)" }} />)}
      {ring(s.in.at, false)}{ring(s.out.at, true)}
    </AbsoluteFill>
  );
}


function Shot({ s, guide }: { s: Cut; guide?: boolean }) {
  const f = useCurrentFrame(), n = s.f1 - s.f0, t = f / FPS, k = n > 1 ? f / (n - 1) : 0;
  const spec = SPECS[s.id];
  // the prompt is typed before there is a picture (the office's first held frame comes on the cut)
  if (s.scene === "black") return <AbsoluteFill style={{ background: "#000" }}><Prompt lines={[{ text: "a boring office", from: 0.5 }]} busy={[[1.6, 9]]} t={t} /></AbsoluteFill>;
  if (s.scene === "sea") return <Ocean s={s} guide={guide} />;
  if (s.scene === "card") return <EndCard t={s.from + t} from={s.from} />;
  if (s.scene === "app") {
    // the screen we pushed into: raea's Watch, the canyon in its viewer. It opens as the monitor left it (the window
    // across the frame), creeps in while the note is written, and once the note is sent it goes into the viewer until
    // the canyon's picture is the whole frame: the cut to the canyon is on that same picture.
    const VIEW = { x: 974 / 3200, y: 192 / 2000, w: 1732 / 3200, h: 1386 / 2000 };                 // the viewer's picture in the capture
    const open = 1.5, sent = 3.0;
    const go = clamp01((t - sent - 0.1) / (n / FPS - sent - 0.1)), into = go * go * (3 - 2 * go) * 0.35 + go * go * go * 0.65;   // away slowly, arriving fast
    const zoom = lerp(lerp(1, 1.05, clamp01(t / sent)), 1 / VIEW.w, into);
    const iw = W * zoom, ih = iw * (2000 / 3200);
    // the point of the capture held at the frame's centre: the window's own centre, then the viewer's
    const cx = lerp(0.5, VIEW.x + VIEW.w / 2, into), cy = lerp(0.5, VIEW.y + VIEW.h / 2, into);
    const left = W / 2 - cx * iw, top = H / 2 - cy * ih;
    const pic: [number, number] = [left + (VIEW.x + VIEW.w * 0.62) * iw, top + (VIEW.y + VIEW.h * 0.3) * ih];
    const [mx, my] = t < open ? reach(t, [W * 0.92, H * 0.94], pic, 0.25, open - 0.1) : reach(t, pic, [pic[0] + 60, pic[1] + 240], sent + 0.1, sent + 0.8);
    return (
      <AbsoluteFill style={{ background: "#050506" }}>
        <Img src={staticFile("app/watch-canyon.png")} style={{ position: "absolute", left, top, width: iw, height: ih }} />
        {t < sent + 0.8 && <Cursor x={mx} y={my} press={Math.abs(t - open) < 0.08 ? 1 : 0} ring={t > open && t < open + 0.4 ? (t - open) / 0.4 : -1} />}
        {t < sent + 0.5 && <CommentCard text="later in the day." t={t - open} sent={sent - open} at={[W * 0.14, H * 0.3]} every={0.06} />}
      </AbsoluteFill>
    );
  }
  if (!spec) throw new Error(`no spec for ${s.id}`);
  const guideOver = guide ? <Guide s={s} /> : null;
  if (spec.first && t < spec.first.until) {
    const q = t / spec.first.until;
    const a = spec.first.a, b = spec.first.b;
    return <Take place={spec.place} parts={spec.first.parts} cam={{ eye: mix3(a.eye, b.eye, q), look: mix3(a.look, b.look, q), fov: lerp(a.fov ?? 38, b.fov ?? 38, q) }} rig={spec.first.rig(q, t)} sun={spec.sun} env={spec.env} ground={spec.ground} ev={spec.ev} look={{ warm: 1 }} seed={s.f0} over={guideOver} />;
  }
  // the camera: one run through the views at one speed, the first and last turned so the hook lands on its thirds place
  const views = spec.views.map((v, i) => (spec.hook && i === 0 ? aim(v, spec.hook[0], spec.hookAt?.[0] ?? s.in.at) : spec.hook && i === spec.views.length - 1 ? aim(v, spec.hook[1], spec.hookAt?.[1] ?? s.out.at) : v));
  const keys = views.map((v, i) => ({ t: i / (views.length - 1), eye: v.eye, look: v.look, fov: v.fov ?? 38 }));
  const c = camOn(keys, k);
  const m = spec.move, moved = m ? ease(clamp01((t - m.from) / (m.to - m.from))) : 0;
  const parts = m ? spec.parts.map((p) => ((p.name ?? p.file) === m.name ? { ...p, at: mix3(m.a, m.b, moved) } : p)) : spec.parts;
  const note = spec.note, flash = note && t >= note.sent + 0.05 && t < note.sent + 0.3;
  const cutNow = !!spec.first && Math.abs(t - spec.first.until) < 0.02;
  return (
    <Take place={spec.place} parts={parts} cam={c} rig={spec.rig(k, t)} sun={spec.sun} floor={spec.floor} ev={spec.exposure?.(k, t) ?? spec.ev} light={spec.light?.(k, t)} finish={spec.finish?.(k, t)}
      env={spec.env} ground={spec.ground} air={spec.air} look={{ warm: 1, ...spec.stock, wire: spec.drawn || flash ? 1 : 0 }} wire={!!note || !!spec.drawn} reset={cutNow} seed={s.f0}
      over={<>{spec.over?.(k, t)}{m && <Carry m={m} t={t} cam={c} />}{note && <Note c={note} t={t} />}{guideOver}</>}>
      {spec.roof && <Mesh3d name="roof" transform={Transform.fromXyz(...spec.roof.at)}><Cuboid half_size={spec.roof.half} /><StandardMaterial base_color="#3a3a3a" perceptual_roughness={0.9} /></Mesh3d>}
      {(spec.glows?.(k, t) ?? []).map((g, i) => {
        const col = g.color ?? [1, 1, 1];
        return <Mesh3d key={`glow-${i}-${g.lum}`} name={`glow-${i}-${g.lum}`} castShadow={false} transform={Transform.fromXyz(...g.at)}><Cuboid half_size={g.half} /><StandardMaterial base_color="#ffffff" emissive={new LinearRgba(g.lum * col[0], g.lum * col[1], g.lum * col[2], 1)} /></Mesh3d>;
      })}
      {spec.word && (() => {
        const w = spec.word, r = camOn(keys, w.at ?? 0.8);
        const d = [r.look[0] - r.eye[0], r.look[1] - r.eye[1], r.look[2] - r.eye[2]], l = Math.hypot(...d) || 1, n = d.map((x) => x / l);
        const rx = -n[2], rz = n[0], rl = Math.hypot(rx, rz) || 1;                                    // the camera's right, level
        const at: V3 = [r.eye[0] + n[0] * w.dist + (rx / rl) * (w.side ?? 0), r.eye[1] + n[1] * w.dist + (w.up ?? 0), r.eye[2] + n[2] * w.dist + (rz / rl) * (w.side ?? 0)];
        const wide = (w.fill ?? 0.8) * 2 * w.dist * Math.tan((r.fov * Math.PI) / 360) * (W / H);
        return <Word3D text={w.text} t={t} from={w.from} at={at} wide={wide} turn={Math.atan2(-n[0], -n[2])} color={w.color} />;
      })()}
    </Take>
  );
}

/** the same shot at the film's full size (2700x2160): the page drawn at twice its scale, the 3D at the full frame */
const Full = ({ children }: { children: React.ReactNode }) => <AbsoluteFill style={{ width: W, height: H, transform: "scale(2)", transformOrigin: "0 0" }}>{children}</AbsoluteFill>;
registerRoot(() => (
  <>
    {SHOTS.filter((s) => s.scene !== "office").map((s) => <Composition key={`x-${s.id}`} id={`v2x-${s.id}`} component={() => <Full><Shot s={s} /></Full>} width={W * 2} height={H * 2} fps={FPS} durationInFrames={s.f1 - s.f0} />)}
    {SHOTS.filter((s) => s.scene !== "office").map((s) => <Composition key={s.id} id={`v2-${s.id}`} component={() => <Shot s={s} />} width={W} height={H} fps={FPS} durationInFrames={s.f1 - s.f0} />)}
    {SHOTS.filter((s) => s.scene !== "office").map((s) => <Composition key={`g-${s.id}`} id={`v2g-${s.id}`} component={() => <Shot s={s} guide />} width={W} height={H} fps={FPS} durationInFrames={s.f1 - s.f0} />)}
  </>
));
