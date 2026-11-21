// Lays a room out from its furniture groups (interiors/layout/groups.ts): each group's anchor tried on every wall at
// 10 cm steps, scored by what the group likes (its walls, the door, the windows, a bed beside a bed), and taken only
// where it, its pieces and the floor its use needs are clear of everything placed and of the floor kept before the
// doors, and where a person can still walk from a door to every piece's use (a 10 cm grid, 0.2 m either side of
// the walker). A group that fits nowhere tries again without its table and chairs, then is left out: a crowded Stube
// loses its table before a bed (the director, a review note: "maybe remove tables if it's this crowded"). Things that sit
// on others are packed onto their host's top without overlapping, as many as the clutter dial allows.
import { def } from "../kit/prop";
import { hash } from "../kit/geo";
import type { Shell, Wall } from "../shell";
import type { Place } from "../sets/types";
import { GROUPS, ON, TOPS, type GroupDef, type Member, type Stand } from "./groups";

export type Rect = [number, number, number, number]; // x0 z0 x1 z1
type V2 = [number, number];
const hit = (a: Rect, b: Rect) => a[0] < b[2] - 1e-3 && b[0] < a[2] - 1e-3 && a[1] < b[3] - 1e-3 && b[1] < a[3] - 1e-3;
const WALLS: Wall[] = ["back", "left", "right", "front"];

export interface LayoutIn {
  sh: Shell;
  /** the room's floor, wall and on-top props (a bed once per sleeper's bed) */
  props: string[];
  /** a prop for an item, as the furnisher draws it (for the chairs a table brings) */
  propFor: (item: string) => string | null;
  seed: number;
  /** floor kept clear: before the doors and holes, the gallery's view */
  keep: Rect[];
  /** 0-1: how many small things a top takes */
  clutter: number;
  /** the front wall last (the window atlas sees it edge-on) */
  frontLast?: boolean;
}
export interface Piece { prop: string; c: V2; y: number; yaw: number; fp: Rect; h: number }
export interface LayoutOut { places: Place[]; tall: { fp: Rect; h: number }[]; table: { at: [number, number, number]; top: number } | null; left: string[] }

/** A wall's point u along it, the way along it and into the room, and the yaw that faces into the room. */
function frame(sh: Shell, w: Wall, u: number): { p: V2; t: V2; n: V2; yaw: number } {
  if (w === "back") return { p: [u, 0], t: [1, 0], n: [0, 1], yaw: 0 };
  if (w === "front") return { p: [sh.l - u, sh.d], t: [-1, 0], n: [0, -1], yaw: Math.PI };
  if (w === "left") return { p: [0, sh.d - u], t: [0, -1], n: [1, 0], yaw: Math.PI / 2 };
  return { p: [sh.l, u], t: [0, 1], n: [-1, 0], yaw: -Math.PI / 2 };
}
const lenOf = (sh: Shell, w: Wall) => (w === "back" || w === "front" ? sh.l : sh.d);
/** A piece's floor rect from its centre, its own width (x) and depth (z) and its yaw. */
function rectOf(c: V2, w: number, d: number, yaw: number): Rect {
  const q = Math.abs(Math.sin(yaw)) > 0.7, X = q ? d : w, Z = q ? w : d;
  return [c[0] - X / 2, c[1] - Z / 2, c[0] + X / 2, c[1] + Z / 2];
}
/** A rect given in a wall's frame (x along it from the point, z out from the wall) in the room. */
function wallRect(f: ReturnType<typeof frame>, x0: number, x1: number, z0: number, z1: number): Rect {
  const a: V2 = [f.p[0] + f.t[0] * x0 + f.n[0] * z0, f.p[1] + f.t[1] * x0 + f.n[1] * z0];
  const b: V2 = [f.p[0] + f.t[0] * x1 + f.n[0] * z1, f.p[1] + f.t[1] * x1 + f.n[1] * z1];
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}
const at = (f: ReturnType<typeof frame>, x: number, z: number): V2 => [f.p[0] + f.t[0] * x + f.n[0] * z, f.p[1] + f.t[1] * x + f.n[1] * z];

