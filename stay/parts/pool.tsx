// The generator's pool hall (blender/blockout.py pool, variants a..e) and what happens in it: its tubes (three rows of
// five glowing boxes in the fixtures' housings), dying a row at a time on the verse's hit in the reroll that's up then,
// and in the held one (e) put out a row a beat when the comment is sent, the sun coming in through the high windows.
import { staticFile } from "raea";
import { Environment } from "raea/3d";
import { LinearRgba } from "raea/color";
import { Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import { Glb, Glow, type V3 } from "./kit";
import { LIGHT, SHOT_LIGHT, glowAt } from "./light";
const evOf = (shot: string) => (SHOT_LIGHT[shot] ?? LIGHT.pool).ev;
import { POOL_LIGHT, TUBES_DIE } from "./plan";

/** each variant's ceiling height, water level, pool rectangle and whether it has tubes (blockout.py POOL) */
export const POOLS: Record<string, { h: number; water: number; pool: [number, number, number, number]; tubes: boolean }> = {
  a: { h: 6.0, water: -0.3, pool: [-4, 4, -3, -21], tubes: true },
  b: { h: 6.4, water: -0.1, pool: [-4.5, 3.5, -3, -21], tubes: true },
  c: { h: 5.2, water: -0.4, pool: [-3.5, 3.5, -5, -18], tubes: true },
  d: { h: 7.0, water: -0.25, pool: [-2.5, 2.5, -3, -23], tubes: false },
  e: { h: 4.6, water: -0.3, pool: [-4, 4, -4, -20], tubes: true },
};
/** a tube's glow (Solari units: thousands light a room) */
const TUBE = 5000;

/** whether row `r` of the tubes is on at `t` in the shot `shot` */
function rowOn(shot: string, v: string, r: number, t: number) {
  if (shot === "pool-b2") return t < TUBES_DIE[r];
  if (v === "e" && (shot === "pool-e")) return t < POOL_LIGHT[r];
  if (v === "e") return false; // the water shot and the montage's directed pool: lit by the sun
  return true;
}
/** the sun is in through the windows once the first row is out (the held pool), or in the lit pool's later shots */
export const poolSunIn = (shot: string, v: string, t: number) => v === "e" && (shot !== "pool-e" || t >= POOL_LIGHT[0]);
/** the skylit reroll (d) is in a high noon sun through its open roof */
const NOON = { from: [6, 40, -4] as V3, to: [0, 0, -12] as V3 };

export function Pool({ shot, v, t }: { shot: string; v: string; t: number }) {
  const P = POOLS[v];
  const [x0, x1, z0, z1] = P.pool;
  return (
    <>
      <Glb file={`gb-pool-${v}`} />
      {/* the water: a still, glossy plane over the basin (its waves are the build's) */}
      <Mesh3d name="water" castShadow={false} transform={Transform.fromXyz((x0 + x1) / 2, P.water, (z0 + z1) / 2)}>
        <Plane3d half_size={[(x1 - x0) / 2, (z0 - z1) / 2]} />
        <StandardMaterial base_color="#3d5560" perceptual_roughness={0.06} reflectance={0.6} />
      </Mesh3d>
      {/* the day outside: a sky panorama through the high windows once the sun is in, and over the skylit reroll's open
          roof (traced, so its light comes in past the walls; a glowing panel there would block the sun). Its strength
          follows the shot's exposure so the sky reads as day on film: 0.6 at the canyon's -2.5 */}
      {(poolSunIn(shot, v, t) || v === "d") && <Environment key="day" src={staticFile("hdri/valley_of_desolation.hdr")} intensity={0.6 * 2 ** (-2.5 - evOf(shot))} rotation={2.2} background />}
      {/* the exit sign over the far door (blockout's exit-sign box) glows red: all that's left when the tubes die. Its
          misspelt word is the build's (graybox: the lit face) */}
      <Glow name="exit-glow" at={[3.0, 2.675, -25.87]} half={[0.55, 0.13, 0.005]} lum={glowAt(evOf(shot), 250)} rgb={[1, 0.08, 0.05]} />
      {P.tubes && [-3, 0, 3].map((x, r) => [0, 1, 2, 3, 4].map((j) => {
        const on = rowOn(shot, v, r, t);
        const at: V3 = [x, P.h - 0.1, -3 - j * 5];
        // each state its own key: the same entity switched off would keep its first (lit) material
        return on ? <Glow key={`on-${r}-${j}`} name={`tube-${r}-${j}`} at={at} half={[0.05, 0.03, 1.15]} lum={TUBE} rgb={[0.92, 1, 0.95]} /> : (
          <Mesh3d key={`off-${r}-${j}`} name={`tube-off-${r}-${j}`} castShadow={false} transform={Transform.fromXyz(...at)}>
            <Plane3d half_size={[0.05, 1.15]} />
            <StandardMaterial base_color="#9a9a9a" emissive={new LinearRgba(0, 0, 0, 1)} />
          </Mesh3d>
        );
      }))}
    </>
  );
}

/** the pool's sun: low through the left wall's high windows when it's in, else under the floor (every slab blocks it:
 *  a sun that appears after a render's first frame lights nothing, so it is there from the start) */
export function poolSun(shot: string, v: string, t: number): { from: V3; to: V3 } {
  if (v === "d") return NOON;
  return poolSunIn(shot, v, t) ? { from: [-30, 9.5, -6], to: [0, 0, -12] } : { from: [0.3, -50, 0.2], to: [0, 0, 0] };
}
