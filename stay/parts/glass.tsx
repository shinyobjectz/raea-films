// The glasshouse in the morning (blender/blockout.py glasshouse) and its plant (blockout.py plant: a pot and leaves all
// facing its +x), which the agent turns from the wall to the light a step a beat (TURNS), each step eased in with a
// small overshoot and settle. Its reroll puts the plant somewhere else, the wrong size, facing nowhere. The app stands
// in the aisle in the second shot, its tool log and then inspect on its screen.
import { staticFile } from "raea";
import { Environment } from "raea/3d";
import { Glb, Screen, type V3 } from "./kit";
import { TURNS } from "./plan";
import { screenFile } from "./app";
import { screenGlow } from "./light";

export const BENCH: V3 = [-2.6, 0.9, -5];
/** the plant's turn (radians about y) at `t`: facing the wall (-x, pi) before the first step, the light (+x, 0) after
 *  the last; each step 0.35 s, overshooting by a tenth and settling */
export function plantYaw(t: number) {
  const step = Math.PI / TURNS.length;
  let yaw = Math.PI;
  for (const s of TURNS) {
    const u = Math.min(1, Math.max(0, (t - s) / 0.35));
    // an ease out with a small overshoot (back): 1 + c3 (u-1)^3 + c1 (u-1)^2
    const c1 = 1.2, c3 = c1 + 1;
    const e = u <= 0 ? 0 : 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
    yaw -= step * e;
  }
  return yaw;
}
/** the turn as a 0..1 (the word "turn" turns with it) */
export const turnOf = (t: number) => (Math.PI - plantYaw(t)) / Math.PI;
export const GLASS_SUN = { from: [30, 14, -8] as V3, to: [0, 0, -5] as V3 };

export function Glass({ t, reroll = false, app = false }: { t: number; reroll?: boolean; app?: boolean }) {
  return (
    <>
      <Environment src={staticFile("hdri/valley_of_desolation.hdr")} intensity={0.8} rotation={0.4} background />
      <Glb file="gb-glasshouse-a" />
      {reroll
        ? <Glb file="gb-plant-a" name="plant" at={[-2.4, 0.9, -9.2]} yaw={2.1} scale={1.7} />
        : <Glb file="gb-plant-a" name="plant" at={BENCH} yaw={app ? 0 : plantYaw(t)} scale={1.4} />}
      {app && <Screen at={[0.5, 1.3, -8]} yaw={0.35} file={screenFile("glass-app", t)} glow={screenGlow("glass-app")} />}
    </>
  );
}
