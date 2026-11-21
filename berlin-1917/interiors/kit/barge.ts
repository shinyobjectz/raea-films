// The river barge, 1917-18 (catalogue barge: "long wooden or iron barges, a deckhouse aft, hatch covers; loads of
// bricks, sand, coal, firewood, potatoes; moored along quays, frozen in in hard frost"). The city's bulk goods came by
// water: the Zehdenick brickworks' bricks, for one, reached Berlin by barge, towed by tugs or hauled along the bank.
//   The Finow size (Finowmaß), fixed by the Prussian government in 1845 for the Finow canal's locks: no longer than
//   40.20 m, no wider than 4.60 m, 170 t at 1.40 m draught (de.wikipedia, Finowmaß; iron barges of that size were built from 1905, this kit's are the older wooden kind).
//   The wooden Kahn of that size, after Teubner's "Die Binnenschiffahrt" (1912, on the Finow-size Zille): a flat
//   bottom 8 cm thick tapering to 3 m forward and 2.8 m aft and rising into the ends (the "Kaffen"), upright sides of
//   6 cm planks, floors every 0.9 m; a short foredeck with the boatman's berth, the cabin aft (the "Bude") with a short
//   deck behind it; the steersman on the cabin's roof working the rudder; side decks 0.4 m wide from the foredeck to the
//   mast bench; thwarts across the hold. The mast in the front third, held in a timber frame and lowered for the
//   bridges (de.wikipedia, Kaffenkahn: the bow's beak at most 2.80 m over the light waterline, the stern's lower).
//   Its look after Willy Pragher's photographs of a wooden Kahn in the Landwehrkanal (Landesarchiv Baden-Württemberg,
//   Staatsarchiv Freiburg W 134 Nr. 002059a and b, CC BY 4.0): a tarred hull, a heavy wale, the bow raked and rising,
//   an anchor windlass on the foredeck, thwarts over an open hold.
//   barge-bricks  loaded with bricks stacked in blocks, deep in the water
//   barge-coal    coal heaped in the hold
//   barge-wood    firewood stacked above the gunwale
//   barge-empty   light, riding high, the hold's floor boards bare
//   barge-covered grain or potatoes under hatch boards laid as a low gable
// ASSUMED: the side's depth (1.9 m), the curves of the ends, the cabin's size and windows, the rudder's and tiller's
// size, the mast's length, the windlass, the loads' stacking, the hatch boards' gable. The registration plates are
// left off. Ice and snow are the weather's, not baked in.
// Frame: the keel at y 0, the bow toward +z, the hull centred on z 0 (the rudder's blade reaches 2.1 m past the stern, so the
// size's box runs 42.4 m); DRAFT gives each load's waterline over the keel (place the barge
// at minus it on the water).
import { manifold, type Solid } from "raea/3d";
import { box, hash, lathe, union, zcone } from "./geo";
import { loft, sheerBand, type Station } from "./hulls";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

/** Each barge's waterline over its keel, m (ASSUMED from the Finow size: 1.4 m at 170 t, about 0.4 m light). */
export const DRAFT: Record<string, number> = { "barge-bricks": 1.3, "barge-coal": 1.25, "barge-wood": 1.0, "barge-empty": 0.4, "barge-covered": 1.2 };

const B = 4.6, L = 40.2, HD = 1.9, HOLD: [number, number] = [-13.6, 14.4], HW = 4.46;
/** The deck's height over the keel at z: level amidships, rising straight to the bow's beak and the stern's. */
const deckY = (z: number) => (z > 15 ? HD + (0.55 * (z - 15)) / 5.1 : z < -15 ? HD + (0.25 * (-15 - z)) / 5.1 : HD);

/** A cross-section at z: the bottom's half-beam hb at height yb (the chine), the top's ht at yt. */
const sec = (z: number, yb: number, hb: number, yt: number, ht: number): Station => [z, [[hb, yb], [ht, yt]]];

