// What a street's houses held, by trade, from the Adreßbuch readings (transcribe.ts: cache/adressbuch/1917/read/
// ORDER-COL-K.txt), counted without any name: each entry's kind (kinds.ts) and its trade as printed (the words after a
// person's name, or a firm's whole line, its own name dropped). For sampling the shops of streets nobody has read
// (tools/map/shops.ts) from one that has been.
//   bun trades.ts --from HEADING --until HEADING ORDER:COLS..   e.g. --from "Ackerstr" --until "Adalbertbr" 3849:7-8 ...
// Prints JSON: { street, source, houses, entries, kinds: {kind: n}, trades: [[kind, trade, n]] } (trades of
// non-residents, most first; residents' trades in `residents` the same way).
import { FIRM, kind } from "./kinds";

const FIRM_LINE = FIRM;

const args = process.argv.slice(2);
const opt = (k: string) => { const i = args.indexOf(k); if (i < 0) return ""; const v = args[i + 1]; args.splice(i, 2); return v; };
const from = opt("--from"), until = opt("--until"), street = opt("--street") || from;
const dir = `${import.meta.dir}/../../cache/adressbuch/1917/read`;
const pieces: string[] = [];
for (const a of args) {
  const [order, cols] = a.split(":");
  const [c0, c1] = cols.split("-").map(Number);
  for (let c = c0; c <= (c1 ?? c0); c++)
    for (let k = 1; ; k++) {
      const f = Bun.file(`${dir}/${order}-${c}-${k}.txt`);
      if (!(await f.exists())) break;
      pieces.push(await f.text());
    }
}
// One entry per line: continuations ("+ ...") joined to the line before; headings (# ...), [diagram] and [?] dropped.
const lines: string[] = [];
let on = !from;
for (const raw of pieces.join("\n").split("\n")) {
  const t = raw.trim();
  if (t.startsWith("#")) {
    if (!on && from && t.includes(from)) on = true;
    else if (on && until && t.includes(until)) break;
    continue;
  }
  if (!on && from && t.includes(from) && /^\S/.test(raw)) on = true; // a heading printed in the column, not marked #
  if (!on || !t || /^\[(diagram|\?)\]$/.test(t)) continue;
  if (t.startsWith("+") && lines.length) lines[lines.length - 1] += " " + t.slice(1).trim();
  else lines.push(t);
}
let houses = 0;
const kinds: Record<string, number> = {}, trades = new Map<string, number>(), residents = new Map<string, number>();
for (let l of lines) {
  const m = l.match(/^(\d+[a-z]?)\s+(.*)$/);
  if (m) (houses++, (l = m[2]));
  l = l.replace(/^(E\.|V\.)\s+/, "").replace(/\s+T\.$/, "").replace(/\s+B\.\s?\d+\.?$/, "").trim();
  if (!l || /^\(.*\)$/.test(l) || /^Straßenbild|^Hausnummer/.test(l)) continue;
  const k = kind(l);
  kinds[k] = (kinds[k] ?? 0) + 1;
  // the trade: a person's last comma part ("Name, I., Trade."), never a name: a firm counts as "(firm)" whatever it
  // is called, and a last part that is initials, a first name or a misread is dropped
  const parts = l.split(",").map((s) => s.trim()).filter(Boolean);
  let trade = FIRM_LINE.test(l) || k === "firm" ? "(firm)" : parts.length > 1 ? parts[parts.length - 1] : "";
  trade = trade.replace(/^[A-ZÄÖÜ]\.?\s+(?=[A-ZÄÖÜ][a-zäöüß])/, "").replace(/\s+T\.?$/, "").replace(/\.$/, "").replace(/-\s+/g, "").replace(/\s+/g, " ").trim();
  if (!trade || /^[A-ZÄÖÜ]\.?( ?[A-ZÄÖÜ]\.?)*$/.test(trade) || /\[\?\]/.test(trade)) continue;
  if (trade !== "(firm)" && !/[a-zäöüß]\.?$/.test(trade)) continue;
  const map = k === "resident" ? residents : trades;
  const key = k === "resident" ? trade : `${k}\t${trade}`;
  map.set(key, (map.get(key) ?? 0) + 1);
}
const sorted = (m: Map<string, number>) => [...m].sort((a, b) => b[1] - a[1]);
console.log(JSON.stringify({
  street, source: `Berliner Adreßbuch 1917, Part III (ZLB 34115495_1917, public domain), scans ${args.join(" ")}, read by transcribe.ts`,
  houses, entries: lines.length, kinds,
  trades: sorted(trades).map(([k, n]) => [...k.split("\t"), n]),
  residents: sorted(residents).slice(0, 80),
}, null, 1));
