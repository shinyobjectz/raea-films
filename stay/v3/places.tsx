// v3: every place after the office. One idea runs through all of them and nothing is written on the screen: a place
// is a drawing until the cursor touches it. Each shot has ONE camera move (a dolly: a straight line at one speed,
// heading fixed, v3/cam.ts) and ONE thing that happens, with room to be seen:
//   canyon      the drawing of the slot; the cursor takes a tumbleweed (real in its pick box) and throws it at the right
//               wall; it strikes on the drop, and the real canyon and its mural spread from there as the sun comes down
//   garden      a drawing; the cursor carries a lantern (real inside its box) to the picnic table; where it is set down
//               it lights and the real garden at dusk spreads out
//   bedroom     the cursor draws a line across the frame and the real room follows it; the sheet settles on the bed
//   window      the cursor raises the blinds on rain
//   seat, road  from the driver's seat the wiper's sweep turns the drawing real; then the car through its own spray
//   harbour     a drawing; the cursor carries a crate down the pier; a click on the moored ship and it is real
//   montage     nineteen places a beat or half a beat each, drawing and real by turns
//   sea         the open sea at sundown and a boat, real from its first frame: where the film was going
import rampRide from "../media/ocean/rock-ramp.ship.json";
const waveRide = rampRide;
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, BevyComponent, Bloom, Canvas3D, Entity, Environment, Fog, MeshSequence, Model, MotionBlur, Refinish, Shadows, SurfaceShader } from "raea/3d";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d, Plane3d } from "raea/mesh";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import { LinearRgba } from "raea/color";
import { Transform } from "raea/transform";
import type { Part } from "../parts/library";
import { CEILED, RIGHT as BED_RIGHT, BACK as BED_BACK, F as BED_F, d as onDesk } from "../sets/bedroom";
import { CANYON, S as SAND, TURN, spot } from "../sets/canyon";
import { Dust, gustAt } from "./gust";
import { R as WEED_R, WALL_HIT, followOf, weedAt } from "./toss";
import { CanvasPicture, GardenPaint, OPEN as CANVAS_OPEN, PAINTING, PAINTING_AT, PAINTING_BOX, fillCam } from "./painting";
import { Wet } from "./wet";
import { CANYON_DOOR, CUT } from "./canyon-door";
import { CATHEDRAL } from "../sets/cathedral";
import { CLOCKTOWER, DIAL } from "../sets/clocktower";
import { COURT, RIM as COURT_RIM } from "../sets/court";
import { DINER, TOP as DINER_TOP } from "../sets/diner";
import { parts as FERRIS, WZ } from "../sets/ferris";
import { GARAGE, H as GARAGE_H } from "../sets/garage";
import { GYM, WALL as GYM_WALL } from "../sets/gym";
import { KELP, SUN as KELP_SUN } from "../sets/kelp";
import { KOI, W as KOI_W } from "../sets/koi";
import { DRY, DRYERS, LAUNDROMAT, OPEN } from "../sets/laundromat";
import { DECK as LH_DECK, LIGHTHOUSE } from "../sets/lighthouse";
import { ROOM as OBSERVATORY, turn as obs } from "../sets/observatory";
import { D as POOL_D, hall } from "../sets/pool";
import { ROAD, SEAT, Y as ROAD_Y } from "../sets/road";
import { forest } from "../sets/forest";
import { DECK, LAMP_POST, LANTERN, SHIP, TABLE, TABLE_TOP, garden, harbour } from "../sets/outdoors";
import { RX, roomItems } from "../sets/rooms";
import { hoard } from "../sets/hoard";
import { SEA, Y as SEA_Y } from "../sets/sea";
import { ROOM, ROWS, officeRoom } from "../sets/office-room";
import { parts as STAIRS, TOP as STAIR_TOP } from "../sets/stairwell";
import { MOUTH, SUBWAY } from "../sets/subway";
import { CREST, TURBINES } from "../sets/turbines";
import { TOP as VINYL_TOP, VINYL } from "../sets/vinyl";
import type { V3 } from "../v2/math";
import { PickBox } from "../v2/ui";
import { camAt, dolly, type Cam, type Dolly } from "./cam";
import { tallShot } from "./tall";
import { boxOf, carried, on, pulseOf, spread, rectOf, type XY } from "./hand";
import { Box3D, Hand3D, JOIN, edge, follow, front, handAt, lastKeys, resetKeys, screenPoint, type Key } from "./hand3d";
import { FilmLook, type Look } from "./look";
import { FPS, H, IN_COLOUR, MONTAGE, MONTAGE_FROM, MONTAGE_TO, SHORT, W, shot, type Shot } from "./plan";
import { PLACE_T } from "./times";
import { Panel3D, SLIDER, Slider, onPanel, sliderX, spring, type Panel } from "./controls";
import { Scene, fromParts, type Air, type Env, type Glow, type Rig, type Sun } from "./scene";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const run = (clip: string | undefined, t: number) => ({ ...(clip ? { clip } : {}), t });
const hex = (a: number[], b: number[], k: number) => "#" + a.map((v, i) => Math.round(v + (b[i] - v) * k).toString(16).padStart(2, "0")).join("");
/** a dolly that pushes toward what it looks at, at `speed` m/s */
const push = (eye: V3, at: V3, speed: number, fov: number): Dolly => { const d = [at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]], l = Math.hypot(...d); return dolly(eye, at, [d[0] / l * speed, d[1] / l * speed, d[2] / l * speed], fov); };

const NIGHT: Env = { src: "qwantani_moonrise_puresky", intensity: 0.5 };
const DAY: Env = { src: "kloofendal_48d_partly_cloudy_puresky", intensity: 1 };
const GREY: Env = { src: "kloofendal_overcast_puresky", intensity: 0.8 };
const MID: XY = [W * 0.5, H * 0.5];
const ENTER: XY = [W * 0.97, H * 0.98];

type Out = { place: string; parts: Part[]; rig?: Rig; cam: Cam; focus?: number; /** the cursor, a thing in the place (v3/hand3d.tsx) */ hand?: (NonNullable<ReturnType<typeof handAt>> & { size?: number }) | null; sun?: Sun; env?: Env; ev?: number; glows?: Glow[]; roof?: { at: V3; half: V3 }; ground?: string; /** more to stand in the scene (a control's panel) */ extra?: JSX.Element; /** passes over the finished frame, before its grain and vignette, seen by the shot's final lens (a canvas's picture, a painting's paint) */ post?: (cam: Cam) => JSX.Element; /** the canyon's gust of dust (v3/gust.tsx), `s` seconds in, lit by its sun (unturned, toward it) */ gust?: { s: number; sunDir: V3; lux: number; color: string }; /** the pick box round the thing the cursor has, standing in the place */ pick?: { at: V3; half: V3 }; /** still water at y 0, of this colour */ water?: string; /** a little glow round the sky and the brightest things (outdoors) */ bloom?: number; air?: Air; floor?: boolean; look: Look; over?: JSX.Element | null; finish?: Record<string, { material: string; color?: string; roughness?: number; emissive?: string; emissiveIntensity?: number }[]> };
/** a shot: what it is at t seconds in (0 at its cut), of `len` seconds */
type Make = (t: number, len: number) => Out;

