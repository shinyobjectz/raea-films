// Stair kit: the tenements' stairwells (research/catalogue/interior.ts stair-front, stair-rear, stair-light, flat-door,
// landing-tap, halflanding-wc, dado-paint). Every Berlin house is climbed by a dog-leg stair: a flight from the floor
// landing up to a half-landing under the court window, a flight back up to the next floor.
//   Front buildings: a wide oak stair with turned balusters and a moulded rail, a runner (its brass rods gone to the
//   1917 metal collection, iron ones in their place) or bare treads worn pale where it lay, an oxblood dado climbing
//   with the flights, coloured leaded lights on the half-landings, grained double-panel flat doors.
//   Rear buildings and side wings: steep softwood steps worn pale, a plain rail on brackets, limewash flaking to the
//   brick (the survey's plates: Alexandrinenstraße 17, 1919/20, and Weberstraße 18, 1917), the shared WC on the
//   half-landing, a tap and sink on the landing.
// interiors/stair.ts lays a stairwell out from these. A flight stands on its foot (y = 0) and rises toward -z, its wall
// side at -x and its well side at +x.
import type { Solid } from "raea/3d";
import { box, hash, lathe, plate, rodX, union, zcyl } from "./geo";
import type { MatId } from "./mats";
import { type Part, prop } from "./prop";
import { byMat } from "./store";

export type StairStyle = "front" | "rear";
/** A style's flights: width, tread depth, the well between the flights, the floor and half landings' depths, its
 *  storey heights (research/catalogue/rooms.ts stair-front 5-7 x 2.5-3.5 x 3.2-4.2 m, stair-rear 4-6 x 1.8-2.6 x
 *  2.6-3.2 m; the survey measured a side wing's at 5.40 x 2.30 x 2.90). */
export const STAIR: Record<StairStyle, { w: number; t: number; well: number; dl: number; dh: number; H: number[] }> = {
  front: { w: 1.25, t: 0.28, well: 0.2, dl: 1.5, dh: 1.3, H: [3.6, 3.8, 4.0] },
  rear: { w: 0.95, t: 0.24, well: 0.1, dl: 1.2, dh: 1.0, H: [2.9, 3.1] },
};
/** A flight is half a storey: its risers (about 18 cm) and their rise. */
export const risers = (H: number) => { const n = Math.round(H / 2 / 0.18); return { n, r: H / 2 / n }; };
export const flightRun = (s: StairStyle, H: number) => (risers(H).n - 1) * STAIR[s].t;
export const breadth = (s: StairStyle) => 2 * STAIR[s].w + STAIR[s].well;
export const flightId = (s: StairStyle, H: number, runner = false) => `flight-${s}-${Math.round(H * 100)}${runner ? "-runner" : ""}`;
export const SLAB = 0.22;

const ITEMS: Record<StairStyle, string[]> = { front: ["stair-front", "dado-paint"], rear: ["stair-rear", "dado-paint"] };

const ccw = (pts: [number, number][]): [number, number][] => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return a > 0 ? pts : [...pts].reverse();
};
/** An outline in a flight's side view, (z, y) points, made a board `th` thick along x, centred on x0. */
const side = (zy: [number, number][], th: number, x0: number): Solid =>
  plate(ccw(zy.map(([z, y]) => [-z, y] as [number, number])), th).rotate(0, 90, 0).move(x0, 0, 0);
/** A turned baluster h tall. */
const turned = (h: number): [number, number][] =>
  [[0, 0], [0.02, 0], [0.02, 0.07], [0.012, 0.1], [0.019, 0.2], [0.011, 0.34], [0.017, 0.5], [0.011, 0.6], [0.018, h - 0.08], [0.018, h], [0, h]];

// ── the flights ────────────────────────────────────────────────────────────────────────────────────────────────────

