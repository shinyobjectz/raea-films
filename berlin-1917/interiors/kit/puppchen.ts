// The small staff car (catalogue army-car): the Wanderer 5/15 PS two-seater, Typ W3 of 1914-19, the "Puppchen",
// which the army bought for staff and dispatch work; one with the Prussian eagle on its door was taken at Saint-Mihiel
// in 1918 (US Signal Corps 111-SC-23109) and another stands among German army vehicles in a period photograph
// (Commons, "Germany military vehicles", CC BY-SA, reference only). Its figures: 1.3 m wide and 3.1 m long; the
// side-by-side two-seater (Model N) has one door only, on the left; the gear lever inside on the right (German
// Wikipedia, "Wanderer Puppchen"). Its look is measured from the W3s in Chemnitz (Museum fuer saechsische Fahrzeuge),
// Brussels (Autoworld) and the 1911 car in the Verkehrsmuseum's photographs (Commons, CC BY / public domain, reference
// only): a flat brass radiator with rounded shoulders, a narrow bonnet with a block of louvres low at its back, the
// scuttle flaring out to the body, a straight-sided tub with a short rounded tail, flowing front wings into narrow
// running boards, wire wheels, lamps on brackets beside the radiator, the bulb horn's tube along the bonnet.
//   car-small   the two-seater in field-grey, hood folded over the tail, the eagle's shield on the door
// ASSUMED: the wheelbase 2.24 m and track 1.0 m from the photographs' proportions; tyres 680 x 42; right-hand steering
// (the lever inside on the right); the spare strapped on the right running board, where no door is; field-grey.
// Frame: on the ground under the middle between the axles, +z forward, the driver's right (the steering side) -x.
import { manifold, type Solid } from "raea/3d";
import { box, rbox, type V3 } from "./geo";
import type { MatId } from "./mats";
import { along, bez, leafSpring, type P2, plan, poly, side, slat, smooth, sph, sweepSheet, tube, turn, turnX, zAxis } from "./forms";
import { BLACK, crown, hullAlong, lamp, NICKEL, PAINT, wingLine, wireAt } from "./carparts";
import { muddy, rod, splashMask } from "./outgeo";
import { eagle } from "./patriot";
import { prop } from "./prop";
import { Build } from "./vehicles";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const R = 0.34, TY = 0.042, X = 0.5, ZF = 1.12, ZR = -1.12;
const RZ0 = 1.28, RZ1 = 1.36, BZ0 = 0.36, SC = 0.62, HW = 0.47, TAIL = -1.5, RC = 0.3, TOPY = 1.0;

