// What stands on and lies over a Berlin tenement's roof in 1917-18 (no aerials: broadcasting began in 1923):
//   chimney-2, chimney-4   a brick stack of two or four flues above the roof, a band course, a cap, soot at the mouths
//   chimney-cowl           a zinc cowl on a flue: a pipe with a turning hood
//   roof-ladder            the sweep's ladder lying on the slope, hooked over the ridge
//   roof-steps-35, -45     the sweep's steps up a 35 or 45 degree slope: level treads on iron brackets
//   snow-guard             a 2 m run of the snow guard over the eaves: two iron bars on brackets
//   roof-hatch, roof-hatch-open  a cast-iron roof hatch with its glass, shut or propped open
//   skylight               the stair's skylight: a glazed frame with glazing bars
//   lightning-rod          a pointed rod on the ridge, its down conductor
//   flagpole-roof          a flagpole on the ridge, the Reich's flag flying
//   pigeon-loft            a pigeon fancier's loft on the flat of the roof, its landing board and trap
// Slope pieces (ladder, steps, snow guard, hatches, skylight) are built in the slope's own plane: x along the eaves,
// +z up the slope, y out of the roof; their origin on the roof's surface at the bottom middle. Lay them on with a
// rotation about x by minus the pitch (in ext-kit: pitch = -35); a step's tread then stands level. Chimneys, the rod, the pole and the loft stand upright, their origin at their foot.
import type { Solid } from "raea/3d";
import { box, lathe, post, rodX, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod } from "./outgeo";
import { FLAGS, flyFlag } from "./patriot";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const parts = (...p: [MatId, Solid | Solid[]][]): Part[] => p.map(([mat, s], i) => ({ mat, solid: Array.isArray(s) ? union(...s) : s, overlap: i > 0 }));

