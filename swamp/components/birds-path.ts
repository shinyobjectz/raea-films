// v4, 15-leaves: the ravens the leaves scare out of the trees. This file is the flight only (no raea imports, so a
// script can project it through the shot's camera): where each bird is, which way it faces and where its wings are,
// frame by frame. birds.tsx draws them.
//
// Each bird bursts out of a canopy as the leaves break round it: it springs up and out of the crown, beating hard,
// gathers speed, and swings onto its flock's heading, climbing away. v5: they go up over the canopy (the crowns top
// out at 11-13.5 m: island_tree_01's leaves reach 5.0 m and _02's 3.4 m, at the trees' scales), seen against the sky
// between the crowns, with only the pair crossing below it. Three flocks and a pair:
//  - high: ten up out of the top of the big tree on the right (6.4, -3.6), 12-16 m off and 9-13 m up, out from
//    behind its crown and off to the left across the open sky at the top left of the frame;
//  - left: seven up out of the crowns on the left, 20-26 m off, climbing away into the same sky;
//  - far: ten specks lifting off the far wood behind the monitor (38-50 m), over its treeline as the leaf wave reaches it;
//  - close: two from the tree just right of the lens (9.2, 2.6), crossing large in front of it, under the canopy.
// The leaves break out in a wave that rolls away from the monitor (world.tsx), so the nearer trees spook first.
type V3 = [number, number, number];

const rnd = (i: number, k = 0) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const norm2 = (x: number, z: number): [number, number] => {
  const n = Math.hypot(x, z) || 1;
  return [x / n, z / n];
};
const turn2 = (d: [number, number], a: number): [number, number] => [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a)];

export type Bird = {
  /** where it bursts from, inside the canopy */
  at: V3;
  /** the frame it goes */
  born: number;
  /** its first heading (x, z), out from the trunk; its flock's heading, which it swings onto */
  out: [number, number];
  away: [number, number];
  /** its climb, radians, and how far off it it starts: up for a bird that springs off a branch, down for one that
   *  drops out of the crown to gather speed; its top speed, m a frame; how fast it gets there and swings round, frames */
  climb: number;
  jump: number;
  /** how long the spring or the drop lasts, frames */
  jt: number;
  top: number;
  tau: number;
  swing: number;
  /** wingbeats a second once it's away, and where in the beat it starts */
  rate: number;
  ph: number;
};

// 15-leaves' camera at its first frame (take.ts): the flocks are aimed through it, so each crosses open sky
const CAM = { p: [4.4, 0.5, 6.4] as V3, l: [-1, 4.4, -4] as V3, fov: 54, aspect: 16 / 9 };
const n3 = (a: V3): V3 => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / n, a[1] / n, a[2] / n];
};
const FW = n3([CAM.l[0] - CAM.p[0], CAM.l[1] - CAM.p[1], CAM.l[2] - CAM.p[2]]);
const RIGHT = n3([-FW[2], 0, FW[0]]);
const UP: V3 = [RIGHT[1] * FW[2] - RIGHT[2] * FW[1], RIGHT[2] * FW[0] - RIGHT[0] * FW[2], RIGHT[0] * FW[1] - RIGHT[1] * FW[0]];
const TY = Math.tan((CAM.fov * Math.PI) / 360), TX = TY * CAM.aspect;
/** the point at (x, y) on the screen (-1..1, y up), d metres along the view */
export const onScreen = (x: number, y: number, d: number): V3 => [0, 1, 2].map((i) => CAM.p[i] + FW[i] * d + RIGHT[i] * x * TX * d + UP[i] * y * TY * d) as V3;
/** a flat heading: "left" parts left across the frame, "away" parts away from the lens */
const heading = (left: number, away: number) => norm2(-RIGHT[0] * left + FW[0] * away, -RIGHT[2] * left + FW[2] * away);

type Box = { x: [number, number]; y: [number, number]; d: [number, number] };
const flock = (n: number, seed: number, box: Box, trunk: [number, number] | null, born: [number, number], away: [number, number], fan: number, climb: [number, number], jump: number, jt: number, top: [number, number]): Bird[] =>
  Array.from({ length: n }, (_, i) => {
    const r = (k: number) => rnd(i + 1, seed + k);
    const at = onScreen(box.x[0] + (box.x[1] - box.x[0]) * r(1), box.y[0] + (box.y[1] - box.y[0]) * r(2), box.d[0] + (box.d[1] - box.d[0]) * r(3));
    const a = turn2(away, (r(4) - 0.5) * fan);
    // out from the trunk, leaning toward where the flock goes
    const o = trunk ? norm2(at[0] - trunk[0], at[2] - trunk[1]) : a;
    return {
      at,
      born: born[0] + (i / Math.max(1, n - 1)) * (born[1] - born[0]) * (0.6 + 0.4 * r(5)) + r(6) * 2,
      out: norm2(o[0] + a[0] * 0.8, o[1] + a[1] * 0.8),
      away: a,
      climb: climb[0] + (climb[1] - climb[0]) * r(7),
      jump: jump * (0.8 + 0.4 * r(13)),
      jt,
      top: top[0] + (top[1] - top[0]) * r(8),
      tau: 9 + 5 * r(9),
      swing: 10 + 7 * r(10),
      rate: 3.3 + 0.7 * r(11),
      ph: r(12) * 11,
    };
  });

