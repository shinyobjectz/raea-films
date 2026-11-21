// The furnisher: a room from its recipe (research/catalogue/rooms.ts), its measured size and a seed. This is what
// scales the hand-dressed sets to the city: every flat behind every window gets a room by these rules, the
// same on every machine (no randomness but the seed). See interiors/SYSTEM.md.
//   shellFor(recipe, seed)            the shell: size drawn from the survey spread, finishes from the recipe's items
//   furnish(recipe, shell, seed)      the props: must, most of often, some of some and war; by place kind
import type { Recipe } from "../research/catalogue/rooms";
import { hash } from "./kit/geo";
import type { MatId } from "./kit/mats";
import { def, ids } from "./kit/prop";
import { wants } from "./plan/dress";
import type { Opening, Shell, Wall } from "./shell";
import type { Place } from "./sets/types";
import { heating, longEvening } from "./plan/sun";
import { layout } from "./layout/plan";
import { fitWindow } from "./kit/kitchen";

const pick = (spread: [number, number, number], r: number) => {
  // a triangular draw between the 10% and 90% marks, peaked at the median
  const [lo, mid, hi] = spread;
  return r < 0.5 ? lo + (mid - lo) * Math.sqrt(2 * r) : hi - (hi - mid) * Math.sqrt(2 * (1 - r));
};
const has = (r: Recipe, id: string) => r.must.includes(id);
const any = (r: Recipe, id: string) => [...r.must, ...r.often, ...r.some].includes(id);

/** `seen`: the room is seen through a window (the atlas, a court view), so it has at least one. */
export function shellFor(r: Recipe, seed: number, seen = false): Shell {
  const R = (k: number) => hash(seed, k, 101);
  const l = +pick(r.size.length, R(1)).toFixed(2), d = +pick(r.size.breadth, R(2)).toFixed(2), h = +pick(r.size.height, R(3)).toFixed(2);
  const [len, dep] = l >= d ? [l, d] : [d, l];
  const walls: MatId = has(r, "wall-paper-rich") || (any(r, "wall-paper-rich") && R(4) < 0.35) ? "paper-damask" : has(r, "wall-paper-stripe") ? "paper-stripe" : has(r, "wall-limewash") ? "lime-wash" : r.part.includes("cellar") ? "brick-wash" : "lime-wash";
  const dado = has(r, "dado-paint") ? { mat: "oil-dado" as MatId, h: 1.4 } : has(r, "dado-boards") || (any(r, "dado-boards") && R(5) < 0.3) ? { mat: "wood-mid" as MatId, h: 1.0 } : undefined;
  const floor = has(r, "floor-brick") || r.part.includes("cellar") ? "brick" : has(r, "floor-parquet") ? "parquet" : "boards";
  const ceiling = has(r, "ceiling-boards") ? "boards" : r.id === "cellar" ? "vault" : "plaster";
  const nWin = r.windows.includes("two") && len > 4 ? (R(6) < 0.6 ? 2 : 1) : r.windows.includes("none") && !seen && R(8) < 0.3 ? 0 : 1;
  const openings: Opening[] = [];
  // under a mansard (attic-slope) the front wall leans in from a knee and its window is a dormer, 90 x 130 cm
  const slope = has(r, "attic-slope") ? { knee: 0.5, run: 0.85 } : undefined;
  // "tall" windows (the bel étage, the palaces): 1.3 x 2.5 m, as their fronts have them, where a flat's are 1.05 x 1.55
  const tall = r.windows.includes("tall") && !slope;
  const sill = r.part.includes("cellar") ? 1.5 : slope ? 0.55 : tall ? 0.75 : 0.85, wh = r.part.includes("cellar") ? 0.6 : slope ? 1.3 : tall ? 2.5 : 1.55;
  for (let i = 0; i < nWin; i++) openings.push({ wall: "front", u: nWin === 1 ? len / 2 : len * (i ? 0.72 : 0.28), w: slope ? 0.9 : tall ? 1.3 : 1.05, y: sill, h: Math.min(wh, (slope ? Math.max(h, 2.3) : h) - sill - 0.25), kind: "window" });
  // the back wall's door: a flat's 0.9 x 2.05 m, or a good flat's double door (door-panel), 1.4 x 2.9 m, which kit/salon.ts
  // salon-door fills (the furnisher sets it in the opening)
  const dbl = has(r, "door-panel");
  openings.push(dbl
    ? { wall: "back", u: 1.0 + R(7) * Math.max(0, len - 2.0), w: 1.4, y: 0, h: Math.min(2.9, h - 0.6), kind: "door" }
    : { wall: "back", u: 0.55 + R(7) * Math.max(0, len - 1.6), w: 0.9, y: 0, h: Math.min(2.05, h - 0.1), kind: "door" });
  // a stuccoed ceiling has its cornice round the walls (interiors/shell.ts)
  const cornice: MatId | undefined = has(r, "ceiling-stucco") ? "paint-white" : undefined;
  return { l: len, d: dep, h: slope ? Math.max(h, 2.3) : h, t: { front: 0.38, back: 0.25, left: 0.25, right: 0.25 }, walls, dado, floor, ceiling, openings, seed, slope, cornice };
}

