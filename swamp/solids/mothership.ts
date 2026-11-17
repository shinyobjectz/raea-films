// The mothership's solid: the hull in its decks with panel grooves, the bridge tower, and the steel parts (engines,
// trim thrusters, antenna boom, nose cap, mast) and the lens pod, from the plan in components/ship-plan.ts. It is the
// source of blender/mothership.py, which bevels, plates and fits it out:
//   raea solid export solids/mothership.ts -o out/ship/hull.glb --part hull   (and steel, lens, stripe)
import { type CrossSection, type Solid, crossSection, manifold } from "raea/3d";
import { ANT, ANT_DIR, ANT_MID, CORE, DECKS, ENGINE, ENGINES, EYE, GLASS_R, K, KEELS, LENS_POD, LENS_R, PTS, STEM, STEM_DEG, TOWER, TRENCH, TRIM, TRIMS } from "../components/ship-plan";

const OUT = crossSection.polygon(PTS);
const inset = (d: number) => (d === 0 ? OUT : OUT.offset(-d, { join: "miter" }));
const slab = (cs: CrossSection, z0: number, z1: number) => cs.extrude(z1 - z0).move(0, 0, z0);
/** top view to the ship's space: mirrored, then laid flat with h up */
const toShip = (s: Solid) => s.mirror(1, 0, 0).rotate(-90, 0, 0);

// ---- the hull
const C = CORE.chamfer;
const towerFoot = (k: number) => {
  const [w, d] = TOWER.tiers[k];
  return crossSection.rect(w, d).move(TOWER.at[0], TOWER.at[1]);
};
const TRENCH_RING = OUT.offset(2, { join: "round" }).minus(inset(TRENCH.depth));
const HULL_RAW = manifold.union(
  slab(inset(C), CORE.z[0] - C, CORE.z[0]),
  slab(OUT, CORE.z[0], CORE.z[1]),
  slab(inset(C), CORE.z[1], CORE.z[1] + C),
  ...DECKS.map((d) => slab(inset(d.inset), d.z[0], d.z[1])),
  ...KEELS.map((k) => slab(inset(k.inset), k.z[0], k.z[1])),
  ...TOWER.tiers.map(([, , z0, z1], k) => slab(towerFoot(k), z0, z1)),
).minus(slab(TRENCH_RING, TRENCH.z[0], TRENCH.z[1]));

// panel grooves, 1.2 m wide and 0.8 m deep, on every face that looks up or down, kept 1.5 m clear of its edges
const grid = (shift: number) =>
  crossSection.rect(1.2, 1600).move(-60 + shift, -300).union(
    ...Array.from({ length: 22 }, (_, i) => crossSection.rect(1.2, 1600).move(-34 + shift + i * 26, -300)),
    ...Array.from({ length: 21 }, (_, j) => crossSection.rect(1600, 1.2).move(200, -6 - j * 34 - shift * 0.6)),
  );
const LENS_FOOT = crossSection.circle(LENS_R + 2, 96).move(EYE[0], EYE[1]);
const TOWER_FOOT = towerFoot(0).offset(2);
const faces: { region: CrossSection; z: number; up: boolean }[] = [
  { region: inset(C).minus(inset(DECKS[0].inset)), z: CORE.z[1] + C, up: true },
  ...DECKS.map((d, k) => ({ region: (k + 1 < DECKS.length ? inset(d.inset).minus(inset(DECKS[k + 1].inset)) : inset(d.inset)).minus(TOWER_FOOT), z: d.z[1], up: true })),
  { region: inset(C).minus(inset(KEELS[0].inset), LENS_FOOT), z: CORE.z[0] - C, up: false },
  ...KEELS.map((k, i) => ({ region: (i + 1 < KEELS.length ? inset(k.inset).minus(inset(KEELS[i + 1].inset)) : inset(k.inset)).minus(LENS_FOOT), z: k.z[0], up: false })),
];
const GROOVES = manifold.union(
  ...faces.map((f, k) => {
    const cut = grid(k * 9).intersect(f.region.offset(-1.5));
    return f.up ? slab(cut, f.z - 0.8, f.z + 1) : slab(cut, f.z - 1, f.z + 0.8);
  }),
);
const HULL = HULL_RAW.minus(GROOVES);