/** Can a walker get from a door to each target? A 10 cm grid; a cell is open when no piece comes within 0.2 m of it. */
function walkable(sh: Shell, pieces: Rect[], starts: V2[], targets: V2[]): boolean {
  if (!starts.length || !targets.length) return true;
  const c = 0.1, nx = Math.max(1, Math.ceil(sh.l / c)), nz = Math.max(1, Math.ceil(sh.d / c)), r = 0.2;
  const shut = new Uint8Array(nx * nz);
  for (const p of pieces) {
    const i0 = Math.max(0, Math.floor((p[0] - r) / c)), i1 = Math.min(nx - 1, Math.floor((p[2] + r) / c));
    const k0 = Math.max(0, Math.floor((p[1] - r) / c)), k1 = Math.min(nz - 1, Math.floor((p[3] + r) / c));
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) shut[k * nx + i] = 1;
  }
  const cell = (q: V2) => [Math.min(nx - 1, Math.max(0, Math.floor(q[0] / c))), Math.min(nz - 1, Math.max(0, Math.floor(q[1] / c)))];
  const seen = new Uint8Array(nx * nz), queue: number[] = [];
  for (const s of starts) { const [i, k] = cell(s); if (!shut[k * nx + i] && !seen[k * nx + i]) { seen[k * nx + i] = 1; queue.push(k * nx + i); } }
  for (let h = 0; h < queue.length; h++) {
    const j = queue[h], i = j % nx, k = (j - i) / nx;
    for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = k + dk;
      if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const m = b * nx + a;
      if (!seen[m] && !shut[m]) { seen[m] = 1; queue.push(m); }
    }
  }
  // a target is reached when an open cell within 0.15 m of it was
  return targets.every((t) => {
    const [i, k] = cell(t);
    for (let dk = -2; dk <= 2; dk++) for (let di = -2; di <= 2; di++) { const a = i + di, b = k + dk; if (a >= 0 && b >= 0 && a < nx && b < nz && seen[b * nx + a]) return true; }
    return false;
  });
}

