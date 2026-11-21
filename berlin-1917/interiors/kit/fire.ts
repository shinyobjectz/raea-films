// Berlin's fire brigade in winter 1917-18 (catalogue fire-engine). By 1914 twelve of its fire trains ran on electric
// chassis: Daimler's, with Lohner-Porsche hub motors in the front wheels and the battery over the front axle (Berliner
// Feuerwehr, Chronik 1851-2026). A train was a gas-pressure engine, an equipment wagon, a steam pump and a turntable
// ladder; the outer stations kept horses until 1922. The war stopped new vehicles, so 1917's are the pre-war ones.
// Engines were red until 1940.
//   fire-steam    the electric steam pump: the electric fore-carriage (battery box, driver's bench, hub-motor wheels)
//                 drawing a coal-fired steam pump (Busch's of 1904 measured 4.75 x 1.67 x 2.5 m): the upright boiler
//                 at the back with its chimney, brass bands and the stoker's step, the pump with its two cylinders,
//                 flywheel and brass air vessel ahead of it, the hard suction hoses along the sides
//   fire-ladder   the 25 m steel telescopic turntable ladder (Schapler's, its sections pushed out by carbon dioxide)
//                 on the same front: four sections packed forward over the driver onto a crutch, the turntable and
//                 its A-frame over the rear axle, the CO2 bottles, a bench down the middle for the crew facing out,
//                 the screw jacks stowed at the back
// Each has a worn twin (paint faded, leather rubbed). Shapes ASSUMED from photographs (Berliner Feuerwehr
// Bildarchiv as reproduced on its site); no drawings were measured. Frame as the other vehicles (kit/vehicles.ts):
// origin on the ground under the middle between the axles, +z forward, the driver on the right (-x).
import type { Solid } from "raea/3d";
import { ball, box, lathe, post, rbox, rodX, taper, type V3 } from "./geo";
import type { MatId } from "./mats";
import { muddy, rod, spoked, splashMask } from "./outgeo";
import { prop } from "./prop";
import { Build, HITCH, WHEELS } from "./vehicles";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };

/** A ring of radius r about the y axis, t thick, at y (a band, a collar). */
const band = (r0: number, r1: number, t: number, x: number, y: number, z: number, n = 16) => lathe([[r0, -t / 2], [r1, -t / 2], [r1, t / 2], [r0, t / 2]], x, y, z, n);

/** A wheel on a solid rubber tyre at (x, R, z), its axis along x; `motor` fills the hub with a hub motor's drum. */
function wheel(b: Build, id: string, red: MatId, R: number, x: number, z: number, motor: boolean) {
  const wh = spoked(R, 0.1, 12, { tyre: 0.05, felloe: 0.05, hub: motor ? 0.2 : 0.08, spoke: 0.02 });
  b.add("rubber", wh.iron.move(x, R, z));
  b.add(red, wh.wood.move(x, R, z));
  if (motor) {
    const s = Math.sign(x);
    b.add("iron", lathe([[0, -0.13], [0.22, -0.13], [0.24, -0.1], [0.24, 0.1], [0.22, 0.13], [0, 0.13]], 0, 0, 0, 16).rotate(0, 0, 90).move(x, R, z));
    b.add("brass", lathe([[0, 0], [0.07, 0], [0.06, 0.04], [0, 0.05]], 0, 0, 0, 10).rotate(0, 0, s > 0 ? -90 : 90).move(x + s * 0.13, R, z));
  }
  (WHEELS[id] ??= []).push({ at: [x, R, z], r: R });
}

/** The electric fore-carriage: the hub-motor wheels at ZF (radius R, track T), the battery box over them with its
 *  cables down to the motors, the driver's bench on it with the steering column, two lamps and the bell. */