function flight(s: StairStyle, H: number, runner: boolean): Part[] {
  const { w, t } = STAIR[s], { n, r } = risers(H), L = (n - 1) * t, top = H / 2, front = s === "front";
  const nose = (z: number) => r + (L / 2 - z) * (r / t); // the line of the nosings
  const zAt = (y: number) => L / 2 - (y - r) * (t / r); // where that line is at height y
  const tw = w - 0.09, tx = -0.005; // the treads, housed between the wall string (4 cm) and the well string (5 cm)
  const b = byMat();
  const steps: Solid[] = [], worn: Solid[] = [], cloth: Solid[] = [], rods: Solid[] = [];
  for (let i = 1; i < n; i++) {
    const f = L / 2 - (i - 1) * t; // the face of riser i
    steps.push(box(tw, 0.04, t + 0.052, tx, i * r - 0.04, f - t / 2 + 0.004)); // the tread, its nosing 3 cm proud
    steps.push(box(tw, r - 0.04, 0.022, tx, (i - 1) * r, f - 0.011)); // the riser under it
    if (runner) {
      cloth.push(box(0.76, 0.008, t + 0.03, tx, i * r, f - t / 2 + 0.015), box(0.76, r + 0.008, 0.008, tx, (i - 1) * r, f + 0.034));
      rods.push(rodX(0.005, 0.84, tx, (i - 1) * r + 0.016, f + 0.05));
    } else worn.push(box(front ? 0.78 : 0.5, 0.002, t - 0.06, tx + (hash(i, n, 7) - 0.5) * 0.04, i * r, f - t / 2 + 0.01));
  }
  b.add(front ? "wood-mid" : "floor-boards", union(...steps));
  // the strings: the well's carries the balusters, the wall's is housed against the plaster
  const string = (lo: number, hi: number): [number, number][] => {
    const z0 = L / 2 + 0.03, z1 = -L / 2, pts: [number, number][] = [[z0, Math.max(0, nose(z0) - lo)], [z0, nose(z0) + hi], [z1, nose(z1) + hi], [z1, nose(z1) - lo]];
    if (nose(z0) - lo < 0) pts.push([zAt(lo), 0]);
    return pts;
  };
  const strings = union(side(string(0.3, 0.07), 0.05, w / 2 - 0.025), side(string(0.3, 0.07), 0.04, -w / 2 + 0.02));
  b.add(front ? "wood-dark" : "paint-brown", strings);
  // the soffit under the steps: lath and plaster in front, boards behind
  b.add(front ? "plaster-ceiling" : "lime-dirty", side([[zAt(0.3), 0], [-L / 2, top - 0.3], [-L / 2, top - 0.33], [zAt(0.33), 0]], tw, tx));
  // balusters on the well string, the rail over them, a newel at each end
  const xr = w / 2 - 0.025, ang = (Math.atan2(r, t) * 180) / Math.PI, slope = Math.hypot(1, r / t);
  const rail = (rw: number, rh: number, x: number, lift: number) => box(rw, rh, (L + 0.1) * slope, x, -rh / 2, 0).rotate(ang, 0, 0).move(0, nose(0) + lift, 0);
  const bal: Solid[] = [];
  for (let i = 1; i < n; i++) {
    const f = L / 2 - (i - 1) * t;
    for (const z of front ? [f - t / 4, f - (3 * t) / 4] : [f - t / 2]) {
      const y0 = nose(z) + 0.07, hb = 0.8;
      bal.push(front ? lathe(turned(hb), xr, y0, z, 8) : box(0.03, hb, 0.03, xr, y0, z));
    }
  }
  const nw = front ? 0.12 : 0.08;
  const newels = [box(nw, 1.1, nw, xr, 0, L / 2 - 0.03), box(nw, 1.3, nw, xr, top - 0.3, -L / 2 + 0.06)];
  if (front) newels.push(lathe([[0, 0], [0.07, 0], [0.07, 0.03], [0.04, 0.06], [0.05, 0.1], [0, 0.13]], xr, 1.1, L / 2 - 0.03, 10));
  b.add(front ? "wood-dark" : "paint-brown", union(...bal, ...newels, rail(front ? 0.07 : 0.05, front ? 0.055 : 0.045, xr, 0.9 - 0.0275)));
  // the rear stair's round wall rail on three brackets (Alexandrinenstraße 17)
  if (!front) {
    const wr = zcyl(0.022, (L + 0.3) * slope).rotate(ang, 0, 0).move(-w / 2 + 0.07, nose(0) + 0.85, 0);
    b.add("paint-brown", union(wr, ...[-L / 3, 0, L / 3].map((z) => box(0.05, 0.02, 0.02, -w / 2 + 0.035, nose(z) + 0.8, z))));
  }
  if (runner) { b.add("runner", union(...cloth)); b.add("iron", union(...rods)); }
  else b.add("tread-worn", union(...worn));
  // the dado on the wall, climbing with the flight, and the band along its top
  const dz0 = L / 2 + 0.2;
  b.add(front ? "dado-brown" : "oil-dado", side([[dz0, 0], [dz0, nose(dz0) + 1.25], [-L / 2, top + 1.25], [-L / 2, top - 0.35], [zAt(0.35), 0]], 0.004, -w / 2 + 0.002));
  b.add(front ? "stencil" : "iron", side([[dz0, nose(dz0) + 1.25], [dz0, nose(dz0) + (front ? 1.3 : 1.265)], [-L / 2, top + (front ? 1.3 : 1.265)], [-L / 2, top + 1.25]], 0.005, -w / 2 + 0.0025));
  return b.parts();
}

