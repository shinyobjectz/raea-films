// A shop from its trade. The address book's entry gives the kit (research/catalogue/trades.ts kitFor); the kit gives a
// profile here; a seed gives the size, what stands where and how thin the stock is. One shop function fills every
// storefront in the city: its window in the atlas (tier 0), its room when a door opens (tier 2), a hero shot (tier 3).
//
// Leipziger Straße's ground floors : 5.4-7 m of frontage, 7-10 m deep, 3.9-4.3 m high, a
// mahogany shopfront with two display windows either side of a recessed door. Winter 1917-18: clothes and shoes only
// against a permit, the shelves half bare, a few good pieces in the window, the windows themselves barely lit (the
// coal orders cut shop and advertising light; how far in Berlin that winter is one of the catalogue's doubtful items).
import { CORNER_TRADES, cornerSet, cornerShell } from "./corner";
import { DEPT_TRADES, deptSet, deptShell } from "./department";
import { WAR_KITCHEN, warKitchenSet, warKitchenShell } from "./warkitchen";
import { BANK, bankSet, bankShell } from "./bank";
import { DRUGSTORE, PHARMACY, pharmacySet, pharmacyShell } from "./pharmacy";
import { PHOTO, photoSet, photoShell } from "./photo";
import { HOTEL, hotelSet, hotelShell } from "./hotel";
import { hash, type V3 } from "./kit/geo";
import type { MatId } from "./kit/mats";
import { def } from "./kit/prop";
import { upperRun } from "./kit/upper";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

/** A shop pane in the city, as the world lane's facade builds it (tools/world/facade.ts shopfront): one bay of a
 *  shopfront, the glass from the 0.55 m riser, 2.35 m wide (the bay less its piers), 3.6 m high. Every shop room in
 *  the atlas is seen through this, and its display card is rendered to it; a shell must stand taller than its top. */
export const SHOP_PANE = { sill: 0.55, w: 2.35, h: 3.6 };
const isCorner = (trade: string) => CORNER_TRADES.includes(trade);
const isDept = (trade: string) => DEPT_TRADES.includes(trade);

type Profile = {
  walls: MatId;
  dado: { mat: MatId; h: number };
  floor: Shell["floor"];
  /** along the back wall, repeated to fill it */
  back: string[];
  /** along the side walls, behind the window zone */
  sides: string[];
  counter: "store-counter" | "glass-counter";
  onCounter: string[];
  /** the window dressing, on a stepped stage behind each display window */
  window: string[];
  /** standing on the shop floor: the customers' chairs, a form */
  free: string[];
  /** over everything, from about 3 m to the cornice, along every wall (interiors/kit/upper.ts) */
  upper: string[];
};

