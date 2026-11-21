// A planned room as the furnisher wants it (interiors/furnish.ts): a rectangle in its own frame, x along its back
// wall, z from the back wall (0) to the front (d), y up, placed in the scene by a corner and a yaw (as interiors/sets
// place their rooms), with its windows and doors on its four walls. The rectangle is the largest one of whole cells
// inside the room (an L-shaped Berliner Zimmer is furnished in its main part), inset for the partitions; the front
// wall is the one with the most window.
import { type Frame, type Grid, toWorld, type XY } from "../../interiors/plan/grid";
import type { Opening, Wall } from "../../interiors/shell";

/** `leaf`: a door's leaf hangs in this room ("here") or in the room behind ("there"); none: an open doorway */
export type Hole = { kind: "window" | "door"; p: XY; w: number; y0: number; y1: number; leaf?: "here" | "there" };
export interface RoomRec {
  lv: number; id: number; flat: number; use: string; berl?: 1;
  /** who sleeps here, bed by bed (indices into the flat's `who.people`), and whether the household cooks here (interiors/plan/life.ts) */
  sleep?: number[][]; cook?: 1;
  /** the room frame's origin (the back wall's left end at floor level) in the scene, and its yaw */
  at: [number, number, number]; yaw: number;
  l: number; d: number; h: number;
  open: Opening[];
  /** the wall that faces east (the Misrach's) */
  east: Wall;
  /** stretches of the box's walls with no wall of the room behind them (u0..u1 along the wall, as an opening's u) */
  bare?: Bare[];
}
/** `deep`: how far behind the box line the room's wall stands at its farthest along the stretch (9: none found, the
 *  room runs on) */
export type Bare = { wall: Wall; u0: number; u1: number; deep: number };

