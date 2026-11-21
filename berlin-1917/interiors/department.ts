// The department store's sales floors (Wertheim, Leipziger Straße 126-137, Messel 1897-1906; Hermann Tietz, 46-50a):
// the ground floor's hall behind the street's display windows, and the upper sales floors behind the glass between the
// facade's piers. One plan for both stores; a seed gives the size and what stands where. shopSet() in shops.ts
// dispatches here, so the atlas, its display cards and every pane of the stores' street fronts get these rooms
// (tools/interiors/windows.ts gives a department store's front every floor's panes, not only its shop bays).
//
// A floor is deeper and wider than a shop, 4.6 m clear, cast-iron columns on a 3 x 5 m grid, electric pendants (half of
// them out: the coal orders), counters down both sides facing the middle aisle with the stock on the walls behind,
// forms and tables in the aisle. Winter 1917-18: the hall's windows dressed for the war; the upper floors' confection,
// coats and furs on forms, thin.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import { upperRun } from "./kit/upper";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const DEPT_TRADES = ["shop-department", "dept-floor"];
// The store's glass, as the world lane's store facade cuts it (tools/world/facade.ts STORE_STOREY, 11-17; assumed, not from a
// measured section): bays of about 3.6 m between 1 m piers; the ground storey 5.6 m floor to floor, its show window from
// 0.45 m to 0.9 m under the next floor line; the upper storeys 4.6 m, glass from 0.1 m over the floor (a spandrel, not a
// sill) to 0.55 m under the next. The tile shader maps a pane onto the pane its atlas room was rendered for (paneFor),
// so these rooms are rendered for this glass, and their ceilings sit about 0.45 m under the next floor line.
export const DEPT_PANE: Record<string, { sill: number; w: number; h: number; H: number }> = {
  "shop-department": { sill: 0.45, w: 3.6, h: 4.25, H: 5.15 },
  "dept-floor": { sill: 0.1, w: 3.6, h: 3.95, H: 4.15 },
};

/** The floor's shell: about 9 m of the front seen through, 15-17 m deep, the display windows' opening in the front. */
export function deptShell(trade: string, seed: number): Shell {
  const r = (k: number) => hash(seed, k, 601), hall = trade === "shop-department";
  const l = 8.6 + 0.8 * r(1), d = 15 + 2 * r(2);
  return {
    l, d, h: DEPT_PANE[trade].H, t: { back: 0.4, front: 0.64, left: 0.3, right: 0.3 },
    walls: hall ? "paper-damask" : "lime-wash", dado: { mat: "wood-dark", h: 1.3 }, floor: "boards", ceiling: "plaster", seed: Math.floor(seed * 7) % 997,
    openings: [
      { wall: "front", u: l / 2, w: 5.0, y: 0, h: 3.3, kind: "door" }, // the shopfront fills it
      { wall: "back", u: l - 1.0, w: 1.2, y: 0, h: 2.6, kind: "door" }, // to the stairs and the lifts
    ],
  };
}

type Plan = { window: string[]; back: string[]; sides: string[]; counters: ("glass-counter" | "store-counter")[]; onCounter: string[]; aisle: string[]; upper: string[] };
const PLANS: Record<string, Plan> = {
  // the hall: haberdashery, gloves, silks at the counters; the windows dressed for the war
  "shop-department": {
    window: ["coat-form-field", "feldpost-parcels", "dress-form", "hatbox-stack"],
    back: ["vitrine", "cloth-shelves", "vitrine", "cloth-shelves-bare"], sides: ["cloth-shelves", "cloth-shelves-bare", "vitrine"],
    counters: ["glass-counter", "store-counter"], onCounter: ["bolt-stack", "till"], aisle: ["dress-form", "cheval-mirror", "hatbox-stack"],
    upper: ["loft-bolts", "loft-cartons", "loft-bolts-b", "loft-cartons-b"],
  },
  // an upper floor: ladies' and men's confection, furs
  "dept-floor": {
    window: ["dress-form", "fur-coat-form", "coat-form-navy", "dress-form"],
    back: ["cloth-shelves-bare", "vitrine", "cheval-mirror"], sides: ["cloth-shelves-bare", "cheval-mirror", "vitrine"],
    counters: ["store-counter"], onCounter: ["bolt-stack"], aisle: ["dress-form", "coat-form-navy", "fur-coat-form", "coat-form-field"],
    upper: ["loft-cartons", "loft-cartons-b", "-"],
  },
};

