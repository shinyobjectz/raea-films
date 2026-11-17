// The pool hall's components on the stand (parts/library.tsx): the hall assembled from its parts with its near end, its
// left wall and three of its four ceiling bays left off so the stand's sun gets in. The deck stands 3.4 m over the
// stand's floor (the basin is 3 m deep under it).
//   raea render library/pool.tsx --composition library-pool --at 0,30 -o out/library/pool/
// library-pool-far and library-pool-side are closer looks (the far end; the right wall) and run each two-clip part's
// other clip, so every rig is seen; -left, -wall, -door, -board, -board-b, -bench, -blocks and -ladder are closer still:
//   --composition library-pool-far --at 0,15,30 -o out/library/pool/far/ (or side/, left/, wall/, door/).
import { Composition, registerRoot } from "raea";
import { Place, type Part, type V3 } from "../parts/library";

export const D = 3.4; // the deck
export const Q = Math.PI / 2;
export const WIN_Z = [-11.25, -6.75, -2.25, 2.25, 6.75, 11.25];
/** `alt` runs the other clip of the parts that have two */
export const hall = (alt: boolean): Part[] => [
  // the shell
  { file: "pool", at: [0, D, 0] },
  { file: "water", at: [0, D, 0], clip: alt ? "level" : "ripple" },
  { file: "wall-end", at: [0, D, -15] },
  { file: "wall-side", at: [8, D, 0], yaw: -Q },
  ...WIN_Z.map((z, i): Part => ({ file: "windows", at: [8, D + 3.6, z], yaw: -Q, clip: "vent", name: `windows-${i}` })),
  { file: "ceiling", at: [0, D + 6.5, -11.25] },
  ...[-3, 0, 3].flatMap((x) => [-2.9, 0, 2.9].map((dz): Part => ({ file: "tubes", at: [x, D + 6.5, -11.25 + dz], yaw: Q, name: `tubes-${x}-${dz}` }))),
  // the far wall
  { file: "door", at: [5, D, -15], clip: "open" },
  { file: "exit-sign", at: [5, D + 2.48, -15], clip: "misspell" },
  { file: "pace-clock", at: [-1.0, D + 3.3, -15], clip: "sweep" },
  { file: "rescue-pole", at: [-1.2, D + 1.9, -15] },
  { file: "rules-sign", at: [2.7, D + 1.55, -15] },
  { file: "lifebuoy", at: [-5.6, D + 1.5, -15], clip: "swing" },
  { file: "hose", at: [7.05, D + 0.95, -15] },
  // the far end's deck
  { file: "diving-board", at: [0, D, -11.2], clip: alt ? "fulcrum" : "bounce" },
  { file: "kickboards", at: [-4.6, D, -13.9] },
  { file: "plant", at: [7.3, D, -14.3], clip: "sway" },
  { file: "plant", at: [-7.2, D, -14.2], yaw: 2, clip: "sway", name: "plant-left" },
  { file: "shower", at: [7.7, D, -12.3], yaw: -Q },
  // the right wall's deck
  { file: "bench", at: [7.76, D, -4.2], yaw: -Q },
  { file: "towel", at: [7.76, D + 0.45, -4.55], yaw: -Q },
  { file: "flip-flops", at: [7.3, D, -3.6], yaw: -Q },
  { file: "bench", at: [7.76, D, 0.6], yaw: -Q, name: "bench-2" },
  { file: "lifebuoy", at: [8, D + 1.5, -8.6], yaw: -Q, clip: "swing", name: "lifebuoy-side" },
  { file: "wet-floor-sign", at: [5.6, D, -7.6], yaw: 0.5 },
  { file: "ladder", at: [4, D, -6.2], yaw: -Q, clip: "lift" },
  // the left deck
  { file: "ladder", at: [-4, D, 5.5], yaw: Q, name: "ladder-left" },
  { file: "lifeguard-chair", at: [-5.4, D, -2.2], yaw: Q, clip: "swivel" },
  { file: "deck-chair", at: [-6.4, D, 2.6], yaw: Q + 0.3 },
  { file: "deck-chair", at: [-6.5, D, 3.6], yaw: Q - 0.2, name: "deck-chair-2" },
  // in and over the water
  ...[-2, 0, 2].map((x): Part => ({ file: "lane-rope", at: [x, D, 0], clip: alt ? "spin" : "bob", name: `lane-rope-${x}` })),
  { file: "flags", at: [0, D, -5], clip: "flutter" },
  { file: "flags", at: [0, D, 5], clip: "flutter", name: "flags-near" },
  { file: "beach-ball", at: [-2.9, D - 0.15, 4.2], clip: alt ? "bob" : "roll" },
  { file: "drain", at: [-0.5, D - 3.0, -8.5] },
  { file: "drain", at: [0.5, D - 3.0, -8.5], name: "drain-2" },
  // the near end
  ...[-3, -1, 1, 3].map((x): Part => ({ file: "starting-block", at: [x, D, 10.45], yaw: Math.PI, name: `starting-block-${x}` })),
];
export const view = (id: string, alt: boolean, eye: V3, look: V3, fov: number) => (
  <Composition id={id} component={() => <Place place="pool" parts={hall(alt)} wall={false} eye={eye} look={look} fov={fov} />} width={1350} height={1080} fps={30} durationInFrames={31} />
);

