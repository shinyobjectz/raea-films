// The bank (research/catalogue: shop-bank, 31 storefronts on the three streets read: the Bankgeschäfte of Leipziger and
// Friedrichstraße, a private banker's office or a great bank's branch): a counter hall, the public in front of a long
// counter under brass grilles, the clerks behind it at their high desks, the strongroom door at the back. In the war
// the banks took the subscriptions for the war loans (the seventh in the autumn of 1917): placards at the counter.
// The desks, shelves, safe and lamps are the office kit's (kit/office.ts); interiors/bank.ts lays the hall out.
import { box, post, ring, rodX, union, zcyl } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const BANK = ["shop-bank"];

/** The counter: a panelled front 1.1 m high under a marble top, and above it a brass grille to 2.2 m with two cashiers'
 *  windows (Schalter), each with its slot and a little shelf. 3 m of it; the hall sets two or three in a row. */
prop({
  id: "bank-counter", items: [...BANK, "counter-grille"], size: [3.0, 2.2, 0.75], place: "floor", tris: 2400,
  parts: () => {
    const wins = [-0.75, 0.75];
    const bars: ReturnType<typeof box>[] = [];
    for (let x = -1.45; x <= 1.45; x += 0.1) {
      if (wins.some((w) => Math.abs(x - w) < 0.32)) { bars.push(post(0.006, 0.42, x, 1.78, -0.25)); continue; } // over a window, the grille starts above it
      bars.push(post(0.006, 1.06, x, 1.14, -0.25));
    }
    return [
      { mat: "wood-dark", solid: union(box(3.0, 1.06, 0.7, 0, 0, 0), ...[-1.2, -0.4, 0.4, 1.2].map((x) => box(0.7, 0.8, 0.02, x, 0.13, 0.355))) },
      { mat: "marble", solid: box(3.06, 0.05, 0.76, 0, 1.06, 0), overlap: true },
      {
        mat: "brass",
        solid: union(
          ...bars, rodX(0.012, 3.0, 0, 1.14, -0.25), rodX(0.012, 3.0, 0, 2.2, -0.25), rodX(0.01, 3.0, 0, 1.78, -0.25),
          ...wins.flatMap((w) => [box(0.6, 0.02, 0.02, w, 1.76, -0.25), box(0.02, 0.62, 0.02, w - 0.3, 1.14, -0.25), box(0.02, 0.62, 0.02, w + 0.3, 1.14, -0.25), box(0.2, 0.06, 0.008, w, 1.84, -0.24)]),
        ),
        overlap: true,
      },
      { mat: "glass", solid: union(...wins.map((w) => box(0.56, 0.5, 0.006, w, 1.24, -0.25))), overlap: true },
    ];
  },
});

/** The strongroom door (Tresortür): a round steel door in its square frame, the locking wheel, the hinges, ajar. */
prop({
  id: "vault-door", items: [...BANK, "strongroom"], size: [1.6, 2.3, 0.45], place: "wall", tris: 1800,
  parts: () => {
    const R = 0.82;
    const wheel = union(ring(0.22, 0.016, 24, 6).move(0, 1.15, 0.25), ...[0, 1, 2].map((k) => bar([Math.cos(k * 2.09) * -0.22, 1.15 + Math.sin(k * 2.09) * -0.22, 0.25], [Math.cos(k * 2.09) * 0.22, 1.15 + Math.sin(k * 2.09) * 0.22, 0.25], 0.012)));
    return [
      { mat: "iron", solid: union(box(1.6, 2.3, 0.12, 0, 0, -0.1), zcyl(R, 0.22).move(0, 1.15, 0.06)) },
      { mat: "steel-bright", solid: union(zcyl(R - 0.06, 0.03).move(0, 1.15, 0.18), zcyl(0.08, 0.06).move(0, 1.15, 0.22), wheel), overlap: true },
      { mat: "brass", solid: union(zcyl(0.06, 0.02).move(0.35, 1.5, 0.2), ...[0.75, 1.55].map((y) => box(0.14, 0.24, 0.12, -R + 0.02, y, 0.1))), overlap: true },
    ];
  },
});

export const KIT_BANK = true;
