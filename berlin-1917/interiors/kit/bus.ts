// The motor bus (catalogue bus-motor): the ABOAG's own "RK-Wagen" (after its director Robert Kaufmann), the deck-seat
// motor omnibus its works built on its own chassis from 1913, a series of ten (BVG type sheet FA Blatt M36, March 1971,
// Sammlung berliner-verkehrsseiten.de: built 1913, petrol, 4 cylinders, 45 PS, 25 km/h; 8000 mm long, 3800 mm high,
// wheelbase 4200 mm, wheels 950 mm, 120 mm wide in front and 160 behind; floor 820 mm above the road, the way in at the
// back 600 mm wide; 16 seats and 6 standing below, 20 seats on the deck, 42 in all; chassis 3250 kg, body 1700 kg).
// The chassis an ash frame armoured with steel plate, the body framed in steam-bent ash (berliner-verkehrsseiten.de,
// ABOAG). Wagen 37 of the series survives in the Deutsches Technikmuseum (museum-digital berlin, object 9074: 8 x 2.2 x
// 3.8 m; its photograph CC0) and is the look here: ivory, four big windows a side with top lights over them, the
// driver out in front behind a square bonnet under the deck run forward over him, the open platform behind with the
// iron spiral stair to the deck (the stair: de.wikipedia, ABOAG, on the deck-seat bus of 1907), the deck screened by
// route boards and advertising boards, garden seats across it. Ivory was Berlin's bus colour from 1910 on (berliner-
// verkehrsseiten.de, Pferdebus-Wagen: the last horse buses "hell lackiert (elfenbeinfarben)", a colour that held for
// almost a hundred years). In the war the army took most of the motor buses; 108 old cars were left, at the end on
// two lines, some converted to coal or gas for want of petrol (de.wikipedia, Busverkehr in Berlin); the RK cars were
// the light ones, about 1000 kg under the makers' (berliner-verkehrsseiten.de, ABOAG). Photographs: the type sheet's
// elevation; Wagen 37 (CC0); a 1915 RK on line 19 (Commons, public domain); Friedrichstrasse in 1911 (Rijksmuseum, CC0).
//   bus-motor       running on line 4 (Hallesches Tor, Friedrichstrasse, Chausseestrasse: the first motor bus line,
//                   1905), its deck boards advertising cocoa and cigarettes
//   bus-motor-worn  three war winters on: paint and varnish faded, the advertising boards pasted over with the war
//                   loan's call
// ASSUMED: line 4 still running in 1917; the track (1.56 m front, 1.62 m rear) and the body's widths (2.0 m, the boards
// 2.2 m); the window and panel heights read off the type sheet's drawing; the stair's turn and where it lands; the
// saloon's long benches; the lamps' places; the boards' words (generic, no firm's name) and the war-loan boards; the
// firm's name left off the waist panel, which keeps only its lining.
// Frame: on the ground under the middle between the axles, +z forward, the driver's right (the steering side) -x.
import { manifold, type Solid } from "raea/3d";
import { box, rbox, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { along, leafSpring, type P2, side, slat, smooth, sweepSheet, turn, turnX } from "./forms";
import { crown, hullAlong, wingLine } from "./carparts";
import { muddy, rod, sign, splashMask, spoked } from "./outgeo";
import { prop } from "./prop";
import { Build, WHEELS } from "./vehicles";

const R = 0.475, ZF = 2.1, ZR = -2.1, XF = 0.78, XR = 0.81;
/** The saloon from the driver's back (z 0) to its rear wall; the platform's end; the deck from over the driver to over
 *  the platform; the body's half width and the boards'; floor, waist, the windows' sill, transom and head, the deck. */
const SZ1 = -3.72, PZ = -5.08, DZ0 = 1.28, DZ1 = -5.17, HW = 1.0, BX = 1.1;
const FLOOR = 0.82, WAIST = 1.9, SILL = 1.96, TRANS = 2.6, HEAD = 2.88, DECK = 2.97;
const STAIR: V3 = [0.5, 0, -4.55], SR = 0.48;
const GLASS: MatId = "glass-plate", BLACK: MatId = "lacquer-black", DARK: MatId = "enamel-black";
/** The windows down each side: [front z, back z]. */
const BAYS: [number, number][] = [[-0.2, -1.0], [-1.07, -1.87], [-1.94, -2.74], [-2.81, -3.61]];

/** A wheel at `at`: ten wooden spokes painted with the body, a solid rubber tyre w wide, the hub cap outboard. */
function wheel(b: Build, id: string, at: V3, w: number, paint: MatId) {
  const sp = spoked(R - 0.05, w * 0.8, 10, { tyre: 0.012, felloe: 0.07, hub: 0.1, spoke: 0.022 });
  const rub = turnX([[R - 0.055, -w / 2], [R - 0.008, -w / 2], [R, -w / 2 + 0.012], [R, w / 2 - 0.012], [R - 0.008, w / 2], [R - 0.055, w / 2]], 40);
  const cap = turnX([[0, 0], [0.075, 0], [0.075, 0.04], [0.055, 0.08], [0, 0.09]], 16).move(w * 0.5, 0, 0);
  const m = (s: Solid) => (at[0] < 0 ? s.rotate(0, 180, 0) : s).move(...at);
  b.add("rubber", m(rub)); b.add("iron", m(sp.iron), m(cap)); b.add(paint, m(sp.wood));
  (WHEELS[id] ??= []).push({ at, r: R });
}

/** The frame on its springs, the axles, the sump and gearbox, the shaft to the back axle, the lifeguard slats between
 *  the wheels, the driver's steps. */
function chassis(b: Build, id: string, paint: MatId) {
  for (const s of [-1, 1]) {
    b.add(BLACK, box(0.07, 0.14, 7.3, s * 0.5, 0.66, -1.35));
    wheel(b, id, [s * XF, R, ZF], 0.12, paint); wheel(b, id, [s * XR, R, ZR], 0.16, paint);
    b.add(BLACK, leafSpring(1.1, 7, 0.07, 0.065, 0.011).move(s * 0.5, 0.56, ZF), leafSpring(1.4, 9, 0.08, 0.075, 0.012).move(s * 0.5, 0.56, ZR));
    b.add(BLACK, rod([s * 0.5, 0.58, ZF + 0.55], [s * 0.5, 0.7, ZF + 0.6], 0.02), rod([s * 0.5, 0.58, ZR - 0.7], [s * 0.5, 0.7, ZR - 0.75], 0.02));
    // the lifeguard: five slats on brackets, flush with the body, from the driver's step to the back wheel
    for (let k = 0; k < 5; k++) b.add(BLACK, box(0.03, 0.06, 1.85, s * (HW - 0.02), 0.32 + k * 0.11, -0.47));
    for (const z of [0.35, -0.5, -1.3]) b.add(BLACK, box(0.04, 0.5, 0.04, s * (HW - 0.05), 0.31, z), rod([s * (HW - 0.05), 0.72, z], [s * 0.5, 0.72, z], 0.015));
    b.add(BLACK, box(0.26, 0.025, 0.2, s * (HW - 0.08), 0.52, 0.8), rod([s * (HW - 0.08), 0.53, 0.8], [s * 0.5, 0.7, 0.8], 0.015));
    b.add("tread-worn", box(0.24, 0.006, 0.18, s * (HW - 0.08), 0.545, 0.8));
  }
  for (const z of [2.25, 1.0, -0.6, -2.6, -4.0, -4.95]) b.add(BLACK, box(1.0, 0.1, 0.06, 0, 0.68, z));
  b.add(BLACK, rod([-0.72, R - 0.03, ZF], [0.72, R - 0.03, ZF], 0.035), rod([-(XR - 0.1), R, ZR], [XR - 0.1, R, ZR], 0.045));
  for (const s of [-1, 1]) b.add(BLACK, rod([s * 0.72, R - 0.1, ZF], [s * 0.72, R + 0.08, ZF], 0.028));
  b.add(BLACK, turn([[0, -0.17], [0.17, -0.12], [0.19, 0], [0.17, 0.12], [0, 0.17]], 18).rotate(90, 0, 0).move(0, R, ZR));
  b.add(BLACK, rod([0, R + 0.05, ZR + 0.15], [0, 0.6, 0.35], 0.035));
  b.add("zinc", box(0.46, 0.22, 0.8, 0, 0.46, 1.8), box(0.38, 0.24, 0.5, 0, 0.42, 0.6));
  b.add("iron", turnX([[0, -0.42], [0.09, -0.42], [0.1, -0.36], [0.1, 0.36], [0.09, 0.42], [0, 0.42]], 16).rotate(0, 90, 0).move(0.28, 0.5, -1.0), rod([0.3, 0.6, 0.9], [0.28, 0.5, -0.58], 0.025), rod([0.28, 0.5, -1.42], [0.36, 0.48, -4.9], 0.025));
  // the rear wheels' mud flaps
  for (const s of [-1, 1]) b.add("rubber", box(0.22, 0.5, 0.012, s * XR, 0.28, ZR - 0.62));
}

/** The square bonnet with its rows of pressed vents, the black radiator in front with its filler and the starting
 *  handle, the tall cowl behind it, the front wings over the wheels down to the steps. */
function front(b: Build, paint: MatId) {
  const sec = crown(0.43, 0.86, 1.47, 0.04, true);
  b.add(paint, hullAlong(sec, 1.28, sec, 2.26));
  for (const s of [-1, 1]) {
    b.add(paint, rod([s * 0.43, 1.47, 1.3], [s * 0.43, 1.47, 2.24], 0.012));
    for (let k = 0; k < 5; k++) { const z = 1.6 + k * 0.12; b.add(paint, manifold.hull([[s * 0.43, 1.02, z], [s * 0.43, 1.18, z], [s * 0.43, 1.1, z + 0.09], [s * 0.465, 1.1, z]].map((p) => box(0.004, 0.004, 0.004, ...(p as V3))))); }
  }
  b.add(DARK, rbox(0.8, 0.64, 0.1, 0.06, 0, 0.84, 2.32));
  b.add("iron", box(0.66, 0.5, 0.02, 0, 0.9, 2.375));
  for (let k = -7; k <= 7; k++) b.add(DARK, box(0.006, 0.5, 0.012, k * 0.042, 0.9, 2.385));
  b.add(DARK, turn([[0, 0], [0.045, 0], [0.045, 0.03], [0.03, 0.055], [0, 0.06]], 14).move(0, 1.48, 2.3));
  b.add(BLACK, rod([0, 0.62, 2.28], [0, 0.62, 2.48], 0.016), rod([0, 0.62, 2.48], [0, 0.48, 2.5], 0.014));
  // the cowl: taller than the bonnet, its top rounded back to the driver
  b.add(paint, side([[1.0, 0.86], [1.3, 0.86], [1.3, 1.6], [1.25, 1.69], [1.14, 1.72], [1.0, 1.72]], 0.94));
  const fp = smooth([[2.68, 0.64], [2.56, 0.88], [2.36, 1.0], [2.1, 1.04], [1.86, 1.0], [1.68, 0.88], [1.58, 0.72], [1.55, 0.56]], 3);
  for (const s of [-1, 1]) b.add(BLACK, ...sweepSheet(fp, wingLine(0.035), () => s * XF, () => s * 0.11, 0.006), rod([s * XF, 0.92, 1.72], [s * 0.5, 0.78, 1.72], 0.014), rod([s * XF, 0.92, 2.5], [s * 0.5, 0.8, 2.3], 0.014));
}

/** The driver's place: the footboard, the seat box against the saloon's front wall, the low side panels, the wheel
 *  on its raked column on the right, the gear and brake levers outside it, the bulb horn. */
function driver(b: Build, paint: MatId) {
  b.add("wood-grey", box(2 * HW - 0.08, 0.03, 0.46, 0, 0.88, 0.77));
  b.add("wood-varnish", box(2 * HW - 0.08, 0.44, 0.52, 0, 0.88, 0.28));
  b.add("leather-black", rbox(2 * HW - 0.12, 0.1, 0.46, 0.03, 0, 1.32, 0.3), rbox(2 * HW - 0.12, 0.42, 0.08, 0.03, 0, 1.44, 0.05));
  for (const s of [-1, 1]) b.add(paint, side([[0.02, 0.84], [1.0, 0.84], [1.0, 1.36], [0.92, 1.46], [0.8, 1.5], [0.02, 1.5]], 0.04).move(s * (HW - 0.02), 0, 0));
  const top: V3 = [-0.45, 1.64, 0.74];
  b.add(BLACK, rod([-0.45, 0.95, 1.18], top, 0.025));
  b.add(BLACK, turn([[0.23, -0.014], [0.26, -0.014], [0.26, 0.014], [0.23, 0.014]], 30).rotate(-33, 0, 0).move(...top));
  for (let k = 0; k < 4; k++) b.add(BLACK, rod([0, 0, 0], [0.24 * Math.cos((k * Math.PI) / 2), 0, 0.24 * Math.sin((k * Math.PI) / 2)], 0.009).rotate(-33, 0, 0).move(...top));
  for (const [z, ty] of [[0.62, 1.62], [0.48, 1.52]]) b.add(BLACK, rod([-(HW + 0.03), 0.7, z], [-(HW + 0.05), ty, z - 0.08], 0.016), turn([[0, -0.025], [0.025, -0.014], [0.025, 0.014], [0, 0.025]], 10).move(-(HW + 0.05), ty, z - 0.08));
  b.add(BLACK, box(0.025, 0.2, 0.3, -(HW + 0.03), 0.74, 0.54));
  b.add("brass", rod([-(HW - 0.02), 1.5, 0.95], [-(HW + 0.05), 1.55, 1.25], 0.015), turn([[0.015, 0], [0.055, 0.09], [0.058, 0.1], [0.015, 0.1]], 14).rotate(90, 0, 0).move(-(HW + 0.05), 1.55, 1.18));
  b.add("rubber", turn([[0, -0.045], [0.04, -0.022], [0.04, 0.022], [0, 0.045]], 12).move(-(HW - 0.02), 1.5, 0.92));
}

/** The saloon: its lower panels tucked under, four windows a side with top lights over them, three across its front
 *  over the driver's back, the door and a window at its back; the arch over each back wheel; its mouldings and the
 *  waist panel's lining; the long benches inside; a lamp at each top corner of its front. */
function saloon(b: Build, paint: MatId, line: MatId) {
  const lower: P2[] = [[-HW, WAIST], [-HW, 1.1], [-0.96, 0.92], [-0.9, FLOOR], [0.9, FLOOR], [0.96, 0.92], [HW, 1.1], [HW, WAIST]];
  const upper: P2[] = [[-(HW - 0.02), WAIST - 0.01], [HW - 0.02, WAIST - 0.01], [HW - 0.02, DECK - 0.07], [-(HW - 0.02), DECK - 0.07]];
  let shell: Solid = union(along(lower, SZ1, 0), along(upper, SZ1, 0)).minus(box(2 * HW - 0.1, DECK - FLOOR - 0.1, -SZ1 - 0.1, 0, FLOOR + 0.03, SZ1 / 2));
  const panes: Solid[] = [];
  for (const s of [-1, 1]) for (const [z0, z1] of BAYS) {
    shell = shell.minus(box(0.2, TRANS - SILL, z0 - z1, s * HW, SILL, (z0 + z1) / 2), box(0.2, HEAD - TRANS - 0.06, z0 - z1, s * HW, TRANS + 0.06, (z0 + z1) / 2));
    panes.push(box(0.008, HEAD - SILL, z0 - z1, s * (HW - 0.04), SILL, (z0 + z1) / 2));
  }
  for (const [x0, x1] of [[-0.9, -0.33], [-0.27, 0.27], [0.33, 0.9]]) {
    shell = shell.minus(box(x1 - x0, TRANS - SILL, 0.2, (x0 + x1) / 2, SILL, 0), box(x1 - x0, HEAD - TRANS - 0.06, 0.2, (x0 + x1) / 2, TRANS + 0.06, 0));
    panes.push(box(x1 - x0, HEAD - SILL, 0.008, (x0 + x1) / 2, SILL, -0.03));
  }
  shell = shell.minus(box(0.6, TRANS - FLOOR, 0.2, -0.6, FLOOR + 0.02, SZ1), box(0.8, TRANS - SILL, 0.2, 0.5, SILL, SZ1));
  panes.push(box(0.8, TRANS - SILL, 0.008, 0.5, SILL, SZ1 + 0.03));
  // the back wheels' arches, lined inside, under the benches
  const arch = (r: number, w: number, x: number) => turnX([[0, -w / 2], [r, -w / 2], [r, w / 2], [0, w / 2]], 36).move(x, R, ZR);
  for (const s of [-1, 1]) shell = shell.minus(arch(0.56, 0.6, s * HW));
  b.add(paint, shell);
  for (const s of [-1, 1]) b.add(paint, arch(0.6, 0.36, s * (HW - 0.2)).minus(arch(0.56, 0.4, s * (HW - 0.2))).intersect(box(0.36, 0.5, 1.4, s * (HW - 0.2), FLOOR - 0.02, ZR)));
  b.add(GLASS, ...panes);
  // the door: its leaf open against the platform's side wall, glazed above
  b.add(paint, box(0.04, TRANS - FLOOR - 0.04, 0.58, -0.9, FLOOR + 0.03, SZ1 - 0.32).minus(box(0.1, TRANS - SILL - 0.06, 0.44, -0.9, SILL, SZ1 - 0.32)));
  b.add(GLASS, box(0.006, TRANS - SILL - 0.06, 0.44, -0.9, SILL, SZ1 - 0.32));
  // glazing bars: the transoms and each top light's middle bar
  for (const s of [-1, 1]) for (const [z0, z1] of BAYS) b.add(paint, box(0.03, 0.06, z0 - z1, s * (HW - 0.03), TRANS, (z0 + z1) / 2), box(0.03, HEAD - TRANS, 0.03, s * (HW - 0.03), TRANS, (z0 + z1) / 2));
  // mouldings: the waist rail, the beading under the waist panel, the cant rail; the waist panel's lining
  for (const s of [-1, 1]) {
    b.add(paint, box(0.03, 0.07, -SZ1 + 0.02, s * (HW + 0.012), WAIST - 0.06, SZ1 / 2), box(0.025, 0.04, -SZ1, s * (HW + 0.01), 1.34, SZ1 / 2), box(0.03, 0.05, -SZ1, s * (HW + 0.0), HEAD - 0.03, SZ1 / 2));
    const zL = [-0.16, -3.56], yL = [1.42, 1.79], x = s * (HW + 0.004);
    for (const y of yL) b.add(line, box(0.004, 0.012, zL[0] - zL[1], x, y, (zL[0] + zL[1]) / 2));
    for (const z of zL) b.add(line, box(0.004, yL[1] - yL[0] + 0.012, 0.012, x, yL[0], z));
  }
  // the long benches along both sides, their backs against the panels under the windows
  for (const s of [-1, 1]) {
    b.add("wood-varnish", box(0.42, 0.4, -SZ1 - 0.2, s * (HW - 0.27), FLOOR + 0.02, SZ1 / 2 - 0.02).minus(arch(0.6, 0.5, s * (HW - 0.2))));
    b.add("cloth-navy", rbox(0.42, 0.08, -SZ1 - 0.22, 0.02, s * (HW - 0.27), FLOOR + 0.42, SZ1 / 2 - 0.02), rbox(0.06, 0.42, -SZ1 - 0.22, 0.02, s * (HW - 0.09), FLOOR + 0.62, SZ1 / 2 - 0.02));
  }
  for (const s of [-1, 1]) {
    b.add(BLACK, turn([[0, 0], [0.06, 0], [0.06, 0.12], [0.03, 0.16], [0, 0.17]], 14).move(s * (HW - 0.1), HEAD - 0.32, 0.08));
    b.add("glass-signal", turn([[0, -0.04], [0.05, -0.02], [0.05, 0.02], [0, 0.04]], 14).rotate(90, 0, 0).move(s * (HW - 0.1), HEAD - 0.24, 0.15));
  }
}

/** The open platform behind: its floor and the step below the way in at the back, the side panels sweeping down from
 *  the waist and the railing of bars above them, the rail round the stair at the back; the iron spiral stair to the
 *  deck with its newel and handrail; the grab pole at the way in. */
function platform(b: Build, paint: MatId) {
  b.add("wood-grey", box(2 * HW - 0.04, 0.05, SZ1 - PZ, 0, 0.7, (SZ1 + PZ) / 2));
  b.add("tread-worn", box(2 * HW - 0.1, 0.006, SZ1 - PZ - 0.06, 0, 0.75, (SZ1 + PZ) / 2));
  b.add(BLACK, box(0.7, 0.03, 0.26, -0.6, 0.42, PZ - 0.13), rod([-0.85, 0.44, PZ - 0.1], [-0.85, 0.7, PZ + 0.05], 0.02), rod([-0.35, 0.44, PZ - 0.1], [-0.35, 0.7, PZ + 0.05], 0.02));
  b.add("tread-worn", box(0.68, 0.006, 0.24, -0.6, 0.45, PZ - 0.13));
  const rail: P2[] = [[SZ1, WAIST], [PZ + 0.23, WAIST], [PZ + 0.1, WAIST - 0.05], [PZ + 0.03, WAIST - 0.2], [PZ, WAIST - 0.5], [PZ, 1.0]];
  for (const s of [-1, 1]) {
    b.add(paint, side([[SZ1, 0.64], [PZ, 0.64], [PZ, 0.99], [-4.3, 0.99], [-4.02, 1.14], [-3.84, 1.44], [-3.76, 1.72], [SZ1, WAIST]], 0.04).move(s * (HW - 0.02), 0, 0));
    for (let i = 0; i + 1 < rail.length; i++) b.add(paint, rod([s * (HW - 0.02), rail[i][1], rail[i][0]], [s * (HW - 0.02), rail[i + 1][1], rail[i + 1][0]], 0.016));
    for (let z = -4.08; z > PZ + 0.05; z -= 0.12) { const top = z > PZ + 0.23 ? WAIST : WAIST - 0.5 * ((PZ + 0.23 - z) / 0.23) ** 1.6; b.add(paint, rod([s * (HW - 0.02), 0.99, z], [s * (HW - 0.02), top, z], 0.009)); }
  }
  // the back: barred across behind the stair, open on the kerb's side for the way in (600 mm)
  b.add(paint, rod([0.02, WAIST - 0.5, PZ], [HW - 0.02, WAIST - 0.5, PZ], 0.016), rod([0.02, 1.0, PZ], [HW - 0.02, 1.0, PZ], 0.016), rod([0.02, 0.7, PZ], [0.02, WAIST - 0.5, PZ], 0.016));
  for (let x = 0.12; x < HW - 0.05; x += 0.12) b.add(paint, rod([x, 0.72, PZ], [x, WAIST - 0.5, PZ], 0.009));
  b.add("brass", rod([-0.25, 0.72, PZ + 0.04], [-0.25, DECK - 0.02, PZ + 0.04], 0.018));
  // the spiral stair: ten iron treads round the newel, turning right as it climbs, a rise of 0.204 each
  const [cx, , cz] = STAIR, n = 10, step = (DECK - 0.72) / (n + 1), sweep = (33 * Math.PI) / 180, a0 = Math.PI;
  const at = (r: number, a: number, y: number): V3 => [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
  const hand: V3[] = [];
  for (let i = 0; i < n; i++) {
    const y = 0.72 + (i + 1) * step, a = a0 - i * sweep, pts: V3[] = [at(0.04, a, y), at(0.04, a - sweep * 1.1, y)];
    for (let k = 0; k <= 3; k++) pts.push(at(SR, a - (sweep * 1.1 * k) / 3, y));
    b.add("iron", manifold.hull(...pts.flatMap((p) => [box(0.004, 0.004, 0.004, ...p), box(0.004, 0.004, 0.004, p[0], p[1] - 0.03, p[2])])));
    b.add(paint, rod(at(SR - 0.02, a - sweep * 0.5, y), at(SR - 0.02, a - sweep * 0.5, y + 0.86), 0.009));
    hand.push(at(SR - 0.02, a, y + 0.86), at(SR - 0.02, a - sweep * 0.5, y + 0.86 + step * 0.5));
  }
  for (let i = 0; i + 1 < hand.length; i++) b.add(paint, rod(hand[i], hand[i + 1], 0.016));
  b.add("iron", rod([cx, 0.72, cz], [cx, DECK + 0.84, cz], 0.045), turn([[0, 0], [0.06, 0], [0.06, 0.03], [0, 0.05]], 14).move(cx, DECK + 0.84, cz));
}

/** The deck on the saloon's roof, run forward over the driver and back over the platform: its cornice and slatted
 *  floor round the stair's well; the screen of route boards with the advertising boards over them along its sides and
 *  across its front, on their stanchions; the rail round its back and the stair's head; the garden seats in five rows
 *  either side of the gangway; the lanterns at its front. */
function deck(b: Build, paint: MatId, ads: [string, string, string]) {
  const well = turn([[0, -0.2], [SR + 0.05, -0.2], [SR + 0.05, 0.2], [0, 0.2]], 28).move(STAIR[0], DECK - 0.05, STAIR[2]);
  b.add(paint, rbox(2 * HW + 0.12, 0.1, DZ0 - DZ1, 0.03, 0, DECK - 0.1, (DZ0 + DZ1) / 2).minus(well));
  for (let x = -0.95; x < 0.97; x += 0.1) b.add("wood-grey", box(0.08, 0.02, DZ0 - DZ1 - 0.12, x + 0.04, DECK, (DZ0 + DZ1) / 2).minus(well));
  // the screen: route boards low, the advertising boards over them, white letters on blue
  const z0 = 1.02, z1 = -4.45, ROUTE = "Hallesches Tor  ·  Friedrichstr.  ·  Chausseestr.";
  for (const s of [-1, 1]) {
    const x = s * BX, face = (t: Solid) => t.rotate(0, s * 90, 0).move(x + s * 0.0005, 0, 0);
    b.add("sign-white", box(0.024, 0.2, z0 - z1, x - s * 0.012, DECK + 0.02, (z0 + z1) / 2));
    b.add("enamel-blue", box(0.03, 0.58, z0 - z1, x - s * 0.015, DECK + 0.22, (z0 + z1) / 2));
    b.add(DARK, face(sign(ROUTE, 0.1).move(0, DECK + 0.12, 0)).move(0, 0, (z0 + z1) / 2 - s * 0.25), face(sign("4", 0.13).move(0, DECK + 0.12, 0)).move(0, 0, z0 - 0.16));
    b.add("sign-white", face(sign(s > 0 ? ads[0] : ads[1], 0.3, 0.004, 800).move(0, DECK + 0.51, 0)).move(0, 0, (z0 + z1) / 2));
    for (const z of [0.95, -0.2, -1.35, -2.5, -3.65, -4.4]) b.add(BLACK, box(0.03, 0.8, 0.03, x - s * 0.04, DECK, z));
  }
  b.add("sign-white", box(2 * BX - 0.1, 0.24, 0.024, 0, DECK + 0.02, DZ0 - 0.04));
  b.add("enamel-blue", box(2 * BX - 0.1, 0.54, 0.03, 0, DECK + 0.26, DZ0 - 0.045));
  b.add(DARK, sign("Chausseestr.", 0.14).move(-0.1, DECK + 0.14, DZ0 - 0.026), sign("4", 0.16).move(0.82, DECK + 0.14, DZ0 - 0.026));
  b.add("sign-white", sign(ads[2], 0.3, 0.004, 800).move(0, DECK + 0.53, DZ0 - 0.028));
  for (const x of [-1.0, 0, 1.0]) b.add(BLACK, box(0.03, 0.8, 0.03, x, DECK, DZ0 - 0.08));
  // the back rail round the deck's end and the stair's head, the newel's handrail over the well
  const RY = DECK + 0.84;
  b.add(BLACK, rod([-HW, RY, z1], [-HW, RY, DZ1 + 0.03], 0.016), rod([-HW, RY, DZ1 + 0.03], [HW, RY, DZ1 + 0.03], 0.016), rod([HW, RY, DZ1 + 0.03], [HW, RY, z1], 0.016));
  for (const [x, z] of [[-HW, DZ1 + 0.03], [-0.3, DZ1 + 0.03], [0.3, DZ1 + 0.03], [HW, DZ1 + 0.03], [-HW, -4.8], [HW, -4.8]]) b.add(BLACK, rod([x, DECK, z], [x, RY, z], 0.012));
  const g: V3[] = [];
  for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.1 + (k / 8) * 0.95); g.push([STAIR[0] + (SR + 0.06) * Math.cos(a), RY, STAIR[2] + (SR + 0.06) * Math.sin(a)]); }
  for (let i = 0; i + 1 < g.length; i++) b.add(BLACK, rod(g[i], g[i + 1], 0.016));
  for (const p of [g[0], g[4], g[8]]) b.add(BLACK, rod([p[0], DECK, p[2]], p, 0.012));
  // the garden seats: five rows across, two seats each side of the gangway, slatted, facing forward
  for (const z of [0.85, -0.1, -1.05, -2.0, -2.95]) for (const s of [-1, 1]) {
    const xc = s * 0.6, w = 0.78;
    for (let k = 0; k < 3; k++) b.add("wood-varnish", box(w, 0.025, 0.1, xc, DECK + 0.42, z - 0.05 - k * 0.12));
    for (let k = 0; k < 2; k++) b.add("wood-varnish", box(w, 0.09, 0.025, xc, DECK + 0.58 + k * 0.14, z - 0.42 - k * 0.02));
    for (const e of [-1, 1]) b.add(BLACK, slat([xc + e * (w / 2 - 0.03), DECK, z - 0.03], [xc + e * (w / 2 - 0.03), DECK + 0.42, z - 0.12], 0.035, 0.02), slat([xc + e * (w / 2 - 0.03), DECK, z - 0.4], [xc + e * (w / 2 - 0.03), DECK + 0.84, z - 0.46], 0.035, 0.02));
  }
  // the lanterns on the deck's front edge, coloured glass to the left for the line, clear to the right
  for (const s of [-1, 1]) {
    b.add(BLACK, box(0.16, 0.22, 0.14, s * 0.85, DECK - 0.32, DZ0 + 0.04), rod([s * 0.85, DECK - 0.1, DZ0 + 0.04], [s * 0.85, DECK - 0.1, DZ0 - 0.02], 0.02));
    b.add(s > 0 ? "glass-green" : "glass-signal", box(0.12, 0.16, 0.006, s * 0.85, DECK - 0.29, DZ0 + 0.112));
  }
}

