// The last three trades the Adreßbuch records that stood in on the small-goods shop (research/catalogue): opticians
// (shop-optician, 10 storefronts on the three streets read), leather goods (shop-leather, 15) and glass and silver
// (shop-glass-silver, 14). interiors/shops.ts lays each out from its profile. In the war each window sold to the front:
//   the optician  field glasses and the trench periscope (Berlin made them: Goerz in Friedenau), barometers, spectacles
//   leather       officers' map cases, belts and cartridge pouches; suitcases for the leave train, the cheap ones of
//                 fibre and canvas now that leather was the army's
//   glass, silver crystal on glass shelves and silver plate on trays (the 1917 requisition took household copper, brass
//                 and nickel, but left silver to the gold-for-iron appeal)
import type { Solid } from "raea/3d";
import { box, lathe, post, rbox, ring, union, zcyl } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const OPTICIAN = ["shop-optician"], LEATHER = ["shop-leather"], GLASS = ["shop-glass-silver"];

// ---- the optician ----

/** Folded spectacles facing +z at (x, y, z): two round rims, the bridge, the temples folded behind. */
function spectacles(x: number, y: number, z: number, flat = false): Solid {
  const rim = (dx: number) => (flat ? ring(0.022, 0.0025, 12, 4).rotate(90, 0, 0).move(x + dx, y, z) : ring(0.022, 0.0025, 12, 4).move(x + dx, y, z));
  return union(rim(-0.026), rim(0.026), box(0.012, 0.003, 0.003, x, y + (flat ? -0.0015 : 0.008), z), flat ? box(0.07, 0.003, 0.003, x, y - 0.0015, z - 0.022) : box(0.07, 0.003, 0.003, x, y + 0.01, z - 0.012));
}

/** The optician's wall case: shallow lens drawers to the counter's height, a glazed case over them with field glasses
 *  and spectacle cases on its shelves. */
prop({
  id: "lens-cabinet", items: [...OPTICIAN, "lens-drawers"], size: [1.2, 2.1, 0.45], place: "wall", where: "set", tris: 2400,
  parts: () => {
    const fronts = [], pulls = [], glasses = [], cases = [];
    for (let row = 0; row < 4; row++) for (let c = 0; c < 6; c++) {
      const x = -0.5 + c * 0.2;
      fronts.push(box(0.18, 0.2, 0.008, x, 0.06 + row * 0.22, 0.227));
      pulls.push(box(0.04, 0.012, 0.01, x, 0.15 + row * 0.22, 0.236));
    }
    [0.95, 1.33, 1.69].forEach((ys, s) => {
      for (let i = 0; i < 4; i++) {
        const x = -0.42 + i * 0.28;
        if ((i + s) % 2) glasses.push(post(0.028, 0.13, x - 0.032, ys, -0.06), post(0.028, 0.13, x + 0.032, ys, -0.06));
        else cases.push(box(0.16, 0.05, 0.07, x, ys, -0.06), box(0.14, 0.045, 0.06, x + 0.01, ys + 0.05, -0.06));
      }
    });
    return [
      { mat: "wood-dark", solid: union(box(1.2, 0.95, 0.45), box(1.2, 1.09, 0.03, 0, 0.95, -0.21), box(0.04, 1.09, 0.33, -0.58, 0.95, -0.045), box(0.04, 1.09, 0.33, 0.58, 0.95, -0.045), box(1.24, 0.06, 0.36, 0, 2.04, -0.06), box(1.12, 0.02, 0.3, 0, 1.31, -0.05), box(1.12, 0.02, 0.3, 0, 1.67, -0.05)) },
      { mat: "wood-mid", solid: union(...fronts), overlap: true },
      { mat: "brass", solid: union(...pulls), overlap: true },
      { mat: "cloth-black", solid: union(...glasses), overlap: true },
      { mat: "leather", solid: union(...cases), overlap: true },
      { mat: "glass-plate", solid: box(1.12, 1.07, 0.006, 0, 0.96, 0.115), overlap: true },
      { mat: "wood-dark", solid: union(box(0.04, 1.07, 0.02, 0, 0.96, 0.12), box(1.12, 0.035, 0.02, 0, 0.96, 0.12), box(1.12, 0.035, 0.02, 0, 1.995, 0.12), box(1.12, 0.025, 0.02, 0, 1.48, 0.12)), overlap: true }, // the two doors' frames
    ];
  },
});

