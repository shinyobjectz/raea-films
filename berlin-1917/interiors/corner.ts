// A side street's shop from its trade (interiors/kit/corner.ts): the baker, grocer, butcher, dairy, tobacconist, barber,
// Destille and coal merchant of every block. Like interiors/shops.ts for Leipziger Straße, a seed gives the size, what
// stands where and how thin the stock is, and one function fills every storefront of its trade: its window in the
// atlas (tier 0), its room when the door opens (tier 2), a hero shot (tier 3). shopSet() in shops.ts dispatches here.
//
// Ground floors of the Friedrichstadt's tenements: 4.6-5.8 m of frontage, 5.5-8 m deep, 4.3-4.6 m high (the world
// lane's shop storeys are 5.1 m floor to floor), one display window and a glazed door, the shopkeeper's flat through
// the back door. Winter 1917-18: queues at the door, a ration notice in the window, the stock what the cards allow.
import { hash, type V3 } from "./kit/geo";
import type { MatId } from "./kit/mats";
import { def } from "./kit/prop";
import { upperRun } from "./kit/upper";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

type Wall = "back" | "left" | "right";
/** The four counter shops share one plan: a counter across the shop, fixtures on the walls behind and beside it, goods
 *  on the floor in front of it for the customer, the window's podium. */
type Plan = {
  walls: MatId;
  dado?: { mat: MatId; h: number };
  floor: Shell["floor"];
  counter: string;
  onCounter: string[];
  /** along the back wall behind the counter, in order */
  back: string[];
  /** along the side walls */
  sides: string[];
  /** on the floor in the customers' half */
  floorItems: string[];
  /** on the window's podium */
  window: string[];
  /** over everything, from about 3 m to the cornice (interiors/kit/upper.ts); "-" a stretch of bare wall */
  upper?: string[];
};

const PLANS: Record<string, Plan> = {
  // the baker: tiled to shoulder height, slatted bread shelves with a few dark K-Brot loaves (bare by mid-morning), the
  // counter with the scale, an empty cake case and the till; the hero bakery (a hand-built set) is its close-up
  "shop-baker": {
    walls: "lime-wash", dado: { mat: "tile-white", h: 1.65 }, floor: "tiles", counter: "shop-counter",
    onCounter: ["scale", "cake-case", "till"], back: ["bread-shelf"], sides: ["bread-shelf", "enamel-sign"],
    floorItems: ["barrel"], window: ["loaves-3", "bread-basket", "loaves-2"], upper: ["ad-frieze", "loft-cartons-b", "-"],
  },
  "shop-grocer": {
    walls: "lime-wash", dado: { mat: "wood-mid", h: 1.0 }, floor: "boards", counter: "grocer-counter",
    onCounter: ["scale", "shop-coffee-mill", "till"], back: ["drawer-wall", "jar-shelf"], sides: ["jar-shelf", "enamel-sign"],
    floorItems: ["sack-open", "sack-open", "barrel"], window: ["tin-pyramid", "sugar-loaf", "sugar-loaf"], upper: ["loft-tins", "loft-tins-b", "ad-frieze", "loft-tins-b", "loft-tins"],
  },
  "shop-butcher": {
    walls: "lime-wash", dado: { mat: "tile-white", h: 2.0 }, floor: "tiles", counter: "butcher-counter",
    onCounter: ["scale", "meat-trays", "till"], back: ["meat-rail", "cold-room-door"], sides: ["meat-rail-bare", "cashier-desk"],
    floorItems: [], window: ["meat-trays"], upper: ["ad-frieze", "-"],
  },
  "shop-dairy": {
    walls: "lime-wash", dado: { mat: "tile-white", h: 1.6 }, floor: "tiles", counter: "dairy-counter",
    onCounter: ["cheese-bell", "scale", "egg-basket"], back: ["cold-room-door", "milk-measures"], sides: ["cashier-desk", "enamel-sign"],
    floorItems: ["milk-churn"], window: ["cheese-bell", "egg-basket", "milk-churn"], upper: ["loft-tins", "ad-frieze", "loft-tins-b"],
  },
  "shop-tobacco": {
    walls: "paper-stripe", dado: { mat: "wood-dark", h: 1.0 }, floor: "boards", counter: "glass-counter",
    onCounter: ["cigar-lighter", "tobacco-jars", "cigar-boxes"], back: ["cigar-cabinet", "pipe-rack"], sides: ["pipe-rack", "enamel-sign"],
    floorItems: [], window: ["cigar-boxes", "tobacco-jars", "cigar-boxes"], upper: ["loft-cartons", "ad-frieze", "loft-cartons-b"],
  },
};
export const CORNER_TRADES = [...Object.keys(PLANS), "shop-barber", "shop-destille", "shop-konditorei", "shop-weinstube", "coal-cellar-shop"];