// ---- the canyon ---------------------------------------------------------------------------------------------------
// The canyon is come into from the cellar's door (the director, 11-11: "have it open up right into the canyon"): the take's own
// line and speed carried on down the slot, the lens lifting a little to the strip of sky. v3/canyon-door.ts is the point.
const inSlot = (dx: number, y: number, z: number): V3 => spot([CANYON_DOOR[0] + dx, y, z]);
/** the sphere of the real place round the cursor at its least: the cursor itself and nothing more, metres */
const CURSOR_SPHERE = 0.08;
const CANYON_CAM: Dolly = (() => { const e = spot(CANYON_DOOR), a = spot([CANYON_DOOR[0], CANYON_DOOR[1] - 0.21, CANYON_DOOR[2] - 10]), o = spot([0, 0, 0]), d = spot([0, 0, -1]); return { ...dolly(e, a, [d[0] - o[0], 0, d[2] - o[2]], 50), tilt: 0.55, zoom: 0.6 }; })();
const WEED_HALF: V3 = [0.36, 0.34, 0.36];                                    // the tumbleweed's box (it lies on the sand near the door: v3/toss.ts)
/** a point of the toss (v3/toss.ts: the canyon's own frame, its y above the sand) in the world */
const onSand = (p: V3): V3 => spot([p[0], SAND + p[1], p[2]]);
// the mural: 9 m of the slot's walls, from a little past the boulder on, 4.5 m high from the sand up (the director, 11-11, on
// assembly 22: "these need to estend all the way down the walls"; its foot was knee-high)
const MURAL_FROM = spot([CANYON_DOOR[0], 0.0, 0.6]), MURAL_LEN = 9.0;
const MURAL_YAW = (() => { const o = spot([0, 0, 0]), d = spot([0, 0, -1]); return Math.atan2(d[2] - o[2], d[0] - o[0]); })();
// (the door we came through is the painting's, v3/oil.tsx, and is behind the lens the whole shot: the old cellar door
// that stood here was only ever a blur at the frame's edge as we came in)
// (and no "dust": its puffs of spheres are the gust's simulated sand now, v3/gust.tsx; the director on the release's canyon,
// 11-11: "the dust cant just be spheres")
// (and one tumbleweed: the second, turning on the spot by the boulder, stood in the thrown one's way)
const CANYON_PARTS: Part[] = CANYON.filter((p) => p.file !== "sky" && p.file !== "dust" && p.name !== "tumbleweed-roll").map((p) => (CUT[p.file] ? { ...p, file: CUT[p.file] } : p));
/** a point of the world into the set's own unturned frame (sets/canyon.tsx spot, backward) */
const unspot = ([x, y, z]: V3): V3 => [x * Math.cos(TURN) - z * Math.sin(TURN), y, x * Math.sin(TURN) + z * Math.cos(TURN)];
const canyon: Make = (t) => {
  const DROPT = PLACE_T.canyon.drop;                                        // the drop, in the shot's own seconds
  const cam = tallShot("canyon", camAt(CANYON_CAM, t), t), day = ease(ramp(t, DROPT, DROPT + 3.6));
  // On the drop the wind comes down the slot from the mouth behind us (the director, 11-11: "add the dust and wind effects to
  // the canyon like we did for the release ui concept"): the sand lifts and runs on ahead into the sun, the plants lean.
  const g = gustAt(t - DROPT);
  const { rest: GRAB, release: REL } = PLACE_T.canyon;                      // every time on the song's grid (v3/times.ts)
  // It comes through the door ahead of us and takes the tumbleweed (real in its box) by its top, in the open hand that
  // closes on it (v3/hand3d.tsx), lifts it and carries it up the slot, weighing it on the tick. On the tick before the
  // drop it draws it back, down and left, and throws it up and to the right, at the slot's right wall: it strikes the rock
  // on the drop, goes flat against it, and drops, and the wind has it down the slot (v3/toss.ts). From where it struck,
  // the real canyon goes out over everything, and the mural comes out over both walls behind it and starts to run.
  const weed = weedAt(t, GRAB, REL, DROPT), mid = onSand([weed.p[0], weed.p[1] + WEED_R * weed.sy, weed.p[2]]);
  const parts = CANYON_PARTS.map((p) => (p.name === "tumbleweed-hop" ? ({ ...p, at: onSand(weed.p), scale3: [weed.sx, weed.sy, weed.sz] } as Part) : p));
  const struck = spot(WALL_HIT);
  // (the keys at any second: the cursor's grip is on the weed's top wherever it has been carried to by then, and is
  // where it let go of it from the throw on)
  const canyonKeys = (x: number): Key[] => {
    const grip = (): V3 => onSand(weedAt(Math.min(x, REL), GRAB, REL, DROPT).top);
    return [
      // (it comes in where the take's cursor rides through every door, fixed to the lens: hand3d.tsx JOIN)
      { t: 0, p: JOIN }, { t: GRAB, p: front(grip, 0.1), press: true, seen: "take hold of the tumbleweed" },
      { t: REL, p: front(grip, 0.1), seen: "throw the tumbleweed up at the right wall" },
      // (the follow-through: on along the throw, up and right, and it stays there, opened, as the weed strikes)
      { t: REL + 0.3, p: front(onSand(followOf(REL, DROPT)), 0.1) }, { t: DROPT + 0.9, p: front(onSand(followOf(REL, DROPT)), 0.1) },
      { t: DROPT + 1.7, p: edge(1, -1) },
    ];
  };
  const hand = handAt(canyonKeys(t), t, cam, 0, (x) => ({ keys: canyonKeys(x), cam: tallShot("canyon", camAt(CANYON_CAM, x), x) }));
  // (the pick box shows as it is taken, then goes: carried in a box the whole way, the box was all we saw)
  const held = t >= GRAB - 0.08 && t <= GRAB + 0.5;
  const look: Look = { base: 1, warm: 0.2 + 0.6 * day, sat: 0.95 };
  // (real in its box from when the cursor takes it until the real canyon has caught up with it in its flight)
  // (the box is the weed's own size as it squashes, with 2 cm to spare: at a fixed 0.39 m it took in the left wall
  // beside the hold and the wind-up, a real patch of rock glowing out of the drawing)
  const fit: V3 = [WEED_R * weed.sx, WEED_R * weed.sy, WEED_R * weed.sz];
  // (and quiet once it is off the sand: its edge's line of light, where a grass stalk crossed it, glowed out of the
  // drawing beside the wind-up)
  if (t >= GRAB - 0.12 && t < DROPT + 0.9) { look.boxes = [boxOf(mid, fit, 0.02)]; look.quiet = t > GRAB + 0.4; }
  if (t >= DROPT) look.sphere = [struck, spread(t - DROPT, 2.2, 40)];
  // (grown as we come in from the little one that is just the cursor itself, as the door's picture has it: Place)
  // (and back to it once the weed is taken: the weed is real in its own box, and at 0.32 m the sphere took in the slab
  // beside the wind-up, a real patch of rock glowing out of the drawing at the lens)
  else if (hand) look.sphere = [hand.pos, Math.max(CURSOR_SPHERE, 0.32 * ease(ramp(t, 0, 0.6)) * (1 - ease(ramp(t, GRAB, GRAB + 0.3))))];
  // (all real, the sphere kept at no size: its centre is where the paint goes out from)
  if (t >= DROPT + 2.2) { look.base = 0; look.sphere = [struck, 0]; }
  look.pulse = pulseOf(t, [{ t: GRAB, at: onSand([0.1, WEED_R, 3.4]) }, { t: DROPT, at: struck }]);
  // the mural out from the strike, behind the real place's edge (never more than 0.7 of its way out), 10.5 m of it in
  // 2.4 s, fast and then slowing, its drips running as it ages (stay.wgsl: a negative progress is a radius)
  const wet = t < DROPT ? 0 : 0.01 + Math.max(0, Math.min(0.7 * spread(t - DROPT, 2.2, 40) - 0.25, 10.5 * (1 - (1 - clamp01((t - DROPT) / 2.4)) ** 2.2)));
  look.paint = { at: MURAL_FROM, yaw: MURAL_YAW, size: MURAL_LEN, p1: -wet, p2: 0 };
  return {
    place: "canyon", parts,
    rig: {
      sun: run("height", 0.8 * day), "sand-streams": run("fall", t / 9.3),
      "tumbleweed-hop": run("roll", weed.roll), grass: run("sway", g.sway), shrub: run("sway", g.sway), snag: run("sway", g.sway),
    },
    gust: { s: t - DROPT, sunDir: [5, 44.5 - 40 * day, -32], lux: 60000 - 14000 * day, color: hex([255, 255, 255], [255, 205, 150], day) },
    // the rock as sandstone is (a warm tan that goes gold in low light), not the saturated red its first tint gave it
    finish: { walls: [{ material: "canyon_sandstone", color: "#e6e0d8" }], "walls-in": [{ material: "canyon_sandstone", color: "#e6e0d8" }], rim: [{ material: "canyon_caprock", color: "#ded6cc" }], "rim-in": [{ material: "canyon_caprock", color: "#ded6cc" }], sand: [{ material: "canyon_sand", color: "#eee6da" }], "sand-in": [{ material: "canyon_sand", color: "#eee6da" }] },
    cam, hand, bloom: 0.3, env: { ...DAY, intensity: 1.6, rotation: 1.0 }, ev: 1.0 + 0.4 * day,
    sun: { from: spot([5, 46 - 40 * day, -32]), to: spot([0, 1.5, 0]), lux: 60000 - 14000 * day, color: hex([255, 255, 255], [255, 205, 150], day) },
    look, pick: held ? { at: mid, half: WEED_HALF } : undefined,
  };
};

// ---- the bedroom, and its window: a kid's room from scanned furniture (sets/rooms.ts kidsroom: Poly Haven's bed,
// nightstands, school desk, toys), on the same plan as the walk's rooms. Its blinds and the rain on its glass are the
// first bedroom's own rigged pieces, hung in this room's window (on the right wall) and stretched to its width.
const KID_WIN: V3 = [RX - 0.17, 1.625, 0.6];                                 // the window's middle, on the wall's inside face
const HOARD = hoard() as unknown as Part[];
const KIDS = (rain: boolean, junk: Part[] = HOARD): Part[] => [
  // (the far wall is the room's plain back wall, turned: no door under the painting. The walk's room shell has one, and
  // the director, 11-11, on assembly 23: "we have to remove the door here")
  ...(roomItems("kidsroom", 0) as unknown as Part[]).flatMap((p) => (p.name === "door" ? [] : p.name === "wall-door" ? [{ ...p, name: "wall-far", file: "wall-back" }] : [p])),
  ...junk,
  PAINTING,                                                                  // (the garden's painting, on the far wall: v3/painting.tsx)
  { place: "bedroom", file: "blinds", at: [RX - 0.17, 2.37, 0.6], yaw: -Math.PI / 2, clip: "raise", name: "blinds", scale3: [1.42, 1.04, 1] } as Part,
  ...(rain ? [{ place: "bedroom", file: "rain", at: [RX - 0.02, 1.625, 0.6], yaw: -Math.PI / 2, clip: "fall", name: "rain", scale3: [1.42, 1.04, 1] } as Part] : []),
];
/** a plane through `at` that we see edge-on, upright: what is to its left (as we look) is inside it */
// (the wall stands through the lens and the cursor, so on screen its edge is under the cursor at every depth; a wall square to
// the lens's axis put its edge a third of the frame away from a cursor held near the lens)
const wallAt = (cam: Cam, at: V3): [number, number, number, number] => { const f = [at[0] - cam.eye[0], at[2] - cam.eye[2]], l = Math.hypot(f[0], f[1]), r: V3 = [-f[1] / l, 0, f[0] / l]; return [-r[0], 0, -r[2], r[0] * at[0] + r[2] * at[2]]; };
const BED_CAM = push([1.55, 1.55, 2.7], [-1.0, 0.85, -1.3], 0.2, 48);
/** the bedroom's light (the garden's pull-out ends in this room in the same light: gardenShot) */
const BED_LIGHT = { focus: 3.4, env: { src: "kloofendal_48d_partly_cloudy_puresky", intensity: 1.1, rotation: 1.2 }, ev: 2.7, sun: { from: [30, 11, 7] as V3, to: [0, 0.8, 0] as V3, lux: 52000, color: "#ffc994" } };
/** how far along its push the bedroom's lens is: it comes to rest here out of the garden's pull-out and gathers its
 *  push from nothing over its first second */
