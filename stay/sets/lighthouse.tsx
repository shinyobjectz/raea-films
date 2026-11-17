// The lighthouse's components on the stand (parts/library.tsx): sea level is the stand's floor, the headland's
// plateau 20 m above it, the tower's gallery deck 18 m above that.
//   raea render library/lighthouse.tsx --composition library-lighthouse --at 0,30 -o out/library/lighthouse/
import { Place, type Part } from "../parts/library";

export const TOP = 20; // the cliff's plateau above the sea
export const DECK = TOP + 18; // the tower's gallery deck
export const HOUSE: [number, number] = [-25, -20]; // the cottage's middle (x, z)
export const LIGHTHOUSE: Part[] = [
  { file: "sky", at: [0, 0, 0] },
  { file: "sea", at: [0, 0, 0], clip: "swell" },
  { file: "cliff", at: [0, 0, 0] },
  { file: "surf", at: [0, 0, 0], clip: "wash" },
  { file: "sea-stacks", at: [-24, 0, 36], yaw: 0.4 },
  { file: "buoy", at: [-6, 0.15, 46], clip: "bob" },
  { file: "tower", at: [0, TOP, 0], clip: "door" },
  { file: "gallery", at: [0, DECK, 0] },
  { file: "lantern-room", at: [0, DECK, 0], clip: "vane" },
  { file: "fresnel-lens", at: [0, DECK, 0], clip: "turn" },
  { file: "beam", at: [0, DECK + 2.1, 0], clip: "sweep" },
  { file: "cottage", at: [HOUSE[0], TOP, HOUSE[1]], clip: "door" },
  { file: "lifebuoy", at: [HOUSE[0] + 1.7, TOP + 1.55, HOUSE[1] + 2.76] },
  { file: "bench", at: [HOUSE[0] - 2.9, TOP, HOUSE[1] + 3.2] },
  { file: "path", at: [-2.5, TOP, 5.2], yaw: 2.42 },
  { file: "path", at: [-14.5, TOP, -5.3], yaw: 2.42, name: "path-2" },
  { file: "fence", at: [0, TOP, 9], clip: "gate" },
  { file: "fence-run", at: [6.1, TOP, 9], yaw: 0.44 },
  { file: "fence-run", at: [-15.9, TOP, 4.4], yaw: -0.44, name: "fence-run-2" },
  { file: "shrub", at: [-13, TOP, 1], clip: "sway" },
  { file: "shrub", at: [14, TOP, 2], yaw: 1.2, scale: 0.8, clip: "sway", name: "shrub-2" },
  { file: "shrub", at: [-32, TOP, -15], yaw: -0.6, scale: 1.1, clip: "sway", name: "shrub-3" },
  { file: "rocks", at: [10, TOP, -8], yaw: 0.5 },
  { file: "rocks", at: [-18, TOP, 11], yaw: 2.1, name: "rocks-2" },
  { file: "gulls", at: [11, DECK + 5, 16], clip: "flap" },
  { file: "gulls", at: [-16, TOP + 9, 24], yaw: 0.8, clip: "flap", name: "gulls-2" },
];
export const LENS: Part[] = [{ file: "fresnel-lens", at: [0, 0, 0], clip: "turn" }];
// the rigs the place's frame doesn't run: the lantern's gallery door, the beam's dip
export const RIGS: Part[] = [
  { file: "lantern-room", at: [0, 0, 0], yaw: -1.92, clip: "hatch" },
  { file: "fresnel-lens", at: [0, 0, 0] },
  { file: "gallery", at: [0, 0, 0] },
  { file: "beam", at: [0, 2.1, 0], yaw: -1.2, clip: "dip" },
];

// library-lighthouse is the place; -lens is the shot's hero (the lens the cut lands on) close to, -rigs the lantern with
// the clips the place's frame doesn't run.
