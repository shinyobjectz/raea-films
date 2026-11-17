// v3's plan: the cuts, on Stay's own beats (the same grid the chain was cut on), and what stands in each.
import { BEATS, SONG } from "../parts/song.gen";
// The frame (v3/size.json): 1350x1080 (5:4), or 1080x1920 for the version for a phone held upright (tools/tall.sh writes
// it for a tall build and puts it back). Everything sized to the frame reads W and H; TALL picks the tall framing.
import SIZE from "./size.json";
export const FPS = 30, W: number = SIZE.w, H: number = SIZE.h;
export const TALL = H > W;
/** the frame's short side: what sizes made to "the film's 1080 lines" (the montage's circle, the faces' ring) are a share
 *  of, so they are the same size on a tall frame as on the 5:4 one (1080 both) */
export const SHORT = Math.min(W, H);
/** how wide (in frame heights) the window is that the garden's painted STAY must fit: the frame's own width, or, for the
 *  5:4 still on the bedroom's canvas made for the tall version (tools/painting.sh tall), the tall frame's middle */
export const LETTER_FIT: number = (SIZE as { letters?: number }).letters ?? W / H;
export const LENGTH = 89.656;
/** before the song (v3/intro.tsx): PAD seconds of the empty frame and the words, then the song's first INTRO_OVER frames,
 *  which are silent, so the cut to the door is on its first sound (0.504 s in). The film is PAD seconds longer than the
 *  song; the song is laid PAD seconds in (tools/v3.sh) and the hallway's first INTRO_OVER frames are the intro's
 *  (tools/join.ts). Every time in the plan stays the song's own. */
// (1.5 s since assembly 23, the director: "this sucks make it quicker"; it was 3 s)
export const PAD = 1.5, INTRO_OVER = 15;
export const FRAMES = Math.round(LENGTH * FPS);
const MB = BEATS.filter((b) => b > 68.4 && b < 75.4);                      // the montage's twelve beats, 68.486 to 75.361
if (MB.length !== 12) throw new Error(`the montage wants 12 beats, found ${MB.length}`);
// The montage (the director, 11-11, assembly 18: "the sequence from a minute on as we cut fast is not match cutting well and
// needs to factor in more of the full color scenes ... would like to see the fishing boat a little longer"):
// nineteen places in eight beats, every one framed on a round thing held at the centre of the frame at one size (the
// size grows through the whole run, so the circle is handed from cut to cut and comes toward us), then the boat for
// three beats. The run quickens: twelve places at two a beat, three at three a beat, the last four at four a beat.
const between = (i: number, k: number) => MB[i] + (MB[i + 1] - MB[i]) * k;
// (from the subway on, four corridors: the director, 11-11, on assembly 23, at the subway's last frames, the lens flying through
// the arriving car: "when we hit this cut out a few of the next shots to match cut on this mobement speed of different
// well designed hallways or corridors that match this train size it adds more variation and makes it look like we are
// flying down and match cutting hallwways". The office, gym, ferris wheel and pool gave them their places.)
export const MONTAGE: [string, number][] = [
  ...(["vinyl", "diner", "koi", "clocktower", "stairwell", "laundromat", "court", "subway", "hotel", "school", "vault", "torii"] as const).map((id, i): [string, number] => [id, between(i >> 1, (i % 2) / 2)]),
  // (11-11, assembly 22: "also need the faces renders in there too": the faces had two beats, six cuts of six frames, and
  // went by unseen. The run's last two beats, seven places at three and four a beat, are theirs now: four beats of faces.)
];
/** the montage places shown in full colour (their round thing drawn); the others are drawings with the round thing in
 *  colour. They are ordered two and two, so the frame changes between light and dark on every other cut at most. */
