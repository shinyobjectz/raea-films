// Training lines for a Kraken model of the 1917 Adreßbuch's print: Kraken's own line outlines (kraken.sh's ALTO) with
// Opus's reading of each line (cache/adressbuch/1917/read) in place of Kraken's. Opus's lines are matched to Kraken's in
// order, by how alike the two readings are (a monotone alignment; a pair counts only when at most 40% of its characters
// differ), so a line Kraken split, merged or missed, a diagram and a line Opus marked unreadable ([?]) are left out.
// Opus's format is undone to the printed line: "  + " and the two spaces go, "<- Name ->" is the printed "← Name →".
// Pieces named by --hold (file-name prefixes) are left out, to score the model on.
//   bun gt.ts ALTO_DIR OUT_DIR [--hold 4322-6-,4323-3-]     writes OUT_DIR/*.xml and prints what it kept
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const read = join(dirname(fileURLToPath(import.meta.url)), "../../cache/adressbuch/1917/read");
const args = process.argv.slice(2), [inDir, outDir] = args;
const hold = args.includes("--hold") ? args[args.indexOf("--hold") + 1].split(",") : [];
mkdirSync(outDir, { recursive: true });

const unxml = (s: string) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const xmlText = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const latin = (s: string) => s.replace(/ſ/g, "s").replace(/ꝛ/g, "r").replace(/⸗/g, "-").replace(/\s+/g, " ").trim();
function edits(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const like = (a: string, b: string) => 1 - edits(a, b) / Math.max(1, a.length, b.length);

// Opus's lines as printed, or null for a line that can't teach (a diagram, an unreadable word).
function printed(l: string): string | null {
  if (!l.trim() || l.includes("[?]") || l.includes("[diagram]")) return null;
  const m = /^<-\s*(.*?)\s*->$/.exec(l.trim());
  if (m) return `← ${m[1]} →`;
  return l.replace(/^# /, "").replace(/^  \+ /, "").replace(/^  /, "").replace(/\s+/g, " ").trim() || null;
}

let pieces = 0, kept = 0, krakenLines = 0, opusLines = 0, likeSum = 0;
for (const f of readdirSync(inDir).filter((f) => f.endsWith(".xml")).sort()) {
  const txt = join(read, f.replace(/\.xml$/, ".txt"));
  if (!existsSync(txt) || hold.some((h) => f.startsWith(h))) continue;
  const xml = readFileSync(join(inDir, f), "utf8");
  const blocks = [...xml.matchAll(/<TextLine\b([^>]*)>([\s\S]*?)<\/TextLine>/g)].map((m) => ({
    whole: m[0], open: `<TextLine${m[1]}>`, attrs: m[1], shape: /<Shape>[\s\S]*?<\/Shape>/.exec(m[2])?.[0] ?? "",
    y: Number(/\bVPOS="([\d.]+)"/.exec(m[1])?.[1] ?? 0),
    text: latin([...m[2].matchAll(/<String\b[^>]*?\bCONTENT="([^"]*)"/g)].map((w) => unxml(w[1])).join(" ")),
  }));
  const k = [...blocks].sort((a, b) => a.y - b.y);
  const o = readFileSync(txt, "utf8").split("\n").map(printed).filter((l): l is string => l !== null);
  krakenLines += k.length; opusLines += o.length; pieces++;
  // best[i][j]: the most likeness over the first i of Kraken's lines and the first j of Opus's
  const best = Array.from({ length: k.length + 1 }, () => new Array<number>(o.length + 1).fill(0));
  const sim = k.map((kl) => o.map((ol) => like(kl.text, ol)));
  for (let i = 1; i <= k.length; i++)
    for (let j = 1; j <= o.length; j++)
      best[i][j] = Math.max(best[i - 1][j], best[i][j - 1], sim[i - 1][j - 1] >= 0.6 ? best[i - 1][j - 1] + sim[i - 1][j - 1] : -Infinity);
  const truth = new Map<string, string>();
  for (let i = k.length, j = o.length; i > 0 && j > 0; ) {
    if (best[i][j] === best[i - 1][j]) i--;
    else if (best[i][j] === best[i][j - 1]) j--;
    else { truth.set(k[i - 1].whole, o[j - 1]); likeSum += sim[i - 1][j - 1]; kept++; i--; j--; }
  }
  let out = xml;
  for (const b of blocks) {
    const t = truth.get(b.whole);
    const box = ["HPOS", "VPOS", "WIDTH", "HEIGHT"].map((a) => `${a}="${new RegExp(`\\b${a}="([\\d.]+)"`).exec(b.attrs)?.[1] ?? 0}"`).join(" ");
    out = out.replace(b.whole, t ? `${b.open}\n${b.shape}\n<String CONTENT="${xmlText(t)}" ${box}/>\n</TextLine>` : "");
  }
  writeFileSync(join(outDir, f), out);
}
console.log(`${pieces} pieces: kept ${kept} lines of Kraken's ${krakenLines} and Opus's ${opusLines}; Kraken read the kept ones ${((likeSum / Math.max(1, kept)) * 100).toFixed(1)}% alike on average`);