/** The tub's plan in (x, z): straight sides back from the scuttle, the tail's corners rounded. */
const BODY_PLAN: P2[] = (() => {
  const p: P2[] = [[HW, BZ0], [-HW, BZ0]];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * (Math.PI / 2); p.push([-HW + RC + RC * Math.cos(a), TAIL + RC + RC * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) { const a = 1.5 * Math.PI + (i / 8) * (Math.PI / 2); p.push([HW - RC + RC * Math.cos(a), TAIL + RC + RC * Math.sin(a)]); }
  return p;
})();

function chassis(b: Build) {
  // the frame's channels, the dumb irons to the front springs, cross members; the sump, gearbox and undertray
  for (const s of [-1, 1]) {
    b.add(BLACK, box(0.04, 0.1, 2.55, s * 0.3, 0.4, -0.03).minus(box(0.03, 0.08, 2.65, s * 0.292, 0.41, -0.03)));
    b.add(BLACK, slat([s * 0.3, 0.45, 1.24], [s * 0.3, 0.41, 1.47], 0.07, 0.035));
  }
  for (const z of [-1.28, -0.5, 0.4, 1.2]) b.add(BLACK, rod([-0.3, 0.45, z], [0.3, 0.45, z], 0.02));
  b.add("zinc", rbox(0.26, 0.1, 0.55, 0.03, 0, 0.34, 0.95), rbox(0.22, 0.15, 0.3, 0.03, 0, 0.34, 0.12));
  b.add(BLACK, box(0.56, 0.01, 0.75, 0, 0.44, 0.95));
  // the front axle: a dropped beam on semi-elliptic springs, king pins, stub arms and the track rod; the drag link
  const beam: P2[] = [[-0.45, R + 0.02], [-0.36, R + 0.03], [-0.26, R - 0.01], [0, R - 0.04], [0.26, R - 0.01], [0.36, R + 0.03], [0.45, R + 0.02]];
  for (let i = 0; i + 1 < beam.length; i++) b.add(BLACK, slat([beam[i][0], beam[i][1], ZF], [beam[i + 1][0], beam[i + 1][1], ZF], 0.055, 0.035));
  for (const s of [-1, 1]) b.add(BLACK, leafSpring(0.7, 5, 0.04, 0.04).move(s * 0.3, R + 0.06, ZF), rod([s * 0.45, R - 0.06, ZF], [s * 0.45, R + 0.09, ZF], 0.018), rod([s * 0.45, R - 0.01, ZF], [s * 0.42, R - 0.01, ZF - 0.13], 0.011));
  b.add(BLACK, rod([-0.42, R - 0.01, ZF - 0.13], [0.42, R - 0.01, ZF - 0.13], 0.01), rod([-0.45, R + 0.06, ZF - 0.02], [-0.32, 0.45, 0.82], 0.012));
  b.add("zinc", rbox(0.07, 0.09, 0.09, 0.015, -0.32, 0.42, 0.8));
  // the starting handle under the radiator
  b.add(NICKEL, rod([0, 0.4, 1.3], [0, 0.4, 1.46], 0.011), rod([0, 0.4, 1.46], [0.08, 0.33, 1.46], 0.009), rod([0.08, 0.33, 1.46], [0.08, 0.33, 1.52], 0.011));
  // the rear axle: housing, differential, brake drums, the torque tube forward; its springs
  b.add(BLACK, rod([-0.46, R, ZR], [0.46, R, ZR], 0.03), sph(0.1, 16).scale(1, 1, 0.8).move(0, R, ZR), rod([0, R + 0.03, ZR + 0.08], [0, 0.36, -0.03], 0.026));
  for (const s of [-1, 1]) b.add(BLACK, turnX([[0, -0.028], [0.12, -0.028], [0.12, 0.028], [0, 0.028]], 22).move(s * 0.42, R, ZR), leafSpring(0.9, 5, 0.035, 0.04).move(s * 0.3, R + 0.05, ZR));
  // the exhaust down the left under the floor to the silencer, the tail pipe out at the back
  b.add("iron", ...tube(bez([[0.2, 0.5, 0.95], [0.3, 0.4, 0.85], [0.24, 0.3, 0.6], [0.22, 0.28, 0.35]], 6), 0.018));
  b.add(BLACK, turn([[0, -0.32], [0.05, -0.32], [0.055, -0.29], [0.055, 0.29], [0.05, 0.32], [0, 0.32]], 16).rotate(90, 0, 0).move(0.22, 0.28, 0.0));
  b.add("iron", rod([0.22, 0.28, -0.32], [0.22, 0.3, -1.58], 0.016));
}

/** The radiator: a flat brass shell with rounded shoulders, the core set back in it with its fine tubes, the filler
 *  cap on top. */
function radiator(b: Build) {
  const elev: P2[] = [[-0.24, 0.5], [0.24, 0.5], [0.24, 0.9]];
  for (let i = 1; i < 6; i++) { const a = (i / 6) * (Math.PI / 2); elev.push([0.17 + 0.07 * Math.cos(a), 0.9 + 0.07 * Math.sin(a)]); }
  for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + (i / 6) * (Math.PI / 2); elev.push([-0.17 + 0.07 * Math.cos(a), 0.9 + 0.07 * Math.sin(a)]); }
  elev.push([-0.24, 0.9]);
  const shell = along(elev, RZ0, RZ1), core = poly(elev).offset(-0.032, { join: "round" }).extrude(0.2).move(0, 0, RZ1 - 0.016);
  b.add("brass", shell.minus(core));
  b.add("zinc", poly(elev).offset(-0.032, { join: "round" }).extrude(0.01).move(0, 0, RZ1 - 0.026));
  for (let k = 0; k < 13; k++) b.add("iron", box(0.416, 0.004, 0.006, 0, 0.545 + k * 0.03, RZ1 - 0.016));
  b.add("brass", turn([[0, 0], [0.032, 0], [0.034, 0.018], [0.026, 0.035], [0, 0.04]], 14).move(0, 0.968, (RZ0 + RZ1) / 2));
}

