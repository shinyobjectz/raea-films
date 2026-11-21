// What stands on Berlin's pavements in winter 1917-18, beside the world lane's Litfaß columns, lamps and pumps:
//   postbox-wall, postbox-post  the Reichspost's street letter box of 1910: a blue sheet-steel box 51 x 50 x 37 cm
//                     (MSPT 4.0.451), its rain hood, the slot's flap, the white collection-times plate; on a house
//                     wall at 1.05 m, or on a cast-iron post
//   fire-alarm        a street fire alarm on a house wall under its red lamp (Berlin's first at Moritzplatz, 1886; the
//                     form ASSUMED: a cast-iron box with a glass to break, the word on a plate)
//   pissoir           the eight-sided cast-iron pissoir (the "Café Achteck" of 1879): seven stands round a central
//                     screen, solid panels to 1.9 m, an open band under the roof, a crowned roof; dark green
//   trough-horse      a granite horse trough with water in it (or ice: a frozen part for the world lane)
//   bollard, kerb-guard  a cast-iron bollard, and the granite cone that guards a gateway's corner from wheels
//   tram-stop         a tram stop's post and plate, HALTESTELLE (ASSUMED: the plate's form until a photograph)
//   sentry-box        the Prussian sentry box, a pyramid roof, its walls in black and white chevrons, before a
//                     barracks, a palace or a ministry
//   clock-normal      a Normaluhr: the city's standard clock on a cast-iron column, four faces, set by wire
// Origin on the pavement at the foot; a wall piece's origin on the wall's face at the pavement, out to +z.
import type { Solid } from "raea/3d";
import { ball, box, lathe, post, rbox, taper, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod, sign } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const parts = (...p: [MatId, Solid | Solid[]][]): Part[] => p.map(([mat, s], i) => ({ mat, solid: Array.isArray(s) ? union(...s) : s, overlap: i > 0 }));

/** The letter box, its back at z 0, its bottom at y. */
function letterBox(y: number) {
  const W = 0.51, H = 0.5, D = 0.37;
  const body = [rbox(W, H, D, 0.02, 0, y, D / 2), lathe([[0, 0], [D / 2 + 0.03, 0], [D / 2 + 0.03, 0.02], [0, 0.07]], 0, 0, 0, 4).rotate(0, 45, 0).scale((W + 0.06) / 2 / ((D / 2 + 0.03) / Math.SQRT2), 1, (D + 0.06) / 2 / ((D / 2 + 0.03) / Math.SQRT2)).move(0, y + H, D / 2)];
  const iron = [box(0.3, 0.05, 0.02, 0, y + H - 0.14, D + 0.005), box(0.06, 0.05, 0.02, 0.2, y + 0.08, D + 0.005)]; // the slot's flap, the lock
  const plate = box(0.2, 0.13, 0.008, 0, y + 0.12, D + 0.004);
  const words = sign("BRIEFKASTEN", 0.035, 0.003).move(0, y + H - 0.05, D + 0.002);
  // the posthorn in relief: a coiled tube and its bell
  const horn = union(lathe([[0.045, -0.006], [0.055, -0.006], [0.055, 0.006], [0.045, 0.006]], 0, 0, 0, 16).rotate(90, 0, 0), lathe([[0, 0], [0.012, 0], [0.03, 0.05], [0, 0.05]], 0, 0, 0, 10).rotate(0, 0, -90).move(0.05, -0.05, 0)).move(0, y + 0.3, D + 0.006);
  return { body: union(...body), iron: union(...iron, horn), plate, words };
}
function postboxWall(): Part[] {
  const b = letterBox(1.05);
  return parts(["post-blue", [b.body, b.iron]], ["sign-white", b.plate], ["enamel-black", b.words]);
}
function postboxPost(): Part[] {
  const b = letterBox(0.95);
  const col = [lathe([[0, 0], [0.12, 0], [0.12, 0.08], [0.08, 0.14], [0.06, 0.9], [0.1, 0.95], [0, 0.95]], 0, 0, 0.18, 10)];
  return parts(["post-blue", [b.body, b.iron, ...col]], ["sign-white", b.plate], ["enamel-black", b.words]);
}

