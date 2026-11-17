// The film as numbers: the song's grid, the goose's moves on the lyrics (show.json), where it is and how it is turned
// every instant, its feet's lifts, the machine's rise, the keys it types on (one hop a beat or half beat, a trick on
// every long one), the swim round the computer after ENTER, what the computer shows, and the lens. Everything the
// picture draws reads this; the goose's body is the one clip "show" baked from the same grid (blender/goose_build.py),
// its feet planted against root.json (tools/root.ts writes it from here).
import show from "./show.json";
import tracks from "./goose.json";
import { height, WATER } from "./set";

export type V3 = [number, number, number];
export const FPS = show.fps, FRAMES = show.frames, SECONDS = FRAMES / FPS;
export const BEAT = 60 / show.bpm, G = (b: number) => show.g0 + b * BEAT, beatAt = (t: number) => (t - show.g0) / BEAT;
/** "build" is after ENTER: the goose swims round the computer while the agent makes the film (until v5 the trip into
 * the app, so "trip" stays as its other name for the files that still ask for it) */
export type Sec = "hello" | "verse" | "dance" | "summon" | "rise" | "type" | "build" | "trip" | "home";
export const SEC = Object.fromEntries(show.sections.map((s) => [s.name, [s.from, s.to] as [number, number]])) as Record<Sec, [number, number]>;
SEC.trip = SEC.build;
export const sectionAt = (b: number) => (show.sections.find((s) => b >= s.from && b < s.to) ?? show.sections[b < 0 ? 0 : show.sections.length - 1]).name as Sec;
export type Move = { name: string; from: number; to: number };
export const MOVES = show.moves as Move[];
export const moveAt = (b: number) => { const m = MOVES.find((x) => b >= x.from && b < x.to) ?? MOVES[b < 0 ? 0 : MOVES.length - 1]; return { ...m, u: Math.min(1, Math.max(0, (b - m.from) / (m.to - m.from))) }; };
export const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const sm5 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * x * (x * (6 * x - 15) + 10));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const mix3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const GS = 1.7;   // the goose, a little larger than life: 1.1 m to the top of its head
const span = (b: number, a: number, c: number) => sm((b - a) / (c - a));
/** walking pace along 0..1: eases in and out over the first and last 15%, steady between */
const walk = (u: number, a = 0.15) => { u = Math.min(1, Math.max(0, u)); const k = 2 * a * (1 - a); return u < a ? (u * u) / k : u > 1 - a ? 1 - ((1 - u) * (1 - u)) / k : (u - a / 2) / (1 - a); };
const bez = (p: V3[], u: number): V3 => { const a = 1 - u; return [0, 1, 2].map((i) => a * a * a * p[0][i] + 3 * a * a * u * p[1][i] + 3 * a * u * u * p[2][i] + u * u * u * p[3][i]) as V3; };
const heading = (p: V3[], u: number) => { const a = bez(p, Math.max(0, u - 0.01)), c = bez(p, Math.min(1, u + 0.01)); return Math.atan2(c[0] - a[0], c[2] - a[2]); };
const hop = (b: number, up: number, down: number, h: number) => (b > up && b < down ? h * 4 * ((b - up) / (down - up)) * (1 - (b - up) / (down - up)) : 0);

// ---- the machine: a monitor standing in the pond and a keyboard on the near shore, both up out of the water and mud
export const MON = { c: [0, 3.9, -12.5] as V3, size: [8.4, 6.6, 4.2] as V3, screen: [6.8, 4.7] as [number, number] };
/** the screen's face (the glass), in the world, once the monitor is up */
export const SCREEN = { c: [0, 4.15, -12.5 + 2.1 - 0.39] as V3, w: 6.8, h: 4.7 };
/** a point on the screen from the picture's own 0..1 (across, down) */
export const onScreen = (u: number, v: number): V3 => [SCREEN.c[0] + (u - 0.5) * SCREEN.w, SCREEN.c[1] + (0.5 - v) * SCREEN.h, SCREEN.c[2]];
export const KB = { c: [0, 0.34, 0.4] as V3, pitch: 0.5, key: [0.44, 0.17, 0.44] as V3, tilt: 0.1 };
// a whole keyboard as a typist sees it from the front (+z): [character, label, width]. ISO, for the old tall enter: its
// top in the Q row ("\n"), its foot in the A row ("\n~"), one key in two parts
const ROWS: [string, string, number][][] = [
  [..."`1234567890-=".split("").map((c) => [c, c, 1] as [string, string, number]), ["\b", "back", 2]],
  [["\t", "tab", 1.5], ..."qwertyuiop[]".split("").map((c) => [c, c.toUpperCase(), 1] as [string, string, number]), ["\n", "enter", 1.5]],
  [["caps", "caps", 1.75], ..."asdfghjkl;'#".split("").map((c) => [c, c.toUpperCase(), 1] as [string, string, number]), ["\n~", "", 1.25]],
  [["shiftL", "shift", 1.25], ["\\", "\\", 1], ..."zxcvbnm,./".split("").map((c) => [c, c.toUpperCase(), 1] as [string, string, number]), ["shiftR", "shift", 2.75]],
  [["ctrlL", "ctrl", 1.5], ["altL", "alt", 1.5], [" ", "", 9], ["altR", "alt", 1.5], ["ctrlR", "ctrl", 1.5]],
];
export type Key = { ch: string; label: string; at: V3; w: number; col: number; row: number };
export const KEYS: Key[] = ROWS.flatMap((row, r) => { let x = 0; return row.map(([ch, label, w]) => { const k = { ch, label, w, col: x + w / 2 - 7.5, row: r - 2, at: keyAt(x + w / 2 - 7.5, r - 2) }; x += w; return k; }); });
// a key's centre: the keyboard's own plane (x across, z toward the typist, caps 0.2 up) turned by its tilt, back raised
export function keyAt(col: number, row: number): V3 { const z = row * KB.pitch, c = Math.cos(KB.tilt), sn = Math.sin(KB.tilt); return [KB.c[0] + col * KB.pitch, KB.c[1] + 0.2 * c - z * sn, KB.c[2] + 0.2 * sn + z * c]; }
export const TYPED = show.typed + "\n";
export const keyOf = (ch: string) => KEYS.find((k) => k.ch === ch) ?? KEYS[0];
/** where it stands on the tall enter: both feet on its foot, where the two parts meet */
export const ENTER: V3 = keyAt(keyOf("\n~").col, -0.45);
// ---- the typing: each key landed on, on the beat or the half beat, and how it gets there. A long hop (a whole beat)
// carries a trick (a spin, a flip, a barrel roll), a short one is a skip; the space bar it lands on at one end and
// surfs to the other; the last is a leap with a flip that comes down on ENTER with both feet on "dip."
export type Trick = "takeoff" | "skip" | "hop" | "spin" | "flip" | "roll" | "slide" | "leap";
export type Strike = { ch: string; land: number; leave: number; trick: Trick; at: V3; end: V3; h: number };
const LANDS = [75, 76, 77, 78, 78.5, 79, 80, 80.5, 81, 81.5, 83, 83.5, 84.5, 85.5, 86.5, 87, 87.5, 88, 89, 89.5, 90.5, 92];
// v7 (the director 11-16 on v6: "it can't be doing flips and stuff, just have it be some kind of dynamic animation system with
// weighting and Disney animation principles"): no spins, flips or rolls. A long hop is a big weighted hop, a short one
// a skip, the space bar a surf, and ENTER the biggest jump of all, which it comes down on like a trampoline
const TRICKS: Trick[] = ["takeoff", "hop", "hop", "hop", "skip", "skip", "hop", "skip", "skip", "slide", "skip", "skip", "hop", "hop", "hop", "skip", "skip", "skip", "hop", "skip", "hop", "leap"];
const SPACE_X: Record<number, [number, number]> = { 4: [-0.6, -0.6], 7: [-2.0, -2.0], 9: [-2.0, 0.45], 15: [-1.1, -1.1] };   // where on the space bar (it's 4.5 m long)
const HIGH: Record<Trick, number> = { takeoff: 1.0, skip: 0.32, hop: 0.72, spin: 0.72, flip: 0.72, roll: 0.72, slide: 0.45, leap: 1.9 };
const STAND = 0.1;   // its feet stand this far over a cap's middle: on the cap's top
export const STRIKES: Strike[] = TYPED.split("").map((ch, i) => {
  const trick = TRICKS[i], land = LANDS[i], k = keyOf(ch), sx = SPACE_X[i];
  const at: V3 = ch === "\n" ? [ENTER[0], ENTER[1] + STAND, ENTER[2]] : sx ? keyAt(sx[0] / KB.pitch, 2).map((v, j) => v + (j === 1 ? STAND : 0)) as V3 : [k.at[0], k.at[1] + STAND, k.at[2]];
  const end: V3 = sx ? keyAt(sx[1] / KB.pitch, 2).map((v, j) => v + (j === 1 ? STAND : 0)) as V3 : at;
  return { ch, land, leave: land, trick, at, end, h: HIGH[trick] };
});
// how long it stays on a key before the next hop: a breath before a skip, a crouch to wind up before a trick
STRIKES.forEach((s, i) => { const nx = STRIKES[i + 1]; s.leave = s.trick === "slide" ? s.land + 1 : !nx ? s.land + 0.6 : s.land + (nx.trick === "skip" ? 0.1 : nx.trick === "leap" ? 0.32 : 0.2); });
/** the beat each character is struck on */
export const strikeBeat = (i: number) => STRIKES[Math.max(0, Math.min(STRIKES.length - 1, i))].land;
export const typedAt = (b: number) => STRIKES.filter((s) => b >= s.land).length;
/** how far a key is pushed down at beat b (0..1): slammed on the landing, held while it stands (and while it surfs the
 * space bar), let up as it leaves; ENTER goes down hard and stays */