/** The bonnet, straight and narrow, its louvres low at the back, the hinge along its crown, the catches; the scuttle
 *  flaring out to the body; the tub with its door on the left, the eagle's shield on it; the tail's locker lid. */
function body(b: Build) {
  const bon = crown(0.235, 0.5, 0.9, 0.06);
  let bonnet = hullAlong(bon, SC, bon, RZ0 - 0.005);
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) bonnet = bonnet.minus(box(0.01, 0.13, 0.008, s * 0.235, 0.58, SC + 0.1 + k * 0.035));
  b.add(PAINT, bonnet);
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) b.add(PAINT, manifold.box(0.008, 0.13, 0.03).rotate(0, s * 25, 0).move(s * 0.24, 0.645, SC + 0.1 + k * 0.035 + 0.012));
  b.add(NICKEL, rod([0, 0.962, SC], [0, 0.962, RZ0 - 0.01], 0.006));
  for (const s of [-1, 1]) b.add(NICKEL, box(0.012, 0.04, 0.025, s * 0.24, 0.53, 0.8), box(0.012, 0.04, 0.025, s * 0.24, 0.53, 1.14));
  b.add(PAINT, hullAlong(bon, SC, crown(HW, 0.42, TOPY - 0.03, 0.06), BZ0 + 0.002));
  // the tub: its plan cut by the side's line (level sill, the tail's underside curving up), the cockpit hollowed out
  const line: P2[] = [[BZ0 + 0.001, 0.42], ...smooth([[-1.05, 0.42], [-1.25, 0.46], [-1.4, 0.56], [-1.48, 0.7], [-1.51, 0.84]], 3), [-1.51, TOPY], [BZ0 + 0.001, TOPY]];
  const outer = plan(BODY_PLAN, 0.4, 1.1).intersect(side(line, 1.2));
  const well = poly(BODY_PLAN).offset(-0.025, { join: "round" }).extrude(1).rotate(90, 0, 0).move(0, 1.5, 0).intersect(box(2, 1, 1.32, 0, 0.47, -0.32));
  let tub = outer.minus(well);
  for (const z of [0.2, -0.4]) tub = tub.minus(box(0.008, 0.52, 0.004, HW, 0.45, z)); // the door's seams, left side only
  tub = tub.minus(box(0.6, 0.004, 0.36, 0, TOPY - 0.004, -1.2)); // the locker lid's seam on the tail
  b.add(PAINT, tub);
  b.add(NICKEL, turnX([[0.018, -0.004], [0.025, -0.004], [0.025, 0.004], [0.018, 0.004]], 14).move(HW + 0.012, 0.88, -0.36), rod([-0.06, TOPY + 0.012, -1.37], [0.06, TOPY + 0.012, -1.37], 0.006));
  // the cockpit's edge rolled in leather round the sides and the back
  const e = HW - 0.02, edge: V3[] = [[-e, TOPY, 0.33], [-e, TOPY, -0.85], [-e + 0.1, TOPY, -0.97], [0, TOPY, -0.99], [e - 0.1, TOPY, -0.97], [e, TOPY, -0.85], [e, TOPY, 0.33]];
  b.add("leather", ...tube(edge, 0.014));
  // the shield on the door: white, its foot pointed, the black eagle on it, head to the front
  const cz = -0.1, cy = 0.72, sh: P2[] = [[-0.1, 0.12], [0.1, 0.12], [0.1, 0], [0.08, -0.06], [0.04, -0.1], [0, -0.12], [-0.04, -0.1], [-0.08, -0.06], [-0.1, 0]];
  b.add("paint-white", side(sh.map(([u, v]): P2 => [cz + u, cy + v]), 0.004).move(HW + 0.002, 0, 0));
  b.add("enamel-black", side(eagle(0, 0, 0.075).map(([x, y]): P2 => [cz - x, cy + 0.01 + y]), 0.003).move(HW + 0.004, 0, 0));
}

/** The wings: the front ones flowing from ahead of the wheel down to the running boards, the back ones round the
 *  wheels; the boards with their rubber and edge; valances from the bonnet's foot to the wings. */