function fireAlarm(): Part[] {
  const red: Solid[] = [rbox(0.3, 0.42, 0.14, 0.02, 0, 1.25, 0.07), lathe([[0, 0], [0.18, 0], [0.1, 0.08], [0, 0.1]], 0, 1.67, 0.08, 4).rotate(0, 45, 0).move(0, 0, 0)];
  red.push(box(0.04, 0.5, 0.03, 0, 2.05, 0.015), rod([0, 2.5, 0.02], [0, 2.5, 0.3], 0.012), lathe([[0, 0], [0.08, 0], [0.09, 0.12], [0.03, 0.18], [0, 0.18]], 0, 2.28, 0.3, 8));
  const glass = box(0.14, 0.14, 0.01, 0, 1.42, 0.145), lamp = lathe([[0, 0], [0.07, 0], [0.075, 0.1], [0, 0.1]], 0, 2.18, 0.3, 10);
  return parts(["paint-red", red], ["glass-plate", glass], ["glass-ruby", lamp], ["sign-white", box(0.36, 0.08, 0.008, 0, 1.75, 0.01)], ["enamel-black", sign("FEUERMELDER", 0.04, 0.003).move(0, 1.79, 0.015)]);
}

function pissoir(): Part[] {
  const R = 1.35, n = 8, green: Solid[] = [], dark: Solid[] = [];
  const side = 2 * R * Math.sin(Math.PI / n), ap = R * Math.cos(Math.PI / n);
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2, yaw = (-a * 180) / Math.PI + 90, at = (y: number, h: number, w: number, r: number) => box(w, h, 0.03, 0, 0, 0).rotate(0, yaw, 0).move(r * Math.cos(a), y, r * Math.sin(a));
    if (i === 0) { green.push(at(0.25, 1.65, side * 0.3, ap)); continue; } // the way in: a gap screened by the inner wall
    green.push(at(0.25, 1.65, side, ap)); // the panels, raised off the pavement for the gully
    for (let k = 0; k < 7; k++) green.push(box(0.018, 0.4, 0.018, 0, 0, 0).move(ap * Math.cos(a) + (k - 3) * 0.07 * Math.sin(a), 1.95, ap * Math.sin(a) - (k - 3) * 0.07 * Math.cos(a))); // the open band's bars
  }
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; green.push(post(0.04, 2.45, R * Math.cos(a), 0, R * Math.sin(a))); }
  // the central screen the stands face, with its trough, and the roof: an eight-sided hood with a crown
  green.push(post(0.55, 1.9, 0, 0.05, 0).minus(post(0.5, 2.0, 0, 0, 0)));
  dark.push(lathe([[0.55, 0], [0.75, 0], [0.75, 0.12], [0.55, 0.12]], 0, 0.02, 0, 8));
  green.push(lathe([[0, 0], [R + 0.25, 0], [R + 0.28, 0.08], [0.6, 0.65], [0.3, 0.75], [0.3, 0.9], [0, 0.9]], 0, 2.42, 0, 8));
  green.push(lathe([[0, 0], [0.12, 0], [0.16, 0.12], [0.06, 0.2], [0.09, 0.3], [0, 0.45]], 0, 3.32, 0, 8));
  green.push(lathe([[0, 0], [R + 0.1, 0], [R + 0.1, 0.06], [0, 0.06]], 0, 0, 0, 8).minus(lathe([[0, -1], [R - 0.05, -1], [R - 0.05, 1], [0, 1]], 0, 0, 0, 8)));
  return parts(["paint-green", green], ["iron-rust", dark]);
}

function trough(): Part[] {
  const g = box(2.0, 0.62, 0.65).minus(box(1.84, 0.6, 0.49, 0, 0.12, 0));
  return parts(["granite", [g, box(0.25, 0.22, 0.4, -0.85, 0, 0), box(0.25, 0.22, 0.4, 0.85, 0, 0)]], ["glass-dark", box(1.84, 0.02, 0.49, 0, 0.5, 0)]);
}
const bollard = (): Part[] => parts(["iron", [lathe([[0, 0], [0.13, 0], [0.12, 0.08], [0.09, 0.15], [0.085, 0.7], [0.11, 0.74], [0.11, 0.8], [0.07, 0.86], [0, 0.9]], 0, 0, 0, 12)]]);
const kerbGuard = (): Part[] => parts(["granite", [lathe([[0, 0], [0.3, 0], [0.24, 0.45], [0.16, 0.66], [0, 0.72]], 0, 0, 0, 12)]]);

function tramStop(): Part[] {
  const iron = [post(0.04, 2.6, 0, 0, 0), lathe([[0, 0], [0.09, 0], [0.07, 0.2], [0, 0.2]], 0, 0, 0, 10), ball(0.05).move(0, 2.6, 0), box(0.62, 0.32, 0.02, 0, 2.15, 0.03)];
  return parts(["iron", iron], ["sign-white", rbox(0.58, 0.28, 0.008, 0.03, 0, 2.17, 0.045)], ["enamel-black", sign("HALTESTELLE", 0.07, 0.003).move(0, 2.31, 0.05)]);
}

