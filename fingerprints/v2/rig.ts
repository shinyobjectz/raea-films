// The hand's rig, in the film's own code. blender/rig.py placed the bones and bound the skin (media/hand/glb/
// hand.rig.json); this poses them and skins the mesh a frame at a time (linear blend, four bones a vertex), so every
// movement is a pure function of the frame. Units: the scan's metres x 10, y up, z from elbow to fingertips, the back
// of the hand toward +y, the thumb on +x.
//
// A pose is plain numbers (radians, and the root's place), so two poses mix by mixing their numbers:
//   root   the whole arm, turned about the wrist (roll about the forearm's own length first, then rx, ry, rz about
//          x, y, z) and moved (px, py, pz)
//   wrist  flex (+ bends the palm down), dev (+ toward the thumb), twist (+ turns the palm toward the thumb's side)
//   each finger  mcp, pip, dip (+ curls toward the palm), spread (+ away from the middle finger)
//   thumb  cmcFlex (+ across the palm), cmcSpread (+ away from the palm's plane), cmcTwist (+ turns the pad to face
//          the fingers), mcp, ip (+ curls)
import rig from "../media/hand/glb/hand.rig.json";

export type V3 = [number, number, number];
type Bone = { name: string; parent: number; joint: V3; end: V3 };
const R = rig as unknown as { bones: Bone[]; positions: number[]; normals: number[]; uvs: number[]; indices: number[]; bone: number[]; weight: number[] };
export const MESH = { uvs: R.uvs, indices: R.indices, count: R.positions.length / 3 };
export const BONES = R.bones;
const ID: Record<string, number> = Object.fromEntries(BONES.map((b, i) => [b.name, i]));
export const WRIST: V3 = BONES[ID.hand].joint;

export const FINGERS = ["index", "middle", "ring", "little"] as const;
export type Finger = (typeof FINGERS)[number];
export type Pose = Record<string, number>;
const KEYS = [
  "px", "py", "pz", "rx", "ry", "rz", "roll", "wristFlex", "wristDev", "wristTwist",
  ...FINGERS.flatMap((f) => [`${f}Mcp`, `${f}Pip`, `${f}Dip`, `${f}Spread`]),
  "thumbFlex", "thumbSpread", "thumbTwist", "thumbMcp", "thumbIp",
];
export const REST: Pose = Object.fromEntries(KEYS.map((k) => [k, 0]));
export const pose = (p: Partial<Pose>): Pose => ({ ...REST, ...(p as Pose) });
/** a mixed with b by k (0 a, 1 b) */
export function mix(a: Pose, b: Pose, k: number): Pose {
  const o: Pose = {};
  for (const key of KEYS) o[key] = a[key] + (b[key] - a[key]) * k;
  return o;
}
/** a with every number of b added, scaled */
export function add(a: Pose, b: Partial<Pose>, k = 1): Pose {
  const o = { ...a };
  for (const [key, v] of Object.entries(b)) o[key] = (o[key] ?? 0) + (v as number) * k;
  return o;
}

// ── small linear algebra: a 3x3 as 9 numbers (rows), an affine as 12 (the 3x3, then the move) ──────────────────
type M3 = number[];
type Aff = number[];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const IDENT: M3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
function axisAngle(a: V3, t: number): M3 {
  if (!t) return IDENT;
  const [x, y, z] = a, c = Math.cos(t), s = Math.sin(t), k = 1 - c;
  return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k];
}
const mul3 = (a: M3, b: M3): M3 => [
  a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
];
const rot = (m: M3 | Aff, v: V3): V3 => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
export const apply = (m: Aff, v: V3): V3 => { const r = rot(m, v); return [r[0] + m[9], r[1] + m[10], r[2] + m[11]]; };
/** the affine that turns by r about the point c, then moves by t */
function about(r: M3, c: V3, t: V3 = [0, 0, 0]): Aff {
  const rc = rot(r, c);
  return [...r, c[0] - rc[0] + t[0], c[1] - rc[1] + t[1], c[2] - rc[2] + t[2]];
}
/** a then b: b(a(v)) */
function then(a: Aff, b: Aff): Aff {
  const r = mul3(b, a);
  const t = apply(b, [a[9], a[10], a[11]]);
  return [...r, t[0], t[1], t[2]];
}

