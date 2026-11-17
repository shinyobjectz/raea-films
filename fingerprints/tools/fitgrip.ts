// Fits a grip on a stick (a pencil, a brush, a baton) against the hand's real skin: the fingers' angles and the
// stick's line are moved until the thumb's pad, the index's pad and the middle finger's side each touch the stick
// and no skin is inside it. Prints the pose, the stick (two points carried by the hand bone, in rest space) and the
// deepest the skin goes into the stick, so "no clipping" is a number. Usage: bun tools/fitgrip.ts [radius]
import rig from "../media/hand/glb/hand.rig.json";
import { BONES, type Pose, type V3, apply, pose, solve } from "../v2/rig";

const R = rig as unknown as { positions: number[]; bone: number[]; weight: number[] };
const radius = Number(process.argv[2] ?? 0.0375);
const id = (n: string) => BONES.findIndex((b) => b.name === n);
// every third vertex forward of the wrist, with its heaviest bone
const VERTS: { v: number; top: number }[] = [];
for (let v = 0; v < R.positions.length / 3; v += 3) {
  if (R.positions[v * 3 + 2] < -1.2) continue;
  let top = 0;
  for (let k = 1; k < 4; k++) if (R.weight[v * 4 + k] > R.weight[v * 4 + top]) top = k;
  VERTS.push({ v, top: R.bone[v * 4 + top] });
}
const PADS = { index: id("index3"), thumb: id("thumb3"), middle: id("middle3") };

function skinned(m: number[][]): Float64Array {
  const out = new Float64Array(VERTS.length * 3);
  VERTS.forEach(({ v }, i) => {
    const x = R.positions[v * 3], y = R.positions[v * 3 + 1], z = R.positions[v * 3 + 2];
    let ox = 0, oy = 0, oz = 0;
    for (let k = 0; k < 4; k++) {
      const w = R.weight[v * 4 + k];
      if (!w) continue;
      const a = m[R.bone[v * 4 + k]];
      ox += w * (a[0] * x + a[1] * y + a[2] * z + a[9]);
      oy += w * (a[3] * x + a[4] * y + a[5] * z + a[10]);
      oz += w * (a[6] * x + a[7] * y + a[8] * z + a[11]);
    }
    out[i * 3] = ox; out[i * 3 + 1] = oy; out[i * 3 + 2] = oz;
  });
  return out;
}

type Fit = { p: Pose; a: V3; b: V3 }; // the stick runs from a (its working end's side) to b, in world with the root at rest
const FREE = ["thumbFlex", "thumbSpread", "thumbTwist", "thumbMcp", "thumbIp", "indexMcp", "indexPip", "indexDip", "middleMcp", "middlePip", "middleDip", "indexSpread"];
const LIMIT: Record<string, [number, number]> = { thumbFlex: [-0.2, 0.9], thumbSpread: [-0.7, 0.9], thumbTwist: [-0.3, 1.0], thumbMcp: [-0.1, 0.8], thumbIp: [-0.2, 0.9], indexMcp: [0.2, 1.1], indexPip: [0.3, 1.3], indexDip: [0.05, 0.7], middleMcp: [0.5, 1.0], middlePip: [0.85, 1.4], middleDip: [0.3, 0.8], indexSpread: [-0.15, 0.25] };

