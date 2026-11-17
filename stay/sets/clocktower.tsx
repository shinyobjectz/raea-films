// The clock tower's components on the stand (parts/library.tsx): the clock room behind the dial.
//   raea render library/clocktower.tsx --composition library-clocktower --at 0,30 -o out/library/clocktower/
import { Place, type Part } from "../parts/library";

export const MX = 0, MZ = 0.3; // the movement's origin; its second arbor (and so the rods and the dial) is 0.08 m left of it
export const DIAL = 2.95; // the dial's centre, up the wall
export const CRATE = 0.35;
export const CLOCKTOWER: Part[] = [
  { file: "floor", at: [0, 0.012, 0.4], clip: "hatch" },
  { file: "wall", at: [MX - 0.08, 0, -3.0] },
  { file: "beams", at: [MX - 0.08, 0, -0.6] },
  { file: "clock-face", at: [MX - 0.08, DIAL, -3.0], clip: "push" },
  { file: "movement", at: [MX, 0, MZ], clip: "push" },
  { file: "leading-off", at: [MX - 0.08, 0, MZ - 0.42], clip: "push" },
  { file: "pendulum", at: [MX + 0.501, 0, MZ - 0.4], clip: "swing" },
  { file: "bell", at: [2.15, 0, -1.3], yaw: -0.5, clip: "strike" },
  { file: "ladder", at: [-2.75, 0, -1.3], yaw: 0.6 },
  { file: "crate", at: [1.75, 0, 1.2], yaw: -0.35 },
  { file: "crank", at: [1.6, CRATE, 1.2], yaw: 0.6 },
  { file: "oil-can", at: [2.0, CRATE, 1.12], yaw: 2.4 },
  { file: "wrench", at: [1.8, CRATE, 1.38], yaw: 0.4, clip: "jaw" },
  { file: "toolbox", at: [-1.1, 0, 2.3], yaw: 0.4 },
  { file: "bucket", at: [-3.2, 0, -0.6] },
  { file: "stool", at: [1.15, 0, 1.75], yaw: 0.3 },
  { file: "lantern", at: [-3.1, 0, 0.5] },
  { file: "broom", at: [3.3, 0, -2.45], yaw: 0.2 },
  { file: "caged-light", at: [1.27, 4.15, 0.3] },
  { file: "pigeon", at: [-0.45, 0, 1.9], yaw: 0.9, clip: "peck", name: "pigeon-floor" },
  { file: "pigeon", at: [-0.1, 0, 2.25], yaw: -1.2, name: "pigeon-floor-b" },
  { file: "pigeon", at: [2.05, 1.6, -1.25], yaw: -0.4, clip: "flap", name: "pigeon-bell" },
  { file: "pigeon", at: [1.15, 0.437, 1.75], yaw: 0.2, name: "pigeon-stool" },
];

