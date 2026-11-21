// Body and work kit: what a household washes, relieves itself, launders, earns and learns with, and the clubs it
// belongs to. These are the things the people's days will use (interiors/plan/uses.ts says what each is for):
//   washing:  the kitchen's Ausguss (a cast-iron sink and its one cold tap), the zinc tub for Saturday's bath in the
//             kitchen, the good flat's bathroom (an enamelled tub on claw feet, the Badeofen that heats it)
//   the toilet: the WC with its high cistern and pull chain (in a good flat; the workers' on the half landing), the
//             chamber pot under the bed for the night
//   laundry:  the wash kitchen in the attic or the court, with its copper over a brick hearth, the tubs and
//             washboard, the mangle
//   homework: the Konfektion's coats sewn at home and carried back in bundles, artificial flowers made at the kitchen
//             table, cigars rolled (the Heimarbeit exhibition of 1906 showed all three in Berlin)
//   school:   the satchel with its slate and sponge on a cord; the toys (the war's tin soldiers and cannon, a good
//             nursery's rocking horse)
//   clubs:    the reservist's stein, the club's group photograph (choir, gymnasts, cyclists), the gymnast's clubs, the
//             stamp album, the amateur's folding camera, the freethinker's Haeckel
// Every prop stands on y = 0 centred on x and z, its front to +z (a hung one's back against the wall at -d/2).
import { ball, box, lathe, post, rbox, ring, rodX, rodZ, taper, union, zcyl } from "./geo";
import { bust, frame, sheet } from "./home";
import { prop } from "./prop";

// ---- washing and the toilet ----

/** The kitchen's Ausguss: a cast-iron basin enamelled grey on two brackets, the pipe up the wall, one brass tap. */
prop({
  id: "kitchen-sink", items: ["kitchen-sink", "water-tap"], size: [0.56, 1.2, 0.4], place: "wall", tris: 500,
  parts: () => [
    { mat: "enamel", solid: union(box(0.52, 0.02, 0.36, 0, 0.72, 0.01), box(0.52, 0.14, 0.02, 0, 0.72, 0.18), box(0.02, 0.14, 0.36, -0.25, 0.72, 0.01), box(0.02, 0.14, 0.36, 0.25, 0.72, 0.01), box(0.52, 0.2, 0.02, 0, 0.72, -0.17)) },
    { mat: "iron", solid: union(box(0.03, 0.12, 0.3, -0.2, 0.6, -0.02), box(0.03, 0.12, 0.3, 0.2, 0.6, -0.02), post(0.016, 0.72, -0.1, 0, -0.17), post(0.012, 0.36, 0.12, 0.84, -0.18)) },
    { mat: "brass", solid: union(rodZ(0.012, 0.16, 0.12, 1.18, -0.1), taper(0.012, 0.008, 0.06, 0.12, 1.12, -0.02), box(0.06, 0.012, 0.012, 0.12, 1.23, -0.12)) },
  ],
});

/** The zinc tub for the Saturday bath, hung on its nail by the range: an oval tub on its side, the bottom to the wall. */
prop({
  id: "zinc-tub", items: ["zinc-tub", "washtub-zinc"], size: [0.98, 0.64, 0.36], place: "hung", tris: 900,
  parts: () => [
    { mat: "zinc", solid: lathe([[0, 0], [0.28, 0], [0.3, 0.33], [0.315, 0.345], [0.3, 0.35], [0.283, 0.02], [0, 0.02]]).scale(1.6, 1, 1).rotate(90, 0, 0).move(0, 0.32, -0.175) },
    { mat: "zinc", solid: union(ring(0.035, 0.006).rotate(90, 0, 0).move(-0.5, 0.32, 0.1), ring(0.035, 0.006).rotate(90, 0, 0).move(0.5, 0.32, 0.1)) },
  ],
});

