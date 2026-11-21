// The army's vehicles in a Berlin street in winter 1917-18: field grey, worn, no unit markings (ASSUMED until a
// photograph shows Berlin's), in the vehicle frame of kit/vehicles.ts (origin under the middle between the axles, +z
// forward, x across).
//   lorry-3t, lorry-3t-tilt  the Regel-3-Tonner of 1915-18 (Daimler, Büssing, NAG and others built it to one rule):
//                     a fixed timber cab, a tall eight-sided radiator, cast-steel wheels on solid rubber (twins
//                     behind), chain drive; high board sides on hoops, and the variant with its tilt over them. Track
//                     1.70 m (the rule's); wheelbase 3.9 m, 6.6 m long (ASSUMED from the Signal Corps photographs)
//   kitchen-field     the large field kitchen Hf. 11: a limber with its seat box and a pole, and the kitchen wagon with
//                     the round 200 l double-walled kettle, the square 90 l coffee kettle before it and the chimney
//                     standing up (laid back to travel); 4.10 m long, 6.70 m with the pole, 1.85 m wide, 2.19 m to the
//                     chimney's top (de.wikipedia Gulaschkanone; Hf. 11); wooden wheels with iron tyres
//   wagon-army        the army's box wagon with its tilt on four hoops, for two horses
//   gun-fk96          the 7.7 cm field gun 96 n.A.: barrel 2.08 m, its cradle and recoil cylinder, the shield and its
//                     apron, the box trail to its spade; wheels 1.36 m (ASSUMED from the field gun family)
//   limber-gun        its limber: an ammunition box with seats, a pole
// The staff car is in kit/cars.ts, the motor ambulance in kit/ambulance.ts.
import type { Solid } from "raea/3d";
import { crossSection, manifold } from "raea/3d";
import { ball, box, lathe, post, rbox, rodX, taper, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { archRoof, disc, muddy, rod, spoked, splashMask } from "./outgeo";
import { along, leafSpring, type P2, side, slat, smooth, sph, sweepSheet, turn, turnX, zAxis } from "./forms";
import { crown, hullAlong, lamp, wingLine } from "./carparts";
import { prop } from "./prop";
import { axle, Build, HITCH, pole, seatBox, WHEELS } from "./vehicles";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };

/** A cast-steel wheel on solid rubber, at (x, R, z), axis along x. */
function rubberWheel(b: Build, id: string, R: number, w: number, x: number, z: number) {
  const d = disc(R, w, { tyre: 0.09, boss: 0.12, spokes: 10 });
  b.add("paint-field", d.steel.move(x, R, z)); if (d.rubber) b.add("rubber", d.rubber.move(x, R, z));
  (WHEELS[id] ??= []).push({ at: [x, R, z], r: R });
}

/** A rounded-top outline (a radiator's, a cab's back window): w wide, h tall to its shoulders, the top an arc rising r. */
function domed(w: number, h: number, r: number): [number, number][] {
  const p: [number, number][] = [[-w / 2, 0], [w / 2, 0], [w / 2, h]];
  for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI; p.push([(w / 2) * Math.cos(a), h + r * Math.sin(a)]); }
  p.push([-w / 2, h]);
  return p;
}

/** The Regel-3-Tonner of 1915-18 as the Daimler and its likes were photographed in 1918-19 (Signal Corps 111-SC-40460,
 *  "LKW Daimler, ca. 1918"): a fixed timber cab whose flat roof runs out over the windscreen, a tall eight-sided
 *  radiator (its corners cut, the rim rounded) before a crowned bonnet with pressed louvres, carbide lamps on its
 *  sides, crowned wings with turned-down lips, cast-steel wheels on solid rubber (twins behind),
 *  chains from a countershaft to sprockets on the rear wheels, and a high-sided bed with its hoops (and tilt).
 *  Right-hand drive, the gear and brake levers outside the cab on the right (x -). Origin on the ground under the
 *  middle between the axles, +z forward; wheelbase 3.9 m, track 1.70 m (the rule's), 6.6 m long, 2.15 wide. */