/** The sight-test chart on its stand: a card of tumbling E's in rows, each row smaller, on an iron post. */
prop({
  id: "sight-test", items: [...OPTICIAN, "eye-chart"], size: [0.55, 1.9, 0.4], place: "floor", where: "set", tris: 1800,
  parts: () => {
    const ink = [];
    let y = 1.8;
    for (let k = 0; k < 7; k++) {
      const h = 0.075 * Math.pow(0.72, k), w = h * 0.85, n = k + 1, gap = h * 0.5, x0 = -(n * w + (n - 1) * gap) / 2 + w / 2;
      y -= h;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * (w + gap), t = h * 0.2, dir = (k * 3 + i * 5) % 4, z = 0.029;
        if (dir < 2) { // opening right (0) or left (1): the spine on the other side, three bars
          const sx = dir === 0 ? x - w / 2 + t / 2 : x + w / 2 - t / 2;
          ink.push(box(t, h, 0.002, sx, y, z), box(w, t, 0.002, x, y, z), box(w, t, 0.002, x, y + h / 2 - t / 2, z), box(w, t, 0.002, x, y + h - t, z));
        } else { // opening up (2) or down (3)
          const sy = dir === 2 ? y : y + h - t;
          ink.push(box(w, t, 0.002, x, sy, z), ...[-1, 0, 1].map((s) => box(t, h, 0.002, x + s * (w / 2 - t / 2), y, z)));
        }
      }
      y -= h * 0.7;
    }
    return [
      { mat: "iron", solid: union(box(0.5, 0.04, 0.06), box(0.06, 0.04, 0.4), post(0.018, 1.86, 0, 0.04, 0)) },
      { mat: "wood-dark", solid: box(0.5, 0.74, 0.012, 0, 1.13, 0.015), overlap: true },
      { mat: "paper", solid: box(0.46, 0.7, 0.006, 0, 1.15, 0.024), overlap: true },
      { mat: "cloth-black", solid: union(...ink), overlap: true },
    ];
  },
});

/** Field glasses on a velvet base, objectives to the street: black leather barrels, brass rims, the eyepieces behind. */
prop({
  id: "field-glasses", items: [...OPTICIAN, "field-glasses"], size: [0.22, 0.1, 0.2], place: "on", where: "set", tris: 700,
  parts: () => [
    { mat: "plush", solid: box(0.2, 0.025, 0.17) },
    { mat: "cloth-black", solid: union(...[-1, 1].flatMap((s) => [zcyl(0.03, 0.15).move(s * 0.042, 0.06, 0), zcyl(0.018, 0.03).move(s * 0.04, 0.06, -0.085)])) },
    { mat: "brass", solid: union(zcyl(0.033, 0.015).move(-0.042, 0.06, 0.075), zcyl(0.033, 0.015).move(0.042, 0.06, 0.075), box(0.05, 0.02, 0.04, 0, 0.05, -0.04)), overlap: true },
  ],
});

/** Spectacles on a stepped velvet stand: three rows of three pairs. */
prop({
  id: "spectacle-stand", items: [...OPTICIAN, "spectacles"], size: [0.5, 0.24, 0.26], place: "on", where: "set", tris: 2200,
  parts: () => {
    const pairs = [];
    for (let s = 0; s < 3; s++) for (const x of [-0.15, 0, 0.15]) pairs.push(spectacles(x, 0.06 * (s + 1) + 0.026, 0.09 - s * 0.08));
    return [
      { mat: "plush", solid: union(box(0.5, 0.06, 0.24), box(0.5, 0.06, 0.16, 0, 0.06, -0.04), box(0.5, 0.06, 0.08, 0, 0.12, -0.08)) },
      { mat: "steel-bright", solid: union(...pairs), overlap: true },
    ];
  },
});

/** A trench periscope (Grabenspiegel) in field-grey paint on a foot: the top mirror to the street, the eyepiece low behind. */
prop({
  id: "periscope", items: [...OPTICIAN, "periscope"], size: [0.14, 0.75, 0.12], place: "on", where: "set", tris: 120,
  parts: () => [
    { mat: "gun-grey", solid: union(box(0.14, 0.03, 0.12), box(0.08, 0.7, 0.06, 0, 0.03, 0), box(0.09, 0.1, 0.08, 0, 0.64, 0.005)) },
    { mat: "mirror", solid: box(0.06, 0.05, 0.004, 0, 0.66, 0.047), overlap: true },
    { mat: "glass-dark", solid: box(0.06, 0.04, 0.004, 0, 0.12, -0.032), overlap: true },
  ],
});

