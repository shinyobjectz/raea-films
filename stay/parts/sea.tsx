// The sea at sunset: a glossy plane to the horizon under the sunset panorama, and the swell as rows of long low crests
// rolling in toward the camera; in the collapse they slow to half (SLOW), and the reroll has them come in crooked under
// a sky turned the wrong way. The app over it at the end (app.tsx Hero) is built on this.
import { staticFile } from "raea";
import { Environment } from "raea/3d";
import { Cylinder, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { SLOW } from "./plan";

/** how far the swell has travelled by `t` (metres): 2.4 m/s, slowing to SLOW.to of that from SLOW.from */
export function swellAt(t: number, held: boolean) {
  const v = 2.4;
  if (!held || t <= SLOW.from) return v * t;
  const k = Math.min(1, (t - SLOW.from) / SLOW.over);
  // the speed eases from v to v*to over `over` seconds: its integral
  const during = Math.min(t - SLOW.from, SLOW.over);
  const ramp = v * (during - (1 - SLOW.to) * (during * during) / (2 * SLOW.over));
  const after = Math.max(0, t - SLOW.from - SLOW.over) * v * SLOW.to;
  return v * SLOW.from + ramp + after + 0 * k;
}

export const SEA_SUN = { from: [0, 5, -60] as [number, number, number], to: [0, 0, 0] as [number, number, number] };

export function Sea({ t, held = false, reroll = false }: { t: number; held?: boolean; reroll?: boolean }) {
  const travel = swellAt(t, held);
  const GAP = 7;
  const crests = Array.from({ length: 16 }, (_, k) => {
    const z = -100 + ((k * GAP + travel) % (16 * GAP));
    return { k, z };
  });
  return (
    <>
      <Environment src={staticFile("hdri/the_sky_is_on_fire.hdr")} intensity={reroll ? 0.6 : 1.0} rotation={reroll ? 2.4 : 0.15} background />
      <Mesh3d name="sea" castShadow={false} transform={Transform.fromXyz(0, 0, -400)}>
        <Plane3d half_size={[1200, 800]} />
        <StandardMaterial base_color={reroll ? "#5b6670" : "#1e2a33"} perceptual_roughness={0.12} reflectance={0.5} />
      </Mesh3d>
      {crests.map(({ k, z }) => (
        <Mesh3d key={k} name={`crest-${k}`} castShadow={false} transform={Transform.fromXyz(0, -0.06, z).withRotation(Quat.fromEuler("XYZ", 0, reroll ? 0.25 : 0, Math.PI / 2)).withScale([1, 1, 0.35])}>
          <Cylinder radius={0.32} half_height={60} />
          <StandardMaterial base_color="#24323c" perceptual_roughness={0.15} reflectance={0.5} />
        </Mesh3d>
      ))}
    </>
  );
}