/** Where a hung prop goes up the wall (its bottom), metres. */
const HANG: Record<string, number> = {
  "jar-shelf": 1.25, "meat-rail": 1.35, "meat-rail-bare": 1.35, "milk-measures": 1.45, "pipe-rack": 1.45, "newspaper-holders": 1.0,
  regulator: 1.85, "enamel-sign": 2.15, "gas-water-heater": 1.15,
};

/** The shell: a tenement's ground-floor shop with its shopfront's opening and the door to the flat behind; the coal
 *  merchant's a vaulted cellar with a window at the pavement and the door from its steps. */
export function cornerShell(trade: string, seed: number): Shell {
  const r = (k: number) => hash(seed, k, 501), s = Math.floor(seed * 7) % 997;
  if (trade === "coal-cellar-shop") {
    const l = 4.4 + 1.0 * r(1), d = 6 + 2 * r(2), h = 2.5 + 0.2 * r(3);
    return {
      l, d, h, t: { back: 0.5, front: 0.64, left: 0.38, right: 0.38 }, walls: "lime-sooty", vaultMat: "lime-sooty", floor: "brick", ceiling: "vault", seed: s,
      openings: [
        { wall: "front", u: l * 0.35, w: 1.0, y: h - 0.95, h: 0.75, kind: "window" }, // at the pavement, a grating outside
        { wall: "front", u: l - 0.75, w: 1.0, y: 0, h: 2.0, kind: "door" }, // from the steps down off the street
      ],
    };
  }
  const wein = trade === "shop-weinstube"; // a wine house takes a main street'"'"'s ground floor: wider and deeper
  const p = PLANS[trade], l = wein ? 6.0 + 1.4 * r(1) : 4.6 + 1.2 * r(1), d = wein ? 8 + 2 * r(2) : 5.5 + 2.5 * r(2), h = 4.3 + 0.3 * r(3);
  const pub = trade === "shop-destille", cafe = trade === "shop-konditorei", leftDoor = trade === "shop-barber" || pub; // these two keep the yard door on the left
  return {
    l, d, h, t: { back: 0.38, front: 0.64, left: 0.25, right: 0.25 }, seed: s,
    walls: p?.walls ?? (cafe || wein ? "paper-damask" : pub ? "paper-stripe" : "lime-wash"), dado: p?.dado ?? (wein ? { mat: "wood-dark", h: 1.95 } : pub || cafe ? { mat: "wood-dark", h: cafe ? 0.95 : 1.15 } : { mat: "oil-dado", h: 1.2 }),
    floor: p?.floor ?? (cafe ? "tiles" : "boards"), ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 4.2, y: 0, h: 3.6, kind: "door" }, // the shopfront fills it
      { wall: "back", u: leftDoor ? 0.75 : l - 0.75, w: 0.95, y: 0, h: 2.3, kind: "door" }, // the flat behind, or the yard
    ],
  };
}

/** The window's centre across the shop (room x): the shopfront stands centred, its window to one side. */
export const cornerWindowX = (sh: Shell) => sh.l / 2 + 0.85;