for (const s of ["front", "rear"] as StairStyle[])
  for (const H of STAIR[s].H)
    for (const runner of s === "front" ? [false, true] : [false]) {
      const L = flightRun(s, H);
      prop({
        id: flightId(s, H, runner), items: ITEMS[s], size: [STAIR[s].w, H / 2 + 1.3, L + 0.2], place: "floor", where: "set", tris: s === "front" ? 7000 : 2500,
        parts: () => flight(s, H, runner),
      });
    }

// ── the landings ───────────────────────────────────────────────────────────────────────────────────────────────────

/** A landing across the stairwell: boards on joists, plastered under, SLAB thick, its top at SLAB. The wall it stands
 *  against is at -z, the flights meet its +z edge, a short rail guards the well between their newels. The walls carry
 *  the dado on from the flights (only to the sill on a half-landing's window wall). */
for (const s of ["front", "rear"] as StairStyle[])
  for (const half of [false, true]) {
    const S = STAIR[s], B = breadth(s), D = half ? S.dh : S.dl, front = s === "front";
    prop({
      id: `landing-${s}-${half ? "half" : "floor"}`, items: ITEMS[s], size: [B, SLAB + 1.3, D], place: "floor", where: "set", tris: 1200,
      parts: () => {
        const b = byMat(), boards: Solid[] = [];
        for (let z = -D / 2, i = 0; z < D / 2 - 0.01; z += 0.153, i++) boards.push(box(B, 0.028, Math.min(0.15, D / 2 - z), 0, SLAB - 0.028 + hash(i, D, 3) * 0.002, z + Math.min(0.15, D / 2 - z) / 2));
        b.add("floor-boards", union(...boards));
        b.add("iron", box(B, 0.01, D, 0, SLAB - 0.038, 0)); // the gaps between the boards read dark
        b.add(front ? "plaster-ceiling" : "lime-dirty", box(B, SLAB - 0.038, D, 0, 0, 0));
        b.add(front ? "wood-dark" : "paint-brown", union(box(S.well + 0.12, front ? 0.055 : 0.045, front ? 0.07 : 0.05, 0, SLAB + 0.9, D / 2 - 0.035), box(0.03, 0.9, 0.03, 0, SLAB, D / 2 - 0.035)));
        const dh = (w: "back" | "side") => (half && w === "back" ? 0.85 : 1.25), dm: MatId = front ? "dado-brown" : "oil-dado";
        b.add(dm, union(box(B, dh("back"), 0.004, 0, SLAB, -D / 2 + 0.002), box(0.004, 1.25, D, -B / 2 + 0.002, SLAB, 0), box(0.004, 1.25, D, B / 2 - 0.002, SLAB, 0)));
        const bh = front ? 0.05 : 0.015, sm: MatId = front ? "stencil" : "iron";
        b.add(sm, union(box(B, bh, 0.005, 0, SLAB + dh("back"), -D / 2 + 0.0025), box(0.005, bh, D, -B / 2 + 0.0025, SLAB + 1.25, 0), box(0.005, bh, D, B / 2 - 0.0025, SLAB + 1.25, 0)));
        return b.parts();
      },
    });
  }

// ── doors ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** A front building's flat door: a grained double-panel leaf under a glazed transom in a moulded architrave, the
 *  enamel nameplate, a porcelain bell pull, a peephole and a letter slot; the brass knob gone to the metal collection,
 *  an iron one in its place. Origin: bottom middle, on the wall; the landing is at +z. */
