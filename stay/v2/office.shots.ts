// The office across four shots of the chain (2 to 5): where every piece, the camera and the light are at T seconds
// after the office comes up (2.75 s into the film). No engine imports: the clip check runs this under bun.
//
// the director, 11-11: "the prompts are nie but somethign about them amke no sense while thecamera is moving in the shot" and
// "that whole office scene was better off in the liminal spce office, and then we prompt it ot be nicer office and
// then use the raea app ... and then we see it transform beof out eyes". So:
//  - a prompt makes a picture: under the prompts the office is a held frame, the camera locked. "a nicer office" gets
//    another held frame, as grey as the first;
//  - "a new way to be creative" gets raea, on the drop, and that is when the camera first moves: the picture is a place;
//  - from there it is the app: the cursor moves a chair, a note lets the morning in, a second note makes it somewhere
//    worth staying, and the room changes while we watch. The camera all but holds while a note is written.
//  - no monitor is turned; the last shot is the reverse angle on the finished room and a push into a screen.
import { HERO, ROOM, ROWS, TOP, WINDOWS, officeRoom } from "../sets/office-room";
import { SHOTS } from "./plan";
import { ease, lerp, ramp, type V3 } from "./math";
import { camOn, type CamKey } from "./path";
import type { Piece } from "./stage";

export const OFFICE = SHOTS.filter((s) => s.scene === "office");          // the four shots, in order
export const T0 = OFFICE[0].from;                                          // 2.75
export const startOf = (i: number) => OFFICE[i].from - T0;                 // a shot's first second on the take's clock
const DROP = startOf(1);                                                   // 9.44: the answer
const HELD = startOf(2);                                                   // 12.26
const REV = startOf(3);                                                    // 24.95: the reverse angle
const END = REV + OFFICE[3].seconds;                                       // 31.02

// the beats, on the take's clock
export const BEATS = {
  nicer: 1.19,                         // "a nicer office" starts typing (the song's hit at 3.94)
  reroll: 4.36,                        // its picture arrives (the beat at 7.11): another held frame
  creative: 6.14,                      // "a new way to be creative" starts typing (the hit at 8.89)
  raea: [DROP, DROP + 2.0] as const,   // the lockup, on the drop
  cursorIn: DROP + 1.2,
  chair: [HELD + 0.8, HELD + 3.0] as const,           // picked and moved across the aisle
  note: { open: HELD + 3.8, sent: HELD + 5.5 },       // "let the morning in."
  tubesOut: [HELD + 5.7, HELD + 7.1] as const,        // the fittings go dark, the far row first
  blinds: [HELD + 6.4, HELD + 9.0] as const,          // the slats turn and the sun comes in
  note2: { open: HELD + 9.5, sent: HELD + 11.3 },     // "somewhere worth staying."
  grow: [HELD + 11.5, REV + 2.4] as const,            // the plants come up, the near rows first
  word: REV + 0.5,                                     // NOW IT'S A PLACE.
  wake: REV + 3.2,
};
/** the drawing's flash: the picture as its construction lines for a few frames as each note is taken up */
export const WIRE: [number, number][] = [[BEATS.note.sent + 0.05, BEATS.note.sent + 0.3], [BEATS.note2.sent + 0.05, BEATS.note2.sent + 0.3]];
export const TUBES = 9000;                              // a fitting's panel, lit
export const WINDOW: V3 = [ROOM.x - 0.1, 1.75, WINDOWS[3]];                // where the first note is pinned
export const WALL: V3 = [3.4 + 0.2, 1.1, ROWS[2] - 1.6];                   // and the second: a partition
export const SCREEN: V3 = [3.4 + 0.43 - 0.2865, TOP + 0.384, ROWS[1]];    // the hero monitor's glass
const AISLE: V3 = [0, 1.25, ROOM.z1];
const BACK: V3 = [0, 1.45, ROOM.z0];

