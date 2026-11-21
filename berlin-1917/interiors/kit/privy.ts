// The court's shared privies, 1917-18 (catalogue privy-block: "brick or timber shed with doors to shared privies").
// Berlin's building police order of 1887 moved new houses' closets indoors, mostly onto the half landing, but the older
// and poorer houses kept theirs in the court: in 1922 the sick fund's survey of 9,400 tenants still found more than half
// using a landing closet or a privy in the court (Museum Neukölln, after the AOK survey). Two kinds stood there:
//   privy-block   the closet house of a sewered court, brick, a row of four cubicles under one lean-to roof against a
//                 wall: the kind Meyer's Hof, Ackerstraße 132, had in its first, third and fifth courts (five houses of
//                 eight closets at its building; in 1891 the police found four, joined to the sewer but flushed in common
//                 two or three times a day by the manager), solid enough that in the 1920s one became a butcher's shop
//                 and others stables. Each door a ledged and braced plank door in a brick reveal, a louvred vent over it,
//                 a granite sill, a tarred base, a vent pipe through the roof
//   privy-boards  the older board shed over a pit (the building plans' "Appartement", the Berliner Mieterverein's
//                 "einfache Bretterverschläge über Senkgruben"), two cubicles of upright boards with battens on a low
//                 brick base, the doors open at the top for air, a slot in each, a board roof under tarred felt
// ASSUMED: every form and size (no photograph of either in a Berlin court of the time has been found free to use; the
// doors' and roofs' make follows the board sheds and slatted doors in Zille's photographs of the Krögel and of
// Rummelsburg, public domain), the cubicles' count, the vent pipe. Neither carries a word or a number.
// Frame: on the ground at y 0, the back at -z against the court's wall, the doors toward +z, centred on x.
import type { Solid } from "raea/3d";
import { box, union } from "./geo";
import { bar } from "./porter";
import { type Part, prop } from "./prop";

/** A ledged and braced plank door w x h, its bottom-left at the origin, its face toward +z at z 0: the planks with a
 *  groove between each, two ledges and a brace behind (on the inside, so only their edges show), two strap hinges on
 *  the left, a latch on the right. */
function plankDoor(w: number, h: number, planks: number, wood: Solid[], iron: Solid[], open = 0) {
  const pw = w / planks;
  for (let i = 0; i < planks; i++) wood.push(box(pw - 0.006, h - open, 0.024, (i + 0.5) * pw, 0, -0.012));
  for (const y of [0.18, h - open - 0.3]) wood.push(box(w - 0.04, 0.1, 0.022, w / 2, y, -0.035));
  for (const y of [0.24, h - open - 0.24]) {
    iron.push(box(w * 0.55, 0.035, 0.005, w * 0.275, y - 0.017, 0.003));
    iron.push(bar([0, y - 0.015, 0.004], [0, y + 0.015, 0.004], 0.009));
  }
  iron.push(box(0.04, 0.12, 0.008, w - 0.07, h * 0.5 - 0.06, 0.004), bar([w - 0.07, h * 0.5 + 0.02, 0.012], [w - 0.07, h * 0.5 - 0.04, 0.03], 0.006));
}

/** The brick closet house: n cubicles in a row. */
function privyBlock(n: number): Part[] {
  const cw = 0.95, t = 0.25, W = n * cw + (n - 1) * 0.12 + 2 * t, D = 1.45, hf = 2.45, hb = 2.85, dw = 0.7, dh = 1.95, rv = 0.1;
  const brick: Solid[] = [], wood: Solid[] = [], iron: Solid[] = [], stone: Solid[] = [], tar: Solid[] = [], zinc: Solid[] = [];
  // the walls as one block, the roof's fall cut from its top, each door's reveal cut from its front
  const fall = Math.atan((hb - hf) / D) * (180 / Math.PI);
  let body: Solid = box(W, hb, D, 0, 0, 0).minus(box(W + 0.2, 1, D + 1, 0, 0, 0).rotate(fall, 0, 0).move(0, (hf + hb) / 2, 0));
  const xs = Array.from({ length: n }, (_, i) => -W / 2 + t + i * (cw + 0.12) + cw / 2);
  for (const x of xs) {
    body = body.minus(box(dw, dh, rv * 2, x, 0.12, D / 2));
    body = body.minus(box(0.46, 0.14, rv * 2, x, dh + 0.3, D / 2)); // the vent's opening, over the lintel
    stone.push(box(dw + 0.2, 0.12, 0.3, x, 0, D / 2 + 0.08)); // the sill, standing out of the wall
    const d: Solid[] = [], di: Solid[] = [];
    plankDoor(dw - 0.02, dh - 0.01, 5, d, di);
    wood.push(...d.map((s) => s.move(x - dw / 2 + 0.01, 0.12, D / 2 - rv + 0.026)));
    iron.push(...di.map((s) => s.move(x - dw / 2 + 0.01, 0.12, D / 2 - rv + 0.026)));
    for (let k = 0; k < 3; k++) wood.push(box(0.44, 0.012, 0.06, x, dh + 0.32 + k * 0.04, D / 2 - rv / 2).rotate(0, 0, 0)); // louvres
    for (const k of [-1, 1]) wood.push(box(0.012, 0.14, rv, x + k * 0.224, dh + 0.3, D / 2 - rv / 2));
    iron.push(box(dw + 0.14, 0.03, 0.008, x, dh + 0.12, D / 2 + 0.004)); // the flat iron lintel's face
  }
  brick.push(body.minus(box(W + 0.1, 0.32, D + 0.1, 0, -0.01, 0)));
  tar.push(box(W + 0.012, 0.32, D + 0.012, 0, 0, 0).minus(box(W - 0.2, 1, D - 0.2, 0, -0.1, 0)).minus(...xs.map((x) => box(dw, 0.4, 0.4, x, 0.12, D / 2))));
  // the roof: boards under tarred felt, an overhang to the front and the ends, a fascia, a vent pipe at the back
  const L = Math.hypot(D, hb - hf) + 0.34, ym = (hf + hb) / 2 + 0.01;
  wood.push(box(W + 0.2, 0.03, L, 0, 0, 0).rotate(fall, 0, 0).move(0, ym, 0.16));
  tar.push(box(W + 0.22, 0.006, L + 0.02, 0, 0, 0).rotate(fall, 0, 0).move(0, ym + 0.03, 0.16));
  wood.push(box(W + 0.2, 0.12, 0.025, 0, ym - (D / 2 + 0.32) * ((hb - hf) / D) - 0.12, D / 2 + 0.32)); // the fascia under the roof's front edge
  zinc.push(bar([W / 2 - 0.45, hb - 0.4, -D / 2 + 0.2], [W / 2 - 0.45, hb + 0.65, -D / 2 + 0.2], 0.05));
  zinc.push(bar([W / 2 - 0.45, hb + 0.65, -D / 2 + 0.2], [W / 2 - 0.45, hb + 0.72, -D / 2 + 0.2], 0.075));
  return [
    { mat: "brick-dark", solid: union(...brick) },
    { mat: "paint-brown-worn", solid: union(...wood), overlap: true },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "granite", solid: union(...stone), overlap: true },
    { mat: "felt", solid: union(...tar), overlap: true },
    { mat: "zinc", solid: union(...zinc), overlap: true },
  ];
}

