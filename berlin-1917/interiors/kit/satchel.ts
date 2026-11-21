// Carried to school and to the post, 1917-18 (catalogue satchel: "leather or fur-backed satchel, a slate with a sponge on
// a string"; parcel-front: "small parcels tied with string, addressed to soldiers").
//   satchel-leather   the school satchel (Schulranzen) worn on the back: 32 cm wide, 25 high, 8 deep, of leather with
//                     brass (a satchel of 1900 in the Hagen museum; the DHM's of about 1910: 33 by 23), a boy's long flap
//                     closed by two straps and buckles, a carrying handle, two shoulder straps; the slate's sponge and
//                     rag hanging out at the side on their strings, as they were carried
//   satchel-fur       the same with the flap of calfskin, the hair on, bound with leather
//   slate             the school slate, 15 by 22 cm and 0.7 cm thick in a wooden frame, ruled on one side, the sponge on
//                     a jute string through a hole drilled in the frame (a slate of the Roscheider Hof museum; record CC0)
//   parcel-front      the field-post parcel (Feldpostpäckchen) of up to 550 g that families sent to the front: a box of
//                     15.5 by 10.5 by 3 cm wrapped in brown paper and tied crosswise with string, a paper label with the
//                     address in ink (strokes only: no word, no name)
//   parcel-front-small the smaller box, 12.3 by 7.5 by 2.5 cm
//   parcel-front-bundle two and a small one tied together with a finger loop, as they were taken to the counter
// ASSUMED: the flap's and straps' make, the strings' run, the label's size, the bundle.
// Frame: each on its foot at the origin; the satchel's back (the wearer's side) toward -z, its flap toward +z. GRIP (in
// carried.ts) gives the hand's point: the satchel's handle, the slate's top edge, a parcel's top, the bundle's loop.
import type { Solid } from "raea/3d";
import { side } from "./forms";
import { GRIP } from "./carried";
import { box, lump, plate, ring, union, type V3 } from "./geo";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";

/** A w x h outline in x-y, x centred, its foot at y 0, the two lower corners rounded r. */
function roundFoot(w: number, h: number, r: number): [number, number][] {
  const p: [number, number][] = [[-w / 2, h]];
  for (let i = 0; i <= 4; i++) { const a = Math.PI + (Math.PI / 2) * (i / 4); p.push([-w / 2 + r + r * Math.cos(a), r + r * Math.sin(a)]); }
  for (let i = 0; i <= 4; i++) { const a = 1.5 * Math.PI + (Math.PI / 2) * (i / 4); p.push([w / 2 - r + r * Math.cos(a), r + r * Math.sin(a)]); }
  p.push([w / 2, h]);
  return p;
}

/** A buckle's frame and its tongue, in x-y, centred on x at its foot y, its back at z. */
const buckle = (x: number, y: number, z: number): Solid[] => [
  box(0.03, 0.024, 0.004, x, y, z + 0.002).minus(box(0.022, 0.016, 0.02, x, y + 0.004, z)),
  rod([x, y + 0.004, z + 0.005], [x, y + 0.02, z + 0.006], 0.0012),
];

const W = 0.32, H = 0.25, D = 0.08, FT = 0.006, Y0 = 0.05, ZF = D / 2 + FT / 2 + 0.001;

