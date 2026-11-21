// One street of the Adreßbuch's Part III, from the column readings (transcribe.ts), as houses with their entries.
// The street runs from its heading to the next street's heading; its houses are numbered up one side and back down the
// other (Berlin's horseshoe numbering), and the corners are printed between them as <- Name -> markers. The side
// changes at the marker named by --turn (the far end of the street); the street ends at the heading named by --until
// (a page's running header, "# III. Teil", is not one).
// A number that breaks the sequence is taken as a number that fits it when a reading slip explains it: a lost leading
// digit ("4" after 83 is 84), a misread digit ("10" after 39 is 40) or a last digit read as a letter ("12a" after 123
// is 124); of several such readings, the next number. Each such house says so in its flags; a number nothing explains
// is kept as read and flagged.
//   bun parse.ts "Leipziger Str" --turn Spittelmarkt --until "Alte Leipziger" [--after N] ORDER:COLS..   prints JSON
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { kind } from "./kinds";

const here = dirname(fileURLToPath(import.meta.url)), read = join(here, "../../cache/adressbuch/1917", process.env.READ ?? "read"); // READ=read-sonnet: another model's readings (score.ts)
const args = process.argv.slice(2), street = args[0], turn = args[args.indexOf("--turn") + 1], until = args[args.indexOf("--until") + 1];
const spans = args.slice(1).filter((a) => /^\d+:\d+(-\d+)?$/.test(a));

// The lines of the given columns in reading order.
const lines: { text: string; at: string }[] = [];
const files = readdirSync(read);
for (const span of spans) {
  const [order, cols] = span.split(":"), [c0, c1] = cols.split("-").map(Number);
  for (let c = c0; c <= (c1 || c0); c++) {
    const pieces = files.filter((f) => f.startsWith(`${order}-${c}-`)).sort((a, b) => Number(a.split("-")[2].split(".")[0]) - Number(b.split("-")[2].split(".")[0]));
    if (!pieces.length) throw new Error(`no reading for page ${order} column ${c}`);
    for (const p of pieces)
      for (const t of (await Bun.file(join(read, p)).text()).split("\n"))
        // Two numbers in a row ("127 128"): one house over two numbers whose separator the reader dropped ("127. 128.").
        if (t.trim()) lines.push({ text: t.replace(/\s+$/, "").replace(/^(\d{1,3})\s+(\d{1,3})(?=\s)/, (m, a, b) => (+b === +a + 1 ? `${a}. ${b}` : m)), at: `${order}-${c}` });
  }
}


type Entry = { text: string; role: "owner" | "manager" | null; phone: boolean; kind: string };
type House = { printed: string; numbers: number[]; note: string | null; entries: Entry[]; after: string | null; at: string; flags: string[] };
const sides: { side: string; markers: string[]; houses: House[] }[] = [{ side: "first", markers: [], houses: [] }];
// --after N: the parse starts partway along the numbering (the houses before it left out), so the count starts at N.
let started = false, open: string[] | null = null, lastMarker: string | null = null, prev = args.includes("--after") ? Number(args[args.indexOf("--after") + 1]) : 0, lastHouseAt = "";
const HOUSE = /^(\d{1,3})([a-e])?(?:\s*(?:[-–—.,]{1,2}|u\.)\s*(\d{1,3})[a-e]?)?\.?\s+(.*)$/;