/** What a floor holds, placed. */
export function deptProps(trade: string, sh: Shell, seed: number, lit = true): Place[] {
  const P = PLANS[trade], r = (k: number) => hash(seed, k, 602), p: Place[] = [];
  const { l, d } = sh;
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  // the display windows either side of the door, as a Leipziger shop's (interiors/shops.ts), two pieces a stage
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: "shopfront-pair", ...front });
  p.push({ prop: "ration-notice", ...onProp(front, [1.4 + 0.3 * r(1), 1.35, 0.16]), yaw: Math.PI });
  for (const s of [-1, 1]) {
    const stage = { at: [l / 2 + s * 1.525, 0, d - 0.55] as V3, yaw: 0 };
    p.push({ prop: "display-steps", ...stage });
    for (const [k, x] of [[0, -0.4], [1, 0.4]] as const) {
      const id = P.window[(k + (s + 1)) % P.window.length], on = def(id)?.place === "on";
      p.push({ prop: id, ...onProp(stage, [x, on ? 0.55 : 0.3, on ? -0.32 : 0.17]), yaw: (r(20 + k + s) - 0.5) * 0.5 });
    }
  }
  // the columns on a grid: two rows, every 5 m back from the window zone
  for (const cx of [l / 3, (2 * l) / 3]) for (let cz = d - 4.5; cz > 1.5; cz -= 5) p.push({ prop: "store-column", at: [cx, 0, cz], yaw: 0, scale: sh.h / 4.6 }); // the column is drawn 4.6 m, floor to ceiling
  // counters down both sides facing the aisle (the customer's side, +z in the counter's frame, turned to the middle),
  // the staff's gangway behind them, the stock on the walls behind that
  const shelfD = 0.45, gang = 0.85;
  let k = 0;
  for (const side of [-1, 1]) {
    const x = side < 0 ? 0.3 + shelfD + gang + 0.35 : l - 0.3 - shelfD - gang - 0.35, yaw = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    for (let z = 2.2; z + 2.8 < d - 2.6; z += 3.4) {
      const id = P.counters[k++ % P.counters.length], cw = size(id)[0], top = id === "glass-counter" ? 0.95 : 0.93;
      const c = { at: [x, 0, z + cw / 2] as V3, yaw };
      p.push({ prop: id, ...c });
      P.onCounter.forEach((o, i) => { if (r(30 + k * 3 + i) < 0.7) p.push({ prop: o, ...onProp(c, [-cw / 2 + 0.5 + i * (cw - 1.0), top, -0.05]), yaw: yaw + (r(40 + k + i) - 0.5) * 0.5 }); });
    }
  }
  // the walls: each side from the back to the window zone, the back clear of its door
  const fill = (wall: "back" | "left" | "right", list: string[], from: number, to: number, k0: number) => {
    let u = from, i = Math.floor(r(k0) * list.length);
    while (true) {
      const id = list[i++ % list.length], sz = size(id);
      if (u + sz[0] > to) break;
      p.push({ prop: id, ...onWall(sh, wall, u + sz[0] / 2, sz[2]) });
      u += sz[0] + 0.1 + 0.15 * r(k0 + i);
    }
  };
  // the hall's back wall opens on the Lichthof (kit/dept.ts lichthof-arcade), clear of the door to the stairs; a palm
  // either side of it. An upper floor's back wall is stock.
  if (trade === "shop-department") {
    const aw = size("lichthof-arcade")[0], au = 0.3 + aw / 2;
    p.push({ prop: "lichthof-arcade", ...onWall(sh, "back", au, size("lichthof-arcade")[2]) });
    for (const s of [-1, 1]) p.push({ prop: "fan-palm", at: [au + s * (aw / 2 - 0.2), 0, 1.25], yaw: r(55 + s) * 6 });
    fill("back", P.back, au + aw / 2 + 0.2, l - 1.8, 50);
  } else fill("back", P.back, 0.3, l - 1.8, 50);
  fill("left", P.sides, 2.0, d - 0.4, 60); // the left wall's u from the street end
  fill("right", P.sides, 0.4, d - 2.0, 70); // the right wall's from the back
  // the middle aisle: forms, a mirror, between the columns
  for (let z = d - 2.3, i = 0; z > 2; z -= 2.5, i++) {
    const id = P.aisle[Math.floor(r(80 + i) * P.aisle.length)];
    p.push({ prop: id, at: [l / 2 + (r(90 + i) - 0.5) * 1.2, 0, z], yaw: r(95 + i) * 6 });
  }
  // the electric pendants on the grid, every other one out
  for (const [i, x] of [l / 4, l / 2, (3 * l) / 4].entries()) for (let z = d - 2.5, j = 0; z > 1; z -= 4, j++) p.push({ prop: "store-pendant", at: [x, sh.h, z], name: `pendant-${i}-${j}`, lit: lit && (i + j) % 2 === 0 });
  // stock to the cornice over the side walls' shelves (interiors/kit/upper.ts)
  const upper = (wall: "back" | "left" | "right", u0: number, u1: number, kk: number) =>
    upperRun(P.upper, u0, u1, sh.h, size, seed * 83 + kk).forEach(([id, u, y]) => p.push({ prop: id, ...onWall(sh, wall, u, size(id)[2], y) }));
  upper("left", 2.0, d - 0.45, 1);
  upper("right", 0.45, d - 2.0, 2);
  upper("back", 0.3, l - 1.8, 3);
  return p;
}

/** A floor as a set to look at: through the display window from the pavement, and inside from the door. */
export function deptSet(trade: string, seed: number): Set {
  const sh = deptShell(trade, seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: deptProps(trade, sh, seed) };
  return {
    id: `${trade}-${Math.round(seed * 100)}`,
    title: `${trade === "shop-department" ? "department store hall" : "department store upper floor"}, generated (seed ${seed})`,
    use: "every pane of a department store's street front: the hall behind the display windows, the sales floors above",
    rooms: [room],
    cams: [
      { id: "street", eye: [l / 2 - 1.3, 1.6, d + 3.2], at: [l / 2 + 0.2, 1.4, d - 6], fov: 48, note: "from the pavement: the window and the hall behind" },
      { id: "inside", eye: [l / 2 + 0.4, 1.65, d - 1.3], at: [l * 0.45, 1.3, 0.5], fov: 66, note: "inside the door: the aisle, the counters, the columns" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.15, dirt: 0.2, edges: 0.25 },
  };
}
