// When the cursor clicks, takes hold and lets go, in every shot: the film's clock. the director, 11-11 (assembly 18): "id think
// about the clikcing like a clock ticking so there should be a natural cadence. and it stats just clicking on tick and
// then ramps to tick and tock. it becomes part fo the music with reverbs and oscillation at times".
// Each time is written as about when it should happen and lands on the song's grid (v3/plan.ts onBeat). The picture
// (v3/walk.tsx, v3/places.tsx) takes its times from here, and the sound (tools/ticks.ts) is made from the same list,
// so a click heard is a click seen. No imports but the plan: the sound tool reads this without the renderer.
import { CUTS, MONTAGE, onBeat, shot } from "./plan";

export type Tick = { /** seconds into the shot */ t: number; kind: "click" | "down" | "up" };
const B = (id: string, x: number) => onBeat(id, x);
/** the walk's rooms: the thing each cursor does there, then the door */
export const ROOM_T: Record<string, { /** the cursor takes a flame */ light?: number; /** the sea breaks on the rock */ splash?: number; rest?: number; lamp?: number; /** a slider dragged, from and to */ slide?: [number, number]; /** a swatch clicked */ swatch?: number; click?: number; carry?: [number, number]; /** a thing taken hold of and turned, from and to */ turn?: [number, number]; /** a thing taken hold of and pulled, from and to */ pull?: [number, number]; door?: number }> = {
  hallway: { light: B("hallway", 0.89), door: B("hallway", 2.13) },       // (the threshold, v3/worlds.tsx: the cursor takes the torch's fire, then pushes the great door)
  kitchen: { slide: [B("kitchen", 0.6), B("kitchen", 1.83)], splash: B("kitchen", 1.83), door: B("kitchen", 3.1) },   // (the door in the rock: the weather's slider over the swell; as it tops out a wave bursts up under the cursor and puts its fire out; the door)
  // the new worlds (the director, 11-11: "i really do want every time that door opens its a whole new world"; v3/worlds.tsx):
  living: { click: B("living", 0.6), turn: [B("living", 1.775), B("living", 2.95)], door: B("living", 3.55) },   // (the kelp forest: a click scatters the school; the bulkhead door's wheel turned; the door)
  study: { click: 0.03, door: B("study", 1.5) },                                // (the clouds, on the drop: its click bursts the flock out of the cloud; the door)
  greenhouse: { click: B("greenhouse", 0.5), door: B("greenhouse", 2.1) },     // (the pixel world: a click and its splats ripple out; the door)
  gardendoor: { carry: [B("gardendoor", 0.9), B("gardendoor", 2.5)], door: B("gardendoor", 3.6) },
  // (the cathedral: a click lights the first candle; on the song's boom, 24.52 s, the bar's downbeat and its one kick, the
  // whole nave takes fire at once and the windows go from dusk to sunset; the door)
  dining: { click: B("dining", 0.6), boom: B("dining", 1.04), door: B("dining", 2.75) },
  cellar: { pull: [B("cellar", 0.8), B("cellar", 2.4)], door: B("cellar", 4.4) },   // (the painting: the brush swept over the unpainted door, top to bottom; its knob, the door on the canyon)
};
/** more clicks in each world (the director, 11-11: "i think these shots need more clicking really. its the one off click that
 *  is so boring"): things the cursor taps on its way through, each on the grid, each of which answers (it hops, or
 *  swings if it hangs). `file` is the thing's component in the room. */
