// The canyon's tumbleweed, taken and thrown (the director, 11-11: "for the canyon can we have it so the cursor grabs the
// tumble weed and tossesit down the canyon with physics as it bounces around and into the wind. so it shoudl use disney
// principles of animation to toss it up"; and on assembly 23: "can the cursor throw it liek up and to the right before
// the drop and when it hits the wall it drops and the art comes in from whwhere it makes sontact so ti should throw it
// diagnally and use the hand cursor for this too").
// The cursor takes it off the sand by its top and carries it up the slot, weighing it in the hand on the song's tick.
// Before the drop it draws it back, down and to the left (the anticipation, against the throw: the weed squashes,
// loaded), then throws it up and to the right (it stretches along the throw) and lets go: a lob that tops out and is
// coming down as it meets the slot's right wall, on the drop. It goes flat against the rock (squashed along the
// wall's normal, springing back past round), and the real canyon and its paintings go out over the rock from where it
// struck (v3/places.tsx). Then it drops: gravity, the gust's drag pulling it down the slot (a tumbleweed is nearly all
// air, so the wind has it at once), its bounces off the big boulder's flank and the sand (each landing squashes it and
// it springs back past round, the bounce throwing it on), and the irregular bounds a rolling tumbleweed makes. Every
// point is in the canyon's own unturned frame (sets/canyon.tsx spot turns it into the world), `y` the weed's foot above
// the sand.
type V3 = [number, number, number];
/** the weed's radius (its roll turns about its middle, 0.28 m up) */
export const R = 0.29;
const SAND = 0.08;                                                           // (sets/canyon.tsx S: the sand's level in the set)
const sstep = (a: number, b: number, x: number) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const mix = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const hash = (i: number) => { const x = Math.sin(i * 78.233 + 12.9898) * 43758.5453; return x - Math.floor(x); };
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** where it lies, where it is lifted to, where it is carried, and how far it is drawn back (down and left, against the throw) */
// (carried well on down the slot, so the lens, which follows at a metre a second, is still nearly two metres off it as it
// is drawn back: held nearer, the wind-up filled the frame; and held out in the slot, a third of a metre and more off its
// left wall, which stands at x -0.15 here: drawn back to x -0.12 it went into the rock, and its box showed the rock real)
const LIE: V3 = [0.1, 0, 3.4], LIFT: V3 = [0.2, 0.45, 3.1], HOLD: V3 = [0.5, 0.85, 1.2], BACK: V3 = [0.25, 0.5, 1.7];
const WIND = 0.5, THROW = 0.17;                                              // the draw back, and the throw itself, in seconds
/** where it strikes the slot's right wall, on the rock's face (media/models/canyon/walls-in.glb at z -3, 2.4 m up: in the
 *  drop's frame, 84% across and 37% down), and the face's inward normal there (it leans a little over the slot) */
export const WALL_HIT: V3 = [2.948, 2.4, -3.0];
const WALL_N: V3 = [-0.941, -0.223, 0.253];
/** the weed's foot as it meets the wall: its middle a radius off the face */
const AT_WALL: V3 = [WALL_HIT[0] + WALL_N[0] * R, WALL_HIT[1] + WALL_N[1] * R - R - SAND, WALL_HIT[2] + WALL_N[2] * R];
const G: V3 = [0, -9.8, 0];
/** the throw, for a flight of `fly` seconds from the hand to the wall: the speed it leaves the hand at (the throw's
 *  curve ends at it), and where it leaves the hand. Before the wall it is a lob: no drag, the gust not come yet. */
function throwOf(fly: number) {
  // (it leaves the hand 0.55 of the throw's time on from BACK at V0: AT_WALL = BACK + V0 (k + fly) + G fly^2 / 2)
  const k = 0.55 * THROW, v0 = [0, 1, 2].map((j) => (AT_WALL[j] - BACK[j] - 0.5 * G[j] * fly * fly) / (fly + k)) as V3;
  const release = [0, 1, 2].map((j) => BACK[j] + v0[j] * k) as V3;
  return { v0, release };
}

/** the ground under (x, z), above the sand: the sand, the low boulder in the slot's middle and the big one by the right
 *  wall as the domes they are (boulder-b, 1.0 m across, 1.65 m along the slot, 0.52 m high, at x 0.15, z -0.7; boulder,
 *  2.5 m across, 2.7 m along, 0.91 m high, at x 2.0, z -4.6), and the driftwood */
