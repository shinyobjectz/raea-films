// The signs preview's data (compositions/shop-signs.tsx): a real stretch of shopfront, the panes of one recorded house
// in bay order with the signs tools/interiors/windows.ts gave them, and a sheet of one sign per lettering style, laid
// out by interiors/signs/layout.ts on the facade's ground-floor fascia (tools/world/facade.ts shopfront: the bay's
// opening plus 0.4 m, 0.4 m tall).
//   bun tools/signs/sample.ts      writes compositions/shop-signs.json
import { readdirSync } from "node:fs";
import { layoutSign, type FontAtlas } from "../../interiors/signs/layout";
import type { Sign } from "../../interiors/signs/text";

const root = `${import.meta.dir}/../..`;
const font: FontAtlas = await Bun.file(`${root}/assets/signs/font.json`).json();
const { signs } = (await Bun.file(`${root}/assets/signs/signs.json`).json()) as { signs: Sign[] };
type Row = { recipe: number; lit: [number, number]; sign?: [number, number, number] };
const panes: { id: string; building: string; edge: number; bay: number; row: Row }[] = [];
for (const f of readdirSync(`${root}/assets/interiors/windows`)) {
  if (!f.endsWith(".json")) continue;
  const rows: Record<string, Row> = await Bun.file(`${root}/assets/interiors/windows/${f}`).json();
  for (const [id, row] of Object.entries(rows)) {
    const m = id.match(/^b(.+)-e(\d+)-f0-k(\d+)$/);
    if (m && row.sign) panes.push({ id, building: m[1], edge: +m[2], bay: +m[3], row });
  }
}
// a real stretch: the edge with the most bays whose signs are mostly the address book's (two lines: a firm and its trade)
const edges = new Map<string, typeof panes>();
for (const p of panes) { const k = `${p.building}:${p.edge}`; edges.set(k, [...(edges.get(k) ?? []), p]); }
const real = (p: (typeof panes)[number]) => signs[p.row.sign![0]].lines.length === 1 && p.row.sign![2] > 1;
const pickEdge = [...edges.values()].map((e) => e.sort((a, b) => a.bay - b.bay)).filter((e) => e.length >= 5 && e.length <= 9)
  .sort((a, b) => b.filter(real).length / b.length - a.filter(real).length / a.length || b.length - a.length)[0];
const street = pickEdge.map((p) => ({ id: p.id, sign: p.row.sign!, s: signs[p.row.sign![0]], lit: p.row.lit, recipe: p.row.recipe }));
// the sheet: per style (face, ground, ink) the first sign with two lines (a recorded firm) and the first with one
const seen = new Set<string>(), sheet: Sign[] = [];
for (const want of [2, 1]) for (const s of signs) { const k = `${s.lines[0].face}${s.ground}${s.ink}${want}`; if (s.lines.length === want && !seen.has(k) && sheet.length < 24) { seen.add(k); sheet.push(s); } }
const BAY = 2.7, FW = BAY - 0.15, FH = 0.4;
const lay = (s: Sign) => layoutSign(font, s, FW, FH).map((q) => q.map((v) => +v.toFixed(4)));
await Bun.write(`${root}/compositions/shop-signs.json`, JSON.stringify({
  fascia: [FW, FH], bay: BAY,
  street: street.map((p) => ({ ...p, quads: lay(p.s) })),
  sheet: sheet.map((s) => ({ s, quads: lay(s) })),
}));
console.log(`street ${pickEdge[0].building} edge ${pickEdge[0].edge}: ${street.length} bays; sheet ${sheet.length} signs`);
for (const p of street) console.log(`  k${p.id.split("-k")[1]} ${p.sign.join("/")} ${p.s.lines.map((l) => l.text).join(" | ")}`);
