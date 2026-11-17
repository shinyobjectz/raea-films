// FLOOR3's sound, made from the same session the picture plays: every footstep, light, phone, voice and breath is cued
// from what the game did on that frame and placed around the player's head (tools/mixcore.ts), and the score is the
// building's own: the ballasts' hum series as a slow chord that sags when the floor sleeps, the lights' strikes as
// notes, the phone's ring as the theme. Mastered to -14 LUFS with true peaks held under -1.5 dBTP.
//   bun tools/mix.ts        -> out/floor3-mix.wav (48 kHz stereo float), out/mix.report.json
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { FIXTURES, GHOST_AT, BADGE, KNOCK_DOOR, LOCKED_DOOR, MACHINE, NOTICE, PHONE1, RECORDER, READER, STAIR_DOOR, TRAY, COPY_OPEN, type RoomId, type V3 } from "../game/level";
import { FIN, FPS, forward, rightOf, eyeOf } from "../game/step";
import { LINES } from "../game/lines";
import { BOOT, MENU_FADE, SPLASH, TITLE_IN } from "../game/menu";
import { AT, F, K, LIGHT, N, OUT, OUTSIDE, SPANS, SPF, VOICE, WETBUS, emit, fk, last, reverbReturns, sec, shot, type Frame } from "./mixcore";
import { Biquad, SR, TAU, clamp, db, glue, limit, pink, rng, smooth, writeWav } from "./dsp";
import {
  beep, bell, compress, cut, gainOf, level, machineVoice, mixInto, mouseClick, phoneVoice, pitchDown, pop, ringer, scrape, sfx,
  speed, starter, steps, tapeVoice, thud, tick, voice,
} from "./mixsounds";

const ROOT = new URL("../", import.meta.url).pathname;
const TMP = `${ROOT}.cache/mix`;
const st = last.st;
const T = (k: number) => k / FPS;
/** a story frame's film time */
const ts = (gf: number) => fk(gf) / FPS;
const R = rng(2026);
const report: Record<string, unknown> = {};
const t0 = Date.now();
const log = (m: string) => console.log(`${((Date.now() - t0) / 1000).toFixed(1).padStart(6)} s  ${m}`);
log(`session folded: ${K} frames, game from frame ${AT}`);

// ---- when things are said ----------------------------------------------------------------------------------------------
const LINE_AT = { vm1: ts(st.vm1), tape2: ts(st.tape2), vm3: ts(st.vm3), behind: ts(st.behind), there: ts(st.behind + FIN.there) };
const cap = (id: "vm3", has: string) => LINES[id].captions.find((c) => c.text.toLowerCase().includes(has))!;
/** the score drops out as "they are not from me" begins */
const NOT_ME = LINE_AT.vm3 + cap("vm3", "not from me").t0;
const speaking = (t: number) => (["vm1", "tape2", "vm3"] as const).some((id) => t > LINE_AT[id] - 0.3 && t < LINE_AT[id] + LINES[id].seconds + 0.3);
const behindK = fk(st.behind);
const blackK = behindK + FIN.black;
report.lines = LINE_AT;

// ---- the player's body: footsteps, clothes, breath ----------------------------------------------------------------------
const POOLS: Record<string, Float32Array[]> = {
  "carpet:walk": steps(["steps-carpet-walk-1", "steps-carpet-walk-2"], 0.36, 0.3),
  "carpet:run": steps(["steps-carpet-run-1"], 0.26, 0.22),
  "lino:walk": steps(["steps-lino-walk-1", "steps-lino-walk-2"], 0.36, 0.3),
  "concrete:walk": steps(["steps-concrete-walk-1", "steps-concrete-walk-2"], 0.42, 0.3),
  "concrete:run": steps(["steps-concrete-run-1"], 0.3, 0.22),
};
POOLS["lino:run"] = POOLS["lino:walk"];
report.stepPools = Object.fromEntries(Object.entries(POOLS).map(([k, v]) => [k, v.length]));
const STEP_GAIN: Record<string, number> = { carpet: db(-21), lino: db(-17), concrete: db(-16) };
{
  let side = 1, lastIx = -1, stepsN = 0;
  for (const fr of F) for (const e of fr.ev) {
    if (!e.startsWith("step:")) continue;
    const [, surf, gait] = e.split(":");
    const pool = POOLS[`${surf}:${gait}`] ?? POOLS["carpet:walk"];
    let ix = Math.floor(R() * pool.length); if (ix === lastIx) ix = (ix + 1) % pool.length; lastIx = ix;
    const p = fr.g.p, r = rightOf(p.yaw);
    side = -side;
    const at: V3 = [p.x + r[0] * 0.11 * side, 0.03, p.z + r[2] * 0.11 * side];
    const g = STEP_GAIN[surf] * (gait === "run" ? db(3) : 1) * db((R() - 0.5) * 3);
    shot(speed(pool[ix], 1 + (R() - 0.5) * 0.06), T(fr.k), { pos: at, gain: g });
    stepsN++;
  }
  report.steps = stepsN;
}
// clothes: setting off after standing a while, and the badge going into a pocket
{
  const cloth = sfx("clothing-1");
  let still = 0;
  for (const fr of F) {
    if (fr.menu) continue;
    const v = Math.hypot(fr.g.p.vx, fr.g.p.vz);
    if (v > 0.5 && still > sec(1.2)) shot(cut(cloth, 0.12 + R() * 0.6, 0.55, 0.03, 0.25), T(fr.k), { head: [0.12, -0.55, 0.05], gain: db(-30) });
    still = v < 0.2 ? still + 1 : 0;
    if (fr.ev.includes("pocket")) shot(cut(cloth, 0.1, 0.8, 0.01, 0.3), T(fr.k), { head: [0.2, -0.6, 0.05], gain: db(-24) });
  }
}
// breath: frightened after the thing at the notice, ragged after the sprint, held at the end
{
  const fear = sfx("breath-human-1"), pant = sfx("breath-run-1");
  const wakeSeen = F.find((fr) => !fr.menu && fr.g.st.notice >= 0 && fr.it.seen && fr.g.sleep === 0);
  if (wakeSeen) shot(cut(fear, 0, 5, 0.3, 1.5), T(wakeSeen.k) + 0.5, { head: [0, -0.1, 0.08], gain: db(-27), send: 0.3 });
  const lobbyK = fk(st.lobby);
  if (st.lobby >= 0) shot(cut(pant, 0, 5, 0.05, 2.0), T(lobbyK) - 0.4, { head: [0, -0.1, 0.08], gain: db(-26), send: 0.3 });
  if (st.lobby >= 0) shot(cut(fear, 1.4, 3.6, 0.6, 1.5), T(lobbyK) + 4.2, { head: [0, -0.1, 0.08], gain: db(-30), send: 0.3 });
  shot(cut(fear, 2.4, 2.6, 0.2, 1.2), NOT_ME + 2.2, { head: [0, -0.1, 0.08], gain: db(-31), send: 0.3 });
}
log("body cued");

