// FLOOR3: the game's rules as one pure step. Engine-free: the live game, the capture, the bot, the checks and the audio
// engine all fold this same function over the same input, so they agree on every frame.
import {
  COPY_OPEN, EYE, FIXTURES, GHOST_AT, HAND_SOLIDS, INTERACTS, RADIUS, START, STATIC_SOLIDS, roomAt,
  type Fixture, type Interact, type InteractId, type RoomId, type Solid, type V3,
} from "./level";
import { LINES, paperWords, readSeconds, type PaperId } from "./lines";

export const FPS = 60;
export const DT = 1 / FPS;
const sec = (s: number) => Math.round(s * FPS);

/** one frame of what the player's devices did: keys held, mouse counts moved, the left button */
export interface Input { keys: string[]; dx: number; dy: number; down: boolean }
export const NO_INPUT: Input = { keys: [], dx: 0, dy: 0, down: false };

export type HandMode = "arrow" | "link" | "grab" | "resize" | "busy";
export interface Hand {
  mode: HandMode;
  /** frame its mode last changed (for the swap's pop) */
  modeF: number;
  hover: InteractId | null;
  /** 0 at rest by the hip, 1 with its hotspot on the thing it's over */
  reach: number;
  /** the point it reaches for (kept while it eases back) */
  to: V3;
  /** frame a press began, -1 when none */
  press: number;
  pressOn: InteractId | null;
  /** look sway: the view's turn rate, smoothed (rad a frame) */
  swx: number; swy: number;
  /** how far in front of the eye it rests (pulled in near a wall) */
  out: number;
}
export interface Player {
  x: number; z: number; yaw: number; pitch: number; vx: number; vz: number;
  /** steps walked, as a real number: its whole part counts footfalls */
  stride: number;
  /** head bob's strength, eased from the speed */
  bob: number;
  /** strafe lean, eased (rad) */
  lean: number;
}
export interface Story {
  ring1: number; vm1: number;
  copyW: number; drag: boolean; dragV: number;
  tape2: number; badge: number; pocket: number; copier: number;
  wing: number; ghost1: number; ghost2: number; ghost3: number;
  lobby: number; swipe: number; ring2: number; vm3: number; behind: number;
  /** frame a locked door was last tried */
  tried: number;
  /** the papers: the notice read (frame opened), the copier's page out in the tray, taken; what's up on screen and since */
  notice: number; printed: number; printout: number;
  /** frame someone began knocking from inside the office across from the copy room */
  knock: number;
  read: PaperId | null; readF: number;
}
export interface Game {
  f: number;
  p: Player;
  down: boolean;
  hand: Hand;
  /** frames since the player last moved, and how asleep the floor is (0 awake, 1 asleep) */
  idle: number; sleep: number;
  /** frame the floor last woke (its lights strike again from here), and how asleep it was */
  wake: number; wakeFrom: number;
  /** per sensor fixture: the frame it struck on, the frame it began to go off (-1 for never) */
  on: number[]; off: number[];
  /** moved or looked yet (for the first prompts) */
  moved: number; looked: number; clicked: number; sprinted: number;
  st: Story;
  /** the prompt beside the hand ("id|key|label", "" for none) and the frame it came up: it stays up at least as long as
   * its words take to read, and the next one waits for that */
  prompt: { key: string; since: number };
  /** what happened on this frame, for sound: "step:carpet", "click", ... */
  ev: string[];
}

export const COPY_MIN = 0.34, COPY_MAX = COPY_OPEN.b - COPY_OPEN.a;
export const RING1_F = sec(26);
/** radians a mouse count: a 3200-count-per-inch mouse at a low in-game sensitivity, so a slow turn is many small counts
 * a frame and pans evenly (at 0.0011 a slow pan was 3 and 4 counts a frame by turns, which reads as a stutter) */
export const SENS = 0.0011 / 8;
const WALK = 1.5, SPRINT = 3.25, BACK = 0.8;
const IDLE_F = sec(5), SLEEP_RAMP = 1 / sec(6.5);

export const INITIAL: Game = {
  f: 0,
  p: { x: START.x, z: START.z, yaw: START.yaw, pitch: START.pitch, vx: 0, vz: 0, stride: 0, bob: 0, lean: 0 },
  down: false,
  hand: { mode: "arrow", modeF: -100, hover: null, reach: 0, to: [0, 0, 0], press: -1, pressOn: null, swx: 0, swy: 0, out: 0.42 },
  idle: 0, sleep: 0, wake: -1000, wakeFrom: 0,
  on: FIXTURES.map(() => -1), off: FIXTURES.map(() => -1),
  moved: -1, looked: -1, clicked: -1, sprinted: -1,
  prompt: { key: "", since: -100 },
  st: {
    ring1: -1, vm1: -1, copyW: COPY_MIN, drag: false, dragV: 0, tape2: -1, badge: -1, pocket: -1, copier: -1,
    wing: -1, ghost1: -1, ghost2: -1, ghost3: -1, lobby: -1, swipe: -1, ring2: -1, vm3: -1, behind: -1, tried: -1,
    notice: -1, printed: -1, printout: -1, read: null, readF: -1, knock: -1,
  },
  ev: [],
};