/** A barometer in its walnut case on a foot: the dial in a brass bezel, the thermometer below. */
prop({
  id: "barometer", items: [...OPTICIAN, "barometer"], size: [0.26, 0.5, 0.12], place: "on", where: "set", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.26, 0.03, 0.12), rbox(0.2, 0.46, 0.04, 0.02, 0, 0.03, 0)) },
    { mat: "brass", solid: zcyl(0.095, 0.008).move(0, 0.32, 0.021), overlap: true },
    { mat: "paper", solid: zcyl(0.085, 0.006).move(0, 0.32, 0.025), overlap: true },
    { mat: "iron", solid: box(0.004, 0.07, 0.003, 0.01, 0.3, 0.03), overlap: true },
    { mat: "glass", solid: box(0.014, 0.14, 0.006, 0, 0.1, 0.022), overlap: true },
    { mat: "paint-red", solid: box(0.004, 0.1, 0.004, 0, 0.11, 0.025), overlap: true },
  ],
});

/** A velvet tray of six pairs of spectacles laid flat, for the counter. */
prop({
  id: "spectacle-tray", items: [...OPTICIAN, "spectacles"], size: [0.42, 0.05, 0.3], place: "on", where: "set", tris: 2400,
  parts: () => [
    { mat: "wood-dark", solid: box(0.42, 0.02, 0.3) },
    { mat: "plush", solid: box(0.38, 0.004, 0.26, 0, 0.02, 0), overlap: true },
    { mat: "steel-bright", solid: union(...[-0.12, 0, 0.12].flatMap((x) => [-0.06, 0.07].map((z) => spectacles(x, 0.0285, z, true)))), overlap: true },
  ],
});

// ---- leather goods ----

/** Three suitcases stacked, largest at the bottom: leather, fibre-and-canvas, leather; straps and brass locks. */
prop({
  id: "suitcase-stack", items: [...LEATHER, "suitcases"], size: [0.75, 0.7, 0.5], place: "floor", where: "set", tris: 900,
  parts: () => {
    const cases: [number, number, number, number, string][] = [[0.72, 0.24, 0.46, 0, "leather"], [0.62, 0.2, 0.4, 0.03, "canvas"], [0.5, 0.16, 0.34, -0.02, "leather"]];
    const by: Record<string, Solid[]> = { leather: [], canvas: [] }, straps = [], locks = [];
    let y = 0;
    for (const [w, h, d, x, mat] of cases) {
      by[mat].push(rbox(w, h, d, 0.02, x, y, 0));
      straps.push(box(0.03, h + 0.004, d + 0.004, x - w * 0.3, y - 0.002, 0), box(0.03, h + 0.004, d + 0.004, x + w * 0.3, y - 0.002, 0));
      locks.push(box(0.04, 0.03, 0.006, x - 0.15, y + h - 0.05, d / 2 + 0.002), box(0.04, 0.03, 0.006, x + 0.15, y + h - 0.05, d / 2 + 0.002));
      y += h;
    }
    return [
      { mat: "leather", solid: union(...by.leather, bar([-0.08, y, 0], [-0.06, y + 0.04, 0], 0.008), bar([-0.06, y + 0.04, 0], [0.04, y + 0.04, 0], 0.008), bar([0.04, y + 0.04, 0], [0.06, y, 0], 0.008)) },
      { mat: "canvas", solid: union(...by.canvas) },
      { mat: "cloth-brown", solid: union(...straps), overlap: true },
      { mat: "brass", solid: union(...locks), overlap: true },
    ];
  },
});

/** A briefcase standing: the body, the darker flap, its brass lock, the handle. */
prop({
  id: "satchel", items: [...LEATHER, "briefcase"], size: [0.42, 0.36, 0.14], place: "on", where: "set", tris: 300,
  parts: () => [
    { mat: "leather", solid: union(rbox(0.4, 0.28, 0.1, 0.02), bar([-0.06, 0.28, 0], [-0.05, 0.33, 0], 0.009), bar([-0.05, 0.33, 0], [0.05, 0.33, 0], 0.009), bar([0.05, 0.33, 0], [0.06, 0.28, 0], 0.009)) },
    { mat: "cloth-brown", solid: box(0.4, 0.15, 0.01, 0, 0.13, 0.054), overlap: true },
    { mat: "brass", solid: box(0.05, 0.03, 0.008, 0, 0.16, 0.063), overlap: true },
  ],
});

