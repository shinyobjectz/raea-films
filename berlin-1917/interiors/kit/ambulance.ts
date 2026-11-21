// The army's motor ambulance (Sanitätskraftwagen) of 1914-18, after a photograph of a NAG of about 1914 serving with a
// Sanitäts-Kraftwagen-Abteilung (a postcard; reference only): a round-nosed bonnet before a wide dash, an open-sided
// cab under the body's roof run forward as a canopy over a glazed windscreen, a tall closed body for four stretchers
// ("geschlossene Holzaufbauten, in dem vier Liegen Platz fanden": Vestes Bellica, Kraftfahrzeugtruppe), the red cross
// on a white disc on each side, two louvred vents high on each side, a rail round the roof, wooden artillery wheels on
// pneumatic tyres, carbide side lamps on the windscreen posts. In the vehicle frame of kit/vehicles.ts.
// ASSUMED (not measured): wheelbase 3.2 m, track 1.4 m, wheels 0.88 m; the body 1.84 m wide and 2.45 m to its crown,
// sized against the men standing by it; the rear doors with the cross above them, the bench and the levers, which the
// photograph doesn't show. No unit markings or number (military.ts: none until a photograph shows Berlin's).
import { manifold } from "raea/3d";
import { box, rbox, type V3 } from "./geo";
import { along, type P2, plan, side, slat, smooth, sweepSheet, turn, turnX, zAxis } from "./forms";
import { artilleryAt, BLACK, crown, frame, frontAxle, hullAlong, lamp, NICKEL, PAINT, rearAxle, wingLine } from "./carparts";
import { muddy, rod, splashMask } from "./outgeo";
import { prop } from "./prop";
import { Build } from "./vehicles";

const R = 0.44, TY = 0.055, X = 0.7, ZF = 1.6, ZR = -1.6;
/** The body's back and front, its half width, sill and eaves; the canopy's front; the windscreen. */
const BB = -2.55, BF = 0.15, HW = 0.92, SILL = 0.96, EAVES = 2.35, CAN = 1.2, WS = 1.0;

/** The running gear: four artillery wheels, the frame on its springs, the sump and gearbox, the cardan, the starting
 *  handle, the silencer and its pipes. */
function chassis(b: Build, id: string) {
  for (const s of [-1, 1]) for (const z of [ZF, ZR]) artilleryAt(b, id, [s * X, R, z], R, TY);
  frame(b, -2.45, 1.95, [-2.4, -1.0, 0.3, 1.5]);
  frontAxle(b, ZF, R, X - 0.08, [-0.42, 0.68, 1.2]);
  rearAxle(b, ZR, R, X - 0.14, [0, 0.55, 0.4], 1.15, ZR);
  b.add("zinc", box(0.44, 0.16, 0.7, 0, 0.47, 1.55), box(0.3, 0.2, 0.4, 0, 0.45, 0.6));
  b.add(BLACK, rod([0, 0.6, 2.2], [0, 0.6, 2.37], 0.014), rod([0, 0.6, 2.37], [0.09, 0.5, 2.37], 0.012));
  b.add("iron", zAxis(turn([[0, -0.32], [0.075, -0.32], [0.085, -0.25], [0.085, 0.25], [0.075, 0.32], [0, 0.32]], 16)).move(0.26, 0.45, -0.55));
  b.add("iron", rod([0.3, 0.56, 1.3], [0.26, 0.45, -0.23], 0.022), rod([0.26, 0.45, -0.87], [0.3, 0.42, -2.6], 0.022));
}

/** The front: the round-nosed bonnet with its hinge, the radiator shell narrowing to a round core in a nickel ring,
 *  the filler cap, two headlamps on their brackets, the wide dash rising to the windscreen with a blank plate, the
 *  aprons down to the wings. */
