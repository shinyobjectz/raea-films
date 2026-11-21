// The motor cars (catalogue army-car). The staffs drove requisitioned and bought touring cars, the bigger the staff
// the bigger the car; Benz and Daimler sold most of their mid-sized cars to the army in 1914-18 (MVC Depesche,
// "Sechserpack", 2024). This one is the Benz 21/50 PS of 1914 (Typ E3), Benz's first six-cylinder: wheelbase
// 3560 mm, track 1440, tyres 895 x 135 on Rudge wire wheels, right-hand steering with the gear lever outside on the
// right, a 100-litre tank at the back, cantilever springs behind, and its exhausts led out through the left side of
// the bonnet in three flexible pipes (Mercedes-Benz Classic archive, "Benz 21/50 hp, 1914-1920"). Its look is
// measured from the Deutsches Technikmuseum's car in Berlin, a 1914 tourer bodied by Neuss of Berlin-Halensee
// (Wikimedia Commons photographs, CC BY-SA, reference only): a shallow V radiator with an arched nickel shell and a
// filler cap, a bonnet widening back to a domed scuttle, a four-door body to a rounded tub tail, crowned wings
// sweeping to running boards, a block of louvres on the right of the bonnet and paired slots on the left, a spare
// wheel standing in the right front wing, the hood folded in its bag over the tail and a luggage grid behind.
//   car-staff   the tourer in field-grey with black wings and chassis, hood down, dark leather seats
// ASSUMED: field-grey for the army (the museum car is pale grey); the wheel size between the archive's tyres and the
// photograph's proportions (0.86 m); the bonnet's taper and the spare's place from the photographs' perspective.
// Frame: on the ground under the middle between the axles, +z forward, the driver's right (the steering side) -x.
import { manifold, type Solid } from "raea/3d";
import { box, rbox, type V3 } from "./geo";
import type { MatId } from "./mats";
import { along, bez, leafSpring, type P2, plan, poly, side, slat, smooth, sph, sweep, sweepSheet, tube, turn, turnX, wireWheel, zAxis } from "./forms";
import { wingLine } from "./carparts";
import { muddy, rod, splashMask } from "./outgeo";
import { prop } from "./prop";
import { Build, WHEELS } from "./vehicles";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const R = 0.43, TY = 0.0675, X = 0.72, ZF = 1.78, ZR = -1.78;
const PAINT: MatId = "paint-field", BLACK: MatId = "lacquer-black", NICKEL: MatId = "steel-bright";
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ramp = (t: number, a: number, b: number) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };

/** A wire wheel on the car at (x, R, z), its cap outward; listed for spinning unless it's the spare. */
function wheelAt(b: Build, id: string, at: V3, list = true) {
  const w = wireWheel(R, TY, 30), turned = (s: Solid) => (at[0] < 0 ? s.rotate(0, 180, 0) : s).move(...at);
  b.add("rubber", turned(w.rubber)); b.add("enamel-black", turned(w.spokes)); b.add(NICKEL, turned(w.cap));
  if (list) (WHEELS[id] ??= []).push({ at, r: R });
}

// The bonnet and scuttle are one tapered shell, hulled from its section at the radiator's back (0.57 wide) to its
// section at the windscreen (the body's 1.36): flat sides, the top crowned over the shoulders.
const BZ1 = 1.62, BZ0 = 0.17;
const hwAt = (z: number) => lerp(0.68, 0.285, (z - BZ0) / (BZ1 - BZ0));
function cowlSection(z: number, d = 0): P2[] {
  const t = (z - BZ0) / (BZ1 - BZ0), hw = lerp(0.68, 0.285, t) - d, yb = lerp(0.67, 0.78, t) + d, ys = lerp(1.31, 1.3, t) - d, rise = lerp(0.13, 0.11, t) - d;
  const c = hw - 0.025, p: P2[] = [[hw, yb], [hw, ys - 0.025], [hw - 0.007, ys - 0.007], [c, ys]];
  for (let k = 5; k >= -5; k--) { const u = (c * k) / 6; p.push([u, ys + rise * (1 - (u / c) ** 2)]); }
  p.push([-c, ys], [-hw + 0.007, ys - 0.007], [-hw, ys - 0.025], [-hw, yb]);
  return p;
}
const cowl = (d = 0) => manifold.hull([...cowlSection(BZ1, d).map(([x, y]) => [x, y, BZ1 - d] as V3), ...cowlSection(BZ0, d).map(([x, y]) => [x, y, BZ0 + d] as V3)]);

