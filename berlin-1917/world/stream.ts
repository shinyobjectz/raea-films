// The city's streamer (world/SOP.md §8): which tiles are loaded, at which level of detail, frame by frame, as a pure
// step over its own state, so live play keeps the state from frame to frame (useGameState) and a render replays it
// from frame 0 to the frame it draws (streamAt). City draws what the state holds.
//
//   - the camera's cell: 64 m (CELL_M), changed only when the eye is HYSTERESIS x CELL_M past the cell's edge, so a
//     camera wobbling on an edge doesn't flip cells;
//   - each tile's level from the cell's nearest point (so no point of the cell sees a tile coarser than its range asks),
//     with HYSTERESIS on the ranges: a tile keeps its level while within that range widened by HYSTERESIS, and takes
//     another only once inside it narrowed by HYSTERESIS;
//   - at most STREAM.loadsPerFrame loads a frame (a new tile, or a level change), nearest and finest first; until a
//     tile's turn it keeps the level it has, so the city never shows a hole where a tile was;
//   - a level change takes effect at once. City draws levels="detail" by default (detailList), where raea cross-fades
//     a tile's levels across their band, so the level being left fades out as the next fades in; with levels="lods"
//     (drawList) a tile is drawn at its one level and switches in a frame;
//   - a tile beyond every range stays loaded until it has been beyond STREAM.keepFactor x the LOD2 range for
//     STREAM.unloadAfterFrames frames.
import { CELL_M, HYSTERESIS, LOD_RANGE, STREAM, VIEW_BYTES, type Lod } from "./budgets";

export type StreamTile = { tile: string; bbox: number[]; lods: { lod: Lod; bytes?: number }[] };
/** A loaded tile: its level, and since when it has been beyond the keep radius (null while within it). */
export type Resident = { lod: Lod; outSince: number | null };
export type StreamState = {
  frame: number;
  /** the camera's cell, [i, j] in CELL_M units of easting and northing */
  cell: [number, number] | null;
  resident: Record<string, Resident>;
  /** what the last step did: loads (new or changed), unloads, and the loads still waiting for their turn */
  loads: string[];
  unloads: string[];
  waiting: number;
};

export const emptyStream = (): StreamState => ({ frame: -1, cell: null, resident: {}, loads: [], unloads: [], waiting: 0 });

/** The cell an eye at (e, n) is in, keeping `prev` while the eye is within its square widened by the hysteresis. */
export function cellOf(e: number, n: number, prev: [number, number] | null): [number, number] {
  if (prev) {
    const m = HYSTERESIS * CELL_M, x0 = prev[0] * CELL_M - m, y0 = prev[1] * CELL_M - m, x1 = (prev[0] + 1) * CELL_M + m, y1 = (prev[1] + 1) * CELL_M + m;
    if (e >= x0 && e < x1 && n >= y0 && n < y1) return prev;
  }
  return [Math.floor(e / CELL_M), Math.floor(n / CELL_M)];
}

/** The distance from a cell's square to a tile's box (0 when they meet), metres. */
export function cellDistance(cell: [number, number], bbox: number[]): number {
  const cx0 = cell[0] * CELL_M, cy0 = cell[1] * CELL_M, cx1 = cx0 + CELL_M, cy1 = cy0 + CELL_M;
  const dx = Math.max(bbox[0] - cx1, 0, cx0 - bbox[2]), dy = Math.max(bbox[1] - cy1, 0, cy0 - bbox[3]);
  return Math.hypot(dx, dy);
}

/** The level a tile `d` metres off wants, given the level it has (`cur`, null if none): with none, the finest whose
 *  range reaches `d` (null past LOD2's); with one, a finer level only once `d` is inside that level's reach less the
 *  hysteresis, and a coarser one only once `d` is past its own reach plus the hysteresis. `bias` scales distances
 *  (0.5 draws finer twice as far). A tile baked without a level draws its next coarser one. */
export function wantLod(d: number, cur: Lod | null, have: Lod[], bias = 1): Lod | null {
  const dd = d * bias, reach = (l: Lod) => LOD_RANGE[l][1];
  const natural = ([0, 1, 2] as Lod[]).find((l) => dd <= reach(l)) ?? null;
  let want: Lod | null = natural;
  if (cur !== null) {
    if (natural !== null && natural < cur) want = ([0, 1, 2] as Lod[]).find((l) => l < cur && dd <= reach(l) * (1 - HYSTERESIS)) ?? cur;
    else if (dd <= reach(cur) * (1 + HYSTERESIS)) want = cur;
  }
  if (want === null) return null;
  const got = have.filter((h) => h >= want);
  return got.length ? (Math.min(...got) as Lod) : null;
}

/** One frame of streaming: the state after the camera stood at (e, n) on frame `frame`. `warm` loads without the
 *  per-frame limit (a loading screen, a render's first frame). */