/** What a side-street shop holds, placed. */
export function cornerProps(trade: string, sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 502), p: Place[] = [];
  const { l, d, h } = sh;
  if (trade === "coal-cellar-shop") return coalProps(sh, r, lit);
  // the shopfront, the notice on its glass, the door to the flat
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.55 ? "shopfront-small-green" : "shopfront-small-brown", ...front });
  p.push({ prop: "ration-notice", ...onProp(front, [-0.2 - 0.4 * r(2), 1.45, -0.14]), yaw: Math.PI });
  if (r(5) < 0.7) p.push({ prop: "war-poster", ...onProp(front, [0.95, 1.15, -0.14]), yaw: 0 }); // on the door glass, to the street
  const back = sh.openings!.find((o) => o.wall === "back")!;
  p.push({ prop: "parlour-door", at: [back.u, 0, -0.1], yaw: 0 });
  // the window's podium and what stands on it
  const podium = { at: [cornerWindowX(sh), 0, d - 0.55] as V3, yaw: 0 };
  p.push({ prop: "window-podium", ...podium, name: "display" });
  const used = new Map<string, number>(), cap = (id: string) => (/door|desk|counter|cabinet|drawer|console/.test(id) ? 1 : 2);
  const fill = (wall: Wall, list: string[], from: number, to: number, k: number) => {
    let u = from, i = Math.floor(r(k) * list.length);
    for (let n = 0; n < 12; n++) {
      // the next piece in turn that still fits; when none does, the wall is full
      const free = list.filter((x) => (used.get(x) ?? 0) < cap(x));
      const fits = free.map((_, j) => free[(i + j) % free.length]).find((x) => u + (def(x)?.size[0] ?? 1) <= to);
      if (!fits) break;
      i++;
      const id = fits, sz = def(id)?.size ?? [1, 1, 0.5];
      used.set(id, (used.get(id) ?? 0) + 1);
      p.push({ prop: id, ...onWall(sh, wall, u + sz[0] / 2, sz[2], HANG[id] ?? 0) });
      u += sz[0] + 0.15 + 0.25 * r(k + i);
    }
  };
  const pendant = (x: number, z: number, name: string, on: boolean) => p.push({ prop: "shop-pendant", at: [x, h, z], name, lit: on && lit });
  if (trade === "shop-barber") { const own = barberProps(sh, r, fill, pendant, podium); return [...p, ...own]; } // own first: fill and pendant push into p
  if (trade === "shop-destille") { const own = pubProps(sh, r, fill, pendant, podium); return [...p, ...own]; }
  if (trade === "shop-konditorei") { const own = cafeProps(sh, r, pendant, podium); return [...p, ...own]; }
  if (trade === "shop-weinstube") { const own = weinstubeProps(sh, r, pendant, podium); return [...p, ...own]; }

  const P = PLANS[trade];
  P.window.forEach((id, i) => p.push({ prop: id, ...onProp(podium, [-0.65 + i * 0.65, 0.55, (r(10 + i) - 0.5) * 0.2]), yaw: (r(14 + i) - 0.5) * 0.5 }));
  // the counter across the shop, the shopkeeper's side to the back wall
  const counter = { at: [l / 2 - 0.2 + 0.4 * r(3), 0, Math.min(d * 0.42, 2.9) + 0.3 * r(4)] as V3, yaw: 0 };
  const cw = def(P.counter)?.size[0] ?? 3, top = def(P.counter)?.size[1] ?? 0.95;
  p.push({ prop: P.counter, ...counter });
  P.onCounter.forEach((id, i) => p.push({ prop: id, ...onProp(counter, [-cw / 2 + 0.45 + (i * (cw - 0.9)) / Math.max(1, P.onCounter.length - 1), top, -0.08]), yaw: (r(20 + i) - 0.5) * 0.4 }));
  // the walls: the back clear of the flat's door; the left wall in the customers' half (between the counter's front and
  // the window zone), the right wall behind the counter, so neither runs into the counter's ends
  const cz = counter.at[2], cd = def(P.counter)?.size[2] ?? 0.75;
  fill("back", P.back, 0.25, back.u - 0.65, 30);
  fill("left", P.sides, 1.2, d - (cz + cd / 2 + 0.35), 40); // u from the street end
  fill("right", P.sides, 0.6, cz - cd / 2 - 0.3, 50); // u from the back
  // the customers' half: sacks, a barrel, a churn by the walls between counter and window
  P.floorItems.forEach((id, i) => {
    const sz = def(id)?.size ?? [0.5, 0.5, 0.5], left = i % 2 === 0;
    p.push({ prop: id, at: [left ? 0.2 + sz[0] / 2 + 0.6 * Math.floor(i / 2) : l - 0.25 - sz[0] / 2, 0, counter.at[2] + 0.75 + 0.3 * r(60 + i)], yaw: (r(64 + i) - 0.5) * 0.8 });
  });
  // the baker's shelves: loaves on some boards, the rest bare (the day's ration sold by mid-morning)
  if (trade === "shop-baker")
    p.filter((q) => q.prop === "bread-shelf").forEach((s, j) => {
      [0.53, 1.01, 1.43].forEach((y, b) => [-0.65, 0.65].forEach((x, k) => {
        const v = r(80 + j * 8 + b * 2 + k);
        if (v < 0.5) p.push({ prop: v < 0.2 ? "loaves-2" : "loaves-3", ...onProp(s, [x, y, 0.04]) });
      }));
    });
  if (trade === "shop-butcher") p.push({ prop: "chopping-block", at: [l / 2 + 0.9 * (r(70) - 0.5) * 2, 0, Math.max(0.75, counter.at[2] - 1.0)], yaw: r(71) * 6 });
  // the dairy's churns on the staff side of the counter, where the milk is ladled out
  if (trade === "shop-dairy") for (let i = 0; i < 3; i++) p.push({ prop: "milk-churn", at: [l / 2 - 0.5 + i * 0.42, 0, cz - cd / 2 - 0.35], yaw: r(72 + i) * 6 });
  p.push({ prop: "regulator", ...onWall(sh, "back", back.u, 0.15, 2.45) }); // over the flat's door
  pendant(l / 2, counter.at[2], "pendant-a", true);
  pendant(l / 2, Math.min(d - 1.4, cz + cd / 2 + 1.0), "pendant-b", true); // over the customers, so the counter's front is seen
  // the upper zone to the cornice (interiors/kit/upper.ts): the back wall either side of the regulator over the flat's
  // door, the side walls clear of the shopfront and the back run's ends
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.3]) as [number, number, number];
  const upper = (wall: Wall, u0: number, u1: number, k: number) =>
    upperRun(P.upper ?? [], u0, u1, h, size, seed * 89 + k).forEach(([id, u, y]) => p.push({ prop: id, ...onWall(sh, wall, u, size(id)[2], y) }));
  upper("back", 0.25, back.u - 0.55, 1);
  upper("back", back.u + 0.55, l - 0.25, 2);
  upper("left", 1.2, d - 0.42, 3);
  upper("right", 0.42, d - 1.2, 4);
  return p;
}