type Rect = [number, number, number, number]; // x0 z0 x1 z1
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** The city's knobs (interiors/plan/dress.ts): the lists' chances (the clutter and war dials), the heaviest prop
 *  allowed (the detail dial), the items a household adds, and whether to keep the gallery camera's patch clear, hang
 *  door leaves and set window frames. Left out, each is what the hero sets and the window atlas were dressed with. */
export interface FurnishOpts {
  rates?: { must: number; often: number; some: number; war: number };
  trisCap?: number;
  extra?: string[];
  /** item -> how many of it: the beds a room's sleepers need (plan/life.ts); each is the same prop, placed apart */
  count?: Record<string, number>;
  /** items left out of the recipe's draw (a household's beds are its sleeping plan's, not the recipe's) */
  drop?: string[];
  gallery?: boolean;
  leaves?: boolean;
  /** window frames and curtains in openings no wider than this (a shop's plate glass gets none) */
  windowsUpTo?: number;
  /** the day of the year (1-366) and hour the room is dressed for, the same pair as the world's CityLook (day, hour):
   *  the winter's window wool from 1 November to 31 March. Unset, 15 January at noon
   *  (docs/realism.feature D17 in raea: the world has seasons) */
  when?: { day: number; hour: number };
  /** the clutter dial (plan/dress.ts), 0-1: how many small things a table or a chest takes. Unset, 0.5 */
  clutter?: number;
}