function elecFront(b: Build, id: string, red: MatId, ZF: number, R: number, T: number) {
  for (const s of [-1, 1]) wheel(b, id, red, R, s * T / 2, ZF, true);
  b.add("iron", box(T - 0.3, 0.08, 0.1, 0, R - 0.04, ZF)); // the axle beam
  const BW = 1.25, BH = 0.72, BL = 1.15, BY = R + 0.05;
  b.add(red, box(BW, BH, BL, 0, BY, ZF), box(BW + 0.06, 0.04, BL + 0.06, 0, BY + BH, ZF));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) b.add("iron", box(0.01, 0.035, BL - 0.3, s * (BW / 2 + 0.004), BY + 0.15 + i * 0.08, ZF)); // the louvres
    b.add("rubber", rod([s * 0.5, BY + 0.1, ZF + 0.2], [s * (T / 2 - 0.2), R, ZF + 0.05], 0.018)); // the cable to the motor
    b.add("iron", box(0.12, 0.03, 0.03, s * 0.35, BY + BH + 0.04, ZF + 0.45)); // the lid's handles
  }
  // the driver's bench on the box, its backrest and side rails, the sloping footboard before it
  const SY = BY + BH + 0.3, SZ = ZF - 0.3;
  b.add(red, box(BW, 0.3, 0.5, 0, BY + BH, SZ));
  b.add("leather", rbox(BW - 0.08, 0.09, 0.46, 0.03, 0, SY, SZ), rbox(BW - 0.08, 0.4, 0.08, 0.03, 0, SY + 0.1, SZ - 0.27));
  for (const s of [-1, 1]) b.add("iron", rod([s * BW / 2, SY + 0.05, SZ - 0.3], [s * BW / 2, SY + 0.35, SZ - 0.3], 0.012), rod([s * BW / 2, SY + 0.3, SZ - 0.3], [s * BW / 2, SY + 0.3, SZ + 0.2], 0.012));
  b.add("wood-grey", box(BW - 0.1, 0.24, 0.03).rotate(-20, 0, 0).move(0, BY + BH + 0.04, ZF + 0.52)); // the toe board, leaning back to the driver
  // the steering column up from the box's front to the wheel before the driver
  b.add("iron", rod([-0.32, BY + BH, ZF + 0.42], [-0.32, SY + 0.45, SZ + 0.42], 0.022));
  b.add("iron", band(0.17, 0.19, 0.024, 0, 0, 0).rotate(-30, 0, 0).move(-0.32, SY + 0.47, SZ + 0.4));
  // two lamps on the box's front corners, the alarm bell on its bracket by the driver's knee
  for (const s of [-1, 1]) {
    const lx = s * (BW / 2 - 0.05), ly = BY + BH - 0.05, lz = ZF + BL / 2 + 0.08;
    b.add("iron", lathe([[0, 0], [0.09, 0], [0.1, 0.16], [0.08, 0.18], [0, 0.18]], 0, 0, 0, 12).rotate(90, 0, 0).move(lx, ly, lz - 0.1));
    b.add("glass-signal", lathe([[0, 0], [0.085, 0], [0, 0.015]], 0, 0, 0, 12).rotate(90, 0, 0).move(lx, ly, lz + 0.08));
  }
  b.add("iron", rod([-(BW / 2), BY + BH - 0.1, ZF + 0.3], [-(BW / 2 + 0.12), BY + BH - 0.05, ZF + 0.3], 0.015));
  b.add("brass", lathe([[0, 0], [0.11, 0], [0.1, 0.03], [0.07, 0.1], [0.05, 0.16], [0, 0.18]], -(BW / 2 + 0.14), BY + BH - 0.25, ZF + 0.3, 16));
  HITCH[id] = { ...HITCH[id], seat: [-0.3, SY + 0.09, SZ], footboard: [-0.3, BY + BH + 0.1, ZF + 0.3] };
}

/** A hard suction hose lying along z from z0 to z1 at (x, y): black rubber with iron bands, a brass coupling at each end. */
function suction(b: Build, x: number, y: number, z0: number, z1: number) {
  b.add("rubber", rod([x, y, z0], [x, y, z1], 0.055));
  for (let z = z0 + 0.15; z < z1 - 0.1; z += 0.22) b.add("iron", band(0.05, 0.062, 0.025, 0, 0, 0, 12).rotate(90, 0, 0).move(x, y, z));
  for (const z of [z0, z1]) b.add("brass", band(0.04, 0.07, 0.08, 0, 0, 0, 12).rotate(90, 0, 0).move(x, y, z));
}

