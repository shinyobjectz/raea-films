// The canal tug, 1917-18 (catalogue tug: "small steam tug with a tall funnel", Spree and canals). The barges came up
// the canals in tow, a canal tug taking one or two Kähne.
//   After the Fortuna (de.wikipedia, Fortuna (Schiff, 1909); photo Dampfschlepper_Fortuna.JPG, CC0), built in 1909 by
//   Gebr. Wiemann, Brandenburg, as the Max for a Berlin firm, called there a typical canal tug: 17.5 x 3.6 m, 1.4 m
//   draught, a riveted steel hull with a rubbing strake round it, a 75 hp compound engine for one or two barges on
//   still water. Its layout from the bow: the skipper's cabin, the wheelhouse, the folding funnel (0.60 m wide,
//   4.24 m high, laid down for the low bridges), the crew's cabin below deck, the towing hook, and aft the wooden
//   companion down to the crew's cabin; coal bunkers either side of the boiler filled through deck scuttles; the engine
//   room in the stern; one plate rudder behind the screw, worked from the wheelhouse's wheel by chains and rods. The
//   photograph: a raked stem and a strong sheer forward, a white line under the deck edge, a glazed wheelhouse, the
//   tall black funnel with a band, two towing bows over the after deck, a counter stern over the screw and rudder.
//   Wiemann's yard list for 1902-03 gives the same size for its small screw tugs, 19 x 4 x 1.7 m and 100 hp.
//   tug          the funnel up
//   tug-lowered  the funnel laid aft on its crutch for a bridge
// ASSUMED: the hull's lines and sheer, the 1909 colours (a black hull, varnished wheelhouse and cabin top), the low
// cabin top forward (the Fortuna's deckhouse there was added later), the wheelhouse's glazing, the skylight, the hook's
// post, the screw's size, the fenders. The funnel's band is plain white; no name or owner's mark.
// Frame: the keel at y 0, the bow toward +z, the hull centred on z 0; DRAFT is its waterline over the keel.
import { manifold, type Solid } from "raea/3d";
import { box, lathe, plate, post, ring, union } from "./geo";
import { loft, sheerBand, type Station } from "./hulls";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

export const DRAFT: Record<string, number> = { tug: 1.4, "tug-lowered": 1.4 };

const L = 17.5, B = 3.6, HD = 2.0;
/** The deck's height over the keel at z: the sheer rising 0.7 m to the stem and 0.3 m to the stern. */
const yd = (z: number) => HD + (z >= 0 ? 0.7 : 0.3) * (z / 8.75) ** 2;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The main hull's section at z (stem to sternpost): full and round in the bilge amidships, fining to a raked stem
 *  forward and aft to a thin sternpost under the counter. */
function station(z: number): Station {
  const d = yd(z);
  if (z < -2.5) {
    const a = clamp((-2.5 - z) / 3.9), hb = 1.8 * (1 - 0.12 * a * a);
    return [z, [[0.06, 0], [lerp(1.0, 0.07, a), lerp(0.02, 0.6, a)], [lerp(1.6, 0.12, a), lerp(0.3, 1.05, a)], [lerp(hb * 0.99, hb * 0.92, a), lerp(0.75, 1.35, a)], [hb, d]]];
  }
  const f = clamp((z - 1.5) / 7.25), hb = Math.max(0.05, 1.8 * Math.max(0, 1 - f ** 2.2) ** 0.55);
  const yk = z > 6 ? d * ((z - 6) / 2.75) ** 1.6 : 0, y = (h: number) => Math.min(yk + h, d - 0.02);
  return [z, [[0.06, yk], [Math.max(0.06, (1 - f) ** 1.3), y(0.02 + 0.3 * f)], [Math.max(0.06, hb * lerp(0.89, 0.6, f)), y(0.3 + 0.5 * f)], [hb * lerp(0.99, 0.9, f), y(0.75 + 0.45 * f)], [hb, d]]];
}

/** The counter's section at z: its underside rising aft over the screw, rounding in to the stern. */
function counter(z: number): Station {
  const c = (-6.2 - z) / 2.55, hb = 1.6 * Math.sqrt(1 - 0.95 * c * c), yc = 1.2 + 0.35 * c ** 1.4;
  return [z, [[hb * 0.75, yc], [hb * 0.97, yc + 0.3], [hb, yd(z)]]];
}

