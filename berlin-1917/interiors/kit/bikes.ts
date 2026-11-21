// Bicycles and hand sledges in winter 1917-18 (catalogue bicycle, sledge). From June 1916 the army forbade riding for
// pleasure; that August every bicycle tyre and tube was seized for its rubber, confiscated outright after 15 January
// 1917, and riding was for work only, on a permit card (Bergedorfer Zeitung 1916-17, via the Bergedorf blog). Riders
// fitted Ersatz tyres instead: spiral steel springs round the rim (the "Spirala" and its like), wound steel strip, rope
// (Deutsches Museum's examples). So every bicycle here rides on steel.
//   bike-spring          a black roadster on spiral-spring tyres: diamond frame, swept-back bars, a sprung leather
//                        saddle, chain guard, mudguards, a carbide lamp and a bell
//   bike-strip           the same on tyres of wound steel strip, a carrier over the back wheel
//   bike-spring-leaning  the first leaning 14 degrees to its left (+x): a wall 0.52 m to that side takes its bar end
//   bike-delivery        a baker's carrier bicycle: a small front wheel under a wicker basket on a frame bracket, the
//                        trade's name (BÄCKEREI) on a board in the frame
//   sledge-child         a child's slatted sledge (Rodel) on two bent ash runners shod with iron, a pull cord
//   sledge-coal          a hand sledge with a box, two sacks of briquettes and a loose heap, for fetching coal when
//                        the carts could not deliver
// Frame: on the ground under the middle between the axles (the runners' middle), +z forward, x across, the drive
// side (the chain) on the rider's right (-x). Sizes ASSUMED from catalogues of the 1910s (28-inch wheels).
import { crossSection, type Solid } from "raea/3d";
import { ball, box, lathe, rbox, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod, sign, spoked } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
class B {
  m = new Map<MatId, Solid[]>();
  add(mat: MatId, ...s: Solid[]) { const l = this.m.get(mat) ?? []; l.push(...s); this.m.set(mat, l); return this; }
  parts(): Part[] { return [...this.m.entries()].map(([mat, s], i) => ({ mat, solid: union(...s), overlap: i > 0 })); }
}
const ring = (r0: number, r1: number, t: number, n = 12) => lathe([[r0, -t / 2], [r1, -t / 2], [r1, t / 2], [r0, t / 2]], 0, 0, 0, n);
const xAxis = (s: Solid) => s.rotate(0, 0, 90); // a lathe about y turned to an axle along x

/** A bicycle wheel of radius R at (0, R, z): rim, 32 spokes and hub in bright steel, and the Ersatz tyre. */
function wheel(b: B, R: number, z: number, tyre: "spring" | "strip") {
  const w = spoked(R - 0.02, 0.026, 32, { tyre: 0.003, felloe: 0.016, hub: 0.026, spoke: 0.0018 });
  b.add("steel-bright", w.iron.move(0, R, z), w.wood.move(0, R, z));
  if (tyre === "spring") {
    // the spiral spring: coils round the rim, each a little ring whose axis follows the rim
    const N = 54, rc = R - 0.012;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      b.add("zinc", ring(0.008, 0.012, 0.004, 6).rotate((t * 180) / Math.PI + 90 + 18, 0, 0).move(0, R + rc * Math.cos(t), z + rc * Math.sin(t)));
    }
  } else {
    // wound steel strip: a flat band on the rim, cross joints where the strip laps
    b.add("iron", xAxis(lathe([[R - 0.02, -0.015], [R, -0.012], [R, 0.012], [R - 0.02, 0.015]], 0, 0, 0, 40)).move(0, R, z));
    for (let i = 0; i < 36; i++) { const t = (i / 36) * Math.PI * 2; b.add("iron", box(0.034, 0.006, 0.01, 0, -0.003, 0).move(0, R - 0.002, 0).rotate((t * 180) / Math.PI, 0, 0).move(0, R, z)); }
  }
}
/** A mudguard over a wheel of radius R at z: a black strip from just behind the bottom round over the top. */
function guard(b: B, R: number, z: number, from: number, to: number) {
  const rg = R + 0.03, n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = from + ((to - from) * i) / n, a1 = from + ((to - from) * (i + 1)) / n;
    b.add("lacquer-black", rod([0, R + rg * Math.cos(a0), z + rg * Math.sin(a0)], [0, R + rg * Math.cos(a1), z + rg * Math.sin(a1)], 0.014));
  }
}

