// Generated house cellars: one under every building on the 1917 map, from its footprint and its key, nothing stored
// (research/catalogue/rooms.ts "cellar": under every building; cellar-cages, briquettes, a brick floor; often
// preserves and firewood; in the war, hoards). The hand-built cellar chain (interiors/sets/cellar.ts) is the hand-built one
// three; this is every other one, so any house can have one.
//
// A Berlin cellar under a Mietshaus is vaulted brick, about 2.4 m clear, and its plan follows the house above. The
// map's footprints are a lot's whole built area (front building, side wings, rear building in one ring: the median
// fills only 62% of its rectangle), so a footprint is first cut into parts, the largest rectangle first
// (footprintParts). Each part is a cellar of its own: naves up to about 7.5 m deep either side of spine walls; down
// each nave a corridor, and either side of it the flats' slatted compartments (Kellerverschläge), one per flat,
// locked. At one end the cellar stair comes down and that bay stays open (the gas meter, the house's coal shovel).
// Arches join the parts where they meet, only where nothing blocks them: in an open bay or at a corridor's end. Light
// comes in through the cellar windows from their light wells, on the outer walls.
//
// Frames. The footprint's frame: u along its rectangle's long axis, v across, from its corner; a set's x and z are u
// and v, y up from the cellar floor. A part's room is a shell in its own frame (x along the part's long side).
import type { V3 } from "./kit/geo";
import type { Opening, Shell, Wall } from "./shell";
import { onWall, type Place, type Room, type Set } from "./sets/types";

export const CELLAR = {
  h: 2.4, // clear height to the vault's crown
  fw: 0.51, // a fire wall (Brandwand) to the neighbours, two bricks
  ext: 0.64, // the outer walls under the facades
  join: 0.32, // each side of the wall between two parts of one house
  spine: 0.38, // the spine wall between two naves
  nave: 7.5, // deeper than this, more naves
  stair: 2.0, // the open bay at the stair's end, at least
  cell: 0.5, // the footprint raster
  part: 3.5, // a part's narrowest side
} as const;

/** A seeded value in [0, 1) from numbers (a local hash: this file runs in bun tools too, where kit/geo's raea
 *  imports don't resolve). */
export function hash(...n: number[]): number {
  let h = 0x9e3779b9;
  for (const x of n) { h = Math.imul(h ^ Math.floor(x * 1e6), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; }
  return (h >>> 0) / 4294967296;
}

/** A string's seed in [0, 1): FNV-1a with a final mix (as tools/interiors/windows.ts h32). */
export function seedOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export type Rect = { l: number; d: number; c: [number, number]; angle: number; fill: number };
/** A footprint's rectangle, in the ring's units (metres, EPSG:25833 on the map). The longest edge gives the axis
 *  (Berlin's houses are near-rectangles with jogs); l along it, d across, its centre, the axis's angle from +x, and
 *  `fill`, the share of the rectangle the footprint covers. */
export function footprintRect(ring: [number, number][]): Rect {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const o = ring[0], pts = (closed ? ring.slice(0, -1) : ring).map(([x, y]) => [x - o[0], y - o[1]] as [number, number]);
  let best = 0, ax: [number, number] = [1, 0];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], L = Math.hypot(x2 - x1, y2 - y1);
    if (L > best) { best = L; ax = [(x2 - x1) / L, (y2 - y1) / L]; }
  }
  const nx: [number, number] = [-ax[1], ax[0]];
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity, a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i], [x2, y2] = pts[(i + 1) % pts.length], u = x * ax[0] + y * ax[1], v = x * nx[0] + y * nx[1];
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v);
    a += x * y2 - x2 * y;
  }
  const um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
  let l = u1 - u0, d = v1 - v0, angle = Math.atan2(ax[1], ax[0]);
  if (d > l) { [l, d] = [d, l]; angle += Math.PI / 2; }
  return { l, d, c: [o[0] + ax[0] * um + nx[0] * vm, o[1] + ax[1] * um + nx[1] * vm], angle, fill: Math.abs(a) / 2 / (l * d) };
}

/** A box in the footprint's frame: u0..u1 along it, v0..v1 across. */
export type Box = { u0: number; u1: number; v0: number; v1: number };
export type Footprint = { origin: [number, number]; angle: number; l: number; d: number; ring: [number, number][]; parts: Box[]; cover: number };

