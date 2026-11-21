// A shop door that moves, for a street shot ("A shop door opens: its bell rings; a woman comes out with a
// parcel past the lettered fascia"). The leaves and the bell are their own props with their pivots at the origin, so a
// composition can swing them by the frame. kit/store.ts shopfront-pair-open is the frame without its leaf.
// The Berlin shop door opened inward. Inside, on the head of the frame, hung the bell (the Ladenglocke) on a flat steel
// spring, where the top of the opening door strikes the spring's arm. It rang going out and again as the door swung
// shut behind you.
//
// The shopfront's frame, which shopDoor() below places the parts in: the origin at the opening's bottom middle on the
// room face (the inside face of the wall), x to the left seen from the street, y up, z into the shop (the street at -z).
// In interiors/shell.ts a shop's front wall is 0.64 m, so the street face is at z -0.64.
import { box, lathe, rbox, rodX, taper, union, zcyl } from "./geo";
import { bar } from "./porter";
import type { MatId } from "./mats";
import { prop } from "./prop";

/** A leaf's width: the shopfront-pair's 1.2 m opening with a 2 cm gap each side, or half a 2.35 m pair. */
export const LEAF_W = 1.16;

/** The leaf's parts. `hand` 1 runs +x from the hinge to the latch, -1 runs -x (the left-hand leaf of a pair). */
const leafParts = (hand: 1 | -1) => () => {
  const W = LEAF_W, x = (v: number) => hand * v, m = W / 2;
  return [
    { mat: "wood-dark" as const, solid: union(box(0.1, 2.57, 0.05, x(0.05), 0.03, 0), box(0.1, 2.57, 0.05, x(W - 0.05), 0.03, 0), box(W, 0.85, 0.05, x(m), 0.03, 0), box(W, 0.1, 0.05, x(m), 0.88, 0), box(W, 0.12, 0.05, x(m), 2.48, 0)) },
    { mat: "glass-plate" as const, solid: box(W - 0.2, 1.5, 0.008, x(m), 0.98, 0), overlap: true },
    { mat: "lace-net" as const, solid: box(W - 0.22, 0.72, 0.004, x(m), 0.99, 0.03) },
    { mat: "brass" as const, solid: union(rodX(0.006, W - 0.2, x(m), 1.72, 0.035), rodX(0.006, W - 0.2, x(m), 0.99, 0.035), rodX(0.011, 0.13, x(W - 0.17), 1.05, 0.065), rodX(0.011, 0.13, x(W - 0.17), 1.05, -0.065), zcyl(0.03, 0.14).move(x(W - 0.1), 1.05, 0), box(0.08, 0.3, 0.004, x(W - 0.12), 1.15, -0.028), box(W - 0.04, 0.2, 0.003, x(m), 0.06, -0.027)), overlap: true },
  ];
};

/** The door leaf. Origin on its hinge axis at the floor; it runs +x to the latch, the shop at +z, the street at -z. A
 *  panelled foot, plate glass over it with a lace half-curtain inside on brass rods, a lever handle both sides, a brass
 *  push plate and kick plate to the street. */
prop({ id: "door-leaf", items: ["shop-door"], size: [LEAF_W, 2.6, 0.08], place: "wall", where: "set", tris: 700, parts: leafParts(1) });
/** The same leaf, left-handed: it runs -x from its hinge, for the other half of a pair. */
prop({ id: "door-leaf-l", items: ["shop-door"], size: [LEAF_W, 2.6, 0.08], place: "wall", where: "set", tris: 700, parts: leafParts(-1) });

/** The shop bell on its spring. Origin at the spring's screw on the frame head, inside: a brass plate, the flat spring
 *  curving down and into the shop, the bell hanging at its end with its clapper. A composition swings it about x. */
