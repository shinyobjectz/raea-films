// Things carried in the street, winter 1917-18 (catalogue carried).
//   milk-can          the 1-litre milk can women carried to the dairy queue: white enamel with blue edges (Landessammlungen
//                     Niederösterreich LK-MSHM-D4/2, "Milchkanne 1 Liter", late 19th to early 20th century, white and
//                     blue enamelled), a straight body, a sloped shoulder, a short neck, a lid with a knob, and a wire
//                     bail on riveted ears with a wooden grip
//   milk-can-blue     the 2-litre can in blue enamel
//   milk-can-tin      the 1.5-litre can in plain tinned sheet, the cheaper one
// ASSUMED: the proportions, worked from the volume (the 1-litre body 9.5 cm across and 11.5 cm to the shoulder); the
// bail standing up as it is carried.
//   basket-lidded     the market basket (Henkelkorb) of boiled willow, oval, its walls flared, a rolled border, a
//                     wrapped bow handle from the middles of the long sides over the top, two domed lid flaps either
//                     side of it; after the Museum Europäischer Kulturen's Berlin baskets (Henkelkorb mit Deckel, 19th
//                     century, 44 x 41 cm with its handle; Kleiner Henkelkorb, Berlin, about 1930: thicker rods at
//                     the edges, the handle of bent rods wrapped like a band)
//   basket-cloth      the same open, a blue checked cloth over what it carries, two corners hanging over the ends
//   basket-swedes     open: two swedes and potatoes, the winter's ration
// ASSUMED: the basket's size (0.40 x 0.28 m, 0.19 m to the rim, the handle 0.36 m up) and the contents.
// Frame: each thing's foot on the ground at the origin. GRIP gives the hand's point for each id (a can's wooden grip
// with the bail up, a basket's handle at its top), for whoever carries one.
import type { Solid } from "raea/3d";
import { side, tube } from "./forms";
import { ball, box, lathe, ring, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

/** Where a hand closes on each carried thing. */
export const GRIP: Record<string, V3> = {};

function milkCan(s: number, body: MatId, edge: MatId | null): Part[] {
  const R = 0.0475 * s, k = (y: number) => y * s;
  const can = lathe([[0, 0], [R - 0.003, 0], [R, k(0.004)], [R, k(0.112)], [R - k(0.006), k(0.12)], [k(0.036), k(0.131)], [k(0.034), k(0.133)], [k(0.034), k(0.145)], [k(0.037), k(0.147)], [k(0.037), k(0.15)], [0, k(0.15)]], 0, 0, 0, 24);
  const lid = lathe([[0, k(0.149)], [k(0.041), k(0.149)], [k(0.041), k(0.154)], [k(0.03), k(0.159)], [k(0.012), k(0.162)], [k(0.009), k(0.169)], [k(0.015), k(0.174)], [k(0.012), k(0.179)], [0, k(0.18)]], 0, 0, 0, 20);
  const parts: Part[] = [{ mat: body, solid: union(can, lid) }];
  if (edge) {
    // the blue edges: the foot, the neck's rim, the lid's rim and its knob
    const band = (r: number, y0: number, y1: number) => lathe([[0, y0], [r, y0], [r, y1], [0, y1]], 0, 0, 0, 24);
    parts.push({ mat: edge, solid: union(band(R + 0.0006, 0, k(0.006)), band(k(0.0376), k(0.1465), k(0.15)), band(k(0.0416), k(0.149), k(0.1545)), lathe([[0, k(0.168)], [k(0.0156), k(0.168)], [k(0.0156), k(0.175)], [k(0.012), k(0.1795)], [0, k(0.1805)]], 0, 0, 0, 12)), overlap: true });
  }
  // the ears riveted at the neck, the wire bail standing up, its wooden grip
  const ex = k(0.039), ey = k(0.138), top = k(0.235), iron: Solid[] = [];
  for (const x of [-1, 1]) iron.push(box(0.004, k(0.016), k(0.012), x * (k(0.034) + 0.002), ey - k(0.008), 0));
  const arch: V3[] = [];
  // a squared arch (a superellipse): straight up from the ears, flat along the top under the grip
  for (let i = 0; i <= 16; i++) { const t = (Math.PI * i) / 16, c = Math.cos(t), sn = Math.sin(t); arch.push([ex * Math.sign(c) * Math.abs(c) ** 0.35, ey + (top - ey) * sn ** 0.35, 0]); }
  iron.push(...tube(arch, 0.0022));
  parts.push({ mat: "iron", solid: union(...iron), overlap: true });
  parts.push({ mat: "wood-soft", solid: rod([-k(0.022), top, 0], [k(0.022), top, 0], 0.008), overlap: true });
  return parts;
}

const C = (id: string, s: number, body: MatId, edge: MatId | null) => {
  GRIP[id] = [0, 0.235 * s, 0];
  prop({ id, items: ["milk-can"], size: [0.1 * s, 0.24 * s, 0.1 * s], place: "floor", where: "set", tris: 2000, parts: () => milkCan(s, body, edge) });
};
C("milk-can", 1, "enamel", "enamel-blue");
C("milk-can-blue", 1.26, "enamel-blue", null);
C("milk-can-tin", 1.145, "tin", null);

const BA = 0.2, BK = 0.7, BH = 0.19, HT = 0.36; // the basket's half-length, its width over length, the rim, the handle's top

/** The oval body: a flared shell, the weave's rows standing out every other course, a rolled border, the handle. */
function basket(): Solid[] {
  const prof: [number, number][] = [[0, 0.004], [0.163, 0.004], [0.168, 0.012]];
  for (let y = 0.02, i = 0; y < BH - 0.01; y += 0.0105, i++) prof.push([0.168 + (0.032 * (y - 0.012)) / (BH - 0.012) + (i % 2 ? 0.0025 : 0), y]);
  prof.push([BA, BH - 0.004], [BA, BH], [BA - 0.009, BH], [0.161, 0.016], [0, 0.016]);
  const rim: V3[] = [], arch: V3[] = [], b = BA * BK;
  for (let i = 0; i <= 20; i++) { const t = (2 * Math.PI * i) / 20; rim.push([(BA + 0.002) * Math.cos(t), BH + 0.002, (BA + 0.002) * BK * Math.sin(t)]); }
  // the bow: up from inside each long side's middle, squared over the top
  for (let i = 0; i <= 10; i++) { const t = (Math.PI * i) / 10, c = Math.cos(t), s = Math.sin(t); arch.push([0, BH - 0.03 + (HT - 0.012 - BH + 0.03) * s ** 0.55, (b - 0.004) * Math.sign(c) * Math.abs(c) ** 0.55]); }
  return [lathe(prof, 0, 0, 0, 20).scale(1, 1, BK), ...tube(rim, 0.011), ...tube(arch, 0.012)];
}

/** The two domed lid flaps, either side of the handle. */
function lids(): Solid[] {
  const dome = lathe([[0, BH + 0.008], [BA + 0.006, BH + 0.008], [BA + 0.006, BH + 0.016], [BA * 0.75, BH + 0.027], [0, BH + 0.033]], 0, 0, 0, 20).scale(1, 1, BK);
  return [dome.intersect(box(0.25, 0.1, 0.4, -0.139, BH, 0)), dome.intersect(box(0.25, 0.1, 0.4, 0.139, BH, 0))];
}

/** The checked cloth humped over the load, a corner hanging over each end. */
function cloth(): Solid[] {
  const top = lathe([[0, BH + 0.004], [BA - 0.006, BH + 0.004], [BA - 0.006, BH + 0.01], [0.11, BH + 0.04], [0, BH + 0.05]], 0, 0, 0, 24).scale(1, 1, BK);
  const corner = (x: number, z: number, lean: number) => side([[-0.075, 0], [0.075, 0], [0.01, -0.1]], 0.004).rotate(0, 0, lean).move(x, BH + 0.012, z);
  return [top, corner(BA + 0.012, 0.02, 8), corner(-BA - 0.012, -0.03, -8)];
}

function swedes(): Part[] {
  const sw = (x: number, z: number, r: number, a: number) => ball(r).scale(1, 0.85, 1).rotate(a, 0, a / 2).move(x, BH - 0.035 + r * 0.4, z);
  const po = (x: number, z: number, a: number) => ball(0.032).scale(1.25, 0.8, 0.9).rotate(0, a, 0).move(x, BH - 0.03, z);
  return [
    { mat: "turnip", solid: union(sw(-0.07, 0.01, 0.068, 12), sw(0.075, -0.02, 0.06, -20)), overlap: true },
    { mat: "potato", solid: union(po(0.0, 0.07, 10), po(0.02, -0.075, 70), po(-0.14, -0.04, 30), po(0.15, 0.05, 120), po(-0.13, 0.06, 80), po(0.14, -0.06, 160)), overlap: true },
  ];
}

const P = (id: string, items: string[], tris: number, f: () => Part[]) => {
  GRIP[id] = [0, HT - 0.012, 0];
  prop({ id, items, size: [2 * BA + 0.03, HT + 0.01, 2 * BA * BK + 0.03], place: "floor", where: "set", tris, parts: f });
};
P("basket-lidded", ["basket"], 4300, () => [{ mat: "wicker", solid: union(...basket(), ...lids()) }]);
P("basket-cloth", ["basket"], 4800, () => [{ mat: "wicker", solid: union(...basket()) }, { mat: "check-blue", solid: union(...cloth()), overlap: true }]);
P("basket-swedes", ["basket"], 5300, () => [{ mat: "wicker", solid: union(...basket()) }, ...swedes()]);

// The umbrella and the walking stick (catalogue umbrella: "black umbrella; canes with silver knobs", the middle class's).
//   umbrella-furled      a man's umbrella rolled and strapped, as it is carried point down: eight steel ribs of 25-26
//                        inches (men's; women's 23), 89 cm closed (WA Museum CH1984.62, a Fox "Paragon" of about 1892:
//                        890 mm; New-York Historical Society INV.8420, 1880-1910: 91.4 cm closed), a black cover, a
//                        brass ferrule, the rib tips gathered in a tip cup, a crook handle of polished cane (by the 20th
//                        century the hook was "accepted as the most practical", most often Malacca: retrowow's guide)
//   umbrella-open        the same open: the cover stretched flat between the ribs (eight panels), a span of 1.15 m
//                        from 0.65 m ribs (as the Rijksmuseum's BK-1980-8-A spans 108 cm on 61 cm ribs), the stretchers
//                        to a runner on the stick, held up by the stick above the crook
//   walking-stick-knob   a dark stick with a silver knob and a ferrule, 91 cm
//   walking-stick-crook  a cane with a crook, 92 cm
// ASSUMED: the furled roll's swell, the strap, the sticks' lengths and knob. Frame: the furled umbrella and the sticks
// stand on their tips at the origin; the open umbrella's crook is at the origin, the canopy above it.
/** A crook: half a torus over the stick's top, its end hanging down beside it, rounded off. */
const crook = (y: number, R: number, r: number): Solid[] => [
  ring(R, r, 28, 10).intersect(box(2 * R + 2 * r + 0.01, R + r + 0.01, 3 * r, 0, 0, 0)).move(R, y, 0),
  rod([0, y - 0.03, 0], [0, y + 0.0005, 0], r),
  rod([2 * R, y + 0.0005, 0], [2 * R, y - 0.035, 0], r),
  ball(r).scale(1, 0.8, 1).move(2 * R, y - 0.035, 0),
];

/** The umbrella, in the standing frame (tip down at the origin, the crook at the top). */
function umbrella(open: boolean): Part[] {
  const top = 0.84, R0 = 0.765, PH = 0.85, yc = 0.075;
  const cane: Solid[] = [rod([0, 0.05, 0], [0, top - 0.02, 0], 0.0055), ...crook(top, 0.042, 0.0085)];
  const brass: Solid[] = [lathe([[0, 0], [0.0035, 0], [0.0058, 0.065], [0, 0.065]], 0, 0, 0, 10)];
  const cloth: Solid[] = [], steel: Solid[] = [];
  if (!open) {
    // rolled: the cover swelling from the crown, gathered at the rib tips in a cup, a strap round it with a button
    const roll: [number, number][] = [[0, 0.065], [0.009, 0.065], [0.015, 0.09], [0.024, 0.2], [0.027, 0.33], [0.024, 0.5], [0.017, 0.64], [0.011, 0.715], [0.008, 0.735], [0, 0.735]];
    cloth.push(lathe(roll, 0, 0, 0, 16), lathe([[0.0255, 0.43], [0.0285, 0.43], [0.0285, 0.455], [0.0255, 0.455]], 0, 0, 0, 16));
    brass.push(lathe([[0, 0.728], [0.0115, 0.728], [0.0115, 0.752], [0.006, 0.756], [0, 0.756]], 0, 0, 0, 12), ball(0.005).move(0.029, 0.442, 0));
  } else {
    // open: the dome in the standing frame hangs from the crown toward the crook (turned over below)
    const at = (f: number): [number, number] => [R0 * Math.sin(f * PH), yc + R0 * (1 - Math.cos(f * PH))];
    const inner: [number, number][] = [], outer: [number, number][] = [];
    for (let i = 0; i <= 12; i++) { const [r, y] = at(i / 12); inner.push([r, y + 0.0015]); outer.push([r, y - 0.0015]); }
    cloth.push(lathe([[0, yc - 0.0015], ...outer.slice(1), ...inner.slice(1).reverse(), [0, yc + 0.0015]], 0, 0, 0, 8)); // counter-clockwise, or the revolve drops it
    const yr = at(0.39 / PH)[1] + 0.17; // the runner, the stretchers meeting the ribs 0.3 m out
    steel.push(lathe([[0.006, yr - 0.03], [0.0085, yr - 0.03], [0.0085, yr + 0.005], [0.006, yr + 0.005]], 0, 0, 0, 10));
    for (let k = 0; k < 8; k++) {
      const a = (Math.PI * k) / 4, c = Math.cos(a), s = -Math.sin(a), pts: V3[] = [];
      for (let i = 0; i <= 2; i++) { const [r, y] = at(i / 2); pts.push([r * c * 0.995, y + 0.003, r * s * 0.995]); }
      for (let i = 0; i < 2; i++) steel.push(rod(pts[i], pts[i + 1], 0.0022));
      const [rm, ym] = at(0.39 / PH);
      steel.push(rod([0.008 * c, yr, 0.008 * s], [rm * c, ym + 0.004, rm * s], 0.0018));
      brass.push(ball(0.0045).move(pts[2][0], pts[2][1] + 0.003, pts[2][2]));
    }
  }
  const parts: Part[] = [{ mat: "malacca", solid: union(...cane) }, { mat: "brass", solid: union(...brass), overlap: true }, { mat: "cloth-black", solid: union(...cloth), overlap: true }];
  if (steel.length) parts.push({ mat: "steel-bright", solid: union(...steel), overlap: true });
  // the open one turned over: the crook at the origin, the canopy above
  return open ? parts.map((p) => ({ ...p, solid: p.solid.rotate(180, 0, 0).move(0, top + 0.042 + 0.0085, 0) })) : parts;
}

/** A walking stick: a tapered shaft on a ferrule, under a silver knob or a crook. */
function stick(knob: boolean): Part[] {
  const H = 0.86, wood = lathe([[0, 0.03], [0.0082, 0.03], [0.0105, H], [0, H]], 0, 0, 0, 12);
  const ferrule = lathe([[0, 0], [0.0075, 0], [0.0088, 0.035], [0, 0.035]], 0, 0, 0, 12);
  if (knob) return [
    { mat: "wood-dark", solid: wood },
    { mat: "brass", solid: ferrule, overlap: true },
    { mat: "silver", solid: lathe([[0, H - 0.01], [0.0118, H - 0.01], [0.0125, H + 0.004], [0.0105, H + 0.006], [0.0165, H + 0.016], [0.017, H + 0.023], [0.015, H + 0.031], [0.01, H + 0.037], [0, H + 0.039]], 0, 0, 0, 16), overlap: true },
  ];
  return [{ mat: "malacca", solid: union(wood, ...crook(H, 0.048, 0.0105)) }, { mat: "brass", solid: ferrule, overlap: true }];
}

const U = (id: string, items: string[], size: V3, grip: V3, tris: number, f: () => Part[]) => {
  GRIP[id] = grip;
  prop({ id, items, size, place: "floor", where: "set", tris, parts: f });
};
U("umbrella-furled", ["umbrella"], [0.12, 0.89, 0.06], [0.042, 0.882, 0], 1400, () => umbrella(false));
U("umbrella-open", ["umbrella"], [1.16, 0.89, 1.16], [0, 0.13, 0], 3000, () => umbrella(true));
U("walking-stick-knob", ["umbrella"], [0.04, 0.92, 0.04], [0, 0.89, 0], 400, () => stick(true));
U("walking-stick-crook", ["umbrella"], [0.12, 0.92, 0.03], [0.048, 0.908, 0], 900, () => stick(false));

export const KIT_CARRIED = true;
