// What a Berlin front carries by 1917-18, beyond the exteriors lane's walls, windows and doors:
//   balcony-180, balcony-240  a sandstone slab on three consoles with a cast-iron railing, 0.9 m out
//   window-box-100, -120      a wooden window box on two iron brackets, earth in it; the planting is the exteriors
//                             lane's (a separate part named plants, or none in winter)
//   awning-300                a shop's awning let down: canvas on iron arms, a scalloped valance
//   shutter-300, shutter-300-open  a shop window's roller-shutter box, the shutter down or rolled up
//   sign-bakery, sign-destille, sign-coal  a trade sign hung from a wrought-iron bracket
//   downpipe-3m, downpipe-head, downpipe-shoe  a zinc downpipe in 3 m lengths, its hopper head under the gutter, the
//                             shoe that turns it onto the pavement's gully
//   cellar-stair              a cellar shop's stair down from the pavement, granite treads, an iron railing round the
//                             opening (the pavement is cut by CELLAR_CUT)
//   coal-hatch, cellar-grate  the iron coal hatch in the pavement by the wall; a light well's grate before a cellar window
//   boot-scraper              the iron blade by a front door
//   wheel-guard-cone, wheel-guard-cone-worn, wheel-guard-dome  the Prellstein at each jamb of a carriage gateway:
//                             a granite cone knee-high, its flank scarred where hubs struck it; the worn one chipped
//                             and leaning, the dome a low old stone half sunk in the pavement (outdoor.ts wheel-guard)
//   wheel-guard-bow           the cast-iron Radabweiser: a quarter-circle bow from the pavement to the jamb, two bars
//                             and a web, bolted to the reveal (ASSUMED shape from the catalogue's "curved bars")
// The cones and the dome stand on their own axis (origin on the pavement there): set one 0.18 m out from each jamb's
// reveal and 0.12 m before the wall. The bow's origin is on the reveal's face at the pavement, the bow running along +x
// (into the gateway) and out over +z; the far jamb takes it turned 180 degrees about y.
// Wall pieces: origin on the wall's face (z 0, out to +z) at the height named (the balcony's floor, the sill, the
// pavement); pavement pieces: origin on the pavement at the wall's foot.
import type { Solid } from "raea/3d";
import { ball, box, folds, lathe, post, rodX, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { rod, sign } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
const parts = (...p: [MatId, Solid | Solid[]][]): Part[] => p.map(([mat, s], i) => ({ mat, solid: Array.isArray(s) ? union(...s) : s, overlap: i > 0 }));

/** A railing's run from a to b on the plane y 0: top and bottom rails, bars every 0.12 m, a ring band. */
function railing(a: [number, number], b: [number, number], h: number): Solid[] {
  const out: Solid[] = [rod([a[0], h, a[1]], [b[0], h, b[1]], 0.018), rod([a[0], 0.08, a[1]], [b[0], 0.08, b[1]], 0.012), rod([a[0], h - 0.25, a[1]], [b[0], h - 0.25, b[1]], 0.01)];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 0.12));
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ((b[0] - a[0]) * i) / n, z = a[1] + ((b[1] - a[1]) * i) / n;
    out.push(post(0.008, h - 0.08, x, 0.08, z));
    if (i < n && i % 2 === 0) { const xm = x + (b[0] - a[0]) / n / 2, zm = z + (b[1] - a[1]) / n / 2; out.push(lathe([[0.04, -0.007], [0.05, -0.007], [0.05, 0.007], [0.04, 0.007]], 0, 0, 0, 10).rotate(90, 0, (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI).move(xm, h - 0.17, zm)); }
  }
  return out;
}
function balcony(W: number): Part[] {
  const D = 0.9, slab = union(box(W, 0.14, D, 0, -0.14, D / 2), box(W + 0.04, 0.05, D + 0.02, 0, -0.17, D / 2 + 0.01));
  const consoles = [-W / 2 + 0.2, 0, W / 2 - 0.2].map((x) => union(box(0.18, 0.5, 0.2, x, -0.67, 0.1), box(0.18, 0.25, 0.45, x, -0.42, 0.22), box(0.2, 0.1, 0.65, x, -0.27, 0.32)));
  const rail = [...railing([-W / 2 + 0.03, 0.03], [-W / 2 + 0.03, D - 0.03], 1.0), ...railing([-W / 2 + 0.03, D - 0.03], [W / 2 - 0.03, D - 0.03], 1.0), ...railing([W / 2 - 0.03, D - 0.03], [W / 2 - 0.03, 0.03], 1.0)];
  return parts(["sandstone", [slab, ...consoles]], ["iron", rail]);
}
function windowBox(W: number): Part[] {
  const bx = box(W, 0.2, 0.22, 0, 0.02, 0.16).minus(box(W - 0.04, 0.2, 0.18, 0, 0.05, 0.16));
  const iron = [-W / 2 + 0.12, W / 2 - 0.12].flatMap((x) => [rod([x, -0.15, 0.01], [x, 0.0, 0.26], 0.01), box(0.03, 0.01, 0.27, x, 0.01, 0.135), box(0.04, 0.12, 0.01, x, -0.15, 0.005)]);
  return parts(["paint-green", bx], ["iron", iron], ["earth", box(W - 0.05, 0.02, 0.17, 0, 0.17, 0.16)]);
}
function awning(): Part[] {
  const W = 3.0, out = 1.7, top = 2.9, low = 2.25, L = Math.hypot(out, top - low), a = Math.atan2(top - low, out);
  const cloth = box(W, 0.008, L, 0, 0, 0).rotate((a * 180) / Math.PI, 0, 0).move(0, (top + low) / 2, out / 2);
  const val: Solid[] = [box(W, 0.22, 0.008, 0, low - 0.22, out)];
  for (let i = 0; i < 15; i++) val.push(lathe([[0, 0], [0.09, 0], [0.09, 0.008], [0, 0.008]], 0, 0, 0, 12).rotate(90, 0, 0).move(-W / 2 + 0.1 + i * 0.2, low - 0.22, out + 0.004).intersect(box(0.2, 0.1, 0.05, -W / 2 + 0.1 + i * 0.2, low - 0.32, out)));
  const iron = [box(W + 0.1, 0.12, 0.14, 0, top, 0.07), ...[-1, 1].map((s) => rod([s * (W / 2 - 0.05), top - 0.9, 0.02], [s * (W / 2 - 0.05), low, out], 0.014)), rodX(0.02, W, 0, low, out)];
  return parts(["canvas-field", [cloth, ...val]], ["iron", iron]);
}
function shutter(down: boolean): Part[] {
  const W = 3.0, top = 2.7, bot = 0.45;
  const boxx = box(W + 0.1, 0.32, 0.3, 0, top, 0.15);
  const p: Part[] = parts(["paint-brown", boxx], ["iron", [box(0.05, top - bot, 0.06, -W / 2, bot, 0.05), box(0.05, top - bot, 0.06, W / 2, bot, 0.05)]]);
  if (down) p.push({ mat: "iron", solid: folds(W, top - bot, 0.004, 2 * Math.PI / 0.06, 0.006).rotate(0, 0, 0).move(0, bot, 0.06), overlap: true }, { mat: "iron", solid: box(W, 0.06, 0.05, 0, bot - 0.02, 0.06), overlap: true });
  return p;
}
function tradeSign(word: string, board: MatId): Part[] {
  const iron: Solid[] = [box(0.08, 0.5, 0.02, 0, 3.0, 0.01), rod([0, 3.45, 0.02], [0, 3.45, 0.95], 0.014), rod([0, 3.05, 0.02], [0, 3.42, 0.6], 0.01)];
  for (let i = 0; i <= 10; i++) { const t = (i / 10) * Math.PI * 1.6; iron.push(rod([0, 3.3 + 0.07 * Math.sin(t), 0.35 + 0.07 * Math.cos(t)], [0, 3.3 + 0.07 * Math.sin(t + 0.5), 0.35 + 0.07 * Math.cos(t + 0.5)], 0.006)); }
  iron.push(rod([0, 3.45, 0.45], [0, 3.32, 0.45], 0.006), rod([0, 3.45, 0.9], [0, 3.32, 0.9], 0.006));
  const b = box(0.04, 0.42, 0.62, 0, 2.9, 0.675);
  const t1 = sign(word, 0.075, 0.004).rotate(0, 90, 0).move(0.022, 3.11, 0.675), t2 = sign(word, 0.075, 0.004).rotate(0, -90, 0).move(-0.022, 3.11, 0.675);
  return parts(["iron", iron], [board, b], ["sign-white", union(t1, t2)]);
}
function downpipe(): Part[] {
  return parts(["zinc", [post(0.05, 3.0, 0, 0, 0.09), ...[0.4, 2.4].flatMap((y) => [lathe([[0.05, -0.015], [0.058, -0.015], [0.058, 0.015], [0.05, 0.015]], 0, y, 0.09, 12), box(0.02, 0.02, 0.06, 0, y - 0.01, 0.02)])]]);
}
function downpipeHead(): Part[] {
  const head = box(0.3, 0.32, 0.22, 0, 0, 0.11).minus(box(0.26, 0.32, 0.18, 0, 0.04, 0.11));
  return parts(["zinc", [head, lathe([[0.05, -0.3], [0.058, -0.3], [0.058, 0], [0.05, 0]], 0, 0, 0.09, 12), box(0.34, 0.03, 0.26, 0, 0.32, 0.11)]]);
}
function downpipeShoe(): Part[] {
  return parts(["zinc", [post(0.05, 0.45, 0, 0.15, 0.09), rod([0, 0.18, 0.09], [0, 0.04, 0.32], 0.05)]], ["iron-rust", box(0.3, 0.02, 0.3, 0, 0, 0.35)]);
}
/** The cellar stair's hole in the pavement, for the world lane's cut: x across, out from the wall along z. */
export const CELLAR_CUT = { w: 1.2, out: 1.8, depth: 1.7 };
function cellarStair(): Part[] {
  const { w, out, depth } = CELLAR_CUT, n = 8, stone: Solid[] = [];
  // the treads fall toward the wall, the shop's door under the front at the bottom
  for (let i = 0; i < n; i++) { const y = -((i + 1) / n) * depth, z = out - (i + 0.5) * (out / n); stone.push(box(w, 0.06, out / n + 0.03, 0, y, z), box(w, -y, 0.03, 0, y, z + out / n / 2)); }
  for (const s of [-1, 1]) stone.push(box(0.12, depth + 0.02, out, s * (w / 2 + 0.06), -depth, out / 2)); // the cheek walls
  stone.push(box(w + 0.24, 0.1, 0.12, 0, -0.08, out + 0.06));
  const rail = [...railing([-w / 2 - 0.05, 0.05], [-w / 2 - 0.05, out + 0.05], 0.95), ...railing([w / 2 + 0.05, 0.05], [w / 2 + 0.05, out + 0.05], 0.95)];
  return parts(["granite", stone], ["iron", rail]);
}
const coalHatch = (): Part[] => parts(["iron", [box(0.62, 0.02, 0.62, 0, -0.005, 0.4), ...[-0.2, 0, 0.2].map((x) => box(0.6, 0.006, 0.02, 0, 0.012, 0.4 + x)), lathe([[0.03, -0.005], [0.04, -0.005], [0.04, 0.005], [0.03, 0.005]], 0, 0.018, 0.55, 10)]]);
function cellarGrate(): Part[] {
  const bars: Solid[] = [box(1.0, 0.03, 0.04, 0, -0.01, 0.02), box(1.0, 0.03, 0.04, 0, -0.01, 0.42), box(0.04, 0.03, 0.44, -0.5, -0.01, 0.22), box(0.04, 0.03, 0.44, 0.5, -0.01, 0.22)];
  for (let i = 1; i < 12; i++) bars.push(box(0.012, 0.03, 0.4, -0.5 + i * (1 / 12), -0.01, 0.22));
  return parts(["iron", bars], ["glass-dark", box(0.98, 0.01, 0.38, 0, -0.5, 0.22)]);
}
const bootScraper = (): Part[] => parts(["iron", [box(0.3, 0.05, 0.004, 0, 0.08, 0.12), ...[-1, 1].map((s) => lathe([[0, 0], [0.03, 0], [0.025, 0.14], [0.04, 0.17], [0, 0.2]], s * 0.17, 0, 0.12, 8)), box(0.4, 0.02, 0.12, 0, 0, 0.12)]]);

