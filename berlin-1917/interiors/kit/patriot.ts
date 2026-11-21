// The war's patriotism in Berlin's streets, winter 1917-18:
//   flag-reich-hang, flag-prussia-hang  a house flag on a staff out of a window socket, 35 degrees up, the cloth
//                     hanging limp from it: the Empire's black-white-red, Prussia's black over white
//   flag-war          the Imperial war ensign of 1903-1919 (white, a black cross, the eagle on a white disc, the
//                     black-white-red canton with the Iron Cross), flying from a roof or barracks pole (roof.ts)
//   hindenburg-iron   the Iron Hindenburg: 12.5 m of alder (26 t on a 6 t iron frame) on the Königsplatz before the
//                     Victory Column, unveiled 4 September 1915, Georg Marschall's design, nailed by donors from a
//                     three-storey scaffold (gold nail 100 M, silver 5 M, iron 1 M); by 1918 nailed to the shoulders
//                     (ASSUMED: how far up; photographs of 1916 show the coat iron to the knees). Stylised: the coat
//                     falls to a broad hem, the hands rest on the sword's hilt, bareheaded
//   nail-cross        a war charity's nail board: the Iron Cross in nails on an oak board, the crown, W and 1914, under
//                     a little roof on two posts, a box for the coins
//   wehrschild        a round Wehrschild, 71 cm, its Iron Cross in nails, hung on a wall
//   eagle-prussia     the Prussian eagle, crowned, in relief: on a gate, a court or a post office
//   plinth-railed     a granite plinth for a statue, stepped, with an iron railing round it (the figure from the
//                     character SDK)
//   board-warloan     a hoarding for the war loan: ZEICHNET DIE KRIEGSANLEIHE over its posters' places
//   sign-gold         a shop's board: GOLDANKAUFSTELLE, where gold was bought in for iron
//   garland-victory   a victory day on a facade: a fir garland in two swags from three hooks, a black-white-red bow
//                     with tails at each hook, two paper flags crossed over the middle one (bells rang and flags went
//                     out for the war's victories; in winter 1917-18, Caporetto and the peace of Brest-Litovsk.
//                     ASSUMED: the garland's make, from photographs of 1914's victory days)
//   terrace-bismarck  the Bismarck National Monument's base before the Reichstag, 1901-1938: seven steps of red granite
//                     (three after its move in 1938), a rectangle with apses at front and back, 20 m wide and 12 m deep
//                     overall (de.wikipedia Bismarck-Nationaldenkmal; bildhauerei-in-berlin.de); its top 1.05 m up
//                     takes the scan assets/scan/bismarck-1900 (the drum and the figures' plinths are the scan's)
//   basin-bismarck    one of the two semicircular fountain basins that flanked it, its flat side to the monument,
//                     frozen; Cauer's sandstone Tritons and Naiads are lost and not drawn (size ASSUMED, 5 m radius)
import type { Solid } from "raea/3d";
import { crossSection } from "raea/3d";
import { ball, box, lathe, post, union, type V3 } from "./geo";
import type { MatId } from "./mats";
import { nails, rod, sign } from "./outgeo";
import { scanned } from "./outgeo";
import { prop } from "./prop";

type Part = { mat: MatId; solid: Solid; overlap?: boolean };
type P2 = [number, number];
const ccw = (p: P2[]): P2[] => { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; a += x0 * y1 - x1 * y0; } return a < 0 ? [...p].reverse() : p; };
const rect = (u0: number, v0: number, u1: number, v1: number): P2[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];

