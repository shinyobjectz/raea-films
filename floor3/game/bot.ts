// A model of a person at a mouse and keyboard, playing FLOOR3. It never touches the game's state: it reads the screen's
// facts (where it is, what it sees) and produces only what a player's devices produce, one frame at a time: keys held,
// whole mouse counts, the left button. Its mouse moves the way a hand does: a fast reach that lands a little long or
// short, a pause, a correction, stillness when the hand rests; its keys go down and up at a hand's speed.
import { EYE, type V3 } from "./level";
import { DT, FPS, INITIAL, SENS, dynamicSolids, eyeOf, step, type Game, type Input } from "./step";
import { route } from "./nav";

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const wrap = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const minJerk = (u: number) => { const t = clamp(u, 0, 1); return t * t * t * (10 - 15 * t + 6 * t * t); };
/** a new gaze further off than this (radians, about 3.4 degrees) is reached for; anything nearer is followed */
const REACH = 0.06;
/** a gaze that drifts off (the way ahead while walking) is followed however far it goes, up to this (about 17 degrees):
 * past it the hand reaches. Reaching for drift is what made a walk's view pulse: the follow lagged a moving gaze, the
 * lag passed REACH, a reach caught it up, and the lag built again, ten frames a cycle */
const FAR = 0.3;
/** the hand's top turning speed in a reach (radians a second): calm (about 220 degrees a second), and startled (430).
 * Faster, a 60 fps picture with no motion blur strobes */
const PEAK = [3.8, 7.5];
/** the scripts' pushes (a flinch, a drag's sweep) are written in 0.0011-radian units of hand travel: this many counts each */
export const HAND = 0.0011 / SENS;

export type Gaze = { point: V3 } | { yaw: number; pitch: number };
interface Reach { y0: number; p0: number; dy: number; dp: number; t: number; dur: number; curve: number }

export class Bot {
  s: Game = INITIAL;
  inputs: Input[] = [];
  states: Game[] = [INITIAL];
  marks: { f: number; name: string }[] = [];
  rand: () => number;
  keys = new Set<string>();
  down = false;
  gaze: Gaze = { yaw: INITIAL.p.yaw, pitch: INITIAL.p.pitch };
  /** how quick the hand is: 1 a calm look, 2 a startled one */
  haste = 1;
  private reach: Reach | null = null;
  private rest = 0; // frames after a reach before the hand reaches again (it follows meanwhile)
  private fx = 0; private fy = 0; // fractions of a count carried over
  private vy = 0; private vp = 0; // the hand's turn a frame while following (radians)
  private wob = 0;
  // the gaze's own turn a frame as seen from here (low-passed), which the follow matches; and last frame's want
  private gy = 0; private gp = 0; private last: [number, number] | null = null;
  /** a look the script just asked for (reached for when far), as against a gaze drifting while walking (followed) */
  private fresh = false;
  /** extra mouse travel to add this frame (a flinch, a drag), in HAND units */
  pushX = 0; pushY = 0;
  /** hold the look still (a drag owns the mouse) */
  freeze = false;
  /** frames where a walk gave up on a point */
  stuck: number[] = [];

  constructor(seed = 7) { this.rand = rng(seed); }
  get f() { return this.s.f; }
  mark(name: string) { this.marks.push({ f: this.s.f, name }); }
  n(mean: number, spread: number) { return mean + (this.rand() + this.rand() + this.rand() - 1.5) * spread * 1.15; }