// ---- the lights -----------------------------------------------------------------------------------------------------------
const FX_Y = 2.62;
const fxPos = (id: number): V3 => [FIXTURES[id].x, FX_Y, FIXTURES[id].z];
const sleepS = new Float32Array(K);
{ let v = 0; for (let k = 0; k < K; k++) { v += (F[k].g.sleep - v) * 0.05; sleepS[k] = v; } }
/** the building's voice bends down as it falls asleep (the ballasts sag) */
const SAG = (k: number) => 1 - 0.055 * smooth(sleepS[k] / 0.6);
// each lit fixture's hum: the ballast's 120 Hz and its overtones, a buzz on the peaks, as bright as the tube
for (const fx of FIXTURES) {
  if (fx.kind === "dead") continue;
  const det = 1 + (((fx.id * 7919) % 101) / 100 - 0.5) * 0.004, L = LIGHT[fx.id], pos = fxPos(fx.id);
  let ph = 0;
  const w = rngNoise(fx.id + 900);
  const bp = new Biquad().set("bp", 3100, 1.4);
  const dist = (k: number) => Math.hypot(F[k].pos[0] - pos[0], F[k].pos[2] - pos[2]);
  emit({
    k0: 0, k1: K, pos: () => pos,
    gain: (k) => Math.pow(clamp(L[k], 0, 1.6), 0.8) * db(-38) * smooth((15 - dist(k)) / 4), send: 0.35,
    idle: (k) => { ph = (ph + TAU * 120 * det * SAG(k) * SPF / SR) % TAU; },
    fill: (k, out) => {
      const f0 = 120 * det * SAG(k), dp = TAU * f0 / SR;
      for (let i = 0; i < SPF; i++) {
        ph += dp; if (ph > TAU) ph -= TAU;
        const s = Math.sin(ph), s2 = s * s, s4 = s2 * s2, pulse = s4 * s4 * s4 * s2;
        out[i] = 0.34 * s + 0.36 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph) + 0.2 * Math.sin(4 * ph) + 0.15 * Math.sin(5 * ph) + 0.08 * Math.sin(7 * ph) + 0.05 * Math.sin(9 * ph) + bp.tick(w()) * pulse * 1.4;
      }
    },
  });
}
/** a 2 ms fade in and a 10 ms fade out, so no edge clicks */
function fadeEdges(x: Float32Array) { const a = Math.min(96, x.length >> 2), b = Math.min(480, x.length >> 2); for (let i = 0; i < a; i++) x[i] *= i / a; for (let i = 0; i < b; i++) x[x.length - 1 - i] *= i / b; }
function rngNoise(seed: number) { const r = rng(seed); return () => r() * 2 - 1; }
// strikes, stutters and blow-outs, from each fixture's light: a starter click on every jump, a pop when one dies
const PING_F = [540, 660, 720, 810, 900, 990, 1080];
let pings = 0;
const pingKinds: Record<string, number> = {};
const wingAxis = FIXTURES.filter((f) => f.room === "wing" && Math.abs(f.z + 1.3) < 0.01).map((f) => f.id);
for (const fx of FIXTURES) {
  if (fx.kind === "dead") continue;
  const L = LIGHT[fx.id], pos = fxPos(fx.id);
  let lastStrike = -999;
  for (let k = 1; k < K; k++) {
    const v = L[k], v0 = L[k - 1], fr = F[k];
    if (fr.menu) continue;
    // the lights move smoothly (step.ts: a jump leaves the denoiser's arcs on the walls), so a strike, a dip or a
    // blow-out is heard where its change begins: a ramp up starting, or a four-frame swing of a quarter starting
    const back = (n: number) => L[Math.max(0, k - n)];
    const d4 = v - back(4), d4was = v0 - back(5);
    const onset = v - v0 > 1e-4 && Math.abs(v0 - back(2)) <= 0.005 && L[Math.min(K - 1, k + 30)] - v0 > 0.3;
    if (v0 >= 1.35 && v < v0 && back(2) <= v0) {
      // a tube blown in the finale
      shot(pop(fx.id + k), T(k), { pos, gain: db(-8) });
      shot(cut(sfx(`tube-off-${1 + (fx.id % 3)}`), 0, 0.3), T(k) + 0.01, { pos, gain: db(-12) });
      // felt in the body: the far ones faint, louder as the dying comes nearer (the lobby's, two metres off, hardest)
      const corLit = FIXTURES.filter((f) => f.room === "cor" && f.kind !== "dead"), ci = corLit.indexOf(fx);
      shot(thud(48, 0.9, fx.id), T(k), { head: [0, -0.3, 0.5], gain: db(ci >= 0 ? -32 + 2 * ci : -24), send: 0.2 });
      continue;
    }
    if (onset || (d4 > 0.25 && d4was <= 0.25)) {
      let lo = 9; for (let j = Math.max(0, k - 10); j < k; j++) lo = Math.min(lo, L[j]);
      const first = onset && lo < (fx.kind === "flicker" ? 0.06 : 0.12) && k - lastStrike > 40;
      shot(starter(fx.id * 31 + k, v), T(k), { pos, gain: db(fx.kind === "flicker" ? -27 : -24) });
      if (first) {
        lastStrike = k;
        shot(cut(sfx(`tube-strike-${1 + (fx.id % 3)}`), 0, 0.22, 0.002, 0.08), T(k), { pos, gain: db(-23) });
        // the tube's note: what it sings as it comes on (the player's lights in tune; its lights, in the wing, not)
        const ghost = fx.kind === "sensor" && GHOST_AT.some(([gx, gz]) => gx === fx.x && gz === fx.z) && [st.ghost1, st.ghost2, st.ghost3].some((g) => g >= 0 && Math.abs(fr.g.f - g) < 3);
        const finale = st.behind >= 0 && fr.g.f >= st.behind;
        if (finale && wingAxis.includes(fx.id)) {
          const n = wingAxis.indexOf(fx.id);
          shot(bell([1080, 900, 720, 600][n] ?? 600, 3.2, 3.01, 1.6), T(k), { pos, gain: db(-27), send: 3 });
          shot(bell(([1080, 900, 720, 600][n] ?? 600) * 1.06, 3.2), T(k), { pos, gain: db(-31), send: 3 });
        } else if (ghost) {
          shot(bell(565, 4, 2.76, 1.8), T(k), { pos, gain: db(-25), send: 3 });
          shot(bell(600, 4, 2.76, 1.8), T(k) + 0.02, { pos, gain: db(-27), send: 3 });
        } else if (!finale) {
          const col = fx.kind === "sensor" ? Math.round((fx.x - 32.4) / 4.8) : fx.id;
          const f = fx.kind === "sensor" ? [540, 720, 900, 1080][clamp(col, 0, 3)] : PING_F[fx.id % PING_F.length];
          shot(bell(f, 3.4), T(k) + 0.03, { pos, gain: db(fx.kind === "sensor" ? -31 : -34), send: 3 });
        }
        pings++; pingKinds[`${fx.kind}:${fx.room}`] = (pingKinds[`${fx.kind}:${fx.room}`] ?? 0) + 1;
      }
    } else if (-d4 > 0.25 && -d4was <= 0.25) shot(starter(fx.id * 17 + k, 0.4), T(k), { pos, gain: db(fx.kind === "flicker" ? -30 : -28) });
  }
}
for (const fr of F) for (const e of fr.ev) {
  if (e.startsWith("out:")) { const id = +e.slice(4); shot(cut(sfx(`tube-off-${1 + (id % 3)}`), 0, 0.3), T(fr.k), { pos: fxPos(id), gain: db(-24) }); }
  if (e.startsWith("unstrike:")) { const id = +e.slice(9); shot(cut(sfx(`tube-off-${1 + (id % 3)}`), 0, 0.25), T(fr.k), { pos: fxPos(id), gain: db(-30) }); }
  if (e === "wake") {
    // the floor's contactor, somewhere in the ceiling, pulling in
    const p = fr.g.p, fw = forward(p.yaw, 0);
    shot(cut(sfx("lock-clunk-1"), 0.1, 0.5), T(fr.k), { pos: [p.x + fw[0] * 3, 2.6, p.z + fw[2] * 3], gain: db(-22), send: 1.5 });
  }
}
report.pings = pings; report.pingKinds = pingKinds;
// the exit sign over the stair door: a thin buzz, until the end takes it
{
  const pos: V3 = [53.6, 2.3, -1.3], outK = behindK + FIN.exitOut;
  let ph = 0;
  emit({
    k0: AT, k1: st.behind >= 0 ? outK : K, pos: () => pos, gain: (k) => (Math.hypot(F[k].pos[0] - pos[0], F[k].pos[2] - pos[2]) < 12 ? db(-50) : 0),
    idle: () => { ph += TAU * 120 * SPF / SR; },
    fill: (_k, out) => { for (let i = 0; i < SPF; i++) { ph += TAU * 120 / SR; out[i] = Math.sin(ph) * 0.6 + Math.sin(ph * 20.1) * 0.25; } },
  });
  if (st.behind >= 0) shot(starter(5, 0.3), T(outK), { pos, gain: db(-26) });
}
log("lights cued");