function front(b: Build) {
  b.add(PAINT, hullAlong(crown(0.37, 0.66, 1.0, 0.13, true), 1.12, crown(0.34, 0.68, 0.98, 0.12, true), 2.12));
  b.add(BLACK, rod([0, 1.131, 1.13], [0, 1.101, 2.12], 0.007));
  for (const s of [-1, 1]) b.add(BLACK, slat([s * 0.372, 0.975, 1.13], [s * 0.342, 0.955, 2.11], 0.01, 0.006));
  const core = zAxis(turn([[0, -0.018], [0.18, -0.018], [0.18, 0.04], [0, 0.04]], 40)).move(0, 0.86, 2.26);
  b.add(PAINT, hullAlong(crown(0.36, 0.58, 0.98, 0.14, true), 2.11, crown(0.33, 0.6, 0.96, 0.11, true), 2.26).minus(core));
  b.add("zinc", zAxis(turn([[0, 0], [0.18, 0], [0.18, 0.006], [0, 0.006]], 40)).move(0, 0.86, 2.242));
  for (let k = -4; k <= 4; k++) b.add("iron", box(0.006, 2 * Math.sqrt(0.0324 - (k * 0.036) ** 2), 0.006, k * 0.036, 0.86 - Math.sqrt(0.0324 - (k * 0.036) ** 2), 2.249));
  b.add(NICKEL, zAxis(turn([[0.176, 0], [0.2, 0], [0.2, 0.012], [0.176, 0.012]], 40)).move(0, 0.86, 2.257));
  b.add(NICKEL, turn([[0, 0], [0.034, 0], [0.034, 0.025], [0.022, 0.045], [0, 0.048]], 16).move(0, 1.08, 2.19));
  for (const s of [-1, 1]) { b.add(BLACK, rod([s * 0.42, 0.6, 2.12], [s * 0.5, 0.84, 2.12], 0.014)); lamp(b, [s * 0.5, 0.93, 2.13], 0.1); }
  // the dash: the cab's width, its face sloping back to the windscreen sill; a blank plate on it in a black edge
  b.add(PAINT, side([[WS, 0.88], [1.13, 0.88], [1.13, 1.13], [WS + 0.02, 1.4], [WS, 1.4]], 2 * HW - 0.02));
  const lean = (-Math.atan2(0.11, 0.27) * 180) / Math.PI, nY = 0.377, nZ = 0.926;
  b.add("paint-white", box(0.4, 0.1, 0.008, 0, -0.05, 0).rotate(lean, 0, 0).move(0, 1.265 + 0.007 * nY, 1.075 + 0.007 * nZ));
  b.add(BLACK, box(0.43, 0.13, 0.006, 0, -0.065, 0).rotate(lean, 0, 0).move(0, 1.265 + 0.003 * nY, 1.075 + 0.003 * nZ));
  for (const s of [-1, 1]) {
    const ap: V3[] = [[s * 0.365, 0.66, 1.14], [s * 0.34, 0.68, 2.08], [s * 0.6, 0.93, 1.3], [s * 0.6, 0.92, 1.92]];
    b.add(BLACK, manifold.hull([...ap, ...ap.map((p) => [p[0], p[1] - 0.006, p[2]] as V3)]));
  }
}

/** The cab: the windscreen in two panes, its posts carrying the carbide side lamps, the floor and the steps, low side
 *  panels by the driver's legs, the bench against the body, the steering wheel on the right, the levers outside it,
 *  the curtains rolled up under the canopy. */