  /** the yaw and pitch that look at the gaze, from where the player stands (the eye's height, not its bob: a hand
   * doesn't chase the head's sway) */
  private want(): [number, number] {
    const g = this.gaze;
    if ("yaw" in g) return [g.yaw, g.pitch];
    const e = [this.s.p.x, EYE, this.s.p.z];
    const dx = g.point[0] - e[0], dy = g.point[1] - e[1], dz = g.point[2] - e[2];
    return [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))];
  }
  /** how far the view is from the gaze (radians) */
  off(): number {
    const [wy, wp] = this.want();
    return Math.hypot(wrap(wy - this.s.p.yaw), wp - this.s.p.pitch);
  }

  /** one frame: the hand moves the mouse toward the gaze, the keys are as set, the game steps. A big change of gaze is
   * a reach (a quick move that lands a little long or short); anything smaller, or a gaze that keeps moving (the way
   * ahead while walking), is followed: the hand's speed eases toward a share of what is left, so the view glides onto
   * it and keeps pace with it instead of jumping, stopping and jumping again. */
  tick() {
    const p = this.s.p;
    let my = 0, mp = 0; // the turn this frame (radians)
    // a slow wander in the hand's speed (a hand is never perfectly even, but it doesn't shake frame to frame either)
    this.wob += (this.rand() - 0.5 - this.wob) * 0.06;
    const [wy, wp] = this.want();
    // how fast the gaze itself turns, seen from here: a jump (a new point to look at) is not a speed
    if (this.last) {
      const dy = wrap(wy - this.last[0]), dp = wp - this.last[1];
      if (Math.hypot(dy, dp) < 0.03) { this.gy += (dy - this.gy) * 0.2; this.gp += (dp - this.gp) * 0.2; }
    }
    this.last = [wy, wp];
    if (!this.freeze) {
      const ey = wrap(wy - p.yaw), ep = wp - p.pitch, err = Math.hypot(ey, ep);
      if (!this.reach) {
        if (this.rest > 0) this.rest--;
        if (err < REACH) this.fresh = false;
        if (err > (this.fresh ? REACH : FAR) && this.rest <= 0) {
          this.fresh = false;
          const deg = (err * 180) / Math.PI;
          // no faster than the hand's top speed: a min-jerk reach peaks at 1.875 times its mean speed
          const slowest = (1.875 * err) / PEAK[this.haste >= 1.5 ? 1 : 0];
          const dur = Math.round(Math.max(slowest, clamp((0.13 + 0.0042 * deg + 0.05 * Math.sqrt(deg / 20)) / this.haste, 0.07, 0.7)) * FPS * (0.9 + this.rand() * 0.25));
          // a long reach lands a little long or short; a short one is truer
          const miss = deg > 4 ? 1 + (this.rand() - 0.42) * 0.11 : 1 + (this.rand() - 0.5) * 0.05;
          this.reach = { y0: p.yaw, p0: p.pitch, dy: ey * miss, dp: ep * miss + (deg > 10 ? (this.rand() - 0.5) * 0.02 : 0), t: 0, dur: Math.max(4, dur), curve: (this.rand() - 0.5) * 0.12 };
        }
      }
      // a reach moves from the frame it begins
      if (this.reach) {
        const r = this.reach;
        const u0 = minJerk(r.t / r.dur), u1 = minJerk((r.t + 1) / r.dur);
        const bow = (Math.sin(Math.PI * ((r.t + 1) / r.dur)) - Math.sin(Math.PI * (r.t / r.dur))) * r.curve;
        const j = 1 + this.wob * 0.1;
        // under the reach the follow eases to the gaze's own turn (the pursuit runs on beneath the jump, as an eye's
        // does), so a reach for a moving thing lands moving with it instead of stopping and starting again
        this.vy += (this.gy - this.vy) * 0.18; this.vp += (this.gp - this.vp) * 0.18;
        my = (r.dy * (u1 - u0) - r.dp * bow) * j + this.vy; mp = (r.dp * (u1 - u0) + r.dy * bow) * j + this.vp;
        r.t++;
        if (r.t >= r.dur) {
          this.reach = null; this.rest = Math.round(this.n(7, 3) / this.haste);
          // and the follow that comes after it picks up from the reach's own last speed
          const v1 = minJerk(1) - minJerk((r.dur - 1) / r.dur);
          this.vy += r.dy * v1; this.vp += r.dp * v1;
        }
      } else {
        // following: the gaze's own turn (so a moving gaze is kept pace with, not lagged), plus a share of the error a
        // frame, capped, eased in and out, and no correction once it's close enough
        const fb = err < 0.0025 ? 0 : 0.1 * this.haste;
        let ty = this.gy + ey * fb, tp = this.gp + ep * fb;
        const m = Math.hypot(ty, tp), cap = 0.03 * this.haste;
        if (m > cap) { ty *= cap / m; tp *= cap / m; }
        this.vy += (ty - this.vy) * 0.2; this.vp += (tp - this.vp) * 0.2;
        const j = 1 + this.wob * 0.12;
        my = this.vy * j; mp = this.vp * j;
      }
    }
    // radians to whole counts, the remainder carried; a script's push is the hand's own travel (HAND counts a unit)
    this.fx += -my / SENS + this.pushX * HAND; this.fy += -mp / SENS + this.pushY * HAND;
    this.pushX = 0; this.pushY = 0;
    const dx = Math.trunc(this.fx), dy = Math.trunc(this.fy);
    this.fx -= dx; this.fy -= dy;
    const input: Input = { keys: [...this.keys], dx, dy, down: this.down };
    this.inputs.push(input);
    this.s = step(this.s, input);
    this.states.push(this.s);
  }

  // ---- what a script says: each is a generator, a frame per yield -----------------------------------------------------
  *wait(seconds: number): Generator<void> { for (let i = 0, n = Math.round(seconds * FPS); i < n; i++) yield; }
  *until(cond: () => boolean, max = 30): Generator<void> { for (let i = 0; i < max * FPS && !cond(); i++) yield; }
  look(g: Gaze | V3, haste = 1) { this.gaze = Array.isArray(g) ? { point: g } : g; this.haste = haste; this.rest = Math.min(this.rest, 2); this.fresh = true; }
  /** look at a thing and wait until the view has settled on it */
  *lookAt(g: Gaze | V3, haste = 1, tol = 0.03): Generator<void> {
    this.look(g, haste);
    yield* this.until(() => this.off() < tol && !this.reach, 3);
  }
  /** turn the view by an angle from where it is (a glance, a scan) */
  lookBy(dyaw: number, pitch: number, haste = 1) { this.look({ yaw: this.s.p.yaw + dyaw, pitch }, haste); }
  press(k: string) { this.keys.add(k); }
  release(k: string) { this.keys.delete(k); }
  releaseAll() { this.keys.clear(); }
  *click(holdFrames = 5): Generator<void> { this.down = true; yield* this.wait(holdFrames / FPS); this.down = false; yield; }

  /** walk through waypoints (x, z), steering with the view and the strafe keys the way a player does. `watch` keeps
   * the eyes on a point instead of the way ahead. */
  *walk(points: [number, number][], o: { sprint?: boolean; watch?: V3 | null; arrive?: number; pitch?: number; stopAtEnd?: boolean; back?: boolean } = {}): Generator<void> {
    const arrive = o.arrive ?? 0.32;
    let strafeHold = 0, strafe = this.keys.has("a") ? "a" : this.keys.has("d") ? "d" : "";
    // each leg goes round what is in the way
    const legs: [number, number][] = [];
    let from: [number, number] = [this.s.p.x, this.s.p.z];
    for (const pt of points) { legs.push(...route(from, pt, dynamicSolids(this.s))); from = pt; }
    points = legs;
    for (let i = 0; i < points.length; i++) {
      const [tx, tz] = points[i];
      const last = i === points.length - 1;
      let best = Infinity, since = 0;
      for (let guard = 0; guard < 40 * FPS; guard++) {
        const p = this.s.p;
        const dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz);
        if (dist < (last ? arrive : 0.42)) break;
        // no closer for a second: the way is blocked; give up on this point (a person steps round)
        if (dist < best - 0.05) { best = dist; since = 0; } else if (++since > FPS) { this.stuck.push(this.s.f); break; }
        const heading = Math.atan2(-dx, -dz);
        if (!o.watch) {
          // eyes on the way ahead: the point, or past it toward the next one when close
          const nx = !last && dist < 1.6 ? points[i + 1] : points[i];
          this.gaze = { point: [nx[0], EYE + (o.pitch ?? -0.1) * Math.max(2, Math.hypot(nx[0] - p.x, nx[1] - p.z)), nx[1]] };
        } else this.gaze = { point: o.watch };
        const a = wrap(heading - p.yaw); // positive: the way is to the left
        const abs = Math.abs(a);
        const wantFw = abs < 1.0 ? "w" : abs > 2.2 ? "s" : "";
        for (const k of ["w", "s"]) if (k === wantFw) this.keys.add(k); else this.keys.delete(k);
        // strafe toward the way when the view is off it; a key stays down at least a tenth of a second
        const wantStrafe = abs > 0.3 && abs < 2.85 ? (a > 0 ? "a" : "d") : abs > 0.12 && strafe ? strafe : "";
        if (strafeHold > 0) strafeHold--;
        else if (wantStrafe !== strafe) { if (strafe) this.keys.delete(strafe); strafe = wantStrafe; if (strafe) this.keys.add(strafe); strafeHold = 6 + Math.floor(this.rand() * 5); }
        if (o.sprint && wantFw === "w") this.keys.add("Shift"); else this.keys.delete("Shift");
        yield;
      }
    }
    if (o.stopAtEnd ?? true) { this.keys.delete("w"); this.keys.delete("s"); this.keys.delete("a"); this.keys.delete("d"); this.keys.delete("Shift"); }
  }
  /** run a script and, beside it, a second one (a glance while walking) */
  *both(a: Generator<void>, b: Generator<void>): Generator<void> {
    let da = false, db = false;
    while (!da) { da = !!a.next().done; if (!db) db = !!b.next().done; if (!da) yield; }
  }
  /** run two scripts side by side until either ends (a walk cut short by what happens) */
  *race(a: Generator<void>, b: Generator<void>): Generator<void> {
    while (true) { if (a.next().done) return; if (b.next().done) return; yield; }
  }
  /** play a script to its end, a tick a yield */
  play(script: Generator<void>, maxFrames = 400 * FPS) {
    for (let i = 0; i < maxFrames; i++) { if (script.next().done) break; this.tick(); }
  }
}
export { DT };
