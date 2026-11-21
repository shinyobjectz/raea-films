// The shop signs' font atlas: every glyph of the four sign faces as a signed distance field in one grey PNG, with its
// metrics. A fascia's lettering is then one quad a glyph (interiors/signs/layout.ts) sampling this atlas, and a letter
// stays sharp from across the street to a close-up for about 1 MB on the GPU, the whole city's signs included.
// The faces (assets/fonts, OFL, licence beside each): a fat-face Antiqua (Abril Fatface), the most common shop lettering
// in the photographs; a condensed grotesque (League Gothic, after the 1903 Alternate Gothic), the grocers' and the
// tobacconists'; a bold Antiqua (Old Standard), the booksellers'; a Fraktur (UnifrakturMaguntia), the old trades'.
// Each glyph is drawn by ImageMagick 4x large, its exact distance transform taken (Felzenszwalb), and scaled down.
//   bun tools/signs/font.ts        writes assets/signs/font.png and assets/signs/font.json
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../.."), out = join(root, "assets/signs");
export const FACES = {
  fat: "AbrilFatface-Regular.ttf",
  grotesk: "LeagueGothic.ttf",
  antiqua: "OldStandard-Bold.ttf",
  fraktur: "UnifrakturMaguntia-Book.ttf",
} as const;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜabcdefghijklmnopqrstuvwxyzäöüß0123456789 .,&-'/:()\"·";
const PT = 64, UP = 4, SPREAD = 6; // final glyph size, the oversampling, the field's reach in final pixels
const W = 1024;

function sh(cmd: string[]): Uint8Array {
  const r = Bun.spawnSync(cmd);
  if (r.exitCode !== 0) throw new Error(`${cmd[0]} failed: ${r.stderr}`);
  return r.stdout;
}

/** Squared distance to the nearest set cell, one row or column (Felzenszwalb and Huttenlocher). */
function edt1(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) ** 2 + f[v[k]]; }
}
/** Distance from each cell to the nearest cell where `on` is true. */
function edt(on: Uint8Array, w: number, h: number): Float64Array {
  const INF = 1e20, g = new Float64Array(w * h), n = Math.max(w, h);
  const f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let i = 0; i < w * h; i++) g[i] = on[i] ? 0 : INF;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = g[y * w + x]; edt1(f, h, d, v, z); for (let y = 0; y < h; y++) g[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = g[y * w + x]; edt1(f, w, d, v, z); for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]); }
  return g;
}

type Glyph = { x: number; y: number; w: number; h: number; adv: number; it: number; ib: number };
type Cell = { face: string; ch: string; w: number; h: number; px: Uint8Array; it: number; ib: number };

/** One glyph as a field: w x h final pixels, the glyph's advance in the middle and SPREAD on every side. */
function glyph(face: string, ch: string): Cell {
  const font = join(root, "assets/fonts", FACES[face as keyof typeof FACES]), pad = SPREAD * UP;
  // label: sizes the canvas to the face's advance and its ascent plus descent, so every glyph of a face is as tall
  // a space can't be a label: its own cell, empty, as tall as an "n" and a quarter em wide
  const space = ch === " ", lab = space ? "n" : ch;
  const geo = new TextDecoder().decode(sh(["magick", "-background", "black", "-fill", "white", "-font", font, "-pointsize", String(PT * UP), `label:${lab}`, "-format", "%w %h", "info:"])).trim();
  let [gw, gh] = geo.split(" ").map(Number);
  if (space) gw = Math.round(PT * UP * 0.26);
  const raw = space
    ? new Uint8Array((gw + 2 * pad) * (gh + 2 * pad))
    : sh(["magick", "-background", "black", "-fill", "white", "-font", font, "-pointsize", String(PT * UP), `label:${lab}`, "-bordercolor", "black", "-border", String(pad), "-depth", "8", "gray:-"]);
  const w = gw + 2 * pad, h = gh + 2 * pad, ink = new Uint8Array(w * h), bg = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) { ink[i] = raw[i] >= 128 ? 1 : 0; bg[i] = 1 - ink[i]; }
  const toInk = edt(ink, w, h), toBg = edt(bg, w, h), field = new Uint8Array(w * h);
  // 0.5 on the outline, rising inside: in final pixels, SPREAD reaches 0 and 1
  for (let i = 0; i < w * h; i++) field[i] = Math.round(255 * Math.min(1, Math.max(0, 0.5 + (toBg[i] - toInk[i]) / (2 * pad))));
  // down to the final size through a temp file (the field averages well: a box filter keeps the outline at 0.5)
  const fw = Math.round(w / UP), fh = Math.round(h / UP), tmp = join(out, `.g-${process.pid}.gray`);
  writeFileSync(tmp, field);
  const small = sh(["magick", "-size", `${w}x${h}`, "-depth", "8", `gray:${tmp}`, "-filter", "box", "-resize", `${fw}x${fh}!`, "-depth", "8", "gray:-"]);
  // the ink's first and last rows (the field over a half), so a line is sized by its letters, not by the face's
  // ascent and descent: capitals fill a board, and a descender gets room only where there is one
  let it = fh, ib = 0;
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) if (small[j * fw + i] >= 128) { it = Math.min(it, j); ib = Math.max(ib, j + 1); }
  return { face, ch, w: fw, h: fh, px: small, it, ib };
}

if (import.meta.main) {
  mkdirSync(out, { recursive: true });
  const cells: Cell[] = [];
  for (const face of Object.keys(FACES)) for (const ch of CHARS) cells.push(glyph(face, ch));
  // shelf packing, a face's glyphs together (they share a height)
  const glyphs: Record<string, Record<string, Glyph>> = {}, lineH: Record<string, number> = {};
  let x = 0, y = 0, row = 0;
  const placed: [Cell, number, number][] = [];
  for (const c of cells) {
    if (x + c.w > W) { x = 0; y += row + 1; row = 0; }
    placed.push([c, x, y]);
    (glyphs[c.face] ??= {})[c.ch] = { x, y, w: c.w, h: c.h, adv: c.w - 2 * SPREAD, it: c.it, ib: c.ib };
    lineH[c.face] = c.h - 2 * SPREAD;
    x += c.w + 1; row = Math.max(row, c.h);
  }
  const H = y + row, atlas = new Uint8Array(W * H);
  for (const [c, cx, cy] of placed) for (let j = 0; j < c.h; j++) atlas.set(c.px.subarray(j * c.w, (j + 1) * c.w), (cy + j) * W + cx);
  const tmp = join(out, ".atlas.gray");
  await Bun.write(tmp, atlas);
  sh(["magick", "-size", `${W}x${H}`, "-depth", "8", `gray:${tmp}`, join(out, "font.png")]);
  rmSync(tmp);
  rmSync(join(out, `.g-${process.pid}.gray`), { force: true });
  await Bun.write(join(out, "font.json"), JSON.stringify({ size: [W, H], pt: PT, spread: SPREAD, lineH, glyphs }));
  console.log(`font atlas ${W}x${H}: ${cells.length} glyphs in ${Object.keys(FACES).length} faces`);
}