/** What the last layout left out (the props dump prints it: compositions/city-rooms.tsx SHOT-props). */
export const lastLeft: string[] = [];
export function layout(o: LayoutIn): LayoutOut {
  const { sh, seed } = o, R = (k: number, j = 0, m = 0) => hash(seed, k, j, 303 + m);
  const opens = sh.openings ?? [], wins = opens.filter((x) => x.kind === "window");
  const doors = opens.filter((x) => x.kind === "door" || ((x.kind === "hole" || x.kind === "arch") && x.y < 0.05 && x.h > 1.7));
  const starts = doors.map((d) => { const f = frame(sh, d.wall, d.u); return at(f, 0, 0.45); });
  const placed: Piece[] = [], targets: V2[] = [], left: string[] = [];
  const pool = o.props.slice();
  const take = (items: string[]) => { const i = pool.findIndex((p) => def(p)!.items.some((it) => items.includes(it)) && def(p)!.place !== "on"); return i >= 0 ? pool.splice(i, 1)[0] : null; };
  const clear = (r: Rect) => r[0] >= -1e-3 && r[1] >= -1e-3 && r[2] <= sh.l + 1e-3 && r[3] <= sh.d + 1e-3 && !placed.some((p) => hit(p.fp, r)) && !o.keep.some((k) => hit(k, r));
  const underWindow = (w: Wall, u0: number, u1: number, ht: number) => (w === "front" && !!sh.slope && ht > sh.slope.knee) || wins.some((x) => x.wall === w && x.u + x.w / 2 + 0.05 > u0 && x.u - x.w / 2 - 0.05 < u1 && ht > x.y - 0.05);
  const nearDoor = (c: V2) => Math.min(9, ...doors.map((d) => { const f = frame(sh, d.wall, d.u); return Math.hypot(f.p[0] - c[0], f.p[1] - c[1]); }));
  const longWall = (w: Wall) => lenOf(sh, w) >= Math.max(sh.l, sh.d) - 0.05;

  /** Try a group: its anchor (a prop) and the pieces that come with it, on every wall; true when placed. */
  const place = (g: GroupDef, anchor: string, members: { m: Member; prop: string }[], k: number): boolean => {
    const [W, H, D] = def(anchor)!.size;
    type Cand = { w: Wall; u: number; s: Stand; gap: number; score: number };
    const cands: Cand[] = [];
    for (const w of WALLS) {
      const L = lenOf(sh, w), wallWins = wins.filter((x) => x.wall === w), wallDoors = doors.filter((x) => x.wall === w);
      for (const s of g.stand) {
        const E = s === "side" ? D : W;
        if (E + 0.04 > L) continue;
        const us: number[] = [];
        if (s === "corner") us.push(E / 2 + 0.02, L - E / 2 - 0.02);
        else for (let u = E / 2 + 0.02; u <= L - E / 2 - 0.02 + 1e-6; u += 0.1) us.push(u);
        for (const gap of s === "free" ? g.gaps ?? [0.3] : [0]) for (const u of us) {
          let score = 0;
          (g.likes ?? []).forEach((like, i) => {
            const wt = 1 / (i + 1);
            if (like === "window" && wallWins.length) score += wt * (1 + (1 - Math.min(1, Math.min(...wallWins.map((x) => Math.abs(x.u - u))) / 2)));
            else if (like === "inner" && !wallWins.length) score += wt;
            else if (like === "door" && wallDoors.length) score += wt;
            else if (like === "nodoor" && !wallDoors.length) score += wt;
            else if (like === "long" && longWall(w)) score += wt;
            else if (like === "pier" && wallWins.length >= 2 && wallWins.some((a) => a.u < u) && wallWins.some((b) => b.u > u)) score += wt * 1.5;
          });
          const f = frame(sh, w, u), c = at(f, 0, (s === "side" ? W : D) / 2 + gap);
          if (g.door) score += g.door * (1.5 - Math.min(1.5, nearDoor(c)));
          // a corner piece has a wall at its side too: a stove or a wardrobe never against the window's reveal
          if (s === "corner" && H > 1.2) {
            const end = frame(sh, w, u < L / 2 ? 0 : L).p;
            if (wins.some((x) => x.wall !== w && Math.hypot(frame(sh, x.wall, x.u).p[0] - end[0], frame(sh, x.wall, x.u).p[1] - end[1]) < x.w / 2 + 0.7)) score -= 2.5;
          }
          // the second bed beside the first (the parents' pair), the next along the same wall
          if (g.id === "bed") for (const p of placed) if (def(p.prop)!.items.some((it) => g.anchor.includes(it))) { const fp = s === "side" ? wallRect(f, -D / 2, D / 2, 0, W) : wallRect(f, -W / 2, W / 2, 0, D); if (hit([fp[0] - 0.06, fp[1] - 0.06, fp[2] + 0.06, fp[3] + 0.06], p.fp)) score += 1.2; }
          if (o.frontLast && w === "front") score -= 3;
          score += R(k, Math.round(u * 10) + WI[w] * 1000, 1) * 0.6;
          cands.push({ w, u, s, gap, score });
        }
      }
    }
    cands.sort((a, b) => b.score - a.score);
    for (const cd of cands.slice(0, 220)) {
      const f = frame(sh, cd.w, cd.u), side = cd.s === "side", E = side ? D : W, Dp = side ? W : D;
      const yaw = f.yaw + (side ? Math.PI / 2 : 0);
      const fp = wallRect(f, -E / 2, E / 2, cd.gap, cd.gap + Dp);
      if (!clear(fp)) continue;
      if (cd.s !== "free" && underWindow(cd.w, cd.u - E / 2, cd.u + E / 2, H)) continue;
      const mine: Piece[] = [{ prop: anchor, c: at(f, 0, cd.gap + Dp / 2), y: 0, yaw, fp, h: H }];
      const fits = (r: Rect) => clear(r) && !mine.some((p) => hit(p.fp, r));
      // the floor its use needs: before it, or beside a bed standing head to the wall (either side)
      const uses: Rect[][] = !g.use ? [[]] : cd.s === "head" ? [[wallRect(f, E / 2, E / 2 + g.use, 0.3, Dp)], [wallRect(f, -E / 2 - g.use, -E / 2, 0.3, Dp)]] : [[wallRect(f, -E / 2, E / 2, cd.gap + Dp, cd.gap + Dp + g.use)]];
      const use = uses.find((us) => us.every((r) => r[0] >= -1e-3 && r[1] >= -1e-3 && r[2] <= sh.l + 1e-3 && r[3] <= sh.d + 1e-3 && !placed.some((p) => hit(p.fp, r))));
      if (!use) continue;
      // what the chairs go round, and its middle's distance from the wall: a free table or the kitchen table itself, or
      // the table set before the sofa
      let ok = true, around: { p: Piece; z: number; w: number; d: number } | null = cd.s === "free" || g.id === "kitchen-table" ? { p: mine[0], z: cd.gap + Dp / 2, w: W, d: D } : null;
      for (const { m, prop } of members) {
        const [mw, mh, md] = def(prop)!.size;
        if (m.at === "beside") {
          const gp = m.gap ?? 0.05, z = cd.gap + md / 2 + (cd.s === "free" ? 0 : 0.01);
          const spot = [1, -1].map((sg) => sg * (E / 2 + gp + mw / 2)).map((x) => ({ x, r: wallRect(f, x - mw / 2, x + mw / 2, z - md / 2, z + md / 2) })).find((q) => fits(q.r) && !underWindow(cd.w, cd.u + q.x - mw / 2, cd.u + q.x + mw / 2, mh));
          if (spot) mine.push({ prop, c: at(f, spot.x, z), y: 0, yaw: f.yaw, fp: spot.r, h: mh });
        } else if (m.at === "front") {
          const z = cd.gap + Dp + m.gap + md / 2, r = wallRect(f, -mw / 2, mw / 2, z - md / 2, z + md / 2);
          if (!fits(r)) { ok = false; break; }
          const p = { prop, c: at(f, 0, z), y: 0, yaw: f.yaw, fp: r, h: mh };
          mine.push(p); around = { p, z, w: mw, d: md };
        } else if (m.at === "foot") {
          const spots = [[E / 2 + 0.05 + mw / 2, Dp - md / 2], [-E / 2 - 0.05 - mw / 2, Dp - md / 2], [0, Dp + 0.05 + md / 2]];
          for (const [x, z] of spots) { const r = wallRect(f, x - mw / 2, x + mw / 2, z - md / 2, z + md / 2); if (fits(r)) { mine.push({ prop, c: at(f, x, z), y: 0, yaw: f.yaw, fp: r, h: mh }); break; } }
        } else if (m.at === "around" && around) {
          // the chairs on the target's open sides: the room's side first, then its ends; never its wall side or
          // against the sofa (the side toward the wall in the wall's frame)
          // a chair's seat front at the table's edge; at an end it is turned, so its depth runs along the wall
          const { w: tw, d: td, z: tz } = around, e = 0.01;
          const sides: [number, number, boolean][] = [[0, tz + td / 2 + md / 2 + e, false], [-(tw / 2 + md / 2 + e), tz, true], [tw / 2 + md / 2 + e, tz, true]];
          if (cd.s === "free" && cd.gap >= 0.45) sides.push([0, tz - td / 2 - md / 2 - e, false]);
          let n = 0;
          for (const [x, z, turned] of sides) {
            if (n >= m.n) break;
            const hx = (turned ? md : mw) / 2, hz = (turned ? mw : md) / 2;
            const r = wallRect(f, x - hx, x + hx, z - hz, z + hz);
            if (!fits(r)) continue;
            // a chair faces the table: its own +z toward the table's middle
            const cw = at(f, x, z), tc = at(f, 0, tz);
            mine.push({ prop, c: cw, y: 0, yaw: Math.atan2(tc[0] - cw[0], tc[1] - cw[1]), fp: r, h: mh }); n++;
          }
        }
      }
      if (!ok) continue;
      const tgt: V2[] = use.map((r) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2]);
      // a table's use: the chairs' backs, at least one reachable (or the table's room side when it has none)
      const chairs = mine.filter((p) => p !== mine[0] && def(p.prop)!.place === "floor" && !def(p.prop)!.items.some((it) => it === "cradle"));
      // (the floor behind a chair, where one stands to pull it out: its own middle is never open floor)
      const tableTgt: V2[] = around && chairs.length ? chairs.slice(0, 1).map((ch) => { const tc = around!.p.c, dx = ch.c[0] - tc[0], dz = ch.c[1] - tc[1], n = Math.hypot(dx, dz) || 1; return [ch.c[0] + (dx / n) * 0.45, ch.c[1] + (dz / n) * 0.45] as V2; }) : [];
      if (!walkable(sh, [...placed.map((p) => p.fp), ...mine.map((p) => p.fp)], starts, [...targets, ...tgt, ...tableTgt])) continue;
      placed.push(...mine); targets.push(...tgt, ...tableTgt);
      return true;
    }
    return false;
  };
  const WI: Record<Wall, number> = { back: 1, left: 2, right: 3, front: 4 };

  // the groups by rank, each anchor the room has; then each piece no group took, alone on a wall
  let k = 0;
  for (const g of [...GROUPS].sort((a, b) => a.rank - b.rank)) {
    for (let anchor = take(g.anchor); anchor; anchor = take(g.anchor)) {
      const members: { m: Member; prop: string }[] = [];
      for (const m of g.with ?? []) {
        const n = m.at === "around" ? m.n : 1;
        for (let i = 0; i < n; i++) {
          const p = take(m.items) ?? (m.at === "around" && m.bring ? m.items.map((it) => o.propFor(it)).find((x) => !!x) ?? null : null);
          if (p) members.push({ m, prop: p });
          if (!p) break;
        }
      }
      // one 'around' entry per chair: the place step reads the first and its n
      const seen = new Set<Member>(), ms = members.filter((x) => (x.m.at !== "around" ? true : seen.has(x.m) ? false : (seen.add(x.m), true)));
      k++;
      if (place(g, anchor, ms, k)) continue;
      // no room with its table and chairs: the anchor alone (its table back in the pool, to stand at the window on its
      // own); else it is left out
      const bare = ms.filter((x) => x.m.at === "beside" || x.m.at === "foot");
      for (const x of ms) if (x.m.at === "front") pool.push(x.prop);
      if (place(g, anchor, bare, k + 500)) continue;
      left.push(anchor);
    }
  }
  const loose: GroupDef = { id: "loose", anchor: [], stand: ["wall"], use: 0.35, rank: 99 };
  for (const p of pool.filter((x) => def(x)!.place !== "on")) {
    k++;
    const d = def(p)!;
    if (d.items.includes("rug")) continue; // the rug lies under the table or by a bed: below
    if (!place({ ...loose, stand: d.place === "corner" ? ["corner", "wall"] : ["wall"] }, p, [], k)) left.push(p);
  }
  // the rug: by the first bed's side, else before the sofa
  const rug = pool.find((x) => def(x)!.items.includes("rug"));
  const out: Place[] = placed.map((p) => ({ prop: p.prop, at: [p.c[0], p.y, p.c[1]], yaw: p.yaw }));
  if (rug) {
    const host = placed.find((p) => /^bed-/.test(p.prop)) ?? placed.find((p) => /sofa/.test(p.prop));
    if (host) out.push({ prop: rug, at: [host.c[0] + Math.sin(host.yaw) * 0.0, 0.002, host.c[1]], yaw: host.yaw + Math.PI / 2 });
  }

  // what sits on things: packed on its host's top, no two overlapping, as many as the clutter dial allows
  const onTop = new Map<Piece, Rect[]>();
  const cap = (p: Piece) => (/table|desk/.test(p.prop) ? 1 + Math.round(2 * o.clutter) : 2 + Math.round(3 * o.clutter));
  pool.filter((x) => def(x)!.place === "on").forEach((id, j) => {
    const d = def(id)!, hosts = d.items.map((it) => ON[it]).find((x) => !!x) ?? ["table-round", "kitchen-table", "chest-drawers", "vertiko", "washstand"];
    for (const hi of hosts) {
      const hostP = placed.filter((p) => def(p.prop)!.items.includes(hi) || p.prop === hi);
      for (const hp of hostP) {
        const have = onTop.get(hp) ?? [];
        if (have.length >= cap(hp)) continue;
        const hs = def(hp.prop)!.size, top = TOPS[hp.prop], r = top?.r ?? [-hs[0] / 2 + 0.04, -hs[2] / 2 + 0.04, hs[0] / 2 - 0.04, hs[2] / 2 - 0.04];
        const [iw, , idp] = d.size;
        if (iw > r[2] - r[0] || idp > r[3] - r[1]) continue;
        for (let t = 0; t < 14; t++) {
          const x = r[0] + iw / 2 + R(40 + j, t, 2) * (r[2] - r[0] - iw), z = r[1] + idp / 2 + R(60 + j, t, 3) * (r[3] - r[1] - idp);
          const q: Rect = [x - iw / 2, z - idp / 2, x + iw / 2, z + idp / 2];
          if (have.some((h) => hit([h[0] - 0.02, h[1] - 0.02, h[2] + 0.02, h[3] + 0.02], q))) continue;
          have.push(q); onTop.set(hp, have);
          const c = Math.cos(hp.yaw), s = Math.sin(hp.yaw);
          out.push({ prop: id, at: [hp.c[0] + c * x + s * z, hp.y + (top?.y ?? hs[1]), hp.c[1] - s * x + c * z], yaw: hp.yaw });
          return;
        }
      }
    }
  });
  lastLeft.length = 0; lastLeft.push(...left);
  const tbl = placed.find((p) => def(p.prop)!.items.includes("table-round") || p.prop === "kitchen-table" || p.prop === "partners-desk");
  return { places: out, tall: placed.map((p) => ({ fp: p.fp, h: p.h })), table: tbl ? { at: [tbl.c[0], 0, tbl.c[1]], top: def(tbl.prop)!.size[1] } : null, left };
}