function lorry(id: string, tilt: boolean): Part[] {
  const b = new Build(), T = 1.7, ZF = 1.95, ZR = -1.95, RF = 0.46, RR = 0.53, FR = 0.86; // FR: the frame's top
  // ── wheels, axles, springs, frame
  for (const s of [-1, 1]) { rubberWheel(b, id, RF, 0.13, s * T / 2, ZF); rubberWheel(b, id, RR, 0.12, s * (T / 2 - 0.07), ZR); rubberWheel(b, id, RR, 0.12, s * (T / 2 + 0.07), ZR); }
  b.add("iron", box(T - 0.2, 0.09, 0.07, 0, RF - 0.045, ZF), box(T - 0.12, 0.1, 0.1, 0, RR - 0.05, ZR)); // the front I-beam, the rear axle
  for (const s of [-1, 1]) b.add("iron", leafSpring(1.1, 6, 0.06, 0.065, 0.012).move(s * 0.45, RF + 0.13, ZF), leafSpring(1.35, 7, 0.06, 0.075, 0.013).move(s * 0.45, RR + 0.12, ZR));
  for (const s of [-1, 1]) b.add("iron", box(0.075, 0.2, 6.1, s * 0.45, FR - 0.2, -0.15).minus(box(0.06, 0.16, 6.2, s * 0.438, FR - 0.18, -0.15)), box(0.08, 0.1, 0.12, s * 0.45, RF + 0.08, ZF), box(0.08, 0.1, 0.12, s * 0.45, RR + 0.08, ZR));
  for (const z of [2.85, 1.55, 0.3, -1.0, -2.6, -3.2]) b.add("iron", box(0.9, 0.12, 0.07, 0, FR - 0.16, z));
  // ── the chain drive: the countershaft's case across the frame, a small sprocket each side, the chain's two runs back
  // to the big sprocket bolted inside each rear wheel, the guard over the top run
  const CZ = ZR + 1.15, CY = FR - 0.22, RS = 0.34, rs = 0.1;
  b.add("iron", box(0.95, 0.24, 0.32, 0, CY - 0.12, CZ), rod([-0.66, CY, CZ], [0.66, CY, CZ], 0.04));
  for (const s of [-1, 1]) {
    const x = s * 0.66;
    b.add("iron", lathe([[0, -0.012], [rs, -0.012], [rs, 0.012], [0, 0.012]], 0, 0, 0, 14).rotate(0, 0, 90).move(x, CY, CZ));
    b.add("iron", lathe([[0, -0.012], [RS, -0.012], [RS, 0.012], [0, 0.012]], 0, 0, 0, 24).rotate(0, 0, 90).move(x, RR, ZR));
    b.add("iron", rod([x, CY + rs, CZ], [x, RR + RS, ZR], 0.016), rod([x, CY - rs, CZ], [x, RR - RS, ZR], 0.016));
    b.add("paint-field", box(0.03, 0.06, Math.hypot(CZ - ZR, CY - RR) + 0.3, 0, 0, 0).rotate(Math.atan2(RR + RS - CY - rs, CZ - ZR) * 180 / Math.PI, 0, 0).move(x + s * 0.02, (CY + rs + RR + RS) / 2 + 0.05, (CZ + ZR) / 2));
  }
  // ── the radiator: its shell with the domed header, the dark honeycomb set in it, the filler cap, the starting handle
  // (the Daimler's shell has eight sides, its corners cut and its rim rounded, the header standing above the bonnet)
  const RZ = 2.92, RY = 0.62, RD = 0.12;
  const oct = (w: number, y0: number, y1: number, ct: number, cb: number): P2[] => [[-w / 2 + cb, y0], [w / 2 - cb, y0], [w / 2, y0 + cb], [w / 2, y1 - ct], [w / 2 - ct, y1], [-w / 2 + ct, y1], [-w / 2, y1 - ct], [-w / 2, y0 + cb]];
  const coreAt = (z0: number, z1: number) => along(oct(0.66, RY + 0.08, RY + 0.88, 0.1, 0.06), z0, z1);
  b.add("paint-field", hullAlong(oct(0.82, RY, RY + 0.98, 0.14, 0.1), RZ - RD, oct(0.79, RY + 0.015, RY + 0.965, 0.13, 0.09), RZ).minus(coreAt(RZ - 0.03, RZ + 0.05)));
  b.add("iron", coreAt(RZ - 0.04, RZ - 0.025), post(0.035, 0.07, 0, RY + 0.975, RZ - 0.06));
  for (let i = 1; i < 11; i++) b.add("iron", box(0.62, 0.007, 0.01, 0, RY + 0.08 + i * 0.073, RZ - 0.026));
  for (let i = -3; i <= 3; i++) b.add("iron", box(0.007, 0.78, 0.01, i * 0.09, RY + 0.09, RZ - 0.026));
  b.add("iron", rod([0, RY + 0.05, RZ], [0, RY + 0.05, RZ + 0.22], 0.016), rod([0, RY + 0.05, RZ + 0.22], [0.13, RY - 0.06, RZ + 0.22], 0.016));
  b.add("iron", box(0.9, 0.06, 0.08, 0, FR - 0.24, RZ + 0.02)); // the dumb-iron's cross piece under it
  // ── the bonnet: flat sides with louvres, a gently rounded top, back to the dash
  const Z0 = 1.62, BY = FR, BH = 0.56, BW = 0.78, ZB = RZ - RD;
  b.add("paint-field", hullAlong(crown(BW / 2 + 0.02, BY, BY + BH, 0.08), Z0, crown(BW / 2, BY, BY + BH, 0.07), ZB));
  // nine louvres each side, their blades pressed out of the panel and open to the back; the hinge; the side's joint
  for (const s of [-1, 1]) for (let i = 0; i < 9; i++) {
    const z = Z0 + 0.25 + i * 0.11, x = s * (BW / 2 + 0.02 - (0.02 * (z - Z0)) / (ZB - Z0));
    b.add("iron", box(0.006, 0.2, 0.028, x, BY + 0.2, z));
    b.add("paint-field", manifold.box(0.007, 0.2, 0.036).rotate(0, s * 25, 0).move(x + s * 0.008, BY + 0.3, z + 0.006));
  }
  b.add("iron", rod([0, BY + BH + 0.081, Z0], [0, BY + BH + 0.071, ZB], 0.008));
  for (const s of [-1, 1]) b.add("iron", slat([s * (BW / 2 + 0.021), BY + BH - 0.03, Z0], [s * (BW / 2 + 0.001), BY + BH - 0.03, ZB], 0.01, 0.006));
  b.add("iron", box(0.6, 0.36, 1.0, 0, FR - 0.32, 2.2), box(0.7, 0.1, 0.5, 0, FR - 0.4, 2.3)); // the engine block and its sump under the bonnet
  // ── carbide headlamps on irons either side of the radiator, the bulb horn on the dash
  for (const s of [-1, 1]) { b.add("iron", rod([s * 0.41, RY + 0.52, RZ - 0.08], [s * 0.47, RY + 0.54, RZ - 0.08], 0.014)); lamp(b, [s * 0.53, RY + 0.58, RZ - 0.06], 0.095, "iron"); }
  // ── mudguards over the front wheels, the running boards, the toolbox and the exhaust
  for (const s of [-1, 1]) {
    b.add("paint-field", ...sweepSheet(smooth([[2.5, 0.72], [2.38, 0.9], [2.15, 1.01], [1.85, 1.03], [1.6, 0.97], [1.45, 0.84], [1.38, 0.7]], 3), wingLine(0.07), () => (s * T) / 2, () => s * 0.16, 0.007));
    b.add("wood-grey", box(0.28, 0.035, 1.1, s * 0.95, 0.66, 0.9));
    b.add("iron", box(0.04, 0.2, 0.04, s * 0.8, 0.5, 0.5), box(0.04, 0.2, 0.04, s * 0.8, 0.5, 1.45), box(0.36, 0.03, 0.04, s * 0.95, 0.63, 0.5), box(0.36, 0.03, 0.04, s * 0.95, 0.63, 1.45));
  }
  b.add("paint-field", box(0.32, 0.36, 0.55, 0.92, 0.5, -0.35)); // the toolbox under the bed's front, left
  b.add("iron", rod([0.3, FR - 0.25, 1.4], [0.3, FR - 0.3, -0.4], 0.035), lathe([[0, 0], [0.1, 0], [0.1, 0.7], [0, 0.7]], 0, 0, 0, 12).rotate(90, 0, 0).move(0.3, FR - 0.33, -1.15));
  // ── the dash (the bulkhead between bonnet and cab), the cab's floor and its timber body
  const C0 = 0.32, C1 = Z0, FL = 1.02, EAVE = 2.62, CW = 1.95, P = 0.06;
  b.add("wood-grey", box(CW, 0.05, C1 - C0, 0, FL, (C0 + C1) / 2));
  for (const z of [C0 + 0.1, C1 - 0.1]) b.add("wood-grey", box(CW - 0.1, FL - FR, 0.08, 0, FR, z)); // the cab's bearers on the frame
  // the back wall with its small window, the sides' lower panels behind the door openings, the pillars
  const backWin = crossSection.polygon(domed(0.5, 0.22, 0.06)).extrude(0.2).move(0, 1.92, C0 - 0.1);
  b.add("paint-field", box(CW, EAVE - FL, P, 0, FL, C0 + P / 2).minus(backWin));
  b.add("glass-plate", box(0.52, 0.32, 0.008, 0, 1.91, C0 + 0.03).intersect(backWin.move(0, 0, 0)));
  for (const s of [-1, 1]) {
    const x = s * (CW / 2 - P / 2);
    b.add("paint-field", box(P, 0.62, 0.42, x, FL, C0 + 0.21)); // the side panel behind the seat
    b.add("paint-field", box(P, 0.62, 0.12, x, FL, C1 - 0.06)); // the panel before the doorway
    b.add("paint-field", box(P, EAVE - FL, 0.07, x, FL, C0 + 0.035), box(P, EAVE - FL, 0.07, x, FL, C1 - 0.035), box(P, EAVE - FL - 0.62, 0.06, x, FL + 0.62, C0 + 0.45));
    b.add("iron", rod([x + s * 0.03, FL + 0.7, C1 - 0.2], [x + s * 0.03, FL + 1.1, C1 - 0.2], 0.012)); // the grab handle
  }
  // the windscreen: its frame on the dash, two panes, the upper one hinged out a little for air
  const W0 = FL + 0.72, W1 = EAVE - 0.04;
  b.add("paint-field", box(CW - 0.04, 0.84, 0.05, 0, FL - 0.12, C1), box(CW - 0.04, 0.04, 0.05, 0, W0 + 0.42, C1), box(CW - 0.04, 0.05, 0.05, 0, W1 - 0.02, C1), box(0.05, W1 - W0, 0.05, 0, W0, C1));
  for (const s of [-1, 1]) {
    b.add("paint-field", box(0.05, W1 - W0, 0.05, s * (CW / 2 - 0.05), W0, C1));
    b.add("glass-plate", box(0.86, 0.4, 0.008, s * 0.47, W0 + 0.01, C1));
    b.add("glass-plate", box(0.86, 0.36, 0.008, 0, 0, 0).rotate(-14, 0, 0).move(s * 0.47, W0 + 0.47, C1 + 0.085));
  }
  // the roof: boards over bows, running out 0.32 m over the windscreen as a visor, its lamp irons, the side lamps
  b.add("tram-roof", archRoof(CW / 2 + 0.04, EAVE, 0.06, 0.035, C1 - C0 + 0.37).move(0, 0, (C0 - 0.05 + C1 + 0.32) / 2));
  for (const z of [C0 + 0.05, C1 + 0.3]) b.add("paint-field", box(CW + 0.06, 0.06, 0.05, 0, EAVE - 0.05, z));
  for (const s of [-1, 1]) {
    b.add("iron", box(0.04, 0.04, 0.08, s * (CW / 2 + 0.03), FL + 0.95, C1 - 0.02), lathe([[0, 0], [0.065, 0], [0.065, 0.16], [0.03, 0.22], [0, 0.22]], 0, 0, 0, 10).move(s * (CW / 2 + 0.09), FL + 0.92, C1 - 0.02));
    b.add("glass-signal", box(0.07, 0.08, 0.01, s * (CW / 2 + 0.09), FL + 0.98, C1 + 0.045));
  }
  // ── inside the cab: the bench over the petrol tank, its leather cushion and back, the steering column and wheel,
  // the pedals, the gear and brake levers outside on the right, the bulb horn
  b.add("paint-field", box(CW - 0.16, 0.36, 0.5, 0, FL + 0.03, C0 + 0.32));
  b.add("leather", rbox(CW - 0.2, 0.1, 0.48, 0.04, 0, FL + 0.39, C0 + 0.33), rbox(CW - 0.2, 0.45, 0.08, 0.04, 0, FL + 0.6, C0 + 0.1));
  const SX = -0.45;
  b.add("iron", rod([SX, FL + 0.05, C1 - 0.12], [SX, FL + 0.95, C1 - 0.5], 0.026), lathe([[0.19, -0.013], [0.215, -0.013], [0.215, 0.013], [0.19, 0.013]], 0, 0, 0, 18).rotate(-23, 0, 0).move(SX, FL + 0.97, C1 - 0.52));
  // its three spokes, in the wheel's plane: x across and (0, 0.39, 0.92) along it
  for (const a of [90, 210, 330]) { const c = Math.cos((a * Math.PI) / 180) * 0.2, d = Math.sin((a * Math.PI) / 180) * 0.2; b.add("iron", rod([SX, FL + 0.97, C1 - 0.52], [SX + c, FL + 0.97 + 0.39 * d, C1 - 0.52 + 0.92 * d], 0.01)); }
  for (const x of [SX - 0.18, SX + 0.02, SX + 0.2]) b.add("iron", rod([x, FL + 0.03, C1 - 0.25], [x, FL + 0.16, C1 - 0.35], 0.012), box(0.07, 0.015, 0.1, x, FL + 0.15, C1 - 0.37));
  // the gear and brake levers pivot on one hub on a bracket off the frame, just outside the cab's side by the dash,
  // between them the quadrant: a thin notched iron sector the brake lever's pawl drops into
  const LP: V3 = [-(CW / 2 + 0.06), FR - 0.05, 1.22];
  const sector: [number, number][] = [];
  for (let i = 0; i <= 16; i++) { const a = ((-16 + i * 2) * Math.PI) / 180, r = i % 2 ? 0.455 : 0.47; sector.push([Math.sin(a) * r, Math.cos(a) * r]); }
  for (let i = 16; i >= 0; i--) { const a = ((-16 + i * 2) * Math.PI) / 180; sector.push([Math.sin(a) * 0.41, Math.cos(a) * 0.41]); }
  b.add("iron", crossSection.polygon(sector.reverse()).extrude(0.012).rotate(0, -90, 0).move(LP[0] - 0.02, LP[1], LP[2]));
  b.add("iron", rodX(0.03, 0.14, LP[0] - 0.02, LP[1], LP[2]), rod([-(CW / 2 - 0.35), LP[1], LP[2]], [LP[0] + 0.03, LP[1], LP[2]], 0.022));
  for (const [dx, top] of [[0.015, [LP[0] + 0.015, FL + 0.85, LP[2] - 0.16]], [-0.055, [LP[0] - 0.055, FL + 0.75, LP[2] + 0.1]]] as [number, V3][]) {
    b.add("iron", rod([LP[0] + dx, LP[1], LP[2]], top, 0.017));
    b.add("iron-bright", ball(0.032).move(...top)); // the grip, rubbed bright
  }
  b.add("iron", rod([-(CW / 2 - 0.1), FL + 0.95, C1 + 0.02], [-(CW / 2 + 0.08), FL + 0.95, C1 + 0.1], 0.012), lathe([[0, 0], [0.025, 0], [0.07, 0.22], [0, 0.22]], 0, 0, 0, 10).rotate(90, 0, 0).move(-(CW / 2 + 0.08), FL + 0.95, C1 + 0.1));
  b.add("rubber", ball(0.05).move(-(CW / 2 - 0.12), FL + 0.95, C1 - 0.02));
  // ── the bed: bearers on the frame, the deck, high sides of three boards held by iron stakes, the headboard, the
  // tailboard on its hinges, the hooks for the tilt's lashing
  const BZ0 = -3.4, BZ1 = 0.22, DECK = FR + 0.14, BWd = 2.1, SH = 0.78;
  for (const z of [-3.2, -2.3, -1.4, -0.5]) b.add("wood-grey", box(BWd, 0.1, 0.1, 0, FR, z));
  b.add("wood-grey", box(BWd, 0.05, BZ1 - BZ0, 0, DECK - 0.05, (BZ0 + BZ1) / 2));
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) b.add("wood-grey", box(0.04, SH / 3 - 0.02, BZ1 - BZ0, s * (BWd / 2 - 0.02), DECK + i * SH / 3, (BZ0 + BZ1) / 2));
    for (let i = 0; i < 5; i++) b.add("iron", box(0.025, SH + 0.05, 0.06, s * (BWd / 2 + 0.008), DECK - 0.05, BZ0 + 0.2 + i * (BZ1 - BZ0 - 0.4) / 4));
    for (let i = 0; i < 6; i++) b.add("iron", box(0.04, 0.03, 0.04, s * (BWd / 2 + 0.02), DECK - 0.08, BZ0 + 0.3 + i * 0.6));
  }
  for (let i = 0; i < 4; i++) b.add("wood-grey", box(BWd - 0.08, (SH + 0.3) / 4 - 0.02, 0.04, 0, DECK + i * (SH + 0.3) / 4, BZ1 - 0.02));
  for (let i = 0; i < 3; i++) b.add("wood-grey", box(BWd - 0.08, SH / 3 - 0.02, 0.04, 0, DECK + i * SH / 3, BZ0 + 0.02));
  for (const x of [-0.7, 0.7]) b.add("iron", box(0.06, SH, 0.03, x, DECK, BZ0 - 0.005), rod([x, DECK + 0.02, BZ0 - 0.02], [x + 0.08, DECK + 0.02, BZ0 - 0.02], 0.02));
  b.add("iron", box(0.04, 0.1, 0.04, 0.3, DECK - 0.16, BZ0 + 0.05), box(0.04, 0.1, 0.04, -0.3, DECK - 0.16, BZ0 + 0.05)); // the tail lamp's iron, the hook
  // ── the hoops (always: the photographs show them bare as often as covered) and the tilt over them
  const HY = DECK + SH + 0.95, hoops = [BZ0 + 0.15, BZ0 + 1.0, BZ0 + 1.85, BZ0 + 2.7, BZ1 - 0.12];
  for (const z of hoops) b.add("iron", archRoof(BWd / 2 + 0.02, HY - 0.32, 0.32, 0.03, 0.04).move(0, 0, z), ...[-1, 1].map((s) => box(0.03, HY - 0.32 - DECK - SH + 0.1, 0.04, s * (BWd / 2 + 0.005), DECK + SH - 0.1, z)));
  b.add("iron", box(0.04, 0.04, BZ1 - BZ0 - 0.2, 0, HY + 0.02 - 0.05, (BZ0 + BZ1) / 2));
  if (tilt) {
    const L = BZ1 - BZ0 + 0.06, M = (BZ0 + BZ1) / 2;
    b.add("canvas-field", archRoof(BWd / 2 + 0.05, HY - 0.33, 0.34, 0.02, L).move(0, 0, M));
    for (const s of [-1, 1]) b.add("canvas-field", box(0.02, HY - 0.33 - (DECK + 0.25), L, s * (BWd / 2 + 0.045), DECK + 0.25, M));
    b.add("canvas-field", box(BWd + 0.1, HY - 0.33 - (DECK + SH + 0.3), 0.02, 0, DECK + SH + 0.3, BZ1 + 0.03), archRoof(BWd / 2 + 0.05, HY - 0.33, 0.34, 0.02, 0.02).move(0, 0, BZ1 + 0.03));
    // the back flaps rolled up under the arch, tied with two straps
    b.add("canvas-field", rodX(0.09, BWd - 0.1, 0, HY - 0.42, BZ0 - 0.03), archRoof(BWd / 2 + 0.05, HY - 0.33, 0.34, 0.02, 0.02).move(0, 0, BZ0 - 0.03));
    for (const x of [-0.6, 0.6]) b.add("leather", box(0.04, 0.22, 0.2, x, HY - 0.53, BZ0 - 0.03));
  }
  // road mud up the wheels, guards, steps and the frame, raggedly to about 0.85 m
  return muddy(b.parts(), splashMask(2.6, 7.4, 0.32, 0.85, tilt ? 5 : 3));
}

