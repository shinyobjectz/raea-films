// The diner's components on the stand (parts/library.tsx): the counter and its stools before the back wall, a booth
// under the window with the neon in it, the jukebox at the left.
//   raea render library/diner.tsx --composition library-diner --at 0,30 -o out/library/diner/
// library-diner-cup is the montage's circle on its own: the coffee cup from straight above (the cream's turn);
// library-diner-counter is a closer look along the counter (the small props and their rigs).
import { Place, type Part } from "../parts/library";

export const TOP = 1.02; // the counter's top
export const TABLE = 0.75; // the booth table's top
export const WALL = -2.6; // the back wall's face
export const DINER: Part[] = [
  { file: "floor", at: [0.2, 0.004, 0.2] },
  { file: "wall", at: [-1.3, 0, WALL], name: "wall-part" },
  { file: "window", at: [2.9, 0, WALL] },
  { file: "neon-sign", at: [2.9, 1.78, WALL - 0.03] },
  { file: "back-bar", at: [-2.2, 0, WALL + 0.3], clip: "toast" },
  { file: "counter", at: [-1.2, 0, -1.2] },
  { file: "stool", at: [-2.55, 0, -0.5], clip: "spin" },
  { file: "stool", at: [-1.65, 0, -0.5], yaw: 1.1, clip: "wobble" },
  { file: "stool", at: [-0.75, 0, -0.5], yaw: 2.3 },
  { file: "stool", at: [0.15, 0, -0.5], yaw: -0.8 },
  { file: "cash-register", at: [-2.6, TOP, -1.28], clip: "drawer" },
  { file: "coffee-pot", at: [-1.85, TOP, -1.4], clip: "pour" },
  { file: "plate", at: [-1.62, TOP, -0.98], clip: "fork" },
  { file: "coffee-cup", at: [-0.75, TOP, -0.98], clip: "swirl" },
  { file: "coffee-cup", at: [-1.3, TOP, -1.0], yaw: 2.0, clip: "lift" },
  { file: "condiments", at: [-0.2, TOP, -1.3], clip: "pull" },
  { file: "pie-case", at: [0.28, TOP, -1.22], clip: "lid" },
  { file: "menu-board", at: [-2.2, 2.52, WALL] },
  { file: "wall-clock", at: [-0.45, 2.35, WALL], clip: "hands" },
  { file: "jukebox", at: [-3.55, 0, -0.7], yaw: 0.55, clip: "arm" },
  { file: "booth-seat", at: [2.2, 0, -1.95], yaw: Math.PI / 2 },
  { file: "booth-seat", at: [3.6, 0, -1.95], yaw: -Math.PI / 2 },
  { file: "booth-table", at: [2.9, 0, -1.95], yaw: Math.PI / 2 },
  { file: "condiments", at: [2.9, TABLE, -2.35], yaw: Math.PI / 2 },
  { file: "plate", at: [2.72, TABLE, -1.7], yaw: 1.2 },
  { file: "coffee-cup", at: [3.08, TABLE, -1.75], yaw: -0.6 },
  { file: "pendant", at: [-2.4, 3.0, -1.2] },
  { file: "pendant", at: [-1.2, 3.0, -1.2], clip: "sway" },
  { file: "pendant", at: [0.0, 3.0, -1.2] },
  { file: "ceiling-fan", at: [1.7, 3.0, -0.3], clip: "spin" },
];
// (the counter's top a centimetre over the stand's floor, so the two don't fight)
export const CUP: Part[] = [{ file: "counter", at: [0.4, 0.01 - TOP, 0.25] }, { file: "coffee-cup", at: [0, 0.01, 0], clip: "swirl" }, { file: "plate", at: [-0.26, 0.01, 0.03], clip: "fork" }, { file: "condiments", at: [0.42, 0.01, -0.12], clip: "pull" }];

