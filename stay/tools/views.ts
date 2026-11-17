// How smooth the film's lens and cursor are, and whether the take's joins hold, measured from the code before anything is
// rendered (the director, 11-11: "the camera movements for the cursor need to be much smoother like VERY smoothe right now its
// very jarring"; "for each transition ebtween doors it shoudl be seemless"). Every shot's lens and cursor are sampled at
// 240 Hz from the same functions the renders use (v3/worlds.tsx viewFor for the take's worlds, v3/places.tsx MAKES
// after it), and for each shot it prints:
//   - the lens: its peak turning speed (deg/s), turning acceleration (deg/s^2) and jerk (deg/s^3);
//   - the cursor on the frame: its peak speed (px/s), acceleration (px/s^2) and jerk (px/s^3), at the working size;
// and for each join of the take, how far the lens's aim, the cursor's place and its velocity jump across it.
// A step in a path shows as a jerk hundreds of times the smooth paths' (it scales with the sample rate); a smooth path's
// numbers don't move with it.
//   bun --preload ./tools/raea-stub.ts tools/views.ts [--json out.json] [ids...]
import { project } from "../v2/aim";
import type { V3 } from "../v2/math";
import type { Cam } from "../v3/cam";
import { follow, lastKeys, resetKeys } from "../v3/hand3d";
import { MAKES } from "../v3/places";
import { MONTAGE, SHOTS, TAKE_IDS, type Shot } from "../v3/plan";
import { viewFor } from "../v3/worlds";