export const pressed = (k: Key, b: number) => {
  const ch = k.ch === "\n~" ? "\n" : k.ch; let m = 0;
  for (const s of STRIKES) if (s.ch === ch) {
    if (b < s.land - 0.03) continue;
    if (ch === "\n") { m = Math.max(m, enterSpring(b).press); continue; }   // v7: a trampoline, see enterSpring
    const hold = s.leave, d = b - hold;
    m = Math.max(m, b < hold ? 1 : 1 - sm(d / 0.25));
  }
  return m;
};
// ---- when things happen, in beats: the summoning in the first verse, the screen booting, the keys after the hook
export const CUE = { light: 22.2, boil: 26, up: 6.2, boot: 31.6, app: 33.4, keys: 72.15, keysUp: 2.4, flash: 121.9, out: 122.6, splash: 124.75, enter: 92, launch: 92.6, dive: 94.25 };
/** ENTER as a trampoline (v7, the director 11-16: "when it makes impact ... have it bounce like a trampoline off it"): it comes
 * down on it and drives it down, is thrown back up off it, comes down again harder and is flung out over the pond.
 * press: how far the key is down (1 all the way; below 0 it springs past its rest), y: the goose's height off it,
 * squash: how flat the goose is pressed */
export function enterSpring(b: number) {
  const d = b - CUE.enter, L = CUE.launch - CUE.enter;
  if (d < 0) return { press: 0, y: 0, squash: 0 };
  if (d < 0.2) { const u = d / 0.2, pr = Math.sin(Math.PI * Math.min(1, u * 1.15)) * (u < 0.87 ? 1 : 0); return { press: Math.max(0, pr), y: 0, squash: Math.max(0, Math.sin(Math.PI * u)) }; }
  if (d < 0.46) { const u = (d - 0.2) / 0.26; return { press: -0.22 * Math.sin(Math.PI * u) * Math.exp(-u), y: 0.42 * 4 * u * (1 - u), squash: -0.12 * Math.sin(Math.PI * u) }; }
  if (d < L) { const u = (d - 0.46) / (L - 0.46); return { press: Math.sin((Math.PI / 2) * Math.min(1, u * 1.1)), y: 0, squash: Math.sin((Math.PI / 2) * Math.min(1, u * 1.1)) * 1.15 }; }
  const k = (d - L) / 0.3; return { press: Math.exp(-k * 1.6) * Math.cos(2 * Math.PI * k * 0.9), y: 0, squash: 0 };   // let go: the key springs back and rings
}
// ---- what the big screen shows after ENTER: the real raea app making this film (headless captures, 1360 x 940, the
// screen's own shape): the prompt sent, the files coming, the film in the feed, the film playing, a note, publish
export type Rect = [number, number, number, number];
// `seq`: pictures shown one after another, `every` beats each, so the screen keeps moving
export type Shown = { img: string; from: number; reveal?: Rect; film?: Rect; seq?: string[]; every?: number; clay?: boolean; live?: string };
const V7 = (n: string) => `app/v7-${n}`;
// v7 (the director 11-16 on v6: "we shouldn't see the feed here, just the agent working", "we should see it continuing to work,
// not a static chat", "very focused on showing tools, artboards, scripts, music", "use more of this time to show the
// platform and actual features"): the raea app at work on this film, captured in a scratch copy of the app with a
// stand-in agent streaming its tool calls (tools/take, assets/app/v7-*): the chat's tool rows, the code it changed, the
// cast live on a board, the score, the script, the edit's timeline, the plan's tasks; never the feed
export const SHOWN: Shown[] = [
  { img: V7("agent-a"), from: 92 },
  { img: V7("agent-b"), from: 93.6 },
  { img: V7("agent-code"), from: 95.4 },
  // each shot that faces the screen gets something new (v7 stills: the score and the board had landed under shots
  // that never see it): the chat at work, the cast board, the score, the film, the edit, the score and the script
  { img: V7("agent-c"), from: 97.5, seq: [V7("agent-c"), V7("agent-code"), V7("agent-sound"), V7("agent-d")], every: 0.625 },
  { img: V7("board-0"), from: 100, seq: [0, 1, 2, 3, 4, 5].map((i) => V7(`board-${i}`)), every: 0.42 },
  { img: V7("score-0"), from: 102.5, seq: [0, 1, 2, 3].map((i) => V7(`score-${i}`)), every: 0.5 },
  // v8 (the director 11-16: "let's see this video as some kind of clay animatic or wireframe, and wider so we see the UI"):
  // the player plays the film as clay (tools/clay.sh: film.tsx#goose-clay into assets/app/clay)
  { img: V7("film"), from: 104.5, film: [152, 149, 1272, 709], clay: true },
  { img: V7("edit-0"), from: 110.5, seq: [0, 1, 2, 3].map((i) => V7(`edit-${i}`)), every: 0.5 },
  { img: V7("score-0"), from: 112, seq: [V7("score-0"), V7("score-1"), V7("score-2"), V7("score-3"), V7("script"), V7("script"), V7("av"), V7("av")], every: 0.25 },
  { img: V7("board-0"), from: 113.5, seq: [0, 1, 2, 3, 4, 5].map((i) => V7(`board-${i}`)), every: 0.4 },
  // v8 (the director 11-16: "don't have this comment here", "have this be it uploading to social, then we see it on YouTube"):
  // no note; the Publish page sending it to the four networks, then the video page, its likes climbing (live: a
  // picture per film frame, tools/screens.sh); after the tasks, the page again, still climbing, never a paused frame
  { img: "app/upload", from: 117.1, live: "app/upload" },
  { img: "app/yt", from: 118.1, live: "app/yt" },   // to the end (v9: no tasks after the frog, the director 11-16)
];
export const shownAt = (b: number) => { let i = -1; while (i + 1 < SHOWN.length && SHOWN[i + 1].from <= b) i++; return i < 0 ? null : SHOWN[i]; };
// (v5's views inside the app, kept for the files that still draw them)
export type View = { img: string; from: number; to: number; side: "L" | "R"; word: string; ring: Rect; crop: Rect; bg: string; film?: boolean };
export const VIEWS: View[] = [
  { img: "composer", from: 92, to: 96.5, side: "L", word: "app-type", ring: [96, 798, 252, 830], crop: [64, 340, 670, 940], bg: "#c8126a" },
  { img: "images", from: 96.5, to: 101, side: "R", word: "app-build", ring: [686, 194, 1344, 480], crop: [670, 48, 1360, 640], bg: "#1a63c4" },
  { img: "feed", from: 101, to: 105.5, side: "L", word: "app-feed", ring: [683, 137, 1349, 585], crop: [670, 92, 1360, 812], bg: "#6626d4" },
  { img: "item", from: 105.5, to: 113, side: "R", word: "app-watch", ring: [151, 271, 951, 671], crop: [64, 0, 1360, 940], bg: "#128048", film: true },
  { img: "note", from: 113, to: 118.5, side: "L", word: "app-note", ring: [1058, 826, 1225, 866], crop: [151, 236, 1360, 940], bg: "#c4361a", film: true },
  { img: "publish", from: 118.5, to: 122, side: "R", word: "app-post", ring: [620, 340, 800, 385], crop: [190, 40, 1240, 620], bg: "#0c7480" },
];
export const viewAt = (b: number) => { let i = 0; while (i + 1 < VIEWS.length && VIEWS[i + 1].from <= b) i++; return i; };
/** the film in the app's player: the first hook's frames, cut to the second hook's same words (waddle, duck?, soup) */
const PLAY: [number, number][] = [[104.5, 53.6], [107, 55.9], [115.1, 63.0], [116.9, 65.3], [121, 69.4]];
export const playedBeat = (b: number) => { for (let i = 0; i + 1 < PLAY.length; i++) { const [a0, s0] = PLAY[i], [a1, s1] = PLAY[i + 1]; if (b <= a1 || i + 2 === PLAY.length) return s0 + ((b - a0) / (a1 - a0)) * (s1 - s0); } return PLAY[0][1]; };
/** the machine's rise: the monitor out of the pond in the first verse, the keyboard out of the mud after the hook; how
 * hard the ground shakes */
export const rise = (b: number) => { const m = sm((b - CUE.boil) / CUE.up), k = sm((b - CUE.keys) / CUE.keysUp);
  return { mon: m - 0.02 * Math.sin(b * 9) * m * (1 - m) * 4, kb: k, shake: Math.max(m * (1 - m), k * (1 - k)) * 4 + 0.5 * span(b, CUE.boil - 2.5, CUE.boil) * (b < CUE.boil ? 1 : 0) }; };