function wings(b: Build) {
  const front = smooth([[1.5, 0.52], [1.42, 0.64], [1.28, 0.72], [1.12, 0.745], [0.96, 0.72], [0.82, 0.64], [0.7, 0.52], [0.58, 0.4], [0.46, 0.33], [0.38, 0.315]], 3);
  const arc: P2[] = [[-0.6, 0.315]];
  for (let i = 0; i <= 16; i++) { const a = ((80 - (165 * i) / 16) * Math.PI) / 180; arc.push([ZR + 0.41 * Math.sin(a), R + 0.41 * Math.cos(a)]); }
  for (const s of [-1, 1]) {
    b.add(BLACK, ...sweepSheet(front, wingLine(0.05), () => s * 0.53, () => s * 0.085, 0.005), ...sweepSheet(smooth(arc, 2), wingLine(0.06), () => s * 0.53, () => s * 0.085, 0.005));
    b.add(BLACK, box(0.16, 0.022, 1.0, s * 0.54, 0.29, -0.11));
    b.add("rubber", box(0.14, 0.004, 0.96, s * 0.54, 0.312, -0.11));
    b.add(NICKEL, box(0.01, 0.026, 1.0, s * 0.624, 0.288, -0.11));
    for (const z of [-0.5, 0.25]) b.add(BLACK, slat([s * 0.3, 0.42, z], [s * 0.5, 0.29, z], 0.03, 0.016));
    b.add(BLACK, manifold.hull([[s * 0.235, 0.5, SC], [s * 0.235, 0.5, RZ0], [s * 0.4, 0.5, SC + 0.05], [s * 0.4, 0.5, RZ0], [s * 0.235, 0.494, SC], [s * 0.235, 0.494, RZ0], [s * 0.4, 0.494, SC + 0.05], [s * 0.4, 0.494, RZ0]]));
  }
}

/** The cockpit: the bench in rolls of leather, the steering wheel on its raked column, the levers inside on the
 *  right, the dash, the windscreen, the bulb horn, the hood folded over the tail. */
function cockpit(b: Build) {
  b.add("wood-grey", box(0.88, 0.02, 1.25, 0, 0.45, -0.32));
  b.add(PAINT, box(0.88, 0.22, 0.42, 0, 0.47, -0.74));
  b.add("leather", rbox(0.86, 0.1, 0.44, 0.04, 0, 0.68, -0.72));
  for (let i = 0; i < 5; i++) b.add("leather", rbox(0.18, 0.34, 0.09, 0.04, 0, 0, 0).rotate(-12, 0, 0).move(-0.36 + i * 0.18, 0.95, -0.93));
  // the steering: the column from the box up through the dash, the wooden rim on four spokes
  const top: V3 = [-0.22, 1.06, -0.12], d = [0.1, 0.64, -0.92], L = Math.hypot(...d), tilt = (Math.atan2(d[2] / L, d[1] / L) * 180) / Math.PI;
  b.add(BLACK, rod([-0.32, 0.45, 0.8], top, 0.016));
  const rim: P2[] = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rim.push([0.18 + 0.012 * Math.cos(a), 0.012 * Math.sin(a)]); }
  b.add("wood-varnish", turn(rim, 32).rotate(tilt, 0, 0).move(...top));
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; b.add(BLACK, rod([0, 0, 0], [0.175 * Math.cos(a), 0, 0.175 * Math.sin(a)], 0.007).rotate(tilt, 0, 0).move(...top)); }
  b.add(NICKEL, turn([[0, -0.018], [0.03, -0.018], [0.03, 0.018], [0, 0.026]], 12).rotate(tilt, 0, 0).move(...top));
  // the gear lever and the hand brake inside on the right, their gate
  for (const [z, k] of [[-0.2, 0.98], [-0.33, 0.93]] as [number, number][]) b.add(NICKEL, rod([-0.42, 0.47, z], [-0.425, k, z + 0.06], 0.01), sph(0.02, 10).move(-0.425, k, z + 0.06));
  b.add(NICKEL, box(0.014, 0.02, 0.1, -0.41, 0.58, -0.2));
  // the dash on the scuttle's back: a dial and the oiler's glass
  b.add(NICKEL, zAxis(turn([[0, 0], [0.04, 0], [0.04, 0.01], [0, 0.01]], 16)).move(-0.15, 0.86, BZ0 - 0.008), zAxis(turn([[0, 0], [0.03, 0], [0.03, 0.01], [0, 0.01]], 16)).move(0.12, 0.86, BZ0 - 0.008));
  b.add("glass-plate", zAxis(turn([[0, 0], [0.032, 0], [0.032, 0.003], [0, 0.003]], 16)).move(-0.15, 0.86, BZ0 - 0.012));
  // the windscreen: posts with finials, the pane in its frame, stays to the scuttle
  for (const s of [-1, 1]) b.add(NICKEL, rod([s * 0.42, TOPY - 0.03, BZ0 + 0.02], [s * 0.42, 1.42, BZ0 + 0.02], 0.009), sph(0.015, 10).move(s * 0.42, 1.43, BZ0 + 0.02), rod([s * 0.42, 1.12, BZ0 + 0.02], [s * 0.465, 0.95, BZ0 + 0.16], 0.007));
  b.add(NICKEL, rod([-0.42, 1.38, BZ0 + 0.02], [0.42, 1.38, BZ0 + 0.02], 0.008), rod([-0.42, 1.04, BZ0 + 0.02], [0.42, 1.04, BZ0 + 0.02], 0.007));
  b.add("glass-plate", box(0.82, 0.33, 0.005, 0, 1.045, BZ0 + 0.02));
  // the bulb horn by the driver's hand, its brass tube along the bonnet's right side to the bell
  b.add("brass", ...tube([[-0.5, 0.92, 0.22], [-0.49, 0.9, 0.42], [-0.27, 0.82, 0.7], [-0.265, 0.8, 1.18]], 0.007), zAxis(turn([[0.005, 0], [0.01, 0.04], [0.022, 0.075], [0.042, 0.09], [0.044, 0.095], [0.004, 0.095]], 16)).move(-0.265, 0.8, 1.18));
  b.add("rubber", sph(0.03, 12).scale(1, 1.3, 1).move(-0.505, 0.9, 0.19));
  // the hood folded in its bag over the tail, the irons it pivots on
  b.add("cloth-black", rbox(0.98, 0.17, 0.4, 0.08, 0, TOPY - 0.02, -1.19));
  for (const s of [-1, 1]) b.add("iron", slat([s * (HW + 0.005), 0.86, -0.95], [s * (HW + 0.01), 1.06, -1.05], 0.025, 0.008));
}