/** The largest rectangle of set cells with both sides at least `ms` cells (row histograms and a stack). */
function maxRect(g: Uint8Array, nu: number, nv: number, ms: number): { i: number; j: number; w: number; h: number } | null {
  const hgt = new Int32Array(nu + 1);
  let best: { i: number; j: number; w: number; h: number } | null = null, ba = 0;
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) hgt[i] = g[j * nu + i] ? hgt[i] + 1 : 0;
    const st: number[] = [];
    for (let i = 0; i <= nu; i++) {
      const hh = i < nu ? hgt[i] : 0;
      while (st.length && hgt[st[st.length - 1]] >= hh) {
        const top = st.pop()!, height = hgt[top], left = st.length ? st[st.length - 1] + 1 : 0, w = i - left;
        if (height >= ms && w >= ms && height * w > ba) { ba = height * w; best = { i: left, j: j - height + 1, w, h: height }; }
      }
      st.push(i);
    }
  }
  return best;
}

/** A footprint cut into parts: rastered at CELLAR.cell in its rectangle's frame, then the largest rectangle taken
 *  until what's left is narrower than CELLAR.part (a jog, a bay, a sliver). `cover`: the share of the footprint the
 *  parts hold. */
export function footprintParts(ring: [number, number][]): Footprint {
  const r = footprintRect(ring), ax = [Math.cos(r.angle), Math.sin(r.angle)], nx = [-ax[1], ax[0]];
  const origin: [number, number] = [r.c[0] - ax[0] * r.l / 2 - nx[0] * r.d / 2, r.c[1] - ax[1] * r.l / 2 - nx[1] * r.d / 2];
  const loc = ring.map(([x, y]) => [(x - origin[0]) * ax[0] + (y - origin[1]) * ax[1], (x - origin[0]) * nx[0] + (y - origin[1]) * nx[1]] as [number, number]);
  const c = CELLAR.cell, nu = Math.max(1, Math.round(r.l / c)), nv = Math.max(1, Math.round(r.d / c)), g = new Uint8Array(nu * nv);
  const inside = (u: number, v: number) => {
    let k = false;
    for (let i = 0, j = loc.length - 1; i < loc.length; j = i++) {
      const [ui, vi] = loc[i], [uj, vj] = loc[j];
      if (vi > v !== vj > v && u < ((uj - ui) * (v - vi)) / (vj - vi) + ui) k = !k;
    }
    return k;
  };
  let total = 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) if (inside((i + 0.5) * c, (j + 0.5) * c)) { g[j * nu + i] = 1; total++; }
  const parts: Box[] = [], ms = Math.ceil(CELLAR.part / c);
  let covered = 0;
  for (let b = maxRect(g, nu, nv, ms); b; b = maxRect(g, nu, nv, ms)) {
    parts.push({ u0: b.i * c, u1: (b.i + b.w) * c, v0: b.j * c, v1: (b.j + b.h) * c });
    for (let j = b.j; j < b.j + b.h; j++) for (let i = b.i; i < b.i + b.w; i++) g[j * nu + i] = 0;
    covered += b.w * b.h;
  }
  return { origin, angle: r.angle, l: r.l, d: r.d, ring: loc, parts, cover: total ? covered / total : 0 };
}

/** A part's cellar plan, in its room's frame (x along its long side, z across): naves, the rows of compartments in
 *  each (two either side of the corridor, one along the back wall in a narrow wing, none in a passage), their depth,
 *  the corridor's width, the bays along x, and the open bay (x0, x1): at an end, or where the part meets the next. */
export type CellarPlan = {
  naves: { z0: number; dn: number }[];
  rows: 0 | 1 | 2;
  depth: number;
  cw: number;
  bays: { x0: number; w: number }[];
  open: [number, number];
};

const BAY_W = [1.9, 2.4, 2.9]; // a slatted door (0.9) and 1, 1.5 or 2 m of slats

/** `openAt`: where along x the open bay should be (the stair, or the arch to the next part); an end by the seed when
 *  not given. Bays fill from each end toward it; the slack widens the open bay. */
export function cellarPlan(key: string, l: number, d: number, openAt?: number): CellarPlan {
  const s = seedOf(key), r = (k: number) => hash(s * 997, k, 707);
  // one nave to 9 m (a wide corridor before a spine wall); deeper, naves of up to 7.5 m either side of spine walls
  const n = d <= 9 ? 1 : Math.ceil((d + CELLAR.spine) / (CELLAR.nave + CELLAR.spine));
  const dn = (d - (n - 1) * CELLAR.spine) / n;
  const naves = Array.from({ length: n }, (_, i) => ({ z0: i * (dn + CELLAR.spine), dn }));
  // compartments a whole number of half-metres deep (their cross walls are kit pieces), the corridor what's left
  const rows = dn >= 4.1 ? 2 : dn >= 2.6 ? 1 : 0;
  const depth = rows === 2 ? Math.max(1.5, Math.min(3, Math.floor((dn - 1.1) / 2 / 0.5) * 0.5)) : Math.max(1.5, Math.min(3, Math.floor((dn - 1.0) / 0.5) * 0.5));
  const cw = rows === 2 ? dn - 2 * depth : rows === 1 ? dn - depth : dn;
  const at = Math.max(0, Math.min(l, openAt ?? (r(1) < 0.5 ? 0 : l)));
  const a = Math.max(0, at - CELLAR.stair / 2 - Math.max(0, at + CELLAR.stair / 2 - l)), b = Math.min(l, a + CELLAR.stair);
  const bays: { x0: number; w: number }[] = [];
  let lo = 0, hi = l;
  if (rows) {
    // from the left end up to a, and from the right end down to b
    for (let i = 0; ; i++) { const fits = BAY_W.filter((w) => lo + w <= a + 1e-6); if (!fits.length) break; const w = fits[Math.floor(r(10 + i) * fits.length)]; bays.push({ x0: lo, w }); lo += w; }
    for (let i = 0; ; i++) { const fits = BAY_W.filter((w) => hi - w >= b - 1e-6); if (!fits.length) break; const w = fits[Math.floor(r(40 + i) * fits.length)]; hi -= w; bays.push({ x0: hi, w }); }
  }
  return { naves, rows, depth, cw, bays, open: [lo, hi] };
}

