// The army's motorcycle (catalogue army-motorcycle). Wanderer of Chemnitz supplied about half the German army's
// motorcycles in 1914-18, with NSU most of the rest. Its "Heeresmodell 4 PS" had a 504 cc side-valve V-twin, a V-belt
// to a rim on the back wheel, a two-speed hub and a kick-starter. It weighed 90 kg and ran on 26 x 2 1/2 tyres as
// narrow as a bicycle's. It had sprung forks, footboards in place of pedals, a sprung leather saddle, and a
// five-sided tank holding petrol and oil behind a dividing wall, with a hand oil pump on top (KRADblatt; Deutsches
// Motorrad Museum; cybermotorcycle.com). Dispatch riders rode them, and combinations with sidecars served too.
// Measured from the Deutsches Motorrad Museum's side photographs of a 1915 machine (scale from the 26-inch wheels):
// wheelbase 1.41 m, tank top 0.82 m, saddle 0.87 m, bars 1.11 m; the tank slung between a top tube and a lower tube,
// the V of the cylinders about 50 degrees with their side-valve chests, springs and exhausts on the right, a pressed
// louvred shield over the crankcase's right side, ribbed rubber footboards, toolboxes either side of the carrier.
//   moto-army           the solo machine in field-grey on its back stand: a dispatch case on the carrier, toolboxes,
//                       a carbide lamp and its gas generator
//   moto-army-sidecar   the same with a sidecar on its right: a field-grey coachbuilt body (a rounded nose, a well
//                       with a padded rim, a leather seat), on leaf springs over a tube chassis, its own wheel
// ASSUMED: the sidecar's body (no photograph of the army's combinations found yet); field-grey paint and a black lamp
// for the army in place of the museum machine's green and nickel; the cables' runs.
// Frame: on the ground under the middle between the axles, +z forward, the rider's right -x.
import { manifold, sdf, type Solid } from "raea/3d";
import { box, rbox, type V3 } from "./geo";
import type { MatId } from "./mats";
import { add3, bez, coil, type P2, poly, pressed, side, slat, sph, tube, turn, tyre, xAxis, zAxis } from "./forms";
import { rod, spoked } from "./outgeo";
import { prop } from "./prop";
import { Build as B, WHEELS } from "./vehicles";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const R = 0.33, ZR = -0.705, ZF = 0.705, F: MatId = "paint-field";
function wheel(b: B, id: string, x: number, z: number, hub: number) {
  const w = spoked(R - 0.032, 0.03, 36, { tyre: 0.004, felloe: 0.018, hub: 0.045, spoke: 0.0022 });
  b.add("steel-bright", w.iron.move(x, R, z), w.wood.move(x, R, z));
  b.add("rubber", tyre(R - 0.03, 0.03).move(x, R, z));
  // the hub's shell: the back wheel's two-speed drum is the fat one
  b.add("lacquer-black", xAxis(turn([[0.012, -hub / 2], [0.04, -hub / 2], [0.05, -hub / 2 + 0.012], [0.05, hub / 2 - 0.012], [0.04, hub / 2], [0.012, hub / 2]], 20)).move(x, R, z));
  (WHEELS[id] ??= []).push({ at: [x, R, z], r: R });
}
/** A mudguard round a wheel at (x, R, z): an arched sheet with rolled edges, from angle `from` to `to` (0 at the top,
 *  positive forward), radius rg to its inside, w wide. */
function guard(b: B, mat: MatId, x: number, z: number, from: number, to: number, w: number, rg = R + 0.03) {
  const out: P2[] = [], inn: P2[] = [], crown = 0.018, th = 0.004, lip = 0.016;
  for (let i = 0; i <= 10; i++) { const t = -1 + (2 * i) / 10, a = (t * w) / 2, r = rg + crown * (1 - t * t); out.push([r + th, a]); inn.push([r, a * ((w / 2 - th) / (w / 2))]); }
  const prof: P2[] = [[rg - lip, -w / 2], ...out, [rg - lip, w / 2], [rg - lip, w / 2 - th], ...inn.reverse(), [rg - lip, -w / 2 + th]];
  const ring = xAxis(turn(prof, 72));
  const sector: P2[] = [[0, 0]];
  for (let k = 0; k <= 24; k++) { const a = from + ((to - from) * k) / 24; sector.push([0.6 * Math.sin(a), 0.6 * Math.cos(a)]); }
  b.add(mat, ring.intersect(side(sector, w + 0.1)).move(x, R, z));
  // two stays from the guard's edges to the axle each side
  for (const a of [from + (to - from) * 0.15, from + (to - from) * 0.85]) for (const s of [-1, 1]) b.add("steel-bright", rod([x + s * (w / 2 + 0.004), R + (rg + 0.01) * Math.cos(a), z + (rg + 0.01) * Math.sin(a)], [x + s * 0.06, R, z], 0.004));
}

