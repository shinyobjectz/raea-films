// The kelp forest's components on the stand (parts/library.tsx): the seabed under 12 m of water, looking up through
// the kelp at the sun in the surface. Frame 0 is the forest lying over in the current, frame 30 standing.
//   raea render library/kelp.tsx --composition library-kelp --at 0,30 -o out/library/kelp/
import { Place, type Part, type V3 } from "../parts/library";

export const TOP = 12; // the surface
/** the sand's height at (x, z): blender/components/kelp/seabed.py's height(), z turned to Blender's y */
export const sand = (x: number, z: number) => {
  const y = -z;
  const m = 0.26 * (Math.sin(x * 0.31 + 1.3) * Math.cos(y * 0.27 - 0.4) + 0.6 * Math.sin(x * 0.63 - y * 0.5 + 2.0)) + 0.26;
  return Math.max(0.03, m * 0.75 + 0.1);
};
export const on = (x: number, z: number, up = 0): V3 => [x, sand(x, z) + up, z];
export const SUN: V3 = [0, TOP, -3.5];
export const KELP: Part[] = [
  { file: "water", at: [0, 0, 0] },
  { file: "seabed", at: [0, 0, 0] },
  { file: "surface", at: [0, TOP, 2], clip: "swell" },
  { file: "sun", at: SUN, clip: "shimmer" },
  { file: "light-shafts", at: SUN, clip: "sway" },
  { file: "canopy", at: [-4.5, TOP, -6.5], clip: "drift" },
  { file: "canopy", at: [5.2, TOP, -1.5], yaw: 0.6, clip: "drift" },
  { file: "reef", at: on(-2.6, 0.2, -0.25) },
  { file: "boulders", at: on(3.9, 2.2, -0.2), yaw: 0.8 },
  { file: "boulders", at: on(-7.5, -6, -0.2), yaw: 2.4 },
  { file: "kelp-a", at: on(-3.4, 1.6, 0.3), clip: "stand" },
  { file: "kelp-b", at: on(2.9, 0.6, 0.2), yaw: 0.25, clip: "stand" },
  { file: "kelp-a", at: on(5.6, -3.4), yaw: -0.3, clip: "stand" },
  { file: "kelp-c", at: on(-1.0, 4.2), yaw: 0.2, clip: "stand" },
  { file: "kelp-b", at: on(-6.6, -2.8), yaw: -0.2, clip: "stand" },
  { file: "kelp-a", at: on(-1.4, -6.0), yaw: 0.35, clip: "stand" },
  { file: "kelp-c", at: on(3.6, 4.6), yaw: -0.4, clip: "stand" },
  { file: "kelp-b", at: on(8.2, 1.0), yaw: 0.15, clip: "stand" },
  { file: "kelp-a", at: on(-9.0, 2.0), yaw: 0.1, clip: "stand" },
  { file: "urchins", at: on(0.9, 5.4), clip: "bristle" },
  { file: "sea-stars", at: on(-0.5, 5.9, 0.005) },
  { file: "anemones", at: on(1.9, 4.6), clip: "sway" },
  { file: "sea-fan", at: on(-1.9, 4.9), yaw: 0.3, clip: "sway" },
  { file: "shells", at: on(0.3, 6.4, 0.01) },
  { file: "bubbles", at: on(1.4, 3.6), clip: "rise" },
  { file: "garibaldi", at: [-0.9, 1.5, 5.2], clip: "tail" },
  { file: "sheephead", at: [2.3, 2.3, 2.6], yaw: 0.3, clip: "swim" },
  { file: "kelp-bass", at: [-2.6, 3.4, 1.2], yaw: Math.PI - 0.3, clip: "tail" },
  { file: "school", at: [-1.2, 4.2, 1.6], yaw: 0.2, clip: "swim" },
  { file: "particles", at: [0, 0, 2.5], clip: "drift" },
];

