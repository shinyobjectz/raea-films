// The cathedral (the shot "dining", 4.2 s), the sixth door's world. the director, 11-11: "i like revampped cathedral and kelp".
// The cottage's door opens on a cathedral's nave at the blue hour, dark but for the last of the day in its glass. We come
// in at the back of the pews and go down the middle aisle toward the choir screen, a wall of carved stone across the nave
// with one pointed door in it. A candle stands at every pew's end and on iron stands on to the screen, all of them out.
// The cursor touches the wick of one, and it takes; and the flame runs on from it down both sides of the aisle, candle to
// candle, to the screen, and up and along the row of candles on the screen's ledge, and the nave is warm. The cursor takes
// the door's ring and pushes, and it swings in on the next world (the painting, v3/oil.tsx), whose sun comes in through it.
// The set is the cathedral's (sets/cathedral.tsx, blender/components/cathedral), moved so the screen's door stands on the
// take's door line; the screen, its door and the candles are blender/components/nave. It is ray traced (v3/scene.tsx), so
// the candles are what light it: each flame is a small glowing body at its wick, and its picture a flame (v3/fire.tsx).
import { BAYS, CATHEDRAL, F } from "../sets/cathedral";
import { RZ } from "../sets/rooms";
import { clamp01, ramp, type V3 } from "../v2/math";
import SCREEN_JSON from "../media/models/nave/screen.glb.json";
import DOOR_JSON from "../media/models/nave/door.glb.json";
import PEW_JSON from "../media/models/nave/pew-candle.glb.json";
import STAND_JSON from "../media/models/nave/candle-stand.glb.json";
import { Flame } from "./fire";
import { BAY_Z, NaveSun } from "./nave-light";
import { Hand3D, at, front, type Key } from "./hand3d";
import { Doorway, goOut, shotOf, viewOf, type View } from "./kit";
import { TAKE_KEYS } from "./takekeys";
import type { Look } from "./look";
import type { Shot } from "./plan";
import { Scene, fromParts, type Item } from "./scene";
import { LinearRgba } from "raea/color";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { DOOR_HOLD, ROOM_T } from "./times";

const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
const notes = <T,>(j: unknown) => JSON.parse((j as { notes: string }).notes) as T;
const NEXT = "cellar";                                                 // (the painting)
/** the set's z plus this is the world's: the screen across the nave at its fourth pier line (the set's z -4.5) is on the
 *  take's door line, -RZ */
const DZ = -RZ + 4.5;
const inWorld = (p: V3): V3 => [p[0], p[1], p[2] + DZ];
/** the screen's frame (Blender's: x across, y back from its front, z up; origin the door's threshold mid-wall) into the world's */
const SCR = (p: number[]): V3 => [p[0], F + p[2], -RZ - p[1]];
const SCREEN = notes<{ opening: { half_width: number; spring: number; apex: number; back: number }; wicks: number[][] }>(SCREEN_JSON);
const DOOR = notes<{ ring: number[]; open_deg: number }>(DOOR_JSON);
const PEW_WICK = notes<{ wick: number[] }>(PEW_JSON).wick, STAND_WICK = notes<{ wick: number[] }>(STAND_JSON).wick;
/** the door hangs on the screen's back face, its hinge at the opening's left, a little out past it */
const HINGE = SCR([-(SCREEN.opening.half_width + 0.04), SCREEN.opening.back, 0]);

// ---- the set ------------------------------------------------------------------------------------------------------------
// (what the cathedral has that this world doesn't: the false shaft of the rose window's light, the font behind the lens,
// the chancel's furniture, which the screen hides, the motes, which read as specks out of a shaft of light, and the
// votive stand and the censer, which stood where the screen's candles now lead)
const LEFT_OUT = ["light-shaft", "font", "door", "statue", "lectern", "altar", "altar-cross", "altar-candlestick", "dust", "votive-stand", "thurible"];
const PEW_Z = [1.6, 2.55, 3.5, 4.45, 5.4, 6.35, 7.3, 8.25].map((z) => z + DZ);  // (sets/cathedral.tsx PEWS)
const PEW_END = 1.5 - 1.802 / 2;                                        // the pews' aisle ends (their length, media/models/cathedral/pew.glb.json)
/** the pew candles' wicks off the middle line (each holder on its pew's end, its wick out from it toward the aisle) */
const PEW_WICK_X = PEW_END + PEW_WICK[1];
/** the stands ([x, z] of the right-hand one of each pair): on down the aisle from the front pews in line with the pew
 *  candles, and the last pair close in to the screen either side of its door, outside the hood mould, so their light
 *  pools on the carving round the doorway and falls away up the wall (stood out in the nave, they lit it all evenly; a
 *  third pair in the aisle stood in front of them as the lens came up to the door) */
