// Fingerprint, in thermal (thermal.script.ts): the film seen through a thermal camera. This file is the look test of
// the opening beat: the hand comes down onto a sheet of glass, presses its thumb, lifts, and the print it left glows
// and fades. Everything is drawn in temperature (thermal/hot.tsx) and read by the sensor's pass (thermal/sensor.tsx).
// Render: raea render thermal.tsx --at 0,40,70,95,130 -o out/thermal-look/
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { Glass, HotHand, Print, TPAD } from "./thermal/hot";
import { Sensor } from "./thermal/sensor";
import { POSES } from "./v2/poses";
import { type Pose, type V3, lowest, reach } from "./v2/rig";

const FPS = 30;
const SECONDS = 6;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };
const ramp = (t: number, a: number, b: number) => ease((t - a) / (b - a));

// the beat's moments (seconds)
const DOWN = 1.5; // the thumb meets the glass
const UP = 2.7; // it lifts
const SHUTTER = 0.6; // the sensor's shutter clicks: the picture holds two frames

const PRINT: [number, number] = [0, 0];
const press = POSES.press;
const drop = lowest({ ...press, px: 0, py: 0, pz: 0 });
const over = (q: [number, number], lift: number): Pose => {
  const p = reach(press, "thumb3", TPAD, [q[0], 0, q[1]]);
  return { ...p, py: 0.003 + lift - drop };
};

function handAt(t: number): Pose {
  const lift = 1.6 * (1 - ramp(t, 0, DOWN)) + 2.6 * ramp(t, UP, UP + 1.0);
  const p = over(PRINT, lift);
  // in from behind and the left, out the same way
  const inK = 1 - ramp(t, 0, DOWN - 0.1);
  const outK = ramp(t, UP + 0.15, UP + 1.3);
  return { ...p, px: p.px - 0.9 * inK - 1.4 * outK, pz: p.pz - 1.6 * inK - 3.2 * outK, rz: p.rz + 0.15 * inK };
}

function Film() {
  const frame = useCurrentFrame();
  // the shutter: two frames held on the one before
  const s0 = Math.round(SHUTTER * FPS);
  const f = frame === s0 + 1 || frame === s0 + 2 ? s0 : frame;
  const t = f / FPS;
  const drift = t / SECONDS;
  const eye: V3 = [1.25 - 0.3 * drift, 1.85 - 0.15 * drift, 1.55 - 0.1 * drift];
  const at: V3 = [-0.05, 0.12, -0.2];
  const pose = handAt(t);
  const padCool = 0.16 * (t > UP ? Math.exp(-(t - UP) / 2.5) : 0);
  return (
    <AbsoluteFill style={{ background: "#0d0d0d" }}>
      <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (30 * Math.PI) / 180, near: 0.05, far: 200 } }}>
      </Camera3d>
      <Sensor frame={frame} across={400} />
      <ToneMapping mode="none" />
      <Glass mirror={0.07} />
      <Print x={PRINT[0]} z={PRINT[1]} age={t - UP} turn={0.3} />
      <HotHand pose={pose} eye={eye} padCool={padCool} />
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="thermal" width={1920} height={1080} fps={FPS} durationInFrames={SECONDS * FPS} component={Film} />);