/** The large field kitchen Hf. 11, after the photographs in H.Dv. 476-3 (its near side; the kitchen wagon from above):
 *  the limber's axle at z +1.16 and the kitchen wagon's at -1.16, all four on 1.30 m wooden wheels. The limber: its
 *  chest, the cook's cushion before a wire-net rack holding a rolled tent, a pack and a crate, the footboard, the pole
 *  for two. The kitchen wagon: the stove's casing with its bands and lid catches, the 200 l kettle inside it showing
 *  only its round lid clamped to a bright flange, the coffee kettle's square lid before it, the chimney
 *  standing at the front corner, the can hung on the front, the fire door, a draw-off tap each side, the step at the
 *  back; its short pole on the limber's hook, braced to the casing, the prop folded under it. */
function kitchen(id: string): Part[] {
  const b = new Build(), T = 1.53, R = 0.65, ZL = 1.16, ZK = -1.16;
  axle(b, id, R, ZL, T, 0.08, 12, "paint-field", { felloe: 0.065, hub: 0.11 });
  axle(b, id, R, ZK, T, 0.08, 14, "paint-field", { felloe: 0.065, hub: 0.11 });
  // ── the limber: the chest on its frame, the lid's iron edge and hasps, the cushion, the footboard, the pole
  const C0 = 0.4, C1 = 1.5, CT = 1.21;
  for (const x of [-0.45, 0.45]) b.add("iron", box(0.06, 0.08, C1 - C0 + 0.1, x, 0.6, (C0 + C1) / 2));
  b.add("iron", box(1.0, 0.08, 0.06, 0, 0.6, C0 - 0.03), rod([0, 0.6, C0 - 0.08], [0, 0.78, C0 - 0.08], 0.018));
  b.add("paint-field", rbox(1.1, CT - 0.71, C1 - C0, 0.03, 0, 0.71, (C0 + C1) / 2));
  b.add("iron", box(1.12, 0.03, C1 - C0 + 0.02, 0, CT - 0.05, (C0 + C1) / 2));
  for (const x of [-0.35, 0.35]) b.add("iron", box(0.06, 0.1, 0.02, x, CT - 0.14, C1 + 0.005));
  b.add("leather", rbox(1.04, 0.08, 0.42, 0.03, 0, CT, C1 - 0.23));
  b.add("paint-field", box(1.0, 0.035, 0.45, 0, -0.0175, 0).rotate(-25, 0, 0).move(0, 0.93, C1 + 0.26));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.45, 0.66, C1], [s * 0.45, 0.86, C1 + 0.3], 0.012));
  HITCH[id] = { ...HITCH[id], seat: [0, CT + 0.08, C1 - 0.23], footboard: [0, 0.95, C1 + 0.3] };
  pole(b, id, C1 + 0.05, 0.8, 2.6, "paint-field", true);
  // the wire-net rack behind the cushion: corner posts, a top frame, the net over its sides and back; what it holds
  const N0 = C0 + 0.04, N1 = 1.02, NT = 1.57, NX = 0.53;
  for (const x of [-NX, NX]) for (const z of [N0, N1]) b.add("iron", rod([x, CT, z], [x, NT, z], 0.01));
  for (const x of [-NX, NX]) b.add("iron", rod([x, NT, N0], [x, NT, N1], 0.01));
  for (const z of [N0, N1]) b.add("iron", rod([-NX, NT, z], [NX, NT, z], 0.01));
  for (const x of [-NX, NX]) {
    for (let k = 1; k < 6; k++) { const z = N0 + ((N1 - N0) * k) / 6; b.add("iron", rod([x, CT, z], [x, NT, z], 0.004)); }
    for (let k = 1; k < 4; k++) { const y = CT + ((NT - CT) * k) / 4; b.add("iron", rod([x, y, N0], [x, y, N1], 0.004)); }
  }
  for (let k = 1; k < 8; k++) { const x = -NX + (2 * NX * k) / 8; b.add("iron", rod([x, CT, N0], [x, NT, N0], 0.004)); }
  for (let k = 1; k < 4; k++) { const y = CT + ((NT - CT) * k) / 4; b.add("iron", rod([-NX, y, N0], [NX, y, N0], 0.004)); }
  b.add("canvas-field", rod([-0.48, CT + 0.16, N1 - 0.19], [0.48, CT + 0.16, N1 - 0.19], 0.15));
  for (const x of [-0.3, 0.3]) b.add("leather", turn([[0.15, -0.02], [0.158, -0.02], [0.158, 0.02], [0.15, 0.02]], 20).rotate(0, 0, 90).move(x, CT + 0.16, N1 - 0.19));
  b.add("leather", rbox(0.42, 0.3, 0.3, 0.05, -0.24, CT, N0 + 0.2));
  b.add("wood-grey", rbox(0.44, 0.24, 0.34, 0.01, 0.24, CT, N0 + 0.21));
  // ── the kitchen wagon: its frame on the axle, the casing, its bands and seams, the lid catches, the taps
  const K1 = -0.36, K0 = -1.79, KB = 0.63, KT = 1.32, KW = 1.0, KM = (K0 + K1) / 2, x2 = KW / 2 + 0.003;
  for (const x of [-0.42, 0.42]) b.add("iron", box(0.07, 0.08, K1 - K0 + 0.1, x, 0.56, KM));
  b.add("paint-field", rbox(KW, KT - KB, K1 - K0, 0.025, 0, KB, KM));
  for (const s of [-1, 1]) {
    b.add("iron", box(0.012, 0.03, K1 - K0 + 0.01, s * x2, KT - 0.06, KM), box(0.012, 0.03, K1 - K0 + 0.01, s * x2, KB + 0.04, KM));
    for (const z of [K1 - 0.04, K1 - 0.42, K0 + 0.04]) b.add("iron", box(0.012, KT - KB - 0.1, 0.03, s * x2, KB + 0.05, z));
    for (const z of [K0 + 0.2, ZK, K1 - 0.15]) b.add("iron", box(0.03, 0.06, 0.05, s * (KW / 2 + 0.012), KT - 0.05, z));
    const tx = s * (KW / 2 + 0.07);
    b.add("steel-bright", rod([s * KW / 2, 0.78, ZK - 0.05], [tx, 0.78, ZK - 0.05], 0.014), rod([tx, 0.78, ZK - 0.05], [tx, 0.71, ZK - 0.05], 0.012), box(0.012, 0.012, 0.08, tx, 0.8, ZK - 0.05));
  }
  b.add("iron", box(KW + 0.006, 0.03, 0.012, 0, KT - 0.06, K0 - 0.003), box(KW + 0.006, 0.03, 0.012, 0, KT - 0.06, K1 + 0.003));
  // the kettle's bright flange and its lid, clamped by six T-screws, the hinge on the far side, the handle
  b.add("steel-bright", turn([[0.31, 0], [0.38, 0], [0.38, 0.02], [0.31, 0.02]], 40).move(0, KT, ZK));
  b.add("iron", turn([[0, 0], [0.335, 0], [0.335, 0.02], [0.29, 0.05], [0.07, 0.07], [0, 0.07]], 40).move(0, KT + 0.02, ZK));
  for (let k = 0; k < 6; k++) {
    const a = ((k + 0.5) * Math.PI) / 3, p: V3 = [0.355 * Math.cos(a), KT + 0.02, ZK + 0.355 * Math.sin(a)], q: V3 = [p[0], KT + 0.075, p[2]];
    b.add("iron", rod(p, q, 0.007), rod([q[0] - 0.03 * Math.sin(a), q[1], q[2] + 0.03 * Math.cos(a)], [q[0] + 0.03 * Math.sin(a), q[1], q[2] - 0.03 * Math.cos(a)], 0.007));
  }
  b.add("iron", box(0.05, 0.04, 0.16, -0.36, KT + 0.02, ZK));
  b.add("iron", rod([-0.12, KT + 0.13, ZK], [0.12, KT + 0.13, ZK], 0.01), rod([-0.12, KT + 0.085, ZK], [-0.12, KT + 0.13, ZK], 0.008), rod([0.12, KT + 0.085, ZK], [0.12, KT + 0.13, ZK], 0.008));
  // the locker behind the kettle; before it the coffee kettle's square lid with its handle
  b.add("iron", box(0.92, 0.025, 0.2, 0, KT, K0 + 0.12), rod([-0.15, KT + 0.04, K0 + 0.04], [0.15, KT + 0.04, K0 + 0.04], 0.008));
  b.add("iron", rbox(0.42, 0.03, 0.36, 0.01, 0.17, KT, -0.6), rod([0.05, KT + 0.07, -0.6], [0.29, KT + 0.07, -0.6], 0.009));
  for (const x of [0.05, 0.29]) b.add("iron", rod([x, KT + 0.03, -0.6], [x, KT + 0.07, -0.6], 0.008));
  // the chimney at the front corner: its collar on the casing, the pipe with a band at the mouth, the handle
  const CH: V3 = [-0.3, KT, -0.56], top = 2.19 - KT;
  b.add("iron", turn([[0, 0], [0.13, 0], [0.13, 0.05], [0.098, 0.08], [0, 0.08]], 20).move(...CH));
  b.add("iron", turn([[0.08, 0.06], [0.09, 0.06], [0.09, top - 0.06], [0.1, top - 0.055], [0.1, top], [0.08, top]], 20).move(...CH));
  b.add("iron", rod([CH[0] - 0.09, KT + 0.5, CH[2]], [CH[0] - 0.16, KT + 0.53, CH[2]], 0.008), rod([CH[0] - 0.16, KT + 0.53, CH[2]], [CH[0] - 0.16, KT + 0.67, CH[2]], 0.008), rod([CH[0] - 0.16, KT + 0.67, CH[2]], [CH[0] - 0.09, KT + 0.7, CH[2]], 0.008));
  // the front: the fire door with its latch, the can hung on its bracket at the near side
  b.add("iron", box(0.32, 0.24, 0.02, -0.2, 0.77, K1 + 0.008), rod([-0.32, 0.89, K1 + 0.03], [-0.08, 0.89, K1 + 0.03], 0.008), box(0.34, 0.05, 0.02, -0.2, 0.69, K1 + 0.008));
  const CN: V3 = [0.3, 0.84, K1 + 0.15];
  b.add("iron", box(0.04, 0.03, 0.16, CN[0], 1.04, K1 + 0.07));
  b.add("paint-field", turn([[0, 0], [0.12, 0], [0.12, 0.28], [0.105, 0.3], [0, 0.3]], 20).move(...CN));
  b.add("iron", turn([[0, 0.3], [0.112, 0.3], [0.112, 0.325], [0.03, 0.34], [0, 0.34]], 20).move(...CN));
  b.add("iron", rod([CN[0] - 0.12, CN[1] + 0.26, CN[2]], [CN[0], CN[1] + 0.42, CN[2]], 0.006), rod([CN[0], CN[1] + 0.42, CN[2]], [CN[0] + 0.12, CN[1] + 0.26, CN[2]], 0.006));
  // the short pole forward to the limber's hook, the two stays from the casing's foot, the prop folded under it
  b.add("paint-field", rod([0, 0.73, K1], [0, 0.73, C0 - 0.08], 0.035));
  b.add("iron", turn([[0.04, -0.02], [0.06, -0.02], [0.06, 0.02], [0.04, 0.02]], 14).move(0, 0.73, C0 - 0.08));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.42, 0.6, K1], [0, 0.72, K1 + 0.45], 0.016));
  b.add("iron", rod([0, 0.68, K1 + 0.1], [0, 0.68, K1 + 0.6], 0.015), box(0.08, 0.02, 0.06, 0, 0.66, K1 + 0.62));
  // the step at the back on its two irons
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.22, KB + 0.05, K0], [s * 0.22, 0.32, K0 - 0.12], 0.012));
  b.add("wood-grey", box(0.5, 0.03, 0.16, 0, 0.32, K0 - 0.12));
  return muddy(b.parts(), splashMask(1.9, 4.4, 0.3, 0.75, 7), "mud-road", ["paint-field"]);
}

