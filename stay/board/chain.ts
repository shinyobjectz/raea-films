// The film as a chain of match cuts on the thirds. Each shot takes the eye in at a point (where the last shot left it,
// on a thing of the same shape, motion or texture) and its action carries the eye to its out point: a cursor's drag, a
// camera move, a light's sweep. So every cut lands the eye where it already is. Times are draft 2's (stay.script.ts),
// on Stay's beats; the montage is fourteen more places from the scene library, a circle handed on each beat, the
// circle travelling from the lower-left third through the centre to the upper right, where the sun is waiting.
import type { Hook } from "./scenes";
import { BEATS } from "../parts/song.gen";

export type Shot = { scene: string; from: number; seconds: number; in: Hook; out: Hook; eye: string; cut: string; montage?: boolean };
const h = (glyph: Hook["glyph"], what: string, at: Hook["at"], motion?: string): Hook => ({ glyph, what, at, ...(motion ? { motion } : {}) });

const MAIN: Omit<Shot, "from">[] = [
  // 11-11, the director: a prompt is typed before there is a picture, never over a moving camera; the office stays the liminal
  // one, is asked to be nicer, and is then changed in raea while we watch; no monitor is turned; the pool is not here
  { scene: "black", seconds: 2.75, in: h("rect", "the prompt: a boring office", "BC"), out: h("rect", "the prompt", "BC"), eye: "the prompt types on the lower third, before there is any picture", cut: "from black" },
  { scene: "office", seconds: 9.44, in: h("rect", "the prompt, where it was", "BC"), out: h("vanish", "the aisle's vanishing point", "CC"), eye: "two held frames, the camera locked: the office the prompt asked for, then (a nicer office) another just as grey down its aisle; the last prompt types: a new way to be creative", cut: "hard cut on \"Hold still\" (2.75): the picture the prompt made" },
  { scene: "office", seconds: 2.82, in: h("vanish", "the same aisle", "CC"), out: h("vanish", "the same aisle", "CC"), eye: "raea answers at the centre and the held frame starts to move: the camera goes in down the aisle; the cursor comes into the room", cut: "on the drop (12.19): no cut in the picture, the picture becomes a place" },
  { scene: "office", seconds: 12.69, in: h("vanish", "the aisle", "CC"), out: h("vanish", "the aisle, the room half changed", "CC"), eye: "the chair picked on the lower left and carried across the aisle; a note on the window (let the morning in): the fittings die, the blinds open, the sun comes through; a second note (somewhere worth staying)", cut: "no cut in the picture (15.01): the take runs on" },
  { scene: "office", seconds: 6.07, in: h("vanish", "the aisle from its far end", "CC"), out: h("rect", "a monitor's screen, pushed into", "FULL"), eye: "the reverse of the aisle: plants come up row by row, lamps on, NOW IT'S A PLACE. on the far wall behind the desks; down and round into a screen", cut: "reverse cut on the vanishing point (27.70): the same aisle from its other end" },
  { scene: "app", seconds: 4.85, in: h("rect", "the app filling the frame", "FULL"), out: h("rect", "the canyon in the viewer, filling the frame", "FULL"), eye: "the app as the monitor showed it; the cursor to the canyon in the viewer, a note (later in the day); then into the viewer until its picture is the frame", cut: "match cut on \"Stay...\" (33.77): the monitor's screen to the app's frame" },
  { scene: "canyon", seconds: 4.47, in: h("rect", "the canyon the viewer showed, the same frame", "FULL"), out: h("circle", "the sun's disc, sinking", "TR", "sinks"), eye: "down the slot's centre; the light the note asked for comes down the walls; GO IN. stands in the slot ahead", cut: "match cut on the drop (38.62): the picture becomes the place" },
  { scene: "laundromat", seconds: 4.69, in: h("circle", "a dryer's glowing window", "TR", "tumbles"), out: h("blob", "the sheet over the lens", "FULL", "drifts"), eye: "the cart carried under the open dryer; a note (slower. let it float.); the sheet drifts out through the centre and over the lens", cut: "match cut on the collapse (43.09): the sun's disc to the dryer's window" },
  { scene: "bedroom", seconds: 4.79, in: h("blob", "the sheet settling on the bed", "FULL"), out: h("circle", "the globe", "BR"), eye: "the sheet settles along the lower third; the globe carried down the desk into the light; CHANGE ONE THING. on the wall behind the desk's things", cut: "match cut on the build (47.78): sheet to sheet" },
  { scene: "bedroom", seconds: 4.06, in: h("circle", "the globe beside the CRT", "BR"), out: h("streaks", "rain on the window, pushed into", "FULL"), eye: "a note (rain on the glass.); from the globe past the fish tank into the window, which fills the frame with rain", cut: "match cut on the globe (52.57)" },
  { scene: "road", seconds: 6.53, in: h("streaks", "rain on the windscreen", "FULL", "wiped"), out: h("rect", "the car coming through its spray", "FULL"), eye: "the wiper sweeps onto the road's vanishing point; outside, a note (soak the road.) and the car comes through its own spray", cut: "match cut on the rain (56.63), the wiper's sweep as the wipe" },
  { scene: "garage", seconds: 5.33, in: h("rect", "the same car, nose-out in its bay", "FULL"), out: h("circle", "its near headlamp, lit", "BL"), eye: "a cone carried out of the bay's mouth; a note (headlights on.) and they light the deck; KEEP THE REST. behind the car and its pillar; down to the near lamp", cut: "match cut on the car (63.16)" },
];
const M = (scene: string, seconds: number, a: Hook["at"], b: Hook["at"], what: string, eye: string): Omit<Shot, "from"> => ({ scene, seconds, in: h("circle", what, a), out: h("circle", what, b), eye, cut: `match cut on the circle, ${a === "BL" ? "lower left" : a === "CC" ? "centre" : a === "TC" ? "upper centre" : "upper right"}`, montage: true });
// The montage's cuts are the song's own beats from the drop at 68.486 to the sea's at 75.361 (twelve of them, about 0.6205 s
// apart and not quite even): seven shots a beat each, then eight at two a beat, the second of each pair on the halfway
// point between two beats. A fixed 0.62 drifted 50 ms off the beat by the gym (the match-cuts lane measured it, 11-11).
const MB = BEATS.filter((b) => b > 68.4 && b < 75.4);
if (MB.length !== 12) throw new Error(`the montage wants the 12 beats from 68.486 to 75.361, found ${MB.length}`);
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const beat = (i: number) => r3(MB[i + 1] - MB[i]);
const half = (i: number) => r3((MB[7 + (i >> 1) + 1] - MB[7 + (i >> 1)]) / 2);
const MONTAGE: Omit<Shot, "from">[] = [
  M("vinyl", beat(0), "BL", "BL", "the record", "the needle drops; it spins up"),
  M("koi", beat(1), "BL", "CC", "the ripples", "a pebble's ripples spread to the centre as we tilt"),
  M("stairwell", beat(2), "CC", "CC", "the stairwell's spiral", "a paper plane falls down the spiral; lights on floor by floor"),
  M("ferris", beat(3), "CC", "CC", "the wheel", "the wheel spins and its bulbs light"),
  M("clocktower", beat(4), "CC", "CC", "a gear", "one gear pushed, every gear turns"),
  M("subway", beat(5), "CC", "CC", "the train's headlight", "the train pulled in by its light"),
  M("diner", beat(6), "CC", "CC", "the coffee cup from above", "the cream turns; the neon goes red to blue"),
  M("gym", half(0), "CC", "TC", "the ball", "bounced up to the upper third, it hangs"),
  M("cathedral", half(1), "TC", "TC", "the rose window", "the sun swung until it lights"),
  M("kelp", half(2), "TC", "TC", "the sun through the surface", "the current slows, the kelp stands"),
  M("lighthouse", half(3), "TC", "TR", "the lens", "the lens turns; we rise and it moves to the upper right"),
  M("turbines", half(4), "TR", "TR", "a rotor", "one spun, the ridge follows"),
  M("court", half(5), "TR", "TR", "the hoop", "the ball drops through, the net swings"),
  M("observatory", half(6), "TR", "TR", "the moon", "the dome opens on it"),
  M("pool", half(7), "TR", "TR", "the pace clock", "its hand sweeps round"),
];
const END: Omit<Shot, "from">[] = [
  { scene: "sea", seconds: 7.45, in: h("circle", "the sun on the sea", "TR"), out: h("rect", "JUST THAT. across the centre", "CC"), eye: "the open sea at sundown, a boat riding it, the sun on the upper-right third; the last note (that's the one. stay.); JUST THAT. stands on the water on the drop", cut: "match cut on the sun (75.36)" },
  { scene: "card", seconds: 6.84, in: h("rect", "raea's lockup", "CC"), out: h("rect", "raea's lockup", "CC"), eye: "the lockup where the app was", cut: "match cut on the centre (82.81)" },
];

export const CHAIN: Shot[] = (() => {
  let t = 0;
  return [...MAIN, ...MONTAGE, ...END].map((s) => { const shot = { ...s, from: Math.round(t * 100) / 100 }; t += s.seconds; return shot; });
})();
export const LENGTH = CHAIN.reduce((a, s) => a + s.seconds, 0);
