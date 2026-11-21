// The motor cab (catalogue cab-motor, Kraftdroschke): Berlin had about 2,000 petrol cabs and over 500 electric ones by
// 1914 (Berliner Zeitung, 4 Mar 2011), more motor than horse cabs (Furger, "Vom Pferd zum Automobil", 2022). In the war
// petrol, oil and tyre rubber went to the army; a cab could only make trips the fare had a permit for, and the cars the
// army didn't take ran until the petrol was gone and were laid up (city-car.de, Hintergründe; planet-wissen, Taxi).
// The landaulet, its fare's seat closed in front and under a folding hood behind, was the cab's body around 1910
// (Furger); Germany's early taxis were black (de.wikipedia, Taxigewerbe in Berlin), "a simple, colourless thing" to a
// 1905 guide (Berlin und die Berliner, pp. 466-71). The taximeter at the right of the driver's seat, where the fare and
// the chauffeur both read it (Chemnitz's Rex-Simplex cabs, Landbote 28 Jul 1907).
//   The car: the Benz 8/20 PS of 1912-21, the size Benz sold Berlin's cab owners after the 10/18 (RM Sotheby's lot
//   notes; Mercedes-Benz archive, "Benz 8/20 PS Landaulet-Droschke 1914"): wheelbase 2850 mm, 4.0 m long, 1.6 m wide,
//   2.05 m high, wooden artillery wheels on pneumatic tyres (de.wikipedia, Benz 8/20 PS, after Oswald 1987). The 8/20
//   landaulet of 1912 gave the driver a windscreen, a fixed roof and doors without windows (Mercedes-Benz, on its
//   landaulets). Its look after the photographs of the 8/20 (Commons, public domain and CC BY 2.0: a flat upright
//   radiator with rounded shoulders, a straight bonnet) and of the 1909 Benz landaulet in the Mercedes-Benz Museum
//   (CC BY 2.0): the roof run forward over the driver, low doors beside him, the fare's door and quarter glazed, the
//   leather hood behind on its landau irons, a rail round the roof for luggage, the spare at the driver's side.
//   cab-motor       running: hood up for the winter, the meter's flag up (FREI), muddy from the setts
//   cab-motor-laid  laid up for want of petrol: on blocks, its tyres and spare gone to the rubber collection, the brass
//                   lamps and generator taken, the meter unshipped, a sheet over the bonnet
// ASSUMED: track 1.3 m and tyres 800 x 90; the body's heights; the meter's form (as the horse cab's); the rubber and
// brass taken from the laid-up car (the shortages are sourced, the stripping is not). The plate's number is made up.
// Frame: on the ground under the middle between the axles, +z forward, the driver's right (the steering side) -x.
import { manifold, type Solid } from "raea/3d";
import { box, rbox, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { type P2, side, slat, smooth, sweepSheet, turn, turnX, zAxis } from "./forms";
import { artilleryAt, crown, frame, frontAxle, hullAlong, lamp, NICKEL, rearAxle, wingLine } from "./carparts";
import { muddy, rod, sign, splashMask } from "./outgeo";
import { prop } from "./prop";
import { Build } from "./vehicles";

const R = 0.4, TY = 0.045, X = 0.65, ZF = 1.425, ZR = -1.425;
/** The body: its back, the hood's front, the partition behind the driver, the dash; half width, sill, waist, eaves. */
const BB = -1.95, HZ = -0.95, P = 0.15, D = 0.95, HW = 0.7, SILL = 0.7, WAIST = 1.28, EAVES = 1.93, WS = D + 0.01;
const GLASS: MatId = "glass-plate", LEA: MatId = "leather-black";

function chassis(b: Build, id: string, laid: boolean, under: MatId) {
  for (const s of [-1, 1]) for (const z of [ZF, ZR]) artilleryAt(b, id, [s * X, R, z], R, TY, under, !laid, !laid);
  frame(b, -1.9, 1.55, [-1.85, -0.6, 0.5, 1.45]);
  frontAxle(b, ZF, R, X - 0.08, [-0.38, 0.66, 1.1]);
  rearAxle(b, ZR, R, X - 0.14, [0, 0.55, 0.3], 1.1, ZR);
  b.add("zinc", box(0.38, 0.14, 0.6, 0, 0.45, 1.3), box(0.28, 0.18, 0.36, 0, 0.44, 0.55));
  b.add(under, rod([0, 0.58, 1.88], [0, 0.58, 2.0], 0.014), rod([0, 0.58, 2.0], [0.08, 0.49, 2.0], 0.012));
  b.add("iron", zAxis(turn([[0, -0.3], [0.07, -0.3], [0.08, -0.24], [0.08, 0.24], [0.07, 0.3], [0, 0.3]], 16)).move(0.26, 0.44, -0.6));
  b.add("iron", rod([0.28, 0.55, 1.2], [0.26, 0.44, -0.3], 0.02), rod([0.26, 0.44, -0.9], [0.3, 0.42, -2.0], 0.02));
  // laid up: crossed timber blocks under the axle's ends, the wheels hanging clear on their bare rims
  if (laid) for (const s of [-1, 1]) for (const [x, z, top] of [[0.42, ZF, 0.38], [0.47, ZR, 0.358]] as const) {
    b.add("wood-raw", box(0.24, top / 2, 0.16, s * x, 0, z), box(0.16, top / 2, 0.24, s * x, top / 2, z));
  }
}

/** The bonnet straight to the dash, its louvres; the flat radiator with rounded shoulders and its filler; the lamps on
 *  their brackets; the dash; the aprons down to the wings; the plate under the radiator. */
function front(b: Build, laid: boolean, paint: MatId) {
  b.add(paint, hullAlong(crown(0.3, 0.68, 0.98, 0.06), D + 0.02, crown(0.3, 0.68, 0.98, 0.06), 1.78));
  b.add(paint, rod([0, 1.04, D + 0.02], [0, 1.04, 1.78], 0.007));
  for (const s of [-1, 1]) for (let k = 0; k < 10; k++) b.add("lacquer-black-worn", box(0.01, 0.13, 0.012, s * 0.302, 0.77, 1.18 + k * 0.045));
  b.add(NICKEL, rbox(0.62, 0.52, 0.08, 0.05, 0, 0.62, 1.82).minus(box(0.52, 0.42, 0.06, 0, 0.67, 1.85)));
  b.add("enamel-black", box(0.52, 0.42, 0.02, 0, 0.67, 1.83));
  for (let k = -6; k <= 6; k++) b.add("iron", box(0.004, 0.42, 0.006, k * 0.04, 0.67, 1.842));
  b.add(NICKEL, turn([[0, 0], [0.035, 0], [0.035, 0.025], [0.024, 0.045], [0, 0.048]], 16).move(0, 1.14, 1.82));
  for (const s of [-1, 1]) {
    b.add("lacquer-black-worn", rod([s * 0.42, 0.6, 1.72], [s * 0.42, 0.88, 1.88], 0.014));
    if (!laid) lamp(b, [s * 0.42, 0.98, 1.9], 0.1, "brass");
  }
  b.add(paint, box(2 * HW, 0.6, 0.05, 0, 0.68, D));
  for (const s of [-1, 1]) {
    const ap: V3[] = [[s * 0.3, 0.68, D + 0.04], [s * 0.3, 0.68, 1.76], [s * 0.53, 0.84, D + 0.18], [s * 0.53, 0.86, 1.62]];
    b.add("lacquer-black-worn", manifold.hull([...ap, ...ap.map((p) => [p[0], p[1] - 0.006, p[2]] as V3)]));
  }
  b.add("enamel", box(0.34, 0.12, 0.006, 0, 0.5, 1.96));
  b.add("enamel-black", sign("IA 3417", 0.07).move(0, 0.56, 1.963));
  // laid up: a sheet over the bonnet and radiator, hanging past its sides
  if (laid) b.add("canvas", hullAlong(crown(0.34, 0.6, 1.0, 0.08), D + 0.04, crown(0.36, 0.56, 1.0, 0.1), 1.9));
}

/** The driver's place: the windscreen in two panes between the canopy's posts, low doors without glass, the bench
 *  against the partition, the wheel on the right, the levers outside it, the bulb horn and the side lamps on the
 *  posts; the taximeter on its bracket at his right, its face to the fare and its flag up: FREI. */
function driver(b: Build, laid: boolean, paint: MatId) {
  for (const s of [-1, 1]) b.add(paint, box(0.05, EAVES - WAIST, 0.05, s * (HW - 0.03), WAIST, WS));
  for (const [y, h] of [[WAIST, 0.04], [1.62, 0.035], [EAVES - 0.05, 0.05]]) b.add(paint, box(2 * HW - 0.06, h, 0.05, 0, y, WS));
  b.add(GLASS, box(2 * HW - 0.1, EAVES - 0.05 - WAIST - 0.04, 0.008, 0, WAIST + 0.04, WS));
  b.add("wood-grey", box(2 * HW, 0.03, D - P, 0, SILL, (D + P) / 2));
  for (const s of [-1, 1]) {
    b.add(paint, box(0.04, WAIST - SILL, D - P, s * (HW - 0.02), SILL, (D + P) / 2), box(0.06, 0.035, D - P, s * (HW - 0.02), WAIST - 0.035, (D + P) / 2));
    for (const z of [P + 0.06, P + 0.62]) b.add("lacquer-black-worn", box(0.006, WAIST - SILL - 0.06, 0.008, s * (HW + 0.002), SILL + 0.02, z));
    b.add(NICKEL, rod([s * (HW + 0.02), WAIST - 0.06, P + 0.5], [s * (HW + 0.02), WAIST - 0.06, P + 0.58], 0.008));
  }
  b.add(paint, box(2 * HW - 0.1, 0.3, 0.42, 0, SILL + 0.03, P + 0.25));
  b.add(LEA, rbox(2 * HW - 0.1, 0.1, 0.42, 0.03, 0, SILL + 0.33, P + 0.26), rbox(2 * HW - 0.1, 0.36, 0.08, 0.03, 0, SILL + 0.42, P + 0.06));
  // the wheel on its raked column, through the dash on the right
  const top: V3 = [-0.38, 1.36, D - 0.3], tilt = (-Math.atan2(0.4, 0.55) * 180) / Math.PI;
  b.add("lacquer-black-worn", rod([-0.38, 0.92, D], top, 0.02));
  b.add("wood-varnish", turn([[0.18, -0.012], [0.2, -0.012], [0.2, 0.012], [0.18, 0.012]], 28).rotate(tilt, 0, 0).move(...top));
  for (let k = 0; k < 4; k++) b.add("lacquer-black-worn", rod([0, 0, 0], [0.19 * Math.cos((k * Math.PI) / 2), 0, 0.19 * Math.sin((k * Math.PI) / 2)], 0.008).rotate(tilt, 0, 0).move(...top));
  // the hand brake and the gear lever outside on the right, on their quadrant; the bulb horn on the right post
  for (const [z, ty] of [[D - 0.3, 1.3], [D - 0.16, 1.24]]) b.add("lacquer-black-worn", rod([-(HW + 0.04), 0.72, z], [-(HW + 0.05), ty, z - 0.06], 0.013), turn([[0, -0.02], [0.022, -0.012], [0.022, 0.012], [0, 0.02]], 10).move(-(HW + 0.05), ty, z - 0.06));
  b.add(NICKEL, box(0.02, 0.16, 0.26, -(HW + 0.035), 0.74, D - 0.24));
  b.add("brass", rod([-(HW - 0.02), 1.72, WS + 0.03], [-(HW + 0.06), 1.72, WS + 0.28], 0.015), zAxis(turn([[0.015, 0], [0.05, 0.08], [0.052, 0.09], [0.015, 0.09]], 14)).move(-(HW + 0.06), 1.72, WS + 0.22));
  b.add("rubber", turn([[0, -0.04], [0.035, -0.02], [0.035, 0.02], [0, 0.04]], 12).move(-(HW - 0.02), 1.72, WS - 0.02));
  for (const s of [-1, 1]) { b.add("lacquer-black-worn", rod([s * (HW - 0.01), 1.42, WS + 0.02], [s * (HW + 0.05), 1.42, WS + 0.02], 0.01)); if (!laid) lamp(b, [s * (HW + 0.06), 1.42, WS + 0.07], 0.06, "lacquer-black"); }
  // the meter: bracket off the right post, the drum turned to the kerb and the fare, glass to the back, the flag up
  const at: V3 = [-(HW + 0.13), 1.56, WS - 0.08];
  b.add("iron", rod([-(HW - 0.02), 1.56, WS], [at[0] + 0.05, 1.56, at[2] + 0.02], 0.015));
  if (!laid) {
    const place = (s: Solid) => s.rotate(0, 25, 0).move(...at);
    b.add("iron", place(zAxis(turn([[0, -0.05], [0.12, -0.05], [0.13, -0.03], [0.13, 0.04], [0.11, 0.05], [0, 0.05]], 20))), place(turn([[0, 0], [0.05, 0], [0.04, 0.06], [0.015, 0.08], [0, 0.08]], 12).move(0, 0.11, 0)), place(rod([0.06, 0.18, 0], [0.12, 0.29, 0], 0.008)));
    b.add(GLASS, place(box(0.1, 0.06, 0.004, 0, -0.04, -0.055)));
    b.add("enamel", place(box(0.12, 0.06, 0.006, 0.17, 0.28, 0)));
    b.add("enamel-black", place(sign("FREI", 0.035).rotate(0, 180, 0).move(0.17, 0.31, -0.004)), place(sign("FREI", 0.035).move(0.17, 0.31, 0.004)));
  }
}

/** The fare's half: a panelled tub on the frame, closed and glazed in front of the door (the partition's window, a
 *  quarter light, the door's drop glass), the leather hood behind on its landau irons, the roof run forward over the
 *  driver with a rail for luggage; the seat inside; the plate and tail lamp at the back. */
function fare(b: Build, paint: MatId) {
  const cavity = box(2 * HW - 0.08, EAVES - SILL - 0.08, P - BB - 0.1, 0, SILL + 0.04, (P + BB) / 2 - 0.01);
  let shell: Solid = union(rbox(2 * HW, WAIST - SILL, P - BB, 0.05, 0, SILL, (P + BB) / 2), box(2 * HW, EAVES - WAIST, P - HZ, 0, WAIST, (P + HZ) / 2)).minus(cavity);
  const lights: [number, number, number][] = [[0.1, 0.26, P - 0.18], [0.1, 0.5, -0.56]]; // [depth, length, z] of each side light
  shell = shell.minus(box(2 * HW - 0.3, 0.42, 0.1, 0, WAIST + 0.14, P));
  for (const s of [-1, 1]) for (const [d, l, z] of lights) shell = shell.minus(box(d, 0.42, l, s * HW, WAIST + 0.14, z));
  b.add(paint, shell);
  b.add(GLASS, box(2 * HW - 0.3, 0.42, 0.006, 0, WAIST + 0.14, P - 0.02));
  for (const s of [-1, 1]) for (const [, l, z] of lights) b.add(GLASS, box(0.006, 0.42, l, s * (HW - 0.02), WAIST + 0.14, z));
  // mouldings round the waist and the door's seams, its handle; the door from -0.22 to -0.9
  b.add("lacquer-black-worn", box(2 * HW + 0.02, 0.03, P - BB + 0.02, 0, WAIST - 0.03, (P + BB) / 2));
  for (const s of [-1, 1]) {
    for (const z of [-0.22, -0.9]) b.add("lacquer-black-worn", box(0.006, EAVES - SILL - 0.1, 0.008, s * (HW + 0.002), SILL + 0.03, z));
    b.add(NICKEL, rod([s * (HW + 0.025), WAIST - 0.07, -0.8], [s * (HW + 0.025), WAIST - 0.07, -0.88], 0.008), rod([s * (HW + 0.002), WAIST - 0.07, -0.84], [s * (HW + 0.025), WAIST - 0.07, -0.84], 0.006));
  }
  // the hood: leather over its bows from the fixed roof back and down to the waist, the landau irons on its quarters
  const hood: P2[] = [[HZ, WAIST], [HZ, EAVES], [BB + 0.5, EAVES - 0.02], [BB + 0.26, EAVES - 0.08], [BB + 0.11, EAVES - 0.22], [BB + 0.03, EAVES - 0.42], [BB, WAIST + 0.2], [BB, WAIST]];
  b.add(LEA, side(hood, 2 * HW + 0.01));
  for (const z of [BB + 0.5, HZ - 0.25]) b.add("lacquer-black-worn", box(2 * HW + 0.02, 0.012, 0.03, 0, EAVES - (z < BB + 0.6 ? 0.02 : 0.005), z));
  for (const s of [-1, 1]) {
    const pts: P2[] = [[BB + 0.1, WAIST + 0.03], [BB + 0.28, WAIST + 0.06], [BB + 0.43, WAIST + 0.2], [BB + 0.53, WAIST + 0.36], [BB + 0.7, WAIST + 0.43]];
    for (let i = 0; i + 1 < pts.length; i++) b.add(NICKEL, rod([s * (HW + 0.014), pts[i][1], pts[i][0]], [s * (HW + 0.014), pts[i + 1][1], pts[i + 1][0]], 0.011));
    b.add(NICKEL, turnX([[0, 0], [0.035, 0], [0.035, 0.01], [0, 0.012]], 14).rotate(0, s < 0 ? 180 : 0, 0).move(s * (HW + 0.01), WAIST + 0.36, BB + 0.53));
  }
  // the seat across the back under the hood, seen through the glass
  b.add(LEA, rbox(2 * HW - 0.12, 0.42, 0.55, 0.04, 0, SILL + 0.04, BB + 0.38), rbox(2 * HW - 0.12, 0.5, 0.12, 0.04, 0, SILL + 0.44, BB + 0.14));
  // the roof from the hood forward over the driver, its peak and valance, the luggage rail round it
  b.add(paint, hullAlong(crown(HW + 0.02, EAVES - 0.04, EAVES, 0.05), HZ, crown(HW + 0.02, EAVES - 0.04, EAVES, 0.05), D + 0.08));
  b.add(paint, box(2 * HW, 0.06, 0.02, 0, EAVES - 0.1, D + 0.07));
  const RY = EAVES + 0.12, rz = [HZ + 0.06, -0.4, 0.15, 0.6, D];
  for (const s of [-1, 1]) for (const z of rz) b.add("lacquer-black-worn", rod([s * (HW - 0.04), EAVES + 0.03, z], [s * (HW - 0.04), RY, z], 0.009));
  for (const s of [-1, 1]) b.add("lacquer-black-worn", rod([s * (HW - 0.04), RY, HZ + 0.06], [s * (HW - 0.04), RY, D], 0.011));
  for (const z of [HZ + 0.06, D]) b.add("lacquer-black-worn", rod([-(HW - 0.04), RY, z], [HW - 0.04, RY, z], 0.011));
  // the back: the plate and its lamp, red behind
  b.add("enamel", box(0.34, 0.12, 0.006, -0.3, 0.8, BB - 0.006));
  b.add("enamel-black", sign("IA 3417", 0.07).rotate(0, 180, 0).move(-0.3, 0.86, BB - 0.009));
  b.add("lacquer-black-worn", box(0.1, 0.1, 0.07, -0.56, 0.86, BB - 0.035));
  b.add("glass-ruby", zAxis(turn([[0, -0.03], [0.032, -0.03], [0.032, -0.01], [0, 0]], 12)).move(-0.56, 0.91, BB - 0.07));
}

/** The wings over the front wheels sweeping down to the running boards, the mudguards over the back wheels, the boards
 *  between on their brackets; the spare against the driver's compartment on the left board, the lamp's acetylene
 *  generator behind it. */
function wings(b: Build, id: string, laid: boolean, under: MatId) {
  const fp = smooth([[1.95, 0.62], [1.8, 0.8], [1.6, 0.88], [1.3, 0.88], [1.08, 0.78], [0.92, 0.6], [0.8, 0.53]], 3);
  const rp: P2[] = [];
  for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.14 + (0.72 * k) / 12); rp.push([ZR + 0.47 * Math.cos(a), R + 0.47 * Math.sin(a)]); }
  for (const s of [-1, 1]) {
    b.add("lacquer-black-worn", ...sweepSheet(fp, wingLine(0.06), () => s * X, () => s * 0.13, 0.006), ...sweepSheet(rp, wingLine(0.04), () => s * X, () => s * 0.11, 0.006));
    b.add("lacquer-black-worn", box(0.24, 0.025, 1.85, s * (X + 0.03), 0.5, -0.075));
    b.add("rubber", box(0.22, 0.006, 1.8, s * (X + 0.03), 0.525, -0.075));
    for (const z of [0.6, -0.75]) b.add("lacquer-black-worn", slat([s * 0.42, 0.56, z], [s * (X + 0.1), 0.5, z], 0.03, 0.015));
  }
  if (laid) return;
  artilleryAt(b, id, [HW + 0.1, 0.53 + R, P + 0.42], R, TY, under, false);
  b.add("lacquer-black-worn", rod([HW + 0.02, WAIST - 0.04, P + 0.42], [HW + 0.1, 0.53 + 2 * R + 0.01, P + 0.42], 0.012));
  b.add("brass", turn([[0, 0], [0.07, 0], [0.07, 0.3], [0.05, 0.33], [0, 0.33]], 16).move(X + 0.03, 0.53, -0.55));
}

function cab(id: string, laid: boolean) {
  const b = new Build(), paint: MatId = laid ? "lacquer-black-worn" : "lacquer-black", under: MatId = "lacquer-black-worn";
  chassis(b, id, laid, under); front(b, laid, paint); driver(b, laid, paint); fare(b, paint); wings(b, id, laid, under);
  return muddy(b.parts(), splashMask(1.7, 4.1, 0.26, 0.6, laid ? 31 : 21), "mud-road", ["lacquer-black", "lacquer-black-worn"]);
}

prop({ id: "cab-motor", items: ["cab-motor"], size: [1.75, 2.06, 4.0], place: "floor", where: "set", tris: 45000, parts: () => cab("cab-motor", false) });
prop({ id: "cab-motor-laid", items: ["cab-motor"], size: [1.62, 2.06, 4.0], place: "floor", where: "set", tris: 45000, parts: () => cab("cab-motor-laid", true) });

export const KIT_CAB = true;
