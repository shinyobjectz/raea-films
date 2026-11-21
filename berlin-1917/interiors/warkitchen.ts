// The war kitchen (Kriegsküche, Volksküche): the noon queue ("a war kitchen's queue,
// women with cans") and the public kitchens across the city, often in a former restaurant or shop on a side street.
// A tiled hall: the soup kettles along the back, the serving counter across in front of them, the cans and food
// carriers waiting before it, a long table or two for those who eat there, the notices. Open at midday only.
// shopSet() in shops.ts dispatches here, so it's an atlas room with its own (empty) display card like any shop.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const WAR_KITCHEN = "war-kitchen";

/** The hall: a ground floor 6.5-7.5 m wide and 8.5-10 m deep, white tiles to shoulder height, a shopfront with its door. */
export function warKitchenShell(seed: number): Shell {
  const r = (k: number) => hash(seed, k, 701), l = 6.5 + r(1), d = 8.5 + 1.5 * r(2);
  return {
    l, d, h: 4.4, t: { back: 0.38, front: 0.64, left: 0.25, right: 0.25 }, seed: Math.floor(seed * 7) % 997,
    walls: "lime-wash", dado: { mat: "tile-white", h: 1.7 }, floor: "tiles", ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 4.2, y: 0, h: 3.6, kind: "door" }, // the shopfront fills it
      { wall: "back", u: l - 0.75, w: 0.95, y: 0, h: 2.3, kind: "door" }, // to the scullery and the yard
    ],
  };
}