export const BIRDS: Bird[] = [
  // high: springing up out of the top of the big tree's crown and away over it to the left, climbing, crossing the
  // open sky at the top left, the gap in the crowns there (v4 had them dropping out of its underside and under the canopy, over the monitor)
  ...flock(10, 10, { x: [-0.2, 0.12], y: [0.56, 0.84], d: [12, 16] }, [6.4, -3.6], [898, 908], heading(1, 0.12), 0.3, [0.12, 0.26], 0.45, 8, [0.3, 0.36]),
  // left: up out of the crowns on the left beyond the monitor, over them, and away to the left, climbing
  ...flock(7, 20, { x: [-0.85, -0.45], y: [0.72, 0.92], d: [20, 26] }, null, [902, 912], heading(0.6, 0.75), 0.5, [0.2, 0.35], 0.5, 8, [0.26, 0.32]),
  // far: specks lifting off the far treeline in the bright gap right of the monitor as the leaf wave reaches it,
  // away to the right
  ...flock(10, 30, { x: [0.15, 0.4], y: [-0.22, -0.12], d: [28, 38] }, null, [902, 911], heading(-0.4, 0.9), 0.6, [0.3, 0.5], 0.4, 6, [0.24, 0.32]),
  // close: a pair out of the tree just right of the lens, already flying, crossing large through the frame
  { at: onScreen(1.6, 0.18, 5.5), born: 899, out: heading(1, 0.15), away: heading(1, 0.25), climb: 0.04, jump: 0.3, jt: 6, top: 0.34, tau: 6, swing: 10, rate: 3.6, ph: 2 },
  { at: onScreen(1.7, 0.36, 6.6), born: 902, out: heading(1, 0.2), away: heading(1, 0.3), climb: 0.1, jump: 0.3, jt: 6, top: 0.32, tau: 7, swing: 12, rate: 3.4, ph: 7 },
];

/** wingbeats a second at the jump, falling to its own rate as it gets away */
const RATE0 = 5.2;
/** the clip's poses (one morph target each) and its frame rate */
export const POSES = 11;

export type BirdPose = { pos: V3; yaw: number; pitch: number; roll: number; wing: number };

/** where a bird is at frame f (null before it goes): integrated a step a frame, with the last part of a frame */
export function birdAt(b: Bird, f: number): BirdPose | null {
  const t = f - b.born;
  if (t < 0) return null;
  let p: V3 = [b.at[0], b.at[1], b.at[2]];
  let wing = b.ph, yaw = 0, pitch = 0, prevYaw: number | null = null, roll = 0;
  const steps = Math.ceil(t);
  for (let k = 0; k < steps; k++) {
    const dt = Math.min(1, t - k);
    const tk = k + dt / 2;
    const s = 0.04 + (b.top - 0.04) * (1 - Math.exp(-tk / b.tau));
    const m = 1 - Math.exp(-tk / b.swing);
    const h = norm2(b.out[0] * (1 - m) + b.away[0] * m, b.out[1] * (1 - m) + b.away[1] * m);
    // the spring off the branch (or the drop out of the crown), then its climb
    const c = b.climb + b.jump * Math.exp(-tk / b.jt);
    p = [p[0] + h[0] * Math.cos(c) * s * dt, p[1] + Math.sin(c) * s * dt, p[2] + h[1] * Math.cos(c) * s * dt];
    const rate = b.rate + (RATE0 - b.rate) * Math.exp(-tk / 14);
    wing += (rate * POSES * dt) / 30;
    yaw = Math.atan2(h[0], h[1]);
    pitch = c;
    if (prevYaw !== null) {
      let dy = yaw - prevYaw;
      if (dy > Math.PI) dy -= 2 * Math.PI;
      if (dy < -Math.PI) dy += 2 * Math.PI;
      // banked into the turn, as far as about 35°
      roll = Math.max(-0.6, Math.min(0.6, (dy / Math.max(dt, 1e-3)) * 6));
    }
    prevYaw = yaw;
  }
  // the body lifts a little on each downstroke (poses 1-4 are the wings going down)
  const beat = Math.sin(((wing % POSES) / POSES) * 2 * Math.PI);
  p = [p[0], p[1] + 0.025 * beat, p[2]];
  return { pos: p, yaw, pitch, roll, wing };
}

/** the morph weights for a point in the wingbeat: two neighbouring poses blended */
export function wingWeights(wing: number): number[] {
  const w = ((wing % POSES) + POSES) % POSES;
  const i = Math.floor(w), j = (i + 1) % POSES, u = w - i;
  return Array.from({ length: POSES }, (_, k) => (k === i ? 1 - u : k === j ? u : 0));
}
