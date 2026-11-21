// Photo scans for the tree's bark and the street under it: CC0 surfaces from Poly Haven (polyhaven.com, no credit
// required; listed in map/SOURCES.md all the same), 2K, in assets/textures/cc0/ID/: diff.jpg (colour), nor_gl.jpg
// (normal, OpenGL convention), arm.jpg (ambient occlusion, roughness, metal). Fetched 11-17 for FO13, after "these do
// not look realistic" on the procedural bark and the tiled ground.
//   size  the metres one repeat of the scan covers, as Poly Haven gives its dimensions
//   mean  the colour map's mean, linear (magick -colorspace RGB -resize 1x1), to tint a scan toward a colour
import { staticFile } from "raea";

type V3 = [number, number, number];
export type Scan = { size: [number, number]; mean: V3 };

export const SCANS = {
  japanese_sycamore: { size: [1.1, 2.2], mean: [0.341, 0.3, 0.236] },
  jolcham_oak_bark_01: { size: [1.0, 2.0], mean: [0.115, 0.09, 0.054] },
  tree_bark_03: { size: [1.0, 1.0], mean: [0.292, 0.259, 0.161] },
  bark_willow_02: { size: [2.15, 2.15], mean: [0.247, 0.195, 0.152] },
  bark_brown_01: { size: [1.0, 1.0], mean: [0.195, 0.13, 0.048] },
  bark_brown_02: { size: [1.0, 1.0], mean: [0.126, 0.103, 0.061] },
  cobblestone_04: { size: [2.02, 2.02], mean: [0.127, 0.105, 0.08] },
  granite_tile: { size: [2.3, 2.3], mean: [0.077, 0.078, 0.078] },
  forest_ground_04: { size: [3.15, 3.15], mean: [0.155, 0.111, 0.066] },
  leaves_forest_ground: { size: [1.26, 1.26], mean: [0.199, 0.119, 0.046] },
  cobblestone_floor_01: { size: [1.0, 1.0], mean: [0.279, 0.228, 0.16] },
} satisfies Record<string, Scan>;
export type ScanId = keyof typeof SCANS;

// Each species' bark, chosen by eye on the scans against the species' bark (the names are the scans', not always the
// tree's: Poly Haven's "bark_platanus" is dark and pitted, its "japanese_sycamore" has a plane's flaking patches).
//   lime      grey, long shallow interlacing ridges         tree_bark_03
//   elm       deep corky ridges meeting and parting          bark_willow_02 (locust and willow the same family look)
//   plane     olive, cream and grey patches where it flakes  japanese_sycamore
//   maple     shallow fine vertical fissures                 bark_brown_01, greyed
//   chestnut  grey-brown scaly plates                        bark_brown_02
//   oak       deep vertical fissures                         jolcham_oak_bark_01 (and the black poplar)
// The birch keeps its drawn bark (look.ts kind 2): no white birch is among the scans.
export const BARK_SCAN: Record<string, ScanId> = {
  lime: "tree_bark_03", elm: "bark_willow_02", plane: "japanese_sycamore", maple: "bark_brown_01",
  chestnut: "bark_brown_02", oak: "jolcham_oak_bark_01", locust: "bark_willow_02", poplar: "jolcham_oak_bark_01",
  willow: "bark_willow_02", birch: "tree_bark_03",
};

const REPEAT = { wrap: "repeat", mipmap: "linear", anisotropy: 16 } as const;

/** A scan's three maps as a hook's textures (tex_diff, tex_nor, tex_arm), repeating, mipmapped. */
export function scanTextures(id: ScanId) {
  const map = (m: string) => ({ src: staticFile(`textures/cc0/${id}/${m}.jpg`), sampler: REPEAT });
  return { diff: map("diff"), nor: map("nor_gl"), arm: map("arm") };
}

/** The colour to multiply a scan by so its mean moves `share` of the way to `toward` (linear). */
export function tintToward(id: ScanId, toward: V3, share: number): V3 {
  const m = SCANS[id].mean;
  return m.map((c, i) => (c + (toward[i] - c) * share) / c) as V3;
}