/** The lamps, the spare on the right running board, the tail lamp. */
function fittings(b: Build, id: string) {
  for (const s of [-1, 1]) {
    lamp(b, [s * 0.33, 0.83, 1.32], 0.085, "brass");
    b.add(BLACK, rod([s * 0.33, 0.75, 1.3], [s * 0.3, 0.46, 1.36], 0.011), rod([s * 0.245, 0.8, 1.3], [s * 0.3, 0.8, 1.31], 0.008));
    lamp(b, [s * (HW + 0.05), 0.93, 0.4], 0.042);
    b.add(NICKEL, rod([s * (HW + 0.05), 0.89, 0.39], [s * HW, 0.87, 0.39], 0.007));
  }
  const SP: V3 = [-0.6, 0.3 + 0.022 + R, -0.3];
  wireAt(b, id, SP, R, TY, false);
  b.add("iron", rod([-HW, 0.8, -0.3], [-0.59, 0.66, -0.3], 0.013));
  for (const dz of [-0.24, 0.24]) b.add("leather", box(0.1, 0.03, 0.025, -0.6, SP[1] + Math.sqrt(R * R - dz * dz) - 0.018, SP[2] + dz));
  b.add(BLACK, zAxis(turn([[0, -0.04], [0.035, -0.04], [0.04, 0], [0, 0]], 12)).move(0.32, 0.62, TAIL - 0.01));
  b.add("glass-ruby", zAxis(turn([[0, -0.05], [0.03, -0.05], [0.03, -0.04], [0, -0.04]], 12)).move(0.32, 0.62, TAIL - 0.01));
}

function smallCar(id: string): Part[] {
  const b = new Build();
  for (const z of [ZF, ZR]) for (const s of [-1, 1]) wireAt(b, id, [s * X, R, z], R, TY);
  chassis(b); radiator(b); body(b); wings(b); cockpit(b); fittings(b, id);
  return muddy(b.parts(), splashMask(1.3, 3.2, 0.2, 0.5, 13), "mud-road", [PAINT, BLACK]);
}

prop({ id: "car-small", items: ["army-car"], size: [1.3, 1.5, 3.1], place: "floor", where: "set", tris: 60000, parts: () => smallCar("car-small") });

export const KIT_PUPPCHEN = true;
