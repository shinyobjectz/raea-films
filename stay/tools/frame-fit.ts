// Whether each shot's cursor stays in the frame at the size in v3/size.json (made for the tall version, 1080x1920),
// measured from the film's own code like tools/views.ts: for every shot, the share of its frames the cursor is out of
// the frame or within 6% of an edge, where it goes out, and whether the cursor's own guard (a key "seen" outside the
// middle of the frame) refuses the shot.
//   bun --preload ./tools/raea-stub.ts tools/frame-fit.ts [ids...]
import { project } from "../v2/aim";
import { follow, lastKeys, resetKeys } from "../v3/hand3d";
import { MAKES } from "../v3/places";
import { H, MONTAGE, SHOTS, TAKE_IDS, W, type Shot } from "../v3/plan";
import { viewFor } from "../v3/worlds";

const HZ = 30;
function view(s: Shot, t: number) {
  if (TAKE_IDS.includes(s.id)) { const v = viewFor(s, t); return { cam: v.cam, pos: v.hand?.pos ?? null }; }
  resetKeys();
  const made = MAKES[s.id]?.(t, s.seconds);
  if (!made) return null;
  const cam = lastKeys.length && !MONTAGE.some(([id]) => id === s.id) ? follow(made.cam, lastKeys, t) : made.cam;
  return { cam, pos: made.hand?.pos ?? null };
}
const args = process.argv.slice(2);
console.log(`frame ${W}x${H}`);
for (const s of SHOTS.filter((x) => !args.length || args.includes(x.id))) {
  let n = 0, out = 0, edge = 0, err = "";
  const outs: string[] = [];
  for (let i = 0; i < Math.floor(s.seconds * HZ); i++) {
    const t = i / HZ;
    let v;
    try { v = view(s, t); } catch (e) { err = (e as Error).message.slice(0, 150); break; }
    if (!v) { err = "no view"; break; }
    if (!v.pos) continue;
    n++;
    const q = project(v.cam, v.pos);
    const o = !q.front || q.x < 0 || q.x > W || q.y < 0 || q.y > H;
    if (o) { out++; if (outs.length < Number(process.env.FIT_OUTS ?? 4)) outs.push(`${t.toFixed(1)}s(${q.x.toFixed(0)},${q.y.toFixed(0)})`); }
    else if (q.x < W * 0.06 || q.x > W * 0.94 || q.y < H * 0.06 || q.y > H * 0.94) edge++;
  }
  const pc = (k: number) => (n ? `${Math.round((100 * k) / n)}%` : "-");
  console.log(`${s.id.padEnd(12)} cursor frames ${String(n).padStart(4)}  out ${pc(out).padStart(4)}  edge ${pc(edge).padStart(4)}  ${outs.join(" ")}${err ? `  ERROR ${err}` : ""}`);
}