/** The army's box wagon, after the field wagon a signals unit drew up in 1914 (Bundesarchiv Bild 146-1987-019-27) and
 *  the heavy field wagon Hf. 2 kept at Dresden (photographs on Commons), which carried the old wagon's build on: a
 *  plank box whose sides flare outward, stakes outside them, iron braces at the ends, a top rail with rings for the
 *  tilt's lashings; the driver's box raised at the front with its lid, footboard and dash, an iron backrest rail; the
 *  tilt on five hoops, its back drawn round a small opening; under it the front axle on a turntable, the hounds and
 *  pole, the perch to the rear axle, the screw brake with its crank at the near rear corner and shoes on the rear
 *  tyres, the drag shoe and a feed bucket hung under the back. Front wheels 0.94 m, rear 1.20 m, track 1.53 m. */
function armyWagon(id: string): Part[] {
  const b = new Build(), T = 1.53, RF = 0.47, RR = 0.6, ZF = 1.3, ZR = -1.3;
  axle(b, id, RF, ZF, T, 0.08, 12, "paint-field", { felloe: 0.065 });
  axle(b, id, RR, ZR, T, 0.08, 14, "paint-field", { felloe: 0.065 });
  // ── the carriage: axle beds, the turntable and bolsters, the sills under the box, the perch, hounds, the kingpin
  const FL = 0.88, Z0 = -1.78, Z1 = 0.78, ZS = 1.24;
  b.add("paint-field", box(1.42, 0.1, 0.12, 0, RF - 0.05, ZF), box(1.2, 0.1, 0.12, 0, RF + 0.05, ZF), box(1.1, 0.13, 0.12, 0, RF + 0.17, ZF));
  b.add("iron", turn([[0.37, 0], [0.41, 0], [0.41, 0.016], [0.37, 0.016]], 32).move(0, RF + 0.15, ZF), rod([0, RF - 0.08, ZF], [0, FL - 0.02, ZF], 0.018));
  b.add("paint-field", box(1.42, 0.1, 0.12, 0, RR - 0.05, ZR), box(1.12, 0.13, 0.12, 0, RR + 0.05, ZR));
  for (const x of [-0.38, 0.38]) b.add("paint-field", box(0.09, FL - RR - 0.18, ZS - Z0 + 0.1, x, RR + 0.18, (Z0 + ZS) / 2));
  b.add("paint-field", rod([0, RF + 0.02, ZF], [0, RR - 0.02, ZR - 0.32], 0.04));
  for (const s of [-1, 1]) b.add("paint-field", rod([0, RR - 0.04, ZR + 0.75], [s * 0.6, RR - 0.02, ZR], 0.03), rod([s * 0.12, RF - 0.03, ZF + 0.45], [s * 0.55, RF - 0.03, ZF], 0.032), rod([s * 0.55, RF - 0.03, ZF], [s * 0.22, RF - 0.05, ZF - 0.5], 0.028));
  b.add("paint-field", rod([-0.3, RF - 0.05, ZF - 0.5], [0.3, RF - 0.05, ZF - 0.5], 0.028));
  pole(b, id, ZF + 0.45, RF - 0.03, 3.0, "paint-field", true);
  // ── the box: the floor, the side planks leaning out (0.50 m at the floor to 0.65 m at the rail), the end boards
  const H = 0.56, TOP = FL + H, X0 = 0.5, X1 = 0.65, lean = (X1 - X0) / H, ang = (Math.atan(lean) * 180) / Math.PI, L = Z1 - Z0, ZM = (Z0 + Z1) / 2;
  const xAt = (y: number) => X0 + (y - FL) * lean;
  b.add("paint-field", box(2 * X0, 0.04, L, 0, FL, ZM));
  const NB = 5, bh = H / NB;
  for (const s of [-1, 1]) for (let k = 0; k < NB; k++) {
    const yc = FL + (k + 0.5) * bh;
    b.add("paint-field", manifold.box(0.024, bh - 0.007, L).rotate(0, 0, -s * ang).move(s * (xAt(yc) + 0.012), yc, ZM));
  }
  const endBoards = (z: number) => { for (let k = 0; k < NB; k++) { const ya = FL + k * bh, yb = ya + bh - 0.007; b.add("paint-field", along([[-xAt(ya), ya], [xAt(ya), ya], [xAt(yb), yb], [-xAt(yb), yb]], z, z + 0.024)); } };
  endBoards(Z0); endBoards(Z1 - 0.024);
  // the sills, the top rails and the end caps; the stakes outside the planks; the iron braces at each end; the rings
  for (const s of [-1, 1]) {
    b.add("paint-field", box(0.07, 0.09, L + 0.04, s * (X0 + 0.02), FL - 0.06, ZM));
    b.add("paint-field", manifold.box(0.055, 0.05, L + 0.06).rotate(0, 0, -s * ang).move(s * (X1 + 0.02), TOP - 0.02, ZM));
    const zs = [Z0 + 0.03, Z0 + 0.55, Z0 + 1.05, Z0 + 1.55, Z0 + 2.05, Z1 - 0.03];
    for (const z of zs) {
      b.add("paint-field", manifold.box(0.035, H + 0.06, 0.06).rotate(0, 0, -s * ang).move(s * (xAt(FL + H / 2) + 0.04), FL + H / 2 - 0.02, z));
      b.add("iron", box(0.03, 0.04, 0.075, s * (X0 + 0.05), FL - 0.05, z));
    }
    for (const [za, zb] of [[Z0 + 0.06, Z0 + 0.53], [Z1 - 0.06, Z1 - 0.53]]) b.add("iron", rod([s * (xAt(FL + 0.05) + 0.03), FL + 0.05, zb], [s * (xAt(TOP - 0.06) + 0.03), TOP - 0.06, za], 0.011));
    for (let k = 0; k < 7; k++) b.add("iron", turnX([[0.016, -0.004], [0.022, -0.004], [0.022, 0.004], [0.016, 0.004]], 8).move(s * (xAt(1.28) + 0.03), 1.28, Z0 + 0.2 + k * 0.36));
  }
  for (const z of [Z0 - 0.01, Z1 + 0.01]) b.add("paint-field", box(2 * X1 + 0.06, 0.05, 0.05, 0, TOP - 0.05, z), box(2 * X0 + 0.06, 0.08, 0.05, 0, FL - 0.06, z));
  // the tailboard's chains and hooks
  for (const s of [-1, 1]) { b.add("iron", rod([s * (X1 - 0.02), TOP - 0.06, Z0 - 0.03], [s * 0.45, TOP - 0.2, Z0 - 0.04], 0.006), turnX([[0.012, -0.004], [0.018, -0.004], [0.018, 0.004], [0.012, 0.004]], 8).move(s * 0.45, TOP - 0.22, Z0 - 0.04)); }
  // ── the driver's box at the front: its flared sides, the front leaning forward, the lid and hasp, cushion, footboard,
  //    the dash and the backrest rail
  const SY = 1.6, sx = (y: number) => xAt(Math.min(y, TOP)) - 0.04;
  const seat = manifold.hull([[-sx(FL), FL, Z1], [sx(FL), FL, Z1], [-sx(FL), FL, ZS - 0.1], [sx(FL), FL, ZS - 0.1], [-sx(SY), SY, Z1], [sx(SY), SY, Z1], [-sx(SY), SY, ZS], [sx(SY), SY, ZS]]);
  b.add("paint-field", seat, box(2 * sx(SY) + 0.03, 0.03, ZS - Z1 + 0.03, 0, SY, (Z1 + ZS) / 2));
  b.add("iron", box(0.05, 0.1, 0.012, 0, SY - 0.14, ZS - 0.012), turn([[0.012, -0.004], [0.02, -0.004], [0.02, 0.004], [0.012, 0.004]], 8).rotate(90, 0, 0).move(0, SY - 0.15, ZS - 0.01));
  b.add("leather", rbox(2 * sx(SY) - 0.08, 0.07, 0.4, 0.03, 0, SY + 0.03, (Z1 + ZS) / 2 - 0.02));
  b.add("paint-field", manifold.box(1.05, 0.03, 0.5).rotate(-20, 0, 0).move(0, 1.2, ZS + 0.24), box(1.05, 0.34, 0.03, 0, 1.2, ZS + 0.48));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.5, 1.02, ZS - 0.04], [s * 0.5, 1.12, ZS + 0.47], 0.012), rod([s * 0.5, 1.5, ZS + 0.49], [s * 0.53, 1.6, ZS + 0.52], 0.01));
  b.add("iron", rod([-0.53, 1.6, ZS + 0.52], [0.53, 1.6, ZS + 0.52], 0.01));
  for (const s of [-1, 1]) b.add("iron", rod([s * (sx(SY) - 0.02), SY + 0.03, Z1 + 0.04], [s * (sx(SY) - 0.02), SY + 0.3, Z1 - 0.02], 0.012));
  b.add("iron", rod([-(sx(SY) - 0.02), SY + 0.3, Z1 - 0.02], [sx(SY) - 0.02, SY + 0.3, Z1 - 0.02], 0.012));
  HITCH[id] = { ...HITCH[id], seat: [0, SY + 0.1, (Z1 + ZS) / 2], footboard: [0, 1.28, ZS + 0.3] };
  // ── the tilt on five hoops from the box's back to the driver's box: canvas over them, its edge lashed to the rings,
  //    the back drawn round a small opening
  const TX = X1 + 0.06, TS = 1.95, TR = 0.42, TZ0 = Z0 - 0.06, TZ1 = Z1 - 0.03;
  const shell = (r: number, th: number, z0: number, z1: number) => {
    const ro = TX + r, ri = ro - th, yo = TR + r, yi = yo - th, p: P2[] = [[ro, TOP - 0.1]];
    for (let k = 0; k <= 12; k++) { const a = (Math.PI * k) / 12; p.push([ro * Math.cos(a), TS + yo * Math.sin(a)]); }
    p.push([-ro, TOP - 0.1], [-ri, TOP - 0.1]);
    for (let k = 12; k >= 0; k--) { const a = (Math.PI * k) / 12; p.push([ri * Math.cos(a), TS + yi * Math.sin(a)]); }
    p.push([ri, TOP - 0.1]);
    return along(p, z0, z1);
  };
  b.add("canvas-field", shell(0, 0.012, TZ0, TZ1));
  for (let k = 0; k < 5; k++) { const z = TZ0 + 0.06 + ((TZ1 - TZ0 - 0.12) * k) / 4; b.add("canvas-field", shell(0.008, 0.02, z - 0.025, z + 0.025)); }
  const fill: P2[] = [[TX, TOP - 0.1]];
  for (let k = 0; k <= 12; k++) { const a = (Math.PI * k) / 12; fill.push([TX * Math.cos(a), TS + TR * Math.sin(a)]); }
  fill.push([-TX, TOP - 0.1]);
  b.add("canvas-field", along(fill, TZ0 - 0.012, TZ0).minus(zAxis(turn([[0, -0.05], [0.17, -0.05], [0.17, 0.05], [0, 0.05]], 18)).move(0, TS + 0.05, TZ0)));
  b.add("iron", zAxis(turn([[0.17, -0.008], [0.19, -0.008], [0.19, 0.008], [0.17, 0.008]], 18)).move(0, TS + 0.05, TZ0 - 0.014));
  for (const s of [-1, 1]) for (let k = 0; k < 7; k++) { const z = Z0 + 0.2 + k * 0.36; b.add("iron", rod([s * (TX - 0.004), TOP - 0.095, z], [s * (xAt(1.28) + 0.03), 1.3, z], 0.005)); }
  // ── the screw brake: the beam before the rear wheels, shoes on the tyres, the spindle and crank at the near corner
  const bz = ZR + Math.sqrt(RR * RR - (RR - 0.42) ** 2) + 0.04;
  b.add("iron", rod([-0.82, 0.42, bz], [0.82, 0.42, bz], 0.022));
  for (const s of [-1, 1]) b.add("wood-grey", box(0.08, 0.2, 0.05, s * (T / 2), 0.32, bz - 0.02));
  for (const x of [-0.38, 0.38]) b.add("iron", rod([x, RR + 0.18, bz], [x, 0.43, bz], 0.012));
  b.add("iron", rod([0.73, 0.42, bz], [0.73, TOP + 0.02, bz + 0.05], 0.014), rod([0.73, TOP + 0.02, bz + 0.05], [0.73, TOP + 0.02, bz + 0.2], 0.01), rod([0.73, TOP + 0.02, bz + 0.2], [0.73, TOP + 0.1, bz + 0.2], 0.012));
  // ── hung under the back: the drag shoe on its chain beside the near rear wheel, the feed bucket
  b.add("iron", rod([X0 - 0.05, FL - 0.08, ZR + 0.3], [X0 + 0.08, 0.22, ZR + 0.42], 0.006), box(0.1, 0.06, 0.32, X0 + 0.08, 0.13, ZR + 0.42));
  b.add("iron", turn([[0, 0], [0.12, 0], [0.15, 0.24], [0.14, 0.24], [0.11, 0.015], [0, 0.015]], 16).move(-0.36, 0.42, Z0 + 0.15), rod([-0.51, 0.66, Z0 + 0.15], [-0.38, RR + 0.18, Z0 + 0.15], 0.006), rod([-0.21, 0.66, Z0 + 0.15], [-0.38, RR + 0.18, Z0 + 0.15], 0.006));
  return muddy(b.parts(), splashMask(1.85, 4.6, 0.3, 0.8, 9), "mud-road", ["paint-field"]);
}

