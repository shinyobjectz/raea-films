// Office kit: the Kontor. The Friedrichstadt was Berlin's business district: behind the front buildings' upper windows
// on Leipziger and Friedrichstraße, in the commercial houses and the ministries, people stood at sloped desks under
// green shades, copied letters in a screw press and filed them to the ceiling. Wired for electric light before the flats
// were. Catalogue group "office" (research/catalogue/interior.ts); the room is the `office` recipe.
import { crossSection, sdf, type Solid } from "raea/3d";
import { ball, box, hash, lathe, post, rbox, ring, rodX, union, zcyl } from "./geo";
import { bar } from "./porter";
import { prop } from "./prop";

/** Every part moved dz along z: a desk built from its back edge, shifted so its footprint is centred as the furnisher
 *  expects (the back on the wall at -depth / 2). */
const shift = (ps: { mat: any; solid: Solid; overlap?: boolean }[], dz: number) => ps.map((p) => ({ ...p, solid: p.solid.move(0, 0, dz) }));

/** A side profile in the z-y plane (points as [z, y]) extruded t along x from x0: a rolltop's curved cheek. */
function cheek(pts: [number, number][], t: number, x0: number): Solid {
  let p = pts.map(([z, y]): [number, number] => [-z, y]); // rotate(0, 90, 0) sends the profile's x to -z
  let a = 0;
  for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; }
  if (a < 0) p = p.reverse();
  return crossSection.polygon(p).extrude(t).rotate(0, 90, 0).move(x0, 0, 0);
}

/** A standing desk (Stehpult): a sloped lid over a well on four tall legs, a footrail, a gallery at the back, a ledger
 *  open on the lid, its high stool before it. Origin: floor, its back to the wall at z = -0.3. */
prop({
  id: "high-desk", items: ["high-desk", "stool"], size: [1.1, 1.25, 1.1], place: "wall", tris: 2500,
  parts: () => {
    const legs = [-0.5, 0.5].flatMap((x) => [-0.27, 0.27].map((z) => box(0.05, 0.92, 0.05, x, 0, z)));
    const lid = box(1.1, 0.025, 0.62, 0, 0, 0).rotate(12, 0, 0).move(0, 1.12, 0.0);
    const stool = union(box(0.34, 0.03, 0.34, 0, 0.74, 0.62), ...[-0.14, 0.14].flatMap((x) => [0.48, 0.76].map((z) => box(0.035, 0.74, 0.035, x, 0, z))), box(0.3, 0.02, 0.02, 0, 0.25, 0.48), box(0.3, 0.02, 0.02, 0, 0.25, 0.76));
    return shift([
      { mat: "wood-dark", solid: union(...legs, box(1.06, 0.2, 0.6, 0, 0.92, -0.01), lid, box(1.1, 0.07, 0.06, 0, 1.18, -0.29), rodX(0.012, 1.0, 0, 0.18, 0.25), stool) },
      { mat: "paper", solid: box(0.46, 0.012, 0.32, -0.18, 0, 0).rotate(12, 0, 0).move(0, 1.135, 0.04), overlap: true },
      { mat: "card", solid: box(0.06, 0.012, 0.34, 0.08, 0, 0).rotate(12, 0, 0).move(0, 1.13, 0.04), overlap: true },
      { mat: "glass-dark", solid: box(0.05, 0.05, 0.05, 0.38, 1.18, -0.25), overlap: true }, // the inkwell on the gallery
    ], -0.24);
  },
});

/** The principal's roll-top desk, its tambour rolled up into the curved cheeks: pigeonholes of letters, two pedestals of
 *  drawers, a blotter, and the swivel chair pushed back. Origin: floor, its back to the wall at z = -0.4. */
