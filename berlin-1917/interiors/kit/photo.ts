// The photographer (research/catalogue: shop-photo, 21 storefronts on the three streets read). In front, the
// reception: the walls hung with portraits in their frames, a big one on an easel in the window. Behind, the studio
// under electric light: a painted backdrop on its roller, a posing column and chair, the bellows camera on its stand.
// In the war the trade lived on the soldiers: a portrait in field grey before the train, and for the families the same
// portrait again with a black ribbon. So most of the sitters on these walls wear field grey. interiors/photo.ts lays
// the room out.
import { box, lathe, post, rodX, union, zcyl } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

const PHOTO = ["shop-photo"];

/** One portrait in its frame, face out at z: the frame, the mount, the sitter in a vignette (his coat, his face). */
function portrait(w: number, h: number, x: number, y: number, z: number, coat: string) {
  const r = Math.min(w, h) * 0.3, cy = y + h * 0.48;
  return {
    frame: box(w, h, 0.02, x, y, z),
    mount: box(w - 0.03, h - 0.03, 0.004, x, y + 0.015, z + 0.011),
    coat: { mat: coat, solid: union(zcyl(r, 0.002).move(x, cy - r * 0.35, z + 0.0135), box(r * 1.9, r * 0.7, 0.002, x, cy - r * 1.05, z + 0.0135)) },
    face: zcyl(r * 0.36, 0.002).move(x, cy + r * 0.38, z + 0.0145),
  };
}

/** The reception's wall: fifteen portraits in three rows, frames of three sizes, most of the sitters in field grey. */
prop({
  id: "portrait-wall", items: [...PHOTO, "portraits"], size: [1.6, 1.1, 0.04], place: "hung", tris: 2600,
  parts: () => {
    const ps = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) {
      const big = (i + j) % 4 === 0, w = big ? 0.26 : 0.2, h = big ? 0.32 : 0.26;
      ps.push(portrait(w, h, -0.64 + j * 0.32, 0.02 + i * 0.36, -0.01, (i * 5 + j) % 3 === 2 ? "cloth-black" : "cloth-field"));
    }
    const coats = ["cloth-field", "cloth-black"].map((mat) => ({ mat, solid: union(...ps.filter((p) => p.coat.mat === mat).map((p) => p.coat.solid)), overlap: true }));
    return [
      { mat: "wood-dark", solid: union(...ps.map((p) => p.frame)) },
      { mat: "card", solid: union(...ps.map((p) => p.mount)), overlap: true },
      ...coats,
      { mat: "paper", solid: union(...ps.map((p) => p.face)), overlap: true },
    ];
  },
});

/** A big portrait on an easel, for the window: a gilt frame 0.55 x 0.7 standing on the ledge, in front of the two
 *  front legs (which lean back to meet above it), the third leg behind. */
prop({
  id: "portrait-easel", items: [...PHOTO, "easel"], size: [0.7, 1.7, 0.6], place: "floor", tris: 700,
  parts: () => {
    const p = portrait(0.55, 0.7, 0, 0.75, 0.02, "cloth-field");
    return [
      { mat: "wood-mid", solid: union(bar([-0.3, 0, 0], [0, 1.65, -0.08], 0.018), bar([0.3, 0, 0], [0, 1.65, -0.08], 0.018), bar([0, 0, -0.42], [0, 1.6, -0.09], 0.018), box(0.6, 0.03, 0.08, 0, 0.72, 0)) },
      { mat: "brass", solid: p.frame, overlap: true },
      { mat: "card", solid: p.mount, overlap: true },
      { ...p.coat, overlap: true },
      { mat: "paper", solid: p.face, overlap: true },
    ];
  },
});