/** A good flat's bath: an enamelled cast-iron tub with a rolled rim on four claw feet. */
prop({
  id: "bathtub", items: ["bathroom", "bathtub"], size: [1.7, 0.66, 0.76], place: "wall", tris: 1800,
  parts: () => [
    { mat: "enamel", solid: union(rbox(1.66, 0.46, 0.72, 0.16, 0, 0.14, 0), rbox(1.7, 0.06, 0.76, 0.03, 0, 0.6, 0)) },
    // the water's face just under the rim: a filled tub reads as a tub without cutting it hollow
    { mat: "glass-dark", solid: rbox(1.56, 0.01, 0.6, 0.02, 0, 0.62, 0), overlap: true },
    { mat: "brass", solid: union(...[-0.7, 0.7].flatMap((x) => [-0.26, 0.26].map((z) => ball(0.05).scale(1, 0.9, 1.2).move(x, 0.05, z)))) },
    { mat: "brass", solid: union(post(0.014, 0.18, -0.74, 0.62, -0.2), rodZ(0.012, 0.14, -0.74, 0.8, -0.13)), overlap: true },
  ],
});

/** The Badeofen that heats the bath: a copper cylinder on a cast-iron firebox, the flue up to the ceiling. */
prop({
  id: "bath-heater", items: ["bath-heater"], size: [0.44, 2.4, 0.44], place: "corner", tris: 900,
  parts: () => [
    { mat: "iron", solid: union(post(0.2, 0.5, 0, 0, 0), box(0.16, 0.12, 0.04, 0, 0.18, 0.2)) },
    { mat: "copper", solid: union(post(0.19, 1.25, 0, 0.5, 0), lathe([[0, 0], [0.19, 0], [0.12, 0.12], [0.06, 0.16], [0, 0.16]], 0, 1.75, 0)) },
    { mat: "iron", solid: post(0.06, 0.5, 0, 1.9, 0) },
    { mat: "brass", solid: union(rodZ(0.012, 0.2, 0, 0.62, 0.26), post(0.01, 0.06, 0, 0.6, 0.36)), overlap: true },
  ],
});

/** The WC: a pedestal bowl with a wooden seat, the cistern high on the wall with its pipe and chain, cut newspaper on a nail. */
prop({
  id: "wc", items: ["toilet-in-room", "wc"], size: [0.5, 2.3, 0.62], place: "wall", tris: 1100,
  parts: () => [
    { mat: "enamel", solid: lathe([[0, 0], [0.13, 0], [0.11, 0.18], [0.17, 0.36], [0.19, 0.4], [0, 0.4]]).scale(1, 1, 1.35).move(0, 0, 0.06) },
    { mat: "wood-mid", solid: ring(0.17, 0.025).rotate(90, 0, 0).scale(1, 1, 1.3).move(0, 0.42, 0.06) },
    { mat: "iron", solid: union(box(0.42, 0.24, 0.2, 0, 1.9, -0.2), post(0.022, 1.5, 0, 0.4, -0.27)) },
    { mat: "iron", solid: union(post(0.004, 0.5, 0.16, 1.4, -0.1), ball(0.022).move(0.16, 1.4, -0.1)), overlap: true },
    { mat: "paper", solid: box(0.13, 0.17, 0.02, -0.21, 0.82, -0.29), overlap: true },
  ],
});

/** The chamber pot under the bed: white enamel, a blue rim, a lid and a handle. */
prop({
  id: "chamber-pot", items: ["chamber-pot"], size: [0.3, 0.2, 0.25], place: "floor", tris: 600,
  parts: () => [
    { mat: "enamel", solid: lathe([[0, 0], [0.08, 0], [0.11, 0.06], [0.11, 0.13], [0.12, 0.155], [0, 0.155]]) },
    { mat: "enamel-blue", solid: union(lathe([[0.1, 0.15], [0.125, 0.15], [0.125, 0.165], [0.1, 0.165]]), lathe([[0, 0.165], [0.11, 0.165], [0.05, 0.19], [0, 0.19]])) },
    { mat: "enamel", solid: ring(0.04, 0.008).move(0.13, 0.1, 0), overlap: true },
  ],
});

