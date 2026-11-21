// An interior set: rooms (each a shell in its own frame, placed in the set's frame) and the props placed in them. The
// set's frame is metres with y up; a set placed in the city gets one transform from its building (interiors/SYSTEM.md).
import type { V3 } from "../kit/geo";
import type { Shell } from "../shell";

/** `ghost`: its lights only, no geometry (the room atlas leaves mid-room props out of its faces but keeps their light). */
export type Place = { prop: string; at: V3; yaw?: number; scale?: number; name?: string; lit?: boolean; ghost?: boolean };
/** `panes`: its window openings show rooms behind them (interior mapping from the room atlas): a court's far walls. */
export type Room = { id: string; shell: Shell; at: V3; yaw?: number; props: Place[]; panes?: boolean };
export type Cam = { id: string; eye: V3; at: V3; fov: number; note: string; /** a hand lamp near the eye, lumens */ lamp?: number; /** stops on top of the set's exposure (a cam out in the court, away from the room's lamp) */ ev?: number };
export type Set = {
  id: string;
  title: string;
  /** what it is built for */
  use: string;
  rooms: Room[];
  cams: Cam[];
  /** light from outside: a window's sky, a light well, the bore's lamp */
  outside?: { at: V3; look: V3; lumens: number; color: string; kind: "point" | "spot" }[];
  ambient: { color: string; brightness: number };
  /** daylight: the sun from a direction (a point it shines from, relative to the target), in lux */
  sun?: { from: V3; at: V3; lux: number; color: string };
  /** soft light through a window from the sky: a rectangle facing into the room */
  sky?: { at: V3; look: V3; w: number; h: number; lumens: number; color: string; /** stands in for bounce raster light doesn't trace; ray-traced light leaves it out */ bounce?: boolean }[];
  /** stops of exposure for this set's light (a candle-lit cellar wants many) */
  exposure: number;
  /** the scene's one wear recipe (world/SOP.md §5.1) */
  wear?: import("../kit/proc").Wear;
  /** what the rooms behind a `panes` room's windows show: the share lit (the rest dark, or day rooms by day), the
   *  pane glow lit and dark (emissive, in this set's exposure), the light each lit window throws (lumens), a seed */
  windows?: { lit: number; glow: number; dark: number; lumens: number; seed: number };
  fog?: { at: V3; size: V3; density: number; color: string };
};

const Y = (yaw: number) => ({ c: Math.cos(yaw), s: Math.sin(yaw) });
/** A point in a room's frame, in the set's frame. */
export function toSet(r: Room, p: V3): V3 {
  const { c, s } = Y(r.yaw ?? 0);
  return [r.at[0] + c * p[0] + s * p[2], r.at[1] + p[1], r.at[2] - s * p[0] + c * p[2]];
}
/** Against a wall: the prop's back to the wall at u along it (from its left end seen from inside), off the floor by y. */
export function onWall(sh: Shell, wall: "back" | "front" | "left" | "right", u: number, depth: number, y = 0, gap = 0.01): { at: V3; yaw: number } {
  const k = depth / 2 + gap;
  if (wall === "back") return { at: [u, y, k], yaw: 0 };
  if (wall === "front") return { at: [sh.l - u, y, sh.d - k], yaw: Math.PI };
  if (wall === "left") return { at: [k, y, sh.d - u], yaw: Math.PI / 2 };
  return { at: [sh.l - k, y, u], yaw: -Math.PI / 2 };
}

/** A point on or in another placed prop: `local` in that prop's frame (a kettle on the range, canisters on the dresser). */
export function onProp(base: { at: V3; yaw: number }, local: V3): { at: V3; yaw: number } {
  const c = Math.cos(base.yaw), s = Math.sin(base.yaw);
  return { at: [base.at[0] + c * local[0] + s * local[2], base.at[1] + local[1], base.at[2] - s * local[0] + c * local[2]], yaw: base.yaw };
}
