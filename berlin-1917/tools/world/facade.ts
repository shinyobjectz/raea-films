// The facade and roof grammar for Berlin's Wilhelmine Mietshaus (1870-1914), from a footprint (SOP §5, §8).
//
// A building is its footprint ring (counter-clockwise, metres, EPSG:25833) and what lies in front of each edge:
//   front  a street or square: the full grammar (plinth, shopfronts or a rusticated ground floor, the Beletage's
//          pediments and balconies, string courses, the main cornice on consoles, a mansard with dormers)
//   court  a courtyard: plain plaster, plain windows, the wall carried up to the roof's top (the "Berliner Dach")
//   party  another building: a fire wall (brick or plastered), visible where the neighbour is lower
//   other  open ground, water, rail: a front without shops
// Everything is seeded from the building's id, so a building is the same in every bake and every LOD.
//
// Output is triangles into three builders per level of detail: facade (every opaque surface, its kind coded in the
// vertex colour's alpha: SURF below, read by world/shaders/facade.wesl), glass (every pane: its rgb are the room
// behind it as seeds for the interior shader, its uv the pane's own 0..1) and nothing else, so a tile draws in few
// calls. uv on facade surfaces is (metres along the facade, metres above the building's base): the shader's frame.
import { Builder } from "./glb";
import { layoutSign, type FontAtlas } from "../../interiors/signs/layout";
import type { Sign } from "../../interiors/signs/text";
import { type Pt, type Ring, P, N, hash, insetEdges, area2, triangulate } from "./geom";

/** Facade surface kinds, in the vertex colour's alpha (the shader reads round(a * 255 / 20)). */
export const SURF = { plaster: 10, rustic: 30, trim: 50, brick: 70, frame: 90, iron: 110, slate: 130, flat: 150, wood: 170, far: 190, sign: 210, zinc: 230 } as const;
/** Glass kinds, in the glass vertex colour's alpha. */
export const GLASS = { room: 20, shop: 60, stair: 100, cellar: 140, dormer: 180, door: 220 } as const;

export type EdgeKind = "front" | "court" | "party" | "other";
export type Lod = 0 | 1 | 2;
export type Out = { facade: Builder; glass: Builder; rooms?: Builder; signs?: Builder };
/** Each tile's glass builder to its rooms builder: the panes with a room behind them (front and court windows, dormers)
 *  go to their own material, "rooms", which raea-fb's windowTileWgsl draws (interiors/draw/window.ts); the rest
 *  (shops, stairs, cellars, doors) stay on "glass" and the world's GLASS shader. */
export const ROOMS = new WeakMap<Builder, Builder>();
const roomsOf = (G: Builder) => ROOMS.get(G) ?? G;
/** A room pane's vertex colour, as windowTileWgsl reads it: r = the room atlas layer (0-16 now, rooms 0-9 here and
 *  raea-fb's shops 10-23 from tools/interiors/windows.ts through ASSIGN, interiors/rooms-array.png),
 *  g and b = the hours the room is lit, from and to, over 24; a = the glass kind (GLASS). Winter 1917: dark by 16:00,
 *  coal and gas short and rationed, lights out early; one room in seven stays dark (a flat shut, its men at the front). */
export function paneColor(sd: number, kind: number): number[] {
  const fr = (x: number) => x - Math.floor(x);
  const atlas = Math.floor(fr(sd * 251.7) * 10), dark = fr(sd * 7919.3) < 1 / 7;
  const from = dark ? 0 : 15.5 + 2.5 * fr(sd * 104729.1), to = dark ? 0 : Math.max(from + 1.5, 19.5 + 3 * fr(sd * 1299709.7));
  return [atlas, Math.round((from / 24) * 255), Math.round((to / 24) * 255), kind];
}
/** A shop pane's colour with no assignment: one of raea-fb's main-street shops (atlas 10-16), lit from dusk
 *  (15:30-16:15) to closing (18:30-19:30), one in seven dark, shut for want of goods. */
function shopColor(sd: number): number[] {
  const fr = (x: number) => x - Math.floor(x);
  const atlas = 10 + Math.floor(fr(sd * 997.3) * 7), dark = fr(sd * 7907.1) < 1 / 7;
  const from = dark ? 0 : 15.5 + 0.75 * fr(sd * 104723.7), to = dark ? 0 : 18.5 + fr(sd * 1299721.3);
  return [atlas, Math.round((from / 24) * 255), Math.round((to / 24) * 255), GLASS.shop];
}
/** raea-fb's window assignments for the tile being baked (tools/interiors/windows.ts writes
 *  assets/interiors/windows/<tile>.json: pane id to { recipe: atlas layer, lit: [from, to] hours }). The bake sets
 *  `panes` per tile. They key by the finest level's pane ids, which LOD0 and LOD1 share; LOD2 is built from a
 *  simplified footprint whose edges are numbered differently, so it keeps the hash. */
export const ASSIGN = { panes: new Map<string, { recipe: number; lit: [number, number]; sign?: [number, number, number] }>() };
/** raea-fb's shop signs, set by the bake from assets/signs/signs.json and font.json. A shop pane's assignment names
 *  its bay's part of its shop's sign (`sign: [index, part, parts]`: the firm over the first bay, its trade over the
 *  next; signs[index] is already that part), lettered on the fascia from the font atlas (interiors/signs/layout.ts). */
export const SIGNS: { list: Sign[]; font: FontAtlas | null } = { list: [], font: null };
/** Each tile's facade builder to its sign builder, "signs": one glyph quad a letter, 1.5 mm proud of the fascia, uv in
 *  the font atlas, colour = the ink's linear rgb with alpha 0 for gold leaf and 255 for paint (City's SIGNS_WGSL
 *  alpha-tests it). Only LOD0 letters its fascias; LOD1 keeps the sign's ground colour so the board doesn't change. */
export const GLYPHS = new WeakMap<Builder, Builder>();
/** The department stores' street fronts (raea-fb's DEPT_FRONTS in tools/interiors/windows.ts: Wertheim, Leipziger
 *  Straße 126-137; Tietz, 46-50a), as the edges `${key}-e${i}` whose panes raea-fb gives a store's rooms. The bake
 *  sets it per tile from the assignments: an edge's index is stable while its footprint is, so the mark carries
 *  across the store front's change of bays (bake, windows.ts on the new panes, bake again). */
export const STORE = { edges: new Set<string>(), keys: new Set<string>() };
/** A department store's storeys, floor to floor: ASSUMED (no measured section read yet), tall sales floors as the
 *  stores were built, a ground floor's hall over a mezzanine-free 5.6 m; raea-fb's hall and sales-floor rooms match. */
export const STORE_STOREY = { ground: 5.6, upper: 4.6 };
/** raea-fb's assignment for a pane of this tile's building and edge, if there is one (none at LOD2). */
function assignment(floor: number, bay: number, lod: Lod) {
  return lod === 2 ? undefined : ASSIGN.panes.get(`b${REC.key}-e${REC.edge}-f${floor}-k${bay}`);
}
function assigned(kind: number, floor: number, bay: number, lod: Lod, fallback: number[]): number[] {
  if (lod === 2) return fallback;
  const a = ASSIGN.panes.get(`b${REC.key}-e${REC.edge}-f${floor}-k${bay}`);
  if (!a) return fallback;
  return [a.recipe, Math.round((a.lit[0] / 24) * 255), Math.round((a.lit[1] / 24) * 255), kind];
}
export type Building = {
  /** the map's stable footprint key (map/1917/buildings.geojson `key`) */
  key: string;
  id: number;
  ring: Ring; // CCW
  kinds: EdgeKind[]; // per edge i (ring[i] -> ring[i+1])
  shops: boolean[]; // per edge: a shopping street in front
  base: number; // ground height under the building, metres NHN (walls start 0.4 below)
  storeys: number;
  pub: boolean;
  /** the plan's commercial private buildings (Straube's hatched grey: hotels, banks, theatres, arcades, business
   *  houses): a stone front, wide bays, big windows, tall storeys */
  com: boolean;
  richness: number; // 0..1, from the street's width: main avenues are richer
  /** the standing height at a map point (bake.ts stand(): the ground plus its sidewalk), so a door or a shopfront
   *  starts at the pavement in front of it wherever the street slopes along the house */
  ground?: (x: number, y: number) => number;
  /** the lowest ground under the house (m NHN), where it is under the base (a house on the river's bank, or across a
   *  slope): a plain socle carries every wall down to 0.4 m under it */
  foot?: number;
};

