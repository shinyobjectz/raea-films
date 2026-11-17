// The mixer's ground: the session folded frame by frame, exactly as the picture folds it (where the player's head is,
// what the game is doing, every light's level, where "it" stands), and the engine that puts a sound in that space:
// binaural panning from the head, occlusion through the walls, and a send to the reverb of the room the sound is in.
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import run from "../game/run.gen.json";
import { SESSION0, sessionStep, type Session } from "../game/session";
import { menuView } from "../game/menu";
import { COPY_MAX, FPS, INITIAL, eyeOf, forward, itOf, lightOf, rightOf, type Game, type Input, type It } from "../game/step";
import { COPY_OPEN, DOOR_H, FIXTURES, roomAt, wallSolids, type RoomId, type Solid, type V3 } from "../game/level";
import { Biquad, Panner, SR, clamp, noise, place, readStereo, rng, writeWav } from "./dsp";

export const SPF = SR / FPS; // 800 samples a frame
const REC = run as { frames: number; bits: string[]; menu: number; inputs: number[][] };
/** frames in the film, and samples */
export const K = REC.frames;
export const N = K * SPF;
export const sec = (s: number) => Math.round(s * FPS);

export interface Frame {
  k: number; menu: boolean;
  pos: V3; yaw: number; pitch: number; room: RoomId;
  /** the game's state (on the title screen, the corridor's as the menu shows it) */
  g: Game; s: Session;
  ev: string[];
  it: It;
}

// ---- the fold -----------------------------------------------------------------------------------------------------------
const inputs: Input[] = REC.inputs.map((r) => ({ keys: REC.bits.filter((_, i) => r[0] & (1 << i)), dx: r[1], dy: r[2], down: !!r[3] }));
const NONE: It = { x: -5, z: -1.3, seen: false, yaw: 0, loud: 0 };
export const F: Frame[] = [];
{
  let s = SESSION0;
  for (let k = 0; k < K; k++) {
    // the film's frame k shows the session after k inputs (useGameState: step for each earlier frame)
    if (k > 0) s = sessionStep(s, inputs[k - 1]);
    const menu = s.at < 0;
    const g: Game = menu ? { ...INITIAL, f: 3000 + s.m.f } : s.g;
    let pos: V3, yaw: number, pitch: number;
    if (menu) { const v = menuView(s.m.f); pos = v.pos; yaw = v.yaw; pitch = v.pitch; }
    else { const e = eyeOf(g); pos = e.pos; yaw = e.yaw; pitch = e.pitch; }
    F.push({ k, menu, pos, yaw, pitch, room: roomAt(pos[0], pos[2])?.id ?? "cor", g, s, ev: menu ? s.m.ev : g.f > 0 ? g.ev : [], it: menu ? NONE : itOf(g) });
  }
}
/** the film frame the game's frame 0 is on */
export const AT = F.find((f) => !f.menu)!.k;
for (const f of F) if (!f.menu && f.g.f !== f.k - AT) throw new Error(`frame ${f.k}: game frame ${f.g.f}, expected ${f.k - AT}`);
/** a story frame (the game's) as a film frame; -1 stays -1 */
export const fk = (gf: number) => (gf < 0 ? -1 : AT + gf);
export const last = F[K - 1].g;

/** every fixture's light on every frame */
export const LIGHT: Float32Array[] = FIXTURES.map((fx) => { const a = new Float32Array(K); for (let k = 0; k < K; k++) a[k] = lightOf(F[k].g, fx); return a; });

// ---- the head ---------------------------------------------------------------------------------------------------------
/** a world point seen from the listener's head on frame k: x right, y up, z ahead */
export function toHead(fr: Frame, p: V3): V3 {
  const v = [p[0] - fr.pos[0], p[1] - fr.pos[1], p[2] - fr.pos[2]];
  const f = forward(fr.yaw, fr.pitch), r = rightOf(fr.yaw);
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return [v[0] * r[0] + v[1] * r[1] + v[2] * r[2], v[0] * u[0] + v[1] * u[1] + v[2] * u[2], v[0] * f[0] + v[1] * f[1] + v[2] * f[2]];
}