function hullSolid(): Solid {
  const main = [-6.4, -6.0, -5.4, -4.6, -3.6, -2.5, 1.5, 3, 4.3, 5.4, 6.2, 6.9, 7.5, 8.0, 8.4, 8.65, 8.75].map(station);
  return union(loft(main), loft([-6.2, -6.8, -7.4, -7.9, -8.3, -8.6, -8.75].map(counter)));
}

function tug(lowered: boolean): Part[] {
  const hull = hullSolid(), inner = hull.scale(1 - 0.2 / B, 1.6, 1 - 0.2 / L);
  const black: Solid[] = [hull, sheerBand(hull, B, L, 0.07, 0.22, 0.14), hull.move(0, 0.08, 0).minus(hull).minus(inner)]; // the rubbing strake, the toe rail
  const white: Solid[] = [sheerBand(hull, B, L, 0.006, 0.05, 0.05)];
  const deck: Solid[] = [hull.scale(1 - 0.2 / B, 1, 1 - 0.2 / L).move(0, 0.02, 0).minus(hull)];
  const wood: Solid[] = [], iron: Solid[] = [], glass: Solid[] = [], felt: Solid[] = [], brass: Solid[] = [], cast: Solid[] = [], jute: Solid[] = [];
  // forward: the skipper's cabin below, its top with portlights and a sliding hatch
  const yf = yd(5.4);
  wood.push(box(1.5, 0.55, 1.6, 0, yf - 0.05, 5.4), box(0.62, 0.14, 0.7, 0, yf + 0.5, 4.95), box(0.7, 0.04, 0.74, 0, yf + 0.64, 4.85));
  for (const s of [-1, 1]) for (const z of [5.0, 5.8]) { brass.push(rod([s * 0.74, yf + 0.27, z], [s * 0.77, yf + 0.27, z], 0.075)); glass.push(rod([s * 0.765, yf + 0.27, z], [s * 0.775, yf + 0.27, z], 0.055)); }
  // the wheelhouse: panelled to the sill, glazed all round above, a cambered roof; the wheel inside by the front
  const zw = 2.2, yw = yd(zw) - 0.02, ys = yw + 0.93, yh = ys + 0.85;
  wood.push(box(1.8, 0.93, 1.4, 0, yw, zw), box(1.84, 0.06, 1.44, 0, ys - 0.03, zw), box(1.84, 0.13, 1.44, 0, yh, zw).minus(box(1.6, 0.3, 1.2, 0, yh - 0.05, zw)));
  for (const [x, z] of [[-0.86, zw - 0.66], [0.86, zw - 0.66], [-0.86, zw + 0.66], [0.86, zw + 0.66], [-0.3, zw + 0.68], [0.3, zw + 0.68], [-0.88, zw], [0.88, zw], [0.25, zw - 0.68]] as const)
    wood.push(box(0.07, 0.86, 0.07, x, ys, z));
  glass.push(box(1.76, 0.85, 1.36, 0, ys, zw).minus(box(1.7, 0.9, 1.3, 0, ys - 0.02, zw)));
  felt.push(manifold.hull(box(1.98, 0.03, 1.58, 0, yh + 0.13, zw), box(1.0, 0.03, 1.58, 0, yh + 0.22, zw)));
  iron.push(rod([0.55, yw + 0.95, zw - 0.71], [0.55, yw + 1.0, zw - 0.75], 0.015)); // the door's handle, aft
  wood.push(ring(0.3, 0.022, 20, 6).move(0, ys + 0.2, zw + 0.42), box(0.12, ys + 0.2 - yw, 0.12, 0, yw, zw + 0.5));
  for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; wood.push(rod([0, ys + 0.2, zw + 0.42], [0.38 * Math.cos(a), ys + 0.2 + 0.38 * Math.sin(a), zw + 0.42], 0.016)); }
  // the side lights on boards at the wheelhouse's front corners (port red at +x, starboard green at -x), a lifebuoy aside
  for (const s of [-1, 1]) {
    white.push(box(0.03, 0.34, 0.46, s * 0.96, ys + 0.05, zw + 0.45));
    iron.push(box(0.12, 0.18, 0.14, s * 1.04, ys + 0.13, zw + 0.55));
  }
  const lamps: Part[] = [
    { mat: "glass-ruby", solid: box(0.02, 0.12, 0.1, 1.1, ys + 0.16, zw + 0.55), overlap: true },
    { mat: "glass-green", solid: box(0.02, 0.12, 0.1, -1.1, ys + 0.16, zw + 0.55), overlap: true },
  ];
  white.push(ring(0.3, 0.05, 16, 6).rotate(0, 90, 0).move(0.95, yw + 0.5, zw - 0.2));
  // the funnel on the boiler casing, the coal scuttles beside it; its upper part hinged aft to lie down for a bridge
  const zf = 0.4, yc = yd(zf) - 0.03, yj = yc + 0.98;
  black.push(box(1.0, 0.35, 1.0, 0, yc, zf), post(0.3, 0.63, 0, yc + 0.35, zf), post(0.34, 0.04, 0, yj - 0.04, zf));
  for (const x of [-0.14, 0.14]) iron.push(box(0.05, 0.12, 0.1, x, yj - 0.06, zf - 0.33));
  iron.push(rod([-0.2, yj, zf - 0.35], [0.2, yj, zf - 0.35], 0.02));
  const top: Record<string, Solid[]> = { black: [post(0.3, 3.29, 0, yj, zf), post(0.325, 0.06, 0, yj + 3.23, zf)], white: [post(0.305, 0.35, 0, yj + 2.45, zf)], iron: [rod([0, yj + 0.1, zf + 0.34], [0, yj + 2.1, zf + 0.34], 0.02)], brass: [lathe([[0, 0], [0.045, 0], [0.045, 0.2], [0.03, 0.23], [0, 0.23]], 0, yj + 2.1, zf + 0.34, 10)] };
  // laid down: turned 90 degrees about the hinge on its aft edge, the top going aft to a crutch over the skylight
  const fold = (s: Solid) => (lowered ? s.move(0, -yj, -(zf - 0.3)).rotate(-90, 0, 0).move(0, yj, zf - 0.3) : s);
  black.push(...top.black.map(fold)); white.push(...top.white.map(fold)); iron.push(...top.iron.map(fold)); brass.push(...top.brass.map(fold));
  if (lowered) iron.push(rod([-0.35, yd(-2.6), -2.6], [0, yj - 0.02, -2.6], 0.025), rod([0.35, yd(-2.6), -2.6], [0, yj - 0.02, -2.6], 0.025));
  for (const [x, z] of [[-1.15, 1.0], [1.15, 1.0], [-1.15, -0.2], [1.15, -0.2]]) cast.push(post(0.17, 0.04, x, yd(z), z));
  // the engine room's skylight: a coaming, its two glazed lids pitched, bars over the glass
  const zs = -1.9, yk = yd(zs) - 0.02;
  wood.push(box(1.2, 0.3, 1.6, 0, yk, zs));
  glass.push(manifold.hull(box(1.2, 0.02, 1.6, 0, yk + 0.3, zs), box(0.06, 0.02, 1.6, 0, yk + 0.5, zs)));
  for (const z of [zs - 0.6, zs - 0.2, zs + 0.2, zs + 0.6]) for (const s of [-1, 1]) iron.push(rod([s * 0.62, yk + 0.31, z], [s * 0.02, yk + 0.53, z], 0.012));
  // the towing hook on its post, its release lever; two towing bows aft to carry the line clear of the deck
  const zh = -3.4, yt = yd(zh) - 0.02 + 0.75;
  iron.push(box(0.2, 0.75, 0.2, 0, yd(zh) - 0.02, zh), rod([0, yt - 0.08, zh - 0.1], [0, yt - 0.08, zh - 0.42], 0.045));
  iron.push(ring(0.1, 0.026, 18, 8).rotate(0, 90, 0).intersect(box(0.1, 0.14, 0.3, 0, -0.14, 0)).move(0, yt - 0.08, zh - 0.52), rod([0, yt - 0.04, zh - 0.05], [0, yt + 0.35, zh + 0.3], 0.02));
  for (const z of [-4.6, -6.0]) iron.push(ring(1.42, 0.035, 24, 6).intersect(box(3.0, 1.6, 0.1, 0, 0, 0)).scale(1, 0.62, 1).move(0, yd(z) - 0.02, z));
  // the companion down to the crew's cabin, aft: a wooden hood with a sliding top, its doors forward
  const za = -7.1, ya = yd(za) - 0.03;
  wood.push(box(0.8, 0.7, 0.8, 0, ya, za), box(0.88, 0.06, 0.6, 0, ya + 0.7, za + 0.05), box(0.3, 0.6, 0.03, -0.17, ya + 0.04, za + 0.41), box(0.3, 0.6, 0.03, 0.17, ya + 0.04, za + 0.41));
  // the rudder's quadrant on deck and the chains and rods from the wheel along each side
  iron.push(manifold.hull(box(0.06, 0.04, 0.06, 0, ya + 0.03, -7.4), box(1.1, 0.04, 0.06, 0, ya + 0.03, -7.05)));
  for (const s of [-1, 1]) iron.push(rod([s * 0.9, yd(1.5) + 0.04, 1.5], [s * 1.25, yd(-3) + 0.04, -3], 0.014), rod([s * 1.25, yd(-3) + 0.04, -3], [s * 0.55, ya + 0.06, -7.05], 0.014));
  // bitts forward and aft, single bollards amidships, the stern's flagstaff (no flag)
  for (const [x, z] of [[-0.35, 7.2], [0.35, 7.2], [-0.45, -8.0], [0.45, -8.0], [-1.45, -1.0], [1.45, -1.0]]) iron.push(post(0.09, 0.36, x, yd(z) - 0.02, z), post(0.12, 0.04, x, yd(z) + 0.34, z));
  wood.push(rod([0, yd(-8.55), -8.55], [0, yd(-8.55) + 2.0, -8.7], 0.025));
  // the screw on its shaft out of the sternpost, the sole piece under it carrying the rudder's heel, the plate rudder
  cast.push(rod([0, 0.68, -6.2], [0, 0.68, -6.95], 0.05), lathe([[0, 0], [0.1, 0], [0.09, 0.3], [0.04, 0.38], [0, 0.38]], 0, 0, 0, 12).rotate(-90, 0, 0).move(0, 0.68, -6.6));
  const blade = plate(Array.from({ length: 12 }, (_, i) => [0.17 * Math.cos((i * Math.PI) / 6), 0.28 + 0.22 * Math.sin((i * Math.PI) / 6)] as [number, number]), 0.025);
  for (let k = 0; k < 4; k++) cast.push(blade.rotate(0, 32, 0).rotate(0, 0, 45 + 90 * k).move(0, 0.68, -6.8));
  iron.push(box(0.12, 0.1, 1.15, 0, 0, -6.92), rod([0, 0.08, -7.42], [0, 1.6, -7.42], 0.05), box(0.05, 1.05, 0.8, 0, 0.12, -7.82));
  // rope fenders hung over the rail
  for (const s of [-1, 1]) for (const z of [3.6, -3.0]) {
    const d = yd(z), x = s * (z > 0 ? 1.76 : 1.82);
    jute.push(post(0.1, 0.42, x, d - 0.7, z), rod([x, d - 0.28, z], [s * 1.7, d + 0.08, z], 0.012));
  }
  return [
    { mat: "lacquer-black-worn", solid: union(...black) },
    { mat: "paint-white", solid: union(...white), overlap: true },
    { mat: "wood-weathered", solid: union(...deck), overlap: true },
    { mat: "wood-varnish-worn", solid: union(...wood), overlap: true },
    { mat: "glass-dark", solid: union(...glass), overlap: true },
    { mat: "felt", solid: union(...felt), overlap: true },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "iron-cast", solid: union(...cast), overlap: true },
    { mat: "brass", solid: union(...brass), overlap: true },
    { mat: "jute", solid: union(...jute), overlap: true },
    ...lamps,
  ];
}

prop({ id: "tug", items: ["tug"], size: [3.9, 6.3, 17.6], place: "floor", tris: 10000, parts: () => tug(false) });
prop({ id: "tug-lowered", items: ["tug"], size: [3.9, 4.3, 17.6], place: "floor", tris: 10000, parts: () => tug(true) });

export const KIT_TUG = true;