/** The number a sequence-breaking reading most likely is, or null: exactly one candidate within 6 after prev. */
function slip(a: number, letter: string | undefined, prev: number, below = Infinity): number | null {
  const fits = (c: number) => c > prev && c <= prev + 6 && c < below;
  const found = new Set<number>();
  for (const k of [1, 2]) {
    const base = Math.floor(prev / 10 ** k) * 10 ** k;
    for (const c of [base + (a % 10 ** k), base + 10 ** k + (a % 10 ** k)]) if (a < 10 ** k && fits(c)) found.add(c);
  }
  if (letter || a >= 10) for (let d = 0; d < 10; d++) if (fits(a * 10 + d)) found.add(a * 10 + d);
  // One digit misread (a 4 printed faintly reads as 1).
  const t = String(a);
  for (let i = 0; i < t.length; i++) for (let d = 0; d < 10; d++) { const c = Number(t.slice(0, i) + d + t.slice(i + 1)); if (fits(c)) found.add(c); }
  // Two digits read swapped ("21" for 12).
  if (t.length === 2 && fits(Number(t[1] + t[0]))) found.add(Number(t[1] + t[0]));
  // Of several readings, the next number is the likeliest; otherwise only a single one is trusted.
  return found.has(prev + 1) ? prev + 1 : found.size === 1 ? [...found][0] : null;
}

const close = () => {
  if (!open) return;
  const h = sides[sides.length - 1].houses.at(-1)!, text = open.join(" ").replace(/\s+/g, " ").trim();
  const role = /^E\.?\s/.test(text) ? "owner" : /^V\.?\s/.test(text) ? "manager" : null;
  h.entries.push({ text, role, phone: /\bT\.?$/.test(text), kind: kind(text) });
  open = null;
};