const bedAlong = (t: number) => t - 0.6 * (1 - Math.exp(-t / 0.6));
const bedroom: Make = (t) => {
  const cam = camAt(BED_CAM, bedAlong(t));
  // the cursor takes hold at the left edge and draws a line across the frame; the real room is on the line's left
  // (it takes hold on a beat and lets go on one: v3/plan.ts onBeat)
  const { hold: HOLD, let: LET } = PLACE_T.bedroom;
  const keys: Key[] = [{ t: 0.05, p: edge(-1, 1, 1.9) }, { t: HOLD, p: screenPoint(0.04, 0.56, 1.9), press: true }, { t: LET, p: screenPoint(0.96, 0.56, 1.9) }, { t: LET + 0.7, p: edge(1, 1, 1.9) }];
  const hand = handAt(keys, t, cam);
  const x = t < HOLD ? 1 : t > LET ? W * 1.1 : hand ? hand.xy[0] : 1;
  // The room is empty until the line passes (the director, 11-11: "did we do the wipe form empty bedroom to hoarder bedroom?"; it
  // had been a hoarder's room from its first frame, only drawn and then real). Each thing of the hoard is not there
  // until the wall of change reaches it, and then it drops in and springs to its size, so the wipe leaves the mess behind it.
  const wall = t >= HOLD && t < LET && hand ? wallAt(cam, hand.pos) : null;
  const junk = HOARD.map((p) => {
    const past = t < HOLD ? -1 : t >= LET ? 9 : wall ? wall[0] * p.at[0] + wall[2] * p.at[2] + wall[3] : -1;       // metres past the wall
    const k = Math.min(1, Math.max(0, past / 0.5));
    if (k <= 0) return { ...p, at: [p.at[0], -30, p.at[2]] as V3 };                                                 // (not there: parked far under the floor)
    const pop = (1 - (1 - k) ** 3) * (1 + 0.22 * Math.sin(Math.PI * k));
    return { ...p, at: [p.at[0], p.at[1] + (1 - k) ** 2 * 0.35, p.at[2]] as V3, scale: (p.scale ?? 1) * pop };
  });
  return {
    place: "kidsroom", parts: KIDS(false, junk), rig: { blinds: run("raise", 1) },
    cam, hand, ...BED_LIGHT,
    // the line it draws is a wall of change standing in the room at the cursor, edge-on to us: the room is real behind it
    // (and the garden's painting on the far wall is real throughout, as the pull-out left it)
    look: t < LET ? { base: 1, warm: 0.6, boxes: [PAINTING_BOX], quiet: true, ...(t >= HOLD && hand ? { plane: wallAt(cam, hand.pos) } : hand ? { sphere: [hand.pos, 0.3] as [V3, number] } : {}), pulse: pulseOf(t, hand ? [{ t: HOLD, at: hand.pos }] : []) } : { base: 0, warm: 0.6 },
    post: (c) => <CanvasPicture cam={c} />,
  };
};
const WIN_CAM = push([-0.9, 1.5, 1.5], [RX - 0.2, 1.62, 0.6], 0.3, 46);
// What is outside the window (the director, 11-11, assembly 18: "make sure the lighting is now night time and theres a scene
// utside the window if not jjust blurry and inside faint glow from a lamp so we can really see the rain on the window"):
// a street lamp across a yard and firs behind it, at night. The lens is focused on the glass, so the yard is soft and
// the lamp's light comes through the beads of rain from behind them.
const YARD_LAMP: V3 = [RX + 6.4, -0.3, 1.5];
const YARD_LAMPS: V3[] = [[RX + 15, -0.3, -9], [RX + 22, -0.3, 8], [RX + 30, -0.3, -3]];   // more of the street, far off: points of light for the lens to soften
const YARD: Part[] = [
  { place: "garden", file: "street-lamp", at: YARD_LAMP, yaw: 0.6, name: "yard-lamp" } as Part,
  ...YARD_LAMPS.map((p, i) => ({ place: "garden", file: "street-lamp", at: p, yaw: 1.1 * i, name: `yard-lamp-${i + 2}` }) as Part),
  { place: "forest", file: "ground", at: [RX + 42, -0.12, 0], yaw: Math.PI / 2, name: "yard-ground" } as Part,   // (the forest's floor: a plain dark plane went pale grey toward the horizon and read as snow)
  // a lane past the house, wet, the lamps along it; long grass on the near verge; a hedge under the sill; the wood behind
  { place: "forest", file: "road", at: [RX + 9.5, -0.1, 0], yaw: 0, name: "yard-lane" } as Part,
  ...[-6, -2.2, 1.6, 5.4].flatMap((z, i) => [2.6, 6.2].map((dx, j) => ({ place: "forest", file: "verge", at: [RX + dx, -0.12, z + 0.4 * j], yaw: (Math.PI / 2) * ((i + j) % 4), name: `yard-verge-${i}-${j}`, overlap: true }) as Part)),
  ...[-1.6, -0.5, 0.6, 1.7, 2.8].map((z, i) => ({ place: "garden", file: ["shrub", "shrub-b", "shrub-c"][i % 3], at: [RX + 0.75, -0.1, z], yaw: 1.3 * i, scale: 1.5, name: `yard-hedge-${i}`, overlap: true }) as Part),
  ...([[RX + 13.5, -1.6, 1.1, 0.4], [RX + 15.5, 3.6, 1.25, 2.2], [RX + 12.2, 5.4, 0.95, 4.0], [RX + 17.5, 0.6, 1.3, 5.1], [RX + 14.5, -5.2, 1.1, 1.3], [RX + 19, -8, 1.2, 0.2], [RX + 20, 6.5, 1.1, 3.3], [RX + 16, 9.5, 1.0, 2.6], [RX + 13, -9, 1.15, 4.4]] as const)
    .map(([x, z, k, yaw], i) => ({ place: "forest", file: i % 2 ? "fir-b" : "fir-c", at: [x, -0.05, z], yaw, scale: k, name: `yard-fir-${i}` }) as Part),
];
const WIN_CLOSE = PLACE_T.window.close;                                     // the jump cut to the glass (the director, 11-11: "maybe a jump cut to the close up of rain")
// the close-up: the lens a forearm from the pane, drifting along it, focused on the beads; the street behind is discs of light
const WIN_CLOSE_CAM = dolly([RX - 0.62, 1.52, 0.86], [RX - 0.17, 1.6, 0.52], [0.012, 0.004, -0.045], 34);
const windowShot: Make = (t, len) => {
  const { grab: GRAB, let: LET } = PLACE_T.window;                         // a tick and a tock, on the song's grid (v3/times.ts)
  const close = t >= WIN_CLOSE;
  const cam = close ? camAt(WIN_CLOSE_CAM, t - WIN_CLOSE) : camAt(WIN_CAM, t), up = ease(ramp(t, GRAB, LET)); void len;
  const grab: V3 = [KID_WIN[0] - 0.05, 1.0 + 1.1 * up, KID_WIN[2]];
  const keys: Key[] = [{ t: 0.05, p: edge(1, 1) }, { t: GRAB, p: front(() => grab, 0.05), press: true, seen: "take hold of the blinds" }, { t: LET, p: front(() => grab, 0.05), seen: "let go of the blinds" }, { t: Math.min(WIN_CLOSE - 0.02, LET + 0.6), p: edge(1, -1) }];
  const hand = close ? null : handAt(keys, t, cam);
  return {
    // (the night pane and its rain are copies with a clear dark glass and lighter beads: tools/glb-material.ts)
    // (the rain is on the pane in the film's pass, not a model: v3/look.tsx `rain`. The modelled beads read as chalk.)
    place: "kidsroom", parts: [...KIDS(false).map((p) => (p.file === "wall-window" ? { ...p, file: "wall-window-night" } : p)), ...YARD], rig: { blinds: run("raise", up) },
    // night: the sky is a little moonlight and nothing else; the room is held by the desk lamp alone, faint and warm
    cam, hand, focus: Math.hypot(cam.eye[0] - KID_WIN[0], cam.eye[2] - KID_WIN[2]) * (close ? 0.97 : 1), env: { ...NIGHT, intensity: 0.002, rotation: 2.0 }, ev: WIN_EV, bloom: 0.45,
    sun: { from: [20, 30, -6], to: [RX, 1, 0.6], lux: 1.2, color: "#a9c0ff" },
    look: { base: 0, warm: -0.15, sat: 0.95, grain: 0.09, vignette: 0.2, halation: 0.9, pulse: pulseOf(t, [{ t: GRAB, at: [KID_WIN[0] - 0.05, 1.0, KID_WIN[2]] }]), rain: { at: [KID_WIN[0] + 0.12, 1.58, KID_WIN[2]], yaw: Math.PI / 2, w: 1.84, h: 1.4, t: 20 + t } },   // (down to the sill: it stopped short, and the strip of clear glass under it read as a hole, the director cm-6)
    glows: [{ at: [1.75, 1.35, -1.7], half: [0.06, 0.06, 0.06], lum: WIN_DESK, color: [1, 0.66, 0.36] }, ...[YARD_LAMP, ...YARD_LAMPS].map((p, i): Glow => ({ at: [p[0], p[1] + 3.55, p[2]], half: [0.09, 0.04, 0.09], lum: i ? WIN_STREET * 1.6 : WIN_STREET, color: [1, 0.74, 0.44] }))],
    pick: !close && t >= GRAB - 0.1 && t <= LET + 0.25 ? { at: [KID_WIN[0], 1.62, KID_WIN[2]], half: [0.04, 0.78, 0.86] } : undefined,
  };
};
const WIN_EV = 4.6, WIN_DESK = 16000, WIN_STREET = 160000;

