// A tree's year (docs/foliage.feature FO3): from a day of the year to what its leaves are doing. The days are for
// Berlin, by species, as the day of year (1 = 1 January) of each phase:
//   out      leaf unfolding begins (BBCH 11)          full     leaves full size (about three weeks on)
//   turn     autumn colouring begins                  brown    leaves turned (most coloured, browning)
//   fall     leaf fall half done (BBCH 95)            bare     all fallen (BBCH 97)
//   flower   [start, end] of flowering, when it shows on the crown (a lime's cream sprays, a chestnut's candles)
// ASSUMED: German long-term means as remembered, until the DWD phenology for the Berlin stations (CC BY 4.0) is read
// (research/foliage-1917.md, "Seasons"); 1917's own spring came late after the cold winter, so a dated shot shifts
// these. Colours are linear, from the floras' descriptions, ASSUMED until sheets beside photographs say otherwise.

type V3 = [number, number, number];

export type Phenology = { out: number; full: number; turn: number; brown: number; fall: number; bare: number; flower?: [number, number] };
export type Palette = { young: V3; green: V3; autumn: V3; dead: V3; flower?: V3 };
export type Tree = { phen: Phenology; colour: Palette; bark: V3; kind: number };

export const lin = (hex: string): V3 => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)];
};

// bark kinds (raea-sys-foliage): 0 fissured, 1 a plane's flakes, 2 a birch's white, 3 a locust's ropes
export const TREES: Record<string, Tree> = {
  lime: { phen: { out: 112, full: 135, turn: 280, brown: 298, fall: 300, bare: 315, flower: [178, 195] }, colour: { young: lin("#b9cf6a"), green: lin("#46702a"), autumn: lin("#d6b443"), dead: lin("#8a6a35"), flower: lin("#e8e0a8") }, bark: lin("#5d5a54"), kind: 0 },
  elm: { phen: { out: 110, full: 132, turn: 285, brown: 300, fall: 302, bare: 318 }, colour: { young: lin("#a8c45e"), green: lin("#3f5d26"), autumn: lin("#c9a33c"), dead: lin("#7b5c2f") }, bark: lin("#57524b"), kind: 0 },
  plane: { phen: { out: 118, full: 142, turn: 290, brown: 310, fall: 315, bare: 335 }, colour: { young: lin("#b4c968"), green: lin("#4d6a2e"), autumn: lin("#c3a24a"), dead: lin("#8c6b3f") }, bark: lin("#a49d86"), kind: 1 },
  maple: { phen: { out: 108, full: 130, turn: 282, brown: 296, fall: 298, bare: 312, flower: [100, 112] }, colour: { young: lin("#bcd06a"), green: lin("#456a28"), autumn: lin("#e0a52c"), dead: lin("#9a5a26"), flower: lin("#d6dc6a") }, bark: lin("#5c5853"), kind: 0 },
  chestnut: { phen: { out: 100, full: 122, turn: 268, brown: 285, fall: 288, bare: 305, flower: [125, 140] }, colour: { young: lin("#b0cc63"), green: lin("#3c5e22"), autumn: lin("#c98a33"), dead: lin("#7d4e26"), flower: lin("#f2ece0") }, bark: lin("#625a52"), kind: 0 },
  locust: { phen: { out: 130, full: 150, turn: 283, brown: 295, fall: 293, bare: 305, flower: [152, 165] }, colour: { young: lin("#b9d27a"), green: lin("#5a7a34"), autumn: lin("#d8c552"), dead: lin("#8f7d3c"), flower: lin("#f4f1e4") }, bark: lin("#6a6157"), kind: 3 },
  oak: { phen: { out: 120, full: 145, turn: 290, brown: 305, fall: 310, bare: 340 }, colour: { young: lin("#c2c76a"), green: lin("#40592a"), autumn: lin("#b08a3a"), dead: lin("#7d5a33") }, bark: lin("#57514a"), kind: 0 },
  birch: { phen: { out: 105, full: 125, turn: 278, brown: 292, fall: 293, bare: 308 }, colour: { young: lin("#bed46c"), green: lin("#4f7330"), autumn: lin("#e3c43c"), dead: lin("#94793a") }, bark: lin("#dcdad2"), kind: 2 },
  poplar: { phen: { out: 108, full: 128, turn: 288, brown: 300, fall: 303, bare: 318 }, colour: { young: lin("#b5c967"), green: lin("#486a2b"), autumn: lin("#e1c03d"), dead: lin("#8e7537") }, bark: lin("#625f58"), kind: 0 },
  willow: { phen: { out: 100, full: 122, turn: 292, brown: 308, fall: 312, bare: 330 }, colour: { young: lin("#c2d47c"), green: lin("#6d8448"), autumn: lin("#d2c053"), dead: lin("#8f8143") }, bark: lin("#625c53"), kind: 0 },
};

const ramp = (a: number, b: number, x: number) => Math.min(1, Math.max(0, (x - a) / (b - a)));

/** What a tree's leaves are doing on a day: grown (0 bud to 1 full size), turned (0 green to 1 coloured), browned,
 * fallen (the share gone), and flowering (0-1). */
export type State = { grown: number; mature: number; turned: number; browned: number; fallen: number; flowering: number; litter: number };

export function state(tree: Tree, day: number): State {
  const p = tree.phen;
  const f = p.flower;
  return {
    grown: ramp(p.out, p.full, day),
    // young leaves keep their light yellow-green about a month past full size
    mature: ramp(p.full - 5, p.full + 30, day),
    turned: ramp(p.turn - 12, p.brown, day),
    browned: ramp(p.brown - 6, p.bare, day),
    // half gone on p.fall; all gone by p.bare (the last few leaves hang on)
    fallen: day < p.fall ? 0.5 * ramp(p.turn, p.fall, day) ** 2 : 0.5 + 0.5 * ramp(p.fall, p.bare, day),
    flowering: f ? ramp(f[0] - 4, f[0] + 3, day) * (1 - ramp(f[1] - 3, f[1] + 4, day)) : 0,
    // fallen leaves on the ground until they rot or are swept, about three weeks after the last falls (ASSUMED)
    litter: (day < p.fall ? 0.5 * ramp(p.turn, p.fall, day) ** 2 : 0.5 + 0.5 * ramp(p.fall, p.bare, day)) * (1 - ramp(p.bare, p.bare + 25, day)),
  };
}

/** Each leaf group's opacity on a day: a group goes when its share of the leaves has fallen, and a leaf is in bud
 * until it opens (raea-sys-foliage's eight groups, by each leaf's own number). */
export function groups(s: State, n = 8): number[] {
  return Array.from({ length: n }, (_, k) => (s.grown > 0.02 && s.fallen < (k + 1) / n ? 1 : 0));
}
