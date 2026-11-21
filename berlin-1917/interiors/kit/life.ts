// Street life, Berlin in the winter of 1917-18 (the director, 11-17: "make it feel lived in: streets, diversification,
// trash/litter, newspaper stands, market stalls"). What people and horses leave on the street, the news, and the market,
// each in seeded variants (-0, -1, ...), so a street dressed by interiors/streetlife.ts never repeats a corner. The
// research is research/catalogue/outdoor.ts (dung, gutter, kiosk-news, stall, chestnut-seller, xmas-trees, grit-box,
// ration-notice). Tree grates and fallen leaves are the foliage lane's (exteriors, agreed 11-17).
//   litter-paper-0..5  paper on the ground: a dropped paper folded, a sheet soaked into the slush, crumpled balls, a
//                      torn poster's corner, scraps, tram tickets, cigarette ends (the war's paper was grey and thin)
//   dung-0..3          horse dung with straw in it, fresh, or flattened by wheels (3); straw-0..1 wisps off a cart
//   ash-0..2           stove ash tipped on the ice for grit, coke clinker in it; 2 strewn by the shovelful along a path
//   slush-0..3         slush shovelled into the gutter, 2.6 to 5 m long; its kerb side at z 0, out to +z, x along it
//   scraps-0..2        cabbage leaves, turnip peel and a rotten potato, round a market
//   kiosk-news-0..1    the newspaper kiosk: an eight-sided timber booth, a pointed zinc roof, papers pegged on its sides
//                      and the counter window at the front; 1 is the poorer one, darker and half its papers
//   news-stand-0..1    a seller's folding stand: a sloped board of papers on crossed legs, stones on them against the
//                      wind, his placard on two uprights
//   news-placard       the A-board a seller props at the kerb: EXTRABLATT, the armistice in the east (signed at
//                      Brest-Litovsk on 15 December 1917, five days before 20 December)
//   paper-bundle-0..1  the day's papers in a bundle tied with string, as the cart drops them at a kiosk
//   stall-veg-0..2, stall-fish, stall-greens, stall-junk, stall-empty  the weekly market's stall: trestles, a top of
//                      three boards, an awning on four poles sloping to the front, dressed for its trade; the veg is the
//                      turnip winter's (turnips, cabbage, potatoes), 2 nearly sold out; greens are December's fir
//                      wreaths and branches; junk is old clothes (field grey among them), boots and pots; empty has
//                      only a chalk board: AUSVERKAUFT
//   crate-stack-0..1, crate-broken  market crates stacked by a stall; one stove in
//   chestnut-stove     the roast-chestnut seller's iron stove on legs, its pan, pipe and paper cones (chestnuts in
//                      the war: check)
//   tree-sale-0..1     Christmas trees leaned on a rail between two stakes, a few lying, the seller's fire basket
//   grit-box           the wooden grit box with a sloped lid, STREUSAND, by bridges, slopes and tram stops
//   ration-board       a food shop's notices on its wall by the door: the week's ration sheets and a chalk board
//                      HEUTE KEINE BUTTER (the catalogue's line)
// Origin on the ground at the foot, front to +z; a wall piece's origin on the wall's face at the pavement, out to +z.
import type { Solid } from "raea/3d";
import { crossSection, manifold } from "raea/3d";
import { ball, box, folds, hash, heap, lathe, lump, noise3, post, ring, rodX, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { prism, rod, sign } from "./outgeo";
import { type Part, prop } from "./prop";
import { Build } from "./vehicles";

const r01 = (s: number, k: number) => hash(s, k, 4401);
const rr = (s: number, k: number, a: number, b: number) => a + (b - a) * r01(s, k);
const deg = (r: number) => (r * 180) / Math.PI;
/** A box centred on the origin. */
const cbox = (w: number, h: number, d: number): Solid => box(w, h, d, 0, -h / 2, 0);

/** A thin flat bar from a to b, w wide and t thick, its broad face up (a straw, a slat, a peel). */
function strip(a: V3, b: V3, w: number, t: number): Solid {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
  return cbox(w, t, L).rotate(-deg(Math.asin(dy / L)), deg(Math.atan2(dx, dz)), 0).move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
}
/** A sheet of paper w by d on the ground: crumpled by noise, its edges lifted, one half folded up about z 0. */
function sheet(w: number, d: number, seed: number, crumple: number, lift: number, fold = 0): Solid {
  return cbox(w, 0.0015, d).refineToLength(Math.min(w, d) / 5).warp((x: number, y: number, z: number): [number, number, number] => {
    const e = Math.max(Math.abs(x) / (w / 2), Math.abs(z) / (d / 2));
    return [x, y + 0.001 + crumple * Math.max(0, noise3(x * 9, 0, z * 9, seed)) * 0.03 + lift * e ** 3 + fold * Math.max(0, z), z];
  });
}
/** A crumpled ball of paper r across: the hull of many points jittered hard in and out, so it reads creased, not
 *  a pebble. Its foot at y 0. */
function crumple(r: number, seed: number): Solid {
  const pts: V3[] = [];
  for (let i = 0; i < 28; i++) {
    const u = (i + 0.5) / 28, phi = Math.acos(1 - 2 * u), th = i * 2.39996 + r01(seed, i) * 1.2, k = r * (0.55 + r01(seed, i + 40) * 0.7);
    pts.push([Math.sin(phi) * Math.cos(th) * k * 1.1, Math.cos(phi) * k * 0.8, Math.sin(phi) * Math.sin(th) * k]);
  }
  return manifold.hull(pts).move(0, r * 0.5, 0);
}
/** A 2D outline stood on its (x, y) and extruded along x, centred: a ridge's cross-section (u out along +z, v up). */
function ridge(prof: [number, number][], L: number, divisions: number): Solid {
  let pts = prof.map(([u, v]): [number, number] => [-u, v]);
  let A = 0;
  for (let i = 0; i < pts.length; i++) { const [a, b] = pts[i], [c, d] = pts[(i + 1) % pts.length]; A += a * d - c * b; }
  if (A < 0) pts = pts.reverse();
  return crossSection.polygon(pts).extrude(L, { divisions }).rotate(0, 90, 0).move(-L / 2, 0, 0);
}
/** An open-topped crate w by d, h tall, of boards with a gap between them on each side. */
function crate(w: number, h: number, d: number): Solid {
  return box(w, h, d).minus(box(w - 0.03, h, d - 0.03, 0, 0.015, 0)).minus(box(w + 0.1, 0.02, d - 0.1, 0, h * 0.5, 0)).minus(box(w - 0.1, 0.02, d + 0.1, 0, h * 0.5, 0));
}
/** Lumps laid in a layer over a w by d bed at height y, r apart, each jittered: turnips in a crate, potatoes. */
function layer(b: Build, mat: MatId, w: number, d: number, y: number, r: number, seed: number, at: V3, sy = 0.85) {
  const nx = Math.max(1, Math.floor(w / (2 * r))), nz = Math.max(1, Math.floor(d / (2 * r)));
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
    const j = seed * 97 + i * 13 + k;
    const x = -w / 2 + r + i * ((w - 2 * r) / Math.max(1, nx - 1)) + rr(j, 1, -0.2, 0.2) * r, z = -d / 2 + r + k * ((d - 2 * r) / Math.max(1, nz - 1)) + rr(j, 2, -0.2, 0.2) * r;
    b.add(mat, lump(r * rr(j, 3, 0.85, 1.1), j, 1.15, sy, 1).rotate(0, r01(j, 4) * 360, 0).move(at[0] + x, at[1] + y + r * sy * 0.7, at[2] + z));
  }
}
/** A heap of lumps on a w by d bed: a layer, then smaller layers on it, a pyramid of turnips on the boards. */
function pile(b: Build, mat: MatId, w: number, d: number, r: number, seed: number, at: V3, rows = 3) {
  for (let k = 0; k < rows; k++) layer(b, mat, w - k * 2 * r, d - k * 2 * r, k * r * 1.35, r, seed + k, at);
}
/** A cabbage: a lump of a head with three outer leaves cupped round it. */
function cabbage(b: Build, r: number, seed: number, at: V3) {
  b.add("cabbage", lump(r, seed, 1.05, 0.9, 1).move(at[0], at[1] + r * 0.85, at[2]));
  for (let k = 0; k < 3; k++) b.add("cabbage", leafShell(r * 1.05).rotate(18, k * 120 + r01(seed, k) * 40, 0).move(at[0], at[1] + 0.01, at[2]));
}
/** A leaf or a peel cupped like a shallow bowl r across, its bottom at 0. */
const leafShell = (r: number) => lathe([[0, 0], [r, 0.35 * r], [0.96 * r, 0.37 * r], [0, 0.012]], 0, 0, 0, 10).scale(1, 1, 0.75);
/** A hanging newspaper on a kiosk's side or a stand: its sheet, a black masthead band, a cover picture on a weekly. */
function paperFace(w: number, h: number, weekly: boolean): Solid[] {
  if (weekly) return [box(w, h, 0.003, 0, -h, 0), box(w * 0.86, h * 0.55, 0.002, 0, -h * 0.72, 0.002), box(w * 0.8, 0.04, 0.002, 0, -0.065, 0.002)];
  return [box(w, h, 0.003, 0, -h, 0), box(w * 0.82, 0.045, 0.002, 0, -0.075, 0.002), box(w * 0.9, 0.012, 0.002, 0, -0.105, 0.002)];
}