// ---- the road -----------------------------------------------------------------------------------------------------
const ROAD_LOOK = { warm: -0.2, sat: 0.9, contrast: 0.7 };
// (a sky with clouds in it, kept low: the plain overcast one was a flat grey card behind the firs. the director, 11-11: "outdoor scenes needs clouds")
const ROAD_ENV: Env = { ...DAY, intensity: 0.22, rotation: 2.9 };
const SEAT_CAM: Dolly = { ...dolly([1.23, ROAD_Y + 1.14, 6.02], [1.4, ROAD_Y + 1.02, -6], [0, 0, 0], 60), zoom: -1.1 };
const seat: Make = (t, len) => {
  const q = t / len;
  // the wiper's first sweep is the wipe: the real road comes up the glass behind it
  return {
    place: "road", parts: SEAT, rig: { windscreen: run("wipers", q), car: run("wipers", q), rain: run("fall", q) },
    cam: camAt(SEAT_CAM, t), env: ROAD_ENV, sun: { lux: 1800, from: [-4, 5, 5], to: [0, 0.6, -0.5] }, ev: 1.7, ground: "#1c211a",
    look: t < 2.2 ? { ...ROAD_LOOK, base: 1, wipe: Math.max(0.0001, ramp(t, 0.5, 2.2)) } : { ...ROAD_LOOK, base: 0 },
    // the cursor is here too, inside the car: it clicks the glass, and the wipe starts from the click
    hand: handAt([{ t: 0.05, p: edge(-1, 1, 0.75) }, { t: 0.5, p: screenPoint(0.32, 0.62, 0.75), seen: "click on the windscreen" }, { t: 0.8, p: screenPoint(0.32, 0.62, 0.75) }, { t: 1.7, p: edge(1, -1, 0.75) }], t, camAt(SEAT_CAM, t)),
    over: <Ripple at={[W * 0.32, H * 0.62]} t={t - 0.5} />,
  };
};
// the forest road stands at y 0 (sets/forest.ts: scanned firs, ferns and ground; the old road's car and rain on it)
// (assembly 16: the car and its spray are off the road; the car was the last hand-modelled thing shown as real in a main shot)
const FOREST = forest().filter((p) => p.name !== "car" && !(p.name ?? "").startsWith("spray") && p.file !== "ground");
// the rain, again down the road, so the drive stays in it
const RAIN = FOREST.find((p) => p.name === "rain")!;
for (const [i, z] of [-13, -27, -41].entries()) FOREST.push({ ...RAIN, at: [RAIN.at[0], RAIN.at[1], z], name: `rain-${i + 2}` });
const RAINS = ["rain", "rain-2", "rain-3", "rain-4"];
// (the director, 11-11: "needs more gradd and rocka and mountains in the diatance. and the road needs to extend out")
FOREST.push({ file: "road", at: [0, 0.01, -115], name: "road-far" });           // the road runs on, another 90 m
const rr = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 233.1) * 43758.5453; return x - Math.floor(x); };
// the ground either side of the road, in squares, so that it can be bent (below): 4.2 m ones near us, 8.4 m ones far off
for (const side of [-1, 1]) {
  for (let z = 12; z > -46; z -= 4.2) for (let c = 0; c < 10; c++) FOREST.push({ place: "garden", file: "lawn", at: [side * (3.6 + 2.1 + 4.2 * c), -0.02, z], scale: 0.0702, name: `turf-${side}-${z.toFixed(0)}-${c}`, overlap: true } as Part);
  for (let z = -50.3; z > -160; z -= 8.4) for (let c = 0; c < 6; c++) FOREST.push({ place: "garden", file: "lawn", at: [side * (3.6 + 4.2 + 8.4 * c), -0.02, z], scale: 0.1404, name: `turf-far-${side}-${z.toFixed(0)}-${c}`, overlap: true } as Part);
  // rocks in the verge and among the firs, and a second belt of firs behind the first
  for (let j = 0; j < 12; j++) { const i = 400 + j + (side > 0 ? 40 : 0); FOREST.push({ place: "garden", file: "rocks", at: [side * (6 + 16 * rr(i, 1)), -0.15, 8 - j * 7.5 + 4 * rr(i, 2)], yaw: 6.28 * rr(i, 3), scale: 0.25 + 0.5 * rr(i, 4), name: `stone-${i}`, overlap: true } as Part); }
  for (let j = 0; j < 14; j++) { const i = 500 + j + (side > 0 ? 40 : 0); FOREST.push({ file: ["fir-a", "fir-b", "fir-c"][j % 3], at: [side * (30 + 12 * rr(i, 1)), -0.05, 6 - j * 11 + 5 * rr(i, 2)], yaw: 6.28 * rr(i, 3), scale: 1.0 + 0.6 * rr(i, 4), name: `fir-back-${i}` }); }
  // mountains: the mossy rocks at thirty times their size, a long way off on both sides
  for (let j = 0; j < 6; j++) { const i = 600 + j + (side > 0 ? 40 : 0); const k = 7 + 4 * rr(i, 4); FOREST.push({ place: "garden", file: "rocks", at: [side * (95 + 40 * rr(i, 1)), -8, -10 - j * 30 + 8 * rr(i, 2)], yaw: 6.28 * rr(i, 3), scale3: [k, k * (3.5 + 2 * rr(i, 5)), k], name: `mountain-${i}`, overlap: true } as unknown as Part); }
}
// and a range across the end of the road, where it runs out of sight
for (let j = 0; j < 5; j++) { const k = 9 + 4 * rr(700 + j, 3); FOREST.push({ place: "garden", file: "rocks", at: [-150 + 75 * j, -10, -260 - 20 * rr(700 + j, 1)], yaw: 6.28 * rr(700 + j, 2), scale3: [k, k * (5 + 3 * rr(710 + j, 1)), k], name: `range-${j}`, overlap: true } as unknown as Part); }
const LANE_X = -1.6, VERGE = 3.6;
// The fold (the director, 11-11: "an inception like thing where the road is strait but the world is folding up into the sky
// from flat to half pipe"). The road stays where it is. Everything off it is moved onto a surface that curls up from
// the road's edge: a thing `s` metres out from the edge is `s` metres round an arc of curvature K (1/K its radius),
// and stands square to that arc. K grows with how far down the road a thing is, and with the slider.
function folded(p: Part, k: number): Part {
  const s = Math.abs(p.at[0]) - VERGE;
  if (s <= 0 || k <= 1e-4) return p;
  // (past 66 degrees the surface runs on straight, up and out: a steep-sided valley with the sky left open along its
  // top. Curling all the way over shut the light out and the frame went black.)
  const side = Math.sign(p.at[0]), K = (k * (0.45 + 0.55 * clamp01(-p.at[2] / 70))) / 24, TOP = 1.15, th = Math.min(TOP, K * s), over = Math.max(0, s - TOP / K), y0 = p.at[1];
  const cx = side * (VERGE + Math.sin(th) / K + Math.cos(th) * over), cy = (1 - Math.cos(th)) / K + Math.sin(th) * over, roll = side * th, yaw = p.yaw ?? 0;
  // the turn Rz(roll) Ry(yaw), as the XYZ angles a part's rotation takes
  const cz = Math.cos(roll), sz = Math.sin(roll), cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const rot: V3 = [Math.atan2(-sz * syw, cyw), Math.asin(Math.max(-1, Math.min(1, cz * syw))), Math.atan2(sz, cz * cyw)];
  return { ...p, at: [cx - side * Math.sin(th) * y0, cy + Math.cos(th) * y0, p.at[2]], rot, overlap: true } as Part;
}
// (assembly 17: we drive it. With the car gone the slow push sat nearly still for four seconds; now the lens travels the
// car's lane at 3.4 m/s and the firs pass on both sides.)
const ROAD_CAM: Dolly = { ...dolly([LANE_X, 1.3, 9.5], [LANE_X + 0.4, 1.15, -40], [0, 0, -3.4], 50), tilt: 1.1 };   // (it lifts as the world does)
const ROAD_CLICK: V3 = [-1.0, 0.06, -9.5];                       // a point of the road ahead, in the car's lane
const road: Make = (t) => {
  const cam = camAt(ROAD_CAM, t), { click: CLICK, slide: SL } = { click: 1.3, slide: [2.9, 4.9] };   // (the road is out of the cut, 11-12: its times kept here, off the plan's beats)
  // the fold's slider rides ahead of us, over the lane
  const panel: Panel = { at: [cam.eye[0] + 0.5, 1.5, cam.eye[2] - 2.3], w: 0.66, res: SLIDER };
  const sk = ease(ramp(t, SL[0], SL[1])), knobAt = (): V3 => onPanel(panel, sliderX(0.06 + 0.88 * sk), 95);
  // the cursor comes in past the lens and clicks the road, and the real, wet place spreads from the click; then it
  // takes the slider's knob and drags it, and the world either side of the road folds up toward the sky as it goes
  const keys: Key[] = [{ t: 0.1, p: edge(1, 1) }, { t: CLICK, p: front(ROAD_CLICK, 0.03), seen: "click that makes the road real" }, { t: CLICK + 0.35, p: front(ROAD_CLICK, 0.03) },
    { t: SL[0], p: knobAt, press: true, seen: "take the fold's slider" }, { t: SL[1], p: knobAt, seen: "let the slider go" }, { t: SL[1] + 0.3, p: knobAt }, { t: SL[1] + 1.1, p: edge(1, -1) }];
  const hand = handAt(keys, t, cam);
  const look: Look = { ...ROAD_LOOK, base: 1, style: 2 };                      // the road is first charcoal on paper
  if (t >= CLICK) look.sphere = [ROAD_CLICK, spread(t - CLICK, 1.5, 90)];
  else if (hand) look.sphere = [hand.pos, 0.35];
  if (t >= CLICK + 1.5) { look.base = 0; look.sphere = undefined; }
  look.pulse = pulseOf(t, [{ t: CLICK, at: ROAD_CLICK }]);
  const fall = (t * 1.9) % 1;                                               // the rain at the speed rain falls (its loop is half a second)
  return {
    place: "forest", parts: FOREST.map((p) => folded(p, sk)), rig: Object.fromEntries(RAINS.map((n) => [n, run("fall", fall)])),
    // the wet asphalt reads as wet, the rain as fine grey streaks
    finish: { road: [{ material: "forest_asphalt", color: "#8d949a", roughness: 0.2 }], "road-far": [{ material: "forest_asphalt", color: "#8d949a", roughness: 0.2 }], lawn: [{ material: "garden_lawn", color: "#3c4a2c", roughness: 1 }], ...Object.fromEntries(RAINS.map((n) => [n, [{ material: "rain_streak", color: "#6f7d88" }, { material: "rain_splash", color: "#7e8b95" }]])) },
    // low light: the end of a wet day (the director: "it needs lots of work to feel low light and realistic")
    cam, hand, bloom: 0.35, env: { ...ROAD_ENV, intensity: 0.16 + 0.1 * sk }, sun: { lux: 900 + 500 * sk, from: [-6 + 5 * sk, 4 + 30 * sk, -30], to: [0, 0.6, -0.5 - 20 * sk], color: "#ffd2a8" }, ev: 2.4 + 0.5 * sk, ground: "#12160f",
    air: { at: [0, 8, -30], size: [70, 18, 110], density: 0.014 }, look,
    // the puddles on the road and the rain landing in them, real as the road is (v3/wet.tsx)
    post: (c) => <Wet cam={c} t={t} amount={t < CLICK ? 0 : 1} y={0.02} reveal={t < CLICK + 1.5 ? [ROAD_CLICK, spread(t - CLICK, 1.5, 90)] : undefined} />,
    extra: <Panel3D name="fold" panel={panel} ev={2.4} show={spring(t - SL[0] + 0.8) * (1 - ramp(t, SL[1] + 0.5, SL[1] + 0.9))}><Slider kind="fold" v={0.06 + 0.88 * sk} press={hand?.press ?? 0} /></Panel3D>,
  };
};

const sodium = (x: number, y: number): Glow => ({ at: [x, GARAGE_H - 0.13, -y], half: [0.6, 0.01, 0.2], lum: 60000, color: [1, 0.7, 0.36] });

// ---- the garden, and its painting (v3/painting.tsx). the director, 11-11: "come in a feww beats ealier on a pull out no
// cursor and then as we pull out stay in painted letters appears ... and we zoom out to see it is a painting on a
// wall". The garden at dusk, the lantern alight on the picnic table, and we are pulling back from it; it turns to oil
// paint as we go and STAY is brushed over it, a letter a beat; then it is the picture in a gilt frame on the kid's
// bedroom wall and we go on pulling back into his room, to come to rest where the bedroom's shot begins.
const GARDEN = garden();
const LANTERN_B: V3 = [TABLE[0] + 0.25, TABLE_TOP + 0.01, TABLE[2] + 0.35];
const GARDEN_AT: V3 = [0.0, 0.85, -3.8], GARDEN_BACK = 0.9;
const GARDEN_CAM = push([1.1, 1.25, -0.9], GARDEN_AT, -GARDEN_BACK, 44);    // (backward: pulling out from the table)
/** position, speed and acceleration at both ends over T: a curve whose speed and acceleration both run on unbroken */
const q5 = (t: number, T: number, p0: number, v0: number, a0: number, p1: number, v1: number, a1: number) => {
  const x = clamp01(t / T), x2 = x * x, x3 = x2 * x, x4 = x3 * x, x5 = x4 * x;
  return (1 - 10 * x3 + 15 * x4 - 6 * x5) * p0 + (x - 6 * x3 + 8 * x4 - 3 * x5) * v0 * T + (0.5 * x2 - 1.5 * x3 + 1.5 * x4 - 0.5 * x5) * a0 * T * T
    + (0.5 * x3 - x4 + 0.5 * x5) * a1 * T * T + (-4 * x3 + 7 * x4 - 3 * x5) * v1 * T + (10 * x3 - 15 * x4 + 6 * x5) * p1;
};
// The pull-out's pace, from the garden through the painting to rest in the bedroom (the director, 11-11, on assembly 23: "can we
// smooth out this transition so camera doesnt suddenly move at different speeds make it smooth"). The garden's lens
// was a dolly backing off the table at 0.9 m/s, so on screen it slowed (the picture shrinking by 0.29 of itself a second,
// then 0.15 as the table drew off), and out of the canvas a curve took that to 1.0 in 0.6 s: five times the pace across
// the cut. Now the pace is one curve on screen, in the log of the distance (the rate the picture shrinks at): the
// garden gathers from 0.1 a second to 0.5 at the cut, crossing it at the same pace and the same acceleration, and the
// pull across the room rises on to 0.9 and settles to rest where the bedroom's shot begins.
const PULL = { from: 0.1, garden: 0.8, cut: 0.5, accel: 0.2 };
const GARDEN_D0 = Math.hypot(...([0, 1, 2].map((i) => GARDEN_CAM.eye[i] - GARDEN_AT[i]) as V3));
/** the garden's lens at t: on its dolly, as far off the table as the pace has taken it (the dolly backs straight off it) */
function gardenCam(t: number): Cam {
  const far = GARDEN_D0 * Math.exp(q5(t, shot("garden").seconds, 0, PULL.from, 0, PULL.garden, PULL.cut, PULL.accel));
  return camAt(GARDEN_CAM, (far - GARDEN_D0) / GARDEN_BACK);
}
/** the garden's moment that is the painting: the painting shot's first frame, a frame on from the garden's last, seen
 *  OPEN times wider (v3/painting.tsx), so the canvas holds all of it and its open part is that frame exactly (tools/painting.sh,
 *  v3s-garden) */
export function gardenStill(): { t: number; cam: Cam } {
  const t = shot("painting").from - shot("garden").from, c = gardenCam(t);
  return { t, cam: { ...c, fov: (360 / Math.PI) * Math.atan(Math.tan((c.fov * Math.PI) / 360) * CANVAS_OPEN) } };
}
/** each letter begun on the song's tick: S, T, A, Y */
const INK_AT = [0.533, 1.112, 1.708, 2.291];
/** the bedroom's own first lens (its lean toward its cursor and all), where the pull-out comes to rest */
let BED0: Cam | null = null;
const bed0 = (): Cam => { if (!BED0) { BED0 = placeCam(shot("bedroom"), 0); resetKeys(); } return BED0; };
const norm3 = (v: V3): V3 => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };
/** out of the canvas, back across the room: from the lens that has the canvas fill the frame to the bedroom's first,
 *  leaving at the pace and acceleration the garden's pull-out had at the cut (its picture shrinking at the same rate),
 *  rising on and slowing to rest (PULL) */
