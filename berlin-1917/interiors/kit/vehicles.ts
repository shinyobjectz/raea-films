// Berlin's horse-drawn and hand vehicles in winter 1917-18, parked: shafts propped on a trestle, a pole on the setts.
// The horses come from the character SDK when someone builds one; until then each vehicle carries its own tack points
// (HITCH) in its frame: origin on the ground under the middle between the axles, +z forward, x across (kit/outgeo).
//   cab-droschke     the one-horse half-hooded landaulet, Berlin's typical cab, after the Technikmuseum's of 1898: a
//                    buttoned leather seat for two under a folding hood, S-curved sides down to a low foot well,
//                    splashers before the rear wheels, the driver's box with footboard and tall dash, two lamps, the
//                    taximeter (Berlin's cabs carried them from 1895) with its FREI flag, the number on enamel plates;
//                    black lacquer with a yellow line, as the museum's. ASSUMED: sizes scaled from the photographs
//                    against its 1.36 m track; the number 1417
//   dray-beer        a brewery's low dray with twelve barrels in two tiers, a high box, a pole for two horses
//   cart-coal        the coal merchant's box cart with sacks of briquettes, one horse, his scale hung behind
//   cart-ladder      the Leiterwagen, a hand-drawn ladder-sided cart on four small wheels: 1917's everyday haul
//   cart-hand        a two-wheeled push cart, a barrow-man's or a street trader's
//   pram             a lacquered pram on C-springs, the hood up
//   van-furniture    the furniture van (Möbelwagen): a high box on cranked axles, a pole for two horses, its doors at
//                    the back; van-furniture-open has them swung back and the tail ladder down as a ramp, a household
//                    half loaded inside on the quilts
//   cart-milk        a dairy's one-horse milk cart on its morning round: a low box carrying eight 20 l churns in a
//                    rack, the measuring cans (Litermaße) hung on hooks behind, a hand bell on an iron by the seat
//                    (the "Bimmel-Bolle" rang one); brown with MILCH on the side board (ASSUMED: no maker's name)
//   dray-flat        the Rollwagen of the goods stations: a long low deck on small wheels, stakes along its edges, a
//                    pole for two horses, loaded with crates and bales under a roped tarpaulin
//   post-wagon       the Reichspost's one-horse parcel van: a closed box with a curved roof and a rail round it, the
//                    double doors at the back, REICHSPOST on its sides; blue as the letter boxes (ASSUMED: the
//                    photographs are black and white)
//   bus-horse        the ABOAG's two-horse double-deck omnibus (Decksitzwagen, Bauart 1893; berliner-verkehrsseiten.de,
//                    ABOAG Pferdebus-Wagen): a body 3.62 m long and 1.75 m wide on a 2.1 m wheelbase, 7.23 m overall
//                    with its pole; 14 seats inside on two long benches, 14 on the roof's back-to-back knifeboard
//                    bench (2.70 m), two standing on the railed platform behind; a stair (not a ladder, after 1896)
//                    to the roof; the driver's box floating before the body. Red as the cars of 1886 were; the route
//                    boards along the roof rail and the line number are ASSUMED. Horse buses still ran in 1917 (the
//                    last on 25 Aug 1923) while the army held the motor buses (ASSUMED as the reason)
//   hearse           a glazed hearse: black lacquer, plate glass all round with black drapes tied back, a coffin's
//                    deck inside, a carved cornice with four black plumes at its corners, the driver's high box
// Every horse and hand vehicle carries road mud up its wheels, and each has a -worn twin: its paint and varnish
// faded and rubbed, the upholstery stained, and the cab with a pane boarded over.
// Wheels are separate solids in the parts (mat iron for tyres, the body's wheel colour for felloes and spokes), all
// at their axles so a mover can spin them about x through each WHEELS entry.
import { manifold, type Solid } from "raea/3d";
import { ball, box, lathe, post, rbox, ring, union, type V3 } from "./geo";
import { bez, leafSpring, type P2, side, smooth, sph, sweepSheet, tube, turn, zAxis } from "./forms";
import type { MatId } from "./mats";
import { archRoof, muddy, rod, sign, spoked, splashMask } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
type Hitch = { fare?: [V3, V3]; shaftTips?: [V3, V3]; tugs?: [V3, V3]; breeching?: [V3, V3]; traceHooks?: [V3, V3]; poleEnd?: V3; poleStrap?: V3; seat?: V3; footboard?: V3 };
/** Tack points per vehicle id, in its frame (for the horse to come and for people: the coachman's seat and feet). */
export const HITCH: Record<string, Hitch> = {};
/** Each wheel's centre and radius per vehicle id, to spin about x. */
export const WHEELS: Record<string, { at: V3; r: number }[]> = {};

export class Build {
  m = new Map<MatId, Solid[]>();
  add(mat: MatId, ...s: Solid[]) { const l = this.m.get(mat) ?? []; l.push(...s); this.m.set(mat, l); return this; }
  parts(): Part[] { return [...this.m.entries()].map(([mat, s], i) => ({ mat, solid: union(...s), overlap: i > 0 })); }
}

/** A pair of spoked wheels on an axle across x at z, track t (centre to centre). */
export function axle(b: Build, id: string, R: number, z: number, t: number, w: number, n: number, wood: MatId, o: Parameters<typeof spoked>[3] = {}) {
  const wh = spoked(R, w, n, o);
  for (const s of [-1, 1]) { b.add("iron", wh.iron.move(s * t / 2, R, z)); b.add(wood, wh.wood.move(s * t / 2, R, z)); (WHEELS[id] ??= []).push({ at: [s * t / 2, R, z], r: R }); }
  b.add("iron", rod([-t / 2, R, z], [t / 2, R, z], 0.025));
}
/** One horse's shafts from the front axle bed at z0 out to the tips at z1, h high at the tugs; propped on a trestle
 *  when `parked`. The tug, breeching and trace points follow a horse's girth 0.55 m behind its shoulder. */
export function shafts(b: Build, id: string, z0: number, z1: number, y0: number, h: number, half: number, wood: MatId, parked: boolean) {
  for (const s of [-1, 1]) {
    const p0: V3 = [s * 0.55, y0, z0], p1: V3 = [s * half, h, z0 + (z1 - z0) * 0.55], p2: V3 = [s * (half - 0.04), h + 0.18, z1];
    b.add(wood, rod(p0, p1, 0.032), rod(p1, p2, 0.026));
    b.add("iron", lathe([[0, 0], [0.035, 0], [0.03, 0.06], [0, 0.07]], ...p2, 8)); // the tip ferrule
  }
  b.add(wood, rod([-0.55, y0, z0], [0.55, y0, z0], 0.03), rod([-0.6, y0, z0 + 0.5], [0.6, y0, z0 + 0.5], 0.025));
  const zt = z0 + (z1 - z0) * 0.55;
  HITCH[id] = { ...HITCH[id], shaftTips: [[-(half - 0.04), h + 0.18, z1], [half - 0.04, h + 0.18, z1]], tugs: [[-half, h, zt], [half, h, zt]], breeching: [[-half, h - 0.05, zt - 0.75], [half, h - 0.05, zt - 0.75]], traceHooks: [[-0.5, y0 + 0.02, z0 + 0.25], [0.5, y0 + 0.02, z0 + 0.25]] };
  // parked: a carter's trestle under the tips' crossbar, the tips resting on it
  if (parked) b.add("wood-grey", rod([-half, h - 0.02, z1 - 0.25], [half, h - 0.02, z1 - 0.25], 0.03), rod([-half, h - 0.04, z1 - 0.25], [-half - 0.15, 0, z1 - 0.1], 0.025), rod([-half, h - 0.04, z1 - 0.25], [-half - 0.15, 0, z1 - 0.4], 0.025), rod([half, h - 0.04, z1 - 0.25], [half + 0.15, 0, z1 - 0.1], 0.025), rod([half, h - 0.04, z1 - 0.25], [half + 0.15, 0, z1 - 0.4], 0.025));
}
/** A pole for a pair, from the fore-carriage at z0, lowered to the setts at its far end when parked (its end at 1.1 m
 *  when hitched: HITCH.poleEnd), with a splinter bar and swingletrees for the traces. */