// ── on the ground ───────────────────────────────────────────────────────────────────────────────────────────────

function litter(v: number): Part[] {
  const b = new Build(), s = 100 + v;
  const at = (k: number, R: number): [number, number] => { const a = r01(s, k) * 6.283, d = Math.sqrt(r01(s, k + 50)) * R; return [Math.cos(a) * d, Math.sin(a) * d]; };
  const put = (mat: MatId, sol: Solid, k: number, R: number) => { const [x, z] = at(k, R); b.add(mat, sol.rotate(0, r01(s, k + 80) * 360, 0).move(x, 0, z)); };
  const recipe: [string, number][][] = [
    [["folded", 1], ["scrap", 2], ["end", 2]],
    [["wet", 1], ["ball", 1], ["scrap", 1]],
    [["ball", 3], ["end", 4], ["ticket", 1]],
    [["poster", 1], ["scrap", 3], ["ticket", 2]],
    [["open", 1], ["wet", 1], ["end", 1]],
    [["scrap", 4], ["ticket", 3], ["end", 5]],
  ];
  let k = 0;
  for (const [kind, n] of recipe[v]) for (let i = 0; i < n; i++, k++) {
    const j = s * 31 + k;
    if (kind === "folded") put("newsprint", sheet(0.38, 0.28, j, 0.5, 0.01, 0.12), k, 0.3);
    else if (kind === "open") put("newsprint", sheet(0.76, 0.56, j, 0.5, 0.05), k, 0.15);
    else if (kind === "wet") put("newsprint-wet", sheet(0.38, 0.56, j, 0.04, 0), k, 0.35);
    else if (kind === "poster") put("paper-poster", sheet(0.32, 0.24, j, 0.3, 0.02), k, 0.3);
    else if (kind === "scrap") put(k % 3 ? "newsprint" : "paper", sheet(rr(j, 1, 0.06, 0.16), rr(j, 2, 0.05, 0.12), j, 0.6, 0.01), k, 0.55);
    else if (kind === "ticket") put(k % 2 ? "paper-blue" : "paper-poster", sheet(0.035, 0.06, j, 0.3, 0.004), k, 0.5);
    else if (kind === "ball") put(k % 2 ? "newsprint" : "paper", crumple(rr(j, 3, 0.035, 0.07), j), k, 0.45);
    else put("paper", rodX(0.0045, rr(j, 4, 0.015, 0.03), 0, 0.0045, 0), k, 0.5);
  }
  return b.parts();
}
for (let v = 0; v < 6; v++) prop({ id: `litter-paper-${v}`, items: ["litter"], size: [1.3, 0.1, 1.3], place: "floor", where: "set", tris: 4000, parts: () => litter(v) });

function dung(v: number): Part[] {
  const b = new Build(), s = 200 + v, flat = v === 3, n = 4 + Math.floor(r01(s, 1) * 5), R = flat ? 0.24 : 0.14;
  for (let k = 0; k < n; k++) {
    const a = r01(s, k + 10) * 6.283, d = Math.sqrt(r01(s, k + 20)) * R, r = rr(s, k + 30, 0.03, 0.04), sy = flat ? 0.28 : 0.82;
    b.add("dung", lump(r, s * 31 + k, 1.1, sy, 1).rotate(0, r01(s, k + 40) * 360, 0).move(Math.cos(a) * d, r * sy * 0.75, Math.sin(a) * d));
  }
  const w = 6 + Math.floor(r01(s, 2) * 7);
  for (let k = 0; k < w; k++) {
    const a = r01(s, k + 60) * 6.283, d = Math.sqrt(r01(s, k + 70)) * (R + 0.12), x = Math.cos(a) * d, z = Math.sin(a) * d, t = r01(s, k + 75) * 6.283, L = rr(s, k + 77, 0.06, 0.18);
    b.add(k % 3 ? "straw" : "hay", strip([x, 0.004, z], [x + Math.cos(t) * L, k % 4 ? 0.004 : 0.03, z + Math.sin(t) * L], 0.004, 0.0015));
  }
  return b.parts();
}
for (let v = 0; v < 4; v++) prop({ id: `dung-${v}`, items: ["dung"], size: [0.8, 0.08, 0.8], place: "floor", where: "set", tris: 3000, parts: () => dung(v) });

function straw(v: number): Part[] {
  const b = new Build(), s = 250 + v;
  for (let k = 0; k < 28; k++) {
    const a = r01(s, k) * 6.283, d = Math.sqrt(r01(s, k + 40)) * 0.75, x = Math.cos(a) * d, z = Math.sin(a) * d, t = r01(s, k + 80) * 6.283, L = rr(s, k + 120, 0.05, 0.22);
    b.add(k % 3 ? "straw" : "hay", strip([x, 0.003, z], [x + Math.cos(t) * L, k % 5 ? 0.003 : 0.02, z + Math.sin(t) * L], 0.004, 0.0015));
  }
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `straw-${v}`, items: ["dung"], size: [1.7, 0.03, 1.7], place: "floor", where: "set", tris: 2000, parts: () => straw(v) });

function ash(v: number): Part[] {
  const b = new Build(), s = 300 + v, line = v === 2, spots = line ? 5 : 1;
  for (let k = 0; k < spots; k++) {
    const x = line ? -0.8 + k * 0.4 + rr(s, k, -0.08, 0.08) : 0, z = line ? rr(s, k + 9, -0.1, 0.1) : 0;
    const r = line ? rr(s, k + 5, 0.16, 0.26) : rr(s, 5, 0.3, 0.45), h = line ? 0.02 : rr(s, 6, 0.04, 0.08);
    b.add("ash", heap(r, h, 0.03, s * 7 + k).scale(1, 1, rr(s, k + 20, 0.6, 1)).move(x, 0, z));
    for (let c = 0; c < (line ? 3 : 9); c++) {
      const a = r01(s, k * 20 + c + 40) * 6.283, d = Math.sqrt(r01(s, k * 20 + c + 60)) * r * 0.6, cr = rr(s, k * 20 + c + 80, 0.01, 0.024);
      b.add(c % 4 ? "coke" : "briquette", lump(cr, s * 13 + k * 20 + c).move(x + Math.cos(a) * d, h * (1 - d / r) * 0.75 + cr * 0.5, z + Math.sin(a) * d * 0.8));
    }
  }
  return b.parts();
}
for (let v = 0; v < 3; v++) prop({ id: `ash-${v}`, items: ["ice"], size: [v === 2 ? 2.2 : 1, 0.1, 1], place: "floor", where: "set", tris: 4000, parts: () => ash(v) });

