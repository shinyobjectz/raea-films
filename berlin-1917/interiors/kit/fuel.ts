// A court's winter fuel, 1917-18 (catalogue firewood): the brown-coal briquettes the flats burned, stacked against a
// court wall or tipped from the coal man's sack, split firewood and bundles of kindling.
//   briquette-stack-court   a stack 1.0 m wide, 0.36 m deep, 1.0 m high against a wall, the courses laid crosswise:
//                           one course lengthwise into the stack (its face shows their ends), the next across it (its
//                           face shows their long sides), so it stands without a frame; about 1,000 briquettes
//   briquette-stack-low     the same drawn down through the winter to 0.5 m, its top stepped, a few lying loose
//   briquette-heap          a sack's worth tipped on the ground, about 35 briquettes
//   firewood-stack          split firewood 1.0 m wide and 0.9 m high, the pieces 0.3 m long for a stove, quartered and
//                           halved logs with their bark, the ends uneven
//   kindling-bundles        four bundles of thin split kindling (Bündelholz) tied with two wires each
// The briquette: "Die gewöhnlichen Braunkohlenbriketts sind 180 mm lang, 60 mm hoch und 35 mm dick; sie haben ein
// Gewicht von 1/2 kg" (Lueger, Lexikon der gesamten Technik, 1904, "Brikettieren"; public domain), its long edges
// rounded by the press's mould. The loose ones are rounded; in the stacks, plain blocks, too small to tell there.
// ASSUMED: the crosswise courses (the way cellar.ts stacks them), the stacks' sizes, the firewood's length and split,
// the bundles. No briquette carries a maker's stamp here (plain faces).
// Frame: each stack's back on z = -depth/2 against the wall, its face toward +z, centred on x, on the ground at y 0.
import type { Solid } from "raea/3d";
import { along } from "./forms";
import { box, ring, union, type V3 } from "./geo";
import { type Part, prop } from "./prop";

const BL = 0.18, BH = 0.035, BW = 0.06; // Lueger's briquette: length, thickness (lying flat), width

/** A seeded random stream. */
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

/** A loose briquette with its long edges rounded: the section in x-y, its length along z, centred on the origin. */
function briquette(): Solid {
  const w = BW / 2, h = BH / 2, c = 0.007;
  return along([[-w + c, -h], [w - c, -h], [w, -h + c], [w, h - c], [w - c, h], [-w + c, h], [-w, h - c], [-w, -h + c]], -BL / 2, BL / 2);
}

/** A crosswise stack w wide and 0.36 deep, `courses` high; `top(i)` gives each column's courses left (for a drawn-down
 *  stack). Only the bricks that show are built: the face, the two ends, the top; a dark core fills behind. */
function briquetteStack(w: number, courses: number, seed: number, top?: (x: number) => number): Solid[] {
  const r = rng(seed), D = 2 * BL, s: Solid[] = [];
  const brick = (bw: number, bd: number, x: number, y: number, z: number) => box(bw - 0.003, BH - 0.001, bd - 0.004, 0, y, 0).rotate(0, (r() - 0.5) * 3, 0).move(x + (r() - 0.5) * 0.004, 0, z + (r() - 0.5) * 0.012);
  const height = (x: number) => (top ? top(x) : courses);
  for (let c = 0; c < courses; c++) {
    const y = c * BH;
    if (c % 2 === 0) {
      // lengthwise: a row of ends along the face, two deep
      const n = Math.floor(w / BW), x0 = -((n - 1) * BW) / 2;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * BW;
        if (c >= height(x)) continue;
        const shows = i === 0 || i === n - 1 || c + 1 >= height(x) || c + 2 >= height(x);
        s.push(brick(BW, BL, x, y, D / 2 - BL / 2));
        if (shows) s.push(brick(BW, BL, x, y, -D / 2 + BL / 2));
      }
    } else {
      // across: long sides along the face, six deep
      const n = Math.floor(w / BL), x0 = -((n - 1) * BL) / 2;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * BL;
        if (c >= height(x)) continue;
        const shows = i === 0 || i === n - 1 || c + 1 >= height(x) || c + 2 >= height(x);
        for (let j = 0; j < 6; j++) if (j === 5 || shows) s.push(brick(BL, BW, x, y, -D / 2 + BW / 2 + j * BW));
      }
    }
  }
  return s;
}

function stackParts(w: number, courses: number, seed: number, top?: (x: number) => number, loose = 0): Part[] {
  const s = briquetteStack(w, courses, seed, top), D = 2 * BL, r = rng(seed + 7);
  const low = top ? Math.min(...Array.from({ length: 21 }, (_, i) => top(-w / 2 + (w * i) / 20))) : courses;
  const core = box(w - 0.13, low * BH - 0.04, D - 0.08, 0, 0, -0.03);
  const lumps: Solid[] = [];
  for (let i = 0; i < loose; i++) lumps.push(briquette().rotate((r() - 0.5) * 20, r() * 180, 0).move((r() - 0.5) * w, BH / 2, D / 2 + 0.06 + r() * 0.2));
  return [{ mat: "briquette", solid: union(...s, ...lumps) }, { mat: "coal", solid: core, overlap: true }];
}

