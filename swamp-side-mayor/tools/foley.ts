// tools/foley.ts OUT.wav: the music video's sound. the director's track, with foley placed on the plan's own events (the
// moves in show.json, the key strikes and stomps in root.json, the footprints in steps.json, the cues in plan.ts), so
// every hit lands on the frame its picture does; under the water the song goes muffled and bubbles come up.
// Takes: assets/sfx/NAME-SEED.wav (tools/sfx.sh, SAO, local) and the tutorial's SAO takes in assets (by hash).
// Each take is levelled by its loudest 100 ms before its gain here. Gains were set by measuring each event against the
// song over 250 ms (STEM=foley): the big moments 3-6 dB under it, the character sounds 6-9, footsteps and flutters
// about 12, the beds 14-16 and low-passed (a full-band bed turns to hiss once the film is levelled). The mix is
// written as 48 kHz stereo float; tools/mix.sh brings it to -14 LUFS with a limiter and puts it on the film.
// Every event is also written to out/foley.tsv (seconds, take, gain), to read against the picture.
import { writeFileSync } from "fs";
import { CUE, FPS, FRAMES, FREEZE, FREEZE2, G, KICK, LIFTS, camera } from "../compositions/plan";
import { RUINS } from "../compositions/layout";
import show from "../compositions/show.json";
import rootJ from "../compositions/root.json";
import steps from "../compositions/steps.json";

const OUT = process.argv[2] ?? "out/foley.wav", SR = 48000, LEN = Math.ceil((FRAMES / FPS) * SR);
// which take of each (seed), picked from their spectrograms 11-16 (v7's: risebig 2 builds as it rises where 1 is a flat
// noise bed; keysrise 1 has the distinct squelches; keyhit 2 the cleanest attack; spring 1 the clearest falling boing): step 2 had a hiss bed to its end; shimmer 2 and rise
// 2 swell as their events do; click 2 and ting 2 have the tighter single attacks; plunge 2 lands then bubbles away
const PICK: Record<string, number> = { step: 1, shake: 1, shimmer: 2, rise: 2, crt: 1, click: 2, whoosh: 1, scratch: 1, ting: 2, keysup: 1, plunge: 2, bubbles: 1, paddle: 1, climb: 1, snort: 1, risebig: 2, keysrise: 1, keyhit: 2, spring: 1, ...JSON.parse(process.env.PICK ?? "{}") };
const A = (h: string) => `assets/${h}.wav`;   // the tutorial's takes, by hash
const T = {
  keyClack: A("9f187cc5e05b1f5991dbe74b140b23c7d87136a2a18b473f69b0e9402b1a626e"), enterStomp: A("bab665941631a58c06fa03e1bb36194425d21d924080233f625ecf6285844949"),
  clunk: A("26b2a1fdea3b2296d9957ae3c17761ec5c5d3f67574d13a6ab0b7ab372dee5e8"), splash: A("8282294932680d3a9be4f0d7ad2d0d194f9bc5e9c3b6d050c143f6a428d4c6f5"),
  wings: A("2547faa398ec4d0c7a98957b4f1dea4f9eda7253a283a37e33222d09fda5973f"), frogPlop: A("2b1b415535eb5b339b599e52236d69087f14c8714541aa4416e15f70caad54c9"),
  frogCroak: A("f50939697754c65ac666c0def592e19b682be8c20f1e602e0291c6fd9886cc3c"), heron: A("9addda40ddb66cf1a9bbb462286aa60fda755d06ad881fd072b9e33fe9a1c82c"),
  mudGlass: A("fce93009160e1d592a0c06477825a1482663699b82e7b44326b88546f25ee02e"), honkProud: A("92ad47b6a2b7bbdf30accb1e8fb77d01585143bdd94337f76b9b5869186d9c39"),
  honkOffended: A("aac0f67dc5b99b42a767c8269df6ad31789fb50e3ec0d911ec1ac901fd29f049"), pond: A("72cc34104a113337b522ef53eedbd1fff1f47d35236314aeac936e3b6976a0d4"),
};
const S = (name: string, seed?: number) => `assets/sfx/${name}-${seed ?? PICK[name] ?? 1}.wav`;