/** The board shed over a pit: two cubicles. */
function privyBoards(): Part[] {
  const W = 1.9, D = 1.25, hf = 2.15, hb = 2.45, base = 0.18, dw = 0.68, dh = 1.62, b = 0.022;
  const wood: Solid[] = [], iron: Solid[] = [], brick: Solid[] = [], tar: Solid[] = [];
  brick.push(box(W + 0.06, base, D + 0.06, 0, 0, 0));
  const fall = Math.atan((hb - hf) / D) * (180 / Math.PI), top = (z: number) => hf + ((D / 2 - z) / D) * (hb - hf);
  // corner posts; the walls of upright boards (one sheet each) with a batten over every joint
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) wood.push(box(0.1, top(z) - base, 0.1, x, base, z));
  const back = box(W, hb - base, b, 0, base, -D / 2 + b / 2);
  wood.push(back);
  for (const x of [-W / 2 + b / 2, W / 2 - b / 2]) {
    wood.push(box(b, hb - base, D, x, base, 0).minus(box(b * 4, 1, D * 2, x, 0, 0).rotate(fall, 0, 0).move(0, (hf + hb) / 2, 0)));
    for (let z = -D / 2 + 0.16; z < D / 2 - 0.1; z += 0.15) wood.push(box(b + 0.03, top(z) - base - 0.02, 0.05, x, base, z));
  }
  for (let x = -W / 2 + 0.17; x < W / 2 - 0.1; x += 0.15) wood.push(box(0.05, hb - base - 0.02, b + 0.03, x, base, -D / 2 + b / 2));
  // the front: a centre post, the boards either side of and above each door, the doors (open 0.18 at the top for air)
  const xs = [-W / 4 - 0.01, W / 4 + 0.01];
  wood.push(box(0.1, hf - base, 0.1, 0, base, D / 2 - 0.05), box(W, 0.1, 0.1, 0, hf - 0.1, D / 2 - 0.05));
  for (const x of xs) {
    const side = (W / 2 - 0.1 - dw) / 2;
    for (const k of [-1, 1]) wood.push(box(side, hf - base - 0.1, b, x + k * (dw / 2 + side / 2), base, D / 2 - b / 2));
    wood.push(box(dw, 0.1, b, x, base + dh + 0.18, D / 2 - b / 2)); // the head board over the gap
    const d: Solid[] = [], di: Solid[] = [];
    plankDoor(dw - 0.01, dh, 5, d, di);
    const door = union(...d).minus(box(0.06, 0.2, 0.2, (dw - 0.01) / 2, dh - 0.45, 0)); // the slot
    wood.push(door.move(x - dw / 2 + 0.005, base + 0.01, D / 2 + 0.013));
    iron.push(...di.map((s) => s.move(x - dw / 2 + 0.005, base + 0.01, D / 2 + 0.013)));
  }
  // the roof
  const L = Math.hypot(D, hb - hf) + 0.3, ym = (hf + hb) / 2 + 0.01;
  wood.push(box(W + 0.24, 0.025, L, 0, 0, 0).rotate(fall, 0, 0).move(0, ym, 0.12));
  tar.push(box(W + 0.26, 0.005, L + 0.02, 0, 0, 0).rotate(fall, 0, 0).move(0, ym + 0.025, 0.12));
  return [
    { mat: "wood-weathered", solid: union(...wood) },
    { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "brick-dark", solid: union(...brick), overlap: true },
    { mat: "felt", solid: union(...tar), overlap: true },
  ];
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: ["privy-block"], size, place: "floor", tris, parts: f });
P("privy-block", [4.66, 3.6, 1.95], 2500, () => privyBlock(4));
P("privy-boards", [2.2, 2.6, 1.6], 1900, privyBoards);

export const KIT_PRIVY = true;
