// The opening's rooms (blender/rooms.py), laid out: six rooms on one plan, 4.6 m wide (x from -2.3 to 2.3) and 6.4 m
// deep (z from 3.2 behind us to -3.2, the wall with the door), 2.7 m high. We walk each down its middle toward the
// door, so the middle is kept clear and the furniture stands along the walls. Sizes come from the build
// (sets/rooms.sizes.json: width, height, depth of each piece as built, its front toward +z).
import SIZES from "./rooms.sizes.json";
import type { Item } from "../v3/scene";
import type { V3 } from "../v2/math";

export const RX = 2.3, RZ = 3.2, RH = 2.7, WALL = 0.15;
export const DOOR = { w: 0.95, h: 2.08, hinge: [-0.475, 0, -RZ + 0.03] as V3 };
const Q = Math.PI / 2;
type Size = [number, number, number];
const size = (place: string, name: string): Size => { const s = (SIZES as Record<string, Record<string, Size>>)[place]?.[name]; if (!s) throw new Error(`no size for ${place}/${name}`); return s; };

/** a room's shell: floor, ceiling, the four walls, the door (how far open, 0..1) */
export function shell(place: string, open = 0): Item[] {
  const P = (name: string, file: string, at: V3, yaw = 0, more: Partial<Item> = {}): Item => ({ place, name, file, at, yaw, ...more });
  return [
    P("floor", "floor", [0, 0, 0]), P("ceiling", "ceiling", [0, RH, 0]),
    P("wall-door", "wall-door", [0, 0, -RZ]), P("door", "door", DOOR.hinge, 0, { clip: "open", t: open }),
    P("wall-window", "wall-window", [RX, 0, 0], -Q), P("wall-side", "wall-side", [-RX, 0, 0], Q), P("wall-back", "wall-back", [0, 0, RZ], Math.PI),
  ];
}
/** a builder for one room's furniture: against the left or right wall at z, on the far wall at x, free on the floor, or on top of another piece */
export function room(place: string) {
  const out: Item[] = [], tops: Record<string, { at: V3; h: number; yaw: number }> = {};
  let n = 0;
  const put = (name: string, at: V3, yaw: number, scale = 1, file = name): string => {
    const id = `${name}-${n++}`, s = size(place, file);
    out.push({ place, name: id, file, at, yaw, scale });
    tops[name] = tops[id] = { at, h: s[1] * scale, yaw };
    return id;
  };
  const api = {
    /** against the left wall, its front to the room */
    left: (name: string, z: number, o: { scale?: number; out?: number; file?: string; y?: number } = {}) => { const s = size(place, o.file ?? name), k = o.scale ?? 1; return put(name, [-RX + WALL + (s[2] * k) / 2 + (o.out ?? 0.02), o.y ?? 0, z], Q, k, o.file ?? name); },
    right: (name: string, z: number, o: { scale?: number; out?: number; file?: string; y?: number } = {}) => { const s = size(place, o.file ?? name), k = o.scale ?? 1; return put(name, [RX - WALL - (s[2] * k) / 2 - (o.out ?? 0.02), o.y ?? 0, z], -Q, k, o.file ?? name); },
    /** against the far wall (beside the door) */
    far: (name: string, x: number, o: { scale?: number; file?: string; y?: number } = {}) => { const s = size(place, o.file ?? name), k = o.scale ?? 1; return put(name, [x, o.y ?? 0, -RZ + WALL + (s[2] * k) / 2 + 0.02], 0, k, o.file ?? name); },
    /** anywhere on the floor */
    at: (name: string, x: number, z: number, yaw = 0, o: { scale?: number; file?: string; y?: number } = {}) => put(name, [x, o.y ?? 0, z], yaw, o.scale ?? 1, o.file ?? name),
    /** on top of a piece already placed: `along` its width and `across` its depth, in its own frame */
    on: (name: string, base: string, along = 0, across = 0, o: { scale?: number; yaw?: number; file?: string } = {}) => {
      const b = tops[base]; if (!b) throw new Error(`${place}: ${name} on ${base}, which isn't placed`);
      const c = Math.cos(b.yaw), s = Math.sin(b.yaw);
      return put(name, [b.at[0] + along * c + across * s, b.at[1] + b.h, b.at[2] - along * s + across * c], b.yaw + (o.yaw ?? 0), o.scale ?? 1, o.file ?? name);
    },
    /** hung from the ceiling */
    hang: (name: string, x: number, z: number, o: { scale?: number; file?: string } = {}) => put(name, [x, RH, z], 0, o.scale ?? 1, o.file ?? name),
    /** on a wall at a height: "left" | "right" | "far" */
    wall: (name: string, side: "left" | "right" | "far", along: number, y: number, o: { scale?: number; file?: string } = {}) =>
      put(name, side === "left" ? [-RX + WALL + 0.012, y, along] : side === "right" ? [RX - WALL - 0.012, y, along] : [along, y, -RZ + WALL + 0.012], side === "left" ? Q : side === "right" ? -Q : 0, o.scale ?? 1, o.file ?? name),
    items: out,
  };
  return api;
}