// ---- reading and levelling takes
const cache = new Map<string, Float32Array>();
function load(path: string): Float32Array {
  const hit = cache.get(path); if (hit) return hit;
  const r = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"]);
  if (r.exitCode !== 0) throw new Error(`can't read ${path}: ${r.stderr}`);
  const b = r.stdout, x = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4).slice();
  // level: the loudest 100 ms (RMS over both channels) to -18 dBFS
  const w = Math.floor(SR * 0.1) * 2; let best = 0;
  for (let i = 0; i + w <= x.length; i += w / 4) { let s = 0; for (let j = i; j < i + w; j++) s += x[j] * x[j]; best = Math.max(best, Math.sqrt(s / w)); }
  const k = best > 0 ? 10 ** (-18 / 20) / best : 1; for (let i = 0; i < x.length; i++) x[i] *= k;
  // round off any transient more than 12 dB over that (soft, tanh): keysup-1 has one click 6 dB over the rest of its
  // rattle, which came out of the AAC 2 dB over the limiter's ceiling
  const c = 10 ** (-6 / 20); for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > c * 0.5) x[i] = Math.sign(x[i]) * (c * 0.5 + c * 0.5 * Math.tanh((Math.abs(x[i]) - c * 0.5) / (c * 0.5)));
  // v8: a take's silent tail cut off, so it ends on sound: SAO takes end in up to 0.6 s of silence, and a bed looping a
  // take at its full length crossfaded into that silence (the bubbles dropped dead at 5.4 s of 6, raea check heard the
  // paddling dip at 69.0 and 78.3 s). The take now ends 60 ms past its last 10 ms over -46 dB of its loudest
  { const n = x.length >> 1, h = Math.floor(SR * 0.01); let last = n;
    for (let i = n - h; i >= 0; i -= h) { let s = 0; for (let j = i * 2; j < (i + h) * 2; j++) s += x[j] * x[j]; if (Math.sqrt(s / (2 * h)) > 10 ** (-18 / 20) * 10 ** (-28 / 20)) { last = Math.min(n, i + h + Math.floor(SR * 0.06)); break; } }
    if (last < n) { const y = x.slice(0, last * 2); cache.set(path, y); return y; } }
  cache.set(path, x); return x;
}
/** where a take's peak is, in frames (stereo pairs) from its start */
function peakAt(x: Float32Array): number { let m = 0, at = 0; for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > m) { m = Math.abs(x[i]); at = i >> 1; } return at; }