function outOfPainting(t: number, len: number): Cam {
  const a = fillCam(GARDEN_CAM.fov), b = bed0(), x = Math.min(1, Math.max(0, t / len));
  const dOf = (k: number) => Math.hypot(...([0, 1, 2].map((i) => a.eye[i] + (b.eye[i] - a.eye[i]) * k - PAINTING_AT[i]) as V3));
  const da = dOf(0), far = da * Math.exp(q5(t, len, 0, PULL.cut, PULL.accel, Math.log(dOf(1) / da), 0, 0));
  // (how far along the line from the one lens to the other that distance is: it only grows along it)
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (dOf(m) < far) lo = m; else hi = m; }
  const k = lo;
  const fa = norm3([a.look[0] - a.eye[0], a.look[1] - a.eye[1], a.look[2] - a.eye[2]]), fb = norm3([b.look[0] - b.eye[0], b.look[1] - b.eye[1], b.look[2] - b.eye[2]]);
  const turn = x * x * (3 - 2 * x);
  const eye: V3 = [0, 1, 2].map((i) => a.eye[i] + (b.eye[i] - a.eye[i]) * k) as V3, f = norm3([0, 1, 2].map((i) => fa[i] + (fb[i] - fa[i]) * turn) as V3);
  return { eye, look: [eye[0] + f[0] * 4, eye[1] + f[1] * 4, eye[2] + f[2] * 4], fov: a.fov + (b.fov - a.fov) * turn };
}
/** the painting on the wall: the room is the bedroom as its shot begins (empty, a drawing), the painting real in it */
const paintingShot: Make = (t, len) => {
  const cam = outOfPainting(t, len), x = Math.min(1, t / len);
  const dist = Math.hypot(cam.eye[0] - PAINTING_AT[0], cam.eye[1] - PAINTING_AT[1], cam.eye[2] - PAINTING_AT[2]);
  return {
    place: "kidsroom", parts: KIDS(false, HOARD.map((p) => ({ ...p, at: [p.at[0], -30, p.at[2]] as V3 }))), rig: { blinds: run("raise", 1) },
    cam, hand: null, ...BED_LIGHT, focus: dist + (BED_LIGHT.focus - dist) * x * x * (3 - 2 * x),
    look: { base: 1, warm: 0.6, boxes: [PAINTING_BOX], quiet: true },
    post: (c) => <CanvasPicture cam={c} />,
  };
};
const gardenShot: Make = (t) => {
  const cam = gardenCam(t), oil = ease(ramp(t, 0.6, 2.9));
  const focus = Math.hypot(cam.eye[0] - LANTERN_B[0], cam.eye[1] - LANTERN_B[1], cam.eye[2] - LANTERN_B[2]);
  return {
    place: "garden", parts: [...GARDEN, { file: "lantern", at: LANTERN_B, name: "lantern" }],
    cam, hand: null, bloom: 0.35, focus, env: { src: "sunset_forest", intensity: 0.7, rotation: 2.2 }, ev: 1.9, ground: "#1c1a12",
    sun: { from: [-30, 5, -24], to: [0, 0.8, -3], lux: 5000, color: "#ffb27a" },
    // the lantern alight on the table, and the street lamp's head
    glows: [{ at: [LANTERN_B[0], LANTERN_B[1] + 0.16, LANTERN_B[2]], half: [0.016, 0.03, 0.016], lum: 3000000, color: [1, 0.62, 0.3] }, { at: [LAMP_POST[0], 3.55, LAMP_POST[2]], half: [0.08, 0.03, 0.08], lum: 260000, color: [1, 0.8, 0.55] }],
    look: { base: 0, warm: 0.5 },
    // (seen by a wider lens than its own, for the still, the letters drawn that much smaller: gardenStill)
    post: (c) => <GardenPaint t={t} oil={oil} ink={INK_AT} zoom={Math.tan((c.fov * Math.PI) / 360) / Math.tan((cam.fov * Math.PI) / 360)} />,
  };
};

// ---- the harbour (sets/outdoors.ts: a scanned pier, a Dutch ship moored along it, a pinnace out in the bay). A
// drawing; the cursor carries a crate out of the way down the pier; a click on the ship and it is real, the lantern on
// the deck alight.
const HARBOUR = harbour();
const CRATE_A: V3 = [0.3, DECK + 0.02, -0.5], CRATE_B: V3 = [-0.45, DECK + 0.04, -1.6];
const HULL: V3 = [SHIP[0] - 2.2, 2.6, SHIP[2] + 1.5];                        // the ship's side, above the pier
const HARBOUR_CAM = push([-0.5, DECK + 1.55, 4.0], [1.6, DECK + 1.9, -8], 0.32, 46);
// (the keys at any second: the crate it holds is where it has been carried to by then)
const harbourKeys = (t: number): Key[] => {
  const { pick: PICK, put: PUT, click: CLICK } = PLACE_T.harbour, crate = carried(t, CRATE_A, CRATE_B, PICK, PUT, 0.12);
  const grip = (): V3 => [crate[0], crate[1] + 0.4, crate[2]];
  return [{ t: 0.05, p: edge(1, 1) }, { t: PICK, p: front(grip, 0.3), press: true, seen: "pick up the crate" }, { t: PUT, p: front(grip, 0.3), seen: "put down the crate" }, { t: CLICK, p: front(HULL, 0.5), seen: "click on the ship" }, { t: CLICK + 0.5, p: front(HULL, 0.5) }, { t: CLICK + 1.6, p: edge(-1, 1) }];
};
const harbourShot: Make = (t) => {
  const { pick: PICK, put: PUT, click: CLICK } = PLACE_T.harbour;           // tick, tock, and the click, on the song's grid (v3/times.ts)
  const cam = tallShot("harbour", camAt(HARBOUR_CAM, t), t), crate = carried(t, CRATE_A, CRATE_B, PICK, PUT, 0.12);
  const ship = on(cam, HULL), lit = t >= CLICK + 0.08;
  const hand = handAt(harbourKeys(t), t, cam, 0, (x) => ({ keys: harbourKeys(x), cam: tallShot("harbour", camAt(HARBOUR_CAM, x), x) }));
  const mid: V3 = [crate[0], crate[1] + 0.18, crate[2]], half: V3 = [0.44, 0.2, 0.3];
  const look: Look = { base: 1, warm: 0.4 };
  if (t > PICK - 0.12 && t < PUT + 0.25) look.boxes = [boxOf(mid, half)];
  if (t >= CLICK) look.sphere = [HULL, spread(t - CLICK, 1.3, 80)];
  else if (hand && !look.boxes) look.sphere = [hand.pos, 0.3];
  if (t >= CLICK + 1.3) { look.base = 0; look.sphere = undefined; }
  look.pulse = pulseOf(t, [{ t: PICK, at: CRATE_A }, { t: PUT, at: CRATE_B }, { t: CLICK, at: HULL }]);
  return {
    place: "harbour", parts: [...HARBOUR, { file: "crate", at: crate, yaw: 0.35, name: "crate" }],
    cam, hand, bloom: 0.35, env: { src: "the_sky_is_on_fire", intensity: 0.9, rotation: 0.4 }, ev: 1.2, water: "#06161c",
    sun: { from: [-40, 7, -60], to: [0, 1, -6], lux: 9000, color: "#ffad78" },
    glows: [{ at: [LANTERN[0], LANTERN[1] + 0.16, LANTERN[2]], half: [0.016, 0.03, 0.016], lum: lit ? 900000 : 0, color: [1, 0.62, 0.3] }],
    air: { at: [0, 6, -45], size: [160, 14, 120], density: 0.006 }, look,
    pick: t >= PICK - 0.08 && t <= PUT + 0.2 ? { at: mid, half } : undefined,
  };
};