// ---- the goose: where its feet stand, how it's turned (yaw about y; it faces +z at 0), tipped and squashed
export type Root = { p: V3; yaw: number; pitch: number; roll: number; s: V3; grounded: boolean; slide: boolean };
import { FLOOR } from "./set";
export const STAGE: V3 = [0, 0, -2.65], HOOK: V3 = [0, 0, -3.4], CALL: V3 = [0, 0, -4.6], SHORE: V3 = [0, 0, -5.3];
/** swimming: where its feet hang under the surface (the water hides all of it below its waterline) */
export const SWIM_Y = WATER - 0.34;
export const TRIP: V3 = [0, 600, 0];
/** where it goes into the pond off ENTER, and the loop it swims round the computer (an ellipse about CIRCLE.c) */
export const SPLASH: V3 = [0.8, SWIM_Y, -10.0];   // v6: out where the pond is a metre deep, so a lens can get under it
export const CIRCLE = { c: [0, -14.2] as [number, number], r: [5.6, 4.6] as [number, number], from: 0.31 + 0.12, laps: (2 * Math.PI - 0.6 - 0.43) / (2 * Math.PI) };   // round the right, behind, the left, to its front left
const loopAt = (th: number): V3 => [CIRCLE.c[0] + CIRCLE.r[0] * Math.sin(th), SWIM_Y, CIRCLE.c[1] + CIRCLE.r[1] * Math.cos(th)];
const loopYaw = (th: number) => Math.atan2(CIRCLE.r[0] * Math.cos(th), -CIRCLE.r[1] * Math.sin(th));
/** how far round the loop it is at beat b: easing in from the plunge, steady, a touch slower at the end */
export const loopTh = (b: number) => CIRCLE.from + 2 * Math.PI * CIRCLE.laps * walk((b - 96) / 28, 0.08);
const LOOP = (th: number): V3 => [FLOOR.c[0] + 1.25 * Math.cos(th), 0, FLOOR.c[1] + 0.75 * Math.sin(th)];
/** squash after a landing on a key: down hard, a bounce past, settled in a third of a beat */
const landSquash = (d: number) => (d < 0 ? 0 : -0.24 * Math.exp(-d / 0.09) * Math.cos((d / 0.32) * 2 * Math.PI));
const bump = (x: number) => Math.exp(-x * x);
export function root(t: number): Root {
  const b = beatAt(t), m = moveAt(b);
  let p: V3 = STAGE, yaw = 0, pitch = 0, roll = 0, sy = 1, grounded = true, slide = false;
  switch (m.name) {
    case "swim": { const P: V3[] = [[-4.2, SWIM_Y, -12.6], [-3.4, SWIM_Y, -9.0], [0.9, SWIM_Y, -8.6], [0, SWIM_Y, -6.4]], u = walk((b - 1.5) / 11, 0.2);
      p = bez(P, u); yaw = heading(P, Math.min(0.995, Math.max(0.005, u))) + 0.12 * Math.sin(b * 0.9); pitch = 0; roll = 0.04 * Math.sin(b * 1.7); sy = 1; grounded = false; break; }
    case "climb": { const u = walk((b - 12.6) / 1.5, 0.3); p = mix3([0, SWIM_Y, -6.4], SHORE, u); p = [p[0], lerp(SWIM_Y, 0.03, sm(u / 0.4)), p[2]]; pitch = -0.18 * Math.sin(Math.PI * u); yaw = 0; grounded = u > 0.65; break; }   // v7: up the steep bank as fast as it rises (it popped up 0.25 m in a frame)
    case "stroll": { const u = walk((b - 14.1) / 3.4); p = mix3(SHORE, STAGE, u); yaw = 0; break; }
    case "shakeoff": case "face": p = STAGE; yaw = 0; break;
    case "strut": { const u = walk((b - 20.7) / 17.9), th = Math.PI / 2 - 2 * Math.PI * u; p = LOOP(th);
      const d = [1.25 * Math.sin(th), -0.75 * Math.cos(th)]; const travel = Math.atan2(d[0], d[1]); const tv = u <= 0 ? Math.PI / 2 : u >= 1 ? Math.PI / 2 - 2 * Math.PI : unwrap(travel, Math.PI / 2 - 2 * Math.PI * u);
      yaw = lerp(lerp(0, tv, span(b, 20, 21.1)), -2 * Math.PI, span(b, 38.6, 39.85)); break; }
    case "stompL": case "stompR": case "shake": p = STAGE; yaw = -2 * Math.PI; break;
    case "sticky": { const P: V3[] = [STAGE, [1.1, 0, -2.3], [1.1, 0, -3.6], HOOK], u = walk((b - 44.1) / 3.2);
      p = bez(P, u); yaw = lerp(lerp(-2 * Math.PI, unwrap(heading(P, Math.min(0.995, Math.max(0.005, u))), -2 * Math.PI + 1.5), span(b, 43.6, 44.5)), -2 * Math.PI, span(b, 47.2, 47.98)); break; }
    case "spin": p = [HOOK[0], hop(b, 48.35, 49.4, 0.24), HOOK[2]]; yaw = -2 * Math.PI + 2 * Math.PI * span(b, 48.42, 49.33); grounded = p[1] < 0.03; sy = 1 + 0.08 * Math.exp(-(((b - 49.45) / 0.12) ** 2)) * -1; break;
    case "quack2": case "mudfoot": case "quack3": p = HOOK; yaw = 0; break;
    case "waddle": { const u = walk((b - 55.95) / 1.9); p = [lerp(0, -1.0, u), 0, HOOK[2]]; yaw = 0.18 * Math.sin(Math.PI * 2 * (b - 55.9)) * (u > 0 && u < 1 ? 1 : 0); break; }
    case "slide": { const u = sm((b - 57.95) / 1.45); p = [lerp(-1.0, 0.6, u), 0, HOOK[2]]; yaw = -0.25 * Math.sin(Math.PI * Math.min(1, u)); roll = 0.08 * Math.sin(Math.PI * Math.min(1, u)); slide = u > 0 && u < 1; break; }
    case "pop": p = [0.6, hop(b, 60.2, 60.85, 0.16), HOOK[2]]; yaw = 0; grounded = p[1] < 0.03; break;
    case "shuffle": { const u = walk((b - 61.2) / 1.6, 0.1); p = mix3([0.6, 0, HOOK[2]], [0.3, 0, -4.7], u); yaw = Math.PI * span(b, 61.0, 62.0); break; }
    case "duck": p = [0.3, 0, -4.7]; yaw = Math.PI; break;   // it answers over its shoulder
    case "soup": p = [0.3, 0, -4.7]; yaw = Math.PI + Math.PI * span(b, 65.35, 66.5); break;
    case "mayor": { const u = walk((b - 66.8) / 3.2); p = mix3([0.3, 0, -4.7], HOOK, u); yaw = 2 * Math.PI + 0.12 * Math.sin(Math.PI * 2 * (b - 66.6) / 2) * (u < 1 ? 1 : 0); break; }
    case "turn": { const u = walk((b - 20.4) / 1.15); p = mix3(STAGE, CALL, u); yaw = Math.PI * span(b, 20, 20.6); break; }   // from the lens to the pond
    case "call": case "behold": p = CALL; yaw = Math.PI; break;
    case "back": { const u = walk((b - 34.7) / 4.6); p = mix3(CALL, STAGE, u); yaw = lerp(Math.PI, 0, span(b, 34, 34.8)); break; }   // it struts back to the lens
    case "keys": p = [HOOK[0], hop(b, 72.35, 72.95, 0.2), HOOK[2]]; yaw = 2 * Math.PI; grounded = p[1] < 0.03; sy = 1 - 0.1 * bump((b - 73.75) / 0.12); break;   // the keys burst up in front of it; it crouches to fly
    case "fly": { const r = typing(b); p = r.p; yaw = r.yaw; pitch = r.pitch; roll = r.roll; sy = r.sy; grounded = false; slide = r.slide; break; }
    case "enter": {   // v7: ENTER as a trampoline (enterSpring): driven down flat and low, thrown back up, down again, flung off
      const e = enterSpring(b); p = [STRIKES[STRIKES.length - 1].at[0], STRIKES[STRIKES.length - 1].at[1] - 0.11 * Math.max(0, e.press) + e.y, STRIKES[STRIKES.length - 1].at[2]]; yaw = 3 * Math.PI;
      sy = 1 - 0.32 * Math.max(0, e.squash) + 0.12 * Math.max(0, -e.squash) * 1.5; pitch = 0.3 * Math.max(0, e.squash) - 0.1 * Math.max(0, e.y / 0.42); grounded = false; break; }
    case "dive": {   // off the keys and out over the water, wings wide, then tucked into a dive
      const u = (b - CUE.launch) / (CUE.dive - CUE.launch), e = sm5(u), P0 = STRIKES[STRIKES.length - 1].at, P1: V3 = [SPLASH[0], WATER, SPLASH[2]], up = 2.2;
      p = [lerp(P0[0], P1[0], e), P0[1] - 0.11 * Math.max(0, 1 - u / 0.06) + (P1[1] - P0[1]) * u * u + up * 4 * u * (1 - u), lerp(P0[2], P1[2], e)];
      yaw = unwrap(Math.atan2(P1[0] - P0[0], P1[2] - P0[2]), 3 * Math.PI) * sm(u * 4) + 3 * Math.PI * (1 - sm(u * 4)); pitch = -0.25 + 1.35 * sm((u - 0.35) / 0.65) + 0.59 * Math.max(0, 1 - u / 0.07) ** 2; roll = 0.12 * Math.sin(Math.PI * u);
      sy = 1 + 0.12 * Math.sin(Math.PI * u) + 0.16 * Math.exp(-(((u - 0.04) / 0.04) ** 2)) - 0.37 * Math.max(0, 1 - u / 0.03); grounded = false; break; }   // v7: out of the crouch on the key into a stretch
    case "plunge": {   // under, nose first, in a burst of bubbles; buoyed back up and righted, kicking
      const k = b - CUE.dive, dn = sm(k / 0.45), upU = sm((k - 0.5) / 1.0), th0 = CIRCLE.from - 0.12, dir = loopYaw(th0);
      const fw = 1.1 * sm(k / 1.6), b0: V3 = [SPLASH[0] + Math.sin(dir) * fw, 0, SPLASH[2] + Math.cos(dir) * fw], L0 = loopAt(CIRCLE.from), base = mix3(b0, [L0[0], 0, L0[2]], sm((k - 0.5) / 1.25));   // v7: it ends where the circle starts (it jumped 0.54 m at 96)
      p = [base[0], WATER - 0.62 * dn * (1 - upU) + (SWIM_Y - WATER) * upU, base[2]];
      const dv = unwrap(Math.atan2(SPLASH[0] - STRIKES[STRIKES.length - 1].at[0], SPLASH[2] - STRIKES[STRIKES.length - 1].at[2]), 3 * Math.PI); yaw = lerp(dv, unwrap(dir, dv), sm((k - 0.25) / 1.3)); pitch = lerp(1.2 * (1 - sm(k / 0.6)) - 0.45 * Math.sin(Math.PI * Math.min(1, Math.max(0, (k - 0.35) / 1.0))), 0, sm((k - 1.2) / 0.5)); grounded = false; break; }
    case "circle": { const th = loopTh(b), y0 = unwrap(unwrap(loopYaw(CIRCLE.from - 0.12), 3 * Math.PI), unwrap(Math.atan2(SPLASH[0] - STRIKES[STRIKES.length - 1].at[0], SPLASH[2] - STRIKES[STRIKES.length - 1].at[2]), 3 * Math.PI)); p = loopAt(th); yaw = unwrap(loopYaw(th), y0 + (th - CIRCLE.from)); roll = 0.05 * Math.sin(b * 1.7); grounded = false; break; }
    case "swimhome": { const th = loopTh(124), P0 = loopAt(th), y0 = unwrap(unwrap(loopYaw(CIRCLE.from - 0.12), 3 * Math.PI), unwrap(Math.atan2(SPLASH[0] - STRIKES[STRIKES.length - 1].at[0], SPLASH[2] - STRIKES[STRIKES.length - 1].at[2]), 3 * Math.PI));
      const y1 = unwrap(loopYaw(th), y0 + (th - CIRCLE.from)), u = walk((b - 124) / 3, 0.25), P: V3[] = [P0, [P0[0] + 1.3 * Math.sin(y1), SWIM_Y, P0[2] + 1.3 * Math.cos(y1)], [-0.5, SWIM_Y, -7.3], [0, SWIM_Y, -6.4]];
      p = bez(P, u); yaw = unwrap(heading(P, Math.min(0.995, Math.max(0.005, u))), y1); yaw = lerp(yaw, unwrap(4 * Math.PI, yaw), sm((u - 0.7) / 0.3)); grounded = false; break; }
    case "stamp": {   // v7: out of the water and up to the lens, a crouch, and a jump kick at it: its own foot meets the glass
      // (KICK), it's thrown back off it and lands where it'll stand (the director 11-16: "kick doesn't work, the animation is broken")
      yaw = 4 * Math.PI;
      if (b < 128.5) { const u = walk((b - 127.0) / 1.5, 0.3); p = [0, lerp(SWIM_Y, 0.03, sm(u / 0.4)), lerp(-6.4, SHORE[2], u)]; pitch = -0.18 * Math.sin(Math.PI * u); grounded = u > 0.65; }
      else if (b < KICK.from) { p = mix3(SHORE, [0, 0, KICK.z0], walk((b - 128.5) / (KICK.from - 0.15 - 128.5))); }
      else if (b < KICK.hit) { const u = (b - KICK.from) / (KICK.hit - KICK.from); p = [0, 0.34 * Math.sin(Math.PI * 0.82 * u), lerp(KICK.z0, KICK.z1, sm5(u))]; pitch = -0.42 * sm(u / 0.55); sy = 1 + 0.1 * bump(u / 0.12); grounded = false; }
      else if (b < KICK.back) { const u = (b - KICK.hit) / (KICK.back - KICK.hit), y0 = 0.34 * Math.sin(Math.PI * 0.82); p = [0, y0 * (1 - u) + 0.16 * 4 * u * (1 - u), lerp(KICK.z1, -4.45, sm(u))]; pitch = lerp(-0.42, 0, sm(u)); grounded = u > 0.96; }
      else { p = [0, 0, -4.45]; sy = 1 + landSquash(b - KICK.back) * 0.9; }
      break; }
    default: p = [0, 0, -4.45]; yaw = 4 * Math.PI;
  }
  const wet = ["swim", "climb", "plunge", "circle", "swimhome"].includes(m.name) || (m.name === "stamp" && b < 128.5);
  const air = m.name === "fly" || m.name === "enter" || m.name === "dive";
  if (!air && !wet) p = [p[0], p[1] + height(p[0], p[2]), p[2]];
  // climbing out: never under the bank, the floor under it rising from the swim line to the ground as it comes up (v7: the
  // old rule pulled it from the swim line to the bank in one frame, 0.49 m, as each climb began)
  if (wet && p[1] > SWIM_Y + 0.001 && m.name !== "plunge") p = [p[0], Math.max(p[1], lerp(SWIM_Y, Math.max(SWIM_Y, height(p[0], p[2])), sm((p[1] - SWIM_Y) / 0.3))), p[2]];
  return { p, yaw, pitch, roll, s: [GS * (2 - sy) ** 0.5, GS * sy, GS * (2 - sy) ** 0.5], grounded: grounded && !air && !["swim", "plunge", "circle", "swimhome"].includes(m.name), slide };
}
/** the typing, key to key: on a key it takes the landing (squash, a bounce), winds up for the next (a crouch), and
 * goes (a stretch); in the air it arcs, and a long hop turns a trick: a spin, a front flip, a barrel roll */