function steamPump(id: string, red: MatId): Part[] {
  const b = new Build(), ZF = 1.55, ZR = -1.45, RR = 0.62, T = 1.5, FY = 0.78;
  elecFront(b, id, red, ZF, 0.5, T);
  for (const s of [-1, 1]) wheel(b, id, red, RR, s * T / 2, ZR, false);
  b.add("iron", rod([-T / 2, RR, ZR], [T / 2, RR, ZR], 0.03));
  // the frame from the fore-carriage back to the stoker's step, the springs over the rear axle, the deck, the hose box
  for (const s of [-1, 1]) {
    b.add(red, box(0.08, 0.16, 3.9, s * 0.5, FY, -0.55));
    b.add("iron", box(0.07, 0.04, 1.0, s * 0.5, RR + 0.04, ZR), box(0.07, 0.04, 0.7, s * 0.5, RR + 0.08, ZR), box(0.05, FY - RR - 0.08, 0.05, s * 0.5, RR + 0.08, ZR));
  }
  const DY = FY + 0.16;
  b.add(red, box(1.2, 0.04, 2.1, 0, DY, -1.3), box(0.9, 0.3, 1.0, 0, FY - 0.3, 0.2));
  // the boiler at the back: a riveted barrel with brass bands, its crown, the chimney with a flared top, the steam dome,
  // the whistle and the safety valve; the firebox door and the water glass on the stoker's side
  const BZ = -1.75, BY = DY + 0.04;
  b.add("iron", lathe([[0, 0], [0.42, 0], [0.42, 1.3], [0.38, 1.42], [0.2, 1.5], [0.12, 1.52], [0, 1.52]], 0, BY, BZ, 20));
  for (const y of [0.12, 0.55, 0.98, 1.28]) b.add("brass", band(0.41, 0.435, 0.05, 0, BY + y, BZ, 20));
  b.add("iron", taper(0.11, 0.09, 0.95, 0, BY + 1.5, BZ));
  b.add("brass", lathe([[0.08, 0], [0.12, 0], [0.17, 0.14], [0.17, 0.18], [0.08, 0.18]], 0, BY + 2.42, BZ, 16));
  b.add("brass", lathe([[0, 0], [0.12, 0], [0.12, 0.12], [0.08, 0.2], [0, 0.22]], 0.2, BY + 1.38, BZ + 0.12, 14));
  b.add("brass", post(0.018, 0.22, -0.2, BY + 1.42, BZ + 0.1), lathe([[0, 0], [0.035, 0], [0.035, 0.12], [0, 0.13]], -0.2, BY + 1.64, BZ + 0.1, 10));
  b.add("brass", post(0.02, 0.2, 0.05, BY + 1.48, BZ - 0.2), ball(0.035).move(0.05, BY + 1.7, BZ - 0.2));
  b.add("iron", box(0.3, 0.26, 0.04, 0, BY + 0.15, BZ - 0.43), box(0.12, 0.025, 0.04, 0.05, BY + 0.27, BZ - 0.46));
  b.add("brass", post(0.014, 0.32, 0.2, BY + 0.7, BZ - 0.41));
  b.add("glass-signal", post(0.01, 0.24, 0.2, BY + 0.74, BZ - 0.43));
  // coal boxes beside the boiler, heaped; the stoker's step behind on its irons
  for (const s of [-1, 1]) {
    b.add(red, box(0.26, 0.4, 0.62, s * 0.58, BY, BZ));
    b.add("coal", rbox(0.22, 0.12, 0.56, 0.05, s * 0.58, BY + 0.35, BZ));
  }
  b.add("wood-grey", box(1.0, 0.04, 0.38, 0, 0.5, -2.55));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.45, 0.52, -2.4], [s * 0.45, FY, -2.35], 0.018), rod([s * 0.6, BY + 0.5, -2.36], [s * 0.6, BY + 1.0, -2.36], 0.014));
  // the pump ahead of the boiler: its body, two steam cylinders with brass heads, the flywheel on the right, the air
  // vessel's brass bottle, a delivery outlet with its cap on each side
  const PZ = -0.8;
  b.add("iron", box(0.8, 0.35, 0.7, 0, BY, PZ));
  for (const s of [-1, 1]) {
    b.add(red, post(0.11, 0.55, s * 0.25, BY + 0.35, PZ - 0.2));
    b.add("brass", band(0, 0.125, 0.05, s * 0.25, BY + 0.92, PZ - 0.2), post(0.02, 0.25, s * 0.25, BY + 0.95, PZ - 0.2));
    b.add("brass", lathe([[0, 0], [0.05, 0], [0.05, 0.12], [0.065, 0.12], [0.065, 0.17], [0, 0.17]], 0, 0, 0, 12).rotate(0, 0, s > 0 ? -90 : 90).move(s * 0.4, BY + 0.15, PZ + 0.15));
  }
  const fw = spoked(0.32, 0.05, 6, { tyre: 0.035, felloe: 0.03, hub: 0.05, spoke: 0.016 });
  b.add("iron", fw.iron.move(-0.5, BY + 0.85, PZ - 0.2), fw.wood.move(-0.5, BY + 0.85, PZ - 0.2), rod([-0.5, BY + 0.85, PZ - 0.2], [-0.25, BY + 0.85, PZ - 0.2], 0.025));
  b.add("brass", lathe([[0, 0], [0.15, 0], [0.17, 0.1], [0.17, 0.45], [0.12, 0.6], [0.05, 0.66], [0.05, 0.72], [0, 0.72]], 0, BY + 0.35, PZ + 0.18, 18));
  // the hard suction hoses along both sides on hooks over the rear wheels
  for (const s of [-1, 1]) {
    suction(b, s * 0.72, DY + 0.52, -2.3, 0.55);
    for (const z of [-2.0, -0.2, 0.4]) b.add("iron", rod([s * 0.52, DY, z], [s * 0.7, DY + 0.45, z], 0.014), rod([s * 0.7, DY + 0.45, z], [s * 0.79, DY + 0.5, z], 0.012));
  }
  return b.parts();
}