function chimney(flues: number): Part[] {
  const W = 0.52, L = 0.14 + flues * 0.38, H = 1.7;
  let stack = union(box(L, H, W), box(L + 0.1, 0.12, W + 0.1, 0, H - 0.45, 0), box(L + 0.12, 0.08, W + 0.12, 0, H, 0));
  const mouths: Solid[] = [];
  for (let i = 0; i < flues; i++) { const x = -L / 2 + 0.07 + 0.19 + i * 0.38; stack = stack.minus(box(0.24, 0.6, 0.24, x, H - 0.4, 0)); mouths.push(box(0.28, 0.02, 0.28, x, H + 0.08, 0)); }
  const soot = stack.intersect(box(L + 0.2, 0.35, W + 0.2, 0, H - 0.27, 0));
  return parts(["brick-raw", stack.minus(box(L + 0.2, 0.35, W + 0.2, 0, H - 0.27, 0))], ["brick-dark", [soot, ...mouths]]);
}
function cowl(): Part[] {
  return parts(["zinc", [lathe([[0.1, 0], [0.12, 0], [0.12, 0.05], [0.1, 0.05], [0.1, 0.55], [0.09, 0.55], [0.09, 0.02], [0.1, 0.02]], 0, 0, 0, 14), lathe([[0, 0], [0.24, 0], [0.18, 0.12], [0.03, 0.2], [0, 0.22]], 0, 0.62, 0, 14), ...[0, 90, 180, 270].map((a) => rod([0.08 * Math.cos((a * Math.PI) / 180), 0.5, 0.08 * Math.sin((a * Math.PI) / 180)], [0.18 * Math.cos((a * Math.PI) / 180), 0.63, 0.18 * Math.sin((a * Math.PI) / 180)], 0.008))]]);
}
function ladder(): Part[] {
  const L = 3.2, W = 0.42, wood: Solid[] = [box(0.05, 0.04, L, -W / 2, 0.06, L / 2), box(0.05, 0.04, L, W / 2, 0.06, L / 2)];
  for (let i = 0; i < 11; i++) wood.push(rodX(0.014, W, 0, 0.08, 0.15 + i * 0.29));
  // the hooks over the ridge at the top, the feet that keep it off the slates
  const iron = [-1, 1].flatMap((s) => [rod([s * W / 2, 0.1, L], [s * W / 2, 0.22, L + 0.12], 0.012), rod([s * W / 2, 0.22, L + 0.12], [s * W / 2, 0.05, L + 0.3], 0.012), box(0.04, 0.06, 0.04, s * W / 2, 0, 0.3), box(0.04, 0.06, 0.04, s * W / 2, 0, L - 0.3)]);
  return parts(["wood-grey", wood], ["iron", iron]);
}
function steps(pitch: number): Part[] {
  const p = (pitch * Math.PI) / 180, iron: Solid[] = [], wood: Solid[] = [];
  for (let i = 0; i < 6; i++) {
    const z = 0.2 + i * 0.42;
    // a level tread in the world is tipped back by the pitch in the slope's frame; its bracket stands it off the roof
    wood.push(box(0.5, 0.035, 0.22, 0, 0, 0).rotate(pitch, 0, 0).move(0, 0.12 + 0.11 * Math.sin(p), z));
    iron.push(rod([-0.2, 0, z - 0.12], [-0.2, 0.13, z], 0.01), rod([0.2, 0, z - 0.12], [0.2, 0.13, z], 0.01), box(0.06, 0.012, 0.18, -0.2, 0, z - 0.1), box(0.06, 0.012, 0.18, 0.2, 0, z - 0.1));
  }
  return parts(["wood-grey", wood], ["iron", iron]);
}
function snowGuard(): Part[] {
  const iron: Solid[] = [rodX(0.012, 2.0, 0, 0.1, 0.06), rodX(0.012, 2.0, 0, 0.2, 0.06)];
  for (const x of [-0.8, 0, 0.8]) iron.push(box(0.04, 0.012, 0.3, x, 0, 0.1), rod([x, 0.01, 0.0], [x, 0.24, 0.06], 0.01));
  return parts(["iron", iron]);
}
function hatch(open: boolean): Part[] {
  const W = 0.5, L = 0.65, frame = box(W + 0.1, 0.12, L + 0.1, 0, 0, L / 2).minus(box(W - 0.04, 0.3, L - 0.04, 0, -0.1, L / 2));
  const lid = union(box(W + 0.06, 0.03, L + 0.06, 0, 0, 0).move(0, 0, (L + 0.06) / 2).minus(box(W - 0.1, 0.1, L - 0.1, 0, -0.05, (L + 0.06) / 2)));
  const glass = box(W - 0.09, 0.008, L - 0.09, 0, 0.012, (L + 0.06) / 2);
  // the lid hinges at its top edge (toward the ridge); open, its lower edge lifts 55 degrees on a stay
  const hinge = (s: Solid) => (open ? s.move(0, 0, -(L + 0.06)).rotate(55, 0, 0).move(0, 0, L + 0.06) : s).move(0, 0.12, -0.03);
  const parts0 = parts(["iron", [frame, hinge(lid)]], ["glass-plate", hinge(glass)]);
  if (open) parts0.push({ mat: "iron", solid: rod([W / 2, 0.12, 0.05], [W / 2, 0.45, 0.4], 0.008), overlap: true });
  return parts0;
}
function skylight(): Part[] {
  const W = 0.9, L = 1.3, frame = box(W + 0.1, 0.15, L + 0.1, 0, 0, L / 2).minus(box(W - 0.04, 0.4, L - 0.04, 0, -0.1, L / 2));
  const bars = [-0.22, 0.22].map((x) => box(0.025, 0.03, L, x, 0.13, L / 2));
  return parts(["iron", [frame, ...bars]], ["glass-frost", box(W - 0.02, 0.008, L - 0.02, 0, 0.14, L / 2)]);
}
function lightningRod(): Part[] {
  return parts(["iron", [post(0.012, 1.5, 0, 0.1, 0), lathe([[0, 0], [0.012, 0], [0, 0.12]], 0, 1.6, 0, 8), box(0.18, 0.1, 0.12, 0, 0, 0), rod([0, 0.05, 0.06], [0, 0.0, 0.6], 0.005)]]);
}
function flagRoof(): Part[] {
  const pole = union(lathe([[0, 0], [0.05, 0], [0.03, 4.6], [0, 4.6]], 0, 0, 0, 10), lathe([[0, 0], [0.05, 0.03], [0.04, 0.09], [0, 0.12]], 0, 4.6, 0, 8), box(0.3, 0.2, 0.3), rod([-0.12, 0.2, 0], [-0.03, 1.2, 0], 0.012), rod([0.12, 0.2, 0], [0.03, 1.2, 0], 0.012));
  return [{ mat: "paint-white", solid: pole }, ...flyFlag(FLAGS.REICH, 3.5, 1.0, 1.7, 0.04)];
}
function pigeonLoft(): Part[] {
  const wood = [box(1.6, 1.3, 1.1, 0, 0.35, 0), box(1.7, 0.04, 1.25, 0, 1.65, 0).rotate(-8, 0, 0).move(0, 0.2, 0), box(1.2, 0.03, 0.35, 0, 1.15, 0.72)];
  for (const [x, z] of [[-0.7, -0.45], [0.7, -0.45], [-0.7, 0.45], [0.7, 0.45]]) wood.push(post(0.04, 0.35, x, 0, z));
  const trap = union(...[-0.4, -0.2, 0, 0.2, 0.4].map((x) => post(0.006, 0.25, x, 1.18, 0.6)));
  return parts(["wood-grey", wood], ["paint-green", box(1.62, 0.3, 0.02, 0, 0.85, 0.56)], ["iron", trap]);
}

const P = (id: string, items: string[], size: V3, tris: number, f: () => Part[]) => prop({ id, items, size, place: "floor", where: "set", tris, parts: f });
P("chimney-2", ["chimney"], [1.0, 1.8, 0.65], 600, () => chimney(2));
P("chimney-4", ["chimney"], [1.75, 1.8, 0.65], 900, () => chimney(4));
P("chimney-cowl", ["chimney"], [0.5, 0.85, 0.5], 1500, cowl);
P("roof-ladder", ["roof-ladder"], [0.5, 0.25, 3.5], 3000, ladder);
P("roof-steps-35", ["roof-ladder"], [0.5, 0.3, 2.6], 2000, () => steps(35));
P("roof-steps-45", ["roof-ladder"], [0.5, 0.3, 2.6], 2000, () => steps(45));
P("snow-guard", ["snow-guard"], [2.0, 0.25, 0.3], 1500, snowGuard);
P("roof-hatch", ["roof-hatch"], [0.6, 0.2, 0.75], 600, () => hatch(false));
P("roof-hatch-open", ["roof-hatch"], [0.6, 0.7, 0.75], 800, () => hatch(true));
P("skylight", ["skylight"], [1.0, 0.2, 1.4], 600, skylight);
P("lightning-rod", ["lightning-rod"], [0.2, 1.72, 0.7], 600, lightningRod);
P("flagpole-roof", ["flag"], [0.3, 4.75, 1.9], 12000, flagRoof);
P("pigeon-loft", ["pigeon-loft"], [1.7, 1.8, 1.3], 1200, pigeonLoft);

export const KIT_ROOF = true;
