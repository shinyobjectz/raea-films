// The subway platform's components on the stand (parts/library.tsx): the station assembled from its shell parts,
// the train waiting 6 m inside the tunnel ("arrive" runs it 20 m in, alongside the platform).
//   raea render library/subway.tsx --composition library-subway --at 0,30 -o out/library/subway/
import { Place, type Part } from "../parts/library";

export const Q = Math.PI / 2;
export const DECK = 1.2, ROOF = 4.5; // the platform's top and the ceiling's underside above the track bed
export const MOUTH = -18; // the tunnel's headwall
export const SUBWAY: Part[] = [
  { file: "track", at: [0, 0, -8] },
  { file: "track", at: [0, 0, -28], name: "track-tunnel" },
  { file: "platform", at: [0, 0, -8] },
  { file: "ceiling", at: [0, ROOF, -8] },
  { file: "tunnel", at: [0, 0, MOUTH] },
  { file: "wall", at: [5.65, DECK, -3], yaw: -Q },
  { file: "wall", at: [5.65, DECK, -13], yaw: -Q, name: "wall-b" },
  { file: "track-wall", at: [-2.35, 0, -3], yaw: Q },
  { file: "track-wall", at: [-2.35, 0, -13], yaw: Q, name: "track-wall-b" },
  ...[-0.5, -5.5, -10.5, -15.5].map((z, i): Part => ({ file: "column", at: [2.3, DECK, z], name: `column-${i}` })),
  { file: "train", at: [0, 0, MOUTH - 6], clip: "arrive" },
  { file: "signal", at: [-1.95, 0, MOUTH + 1.2], clip: "trip" },
  ...[1, -3, -8, -13].map((z, i): Part => ({ file: "lamp", at: [3.9, ROOF, z], clip: "sway", name: `lamp-${i}` })),
  ...[2, -3, -8, -13].map((z, i): Part => ({ file: "strip-light", at: [0.5, ROOF, z], name: `strip-light-${i}` })),
  { file: "clock", at: [4.2, ROOF, -4.2], clip: "hands" },
  { file: "sign", at: [3.3, ROOF, -2.2], clip: "swing" },
  { file: "bench", at: [5.0, DECK, -4.4], yaw: -Q },
  { file: "bench", at: [5.0, DECK, -12.2], yaw: -Q, name: "bench-b" },
  { file: "trash-can", at: [4.9, DECK, -7.6], yaw: -Q },
  { file: "utility-box", at: [5.25, DECK, -9.6], yaw: -Q },
  { file: "fire-extinguisher", at: [5.25, DECK, -1.9], yaw: -Q },
  { file: "litter", at: [3.4, DECK, -1.4], clip: "blow" },
  { file: "litter", at: [3.0, DECK, -9.0], yaw: 2.0, name: "litter-b" },
];

