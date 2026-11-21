// Hotel room kit: a guest's room on the upper floors of the Friedrichstraße and Linden hotels in the war winter
// (research/catalogue/rooms.ts "hotel-room"). The big houses (Adlon, Bristol, Kaiserhof, Central-Hotel) furnished every
// room alike: a brass bedstead made up in white, a washstand on marble, a mirrored wardrobe, a rug, a round table, an
// electric light, a writing table with the house's paper. In 1917-18 many of the guests were officers on leave or on
// business for the war offices, so a greatcoat and a cap hang on the stand (the room's war item).
import { sdf } from "raea/3d";
import { ball, box, lathe, post, rbox, rodX, rodZ, taper, union } from "./geo";
import { prop } from "./prop";

/** The brass bedstead: head and foot frames of tube, spindles and ball finials, made up in white with a bolster and a
 *  pillow, the eiderdown folded at the foot. Its length runs along z, the head at -z. */
prop({
  id: "hotel-bed", items: ["hotel-bed"], size: [1.05, 1.4, 2.05], place: "corner", tris: 14000,
  parts: () => {
    const r = 0.016, end = (z: number, h: number) => union(
      post(0.022, h, -0.5, 0, z), post(0.022, h, 0.5, 0, z),
      ball(0.04).move(-0.5, h + 0.02, z), ball(0.04).move(0.5, h + 0.02, z),
      rodX(r, 1.0, 0, h - 0.06, z), rodX(r, 1.0, 0, h - 0.24, z), rodX(r, 1.0, 0, 0.42, z),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => post(0.009, h - 0.48, x, 0.42, z)),
    );
    return [
      { mat: "brass" as const, solid: union(end(-1.0, 1.35), end(1.0, 0.95)) },
      { mat: "iron" as const, solid: union(rodZ(0.012, 1.96, -0.48, 0.3, 0), rodZ(0.012, 1.96, 0.48, 0.3, 0)) },
      { mat: "linen-grey" as const, solid: rbox(0.94, 0.16, 1.9, 0.04, 0, 0.3, 0) },
      // the white cover drawn smooth over the mattress, turned down at the head over the sheet
      { mat: "linen" as const, solid: union(sdf.box(0.98, 0.1, 1.52, 0.04).move(0, 0.51, 0.18).displace(0.006, 3, 2, 3).solid(0.04).simplify(0.01), sdf.box(0.82, 0.16, 0.42, 0.07).move(0, 0.6, -0.68).displace(0.008, 4, 3, 5).solid(0.04).simplify(0.01), rodX(0.07, 0.9, 0, 0.53, -0.9)) },
      // the eiderdown folded in three at the foot
      { mat: "cloth-cream" as const, solid: sdf.box(0.9, 0.16, 0.42, 0.06).move(0, 0.58, 0.72).displace(0.01, 3, 3, 4).solid(0.04).simplify(0.01) },
    ];
  },
});

/** The folding luggage stand by the wardrobe: crossed beech legs, three webbing straps, a guest's leather suitcase on
 *  it with brass locks and corners. */
prop({
  id: "luggage-rack", items: ["luggage-rack"], size: [0.72, 0.78, 0.46], place: "wall", tris: 2400,
  parts: () => {
    const leg = (x: number, a: number) => box(0.03, 0.66, 0.025).move(0, -0.33, 0).rotate(a, 0, 0).move(x, 0.3, 0);
    return [
      { mat: "wood-mid" as const, solid: union(leg(-0.32, 28), leg(-0.32, -28), leg(0.32, 28), leg(0.32, -28), rodX(0.015, 0.7, 0, 0.58, -0.14), rodX(0.015, 0.7, 0, 0.58, 0.14), rodX(0.012, 0.66, 0, 0.3, 0)) },
      { mat: "cloth-brown" as const, solid: union(...[-0.2, 0, 0.2].map((x) => box(0.05, 0.006, 0.3, x, 0.585, 0))) },
      { mat: "leather" as const, solid: rbox(0.68, 0.19, 0.42, 0.02, 0, 0.59, 0) },
      { mat: "brass" as const, solid: union(box(0.04, 0.03, 0.01, -0.18, 0.72, 0.21), box(0.04, 0.03, 0.01, 0.18, 0.72, 0.21), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.04, 0.2, 0.04, sx * 0.33, 0.585, sz * 0.2)))) },
      { mat: "leather" as const, solid: rodX(0.012, 0.16, 0, 0.8, 0) },
    ];
  },
});

