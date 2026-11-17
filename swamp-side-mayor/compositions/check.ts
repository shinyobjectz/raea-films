// Walks every frame of the goose cut's plan and reports, shot by shot: the lens inside a ruin or under the water,
// a ruin or critter between the lens and the goose's head, the goose leaving the frame, a lens that jerks or whips,
// and the goose walking through a ruin. usage: bun compositions/check.ts [--all]
import { CUE, FPS, FRAMES, MON, SHOTS, beatAt, bodyAt, camera, root, sectionAt, upOf, type V3 } from "./plan";
import { RUINS, ruinY, CRITTERS } from "./layout";
import { WATER, ground, height, noise, pond } from "./set";
// each ruin as an upright cylinder: footprint radius and top (bounds from the glbs, times its scale)
const SIZE: Record<string, [number, number]> = { "stone-0": [0.45, 2.8], "stone-1": [0.42, 1.11], "stone-2": [0.55, 3.1], "stone-3": [0.38, 0.35], "stone-fallen": [1.3, 0.68], trilithon: [1.6, 3.84],
  statue: [1.6, 4.98], "column-0": [0.5, 4.86], "column-1": [0.5, 2.16], "column-2": [0.5, 0.95], drum: [0.55, 0.66], arch: [3.0, 4.8] };
const SOLIDS = RUINS.map((r, i) => ({ name: `ruin ${i} (${r.src})`, x: r.at[0], z: r.at[1], r: SIZE[r.src][0] * r.s, y0: ruinY(r), y1: ruinY(r) + (r.tilt && r.tilt[0] > 1 ? 1.0 : SIZE[r.src][1] * r.s) }))
  .concat(CRITTERS.map((c, i) => ({ name: `critter ${i} (${c.src})`, x: c.at[0], z: c.at[2], r: c.src === "deer" ? 0.6 : 0.2, y0: c.at[1], y1: c.at[1] + (c.src === "deer" ? 1.5 : 0.35) })));
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/** does the segment a->b pass through the cylinder (shrunk a little so grazing doesn't count)? */
function blocks(a: V3, b: V3, s: typeof SOLIDS[0]) {
  for (let k = 1; k < 40; k++) { const u = k / 40, p: V3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    if (Math.hypot(p[0] - s.x, p[2] - s.z) < s.r * 0.8 && p[1] > s.y0 && p[1] < s.y1 - 0.05) return true; }
  return false;
}
const found = new Map<string, { n: number; worst: number; at: number }>();
const say = (i: number, what: string, amount: number, t: number) => { const k = `${String(i + 1).padStart(2, "0")} ${SHOTS[i].name} | ${what}`, h = found.get(k);
  if (!h) found.set(k, { n: 1, worst: amount, at: t }); else { h.n++; if (amount > h.worst) { h.worst = amount; h.at = t; } } };
let prev: { i: number; eye: V3; dir: V3 } | null = null;
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, b = beatAt(t), c = camera(t), i = c.i, other = c.shot.subject === "other";   // v6: no trip; a shot of a critter or the screen isn't held to the goose's framing
  const r = root(t), head = bodyAt(t, "head", r), eye = c.eye;
  for (const s of SOLIDS) if (Math.hypot(eye[0] - s.x, eye[2] - s.z) < s.r + 0.15 && eye[1] < s.y1 + 0.1 && eye[1] > s.y0 - 0.2) say(i, `lens inside ${s.name}`, 1, t);
  if (!c.under && pond(eye[0], eye[2]) < 0 && eye[1] < WATER + 0.06) say(i, "lens under the water", WATER + 0.06 - eye[1], t);
  if (c.under && eye[1] > WATER - 0.05) say(i, "an underwater lens breaks the surface", eye[1] - WATER, t);
  // the computer's case, once it is up (v6: the swim home's lens sat inside it for 20 frames)
  { const b = beatAt(t), [cx, cy, cz] = MON.c, [w, h, d] = MON.size;
    if (b >= CUE.boil + CUE.up && Math.abs(eye[0] - cx) < w / 2 + 0.05 && Math.abs(eye[1] - cy) < h / 2 + 0.05 && Math.abs(eye[2] - cz) < d / 2 + 0.05) say(i, "lens inside the computer", 1, t); }
  if (!other) for (const s of SOLIDS) if (blocks(eye, head, s)) say(i, `${s.name} between lens and its head`, 1, t);
  { const p = pond(eye[0], eye[2]), reeds = p > -0.07 && p < 0.06 && noise(eye[0] * 0.35 + 4, eye[2] * 0.35) > 0.48 && Math.hypot(eye[0], eye[2]) > 6;
    if (reeds && !c.under && eye[1] < 1.4) say(i, "lens in the reeds", 1.4 - eye[1], t);
    if (ground(eye[0], eye[2]) === 0 && Math.hypot(eye[0], eye[2]) > 3 && eye[1] - height(eye[0], eye[2]) < 0.3) say(i, "lens down in the grass", 0.3 - (eye[1] - height(eye[0], eye[2])), t); }
  for (const s of SOLIDS.slice(0, RUINS.length)) { const d = Math.hypot(r.p[0] - s.x, r.p[2] - s.z) - s.r; if (d < 0.12 && r.p[1] < s.y1) say(i, `the goose walks into ${s.name}`, 0.12 - d, t); }
  const up: V3 = upOf(c), dir = norm(sub(c.at, eye)), right = norm(cross(dir, up)), u2 = cross(right, dir);
  const th = Math.tan((c.fov * Math.PI) / 360), ndc = (p: V3) => { const d = sub(p, eye), z = dot(d, dir); return z <= 0.05 ? null : [dot(d, right) / (z * th * 2), dot(d, u2) / (z * th)]; };
  const q = ndc(head), body = ndc(r.p);
  if (other) { prev = { i, eye, dir }; continue; }
  if (!q) say(i, "its head is behind the lens", 1, t); else if (Math.abs(q[0]) > 0.92 || Math.abs(q[1]) > 0.9) say(i, "its head leaves the frame", Math.max(Math.abs(q[0]), Math.abs(q[1])), t);
  if (q && body && Math.abs(body[0]) > 1.05 && Math.abs(q[0]) > 1.05) say(i, "the goose is out of the frame", Math.abs(body[0]), t);
  if (prev && prev.i === i) { const sp = Math.hypot(...sub(eye, prev.eye)) * FPS, turn = (Math.acos(Math.min(1, dot(dir, prev.dir))) * 180) / Math.PI;
    if (sp > 9) say(i, "lens jerks (m/s)", sp, t); if (turn > 6) say(i, "lens whips round (deg a frame)", turn, t); }
  prev = { i, eye, dir };
}
const rows = [...found.entries()].sort();
for (const [k, h] of rows) console.log(`${k}: ${h.n} frames, worst ${h.worst.toFixed(2)} at ${h.at.toFixed(2)} s`);
console.log(rows.length ? `${rows.length} findings` : "clean: no lens in a ruin or the water, nothing blocked, the goose in frame");
void sectionAt;