// ---- the montage --------------------------------------------------------------------------------------------------
const NEAR_MOON: V3 = obs([0, 2.74 + Math.sin(0.576) * 30, -Math.cos(0.576) * 30]);
const HUB: V3 = [0, CREST + 80, -1], CLOCK: V3 = [-1.0, POOL_D + 3.3, -15];
const closer = (eye: V3, at: V3, by: number): V3 => [eye[0] + (at[0] - eye[0]) * by, eye[1] + (at[1] - eye[1]) * by, eye[2] + (at[2] - eye[2]) * by];
const lampAt = (at: V3, lum = 140000, color: [number, number, number] = [1, 0.72, 0.42]): Glow => ({ at, half: [0.06, 0.05, 0.06], lum, color });
/** the round thing a montage place is framed on: its centre, its radius (metres), and the way from it to the lens */
type Round = { c: V3; r: number; from: V3; fov?: number };
type Quick = { place: string; parts: Part[]; on: Round; rig: (k: number) => Rig; env?: Env; sun?: number; ev?: number; ground?: string; floor?: boolean; warm?: number; glows?: Glow[]; roof?: { at: V3; half: V3 }; finish?: Out["finish"]; /** shown as its drawing (else by its turn in the montage) */ drawn?: boolean };
// Each place's round thing (a record, a ripple, a cup from above, a stairwell's eye, a dryer's window, a clock ...). The
// lens looks straight at its centre from `from`, and stands where the thing is the montage's size on the frame.
const ROUND: Record<string, Round> = {
  vinyl: { c: [-1.62, VINYL_TOP + 0.12, 0.5], r: 0.15, from: [0.05, 1, 0.3] },
  koi: { c: [-0.7, KOI_W + 0.8, 0.45], r: 0.9, from: [0.05, 1, 0.25] },
  diner: { c: [-0.75, DINER_TOP + 0.07, -0.98], r: 0.075, from: [0, 1, 0.02] },
  stairwell: { c: [0, 0, 0], r: 2.4, from: [0.02, 1, 0.05], fov: 60 },   // (the well's floor, from under the skylight)
  laundromat: { c: [DRYERS[1] - 0.03, 1.57, DRY + 0.52], r: 0.27, from: [0.15, 0.02, 1] },
  clocktower: { c: [-0.08, DIAL, -2.6], r: 1.28, from: [0, -0.12, 1], fov: 50 },
  office: { c: [1.2, 2.25, ROOM.z1 + 0.05], r: 0.17, from: [-0.1, -0.1, 1] },
  gym: { c: [0.9, 0.12, 3.4], r: 0.12, from: [0.2, 0.4, 1] },                 // (a ball at rest on the boards: a hoop from the front is an ellipse)
  court: { c: COURT_RIM, r: 0.23, from: [0.02, -1, 0.14] },                    // (the rim from straight under it)
  subway: { c: [0, 2.9, MOUTH + 0.5], r: 1.7, from: [0.08, 0, 1] },
  garage: { c: [7.2, 1.92, -2.2], r: 0.3, from: [-1, -0.08, 0.25] },           // (the convex mirror on its pillar)
  ferris: { c: [0, 9.4, WZ], r: 8.6, from: [0, -0.2, 1], fov: 55 },
  turbines: { c: [0, CREST + 80, -1], r: 38, from: [0.1, -0.15, 1] },
  lighthouse: { c: [0, LH_DECK + 1.85, 0], r: 0.95, from: [0.3, -0.1, 1] },
  pool: { c: [-1.0, POOL_D + 3.3, -14.9], r: 0.4, from: [0.15, -0.15, 1] },
  cathedral: { c: [0, 8.6, -8.6], r: 2.9, from: [0, -0.3, 1], fov: 50 },
  kelp: { c: KELP_SUN, r: 1.6, from: [0.02, -1, 0.9], fov: 60 },
  observatory: { c: NEAR_MOON, r: 1.15, from: (() => { const e = obs([0.9, 1.5, 3.4]); return [e[0] - NEAR_MOON[0], e[1] - NEAR_MOON[1], e[2] - NEAR_MOON[2]] as V3; })() },
  pier: { c: [0, SEA_Y + 9, -300], r: 9, from: [0, -0.02, 1] },
};
const QUICK: Record<string, Quick> = {
  vinyl: { place: "vinyl", parts: VINYL, env: { ...DAY, intensity: 0.5 }, floor: true, sun: 0, ev: 3.9, warm: 0.6, roof: { at: [0, 3.25, 0], half: [5, 0.1, 5] }, glows: [lampAt([-1.35, 2.25, 0.3]), lampAt([1.4, 2.25, -1.0])], on: ROUND.vinyl, rig: (k) => ({ turntable: run("needle", k) }) },
  // the liminal office, lit by its own ceiling lights, half a beat down its aisle
  office: { place: "office", parts: officeRoom(1, { tubes: 0, blinds: 0.82 }) as unknown as Part[], sun: 0, ev: 1.3, warm: -0.45,
    roof: { at: [0, ROOM.h + 0.3, (ROOM.z0 + ROOM.z1) / 2], half: [ROOM.x + 1, 0.1, (ROOM.z0 - ROOM.z1) / 2 + 1] },
    glows: ROWS.flatMap((z) => [-3.4, 0, 3.4].map((cx): Glow => ({ at: [cx, ROOM.h - 0.012, z - 0.4], half: [0.26, 0.004, 0.56], lum: 9000, color: [1, 0.98, 0.94] }))),
    on: ROUND.office, rig: () => ({}) },
  koi: { place: "koi", parts: KOI, env: DAY, ground: "#5d6b45", ev: 0.8, on: ROUND.koi, rig: (k) => ({ ripples: run("spread", k), pebble: run("drop", clamp01(k * 3)) }) },
  // the pier and its headland at sundown, as its drawing
  pier: { place: "sea", parts: SEA, ev: 0.4, on: ROUND.pier, rig: (k) => ({ sea: run("waves", k), sun: run("height", 0.6), boat: run("rock", k), gulls: run("fly", k), foam: run("wash", k) }) },
  stairwell: { place: "stairwell", parts: STAIRS, env: { ...GREY, intensity: 0.4 }, ev: 2.0, on: ROUND.stairwell, rig: (k) => ({ "paper-plane": run("spiral", k) }) },
  ferris: { place: "ferris", parts: FERRIS, sun: 1200, env: { ...DAY, intensity: 0.9 }, ground: "#2b2b2e", ev: 0.8, on: ROUND.ferris, rig: (k) => ({ wheel: run("spin and light", 0.1 + 0.25 * k), "string-lights": run("on", k) }) },
  // the laundromat and the parking garage, half a beat each: the two hand-built places the garden and the harbour took the main shots from
  laundromat: { place: "laundromat", parts: LAUNDROMAT.map((p) => (p.file === "laundry-cart" ? { ...p, at: [DRYERS[OPEN] + 0.05, 0, DRY + 1.05] as V3, clip: undefined } : p)),   // (the cart stands under the open dryer, out of the lens's way) env: { ...NIGHT, intensity: 0.3 }, sun: 0, ev: 1.5, warm: -0.1, roof: { at: [0, 3.75, 0], half: [5, 0.1, 4] },
    glows: [-2.6, -0.78, 1.0].map((x): Glow => ({ at: [x, 2.97, -2.3], half: [0.6, 0.006, 0.12], lum: 5200, color: [0.9, 1, 0.96] })),
    on: ROUND.laundromat, rig: (k) => ({ "dryer-3": run("door", 1), "dryer-1": run("drum", k), "dryer-2": run("drum", k), "dryer-4": run("drum", k), "laundry-upper-2": run("tumble", k), "laundry-upper-4": run("tumble", k) }) },
  clocktower: { place: "clocktower", parts: CLOCKTOWER, env: { ...GREY, intensity: 0.4 }, floor: true, sun: 0, ev: 3.4, warm: 0.5, roof: { at: [0, 6.2, 0], half: [6, 0.1, 6] }, glows: [lampAt([1.27, 3.95, 0.3], 260000), lampAt([-1.6, 3.95, 0.6], 200000)], on: ROUND.clocktower, rig: (k) => ({ movement: run("push", k), "clock-face": run("push", k), "leading-off": run("push", k), pendulum: run("swing", k) }) },
  garage: { place: "garage", parts: GARAGE.filter((p) => p.name !== "car-in-aisle").map((p) => (p.name === "car-in-bay" ? { ...p, clip: undefined } : p)), env: { ...GREY, intensity: 0.25 }, sun: 0, ev: 2.4, warm: 0.35, ground: "#2a2a2c",
    roof: { at: [0, GARAGE_H + 0.45, -1], half: [14, 0.1, 9] }, glows: [sodium(-7.5, 0.2), sodium(-2.5, 0.2), sodium(-7.5, 4.6), sodium(-2.5, 4.6), sodium(2.5, 0.2), sodium(7.5, 0.2)],
    on: ROUND.garage, rig: (k) => ({ "barrier-arm": run("lift", k) }) },
  subway: { place: "subway", parts: SUBWAY, sun: 0, ev: 2.4, warm: -0.2, glows: [2, -3, -8, -13].map((z) => lampAt([0.5, 4.42, z], 120000, [0.92, 1, 0.96])), on: ROUND.subway, rig: (k) => ({ train: run("arrive", k), signal: run("trip", k) }) },
  diner: { place: "diner", parts: DINER, env: { ...DAY, intensity: 0.4 }, sun: 0, ev: 3.6, warm: 0.9, roof: { at: [0, 3.25, 0], half: [6, 0.1, 5] }, glows: [lampAt([-2.4, 2.3, -1.2], 200000), lampAt([-1.2, 2.3, -1.2], 200000), lampAt([0.0, 2.3, -1.2], 200000), lampAt([-0.75, 2.0, -0.6], 160000, [1, 0.78, 0.5])], on: ROUND.diner, rig: (k) => ({ "coffee-cup": run("swirl", k) }) },
  gym: { place: "gym", parts: GYM, env: { ...DAY, intensity: 0.5 }, sun: 0, ev: 2.6, warm: 0.3, roof: { at: [0, 8.5, 3], half: [11, 0.1, 9] }, glows: [-5, 0, 5].flatMap((x) => [1.2, 6.4].map((z) => lampAt([x, 6.85, z], 900000, [1, 0.9, 0.72]))), on: ROUND.gym, rig: () => ({ basketball: run("bounce", 0) }) },
  cathedral: { place: "cathedral", parts: CATHEDRAL, sun: 9000, ev: 1.6, on: ROUND.cathedral, rig: (k) => ({ "rose-window": run("light", 1), "light-shaft": run("swing", k) }) },
  kelp: { place: "kelp", parts: KELP, ev: 0.8, on: ROUND.kelp, rig: (k) => ({ "kelp-a": run("stand", k), "kelp-b": run("stand", k), "kelp-c": run("stand", k), sun: run("shimmer", k) }) },
  lighthouse: { place: "lighthouse", parts: LIGHTHOUSE, ev: 0.6, on: ROUND.lighthouse, rig: (k) => ({ "fresnel-lens": run("turn", 0.3 * k), beam: run("sweep", 0.3 * k), sea: run("swell", k) }) },
  turbines: { place: "turbines", parts: TURBINES, ev: 0.4, on: ROUND.turbines, rig: (k) => ({ "turbine-1": run("spin", 0.2 * k), "turbine-2": run("spin", 0.3 + 0.2 * k), "turbine-3": run("spin", 0.6 + 0.2 * k) }) },
  court: { place: "court", parts: COURT.map((p) => (p.file === "rain" ? ({ ...p, place: "road", at: [-1, 0, -4] as V3 } as Part) : p)),   // (the road's fine rain: the court's own streaks were fat white bars this close to the lens)
    sun: 150, env: { ...GREY, intensity: 0.5 }, ground: "#1d1d20", ev: 1.6, on: ROUND.court, rig: (k) => ({ basketball: run("drop", 0.25 * k), hoop: run("net", k), rain: run("fall", k) }) },
  observatory: { place: "observatory", parts: OBSERVATORY.map((p) => (p.file === "moon" ? { ...p, at: NEAR_MOON } : p)), sun: 40, env: { ...NIGHT, intensity: 0.25 }, ev: 3.0, warm: 0.4, on: ROUND.observatory, rig: (k) => ({ dome: run("open", 1), moon: run("halo", k), telescope: run("slew", 0.2 * k), stars: run("drift", k) }) },
  pool: { place: "pool", parts: hall(false), env: DAY, ev: 0.3, on: ROUND.pool, rig: (k) => ({ "pace-clock": run("sweep", k), flags: run("flutter", k) }) },
};
const ORDER = MONTAGE.map(([id]) => id);
// two of the montage's drawings, side by side in the run, are pencil on paper
const PENCIL = ["stairwell", "laundromat"];
// the circle's size on the frame, in stage pixels, at a second of the film: it grows through the whole montage
const R0 = 0.17 * SHORT, R1 = 0.31 * SHORT;                     // (the short side: on the tall frame the circle is the size it is on the 5:4)
const roundAt = (abs: number) => R0 * (R1 / R0) ** clamp01((abs - MONTAGE_FROM) / (MONTAGE_TO - MONTAGE_FROM));
const quick = (id: string): Make => (t, len) => {
  const q = QUICK[id], k = t / len, n = ORDER.indexOf(id), sh = shot(id), o = q.on, fov = o.fov ?? 40;
  // where the lens stands for the circle to be a size: along `from`, as far off as that size asks
  const l = Math.hypot(...o.from), dir: V3 = [o.from[0] / l, o.from[1] / l, o.from[2] / l];
  const eyeFor = (px: number): V3 => { const d = (o.r * (H / 2)) / (Math.tan((fov * Math.PI) / 360) * px); return [o.c[0] + dir[0] * d, o.c[1] + dir[1] * d, o.c[2] + dir[2] * d]; };
  const e0 = eyeFor(roundAt(sh.from)), e1 = eyeFor(roundAt(sh.from + len));
  const cam = camAt(dolly(e0, o.c, [(e1[0] - e0[0]) / len, (e1[1] - e0[1]) / len, (e1[2] - e0[2]) / len], fov), t);
  const px = roundAt(sh.from + t);
  // tick and tock: two places are their drawings with the round thing real inside the circle, the next two are real
  // with the round thing drawn, and so on down the run; the circle itself never moves
  // (two and two, not one and one: turn about on every cut at two cuts a beat flashed light and dark eight times a
  // second, past the limit for flashing, WCAG 2.3.1; raea check refused the film)
  const drawn = !IN_COLOUR.includes(id); void n;
  // the cursor rides the circle, and every cut is its click
  const depth = Math.min(0.6, 0.4 * Math.hypot(e1[0] - o.c[0], e1[1] - o.c[1], e1[2] - o.c[2]));
  const spot = screenPoint(0.5 + (0.52 * px) / W, 0.5 + (0.52 * px) / H, depth);
  const hand = handAt([{ t: -1, p: spot }, { t: 0.01, p: spot, click: true }, { t: len + 1, p: spot, glide: true }], t, cam);
  return {
    place: q.place, parts: q.parts, rig: q.rig(k), cam, hand: hand && { ...hand, size: 0.33 / Math.sqrt(Math.max(0.3, depth)) }, env: q.env, ev: q.ev, ground: q.ground, floor: q.floor, glows: q.glows, roof: q.roof, finish: q.finish,
    sun: { lux: q.sun ?? 14000, from: [-4, 5, 5], to: [0, 0.6, -0.5] }, look: { base: drawn ? 1 : 0, ring: [W / 2, H / 2, px], warm: q.warm ?? 0.2, gain: 3.0, style: PENCIL.includes(id) ? 1 : 0 },
  };
};

