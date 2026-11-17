// The sea's components on the stand (parts/library.tsx): the still-water level at Y (above the stand's grey floor, so
// the swell's troughs clear it), the camera low over the water looking out to sea, the sun on the right.
//   raea render library/sea.tsx --composition library-sea --at 0,30 -o out/library/sea/
import { Place, type Part } from "../parts/library";

export const Y = 0.7; // the still water
export const DECK = Y + 2.66; // the pier's deck
export const PIER: [number, number] = [-9, 6]; // the pier's shore end (x, z); it runs toward -z
export const px = (dx: number) => PIER[0] + dx;
export const pz = (along: number) => PIER[1] - along;
// the swell's height at rest over a point of the water (sea.py's waves), so what floats sits on the surface it is on
export const WAVES: [number, number, number, number][] = [[1, 0.0, 0.34, 1.6], [2, 0.05, 0.13, 1.3], [3, -0.12, 0.075, 1.2], [5, 0.26, 0.04, 1.0], [7, -0.4, 0.022, 1.0], [11, 0.7, 0.012, 1.0]];
export const swell = (x: number, z: number) => WAVES.reduce((h, [n, kx, a, sharp]) => h + a * (2 * ((Math.sin((2 * Math.PI * n * -z) / 32 + kx * x + n * 1.3) + 1) / 2) ** sharp - 1) * (0.75 + 0.25 * Math.sin(x * 0.021 + n)), 0);
export const afloat = (x: number, z: number, up = 0): [number, number, number] => [x, Y + swell(x, z) + up, z];
export const HEAD: [number, number, number] = [-205, Y, -205]; // the headland
export const SEA: Part[] = [
  { file: "sky", at: [0, 0, 0] },
  { file: "sea", at: [0, Y, 0], clip: "waves" },
  { file: "sun", at: [0, Y, -300], clip: "height" },
  { file: "clouds", at: [-70, 62, -290], clip: "drift" },
  { file: "headland", at: HEAD },
  { file: "lighthouse", at: [HEAD[0] + 57.6, HEAD[1] + 28.5, HEAD[2] - 18], clip: "beam" },
  { file: "cliff", at: [-64, Y, -30], yaw: Math.PI * 0.3 },
  { file: "sea-stack", at: [40, Y, -120] },
  { file: "boat", at: afloat(14, -44), yaw: Math.PI * 0.62, clip: "rock" },
  { file: "buoy", at: afloat(4.5, -17), clip: "lean" },
  { file: "gulls", at: [2, 7.5, -10], clip: "fly" },
  { file: "rocks", at: [5.5, Y, 2.5] },
  { file: "foam", at: afloat(5.5, 2.5, 0.1), clip: "wash" },
  { file: "spray", at: afloat(3.6, 1.0), yaw: 0.5, clip: "burst" },
  { file: "kelp", at: afloat(-1.5, 7.5, 0.05), clip: "sway" },
  { file: "mooring-buoy", at: afloat(-4.5, -2), clip: "lean" },
  { file: "pier", at: [PIER[0], Y, PIER[1]] },
  { file: "pier-lamp", at: [px(-0.95), DECK, pz(7)], yaw: Math.PI / 2 },
  { file: "pier-lamp", at: [px(-0.95), DECK, pz(19)], yaw: Math.PI / 2, name: "pier-lamp-far" },
  { file: "bench", at: [px(-0.75), DECK, pz(10)], yaw: Math.PI / 2 },
  { file: "catch", at: [px(0.2), DECK, pz(4.2)], yaw: -0.5, clip: "lid" },
  { file: "life-ring", at: [px(0.95), DECK, pz(1.2)], yaw: -0.25, clip: "swing" },
  { file: "lantern", at: [px(1.28), DECK + 1.05, pz(6.1)], yaw: -Math.PI / 2, clip: "swing" },
  { file: "fender", at: [px(1.3), DECK - 0.1, pz(3.2)], yaw: -Math.PI / 2, clip: "swing" },
  { file: "fender", at: [px(1.3), DECK - 0.1, pz(8.8)], yaw: -Math.PI / 2, clip: "swing", name: "fender-b" },
];

// the whole place, and three closer looks at the same parts (the pier's deck, the reef, the horizon)
export const VIEWS: { id: string; eye: [number, number, number]; look: [number, number, number]; fov: number }[] = [
  { id: "library-sea", eye: [-1.5, 5.4, 19], look: [-12, 3.6, -40], fov: 50 },
  { id: "library-sea-pier", eye: [-3.2, DECK + 2.2, pz(-3.5)], look: [px(0.2), DECK + 0.7, pz(6)], fov: 46 },
  { id: "library-sea-reef", eye: [0.5, 3.4, 13.5], look: [4.5, 1.0, 2.5], fov: 50 },
  { id: "library-sea-far", eye: [-1.5, 5.4, 19], look: [-40, 14, -200], fov: 20 },
  { id: "library-sea-boat", eye: [3, 4.5, -8], look: [11, 2.6, -36], fov: 30 },
];