function cab(b: Build) {
  for (const s of [-1, 1]) b.add(PAINT, box(0.05, 2.2 - 1.4, 0.05, s * 0.88, 1.4, WS));
  for (const [y, h] of [[1.4, 0.04], [1.78, 0.035], [2.15, 0.05]]) b.add(PAINT, box(1.76, h, 0.05, 0, y, WS));
  b.add("glass-plate", box(1.72, 0.76, 0.008, 0, 1.42, WS));
  for (const s of [-1, 1]) { b.add(BLACK, rod([s * 0.88, 1.5, WS + 0.03], [s * 0.88, 1.5, WS + 0.08], 0.01)); lamp(b, [s * 0.88, 1.56, WS + 0.12], 0.065, BLACK); }
  b.add(BLACK, box(1.36, 0.21, WS - BF, 0, 0.67, (WS + BF) / 2));
  b.add("wood-grey", box(2 * HW, 0.03, WS - BF, 0, 0.88, (WS + BF) / 2));
  for (const s of [-1, 1]) {
    b.add("wood-grey", box(0.26, 0.03, 0.9, s * 0.79, 0.45, 0.55));
    b.add(BLACK, box(0.02, 0.4, 0.9, s * 0.67, 0.48, 0.55));
    for (const z of [0.25, 0.85]) b.add(BLACK, slat([s * 0.42, 0.56, z], [s * 0.74, 0.44, z], 0.04, 0.02));
    b.add(PAINT, box(0.03, 0.42, WS - 0.6, s * (HW - 0.015), 0.88, (WS + 0.6) / 2), box(0.045, 0.03, WS - 0.6, s * (HW - 0.015), 1.3, (WS + 0.6) / 2));
    b.add("canvas-field", rod([s * (HW - 0.05), 2.13, BF + 0.04], [s * (HW - 0.05), 2.13, WS - 0.06], 0.045));
    for (const z of [0.35, 0.8]) b.add(BLACK, box(0.1, 0.12, 0.025, s * (HW - 0.05), 2.08, z));
  }
  b.add(PAINT, box(1.6, 0.35, 0.45, 0, 0.91, BF + 0.25));
  b.add("leather", rbox(1.6, 0.1, 0.44, 0.03, 0, 1.25, BF + 0.26), rbox(1.6, 0.42, 0.08, 0.03, 0, 1.36, BF + 0.05));
  // the wheel on its raked column, through the dash on the right
  const top: V3 = [-0.45, 1.58, 0.72], tilt = (-Math.atan2(0.4, 0.62) * 180) / Math.PI;
  b.add(BLACK, rod([-0.45, 0.96, 1.12], top, 0.02));
  const wheel = [turn([[0.19, -0.012], [0.212, -0.012], [0.212, 0.012], [0.19, 0.012]], 28), ...[0, 1, 2, 3].map((k) => rod([0, 0, 0], [0.2 * Math.cos((k * Math.PI) / 2), 0, 0.2 * Math.sin((k * Math.PI) / 2)], 0.008))];
  b.add("wood-varnish", wheel[0].rotate(tilt, 0, 0).move(...top));
  b.add(BLACK, ...wheel.slice(1).map((w) => w.rotate(tilt, 0, 0).move(...top)));
  // the hand brake and the gear lever outside the right panel, on their quadrant; the bulb horn on the right post
  for (const [z, ty] of [[0.66, 1.42], [0.8, 1.36]]) b.add(BLACK, rod([-0.96, 0.72, z], [-0.97, ty, z - 0.06], 0.013), turn([[0, -0.02], [0.022, -0.012], [0.022, 0.012], [0, 0.02]], 10).move(-0.97, ty, z - 0.06));
  b.add(NICKEL, box(0.02, 0.18, 0.3, -0.955, 0.72, 0.73));
  b.add("brass", rod([-0.9, 1.7, WS + 0.03], [-0.97, 1.7, WS + 0.3], 0.015), zAxis(turn([[0.015, 0], [0.05, 0.08], [0.052, 0.09], [0.015, 0.09]], 14)).move(-0.97, 1.7, WS + 0.24));
  b.add("rubber", turn([[0, -0.04], [0.035, -0.02], [0.035, 0.02], [0, 0.04]], 12).move(-0.9, 1.7, WS - 0.02));
}

/** The body: a tall panelled box on bearers, its mouldings proud, the louvred vents high on each side, the red cross
 *  on a white disc on each side and above the back doors, the doors with their hinges and handles, a step and a tail
 *  lamp; the roof run forward over the cab as a canopy with a bowed front and a valance, the rail round it. */