function sentryBox(): Part[] {
  const W = 1.0, H = 2.35, T = 0.05;
  const shell = box(W, H, W, 0, 0.1, 0).minus(box(W - 2 * T, H, W - 2 * T, 0, 0.12, 0)).minus(box(0.7, 2.0, 0.3, 0, 0.12, W / 2));
  // diagonal stripes 0.18 wide round the walls: slabs tilted 45 degrees, every other one black
  const bands: Solid[] = [];
  for (let k = -8; k <= 8; k++) bands.push(box(0.18, 6, 3, 0, -3, 0).rotate(0, 0, 45).move(k * 0.36 / Math.SQRT2, 1.2, 0));
  const bandsZ = bands.map((s) => s.rotate(0, 90, 0));
  const stripe = union(...bands).intersect(box(W - 2 * T, H, W + 0.1, 0, 0.1, 0)), stripeZ = union(...bandsZ).intersect(box(W + 0.1, H, W - 2 * T, 0, 0.1, 0));
  const black = shell.intersect(union(stripe, stripeZ)), white = shell.minus(union(stripe, stripeZ));
  const roof = lathe([[0, 0], [0.82, 0], [0.82, 0.05], [0.06, 0.55], [0, 0.6]], 0, H + 0.1, 0, 4).rotate(0, 45, 0);
  return parts(["stripe-white", white], ["stripe-black", [black, roof, box(1.1, 0.1, 1.1, 0, 0, 0)]], ["wood-grey", box(W - 0.12, 0.04, W - 0.12, 0, 0.12, 0)]);
}

function clock(): Part[] {
  const col = [lathe([[0, 0], [0.3, 0], [0.3, 0.12], [0.22, 0.2], [0.2, 0.9], [0.24, 0.95], [0.12, 1.05], [0.1, 3.1], [0.16, 3.2], [0.1, 3.3], [0, 3.3]], 0, 0, 0, 12)];
  const head = [box(0.62, 0.62, 0.62, 0, 3.3, 0), lathe([[0, 0], [0.48, 0], [0.48, 0.05], [0.1, 0.38], [0.04, 0.55], [0, 0.6]], 0, 3.92, 0, 4).rotate(0, 45, 0)];
  const faces: Solid[] = [], hands: Solid[] = [];
  for (let i = 0; i < 4; i++) {
    const yaw = i * 90, face = lathe([[0, 0], [0.26, 0], [0.26, 0.01], [0, 0.01]], 0, 0, 0, 24).rotate(90, 0, 0).move(0, 3.61, 0.31);
    faces.push(face.rotate(0, yaw, 0));
    // ten past four, the hands the same on every face
    hands.push(box(0.016, 0.15, 0.006).rotate(0, 0, -125).move(0, 3.61, 0.325).rotate(0, yaw, 0), box(0.012, 0.22, 0.006).rotate(0, 0, -60).move(0, 3.61, 0.33).rotate(0, yaw, 0));
  }
  return parts(["iron", [...col, ...head]], ["sign-white", faces], ["enamel-black", hands]);
}

const P = (id: string, items: string[], size: V3, place: "floor" | "wall", tris: number, f: () => Part[]) => prop({ id, items, size, place, where: "set", tris, parts: f });
P("postbox-wall", ["letter-box"], [0.58, 1.65, 0.42], "wall", 4000, postboxWall);
P("postbox-post", ["letter-box"], [0.58, 1.55, 0.42], "floor", 4000, postboxPost);
P("fire-alarm", ["fire-alarm"], [0.4, 2.5, 0.42], "wall", 3000, fireAlarm);
P("pissoir", ["pissoir"], [3.2, 3.8, 3.2], "floor", 9000, pissoir);
P("trough-horse", ["horse-trough"], [2.0, 0.62, 0.65], "floor", 600, trough);
P("bollard", ["bollard"], [0.26, 0.9, 0.26], "floor", 600, bollard);
P("kerb-guard", ["bollard"], [0.6, 0.72, 0.6], "floor", 400, kerbGuard);
P("tram-stop", ["tram-stop"], [0.62, 2.65, 0.2], "floor", 3000, tramStop);
P("sentry-box", ["sentry-box"], [1.65, 3.05, 1.65], "floor", 3000, sentryBox);
P("clock-normal", ["street-clock"], [0.7, 4.5, 0.7], "floor", 3000, clock);

export const KIT_KERB = true;