/** Water carried in from the tap on the landing (a flat without a kitchen): a zinc pail with its dipper, on a stool. */
prop({
  id: "water-pail", items: ["water-pail"], size: [0.36, 0.72, 0.36], place: "floor", tris: 1400,
  parts: () => [
    { mat: "wood-raw", solid: union(box(0.34, 0.03, 0.34, 0, 0.4, 0), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => box(0.03, 0.4, 0.03, a * 0.14, 0, b * 0.14))) },
    { mat: "zinc", solid: taper(0.12, 0.14, 0.28, 0, 0.43, 0).minus(taper(0.11, 0.13, 0.28, 0, 0.45, 0)) },
    { mat: "zinc", solid: union(ring(0.14, 0.004).rotate(0, 90, 0).trim(0, 1, 0, 0).move(0, 0.71, 0), zcyl(0.008, 0.3).rotate(0, 90, 0).rotate(0, 0, 50).move(0.06, 0.66, 0)), overlap: true },
  ],
});

// ---- laundry ----

/** The wash kitchen's copper: a copper boiler set in a whitewashed brick hearth, a wooden lid, the fire door below. */
prop({
  id: "wash-copper", items: ["wash-copper", "laundry-room"], size: [0.9, 0.95, 0.9], place: "corner", tris: 700,
  parts: () => [
    { mat: "brick-wash", solid: rbox(0.9, 0.86, 0.9, 0.04) },
    { mat: "copper", solid: lathe([[0.34, 0.86], [0.36, 0.86], [0.36, 0.9], [0.34, 0.9]]) },
    { mat: "wood-raw", solid: union(zcyl(0.35, 0.03).rotate(90, 0, 0).move(0, 0.92, 0), box(0.24, 0.04, 0.05, 0, 0.94, 0)) },
    { mat: "iron", solid: box(0.26, 0.2, 0.02, 0, 0.16, 0.45) },
  ],
});

/** A wooden washtub on its bench, the zinc washboard standing in it. */
prop({
  id: "washtub", items: ["washtub", "washboard", "laundry"], size: [1.0, 0.95, 0.55], place: "wall", tris: 800,
  parts: () => [
    { mat: "wood-grey", solid: union(box(1.0, 0.05, 0.5, 0, 0.45, 0), ...[-0.44, 0.44].flatMap((x) => [-0.2, 0.2].map((z) => box(0.05, 0.45, 0.05, x, 0, z)))) },
    { mat: "wood-raw", solid: lathe([[0, 0], [0.22, 0], [0.26, 0.3], [0.27, 0.3], [0.27, 0.32], [0.24, 0.32], [0.21, 0.03], [0, 0.03]], -0.2, 0.5, 0) },
    { mat: "zinc", solid: box(0.3, 0.42, 0.015, -0.2, 0.62, -0.05).rotate(-12, 0, 0) },
    { mat: "linen", solid: rbox(0.36, 0.12, 0.3, 0.05, 0.28, 0.5, 0) },
  ],
});

/** A roller mangle: two wooden rollers in a cast-iron frame, a crank wheel, a board to feed the wash. */
prop({
  id: "mangle", items: ["mangle"], size: [0.7, 1.15, 0.5], place: "wall", tris: 900,
  parts: () => [
    { mat: "iron", solid: union(box(0.05, 1.05, 0.4, -0.3, 0, 0), box(0.05, 1.05, 0.4, 0.3, 0, 0), box(0.6, 0.04, 0.04, 0, 0.3, 0.18), box(0.6, 0.04, 0.04, 0, 0.3, -0.18)) },
    { mat: "wood-raw", solid: union(rodX(0.07, 0.56, 0, 0.86, 0.02), rodX(0.07, 0.56, 0, 1.0, 0.02), box(0.56, 0.02, 0.3, 0, 0.82, 0.2)) },
    { mat: "iron", solid: union(ring(0.22, 0.012).rotate(0, 90, 0).move(0.36, 0.86, 0.02), rodX(0.012, 0.1, 0.36, 0.86, 0.02)) },
  ],
});