/** The engine: crank along x at (0, EY, EZ). */
const EY = 0.33, EZ = 0.01;
function engine(b: B) {
  const at = (s: Solid) => s.move(0, EY, EZ);
  // the crankcase, rounded at its rims, and the timing case on its right
  b.add("zinc", at(xAxis(turn([[0, -0.06], [0.1, -0.06], [0.116, -0.048], [0.122, -0.025], [0.122, 0.025], [0.116, 0.048], [0.1, 0.06], [0, 0.06]], 28))));
  b.add("zinc", manifold.hull(at(xAxis(turn([[0, 0], [0.075, 0], [0.07, 0.03], [0, 0.03]], 24)).move(-0.06, 0, 0)), at(xAxis(turn([[0, 0], [0.045, 0], [0.04, 0.03], [0, 0.03]], 18)).move(-0.06, 0.07, 0.09))));
  // the magneto behind the cylinders, its domed cap on the right
  b.add("zinc", at(xAxis(turn([[0, -0.04], [0.036, -0.04], [0.036, 0.03], [0.03, 0.045], [0.015, 0.052], [0, 0.054]], 18)).move(-0.07, 0.1, -0.15)));
  b.add("steel-bright", at(box(0.08, 0.012, 0.05, -0.07, 0.058, -0.15)));
  for (const t of [25, -25]) {
    const tilt = (s: Solid) => at(s.rotate(t, 0, 0));
    // the barrel: a flange, then nine fins
    const barrel: P2[] = [[0, 0.075], [0.052, 0.075], [0.052, 0.088], [0.041, 0.09]];
    for (let i = 0; i < 9; i++) { const h = 0.094 + i * 0.0128; barrel.push([0.041, h], [0.07, h + 0.002], [0.07, h + 0.0055], [0.041, h + 0.0075]); }
    barrel.push([0.041, 0.21], [0, 0.21]);
    b.add("iron", tilt(turn(barrel, 18)));
    // the head: three deeper fins and a dome, the plug on top
    const head: P2[] = [[0, 0.208]];
    for (let i = 0; i < 3; i++) { const h = 0.21 + i * 0.016; head.push([0.046, h], [0.078, h + 0.002], [0.078, h + 0.007], [0.046, h + 0.01]); }
    head.push([0.046, 0.258], [0.035, 0.27], [0.016, 0.276], [0, 0.277]);
    b.add("iron", tilt(turn(head, 18)));
    b.add("steel-bright", tilt(turn([[0, 0.27], [0.011, 0.27], [0.011, 0.29], [0.006, 0.292], [0.006, 0.31], [0, 0.312]], 8)));
    b.add("leather", tilt(turn([[0, 0.29], [0.008, 0.29], [0.008, 0.305], [0, 0.305]], 8)));
    // the valve chest on the right with its exhaust port, the two valve springs and tappet guides under it
    b.add("iron", tilt(manifold.hull(sph(0.026, 12).move(-0.055, 0.19, 0.016), sph(0.026, 12).move(-0.055, 0.19, -0.016), sph(0.022, 12).move(-0.05, 0.24, 0), sph(0.02, 12).move(-0.035, 0.165, 0))));
    for (const k of [-1, 1]) {
      b.add("steel-bright", ...coil([-0.062, 0.118, k * 0.016], 0.05, 0.009, 0.0022, 6, 6).map(tilt));
      b.add("steel-bright", tilt(rod([-0.062, 0.085, k * 0.016], [-0.062, 0.12, k * 0.016], 0.006)));
    }
    // the exhaust from the chest's side, down in front of or behind the crankcase, to the pipe under it
    const ang = (t * Math.PI) / 180, port: V3 = [-0.085, EY + 0.19 * Math.cos(ang), EZ + 0.19 * Math.sin(ang)];
    const down: V3 = t > 0 ? [-0.1, 0.2, 0.12] : [-0.1, 0.19, -0.13];
    b.add("iron", ...tube(bez([port, add3(port, [-0.025, 0, 0]), [-0.1, 0.24, t > 0 ? 0.16 : -0.16], down], 8), 0.014));
  }
  // the exhausts joined under the engine, back to the silencer under the right footboard, its tail pipe
  b.add("iron", ...tube(bez([[-0.1, 0.2, 0.12], [-0.11, 0.14, 0.05], [-0.11, 0.15, -0.08], [-0.1, 0.175, -0.13]], 8), 0.015));
  b.add("iron", turn([[0, 0], [0.018, 0], [0.04, 0.03], [0.042, 0.05], [0.042, 0.2], [0.04, 0.22], [0.02, 0.245], [0, 0.247]], 18).rotate(-90, 0, 0).move(-0.105, 0.175, -0.125));
  b.add("iron", rod([-0.105, 0.17, -0.37], [-0.105, 0.16, -0.46], 0.011));
  // the carburettor in the V and its pipes to the two chests, the throttle and air cables
  b.add("zinc", turn([[0, 0], [0.017, 0], [0.017, 0.05], [0.012, 0.056], [0, 0.056]], 12).move(0.0, 0.52, 0.01), turn([[0, 0], [0.019, 0], [0.019, 0.045], [0, 0.045]], 12).move(0.04, 0.515, 0.01));
  b.add("steel-bright", ...tube([[-0.05, EY + 0.19 * Math.cos(0.436) - 0.01, EZ + 0.19 * Math.sin(0.436)], [-0.03, 0.535, 0.04], [0.0, 0.54, 0.01], [-0.03, 0.53, -0.02], [-0.05, EY + 0.19 * Math.cos(0.436) - 0.01, EZ - 0.19 * Math.sin(0.436)]], 0.011));
  // the pressed louvred shield over the crankcase's right side, its rolled rim and slots
  const shield: P2[] = [[-0.13, 0.455], [0.19, 0.455], [0.18, 0.39], [0.07, 0.235], [0.02, 0.235], [-0.12, 0.4]];
  const round = (c: ReturnType<typeof poly>, r: number) => c.offset(-r, { join: "round" }).offset(r, { join: "round" });
  const outline = round(poly(shield), 0.02);
  const slots: ReturnType<typeof poly>[] = [];
  for (let i = 0; i < 7; i++) { const z = -0.08 + i * 0.04, y0 = i < 2 || i > 4 ? 0.37 : 0.33; slots.push(round(poly([[z - 0.0055, y0], [z + 0.0055, y0], [z + 0.0055, 0.43], [z - 0.0055, 0.43]]), 0.005)); }
  for (let i = 0; i < 3; i++) { const z = 0.0 + i * 0.04; slots.push(round(poly([[z - 0.0055, 0.27], [z + 0.0055, 0.27], [z + 0.0055, 0.31], [z - 0.0055, 0.31]]), 0.005)); }
  b.add("steel-bright", outline.minus(...slots).extrude(0.003).rotate(0, -90, 0).move(-0.125, 0, 0));
  for (const [z, y] of [[-0.1, 0.44], [0.16, 0.44], [0.045, 0.255], [0.03, 0.4]] as P2[]) b.add("steel-bright", sph(0.006, 8).scale(0.6, 1, 1).move(-0.128, y, z));
  b.add("steel-bright", outline.minus(outline.offset(-0.008)).extrude(0.008).rotate(0, -90, 0).move(-0.12, 0, 0));
}