type Fill = (wall: Wall, list: string[], from: number, to: number, k: number) => void;
type Pendant = (x: number, z: number, name: string, on: boolean) => void;

/** The barber: two or three places along the right wall (console, chair facing it), the waiting bench and newspapers
 *  opposite, the water heater and the stove by the back. */
function barberProps(sh: Shell, r: (k: number) => number, fill: Fill, pendant: Pendant, podium: { at: V3; yaw: number }): Place[] {
  const { l, d } = sh, p: Place[] = [];
  const n = d > 7 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const u = 1.0 + i * 1.6, c = onWall(sh, "right", u, 0.5);
    p.push({ prop: "barber-console", ...c });
    p.push({ prop: "barber-chair", at: [c.at[0] - 0.95, 0, c.at[2]], yaw: Math.PI / 2 + (r(80 + i) - 0.5) * 0.3 });
  }
  p.push({ prop: "waiting-bench", ...onWall(sh, "left", 2.1, 0.45) }); // left wall: u from the street end
  p.push({ prop: "newspaper-holders", ...onWall(sh, "left", 2.1, 0.08, HANG["newspaper-holders"] + 0.6) });
  p.push({ prop: "gas-water-heater", ...onWall(sh, "back", 1.9, 0.36, HANG["gas-water-heater"]) });
  p.push({ prop: "iron-stove", at: [2.45, 0, 0.45], yaw: 0 });
  p.push({ prop: "regulator", ...onWall(sh, "back", 0.75, 0.15, 2.45) }); // over the yard door
  p.push({ prop: "bottle-row", ...onProp(podium, [-0.4, 0.55, 0.05]), yaw: 0.1 }, { prop: "aspidistra", ...onProp(podium, [0.55, 0.55, 0]), yaw: r(85) * 6 });
  fill("left", ["enamel-sign"], 1.0, 2.0, 86);
  pendant(l * 0.62, d * 0.4, "pendant-a", true);
  pendant(l * 0.62, d * 0.75, "pendant-b", r(87) < 0.5);
  return p;
}

