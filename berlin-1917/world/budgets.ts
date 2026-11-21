// The world's budgets, typed, so a bake or a scene that breaks one fails loudly (SOP §8). Numbers are targets for the
// 16 GB Mac at 1920x1080 and 60 fps live; a film render may exceed the per-frame ones, never the per-tile ones,
// because a film shot is a camera in the same city.

export const TILE_M = 250; // a surface tile's side, metres: a quarter of the map lane's 500 m tile
export const CELL_M = 64; // the floating-origin cell

export type Lod = 0 | 1 | 2;

/** Where each level of detail is drawn, from the camera to the tile's nearest edge, metres. */
export const LOD_RANGE: Record<Lod, [number, number]> = {
  0: [0, 120],
  1: [100, 700],
  2: [600, 6000],
};
/** Fraction of a range the camera must pass beyond its edge before a tile changes level (no flicker at the edge). */
export const HYSTERESIS = 0.1;

/** Per tile, per level: triangles and draws (one draw per material after merging). */
// Measured on the first bake (2026-11-17, Leipziger Straße tiles): LOD0 ~510k tris at ~84 bytes a triangle (f32
// position and normal, u8 colour, f32 uv, u32 index), most of it cornices, sills, surrounds and window frames. The
// per-tile byte limits follow from VIEW_BYTES below: what one camera holds at once, not what one tile weighs.
export const TILE_BUDGET: Record<Lod, { tris: number; draws: number; bytes: number }> = {
  0: { tris: 900_000, draws: 12, bytes: 56 * 1024 * 1024 },
  1: { tris: 100_000, draws: 6, bytes: 8 * 1024 * 1024 },
  2: { tris: 20_000, draws: 4, bytes: 1.6 * 1024 * 1024 },
};
/** Static city geometry one camera holds at once (vertex and index buffers), bytes. A street-level camera holds at
 *  most 4 tiles at LOD0 (120 m reaches 4 tiles from a tile's corner), about 30 at LOD1 (a 700 m disc over 250 m
 *  tiles) and the rest of the slice at LOD2; viewBytes() adds them up for a real camera. */
export const VIEW_BYTES = 640 * 1024 * 1024;
export function viewBytes(levels: { lod: Lod; bytes: number }[]): number {
  return levels.reduce((s, l) => s + l.bytes, 0);
}

/** Streaming (world/stream.ts): tiles loaded per frame at most, the keep radius as a multiple of the LOD2 range,
 *  frames beyond it before unload, and frames a level change draws both levels (the new one may still be loading). */
export const STREAM = { loadsPerFrame: 2, keepFactor: 1.15, unloadAfterFrames: 240 } as const;

/** Per frame on screen (live play). */
export const FRAME_BUDGET = {
  tris: 6_000_000,
  draws: 1_500,
  characters: { near: 40, middle: 400 }, // skinned near; unskinned agents middle (PLAN §4.6)
  shadowedPointLights: 2,
  fogVolumes: 1,
  fogSteps: 64,
} as const;

/** People: distances for each simulation level, metres (PLAN §4.6). */
export const PEOPLE_RANGE = { near: 150, middle: 1500 } as const;
/** People in a 250 m tile at its busiest hour, by its kind of place (targets for people/'s schedules). */
export const PEOPLE_PER_TILE = { mainAvenue: 250, sideStreet: 80, hinterhof: 15 } as const;

/** Props instanced per tile at most, by kind of place (SOP §5.3 densities are per 100 m of street front). */
export const PROPS_PER_TILE = 6_000;

export type BudgetReport = { lod: Lod; tris: number; draws: number; bytes: number };

/** Throws with every breach listed, so a bake stops on the first over-budget tile. */
export function checkTile(tile: string, reports: BudgetReport[]): void {
  const over = reports.flatMap((r) => {
    const b = TILE_BUDGET[r.lod];
    return (["tris", "draws", "bytes"] as const)
      .filter((k) => r[k] > b[k])
      .map((k) => `${tile} lod${r.lod} ${k} ${r[k]} > ${b[k]}`);
  });
  if (over.length) throw new Error(`over budget:\n  ${over.join("\n  ")}`);
}

/** The level a tile should draw at, given the level it draws at now (hysteresis keeps it there near an edge). */
export function lodFor(dist: number, current: Lod | null): Lod | null {
  const want = (d: number): Lod | null => (d < LOD_RANGE[0][1] ? 0 : d < LOD_RANGE[1][1] ? 1 : d < LOD_RANGE[2][1] ? 2 : null);
  if (current === null) return want(dist);
  const [lo, hi] = LOD_RANGE[current];
  const pad = (hi - lo) * HYSTERESIS;
  if (dist >= lo - pad && dist <= hi + pad) return current;
  return want(dist);
}