export function typing(b: number) {
  const i = STRIKES.findIndex((s) => b < s.land), n = STRIKES.length;
  if (i < 0) { const s = STRIKES[n - 1]; return { p: s.at, yaw: 3 * Math.PI, pitch: 0, roll: 0, sy: 1 + landSquash(b - s.land), slide: false, trick: s.trick, u: 1, on: true }; }
  const prev = i > 0 ? STRIKES[i - 1] : null, to = STRIKES[i];
  const from: V3 = prev ? prev.end : [HOOK[0], 0, HOOK[2]], fromB = prev ? prev.leave : moveAt(b).from;
  if (prev && b < prev.leave) {   // standing on a key (or surfing the space bar)
    // weight: the landing taken in the body (harder the higher it fell), the crouch to wind up deeper for a bigger hop
    const d = b - prev.land, wind = 0.04 + 0.11 * to.h, fell = 0.6 + 0.55 * prev.h;
    const sy = 1 + landSquash(d) * fell - wind * bump((b - (prev.leave - 0.08 - 0.04 * to.h)) / (0.06 + 0.03 * to.h));
    if (prev.trick === "slide") { const u = (b - prev.land) / (prev.leave - prev.land), e = sm(u);
      return { p: mix3(prev.at, prev.end, e), yaw: 3 * Math.PI - 0.5 * Math.sin(Math.PI * u), pitch: -0.12 * Math.sin(Math.PI * u), roll: 0.22 * Math.sin(Math.PI * u), sy, slide: true, trick: prev.trick, u, on: true }; }
    // sat back on landing (its feet were out ahead), then its weight rolls forward past level and settles; leaning into the
    // next hop as it winds up
    const pitch = -0.2 * Math.exp(-d / 0.05) + 0.1 * bump((d - 0.11) / 0.07) + 0.14 * bump((b - (prev.leave - 0.05)) / 0.07);
    return { p: prev.at, yaw: 3 * Math.PI, pitch, roll: 0, sy, slide: false, trick: prev.trick, u: 0, on: true };
  }
  // a body thrown (v7): across at a steady speed, eased only a touch off the key, and up and down on gravity's parabola
  const u = Math.min(1, Math.max(0, (b - fromB) / (to.land - fromB))), e = 0.85 * u + 0.15 * sm(u), dx = to.at[0] - from[0], dz = to.at[2] - from[2], dist = Math.hypot(dx, dz);
  const p: V3 = [lerp(from[0], to.at[0], e), lerp(from[1], to.at[1], u) + to.h * 4 * u * (1 - u), lerp(from[2], to.at[2], e)];
  // turned part way to where it's going (back to the screen by the landing); on the first hop it turns from the lens
  const go = Math.atan2(dx, dz), turn = Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(go - 3 * Math.PI), Math.cos(go - 3 * Math.PI))));
  const yaw = i === 0 ? lerp(2 * Math.PI, 3 * Math.PI, sm(u * 1.3)) : 3 * Math.PI + turn * 0.4 * Math.sin(Math.PI * u) ** 0.7;
  // it leans into the throw off the key (nose down), flies level, and sits back with its feet out ahead to land
  const pitch = 0.2 * (1 - sm(u / 0.3)) - 0.24 * sm((u - 0.55) / 0.4), roll = -0.12 * Math.sign(dx) * Math.sin(Math.PI * u) * Math.min(1, dist / 1.5);
  // stretched off the key (more for a bigger hop), a little drawn in over the top, reaching for the next key
  const sy = 1 + (0.1 + 0.08 * to.h) * bump(u / 0.14) - 0.04 * Math.sin(Math.PI * u) + 0.06 * bump((1 - u) / 0.1);
  return { p, yaw, pitch, roll, sy, slide: false, trick: to.trick, u, on: false };
}
/** the angle a, moved by whole turns to sit nearest ref */
export const unwrap = (a: number, ref: number) => a + Math.round((ref - a) / (2 * Math.PI)) * 2 * Math.PI;
/** feet lifted on purpose, in beats: up, held, put down (the stomps on "foot", the muddy foot shown, the stamp on "root") */
export const LIFTS: { foot: "L" | "R"; up: number; top: number; hold: number; down: number; h: number; fwd: number }[] = [
  { foot: "L", up: 39.95, top: 40.2, hold: 40.26, down: 40.43, h: 0.1, fwd: 0.02 },
  { foot: "R", up: 40.95, top: 41.17, hold: 41.22, down: 41.39, h: 0.1, fwd: 0.02 },
  { foot: "R", up: 52.3, top: 52.9, hold: 53.9, down: 54.15, h: 0.13, fwd: 0.1 },
];
/** the jump kick at the lens at the end (v7): it leaves the ground at `from`, its right foot meets the glass at `hit`
 * (just in front of the lens, `at`), it lands back at `back`; z0 and z1 are where it takes off and where its body is
 * when the foot lands. The bake reaches the foot for `at` (blender/goose_build.py) */