/** The Iron Cross's outline round (cx, cy), R to an arm's end. */
export function ironCross(cx: number, cy: number, R: number): P2[] {
  const c = 0.14 * R, w = 0.45 * R;
  return ([[c, c], [w, R], [-w, R], [-c, c], [-R, w], [-R, -w], [-c, -c], [-w, -R], [w, -R], [c, -c], [R, -w], [R, w]] as P2[]).map(([x, y]) => [cx + x, cy + y]);
}
/** The Prussian eagle's outline in a box 2 wide and 1.8 high round (cx, cy), scaled by s, its head to the left. */
export function eagle(cx: number, cy: number, s: number): P2[] {
  const p: P2[] = [[0.08, 0.45], [0.25, 0.55], [0.55, 0.75], [0.85, 0.9], [0.95, 0.8], [0.9, 0.55], [0.98, 0.45], [0.85, 0.3], [0.95, 0.18], [0.78, 0.08], [0.85, -0.05], [0.6, -0.05], [0.35, 0.05], [0.22, -0.2], [0.4, -0.45], [0.5, -0.55], [0.32, -0.5], [0.15, -0.35], [0.2, -0.75], [0.08, -0.65], [0, -0.85], [-0.08, -0.65], [-0.2, -0.75], [-0.15, -0.35], [-0.32, -0.5], [-0.5, -0.55], [-0.4, -0.45], [-0.22, -0.2], [-0.35, 0.05], [-0.6, -0.05], [-0.85, -0.05], [-0.78, 0.08], [-0.95, 0.18], [-0.85, 0.3], [-0.98, 0.45], [-0.9, 0.55], [-0.95, 0.8], [-0.85, 0.9], [-0.55, 0.75], [-0.25, 0.55], [-0.08, 0.45], [-0.12, 0.6], [-0.3, 0.68], [-0.2, 0.74], [-0.1, 0.8], [0.02, 0.8], [0.06, 0.7]];
  return p.map(([x, y]) => [cx + x * s, cy + y * s]);
}

// ── flags ────────────────────────────────────────────────────────────────────────────────────────────────────────
/** A flag's design: layers of polygons in (u, v), u along the fly from the hoist (0) to its end (1), v up the hoist,
 *  bottom 0 to top 1; a later layer stands proud of the one under it, through both faces. */
type Design = [MatId, P2[][]][];
const H3 = (top: MatId, mid: MatId, bot: MatId): Design => [[top, [rect(0, 2 / 3, 1, 1)]], [mid, [rect(0, 1 / 3, 1, 2 / 3)]], [bot, [rect(0, 0, 1, 1 / 3)]]];
const REICH = H3("flag-black", "flag-white", "flag-red");
const PRUSSIA: Design = [["flag-black", [rect(0, 0.5, 1, 1)]], ["flag-white", [rect(0, 0, 1, 0.5)]]];
/** The war ensign: field white, a black cross (its upright 0.37 of the fly from the hoist), a white disc and the
 *  eagle at the crossing, the canton black-white-red with the Iron Cross (aspect 3:5). */
function warEnsign(): Design {
  const X = 0.37, Y = 0.5, cw = 0.06, ch = 0.1, ar = 0.6; // u and v are not the same length: v spans 3, u 5
  const disc: P2[] = Array.from({ length: 20 }, (_, i): P2 => [X + 0.1 * ar * Math.cos((i / 20) * Math.PI * 2), Y + 0.1 * Math.sin((i / 20) * Math.PI * 2)]);
  const eg = eagle(0, 0, 1).map(([x, y]): P2 => [X + x * 0.075 * ar, Y + y * 0.075]);
  const cr = ironCross(0, 0, 1).map(([x, y]): P2 => [(X - cw) / 2 + x * 0.09 * ar, (1 + Y + ch) / 2 + y * 0.09]);
  const crW = ironCross(0, 0, 1).map(([x, y]): P2 => [(X - cw) / 2 + x * 0.105 * ar, (1 + Y + ch) / 2 + y * 0.105]);
  const cv0 = Y + ch / 2, cv = (1 - cv0) / 3;
  return [
    ["flag-white", [rect(0, 0, 1, 1)]],
    ["flag-black", [rect(X - cw / 2, 0, X + cw / 2, 1), rect(0, Y - ch / 2, 1, Y + ch / 2), rect(0, cv0 + 2 * cv, X - cw / 2, 1)]],
    ["flag-red", [rect(0, cv0, X - cw / 2, cv0 + cv)]],
    ["flag-white", [disc, crW]],
    ["flag-black", [eg, cr]],
  ];
}

