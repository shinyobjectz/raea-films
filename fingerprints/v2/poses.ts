// The hand's poses, by name. Each is the whole hand; the film mixes between them and adds small moves on top.
import { type Pose, pose } from "./rig";

const curl = (mcp: number, pip: number, dip: number, spread = 0) => (f: string) => ({ [`${f}Mcp`]: mcp, [`${f}Pip`]: pip, [`${f}Dip`]: dip, [`${f}Spread`]: spread });
const each = (fn: (f: string) => Record<string, number>, fs = ["index", "middle", "ring", "little"]) => Object.assign({}, ...fs.map(fn));

/** the stick a tripod grip holds, carried by the hand bone (rest space): `tip` is its working end (tools/fitgrip.ts) */
export const STICK = { tip: [-0.0055, -0.8608, 0.4633] as [number, number, number], back: [0.8385, 0.6816, 0.1296] as [number, number, number], radius: 0.0375 };

export const POSES: Record<string, Pose> = {
  rest: pose({}),
  // lying on the desk, at ease
  relaxed: pose({ ...each(curl(0.22, 0.32, 0.18)), littleMcp: 0.3, thumbFlex: 0.08, thumbMcp: 0.1, thumbIp: 0.12 }),
  // open, fingers a little apart: shown, offered, waved
  open: pose({ ...each(curl(0.04, 0.1, 0.06)), indexSpread: 0.1, ringSpread: 0.08, littleSpread: 0.16, thumbSpread: -0.25, thumbFlex: -0.1 }),
  // flat, to lie on something and cover it
  flat: pose({ ...each(curl(-0.02, 0.06, 0.03)), indexSpread: 0.05, littleSpread: 0.1, thumbFlex: -0.05, thumbSpread: -0.2 }),
  // a pencil, a brush, a baton (tools/fitgrip.ts fits it to the skin)
  tripod: pose({ indexMcp: 0.769, indexPip: 1.118, indexDip: 0.51, indexSpread: 0.251, middleMcp: 0.859, middlePip: 0.818, middleDip: 0.284, ringMcp: 1, ringPip: 1.15, ringDip: 0.5, littleMcp: 1.05, littlePip: 1.15, littleDip: 0.5, thumbFlex: 0.501, thumbSpread: -0.125, thumbTwist: 0.055, thumbMcp: 0.213, thumbIp: 0.075 }),
  // the index finger out, the rest gathered: to pick, to tap, to push
  point: pose({ indexMcp: 0.12, indexPip: 0.1, indexDip: 0.05, ...each(curl(1.2, 1.35, 0.7), ["middle", "ring", "little"]), thumbFlex: 0.5, thumbSpread: 0.1, thumbMcp: 0.45, thumbIp: 0.5 }),
  // a fist with the thumb up
  thumbsUp: pose({ ...each(curl(1.35, 1.55, 0.85)), thumbFlex: -0.5, thumbSpread: -0.12, thumbMcp: -0.12, thumbIp: -0.2 }),
  // the other hand's, laid on a sheet to hold it still
  holding: pose({ ...each(curl(0.1, 0.16, 0.1)), indexSpread: 0.08, ringSpread: 0.05, littleSpread: 0.14, thumbSpread: -0.15, thumbFlex: -0.2 }),
  // the thumb's pad flat down, the rest of the hand clear of the table (fitted: the pad within 39 degrees of flat, 13 mm clear)
  press: pose({ rx: 0.169, rz: -0.045, wristFlex: 0.05, indexMcp: 0.05, indexPip: 0.25, indexDip: 0.15, middleMcp: 0.1, middlePip: 0.3, middleDip: 0.15, ringMcp: 0.15, ringPip: 0.35, ringDip: 0.2, littleMcp: 0.2, littlePip: 0.35, littleDip: 0.2, thumbFlex: 0.183, thumbSpread: 0.581, thumbTwist: 0.45, thumbMcp: 0.159, thumbIp: -0.3 }),
};
