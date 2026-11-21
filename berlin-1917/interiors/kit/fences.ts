// Front gardens and their railings (catalogue front-garden-railing). Hobrecht's plan gave many of Berlin's newer
// streets front gardens (Vorgärten) between the pavement and the house line, fenced along the pavement: cast or
// wrought iron on a granite plinth, square posts with finials, a gate to the door's path. Two patterns for variety:
//   railing-garden-250         a 2.5 m run: a granite plinth 0.35 m high, spear-headed bars between two rails, a post
//                              with a ball finial at its left end (runs tile: the next run's post closes this one)
//   railing-garden-250-ring    the later pattern: flat bars with a band of rings under the top rail, a pine-cone post
//   railing-garden-250-worn    the first, neglected: rust through the paint, a bar bent, one missing
//   railing-garden-post        the closing post, for the end of a line of runs
//   railing-garden-gate        the gate to the path: two heavy posts with urn finials, two leaves 0.65 m each under an
//                              arched top rail, the latch; -open has the right leaf swung in 70 degrees
//   railing-garden-pier        a whitewashed brick pier with a granite cap and a ball, for the richer streets' corners
// Heights ASSUMED (railing 1.1 m over a 0.35 m plinth) from photographs of Wilmersdorf and Schöneberg streets.
// Frame: the run along x centred on the origin, its foot on the pavement, the street side +z.
import type { Solid } from "raea/3d";
import { ball, box, lathe, post, union } from "./geo";
import type { MatId } from "./mats";
import { rod } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const PL = 0.35, RH = 1.1; // the plinth's height, the railing's over it

const spear = (x: number, y: number, z: number) => lathe([[0, 0], [0.014, 0], [0.026, 0.035], [0, 0.11]], x, y, z, 6);
/** A square post at x from the pavement through the plinth to its finial: "ball", "cone" (a pine cone) or "urn". */
function ironPost(x: number, top: number, kind: "ball" | "cone" | "urn", w = 0.07): Solid[] {
  const s: Solid[] = [box(w, top, w, x, 0, 0), box(w + 0.03, 0.03, w + 0.03, x, top, 0)];
  if (kind === "ball") s.push(ball(w * 0.7).move(x, top + 0.03 + w * 0.65, 0));
  if (kind === "cone") s.push(lathe([[0, 0], [w * 0.55, 0.02], [w * 0.7, 0.07], [w * 0.55, 0.15], [0, 0.2]], x, top + 0.03, 0, 8));
  if (kind === "urn") s.push(lathe([[0, 0], [0.05, 0], [0.04, 0.03], [0.09, 0.1], [0.07, 0.17], [0.03, 0.2], [0.04, 0.24], [0, 0.27]], x, top + 0.03, 0, 10));
  return s;
}
function plinth(len: number): Solid {
  return union(box(len, PL, 0.3, 0, 0, 0), box(len, 0.04, 0.34, 0, PL - 0.04, 0));
}

function run(kind: "spear" | "ring", worn: boolean): Part[] {
  const LEN = 2.5, iron: Solid[] = [], rust: Solid[] = [];
  const y0 = PL, y1 = PL + RH - 0.14;
  iron.push(...ironPost(-LEN / 2 + 0.05, PL + RH, kind === "spear" ? "ball" : "cone"));
  iron.push(box(LEN - 0.1, 0.03, 0.02, 0.05, y0 + 0.08, 0), box(LEN - 0.1, 0.03, 0.02, 0.05, y1, 0));
  const n = 19;
  for (let i = 0; i < n; i++) {
    const x = -LEN / 2 + 0.17 + i * ((LEN - 0.24) / (n - 1));
    if (worn && i === 11) continue; // a bar gone
    if (kind === "spear") {
      const bent = worn && i === 6;
      const bar = bent ? union(rod([x, y0, 0], [x, y0 + 0.55, 0], 0.009), rod([x, y0 + 0.55, 0], [x + 0.05, y1 + 0.12, 0.09], 0.009)) : post(0.009, RH - 0.02, x, y0, 0);
      (worn && i % 4 === 1 ? rust : iron).push(bar, bent ? spear(x + 0.05, y1 + 0.12, 0.09).rotate(0, 0, 0) : spear(x, y0 + RH - 0.02, 0));
    } else {
      iron.push(box(0.016, RH - 0.18, 0.008, x, y0, 0));
    }
  }
  if (kind === "ring") {
    // the band of rings between the top rail and a second rail under it, and the dog bars at the foot
    iron.push(box(LEN - 0.1, 0.02, 0.016, 0.05, y1 - 0.14, 0));
    for (let i = 0; i < 18; i++) { const x = -LEN / 2 + 0.2 + i * 0.13; iron.push(lathe([[0.052, -0.004], [0.06, -0.004], [0.06, 0.004], [0.052, 0.004]], 0, 0, 0, 14).rotate(90, 0, 0).move(x, y1 - 0.07, 0)); }
    for (let i = 0; i < 37; i++) iron.push(box(0.008, 0.16, 0.008, -LEN / 2 + 0.12 + i * 0.065, y0 + 0.11, 0));
    iron.push(box(LEN - 0.1, 0.02, 0.016, 0.05, y0 + RH - 0.06, 0));
  }
  const paint: MatId = worn ? "iron-rust" : "iron-cast";
  const parts: Part[] = [{ mat: "granite", solid: plinth(LEN) }, { mat: paint, solid: union(...iron), overlap: true }];
  if (rust.length) parts.push({ mat: "iron-rust", solid: union(...rust), overlap: true });
  return parts;
}

