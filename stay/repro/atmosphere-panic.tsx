// Repro (11-10): <Atmosphere light /> panics on the first frame with this scene: bevy_pbr-0.20.0
// src/atmosphere/environment.rs:124:64 `Option::unwrap()` on a `None` value. Without it the scene renders.
//   raea render repro/atmosphere-panic.tsx --at 0 -o /tmp/x/      (SOLARI=0 to try it raster-lit)
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Atmosphere, Canvas3D, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

const solari = process.env.SOLARI !== "0";
function Scene() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(0, 1, 4).lookingAt([0, 0.5, 0])} projection={process.env.PROJ === "1" ? { Perspective: { fov: (28 * Math.PI) / 180, near: 0.02, far: 200 } } : undefined}>{solari ? <SolariLighting bounces={2} /> : null}</Camera3d>
        <ToneMapping exposure={0} />
        <Atmosphere light />
        <DirectionalLight illuminance={40000} shadow_maps_enabled transform={Transform.fromXyz(-3, 2.2, 2).lookingAt([0, 0.4, 0])} />
        {process.env.MODEL === "1" ? <Model name="prop" src={staticFile("models/cursor.glb")} position={[0, 0.7, 0]} scale={[0.25, 0.25, 0.25]} /> : null}
        <Mesh3d name="floor"><Cuboid half_size={[3, 0.05, 3]} /><StandardMaterial base_color="#7a7a78" /></Mesh3d>
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="repro" component={Scene} width={640} height={480} fps={30} durationInFrames={1} />);
