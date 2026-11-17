// What the hand holds. Each is drawn along the stick a tripod grip carries (v2/poses.ts STICK): `tip` is its working
// end and `back` the other, both already in the scene (carried by the hand bone), so a tool can't slide in the grip.
import { Cone, Cylinder, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import type { V3 } from "./rig";

const arc = (u: V3) => {
  const l = Math.hypot(u[0], u[2]);
  return l < 1e-6 ? (u[1] > 0 ? Quat.IDENTITY : Quat.fromRotationX(Math.PI)) : Quat.fromAxisAngle([u[2] / l, 0, -u[0] / l], Math.acos(Math.max(-1, Math.min(1, u[1]))));
};
/** a part of a tool: from `from` to `to` along the stick (units from the tip), drawn by `children` (a shape and its material, long axis y) */
function along(tip: V3, u: V3, from: number, to: number) {
  const c = (from + to) / 2;
  return Transform.fromXyz(tip[0] + u[0] * c, tip[1] + u[1] * c, tip[2] + u[2] * c).withRotation(arc(u));
}
const unit = (tip: V3, back: V3): V3 => { const d: V3 = [back[0] - tip[0], back[1] - tip[1], back[2] - tip[2]]; const l = Math.hypot(...d); return [d[0] / l, d[1] / l, d[2] / l]; };
const flip = (u: V3): V3 => [-u[0], -u[1], -u[2]];

/** a pencil, 17.5 cm: a graphite point, a cut wooden cone, a yellow lacquered body, a ferrule and its rubber */
export function Pencil({ tip, back, r = 0.0375 }: { tip: V3; back: V3; r?: number }) {
  const u = unit(tip, back);
  return (
    <>
      <Mesh3d name="pencil-lead" transform={along(tip, flip(u), -0.045, 0)}>
        <Cone radius={r * 0.3} height={0.045} />
        <StandardMaterial base_color="#2b2b2e" perceptual_roughness={0.35} metallic={0.4} />
      </Mesh3d>
      <Mesh3d name="pencil-wood" transform={along(tip, flip(u), -0.19, -0.035)}>
        <Cone radius={r} height={0.155} />
        <StandardMaterial base_color="#d9b88a" perceptual_roughness={0.85} />
      </Mesh3d>
      <Mesh3d name="pencil-body" transform={along(tip, u, 0.19, 1.56)}>
        <Cylinder radius={r} half_height={0.685} />
        <StandardMaterial base_color="#e2a917" perceptual_roughness={0.32} clearcoat={0.6} clearcoat_perceptual_roughness={0.2} />
      </Mesh3d>
      <Mesh3d name="pencil-ferrule" transform={along(tip, u, 1.56, 1.68)}>
        <Cylinder radius={r * 1.04} half_height={0.06} />
        <StandardMaterial base_color="#c9c4b8" metallic={1} perceptual_roughness={0.3} />
      </Mesh3d>
      <Mesh3d name="pencil-rubber" transform={along(tip, u, 1.68, 1.76)}>
        <Cylinder radius={r} half_height={0.04} />
        <StandardMaterial base_color="#d98a8a" perceptual_roughness={0.9} />
      </Mesh3d>
    </>
  );
}

/** a round sable brush: loaded bristles, a ferrule, a long lacquered handle that runs on past the hand */
export function Brush({ tip, back, r = 0.0375, paint = "#b3261c" }: { tip: V3; back: V3; r?: number; paint?: string }) {
  const u = unit(tip, back);
  return (
    <>
      <Mesh3d name="brush-paint" transform={along(tip, flip(u), -0.1, 0)}>
        <Cone radius={r * 0.62} height={0.1} />
        <StandardMaterial base_color={paint} perceptual_roughness={0.25} />
      </Mesh3d>
      <Mesh3d name="brush-hair" transform={along(tip, flip(u), -0.27, -0.1)}>
        <Cone radius={r * 1.05} height={0.17} />
        <StandardMaterial base_color="#3a2618" perceptual_roughness={0.6} />
      </Mesh3d>
      <Mesh3d name="brush-ferrule" transform={along(tip, u, 0.275, 0.5)}>
        <Cylinder radius={r} half_height={0.1125} />
        <StandardMaterial base_color="#cfc9bb" metallic={1} perceptual_roughness={0.28} />
      </Mesh3d>
      <Mesh3d name="brush-handle" transform={along(tip, u, 0.5, 2.3)}>
        <Cylinder radius={r} half_height={0.9} />
        <StandardMaterial base_color="#5a1410" perceptual_roughness={0.25} clearcoat={0.8} clearcoat_perceptual_roughness={0.15} />
      </Mesh3d>
    </>
  );
}

/** a conductor's baton: a cork grip where the pencil's body was, and a long white shaft out past its point */
export function Baton({ tip, back, r = 0.0375 }: { tip: V3; back: V3; r?: number }) {
  const u = unit(tip, back);
  return (
    <>
      <Mesh3d name="baton-shaft" transform={along(tip, u, -2.7, 0.2)}>
        <Cylinder radius={0.018} half_height={1.45} />
        <StandardMaterial base_color="#f1ede4" perceptual_roughness={0.4} />
      </Mesh3d>
      <Mesh3d name="baton-grip" transform={along(tip, u, 0.15, 1.3)}>
        <Cylinder radius={r} half_height={0.575} />
        <StandardMaterial base_color="#b98d5e" perceptual_roughness={0.9} />
      </Mesh3d>
    </>
  );
}