prop({
  id: "rolltop-desk", items: ["rolltop-desk", "ledgers"], size: [1.5, 1.12, 1.3], place: "wall", tris: 5000,
  parts: () => {
    const top = 0.76, holes: Solid[] = [], papers: Solid[] = [], drawers: Solid[] = [], knobs: Solid[] = [];
    for (let i = 0; i < 6; i++)
      for (let r = 0; r < 2; r++) {
        const x = -0.6 + i * 0.24, y = top + 0.02 + r * 0.135;
        holes.push(box(0.21, 0.115, 0.22, x, y, -0.17));
        if (hash(i, r, 41) < 0.6) papers.push(box(0.17, 0.05 + hash(i, r, 42) * 0.05, 0.18, x, y, -0.19));
      }
    for (const px of [-0.52, 0.52])
      for (let k = 0; k < 3; k++) {
        drawers.push(box(0.42, 0.2, 0.012, px, 0.08 + k * 0.215, 0.396));
        knobs.push(ball(0.012).move(px, 0.18 + k * 0.215, 0.41));
      }
    drawers.push(box(0.54, 0.07, 0.012, 0, top - 0.09, 0.396));
    const arc: [number, number][] = [[-0.4, top]];
    for (let k = 0; k <= 8; k++) { const a = (Math.PI / 2) * (k / 8); arc.push([-0.12 + 0.3 * Math.cos(a), top + 0.3 * Math.sin(a)]); }
    arc.push([-0.4, top + 0.3]);
    // the swivel chair, pushed back: a seat on a column and four feet, a bentwood back rail on three spindles
    const ch = 0.62, chair = union(
      lathe([[0, 0], [0.21, 0], [0.22, 0.03], [0, 0.03]], 0, 0.46, ch),
      post(0.025, 0.4, 0, 0.06, ch),
      ...[0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2; return bar([0, 0.08, ch], [Math.cos(a) * 0.28, 0.02, ch + Math.sin(a) * 0.28], 0.014); }),
      ring(0.2, 0.012).rotate(90, 0, 0).intersect(box(0.5, 0.1, 0.25, 0, -0.05, 0.13)).move(0, 0.78, ch),
      ...[-0.14, 0, 0.14].map((x) => bar([x, 0.49, ch + Math.sqrt(0.0441 - x * x) * 0.75], [x, 0.78, ch + Math.sqrt(0.04 - x * x)], 0.008)),
    );
    return shift([
      {
        mat: "wood-dark",
        solid: union(
          box(0.46, top - 0.02, 0.78, -0.52, 0, 0), box(0.46, top - 0.02, 0.78, 0.52, 0, 0), box(1.5, 0.03, 0.8, 0, top - 0.02, 0), box(0.58, 0.08, 0.76, 0, top - 0.1, -0.01),
          box(1.44, 0.28, 0.24, 0, top, -0.27).minus(union(...holes)), box(1.47, 0.3, 0.02, 0, top, -0.39), box(1.5, 0.025, 0.32, 0, top + 0.29, -0.25),
          cheek(arc, 0.025, -0.75), cheek(arc, 0.025, 0.725), chair,
        ),
      },
      { mat: "wood-mid", solid: union(...drawers), overlap: true },
      { mat: "brass", solid: union(...knobs), overlap: true },
      { mat: "paper", solid: union(...papers), overlap: true },
      { mat: "felt", solid: box(0.62, 0.006, 0.4, 0.05, top + 0.01, 0.14), overlap: true }, // the blotter
      { mat: "cloth-navy", solid: union(box(0.24, 0.05, 0.34, -0.42, top + 0.01, 0.12), box(0.22, 0.04, 0.31, -0.42, top + 0.06, 0.13)), overlap: true }, // ledgers
    ], -0.25);
  },
});

/** A typewriter (an upstrike machine like an Adler or a Continental): four stepped rows of round keys, the carriage
 *  and its rubber platen on top, a sheet in it. Origin: the bottom middle; the keys face +z. */
prop({
  id: "typewriter", items: ["typewriter"], size: [0.44, 0.4, 0.36], place: "on", tris: 2500,
  parts: () => {
    const keys: Solid[] = [];
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 11 - (row === 3 ? 1 : 0); k++) keys.push(box(0.015, 0.008, 0.015, -0.12 + k * 0.024 + row * 0.006, 0.05 + row * 0.022, 0.13 - row * 0.03));
    return [
      { mat: "iron", solid: union(rbox(0.32, 0.06, 0.3, 0.02, 0, 0, 0), box(0.28, 0.1, 0.16, 0, 0.04, -0.06).rotate(-18, 0, 0).move(0, 0.03, 0), rodX(0.022, 0.4, 0, 0.19, -0.08), rodX(0.006, 0.44, 0, 0.19, -0.08), box(0.36, 0.03, 0.06, 0, 0.15, -0.12)) },
      { mat: "card", solid: union(...keys), overlap: true },
      { mat: "paper", solid: box(0.21, 0.2, 0.002, 0, 0.19, -0.1).rotate(-10, 0, 0).move(0, 0, -0.02), overlap: true },
      { mat: "brass", solid: union(zcyl(0.03, 0.01).rotate(90, 0, 0).move(-0.12, 0.13, -0.05), zcyl(0.03, 0.01).rotate(90, 0, 0).move(0.12, 0.13, -0.05)), overlap: true },
    ];
  },
});

/** A copying press (Kopierpresse) on its stand: an iron frame, the screw and its wheel, the platen, a copy book under
 *  it. Origin: floor, its back to the wall at z = -0.18. */