// ── a part in the footprint's frame ────────────────────────────────────────────────────────────────────────────────

type Side = "u0" | "u1" | "v0" | "v1";
/** A part as built: its inner box (inset where it meets another part), whether its room runs along v, its room's
 *  size, plan and walls, and the arches through its walls. */
export type PartLayout = {
  key: string;
  box: Box;
  rotated: boolean;
  l: number;
  d: number;
  plan: CellarPlan;
  /** a side that meets another part (one wall between them, an arch where there is room) */
  joined: Record<Side, boolean>;
  /** a side under a facade or a court, with room for a light well and the stair: windows go here */
  outer: Record<Side, boolean>;
  /** each side's wall thickness: half the way to the next part at most, so two parts' walls meet and never cross */
  t: Record<Side, number>;
  /** the way out from each side to the next part of the house (Infinity: none beyond it) */
  clear: Record<Side, number>;
  arches: { wall: Wall; t: number }[];
  stair: Wall | null;
};
export type CellarLayout = { fp: Footprint; parts: PartLayout[]; joins: number; arched: number };

/** Which side of the footprint's frame a room wall is on. */
const sideOf = (rot: boolean, w: Wall): Side => (rot ? { back: "u1", front: "u0", left: "v0", right: "v1" } : { back: "v0", front: "v1", left: "u0", right: "u1" })[w] as Side;
/** A room point (x along the room, z across) in the footprint's frame. */
export function toFrame(p: PartLayout, rx: number, rz: number): [number, number] {
  return p.rotated ? [p.box.u1 - rz, p.box.v0 + rx] : [p.box.u0 + rx, p.box.v0 + rz];
}
/** Where on a room wall (as the room's x for back and front, its z for left and right) a point `t` along the frame side
 *  lies, and back. */
const wallPos = (p: PartLayout, w: Wall, t: number) => (w === "back" || w === "front" ? t - (p.rotated ? p.box.v0 : p.box.u0) : p.rotated ? p.box.u1 - t : t - p.box.v0);
const frameT = (p: PartLayout, w: Wall, x: number) => (w === "back" || w === "front" ? x + (p.rotated ? p.box.v0 : p.box.u0) : p.rotated ? p.box.u1 - x : x + p.box.v0);

/** Where an arch may open in a room wall without cutting into a compartment: intervals of the wall position. */
function free(p: PartLayout, w: Wall): [number, number][] {
  const pl = p.plan, m = 0.6;
  // a long wall: the open bay (a one-row wing's front wall is the corridor's, free all along)
  if (w === "back" || w === "front") return !pl.bays.length || (pl.rows === 1 && w === "front") ? [[m, p.l - m]] : [[pl.open[0] + m, pl.open[1] - m]];
  // an end wall: all of it where the open bay meets it, else the corridor's end
  const open = !pl.bays.length || (w === "left" ? pl.open[0] < 0.01 : pl.open[1] > p.l - 0.01);
  const c0 = pl.depth, c1 = pl.rows === 2 ? pl.depth + pl.cw : pl.depth + pl.cw, mc = Math.min(m, pl.cw / 2);
  return pl.naves.map((nv) => (open ? [nv.z0 + m, nv.z0 + nv.dn - m] : [nv.z0 + c0 + mc, nv.z0 + c1 - mc]) as [number, number]);
}