// The number each house line reads as, by line index, so a step back can look at the house after it.
const readAt = lines.map(({ text }) => { const m = !text.startsWith(" ") && text.match(HOUSE); return m ? Number(m[1]) : null; });
const nextRead = (i: number) => { for (let j = i + 1; j < lines.length; j++) if (readAt[j] !== null) return readAt[j]; return null; };
for (const [li, { text, at }] of lines.entries()) {
  if (!started) { started = new RegExp(`^#\\s*${street}`).test(text); continue; }
  if (/^#/.test(text)) {
    if (sides[0].houses.length && until && text.includes(until)) break; // the next street's heading
    continue;
  }
  if (text.trim() === "[diagram]" || text.trim() === "[?]") continue;
  const m = text.match(/^<-\s*(.+?)\s*->$/);
  if (m) {
    close();
    sides[sides.length - 1].markers.push(m[1]);
    lastMarker = m[1];
    if (new RegExp(turn).test(m[1])) sides.push({ side: "second", markers: [m[1]], houses: [] });
    continue;
  }
  const h = !text.startsWith(" ") && text.match(HOUSE);
  if (h) {
    close();
    let a = Number(h[1]), b = h[3] ? Number(h[3]) : a, hold = false;
    const flags: string[] = [];
    const last = sides[sides.length - 1].houses.at(-1);
    // The same house printed again: the same number and letter, or the same span ("41. 42" twice). "65a" after 65 is not.
    const key = (p: string) => p.replace(/[\s.,]/g, "");
    const printedNow = h[0].slice(0, h[0].length - h[4].length).trim();
    const same = last && (key(printedNow) === key(last.printed) || (!h[2] && a === last.numbers[0] && b === last.numbers.at(-1) && !/[a-e]/.test(last.printed)));
    if (same) { flags.push(`number ${a} repeated`); a = last.numbers[0]; b = last.numbers.at(-1)!; }
    else if (a === prev && h[2]) { /* a lettered house after its number */ }
    // A small step back that the next house carries on from (91 after 88, then 90, 91) means the number before was the
    // misreading: this one is taken as read and the count goes back.
    else if (a < prev && a >= prev - 3 && (() => { const n = nextRead(li); return n !== null && n > a && n <= a + 3; })()) {
      flags.push(`number ${a} after ${prev}: taken as read, the house before is likely misread`);
      prev = a - 1;
    }
    // A jump forward that the next house does not carry on from (21 after 11, then 14; 5 after 2, then 4) is this house
    // misread: taken as the reading slip() finds below the next house's, or the one number left between the two, or with
    // neither kept as read without moving the count (else 14 becomes 24 and every house after it is ten out).
    else if (a > prev + 1 && (() => { const n = nextRead(li); return n !== null && n > prev && n < a; })()) {
      const n = nextRead(li)!, c = slip(a, h[2], prev, n) ?? (n === prev + 2 ? prev + 1 : null);
      if (c !== null && c < a) { flags.push(`read as ${h[1]}${h[2] ?? ""}, taken as ${c} (the house after reads ${nextRead(li)})`); b = c + (b - a); a = c; }
      else { flags.push(`number ${a} after ${prev}, but the house after reads ${nextRead(li)}: one is misread`); hold = true; }
    }
    else if (a < prev || a > prev + 12) {
      const c = slip(a, h[2], prev);
      if (c !== null) { flags.push(`read as ${h[1]}${h[2] ?? ""}, taken as ${c}`); b = h[3] && b > c && b <= c + 6 ? b : c + (b - a); a = c; } // "1. 12" is 11. 12: a span's end read right stays
      else if (slip(a, h[2], prev - 1) === prev) { flags.push(`read as ${h[1]}${h[2] ?? ""}, taken as ${prev}${h[2] ? h[2] : " repeated"}`); a = b = prev; }
      else if (a < prev && a >= prev - 20) flags.push(`number ${a} after ${prev}: one of the two is misread`);
      else flags.push(`number ${a} out of sequence after ${prev}`);
    }
    // A house printed again at the top of a column, with no owner line, goes on with the house before it. When that
    // house's own number was in doubt and this one is the next number, this one is its number (a gutter cut "16" to "5").
    const rest0 = h[4].trim();
    // Only the first house line of a column can carry on the house before it.
    const firstInColumn = lastHouseAt !== at;
    lastHouseAt = at;
    const carries = last && firstInColumn && !/^[EV]\.?\s|^(s|f)\.?\s?a\.?\s|^geh/.test(rest0);
    const doubtful = flags.length > 0;
    // Not when the house before was itself corrected from this reading (it said "the house after reads" this number).
    const readAhead = last?.flags.some((f) => f.endsWith(`the house after reads ${a})`));
    if (carries && !readAhead && (same || doubtful || (a === prev && !h[2]) || (a === prev + 1 && last.flags.length))) {
      if (a === prev + 1 && !same && !doubtful) { last.flags.push(`number taken as ${a} from its continuation at the top of ${at}`); last.numbers = [a]; prev = a; }
      else last.flags.push(`continued at the top of ${at}${same ? "" : ` (read there as ${printedNow})`}`);
      if (rest0) open = [rest0];
      continue;
    }
    // A number that goes back never lowers prev: a stray "11" after 30 would drag every house after it down.
    if (!hold && a >= prev - 20 && a <= prev + 12) prev = Math.max(prev, a, b);
    const rest = h[4].trim(), note = /^(s|f)\.?\s?a\.?\s|^geh\.?\s?z|^gehört/.test(rest) ? rest : null;
    sides[sides.length - 1].houses.push({ printed: h[0].slice(0, h[0].length - h[4].length).trim(), numbers: Array.from({ length: Math.max(1, Math.min(12, b - a + 1)) }, (_, i) => a + i), note, entries: [], after: lastMarker, at, flags });
    if (!note && rest) open = [rest];
    continue;
  }
  const cont = text.match(/^\s+\+\s?(.*)$/);
  if (cont && open) {
    const last = open[open.length - 1];
    if (/[-⸗]$/.test(last) && /^[a-zäöüß]/.test(cont[1])) open[open.length - 1] = last.replace(/[-⸗]$/, "") + cont[1];
    else open.push(cont[1]);
    continue;
  }
  if (!sides[sides.length - 1].houses.length) continue; // lines before the first house (the street's own notes)
  close();
  open = [text.replace(/^\s*\+?\s*/, "")];
}
close();

const all = sides.flatMap((s) => s.houses);
console.log(JSON.stringify({
  street, source: "Berliner Adreßbuch 1917, Part III (ZLB 34115495_1917, public domain), read by Claude from the page scans", turn,
  counts: { houses: all.length, entries: all.reduce((n, h) => n + h.entries.length, 0), flagged: all.filter((h) => h.flags.length).length },
  sides,
}, null, 1));