export function pole(b: Build, id: string, z0: number, y0: number, len: number, wood: MatId, parked: boolean) {
  const end: V3 = parked ? [0, 0.08, z0 + Math.sqrt(len * len - y0 * y0)] : [0, 1.1, z0 + len];
  b.add(wood, rod([0, y0, z0], end, 0.04), rod([-0.65, y0, z0 + 0.15], [0.65, y0, z0 + 0.15], 0.035));
  for (const s of [-1, 1]) b.add(wood, rod([s * 0.62, y0 + 0.02, z0 + 0.3], [s * 0.2, y0 + 0.02, z0 + 0.3], 0.025), rod([s * 0.62, y0 + 0.02, z0 + 0.3], [s * 1.04, y0 + 0.02, z0 + 0.3], 0.025));
  b.add("iron", lathe([[0, 0], [0.05, 0], [0.04, 0.12], [0, 0.14]], 0, 0, 0, 8).rotate(90, 0, 0).move(...end));
  const hitched: V3 = [0, 1.1, z0 + len];
  HITCH[id] = { ...HITCH[id], poleEnd: hitched, poleStrap: [0, 1.08, z0 + len - 0.35], traceHooks: [[-0.95, y0 + 0.02, z0 + 0.3], [-0.25, y0 + 0.02, z0 + 0.3], [0.25, y0 + 0.02, z0 + 0.3], [0.95, y0 + 0.02, z0 + 0.3]] as unknown as [V3, V3] };
}
/** A driver's box: a seat on irons over the fore-carriage, a footboard sloping before it, a backrest. */
export function seatBox(b: Build, id: string, y: number, z: number, w: number, body: MatId) {
  b.add(body, box(w, 0.32, 0.5, 0, y - 0.32, z), box(w, 0.04, 0.55, 0, y - 0.02, z)); // the box with its cushion board
  b.add("leather", rbox(w - 0.06, 0.08, 0.46, 0.03, 0, y, z));
  b.add(body, box(w, 0.04, 0.45).rotate(-25, 0, 0).move(0, y - 0.62, z + 0.55)); // the footboard, sloping down to the front
  b.add("iron", rod([-w / 2, y + 0.05, z - 0.23], [-w / 2, y + 0.3, z - 0.28], 0.01), rod([w / 2, y + 0.05, z - 0.23], [w / 2, y + 0.3, z - 0.28], 0.01), rod([-w / 2, y + 0.3, z - 0.28], [w / 2, y + 0.3, z - 0.28], 0.01));
  HITCH[id] = { ...HITCH[id], seat: [0, y + 0.08, z], footboard: [0, y - 0.55, z + 0.6] };
}
/** A coach lamp: a square lantern on a socket, its glass glowing when lit. */
export function coachLamp(b: Build, x: number, y: number, z: number) {
  b.add("lacquer-black", box(0.13, 0.2, 0.13, x, y, z), lathe([[0, 0], [0.1, 0], [0.04, 0.08], [0.01, 0.12], [0, 0.12]], x, y + 0.2, z, 8), post(0.015, 0.25, x, y - 0.25, z));
  b.add("glass-signal", box(0.1, 0.13, 0.135, x, y + 0.04, z));
}
/** A cooper's barrel with its axis along x, length L, belly r, ends r0, its hoops in iron. */
export function barrel(L: number, r: number, r0: number): { wood: Solid; iron: Solid } {
  const wood = lathe([[0, -L / 2], [r0, -L / 2], [r * 0.93, -L / 4], [r, 0], [r * 0.93, L / 4], [r0, L / 2], [0, L / 2]], 0, 0, 0, 14).rotate(0, 0, 90);
  const hoops = [-0.44, -0.3, 0.3, 0.44].map((f) => { const rr = r0 + (r - r0) * (1 - (2 * f) ** 2) + 0.004; return lathe([[rr - 0.006, -0.02], [rr, -0.02], [rr, 0.02], [rr - 0.006, 0.02]], 0, f * L, 0, 14).rotate(0, 0, 90); });
  return { wood, iron: union(...hoops) };
}