// ---- the bus
const mix = new Float32Array(LEN * 2), log: string[] = [];
type Ev = { at: number; take: string; db: number; hit?: boolean; len?: number; fadeIn?: number; fadeOut?: number; pan?: number; lp?: number; what: string };
function place(e: Ev) {
  const x = load(e.take), g = 10 ** (e.db / 20), n = x.length >> 1;
  const start = Math.round(e.at * SR) - (e.hit ? peakAt(x) : 0), len = Math.min(n, e.len ? Math.round(e.len * SR) : n);
  // v7: a take over 0.8 s ends on a 0.3 s fade, not 30 ms (raea check heard the rise's rumble, the climb-out and
  // others "stop dead" where a take or its len ran out); a short hit keeps its crisp end
  const fi = Math.max(1, Math.round((e.fadeIn ?? 0.004) * SR)), fo = Math.max(1, Math.round((e.fadeOut ?? (len / SR > 0.8 ? 0.3 : 0.03)) * SR));
  const pl = Math.min(1, 1 - (e.pan ?? 0)), pr = Math.min(1, 1 + (e.pan ?? 0));
  const src = e.lp ? lowpass(x.subarray(0, len * 2), e.lp) : x;
  for (let i = 0; i < len; i++) { const o = start + i; if (o < 0 || o >= LEN) continue;
    const env = Math.min(1, i / fi, (len - i) / fo); mix[o * 2] += src[i * 2] * g * env * pl; mix[o * 2 + 1] += src[i * 2 + 1] * g * env * pr; }
  log.push(`${e.at.toFixed(3)}\t${e.take.replace("assets/", "")}\t${e.db}\t${e.what}\t${((start + len) / SR).toFixed(3)}`);
}
/** a bed from `from` to `to` seconds, the take looped with crossfades */
function bed(from: number, to: number, take: string, db: number, what: string, xf = 0.6, lp?: number) {
  const n = (load(take).length >> 1) / SR; let t = from;
  while (t < to - 0.05) { const len = Math.min(n, to - t + xf); place({ at: t, take, db, len, fadeIn: t === from ? 0.25 : xf, fadeOut: xf, lp, what }); t += n - xf; }
}
/** two cascaded biquad low-passes (24 dB an octave) */
function lowpass(x: Float32Array, hz: number): Float32Array {
  const y = Float32Array.from(x), w0 = (2 * Math.PI * hz) / SR, al = Math.sin(w0) / (2 * Math.SQRT1_2), c = Math.cos(w0), a0 = 1 + al;
  const b0 = (1 - c) / 2 / a0, b1 = (1 - c) / a0, b2 = b0, a1 = (-2 * c) / a0, a2 = (1 - al) / a0;
  for (let pass = 0; pass < 2; pass++) for (let ch = 0; ch < 2; ch++) { let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = ch; i < y.length; i += 2) { const v = y[i], o = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = o; y[i] = o; } }
  return y;
}

// ---- when the lens is under the water (the picture's own test), as spans in seconds
const wet: [number, number][] = []; { let a = -1; for (let f = 0; f <= FRAMES; f++) { const u = f < FRAMES && !!camera(f / FPS).under; if (u && a < 0) a = f; if (!u && a >= 0) { wet.push([a / FPS, f / FPS]); a = -1; } } }
const mv = (name: string) => { const m = show.moves.find((x) => x.name === name); if (!m) throw new Error(`no move ${name}`); return m; };

// ---- the song: muffled and a little lower under the water, eased in and out over 80 ms (STEM=foley leaves it out,
// to measure the foley against it)
if (process.env.STEM !== "foley") {
  const raw = Bun.spawnSync(["ffmpeg", "-v", "error", "-i", "assets/music/swamp-side-mayor-90.wav", "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"]).stdout;
  const dry = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4).slice(), lp = lowpass(dry, 650);
  const r = 0.08;
  for (let i = 0; i < Math.min(LEN, dry.length >> 1); i++) { const t = i / SR; let w = 0;
    for (const [a, b] of wet) w = Math.max(w, Math.min(1, Math.max(0, (t - a + r) / r), Math.max(0, (b + r - t) / r)));
    for (let ch = 0; ch < 2; ch++) mix[i * 2 + ch] += dry[i * 2 + ch] * (1 - w) + lp[i * 2 + ch] * w * 0.75; }
  log.push(`0.000\tmusic/swamp-side-mayor-90.wav\t0\tthe song; muffled under the water: ${wet.map(([a, b]) => `${a.toFixed(2)}-${b.toFixed(2)}`).join(", ")}`);
}

// ---- the swamp: a bed under "made in raea" (the song comes in at about 2.5 s), low under the opening swim
place({ at: 0, take: T.pond, db: -8, len: 2.9, fadeIn: 0.3, fadeOut: 0.9, what: "the swamp under the intro" });
bed(2.2, G(mv("swim").to), T.pond, -16, "the swamp, low, under the swim", 0.6, 2500);
// swimming on the surface: the opening, the laps round the computer (above the water), the swim home
bed(0.4, G(mv("swim").to), S("paddle"), -14, "paddling: the opening swim", 0.6, 2500);
{ const a = G(mv("circle").from), b = G(mv("swimhome").to); let t = a;
  for (const [w0, w1] of [...wet, [b, b]] as [number, number][]) { if (w1 <= a) continue; const e = Math.min(w0, b); if (e - t > 0.4) bed(t, e, S("paddle"), -11, "paddling round the computer, home", 0.6, 2500); t = Math.max(t, w1); } }
