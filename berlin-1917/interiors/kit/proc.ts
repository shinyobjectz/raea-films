// Each kit material's GPU pattern (raea's ProceduralExtension): wood grain, brick courses, plaster, weave, checks. No
// texture is stored or streamed for any of them, which is what lets every room in the city share these few
// materials (interiors/SYSTEM.md, "Compression"). Stripes and checks are the tiles pattern with narrow cells.
import type { MatId } from "./mats";

export type Proc = {
  pattern: "noise" | "wood" | "marble" | "stone" | "brick" | "tiles" | "fabric" | "brushed" | "plaster";
  colors?: [string, string];
  scale?: number;
  bump?: number;
  tile?: [number, number];
  gap?: number;
  gap_color?: string;
  rough?: [number, number];
  /** its own wear over the set's (outdoors there is no set: a car's paint carries road mud low and soot on its roof) */
  wear?: Partial<Wear>;
  dust_color?: string;
  dirt_color?: string;
  seed?: number;
};

export const PROC: Partial<Record<MatId, Proc>> = {
  "lime-wash": { pattern: "plaster", colors: ["#b9b29f", "#9e967f"], scale: 0.5, bump: 0.25 },
  "lime-dirty": { pattern: "plaster", colors: ["#8f877a", "#746c5e"], scale: 0.6, bump: 0.3 },
  "lime-damp": { pattern: "plaster", colors: ["#b8b09b", "#3f3c33"], scale: 1.1, bump: 0.3 },
  "oil-dado": { pattern: "plaster", colors: ["#4f5b4a", "#434e3e"], scale: 0.3, bump: 0.1, rough: [0.45, 0.6] },
  "paper-stripe": { pattern: "tiles", colors: ["#a79a7c", "#9c8f71"], tile: [0.055, 3], gap: 0.012, gap_color: "#7d6f55", bump: 0 },
  "paper-damask": { pattern: "marble", colors: ["#5d4334", "#4a3326"], scale: 0.12, bump: 0.05 },
  "ceiling-boards": { pattern: "wood", colors: ["#6d5a44", "#56452f"], scale: 0.035 },
  "boards-painted": { pattern: "plaster", colors: ["#7f7a6b", "#686355"], scale: 0.2, bump: 0.08, rough: [0.45, 0.65] },
  "plaster-ceiling": { pattern: "plaster", colors: ["#c4bcaa", "#a9a08b"], scale: 0.7, bump: 0.2 },
  brick: { pattern: "brick", colors: ["#6f4433", "#5a3628"], tile: [0.25, 0.065], gap: 0.012, gap_color: "#857b6c", bump: 0.6 },
  "brick-wash": { pattern: "brick", colors: ["#a39b8b", "#8b8373"], tile: [0.25, 0.065], gap: 0.012, gap_color: "#958d7d", bump: 0.5 },
  "brick-raw": { pattern: "brick", colors: ["#8e5642", "#7a4636"], tile: [0.25, 0.065], gap: 0.012, gap_color: "#a09582", bump: 0.7 },
  mortar: { pattern: "plaster", colors: ["#8f8676", "#7c7364"], scale: 0.2 },
  earth: { pattern: "stone", colors: ["#3f352b", "#2f271f"], scale: 0.15, bump: 0.6 },
  "floor-boards": { pattern: "wood", colors: ["#6e5640", "#4f3c2a"], scale: 0.04, bump: 0.2 },
  "floor-cellar": { pattern: "brick", colors: ["#4b443b", "#3a342c"], tile: [0.25, 0.12], gap: 0.01, gap_color: "#2b2722", bump: 0.6 },
  "tile-floor": { pattern: "tiles", colors: ["#8c7f6c", "#5f5447"], tile: [0.15, 0.15], gap: 0.003, gap_color: "#4a4238" },
  "tile-white": { pattern: "tiles", colors: ["#dcd8cc", "#cfcabd"], tile: [0.13, 0.13], gap: 0.004, gap_color: "#a8a397", rough: [0.15, 0.3] },
  iron: { pattern: "noise", colors: ["#1d1c1b", "#2b2620"], scale: 0.05, rough: [0.5, 0.7] },
  "iron-rust": { pattern: "stone", colors: ["#46301f", "#5e3c22"], scale: 0.04, bump: 0.3 },
  cement: { pattern: "plaster", colors: ["#56534d", "#44413c"], scale: 0.3, bump: 0.2 },
  "brick-dark": { pattern: "brick", colors: ["#5e3a2c", "#4a2d22"], tile: [0.25, 0.065], gap: 0.01, gap_color: "#4d453c", bump: 0.25 },
  "lime-sooty": { pattern: "plaster", colors: ["#5e574d", "#48423a"], scale: 0.4, bump: 0.1 },
  sand: { pattern: "noise", colors: ["#9c8662", "#857252"], scale: 0.15, bump: 0.4 },
  lagging: { pattern: "tiles", colors: ["#6b5a46", "#584837"], tile: [0.22, 3.0], gap: 0.015, gap_color: "#2d261e", bump: 0.4 },
  "steel-bright": { pattern: "brushed", colors: ["#8a8c8a", "#747674"], scale: 0.1 },
  copper: { pattern: "brushed", colors: ["#9a5b3a", "#7c472d"], scale: 0.1 },
  "gun-grey": { pattern: "plaster", colors: ["#5a5d55", "#4b4e47"], scale: 0.3, bump: 0.05, rough: [0.5, 0.7] },
  "paint-red": { pattern: "plaster", colors: ["#7b2b22", "#66231b"], scale: 0.25, bump: 0.05, rough: [0.45, 0.6] },
  canvas: { pattern: "fabric", colors: ["#857a62", "#6e644f"], scale: 0.01, bump: 0.5 },
  zinc: { pattern: "brushed", colors: ["#858a8e", "#6e7276"], scale: 0.1 },
  "wood-dark": { pattern: "noise", colors: ["#35231a", "#2a1b12"], scale: 0.25, bump: 0.05, rough: [0.45, 0.55] }, // polished veneer: the grain reads as a sheen, not stripes
  "wood-mid": { pattern: "noise", colors: ["#5a3c26", "#4a301e"], scale: 0.25, bump: 0.05, rough: [0.5, 0.6] },
  "wood-soft": { pattern: "wood", colors: ["#7e6246", "#634b33"], scale: 0.025 },
  "wood-raw": { pattern: "noise", colors: ["#6a5c4b", "#584a3b"], scale: 0.5, bump: 0.15, rough: [0.8, 0.9] }, // sawn softwood: blotches, not stripes (stripes strobed at a distance)
  "wood-weathered": { pattern: "noise", colors: ["#7b766c", "#5c574f"], scale: 0.35, bump: 0.25, rough: [0.85, 0.95] }, // grey boards: blotches, no stripes (a stripe pattern runs the wrong way on upright boards)
  "wood-grey": { pattern: "wood", colors: ["#5c554b", "#45403a"], scale: 0.025, bump: 0.3 },
  "paint-white": { pattern: "plaster", colors: ["#cfc8b6", "#bcb3a0"], scale: 0.25, bump: 0.05, rough: [0.5, 0.65] },
  "paint-green": { pattern: "plaster", colors: ["#2d3a30", "#243026"], scale: 0.25, bump: 0.05, rough: [0.45, 0.6] },
  linen: { pattern: "fabric", colors: ["#d2ccbc", "#c2bba8"], scale: 0.004 },
  "linen-grey": { pattern: "fabric", colors: ["#a8a293", "#958f80"], scale: 0.004 },
  "check-blue": { pattern: "tiles", colors: ["#3f5277", "#36476a"], tile: [0.035, 0.035], gap: 0.012, gap_color: "#c8c6bc", bump: 0 },
  "check-red": { pattern: "tiles", colors: ["#8a3a33", "#7a322c"], tile: [0.035, 0.035], gap: 0.012, gap_color: "#c9bfb0", bump: 0 },
  plush: { pattern: "fabric", colors: ["#561d1f", "#3e1214"], scale: 0.006 },
  wool: { pattern: "fabric", colors: ["#4a463f", "#3b3832"], scale: 0.006, bump: 0.5 },
  jute: { pattern: "fabric", colors: ["#86704c", "#6e5a3a"], scale: 0.008, bump: 0.7 },
  oilcloth: { pattern: "tiles", colors: ["#5a6a5e", "#52625a"], tile: [0.022, 0.022], gap: 0.005, gap_color: "#b9b6a6", rough: [0.3, 0.35], bump: 0 }, // a small green check: at 7 cm it read as tiles
  "cloth-floral": { pattern: "noise", colors: ["#2e241c", "#7d6d58"], scale: 0.012, bump: 0.05 }, // a busy dark print: blotches of cream on brown at 3-4 cm
  straw: { pattern: "fabric", colors: ["#a68a52", "#7d6538"], scale: 0.02, bump: 0.9 },
  wicker: { pattern: "fabric", colors: ["#94744b", "#6b5032"], scale: 0.011, bump: 1 },
  "wicker-weathered": { pattern: "noise", colors: ["#857a69", "#655b4e"], scale: 0.2, bump: 0.3, rough: [0.85, 0.95] },
  "hide-calf": { pattern: "noise", colors: ["#6f4c31", "#d6ccba"], scale: 0.07, bump: 0.6, rough: [0.9, 1] },
  "tar-wood": { pattern: "noise", colors: ["#312c26", "#221e1a"], scale: 0.6, bump: 0.3, rough: [0.7, 0.88] },
  sponge: { pattern: "noise", colors: ["#c9aa62", "#9c7f42"], scale: 0.004, bump: 1, rough: [0.95, 1] },
  hay: { pattern: "fabric", colors: ["#7d7448", "#5f5833"], scale: 0.015, bump: 0.9 },
  stoneware: { pattern: "noise", colors: ["#8f8064", "#7a6b50"], scale: 0.05, rough: [0.35, 0.5] },
  terracotta: { pattern: "stone", colors: ["#94533a", "#7d432d"], scale: 0.03 },
  coal: { pattern: "stone", colors: ["#121212", "#222020"], scale: 0.02, bump: 0.8, rough: [0.35, 0.6] },
  briquette: { pattern: "noise", colors: ["#1c1a18", "#272320"], scale: 0.02, bump: 0.4 },
  potato: { pattern: "stone", colors: ["#8b6d45", "#6e5433"], scale: 0.02, bump: 0.4 },
  bread: { pattern: "stone", colors: ["#4a3020", "#3a2416"], scale: 0.02, bump: 0.5 },
  rubble: { pattern: "stone", colors: ["#7c6b5b", "#655648"], scale: 0.04, bump: 0.6 },
  marble: { pattern: "marble", colors: ["#cfcac0", "#a9a39a"], scale: 0.2 },
  paper: { pattern: "noise", colors: ["#e0d8c4", "#d2c8b0"], scale: 0.05 },
  "cloth-navy": { pattern: "fabric", colors: ["#2b3346", "#232a3a"], scale: 0.004 },
  "cloth-field": { pattern: "fabric", colors: ["#5d6152", "#4e5245"], scale: 0.004 },
  "cloth-brown": { pattern: "fabric", colors: ["#5a4434", "#4a382a"], scale: 0.005 },
  "cloth-black": { pattern: "fabric", colors: ["#23211f", "#1b1a18"], scale: 0.004 },
  "cloth-cream": { pattern: "fabric", colors: ["#cbbf9f", "#b9ad8c"], scale: 0.006, bump: 0.4 },
  felt: { pattern: "noise", colors: ["#3a3530", "#2f2b27"], scale: 0.01 },
  fur: { pattern: "fabric", colors: ["#3b2a1e", "#2a1d14"], scale: 0.003, bump: 1 },
  card: { pattern: "noise", colors: ["#b6a585", "#a39373"], scale: 0.04 },
  // the stairwells: painted woodwork, not grain (a grain pattern shimmers on thin rails seen from a flight away)
  "paint-brown": { pattern: "plaster", colors: ["#4a3326", "#3e2a1f"], scale: 0.25, bump: 0.05, rough: [0.45, 0.6] },
  runner: { pattern: "fabric", colors: ["#5e2b24", "#47201b"], scale: 0.006, bump: 0.5 },
  "dado-brown": { pattern: "plaster", colors: ["#5a3b2b", "#4c3124"], scale: 0.3, bump: 0.1, rough: [0.45, 0.6] },
  // ── outdoors: coach paint mottled where it faded, roughness varying with it (the dull patches catch no reflection),
  // and each paint's own wear: grey-brown road mud thrown up along the floor line, soot and dust on what faces up,
  // edges rubbed through. The worn twins carry more of each and a lighter, chalkier mottle.
  "tram-green": { pattern: "plaster", colors: ["#2a3d2f", "#34483a"], scale: 0.45, bump: 0.04, rough: [0.42, 0.6], wear: { dust: 0.25, dirt: 0.5, edges: 0.3 }, dirt_color: "#2e2a22", dust_color: "#6f6a60" },
  "tram-ivory": { pattern: "plaster", colors: ["#cfc6a8", "#bfb594"], scale: 0.5, bump: 0.04, rough: [0.42, 0.6], wear: { dust: 0.3, dirt: 0.45, edges: 0.25 }, dirt_color: "#4a453b", dust_color: "#8c8577" },
  "tram-green-worn": { pattern: "plaster", colors: ["#33433a", "#5c6555"], scale: 0.35, bump: 0.08, rough: [0.6, 0.85], wear: { dust: 0.45, dirt: 0.75, edges: 0.65 }, dirt_color: "#2e2a22", dust_color: "#6f6a60", seed: 11 },
  "tram-ivory-worn": { pattern: "plaster", colors: ["#b8ad8c", "#857a5f"], scale: 0.35, bump: 0.08, rough: [0.6, 0.85], wear: { dust: 0.5, dirt: 0.8, edges: 0.55 }, dirt_color: "#3f3a31", dust_color: "#8c8577", seed: 11 },
  "tram-roof": { pattern: "noise", colors: ["#3d3a35", "#2a2825"], scale: 0.4, bump: 0.25, rough: [0.8, 0.95], wear: { dust: 0.6, dirt: 0.6, edges: 0.2 }, dust_color: "#58544c" },
  "lacquer-black": { pattern: "noise", colors: ["#141413", "#1b1a18"], scale: 0.3, bump: 0.02, rough: [0.25, 0.4], wear: { dust: 0.25, dirt: 0.45, edges: 0.3 }, dirt_color: "#3a342a", dust_color: "#6f6a60" },
  "lacquer-black-worn": { pattern: "plaster", colors: ["#1b1a18", "#37342e"], scale: 0.25, bump: 0.06, rough: [0.45, 0.7], wear: { dust: 0.45, dirt: 0.7, edges: 0.6 }, dirt_color: "#3a342a", dust_color: "#6f6a60", seed: 13 },
  "paint-field": { pattern: "plaster", colors: ["#5b6050", "#4f5446"], scale: 0.6, bump: 0.05, rough: [0.5, 0.72], wear: { dust: 0.4, dirt: 0.65, edges: 0.45 }, dirt_color: "#3b3327", dust_color: "#7d776a" },
  "paint-field-worn": { pattern: "plaster", colors: ["#5a5f51", "#767a6a"], scale: 0.35, bump: 0.1, rough: [0.65, 0.9], wear: { dust: 0.55, dirt: 0.85, edges: 0.7 }, dirt_color: "#3b3327", dust_color: "#7d776a", seed: 17 },
  "canvas-field": { pattern: "fabric", colors: ["#6a6a58", "#58584a"], scale: 0.012, bump: 0.5, rough: [0.9, 0.98], wear: { dust: 0.45, dirt: 0.55, edges: 0.2 }, dirt_color: "#3b3327" },
  rubber: { pattern: "noise", colors: ["#1b1b1a", "#262523"], scale: 0.03, bump: 0.3, rough: [0.82, 0.95], wear: { dust: 0.5, dirt: 0.4, edges: 0.7 }, dust_color: "#5e5a52" },
  "wheel-red": { pattern: "plaster", colors: ["#6e2a20", "#5c2219"], scale: 0.3, bump: 0.05, rough: [0.4, 0.65], wear: { dust: 0.3, dirt: 0.7, edges: 0.5 }, dirt_color: "#3b3327" },
  "wheel-yellow": { pattern: "plaster", colors: ["#9c7d3a", "#86692e"], scale: 0.3, bump: 0.05, rough: [0.4, 0.65], wear: { dust: 0.3, dirt: 0.7, edges: 0.5 }, dirt_color: "#3b3327" },
  "post-blue": { pattern: "plaster", colors: ["#283f63", "#223755"], scale: 0.3, bump: 0.04, rough: [0.4, 0.6], wear: { dust: 0.3, dirt: 0.5, edges: 0.35 } },
  "iron-bright": { pattern: "brushed", colors: ["#4a4844", "#3a3834"], scale: 0.05, rough: [0.18, 0.35] },
  "wood-varnish": { pattern: "wood", colors: ["#7a5434", "#5f3f25"], scale: 0.14, bump: 0.15, rough: [0.35, 0.5], wear: { dust: 0.15, dirt: 0.35, edges: 0.35 } },
  "wood-varnish-worn": { pattern: "wood", colors: ["#6d4a2e", "#54381f"], scale: 0.14, bump: 0.25, rough: [0.5, 0.75], wear: { dust: 0.25, dirt: 0.55, edges: 0.7 }, seed: 19 },
  "mud-road": { pattern: "plaster", colors: ["#544a3c", "#2f2a22"], scale: 0.07, bump: 0.6, rough: [0.55, 0.95], wear: { dust: 0.08, dirt: 0.2, edges: 0 }, dust_color: "#6a6255" },
  "wheel-red-worn": { pattern: "plaster", colors: ["#6a3428", "#87513f"], scale: 0.3, bump: 0.08, rough: [0.55, 0.85], wear: { dust: 0.45, dirt: 0.8, edges: 0.7 }, dirt_color: "#3b3327", seed: 23 },
  "wheel-yellow-worn": { pattern: "plaster", colors: ["#94804e", "#ad9c70"], scale: 0.3, bump: 0.08, rough: [0.55, 0.85], wear: { dust: 0.45, dirt: 0.8, edges: 0.7 }, dirt_color: "#3b3327", seed: 23 },
  "paint-brown-worn": { pattern: "plaster", colors: ["#56402f", "#6e5643"], scale: 0.35, bump: 0.08, rough: [0.6, 0.85], wear: { dust: 0.5, dirt: 0.7, edges: 0.6 }, seed: 29 },
  "leather-worn": { pattern: "noise", colors: ["#56392a", "#7a5a44"], scale: 0.05, bump: 0.35, rough: [0.55, 0.85], wear: { dust: 0.3, dirt: 0.5, edges: 0.8 } },
  "cloth-navy-worn": { pattern: "fabric", colors: ["#33394a", "#4a4f5a"], scale: 0.004, bump: 0.3, rough: [0.85, 0.98], wear: { dust: 0.4, dirt: 0.6, edges: 0.3 } },
  "granite-red": { pattern: "noise", colors: ["#84503f", "#5a3329"], scale: 0.012, bump: 0.15, rough: [0.35, 0.6], wear: { dust: 0.45, dirt: 0.5, edges: 0.3 }, dust_color: "#8a8378" },
  "ice-grey": { pattern: "plaster", colors: ["#a3aeb2", "#7f8b90"], scale: 0.6, bump: 0.05, rough: [0.04, 0.4], wear: { dust: 0.5, dirt: 0.1, edges: 0 }, dust_color: "#d8dbdc" },
  // street life (kit/life.ts). Newsprint: each cell a line of type, the gaps the paper's leading and the gutters
  newsprint: { pattern: "tiles", colors: ["#9a9488", "#a59f92"], tile: [0.06, 0.006], gap: 0.0012, gap_color: "#d8d1bd", bump: 0, rough: [0.8, 0.9] },
  "newsprint-wet": { pattern: "tiles", colors: ["#625c52", "#6c665b"], tile: [0.06, 0.006], gap: 0.0012, gap_color: "#8f887a", bump: 0, rough: [0.3, 0.6], wear: { dust: 0, dirt: 0.5, edges: 0 }, dirt_color: "#4a4237" },
  dung: { pattern: "stone", colors: ["#6b5a3a", "#4a3d26"], scale: 0.025, bump: 0.7, rough: [0.3, 0.75], wear: { dust: 0, dirt: 0.3, edges: 0 } },
  ash: { pattern: "noise", colors: ["#97948c", "#68655e"], scale: 0.03, bump: 0.5, rough: [0.9, 1.0], wear: { dust: 0, dirt: 0.2, edges: 0 } },
  "snow-dirty": { pattern: "plaster", colors: ["#8e8b84", "#5a554c"], scale: 0.12, bump: 0.5, rough: [0.25, 0.8], wear: { dust: 0.25, dirt: 0.5, edges: 0 }, dust_color: "#b9bbbd", dirt_color: "#4b453c" },
  "board-chalk": { pattern: "plaster", colors: ["#2a2d2f", "#3a3c3c"], scale: 0.2, bump: 0.05, rough: [0.85, 0.95] },
  cabbage: { pattern: "marble", colors: ["#94a06a", "#c6c697"], scale: 0.04, bump: 0.4, rough: [0.45, 0.7] },
  herring: { pattern: "brushed", colors: ["#9aa1a6", "#5f676d"], scale: 0.02, bump: 0.1, rough: [0.15, 0.3] },
  "cabbage-old": { pattern: "noise", colors: ["#8f8a52", "#5e5a33"], scale: 0.03, bump: 0.3, rough: [0.4, 0.75] },
  "awning-stripe": { pattern: "tiles", colors: ["#8c4a3c", "#8c4a3c"], tile: [0.4, 50], gap: 0.1, gap_color: "#bdb294", bump: 0, rough: [0.88, 0.97], wear: { dust: 0.5, dirt: 0.5, edges: 0.1 }, dirt_color: "#4e463a" },
};
/** One wear recipe per scene (world/SOP.md §5.1): street 0.25/0.55/0.3, interior 0.35/0.4/0.35, works 0.5/0.7/0.4. */
export type Wear = { dust: number; dirt: number; edges: number };
export const WEAR = { interior: { dust: 0.35, dirt: 0.4, edges: 0.35 }, cellar: { dust: 0.55, dirt: 0.6, edges: 0.4 }, shop: { dust: 0.2, dirt: 0.3, edges: 0.3 } } satisfies Record<string, Wear>;