// (the corridors all in colour: the run from the subway on is one flight, real all the way, so nothing flashes)
export const IN_COLOUR = ["koi", "clocktower", "court", "subway", "hotel", "school", "vault", "torii"];
export const MONTAGE_FROM = MB[0], MONTAGE_TO = MB[6];
/** every cut: a shot's id and the second it starts */
export const CUTS: [string, number][] = [
  // the opening is a walk through doors: a few seconds a room, each crossed toward the door in its far wall
  // (the director, 11-11: "the first 30-40s econds right now is all ofcicie id rather not be there and shift into amny other
  // places we can build and center on something liek a door for match cuts")
  ["hallway", 0], ["kitchen", 2.75], ["living", 7.113], ["study", 12.189], ["greenhouse", 15.006], ["gardendoor", 18.361], ["dining", 23.48], ["cellar", 27.7],
  // (the garden comes in three beats early, on the sung "stay", 11-11: "could we have it come in a feww beats ealier on a pull out")
  // (the garden turns out to be a painting on the kid's bedroom wall, v3/painting.tsx: "painting" is the pull-out from
  // its canvas across the room, its own shot from the frame the canvas fills, 96 frames in, so the garden and the room
  // are separate renders)
  ["canyon", 33.773], ["garden", 41.387], ["painting", 44.6], ["bedroom", 47.78], ["window", 52.568],
  // (the view from the car's seat is cut, 11-11: its dashboard and dotted rain were the least real thing in the film)
  // (the road is gone, 11-12: a forest glade in its slot, v3/glade.tsx, getting wider shot by shot: a fern's edge with
  // water at its tips, the floor by a mossy log, then on the song's strongest hit (60.06) the wide, which turns up into
  // the sun so the glare is the cut to the dock)
  ["fern", 56.63], ["floor", 58.49], ["wide", 60.06], ["harbour", 63.16],
  ...MONTAGE,
  // the sea: a ship at daybreak, the storm's slider dragged and the sea building under it; then, on a flash of
  // lightning, the gale and one great wave (blender/storm.py)
  // (and before it, two beats of faces: raea's people match-cut close, v3/faces.tsx, rendered and DLSS'd by tools/faces.sh)
  // (the sea is ONE shot, 3.1 s: the director, 11-11, "why does the camera jump it shoudl just eb one shot")
  ["faces", MB[6]], ["sea", MB[10]],
  // the ending is the product: quick cuts over the app (its timeline, its notes, its feed, the film in its viewer), the
  // whole window on the song's last drop, the card
  ["ui-timeline", 77.842], ["ui-notes", 78.466], ["ui-feed", 79.081], ["ui-robot", 79.719], ["platform", 80.32], ["card", 82.808],
];
export type Shot = { id: string; n: number; from: number; f0: number; f1: number; frames: number; seconds: number };
export const SHOTS: Shot[] = CUTS.map(([id, from], i) => {
  const f0 = Math.ceil(from * FPS - 1e-6), f1 = i + 1 < CUTS.length ? Math.ceil(CUTS[i + 1][1] * FPS - 1e-6) : FRAMES;
  return { id, n: i + 1, from, f0, f1, frames: f1 - f0, seconds: (f1 - f0) / FPS };
});
export const shot = (id: string) => { const s = SHOTS.find((x) => x.id === id); if (!s) throw new Error(`no shot ${id}`); return s; };

// The cursor's own clock. the director, 11-11 (assembly 18): "maybe the clicks and thigns could be onbeat ... like a clock
// ticking so there should be a natural cadence"; and on assembly 22: "the clicking noise is really off beat".
// The song is loose: raea song's map has 83 beats at uneven gaps (some two beats long, some two and a half, some five
// and a third), and no one period fits its onsets (tools/onsets.ts). The first grid stretched even steps across every
// gap, so the clock's tick ran anywhere from 0.47 to 0.79 s, and it put a half-point between every pair: a third of the
// film's clicks fell on those. That is what was off.
// Now the clock keeps one cadence, the song's own tempo (SONG.tempo, 0.62 s), and takes its time from what is heard:
// it starts again on each of the map's beats and ticks on from there at that one period. Where a gap is a whole number
// of ticks (within 6%) the ticks are fitted to it exactly; where it isn't, the last tick before the next beat is left
// out if it would crowd it. There are no half-points. A click lands on the nearest tick.
const TICK = 60 / SONG.tempo;
export const GRID: number[] = (() => {
  const marks = [...BEATS.filter((x) => x < LENGTH), LENGTH], out: number[] = [];
  for (let t = marks[0] - TICK; t > 0.05; t -= TICK) out.unshift(t);            // (before the first beat, counted back from it)
  for (let i = 0; i + 1 < marks.length; i++) {
    const from = marks[i], gap = marks[i + 1] - from, n = Math.max(1, Math.round(gap / TICK)), fit = gap / n;
    out.push(from);
    if (Math.abs(fit - TICK) / TICK <= 0.06) { for (let j = 1; j < n; j++) out.push(from + j * fit); }
    else { for (let t = from + TICK; t < marks[i + 1] - 0.45 * TICK; t += TICK) out.push(t); }
  }
  return out;
})();
/** the song's own beats (raea song's map): the strong ticks */
export const STRONG: number[] = BEATS.filter((x) => x < LENGTH);
/** the tick nearest `t` seconds into shot `id` (in the shot's own seconds); `whole`: one of the song's own beats only */
export function onBeat(id: string, t: number, whole = false): number {
  const s = shot(id), abs = s.from + t, g = whole ? STRONG : GRID;
  const best = g.reduce((a, b) => (Math.abs(b - abs) < Math.abs(a - abs) ? b : a));
  return Math.max(0, best - s.from);
}

// The opening is one take (v3/walk.tsx), rendered a world at a time. Each world but the last is rendered TAIL frames past
// its join, on into the next world, and the assembly blends those frames into the next world's first ones
// (tools/join.ts): the picture on both sides of a join is the same place from the same lens, so the blend only carries
// the small difference in its light across.
export const TAKE_IDS = ["hallway", "kitchen", "living", "study", "greenhouse", "gardendoor", "dining", "cellar"];
export const TAIL = 6;
// A world whose door shows the next world by its pictures (v3/kit.tsx Portal; the kitchen, kelp, clouds and pixel
// worlds) has no tail: past its door it can only show itself (the pictures stop at the join), and the tail's first frame
// is 6/7 of the blend. Its last frame is already the next world from this lens, so the join is a cut on the same picture.
// (the painting's door, the take's last, shows the canyon by its pictures too: v3/film.tsx intoCanyon)
const PICTURE_JOINS = ["hallway", "kitchen", "living", "study", "greenhouse", "gardendoor", "dining", "cellar"];
export const tailOf = (id: string) => (TAKE_IDS.includes(id) && !PICTURE_JOINS.includes(id) ? TAIL : 0);