/** The 7.7 cm field gun 96 n.A., after the Bovington Tank Museum's gun (photographs on Commons) and its published
 *  figures (77 mm, the barrel L/27 = 2.08 m, wheels 1.36 m on a 1.53 m track, a 4 mm shield): the barrel tapering
 *  from its breech ring to a swelled muzzle, its bore open; the sliding wedge breech; the cradle with the recoil
 *  cylinder slung under the barrel, on trunnions between the trail's cheeks; the elevating arc and handwheel and the
 *  sight on the left; the shield, one riveted plate with its top folded forward, an arch for the barrel, a sight
 *  window and a hatch, the apron hung below the axle; two seats on the axle facing back; brake shoes on the tyres; the
 *  box trail tapering to its spade and towing eye, with lifting handles and the handspike. Origin under the axle, the
 *  muzzle to +z, the spade on the ground at -z; the gunlayer's left is +x. */
function fieldGun(id: string): Part[] {
  const b = new Build(), T = 1.53, R = 0.68, AY = R, BY = AY + 0.34, Z0 = -0.75, TZ = -0.08;
  axle(b, id, R, 0, T, 0.075, 12, "paint-field", { felloe: 0.07, hub: 0.11 });
  // ── the barrel (hollow, its bore open at the muzzle), the breech ring with the wedge through it, the lever
  b.add("gun-grey", zAxis(turn([[0.0385, 0], [0.1, 0], [0.1, 0.3], [0.088, 0.34], [0.085, 0.95], [0.063, 1.2], [0.056, 1.94], [0.066, 1.97], [0.066, 2.05], [0.06, 2.08], [0.0385, 2.08]], 28)).move(0, BY, Z0));
  b.add("gun-grey", box(0.32, 0.14, 0.11, -0.05, BY - 0.07, Z0 + 0.12), rod([-0.21, BY, Z0 + 0.12], [-0.27, BY + 0.06, Z0 - 0.02], 0.012));
  b.add("iron", rod([-0.27, BY + 0.06, Z0 - 0.02], [-0.27, BY + 0.06, Z0 - 0.08], 0.018));
  // ── the cradle under the barrel: its body with the recoil cylinder, the slides along its top, the front cap
  const CY = BY - 0.165, cr: P2[] = [[-0.085, -0.09], [0.085, -0.09], [0.1, -0.07], [0.1, 0.05], [0.085, 0.075], [-0.085, 0.075], [-0.1, 0.05], [-0.1, -0.07]];
  b.add("paint-field", along(cr.map(([x, y]) => [x, y + CY] as P2), Z0 + 0.2, 0.95));
  b.add("paint-field", zAxis(turn([[0, 0], [0.075, 0], [0.075, 0.03], [0.05, 0.05], [0, 0.05]], 20)).move(0, CY - 0.01, 0.95));
  for (const s of [-1, 1]) b.add("iron", box(0.02, 0.025, 1.1, s * 0.05, CY + 0.07, Z0 + 0.8));
  // ── the trail's cheeks rising from the axle to the trunnions; the elevating arc and its handwheel; the sight
  for (const s of [-1, 1]) {
    b.add("paint-field", side([[0.14, AY - 0.07], [-0.5, AY - 0.07], [-0.5, AY + 0.05], [-0.22, CY - 0.02], [0.06, CY - 0.02], [0.14, AY + 0.1]], 0.022).move(s * 0.135, 0, 0));
    b.add("iron", zAxis(turn([[0, -0.02], [0.05, -0.02], [0.05, 0.02], [0, 0.02]], 14)).rotate(0, 90, 0).move(s * 0.15, CY + 0.01, TZ));
  }
  const arc: P2[] = [];
  for (let k = 0; k <= 10; k++) { const a = Math.PI * (1.05 + 0.4 * k / 10); arc.push([TZ + 0.34 * Math.cos(a), CY + 0.34 * Math.sin(a)]); }
  for (let k = 10; k >= 0; k--) { const a = Math.PI * (1.05 + 0.4 * k / 10); arc.push([TZ + 0.27 * Math.cos(a), CY + 0.27 * Math.sin(a)]); }
  b.add("iron", side(arc, 0.025).move(0.07, 0, 0));
  b.add("iron", turnX([[0.1, -0.008], [0.12, -0.008], [0.12, 0.008], [0.1, 0.008]], 18).move(0.3, AY + 0.17, -0.45), rod([0.15, AY + 0.17, -0.45], [0.3, AY + 0.17, -0.45], 0.012));
  for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; b.add("iron", rod([0.3, AY + 0.17, -0.45], [0.3, AY + 0.17 + 0.11 * Math.cos(a), -0.45 + 0.11 * Math.sin(a)], 0.006)); }
  b.add("iron", rod([0.14, CY, -0.3], [0.2, BY + 0.2, -0.3], 0.014), zAxis(turn([[0, 0], [0.03, 0], [0.03, 0.12], [0, 0.12]], 12)).rotate(-90, 0, 0).move(0.2, BY + 0.2, -0.3), box(0.1, 0.06, 0.08, 0.2, BY + 0.32, -0.3));
  // ── the shield: one plate with its top folded forward, the barrel's arch, the sight window, a hatch, rivets round
  //    its edges; braces back to the axle; the apron below
  const SZ = 0.17, SW = 1.34, S0 = AY - 0.06, S1 = 1.52;
  const archCut = manifold.hull(box(0.3, 0.01, 0.1, 0, CY - 0.1, SZ), ...[0, 1, 2, 3, 4, 5, 6].map((k) => { const a = (Math.PI * k) / 6; return manifold.box(0.01, 0.01, 0.1).move(0.15 * Math.cos(a), BY + 0.12 + 0.15 * Math.sin(a), SZ); }));
  b.add("paint-field", box(SW, S1 - S0, 0.006, 0, S0, SZ).minus(archCut).minus(box(0.15, 0.1, 0.1, 0.33, BY + 0.14, SZ)));
  b.add("paint-field", box(SW, 0.008, 0.06, 0, S1 - 0.008, SZ + 0.03), box(0.24, 0.17, 0.008, -0.36, BY + 0.12, SZ + 0.006));
  const rivets: V3[] = [];
  for (let k = 0; k <= 13; k++) rivets.push([-SW / 2 + 0.03 + (k * (SW - 0.06)) / 13, S1 - 0.035, SZ + 0.004]);
  for (const s of [-1, 1]) for (let k = 0; k <= 7; k++) rivets.push([s * (SW / 2 - 0.03), S0 + 0.04 + (k * (S1 - S0 - 0.1)) / 7, SZ + 0.004]);
  b.add("iron", ...rivets.map((p) => sph(0.009, 8).move(...p)));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.5, S1 - 0.2, SZ - 0.004], [s * 0.42, AY + 0.04, -0.04], 0.016), rod([s * 0.6, AY + 0.0, SZ - 0.004], [s * 0.55, AY - 0.03, 0.0], 0.016));
  b.add("paint-field", box(1.18, 0.36, 0.006, 0, AY - 0.44, SZ + 0.02), rod([-0.59, AY - 0.08, SZ + 0.02], [0.59, AY - 0.08, SZ + 0.02], 0.012));
  // ── two seats on the axle facing back, their backs to the shield, footrests below; brake shoes on the tyres
  for (const s of [-1, 1]) {
    b.add("leather", rbox(0.28, 0.06, 0.24, 0.025, s * 0.43, AY + 0.1, -0.14), rbox(0.28, 0.22, 0.04, 0.02, s * 0.43, AY + 0.14, -0.01));
    b.add("iron", rod([s * 0.43, AY + 0.02, 0], [s * 0.43, AY + 0.1, -0.14], 0.016), box(0.24, 0.015, 0.16, s * 0.43, 0.36, -0.38), rod([s * 0.43, 0.38, -0.3], [s * 0.43, AY - 0.02, -0.05], 0.012));
    const sh = s * (T / 2), sz = -Math.sqrt(R * R - (R - 0.42) ** 2) - 0.03;
    b.add("iron", box(0.09, 0.2, 0.04, sh, 0.32, sz), rod([sh, 0.42, sz + 0.02], [s * 0.6, 0.62, -0.25], 0.012));
  }
  b.add("iron", rod([-0.6, 0.62, -0.25], [0.6, 0.62, -0.25], 0.014), rod([0.1, 0.62, -0.25], [0.1, 0.62, -0.9], 0.01));
  // ── the box trail: a channel open on top, tapering from the axle down to the spade; the spade, the towing eye, the
  //    lifting handles and the handspike
  const tr = (z: number, w: number, y: number, h: number) => [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [sx * w, y + sy * h, z] as V3));
  const outer = manifold.hull([...tr(-0.35, 0.17, AY - 0.04, 0.11), ...tr(-2.85, 0.09, 0.24, 0.06)]);
  const inner = manifold.hull([...tr(-0.3, 0.15, AY + 0.03, 0.11), ...tr(-2.75, 0.07, 0.31, 0.06)]);
  b.add("paint-field", outer.minus(inner));
  b.add("iron", manifold.hull([[-0.27, 0.2, -2.8], [0.27, 0.2, -2.8], [-0.25, 0.02, -2.97], [0.25, 0.02, -2.97], [-0.27, 0.2, -2.83], [0.27, 0.2, -2.83], [-0.25, 0.0, -3.0], [0.25, 0.0, -3.0]]));
  b.add("iron", turn([[0.04, -0.025], [0.075, -0.025], [0.075, 0.025], [0.04, 0.025]], 18).move(0, 0.3, -3.0), rod([0, 0.3, -2.86], [0, 0.3, -2.93], 0.03));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.1, 0.32, -2.45], [s * 0.26, 0.38, -2.45], 0.014), rod([s * 0.26, 0.38, -2.45], [s * 0.26, 0.38, -2.65], 0.014), rod([s * 0.26, 0.38, -2.65], [s * 0.1, 0.3, -2.65], 0.014));
  b.add("wood-varnish", rod([0, 0.38, -2.2], [0, 0.42, -3.15], 0.022));
  return muddy(b.parts(), splashMask(1.8, 4.4, 0.25, 0.55, 11), "mud-road", ["paint-field"]);
}