function motorcycle(id: string, sidecar: boolean): Part[] {
  const b = new B();
  wheel(b, id, 0, ZR, 0.1);
  wheel(b, id, 0, ZF, 0.06);
  // the frame: the head, the top tube over the tank and the lower tube under it, the down tube to the engine's front,
  // the seat tube to its back, the cradle under it, the stays to the back axle
  const H1: V3 = [0, 0.88, 0.432], H2: V3 = [0, 0.7, 0.468], S: V3 = [0, 0.795, -0.3], E1: V3 = [0, 0.34, 0.165], E2: V3 = [0, 0.3, -0.13];
  b.add(F, turn([[0, -0.002], [0.021, -0.002], [0.024, 0.02], [0.021, 0.04], [0.021, 0.14], [0.024, 0.16], [0.021, 0.184], [0, 0.184]], 14).rotate(-11, 0, 0).move(H2[0], H2[1] - 0.004, H2[2]));
  b.add(F, ...tube([[0, 0.845, 0.44], S], 0.014), ...tube([[0, 0.72, 0.465], [0, 0.625, -0.255]], 0.014));
  b.add(F, ...tube([H2, [0, 0.58, 0.39], E1], 0.017), ...tube([S, [0, 0.62, -0.235], E2], 0.017));
  b.add(F, ...tube([E2, [0, 0.215, -0.08], [0, 0.205, 0.06], [0, 0.24, 0.16], E1], 0.014));
  for (const s of [-1, 1]) b.add(F, ...tube([[s * 0.03, 0.23, -0.1], [s * 0.065, 0.3, -0.45], [s * 0.07, R, ZR]], 0.011), ...tube([[s * 0.02, 0.78, -0.31], [s * 0.065, 0.5, -0.56], [s * 0.07, R, ZR]], 0.01));
  b.add("steel-bright", ...[-1, 1].map((s) => rod([s * 0.07, R, ZR], [s * 0.075, R, ZR + 0.04], 0.012)));
  // the five-sided tank between the tubes: a pressed slab with rounded edges and slightly swelling sides
  const tank: P2[] = [[-0.275, 0.8], [0.405, 0.826], [0.39, 0.745], [-0.215, 0.64], [-0.28, 0.705]];
  b.add(F, manifold.hull(pressed(tank, 0.13, 0.022), sph(0.06, 20).scale(1.2, 0.75, 3.67).move(0, 0.745, 0)));
  // its caps, the hand oil pump at the front, the gear lever on its quadrant at the back, the badges
  b.add("steel-bright", turn([[0, 0], [0.022, 0], [0.024, 0.008], [0.02, 0.018], [0, 0.02]], 14).move(-0.025, 0.818, 0.16), turn([[0, 0], [0.018, 0], [0.019, 0.007], [0.016, 0.015], [0, 0.017]], 12).move(0.025, 0.81, -0.05));
  b.add("steel-bright", turn([[0, 0], [0.012, 0], [0.012, 0.1], [0, 0.1]], 10).move(0.04, 0.8, 0.33), rod([0.04, 0.9, 0.33], [0.04, 0.95, 0.33], 0.004), rod([0.02, 0.95, 0.33], [0.06, 0.95, 0.33], 0.006));
  b.add("steel-bright", side([[-0.2, 0.79], [-0.12, 0.8], [-0.12, 0.83], [-0.17, 0.85], [-0.2, 0.83]], 0.006).move(0.05, 0, 0), ...tube([[0.058, 0.81, -0.16], [0.07, 0.88, -0.12], [0.07, 0.93, -0.1]], 0.006), sph(0.014, 10).move(0.07, 0.94, -0.1));
  for (const s of [-1, 1]) b.add("brass", zAxis(turn([[0, -0.002], [0.03, -0.002], [0.03, 0.002], [0, 0.002]], 18)).scale(1, 0.62, 1).rotate(0, 90, 0).move(s * 0.068, 0.765, 0.08));
  // the gear rod from the lever down to the back hub
  b.add("steel-bright", ...tube([[0.07, 0.86, -0.11], [0.09, 0.7, -0.3], [0.1, 0.42, -0.6], [0.09, R + 0.02, ZR + 0.03]], 0.004));
  engine(b);
  // the drive: the engine's pulley on the left, the V-belt to the rim on the back wheel, its two guards
  const c1: P2 = [EZ, EY], c2: P2 = [ZR, R], r1 = 0.07, r2 = 0.19, D: P2 = [c2[0] - c1[0], c2[1] - c1[1]], dd = Math.hypot(...D), u: P2 = [D[0] / dd, D[1] / dd], c = (r1 - r2) / dd;
  b.add("steel-bright", xAxis(turn([[0.015, -0.018], [r1 + 0.008, -0.018], [r1 - 0.004, 0], [r1 + 0.008, 0.018], [0.015, 0.018]], 20)).move(0.085, EY, EZ));
  b.add("steel-bright", xAxis(turn([[r2 - 0.015, -0.016], [r2 + 0.012, -0.016], [r2 - 0.002, 0], [r2 + 0.012, 0.016], [r2 - 0.015, 0.016]], 56)).move(0.085, R, ZR));
  for (const k of [-1, 1]) {
    const n: P2 = [c * u[0] + k * Math.sqrt(1 - c * c) * -u[1], c * u[1] + k * Math.sqrt(1 - c * c) * u[0]];
    const t1: V3 = [0.085, c1[1] + r1 * n[1], c1[0] + r1 * n[0]], t2: V3 = [0.085, c2[1] + r2 * n[1], c2[0] + r2 * n[0]];
    b.add("leather", slat(add3(t1, [0, n[1], n[0]], 0.004), add3(t2, [0, n[1], n[0]], 0.004), 0.018, 0.014));
  }
  // the sprung fork: legs from the crown to the axle, the link rods in front, the spring at the head
  const crown: V3 = [0, 0.69, 0.47];
  b.add(F, rbox(0.15, 0.03, 0.05, 0.01, 0, crown[1] - 0.015, crown[2]));
  for (const s of [-1, 1]) {
    b.add(F, ...tube([[s * 0.06, crown[1], crown[2]], [s * 0.062, 0.5, 0.6], [s * 0.065, R, ZF]], 0.012));
    b.add("steel-bright", ...tube([[s * 0.075, 0.95, 0.47], [s * 0.075, 0.6, 0.62], [s * 0.07, R + 0.03, ZF + 0.03]], 0.006));
    b.add("steel-bright", rod([s * 0.065, R, ZF], [s * 0.065, R, ZF + 0.035], 0.01));
  }
  b.add("steel-bright", ...coil([0, 0.89, 0.475], 0.07, 0.022, 0.004, 6), rbox(0.17, 0.02, 0.04, 0.006, 0, 0.955, 0.47));
  // the carbide lamp on its bracket, the gas generator behind the down tube and the hose between them
  b.add("lacquer-black", zAxis(turn([[0, -0.07], [0.03, -0.068], [0.05, -0.05], [0.056, -0.02], [0.056, 0.03], [0, 0.03]], 20)).move(0, 0.94, 0.56));
  b.add("steel-bright", zAxis(turn([[0.048, 0.025], [0.064, 0.028], [0.064, 0.04], [0.05, 0.042]], 20)).move(0, 0.94, 0.56), turn([[0, 0], [0.012, 0], [0.012, 0.04], [0.02, 0.045], [0.02, 0.052], [0, 0.056]], 10).move(0, 0.985, 0.55));
  b.add("glass-signal", zAxis(turn([[0, 0.03], [0.05, 0.03], [0.045, 0.04], [0, 0.044]], 20)).move(0, 0.94, 0.56));
  b.add("steel-bright", rod([0, 0.88, 0.47], [0, 0.9, 0.52], 0.008), rod([0, 0.9, 0.52], [0, 0.89, 0.555], 0.008));
  b.add("zinc", turn([[0, 0], [0.026, 0], [0.028, 0.01], [0.028, 0.15], [0.022, 0.165], [0, 0.168]], 16).move(0.0, 0.5, 0.31), turn([[0, 0], [0.006, 0], [0.006, 0.03], [0.014, 0.034], [0, 0.04]], 8).move(0, 0.668, 0.31));
  b.add("rubber", ...tube(bez([[0.0, 0.69, 0.31], [0.02, 0.8, 0.33], [0.04, 0.85, 0.5], [0.02, 0.9, 0.53]], 6), 0.004));
  // the bars: the stem, the swept bar rising and running back to the grips, the levers, the cables down the frame
  b.add("steel-bright", ...tube([H1, [0, 0.97, 0.42], [0, 1.0, 0.4]], 0.012), sph(0.02, 10).move(0, 1.0, 0.4));
  for (const s of [-1, 1]) {
    const bar = bez([[0, 1.0, 0.4], [s * 0.2, 1.06, 0.38], [s * 0.27, 1.12, 0.22], [s * 0.285, 1.09, 0.06]], 12);
    b.add("steel-bright", ...tube(bar, 0.011));
    const g0 = bar[bar.length - 1], g1 = add3(g0, [s * 0.01, -0.04, -0.12]);
    const grip: P2[] = [[0, 0]];
    for (let i = 0; i < 10; i++) grip.push([0.016, i * 0.012], [0.019, i * 0.012 + 0.006]);
    grip.push([0.016, 0.12], [0, 0.12]);
    const dir = [g1[0] - g0[0], g1[1] - g0[1], g1[2] - g0[2]], L = Math.hypot(...dir);
    b.add("rubber", turn(grip, 12).scale(1, L / 0.12, 1).rotate((-Math.asin(dir[1] / L) * 180) / Math.PI + 90, (Math.atan2(dir[0], dir[2]) * 180) / Math.PI, 0).move(...g0));
    for (const k of [3, 6]) { const p = bar[k]; b.add("steel-bright", ...tube([p, add3(p, [s * 0.03, -0.02, -0.07]), add3(p, [s * 0.05, -0.035, -0.1])], 0.005)); b.add("rubber", ...tube(bez([p, [s * 0.04, 0.92, 0.45], [s * 0.035, 0.64, 0.43], [s * 0.012 * k, 0.585, 0.03]], 10), 0.003)); }
  }
  // the saddle: leather over a pear-shaped hull, its skirt, the nose clip on the seat pillar, two coil springs behind
  b.add("leather", manifold.hull(sph(0.06, 20).scale(2.0, 0.42, 1.25).move(0, 0.872, -0.5), sph(0.06, 20).scale(1.85, 0.6, 1.1).move(0, 0.85, -0.5), sph(0.04, 16).scale(1.6, 0.55, 1.4).move(0, 0.87, -0.39), sph(0.025, 12).scale(1.1, 0.8, 1.6).move(0, 0.872, -0.255)));
  b.add("steel-bright", ...tube([S, [0, 0.83, -0.29]], 0.012), rod([0, 0.835, -0.29], [0, 0.845, -0.27], 0.01), ...[-1, 1].flatMap((s) => tube([[0, 0.84, -0.28], [s * 0.04, 0.83, -0.38], [s * 0.06, 0.83, -0.49]], 0.005)));
  for (const s of [-1, 1]) b.add("lacquer-black", ...coil([s * 0.06, 0.72, -0.5], 0.11, 0.019, 0.003, 9));
  b.add(F, rod([-0.07, 0.72, -0.5], [0.07, 0.72, -0.5], 0.008), ...[-1, 1].map((s) => rod([s * 0.065, 0.72, -0.5], [s * 0.04, 0.7, -0.42], 0.007)));
  // the footboards: ribbed rubber on a board, rising to the front, on brackets from the cradle
  for (const s of [-1, 1]) {
    const fb = (q: Solid) => q.rotate(-17, 0, 0).move(s * 0.19, 0.3, 0.13);
    b.add("rubber", fb(rbox(0.11, 0.018, 0.3, 0.008, 0, -0.018, 0)));
    for (let i = 0; i < 17; i++) b.add("rubber", fb(box(0.096, 0.005, 0.008, 0, -0.001, -0.136 + i * 0.017)));
    b.add(F, rod([s * 0.02, 0.22, 0.05], [s * 0.15, 0.27, 0.05], 0.01), rod([s * 0.02, 0.22, 0.2], [s * 0.15, 0.31, 0.2], 0.01));
  }
  // the kick-starter's crank on the left of the back hub, its pedal turned in
  b.add("steel-bright", ...tube([[0.075, R, ZR], [0.11, R + 0.03, ZR + 0.02], [0.115, R + 0.16, ZR + 0.09]], 0.009), turn([[0, 0], [0.012, 0], [0.012, 0.07], [0, 0.07]], 10).rotate(0, 0, 90).move(0.19, R + 0.16, ZR + 0.09));
  // the carrier: two rails, cross bars and stays; the toolboxes on its sides; the dispatch case strapped on top
  for (const s of [-1, 1]) {
    b.add(F, ...tube([[s * 0.03, 0.78, -0.33], [s * 0.075, 0.72, -0.47], [s * 0.075, 0.715, -1.0], [s * 0.04, 0.712, -1.03]], 0.008));
    b.add(F, rod([s * 0.075, 0.715, -0.92], [s * 0.075, R + 0.01, ZR], 0.008), rod([s * 0.075, 0.715, -0.62], [s * 0.075, R + 0.01, ZR], 0.008));
    b.add(F, rbox(0.075, 0.12, 0.23, 0.008, s * 0.12, 0.59, -0.875), rbox(0.08, 0.012, 0.235, 0.004, s * 0.12, 0.705, -0.875));
    b.add("steel-bright", rbox(0.004, 0.025, 0.012, 0.001, s * 0.159, 0.665, -0.875), rod([s * 0.083, 0.712, -0.98], [s * 0.083, 0.712, -0.77], 0.004));
  }
  for (const z of [-0.6, -0.8, -1.0]) b.add(F, rod([-0.075, 0.715, z], [0.075, 0.715, z], 0.007));
  b.add("leather", rbox(0.22, 0.13, 0.28, 0.03, 0, 0.723, -0.78), rbox(0.225, 0.02, 0.2, 0.01, 0, 0.84, -0.73));
  for (const z of [-0.68, -0.88]) b.add("leather", rbox(0.232, 0.142, 0.025, 0.004, 0, 0.718, z));
  b.add("steel-bright", rbox(0.03, 0.03, 0.006, 0.003, 0, 0.8, -0.639));
  // mudguards, and the back stand let down
  guard(b, F, 0, ZR, 0.7, -2.05, 0.11);
  guard(b, F, 0, ZF, -1.0, 1.35, 0.095);
  b.add(F, ...[-1, 1].flatMap((s) => tube([[s * 0.085, R, ZR], [s * 0.12, 0.02, ZR - 0.17]], 0.009)), rod([-0.12, 0.012, ZR - 0.17], [0.12, 0.012, ZR - 0.17], 0.01));
  if (sidecar) sidecarOn(b, id);
  return b.parts();
}