/** A writing table against the wall: four turned legs, a drawer, a leather top with the blotter, the inkstand, and a
 *  few sheets of the house's notepaper. */
prop({
  id: "writing-table", items: ["writing-table"], size: [1.0, 0.86, 0.58], place: "wall", tris: 3000,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(box(1.0, 0.05, 0.58, 0, 0.72, 0), box(0.94, 0.12, 0.52, 0, 0.6, 0), ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => taper(0.025, 0.018, 0.6, sx * 0.44, 0, sz * 0.24)))) },
    { mat: "leather" as const, solid: box(0.86, 0.004, 0.44, 0, 0.77, 0) },
    { mat: "card" as const, solid: box(0.46, 0.012, 0.32, 0.06, 0.774, 0.04) },
    { mat: "paper" as const, solid: union(box(0.21, 0.004, 0.29, 0.06, 0.786, 0.05), box(0.15, 0.03, 0.1, -0.34, 0.774, -0.16)) },
    { mat: "brass" as const, solid: union(box(0.26, 0.015, 0.14, -0.3, 0.774, 0.02), rodX(0.004, 0.16, -0.3, 0.8, 0.07).rotate(0, 15, 0)) },
    { mat: "glass-dark" as const, solid: union(lathe([[0, 0], [0.03, 0], [0.032, 0.05], [0.012, 0.06], [0, 0.06]], -0.36, 0.789, 0.0), lathe([[0, 0], [0.03, 0], [0.032, 0.05], [0.012, 0.06], [0, 0.06]], -0.24, 0.789, 0.0)) },
  ],
});

/** The officer on leave: a bentwood stand by the door with his field-grey greatcoat, its two rows of buttons, the
 *  peaked cap on the top hook, and the sabre in its scabbard leaned against it. */
prop({
  id: "officer-stand", items: ["officer-leave"], size: [0.62, 1.95, 0.55], place: "wall", tris: 3600,
  parts: () => [
    { mat: "wood-dark" as const, solid: union(post(0.022, 1.82, 0, 0.04, 0), ...[0, 120, 240].map((a) => box(0.03, 0.03, 0.3, 0, 0, 0).move(0, 0, 0.15).rotate(0, a, 0)), ...[0, 90, 180, 270].map((a) => rodZ(0.012, 0.16, 0, 0, 0.08).rotate(-25, a, 0).move(0, 1.74, 0))) },
    // the greatcoat hung by its loop on the front hook: flat as cloth hangs, narrow at the hanging shoulders and full
    // at the hem (knee height on a man, 0.6 m off the floor here), the sleeves hanging at its sides, the collar up
    { mat: "cloth-field" as const, solid: union(taper(0.25, 0.17, 1.0, 0, 0.6, 0).scale(1, 1, 0.36).move(0, 0, 0.2), rbox(0.36, 0.1, 0.12, 0.04, 0, 1.55, 0.2), ...[-1, 1].map((s) => taper(0.055, 0.045, 0.62, 0, 0, 0).rotate(0, 0, s * 4).move(s * 0.2, 0.98, 0.2)), box(0.2, 0.09, 0.05, 0, 1.6, 0.17)) },
    { mat: "brass" as const, solid: union(...[0, 1, 2, 3, 4, 5].flatMap((i) => [-0.06, 0.06].map((x) => ball(0.011).move(x * (1 + i * 0.08), 1.48 - i * 0.12, 0.2 + 0.062 + i * 0.0032)))) },
    // the cap on the stand's top: crown, its red band and the black visor
    { mat: "cloth-field" as const, solid: taper(0.125, 0.135, 0.045, 0, 1.895, 0) },
    { mat: "paint-red" as const, solid: taper(0.105, 0.105, 0.035, 0, 1.86, 0) },
    { mat: "cloth-black" as const, solid: box(0.15, 0.008, 0.07).rotate(12, 0, 0).move(0, 1.86, 0.12) },
    // the sabre leaned against the stand: its chape on the floor 0.28 m out, the hilt against the post at 0.9 m
    { mat: "steel-bright" as const, solid: box(0.03, 0.92, 0.012).rotate(0, 0, 10).move(0.28, 0, 0.2) },
    { mat: "brass" as const, solid: union(box(0.07, 0.02, 0.02).rotate(0, 0, 10).move(0.125, 0.86, 0.2), ball(0.02).move(0.105, 0.97, 0.2)) },
  ],
});

export const KIT_HOTELROOM = true;