const panel = { mat: "wood-dark" as MatId, h: 1.05 };
export const PROFILES: Record<string, Profile> = {
  "shop-fabric": { walls: "paper-damask", dado: panel, floor: "boards", back: ["cloth-shelves", "cloth-shelves-bare"], sides: ["cloth-shelves-bare", "cheval-mirror"], counter: "store-counter", onCounter: ["bolt-stack", "till"], window: ["fabric-fall", "fabric-fall-cream", "fabric-fall-field", "bolt-stack"], free: ["chair", "chair"], upper: ["loft-bolts", "loft-bolts-b"] },
  "shop-fashion": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["cloth-shelves-bare", "vitrine"], sides: ["cheval-mirror", "vitrine"], counter: "glass-counter", onCounter: ["hat-stand", "bolt-stack"], window: ["coat-form-navy", "dress-form", "hat-stand", "fabric-fall-cream"], free: ["dress-form", "chair"], upper: ["loft-cartons", "loft-bolts", "loft-cartons-b", "loft-bolts-b"] },
  "shop-furs": { walls: "paper-damask", dado: panel, floor: "boards", back: ["vitrine", "cheval-mirror"], sides: ["fur-coat-form", "cheval-mirror"], counter: "glass-counter", onCounter: ["hatbox-stack"], window: ["fur-coat-form", "fur-coat-form", "hat-stand"], free: ["chair", "fur-coat-form"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-hats": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["vitrine", "hatbox-stack"], sides: ["cheval-mirror", "hatbox-stack"], counter: "glass-counter", onCounter: ["hat-stand", "hat-stand-homburg"], window: ["hat-stand-tall", "hat-stand", "hat-stand-homburg", "hatbox-stack"], free: ["chair", "hat-stand-tall"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-menswear": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["cloth-shelves-bare", "vitrine"], sides: ["coat-form-field", "cheval-mirror"], counter: "store-counter", onCounter: ["hat-stand-homburg", "bolt-stack"], window: ["coat-form-field", "coat-form-navy", "hat-stand-homburg"], free: ["chair"], upper: ["loft-bolts", "loft-cartons", "loft-bolts-b", "loft-cartons-b"] },
  "shop-shoes": { walls: "lime-wash", dado: { mat: "wood-mid", h: 1.05 }, floor: "boards", back: ["shoe-shelves"], sides: ["shoe-shelves", "cheval-mirror"], counter: "store-counter", onCounter: ["shoe-pair", "till"], window: ["shoe-pair", "shoe-pair", "shoe-pair"], free: ["chair", "chair"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-small-goods": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["vitrine"], sides: ["vitrine", "cheval-mirror"], counter: "glass-counter", onCounter: ["till", "hatbox-stack"], window: ["dress-form", "shoe-pair", "hat-stand"], free: ["chair"], upper: ["loft-cartons", "loft-cartons-b"] },
  // read from the Adreßbuch with no room of their own until 11-17 (interiors/kit/trade.ts)
  "shop-books-music": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["book-wall", "book-wall-ladder", "paper-rack"], sides: ["book-wall", "paper-rack", "book-wall"], counter: "store-counter", onCounter: ["book-stack", "till"], window: ["book-pyramid", "book-stand", "globe", "book-pyramid"], free: ["book-table", "postcard-stand"], upper: ["loft-books", "loft-books-b"] },
  "shop-jeweller": { walls: "paper-damask", dado: panel, floor: "boards", back: ["clock-board", "vitrine", "clock-case"], sides: ["vitrine", "watch-bench", "clock-case", "vitrine"], counter: "glass-counter", onCounter: ["watch-tray", "ring-tray"], window: ["jewel-etagere", "watch-stand", "gold-for-iron", "jewel-etagere", "mantel-clock"], free: ["chair", "chair"], upper: ["clock-shelf"] },
  // the last three that stood in on small goods (interiors/kit/goods.ts, 11-17): what each window sold to the front
  "shop-optician": { walls: "paper-stripe", dado: panel, floor: "boards", back: ["lens-cabinet", "vitrine", "lens-cabinet"], sides: ["lens-cabinet", "sight-test", "vitrine"], counter: "glass-counter", onCounter: ["spectacle-tray", "field-glasses"], window: ["field-glasses", "spectacle-stand", "periscope", "barometer"], free: ["chair", "chair"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-leather": { walls: "paper-stripe", dado: { mat: "wood-mid", h: 1.05 }, floor: "boards", back: ["case-shelves", "belt-rail", "case-shelves"], sides: ["case-shelves", "belt-rail", "vitrine"], counter: "store-counter", onCounter: ["satchel", "map-case"], window: ["suitcase-stack", "satchel", "map-case", "satchel"], free: ["trunk", "chair"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-glass-silver": { walls: "paper-damask", dado: panel, floor: "boards", back: ["glass-shelves", "vitrine"], sides: ["glass-shelves", "crystal-etagere", "vitrine"], counter: "glass-counter", onCounter: ["cutlery-case", "silver-tray"], window: ["crystal-etagere", "silver-tray", "decanter-row", "cutlery-case", "decanter-row"], free: ["chair"], upper: ["loft-cartons", "loft-cartons-b"] },
  "shop-florist": { walls: "lime-wash", dado: { mat: "tile-white", h: 1.2 }, floor: "tiles", back: ["plant-staging", "flower-buckets"], sides: ["wreath-stand", "plant-staging", "flower-buckets"], counter: "store-counter", onCounter: ["flower-paper", "wreath-small"], window: ["wreath-stand", "fir-bucket", "wreath-small", "fir-bucket"], free: ["wreath-stand", "fir-bucket"], upper: ["wreath-rail"] },
};
export const SHOP_TRADES = Object.keys(PROFILES);

/** The shop's shell: a size drawn for the street, the profile's walls, the shopfront's opening and a back door. */
export function shopShell(trade: string, seed: number): Shell {
  if (isCorner(trade)) return cornerShell(trade, seed);
  if (isDept(trade)) return deptShell(trade, seed);
  if (trade === WAR_KITCHEN) return warKitchenShell(seed);
  if (trade === BANK) return bankShell(seed);
  if (trade === PHARMACY || trade === DRUGSTORE) return pharmacyShell(trade, seed);
  if (trade === PHOTO) return photoShell(seed);
  if (trade === HOTEL) return hotelShell(seed);
  // 4.35-4.7 m clear: the facade's shop storey is 5.1 m floor to floor, and the city's pane reaches 4.15 m
  const p = PROFILES[trade], r = (k: number) => hash(seed, k, 401);
  const l = 5.6 + 1.4 * r(1), d = 7 + 3 * r(2), h = 4.35 + 0.35 * r(3);
  return {
    l, d, h, t: { back: 0.38, front: 0.64, left: 0.25, right: 0.25 },
    walls: p.walls, dado: p.dado, floor: p.floor, ceiling: "plaster", seed: Math.floor(seed * 7) % 997,
    openings: [
      { wall: "front", u: l / 2, w: 5.0, y: 0, h: 3.3, kind: "door" }, // the shopfront fills it
      { wall: "back", u: l - 0.7, w: 0.9, y: 0, h: 2.2, kind: "door" }, // to the stockroom and the court
    ],
  };
}

/** What a shop holds, placed: shopfront, window stages and their dressing, counter and what is on it, the walls
 *  filled from the profile, chairs and forms on the floor, two pendants (one lit: the coal orders). */
export function shopProps(trade: string, sh: Shell, seed: number, lit = true): Place[] {
  const P = PROFILES[trade], r = (k: number) => hash(seed, k, 402), p: Place[] = [];
  const { l, d, h } = sh;
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: "shopfront-pair", ...front });
  p.push({ prop: "ration-notice", ...onProp(front, [1.4 + 0.3 * r(1), 1.35, 0.16]), yaw: Math.PI }); // "only against a permit"
  // the window stages, either side of the door, and two pieces on each
  for (const s of [-1, 1]) {
    const stage = { at: [l / 2 + s * 1.525, 0, d - 0.55] as V3, yaw: 0 };
    p.push({ prop: "display-steps", ...stage });
    let first = "";
    for (const [k, x] of [[0, -0.4], [1, 0.4]] as const) {
      // never the same piece twice on a stage when the list has others (a window of two placards reads as shut)
      let i = Math.floor(r(10 + k + (s + 1) * 2) * P.window.length);
      while (P.window[i % P.window.length] === first && P.window.some((w) => w !== first)) i++;
      const id = P.window[i % P.window.length], on = def(id)?.place === "on";
      first = id;
      p.push({ prop: id, ...onProp(stage, [x, on ? 0.55 : 0.3, on ? -0.32 : 0.17]), yaw: (r(20 + k + s) - 0.5) * 0.5 });
    }
  }
  // the counter across the shop, its customer side to the street
  const counter = { at: [l / 2 - 0.3 + 0.4 * r(2), 0, d * (0.38 + 0.08 * r(3))] as V3, yaw: 0 };
  const topY = P.counter === "glass-counter" ? 0.95 : 0.93;
  p.push({ prop: P.counter, ...counter });
  P.onCounter.forEach((id, i) => p.push({ prop: id, ...onProp(counter, [-0.7 + i * 0.9, topY, -0.05]), yaw: (r(30 + i) - 0.5) * 0.6 }));
  // the walls: back (clear of its door), then each side behind the window zone
  // each piece at most so many times a shop (one cheval glass, two of a form), so a wall is never a row of one thing
  const used = new Map<string, number>(), cap = (id: string) => (id === "cheval-mirror" ? 1 : /form|stand/.test(id) ? 2 : 4);
  const fill = (wall: "back" | "left" | "right", list: string[], from: number, to: number, k: number) => {
    let u = from, i = Math.floor(r(k) * list.length);
    while (true) {
      const free = list.filter((x) => (used.get(x) ?? 0) < cap(x));
      if (!free.length) break;
      const id = free[i++ % free.length], sz = def(id)?.size ?? [1, 1, 0.5];
      if (u + sz[0] > to) break;
      used.set(id, (used.get(id) ?? 0) + 1);
      p.push({ prop: id, ...onWall(sh, wall, u + sz[0] / 2, sz[2]) });
      u += sz[0] + 0.12 + 0.2 * r(k + i);
    }
  };
  fill("back", P.back, 0.3, l - 1.3, 40);
  fill("left", P.sides, 1.5, d - 0.65, 50); // the left wall's u runs from the street end, clear of the back wall's shelves
  fill("right", P.sides, 0.65, d - 1.5, 60); // the right wall's from the back
  // chairs at the counter for the customers, a form or stand on the floor nearer the windows
  P.free.forEach((id, i) => {
    const chair = id === "chair";
    p.push({ prop: id, at: chair ? [counter.at[0] - 0.6 + i * 1.0, 0, counter.at[2] + 0.75] : [l * (i % 2 ? 0.8 : 0.2) + 0.3 * (r(70 + i) - 0.5), 0, d - 2.4], yaw: chair ? Math.PI + (r(72 + i) - 0.5) * 0.6 : r(74 + i) * 6 });
  });
  p.push({ prop: "store-pendant", at: [l * 0.33, h, d * 0.5], name: "pendant-a", lit }, { prop: "store-pendant", at: [l * 0.67, h, d * 0.5], name: "pendant-b", lit: false });
  // the upper zone, stock to the cornice over all of it: what the street sees through the pane's upper half
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.3]) as [number, number, number];
  const upper = (wall: "back" | "left" | "right", u0: number, u1: number, k: number) =>
    upperRun(P.upper, u0, u1, h, size, seed * 97 + k).forEach(([id, u, y]) => p.push({ prop: id, ...onWall(sh, wall, u, size(id)[2], y) }));
  upper("back", 0.2, l - 0.2, 1);
  upper("left", 1.3, d - 0.45, 2); // u from the street end, clear of the back run's ends
  upper("right", 0.45, d - 1.3, 3); // u from the back
  return p;
}