/** The largest rectangle of room `id`'s cells: [i0, j0, i1, j1], inclusive (the histogram method, row by row). */
export function maxRect(grid: Grid, of: Int32Array, id: number): [number, number, number, number] | null {
  let i0 = Infinity, j0 = Infinity, i1 = -1, j1 = -1;
  for (let j = 0; j < grid.nz; j++) for (let i = 0; i < grid.nx; i++) if (of[j * grid.nx + i] === id) { i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
  if (i1 < 0) return null;
  const W = i1 - i0 + 1, hgt = new Int32Array(W + 1);
  let best = 0, out: [number, number, number, number] | null = null;
  for (let j = j0; j <= j1; j++) {
    for (let i = 0; i < W; i++) hgt[i] = of[j * grid.nx + i0 + i] === id ? hgt[i] + 1 : 0;
    hgt[W] = 0;
    const st: number[] = [];
    for (let i = 0; i <= W; i++) {
      while (st.length && hgt[st[st.length - 1]] >= hgt[i]) {
        const top = st.pop()!, H = hgt[top], left = st.length ? st[st.length - 1] + 1 : 0, w = i - left;
        if (H * w > best) { best = H * w; out = [i0 + left, j - H + 1, i0 + i - 1, j]; }
      }
      st.push(i);
    }
  }
  return out;
}

/** A wall line of the room as the bake drew it (a chain's segment), and how far its face stands off the line. */
export type Seg = { p: XY; q: XY; m: number };
/** Pull the rectangle's sides in until no wall line passes inside it: the bake straightens a staircase of cells into
 *  one slanted wall, so whole cells can stand up to half a cell past it. */
function shrink(r: { xa: number; xb: number; za: number; zb: number }, segs: Seg[]) {
  // each wall line as a whole: of the four ways to clear it (one side moved past every point of it inside), keep the
  // one that leaves the most room (point by point, a slanted wall would ratchet one side along its whole length)
  for (let pass = 0; pass < 2; pass++) for (const s of segs) {
    const L = Math.hypot(s.q[0] - s.p[0], s.q[1] - s.p[1]), n = Math.max(2, Math.ceil(L / 0.05)), m = s.m + 0.02;
    const pts: [number, number][] = [];
    for (let k = 0; k <= n; k++) {
      const x = s.p[0] + ((s.q[0] - s.p[0]) * k) / n, z = s.p[1] + ((s.q[1] - s.p[1]) * k) / n;
      if (x > r.xa - m && x < r.xb + m && z > r.za - m && z < r.zb + m) pts.push([x, z]);
    }
    if (!pts.length) continue;
    const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
    const cands = [
      { ...r, xa: Math.max(r.xa, Math.max(...xs) + m) }, { ...r, xb: Math.min(r.xb, Math.min(...xs) - m) },
      { ...r, za: Math.max(r.za, Math.max(...zs) + m) }, { ...r, zb: Math.min(r.zb, Math.min(...zs) - m) },
    ];
    const area = (c: typeof r) => Math.max(0, c.xb - c.xa) * Math.max(0, c.zb - c.za);
    Object.assign(r, cands.sort((a, b) => area(b) - area(a))[0]);
  }
}

const S = (f: Frame, p: XY): XY => { const w = toWorld(f, p); return [w[0] - 391000, -(w[1] - 5819000)]; };
const dotv = (a: XY, b: XY) => a[0] * b[0] + a[1] * b[1];

/** The room's frame, size and openings, or null when the room is under 0.9 m either way (a 1.3 m kitchen still
 *  takes its range and Ausguss along one wall). */
export function roomFrame(grid: Grid, f: Frame, r: [number, number, number, number], holes: Hole[], y0: number, h: number, segs: Seg[] = [], inset = 0.12) {
  const g = grid.g, R = { xa: grid.x0 + r[0] * g + inset, xb: grid.x0 + (r[2] + 1) * g - inset, za: grid.z0 + r[1] * g + inset, zb: grid.z0 + (r[3] + 1) * g - inset };
  shrink(R, segs);
  const { xa, xb, za, zb } = R;
  if (xb - xa < 0.9 || zb - za < 0.9) return null;
  // the plan frame's sides, each with its outward normal; a hole goes to the side it lies on
  type Side = "W" | "E" | "S" | "N";
  const N: Record<Side, XY> = { W: [-1, 0], E: [1, 0], S: [0, -1], N: [0, 1] };
  const sideOf = (p: XY): Side | null => {
    const ds: [Side, number, boolean][] = [["W", Math.abs(p[0] - xa), p[1] > za - 0.3 && p[1] < zb + 0.3], ["E", Math.abs(p[0] - xb), p[1] > za - 0.3 && p[1] < zb + 0.3], ["S", Math.abs(p[1] - za), p[0] > xa - 0.3 && p[0] < xb + 0.3], ["N", Math.abs(p[1] - zb), p[0] > xa - 0.3 && p[0] < xb + 0.3]];
    const best = ds.filter((x) => x[2]).sort((a, b) => a[1] - b[1])[0];
    return best && best[1] < 0.7 ? best[0] : null;
  };
  const win: Record<Side, number> = { W: 0, E: 0, S: 0, N: 0 };
  for (const o of holes) if (o.kind === "window") { const s = sideOf(o.p); if (s) win[s] += o.w; }
  const opp: Record<Side, Side> = { W: "E", E: "W", S: "N", N: "S" };
  let front = (Object.keys(win) as Side[]).sort((a, b) => win[b] - win[a])[0];
  if (!win[front]) { const d = holes.find((o) => o.kind === "door" && sideOf(o.p)); front = d ? opp[sideOf(d.p)!] : (xb - xa >= zb - za ? "N" : "E"); }
  // the frame in the scene: z toward the front wall, x along the back wall (x = (z.z, -z.x) for raea's yaw)
  const c: XY = [(xa + xb) / 2, (za + zb) / 2], c0 = S(f, c), c1 = S(f, [c[0] + N[front][0], c[1] + N[front][1]]);
  const zl = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]), zh: XY = [(c1[0] - c0[0]) / zl, (c1[1] - c0[1]) / zl], xh: XY = [zh[1], -zh[0]];
  const corners = ([[xa, za], [xb, za], [xb, zb], [xa, zb]] as XY[]).map((p) => S(f, p));
  const px = corners.map((p) => dotv(p, xh)), pz = corners.map((p) => dotv(p, zh));
  const x0 = Math.min(...px), z0 = Math.min(...pz), l = Math.max(...px) - x0, d = Math.max(...pz) - z0;
  const O: XY = [xh[0] * x0 + zh[0] * z0, xh[1] * x0 + zh[1] * z0];
  const open: Opening[] = [];
  for (const o of holes) {
    const P = S(f, o.p), qx = dotv(P, xh) - x0, qz = dotv(P, zh) - z0;
    const near: [Wall, number, number][] = [["back", Math.abs(qz), qx], ["front", Math.abs(d - qz), l - qx], ["left", Math.abs(qx), d - qz], ["right", Math.abs(l - qx), qz]];
    const [wall, dist, u] = near.sort((a, b) => a[1] - b[1])[0];
    const L = wall === "back" || wall === "front" ? l : d;
    if (dist > 0.7 || u < -0.3 || u > L + 0.3) continue;
    const w = Math.min(o.w, L - 0.1);
    open.push({ wall, u: +Math.min(L - w / 2, Math.max(w / 2, u)).toFixed(2), w: +w.toFixed(2), y: +Math.max(0, o.y0 - y0).toFixed(2), h: +(o.y1 - o.y0).toFixed(2), kind: o.kind, ...(o.leaf ? { leaf: o.leaf } : {}) });
  }
  const outward: [Wall, XY][] = [["back", [-zh[0], -zh[1]]], ["front", zh], ["left", [-xh[0], -xh[1]]], ["right", xh]];
  const east = outward.sort((a, b) => b[1][0] - a[1][0])[0][0];
  // The box's sides where no wall of the room stands behind: the room runs on past its box (an L-shaped room), or its
  // wall steps back. The furnisher stands nothing against them, and the shot can see what is there (the director's "error
  // with wall", a review note: a dresser stood against air beside a wall's end).
  const bare: Bare[] = [], linings: Lining[] = [];
  if (segs.length) {
    const dseg = (p: XY, s: Seg) => {
      const vx = s.q[0] - s.p[0], vz = s.q[1] - s.p[1], L2 = vx * vx + vz * vz || 1e-9;
      const t = Math.max(0, Math.min(1, ((p[0] - s.p[0]) * vx + (p[1] - s.p[1]) * vz) / L2));
      return Math.hypot(p[0] - s.p[0] - t * vx, p[1] - s.p[1] - t * vz) - s.m;
    };
    // each sample's depth: how far out along the side's outward normal the first wall of the room stands
    const depthAt = (p: XY, nrm: XY) => {
      let best = 9;
      for (const s of segs) {
        const ex = s.q[0] - s.p[0], ez = s.q[1] - s.p[1], den = nrm[0] * ez - nrm[1] * ex;
        if (Math.abs(den) < 1e-9) continue;
        const wx = s.p[0] - p[0], wz = s.p[1] - p[1], t = (wx * ez - wz * ex) / den, v = (wx * nrm[1] - wz * nrm[0]) / den;
        if (t > 0 && v >= -0.02 && v <= 1.02) best = Math.min(best, t - s.m);
      }
      return best;
    };
    const sides: [XY, XY, XY][] = [[[xa, za], [xb, za], [0, -1]], [[xb, za], [xb, zb], [1, 0]], [[xb, zb], [xa, zb], [0, 1]], [[xa, zb], [xa, za], [-1, 0]]];
    for (const [a, b, nrm] of sides) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 0.1)), t: XY = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
      const pt = (s: number): XY => [a[0] + t[0] * s, a[1] + t[1] * s];
      // the wall this side is, and u along that wall for a point on it
      const Pm = S(f, pt(L / 2)), mx = dotv(Pm, xh) - x0, mz = dotv(Pm, zh) - z0;
      const wall = ([["back", Math.abs(mz)], ["front", Math.abs(d - mz)], ["left", Math.abs(mx)], ["right", Math.abs(l - mx)]] as [Wall, number][]).sort((p, q) => p[1] - q[1])[0][0];
      const WL = wall === "back" || wall === "front" ? l : d;
      const uOf = (p: XY) => { const P = S(f, p), qx = dotv(P, xh) - x0, qz = dotv(P, zh) - z0; return wall === "back" ? qx : wall === "front" ? l - qx : wall === "left" ? d - qz : qz; };
      // the bare samples, grouped into runs of neighbours that are all shallow or all deep
      const groups: { k0: number; k1: number; deep: number }[] = [];
      for (let k = 1; k < n; k++) {
        const p = pt((L * k) / n);
        if (segs.some((s) => dseg(p, s) < 0.22)) continue;
        const dp = depthAt(p, nrm), g = groups[groups.length - 1];
        if (g && k - g.k1 <= 1 && dp <= LINE === g.deep <= LINE) { g.k1 = k; g.deep = Math.max(g.deep, dp); } else groups.push({ k0: k, k1: k, deep: dp });
      }
      groups.forEach((g, j) => {
        const s0 = Math.max(0, (L * g.k0) / n - 0.05), s1 = Math.min(L, (L * g.k1) / n + 0.05);
        if (s1 - s0 < 0.25) return;
        if (g.deep > LINE) {
          const u0 = uOf(pt(s0)), u1 = uOf(pt(s1));
          bare.push({ wall, u0: +Math.max(0, Math.min(u0, u1)).toFixed(2), u1: +Math.min(WL, Math.max(u0, u1)).toFixed(2), deep: +g.deep.toFixed(2) });
          return;
        }
        // a shallow step: lined at the box's line, on through the walled stretches either side to the side's end, to
        // halfway to the next step, or to the wall's end before a deep run (so the wall it meets stands flush with it);
        // where it meets a deep run straight away, its end gets a cap back to the wall
        const prev = groups[j - 1], next = groups[j + 1], at = (k: number) => (L * k) / n;
        const capA = !!prev && prev.deep > LINE && g.k0 - prev.k1 <= 1, capB = !!next && next.deep > LINE && next.k0 - g.k1 <= 1;
        const e0 = !prev ? 0 : capA ? s0 : prev.deep > LINE ? at(prev.k1 + 1) - 0.05 : at((prev.k1 + g.k0) / 2);
        const e1 = !next ? L : capB ? s1 : next.deep > LINE ? at(next.k0 - 1) + 0.05 : at((g.k1 + next.k0) / 2);
        linings.push({ p0: pt(e0), p1: pt(e1), nrm, deep: +g.deep.toFixed(2), caps: [capA, capB] });
      });
    }
  }
  return { at: [+O[0].toFixed(3), +y0.toFixed(3), +O[1].toFixed(3)] as [number, number, number], yaw: +Math.atan2(zh[0], zh[1]).toFixed(4), l: +l.toFixed(2), d: +d.toFixed(2), h: +h.toFixed(2), open, east, ...(bare.length ? { bare } : {}), linings };
}

/** A shallow step of a room's wall is lined flush with its box (the bake draws it): a 1917 room was plastered square;
 *  only the plan's straightened cells step. Deeper than this, the room runs on (an L-shaped room) and stays open. */
export const LINE = 0.6;
/** A lining in the plan's frame: along p0 -> p1 at the box's side, its outward normal, how far behind it the wall
 *  stands, and whether each end is capped back to the wall (where it meets a stretch the room runs on past). */
export type Lining = { p0: XY; p1: XY; nrm: XY; deep: number; caps: [boolean, boolean] };