// ── each joint's axes, from the rest skeleton ──────────────────────────────────────────────────────────────────
const UP: V3 = [0, 1, 0]; // out of the back of the hand
const dirOf = (name: string): V3 => norm(sub(BONES[ID[name]].end, BONES[ID[name]].joint));
const AX: Record<string, { flex: V3; spread: V3; dir: V3 }> = {};
for (const f of FINGERS) {
  for (const n of [1, 2, 3]) {
    const d = dirOf(`${f}${n}`);
    const flex = norm(cross(UP, d)); // turning about it by + brings the tip toward the palm
    AX[`${f}${n}`] = { flex, spread: norm(cross(d, flex)), dir: d };
  }
}
// the thumb's nail faces out and up, so its joints bend about another axis than the fingers'
const THUMB_NAIL: V3 = norm([0.9, 0.38, -0.15]);
for (const n of [1, 2, 3]) {
  const d = dirOf(`thumb${n}`);
  const flex = norm(cross(THUMB_NAIL, d));
  AX[`thumb${n}`] = { flex, spread: norm(cross(d, flex)), dir: d };
}
const FOREARM = dirOf("forearm");
const SPREAD_SIGN: Record<Finger, number> = { index: -1, middle: 0.0001, ring: 1, little: 1 };

/** every bone's place in a pose: the affine that takes a rest point carried by that bone to where it is */
export function solve(p: Pose): Aff[] {
  const out: Aff[] = new Array(BONES.length);
  // the root: the whole arm about the wrist
  const rr = mul3(mul3(axisAngle([0, 0, 1], p.rz), mul3(axisAngle([0, 1, 0], p.ry), axisAngle([1, 0, 0], p.rx))), axisAngle(FOREARM, p.roll));
  out[ID.forearm] = about(rr, WRIST, [p.px, p.py, p.pz]);
  const local = (name: string): M3 => {
    if (name === "hand") return mul3(axisAngle(FOREARM, p.wristTwist), mul3(axisAngle([0, 1, 0], -p.wristDev), axisAngle([1, 0, 0], p.wristFlex)));
    if (name === "thumb1") return mul3(axisAngle(AX.thumb1.dir, p.thumbTwist), mul3(axisAngle(AX.thumb1.spread, p.thumbSpread), axisAngle(AX.thumb1.flex, p.thumbFlex)));
    if (name === "thumb2") return axisAngle(AX.thumb2.flex, p.thumbMcp);
    if (name === "thumb3") return axisAngle(AX.thumb3.flex, p.thumbIp);
    const f = FINGERS.find((x) => name.startsWith(x));
    if (!f) return IDENT;
    const n = name[name.length - 1];
    if (n === "0") return IDENT;
    const ax = AX[name];
    if (n === "1") return mul3(axisAngle(ax.spread, p[`${f}Spread`] * SPREAD_SIGN[f]), axisAngle(ax.flex, p[`${f}Mcp`]));
    return axisAngle(ax.flex, p[n === "2" ? `${f}Pip` : `${f}Dip`]);
  };
  for (let i = 0; i < BONES.length; i++) {
    const b = BONES[i];
    if (b.parent < 0) continue;
    // a rest point is first turned about this bone's joint, then carried by the parent
    out[i] = then(about(local(b.name), b.joint), out[b.parent]);
  }
  return out;
}

const REST_SOLVED = solve(REST);
void REST_SOLVED;