function turntableLadder(id: string, red: MatId): Part[] {
  const b = new Build(), ZF = 2.0, ZR = -1.8, RR = 0.6, T = 1.55, FY = 0.78;
  elecFront(b, id, red, ZF, 0.5, T);
  for (const s of [-1, 1]) wheel(b, id, red, RR, s * T / 2, ZR, false);
  b.add("iron", rod([-T / 2, RR, ZR], [T / 2, RR, ZR], 0.03));
  for (const s of [-1, 1]) {
    b.add(red, box(0.08, 0.18, 4.4, s * 0.5, FY, -0.8));
    b.add("iron", box(0.07, 0.04, 1.0, s * 0.5, RR + 0.04, ZR), box(0.07, 0.04, 0.7, s * 0.5, RR + 0.08, ZR), box(0.05, FY - RR - 0.08, 0.05, s * 0.5, RR + 0.08, ZR));
  }
  const DY = FY + 0.18;
  b.add(red, box(1.5, 0.05, 4.2, 0, DY, -0.9));
  // the crew's bench down the middle, back to back, the men facing out over the running boards
  const CZ = 0.2, CL = 1.6;
  b.add(red, box(0.08, 0.95, CL, 0, DY, CZ));
  for (const s of [-1, 1]) {
    b.add(red, box(0.42, 0.4, CL, s * 0.25, DY, CZ));
    b.add("leather", rbox(0.4, 0.08, CL - 0.04, 0.03, s * 0.25, DY + 0.4, CZ), rbox(0.06, 0.38, CL - 0.04, 0.02, s * 0.07, DY + 0.5, CZ));
    b.add("wood-grey", box(0.25, 0.03, 2.0, s * 0.85, FY - 0.12, 0.05));
    for (const z of [-0.85, 0.05, 0.95]) b.add("iron", box(0.38, 0.025, 0.04, s * 0.7, FY - 0.14, z));
    b.add("iron", rod([s * 0.48, DY + 0.9, CZ - CL / 2], [s * 0.48, DY + 0.9, CZ + CL / 2], 0.014)); // the grab rail
  }
  // the turntable over the rear axle, the A-frame up to the ladder's pivot, the elevating handwheel, the CO2 bottles
  const TY = DY + 0.05, PY = 2.4, LY = 2.52;
  b.add("iron", lathe([[0, 0], [0.65, 0], [0.65, 0.1], [0, 0.1]], 0, TY, ZR, 28), band(0.62, 0.68, 0.04, 0, TY + 0.02, ZR, 28));
  for (const s of [-1, 1]) {
    b.add(red, rod([s * 0.42, TY + 0.1, ZR - 0.55], [s * 0.38, PY, ZR], 0.05), rod([s * 0.42, TY + 0.1, ZR + 0.55], [s * 0.38, PY, ZR], 0.05), rod([s * 0.42, TY + 0.1, ZR - 0.55], [s * 0.42, TY + 0.1, ZR + 0.55], 0.04));
    b.add("iron", lathe([[0, 0], [0.09, 0], [0.09, 0.95], [0.05, 1.05], [0.025, 1.12], [0, 1.12]], s * 0.58, TY, -0.95, 14), post(0.02, 0.06, s * 0.58, TY + 1.12, -0.95));
  }
  b.add("iron", rodX(0.045, 0.95, 0, PY, ZR));
  b.add("iron", band(0.2, 0.225, 0.03, 0, 0, 0).rotate(0, 0, 90).move(0.52, TY + 0.85, ZR + 0.25), rod([0.42, TY + 0.85, ZR + 0.25], [0.52, TY + 0.85, ZR + 0.25], 0.02));
  // the ladder packed forward: four steel sections, each nested inside the one below and higher, their rungs every
  // 0.3 m; the heavy foot on the pivot, the crutch behind the driver that it rests on
  const W = [0.72, 0.62, 0.52, 0.42], L = 6.0, Z0 = ZR - 0.6;
  W.forEach((w, i) => {
    const y = LY + i * 0.11, z0 = Z0 + i * 0.15;
    for (const s of [-1, 1]) b.add("zinc", box(0.035, 0.1, L, s * (w / 2), y, z0 + L / 2));
    for (let z = z0 + 0.2; z < z0 + L - 0.1; z += 0.3) b.add("zinc", rodX(0.013, w, 0, y + 0.05, z));
    if (i) for (const s of [-1, 1]) for (const z of [z0 + 0.3, z0 + L - 0.3]) b.add("iron", box(0.03, 0.06, 0.08, s * (w / 2 + 0.03), y - 0.05, z)); // the guide shoes on the section below
  });
  b.add(red, box(0.84, 0.16, 0.7, 0, PY - 0.06, ZR), box(0.84, 0.08, 0.2, 0, LY - 0.06, ZR + 0.4));
  const KZ = 1.15;
  for (const s of [-1, 1]) b.add(red, post(0.03, LY - DY - 0.06, s * 0.3, DY, KZ));
  b.add(red, box(0.9, 0.06, 0.12, 0, LY - 0.08, KZ));
  // the screw jacks stowed upright at the back, the tool chest across the tail
  for (const s of [-1, 1]) b.add("iron", post(0.03, 0.8, s * 0.82, 0.38, -2.75), box(0.22, 0.03, 0.22, s * 0.82, 0.35, -2.75), box(0.08, 0.06, 0.25, s * 0.68, FY + 0.05, -2.75));
  b.add(red, box(1.3, 0.35, 0.4, 0, DY, -2.75));
  return b.parts();
}

const WORN: Partial<Record<MatId, MatId>> = { "fire-red": "fire-red-worn", leather: "leather-worn" };
const FIRE: [string, string, V3, number, (id: string, red: MatId) => Part[]][] = [
  ["fire-steam", "fire-engine", [1.75, 3.2, 5.4], 45000, steamPump],
  ["fire-ladder", "fire-engine", [1.95, 3.0, 7.1], 60000, turntableLadder],
];
for (const [id, item, size, tris, f] of FIRE) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 97;
  for (const worn of [false, true]) {
    const vid = worn ? `${id}-worn` : id;
    const red: MatId = worn ? "fire-red-worn" : "fire-red";
    const parts = () => {
      const p = f(vid, red);
      const q = worn ? p.map((x) => ({ ...x, mat: WORN[x.mat] ?? x.mat })) : p;
      return muddy(q, splashMask(size[0] + 0.6, 2 * size[2], 0.25, worn ? 0.9 : 0.7, seed + (worn ? 1 : 0)), "mud-road", [red, "rubber", "iron"]);
    };
    prop({ id: vid, items: [item], size, place: "floor", where: "set", tris, parts });
  }
}

export const KIT_FIRE = true;