/** The corner Destille: the bar across the back third, the back bar and the spirit casks against the back wall, two
 *  or three tables with chairs, the stove, the bench by the window, signs, the clock. */
function pubProps(sh: Shell, r: (k: number) => number, fill: Fill, pendant: Pendant, podium: { at: V3; yaw: number }): Place[] {
  const { l, d } = sh, p: Place[] = [];
  // the bar from the left wall, its open end on the right where the landlord goes behind it; the back bar right of the
  // yard door; the casks beside it when the back wall is long enough, else on the right wall behind the bar
  const bz = 1.55 + 0.3 * r(90);
  const bar = { at: [0.2 + 1.6, 0, bz] as V3, yaw: 0 };
  p.push({ prop: "bar-counter", ...bar });
  p.push({ prop: "beer-pump", ...onProp(bar, [0.9, 1.0, -0.12]), yaw: 0 });
  p.push({ prop: "back-bar", ...onWall(sh, "back", 1.45 + 1.4, 0.5) });
  p.push({ prop: "spirit-casks", ...(l >= 6.2 ? onWall(sh, "back", 4.4 + 0.85, 0.5) : onWall(sh, "right", 0.3 + 0.85, 0.5)) });
  const tables = d > 6.5 ? 3 : 2;
  for (let i = 0; i < tables; i++) {
    const tx = i % 2 ? l * 0.28 : l * 0.7, tz = bz + 1.6 + i * 1.25 + 0.2 * r(91 + i);
    if (tz > d - 1.1) break;
    p.push({ prop: "pub-table", at: [tx, 0, tz], yaw: (r(94 + i) - 0.5) * 0.4 });
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3 + r(97 + i) * 2;
      p.push({ prop: "chair", at: [tx + Math.sin(a) * 0.62, 0, tz + Math.cos(a) * 0.62], yaw: a + Math.PI + (r(100 + i * 3 + k) - 0.5) * 0.5 });
    }
  }
  p.push({ prop: "iron-stove", at: [l - 0.5, 0, bz + 1.15], yaw: -Math.PI / 2 });
  p.push({ prop: "waiting-bench", ...onWall(sh, "left", 1.2, 0.45) });
  p.push({ prop: "newspaper-holders", ...onWall(sh, "left", 2.9, 0.08, HANG["newspaper-holders"] + 0.6) });
  p.push({ prop: "regulator", ...onWall(sh, "back", 0.75, 0.15, 2.45) }); // over the yard door
  fill("right", ["enamel-sign", "enamel-sign"], 2.3, d - 1.4, 104);
  p.push({ prop: "bottle-row", ...onProp(podium, [-0.45, 0.55, 0.05]), yaw: -0.1 }, { prop: "aspidistra", ...onProp(podium, [0.5, 0.55, 0]), yaw: r(105) * 6 });
  pendant(l * 0.42, bz, "pendant-a", true);
  pendant(l * 0.5, Math.min(d - 1.6, bz + 2.6), "pendant-b", true);
  return p;
}

/** The Konditorei-café: the buffet across the back with the cake case and an étagère, a gilt mirror behind it; the
 *  banquette down the right wall under a second mirror, marble tables before it with a chair across each; a free table
 *  in the middle; the coats and the newspapers on the left wall by the door; a palm by the window when there's room. */