const HZ = 240, h = 1 / HZ;
type Sample = { dir: V3; cur: [number, number] | null };
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
function view(s: Shot, t: number): { cam: Cam; pos: V3 | null } {
  if (TAKE_IDS.includes(s.id)) { const v = viewFor(s, t); return { cam: v.cam, pos: v.hand?.pos ?? null }; }
  resetKeys();
  const made = MAKES[s.id]?.(t, s.seconds);
  if (!made) throw new Error(`no view for ${s.id}`);
  const cam = lastKeys.length && !MONTAGE.some(([id]) => id === s.id) ? follow(made.cam, lastKeys, t) : made.cam;     // (as v3/places.tsx Place)
  return { cam, pos: made.hand?.pos ?? null };
}
function sample(s: Shot, t: number): Sample {
  const v = view(s, t), q = v.pos ? project(v.cam, v.pos) : null;
  return { dir: norm([v.cam.look[0] - v.cam.eye[0], v.cam.look[1] - v.cam.eye[1], v.cam.look[2] - v.cam.eye[2]]), cur: q && q.front ? [q.x, q.y] : null };
}
const yawPitch = (d: V3): [number, number] => [(Math.atan2(d[0], -d[2]) * 180) / Math.PI, (Math.asin(d[1]) * 180) / Math.PI];
/** peak |d^n x/dt^n| over a series of 2-vectors (null breaks it), n = 1..3, and the second of the peak jerk */
function peaks(xs: ([number, number] | null)[]): [number, number, number, number] {
  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let i = 0; i + 3 < xs.length; i++) {
    const w = xs.slice(i, i + 4);
    if (w.some((x) => !x)) continue;
    const [a, b, c, d] = w as [number, number][];
    for (const k of [0, 1]) {
      out[0] = Math.max(out[0], Math.abs(b[k] - a[k]) / h);
      out[1] = Math.max(out[1], Math.abs(c[k] - 2 * b[k] + a[k]) / h ** 2);
      const j = Math.abs(d[k] - 3 * c[k] + 3 * b[k] - a[k]) / h ** 3;
      if (j > out[2]) { out[2] = j; out[3] = (i + 1.5) * h; }
    }
  }
  return out;
}
const args = process.argv.slice(2), jsonAt = args.indexOf("--json"), json = jsonAt >= 0 ? args.splice(jsonAt, 2)[1] : null;
const want = args.length ? SHOTS.filter((s) => args.includes(s.id)) : SHOTS.filter((s) => !MONTAGE.some(([id]) => id === s.id) && (TAKE_IDS.includes(s.id) || MAKES[s.id]));
const rows: Record<string, unknown>[] = [];
const f = (x: number, d = 0) => x.toFixed(d).padStart(8);
console.log(`${"shot".padEnd(12)}${"lens d/s".padStart(8)}${"d/s2".padStart(8)}${"d/s3".padStart(8)}${"at s".padStart(7)}${"cur px/s".padStart(9)}${"px/s2".padStart(8)}${"px/s3".padStart(9)}${"at s".padStart(7)}`);
for (const s of want) {
  let ss: Sample[];
  try { ss = Array.from({ length: Math.floor(s.seconds * HZ) }, (_, i) => sample(s, i * h)); }
  catch (e) { console.log(`${s.id.padEnd(12)} (no view: ${(e as Error).message.slice(0, 90)})`); continue; }
  const lens = peaks(ss.map((x) => yawPitch(x.dir))), cur = peaks(ss.map((x) => x.cur));
  rows.push({ id: s.id, lens, cur });
  console.log(`${s.id.padEnd(12)}${f(lens[0], 1)}${f(lens[1], 0)}${f(lens[2], 0)}${lens[3].toFixed(2).padStart(7)}${f(cur[0], 0).padStart(9)}${f(cur[1], 0)}${f(cur[2], 0).padStart(9)}${cur[3].toFixed(2).padStart(7)}`);
}
// the take's joins: the last instant of one world against the first of the next, at the same second of the film
console.log(`\n${"join".padEnd(22)}${"aim deg".padStart(9)}${"cursor px".padStart(11)}${"dv px/s".padStart(9)}${"aim dv d/s".padStart(11)}`);
const joins: Record<string, unknown>[] = [];
for (let i = 0; i + 1 < TAKE_IDS.length; i++) {
  const A = SHOTS.find((x) => x.id === TAKE_IDS[i])!, B = SHOTS.find((x) => x.id === TAKE_IDS[i + 1])!, tA = B.from - A.from;
  let a0: Sample, a1: Sample, b0: Sample, b1: Sample;
  try { a0 = sample(A, tA - h); a1 = sample(A, tA); b0 = sample(B, 0); b1 = sample(B, h); }
  catch (e) { console.log(`${`${A.id} > ${B.id}`.padEnd(22)} (no view: ${(e as Error).message.slice(0, 70)})`); continue; }
  const aim = (Math.acos(Math.min(1, a1.dir[0] * b0.dir[0] + a1.dir[1] * b0.dir[1] + a1.dir[2] * b0.dir[2])) * 180) / Math.PI;
  const [ya0, ya1, yb0, yb1] = [a0, a1, b0, b1].map((x) => yawPitch(x.dir));
  const aimDv = Math.hypot((ya1[0] - ya0[0] - (yb1[0] - yb0[0])) / h, (ya1[1] - ya0[1] - (yb1[1] - yb0[1])) / h);
  const both = a1.cur && b0.cur, jump = both ? Math.hypot(a1.cur![0] - b0.cur![0], a1.cur![1] - b0.cur![1]) : NaN;
  const dv = both && a0.cur && b1.cur ? Math.hypot(a1.cur![0] - a0.cur![0] - (b1.cur![0] - b0.cur![0]), a1.cur![1] - a0.cur![1] - (b1.cur![1] - b0.cur![1])) / h : NaN;
  const seen = `${a1.cur ? "A" : "-"}${b0.cur ? "B" : "-"}`;
  joins.push({ a: A.id, b: B.id, aim, jump, dv, aimDv, seen });
  console.log(`${`${A.id} > ${B.id}`.padEnd(22)}${f(aim, 3).padStart(9)}${(Number.isNaN(jump) ? `  (${seen})` : f(jump, 1)).padStart(11)}${(Number.isNaN(dv) ? "" : f(dv, 0)).padStart(9)}${f(aimDv, 2).padStart(11)}`);
}
if (json) await Bun.write(json, JSON.stringify({ shots: rows, joins }, null, 1));
