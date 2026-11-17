// The tall frame's pans (1080x1920, v3/size.json). The lens keeps its fov, which is vertical, so the tall frame sees the
// same height as the 5:4 one and the middle 30 degrees of the 60 it saw across: a part of the same picture, so nothing
// unbuilt comes into view. Five shots' cursors reach things outside that middle (tools/frame-fit.ts measured them: the hallway's torch, the kitchen's
// wave, the greenhouse's lake, the canyon's drift, the harbour's ship). On the tall frame the lens turns right toward
// what the cursor goes to and comes back before the cut. Each pan eases (min-jerk) between its knots and is zero at
// every join of the one take, so the take's worlds still meet on the same picture. On the 5:4 frame nothing turns.
import type { Cam } from "./cam";
import { TALL } from "./plan";

type Knots = [number, number][];
/** the opening take's pans, by the film's second (the take's own clock): [second, degrees to the right] */
const TAKE: Knots[] = [
  [[0.1, 0], [0.85, 16], [1.2, 16], [1.75, 0]],          // the hallway: the torch on the right wall, clicked at 0.89
  [[3.75, 0], [4.55, 14], [4.95, 14], [5.65, 0]],        // the kitchen: the wave's burst on the right (2.75 + 1.0 to 2.9)
  [[15.11, 0], [15.56, 7], [16.11, 7], [16.61, 0]],      // the greenhouse: the lake tapped at 0.62 (15.006 + 0.1 to 1.6)
];
/** the other shots' pans, by the shot's own second */
const SHOT: Record<string, Knots> = {
  canyon: [[4.4, 0], [6.0, 8], [6.6, 8], [7.6, 0]],
  harbour: [[1.95, 0], [2.4, 4.5], [3.2, 4.5], [3.7, 0]],
  // the ending's close moves (v3/outro.tsx), each held turned the whole shot (they join by cuts, so nothing has to
  // meet): the middle of the 5:4 picture had cut the note's first words, raea's mark and the robot's right eye
  "ui-notes": [[-1, -9], [99, -9]],
  "ui-feed": [[-1, -9], [99, -9]],
  "ui-robot": [[-1, 9], [99, 9]],
};
const minJerk = (u: number) => u * u * u * (10 - 15 * u + 6 * u * u);
function along(k: Knots, t: number): number {
  if (t <= k[0][0] || t >= k[k.length - 1][0]) return 0;
  let i = 0; while (t >= k[i + 1][0]) i++;
  const [t0, a] = k[i], [t1, b] = k[i + 1];
  return a + (b - a) * minJerk((t - t0) / (t1 - t0));
}
/** the lens turned `deg` to the right about its eye (yaw only: the pitch and the fov are kept) */
export function panned(c: Cam, deg: number): Cam {
  if (!deg) return c;
  const d = [c.look[0] - c.eye[0], c.look[1] - c.eye[1], c.look[2] - c.eye[2]], l = Math.hypot(d[0], d[2]);
  const yaw = Math.atan2(d[0], -d[2]) + (deg * Math.PI) / 180;
  return { ...c, look: [c.eye[0] + Math.sin(yaw) * l, c.look[1], c.eye[2] - Math.cos(yaw) * l] };
}
/** the take's lens at film second `abs`, turned for the tall frame */
export const tallTake = (c: Cam, abs: number): Cam => (TALL ? panned(c, TAKE.reduce((s, k) => s + along(k, abs), 0)) : c);
/** shot `id`'s lens at its second `t`, turned for the tall frame */
export const tallShot = (id: string, c: Cam, t: number): Cam => (TALL && SHOT[id] ? panned(c, along(SHOT[id], t)) : c);
