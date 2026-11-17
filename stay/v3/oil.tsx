// The painting (the shot "cellar", 6.1 s), the seventh and last door's world. the director, 11-11: "what if we did something
// in a painted style as if oil painting. dont use the default paint style try to do somethign unique and beautiful that
// is endearing and makes your jaw drop".
// The cathedral's door opens into an oil painting, and we walk into it: a summer evening on a hill, every part of it
// laid in thick strokes of paint that catch the light (v3/oil-glsl.ts, v3/oil-land.ts). The one thing in it not yet
// painted is the door at the top of the meadow: bare canvas, its lines drawn in charcoal. The cursor paints it, and
// then opens it on the canyon.
import { AbsoluteFill } from "raea";
import { AntiAliasing, Canvas3D, ToneMapping } from "raea/3d";
import { SolariLighting } from "raea/light";
import { Camera3d } from "raea/camera";
import { BufferMesh, Cuboid, Mesh3d, Sphere } from "raea/mesh";
import { StandardMaterial, ThreeShaderMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { clamp01, ramp, type V3 } from "../v2/math";
import { Hand3D, front, type Key } from "./hand3d";
import { Doorway, Portal, goOut, shotOf, viewOf, type View } from "./kit";
import { FilmLook, Finish, type Look } from "./look";
import { DOOR_GLSL, FRAME, FRONT, KNOB, KNOB_REST, LEAF, LEAF_REST, OPENING, PARTS, SKETCH_GLSL, brushAt, doorUniforms, knobAt, leafAt, sweepPath } from "./oil-door";
import { CLOUDS, DZ, LAND, LAND_GLSL, RE, RE2, SKY_GLSL, SUN, TREE } from "./oil-land";
import { CARDS, CARDS_GLSL, SWING } from "./oil-cards";
import type { Shot } from "./plan";
import { TAKE_KEYS } from "./takekeys";
import { DOOR_HOLD, ROOM_T } from "./times";

const NEXT = "canyon";
const jerk = (k: number) => { const q = clamp01(k); return q * q * q * (10 - 15 * q + 6 * q * q); };
type Times = { pull: [number, number]; door: number };
/** the leaf, open toward us: 0 shut, 1 at 100 degrees (quickly: it is done while the lens is still a metre and more out) */
const openAt = (T: Times, t: number) => jerk(ramp(t, T.door + 0.03, T.door + 0.8));
const ANGLE = (100 * Math.PI) / 180;

function oilKeys(s: Shot, t: number) {
  const T = ROOM_T.cellar as Times;
  const L = s.seconds;
  const open = openAt(T, t);
  // (the brush's two keys are the same moving point, the sweep's at this second: so the drag between them is the
  // sweep itself, one unbroken gesture, not a move eased from key to key)
  const brush = () => brushAt(t, T.pull[0], T.pull[1]);
  const keys: Key[] = [
    { t: T.pull[0], p: front(brush, 0.03), press: true, seen: "sweep the brush over the unpainted door, top to bottom", margin: 0.1 },
    { t: T.pull[1], p: front(brush, 0.03) },
    { t: T.door, p: front(() => knobAt(0), 0.03), press: true, seen: "take the new-painted knob and pull the door open" },
    { t: T.door + DOOR_HOLD, p: front(() => knobAt(open * ANGLE), 0.03) },
    ...goOut(L),
  ];
  return { T, L, open, keys };
}
TAKE_KEYS.cellar = (t: number) => oilKeys(shotOf("cellar"), t).keys;
export const oilView = (s: Shot, t: number): View => viewOf(s, t);

export function OilWorld({ s, t, v }: { s: Shot; t: number; v: View }) {
  const { T, open } = oilKeys(s, t);
  const { hand, cam: c } = v;
  const a = open * ANGLE, leaf = leafAt(a);
  // the door's shadow on the meadow comes in as the paint does
  const painted = clamp01((t - T.pull[0] - 0.2) / (T.pull[1] - T.pull[0] + 0.4));
  const du = (kind: number, half: V3, rest: V3) => doorUniforms({ kind, half, rest }, t, T.pull[0], T.pull[1], open);
  const abs = s.from + t;
  const center: V3 = [0, OPENING.top / 2, DZ - 0.03];
  // (the doorway's plane is behind the closed leaf's back face, DZ - 0.07: at DZ - 0.03 the leaf stood 0.6 cm in front of it,
  // under the 2 cm the doorway keeps, so on the first frames of the pull the next world was drawn over the leaf and it
  // blinked out; the director, 11-11, on assembly 23: "glitch")
  const plane: V3 = [0, OPENING.top / 2, DZ - 0.075];
  const half: [number, number] = [OPENING.half, OPENING.top / 2];
  const look: Look = { base: 0, warm: 0, sat: 1.0, contrast: 0.5, halation: 0.25, vignette: 0.3 };
  const light = {
    uSun: [...SUN, 0], uDoor: [FRAME.half, FRAME.top, DZ, painted], uCrown: TREE.crown, uTrunk: TREE.trunk,
  };
  return (
    <AbsoluteFill style={{ background: "#8fb3d9" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.look)} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, near: 0.03, far: 3200 } }}>{/* (ray traced, as every world is: the director, 11-12, "solari is kind of the ideal") */}<SolariLighting bounces={2} /></Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="none" />
        <Mesh3d name="oil-sky">
          <Sphere radius={2900} />
          <ThreeShaderMaterial glsl={SKY_GLSL} side="double" uniforms={{ uCloud: CLOUDS, uDrift: [t * 0.0015, -0.91, 0.41, 0] }} />
        </Mesh3d>
        <Mesh3d name="oil-land">
          <BufferMesh {...LAND} />
          <ThreeShaderMaterial glsl={LAND_GLSL} uniforms={{ ...light, uRE: [...RE, 0], uRE2: RE2 }} />
        </Mesh3d>
        {PARTS.map((p) => (
          <Mesh3d key={p.name} name={`oil-${p.name}`} transform={Transform.fromXyz(...p.at)}>
            <Cuboid half_size={p.half} />
            <ThreeShaderMaterial glsl={DOOR_GLSL} uniforms={du(p.kind, p.half, p.at)} />
          </Mesh3d>
        ))}
        <Mesh3d name="oil-leaf" transform={Transform.fromXyz(...leaf.at).withRotation(Quat.fromRotationY(leaf.rot[1]))}>
          <Cuboid half_size={LEAF.half} />
          <ThreeShaderMaterial glsl={DOOR_GLSL} uniforms={du(3, LEAF.half, LEAF_REST)} />
        </Mesh3d>
        {/* (the leaf's place in the depth the doorway reads: the painted leaf is drawn by a three shader, which has none) */}
        <Mesh3d name="oil-leaf-depth" transform={Transform.fromXyz(...leaf.at).withRotation(Quat.fromRotationY(leaf.rot[1]))}>
          <Cuboid half_size={[LEAF.half[0] - 0.004, LEAF.half[1] - 0.004, LEAF.half[2] - 0.004]} />
          <StandardMaterial base_color="#5a1010" unlit />
        </Mesh3d>
        <Mesh3d name="oil-knob" transform={Transform.fromXyz(...knobAt(a))}>
          <Sphere radius={KNOB.r} />
          <ThreeShaderMaterial glsl={DOOR_GLSL} uniforms={du(4, [KNOB.r, KNOB.r, KNOB.r], KNOB_REST)} />
        </Mesh3d>
        <Mesh3d name="oil-strokes">
          <BufferMesh {...CARDS.mesh} />
          <ThreeShaderMaterial glsl={CARDS_GLSL} transparent depthWrite={false} side="double"
            uniforms={{ uWind: [abs, 1, 0.86, 0.51], uSwing: [...SWING.pivot, 0.13 * Math.sin(2 * Math.PI * 0.32 * abs + 0.5)], uAxis: [...SWING.axis, 0] }} />
        </Mesh3d>
        <Mesh3d name="oil-sketch" transform={Transform.fromXyz(0, 1.25, FRONT + 0.012)}>
          <Cuboid half_size={[1.3, 1.65, 0.0005]} />
          <ThreeShaderMaterial glsl={SKETCH_GLSL} transparent depthWrite={false} uniforms={{ uPaint: [t, 1.25, 0.24, 0], uPath: sweepPath(T.pull[0], T.pull[1]) }} />
        </Mesh3d>
        <Portal next={NEXT} abs={abs} center={center} half={half} cam={c} />
        <Hand3D hand={hand} cam={c} ev={0} />
        <FilmLook look={look} seed={s.f0} cam={c} lines={false} finish={false} />
        <Doorway next={NEXT} abs={abs} cam={c} center={plane} half={half} open={open > 0.001 ? 1 : 0} />
        {!v.portal && <Finish look={look} seed={s.f0} />}
      </Canvas3D>
    </AbsoluteFill>
  );
}