/** A shop as a set to look at: the street view through the window at dusk, and the view inside from the door. */
export function shopSet(trade: string, seed: number): Set {
  if (isCorner(trade)) return cornerSet(trade, seed);
  if (isDept(trade)) return deptSet(trade, seed);
  if (trade === WAR_KITCHEN) return warKitchenSet(seed);
  if (trade === BANK) return bankSet(seed);
  if (trade === PHARMACY || trade === DRUGSTORE) return pharmacySet(trade, seed);
  if (trade === PHOTO) return photoSet(seed);
  if (trade === HOTEL) return hotelSet(seed);
  const sh = shopShell(trade, seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: shopProps(trade, sh, seed) };
  return {
    id: `${trade}-${Math.round(seed * 100)}`,
    title: `${trade.replace("shop-", "")} shop, generated (seed ${seed})`,
    use: "every storefront of its trade: the window from the street (atlas), the room when its door opens",
    rooms: [room],
    cams: [
      { id: "street", eye: [l / 2 - 1.3, 1.6, d + 3.2], at: [l / 2 + 0.2, 1.25, d - 3], fov: 48, note: "from the pavement at dusk: the window, the shop behind" },
      { id: "inside", eye: [l / 2 + 0.3, 1.6, d - 1.2], at: [l * 0.4, 1.1, 0.5], fov: 64, note: "inside the door: counter, shelves, mirror" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }], // the street's gas lamp
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.2, dirt: 0.3, edges: 0.3 },
  };
}