// ---------- colour ----------
const lin = (hex: string): [number, number, number] => {
  const c = (i: number) => {
    const s = parseInt(hex.slice(i, i + 2), 16) / 255;
    return Math.round((s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4) * 255);
  };
  return [c(1), c(3), c(5)];
};
const PLASTERS = ["#b5a78f", "#a39886", "#c0b398", "#9b9388", "#ae9e86", "#a68e78", "#8e8981", "#c4baa8", "#b8a283", "#9fa09a"].map(lin);
const FRAMES = ["#4a3426", "#cfc8b8", "#3a2a20", "#d8d2c4", "#33453a", "#5a2a22"].map(lin);
const SHOPS = ["#25362b", "#4a1f1c", "#1e1e1c", "#3b2a1e", "#2a3242", "#5b4a2a"].map(lin);
const BRICKS = ["#8a5a44", "#9a7a5c", "#7a4a3a", "#a08868"].map(lin);
const SLATES = ["#3c4048", "#45474c", "#38393c"].map(lin);
type C = [number, number, number];
const shadeC = (c: C, k: number): C => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];

// ---------- the facade's local frame ----------
// u along the edge from its start, v up from the base, w out of the wall. A face is given in (u, v, w).
type Frame = { a: Pt; t: Pt; o: Pt; z0: number; u0: number };

/** What a bake keeps from the finest level for the other lanes: every pane (interiors/: a room behind it) and every
 *  door (people/: where schedules start and end). Ids are stable while the footprint is (map `key`). */
export type PaneRec = { id: string; building: string; edge: number; floor: number; bay: number; kind: keyof typeof GLASS; center: number[]; normal: number[]; size: number[] };
export type DoorRec = { id: string; building: string; edge: number; kind: "house" | "shop"; pos: number[]; normal: number[]; along: number[]; width: number };
/** A chimney stack's top: [x, y, z] in the scene frame (its cap's top centre), then the stack's width. */
export type ChimRec = number[];
export const REC = { on: false, key: "", edge: 0, panes: [] as PaneRec[], doors: [] as DoorRec[], chimneys: [] as ChimRec[] };
const r2 = (x: number) => Math.round(x * 100) / 100, r3 = (x: number) => Math.round(x * 1000) / 1000;
function paneRec(f: Frame, kind: keyof typeof GLASS, floor: number, bay: number, x0: number, x1: number, y0: number, y1: number, w: number) {
  if (!REC.on) return;
  REC.panes.push({ id: `b${REC.key}-e${REC.edge}-f${floor}-k${bay}`, building: REC.key, edge: REC.edge, floor, bay, kind, center: toMap(f, (x0 + x1) / 2, (y0 + y1) / 2, w).map(r2), normal: dirMap(f, 0, 0, 1).map(r3), size: [r2(x1 - x0), r2(y1 - y0)] });
}
function doorRec(f: Frame, kind: "house" | "shop", bay: number, x0: number, x1: number, v: number) {
  if (!REC.on) return;
  REC.doors.push({ id: `b${REC.key}-e${REC.edge}-d${bay}`, building: REC.key, edge: REC.edge, kind, pos: toMap(f, (x0 + x1) / 2, v, 0.6).map(r2), normal: dirMap(f, 0, 0, 1).map(r3), along: dirMap(f, 1, 0, 0).map(r3), width: r2(x1 - x0) });
}
const toMap = (f: Frame, u: number, v: number, w: number) => P(f.a[0] + f.t[0] * u + f.o[0] * w, f.a[1] + f.t[1] * u + f.o[1] * w, f.z0 + v);
const dirMap = (f: Frame, du: number, dv: number, dw: number) => N(f.t[0] * du + f.o[0] * dw, f.t[1] * du + f.o[1] * dw, dv);
type V3 = [number, number, number];

/** A quad in the frame, corners counter-clockwise seen from its normal's side. */
function quad(b: Builder, f: Frame, q: V3[], n: V3, col: number[], uvs?: number[][]) {
  const uv = uvs ?? q.map(([u, v]) => [f.u0 + u, v]);
  b.quad(toMap(f, ...q[0]), toMap(f, ...q[1]), toMap(f, ...q[2]), toMap(f, ...q[3]), dirMap(f, ...n), col, uv);
}
/** A box standing out of the wall: u0..u1, v0..v1, w0..w1; faces in `faces` (f front, t top, b bottom, l left,
 *  r right; never the back, which is against the wall). */
function box(b: Builder, f: Frame, u0: number, u1: number, v0: number, v1: number, w0: number, w1: number, col: number[], faces = "ftblr") {
  if (u1 <= u0 || v1 <= v0 || w1 <= w0) return;
  if (faces.includes("f")) quad(b, f, [[u0, v0, w1], [u1, v0, w1], [u1, v1, w1], [u0, v1, w1]], [0, 0, 1], col);
  if (faces.includes("t")) quad(b, f, [[u0, v1, w1], [u1, v1, w1], [u1, v1, w0], [u0, v1, w0]], [0, 1, 0], col, [[f.u0 + u0, v1 + w1], [f.u0 + u1, v1 + w1], [f.u0 + u1, v1 + w0], [f.u0 + u0, v1 + w0]]);
  if (faces.includes("b")) quad(b, f, [[u0, v0, w0], [u1, v0, w0], [u1, v0, w1], [u0, v0, w1]], [0, -1, 0], col);
  if (faces.includes("l")) quad(b, f, [[u0, v0, w0], [u0, v0, w1], [u0, v1, w1], [u0, v1, w0]], [-1, 0, 0], col);
  if (faces.includes("r")) quad(b, f, [[u1, v0, w1], [u1, v0, w0], [u1, v1, w0], [u1, v1, w1]], [1, 0, 0], col);
}
/** A flat piece of wall in the plane w = 0. */
const wall = (b: Builder, f: Frame, u0: number, u1: number, v0: number, v1: number, col: number[]) =>
  u1 > u0 + 1e-3 && v1 > v0 + 1e-3 && quad(b, f, [[u0, v0, 0], [u1, v0, 0], [u1, v1, 0], [u0, v1, 0]], [0, 0, 1], col);

/** The four sides of an opening d deep, each facing into the opening (bottom left out when `bottom` is null). */
function reveal(F: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, d: number, col: number[], bottom: number[] | null) {
  quad(F, f, [[x0, y0, 0], [x0, y0, -d], [x0, y1, -d], [x0, y1, 0]], [1, 0, 0], col);
  quad(F, f, [[x1, y0, -d], [x1, y0, 0], [x1, y1, 0], [x1, y1, -d]], [-1, 0, 0], col);
  quad(F, f, [[x0, y1, -d], [x1, y1, -d], [x1, y1, 0], [x0, y1, 0]], [0, -1, 0], col);
  if (bottom) quad(F, f, [[x0, y0, 0], [x1, y0, 0], [x1, y0, -d], [x0, y0, -d]], [0, 1, 0], bottom);
}

// ---------- storeys ----------
type Floor = { v0: number; v1: number; kind: "ground" | "bel" | "upper" | "top"; sill: number; win: number };
const PLINTH = 0.8;
function floors(bd: Building): { list: Floor[]; eaves: number; plinth: number } {
  const list: Floor[] = [];
  const shop = bd.shops.some(Boolean) && !bd.pub;
  const hs = STORE.keys.has(bd.key) ? [STORE_STOREY.ground, ...Array(Math.max(0, bd.storeys - 1)).fill(STORE_STOREY.upper)] : bd.pub ? Array(bd.storeys).fill(5) : bd.com ? [shop ? 5.4 : 5.0, 4.4, 4.2, 4.0, 3.8, 3.6].slice(0, bd.storeys) : [shop ? 5.1 : 4.4, 4.0, 3.7, 3.6, 3.5, 3.4, 3.3].slice(0, bd.storeys);
  while (hs.length < bd.storeys) hs.push(3.3);
  const plinth = shop ? 0.12 : PLINTH;
  let v = plinth;
  hs.forEach((h, i) => {
    const kind = i === 0 ? "ground" : i === 1 ? "bel" : i === hs.length - 1 ? "top" : "upper";
    const sill = kind === "ground" ? 0.9 : 0.85;
    const win = Math.min(h - sill - 0.55, kind === "bel" ? 2.6 : kind === "top" ? 2.0 : kind === "ground" ? 2.5 : 2.3);
    list.push({ v0: v, v1: v + h, kind, sill, win });
    v += h;
  });
  // the cornice zone above the top floor (frieze and attic): 1.0 m
  return { list, eaves: v + 1.0, plinth };
}

