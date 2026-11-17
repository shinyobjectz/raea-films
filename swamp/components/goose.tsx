// v5, the easter egg: a goose that died in the dead swamp, its skeleton half sunk in the bank's mud and grass behind
// the keyboard, the ground hiding what has sunk. The skull is a real scan: an Egyptian goose's, Musée national d'histoire
// naturelle Luxembourg, CC BY 4.0 (assets/models/goose/SOURCE.md). The rest is built here to a goose's measures:
// 17 neck vertebrae of about 2 cm, humerus 17 cm, ulna and radius 16, carpometacarpus 9, the outer finger 5,
// tarsometatarsus 9, toes 5 to 6.5. It lies as a carcass lies: on its side, the neck thrown out in an S up toward the
// bank's lip, the skull at its end on its side, the ribs of its upper side arching out of the mud, the upper wing
// flung out across it. Peat-stained bone.
//
// The carcass's own frame: x along the body (the head toward +x), y up, z across; the ground's face is y = 0.
import { staticFile } from "raea";
import { Entity, Model, sdf } from "raea/3d";
import { Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import type { V3 } from "./timeline";

/** where it lies: on the bank behind the keyboard's left half, where 02-key looks down on it across the keys (soft,
 *  behind the focus) through the whole shot, its body's middle at `at` (on the bank's top there, about 0.192 m: the
 *  bank's rule, ground.ts), scaled from the Egyptian goose the skull came from to a big goose's size (0.95 m bill to
 *  tail, a Canada goose's), the head (yaw: radians about y, 0 is +x) stretched out to the left across the open mud, clear of the keys' edge, tipped
 *  down its slope (tilt, radians). 1.2 m from the pit, clear of the ground that swells and blows (opening.tsx, 0.5 m) */
export const GOOSE = { at: [-0.1, 0.195, 2.55] as V3, yaw: 2.69, tilt: -0.03, scale: 1.25 };

// the scanned skull's own colour (its texture's mean, #765e3f), the long bones a shade lighter where they're weathered
const BONE = "#74614a";
const STEP = 0.0012;

/** a long bone from a to b: a shaft of radius r, a little narrower at b, its two ends knobbed */
const longBone = (a: V3, b: V3, r: number) =>
  sdf
    .smoothUnion(r * 0.7, sdf.cone(a, b, r, r * 0.85), sdf.ellipsoid(r * 1.7, r * 1.5, r * 1.7).move(...a), sdf.ellipsoid(r * 1.5, r * 1.35, r * 1.5).move(...b))
    .displace(r * 0.06, 220, 3, 7)
    .solid(Math.min(STEP, r / 2.2));

// ---- the neck: one vertebra (along x, its middle at the origin), set 17 times along an S
const VERTEBRA = sdf
  .smoothUnion(
    0.0018,
    sdf.capsule([-0.0075, 0, 0], [0.0075, 0, 0], 0.0042),
    sdf.ellipsoid(0.0035, 0.0028, 0.0095).move(0.0072, 0.0012, 0),
    sdf.ellipsoid(0.0035, 0.0028, 0.0085).move(-0.0072, 0.0014, 0),
    sdf.ellipsoid(0.008, 0.0022, 0.002).move(0, -0.0042, 0),
    sdf.ellipsoid(0.005, 0.003, 0.0016).move(0, 0.0048, 0),
  )
  .displace(0.00025, 260, 3, 3)
  .solid(0.0008);
const bez = (p: V3[], t: number): V3 => {
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1, 2].map((k) => p.reduce((s, q, i) => s + q[k] * w[i], 0)) as V3;
};
const NECK_CURVE: V3[] = [[0.09, 0.004, -0.07], [0.2, 0.0, -0.2], [0.24, 0.006, 0.04], [0.36, 0.01, -0.02]];
const NECK = (() => {
  // even spacing along the curve: sample it finely, then step 2 cm at a time
  const pts = Array.from({ length: 400 }, (_, i) => bez(NECK_CURVE, i / 399));
  const out: { p: V3; yaw: number; roll: number }[] = [];
  let acc = 0, last = pts[0];
  for (let i = 1; i < pts.length && out.length < 17; i++) {
    acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]);
    if (acc >= 0.0195) {
      const p = pts[i], d = [p[0] - last[0], p[2] - last[2]];
      out.push({ p: [(p[0] + last[0]) / 2, (p[1] + last[1]) / 2, (p[2] + last[2]) / 2], yaw: Math.atan2(-d[1], d[0]), roll: 0.35 * Math.sin(out.length * 1.7) });
      last = p;
      acc = 0;
    }
  }
  return out;
})();
const HEAD = NECK[NECK.length - 1];