export const KICK = { foot: "R" as const, from: 129.75, hit: 130.4, back: 131.0, z0: -4.3, z1: -3.52, at: [0.03, 0.31, -3.14] as V3 };
/** the "DUCK?" freeze: the picture holds on the beat it's sung, a card behind it, and lets go on "I say" */
export const FREEZE: [number, number] = [64.1, 65.3];
/** v9 (the director 11-16): the second "duck" (77.56 s) freezes too, on a blue water card, its head cocked, the cigarette
 * falling out of its bill (film.tsx) */
export const FREEZE2: [number, number] = [115.93, 117.1];
export const FREEZES = [FREEZE, FREEZE2];
export const freezeAt = (b: number) => FREEZES.find(([a, z]) => b >= a && b < z) ?? null;
/** the time the world is at: held through the freeze */
export const worldT = (t: number) => { const fz = freezeAt(beatAt(t)); return fz ? G(fz[0]) : t; };

const TR = tracks as unknown as { n: number; head: V3[]; tip: V3[]; jaw: V3[]; back: V3[]; lip?: V3[]; cig?: V3[]; rig?: { from: number; names: string[]; pts: V3[][]; more?: { from: number; pts: V3[][] }[] } };
/** the goose's turn as one rotation: heading (yaw), then its nose down (pitch), then a roll about its own length */
export function turnOf(r: Pick<Root, "yaw" | "pitch" | "roll">) {
  const cy = Math.cos(r.yaw), syw = Math.sin(r.yaw), cp = Math.cos(r.pitch), sp = Math.sin(r.pitch), cr = Math.cos(r.roll), sr = Math.sin(r.roll);
  // R = Ry(yaw) . Rx(pitch) . Rz(roll), as a matrix (rows)
  const Ry = [[cy, 0, syw], [0, 1, 0], [-syw, 0, cy]], Rx = [[1, 0, 0], [0, cp, -sp], [0, sp, cp]], Rz = [[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]];
  const mul = (a: number[][], c: number[][]) => a.map((row) => [0, 1, 2].map((j) => row[0] * c[0][j] + row[1] * c[1][j] + row[2] * c[2][j]));
  return mul(mul(Ry, Rx), Rz);
}
/** the same turn as Euler angles in the order a Model's `rotation` takes them (x, then y, then z: Rx . Ry . Rz) */
export function eulerOf(r: Pick<Root, "yaw" | "pitch" | "roll">): V3 {
  const M = turnOf(r), y = Math.asin(Math.max(-1, Math.min(1, M[0][2])));
  return Math.abs(M[0][2]) < 0.99999 ? [Math.atan2(-M[1][2], M[2][2]), y, Math.atan2(-M[0][1], M[0][0])] : [Math.atan2(M[2][1], M[1][1]), y, 0];
}
const apply = (M: number[][], v: V3): V3 => [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
/** a point of the goose's body in model space (y up, facing +z, unscaled), put in the world */
export function placeOn(m: V3, r: Root): V3 { const w = apply(turnOf(r), [m[0] * r.s[0], m[1] * r.s[1], m[2] * r.s[2]]); return [r.p[0] + w[0], r.p[1] + w[1], r.p[2] + w[2]]; }
/** a direction of the goose's body (unscaled), turned into the world */
export function turnDir(v: V3, r: Root): V3 { return apply(turnOf(r), v); }
const frameOf = (t: number) => Math.max(0, Math.min(TR.n - 1, Math.round(t * FPS)));
/** a point of the goose's body (its head, the tip of its bill, its jaw's hinge, its back) in the world */
export function bodyAt(t: number, which: "head" | "tip" | "jaw" | "back" | "lip", r = root(t)): V3 {
  const arr = (TR[which] ?? TR.jaw) as V3[]; return placeOn(arr[frameOf(t)], r);
}
/** the way a cigarette held in the corner of its bill lies (forward, out to its right, drooping), turned with the lower
 * bill as the bake has it; null before a bake that writes it */
export function cigDir(t: number, r = root(t)): V3 | null { if (!TR.cig) return null; return turnDir(TR.cig[frameOf(t)], r); }
/** the rig's joints (for the stomps): each named joint's place in the world, or null outside the frames the bake kept */
export function rigAt(t: number, r = root(t)): Record<string, V3> | null {
  if (!TR.rig) return null; const f = Math.round(t * FPS);   // v8: and under the water (the bake's "more" spans)
  const sp = [{ from: TR.rig.from, pts: TR.rig.pts }, ...(TR.rig.more ?? [])].find((x) => f >= x.from && f < x.from + x.pts.length);
  return sp ? Object.fromEntries(TR.rig.names.map((n, i) => [n, placeOn(sp.pts[f - sp.from][i], r)])) : null;
}
/** where it is, steadied over half a second (an orbit circles this) */
export function steadyRoot(t: number): V3 { let s: V3 = [0, 0, 0]; for (let k = 0; k < 9; k++) { const p = root(t + (k - 4) * 0.06).p; s = [s[0] + p[0], s[1] + p[1], s[2] + p[2]]; } return [s[0] / 9, s[1] / 9, s[2] / 9]; }
/** the head, steadied over half a second: what a lens that follows it aims at, so a bob doesn't shake the frame */
export function steadyHead(t: number): V3 { const c = bodyAt(t, "head"); let s: V3 = [0, 0, 0], n = 0; for (let k = 0; k < 9; k++) { const h = bodyAt(t + (k - 4) * 0.06, "head"); if (Math.hypot(h[0] - c[0], h[1] - c[1], h[2] - c[2]) > 3) continue; s = [s[0] + h[0], s[1] + h[1], s[2] + h[2]]; n++; } return [s[0] / n, s[1] / n, s[2] / n]; }

// ---- the lens: shots on the beat grid. Points stand in the world unless the shot follows: `at` as an offset from the
// steadied head; `eye` as an offset from the head in the goose's own frame ("both"), or from where it stands ("root").
// `zoom` crashes the field of view in over beats [from, to]; `up` turns the frame (a shot straight down needs one)
export type Shot = { b: number; eye: V3 | [V3, V3]; at: V3 | [V3, V3]; fov: number | [number, number]; follow?: "at" | "both" | "root"; roll?: number | [number, number]; shake?: number; focus?: boolean; name: string; up?: V3; zoom?: [number, number, number]; tiles?: boolean; wet?: boolean; subject?: "goose" | "other";
  /** v7: a lens circling the goose (r metres out, from angle a0 through `turns`), its height y(u) = mid + amp cos(2 pi u):
   * it dips in and out of the water (under the water while it's below the surface) */
  orbit?: { r: number; a0: number; turns: number; mid: number; amp: number; beats?: number; lift?: number; stop?: number };
  /** v7: a watcher's own shot after the film's posted, in front of a burst card like the goose's "DUCK?" */
  hero?: "deer" | "heron" | "frog" };
const S = (b: number, name: string, eye: Shot["eye"], at: Shot["at"], fov: Shot["fov"], o: Partial<Shot> = {}): Shot => ({ b, name, eye, at, fov, ...o });
const FROG_PAD: V3 = [-3.0, WATER + 0.02, -8.4];
export const SHOTS: Shot[] = [
  S(0, "the swamp from over the willows: old stones in the reeds", [[16, 11, 12], [9, 4.2, 2]], [[-3, 0, -11], [-3, 0.2, -10]], [40, 38]),
  S(4.5, "it swims in past the columns", [[0.9, 0.5, 2.1], [0.7, 0.46, 1.7]], [0, -0.25, 0], 36, { follow: "root", focus: true }),
  S(8.5, "on the water: rings trail it", [[4.2, 0.55, -11.2], [3.6, 0.5, -10.7]], [0, -0.3, 0], 40, { follow: "at" }),
  // v7: a steady lens on a crane, off the ground (the director 11-16: "procedural camera arm shakes here, move it off the ground
  // more"): it rode the goose's root low over the bank and shook with every step up it
  S(11.6, "it climbs out of the pond, the title behind it", [[1.3, 0.8, -3.7], [1.0, 0.85, -4.0]], [0, -0.25, 0], 36, { follow: "at", focus: true }),
  S(14.1, "between the stones, a cigarette in its bill", [[-2.6, 0.55, -6.6], [-2.0, 0.6, -4.4]], [0, -0.15, 0], 36, { follow: "at", focus: true }),
  S(17.4, "the shake: water flies", [[0.75, 0.7, 1.9], [0.6, 0.65, 1.7]], [0, -0.2, 0], 34, { follow: "root", focus: true }),
  S(18.8, "it squares up to the lens (cut on SCHLOP, 12.88 s: the director 11-16)", [[0, 0.12, 1.45], [0, 0.14, 1.3]], [0, 0.05, 0], 40, { follow: "root" }),
  S(20, "it turns from the lens and walks to the water", [[0.9, 0.8, -0.9], [0.55, 0.85, -1.5]], [0, -0.2, 0], 40, { follow: "at" }),
  S(21.6, "it sings to the pond; the circle lights", [[0, 0.32, -8.8], [0, 0.5, -8.2]], [0, -0.1, 0], 38, { follow: "at" }),
  S(24, "high: the circle lit round the stones", [[4.2, 5.6, 4.0], [3.4, 5.0, 3.4]], [0, 0, -4.0], 40),
  S(26, "the pond boils, the screen breaks the water", [[1.1, 0.8, -2.3], [0.9, 1.3, -2.7]], [[0, 1.6, -12], [0, 4.2, -12.5]], [44, 40], { shake: 1, subject: "other" }),
  S(29, "the frog on the fallen stone leaps for a lily pad as it comes up", [[-7.6, 1.3, -3.7], [-7.3, 1.35, -4.0]], [[-3.9, 0.35, -7.0], [-3.6, 0.4, -7.4]], 40, { subject: "other" }),
  S(31, "the deer by the drum startles and stares up at it", [[10.2, 1.05, 4.6], [10.0, 1.1, 4.3]], [[5.6, 1.6, -2.0], [5.2, 2.0, -2.6]], 40, { subject: "other" }),
  S(32.5, "the machine, dripping, the screen coming on", [[7.5, 2.6, 7.0], [6.0, 3.0, 8.0]], [0, 2.2, -6], [48, 44], { shake: 0.4 }),
  S(34, "it struts back to the lens, the screen on behind it", [[0, 0.55, -0.35], [0, 0.5, -0.85]], [0, -0.15, 0], 40, { follow: "at" }),
  S(37, "close: it sings, the screen behind", [[0.9, 0.1, 1.5], [0.7, 0.12, 1.3]], [0, -0.03, 0], 32, { follow: "both", focus: true }),
  S(39.6, "LEFT FOOT, RIGHT FOOT: its rig shown, animated by hand", [[0.4, 0.38, -0.1], [0.35, 0.36, -0.3]], [0, 0.42, -2.65], 40),
  S(41.9, "shake off the goon", [[0, 0.95, 0.3], [0.2, 0.9, 0.0]], [0, -0.2, 0], 38, { follow: "at" }),
  S(43.6, "the floor sticks to its feet", [[-2.7, 0.4, -0.9], [-1.9, 0.4, -0.5]], [0, -0.55, 0], 36, { follow: "at" }),
  S(48, "WHO'S GOT THE PARTY: it spins", [[0, 0.5, 0.7], [0, 0.55, 0.4]], [0, 0.85, -3.1], 44, { roll: [-6, 6] }),
  S(50.4, "QUACK QUACK", [[0.05, 0.05, 1.1], [0.02, 0.06, 1.0]], [0, -0.02, 0], 32, { follow: "both", focus: true }),
  S(51.8, "mud feet", [[0.95, 0.35, 1.6], [0.8, 0.38, 1.45]], [0.1, -0.35, 0.1], 40, { follow: "root", focus: true }),
  // v6: a third further back, the same angle: its white head and wings swinging across the frame close to the lens
  // failed raea check's flash screen (7-8 swings in a second; WCAG 2.3.1 allows 6)
  S(54.2, "QUACK QUACK QUACK", [[-1.0, 0.1, 1.42], [-0.81, 0.13, 1.28]], [0, -0.02, 0], 32, { follow: "both", focus: true }),
  S(55.9, "waddle left; the app's cursor picks it up and slides it right", [[-0.4, 0.7, 0.1], [0.4, 0.7, -0.1]], [0, -0.3, 0], 44, { follow: "at" }),
  S(59.5, "suction pop", [[1.1, 0.5, 1.3], [1.0, 0.5, 1.2]], [0, -0.35, 0], 40, { follow: "root", focus: true }),
  S(61, "it shuffles to the water's edge, low from the side", [[-1.8, 0.45, -4.4], [-1.6, 0.45, -4.15]], [0, -0.3, 0], 38, { follow: "at" }),
  S(63, "you say duck? over its shoulder: a crash in on its face", [[0.95, 1.05, -3.45], [0.88, 1.04, -3.55]], [0, -0.03, 0], 32, { follow: "at", focus: true, zoom: [63.62, 64.08, 13] }),
  S(65.3, "I say soup: it turns round", [[-0.55, 0.95, -3.4], [-0.45, 0.95, -3.5]], [0, -0.05, 0], 34, { follow: "at", focus: true }),
  S(66.6, "SWAMP-SIDE MAYOR: it struts at the lens, crowned", [[0, 0.26, 0.0], [0, 0.3, -0.6]], [[0, 1.0, -4.3], [0, 1.1, -3.5]], 40),
  S(72, "the keys burst from the mud in front of it, in a circle of light", [[1.2, 0.55, 3.6], [1.0, 0.65, 3.1]], [0, 0.6, -2.2], 46, { shake: 1 }),
  // v6: from twice as far. The spin brings it to the near end of the keys, 2.4 m from the old lens, and its white wings
  // swept a third of the frame each frame: raea check counted 9 flashes in a second (WCAG 2.3.1 allows 3)
  S(74, "it takes off", [[-4.4, 2.0, -2.4], [-6.0, 2.4, -2.4]], [0, -0.2, 0], 40, { follow: "at" }),
  S(76.5, "from the side: a spin, a flip, key to key", [[4.1, 1.35, 3.1], [3.7, 1.35, 2.8]], [[-0.6, 0.9, 0.2], [-0.9, 0.9, 0.25]], 44),
  S(80.5, "the screen: the words come", [[0.5, 1.6, 3.0], [0.3, 1.9, 2.3]], [0, 3.9, -12.5], [36, 33], { subject: "other" }),
  S(82, "close: the chat box on the big screen, the words landing in it", [[-1.25, 2.55, -5.6], [-1.3, 2.5, -6.1]], [-1.55, 2.25, -10.79], [23, 20], { subject: "other" }),
  S(83.5, "the frog and the heron, side by side, follow it key to key", [[4.1, 1.35, 3.1], [3.7, 1.35, 2.8]], [0, 0.8, 0.25], 44, { tiles: true, subject: "other" }),
  // v6: a third further back, the same angle: its white head and wings swinging across the frame close to the lens
  // failed raea check's flash screen (7-8 swings in a second; WCAG 2.3.1 allows 6)
  S(86, "over its shoulder: hop, hop, the space bar", [[-2.0, 3.4, 5.46], [-1.2, 3.26, 5.04]], [[-0.6, 0.6, 0.0], [0.2, 0.6, 0.0]], 46),
  // v6: a third further back, the same angle: its white head and wings swinging across the frame close to the lens
  // failed raea check's flash screen (7-8 swings in a second; WCAG 2.3.1 allows 6)
  S(88.5, "low at the keys: it flips for the O", [[-4.68, 0.95, 3.35], [-4.4, 0.99, 3.12]], [[0, 1.15, 0.1], [0.8, 1.25, 0.0]], 48),
  S(90.5, "it leaps for ENTER", [[5.6, 1.0, 3.4], [5.3, 1.2, 3.1]], [[2.2, 1.6, 0.0], [2.9, 2.2, 0.0]], 46),
  // v7: low and side on (it was straight down, where a bounce can't be seen): it comes down on ENTER, drives it down,
  // is thrown back up off it, down again, and away (the director 11-16: "lower the angle ... bounces like a trampoline")
  S(91.25, "low on ENTER: it lands, and bounces off it like a trampoline", [[ENTER[0] + 3.4, 0.62, ENTER[2] + 3.0], [ENTER[0] + 3.15, 0.6, ENTER[2] + 2.8]], [[ENTER[0], 1.4, ENTER[2]], [ENTER[0], 1.0, ENTER[2]]], [42, 38]),
  S(92.75, "off the keys and out over the pond", [[5.2, 1.5, 2.0], [5.0, 1.2, 0.9]], [0, -0.25, 0], 46, { follow: "at" }),
  S(94.25, "under the water: it plunges in", [[0.0, -0.95, -9.25], [0.05, -0.97, -9.3]], [[0.9, -0.25, -10.0], [0.95, -0.3, -10.05]], 62, { wet: true }),
  // v7 (the director 11-16: "this shot could be better"): from deep below, the goose crossing overhead, dark against the bright
  // window in the surface with the swamp bent in it
  S(96, "from deep below: it kicks across the window in the surface", [[2.75, -0.82, -10.45], [2.72, -0.84, -10.42]], [0, -0.6, 0], [72, 68], { follow: "at", wet: true }),
  S(97.5, "the big screen: the agent at work, it swims past", [[0.6, 2.2, -3.6], [0.4, 2.4, -4.3]], [0, 4.0, -10.79], [36, 33], { subject: "other" }),
  S(100, "high and wide: round the computer, smoking, the agent still at work on the screen", [[9.5, 7.5, -2.0], [8.6, 7.0, -0.8]], [0, 1.0, -12.5], 42),
  S(102.5, "the frog on its pad sees the film come up, and hops", [[-1.75, 0.15, -6.8], [-1.85, 0.18, -6.95]], [[-3.0, 0.15, -8.4], [-2.8, 0.4, -9.4]], 34, { subject: "other" }),
  S(104.5, "on the screen: the film plays in the app, as clay", [[-0.5, 3.1, -5.4], [-0.6, 3.1, -5.9]], onScreen(0.5, 0.5), [40, 37], { subject: "other" }),
  // v7 (the director 11-16: "an orbit camera around the duck going in and out of the water while it swims")
  S(107, "round it as it swims, the lens dipping in and out of the water, then holding, wet", [0, 0, 0], [0, 0.4, 0], 50, { orbit: { r: 1.55, a0: 2.2, turns: 0.62, mid: WATER - 0.02, amp: 0.3, beats: 2.5, lift: 2.8, stop: 0.3 } }),
  // v7 (the director 11-16: "use more of this time to show the platform and actual features"): the screen, the app at work
  S(110.5, "the screen: its edit, the timeline and the boards", [[-1.6, 3.2, -5.2], [-1.2, 3.2, -5.6]], onScreen(0.5, 0.6), [40, 36], { subject: "other" }),   // v7: wide enough for the timeline under the player
  S(112, "the screen: the score and the scripts, the goose swimming past under it", [[2.6, 2.4, -4.6], [2.2, 2.5, -5.0]], onScreen(0.45, 0.5), [34, 31], { subject: "other" }),
  S(113.5, "close: it swims, smoking, eyes on the screen; you say duck, duck: a crash in on its face, the freeze", [[0.95, 0.12, 1.25], [0.8, 0.14, 1.1]], [0, -0.02, 0], 34, { follow: "both", focus: true, zoom: [115.45, 115.91, 19] }),
  S(117.1, "the screen: it goes up to the four networks", [[0.7, 3.2, -5.6], [0.6, 3.2, -6.1]], onScreen(0.52, 0.45), [34, 31], { subject: "other" }),
  S(118.1, "the screen: it's on the video page, the likes climbing", [[-0.9, 2.6, -5.0], [-0.6, 2.8, -5.6]], onScreen(0.45, 0.5), [38, 30], { subject: "other" }),
  // v7 (the director 11-16: "a more cinematic or dynamic shot of these animals, like we did for the goose with the background,
  // but only after the video gets posted"): each watcher in its own shot on the beat, in front of a burst card
  // (film.tsx aims each at the watcher's head, frame by frame)
  S(119, "the deer bangs its head to it", [[4.75, 1.15, -8.15], [4.95, 1.12, -7.95]], [6.17, 1.09, -6.66], [36, 32], { subject: "other", hero: "deer" }),
  S(120, "the heron throws its head back", [[-4.55, 0.85, -6.3], [-4.8, 0.9, -6.4]], [-6.35, 1.05, -6.9], [36, 32], { subject: "other", hero: "heron" }),
  S(121, "the frog leaps for joy", [[-1.75, 0.22, -8.95], [-1.9, 0.24, -8.85]], [-2.9, 0.18, -8.48], [38, 34], { subject: "other", hero: "frog" }),
  // v7 (the director 11-16: "we need to use more of this time to show the platform and actual features"): in on the screen,
  // the agent's work done (its tasks ticked off, everything it made), then the edit
  S(122, "in on the screen: the video page (the director 11-16: straight back to it after the frog, no app), the goose swimming past under it", [[2.4, 2.2, -3.6], [1.3, 2.9, -5.2]], onScreen(0.55, 0.45), [40, 30], { subject: "other" }),
  // v7 (the director 11-16: "need more dynamic rap video shot of this"): low over the water just in front of its face, wide,
  // the frame swung on the beat, as it swims at the lens
  S(124, "it swims home at the lens, low and wide, like a rap video", [[0.32, -0.3, 1.35], [0.24, -0.3, 1.05]], [0, -0.1, 0], [64, 58], { follow: "both", roll: [-7, 5] }),
  // v7: wider and looking up as it comes close, so its head stays in frame through the jump kick (it went out of the top)
  S(127, "out of the water and into the lens", [[0, 0.3, -3.0], [0, 0.28, -3.05]], [[0, 0.75, -5.4], [0, 1.0, -4.4]], [42, 64]),
];
/** v8 (the director 11-16: "make sure the camera movement starts higher with more headroom for the goose on both start and
 * finish", and "hold it a beat longer, have the water drip down"): the orbit's dip keeps its own clock (`beats`: under
 * from 0.24 to 0.76 of it, as v7's whole orbit was, so the domes rendered for it still stand where its lens goes under);
 * over the water its height is `lift` times what it was, and after it comes up it eases to a stop over `stop` of its
 * clock and holds there, circling no more, through the rest of the shot, while the water runs down the glass */
export const ORBIT_UP = 0.76;
/** how far under the surface the swimming goose's feet paddle (the orbit's aim under the water) */
const FEET_DOWN = 0.12;
export function orbitH(o: NonNullable<Shot["orbit"]>, ub: number) {
  const h = o.mid - WATER + o.amp * Math.cos(2 * Math.PI * Math.min(1, Math.max(0, ub))); return WATER + (h > 0 ? h * (o.lift ?? 1) : h);
}
export function orbitAngle(o: NonNullable<Shot["orbit"]>, ub: number) {
  const k = 2 * Math.PI * o.turns; if (!o.stop || ub <= ORBIT_UP) return o.a0 + k * sm(Math.min(1, Math.max(0, ub)));
  const v0 = k * 6 * ORBIT_UP * (1 - ORBIT_UP), dx = Math.min(o.stop, ub - ORBIT_UP); return o.a0 + k * sm(ORBIT_UP) + v0 * (dx - (dx * dx) / (2 * o.stop));
}
export const shotIndex = (b: number) => { let i = 0; while (i + 1 < SHOTS.length && SHOTS[i + 1].b <= b) i++; return i; };
export function camera(t0: number) {
  const t = worldT(t0), b = beatAt(t), i = shotIndex(b), s = SHOTS[i], end = SHOTS[i + 1]?.b ?? SEC.home[1], u = Math.min(1, Math.max(0, (b - s.b) / (end - s.b))), e = sm(u);
  const pick = (v: V3 | [V3, V3]): V3 => (Array.isArray(v[0]) ? mix3((v as [V3, V3])[0], (v as [V3, V3])[1], e) : (v as V3));
  const num = (v: number | [number, number] | undefined, d = 0) => (v === undefined ? d : Array.isArray(v) ? lerp(v[0], v[1], e) : v);
  const r = root(t), head = s.follow ? steadyHead(t) : bodyAt(t, "head", r); let eye = pick(s.eye), at = pick(s.at);
  if (s.orbit) { const o = s.orbit, ub = (b - s.b) / (o.beats ?? end - s.b), a = orbitAngle(o, ub), c = steadyRoot(t);
    eye = [c[0] + o.r * Math.sin(a), orbitH(o, ub), c[2] + o.r * Math.cos(a)];
    // under, it tilts down (the director on v8, 11-16: "the camera needs to tilt down when its under so that the arc captures
    // the feet and room below the feet, while above water keeping headroom"): the paddling feet in the frame's upper
    // part, the bed and the water below them. It also keeps the frame's top under the surface's window (past 41
    // degrees up), which flicked in and out at the frame's top when the lens looked up and failed the flash test.
    const hd = Math.hypot(c[0] - eye[0], c[2] - eye[2]), eF = Math.atan2(WATER - FEET_DOWN - eye[1], hd);
    const aim = eF - 0.26, deep = sm((WATER - eye[1]) / 0.25);
    // (the shot's aim, high for headroom, holds only while the lens is well over the water; near and under the
    // surface it is v7's 0.16: v8's aim tipped the lens up under the water, the surface's window flicked in and out
    // at the frame's top and failed the flash test)
    const up = lerp(0.16, at[1], sm((eye[1] - WATER) / 0.4));
    at = [c[0] + at[0], lerp(WATER + up, eye[1] + hd * Math.tan(aim), deep), c[2] + at[2]]; }
  if (s.follow) at = [head[0] + at[0], head[1] + at[1], head[2] + at[2]];
  if (s.follow === "both") { const c = Math.cos(r.yaw), sn = Math.sin(r.yaw); eye = [head[0] + eye[0] * c + eye[2] * sn, head[1] + eye[1], head[2] - eye[0] * sn + eye[2] * c]; }
  if (s.follow === "root") eye = [r.p[0] + eye[0], r.p[1] + eye[1], r.p[2] + eye[2]];
  const k = (s.shake ?? 0) * rise(b).shake * 0.02;
  eye = [eye[0] + k * Math.sin(t * 47), eye[1] + k * Math.sin(t * 61 + 1), eye[2] + k * Math.sin(t * 53 + 2)];
  const under = !!s.wet || (!!s.orbit && eye[1] < WATER);   // a shot under the water says so (an orbit, while its lens is under); every other keeps the lens over the ground and the water
  eye = under ? [eye[0], Math.min(WATER - 0.08, Math.max(eye[1], height(eye[0], eye[2]) + 0.12)), eye[2]] : [eye[0], Math.max(eye[1], height(eye[0], eye[2]) + 0.12, WATER + 0.08), eye[2]];
  let fov = num(s.fov, 40);
  if (s.zoom) { const z = freezeAt(beatAt(t0)) ? 1 : Math.pow(Math.min(1, Math.max(0, (b - s.zoom[0]) / (s.zoom[1] - s.zoom[0]))), 2.2); fov = lerp(fov, s.zoom[2], z); }
  const fr = beatAt(t0), fz = freezeAt(fr); if (fz) fov *= 1 - 0.06 * sm((fr - fz[0]) / (fz[1] - fz[0]));   // a slow push on the held frame
  const dist = Math.hypot(head[0] - eye[0], head[1] - eye[1], head[2] - eye[2]);
  return { eye, at, fov, roll: num(s.roll), up: s.up, i, shot: s, u, focus: s.focus ? dist : 0, under };
}
/** the camera's up: a shot's own, else the world's, rolled */
export const upOf = (cam: ReturnType<typeof camera>): V3 => cam.up ?? [Math.sin((cam.roll * Math.PI) / 180), Math.cos((cam.roll * Math.PI) / 180), 0];

/** Where a point lands on the frame at time t (0..1 across and down), through the film's own lens; null behind it. */
export function toScreen(p: V3, t: number, aspect = 2, cam = camera(t)): [number, number] | null {
  const up = upOf(cam);
  const sub = (a: V3, c: V3): V3 => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], dot = (a: V3, c: V3) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
  const cross = (a: V3, c: V3): V3 => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const f = norm(sub(cam.at, cam.eye)), r = norm(cross(f, up)), u = cross(r, f), d = sub(p, cam.eye), z = dot(d, f);
  if (z < 0.05) return null;
  const th = Math.tan((cam.fov * Math.PI) / 360);
  return [0.5 + dot(d, r) / (z * th * aspect) / 2, 0.5 - dot(d, u) / (z * th) / 2];
}
/** The goose's box on the frame over beats [from, to], sampled: its head (with the bill) or its body (chest and feet),
 * each point padded by the part's size in metres so the box grows with the lens; null if it's off screen. */