// ---------- one building ----------
export type Built = { eaves: number; top: number; tris: number[] };

export function building(bd: Building, out: Record<Lod, Out>, lods: Lod[] = [0, 1, 2]): Built {
  const r = bd.ring, n = r.length;
  const seed = (k: number) => hash(bd.id, k);
  const plaster = PLASTERS[Math.floor(seed(1) * PLASTERS.length)];
  const trimC = shadeC(plaster, 1.08 + 0.1 * seed(2));
  const frameC = FRAMES[Math.floor(seed(3) * FRAMES.length)];
  const brickC = BRICKS[Math.floor(seed(4) * BRICKS.length)];
  const slateC = SLATES[Math.floor(seed(5) * SLATES.length)];
  const fireBrick = seed(6) < 0.55;
  const { list: fl, eaves, plinth } = floors(bd);
  const z0 = bd.base - 0.4; // the walls go 0.4 m into the ground; v = 0 is 0.4 below the base
  const V = (v: number) => v + 0.4; // a height above the base, as v
  const H = V(eaves);
  const socle = bd.foot != null ? Math.min(0, bd.foot - bd.base) : 0;
  const roofed = bd.kinds.some((k) => k === "front" || k === "other");
  // the roof: a steep mansard over the street fronts, then a shallow top; court and party walls carried up
  const R1 = 3.0, R2 = 3.6;
  let off1 = bd.kinds.map((k) => (k === "front" || k === "other" ? 1.0 : 0));
  let off2 = bd.kinds.map((k) => (k === "front" || k === "other" ? 3.4 : 0));
  let l1 = insetEdges(r, off1), l2 = insetEdges(r, off2);
  const sane = (q: Ring) => area2(q) > 0.15 * area2(r) && q.every((p, i) => {
    const a = r[i], b = r[(i + 1) % n], c = q[i], d = q[(i + 1) % n];
    return (b[0] - a[0]) * (d[0] - c[0]) + (b[1] - a[1]) * (d[1] - c[1]) > 0;
  });
  let mansard = roofed && sane(l1) && sane(l2);
  if (roofed && !mansard) {
    off1 = off1.map((o) => o * 0.6), off2 = off2.map((o) => (o ? 1.4 : 0));
    l1 = insetEdges(r, off1), l2 = insetEdges(r, off2);
    mansard = sane(l1) && sane(l2);
  }
  const top = mansard ? H + R2 : H + 0.6;

  const recording = REC.on;
  for (const lod of lods) {
    const { facade: F, glass: G } = out[lod];
    REC.on = recording && lod === lods[0];
    for (let i = 0; i < n; i++) {
      REC.edge = i;
      const a = r[i], b = r[(i + 1) % n];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < 0.05) continue;
      const t: Pt = [dx / L, dy / L], o: Pt = [dy / L, -dx / L]; // outward: right of travel on a CCW ring
      const f: Frame = { a, t, o, z0, u0: (bd.id % 97) + i * 13.7 };
      const kind = bd.kinds[i];
      // the wall's top along this edge: the roof's profile where the edge isn't a mansard front
      if (kind === "front" || kind === "other") {
        const pal: Pal = { plaster, trimC, frameC, slateC, shop: bd.shops[i] && kind === "front", street: kind === "front", seed: (k) => hash(bd.id, i, k) };
        if (STORE.edges.has(`${bd.key}-e${i}`)) storeFront(F, G, f, L, bd, fl, H, lod, pal);
        else facadeFront(F, G, f, L, bd, fl, H, plinth, lod, pal);
        if (!mansard) wall(F, f, 0, L, H, H + 0.6, bd.pub || bd.com ? [...trimC, SURF.trim] : [...plaster, SURF.plaster]);
        if (mansard) mansardFace(F, G, f, L, H, r, l1, l2, i, lod, { slateC, trimC, frameC, R1, R2, seed: (k) => hash(bd.id, i, 50 + k), bays: bayCount(L, bd) });
      } else {
        const col = kind === "party" ? (fireBrick ? [...brickC, SURF.brick] : [...shadeC(plaster, 0.85), SURF.plaster]) : [...shadeC(plaster, 0.95), SURF.plaster];
        // at LOD2 a party wall is one quad to the roof's top: its stepped profile only shows from close by
        const prof = mansard && lod < 2 ? profile(r, l1, l2, i, H, R1, R2, bd.kinds) : ([[0, lod === 2 && mansard ? H + R2 : H + 0.6], [L, lod === 2 && mansard ? H + R2 : H + 0.6]] as [number, number][]);
        profileWall(F, f, L, prof, lod === 2 && kind === "court" ? [...shadeC(plaster, 0.95), SURF.far] : col);
        if (kind === "court" && lod < 2) facadeCourt(F, G, f, L, bd, fl, lod, { plaster, trimC, frameC, seed: (k) => hash(bd.id, i, 90 + k) });
      }
      // the socle under the base where this edge's own ground (0.5 m out, at its ends and middle) falls more than
      // 0.3 m under it, so the wall would stand less than 10 cm in the ground: down to 0.4 m under that ground, never
      // under the house's lowest (v = 0 is 0.4 m under the base). From LOD2's 600 m only a drop over 1 m shows.
      if (socle < -0.05) {
        const eg = bd.ground ? Math.min(...[0, L / 2, L].map((u) => bd.ground!(a[0] + t[0] * u + o[0] * 0.5, a[1] + t[1] * u + o[1] * 0.5))) : bd.foot!;
        const drop = bd.base - Math.max(bd.foot!, eg);
        if (drop > (lod === 2 ? 1.0 : 0.3)) wall(F, f, 0, L, -drop, 0, [...shadeC(trimC, 0.7), SURF.trim]);
      }
    }
    // the roof's top: snow-covered tar and zinc; then chimneys
    const flatC = [...lin("#5a5a58"), SURF.flat];
    const topRing = mansard ? l2 : r;
    const { flat, tris } = triangulate([topRing]);
    const base = F.count;
    for (const [x, y] of flat) F.vertex(P(x, y, z0 + top), [0, 1, 0], flatC, [x - 389000, y - 5817000]);
    for (let k = 0; k < tris.length; k += 3) F.tri(base + tris[k], base + tris[k + 1], base + tris[k + 2]);
    if (lod < 2) chimneys(F, bd, topRing, z0 + top, lod, brickC, trimC);
  }
  REC.on = recording;
  return { eaves: z0 + H, top: z0 + top, tris: [] };
}

function bayCount(L: number, bd: Building) {
  const target = bd.pub || bd.com ? 3.4 : 2.7 + 0.4 * hash(bd.id, 77);
  return Math.max(1, Math.floor((L - 1.2) / target));
}

type Pal = { plaster: C; trimC: C; frameC: C; slateC: C; shop: boolean; street?: boolean; seed: (k: number) => number };

/** Stone steps from the pavement (v `from`) up to a sill (v `to`) across u0..u1, each a tread 0.3 m deep. */
function steps(F: Builder, f: Frame, u0: number, u1: number, from: number, to: number, col: number[]) {
  const n = Math.max(1, Math.round((to - from) / 0.16)), rise = (to - from) / n;
  for (let i = 0; i < n; i++) box(F, f, u0, u1, from - 0.25, from + rise * (i + 1), 0, 0.3 * (n - i), col, "ftlr");
}

