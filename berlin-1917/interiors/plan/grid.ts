// A building's floor on a grid: the footprint and everything round it (the streets, the courts, the neighbours)
// rasterised at 0.5 m in the building's own frame, so its walls run along the grid. interiors/plan/bands.ts reads the
// cells to find which walls face daylight, interiors/plan/flats.ts cuts the floor into stairs, flats and rooms.
// Pure TypeScript (no raea/3d), so Bun runs it in tools and raea at stream-in.
export type XY = [number, number];
export type Ring = XY[];
/** a polygon: its outer ring, then its holes */
export type Poly = Ring[];

/** What a cell holds. Buildings are 0 (the one being planned) and up; open ground is negative. */
export const STREET = -2, COURT = -3, GAP = -1;

/** The building's frame: x along its longest wall, the grid's axes; `c` its centroid in map metres (EPSG:25833). */
export interface Frame { c: XY; ang: number; cos: number; sin: number }

export function frameFor(outer: Ring): Frame {
  let best = 0, ang = 0, cx = 0, cy = 0;
  for (let i = 0; i + 1 < outer.length; i++) {
    const dx = outer[i + 1][0] - outer[i][0], dy = outer[i + 1][1] - outer[i][1], l = dx * dx + dy * dy;
    if (l > best) { best = l; ang = Math.atan2(dy, dx); }
    cx += outer[i][0]; cy += outer[i][1];
  }
  const q = Math.PI / 2;
  ang = ((ang % q) + q) % q;
  const n = Math.max(1, outer.length - 1);
  return { c: [cx / n, cy / n], ang, cos: Math.cos(ang), sin: Math.sin(ang) };
}
export const toLocal = (f: Frame, p: XY): XY => {
  const dx = p[0] - f.c[0], dy = p[1] - f.c[1];
  return [dx * f.cos + dy * f.sin, -dx * f.sin + dy * f.cos];
};
export const toWorld = (f: Frame, p: XY): XY => [f.c[0] + p[0] * f.cos - p[1] * f.sin, f.c[1] + p[0] * f.sin + p[1] * f.cos];

export interface Grid {
  /** cell size, metres */
  g: number;
  /** the corner of cell (0, 0) in the frame */
  x0: number; z0: number;
  nx: number; nz: number;
  /** per cell: STREET, COURT, GAP, or a building's index (0 = the planned one) */
  v: Int32Array;
}

export function gridAround(f: Frame, target: Poly, margin: number, g = 0.5): Grid {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const p of target[0]) {
    const [x, z] = toLocal(f, p);
    x0 = Math.min(x0, x); z0 = Math.min(z0, z); x1 = Math.max(x1, x); z1 = Math.max(z1, z);
  }
  x0 = Math.floor((x0 - margin) / g) * g; z0 = Math.floor((z0 - margin) / g) * g;
  const nx = Math.ceil((x1 + margin - x0) / g), nz = Math.ceil((z1 + margin - z0) / g);
  return { g, x0, z0, nx, nz, v: new Int32Array(nx * nz).fill(GAP) };
}

/** Fill a polygon's cells (by their centres, even-odd over all its rings) with `val`. */
export function fill(grid: Grid, f: Frame, poly: Poly, val: number) {
  const { g, x0, z0, nx, nz, v } = grid;
  const rings = poly.map((r) => r.map((p) => toLocal(f, p)));
  let zmin = Infinity, zmax = -Infinity;
  for (const r of rings) for (const [, z] of r) { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z); }
  const j0 = Math.max(0, Math.floor((zmin - z0) / g)), j1 = Math.min(nz - 1, Math.ceil((zmax - z0) / g));
  const xs: number[] = [];
  for (let j = j0; j <= j1; j++) {
    const zc = z0 + (j + 0.5) * g;
    xs.length = 0;
    for (const r of rings) for (let k = 0; k + 1 < r.length; k++) {
      const [ax, az] = r[k], [bx, bz] = r[k + 1];
      if ((az <= zc) !== (bz <= zc)) xs.push(ax + ((zc - az) / (bz - az)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil((xs[k] - x0) / g - 0.5)), i1 = Math.min(nx - 1, Math.floor((xs[k + 1] - x0) / g - 0.5));
      for (let i = i0; i <= i1; i++) v[j * nx + i] = val;
    }
  }
}

export const at = (grid: Grid, i: number, j: number) => (i < 0 || j < 0 || i >= grid.nx || j >= grid.nz ? GAP : grid.v[j * grid.nx + i]);
/** the four steps, outward: 0 -z, 1 +x, 2 +z, 3 -x */
export const STEP: XY[] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
