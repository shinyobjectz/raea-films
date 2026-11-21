// The photographer's (kit/photo.ts): the reception in front, where the window and the walls show the work, and the
// studio behind it, lit electrically, its backdrop on the back wall, the sitter's chair and column before it, the camera
// facing them. From the street the atlas sees through both: portraits in the window, the camera and the painted park at
// the back. shopSet() in shops.ts dispatches here.
import { hash, type V3 } from "./kit/geo";
import { def } from "./kit/prop";
import type { Shell } from "./shell";
import { onProp, onWall, type Place, type Room, type Set } from "./sets/types";

export const PHOTO = "shop-photo";

/** 5-6.5 m wide, 7-9 m deep, papered; the door to the darkroom and the stairs at the back left. */
export function photoShell(seed: number): Shell {
  const r = (k: number) => hash(seed, k, 821), l = 5 + 1.5 * r(1), d = 7 + 2 * r(2);
  return {
    l, d, h: 4.4, t: { back: 0.4, front: 0.64, left: 0.3, right: 0.3 }, seed: Math.floor(seed * 7) % 997,
    walls: "paper-damask", dado: { mat: "wood-dark", h: 1.0 }, floor: "boards", ceiling: "plaster",
    openings: [
      { wall: "front", u: l / 2, w: 3.4, y: 0, h: 3.4, kind: "door" },
      { wall: "back", u: 0.8, w: 0.9, y: 0, h: 2.2, kind: "door" },
    ],
  };
}

export function photoProps(sh: Shell, seed: number, lit = true): Place[] {
  const r = (k: number) => hash(seed, k, 822), p: Place[] = [], { l, d, h } = sh;
  const size = (id: string) => (def(id)?.size ?? [1, 1, 0.5]) as [number, number, number];
  const front = { at: [l / 2, 0, d] as V3, yaw: Math.PI };
  p.push({ prop: r(1) < 0.5 ? "shopfront-small-green" : "shopfront-small-brown", ...front });
  // the window: two big portraits on easels on the podium, turned a little to the pavement
  const podium = { at: [l / 2 + 0.75, 0, d - 0.55] as V3, yaw: 0 };
  p.push({ prop: "window-podium", ...podium, name: "display" });
  p.push({ prop: "portrait-easel", ...onProp(podium, [-0.45, 0.55, -0.1]), yaw: 0.2 }, { prop: "portrait-easel", ...onProp(podium, [0.5, 0.55, -0.1]), yaw: -0.25 });
  // the reception: portraits on both walls by the door, the counter facing the door
  p.push({ prop: "portrait-wall", ...onWall(sh, "left", 1.9, 0.04, 1.35) }); // u from the street end
  p.push({ prop: "portrait-wall", ...onWall(sh, "right", d - 1.9, 0.04, 1.35) }); // u from the back
  const cz = d - 2.9 - 0.3 * r(2);
  p.push({ prop: "glass-counter", at: [l * 0.62, 0, cz], yaw: 0 });
  p.push({ prop: "waiting-bench", ...onWall(sh, "left", 3.5, 0.45) });
  p.push({ prop: "regulator", ...onWall(sh, "right", cz, 0.15, 2.3) });
  // the studio: the backdrop on the back wall clear of the door, the column and chair before it, the camera 2.4 m out,
  // the lamp to the left turned on the sitter; a pendant over the studio, one over the reception
  const bx = Math.max(1.35 + 1.5 + 0.05, l / 2 + 0.4), sx = bx - 0.3, sz = 1.0;
  p.push({ prop: "backdrop", ...onWall(sh, "back", bx, size("backdrop")[2]) });
  p.push({ prop: "posing-column", at: [sx + 0.75, 0, sz - 0.15], yaw: 0 });
  p.push({ prop: "chair", at: [sx, 0, sz], yaw: 0.2 });
  p.push({ prop: "studio-camera", at: [sx + 0.2, 0, sz + 2.4], yaw: Math.PI });
  const lx = sx - 1.5, lz = sz + 1.3;
  p.push({ prop: "studio-lamp", at: [lx, 0, lz], yaw: Math.atan2(sx - lx, sz - lz), lit: false }); // burned only for a sitting
  p.push({ prop: "shop-pendant", at: [sx + 0.3, h, sz + 1.3], name: "pendant-b", lit });
  p.push({ prop: "shop-pendant", at: [l * 0.55, h, cz + 0.4], name: "pendant-a", lit });
  return p;
}

export function photoSet(seed: number): Set {
  const sh = photoShell(seed), { l, d } = sh;
  const room: Room = { id: "shop", shell: sh, at: [0, 0, 0], props: photoProps(sh, seed) };
  const wx = l / 2 + 0.75;
  return {
    id: `photo-${Math.round(seed * 100)}`,
    title: `photographer's reception and studio, generated (seed ${seed})`,
    use: "the photographers of the slice: the window from the street (atlas), the room when its door opens",
    rooms: [room],
    cams: [
      { id: "street", eye: [wx - 1.0, 1.6, d + 3.0], at: [wx + 0.1, 1.2, d - 4], fov: 48, note: "from the pavement: the portraits in the window, the studio behind" },
      { id: "inside", eye: [l - 0.8, 1.6, d - 0.8], at: [l * 0.4, 1.3, 0.5], fov: 66, note: "inside the door: the reception, the studio, the camera on the sitter's chair" },
    ],
    outside: [{ at: [l / 2, 4.5, d + 6], look: [l / 2, 0, d], lumens: 700, color: "#ffcf9a", kind: "spot" }],
    ambient: { color: "#4a4e5a", brightness: 22 },
    exposure: -0.5,
    wear: { dust: 0.1, dirt: 0.2, edges: 0.25 },
  };
}
