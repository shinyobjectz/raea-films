// The office as a room (sets/office.tsx is the one-desk stand): an open-plan floor 14 m wide and 26 m deep, an aisle
// down the middle toward -z, six rows of tanker desks either side facing it, partitions between the rows, troffers in
// the ceiling, windows with blinds along the right wall (+x), the door, the cooler and the printer at the far end.
// `seed` dresses each desk differently; the hero chair (left, second row) is left out for the shot to place.
import type { Piece } from "../v2/stage";
import type { V3 } from "../v2/math";

export const ROOM = { x: 7, z0: 5, z1: -22, h: 2.7 };
export const ROWS = [0, -3.2, -6.4, -9.6, -12.8, -16];
export const TOP = 0.788;
export const HERO = { row: 1, side: -1 as const };          // the chair the cursor drags
export const WINDOWS = ROWS.map((z) => z - 0.2);             // the windows' centres along the right wall
const rnd = (seed: number, i: number) => { const x = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453; return x - Math.floor(x); };
const P = (name: string, file: string, at: V3, yaw = 0, more: Partial<Piece> = {}): Piece => ({ place: "office", name, file, at, yaw, ...more });

/** a desk at (x, z) whose sitter faces `face` (+1: toward +x): a point on it, in the room */
const on = (x: number, z: number, face: number, lx: number, lz: number, y = TOP): V3 => [x + face * lz, y, z - face * lx];

/** what the note "somewhere worth staying." changes, as a material's new colour */
export const NICE = { partition_fabric: "#f6cfa6", office_plaster: "#fff0d8", office_carpet: "#d9b48c" };
/** `nice`: the room's surfaces repainted warm (a step: it happens under the drawing's flash); `grow`: the plants that
 *  come up along the aisle, 0 none to 1 full grown, the near rows first */