// ── the cab ───────────────────────────────────────────────────────────────────────────────────────────────────────
function droschke(id: string, parked: boolean, worn = false): Part[] {
  // Berlin's typical cab, the one-horse half-hooded landaulet, after the Deutsches Technikmuseum's cab of 1898 (its
  // placard: "die typischen Droschkenfahrzeuge des alten Berlin") and Bundesarchiv Bild 146-1998-022-36 (cabs at the
  // Stettiner Bahnhof, 1924): the passengers' seat for two over the rear axle under a folding hood, the body's sides
  // sweeping down in an S to a low foot well and its step, splashers curving up before the rear wheels, the driver's
  // box at the front with its footboard and tall dash, the taximeter on its post where the fare can read it, two
  // brass-rimmed lamps, the number plate on the box; full-elliptic springs, a fifth wheel and curved perch irons.
  const b = new Build(), T = 1.36, RF = 0.43, RR = 0.55, ZF = 0.9, ZR = -0.9, BW = 1.12;
  const LEA: MatId = "leather-black"; // wornParts makes it leather-black-worn
  axle(b, id, RF, ZF, T, 0.055, 12, "lacquer-black", { felloe: 0.055, hub: 0.09 });
  axle(b, id, RR, ZR, T, 0.06, 14, "lacquer-black", { felloe: 0.06, hub: 0.1 });
  // a fine yellow line round each felloe's face, as the museum's
  for (const [R, z] of [[RF, ZF], [RR, ZR]]) for (const s of [-1, 1]) b.add("enamel-yellow", lathe([[R - 0.05, -0.002], [R - 0.045, -0.002], [R - 0.045, 0.002], [R - 0.05, 0.002]], 0, 0, 0, 28).rotate(0, 0, 90).move(s * (T / 2 + 0.024), R, z));
  // ── the axle beds, full-elliptic springs (two semi-elliptics end to end), the fifth wheel, the perch irons
  const ell = (x: number, yc: number, z: number, L: number, bow: number) => b.add("iron", leafSpring(L, 4, bow, 0.045).rotate(180, 0, 0).move(x, yc + bow, z), leafSpring(L, 4, bow, 0.045).move(x, yc - bow, z));
  b.add("lacquer-black", box(1.24, 0.08, 0.1, 0, RF - 0.05, ZF), box(1.24, 0.08, 0.1, 0, RR - 0.05, ZR));
  for (const s of [-1, 1]) {
    ell(s * 0.42, RF + 0.11, ZF, 0.62, 0.05);
    ell(s * 0.5, RR + 0.14, ZR, 0.7, 0.08);
    b.add("iron", box(0.08, 0.05, 0.1, s * 0.5, 0.79, ZR)); // the spring block under the body
  }
  b.add("iron", ring(0.34, 0.012, 32, 6).rotate(90, 0, 0).move(0, RF + 0.19, ZF), box(0.9, 0.05, 0.12, 0, RF + 0.18, ZF));
  for (const s of [-1, 1]) b.add("iron", ...tube(bez([[s * 0.3, RF + 0.21, ZF - 0.2], [s * 0.3, 0.42, 0.3], [s * 0.32, 0.42, -0.45], [s * 0.42, RR + 0.22, ZR + 0.25]], 10), 0.016));
  // ── the body: the tub in side profile [z, y], the seat's well and the foot well taken out of it
  const prof: P2[] = [[-1.32, 0.84], [-1.36, 0.95], [-1.37, 1.15], [-1.35, 1.33], [-1.2, 1.37], [-0.75, 1.37], [-0.57, 1.31], [-0.45, 1.17], [-0.38, 0.97], [-0.31, 0.81], [-0.22, 0.73], [0.3, 0.73], [0.3, 0.55], [-0.3, 0.55], [-0.43, 0.6], [-0.56, 0.72], [-0.76, 0.84]];
  let tub = side(prof, BW).intersect(rbox(BW, 1.0, 1.8, 0.06, 0, 0.5, -0.55));
  tub = tub.minus(rbox(BW - 0.07, 1.0, 0.93, 0.04, 0, 0.97, -0.825), box(BW - 0.07, 0.8, 0.6, 0, 0.6, 0.0));
  b.add("lacquer-black", tub);
  // a beading line along the side's top edge and down the S, picked out in yellow
  const bead: P2[] = [[-1.3, 1.3], [-0.75, 1.31], [-0.55, 1.25], [-0.44, 1.1], [-0.37, 0.93], [-0.28, 0.78], [0.28, 0.69]];
  for (const s of [-1, 1]) b.add("enamel-yellow", ...tube(bead.map(([z, y]): V3 => [s * (BW / 2 + 0.002), y, z]), 0.004));
  // the passengers' seat: a buttoned cushion and back in black leather, the arm rolls, a mat and a rug on the floor
  b.add(LEA, rbox(BW - 0.1, 0.12, 0.52, 0.045, 0, 0.97, -1.02), rbox(BW - 0.1, 0.42, 0.13, 0.05, 0, 0, 0).rotate(-10, 0, 0).move(0, 1.07, -1.25));
  const btn: Solid[] = [];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6 - (r % 2); k++) btn.push(lathe([[0, 0], [0.012, 0], [0.008, 0.012], [0, 0.014]], 0, 0, 0, 6).rotate(80, 0, 0).move(-0.4 + (r % 2) * 0.08 + k * 0.16, 1.15 + r * 0.11, -1.2 - r * 0.02));
  b.add("cloth-black", ...btn);
  for (const s of [-1, 1]) b.add(LEA, rbox(0.07, 0.07, 0.55, 0.03, s * (BW / 2 - 0.06), 1.3, -1.0));
  b.add("cloth-brown", box(BW - 0.1, 0.012, 0.56, 0, 0.6, 0.0), rbox(0.6, 0.06, 0.32, 0.025, 0.1, 0.612, -0.12));
  HITCH[id] = { ...HITCH[id], fare: [[-0.25, 1.1, -1.0], [0.25, 1.1, -1.0]] } as Hitch;
  // ── the hood, raised: a black leather shell open at the front, lofted through stations [z, top, half width] that
  //    round its back in side view and in plan, over three bows that show as ridges; a brass bead round its mouth, the
  //    S-shaped landau irons on its sides. arch(): the section at z, square below and rounded over the top.
  const arch = (hw: number, y0: number, y1: number, r: number, z: number): V3[] => {
    const p: V3[] = [[hw, y0, z], [-hw, y0, z]];
    for (let k = 0; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); p.push([hw - r + r * Math.cos(a), y1 - r + r * Math.sin(a), z], [-(hw - r + r * Math.cos(a)), y1 - r + r * Math.sin(a), z]); }
    return p;
  };
  const ST: V3[] = [[-1.43, 1.6, 0.5], [-1.42, 1.76, 0.545], [-1.37, 1.9, 0.57], [-1.26, 2.0, 0.575], [-1.08, 2.07, 0.575], [-0.86, 2.095, 0.575], [-0.62, 2.075, 0.575]];
  const topAt = (z: number) => { for (let i = 0; i + 1 < ST.length; i++) if (z <= ST[i + 1][0]) return ST[i][1] + ((ST[i + 1][1] - ST[i][1]) * (z - ST[i][0])) / (ST[i + 1][0] - ST[i][0]); return ST[ST.length - 1][1]; };
  const loft = (d: number, y0: number, r: number, zEnd: number) => manifold.union(...ST.slice(0, -1).map(([z, t, w], i) => { const [z2, t2, w2] = ST[i + 1]; return manifold.hull([...arch(w - d, y0, t - d, r, i === 0 ? z + d : z), ...arch(w2 - d, y0, t2 - d, r, i + 2 === ST.length ? zEnd : z2)]); }));
  b.add(LEA, loft(0, 1.3, 0.2, -0.62).minus(loft(0.022, 1.25, 0.18, -0.3)));
  for (const zb of [-1.2, -0.95, -0.72]) {
    const t = topAt(zb);
    b.add(LEA, manifold.hull([...arch(0.583, 1.3, t + 0.008, 0.2, zb - 0.02), ...arch(0.583, 1.3, t + 0.008, 0.2, zb + 0.02)]).minus(manifold.hull([...arch(0.565, 1.2, t - 0.01, 0.2, zb - 0.05), ...arch(0.565, 1.2, t - 0.01, 0.2, zb + 0.05)])));
  }
  const corner = (hw: number, y1: number, r: number, z: number): V3[] => [...Array(7)].map((_, k) => { const a = (k / 6) * (Math.PI / 2); return [hw - r + r * Math.cos(a), y1 - r + r * Math.sin(a), z] as V3; });
  const mc = corner(0.577, 2.077, 0.2, -0.62);
  b.add("brass", ...tube([[0.577, 1.3, -0.62], ...mc, ...[...mc].reverse().map(([x, y, z]): V3 => [-x, y, z]), [-0.577, 1.3, -0.62]], 0.007));
  for (const s of [-1, 1]) b.add("iron", ...tube(bez([[s * 0.588, 1.36, -1.24], [s * 0.59, 1.68, -1.1], [s * 0.59, 1.4, -0.84], [s * 0.588, 1.62, -0.7]], 12), 0.011), ball(0.02).move(s * 0.59, 1.52, -0.97));
  // ── the splashers before the rear wheels, swept up from the step over the wheel's front; the steps
  const fl: P2[] = [[-1, 0.004], [-0.4, 0.012], [0.4, 0.012], [1, 0.004], [1.02, -0.012]];
  for (const s of [-1, 1]) {
    b.add("lacquer-black", ...sweepSheet(smooth([[-0.14, 0.47], [-0.22, 0.6], [-0.32, 0.78], [-0.45, 0.97], [-0.62, 1.11], [-0.82, 1.18], [-1.0, 1.18], [-1.12, 1.23]], 3), fl, () => s * 0.66, () => s * 0.075, 0.005));
    b.add("iron", rod([s * (BW / 2), 1.05, -0.6], [s * 0.6, 1.08, -0.62], 0.01), rod([s * (BW / 2), 0.62, -0.25], [s * 0.6, 0.6, -0.27], 0.01));
    b.add("iron", box(0.16, 0.012, 0.12, s * 0.62, 0.4, -0.06), rod([s * 0.56, 0.58, -0.06], [s * 0.6, 0.41, -0.06], 0.012));
  }
  // ── the driver's box: its body flaring up from the foot well's front, the seat cushion and back rail, the footboard
  //    over the front wheels on its stays and the tall leather dash in its iron frame
  const BX = (y: number) => 0.4 + (y - 0.6) * 0.08;
  b.add("lacquer-black", manifold.hull([[-BX(0.6), 0.6, 0.3], [BX(0.6), 0.6, 0.3], [-BX(0.6), 0.6, 0.66], [BX(0.6), 0.6, 0.66], [-BX(1.42), 1.42, 0.3], [BX(1.42), 1.42, 0.3], [-BX(1.42), 1.42, 0.74], [BX(1.42), 1.42, 0.74]]));
  b.add(LEA, rbox(2 * BX(1.42) - 0.04, 0.09, 0.42, 0.035, 0, 1.42, 0.52), rbox(2 * BX(1.42) - 0.06, 0.2, 0.06, 0.025, 0, 1.47, 0.32));
  b.add("lacquer-black", box(0.92, 0.03, 0.42, 0, 0.98, 0.95));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.3, RF + 0.21, ZF - 0.05], [s * 0.42, 0.97, 0.8], 0.014), rod([s * 0.3, RF + 0.21, ZF + 0.05], [s * 0.42, 0.97, 1.12], 0.014));
  b.add(LEA, box(0.86, 0.52, 0.02, 0, 1.0, 1.15));
  b.add("iron", ...tube([[-0.45, 0.98, 1.16], [-0.45, 1.5, 1.16], [-0.4, 1.56, 1.16], [0.4, 1.56, 1.16], [0.45, 1.5, 1.16], [0.45, 0.98, 1.16]], 0.011));
  HITCH[id] = { ...HITCH[id], seat: [0, 1.56, 0.55], footboard: [0, 1.0, 0.95] };
  // the lamps on brackets at the box's back corners (black, brass rim and chimney); the number on enamel plates
  for (const s of [-1, 1]) {
    b.add("lacquer-black", rod([s * 0.52, 1.0, 0.33], [s * 0.52, 1.44, 0.33], 0.014), zAxis(turn([[0, -0.1], [0.06, -0.1], [0.075, -0.06], [0.08, 0], [0.08, 0.03], [0, 0.03]], 18)).move(s * 0.52, 1.52, 0.33));
    b.add("iron", rod([s * BX(1.1), 1.1, 0.33], [s * 0.52, 1.1, 0.33], 0.01), rod([s * BX(1.35), 1.35, 0.33], [s * 0.52, 1.35, 0.33], 0.01));
    b.add("brass", zAxis(turn([[0.062, 0.03], [0.088, 0.03], [0.088, 0.05], [0.062, 0.05]], 18)).move(s * 0.52, 1.52, 0.33), turn([[0, 0], [0.05, 0], [0.045, 0.04], [0.02, 0.07], [0, 0.075]], 12).move(s * 0.52, 1.6, 0.31));
    b.add("glass-plate", zAxis(turn([[0, 0.032], [0.064, 0.032], [0, 0.05]], 18)).move(s * 0.52, 1.52, 0.33));
    b.add("enamel", rbox(0.2, 0.12, 0.008, 0.015, 0, 0, 0).rotate(0, 90, 0).move(s * (BX(1.1) + 0.006), 1.04, 0.5));
    b.add("enamel-black", sign("1417", 0.06).rotate(0, s * 90, 0).move(s * (BX(1.1) + 0.012), 1.1, 0.5));
  }
  // the taximeter on its post at the box's back, facing the fare, its flag up: FREI
  b.add("iron", rod([0.3, 1.4, 0.3], [0.3, 1.62, 0.28], 0.016), zAxis(turn([[0, -0.05], [0.12, -0.05], [0.13, -0.03], [0.13, 0.04], [0.11, 0.05], [0, 0.05]], 20)).move(0.3, 1.72, 0.26));
  b.add("iron", turn([[0, 0], [0.05, 0], [0.04, 0.06], [0.015, 0.08], [0, 0.08]], 12).move(0.3, 1.83, 0.26), rod([0.36, 1.82, 0.26], [0.42, 1.93, 0.26], 0.008));
  b.add("glass-plate", box(0.1, 0.06, 0.004, 0.3, 1.69, 0.207));
  b.add("enamel", box(0.12, 0.06, 0.006, 0.47, 1.92, 0.26));
  b.add("enamel-black", sign("FREI", 0.035).move(0.47, 1.95, 0.264));
  // the whip in its socket at the driver's right, the brake lever on its pivot beside the box
  b.add("iron", rod([-0.48, 1.3, 0.72], [-0.48, 1.48, 0.74], 0.016));
  b.add("wood-varnish", rod([-0.48, 1.48, 0.74], [-0.54, 2.45, 0.92], 0.007));
  b.add("iron", rod([-BX(0.75), 0.75, 0.58], [-0.47, 0.75, 0.58], 0.012), rod([-0.47, 0.75, 0.58], [-0.5, 1.6, 0.5], 0.013), sph(0.02, 8).move(-0.5, 1.62, 0.5));
  // the shafts, their roots stayed back to the front axle bed
  shafts(b, id, 1.2, 3.85, 0.6, 1.12, 0.38, "lacquer-black", parked);
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.4, RF + 0.02, ZF], [s * 0.55, 0.6, 1.2], 0.014));
  return worn ? wornParts(b.parts()) : b.parts();
}