export function cellarLayout(key: string, ring: [number, number][]): CellarLayout {
  const fp = footprintParts(ring), E = 1e-6, J = CELLAR.join, SIDES: Side[] = ["u0", "u1", "v0", "v1"];
  // the parts' meetings: two sides facing across no more than a metre (a raster cell or two of courtyard edge between
  // a wing and its house is one wall), and the overlap along them
  const meets: { a: number; b: number; sa: Side; sb: Side; lo: number; hi: number; g: number }[] = [];
  fp.parts.forEach((A, a) => fp.parts.forEach((B, b) => {
    if (b <= a) return;
    const ov = (x0: number, x1: number, y0: number, y1: number) => [Math.max(x0, y0), Math.min(x1, y1)];
    const tests: [number, Side, Side, number[]][] = [
      [B.u0 - A.u1, "u1", "u0", ov(A.v0, A.v1, B.v0, B.v1)],
      [A.u0 - B.u1, "u0", "u1", ov(A.v0, A.v1, B.v0, B.v1)],
      [B.v0 - A.v1, "v1", "v0", ov(A.u0, A.u1, B.u0, B.u1)],
      [A.v0 - B.v1, "v0", "v1", ov(A.u0, A.u1, B.u0, B.u1)],
    ];
    for (const [g, sa, sb, [lo, hi]] of tests) if (g > -E && g < 1 + E && hi - lo > 0.5) meets.push({ a, b, sa, sb, lo, hi, g: Math.max(0, g) });
  }));
  // a met side steps in so the wall between is at least two half-walls thick
  const boxes = fp.parts.map((raw, i) => {
    const inset = (s: Side) => Math.max(0, ...meets.filter((m) => (m.a === i && m.sa === s) || (m.b === i && m.sb === s)).map((m) => J - m.g / 2));
    return { u0: raw.u0 + inset("u0"), u1: raw.u1 - inset("u1"), v0: raw.v0 + inset("v0"), v1: raw.v1 - inset("v1") };
  });
  // the way out from each side to the nearest part beyond it (along the side and a wall's thickness past its ends)
  const clear = (i: number, s: Side) => {
    const A = boxes[i], X = CELLAR.ext;
    let c = Infinity;
    boxes.forEach((B, j) => {
      if (j === i) return;
      const alongV = B.v1 > A.v0 - X && B.v0 < A.v1 + X, alongU = B.u1 > A.u0 - X && B.u0 < A.u1 + X;
      if (s === "u1" && alongV && B.u0 >= A.u1 - E) c = Math.min(c, B.u0 - A.u1);
      if (s === "u0" && alongV && B.u1 <= A.u0 + E) c = Math.min(c, A.u0 - B.u1);
      if (s === "v1" && alongU && B.v0 >= A.v1 - E) c = Math.min(c, B.v0 - A.v1);
      if (s === "v0" && alongU && B.v1 <= A.v0 + E) c = Math.min(c, A.v0 - B.v1);
    });
    return c;
  };
  const parts: PartLayout[] = fp.parts.map((_, i) => {
    const box = boxes[i], joined = {} as Record<Side, boolean>, outer = {} as Record<Side, boolean>, t = {} as Record<Side, number>, cl = {} as Record<Side, number>;
    const rotated = box.u1 - box.u0 < box.v1 - box.v0, l = rotated ? box.v1 - box.v0 : box.u1 - box.u0, d = rotated ? box.u1 - box.u0 : box.v1 - box.v0;
    for (const s of SIDES) {
      const c = clear(i, s), end = rotated ? s[0] === "v" : s[0] === "u";
      joined[s] = meets.some((m) => (m.a === i && m.sa === s) || (m.b === i && m.sb === s));
      // a joined side fills half the way to its neighbour; an outer one keeps its facade or fire wall, thinned where
      // another part comes close
      t[s] = joined[s] ? c / 2 : Math.min(end ? CELLAR.fw : CELLAR.ext, c / 2);
      outer[s] = !joined[s] && c >= 1.5;
      cl[s] = c;
    }
    const pk = `${key}:${i}`;
    const p: PartLayout = { key: pk, box, rotated, l, d, plan: cellarPlan(pk, l, d), joined, outer, t, clear: cl, arches: [], stair: null };
    // the open bay where the part meets its largest neighbour: at that end for an end wall, at the meeting's middle
    // along a long wall
    const mine = meets.filter((m) => m.a === i || m.b === i).sort((x, y) => y.hi - y.lo - (x.hi - x.lo))[0];
    if (mine) {
      const side = mine.a === i ? mine.sa : mine.sb, w = (["back", "front", "left", "right"] as Wall[]).find((x) => sideOf(rotated, x) === side)!;
      const at = w === "left" ? 0 : w === "right" ? l : wallPos(p, w, (mine.lo + mine.hi) / 2);
      p.plan = cellarPlan(pk, l, d, at);
    }
    return p;
  });
  // an arch at each meeting where both sides have room for it
  let arched = 0;
  for (const m of meets) {
    const A = parts[m.a], B = parts[m.b];
    const wa = (["back", "front", "left", "right"] as Wall[]).find((w) => sideOf(A.rotated, w) === m.sa)!;
    const wb = (["back", "front", "left", "right"] as Wall[]).find((w) => sideOf(B.rotated, w) === m.sb)!;
    const iv = (p: PartLayout, w: Wall) => free(p, w).map(([x0, x1]) => { const t0 = frameT(p, w, x0), t1 = frameT(p, w, x1); return [Math.min(t0, t1), Math.max(t0, t1)]; });
    let t: number | null = null;
    for (const [a0, a1] of iv(A, wa)) for (const [b0, b1] of iv(B, wb)) {
      const lo = Math.max(a0, b0, m.lo + 0.6), hi = Math.min(a1, b1, m.hi - 0.6);
      if (t === null && hi >= lo) t = (lo + hi) / 2;
    }
    if (t === null) continue;
    A.arches.push({ wall: wa, t }); B.arches.push({ wall: wb, t }); arched++;
  }
  // the cellar stair: on the back wall's open bay where that wall is outside, else the front's, else none (the part
  // is reached from its neighbours)
  for (const p of parts) {
    for (const w of ["back", "front"] as Wall[]) if (!p.stair && p.outer[sideOf(p.rotated, w)] && p.clear[sideOf(p.rotated, w)] >= 5.2 && p.plan.open[1] - p.plan.open[0] >= 1.6) p.stair = w;
  }
  return { fp, parts, joins: meets.length, arched };
}