/** The Weinstube (kit/wine.ts): panelled to above the head, the buffet across the back left with the wine racks behind
 *  it and the casks on their stillage, booths down the right wall, clothed tables in the room, the house notice by the
 *  door (the meatless days). Bigger than a side-street shop: the wine houses took a main street's ground floor. */
function weinstubeProps(sh: Shell, r: (k: number) => number, pendant: Pendant, podium: { at: V3; yaw: number }): Place[] {
  const { l, d } = sh, p: Place[] = [];
  const chairAt = (tx: number, tz: number, a: number, k: number) =>
    p.push({ prop: "bentwood-chair", at: [tx + Math.sin(a) * 0.56, 0, tz + Math.cos(a) * 0.56], yaw: a + Math.PI + (r(k) - 0.5) * 0.35 });
  // the buffet from the left wall, the racks and casks behind it on the back wall
  const bz = 1.35 + 0.2 * r(130);
  const buffet = { at: [0.2 + 1.6, 0, bz] as V3, yaw: 0 };
  p.push({ prop: "bar-counter", ...buffet });
  p.push({ prop: "bottle-row", ...onProp(buffet, [-0.6, 1.06, -0.1]), yaw: 0 }, { prop: "till", ...onProp(buffet, [1.1, 1.06, -0.1]), yaw: 0.15 });
  const back = sh.openings!.find((o) => o.wall === "back")!;
  p.push({ prop: "wine-rack", ...onWall(sh, "back", 1.0, 0.42) }, { prop: "wine-rack", ...onWall(sh, "back", 2.65, 0.42) });
  if (back.u - 0.6 > 4.6) p.push({ prop: "spirit-casks", ...onWall(sh, "back", 3.45 + 0.85, 0.5) });
  // the booths down the right wall (u from the back): a banquette, a clothed table, two chairs across it
  const b0 = bz + 1.2, bw = def("banquette")?.size[0] ?? 2, room = d - 1.4 - b0, n = Math.min(3, Math.floor((room + 0.1) / (bw + 0.1)));
  for (let i = 0; i < n; i++) {
    const u = b0 + bw / 2 + i * (bw + 0.1), tx = l - 0.25 - 0.6 - 0.42;
    p.push({ prop: "banquette", ...onWall(sh, "right", u, 0.6) });
    p.push({ prop: "wine-table", at: [tx, 0, u], yaw: 0 });
    chairAt(tx, u - 0.3, -Math.PI / 2, 131 + i * 2);
    chairAt(tx, u + 0.3, -Math.PI / 2, 132 + i * 2);
  }
  // clothed tables in the room, two chairs each, clear of the way in
  for (let i = 0, tz = bz + 1.9; tz < d - 1.6 && i < 3; i++, tz += 1.9) {
    const tx = l * 0.3 + (i % 2) * 0.3;
    p.push({ prop: "wine-table", at: [tx, 0, tz], yaw: (r(140 + i) - 0.5) * 0.3 });
    chairAt(tx, tz, Math.PI / 2 + 0.2, 143 + i);
    chairAt(tx, tz, -Math.PI / 2 - 0.1, 146 + i);
  }
  // by the door (left wall, u from the street end): the coat stand, the house notice; the clock over the back door
  p.push({ prop: "coat-stand", ...onWall(sh, "left", 0.9, 0.5) });
  p.push({ prop: "meatless-notice", ...onWall(sh, "left", 1.7, 0.01, 1.4) });
  p.push({ prop: "regulator", ...onWall(sh, "back", back.u, 0.15, 2.45) });
  p.push({ prop: "cafe-mirror", ...onWall(sh, "right", b0 + bw / 2, 0.05, 2.25) });
  // the plate rail along the panelling's top on the left wall, clear of the coat stand and the notice
  for (let u = 2.4; u + 2.0 < d - 0.3; u += 2.1) p.push({ prop: "plate-rail", ...onWall(sh, "left", u + 1.0, 0.14, 1.95) });
  // the window: bottles each side of the day's board
  p.push({ prop: "bottle-row", ...onProp(podium, [-0.6, 0.55, 0.05]), yaw: -0.1 }, { prop: "menu-board", ...onProp(podium, [0.05, 0.55, -0.1]), yaw: 0 }, { prop: "bottle-row", ...onProp(podium, [0.7, 0.55, 0.05]), yaw: 0.1 });
  pendant(l * 0.35, bz + 0.6, "pendant-a", true);
  pendant(l * 0.55, Math.min(d - 1.6, bz + 3.0), "pendant-b", true);
  return p;
}