/** An officer's map case (Kartentasche) standing on its foot: the map under celluloid, a river and squares on it,
 *  the shoulder strap above. */
prop({
  id: "map-case", items: [...LEATHER, "map-case"], size: [0.28, 0.36, 0.08], place: "on", where: "set", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: box(0.18, 0.02, 0.07, 0, 0, -0.01) },
    { mat: "leather", solid: union(rbox(0.26, 0.3, 0.035, 0.012, 0, 0.02, 0), bar([-0.12, 0.3, 0], [0, 0.35, 0], 0.006), bar([0.12, 0.3, 0], [0, 0.35, 0], 0.006)) },
    { mat: "paper", solid: box(0.2, 0.17, 0.003, 0, 0.1, 0.0185), overlap: true },
    { mat: "paper-blue", solid: union(box(0.2, 0.012, 0.002, 0, 0.19, 0.0205), box(0.012, 0.09, 0.002, 0.05, 0.1, 0.0205)), overlap: true },
    { mat: "cloth-black", solid: union(...[-0.05, 0, 0.05].map((x) => box(0.002, 0.17, 0.002, x, 0.1, 0.021)), ...[0.14, 0.22].map((y) => box(0.2, 0.002, 0.002, 0, y, 0.021))), overlap: true },
    { mat: "glass", solid: box(0.21, 0.18, 0.002, 0, 0.095, 0.0215), overlap: true },
  ],
});

/** The belt rail: a stand of two posts and two rails, belts hung from the top with their buckles, cartridge pouches
 *  in pairs from the lower. */
prop({
  id: "belt-rail", items: [...LEATHER, "belts"], size: [1.0, 2.0, 0.22], place: "wall", where: "set", tris: 800,
  parts: () => {
    const belts: Solid[][] = [[], []], buckles = [], pouches = [];
    for (let i = 0; i < 9; i++) {
      const x = -0.4 + i * 0.1;
      belts[i % 2].push(box(0.045, 0.8, 0.006, x, 1.06, -0.035));
      buckles.push(box(0.05, 0.04, 0.008, x, 1.06, -0.03));
    }
    for (let j = 0; j < 5; j++) { const x = -0.36 + j * 0.18; pouches.push(box(0.075, 0.1, 0.06, x - 0.04, 0.78, -0.02), box(0.075, 0.1, 0.06, x + 0.04, 0.78, -0.02)); }
    return [
      { mat: "wood-dark", solid: union(box(0.04, 2.0, 0.04, -0.48, 0, -0.06), box(0.04, 2.0, 0.04, 0.48, 0, -0.06), box(1.0, 0.04, 0.04, 0, 1.86, -0.06), box(1.0, 0.04, 0.04, 0, 0.9, -0.06), box(0.06, 0.03, 0.22, -0.48, 0, 0), box(0.06, 0.03, 0.22, 0.48, 0, 0)) },
      { mat: "leather", solid: union(...belts[0], ...pouches), overlap: true },
      { mat: "cloth-brown", solid: union(...belts[1]), overlap: true },
      { mat: "brass", solid: union(...buckles), overlap: true },
    ];
  },
});