// ── building it ────────────────────────────────────────────────────────────────────────────────────────────────────

const PANEL = (run: number): [string, number][] => (run > 1.9 ? [["slats-2", 2]] : run > 1.4 ? [["slats-1", 1], ["slats-h", 0.5]] : [["slats-1", 1]]);

/** The slat walls of one row of compartments, in a nave's frame: the corridor side (a door and panels per bay) and
 *  the cross walls between bays and at the open end. `outer` and `edge`: the row's outer wall and corridor edge, z. */
function partitions(pl: CellarPlan, l: number, outer: number, edge: number): Place[] {
  const p: Place[] = [], back = edge > outer, yaw = back ? Math.PI : 0, dir = back ? 1 : -1, oc = (pl.open[0] + pl.open[1]) / 2;
  for (const b of pl.bays) {
    // the door at the bay's end nearer the open bay (where the stair comes down), then the slats
    const lowDoor = b.x0 > oc;
    p.push({ prop: "slats-door", at: [lowDoor ? b.x0 + 0.45 : b.x0 + b.w - 0.45, 0, edge], yaw });
    let x = lowDoor ? b.x0 + 0.9 : b.x0;
    for (const [id, w] of PANEL(b.w - 0.9)) { p.push({ prop: id, at: [x + w / 2, 0, edge], yaw }); x += w; }
  }
  // cross walls at every bay boundary but the end walls
  const xs = new globalThis.Set<number>();
  for (const b of pl.bays) for (const x of [b.x0, b.x0 + b.w]) xs.add(Math.round(x * 1000) / 1000);
  const len = pl.depth - 0.07;
  for (const x of xs) if (x > 0.01 && x < l - 0.01) p.push({ prop: `slats-x${Math.round(pl.depth * 10)}`, at: [x, 0, outer + dir * (0.01 + len / 2)], yaw: Math.PI / 2 });
  return p;
}

/** What a compartment holds, seeded by part, nave, row and bay: winter 1917, so little coal, some potatoes, few full
 *  jars, a sledge, a basket (the hand-built chain's mix, interiors/sets/cellar.ts). */
function contents(key: string, k: number, x0: number, x1: number, outer: number, inward: number, depth: number, doorLow: boolean): Place[] {
  const s = seedOf(key), r = (j: number) => hash(s * 991, k, j, 708), p: Place[] = [];
  const yaw = inward > 0 ? 0 : Math.PI, z = (off: number) => outer + inward * off;
  // along the outer wall, side by side from the bay's low end, each only where it still fits: the fuel, a shelf of
  // jars, the potatoes
  let x = x0;
  const wall = (prop: string, w: number, off: number, scale?: number) => {
    if (x + w > x1 + 1e-6) return;
    p.push({ prop, at: [x + w / 2, 0, z(off)], yaw, ...(scale ? { scale } : {}) });
    x += w + 0.08;
  };
  const heap = r(0) >= 0.55, sc = 0.6 + r(9) * 0.4;
  if (heap) wall("coal-heap", 1.5 * sc, 0.6 * sc, sc);
  else wall("briquette-stack", 0.8, 0.22);
  if (r(4) < 0.45) wall("preserve-shelf", 1.2, 0.17);
  if (r(1) < 0.6) { if (r(2) < 0.5) wall("potato-bin", 0.9, 0.32); else wall("potato-sack", 0.5, 0.21); }
  // in front of them, from the end away from the door so it still swings: a sledge, a carrying basket, a crock,
  // split firewood
  const zf = heap ? Math.max(0.85, 1.2 * sc + 0.08) : 0.8, ze = depth - 0.12, lim = doorLow ? x0 + 0.95 : x1 - 0.95;
  let f = doorLow ? x1 : x0;
  const front = (prop: string, w: number, dz: number, yw: number) => {
    if (zf + dz > ze) return;
    const a = doorLow ? f - w : f, b = doorLow ? f : f + w;
    if (doorLow ? a < lim : b > lim) return;
    p.push({ prop, at: [(a + b) / 2, 0, z(zf + dz / 2)], yaw: yw });
    f = doorLow ? a - 0.1 : b + 0.1;
  };
  if (r(6) < 0.3) front("sledge", 1.0, 0.42, Math.PI / 2);
  if (r(7) < 0.5) front("kiepe", 0.5, 0.5, yaw + (r(8) - 0.5) * 0.6);
  if (r(5) < 0.35) front("crock", 0.42, 0.42, yaw);
  if (r(10) < 0.4) front("firewood", 0.5, 0.4, yaw);
  return p;
}