// ---- the rooms: clocks, air, the building settling ----------------------------------------------------------------------
{
  const clocks: { pos: V3; stop: number }[] = [
    { pos: [6.0, 2.0, 0.08], stop: K }, { pos: [20.2, 2.05, -0.27], stop: K }, { pos: [51.0, 2.05, 1.62], stop: st.behind >= 0 ? blackK : K },
  ];
  const tk = tick(false), tc = tick(true);
  for (const c of clocks) {
    const track = new Float32Array(SPF * 3 + SR);
    void track;
    for (let s = 1; s < K / FPS; s++) {
      const k = Math.round(s * FPS);
      if (k >= c.stop || k < AT - sec(8)) continue;
      const d = Math.hypot(F[k].pos[0] - c.pos[0], F[k].pos[2] - c.pos[2]);
      if (d > 13) continue;
      shot(s % 2 ? tk : tc, s, { pos: c.pos, gain: db(-37), send: 0.6 });
    }
  }
}
// distant creaks: the building settling somewhere off in the dark, never over a word
{
  let t = AT / FPS + 14;
  let n = 0;
  while (t < T(behindK || K) - 4) {
    const k = Math.round(t * FPS);
    if (!speaking(t) && k < K) {
      const fr = F[k], a = R() * TAU, d = 9 + R() * 9;
      const pos: V3 = [clamp(fr.pos[0] + Math.cos(a) * d, -5, 53), 2.4, clamp(fr.pos[2] + Math.sin(a) * d, -8.5, 9.5)];
      const c = sfx(`building-creak-${1 + Math.floor(R() * 3)}`);
      shot(cut(c, R() * 1.5, 1.6 + R(), 0.15, 0.8), t, { pos, gain: db(-16), send: 2 });
      n++;
    }
    t += 15 + R() * 18;
  }
  report.creaks = n;
}
log("rooms cued");

// ---- phones, voices, machines ------------------------------------------------------------------------------------------
/** where the spoken lines sit (LUFS): the anchor the rest of the mix is set against */
const DIALOGUE = -17;
/** the rest against it: the world (placed sounds and their rooms), the air, the score */
const G_FX = db(7), G_BED = db(8.5), G_SCORE = db(9);
const SCR: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
/** loudness (LUFS, as BS.1770 measures it: K-weighted, 400 ms blocks, gated at -70 and 10 LU under) of a stretch */
function lufs(bus: [Float32Array, Float32Array], a: number, b: number): number {
  const kw = (x: Float32Array) => new Biquad().set("hp", 38, 0.5).run(new Biquad().set("hs", 1681, 0.707, 4).run(x.subarray(a, b)));
  const l = kw(bus[0]), r = kw(bus[1]), blk = Math.round(0.4 * SR), hop = Math.round(0.1 * SR), ms: number[] = [];
  for (let i = 0; i + blk <= l.length; i += hop) { let s2 = 0; for (let j = i; j < i + blk; j++) s2 += l[j] * l[j] + r[j] * r[j]; ms.push(s2 / blk); }
  const L = (m: number) => -0.691 + 10 * Math.log10(m + 1e-20);
  const abs = ms.filter((m) => L(m) > -70), rel = L(abs.reduce((x, y) => x + y, 0) / Math.max(1, abs.length)) - 10;
  const keep = abs.filter((m) => L(m) > rel);
  return L(keep.reduce((x, y) => x + y, 0) / Math.max(1, keep.length));
}
/** a line placed so that it reaches the listener at `targetDb` (RMS over its speech): placed once to measure, then for real */
function placeLine(id: string, buf: Float32Array, t: number, where: { pos?: V3; head?: V3; send?: number; room?: RoomId }, targetDb: number) {
  const a = Math.max(0, Math.round(t * SR) - SPF * 4), b = Math.min(N, Math.round(t * SR) + buf.length + SPF * 8);
  SCR[0].fill(0, a, b); SCR[1].fill(0, a, b);
  shot(buf, t, { ...where, gain: 1, send: 0, into: SCR });
  const was = lufs(SCR, a, b);
  shot(buf, t, { ...where, gain: db(targetDb - was), into: VOICE });
  (report.lineTrim ??= {} as Record<string, number>);
  (report.lineTrim as Record<string, number>)[id] = +(targetDb - was).toFixed(1);
}
/** dialogue dynamics before a speaker colours it: levelled, compressed 3:1, its consonant peaks held 12 dB over its
 * speech level by a look-ahead limiter (as broadcast dialogue is), levelled again */
const dlg = (x: Float32Array) => peaks(level(compress(level(x, -20), -4, 3), -20), -8);
function peaks(x: Float32Array, ceilDb: number): Float32Array { const y = x.slice(), z = x.slice(); limit(y, z, ceilDb, 0.003, 0.06); return level(y, -20); }
const evK = (name: string) => F.find((fr) => fr.ev.includes(name))?.k ?? -1;
const evAll = (name: string) => F.filter((fr) => fr.ev.includes(name)).map((fr) => fr.k);
{
  // the title screen: a phone ringing somewhere far down the corridor, in an office nobody is in
  const ringAt = T(BOOT) + 0.6;
  const menuRing = ringer(T(AT) - ringAt);
  shot(menuRing, ringAt, { pos: [27.5, 0.8, -4.2], gain: db(-5), send: 0.15 });
  // the phone on the next desk, from the first step away to the press
  const press1 = evK("press:phone1");
  if (st.ring1 >= 0 && press1 > 0) shot(ringer(T(press1) - ts(st.ring1)), ts(st.ring1), { pos: [PHONE1[0], PHONE1[1] + 0.05, PHONE1[2]], gain: db(-19) });
  if (press1 > 0) {
    shot(cut(sfx("phone-button-1"), 0, 0.3), T(press1), { pos: PHONE1, gain: db(-18) });
    shot(phoneVoice(beep(1000, 0.2)), T(press1) + 0.07, { pos: PHONE1, gain: db(-16) });
  }
  placeLine("vm1", peaks(phoneVoice(dlg(voice("vm1"))), -9), LINE_AT.vm1, { pos: [PHONE1[0], PHONE1[1] + 0.06, PHONE1[2]], send: 0.6 }, DIALOGUE);
  shot(cut(sfx("phone-button-2"), 0, 0.3), LINE_AT.vm1 + LINES.vm1.seconds + 0.35, { pos: PHONE1, gain: db(-22) });

  // the tape
  const pressT = evK("press:recorder");
  if (pressT > 0) {
    shot(cut(sfx("cassette-play-1"), 0, 0.5), T(pressT), { pos: RECORDER, gain: db(-15) });
    const pre = LINE_AT.tape2 - T(pressT) - 0.15;
    placeLine("tape2", peaks(tapeVoice(dlg(voice("tape2")), pre, 0.6), -9), LINE_AT.tape2 - pre, { pos: [RECORDER[0], RECORDER[1] + 0.04, RECORDER[2]], send: 0.6 }, DIALOGUE);
    shot(cut(sfx("cassette-stop-1"), 0, 0.5), LINE_AT.tape2 + LINES.tape2.seconds + 0.6, { pos: RECORDER, gain: db(-16) });
  }

  // the lobby phone, the machine picking up, the call, the line going dead
  const pick = LINE_AT.vm3 - 0.55;
  const phone2: V3 = [51.9, 0.83, -3.5];
  if (st.ring2 >= 0) shot(ringer(pick - ts(st.ring2)), ts(st.ring2), { pos: phone2, gain: db(-19) });
  shot(cut(sfx("machine-click-1"), 0, 0.5), pick, { pos: MACHINE, gain: db(-18) });
  shot(machineVoice(beep(1020, 0.32)), pick + 0.2, { pos: MACHINE, gain: db(-20) });
  placeLine("vm3", peaks(machineVoice(dlg(voice("vm3"))), -9), LINE_AT.vm3, { pos: [MACHINE[0], MACHINE[1] + 0.05, MACHINE[2]], send: 0.6 }, DIALOGUE);
  const dead = LINE_AT.vm3 + LINES.vm3.seconds;
  shot(gainOf(starter(9, 0), 1), dead, { pos: MACHINE, gain: db(-20) });
  shot(machineVoice(new Float32Array(Math.round(0.9 * SR))), dead + 0.02, { pos: MACHINE, gain: db(-14) });
  shot(cut(sfx("machine-click-1"), 0, 0.5), dead + 1.1, { pos: MACHINE, gain: db(-20) });

  // behind: close at the back of the head, where the player stood, a little low and very near
  if (st.behind >= 0) {
    const e = eyeOf(F[behindK].g), fw = forward(e.yaw, 0), rt = rightOf(e.yaw);
    const at: V3 = [e.pos[0] - fw[0] * 0.34 + rt[0] * 0.07, e.pos[1] - 0.02, e.pos[2] - fw[2] * 0.34 + rt[2] * 0.07];
    const b = voice("behind");
    const main = level(peaks(compress(level(pitchDown(b, 1.5, TMP), -20), -4, 2.5), -8), -25);
    const under = level(new Biquad().set("lp", 420, 0.707).run(pitchDown(b, 12, TMP)), -38);
    const v = new Float32Array(Math.max(main.length, under.length)); mixInto(v, main, 0); mixInto(v, under, 0);
    placeLine("behind", v, LINE_AT.behind, { pos: at, send: 0.35 }, DIALOGUE - 1);
    // in the dark, at the left ear
    const th = voice("there");
    const tv = new Float32Array(th.length);
    mixInto(tv, level(peaks(level(pitchDown(th, 2, TMP), -20), -8), -27), 0); mixInto(tv, level(new Biquad().set("lp", 400, 0.707).run(pitchDown(th, 12, TMP)), -39), 0);
    placeLine("there", tv, LINE_AT.there, { head: [-0.2, 0.0, 0.03], send: 0.2, room: "lobby" }, DIALOGUE - 1);
  }
}
log("voices cued");

