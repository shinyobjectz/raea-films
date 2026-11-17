// The laundromat's components on the stand (parts/library.tsx): the room assembled from its parts, 9 x 6.4 m, the
// dryers along the back wall, the shopfront on the left, the washers along the right. Frame 0 is rest, frame 30 every
// rig at the end of its clip.
//   raea render library/laundromat.tsx --composition library-laundromat --at 0,30 -o out/library/laundromat/
import { Place, type Part, type V3 } from "../parts/library";

export const Q = Math.PI / 2;
export const BACK = -3.2; // the back wall's face
export const LEFT = -4.5; // the shopfront's face
export const RIGHT = 4.5; // the side wall's face
export const DRY = BACK + 0.48; // the dryers' centres
export const DRYERS = [-2.4, -1.59, -0.78, 0.03, 0.84];
export const OPEN = 3; // the dryer whose door the cursor pulls
export const TABLE: V3 = [-0.9, 0, 0.5];
export const WASH = RIGHT - 0.4;
export const WASHERS = [-1.9, -1.2, -0.5, 0.2];
export const SHELF: V3 = [RIGHT, 1.72, -1.7];

export const LAUNDROMAT: Part[] = [
  // the shell
  { file: "floor", at: [0, 0.004, 0] },
  { file: "wall-back", at: [0, 0, BACK] },
  { file: "wall-side", at: [RIGHT, 0, 0], yaw: -Q, clip: "door" },
  { file: "storefront", at: [LEFT, 0, 0], yaw: Q, clip: "door" },
  { file: "ceiling", at: [-0.78, 3.0, BACK + 0.6] },
  { file: "tubes", at: [-0.78, 3.0, BACK + 0.9] },
  // the dryers, their ducts, a load in each upper drum, and the sheet in the open one
  ...DRYERS.flatMap((x, i): Part[] => [
    { file: "dryer", at: [x, 0, DRY], clip: i === OPEN ? "door" : i === 0 ? "door lower" : "drum", name: `dryer-${i}` },
    { file: "duct", at: [x, 0, DRY], name: `duct-${i}` },
    { file: "laundry", at: [x, 1.57, DRY + 0.045], clip: i % 2 ? "float" : "tumble", name: `laundry-upper-${i}` },
    { file: "laundry", at: [x, 0.63, DRY + 0.045], yaw: Math.PI, clip: i % 2 ? "tumble" : "float", name: `laundry-lower-${i}` },
  ]),
  { file: "sheet", at: [DRYERS[OPEN], 1.57, DRY + 0.045], clip: "drift" },
  { file: "sheet", at: [-2.7, 1.5, 0.5], yaw: 0.35, clip: "billow", name: "sheet-billow" },
  // along the back wall
  { file: "bin", at: [-3.25, 0, BACK + 0.4], clip: "flap" },
  { file: "bulletin-board", at: [-3.7, 1.25, BACK + 0.001], clip: "flutter" },
  { file: "tv", at: [-3.9, 2.45, BACK + 0.001], yaw: 0.5, clip: "swing" },
  { file: "fire-alarm", at: [1.4, 1.4, BACK + 0.001] },
  { file: "soap-vendor", at: [1.9, 1.35, BACK + 0.001], clip: "vend" },
  { file: "change-machine", at: [2.65, 1.3, BACK + 0.001], clip: "coins" },
  { file: "wall-clock", at: [2.28, 2.35, BACK + 0.001], clip: "hands" },
  { file: "vending-machine", at: [3.55, 0, BACK + 0.46], clip: "drop" },
  // along the right wall: the washers under their shelf, the notices
  ...WASHERS.map((z, i): Part => ({ file: "washer", at: [WASH, 0, z], yaw: -Q, clip: i === 1 ? "door" : "drum", name: `washer-${i}` })),
  { file: "shelf", at: SHELF, yaw: -Q },
  { file: "detergent", at: [SHELF[0] - 0.14, SHELF[1], SHELF[2]], yaw: -Q, clip: "tip" },
  { file: "posters", at: [RIGHT - 0.001, 2.3, 0.25], yaw: -Q },
  // under the shopfront's window
  { file: "plastic-chair", at: [LEFT + 0.5, 0, -1.3], yaw: Q },
  { file: "basket", at: [LEFT + 0.52, 0.45, -1.02], yaw: Q + 0.2, name: "basket-on-chair" },
  { file: "gumball-machine", at: [LEFT + 0.45, 0, 0.35], yaw: Q, clip: "crank" },
  // the floor
  { file: "folding-table", at: TABLE },
  { file: "basket", at: [TABLE[0] - 0.4, 0.9, TABLE[2] + 0.05], yaw: 0.15 },
  { file: "laundry-cart", at: [1.5, 0, 0.9], yaw: 0.5, clip: "sway" },
  { file: "wet-floor-sign", at: [2.6, 0, 1.6], yaw: -0.6 },
  // the ceiling's fittings
  { file: "ceiling-fan", at: [0.8, 3.0, 0.4], clip: "spin" },
  { file: "exit-sign", at: [-3.6, 3.0, 1.4], yaw: Q },
];

export const VIEWS: Record<string, { eye: V3; look: V3; fov?: number }> = {
  "library-laundromat": { eye: [0.5, 4.6, 8.4], look: [0, 1.0, -0.9], fov: 54 },
  // closer looks at the same room, for checking the parts
  "library-laundromat-dryers": { eye: [0.9, 1.5, 0.3], look: [-0.4, 1.15, -2.7], fov: 50 },
  "library-laundromat-left": { eye: [0.2, 1.9, 1.6], look: [-4.5, 1.1, -1.5], fov: 52 },
  "library-laundromat-right": { eye: [-0.4, 1.9, 1.4], look: [4.5, 1.1, -1.3], fov: 52 },
  "library-laundromat-floor": { eye: [0.8, 1.7, 4.4], look: [0.2, 0.8, 0.6], fov: 46 },
};