/** A Prellstein: a granite cone of radius r0 at the pavement to a domed top r1 at h, scarred by hubs at 0.35-0.5 m on
 *  the side toward the gateway (+x); `worn` chips a corner off its top and leans it 4 degrees. */
function wheelCone(r0: number, r1: number, h: number, worn: boolean): Part[] {
  const prof: [number, number][] = [[0, -0.15], [r0 + 0.01, -0.15], [r0, 0], [r1 + 0.01, h - r1 * 0.6]];
  for (let i = 1; i <= 6; i++) { const a = (i / 6) * (Math.PI / 2); prof.push([(r1 + 0.01) * Math.cos(a), h - r1 * 0.6 + r1 * 0.8 * Math.sin(a)]); }
  let s: Solid = lathe(prof, 0, 0, 0, 14);
  // the hubs' rub: one long shallow band worn into its flank at hub height, on the gateway's side
  { const y = 0.42, r = r0 + (r1 - r0) * (y / h); s = s.minus(ball(0.1).scale(0.25, 0.35, 2.6).move(r + 0.012, y, 0)); }
  if (worn) s = s.minus(ball(0.12).scale(1, 0.6, 1).move(r1 * 0.95, h + 0.04, r1 * 0.45)).rotate(0, 0, -4);
  return parts(["granite", s]);
}
function wheelDome(): Part[] {
  const prof: [number, number][] = [[0, -0.2], [0.3, -0.2]];
  for (let i = 0; i <= 7; i++) { const a = (i / 7) * (Math.PI / 2); prof.push([0.3 * Math.cos(a), 0.28 * Math.sin(a)]); }
  return parts(["granite", lathe(prof, 0, 0, 0, 14).minus(box(0.16, 0.08, 0.12, 0.24, 0.12, 0).rotate(0, 0, 25))]);
}
/** The cast-iron bow: two quarter-circle bars of radius 0.55 and 0.45 from the pavement out at +z up to the reveal at
 *  0.55 m, joined by a web, on a foot plate and a wall plate. */
