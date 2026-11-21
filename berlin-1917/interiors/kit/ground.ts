// The ground's ironwork, winter 1917-18 (catalogue gully, valve-caps, hydrant).
//   gully, gully-choked   the street gully in the gutter against the kerb, after Hobrecht, Die Canalisation von Berlin
//                         (1884), Atlas Blatt 9, "Details der Eisentheile für Gullies" (research/sewer-structures-1884.tsv;
//                         e-rara, public domain): a cast-iron frame showing a 0.025 rim at the paving (its flange, 0.71 x
//                         0.61, under the setts) round a 0.50 x 0.40 grate of ten slots across the flow between ribs 0.105
//                         deep, its top dished toward the middle; under it the brick neck and the silt in the pot. The
//                         choked one has straw, dead leaves and grit in its slots and horse dung against the kerb.
//   valve-cap, valve-cap-small   the water and gas mains' valve caps in the pavement, a lid in a round frame.
//   hydrant-lid           the underground hydrant's oval cap in the pavement, its lid ribbed, a lifting bar at one end.
// ASSUMED: the caps' and the hydrant lid's forms and sizes. Berlin's 1917 patterns are unconfirmed; the hydrant's oval
// is sized from DIN 4055 of 1938 (420 x 310), the nearest documented, and none carries lettering. The silt's level.
// Frames: origin at the cover's centre on the paving's top. The gully's x runs along the kerb, the kerb at +z; the
// world lane cuts the ground over GULLY_CUT. The caps stand 3 mm proud and need no cut.
import type { Solid } from "raea/3d";
import { manifold } from "raea/3d";
import { ball, box, lathe, ring, union } from "./geo";
import { type Part, prop } from "./prop";
import { Build } from "./vehicles";

/** The gully's opening in the paving: w along the kerb, d out from it, its back edge on the kerb face. */
export const GULLY_CUT = { w: 0.55, d: 0.45, depth: 0.62 };

const GW = 0.5, GD = 0.4, RIM = 0.025, SAG = 0.012, NS = 10, SW = 0.025, SL = 0.29, PITCH = 0.047;
const slotX = (i: number) => (i - (NS - 1) / 2) * PITCH;

/** Everything above the grate's dished top, y = SAG * ((z / (GD / 2))^2 - 1): a convex region, so a hull. */
function dish(): Solid {
  const pts: [number, number, number][] = [];
  for (const x of [-0.3, 0.3]) {
    for (let i = 0; i <= 10; i++) { const z = -0.22 + (0.44 * i) / 10; pts.push([x, SAG * ((z / (GD / 2)) ** 2 - 1), z]); }
    pts.push([x, 0.1, -0.22], [x, 0.1, 0.22]);
  }
  return manifold.hull(pts);
}

function gully(choked: boolean): Part[] {
  const b = new Build();
  // the grate: a plate as deep as its ribs, the ten slots through it, the top dished
  const slots = Array.from({ length: NS }, (_, i) => box(SW, 0.3, SL, slotX(i), -0.2, 0));
  b.add("iron", box(GW, 0.105, GD, 0, -0.105, 0).minus(union(...slots, dish())));
  // the frame: its rim round the grate, flush with the paving, and the ledge the grate sits on
  const rim = box(GW + 2 * RIM, 0.13, GD + 2 * RIM, 0, -0.13, 0).minus(box(GW + 0.004, 0.3, GD + 0.004, 0, -0.2, 0));
  const ledge = box(GW + 0.01, 0.025, GD + 0.01, 0, -0.13, 0).minus(box(GW - 0.06, 0.1, GD - 0.06, 0, -0.2, 0));
  b.add("iron-rust", rim, ledge);
  // below: the brick neck down to the silt pot, the silt in it
  b.add("brick-dark", box(GW + 0.3, 0.47, GD + 0.3, 0, -0.62, 0).minus(box(GW, 0.6, GD, 0, -0.57, 0)));
  b.add("mud-road", box(GW, 0.02, GD, 0, -0.57, 0));
  if (choked) {
    // straw caught across three slots, grit filling the ends of four, dead leaves on the grate and dung by the kerb
    for (const i of [1, 4, 7]) b.add("straw", box(SW + 0.004, 0.012, SL * 0.7, slotX(i), -0.02, 0.03 * (i - 4)));
    for (const [i, z] of [[0, 0.1], [2, -0.11], [5, 0.1], [9, -0.09]] as const) b.add("mud-road", box(SW + 0.002, 0.03, 0.09, slotX(i), -0.035, z));
    const leaf = (x: number, z: number, yaw: number, s: number) => ball(0.035 * s).scale(1, 0.12, 0.55).rotate(0, yaw, 0).move(x, -0.004 + 0.002 * s, z);
    b.add("leaf-dead", leaf(-0.15, 0.05, 30, 1), leaf(0.04, -0.08, 110, 0.9), leaf(0.19, 0.12, -40, 1.1), leaf(-0.02, 0.15, 75, 0.8));
    b.add("dung", ball(0.038).scale(1, 0.75, 1).move(-0.33, 0.012, 0.15), ball(0.034).scale(1, 0.7, 1).move(-0.41, 0.01, 0.18), ball(0.03).scale(1, 0.7, 1).move(0.34, 0.008, 0.16));
  }
  return b.parts();
}