function gate(open: boolean): Part[] {
  const W = 1.3, iron: Solid[] = [];
  iron.push(...ironPost(-W / 2 - 0.06, PL + RH + 0.15, "urn", 0.11), ...ironPost(W / 2 + 0.06, PL + RH + 0.15, "urn", 0.11));
  // the leaves: a frame, spear bars rising to the arch over the middle, the latch where they meet
  const leaf = (side: -1 | 1): Solid => {
    const s: Solid[] = [], x0 = side * 0.01, x1 = side * (W / 2 - 0.01);
    const xm = (x0 + x1) / 2, lw = Math.abs(x1 - x0);
    s.push(box(lw, 0.035, 0.025, xm, 0.06, 0), box(lw, 0.03, 0.025, xm, 0.55, 0));
    for (const x of [x0, x1]) s.push(box(0.03, RH + PL - 0.06, 0.025, x, 0.06, 0));
    const arch = (x: number) => PL + RH - 0.05 + 0.18 * Math.cos(((x / (W / 2)) * Math.PI) / 2);
    for (let i = 0; i <= 8; i++) { const xa = x0 + ((x1 - x0) * i) / 8, xb = x0 + ((x1 - x0) * (i + 1)) / 8; if (i < 8) s.push(rod([xa, arch(xa), 0], [xb, arch(xb), 0], 0.014)); }
    for (let i = 1; i < 6; i++) { const x = x0 + ((x1 - x0) * i) / 6; s.push(post(0.009, arch(x) - 0.06, x, 0.06, 0), spear(x, arch(x), 0)); }
    if (side === 1) s.push(box(0.12, 0.05, 0.05, 0.04, 0.95, 0.02), box(0.03, 0.03, 0.06, 0.1, 0.95, 0.06));
    return union(...s);
  };
  const right = leaf(1);
  iron.push(leaf(-1), open ? right.move(-W / 2, 0, 0).rotate(0, -70, 0).move(W / 2, 0, 0) : right);
  return [{ mat: "granite", solid: union(box(W + 0.5, 0.06, 0.4, 0, 0, 0)) }, { mat: "iron-cast", solid: union(...iron), overlap: true }];
}

function pier(): Part[] {
  return [
    { mat: "brick-wash", solid: union(box(0.5, 1.55, 0.5, 0, 0.2, 0)) },
    { mat: "granite", solid: union(box(0.58, 0.2, 0.58, 0, 0, 0), box(0.6, 0.1, 0.6, 0, 1.75, 0), box(0.5, 0.06, 0.5, 0, 1.85, 0), ball(0.16).move(0, 2.06, 0)), overlap: true },
  ];
}

const P = (id: string, size: [number, number, number], tris: number, f: () => Part[]) => prop({ id, items: ["front-garden-railing"], size, place: "floor", where: "set", tris, parts: f });
P("railing-garden-250", [2.6, 1.6, 0.35], 6000, () => run("spear", false));
P("railing-garden-250-ring", [2.6, 1.6, 0.35], 9000, () => run("ring", false));
P("railing-garden-250-worn", [2.6, 1.6, 0.4], 6000, () => run("spear", true));
P("railing-garden-post", [0.12, 1.6, 0.12], 600, () => [{ mat: "iron-cast", solid: union(...ironPost(0, PL + RH, "ball")) }]);
P("railing-garden-gate", [1.7, 1.8, 0.4], 7000, () => gate(false));
P("railing-garden-gate-open", [1.7, 1.8, 0.9], 7000, () => gate(true));
P("railing-garden-pier", [0.6, 2.25, 0.6], 1500, pier);

export const KIT_FENCES = true;
