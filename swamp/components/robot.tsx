// The robot: a pointer arrow built as a machine. A gunmetal frame, beige armour plates bolted over it with seams and
// vent slots, a machined steel nose (its tip is the pointer's hot spot and the origin), a camera lens in a steel
// housing, a bell nozzle at the tail and two trim thrusters under the wings.
import { interpolate } from "raea";
import { Entity, crossSection, manifold } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { type V3, clamp } from "./timeline";

const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const quat = (x: number, y: number, z: number) => Quat.fromEuler("XYZ", x, y, z);

const H = 0.36; // tip to tail
const PTS = [[0, 0], [0, -1], [0.235, -0.775], [0.39, -1.13], [0.535, -1.065], [0.38, -0.715], [0.7, -0.715]].map(([x, y]) => [x * H, y * H] as [number, number]);
const ARROW = crossSection.polygon(PTS).offset(-0.005, { join: "round" }).offset(0.01, { join: "round" });
const T_FRAME = 0.06, T_PLATE = 0.012;
const ZP = T_FRAME / 2; // where the plates sit

// the frame: the arrow, full thickness, with a channel milled round its rim
const FRAME = ARROW.extrude(T_FRAME).move(0, 0, -T_FRAME / 2).minus(ARROW.minus(ARROW.offset(-0.006)).extrude(0.014).move(0, 0, -0.007));

// the armour: the arrow inset, cut by seams into a nose plate, a main plate, a hatch and a tail plate; slots through the hatch
const rect = (w: number, h: number, x: number, y: number, deg = 0) => crossSection.rect(w, h).rotate(deg).move(x, y);
const SEAMS = [rect(0.4, 0.005, 0.1, -0.125), rect(0.005, 0.2, 0.062, -0.35), rect(0.066, 0.005, 0.031, -0.25), rect(0.1, 0.005, 0.1107, -0.268, 22.5)];
const SLOTS = [-0.272, -0.285, -0.298].map((y) => rect(0.03, 0.0055, 0.03, y));
const NOSE2D = ARROW.intersect(crossSection.circle(0.055, 48));
const EYE: V3 = [0.108, -0.195, ZP];
const PLATE2D = ARROW.offset(-0.013, { join: "round" }).minus(NOSE2D.offset(0.005));
const STRIPE2D = rect(0.09, 0.012, 0.146, -0.348, 23.7).intersect(PLATE2D);
const FRONT = PLATE2D.minus(...SEAMS, ...SLOTS, crossSection.circle(0.046, 48).move(EYE[0], EYE[1]), STRIPE2D.offset(0.002)).extrude(T_PLATE).move(0, 0, ZP);
const BACK = PLATE2D.minus(rect(0.4, 0.005, 0.1, -0.2)).extrude(T_PLATE).move(0, 0, -ZP - T_PLATE);
const ARMOUR = manifold.union(FRONT, BACK);
const STRIPE = STRIPE2D.extrude(T_PLATE + 0.001).move(0, 0, ZP);

// steel: the nose, the lens housing, the bolts, the nozzles, the antenna
const BOLTS: [number, number][] = [[0.016, -0.106], [0.074, -0.106], [0.016, -0.232], [0.2, -0.238], [0.012, -0.262], [0.05, -0.262], [0.012, -0.322], [0.122, -0.292], [0.156, -0.378], [0.176, -0.368]];
const STEM: [number, number] = [0.4025, -0.9154]; // the tail's direction
const TAIL: [number, number] = [0.1665, -0.395];
const nozzle = (r1: number, r2: number, h: number) => manifold.cone(r1, r2, h).minus(manifold.cone(r1 * 0.7, r2 * 0.86, h).move(0, 0, 0.004)).rotate(90, 0, 0);
const TRIM: [number, number][] = [[0.034, -0.352], [0.2, -0.277]];
const STEEL = manifold.union(
  NOSE2D.extrude(T_FRAME + 2 * T_PLATE + 0.004).move(0, 0, -T_FRAME / 2 - T_PLATE - 0.002),
  manifold.cylinder(0.042, 0.03).move(EYE[0], EYE[1], ZP + 0.013).minus(manifold.cylinder(0.032, 0.03).move(EYE[0], EYE[1], ZP + 0.022)),
  ...BOLTS.map(([x, y]) => manifold.cylinder(0.0048, 0.005).move(x, y, ZP + T_PLATE)),
  nozzle(0.02, 0.031, 0.044).rotate(0, 0, 23.7).move(TAIL[0] + STEM[0] * 0.022, TAIL[1] + STEM[1] * 0.022, 0),
  manifold.cylinder(0.026, 0.012).rotate(90, 0, 0).rotate(0, 0, 23.7).move(TAIL[0] - STEM[0] * 0.004, TAIL[1] - STEM[1] * 0.004, 0),
  ...TRIM.map(([x, y]) => nozzle(0.01, 0.016, 0.026).move(x, y - 0.002, 0)),
  manifold.cylinder(0.0028, 0.085).rotate(90, 0, 0).rotate(0, 0, -28).move(0.262, -0.214, -0.012),
);