// ---- the corridors (v3/plan.ts MONTAGE: the four shots after the subway; blender/components/corridors) --------------
// The subway's shot ends with the lens flying through the arriving car; these fly on down four corridors of the car's
// section (3.0 m wide, 2.8 m high, the lens on the axis at 1.4 m), at one speed, so every cut lands on the same lines:
// an old hotel's, a school's, a brick vault's, and a tunnel of torii gates up a forest path. The montage's circle and
// cursor ride on through them, the far corridor drawn inside the circle.
/** how fast the lens flies down them, m/s (the car comes through the lens at about 60) */
const HALL_V = 40, HALL_EYE = 1.4;
type Hall = { ev: number; warm: number; env?: Env; sun?: Sun; more?: Part[] };
// (the cedars and ferns round the gates: the forest's own parts, outside the pillars, none in the lens's way)
const TORII_WOOD: Part[] = [
  ...[[-4.2, -3], [5.0, -7], [-6.5, -12], [4.0, -16], [-4.5, -22], [6.8, -26], [-5.2, -31], [4.6, -36], [-7.5, -41], [5.5, -46]].map(([x, z], i) => ({ place: "forest", file: i % 3 ? "fir-c" : "fir-b", at: [x, -0.05, z] as V3, yaw: 1.3 * i, scale: 0.9 + 0.08 * (i % 4), name: `torii-fir-${i}` }) as Part),
  ...Array.from({ length: 18 }, (_, i) => ({ place: "forest", file: "fern", at: [(i % 2 ? 1 : -1) * (1.75 + 0.5 * ((i * 7) % 3) / 2), 0, 2 - i * 2.6] as V3, yaw: 2.1 * i, scale: 0.8 + 0.1 * (i % 3), name: `torii-fern-${i}` }) as Part),
];
const HALLS: Record<string, Hall> = {
  hotel: { ev: 2.5, warm: 0.45 },
  school: { ev: 1.3, warm: -0.25 },
  vault: { ev: 3.4, warm: 0.35 },
  torii: { ev: 0.7, warm: 0.25, env: { src: "sunset_forest", intensity: 0.7, rotation: 2.2 }, sun: { lux: 26000, from: [-30, 26, -14], to: [0, 0, -14], color: "#ffd9a8" }, more: TORII_WOOD },
};
const hallShot = (id: string): Make => (t, len) => {
  const h = HALLS[id], sh = shot(id);
  const cam = camAt(dolly([0, HALL_EYE, 0], [0, HALL_EYE, -10], [0, 0, -HALL_V], 40), t);
  const px = roundAt(sh.from + t);
  // (the cursor rides the circle, and every cut is its click, as in the montage's other places)
  const spot = screenPoint(0.5 + (0.52 * px) / W, 0.5 + (0.52 * px) / H, 0.6);
  const hand = handAt([{ t: -1, p: spot }, { t: 0.01, p: spot, click: true }, { t: len + 1, p: spot, glide: true }], t, cam);
  return {
    place: "corridors", parts: [{ place: "corridors", file: id, at: [0, 0, 0], name: `corridor-${id}` } as Part, ...(h.more ?? [])], cam,
    hand: hand && { ...hand, size: 0.33 / Math.sqrt(0.6) }, env: h.env, ev: h.ev, sun: h.sun ?? { lux: 0, from: [0, 10, 0], to: [0, 0, 0] },
    look: { base: 0, ring: [W / 2, H / 2, px], warm: h.warm, gain: 3.0, style: 0 },
    // (smeared as a camera this fast smears: a gate or a light every couple of metres strobes backward without it)
    // (a whole frame's smear was too much: the hotel's carpet and doors were gone)
    extra: <MotionBlur shutterAngle={0.6} samples={12} />,
  };
};

export const MAKES: Record<string, Make> = { canyon, garden: gardenShot, painting: paintingShot, bedroom, window: windowShot, road, harbour: harbourShot, ...Object.fromEntries(ORDER.map((id) => [id, HALLS[id] ? hallShot(id) : quick(id)])) };

/** a shot's lens at t: its dolly, leaned a little toward the cursor's work (hand3d.tsx follow); not in the montage, where
 *  the cursor is one held point. Leaned whether or not the cursor is in the frame at t: the lean comes and goes with it,
 *  never all at once */
export function placeCam(s: Shot, t: number): Cam {
  resetKeys();
  const made = MAKES[s.id](t, s.seconds);
  return lastKeys.length && !MONTAGE.some(([id]) => id === s.id) ? follow(made.cam, lastKeys, t) : made.cam;
}
export function Place({ s, t, override, still = false }: { s: Shot; t: number; /** a portal's render (v3/film.tsx): the place seen by the last world's lens, with the take's cursor where it is */ override?: { cam: Cam; hand: Out["hand"] }; /** a still to be hung as a picture (the garden's painting): no grain or vignette, which the room it hangs in gives it */ still?: boolean }) {
  const cam = override ? override.cam : placeCam(s, t);
  resetKeys();
  const made = MAKES[s.id](t, s.seconds);
  // (in a portal's render the cursor carries the least of its sphere, so it is the solid thing it is on both sides of the cut)
  const look = override?.hand && !made.look.sphere ? { ...made.look, sphere: [override.hand.pos, CURSOR_SPHERE] as [V3, number] } : made.look;
  const o = { ...made, cam, look, hand: override ? override.hand : made.hand };
  let items = fromParts(o.place, o.parts, o.rig);
  if (o.finish) items = items.map((it) => (o.finish![it.name] ?? o.finish![it.file] ? { ...it, finish: o.finish![it.name] ?? o.finish![it.file] } : it));
  return (
    <Scene items={items} cam={o.cam} focus={o.focus} sun={o.sun} env={o.env} ev={o.ev} glows={o.glows} roof={o.roof} ground={o.ground} air={o.air} look={o.look} seed={s.f0} over={o.over} bloom={o.bloom} finish={!override && !still} doorway={o.post?.(o.cam)}>
      <Hand3D hand={o.hand ?? null} cam={o.cam} ev={o.ev ?? 0} />
      {o.extra}
      {o.gust && <Dust s={o.gust.s} eye={unspot(o.cam.eye)} look={unspot(o.cam.look)} fov={o.cam.fov} sunDir={o.gust.sunDir} lux={o.gust.lux} color={o.gust.color} ev={o.ev ?? 0} />}
      <Box3D cam={o.cam} ev={o.ev ?? 0} show={!!o.pick} at={o.pick?.at ?? [0, 0, 0]} half={o.pick?.half ?? [0.1, 0.1, 0.1]} />
      {/* still water, a flat sheet. A baked moving surface was tried on 11-11 (blender/studies/harbour-water.py, studies/NOTES.md):
          under the ray-traced light it drew hard dark blotches that no wave height, body colour, roughness or sun angle removed. */}
      {o.water && <Mesh3d name="water" transform={Transform.fromXyz(0, -0.5, 0)}><Cuboid half_size={[700, 0.5, 700]} /><StandardMaterial base_color={o.water} perceptual_roughness={0.12} reflectance={0.5} /></Mesh3d>}
      {o.floor && <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[40, 0.05, 40]} /><StandardMaterial base_color="#77777a" perceptual_roughness={0.85} /></Mesh3d>}
    </Scene>
  );
}