// ---- homework ----

/** The Konfektion's work brought home: cut pieces of coats tied in bundles, one opened, the thread and the shears. */
prop({
  id: "coat-bundles", items: ["hw-tailor", "konfektion-bundles"], size: [0.6, 0.28, 0.46], place: "on", tris: 700,
  parts: () => [
    { mat: "cloth-black", solid: union(rbox(0.42, 0.12, 0.3, 0.03, -0.06, 0, -0.04), rbox(0.36, 0.1, 0.26, 0.03, -0.04, 0.12, -0.05)) },
    { mat: "cloth-navy", solid: rbox(0.3, 0.03, 0.22, 0.01, 0.15, 0, 0.12) },
    { mat: "jute", solid: union(box(0.012, 0.13, 0.31, -0.06, 0, -0.04), box(0.43, 0.13, 0.012, -0.06, 0, -0.04)), overlap: true },
    { mat: "steel-bright", solid: union(box(0.16, 0.006, 0.02, 0.2, 0.03, 0.17).rotate(0, 20, 0), ball(0.022).move(0.24, 0.02, 0.05)), overlap: true },
  ],
});

/** Artificial flowers made at the table: a tray of cut petals, bundled wire, the finished sprays in a box. */
prop({
  id: "flower-work", items: ["hw-flowers"], size: [0.52, 0.18, 0.36], place: "on", tris: 500,
  parts: () => [
    { mat: "card", solid: union(box(0.24, 0.02, 0.18, -0.12, 0, 0.06), box(0.22, 0.08, 0.16, 0.13, 0, -0.06)) },
    { mat: "glass-ruby", solid: union(...[0, 1, 2, 3, 4, 5].map((k) => zcyl(0.014, 0.003).rotate(90, 0, 0).move(-0.2 + 0.03 * k, 0.025, 0.02 + 0.02 * (k % 3)))), overlap: true },
    { mat: "flower", solid: union(...[0, 1, 2].map((k) => ball(0.03).move(0.08 + 0.05 * k, 0.11, -0.06))), overlap: true },
    { mat: "iron", solid: rodX(0.01, 0.18, -0.12, 0.03, -0.1), overlap: true },
  ],
});

/** Cigars rolled at home: the board, the brown leaves, a wooden mould half full, the finished cigars in a row. */
prop({
  id: "cigar-work", items: ["hw-cigars"], size: [0.5, 0.1, 0.34], place: "on", tris: 300,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.3, 0.02, 0.24, -0.08, 0, 0), box(0.16, 0.05, 0.12, 0.16, 0, -0.08)) },
    { mat: "leaf", solid: union(box(0.22, 0.004, 0.12, -0.08, 0.02, 0.02).rotate(0, 8, 0), box(0.18, 0.004, 0.1, -0.1, 0.024, -0.02).rotate(0, -6, 0)), overlap: true },
    { mat: "cloth-brown", solid: union(...[0, 1, 2, 3, 4].map((k) => rodX(0.008, 0.12, 0.16, 0.06, 0.06 + 0.018 * k))), overlap: true },
  ],
});

// ---- school and toys ----

/** The school satchel on its hook: leather, the slate on a cord with its sponge, a pencil box. */
prop({
  id: "school-things", items: ["school-things", "satchel"], size: [0.32, 0.5, 0.12], place: "hung", tris: 300,
  parts: () => [
    { mat: "leather", solid: rbox(0.3, 0.24, 0.1, 0.02, 0, 0.12, 0) },
    { mat: "leather", solid: box(0.3, 0.1, 0.01, 0, 0.27, 0.05), overlap: true },
    { mat: "wood-mid", solid: box(0.22, 0.16, 0.012, 0.02, 0.0, 0.056) },
    { mat: "enamel-black", solid: box(0.19, 0.13, 0.006, 0.02, 0.015, 0.064), overlap: true },
    { mat: "sand", solid: ball(0.025).move(-0.12, 0.0, 0.06), overlap: true },
  ],
});