type Bike = { RF: number; ZF: number; tyre: "spring" | "strip"; carrier?: boolean; delivery?: boolean };
function bike(o: Bike): Part[] {
  const b = new B(), R = 0.35, ZR = -0.53, F = "lacquer-black" as MatId;
  wheel(b, R, ZR, o.tyre);
  wheel(b, o.RF, o.ZF, o.tyre);
  // the frame: seat tube, top tube, down tube, head tube; the stays to the back axle; the fork to the front
  const BB: V3 = [0, 0.29, -0.08], ST: V3 = [0, 0.84, -0.27], HT: V3 = [0, 0.86, 0.36], HB: V3 = [0, 0.7, 0.41];
  b.add(F, rod(BB, ST, 0.014), rod([0, 0.82, -0.26], [0, 0.83, 0.36], 0.013), rod(BB, [0, 0.72, 0.4], 0.016), rod(HB, HT, 0.018));
  for (const s of [-1, 1]) {
    b.add(F, rod([s * 0.02, 0.3, -0.08], [s * 0.055, R, ZR], 0.009), rod([s * 0.02, 0.8, -0.26], [s * 0.055, R, ZR], 0.008));
    const fk: V3 = [s * 0.05, o.RF, o.ZF];
    b.add(F, rod([s * 0.03, 0.68, 0.42], [s * 0.045, (0.68 + o.RF) / 2 + 0.04, (0.42 + o.ZF) / 2 + 0.02], 0.01), rod([s * 0.045, (0.68 + o.RF) / 2 + 0.04, (0.42 + o.ZF) / 2 + 0.02], fk, 0.009));
  }
  b.add(F, rod([-0.035, 0.68, 0.42], [0.035, 0.68, 0.42], 0.012));
  // the bars: the stem, swept back to cork grips; the bell
  b.add("steel-bright", rod(HT, [0, 0.98, 0.34], 0.011), rod([0, 0.98, 0.34], [0, 0.98, 0.4], 0.011));
  for (const s of [-1, 1]) {
    b.add("steel-bright", rod([0, 0.98, 0.4], [s * 0.22, 0.99, 0.33], 0.01), rod([s * 0.22, 0.99, 0.33], [s * 0.28, 0.97, 0.19], 0.01));
    b.add("wood-raw", rod([s * 0.28, 0.97, 0.19], [s * 0.3, 0.965, 0.09], 0.015));
  }
  b.add("steel-bright", lathe([[0, 0], [0.028, 0], [0.024, 0.02], [0, 0.026]], 0.12, 1.0, 0.36, 10));
  // the saddle on its post, its springs behind; the cranks, pedals, the chainring and the chain on the right, the guard
  b.add("steel-bright", rod(ST, [0, 0.9, -0.29], 0.011));
  b.add("leather", rbox(0.18, 0.05, 0.27, 0.025, 0, 0.92, -0.27), rbox(0.07, 0.04, 0.1, 0.02, 0, 0.925, -0.12));
  for (const s of [-1, 1]) b.add("steel-bright", lathe([[0.008, 0], [0.016, 0], [0.016, 0.05], [0.008, 0.05]], s * 0.06, 0.87, -0.36, 8));
  b.add("steel-bright", rod([-0.075, BB[1], BB[2]], [0.075, BB[1], BB[2]], 0.012));
  const ca = 0.6;
  for (const s of [-1, 1]) {
    const px = s * 0.09, py = BB[1] - s * 0.17 * Math.cos(ca), pz = BB[2] + s * 0.17 * Math.sin(ca);
    b.add("steel-bright", rod([s * 0.075, BB[1], BB[2]], [px, py, pz], 0.008));
    b.add("rubber", box(0.1, 0.022, 0.06, px + s * 0.05, py - 0.011, pz));
  }
  b.add("steel-bright", xAxis(ring(0.085, 0.1, 0.005, 24)).move(-0.06, BB[1], BB[2]), xAxis(ring(0.022, 0.034, 0.005, 12)).move(-0.06, R, ZR));
  b.add("iron", rod([-0.06, BB[1] + 0.1, BB[2]], [-0.06, R + 0.034, ZR], 0.004), rod([-0.06, BB[1] - 0.1, BB[2]], [-0.06, R - 0.034, ZR], 0.004));
  b.add(F, box(0.008, 0.06, 0.48, -0.075, BB[1] + 0.07, (BB[2] + ZR) / 2 + 0.02));
  // mudguards (angle 0 at the wheel's top, positive forward), the carbide lamp on the fork crown
  guard(b, R, ZR, 0.3, -1.9);
  guard(b, o.RF, o.ZF, -0.9, 1.6);
  b.add("lacquer-black", lathe([[0, 0], [0.04, 0], [0.045, 0.06], [0.035, 0.09], [0, 0.1]], 0, 0.6, 0.47, 10));
  b.add("glass-signal", lathe([[0, 0], [0.035, 0], [0, 0.01]], 0, 0, 0, 10).rotate(90, 0, 0).move(0, 0.65, 0.515));
  if (o.carrier) {
    b.add("steel-bright", ...[-0.07, -0.03, 0.01, 0.05, 0.09].map((x) => rod([x - 0.02, 0.72, -0.85], [x - 0.02, 0.72, -0.35], 0.006)), rod([-0.09, 0.72, -0.35], [0.07, 0.72, -0.35], 0.006));
    for (const s of [-1, 1]) b.add("steel-bright", rod([s * 0.06, 0.72, -0.75], [s * 0.055, R, ZR], 0.006));
  }
  if (o.delivery) {
    // the basket on its bracket over the small wheel; the board in the frame with the trade's name on both faces
    b.add("steel-bright", rod(HB, [0, 0.62, 0.6], 0.012), rod([-0.2, 0.62, 0.42], [0.2, 0.62, 0.42], 0.01), rod([-0.2, 0.62, 0.9], [0.2, 0.62, 0.9], 0.01));
    const wick: Solid[] = [box(0.5, 0.03, 0.55, 0, 0.62, 0.66)];
    for (const s of [-1, 1]) wick.push(box(0.02, 0.32, 0.55, s * 0.25, 0.62, 0.66), box(0.5, 0.32, 0.02, 0, 0.62, 0.66 + s * 0.275));
    for (let k = 0; k < 4; k++) wick.push(box(0.54, 0.018, 0.59, 0, 0.66 + k * 0.08, 0.66).minus(box(0.48, 0.1, 0.53, 0, 0.6 + k * 0.08, 0.66)));
    b.add("jute", ...wick);
    b.add("paint-brown", box(0.008, 0.16, 0.4, 0, 0.55, 0.12));
    for (const s of [-1, 1]) b.add("flag-white", sign("BÄCKEREI", 0.055, 0.002).rotate(0, s * 90, 0).move(s * 0.005, 0.63, 0.12));
  }
  return b.parts();
}