prop({
  id: "flat-door-oak", items: ["flat-door", "stair-front"], size: [1.2, 2.9, 0.1], place: "hung", where: "set", tris: 1200,
  parts: () => {
    const b = byMat();
    b.add("wood-dark", union(box(0.1, 2.9, 0.08, -0.55, 0, 0), box(0.1, 2.9, 0.08, 0.55, 0, 0), box(1.2, 0.14, 0.08, 0, 2.76, 0), box(1.0, 0.07, 0.07, 0, 2.42, 0)));
    b.add("wood-mid", union(box(0.98, 2.42, 0.045, 0, 0, -0.005), ...[-0.24, 0.24].flatMap((x) => [box(0.36, 0.42, 0.018, x, 0.18, 0.025), box(0.36, 0.95, 0.018, x, 0.74, 0.025), box(0.36, 0.5, 0.018, x, 1.82, 0.025)])));
    b.add("glass", box(0.98, 0.26, 0.006, 0, 2.49, 0));
    b.add("iron", union(lathe([[0, 0], [0.025, 0], [0.028, 0.02], [0.012, 0.05], [0, 0.05]], 0, 0, 0, 10).rotate(-90, 0, 0).move(0.36, 1.05, 0.02), box(0.2, 0.03, 0.01, 0, 1.0, 0.02), box(0.02, 0.02, 0.01, 0, 1.55, 0.02)));
    b.add("enamel", union(box(0.15, 0.05, 0.008, 0, 1.42, 0.02), lathe([[0, 0], [0.02, 0], [0.022, 0.025], [0, 0.04]], 0, 0, 0, 10).rotate(-90, 0, 0).move(0.55, 1.3, 0.04)));
    return b.parts();
  },
});

/** A rear building's flat door: four plain panels painted brown, a card for the name pinned on, an iron latch. */
prop({
  id: "flat-door-plain", items: ["flat-door", "stair-rear"], size: [1.0, 2.2, 0.08], place: "hung", where: "set", tris: 600,
  parts: () => {
    const b = byMat();
    b.add("paint-brown", union(box(0.07, 2.2, 0.06, -0.465, 0, 0), box(0.07, 2.2, 0.06, 0.465, 0, 0), box(1.0, 0.09, 0.06, 0, 2.11, 0)));
    b.add("wood-mid", union(box(0.86, 2.1, 0.04, 0, 0, -0.005), ...[-0.2, 0.2].flatMap((x) => [box(0.3, 0.7, 0.012, x, 0.2, 0.02), box(0.3, 0.95, 0.012, x, 1.05, 0.02)])));
    b.add("paper", box(0.1, 0.06, 0.003, 0, 1.45, 0.016));
    b.add("iron", union(box(0.12, 0.025, 0.02, 0.32, 1.02, 0.025), box(0.03, 0.08, 0.01, 0.38, 0.98, 0.02)));
    return b.parts();
  },
});

/** A ledged board door: the attic's (Weberstraße 18) and the half-landing WC's, with strap hinges and a latch; the
 *  WC's painted, a slot of a vent at the top. */
for (const [id, mat, vent] of [["board-door", "wood-grey", false], ["wc-door", "paint-green", true]] as const)
  prop({
    id, items: vent ? ["halflanding-wc", "stair-rear"] : ["stair-rear"], size: [0.85, 2.05, 0.07], place: "hung", where: "set", tris: 500,
    parts: () => {
      const b = byMat(), boards: Solid[] = [];
      for (let i = 0; i < 5; i++) boards.push(box(0.135, vent ? 1.6 : 1.95, 0.03, -0.28 + i * 0.14, 0, -0.005));
      if (vent) boards.push(box(0.7, 0.25, 0.03, 0, 1.7, -0.005));
      b.add(mat, union(...boards, box(0.68, 0.1, 0.025, 0, 0.25, 0.022), box(0.68, 0.1, 0.025, 0, 1.55, 0.022)));
      b.add("paint-brown", union(box(0.06, 2.05, 0.05, -0.395, 0, 0), box(0.06, 2.05, 0.05, 0.395, 0, 0), box(0.85, 0.06, 0.05, 0, 1.99, 0)));
      const iron = [box(0.4, 0.03, 0.006, -0.18, 0.28, 0.038), box(0.4, 0.03, 0.006, -0.18, 1.58, 0.038), box(0.1, 0.02, 0.015, 0.28, 1.0, 0.03)];
      if (vent) for (let i = 0; i < 4; i++) iron.push(box(0.5, 0.012, 0.006, 0, 1.73 + i * 0.05, 0.012));
      b.add("iron", union(...iron));
      return b.parts();
    },
  });

// ── windows, light, the rest ───────────────────────────────────────────────────────────────────────────────────────

