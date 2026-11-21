// Moves a line traced off the plan across to the middle of the street it runs in: the plan's drawn line can sit metres
// off the street's axis (the Hochbahn's traced stretches ran along a kerb), while the viaduct stood over the street's
// middle (Gitschiner, Skalitzer, Bülowstrasse and Schönhauser Allee as photographed). At each sample the ground is
// walked both ways across the line to the first wall (a 1917 building or water, every sheet the line crosses: a median's
// planting is not a wall, nor a front garden, so a symmetric street centres on its carriageway); where both walls lie
// within REACH m and the street is WIDE m wide or less, the sample's shift is half their difference. A sample inside a
// wall starts from the nearest street up to STEP_OUT m across the line (Skalitzer Strasse's trace runs along its
// fronts). Where the first wall either way is water, the sample keeps its place: a quay, where the Hochbahn stood on
// the Landwehrkanal's bank (the Festschrift's photograph of Hallesches Ufer), not in the street's middle. Shifts over
// MAX m are left out (a square, a crossing), and the rest are a running median over SMOOTH m either side, so a side
// street opening on one side moves nothing. The line's own buildings held by stations.sh (a stair house, a station's
// base in the street's middle: storeys_from "station") are not the street's walls.
import { fill, polygons } from "./raster";

const MPP = 1, REACH = 45, WIDE = 60, MAX = 22, SMOOTH = 40, MARGIN = 80, STEP_OUT = 6;

export async function streetMiddle(lines: number[][][], sheets: { bbox: number[]; walls: string[]; water?: string[] }[], step: number) {
  const all = lines.flat();
  const X0 = Math.min(...all.map((p) => p[0])) - MARGIN, X1 = Math.max(...all.map((p) => p[0])) + MARGIN;
  const Y0 = Math.min(...all.map((p) => p[1])) - MARGIN, Y1 = Math.max(...all.map((p) => p[1])) + MARGIN;
  const W = Math.ceil((X1 - X0) / MPP), H = Math.ceil((Y1 - Y0) / MPP), r = new Uint8Array(W * H);
  const t = { id: "middle", x0: X0, y0: Y0, x1: X0 + W * MPP, y1: Y0 + H * MPP, mpp: MPP };
  for (const s of sheets) {
    const [a, b, c, d] = s.bbox;
    if (c < X0 || a > X1 || d < Y0 || b > Y1) continue;
    for (const [list, val] of [[s.walls, 1], [s.water ?? [], 2]] as const)
      for (const w of list) if (await Bun.file(w).exists())
        fill(r, t, ((await Bun.file(w).json()).features as any[]).filter((f) => f.properties?.storeys_from !== "station").flatMap((f) => polygons(f.geometry)), val);
  }
  const at = (x: number, y: number) => {
    const u = Math.floor((x - X0) / MPP), v = Math.floor((t.y1 - y) / MPP);
    return u >= 0 && v >= 0 && u < W && v < H ? r[v * W + u] : 255;
  };
  const street = (x: number, y: number) => at(x, y) === 0;
  let moved = 0, sum = 0, n = 0;
  const out = lines.map((pts) => {
    const shift = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
      // a sample on a wall's edge (the trace along a kerb, a front a metre out on the raster) starts from the nearest
      // street across the line, up to STEP_OUT m off, and its shift is measured from where it was
      let q = NaN;
      for (let o = 0; o <= STEP_OUT && Number.isNaN(q); o += 0.5) for (const s of [1, -1]) if (Number.isNaN(q) && street(p[0] + nx * o * s, p[1] + ny * o * s)) q = o * s;
      if (Number.isNaN(q)) return NaN;
      const x0 = p[0] + nx * q, y0 = p[1] + ny * q;
      const walk = (s: number) => { for (let d = 0.5; d <= REACH; d += 0.5) { const v = at(x0 + nx * d * s, y0 + ny * d * s); if (v === 2) return NaN; if (v) return d; } return NaN; };
      const dp = walk(1), dm = walk(-1), c = q + (dp - dm) / 2;
      return dp + dm <= WIDE && Math.abs(c) <= MAX ? c : NaN;
    });
    const k = Math.round(SMOOTH / step);
    return pts.map((p, i) => {
      const w = shift.slice(Math.max(0, i - k), i + k + 1).filter((v) => !Number.isNaN(v)).sort((x, y) => x - y);
      const c = w.length > k ? w[w.length >> 1] : 0; // most of the window must have read a street
      const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      n++, (sum += Math.abs(c)), Math.abs(c) > 1 && moved++;
      return [p[0] - ((b[1] - a[1]) / L) * c, p[1] + ((b[0] - a[0]) / L) * c];
    });
  });
  return { lines: out, report: `${moved} of ${n} samples moved over 1 m to the street's middle, mean shift ${(sum / Math.max(1, n)).toFixed(1)} m` };
}
