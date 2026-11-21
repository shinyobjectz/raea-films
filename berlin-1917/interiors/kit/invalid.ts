// Invalid chairs (Krankenfahrstuhl) for the war's wounded, wheeled out of the reserve hospitals into Berlin's streets
// and parks, winter 1917-18. Frame: origin on the ground under the chair, +z the way the sitter faces.
//   chair-westfalia      the "Westfalia" of H. W. Voltmann, Bad Oeynhausen, from before the war (the St. Elisabeth
//                        Hospital's, now in the Stadtmuseum Gütersloh; photograph Hewa, Commons, CC BY 3.0): two
//                        big wire wheels under the seat, a tall rounded back upholstered in dark green and close-nailed
//                        in brass, scrolled armrests over solid side panels, a long leg trough sloping to the ground,
//                        the hospital's red cross on a white disc on each side; painted dark green
//   chair-westfalia-rug  the same with a grey army blanket folded on the seat and laid down the trough
//   chair-cane           the plainer caned chair, early 20th century (Museum Wasserburg am Inn; photograph
//                        Edelmauswaldgeist, Commons, CC0): a black frame, caned seat and back, flat armrests on turned
//                        posts, big wheels behind, small castors in front, a hanging leg board with its footrest
// ASSUMED: the sizes, scaled from the photographs on a 24-inch (0.61 m) wheel; the Westfalia's small rear castor and
// the iron feet under its trough's end (hidden in the photograph); a push grip on each side of its back (one shows).
import type { Solid } from "raea/3d";
import { box, lathe, rbox, ring } from "./geo";
import { along, inset, type P2, side, turnX, tyre } from "./forms";
import { rod } from "./outgeo";
import { type Part, prop } from "./prop";
import { Build } from "./vehicles";

/** A light wire wheel on solid rubber, its axis along x, at the origin: n spokes laced to a hub barrel. */
function wireWheel(R: number, n: number): { rubber: Solid; iron: Solid[] } {
  const rubber = tyre(R - 0.012, 0.012, 48);
  const iron: Solid[] = [turnX([[R - 0.034, -0.011], [R - 0.022, -0.012], [R - 0.022, 0.012], [R - 0.034, 0.011]], 48), turnX([[0.012, -0.045], [0.024, -0.045], [0.026, -0.03], [0.022, 0], [0.026, 0.03], [0.024, 0.045], [0.012, 0.045]], 14)];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, f = i % 2 ? 0.032 : -0.032;
    iron.push(rod([f, 0.025 * Math.cos(a), 0.025 * Math.sin(a)], [0, (R - 0.03) * Math.cos(a), (R - 0.03) * Math.sin(a)], 0.0022));
  }
  return { rubber, iron };
}
/** A small solid castor wheel on its fork, the wheel's axle at (x, r, z), the fork's stem up to y1. */
function castor(b: Build, x: number, z: number, r: number, y1: number) {
  b.add("rubber", tyre(r - 0.01, 0.01, 24).move(x, r, z));
  b.add("iron", turnX([[0, -0.012], [r - 0.018, -0.012], [r - 0.018, 0.012], [0, 0.012]], 18).move(x, r, z), rod([x - 0.025, r, z], [x + 0.025, r, z], 0.006));
  for (const s of [-1, 1]) b.add("iron", rod([x + s * 0.024, r, z], [x + s * 0.024, r + 0.07, z - 0.02], 0.007));
  b.add("iron", rod([x - 0.024, r + 0.07, z - 0.02], [x + 0.024, r + 0.07, z - 0.02], 0.007), rod([x, r + 0.07, z - 0.02], [x, y1, z - 0.02], 0.01));
}
/** Cane woven across a w by d panel lying in x-z at the origin: strands both ways at the pitch, open between. */
function caned(w: number, d: number, pitch = 0.018): Solid[] {
  const s: Solid[] = [];
  for (let x = -w / 2 + pitch / 2; x < w / 2; x += pitch) s.push(box(0.004, 0.003, d, x, 0, 0));
  for (let z = -d / 2 + pitch / 2; z < d / 2; z += pitch) s.push(box(w, 0.003, 0.004, 0, 0.0035, z)); // a hair above the first layer, so the two never merge
  return s;
}
/** A brass nail head every `step` round an outline (x, y) at depth z, its dome facing +z. */
function nailsRound(p: P2[], z: number, step: number): Solid[] {
  const head = lathe([[0, 0], [0.006, 0], [0.004, 0.003], [0, 0.004]], 0, 0, 0, 6).rotate(90, 0, 0);
  const out: Solid[] = [];
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / step));
    for (let k = 0; k < n; k++) out.push(head.move(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, z));
  }
  return out;
}
/** The rounded-top outline of a chair back, w wide and h high, from y 0, its top corners round by r. */
function backOutline(w: number, h: number, r: number): P2[] {
  const p: P2[] = [[-w / 2, 0], [w / 2, 0]];
  for (let k = 0; k <= 5; k++) { const a = (k / 5) * (Math.PI / 2); p.push([w / 2 - r + r * Math.cos(a), h - r + r * Math.sin(a)]); }
  for (let k = 0; k <= 5; k++) { const a = Math.PI / 2 + (k / 5) * (Math.PI / 2); p.push([-w / 2 + r + r * Math.cos(a), h - r + r * Math.sin(a)]); }
  return p;
}