function satchel(fur: boolean): Part[] {
  const leather: Solid[] = [box(W, H, D, 0, 0, 0)], brass: Solid[] = [], flap: Solid[] = [], strings: Solid[] = [];
  // the welts along the side seams and the foot
  for (const z of [-D / 2, D / 2]) {
    for (const x of [-W / 2, W / 2]) leather.push(rod([x, 0.004, z], [x, H - 0.002, z], 0.0035));
    leather.push(rod([-W / 2, 0.004, z], [W / 2, 0.004, z], 0.0035));
  }
  // the flap over the top and down the front to 5 cm off the foot
  flap.push(box(W + 0.006, FT, D + 0.01, 0, H, 0.002), plate(roundFoot(W + 0.006, H + FT - Y0, 0.035), FT, 0, Y0, ZF));
  if (fur) leather.push(plate(roundFoot(W + 0.012, H + FT - Y0 + 0.003, 0.038), FT + 0.003, 0, Y0 - 0.003, ZF).minus(plate(roundFoot(W - 0.016, H, 0.024), 0.03, 0, Y0 + 0.011, ZF)));
  // two straps from the flap down to buckles on the front, below its edge
  for (const x of [-0.09, 0.09]) {
    leather.push(box(0.022, 0.09, 0.003, x, Y0 - 0.005, ZF + FT / 2 + 0.0016), box(0.022, Y0 - 0.032, 0.003, x, 0.034, D / 2 + 0.0016));
    leather.push(box(0.018, 0.034, 0.003, x, 0.006, D / 2 + 0.0016)); // the buckle's tab, sewn to the front
    brass.push(...buckle(x, 0.03, D / 2 + 0.002));
    brass.push(rod([x, Y0 + 0.07, ZF + FT / 2 + 0.003], [x, Y0 + 0.07, ZF + FT / 2 + 0.0045], 0.003)); // the strap's rivet
  }
  // the carrying handle, and the shoulder straps lying on the back with their buckles
  leather.push(ring(0.04, 0.006, 16, 6).intersect(box(0.1, 0.05, 0.02, 0, 0, 0)).scale(1, 0.7, 1).move(0, H + FT, 0));
  for (const x of [-0.085, 0.085]) {
    leather.push(box(0.03, H - 0.03, 0.004, x, 0.02, -D / 2 - 0.003), box(0.03, 0.03, 0.004, x, H - 0.03, -D / 2 - 0.005));
    brass.push(...buckle(x, 0.07, -D / 2 - 0.009).map((b) => b.rotate(0, 180, 0).move(2 * x, 0, 0)));
  }
  // the slate's sponge and rag out at the side on their strings
  const s0: V3 = [W / 2 + 0.003, H - 0.012, D / 2 - 0.012];
  strings.push(rod(s0, [W / 2 + 0.014, 0.115, D / 2 - 0.018], 0.0014), rod(s0, [W / 2 + 0.006, 0.135, -0.012], 0.0014));
  const sponge = lump(0.026, 7, 0.75, 1, 0.9).move(W / 2 + 0.024, 0.09, D / 2 - 0.02);
  const rag = side([[-0.035, 0], [0.034, 0.004], [0.03, -0.07], [0.005, -0.082], [-0.032, -0.066]], 0.003).move(W / 2 + 0.008, 0.136, -0.012);
  return [
    { mat: "leather", solid: union(...leather) },
    { mat: fur ? "hide-calf" : "leather-worn", solid: union(...flap), overlap: true },
    { mat: "brass", solid: union(...brass), overlap: true },
    { mat: "jute", solid: union(...strings), overlap: true },
    { mat: "sponge", solid: sponge, overlap: true },
    { mat: "linen", solid: rag, overlap: true },
  ];
}

/** The slate: 15 x 22 cm standing on its foot, the frame 1.6 cm wide, ruled, its sponge on a string from the corner. */
function slate(): Part[] {
  const w = 0.15, h = 0.22, t = 0.007, f = 0.016;
  const frame = [box(w, f, t + 0.004, 0, 0, 0), box(w, f, t + 0.004, 0, h - f, 0), box(f, h, t + 0.004, -w / 2 + f / 2, 0, 0), box(f, h, t + 0.004, w / 2 - f / 2, 0, 0)];
  const lines: Solid[] = [];
  for (let y = f + 0.02; y < h - f - 0.005; y += 0.022) lines.push(box(w - 2 * f - 0.008, 0.0012, 0.0006, 0, y, t / 2));
  const s0: V3 = [-w / 2 + 0.008, h - 0.008, 0];
  return [
    { mat: "wood-soft", solid: union(...frame) },
    { mat: "slate", solid: box(w - 2 * f + 0.004, h - 2 * f + 0.004, t, 0, f - 0.002, 0), overlap: true },
    { mat: "linen-grey", solid: union(...lines), overlap: true },
    { mat: "jute", solid: union(rod(s0, [-w / 2 - 0.02, h - 0.03, 0.004], 0.0014), rod([-w / 2 - 0.02, h - 0.03, 0.004], [-w / 2 - 0.024, 0.12, 0.008], 0.0014)), overlap: true },
    { mat: "sponge", solid: lump(0.024, 3, 0.8, 1, 0.75).move(-w / 2 - 0.026, 0.096, 0.01), overlap: true },
  ];
}