// ── the brewery's dray ────────────────────────────────────────────────────────────────────────────────────────────
function dray(id: string, parked: boolean): Part[] {
  const b = new Build(), T = 1.6;
  axle(b, id, 0.45, 1.45, T, 0.09, 12, "wheel-yellow", { felloe: 0.07 });
  axle(b, id, 0.55, -1.45, T, 0.09, 14, "wheel-yellow", { felloe: 0.07 });
  const deck = 1.05, L = 4.2;
  b.add("wood-grey", box(2.0, 0.08, L, 0, deck - 0.08, 0)); // the deck
  b.add("wheel-yellow", box(0.12, 0.16, L, -0.95, deck - 0.24, 0), box(0.12, 0.16, L, 0.95, deck - 0.24, 0), box(2.0, 0.16, 0.12, 0, deck - 0.24, -L / 2 + 0.06), box(2.0, 0.16, 0.12, 0, deck - 0.24, L / 2 - 0.06));
  // stakes along each side with a low rail, and the brake's screw at the back
  for (const s of [-1, 1]) { for (let i = 0; i < 6; i++) b.add("wood-grey", box(0.05, 0.42, 0.05, s * 0.98, deck, -L / 2 + 0.2 + i * ((L - 0.4) / 5))); b.add("wood-grey", box(0.04, 0.08, L - 0.2, s * 0.98, deck + 0.34, 0)); }
  b.add("iron", rod([0.9, 0.7, -1.45], [0.9, 1.4, -1.6], 0.015), lathe([[0, 0], [0.09, 0], [0.09, 0.02], [0, 0.02]], 0.9, 1.4, -1.6, 10));
  // twelve barrels: eight lying in two rows, four standing on top at the front
  const { wood, iron } = barrel(0.82, 0.32, 0.27);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const z = -1.7 + i * 0.72; b.add("wood-mid", wood.rotate(0, 90, 0).move(s * 0.45, deck + 0.32, z)); b.add("iron", iron.rotate(0, 90, 0).move(s * 0.45, deck + 0.32, z)); }
  for (const [x, z] of [[-0.45, -1.35], [0.45, -1.35], [-0.45, -0.6], [0.45, -0.6]]) { b.add("wood-mid", wood.rotate(0, 0, 90).move(x, deck + 0.64 + 0.41, z)); b.add("iron", iron.rotate(0, 0, 90).move(x, deck + 0.64 + 0.41, z)); }
  seatBox(b, id, 2.15, 1.75, 1.3, "wheel-yellow");
  b.add("wheel-yellow", box(1.3, 1.1, 0.5, 0, 1.05, 1.75)); // the box's high front stand
  pole(b, id, 2.0, 0.85, 3.2, "wheel-yellow", parked);
  return b.parts();
}

// ── the coal merchant's cart ──────────────────────────────────────────────────────────────────────────────────────
function coalCart(id: string, parked: boolean): Part[] {
  const b = new Build(), T = 1.45;
  axle(b, id, 0.42, 0.9, T, 0.07, 12, "wood-grey");
  axle(b, id, 0.5, -0.9, T, 0.07, 12, "wood-grey");
  const y0 = 0.95, L = 2.9, W = 1.5;
  b.add("wood-grey", box(W, 0.06, L, 0, y0, -0.1));
  for (const s of [-1, 1]) b.add("wood-grey", box(0.05, 0.55, L, s * (W / 2 - 0.025), y0 + 0.06, -0.1), box(W, 0.55, 0.05, 0, y0 + 0.06, -0.1 + s * (L / 2 - 0.025)));
  b.add("iron", ...[-1, 1].flatMap((s) => [-1.2, -0.1, 1.0].map((z) => box(0.02, 0.6, 0.05, s * (W / 2 + 0.005), y0 + 0.03, z))));
  // sacks: twelve standing in rows, filled lumps of jute; briquettes spilt on the boards
  for (let i = 0; i < 12; i++) {
    const x = -0.45 + (i % 3) * 0.45, z = -1.25 + Math.floor(i / 3) * 0.66;
    b.add("jute", rbox(0.38, 0.62, 0.32, 0.08, x, y0 + 0.06, z).rotate(0, (i * 37) % 20 - 10, 0).move(0, 0, 0), lathe([[0, 0], [0.07, 0], [0.04, 0.08], [0, 0.1]], x, y0 + 0.68, z, 6));
  }
  for (let i = 0; i < 9; i++) b.add("briquette", box(0.16, 0.05, 0.06, -0.6 + (i * 0.37) % 1.2, y0 + 0.06, 1.1 + ((i * 0.23) % 0.15)).rotate(0, i * 23, 0));
  // the decimal scale hung on the tailboard, its weights on a hook
  b.add("iron", box(0.5, 0.04, 0.4, 0, 0.6, -1.75), rod([-0.2, 0.62, -1.6], [-0.2, 1.4, -1.6], 0.012), rod([0.2, 0.62, -1.6], [0.2, 1.4, -1.6], 0.012), box(0.5, 0.06, 0.06, 0, 1.4, -1.6));
  seatBox(b, id, 1.7, 1.15, 1.2, "wood-grey");
  shafts(b, id, 1.35, 3.95, 0.95, 1.12, 0.4, "wood-grey", parked);
  return b.parts();
}