/** A part's naves as rooms, placed in the footprint's frame, and the light down its windows. */
function partRooms(p: PartLayout, pi: number): { rooms: Room[]; outside: NonNullable<Set["outside"]> } {
  const pl = p.plan, H = CELLAR.h, s = seedOf(p.key), [o0, o1] = pl.open, oc = (o0 + o1) / 2, n = pl.naves.length;
  const outer = (w: Wall) => p.outer[sideOf(p.rotated, w)], tw = (w: Wall) => p.t[sideOf(p.rotated, w)];
  const outside: NonNullable<Set["outside"]> = [];
  const rooms = pl.naves.map((nv, ni): Room => {
    const first = ni === 0, last = ni === n - 1, openings: Opening[] = [];
    // cellar windows over every other compartment on an outer long wall
    pl.bays.forEach((b, i) => {
      if ((i + ni) % 2) return;
      const u = b.x0 + b.w / 2;
      if (last && outer("front")) openings.push({ wall: "front", u: p.l - u, w: 0.7, y: H - 0.66, h: 0.42, kind: "window" });
      if (first && outer("back")) openings.push({ wall: "back", u, w: 0.7, y: H - 0.66, h: 0.42, kind: "window" });
    });
    if (!pl.bays.length) for (const w of ["back", "front"] as Wall[]) if (((w === "back" && first) || (w === "front" && last)) && outer(w)) openings.push({ wall: w, u: p.l / 2, w: 0.7, y: H - 0.66, h: 0.42, kind: "window" });
    if (p.stair === "back" && first) openings.push({ wall: "back", u: oc, w: 0.95, y: 0, h: 1.95, kind: "arch", threshold: true });
    if (p.stair === "front" && last) openings.push({ wall: "front", u: p.l - oc, w: 0.95, y: 0, h: 1.95, kind: "arch", threshold: true });
    if (!last) openings.push({ wall: "front", u: p.l - oc, w: 1.1, y: 0, h: 1.95, kind: "arch", threshold: true }); // through the spine wall
    for (const a of p.arches) {
      const x = wallPos(p, a.wall, a.t);
      if (a.wall === "back" && first) openings.push({ wall: "back", u: x, w: 1.1, y: 0, h: 1.95, kind: "arch", threshold: true });
      if (a.wall === "front" && last) openings.push({ wall: "front", u: p.l - x, w: 1.1, y: 0, h: 1.95, kind: "arch", threshold: true });
      if ((a.wall === "left" || a.wall === "right") && x > nv.z0 && x < nv.z0 + nv.dn) {
        const zn = x - nv.z0;
        openings.push({ wall: a.wall, u: a.wall === "left" ? nv.dn - zn : zn, w: 1.1, y: 0, h: 1.95, kind: "arch", threshold: true });
      }
    }
    const shell: Shell = {
      l: p.l, d: nv.dn, h: H,
      t: {
        back: first ? tw("back") : CELLAR.spine,
        front: last ? tw("front") : CELLAR.spine,
        left: tw("left"),
        right: tw("right"),
      },
      walls: "brick-wash", dado: { mat: "brick", h: 0.55 }, floor: "brick", ceiling: "vault", seed: Math.floor(s * 997) + ni,
      skip: first ? [] : ["back"], openings,
    };
    const props: Place[] = [];
    // the steps up to the court or the pavement, out through the stair's arch
    if (p.stair === "back" && first) props.push({ prop: "cellar-steps", at: [oc, 0, 0], yaw: 0 });
    if (p.stair === "front" && last) props.push({ prop: "cellar-steps", at: [oc, 0, nv.dn], yaw: Math.PI });
    if (pl.bays.length)
      [{ outer: 0, edge: pl.depth, inward: 1 }, { outer: nv.dn, edge: nv.dn - pl.depth, inward: -1 }].slice(0, pl.rows).forEach((row, ri) => {
        props.push(...partitions(pl, p.l, row.outer, row.edge));
        // contents stand off a bay's slats by 5 cm, off an end wall by 30 (a stack tight in a corner is read as in the wall)
        pl.bays.forEach((b, bi) => props.push(...contents(p.key, ni * 1000 + ri * 100 + bi, b.x0 + (b.x0 < 0.01 ? 0.3 : 0.05), b.x0 + b.w - (b.x0 + b.w > p.l - 0.01 ? 0.3 : 0.05), row.outer, row.inward, pl.depth, b.x0 > oc)));
      });
    else if (first) {
      // too narrow for compartments: the house's coal cellar, its heap along the wall
      props.push({ prop: "coal-heap", at: [p.l * 0.4, 0, nv.dn * 0.3], yaw: hash(s, 6) * 6, scale: 0.9 });
      props.push({ prop: "briquette-stack", at: [p.l * 0.7, 0, 0.22], yaw: 0 });
    }
    if (first && p.stair) {
      // the open bay: the house's gas meter on the end wall there (when it is outside), the coal shovel, a bucket
      const endWall: Wall | null = o0 < 0.01 ? "left" : o1 > p.l - 0.01 ? "right" : null;
      if (endWall && outer(endWall)) props.push({ prop: "gas-meter", ...onWall(shell, endWall, nv.dn / 2 + 0.3, 0.25, 1.6) });
      const edgeX = endWall === "left" ? 0.15 : endWall === "right" ? p.l - 0.15 : o0 + 0.15;
      props.push({ prop: "coal-shovel", at: [edgeX, 0, Math.max(0.4, nv.dn - 0.6)], yaw: Math.PI / 2 });
      if (hash(s, 3) < 0.5) props.push({ prop: "bucket", at: [oc + (endWall === "right" ? -0.6 : 0.6), 0, nv.dn - 0.35], yaw: hash(s, 4) * 6 });
    }
    const [fx, fz] = toFrame(p, 0, nv.z0);
    // light wells: a gas lamp's spill down a street window, grey court light down the others
    for (const o of openings.filter((q) => q.kind === "window")) {
      const rx = o.wall === "front" ? p.l - o.u : o.u, rz = o.wall === "front" ? nv.z0 + nv.dn + 0.5 : nv.z0 - 0.5;
      const [ux, vz] = toFrame(p, rx, rz), [lx, lz] = toFrame(p, rx, nv.z0 + nv.dn / 2);
      if (hash(s, ni, o.u, 5) < 0.6) outside.push({ at: [ux, H - 0.3, vz], look: [lx, 0, lz], lumens: 700, color: o.wall === "front" ? "#9fb4d6" : "#8d99ad", kind: "spot" });
    }
    return { id: `part${pi}-nave${ni}`, shell, at: [fx, 0, fz] as V3, yaw: p.rotated ? -Math.PI / 2 : 0, props };
  });
  return { rooms, outside };
}