prop({
  id: "letter-press", items: ["letter-press"], size: [0.48, 1.12, 0.38], place: "wall", tris: 3000,
  parts: () => {
    const t = 0.76;
    return [
      { mat: "wood-dark", solid: union(box(0.48, 0.03, 0.36, 0, t - 0.03, 0), ...[-0.2, 0.2].flatMap((x) => [-0.14, 0.14].map((z) => box(0.04, t - 0.03, 0.04, x, 0, z))), box(0.4, 0.02, 0.3, 0, 0.18, 0)) },
      {
        mat: "iron",
        solid: union(
          box(0.38, 0.03, 0.28, 0, t, 0), box(0.04, 0.2, 0.06, -0.17, t + 0.03, 0), box(0.04, 0.2, 0.06, 0.17, t + 0.03, 0), box(0.4, 0.05, 0.08, 0, t + 0.23, 0),
          box(0.3, 0.03, 0.22, 0, t + 0.1, 0), post(0.012, 0.22, 0, t + 0.13, 0), post(0.025, 0.05, 0, t + 0.28, 0),
          ring(0.12, 0.009).rotate(90, 0, 0).move(0, t + 0.33, 0), rodX(0.006, 0.24, 0, t + 0.33, 0), zcyl(0.006, 0.24).move(0, t + 0.33, 0),
        ),
      },
      { mat: "brass", solid: union(ball(0.016).move(0.12, t + 0.33, 0), ball(0.016).move(-0.12, t + 0.33, 0)), overlap: true },
      { mat: "cloth-black", solid: box(0.26, 0.05, 0.2, 0, t + 0.03, 0), overlap: true }, // the copy book
    ];
  },
});

/** The files (Registratur): a tall shelf case of lever-arch files, marbled board and black cloth, labels on the spines,
 *  pigeonholes of loose letters at the top. Origin: floor, its back to the wall at z = -0.2. */
prop({
  id: "file-shelf", items: ["letter-files"], size: [1.2, 2.2, 0.4], place: "wall", tris: 4000,
  parts: () => {
    const W = 1.2, H = 2.2, shelves = [0.06, 0.48, 0.9, 1.32, 1.74], board: Solid[] = [], black: Solid[] = [], labels: Solid[] = [], letters: Solid[] = [];
    shelves.slice(0, 4).forEach((y, s) => {
      let x = -W / 2 + 0.05, i = 0;
      while (x < W / 2 - 0.12) {
        const w = 0.075, h = 0.32 + (hash(s, i, 5) < 0.2 ? -0.04 : 0), gap = hash(s, i, 6) < 0.08;
        if (!gap) {
          (hash(s, i, 7) < 0.35 ? black : board).push(box(w - 0.004, h, 0.29, x + w / 2, y + 0.02, 0.02));
          labels.push(box(0.045, 0.07, 0.003, x + w / 2, y + 0.2, 0.166));
        }
        x += w; i++;
      }
    });
    for (let k = 0; k < 5; k++) if (hash(k, 9) < 0.7) letters.push(box(0.18, 0.05 + hash(k, 8) * 0.12, 0.3, -0.48 + k * 0.24, 1.76, 0.02));
    return [
      {
        mat: "wood-mid",
        solid: union(
          box(0.03, H, 0.4, -W / 2 + 0.015, 0, 0), box(0.03, H, 0.4, W / 2 - 0.015, 0, 0), box(W, 0.015, 0.4, 0, 0, -0.192), box(W, 0.04, 0.42, 0, H - 0.04, 0),
          ...shelves.map((y) => box(W - 0.06, 0.02, 0.38, 0, y, 0)), ...[-0.36, -0.12, 0.12, 0.36].map((x) => box(0.015, 0.4, 0.38, x, 1.76, 0)),
        ),
      },
      { mat: "card", solid: union(...board), overlap: true },
      { mat: "cloth-black", solid: union(...black), overlap: true },
      { mat: "paper", solid: union(...labels, ...letters), overlap: true },
    ];
  },
});

/** A safe (Geldschrank) on a wooden plinth: green paint, a brass handle and escutcheon, the maker's gilt line, two
 *  hinges. Origin: floor, its back to the wall at z = -0.3. */
prop({
  id: "safe", items: ["safe"], size: [0.72, 1.3, 0.7], place: "wall", tris: 1500,
  parts: () => [
    { mat: "wood-dark", solid: box(0.72, 0.1, 0.62, 0, 0, 0) },
    { mat: "paint-green", solid: union(rbox(0.68, 1.15, 0.58, 0.02, 0, 0.1, 0), box(0.56, 0.98, 0.012, 0, 0.18, 0.29)) },
    { mat: "brass", solid: union(rodX(0.012, 0.16, 0.12, 0.72, 0.33), box(0.012, 0.03, 0.04, 0.05, 0.705, 0.31), box(0.012, 0.03, 0.04, 0.19, 0.705, 0.31), box(0.05, 0.08, 0.006, -0.12, 0.68, 0.3), box(0.3, 0.012, 0.004, 0, 1.06, 0.3)), overlap: true },
    { mat: "iron", solid: union(post(0.014, 0.12, -0.3, 0.32, 0.3), post(0.014, 0.12, -0.3, 0.92, 0.3)), overlap: true },
  ],
});

