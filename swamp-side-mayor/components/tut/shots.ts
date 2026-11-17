// The tutorial's shots (tutorial-v9.script.ts, timed by components/tut/beats.json from the Fish read and cued on its
// words, components/tut/words.json), shared by the film (compositions/tutfilm.tsx) and its sound (components/tut/sound.tsx):
// every beat as one or more parts. The app (the take's captured states, assets/tutorial-app/states, filling the frame
// whole, a part a line names outlined, a close-up only to see a click or text too small to read); the swamp (a camera
// move, and Goose doing one of his moves along a path: gooseAt, with v9's graphics over it: fx); a flat graphic (the
// Mac's desktop, the end card); or black. His body is the tutorial's own baked clip (assets/glb/goose-tut.glb,
// blender/tut_goose_build.py, from tools/tut_root.ts's timeline of these moves), played at film time; the film places
// and turns him. From the same table come the times the sound needs: each click on the app, each key Goose presses (a
// keycap sticker) and the footprint.
//
// v9 (the director's 33 notes on v8, a feed post, 11-16): every time in a beat's parts is written in the beat's own
// seconds and taken from the words (word()), so an outline lands as its control is named; seq() turns them into each
// part's own clock.
import { type V3 } from "../../compositions/plan";
import { height } from "../../compositions/set";
import { GLASS, TMON } from "./machine-dims";
import { tkey } from "./machine";
import beats from "./beats.json";
import WORDS from "./words.json";
import STATES from "../../assets/tutorial-app/states.json";
import { REVIEW_B, type Cast, type Reviewer } from "./reviewers";
import { ringYaw } from "./v9";

export type Beat = (typeof beats.beats)[number];
/** Goose's moves, each baked into his clip by blender/tut_goose_build.py from the music video's move code: walk (feet
 * planted on his path), stand, star (the star's pose, wings up), lookback (over his shoulder at the lens), cock (head
 * cocked at the glass), regard (eyeing something), type (hopping key to key on `hops`), stomp (one key, one foot),
 * startle (backing off from his own face), flap (wings beating, off the ground), planks (flapping v3's plank wings),
 * proud, dance (to the song's groove), quack (a jab on each sung quack), power (both feet on the power key), lookround
 * (chin up, the head turning to each of `marks`) */
export type Move = "walk" | "stand" | "star" | "lookback" | "cock" | "regard" | "type" | "stomp" | "startle" | "flap" | "planks" | "proud" | "dance" | "quack" | "power" | "lookround";
/** Goose in a shot: where he stands (or walks from and to), which way he faces (along his path when left out), the move,
 * v3's plank wings, a lift off the ground at the shot's middle, the key tops he hops between when he types */
export type Goose = { from: V3; to?: V3; yaw?: number; move: Move; planks?: boolean; lift?: number; hops?: V3[];
  /** a lookround's marks: [seconds into the part, head yaw (+ his left)], where he turns his head to each thing named */
  marks?: [number, number][] };
/** the glass: states shown in turn (evenly, or from `at`, seconds into the part), framed on `focus` ([x, y] on the
 * 1600 x 900 screen and a zoom; 1 is the whole screen at 85% of the frame's width) */
export type Glass = { glass: string[]; at?: number[]; focus?: [number, number, number]; w?: number };
/** v9's graphics over a swamp shot (components/tut/v9.tsx), each from a second of the part: the glass powering on,
 * "This is Goose" with its arrow, the AIs' logos in a ring over his head (each lit on its name), the community's card,
 * and the fingerprint gathering from the notes, then checking a cut */
export type Fx =
  | { fx: "power"; at: number }
  | { fx: "label"; at: number; side?: -1 | 1 }
  | { fx: "ring"; from: number; named: number[] }
  | { fx: "discord"; from: number }
  | { fx: "fp1"; flag: number; approve: number; print: number }
  | { fx: "fp2"; scan: number; fix: number }
  | { fx: "rule"; ask: number; card: number; twice: number; standing: number; place: number }
  | { fx: "learn"; here: number; mem: number; disk: number; learn: number };
/** a swamp shot; `cast` puts the reviewers on their own moments, looking at the glass, and `emote` pops a reaction over
 * one of them (from and to: seconds into the part) */
export type Swamp = { eye: V3 | [V3, V3]; at: V3 | [V3, V3]; fov?: number; goose?: Goose; follow?: boolean; screen?: string | null; frogs?: "hop" | "jump"; w?: number;
  cast?: Cast; emote?: { who: Reviewer; n: "bang" | "heart"; from: number; to: number }; fx?: Fx[] };
export type Black = { black: true; w?: number };
/** a flat graphic filling the frame: the Mac's desktop, raea opened from its Dock (click, open and fill: seconds into the
 * part; `end` where the pointer goes, the next shot's first), or the end card */
export type Flat = { flat: "desktop"; click: number; open: number; fill: number; end?: [number, number]; w?: number } | { flat: "end"; w?: number };
/** the app itself, filling the frame, no monitor and no swamp: the take's states in turn (evenly, or from `at`), its
 * pointer drawn where the take had it (assets/tutorial-app/states.json) and gliding to each state's place as that state
 * comes up. `zoom` makes it a close-up (1, the default, is the whole window filling the frame): it opens on the whole
 * window and pushes in over PUSH seconds from `pushAt` (unless `push` is false, when it cuts straight in), and eases back
 * out to the whole from `out`; between, it keeps the pointer in frame, or `focus` ([x, y] on the 1600 x 900 capture: one
 * for the part, or one a state, null for the pointer). v9's rule (the director on v8, a note, a note, a note:
 * the whole window by default, a part named by an outline (`spot`), a close-up only to see a click or text too small to
 * read, shallow (about 1.5) and slow, and always back out before the line moves on. */
export type App = { app: string[]; at?: number[]; zoom?: number; focus?: [number, number] | ([number, number] | null)[]; push?: boolean; w?: number;
  /** which states (by place) are clicks, when the rule (a state after a hover, or one of CLICKED) gets it wrong */
  peck?: number[];
  /** outlines: a ring round `rect` ([x, y, w, h] on the capture) and everything else dimmed a little, from `from` seconds
   * into the part. Darker (`dim`) where the rest of the page would mislead (the scratch app is signed out, so Share's
   * panel and Publish carry "Sign in to raea first" under what the line is about) */
  spot?: Spot | Spot[];
  /** where the pointer is for each state (the capture's pixels; null keeps the take's own): for a line that names a
   * control the capture shows without the take's pointer on it, and for a click, so the ring lands on what was clicked */
  point?: ([number, number] | null)[];
  /** when the push in starts, and when it eases back out (seconds into the part) */
  pushAt?: number; out?: number };
/** an outline on one control, from `from` to `to` (seconds into the part), the rest dimmed by `dim` (0.42 unless said).
 * Outlines in a list follow one another: when the one before hasn't ended, the ring glides from it to the next instead
 * of fading out and in */
export type Spot = { rect: [number, number, number, number]; from?: number; to?: number; dim?: number };
export type Part = Glass | Swamp | Black | App | Flat;

export const FPS = 30;
export const fr = (s: number) => Math.round(s * FPS);
export const S = (n: string) => `tutorial-app/states/${n}.png`;

export const BEATS = beats.beats;
export const SECONDS = beats.seconds;
export const beat = (id: string) => BEATS.find((b) => b.id === id)!;

