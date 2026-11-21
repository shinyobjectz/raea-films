// The Apotheke's Offizin and the Drogerie (kit/pharmacy.ts): one room, two trades. Both: shelving round the back and
// left walls, a counter across the room, the customers' side by the window. The pharmacy's shelving is porcelain jars
// over drawers, its counter the Rezeptur with the balance, the poison cabinet behind it; the drugstore's is tins, packets
// and bottles, sold over the plain shop counter. shopSet() in shops.ts dispatches here.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const PHARMACY = "shop-pharmacy", DRUGSTORE = "shop-drugstore";
const isPharmacy = (trade: string) => trade === PHARMACY;

/** 5-6.5 m wide, 6.5-8.5 m deep; the pharmacy higher (4.6 m, a corner house's ground floor), a mosaic floor. */
export function pharmacyShell(trade: string, seed: number): Shell {
  const r = (k: number) => hash(seed, k, 811), l = 5 + 1.5 * r(1), d = 6.5 + 2 * r(2), ph = isPharmacy(trade);
  return {
    l, d, h: ph ? 4.6 : 4.3, t: { back: 0.4, front: 0.64, left: 0.3, right: 0.3 }, seed: Math.floor(seed * 7) % 997,
    walls: ph ? "lime-wash" : "paper-stripe", dado: { mat: "wood-dark", h: 1.0 }, floor: ph ? "tile-floor" : "boards", ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 3.4, y: 0, h: 3.4, kind: "door" },
      { wall: "back", u: l - 0.8, w: 0.9, y: 0, h: 2.2, kind: "door" }, // to the laboratory and the stairs
    ],
  };
}

export function pharmacyProps(trade: string, sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 812), p: Place[] = [], ph = isPharmacy(trade);
  const { l, d, h } = sh, size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  // the Offizin's shelving runs nearer its higher ceiling, the big jars at the top: the unit at 1.25
  const wallId = ph ? "apothecary-wall" : "drugstore-wall", ws = ph ? 1.25 : 1, uw = size(wallId)[0] * ws, ud = size(wallId)[2] * ws;
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.5 ? "shopfront-small-green" : "shopfront-small-brown", ...front });
  p.push({ prop: "war-poster", ...onProp(front, [0.95, 1.15, -0.14]), yaw: 0 });
  // the window (interiors/kit/pharmacy.ts): the pharmacy's two show globes at its ends, between them the field-post
  // packs, the paper bandages and a row of bottles; the drugstore's tins, war soap, the same packs and bandages
  const podium = { at: [l / 2 + 0.75, 0, d - 0.55] as V3, yaw: 0 };
  p.push({ prop: "window-podium", ...podium, name: "display" });
  const shown: [string, number, number, number][] = ph
    ? [["show-globe-ruby", -0.88, -0.1, 0], ["feldpost-packs", -0.3, 0.06, 0.05], ["bottle-row", 0.32, -0.2, -0.05], ["bandage-rolls", 0.32, 0.14, -0.1], ["show-globe-green", 0.88, -0.1, 0]]
    : [["tin-pyramid", -0.82, 0.0, 0.1], ["soap-pyramid", -0.2, 0.16, 0], ["feldpost-packs", 0.38, 0.0, -0.05], ["bottle-row", -0.25, -0.2, 0], ["bandage-rolls", 0.88, 0.14, -0.15]];
  for (const [prop, x, z, yaw] of shown) p.push({ prop, ...onProp(podium, [x, 0.55, z]), yaw });
  // the shelving: along the back wall up to the door, then down the left wall (u from the street end, so from the back)
  // the left wall's units own the back corner; the back wall's start clear of them
  const door = sh.openings!.find((o) => o.wall === "back")!, x0 = ud + 0.02, backRoom = door.u - door.w / 2 - 0.15 - x0;
  for (let i = 0; i < Math.floor(backRoom / uw); i++) p.push({ prop: wallId, ...onWall(sh, "back", x0 + uw / 2 + i * uw, ud), scale: ws });
  const leftRoom = d - 0.02 - 2.2; // clear of the window's end of the wall
  for (let i = 0; i < Math.floor(leftRoom / uw); i++) p.push({ prop: wallId, ...onWall(sh, "left", d - 0.02 - uw / 2 - i * uw, ud), scale: ws });
  // the counter across the room, 2-2.6 m out from the shelving, a way round its left end for the staff. The Rezeptur
  // turns its glazed top to the customers and keeps the balance on the pharmacist's side
  const cz = ud + 2.0 + 0.6 * r(2), counter = ph ? "dispensing-counter" : "shop-counter", cw = size(counter)[0];
  const cp = { at: [ud + 0.75 + cw / 2, 0, cz] as V3, yaw: ph ? Math.PI : 0 }, top = ph ? 0.99 : 0.95;
  p.push({ prop: counter, ...cp });
  if (!ph) p.push({ prop: "scale", ...onProp(cp, [0.7, top, 0]), yaw: 0 });
  p.push({ prop: "till", at: [cp.at[0] + cw / 2 - 0.35, top, cz + (ph ? -0.1 : 0.1)], yaw: cp.yaw + 0.15 });
  if (ph) p.push({ prop: "poison-cabinet", ...onWall(sh, "right", 0.6, 0.3, 1.5) });
  // the customers' side: a chair to wait in, the clock, a notice
  // a glazed vitrine of goods on the left wall by the window (u from the street end), the bench across from it
  p.push({ prop: "vitrine", ...onWall(sh, "left", 1.25 + size("vitrine")[0] / 2, size("vitrine")[2]) });
  p.push({ prop: "waiting-bench", ...onWall(sh, "right", cz + 1.9, 0.45) });
  p.push({ prop: "regulator", ...onWall(sh, "right", cz + 0.8, 0.15, 2.3) });
  p.push({ prop: "war-poster", ...onWall(sh, "right", cz + 2.0, 0.01, 1.5) });
  p.push({ prop: "shop-pendant", at: [l * 0.4, h, cz], name: "pendant-a", lit }, { prop: "shop-pendant", at: [l * 0.55, h, Math.min(d - 1.4, cz + 2.2)], name: "pendant-b", lit });
  return p;
}

export function pharmacySet(trade: string, seed: number): Set {
  const sh = pharmacyShell(trade, seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: pharmacyProps(trade, sh, seed) };
  const wx = l / 2 + 0.75, name = isPharmacy(trade) ? "pharmacy" : "drugstore";
  return {
    id: `${name}-${Math.round(seed * 100)}`,
    title: `${isPharmacy(trade) ? "Apotheke (Offizin)" : "Drogerie"}, generated (seed ${seed})`,
    use: "the pharmacies and drugstores of the slice: the window from the street (atlas), the room when its door opens",
    rooms: [room],
    cams: [
      { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.2, d - 4], fov: 48, note: "from the pavement: the window, the shelving behind the counter" },
      { id: "inside", eye: [l - 0.9, 1.6, d - 0.8], at: [l * 0.35, 1.5, 0.5], fov: 66, note: "inside the door: the counter, the shelving round the back and left" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.1, dirt: 0.2, edges: 0.25 },
  };
}