/** Open shelving of the stock: suitcases lying on the bottom, cases on end, handbags, hatboxes at the top. */
prop({
  id: "case-shelves", items: [...LEATHER, "suitcases"], size: [1.6, 2.2, 0.5], place: "wall", where: "set", tris: 1500,
  parts: () => {
    // [x, w, h, d] per shelf, from the bottom
    const shelves: [number, [number, number, number, number][]][] = [
      [0.11, [[-0.36, 0.7, 0.22, 0.44], [0.38, 0.62, 0.2, 0.4]]],
      [0.65, [[-0.5, 0.42, 0.4, 0.14], [-0.02, 0.42, 0.36, 0.14], [0.46, 0.4, 0.38, 0.14]]],
      [1.19, [[-0.54, 0.28, 0.24, 0.12], [-0.18, 0.28, 0.22, 0.12], [0.18, 0.28, 0.24, 0.12], [0.54, 0.28, 0.2, 0.12]]],
      [1.73, [[-0.42, 0.4, 0.3, 0.3], [0.06, 0.4, 0.28, 0.3], [0.5, 0.3, 0.3, 0.3]]],
    ];
    const by: Solid[][] = [[], [], []];
    let k = 0;
    for (const [y, items] of shelves) for (const [x, w, h, d] of items) by[k++ % 3].push(rbox(w, h, d, 0.015, x, y, 0.02));
    return [
      { mat: "wood-mid", solid: union(box(0.04, 2.2, 0.5, -0.78, 0, 0), box(0.04, 2.2, 0.5, 0.78, 0, 0), box(1.6, 2.2, 0.02, 0, 0, -0.24), ...[0.08, 0.62, 1.16, 1.7, 2.17].map((y) => box(1.52, 0.03, 0.48, 0, y, 0))) },
      { mat: "leather", solid: union(...by[0]), overlap: true },
      { mat: "cloth-brown", solid: union(...by[1]), overlap: true },
      { mat: "canvas", solid: union(...by[2]), overlap: true },
    ];
  },
});

/** A steamer trunk on the floor: canvas over wood, its slats, brass corners and lock. */
prop({
  id: "trunk", items: [...LEATHER, "trunk"], size: [0.9, 0.62, 0.55], place: "floor", where: "set", tris: 300,
  parts: () => [
    { mat: "canvas", solid: box(0.86, 0.58, 0.5, 0, 0.02, 0) },
    { mat: "wood-raw", solid: union(...[0.02, 0.3, 0.56].map((y) => box(0.88, 0.04, 0.52, 0, y, 0)), box(0.04, 0.58, 0.52, -0.3, 0.02, 0), box(0.04, 0.58, 0.52, 0.3, 0.02, 0)), overlap: true },
    { mat: "brass", solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.06, 0.05, 0.06, sx * 0.42, 0.56, sz * 0.24))), box(0.06, 0.06, 0.01, 0, 0.45, 0.262)), overlap: true },
  ],
});

// ---- glass and silver ----

const GOBLET: [number, number][] = [[0, 0], [0.035, 0], [0.035, 0.006], [0.006, 0.012], [0.005, 0.07], [0.03, 0.085], [0.038, 0.13], [0.034, 0.13], [0.026, 0.09], [0, 0.088]];
const DECANTER: [number, number][] = [[0, 0], [0.06, 0], [0.065, 0.05], [0.06, 0.13], [0.022, 0.19], [0.018, 0.24], [0.026, 0.25], [0.02, 0.26], [0.012, 0.3], [0, 0.3]];
const BOWL: [number, number][] = [[0, 0], [0.04, 0], [0.045, 0.01], [0.11, 0.07], [0.1, 0.072], [0, 0.02]];

/** A brass étagère of four glass shelves: decanters, goblets and bowls, clear, ruby and green. */
prop({
  id: "crystal-etagere", items: [...GLASS, "crystal"], size: [0.8, 1.72, 0.4], place: "floor", where: "set", tris: 5600,
  parts: () => {
    const by: Record<string, Solid[]> = { glass: [], "glass-ruby": [], "glass-green": [] };
    const tints = ["glass", "glass-ruby", "glass", "glass-green", "glass"];
    [0.25, 0.7, 1.15, 1.6].forEach((y, s) => [-0.3, -0.15, 0, 0.15, 0.3].forEach((x, i) => {
      const kind = s === 3 ? GOBLET : [GOBLET, DECANTER, BOWL][(i + s) % 3], z = i % 2 ? -0.06 : 0.05;
      by[tints[(i + s * 2) % 5]].push(lathe(kind, x, y + 0.012, z, 12));
    }));
    return [
      { mat: "wood-dark", solid: box(0.8, 0.05, 0.4) },
      { mat: "brass", solid: union(...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => post(0.012, 1.68, sx * 0.37, 0.05, sz * 0.17)))), overlap: true },
      { mat: "glass-plate", solid: union(...[0.25, 0.7, 1.15, 1.6].map((y) => box(0.78, 0.012, 0.38, 0, y, 0))), overlap: true },
      ...Object.entries(by).map(([mat, s]) => ({ mat, solid: union(...s), overlap: true })),
    ];
  },
});