/** The cloth built from a design, mapped by f from (u, v) to the world, t thick, layer k standing out k x 1.5 mm. */
function cloth(d: Design, f: (u: number, v: number) => V3, t = 0.004): Part[] {
  return d.map(([mat, polys], k) => {
    const s = union(...polys.map((p) => crossSection.polygon(ccw(p)).extrude(t + k * 0.003).move(0, 0, -(t + k * 0.003) / 2)));
    const solid = s.refineToLength(0.04).warp((u, v, w) => { const p = f(u, v), n: V3 = [1, 0, 0]; return [p[0] + n[0] * w, p[1] + n[1] * w, p[2] + n[2] * w]; });
    return { mat, solid, overlap: k > 0 };
  });
}
/** A house flag hanging from a staff that leaves the wall socket at the origin at 35 degrees up along +z. */
function hangFlag(d: Design, staff = 2.7, hoist = 1.1, fly = 1.8): Part[] {
  const th = (35 * Math.PI) / 180, dir: V3 = [0, Math.sin(th), Math.cos(th)], s1 = staff - 0.08, s0 = s1 - hoist / Math.cos(0);
  const at = (s: number): V3 => [0, dir[1] * s, dir[2] * s];
  // the cloth hangs from the staff: the hoist along it, the fly straight down, gathered in loose vertical folds
  const f = (u: number, v: number): V3 => { const p = at(s0 + v * (s1 - s0)); return [0.07 * Math.sin(v * 13 + u * 2) * (0.3 + u), p[1] - u * fly, p[2] + 0.04 * Math.sin(u * 5)]; };
  const iron: Solid[] = [box(0.12, 0.16, 0.02, 0, -0.08, 0.01), rod([0, 0, 0.02], [0, -0.06, 0.12], 0.02)];
  return [
    { mat: "wood-raw", solid: rod([0, 0, 0], at(staff), 0.02) }, { mat: "iron", solid: union(...iron, post(0.03, 0.05, ...at(staff))), overlap: true },
    ...cloth(d, f).map((p) => ({ ...p, overlap: true })),
  ];
}
/** A flag flying from a vertical pole: its hoist on the pole from y0, the fly to +z, waving gently. */
export function flyFlag(d: Design, y0: number, hoist: number, fly: number, x = 0): Part[] {
  const f = (u: number, v: number): V3 => [x + 0.12 * Math.sin(u * 7 + v * 0.8) * u, y0 + v * hoist - u * u * 0.25 * hoist, 0.05 + u * fly * (1 - 0.05 * Math.sin(v * 3))];
  return cloth(d, f).map((p) => ({ ...p, overlap: true }));
}
export const FLAGS = { REICH, PRUSSIA, WAR: warEnsign };

