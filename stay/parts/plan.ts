// The graybox's plan (storyboard draft 1, approved 11-11): every cut on one of Stay's beats, and what happens in each
// shot when. Pure (no raea import), so stay.checks.ts and the tools read it with bun. The script (stay.script.ts) says
// what each shot is for; this says where and when.
import { BEATS, SONG } from "./song.gen";

export { SONG, BEATS };
export const FPS = 30;
export const LENGTH = SONG.seconds;
export const FRAMES = Math.round(LENGTH * FPS);
/** the graybox's frame: 5:4 at half the build's 2700x2160 */
export const W = 1350, H = 1080;
export const fr = (s: number) => Math.round(s * FPS);
/** the song's beat nearest `t`; every time below goes through it, so a typo can't put a cut off the beat */
export const beat = (t: number) => {
  const b = BEATS.reduce((a, x) => (Math.abs(x - t) < Math.abs(a - t) ? x : a), BEATS[0]);
  if (Math.abs(b - t) > 0.02) throw new Error(`${t} isn't one of Stay's beats (nearest ${b})`);
  return b;
};

export type Place = "black" | "pool" | "sea" | "app-dark" | "burst" | "canyon" | "glass" | "glass-app" | "road" | "paint" | "hero" | "card";
export interface Shot {
  name: string;
  /** its first frame: one of Stay's beats (0 for the first) */
  t: number;
  place: Place;
  /** its camera (cams.ts) */
  cam: string;
  /** the place's variant: the pool's reroll (a..e), the canyon's and the road's (a, b) */
  v?: string;
  /** a reroll in the montage: the place as a generator would give it back, slightly wrong */
  reroll?: boolean;
}

const S = (name: string, t: number, place: Place, cam: string, extra: Partial<Shot> = {}): Shot => ({ name, t: t === 0 ? 0 : beat(t), place, cam, ...extra });
export const SHOTS: Shot[] = [
  // the generator's pool: a prompt on black, then the same request rerolled on every hit, the camera locked
  S("open", 0, "black", "none"),
  S("pool-a", 2.75, "pool", "lock", { v: "a" }),
  S("pool-b", 3.942, "pool", "lock", { v: "b" }),
  S("pool-c", 7.113, "pool", "lock", { v: "c" }),
  S("pool-d", 7.61, "pool", "lock", { v: "d" }),
  // its tubes die a row at a time on the verse's hit (TUBES_DIE)
  S("pool-b2", 8.89, "pool", "lock", { v: "b" }),
  // the last reroll, held: the cursor comments on its tubes, and only its light changes (POOL_LIGHT); the push in
  S("pool-e", 15.006, "pool", "push", { v: "e" }),
  S("water", 27.701, "pool", "water", { v: "e" }),
  S("sea", 31.382, "sea", "glide"),
  // the app in the dark: the cursor pins a comment on a canyon frame as the song stops
  S("app-dark", 33.77, "app-dark", "pullback"),
  // the drop: the screen bursts toward the camera, which goes through it into the canyon
  S("burst", 38.618, "burst", "through"),
  S("canyon", 39.17, "canyon", "fly", { v: "a" }),
  // the collapse: the sea, held; its waves slowed
  S("sea-held", 43.095, "sea", "held"),
  // the glasshouse: the plant turned to the light a step a beat; then the app there, its tool log, inspect
  S("glass", 47.78, "glass", "arc"),
  S("glass-app", 52.568, "glass-app", "screen"),
  // the forest road: a comment on the asphalt in the hold, soaked on the hit, the car through the puddle
  S("road", 56.63, "road", "edge", { v: "a" }),
  // the second "Stay...": the car's paint
  S("paint", 63.16, "paint", "slide"),
  // the second drop: every place twice on the same move, rerolled then directed
  S("m-pool-r", 68.486, "pool", "m-pool", { v: "c", reroll: true }),
  S("m-pool", 69.12, "pool", "m-pool", { v: "e" }),
  S("m-canyon-r", 69.75, "canyon", "m-canyon", { v: "b", reroll: true }),
  S("m-canyon", 70.38, "canyon", "m-canyon", { v: "a" }),
  S("m-sea-r", 71.01, "sea", "m-sea", { reroll: true }),
  S("m-sea", 71.64, "sea", "m-sea"),
  S("m-glass-r", 72.26, "glass", "m-glass", { reroll: true }),
  S("m-glass", 72.88, "glass", "m-glass"),
  S("m-road-r", 73.5, "road", "m-road", { v: "b", reroll: true }),
  S("m-road", 74.12, "road", "m-road", { v: "a" }),
  S("m-paint", 74.74, "paint", "m-paint"),
  // the app over the sea, every comment resolved; the peak's slam
  S("hero", 75.36, "hero", "pullout"),
  S("card", 82.81, "card", "none"),
];
for (let i = 1; i < SHOTS.length; i++) if (!(SHOTS[i].t > SHOTS[i - 1].t)) throw new Error(`${SHOTS[i].name} isn't after ${SHOTS[i - 1].name}`);
export const startOf = (s: Shot) => s.t;
/** the first frame inside shot `i` (a shot starting between frames starts on the next one; rounding would give the
 *  shot before's last frame, and a chunk keeps its first frame's sun and textures), and the frame after its last */
export const cutOf = (i: number) => Math.ceil(SHOTS[i].t * FPS - 1e-6);
export const cutEnd = (i: number) => (i < SHOTS.length - 1 ? cutOf(i + 1) : FRAMES);
export const endOf = (i: number) => (i < SHOTS.length - 1 ? SHOTS[i + 1].t : LENGTH);
export function shotAt(t: number) {
  let i = 0;
  while (i < SHOTS.length - 1 && SHOTS[i + 1].t <= t) i++;
  const s = SHOTS[i], a = s.t, b = endOf(i);
  return { i, s, u: (t - a) / (b - a), since: t - a, left: b - t };
}