function slush(v: number): Part[] {
  const s = 400 + v, L = [2.6, 3.4, 4.2, 5.0][v], W = rr(s, 1, 0.45, 0.7), H = rr(s, 2, 0.22, 0.38);
  const prof: [number, number][] = [[0, 0], [W, 0]];
  for (let i = 1; i <= 9; i++) { const u = W * (1 - i / 9); prof.push([u, H * Math.pow(1 - Math.pow(u / W, 1.8), 0.7)]); }
  const bank = ridge(prof, L, Math.ceil(L / 0.08)).refineToLength(0.09).warp((x: number, y: number, z: number): [number, number, number] => {
    const t = (x + L / 2) / L, end = Math.min(1, Math.sin(Math.PI * t) * 2.4);
    const n = 0.65 + 0.3 * noise3(x * 1.3, 0.5, 0.5, s) + 0.12 * noise3(x * 6, y * 6, z * 6, s + 1);
    // frozen lumps from the shovel, none at the foot
    const lumps = y > 0.01 ? 0.035 * noise3(x * 14, y * 14, z * 14, s + 4) : 0;
    return [x + 0.04 * noise3(x * 4, y * 4, z * 4, s + 2), Math.max(0, y * end * n + lumps), z * (0.65 + 0.35 * end) + 0.03 * noise3(x * 5, 1.5, 0.5, s + 3)];
  });
  const b = new Build();
  b.add("snow-dirty", bank);
  // a sheet frozen into its foot
  b.add("newsprint-wet", sheet(0.2, 0.14, s, 0.2, 0).rotate(0, rr(s, 20, 0, 360), 0).move(rr(s, 21, -L / 3, L / 3), 0, W + 0.04));
  return b.parts();
}
for (let v = 0; v < 4; v++) prop({ id: `slush-${v}`, items: ["gutter", "snow"], size: [[2.6, 3.4, 4.2, 5.0][v], 0.4, 0.8], place: "floor", where: "set", tris: 6000, parts: () => slush(v) });

function scraps(v: number): Part[] {
  const b = new Build(), s = 500 + v;
  const at = (k: number, R: number): [number, number] => { const a = r01(s, k) * 6.283, d = Math.sqrt(r01(s, k + 50)) * R; return [Math.cos(a) * d, Math.sin(a) * d]; };
  for (let k = 0; k < 5 + v; k++) {
    // a dropped leaf: torn, cupped or flattened, yellowing and browning
    const [x, z] = at(k, 0.5), r = rr(s, k + 3, 0.06, 0.11), up = r01(s, k + 7) < 0.5, j = s * 17 + k;
    const leaf = leafShell(r).refineToLength(r / 3).warp((px: number, py: number, pz: number): [number, number, number] => {
      const torn = 1 - 0.35 * Math.max(0, noise3(px * 30, 0.5, pz * 30, j));
      return [px * torn, py * rr(j, 1, 0.3, 1) + 0.01 * noise3(px * 40, py * 40, pz * 40, j + 1), pz * torn];
    });
    b.add(k % 3 === 2 ? "cabbage-old" : "cabbage", leaf.rotate(up ? 0 : 180, r01(s, k + 9) * 360, 0).move(x, up ? 0 : 0.37 * r, z));
  }
  for (let k = 0; k < 5; k++) {
    const [x, z] = at(k + 20, 0.55), t = r01(s, k + 30) * 6.283, L = rr(s, k + 40, 0.05, 0.12);
    b.add("turnip", strip([x, 0.005, z], [x + Math.cos(t) * L, 0.012, z + Math.sin(t) * L], 0.02, 0.004));
  }
  const [px, pz] = at(60, 0.4);
  b.add(v === 1 ? "turnip" : "potato", lump(0.04, s, 1.3, 0.8, 1).move(px, 0.028, pz));
  return b.parts();
}
for (let v = 0; v < 3; v++) prop({ id: `scraps-${v}`, items: ["stall"], size: [1.3, 0.08, 1.3], place: "floor", where: "set", tris: 3000, parts: () => scraps(v) });

// ── the news ────────────────────────────────────────────────────────────────────────────────────────────────────

/** An octagon's plan of apothem a, one face to +z (faces at k * 45 degrees from +z toward +x). */
const oct = (a: number): [number, number][] => Array.from({ length: 8 }, (_, k) => { const p = ((k * 45 + 22.5) * Math.PI) / 180, R = a / Math.cos(Math.PI / 8); return [Math.sin(p) * R, Math.cos(p) * R]; });
const band = (a: number, t: number, y0: number, y1: number) => prism(oct(a), y0, y1).minus(prism(oct(a - t), y0 - 0.01, y1 + 0.01));
const TITLES = ["LOKAL-ANZEIGER", "B.Z. AM MITTAG", "VORWÄRTS", "TAGEBLATT", "VOSSISCHE", "MORGENPOST"];

function kiosk(v: number): Part[] {
  const b = new Build(), s = 600 + v, A = 0.92, Y0 = 0.15, Y1 = 2.3, paint: MatId = v ? "wood-dark" : "paint-green";
  b.add("granite", prism(oct(A + 0.06), 0, Y0));
  const win = box(0.6, 0.85, 0.6, 0, 1.05, A);
  b.add(paint, prism(oct(A), Y0, Y1).minus(prism(oct(A - 0.05), Y0 + 0.02, Y1 + 0.1)).minus(win));
  b.add(paint, band(A + 0.02, 0.04, Y0, Y0 + 0.16).minus(win), band(A + 0.015, 0.03, 0.95, 1.0).minus(win));
  b.add("tram-ivory", band(A + 0.03, 0.05, 2.05, Y1));
  b.add("lacquer-black", sign("ZEITUNGEN", 0.12).move(0, 2.175, A + 0.03));
  // the roof: a low octagonal pyramid over a deep eave, a finial
  const eave = oct(A + 0.22);
  b.add("zinc", manifold.hull([...eave.map(([x, z]): V3 => [x, Y1, z]), ...eave.map(([x, z]): V3 => [x, Y1 + 0.06, z]), [0, Y1 + 0.8, 0]]));
  b.add("iron", post(0.022, 0.28, 0, Y1 + 0.72, 0), ball(0.05).move(0, Y1 + 1.02, 0));
  // the window: a counter, a hood over it, the day's piles on the counter and on a shelf inside
  b.add("wood-dark", box(0.74, 0.04, 0.26, 0, 1.0, A + 0.04), box(0.84, 0.025, 0.3, 0, 0, 0).rotate(14, 0, 0).move(0, 1.96, A + 0.13));
  for (const [x, k] of [[-0.22, 1], [0.04, 2], [0.24, 3]] as [number, number][]) b.add("newsprint", box(0.2, rr(s, k, 0.03, 0.09), 0.16, x, 1.04, A + 0.03));
  b.add("wood-dark", box(0.9, 0.03, 0.26, 0, 1.25, -A + 0.18));
  for (let k = 0; k < 4; k++) b.add("newsprint", box(0.18, rr(s, k + 10, 0.05, 0.16), 0.2, -0.33 + k * 0.22, 1.28, -A + 0.18));
  // the back face's door, a handle
  b.add(paint, box(0.62, 1.85, 0.02, 0, Y0 + 0.02, -A - 0.005), box(0.5, 0.025, 0.02, 0, 1.2, -A - 0.012));
  b.add("iron", ball(0.025).move(0.22, 1.1, -A - 0.03));
  // papers pegged on rails round the six other faces: dailies with their mastheads, a weekly's cover picture; the
  // poorer kiosk has half of them
  for (const k of [1, 2, 3, 5, 6, 7]) {
    const phi = k * 45, rail: Solid[] = [], sheets: Solid[] = [], ink: Solid[] = [], pic: Solid[] = [], weekly: Solid[] = [];
    for (const yt of [2.0, 1.52]) {
      rail.push(rodX(0.006, 0.7, 0, yt + 0.01, A + 0.012));
      for (const x of [-0.18, 0.18]) {
        const j = s * 50 + k * 10 + Math.round(yt * 10) + (x > 0 ? 1 : 0);
        if (v === 1 && r01(j, 1) < 0.5) continue;
        const wk = r01(j, 2) < 0.25, tilt = rr(j, 3, -3, 3);
        const f = paperFace(0.3, 0.42, wk).map((p) => p.rotate(0, 0, tilt).move(x, yt, A + 0.014));
        (wk ? weekly : sheets).push(f[0]);
        if (wk) { pic.push(f[1]); ink.push(f[2]); } else ink.push(f[1], f[2]);
      }
    }
    const turn = (l: Solid[]) => l.map((p) => p.rotate(0, phi, 0));
    b.add("iron", ...turn(rail));
    if (sheets.length) b.add("newsprint", ...turn(sheets));
    if (weekly.length) b.add("paper", ...turn(weekly));
    if (pic.length) b.add("photo-sepia", ...turn(pic));
    if (ink.length) b.add("lacquer-black", ...turn(ink));
    if (k === 2 || k === 6) b.add("lacquer-black", sign(TITLES[(k + v * 3) % TITLES.length], 0.07).move(0, 2.175, A + 0.03).rotate(0, phi, 0));
  }
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `kiosk-news-${v}`, items: ["kiosk-news"], size: [2.3, 3.4, 2.3], place: "floor", where: "set", tris: 40000, parts: () => kiosk(v) });

