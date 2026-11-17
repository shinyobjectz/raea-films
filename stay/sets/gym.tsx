// The gym's components on the stand (parts/library.tsx): half the court under the baseline wall, its three goals at
// three heights (the place's wrong detail), the bleachers folded on the side wall, the roof's joists and caged lights.
// The court's origin (under the middle rim) is the stand's.
//   raea render library/gym.tsx --composition library-gym --at 0,30 -o out/library/gym/
// library-gym-ball is the montage's circle on its own: the ball from the free-throw line, bounced to the upper third;
// library-gym-close is a closer look at the ball rack, the rope and two of the goals.
import { Place, type Part } from "../parts/library";

export const WALL = -1.6; // the baseline wall's face (the rim's centre is 1.6 m off it)
export const SIDE = 9; // the side wall's face
export const ROOF = 8;
export const HUNG = ROOF - 0.9; // under a joist's bottom chord
export const Q = Math.PI / 2;
export const GYM: Part[] = [
  { file: "court", at: [0, 0.004, 0] },
  { file: "wall", at: [-4.5, 0, WALL], name: "wall-left" },
  { file: "wall", at: [4.5, 0, WALL], name: "wall-right" },
  { file: "wall", at: [SIDE, 0, WALL + 4.5], yaw: -Q, name: "wall-side" },
  { file: "hoop", at: [0, 3.05, WALL], clip: "net" },
  { file: "hoop", at: [-5.4, 2.3, WALL], clip: "rim" },
  { file: "hoop", at: [5.4, 3.9, WALL], clip: "kick" },
  { file: "wall-pads", at: [0, 0, WALL] },
  { file: "doors", at: [-7.9, 0, WALL], clip: "open" },
  { file: "scoreboard", at: [-2.9, 5.45, WALL] },
  { file: "caged-clock", at: [2.6, 5.4, WALL], clip: "hands" },
  { file: "bleachers", at: [SIDE, 0, 3.6], yaw: -Q, clip: "open" },
  { file: "banners", at: [SIDE, 5.6, 3.6], yaw: -Q, clip: "sway" },
  { file: "mats", at: [7.4, 0, WALL + 0.8], clip: "slide" },
  { file: "ball-rack", at: [-4.2, 0, 2.6], yaw: 0.5, clip: "take" },
  { file: "basketball", at: [0.9, 0, 3.4], clip: "bounce" },
  { file: "basketball", at: [-1.6, 0, 1.2], yaw: 1.0, clip: "squash" },
  { file: "basketball", at: [3.4, 0, 5.6], yaw: 2.2, clip: "spin" },
  { file: "bench", at: [-7.0, 0, 3.0], yaw: Q + 0.08 },
  { file: "bench", at: [4.6, 0, WALL + 0.9], yaw: 0.03, clip: "tip" },
  { file: "truss", at: [0, ROOF, 1.2] },
  { file: "truss", at: [0, ROOF, 6.4] },
  { file: "caged-light", at: [-5, HUNG, 1.2], clip: "sway" },
  { file: "caged-light", at: [0, HUNG, 1.2] },
  { file: "caged-light", at: [5, HUNG, 1.2] },
  { file: "caged-light", at: [-5, HUNG, 6.4] },
  { file: "caged-light", at: [0, HUNG, 6.4] },
  { file: "caged-light", at: [5, HUNG, 6.4] },
  { file: "rope", at: [-3.1, HUNG, 1.2], clip: "swing" },
];

