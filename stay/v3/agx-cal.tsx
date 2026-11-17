// Calibration (not in the film): what AgX makes of a ramp of linear values, read back to undo it on a doorway's picture
// of the next world (v3/kit.tsx). Each column of the frame is one value, 2^(-10 + 16.5 x) * 0.18 (AgX's whole range).
import { AbsoluteFill, Composition, registerRoot } from "raea";
import { Canvas3D, FramePass, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

const RAMP = /* wgsl */ `
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let x = floor(in.uv.x * 256.0) / 255.0;
  let v = exp2(-10.0 + 16.5 * x) * 0.18;
  return vec4<f32>(v, v, v, 1.0);
}`;
function Cal() {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(0, 0, 5).lookingAt([0, 0, 0])} />
        <ToneMapping mode="aces" exposure={0} />
        <Mesh3d transform={Transform.fromXyz(0, 0, -50)}><Cuboid half_size={[0.01, 0.01, 0.01]} /><StandardMaterial base_color="#808080" /></Mesh3d>
        <FramePass wgsl={RAMP} at="before-tonemap" />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="agx-cal" component={Cal} width={1024} height={64} fps={30} durationInFrames={1} />);