function westfalia(rug: boolean): Part[] {
  const b = new Build(), R = 0.31, X = 0.335, ZA = 0.02, SY = 0.5, Z0 = -0.31, Z1 = 0.19;
  // the big wheels on their axle under the seat's front half, the axle hung from the seat box
  const wh = wireWheel(R, 32);
  for (const s of [-1, 1]) { b.add("rubber", wh.rubber.move(s * X, R, ZA)); b.add("iron", ...wh.iron.map((p) => p.move(s * X, R, ZA))); }
  b.add("iron", rod([-X, R, ZA], [X, R, ZA], 0.011));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.22, R, ZA], [s * 0.22, 0.36, ZA], 0.01), rod([s * 0.24, 0.355, Z0], [s * 0.24, 0.355, Z1], 0.009));
  // the seat box, its cushion, the side panels up to the armrests and the scrolled armrests
  b.add("paint-green", box(0.5, 0.14, Z1 - Z0, 0, 0.36, (Z0 + Z1) / 2));
  b.add("leather-green", rbox(0.46, 0.07, 0.46, 0.025, 0, SY, -0.06));
  const panel: P2[] = [[Z0 - 0.01, 0.36], [0.16, 0.36], [0.2, 0.42], [0.2, 0.58], [0.13, 0.7], [Z0 - 0.01, 0.72]];
  for (const s of [-1, 1]) {
    b.add("paint-green", side(panel, 0.022).move(s * 0.261, 0, 0));
    b.add("paint-green", rbox(0.07, 0.035, 0.53, 0.012, s * 0.265, 0.72, -0.06), ring(0.034, 0.014, 16, 6).rotate(0, 90, 0).move(s * 0.265, 0.7, 0.2));
    // the hospital's red cross on a white disc, above and behind the wheel
    b.add("enamel", turnX([[0, -0.002], [0.055, -0.002], [0.055, 0.002], [0, 0.002]], 20).move(s * 0.274, 0.6, -0.2));
    b.add("enamel-red", box(0.004, 0.07, 0.022, s * 0.277, 0.565, -0.2), box(0.004, 0.022, 0.07, s * 0.277, 0.589, -0.2));
  }
  // the back: a green-painted board with a rounded top, padded on its front and nailed round in brass, leaning back;
  // a push grip out of each side
  const bo = backOutline(0.5, 0.68, 0.13), pad = inset(bo, 0.03), lean = (q: Solid) => q.rotate(-12, 0, 0).move(0, SY, Z0 + 0.03);
  b.add("paint-green", lean(along(bo, -0.035, 0.0)));
  b.add("leather-green", lean(along(pad, 0.0, 0.035)));
  b.add("brass", ...nailsRound(inset(bo, 0.034), 0.034, 0.035).map(lean));
  for (const s of [-1, 1]) {
    b.add("iron", rod([s * 0.23, 0.98, -0.41], [s * 0.25, 1.0, -0.52], 0.009), rod([s * 0.25, 1.0, -0.52], [s * 0.26, 1.0, -0.6], 0.009));
    b.add("wood-varnish", turnX([[0, -0.06], [0.014, -0.06], [0.018, -0.04], [0.016, 0], [0.018, 0.04], [0.014, 0.06], [0, 0.06]], 10).rotate(0, 90, 0).move(s * 0.26, 1.0, -0.66));
  }
  // the leg trough from the seat's front edge down nearly to the ground: floor, tapering sides, the foot board; iron
  // hinge straps; two iron feet under its end
  const L = 0.8, tilt = 29;
  const trough = (q: Solid) => q.rotate(tilt, 0, 0).move(0, 0.46, Z1);
  b.add("paint-green", ...[box(0.4, 0.018, L, 0, 0, L / 2), box(0.4, 0.13, 0.018, 0, 0, L - 0.009), ...[-1, 1].map((s) => side([[0, 0], [L, 0], [L, 0.13], [0, 0.21]], 0.018).move(s * 0.209, 0, 0))].map(trough));
  for (const s of [-1, 1]) b.add("iron", rod([s * 0.22, 0.42, 0.1], [s * 0.22, 0.4, 0.3], 0.007), rod([s * 0.16, 0.06, 0.86], [s * 0.16, 0.0, 0.88], 0.012));
  // the small castor under the back on its bracket
  castor(b, 0, -0.46, 0.09, 0.36);
  b.add("iron", rod([0, 0.36, -0.48], [0, 0.36, Z0], 0.01));
  if (rug) {
    // a grey army blanket folded on the seat and laid down the trough, two darker bands across it
    b.add("wool", rbox(0.42, 0.05, 0.28, 0.02, 0, SY + 0.07, 0.04));
    b.add("wool", ...[box(0.36, 0.03, 0.62, 0, 0.018, 0.35)].map(trough));
    b.add("felt", ...[box(0.365, 0.032, 0.05, 0, 0.018, 0.2), box(0.365, 0.032, 0.05, 0, 0.018, 0.52)].map(trough));
  }
  return b.parts();
}