/** The studio camera: a bellows camera on a column stand with a crossed foot, its brass lens, the dark cloth over the back. */
prop({
  id: "studio-camera", items: [...PHOTO, "camera"], size: [0.62, 1.62, 0.9], place: "floor", tris: 1400,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.6, 0.06, 0.08, 0, 0, 0), box(0.08, 0.06, 0.6, 0, 0, 0), post(0.04, 1.06, 0, 0.06, 0), box(0.42, 0.04, 0.6, 0, 1.12, 0), box(0.36, 0.36, 0.06, 0, 1.16, -0.2), box(0.3, 0.3, 0.04, 0, 1.19, 0.25)) },
    { mat: "cloth-black", solid: union(box(0.32, 0.3, 0.4, 0, 1.19, 0.03), box(0.44, 0.46, 0.08, 0, 1.12, -0.28)), overlap: true },
    { mat: "brass", solid: union(lathe([[0, 0], [0.06, 0], [0.06, 0.12], [0.05, 0.14], [0, 0.14]], 0, 0, 0, 16).rotate(90, 0, 0).move(0, 1.34, 0.27), rodX(0.006, 0.38, 0, 1.12, 0.29)), overlap: true },
  ],
});

/** The painted backdrop: a canvas 3 m wide on its roller, a park in soft greys (a balustrade, trees, a sky), to the floor. */
prop({
  id: "backdrop", items: [...PHOTO, "backdrop"], size: [3.0, 3.1, 0.14], place: "wall", tris: 600,
  parts: () => [
    { mat: "wood-dark", solid: union(rodX(0.06, 3.0, 0, 3.0, 0), box(0.06, 0.12, 0.08, -1.47, 2.94, -0.03), box(0.06, 0.12, 0.08, 1.47, 2.94, -0.03)) },
    { mat: "canvas", solid: box(2.9, 2.94, 0.01, 0, 0, 0.0), overlap: true },
    { mat: "linen-grey", solid: union(box(2.9, 0.9, 0.004, 0, 0.0, 0.008), box(0.7, 1.2, 0.004, -0.95, 1.0, 0.008), box(0.9, 1.0, 0.004, 0.9, 1.15, 0.008)), overlap: true },
    { mat: "wood-grey", solid: union(box(2.9, 0.06, 0.003, 0, 0.88, 0.011), ...[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((x) => box(0.06, 0.4, 0.003, x, 0.5, 0.011))), overlap: true },
  ],
});

/** The posing column: a plaster column to lean on, a fern in a pot on top. */
prop({
  id: "posing-column", items: [...PHOTO, "posing"], size: [0.36, 1.3, 0.36], place: "floor", tris: 900,
  parts: () => [
    { mat: "marble", solid: lathe([[0, 0], [0.18, 0], [0.18, 0.08], [0.12, 0.12], [0.11, 0.95], [0.16, 1.0], [0.16, 1.05], [0, 1.05]], 0, 0, 0, 16) },
    { mat: "terracotta", solid: lathe([[0, 0], [0.07, 0], [0.09, 0.12], [0, 0.12]], 0, 1.05, 0, 12), overlap: true },
    { mat: "leaf", solid: union(...[0, 1, 2, 3, 4].map((k) => bar([0, 1.15, 0], [0.16 * Math.cos(k * 1.26), 1.29, 0.16 * Math.sin(k * 1.26)], 0.012))), overlap: true },
  ],
});

/** The studio's electric lamp: a round reflector 0.6 m across on a stand, turned on the sitter. */
prop({
  id: "studio-lamp", items: [...PHOTO, "studio-lamp"], size: [0.62, 1.9, 0.5], place: "floor", tris: 700,
  glow: [{ at: [0, 1.55, 0.12], lumens: 900, color: "#f4ecd8", range: 6 }],
  parts: () => [
    { mat: "iron", solid: union(box(0.5, 0.04, 0.06, 0, 0, 0), box(0.06, 0.04, 0.5, 0, 0, 0), post(0.02, 1.5, 0, 0.04, 0)) },
    { mat: "zinc", solid: lathe([[0.05, 0], [0.18, 0.06], [0.28, 0.16], [0.3, 0.2], [0.29, 0.2], [0.17, 0.07], [0.04, 0.01]], 0, 0, 0, 20).rotate(90, 0, 0).move(0, 1.55, -0.08), overlap: true },
  ],
});

export const KIT_PHOTO = true;