function body(b: Build) {
  const BL = BF - BB, BM = (BF + BB) / 2;
  b.add(PAINT, box(2 * HW, EAVES - SILL, BL, 0, SILL, BM));
  for (const s of [-1, 1]) b.add(BLACK, box(0.08, SILL - 0.67, BL - 0.1, s * 0.42, 0.67, BM - 0.05));
  for (const z of [BB + 0.1, -0.9, 0]) b.add(BLACK, box(2 * HW - 0.1, 0.06, 0.06, 0, SILL - 0.06, z));
  // the mouldings: sill, eaves, the corner posts and a panel joint; the vents with their blades
  for (const s of [-1, 1]) {
    const x = s * (HW + 0.008);
    b.add(PAINT, box(0.016, 0.06, BL + 0.016, x, SILL, BM), box(0.016, 0.05, BL + 0.016, x, EAVES - 0.05, BM));
    for (const z of [BB + 0.03, -0.9, BF - 0.03]) b.add(PAINT, box(0.016, EAVES - SILL, 0.05, x, SILL, z));
    for (const z of [-2.3, -1.15]) {
      b.add(PAINT, box(0.02, 0.17, 0.3, s * (HW + 0.01), 2.08, z));
      b.add(BLACK, box(0.01, 0.13, 0.26, s * (HW + 0.016), 2.1, z));
      for (let k = 0; k < 4; k++) b.add(PAINT, manifold.box(0.006, 0.034, 0.26).rotate(0, 0, s * 40).move(s * (HW + 0.024), 2.125 + k * 0.03, z));
    }
    const disc = turnX([[0, 0], [0.39, 0], [0.39, 0.006], [0, 0.006]], 48);
    b.add("paint-white", (s < 0 ? disc.rotate(0, 180, 0) : disc).move(s * HW, 1.72, -1.72));
    b.add("paint-red", box(0.004, 0.6, 0.2, s * (HW + 0.008), 1.42, -1.72), box(0.004, 0.2, 0.6, s * (HW + 0.008), 1.62, -1.72));
  }
  // the back: two doors below a fixed panel, the cross on it, hinges, handles, the step on its hangers, the tail lamp
  const bz = BB - 0.008;
  b.add(PAINT, box(2 * HW, 0.05, 0.016, 0, 1.78, bz), box(2 * HW, 0.06, 0.016, 0, SILL, bz));
  for (const s of [-1, 1]) b.add(PAINT, box(0.05, EAVES - SILL, 0.016, s * (HW - 0.025), SILL, bz));
  b.add(BLACK, box(0.012, 1.78 - SILL - 0.06, 0.012, 0, SILL + 0.06, bz - 0.002));
  for (const s of [-1, 1]) for (const y of [1.12, 1.6]) b.add(BLACK, box(0.14, 0.03, 0.016, s * (HW - 0.12), y, bz - 0.004));
  for (const s of [-1, 1]) b.add(NICKEL, rod([s * 0.06, 1.3, BB - 0.04], [s * 0.06, 1.46, BB - 0.04], 0.009), rod([s * 0.06, 1.32, BB], [s * 0.06, 1.32, BB - 0.04], 0.006), rod([s * 0.06, 1.44, BB], [s * 0.06, 1.44, BB - 0.04], 0.006));
  b.add("paint-white", zAxis(turn([[0, -0.006], [0.24, -0.006], [0.24, 0], [0, 0]], 40)).move(0, 2.07, BB - 0.004));
  b.add("paint-red", box(0.36, 0.12, 0.004, 0, 2.01, BB - 0.012), box(0.12, 0.36, 0.004, 0, 1.89, BB - 0.012));
  b.add(BLACK, box(0.6, 0.03, 0.22, 0, 0.62, BB - 0.1));
  for (const s of [-1, 1]) b.add(BLACK, rod([s * 0.25, 0.64, BB - 0.12], [s * 0.25, SILL, BB + 0.1], 0.012));
  b.add(BLACK, box(0.1, 0.1, 0.06, 0.74, 1.0, BB - 0.03));
  b.add("glass-ruby", zAxis(turn([[0, -0.03], [0.035, -0.03], [0.035, -0.01], [0, 0]], 12)).move(0.74, 1.05, BB - 0.06));
  // the bulkhead window into the body, seen from the cab
  b.add(BLACK, box(0.66, 0.4, 0.012, 0, 1.6, BF + 0.004));
  b.add("glass-plate", box(0.6, 0.34, 0.006, 0, 1.63, BF + 0.012));
  // the roof: crowned, run forward to the canopy's bowed front; the valance under its front and sides
  const bow = (dz: number, w: number, k: number) => { const u = 1 - (2 * k) / 12; return [u * w, CAN - 0.12 - dz + 0.12 * (1 - u * u)] as P2; };
  const outline: P2[] = [[-HW - 0.03, BB - 0.03], [HW + 0.03, BB - 0.03]];
  for (let k = 0; k <= 12; k++) outline.push(bow(0, HW + 0.03, k));
  b.add("tram-roof", along(crown(HW + 0.03, EAVES - 0.05, EAVES, 0.1), BB - 0.03, CAN + 0.01).intersect(plan(outline, 2, 2.6)));
  const val: P2[] = [];
  for (let k = 0; k <= 12; k++) val.push(bow(0.02, HW + 0.02, k));
  for (let k = 12; k >= 0; k--) val.push(bow(0.05, HW - 0.01, k));
  b.add(PAINT, plan(val, 2.17, EAVES - 0.05));
  for (const s of [-1, 1]) b.add(PAINT, box(0.03, 0.13, CAN - 0.12 - BF, s * (HW - 0.0), 2.17, (CAN - 0.12 + BF) / 2));
  // the rail: posts at the roof's edge, a tube along each side and across the back, bowed round over the canopy
  const RY = 2.5, cz = [BB + 0.1, -1.6, -0.75, 0.1, 0.9];
  for (const s of [-1, 1]) for (const z of cz) b.add(BLACK, rod([s * 0.86, 2.36, z], [s * 0.86, RY, z], 0.01));
  const rail: V3[] = [[-0.86, RY, BB + 0.1], ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => { const u = -1 + k / 4; return [u * 0.86, RY, 0.9 + 0.12 * (1 - u * u)] as V3; }), [0.86, RY, BB + 0.1]];
  for (let i = 0; i + 1 < rail.length; i++) b.add(BLACK, rod(rail[i], rail[i + 1], 0.012));
  b.add(BLACK, rod([-0.86, RY, BB + 0.1], [0.86, RY, BB + 0.1], 0.012));
}