// ---- what happens in the shots, when ---------------------------------------------------------------------------------
/** the prompts typed at the generator in act one (a character every TYPE_EVERY s from `from`) */
export const TYPE_EVERY = 0.065;
export const PROMPTS = [
  { text: "an empty pool at night, cinematic", from: 0.35, until: 2.75 },
  { text: "more cinematic", from: 4.2, until: 7.113 },
  { text: "no. the first one.", from: 9.15, until: 12.189 },
  { text: "close enough", from: 15.6, until: 18.361, every: 0.16 },
];
/** the pool's tube rows dying on the verse's hit (row 0, then 1 and 2) */
export const TUBES_DIE = [beat(12.189), beat(13.77), beat(13.77)];
/** the pool's change, on its comment's send and the next two beats: a row of tubes out each, the sun in on the first */
export const POOL_LIGHT = [beat(23.48), beat(24.52), beat(25.46)];

/** a comment: the cursor enters at `enter`, clicks at `click` on `at` (a point in that place, metres), its card types
 *  `text`; it is sent at `sent` (the change lands); `card` is its capture's file once the app's lane delivers it */
export interface Comment { n: number; shot: string; text: string; enter: number; click: number; sent: number; at: [number, number, number]; /** its card folds then, ahead of a camera move (else 1.6 s after the send) */ until?: number }
export const COMMENTS: Comment[] = [
  { n: 1, shot: "pool-e", text: "morning light through that window.", enter: 18.361, click: 20.6, sent: POOL_LIGHT[0], at: [-0.1, 4.45, -13], until: POOL_LIGHT[1] },
  { n: 2, shot: "app-dark", text: "darker walls. a room for reading.", enter: 34.4, click: beat(36.26), sent: beat(38.618), at: [0.42, 1.52, 0.012] },
  { n: 3, shot: "sea-held", text: "more green by the bench.", enter: 43.095, click: 43.35, sent: beat(44.26), at: [0.9, 0.25, -9] },
  { n: 4, shot: "glass", text: "later in the day.", enter: 47.78, click: beat(48.38), sent: beat(49.56), at: [-2.6, 1.45, -5] },
  { n: 5, shot: "road", text: "rain on the glass.", enter: 56.9, click: 57.9, sent: beat(60.06), at: [1.4, 0.0, -9], until: 60.6 },
  { n: 6, shot: "paint", text: "headlights on.", enter: 63.16, click: beat(63.83), sent: beat(64.41), at: [0.91, 0.72, 0.82], until: 64.9 },
];

/** the canyon's sun: its height (degrees) stepping down on each beat to 6° */
export const CANYON_STEPS = [39.72, 40.29, 40.84, 41.39, 41.92, 42.5].map(beat);
/** the sea's waves slowed to half from the send, over two seconds */
export const SLOW = { from: beat(44.26), over: 2.0, to: 0.5 };
/** the plant's turn: a step on each beat from 49.56, from facing the wall (180°) to the light (0°) */
export const TURNS = [49.56, 50.15, 50.73, 51.37, 51.95].map(beat);
/** the road soaks on the hit; the car crosses the camera's puddle at PASS */
export const SOAK = beat(60.06);
export const PASS = beat(61.3);
/** the paint deepens on the stop's hits */
export const PAINT_STEPS = [beat(64.41), beat(67.03)];
/** the slams: on a beat, until the next cut */
export const SLAMS = [{ text: "GOLDEN HOUR.", t: beat(39.72), until: beat(43.095) }, { text: "JUST THAT.", t: beat(80.32), until: beat(82.81) }];
/** a change's own words as type: let it breathe (its letters drifting apart as the sea slows), turn (turning with the
 *  plant), wetter (lying on the road) */
export const WORDS = [{ text: "let it breathe", from: SLOW.from, until: beat(47.78) }, { text: "turn", from: TURNS[0], until: beat(52.568) }, { text: "wetter", from: SOAK, until: beat(63.16) }];
/** the app's captures (placeholders until the app's lane delivers them to media/app): on which screen, from when */
export const SCREENS = [
  { shot: "app-dark", file: "watch-sea", from: beat(33.77) },
  { shot: "app-dark", file: "watch-canyon", from: 35.2 },
  { shot: "burst", file: "tools-2", from: beat(38.618) },
  { shot: "glass-app", file: "tools-4", from: beat(52.568) },
  { shot: "glass-app", file: "inspect", from: beat(54.52) },
  { shot: "hero", file: "timeline", from: beat(75.36) },
];

/** where the render is split inside a shot, as well as at every cut: each tube going out (gaps.md: a glowing mesh
 *  removed during one render keeps drawing and lighting). The camera is locked off at each, so the split doesn't show */
export const RENDER_SPLITS = [...new Set([...TUBES_DIE, ...POOL_LIGHT])];
/** the film's render segments, each its own render (tools/film.sh chunk-NN): the shots, split at RENDER_SPLITS. A
 *  segment starts on its first whole frame (a shot starting between frames starts on the next one: rounding would give
 *  the frame before's state, and a render keeps its first frame's sun and textures) */
export const SEGMENTS: { from: number; to: number; shot: string }[] = (() => {
  const starts = [...new Set([...SHOTS.map((s) => Math.ceil(s.t * FPS - 1e-6)), ...RENDER_SPLITS.map((t) => Math.ceil(t * FPS - 1e-6))])].sort((a, b) => a - b);
  return starts.map((f, i) => ({ from: f, to: i < starts.length - 1 ? starts[i + 1] : FRAMES, shot: shotAt(f / FPS).s.name }));
})();