function newsStand(v: number): Part[] {
  const b = new Build(), s = 700 + v, TILT = 18, Y = 0.86;
  const under = (z: number) => Y - 0.03 - z * Math.tan((TILT * Math.PI) / 180); // the board's underside over z
  for (const x of [-0.42, 0.42]) b.add("wood-raw", rod([x, 0, -0.3], [x, under(0.2), 0.2], 0.018), rod([x, 0, 0.3], [x, under(-0.2), -0.2], 0.018), rod([x, 0.42, -0.1], [x, 0.42, 0.1], 0.01));
  const onBoard = (sol: Solid) => sol.rotate(TILT, 0, 0).move(0, Y, 0);
  b.add("wood-grey", onBoard(union(box(0.95, 0.025, 0.62, 0, -0.025, 0), box(0.95, 0.045, 0.02, 0, 0, 0.3))));
  // the papers fanned in two rows, the back row overlapping, stones on them against the wind
  const ink: Solid[] = [], paper: Solid[] = [];
  for (let row = 0; row < 2; row++) for (let i = 0; i < 3; i++) {
    const j = s * 20 + row * 3 + i, x = -0.3 + i * 0.3 + rr(j, 1, -0.02, 0.02), z = row ? -0.12 : 0.1, h = rr(j, 2, 0.008, 0.03), yaw = rr(j, 3, -5, 5);
    paper.push(onBoard(box(0.28, h, 0.36, 0, 0, 0).rotate(0, yaw, 0).move(x, row * 0.012, z)));
    ink.push(onBoard(box(0.22, 0.002, 0.04, 0, 0, 0).rotate(0, yaw, 0).move(x, row * 0.012 + h, z - 0.13)));
    if (row === 0) b.add("granite", onBoard(lump(0.035, j, 1.3, 0.7, 1).move(x + 0.06, h + 0.02, z + 0.05)));
  }
  b.add("newsprint", ...paper);
  b.add("lacquer-black", ...ink);
  // the placard on two uprights at the back
  b.add("wood-raw", post(0.016, 0.75, -0.4, Y - 0.05, -0.27), post(0.016, 0.75, 0.4, Y - 0.05, -0.27));
  b.add("paper-poster", box(0.9, 0.42, 0.015, 0, Y + 0.25, -0.27));
  b.add("lacquer-black", sign(v ? "B.Z. AM MITTAG" : "EXTRABLATT", 0.1).move(0, Y + 0.52, -0.262), box(0.8, 0.02, 0.003, 0, Y + 0.36, -0.262));
  b.add("iron", box(0.16, 0.08, 0.11, 0.33, 0, 0.36)); // the tin with the change, on the ground at his foot
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `news-stand-${v}`, items: ["newspaper-seller"], size: [1.0, 1.65, 0.8], place: "floor", where: "set", tris: 20000, parts: () => newsStand(v) });

prop({
  id: "news-placard", items: ["newspaper-seller", "news-window"], size: [0.62, 0.95, 0.5], place: "floor", where: "set", tris: 12000,
  parts: () => {
    const b = new Build(), H = 0.95, A = 13;
    for (const s of [1, -1]) {
      // each board hangs from the hinge bar, its foot splayed out to its own side
      const face = (sol: Solid) => sol.move(0, -H, 0).rotate(-A, 0, 0).move(0, H * Math.cos((A * Math.PI) / 180), 0).rotate(0, s > 0 ? 0 : 180, 0);
      b.add("wood-grey", face(box(0.6, H, 0.02, 0, 0, 0.01)));
      b.add("paper-poster", face(box(0.52, 0.8, 0.003, 0, 0.07, 0.021)));
      b.add("lacquer-black", face(union(sign("EXTRABLATT", 0.075).move(0, 0.76, 0.024), box(0.46, 0.012, 0.002, 0, 0.7, 0.024), sign("WAFFENSTILLSTAND", 0.042).move(0, 0.6, 0.024), sign("IM OSTEN", 0.042).move(0, 0.53, 0.024))));
      b.add("newsprint", face(box(0.4, 0.3, 0.003, 0, 0.14, 0.024)));
    }
    b.add("iron", rodX(0.008, 0.62, 0, H * Math.cos((A * Math.PI) / 180) - 0.01, 0));
    return b.parts();
  },
});

function bundle(v: number): Part[] {
  const b = new Build(), h = v ? 0.16 : 0.24, W = 0.4, D = 0.3;
  b.add("newsprint", box(W, h, D, 0, 0, 0));
  b.add("jute", box(W + 0.008, h + 0.008, 0.008, 0, -0.004, 0.06).minus(box(W, h, 0.02, 0, 0, 0.06)), box(0.008, h + 0.008, D + 0.008, -0.1, -0.004, 0).minus(box(0.02, h, D, -0.1, 0, 0)));
  b.add("lacquer-black", box(0.3, 0.002, 0.05, 0.02, h, -0.08));
  if (v) b.add("newsprint", sheet(0.38, 0.28, 711, 0.3, 0.02, 0.3).rotate(0, 30, 0).move(0.45, 0, 0.2));
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `paper-bundle-${v}`, items: ["kiosk-news"], size: [0.9, 0.26, 0.6], place: "floor", where: "set", tris: 3000, parts: () => bundle(v) });

// ── the market ──────────────────────────────────────────────────────────────────────────────────────────────────

const SW = 2.2, SD = 1.0, TOP = 0.8, ZF = SD / 2 + 0.3, ZB = -SD / 2 - 0.05, HF = 1.95, HB = 2.25;
/** The stall itself: two trestles, a top of three boards, four poles and the awning sloping to the front. */
function stallFrame(b: Build, awning: MatId, seed: number) {
  for (const x of [-(SW / 2 - 0.25), SW / 2 - 0.25]) {
    b.add("wood-raw", box(0.07, 0.06, SD - 0.05, x, TOP - 0.09, 0));
    for (const s of [-1, 1]) b.add("wood-raw", rod([x - 0.12, 0, s * (SD / 2 - 0.05)], [x, TOP - 0.06, s * (SD / 2 - 0.2)], 0.018), rod([x + 0.12, 0, s * (SD / 2 - 0.05)], [x, TOP - 0.06, s * (SD / 2 - 0.2)], 0.018));
  }
  for (let i = 0; i < 3; i++) b.add("wood-grey", box(SW, 0.03, SD / 3 - 0.008, 0, TOP - 0.03, -SD / 3 + i * (SD / 3)));
  for (const x of [-SW / 2 + 0.03, SW / 2 - 0.03]) b.add("wood-raw", post(0.025, HF + 0.02, x, 0, ZF), post(0.025, HB + 0.02, x, 0, ZB));
  b.add("wood-raw", rodX(0.02, SW + 0.06, 0, HF - 0.03, ZF), rodX(0.02, SW + 0.06, 0, HB - 0.03, ZB));
  const len = Math.hypot(ZF - ZB, HB - HF), a = deg(Math.atan2(HB - HF, ZF - ZB));
  const sheetS = cbox(SW + 0.16, 0.004, len).refineToLength(0.12).warp((x: number, y: number, z: number): [number, number, number] => [x, y - 0.07 * Math.sin(Math.PI * (z / len + 0.5)) * (0.6 + 0.4 * Math.cos((Math.PI * x) / (SW + 0.16))) + 0.01 * noise3(x * 3, 0, z * 3, seed), z]);
  b.add(awning, sheetS.rotate(a, 0, 0).move(0, (HF + HB) / 2 + 0.02, (ZF + ZB) / 2));
  // the valance hanging off the front bar, in shallow folds
  const val = cbox(SW + 0.16, 0.2, 0.004).refineToLength(0.06).warp((x: number, y: number, z: number): [number, number, number] => [x, y, z + 0.012 * Math.sin(x * 22) * (0.5 - y / 0.4)]);
  b.add(awning, val.move(0, HF - 0.1, ZF + 0.03));
}
/** A balance scale hung from the front bar at x: a beam, two pans on cords. */
function scale(b: Build, x: number) {
  b.add("iron", rod([x, HF - 0.05, ZF], [x, HF - 0.42, ZF], 0.003), rodX(0.007, 0.36, x, HF - 0.44, ZF));
  for (const s of [-1, 1]) {
    const px = x + s * 0.17;
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; b.add("iron", rod([px, HF - 0.44, ZF], [px + Math.cos(a) * 0.09, HF - 0.72, ZF + Math.sin(a) * 0.09], 0.002)); }
    b.add("brass", lathe([[0, 0], [0.1, 0.03], [0.095, 0.035], [0, 0.006]], px, HF - 0.75, ZF, 16));
  }
}
/** A chalk board on the stall's front edge: the trade's word in chalk. */
function chalkboard(b: Build, text: string, x: number) {
  b.add("board-chalk", box(0.42, 0.26, 0.015, 0, 0, 0).rotate(-12, 0, 0).move(x, TOP, SD / 2 - 0.02));
  b.add("chalk", sign(text, 0.05).move(0, 0.13, 0.0076).rotate(-12, 0, 0).move(x, TOP, SD / 2 - 0.02));
}