/** A front stair's half-landing window: two casements of leaded lights under a transom, a border of amber and green
 *  round clear centres, a ruby lozenge in the transom. Origin: the sill's middle, in the reveal; the stair is at +z. */
prop({
  id: "stair-window-leaded", items: ["stair-front"], size: [1.1, 1.7, 0.12], place: "hung", where: "set", tris: 1400,
  parts: () => {
    const b = byMat(), W = 1.1, H = 1.7, tr = 1.3;
    b.add("paint-white", union(box(W, 0.06, 0.1, 0, 0, 0), box(W, 0.06, 0.1, 0, H - 0.06, 0), box(0.06, H, 0.1, -W / 2 + 0.03, 0, 0), box(0.06, H, 0.1, W / 2 - 0.03, 0, 0), box(0.05, tr, 0.08, 0, 0, 0), box(W, 0.06, 0.08, 0, tr, 0)));
    const panes: Record<string, Solid[]> = { glass: [], "glass-amber": [], "glass-green": [], "glass-ruby": [] };
    const lead: Solid[] = [];
    for (const sx of [-1, 1]) {
      const x0 = sx * 0.27, cw = 0.44, ch = tr - 0.06, nx = 3, ny = 5;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < ny; j++) {
          const edge = i === 0 || i === nx - 1 || j === 0 || j === ny - 1, m = !edge ? "glass" : (i + j) % 2 ? "glass-amber" : "glass-green";
          panes[m].push(box(cw / nx - 0.008, ch / ny - 0.008, 0.005, x0 - cw / 2 + (i + 0.5) * (cw / nx), 0.06 + j * (ch / ny) + 0.004, 0));
        }
      for (let i = 1; i < nx; i++) lead.push(box(0.008, ch, 0.009, x0 - cw / 2 + i * (cw / nx), 0.06, 0));
      for (let j = 1; j < ny; j++) lead.push(box(cw, 0.008, 0.009, x0, 0.06 + j * (ch / ny) - 0.004, 0));
    }
    for (let i = 0; i < 5; i++) panes[i === 2 ? "glass-ruby" : i % 2 ? "glass-amber" : "glass"].push(box(0.19, 0.27, 0.005, -0.4 + i * 0.2, tr + 0.07, 0));
    for (const [m, s] of Object.entries(panes)) if (s.length) b.add(m as MatId, union(...s));
    b.add("iron", union(...lead));
    return b.parts();
  },
});

/** A rear stair's window: two casements of two panes each, the paint grey with the court's soot. */
prop({
  id: "stair-window-plain", items: ["stair-rear"], size: [0.8, 1.1, 0.1], place: "hung", where: "set", tris: 300,
  parts: () => [
    { mat: "linen-grey", solid: union(box(0.8, 0.05, 0.08, 0, 0, 0), box(0.8, 0.05, 0.08, 0, 1.05, 0), box(0.05, 1.1, 0.08, -0.375, 0, 0), box(0.05, 1.1, 0.08, 0.375, 0, 0), box(0.04, 1.1, 0.07, 0, 0, 0), box(0.8, 0.03, 0.06, 0, 0.54, 0)) },
    { mat: "glass", solid: union(...[-0.19, 0.19].flatMap((x) => [box(0.32, 0.47, 0.005, x, 0.05, 0), box(0.32, 0.47, 0.005, x, 0.57, 0)])) },
  ],
});

/** The landing's gas lamp: an iron bracket and cock, a frosted globe. The house's gas burns on the stairs to a set
 *  hour; in the winter of 1917 not on every landing. */
prop({
  id: "stair-lamp", items: ["stair-light"], size: [0.2, 0.45, 0.32], place: "hung", where: "set", tris: 700,
  parts: () => [
    { mat: "iron", solid: union(box(0.08, 0.14, 0.01, 0, 0.18, -0.15), rodZ_(0.009, 0.24, 0, 0.25, -0.03), box(0.02, 0.1, 0.02, 0, 0.17, 0.09), lathe([[0, 0], [0.035, 0], [0.04, 0.02], [0, 0.03]], 0, 0.13, 0.09, 10)) },
    { mat: "lamp-shade", solid: lathe([[0, 0], [0.03, 0], [0.07, 0.04], [0.075, 0.09], [0.05, 0.13], [0.035, 0.15], [0, 0.15]], 0, -0.02, 0.09, 12) },
  ],
  glow: [{ at: [0, 0.05, 0.09], lumens: 90, color: "#ffd29a", range: 7 }],
});
function rodZ_(r: number, len: number, x: number, y: number, z: number): Solid { return zcyl(r, len).move(x, y, z); }

