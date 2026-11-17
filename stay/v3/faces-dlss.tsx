// The faces shot (faces.tsx) held longer, for the 0.1.1 launch thread's DLSS post (releases/0.1.1/src/dlss.tsx): the
// same light, haze, environment, frame pass and print as the film's shot, five people as they are, eyes locked so
// every cut matches, cut on the post's song (CUTS), one slow pull back and push in over the 12 s loop (the render runs
// 2 s past it, the same faces again, for loop.sh). Focus on the eyes. Rendered clean (no grain) with raea's motion and
// depth for the DLSS pass:
//   raea render v3/faces-dlss.tsx --composition faces-dlss --aov -o $PROJECTS/releases/0.1.1/src/out/dlss/raw
// Its clock is releases/0.1.1/src/dlss-time.ts's (LOOP 360, FACES): keep them the same.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Character, registerBody, rest, type Skeleton } from "raea/character";
import { Bloom, Canvas3D, DepthOfField, Environment, FogVolume, FramePass, Refinish, ToneMapping, VolumetricFog } from "raea/3d";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import { Camera3d } from "raea/camera";
import turbo from "../media/characters/turbo/skeleton.json" with { type: "json" };
import luis from "../media/characters/luis/skeleton.json" with { type: "json" };
import leila from "../media/characters/leila/skeleton.json" with { type: "json" };
import mai from "../media/characters/mai/skeleton.json" with { type: "json" };
import pavel from "../media/characters/pavel/skeleton.json" with { type: "json" };
import { FilmLook } from "./look";

const FPS = 30, LOOP = 360;
// the frames each face cuts in on, set by the post's song (releases/0.1.1/src/dlss-time.ts FACES: keep them the same)
const CUTS = [0, 70, 150, 216, 288];
const PEOPLE = [turbo, leila, pavel, mai, luis] as unknown as Skeleton[];
PEOPLE.forEach((s) => registerBody(s));
const FOV = 0.27, EYELINE = 0.42;

function Faces() {
  const f = useCurrentFrame() % LOOP;
  let who = CUTS.length - 1;
  while (who > 0 && f < CUTS[who]) who--;
  const into = f - CUTS[who], len = (CUTS[who + 1] ?? LOOP) - CUTS[who], sk = PEOPLE[who], p = rest(sk);
  const ph = (f / LOOP) * 2 * Math.PI;
  // faces.tsx's framing (1.15 m to 0.95 m), as a loop: out and back in
  const eye = sk.landmarks?.eyes?.[1] ?? 1.65, dist = 1.05 + 0.1 * Math.cos(ph);
  const viewH = 2 * dist * Math.tan(FOV / 2), aim = eye - (0.5 - EYELINE) * viewH;
  const cam: [number, number, number] = [0.06 * Math.sin(ph), aim, dist];
  // focus on the eyes: the eye point's depth along the view, a few mm forward of it to the iris (a fixed `dist - 0.1`
  // sat 2-3 cm behind them, most of the depth of field at f/1.6 on this lens)
  const E = (sk.landmarks?.eyes as number[] | undefined) ?? [0, eye, 0.125];
  const fw = [0 - cam[0], 0, 0 - cam[2]], fl = Math.hypot(fw[0], fw[2]);
  const focus = ((E[0] - cam[0]) * fw[0] + (E[2] - cam[2]) * fw[2]) / fl - 0.006;
  const face: Record<string, number> = { smile: 0.1 + 0.05 * Math.sin(ph * 2 + who) };
  const bt = into - 44; if (bt >= 0 && bt < 5) face.blink = Math.sin((bt / 4) * Math.PI);
  return (
    <AbsoluteFill style={{ background: "#020202" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...cam).lookingAt([0, aim, 0])} projection={{ Perspective: { fov: FOV } }}>
          <SolariLighting bounces={2} />
          <DepthOfField focal_distance={focus} aperture_f_stops={2} max_circle_of_confusion_diameter={14} mode={"Bokeh" as never} />
        </Camera3d>
        <ToneMapping mode="agx" exposure={0.3} />
        <Bloom intensity={0.22} threshold={0.75} />
        <Environment src={staticFile("sky/studio.hdr")} intensity={0.02} />
        <DirectionalLight transform={Transform.fromXyz(-1.25, eye + 0.95, 0.35).lookingAt([0, eye - 0.02, 0])} illuminance={3400} color="#ffe6c4" volumetric shadow_maps_enabled soft_shadow_size={0.5} />
        <DirectionalLight transform={Transform.fromXyz(1.4, eye + 0.1, 1.0).lookingAt([0, eye, 0])} illuminance={22} color="#cfdcff" shadow_maps_enabled soft_shadow_size={1.5} />
        <DirectionalLight transform={Transform.fromXyz(1.1, eye + 0.35, -1.2).lookingAt([0, eye, 0])} illuminance={1100} color="#9fc0ff" shadow_maps_enabled soft_shadow_size={0.6} />
        <VolumetricFog ambient={0} />
        <FogVolume name="haze" position={[0, eye, 0]} scale={[3, 3, 3.4]} density={0.05} scattering={0.55} anisotropy={0.75} />
        <Refinish materials={[{ material: "namuhekam_male_polo_shirt", color: "#101012", roughness: 0.95 }]}>
          <Character name={sk.name} body={sk.name} outline={false} face={face} pose={{ ...p, root: [0, p.root[1], 0] }} />
        </Refinish>
        <FramePass file={staticFile("shaders/faces.wgsl")} frame="raea_frame" samplers={{ raea_frame_sampler: { filter: "nearest", wrap: "clamp" } }} uniforms={{ raea_pass: { a: [0, f, into / len, 1] } }} />
        <FilmLook look={{ base: 0, warm: 0.25, sat: 0.95, contrast: 0.6, grain: 0, vignette: 0.3, halation: 0.5, print: 0 }} seed={0} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="faces-dlss" component={Faces} width={1350} height={1080} fps={FPS} durationInFrames={LOOP + 60} />);