/** The body's plan: 1.36 wide from the windscreen back to a tail rounded at its corners. */
const TAIL = -2.24, RC = 0.34;
const BODY_PLAN: P2[] = (() => {
  const p: P2[] = [[0.68, BZ0], [-0.68, BZ0]];
  for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * (Math.PI / 2); p.push([-0.68 + RC + RC * Math.cos(a), TAIL + RC + RC * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) { const a = 1.5 * Math.PI + (i / 8) * (Math.PI / 2); p.push([0.68 - RC + RC * Math.cos(a), TAIL + RC + RC * Math.sin(a)]); }
  return p;
})();
/** The tail's z at x (on its rounded plan). */
const tailAt = (x: number) => { const e = Math.abs(x) - (0.68 - RC); return e <= 0 ? TAIL : TAIL + RC - Math.sqrt(Math.max(0, RC * RC - e * e)); };

function body(b: Build) {
  // the tub: the plan cut by the side's line (level sills, the tail's underside curving up), hollowed down to the
  // floor from the windscreen to behind the rear seat
  const line: P2[] = [[BZ0 + 0.001, 0.67], ...smooth([[-1.3, 0.67], [-1.62, 0.7], [-1.9, 0.77], [-2.1, 0.87], [-2.22, 0.98], [-2.27, 1.1]], 3), [-2.28, 1.29], [BZ0 + 0.001, 1.31]];
  const outer = plan(BODY_PLAN, 0.6, 1.4).intersect(side(line, 1.5));
  const well = poly(BODY_PLAN).offset(-0.03, { join: "round" }).extrude(1).rotate(90, 0, 0).move(0, 1.75, 0).intersect(box(2, 1.2, 2.08, 0, 0.75, -0.91));
  let tub = outer.minus(well);
  // the panels' seams: the scuttle's, the doors' (a front door on the left only, the levers stand on the right)
  for (const [s, z] of [[-1, BZ0], [-1, -0.89], [-1, -1.42], [1, BZ0], [1, -0.28], [1, -0.89], [1, -1.42]] as [number, number][]) tub = tub.minus(box(0.008, 0.62, 0.004, s * 0.68, 0.68, z));
  let sh = cowl().minus(box(2, 1.2, 0.004, 0, 0.6, 0.54).minus(cowl(0.004))); // the bonnet's rear seam
  // louvres: a block of thirteen on the right, pairs of slots on the left and three on the scuttle
  const th = (Math.atan((0.68 - 0.285) / (BZ1 - BZ0)) * 180) / Math.PI;
  const vent = (s: number, z: number, y: number, h: number) => {
    const at = (q: Solid) => q.rotate(0, -s * th, 0).move(s * (hwAt(z) - 0.001), y, z);
    b.add(PAINT, at(manifold.box(0.01, h, 0.02).move(0, h / 2, 0)));
    b.add(BLACK, at(manifold.box(0.012, h - 0.02, 0.004).move(0, h / 2, -0.011)));
  };
  for (let i = 0; i < 13; i++) vent(-1, 0.95 + i * 0.035, 0.93, 0.19);
  for (const z of [0.72, 0.95, 1.18, 1.41]) for (const d of [-0.022, 0.022]) vent(1, z + d, 1.0, 0.16);
  for (const z of [0.36, 0.41, 0.46]) vent(1, z, 0.93, 0.13);
  b.add(PAINT, tub, sh);
  b.add(NICKEL, rod([0, 1.433, 0.54], [0, 1.412, BZ1], 0.006)); // the bonnet's hinge along its crown
  // the cockpit's edge rolled in leather, round the sides and the back
  const e = 0.645, edge: V3[] = [[-e, 1.31, 0.13], [-e, 1.31, -1.6], [-e + 0.12, 1.305, -1.92], [0, 1.3, -1.95], [e - 0.12, 1.305, -1.92], [e, 1.31, -1.6], [e, 1.31, 0.13]];
  b.add("leather", ...tube(edge, 0.017));
  // the dash: two dials and the oiler's glass on the scuttle's back
  for (const x of [-0.18, 0.12]) b.add(NICKEL, zAxis(turn([[0, 0], [0.045, 0], [0.045, 0.012], [0, 0.012]], 16)).move(x, 1.18, 0.119));
  b.add("glass-plate", zAxis(turn([[0, 0], [0.036, 0], [0.036, 0.004], [0, 0.004]], 16)).move(-0.18, 1.18, 0.115), zAxis(turn([[0, 0], [0.036, 0], [0.036, 0.004], [0, 0.004]], 16)).move(0.12, 1.18, 0.115));
  // ring handles at the doors' rear edges
  for (const [s, z] of [[-1, -1.38], [1, -1.38], [1, -0.25]] as [number, number][]) b.add(NICKEL, turnX([[0.022, -0.004], [0.03, -0.004], [0.03, 0.004], [0.022, 0.004]], 16).move(s * 0.687, 1.12, z), sph(0.008, 8).move(s * 0.684, 1.15, z));
}

/** The radiator: a shallow V in plan, its nickel shell's top an arch, the black core set back in it, a seam down
 *  the V, the filler cap on top and a plain oval badge. */
function radiator(b: Build) {
  const elev: P2[] = [[-0.195, 0.6], [0.195, 0.6], [0.235, 0.635], [0.29, 1.3]];
  for (let i = 1; i < 12; i++) { const a = (i / 12) * Math.PI; elev.push([0.29 * Math.cos(a), 1.3 + 0.12 * Math.sin(a)]); }
  elev.push([-0.29, 1.3], [-0.235, 0.635]);
  const vee = (dz: number) => plan([[-0.32, 1.6], [0.32, 1.6], [0.32, 1.67 + dz], [0, 1.82 + dz], [-0.32, 1.67 + dz]], 0.5, 1.5);
  const front = along(elev, 1.58, 1.9), core = poly(elev).offset(-0.035, { join: "round" }).extrude(0.4).move(0, 0, 1.55);
  const recess = core.intersect(vee(0).minus(vee(-0.02))), face = core.intersect(vee(-0.02).minus(vee(-0.03)));
  b.add(NICKEL, front.intersect(vee(0)).minus(recess).minus(face));
  b.add("iron", face);
  b.add(NICKEL, box(0.008, 0.6, 0.012, 0, 0.67, 1.803), turn([[0, 0], [0.04, 0], [0.042, 0.02], [0.035, 0.045], [0.012, 0.055], [0, 0.056]], 16).move(0, 1.4, 1.7));
  b.add(NICKEL, zAxis(turn([[0, 0], [0.03, 0], [0.03, 0.006], [0, 0.008]], 16)).scale(1, 1.3, 1).move(0, 1.335, 1.817));
}

/** A headlamp of radius r at `at`, looking forward: the drum with its domed back, the nickel bezel, the glass. */
function lamp(b: Build, at: V3, r: number, body: MatId = NICKEL) {
  b.add(body, zAxis(turn([[0, -0.75 * r], [0.7 * r, -0.75 * r], [0.95 * r, -0.4 * r], [r, 0], [r, 0.3 * r], [0, 0.3 * r]], 20)).move(...at));
  b.add(NICKEL, zAxis(turn([[0.86 * r, 0.3 * r], [1.08 * r, 0.3 * r], [1.08 * r, 0.52 * r], [0.86 * r, 0.52 * r]], 20)).move(...at));
  b.add("glass-plate", zAxis(turn([[0, 0.32 * r], [0.88 * r, 0.32 * r], [0.84 * r, 0.44 * r], [0, 0.55 * r]], 20)).move(...at));
}

function chassis(b: Build) {
  // the pressed-steel frame, its channels open inward, the dumb irons dropping to the front springs; cross members
  for (const s of [-1, 1]) {
    b.add(BLACK, box(0.05, 0.14, 4.3, s * 0.42, 0.53, -0.2).minus(box(0.04, 0.11, 4.4, s * 0.408, 0.545, -0.2)));
    b.add(BLACK, slat([s * 0.42, 0.6, 1.94], [s * 0.42, 0.57, 2.27], 0.09, 0.045));
  }
  for (const z of [-2.3, -1.0, 0.3, 1.55]) b.add(BLACK, rod([-0.42, 0.6, z], [0.42, 0.6, z], 0.028));
  b.add(BLACK, box(0.8, 0.012, 1.1, 0, 0.56, 1.05)); // the undertray under the engine
  b.add("zinc", rbox(0.34, 0.12, 0.8, 0.04, 0, 0.46, 1.05), rbox(0.3, 0.2, 0.42, 0.03, 0, 0.44, 0.08)); // the sump, the gearbox
  // the front axle: a dropped beam on semi-elliptic springs, king pins, the track rod and the drag link to the box
  const beam: P2[] = [[-0.62, 0.45], [-0.48, 0.47], [-0.34, 0.43], [0, 0.4], [0.34, 0.43], [0.48, 0.47], [0.62, 0.45]];
  for (let i = 0; i + 1 < beam.length; i++) b.add(BLACK, slat([beam[i][0], beam[i][1], ZF], [beam[i + 1][0], beam[i + 1][1], ZF], 0.07, 0.045));
  for (const s of [-1, 1]) {
    b.add(BLACK, leafSpring(0.95, 6, 0.05, 0.05).move(s * 0.42, 0.5, ZF), post(s * 0.62, 0.36, 0.18, ZF, 0.024));
    b.add(BLACK, rod([s * 0.62, 0.42, ZF], [s * 0.58, 0.42, ZF - 0.16], 0.014));
  }
  b.add(BLACK, rod([-0.58, 0.42, ZF - 0.16], [0.58, 0.42, ZF - 0.16], 0.013), rod([-0.62, 0.5, ZF - 0.02], [-0.47, 0.6, 1.14], 0.015));
  b.add("zinc", rbox(0.09, 0.12, 0.12, 0.02, -0.46, 0.56, 1.1)); // the steering box
  b.add(NICKEL, rod([0, 0.5, 1.62], [0, 0.5, 1.98], 0.014), rod([0, 0.5, 1.98], [0.1, 0.42, 1.98], 0.012), rod([0.1, 0.42, 1.98], [0.1, 0.42, 2.06], 0.014)); // the starting handle
  // the rear axle: a banjo housing, brake drums inside the wheels, the cardan tube forward, cantilever springs
  b.add(BLACK, rod([-0.62, R, ZR], [0.62, R, ZR], 0.042), sph(0.14, 16).scale(1, 1, 0.8).move(0, R, ZR), rod([0, 0.47, ZR + 0.12], [0, 0.53, -0.14], 0.035));
  for (const s of [-1, 1]) b.add(BLACK, turnX([[0, -0.035], [0.17, -0.035], [0.17, 0.035], [0, 0.035]], 24).move(s * 0.585, R, ZR), leafSpring(1.15, 6, 0.04, 0.055).move(s * 0.42, 0.48, -1.2));
  // the tank under the tail, its straps
  b.add(BLACK, turnX([[0, -0.39], [0.14, -0.39], [0.16, -0.37], [0.16, 0.37], [0.14, 0.39], [0, 0.39]], 22).move(0, 0.5, -2.12));
  for (const x of [-0.25, 0.25]) b.add("iron", turnX([[0.161, -0.015], [0.168, -0.015], [0.168, 0.015], [0.161, 0.015]], 22).move(x, 0.5, -2.12));
}
const post = (x: number, y: number, h: number, z: number, r: number) => rod([x, y, z], [x, y + h, z], r);

/** The exhausts: three flexible pipes out of the bonnet's left side, down past the wing to a collector, the silencer
 *  under the body and the tail pipe out at the back. */
function exhaust(b: Build) {
  for (const z of [0.62, 0.78, 0.94]) {
    const hw = hwAt(z), pts = bez([[hw - 0.01, 0.9, z], [hw + 0.1, 0.9, z - 0.01], [0.58, 0.62, z - 0.1], [0.54, 0.42, z - 0.28]], 16);
    for (let i = 0; i + 1 < pts.length; i++) b.add("iron", rod(pts[i], pts[i + 1], 0.024));
    for (const p of pts) b.add("iron", sph(0.03, 8).move(...p));
  }
  b.add("iron", rod([0.54, 0.42, 0.68], [0.54, 0.42, 0.15], 0.034));
  b.add(BLACK, turn([[0, -0.5], [0.07, -0.5], [0.078, -0.46], [0.078, 0.46], [0.07, 0.5], [0, 0.5]], 18).rotate(90, 0, 0).move(0.54, 0.42, -0.38));
  b.add("iron", ...tube(bez([[0.54, 0.42, -0.88], [0.54, 0.36, -1.1], [0.42, 0.3, -1.3], [0.4, 0.3, -1.5]], 6), 0.022), rod([0.4, 0.3, -1.5], [0.4, 0.3, -2.45], 0.022));
}

/** The wings: crowned sheets with rolled edges, the front ones sweeping down to the running boards, the back ones
 *  hugging the wheels; the running boards with ribbed rubber and an aluminium edge; aprons from the bonnet's foot to
 *  the front wings. The right front wing has a well for the spare. */
const SPARE: V3 = [-0.86, 0.66, 0.6];
function wings(b: Build) {
  const front = smooth([[2.24, 0.86], [2.12, 0.95], [1.95, 1.0], [1.75, 1.01], [1.55, 0.98], [1.31, 0.92], [1.08, 0.8], [0.88, 0.7], [0.67, 0.58], [0.48, 0.48], [0.29, 0.4], [0.2, 0.39]], 3);
  const arc: P2[] = [[-1.22, 0.4]];
  for (let i = 0; i <= 16; i++) { const a = ((80 - (165 * i) / 16) * Math.PI) / 180; arc.push([ZR + 0.5 * Math.sin(a), R + 0.5 * Math.cos(a)]); }
  const well = turnX([[0, -0.1], [R + 0.03, -0.1], [R + 0.03, 0.1], [0, 0.1]], 40).move(...SPARE);
  for (const s of [-1, 1]) {
    let fw = manifold.union(...sweepSheet(front, wingLine(0.07), (t) => s * (0.73 + 0.075 * ramp(t, 0.45, 0.8)), (t) => s * (0.14 - 0.015 * ramp(t, 0.45, 0.8)), 0.006));
    let board = box(0.25, 0.03, 1.5, s * 0.805, 0.37, -0.5);
    if (s < 0) { fw = fw.minus(well); board = board.minus(well); }
    b.add(BLACK, fw, ...sweepSheet(smooth(arc, 2), wingLine(0.1), (t) => s * (0.8 - 0.07 * ramp(t, 0, 0.15)), (t) => s * (0.13 + 0.02 * ramp(t, 0, 0.15)), 0.006), board);
    b.add("rubber", box(0.22, 0.004, 1.44, s * 0.8, 0.4, -0.5));
    for (let i = 0; i < 9; i++) b.add("rubber", box(0.008, 0.008, 1.44, s * (0.7 + i * 0.025), 0.4, -0.5));
    b.add(NICKEL, box(0.012, 0.036, 1.5, s * 0.931, 0.366, -0.5));
    for (const z of [-1.1, -0.5, 0.1]) b.add(BLACK, slat([s * 0.44, 0.54, z], [s * 0.62, 0.35, z], 0.04, 0.02), box(0.3, 0.02, 0.04, s * 0.76, 0.348, z));
    // the apron from the bonnet's foot out to the wing's inner edge, ahead of the scuttle
    const ap: V3[] = [];
    for (let i = 0; i <= 8; i++) { const z = lerp(0.92, 1.6, i / 8), t = (z - BZ0) / (BZ1 - BZ0); ap.push([s * (hwAt(z) - 0.01), lerp(0.67, 0.78, t), z], [s * 0.6, 0.74 + 0.25 * ramp(z, 0.95, 1.5), z]); }
    for (let i = 0; i + 2 < ap.length; i += 2) b.add(BLACK, manifold.hull([ap[i], ap[i + 1], ap[i + 2], ap[i + 3], ...[ap[i], ap[i + 1], ap[i + 2], ap[i + 3]].map((p) => [p[0], p[1] - 0.006, p[2]] as V3)]));
  }
}

/** The cockpit: the benches in buttoned rolls of leather, the steering wheel on its raked column, the levers outside
 *  on the right with their gate, the bulb horn, the windscreen in its nickel frame, the hood folded over the tail. */
function cockpit(b: Build) {
  const rolls = (n: number, w: number, h: number, z: number, lean: number) => {
    for (let i = 0; i < n; i++) b.add("leather", rbox(w / n + 0.01, h, 0.1, 0.045, 0, 0, 0).rotate(lean, 0, 0).move(-w / 2 + (w / n) * (i + 0.5), 1.04, z));
  };
  b.add(PAINT, box(1.2, 0.26, 0.48, 0, 0.75, -0.26), box(1.26, 0.26, 0.55, 0, 0.75, -1.52));
  b.add("leather", rbox(1.18, 0.12, 0.5, 0.045, 0, 0.98, -0.25), rbox(1.24, 0.13, 0.55, 0.05, 0, 0.98, -1.5));
  rolls(6, 1.12, 0.42, -0.53, -10);
  rolls(7, 1.22, 0.36, -1.8, -12);
  for (const s of [-1, 1]) b.add("leather", rbox(0.08, 0.12, 0.5, 0.035, s * 0.6, 1.14, -1.55));
  // the steering: the column from the box under the bonnet up through the dash, the wooden rim on four spokes
  const top: V3 = [-0.36, 1.47, -0.05], d = [0.06, 0.85, -1.15], L = Math.hypot(...d), tilt = (Math.atan2(d[2] / L, d[1] / L) * 180) / Math.PI;
  b.add(BLACK, rod([-0.42, 0.62, 1.1], top, 0.02));
  const rim: P2[] = [];
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; rim.push([0.21 + 0.014 * Math.cos(a), 0.014 * Math.sin(a)]); }
  b.add("wood-varnish", turn(rim, 36).rotate(tilt, 0, 0).move(...top));
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; b.add(BLACK, rod([0, 0, 0], [0.205 * Math.cos(a), 0, 0.205 * Math.sin(a)], 0.008).rotate(tilt, 0, 0).move(...top)); }
  b.add(NICKEL, turn([[0, -0.02], [0.035, -0.02], [0.035, 0.02], [0, 0.03]], 14).rotate(tilt, 0, 0).move(...top));
  // the gear lever and the hand brake outside the body on the right, their gate and ratchet
  for (const [z, k] of [[-0.12, 1.24], [-0.3, 1.2]] as [number, number][]) b.add(NICKEL, rod([-0.725, 0.56, z], [-0.735, 0.9, z + 0.03], 0.012), rod([-0.735, 0.9, z + 0.03], [-0.74, k, z + 0.07], 0.009), sph(0.022, 12).move(-0.74, k, z + 0.07));
  b.add(NICKEL, box(0.014, 0.022, 0.12, -0.715, 0.66, -0.13), turnX([[0.1, -0.007], [0.115, -0.007], [0.115, 0.007], [0.1, 0.007]], 20).intersect(box(0.1, 0.2, 0.25, 0, 0.0, -0.06)).move(-0.725, 0.56, -0.3));
  b.add(BLACK, rod([-0.42, 0.56, -0.2], [-0.725, 0.56, -0.2], 0.018));
  // the bulb horn by the driver's hand, its brass tube along the cowl to the bell
  const hp: V3[] = [[-0.75, 1.22, 0.06], [-0.735, 1.25, 0.2], [-(hwAt(0.36) + 0.03), 1.27, 0.36], [-(hwAt(0.5) + 0.03), 1.26, 0.5]];
  b.add("brass", ...tube(hp, 0.008), zAxis(turn([[0.006, 0], [0.012, 0.05], [0.025, 0.09], [0.05, 0.11], [0.052, 0.116], [0.004, 0.116]], 18)).move(-(hwAt(0.5) + 0.03), 1.26, 0.5));
  b.add("rubber", sph(0.034, 12).scale(1, 1.3, 1).move(-0.76, 1.19, 0.03));
  // the windscreen: posts with finials, the pane in its frame, stays to the scuttle
  const wy = 1.36;
  for (const s of [-1, 1]) b.add(NICKEL, rod([s * 0.56, wy - 0.06, BZ0 + 0.02], [s * 0.56, 1.95, BZ0 + 0.02], 0.011), sph(0.018, 10).move(s * 0.56, 1.96, BZ0 + 0.02), rod([s * 0.56, 1.5, BZ0 + 0.02], [s * 0.66, 1.25, BZ0 + 0.2], 0.008));
  b.add(NICKEL, rod([-0.56, 1.9, BZ0 + 0.02], [0.56, 1.9, BZ0 + 0.02], 0.01), rod([-0.56, 1.43, BZ0 + 0.02], [0.56, 1.43, BZ0 + 0.02], 0.008));
  b.add("glass-plate", box(1.1, 0.46, 0.006, 0, 1.435, BZ0 + 0.02));
  b.add(PAINT, box(1.12, 0.12, 0.035, 0, 1.31, BZ0 + 0.02)); // the screen's base on the cowl
  // the hood folded in its bag over the tail, the irons it pivots on
  b.add("cloth-black", rbox(1.42, 0.23, 0.62, 0.1, 0, 1.24, -2.18));
  for (const s of [-1, 1]) b.add("iron", slat([s * 0.69, 1.08, -1.88], [s * 0.7, 1.3, -1.97], 0.03, 0.01));
}

