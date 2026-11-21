// The bank's counter hall (kit/bank.ts, research/catalogue shop-bank): the ground floor of a Bankgeschäft on Leipziger
// or Friedrichstraße. The public's side by the windows: a bench, the writing desk for forms, the war-loan placards.
// The counter across the hall under its brass grilles. The clerks' side: high desks and rolltops, the files to the
// ceiling, the safe, and the strongroom door in the back wall. Electric light under green shades.
// shopSet() in shops.ts dispatches here, so it's an atlas room with its own display card like any shop.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const BANK = "shop-bank";

/** The hall: 7-8.5 m wide, 9-11 m deep, 4.6 m high, marble to the dado, a tiled floor; the front's opening, the back door. */
export function bankShell(seed: number): Shell {
  const r = (k: number) => hash(seed, k, 801), l = 7 + 1.5 * r(1), d = 9 + 2 * r(2);
  return {
    l, d, h: 4.6, t: { back: 0.4, front: 0.64, left: 0.3, right: 0.3 }, seed: Math.floor(seed * 7) % 997,
    walls: "lime-wash", dado: { mat: "marble", h: 1.1 }, floor: "tiles", ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 4.2, y: 0, h: 3.6, kind: "door" }, // the shopfront fills it
      { wall: "back", u: 0.9, w: 0.95, y: 0, h: 2.3, kind: "door" }, // to the offices and the stairs
    ],
  };
}

export function bankProps(sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 802), p: Place[] = [];
  const { l, d, h } = sh;
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  // the shopfront, its notice, the war loan on the door glass
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.5 ? "shopfront-small-green" : "shopfront-small-brown", ...front });
  p.push({ prop: "war-poster", ...onProp(front, [0.95, 1.15, -0.14]), yaw: 0 });
  // the window: a podium with the war-loan placard and a ledger
  const podium = { at: [l / 2 + 0.85, 0, d - 0.55] as V3, yaw: 0 };
  p.push({ prop: "window-podium", ...podium, name: "display" });
  p.push({ prop: "war-poster", ...onProp(podium, [0, 0.55, -0.1]), yaw: 0 });
  // the counter across the hall, 4-5 m from the back wall, a flap at the right end for the clerks
  const cz = 4.2 + 0.8 * r(2), cw = size("bank-counter")[0], n = Math.floor((l - 0.3 - 1.0) / cw);
  for (let i = 0; i < n; i++) p.push({ prop: "bank-counter", at: [0.3 + cw / 2 + i * cw, 0, cz], yaw: 0 });
  // the public's side: a bench by the left wall, the writing desk, placards on the walls, the coat stand
  p.push({ prop: "waiting-bench", ...onWall(sh, "left", d - cz - 1.4, 0.45) }); // u from the street end
  p.push({ prop: "high-desk", at: [l - 1.3, 0, cz + 2.0], yaw: -Math.PI / 2 });
  p.push({ prop: "war-poster", ...onWall(sh, "left", 1.0, 0.01, 1.5) }, { prop: "war-poster", ...onWall(sh, "right", cz + 1.2, 0.01, 1.5) });
  p.push({ prop: "coat-stand", ...onWall(sh, "right", d - 0.8, 0.5) }); // u from the back
  // the clerks' side: high desks facing the counter, a rolltop, the files and the strongroom on the back wall
  for (let i = 0; i < n; i++) p.push({ prop: "high-desk", at: [0.3 + cw / 2 + i * cw, 0, cz - 1.5], yaw: Math.PI });
  p.push({ prop: "rolltop-desk", ...onWall(sh, "left", d - 1.8, size("rolltop-desk")[2]) });
  p.push({ prop: "vault-door", ...onWall(sh, "back", l / 2 + 0.6, size("vault-door")[2]) });
  p.push({ prop: "file-shelf", ...onWall(sh, "back", l - 0.3 - size("file-shelf")[0] / 2, size("file-shelf")[2]) });
  p.push({ prop: "safe", ...onWall(sh, "right", 0.9, size("safe")[2]) });
  p.push({ prop: "telephone-wall", ...onWall(sh, "back", 1.9, 0.12, 1.4) });
  p.push({ prop: "regulator", ...onWall(sh, "back", l / 2 + 0.6, 0.15, 2.6) });
  // green-shaded lamps over the counter and the desks, a pendant over the public
  for (let i = 0; i < n; i++) p.push({ prop: "office-pendant", at: [0.3 + cw / 2 + i * cw, h, cz - 0.9], name: `lamp-${i}`, lit });
  p.push({ prop: "shop-pendant", at: [l / 2, h, Math.min(d - 1.5, cz + 2.4)], name: "pendant-public", lit });
  return p;
}

/** The hall as a set: from the pavement through the window, and inside from the door. */
export function bankSet(seed: number): Set {
  const sh = bankShell(seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: bankProps(sh, seed) };
  const wx = l / 2 + 0.85;
  return {
    id: `bank-${Math.round(seed * 100)}`,
    title: `bank counter hall, generated (seed ${seed})`,
    use: "the banks of Leipziger and Friedrichstraße: the window from the street (atlas), the hall when its door opens",
    rooms: [room],
    cams: [
      { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.2, d - 4], fov: 48, note: "from the pavement: the window, the counter under its grilles" },
      { id: "inside", eye: [l / 2 - 0.8, 1.6, d - 0.9], at: [l * 0.5, 1.3, 0.5], fov: 66, note: "inside the door: the counter, the clerks, the strongroom" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.1, dirt: 0.2, edges: 0.25 },
  };
}
