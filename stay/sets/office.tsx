// The office's components on the stand (parts/library.tsx).
//   raea render library/office.tsx --composition library-office --at 0,30 -o out/library/office/
import { Place, type Part } from "../parts/library";

export const TOP = 0.788; // the desk's top
export const OFFICE: Part[] = [
  { file: "desk", at: [0, 0, 0], clip: "drawer" },
  { file: "chair", at: [0.15, 0, 0.95], yaw: Math.PI * 0.85, clip: "swivel" },
  { file: "monitor", at: [0, TOP, -0.43], clip: "swing" },
  { file: "keyboard", at: [0, TOP, 0.18] },
  { file: "mouse", at: [0.34, TOP, 0.2] },
  { file: "mug", at: [-0.5, TOP, 0.05], clip: "rock" },
  { file: "phone", at: [0.72, TOP, -0.1], clip: "lift" },
  { file: "desk-lamp", at: [-0.82, TOP, -0.3], yaw: 0.6 },
  { file: "stationery", at: [0.45, TOP, -0.3] },
  { file: "clipboard", at: [-0.62, TOP, 0.28], yaw: 0.3 },
  { file: "stapler", at: [0.62, TOP, 0.3], yaw: -0.4 },
  { file: "cables", at: [0, 0, -0.5] },
  { file: "bin", at: [1.3, 0, 0.25] },
  { file: "partition", at: [0, 0, -0.85] },
  { file: "filing-cabinet", at: [1.7, 0, -0.5], clip: "drawer" },
  { file: "printer", at: [-2.3, 0, -1.9], clip: "paper feed" },
  { file: "water-cooler", at: [2.7, 0, -2.0], clip: "glug" },
  { file: "plant", at: [-1.5, 0, -0.5], clip: "sway" },
  { file: "plant-b", at: [2.5, 0, -0.3], clip: "sway" },
  { file: "wet-floor-sign", at: [2.0, 0, 0.9], yaw: 0.5 },
  { file: "shelf-unit", at: [3.6, 0, -2.1], clip: "drawer" },
  { file: "laptop", at: [-2.9, 0, 0.2], yaw: 0.6 },
  { file: "notepads", at: [-2.9, 0, 1.2] },
  { file: "whiteboard", at: [0.2, 1.55, -2.39] },
  { file: "wall-clock", at: [1.75, 2.2, -2.39], clip: "hands" },
  { file: "fire-alarm", at: [-1.2, 1.4, -2.39] },
  { file: "blinds", at: [-2.4, 2.45, -2.39], clip: "slats" },
  { file: "tubes", at: [0.3, 2.7, 0.2] },
  { file: "ceiling-fan", at: [-1.9, 2.7, 0.5], clip: "spin" },
  { file: "exit-sign", at: [2.3, 2.7, -1.2] },
];