export function gooseBox(from: number, to: number, part: "head" | "body" = "head"): [number, number, number, number] | null {
  let x0 = 9, y0 = 9, x1 = -9, y1 = -9;
  for (let s = 0; s <= 8; s++) {
    const t = G(from + ((to - from) * s) / 8), r = root(t), cam = camera(t);
    const pts: [V3, number][] = part === "head" ? [[bodyAt(t, "head", r), 0.22]] : [[bodyAt(t, "back", r), 0.3], [r.p, 0.25]];
    for (const [p, e] of pts) for (const o of [[0, 0, 0], [e, 0, 0], [-e, 0, 0], [0, 0, e], [0, 0, -e], [0, e * 0.8, 0]] as V3[]) {
      const q = toScreen([p[0] + o[0], p[1] + o[1], p[2] + o[2]], t, 2, cam); if (!q) continue;
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }
  }
  return x1 < x0 ? null : [x0, y0, x1, y1];
}
// ---- the cutaway while it types: two tiles, the frog and the heron, each turning its head after the goose; each its
// own small render (compositions/tiles.tsx), pushing in slowly
export const TILES: [number, number] = [83.5, 86];
export const HERON = { at: [-6.6, 0, -6.9] as V3, s: 1 };
export const FROG_WATCH = 1;   // which critter is the frog in the tile (layout.ts CRITTERS)
export { FROG_PAD };
/** frames where a render call must start fresh (the look changes there: under the water and back, the freeze card),
 * for tools/film.sh: each is rendered alone, then a call starts after it */