/** The wings: crowned sheets over the front wheels sweeping down to the steps, and mudguards over the back wheels
 *  under the body. */
function wings(b: Build) {
  const fp = smooth([[2.22, 0.74], [2.05, 0.87], [1.8, 0.95], [1.45, 0.95], [1.25, 0.86], [1.1, 0.66], [1.0, 0.5]], 3);
  const rp: P2[] = [];
  for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.14 + (0.72 * k) / 12); rp.push([ZR + 0.49 * Math.cos(a), R + 0.49 * Math.sin(a)]); }
  for (const s of [-1, 1]) b.add(BLACK, ...sweepSheet(fp, wingLine(0.06), () => s * X, () => s * 0.12, 0.006), ...sweepSheet(rp, wingLine(0.04), () => s * X, () => s * 0.09, 0.006));
  for (const s of [-1, 1]) b.add(BLACK, slat([s * 0.42, 0.55, ZR + 0.45], [s * 0.62, 0.62, ZR + 0.45], 0.03, 0.015), slat([s * 0.42, 0.55, ZR - 0.45], [s * 0.62, 0.62, ZR - 0.45], 0.03, 0.015));
}

function ambulance(id: string) {
  const b = new Build();
  chassis(b, id); front(b); cab(b); body(b); wings(b);
  return muddy(b.parts(), splashMask(2.0, 5.3, 0.28, 0.7, 13), "mud-road", [PAINT, BLACK]);
}

prop({ id: "ambulance", items: ["army-ambulance"], size: [2.0, 2.6, 5.4], place: "floor", where: "set", tris: 45000, parts: () => ambulance("ambulance") });

export const KIT_AMBULANCE = true;