/** A round valve cap: the frame (R across the top) 3 mm proud, the lid (r) in it with a bead, a cross of ribs and a boss. */
function valveCap(R: number, r: number): Part[] {
  const b = new Build();
  const frame = lathe([[0, -0.08], [R, -0.08], [R, -0.004], [R - 0.008, 0.003], [0, 0.003]], 0, 0, 0, 24).minus(lathe([[0, -0.2], [r + 0.003, -0.2], [r + 0.003, 0.1], [0, 0.1]], 0, 0, 0, 24));
  b.add("iron-rust", frame);
  // a chamfered edge and a ring of vertices inside it, so the flat top doesn't take the side's smoothed normals
  const lid = lathe([[0, -0.03], [r, -0.03], [r, -0.004], [r - 0.004, 0], [r - 0.012, 0], [0, 0]], 0, 0, 0, 24);
  const ribs = union(ring(r - 0.008, 0.0025, 24, 4).rotate(90, 0, 0), box(0.006, 0.0025, 2 * r - 0.02, 0, 0, 0), box(2 * r - 0.02, 0.0025, 0.006, 0, 0, 0), lathe([[0, 0], [0.014, 0], [0.01, 0.004], [0, 0.004]], 0, 0, 0, 10));
  b.add("iron", lid.move(0, 0.002, 0), ribs.move(0, 0.002, 0)); // 2 mm proud of the paving, 1 mm under the frame
  return b.parts();
}

/** The hydrant's oval cap: the frame 0.42 x 0.31, the lid 0.30 x 0.20 with a border bead, a raised lattice and at one end
 *  the pocket with its bar for the key. */
function hydrantLid(): Part[] {
  const b = new Build(), oval = (rx: number, rz: number, y0: number, y1: number) => lathe([[0, y0], [rx, y0], [rx, y1], [0, y1]], 0, 0, 0, 32).scale(1, 1, rz / rx);
  b.add("iron-rust", oval(0.21, 0.155, -0.1, 0.003).minus(oval(0.153, 0.103, -0.2, 0.1)));
  const L = 0.15, H = 0.1, lid = oval(L, H, -0.035, 0);
  const lattice: Solid[] = [];
  for (let k = -8; k <= 8; k++) for (const a of [45, -45]) lattice.push(box(0.005, 0.0025, 0.5, k * 0.032, 0, 0).rotate(0, a, 0));
  const field = oval(L - 0.022, H - 0.022, -0.01, 0.01).minus(box(0.07, 0.1, 0.05, L - 0.05, -0.05, 0));
  const pocket = box(0.05, 0.03, 0.034, L - 0.05, -0.028, 0);
  b.add("iron", ...[lid.minus(pocket), union(...lattice).intersect(field), ring(L - 0.008, 0.0025, 32, 4).rotate(90, 0, 0).scale(1, 1, (H - 0.008) / (L - 0.008)), box(0.008, 0.012, 0.034, L - 0.05, -0.02, 0)].map((s) => s.move(0, 0.002, 0)));
  return b.parts();
}

prop({ id: "gully", items: ["gully"], size: [0.55, 0.62, 0.45], place: "floor", where: "set", tris: 800, parts: () => gully(false) });
prop({ id: "gully-choked", items: ["gully"], size: [0.55, 0.62, 0.45], place: "floor", where: "set", tris: 1500, parts: () => gully(true) });
prop({ id: "valve-cap", items: ["valve-caps"], size: [0.2, 0.08, 0.2], place: "floor", where: "set", tris: 700, parts: () => valveCap(0.1, 0.065) });
prop({ id: "valve-cap-small", items: ["valve-caps"], size: [0.15, 0.08, 0.15], place: "floor", where: "set", tris: 700, parts: () => valveCap(0.075, 0.048) });
prop({ id: "hydrant-lid", items: ["hydrant"], size: [0.42, 0.1, 0.31], place: "floor", where: "set", tris: 1600, parts: hydrantLid });

export const KIT_GROUND = true;