export function lookCuts(): number[] {
  const c: number[] = []; let last = "";
  for (let f = 0; f < FRAMES; f++) { const t = f / FPS, b = beatAt(t), k = (camera(t).under ? "u" : "a") + (freezeAt(b) ? "f" : "") + (b >= TILES[0] && b < TILES[1] ? "t" : "");
    if (f > 0 && k !== last) c.push(f, f + 1); last = k; }
  return c;
}

// ---- water on the lens (the director 11-16: "when relevant we have water on the lens when we're above the surface, and going
// under the surface we not have water on the lens"). Only where the lens has really been wet, over the surface:
// coming back up out of the water in the orbit (a full coat at once), the swim home (the lens 35 cm over the water
// with the goose paddling at it inside a metre: spray lands drop by drop through the shot), and the kick (its wet foot
// hits the glass: a burst round the stamp). Never while the lens is under, and none carried across a cut. The
// computer's splashes land 8-9 m off and the plunge's lens is already under, so none there. compositions/lensdrops.tsx draws them.
export type Drops = { amount: number; age: number; spread: number; seed: number; kick: boolean; drip: number };
let WETS: { t: number; amount: number; spread: number; seed: number; kick: boolean; shot: number; drip: number }[] | null = null;
function wets() {
  if (WETS) return WETS;
  const w: NonNullable<typeof WETS> = [];
  let was = false;
  for (let f = 0; f < FRAMES; f++) { const c = camera(f / FPS); if (was && !c.under && c.shot.orbit) w.push({ t: f / FPS, amount: 1, spread: 0.06, seed: 1, kick: false, shot: c.i, drip: 1 }); was = c.under; }
  const home = SHOTS.findIndex((s) => s.b === 124), out = SHOTS.findIndex((s) => s.b === 127);
  if (home >= 0) w.push({ t: G(124) + 0.25, amount: 0.6, spread: 1.8, seed: 2, kick: false, shot: home, drip: 0 });
  if (out >= 0) w.push({ t: G(KICK.hit), amount: 0.9, spread: 0.05, seed: 3, kick: true, shot: out, drip: 0 });
  return (WETS = w.sort((a, c) => a.t - c.t));
}
export function lensDrops(t: number): Drops {
  const c = camera(t), none = { amount: 0, age: 0, spread: 0, seed: 0, kick: false, drip: 0 };
  if (c.under) return none;
  let e: ReturnType<typeof wets>[number] | null = null;
  for (const x of wets()) if (x.t <= t && x.shot === c.i) e = x;
  return e ? { amount: e.amount, age: t - e.t, spread: e.spread, seed: e.seed, kick: e.kick, drip: e.drip } : none;
}

