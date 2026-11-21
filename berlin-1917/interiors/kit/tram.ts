// The Große Berliner Straßenbahn's cars in winter 1917-18, the catalogue's tram-car (research/catalogue/outdoor.ts):
//   tram-maximum   the motor car, type Maximum 30 (1907-12, 365 built): 11.0 m over its open platforms, 2.1 m wide,
//                  3.45 m to the roof, ten windows a side, two Maximum bogies (each a big driven wheel at the car's end
//                  and a small pony wheel inboard), longitudinal benches (de.wikipedia GBS Maximum 30)
//   tram-trailer   the trailer, the Sommer-Winter-Wagen (1905-12, 174 built): 8.29 m body, 2.12 m wide, 3.35 m high,
//                  four big round-topped windows a side, two axles 1.95 m apart, 817 mm wheels, cross seats
//   tram-pole      the motor car's trolley pole, its pivot at the origin: the GBS ran on roller collectors, unlike the
//                  city's own lines and BESTAG with their Lyra bows (de.wikipedia Berliner Elektrische Straßenbahnen);
//                  it trails toward -z, its wheel on the wire 2.2 m over the pivot, the rope down to the rear dash
// Livery: fir-green side walls and ivory (GBS Sommer-Winter-Wagen: "tannengrün und elfenbeinfarben"). Line numbers
// were white sheet-iron figures about 50 cm high standing on the roof before the pole, and the route boards white with
// black letters (Verein für die Geschichte Berlins, Liniennummern 1902). The route on the boards is ASSUMED: a run along
// Leipziger Straße, Spittelmarkt to Potsdamer Platz; the line number too, until the 1917 timetable is read.
// Frame: the rail's top under the car's middle, +z its driving end (each end has its controller), x across.
// The platforms are open: the people lane's conductress stands on the rear one (people/schaffnerin.tsx), the driver
// at the front controller (TRAM.drive).
import type { Solid } from "raea/3d";
import { crossSection } from "raea/3d";
import { box, lathe, post, ring, taper, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { archRoof, arcPts, disc, muddy, prism, rod, roundEnds, sign, splashMask, wallAlong } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const HW = 1.05, BODY0 = 0.82, FLOOR = 0.92, WAIST = 1.62, WIN0 = 1.68, WIN1 = 2.48, EAVES = 2.74, DASH = 1.95;

/** A window's cutter through a side wall: w wide, from y0 to y1, its top an arc rising `arch` (0: square), centred
 *  at z, through x. */
function windowCut(w: number, y0: number, y1: number, arch: number, z: number): Solid {
  const pts: [number, number][] = [[-w / 2, y0], [w / 2, y0], [w / 2, y1 - arch]];
  for (let i = 1; i < 8 && arch > 0; i++) { const u = w / 2 - (w * i) / 8; pts.push([u, y1 - arch + arch * Math.sqrt(Math.max(0, 1 - (u / (w / 2)) ** 2))]); }
  pts.push([-w / 2, y1 - arch]);
  return crossSection.polygon(pts).extrude(3).move(0, 0, -1.5).rotate(0, 90, 0).move(0, 0, z);
}

type Car = { sal: number; plat: number; wins: number; winW: number; arch: number; motor: boolean; route: string; line: string };
const MAXIMUM: Car = { sal: 7.0, plat: 1.7, wins: 10, winW: 0.56, arch: 0, motor: true, route: "SPITTELMARKT - POTSDAMER PLATZ", line: "64" };
const TRAILER: Car = { sal: 5.3, plat: 1.35, wins: 4, winW: 1.05, arch: 0.22, motor: false, route: "SPITTELMARKT - POTSDAMER PLATZ", line: "" };

/** A car; `worn`: one that hasn't been to the shops since 1914, its paint faded and rubbed to primer at the edges, the
 *  seats' varnish sat through, three panes broken and boarded over (glass went to the front; ASSUMED from wartime
 *  photographs of other cities' cars). */
function car(c: Car, worn = false): Part[] {
  const SZ = c.sal / 2, END = SZ + c.plat, BULGE = 0.3;
  const green: Solid[] = [], ivory: Solid[] = [], iron: Solid[] = [], glass: Solid[] = [], wood: Solid[] = [], roof: Solid[] = [], white: Solid[] = [], black: Solid[] = [], lamp: Solid[] = [];
  // ── the saloon's sides: green below the waist, the ivory window band cut for its windows, the letterboard over
  const pitch = c.sal / c.wins;
  for (const s of [-1, 1]) {
    const x = s * (HW - 0.025);
    green.push(box(0.05, WAIST - BODY0, c.sal, x, BODY0, 0));
    let band = box(0.05, EAVES - WAIST, c.sal, x, WAIST, 0);
    for (let i = 0; i < c.wins; i++) band = band.minus(windowCut(c.winW, WIN0, WIN1, c.arch, -SZ + pitch * (i + 0.5)).move(x, 0, 0));
    ivory.push(band, box(0.07, 0.05, c.sal + 0.02, s * (HW - 0.02), WAIST, 0));
    glass.push(box(0.008, WIN1 - WIN0, c.sal - 0.1, s * (HW - 0.045), WIN0, 0));
    // the route board along the roof's edge, white with black letters, read from the pavement
    white.push(box(0.02, 0.22, Math.min(c.sal - 0.6, 4.2), s * (HW + 0.012), EAVES - 0.25, 0));
    black.push(sign(c.route, 0.11, 0.004).rotate(0, s * 90, 0).move(s * (HW + 0.022), EAVES - 0.14, 0));
  }
  // ── the bulkheads: a sliding door in the middle, a window each side
  for (const e of [-1, 1]) {
    let wall = box(2 * HW, EAVES - BODY0, 0.05, 0, BODY0, e * SZ);
    wall = wall.minus(box(0.72, 2.55 - FLOOR, 0.4, 0, FLOOR, e * SZ)).minus(box(0.46, WIN1 - WIN0, 0.4, -0.66, WIN0, e * SZ)).minus(box(0.46, WIN1 - WIN0, 0.4, 0.66, WIN0, e * SZ));
    green.push(wall.intersect(box(2 * HW, WAIST - BODY0, 0.2, 0, BODY0, e * SZ)));
    ivory.push(wall.intersect(box(2 * HW, EAVES - WAIST, 0.2, 0, WAIST, e * SZ)));
    glass.push(box(0.46, WIN1 - WIN0, 0.008, -0.66, WIN0, e * SZ), box(0.46, WIN1 - WIN0, 0.008, 0.66, WIN0, e * SZ));
    // the sliding door, shut: its frame and its light
    ivory.push(box(0.7, 2.55 - FLOOR, 0.035, 0, FLOOR, e * (SZ + 0.05)).minus(box(0.5, 0.95, 0.2, 0, 1.45, e * (SZ + 0.05))));
    glass.push(box(0.5, 0.95, 0.006, 0, 1.45, e * (SZ + 0.05)));
  }
  // ── the platforms: floor, the curved dash with its top rail, the corner posts under the hood, steps, grab rails
  const plan = roundEnds(2 * HW - 0.04, 2 * END, BULGE);
  wood.push(prism(plan, FLOOR - 0.06, FLOOR).minus(box(2 * HW, 0.3, c.sal - 0.02, 0, FLOOR - 0.2, 0)));
  for (const e of [-1, 1]) {
    const pts = arcPts(HW - 0.02, END - BULGE, BULGE, 10).map(([x, z]): [number, number] => [x, e * z]);
    green.push(wallAlong(pts, BODY0, DASH, 0.04));
    iron.push(wallAlong(pts, DASH, DASH + 0.04, 0.06));
    // the headlamp in the dash's middle and its glass
    iron.push(lathe([[0, 0], [0.11, 0], [0.12, 0.12], [0, 0.12]], 0, 0, 0, 16).rotate(e * 90, 0, 0).move(0, 1.42, e * (END + 0.01)));
    lamp.push(lathe([[0, 0], [0.095, 0], [0.09, 0.01], [0, 0.02]], 0, 0, 0, 16).rotate(e * 90, 0, 0).move(0, 1.42, e * (END + 0.13)));
    for (const s of [-1, 1]) {
      // the hood's corner post where the dash meets the side, and grab rails at the entrance
      iron.push(post(0.022, EAVES - DASH, s * (HW - 0.06), DASH, e * (END - BULGE * 0.3)));
      iron.push(rod([s * (HW - 0.01), FLOOR + 0.1, e * (SZ + 0.08)], [s * (HW - 0.01), 2.3, e * (SZ + 0.08)], 0.014));
      iron.push(rod([s * (HW - 0.05), FLOOR + 0.1, e * (END - BULGE - 0.1)], [s * (HW - 0.05), DASH, e * (END - BULGE - 0.1)], 0.014));
      // the step under each entrance, hung on two irons
      iron.push(box(0.3, 0.035, 0.75, s * (HW + 0.08), 0.42, e * (SZ + c.plat * 0.45)), rod([s * (HW - 0.02), 0.82, e * (SZ + c.plat * 0.45 - 0.3)], [s * (HW + 0.12), 0.43, e * (SZ + c.plat * 0.45 - 0.3)], 0.012), rod([s * (HW - 0.02), 0.82, e * (SZ + c.plat * 0.45 + 0.3)], [s * (HW + 0.12), 0.43, e * (SZ + c.plat * 0.45 + 0.3)], 0.012));
    }
    if (c.motor) {
      // the controller on the driver's left, the hand brake's column and crank on his right
      const zc = e * (END - BULGE - 0.18);
      iron.push(box(0.26, 1.0, 0.2, -0.32, FLOOR, zc), lathe([[0, 0], [0.09, 0], [0.09, 0.03], [0, 0.03]], -0.32, FLOOR + 1.0, zc), rod([-0.32, FLOOR + 1.05, zc], [-0.18, FLOOR + 1.06, zc + e * 0.12], 0.012));
      iron.push(post(0.025, 1.05, 0.34, FLOOR, zc), rod([0.34, FLOOR + 1.05, zc], [0.34, FLOOR + 1.05, zc + e * 0.22], 0.01), rod([0.34, FLOOR + 1.05, zc + e * 0.22], [0.34, FLOOR + 0.95, zc + e * 0.22], 0.014));
    }
    // signal lanterns on the hood's end, the trumpet coupling and the life guard below
    for (const s of [-1, 1]) { iron.push(box(0.2, 0.26, 0.16, s * 0.55, EAVES + 0.05, e * (END - 0.2))); lamp.push(box(0.16, 0.2, 0.17, s * 0.55, EAVES + 0.08, e * (END - 0.2))); }
    iron.push(lathe([[0.04, 0], [0.05, 0], [0.11, 0.32], [0.1, 0.33], [0.035, 0.02]], 0, 0, 0, 12).rotate(e * 90, 0, 0).move(0, 0.58, e * (END - 0.15)));
    // the life guard: slats in a frame under the platform's nose, hung from the headstock on four irons (it drops
    // to the rail when its trip gate before it is struck)
    const zg = e * (END - BULGE * 0.6), zh = e * (END - 0.32);
    for (let i = 0; i < 4; i++) iron.push(box(1.5, 0.03, 0.05, 0, 0.1 + i * 0.07, zg));
    for (const x of [-0.75, 0.75]) iron.push(box(0.05, 0.3, 0.05, x, 0.08, zg));
    for (const x of [-0.7, -0.25, 0.25, 0.7]) iron.push(rod([x, BODY0 - 0.14, zh], [x, 0.36, zg], 0.016));
    iron.push(box(1.6, 0.05, 0.06, 0, 0.36, zg), box(1.9, 0.18, 0.12, 0, BODY0 - 0.2, zh)); // the guard's top bar, the headstock
    // the platform's bearers: two irons from the frame out under the floor to the nose
    for (const x of [-0.55, 0.55]) iron.push(box(0.08, 0.12, END - SZ, x, BODY0 - 0.14, e * (SZ + (END - SZ) / 2 - 0.05)));
  }
  // ── roof over all, cut to the platforms' rounded ends; the lantern (clerestory) over the saloon with its vents
  const LZ = c.sal - 0.5;
  roof.push(archRoof(HW + 0.03, EAVES, 0.2, 0.05, 2 * END + 0.1).intersect(prism(roundEnds(2 * HW + 0.06, 2 * END + 0.06, BULGE), 0, 4)).minus(box(1.08, 1, LZ - 0.04, 0, EAVES - 0.1, 0)));
  for (const s of [-1, 1]) { ivory.push(box(0.04, 0.3, LZ, s * 0.56, 2.86, 0)); glass.push(box(0.01, 0.15, LZ - 0.3, s * 0.585, 2.93, 0)); }
  ivory.push(box(1.16, 0.3, 0.04, 0, 2.86, LZ / 2), box(1.16, 0.3, 0.04, 0, 2.86, -LZ / 2));
  roof.push(archRoof(0.64, 3.14, 0.08, 0.04, LZ + 0.1));
  // ── under the floor: the frame, the wheels and their frames
  iron.push(box(1.9, 0.12, 2 * END - 1.0, 0, BODY0 - 0.14, 0));
  const wheel = (R: number, x: number, z: number) => { const w = disc(R, 0.1, { flange: 0.025, boss: 0.09 }); iron.push(w.steel.move(x, R, z)); };
  const G = 0.7175;
  if (c.motor) {
    for (const e of [-1, 1]) {
      const zb = e * (SZ - 0.4);
      for (const s of [-1, 1]) { wheel(0.425, s * G, zb + e * 0.55); wheel(0.3, s * G, zb - e * 0.6); iron.push(box(0.08, 0.2, 1.75, s * 0.86, 0.32, zb), box(0.12, 0.16, 0.2, s * 0.86, 0.34, zb + e * 0.55), box(0.12, 0.14, 0.18, s * 0.86, 0.22, zb - e * 0.6)); }
      iron.push(box(1.6, 0.1, 0.25, 0, 0.5, zb));
    }
    // the trolley pole's base on the roof: a turntable and its spring drum (the pole is tram-pole)
    iron.push(lathe([[0, 0], [0.22, 0], [0.22, 0.05], [0, 0.05]], 0, 2.94, -0.3, 16), box(0.24, 0.16, 0.5, 0, 2.99, -0.3));
    // the line number in white sheet iron, standing on the roof before the pole, one facing each end
    for (const e of [-1, 1]) white.push(sign(c.line, 0.42, 0.012, 800).rotate(0, e > 0 ? 0 : 180, 0).move(0, 3.62, e * 1.3));
    iron.push(rod([-0.25, 3.32, 1.3], [-0.25, 3.84, 1.3], 0.008), rod([0.25, 3.32, 1.3], [0.25, 3.84, 1.3], 0.008), rod([-0.25, 3.32, -1.3], [-0.25, 3.84, -1.3], 0.008), rod([0.25, 3.32, -1.3], [0.25, 3.84, -1.3], 0.008));
  } else {
    for (const z of [-0.975, 0.975]) for (const s of [-1, 1]) { wheel(0.4085, s * G, z); iron.push(box(0.12, 0.22, 0.24, s * 0.86, 0.32, z)); }
    for (const s of [-1, 1]) iron.push(box(0.06, 0.08, 3.0, s * 0.86, 0.5, 0)); // the springs' hangers
  }
  // ── inside, to ride in: the saloon's boards with a slatted floor over them, varnished ash below the windows and
  // between them, the advertisement rail over them, the ceiling painted ivory and open into the lantern, slatted
  // benches on iron brackets (along the sides in the motor car, across in the trailer), two rails of leather hand
  // straps, the bell cord to the driver, electric lamps in frosted globes, an enamel plate over each door
  const ash: Solid[] = [], slats: Solid[] = [], bright: Solid[] = [], strap: Solid[] = [], ceil: Solid[] = [], globe: Solid[] = [], card: Solid[] = [];
  wood.push(box(2 * HW - 0.1, 0.04, c.sal - 0.06, 0, FLOOR - 0.04, 0));
  for (let i = 0; i < 15; i++) slats.push(box(0.05, 0.018, c.sal - 0.3, -0.8 + (i * 1.6) / 14, FLOOR, 0));
  for (const s of [-1, 1]) {
    const x = s * (HW - 0.06);
    ash.push(box(0.02, WIN0 - FLOOR, c.sal - 0.1, x, FLOOR, 0), box(0.07, 0.035, c.sal - 0.1, s * (HW - 0.085), WIN0 - 0.035, 0));
    for (let i = 0; i <= c.wins; i++) ash.push(box(0.03, WIN1 - WIN0, 0.07, x, WIN0, Math.max(-SZ + 0.05, Math.min(SZ - 0.05, -SZ + pitch * i))));
    ash.push(box(0.02, EAVES - WIN1 - 0.02, c.sal - 0.1, x, WIN1, 0), box(0.05, 0.025, c.sal - 0.1, s * (HW - 0.08), WIN1 + 0.2, 0));
    // the cards in the advertisement rail: soap, cocoa, war loans (blank: their print is a texture's job)
    for (let i = 0; i < Math.floor(c.sal / 0.75); i++) card.push(box(0.006, 0.17, 0.62, s * (HW - 0.075), WIN1 + 0.025, -c.sal / 2 + 0.45 + i * 0.75));
  }
  ceil.push(archRoof(HW - 0.06, EAVES - 0.025, 0.19, 0.012, c.sal - 0.1).minus(box(1.08, 1, LZ - 0.04, 0, EAVES - 0.1, 0)), archRoof(0.55, 3.12, 0.07, 0.01, LZ - 0.04));
  const SEAT = FLOOR + 0.43;
  if (c.motor) for (const s of [-1, 1]) {
    const L = c.sal - 0.5;
    for (let i = 0; i < 6; i++) ash.push(box(0.055, 0.025, L, s * (HW - 0.12 - 0.065 * i), SEAT - 0.025, 0)); // the seat's slats
    for (let i = 0; i < 5; i++) ash.push(box(0.022, 0.06, L, s * (HW - 0.09 - 0.012 * i), SEAT + 0.1 + i * 0.075, 0)); // the back's, leaning back
    for (let k = 0; k < 5; k++) { const z = -L / 2 + 0.1 + (k * (L - 0.2)) / 4; iron.push(box(0.4, 0.03, 0.03, s * (HW - 0.29), SEAT - 0.055, z), box(0.03, SEAT - 0.055 - FLOOR, 0.03, s * (HW - 0.46), FLOOR, z), box(0.03, 0.5, 0.03, s * (HW - 0.09), SEAT - 0.055, z)); }
    for (const e of [-1, 1]) iron.push(rod([s * (HW - 0.48), SEAT, e * (L / 2)], [s * (HW - 0.48), SEAT + 0.22, e * (L / 2)], 0.012), rod([s * (HW - 0.48), SEAT + 0.22, e * (L / 2)], [s * (HW - 0.1), SEAT + 0.3, e * (L / 2)], 0.012));
  } else for (let i = 0; i < 6; i++) {
    const z = -SZ + 0.55 + i * ((c.sal - 1.1) / 5);
    for (const s of [-1, 1]) {
      for (let j = 0; j < 6; j++) ash.push(box(0.75, 0.025, 0.055, s * 0.55, SEAT - 0.025, z - 0.16 + j * 0.065));
      for (let j = 0; j < 5; j++) ash.push(box(0.75, 0.06, 0.022, s * 0.55, SEAT + 0.1 + j * 0.075, z - 0.2 - j * 0.012));
      iron.push(box(0.03, SEAT - 0.05 - FLOOR, 0.3, s * 0.2, FLOOR, z), box(0.03, 0.5, 0.03, s * 0.92, SEAT - 0.05, z - 0.2));
    }
  }
  // the hand straps: a rail each side of the gangway on hangers from the ceiling, a strap and ring every 0.42 m
  for (const s of [-1, 1]) {
    const x = s * 0.42, y = 2.5, L = c.sal - 0.6;
    bright.push(rod([x, y, -L / 2], [x, y, L / 2], 0.013));
    for (const z of [-L / 2 + 0.1, 0, L / 2 - 0.1]) iron.push(rod([x, y, z], [x, EAVES + 0.1, z], 0.01));
    for (let k = 0; k * 0.42 < L - 0.3; k++) { const z = -L / 2 + 0.2 + k * 0.42; strap.push(box(0.012, 0.2, 0.03, x, y - 0.2, z)); bright.push(ring(0.05, 0.008).rotate(0, 90, 0).move(x, y - 0.25, z)); }
  }
  iron.push(rod([0, 2.62, -SZ + 0.1], [0, 2.62, SZ - 0.1], 0.004)); // the bell cord, to the bell over each platform
  for (const e of [-1, 1]) iron.push(lathe([[0, 0], [0.06, 0], [0.06, 0.02], [0.02, 0.06], [0, 0.06]], 0, 2.62, e * (SZ - 0.12), 12));
  for (const z of [-c.sal / 3, 0, c.sal / 3]) { globe.push(lathe([[0, 0], [0.09, 0.02], [0.1, 0.09], [0.07, 0.16], [0, 0.17]], 0, 2.92, z, 14)); iron.push(lathe([[0, 0], [0.05, 0], [0.04, 0.05], [0, 0.05]], 0, 3.08, z, 10)); }
  for (const e of [-1, 1]) {
    // over each bulkhead door, inside: RAUCHEN VERBOTEN (ASSUMED: smoking went to the platforms)
    white.push(box(0.56, 0.1, 0.006, 0, 2.58, e * (SZ - 0.03)));
    black.push(sign("RAUCHEN VERBOTEN", 0.045, 0.003).rotate(0, e > 0 ? 180 : 0, 0).move(0, 2.63, e * (SZ - 0.035)));
  }
  // the worn car's boarded panes: a board inside the opening over the broken glass
  const boards: Solid[] = [];
  if (worn) for (const [s, i] of [[1, 2], [1, c.wins - 2], [-1, Math.floor(c.wins / 2)]] as const) boards.push(box(0.025, WIN1 - WIN0 - 0.04, c.winW - 0.02, s * (HW - 0.01), WIN0 + 0.02, -SZ + pitch * (i + 0.5)));
  const W = (m: MatId, w: MatId): MatId => (worn ? w : m);
  const parts: Part[] = [
    { mat: W("tram-green", "tram-green-worn"), solid: union(...green) }, { mat: W("tram-ivory", "tram-ivory-worn"), solid: union(...ivory), overlap: true }, { mat: "iron", solid: union(...iron), overlap: true },
    { mat: "glass", solid: union(...glass), overlap: true }, { mat: "wood-grey", solid: union(...wood, ...boards), overlap: true }, { mat: "tram-roof", solid: union(...roof), overlap: true },
    { mat: "sign-white", solid: union(...white), overlap: true }, { mat: "glass-signal", solid: union(...lamp), overlap: true },
    { mat: W("wood-varnish", "wood-varnish-worn"), solid: union(...ash), overlap: true }, { mat: "wood-varnish-worn", solid: union(...slats), overlap: true },
    { mat: "iron-bright", solid: union(...bright), overlap: true }, { mat: "leather", solid: union(...strap), overlap: true },
    { mat: "paint-white", solid: union(...ceil), overlap: true }, { mat: "lamp-shade", solid: union(...globe), overlap: true }, { mat: "paper-stripe", solid: union(...card), overlap: true },
  ];
  if (black.length) parts.push({ mat: "enamel-black", solid: union(...black), overlap: true });
  // road mud thrown up the bogies, the life guards, the steps and the skirt of the green panels
  return muddy(parts, splashMask(2.5, 2 * END + 0.4, 0.3, worn ? 1.35 : 1.1, worn ? 9 : 4), "mud-road", ["tram-green", "tram-green-worn", "iron"]);
}

/** Where people stand and hold (the people lane's reach goals), in the motor car's frame: the driver at the +z
 *  controller, the conductress on the -z platform by the rear entrance, the platform floors' height. */
export const TRAM: { floor: number; drive: V3; controller: V3; rear: V3; rail: V3; poleBase: V3; wire: number; seat: number; bench: number; strap: number; straps: number } = {
  // riders: the benches' top at `seat`, their front edge at x +-`bench`; the strap rails at x +-`straps`, rings at y `strap`
  seat: FLOOR + 0.43, bench: HW - 0.48, strap: 2.25, straps: 0.42,
  floor: FLOOR, drive: [-0.05, FLOOR, 4.9], controller: [-0.32, FLOOR + 1.05, 5.17], rear: [0.55, FLOOR, -4.6], rail: [1.04, 2.3, -3.58], poleBase: [0, 3.15, -0.3], wire: 5.35,
};

prop({ id: "tram-maximum", items: ["tram-car"], size: [2.36, 3.9, 11.1], place: "floor", where: "set", tris: 120000, parts: () => car(MAXIMUM) });
prop({ id: "tram-maximum-worn", items: ["tram-car"], size: [2.36, 3.9, 11.1], place: "floor", where: "set", tris: 120000, parts: () => car(MAXIMUM, true) });
prop({ id: "tram-trailer", items: ["tram-car"], size: [2.36, 3.4, 8.8], place: "floor", where: "set", tris: 100000, parts: () => car(TRAILER) });
prop({ id: "tram-trailer-worn", items: ["tram-car"], size: [2.36, 3.4, 8.8], place: "floor", where: "set", tris: 100000, parts: () => car(TRAILER, true) });

/** The trolley pole: pivot at the origin, trailing to -z at 27 degrees to the wire 2.2 m above, its harp and grooved
 *  wheel at the head, the rope hanging to the rear dash (TRAM.poleBase + the head = the wire's height). */
prop({
  id: "tram-pole", items: ["tram-car"], size: [0.3, 2.4, 5.0], place: "floor", where: "set", tris: 2500,
  parts: () => {
    const head: V3 = [0, 2.2, -4.27];
    const pole = taper(0.032, 0.018, 4.8).rotate(-62.9, 0, 0); // tipped from +y back toward -z
    const harp = union(box(0.09, 0.12, 0.03, 0, 0, 0).move(head[0], head[1] - 0.04, head[2]), lathe([[0, -0.012], [0.05, -0.012], [0.055, -0.004], [0.04, 0], [0.055, 0.004], [0.05, 0.012], [0, 0.012]], 0, 0, 0, 16).rotate(0, 0, 90).move(head[0], head[1] + 0.03, head[2]));
    const rope = rod([0, 2.15, -4.25], [0, -1.16, -4.9], 0.006); // to the rear dash's top rail
    return [{ mat: "iron", solid: union(pole, harp) }, { mat: "jute", solid: rope, overlap: true }];
  },
});

export const KIT_TRAM = true;
