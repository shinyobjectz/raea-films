// Camera and cursor motion that never stops dead. the director, 11-11: "making all camera movmeents wayyyy smoother. they are
// super jadggand start stop no smoothnes or easing". A camera runs on one curve through its keys for as long as it
// stays in a place, however many shots that is: its speed changes gently (the curve's slope is carried through every
// key, so there is no stop at a key or a cut), and it only comes to rest where a key says so by repeating itself.
import type { V3 } from "./math";

export type Key<T> = { t: number; v: T };
/** a value on the curve through `keys` at time t: cubic Hermite, each key's slope the mean of the slopes either side
 *  of it (so position and speed are both continuous), flat beyond the ends */
export function curve(keys: Key<number[]>[], t: number): number[] {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0].v;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0;
  while (t > keys[i + 1].t) i++;
  const a = keys[i], b = keys[i + 1], h = b.t - a.t, s = (t - a.t) / h;
  const slope = (j: number, d: number) => {
    const next = j + 1 < n ? (keys[j + 1].v[d] - keys[j].v[d]) / (keys[j + 1].t - keys[j].t) : undefined;
    const prev = j > 0 ? (keys[j].v[d] - keys[j - 1].v[d]) / (keys[j].t - keys[j - 1].t) : undefined;
    // at the ends the curve leaves and arrives at the speed of its only neighbour: it is already moving at a cut
    if (prev === undefined) return next!;
    if (next === undefined) return prev;
    return prev * next <= 0 ? 0 : (prev + next) / 2;      // no overshoot where the motion turns round
  };
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return a.v.map((_, d) => h00 * a.v[d] + h10 * h * slope(i, d) + h01 * b.v[d] + h11 * h * slope(i + 1, d));
}
export type CamKey = { t: number; eye: V3; look: V3; fov: number };
export const camOn = (keys: CamKey[], t: number) => {
  const v = curve(keys.map((k) => ({ t: k.t, v: [...k.eye, ...k.look, k.fov] })), t);
  return { eye: [v[0], v[1], v[2]] as V3, look: [v[3], v[4], v[5]] as V3, fov: v[6] };
};

/** a hand's reach from a to b over t0..t1: quick away, slow in (minimum jerk), bowed a little to one side as an arm's
 *  reach is, and settling the last few pixels after it arrives */
export function reach(t: number, a: [number, number], b: [number, number], t0: number, t1: number, bow = 0.12): [number, number] {
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
  const e = k * k * k * (10 - 15 * k + 6 * k * k);
  const dx = b[0] - a[0], dy = b[1] - a[1], arc = Math.sin(Math.PI * e) * bow;
  const settle = t > t1 ? Math.exp(-(t - t1) * 14) * Math.sin((t - t1) * 30) * 0.012 : 0;
  return [a[0] + dx * (e + settle) - dy * arc, a[1] + dy * (e + settle) + dx * arc];
}