/** The hull lofted through its sections: level amidships, the ends rising and narrowing (the bow higher). */
function hullSolid(): Solid {
  const ts = [0.2, 0.4, 0.55, 0.7, 0.82, 0.92, 1];
  // the bow a raked spoon rising to a narrow beak (the Kaffe), the stern's lower
  const bow = ts.map((t) => sec(15 + 5.1 * t, 2.0 * t ** 1.4, 2.25 - 1.9 * t ** 1.3, HD + 0.55 * t ** 2, B / 2 - 1.9 * t ** 2));
  const stern = ts.map((t) => sec(-15 - 5.1 * t, 1.55 * t ** 1.4, 2.25 - 1.8 * t ** 1.3, HD + 0.25 * t ** 2, B / 2 - 1.85 * t ** 2));
  return loft([...stern.reverse(), sec(-15, 0, 2.25, HD, B / 2), sec(15, 0, 2.25, HD, B / 2), ...bow]);
}

type Load = "bricks" | "coal" | "wood" | "empty" | "covered";

function barge(load: Load): Part[] {
  // the hold: the hull shrunk by its planking and raised by its floor, from the cabin to a short foredeck at 18 m
  const hull = hullSolid(), hold = hull.scale((B - 0.14) / B, 1, (L - 0.5) / L).move(0, 0.18, 0).intersect(box(B, 3, 18 - HOLD[0], 0, 0.18, (18 + HOLD[0]) / 2));
  // the wales and the plank seams: bands of the hull grown a little, cut to a height, the hold taken out of them
  const band = (y0: number, h: number, out: number) => hull.scale(1 + (2 * out) / B, 1, 1 + (2 * out) / L).intersect(box(8, h, 50, 0, y0, 0)).minus(hold);
  const tar: Solid[] = [hull.minus(hold), sheerBand(hull, B, L, 0.07, 0, 0.2).minus(hold), band(1.1, 0.14, 0.05)]; // the wale follows the sheer
  for (const y of [0.35, 0.6, 0.85, 1.42]) tar.push(band(y, 0.014, 0.012));
  const wood: Solid[] = [], iron: Solid[] = [], cabin: Solid[] = [], white: Solid[] = [], glass: Solid[] = [], felt: Solid[] = [], zinc: Solid[] = [];
  // across the hold: three thwarts, and the mast bench with the frame that holds the mast's heel
  for (const z of [-9, -3, 3]) tar.push(box(HW, 0.18, 0.22, 0, 1.68, z));
  tar.push(box(HW, 0.25, 0.3, 0, 1.62, 9.5));
  for (const x of [-0.26, 0.26]) wood.push(box(0.22, 2.45, 0.22, x, 0.18, 9.5));
  iron.push(rod([-0.4, 2.5, 9.5], [0.4, 2.5, 9.5], 0.035));
  for (const x of [-2.03, 2.03]) wood.push(box(0.4, 0.05, 15 - 9.5, x, HD - 0.05, (9.5 + 15) / 2)); // the side decks, to where the bow narrows
  // the mast lowered for the bridges: its heel in the frame, lying aft on a crutch
  wood.push(zcone(0.09, 0.15, 17.8).move(0, 2.78, 9.5 - 8.9));
  wood.push(rod([-0.9, 0.18, -8], [0.28, 2.9, -8], 0.05), rod([0.9, 0.18, -8], [-0.28, 2.9, -8], 0.05));
  // the foredeck's windlass: two bitts and a drum, a crank at each end; bitts aft
  const yw = deckY(18.7);
  for (const x of [-0.75, 0.75]) tar.push(box(0.24, 0.75, 0.24, x, yw - 0.05, 18.7));
  wood.push(rod([-0.63, yw + 0.42, 18.7], [0.63, yw + 0.42, 18.7], 0.14));
  for (const x of [-0.92, 0.92]) iron.push(rod([x, yw + 0.42, 18.7], [x, yw + 0.72, 18.82], 0.025), rod([x, yw + 0.72, 18.82], [x + Math.sign(x) * 0.18, yw + 0.72, 18.82], 0.02));
  for (const x of [-0.42, 0.42]) iron.push(rod([x, yw + 0.42 - 0.145, 18.7], [x, yw + 0.42 + 0.145, 18.7], 0.012));
  for (const x of [-1.0, 1.0]) tar.push(box(0.22, 0.6, 0.22, x, deckY(-18.2) - 0.05, -18.2));
  // the cabin ("Bude") aft of the hold: varnished boards, two windows a side and one forward by the door, a cambered
  // roof of tarred canvas, the stove's pipe
  const zc = -15.2, zf = HOLD[0];
  let body: Solid = box(3.4, 1.4, 3.2, 0, 1.88, zc);
  for (const s of [-1, 1]) for (const zw of [-15.95, -14.55]) {
    body = body.minus(box(0.08, 0.4, 0.5, s * 1.7, 2.55, zw));
    white.push(box(0.05, 0.48, 0.58, s * 1.7, 2.51, zw).minus(box(0.2, 0.4, 0.5, s * 1.7, 2.55, zw)));
    glass.push(box(0.02, 0.4, 0.5, s * 1.67, 2.55, zw));
  }
  body = body.minus(box(0.72, 1.28, 0.08, 0.8, 1.88, zf), box(0.5, 0.4, 0.08, -0.75, 2.55, zf));
  white.push(box(0.58, 0.48, 0.05, -0.75, 2.51, zf).minus(box(0.5, 0.4, 0.2, -0.75, 2.55, zf)));
  glass.push(box(0.5, 0.4, 0.02, -0.75, 2.55, zf - 0.03));
  cabin.push(body);
  wood.push(box(0.68, 1.25, 0.035, 0.8, 1.88, zf - 0.03));
  iron.push(rod([1.04, 2.45, zf + 0.005], [1.04, 2.45, zf + 0.04], 0.018));
  felt.push(manifold.hull(box(3.56, 0.03, 3.36, 0, 3.27, zc), box(1.2, 0.03, 3.36, 0, 3.4, zc)));
  zinc.push(rod([-1.0, 3.3, -16.0], [-1.0, 4.02, -16.0], 0.065), lathe([[0, 0], [0.15, 0], [0.03, 0.1], [0, 0.1]], -1.0, 4.04, -16.0, 10));
  // the rudder hung on the stern's end by two pintles, its blade reaching down under the rising stern, its head
  // standing high so the tiller runs level over the cabin's roof at the hip of the steersman standing there
  tar.push(rod([0, 0.3, -20.2], [0, 4.3, -20.32], 0.1), manifold.hull(box(0.12, 0.05, 2.0, 0, 0.15, -21.2), box(0.12, 0.05, 1.0, 0, 2.0, -20.7)));
  wood.push(rod([0, 4.18, -20.3], [0, 4.1, -15.3], 0.05));
  iron.push(rod([0, 1.75, -20.36], [0, 1.75, -19.95], 0.028), rod([0, 2.05, -20.37], [0, 2.05, -19.95], 0.028), rod([0, 4.18, -20.4], [0, 4.18, -20.2], 0.07));
  // push poles lying on the gunwale
  for (const x of [-2.2, 2.2]) wood.push(rod([x, HD + 0.04, -13.2], [x, HD + 0.06, -6.6], 0.035));
  const parts: Part[] = [
    { mat: "tar-wood", solid: union(...tar) },
    { mat: "wood-weathered", solid: union(...wood), overlap: true },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "wood-varnish-worn", solid: union(...cabin), overlap: true },
    { mat: "paint-white", solid: union(...white), overlap: true },
    { mat: "glass-dark", solid: union(...glass), overlap: true },
    { mat: "felt", solid: union(...felt), overlap: true },
    { mat: "zinc", solid: union(...zinc), overlap: true },
  ];
  // the load, between the thwarts
  const bays: [number, number][] = [[-13.4, -9.15], [-8.85, -3.15], [-2.85, 2.85], [3.15, 9.3], [9.7, 14.2]];
  if (load === "bricks") parts.push({ mat: "brick-raw", solid: union(...bays.map(([a, b], i) => box(HW - 0.1, 1.4 + 0.05 * ((i * 3) % 4), b - a, 0, 0.18, (a + b) / 2))), overlap: true });
  if (load === "coal") parts.push({ mat: "coal", solid: union(manifold.hull(box(HW - 0.1, 0.01, 22.4, 0, 0.18, -2.15), box(1.6, 0.01, 21, 0, 2.05, -2.15)), manifold.hull(box(HW - 0.1, 0.01, 4.5, 0, 0.18, 11.95), box(1.4, 0.01, 3.2, 0, 1.85, 11.95))), overlap: true });
  if (load === "wood") {
    const stacks: Solid[] = [];
    for (const [i, [a, b]] of bays.entries()) {
      stacks.push(box(HW - 0.1, 1.5, b - a, 0, 0.18, (a + b) / 2));
      if (i > 3) continue;
      // above the gunwale: a stack drawn in, its top course billets laid across with a gap between, a little uneven
      const top = 1.68 + 0.42 + 0.12 * (i % 2);
      stacks.push(box(HW - 0.5, top - 1.68, b - a - 0.5, 0, 1.68, (a + b) / 2));
      for (let z = a + 0.36, k = 0; z < b - 0.3; z += 0.21, k++) stacks.push(box(HW - 0.56 - 0.1 * hash(i, k, 3), 0.1 + 0.05 * hash(i, k, 4), 0.18, 0.05 * (hash(i, k, 5) - 0.5), top, z));
    }
    parts.push({ mat: "wood-split", solid: union(...stacks), overlap: true });
  }
  if (load === "empty") parts.push({ mat: "wood-weathered", solid: union(box(HW, 0.04, HOLD[1] - HOLD[0], 0, 0.18, (HOLD[0] + HOLD[1]) / 2), box(0.35, 0.05, 8, -1.2, 0.22, -2)), overlap: true }); // the floor boards, the gangplank on them
  if (load === "covered") {
    // the hatch boards laid as a low gable from the gunwales to a ridge beam on the thwarts, in sections a man lifts
    // (grain or potatoes beneath, out of the rain and frost); a coaming board along each gunwale takes their feet
    const boards: Solid[] = [], beams: Solid[] = [];
    for (let z = HOLD[0] + 0.2; z + 1.15 <= 14.2; z += 1.2) for (const s of [-1, 1])
      boards.push(manifold.hull(box(0.04, 0.035, 1.15, s * (HW / 2 - 0.02), HD + 0.12, z + 0.575), box(0.04, 0.035, 1.15, s * 0.03, HD + 0.62, z + 0.575)));
    beams.push(box(0.14, 0.62, 27.4, 0, HD + 0.02, 0.4 - 0.02), ...[-1, 1].map((s) => box(0.06, 0.16, 27.4, s * (HW / 2 - 0.03), HD - 0.02, 0.4 - 0.02)));
    parts.push({ mat: "tar-wood", solid: union(...beams), overlap: true }, { mat: "wood-weathered", solid: union(...boards), overlap: true });
  }
  return parts;
}

const P = (id: string, load: Load, tris: number) => prop({ id, items: ["barge"], size: [4.75, 4.35, 42.4], place: "floor", tris, parts: () => barge(load) });
P("barge-bricks", "bricks", 9000);
P("barge-coal", "coal", 9000);
P("barge-wood", "wood", 9000);
P("barge-empty", "empty", 9000);
P("barge-covered", "covered", 9000);

export const KIT_BARGE = true;