/** the iris: its size (1 at rest, over 1 wide open, under 1 stopped down to focus) and its glow over its rest */
export type Iris = { size: number; glow: number };
export function Robot({ at, tilt, spin, f, lean, iris = { size: 1, glow: 1 } }: { at: V3; tilt: number; spin: number; f: number; lean: [number, number]; iris?: Iris }) {
  // the lens's shutter closes for two frames every few seconds; the thrusters flicker
  const blink = [70, 228, 410, 640, 870, 1090, 1290, 1445, 1540].reduce((b, t) => Math.max(b, interpolate(f, [t, t + 2, t + 5], [0, 1, 0], clamp)), 0);
  const thrust = 0.7 + 0.3 * Math.sin(f * 1.3);
  const beacon = f % 30 < 4 ? 1 : 0.08;
  return (
    <Entity transform={Transform.fromXyz(...at).withRotation(quat(lean[1], spin + lean[0], tilt))}>
      <Mesh3d name="robot-frame" allowOverlap shape={FRAME}>
        <StandardMaterial base_color="#34373a" metallic={0.85} perceptual_roughness={0.42} />
      </Mesh3d>
      <Mesh3d name="robot-armour" allowOverlap shape={ARMOUR}>
        <StandardMaterial base_color="#d6c5a0" metallic={0.05} perceptual_roughness={0.52} />
      </Mesh3d>
      <Mesh3d name="robot-stripe" allowOverlap shape={STRIPE}>
        <StandardMaterial base_color="#c2602b" perceptual_roughness={0.55} />
      </Mesh3d>
      <Mesh3d name="robot-steel" allowOverlap shape={STEEL}>
        <StandardMaterial base_color="#a4a7a8" metallic={1} perceptual_roughness={0.32} />
      </Mesh3d>
      {/* the lens: dark glass in the housing, a small lit iris behind it */}
      <Mesh3d name="robot-lens" allowOverlap transform={Transform.fromXyz(EYE[0], EYE[1], ZP + 0.014).withScale([1, 1, 0.4])}>
        <Sphere radius={0.031} />
        {/* coated glass: dark, and a mirror for whatever it faces (the screen, when it looks at it) */}
        <StandardMaterial base_color="#0a0d10" perceptual_roughness={0.02} metallic={0.55} reflectance={0.9} />
      </Mesh3d>
      <Mesh3d name="robot-iris" allowOverlap transform={Transform.fromXyz(EYE[0], EYE[1], ZP + 0.0255).withScale([iris.size, iris.size * (1 - 0.92 * blink), 0.3])}>
        <Sphere radius={0.011} />
        <StandardMaterial base_color="#dff4ff" emissive={glow("#bfe6ff", 90 * iris.glow)} />
      </Mesh3d>
      {/* a status light by the lens, a beacon on the antenna */}
      <Mesh3d name="robot-status" allowOverlap transform={Transform.fromXyz(0.176, -0.222, ZP + T_PLATE)}>
        <Sphere radius={0.0045} />
        <StandardMaterial base_color="#ffd9a0" emissive={glow("#ffb050", 30)} />
      </Mesh3d>
      <Mesh3d name="robot-beacon" allowOverlap transform={Transform.fromXyz(0.283, -0.175, -0.012)}>
        <Sphere radius={0.006} />
        <StandardMaterial base_color="#ff8a70" emissive={glow("#ff5a40", 60 * beacon)} />
      </Mesh3d>
      {/* what burns in the nozzles */}
      <Mesh3d name="robot-burn" allowOverlap transform={Transform.fromXyz(TAIL[0] + STEM[0] * 0.036, TAIL[1] + STEM[1] * 0.036, 0).withScale([1, 0.5, 1])}>
        <Sphere radius={0.02} />
        <StandardMaterial base_color="#cfeaff" emissive={glow("#9fd8ff", 40 + 50 * thrust)} />
      </Mesh3d>
      {TRIM.map(([x, y], i) => (
        <Mesh3d key={i} name={`robot-trim-${i}`} allowOverlap transform={Transform.fromXyz(x, y - 0.011, 0).withScale([1, 0.5, 1])}>
          <Sphere radius={0.011} />
          <StandardMaterial base_color="#cfeaff" emissive={glow("#9fd8ff", 25 + 30 * thrust)} />
        </Mesh3d>
      ))}
    </Entity>
  );
}