// under the water: bubbles
for (const [a, b] of wet) bed(a, b, S("bubbles"), -5, "under the water: bubbles", 0.3);
// v7: the orbit's lens going through the surface, under and back up (the plunge's go by cuts): a short slosh each way
for (const [a, b] of wet) if (camera(a + 0.01).shot.orbit) {
  place({ at: a - 0.02, take: T.splash, db: -16, len: 0.5, fadeOut: 0.25, lp: 2200, what: "the lens dips under the surface" });
  place({ at: b - 0.02, take: T.splash, db: -13, len: 0.6, fadeOut: 0.3, what: "the lens breaks back up through the surface, water on the glass" }); }

// ---- the goose
place({ at: G(mv("climb").from) + 0.15, take: S("climb"), db: -8, what: "it climbs out onto the mud" });
// v7 (the director 11-16: "stepping sfx across the video can be brought way lower in the mix"): 12 dB down
steps.prints.forEach((p: { f: number }, i: number) => place({ at: p.f / FPS, take: S("step"), db: i % 2 ? -25 : -23, hit: true, pan: i % 2 ? 0.15 : -0.15, what: "a footstep in the mud" }));
place({ at: G(mv("shakeoff").from) + 0.12, take: S("shake"), db: -1, what: "the wet shake" });
place({ at: G(mv("call").from) + 0.1, take: T.honkProud, db: -3, hit: true, what: "the call: a proud honk" });
for (const l of LIFTS) { place({ at: G(l.down), take: S("step", 1), db: -5, hit: true, what: `stomp ${l.foot}` }); place({ at: G(l.down), take: T.mudGlass, db: -16, hit: true, what: `stomp ${l.foot}, the squelch` }); }

// ---- the summoning and the computer
// v7 (the director 11-16: "it's a pentagram, so it should sound kind of sinister", subtle whooshes): a low swirl as the circle
// spreads, and a dark whoosh as each stone's runes catch (film.tsx magicOn = sm((b - light) / 2.6); ruins.tsx Magic
// lights stone i at on = 0.15 + 0.1 i, full at + 0.3), panned to where the stone stands
place({ at: G(CUE.light) - 0.2, take: S("sinister", 1), db: -7, len: 3, fadeIn: 0.4, fadeOut: 1.2, what: "the circle spreads: a low swirl" });
{ const smI = (y: number) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; (m * m * (3 - 2 * m) < y ? (lo = m) : (hi = m)); } return lo; };
  RUINS.filter((r) => r.runes !== undefined).forEach((r, i) => { const at = G(CUE.light + 2.6 * smI(Math.min(0.99, 0.2 + 0.1 * (r.runes ?? i))));
    place({ at, take: S("sinister", 2), db: -12, len: 1.3, fadeIn: 0.05, fadeOut: 0.6, pan: Math.max(-0.6, Math.min(0.6, r.at[0] / 9)), what: `stone ${r.runes}'s runes catch: a dark whoosh` }); }); }