// ---- the trunk: the ribs of its upper side arching out of the water, the spine and the pelvis along its back
const h = (i: number, k: number) => {
  const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
// seven ribs of the upper side, as the carcass left them: two gone, some snapped short, each a little out of line. A
// bird's rib bends at a joint: the vertebral rib climbs from the spine and turns, the sternal rib runs on down and
// forward to the breastbone; each vertebral rib carries an uncinate process, a short spur reaching back over the next
const RIBS = [0, 1, 3, 4, 6].map((i) => {
  const x = 0.065 - i * 0.026 + 0.008 * (h(i, 1) - 0.5), R = 0.07 + 0.012 * Math.sin((i / 6) * Math.PI);
  const end = 0.55 + 0.45 * h(i, 2), lean = 0.12 * (h(i, 3) - 0.5), sag = 0.012 * h(i, 4);
  const at = (u: number): V3 => {
    // the vertebral rib (u to 0.62) arcs up from the spine; the sternal rib (after) runs straighter, down and forward
    const th = (0.12 + 0.76 * Math.min(u, 0.62)) * Math.PI;
    const p: V3 = [x - 0.035 * Math.min(u, 0.62) + lean * R * Math.sin(th), -0.035 + R * Math.sin(th) - sag * u, -0.005 - R * Math.cos(th)];
    if (u <= 0.62) return p;
    const k = (u - 0.62) / 0.38;
    return [p[0] + 0.03 * k, p[1] - 0.06 * k, p[2] + 0.055 * k];
  };
  const pts: [number, number, number, number][] = [];
  for (let k = 0; k <= 10; k++) {
    const u = (k / 10) * end;
    pts.push([...at(u), (u <= 0.62 ? 0.0026 - 0.0006 * u : 0.0018) * (k === 10 ? 0.8 : 1)]);
  }
  const mid = at(0.42), spur: V3 = [mid[0] - 0.026, mid[1] + 0.004, mid[2] - 0.006];
  return sdf
    .smoothUnion(0.0015, sdf.tube(pts), sdf.cone(mid, spur, 0.0016, 0.0007))
    .displace(0.00022, 300, 3, i + 11)
    .solid(0.0009);
});
const SPINE = sdf
  .smoothUnion(0.004, sdf.tube([[0.095, -0.004, -0.072, 0.008], [-0.02, -0.002, -0.078, 0.009], [-0.12, -0.006, -0.07, 0.008]]), ...Array.from({ length: 6 }, (_, i) => sdf.ellipsoid(0.006, 0.006, 0.003).move(0.08 - i * 0.034, 0.006, -0.08)))
  .displace(0.0004, 200, 3, 5)
  .solid(STEP);
const PELVIS = sdf
  .smoothUnion(
    0.003,
    sdf.tube([[-0.11, -0.006, -0.05, 0.0055], [-0.16, -0.004, -0.05, 0.006], [-0.21, -0.008, -0.048, 0.004]]),
    sdf.ellipsoid(0.042, 0.003, 0.0105).rotate(0, 8, 0).move(-0.16, -0.009, -0.066),
    sdf.ellipsoid(0.04, 0.003, 0.0095).rotate(0, -8, 0).move(-0.16, -0.012, -0.034),
  )
  .displace(0.0011, 150, 3, 9)
  .solid(0.0012);

// ---- the upper wing flung out over the water, and a foot's toes curled up out of it
const SHOULDER: V3 = [0.07, 0.022, -0.035], ELBOW: V3 = [0.02, 0.008, 0.13], WRIST: V3 = [-0.13, 0.004, 0.19];
const HAND: V3 = [-0.215, 0.003, 0.215], TIP: V3 = [-0.265, 0.002, 0.23];
const WING = [
  longBone(SHOULDER, ELBOW, 0.0055), // humerus
  longBone([ELBOW[0], ELBOW[1] + 0.001, ELBOW[2] - 0.004], [WRIST[0], WRIST[1] + 0.001, WRIST[2] - 0.004], 0.0042), // ulna
  longBone([ELBOW[0] - 0.006, ELBOW[1] + 0.002, ELBOW[2] + 0.007], [WRIST[0] + 0.004, WRIST[1] + 0.002, WRIST[2] + 0.006], 0.0026), // radius
  longBone(WRIST, HAND, 0.0034), // carpometacarpus
  longBone(HAND, TIP, 0.0022), // the outer finger
];
const ANKLE: V3 = [-0.17, -0.02, 0.05], FOOT: V3 = [-0.215, 0.024, 0.09];
const toe = (dir: number, len: number): [number, number, number, number][] => {
  // three phalanges curling over as they go
  const pts: [number, number, number, number][] = [[...FOOT, 0.0032]];
  let p = FOOT, a = 0.4;
  for (let k = 0; k < 4; k++) {
    a += 0.45;
    const s = len / 4;
    p = [p[0] - s * Math.cos(a) * Math.cos(dir), p[1] + s * Math.sin(a) * 0.5 - 0.004 * k, p[2] + s * Math.sin(dir) * Math.cos(a) * 0.8];
    pts.push([p[0], p[1], p[2], 0.0026 - 0.0004 * k]);
  }
  return pts;
};
const LEG = [
  longBone(ANKLE, FOOT, 0.0045), // tarsometatarsus
  sdf.smoothUnion(0.002, sdf.tube(toe(-0.55, 0.055)), sdf.tube(toe(0, 0.065)), sdf.tube(toe(0.55, 0.06))).displace(0.0002, 300, 3, 4).solid(0.0009),
];

const SKULL = staticFile("models/goose/goose_skull.glb");
const quat = (x: number, y: number, z: number) => Quat.fromEuler("XYZ", x, y, z);
const bone = <StandardMaterial base_color={BONE} perceptual_roughness={0.55} reflectance={0.4} />;

export function GooseBones() {
  // (the foot, LEG, is left out: poking up out of the mud it read as a stray stick)
  const parts = [...RIBS, SPINE, PELVIS, ...WING];
  return (
    <Entity transform={Transform.fromXyz(...GOOSE.at).withRotation(quat(0, GOOSE.yaw, GOOSE.tilt)).withScale([GOOSE.scale, GOOSE.scale, GOOSE.scale])}>
      {parts.map((shape, i) => (
        <Mesh3d key={i} name={`goose-${i}`} allowOverlap shape={shape}>
          {bone}
        </Mesh3d>
      ))}
      {NECK.map((v, i) => (
        <Mesh3d key={`n${i}`} name={`goose-neck-${i}`} allowOverlap shape={VERTEBRA} transform={Transform.fromXyz(...v.p).withRotation(quat(v.roll, v.yaw, 0))}>
          {bone}
        </Mesh3d>
      ))}
      {/* the scanned skull: its bill along its +y, its left and right along x (turned up here: it lies on its side) */}
      <Entity transform={Transform.fromXyz(HEAD.p[0] + 0.045 * Math.cos(HEAD.yaw), 0.016, HEAD.p[2] - 0.045 * Math.sin(HEAD.yaw)).withRotation(quat(0, HEAD.yaw + 0.25, 0))}>
        <Model name="goose-skull" src={SKULL} rotation={[0.25, 0, -Math.PI / 2]} />
      </Entity>
    </Entity>
  );
}