/** A wrapped parcel w x h x d (h its thickness), lying on its foot, tied crosswise, labelled. */
function parcel(w: number, h: number, d: number, seed: number) {
  const paper: Solid[] = [box(w, h, d, 0, 0, 0)];
  for (const k of [-1, 1]) paper.push(side([[-d / 2 + 0.002, h], [d / 2 - 0.002, h], [0, h * 0.25]], 0.0012).move(k * (w / 2 + 0.0006), 0, 0)); // the folded ends
  const string = [box(w + 0.003, h + 0.003, 0.003, 0, -0.0015, 0), box(0.003, h + 0.003, d + 0.003, 0, -0.0015, 0), lump(0.0045, seed, 1.3, 0.7, 1).move(0, h + 0.002, 0), rod([0, h + 0.003, 0], [0.018, h + 0.002, 0.012], 0.0012), rod([0, h + 0.003, 0], [-0.012, h + 0.002, 0.02], 0.0012)];
  const lw = Math.min(0.06, w / 2 - 0.016), ld = Math.min(0.04, d / 2 - 0.012), lx = 0.009 + lw / 2, lz = -0.008 - ld / 2;
  const label = box(lw, 0.0006, ld, lx, h, lz), ink: Solid[] = [];
  for (let i = 0; i < 3; i++) ink.push(box(lw * (0.5 + 0.35 * ((seed * 7 + i * 3) % 5) / 5), 0.001, 0.0012, lx - lw * 0.05, h + 0.0005, lz - ld * 0.25 + i * ld * 0.25));
  return { paper, string, label: [label], ink };
}

function parcels(list: [number, number, number, number, number, number][], loop: number): Part[] {
  const out = { paper: [] as Solid[], string: [] as Solid[], label: [] as Solid[], ink: [] as Solid[] };
  for (const [w, h, d, y, yaw, seed] of list) {
    const p = parcel(w, h, d, seed);
    for (const k of ["paper", "string", "label", "ink"] as const) out[k].push(...p[k].map((s) => s.rotate(0, yaw, 0).move(0, y, 0)));
  }
  if (loop > 0) {
    // one string round the stack (stepping in round the narrower top one) and a finger loop over its top
    const [, , d] = list[0], top = list[list.length - 1], under = top[3];
    out.string.push(box(0.003, under + 0.002, d + 0.004, 0.03, -0.002, 0), box(0.003, loop - under + 0.002, top[2] + 0.004, 0.03, under, 0));
    out.string.push(ring(0.022, 0.0015, 14, 4).intersect(box(0.05, 0.03, 0.01, 0, 0, 0)).rotate(0, 90, 0).move(0.03, loop + 0.001, 0));
  }
  return [
    { mat: "paper-kraft", solid: union(...out.paper) },
    { mat: "linen-grey", solid: union(...out.string), overlap: true },
    { mat: "paper", solid: union(...out.label), overlap: true },
    { mat: "cloth-black", solid: union(...out.ink), overlap: true },
  ];
}

const P = (id: string, items: string[], size: V3, grip: V3, tris: number, f: () => Part[]) => {
  GRIP[id] = grip;
  prop({ id, items, size, place: "floor", where: "set", tris, parts: f });
};
P("satchel-leather", ["satchel"], [0.39, 0.29, 0.11], [0, H + 0.036, 0], 1100, () => satchel(false));
P("satchel-fur", ["satchel"], [0.39, 0.29, 0.11], [0, H + 0.036, 0], 1300, () => satchel(true));
P("slate", ["satchel"], [0.2, 0.22, 0.03], [0, 0.22, 0], 400, slate);
P("parcel-front", ["parcel-front"], [0.16, 0.04, 0.11], [0, 0.03, 0], 400, () => parcels([[0.155, 0.03, 0.105, 0, 0, 1]], 0));
P("parcel-front-small", ["parcel-front"], [0.13, 0.03, 0.08], [0, 0.025, 0], 400, () => parcels([[0.123, 0.025, 0.075, 0, 0, 2]], 0));
P("parcel-front-bundle", ["parcel-front"], [0.17, 0.11, 0.12], [0.03, 0.108, 0], 1400, () => parcels([[0.155, 0.03, 0.105, 0, 0, 3], [0.155, 0.03, 0.105, 0.0305, 5, 4], [0.123, 0.025, 0.075, 0.061, -7, 5]], 0.086));

export const KIT_SATCHEL = true;