function ground(x: number, z: number): number {
  const u = (x - 0.15) / 0.52, v = (z + 0.7) / 0.84, q = 1 - u * u - v * v;
  const u2 = (x - 2.0) / 1.24, v2 = (z + 4.6) / 1.36, q2 = 1 - u2 * u2 - v2 * v2;
  // the driftwood: a log 3.5 m long lying across the slot, from (1.78, -1.98) on the right to (0.32, -5.22) on the left
  const ax = 1.78, az = -1.98, bx = 0.32, bz = -5.22, k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
  const d = Math.hypot(x - (ax + (bx - ax) * k), z - (az + (bz - az) * k)) / 0.32;
  return Math.max(q > 0 ? 0.52 * Math.sqrt(q) : 0, q2 > 0 ? 0.86 * Math.sqrt(q2) : 0, d < 1 ? 0.38 * Math.sqrt(1 - d * d) : 0);
}
function groundN(x: number, z: number): V3 {
  const e = 0.01, gx = (ground(x + e, z) - ground(x - e, z)) / (2 * e), gz = (ground(x, z + e) - ground(x, z - e)) / (2 * e);
  const l = Math.hypot(gx, 1, gz);
  return [-gx / l, 1 / l, -gz / l];
}
/** the gust down the slot (toward -z), `s` seconds after the drop: it comes in with the drop (v3/gust.tsx) */
const wind = (s: number) => 6.5 * sstep(0.0, 0.7, s) * (1 + 0.15 * Math.sin(2.3 * s) + 0.08 * Math.sin(5.1 * s + 1));
/** the line down the slot the wind carries it on, once it is down off the wall: out a little to the right, left of the
 *  big boulder, where it has to bound the driftwood lying across the slot */
const lane = (z: number) => 0.2 + 0.32 * sstep(-0.8, -3.0, z) + 0.06 * Math.sin(0.4 * z);

type Frame = { p: V3; turn: number; landed: number; hit: number; vy: number };
const DT = 1 / 240, SECONDS = 4;
/** off the wall, every 1/240 s from the strike: it comes off the rock with a little of its way along the face and less
 *  of its way into it, spinning back, and falls */
const AFTER = new Map<number, Frame[]>();
function afterWall(fly: number): Frame[] {
  const key = Math.round(fly * 1000);
  const got = AFTER.get(key); if (got) return got;
  const out: Frame[] = [];
  const { v0 } = throwOf(fly), vin = [0, 1, 2].map((j) => v0[j] + G[j] * fly) as V3, vn = dot(vin, WALL_N);
  const vt = [0, 1, 2].map((j) => vin[j] - vn * WALL_N[j]) as V3;
  const p: V3 = [...AT_WALL], v = [0, 1, 2].map((j) => 0.5 * vt[j] - 0.3 * vn * WALL_N[j]) as V3;
  let turn = 0.1, spin = -1.6;
  let landed = -9, hit = 0, bounces = 0, rolled = 0, nextBound = 1.8, down = false;
  for (let i = 0; i <= SECONDS / DT; i++) {
    const s = i * DT;
    out.push({ p: [...p], turn, landed, hit, vy: v[1] });
    // drag toward the wind; held to the wind's lane across the slot once it has come down
    const w = wind(s);
    if (down) v[0] += (7 * (lane(p[2]) - p[0]) - 3.2 * v[0]) * DT;
    v[2] += 1.5 * (-w - v[2]) * DT;
    v[1] += (-9.8 - 0.25 * v[1]) * DT;
    p[0] += v[0] * DT; p[1] += v[1] * DT; p[2] += v[2] * DT;
    // (the wall: never back into the rock's face)
    const into = dot([p[0] - AT_WALL[0], p[1] - AT_WALL[1], p[2] - AT_WALL[2]], WALL_N);
    if (into < 0) { for (let k = 0; k < 3; k++) p[k] -= into * WALL_N[k]; const vw = dot(v, WALL_N); if (vw < 0) for (let k = 0; k < 3; k++) v[k] -= 1.3 * vw * WALL_N[k]; }
    const g = ground(p[0], p[2]);
    if (p[1] < g) {
      const n = groundN(p[0], p[2]), vg = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
      p[1] = g; down = true;
      if (vg < 0) {
        const e = 0.45 + 0.17 * hash(bounces);                               // (each bounce its own: it is not a ball)
        if (-vg > 0.7) { landed = s; hit = Math.min(1, -vg / 5.5); bounces++; }
        for (let k = 0; k < 3; k++) v[k] -= (1 + e) * vg * n[k];
        if (-vg > 0.7) { v[0] = 0.88 * v[0] + (hash(bounces + 7) - 0.5) * 0.5; v[2] *= 0.88; }   // (a landing costs it a little way)
        else if (g === 0) v[1] = 0;                                          // (rolling)
      }
    }
    // rolling on the sand it bounds now and then, off its own lumps
    if (p[1] <= ground(p[0], p[2]) + 1e-4) {
      rolled += Math.hypot(v[0], v[2]) * DT;
      if (rolled > nextBound) { v[1] = 2.2 + 1.2 * hash(bounces + 3); rolled = 0; nextBound = 1.4 + 1.6 * hash(bounces + 5); landed = s; hit = 0.35; bounces++; }
      spin += (Math.hypot(v[0], v[2]) / (2 * Math.PI * R) - spin) * Math.min(1, 30 * DT);
    } else spin *= 1 - 0.15 * DT;
    turn += spin * DT * (v[2] <= 0 ? 1 : -1);
  }
  AFTER.set(key, out);
  return out;
}