function stallVeg(v: number): Part[] {
  const b = new Build(), s = 800 + v;
  stallFrame(b, (["canvas", "awning-stripe", "canvas-field"] as MatId[])[v], s);
  scale(b, 0.55);
  if (v < 2) {
    // crates of turnips and potatoes, cabbages heaped, a pyramid of turnips on the boards
    for (const [x, z, mat, r] of [[-0.7, -0.22, "turnip", 0.055], [-0.15, -0.22, "potato", 0.035], [0.45, -0.22, "turnip", 0.05]] as [number, number, MatId, number][]) {
      b.add("wood-raw", crate(0.5, 0.2, 0.36).move(x, TOP, z));
      layer(b, mat, 0.46, 0.32, 0.12, r, s * 10 + Math.round(x * 10), [x, TOP, z]);
    }
    if (v === 0) pile(b, "turnip", 0.7, 0.36, 0.055, s * 3, [-0.4, TOP, 0.22]);
    else layer(b, "potato", 0.7, 0.34, 0, 0.035, s * 3, [-0.4, TOP, 0.22]);
    for (let k = 0; k < (v ? 3 : 5); k++) cabbage(b, rr(s, k, 0.075, 0.095), s * 7 + k, [0.25 + (k % 3) * 0.2, TOP + (k > 2 ? 0.13 : 0), 0.2 + (k > 2 ? 0.03 : 0)]);
    chalkboard(b, "KOHLRÜBEN", 0.75);
  } else {
    // nearly sold out: one crate with a few turnips in it, a cabbage, the board says so
    b.add("wood-raw", crate(0.5, 0.2, 0.36).move(-0.5, TOP, -0.15), crate(0.5, 0.2, 0.36).move(0.1, TOP, -0.15));
    for (let k = 0; k < 4; k++) b.add("turnip", lump(0.05, s + k, 1.15, 0.85, 1).move(-0.62 + k * 0.08, TOP + 0.06, -0.15 + rr(s, k, -0.08, 0.08)));
    cabbage(b, 0.08, s, [0.5, TOP, 0.15]);
    chalkboard(b, "NUR RÜBEN", 0.0);
  }
  // under the table: sacks and a basket
  b.add("jute", lump(0.22, s, 1.0, 1.4, 0.9).move(-0.7, 0.28, -0.1), lump(0.2, s + 1, 1.0, 1.2, 0.9).move(0.75, 0.22, 0.05));
  b.add("straw", lathe([[0, 0], [0.2, 0], [0.24, 0.22], [0.22, 0.22], [0.18, 0.02], [0, 0.02]], 0.1, 0, 0.2, 14));
  return b.parts();
}
for (let v = 0; v < 3; v++) prop({ id: `stall-veg-${v}`, items: ["stall"], size: [2.4, 2.35, 1.9], place: "floor", where: "set", tris: 30000, parts: () => stallVeg(v) });

prop({
  id: "stall-fish", items: ["stall"], size: [2.4, 2.35, 1.9], place: "floor", where: "set", tris: 30000,
  parts: () => {
    const b = new Build(), s = 830;
    stallFrame(b, "canvas", s);
    scale(b, -0.6);
    // two zinc tubs of herring on ice, a board of fish laid in rows, a barrel of salt herring below
    for (const x of [-0.6, 0.05]) {
      b.add("zinc", lathe([[0, 0], [0.26, 0], [0.28, 0.2], [0.265, 0.2], [0.245, 0.015], [0, 0.015]], x, TOP, -0.15, 20));
      b.add("ice-grey", lathe([[0, 0], [0.25, 0], [0.25, 0.02], [0, 0.02]], x, TOP + 0.13, -0.15, 16));
      for (let k = 0; k < 7; k++) { const a = r01(s, k + Math.round(x * 10)) * 6.283, d = Math.sqrt(r01(s, k + 20)) * 0.15; b.add("herring", lump(0.03, s + k * 7 + Math.round(x * 10), 3.6, 0.55, 1).rotate(0, deg(a), 0).move(x + Math.cos(a) * d, TOP + 0.17, -0.15 + Math.sin(a) * d)); }
    }
    b.add("wood-raw", box(0.7, 0.02, 0.4, 0.6, TOP, 0.12));
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) b.add("herring", lump(0.028, s + 100 + r * 4 + k, 3.6, 0.5, 1).rotate(0, 90, 0).move(0.36 + k * 0.16, TOP + 0.035, 0.0 + r * 0.12));
    b.add("wood-dark", lathe([[0, 0], [0.25, 0], [0.29, 0.3], [0.25, 0.6], [0, 0.6]], -0.4, 0, 0.2, 18));
    b.add("iron", lathe([[0.255, 0.08], [0.27, 0.08], [0.27, 0.12], [0.255, 0.12]], -0.4, 0, 0.2, 18), lathe([[0.255, 0.48], [0.27, 0.48], [0.27, 0.52], [0.255, 0.52]], -0.4, 0, 0.2, 18));
    chalkboard(b, "HERINGE", 0.0);
    return b.parts();
  },
});

