// The canyon's components on the stand (parts/library.tsx): the slot assembled from its parts and seen from its mouth,
// as the shot sees it. Outdoors, so no wall: the sky's half dome is the backdrop and fills the shade.
//   raea render library/canyon.tsx --composition library-canyon --at 0,30 -o out/library/canyon/
import { Place, type Part } from "../parts/library";

export const S = 0.08; // the sand's level under most things
// The stand's sun is fixed (parts/library.tsx: from behind the camera's left shoulder), so the whole canyon is turned
// 28 degrees to let it shine down the slot from the mouth; `turn` moves a part's place and its yaw together.
export const TURN = (-28 * Math.PI) / 180;
export const spot = ([x, y, z]: [number, number, number]): [number, number, number] => [x * Math.cos(TURN) + z * Math.sin(TURN), y, -x * Math.sin(TURN) + z * Math.cos(TURN)];
export const turn = (parts: Part[]): Part[] => parts.map((p) => ({ ...p, at: spot(p.at), yaw: (p.yaw ?? 0) + TURN }));
export const CANYON: Part[] = turn([
  // the shell: all three stand at the same point
  { file: "walls", at: [0, 0, 0] },
  { file: "rim", at: [0, 0, 0] },
  { file: "sand", at: [0, 0, 0] },
  { file: "sky", at: [0, 0, 0] },
  // the sun, small and far so both ends of its arc show in the slot's strip of sky
  { file: "sun", at: [5.04, 20, -32], yaw: 1.85, clip: "height", scale: 0.3 },
  // the floor, from the mouth inward
  { file: "tumbleweed", at: [0.1, S, 3.4], clip: "hop", name: "tumbleweed-hop" },
  { file: "tumbleweed", at: [1.35, S + 0.02, -1.6], yaw: 0.4, clip: "roll", name: "tumbleweed-roll" },
  { file: "shrub", at: [1.75, 0.16, 0.3], yaw: 0.5, clip: "sway" },
  { file: "grass", at: [1.15, 0.16, 4.3], clip: "sway" },
  { file: "cairn", at: [1.7, 0.14, 2.1], yaw: 0.3 },
  { file: "pebbles", at: [0.7, S, 1.2], yaw: 0.3 },
  { file: "boulder-b", at: [0.15, S - 0.04, -0.7], yaw: Math.PI / 2 },
  { file: "grass", at: [-0.2, 0.2, 1.6], yaw: 2.1, clip: "sway", scale: 0.8, name: "grass-2" },
  { file: "dust", at: [1.0, 0, -2.5], clip: "drift" },
  { file: "boulder", at: [2.0, S - 0.05, -4.6], yaw: 0.2 },
  { file: "driftwood", at: [1.05, S - 0.02, -3.6], yaw: -1.15 },
  { file: "grass", at: [-0.3, 0.2, -3.2], yaw: 4.0, clip: "sway", scale: 0.9, name: "grass-3" },
  { file: "pebbles", at: [1.2, S, -7.0], yaw: 1.9, name: "pebbles-2" },
  { file: "shrub", at: [2.05, 0.2, -8.3], yaw: 2.6, clip: "sway", name: "shrub-2" },
  { file: "slab", at: [3.05, S - 0.03, -2.3], yaw: -Math.PI / 2 },
  // wedged overhead
  { file: "chockstone", at: [0.39, 3.5, -7.25] },
  { file: "log-jam", at: [0.27, 4.1, -15], yaw: 0.1 },
  // the rim
  { file: "sand-streams", at: [-0.42, 12.9, -2.5], clip: "fall" },
  { file: "snag", at: [3.0, 12.75, -14.5], yaw: 0.8, clip: "sway" },
  { file: "snag", at: [0.7, 12.75, -29.3], yaw: 2.5, clip: "sway", name: "snag-2" },
]);