// ── the milk cart, the flat dray, the post van ─────────────────────────────────────────────────────────────────────────
/** A 20 l milk churn standing on y: a straight body, a shoulder, a neck and a lid, two handles; zinc-plated iron. */
function churn(b: Build, x: number, y: number, z: number) {
  b.add("zinc", lathe([[0, 0], [0.15, 0], [0.155, 0.02], [0.15, 0.42], [0.09, 0.5], [0.075, 0.56], [0.085, 0.58], [0, 0.6]], x, y, z, 14));
  for (const s of [-1, 1]) b.add("iron", rod([x + s * 0.13, y + 0.44, z], [x + s * 0.17, y + 0.4, z], 0.008));
}
function milkCart(id: string, parked: boolean): Part[] {
  const b = new Build(), T = 1.32;
  axle(b, id, 0.38, 0.75, T, 0.06, 12, "wheel-red");
  axle(b, id, 0.46, -0.75, T, 0.06, 12, "wheel-red");
  const y0 = 0.9, L = 2.3, W = 1.25;
  b.add("paint-brown", box(W, 0.05, L, 0, y0, -0.05));
  for (const s of [-1, 1]) b.add("paint-brown", box(0.04, 0.32, L, s * (W / 2 - 0.02), y0 + 0.05, -0.05), box(W, 0.32, 0.04, 0, y0 + 0.05, -0.05 + s * (L / 2 - 0.02)));
  // the side boards' lettering, both sides
  for (const s of [-1, 1]) b.add("sign-white", sign("MILCH", 0.16, 0.003).rotate(0, s * 90, 0).move(s * (W / 2 + 0.001), y0 + 0.21, -0.25));
  // the rack: two rails across holding eight churns in two rows
  for (let i = 0; i < 8; i++) churn(b, -0.45 + (i % 4) * 0.3, y0 + 0.05, -0.75 + Math.floor(i / 4) * 0.42);
  for (const z of [-0.95, -0.55, -0.12]) b.add("iron", rod([-W / 2 + 0.03, y0 + 0.42, z], [W / 2 - 0.03, y0 + 0.42, z], 0.012));
  // the measuring cans on hooks along the tailboard: a litre, a half and a quarter, each with a long handle
  b.add("iron", rod([-0.5, y0 + 0.36, -1.24], [0.5, y0 + 0.36, -1.24], 0.01));
  for (const [x, r, h] of [[-0.3, 0.06, 0.16], [0, 0.05, 0.12], [0.28, 0.04, 0.09]] as [number, number, number][]) {
    b.add("zinc", lathe([[0, 0], [r, 0], [r, h], [r - 0.004, h], [r - 0.004, 0.004], [0, 0.004]], x, y0 + 0.36 - 0.3 - h, -1.29, 12));
    b.add("zinc", rod([x, y0 + 0.36 - 0.3, -1.29 + r], [x, y0 + 0.36, -1.25], 0.006));
  }
  seatBox(b, id, 1.65, 0.95, 1.15, "paint-brown");
  // the bell on a curved iron by the seat's right hand
  b.add("iron", rod([0.6, 1.62, 0.95], [0.72, 1.95, 1.0], 0.01), lathe([[0, 0], [0.05, 0], [0.045, 0.03], [0.035, 0.08], [0.012, 0.1], [0, 0.1]], 0.72, 1.87, 1.0, 12));
  shafts(b, id, 1.15, 3.7, 0.9, 1.1, 0.4, "paint-brown", parked);
  return b.parts();
}
/** A packing crate w x h x d of boards with two battens round it, at (x, y, z) turned a degrees. */
function crate(w: number, h: number, d: number, x: number, y: number, z: number, a: number): Solid[] {
  const s = [box(w, h, d)];
  for (const f of [0.15, 0.85]) s.push(box(w + 0.012, 0.05, d + 0.012, 0, h * f - 0.025, 0));
  return [union(...s).rotate(0, a, 0).move(x, y, z)];
}
function flatDray(id: string, parked: boolean): Part[] {
  const b = new Build(), T = 1.55;
  axle(b, id, 0.42, 1.55, T, 0.08, 12, "wood-grey", { felloe: 0.07 });
  axle(b, id, 0.52, -1.5, T, 0.08, 14, "wood-grey", { felloe: 0.07 });
  const y0 = 0.98, L = 4.4, W = 2.0;
  // the deck on two long bearers, stake pockets along both edges, a stake in each
  for (const s of [-1, 1]) b.add("wood-grey", box(0.12, 0.14, L, s * 0.55, y0 - 0.14, 0));
  b.add("wood-grey", box(W, 0.06, L, 0, y0, 0));
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) {
    const z = -L / 2 + 0.3 + i * ((L - 0.6) / 4);
    b.add("iron", box(0.05, 0.12, 0.08, s * (W / 2 + 0.02), y0 - 0.06, z));
    b.add("wood-grey", box(0.05, 0.5, 0.05, s * (W / 2 + 0.02), y0 - 0.02, z));
  }
  // the load: crates two high and bales, the tarpaulin over the front half roped down
  const wood: Solid[] = [], jute: Solid[] = [];
  for (const [w, h, d, x, z, a, tier] of [[0.8, 0.55, 0.6, -0.45, -1.6, 3, 0], [0.8, 0.55, 0.6, 0.45, -1.55, -4, 0], [0.7, 0.45, 0.5, -0.4, -1.58, 8, 1], [0.9, 0.6, 0.7, 0.4, -0.85, 0, 0], [0.6, 0.4, 0.5, -0.5, -0.9, 12, 0]] as number[][])
    wood.push(...crate(w, h, d, x, y0 + 0.06 + tier * 0.55, z, a));
  for (const [x, z] of [[-0.5, -0.15], [0.45, -0.1], [0, 0.55]]) jute.push(rbox(0.85, 0.6, 0.6, 0.12, x, y0 + 0.06, z));
  b.add("wood-raw", ...wood);
  b.add("jute", ...jute);
  // the tarpaulin over the bales: its top on an arch, the sides and both ends hanging to the deck
  const TZ = 0.3, TL = 1.6, TH = 0.62;
  b.add("canvas", archRoof(W / 2 - 0.05, y0 + TH + 0.04, 0.25, 0.02, TL).move(0, 0, TZ), ...[-1, 1].map((s) => box(0.02, TH, TL, s * (W / 2 - 0.06), y0 + 0.06, TZ)));
  for (const s of [-1, 1]) b.add("canvas", box(W - 0.1, TH, 0.02, 0, y0 + 0.06, TZ + s * TL / 2), archRoof(W / 2 - 0.05, y0 + TH + 0.04, 0.25, 0.02, 0.02).move(0, 0, TZ + s * TL / 2));
  for (const z of [-0.2, 0.3, 0.8]) b.add("jute", rod([-W / 2, y0 + 0.05, z], [-W / 2 + 0.02, y0 + 0.9, z], 0.012), rod([W / 2, y0 + 0.05, z], [W / 2 - 0.02, y0 + 0.9, z], 0.012));
  b.add("wood-grey", box(1.3, 1.9 - 0.32 - y0 - 0.06, 0.5, 0, y0 + 0.06, 2.05)); // the box the seat stands on
  seatBox(b, id, 1.9, 2.05, 1.3, "wood-grey");
  pole(b, id, 2.2, 0.75, 3.4, "wood-grey", parked);
  return b.parts();
}
function postWagon(id: string, parked: boolean): Part[] {
  const b = new Build(), T = 1.4;
  axle(b, id, 0.42, 0.95, T, 0.06, 12, "wheel-red");
  axle(b, id, 0.52, -0.95, T, 0.06, 14, "wheel-red");
  const y0 = 0.95, L = 2.7, W = 1.55, H = 1.6, Z = -0.15;
  b.add("iron", ...[-1, 1].flatMap((s) => [0.95, -0.95].map((z) => box(0.06, 0.12, 0.9, s * 0.45, y0 - 0.16, z)))); // the springs' irons
  // the box: panelled sides with mouldings, the curved roof, the rail round it
  b.add("post-blue", box(W, H, L, 0, y0, Z), archRoof(W / 2 + 0.04, y0 + H, 0.12, 0.03, L + 0.1).move(0, 0, Z));
  for (const s of [-1, 1]) {
    for (const [z0, z1] of [[-1.35, -0.15], [-0.05, 1.05]]) {
      const zm = Z + (z0 + z1) / 2, wz = z1 - z0;
      b.add("lacquer-black", box(0.012, 0.03, wz, s * (W / 2 + 0.006), y0 + 0.15, zm), box(0.012, 0.03, wz, s * (W / 2 + 0.006), y0 + H - 0.2, zm), box(0.012, H - 0.32, 0.03, s * (W / 2 + 0.006), y0 + 0.15, Z + z0), box(0.012, H - 0.32, 0.03, s * (W / 2 + 0.006), y0 + 0.15, Z + z1));
    }
    b.add("enamel-yellow", sign("REICHSPOST", 0.13, 0.003, 700).rotate(0, s * 90, 0).move(s * (W / 2 + 0.003), y0 + H - 0.45, Z + 0.45));
  }
  for (const s of [-1, 1]) for (const z of [-L / 2 + 0.05, L / 2 - 0.05]) b.add("iron", post(0.012, 0.18, s * (W / 2 - 0.05), y0 + H + 0.08, Z + z));
  for (const s of [-1, 1]) b.add("iron", rod([s * (W / 2 - 0.05), y0 + H + 0.26, Z - L / 2 + 0.05], [s * (W / 2 - 0.05), y0 + H + 0.26, Z + L / 2 - 0.05], 0.012));
  // the doors at the back: two leaves, their hinges and the bar and padlock
  const ZB = Z - L / 2 - 0.006;
  b.add("lacquer-black", box(0.02, H - 0.1, 0.012, 0, y0 + 0.05, ZB), box(0.08, 0.04, 0.02, 0.0, y0 + 0.8, ZB - 0.01));
  for (const s of [-1, 1]) for (const y of [0.3, 1.25]) b.add("iron", box(0.25, 0.03, 0.01, s * (W / 2 - 0.15), y0 + y, ZB - 0.002));
  b.add("iron", box(0.06, 0.08, 0.03, 0, y0 + 0.72, ZB - 0.03));
  b.add("iron", box(0.5, 0.04, 0.25, 0, y0 - 0.35, ZB - 0.1)); // the step
  // the driver's seat on the front under the roof's overhang, a lamp each side
  seatBox(b, id, y0 + 0.75, Z + L / 2 + 0.25, 1.2, "post-blue");
  for (const s of [-1, 1]) coachLamp(b, s * (W / 2 + 0.08), y0 + 0.9, Z + L / 2 - 0.05);
  shafts(b, id, 1.1, 3.8, 0.95, 1.1, 0.4, "post-blue", parked);
  return b.parts();
}