/** A shop's room behind a door in a street that isn't its own set (the world lane's): the door's frame at `at` (the
 *  opening's bottom middle where the frame and its glass stand) and `normal` the facade's outward normal. The room's
 *  front wall and its shopfront are left out, since the street's facade is the front, and the rest is the shop as shopSet
 *  makes it, placed by the shopfront's frame (kit/door.ts): a point q of the shop lands at
 *  at + (q.x - l/2) * along + q.y * up + (q.z - d) * normal, along = [n.z, 0, -n.x]. The street's own pane in that door
 *  has to go, or the leaf swings in behind its glass. */
export function shopBehind(trade: string, seed: number, at: [number, number, number], normal: [number, number, number]): Set {
  const s = shopSet(trade, seed), r = s.rooms[0], { l, d } = r.shell;
  const k = Math.hypot(normal[0], normal[2]), n = [normal[0] / k, 0, normal[2] / k], along = [n[2], 0, -n[0]];
  const room: Room = {
    ...r,
    id: `${r.id}-behind`,
    shell: { ...r.shell, skip: [...(r.shell.skip ?? []), "front"], openings: (r.shell.openings ?? []).filter((o) => o.wall !== "front") },
    props: r.props.filter((p) => !p.prop.startsWith("shopfront")),
    at: [at[0] - (l / 2) * along[0] - d * n[0], at[1], at[2] - (l / 2) * along[2] - d * n[2]],
    yaw: Math.atan2(n[0], n[2]),
  };
  // the street brings its own sun, sky, fog and street lights; the set's are in its own coordinates, so they stay out
  return { ...s, id: `${s.id}-behind`, rooms: [room], cams: [], sky: [], outside: [], windows: undefined, sun: undefined, fog: undefined };
}