const STANDS: [number, number][] = [[PEW_WICK_X, 1.75], [PEW_WICK_X, 0.55], [1.08, -2.5]];

// the director, 11-11, on the boom (the song's one kick in the bar at 24.52 s): "a slight need for more dramtic lighting or
// better raytracing in the church its when the big booming bass happens so i assume that means we need something
// extraordinary to happen or to break the modld". So the flame the cursor lights only creeps to the candle across the
// aisle, and on the boom the whole nave takes fire at once: a rush of flame down every row to the screen and along its
// ledge, each one bursting up past itself and settling, and the windows answer it, the dusk's cold blue in the glass
// going to a sunset's amber bay by bay as the rush passes: the sun out under the cloud, in through them (v3/nave-light.tsx).
type Candle = { name: string; wick: V3; lit: number; burst: number };
const CREEP = 2.2;                                                      // metres a second the cursor's flame creeps before the boom
const RUSH = 22;                                                        // and the boom's rush down the nave
/** when the rush reaches a point `z` along the nave (from the first candle) */
const rushAt = (boom: number, z: number) => boom + Math.abs(z - FIRST[2]) / RUSH;
/** every candle, and when it takes: the one the cursor lights and those its flame creeps to before the boom, then on the
 *  boom the rest, both ways along the rows (crossing the aisle as it goes), then from the last stands up to the screen's
 *  ledge and out along it. `burst`: how far past itself it flares as it takes (the rush's flare harder) */
function candles(click: number, boom: number): Candle[] {
  const out: Candle[] = [];
  const row = (z: number) => Math.abs(z - FIRST[2]);
  const when = (z: number, across: number, seed: number) => {
    const crept = click + row(z) / CREEP + across;
    return crept < boom ? { lit: crept, burst: 0.55 } : { lit: rushAt(boom, z) + across * 0.4 + 0.012 * seed, burst: 1.25 };
  };
  for (const [i, z] of PEW_Z.entries()) for (const sx of [1, -1]) {
    out.push({ name: `pew-candle-${i}-${sx > 0 ? "r" : "l"}`, wick: [sx * PEW_WICK_X, F + PEW_WICK[2], z], ...when(z, sx > 0 ? 0 : 0.07, (i * 7 + (sx > 0 ? 0 : 3)) % 5) });
  }
  for (const [i, [x, z]] of STANDS.entries()) for (const sx of [1, -1]) {
    out.push({ name: `stand-${i}-${sx > 0 ? "r" : "l"}`, wick: [sx * x, F + STAND_WICK[2], z], ...when(z, sx > 0 ? 0.02 : 0.05, i) });
  }
  const last = Math.max(...out.map((c) => c.lit));
  for (const [i, w] of SCREEN.wicks.entries()) {
    const k = Math.round((Math.abs(w[0]) - 1.3) / 0.32);              // (0 the inner one, beside the gable, to 3 at the pier)
    out.push({ name: `ledge-${i}`, wick: SCR(w), lit: last + 0.05 + 0.035 * k + (w[0] < 0 ? 0.015 : 0), burst: 1.25 });
  }
  return out;
}
/** the first candle, the one the cursor lights: at the right-hand end of the second pew from the front */
const FIRST: V3 = [PEW_WICK_X, F + PEW_WICK[2], PEW_Z[1]];

const SET: Item[] = [
  // (the rose window's lit glass, but the dusk's: a cold, dim jewel over the screen, not the noon sun it is made for)
  ...fromParts("cathedral", CATHEDRAL.filter((p) => !LEFT_OUT.includes(p.file)), { "rose-window": { clip: "light", t: 1 } }).map((it) => ({
    ...it, at: inWorld(it.at), ...(it.file === "rose-window" ? { finish: [{ material: "rose_glass_lit", emissive: "#b4c3ff", emissiveIntensity: 220 }] } : {}),
  })),
  // the choir screen across the nave, its ends in the piers' shafts (blender/components/nave/screen.py)
  { place: "nave", file: "screen", name: "screen", at: [0, F, -RZ], yaw: 0, overlap: true },
  // a candle on every pew's aisle end, hooked over it (nave/pew-candle), and the stands on to the screen (nave/candle-stand)
  ...PEW_Z.flatMap((z, i) => [1, -1].map((sx): Item => ({ place: "nave", file: "pew-candle", name: `pew-holder-${i}-${sx > 0 ? "r" : "l"}`, at: [sx * PEW_END, F, z], yaw: (-sx * Math.PI) / 2, overlap: true }))),
  ...STANDS.flatMap(([x, z], i) => [1, -1].map((sx): Item => ({ place: "nave", file: "candle-stand", name: `stand-holder-${i}-${sx > 0 ? "r" : "l"}`, at: [sx * x, F, z], yaw: 0 }))),
];

