// The wind ridge's components on the stand (parts/library.tsx): the valley floor is the stand's floor, the ridge's
// level crest 30 m above it; three turbines stand along it 100 m apart, the nearest (the shot's rotor) at the origin.
//   raea render library/turbines.tsx --composition library-turbines --at 0,30 -o out/library/turbines/
import { Place, type Part } from "../parts/library";

export const CREST = 30;
export const ROW = [0, -100, -200]; // the turbines' x along the ridge
export const TURBINES: Part[] = [
  { file: "sky", at: [0, 0, 0] },
  { file: "ridge", at: [0, 0, 0] },
  { file: "fog", at: [0, 0, 0], clip: "drift" },
  ...ROW.flatMap((x, i): Part[] => [
    { file: "turbine", at: [x, CREST, -3], clip: "spin", name: `turbine-${i + 1}` },
    { file: "access-road", at: [x, CREST, -3], name: `access-road-${i + 1}` },
    { file: "transformer", at: [x - 8.5, CREST, 0.5], yaw: 0.25, clip: "doors", name: `transformer-${i + 1}` },
  ]),
  { file: "cabin", at: [44, CREST, -6.5], clip: "door" },
  { file: "met-mast", at: [-52, CREST, -4.5], clip: "cups" },
  { file: "power-pole", at: [40, CREST, -9] },
  { file: "power-pole", at: [-50, CREST, -9], name: "power-pole-2" },
  { file: "power-pole", at: [-140, CREST, -9], name: "power-pole-3" },
  { file: "fence", at: [-18, CREST, 11.5], clip: "gate" },
  { file: "fence", at: [4, CREST, 11.5], clip: "gate", name: "fence-2" },
  { file: "fence", at: [-18.4, CREST, 11.5], yaw: Math.PI, name: "fence-3" },
  { file: "warning-sign", at: [5.2, CREST, 10.2], yaw: -0.2 },
  { file: "windsock", at: [27, CREST, 1], clip: "swing" },
  { file: "cable-drum", at: [20, CREST, -5], yaw: 0.3, clip: "roll" },
  { file: "generator", at: [14.5, CREST + 0.07, -3], yaw: -0.5 },
  { file: "barrier", at: [29.8, CREST, 1.5], yaw: Math.PI / 2 },
  { file: "barrier", at: [29.8, CREST, -0.1], yaw: Math.PI / 2, name: "barrier-2" },
  { file: "barrier", at: [29.8, CREST, -1.7], yaw: Math.PI / 2, name: "barrier-3" },
  { file: "boulders", at: [-14, CREST, 9.5], yaw: 0.4 },
  { file: "boulders", at: [37, CREST, 9.8], yaw: 2.6, name: "boulders-2" },
  { file: "boulders", at: [-86, CREST, 9.6], yaw: 1.2, name: "boulders-3" },
  { file: "shrub", at: [10, CREST - 0.4, 15.5], clip: "sway" },
  { file: "shrub", at: [-27, CREST - 0.4, 15], yaw: 1.4, scale: 0.8, clip: "sway", name: "shrub-2" },
  { file: "shrub", at: [-70, CREST - 0.5, 16], yaw: 2.4, scale: 1.1, clip: "sway", name: "shrub-3" },
];
export const ONE: Part[] = [{ file: "turbine", at: [0, 0, 0], clip: "spin" }];
// the rigs the place's frame doesn't run: the blades' pitch, the nacelle's yaw, the windsock filling, the mast's vane
export const RIGS: Part[] = [
  { file: "turbine", at: [50, 0, 0], clip: "pitch", name: "turbine-pitch" },
  { file: "turbine", at: [-50, 0, 0], clip: "yaw", name: "turbine-yaw" },
  { file: "windsock", at: [0, 0, 150], scale: 4, clip: "fill" },
  { file: "met-mast", at: [0, 0, 60], clip: "vane" },
];

// library-turbines is the place; -near is the first turbine's foot and its dressing, -hub the shot's rotor close to,
// -rigs the clips the place's frame doesn't run.