// ---- things handled -----------------------------------------------------------------------------------------------------
{
  const hand: V3 = [0.17, -0.14, 0.42];
  let lastMode = "arrow";
  for (const fr of F) {
    const t = T(fr.k);
    for (const e of fr.ev) {
      if (e === "click") shot(mouseClick(false, fr.k), t, { head: hand, gain: db(-27), send: 0.2 });
      if (e === "unclick") shot(mouseClick(true, fr.k), t, { head: hand, gain: db(-30), send: 0.2 });
      if (e === "menu:press") shot(mouseClick(false, 3), t, { head: [0.22, -0.4, 0.35], gain: db(-26), send: 0.1 });
      if (e === "menu:hover") shot(beep(2300, 0.03, 0.002, 0.02), t, { head: [0, 0, 1], gain: db(-36), send: 0 });
      if (e === "read:notice") shot(cut(sfx("paper-take-1"), 0.08, 0.5), t, { pos: NOTICE, gain: db(-22) });
      if (e === "read:close") {
        const was = F[fr.k - 1].g.st.read;
        shot(cut(sfx("paper-down-1"), 0.1, 0.6), t, was === "notice" ? { pos: NOTICE, gain: db(-24) } : { head: [0.08, -0.35, 0.4], gain: db(-22) });
      }
      if (e === "grab:printout") shot(cut(sfx("paper-take-2"), 0.15, 0.6), t, { pos: TRAY, gain: db(-18) });
      if (e === "grab:badge") shot(cut(sfx("badge-1"), 0.1, 0.6), t, { pos: BADGE, gain: db(-18) });
      if (e === "press:locked") shot(cut(sfx("handle-try-1"), 0.1, 1.4, 0.005, 0.3), t, { pos: [LOCKED_DOOR[0] + 0.36, 1.0, -2.3], gain: db(-14) });
      if (e === "press:stair-handle") shot(cut(sfx("handle-try-2"), 0.4, 1.3, 0.005, 0.3), t, { pos: [53.9, 1.02, -0.98], gain: db(-14) });
    }
    if (!fr.menu) {
      const m = fr.g.hand.mode;
      if (m !== lastMode && (m === "link" || m === "grab" || m === "resize")) shot(beep(2650, 0.014, 0.001, 0.01), t, { head: hand, gain: db(-42), send: 0 });
      lastMode = m;
    }
  }
  // the copier, and the page coming out
  if (st.copier >= 0) {
    const cp: V3 = [18.3, 0.95, -7.15];
    shot(cut(sfx("machine-click-1"), 0, 0.4), ts(st.copier), { pos: cp, gain: db(-20) });
    shot(beep(2050, 0.11), ts(st.copier) + 0.2, { pos: cp, gain: db(-30) });
    shot(cut(sfx("copier-1"), 0, 5.9, 0.08, 0.9), ts(st.copier) + 0.25, { pos: cp, gain: db(-17) });
  }
  if (st.printed >= 0) shot(cut(sfx("paper-take-2"), 0.1, 0.9, 0.05, 0.4), ts(st.printed), { pos: TRAY, gain: db(-26) });
  // the knocking, from inside the office opposite
  if (st.knock >= 0) {
    const door: V3 = [KNOCK_DOOR[0], KNOCK_DOOR[1], 0.05];
    shot(sfx("knock-1"), ts(st.knock), { pos: door, gain: db(-9), occl: 0.35, room: "cor" });
    shot(sfx("knock-hard-1"), ts(st.knock) + 1.7, { pos: door, gain: db(-8), occl: 0.35, room: "cor" });
    shot(cut(sfx("handle-rattle-1"), 0, 1.8, 0.004, 0.4), ts(st.knock) + 3.3, { pos: [KNOCK_DOOR[0] + 0.38, 1.0, 0.0], gain: db(-12), occl: 0.3, room: "cor" });
  }
  // the badge reader: the swipe, a think, accepted; and at the end, locked again
  if (st.swipe >= 0) {
    const rd: V3 = [READER[0] - 0.06, READER[1], READER[2]], sw = ts(st.swipe);
    shot(sfx("card-swipe-1"), sw, { pos: rd, gain: db(-16) });
    for (let t = 50 / FPS; t < 126 / FPS; t += 0.3) shot(beep(2400, 0.035), sw + t, { pos: rd, gain: db(-34) });
    shot(beep(1800, 0.08), sw + 128 / FPS, { pos: rd, gain: db(-27) });
    shot(beep(2400, 0.12), sw + 128 / FPS + 0.1, { pos: rd, gain: db(-27) });
    shot(cut(sfx("lock-clunk-1"), 0.08, 0.6), sw + 128 / FPS + 0.05, { pos: [STAIR_DOOR[0] - 0.05, 1.2, -1.3], gain: db(-15) });
    if (st.behind >= 0) {
      shot(cut(sfx("lock-clunk-1"), 0.08, 0.6), ts(st.behind + FIN.lock), { pos: [STAIR_DOOR[0] - 0.05, 1.2, -1.3], gain: db(-11) });
      shot(beep(420, 0.45, 0.004, 0.05), ts(st.behind + FIN.lock) + 0.06, { pos: rd, gain: db(-26) });
    }
  }
  // the copy room's opening dragged wider: the wall straining with the pull
  const drag = F.filter((fr) => !fr.menu && fr.g.st.drag).map((fr) => fr.k);
  if (drag.length) {
    const s1 = sfx("drywall-strain-1"), s2 = sfx("drywall-strain-2"), deep = speed(s1, 0.55);
    const strain = new Float32Array(s1.length + s2.length); strain.set(s1, 0); strain.set(s2, s1.length);
    const k0 = drag[0], k1 = drag[drag.length - 1] + sec(0.4);
    let v = 0;
    emit({
      k0, k1, pos: (k) => [COPY_OPEN.a + F[k].g.st.copyW, 1.15, -2.5],
      gain: (k) => { const want = F[k].g.st.drag ? 0.15 + 0.85 * smooth(Math.abs(F[k].g.st.dragV) / 0.5) : 0; v += (want - v) * 0.2; return v * db(-12); },
      fill: (k, out) => { const a = (k - k0) * SPF; for (let i = 0; i < SPF; i++) out[i] = strain[(a + i) % strain.length] + 0.7 * deep[(a + i) % deep.length]; },
    });
    for (const k of evAll("resize:start")) shot(cut(sfx("building-creak-3"), 0.2, 0.5, 0.01, 0.2), T(k), { pos: [COPY_OPEN.a + F[k].g.st.copyW, 1.15, -2.5], gain: db(-18) });
    for (const k of evAll("resize:end")) shot(new Biquad().set("lp", 700, 0.707).run(speed(cut(sfx("knock-hard-1"), 0.1, 0.4), 0.6)), T(k), { pos: [COPY_OPEN.a + F[k].g.st.copyW, 1.0, -2.5], gain: db(-16) });
  }
}
log("handling cued");

