// The forest road's components on the stand (parts/library.tsx): one 40 m section of road with its paint, puddles and
// both verges, the trees and the verge's dressing where they belong, the car coming down its lane through the first
// puddle with the spray at its wheel, and the windscreen (the shot's first frame is from behind it) set by itself on
// the near shoulder.
//   raea render library/road.tsx --composition library-road --at 0,30 -o out/library/road/
//   and two closer looks at the rigs: --composition library-road-car -o out/library/road/car/, --composition library-road-seat -o out/library/road/seat/
import { Place, type Part } from "../parts/library";

export const Y = 0.75; // the road's crown over the stand's grey floor, so the verges' ditches (0.6 m down) are above it
export const LANE = -1.6; // the car's lane (parts/road.tsx)
export const ROAD: Part[] = [
  { file: "road", at: [0, Y, -10], clip: "wet" },
  { file: "markings", at: [0, Y, -10] },
  { file: "puddles", at: [0, Y, -10], clip: "open" },
  { file: "verge", at: [0, Y, -10], name: "verge-r" },
  { file: "verge", at: [0, Y, -10], yaw: Math.PI, name: "verge-l" },
  { file: "trees", at: [-9.2, Y + 0.5, -8], clip: "sway" },
  { file: "trees", at: [8.6, Y + 0.4, -17], yaw: 2.1, scale: 0.9, clip: "sway", name: "trees-2" },
  { file: "trees", at: [-11.5, Y + 0.8, -22], yaw: 4.0, scale: 1.08, name: "trees-3" },
  { file: "trees-b", at: [-7.6, Y + 0.3, -15], clip: "sway" },
  { file: "trees-b", at: [9.6, Y + 0.6, -5], yaw: 1.3, scale: 1.1, name: "trees-b-2" },
  { file: "trees-b", at: [7.9, Y + 0.3, -26], yaw: 3.3, scale: 0.85, name: "trees-b-3" },
  { file: "sapling", at: [6.9, Y + 0.05, -1.5], clip: "sway" },
  { file: "sapling", at: [-7.0, Y + 0.05, -4.5], yaw: 2, scale: 0.7, name: "sapling-2" },
  { file: "ferns", at: [5.6, Y - 0.2, 1.2], clip: "sway" },
  { file: "ferns", at: [-6.6, Y - 0.1, -1.0], yaw: 1.9, name: "ferns-2" },
  { file: "ferns", at: [7.6, Y + 0.15, -7.5], yaw: 4.1, scale: 1.2, name: "ferns-3" },
  { file: "stump", at: [7.4, Y + 0.1, 1.8], yaw: 0.7 },
  { file: "rocks", at: [-9.0, Y + 0.3, 0.5], yaw: 0.4 },
  { file: "log", at: [7.6, Y + 0.15, -3.6], yaw: 1.25 },
  { file: "branches", at: [3.3, Y - 0.07, 1.6], yaw: 0.5, clip: "skid" },
  { file: "road-sign", at: [4.9, Y - 0.2, -2.6], yaw: -0.12, clip: "shake" },
  { file: "barrier", at: [4.6, Y - 0.17, -9.5], yaw: -Math.PI / 2 },
  { file: "reflector-post", at: [4.15, Y - 0.12, 3.6], clip: "flex" },
  { file: "reflector-post", at: [-4.15, Y - 0.12, 3.6], yaw: Math.PI, name: "reflector-post-2" },
  { file: "reflector-post", at: [-4.15, Y - 0.12, -16.4], yaw: Math.PI, name: "reflector-post-3" },
  { file: "treeline", at: [-17, Y + 1.2, -10], yaw: -Math.PI / 2, clip: "sway" },
  { file: "treeline", at: [17, Y + 1.2, -10], yaw: Math.PI / 2, name: "treeline-2" },
  { file: "treeline", at: [0, Y + 0.5, -36], yaw: Math.PI, name: "treeline-3" },
  // the car comes down its lane and its front wheels reach the first puddle (at x -1.4, z -2) as the clip ends
  { file: "car", at: [LANE, Y - 0.035, -9.36], clip: "drive" },
  { file: "spray", at: [LANE + 0.755, Y - 0.045, -2.0], clip: "burst" },
  { file: "spray", at: [LANE - 0.755, Y - 0.06, -2.0], clip: "burst", name: "spray-2" },
  // the windscreen is the view out from the driver's seat (library-road-seat): here it heads away down the other lane
  { file: "windscreen", at: [1.8, Y - 0.035, -14], yaw: Math.PI, clip: "wipers" },
  { file: "rain", at: [0.5, Y, 1], clip: "fall" },
];

// the car close to, for its rig: its wipers swept, a second car with its wheels steered, the spray at a wheel
export const CAR: Part[] = [
  { file: "road", at: [0, 0.08, 0], clip: "wet" },
  { file: "markings", at: [0, 0.08, 0] },
  { file: "puddles", at: [0, 0.08, 0], clip: "open" },
  { file: "car", at: [LANE, 0.045, 8.2], yaw: 0.0, clip: "wipers" },
  { file: "car", at: [1.9, 0.045, 3.2], yaw: Math.PI - 0.5, clip: "steer", name: "car-steer" },
  { file: "spray", at: [LANE + 0.755, 0.04, 9.62], clip: "burst" },
  { file: "reflector-post", at: [-3.4, 0.02, 11.0], yaw: Math.PI, clip: "flex" },
];
// from the driver's seat: the windscreen's rain and the wipers' sweep over the road
export const SEAT: Part[] = [
  { file: "road", at: [0, Y, -10] },
  { file: "markings", at: [0, Y, -10] },
  { file: "verge", at: [0, Y, -10], name: "verge-r" },
  { file: "verge", at: [0, Y, -10], yaw: Math.PI, name: "verge-l" },
  { file: "trees", at: [-9.2, Y + 0.5, -8] },
  { file: "trees-b", at: [9.6, Y + 0.6, -5], yaw: 1.3 },
  { file: "trees", at: [8.6, Y + 0.4, -17], yaw: 2.1, name: "trees-2" },
  { file: "trees-b", at: [-7.6, Y + 0.3, -15], name: "trees-b-2" },
  { file: "treeline", at: [0, Y + 0.5, -36], yaw: Math.PI },
  { file: "road-sign", at: [-4.9, Y - 0.2, -12], yaw: Math.PI },
  { file: "windscreen", at: [1.6, Y - 0.035, 6], yaw: Math.PI, clip: "wipers" },
];