/** The props for a recipe in a shell: every item in `must`, most of `often`, a few of `some`, half of `war`. */
export function furnish(r: Recipe, sh: Shell, seed: number, opt: FurnishOpts = {}): Place[] {
  const R = (k: number, j = 0) => hash(seed, k, j, 202);
  // an item's own draw: from its whole name, never its length (every 11-letter item once shared one number, so a
  // room's tiled stove and its coal shovel were drawn together)
  // a wall's own number for its draw (by name length, back and left once drew alike and left was never tried first)
  const WI: Record<string, number> = { back: 1, left: 2, right: 3, front: 4 };
  const nameOf = (it: string) => { let h = 2166136261; for (let i = 0; i < it.length; i++) h = Math.imul(h ^ it.charCodeAt(i), 16777619); return h >>> 0; };
  // item -> the props that stand for it, as heavy as the detail dial allows
  const byItem = new Map<string, string[]>();
  const cellar = r.id === "cellar", cap = opt.trisCap ?? Infinity;
  // a home never draws a shop's fittings (the war's field post is letters on the table, not the stationer's postcard stand)
  const shop = r.id.startsWith("shop") || r.id.includes("office");
  for (const id of ids()) if (def(id)!.where !== "set" && (cellar || def(id)!.where !== "cellar") && (def(id)!.tris ?? 0) <= cap && (shop || !def(id)!.items.some((it) => it.startsWith("shop-")))) for (const it of def(id)!.items) byItem.set(it, [...(byItem.get(it) ?? []), id]);
  const want = wants(r, seed, opt.rates, opt.extra).filter((it) => !opt.drop?.includes(it));
  const props = [...new Set(want.flatMap((it) => { const c = byItem.get(it); return c ? [c[Math.floor(R(5, nameOf(it)) * c.length)]] : []; }))];
  // what the household needs (its beds, a kitchenless flat's stove) goes on the walls before what the recipe adds
  const counted = new Set<string>();
  // items that share a prop add up (a lodger's bed and the family's are both the iron bed)
  const need = new Map<string, number>();
  for (const [it, n] of Object.entries(opt.count ?? {})) {
    const c = byItem.get(it);
    if (!c) continue;
    const id = props.find((p) => def(p)!.items.includes(it)) ?? c[Math.floor(R(5, nameOf(it)) * c.length)];
    need.set(id, (need.get(id) ?? 0) + n);
    counted.add(id);
  }
  for (const [id, n] of need) for (let j = props.filter((p) => p === id).length; j < n; j++) props.push(id);

  const out: Place[] = [], used: Rect[] = [];
  const wallLen = (w: Wall) => (w === "back" || w === "front" ? sh.l : sh.d);
  const footprint = (w: Wall, u: number, wd: number, dp: number): Rect => {
    if (w === "back") return [u - wd / 2, 0, u + wd / 2, dp];
    if (w === "front") return [sh.l - u - wd / 2, sh.d - dp, sh.l - u + wd / 2, sh.d];
    if (w === "left") return [0, sh.d - u - wd / 2, dp, sh.d - u + wd / 2];
    return [sh.l - dp, u - wd / 2, sh.l, u + wd / 2];
  };
  // the gallery's view looks in from the window side at x l / 2 + 0.25, 0.3 m off the front wall (interiors/sets/gallery.ts): keep it clear
  if (opt.gallery !== false) used.push([sh.l / 2 - 0.25, sh.d - 0.8, sh.l / 2 + 0.75, sh.d]);
  // the doors keep a clear patch in front of them, a metre deep
  for (const o of sh.openings ?? []) if (o.kind === "door") used.push(footprint(o.wall, o.u, o.w + 0.2, 1.0));
  // a hole the full height (a city room running on past its box, tools/city/rooms.ts bare) has no wall to stand against
  for (const o of sh.openings ?? []) if ((o.kind === "hole" || o.kind === "arch") && o.y < 0.05) used.push(footprint(o.wall, o.u, o.w, 0.5));
  const wins = (sh.openings ?? []).filter((o) => o.kind === "window");
  /** a window's foot in the room, on its wall, and the yaw that faces into the room */
  const winAt = (o: Opening): { at: [number, number, number]; yaw: number } =>
    o.wall === "front" ? { at: [sh.l - o.u, o.y, sh.d], yaw: Math.PI } : o.wall === "back" ? { at: [o.u, o.y, 0], yaw: 0 } : o.wall === "left" ? { at: [0, o.y, sh.d - o.u], yaw: Math.PI / 2 } : { at: [sh.l, o.y, o.u], yaw: -Math.PI / 2 };
  const day = opt.when?.day ?? 15, hour = opt.when?.hour ?? 12, winter = day >= 305 || day <= 90;
  // out of the heating months, by day, some windows stand open, the inner pair swung into the room (kit/kitchen.ts
  // kastenOpen): half of them in the long evenings' weeks, a quarter in spring and autumn (ASSUMED)
  const airing = !heating(day) && hour >= 8 && hour < 21 ? (longEvening(day) ? 0.5 : 0.25) : 0;
  for (const o of wins) {
    if (o.w > (opt.windowsUpTo ?? Infinity)) continue;
    const { at, yaw } = winAt(o);
    // a window of the kit's own 1.05 by 1.55 takes its props; any other is fitted to its opening (kit/kitchen.ts fitWindow)
    const fit = Math.abs(o.w - 1.05) > 0.05 || Math.abs(o.h - 1.55) > 0.05, open = R(23, Math.round(o.u * 10)) < airing;
    const kit = (k: "kasten" | "kasten-open" | "wool" | "lace", own: string) => (fit ? fitWindow(k, o.w, o.h) : own);
    out.push({ prop: sh.slope ? "window-90x130" : open ? kit("kasten-open", "window-kasten-open") : kit("kasten", "window-kasten"), at, yaw });
    if (!sh.slope && winter) out.push({ prop: kit("wool", "window-wool"), at, yaw });
    if (!sh.slope && (props.includes("lace-curtain") || any(r, "lace-curtains"))) out.push({ prop: kit("lace", "lace-curtain"), at, yaw });
    // a palace room's velvet hangs either side of each window, floor to near the cornice
    if (!sh.slope && props.includes("palais-drape") && sh.h >= 4.2 && o.wall === "front") for (const s of [-1, 1]) out.push({ prop: "palais-drape", at: [at[0] + s * (o.w / 2 + 0.55), 0, sh.d - 0.13], yaw: Math.PI });
  }
  const place = (w: Wall, u: number, dp: number, y = 0) => {
    const k = dp / 2 + 0.01;
    if (w === "back") return { at: [u, y, k] as [number, number, number], yaw: 0 };
    if (w === "front") return { at: [sh.l - u, y, sh.d - k] as [number, number, number], yaw: Math.PI };
    if (w === "left") return { at: [k, y, sh.d - u] as [number, number, number], yaw: Math.PI / 2 };
    return { at: [sh.l - k, y, u] as [number, number, number], yaw: -Math.PI / 2 };
  };
  // what stands on the walls, and its height; what already hangs: a hung thing keeps clear of both (a clock never in a
  // telephone, a picture never in a wardrobe's front)
  const tall: { fp: Rect; h: number }[] = [], hung: { w: Wall; a: number; b: number; y0: number; y1: number }[] = [];
  const hangOn = (id: string, k: number, y: number) => {
    const p = def(id)!, [wd, ht, dp] = p.size;
    for (const w of (["back", "left", "right"] as Wall[]).sort((a, b) => hash(seed, k, WI[a] + 3) - hash(seed, k, WI[b] + 3))) {
      const L = wallLen(w);
      for (let t = 0; t < 12; t++) {
        const u = wd / 2 + 0.1 + hash(seed, k, t, 7) * Math.max(0, L - wd - 0.2);
        const doors = (sh.openings ?? []).filter((o) => o.wall === w && Math.abs(o.u - u) < (o.w + wd) / 2 + 0.1);
        if (doors.length) continue;
        if (hung.some((q) => q.w === w && q.a < u + wd / 2 + 0.05 && u - wd / 2 - 0.05 < q.b && q.y0 < y + ht && y < q.y1)) continue;
        if (tall.some((q) => overlaps(q.fp, footprint(w, u, wd, dp + 0.02)) && q.h > y - 0.05)) continue;
        hung.push({ w, a: u - wd / 2, b: u + wd / 2, y0: y, y1: y + ht });
        return place(w, u, dp, y);
      }
    }
    return null;
  };

  // a good flat's double door stands in the back wall's opening, not on a free stretch of wall
  const door = (sh.openings ?? []).find((o) => o.kind === "door" && o.wall === "back");
  if (door && props.includes("salon-door")) out.push({ prop: "salon-door", at: [door.u, 0, def("salon-door")!.size[2] / 2 + 0.01], yaw: 0 });
  // every other doorway has its leaf, shut against the cold (kit/door.ts room doors): an office's frosted one, a worker
  // home's brown one (the coats on it in one home in two), elsewhere white
  else if (door && door.h >= 1.75 && opt.leaves !== false) {
    const leaf = door.h < 1.95 ? "room-door-attic" : r.id === "office" ? "room-door-office" : r.who === "worker" ? (r.id !== "kammer" && hash(seed, 23, 0) < 0.5 ? "room-door-coats" : "room-door-brown") : "room-door-white";
    if (def(leaf)) out.push({ prop: leaf, at: [door.u, 0, 0.05], yaw: 0 });
  }
  // the floor, wall and on-top things by their groups (interiors/layout): the sofa with its table and chairs, the beds,
  // the stove in the inner corner, a way through from the door to each, small things packed on their host's top
  const list = props.filter((id) => !["window-kasten", "lace-curtain", "palais-drape", "salon-door"].includes(id));
  // a geranium on a window's sill, 12 cm in from the wall (any wall: a city room may have its windows on the side)
  for (const [k, id] of list.entries()) if (id === "geranium" && wins.length) {
    const o = wins[Math.floor(R(13, k) * wins.length)], w = winAt(o), n = [Math.sin(w.yaw), Math.cos(w.yaw)], a = (R(14, k) - 0.5) * 0.5;
    out.push({ prop: id, at: [w.at[0] + n[0] * 0.12 - n[1] * a, o.y, w.at[2] + n[1] * 0.12 + n[0] * a], yaw: R(15, k) * 6 });
  }
  const ground = list.filter((id) => id !== "geranium" && ["corner", "wall", "floor", "on"].includes(def(id)!.place));
  const propFor = (it: string) => { const c = byItem.get(it); return c ? c[Math.floor(R(5, nameOf(it)) * c.length)] : null; };
  const lay = layout({ sh, props: ground, propFor, seed, keep: used, clutter: opt.clutter ?? 0.5, frontLast: opt.gallery !== false });
  out.push(...lay.places);
  tall.push(...lay.tall);
  const table = lay.table;
  list.forEach((id, k) => {
    const p = def(id)!;
    if (p.place === "hung") {
      const y = id === "cuckoo-clock" ? 1.75 : id === "state-portrait" ? 1.95 : id === "staff-map" ? 0.95 : id === "photos" || id === "oleograph" ? 1.55 : id === "tub-hung" ? 1.0 : 1.5;
      const s = hangOn(id, k, Math.min(y, sh.h - p.size[1] - 0.05));
      if (s) out.push({ prop: id, ...s });
    } else if (p.place === "ceiling") {
      if (id.startsWith("washing")) out.push({ prop: id, at: [sh.l / 2, sh.h - 0.1, sh.d * 0.4], yaw: 0 });
      // a pull-down lamp is pulled up in a low room: its foot no lower than 1.8 m (the hook goes up into the ceiling)
      else { const y = Math.max(sh.h, 1.8 + p.size[1] * 0.93); out.push({ prop: id, at: table ? [table.at[0], y, table.at[2]] : [sh.l / 2, y, sh.d / 2] }); }
    }
  });
  return out;
}
