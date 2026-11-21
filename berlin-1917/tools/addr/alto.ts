// Turns Kraken's ALTO readings of Adreßbuch pieces (kraken.sh) into transcribe.ts's text format, so parse.ts and
// score.ts read them as they read Claude's: a house-number line as "NUMBER rest", an entry's first line with two spaces
// in front, and each further line of the same entry with "  + " in front. Kraken gives each line's box, not its
// indent class, so the class comes from the line's left edge: the text edge is the leftmost edge most entry lines
// share; a line that starts with a digit left of it is a house number, and a line indented past it by more than a
// third of a line's height is a continuation. Long s and r rotunda are written as s and r, as Claude is asked to.
//   bun alto.ts ALTO_DIR OUT_DIR
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [inDir, outDir] = process.argv.slice(2);
const unxml = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const latin = (s: string) => s.replace(/ſ/g, "s").replace(/ꝛ/g, "r").replace(/⸗/g, "-").replace(/\s+/g, " ").trim();

for (const f of readdirSync(inDir).filter((f) => f.endsWith(".xml"))) {
  const xml = readFileSync(join(inDir, f), "utf8");
  const lines: { x: number; y: number; h: number; text: string }[] = [];
  for (const m of xml.matchAll(/<TextLine\b([^>]*)>([\s\S]*?)<\/TextLine>/g)) {
    const attr = (k: string) => Number(new RegExp(`\\b${k}="([\\d.]+)"`).exec(m[1])?.[1] ?? NaN);
    const words = [...m[2].matchAll(/<String\b[^>]*?\bCONTENT="([^"]*)"/g)].map((w) => unxml(w[1]));
    const text = latin(words.join(" "));
    if (text) lines.push({ x: attr("HPOS"), y: attr("VPOS"), h: attr("HEIGHT"), text });
  }
  lines.sort((a, b) => a.y - b.y);
  const h = lines.map((l) => l.h).sort((a, b) => a - b)[Math.floor(lines.length / 2)] ?? 30;
  // The text edge: the smallest left edge that at least a fifth of the lines that don't start with a digit share,
  // within a third of a line's height.
  const xs = lines.filter((l) => !/^\d/.test(l.text)).map((l) => l.x).sort((a, b) => a - b);
  const edge = xs.find((x) => xs.filter((y) => Math.abs(y - x) < h / 3).length >= Math.max(1, xs.length / 5)) ?? xs[0] ?? 0;
  const out = lines.map((l) => {
    if (/^\d/.test(l.text) && l.x < edge - h / 4) return l.text;
    return l.x > edge + h / 3 ? `  + ${l.text}` : `  ${l.text}`;
  });
  writeFileSync(join(outDir, f.replace(/\.xml$/, ".txt")), out.join("\n") + "\n");
}