/** A building's cellar as a set, in its footprint's frame: every part's naves, joined, lit by their light wells, with
 *  views from the first part's stair, into a compartment, and through an arch to the next part. */
export function buildingCellar(key: string, ring: [number, number][]): Set & { layout: CellarLayout } {
  const lay = cellarLayout(key, ring), rooms: Room[] = [], outside: NonNullable<Set["outside"]> = [];
  lay.parts.forEach((p, i) => { const r = partRooms(p, i); rooms.push(...r.rooms); outside.push(...r.outside); });
  const p0 = [...lay.parts].sort((a, b) => b.l * b.d - a.l * a.d)[0];
  const cams: Set["cams"] = [];
  if (p0) {
    const pl = p0.plan, oc = (pl.open[0] + pl.open[1]) / 2, far = oc < p0.l / 2 ? p0.l - 0.4 : 0.4, near = oc < p0.l / 2 ? Math.max(0.6, pl.open[0] + 0.4) : Math.min(p0.l - 0.6, pl.open[1] - 0.4);
    const cz = pl.rows === 1 ? pl.depth + pl.cw / 2 : pl.naves[0].dn / 2;
    const f = (rx: number, y: number, rz: number): V3 => { const [u, v] = toFrame(p0, rx, rz); return [u, y, v]; };
    cams.push({ id: "stair", eye: f(near, 1.5, cz), at: f(far, 1.0, cz), fov: 60, lamp: 40, note: "from the open end down the corridor" });
    const b = pl.bays[Math.floor(pl.bays.length / 2)];
    if (b) {
      // inside one compartment of the near row, standing at its slats, looking down at what the flat keeps there
      const bc = b.x0 + b.w / 2, sg = b.x0 > oc ? -1 : 1, ex = Math.max(0.4, Math.min(p0.l - 0.4, bc + sg * 1.8));
      cams.push({ id: "compartment", eye: f(bc - sg * (b.w / 2 - 0.35), 1.5, pl.depth - 0.18), at: f(bc + sg * 0.3, 0.45, 0.25), fov: 70, lamp: 60, note: "inside one flat's compartment, its back to the slats: its coal, potatoes, jars" });
    }
    const ps = lay.parts.find((p) => p.stair) ?? null;
    if (ps) {
      // up the steps to the court door, from the corridor
      const o = (ps.plan.open[0] + ps.plan.open[1]) / 2, back = ps.stair === "back", zw = back ? 0 : ps.d, dir = back ? 1 : -1;
      const g = (rx: number, y: number, rz: number): V3 => { const [u, v] = toFrame(ps, rx, rz); return [u, y, v]; };
      cams.push({ id: "steps", eye: g(o + 0.25, 1.45, zw + dir * Math.min(2.6, ps.plan.naves[0].dn - 0.4)), at: g(o, 1.9, zw - dir * 3), fov: 58, lamp: 25, note: "the way in: up the steps to the court door, light round its edges" });
    }
    const a = p0.arches[0];
    if (a) {
      const x = wallPos(p0, a.wall, a.t), long = a.wall === "back" || a.wall === "front";
      const rz = a.wall === "back" ? 0 : a.wall === "front" ? p0.d : x, rx = long ? x : a.wall === "left" ? 0 : p0.l;
      const back = long ? [x, a.wall === "back" ? 1.6 : p0.d - 1.6] : [a.wall === "left" ? 2.2 : p0.l - 2.2, x];
      cams.push({ id: "arch", eye: f(back[0], 1.5, back[1]), at: f(rx, 1.0, rz), fov: 58, lamp: 40, note: "through the arch into the next part of the house" });
    }
  }
  return {
    id: `cellar-${key}`,
    title: `House cellar under ${key}: ${lay.parts.length} parts, ${lay.arched} of ${lay.joins} joins arched`,
    use: "every house's cellar, tier 2 (built at stream-in from the footprint and key)",
    rooms,
    cams,
    outside,
    ambient: { color: "#6b5a4a", brightness: 60 },
    exposure: 1.2,
    wear: { dust: 0.55, dirt: 0.6, edges: 0.4 },
    layout: lay,
  };
}

