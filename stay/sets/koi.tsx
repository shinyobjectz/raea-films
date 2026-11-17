// The koi pond's components on the stand (parts/library.tsx): the garden assembled from its parts. The pond goes
// below its ground, so the whole garden is lifted LIFT above the stand's floor and sits on it as a block.
//   raea render library/koi.tsx --composition library-koi --at 0,30 -o out/library/koi/
import { Place, type Part } from "../parts/library";

export const LIFT = 0.8;
export const W = -0.07; // the water's level
export const up = (p: Part): Part => ({ ...p, at: [p.at[0], p.at[1] + LIFT, p.at[2]] });
export const KOI: Part[] = [
  { file: "ground", at: [0, 0, 0] },
  { file: "pond", at: [0, 0, 0] },
  { file: "ripples", at: [-0.7, W, 0.45], clip: "spread" },
  { file: "pebble", at: [-0.7, W, 0.45], clip: "drop" },
  { file: "koi", at: [0.25, -0.3, 0.0], yaw: 0.9, clip: "turn" },
  { file: "koi-b", at: [1.1, -0.28, -0.45], yaw: -2.0, clip: "swim" },
  { file: "koi-c", at: [-0.5, -0.36, -0.75], yaw: 2.4, clip: "turn" },
  { file: "lily-pads", at: [1.2, W, 0.55], clip: "bob" },
  { file: "stone-lantern", at: [-2.7, 0, -2.2], yaw: 0.5, clip: "lean" },
  { file: "maple", at: [3.0, 0, -2.5], yaw: 2.4, clip: "fall" },
  { file: "bridge", at: [2.05, 0, 0.1], yaw: Math.PI / 2 - 0.25 },
  { file: "deer-scarer", at: [-3.1, 0, 0.9], yaw: 0.9, clip: "tip" },
  { file: "bucket", at: [-2.5, 0, 1.9], yaw: 0.4, clip: "handle" },
  { file: "stepping-stones", at: [0.1, 0, 3.4] },
  { file: "mossy-rocks", at: [-0.4, 0, -2.7], yaw: 0.2 },
  { file: "mossy-rocks-b", at: [3.5, 0, 1.9], yaw: -0.6 },
  { file: "ferns", at: [-1.9, 0, -2.6], clip: "sway" },
  { file: "ferns", at: [3.7, 0, 0.5], yaw: 1.8, clip: "sway" },
  { file: "moss", at: [-1.7, 0, 2.4] },
  { file: "moss", at: [1.6, 0, -2.4], yaw: 1.0 },
  { file: "moss", at: [2.2, 0, 2.6], yaw: 2.0, scale: 0.8 },
  { file: "bamboo-fence", at: [-3.6, 0, -4.2] },
  { file: "bamboo-fence", at: [-1.2, 0, -4.2] },
  { file: "bamboo-fence", at: [1.2, 0, -4.2] },
  { file: "bamboo-fence", at: [3.6, 0, -4.2] },
].map(up);

