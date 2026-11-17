// The slot canyon (blender/blockout.py canyon, a: the directed one, b: its reroll) under a high sun that the agent
// lowers a step on each beat after the drop until it stands at 6° (CANYON_STEPS): its shaft slides down the wall.
import { staticFile } from "raea";
import { Environment } from "raea/3d";
import { Glb, type V3 } from "./kit";
import { CANYON_STEPS } from "./plan";

/** the sun's height (degrees) at `t`: 62° before the first step, each step eased over a fifth of a second, 6° at the end */
export function canyonSunDeg(t: number) {
  const N = CANYON_STEPS.length;
  let deg = 62;
  CANYON_STEPS.forEach((s, k) => {
    const u = Math.min(1, Math.max(0, (t - s) / 0.2));
    const e = u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
    deg -= ((62 - 6) / N) * e;
  });
  return deg;
}
/** the sun across the slot from +x, a little ahead, at that height. High, it reaches the chamber's sand and its whole
 *  left wall; as it lowers, the right rim's shadow climbs that wall (a lowering sun's light can only climb) until at 6°
 *  only the rim burns, the slot below lit by its bounce */
export function canyonSun(t: number, held?: number): { from: V3; to: V3 } {
  const deg = held ?? canyonSunDeg(t);
  const r = (deg * Math.PI) / 180;
  return { from: [40 * Math.cos(r), 40 * Math.sin(r), -40], to: [0, 0, -30] };
}

export function Canyon({ v }: { v: string }) {
  return (
    <>
      <Environment src={staticFile("hdri/valley_of_desolation.hdr")} intensity={0.6} rotation={1.1} background />
      <Glb file={`gb-canyon-${v}`} />
    </>
  );
}