export function officeRoom(seed = 1, opts: { tubes?: number | ((row: number) => number); blinds?: number | ((i: number) => number); nice?: boolean; grow?: number; hero?: number } = {}): Piece[] {
  const nice = (material: keyof typeof NICE) => (opts.nice ? { finish: [{ material, color: NICE[material] }] } : {});
  const out: Piece[] = [];
  const glowOf = (r: number) => (typeof opts.tubes === "function" ? opts.tubes(r) : opts.tubes ?? 1);
  ROWS.forEach((z, r) => {
    for (const side of [-1, 1]) {
      const id = `${side < 0 ? "l" : "r"}${r}`;
      const x = side * 3.4, face = -side;                    // the sitter's side is the aisle's
      const yaw = face > 0 ? Math.PI / 2 : -Math.PI / 2;
      const k = (i: number) => rnd(seed + r * 7 + (side > 0 ? 3 : 0), i);
      out.push(P(`desk-${id}`, "desk", [x, 0, z], yaw));
      out.push(P(`monitor-${id}`, "monitor", on(x, z, face, 0.1 * (k(1) - 0.5), -0.43), yaw, { clip: "swing", t: 0 }));
      out.push(P(`keyboard-${id}`, "keyboard", on(x, z, face, 0.05, 0.16), yaw + 0.1 * (k(2) - 0.5)));
      out.push(P(`mouse-${id}`, "mouse", on(x, z, face, 0.36, 0.2), yaw));
      out.push(P(`mug-${id}`, "mug", on(x, z, face, -0.5 + 0.2 * k(3), 0.0), yaw + 6 * k(4)));
      out.push(P(`cables-${id}`, "cables", [x - face * 0.5, 0, z], yaw));
      if (k(5) > 0.3) out.push(P(`phone-${id}`, "phone", on(x, z, face, 0.72, -0.12), yaw + 0.2));
      if (k(6) > 0.4) out.push(P(`lamp-${id}`, "desk-lamp", on(x, z, face, -0.82, -0.3), yaw + 0.6));
      if (k(7) > 0.5) out.push(P(`stationery-${id}`, "stationery", on(x, z, face, 0.48, -0.3), yaw));
      if (k(8) > 0.6) out.push(P(`clipboard-${id}`, "clipboard", on(x, z, face, -0.6, 0.27), yaw + 0.3));
      if (k(9) > 0.6) out.push(P(`stapler-${id}`, "stapler", on(x, z, face, 0.6, 0.3), yaw - 0.4));
      if (k(10) > 0.45) out.push(P(`bin-${id}`, "bin", [x + face * 0.3, 0, z + 1.25], 0));
      if (!(r === (opts.hero ?? HERO.row) && side === HERO.side)) out.push(P(`chair-${id}`, "chair", [x + face * (0.95 + 0.3 * k(11)), 0, z + 0.3 * (k(12) - 0.5)], yaw + Math.PI + 1.2 * (k(13) - 0.5), { clip: "swivel", t: 0 }));
      out.push(P(`partition-${id}`, "partition", [x - face * 0.2, 0, z - 1.6], 0, nice("partition_fabric")));
      out.push(P(`partition-b-${id}`, "partition", [x - face * 1.0, 0, z - 0.2], Math.PI / 2, { scale: 1, ...nice("partition_fabric") }));
      // a plant at the aisle end of each desk, there from the first frame at no size (a render keeps what it starts with)
      const g = Math.min(1, Math.max(0, (opts.grow ?? 0) * 2.2 - r * 0.2 - (side > 0 ? 0.1 : 0)));
      out.push(P(`grown-${id}`, (r + (side > 0 ? 1 : 0)) % 2 ? "plant-b" : "plant", [x + face * 1.75, 0, z - 1.35], 5 * k(14), { scale: 0.001 + 0.999 * (1 - (1 - g) ** 3) * (0.8 + 0.3 * k(15)) }));
    }
    // the ceiling's fittings: three across, one row a desk row
    for (const cx of [-3.4, 0, 3.4]) out.push(P(`tubes-${r}-${cx}`, "tubes", [cx, ROOM.h + 0.004, z - 0.4], Math.PI / 2, { glow: { tubes_glow: glowOf(r) } }));
  });
  // the windows' blinds along the right wall, facing into the room
  WINDOWS.forEach((z, i) => out.push(P(`blinds-${i}`, "blinds", [ROOM.x - 0.06, 2.45, z], -Math.PI / 2, { clip: "slats", t: typeof opts.blinds === "function" ? opts.blinds(i) : opts.blinds ?? 1 })));
  // the room itself: carpet, a suspended ceiling, plaster bays down the left, window bays down the right (one a window,
  // where the blinds hang), the far wall with its fire doors, and the wall behind the camera
  const midZ = (ROOM.z0 + ROOM.z1) / 2;
  out.push(P("floor", "floor", [0, 0, midZ], 0, nice("office_carpet")), P("ceiling", "ceiling", [0, ROOM.h, midZ]));
  [3.0, ...WINDOWS, WINDOWS[5] - 3.2, WINDOWS[5] - 6.4].forEach((z, i) => {
    out.push(P(`wall-l-${i}`, "wall", [-ROOM.x - 0.12, 0, z], Math.PI / 2, nice("office_plaster")));
    out.push(P(`wall-r-${i}`, i >= 1 && i <= 6 ? "window-wall" : "wall", [ROOM.x + (i >= 1 && i <= 6 ? 0.2 : 0.12), 0, z], -Math.PI / 2));
  });
  [-6.4, -3.2, 0, 3.2, 6.4].forEach((x, i) => {
    out.push(P(`wall-far-${i}`, x === 3.2 ? "door" : "wall", [x, 0, ROOM.z1 - 0.12], 0, x === 3.2 ? { clip: "open", t: 0 } : {}));
    out.push(P(`wall-near-${i}`, "wall", [x, 0, ROOM.z0 + 0.12], Math.PI, nice("office_plaster")));
  });
  // the far end
  out.push(P("whiteboard", "whiteboard", [-2.6, 1.5, ROOM.z1 + 0.02], 0));
  out.push(P("wall-clock", "wall-clock", [1.2, 2.25, ROOM.z1 + 0.02], 0, { clip: "hands", t: 0.3 }));
  out.push(P("exit-sign", "exit-sign", [3.2, ROOM.h, ROOM.z1 + 0.6], 0));
  out.push(P("fire-alarm", "fire-alarm", [5.0, 1.4, ROOM.z1 + 0.02], 0));
  out.push(P("printer", "printer", [5.6, 0, ROOM.z1 + 0.6], 0, { clip: "paper feed", t: 0 }));
  out.push(P("shelf-unit", "shelf-unit", [-6.7, 0, -8], Math.PI / 2));
  [-2.5, -11, -14.2].forEach((z, i) => out.push(P(`cabinet-${i}`, "filing-cabinet", [-6.6, 0, z], Math.PI / 2, { clip: "drawer", t: 0 })));
  out.push(P("cabinet-pair", "filing-cabinet", [-6.6, 0, -3.0], Math.PI / 2));
  out.push(P("plant-a", "plant", [-6.3, 0, 1.2], 0.4, { clip: "sway", t: 0 }));
  out.push(P("plant-b", "plant-b", [6.2, 0, -18.4], 2.0));
  out.push(P("plant-c", "plant", [6.3, 0, 1.6], 2.4));
  out.push(P("laptop", "laptop", [-5.8, 0, -19.5], 0.8));
  return out;
}