/** The street front of a building, at one level of detail. */
function facadeFront(F: Builder, G: Builder, f: Frame, L: number, bd: Building, fl: Floor[], H: number, plinth: number, lod: Lod, p: Pal) {
  const PL = [...p.plaster, SURF.plaster], TR = [...p.trimC, bd.pub ? SURF.trim : SURF.trim], FR = [...p.frameC, SURF.frame];
  const wallC = bd.pub || bd.com ? TR : PL;
  const V = (v: number) => v + 0.4;
  if (L < 2.4) return wall(F, f, 0, L, 0, H, lod === 2 ? [...p.plaster, SURF.far] : wallC);
  if (lod === 2) {
    // from 600 m a front is one quad: the shader draws its window grid (SURF.far); the cornice is under a pixel
    wall(F, f, 0, L, 0, H, [...p.plaster, SURF.far]);
    return;
  }
  const nb = bayCount(L, bd);
  const endPier = Math.max(0.6, (L - nb * (bd.pub || bd.com ? 3.4 : 2.9)) / 2);
  const bw = (L - 2 * endPier) / nb;
  const ww = bd.com ? Math.min(1.9, bw * 0.58) : Math.min(bd.pub ? 1.6 : 1.3, bw * 0.5);
  const rich = bd.richness, s = p.seed;
  const doorBay = nb >= 3 ? Math.floor(nb / 2) : nb === 2 ? 0 : -1;
  const pedKind = rich > 0.5 ? (s(1) < 0.5 ? "tri" : "seg") : s(1) < 0.6 ? "cap" : "none";
  const balcony = rich > 0.35 && s(2) < 0.55 && nb >= 3;
  const lisene = s(3) < 0.7;
  const groundTop = V(fl[0].v1);
  // the pavement 0.8 m out at u, as v (the base when the bake gave no ground): a sill sunk under it is raised to it,
  // one standing more than 18 cm over it gets steps down to it (a door's own sill 5 cm over the pavement, a shop's
  // 12 cm: a single riser, no tread)
  const pave = (u: number) => (bd.ground ? bd.ground(f.a[0] + f.t[0] * u + f.o[0] * 0.8, f.a[1] + f.t[1] * u + f.o[1] * 0.8) - f.z0 : V(0));
  const STEP = [...p.trimC, SURF.trim];
  /** a sill at the pavement before bay u: [the sill's v, the pavement's v] */
  // (a street front only: an "other" edge faces the river, a green or the rail, with no pavement to meet; and a
  // pavement more than 1.2 m off the sill isn't the one the door opens on: a bridge's ramp, a quay)
  const sillAt = (u: number, nominal: number): [number, number] => {
    const pv = p.street ? pave(u) : nominal;
    if (Math.abs(pv - nominal) > 1.2) return [nominal, nominal];
    return [pv > nominal - 0.03 ? pv + 0.05 : nominal, pv];
  };

  // the plinth, broken by the house door where the ground floor is raised (the door is at the sidewalk)
  const raised = plinth > 0.3, doorU = doorBay >= 0 ? endPier + (doorBay + 0.5) * bw : -99;
  const gaps = raised && doorBay >= 0 && !p.shop ? [[0, doorU - 0.85], [doorU + 0.85, L]] : [[0, L]];
  for (const [g0, g1] of gaps) box(F, f, g0, g1, 0, V(plinth), 0, 0.06, TR, lod === 0 ? "ftlr" : "f");

  // LOD1 draws each storey as one quad (rw skips the pieces around the openings that LOD0 needs for its reveals)
  const rw: typeof wall = (b, ff, u0, u1, v0, v1, col) => lod !== 1 && wall(b, ff, u0, u1, v0, v1, col);
  for (const fr of fl) {
    const v0 = V(fr.v0), v1 = V(fr.v1);
    const isG = fr.kind === "ground";
    const shopRow = isG && p.shop && !bd.pub;
    let cursor = 0; // where the wall last stopped along u (pieces are emitted left to right per row)
    const rowWall = isG && !shopRow && rich > 0.3 && !bd.pub && !bd.com ? [...p.plaster, SURF.rustic] : wallC;
    if (lod === 1) wall(F, f, 0, L, v0, v1, rowWall); // LOD1: one quad a storey, its panes flush in front of it
    for (let k = 0; k < nb; k++) {
      const uc = endPier + (k + 0.5) * bw;
      if (shopRow) {
        // a shopfront: the whole bay but its piers; the door bay is the house's entrance
        const isDoor = k === doorBay;
        const ow = isDoor ? 1.7 : bw - 0.55, o0 = uc - ow / 2, o1 = uc + ow / 2;
        const oTop = isDoor ? v0 + 3.4 : v1 - 0.95, [oBot, pv] = sillAt(uc, isDoor ? V(0.05) : V(0.12));
        rw(F, f, cursor, o0, v0, v1, rowWall);
        rw(F, f, o0, o1, oTop, v1, rowWall);
        if (oBot > v0) rw(F, f, o0, o1, v0, oBot, rowWall);
        if (oBot - pv > 0.18 && lod === 0) steps(F, f, o0, o1, pv, oBot, STEP);
        cursor = o1;
        if (isDoor) {
          portal(F, G, f, o0, o1, oBot, oTop, lod, p, rich);
          doorRec(f, "house", k, o0, o1, oBot);
        } else {
          const open = lod === 0 && OPEN_DOORS.has(`b${REC.key}-e${REC.edge}-d${k}`);
          shopfront(F, G, f, o0, o1, oBot, oTop, v1, lod, s(10 + k), k, open);
          if (!open) paneRec(f, "shop", 0, k, o0, o1, oBot + 0.55, oTop, -0.16);
          doorRec(f, "shop", k, o0, o1, oBot);
        }
        continue;
      }
      const isDoor = isG && k === doorBay;
      if (isDoor) {
        const o0 = uc - 0.85, o1 = uc + 0.85, [oBot, pv] = sillAt(uc, V(0.05));
        const oTop = Math.min(v1 - 0.3, Math.max(oBot + 2.2, V(0.05) + 3.5));
        rw(F, f, cursor, o0, v0, v1, rowWall);
        rw(F, f, o0, o1, oTop, v1, rowWall);
        if (oBot > v0) rw(F, f, o0, o1, v0, oBot, rowWall);
        if (oBot - pv > 0.18 && lod === 0) steps(F, f, o0 - 0.15, o1 + 0.15, pv, oBot, STEP);
        cursor = o1;
        portal(F, G, f, o0, o1, oBot, oTop, lod, p, rich);
        doorRec(f, "house", k, o0, o1, oBot);
        continue;
      }
      const french = balcony && fr.kind === "bel" && Math.abs(k - (nb - 1) / 2) < 1;
      const wy0 = french ? v0 + 0.05 : v0 + fr.sill, wy1 = v0 + fr.sill + fr.win;
      const x0 = uc - ww / 2, x1 = uc + ww / 2;
      rw(F, f, cursor, x0, v0, v1, rowWall);
      rw(F, f, x0, x1, v0, wy0, rowWall);
      rw(F, f, x0, x1, wy1, v1, rowWall);
      cursor = x1;
      window(F, G, f, x0, x1, wy0, wy1, lod, FR, TR, rowWall, isG ? 0.25 : 0.22, s(20 + k * 7 + fl.indexOf(fr)), GLASS.room, [fl.indexOf(fr), k]);
      paneRec(f, "room", fl.indexOf(fr), k, x0, x1, wy0, wy1, -(isG ? 0.25 : 0.22) + 0.05);
      if (lod === 0) {
        // the trim around it, richer on the Beletage
        if (fr.kind === "bel" && rich > 0.2) {
          surround(F, f, x0, x1, wy0, wy1, TR, 0.16, 0.05);
          if (pedKind === "tri") pediment(F, f, x0 - 0.25, x1 + 0.25, wy1 + 0.16, TR);
          else if (pedKind === "seg") segment(F, f, x0 - 0.2, x1 + 0.2, wy1 + 0.16, TR);
          else if (pedKind === "cap") cap(F, f, x0, x1, wy1 + 0.12, TR);
          if (!french) box(F, f, x0, x1, v0 + 0.15, wy0 - 0.14, 0, 0.035, TR, "ftb"); // the apron panel
        } else if (fr.kind === "upper" && rich > 0.15) {
          surround(F, f, x0, x1, wy0, wy1, TR, 0.13, 0.04);
          if (s(4) < 0.5) cap(F, f, x0, x1, wy1 + 0.1, TR);
          else box(F, f, (x0 + x1) / 2 - 0.12, (x0 + x1) / 2 + 0.12, wy1 - 0.05, wy1 + 0.32, 0, 0.07, TR); // a keystone
        } else if (fr.kind === "top" && rich > 0.15) surround(F, f, x0, x1, wy0, wy1, TR, 0.1, 0.03);
        else if (isG && rich > 0.3) box(F, f, (x0 + x1) / 2 - 0.15, (x0 + x1) / 2 + 0.15, wy1, wy1 + 0.35, 0, 0.06, TR);
        if (french) balconyOn(F, f, x0 - 0.5, x1 + 0.5, v0, TR, s(30 + k));
      }
      // the cellar window under a ground-floor window
      if (isG && lod === 0 && raised) cellar(F, G, f, x0 + 0.15, x1 - 0.15, 0.55, V(plinth) - 0.12, TR, k, lod);
    }
    rw(F, f, cursor, L, v0, v1, rowWall);
    // a string course over the ground floor and under the top floor
    if (lod === 0 && (isG || fr.kind === "top")) box(F, f, 0, L, v1 - (isG ? 0.4 : 0.22), v1, 0, isG ? 0.16 : 0.1, TR);
    else if (lod === 1 && isG) box(F, f, 0, L, v1 - 0.4, v1, 0, 0.16, TR, "ft");
  }
  // the frieze above the top floor up to the eaves
  const topV = V(fl[fl.length - 1].v1);
  wall(F, f, 0, L, topV, H, wallC);
  // corner pilasters (Lisenen) from the ground floor's top to the frieze
  if (lod === 0 && lisene && L > 6) {
    box(F, f, 0, 0.55, groundTop, H - 0.9, 0, 0.07, TR, "fr");
    box(F, f, L - 0.55, L, groundTop, H - 0.9, 0, 0.07, TR, "fl");
  }
  cornice(F, f, L, H, lod, TR, rich);
}

