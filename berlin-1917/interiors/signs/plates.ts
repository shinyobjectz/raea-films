// Enamel advertising plates (Emailschilder; research/catalogue/outdoor.ts "enamel-signs"): bright vitreous enamel for
// what a shop sold, screwed to the wall beside its door and the house door. Product words only, never a brand, as on the
// estimated shops' signs: ZIGARREN, KAKAO, SEIFE, with a small line under some ("to be had here"). The plates went up
// before the war and stayed through it, so a shop can still advertise cocoa it has none of.
// Who carries them: the small shops of the side streets most (tobacconists, grocers, drugstores, the Destille, the coal
// cellar); the dressed fronts of Leipziger and Friedrichstraße seldom; fashion, furs and jewellers never.
// platesFor() is pure (no raea imports): tools/interiors/windows.ts puts a shop's plates on its first pane's row, the
// preview (compositions/shop-plates.tsx) lays the same ones out. The contract for the facade is in interiors/SYSTEM.md
// ("Enamel plates").
import type { Face, Line, Sign } from "./text";

/** w x h in metres: a portrait plate for a short word (five letters or fewer), a landscape one for the rest. */
export const PLATE_SHAPES: [number, number][] = [[0.42, 0.58], [0.6, 0.4]];
/** layoutSign's margins for a plate: above and below the letters, at the ends (a fascia's are 0.065 and 0.12). */
export const PLATE_PAD: [number, number] = [0.04, 0.035];
/** The rim: a border in the ink's colour this wide round the ground, as nearly every enamel plate had. */
export const PLATE_RIM = 0.014;

type Enamel = { ground: string; ink: string; face: Face };
const ENAMELS: [Enamel, number][] = [
  [{ ground: "#1d3d8a", ink: "#f2eee4", face: "grotesk" }, 3], // cobalt with white letters, the commonest
  [{ ground: "#efebe0", ink: "#1d3d8a", face: "grotesk" }, 2],
  [{ ground: "#e2b229", ink: "#16130f", face: "fat" }, 2],
  [{ ground: "#a6261d", ink: "#f2eee4", face: "fat" }, 2],
  [{ ground: "#16130f", ink: "#e2b229", face: "grotesk" }, 1],
  [{ ground: "#1f5a3b", ink: "#f2eee4", face: "grotesk" }, 1],
  [{ ground: "#efebe0", ink: "#a6261d", face: "grotesk" }, 1],
];
const ENAMEL_SUM = ENAMELS.reduce((s, [, w]) => s + w, 0);
// the fat face only for a short word: on a long one it shrinks to fit, where the condensed grotesque keeps its height
const faceFor = (word: string, e: Enamel): Face => (word.length <= 5 ? e.face : "grotesk");

/** What each trade's plates sold, and the chance a shop of it has any (halved and more on a dressed main street). */
const WARES: Record<string, [number, string[]]> = {
  "shop-tobacco": [0.75, ["ZIGARREN", "ZIGARETTEN", "RAUCHTABAK", "KAUTABAK", "SCHNUPFTABAK"]],
  "shop-grocer": [0.65, ["KAFFEE", "MALZKAFFEE", "KAKAO", "TEE", "SEIFE", "SUPPENWÜRZE", "SCHOKOLADE"]],
  "shop-butter-deli": [0.5, ["MARGARINE", "KÄSE", "KAKAO", "SUPPENWÜRZE"]],
  "shop-dairy": [0.45, ["MILCH", "MARGARINE", "KÄSE"]],
  "shop-drugstore": [0.6, ["SEIFE", "WASCHPULVER", "MUNDWASSER", "ZAHNPULVER", "BLEICHSODA"]],
  "coal-cellar-shop": [0.6, ["BRIKETTS", "KOHLEN", "BRIKETTS"]],
  "shop-destille": [0.5, ["LAGERBIER", "WEISSBIER", "LIKÖRE", "SELTERSWASSER", "KORN"]],
  "shop-barber": [0.4, ["HAARWASSER", "RASIERSEIFE"]],
  "shop-konditorei": [0.35, ["SCHOKOLADE", "KAKAO", "PRALINEN"]],
  "shop-chocolate": [0.4, ["SCHOKOLADE", "KAKAO", "PRALINEN"]],
  "shop-baker": [0.35, ["ZWIEBACK", "KAKAO"]],
  "shop-butcher": [0.3, ["BRÜHWÜRFEL", "SUPPENWÜRZE"]],
  "shop-laundry": [0.35, ["STÄRKE", "BLEICHSODA", "SEIFE"]],
  "shop-small-goods": [0.3, ["NÄHGARN", "STRICKWOLLE"]],
  "shop-books-music": [0.25, ["SCHREIBWAREN", "TINTE", "POSTKARTEN"]],
  "shop-shoes": [0.25, ["SCHUHCREME", "GUMMIABSÄTZE"]],
  "shop-photo": [0.2, ["PLATTEN", "PAPIERE"]],
};
/** The small line under some: to be had here; a sales point. */
const TAGS = ["HIER ZU HABEN", "VERKAUFSSTELLE"];

export type Plate = { sign: Sign; shape: number };

/** A shop's plates: none, one, or two of different wares. `h` is the caller's hash of a string to [0, 1). */
export function platesFor(kit: string, unit: string, main: boolean, h: (s: string) => number): Plate[] {
  const w = WARES[kit];
  if (!w || h(`${unit}:pl`) >= w[0] * (main ? 0.3 : 1)) return [];
  const [, wares] = w, n = h(`${unit}:pn`) < 0.35 ? 2 : 1, start = Math.floor(h(`${unit}:pw`) * wares.length), out: Plate[] = [];
  for (let i = 0; i < n; i++) {
    const word = wares[(start + i) % wares.length];
    if (out.some((p) => p.sign.lines[0].text === word)) break;
    let e = h(`${unit}:pe${i}`) * ENAMEL_SUM, enamel = ENAMELS[0][0];
    for (const [x, wt] of ENAMELS) { if ((e -= wt) < 0) { enamel = x; break; } }
    const lines: Line[] = [{ text: word, face: faceFor(word, enamel), scale: 1 }];
    const tag = h(`${unit}:pt${i}`);
    if (tag < 0.35) lines.push({ text: TAGS[tag < 0.22 ? 0 : 1], face: "grotesk", scale: 0.5 });
    out.push({ sign: { lines, ground: enamel.ground, ink: enamel.ink, gilt: false }, shape: word.length > 5 ? 1 : 0 });
  }
  return out;
}

/** Every ware in every enamel, for the preview's sheet. */
export function plateSheet(): Plate[] {
  const out: Plate[] = [];
  let i = 0;
  for (const [, wares] of Object.values(WARES)) for (const word of wares) {
    if (out.some((p) => p.sign.lines[0].text === word)) continue;
    const e = ENAMELS[i % ENAMELS.length][0], lines: Line[] = [{ text: word, face: faceFor(word, e), scale: 1 }];
    if (i % 3 === 0) lines.push({ text: TAGS[i % 2], face: "grotesk", scale: 0.5 });
    out.push({ sign: { lines, ground: e.ground, ink: e.ink, gilt: false }, shape: word.length > 5 ? 1 : 0 });
    i++;
  }
  return out;
}