/** A silver coffee service on its oval tray: the pot with spout and handle, the sugar bowl, the cream jug. */
prop({
  id: "silver-tray", items: [...GLASS, "silver"], size: [0.52, 0.28, 0.36], place: "on", where: "set", tris: 1600,
  parts: () => [
    { mat: "steel-bright", solid: union(
      lathe([[0, 0], [0.17, 0], [0.18, 0.02], [0.17, 0.02], [0, 0.008]], 0, 0, 0, 24).scale(1.45, 1, 1),
      lathe([[0, 0], [0.06, 0], [0.065, 0.03], [0.07, 0.12], [0.055, 0.18], [0.03, 0.2], [0.034, 0.21], [0.01, 0.235], [0, 0.24]], -0.1, 0.02, 0, 16),
      bar([-0.04, 0.1, 0], [0.0, 0.18, 0], 0.007), bar([-0.165, 0.06, 0], [-0.17, 0.17, 0], 0.007),
      lathe([[0, 0], [0.04, 0], [0.05, 0.05], [0.045, 0.08], [0.012, 0.09], [0, 0.1]], 0.1, 0.02, 0.07, 14),
      lathe([[0, 0], [0.03, 0], [0.04, 0.06], [0.035, 0.1], [0, 0.1]], 0.1, 0.02, -0.07, 14),
    ) },
  ],
});

/** An open canteen of cutlery: the walnut case and lid lined in velvet, thirty pieces in three rows. */
prop({
  id: "cutlery-case", items: [...GLASS, "silver"], size: [0.46, 0.36, 0.36], place: "on", where: "set", tris: 500,
  parts: () => [
    { mat: "wood-dark", solid: union(box(0.44, 0.06, 0.32, 0, 0, 0.02), box(0.44, 0.3, 0.02, 0, 0.06, -0.15)) },
    { mat: "plush", solid: union(box(0.42, 0.004, 0.3, 0, 0.06, 0.02), box(0.4, 0.26, 0.004, 0, 0.08, -0.138)), overlap: true },
    { mat: "steel-bright", solid: union(...[0.1, 0.02, -0.06].flatMap((z) => Array.from({ length: 10 }, (_, i) => box(0.012, 0.005, 0.1, -0.18 + i * 0.04, 0.064, z)))), overlap: true },
  ],
});

/** Three decanters, clear, ruby and green, and two goblets before them. */
prop({
  id: "decanter-row", items: [...GLASS, "crystal"], size: [0.62, 0.32, 0.16], place: "on", where: "set", tris: 1500,
  parts: () => [
    { mat: "glass", solid: union(lathe(DECANTER, -0.22, 0, -0.01, 14), lathe(GOBLET, -0.11, 0, 0.045, 12), lathe(GOBLET, 0.11, 0, 0.045, 12)) },
    { mat: "glass-ruby", solid: lathe(DECANTER, 0, 0, -0.01, 14) },
    { mat: "glass-green", solid: lathe(DECANTER, 0.22, 0, -0.01, 14) },
  ],
});

/** The wall unit: a cupboard to 0.85 m, a mirrored back over it with glass shelves, rows of goblets on three levels. */
prop({
  id: "glass-shelves", items: [...GLASS, "crystal"], size: [1.8, 2.3, 0.4], place: "wall", where: "set", tris: 6000,
  parts: () => {
    const gl = [];
    for (const y of [0.85, 1.26, 1.71]) for (let i = 0; i < 9; i++) gl.push(lathe(i === 4 ? DECANTER : GOBLET, -0.72 + i * 0.18, y, -0.04, 8));
    return [
      { mat: "wood-dark", solid: union(box(1.8, 0.85, 0.4), box(0.04, 1.4, 0.3, -0.88, 0.85, -0.05), box(0.04, 1.4, 0.3, 0.88, 0.85, -0.05), box(1.84, 0.08, 0.34, 0, 2.2, -0.04)) },
      { mat: "mirror", solid: box(1.72, 1.35, 0.01, 0, 0.85, -0.19), overlap: true },
      { mat: "glass-plate", solid: union(box(1.72, 0.01, 0.28, 0, 1.25, -0.04), box(1.72, 0.01, 0.28, 0, 1.7, -0.04)), overlap: true },
      { mat: "glass", solid: union(...gl), overlap: true },
    ];
  },
});

export const KIT_GOODS = true;