const WORN: Partial<Record<MatId, MatId>> = { "tram-ivory": "tram-ivory-worn", "lacquer-black": "lacquer-black-worn", "wood-varnish": "wood-varnish-worn", "leather-black": "leather-black-worn", "cloth-navy": "cloth-navy-worn", "paint-brown": "paint-brown-worn" };

function bus(id: string, worn: boolean) {
  const b = new Build(), paint: MatId = "tram-ivory";
  chassis(b, id, paint); front(b, paint); driver(b, paint); saloon(b, paint, "paint-brown"); platform(b, paint);
  deck(b, paint, worn ? ["Zeichnet Kriegsanleihe!", "Zeichnet Kriegsanleihe!", "Kriegsanleihe"] : ["Kakao  ·  Schokolade", "Zigaretten", "Kakao"]);
  const parts = b.parts().map((p) => ({ ...p, mat: worn ? (WORN[p.mat] ?? p.mat) : p.mat }));
  const on = ["tram-ivory", "lacquer-black", "rubber", "iron"].flatMap((m) => [m, WORN[m as MatId] ?? m]);
  return muddy(parts, splashMask(2.8, 16, 0.3, worn ? 1.0 : 0.8, worn ? 44 : 43), "mud-road", on);
}

prop({ id: "bus-motor", items: ["bus-motor"], size: [2.25, 3.85, 8.05], place: "floor", where: "set", tris: 60000, parts: () => bus("bus-motor", false) });
prop({ id: "bus-motor-worn", items: ["bus-motor"], size: [2.25, 3.85, 8.05], place: "floor", where: "set", tris: 60000, parts: () => bus("bus-motor-worn", true) });

export const KIT_BUS = true;