// ── the omnibus and the hearse ───────────────────────────────────────────────────────────────────────────────────
function horseBus(id: string, parked: boolean): Part[] {
  const b = new Build(), RED: MatId = "paint-red";
  axle(b, id, 0.42, 1.05, 1.5, 0.07, 12, "wheel-yellow");
  axle(b, id, 0.62, -1.05, 2.0, 0.08, 14, "wheel-yellow");
  const FL = 0.95, CANT = 2.6, ROOF = 2.78, W = 1.75, Z0 = -2.0, Z1 = 1.62, L = Z1 - Z0, ZM = (Z0 + Z1) / 2, P = 0.05;
  // the underframe: two bearers on the springs, the front's turntable
  for (const s of [-1, 1]) b.add("iron", box(0.08, 0.12, L - 0.2, s * 0.6, FL - 0.14, ZM), box(0.06, 0.08, 0.9, s * 0.75, 0.62 + 0.1, -1.05));
  b.add("iron", lathe([[0, 0], [0.45, 0], [0.45, 0.03], [0, 0.03]], 0, 0.82, 1.05, 16));
  // the body: floor, the lower panels, the window band (five lights a side), the letter board, the roof
  b.add("wood-grey", box(W, 0.05, L, 0, FL, ZM));
  const WIN = 5, wl = (L - 0.2) / WIN, glass: Solid[] = [];
  for (const s of [-1, 1]) {
    const x = s * (W / 2 - P / 2);
    b.add(RED, box(P, 0.78, L, x, FL, ZM), box(P, CANT - FL - 0.78 - 0.02, 0.1, x, FL + 0.78, Z0 + 0.05), box(P, CANT - FL - 0.78 - 0.02, 0.1, x, FL + 0.78, Z1 - 0.05));
    for (let i = 1; i < WIN; i++) b.add(RED, box(P, CANT - FL - 0.78, 0.07, x, FL + 0.78, Z0 + 0.1 + i * wl));
    glass.push(box(0.008, CANT - FL - 0.8, L - 0.2, x, FL + 0.79, ZM));
    b.add("sign-white", box(P + 0.01, ROOF - CANT, L, x, CANT, ZM)); // the letter board under the eaves
    b.add("lacquer-black", box(0.012, 0.025, L, x + s * 0.03, FL + 0.76, ZM), box(0.012, 0.025, L, x + s * 0.03, FL + 0.08, ZM)); // the mouldings
  }
  b.add("glass-plate", ...glass);
  // the front wall with two small lights; the back wall with its doorway onto the platform
  const DOOR = 0.62;
  b.add(RED, box(W, CANT - FL, P, 0, FL, Z1 - P / 2).minus(box(0.5, 0.45, 0.2, -0.35, FL + 0.95, Z1)).minus(box(0.5, 0.45, 0.2, 0.35, FL + 0.95, Z1)));
  b.add("glass-plate", box(0.5, 0.45, 0.008, -0.35, FL + 0.95, Z1 - 0.02), box(0.5, 0.45, 0.008, 0.35, FL + 0.95, Z1 - 0.02));
  b.add(RED, box((W - DOOR) / 2, ROOF - FL, P, -(W + DOOR) / 4, FL, Z0 + P / 2), box((W - DOOR) / 2, ROOF - FL, P, (W + DOOR) / 4, FL, Z0 + P / 2), box(DOOR, ROOF - FL - 1.7, P, 0, FL + 1.7, Z0 + P / 2));
  b.add("sign-white", box(W + 0.01, ROOF - CANT, P + 0.01, 0, CANT, Z1 - P / 2));
  // inside: the two long benches facing each other, their cushions, the straps' rail
  for (const s of [-1, 1]) {
    b.add("wood-varnish", box(0.42, 0.42, 3.43, s * (W / 2 - 0.26), FL, ZM));
    b.add("cloth-navy", rbox(0.4, 0.07, 3.4, 0.02, s * (W / 2 - 0.26), FL + 0.42, ZM), rbox(0.05, 0.45, 3.4, 0.02, s * (W / 2 - 0.08), FL + 0.55, ZM));
    b.add("iron", rod([s * 0.3, CANT - 0.15, Z0 + 0.1], [s * 0.3, CANT - 0.15, Z1 - 0.1], 0.01));
  }
  // the roof: boards on a low arch, the footboards along its edges, the knifeboard bench down the middle (2.70 m,
  // seats both sides, passengers facing out), the railing round it hung with the route boards
  b.add("tram-roof", archRoof(W / 2 + 0.06, ROOF, 0.06, 0.04, L + 0.1).move(0, 0, ZM));
  const RT = ROOF + 0.05, BZ = ZM + 0.1;
  b.add("wood-varnish", box(0.1, 0.8, 2.7, 0, RT, BZ)); // the bench's back, its top 0.38 over the seats
  for (const s of [-1, 1]) {
    b.add("wood-varnish", box(0.42, 0.04, 2.7, s * 0.27, RT + 0.42, BZ), box(0.04, 0.42, 2.7, s * 0.46, RT, BZ));
    b.add("wood-grey", box(0.3, 0.03, L - 0.2, s * (W / 2 - 0.12), RT - 0.02, ZM)); // the footboard
    for (let i = 0; i <= 6; i++) b.add("iron", post(0.012, 0.75, s * (W / 2 + 0.03), RT, Z0 + 0.1 + i * ((L - 0.2) / 6)));
    b.add("iron", rod([s * (W / 2 + 0.03), RT + 0.75, Z0 + 0.1], [s * (W / 2 + 0.03), RT + 0.75, Z1 - 0.1], 0.014));
    // the route board on the railing, both faces lettered
    b.add("sign-white", box(0.025, 0.3, L - 0.5, s * (W / 2 + 0.05), RT + 0.38, ZM));
    b.add("enamel-black", sign("Potsdamer Platz – Alexanderplatz", 0.13, 0.002, 700).rotate(0, s * 90, 0).move(s * (W / 2 + 0.064), RT + 0.53, ZM));
  }
  for (const z of [Z1 - 0.1]) b.add("iron", rod([-(W / 2 + 0.03), RT + 0.75, z], [W / 2 + 0.03, RT + 0.75, z], 0.014));
  // the line's number in a white disc over the driver's head (ASSUMED)
  b.add("sign-white", lathe([[0, 0], [0.22, 0], [0.22, 0.02], [0, 0.02]], 0, 0, 0, 20).rotate(90, 0, 0).move(0, RT + 1.05, Z1 - 0.05), post(0.015, 0.25, 0, RT + 0.6, Z1 - 0.07));
  b.add("enamel-black", sign("4", 0.28, 0.003, 800).move(0, RT + 1.05, Z1 - 0.03));
  // the platform behind: a step, its floor, the railing (open at the right rear corner, toward the kerb), the stair
  // winding up round a post to the roof
  const PY = FL - 0.3, PZ0 = Z0 - 0.72;
  b.add("wood-grey", box(W, 0.05, 0.72, 0, PY, (Z0 + PZ0) / 2), box(0.6, 0.04, 0.25, -0.45, PY - 0.32, PZ0 + 0.2));
  b.add("iron", rod([-0.35, PY + 0.02, PZ0 + 0.2], [-0.35, PY - 0.3, PZ0 + 0.2], 0.012), rod([-0.65, PY + 0.02, PZ0 + 0.2], [-0.65, PY - 0.3, PZ0 + 0.2], 0.012));
  const rail: Solid[] = [];
  for (const [a, c] of [[[W / 2, Z0], [W / 2, PZ0]], [[W / 2, PZ0], [-0.1, PZ0]]] as [[number, number], [number, number]][]) {
    rail.push(rod([a[0], PY + 1.0, a[1]], [c[0], PY + 1.0, c[1]], 0.015), rod([a[0], PY + 0.5, a[1]], [c[0], PY + 0.5, c[1]], 0.01));
    const n = Math.max(2, Math.round(Math.hypot(c[0] - a[0], c[1] - a[1]) / 0.12));
    for (let i = 0; i <= n; i++) rail.push(post(0.008, 1.0, a[0] + ((c[0] - a[0]) * i) / n, PY, a[1] + ((c[1] - a[1]) * i) / n));
  }
  b.add("iron", ...rail, post(0.03, RT + 0.75 - PY, 0.55, PY, PZ0 + 0.3));
  for (let i = 0; i < 11; i++) {
    const t = i / 10, a = (-160 + t * 250) * (Math.PI / 180), y = PY + 0.25 + t * (RT - PY - 0.25);
    b.add("wood-grey", box(0.42, 0.03, 0.18, 0, 0, 0).rotate(0, (-a * 180) / Math.PI, 0).move(0.55 + Math.cos(a) * 0.22, y, PZ0 + 0.3 + Math.sin(a) * 0.22));
  }
  b.add("iron", ...Array.from({ length: 10 }, (_, i) => {
    const f = (k: number): V3 => { const t = k / 10, a = (-160 + t * 250) * (Math.PI / 180); return [0.55 + Math.cos(a) * 0.45, PY + 0.25 + 0.85 * (1 - t) + t * (RT - PY - 0.25) + 0.05 * t, PZ0 + 0.3 + Math.sin(a) * 0.45]; };
    return rod(f(i), f(i + 1), 0.012);
  }));
  // the driver's box floating before the body on irons, his lamps at the front corners, the pole for a pair
  seatBox(b, id, 2.35, Z1 + 0.42, 0.95, RED);
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.42, 2.0, Z1 + 0.25], [s * 0.6, 1.5, Z1], 0.02), rod([s * 0.42, 2.0, Z1 + 0.6], [s * 0.6, 1.1, Z1], 0.02));
  for (const s of [-1, 1]) coachLamp(b, s * (W / 2 + 0.06), 1.9, Z1 - 0.05);
  pole(b, id, 1.45, 0.62, 3.0, "wood-grey", parked);
  return b.parts();
}
function hearse(id: string, parked: boolean): Part[] {
  const b = new Build(), K: MatId = "lacquer-black";
  axle(b, id, 0.45, 0.95, 1.4, 0.06, 12, K);
  axle(b, id, 0.6, -0.95, 1.4, 0.06, 14, K);
  const FL = 0.95, TOP = 2.35, W = 1.2, Z0 = -1.6, Z1 = 1.0, L = Z1 - Z0, ZM = (Z0 + Z1) / 2;
  for (const s of [-1, 1]) b.add("iron", box(0.06, 0.1, L, s * 0.45, FL - 0.12, ZM));
  b.add(K, box(W, 0.25, L, 0, FL, ZM)); // the plinth the glass stands on
  // the glazed case: four corner posts carved as columns, plate glass between them, the cornice above
  for (const sx of [-1, 1]) for (const z of [Z0 + 0.05, Z1 - 0.05]) b.add(K, lathe([[0, 0], [0.05, 0], [0.04, 0.1], [0.035, 1.0], [0.05, 1.08], [0, 1.15]], sx * (W / 2 - 0.05), FL + 0.25, z, 10));
  b.add("glass-plate", box(0.008, 1.1, L - 0.1, -(W / 2 - 0.05), FL + 0.25, ZM), box(0.008, 1.1, L - 0.1, W / 2 - 0.05, FL + 0.25, ZM), box(W - 0.1, 1.1, 0.008, 0, FL + 0.25, Z0 + 0.05));
  b.add(K, box(W + 0.16, 0.12, L + 0.16, 0, FL + 1.38, ZM), box(W + 0.24, 0.06, L + 0.24, 0, FL + 1.44, ZM), box(W - 0.1, 0.12, L - 0.1, 0, FL + 1.5, ZM));
  // the drapes inside the glass, gathered and tied back at each post, a fringe along the top
  for (const sx of [-1, 1]) for (const z of [Z0 + 0.25, Z1 - 0.25]) b.add("cloth-black", lathe([[0, 0], [0.09, 0], [0.05, 0.5], [0.12, 1.05], [0, 1.1]], sx * (W / 2 - 0.12), FL + 0.25, z, 10));
  b.add("cloth-black", ...[-1, 1].map((sx) => box(0.03, 0.12, L - 0.1, sx * (W / 2 - 0.1), FL + 1.23, ZM)));
  // the coffin's deck with its rollers, the black pall on it
  b.add("wood-varnish", box(W - 0.3, 0.06, L - 0.2, 0, FL + 0.25, ZM));
  b.add("cloth-black", rbox(0.62, 0.5, 2.0, 0.08, 0, FL + 0.31, ZM - 0.05));
  // the plumes: an urn finial at each corner of the cornice with a tuft of black feathers
  for (const sx of [-1, 1]) for (const z of [Z0 + 0.02, Z1 - 0.02]) {
    b.add(K, lathe([[0, 0], [0.05, 0], [0.07, 0.08], [0.03, 0.14], [0, 0.15]], sx * (W / 2 + 0.06), TOP - 0.36, z, 10));
    b.add("cloth-black", lathe([[0, 0], [0.04, 0], [0.12, 0.2], [0.1, 0.45], [0.03, 0.55], [0, 0.56]], sx * (W / 2 + 0.06), TOP - 0.22, z, 10));
  }
  seatBox(b, id, 2.05, Z1 + 0.35, 0.95, K);
  for (const s of [-1, 1]) coachLamp(b, s * (W / 2 + 0.08), 1.75, Z1 + 0.05);
  pole(b, id, 1.35, 0.62, 3.0, "wood-grey", parked);
  return b.parts();
}