// ---- it ---------------------------------------------------------------------------------------------------------------------
{
  const b1 = speed(sfx("breath-1"), 0.9), b2 = speed(sfx("breath-2"), 0.85);
  const loopOf = (x: Float32Array) => { const xf = Math.round(0.4 * SR), n = x.length - xf, y = new Float32Array(n); for (let i = 0; i < n; i++) y[i] = x[i] * (i < xf ? 0 : 1) + (i < xf ? x[n + i] * (1 - i / xf) + x[i] * (i / xf) : 0); return y; };
  const slow = loopOf(b1), fast = loopOf(b2);
  const isNone = (fr: Frame) => fr.menu || (fr.it.x === -5 && fr.it.z === -1.3) || fr.it.loud < 0.005;
  // runs of frames where it is somewhere and audible, split where it jumps
  const runs: [number, number][] = [];
  let a = -1;
  for (let k = 0; k < K; k++) {
    const fr = F[k], none = isNone(fr) || k >= blackK;
    const jump = k > 0 && !none && Math.hypot(fr.it.x - F[k - 1].it.x, fr.it.z - F[k - 1].it.z) > 2;
    if (a >= 0 && (none || jump)) { runs.push([a, k]); a = -1; }
    if (a < 0 && !none) a = k;
  }
  if (a >= 0) runs.push([a, K]);
  for (const [k0, k1] of runs) {
    emit({
      k0, k1, pos: (k) => [F[k].it.x, 1.85, F[k].it.z],
      gain: (k) => Math.pow(F[k].it.loud, 1.3) * db(-11) * Math.min(1, (k - k0 + 1) / 4, (k1 - k) / 4),
      fill: (k, out) => { const l = F[k].it.loud, mix = smooth((l - 0.6) / 0.3); for (let i = 0; i < SPF; i++) { const j = k * SPF + i; out[i] = slow[j % slow.length] * (1 - 0.6 * mix) + fast[j % fast.length] * mix; } },
    });
  }
  // its steps: heavy, uneven, from how far it has come
  const st1 = steps(["creature-steps-1"], 0.6, 0.35);
  let acc = 0, n = 0;
  for (let k = 1; k < K; k++) {
    const fr = F[k], pv = F[k - 1];
    if (isNone(fr) || isNone(pv) || k >= blackK) { acc = 0; continue; }
    const d = Math.hypot(fr.it.x - pv.it.x, fr.it.z - pv.it.z);
    if (d > 1) { acc = 0; continue; }
    const v = d * FPS;
    acc += d;
    const stride = clamp(0.85 + 0.22 * v, 0.85, 2.6);
    if (acc >= stride && v > 0.3) {
      acc = 0;
      shot(speed(st1[n % st1.length], 0.86 + R() * 0.08), T(k), { pos: [fr.it.x, 0.05, fr.it.z], gain: db(-6) * clamp(0.45 + fr.it.loud * 0.6, 0, 1) * clamp(0.6 + v / 6, 0, 1.3) });
      n++;
    }
  }
  report.itRuns = runs.length; report.itSteps = n;
}
log("it cued");

// ---- the air: each room's bed, which the floor switches off when it sleeps (and the end switches off for good) -----------
const BED: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
{
  // per room: the diffusers' hiss (level, its top while the fans run), the ducts' low hum under it (level), a rumble
  // (the unfinished wing's open plenum)
  const AIR: Record<RoomId, [number, number, number, number]> = {
    bay: [db(-31), 3800, db(-37), 0], cor: [db(-32), 5000, db(-38), 0], copy: [db(-33), 3400, db(-36), 0], wing: [db(-37), 1800, db(-34), db(-27)], lobby: [db(-33), 4200, db(-37), 0],
  };
  const nl = pink(N, 501), nr = pink(N, 502);
  const mk = () => ({ hp: new Biquad().set("hp", 50, 0.707), lp: new Biquad(), duct: new Biquad().set("lp", 220, 0.707), dhp: new Biquad().set("hp", 45, 0.707), rum: new Biquad().set("lp", 110, 0.707), rhp: new Biquad().set("hp", 32, 0.707) });
  const ch = [mk(), mk()];
  let g = 0, fc = 3000, gd = 0, gr = 0;
  const dieK = st.behind >= 0 ? behindK + FIN.corOut(5) : K;
  for (let k = 0; k < K; k++) {
    const fr = F[k], air = AIR[fr.room];
    const awake = 1 - 0.88 * smooth(sleepS[k] / 0.35);
    const die = k < dieK ? 1 : Math.max(0, 1 - (k - dieK) / sec(2.5));
    const dip = (T(k) > NOT_ME && T(k) < NOT_ME + 5 ? db(-5) : 1) * (speaking(T(k)) ? db(-3) : 1);
    // asleep, the fans run down: quieter and darker; at the end they stop
    const want = air[0] * awake * die * dip, wantFc = air[1] * (0.12 + 0.88 * awake) * (0.15 + 0.85 * die);
    const g0 = g, gd0 = gd, gr0 = gr;
    g += (want - g) * 0.04; fc += (wantFc - fc) * 0.04;
    gd += (air[2] * (0.3 + 0.7 * awake) * die * dip - gd) * 0.04; gr += (air[3] * die - gr) * 0.03;
    ch[0].lp.set("lp", fc, 0.707); ch[1].lp.set("lp", fc * 1.05, 0.707);
    for (let i = 0; i < SPF; i++) {
      const j = k * SPF + i, u = i / SPF, a1 = g0 + (g - g0) * u, a2 = gd0 + (gd - gd0) * u, a3 = gr0 + (gr - gr0) * u;
      for (let c = 0; c < 2; c++) {
        const n = (c ? nr : nl)[j], f = ch[c];
        const hiss = f.lp.tick(f.hp.tick(n)), duct = f.duct.tick(f.dhp.tick(n)), rum = f.rum.tick(f.rhp.tick(n));
        BED[c][j] = hiss * a1 + duct * a2 + rum * a3;
      }
    }
  }
}
log("air made");