/** A good nursery's rocking horse: a dappled horse on curved rockers. */
prop({
  id: "rocking-horse", items: ["rocking-horse"], size: [0.9, 0.75, 0.32], place: "floor", tris: 900,
  parts: () => [
    { mat: "wood-mid", solid: union(box(0.9, 0.04, 0.03, 0, 0.0, -0.12).rotate(0, 0, 0), box(0.9, 0.04, 0.03, 0, 0.0, 0.12), box(0.04, 0.3, 0.26, -0.25, 0.02, 0), box(0.04, 0.3, 0.26, 0.25, 0.02, 0)) },
    { mat: "paint-white", solid: union(rbox(0.5, 0.18, 0.16, 0.06, 0, 0.32, 0), rbox(0.1, 0.22, 0.1, 0.03, 0.27, 0.45, 0).rotate(0, 0, -20), rbox(0.2, 0.08, 0.08, 0.03, 0.34, 0.62, 0)) },
    { mat: "leather", solid: rbox(0.16, 0.03, 0.17, 0.01, -0.02, 0.5, 0), overlap: true },
    { mat: "cloth-black", solid: union(box(0.03, 0.18, 0.03, 0.22, 0.5, 0), box(0.04, 0.16, 0.03, -0.27, 0.32, 0)), overlap: true },
  ],
});

/** The war's toys on the floor: a tin cannon on wheels, a row of tin soldiers, a toy spiked helmet. */
prop({
  id: "war-toys", items: ["war-toys"], size: [0.5, 0.14, 0.36], place: "floor", tris: 700,
  parts: () => [
    { mat: "gun-grey", solid: union(rodX(0.018, 0.2, -0.1, 0.06, 0.08).rotate(0, 0, 8), box(0.1, 0.03, 0.06, -0.16, 0.03, 0.08)) },
    { mat: "iron", solid: union(zcyl(0.035, 0.012).rotate(0, 90, 0).move(-0.15, 0.035, 0.12), zcyl(0.035, 0.012).rotate(0, 90, 0).move(-0.15, 0.035, 0.04)) },
    { mat: "cloth-field", solid: union(...[0, 1, 2, 3, 4, 5].map((k) => box(0.012, 0.05, 0.01, 0.04 + 0.03 * k, 0, -0.1))) },
    { mat: "enamel-black", solid: union(lathe([[0, 0], [0.07, 0], [0.065, 0.05], [0.04, 0.08], [0, 0.085]], 0.14, 0, 0.1), taper(0.008, 0.002, 0.04, 0.14, 0.085, 0.1)) },
  ],
});

// ---- clubs and pastimes ----

/** The reservist's stein: a porcelain mug painted with the regiment, a pewter lid with a thumb lift. */
prop({
  id: "reservist-stein", items: ["reservist-stein"], size: [0.14, 0.3, 0.16], place: "on", tris: 500,
  parts: () => [
    { mat: "paint-white", solid: lathe([[0, 0], [0.05, 0], [0.055, 0.02], [0.05, 0.2], [0, 0.2]]) },
    { mat: "zinc", solid: union(lathe([[0, 0.2], [0.056, 0.2], [0.04, 0.24], [0.02, 0.26], [0, 0.27]]), ball(0.012).move(0, 0.285, 0)) },
    { mat: "paint-white", solid: ring(0.04, 0.009).rotate(0, 90, 0).scale(1, 1.4, 1).move(0.06, 0.1, 0), overlap: true },
    { mat: "cloth-navy", solid: box(0.06, 0.06, 0.004, 0, 0.08, 0.051), overlap: true },
  ],
});