// v7 (the director 11-16: "would be good to hear this come up"): a big grinding rise with water pouring off it, over the old one
place({ at: G(CUE.boil), take: S("risebig"), db: 1, len: G(CUE.boil + CUE.up) - G(CUE.boil) + 1.0, fadeIn: 0.6, fadeOut: 1.0, what: "the computer rises out of the pond: grinding, pouring" });
place({ at: G(CUE.boil), take: S("rise"), db: -6, len: G(CUE.boil + CUE.up) - G(CUE.boil) + 1.2, fadeOut: 1.2, what: "the computer rises: the rumble under it" });
place({ at: G(31.2), take: T.frogPlop, db: -11, hit: true, what: "the frog lands on its pad (layout.ts leap 29.2-31.2)" });
place({ at: G(31.15), take: S("snort"), db: -14, hit: true, what: "the deer's head comes up (v8: it raises its head and holds, layout.ts)" });
place({ at: G(CUE.boot), take: S("crt"), db: -4, hit: true, what: "the computer switches on" });
place({ at: G(CUE.boot + 0.4), take: S("keyhit"), db: -9, hit: true, what: "the cat springs out of the case (machine.tsx catOut)" });
place({ at: G(CUE.app), take: S("click"), db: -14, hit: true, what: "the app comes up" });

// ---- the slide: the app's cursor (film.tsx: selected 57.6, grabbed 57.95, let go 59.45)
place({ at: G(57.6), take: S("click"), db: -4, hit: true, what: "the cursor selects it" });
place({ at: G(57.95), take: S("click"), db: -3, hit: true, what: "the cursor grabs it" });
place({ at: G(59.45), take: S("click"), db: -4, hit: true, what: "the cursor lets go" });

// ---- DUCK?: the crash zoom lands on the freeze; a scratch; it honks, offended; the card lets go
place({ at: G(FREEZE[0]), take: S("whoosh"), db: -3, hit: true, what: "the crash zoom" });
place({ at: G(FREEZE[0]), take: S("scratch"), db: -2, hit: true, what: "the freeze" });
place({ at: G(FREEZE[0] + 0.5), take: T.honkOffended, db: -2, hit: true, what: "DUCK? it honks, offended" });
place({ at: G(FREEZE[1]), take: S("whoosh"), db: -12, hit: true, what: "the card lets go" });
// v9: the second "duck": the same crash and scratch on the blue card, the cigarette's plop as it hits the water
place({ at: G(FREEZE2[0]), take: S("whoosh"), db: -3, hit: true, what: "the second crash zoom" });
place({ at: G(FREEZE2[0]), take: S("scratch"), db: -2, hit: true, what: "the second freeze" });
place({ at: G(FREEZE2[0]) + 0.62, take: T.splash, db: -18, len: 0.4, fadeOut: 0.2, lp: 3000, what: "the cigarette plops into the water" });
place({ at: G(FREEZE2[1]), take: S("whoosh"), db: -12, hit: true, what: "the blue card lets go" });
place({ at: G(68.9), take: S("ting"), db: -1, hit: true, what: "the crown" });

// ---- the keys: summoned, then hit one by one, tricks in the air, ENTER
// v7 (the director 11-16: "better foley here", "sound of emerging keyboard"): the summoning's dark swirl, and the keyboard dragged
// up out of the mud, loud, with the keys' rattle under it
place({ at: G(CUE.keys) - 0.25, take: S("sinister", 1), db: -8, len: 2.6, fadeIn: 0.3, fadeOut: 1.0, what: "the keys' summoning: a low swirl" });
place({ at: G(CUE.keys) + 0.05, take: S("keysrise"), db: 0, len: G(CUE.keys + CUE.keysUp) - G(CUE.keys) + 0.6, fadeOut: 0.6, what: "the keyboard drags up out of the mud" });
place({ at: G(CUE.keys) + 0.2, take: S("keysup"), db: -7, what: "the keys rattle up out of the mud" });
// v7 (the director 11-16: "keystroke sounds, I don't hear them"): a big chunky clack on every key it lands on, over the old
// thump; a whoosh off the bigger hops (with the speed lines), wings on the first
for (const [from, to, kind] of rootJ.strikes as [number, number, string][]) {
  if (kind === "leap") continue;
  place({ at: G(from), take: S("keyhit"), db: 1, hit: true, what: `a key: ${kind}: the clack` });
  place({ at: G(from), take: T.keyClack, db: -8, hit: true, what: `a key: ${kind}: its thump` });
  if (kind === "takeoff") place({ at: G(to) + 0.05, take: T.wings, db: -9, what: `wings: ${kind}` });
  else if (kind === "hop") place({ at: G(to) + 0.02, take: S("whoosh"), db: -14, hit: true, what: "a big hop: a whoosh" });
}
// v7: ENTER as a trampoline (plan.ts enterSpring): it lands (92), the key springs it back up (92.2), it lands again
// harder (92.46) and is flung off (92.6)
place({ at: G(CUE.enter), take: T.enterStomp, db: 2, hit: true, what: "ENTER" });
place({ at: G(CUE.enter), take: T.clunk, db: -6, hit: true, what: "ENTER, the key's clunk" });
place({ at: G(CUE.enter + 0.2), take: S("spring"), db: -3, hit: true, what: "ENTER springs it back up" });
place({ at: G(CUE.enter + 0.46), take: S("keyhit"), db: -1, hit: true, what: "down on ENTER again" });
place({ at: G(CUE.launch), take: S("spring"), db: 0, hit: true, what: "ENTER flings it off" });
place({ at: G(CUE.launch), take: T.wings, db: -7, what: "it launches off the key" });