// ---- walls between ------------------------------------------------------------------------------------------------------
const WALL_BOXES: Solid[] = [...wallSolids(), { x0: 53.95, x1: 54.2, z0: -1.8, z1: -0.8, y0: 0, y1: DOOR_H, name: "stair-door-leaf" }];
const inside = (p: V3, s: Solid) => p[0] > s.x0 && p[0] < s.x1 && p[1] > s.y0 && p[1] < s.y1 && p[2] > s.z0 && p[2] < s.z1;
function segHits(a: V3, b: V3, s: Solid): boolean {
  if (inside(a, s) || inside(b, s)) return false;
  let t0 = 0, t1 = 1;
  const lo = [s.x0, s.y0, s.z0], hi = [s.x1, s.y1, s.z1];
  for (let ax = 0; ax < 3; ax++) {
    const d = b[ax] - a[ax];
    if (Math.abs(d) < 1e-9) { if (a[ax] < lo[ax] || a[ax] > hi[ax]) return false; continue; }
    let ta = (lo[ax] - a[ax]) / d, tb = (hi[ax] - a[ax]) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
}
/** how blocked the way is from the head to p on frame k: 0 clear, 0.7 a wall, 1 two or more */
export function occlusion(fr: Frame, p: V3): number {
  const w = fr.g.st.copyW;
  const boxes = w < COPY_MAX - 0.01 ? [...WALL_BOXES, { x0: COPY_OPEN.a + w, x1: COPY_OPEN.b, z0: -2.6, z1: -2.4, y0: 0, y1: 2.1, name: "copy-fill" }] : WALL_BOXES;
  let n = 0;
  for (const s of boxes) if (segHits(fr.pos, p, s)) n++;
  return Math.min(1, 0.7 * n);
}

// ---- the buses ----------------------------------------------------------------------------------------------------------
export const ROOM_IDS: RoomId[] = ["bay", "cor", "copy", "wing", "lobby"];
/** the placed sounds, dry */
export const OUT: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
/** the spoken lines, dry (kept apart to measure them and to duck under them) */
export const VOICE: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
/** the rooms' reverb, returned */
export const WETBUS: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
/** each room's reverb send (mono) */
export const SEND = Object.fromEntries(ROOM_IDS.map((r) => [r, new Float32Array(N)])) as Record<RoomId, Float32Array>;
/** how much of a room's sound comes back as its reverb */
export const WET: Record<RoomId, number> = { bay: 0.2, cor: 0.26, copy: 0.2, wing: 0.46, lobby: 0.26 };

export interface Emit {
  /** film frames: from k0 up to (not including) k1 */
  k0: number; k1: number;
  /** the sound's mono samples for frame k (the block is zeroed first) */
  fill: (k: number, out: Float32Array) => void;
  /** called instead of fill on a frame skipped as silent, so a running oscillator can keep its phase */
  idle?: (k: number) => void;
  /** where it is in the world on frame k, or `head` (fixed to the head: x right, y up, z ahead) */
  pos?: (k: number) => V3;
  head?: V3;
  gain?: (k: number) => number;
  /** a fixed occlusion (a sound on a door, heard through it) instead of the walls' */
  occl?: number;
  /** reverb send, times the room's (default 1; 0 for none) */
  send?: number;
  /** a room's reverb to send to, instead of the room it's in */
  room?: RoomId;
  /** the dry bus it goes to (default OUT) */
  into?: [Float32Array, Float32Array];
}
/** frames of placed sounds that sit in no room (so send to the listener's), by rounded position */
export const OUTSIDE: Record<string, number> = {};
/** place a sound: panned binaurally from the head each frame, through the walls, into its room's reverb */
export function emit(e: Emit) {
  const pan = new Panner(), blk = new Float32Array(SPF);
  let o = -1, lastG = 0, lastS = 0;
  const end = Math.min(K, e.k1 + 3);
  for (let k = Math.max(0, e.k0); k < end; k++) {
    const tail = k >= e.k1;
    const g = tail ? 0 : e.gain ? e.gain(k) : 1;
    if (g < 1e-6 && lastG < 1e-6) { if (!tail) e.idle?.(k); lastG = g; lastS = 0; continue; }
    blk.fill(0);
    if (!tail) e.fill(k, blk);
    const fr = F[k];
    let rel: V3, d: number, room: RoomId = e.room ?? fr.room;
    if (e.pos) {
      const p = e.pos(k);
      rel = toHead(fr, p);
      const want = e.occl ?? occlusion(fr, p);
      o = o < 0 ? want : o + (want - o) * 0.3;
      if (!e.room) { const r = roomAt(p[0], p[2])?.id; if (!r) { const key = p.map((v) => v.toFixed(0)).join(","); OUTSIDE[key] = (OUTSIDE[key] ?? 0) + 1; } room = r ?? fr.room; }
    } else { rel = e.head ?? [0, 0, 0.3]; o = 0; }
    d = Math.hypot(rel[0], rel[1], rel[2]);
    const bus = e.into ?? OUT;
    pan.run(blk, place(rel, o, g), bus[0], bus[1], k * SPF);
    const sg = e.send === 0 ? 0 : g * (e.send ?? 1) * WET[room] * (0.45 + 0.55 / Math.max(1, d)) * (1 - 0.4 * o);
    if (sg > 0 || lastS > 0) {
      const bus = SEND[room], at = k * SPF;
      for (let i = 0; i < SPF; i++) bus[at + i] += blk[i] * (lastS + (sg - lastS) * (i / SPF));
    }
    lastG = g; lastS = sg;
  }
}
/** a recorded sound placed once, starting at film time t (seconds) */
/** every placed one-shot's span (seconds), to trace what's heard where */
export const SPANS: [number, number][] = [];
export function shot(buf: Float32Array, t: number, where: { pos?: V3 | ((k: number) => V3); head?: V3; gain?: number; occl?: number; send?: number; room?: RoomId; into?: [Float32Array, Float32Array] }) {
  const s0 = Math.round(t * SR);
  if (s0 >= N || s0 + buf.length < 0) return;
  // a sound that doesn't start or end at rest gets a short fade there, so no edge ever clicks
  if (Math.abs(buf[0]) > 1e-4 || Math.abs(buf[buf.length - 1]) > 1e-4) {
    buf = buf.slice();
    const a = Math.min(96, buf.length >> 2), b = Math.min(480, buf.length >> 2);
    for (let i = 0; i < a; i++) buf[i] *= i / a;
    for (let i = 0; i < b; i++) buf[buf.length - 1 - i] *= i / b;
  }
  const k0 = Math.floor(s0 / SPF), k1 = Math.ceil((s0 + buf.length) / SPF);
  if (!where.into || where.into === OUT || where.into === VOICE) SPANS.push([t, t + buf.length / SR]);
  const p = where.pos;
  emit({
    k0, k1,
    fill: (k, out) => { const a = k * SPF - s0; for (let i = 0; i < SPF; i++) { const j = a + i; if (j >= 0 && j < buf.length) out[i] = buf[j]; } },
    pos: p === undefined ? undefined : typeof p === "function" ? p : () => p,
    head: where.head, gain: () => where.gain ?? 1, occl: where.occl, send: where.send, room: where.room, into: where.into,
  });
}
export const tOf = (k: number) => k / FPS;

// ---- reverb -------------------------------------------------------------------------------------------------------------
/** a room's impulse response (stereo): early reflections off the near walls, then a diffuse tail whose top dies first */
export function roomIR(rt: number, preMs: number, seed: number): [Float32Array, Float32Array] {
  const n = Math.round((rt * 1.25 + preMs / 1000) * SR), pre = Math.round((preMs / 1000) * SR);
  const out: Float32Array[] = [];
  for (let c = 0; c < 2; c++) {
    const r = rng(seed * 7 + c * 131);
    const w = noise(n, seed * 13 + c * 17);
    const lo = new Biquad().set("lp", 450, 0.707).run(w), hi = new Biquad().set("hp", 3200, 0.707).run(w);
    const mid = new Biquad().set("lp", 3200, 0.707).run(new Biquad().set("hp", 450, 0.707).run(w));
    const y = new Float32Array(n);
    const dl = 6.91 / (rt * 1.15), dm = 6.91 / rt, dh = 6.91 / (rt * 0.5);
    for (let i = pre; i < n; i++) {
      const t = (i - pre) / SR, att = Math.min(1, t / 0.012);
      y[i] = att * (lo[i] * Math.exp(-dl * t) + mid[i] * Math.exp(-dm * t) * 0.9 + hi[i] * Math.exp(-dh * t) * 0.6);
    }
    // the first reflections: a few clear taps off the nearest surfaces
    for (let j = 0; j < 9; j++) {
      const at = pre + Math.round((0.002 + r() * 0.045) * SR), a = (0.9 - j * 0.08) * (r() < 0.5 ? -1 : 1);
      if (at < n) y[at] += a * 2.2;
    }
    let e = 0; for (let i = 0; i < n; i++) e += y[i] * y[i];
    const g = 1 / Math.sqrt(e);
    for (let i = 0; i < n; i++) y[i] *= g;
    out.push(y);
  }
  return [out[0], out[1]];
}
export const ROOM_RT: Record<RoomId, [number, number]> = { bay: [0.55, 9], cor: [0.8, 6], copy: [0.42, 5], wing: [1.7, 22], lobby: [0.75, 8] };

/** convolve each room's send with its IR (ffmpeg's afir) and bring it back by where the listener is: full in the room
 * they're in, a little through the doors from the others */
export function reverbReturns(tmp: string) {
  mkdirSync(tmp, { recursive: true });
  const a = 1 - Math.exp(-1 / (0.35 * FPS));
  ROOM_IDS.forEach((room, ri) => {
    const send = SEND[room];
    let any = 0; for (let i = 0; i < N; i += 97) any = Math.max(any, Math.abs(send[i]));
    if (any < 1e-7) return;
    const [rt, pre] = ROOM_RT[room];
    const [il, ir] = roomIR(rt, pre, 3 + ri);
    writeWav(`${tmp}/send-${room}.wav`, send, send);
    writeWav(`${tmp}/ir-${room}.wav`, il, ir);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${tmp}/send-${room}.wav`, "-i", `${tmp}/ir-${room}.wav`, "-filter_complex", "[0:a][1:a]afir=dry=1:wet=1:irnorm=-1:irgain=1[o]", "-map", "[o]", "-c:a", "pcm_f32le", `${tmp}/wet-${room}.wav`]);
    const [wl0, wr0] = readStereo(`${tmp}/wet-${room}.wav`);
    // reverb returns high-passed, as a mix does, so rooms add space and not mud (the wing keeps more of its boom)
    const hpf = room === "wing" ? 90 : 150;
    const wl = new Biquad().set("hp", hpf, 0.707).run(wl0), wr = new Biquad().set("hp", hpf, 0.707).run(wr0);
    let env = F[0].room === room ? 1 : 0.3;
    for (let k = 0; k < K; k++) {
      const want = F[k].room === room ? 1 : 0.3;
      const e0 = env; env += (want - env) * a;
      for (let i = 0; i < SPF; i++) {
        const j = k * SPF + i; if (j >= wl.length) break;
        const g = e0 + (env - e0) * (i / SPF);
        WETBUS[0][j] += wl[j] * g; WETBUS[1][j] += wr[j] * g;
      }
    }
  });
}
export { clamp };