/** The lamps, the spare, the luggage grid and the tail lamp. */
function fittings(b: Build, id: string) {
  for (const s of [-1, 1]) {
    lamp(b, [s * 0.43, 1.05, 1.88], 0.13);
    b.add(NICKEL, rod([s * 0.43, 0.92, 1.85], [s * 0.42, 0.6, 1.95], 0.014), rod([s * 0.3, 1.0, 1.82], [s * 0.4, 1.0, 1.85], 0.01));
    lamp(b, [s * 0.38, 0.8, 1.98], 0.065);
    b.add(NICKEL, rod([s * 0.38, 0.75, 1.96], [s * 0.42, 0.6, 2.0], 0.01));
    lamp(b, [s * (hwAt(0.36) + 0.065), 1.2, 0.36], 0.055); // the scuttle lamps
    b.add(NICKEL, rod([s * (hwAt(0.36) + 0.065), 1.15, 0.34], [s * hwAt(0.33), 1.12, 0.33], 0.008));
  }
  // the spare in its well, strapped to an iron on the body
  wheelAt(b, id, SPARE, false);
  b.add("iron", rod([-0.68, 0.9, 0.6], [-0.78, 0.66, 0.6], 0.016));
  for (const dz of [-0.33, 0.33]) b.add("leather", box(0.17, 0.035, 0.03, -0.81, 0.66 + Math.sqrt(R * R - dz * dz) - 0.02, 0.6 + dz));
  // the luggage grid behind the tail: guard bars up the tail, the grid on its stays
  for (const x of [-0.45, -0.27, -0.09, 0.09, 0.27, 0.45]) b.add(NICKEL, ...tube([[x, 0.74, tailAt(x) - 0.07], [x, 0.9, tailAt(x) - 0.04], [x, 1.1, tailAt(x) - 0.03]], 0.008));
  b.add(NICKEL, rod([-0.47, 1.1, TAIL - 0.025], [0.47, 1.1, TAIL - 0.025], 0.008));
  for (const z of [-2.32, -2.42, -2.52, -2.6]) b.add(NICKEL, rod([-0.5, 0.72, z], [0.5, 0.72, z], 0.009));
  for (const s of [-1, 1]) b.add(NICKEL, rod([s * 0.5, 0.72, -2.3], [s * 0.5, 0.72, -2.62], 0.01), rod([s * 0.42, 0.62, -2.34], [s * 0.5, 0.72, -2.5], 0.01));
  b.add(BLACK, zAxis(turn([[0, -0.05], [0.04, -0.05], [0.045, 0], [0, 0]], 14)).move(0.55, 0.66, -2.38));
  b.add("glass-ruby", zAxis(turn([[0, -0.06], [0.036, -0.06], [0.036, -0.05], [0, -0.05]], 14)).move(0.55, 0.66, -2.38));
  b.add(BLACK, rod([0.55, 0.62, -2.34], [0.42, 0.6, -2.3], 0.01));
}

function staffCar(id: string): Part[] {
  const b = new Build();
  for (const z of [ZF, ZR]) for (const s of [-1, 1]) wheelAt(b, id, [s * X, R, z]);
  chassis(b); body(b); radiator(b); exhaust(b); wings(b); cockpit(b); fittings(b, id);
  return muddy(b.parts(), splashMask(1.9, 5.2, 0.25, 0.6, 9), "mud-road", [PAINT, BLACK]);
}

const P = (id: string, items: string[], size: V3, tris: number, f: (id: string) => Part[]) => prop({ id, items, size, place: "floor", where: "set", tris, parts: () => f(id) });
P("car-staff", ["army-car"], [1.9, 2.0, 5.2], 70000, staffCar);

export const KIT_CARS = true;