// ── hand carts and the pram ──────────────────────────────────────────────────────────────────────────────────────
function ladderCart(id: string): Part[] {
  const b = new Build(), T = 0.62;
  axle(b, id, 0.2, 0.42, T, 0.035, 10, "wood-raw", { felloe: 0.03, hub: 0.045, spoke: 0.009 });
  axle(b, id, 0.24, -0.42, T, 0.035, 10, "wood-raw", { felloe: 0.03, hub: 0.045, spoke: 0.009 });
  const y0 = 0.42, L = 1.35;
  b.add("wood-raw", box(0.55, 0.03, L, 0, y0, 0));
  for (const s of [-1, 1]) {
    // a ladder side, leaning out: two rails and rungs
    const lean = 12 * s, side: Solid[] = [box(0.03, 0.03, L + 0.2, 0, 0.08, 0), box(0.03, 0.03, L + 0.2, 0, 0.42, 0)];
    for (let i = 0; i < 9; i++) side.push(post(0.011, 0.36, 0, 0.08, -L / 2 + i * (L / 8)));
    b.add("wood-raw", union(...side).rotate(0, 0, -lean).move(s * 0.29, y0, 0));
  }
  // the drawbar on the front axle's turntable, its T handle on the ground ahead
  b.add("wood-raw", rod([0, 0.22, 0.5], [0, 0.05, 1.45], 0.018), rod([-0.17, 0.05, 1.45], [0.17, 0.05, 1.45], 0.016));
  b.add("iron", lathe([[0, 0], [0.16, 0], [0.16, 0.02], [0, 0.02]], 0, 0.36, 0.42, 10));
  return b.parts();
}
function handCart(id: string): Part[] {
  const b = new Build();
  axle(b, id, 0.45, 0, 1.0, 0.05, 10, "wood-grey");
  b.add("wood-grey", box(0.9, 0.04, 1.4, 0, 0.62, -0.05), box(0.9, 0.3, 0.03, 0, 0.66, 0.65), box(0.9, 0.3, 0.03, 0, 0.66, -0.75));
  for (const s of [-1, 1]) b.add("wood-grey", box(0.03, 0.3, 1.4, s * 0.45, 0.66, -0.05), rod([s * 0.4, 0.6, -0.75], [s * 0.36, 0.78, -1.9], 0.025), rod([s * 0.4, 0.6, 0.65], [s * 0.42, 0.0, 0.7], 0.022));
  b.add("wood-grey", rod([-0.36, 0.78, -1.85], [0.36, 0.78, -1.85], 0.02));
  return b.parts();
}
function pram(id: string): Part[] {
  const b = new Build();
  const ws = (R: number) => spoked(R, 0.022, 16, { tyre: 0.012, felloe: 0.012, hub: 0.025, spoke: 0.0035 });
  for (const [z, R] of [[0.3, 0.2], [-0.3, 0.24]] as const) { const w = ws(R); for (const s of [-1, 1]) { b.add("rubber", w.iron.move(s * 0.27, R, z)); b.add("steel-bright", w.wood.move(s * 0.27, R, z)); (WHEELS[id] ??= []).push({ at: [s * 0.27, R, z], r: R }); } }
  // the body: a tub, deeper at the head end, on two C-springs
  b.add("lacquer-black", rbox(0.42, 0.3, 0.82, 0.08, 0, 0.56, 0));
  b.add("cloth-navy", box(0.38, 0.02, 0.5, 0, 0.84, 0.13)); // the apron
  b.add("lacquer-black", union(...[0, 1, 2, 3, 4, 5].map((i) => box(0.44, 0.02, 0.05, 0, 0, 0).rotate(-(i * 18), 0, 0).move(0, 0.86 + 0.2 * Math.sin((i * 18 * Math.PI) / 180), -0.2 - 0.2 * Math.cos((i * 18 * Math.PI) / 180) + 0.2))));
  b.add("leather", archRoof(0.22, 0.86, 0.32, 0.015, 0.4).rotate(0, 0, 0).move(0, 0, -0.2));
  for (const s of [-1, 1]) for (const z of [0.3, -0.3]) b.add("steel-bright", lathe([[0.1, -0.008], [0.11, -0.008], [0.11, 0.008], [0.1, 0.008]], 0, 0, 0, 10).rotate(0, 0, 90).scale(1, 1.4, 1).move(s * 0.21, 0.45, z));
  b.add("steel-bright", rod([-0.2, 0.62, -0.4], [-0.22, 1.05, -0.75], 0.01), rod([0.2, 0.62, -0.4], [0.22, 1.05, -0.75], 0.01));
  b.add("wood-dark", rod([-0.24, 1.05, -0.75], [0.24, 1.05, -0.75], 0.016));
  return b.parts();
}

