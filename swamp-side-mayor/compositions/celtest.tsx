// Look test: the goose in its cel paint with the sticker line, on flat blue and on grass.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { FramePass, Grass, Look, Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Mesh3d } from "raea/mesh";
import { Transform } from "raea/transform";
import { STICKER, stickerUniforms } from "./sticker";
const VIEWS = [
  { eye: [0.25, 1.05, 1.1], at: [0, 0.98, 0], fov: 30, yaw: 0.15, debug: 0 },
  { eye: [0.9, 0.75, 2.4], at: [0, 0.55, 0], fov: 32, yaw: 0.7, debug: 0 },
  { eye: [-1.4, 0.5, 2.2], at: [0, 0.6, 0], fov: 34, yaw: -0.9, debug: 0 },
];
function Test() {
  const f = useCurrentFrame(), v = VIEWS[f % 3];
  return (
    <AbsoluteFill style={{ background: "#3da0d8" }}>
      <Camera3d transform={Transform.fromXyz(...(v.eye as [number, number, number])).lookingAt(v.at as [number, number, number])} projection={{ Perspective: { fov: (v.fov * Math.PI) / 180 } }} />
      <Look mode="paint" skip={["hero"]} bands={2} shadow="#a8bfdc" mid="#d4e0f0" grain={0.05} rag={1.2} boil={0} sky={["#3a9ad4", "#5cb2e2"]} passes={{ hero: { bands: 2, wash: 0, stroke: 0, edge: 0, saturate: 1.05 } }} />
      <FramePass wesl={STICKER} prepass={{ depth: true, normal: true }} uniforms={stickerUniforms([-3, 6, 5])} />
      <AmbientLight brightness={700} />
      <DirectionalLight transform={Transform.fromXyz(-3, 6, 5).lookingAt([0, 0, 0])} illuminance={14000} shadow_maps_enabled />
      <Mesh3d name="ground" transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[30, 0.05, 30]} /><StandardMaterial base_color="#5fb83a" perceptual_roughness={1} /></Mesh3d>
      <Grass name="grass" area={{ min: [-8, -8], max: [8, 8] }} height={() => 0} density={(x, z) => (Math.hypot(x, z) < 0.5 ? 0 : 9)} tints={[["#3f8f2a", "#9ad94a"]]} bladeHeight={0.22} />
      <Mesh3d name="probe" pass="hero" transform={Transform.fromXyz(-0.7, 0.4, 0)}><Cuboid half_size={[0.2, 0.2, 0.2]} /><StandardMaterial base_color="#e2a04a" /></Mesh3d>
      <Model name="goose" pass="hero" flat src={staticFile("glb/goose.glb")} position={[0, 0, 0]} rotation={[0, v.yaw, 0]} scale={1.6} graph={{ blend: [{ clip: "show", time: 20.2, weight: 1 }] }} />
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="celtest" component={Test} width={2160} height={1080} fps={30} durationInFrames={30} />);
