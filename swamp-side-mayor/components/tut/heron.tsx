// The tutorial's heron: the music video's (compositions/ruins.tsx Heron, posed by layout.ts heronPose), with its neck
// drawn as one tube from the shoulders through the bend to the head. The music video's neck is two capsules, each
// placed at its middle and turned along its length; craned out (b 111.4 to 113.4, the tutorial's 09.04), they come
// out short of each other and of the head, and the head floats free of the body (the director's note on 09.04: "heron neck
// broken"). That isn't the capsules' maths: a Mesh3d keeps the mesh its shape made on the first frame it's drawn, and a
// shape changed on a later frame (longer capsules as it cranes) isn't rebuilt, not even under a new key. So here no
// shape changes: the neck is two copies of one cylinder, each stretched and turned onto its run (shoulders to bend,
// bend to head), with a ball at the shoulders and at the bend, all placed each frame.
import { Instances, sdf } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Cylinder, Mesh3d, Sphere } from "raea/mesh";
import { Quat, Transform } from "raea/transform";
import { heronPose } from "../../compositions/layout";
import type { V3 } from "../../compositions/plan";

// the heron's parts, as ruins.tsx builds them (facing -z, 1.4 m to the crown)
const H_BODY = sdf.smoothUnion(0.07, sdf.ellipsoid(0.16, 0.18, 0.34).rotate(18, 0, 0).move(0, 0.76, 0.03), sdf.cone([0, 0.7, 0.3], [0, 0.56, 0.56], 0.1, 0.02), sdf.ellipsoid(0.12, 0.15, 0.12).move(0, 0.84, -0.2)).solid(0.012);
const H_LEGS = sdf.union(sdf.capsule([0.055, 0, 0.02], [0.05, 0.62, 0.02], 0.017), sdf.capsule([-0.055, 0, 0.02], [-0.05, 0.62, 0.02], 0.017), sdf.capsule([0.055, 0.01, 0.02], [0.06, 0.01, -0.13], 0.012), sdf.capsule([-0.055, 0.01, 0.02], [-0.06, 0.01, -0.13], 0.012)).solid(0.008);
const H_HEAD = sdf.smoothUnion(0.03, sdf.ellipsoid(0.055, 0.06, 0.085), sdf.ellipsoid(0.04, 0.035, 0.05).move(0, -0.03, -0.03)).solid(0.006);
const H_BILL = sdf.cone([0, -0.008, -0.06], [0, -0.014, -0.29], 0.024, 0.003).solid(0.004);
const H_CREST = sdf.union(sdf.capsule([0, 0.035, 0.02], [0, 0.0, 0.2], 0.012), sdf.capsule([0, 0.03, 0.03], [0, -0.02, 0.17], 0.009), sdf.sphere(0.013).move(0.046, 0.016, -0.03), sdf.sphere(0.013).move(-0.046, 0.016, -0.03)).solid(0.004);

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** XYZ Euler angles of the turn taking x, y, z onto X, Y, Z (as ivy.ts) */
function eulerOfBasis(X: V3, Y: V3, Z: V3): V3 {
  const ay = Math.asin(Math.max(-1, Math.min(1, Z[0])));
  if (Math.hypot(Z[1], Z[2]) < 1e-7) return [Math.atan2(Y[2], Y[1]), ay, 0];
  return [Math.atan2(-Z[1], Z[2]), ay, Math.atan2(-Y[0], X[0])];
}
const R = 0.034;   // the neck's radius at the shoulders; it narrows to 0.03 at the head
/** one run of the neck: the unit cylinder (radius R, 1 m long, along y) stretched from a to b */
function run(a: V3, b: V3, r: number) {
  const d = sub(b, a), len = Math.max(0.01, Math.hypot(...d)), Y = norm(d), side = Math.abs(Y[1]) < 0.95 ? [0, 1, 0] as V3 : [1, 0, 0] as V3;
  const X = norm(cross(Y, side)), Z = cross(X, Y);
  return { position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as V3, rotation: eulerOfBasis(X, Y, Z), scale: [r / R, len, r / R] as V3 };
}

/** where the heron's shoulders, the bend of its neck and its head are, for a moment `b` of the music video */
export function heronNeck(b: number, look: V3) {
  const h = heronPose(b, look), yw = h.yaw + Math.PI, cw = Math.cos(yw), sw = Math.sin(yw);
  const W = (x: number, y: number, z: number): V3 => [h.at[0] + x * cw + z * sw, h.at[1] + y + h.bob, h.at[2] - x * sw + z * cw];
  const base = W(0, 0.88, -0.24);   // where the neck leaves the body
  // the head: at rest held in an S over the shoulders; craning, thrust out at what it looks at
  const toL: V3 = [look[0] - base[0], look[1] - base[1], look[2] - base[2]], dl = Math.hypot(...toL) || 1, fw: V3 = [toL[0] / dl, toL[1] / dl, toL[2] / dl];
  const rest: V3 = W(0, 1.24, -0.32), out: V3 = [base[0] + fw[0] * 0.62, base[1] + 0.12 + fw[1] * 0.5, base[2] + fw[2] * 0.62];
  const head: V3 = [rest[0] + (out[0] - rest[0]) * h.crane, rest[1] + (out[1] - rest[1]) * h.crane, rest[2] + (out[2] - rest[2]) * h.crane];
  const mid: V3 = [base[0] + (head[0] - base[0]) * 0.5 - fw[0] * 0.07 * (1 - h.crane), base[1] + (head[1] - base[1]) * 0.55, base[2] + (head[2] - base[2]) * 0.5 - fw[2] * 0.07 * (1 - h.crane)];
  return { h, yw, base, mid, head };
}

export function TutHeron({ b, look }: { b: number; look: V3 }) {
  const { h, yw, base, mid, head } = heronNeck(b, look);
  const bodyQ = Quat.fromAxisAngle([0, 1, 0], yw), headT = Transform.fromXyz(...head).lookingAt(look, [0, 1, 0]);
  return (
    <>
      <Mesh3d name="heron-body" pass="hero" shape={H_BODY} allowOverlap transform={Transform.fromXyz(h.at[0], h.at[1] + h.bob, h.at[2]).withRotation(bodyQ)}><StandardMaterial base_color="#7d93b8" unlit /></Mesh3d>
      <Mesh3d name="heron-legs" pass="hero" shape={H_LEGS} allowOverlap transform={Transform.fromXyz(h.at[0], h.at[1], h.at[2]).withRotation(bodyQ)}><StandardMaterial base_color="#d8a24a" unlit /></Mesh3d>
      <Instances name="heron-neck" pass="hero" allowOverlap shadow={false} at={[run(base, mid, R), run(mid, head, 0.031)]}><Cylinder radius={R} half_height={0.5} /><StandardMaterial base_color="#dfe5f0" unlit /></Instances>
      <Instances name="heron-neck-joints" pass="hero" allowOverlap shadow={false} at={[{ position: base }, { position: mid, scale: 0.032 / R }]}><Sphere radius={R} /><StandardMaterial base_color="#dfe5f0" unlit /></Instances>
      <Mesh3d name="heron-head" pass="hero" shape={H_HEAD} allowOverlap transform={headT}><StandardMaterial base_color="#f4f6fb" unlit /></Mesh3d>
      <Mesh3d name="heron-bill" pass="hero" shape={H_BILL} allowOverlap transform={headT}><StandardMaterial base_color="#f2b33d" unlit /></Mesh3d>
      <Mesh3d name="heron-crest" pass="hero" shape={H_CREST} allowOverlap transform={headT}><StandardMaterial base_color="#26304a" unlit /></Mesh3d>
    </>
  );
}