/** A department store's street front, after Messel's Wertheim on Leipziger Straße (1897-1906): stone piers rising
 *  through every storey with glass between them from floor to floor, dark bronze spandrels at each floor line, show
 *  windows under a bronze band lettered with the store's sign on the ground floor, the main entrance in the middle
 *  bay, a stone attic and the cornice. The pier rhythm (a bay of about 4.6 m, piers 1.0 m wide standing 0.3 m proud)
 *  is assumed, not measured. Every pane is raea-fb's: the ground floor's "shop" panes (the hall, its sign), the floors
 *  above "room" panes (the sales floors); one pane a bay and floor, so a hall reads as one hall through it. */
function storeFront(F: Builder, G: Builder, f: Frame, L: number, bd: Building, fl: Floor[], H: number, lod: Lod, p: Pal) {
  const ST = [...p.trimC, SURF.trim], BR = [...lin("#2e2a24"), SURF.iron];
  const V = (v: number) => v + 0.4;
  if (L < 2.4) return wall(F, f, 0, L, 0, H, lod === 2 ? [...p.trimC, SURF.far] : ST);
  if (lod === 2) return wall(F, f, 0, L, 0, H, [...p.trimC, SURF.far]);
  const PW = 1.0, PD = 0.3, nb = Math.max(1, Math.round((L - PW) / 4.6)), bw = (L - PW) / nb;
  const topV = V(fl[fl.length - 1].v1), door = nb >= 3 ? Math.floor(nb / 2) : -1, UV = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const pane = (x0: number, x1: number, y0: number, y1: number, room: number[]) => quad(roomsOf(G), f, [[x0, y0, 0.02], [x1, y0, 0.02], [x1, y1, 0.02], [x0, y1, 0.02]], [0, 0, 1], room, UV);
  // the bronze glazing bars: two mullions and a transom, standing 5 cm proud of the glass
  const bars = (x0: number, x1: number, y0: number, y1: number, tr: number) => {
    if (lod !== 0) return;
    const w = x1 - x0, b = 0.08;
    for (const k of [1, 2]) box(F, f, x0 + (w * k) / 3 - b / 2, x0 + (w * k) / 3 + b / 2, y0, y1, 0.02, 0.07, BR, "flr");
    box(F, f, x0, x1, y0 + (y1 - y0) * tr - b / 2, y0 + (y1 - y0) * tr + b / 2, 0.02, 0.07, BR, "ftb");
  };
  // the piers, from the ground to the attic
  for (let k = 0; k <= nb; k++) box(F, f, k * bw, k * bw + PW, 0, topV, 0, PD, ST, lod === 0 ? "ftlr" : "flr");
  fl.forEach((fr, fi) => {
    const v0 = V(fr.v0), v1 = V(fr.v1);
    for (let k = 0; k < nb; k++) {
      const x0 = k * bw + PW, x1 = (k + 1) * bw;
      if (fi > 0) {
        // a sales floor's glass between bronze spandrels
        const y0 = v0 + 0.1, y1 = v1 - 0.55;
        box(F, f, x0, x1, v0, y0, 0, 0.04, BR, "f");
        box(F, f, x0, x1, y1, v1, 0, 0.04, BR, "f");
        pane(x0, x1, y0, y1, assigned(GLASS.room, fi, k, lod, paneColor(hash(bd.id, k, 40 + fi), GLASS.room)));
        paneRec(f, "room", fi, k, x0, x1, y0, y1, 0.02);
        bars(x0, x1, y0, y1, 0.72);
        continue;
      }
      const band = v1 - 0.9, riser = V(0.45);
      if (k === door) {
        // the main entrance: the house's doors in the middle bay, stone round them up to the band
        const o0 = (x0 + x1) / 2 - 1.1, o1 = (x0 + x1) / 2 + 1.1, oTop = Math.min(band - 0.2, V(0.05) + 3.6);
        wall(F, f, x0, o0, 0, band, ST);
        wall(F, f, o1, x1, 0, band, ST);
        wall(F, f, o0, o1, oTop, band, ST);
        portal(F, G, f, o0, o1, V(0.05), oTop, lod, p, 0.8);
        doorRec(f, "shop", k, o0, o1, V(0.05));
      } else {
        box(F, f, x0, x1, 0, riser, 0, 0.08, ST, lod === 0 ? "ft" : "f");
        pane(x0, x1, riser, band, assigned(GLASS.shop, 0, k, lod, shopColor(hash(bd.id, k, 7))));
        paneRec(f, "shop", 0, k, x0, x1, riser, band, 0.02);
        bars(x0, x1, riser, band, 0.8);
      }
      // the band over the show windows, in the sign's ground and lettered where raea-fb's sign falls on this bay
      const sg = assignment(0, k, lod)?.sign, sign = sg ? SIGNS.list[sg[0]] : undefined;
      box(F, f, x0, x1, band, v1, 0, 0.06, sign ? [...lin(sign.ground), SURF.sign] : BR, "f");
      const GL = GLYPHS.get(F);
      if (sign && GL && SIGNS.font) {
        const z = 0.06 + 0.0015, ink = [...lin(sign.ink), sign.gilt ? 0 : 255];
        for (const [a, b, c, d, u0, w0, u1, w1] of layoutSign(SIGNS.font, sign, x1 - x0, v1 - band))
          quad(GL, f, [[x0 + a, band + b, z], [x0 + c, band + b, z], [x0 + c, band + d, z], [x0 + a, band + d, z]], [0, 0, 1], ink, [[u0, w0], [u1, w0], [u1, w1], [u0, w1]]);
      }
    }
  });
  // the attic over the top floor, then the cornice
  wall(F, f, 0, L, topV, H, ST);
  cornice(F, f, L, H, lod, ST, 1);
}

/** The main cornice: architrave, consoles under a projecting corona. Its ends run past the corner by its depth so
 *  neighbouring fronts meet. */
function cornice(F: Builder, f: Frame, L: number, H: number, lod: Lod, TR: number[], rich: number) {
  const d = 0.55 + 0.25 * rich;
  box(F, f, -0.1, L + 0.1, H - 0.95, H - 0.7, 0, 0.1, TR, lod === 0 ? "ftb" : "f");
  if (lod === 0) {
    const step = 0.8, cnt = Math.max(1, Math.floor((L - 0.4) / step));
    const st = (L - (cnt - 1) * step) / 2;
    for (let k = 0; k < cnt; k++) {
      const u = st + k * step;
      box(F, f, u - 0.08, u + 0.08, H - 0.62, H - 0.28, 0, d - 0.1, TR, "fblr");
    }
    box(F, f, -d, L + d, H - 0.42, H - 0.28, 0, d * 0.55, TR, "fb"); // the bed moulding
  }
  box(F, f, -d, L + d, H - 0.28, H, 0, d, TR, lod === 0 ? "ftblr" : "ftb");
}