/** The club's group photograph in its long frame: three rows of members (the choir, the gymnasts, the cyclists). */
prop({
  id: "club-photo", items: ["club-photo", "choir", "turnverein", "cycling-club"], size: [0.62, 0.42, 0.03], place: "hung", tris: 1000,
  parts: () => {
    const w = 0.62, h = 0.42, t = 0.04, d = 0.03;
    const faces = [0, 1, 2].flatMap((row) => [0, 1, 2, 3, 4, 5, 6].map((k) => ({ x: -0.21 + 0.07 * k + (row % 2) * 0.03, y: 0.1 + 0.08 * row })));
    return [
      { mat: "wood-dark", solid: frame(w, h, t, d) },
      { mat: "paper", solid: sheet(w, h, t, d) },
      { mat: "cloth-black", solid: union(...faces.map((f) => box(0.05, 0.045, 0.003, f.x, f.y, -d / 2 + 0.008))), overlap: true },
      { mat: "wax", solid: union(...faces.map((f) => zcyl(0.011, 0.003).move(f.x, f.y + 0.058, -d / 2 + 0.009))), overlap: true },
    ];
  },
});

/** The gymnast's pair of wooden clubs, stood by the wall. */
prop({
  id: "indian-clubs", items: ["indian-clubs"], size: [0.3, 0.5, 0.14], place: "wall", tris: 300,
  parts: () => [
    { mat: "wood-mid", solid: union(...[-0.07, 0.07].map((x) => lathe([[0, 0], [0.04, 0.02], [0.05, 0.14], [0.03, 0.3], [0.016, 0.42], [0.022, 0.46], [0, 0.48]], x, 0, 0).rotate(0, 0, x > 0 ? -4 : 4))) },
  ],
});

/** A stamp album open on the table, the tweezers and a few loose stamps beside it. */
prop({
  id: "stamp-album", items: ["stamp-album"], size: [0.42, 0.04, 0.3], place: "on", tris: 300,
  parts: () => [
    { mat: "cloth-brown", solid: union(box(0.2, 0.02, 0.28, -0.1, 0, 0), box(0.2, 0.02, 0.28, 0.1, 0, 0)) },
    { mat: "paper", solid: union(box(0.18, 0.006, 0.26, -0.1, 0.02, 0), box(0.18, 0.006, 0.26, 0.1, 0.02, 0)), overlap: true },
    { mat: "paper-blue", solid: union(...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => box(0.022, 0.002, 0.026, -0.16 + (k % 4) * 0.04 + (k > 3 ? 0.2 : 0), 0.026, -0.06 + (k % 2) * 0.06))), overlap: true },
  ],
});

/** The amateur's folding plate camera, its bellows drawn out. */
prop({
  id: "box-camera", items: ["box-camera"], size: [0.14, 0.17, 0.22], place: "on", tris: 300,
  parts: () => [
    { mat: "leather", solid: rbox(0.14, 0.12, 0.06, 0.008, 0, 0, -0.08) },
    { mat: "cloth-black", solid: taper(0.05, 0.035, 0.12, 0, 0.06, 0).rotate(90, 0, 0).move(0, 0.06, -0.05) },
    { mat: "brass", solid: union(box(0.07, 0.07, 0.01, 0, 0.025, 0.08), zcyl(0.016, 0.02).move(0, 0.06, 0.09)) },
  ],
});

/** The freethinker's Haeckel: the old zoologist, white-bearded, in a plain black frame (the Monist League, 1906). */
prop({
  id: "freethinker-print", items: ["freethinker-print"], size: [0.34, 0.44, 0.03], place: "hung", tris: 300,
  parts: () => {
    const w = 0.34, h = 0.44, t = 0.03, d = 0.03;
    return [
      { mat: "enamel-black", solid: frame(w, h, t, d) },
      { mat: "paper", solid: sheet(w, h, t, d) },
      ...bust(w - 2 * t, t, h - t, d, "cloth-black"),
      { mat: "paint-white", solid: box(0.06, 0.07, 0.003, 0, 0.19, -d / 2 + 0.012), overlap: true },
    ];
  },
});

export const KIT_BODY = true;