prop({
  id: "stall-greens", items: ["stall", "xmas-trees"], size: [2.4, 2.35, 1.9], place: "floor", where: "set", tris: 30000,
  parts: () => {
    const b = new Build(), s = 840;
    stallFrame(b, "canvas-field", s);
    // wreaths hung from the front bar and laid on the boards, bundles of fir branches leaned on the front
    // wreaths of bound fir, bristling, a red bow on each hung one
    const wreath = (R: number, seed: number) => ring(R, 0.04, 20, 6).refineToLength(0.02).warp((x: number, y: number, z: number): [number, number, number] => {
      const a = Math.atan2(y, x), d = Math.hypot(x, y), k = 1 + 0.35 * noise3(x * 40, y * 40, z * 40, seed);
      return [Math.cos(a) * (R + (d - R) * k), Math.sin(a) * (R + (d - R) * k), z * k];
    });
    for (let k = 0; k < 3; k++) {
      const x = -0.7 + k * 0.7;
      b.add("jute", rod([x, HF - 0.03, ZF], [x, HF - 0.3, ZF], 0.003));
      b.add("fir", wreath(0.16, s + k).move(x, HF - 0.47, ZF));
      b.add("flag-red", box(0.07, 0.04, 0.02, x, HF - 0.33, ZF + 0.04), box(0.02, 0.09, 0.006, 0, 0, 0).rotate(0, 0, 18).move(x - 0.02, HF - 0.42, ZF + 0.045), box(0.02, 0.09, 0.006, 0, 0, 0).rotate(0, 0, -18).move(x + 0.02, HF - 0.42, ZF + 0.045));
    }
    for (let k = 0; k < 4; k++) b.add("fir", wreath(0.15, s + 10 + k).rotate(90, 0, 0).move(-0.75 + k * 0.42, TOP + 0.04, -0.1 + (k % 2) * 0.25));
    // each bundle five branches leaned on the stall's front, each a stem with side shoots in pairs, shorter toward its
    // tip, so it reads as a feathered spray of fir and not a leaf
    for (let k = 0; k < 5; k++) {
      const x = -0.8 + k * 0.4;
      for (let i = 0; i < 5; i++) {
        const j = s * 100 + k * 10 + i, a = rr(j, 1, -14, 14), L = rr(j, 2, 0.6, 0.85), spray: Solid[] = [];
        spray.push(strip([0, 0, 0], [0, L, 0], 0.012, 0.008));
        for (let n = 1; n <= 7; n++) {
          const y = (n / 8) * L, len = 0.16 * (1 - n / 9) + 0.03;
          for (const side of [-1, 1]) spray.push(strip([0, y, 0], [side * len * 0.8, y + len * 0.6, rr(j, n * 2 + side, -0.03, 0.03)], 0.03, 0.01));
        }
        b.add("fir", union(...spray).rotate(-14, r01(j, 3) * 40 - 20, a).move(x + a * 0.004, 0, SD / 2 + 0.2));
      }
    }
    chalkboard(b, "TANNENGRÜN", 0.6);
    return b.parts();
  },
});

prop({
  id: "stall-junk", items: ["stall"], size: [2.4, 2.35, 1.9], place: "floor", where: "set", tris: 30000,
  parts: () => {
    const b = new Build(), s = 850;
    stallFrame(b, "awning-stripe", s);
    // old clothes on hooks from the front bar (a field-grey tunic among them), boots, pots, a pile of linen, books
    // each coat on a hanger: a body in folds flaring to the hem, shoulders sloped off the hanger, the sleeves hanging
    for (const [x, mat, L] of [[-0.75, "cloth-brown", 0.95], [-0.3, "cloth-field", 0.85], [0.15, "cloth-navy-worn", 0.8]] as [number, MatId, number][]) {
      const top = HF - 0.16;
      b.add("iron", rod([x, HF - 0.03, ZF], [x, top + 0.02, ZF], 0.004));
      b.add("wood-dark", rodX(0.01, 0.42, x, top, ZF));
      const body = folds(0.5, L, 0.03, 26, 0.012, 6).warp((px: number, py: number, pz: number): [number, number, number] => {
        const t = py / L, w = 0.78 + 0.22 * t, shoulder = Math.max(0, Math.abs(px) - 0.08) * 0.35 * Math.max(0, t - 0.85) / 0.15;
        return [px * w, py - shoulder, pz];
      });
      b.add(mat, body.move(x, top - L + 0.01, ZF));
      for (const sx of [-1, 1]) b.add(mat, folds(0.13, 0.6, 0.06, 30, 0.006).rotate(0, 0, sx * 4).move(x + sx * 0.25, top - 0.66, ZF + 0.02));
    }
    for (let k = 0; k < 3; k++) b.add(k ? "leather" : "leather-worn", box(0.1, 0.22, 0.26, -0.8 + k * 0.25, TOP, 0.1), box(0.1, 0.1, 0.12, -0.8 + k * 0.25, TOP, 0.25));
    b.add("iron", lathe([[0, 0], [0.12, 0], [0.13, 0.14], [0.12, 0.14], [0.11, 0.01], [0, 0.01]], -0.05, TOP, 0.15, 18));
    b.add("enamel-blue", lathe([[0, 0], [0.09, 0], [0.1, 0.18], [0.09, 0.18], [0.08, 0.01], [0, 0.01]], 0.22, TOP, 0.2, 18));
    b.add("linen-grey", box(0.4, 0.06, 0.3, 0.6, TOP, -0.2), box(0.37, 0.05, 0.28, 0.61, TOP + 0.06, -0.2));
    b.add("wood-dark", box(0.15, 0.04, 0.22, 0.6, TOP, 0.2), box(0.14, 0.035, 0.2, 0.6, TOP + 0.04, 0.2));
    b.add("mirror", box(0.3, 0.4, 0.01, 0, 0, 0).rotate(-15, 0, 0).move(0.85, TOP, -0.35));
    return b.parts();
  },
});

prop({
  id: "stall-empty", items: ["stall", "queue"], size: [2.4, 2.35, 1.9], place: "floor", where: "set", tris: 20000,
  parts: () => {
    const b = new Build();
    stallFrame(b, "canvas", 860);
    b.add("wood-raw", crate(0.5, 0.2, 0.36).move(-0.5, TOP, -0.2));
    b.add("wood-raw", crate(0.5, 0.2, 0.36).rotate(0, 0, 90).move(0.6, 0.25, 0.1));
    chalkboard(b, "AUSVERKAUFT", 0.1);
    return b.parts();
  },
});

function crateStack(v: number): Part[] {
  const b = new Build(), s = 870 + v, n = v ? 5 : 3;
  for (let k = 0; k < n; k++) {
    const lvl = v ? [0, 0, 1, 1, 2][k] : [0, 1, 2][k], col = v ? [0, 1, 0, 1, 0][k] : 0;
    b.add("wood-raw", crate(0.5, 0.25, 0.36).rotate(0, rr(s, k, -6, 6), 0).move(col * 0.52 + rr(s, k + 9, -0.03, 0.03), lvl * 0.25, rr(s, k + 19, -0.03, 0.03)));
  }
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `crate-stack-${v}`, items: ["stall"], size: [1.1, 0.8, 0.45], place: "floor", where: "set", tris: 4000, parts: () => crateStack(v) });

prop({
  id: "crate-broken", items: ["stall", "litter"], size: [1.0, 0.25, 0.8], place: "floor", where: "set", tris: 3000,
  parts: () => {
    const b = new Build(), s = 880;
    b.add("wood-raw", crate(0.5, 0.25, 0.36).minus(box(0.6, 0.3, 0.1, 0, -0.01, 0.16)).rotate(0, 20, 0).move(-0.1, 0, 0));
    for (let k = 0; k < 4; k++) { const x = rr(s, k, 0, 0.4), z = rr(s, k + 5, 0.1, 0.35), a = r01(s, k + 9) * 6.283, L = rr(s, k + 12, 0.25, 0.5); b.add("wood-raw", strip([x, 0.008 + k * 0.012, z], [x + Math.cos(a) * L, 0.008 + k * 0.012, z + Math.sin(a) * L], 0.08, 0.012)); }
    return b.parts();
  },
});

prop({
  id: "chestnut-stove", items: ["chestnut-seller"], size: [0.8, 1.7, 0.7], place: "floor", where: "set", tris: 12000,
  glow: [{ at: [0, 0.68, 0.32], lumens: 120, color: "#ff9a4c", range: 3, flicker: 0.3 }],
  parts: () => {
    const b = new Build(), s = 890;
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + (k * Math.PI) / 2; b.add("iron", rod([Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26], [Math.cos(a) * 0.17, 0.6, Math.sin(a) * 0.17], 0.014)); }
    b.add("iron", lathe([[0, 0], [0.22, 0], [0.23, 0.04], [0.22, 0.36], [0.24, 0.38], [0, 0.38]], 0, 0.58, 0, 20));
    b.add("lacquer-black", box(0.16, 0.1, 0.03, 0, 0.62, 0.21));
    b.add("flame", box(0.12, 0.012, 0.01, 0, 0.64, 0.226), box(0.12, 0.012, 0.01, 0, 0.67, 0.226), box(0.12, 0.012, 0.01, 0, 0.7, 0.226));
    // the pan on top, chestnuts in it; the pipe up from the back with its cap
    b.add("iron", lathe([[0, 0], [0.24, 0], [0.27, 0.06], [0.26, 0.065], [0.23, 0.008], [0, 0.008]], 0, 0.96, 0, 22));
    for (let k = 0; k < 22; k++) { const a = r01(s, k) * 6.283, d = Math.sqrt(r01(s, k + 30)) * 0.2; b.add("wood-dark", lump(0.016, s + k, 1.1, 0.8, 1).move(Math.cos(a) * d, 0.982, Math.sin(a) * d)); }
    b.add("iron", rod([0, 0.85, -0.2], [0, 0.85, -0.3], 0.035), post(0.035, 0.75, 0, 0.85, -0.3), lathe([[0, 0], [0.08, 0], [0, 0.06]], 0, 1.62, -0.3, 12));
    // paper cones on a hook, ready to fill
    for (let k = 0; k < 4; k++) b.add("newsprint", lathe([[0, 0], [0.035, 0.11], [0, 0.11]], 0, 0, 0, 10).move(0.27 + k * 0.012, 0.75 + k * 0.01, 0.05 - k * 0.012));
    b.add("iron", rod([0.22, 0.88, 0.05], [0.29, 0.88, 0.05], 0.004));
    return b.parts();
  },
});

