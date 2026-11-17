// Stills of v9's new pieces (components/tut/v9.tsx) on their own, to look at before they go into the film; and the
// desktop's wallpaper (assets/tut-desktop/wall.png), the tutorial's swamp with the computer left out.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { SUN, TutWorld } from "../components/tut/world";
import { TutMachine } from "../components/tut/machine";
import { STICKER, stickerUniforms } from "./sticker";
import { project } from "../components/tut/reviewers";
import { DiscordCard, Desktop, EndCard, FingerprintCheck, FingerprintGather, Fonts, GooseLabel, LogoRing, PowerOn, ringYaw } from "../components/tut/v9";
import { height } from "./set";
import type { V3 } from "./plan";

const g = (x: number, z: number): V3 => [x, height(x, z), z];
const WALLS: { eye: V3; at: V3; fov: number }[] = [
  { eye: [2.5, 1.0, 6], at: [-1, 1.6, -12], fov: 50 },
  { eye: [-1.5, 1.3, 3], at: [-12, 2.2, -14], fov: 50 },
  { eye: [1.5, 1.3, 3], at: [12, 2.4, -14], fov: 50 },
  { eye: [0, 1.4, 5], at: [0, 2.6, 30], fov: 50 },
];
function Wall() {
  const f = useCurrentFrame(), c = WALLS[Math.min(WALLS.length - 1, f)];
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...c.eye).lookingAt(c.at, [0, 1, 0])} projection={{ Perspective: { fov: (c.fov * Math.PI) / 180, far: 900 } }} />
      <TutWorld t={3} wind={0.1} rings={[]} motes={0} moteCount={0} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
    </>
  );
}

// the cold open: Goose at the keyboard, the glass powering on behind him, then "This is Goose" (frame = tenths of a second)
const OPEN = { eye: [2.1, 0.8, 6.6] as V3, at: [1.2, 1.5, 1.2] as V3, fov: 40, goose: g(1.4, 3.0) };
function Open() {
  const t = useCurrentFrame() / 10, neck: V3 = [OPEN.goose[0], OPEN.goose[1] + 0.85, OPEN.goose[2]];
  const q = project(neck, OPEN.eye, OPEN.at, OPEN.fov);
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...OPEN.eye).lookingAt(OPEN.at, [0, 1, 0])} projection={{ Perspective: { fov: (OPEN.fov * Math.PI) / 180, far: 900 } }} />
      <TutWorld t={t} wind={0.1} rings={[]} motes={0} moteCount={200} />
      <TutMachine screen="tutorial-app/states/010-everything.png" t={t} />
      <PowerOn u={t - 0.3} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose-tut.glb")} position={OPEN.goose} rotation={[0, 0, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: 2, weight: 1 }] }} />
      <AbsoluteFill><Fonts />{q && <GooseLabel x={q.x} y={q.y} u={t - 1.2} left={5} />}</AbsoluteFill>
    </>
  );
}

// the ring: behind Goose by the water, the logos over his head
// on the meadow behind the keyboard, facing away from the computer, the sky and the trees over him
const RY = 0, RG = g(0.4, 6.0);
const RING_SHOT = { eye: [RG[0] + 0.6, RG[1] + 0.75, RG[2] - 3.0] as V3, at: [RG[0] - 0.1, RG[1] + 1.55, RG[2] + 5] as V3, fov: 46, goose: RG };
function Ring() {
  const t = useCurrentFrame() / 10, head: V3 = [RING_SHOT.goose[0], RING_SHOT.goose[1] + 1.1, RING_SHOT.goose[2]];
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...RING_SHOT.eye).lookingAt(RING_SHOT.at, [0, 1, 0])} projection={{ Perspective: { fov: (RING_SHOT.fov * Math.PI) / 180, far: 900 } }} />
      <TutWorld t={t} wind={0.1} rings={[]} motes={0} moteCount={200} />
      <TutMachine screen="tutorial-app/states/010-everything.png" t={t} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose-tut.glb")} position={RING_SHOT.goose} rotation={[0, RY, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: 2, weight: 1 }] }} />
      <LogoRing u={t} named={[1.5, 2.5, 3.4, 4.2]} head={head} yaw={RY} eye={RING_SHOT.eye} at={RING_SHOT.at} fov={RING_SHOT.fov} />
    </>
  );
}

function Flat({ which }: { which: "desktop" | "discord" | "fp1" | "fp2" | "end" }) {
  const t = useCurrentFrame() / 10;
  return (
    <AbsoluteFill style={{ background: "#3b6b4a" }}>
      <Fonts />
      {which === "desktop" && <Desktop local={t} />}
      {which === "discord" && <DiscordCard u={t} left={9} />}
      {which === "fp1" && <FingerprintGather u={t} flag={2.5} approve={4.2} print={6.2} left={9} />}
      {which === "fp2" && <FingerprintCheck u={t} scan={1.0} fix={5.0} left={10} />}
      {which === "end" && <EndCard u={t} />}
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    <Composition id="wall" component={Wall} width={1920} height={1080} fps={30} durationInFrames={WALLS.length} />
    <Composition id="open" component={Open} width={1920} height={1080} fps={10} durationInFrames={60} />
    <Composition id="ring" component={Ring} width={1920} height={1080} fps={10} durationInFrames={60} />
    {(["desktop", "discord", "fp1", "fp2", "end"] as const).map((w) => (
      <Composition key={w} id={w} component={() => <Flat which={w} />} width={1920} height={1080} fps={10} durationInFrames={100} />
    ))}
  </>
));