prop({
  id: "door-bell", items: ["shop-door"], size: [0.12, 0.3, 0.28], place: "hung", where: "set", tris: 500,
  parts: () => {
    const arc = [[0, 0, 0], [0, -0.06, 0.06], [0, -0.13, 0.11], [0, -0.19, 0.14]] as [number, number, number][];
    return [
      { mat: "brass", solid: union(box(0.06, 0.08, 0.01, 0, -0.04, -0.005), lathe([[0, 0], [0.04, 0], [0.038, 0.012], [0.03, 0.05], [0.012, 0.065], [0, 0.068]], 0, -0.29, 0.14, 16)) },
      { mat: "steel-bright", solid: union(...arc.slice(1).map((p, i) => bar(arc[i], p, 0.004)), bar([0, -0.19, 0.14], [0, -0.225, 0.14], 0.003)) },
      { mat: "iron", solid: lathe([[0, 0], [0.008, 0.004], [0, 0.012]], 0, -0.3, 0.14, 8), overlap: true },
    ];
  },
});

/** The leaf's angle (radians, inward) at t seconds: pulled open from inside from 0.25 s, standing while she passes, and
 *  its closer pulling it shut from 1.35 s, quickening at the end. */
export function leafAngle(t: number): number {
  const open = 72 * (Math.PI / 180), ease = (u: number) => u * u * (3 - 2 * u);
  if (t < 0.25) return 0;
  if (t < 0.75) return open * ease((t - 0.25) / 0.5);
  if (t < 1.35) return open;
  if (t < 1.95) { const u = (t - 1.35) / 0.6; return open * (1 - u * u); }
  return 0;
}
/** When the leaf's top passes the bell's arm (about 6 degrees open): going out, and as it swings shut. The sound's cues. */
export const RINGS = [0.34, 1.92];
/** The bell's swing on its spring (radians, about its x) at t: a damped ring from each strike. */
export function bellAngle(t: number): number {
  return RINGS.reduce((a, t0) => (t < t0 ? a : a + 0.3 * Math.exp(-(t - t0) / 0.5) * Math.sin(2 * Math.PI * 3.5 * (t - t0))), 0);
}

export type DoorLeaf = { id: "door-leaf" | "door-leaf-l"; hinge: [number, number, number]; hand: 1 | -1; opens: boolean };
/** A shop door `w` metres wide in the shopfront's frame (above): one leaf up to 1.8 m, centred; wider, a pair meeting in
 *  the middle, the right one (seen from the street) opening and the left one bolted. The hinges stand 12 cm in front of
 *  the origin, the bell's screw 8 cm, on the frame head at 2.63 m over the opening leaf's latch side. A leaf turns about
 *  y by `leafTurn(leaf, t)` in this frame; the bell turns about its own x by bellAngle(t). */
export function shopDoor(w: number): { leaves: DoorLeaf[]; bell: [number, number, number] } {
  if (w < 1.8) return { leaves: [{ id: "door-leaf", hinge: [-LEAF_W / 2, 0, -0.12], hand: 1, opens: true }], bell: [LEAF_W / 2 - 0.23, 2.63, -0.08] };
  const h = LEAF_W + 0.005;
  return {
    leaves: [{ id: "door-leaf", hinge: [-h, 0, -0.12], hand: 1, opens: true }, { id: "door-leaf-l", hinge: [h, 0, -0.12], hand: -1, opens: false }],
    bell: [-h + LEAF_W - 0.23, 2.63, -0.08],
  };
}
/** A leaf's turn about y at t, in the shopfront's frame: inward for the leaf that opens, none for a bolted one. */
export const leafTurn = (l: DoorLeaf, t: number) => (l.opens ? -l.hand * leafAngle(t) : 0);

/** Where a hand grips a leaf's lever at time t, in the shopfront's frame: "in" the shop's side (she pulls the leaf open
 *  from inside on her way out), "out" the street's. The grip is between the rose and the lever's free end, turned with
 *  the leaf about its hinge (a turn a about y: x' = x cos a + z sin a, z' = z cos a - x sin a). For a reach goal per frame;
 *  map it to the world as the leaves are (P in compositions/shot49-door.tsx). */