// ---- the view up through the surface (v6, the director 11-16: "a realistic view above the surface with refraction warping
// ripples"): the swamp above the water, rendered once from just over the surface where each underwater lens is
// (compositions film.tsx#pano: five 90-degree faces each) and folded into a dome (tools/dome.py); underwater.tsx's
// pass bends each ray up through the rippled surface into it. A lens that travels blends the two nearest.
export const PANOS: { at: V3; b: number }[] = [
  { at: [-0.58, WATER + 0.3, -8.83], b: 95 },     // the plunge
  { at: [2.74, WATER + 0.3, -10.44], b: 96.7 },   // v7: from deep below, the goose crossing the window overhead
  { at: [2.85, WATER + 0.3, -19.71], b: 107.8 },  // v7: the orbit, as its lens goes under
  { at: [0.52, WATER + 0.3, -18.13], b: 108.6 },  // and as it comes back up
];
/** the five faces of a pano: forward, up (the camera's right is forward x up) */
export const FACES: [V3, V3][] = [[[1, 0, 0], [0, 1, 0]], [[-1, 0, 0], [0, 1, 0]], [[0, 0, 1], [0, 1, 0]], [[0, 0, -1], [0, 1, 0]], [[0, 1, 0], [0, 0, -1]]];
/** which panos a lens at `eye` reads, and how much of the second */
export function panoAt(eye: V3): { a: number; b: number; w: number } {
  const d = PANOS.map((p, i) => ({ i, d: Math.hypot(p.at[0] - eye[0], p.at[2] - eye[2]) })).sort((x, y) => x.d - y.d);
  const [n0, n1] = d; return { a: n0.i, b: n1.i, w: n1.d > 1e-6 ? n0.d / (n0.d + n1.d) : 0 };
}
