// The mothership's plan, shared by its solid (solids/mothership.ts), its Blender step (blender/mothership.py reads
// the numbers it needs as arguments) and its lights (components/mothership.tsx).
//
// It is the robot's arrow at 530 m tip to tail: the same outline, and its parts where the robot has them (the robot's
// own numbers, from components/robot.tsx, times K). Plans are in top view: x across, y toward the tip (negative toward
// the tail), h up, metres. The ship lies flat with its decks up and the lens under it, so from below it is the robot
// seen from the front, and it is mirrored to read that way: top view (x, y, h) is the ship's space (-x, h, -y), the tip
// at the origin pointing to -z.
export type V3 = [number, number, number];
export type P2 = [number, number];

export const SHIP_H = 530;
export const K = SHIP_H / 0.36;
export const PTS: P2[] = [[0, 0], [0, -1], [0.235, -0.775], [0.39, -1.13], [0.535, -1.065], [0.38, -0.715], [0.7, -0.715]].map(([x, y]) => [x * SHIP_H, y * SHIP_H]);
/** a top-view point and a height, in the ship's space */
export const shipPoint = (x: number, y: number, h: number): V3 => [-x, h, -y];

/** the decks: each an inset of the outline (m) between two heights */
export const CORE = { z: [-14, 14] as P2, chamfer: 5 };
export const DECKS = [
  { name: "deck1", inset: 24, z: [19, 30] as P2 },
  { name: "deck2", inset: 52, z: [30, 38] as P2 },
  { name: "spine", inset: 80, z: [38, 45] as P2 },
];
export const KEELS = [
  { name: "keel1", inset: 20, z: [-28, -19] as P2 },
  { name: "keel2", inset: 44, z: [-35, -28] as P2 },
];
/** the trench round the core's sides, where the windows are */
export const TRENCH = { depth: 3, z: [-4, 4] as P2 };

/** the lens: the robot's, under the hull; the beam enters through it */
export const EYE: P2 = [0.108 * K, -0.195 * K];
export const LENS_R = 0.042 * K;
/** the glass in it, the robot's inner radius */
export const GLASS_R = 0.032 * K;
/** the housing: a steel pod from the core's underside down, the glass set in its face */
export const LENS_POD: P2 = [-49, -19];
export const GLASS_H = -45;

/** the engines: the robot's tail nozzle as three, across the end of the stem, pointing out along it */
export const STEM: P2 = [0.4025, -0.9154];
export const STEM_DEG = (Math.atan2(STEM[0], -STEM[1]) * 180) / Math.PI;
const END_A: P2 = PTS[3], END_B: P2 = PTS[4];
const END_MID: P2 = [(END_A[0] + END_B[0]) / 2, (END_A[1] + END_B[1]) / 2];
const ACROSS: P2 = [-STEM[1], STEM[0]];
export const ENGINE = { throat: 7, exit: 12, length: 30, h: -1 };
export const ENGINES: P2[] = [-26, 0, 26].map((s) => [END_MID[0] + ACROSS[0] * s, END_MID[1] + ACROSS[1] * s]);
/** where an engine's exit is, a top-view point */
export const engineExit = ([x, y]: P2): P2 => [x + STEM[0] * ENGINE.length, y + STEM[1] * ENGINE.length];

/** the trim thrusters under the robot's wings, here bells out of the hull's back edges pointing to the tail */
export const TRIMS: { x: number; edge: number }[] = [
  // x, and the y of the hull's edge above it
  { x: 0.034 * K, edge: -530 + ((0.034 * K) / 124.6) * 119.25 },
  { x: 0.2 * K, edge: -0.715 * SHIP_H },
];
export const TRIM = { throat: 6, exit: 10, length: 26, h: 0 };

/** the antenna: the robot's, a boom out of the wing on the deck side, its beacon at the outer end */
export const ANT_MID: P2 = [0.262 * K, -0.214 * K];
export const ANT_DIR: P2 = [Math.sin((28 * Math.PI) / 180), Math.cos((28 * Math.PI) / 180)];
export const ANT = { length: 0.085 * K, r: 0.0028 * K, h: 0.012 * K };
export const BEACON: P2 = [ANT_MID[0] + (ANT_DIR[0] * ANT.length) / 2, ANT_MID[1] + (ANT_DIR[1] * ANT.length) / 2];

/** the bridge: a stepped tower on the spine, its mast and its own beacon */
export const TOWER = { at: [96, -236] as P2, tiers: [[44, 36, 38, 66], [30, 24, 66, 84], [18, 14, 84, 96]] as [number, number, number, number][], mast: [96, 186] as P2 };