// ── the Iron Hindenburg ──────────────────────────────────────────────────────────────────────────────────────────
function hindenburg(): Part[] {
  const B = 1.6; // the pedestal's top, the figure's foot
  const coat = lathe([[0, 0], [1.55, 0], [1.5, 0.25], [1.32, 2.5], [1.12, 5.0], [1.04, 6.2], [1.12, 7.6], [1.18, 8.6], [1.0, 9.3], [0.55, 9.75], [0.32, 9.95], [0, 10.0]], 0, B, 0, 28).scale(1.15, 1, 0.8);
  // the arms from the shoulders down and in to the hands on the hilt before the belly
  const hilt: V3 = [0, B + 5.9, 1.35];
  const arms: Solid[] = [];
  for (const s of [-1, 1]) {
    const sh: V3 = [s * 1.2, B + 9.0, 0.05], el: V3 = [s * 1.15, B + 7.0, 0.7], hand: V3 = [s * 0.18, hilt[1] + 0.05, hilt[2]];
    arms.push(rod(sh, el, 0.38), rod(el, hand, 0.32), lathe([[0, 0], [0.3, 0.02], [0.32, 0.25], [0, 0.35]], ...hand, 10).scale(1, 0.8, 1).move(0, 0, 0));
  }
  const neck = post(0.42, 0.5, 0, B + 9.85, 0);
  const head = lathe([[0, 0], [0.5, 0.05], [0.58, 0.4], [0.6, 0.85], [0.52, 1.2], [0.3, 1.33], [0, 1.35]], 0, B + 10.25, 0.05, 20).scale(1.05, 1, 0.95);
  const face = union(box(0.7, 0.12, 0.2, 0, B + 10.6, 0.55), box(0.14, 0.24, 0.18, 0, B + 10.72, 0.58)); // the moustache, the nose
  const sword = union(box(0.12, hilt[1] - B, 0.06, 0, B, hilt[2] + 0.1), box(0.9, 0.12, 0.12, 0, hilt[1] - 0.12, hilt[2] + 0.1), post(0.06, 0.55, 0, hilt[1], hilt[2] + 0.1), lathe([[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.14]], 0, hilt[1] + 0.55, hilt[2] + 0.1, 10));
  // the scan (tools/scan.sh from the 1916 postcard, fitted to its 13 m) when it is there, else the lathe stand-in
  const body = scanned("assets/scan/hindenburg.obj"), bust = scanned("assets/scan/hindenburg-head.obj"), H = 13;
  // The whole figure's scan has a 70-pixel head, so its face melts; the head is a scan of its own (a bust restored
  // from the same postcard, 1.3 m from neck to crown as the postcard gives 1.35 m), set on the body cut at the neck.
  // Both scans face +x as Idol makes them; the body's head is centred 0.28 m forward of its axis.
  // the body is cut at the top of its shoulders so the bust brings its own collar and chin; its crown is at 12.7 m
  const CUT = 10.95;
  const scan = body && bust ? union(body.minus(box(8, 4, 8, 0, CUT, 0)), bust.move(0.16, CUT - 0.1, -0.04)) : body;
  const figure = scan ? scan.rotate(0, -90, 0).move(0, B, 0) : union(coat, ...arms, neck, head, face);
  // nailed so far: the coat iron to 8.4 m, gold and silver strewn in the band where the last donors reached
  const NAILED = scan ? B + 0.56 * H : B + 6.8, BOOTS = scan ? B + 0.08 * H : B;
  // the sword stands before the coat in the scan: keep it wood where it crosses the nailed band
  const blade = scan ? box(0.7, H, 1.6, 0, B, 2.2) : box(0.01, 0.01, 0.01, 0, -5, 0);
  const nailed = box(8, NAILED - BOOTS, 8, 0, BOOTS, 0).minus(blade);
  const iron = figure.intersect(nailed.minus(box(8, 0.45, 8, 0, NAILED - 0.45, 0))), wood = figure.minus(nailed);
  const band = figure.intersect(box(8, 0.45, 8, 0, NAILED - 0.45, 0).minus(blade)); // the last donors' silver, strewn among the iron
  // the pedestal and the scaffold: posts at a 6 m square, platforms at 3.4, 6.2 and 9 m, rails, a stair up the back
  const wood2: Solid[] = [box(4.2, B, 3.6, 0, 0, 0)];
  const sc: Solid[] = [], Hs = [B + 1.8, B + 4.6, B + 7.4], S = 3.0;
  for (const x of [-S, 0, S]) for (const z of [-S, S]) sc.push(post(0.07, B + 9.0, x, 0, z));
  sc.push(post(0.07, B + 9.0, -S, 0, 0), post(0.07, B + 9.0, S, 0, 0));
  for (const h of Hs) {
    for (const [a, b] of [[[-S, h, -S], [S, h, -S]], [[-S, h, S], [S, h, S]], [[-S, h, -S], [-S, h, S]], [[S, h, -S], [S, h, S]]] as [V3, V3][]) { sc.push(rod(a, b, 0.05), rod([a[0], a[1] + 1.0, a[2]], [b[0], b[1] + 1.0, b[2]], 0.035)); }
    // the walkway: boards round the figure, a ring 1.4 m wide inside the posts
    sc.push(box(2 * S, 0.06, 1.3, 0, h - 0.06, S - 0.65), box(2 * S, 0.06, 1.3, 0, h - 0.06, -S + 0.65), box(1.3, 0.06, 2 * S - 2.6, S - 0.65, h - 0.06, 0), box(1.3, 0.06, 2 * S - 2.6, -S + 0.65, h - 0.06, 0));
  }
  for (let i = 0; i < 4; i++) { const y0 = i === 0 ? 0 : Hs[i - 1], y1 = Hs[Math.min(i, 2)]; if (i < 3) sc.push(rod([S - 0.4, y0, -S + 0.6 + (i % 2) * 2.6], [S - 0.4, y1, -S + 0.6 + ((i + 1) % 2) * 2.6], 0.06)); }
  // the board at the front
  const board = box(3.0, 1.1, 0.06, 0, 0.35, S + 0.4), legs = union(post(0.06, 1.5, -1.3, 0, S + 0.4), post(0.06, 1.5, 1.3, 0, S + 0.4));
  const words = union(sign("DER EISERNE HINDENBURG VON BERLIN", 0.14, 0.006).move(0, 1.2, S + 0.44), sign("NAGELUNG TÄGLICH. AUCH IN DER KALTEN JAHRESZEIT", 0.08, 0.006).move(0, 0.92, S + 0.44), sign("BEI SCHÖNEM WETTER MILITÄRKONZERT", 0.08, 0.006).move(0, 0.7, S + 0.44));
  return [
    { mat: "nail-iron", solid: iron }, { mat: "alder", solid: wood, overlap: true }, ...(scan ? [] : [{ mat: "steel-bright" as MatId, solid: sword, overlap: true }]),
    { mat: "nail-silver", solid: band, overlap: true },
    { mat: "wood-raw", solid: union(...wood2, ...sc, legs), overlap: true }, { mat: "sign-white", solid: board, overlap: true }, { mat: "enamel-black", solid: words, overlap: true },
  ];
}