function kitchen(): Item[] {
  const r = room("kitchen");
  r.left("cabinet-b", 2.3); r.left("sideboard", 0.55); r.left("stove", -1.35); r.left("cabinet", -2.35);
  r.on("microwave", "sideboard", -0.75, 0, { scale: 0.5 }); r.on("kettle", "sideboard", 0.0, 0.02); r.on("cutting-board", "sideboard", 0.6, 0.05); r.on("lemon", "cutting-board", 0.05, 0); r.on("apple", "sideboard", 0.95, -0.05);
  r.on("pot", "stove", -0.08, -0.1, { scale: 0.75 }); r.on("enamel-pot", "cabinet", 0.2, 0); r.on("jug", "cabinet", -0.25, 0.05);
  r.right("table", -0.7, { out: 0.12 }); r.on("tea-set", "table", 0.45, 0.1, { scale: 0.8 }); r.on("cake", "table", -0.35, -0.2); r.on("croissant", "table", -0.6, 0.25); r.on("bowl", "table", -0.9, 0); r.on("bananas", "table", 0.0, -0.35, { scale: 0.6 });
  r.on("bottles", "table", 0.9, -0.4, { scale: 0.8, yaw: Q });
  r.at("chair", 0.72, -0.2, Q + 0.2); r.at("chair", 0.74, -1.25, Q - 0.25); r.at("chair", 1.5, 0.75, Math.PI);
  r.hang("lamp", 1.45, -0.7); r.far("plant", 1.65); r.wall("clock", "far", -1.35, 1.95); r.on("pan", "stove", 0.1, 0.12, { scale: 0.8 });
  return r.items;
}
function living(): Item[] {
  const r = room("living");
  r.left("bookshelf", 2.2); r.left("sofa-b", 0.3); r.left("side-table", -1.05); r.left("clock", -2.45);
  r.right("console", -1.2); r.on("television", "console", 0, 0); r.right("armchair", 1.9, { out: 0.25 }); r.right("sofa", -2.4, { out: 0.05, scale: 0.8 });
  r.at("coffee-table", -0.95, 0.3, Q, { scale: 0.62 }); r.on("chess", "coffee-table", 0.1, 0, { scale: 0.6 }); r.at("ottoman", 1.25, 0.55, 0.3, { scale: 0.8 });
  r.on("boombox", "side-table", 0, 0, { scale: 0.6 }); r.far("lounge-chair", -1.35, { scale: 0.85 }); r.far("plant", 1.3, { scale: 2.4 });
  r.hang("ceiling-lamp", 0, -1.9); r.wall("frame", "left", 0.3, 1.75); r.wall("frame-b", "far", 1.5, 1.6); r.wall("frame-c", "right", -1.2, 1.9);
  return r.items;
}
function study(): Item[] {
  const r = room("study");
  r.left("vitrine", 1.9); r.left("drawers", 0.1); r.left("console", -1.25); r.left("cabinet", -2.62, { scale: 0.8 });
  r.on("mantel-clock", "console", -0.4, 0); r.on("oil-lamp", "console", 0.45, 0, { scale: 0.7 }); r.on("vase", "console", 0.05, 0.02, { scale: 0.7 });
  r.right("table", -1.2, { out: 0.2, scale: 0.8 }); r.on("laptop", "table", 0, 0, { scale: 0.55, yaw: Math.PI }); r.on("encyclopedia", "table", -0.35, 0.25, { scale: 0.8 }); r.on("microscope", "table", 0.35, -0.2, { scale: 0.6 });
  r.at("armchair", 0.95, -0.5, Q + 0.3, { scale: 0.75 }); r.right("rocking-chair", 1.7, { out: 0.3 }); r.far("brass-vase", 1.55); r.far("projector", -1.6);
  r.hang("chandelier", 0, -0.6); r.wall("mirror", "far", 1.5, 1.75); r.wall("ukulele", "left", -0.7, 1.75);
  return r.items;
}
function workshop(): Item[] {
  const r = room("workshop");
  r.left("shelves-b", 2.4); r.left("tool-cart", 1.2); r.left("storage-cart", -0.5, { scale: 0.75 }); r.left("drill-press", -1.8); r.left("barrel", -2.6);
  r.right("welding-cart", 2.1); r.right("generator", 0.9); r.right("crate-b", -0.6); r.right("hand-truck", -1.8); r.right("propane", -2.6);
  r.on("crate", "crate-b", 0, 0, { scale: 0.7 }); r.on("spray-paint", "tool-cart", 0.2, 0); r.on("wrench", "tool-cart", -0.3, 0.1, { yaw: 0.6 });
  r.at("stool", -1.05, 0.3, 0.4); r.far("sledgehammer", 1.3); r.wall("wall-lamp", "far", -1.4, 2.1); r.far("shelves-b", 1.85);
  return r.items;
}
function greenhouse(): Item[] {
  const r = room("greenhouse");
  r.left("table", 1.9); r.left("planter-c", 0.5); r.left("planter-b", -0.9); r.left("planter", -2.2);
  r.on("tray", "table", -0.4, 0); r.on("clay-pot", "table", 0.1, 0.05); r.on("trowel", "table", 0.45, -0.1); r.on("gloves", "table", 0.3, 0.2);
  r.right("bench", 1.6); r.right("compost", -0.2, { scale: 0.6 }); r.right("plant", -1.5); r.right("plant-b", -2.5);
  r.on("watering-can", "bench", -0.2, 0); r.on("basket", "bench", 0.3, 0);
  r.at("calathea", -1.45, -0.25, Q, { scale: 0.7 }); r.at("anthurium", 1.5, 0.75, -Q, { scale: 0.6 }); r.at("fern", -1.4, 1.2, Q, { scale: 0.6 });
  r.far("gnome", -1.5); r.far("bucket", 1.5); r.at("boots", 1.35, 2.6, 0.4, { scale: 0.7 }); r.wall("hose", "far", 1.6, 1.3);
  return r.items;
}
function hallway(): Item[] {
  const r = room("hallway");
  r.left("side-table", 0.8); r.on("vase", "side-table", 0, 0); r.right("stool", -0.6); r.far("plant", -1.55);
  r.wall("frame", "left", -0.7, 1.6); r.wall("frame-b", "right", 0.9, 1.6); r.wall("frame", "right", -1.9, 1.6); r.wall("frame-b", "left", 2.0, 1.6);
  return r.items;
}
function dining(): Item[] {
  const r = room("dining");
  r.left("cabinet", 1.7, { scale: 0.8 }); r.left("commode", -0.6); r.left("clock", -2.5);
  r.on("vase", "commode", -0.3, 0); r.on("lantern", "commode", 0.3, 0.05); r.on("goblets", "commode", 0, -0.08, { scale: 0.7 });
  r.right("table", -0.9, { scale: 2.3, out: 0.25 }); r.on("cake", "table", -0.3, 0); r.on("tea-set", "table", 0.35, 0.1, { scale: 0.8 }); r.on("plate", "table", -0.65, 0.2); r.on("pears", "plate", 0, 0);
  r.on("pomegranate", "table", 0.1, -0.3); r.on("bottles", "table", 0.75, -0.25, { scale: 0.8, yaw: Q });
  r.at("chair", 0.62, -0.5, Q + 0.15); r.at("chair-b", 1.4, 0.75, Math.PI, { scale: 0.43 });
  r.hang("chandelier", 1.25, -0.9); r.far("plant", 1.6); r.wall("mirror", "far", -1.45, 1.75); r.wall("frame", "left", -0.6, 1.9);
  return r.items;
}
function cellar(): Item[] {
  const r = room("cellar");
  r.left("shelves", 1.3); r.left("barrels", -1.5, { scale: 0.42 }); r.left("barrel", -2.7);
  r.right("chest", 1.9); r.right("crate-b", 0.5); r.on("crate", "crate-b", 0, 0, { scale: 0.7 }); r.right("hand-truck", -0.9); r.right("barrel", -2.2);
  r.on("oil-lamp", "chest", 0.2, 0, { scale: 0.6 }); r.on("jug", "chest", -0.25, 0.05); r.on("bottles", "barrel", 0, 0, { scale: 0.6 });
  r.far("bucket", -1.6); r.far("wooden-lantern", 1.45); r.at("basket", 1.2, -1.75, 0.3); r.on("onion", "basket", 0, 0); r.at("gallon", -1.2, 0.2, 0.4); r.at("lantern", -1.25, -2.6, 0);
  return r.items;
}
function kidsroom(): Item[] {
  const r = room("kidsroom");
  r.left("bed", -1.35); r.left("nightstand", 0.1); r.on("alarm-clock", "nightstand", 0, 0); r.left("toy-chest", 1.7); r.at("football", -0.9, 1.9, 0.6); r.at("bat", -1.5, 2.55, 0.3);
  r.right("desk", -1.7); r.on("lamp", "desk", -0.2, -0.05, { scale: 0.7 }); r.on("console", "desk", 0.15, 0.05, { scale: 0.7 }); r.at("chair", 1.2, -1.65, Q + 0.3);
  r.far("drawers", 1.1, { scale: 0.8 }); r.on("boombox", "drawers", 0.25, 0, { scale: 0.7 }); r.on("duck", "drawers", -0.4, 0.05, { scale: 0.6 }); r.on("books", "drawers", -0.05, -0.1, { scale: 0.7 });
  r.far("nightstand-b", -1.7); r.at("gamepad", 0.5, 0.9, 0.7, { y: 0.01 }); r.wall("dartboard", "far", -1.25, 1.65); r.wall("frame", "left", 1.3, 1.75); r.wall("ukulele", "left", -0.2, 1.85); r.hang("ceiling-lamp", 0, 0);
  return r.items;
}
export const FURNITURE: Record<string, () => Item[]> = { kitchen, living, study, workshop, greenhouse, hallway, dining, cellar, kidsroom };
export const ROOMS = Object.keys(FURNITURE);
/** a whole room: its shell (the door `open` 0..1) and its furniture */
export const roomItems = (place: string, open = 0): Item[] => [...shell(place, open), ...FURNITURE[place]()];
