// The classes of the land-use map "Berlin um 1910" (Städtebauliche Entwicklung Berlins; Geoportal WMS
// staedtebauliche_entwicklung, layer berlin_1910; dl-de/zero-2.0), per pixel. The map colours each block by its use
// (legend: WMS GetLegendGraphic) and lays a darker grey over public buildings (class + OVER). Each pixel, blurred
// 1 px, goes to the nearest colour sampled from the map itself (PROTO, CIE Lab, within MAXDE), else 0. The
// overprint on thin marks (lettering, parcel lines of the 1980-85 base map) is dropped: an overprint pixel counts
// only where a 5 x 5 px (2.5 m) square of overprint fits round it.
import { readRGB } from "./raster";

export const USES = ["", "residential", "mixed", "core", "industry", "special", "public", "military", "utility", "green", "rail", "water", "street"] as const;
export const STREET = 12, OVER = 16, W = 1000; // a 500 m tile at 0.5 m
const MAXDE = 22;

// [r, g, b, class (+16 under the public-building overprint)], sampled from the tiles (Leipziger Platz, Luisenstadt,
// the Potsdamer Bahnhof, the Gaswerk and others; the legend's printed swatches differ by up to 20 levels).
const PROTO: number[][] = [
  [229, 178, 172, 1], [229, 179, 183, 1], [211, 175, 175, 1], [207, 154, 155, 1], [144, 105, 111, 17], [174, 145, 143, 17],
  [206, 185, 145, 2], [199, 180, 143, 2], [203, 185, 151, 2], [154, 143, 107, 18],
  [174, 146, 88, 3], [162, 139, 80, 3], [177, 151, 94, 3], [101, 84, 53, 19], [140, 115, 79, 19],
  [184, 187, 182, 4], [158, 154, 158, 4], [177, 180, 185, 4], [179, 174, 177, 4], [166, 156, 149, 4],
  [239, 184, 129, 5], [229, 159, 98, 5],
  [219, 113, 177, 6], [228, 125, 192, 6], [127, 88, 112, 22], [115, 90, 95, 22], [83, 55, 63, 22],
  [199, 126, 169, 7], [167, 107, 140, 7],
  [251, 247, 123, 8],
  [219, 229, 151, 9], [202, 208, 146, 9],
  [198, 189, 226, 10], [211, 185, 209, 10], [210, 208, 221, 10], [116, 115, 120, 26], [122, 124, 132, 26],
  [191, 222, 246, 11], [187, 211, 235, 11],
  [240, 240, 241, 12], [241, 229, 172, 12], [239, 230, 168, 12], [231, 210, 120, 12],
];

function lab(r: number, g: number, b: number): [number, number, number] {
  const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047), y = f(0.2126 * R + 0.7152 * G + 0.0722 * B), z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
let LUT: Uint8Array | null = null;
/** Class per colour at 6 bits a channel. */
function lut() {
  if (LUT) return LUT;
  const P = PROTO.map(([r, g, b, c]) => [...lab(r, g, b), c]);
  LUT = new Uint8Array(1 << 18);
  for (let i = 0; i < LUT.length; i++) {
    const [L, A, B] = lab(((i >> 12) << 2) + 2, (((i >> 6) & 63) << 2) + 2, ((i & 63) << 2) + 2);
    let best = 0, bd = MAXDE * MAXDE;
    for (const [l, a, b, c] of P) {
      const d = (L - l) ** 2 + (A - a) ** 2 + (B - b) ** 2;
      if (d < bd) (bd = d), (best = c);
    }
    LUT[i] = best;
  }
  return LUT;
}

/** Min (erode) or max (dilate) over a (2r+1)^2 square, separably. */
function morph(m: Uint8Array, r: number, max: boolean) {
  const a = new Uint8Array(m.length), b = new Uint8Array(m.length);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    let v = max ? 0 : 1;
    for (let k = Math.max(0, x - r); k <= Math.min(W - 1, x + r); k++) v = max ? v | m[y * W + k] : v & m[y * W + k];
    a[y * W + x] = v;
  }
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    let v = max ? 0 : 1;
    for (let k = Math.max(0, y - r); k <= Math.min(W - 1, y + r); k++) v = max ? v | a[k * W + x] : v & a[k * W + x];
    b[y * W + x] = v;
  }
  return b;
}

/** The classes of one tile of the 1910 map (cache/<slice>/rasters/use1910/<id>.png), W x W. */
export async function classify(png: string): Promise<Uint8Array> {
  const L = lut();
  process.env.MAP_PREFILTER = "-blur 0x1";
  const { px } = await readRGB(png, W, W);
  delete process.env.MAP_PREFILTER;
  const cls = new Uint8Array(W * W);
  for (let i = 0; i < cls.length; i++) cls[i] = L[((px[i * 3] >> 2) << 12) | ((px[i * 3 + 1] >> 2) << 6) | (px[i * 3 + 2] >> 2)];
  const over = new Uint8Array(W * W);
  for (let i = 0; i < over.length; i++) over[i] = cls[i] & OVER ? 1 : 0;
  const kept = morph(morph(over, 2, false), 2, true);
  for (let i = 0; i < cls.length; i++) if (over[i] && !kept[i]) cls[i] = 0;
  return cls;
}