function cafeProps(sh: Shell, r: (k: number) => number, pendant: Pendant, podium: { at: V3; yaw: number }): Place[] {
  const { l, d } = sh, p: Place[] = [];
  const chairAt = (tx: number, tz: number, a: number, k: number) =>
    p.push({ prop: "bentwood-chair", at: [tx + Math.sin(a) * 0.5, 0, tz + Math.cos(a) * 0.5], yaw: a + Math.PI + (r(k) - 0.5) * 0.35 });
  // the buffet from the left wall, its marble top to the customers; behind it the mirror and the jar shelf
  const bz = 1.15 + 0.2 * r(110);
  const buffet = { at: [0.2 + 1.5, 0, bz] as V3, yaw: 0 };
  p.push({ prop: "shop-counter", ...buffet });
  p.push({ prop: "cake-case", ...onProp(buffet, [-0.85, 0.95, -0.05]), yaw: 0 });
  p.push({ prop: "cake-stand", ...onProp(buffet, [0.3, 0.95, 0]), yaw: r(111) * 6 });
  p.push({ prop: "till", ...onProp(buffet, [1.1, 0.95, -0.1]), yaw: 0.15 });
  p.push({ prop: "cafe-mirror", ...onWall(sh, "back", 1.25, 0.05, 1.3) });
  p.push({ prop: "jar-shelf", ...onWall(sh, "back", 2.75, def("jar-shelf")?.size[2] ?? 0.2, 1.25) });
  // the banquette down the right wall (u from the back) and its tables, a chair across each
  const b0 = bz + 1.1, bw = def("banquette")?.size[0] ?? 2, room = d - 1.3 - b0, n = room >= bw * 2 + 0.2 ? 2 : room >= bw ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const u = b0 + bw / 2 + i * (bw + 0.1);
    p.push({ prop: "banquette", ...onWall(sh, "right", u, 0.6) });
    p.push({ prop: "cafe-mirror", ...onWall(sh, "right", u, 0.05, 1.3) });
    for (const s of [-0.5, 0.5]) {
      const tz = u + s, tx = l - 0.25 - 0.6 - 0.36;
      p.push({ prop: "cafe-table", at: [tx, 0, tz], yaw: r(112 + i * 2 + (s > 0 ? 1 : 0)) * 6 });
      chairAt(tx, tz, -Math.PI / 2, 120 + i * 2 + (s > 0 ? 1 : 0));
    }
  }
  // a free table in the middle with two chairs, clear of the buffet and of the way in from the door
  const fx = l * 0.4, fz = bz + 0.36 + 1.25 + 0.3 * r(113);
  if (fz < d - 1.6) {
    p.push({ prop: "cafe-table", at: [fx, 0, fz], yaw: r(114) * 6 });
    chairAt(fx, fz, Math.PI / 2 + 0.3, 125);
    chairAt(fx, fz, -Math.PI / 2 + 0.2, 126);
  }
  // the left wall by the door (u from the street end): the coat stand, the newspapers on their holders
  p.push({ prop: "coat-stand", ...onWall(sh, "left", 0.9, 0.5) });
  p.push({ prop: "newspaper-holders", ...onWall(sh, "left", 1.9, 0.08, HANG["newspaper-holders"] + 0.6) });
  if (d > 6.4) p.push({ prop: "fan-palm", at: [l - 0.5, 0, d - 1.35], yaw: r(115) * 6 });
  p.push({ prop: "regulator", ...onWall(sh, "back", sh.openings!.find((o) => o.wall === "back")!.u, 0.15, 2.45) });
  // the window: a cake on its stand each side, the chocolate boxes for the front between
  ["cake-stand", "praline-boxes", "cake-stand"].forEach((id, i) => p.push({ prop: id, ...onProp(podium, [-0.62 + i * 0.62, 0.55, (r(116 + i) - 0.5) * 0.15]), yaw: (r(119 + i) - 0.5) * 0.6 }));
  pendant(l * 0.4, bz, "pendant-a", true);
  pendant(l * 0.6, Math.min(d - 1.6, bz + 2.4), "pendant-b", true);
  return p;
}