// ---- the storm at sea (blender/storm.py: an ocean spectrum baked a mesh a frame, its crests white where they break,
// and the ship's ride read off the same surface). the director, 11-11: "we need hype rrealism and dynamic lighting that can
// show off the boat texture ... cut from day break to night time storm and thunder and watch the waves ramp up in
// realtime or cut on the lighting flash to a bigger storm and then a wide shot of the ship doing up a huge wave".
// "sea": the harbour's ship under way at daybreak; the cursor takes the storm's slider and drags it, and the light goes,
// the rain comes and the sea builds under the hull as it goes. "wave": cut on the lightning to the gale at night, wide,
// the ship climbing one great wave. Drawn without the ray-traced light (a moving sea blotched under it): the sky's own
// light, a sun, and the lightning.
type Ride = { frames: number; y: number[]; pitch: number[]; roll: number[]; cam: { eye: V3; vel: V3; look: V3; fov: number } };
// The sea's surface (sdk/guides/craft/bevy/water.md: the long waves are the mesh, the short ones are normals). The baked
// mesh carries the swell and the sea; this lays the wind's small waves on it as normals (trains from 3 m down to a
// hand's width, each fading as it nears a few pixels, its lost slope going into the roughness so far water glitters
// instead of shimmering), gives the water its own dark body and its 2% mirror, and makes the foam the bake marked
// (white in the vertex colours) into real foam: matte, broken up by a noise that drifts down wind, thicker where the
// crests are. The sea is told apart from the ship by a mark: its metalness is exactly SEA_MARK. How rough the bake's
// material is says how far the storm has come (0.1 calm to 0.36 gale), since a shader's own uniforms don't follow a render.
const SEA_MARK = 0.37;
const SEA_WGSL = /* wgsl */ `
const TAU: f32 = 6.2831853;
fn hh2(p: vec2<f32>) -> f32 { var q = fract(vec3<f32>(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
fn vn2(q: vec2<f32>) -> f32 { let i = floor(q); let f = fract(q); let u = f * f * (3.0 - 2.0 * f); return mix(mix(hh2(i), hh2(i + vec2<f32>(1.0, 0.0)), u.x), mix(hh2(i + vec2<f32>(0.0, 1.0)), hh2(i + vec2<f32>(1.0, 1.0)), u.x), u.y); }
fn fbm2(p: vec2<f32>) -> f32 { return 0.5 * vn2(p) + 0.25 * vn2(p * 2.03 + 11.0) + 0.125 * vn2(p * 4.01 + 23.0) + 0.0625 * vn2(p * 8.05 + 37.0); }

fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (abs((*pbr).material.metallic - ${SEA_MARK}) > 0.004) { return; }
  let storm = clamp(((*pbr).material.perceptual_roughness - 0.1) / 0.26, 0.0, 1.0);
  let p = in.world_position.xz;
  let t = globals.time;
  let fw = max(length(fwidth(p)), 1e-4);
  let vc = (*pbr).material.base_color.rgb;                 // the bake's colour: dark water, white where a crest breaks
  let mark = smoothstep(0.12, 0.6, dot(vc, vec3<f32>(0.33)));
  // the wind's small waves, as normals on the mesh's own
  var slope = vec2<f32>(0.0); var fold = 0.0; var lost = 0.0;
  let ka = mix(0.035, 0.1, storm);
  for (var i = 0; i < 12; i++) {
    let fi = f32(i);
    let len = 3.4 * pow(0.71 + 0.02 * sin(fi * 1.7), fi);
    let a = 3.14159 + (fract(sin(fi * 12.9898 + 4.1) * 43758.5453) - 0.5) * 1.5 + 0.37 * sin(fi * 2.4);
    let d = vec2<f32>(cos(a), sin(a));
    let k = TAU / len;
    let ph = k * dot(d, p) - sqrt(9.8 * k) * t + fract(len * 7.31) * TAU;
    let keep = clamp(len / (fw * 6.0) - 1.0, 0.0, 1.0);
    slope += keep * ka * cos(ph) * d;
    fold += keep * 0.55 * ka * sin(ph);
    lost += (1.0 - keep) * 0.5 * ka * ka;
  }
  // rain on the water: every hand's breadth of it is struck now and again, a ring that opens out and a white spot at its middle
  let wet = smoothstep(0.3, 0.75, storm);
  var hit = 0.0;
  if (wet > 0.01 && fw < 0.06) {
    let cs = 0.3; let cell = floor(p / cs); let r1 = hh2(cell); let r2 = hh2(cell + 31.7);
    let ph = fract(t * (1.3 + r1) + r2 * 11.0);
    let o = fract(p / cs) - 0.5 - (vec2<f32>(r1, r2) - 0.5) * 0.5; let dd = length(o);
    let ring = (1.0 - smoothstep(0.0, 0.05, abs(dd - ph * 0.45))) * (1.0 - ph);
    slope += normalize(o + 1e-5) * ring * 0.5 * wet;
    hit = (1.0 - smoothstep(0.0, 0.06, dd)) * (1.0 - smoothstep(0.0, 0.1, ph)) * wet;
  }
  let nb = normalize((*pbr).N);
  var n = normalize(nb + vec3<f32>(-slope.x, -fold, -slope.y));
  // foam: where the bake marked it, broken by a noise drawn out down wind and drifting; and, in a gale, on the small
  // waves' own crests
  let drift = vec2<f32>(t * 0.7, t * 0.15);
  let rag = fbm2(vec2<f32>(p.x * 0.55, p.y * 1.7) + drift) * 0.7 + fbm2(p * 4.3 - drift * 2.0) * 0.3;
  var foam = smoothstep(0.42, 0.62, mark * 0.9 + (rag - 0.45) * 0.85 * smoothstep(0.03, 0.3, mark));
  // (whitecaps on the small waves in a gale: by patches of the sea, never by the trains' own crests, whose crossing
  // drew a lattice of white diamonds)
  let caps = smoothstep(0.52, 0.7, fbm2(p * 0.11 + drift * 0.3)) * smoothstep(0.5, 0.72, rag);
  foam = max(foam, caps * storm * 0.6 * smoothstep(-0.2, 0.6, fold / max(ka, 1e-3)));
  let lace = smoothstep(0.35, 0.75, fbm2(p * 9.0 + drift * 3.0));     // foam is bubbles: holes in it where it thins
  foam = clamp(foam * mix(1.0, lace, 0.6) + hit * 0.8, 0.0, 1.0);
  // the water's body: nearly black, a deep green-blue by day, and where a steep crest is thin the light comes through
  // (a steep face in a gale is not black: the sky's own grey is in it, and the light through the top of a big wave is green)
  let steepf = 1.0 - clamp(nb.y, 0.0, 1.0);
  let body = mix(vec3<f32>(0.006, 0.034, 0.042), vec3<f32>(0.002, 0.007, 0.011) + vec3<f32>(0.012, 0.03, 0.032) * steepf, storm);
  let thin = clamp(vc.g - vc.r * 1.6, 0.0, 1.0) * 6.0 * (1.0 - foam);
  let water = body + vec3<f32>(0.01, 0.07, 0.06) * thin * (1.0 - 0.6 * storm);
  n = normalize(mix(n, nb, foam * 0.7));
  (*pbr).N = n;
  // foam has thickness: grey where it is thin, white only at its thickest
  (*pbr).material.base_color = vec4<f32>(mix(water, mix(vec3<f32>(0.42, 0.47, 0.5), vec3<f32>(0.82, 0.85, 0.87), smoothstep(0.35, 1.0, foam)), foam), 1.0);
  (*pbr).material.perceptual_roughness = mix(sqrt(sqrt(0.0016 * 0.0016 + lost)), 0.88, foam);
  (*pbr).material.metallic = 0.0;
  (*pbr).material.reflectance = vec3<f32>(mix(0.35, 0.3, foam));
}`;
const SEA_T = PLACE_T.sea.slide;
const FLASHES: Record<string, number[]> = { sea: [58, 59, 62, 84, 85], wave: [] };   // the frames the lightning is in
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const smoothstep01 = (x: number) => { const q = clamp01(x); return q * q * (3 - 2 * q); };
// The rock (blender/rock.py): where the man stands on it, in its own space, and where it stands in the sea
// (a scanned sea rock, Poly Haven's "mountainside", 10.5 m high: blender/crags.py crag-a. The first was a displaced
// sphere 23 m high: the director, "rock is not natural enough look for a better rock ... smaller too")
// the clouds: [x, y, z, width, height, depth, seed, how far the storm must have come for it to be there (0: from the start)]
const CRAG_AT: V3 = [0, -0.8, 0], MAN_AT: V3 = [0.206, 10.522 - 0.8 - 0.14, 0.209], MAN_SIZE = 1.25;   // (a little over life size, to read at this distance)
export function Sea({ s, t }: { s: Shot; t: number }) {
  const gale = s.id === "wave", r = (gale ? waveRide : rampRide) as Ride, f = Math.min(r.frames - 1, Math.max(0, Math.round(t * FPS)));
  const k = gale ? 1 : ease(ramp(t, SEA_T[0], SEA_T[1])), flash = FLASHES[s.id].includes(f) ? 1 : 0;
  const c = camAt(dolly([r.cam.eye[0], 3.5, r.cam.eye[2]], r.cam.look, r.cam.vel, r.cam.fov), t);     // (above the storm's crests: they reach 3 m)
  // the storm's slider hangs in the air beside him, turned to us
  const pAt: V3 = [MAN_AT[0] + 4.6, MAN_AT[1] + 1.7, MAN_AT[2] + 1], yaw0 = Math.atan2(c.eye[0] - pAt[0], c.eye[2] - pAt[2]);
  const panel: Panel = { at: pAt, w: 5.6, res: SLIDER, yaw: yaw0 };
  const sk = k, knobAt = (): V3 => onPanel(panel, sliderX(0.06 + 0.88 * sk), 95);
  const hand = gale ? null : handAt([{ t: 0.02, p: edge(1, 0.4, 10) }, { t: SEA_T[0], p: knobAt, press: true, grab: true }, { t: SEA_T[1], p: knobAt }, { t: SEA_T[1] + 0.2, p: knobAt }], t, c);
  const ev = mix(-2.5, gale ? 0.5 : 0.1, k);
  // the light: a low sun behind the rock and a little to its left, through a break in the cloud (the reference's pale
  // gold); as the storm comes on it goes greyer and lower, but never out: he is always a dark figure against it
  const sun: V3 = [-0.28, 0.24 - 0.06 * k, -0.93];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.1, far: 6000 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={ev} />
        <Bloom intensity={0.45} threshold={0.7} />
        <Shadows mapSize={8192} distance={120} firstCascade={36} cascades={3} />
        <Fog color={hex([196, 186, 150], [70, 78, 84], k)} near={mix(500, 180, k)} far={mix(5000, 1500, k)} />
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={mix(0.5, 0.26, k)} rotation={2.2} />
        {/* (the sky itself is the film's pass: marched cloud wherever the frame is empty, v3/look.tsx storm) */}
        <DirectionalLight illuminance={mix(34000, 5200, k)} color={hex([255, 222, 160], [214, 214, 196], k)} shadow_maps_enabled soft_shadow_size={2.5} transform={Transform.fromXyz(sun[0] * 200, sun[1] * 200, sun[2] * 200).lookingAt([0, 6, 0])} />
        {/* (the sky is the film's pass: volumetric cloud by the Horizon Zero Dawn method wherever the frame is empty,
            media/shaders/stay.wgsl `sky`, from evroon's bevy-volumetric-clouds) */}
        {/* the water: a GPU FFT ocean simulated as it renders (vendor/bevy_fft, mate-h's bevy_fft with raea's Sea
            component; this shot renders with the plugin build, tools/sea-plugin.sh). The slider is its wind, its
            wave height, its chop and how readily it foams, so the sea swells under the cursor. */}
        <Entity name="sea" position={[0, 0, 0]}>
          <BevyComponent type="bevy_fft::ocean::sea::Sea" value={{
            extent: 3000, dense: 180, vertices: 900, grid: 1024, tile: 256,
            wind_speed: mix(5.5, 10.5, k), wind_direction: 2.2, directional_spread: 0.25, peak_enhancement: 3.3,
            amplitude: mix(1.2, 2.9, k), choppiness: mix(0.9, 1.5, k), time_scale: 1, time: 20 + (gale ? 9 : 0) + t,
            foam_intensity: 0.9, foam_cutoff: mix(0.55, 0.82, k), foam_falloff: 0.3, foam_trail_decay: 0.955,
            color: [mix(0.012, 0.004, k), mix(0.034, 0.014, k), mix(0.04, 0.02, k)], roughness: mix(0.08, 0.16, k), reflectance: 0.5,
            fade_near: 900, fade_far: 2600, shore: [0.3, 0.2, 4.6, mix(0.9, 2.6, k)],
          }} />
        </Entity>
        {/* the rock, wet and dark, and the man on it: one of raea's people in a long coat that is a cloth simulation in the gale */}
        <Model name="crag" src={staticFile("models/sea/crag-a.glb")} position={CRAG_AT} />
        <MeshSequence name="man" src={staticFile("ocean/figure.rseq")} frame={(gale ? 70 : 0) + f} position={MAN_AT} rotation={[0, 0, 0]} scale={MAN_SIZE} color="#ffffff" roughness={0.85} metalness={0} clearcoat={0} />
        {!gale && <Panel3D name="storm" panel={panel} ev={0} bright={2.4 - 1.0 * k} show={spring(t - SEA_T[0] + 0.35) * (1 - ramp(t, SEA_T[1] + 0.12, SEA_T[1] + 0.3))}><Slider kind="storm" v={0.06 + 0.88 * sk} press={hand?.press ?? 0} /></Panel3D>}
        <Hand3D hand={hand && { ...hand, size: 1.8 }} cam={c} ev={ev} />
        <FilmLook look={{ base: 0, warm: mix(0.7, 0.1, k), sat: mix(0.9, 0.7, k), contrast: 0.7, halation: 0.7, storm: { slant: 0.22, amount: smoothstep01((k - 0.35) / 0.5), t: (gale ? 9 : 0) + t, flash, cover: 0.1 + 0.82 * k, sun } }} seed={s.f0} cam={c} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