export type Weed = { /** the foot, above the sand */ p: V3; /** turns of its roll (the rig's "roll", 0..1 a turn) */ roll: number; /** its scale across, up and along the slot: squashed and stretched */ sx: number; sy: number; sz: number; /** in the cursor's hand */ held: boolean; /** the top, where the cursor holds it */ top: V3 };
/** the weed `t` seconds into the shot: taken at `grab`, let go at `release`, against the wall at `drop` (all on the song's grid) */
export function weedAt(t: number, grab: number, release: number, drop: number, tick = 0.62): Weed {
  const top = (p: V3, sy: number): V3 => [p[0], p[1] + 2 * R * sy + 0.02, p[2]];
  const fly = drop - release, { v0, release: REL } = throwOf(fly);
  const round = (p: V3, sy: number, roll: number, held: boolean, sx = 1 / Math.sqrt(sy), sz = sx): Weed => ({ p, roll: ((roll % 1) + 1) % 1, sx, sy, sz, held, top: top(p, sy) });
  if (t >= drop) {
    const F = afterWall(fly), s = t - drop, i = Math.min(F.length - 2, Math.floor(s / DT)), k = s / DT - i, a = F[i], b = F[i + 1];
    const p = mix(a.p, b.p, Math.max(0, Math.min(1, k)));
    // flat against the rock as it strikes (squashed across, the slot's x, and swelled the other ways), springing back past round
    const flat = 0.42 * Math.exp(-s / 0.075) * Math.cos((2 * Math.PI * s) / 0.24);
    // squash on each landing and spring back past round (a damped wobble), stretched along the line in flight
    const since = s - a.landed, wob = a.landed >= 0 ? a.hit * Math.exp(-since / 0.07) * Math.cos((2 * Math.PI * since) / 0.22) : 0;
    const fly2 = Math.min(1, Math.abs(a.vy) / 5) * (p[1] > 0.02 ? 1 : 0);
    const sy = Math.max(0.6, 1 - 0.34 * wob + 0.1 * fly2 + 0.18 * flat), sx = Math.max(0.5, (1 - flat) / Math.sqrt(sy)), sz = (1 + 0.5 * flat) / Math.sqrt(sy);
    return round(p, sy, a.turn, false, sx, sz);
  }
  if (t >= release) {
    // the lob: from the hand to the wall, turning forward, stretched along its way and coming round
    const s = t - release, p = [0, 1, 2].map((j) => REL[j] + v0[j] * s + 0.5 * G[j] * s * s) as V3;
    const sy = 1 + 0.16 * Math.exp(-s / 0.06);
    return round(p, sy, 1.4 * s, false);
  }
  if (t < grab) return round(LIE, 1, 0, false, 1, 1);
  // taken: a little squash as the cursor closes on it, then up off the sand, stretched, and round again with a bob
  const u = t - grab;
  let p: V3, sy = 1, roll = 0;
  const lifted = mix(LIE, LIFT, sstep(0.04, 0.42, u));
  const carried = mix(lifted, HOLD, sstep(0.5, release - WIND - THROW - grab, u));
  // (weighed in the hand on the song's tick: dipped and lifted a little, as you weigh a ball before you throw it)
  const weigh = 0.035 * Math.sin((2 * Math.PI * (u - 0.5)) / (2 * tick)) * sstep(0.5, 1.0, u) * (1 - sstep(release - WIND - THROW - grab - 0.3, release - WIND - THROW - grab, u));
  p = [carried[0], carried[1] + weigh, carried[2]];
  sy = 1 - 0.12 * Math.exp(-(((u - 0.04) / 0.05) ** 2)) + 0.1 * Math.exp(-(((u - 0.25) / 0.09) ** 2));
  roll = 0.02 * Math.sin(u * 2.1) * sstep(0.3, 1.0, u);                       // (it hangs from the cursor and turns a little)
  // the draw back, down and left: slow out of the hold, slow into the furthest point, the weed squashed as it is loaded
  const w0 = release - WIND - THROW, w = sstep(w0, release - THROW, t);
  if (t >= w0) { p = mix(p, BACK, w); sy = 1 - 0.16 * w; roll = -0.05 * w; }
  // the throw: from rest at the furthest point to the throw's speed as it leaves the hand (a curve whose end runs at v0)
  if (t >= release - THROW) {
    const k = (t - (release - THROW)) / THROW, h01 = -2 * k ** 3 + 3 * k * k, h11 = k ** 3 - k * k, h00 = 1 - h01;
    p = [0, 1, 2].map((j) => h00 * BACK[j] + h01 * REL[j] + h11 * THROW * v0[j]) as V3;
    sy = 0.84 + 0.39 * k * k; roll = -0.05 + 0.02 * k;
  }
  return round(p, sy, roll, true);
}
/** where the cursor's hand goes on to as it lets go: on along the throw, up and to the right, slowing (the follow-through) */
export function followOf(release: number, drop: number): V3 {
  const { v0, release: REL } = throwOf(drop - release), u = Math.hypot(...v0);
  return [REL[0] + (0.5 * v0[0]) / u, REL[1] + 2 * R + (0.5 * v0[1]) / u, REL[2] + (0.5 * v0[2]) / u];
}
