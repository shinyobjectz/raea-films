// Raster helpers for the map tools: read any image as raw RGB through ImageMagick, write masks, and fill polygons
// (EPSG:25833 metres) into a tile's pixel grid. A tile's grid is north-up: pixel (0,0) is the top-left corner (x0, y1).

export type Tile = { id: string; x0: number; y0: number; x1: number; y1: number; mpp: number };
export const size = (t: Tile) => ({ w: Math.round((t.x1 - t.x0) / t.mpp), h: Math.round((t.y1 - t.y0) / t.mpp) });

/** Every pixel as RGB bytes, resampled to w x h if given. */
export async function readRGB(path: string, w?: number, h?: number): Promise<{ w: number; h: number; px: Uint8Array }> {
  const args = ["magick", path, "-alpha", "off", "-colorspace", "sRGB", ...(process.env.MAP_PREFILTER ? process.env.MAP_PREFILTER.split(" ") : [])];
  if (w && h) args.push("-resize", `${w}x${h}!`);
  args.push("-depth", "8", "rgb:-");
  const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
  const px = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
  if ((await proc.exited) !== 0) throw new Error(`magick failed on ${path}: ${await new Response(proc.stderr).text()}`);
  if (!w || !h) {
    const id = Bun.spawnSync(["magick", "identify", "-format", "%w %h", path]).stdout.toString().split(" ").map(Number);
    [w, h] = id;
  }
  if (px.length !== w! * h! * 3) throw new Error(`${path}: got ${px.length} bytes for ${w}x${h}`);
  return { w: w!, h: h!, px };
}

/** A one-byte-per-pixel raster as a PNG (values as given, e.g. 0/255 masks or class ids). */
export async function writeGray(path: string, w: number, h: number, v: Uint8Array) {
  const proc = Bun.spawn(["magick", "-size", `${w}x${h}`, "-depth", "8", "gray:-", path], { stdin: "pipe" });
  proc.stdin.write(v);
  await proc.stdin.end();
  if ((await proc.exited) !== 0) throw new Error(`magick could not write ${path}`);
}

/** A mask as a PBM for potrace: 1 (black) where v is non-zero. */
export async function writePBM(path: string, w: number, h: number, v: Uint8Array) {
  const row = Math.ceil(w / 8);
  const out = new Uint8Array(row * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) if (v[y * w + x]) out[y * row + (x >> 3)] |= 0x80 >> (x & 7);
  await Bun.write(path, new Blob([`P4\n${w} ${h}\n`, out]));
}

type Ring = number[][];
type Geom = { type: string; coordinates: any };

/** The polygons of a GeoJSON geometry as lists of rings (outer first). */
export function polygons(g: Geom | null): Ring[][] {
  if (!g) return [];
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  return [];
}

/**
 * Fills polygons into `into` with `value` (even-odd per polygon, so holes stay empty), sampling at pixel centres.
 * Pixels already set are overwritten, so fill lower-priority classes first.
 */
export function fill(into: Uint8Array | Int32Array, t: Tile, polys: Ring[][], value: number) {
  const { w, h } = size(t);
  for (const rings of polys) {
    // Edges in pixel space.
    const edges: [number, number, number, number][] = [];
    let minY = Infinity, maxY = -Infinity;
    for (const r of rings)
      for (let i = 0; i + 1 < r.length; i++) {
        const ax = (r[i][0] - t.x0) / t.mpp, ay = (t.y1 - r[i][1]) / t.mpp;
        const bx = (r[i + 1][0] - t.x0) / t.mpp, by = (t.y1 - r[i + 1][1]) / t.mpp;
        if (ay === by) continue;
        edges.push([ax, ay, bx, by]);
        minY = Math.min(minY, ay, by);
        maxY = Math.max(maxY, ay, by);
      }
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(h - 1, Math.ceil(maxY));
    const xs: number[] = [];
    for (let y = y0; y <= y1; y++) {
      const cy = y + 0.5;
      xs.length = 0;
      for (const [ax, ay, bx, by] of edges)
        if ((ay <= cy && by > cy) || (by <= cy && ay > cy)) xs.push(ax + ((cy - ay) / (by - ay)) * (bx - ax));
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
        for (let x = a; x <= b; x++) into[y * w + x] = value;
      }
    }
  }
}

/** Tiles of a slice, as tiles.sh prints them. */
export async function tiles(slicePath: string, mpp: number): Promise<Tile[]> {
  const s = await Bun.file(slicePath).json();
  const [X0, Y0, X1, Y1] = s.bbox, t = s.tile;
  const out: Tile[] = [];
  for (let y = Y0; y < Y1; y += t)
    for (let x = X0; x < X1; x += t) out.push({ id: `${x / 100}_${y / 100}`, x0: x, y0: y, x1: x + t, y1: y + t, mpp });
  return out;
}

/** One channel per pixel after an ImageMagick operator chain, e.g. ["-colorspace", "Gray", "-morphology", "BottomHat", "Disk:3"]. */
export async function readGray(path: string, ops: string[]): Promise<{ w: number; h: number; px: Uint8Array }> {
  const proc = Bun.spawn(["magick", path, "-alpha", "off", ...ops, "-colorspace", "Gray", "-depth", "8", "gray:-"], { stdout: "pipe", stderr: "pipe" });
  const px = new Uint8Array(await new Response(proc.stdout).arrayBuffer());
  if ((await proc.exited) !== 0) throw new Error(`magick failed on ${path}: ${await new Response(proc.stderr).text()}`);
  const [w, h] = Bun.spawnSync(["magick", "identify", "-format", "%w %h", path]).stdout.toString().split(" ").map(Number);
  return { w, h, px };
}
