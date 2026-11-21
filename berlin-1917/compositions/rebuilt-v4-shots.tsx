// Berlin, Winter 1917, long cut (v4; compositions/berlin-rebuilt-v4.tsx, narration out/rebuilt/v4/prose-v2.md). The new
// recreations its chapters cut to, one composition each (a render settles its 3D look on its first frame):
//   rb-stair     chapter 2's end, "over the horses": in the stable at the stair's foot, looking up the iron spiral
//   rb-stable    the stable under the porter's flat: the stands, the mangers, the drain (porter-day's stable camera)
//   rb-arrive    stepping off the spiral into the cooking room, the doorway to the Stube ahead
//   rb-kochraum  chapter 5: the cooking room from plate z2_1917_MP_0077's place, the broken range and its iron stove
//   rb-sewer     chapter 4: a slow push down Hobrecht's brick egg (the Normal-Eiprofil, 2.0 m), lantern-lit, no thud
// The porter set is interiors/sets/porter.ts, built from the plates' captions and traced wall by wall (SYSTEM.md, "A
// set from a survey plate"); the sewer is components/underground/sewer.tsx, from Hobrecht's 1884 Blatt 7 and 9.
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { VolumetricFog } from "raea/3d";
import { Camera3d, Canvas3D } from "raea/camera";
import { AmbientLight } from "raea/light";
import { Bloom, ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { SEWER, SewerLantern, SewerSet } from "../components/underground/sewer";
import { SetView } from "../interiors/draw/set";
import { PORTER_DAY } from "../interiors/sets/porter";

const FPS = 24;
type V3 = [number, number, number];
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** a push from one of porter-day's cameras: the eye moves `push` m toward what it looks at and drifts `side` m */
function Porter({ cam, k, push, side = 0, rise = 0 }: { cam: string; k: number; push: number; side?: number; rise?: number }) {
  const base = PORTER_DAY.cams.find((c) => c.id === cam)!;
  const d = [base.at[0] - base.eye[0], base.at[1] - base.eye[1], base.at[2] - base.eye[2]];
  const len = Math.hypot(d[0], d[1], d[2]), u = d.map((x) => x / len);
  const sx = -u[2], sz = u[0]; // sideways, level
  const eye: V3 = [base.eye[0] + u[0] * push * k + sx * side * k, base.eye[1] + u[1] * push * k + rise * k, base.eye[2] + u[2] * push * k + sz * side * k];
  const at: V3 = [base.at[0] + sx * side * k * 0.6, base.at[1] + rise * k * 0.5, base.at[2] + sz * side * k * 0.6];
  return (
    <AbsoluteFill style={{ background: "#050506" }}>
      <Canvas3D>
        <SetView set={PORTER_DAY} cam={{ ...base, eye, at }} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

/** the sewer, lit by one lantern hung at the branch, pushing slowly down the barrel (no thud: no story here) */
function Sewer({ t, n }: { t: number; n: number }) {
  const z = -2 - 4.2 * ease(t / n);
  const eye: V3 = [0.05, 1.45, z], at: V3 = [0, 1.2, z - 10];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (50 * Math.PI) / 180, near: 0.03, far: 60 } }} />
        <VolumetricFog ambient={0.01} ambientColor="#2a2a30" />
        <AmbientLight brightness={3} color="#5a6070" />
        <Bloom intensity={0.15} />
        <ToneMapping mode="agx" exposure={0.4} />
        <SewerSet s={{ t, thud: -1, day: 0.6, haze: 0.6 }} dustAt={99} />
        <SewerLantern at={[0.35, 1.5, -SEWER.branchAt + 0.9]} k={0.9} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

type Shot = { id: string; seconds: number; draw: (t: number, n: number) => JSX.Element };
const SHOTS: Shot[] = [
  { id: "rb-stair", seconds: 10, draw: (t, n) => <Porter cam="stair" k={ease(t / n)} push={0.5} rise={0.25} /> },
  { id: "rb-stable", seconds: 7, draw: (t, n) => <Porter cam="stable" k={ease(t / n)} push={0.9} side={0.3} /> },
  { id: "rb-arrive", seconds: 6, draw: (t, n) => <Porter cam="arrive" k={ease(t / n)} push={0.6} /> },
  { id: "rb-kochraum", seconds: 10, draw: (t, n) => <Porter cam="kochraum" k={ease(t / n)} push={0.45} side={-0.2} /> },
  { id: "rb-sewer", seconds: 9, draw: (t, n) => <Sewer t={t} n={n} /> },
];

registerRoot(() => (
  <>
    {SHOTS.map((s) => (
      <Composition key={s.id} id={s.id} width={1920} height={1080} fps={FPS} durationInFrames={Math.round(s.seconds * FPS)} component={() => {
        const t = useCurrentFrame() / FPS;
        return s.draw(t, s.seconds);
      }} />
    ))}
  </>
));