export function leverAt(l: DoorLeaf, t: number, side: "in" | "out" = "in"): [number, number, number] {
  const qx = l.hand * (LEAF_W - 0.19), qz = side === "in" ? 0.065 : -0.065, a = leafTurn(l, t), c = Math.cos(a), s = Math.sin(a);
  return [l.hinge[0] + qx * c + qz * s, l.hinge[1] + 1.05, l.hinge[2] + qz * c - qx * s];
}

// ── room doors ──────────────────────────────────────────────────────────────────────────────────────────────────────
// A furnished room's back doorway (interiors/furnish.ts, 0.9 x 2.05 m) showed black until the director asked for doors
// (a review note). In the war winters the doors stood shut, to keep in what the stove gave on rationed coal, so
// each doorway has its leaf, closed, as the house painted it: white lacquer with brass in the good flats, the hotels and
// the maid's room; brown oil paint grained like oak, with iron furniture, in the worker flats and kitchens (often with
// the family's coats and the apron on hooks); a dark-stained door with a frosted light in an office. The good flats'
// 1.4 m double door is kit/salon.ts salon-door. Frame as salon-door's: origin at the opening's bottom middle on the
// wall's room face, the room at +z; the furnisher stands each at z 0.05, yaw 0.
const DW = 0.9;
type RoomDoor = "white" | "brown" | "office";
// DH: 2.05 m, or 1.78 under an attic's roof, where the doorway is lower
const roomDoor = (kind: RoomDoor, coats: boolean, DH = 2.05) => () => {
  const up = DH / 2.05;
  const paint = kind === "white" ? "paint-white" : kind === "brown" ? "paint-brown" : "wood-dark";
  const fill = kind === "white" ? "plaster-ceiling" : "wood-mid";
  const metal = kind === "brown" ? "iron" : "brass";
  // the light in the office door's upper half, cut through the leaf
  const light = box(DW - 0.26, 0.86, 0.2, 0, 1.08, -0.04);
  let leaf = box(DW - 0.01, DH - 0.01, 0.04, 0, 0.005, -0.04);
  if (kind === "office") leaf = leaf.minus(light);
  const panels = [-0.2, 0.2].flatMap((x) => [box(0.3, 0.62 * up, 0.012, x, 0.16 * up, -0.015), ...(kind === "office" ? [] : [box(0.3, 0.92 * up, 0.012, x, 1.02 * up, -0.015)])]);
  const parts = [
    { mat: paint as "paint-white", solid: union(leaf,
      // the architrave, 10 cm, and its head
      box(0.1, DH + 0.1, 0.03, -DW / 2 - 0.05, 0, -0.035), box(0.1, DH + 0.1, 0.03, DW / 2 + 0.05, 0, -0.035), box(DW + 0.2, 0.1, 0.03, 0, DH, -0.035), box(DW + 0.28, 0.04, 0.05, 0, DH + 0.1, -0.03)) },
    { mat: fill as "wood-mid", overlap: true, solid: union(...panels) },
    // the lever on its plate, the keyhole under it
    { mat: metal as "brass", overlap: true, solid: union(box(0.045, 0.17, 0.008, DW / 2 - 0.09, 0.95, -0.016), box(0.12, 0.018, 0.022, DW / 2 - 0.14, 1.06, -0.002)) },
    { mat: "cloth-black" as const, overlap: true, solid: box(0.012, 0.03, 0.004, DW / 2 - 0.09, 0.98, -0.011) },
  ];
  if (kind === "office") parts.push({ mat: "glass-frost" as "wood-mid", overlap: true, solid: box(DW - 0.26, 0.86, 0.006, 0, 1.08, -0.04) }, { mat: paint as "wood-mid", overlap: true, solid: box(0.03, 0.86, 0.03, 0, 1.08, -0.035) });
  if (coats) parts.push(
    { mat: "wood-mid" as const, overlap: true, solid: box(0.56, 0.07, 0.02, 0, 1.74, 0.0) },
    { mat: "iron" as const, overlap: true, solid: union(...[-0.18, 0, 0.18].map((x) => box(0.012, 0.012, 0.06, x, 1.78, 0.03))) },
    // a man's jacket and a shawl over it on the outer hooks, the kitchen apron on the middle one
    { mat: "cloth-brown" as const, overlap: true, solid: union(taper(0.2, 0.15, 0.78, 0, 0, 0).scale(1, 1, 0.28).move(-0.17, 0.98, 0.06), rbox(0.3, 0.08, 0.09, 0.03, -0.17, 1.7, 0.06)) },
    { mat: "linen-grey" as const, overlap: true, solid: box(0.3, 0.72, 0.012, 0, 1.06, 0.03) },
    { mat: "cloth-black" as const, overlap: true, solid: taper(0.13, 0.08, 0.55, 0, 0, 0).scale(1, 1, 0.3).move(0.18, 1.2, 0.055) },
  );
  return parts;
};
for (const [id, kind, coats, dh] of [["room-door-white", "white", false, 2.05], ["room-door-brown", "brown", false, 2.05], ["room-door-coats", "brown", true, 2.05], ["room-door-office", "office", false, 2.05], ["room-door-attic", "brown", false, 1.78]] as const)
  prop({ id, items: ["door-room"], size: [DW + 0.28, dh + 0.14, coats ? 0.2 : 0.08], place: "wall", tris: coats ? 1400 : 500, parts: roomDoor(kind, coats, dh) });