// ---- the keys -----------------------------------------------------------------------------------------------------
/** the door's ring, the leaf `open` (0..1 of its swing, in, away from the lens) */
const RING = (open: number): V3 => {
  const a = ((DOOR.open_deg * Math.PI) / 180) * open, [rx, ry, rz] = DOOR.ring;
  const x = rx * Math.cos(a) - ry * Math.sin(a), y = rx * Math.sin(a) + ry * Math.cos(a);
  return [HINGE[0] + x, F + rz, HINGE[2] - y];
};
const openAt = (T: { door: number }, t: number, L: number) => jerk(ramp(t, T.door + 0.03, L - 0.06));
function naveKeys(s: Shot, t: number) {
  const T = ROOM_T.dining as { click: number; boom: number; door: number };
  const L = s.seconds;
  const open = openAt(T, t, L);
  const keys: Key[] = [
    { t: T.click, p: at([FIRST[0], FIRST[1] + 0.015, FIRST[2] + 0.01]), click: true, seen: "touch the first candle's wick, and it takes", margin: 0.08 },
    { t: T.door, p: front(() => RING(0), 0.03), press: true, seen: "take the door's ring and push" },
    { t: T.door + DOOR_HOLD, p: front(() => RING(open), 0.03) },
    ...goOut(L),
  ];
  return { T, L, open, keys };
}
TAKE_KEYS.dining = (t: number) => naveKeys(shotOf("dining"), t).keys;
export const naveView = (s: Shot, t: number): View => viewOf(s, t);

// ---- the flames ---------------------------------------------------------------------------------------------------
/** how much flame a candle has `dt` seconds after it takes: it catches small, flares up past itself (by `burst`) and settles */
const flameOf = (dt: number, burst = 0.55) => (dt <= 0 ? 0 : jerk(dt / 0.07) * (1 + burst * Math.exp(-dt * (burst > 1 ? 5 : 9)) * Math.min(1, dt / 0.04)));
const LUM = 6.0e6;                                                      // a flame's glowing body at full flame
const FLAME_H = 0.07;
const DUSK = 12000;                                                     // the clerestory's cold light, each bay