function measure(f: Fit) {
  const P = skinned(solve(f.p));
  const ab: V3 = [f.b[0] - f.a[0], f.b[1] - f.a[1], f.b[2] - f.a[2]];
  const L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2;
  let deep = 0, pen = 0;
  const near: Record<string, number> = { index: 9, thumb: 9, middle: 9 };
  for (let i = 0; i < VERTS.length; i++) {
    const x = P[i * 3] - f.a[0], y = P[i * 3 + 1] - f.a[1], z = P[i * 3 + 2] - f.a[2];
    const t = Math.min(1, Math.max(0, (x * ab[0] + y * ab[1] + z * ab[2]) / L2));
    const d = Math.hypot(x - ab[0] * t, y - ab[1] * t, z - ab[2] * t);
    if (d < radius) { pen += (radius - d) ** 2; deep = Math.max(deep, radius - d); }
    const top = VERTS[i].top;
    if (top === PADS.index) near.index = Math.min(near.index, d);
    else if (top === PADS.thumb) near.thumb = Math.min(near.thumb, d);
    else if (top === PADS.middle) near.middle = Math.min(near.middle, d);
  }
  return { deep, pen, near };
}
function cost(f: Fit, start: Pose) {
  const m = measure(f);
  let c = m.pen * 4000;
  for (const k of ["index", "thumb", "middle"]) c += (m.near[k] - radius - 0.002) ** 2 * 300;
  for (const k of FREE) { c += (f.p[k] - start[k]) ** 2 * 0.01; const [lo, hi] = LIMIT[k]; c += Math.max(0, lo - f.p[k], f.p[k] - hi) ** 2 * 60; }
  return c;
}

const start = pose({ indexMcp: 0.619, indexPip: 0.979, indexDip: 0.3, middleMcp: 0.85, middlePip: 0.95, middleDip: 0.4, ringMcp: 1, ringPip: 1.15, ringDip: 0.5, littleMcp: 1.05, littlePip: 1.15, littleDip: 0.5, thumbFlex: 0.58, thumbSpread: -0.12, thumbTwist: 0.095, thumbMcp: 0.225, thumbIp: -0.03 });
const m0 = solve(start);
const ip = apply(m0[PADS.index], [0.262, 0.02, 1.1]), tp = apply(m0[PADS.thumb], [0.78, -0.27, 0.4]), web = apply(m0[id("index1")], [0.36, 0.12, 0.25]);
const mid: V3 = [(ip[0] + tp[0]) / 2, (ip[1] + tp[1]) / 2, (ip[2] + tp[2]) / 2];
const u: V3 = [web[0] - mid[0], web[1] - mid[1], web[2] - mid[2]];
const ul = Math.hypot(...u);
let fit: Fit = { p: start, a: [mid[0] - (u[0] / ul) * 0.3, mid[1] - (u[1] / ul) * 0.3, mid[2] - (u[2] / ul) * 0.3], b: [mid[0] + (u[0] / ul) * 1.45, mid[1] + (u[1] / ul) * 1.45, mid[2] + (u[2] / ul) * 1.45] };
console.log("start", measure(fit));
let step = 0.08;
let best = cost(fit, start);
for (let it = 0; it < 220 && step > 5e-4; it++) {
  let moved = false;
  const tryFit = (g: Fit) => { const c = cost(g, start); if (c < best - 1e-9) { best = c; fit = g; moved = true; } };
  for (const k of FREE) for (const s of [step, -step]) tryFit({ ...fit, p: { ...fit.p, [k]: fit.p[k] + s } });
  for (const end of ["a", "b"] as const) for (let ax = 0; ax < 3; ax++) for (const s of [step * 0.5, -step * 0.5]) { const q = [...fit[end]] as V3; q[ax] += s; tryFit({ ...fit, [end]: q }); }
  if (!moved) step /= 2;
}
const m = measure(fit);
console.log("fit  ", { deepest_mm: +(m.deep * 100).toFixed(2), index_gap_mm: +((m.near.index - radius) * 100).toFixed(2), thumb_gap_mm: +((m.near.thumb - radius) * 100).toFixed(2), middle_gap_mm: +((m.near.middle - radius) * 100).toFixed(2) });
console.log("pose", JSON.stringify(Object.fromEntries(Object.entries(fit.p).filter(([, v]) => v !== 0).map(([k, v]) => [k, +v.toFixed(3)]))));
// the stick in the hand bone's rest space (the root at rest, the wrist straight: the hand bone hasn't moved)
console.log("stick", JSON.stringify({ a: fit.a.map((x) => +x.toFixed(4)), b: fit.b.map((x) => +x.toFixed(4)) }));
