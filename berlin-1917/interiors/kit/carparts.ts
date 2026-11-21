// Parts the motor cars share (cars.ts, ambulance.ts), in the vehicle frame (origin on the ground under the middle
// between the axles, +z forward, the driver's right -x): wheels, the pressed-steel frame, the axles on their leaf
// springs, lamps, crowned sections for bonnets and roofs, the wings' section.
import { manifold, type Solid } from "raea/3d";
import { type V3 } from "./geo";
import type { MatId } from "./mats";
import { leafSpring, type P2, slat, sph, turn, turnX, tyre, wireWheel, zAxis } from "./forms";
import { rod, spoked } from "./outgeo";
import { type Build, WHEELS } from "./vehicles";

export const PAINT: MatId = "paint-field", BLACK: MatId = "lacquer-black", NICKEL: MatId = "steel-bright";
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ramp = (t: number, a: number, b: number) => { const u = Math.min(1, Math.max(0, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
const turned = (at: V3) => (s: Solid) => (at[0] < 0 ? s.rotate(0, 180, 0) : s).move(...at);

/** A Rudge wire wheel of radius R on a tyre of section t at `at`, its cap outward; listed for spinning unless not. */
export function wireAt(b: Build, id: string, at: V3, R: number, t: number, list = true) {
  const w = wireWheel(R, t, 30), m = turned(at);
  b.add("rubber", m(w.rubber)); b.add("enamel-black", m(w.spokes)); b.add(NICKEL, m(w.cap));
  if (list) (WHEELS[id] ??= []).push({ at, r: R });
}
/** A wooden artillery wheel of radius R on a pneumatic tyre of section t, painted `wood`, its hub cap outward. */
export function artilleryAt(b: Build, id: string, at: V3, R: number, t: number, wood: MatId = PAINT, list = true, tyred = true) {
  const w = spoked(R - 2 * t + 0.01, 0.075, 12, { felloe: 0.045, hub: 0.085 }), m = turned(at);
  if (tyred) b.add("rubber", m(tyre(R - t, t)), m(w.iron)); else b.add("iron", m(w.iron)); // off: only the steel rim on the felloe
  b.add(wood, m(w.wood));
  b.add(NICKEL, m(turnX([[0, 0], [0.05, 0], [0.05, 0.03], [0.035, 0.06], [0, 0.065]], 16).move(0.035, 0, 0)));
  if (list) (WHEELS[id] ??= []).push({ at, r: R });
}

/** A crowned section in (x, y): flat sides hw out from yb up to the shoulders ys, the top rising `rise` over them,
 *  as a parabola or (round) a half ellipse; the shoulders rounded. */
export function crown(hw: number, yb: number, ys: number, rise: number, round = false): P2[] {
  const c = hw - 0.025, f = (u: number) => (round ? Math.sqrt(Math.max(0, 1 - u * u)) : 1 - u * u), p: P2[] = [[hw, yb], [hw, ys - 0.025], [hw - 0.007, ys - 0.007], [c, ys]];
  for (let k = 7; k >= -7; k--) { const u = (c * k) / 8; p.push([u, ys + rise * f(u / c)]); }
  p.push([-c, ys], [-hw + 0.007, ys - 0.007], [-hw, ys - 0.025], [-hw, yb]);
  return p;
}
/** The hull of two (x, y) sections at z0 and z1: a bonnet that tapers or a roof that runs straight. */
export const hullAlong = (a: P2[], z0: number, b: P2[], z1: number) => manifold.hull([...a.map(([x, y]) => [x, y, z0] as V3), ...b.map(([x, y]) => [x, y, z1] as V3)]);
/** A wing's section for sweepSheet (across in half-widths, up in metres): crowned, its inner edge beaded, the outer
 *  edge turned down into a lip `lip` deep. */
export const wingLine = (lip: number): P2[] => [[-1, -0.035], [-1.02, -0.008], [-0.94, 0.012], [-0.6, 0.02], [0, 0.024], [0.6, 0.02], [0.94, 0.012], [1.01, -0.01], [1, -lip]];

/** A headlamp of radius r at `at`, looking forward: the drum with its domed back, the nickel bezel, the glass. */
export function lamp(b: Build, at: V3, r: number, body: MatId = NICKEL) {
  b.add(body, zAxis(turn([[0, -0.75 * r], [0.7 * r, -0.75 * r], [0.95 * r, -0.4 * r], [r, 0], [r, 0.3 * r], [0, 0.3 * r]], 20)).move(...at));
  b.add(NICKEL, zAxis(turn([[0.86 * r, 0.3 * r], [1.08 * r, 0.3 * r], [1.08 * r, 0.52 * r], [0.86 * r, 0.52 * r]], 20)).move(...at));
  b.add("glass-plate", zAxis(turn([[0, 0.32 * r], [0.88 * r, 0.32 * r], [0.84 * r, 0.44 * r], [0, 0.55 * r]], 20)).move(...at));
}

/** The pressed-steel frame from z0 to z1, its channels open inward at x +-0.42, the dumb irons dropping forward of
 *  z1 to the front springs, cross members at `across`. */
export function frame(b: Build, z0: number, z1: number, across: number[]) {
  for (const s of [-1, 1]) {
    b.add(BLACK, manifold.box(0.05, 0.14, z1 - z0).move(s * 0.42, 0.6, (z0 + z1) / 2).minus(manifold.box(0.04, 0.11, z1 - z0 + 0.1).move(s * 0.408, 0.6, (z0 + z1) / 2)));
    b.add(BLACK, slat([s * 0.42, 0.6, z1 - 0.01], [s * 0.42, 0.57, z1 + 0.33], 0.09, 0.045));
  }
  for (const z of across) b.add(BLACK, rod([-0.42, 0.6, z], [0.42, 0.6, z], 0.028));
}
/** The front axle at zf: a dropped beam on semi-elliptic springs, king pins at +-kx, the track rod behind, the drag
 *  link from the right arm back to the steering box at (box). */
export function frontAxle(b: Build, zf: number, R: number, kx: number, box: V3) {
  const beam: P2[] = [[-kx, R + 0.02], [-0.48, R + 0.04], [-0.34, R], [0, R - 0.03], [0.34, R], [0.48, R + 0.04], [kx, R + 0.02]];
  for (let i = 0; i + 1 < beam.length; i++) b.add(BLACK, slat([beam[i][0], beam[i][1], zf], [beam[i + 1][0], beam[i + 1][1], zf], 0.07, 0.045));
  for (const s of [-1, 1]) b.add(BLACK, leafSpring(0.95, 6, 0.05, 0.05).move(s * 0.42, R + 0.07, zf), rod([s * kx, R - 0.07, zf], [s * kx, R + 0.11, zf], 0.024), rod([s * kx, R - 0.01, zf], [s * (kx - 0.04), R - 0.01, zf - 0.16], 0.014));
  b.add(BLACK, rod([-(kx - 0.04), R - 0.01, zf - 0.16], [kx - 0.04, R - 0.01, zf - 0.16], 0.013), rod([-kx, R + 0.07, zf - 0.02], box, 0.015));
  b.add("zinc", manifold.box(0.09, 0.12, 0.12).move(box[0], box[1] + 0.02, box[2]));
}
/** The rear axle at zr: the banjo housing with its differential, brake drums inside the wheels at +-dx, the cardan
 *  tube forward to (gear), leaf springs of length L along the frame centred at zs. */
export function rearAxle(b: Build, zr: number, R: number, dx: number, gear: V3, L: number, zs: number) {
  b.add(BLACK, rod([-(dx + 0.04), R, zr], [dx + 0.04, R, zr], 0.042), sph(0.14, 16).scale(1, 1, 0.8).move(0, R, zr), rod([0, R + 0.04, zr + 0.12], gear, 0.035));
  for (const s of [-1, 1]) b.add(BLACK, turnX([[0, -0.035], [0.17, -0.035], [0.17, 0.035], [0, 0.035]], 24).move(s * dx, R, zr), leafSpring(L, 6, 0.04, 0.055).move(s * 0.42, R + 0.05, zs));
}