// ---- the dive, seen from under the water
place({ at: G(CUE.dive), take: S("plunge"), db: -4, hit: true, what: "the plunge" });
place({ at: G(CUE.dive), take: T.splash, db: -14, hit: true, lp: 1100, what: "the splash above, through the water" });

// ---- the critters after ENTER
place({ at: G(102.6), take: T.frogCroak, db: -4, hit: true, what: "the frog's joy (layout.ts heart 102.6)" });
// v8: the film going up to the four networks (screens.tsx Upload: each bar fills over 20 frames, 3 apart, from 2328):
// a soft whoosh as it starts, a ting as each one turns to Posted
place({ at: 2351 / 30, take: S("whoosh"), db: -20, len: 0.9, fadeOut: 0.4, lp: 5000, what: "the film starts going up" });
for (let k = 0; k < 4; k++) place({ at: (2351 + k * 2 + 12) / 30, take: S("ting"), db: -17 - 2 * k, hit: true, len: 0.6, pan: -0.3 + 0.2 * k, what: `posted (${["YouTube", "TikTok", "Instagram", "X"][k]})` });
// v7: each watcher's own shot after the post (plan.ts S(119), S(120), S(121)): the crash in, and its cry
for (const [b0, take, db, what] of [[119, S("snort"), -6, "the deer"], [120, T.heron, -5, "the heron"], [121, T.frogCroak, -4, "the frog"]] as [number, string, number, string][]) {
  place({ at: G(b0) - 0.06, take: S("whoosh"), db: -9, hit: true, what: `${what}'s shot: the crash in` });
  place({ at: G(b0 + 0.08), take, db, hit: true, what: `${what}'s cry` });
}

// ---- home: out of the water and onto the lens
place({ at: G(mv("stamp").from) + 0.1, take: S("climb"), db: -5, what: "out of the water" });
place({ at: G(KICK.from), take: S("whoosh"), db: -7, hit: true, what: "the jump kick: it leaps at the lens" });
place({ at: G(KICK.hit), take: T.mudGlass, db: -2, hit: true, what: "its foot on the lens (plan.ts KICK.hit)" });
place({ at: G(KICK.back), take: S("step", 1), db: -12, hit: true, what: "it lands back on the mud" });

// ---- out: raw float for mix.sh, and the cue sheet
writeFileSync(OUT.replace(/\.wav$/, ".f32"), Buffer.from(mix.buffer));
writeFileSync("out/foley.tsv", "seconds\ttake\tgain dB\twhat\tends\n" + log.sort((a, b) => parseFloat(a) - parseFloat(b)).join("\n") + "\n");
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
console.log(`${log.length} events, ${wet.length} spans under the water, peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS -> ${OUT.replace(/\.wav$/, ".f32")}`);
