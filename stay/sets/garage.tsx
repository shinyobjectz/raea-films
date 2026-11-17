// The parking garage's components on the stand (parts/library.tsx): one deck of the multi-storey, assembled from its
// parts. Positions are written as the deck's plan (x across, y back from the aisle, z up, as the components were
// built in Blender) and turned into raea's frame by `at`.
//   raea render library/garage.tsx --composition library-garage --at 0,30 -o out/library/garage/
import { Place, type Part, type V3 } from "../parts/library";

export const LIFT = 0.02; // the deck sits just over the stand's own floor
export const at = (x: number, y: number, z = 0): V3 => [x, z + LIFT, -y];
export const H = 2.75; // floor to soffit
export const WALL = 6.75; // the back wall's face
export const PILLARS = [-7.5, -2.5, 2.5, 7.5];
export const PILLAR_Y = 2.2;
export const QUARTER = Math.PI / 2;

export const GARAGE: Part[] = [
  // the shell (the ceiling's left module only: the right half of the deck is left open so the bays can be seen)
  { file: "floor", at: at(0, 0) },
  { file: "back-wall", at: at(0, WALL + 0.25) },
  { file: "ceiling", at: at(-5, 3.0, H) },
  ...PILLARS.map((x, i): Part => ({ file: "pillar", at: at(x, PILLAR_Y), name: `pillar-${i}` })),
  { file: "bay-numbers", at: at(PILLARS[0], PILLAR_Y - 0.255, 2.02) },
  { file: "markings", at: at(0, WALL) },
  { file: "ramp", at: at(11.0, -6.0) },
  // the car, parked in bay 67 (the turntable spin), and again rolling in down the aisle with its wheels turned
  { file: "car", at: at(6.25, 4.1), clip: "spin", name: "car-in-bay" },
  { file: "car", at: at(6.3, -4.3), yaw: -0.6, clip: "steer", name: "car-in-aisle" },
  { file: "parked-car", at: at(3.75, 4.3), yaw: Math.PI },
  ...[0, 1, 2, 3, 4, 5, 6].map((k): Part => ({ file: "wheel-stop", at: at(-8.75 + 2.5 * k, 6.15), name: `wheel-stop-${k}` })),
  // the entry: booth, barrier, ticket machine, the headroom bar over the lane
  { file: "ticket-booth", at: at(-2.3, -3.7), yaw: -QUARTER, clip: "door" },
  { file: "barrier-arm", at: at(-6.7, -2.6), clip: "lift" },
  { file: "ticket-machine", at: at(-6.7, -4.9), yaw: QUARTER, clip: "ticket" },
  { file: "bollard", at: at(-6.7, -5.6), name: "bollard-a" },
  { file: "bollard", at: at(-6.7, -4.2), name: "bollard-b" },
  { file: "height-bar", at: at(-5.6, -0.7, H), clip: "swing" },
  { file: "trash-can", at: at(-0.9, -5.5), yaw: 0.4 },
  // the ceiling's services
  ...[-7.5, -2.5].map((x, i): Part => ({ file: "sodium-light", at: at(x, 0.2, H), name: `sodium-light-aisle-${i}` })),
  ...[-7.5, -2.5].map((x, i): Part => ({ file: "sodium-light", at: at(x, 4.6, H), name: `sodium-light-bay-${i}` })),
  { file: "pipes", at: at(-5, 1.2, H) },
  { file: "signs", at: at(-2.5, -0.5, H) },
  { file: "security-camera", at: at(-2.245, PILLAR_Y, 2.0), yaw: QUARTER },
  { file: "convex-mirror", at: at(7.245, PILLAR_Y, 1.9), yaw: -QUARTER, clip: "swivel" },
  // on the pillars and the wall
  { file: "fire-extinguisher", at: at(2.5, PILLAR_Y - 0.255) },
  { file: "stair-door", at: at(8.75, WALL), clip: "open" },
  { file: "utility-box", at: at(-7.5, WALL - 0.43) },
  { file: "crash-barrier", at: at(-9.85, 1.0), yaw: QUARTER },
  // loose on the deck
  { file: "trolley", at: at(10.6, -6.7), yaw: 0.25, clip: "roll" },
  { file: "puddles", at: at(7.6, -0.9), clip: "spread" },
  { file: "cone", at: at(9.1, -1.9), clip: "tip", name: "cone-a" },
  { file: "cone", at: at(8.8, -6.3), name: "cone-b" },
  { file: "cone", at: at(3.4, -6.3), name: "cone-c" },
  { file: "old-tyre", at: at(-9.2, 5.9) },
  { file: "trashbag", at: at(-9.3, 5.0), yaw: 0.6 },
];

