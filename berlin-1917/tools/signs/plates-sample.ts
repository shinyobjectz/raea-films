// The enamel plates' preview data (compositions/shop-signs.tsx plates-street, plates-sheet): a side-street stretch with
// the facade's ground floor (bays of 2.7 m, the house door's bay 1.7 m open, end piers of 0.8 m), each shop's fascia
// and its plates as interiors/signs/plates.ts gives them, mounted by the facade rule (interiors/SYSTEM.md "Enamel
// plates"); and a sheet of every ware once. The shops' unit names are picked so each carries plates, to show them.
//   bun tools/signs/plates-sample.ts      writes compositions/shop-plates.json
import { layoutSign, type FontAtlas } from "../../interiors/signs/layout";
import { PLATE_PAD, PLATE_RIM, PLATE_SHAPES, plateSheet, platesFor, type Plate } from "../../interiors/signs/plates";
import { genericSign, type Sign } from "../../interiors/signs/text";

const root = `${import.meta.dir}/../..`;
const font: FontAtlas = await Bun.file(`${root}/assets/signs/font.json`).json();
const h32 = (s: string) => { // tools/interiors/windows.ts's
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const r4 = (q: number[]) => q.map((v) => +v.toFixed(4));
const BAY = 2.7, END = 0.8, FW = BAY - 0.15, FH = 0.4, DOOR = 1.7, BOTTOM = 1.3, GAP = 0.08, MARGIN = 0.03;

// the stretch, bay by bay: a shop's kit and how many bays it has, or the house door
const plan: (string | null)[] = ["shop-tobacco", null, "shop-grocer", "shop-grocer", "shop-destille", "shop-drugstore"];
const units: { kit: string; bays: number[]; name: string; plates: Plate[]; sign: Sign }[] = [];
plan.forEach((kit, k) => {
  if (!kit) return;
  const last = units.at(-1);
  if (last && last.kit === kit && last.bays.at(-1) === k - 1) { last.bays.push(k); return; }
  let name = "", plates: Plate[] = [];
  for (let i = 0; !plates.length && i < 200; i++) { name = `preview:${kit}:${i}`; plates = platesFor(kit, name, false, h32); }
  units.push({ kit, bays: [k], name, plates, sign: genericSign(kit, name) });
});
// the walls a plate can go on, 0.5 m or wider: the two end piers and each side of the house door
const L = 2 * END + plan.length * BAY;
const walls: { x0: number; x1: number; used: number; top: number }[] = [{ x0: 0, x1: END, used: 0, top: BOTTOM }, { x0: L - END, x1: L, used: 0, top: BOTTOM }];
plan.forEach((kit, k) => {
  if (kit) return;
  const uc = END + (k + 0.5) * BAY;
  walls.push({ x0: END + k * BAY, x1: uc - DOOR / 2, used: 0, top: BOTTOM }, { x0: uc + DOOR / 2, x1: END + (k + 1) * BAY, used: 0, top: BOTTOM });
});
// each unit's plates on the nearest wall with room, stacked from 1.3 m; scaled to leave 3 cm each side of a narrow wall
const lay = (p: Plate, w: number, h: number) => layoutSign(font, p.sign, w - 2 * PLATE_RIM, h - 2 * PLATE_RIM, ...PLATE_PAD).map(r4);
const plates: { x: number; y: number; w: number; h: number; s: Sign; quads: number[][] }[] = [];
for (const u of units) {
  const uc = END + ((u.bays[0] + u.bays.at(-1)! + 1) / 2) * BAY;
  for (const p of u.plates) {
    const [pw, ph] = PLATE_SHAPES[p.shape];
    const wall = walls.filter((w) => w.used < 2).sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - uc) - Math.abs((b.x0 + b.x1) / 2 - uc))[0];
    if (!wall) break;
    const k = Math.min(1, (wall.x1 - wall.x0 - 2 * MARGIN) / pw), w = pw * k, h = ph * k;
    const y = wall.top;
    wall.used++, (wall.top += h + GAP);
    plates.push({ x: (wall.x0 + wall.x1) / 2 - w / 2, y, w, h, s: p.sign, quads: lay(p, w, h) });
  }
}
const sheet = plateSheet().map((p) => { const [w, h] = PLATE_SHAPES[p.shape]; return { w, h, s: p.sign, quads: lay(p, w, h) }; });
await Bun.write(`${root}/compositions/shop-plates.json`, JSON.stringify({
  bay: BAY, end: END, door: DOOR, fascia: [FW, FH], rim: PLATE_RIM,
  bays: plan.map((kit, k) => { const u = units.find((x) => x.bays.includes(k)); return u ? { k, s: u.sign, quads: layoutSign(font, u.sign, FW, FH).map(r4) } : { k, door: true }; }),
  plates, sheet,
}));
for (const u of units) console.log(`  ${u.kit} ${u.sign.lines.map((l) => l.text).join(" | ")}: ${u.plates.map((p) => p.sign.lines.map((l) => l.text).join("/")).join(", ")}`);
console.log(`street ${plan.length} bays, ${plates.length} plates on ${walls.filter((w) => w.used).length} walls; sheet ${sheet.length} plates`);