/** What the hall holds, placed. */
export function warKitchenProps(sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 702), p: Place[] = [];
  const { l, d, h } = sh;
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  // the shopfront it took over, the card rules and the day's notice on the glass
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.5 ? "shopfront-small-green" : "shopfront-small-brown", ...front });
  p.push({ prop: "ration-notice", ...onProp(front, [-0.3, 1.45, -0.14]), yaw: Math.PI });
  p.push({ prop: "war-poster", ...onProp(front, [0.95, 1.15, -0.14]), yaw: 0 });
  // the window's podium: the day's board propped on it for the queue outside, two food carriers by it (the card)
  const podium = { at: [l / 2 + 0.85, 0, d - 0.55] as V3, yaw: 0 };
  p.push({ prop: "window-podium", ...podium, name: "display" });
  p.push({ prop: "menu-board", ...onProp(podium, [-0.2, 0.55, -0.12]), yaw: 0 });
  p.push({ prop: "food-carriers", ...onProp(podium, [0.65, 0.55, 0.05]), yaw: 0.3 });
  p.push({ prop: "milk-churn", ...onProp(podium, [-0.85, 0.55, 0.05]), yaw: 1.1 });
  // the kettles along the back wall, clear of the door to the scullery and the yard
  const kw = size("soup-kettle")[0], back = sh.openings!.find((o) => o.wall === "back")!;
  p.push({ prop: "parlour-door", at: [back.u, 0, -0.1], yaw: 0 });
  const nk = Math.min(4, Math.floor((back.u - 0.6 - 0.3) / (kw + 0.3)));
  for (let i = 0; i < nk; i++) p.push({ prop: "soup-kettle", ...onWall(sh, "back", 0.3 + kw / 2 + i * (kw + 0.3), size("soup-kettle")[2]) });
  // the serving counter across the hall, the staff's gangway between it and the kettles
  const cz = size("soup-kettle")[2] + 0.38 + 0.85 + size("serving-counter")[2] / 2;
  const counter = { at: [l / 2 - 0.4 + 0.3 * r(2), 0, cz] as V3, yaw: 0 };
  p.push({ prop: "serving-counter", ...counter });
  // the cans and carriers set down in front of it, waiting their turn
  p.push({ prop: "food-carriers", at: [counter.at[0] - 0.9, 0, cz + 0.75], yaw: (r(3) - 0.5) * 0.4 });
  p.push({ prop: "food-carriers", at: [counter.at[0] + 0.7, 0, cz + 0.8], yaw: (r(4) - 0.5) * 0.4 });
  p.push({ prop: "milk-churn", at: [counter.at[0] + 1.45, 0, cz + 0.7], yaw: r(5) * 6 });
  p.push({ prop: "milk-churn", at: [counter.at[0] - 1.6, 0, cz + 0.75], yaw: r(6) * 6 });
  // a long table down the left wall for those who eat it there, a bench along the right
  if (d - cz > 4.2) p.push({ prop: "trestle-table", at: [0.25 + 0.95, 0, cz + 1.6 + size("trestle-table")[0] / 2], yaw: Math.PI / 2 });
  p.push({ prop: "waiting-bench", ...onWall(sh, "right", cz + 1.5 + 0.8, 0.45) }); // the right wall's u from the back
  // the ladles over the kettles, coal for their fires by the end one
  const kr = 0.3 + nk * (kw + 0.3) - 0.3;
  p.push({ prop: "ladle-rail", ...onWall(sh, "back", Math.max(1.4, kr / 2), 0.12, 1.75) });
  p.push({ prop: "bucket", at: [kr + 0.3, 0, 0.45], yaw: r(8) * 6 });
  // the queue: the card desk inside the door, a rail from it toward the counter, so the line keeps to the right
  const door = sh.openings!.find((o) => o.wall === "front")!;
  p.push({ prop: "card-desk", at: [0.25 + 0.75, 0, d - 1.3], yaw: Math.PI / 2 }); // by the door, the clerk's back to the left wall
  p.push({ prop: "stool", at: [0.25 + 0.2, 0, d - 1.3], yaw: r(9) * 6 });
  const railX = door.u + 0.1; // in on the door's side, out past the window
  for (let z = d - 2.0, k = 0; z - 2.4 > cz + 0.6 && k < 3; z -= 2.4, k++) p.push({ prop: "queue-rail", at: [railX, 0, z - 1.2], yaw: Math.PI / 2 });
  // the walls: the day's board by the counter, the crockery, the notices, the clock over the scullery door
  p.push({ prop: "menu-board", ...onWall(sh, "right", cz - 0.3, 0.03, 1.55) });
  p.push({ prop: "crockery-rack", ...onWall(sh, "left", d - cz + 0.2, size("crockery-rack")[2]) });
  p.push({ prop: "war-poster", ...onWall(sh, "left", 1.6, 0.01, 1.5) }); // u from the street end
  p.push({ prop: "war-poster", ...onWall(sh, "right", cz + 1.4, 0.01, 1.55) });
  p.push({ prop: "enamel-sign", ...onWall(sh, "back", Math.max(0.6, back.u - 1.2), 0.02, 2.4) });
  p.push({ prop: "regulator", ...onWall(sh, "back", back.u, 0.15, 2.45) });
  // the gas pendants: over the counter and over the hall
  p.push({ prop: "shop-pendant", at: [l * 0.35, h, cz], name: "pendant-a", lit }, { prop: "shop-pendant", at: [l * 0.68, h, cz], name: "pendant-b", lit });
  p.push({ prop: "shop-pendant", at: [l / 2, h, Math.min(d - 1.6, cz + 3)], name: "pendant-c", lit: lit && r(7) < 0.6 });
  return p;
}

/** The hall as a set: from the pavement through the window (the queue's view), and inside from the door. */
export function warKitchenSet(seed: number): Set {
  const sh = warKitchenShell(seed), { l, d, h } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: warKitchenProps(sh, seed) };
  const wx = l / 2 + 0.85;
  return {
    id: `war-kitchen-${Math.round(seed * 100)}`,
    title: `war kitchen, generated (seed ${seed})`,
    use: "the public kitchens: the window from the street (atlas), the hall when its door opens, the noon queue's shot",
    rooms: [room],
    cams: [
      { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.2, d - 4], fov: 48, note: "from the queue on the pavement: the window, the kettles behind" },
      { id: "inside", eye: [l / 2 - 0.8, 1.6, d - 0.9], at: [l * 0.5, 1.0, 0.5], fov: 66, note: "inside the door: the counter, the kettles, the cans waiting" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.15, dirt: 0.4, edges: 0.35 },
  };
}
