// The 1917 street-level ground of a slice (ground1917.ts writes it): a 2 m grid of cell centres, north up, read with
// a bilinear sample. Shared by the builders that stand things on the ground or dig under it (graybox.ts keeps its own
// copy for now).
export async function loadGround(map: string, cache: string) {
  const head = await Bun.file(`${map}/ground1917_2m.json`).json();
  const GW = head.width, GH = head.height, CELL = head.cell_m, [GX0, GY1] = head.origin_top_left;
  const ground = new Float32Array(await Bun.file(`${cache}/ground1917_2m.f32`).arrayBuffer());
  return function g(x: number, y: number): number {
    const cx = Math.min(GW - 1.001, Math.max(0, (x - GX0) / CELL - 0.5)), cy = Math.min(GH - 1.001, Math.max(0, (GY1 - y) / CELL - 0.5));
    const i = Math.floor(cx), j = Math.floor(cy), fx = cx - i, fy = cy - j, k = j * GW + i;
    return (ground[k] * (1 - fx) + ground[k + 1] * fx) * (1 - fy) + (ground[k + GW] * (1 - fx) + ground[k + GW + 1] * fx) * fy;
  };
}

/** Even-odd point in polygon over all rings (outer and holes) of each polygon. */
export function inPolys(x: number, y: number, polys: number[][][][]): boolean {
  for (const rings of polys) {
    let inside = false;
    for (const r of rings)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i], [xj, yj] = r[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
    if (inside) return true;
  }
  return false;
}

/** Street level at a point from the 1917 ground: the 60th percentile of the ground within 10 m (2.5 m steps). The
 * ground keeps the water surface (30-31 m) beside a bank and railway embankments beside a street; the highest value
 * would climb an embankment, the lowest would sink into the water, so take one between. */
export function streetLevel(g0: (x: number, y: number) => number) {
  const offs: number[][] = [];
  for (let dx = -10; dx <= 10; dx += 2.5) for (let dy = -10; dy <= 10; dy += 2.5) if (dx * dx + dy * dy <= 100) offs.push([dx, dy]);
  return (x: number, y: number) => { const v = offs.map(([dx, dy]) => g0(x + dx, y + dy)).sort((a, b) => a - b); return v[Math.floor(v.length * 0.6)]; };
}