// ---- the score ------------------------------------------------------------------------------------------------------------
const SCORE: [Float32Array, Float32Array] = [new Float32Array(N), new Float32Array(N)];
const TEN = new Float32Array(K), SG = new Float32Array(K);
{
  const sk = (gf: number) => (gf < 0 ? Infinity : fk(gf));
  const newK = evK("menu:new") > 0 ? evK("menu:new") : AT;
  const wakeSeenK = F.find((fr) => !fr.menu && fr.g.st.notice >= 0 && fr.it.seen && fr.g.sleep === 0)?.k ?? Infinity;
  const lobbyK = sk(st.lobby), unmuteK = behindK + FIN.corOut(0), titleK = behindK + FIN.title, endK = behindK + FIN.end;
  const raw = (k: number): [number, number] => {
    const fr = F[k], g = fr.g, s = g.st, t = T(k);
    if (fr.menu) return [0.2, k < newK ? clamp((k - BOOT) / TITLE_IN, 0, 1) : Math.max(0, 1 - (k - newK) / MENU_FADE)];
    let x = 0.1;
    if (s.ring1 >= 0) x = 0.2;
    if (s.vm1 >= 0) x = 0.26;
    if (g.sleep > 0) x = Math.max(x, 0.25 + 0.7 * g.sleep);
    if (!(fr.it.x === -5 && fr.it.z === -1.3)) x = Math.max(x, 0.9 * fr.it.loud);
    if (k >= wakeSeenK) x = Math.max(x, 1 - (k - wakeSeenK) / sec(5));
    if (s.read === "printout") x = Math.max(x, 0.55);
    if (s.knock >= 0 && k - sk(s.knock) < sec(10)) x = Math.max(x, 0.66);
    if (s.wing >= 0) x = Math.max(x, 0.42);
    if (s.ghost1 >= 0 && s.lobby < 0) x = Math.max(x, 0.85);
    if (s.lobby >= 0) x = 0.35 + 0.4 * Math.max(0, 1 - (k - lobbyK) / sec(10));
    if (s.ring2 >= 0) x = 0.45;
    if (s.vm3 >= 0) x = 0.45 + 0.3 * clamp((t - LINE_AT.vm3) / (NOT_ME - LINE_AT.vm3), 0, 1);
    let gain = speaking(t) ? 0.5 : 1;
    if (t >= NOT_ME && k < unmuteK) gain = 0;
    // the lights going toward the player: the chord at its most dissonant, swelling to the blackout, cut dead there
    if (st.behind >= 0 && k >= unmuteK) { x = 1; gain = k < blackK ? 0.8 + 1.1 * smooth((k - unmuteK) / (blackK - unmuteK)) : 0; }
    if (st.behind >= 0 && k >= behindK + FIN.ask) { x = 0.3; gain = 0.7; }
    if (st.behind >= 0 && t > LINE_AT.there - 0.3 && t < LINE_AT.there + LINES.there.seconds + 0.3) gain = 0;
    if (st.behind >= 0 && k >= titleK) { x = 0.55; gain = 4 * Math.max(0, 1 - (k - titleK) / (endK - titleK - sec(1))); }
    return [x, gain];
  };
  let x = 0.2, gs = 0;
  for (let k = 0; k < K; k++) {
    const [want, wg] = raw(k);
    x += (want - x) * (want > x ? 1 / (1.2 * FPS) : 1 / (3 * FPS));
    // the cut at "not from me", and the blackout, are hard (a 40 ms fade); the rest is slow
    const hard = (T(k) >= NOT_ME && T(k) < NOT_ME + 0.1) || (k >= blackK && k < blackK + 6);
    gs += (wg - gs) * (hard ? 0.4 : wg > gs ? 1 / (0.8 * FPS) : 1 / (1.5 * FPS));
    TEN[k] = x; SG[k] = gs;
  }
  // the chord: the ballasts' series on 60 Hz, warm and low when calm; the 7th, 11th and 13th coming in with the fear
  const P = [2, 3, 4, 5, 6, 7, 9, 11, 13, 14];
  const W0 = [0.55, 0.55, 0.5, 0.42, 0.3, 0, 0.18, 0, 0, 0], W1 = [0, 0, 0, 0, 0.06, 0.38, 0.12, 0.32, 0.24, 0.16];
  const lr = rng(77), lfo = P.map(() => [0.02 + lr() * 0.07, lr() * TAU, 0.02 + lr() * 0.07, lr() * TAU]);
  const phL = P.map(() => lr() * TAU), phR = P.map(() => lr() * TAU);
  let lpL = 0, lpR = 0, sub = 0, g0 = 0;
  for (let k = 0; k < K; k++) {
    const x = TEN[k], g = SG[k] * db(-32 + 13 * x);
    if (g < 1e-6 && g0 < 1e-6) { g0 = g; for (let j = 0; j < P.length; j++) { phL[j] += TAU * 60 * P[j] * SPF / SR; phR[j] += TAU * 60 * P[j] * SPF / SR; } continue; }
    const sag = SAG(k), a = 1 - Math.exp(-TAU * (700 + 2600 * x * x) / SR);
    for (let i = 0; i < SPF; i++) {
      const j = k * SPF + i, t = j / SR;
      const wow = 1 + 0.0035 * x * Math.sin(TAU * 0.27 * t) + 0.0009 * x * Math.sin(TAU * 5.3 * t);
      let l = 0, r = 0;
      for (let p = 0; p < P.length; p++) {
        const amp = W0[p] + x * W1[p];
        if (amp <= 0) continue;
        const f = 60 * P[p] * sag * wow, det = 0.0007 * (p + 1) * (0.4 + x);
        phL[p] += TAU * f * (1 - det) / SR; phR[p] += TAU * f * (1 + det) / SR;
        l += amp * (0.6 + 0.4 * Math.sin(TAU * lfo[p][0] * t + lfo[p][1])) * Math.sin(phL[p]);
        r += amp * (0.6 + 0.4 * Math.sin(TAU * lfo[p][2] * t + lfo[p][3])) * Math.sin(phR[p]);
      }
      lpL += (l - lpL) * a; lpR += (r - lpR) * a;
      sub += TAU * 41 * sag / SR;
      const s = Math.sin(sub) * x * x * 0.5;
      const gg = (g0 + (g - g0) * (i / SPF)) * 0.3;
      SCORE[0][j] += (lpL + s) * gg; SCORE[1][j] += (lpR + s) * gg;
    }
    g0 = g;
  }
  // stingers and the motif
  const put = (x0: Float32Array, t: number, g: number, pan = 0) => { const at = Math.round(t * SR), x = x0.slice(); fadeEdges(x); mixInto(SCORE[0], x, at, g * (1 - pan) ); mixInto(SCORE[1], x, at, g * (1 + pan)); };
  // the engine's splash: its mark strikes like one of the floor's tubes (a starter's click, the tube catching), and a
  // ballast's hum, the score's own series, swells under it and goes out with it
  {
    const t0 = T(SPLASH.strike);
    put(starter(3, 1), t0, db(-27));
    put(cut(sfx("tube-strike-2"), 0, 0.22, 0.002, 0.08), t0 + 8 / FPS, db(-28));
    const out = (SPLASH.out - SPLASH.strike) / FPS, len = (SPLASH.gone - SPLASH.out) / FPS + 0.25;
    const n = Math.round((out + len + 0.05) * SR), hum = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const u = i / SR;
      const s = 0.5 * Math.sin(TAU * 120 * u) + 0.34 * Math.sin(TAU * 180.25 * u) + 0.28 * Math.sin(TAU * 240 * u) + 0.16 * Math.sin(TAU * 300.4 * u);
      hum[i] = s * smooth((u - 8 / FPS) / 0.4) * (1 - smooth((u - out) / len));
    }
    put(hum, t0, db(-31));
  }
  if (wakeSeenK < K) {
    const t = T(wakeSeenK);
    put(thud(44, 1.6, 3), t, db(-21)); put(scrape(1.6, 5), t, db(-23), -0.2); put(bell(565, 4, 2.76, 2), t + 0.02, db(-27), 0.3); put(bell(600, 4, 2.76, 2), t + 0.03, db(-28), -0.3);
  }
  if (st.ghost1 >= 0) { const t = ts(st.ghost1); put(thud(50, 1.3, 4), t, db(-18)); put(scrape(1.1, 6), t, db(-24), 0.3); }
  if (st.printout >= 0) {
    const t = ts(st.readF);
    const n = Math.round(4.5 * SR), sw = new Float32Array(n);
    for (let i = 0; i < n; i++) { const u = i / SR; sw[i] = (0.6 * (Math.sin(TAU * 60 * u) + Math.sin(TAU * 63.2 * u)) + 0.5 * (Math.sin(TAU * 120 * u) + Math.sin(TAU * 126.4 * u))) * smooth(u / 1.6) * Math.max(0, 1 - Math.max(0, u - 3) / 1.5) * 0.5; }
    put(sw, t, db(-22)); put(bell(630, 5), t + 0.3, db(-30), -0.4); put(bell(600, 5), t + 0.7, db(-31), 0.4);
  }
  // the ring, as the theme: the phone's two notes, an octave down, after "keep moving" and under the title
  const motif = (t: number, g: number) => { put(bell(630, 3.5), t, g, -0.25); put(bell(480, 3.8), t + 0.42, g, 0.25); };
  motif(LINE_AT.vm1 + LINES.vm1.seconds + 0.8, db(-31));
  motif(T(AT) + 2.2, db(-33));
  if (st.behind >= 0) {
    put(thud(40, 1.0, 8), T(blackK), db(-19));
    put(beep(660, 0.22), T(behindK + FIN.ask), db(-30)); put(beep(990, 0.3), T(behindK + FIN.ask) + 0.11, db(-33));
    // the click that answers for the player: crisp, so mixed in as it is (a click's edge is the sound)
    for (const [up, dt, g] of [[false, 0, db(-21)], [true, 8 / FPS, db(-24)]] as [boolean, number, number][]) { const c = mouseClick(up, up ? 98 : 99), at = Math.round((T(behindK + FIN.askClick) + dt) * SR); mixInto(SCORE[0], c, at, g); mixInto(SCORE[1], c, at, g); }
    put(thud(38, 2.6, 9), T(titleK), db(-20));
    motif(T(titleK) + 0.4, db(-24));
    motif(T(titleK) + 3.4, db(-29));
  }
  // New Game: a low swell through the fade
  const nk = evK("menu:new");
  if (nk > 0) { put(thud(42, 2.0, 2), T(nk), db(-18)); put(bell(480, 3), T(nk) + 0.05, db(-30)); }
}
log("score made");

