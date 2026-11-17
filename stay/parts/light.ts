// Each place's light: its sun's strength (lux; a render holds it from its first frame, so one a shot) and the camera's
// exposure (stops from raea's default), with a shot's own where it differs from its place's. And the app's screens:
// their glow follows the exposure so a screen reads as a lit monitor on film in a dark room and in the sun alike.
import type { Place, Shot } from "./plan";

export interface Light { lux: number; ev: number }
export const LIGHT: Record<Place, Light> = {
  black: { lux: 1000, ev: 0 }, card: { lux: 1000, ev: 0 },
  pool: { lux: 60000, ev: 2 }, sea: { lux: 9000, ev: -2.5 }, hero: { lux: 9000, ev: -2.5 },
  "app-dark": { lux: 1000, ev: 0 }, burst: { lux: 1000, ev: 0 },
  canyon: { lux: 95000, ev: -2.5 }, glass: { lux: 50000, ev: -4 }, "glass-app": { lux: 50000, ev: -4 },
  road: { lux: 400, ev: 0.5 }, paint: { lux: 2000, ev: 1.0 },
};
/** shots lit unlike their place: the skylit reroll of the pool is in daylight */
export const SHOT_LIGHT: Record<string, Light> = { "pool-d": { lux: 60000, ev: -3.5 } };
export const lightOf = (s: Shot): Light => SHOT_LIGHT[s.name] ?? LIGHT[s.place];

/** a screen's glow (cd/m², an emissive's units) at exposure 0: white on it lands near 0.5 before the tone map */
const SCREEN_NITS = 500;
export const screenGlow = (place: Place) => SCREEN_NITS * 2 ** -LIGHT[place].ev;
/** a glow of `nits` at exposure 0, as bright on film at exposure `ev` */
export const glowAt = (ev: number, nits: number) => nits * 2 ** -ev;