/** the mesh in a pose: positions and normals */
export function skin(p: Pose): { positions: number[]; normals: number[] } {
  const m = solve(p);
  const n = MESH.count;
  const P = new Array<number>(n * 3);
  const N = new Array<number>(n * 3);
  const rp = R.positions, rn = R.normals, rb = R.bone, rw = R.weight;
  for (let v = 0; v < n; v++) {
    const x = rp[v * 3], y = rp[v * 3 + 1], z = rp[v * 3 + 2];
    const nx = rn[v * 3], ny = rn[v * 3 + 1], nz = rn[v * 3 + 2];
    let ox = 0, oy = 0, oz = 0, ax = 0, ay = 0, az = 0;
    for (let k = 0; k < 4; k++) {
      const w = rw[v * 4 + k];
      if (w === 0) continue;
      const a = m[rb[v * 4 + k]];
      ox += w * (a[0] * x + a[1] * y + a[2] * z + a[9]);
      oy += w * (a[3] * x + a[4] * y + a[5] * z + a[10]);
      oz += w * (a[6] * x + a[7] * y + a[8] * z + a[11]);
      ax += w * (a[0] * nx + a[1] * ny + a[2] * nz);
      ay += w * (a[3] * nx + a[4] * ny + a[5] * nz);
      az += w * (a[6] * nx + a[7] * ny + a[8] * nz);
    }
    const l = Math.hypot(ax, ay, az) || 1;
    P[v * 3] = ox; P[v * 3 + 1] = oy; P[v * 3 + 2] = oz;
    N[v * 3] = ax / l; N[v * 3 + 1] = ay / l; N[v * 3 + 2] = az / l;
  }
  return { positions: P, normals: N };
}

/** where a rest point carried by a bone is in a pose (a label's anchor, a held tool's tip) */
export function carried(bone: string, rest: V3, p: Pose): V3 {
  return apply(solve(p)[ID[bone]], rest);
}
/** a bone's affine in a pose, as [3x3 rows..., tx, ty, tz] */
export function boneAt(bone: string, p: Pose): number[] {
  return solve(p)[ID[bone]];
}
/** the root move that puts a rest point carried by `bone` at `target`, the pose's turns kept: returns the pose moved */
export function reach(p: Pose, bone: string, rest: V3, target: V3): Pose {
  const q = { ...p, px: 0, py: 0, pz: 0 };
  const now = carried(bone, rest, q);
  return { ...q, px: target[0] - now[0], py: target[1] - now[1], pz: target[2] - now[2] };
}

/** the lowest point of the skin in a pose (y), from every fourth vertex: what a table has to be under */
export function lowest(p: Pose): number {
  const m = solve(p);
  const rp = R.positions, rb = R.bone, rw = R.weight;
  let low = Infinity;
  for (let v = 0; v < MESH.count; v += 4) {
    const x = rp[v * 3], y = rp[v * 3 + 1], z = rp[v * 3 + 2];
    let oy = 0;
    for (let k = 0; k < 4; k++) {
      const w = rw[v * 4 + k];
      if (w === 0) continue;
      const a = m[rb[v * 4 + k]];
      oy += w * (a[3] * x + a[4] * y + a[5] * z + a[10]);
    }
    if (oy < low) low = oy;
  }
  return low;
}
/** the pose lowered or raised so its lowest skin rests `gap` above a surface at y = `floor` */
export function rested(p: Pose, floor = 0, gap = 0.004): Pose {
  return { ...p, py: p.py + floor + gap - lowest(p) };
}
/** the pose with its wrist at a point (the root turns about the wrist, so this is just its move) */
export function wristAt(p: Pose, at: V3): Pose {
  return { ...p, px: at[0] - WRIST[0], py: at[1] - WRIST[1], pz: at[2] - WRIST[2] };
}

// the other hand: the same mesh seen in a mirror (x to -x), its triangles wound the other way
const MIRRORED: number[] = [];
for (let i = 0; i < R.indices.length; i += 3) MIRRORED.push(R.indices[i], R.indices[i + 2], R.indices[i + 1]);
export const MESH_LEFT = { uvs: R.uvs, indices: MIRRORED };
/** the left hand in a pose: the pose is the right hand's, in a mirror at x = 0 */
export function skinLeft(p: Pose): { positions: number[]; normals: number[] } {
  const s = skin(p);
  for (let i = 0; i < s.positions.length; i += 3) { s.positions[i] = -s.positions[i]; s.normals[i] = -s.normals[i]; }
  return s;
}