export function step(s: StreamState, tiles: StreamTile[], e: number, n: number, frame: number, opts: { bias?: number; warm?: boolean } = {}): StreamState {
  const bias = opts.bias ?? 1;
  const cell = cellOf(e, n, s.cell);
  const keep = LOD_RANGE[2][1] * STREAM.keepFactor;
  const resident: Record<string, Resident> = {};
  const changes: { tile: string; lod: Lod; d: number }[] = [];
  const unloads: string[] = [];
  for (const t of tiles) {
    const d = cellDistance(cell, t.bbox), was: Resident | undefined = s.resident[t.tile];
    const want = wantLod(d, was?.lod ?? null, t.lods.map((l) => l.lod), bias);
    if (was) {
      if (want === null) {
        // beyond every range: kept until beyond the keep radius for long enough
        const out = d * bias > keep ? (was.outSince ?? frame) : null;
        if (out !== null && frame - out >= STREAM.unloadAfterFrames) unloads.push(t.tile);
        else resident[t.tile] = { ...was, outSince: out };
        continue;
      }
      resident[t.tile] = { ...was, outSince: null };
      if (want !== was.lod) changes.push({ tile: t.tile, lod: want, d });
    } else if (want !== null) changes.push({ tile: t.tile, lod: want, d });
  }
  // nearest first, and of two at one distance the finer
  changes.sort((a, b) => a.d - b.d || a.lod - b.lod);
  const n0 = opts.warm ? changes.length : Math.min(STREAM.loadsPerFrame, changes.length);
  const loads: string[] = [];
  for (const c of changes.slice(0, n0)) {
    resident[c.tile] = { lod: c.lod, outSince: null };
    loads.push(c.tile);
  }
  return { frame, cell, resident, loads, unloads, waiting: changes.length - n0 };
}

/** What to draw with City levels="lods": each loaded tile at its level. */
export function drawList(s: StreamState): { tile: string; lod: Lod }[] {
  return Object.entries(s.resident).map(([tile, r]) => ({ tile, lod: r.lod }));
}

/** A box, [x0, y0, z0, x1, y1, z1]: what raea measures a held level's distance to (Detail's box). */
export type Box = [number, number, number, number, number, number];
/** How far `p` is from the box: 0 inside it. raea-sys-lod measures a part with a box exactly so. */
export function boxDistance(p: [number, number, number], b: Box): number {
  return Math.hypot(Math.max(b[0] - p[0], 0, p[0] - b[3]), Math.max(b[1] - p[1], 0, p[1] - b[4]), Math.max(b[2] - p[2], 0, p[2] - b[5]));
}

export type Held = { tile: string; lod: Lod; near: number; far: number };
/** The levels a tile at distance `d` holds for City levels="detail": each with its range (a level ends where the next
 *  starts, at `ends`; a tile baked without a level draws its next one over that level's range too), held while `d` is
 *  in that range widened by `hold` of each edge's distance. With `hold` past the fade's own half-band, a level is held
 *  before raea starts to draw it (time to load, live) and kept until raea has faded it out. */
export function heldLevels(tile: string, d: number, have: Lod[], ends: number[], hold: number, keep: Lod | null = null): Held[] {
  const out: Held[] = [];
  have.forEach((lod, i) => {
    const near = i === 0 ? 0 : ends[have[i - 1]!]!, far = ends[lod]!;
    if (lod === keep || (d <= far * (1 + hold) && d >= near * (1 - hold))) out.push({ tile, lod, near, far });
  });
  return out;
}

/** What to draw with City levels="detail", where raea cross-fades each level by its distance (raea-sys-lod's Detail):
 *  each loaded tile at its streamed level, and any level heldLevels holds at the tile's distance `dist(t)` (City's: to
 *  the tile's box, as raea measures it), so both levels are there while one fades into the other. Only the band adds a
 *  level, never a neighbouring cell's want, and it loads at once; a new tile still waits its turn (loadsPerFrame).
 *  `ends` are the levels' far ends, metres (LOD_RANGE's over the bias). */
export function detailList(s: StreamState, tiles: StreamTile[], dist: (t: StreamTile) => number, ends: number[], hold: number, maxLod: Lod = 2): Held[] {
  const by = new Map(tiles.map((t) => [t.tile, t]));
  const out: Held[] = [];
  for (const [tile, r] of Object.entries(s.resident)) {
    const t = by.get(tile);
    if (!t) continue;
    const have = t.lods.map((l) => l.lod).filter((l) => l <= maxLod).sort((a, b) => a - b);
    out.push(...heldLevels(tile, dist(t), have, ends, hold, r.lod));
  }
  return out;
}

/** The geometry the state holds, bytes, by the tiles' baked sizes; and whether it is within VIEW_BYTES. */
export function residentBytes(s: StreamState, tiles: StreamTile[]): { bytes: number; within: boolean } {
  const by = new Map(tiles.map((t) => [t.tile, t]));
  let bytes = 0;
  for (const d of drawList(s)) bytes += by.get(d.tile)?.lods.find((l) => l.lod === d.lod)?.bytes ?? 0;
  return { bytes, within: bytes <= VIEW_BYTES };
}

/** The state on frame `f` of a render whose camera stands at `eyeAt(frame)` (e, n), replayed from frame 0 (warm);
 *  the last state is kept, so frames rendered in order step once each. */
export function streamAt(key: string, tiles: StreamTile[], eyeAt: (frame: number) => [number, number], f: number, bias = 1): StreamState {
  const c = REPLAY.get(key);
  let s = c && c.frame <= f ? c : step(emptyStream(), tiles, ...eyeAt(0), 0, { bias, warm: true });
  while (s.frame < f) s = step(s, tiles, ...eyeAt(s.frame + 1), s.frame + 1, { bias });
  REPLAY.set(key, s);
  return s;
}
const REPLAY = new Map<string, StreamState>();