// ── the city's cellar panes ────────────────────────────────────────────────────────────────────────────────────────

/** What a cellar window in the city shows (interiors/atlas.ts, recipe "house-cellar"): the compartment under it. The
 *  atlas box is that compartment: x across the window, z from its slats (0) to the window's wall (d), the window high
 *  in the front face. The corridor and the far row are drawn behind the slats, so the back face looks through them;
 *  the neighbours either side are left dark, as they are. */
export const SLICE = { l: 2.5, d: 2.5, h: CELLAR.h, cam_y: 1.2, window: { w: 0.7, h: 0.42, sill: CELLAR.h - 0.66 } } as const;

/** The slice as a room in the atlas box's frame; `lit`: someone fetching coal, a candle on an upturned pail. */
export function cellarSlice(seed: number, lit: boolean): Room {
  const depth = SLICE.d, cw = 1.6, dn = 2 * depth + cw, bw = 2.4, x0 = (SLICE.l - bw) / 2, key = `slice-${seed}`;
  const pl: CellarPlan = { naves: [{ z0: 0, dn }], rows: 2, depth, cw, bays: [{ x0, w: bw }], open: [-2, -1] };
  const W = SLICE.window;
  const shell: Shell = {
    l: SLICE.l, d: dn, h: SLICE.h, t: { back: CELLAR.ext, front: CELLAR.ext, left: 0.2, right: 0.2 },
    walls: "brick-wash", dado: { mat: "brick", h: 0.55 }, floor: "brick", ceiling: "vault", seed: Math.floor(seed * 997),
    skip: ["left", "right"],
    openings: [{ wall: "front", u: SLICE.l / 2, w: W.w, y: W.sill, h: W.h, kind: "window" }],
  };
  const props: Place[] = [
    ...partitions(pl, SLICE.l, dn, dn - depth),
    ...partitions(pl, SLICE.l, 0, depth),
    ...contents(key, 0, x0 + 0.05, x0 + bw - 0.05, dn, -1, depth, true),
    ...contents(key, 1, x0 + 0.05, x0 + bw - 0.05, 0, 1, depth, true),
  ];
  if (lit) props.push({ prop: "bucket-up", at: [x0 + 0.45, 0, dn - depth + 0.45], yaw: 0.4 }, { prop: "candle", at: [x0 + 0.45, 0.3, dn - depth + 0.45], yaw: 0, lit: true });
  return { id: "slice", shell, at: [0, 0, -(dn - depth)], props };
}
