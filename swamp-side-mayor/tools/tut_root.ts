// tools/tut_root.ts: Goose's timeline for the tutorial, for blender/tut_goose_build.py to bake his body to (the music
// video's tools/root.ts, for the tutorial's shots). From components/tut/shots.ts's gooseAt, every frame of the film:
//   root.json   [x, y, z, yaw (unwrapped), grounded, slide, lens x, y, z, cut] a frame (cut: the first frame of a shot,
//               where his feet start again under him), the feet lifted on purpose (stomps), the keys he lands on as he types
//   show.json   his moves in beats (the film's grid, 0 at its first frame), the music video's dance patterns, and where
//               the end song sits, so the dance and the quacks keep its beat
//   voice.json  how open his bill is a frame: each honk in the soundtrack
//   bun --preload ./tools/stub/raea.ts tools/tut_root.ts
import { mkdirSync } from "node:fs";
import { BEATS, FPS, ON_KEY, SECONDS, SONG, beatAt, gooseAt, gooseParts, swampCam } from "../components/tut/shots";
import { CUES } from "../components/tut/sound";
import show from "../compositions/show.json";

const OUT = "out/tut/goose", GS = 1.7, BPM = show.bpm, BEAT = 60 / BPM, N = Math.round(SECONDS * FPS);
const bt = (t: number) => +(t / BEAT).toFixed(4);
mkdirSync(OUT, { recursive: true });

// ---- where he is each frame, and the lens
const frames: number[][] = [];
const moves: { name: string; from: number; to: number; part: string; marks?: [number, number][] }[] = [];
let last: number[] | null = null, lastPart = "", yawPrev = 0;
const unwrap = (y: number, prev: number) => { let v = y; while (v - prev > Math.PI) v -= 2 * Math.PI; while (v - prev < -Math.PI) v += 2 * Math.PI; return v; };
for (let f = 0; f < N; f++) {
  const t = f / FPS, g = gooseAt(t);
  if (!g) {   // not in the shot: he holds where he was, standing
    frames.push(last ? [...last.slice(0, 9), 0] : [0, 0, -3.5, 0, 1, 0, 0, 1, 0, 0]);
    continue;
  }
  const cut = g.part !== lastPart;
  const yaw = cut ? g.yaw : unwrap(g.yaw, yawPrev); yawPrev = yaw;
  const { part, k } = beatAt(t);
  const eye = "eye" in part ? swampCam(part, k, [g.p[0], g.p[1], g.p[2]]).eye : [0, 1, 0];
  const r = [g.p[0], g.p[1], g.p[2], yaw, g.grounded ? 1 : 0, 0, eye[0], eye[1], eye[2], cut ? 1 : 0].map((v) => +v.toFixed(4));
  frames.push(r); last = r;
  const m = moves[moves.length - 1];
  if (cut || !m || m.name !== g.move) moves.push({ name: g.move, from: bt(t), to: bt(t + 1 / FPS), part: g.part, ...(g.marks ? { marks: g.marks.map(([s, y]) => [bt(g.start + s), y]) } : {}) });
  else m.to = bt(t + 1 / FPS);
  lastPart = g.part;
}

// ---- the keys he lands on as he types ([land, leave, trick] in beats), and the feet he lifts and slams on purpose
const strikes: [number, number, string][] = [];
const lifts: { foot: "L" | "R"; up: number; top: number; hold: number; down: number; h: number; fwd: number }[] = [];
for (const p of gooseParts()) {
  const g = p.goose;
  if (g.hops?.length) {
    const seg = p.seconds / g.hops.length;
    g.hops.forEach((_, i) => strikes.push([bt(p.start + i * seg), bt(p.start + i * seg + ON_KEY * seg), "hop"]));
  }
  if (g.move === "stomp" || g.move === "power") {   // a foot up, held, and slammed: one a stomp part, the right; power hits harder, late
    const s = p.start, d = p.seconds, at = g.move === "power" ? s + d * 0.8 : s + Math.min(d * 0.45, 1.1);
    lifts.push({ foot: "R", up: bt(at - 0.55), top: bt(at - 0.3), hold: bt(at - 0.09), down: bt(at), h: g.move === "power" ? 0.42 : 0.3, fwd: 0.12 });
  }
}

// ---- the bill: open on each honk in the soundtrack
const honks = CUES.filter((c) => /honk/.test(c.src)).map((c) => c.t);
const open = Array.from({ length: N }, (_, f) => {
  const t = f / FPS;
  return +Math.max(0, ...honks.map((h) => { const u = t - h; return u < -0.04 || u > 0.42 ? 0 : u < 0 ? 1 + u / 0.04 : u < 0.3 ? 1 : 1 - (u - 0.3) / 0.12; })).toFixed(3);
});

// ---- the end song's beat, so the dance in 11 keeps it: a film second t is the song's (t - at + from)
const song = { at: SONG.at, from: SONG.from, g0: show.g0 };

await Bun.write(`${OUT}/root.json`, JSON.stringify({ gs: GS, beat: BEAT, g0: 0, lifts, strikes, frames }));
await Bun.write(`${OUT}/show.json`, JSON.stringify({ fps: FPS, frames: N, bpm: BPM, g0: 0, sections: [], patterns: show.patterns, moves, song, honks }, null, 1));
await Bun.write(`${OUT}/voice.json`, JSON.stringify({ open }));
const on = frames.filter((r) => r[4]).length;
console.log(`${N} frames (${BEATS.length} beats); ${moves.length} moves in ${new Set(moves.map((m) => m.part)).size} shots; ${strikes.length} key hops; ${lifts.length} stomps; ${honks.length} honks; ${on} frames on the ground`);
console.log([...new Set(moves.map((m) => m.name))].join(" "));
