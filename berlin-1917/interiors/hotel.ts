// The hotel's hall on the ground floor (kit/hotel.ts, research/catalogue shop-hotel): what Friedrichstraße, the Linden
// and Wilhelmstraße saw through a hotel's windows. The window: aspidistras in a planter between velvet drapes. The hall:
// two marble columns under electric chandeliers, club chairs round small tables on the rugs, a palm in the corners,
// the sofa and the pier glass on the walls, the papers on their holders. At the back the porter's desk under the board
// of keys, the guests' luggage by it, the hall clock, the door to the stairs and the lift. The meatless days posted by
// the door. shopSet() in shops.ts dispatches here, so it's an atlas room with its own display card like any shop.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const HOTEL = "shop-hotel";
const H = 5.2; // the hall's height, which the columns are built to

/** The hall: 8-10 m wide, 10-12 m deep, 5.2 m high, paper over a marble dado, a tiled floor; the front's tall opening,
 *  the back's double door to the stairs. */
export function hotelShell(seed: number): Shell {
  const r = (k: number) => hash(seed, k, 811), l = 8 + 2 * r(1), d = 10 + 2 * r(2);
  return {
    l, d, h: H, t: { back: 0.4, front: 0.64, left: 0.3, right: 0.3 }, seed: Math.floor(seed * 7) % 997,
    walls: "paper-damask", dado: { mat: "marble", h: 1.2 }, floor: "tiles", ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 4.4, y: 0, h: 3.8, kind: "door" }, // the front fills it
      { wall: "back", u: l - 1.3, w: 1.5, y: 0, h: 2.7, kind: "door" }, // to the stairs and the lift
    ],
  };
}

export function hotelProps(sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 812), p: Place[] = [];
  const { l, d, h } = sh;
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.5 ? "shopfront-small-brown" : "shopfront-small-green", ...front });
  p.push({ prop: "meatless-notice", ...onProp(front, [0.95, 1.4, -0.14]), yaw: 0 });
  // the window: the planter of aspidistras, the drapes either side of it
  const wx = l / 2 + 0.85, trough = { at: [wx, 0, d - 0.5] as V3, yaw: 0 };
  p.push({ prop: "planter-trough", ...trough, name: "display" });
  for (const x of [-0.72, 0, 0.72]) p.push({ prop: "aspidistra", ...onProp(trough, [x, 0.52, 0]), yaw: r(10 + x) * 6 });
  for (const s of [-1, 1]) p.push({ prop: "hotel-drape", at: [wx + s * 1.75, 0, d - 0.2], yaw: Math.PI });
  // the columns across the middle of the hall
  for (const f of [1 / 3, 2 / 3]) p.push({ prop: "hall-column", at: [l * f, 0, d * 0.48], yaw: 0 });
  // two groups of club chairs round a small table, each on its rug
  const group = (tx: number, tz: number, k: number) => {
    p.push({ prop: "rug", at: [tx, 0, tz], yaw: r(k) * 0.4 - 0.2 }, { prop: "cafe-table", at: [tx, 0, tz], yaw: 0 });
    for (let i = 0; i < 3; i++) {
      const th = r(k + 1) * 6 + (i * 2 * Math.PI) / 3;
      p.push({ prop: "club-chair", at: [tx + 0.85 * Math.sin(th), 0, tz + 0.85 * Math.cos(th)], yaw: th + Math.PI });
    }
  };
  group(l * 0.3, d * 0.68, 20);
  group(l * 0.7, d * 0.3, 30);
  // the walls: the sofa and a palm on the left, the pier glass and the papers on the right
  p.push({ prop: "sofa", ...onWall(sh, "left", d * 0.45, size("sofa")[2]) }); // u from the street end
  p.push({ prop: "fan-palm", at: [0.6, 0, d - 1.5], yaw: r(3) * 6 }, { prop: "fan-palm", at: [l - 0.6, 0, d - 1.5], yaw: r(4) * 6 });
  p.push({ prop: "pier-mirror", ...onWall(sh, "right", d * 0.55, size("pier-mirror")[2]) }); // u from the back
  p.push({ prop: "newspaper-holders", ...onWall(sh, "right", d * 0.78, 0.08, 1.2) });
  p.push({ prop: "war-poster", ...onWall(sh, "left", 1.2, 0.01, 1.5) });
  // the back: the porter under his keys, the luggage, the hall clock
  p.push({ prop: "porter-desk", at: [1.7, 0, 1.6], yaw: 0 });
  p.push({ prop: "key-board", ...onWall(sh, "back", 1.7, 0.12, 1.25) });
  p.push({ prop: "suitcase-stack", at: [3.2, 0, 1.3], yaw: 0.2 + r(5) * 0.4 });
  p.push({ prop: "clock-case", ...onWall(sh, "back", l * 0.5, size("clock-case")[2]) });
  // the chandeliers, one over each half
  p.push({ prop: "chandelier", at: [l * 0.33, h, d * 0.68], name: "chandelier-a", lit }, { prop: "chandelier", at: [l * 0.67, h, d * 0.3], name: "chandelier-b", lit });
  return p;
}

/** The hall as a set: from the pavement through the window, and inside from the door. */
export function hotelSet(seed: number): Set {
  const sh = hotelShell(seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: hotelProps(sh, seed) };
  const wx = l / 2 + 0.85;
  return {
    id: `hotel-${Math.round(seed * 100)}`,
    title: `hotel hall, generated (seed ${seed})`,
    use: "the hotels of Friedrichstraße, the Linden and Wilhelmstraße: the window from the street (atlas), the hall when its door opens",
    rooms: [room],
    cams: [
      { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.4, d - 4], fov: 48, note: "from the pavement: the aspidistras, the hall's chairs and chandeliers behind" },
      { id: "inside", eye: [l / 2 - 0.8, 1.65, d - 0.9], at: [l * 0.45, 1.4, 0.5], fov: 68, note: "inside the door: the columns, the chairs, the porter under his keys" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.05, dirt: 0.1, edges: 0.15 },
  };
}
