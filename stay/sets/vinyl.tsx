// The record shop's components on the stand (parts/library.tsx): the shop assembled from its parts, less the ceiling
// (the stand's sun has to reach the floor).
//   raea render library/vinyl.tsx --composition library-vinyl --at 0,30 -o out/library/vinyl/
import { Place, type Part } from "../parts/library";

export const TOP = 0.72; // the console's top
export const BAR = 1.0; // the counter's top
export const VINYL: Part[] = [
  { file: "floor", at: [0, 0, 0] },
  { file: "wall-back", at: [0, 0, -2.5] },
  { file: "shopfront", at: [-3, 0, 0], yaw: Math.PI / 2, clip: "door" },
  { file: "console", at: [-1.35, 0, 0.5], clip: "door" },
  { file: "turntable", at: [-1.62, TOP, 0.5], clip: "needle" },
  { file: "amplifier", at: [-1.0, TOP, 0.52], clip: "level" },
  { file: "speaker", at: [-2.35, 0, 0.35], yaw: 0.25, clip: "thump" },
  { file: "speaker", at: [-0.35, 0, 0.35], yaw: -0.25, clip: "thump" },
  { file: "stool", at: [-2.3, 0, 1.25] },
  { file: "rack", at: [0.75, 0, -1.2], clip: "flip" },
  { file: "rack", at: [2.0, 0, -1.2], clip: "divider" },
  { file: "crate", at: [0.2, 0, -0.45], yaw: 0.3 },
  { file: "crate", at: [2.3, 0, -0.5], yaw: -0.2 },
  { file: "counter", at: [1.7, 0, 1.3], clip: "hatch" },
  { file: "cash-register", at: [1.8, BAR, 1.3], yaw: Math.PI / 2, clip: "drawer" },
  { file: "record", at: [1.05, BAR, 1.3], yaw: 0.2, clip: "slide" },
  { file: "posters", at: [-1.5, 1.65, -2.5], clip: "flutter" },
  { file: "headphones", at: [-0.3, 1.5, -2.5], clip: "swing" },
  { file: "wall-display", at: [1.4, 1.25, -2.5] },
  { file: "pendant", at: [-1.35, 3.0, 0.3], scale: 0.8, clip: "swing" },
  { file: "pendant", at: [1.4, 3.0, -1.0], scale: 0.8, clip: "swing" },
];