// ── nail boards, the eagle, plinth and boards ───────────────────────────────────────────────────────────────────
function nailCross(): Part[] {
  const W = 1.3, H = 1.5, Y = 1.0;
  const cr = ironCross(0, 0, 0.55), inside = (x: number, y: number) => { let c = false; for (let i = 0, j = cr.length - 1; i < cr.length; j = i++) { const [xi, yi] = cr[i], [xj, yj] = cr[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const field = nails(1.1, 1.1, 0.034, 0.008, inside, 0.3, 3)!;
  const outline = crossSection.polygon(ccw(ironCross(0, 0, 0.6))).extrude(0.01).minus(crossSection.polygon(ccw(ironCross(0, 0, 0.56))).extrude(0.012).move(0, 0, -0.001));
  const wood = [box(W, H, 0.05, 0, Y, 0), post(0.06, Y + H + 0.35, -W / 2 - 0.06, 0, 0), post(0.06, Y + H + 0.35, W / 2 + 0.06, 0, 0)];
  const roof = [box(W + 0.5, 0.04, 0.5, 0, 0, 0).rotate(30, 0, 0).move(0, Y + H + 0.3, 0.12), box(W + 0.5, 0.04, 0.5, 0, 0, 0).rotate(-30, 0, 0).move(0, Y + H + 0.3, -0.12)];
  const box2 = box(0.3, 0.3, 0.2, 0, 0.6, 0.12);
  // as on the 1914 cross itself: the crown on the top arm, W in the middle, 1914 on the bottom arm, in silver nails
  const crownPts: P2[] = [[-0.1, 0], [0.1, 0], [0.1, 0.08], [0.07, 0.06], [0.05, 0.11], [0.025, 0.07], [0, 0.12], [-0.025, 0.07], [-0.05, 0.11], [-0.07, 0.06], [-0.1, 0.08]];
  const crown = union(crossSection.polygon(ccw(crownPts)).extrude(0.008), box(0.012, 0.05, 0.008, 0, 0.12, 0.004), box(0.035, 0.012, 0.008, 0, 0.145, 0.004));
  const C = Y + H / 2;
  const words = union(sign("1914", 0.085, 0.008).move(0, C - 0.36, 0.028), sign("W", 0.13, 0.008).move(0, C, 0.028), crown.move(0, C + 0.27, 0.026));
  return [
    { mat: "wood-dark", solid: union(...wood, box2) }, { mat: "tram-roof", solid: union(...roof), overlap: true },
    { mat: "nail-iron", solid: field.move(0, Y + H / 2, 0.026), overlap: true }, { mat: "nail-silver", solid: union(outline.move(0, Y + H / 2, 0.025), words), overlap: true },
  ];
}
function wehrschild(): Part[] {
  const R = 0.355, cr = ironCross(0, 0, 0.26);
  const inside = (x: number, y: number) => { let c = false; for (let i = 0, j = cr.length - 1; i < cr.length; j = i++) { const [xi, yi] = cr[i], [xj, yj] = cr[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
  const ring = (x: number, y: number) => Math.hypot(x, y) > R - 0.04 && Math.hypot(x, y) < R - 0.015;
  const shield = lathe([[0, 0], [R, 0], [R, 0.02], [R - 0.02, 0.04], [0, 0.05]], 0, 0, 0, 32).rotate(90, 0, 0);
  return [
    { mat: "wood-dark", solid: shield.move(0, 1.6, 0) },
    { mat: "nail-iron", solid: nails(0.6, 0.6, 0.02, 0.006, inside, 0.3, 5)!.move(0, 1.6, 0.05), overlap: true },
    { mat: "nail-silver", solid: nails(0.72, 0.72, 0.022, 0.006, ring, 0.2, 9)!.move(0, 1.6, 0.05), overlap: true },
  ];
}
function eagleRelief(): Part[] {
  const s = crossSection.polygon(ccw(eagle(0, 0, 0.6))).extrude(0.06);
  const crown = union(box(0.14, 0.08, 0.06, -0.06, 0.5, 0), ...[-0.11, -0.06, -0.01].map((x) => post(0.012, 0.05, x, 0.58, 0.03)));
  return [{ mat: "bronze", solid: union(s, crown).move(0, 0, 0.005) }];
}
function plinth(): Part[] {
  const g = [box(3.0, 0.25, 3.0), box(2.6, 0.25, 2.6, 0, 0.25, 0), box(1.8, 1.7, 1.8, 0, 0.5, 0), box(2.1, 0.22, 2.1, 0, 2.2, 0)];
  const rail: Solid[] = [], S = 2.2;
  for (const [a, b] of [[[-S, -S], [S, -S]], [[S, -S], [S, S]], [[S, S], [-S, S]], [[-S, S], [-S, -S]]] as P2[][]) {
    for (const y of [0.15, 0.85]) rail.push(rod([a[0], y, a[1]], [b[0], y, b[1]], 0.015));
    for (let i = 0; i < 22; i++) { const f = i / 22, x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f; rail.push(post(0.009, 0.95, x, 0, z), lathe([[0, 0], [0.02, 0], [0, 0.07]], x, 0.95, z, 6)); }
  }
  return [{ mat: "granite", solid: union(...g) }, { mat: "iron", solid: union(...rail), overlap: true }];
}
function warLoan(): Part[] {
  const wood = [box(4.0, 2.6, 0.08, 0, 0.4, 0), post(0.07, 3.2, -1.9, 0, -0.06), post(0.07, 3.2, 1.9, 0, -0.06)];
  const papers = [-1.3, 0, 1.3].map((x) => box(1.1, 1.5, 0.005, x, 0.7, 0.042));
  return [{ mat: "wood-grey", solid: union(...wood) }, { mat: "paper-poster", solid: union(...papers), overlap: true }, { mat: "sign-white", solid: box(3.8, 0.42, 0.01, 0, 2.48, 0.045), overlap: true }, { mat: "enamel-black", solid: sign("ZEICHNET DIE KRIEGSANLEIHE", 0.22, 0.006).move(0, 2.69, 0.05), overlap: true }];
}
function goldSign(): Part[] {
  return [{ mat: "lacquer-black", solid: box(1.8, 0.4, 0.04, 0, 0, 0) }, { mat: "nail-gold", solid: sign("GOLDANKAUFSTELLE", 0.16, 0.006).move(0, 0.2, 0.04), overlap: true }];
}

const P = (id: string, items: string[], size: V3, place: "floor" | "wall", tris: number, f: () => Part[]) => prop({ id, items, size, place, where: "set", tris, parts: f });
P("flag-reich-hang", ["flag"], [0.2, 2.0, 2.3], "wall", 9000, () => hangFlag(REICH));
P("flag-prussia-hang", ["flag"], [0.2, 2.0, 2.3], "wall", 9000, () => hangFlag(PRUSSIA));
// 170k: the scanned body and head (assets/scan) in place of the stand-in; a hero piece seen from the Königsplatz
P("hindenburg-iron", ["monument"], [6.3, 13.5, 7.0], "floor", 180000, hindenburg);
P("nail-cross", ["nail-board"], [1.8, 3.0, 0.6], "floor", 40000, nailCross);
P("wehrschild", ["nail-board"], [0.72, 0.72, 0.07], "wall", 30000, wehrschild);
P("eagle-prussia", ["emblem"], [1.2, 1.1, 0.07], "wall", 1500, eagleRelief);
P("plinth-railed", ["monument"], [4.5, 2.5, 4.5], "floor", 12000, plinth);
P("board-warloan", ["poster-board"], [4.0, 3.2, 0.2], "floor", 4000, warLoan);
P("sign-gold", ["shop-sign"], [1.8, 0.4, 0.05], "wall", 4000, goldSign);

function bismarckTerrace(): Part[] {
  const top = crossSection.rect(16.4, 7.4).union(crossSection.circle(1.6).move(0, 2.5), crossSection.circle(1.6).move(0, -2.5));
  const steps: Solid[] = [];
  for (let k = 0; k < 7; k++) steps.push(top.offset(0.3 * (6 - k), { join: "round" }).extrude(0.15).rotate(-90, 0, 0).move(0, 0.15 * k, 0));
  return [{ mat: "granite-red", solid: union(...steps) }];
}
function bismarckBasin(): Part[] {
  const R = 5, half = crossSection.rect(2 * R + 2, R + 2, false).move(-(R + 1), 0);
  const outer = crossSection.circle(R).intersect(half), inner = crossSection.circle(R - 0.45).intersect(half.move(0, 0.45));
  const up = (s: Solid) => s.rotate(-90, 0, 0);
  const rim = union(up(outer.minus(inner).extrude(0.5)), up(outer.offset(0.06).minus(inner.offset(-0.06)).extrude(0.1)).move(0, 0.5, 0), up(outer.extrude(0.12)));
  // the fountain in the middle: a fluted stem and a shallow bowl, dry for the winter
  const c = -R / 2;
  const fountain = union(lathe([[0, 0], [0.45, 0], [0.45, 0.15], [0.28, 0.25], [0.22, 1.1], [0.35, 1.2], [0, 1.2]], 0, 0, c, 20), lathe([[0, 0], [0.25, 0], [1.1, 0.25], [1.15, 0.38], [1.05, 0.38], [0.2, 0.15], [0, 0.15]], 0, 1.2, c, 28), post(0.04, 0.35, 0, 1.35, c));
  return [{ mat: "sandstone", solid: union(rim, fountain) }, { mat: "ice-grey", solid: up(inner.extrude(0.03)).move(0, 0.32, 0), overlap: true }];
}
P("terrace-bismarck", ["monument"], [20.6, 1.05, 12.4], "floor", 12000, bismarckTerrace);
P("basin-bismarck", ["monument"], [10.1, 1.6, 5.1], "floor", 12000, bismarckBasin);

// ── the victory garland ──────────────────────────────────────────────────────────────────────────────────────────
/** A wall piece: the facade at z 0, three hooks along x at y 0, the swags hanging between them. */
function garland(): Part[] {
  const hooks = [-2, 0, 2], SAG = 0.45, by: Partial<Record<MatId, Solid[]>> = {};
  const add = (m: MatId, ...s: Solid[]) => (by[m] ??= []).push(...s);
  // the fir rope: tufts along each swag, turned this way and that
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i <= 26; i++) {
      const t = i / 26, x = hooks[k] + (hooks[k + 1] - hooks[k]) * t, y = -4 * SAG * t * (1 - t);
      const r = 0.065 + 0.014 * Math.sin(i * 2.3 + k);
      add("fir", ball(r).scale(1.5, 0.9, 1).rotate(0, 0, ((i * 37) % 60) - 30).move(x, y, 0.1 + 0.012 * Math.sin(i * 1.7)));
    }
  }
  // at each hook: the hook, a bow of the ribbon (three stripes across its width) and two tails hanging from it
  const stripes: [MatId, number][] = [["flag-black", -0.034], ["flag-white", 0], ["flag-red", 0.034]];
  for (const x of hooks) {
    add("iron", rod([x, 0.05, 0], [x, 0.05, 0.12], 0.006));
    for (const [m, d] of stripes) {
      for (const s of [-1, 1]) {
        add(m, box(0.034, 0.5, 0.004).rotate(0, 0, s * 8).move(x + s * 0.05 + d * Math.cos((s * 8 * Math.PI) / 180), -0.56, 0.16));
        add(m, lathe([[0.045, -0.017], [0.05, -0.017], [0.05, 0.017], [0.045, 0.017]], 0, 0, 0, 14).rotate(90, 0, 0).scale(1.6, 0.7, 1).move(x + s * 0.08, 0.04 + d, 0.16));
      }
    }
    add("flag-red", ball(0.03).move(x, 0.04, 0.17));
  }
  // two paper flags crossed over the middle hook, their sticks leaning out, the Empire's colours
  const flags: Part[] = [];
  for (const s of [-1, 1]) {
    const turn = (q: Solid) => q.rotate(0, s * 90, 0).rotate(0, 0, -s * 35).move(0, 0.1, 0.14);
    add("wood-raw", turn(rod([0, -0.25, 0], [0, 0.78, 0], 0.007)));
    for (const p of flyFlag(REICH, 0.45, 0.3, 0.45)) flags.push({ ...p, solid: turn(p.solid) });
  }
  const parts: Part[] = Object.entries(by).map(([m, s], i) => ({ mat: m as MatId, solid: union(...(s as Solid[])), overlap: i > 0 }));
  return [...parts, ...flags.map((p) => ({ ...p, overlap: true }))];
}
P("garland-victory", ["garland"], [4.2, 1.6, 0.4], "wall", 24000, garland);

export const KIT_PATRIOT = true;

/** A freestanding flagpole for a barracks yard or a ministry's court, the war ensign flying from it. */
prop({
  id: "flagpole-war", items: ["flag"], size: [0.3, 7.6, 2.4], place: "floor", where: "set", tris: 20000,
  parts: () => [
    { mat: "paint-white", solid: union(lathe([[0, 0], [0.09, 0], [0.04, 7.4], [0, 7.4]], 0, 0, 0, 12), lathe([[0, 0], [0.07, 0.06], [0.06, 0.14], [0, 0.18]], 0, 7.4, 0, 10), box(0.4, 0.5, 0.4)) },
    ...flyFlag(warEnsign(), 6.0, 1.3, 2.15, 0.06),
  ],
});