function window(F: Builder, G: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, lod: Lod, FR: number[], TR: number[], WALL: number[], d: number, sd: number, glassKind: number, at?: [number, number]) {
  const isRoom = glassKind === GLASS.room;
  const room = isRoom ? (at ? assigned(glassKind, at[0], at[1], lod, paneColor(sd, glassKind)) : paneColor(sd, glassKind)) : [Math.floor(sd * 251) % 256, Math.floor(sd * 7919) % 256, Math.floor(sd * 104729) % 256, glassKind];
  const GP = isRoom ? roomsOf(G) : G;
  if (lod === 1) {
    // a pane flush with the wall, nudged out; the shader puts the room and the frame on it: the kind + 1 (odd) asks
    // it for LOD1's stand-ins, the reveal's inner faces, the glass set back and the cross-frame (raea-fb, 11-17)
    quad(GP, f, [[x0, y0, 0.01], [x1, y0, 0.01], [x1, y1, 0.01], [x0, y1, 0.01]], [0, 0, 1], [...room.slice(0, 3), room[3] + 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return;
  }
  const rv = [...WALL.slice(0, 3).map((c) => Math.round(c * 0.8)), WALL[3]];
  reveal(F, f, x0, x1, y0, y1, d, rv, rv);
  const gw = -d + 0.05;
  quad(GP, f, [[x0, y0, gw], [x1, y0, gw], [x1, y1, gw], [x0, y1, gw]], [0, 0, 1], room, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // the frame: casements with a transom (the Berlin cross window), 7 cm bars standing 5 cm proud of the pane
  const b = 0.07, fw0 = gw, fw1 = gw + 0.05, tr = y0 + (y1 - y0) * 0.72, mid = (x0 + x1) / 2;
  box(F, f, x0, x0 + b, y0, y1, fw0, fw1, FR, "fr");
  box(F, f, x1 - b, x1, y0, y1, fw0, fw1, FR, "fl");
  box(F, f, x0 + b, x1 - b, y1 - b, y1, fw0, fw1, FR, "fb");
  box(F, f, x0 + b, x1 - b, y0, y0 + b * 1.4, fw0, fw1, FR, "ft");
  box(F, f, mid - b / 2, mid + b / 2, y0 + b, tr, fw0, fw1, FR, "flr");
  box(F, f, x0 + b, x1 - b, tr - b / 2, tr + b / 2, fw0, fw1, FR, "ftb");
  // the stone sill
  box(F, f, x0 - 0.12, x1 + 0.12, y0 - 0.09, y0, 0, 0.1, TR, "ftb");
}

function surround(F: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, TR: number[], wd: number, pr: number) {
  box(F, f, x0 - wd, x0, y0, y1 + wd, 0, pr, TR, "fl");
  box(F, f, x1, x1 + wd, y0, y1 + wd, 0, pr, TR, "fr");
  box(F, f, x0, x1, y1, y1 + wd, 0, pr, TR, "ft");
}
function cap(F: Builder, f: Frame, x0: number, x1: number, v: number, TR: number[]) {
  box(F, f, x0 - 0.1, x1 + 0.1, v, v + 0.22, 0, 0.06, TR, "f");
  box(F, f, x0 - 0.22, x1 + 0.22, v + 0.22, v + 0.36, 0, 0.2, TR);
}
function pediment(F: Builder, f: Frame, x0: number, x1: number, v: number, TR: number[]) {
  const w = x1 - x0, h = w * 0.28, d = 0.2, mid = (x0 + x1) / 2;
  box(F, f, x0, x1, v, v + 0.14, 0, d, TR);
  // the tympanum, then the two raking cornices as sloped slabs
  F.tri(...[[x0, v + 0.14, 0.04], [x1, v + 0.14, 0.04], [mid, v + 0.14 + h, 0.04]].map(([u, vv, ww]) => F.vertex(toMap(f, u, vv, ww), dirMap(f, 0, 0, 1), TR, [f.u0 + u, vv])) as [number, number, number]);
  for (const side of [-1, 1]) {
    const ua = side < 0 ? x0 - 0.04 : mid, ub = side < 0 ? mid : x1 + 0.04;
    const va = side < 0 ? v + 0.14 : v + 0.14 + h + 0.12, vb = side < 0 ? v + 0.14 + h + 0.12 : v + 0.14;
    const slope = (vb - va) / (ub - ua), nl = Math.hypot(slope, 1);
    quad(F, f, [[ua, va + 0.12, d], [ub, vb + 0.12, d], [ub, vb + 0.12, 0], [ua, va + 0.12, 0]], [-slope / nl, 1 / nl, 0], TR);
    quad(F, f, [[ua, va, d], [ub, vb, d], [ub, vb + 0.12, d], [ua, va + 0.12, d]], [0, 0, 1], TR);
  }
}
function segment(F: Builder, f: Frame, x0: number, x1: number, v: number, TR: number[]) {
  const w = x1 - x0, rise = w * 0.18, K = 6, d = 0.18;
  box(F, f, x0, x1, v, v + 0.12, 0, d, TR, "ftb");
  for (let k = 0; k < K; k++) {
    const ua = x0 + (w * k) / K, ub = x0 + (w * (k + 1)) / K;
    const ya = v + 0.12 + rise * Math.sin((Math.PI * k) / K), yb = v + 0.12 + rise * Math.sin((Math.PI * (k + 1)) / K);
    const slope = (yb - ya) / (ub - ua), nl = Math.hypot(slope, 1);
    quad(F, f, [[ua, ya + 0.12, d], [ub, yb + 0.12, d], [ub, yb + 0.12, 0], [ua, ya + 0.12, 0]], [-slope / nl, 1 / nl, 0], TR);
    quad(F, f, [[ua, ya, d], [ub, yb, d], [ub, yb + 0.12, d], [ua, ya + 0.12, d]], [0, 0, 1], TR);
    quad(F, f, [[ua, v + 0.12, 0.03], [ub, v + 0.12, 0.03], [ub, yb, 0.03], [ua, ya, 0.03]], [0, 0, 1], TR);
  }
}
function balconyOn(F: Builder, f: Frame, x0: number, x1: number, v: number, TR: number[], sd: number) {
  const D = 0.85, IR = [...lin("#1d1d1f"), SURF.iron];
  box(F, f, x0, x1, v - 0.18, v, 0, D, TR);
  for (const u of [x0 + 0.2, x1 - 0.2]) box(F, f, u - 0.08, u + 0.08, v - 0.55, v - 0.18, 0, D - 0.1, TR, "fblr"); // consoles
  const top = v + 0.95;
  box(F, f, x0, x1, top - 0.04, top, D - 0.05, D, IR, "ftb");
  box(F, f, x0, x1, v + 0.1, v + 0.13, D - 0.05, D, IR, "ft");
  for (const side of [x0, x1 - 0.04]) box(F, f, side, side + 0.04, v, top, 0, D, IR, "tlr");
  const bars = Math.floor((x1 - x0) / 0.12);
  for (let k = 1; k < bars; k++) {
    const u = x0 + k * ((x1 - x0) / bars);
    box(F, f, u - 0.012, u + 0.012, v, top - 0.04, D - 0.04, D - 0.02, IR, sd < 0.5 ? "f" : "flr");
  }
}
/** A cellar window under a ground-floor window (floor -1 in the pane ids): recorded for raea-fb's assigner, drawn by
 *  the room shader with its room and hours once it has them (a coal cellar, a cellar shop), else dark glass. */
function cellar(F: Builder, G: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, TR: number[], bay: number, lod: Lod) {
  if (y1 - y0 < 0.2) return;
  const a = assignment(-1, bay, lod);
  const col = a ? [a.recipe, Math.round((a.lit[0] / 24) * 255), Math.round((a.lit[1] / 24) * 255), GLASS.cellar] : [0, 0, 0, GLASS.cellar];
  quad(a ? roomsOf(G) : G, f, [[x0, y0, 0.065], [x1, y0, 0.065], [x1, y1, 0.065], [x0, y1, 0.065]], [0, 0, 1], col, [[0, 0], [1, 0], [1, 1], [0, 1]]);
  paneRec(f, "cellar", -1, bay, x0, x1, y0, y1, 0.065);
}

/** A shopfront in an opening: a painted wooden front with pilasters, a stall riser, the display glass in three lights
 *  and a fascia board for the name. */
/** Shop doors that stand open in a shot (door ids, as doorRec writes them): at LOD0 their bay has no display glass, no
 *  mullions and no stall board, so the shot's door leaves (interiors/kit/door.ts) and the room behind them
 *  (interiors/shops.ts shopBehind) show through. Leipziger Straße 90, Weißenberg & David, silks: a shop-door
 *  shot's open door (raea-fb's sign 556, 11-17). */
export const OPEN_DOORS = new Set(["b3909688_58190683-e36-d1"]);

function shopfront(F: Builder, G: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, rowTop: number, lod: Lod, sd: number, bay: number, open = false) {
  // the front is painted as one in its sign's ground (1917 fronts were), else one of the street's shop colours
  const sg = assignment(0, bay, lod)?.sign, sign = sg ? SIGNS.list[sg[0]] : undefined;
  const paint = sign ? lin(sign.ground) : SHOPS[Math.floor(sd * SHOPS.length)];
  const WD = [...paint, SURF.wood], SG = [...paint, SURF.sign];
  // the display glass is a room pane: the shop's trade and hours from raea-fb's assignment, drawn with its display card
  // (windowTileWgsl({ displays: true })) and its roller shutter when shut
  const room = assigned(GLASS.shop, 0, bay, lod, shopColor(sd));
  const gl = 0.16, riser = y0 + 0.55;
  if (lod === 1) {
    // the kind + 1 (61): the shader draws the shop pane's reveal at LOD1, no frame (raea-fb, 11-17)
    quad(roomsOf(G), f, [[x0, riser, 0.01], [x1, riser, 0.01], [x1, y1, 0.01], [x0, y1, 0.01]], [0, 0, 1], [...room.slice(0, 3), room[3] + 1], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    box(F, f, x0, x1, y0, riser, 0, 0.03, WD, "f");
    box(F, f, x0 - 0.1, x1 + 0.1, y1 + 0.1, rowTop - 0.45, 0, 0.1, SG, "ftb");
    return;
  }
  // reveals
  reveal(F, f, x0, x1, y0, y1, gl, WD, null);
  if (!open) {
    box(F, f, x0, x1, y0, riser, -gl, 0.02, WD, "ft");
    quad(roomsOf(G), f, [[x0, riser, -gl + 0.03], [x1, riser, -gl + 0.03], [x1, y1, -gl + 0.03], [x0, y1, -gl + 0.03]], [0, 0, 1], room, [[0, 0], [1, 0], [1, 1], [0, 1]]);
    // mullions and a transom of wood
    const w = x1 - x0, b = 0.06;
    for (const k of [1, 2]) box(F, f, x0 + (w * k) / 3 - b / 2, x0 + (w * k) / 3 + b / 2, riser, y1, -gl + 0.03, -gl + 0.08, WD, "flr");
    box(F, f, x0, x1, y1 - 0.55, y1 - 0.55 + b, -gl + 0.03, -gl + 0.08, WD, "ftb");
  }
  // pilasters and the fascia
  box(F, f, x0 - 0.18, x0, y0, y1 + 0.1, 0, 0.1, WD, "flr");
  box(F, f, x1, x1 + 0.18, y0, y1 + 0.1, 0, 0.1, WD, "flr");
  box(F, f, x0 - 0.2, x1 + 0.2, y1 + 0.1, rowTop - 0.45, 0, 0.12, SG, "ftblr");
  box(F, f, x0 - 0.26, x1 + 0.26, rowTop - 0.45, rowTop - 0.38, 0, 0.18, WD, "ftb");
  // the sign's letters on the fascia's face
  const GL = GLYPHS.get(F);
  if (sign && GL && SIGNS.font) {
    const ox = x0 - 0.2, oy = y1 + 0.1, z = 0.12 + 0.0015, ink = [...lin(sign.ink), sign.gilt ? 0 : 255];
    for (const [a, b, c, d, u0, v0, u1, v1] of layoutSign(SIGNS.font, sign, x1 + 0.2 - ox, rowTop - 0.45 - oy))
      quad(GL, f, [[ox + a, oy + b, z], [ox + c, oy + b, z], [ox + c, oy + d, z], [ox + a, oy + d, z]], [0, 0, 1], ink, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]);
  }
}

/** The house door: a recessed double door of panelled oak with a fanlight. */
function portal(F: Builder, G: Builder, f: Frame, x0: number, x1: number, y0: number, y1: number, lod: Lod, p: Pal, rich: number) {
  const WD = [...lin("#3b2618"), SURF.wood], TR = [...p.trimC, SURF.trim];
  const d = 0.45, fan = y1 - 0.7;
  if (lod === 1) {
    quad(F, f, [[x0, y0, 0.01], [x1, y0, 0.01], [x1, fan, 0.01], [x0, fan, 0.01]], [0, 0, 1], WD);
    quad(G, f, [[x0, fan, 0.01], [x1, fan, 0.01], [x1, y1, 0.01], [x0, y1, 0.01]], [0, 0, 1], [40, 80, 120, GLASS.door], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return;
  }
  reveal(F, f, x0, x1, y0, y1, d, TR, TR);
  // the leaves with raised panels
  quad(F, f, [[x0, y0, -d], [x1, y0, -d], [x1, fan, -d], [x0, fan, -d]], [0, 0, 1], WD);
  const mid = (x0 + x1) / 2;
  for (const [a, b] of [[x0 + 0.12, mid - 0.06], [mid + 0.06, x1 - 0.12]]) {
    box(F, f, a, b, y0 + 0.25, y0 + 1.1, -d, -d + 0.03, WD, "ftblr");
    box(F, f, a, b, y0 + 1.3, fan - 0.2, -d, -d + 0.03, WD, "ftblr");
  }
  box(F, f, x0, x1, fan - 0.06, fan + 0.04, -d, -d + 0.06, WD, "ftb");
  quad(G, f, [[x0, fan, -d + 0.02], [x1, fan, -d + 0.02], [x1, y1, -d + 0.02], [x0, y1, -d + 0.02]], [0, 0, 1], [40, 80, 120, GLASS.door], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  // the frame round the opening, and a cornice over it on a rich street
  surround(F, f, x0, x1, y0, y1, TR, 0.22, 0.08);
  if (rich > 0.4) cap(F, f, x0 - 0.1, x1 + 0.1, y1 + 0.24, TR);
  // two steps up from the sidewalk
  box(F, f, x0 - 0.1, x1 + 0.1, y0 - 0.05, y0 + 0.1, -d, 0.35, TR, "ftlr");
}

/** A courtyard wall's windows: plain, smaller, no ornament but a sill. */
function facadeCourt(F: Builder, G: Builder, f: Frame, L: number, bd: Building, fl: Floor[], lod: Lod, p: { plaster: C; trimC: C; frameC: C; seed: (k: number) => number }) {
  if (L < 3) return;
  const V = (v: number) => v + 0.4;
  const PL = [...shadeC(p.plaster, 0.95), SURF.plaster], TR = [...p.trimC, SURF.trim], FR = [...lin("#c9c2b2"), SURF.frame];
  const nb = Math.max(1, Math.floor((L - 1.2) / 2.6)), end = (L - nb * 2.6) / 2;
  // the stair: on a court wall of three bays or more, a little over half of them, one bay whose windows sit at the
  // half-landings, between the floors (the Berlin court's tell); raea-fb's assigner gives each its stair room
  const stairK = nb >= 3 && p.seed(77) < 0.55 ? Math.floor(p.seed(78) * nb) : -1;
  for (const fr of fl) {
    const fi = fl.indexOf(fr);
    if (stairK >= 0 && fi < fl.length - 1) {
      const uc = end + (stairK + 0.5) * 2.6, landing = V(fr.v0) + (fr.v1 - fr.v0) / 2, y0 = landing + 0.9, y1 = y0 + 1.1;
      const a = assignment(fi, stairK, lod);
      const col = a ? [a.recipe, Math.round((a.lit[0] / 24) * 255), Math.round((a.lit[1] / 24) * 255), GLASS.stair] : [Math.floor(p.seed(90 + fi) * 251) % 256, 0, 0, GLASS.stair];
      quad(a ? roomsOf(G) : G, f, [[uc - 0.4, y0, 0.012], [uc + 0.4, y0, 0.012], [uc + 0.4, y1, 0.012], [uc - 0.4, y1, 0.012]], [0, 0, 1], col, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      paneRec(f, "stair", fi, stairK, uc - 0.4, uc + 0.4, y0, y1, 0.012);
      if (lod === 0) box(F, f, uc - 0.46, uc + 0.46, y0 - 0.06, y0, 0, 0.07, TR, "ft");
    }
    for (let k = 0; k < nb; k++) {
      if (k === stairK) continue;
      if (p.seed(k * 3 + fl.indexOf(fr)) < 0.12) continue; // a blind bay (a kitchen chimney, a closet)
      const uc = end + (k + 0.5) * 2.6, x0 = uc - 0.55, x1 = uc + 0.55;
      const y0 = V(fr.v0) + 0.9, y1 = y0 + Math.min(2.1, fr.v1 - fr.v0 - 1.4);
      // a court window is a pane set into the wall plane (the wall behind it is one quad): no reveal geometry
      const sd = p.seed(100 + k * 11 + fl.indexOf(fr));
      const room = assigned(GLASS.room, fl.indexOf(fr), k, lod, paneColor(sd, GLASS.room));
      quad(roomsOf(G), f, [[x0, y0, 0.012], [x1, y0, 0.012], [x1, y1, 0.012], [x0, y1, 0.012]], [0, 0, 1], room, [[0, 0], [1, 0], [1, 1], [0, 1]]);
      paneRec(f, "room", fl.indexOf(fr), k, x0, x1, y0, y1, 0.012);
      if (lod === 0) {
        box(F, f, x0, x0 + 0.06, y0, y1, 0.012, 0.05, FR, "f");
        box(F, f, x1 - 0.06, x1, y0, y1, 0.012, 0.05, FR, "f");
        box(F, f, x0, x1, y1 - 0.06, y1, 0.012, 0.05, FR, "f");
        box(F, f, x0 - 0.06, x1 + 0.06, y0 - 0.06, y0, 0, 0.07, TR, "ft");
      }
    }
  }
  void PL;
}

/** Where along edge i the roof's levels meet it, as (u, height above the frame's base) points, sorted by u. */
function profile(r: Ring, l1: Ring, l2: Ring, i: number, H: number, R1: number, R2: number, kinds: EdgeKind[]): [number, number][] {
  const n = r.length, a = r[i], b = r[(i + 1) % n];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]), t = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  const along = (p: Pt) => (p[0] - a[0]) * t[0] + (p[1] - a[1]) * t[1];
  const prevFront = kinds[(i + n - 1) % n] === "front" || kinds[(i + n - 1) % n] === "other";
  const nextFront = kinds[(i + 1) % n] === "front" || kinds[(i + 1) % n] === "other";
  const pts: [number, number][] = [];
  pts.push([0, prevFront ? H : H + R2]);
  if (prevFront && R2 > 0) pts.push([along(l1[i]), H + R1], [along(l2[i]), H + R2]);
  if (nextFront && R2 > 0) pts.push([along(l2[(i + 1) % n]), H + R2], [along(l1[(i + 1) % n]), H + R1]);
  pts.push([L, nextFront ? H : H + R2]);
  return pts.map(([u, h]) => [Math.min(L, Math.max(0, u)), h] as [number, number]).sort((x, y) => x[0] - y[0]);
}
/** A plain wall from the ground to a stepped top, in vertical strips. */
function profileWall(F: Builder, f: Frame, L: number, prof: [number, number][], col: number[]) {
  for (let k = 0; k + 1 < prof.length; k++) {
    const [ua, ha] = prof[k], [ub, hb] = prof[k + 1];
    if (ub - ua < 1e-3) continue;
    quad(F, f, [[ua, 0, 0], [ub, 0, 0], [ub, hb, 0], [ua, ha, 0]], [0, 0, 1], col);
  }
  void L;
}

/** The mansard over front edge i: the steep slate slope from the eaves to level 1, the shallow one to the top, with
 *  dormers on the steep slope over every other window axis. */
function mansardFace(F: Builder, G: Builder, f: Frame, L: number, H: number, r: Ring, l1: Ring, l2: Ring, i: number, lod: Lod,
  p: { slateC: C; trimC: C; frameC: C; R1: number; R2: number; seed: (k: number) => number; bays: number }) {
  const n = r.length, a = r[i], b = r[(i + 1) % n];
  const SL = [...p.slateC, SURF.slate], FL = [...lin("#5a5a58"), SURF.flat], TR = [...p.trimC, SURF.trim];
  const z = f.z0;
  const up = (q: Pt, h: number) => P(q[0], q[1], z + h);
  const face = (pa: [number, number, number], pb: [number, number, number], pc: [number, number, number], pd: [number, number, number], col: number[]) => {
    const e1 = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], e2 = [pd[0] - pa[0], pd[1] - pa[1], pd[2] - pa[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0], nl = Math.hypot(nx, ny, nz) || 1;
    F.quad(pa, pb, pc, pd, [nx / nl, ny / nl, nz / nl], col, [[f.u0, pa[1]], [f.u0 + L, pb[1]], [f.u0 + L, pc[1]], [f.u0, pd[1]]]);
  };
  face(up(a, H), up(b, H), up(l1[(i + 1) % n], H + p.R1), up(l1[i], H + p.R1), SL);
  face(up(l1[i], H + p.R1), up(l1[(i + 1) % n], H + p.R1), up(l2[(i + 1) % n], H + p.R2), up(l2[i], H + p.R2), FL);
  if (lod === 2 || L < 5) return;
  // dormers: on alternate window axes, a small upright front with a pane and a segmental zinc hood
  const end = Math.max(0.6, (L - p.bays * 2.9) / 2), bw = (L - 2 * end) / p.bays;
  const run = Math.hypot(l1[i][0] - a[0], l1[i][1] - a[1]) || 1.0; // how far the steep slope runs in
  for (let k = 0; k < p.bays; k++) {
    if ((k + (p.seed(1) < 0.5 ? 0 : 1)) % 2) continue;
    const uc = end + (k + 0.5) * bw;
    if (uc < 1.2 || uc > L - 1.2) continue;
    const x0 = uc - 0.55, x1 = uc + 0.55, w = -run * 0.2, h0 = H + 0.35, h1 = H + 2.0, hood = H + 2.35;
    const ZN = [...lin("#6d7378"), SURF.zinc];
    box(F, f, x0 - 0.1, x0, H, h1, w - run, w, TR, "fl");
    box(F, f, x1, x1 + 0.1, H, h1, w - run, w, TR, "fr");
    box(F, f, x0, x1, H, h0, w - run, w, TR, "f");
    quad(roomsOf(G), f, [[x0, h0, w - 0.02], [x1, h0, w - 0.02], [x1, h1, w - 0.02], [x0, h1, w - 0.02]], [0, 0, 1], assigned(GLASS.dormer, 99, k, lod, paneColor(p.seed(k), GLASS.dormer)), [[0, 0], [1, 0], [1, 1], [0, 1]]);
    paneRec(f, "dormer", 99, k, x0, x1, h0, h1, w - 0.02);
    if (lod === 0) {
      const FR = [...p.frameC, SURF.frame];
      box(F, f, uc - 0.035, uc + 0.035, h0, h1, w - 0.02, w + 0.02, FR, "f");
    }
    box(F, f, x0 - 0.18, x1 + 0.18, h1, hood, w - run, w + 0.12, ZN, "ftblr");
  }
}

function chimneys(F: Builder, bd: Building, top: Ring, h: number, lod: Lod, brickC: C, trimC: C) {
  const BR = [...brickC, SURF.brick], TR = [...trimC, SURF.trim];
  const n = top.length;
  let placed = 0;
  for (let i = 0; i < n && placed < 6; i++) {
    if (bd.kinds[i] !== "party" && bd.kinds[i] !== "court") continue;
    const a = top[i], b = top[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 3) continue;
    const t: Pt = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], inw: Pt = [-t[1], t[0]];
    const count = Math.min(3, Math.max(1, Math.floor(L / 5)));
    for (let k = 0; k < count; k++) {
      const s = hash(bd.id, i, k, 3);
      const u = L * (k + 0.5) / count + (s - 0.5) * 1.0;
      const c: Pt = [a[0] + t[0] * u + inw[0] * 0.6, a[1] + t[1] * u + inw[1] * 0.6];
      const w = 0.5 + 0.6 * hash(bd.id, i, k, 4), dd = 0.45, ht = 1.2 + 0.9 * s;
      const f: Frame = { a: [c[0] - t[0] * w / 2 - inw[0] * dd / 2, c[1] - t[1] * w / 2 - inw[1] * dd / 2], t, o: [-inw[0], -inw[1]], z0: h, u0: bd.id % 31 };
      // a stack: four sides and a cap slab (the frame's w runs from the stack's back to its front)
      box(F, f, 0, w, -0.2, ht, -dd, 0, BR, lod === 0 ? "flr" : "ftlr");
      quad(F, { ...f, a: [f.a[0] + inw[0] * dd + t[0] * w, f.a[1] + inw[1] * dd + t[1] * w], t: [-t[0], -t[1]], o: inw }, [[0, -0.2, 0], [w, -0.2, 0], [w, ht, 0], [0, ht, 0]], [0, 0, 1], BR);
      if (lod === 0) box(F, f, -0.06, w + 0.06, ht, ht + 0.1, -dd - 0.06, 0.06, TR, "ftblr");
      if (REC.on) REC.chimneys.push([...toMap(f, w / 2, ht + 0.1, -dd / 2).map(r2), r2(w)]);
      placed++;
    }
  }
}