/** Its limber: the ammunition chest (rounded, its lid's iron edge, corner straps, handles), the gunners' seat on the
 *  lid with its rail, the footboard, the pintle for the trail's eye, the pole for six. */
function gunLimber(id: string): Part[] {
  const b = new Build(), T = 1.53, R = 0.68;
  axle(b, id, R, 0, T, 0.075, 12, "paint-field", { felloe: 0.07, hub: 0.11 });
  b.add("paint-field", rbox(1.35, 0.66, 0.85, 0.03, 0, 0.82, 0));
  b.add("iron", box(1.37, 0.03, 0.87, 0, 1.44, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.add("iron", box(0.012, 0.66, 0.06, sx * 0.681, 0.82, sz * 0.38), box(0.06, 0.66, 0.012, sx * 0.64, 0.82, sz * 0.431));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.687, 1.1, -0.18], [s * 0.72, 1.1, -0.15], 0.01), rod([s * 0.72, 1.1, -0.15], [s * 0.72, 1.1, 0.15], 0.01), rod([s * 0.72, 1.1, 0.15], [s * 0.687, 1.1, 0.18], 0.01));
  for (const x of [-0.4, 0, 0.4]) b.add("iron", box(0.06, 0.1, 0.015, x, 1.36, 0.431));
  b.add("leather", rbox(1.3, 0.07, 0.36, 0.03, 0, 1.47, -0.12));
  b.add("iron", rod([-0.65, 1.72, -0.32], [0.65, 1.72, -0.32], 0.012), ...[-1, 1].map((s) => rod([s * 0.65, 1.47, -0.32], [s * 0.65, 1.72, -0.32], 0.012)));
  b.add("wood-grey", box(1.4, 0.03, 0.35, 0, 0.62, 0.62).rotate(-20, 0, 0).move(0, 0.15, 0.2));
  b.add("iron", box(0.06, 0.06, 0.6, 0, 0.6, -0.65), turnX([[0.04, -0.04], [0.06, -0.04], [0.06, 0.04], [0.04, 0.04]], 12).move(0, 0.6, -0.95), rod([0, 0.6, -0.95], [0, 0.78, -0.95], 0.02));
  pole(b, id, 0.45, 0.66, 3.0, "paint-field", true);
  return muddy(b.parts(), splashMask(1.8, 4.4, 0.25, 0.55, 12), "mud-road", ["paint-field"]);
}

const P = (id: string, items: string[], size: V3, tris: number, f: (id: string) => Part[]) => prop({ id, items, size, place: "floor", where: "set", tris, parts: () => f(id) });
P("lorry-3t", ["army-lorry"], [2.3, 2.8, 6.6], 70000, (id) => lorry(id, false));
P("lorry-3t-tilt", ["army-lorry"], [2.3, 2.8, 6.6], 75000, (id) => lorry(id, true));
P("kitchen-field", ["field-kitchen"], [1.85, 2.2, 6.7], 35000, kitchen);
P("wagon-army", ["army-wagon"], [1.85, 2.8, 7.0], 30000, armyWagon);
P("gun-fk96", ["field-gun"], [1.75, 1.75, 4.6], 30000, fieldGun);
P("limber-gun", ["field-gun"], [1.75, 1.8, 4.3], 25000, gunLimber);

export const KIT_MILITARY = true;