export function NaveWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, open } = naveKeys(s, t);
  const { hand, cam: c } = v;
  const abs = s.from + t;
  // the boom: how warm the glass is at z along the nave (the rush passes it), and its flash in the lens (a breath of
  // exposure and halation as the nave takes fire, gone in half a second)
  const warmAt = (z: number) => jerk(ramp(t, rushAt(T.boom, z) - 0.04, rushAt(T.boom, z) + 0.4));
  const hit = t >= T.boom ? Math.exp(-(t - T.boom) * 4) : 0;
  const ev = 1.6 + 0.15 * hit;
  const look: Look = { base: 0, warm: 0.12 + 0.1 * warmAt(-RZ), sat: 1.0, contrast: 0.62, halation: 0.6 + 0.8 * hit, vignette: 0.3 };
  const items: Item[] = [
    // (the glass holds the last of the day: a cold blue, dim, so the candles are what light the nave)
    // (the screen's stone darker than it was made, and the wax older: in the candles' light at its tint the screen read as
    // a plastered wall, lit all over by its own bounce; darker, the light falls off it from each flame)
    ...SET.map((it) => (/arcade-bay|aisle-wall/.test(it.file) ? { ...it, finish: [{ material: "cathedral_grisaille", emissive: "#4a6db8", emissiveIntensity: 2400 }] }
      : it.file === "screen" ? { ...it, finish: [{ material: "nave_dressed", color: "#a89c88" }, { material: "nave_wax", color: "#cbb592" }] }
      : /pew-candle|candle-stand/.test(it.file) ? { ...it, finish: [{ material: "nave_wax", color: "#cbb592" }] } : it)),
    { place: "nave", file: "door", name: "door", at: HINGE, yaw: 0, clip: "open", t: open },
  ];
  const all = candles(T.click, T.boom);
  // (as the candles come up the eye leaves the dusk: the cold light from the glass goes to under half, so the warm nave
  // doesn't go grey with it)
  const lastLit = Math.max(...all.map((cd) => cd.lit));
  const duskK = Math.sqrt(1 - 0.85 * jerk(ramp(t, T.click, lastLit + 0.3)));
  // Each flame's glowing body: there from the first frame at its one brightness, and as big as the flame is (a render
  // keeps every body it has made: one made anew for each brightness piles up, and lit the nave before its first candle).
  // Its light goes with its surface, so it is scaled by the root of the flame. Out, it is a speck.
  // The ledge's candles light least: the screen's top falls away into the dark over the warm floor and doorway, as a
  // wall does whose light is low (their light at a third, by their bodies' area); the door's two are the brightest.
  const bodies = all.map((cd) => ({ name: `${cd.name}-body`, at: [cd.wick[0], cd.wick[1] + 0.018, cd.wick[2]] as V3, s: Math.max(1e-3, (cd.name.startsWith("ledge") ? 0.58 : cd.name.startsWith(`stand-${STANDS.length - 1}`) ? 1.35 : 1) * Math.sqrt(Math.min(2.3, flameOf(t - cd.lit, cd.burst)))) }));
  // the next world's sun, coming in through the door as it opens: a warm glow far enough behind the doorway that its
  // picture covers it (v3/kit.tsx Doorway), whose light falls through onto the nave's floor
  const sunIn = Math.max(1e-3, jerk(ramp(open, 0.02, 0.7)));
  const op = SCREEN.opening;
  const center: V3 = [0, F + op.apex / 2, HINGE[2]], half: [number, number] = [op.half_width, op.apex / 2];
  return (
    <Scene items={items} cam={c} env={{ src: "qwantani_moonrise_puresky", intensity: 0.0, rotation: 1.0 }} sun={{ lux: 0, from: [-20, 30, 10] }} ev={ev} look={look} seed={s.f0} finish={!v.portal}
      doorway={<Doorway next={NEXT} abs={abs} cam={c} center={center} half={half} arch="pointed" behind={1.45} open={open > 0.001 ? 1 : 0} />}>
      <Hand3D hand={hand} cam={c} ev={ev} />
      {all.map((cd, i) => {
        const k = flameOf(t - cd.lit, cd.burst);
        // (it catches as a small red tongue and grows to itself: the flame's gutter run backward; the rush's leap up tall)
        return <Flame key={cd.name} name={cd.name} at={cd.wick} h={FLAME_H} cam={c} t={abs} gain={2.2 * Math.min(2.0, k)} gutter={1 - Math.min(1, k)} seed={i * 1.7} halo={0.35 + 0.25 * Math.max(0, k - 1)} />;
      })}
      {bodies.map((b) => (
        <Mesh3d key={b.name} name={b.name} castShadow={false} {...({ allowOverlap: true } as object)} transform={Transform.fromXyz(...b.at).withScale([b.s, b.s, b.s])}>
          <Cuboid half_size={[0.005, 0.011, 0.005]} /><StandardMaterial base_color="#000000" emissive={new LinearRgba(LUM, LUM * 0.56, LUM * 0.22, 1)} />
        </Mesh3d>
      ))}
      {/* the last of the day through the clerestory on the left: a cold panel in each bay under its lancets, out of the
          frame, its light falling across the nave between the piers (the glass's own glow, a picture, lights nothing) */}
      {BAYS.map((z, i) => (
        <Mesh3d key={`dusk-${i}`} name={`dusk-${i}`} castShadow={false} {...({ allowOverlap: true } as object)} transform={Transform.fromXyz(-2.2, 9.0, z + DZ).withScale([1, duskK, duskK])}>
          <Cuboid half_size={[0.02, 0.8, 1.5]} /><StandardMaterial base_color="#000000" emissive={new LinearRgba(DUSK * 0.5, DUSK * 0.66, DUSK, 1)} />
        </Mesh3d>
      ))}
      {/* on the boom the sun comes out and pours in through the windows, bay by bay as the rush passes (v3/nave-light.tsx) */}
      <NaveSun cam={c} t={abs} on={jerk(ramp(t, T.boom - 0.02, T.boom + 0.3))} bays={BAY_Z.map((z) => warmAt(z))} />
      <Mesh3d name="next-sun" castShadow={false} {...({ allowOverlap: true } as object)} transform={Transform.fromXyz(0.4, F + 2.0, HINGE[2] - 2.4).withScale([sunIn, sunIn, 1])}>
        <Cuboid half_size={[1.6, 2.0, 0.01]} /><StandardMaterial base_color="#000000" emissive={new LinearRgba(1600, 1250, 830, 1)} />
      </Mesh3d>
      {/* (no portal card in the opening: the leaf swings in behind it, and the doorway's picture keeps it) */}
    </Scene>
  );
}