/** A spruce for sale: three or four ragged tiers on a trunk, h tall, its foot at the origin. */
function spruce(h: number, seed: number): { fir: Solid; wood: Solid } {
  // whorls of branches up the trunk, each a ring of drooping tips, smaller toward the leader; jittered so no two match
  const tiers: Solid[] = [], n = 7;
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), y = 0.18 * h + f * 0.7 * h, r = (0.32 - 0.26 * f) * h * rr(seed, i, 0.8, 1.15), th = (0.22 - 0.08 * f) * h;
    const tier = lathe([[0, 0], [r * 0.7, -0.06 * th], [r, -0.22 * th], [r * 0.82, 0.05 * th], [0.02, th], [0, th]], 0, 0, 0, 7)
      .refineToLength(Math.max(0.06, r / 3))
      .warp((px: number, py: number, pz: number): [number, number, number] => { const k = 1 + 0.25 * noise3(px * 8, py * 8, pz * 8, seed + i); return [px * k, py, pz * k]; });
    tiers.push(tier.rotate(0, r01(seed, i + 5) * 51, 0).move(0, y, 0));
  }
  tiers.push(lathe([[0, 0], [0.03, 0], [0, 0.16 * h]], 0, 0.86 * h, 0, 6)); // the leader
  return { fir: union(...tiers), wood: post(0.03, h * 0.35, 0, 0, 0) };
}
function treeSale(v: number): Part[] {
  const b = new Build(), s = 900 + v, RAIL = 1.2;
  b.add("wood-raw", post(0.04, 1.4, -1.6, 0, 0), post(0.04, 1.4, 1.6, 0, 0), rodX(0.03, 3.3, 0, RAIL, 0));
  const n = v ? 6 : 8;
  for (let k = 0; k < n; k++) {
    const h = rr(s, k, 1.5, 2.4), x = -1.4 + (k * 2.8) / (n - 1) + rr(s, k + 10, -0.08, 0.08), lean = -deg(Math.atan(0.5 / RAIL)), t = spruce(h, s * 10 + k);
    const place = (sol: Solid) => sol.rotate(lean + rr(s, k + 20, -4, 4), rr(s, k + 30, -20, 20), rr(s, k + 40, -5, 5)).move(x, 0, 0.5);
    b.add("fir", place(t.fir));
    b.add("wood-dark", place(t.wood));
  }
  for (let k = 0; k < (v ? 3 : 2); k++) {
    const h = rr(s, k + 60, 1.2, 1.8), t = spruce(h, s * 20 + k);
    // on its side, resting on its whorls (0.37 h out, most of that pressed flat under its weight), not sunk
    const place = (sol: Solid) => sol.rotate(0, 0, -90).scale(1, 0.75, 1).move(0, h * 0.3, 0).rotate(0, rr(s, k + 70, -30, 30), 0).move(-1.0 + k * 1.1, 0, 1.3 + k * 0.1);
    b.add("fir", place(t.fir));
    b.add("wood-dark", place(t.wood));
  }
  // the seller's fire basket: an iron basket on three legs, coke glowing in it
  b.add("iron", lathe([[0.16, 0], [0.2, 0], [0.24, 0.3], [0.22, 0.3], [0.18, 0.02], [0.16, 0.02]], 2.0, 0.35, 0.8, 12));
  for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3; b.add("iron", rod([2.0 + Math.cos(a) * 0.2, 0, 0.8 + Math.sin(a) * 0.2], [2.0 + Math.cos(a) * 0.17, 0.36, 0.8 + Math.sin(a) * 0.17], 0.012)); }
  for (let k = 0; k < 10; k++) { const a = r01(s, k + 80) * 6.283, d = Math.sqrt(r01(s, k + 90)) * 0.17; b.add(k % 3 ? "coke" : "flame", lump(0.035, s + k, 1, 0.8, 1).move(2.0 + Math.cos(a) * d, 0.6, 0.8 + Math.sin(a) * d)); }
  return b.parts();
}
for (let v = 0; v < 2; v++) prop({ id: `tree-sale-${v}`, items: ["xmas-trees"], size: [4.6, 2.4, 2.0], place: "floor", where: "set", tris: 34000, glow: [{ at: [2.0, 0.75, 0.8], lumens: 250, color: "#ff8f40", range: 5, flicker: 0.4 }], parts: () => treeSale(v) });

// ── the street's furniture ──────────────────────────────────────────────────────────────────────────────────────

/** The Trinkhalle: a mineral-water booth on a square or a tram terminus, cream boards with green trim, a wide counter
 *  window under a flap, bottles on the shelves behind and siphons on the counter, a hipped zinc roof. The war's
 *  lemonade was sugarless (saccharin) and the bottles scarce: the shelves are half empty. */