/** The sidecar on the bike's right: its wheel and guard, the tube chassis braced to the frame at three points, the body
 *  on leaf springs, the seat, the padded rim and the apron. */
function sidecarOn(b: B, id: string) {
  const XS = -1.17, ZS = -0.42, XB = -0.72, Y0 = 0.36;
  wheel(b, id, XS, ZS, 0.08);
  guard(b, F, XS, ZS, -1.1, 1.2, 0.11);
  // the chassis: a loop of tube under the body, the axle out to the wheel, the braces to the bike
  const loop: V3[] = [[XB + 0.2, 0.29, -0.78], [XB + 0.2, 0.29, 0.35], [XB + 0.12, 0.29, 0.55], [XB - 0.12, 0.29, 0.55], [XB - 0.2, 0.29, 0.35], [XB - 0.2, 0.29, -0.78], [XB + 0.2, 0.29, -0.78]];
  b.add("iron", ...tube(loop, 0.016), rod([XB + 0.2, 0.29, ZS], [XS + 0.04, R, ZS], 0.018), rod([XB - 0.2, 0.29, ZS + 0.15], [XS + 0.03, R, ZS], 0.014));
  b.add("iron", ...tube([[XB + 0.2, 0.29, 0.3], [-0.25, 0.27, 0.22], [-0.02, 0.25, 0.17]], 0.016), ...tube([[XB + 0.2, 0.29, -0.7], [-0.3, 0.3, -0.7], [-0.08, R, ZR]], 0.016), ...tube([[XB + 0.2, 0.29, -0.5], [-0.35, 0.6, -0.42], [-0.03, 0.78, -0.31]], 0.013));
  for (const p of [[-0.02, 0.25, 0.17], [-0.08, R, ZR], [-0.03, 0.78, -0.31]] as V3[]) b.add("steel-bright", sph(0.024, 10).move(...p));
  // leaf springs: a C-spring each side at the back, a cross spring under the nose
  for (const s of [-1, 1]) {
    const arc: V3[] = [];
    for (let i = 0; i <= 10; i++) { const a = -0.3 + (i / 10) * 3.4; arc.push([XB + s * 0.2, 0.29 + 0.05 + 0.05 * Math.cos(a), -0.62 + 0.08 * Math.sin(a) - 0.04]); }
    b.add("iron", ...tube(arc, 0.009));
  }
  b.add("iron", ...tube(bez([[XB - 0.2, 0.3, 0.42], [XB - 0.1, 0.39, 0.42], [XB + 0.1, 0.39, 0.42], [XB + 0.2, 0.3, 0.42]], 8), 0.009));
  // the body: a rounded tub run into a long nose, the well cut into it with a rounded edge, meshed and simplified
  const body = sdf.smoothSubtract(0.015,
    sdf.intersect(sdf.smoothUnion(0.14, sdf.box(0.56, 0.44, 0.92, 0.19).move(0, 0.22, -0.3), sdf.ellipsoid(0.25, 0.2, 0.46).move(0, 0.2, 0.22)), sdf.box(1, 0.44, 2.4, 0).move(0, 0.22, 0)),
    sdf.box(0.47, 0.5, 0.62, 0.07).move(0, 0.37, -0.39));
  b.add(F, body.solid(0.011).simplify(0.0012).move(XB, Y0, 0));
  b.add("iron", rbox(0.5, 0.012, 0.95, 0.02, XB, Y0 - 0.012, -0.22));
  // the padded rim round the well, the seat and back, the apron buttoned over the front of the well, the grab rail
  const rim: V3[] = [];
  const hw = 0.235, z0 = -0.7, z1 = -0.08, rc = 0.07, yr = Y0 + 0.445;
  const corner = (cx: number, cz: number, a0: number) => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); rim.push([XB + cx + rc * Math.cos(a), yr, cz + rc * Math.sin(a)]); } };
  corner(hw - rc, z1 - rc, 0); corner(-hw + rc, z1 - rc, Math.PI / 2); corner(-hw + rc, z0 + rc, Math.PI); corner(hw - rc, z0 + rc, (3 * Math.PI) / 2);
  rim.push(rim[0]);
  b.add("leather", ...tube(rim, 0.016));
  b.add("leather", rbox(0.44, 0.1, 0.36, 0.035, XB, Y0 + 0.11, -0.5), rbox(0.42, 0.26, 0.07, 0.03).rotate(-10, 0, 0).move(XB, Y0 + 0.19, -0.64));
  b.add("canvas-field", rbox(0.46, 0.012, 0.22, 0.006).rotate(-6, 0, 0).move(XB, Y0 + 0.435, -0.2), ...[-0.16, -0.05, 0.05, 0.16].map((x) => turn([[0, 0], [0.006, 0], [0.006, 0.004], [0, 0.005]], 8).move(XB + x, Y0 + 0.445, -0.1)));
  b.add("steel-bright", ...tube([[XB + 0.26, Y0 + 0.43, -0.62], [XB + 0.27, Y0 + 0.47, -0.55], [XB + 0.27, Y0 + 0.47, -0.3], [XB + 0.26, Y0 + 0.43, -0.23]], 0.008));
  // a step plate on the chassis and a lamp on the nose
  b.add("rubber", rbox(0.16, 0.012, 0.22, 0.006, XB + 0.27, 0.3, -0.05));
  b.add("lacquer-black", zAxis(turn([[0, -0.04], [0.03, -0.035], [0.035, 0.0], [0, 0.0]], 14)).move(XB - 0.1, Y0 + 0.34, 0.6));
  b.add("glass-signal", zAxis(turn([[0, 0], [0.03, 0], [0, 0.008]], 14)).move(XB - 0.1, Y0 + 0.34, 0.6));
}

const P = (id: string, size: [number, number, number], tris: number, sidecar: boolean) => prop({ id, items: ["army-motorcycle"], size, place: "floor", where: "set", tris, parts: () => motorcycle(id, sidecar) });
P("moto-army", [0.75, 1.15, 2.1], 45000, false);
P("moto-army-sidecar", [1.6, 1.15, 2.1], 65000, true);

export const KIT_MOTO = true;