/** The coal merchant's cellar: bins of coal and coke along the left wall, briquettes stacked at the back, the decimal
 *  scale by the steps, sacks, the shovel and the baskets, a desk, a petroleum lamp. */
function coalProps(sh: Shell, r: (k: number) => number, lit: boolean): Place[] {
  const { l, d, h } = sh, p: Place[] = [];
  p.push({ prop: "coal-bin", ...onWall(sh, "left", d - 1.2 - 0.7, 1.2) });
  p.push({ prop: "coke-bin", ...onWall(sh, "left", d - 1.2 - 2.3, 1.2) });
  p.push({ prop: r(1) < 0.5 ? "coal-bin" : "coke-bin", ...onWall(sh, "back", 1.2, 1.2) });
  for (let i = 0; i < 2; i++) p.push({ prop: "briquette-stack", ...onWall(sh, "back", 2.4 + i * 0.95, 0.38) });
  p.push({ prop: "platform-scale", at: [l - 1.0, 0, d - 2.2], yaw: -Math.PI / 2 + 0.2 });
  p.push({ prop: "works-desk", ...onWall(sh, "right", 1.0, 0.7) });
  for (let i = 0; i < 3; i++) p.push({ prop: i === 2 ? "potato-sack-slumped" : "potato-sack", at: [l - 0.45, 0, d - 3.4 - i * 0.55], yaw: r(10 + i) * 6 });
  p.push({ prop: "coal-shovel", at: [1.55, 0, d - 1.0], yaw: 1.2 }, { prop: "kiepe", at: [l * 0.5, 0, d - 0.6], yaw: r(14) * 6 }, { prop: "bucket", at: [l * 0.5 + 0.6, 0, d - 0.7], yaw: 0 });
  p.push({ prop: "hoop-lamp", at: [l / 2, h - 0.1, d / 2], name: "lamp", lit });
  return p;
}

/** A side-street shop as a set to look at: from the pavement through the window at dusk, and inside from the door. */
export function cornerSet(trade: string, seed: number): Set {
  const sh = cornerShell(trade, seed), { l, d, h } = sh, cellar = trade === "coal-cellar-shop";
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: cornerProps(trade, sh, seed) };
  const wx = cornerWindowX(sh);
  return {
    id: `${trade}-${Math.round(seed * 100)}`,
    title: `${trade.replace("shop-", "").replace("-shop", "")}, generated (seed ${seed})`,
    use: "every storefront of its trade off the main streets: the window from the street (atlas), the room when its door opens",
    rooms: [room],
    cams: cellar
      ? [
        { id: "street", eye: [l * 0.65, h - 0.3, d + 1.0], at: [l * 0.6, 0.4, d - 4], fov: 60, note: "stooping at the pavement grating: down into the cellar" },
        { id: "inside", eye: [l - 0.75, 1.65, d - 0.4], at: [l * 0.3, 0.7, 1.2], fov: 66, note: "at the foot of the steps: bins, scale, briquettes" },
      ]
      : [
        { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.3, d - 3], fov: 48, note: "from the pavement at dusk: the window, the shop behind" },
        { id: "inside", eye: [l / 2 - 1.0, 1.6, d - 0.9], at: [l * 0.55, 1.05, 0.4], fov: 66, note: "inside the door: the counter, the walls, the door to the flat" },
      ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }], // the street's gas lamp
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: cellar ? -0.2 : -0.5,
    wear: { dust: cellar ? 0 : 0.25, dirt: cellar ? 0.7 : 0.35, edges: 0.35 }, // coal dust is black: no pale dust on the heaps
  };
}
