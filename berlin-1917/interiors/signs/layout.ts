// A sign's lettering as quads, one a glyph, on a fascia of w x h metres: each quad samples the font atlas
// (tools/signs/font.ts: assets/signs/font.png and font.json). The lines are centred and as tall as the board allows; a
// line too long for it is condensed first, up to 28% as a sign painter would, and only then made smaller. Pure data
// (no raea imports): the world lane's facade builder pushes these quads into its tiles, a composition into a BufferMesh.
import type { Face, Sign } from "./text";

/** A glyph's cell in the atlas (x, y, w, h, the field's SPREAD on every side), its advance, and its ink's first and
 *  last rows in the cell (it, ib; equal for a space). */
export type Glyph = { x: number; y: number; w: number; h: number; adv: number; it: number; ib: number };
export type FontAtlas = { size: [number, number]; pt: number; spread: number; lineH: Record<Face, number>; glyphs: Record<Face, Record<string, Glyph>> };
/** x0, y0, x1, y1 in metres from the fascia's bottom left; u0, v0, u1, v1 in the atlas (v down, so v0 is the bottom). */
export type Quad = [number, number, number, number, number, number, number, number];

const LEAD = 0.09, SQUASH = 0.72; // the gap between lines (a share of the first line's ink height, doubled), the most a line condenses
// letters the faces don't have, as the sign painter would letter them
const FALLBACK: Record<string, string> = { "—": "-", "–": "-", "„": '"', "“": '"', "”": '"', "‚": "'", "’": "'", "‘": "'", "É": "E", "È": "E", "Ê": "E", "é": "e", "è": "e", "ê": "e", "à": "a", "á": "a", "â": "a", "À": "A", "ç": "c", "Ç": "C", "ô": "o", "Ô": "O", "ñ": "n", "ẞ": "SS", ";": ",", "!": ".", "?": "." };

function glyphs(font: FontAtlas, face: Face, text: string): Glyph[] {
  const g = font.glyphs[face], out: Glyph[] = [];
  for (const c of text) {
    const f = g[c] ? c : FALLBACK[c] ?? " ";
    for (const d of f) out.push(g[d] ?? g[" "]);
  }
  return out;
}

/** `pad` the board's margin above and below the letters, `side` at its ends (metres). */
export function layoutSign(font: FontAtlas, s: Sign, w: number, h: number, pad = 0.065, side = 0.12): Quad[] {
  const [W, H] = font.size, sp = font.spread;
  // each line by its ink: from its tallest letter's top to its lowest letter's foot (font pixels, cell rows)
  const lines = s.lines.map((l) => {
    const gs = glyphs(font, l.face, l.text), inked = gs.filter((c) => c.ib > c.it);
    const it = Math.min(...inked.map((c) => c.it)), ib = Math.max(...inked.map((c) => c.ib));
    return { l, gs, it, width: gs.reduce((a, c) => a + c.adv, 0) * l.scale, height: (ib - it) * l.scale };
  }).filter((x) => x.height > 0);
  if (!lines.length) return [];
  const gap = LEAD * 2 * lines[0].height, totalH = lines.reduce((a, l) => a + l.height, 0) + gap * (lines.length - 1);
  const maxW = Math.max(...lines.map((l) => l.width), 1);
  // metres a font pixel: up as tall as the board allows, unless that condenses past SQUASH; across, what fits
  const kH = (h - 2 * pad) / totalH, kW = (w - 2 * side) / maxW, ky = Math.min(kH, kW / SQUASH), kx = Math.min(ky, kW);
  const quads: Quad[] = [];
  let top = h / 2 + (totalH * ky) / 2;
  for (const { l, gs, it, width, height } of lines) {
    // the cell's top row sits `it` rows over the line's ink top
    const cellTop = top + it * l.scale * ky;
    let pen = (w - width * kx) / 2;
    for (const c of gs) {
      if (c.ib > c.it) {
        const x0 = pen - sp * l.scale * kx, y1 = cellTop;
        quads.push([x0, y1 - c.h * l.scale * ky, x0 + c.w * l.scale * kx, y1, c.x / W, (c.y + c.h) / H, (c.x + c.w) / W, c.y / H]);
      }
      pen += c.adv * l.scale * kx;
    }
    top -= height * ky + gap * ky;
  }
  return quads;
}

/** The lettering's fragment: coverage from the distance field, its edge a pixel wide at any distance. Binds the atlas
 *  as `font` (tex_font, samp_font). An alpha-tested letter: discard where it's under a half. The grey PNG arrives
 *  sRGB-decoded (raw, the field's half sits at 0.22 and letters come out hairlines: compositions/shop-signs.tsx v2's
 *  check), so it's put back before the threshold. */
export const SIGN_GLYPH_WGSL = /* wgsl */ `
fn sign_coverage(uv: vec2<f32>) -> f32 {
  let d = pow(textureSample(tex_font, samp_font, uv).r, 1.0 / 2.2);
  let w = max(fwidth(d), 0.02) * 0.7;
  return smoothstep(0.5 - w, 0.5 + w, d);
}
`;