// ---- the words: when each is said, in its beat's seconds
const W = WORDS as Record<string, [string, number, number][]>;
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
/** seconds into beat `id` where its `n`th `w` (1 the first) starts, across its lines in order */
export function word(id: string, w: string, n = 1): number {
  const b = beat(id); let seen = 0;
  for (let i = 0; i < b.lines.length; i++) for (const [x, t0] of W[`${id}.${i + 1}`] ?? []) if (norm(x) === norm(w) && ++seen === n) return +(b.lines[i].at + t0).toFixed(2);
  throw new Error(`shots: no "${w}" (${n}) in ${id}`);
}
/** seconds into beat `id` where its line `i` (1 the first, the last unless said) ends */
export function said(id: string, i?: number): number { const b = beat(id), l = b.lines[(i ?? b.lines.length) - 1]; return +(l.at + l.seconds).toFixed(2); }

// ---- the captures' own measures: a control's rect, by its id in the take (states.json), padded for an outline
type StateMeta = { file: string; pointer?: { x: number; y: number; held?: boolean }; rects?: Record<string, { x: number; y: number; w: number; h: number }> };
const META: Record<string, StateMeta> = Object.fromEntries((STATES as StateMeta[]).map((m) => [m.file.replace(/^states\//, "").replace(/\.png$/, ""), m]));
export function rc(state: string, id: string, pad = 6): [number, number, number, number] {
  const r = META[state]?.rects?.[id];
  if (!r) throw new Error(`shots: no ${id} in ${state}`);
  return [Math.round(r.x - pad), Math.round(r.y - pad), Math.round(r.w + 2 * pad), Math.round(r.h + 2 * pad)];
}
const box = (x: number, y: number, w: number, h: number, pad = 6): [number, number, number, number] => [x - pad, y - pad, w + 2 * pad, h + 2 * pad];
/** an outline from `from` (to `to`), in beat seconds until seq() moves it to the part's */
const ol = (rect: [number, number, number, number], from: number, to?: number, dim?: number): Spot => ({ rect, from, to, dim });

/** a beat's parts, each [the beat second it starts, the part with its own times in beat seconds]: each part's `w` is
 * its length, and its times move to its own clock */
function seq(id: string, parts: [number, Part][]): Part[] {
  const secs = beat(id).seconds;
  return parts.map(([s, p], i) => ({ ...shift(p, s), w: +((i + 1 < parts.length ? parts[i + 1][0] : secs) - s).toFixed(3) }));
}
const less = (v: number | undefined, s: number) => (v == null ? undefined : +(v - s).toFixed(3));
function shift(p: Part, s: number): Part {
  if ("app" in p) return { ...p, at: p.at?.map((x) => +(x - s).toFixed(3)), pushAt: less(p.pushAt, s), out: less(p.out, s),
    spot: p.spot && (Array.isArray(p.spot) ? p.spot : [p.spot]).map((q) => ({ ...q, from: less(q.from ?? 0, s), to: less(q.to, s) })) };
  if ("flat" in p) return p.flat === "desktop" ? { ...p, click: p.click - s, open: p.open - s, fill: p.fill - s } : p;
  if ("eye" in p) return { ...p, emote: p.emote && { ...p.emote, from: p.emote.from - s, to: p.emote.to - s },
    goose: p.goose && { ...p.goose, marks: p.goose.marks?.map(([t, y]) => [+(t - s).toFixed(3), y] as [number, number]) },
    fx: p.fx?.map((f): Fx => {
      switch (f.fx) {
        case "power": case "label": return { ...f, at: f.at - s };
        case "ring": return { ...f, from: f.from - s, named: f.named.map((n) => n - s) };
        case "discord": return { ...f, from: f.from - s };
        case "fp1": return { ...f, flag: f.flag - s, approve: f.approve - s, print: f.print - s };
        case "fp2": return { ...f, scan: f.scan - s, fix: f.fix - s };
        case "rule": return { ...f, ask: f.ask - s, card: f.card - s, twice: f.twice - s, standing: f.standing - s, place: f.place - s };
        case "learn": return { ...f, here: f.here - s, mem: f.mem - s, disk: f.disk - s, learn: f.learn - s };
      }
    }) };
  return p;
}
const one = (id: string, p: Part): Part[] => seq(id, [[0, p]]);

// where things stand: the stage in front of the monitor, Goose on the keyboard
const g = (x: number, z: number): V3 => [x, height(x, z), z];
const ON_KEYS: V3 = [-0.4, 0.62, 0.4];
const FACE_LENS = 0, FACE_GLASS = Math.PI;
// the key tops Goose hops between as he types the prompt (03.02): its first words, "make me", a hop a key
const TYPED: V3[] = ["m", "a", "k", "e", " ", "m", "e"].map((ch) => { const a = tkey(ch).at; return [a[0], a[1] + 0.08, a[2]] as V3; });
const FIN = S("250-v3-at-058");

// in front of the giant keyboard (it runs z -0.9 to 1.7), so the keys don't fill the foreground
const medium = (z = -3.5): Swamp => ({ eye: [0.5, 1.15, z + 2.6], at: [0, 0.9, z], fov: 40, goose: { from: g(0, z), yaw: FACE_LENS, move: "stand" } });
const frogs = (screen: string | null, kind: "hop" | "jump" = "hop"): Swamp => ({ eye: [1.5, 0.5, -1.8], at: [0, 0.6, -5], fov: 40, screen, frogs: kind });
// the reviewers (components/tut/reviewers.tsx), each from the side with the glass beyond it: the frog on its fallen
// stone, the heron in the shallows, the deer at the water's edge
const R = REVIEW_B;
// v10 a note, "why does the visual style change so much here?"): the frog was shot from the water's surface, 0.8 m
// up through a 48 degree lens, a sheet of flat water filling the frame and its stone huge and soft in front; now from
// the heron's and the deer's height and lens, from the front and right of its leap, so its stone isn't between the lens
// and the frog, and the leap crosses the frame
const ON_FROG = { eye: [-1.9, 1.35, -4.3] as V3, at: [-4.0, 0.4, -7.9] as V3, fov: 40 };
const ON_HERON = { eye: [-4.8, 1.3, -3.9] as V3, at: [-5.6, 1.1, -7.5] as V3, fov: 40 };
const ON_DEER = { eye: [4.7, 1.2, -3.6] as V3, at: [5.8, 0.9, -7.0] as V3, fov: 40 };
const WATCHING: Cast = { frog: [R.frogSits, 1], deer: [R.deerWatches, 0], heron: [R.heronStill, 0] };
// the cold open: Goose at the keyboard, in front of the computer
const AT_KEYS = g(1.4, 3.0);
// 02.01: on the meadow behind the keyboard, facing away from the computer, the sky and the trees over him; the camera
// behind him and a little above, drifting round
const RING_AT = g(0.4, 6.0);
// a close-up's depth and how long it takes to push in or back out (the director on v8, a note: "slower and shallower")
const CLOSE = 1.55;

// the outlines' dim where the page under them would mislead (signed out: Share and Publish say "Sign in to raea first")
const HIDE = 0.86;

export const SHOTS: Record<string, Part[]> = {
  // ---- 00 · the cold open, at the computer a note: no walk away and back). The glass powers on as it opens
  // a note; "This is Goose" lettered, an arrow to him, as he's named a note. A slow push in.
  "00.01": one("00.01", { eye: [[2.45, 0.8, 7.6], [2.15, 0.82, 6.5]], at: [1.2, 1.45, 1.2], fov: 40, screen: S("010-everything"),
    goose: { from: AT_KEYS, yaw: 0.35, move: "stand" }, fx: [{ fx: "power", at: 0.15 }, { fx: "label", at: word("00.01", "This") }] }),
  // the star's pose, low, from the other side (a cut on the wings opening)
  "00.02": one("00.02", { eye: [0.75, 0.95, 6.3], at: [1.45, 1.2, 2.6], fov: 42, screen: S("010-everything"), goose: { from: AT_KEYS, yaw: FACE_LENS - 0.25, move: "star" } }),

  // ---- 01 · the app. Opened from the Dock a note, then the whole window, each part outlined as it's named
  "01.01": one("01.01", { flat: "desktop", click: word("01.01", "Open") - 0.05, open: word("01.01", "Open") + 0.65, fill: word("01.01", "Open") + 1.35, end: [820, 470] }),
  // "The app has three parts. Down the left, the rail: your projects." The pointer runs down the projects
  // v11 (the director on v10, a note: "in 0.1.6 the expand button actually expands it, it's not a drag"): "To widen it,
  // click the button at its foot. Click again to fold it." The button outlined; clicked, the rail opens with the
  // projects' names; clicked again, it folds. Chapter 01's app is 0.1.6-rc0 (tools/take/rail16.mjs, ch01v16.mjs), so
  // the build doesn't change under the lens as the button comes in a note; 0.1.5's captures from chapter 02 on
  "01.02": one("01.02", { app: ["300-v16-everything", "310-v16-hover-night-shift", "311-v16-hover-bakery", "312-v16-hover-duck", "301-v16-rail-toggle-hover", "302-v16-rail-wide", "303-v16-rail-fold-hover", "304-v16-rail-folded"],
    at: [0, word("01.02", "rail") - 0.2, word("01.02", "projects"), word("01.02", "projects") + 0.5, word("01.02", "button") - 0.35, word("01.02", "foot") + 0.15, word("01.02", "Click", 2) - 0.1, word("01.02", "fold") + 0.1],
    spot: [ol(rc("313-v16-project-open", "shell-rail", -4), word("01.02", "rail") - 0.1, word("01.02", "projects") + 0.9),   // v11: the three parts of the window outlined once each, as they're named (the lesson here is the window's map; raea check: 8 s frozen without)
      ol(rc("301-v16-rail-toggle-hover", "rail-toggle", 4), word("01.02", "button") - 0.3, word("01.02", "foot") - 0.15)] }),   // gone (0.3 s fade) as it's pressed: the button widens with the rail
  // "Open one." Close on the tile for the click a note, straight back out
  "01.03": one("01.03", { app: ["304-v16-rail-folded", "310-v16-hover-night-shift", "313-v16-project-open"], at: [0, 0.35, 1.25], point: [null, null, [31.5, 223]],
    zoom: 1.5, focus: [[200, 260], [200, 260], [200, 260]], pushAt: 0, out: 1.65 }),
  // "In the middle is its chat, where you ask its agent ... for what you want." v11 a note, a note,
  // a note, "way too many overlays"): no outline on the chat or its box, half the window between them; the pointer
  "01.04": one("01.04", { app: ["313-v16-project-open", "314-v16-chat-box"], at: [0, word("01.04", "ask")],
    spot: [ol(rc("313-v16-project-open", "shell-chat", -4), word("01.04", "chat") - 0.1, word("01.04", "ask") + 0.4)] }),   // the chat, once, as it's named; not its box
  // "On the right, its feed. Everything the agent makes lands there." (v11: no outline on the panel; the pointer)
  "01.05": one("01.05", { app: ["314-v16-chat-box", "315-v16-panel-feed"], at: [0, word("01.05", "right")],
    spot: [ol(rc("313-v16-project-open", "shell-panel", -4), word("01.05", "feed") - 0.15, word("01.05", "lands") + 0.6)] }),

  // ---- 02 · connect your AI. The AIs over Goose's head, each lit as it's named, his head turning to it a note;
  // no doors a note: Connections where it is, at the rail's foot
  "02.01": one("02.01", { eye: [[RING_AT[0] + 0.9, RING_AT[1] + 0.8, RING_AT[2] - 3.0], [RING_AT[0] - 0.4, RING_AT[1] + 0.85, RING_AT[2] - 3.1]],
    at: [RING_AT[0] - 0.1, RING_AT[1] + 1.55, RING_AT[2] + 5], fov: 46, screen: S("010-everything"),
    goose: { from: RING_AT, yaw: 0, move: "lookround", marks: (["Claude", "ChatGPT", "Gemini", "Kimi"] as const).map((n, i) => [word("02.01", n) - 0.15, ringYaw(i)] as [number, number]) },
    fx: [{ fx: "ring", from: word("02.01", "AI") - 0.2, named: ["Claude", "ChatGPT", "Gemini", "Kimi"].map((n) => word("02.01", n)) }] }),
  // "You connect it in Connections, at the foot of the rail." Outlined as it's named, clicked, open
  "02.02": one("02.02", { app: ["030-rail-foot", "032-foot-open-plugins", "036-connections"],
    at: [0, word("02.02", "Connections") - 0.15, said("02.02") + 0.2], point: [null, null, [31.5, 774]],
    spot: [ol(rc("032-foot-open-plugins", "open-plugins", 4), word("02.02", "Connections") - 0.1, said("02.02") + 0.1)] }),
  // "Under Agents, click Connect on yours, and sign in with your own account." Wide throughout, Claude's Connect outlined
  // for the click. v11 a note, "why does it cut over like this when you click"): pressing Connect opens Claude's
  // sheet on the right and the whole page slides 200 px left (040); v10 was close on the button, so the page jumped
  // under the lens. Seen whole, it's the sheet coming in
  "02.03": one("02.03", { app: ["036-connections", "037-connections-agents", "038-claude-row", "039-claude-connect-hover", "040-claude-connect-pressed", "042-claude-after-connect"],
    at: [0, word("02.03", "Agents") - 0.1, word("02.03", "click") - 0.1, word("02.03", "Connect") - 0.05, word("02.03", "on") + 0.15, word("02.03", "sign")],
    spot: [ol(rc("039-claude-connect-hover", "plugin-connect-claude-acp", 5), word("02.03", "click") - 0.1, word("02.03", "on") - 0.15)] }),   // gone (0.3 s fade) as it's pressed: the page slides under it

  // ---- 03 · ask for it
  // "Goose's video needs a project. The plus in the rail makes one: give it a name, and click Make."
  "03.01": one("03.01", { app: ["010-everything", "050-plus-hover", "051-new-project", "052-name-04", "052-name-08", "052-name-11", "058-make-hover", "059-project-made"],
    at: [0, word("03.01", "plus") - 0.35, word("03.01", "makes") + 0.1, word("03.01", "name") - 0.25, word("03.01", "name") + 0.05, word("03.01", "and"), word("03.01", "Make") - 0.3, said("03.01") + 0.15],
    point: [null, null, [31.5, 417], null, null, null, null, [982, 806]],
    spot: [ol(rc("050-plus-hover", "new-project", 4), word("03.01", "plus") - 0.1, word("03.01", "makes"))] }),
  // "Under the box, pick the AI to run it. Then say what you want, the way you'd tell a person, and send." The picker
  // outlined; Goose stomps the line out on the keys; the box fills; Send
  "03.02": seq("03.02", [
    [0, { app: ["059-project-made", "059-project-made", "061-pick-ai", "062-ai-picked"], at: [0, word("03.02", "pick") - 0.35, word("03.02", "pick") + 0.05, word("03.02", "run")],
      point: [null, [320, 855], [320, 855], null], peck: [2, 3], spot: [ol(rc("059-project-made", "new-chat-on", 4), word("03.02", "Under"))] }],   // v10: the picker as this capture has it ("Kimi"), not 017's wider "Pick an AI" a note
    [word("03.02", "Then") - 0.1, { eye: [-3.3, 4.9, 8.2], at: [-0.4, 0.6, 0.3], fov: 38, screen: S("063-prompt-16"), goose: { from: ON_KEYS, yaw: FACE_GLASS, move: "type", hops: TYPED } }],
    [word("03.02", "way"), { app: ["063-prompt-32", "063-prompt-48", "063-prompt-62", "064-send-hover", "065-answer-running"],
      at: [word("03.02", "way"), word("03.02", "you'd"), word("03.02", "person") - 0.1, word("03.02", "send") - 0.35, said("03.02") + 0.05], point: [null, null, null, null, [913, 855]],
      spot: [ol(rc("017-project-open", "new-chat-send", 4), word("03.02", "send") - 0.35)] }],
  ]),
  // "While it works, what it's running shows over the box. If it wanders, Stop is right beside it."
  "03.03": one("03.03", { app: ["065-answer-running", "066-stop-hover"], at: [0, word("03.03", "Stop") - 0.35],
    spot: [ol(rc("065-answer-running", "agent-send", 5), word("03.03", "Stop") - 0.1)] }),
  // "...type slash goal and a condition. It works until that's true." [a held beat on /goal honk] "'Honk' is not a
  // condition." a note Then Goose honks back, offended, at the lens
  // v10 a note, "don't navigate away from the screen"): the app held on "/goal honk" through Goose's honk, heard
  "03.04": one("03.04", { app: ["065-answer-running", "067-slash", "068-goal-honk"], at: [0, word("03.04", "slash") - 0.1, said("03.04", 1) + 0.25] }),
  // "A good goal is something the agent can check in the work itself. Not 'make it good', but 'every shot has me in
  // it'." "That is." Goose's foot on Delete; the new goal typed; set on "That is."
  // v10: on the app throughout a note: the stomp cut); "That is." cut a note; the goal set as the line ends
  "03.05": one("03.05", { app: ["069-goal-deleting", "070-goal-gone", "071-goal-15", "071-goal-29", "072-goal-set"],
    at: [0, 0.6, word("03.05", "every") - 0.3, word("03.05", "has"), said("03.05") - 0.05],
    zoom: 1.6, focus: [602, 760], pushAt: word("03.05", "Not") - 0.5, out: said("03.05") + 0.2 }),   // v11: close enough to read the goal being typed, back out as it's set (raea check: 16 s frozen wide)

  // ---- 04 · watch it work a note: show it working). In real time: the plan, its steps in the chat, each still
  // landing in the feed, then the cut
  "04.01": one("04.01", { app: ["072-goal-set", "200-rt-plan", "201-rt-built", "202-rt-still1", "203-rt-anim", "204-rt-still2", "205-rt-still3", "206-rt-cutting", "207-rt-cut"],
    at: [0, 0.6, word("04.01", "step") - 0.2, word("04.01", "lands"), word("04.01", "feed") - 0.3, word("04.01", "First"), word("04.01", "stills") + 0.2, word("04.01", "then", 2), word("04.01", "cut")] }),
  // "It made a second version on its own, with a longer summoning. Then the goal checked it, shot by shot: Goose is in
  // every one." The card's v2 outlined; then close on the goal's line and its Met (t-dxmxpbke), and back out
  // v10: 208's card had no poster yet (0.1.5 loads it late), black under the ring for 3 s; 209 has it
  "04.02": one("04.02", { app: ["207-rt-cut", "209-rt-reply", "210-rt-goal-working", "211-rt-goal-met"],
    at: [0, 0.3, word("04.02", "goal") - 0.2, word("04.02", "Goose") - 0.6],
    zoom: CLOSE, focus: [600, 700], pushAt: word("04.02", "shot") - 0.3, out: said("04.02") + 0.2 }),
  // "Click anything in the feed to open it." a note
  "04.03": one("04.03", { app: ["211-rt-goal-met", "220-card-hover", "221-card-opening", "222-cut-open"], at: [0, 0.2, word("04.03", "open") - 0.1, word("04.03", "open") + 0.35] }),
  // "With me so far?" a note Goose square to the lens; he honks: yes
  "04.04": one("04.04", { ...medium(), screen: S("222-cut-open"), goose: { from: g(0, -3.5), yaw: FACE_LENS, move: "stand" } }),
  // "It's fine if this is a lot at first. ... ask in raea's community on Discord. The link's on screen." Goose by the
  // water, calm; the community's card
  "04.05": one("04.05", { eye: [[-0.6, 1.25, -0.4], [-0.9, 1.25, -0.8]], at: [-3.4, 0.95, -5.8], fov: 50, screen: S("222-cut-open"),
    goose: { from: g(-2.9, -4.4), yaw: -2.2, move: "regard" }, fx: [{ fx: "discord", from: word("04.05", "stuck") - 0.2 }] }),

  // ---- 05 · ask for a change
  // "Back to the cut. It's a music video about Goose, so he watched himself first. His wings looked like planks." The
  // cut at 0:58, the wings outlined; Goose flaps his own planks
  "05.01": seq("05.01", [
    [0, { app: ["222-cut-open", "223-v2-at-058"], at: [0, word("05.01", "watched")] }],
    [word("05.01", "planks") - 0.25, { eye: [-3.2, 1.25, 7.4], at: [-4.0, 0.95, 3.6], fov: 38, screen: S("223-v2-at-058"), goose: { from: g(-4, 3.6), yaw: 0.2, move: "planks", planks: true } }],
  ]),
  // "He chose Comment, clicked on the wing, and said so." Comment outlined; close on the wing as the pin lands; back
  // out as the note's typed
  "05.02": one("05.02", { app: ["223-v2-at-058", "224-comment-hover", "225-comment-on", "226-pin", "227-note-25"],
    at: [0, word("05.02", "Comment") - 0.3, word("05.02", "Comment") + 0.3, word("05.02", "wing"), word("05.02", "said") - 0.1], point: [null, null, [97, 431], null, null],
    zoom: 1.45, focus: [[640, 430], [640, 430], [640, 430], [700, 460], [760, 470]], pushAt: word("05.02", "clicked") - 0.3, out: said("05.02") - 0.2,
    spot: [ol(box(80, 414, 36, 36, 4), word("05.02", "Comment") - 0.2, word("05.02", "clicked") - 0.3)] }),
  // "A note can do one of two things. Note keeps it for you, as a reminder." "Edit asks the agent to make the change.
  // Goose wants a change, so: Edit." a note Close enough to read them; Note clicked as named, then Edit
  "05.03": one("05.03", { app: ["227-note-25", "228-note-hover", "229-note-on", "230-edit-hover", "231-edit-on"],
    at: [0, word("05.03", "Note", 2) - 0.35, word("05.03", "Note", 2) + 0.05, word("05.03", "Edit") - 0.4, word("05.03", "Edit") + 0.05],
    zoom: 1.7, focus: [700, 490], pushAt: word("05.03", "two") - 0.4, out: said("05.03") - 0.1 }),
  // "Send, and your notes become the agent's plan in Tasks, each task pointing back at its note."
  "05.04": one("05.04", { app: ["232-notes-rail", "233-send-hover", "237-tasks-hover", "237-tasks-hover", "238-tasks"],
    at: [0, 0.05, word("05.04", "Send") + 0.25, word("05.04", "plan") - 0.5, word("05.04", "Tasks")], point: [null, null, [1514, 731], null, null], peck: [2, 4],
    spot: [ol(rc("233-send-hover", "bar-send-edits", 5), 0, word("05.04", "and") + 0.2), ol(rc("237-tasks-hover", "shell-tab-tasks", 4), word("05.04", "plan") - 0.2, word("05.04", "Tasks") + 0.3)] }),
  // "When it's done, the fix comes back as the next version, on the same card." In real time: the card turns to v3
  "05.05": one("05.05", { app: ["238-tasks", "239-feed-before", "240-v3-landing", "241-v3-landed", "242-v3-reply"],
    at: [0, 0.35, word("05.05", "comes"), word("05.05", "next"), said("05.05") + 0.8] }),
  // "Every version is kept. To go back to one, pick it from the version menu, next to the title." v2's planks, then v3's
  // feathers; Goose's planks turn to feathers, and he flaps
  "05.06": seq("05.06", [
    [0, { app: ["243-v3-open", "244-versions-hover", "245-versions-menu", "246-v2-hover", "247-v2-picked", "248-v2-at-058", "249-v3-hover", "250-v3-at-058"],
      at: [0, word("05.06", "go") - 0.2, word("05.06", "pick") - 0.1, word("05.06", "from"), word("05.06", "menu"), word("05.06", "next") + 0.1, said("05.06") - 0.3, said("05.06") + 0.3],
      point: [null, null, null, null, [303, 111], null, null, [303, 83]],
      spot: [ol(rc("244-versions-hover", "versions", 5), word("05.06", "version", 2) - 0.25, word("05.06", "next") + 0.1)] }],
    [said("05.06") + 1.1, { eye: [1.1, 0.3, -1.4], at: [-0.1, 2.2, -4.6], fov: 46, screen: FIN, goose: { from: g(0, -3.5), yaw: FACE_LENS, move: "flap", lift: 0.7 } }],
  ]),

  // ---- 06 · finish it a note: Export and CapCut in place of the timeline)
  // "When it's right, Export, top right, saves the film to your Mac."
  "06.01": one("06.01", { app: ["146-film-header", "147-export-hover", "148-export"], at: [0, word("06.01", "Export") - 0.3, word("06.01", "saves")],
    spot: [ol(box(1428, 10, 78, 28, 5), word("06.01", "Export") - 0.15, word("06.01", "saves") + 0.2)] }),
  // "Show in Finder, under the dots at the end of the timeline, takes you to the file. From there it goes into CapCut, or
  // any editor you like." The dots, then Show in Finder; close enough to read it, and back out
  "06.02": one("06.02", { app: ["250-v3-at-058", "171-more-hover", "172-more-menu"], at: [0, word("06.02", "dots") - 0.3, word("06.02", "end") + 0.1],
    zoom: CLOSE, focus: [1420, 700], pushAt: word("06.02", "takes") - 0.5, out: word("06.02", "From") + 0.4,
    spot: [ol(box(1560, 776, 28, 28, 5), word("06.02", "dots") - 0.2, word("06.02", "end") + 0.1)] }),

  // ---- 07 · set it once: controllers a note, a note
  // "Some choices hold for every film Goose makes: the shape, eighteen by nine; the loudness, minus fourteen; captions
  // on." "Instead of saying them in every chat, they live in a controller ... Goose's agent made this one when it
  // began." Each field outlined and pointed at as it's named; the box (every chat); the controller; then the chat's
  // own step where the agent wrote it, back at the start (201)
  "07.01": seq("07.01", [
    [0, { app: ["130-rack", "130-rack", "130-rack", "130-rack", "130-rack", "130-rack"],
      at: [0, word("07.01", "shape") - 0.3, word("07.01", "loudness") - 0.3, word("07.01", "captions") - 0.3, word("07.01", "chat") - 0.4, word("07.01", "controller") - 0.3],
      point: [null, [1238, 312], [1234, 180], [1386, 197], [600, 790], [1300, 250]],
      spot: [ol(rc("130-rack", "control-delivery.delivery.shape-18:9", 5), word("07.01", "shape") - 0.1, word("07.01", "loudness") - 0.2),
        ol(rc("130-rack", "field-delivery.delivery.loudness", 2), word("07.01", "loudness") - 0.15, word("07.01", "captions") - 0.2),
        ol(rc("130-rack", "field-delivery.delivery.captions", 2), word("07.01", "captions") - 0.15, word("07.01", "Instead") - 0.2),
        ol(rc("130-rack", "controller-delivery", 3), word("07.01", "controller") - 0.2)] }],
    [word("07.01", "Goose's") - 0.2, { app: ["201-rt-built"] }],
  ]),
  // "Change one, and whatever an agent makes next follows it." The knob turned to the top; the frogs get louder
  "07.02": seq("07.02", [
    [0, { app: ["130-rack", "131-knob-hover", "132-knob-up", "133-knob-further"], at: [0, 0.05, 0.45, 1.3] }],
    [2.4, frogs(S("133-knob-further"))],
  ]),
  // "Goose left loudness at minus fourteen." Back down
  "07.03": one("07.03", { app: ["133-knob-further", "134-knob-back"], at: [0, word("07.03", "minus") - 0.2] }),
  // "To make your own, click the plus and describe in a sentence what it should decide. raea builds it as settings you
  // can set." The +; the sentence; Create; it builds itself in
  "07.04": one("07.04", { app: ["134-knob-back", "135-new-controller-hover", "136-new-controller", "137-new-controller-25", "137-new-controller-50", "138-create-hover", "139-honks-building", "140-honks-built"],
    at: [0, word("07.04", "plus") - 0.35, word("07.04", "describe") - 0.1, word("07.04", "sentence"), word("07.04", "decide") - 0.2, word("07.04", "raea") - 0.3, word("07.04", "builds") + 0.1, word("07.04", "settings")],
    spot: [ol(rc("130-rack", "controllers-new", 5), word("07.04", "plus") - 0.2, word("07.04", "describe") - 0.1)] }),

  // ---- 08 · the panel's four tabs, one by one a note
  "08.01": one("08.01", { app: ["251-project", "258-tab-feed-hover", "259-tab-feed", "252-tab-source-hover", "253-tab-source", "254-tab-tasks-hover", "255-tab-tasks", "256-tab-controllers-hover", "257-tab-controllers"],
    at: [0, word("08.01", "Feed") - 0.4, word("08.01", "Feed"), word("08.01", "Source") - 0.4, word("08.01", "Source"), word("08.01", "Tasks") - 0.4, word("08.01", "Tasks"), word("08.01", "Controllers") - 0.4, word("08.01", "Controllers")],
    spot: [ol(rc("251-project", "shell-tabs", 0), word("08.01", "four") - 0.1, word("08.01", "Feed") - 0.3)] }),

  // ---- 09 · share it
  // "For other people's notes, Share makes a review link. On Pro, anyone can watch, comment on the frame and approve,
  // with no account." Share outlined; its Review link; then the reviewers, a shot each
  "09.01": seq("09.01", [
    [0, { app: ["148-export", "149-share-hover", "150-share-panel"], at: [0, word("09.01", "Share") - 0.3, word("09.01", "review") - 0.1],
      spot: [ol(box(1513, 10, 75, 28, 5), word("09.01", "Share") - 0.15, word("09.01", "review") - 0.1)] }],
    [word("09.01", "watch") - 0.3, { ...ON_FROG, screen: S("150-share-panel"), cast: WATCHING }],
    [word("09.01", "comment") - 0.1, { ...ON_HERON, screen: S("150-share-panel"), cast: WATCHING }],
    [word("09.01", "approve") - 0.1, { ...ON_DEER, screen: S("150-share-panel"), cast: WATCHING }],
  ]),
  // "Their reviews come back in Publish, at the foot of the rail, with what needs you on top." No doors: Publish where
  // it is, then its tabs, Needs you first
  "09.02": one("09.02", { app: ["148-export", "151-publish-hover", "152-publish"], at: [0, word("09.02", "Publish") - 0.35, word("09.02", "with") - 0.2],
    spot: [ol(box(10, 704, 44, 44, 5), word("09.02", "Publish") - 0.15, word("09.02", "with") - 0.2)] }),
  // the reviews: the heron's note ("!"), the deer's approval (a heart), and the frog, gone before "Reviews were mixed."
  "09.03": seq("09.03", [
    [0, { ...ON_HERON, screen: S("150-share-panel"), cast: { ...WATCHING, heron: [R.heronCranes, 1] }, emote: { who: "heron", n: "bang", from: word("09.03", "notes") - 0.2, to: word("09.03", "The", 2) - 0.15 } }],
    [word("09.03", "The", 2) - 0.15, { ...ON_DEER, screen: S("150-share-panel"), cast: { ...WATCHING, deer: [R.deerNods, 1] }, emote: { who: "deer", n: "heart", from: word("09.03", "approved"), to: said("09.03", 1) + 0.35 } }],
    [said("09.03", 1) + 0.35, { ...ON_FROG, screen: S("150-share-panel"), cast: { ...WATCHING, frog: [R.frogLeap, 1] } }],
  ]),

  // ---- 10 · teach it your eye a note: what it learns, from what, what it does with it, where it's made)
  "10.01": one("10.01", { eye: [[3.2, 1.3, 6.4], [2.5, 1.3, 5.6]], at: [-0.5, 2.0, -8], fov: 46, screen: FIN,
    fx: [{ fx: "fp1", flag: word("10.01", "flag"), approve: word("10.01", "approve"), print: word("10.01", "fingerprint") }] }),
  "10.02": one("10.02", { eye: [[2.5, 1.3, 5.6], [1.9, 1.3, 4.9]], at: [-0.5, 2.0, -8], fov: 46, screen: FIN,
    fx: [{ fx: "fp2", scan: word("10.02", "checks") - 0.2, fix: word("10.02", "fixes") }] }),
  // v10 a note, a note: the setup page and the footprint are gone. A standing rule: "...tell your agent: make
  // it a rule..." "Make the same fix twice, and raea asks if it's a standing rule. You'll find them all in Fingerprint,
  // under Rules." The dolly from 10.01 and 10.02 goes on
  "10.03": one("10.03", { eye: [[1.9, 1.3, 4.9], [1.4, 1.3, 4.3]], at: [-0.5, 2.0, -8], fov: 46, screen: FIN,
    fx: [{ fx: "rule", ask: word("10.03", "make"), card: word("10.03", "Every"), twice: word("10.03", "twice"), standing: word("10.03", "standing"), place: word("10.03", "Fingerprint") }] }),
  // "It all runs on your own computer. Eight gigabytes of memory and two free on disk are enough." "To give it a head
  // start, ask your agent to learn from your finished renders."
  "10.04": one("10.04", { eye: [[1.4, 1.3, 4.3], [0.9, 1.3, 3.7]], at: [-0.5, 2.0, -8], fov: 46, screen: FIN,
    fx: [{ fx: "learn", here: word("10.04", "computer"), mem: word("10.04", "Eight"), disk: word("10.04", "two"), learn: word("10.04", "learn") }] }),

  // ---- 11 · the workflow, over the finished video; out on the end card a note
  "11.01": one("11.01", { eye: [[2.4, 0.55, -1.3], [-2.4, 0.55, -1.3]], at: [0, 2.4, -8], fov: 44, screen: "song", goose: { from: g(0, -4.6), yaw: FACE_GLASS, move: "dance" } }),   // v9: a metre nearer the glass, so his wings, flapping to the song, don't sweep a third of the frame (raea check: a flash at 5:23)
  "11.02": one("11.02", { flat: "end" }),
};
export { FIN };


/** the parts of a beat with their start (seconds into the beat) and length */
export function partsOf(b: Beat): { part: Part; start: number; seconds: number }[] {
  const parts = SHOTS[b.id] ?? [{ glass: [] }];
  const total = parts.reduce((a, p) => a + (p.w ?? 1), 0);
  let at = 0;
  return parts.map((part) => { const s = (b.seconds * (part.w ?? 1)) / total, r = { part, start: at, seconds: s }; at += s; return r; });
}
/** a glass or app part's states, each with its start (seconds into the part) */
export function statesOf(p: Glass | App, seconds: number): { name: string; start: number }[] {
  const names = "glass" in p ? p.glass : p.app;
  return names.map((name, i) => ({ name, start: p.at?.[i] ?? (i * seconds) / names.length }));
}

export function beatAt(t: number): { b: Beat; part: Part; k: number; local: number; partStart: number; partSeconds: number } {
  const b = BEATS.find((x) => t >= x.start && t < x.start + x.seconds) ?? BEATS[BEATS.length - 1];
  const ps = partsOf(b), into = Math.max(0, t - b.start);
  const i = Math.max(0, ps.findIndex((p, j) => into < p.start + p.seconds || j === ps.length - 1));
  const p = ps[i], local = Math.min(p.seconds, into - p.start);
  return { b, part: p.part, k: Math.min(0.9999, Math.max(0, local / p.seconds)), local, partStart: b.start + p.start, partSeconds: p.seconds };
}

const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** how far along a walk of `secs` he is at `local` (0 to 1): up to speed over his first steps, steady, slowing to a stop */
export function walkU(local: number, secs: number) {
  const r = Math.min(0.45, secs / 4), v = 1 / (secs - r), x = Math.max(0, Math.min(secs, local));
  if (x < r) return (0.5 * v * x * x) / r;
  if (x > secs - r) { const y = secs - x; return 1 - (0.5 * v * y * y) / r; }
  return v * (x - r / 2);
}
/** the share of a hop's time he stands on a key before he jumps for the next */
export const ON_KEY = 0.45;
export type GooseAt = { p: V3; yaw: number; move: Move; grounded: boolean; planks: boolean; part: string; local: number; seconds: number; start: number; marks?: [number, number][] };
/** Goose at a film second, in a swamp part that has him: where he is, which way he faces, his move, whether his feet are
 * on the ground; null where he isn't in the shot. The film draws him from this, and tools/tut_root.ts bakes his feet to it */
export function gooseAt(t: number): GooseAt | null {
  const { b, part, local, partStart, partSeconds } = beatAt(t);
  if (!("eye" in part) || !part.goose) return null;
  const g = part.goose;
  let p: V3 = g.from, yaw = g.yaw ?? 0, grounded = true;
  if (g.hops?.length) {   // key to key: on a key, then an arc to the next
    const n = g.hops.length, seg = partSeconds / n, i = Math.min(n - 1, Math.floor(local / seg)), u = (local - i * seg) / seg;
    const a = g.hops[i], c = g.hops[Math.min(n - 1, i + 1)];
    if (u < ON_KEY || i === n - 1) p = a;
    else { const v = (u - ON_KEY) / (1 - ON_KEY); p = lerp3(a, c, v); p = [p[0], p[1] + 0.55 * Math.sin(Math.PI * v), p[2]]; grounded = false; }
  } else if (g.to) {
    p = lerp3(g.from, g.to, walkU(local, partSeconds));
    if (g.yaw === undefined) yaw = Math.atan2(g.to[0] - g.from[0], g.to[2] - g.from[2]);
  }
  if (g.lift) { const h = Math.sin(Math.PI * Math.min(1, local / partSeconds)) * g.lift; p = [p[0], p[1] + h, p[2]]; grounded = h < 0.03; }
  return { p, yaw, move: g.move, grounded, planks: !!g.planks, part: `${b.id}@${partStart.toFixed(2)}`, local, seconds: partSeconds, start: partStart, marks: g.marks };
}
const smooth = (k: number) => k * k * (3 - 2 * k);
const pairAt = (v: V3 | [V3, V3], k: number): V3 => (Array.isArray(v[0]) ? lerp3((v as [V3, V3])[0], (v as [V3, V3])[1], smooth(k)) : (v as V3));
/** a swamp part's camera at k (0 to 1 through the part); a following camera's eye and aim ride with Goose */
export function swampCam(part: Swamp, k: number, gp?: V3): { eye: V3; at: V3 } {
  let eye = pairAt(part.eye, k), at = pairAt(part.at, k);
  if (part.follow && gp) { eye = [gp[0] + eye[0], gp[1] + eye[1], gp[2] + eye[2]]; at = [gp[0] + at[0], gp[1] + at[1], gp[2] + at[2]]; }
  return { eye, at };
}
/** every part with Goose in it, with its film start and length */
export function gooseParts(): { id: string; start: number; seconds: number; goose: Goose }[] {
  return BEATS.flatMap((b) => partsOf(b).flatMap(({ part, start, seconds }) => ("eye" in part && part.goose ? [{ id: b.id, start: b.start + start, seconds, goose: part.goose }] : [])));
}

/** the state on the glass at a moment of a glass part */
export function stateAt(p: Glass | App, local: number, seconds: number): string | null {
  const st = statesOf(p, seconds); let cur: string | null = null;
  for (const s of st) if (local >= s.start) cur = s.name;
  return cur ?? st[0]?.name ?? null;
}

// a click: a state that follows a hover is the click's result, and a few more by name
// (v9: the pin on the wing; the stills, the cut and the next version landing in the feed are the agent's, never clicks)
const CLICKED = new Set(["226-pin", "132-knob-up", "051-new-project", "062-ai-picked", "139-honks-building"]);
const KEYED = new Set(["067-slash", "068-goal-honk", "069-goal-deleting", "070-goal-gone", "071-goal-15", "071-goal-29", "072-goal-set"]);

/** every peck on the glass, in film seconds: Goose clicking, each a beak's tap */
export const PECKS: number[] = (() => {
  const out: number[] = [];
  let last: string | null = null;   // the state the app showed last, across parts and beats (a part that opens on it isn't a click)
  for (const b of BEATS) for (const { part, start, seconds } of partsOf(b)) {
    if (!("glass" in part) && !("app" in part)) continue;
    const st = statesOf(part, seconds);
    if ("app" in part && part.peck) part.peck.forEach((i) => out.push(+(b.start + start + st[i].start).toFixed(2)));
    else st.forEach((s, i) => {
      const prev = i > 0 ? st[i - 1].name : last;
      if (KEYED.has(s.name) || s.name === prev) return;
      if ((prev && /hover/.test(prev) && !/hover/.test(s.name)) || CLICKED.has(s.name)) out.push(+(b.start + start + s.start).toFixed(2));
    });
    last = st[st.length - 1]?.name ?? last;
  }
  return [...new Set(out)].sort((a, b) => a - b);
})();

/** the keys Goose presses, each shown as a keycap sticker (assets/tut-keys/cap-NAME-up|down.png) at a film second;
 * `held` keys go down in turn, a shortcut's caps side by side; `press: false` shows the caps without pressing them */
export type Sticker = { at: number; keys: string[]; press?: boolean; hold?: number };
const at = (id: string, s: number) => +(beat(id).start + s).toFixed(2);
export const STICKERS: Sticker[] = [
  { at: at("03.04", word("03.04", "slash") - 0.1), keys: ["slash"] },   // "type slash goal"
];
/** when each sticker's keys go down: the first at `at`, the next 0.16 s after */
export const KEY_DOWNS: { at: number; key: string }[] = STICKERS.flatMap((s) => (s.press === false ? [] : s.keys.map((key, i) => ({ at: +(s.at + 0.12 + i * 0.16).toFixed(2), key }))));


// ---- the app full-frame: where its pointer is and what the camera holds, a frame
/** where the take's pointer was in a state (the capture's pixels), and whether its button was down */
export function pointerOf(name: string): { x: number; y: number; held: boolean } {
  const p = META[name]?.pointer;
  return p ? { x: p.x, y: p.y, held: !!p.held } : { x: 800, y: 450, held: false };
}
const ease01 = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
export type AppView = { state: string; cx: number; cy: number; z: number; px: number; py: number; held: boolean; spot?: { rect: [number, number, number, number]; o: number; dim: number } };
/** the spotlight at `local`: the last spot begun, faded in (or glided to from the one before it, when that one hadn't
 * ended), and faded out after its `to` */
function spotAt(spots: Spot[], local: number): AppView["spot"] {
  const list = [...spots].sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
  let i = -1; for (let j = 0; j < list.length; j++) if (local >= (list[j].from ?? 0)) i = j;
  if (i < 0) return undefined;
  const cur = list[i], from = cur.from ?? 0, prev = i > 0 ? list[i - 1] : null;
  const glide = !!prev && (prev.to == null || prev.to >= from);
  const a = ease01((local - from) / 0.35);
  const rect = glide ? (cur.rect.map((c, n) => prev!.rect[n] + (c - prev!.rect[n]) * a) as [number, number, number, number]) : cur.rect;
  const o = Math.min(glide ? 1 : ease01((local - from) / 0.3), cur.to == null ? 1 : 1 - ease01((local - cur.to) / 0.3));
  const d1 = cur.dim ?? DIM, dim = glide ? (prev!.dim ?? DIM) + (d1 - (prev!.dim ?? DIM)) * a : d1;
  return o > 0 ? { rect, o, dim } : undefined;
}
/** v10 (the director on v9, a note: "on all screensharing views don't have the subtle push in ... only zoom in concretely
 * to show something or maintain a wide shot"): no drift. v9 pushed every held app shot in, 0.5% a second up to 6%, so
 * raea check wouldn't call a held capture frozen; a held screen is now held, and a close-up is only a part's `zoom` */
/** an outline's dim on the rest of the window (v9: the rest still readable, the director on v8 a note, and how long a
 * close-up takes to push in or ease back out */
const DIM = 0.42, PUSH = 1.1;
/** an app part at `local` seconds in: the state showing, the camera's centre and zoom on the capture, and the pointer.
 * The pointer glides to each state's place over the 0.45 s before it shows (so the hover lands as it arrives); the
 * camera follows it a beat behind, eased, and never shows past the window's edge. `run` is the seconds since the run
 * of app parts this one carries on began (appRun), for the drift */
export function appView(p: App, local: number, seconds: number, run = local): AppView {
  const st = statesOf(p, seconds);
  let i = 0; for (let j = 0; j < st.length; j++) if (local >= st[j].start) i = j;
  const zoom = p.zoom ?? 1;
  const pointOf = (j: number) => { const o = p.point?.[j]; return o ? { x: o[0], y: o[1] } : pointerOf(st[j].name); };
  const focusOf = (j: number): [number, number] => {
    const f = p.focus && (Array.isArray(p.focus[0]) || p.focus[0] === null ? (p.focus as ([number, number] | null)[])[j] : (p.focus as [number, number]));
    if (f) return f;
    const q = pointOf(j); return [q.x, q.y];
  };
  let [px, py] = [pointOf(0).x, pointOf(0).y], [fx, fy] = focusOf(0);
  for (let j = 1; j < st.length; j++) {
    const gap = st[j].start - st[j - 1].start, d = Math.max(0.12, Math.min(0.45, gap * 0.6));
    const u = ease01((local - (st[j].start - d)) / d), q = pointOf(j);
    px += (q.x - px) * u; py += (q.y - py) * u;
    const v = ease01((local - (st[j].start - d * 0.5)) / (d * 0.5 + 0.4)), [gx, gy] = focusOf(j);
    fx += (gx - fx) * v; fy += (gy - fy) * v;
  }
  const zin = p.push === false ? 1 : ease01((local - (p.pushAt ?? 0)) / PUSH), zout = p.out == null ? 0 : ease01((local - p.out) / PUSH);
  const z0 = zoom <= 1 ? 1 : 1 + (zoom - 1) * zin * (1 - zout);
  const k = zoom <= 1 ? 1 : (z0 - 1) / (zoom - 1);   // the camera's centre leans to the focus as it pushes in
  const z = z0;
  const hw = 800 / z, hh = 450 / z;
  const cx = Math.min(1600 - hw, Math.max(hw, 800 + (fx - 800) * k)), cy = Math.min(900 - hh, Math.max(hh, 450 + (fy - 450) * k));
  const spot = p.spot ? spotAt(Array.isArray(p.spot) ? p.spot : [p.spot], local) : undefined;
  return { state: st[i].name, cx, cy, z, px, py, held: pointerOf(st[i].name).held, spot };
}
/** the seconds since the run of app parts the one at film second `t` belongs to began: a run is an app part and the app
 * parts straight after it that carry on from it (`push: false`) */
const RUNS: { start: number; end: number; run: number }[] = (() => {
  const out: { start: number; end: number; run: number }[] = [];
  let runStart = 0, prevApp = false;
  for (const b of BEATS) for (const { part, start, seconds } of partsOf(b)) {
    const s = b.start + start, app = "app" in part;
    if (app && !(prevApp && part.push === false)) runStart = s;
    if (app) out.push({ start: s, end: s + seconds, run: runStart });
    prevApp = app;
  }
  return out;
})();
export function appRun(t: number): number {
  const r = RUNS.find((x) => t >= x.start - 1e-6 && t < x.end + 1e-6);
  return r ? t - r.run : 0;
}

/** a point on the glass, from the screen's pixels (1600 x 900) */
export function onGlass(px: number, py: number): V3 {
  return [GLASS[0] + (px / 1600 - 0.5) * TMON.screen[0], GLASS[1] + (0.5 - py / 900) * TMON.screen[1], GLASS[2]];
}
/** how far from the glass the camera stands to hold the whole screen at 85% of a 16:9 frame's width, 30 degrees high */
export const GLASS_D = (TMON.screen[0] / 0.85) * (9 / 16) / (2 * Math.tan((15 * Math.PI) / 180));
/** the camera on the glass for a focus, kept inside the screen once it's closer than the whole */
export function glassCam(focus: [number, number, number] | undefined, push: number): { eye: V3; at: V3 } {
  const [fx, fy, z0] = focus ?? [800, 450, 1];
  const z = z0 * (1 + push);
  const hw = 941 / z, hh = 529 / z;
  const cx = z <= 1.18 ? 800 : Math.min(1600 - hw, Math.max(hw, fx));
  const cy = z <= 1.18 ? 450 : Math.min(900 - hh, Math.max(hh, fy));
  const c = onGlass(cx, cy);
  return { eye: [c[0], c[1], c[2] + GLASS_D / z], at: c };
}

/** the end song: the finished music video (out/goose-v5.mp4, linked as assets/tut-song/goose-v5.mp4), its picture on
 * the glass and its own soundtrack under the film, from 11.01 to the end, under the end card. Placed so the hook's first
 * "Quack" (33.92 s into it, out/lyr/words.json) lands just after the narrator's last line ("the song comes up as the voice
 * ends"). `at`: the film second it starts; `from`: the video's second there; `cut`: where it ends. */
export const SONG = (() => {
  const at = beat("11.01").start, quack = at + said("11.01") + 0.3;
  return { src: "tut-song/goose-v5.mp4", at, from: +(33.92 - (quack - at)).toFixed(2), cut: SECONDS, quack };
})();

/** v11 (the director on v10, a note, a note: "shader broken again"): the film in runs of one kind, each rendered on
 * its own. In v10 every swamp shot in a chapter that opened on the app came out without the ink (03, 04, 05, 07, 09),
 * while the chapters that opened in the swamp kept it: a render's 3D look is settled on its first frame. So a run is
 * all 2D (app, desktop, end card) or all 3D (swamp, glass), and a 3D run starts on a 3D frame. */
export function filmRuns(): { id: string; start: number; frames: number; kind: "2d" | "3d"; beat: string }[] {
  const out: { id: string; start: number; frames: number; kind: "2d" | "3d"; beat: string }[] = [];
  for (let f = 0; f < fr(SECONDS); f++) {
    const { b, part } = beatAt(f / FPS), kind = "app" in part || "flat" in part || "black" in part ? "2d" : "3d", last = out[out.length - 1];
    if (last && last.kind === kind) last.frames++;
    else out.push({ id: `r${String(out.length).padStart(2, "0")}`, start: f, frames: 1, kind, beat: b.id });
  }
  return out;
}