function heap(): Part[] {
  const r = rng(91), s: Solid[] = [];
  const layer = (n: number, rad: number, y: number, tilt: number) => {
    for (let i = 0; i < n; i++) { const a = r() * 2 * Math.PI, d = rad * Math.sqrt(r()); s.push(briquette().rotate((r() - 0.5) * tilt, r() * 180, (r() - 0.5) * tilt).move(d * Math.cos(a), y + BH / 2, d * Math.sin(a))); }
  };
  layer(18, 0.3, 0, 4); layer(11, 0.19, BH * 0.8, 18); layer(6, 0.1, BH * 1.6, 22);
  return [{ mat: "briquette", solid: union(...s) }];
}

function firewood(): Part[] {
  const r = rng(53), wood: Solid[] = [], bark: Solid[] = [], W = 1.0, H = 0.9, L = 0.3;
  for (let y = 0.045; y < H - 0.03; y += 0.075) {
    for (let x = -W / 2 + 0.045; x < W / 2 - 0.03; x += 0.08) {
      const R = 0.075 + r() * 0.045, half = r() < 0.3, sweep = half ? Math.PI : Math.PI / 2, a0 = r() * 2 * Math.PI, n = half ? 5 : 3;
      const arc = (rr: number) => Array.from({ length: n + 1 }, (_, k) => [rr * Math.cos(a0 + (sweep * k) / n), rr * Math.sin(a0 + (sweep * k) / n)] as [number, number]);
      // the piece's own middle, so it sits in its cell
      const out = arc(R), cx = out.reduce((t, p) => t + p[0], 0) / (2 * (n + 1)), cy = out.reduce((t, p) => t + p[1], 0) / (2 * (n + 1));
      const k = half ? 0.62 : 0.8, len = L + (r() - 0.5) * 0.05, z0 = -0.17 + (r() - 0.5) * 0.03;
      const place = (sl: Solid) => sl.move(-cx, -cy, 0).scale(k, k, 1).move(x + (r() - 0.5) * 0.01, y, 0);
      wood.push(place(along([[0, 0], ...out], z0, z0 + len)));
      bark.push(place(along([...out, ...arc(R - 0.013).reverse()].map(([u, v]) => [u * 1.01, v * 1.01] as [number, number]), z0 + 0.0005, z0 + len - 0.0005)));
    }
  }
  return [{ mat: "wood-split", solid: union(...wood) }, { mat: "bark", solid: union(...bark), overlap: true }];
}

function kindling(): Part[] {
  const r = rng(17), sticks: Solid[] = [], wire: Solid[] = [];
  const bundle = (at: V3, yaw: number) => {
    const cells: [number, number][] = [[0, 0]];
    for (let k = 0; k < 6; k++) cells.push([0.019 * Math.cos((k * Math.PI) / 3), 0.019 * Math.sin((k * Math.PI) / 3)]);
    for (let k = 0; k < 12; k++) cells.push([0.038 * Math.cos((k * Math.PI) / 6 + 0.26), 0.038 * Math.sin((k * Math.PI) / 6 + 0.26)]);
    for (const [u, v] of cells) sticks.push(box(0.24 + (r() - 0.5) * 0.03, 0.015, 0.015, 0, -0.0075, 0).rotate(r() * 20, 0, 0).move((r() - 0.5) * 0.02, v + 0.05, u).rotate(0, yaw, 0).move(...at));
    for (const x of [-0.07, 0.07]) wire.push(ring(0.05, 0.0015, 12, 3).rotate(0, 90, 0).move(x, 0.05, 0).rotate(0, yaw, 0).move(...at));
  };
  bundle([0, 0, -0.06], 0); bundle([0.01, 0, 0.06], 4); bundle([0, 0.088, 0], -6); bundle([-0.02, 0, 0.18], 85);
  return [{ mat: "wood-split", solid: union(...sticks) }, { mat: "iron", solid: union(...wire), overlap: true }];
}

const P = (id: string, size: V3, tris: number, f: () => Part[]) => prop({ id, items: ["firewood"], size, place: "floor", where: "set", tris, parts: f });
P("briquette-stack-court", [1.1, 1.0, 0.38], 8000, () => stackParts(1.08, 28, 5));
P("briquette-stack-low", [1.1, 0.56, 0.6], 5000, () => stackParts(1.08, 16, 9, (x) => (x < -0.15 ? 15 : x < 0.2 ? 12 : 9), 5));
P("briquette-heap", [0.75, 0.13, 0.75], 2400, heap);
P("firewood-stack", [1.0, 0.9, 0.36], 11500, firewood);
P("kindling-bundles", [0.35, 0.2, 0.4], 3400, kindling);

export const KIT_FUEL = true;
