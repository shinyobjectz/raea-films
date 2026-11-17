// Look test for the swamp: four angles with the goose on its stage.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { STICKER, stickerUniforms } from "./sticker";
import { SUN, World2 } from "./world2";
import { Critters, Magic, Splash } from "./ruins";
type V = { eye: [number, number, number]; at: [number, number, number]; fov: number; yaw: number };
type V2 = V & { g: [number, number, number]; magic?: number; swim?: boolean };
const VIEWS: V2[] = [
  { eye: [1.5, 1.6, 6.5], at: [0, 1.2, -12], fov: 50, yaw: 0.3, g: [0, 0, -2.65] },
  { eye: [0.9, 0.5, 0.4], at: [0, 1.0, -2.65], fov: 38, yaw: 0.35, g: [0, 0, -2.65], magic: 1 },
  { eye: [2.5, 1.4, -8.5], at: [0, 0.9, 0], fov: 44, yaw: 2.9, g: [0, 0, -4.6], magic: 0.6 },
  { eye: [20, 12, 12], at: [0, 0, -8], fov: 42, yaw: 0.8, g: [0, 0, -2.65], magic: 1 },
  { eye: [-1.2, 0.35, -5.6], at: [1.2, -0.1, -9.5], fov: 46, yaw: 2.6, g: [0.6, -0.5, -8.6], swim: true },
  { eye: [7, 2.2, 3], at: [-4, 1.5, -10], fov: 40, yaw: 0.8, g: [0, 0, -2.65] },
];
function Test() {
  const f = useCurrentFrame(), v = VIEWS[f % VIEWS.length];
  return (
    <AbsoluteFill style={{ background: "#3da0d8" }}>
      <Camera3d transform={Transform.fromXyz(...v.eye).lookingAt(v.at)} projection={{ Perspective: { fov: (v.fov * Math.PI) / 180, far: 900 } }} />
      <World2 t={12} wind={0.1} rings={v.swim ? [0, 0.4, 0.8, 1.2].map((a, k) => ({ x: v.g[0] - 0.25 * k, z: v.g[2] + 0.35 * k, age: a, size: 2.2 })) : []} />
      <Critters t={12} look={v.g} hop={1} />
      <Magic on={v.magic ?? 0} spin={0.4} />
      {v.swim && <Splash at={[2.2, -0.16, -10.4]} age={0.3} size={1.6} eye={v.eye} />}
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms(SUN)} />
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose.glb")} position={v.g} rotation={[0, v.yaw, 0]} scale={1.7} graph={{ blend: [{ clip: "show", time: 3, weight: 1 }] }} />
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="worldtest" component={Test} width={2160} height={1080} fps={30} durationInFrames={30} />);