// ---- reverb, the master -------------------------------------------------------------------------------------------------
// the dialogue bus held under -5 dBFS, as a game's VO bus is: a line leaned into stays loud without spiking
// the dialogue bus levelled before its limiter: a gentle compressor takes the peaks a voice beside one ear throws (the
// near ear's level difference), so neither limiter has to squash the words
// the master gain, and the world's lift while no one speaks (below): together they bring the film to -14 LUFS, where a
// social feed plays it (raea check holds a posted film to -14 ±1). The spoken stretches already reach the limiter at this
// gain, so more of it would only squash the words; the lift raises the quiet stretches instead. The bus limiters below
// take the peaks first, each against this gain
const MASTER_DB = Number(process.env.GAIN_DB ?? 7.2), BUS_HEAD = Number(process.env.BUS_HEAD ?? 3), LIFT_DB = Number(process.env.LIFT_DB ?? 4.5);
report.voiceGlue = glue(VOICE[0], VOICE[1], Number(process.env.GLUE_THR ?? -14), 3, 0.005, 0.15, 6);
// the voice's peaks held at -2.5 dBFS after the master gain, on its own bus, so the master limiter never rides the room
// under a line
report.voiceBus = limit(VOICE[0], VOICE[1], Number(process.env.VCEIL ?? -2.5 - MASTER_DB), 0.003, 0.08, true);
(report.voiceBus as { regions: unknown[] }).regions = [];
reverbReturns(TMP);
log("reverb returned");
// the quiet world (placed sounds, their rooms, the air and the score) up to LIFT_DB while no one speaks, back down from 0.4 s
// before a line to 1.5 s after it: a game's dialogue duck, so every line still sits over the room exactly as mixed
{
  const hop = SR / 100, nH = Math.ceil(N / hop), floor = db(-50) ** 2;
  const duck = new Float32Array(nH);
  for (let h = 0; h < nH; h++) {
    let s2 = 0;
    for (let i = h * hop; i < Math.min(N, (h + 1) * hop); i++) s2 += VOICE[0][i] ** 2 + VOICE[1][i] ** 2;
    if (s2 / (2 * hop) > floor) for (let k = Math.max(0, h - 40); k <= Math.min(nH - 1, h + 150); k++) duck[k] = 1;
  }
  const box = (x: Float32Array, w: number) => { const y = new Float32Array(x.length); let s = 0; for (let h = 0; h < x.length + w; h++) { if (h < x.length) s += x[h]; if (h - w >= 0) s -= x[h - w]; const c = h - (w >> 1); if (c >= 0 && c < x.length) y[c] = s / w; } return y; };
  // only the quiet world is lifted (upward, as a game's HDR audio does): the full lift under LIFT_LO dB (the buses as the
  // master hears them: their 50 ms RMS, or their peak 12 dB down where a knock's peak says more than its RMS), none over
  // LIFT_HI. A loud thing takes the lift away as it lands (60 ms ahead, 35 ms fall: a knock or a stinger keeps the level
  // it was mixed at, so its limiter does no more work and the room never dips before it), and the room comes back up
  // slowly after (1.5 s), as ears do
  const LO = Number(process.env.LIFT_LO ?? -27), HI = Number(process.env.LIFT_HI ?? -21), CREST = 12, RECOVER = Number(process.env.LIFT_REC ?? 1.5);
  const pw = new Float32Array(nH), pk = new Float32Array(nH);
  for (let h = 0; h < nH; h++) {
    let s2 = 0, p = 0;
    for (let i = h * hop; i < Math.min(N, (h + 1) * hop); i++) {
      const l = (OUT[0][i] + WETBUS[0][i]) * G_FX + BED[0][i] * G_BED + SCORE[0][i] * G_SCORE, r = (OUT[1][i] + WETBUS[1][i]) * G_FX + BED[1][i] * G_BED + SCORE[1][i] * G_SCORE;
      s2 += l * l + r * r;
      p = Math.max(p, Math.abs(l), Math.abs(r));
    }
    pw[h] = s2 / (2 * hop);
    pk[h] = (p * db(-CREST)) ** 2;
  }
  const p5 = box(pw, 5), lvl = new Float32Array(nH), want = new Float32Array(nH);
  for (let h = 0; h < nH; h++) { lvl[h] = 10 * Math.log10(Math.max(p5[h], pk[h]) + 1e-20); want[h] = Math.min(1, Math.max(0, (HI - lvl[h]) / (HI - LO))); }
  const env = new Float32Array(nH), fall = 1 - Math.exp(-10 / 35), rise = 1 - Math.exp(-10 / (RECOVER * 1000));
  const onsets: number[] = [];
  for (let h = 0, e = 1; h < nH; h++) {
    let a = 1;
    for (let k = h; k <= Math.min(nH - 1, h + 6); k++) a = Math.min(a, want[k]);
    if (a < e - 0.3 && (onsets.length === 0 || h / 100 - onsets[onsets.length - 1] > 1)) onsets.push(+(h / 100).toFixed(2));
    e += (a - e) * (a < e ? fall : rise);
    env[h] = e;
  }
  // and under the lines, the dialogue duck eased in and out over 0.8 s (a box average run twice), never stepped
  const dsm = box(box(duck, 40), 40), lift = new Float32Array(nH);
  for (let h = 0; h < nH; h++) lift[h] = env[h] * (1 - dsm[h]);
  for (let h = 0; h < nH; h++) {
    const g0 = db(LIFT_DB * lift[h]), g1 = db(LIFT_DB * lift[Math.min(nH - 1, h + 1)]);
    for (let i = h * hop, j = 0; i < Math.min(N, (h + 1) * hop); i++, j++) {
      const g = g0 + (g1 - g0) * (j / hop);
      for (const b of [OUT, WETBUS, BED, SCORE]) { b[0][i] *= g; b[1][i] *= g; }
    }
  }
  const free = [...lvl].filter((_, h) => !duck[h]).sort((a, b) => a - b), q = (p: number) => +free[Math.floor(p * (free.length - 1))].toFixed(1);
  let full = 0, none = 0;
  for (let h = 0; h < nH; h++) { if (lift[h] > 0.95) full++; if (lift[h] < 0.05) none++; }
  report.lift = { db: LIFT_DB, lo: LO, hi: HI, worldDbBetweenLines: { p10: q(0.1), p50: q(0.5), p90: q(0.9), p99: q(0.99) }, secondsFull: full / 100, secondsNone: none / 100, onsets };
  console.log(JSON.stringify(report.lift));
}
// the foley and the score each held under a fold-safe ceiling of their own, BUS_HEAD dB under the master's: a knock or a
// stinger ducks only itself, quickly, instead of the master limiter pulling the whole room down for 150 ms
const busLim = (b: [Float32Array, Float32Array], gDb: number, rel: number) => { const r = limit(b[0], b[1], -1.8 - BUS_HEAD - gDb - MASTER_DB, 0.002, rel, true); return { minGainDb: r.minGainDb, at: r.at, msOver3dB: r.msOver3dB, top: r.regions.sort((x, y) => x.db - y.db).slice(0, 6) }; };
report.fxBus = busLim(OUT, 7, 0.05);
report.scoreBus = busLim(SCORE, 9, 0.08);
const ML = new Float32Array(N), MR = new Float32Array(N);
{
  const clickK = F.find((fr) => fr.ev.includes("menu:new"))?.k ?? AT;
  const env = (k: number) => {
    // the splash is silent but for its own sound (on the score bus); the corridor's room comes up with the title
    if (k < clickK) return smooth((k - BOOT) / 40);
    if (k < AT) return 1 - smooth((k - clickK) / MENU_FADE);
    if (k < AT + sec(0.6)) return smooth((k - AT) / sec(0.6));
    return 1;
  };
  for (let k = 0; k < K; k++) {
    const e0 = env(Math.max(0, k - 1)), e1 = env(k);
    for (let i = 0; i < SPF; i++) {
      const j = k * SPF + i, e = e0 + (e1 - e0) * (i / SPF);
      // the score fades itself (and its New Game swell rides through the fade)
      ML[j] = ((OUT[0][j] + WETBUS[0][j]) * G_FX + VOICE[0][j] + BED[0][j] * G_BED) * e + SCORE[0][j] * G_SCORE;
      MR[j] = ((OUT[1][j] + WETBUS[1][j]) * G_FX + VOICE[1][j] + BED[1][j] * G_BED) * e + SCORE[1][j] * G_SCORE;
    }
  }
  // the last second and a half fades to nothing
  const fo = Math.round(1.5 * SR);
  for (let i = 0; i < fo; i++) { const g = smooth(1 - i / fo); ML[N - fo + i] *= g; MR[N - fo + i] *= g; }
}
function loudness(file: string): { I: number; TP: number } {
  const err = execFileSync("sh", ["-c", `ffmpeg -hide_banner -nostats -i '${file}' -af ebur128=peak=true -f null - 2>&1 | tail -14`], { encoding: "utf8" });
  const I = +(err.match(/I:\s+(-?[\d.]+) LUFS/)?.[1] ?? NaN), TP = +(err.match(/Peak:\s+(-?[\d.]+) dBFS/)?.[1] ?? NaN);
  return { I, TP };
}
// ---- the balance, measured -------------------------------------------------------------------------------------------------
{
  /** RMS (dB) of a bus over a window, over its loud blocks only (within 25 dB of its loudest 50 ms) */
  const gated = (bus: [Float32Array, Float32Array], a: number, b: number) => {
    const hop = 2400, rs: number[] = [];
    for (let i = Math.round(a * SR); i + hop <= Math.min(N, Math.round(b * SR)); i += hop) { let s2 = 0; for (let j = 0; j < hop; j++) s2 += bus[0][i + j] ** 2 + bus[1][i + j] ** 2; rs.push(s2 / (2 * hop)); }
    const top = Math.max(...rs, 1e-20), keep = rs.filter((r) => r > top * 10 ** -2.5);
    return +(10 * Math.log10(keep.reduce((x, y) => x + y, 0) / Math.max(1, keep.length) + 1e-20)).toFixed(1);
  };
  const plain = (bus: [Float32Array, Float32Array], a: number, b: number) => { let s2 = 0, n = 0; for (let i = Math.round(a * SR); i < Math.min(N, Math.round(b * SR)); i++) { s2 += bus[0][i] ** 2 + bus[1][i] ** 2; n += 2; } return +(10 * Math.log10(s2 / Math.max(1, n) + 1e-20)).toFixed(1); };
  const W: Record<string, [number, number]> = {
    menu: [T(BOOT) + 1, T(AT) - 2], bay: [T(AT) + 1, LINE_AT.vm1 - 1], vm1: [LINE_AT.vm1, LINE_AT.vm1 + LINES.vm1.seconds], corridor: [LINE_AT.vm1 + LINES.vm1.seconds + 2, LINE_AT.vm1 + LINES.vm1.seconds + 30],
    tape2: [LINE_AT.tape2, LINE_AT.tape2 + LINES.tape2.seconds], wing: [ts(st.wing), ts(st.lobby)], vm3: [LINE_AT.vm3, NOT_ME], notMe: [NOT_ME, LINE_AT.vm3 + LINES.vm3.seconds],
    behind: [LINE_AT.behind, LINE_AT.behind + LINES.behind.seconds], finale: [LINE_AT.behind + 2, T(blackK)], there: [LINE_AT.there, LINE_AT.there + LINES.there.seconds], title: [T(behindK + FIN.title), T(behindK + FIN.title) + 5],
  };
  const SC: [Float32Array, Float32Array] = SCORE;
  const pk = (bus: [Float32Array, Float32Array], a: number, b: number) => { let m = 0, at = 0; for (let i = Math.round(a * SR); i < Math.min(N, Math.round(b * SR)); i++) { const v = Math.max(Math.abs(bus[0][i]), Math.abs(bus[1][i])); if (v > m) { m = v; at = i; } } return `${(20 * Math.log10(m + 1e-12)).toFixed(1)}@${(at / SR).toFixed(2)}`; };
  report.outside = OUTSIDE;
  report.peaks = Object.fromEntries(([["menuRing", [T(BOOT) + 0.5, T(BOOT) + 2.2]], ["hit32", [31, 33.4]], ["hit108", [107.5, 108.7]], ["hit252", [251, 253]], ["hit286", [285.5, 286.7]], ["vm1Sleep", [38, 45]], ["tapeSleep", [126, 138]], ["vm3", [254, 276]], ["finale", [279, 289]]] as [string, [number, number]][]).map(([n, [a, b]]) => [n, { voice: pk(VOICE, a, b), fx: pk(OUT, a, b), wet: pk(WETBUS, a, b), bed: pk(BED, a, b), score: pk(SC, a, b) }]));
  console.log(JSON.stringify(report.peaks));
  // energy by band (dB): under 60 Hz, 60-250, 250-2k, 2k-8k, over 8k
  const bands = (bus: [Float32Array, Float32Array], a: number, b: number) => {
    const x = bus[0].subarray(Math.round(a * SR), Math.min(N, Math.round(b * SR)));
    const e = (y: Float32Array) => { let s2 = 0; for (let i = 0; i < y.length; i++) s2 += y[i] * y[i]; return +(10 * Math.log10(s2 / Math.max(1, y.length) + 1e-20)).toFixed(0); };
    const lp = (f: number) => new Biquad().set("lp", f, 0.707).run(new Biquad().set("lp", f, 0.707).run(x));
    const hp = (y: Float32Array, f: number) => new Biquad().set("hp", f, 0.707).run(new Biquad().set("hp", f, 0.707).run(y));
    const l60 = lp(60), l250 = lp(250);
    return [e(l60), e(l250.map((v, i) => v - l60[i])), e(hp(lp(2000), 250)), e(hp(lp(8000), 2000)), e(hp(x, 8000))].join(" ");
  };
  report.bands = Object.fromEntries(([["corridor", [62, 80]], ["sleepVm1", [39, 44]], ["wing", [190, 200]], ["lobby", [240, 250]]] as [string, [number, number]][]).map(([n, [a, b]]) => [n, { voice: bands(VOICE, a, b), fx: bands(OUT, a, b), wet: bands(WETBUS, a, b), bed: bands(BED, a, b), score: bands(SC, a, b) }]));
  console.log(JSON.stringify(report.bands));
  report.buses = Object.fromEntries(Object.entries(W).map(([n, [a, b]]) => [n, { voice: gated(VOICE, a, b), fx: plain(OUT, a, b), wet: plain(WETBUS, a, b), bed: plain(BED, a, b), score: plain(SC, a, b) }]));
  // where the peaks are: half-second windows whose sample peak passes -6 dBFS before the master gain
  const hot: { t: number; db: number }[] = [];
  for (let i = 0; i < N; i += SR / 2) { let p2 = 0; for (let j = i; j < Math.min(N, i + SR / 2); j++) p2 = Math.max(p2, Math.abs(ML[j]), Math.abs(MR[j])); if (p2 > db(-6)) hot.push({ t: +(i / SR).toFixed(1), db: +(20 * Math.log10(p2)).toFixed(1) }); }
  report.hot = hot.sort((x, y) => y.db - x.db).slice(0, 25);
  console.log(JSON.stringify(report.buses));
  console.log(JSON.stringify(report.hot));
}
// nothing under 30 Hz: it only spends headroom
for (const ch of [ML, MR]) { const y = new Biquad().set("hp", 30, 0.707).run(new Biquad().set("hp", 30, 0.707).run(ch)); ch.set(y); }
writeWav(`${TMP}/pre.wav`, ML, MR);
const pre = loudness(`${TMP}/pre.wav`);
// no loudness normalisation: the dialogue is the anchor and the rest sits against it, lifted between lines (above)
const gain = db(MASTER_DB);
for (let i = 0; i < N; i++) { ML[i] *= gain; MR[i] *= gain; }
const lim = limit(ML, MR, -1.8, 0.004, 0.15, true);
report.limiter = { ...lim, regions: lim.regions.sort((x, y) => x.db - y.db).slice(0, 20) };
console.log(JSON.stringify(report.limiter));
let pk = 0, over = 0, mono = 0;
for (let i = 0; i < N; i++) { const a = Math.max(Math.abs(ML[i]), Math.abs(MR[i])); pk = Math.max(pk, a); if (a >= 0.999) over++; mono = Math.max(mono, Math.abs(Math.SQRT1_2 * (ML[i] + MR[i]))); }
const outFile = `${ROOT}out/floor3-mix.wav`;
writeWav(outFile, ML, MR);
const fin = loudness(outFile);
report.master = { preLUFS: pre.I, gainDb: 20 * Math.log10(gain), LUFS: fin.I, truePeak: fin.TP, samplePeakDb: 20 * Math.log10(pk), monoFoldPeakDb: 20 * Math.log10(mono), samplesAtFullScale: over };
// how loud each part of the film is (short windows), for checking the balance
const win = (a: number, b: number) => { let s = 0, n = 0; for (let i = Math.round(a * SR); i < Math.min(N, Math.round(b * SR)); i++) { s += ML[i] * ML[i] + MR[i] * MR[i]; n += 2; } return +(10 * Math.log10(s / Math.max(1, n) + 1e-12)).toFixed(1); };
report.rms = {
  menu: win(T(BOOT) + 1, T(AT) - 2), bayStart: win(T(AT) + 1, T(AT) + 6), vm1: win(LINE_AT.vm1 + 1, LINE_AT.vm1 + 20), tape2: win(LINE_AT.tape2 + 1, LINE_AT.tape2 + 20),
  vm3: win(LINE_AT.vm3 + 1, LINE_AT.vm3 + 12), afterNotMe: win(NOT_ME + 0.5, NOT_ME + 4), behind: win(LINE_AT.behind, LINE_AT.behind + 1.4),
  finaleLights: win(LINE_AT.behind + 2, T(blackK)), there: win(LINE_AT.there, LINE_AT.there + 1.6), title: win(T(behindK + FIN.title), T(behindK + FIN.title) + 4),
};
writeFileSync(`${ROOT}out/mix.report.json`, JSON.stringify(report, null, 1));
writeFileSync(`${TMP}/spans.json`, JSON.stringify(SPANS.map(([a, b]) => [+a.toFixed(4), +b.toFixed(4)])));
log(`mix written: ${outFile}`);
console.log(JSON.stringify(report.master), JSON.stringify(report.rms));