// ---- the finale's clock, from the frame the voice speaks behind the player ------------------------------------------
export const FIN = {
  corOut: (k: number) => sec(1.5 + 0.42 * k), // the corridor's six lit fixtures die, west first
  wingOn: (k: number) => sec(4.3 + 0.55 * k), // the wing's axis row strikes, west first
  wingHold: [0.5, 0.5, 0.5, 0.85],
  lobbyA: sec(7.35), lobbyB: sec(8.0), lock: sec(8.0), exitOut: sec(9.25), black: sec(9.25),
  there: sec(9.9), ask: sec(11.9), askMove: sec(13.4), askClick: sec(14.75), title: sec(15.6), titleOut: sec(20.4), end: sec(22.4),
};
export const behindAt = (s: Game) => s.st.behind;
export const ended = (s: Game) => s.st.behind >= 0 && s.f >= s.st.behind + FIN.end;
export const locked = (s: Game) => s.st.behind >= 0 && s.f >= s.st.behind + FIN.lock;

// ---- geometry helpers -----------------------------------------------------------------------------------------------
export function dynamicSolids(s: Game): Solid[] {
  // the copy room's opening: the wall still standing in it, east of its edge
  return s.st.copyW < COPY_MAX - 0.01 ? [{ x0: COPY_OPEN.a + s.st.copyW, x1: COPY_OPEN.b, z0: -2.6, z1: -2.4, y0: 0, y1: 2.1, name: "copy-fill" }] : [];
}
function collide(x: number, z: number, solids: Solid[]): [number, number] {
  for (let it = 0; it < 3; it++) {
    for (const b of solids) {
      if (b.y0 > 1.5 || b.y1 < 0.35) continue;
      const cx = Math.max(b.x0, Math.min(x, b.x1)), cz = Math.max(b.z0, Math.min(z, b.z1));
      const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= RADIUS * RADIUS) continue;
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2), k = (RADIUS - d) / d;
        x += dx * k; z += dz * k;
      } else {
        // inside the box: out by the nearest side
        const l = x - b.x0, r = b.x1 - x, n = z - b.z0, f = b.z1 - z, m = Math.min(l, r, n, f);
        if (m === l) x = b.x0 - RADIUS; else if (m === r) x = b.x1 + RADIUS; else if (m === n) z = b.z0 - RADIUS; else z = b.z1 + RADIUS;
      }
    }
  }
  return [x, z];
}
/** the first box a ray meets, and how far along (Infinity for none) */
export function rayHit(o: V3, d: V3, solids: Solid[], max = 50): { t: number; solid: Solid | null } {
  let best = max, hit: Solid | null = null;
  for (const b of solids) {
    let t0 = 0, t1 = best;
    const lo = [b.x0, b.y0, b.z0], hi = [b.x1, b.y1, b.z1];
    let ok = true;
    for (let a = 0; a < 3 && ok; a++) {
      if (Math.abs(d[a]) < 1e-9) { if (o[a] < lo[a] || o[a] > hi[a]) ok = false; continue; }
      let ta = (lo[a] - o[a]) / d[a], tb = (hi[a] - o[a]) / d[a];
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
      if (t0 > t1) ok = false;
    }
    if (ok && t0 < best) { best = t0; hit = b; }
  }
  return { t: hit ? best : Infinity, solid: hit };
}
export const forward = (yaw: number, pitch: number): V3 => [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
export const rightOf = (yaw: number): V3 => [Math.cos(yaw), 0, -Math.sin(yaw)];
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => { const t = clamp(v, 0, 1); return t * t * (3 - 2 * t); };

/** the eye: where it is this frame, bob and all */
export function eyeOf(s: Game): { pos: V3; yaw: number; pitch: number; roll: number } {
  const p = s.p, ph = p.stride * Math.PI * 2;
  const up = Math.sin(ph) * 0.017 * p.bob, side = Math.sin(ph / 2) * 0.011 * p.bob;
  const r = rightOf(p.yaw);
  return { pos: [p.x + r[0] * side, EYE + up, p.z + r[2] * side], yaw: p.yaw, pitch: p.pitch + Math.sin(ph) * 0.0022 * p.bob, roll: -p.lean + Math.sin(ph / 2) * 0.0035 * p.bob };
}

/** what the cursor is over: the nearest thing in reach whose ball the view's middle ray passes through, unhidden. With
 * `near`, what the view is nearly on instead (a little past reach, within a few degrees of the middle): the prompt comes
 * up for that, as a game's does, before the cursor is exactly on it */
export function hoverOf(s: Game, near = false): Interact | null {
  const e = eyeOf(s), d = forward(e.yaw, e.pitch);
  let best: Interact | null = null, bt = Infinity;
  for (const it of INTERACTS) {
    if (!usable(s, it.id)) continue;
    const at = interactAt(s, it);
    const v: V3 = [at[0] - e.pos[0], at[1] - e.pos[1], at[2] - e.pos[2]];
    const t = v[0] * d[0] + v[1] * d[1] + v[2] * d[2];
    if (t < 0.15 || t > it.reach) continue;
    const off = Math.hypot(v[0] - d[0] * t, v[1] - d[1] * t, v[2] - d[2] * t);
    // nearly on it: within a few degrees of the middle; a big flat thing (a notice on the wall) from a little further off
    // and only at arm's length: from further off the prompt waits for the cursor to be on it
    const close = near && Math.hypot(v[0], v[1], v[2]) <= 1.3;
    if (off > (close ? (it.r >= 0.2 ? it.r * 2.2 : Math.max(it.r, Math.tan(0.21) * t)) : it.r)) continue;
    // a thing reached for sits on or in its own box (a copier's tray, a desk's phone): that box doesn't hide it
    const inside = (b: Solid) => at[0] > b.x0 - 0.02 && at[0] < b.x1 + 0.02 && at[1] > b.y0 - 0.02 && at[1] < b.y1 + 0.02 && at[2] > b.z0 - 0.02 && at[2] < b.z1 + 0.02;
    const hit = rayHit(e.pos, d, [...HAND_SOLIDS, ...dynamicSolids(s)].filter((b) => !inside(b)), t - 0.14);
    if (hit.solid && hit.t < t - 0.14) continue;
    if (t < bt) { bt = t; best = it; }
  }
  return best;
}
/** a thing's point this frame (the copy room's edge moves) */
export function interactAt(s: Game, it: Interact): V3 {
  return it.id === "copy-edge" ? [COPY_OPEN.a + s.st.copyW, it.at[1], -2.5] : it.at;
}
/** whether a thing can be acted on yet */
function usable(s: Game, id: InteractId): boolean {
  const st = s.st;
  switch (id) {
    case "phone1": return st.ring1 >= 0 && st.vm1 < 0;
    case "copy-edge": return st.vm1 >= 0 && st.copyW < COPY_MAX - 0.02;
    case "recorder": return st.tape2 < 0;
    case "badge": return st.badge < 0;
    case "reader": return st.badge >= 0 && st.swipe < 0;
    case "machine": return false;
    case "locked": return true;
    case "stair-handle": return st.swipe >= 0 && st.behind < 0;
    case "notice": return st.notice < 0 && st.read === null;
    case "printout": return st.printed >= 0 && s.f - st.printed > PRINT_SLIDE && st.printout < 0;
  }
}

/** frames the copier's page takes to slide out into the tray */
export const PRINT_SLIDE = sec(1.1);
/** the least time a paper stays up: as long as its words take to read */
export const readMin = (id: PaperId) => sec(readSeconds(paperWords(id)));

/** what the prompt says for each thing the hand can use: the key and what it does */
export const PROMPT: Partial<Record<InteractId, [string, string]>> = {
  phone1: ["LMB", "Play message"], recorder: ["LMB", "Play tape"], badge: ["LMB", "Take badge"], reader: ["LMB", "Swipe badge"],
  "stair-handle": ["LMB", "Open"], locked: ["LMB", "Open"], "copy-edge": ["Hold LMB", "Resize"], notice: ["LMB", "Read"], printout: ["LMB", "Take"],
};
/** the least time a prompt stays up: its words at 0.3 s each, never under a second, and a few frames to spare */
export const promptMin = (key: string) => sec(Math.max(1.0, 0.3 * key.split("|").slice(1).join(" ").split(/\s+/).length) + 0.2);

// ---- lights ---------------------------------------------------------------------------------------------------------
// Every light here changes smoothly, never in a jump: MetalFX's temporal denoiser carries the light a wall had, so a
// light that jumps leaves dark arcs and patches on the walls for a few frames after (the raw trace is clean). Measured
// on the copy room's wake: a blink-and-catch strike drew them, a ramp doesn't.
// a tube coming on as a rapid-start ballast brings it up: from where it was to full over two thirds of a second, eased
const STRIKE_F = 40;
function strike(age: number, from = 0): number {
  if (age < 0) return from;
  return age >= STRIKE_F ? 1 : from + (1 - from) * smooth(age / STRIKE_F);
}
/** a pulse train eased between beats: `on(c)` says whether beat c (of `n` frames) is in the pulse, and the value moves
 * from one beat's to the next over the beat, so it never jumps */
function eased(f: number, n: number, on: (c: number) => number): number {
  const c = Math.floor(f / n);
  return on(c) + (on(c + 1) - on(c)) * smooth((f - c * n) / n);
}
const COR_LIT = FIXTURES.filter((f) => f.room === "cor" && f.kind !== "dead");
const WING_AXIS = FIXTURES.filter((f) => f.room === "wing" && Math.abs(f.z + 1.3) < 0.01);
const LOBBY = FIXTURES.filter((f) => f.room === "lobby");

/** where in the floor's falling asleep a fixture goes out: the farthest from the player first, the nearest last */
export function sleepAt(s: Game, fx: Fixture): number {
  const d = Math.hypot(fx.x - s.p.x, fx.z - s.p.z);
  return 0.06 + 0.84 * (1 - clamp(d / 17, 0, 1));
}
/** how far a fixture has gone out, 0 lit to 1 out, as the floor sleeps */
const outOf = (s: Game, fx: Fixture, sleep = s.sleep) => smooth((sleep - sleepAt(s, fx)) / 0.06);
/** a tired tube, out, still spasming: eased pulses eight frames a beat, faded in over a dozen frames once it's out */
function spasmOf(s: Game, fx: Fixture, f: number, sleep: number): number {
  if (fx.kind !== "flicker" || sleep <= 0) return 0;
  const g = smooth((sleep - sleepAt(s, fx) - 0.06) / (12 * SLEEP_RAMP));
  return g > 0 ? g * eased(f, 8, (c) => (hash(c + fx.id * 3.1) < 0.22 ? 0.18 + 0.3 * hash(c + 9) : 0)) : 0;
}

/** a fixture's light this frame, 0 dark to about 1 */
export function lightOf(s: Game, fx: Fixture): number {
  const f = s.f, B = s.st.behind;
  // the floor waking at the start: the bay strikes, a tube at a time
  const boot = strike(f - 50 - Math.floor(hash(fx.id) * 55));
  // asleep: every light sinks; awake again: each strikes after its own beat
  // the tired tube is first back: its strike is what shows what was standing in the dark
  const delay = fx.kind === "flicker" ? 0 : 4 + Math.floor(hash(fx.id + 7) * 20);
  const waking = f - s.wake - delay;
  const out = outOf(s, fx);
  // going out: sinking to a low ember; a tired tube, out, still spasms (eased pulses, eight frames a beat). Woken, each
  // comes back up from where it had sunk to
  const dim = 1 - 0.96 * out;
  const spasm = spasmOf(s, fx, f, s.sleep);
  const sunk = Math.max(0.04, 1 - 0.96 * outOf(s, fx, s.wakeFrom), spasmOf(s, fx, s.wake - 1, s.wakeFrom));
  const lit = s.sleep > 0 ? Math.max(dim, spasm) : waking < STRIKE_F && s.wakeFrom > 0.05 ? strike(waking, sunk) : 1;
  let v = 0;
  if (fx.kind === "always") v = lit * boot;
  else if (fx.kind === "flicker") {
    // a tired tube: mostly on, dipping to half in bursts (eased dips, four frames a beat; a burst is judged on a beat's
    // first frame, so its edge never cuts one short), and a slow shimmer while on
    const dip = eased(f, 4, (c) => (hash(Math.floor((c * 4) / 48) + fx.id * 13) < 0.3 && hash(c * 1.7 + fx.id) < 0.45 ? 1 : 0));
    const sh = eased(f, 6, (c) => hash(c + fx.id));
    v = s.sleep > 0 && out >= 1 ? lit * boot : lit * boot * ((0.92 + 0.08 * sh) * (1 - 0.5 * dip));
  } else if (fx.kind === "sensor") {
    const on = s.on[fx.id], off = s.off[fx.id];
    if (on >= 0 && (off < on)) v = strike(f - on);
    else if (off >= 0) v = Math.max(0, 1 - (f - off) / 14) * (f - off < 2 ? 1.1 : 1);
    v *= 1 - 0.9 * smooth(s.sleep);
  }
  if (B >= 0) {
    const t = f - B;
    const ci = COR_LIT.indexOf(fx);
    // a blow-out: a five-frame surge, then gone over twelve frames (eased, as every light here changes)
    const blow = (o: number, peak: number) => (o < 5 ? 1 + (peak - 1) * smooth((o + 1) / 5) : peak * (1 - smooth((o - 5) / 12)));
    if (ci >= 0) { const o = t - FIN.corOut(ci); if (o >= 0) v = blow(o, 1.5); }
    const wi = WING_AXIS.indexOf(fx);
    if (fx.room === "wing") {
      v = 0;
      if (wi >= 0) { const o = t - FIN.wingOn(wi); const hold = sec(FIN.wingHold[wi]); if (o >= 0 && o < hold) v = strike(o); else if (o >= hold) v = strike(hold) * (1 - smooth((o - hold) / 12)); }
    }
    const li = LOBBY.indexOf(fx);
    if (li === 0 && t >= FIN.lobbyA) v = blow(t - FIN.lobbyA, 1.6);
    if (li === 1 && t >= FIN.lobbyB) v = Math.max(0, 1 - (t - FIN.lobbyB) / sec(0.9)) * (0.75 + 0.25 * eased(f, 4, (c) => hash(c)));
    if (fx.room === "bay" || fx.room === "copy") v = t > FIN.corOut(0) ? v * (1 - smooth((t - FIN.corOut(0)) / 8)) : v;
  }
  return v;
}
/** the exit sign over the stair door, and the small lights: 0..1 */
export function exitGlow(s: Game): number {
  const B = s.st.behind;
  if (B >= 0 && s.f - B >= FIN.exitOut) return 0;
  return 1;
}
export const blackout = (s: Game) => s.st.behind >= 0 && s.f - s.st.behind >= FIN.black;

// ---- "it" -----------------------------------------------------------------------------------------------------------
export interface It { x: number; z: number; seen: boolean; yaw: number; loud: number }
/** where it stands this frame, whether it can be seen, and how loud it is (0..1) */
export function itOf(s: Game): It {
  const f = s.f, st = s.st, p = s.p;
  const none: It = { x: -5, z: -1.3, seen: false, yaw: 0, loud: 0 };
  if (st.behind >= 0) {
    const t = f - st.behind;
    if (t < FIN.corOut(0) - 20) return { ...none, x: p.x, z: p.z, loud: 0 };
    if (t < FIN.corOut(3)) return { x: 15.6, z: -1.25, seen: true, yaw: -Math.PI / 2, loud: 0.35 };
    if (t < FIN.wingOn(3)) {
      // unseen, crossing the wing under the lights it sets off
      const k = clamp((t - FIN.wingOn(0)) / (FIN.wingOn(3) - FIN.wingOn(0)), 0, 1);
      return { x: 31 + k * 13.5, z: -1.3, seen: false, yaw: -Math.PI / 2, loud: 0.5 + 0.3 * k };
    }
    if (t < FIN.lobbyA) return { x: 45.5, z: -1.3, seen: true, yaw: -Math.PI / 2, loud: 0.85 };
    return { x: 48.75, z: -1.3, seen: t < FIN.black, yaw: -Math.PI / 2, loud: t < FIN.black ? 1 : 0 };
  }
  if (st.wing >= 0 && st.lobby < 0) {
    const t = (f - st.wing) / FPS;
    const [g1x, g1z] = GHOST_AT[0], [g2x, g2z] = GHOST_AT[1];
    if (st.ghost1 < 0) return { x: g1x - 0.15 * Math.sin(t * 0.4), z: g1z - 0.45, seen: false, yaw: 0, loud: smooth((t - 1.5) / 4) * 0.45 };
    const g = (f - st.ghost1) / FPS;
    if (g < 1.15) return { x: g1x - 0.05, z: g1z - 0.4, seen: true, yaw: -2.0, loud: 0.55 };
    if (st.ghost2 < 0) return { x: g1x - (g - 1.15) * 2.2, z: g1z - 0.4, seen: false, yaw: 0, loud: 0.6 };
    const g2 = (f - st.ghost2) / FPS;
    // it comes round behind the player's side, never nearer than four metres, unseen
    const tx = clamp(p.x - 4.5, 33, 44), tz = clamp(p.z - 4.2, -8, 4);
    const k = smooth(g2 / 3.5);
    return { x: g2x + (tx - g2x) * k, z: g2z + (tz - g2z) * k, seen: false, yaw: 0, loud: 0.65 + 0.3 * k };
  }
  if (st.lobby >= 0) { const t = (f - st.lobby) / FPS; return { x: 44, z: -1.3, seen: false, yaw: 0, loud: Math.max(0, 0.6 - t * 0.35) }; }
  // the notice: while the player reads, it comes up the corridor from the dark west end, and stands there, lit only by
  // the spasms of the dead tube; when the floor wakes it is there in the first strike, and then it isn't
  if (st.notice >= 0 && st.badge < 0 && roomAt(p.x, p.z)?.id === "cor") {
    const stand = { x: 8.1, z: -1.15 };
    if (s.sleep > 0.25) {
      const k = smooth((s.sleep - 0.25) / 0.65);
      return { x: 1.5 + (stand.x - 1.5) * k, z: stand.z, seen: s.sleep > 0.55, yaw: -Math.PI / 2, loud: 0.3 + 0.55 * k };
    }
    if (s.wake > st.notice && f - s.wake < 13) return { ...stand, seen: true, yaw: -Math.PI / 2, loud: 0.9 };
    if (s.wake > st.notice) return { ...none, loud: Math.max(0, 0.6 - (f - s.wake) / 40) };
  }
  // before the wing: it only comes while the floor sleeps, from the dark end of the corridor
  if (s.sleep > 0.25) {
    const k = smooth((s.sleep - 0.25) / 0.75);
    const from: [number, number] = roomAt(p.x, p.z)?.id === "bay" ? [10.5, -1.2] : [p.x - 14, -1.3];
    return { x: from[0] + (p.x - from[0]) * 0.55 * k, z: from[1] + (p.z - from[1]) * 0.55 * k, seen: false, yaw: 0, loud: 0.75 * k };
  }
  return none;
}

const EDGE = INTERACTS.find((i) => i.id === "copy-edge")!;
// ---- the step -------------------------------------------------------------------------------------------------------
export function step(s: Game, input: Input): Game {
  const f = s.f + 1;
  const ev: string[] = [];
  const st: Story = { ...s.st };
  const lock = locked(s);
  // a paper up on screen holds the view still; the button closes it
  const reading = s.st.read !== null;
  const inp = lock ? NO_INPUT : reading ? { keys: [], dx: 0, dy: 0, down: input.down } : input;
  const held = (k: string) => inp.keys.includes(k);
  const p0 = s.p;

  // --- look (a drag on the copy room's edge takes the mouse's sideways travel instead)
  let yaw = p0.yaw, pitch = p0.pitch;
  const dragging = st.drag && inp.down;
  const lookK = dragging ? 0.12 : 1;
  yaw -= inp.dx * SENS * lookK;
  pitch = clamp(pitch - inp.dy * SENS * (dragging ? 0.3 : 1), -1.35, 1.35);

  // --- move
  const fw = (held("w") || held("ArrowUp") ? 1 : 0) - (held("s") || held("ArrowDown") ? 1 : 0);
  const sd = (held("d") ? 1 : 0) - (held("a") ? 1 : 0);
  const sprint = held("Shift") && fw > 0 && !dragging;
  const max = (sprint ? SPRINT : WALK) * (fw < 0 ? BACK : 1) * (dragging ? 0.35 : 1);
  const n = Math.hypot(fw, sd) || 1;
  const wx = (-Math.sin(yaw) * fw + Math.cos(yaw) * sd) / n * max, wz = (-Math.cos(yaw) * fw - Math.sin(yaw) * sd) / n * max;
  const moving = fw !== 0 || sd !== 0;
  const k = 1 - Math.exp(-(moving ? 8.5 : 10.5) * DT);
  let vx = p0.vx + (wx - p0.vx) * k, vz = p0.vz + (wz - p0.vz) * k;
  if (!moving && Math.hypot(vx, vz) < 0.02) { vx = 0; vz = 0; }
  const solids = [...STATIC_SOLIDS, ...dynamicSolids(s)];
  const [x, z] = collide(p0.x + vx * DT, p0.z + vz * DT, solids);
  // what the walls took, the velocity loses
  vx = (x - p0.x) / DT; vz = (z - p0.z) / DT;
  const speed = Math.hypot(vx, vz);
  const strideLen = 0.74 + 0.3 * clamp((speed - WALK) / (SPRINT - WALK), 0, 1);
  const stride = p0.stride + (speed * DT) / strideLen;
  if (Math.floor(stride) > Math.floor(p0.stride) && speed > 0.4) ev.push(`step:${roomAt(x, z)?.floor ?? "carpet"}:${speed > 2.2 ? "run" : "walk"}`);
  const bob = p0.bob + (clamp(speed / WALK, 0, 1.9) - p0.bob) * 0.12;
  const lean = p0.lean + (clamp(sd * (speed / WALK), -1, 1) * 0.011 - p0.lean) * 0.1;
  const p: Player = { x, z, yaw, pitch, vx, vz, stride, bob, lean };

  // --- idle: the floor sleeps when nobody moves
  let idle = speed > 0.3 ? 0 : s.idle + 1;
  let sleep = s.sleep, wake = s.wake, wakeFrom = s.wakeFrom;
  const canSleep = f > sec(4) && st.behind < 0;
  if (idle > IDLE_F && canSleep) sleep = Math.min(1, sleep + SLEEP_RAMP);
  else if (sleep > 0) { wake = f; wakeFrom = sleep; sleep = 0; ev.push("wake"); }
  if (sleep > s.sleep) for (const fx of FIXTURES) {
    if (fx.kind === "dead" || fx.kind === "sensor") continue;
    const at = sleepAt(s, fx);
    if (s.sleep < at && sleep >= at) ev.push(`out:${fx.id}`);
  }
  if (!canSleep) idle = 0;

  // --- sensors: the wing's lights, for things that move
  const on = s.on.slice(), off = s.off.slice();
  if (st.behind < 0) for (const fx of FIXTURES) {
    if (fx.kind !== "sensor") continue;
    const near = Math.hypot(fx.x - x, fx.z - z) < 3.3 && (roomAt(x, z)?.id === "wing");
    const isOn = on[fx.id] >= 0 && off[fx.id] < on[fx.id];
    const under = (k: number) => fx.x === GHOST_AT[k][0] && fx.z === GHOST_AT[k][1];
    const ghost = (under(0) && st.ghost1 >= 0 && f - st.ghost1 < sec(1.15))
      || (under(1) && st.ghost2 >= 0 && f - st.ghost2 < sec(0.9))
      || (under(2) && st.ghost3 >= 0 && f - st.ghost3 < sec(1.6));
    const want = (near && speed > 0.25) || ghost;
    if (!isOn && want) { on[fx.id] = f; ev.push(`strike:${fx.id}`); }
    // a sensor holds 1.3 s after the last movement under it
    else if (isOn && !ghost && !(near && (speed > 0.25 || f - on[fx.id] < sec(1.3)))) { if (!near || idle > sec(1.3)) { off[fx.id] = f; ev.push(`unstrike:${fx.id}`); } }
  }

  // --- the hand
  const s1: Game = { ...s, f, p, st, on, off, idle, sleep, wake, wakeFrom, ev };
  const h0 = s.hand;
  const over = lock ? null : hoverOf(s1);
  const pressed = inp.down && !s.down, released = !inp.down && s.down;
  let hand: Hand = { ...h0 };
  hand.swx += (-inp.dx * SENS * lookK - hand.swx) * 0.16;
  hand.swy += (-inp.dy * SENS - hand.swy) * 0.16;
  let clicked = s.clicked;
  if (pressed) { ev.push("click"); if (clicked < 0) clicked = f; }
  if (released) ev.push("unclick");

  // a press on a thing: the hand pokes it, and the thing answers on contact (5 frames in)
  // closing a paper: a press once it has been up a moment
  if (reading && pressed && f - s.st.readF > 30) { st.read = null; ev.push("read:close"); }
  if (pressed && !reading && over && over.kind === "press" && hand.press < 0) { hand.press = f; hand.pressOn = over.id; }
  if (pressed && !reading && over && over.id === "badge" && st.badge < 0) { st.badge = f; ev.push("grab:badge"); }
  if (pressed && !reading && over && over.id === "printout" && st.printout < 0) { st.printout = f; st.read = "printout"; st.readF = f + 16; ev.push("grab:printout"); }
  if (pressed && !reading && over && over.kind === "resize") { st.drag = true; ev.push("resize:start"); }
  if (st.drag) {
    const e = eyeOf(s1), at = interactAt(s1, EDGE);
    const far = Math.hypot(at[0] - e.pos[0], at[2] - e.pos[2]) > 1.55;
    if (!inp.down || far || st.copyW >= COPY_MAX - 0.005) { st.drag = false; st.dragV = 0; ev.push("resize:end"); }
    else {
      const w = clamp(st.copyW + inp.dx * SENS * (0.00115 / 0.0011), COPY_MIN, COPY_MAX);
      st.dragV = st.dragV + ((w - st.copyW) / DT - st.dragV) * 0.25;
      st.copyW = w;
    }
  }
  if (released && st.badge >= 0 && st.pocket < 0 && f - st.badge > 12) { st.pocket = f; ev.push("pocket"); }
  if (hand.press >= 0 && f - hand.press === 5) {
    const id = hand.pressOn;
    ev.push(`press:${id}`);
    if (id === "phone1" && st.vm1 < 0) st.vm1 = f + 18;
    if (id === "recorder" && st.tape2 < 0) st.tape2 = f + 40;
    if (id === "reader" && st.swipe < 0) st.swipe = f;
    if (id === "locked") st.tried = f;
    if (id === "notice" && st.notice < 0) { st.notice = f; st.read = "notice"; st.readF = f; ev.push("read:notice"); }
  }
  if (hand.press >= 0 && f - hand.press > 22) { hand.press = -1; hand.pressOn = null; }

  const holding = st.badge >= 0 && st.pocket < 0;
  const swiping = st.swipe >= 0 && f - st.swipe < 50;
  const verifying = st.swipe >= 0 && f - st.swipe >= 50 && f - st.swipe < 128;
  const target = st.drag ? EDGE : hand.pressOn ? INTERACTS.find((i) => i.id === hand.pressOn)! : over;
  const mode: HandMode = lock || verifying ? "busy" : st.drag ? "resize" : holding || swiping || st.read === "printout" ? "grab" : over ? (over.kind === "resize" ? "resize" : over.kind === "grab" ? "link" : "link") : "arrow";
  if (mode !== h0.mode) { hand.mode = mode; hand.modeF = f; }
  hand.hover = over?.id ?? null;
  if (target) hand.to = interactAt(s1, target);
  const want = target && !holding ? 1 : 0;
  hand.reach += (want - hand.reach) * (want ? 0.2 : 0.14);
  if (holding) hand.reach += (0 - hand.reach) * 0.1;

  // how far out the hand can rest without entering anything
  const e = eyeOf(s1), d = forward(e.yaw, e.pitch), r = rightOf(e.yaw);
  let outWant = 0.42;
  for (const o of [0.42, 0.38, 0.34, 0.3, 0.26, 0.22]) {
    outWant = o;
    const c: V3 = [e.pos[0] + d[0] * o + r[0] * 0.17, e.pos[1] + d[1] * o - 0.14, e.pos[2] + d[2] * o + r[2] * 0.17];
    if (!sphereHits(c, 0.105, solids)) break;
  }
  hand.out += (outWant - hand.out) * (outWant < hand.out ? 0.5 : 0.08);

  // --- the story's triggers
  // the phone rings as the player first steps away from the desk (or, left standing there, before long anyway)
  if (st.ring1 < 0 && ((s.moved >= 0 && f - s.moved > sec(1.6)) || f >= RING1_F)) { st.ring1 = f; ev.push("ring1"); }
  if (st.badge >= 0 && st.tape2 >= 0 && st.copier < 0 && f - st.tape2 > sec(LINES.tape2.seconds + 1.6)) { st.copier = f; ev.push("copier"); }
  if (st.copier >= 0 && st.printed < 0 && f - st.copier > sec(4.6)) { st.printed = f; ev.push("printed"); }
  // out of the copy room with the page: knocking, from inside the closed office across the corridor
  if (st.knock < 0 && st.printout >= 0 && st.read === null && x > 20.5 && x < 23 && z > -2.4) { st.knock = f; ev.push("knock"); }
  const rm = roomAt(x, z)?.id as RoomId | undefined;
  if (st.wing < 0 && x > 30.9 && st.badge >= 0) { st.wing = f; ev.push("wing"); }
  if (st.wing >= 0 && st.lobby < 0) {
    if (st.ghost1 < 0 && x > 35.2 && f - st.wing > sec(5)) { st.ghost1 = f; ev.push("ghost1"); }
    if (st.ghost1 >= 0 && st.ghost2 < 0 && f - st.ghost1 > sec(3.3)) { st.ghost2 = f; ev.push("ghost2"); }
    if (st.ghost2 >= 0 && st.ghost3 < 0 && f - st.ghost2 > sec(2.6)) { st.ghost3 = f; ev.push("ghost3"); }
  }
  if (st.lobby < 0 && st.wing >= 0 && x > 48.5) { st.lobby = f; ev.push("lobby"); }
  if (st.swipe >= 0 && st.ring2 < 0 && f - st.swipe > sec(2.3)) { st.ring2 = f; ev.push("ring2"); }
  if (st.ring2 >= 0 && st.vm3 < 0 && f - st.ring2 > sec(5.6)) { st.vm3 = f; ev.push("vm3"); }
  if (st.vm3 >= 0 && st.behind < 0 && f - st.vm3 > sec(LINES.vm3.seconds + 2.6)) { st.behind = f; ev.push("behind"); }
  void rm;

  // --- the prompt: what the hand is over or nearly on; a door that won't open says so for a beat after each try
  const near = lock ? null : over ?? hoverOf(s1, true);
  let ask = "";
  if (st.tried >= 0 && f - st.tried < sec(1.3)) ask = "locked|LMB|Locked";
  else if (!st.read && !st.drag && hand.press < 0 && near && PROMPT[near.id]) {
    const [k, l] = PROMPT[near.id]!;
    ask = `${near.id}|${k}|${near.id === "locked" && st.tried >= 0 ? "Locked" : l}`;
  }
  let prompt = s.prompt;
  if (ask !== prompt.key && (!prompt.key || f - prompt.since >= promptMin(prompt.key))) prompt = { key: ask, since: f };

  return {
    f, p, down: inp.down, hand, idle, sleep, wake, wakeFrom, on, off, prompt,
    moved: s.moved < 0 && speed > 0.8 ? f : s.moved, looked: s.looked < 0 && Math.abs(yaw - START.yaw) > 0.5 ? f : s.looked,
    clicked, sprinted: s.sprinted < 0 && sprint && speed > 2.2 ? f : s.sprinted, st, ev,
  };
}

export function sphereHits(c: V3, r: number, solids: Solid[]): boolean {
  for (const b of solids) {
    const dx = c[0] - clamp(c[0], b.x0, b.x1), dy = c[1] - clamp(c[1], b.y0, b.y1), dz = c[2] - clamp(c[2], b.z0, b.z1);
    if (dx * dx + dy * dy + dz * dz < r * r) return true;
  }
  return false;
}

/** fold a whole run: every frame's state, 0 to inputs.length */
export function run(inputs: Input[]): Game[] {
  const out: Game[] = [INITIAL];
  let s = INITIAL;
  for (const i of inputs) { s = step(s, i); out.push(s); }
  return out;
}