// ── the city's doors ────────────────────────────────────────────────────────────────────────────────────────────────
// Each doorway the bake cuts (tools/city/bake.ts doorsOf) as the house built it: a leaf shut in its frame on the side it
// swings into, and on the other side only its architrave (the director on v7, "is this a door or what's going on here": a
// bare hole in the wall beside the WC). Sizes as the bake's openings: 0.85 or 0.95 m wide, 2.2 m high in the worker and
// petty flats, 2.7 m in the good flats with their 1.2 and 1.3 m pairs (Flügeltüren), 2.4 and 2.6 off a shop and a hall.
// Same frame as the room doors above: origin at the opening's bottom middle on the room face, the room at +z, stood at
// z 0.05. Not in any recipe's draw: interiors/cityroom.ts hangs them by the room record's openings.
export type CityDoor = "white" | "brown" | "coats" | "office";
export const DOOR_W = [0.85, 0.95], DOOR_H = [2.2, 2.4, 2.6, 2.7], PAIR_W = [1.2, 1.3];
const cm = (v: number) => Math.round(v * 100);
export const cityDoorId = (kind: CityDoor | "casing-white" | "casing-brown", w: number, h: number) => `door-${kind}-${cm(w)}x${cm(h)}`;
function cityDoor(kind: CityDoor | "casing-white" | "casing-brown", W: number, H: number) {
  return () => {
    const casing = kind.startsWith("casing"), pair = W > 1.1, up = H / 2.05;
    const paint = kind === "white" || kind === "casing-white" ? "paint-white" : kind === "office" ? "wood-dark" : "paint-brown";
    const fill = paint === "paint-white" ? "plaster-ceiling" : "wood-mid", metal = paint === "paint-brown" ? "iron" : "brass";
    // the architrave, 10 cm, its head and a cornice over it (a good flat's deeper)
    const arch = union(box(0.1, H + 0.1, 0.03, -W / 2 - 0.05, 0, -0.035), box(0.1, H + 0.1, 0.03, W / 2 + 0.05, 0, -0.035), box(W + 0.2, 0.1, 0.03, 0, H, -0.035), box(W + 0.28, H > 2.5 ? 0.07 : 0.04, H > 2.5 ? 0.07 : 0.05, 0, H + 0.1, -0.03));
    if (casing) return [{ mat: paint as "paint-white", solid: arch }];
    // a leaf or two, each with its panels: two columns on a single leaf, one on each of a pair's
    const leaves = pair ? [-W / 4, W / 4].map((c) => ({ c, w: W / 2 - 0.008 })) : [{ c: 0, w: W - 0.01 }];
    let leaf = union(...leaves.map((l) => box(l.w, H - 0.01, 0.04, l.c, 0.005, -0.04)));
    const light = box(W - 0.26, 0.86, 0.2, 0, 1.08, -0.04);
    if (kind === "office") leaf = leaf.minus(light);
    const cols = leaves.flatMap((l) => (pair ? [{ x: l.c, w: l.w - 0.2 }] : [-1, 1].map((s) => ({ x: s * (l.w / 4 + 0.02), w: l.w / 2 - 0.14 }))));
    const panels = cols.flatMap((p) => [box(p.w, 0.62 * up, 0.012, p.x, 0.16 * up, -0.015), ...(kind === "office" ? [] : [box(p.w, 0.92 * up, 0.012, p.x, 1.02 * up, -0.015)])]);
    const lx = pair ? 0.07 : W / 2 - 0.09;
    const parts: { mat: MatId; solid: ReturnType<typeof box>; overlap?: boolean }[] = [
      { mat: paint as MatId, solid: union(leaf, arch) },
      { mat: fill as MatId, overlap: true, solid: union(...panels) },
      { mat: metal as MatId, overlap: true, solid: union(box(0.045, 0.17, 0.008, lx, 0.95, -0.016), box(0.12, 0.018, 0.022, lx - 0.05, 1.06, -0.002)) },
      { mat: "cloth-black", overlap: true, solid: box(0.012, 0.03, 0.004, lx, 0.98, -0.011) },
    ];
    if (kind === "office") parts.push({ mat: "glass-frost" as MatId, overlap: true, solid: box(W - 0.26, 0.86, 0.006, 0, 1.08, -0.04) });
    if (kind === "coats") parts.push(
      { mat: "wood-mid", overlap: true, solid: box(0.56, 0.07, 0.02, 0, 1.74, 0.0) },
      { mat: "iron", overlap: true, solid: union(...[-0.18, 0, 0.18].map((x) => box(0.012, 0.012, 0.06, x, 1.78, 0.03))) },
      { mat: "cloth-brown", overlap: true, solid: union(taper(0.2, 0.15, 0.78, 0, 0, 0).scale(1, 1, 0.28).move(-0.17, 0.98, 0.06), rbox(0.3, 0.08, 0.09, 0.03, -0.17, 1.7, 0.06)) },
      { mat: "linen-grey", overlap: true, solid: box(0.3, 0.72, 0.012, 0, 1.06, 0.03) },
      { mat: "cloth-black", overlap: true, solid: taper(0.13, 0.08, 0.55, 0, 0, 0).scale(1, 1, 0.3).move(0.18, 1.2, 0.055) },
    );
    return parts;
  };
}
for (const h of DOOR_H) for (const w of DOOR_W) for (const kind of ["white", "brown", "coats", "office", "casing-white", "casing-brown"] as const)
  prop({ id: cityDoorId(kind, w, h), items: [], size: [w + 0.28, h + 0.17, kind === "coats" ? 0.2 : 0.08], place: "wall", tris: kind === "coats" ? 1400 : 600, parts: cityDoor(kind, w, h) });
for (const w of PAIR_W) for (const kind of ["white", "casing-white"] as const)
  prop({ id: cityDoorId(kind, w, 2.7), items: [], size: [w + 0.28, 2.87, 0.08], place: "wall", tris: 700, parts: cityDoor(kind, w, 2.7) });

export const KIT_DOOR = true;
