// The cathedral's components on the stand (parts/library.tsx): four bays of the nave assembled from its shell parts,
// looking down the centre aisle at the rose window.
//   raea render library/cathedral.tsx --composition library-cathedral --at 0,30 -o out/library/cathedral/
import { Place, type Part, type V3 } from "../parts/library";

export const F = 0.02; // the flagstones' top
export const H = Math.PI / 2;
export const BAYS = [-6.75, -2.25, 2.25, 6.75];
export const PIERS = [-9, -4.5, 0, 4.5, 9];
export const MENSA = F + 1.496;
export const SHELL: Part[] = [
  { file: "flagstones", at: [0, 0, 4] },
  { file: "rose-window", at: [0, 0, -9], clip: "light" },
  ...PIERS.flatMap((z) => [-3.2, 3.2].map((x) => ({ file: "column", at: [x, F, z] as V3 }))),
  ...BAYS.flatMap((z) => [
    { file: "arcade-bay", at: [-3.2, F, z] as V3, yaw: H },
    { file: "arcade-bay", at: [3.2, F, z] as V3, yaw: -H },
    { file: "aisle-wall", at: [-6.6, F, z] as V3, yaw: H },
    { file: "aisle-wall", at: [6.6, F, z] as V3, yaw: -H },
    { file: "aisle-roof", at: [-6.6, 8.9, z] as V3, yaw: H },
    { file: "aisle-roof", at: [6.6, 8.9, z] as V3, yaw: -H },
    { file: "vault", at: [0, 14.3, z] as V3 },
  ]),
  { file: "aisle-wall", at: [-7.25, F, -9], yaw: Math.PI },
  { file: "aisle-wall", at: [7.25, F, -9], yaw: Math.PI },
];
export const PEWS: Part[] = [1.6, 2.55, 3.5, 4.45, 5.4, 6.35, 7.3, 8.25].flatMap((z) => [-1.5, 1.5].map((x) => ({ file: "pew", at: [x, F, z] as V3, yaw: Math.PI, clip: "kneeler" })));
export const CATHEDRAL: Part[] = [
  ...SHELL,
  { file: "light-shaft", at: [0, 8.6, -9], clip: "swing" },
  { file: "dust", at: [0, F, -5], clip: "drift" },
  { file: "altar", at: [0, F, -6.5] },
  { file: "altar-cross", at: [0, MENSA, -7.0] },
  { file: "altar-candlestick", at: [-0.85, MENSA, -6.95], scale: 0.6, clip: "flicker" },
  { file: "altar-candlestick", at: [0.85, MENSA, -6.95], scale: 0.6, clip: "flicker" },
  { file: "altar-candlestick", at: [-1.55, F + 0.48, -6.0], clip: "flicker" },
  { file: "altar-candlestick", at: [1.55, F + 0.48, -6.0], clip: "flicker" },
  { file: "lectern", at: [1.95, F + 0.16, -5.3], yaw: 0.35, clip: "page" },
  { file: "votive-stand", at: [-2.15, F, -4.1], yaw: 0.45, clip: "flicker" },
  { file: "thurible", at: [2.2, F, -3.6], yaw: -0.3, clip: "swing" },
  { file: "aisle-runner", at: [0, F, 2.15] },
  ...PEWS,
  { file: "chandelier", at: [0, 13.7, 2.25], clip: "sway" },
  { file: "chandelier", at: [0, 13.7, 6.75], clip: "turn" },
  { file: "font", at: [-1.9, F, 10.4], clip: "cover" },
  { file: "door", at: [-4.7, F, -7.9], clip: "open" },
  { file: "statue", at: [4.7, F, -7.3], yaw: -0.3 },
];