export const ROOM_TAPS: Record<string, { t: number; file: string; swing?: boolean }[]> = {};
/** how long the cursor holds a door's knob after it clicks it */
export const DOOR_HOLD = 0.14;
const DROPT = 38.618 - 33.773;                                              // the drop, in the canyon's own seconds
export const PLACE_T = {
  // the canyon: the tumbleweed taken (rest) and carried; thrown up at the slot's right wall on the tick before the drop
  // (release), so it strikes the rock on the drop, and the paint goes out over the walls from there (v3/toss.ts; the director,
  // 11-11, on assembly 23: "can the cursor throw it liek up and to the right before the drop and when it hits the wall it
  // drops and the art comes in from whwhere it makes sontact")
  canyon: { drop: DROPT, rest: B("canyon", 1.2), release: B("canyon", DROPT - 0.62) },
  bedroom: { hold: B("bedroom", 0.6), let: B("bedroom", 2.95) },
  window: { grab: B("window", 0.65), let: B("window", 1.95), close: onBeat("window", 2.61, true) },   // (and the jump cut to the glass, on a beat)
  harbour: { pick: B("harbour", 0.67), put: B("harbour", 1.89), click: B("harbour", 2.53) },
  sea: { slide: [B("sea", 0.31), B("sea", 1.55)] as [number, number] },   // the storm's slider: taken on a beat, let go as the gale is on us
};
const room = (id: string): Tick[] => {
  const r = ROOM_T[id], out: Tick[] = [];
  if (r.light !== undefined) out.push({ t: r.light, kind: "click" });
  if (r.rest !== undefined) out.push({ t: r.rest, kind: "click" });
  if (r.lamp !== undefined) out.push({ t: r.lamp, kind: "click" });
  if (r.slide) out.push({ t: r.slide[0], kind: "down" }, { t: r.slide[1], kind: "up" });
  if (r.swatch !== undefined) out.push({ t: r.swatch, kind: "click" });
  if (r.click !== undefined) out.push({ t: r.click, kind: "click" });
  for (const tap of ROOM_TAPS[id] ?? []) out.push({ t: tap.t, kind: "click" });
  if (r.carry) out.push({ t: r.carry[0], kind: "down" }, { t: r.carry[1], kind: "up" });
  if (r.turn) out.push({ t: r.turn[0], kind: "down" }, { t: r.turn[1], kind: "up" });
  if (r.pull) out.push({ t: r.pull[0], kind: "down" }, { t: r.pull[1], kind: "up" });
  if (r.door !== undefined) out.push({ t: r.door, kind: "down" }, { t: r.door + DOOR_HOLD, kind: "up" });
  return out.sort((a, b) => a.t - b.t);
};
const P = PLACE_T;
export const TICKS: Record<string, Tick[]> = {
  ...Object.fromEntries(Object.keys(ROOM_T).map((id) => [id, room(id)])),
  canyon: [{ t: P.canyon.rest, kind: "down" }, { t: P.canyon.release, kind: "up" }],   // (taken, and let go as it is thrown: the strike on the drop is the weed's own sound)
  garden: [], painting: [],                                                  // (no cursor: the pull-out out of the painting, v3/painting.tsx)
  bedroom: [{ t: P.bedroom.hold, kind: "down" }, { t: P.bedroom.let, kind: "up" }],
  window: [{ t: P.window.grab, kind: "down" }, { t: P.window.let, kind: "up" }],
  fern: [], floor: [], wide: [],                                             // (no cursor: the glade, v3/glade.tsx)
  harbour: [{ t: P.harbour.pick, kind: "down" }, { t: P.harbour.put, kind: "up" }, { t: P.harbour.click, kind: "click" }],
  sea: [{ t: P.sea.slide[0], kind: "down" }, { t: P.sea.slide[1], kind: "up" }],
  card: [{ t: onBeat("card", 1.15), kind: "click" }, { t: onBeat("card", 3.2), kind: "click" }],   // (v3/card.tsx CARD_CLICKS: on the lockup, on the download)
  // in the montage every cut is the cursor's click
  ...Object.fromEntries(MONTAGE.map(([id]) => [id, [{ t: 0.01, kind: "click" }] as Tick[]])),
};
/** every tick of the film, in the film's seconds */
export const ALL: { at: number; id: string; kind: Tick["kind"] }[] = CUTS.flatMap(([id]) => (TICKS[id] ?? []).map((k) => ({ at: shot(id).from + k.t, id, kind: k.kind }))).sort((a, b) => a.at - b.at);