function cane(): Part[] {
  const b = new Build(), R = 0.3, X = 0.31, ZA = -0.2, SY = 0.5, W = 0.46, Z0 = -0.24, Z1 = 0.2, K = "lacquer-black-worn";
  const wh = wireWheel(R, 28);
  for (const s of [-1, 1]) { b.add("rubber", wh.rubber.move(s * X, R, ZA)); b.add("iron", ...wh.iron.map((p) => p.move(s * X, R, ZA))); }
  b.add("iron", rod([-X, R, ZA], [X, R, ZA], 0.011));
  // the seat: a frame of four rails round the caned panel, on a side frame of two rails down to the axle and castors
  const zc = (Z0 + Z1) / 2, d = Z1 - Z0;
  b.add(K, box(W, 0.04, 0.04, 0, SY - 0.04, Z0 + 0.02), box(W, 0.04, 0.04, 0, SY - 0.04, Z1 - 0.02), ...[-1, 1].map((s) => box(0.04, 0.04, d, s * (W / 2 - 0.02), SY - 0.04, zc)));
  b.add("cane", ...caned(W - 0.08, d - 0.08).map((q) => q.move(0, SY - 0.015, zc)));
  for (const s of [-1, 1]) {
    b.add(K, box(0.03, 0.03, d, s * (W / 2 - 0.015), SY - 0.22, zc), box(0.03, 0.22, 0.03, s * (W / 2 - 0.015), SY - 0.22, Z1 - 0.02), box(0.03, 0.22, 0.03, s * (W / 2 - 0.015), SY - 0.22, Z0 + 0.02));
    b.add("iron", rod([s * (W / 2 - 0.015), SY - 0.2, ZA], [s * X, R, ZA], 0.01));
    castor(b, s * 0.215, 0.2, 0.08, SY - 0.22);
  }
  // the back: two stiles and a gently arched top rail round a caned panel, leaning back; push grips behind its top
  const BH = 0.72, lean = (q: Solid) => q.rotate(-10, 0, 0).move(0, SY, Z0 + 0.02);
  const backFrame: Solid[] = [...[-1, 1].map((s) => box(0.035, BH, 0.035, s * (W / 2 - 0.0175), 0, 0)), box(W, 0.035, 0.035, 0, 0.1, 0)];
  for (let k = 0; k < 8; k++) { const x0 = -W / 2 + (W * k) / 8, x1 = -W / 2 + (W * (k + 1)) / 8, y = (x: number) => BH - 0.06 + 0.05 * Math.cos((x / W) * Math.PI); backFrame.push(rod([x0, y(x0), 0], [x1, y(x1), 0], 0.022)); }
  b.add(K, ...backFrame.map(lean));
  b.add("cane", ...caned(W - 0.07, BH - 0.24).map((q) => q.rotate(90, 0, 0).move(0, 0.13 + (BH - 0.24) / 2, 0)).map(lean));
  for (const s of [-1, 1]) b.add("wood-varnish", turnX([[0, -0.05], [0.014, -0.05], [0.017, -0.03], [0.015, 0], [0.017, 0.03], [0.014, 0.05], [0, 0.05]], 10).rotate(0, 90, 0).move(s * (W / 2 - 0.0175), SY + 0.65, -0.4));
  // the armrests: flat rails from the back's stiles to a turned post at the seat's front
  for (const s of [-1, 1]) {
    b.add(K, rbox(0.06, 0.03, 0.44, 0.01, s * (W / 2 - 0.0175), SY + 0.22, -0.03), turnX([[0, -0.11], [0.016, -0.11], [0.02, -0.08], [0.013, -0.05], [0.016, 0], [0.013, 0.05], [0.02, 0.08], [0.016, 0.11], [0, 0.11]], 10).rotate(0, 0, 90).move(s * (W / 2 - 0.0175), SY + 0.11, Z1 - 0.03));
  }
  // the leg board hanging from the seat's front rail, its footrest out over the castors
  b.add(K, box(0.42, 0.32, 0.016, 0, 0.17, Z1 + 0.02), box(0.42, 0.016, 0.17, 0, 0.17, Z1 + 0.105));
  b.add("iron", ...[-1, 1].map((s) => rod([s * 0.19, SY - 0.04, Z1], [s * 0.19, 0.2, Z1 + 0.03], 0.007)));
  return b.parts();
}

prop({ id: "chair-westfalia", items: ["invalid-chair"], size: [0.72, 1.2, 1.7], place: "floor", where: "set", tris: 12000, parts: () => westfalia(false) });
prop({ id: "chair-westfalia-rug", items: ["invalid-chair"], size: [0.72, 1.2, 1.7], place: "floor", where: "set", tris: 12000, parts: () => westfalia(true) });
prop({ id: "chair-cane", items: ["invalid-chair"], size: [0.68, 1.25, 1.0], place: "floor", where: "set", tris: 12000, parts: () => cane() });

export const KIT_INVALID = true;