// ── the furniture van ────────────────────────────────────────────────────────────────────────────────────────────
function furnitureVan(id: string, parked: boolean, open = false): Part[] {
  const b = new Build(), T = 1.75;
  axle(b, id, 0.48, 2.1, T, 0.09, 12, "wheel-red", { felloe: 0.07 });
  axle(b, id, 0.62, -2.1, T, 0.09, 14, "wheel-red", { felloe: 0.07 });
  // the box hangs low between the axles on cranked irons: its floor at 0.45 m, 2.0 wide, 5.6 long, 3.0 high
  const y0 = 0.45, L = 5.6, W = 2.0, H = 2.95, z = -0.2;
  const zB = z - L / 2, DW = (W - 0.16) / 2, DH = H - 0.2;
  // the wheels stand inside the box's width, so each has an arch through the side and a boxed housing inside
  const arch: Solid[] = [], housing: Solid[] = [];
  for (const [R, zw] of [[0.48, 2.1], [0.62, -2.1]] as const) for (const s of [-1, 1]) {
    const top = 2 * R + 0.06;
    arch.push(box(0.3, top + 0.07, 2 * R + 0.16, s * (T / 2 + 0.075 + 0.15), -0.1, zw));
    housing.push(box(W / 2 - T / 2 + 0.1, top - y0, 2 * R + 0.2, s * (T / 2 - 0.1 + (W / 2 - T / 2 + 0.1) / 2), y0, zw));
  }
  b.add("paint-brown", box(W, H, L, 0, y0, z).minus(box(W - 0.08, H - 0.08, L - 0.08, 0, y0 + 0.04, z), box(W - 0.16, DH, 0.2, 0, y0 + 0.06, zB), ...arch));
  // inside: raw boards on the walls and floor, battens to rope to, a rail of rings, the wheel housings
  b.add("wood-raw", box(W - 0.08, H - 0.08, L - 0.08, 0, y0 + 0.04, z).minus(box(W - 0.1, H, L - 0.1, 0, y0 + 0.05, z), box(W - 0.16, DH, 0.3, 0, y0 + 0.06, zB), ...arch), box(W - 0.1, 0.02, L - 0.1, 0, y0 + 0.04, z).minus(...housing));
  b.add("wood-raw", union(...housing).minus(...arch));
  const battens: Solid[] = [];
  for (const s of [-1, 1]) for (let i = 0; i < 7; i++) battens.push(box(0.03, H - 0.12, 0.08, s * (W / 2 - 0.055), y0 + 0.06, zB + 0.4 + i * ((L - 0.8) / 6)));
  b.add("wood-raw", union(...battens).minus(...arch));
  for (const s of [-1, 1]) { b.add("iron", rod([s * (W / 2 - 0.08), y0 + 1.6, zB + 0.3], [s * (W / 2 - 0.08), y0 + 1.6, zB + L - 0.3], 0.01)); for (let i = 0; i < 6; i++) b.add("iron", rod([s * (W / 2 - 0.08), y0 + 1.6, zB + 0.6 + i * 0.85], [s * (W / 2 - 0.08), y0 + 1.5, zB + 0.6 + i * 0.85], 0.006)); }
  // the load from the front: a wardrobe, a chest of drawers, chairs stacked seat to seat, a rolled carpet, crates,
  // a stack of the firm's quilted blankets and more of them laid over and between it all
  const yF = y0 + 0.06, zF = zB + L - 0.04;
  b.add("wood-dark", box(1.2, 2.1, 0.6, -0.15, yF, zF - 0.3), box(1.26, 0.08, 0.66, -0.15, yF + 2.1, zF - 0.3), box(1.0, 0.85, 0.5, 0.25, yF, zF - 1.0), box(1.04, 0.04, 0.54, 0.25, yF + 0.85, zF - 1.0));
  for (let i = 0; i < 3; i++) b.add("wood-dark", box(0.9, 0.025, 0.02, 0.25, yF + 0.2 + i * 0.25, zF - 1.255));
  for (let k = 0; k < 2; k++) { const y = yF + 0.89, chair: Solid[] = [box(0.42, 0.04, 0.42, 0, 0.42, 0), box(0.42, 0.45, 0.03, 0, 0.46, -0.2)]; for (const [x, zz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) chair.push(box(0.03, 0.42, 0.03, x, 0, zz)); b.add("wood-mid", union(...chair).rotate(k ? 180 : 0, 0, 0).move(0.25, k ? y + 0.88 : y, zF - 1.0)); }
  b.add("cloth-floral", post(0.14, 1.75, 0, 0, 0).rotate(0, 0, 90).move(0.82, yF + 0.14, zF - 1.9));
  for (const [x, zz, h] of [[-0.5, zF - 1.9, 0.5], [-0.45, zF - 2.5, 0.4], [0.3, zF - 2.4, 0.45]] as const) b.add("wood-raw", box(0.55, h, 0.5, x, yF, zz));
  for (let i = 0; i < 6; i++) b.add("cloth-brown", rbox(0.75, 0.06, 0.55, 0.025, -0.45, yF + 0.4 + i * 0.065, zF - 2.5 + (i % 2) * 0.03));
  b.add("cloth-brown", box(0.02, 1.6, 0.66, 0.46, yF + 0.5, zF - 0.3), box(1.3, 0.03, 0.7, -0.15, yF + 2.18, zF - 0.3));
  // the doors: two leaves hinged at the sides, shut (a seam between them, two bars across) or swung back along
  // the sides with the tail ladder down from the floor's edge to the setts as a ramp
  for (const s of [-1, 1]) {
    const leaf = union(box(DW, DH, 0.04, -s * DW / 2, 0, -0.02), box(0.04, DH - 0.2, 0.02, -s * DW / 2, 0.1, -0.05), box(DW - 0.12, 0.04, 0.02, -s * DW / 2, DH / 2, -0.05));
    b.add("paint-brown", (open ? leaf.rotate(0, -s * 100, 0) : leaf).move(s * DW, y0 + 0.06, zB));
  }
  const rails = (a: V3, c: V3) => { for (const x of [-0.35, 0.35]) b.add("wood-raw", rod([x, a[1], a[2]], [x, c[1], c[2]], 0.02)); for (let i = 1; i < 8; i++) { const t = i / 8; b.add("wood-raw", rod([-0.35, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t], [0.35, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t], 0.013)); } };
  if (open) rails([0, y0 + 0.06, zB - 0.02], [0, 0.02, zB - 1.5]);
  b.add("paint-brown", archRoof(W / 2 + 0.04, y0 + H, 0.18, 0.06, L + 0.15).move(0, 0, z));
  for (const s of [-1, 1]) {
    // panel mouldings in two rows, and the firm's board in the upper row (a made-up name: no real firm)
    for (let i = 0; i < 4; i++) b.add("wood-dark", box(0.02, 0.04, L - 0.3, s * (W / 2 + 0.01), y0 + 0.2 + i * 0.85, z));
    b.add("sign-white", box(0.01, 0.42, 3.6, s * (W / 2 + 0.02), y0 + 2.05, z));
    b.add("enamel-black", sign("MÖBELTRANSPORT", 0.2, 0.004).rotate(0, s * 90, 0).move(s * (W / 2 + 0.03), y0 + 2.26, z));
  }
  // the doors at the back with their bars and the tail ladder hung on hooks
  if (!open) {
    b.add("wood-dark", box(0.02, H - 0.2, 0.03, 0, y0 + 0.1, z - L / 2 - 0.045));
    b.add("iron", rod([-0.9, y0 + 1.4, z - L / 2 - 0.06], [0.9, y0 + 1.4, z - L / 2 - 0.06], 0.012), rod([-0.9, y0 + 0.5, z - L / 2 - 0.06], [0.9, y0 + 0.5, z - L / 2 - 0.06], 0.012));
    for (const s of [-1, 1]) b.add("wood-raw", rod([s * 0.35, y0 + 0.3, z - L / 2 - 0.11], [s * 0.35, y0 + 2.4, z - L / 2 - 0.11], 0.02));
    for (let i = 0; i < 7; i++) b.add("wood-raw", rod([-0.35, y0 + 0.4 + i * 0.3, z - L / 2 - 0.11], [0.35, y0 + 0.4 + i * 0.3, z - L / 2 - 0.11], 0.013));
  }
  // the cranked axle irons and the box's front: a high seat over the fore-carriage
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.75, y0, -2.1], [s * 0.75, 0.62, -2.1], 0.03), rod([s * 0.75, y0, 2.1], [s * 0.75, 0.48, 2.1], 0.03));
  b.add("paint-brown", box(1.6, 0.25, 0.6, 0, y0 + H - 0.65, z + L / 2 + 0.3));
  seatBox(b, id, y0 + H - 0.38, z + L / 2 + 0.3, 1.5, "paint-brown");
  for (const s of [-1, 1]) coachLamp(b, s * 0.85, y0 + H - 0.7, z + L / 2 + 0.05);
  pole(b, id, 2.4, 0.85, 3.2, "wheel-red", parked);
  return b.parts();
}

/** What a vehicle's materials become after three war winters without a coach painter: faded, the varnish gone dull,
 *  edges rubbed through, the cloth stained. */
const WORN: Partial<Record<MatId, MatId>> = {
  "lacquer-black": "lacquer-black-worn", "wheel-red": "wheel-red-worn", "wheel-yellow": "wheel-yellow-worn", "paint-brown": "paint-brown-worn",
  leather: "leather-worn", "leather-black": "leather-black-worn", "cloth-navy": "cloth-navy-worn",
};
const wornParts = (parts: Part[]): Part[] => parts.map((p) => ({ ...p, mat: WORN[p.mat] ?? p.mat }));
/** A vehicle and its worn twin, both with road mud thrown up to `mud` metres (wheels, undercarriage, steps), on
 *  the materials in `only` when given (so none gets inside a van or a cab). */
const P = (id: string, items: string[], size: V3, tris: number, mud: number, f: (id: string, worn: boolean) => Part[], only?: MatId[]) => {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 97;
  const on = only && [...only, ...only.map((m) => WORN[m] ?? m)];
  for (const worn of [false, true]) {
    const vid = worn ? `${id}-worn` : id;
    prop({ id: vid, items, size, place: "floor", where: "set", tris, parts: () => muddy(f(vid, worn), splashMask(size[0] + 0.6, 2 * size[2], mud * 0.35, worn ? mud * 1.25 : mud, seed + (worn ? 1 : 0)), "mud-road", on) });
  }
};
const CAB: MatId[] = ["lacquer-black", "wheel-red", "iron"], VAN: MatId[] = ["paint-brown", "wheel-red", "iron"];
P("cab-droschke", ["droschke"], [1.6, 2.5, 5.0], 60000, 0.8, (id, worn) => droschke(id, true, worn), CAB);
P("cab-droschke-hitched", ["droschke"], [1.6, 2.5, 5.0], 60000, 0.8, (id, worn) => droschke(id, false, worn), CAB);
P("dray-beer", ["dray"], [2.2, 2.6, 7.6], 45000, 0.75, (id, worn) => (worn ? wornParts(dray(id, true)) : dray(id, true)));
P("cart-coal", ["coal-cart"], [1.7, 2.0, 5.6], 30000, 0.75, (id, worn) => (worn ? wornParts(coalCart(id, true)) : coalCart(id, true)));
P("cart-ladder", ["handcart"], [0.75, 0.9, 2.1], 9000, 0.28, (id, worn) => (worn ? wornParts(ladderCart(id)) : ladderCart(id)));
P("cart-hand", ["handcart"], [1.1, 1.0, 2.7], 6000, 0.4, (id, worn) => (worn ? wornParts(handCart(id)) : handCart(id)));
P("cart-milk", ["milk-cart"], [1.6, 2.1, 5.2], 30000, 0.7, (id, worn) => (worn ? wornParts(milkCart(id, true)) : milkCart(id, true)));
P("dray-flat", ["flat-dray"], [2.2, 2.5, 9.0], 30000, 0.75, (id, worn) => (worn ? wornParts(flatDray(id, true)) : flatDray(id, true)));
P("post-wagon", ["post-wagon"], [1.8, 2.9, 6.1], 35000, 0.8, (id, worn) => (worn ? wornParts(postWagon(id, true)) : postWagon(id, true)), ["post-blue", "wheel-red", "iron"]);
P("bus-horse", ["horse-bus"], [2.2, 3.9, 7.4], 70000, 0.8, (id, worn) => (worn ? wornParts(horseBus(id, true)) : horseBus(id, true)), ["paint-red", "wheel-yellow", "iron"]);
P("hearse", ["hearse"], [1.6, 2.9, 6.4], 35000, 0.7, (id, worn) => (worn ? wornParts(hearse(id, true)) : hearse(id, true)), CAB);
P("pram", ["pram"], [0.6, 1.15, 1.0], 9000, 0.18, (id, worn) => (worn ? wornParts(pram(id)) : pram(id)));
P("van-furniture", ["furniture-van"], [2.2, 3.7, 9.4], 60000, 0.85, (id, worn) => (worn ? wornParts(furnitureVan(id, true)) : furnitureVan(id, true)), VAN);
P("van-furniture-open", ["furniture-van"], [2.2, 3.7, 10.6], 90000, 0.85, (id, worn) => (worn ? wornParts(furnitureVan(id, true, true)) : furnitureVan(id, true, true)), VAN);

export const KIT_VEHICLES = true;
