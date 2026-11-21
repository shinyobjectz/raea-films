// Scores another model's readings of the Adreßbuch against Opus's (cache/adressbuch/1917/read), piece by piece, to
// choose the cheapest model that reads well enough to place every shop on the slice.
//   bun tools/addr/score.ts read-haiku read-sonnet
// For each folder: the character error rate (edits over Opus's characters), the share of Opus's lines read exactly,
// the house numbers: how many of Opus's numbers it has, and how many it adds that Opus doesn't; and the places
// (kinds.ts: shops, food, firms, banks, practices, state offices) each piece yields, against Opus's count of each.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { kind } from "./kinds";

const book = join(dirname(fileURLToPath(import.meta.url)), "../../cache/adressbuch/1917");

function edits(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
const lines = (t: string) => t.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim());
// An entry's first line: the rest of a house-number line, or a line with two spaces in front (not a "+ " continuation).
const places = (t: string) => {
  const n = new Map<string, number>();
  for (const l of t.split("\n")) {
    const e = /^\d/.test(l) ? l.replace(/^\S+\s+/, "") : /^  (?!\+)/.test(l) ? l.trim() : null;
    if (!e) continue;
    const k = kind(e.replace(/^[EV]\.\s*/, ""));
    if (k !== "resident") n.set(k, (n.get(k) ?? 0) + 1);
  }
  return n;
};
const numbers = (t: string) => lines(t).flatMap((l) => (/^\d/.test(l) ? [l.split(" ")[0]] : []));

for (const dir of process.argv.slice(2)) {
  let placesRef = 0, placesHit = 0, placesExtra = 0;
  let chars = 0, wrong = 0, ref = 0, same = 0, nums = 0, found = 0, extra = 0;
  const worst: string[] = [];
  for (const f of readdirSync(join(book, dir)).filter((f) => f.endsWith(".txt")).sort()) {
    const truth = join(book, "read", f);
    if (!existsSync(truth)) continue;
    const a = readFileSync(truth, "utf8"), b = readFileSync(join(book, dir, f), "utf8");
    const e = edits(lines(a).join("\n"), lines(b).join("\n"));
    chars += lines(a).join("\n").length; wrong += e;
    const theirs = new Set(lines(b).map((l) => l.trim()));
    ref += lines(a).length; same += lines(a).filter((l) => theirs.has(l.trim())).length;
    const na = numbers(a), nb = numbers(b);
    nums += na.length; found += na.filter((n) => nb.includes(n)).length; extra += nb.filter((n) => !na.includes(n)).length;
    const pa = places(a), pb = places(b);
    for (const [k, c] of pa) { placesRef += c; placesHit += Math.min(c, pb.get(k) ?? 0); }
    for (const [k, c] of pb) placesExtra += Math.max(0, c - (pa.get(k) ?? 0));
    worst.push(`${f} ${(e / Math.max(1, a.length) * 100).toFixed(1)}%`);
  }
  console.log(`${dir}: ${worst.length} pieces; character errors ${(wrong / chars * 100).toFixed(2)}%; lines exact ${same}/${ref} (${(same / ref * 100).toFixed(1)}%); house numbers ${found}/${nums}, ${extra} not in Opus's; places ${placesHit}/${placesRef} matched by kind, ${placesExtra} extra`);
  console.log(`  by piece: ${worst.join(", ")}`);
}
