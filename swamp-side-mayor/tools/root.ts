// tools/root.ts: where the film puts the goose each frame (plan.ts), for the clip's foot planting and body:
// [x, y, z, yaw (unwrapped, continuous), grounded, slide, lens x, y, z] a frame, the feet lifted on purpose, and the keys
// it lands on ([land, leave, trick] each, for the typing's poses). bun tools/root.ts
import { FPS, FRAMES, GS, KICK, LIFTS, BEAT, STRIKES, camera, root, unwrap } from "../compositions/plan";
import show from "../compositions/show.json";
let last = 0;
const frames = Array.from({ length: FRAMES }, (_, f) => { const r = root(f / FPS), yaw = unwrap(r.yaw, last); last = yaw;
  const e = camera(f / FPS).eye;   // the lens, so the goose can play to it
  return [r.p[0], r.p[1], r.p[2], yaw, r.grounded ? 1 : 0, r.slide ? 1 : 0, e[0], e[1], e[2]].map((v) => +v.toFixed(4)); });
const big = frames.slice(1).map((f, i) => Math.abs(f[3] - frames[i][3])).reduce((a, b) => Math.max(a, b), 0);
const strikes = STRIKES.map((s) => [s.land, +s.leave.toFixed(3), s.trick]);
await Bun.write("compositions/root.json", JSON.stringify({ gs: GS, beat: BEAT, g0: show.g0, lifts: LIFTS, kick: KICK, strikes, frames }));
console.log(frames.filter((f) => f[4]).length, "of", FRAMES, "frames on the ground;", frames.filter((f) => f[5]).length, "sliding; biggest turn in a frame", (big * 180 / Math.PI).toFixed(1), "deg");