// ---- steel
/** a bell nozzle along +z, centred, hollow from its exit */
const bell = (r1: number, r2: number, h: number) => manifold.cone(r1, r2, h).minus(manifold.cone(r1 * 0.72, r2 * 0.88, h).move(0, 0, 1.5));
const ENGINE_BELLS = ENGINES.map(([x, y]) => {
  const c = ENGINE.length / 2 - 3; // three metres of the throat inside the hull
  return manifold.union(bell(ENGINE.throat, ENGINE.exit, ENGINE.length), manifold.cylinder(ENGINE.throat + 3, 8).move(0, 0, -ENGINE.length / 2 + 1))
    .rotate(90, 0, 0).rotate(0, 0, STEM_DEG).move(x + STEM[0] * c, y + STEM[1] * c, ENGINE.h);
});
const TRIM_BELLS = TRIMS.map(({ x, edge }) => bell(TRIM.throat, TRIM.exit, TRIM.length).rotate(90, 0, 0).move(x, edge + 3 - TRIM.length / 2, TRIM.h));
const BOOM = manifold.union(
  manifold.cylinder(ANT.r, ANT.length).rotate(90, 0, 0).rotate(0, 0, -28).move(ANT_MID[0], ANT_MID[1], ANT.h),
  // its mount on the wing, and collars along it
  manifold.cylinder(9, 12).move(ANT_MID[0] - (ANT_DIR[0] * ANT.length) / 2 + 4, ANT_MID[1] - (ANT_DIR[1] * ANT.length) / 2 + 6, ANT.h),
  ...[0.15, 0.45, 0.75].map((t) => manifold.cylinder(ANT.r * 1.6, 3).rotate(90, 0, 0).rotate(0, 0, -28).move(ANT_MID[0] + ANT_DIR[0] * ANT.length * (t - 0.5), ANT_MID[1] + ANT_DIR[1] * ANT.length * (t - 0.5), ANT.h)),
);
const NOSE = slab(OUT.intersect(crossSection.circle(0.055 * K, 96)), CORE.z[0] - C, CORE.z[1] + C);
const MAST = manifold.union(
  manifold.cylinder(2.4, TOWER.mast[1] - TOWER.mast[0]).move(TOWER.at[0], TOWER.at[1], (TOWER.mast[0] + TOWER.mast[1]) / 2),
  ...[120, 146, 168].map((h, i) => manifold.box(26 - i * 7, 1.6, 1.6).move(TOWER.at[0], TOWER.at[1], h)),
);
const STEEL = manifold.union(...ENGINE_BELLS, ...TRIM_BELLS, BOOM, NOSE, MAST);

// ---- the lens pod: a steel drum from the core's underside, ringed, the glass recessed in its face
const POD_H = LENS_POD[1] - LENS_POD[0];
const LENS = manifold.cylinder(LENS_R, POD_H).move(EYE[0], EYE[1], (LENS_POD[0] + LENS_POD[1]) / 2)
  .minus(
    manifold.cylinder(GLASS_R, 8).move(EYE[0], EYE[1], LENS_POD[0]),
    ...[-25, -31, -37].map((h) => manifold.cylinder(LENS_R + 1, 1.2).minus(manifold.cylinder(LENS_R - 0.8, 2)).move(EYE[0], EYE[1], h)),
  );

// ---- the robot's orange stripe, on the keel's underside as on the robot's face
const STRIPE = slab(crossSection.rect(0.09 * K, 0.012 * K).rotate(23.7).move(0.146 * K, -0.348 * K).intersect(inset(KEELS[0].inset + 1)), KEELS[0].z[0] - 0.3, KEELS[0].z[0] + 0.3);

export default { hull: toShip(HULL), steel: toShip(STEEL), lens: toShip(LENS), stripe: toShip(STRIPE) };