function wheelBow(): Part[] {
  const bars: Solid[] = [];
  for (const [R, x] of [[0.55, 0.0], [0.45, 0.06]] as [number, number][]) {
    let prev: V3 | null = null;
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2), p: V3 = [x, R * Math.sin(a), R * Math.cos(a) * 0.8];
      if (prev) bars.push(rod(prev, p, 0.022));
      prev = p;
    }
  }
  for (let i = 1; i < 8; i += 2) { const a = (i / 8) * (Math.PI / 2); bars.push(rod([0, 0.55 * Math.sin(a), 0.44 * Math.cos(a)], [0.06, 0.45 * Math.sin(a), 0.36 * Math.cos(a)], 0.012)); }
  bars.push(box(0.16, 0.025, 0.2, 0.03, 0, 0.4), box(0.14, 0.2, 0.02, 0.03, 0.4, 0.01));
  return parts(["iron", bars]);
}

const P = (id: string, items: string[], size: V3, place: "floor" | "wall", tris: number, f: () => Part[]) => prop({ id, items, size, place, where: "set", tris, parts: f });
P("balcony-180", ["balcony"], [1.85, 1.75, 0.92], "wall", 12000, () => balcony(1.8));
P("balcony-240", ["balcony"], [2.45, 1.75, 0.92], "wall", 14000, () => balcony(2.4));
P("window-box-100", ["window-box"], [1.0, 0.4, 0.3], "wall", 800, () => windowBox(1.0));
P("window-box-120", ["window-box"], [1.2, 0.4, 0.3], "wall", 800, () => windowBox(1.2));
P("awning-300", ["awning"], [3.1, 3.0, 1.75], "wall", 3000, awning);
P("shutter-300", ["shutter"], [3.1, 3.0, 0.32], "wall", 4000, () => shutter(true));
P("shutter-300-open", ["shutter"], [3.1, 3.0, 0.32], "wall", 400, () => shutter(false));
P("sign-bakery", ["shop-sign"], [0.1, 0.6, 1.0], "wall", 4000, () => tradeSign("BÄCKEREI", "paint-brown"));
P("sign-destille", ["shop-sign"], [0.1, 0.6, 1.0], "wall", 4000, () => tradeSign("DESTILLATION", "paint-green"));
P("sign-coal", ["shop-sign"], [0.1, 0.6, 1.0], "wall", 4000, () => tradeSign("KOHLEN", "lacquer-black"));
P("downpipe-3m", ["downpipe"], [0.12, 3.0, 0.15], "wall", 600, downpipe);
P("downpipe-head", ["downpipe"], [0.34, 0.35, 0.26], "wall", 400, downpipeHead);
P("downpipe-shoe", ["downpipe"], [0.3, 0.6, 0.5], "wall", 400, downpipeShoe);
P("cellar-stair", ["cellar-stair"], [1.5, 2.7, 1.9], "floor", 6000, cellarStair);
P("coal-hatch", ["coal-hatch"], [0.62, 0.03, 0.62], "floor", 300, coalHatch);
P("cellar-grate", ["cellar-grate"], [1.0, 0.5, 0.44], "floor", 600, cellarGrate);
P("boot-scraper", ["boot-scraper"], [0.4, 0.2, 0.12], "floor", 400, bootScraper);
P("wheel-guard-cone", ["wheel-guard"], [0.46, 0.85, 0.46], "floor", 1500, () => wheelCone(0.2, 0.1, 0.7, false));
P("wheel-guard-cone-worn", ["wheel-guard"], [0.5, 0.8, 0.5], "floor", 1800, () => wheelCone(0.22, 0.12, 0.62, true));
P("wheel-guard-dome", ["wheel-guard"], [0.62, 0.5, 0.62], "floor", 1000, wheelDome);
P("wheel-guard-bow", ["wheel-guard"], [0.2, 0.6, 0.55], "floor", 3000, wheelBow);

export const KIT_FRONT = true;