/** The house rules (Hausordnung) framed in the hall: the landlord's paragraphs on stairs, court, carpets and the gate's
 *  closing hour. */
prop({
  id: "house-rules", items: ["house-rules", "stair-front", "stair-rear"], size: [0.46, 0.62, 0.03], place: "hung", where: "set", tris: 300,
  parts: () => {
    const lines: Solid[] = [box(0.3, 0.025, 0.002, 0, 0.53, 0.012)];
    for (let i = 0; i < 14; i++) lines.push(box(0.3 - (i % 4 === 3 ? 0.12 : 0), 0.008, 0.002, -(i % 4 === 3 ? 0.06 : 0), 0.06 + i * 0.031, 0.012));
    return [
      { mat: "wood-dark", solid: union(box(0.46, 0.03, 0.025, 0, 0, 0), box(0.46, 0.03, 0.025, 0, 0.59, 0), box(0.03, 0.62, 0.025, -0.215, 0, 0), box(0.03, 0.62, 0.025, 0.215, 0, 0)) },
      { mat: "paper", solid: box(0.4, 0.56, 0.006, 0, 0.03, 0.006) },
      { mat: "iron", solid: union(...lines), overlap: true },
    ];
  },
});

/** The landing's shared tap over a cast-iron sink (Ausguss) on a bracket, its waste pipe to the floor. */
prop({
  id: "landing-sink", items: ["landing-tap", "stair-rear"], size: [0.5, 1.3, 0.36], place: "hung", where: "set", tris: 600,
  parts: () => [
    { mat: "iron", solid: union(box(0.46, 0.13, 0.32, 0, 0.75, 0.0).minus(box(0.4, 0.12, 0.26, 0, 0.78, 0.0)), zcyl(0.025, 0.75).rotate(-90, 0, 0).move(0, 0.375, -0.12), box(0.04, 0.12, 0.2, -0.18, 0.62, -0.06), box(0.04, 0.12, 0.2, 0.18, 0.62, -0.06)) },
    { mat: "iron-rust", solid: union(zcyl(0.012, 0.3).rotate(-90, 0, 0).move(0.12, 1.15, -0.15), zcyl(0.012, 0.16).move(0.12, 1.02, -0.07)), overlap: true },
    { mat: "brass", solid: union(lathe([[0, 0], [0.018, 0], [0.018, 0.06], [0.01, 0.08], [0, 0.08]], 0.12, 0.94, 0.01, 8), box(0.07, 0.012, 0.012, 0.12, 1.03, 0.01)) },
  ],
});

/** Limewash and plaster fallen off the wall to the brick (the survey's Weberstraße 18): an uneven patch of bare brick
 *  (brick-raw's pattern draws the courses) inside a rim of broken plaster, paler than the dirty wash round it. Origin:
 *  the patch's bottom middle on the wall. */
for (const [k, [pw, ph]] of [[0.7, 0.5], [1.0, 0.6], [0.45, 0.8]].entries())
  prop({
    id: `plaster-loss-${"abc"[k]}`, items: ["stair-rear"], size: [pw, ph, 0.012], place: "hung", where: "set", tris: 200,
    parts: () => {
      // a star-shaped outline, so it stays simple: a lobe or two (the low sine) and a ragged edge (the hash)
      const edge = (s: number): [number, number][] => Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * Math.PI * 2, j = (0.58 + 0.27 * hash(k, i, 11) + 0.15 * Math.sin(2 * a + k * 1.7)) * s;
        return [Math.cos(a) * (pw / 2) * j, ph / 2 + Math.sin(a) * (ph / 2) * j];
      });
      return [
        { mat: "brick-raw", solid: plate(ccw(edge(0.9)), 0.008) },
        { mat: "plaster-ceiling", solid: plate(ccw(edge(1)), 0.004), overlap: true },
      ];
    },
  });

/** A coir doormat before a flat door. */
prop({
  id: "doormat", items: ["flat-door"], size: [0.62, 0.015, 0.4], place: "floor", where: "set", tris: 50,
  parts: () => [{ mat: "jute", solid: box(0.62, 0.015, 0.4) }],
});

export const KIT_STAIR = true;