function sledge(coal: boolean): Part[] {
  const b = new B(), L = coal ? 1.3 : 1.0, half = coal ? 0.27 : 0.19, H = coal ? 0.3 : 0.28;
  // the runners: bent ash, their horns curled up at the front, shod in iron underneath
  const u0 = -L / 2, u1 = L / 2;
  const prof: [number, number][] = [[u0, 0], [u1 - 0.16, 0], [u1 - 0.06, 0.04], [u1, 0.12], [u1, H + 0.02], [u1 - 0.05, H + 0.02], [u1 - 0.05, 0.13], [u1 - 0.1, 0.07], [u1 - 0.17, 0.05], [u0, 0.05]];
  for (const s of [-1, 1]) {
    b.add("wood-raw", crossSection.polygon(prof).extrude(0.035).rotate(0, -90, 0).move(s * half + 0.0175, 0, 0));
    b.add("iron", box(0.03, 0.006, L - 0.16, s * half, -0.003, -0.08));
    for (const z of [u0 + 0.1, 0, u1 - 0.25]) b.add("wood-raw", box(0.035, H - 0.05, 0.035, s * half, 0.05, z));
  }
  for (const z of [u0 + 0.1, u1 - 0.25]) b.add("wood-raw", box(2 * half + 0.03, 0.03, 0.04, 0, H - 0.04, z));
  b.add("wood-raw", rod([-half, H, u1 - 0.04], [half, H, u1 - 0.04], 0.015));
  if (!coal) {
    for (let i = 0; i < 5; i++) b.add("wood-raw", box(0.055, 0.02, L - 0.3, -half + 0.05 + i * ((2 * half - 0.1) / 4), H - 0.01, -0.08));
    b.add("jute", rod([-0.08, H, u1 - 0.04], [0, 0.02, u1 + 0.35], 0.006), rod([0.08, H, u1 - 0.04], [0, 0.02, u1 + 0.35], 0.006), rod([0, 0.02, u1 + 0.35], [0.15, 0.01, u1 + 0.7], 0.006));
  } else {
    // the box, two sacks of briquettes, a loose heap at the back, the pull rope's loop
    b.add("wood-grey", box(2 * half + 0.04, 0.02, L - 0.35, 0, H - 0.02, -0.08));
    for (const s of [-1, 1]) b.add("wood-grey", box(0.02, 0.22, L - 0.35, s * (half + 0.01), H, -0.08), box(2 * half + 0.04, 0.22, 0.02, 0, H, -0.08 + s * (L - 0.35) / 2));
    b.add("jute", rbox(0.42, 0.3, 0.32, 0.1, 0, H + 0.02, 0.15).rotate(0, 8, 0), rbox(0.4, 0.28, 0.3, 0.1, 0, H + 0.02, -0.18).rotate(0, -6, 0), ball(0.06).scale(1.2, 0.6, 1).move(0.02, H + 0.32, 0.15));
    for (let i = 0; i < 9; i++) b.add("briquette", box(0.07, 0.035, 0.05).rotate(0, i * 37, i * 11).move(-0.15 + (i % 3) * 0.12, H + 0.03 + Math.floor(i / 3) * 0.03, -0.42 + Math.floor(i / 3) * 0.02));
    b.add("jute", rod([-0.1, H, u1 - 0.04], [0, 0.6, u1 + 0.45], 0.008), rod([0.1, H, u1 - 0.04], [0, 0.6, u1 + 0.45], 0.008));
  }
  return b.parts();
}

const lean = (parts: Part[]): Part[] => parts.map((p) => ({ ...p, solid: p.solid.rotate(0, 0, 14) }));
const P = (id: string, items: string[], size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items, size, place: "floor", where: "set", tris, parts: f });
P("bike-spring", ["bicycle"], [0.62, 1.05, 1.85], 22000, () => bike({ RF: 0.35, ZF: 0.55, tyre: "spring" }));
P("bike-strip", ["bicycle"], [0.62, 1.05, 2.0], 22000, () => bike({ RF: 0.35, ZF: 0.55, tyre: "strip", carrier: true }));
P("bike-spring-leaning", ["bicycle"], [1.1, 1.05, 1.85], 22000, () => lean(bike({ RF: 0.35, ZF: 0.55, tyre: "spring" })));
P("bike-delivery", ["bicycle"], [0.62, 1.05, 1.85], 26000, () => bike({ RF: 0.25, ZF: 0.6, tyre: "spring", delivery: true }));
P("sledge-child", ["sledge"], [0.45, 0.32, 1.8], 3000, () => sledge(false));
P("sledge-coal", ["sledge"], [0.62, 0.95, 1.8], 5000, () => sledge(true));

export const KIT_BIKES = true;