/** A wall telephone: a wooden case with two bells on top, the mouthpiece on its arm, the earpiece on its hook, the crank,
 *  a writing shelf under it. Origin: the bottom middle on the wall. */
prop({
  id: "telephone-wall", items: ["telephone"], size: [0.26, 0.46, 0.26], place: "hung", tris: 1500,
  parts: () => shift([
    { mat: "wood-mid", solid: union(box(0.22, 0.3, 0.1, 0, 0.12, 0), box(0.26, 0.02, 0.16, 0, 0.06, 0.03)) },
    { mat: "brass", solid: union(lathe([[0, 0], [0.04, 0], [0.035, 0.03], [0, 0.04]], -0.05, 0.42, 0.02), lathe([[0, 0], [0.04, 0], [0.035, 0.03], [0, 0.04]], 0.05, 0.42, 0.02)), overlap: true },
    { mat: "iron", solid: union(bar([0, 0.3, 0.05], [0, 0.3, 0.13], 0.008), zcyl(0.025, 0.04).move(0, 0.3, 0.15), post(0.018, 0.1, -0.15, 0.2, 0.03), bar([-0.11, 0.33, 0.03], [-0.15, 0.33, 0.03], 0.004), bar([0.11, 0.25, 0.0], [0.14, 0.25, 0.0], 0.005), bar([0.14, 0.25, 0.0], [0.14, 0.2, 0.0], 0.004)), overlap: true },
  ], -0.08),
});

/** A bentwood coat stand: the turned post, four splayed feet, hooks at the top, a coat and a bowler hat on it.
 *  Origin: its foot's middle. */
prop({
  id: "coat-stand", items: ["coat-stand"], size: [0.7, 1.9, 0.6], place: "floor", tris: 3500,
  parts: () => {
    const feet = [0, 1, 2, 3].map((k) => { const a = (k * Math.PI) / 2 + 0.4; return bar([0, 0.35, 0], [Math.cos(a) * 0.28, 0.0, Math.sin(a) * 0.28], 0.016); });
    const hooks = [0, 1, 2, 3, 4, 5].map((k) => { const a = (k * Math.PI) / 3; return bar([0, 1.72, 0], [Math.cos(a) * 0.17, 1.8, Math.sin(a) * 0.17], 0.008); });
    const coat = sdf.smoothUnion(0.04, sdf.capsule([0.14, 1.66, 0.02], [0.2, 0.95, 0.06], 0.13), sdf.capsule([0.1, 1.64, 0.05], [0.12, 1.2, 0.16], 0.05)).displace(0.012, 7, 2, 11).solid(0.03).simplify(0.0075);
    return [
      { mat: "wood-dark", solid: union(post(0.025, 1.82, 0, 0, 0), ball(0.04).move(0, 1.84, 0), ...feet, ...hooks) },
      { mat: "cloth-black", solid: coat, overlap: true },
      { mat: "felt", solid: lathe([[0, 0], [0.15, 0], [0.15, 0.01], [0.1, 0.02], [0.095, 0.1], [0.06, 0.13], [0, 0.135]], -0.13, 1.78, -0.08), overlap: true },
    ];
  },
});

/** The office pendant: a bulb under a green glass shade on its cord, the rose at the ceiling. Origin: the rose; it
 *  hangs to -0.9. */
prop({
  id: "office-pendant", items: ["office-lamp"], size: [0.36, 0.92, 0.36], place: "ceiling", tris: 1500,
  parts: () => [
    { mat: "brass", solid: union(lathe([[0, -0.035], [0.04, -0.03], [0.05, 0], [0, 0]], 0, 0, 0), post(0.004, 0.72, 0, -0.76, 0), lathe([[0, 0], [0.025, 0], [0.025, 0.04], [0, 0.04]], 0, -0.8, 0)) },
    { mat: "glass-green", solid: lathe([[0.03, 0.05], [0.17, -0.04], [0.175, -0.035], [0.035, 0.055]], 0, -0.82, 0, 32) },
    { mat: "mantle", solid: ball(0.03).move(0, -0.86, 0) },
  ],
  glow: [{ at: [0, -0.9, 0], lumens: 380, color: "#ffd8a8", range: 9, shadow: true }, { at: [0, -0.75, 0], lumens: 40, color: "#c8e0b0", range: 4, fill: true }],
});

export const KIT_OFFICE = true;