prop({
  id: "kiosk-drinks", items: ["kiosk-drinks"], size: [2.4, 3.0, 2.2], place: "floor", where: "set", tris: 30000,
  parts: () => {
    const b = new Build(), s = 950, W = 1.8, D = 1.5, Y0 = 0.12, Y1 = 2.25;
    b.add("granite", box(W + 0.1, Y0, D + 0.1));
    const win = box(1.3, 0.92, 0.4, 0, 0.98, D / 2);
    b.add("tram-ivory", box(W, Y1 - Y0, D, 0, Y0, 0).minus(box(W - 0.08, Y1, D - 0.08, 0, Y0 + 0.03, 0)).minus(win).minus(box(0.4, 0.5, W, 0, 1.35, 0).rotate(0, 90, 0)));
    b.add("paint-green", box(W + 0.03, 0.18, D + 0.03, 0, Y0, 0).minus(box(W - 0.02, 0.3, D - 0.02, 0, Y0 - 0.05, 0)).minus(win), box(W + 0.04, 0.22, D + 0.04, 0, Y1 - 0.22, 0).minus(box(W - 0.02, 0.3, D - 0.02, 0, Y1 - 0.25, 0)));
    for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) for (const z of [-D / 2 + 0.02, D / 2 - 0.02]) b.add("paint-green", box(0.07, Y1 - Y0, 0.07, x, Y0, z));
    // its name on a board standing on the roof's front edge, over the flap
    b.add("paint-green", box(1.3, 0.3, 0.03, 0, Y1 + 0.04, D / 2 + 0.2));
    b.add("tram-ivory", sign("TRINKHALLE", 0.13).move(0, Y1 + 0.19, D / 2 + 0.215));
    b.add("zinc", manifold.hull([[-W / 2 - 0.28, Y1, -D / 2 - 0.28], [W / 2 + 0.28, Y1, -D / 2 - 0.28], [-W / 2 - 0.28, Y1, D / 2 + 0.28], [W / 2 + 0.28, Y1, D / 2 + 0.28], [-W / 2 - 0.28, Y1 + 0.05, -D / 2 - 0.28], [W / 2 + 0.28, Y1 + 0.05, -D / 2 - 0.28], [-W / 2 - 0.28, Y1 + 0.05, D / 2 + 0.28], [W / 2 + 0.28, Y1 + 0.05, D / 2 + 0.28], [-0.3, Y1 + 0.55, 0], [0.3, Y1 + 0.55, 0]]));
    // the counter, the flap propped over the window, glass in the side windows
    b.add("wood-dark", box(1.42, 0.045, 0.34, 0, 0.94, D / 2 + 0.02), box(1.5, 0.025, 0.5, 0, 0, 0.25).rotate(-22, 0, 0).move(0, 1.92, D / 2));
    b.add("iron", rod([-0.65, 1.93, D / 2 + 0.02], [-0.65, 2.1, D / 2 + 0.45], 0.008), rod([0.65, 1.93, D / 2 + 0.02], [0.65, 2.1, D / 2 + 0.45], 0.008));
    b.add("glass", box(0.012, 0.5, 0.4, -W / 2, 1.35, 0), box(0.012, 0.5, 0.4, W / 2, 1.35, 0));
    // shelves behind: three boards, bottles on them with gaps where the war took the rest
    const bottle = lathe([[0, 0], [0.034, 0], [0.034, 0.17], [0.012, 0.23], [0.012, 0.27], [0, 0.27]], 0, 0, 0, 8);
    for (const [k, y] of [1.05, 1.38, 1.71].entries()) {
      b.add("wood-dark", box(W - 0.12, 0.025, 0.22, 0, y, -D / 2 + 0.16));
      for (let i = 0; i < 16; i++) if (r01(s, k * 20 + i) < 0.55) b.add(r01(s, k * 20 + i + 100) < 0.3 ? "glass-amber" : "glass-green", bottle.move(-0.75 + i * 0.1, y + 0.025, -D / 2 + 0.16 + rr(s, k * 20 + i + 50, -0.05, 0.05)));
    }
    // siphons on the counter: a glass body and a pewter head with its lever
    for (const x of [-0.45, -0.3, 0.42]) {
      b.add("glass-frost", lathe([[0, 0], [0.045, 0], [0.047, 0.2], [0.03, 0.24], [0, 0.24]], x, 0.985, D / 2 + 0.05, 12));
      b.add("zinc", box(0.05, 0.07, 0.07, x, 1.225, D / 2 + 0.05), rod([x, 1.27, D / 2 + 0.05], [x, 1.25, D / 2 + 0.13], 0.006), rod([x, 1.24, D / 2 + 0.08], [x, 1.2, D / 2 + 0.11], 0.005));
    }
    b.add("glass", lathe([[0, 0], [0.032, 0], [0.036, 0.11], [0, 0.11]], 0.1, 0.985, D / 2 + 0.06, 10), lathe([[0, 0], [0.032, 0], [0.036, 0.11], [0, 0.11]], 0.2, 0.985, D / 2 + 0.03, 10));
    return b.parts();
  },
});

/** Enamel advertising plates screwed to a house wall at head height, chipped to the iron at their edges and screws:
 *  the war's goods (coffee substitute; tobacco, chocolate and coal while there was any). Generic words, no makers. */
const ENAMEL: [MatId, MatId, string, number][] = [["enamel-blue", "enamel", "KAFFEE-ERSATZ", 0.07], ["enamel-yellow", "enamel-black", "ZIGARREN · TABAK", 0.06], ["enamel-red", "enamel", "SCHOKOLADE", 0.075], ["enamel-black", "enamel-yellow", "BRIKETTS · KOHLEN", 0.055]];
for (const [v, [ground, ink, text, size]] of ENAMEL.entries()) prop({
  id: `enamel-sign-${v}`, items: ["enamel-signs"], size: [0.72, 2.45, 0.03], place: "wall", where: "set", tris: 8000,
  parts: () => {
    const b = new Build(), s = 960 + v, W = 0.7, H = 0.42, Y = 1.95;
    b.add(ground, box(W, H, 0.012, 0, Y, 0.006));
    b.add(ink, box(W - 0.03, 0.012, 0.002, 0, Y + 0.02, 0.013), box(W - 0.03, 0.012, 0.002, 0, Y + H - 0.032, 0.013), box(0.012, H - 0.03, 0.002, -W / 2 + 0.021, Y + 0.015, 0.013), box(0.012, H - 0.03, 0.002, W / 2 - 0.021, Y + 0.015, 0.013));
    b.add(ink, sign(text, size).move(0, Y + H / 2, 0.013));
    for (const [x, y] of [[-W / 2 + 0.04, Y + 0.04], [W / 2 - 0.04, Y + 0.04], [-W / 2 + 0.04, Y + H - 0.04], [W / 2 - 0.04, Y + H - 0.04]]) {
      b.add("iron-rust", lathe([[0, 0], [0.018 + r01(s, x * 10 + y) * 0.012, 0], [0, 0.0025]], 0, 0, 0, 8).rotate(90, 0, 0).move(x, y, 0.0125)); // chipped round its screw
    }
    for (let k = 0; k < 4; k++) { const e = r01(s, k), x = (e - 0.5) * (W - 0.05), y = Y + (r01(s, k + 9) < 0.5 ? 0.01 : H - 0.02); b.add("iron-rust", box(rr(s, k + 20, 0.02, 0.06), 0.012, 0.0025, x, y, 0.0125)); }
    return b.parts();
  },
});

prop({
  id: "grit-box", items: ["grit-box"], size: [1.05, 0.75, 0.62], place: "floor", where: "set", tris: 6000,
  parts: () => {
    // the box on two skids, a sloped lid hinged at the back, a hasp at the front
    const b = new Build(), W = 1.0, D = 0.56, Y = 0.06, H = 0.6 + Y;
    b.add("wood-grey", box(W, H - Y, D, 0, Y, 0).minus(box(W - 0.05, H, D - 0.05, 0, Y + 0.05, 0)), box(0.06, Y, D, -W / 2 + 0.1, 0, 0), box(0.06, Y, D, W / 2 - 0.1, 0, 0));
    b.add("sand", box(W - 0.05, 0.02, D - 0.05, 0, H - 0.2, 0));
    b.add("wood-grey", manifold.hull([[-W / 2 - 0.02, H, -D / 2 - 0.03], [W / 2 + 0.02, H, -D / 2 - 0.03], [-W / 2 - 0.02, H + 0.13, -D / 2 - 0.03], [W / 2 + 0.02, H + 0.13, -D / 2 - 0.03], [-W / 2 - 0.02, H, D / 2 + 0.04], [W / 2 + 0.02, H, D / 2 + 0.04], [-W / 2 - 0.02, H + 0.03, D / 2 + 0.04], [W / 2 + 0.02, H + 0.03, D / 2 + 0.04]]));
    b.add("paint-white", sign("STREUSAND", 0.09).move(0, Y + (H - Y) * 0.5, D / 2));
    b.add("iron", box(0.04, 0.12, 0.012, 0, H - 0.08, D / 2 + 0.035));
    return b.parts();
  },
});

prop({
  id: "ration-board", items: ["ration-notice"], size: [0.8, 1.9, 0.05], place: "wall", where: "set", tris: 12000,
  parts: () => {
    const b = new Build();
    b.add("wood-dark", box(0.76, 0.62, 0.02, 0, 1.15, 0.01));
    b.add("newsprint", box(0.32, 0.46, 0.003, -0.18, 1.22, 0.0215), box(0.32, 0.46, 0.003, 0.18, 1.21, 0.0215));
    b.add("lacquer-black", box(0.26, 0.03, 0.002, -0.18, 1.6, 0.024), box(0.26, 0.03, 0.002, 0.18, 1.59, 0.024));
    b.add("iron", ball(0.008).move(-0.18, 1.66, 0.026), ball(0.008).move(0.18, 1.65, 0.026), ball(0.008).move(0, 1.08, 0.026));
    b.add("board-chalk", box(0.46, 0.3, 0.015, 0, 0, 0).rotate(0, 0, -2).move(0, 0.74, 0.02));
    b.add("chalk", sign("HEUTE KEINE", 0.045).rotate(0, 0, -2).move(0, 0.94, 0.0275), sign("BUTTER", 0.06).rotate(0, 0, -2).move(0, 0.85, 0.0275));
    b.add("jute", rod([0, 1.08, 0.026], [-0.15, 1.03, 0.026], 0.002), rod([0, 1.08, 0.026], [0.15, 1.03, 0.026], 0.002));
    return b.parts();
  },
});

export const KIT_LIFE = true;