// the two held frames the generator gives
const STILL_A = { eye: [-5.4, 1.62, 3.9] as V3, look: [2.6, 0.95, -10] as V3, fov: 52 };
const STILL_B = { eye: [0, 1.3, 4.3] as V3, look: AISLE, fov: 46 };
// the take: at rest on the second frame until the drop (a key repeated is a rest), then one curve to the reverse cut
const CAM: CamKey[] = [
  { t: DROP - 1, ...STILL_B },
  { t: DROP, ...STILL_B },
  // from here the dolly's speed stays between a quarter and half a metre a second: it eases while a note is written
  // and never stops (the check on his "super jadggand start stop" note measures it)
  { t: HELD, eye: [0.03, 1.3, 3.55], look: AISLE, fov: 46 },
  { t: HELD + 3.0, eye: [0.2, 1.34, 2.25], look: [0.6, 1.22, ROOM.z1], fov: 45 },
  { t: BEATS.note.open, eye: [0.28, 1.38, 1.95], look: [3.0, 1.3, -12], fov: 44 },
  { t: BEATS.note.sent, eye: [0.36, 1.44, 1.55], look: [4.2, 1.34, -12], fov: 44 },
  { t: HELD + 8.6, eye: [0.56, 1.64, 0.25], look: [6.2, 1.5, WINDOWS[2] + 0.6], fov: 42 },
  { t: BEATS.note2.open, eye: [0.6, 1.68, -0.1], look: [5.6, 1.4, -7], fov: 42 },
  { t: BEATS.note2.sent, eye: [0.62, 1.7, -0.55], look: [4.8, 1.36, -8.5], fov: 42 },
  { t: REV, eye: [0.5, 1.66, -1.15], look: [1.6, 1.25, ROOM.z1], fov: 43 },
];
// the reverse: from the far end back up the aisle, down and round into the screen
const CAM2: CamKey[] = [
  { t: REV, eye: [0.1, 2.05, -15.2], look: BACK, fov: 46 },
  { t: REV + 2.6, eye: [0.3, 1.8, -11.6], look: [0.6, 1.4, ROOM.z0], fov: 45 },
  { t: REV + 4.3, eye: [1.2, 1.5, -6.2], look: [3.3, 1.22, ROWS[1] - 0.1], fov: 42 },
  { t: END - 0.5, eye: [SCREEN[0] - 0.95, SCREEN[1] + 0.02, SCREEN[2] - 0.12], look: SCREEN, fov: 38 },
  { t: END, eye: [SCREEN[0] - 0.44, SCREEN[1], SCREEN[2]], look: SCREEN, fov: 36 },
];

export function officeAt(T: number) {
  const moved = ease(ramp(T, BEATS.chair[0], BEATS.chair[1]));
  const open = ease(ramp(T, BEATS.blinds[0], BEATS.blinds[1]));
  const dark = ramp(T, BEATS.tubesOut[0], BEATS.tubesOut[1] + 0.2);
  const nice = T >= BEATS.note2.sent + 0.12;                               // under the drawing's flash
  const grow = ramp(T, BEATS.grow[0], BEATS.grow[1]);
  const z = ROWS[HERO.row];
  // the chair: from its desk on the left, across the aisle on a shallow arc, to the hero desk on the right
  const chair: V3 = [lerp(-2.2, 1.95, moved), 0, z + 0.9 + 0.45 * Math.sin(moved * Math.PI)];
  // the first frame's office is dressed one way, every frame after it another: the reroll is a different picture
  const seed = T < BEATS.reroll ? 4 : 1;
  const pieces: Piece[] = officeRoom(seed, { tubes: 0, blinds: 0.82 * (1 - open), nice, grow });
  pieces.push({ place: "office", name: "chair-hero", file: "chair", at: chair, yaw: 2.4 - 2.1 * moved, clip: "swivel", t: 0 });
  // the fittings: all lit, then dark a row at a time from the far end once the note is sent
  const tubes = (row: number) => (T > BEATS.tubesOut[0] + ((5 - row) / 5) * (BEATS.tubesOut[1] - BEATS.tubesOut[0]) ? 0 : TUBES);
  const cam = T < BEATS.reroll ? STILL_A : T < REV ? camOn(CAM, T) : camOn(CAM2, T);
  return {
    pieces, chair, tubes, open, nice, grow, cam,
    /** a cut in the picture this frame (the reroll, the reverse): the lighting starts afresh */
    cut: Math.abs(T - BEATS.reroll) < 0.02 || Math.abs(T - REV) < 0.02,
    held: T < DROP,
    wire: WIRE.some(([a, b]) => T >= a && T < b) ? 1 : 0,
    sun: { lux: 70000 * open, from: [40, 6, 6] as V3, to: [0, 0.8, -6] as V3, color: "#ffbf7a", shafts: true },
    // exposed for the fittings, opened up as they die, then closed down again for the sun
    ev: lerp(lerp(0.6, 3.4, ease(dark)), 2.5, open) + (T >= REV ? 1.5 : 0),
    sky: 0.02 + 2.6 * open,
    haze: 0.032,
    // the stock: the generator's cold reel until the morning is let in, raea's warm print after
    warm: open,
    wake: ramp(T, BEATS.wake, BEATS.wake + 0.5),
  };
}
