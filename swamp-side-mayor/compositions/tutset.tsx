// A look check of the tutorial's set (tutorial.script.ts), not the film: the music video's swamp with the tutorial's
// machine (16:9 glass, a Mac's keys) and its three lettered doors, from three cameras: the wide, the doors from the
// stage, and the glass as a teaching line frames it (the screen over 80% of the frame). The glass carries a capture
// from the music video's own app shots until the tutorial's take lands (assets/tutorial-app).
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { SUN, TutWorld } from "../components/tut/world";
import { Critters } from "./ruins";
import { STICKER, stickerUniforms } from "./sticker";
import { STAGE, type V3 } from "./plan";
import { height } from "./set";
import { TutMachine, GLASS, TMON } from "../components/tut/machine";
import { DOORS, Doors, TOWARD } from "../components/tut/doors";

const FPS = 30;
const mid = (() => { const s = DOORS.reduce((a, d) => [a[0] + d.at[0], a[1] + d.at[1], a[2] + d.at[2]], [0, 0, 0]); return [s[0] / DOORS.length, s[1] / DOORS.length + 1.4, s[2] / DOORS.length] as V3; })();
// the glass framed so the screen is 85% of the frame's width: at 30 degrees high, 16:9
const GLASS_D = (TMON.screen[0] / 0.85) * (9 / 16) / (2 * Math.tan((15 * Math.PI) / 180));
const CAMS: Record<string, { eye: V3; at: V3; fov: number }> = {
  wide: { eye: [0, 3.2, 9.5], at: [0, 2.4, -8], fov: 50 },
  doors: { eye: [mid[0] + TOWARD[0] * 9, 1.7, mid[2] + TOWARD[1] * 9], at: mid, fov: 46 },
  keys: { eye: [-2.2, 2.6, 4.6], at: [-1.0, 0.3, 0.2], fov: 34 },
  ivy: { eye: [7.5, 4.2, -3.5], at: [2.5, 3.6, -11], fov: 40 },
  glass: { eye: [GLASS[0], GLASS[1], GLASS[2] + GLASS_D], at: GLASS, fov: 30 },
  // v3's plank wings (tutorial.script.ts 05: "By version three, the wings were still planks."), Goose medium, wings out
  planks: { eye: [-3.2, 1.25, 7.4], at: [-4.0, 0.95, 3.6], fov: 38 },
};

function Set({ cam }: { cam: keyof typeof CAMS }) {
  const frame = useCurrentFrame(), t = frame / FPS, c = CAMS[cam];
  return (
    <AbsoluteFill style={{ background: "#3896d4" }}>
      <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.at, [0, 1, 0])} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, far: 900 } }} />
      <TutWorld t={t} wind={0.1} rings={[]} motes={0} moteCount={cam === "glass" ? 0 : 260} />
      <TutMachine screen="tutorial-app/states/030-rail-foot.png" down={{ cmdL: 1, b: 0.4 }} t={t} />
      <Doors frame={frame} />
      <Critters t={t} b={0} look={STAGE} hop={0.2} jump={0} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      {/* the plank goose (blender/tut_goose_build.py --planks) at a moment of the show with its wings out */}
      <Model name="goose" pass="hero" flat src={staticFile(cam === "planks" ? "glb/goose-planks.glb" : "glb/goose.glb")} position={cam === "planks" ? [-4.0, height(-4.0, 3.6), 3.6] : [-1.2, 0, -1.4]} rotation={[0, cam === "planks" ? 0.2 : -0.9, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: cam === "planks" ? 39.31 + t : 0, weight: 1 }] }} />
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    {(Object.keys(CAMS) as (keyof typeof CAMS)[]).map((k) => (
      <Composition key={k} id={`tutset-${k}`} component={() => <Set cam={k} />} width={1920} height={1080} fps={FPS} durationInFrames={90} />
    ))}
  </>
));
