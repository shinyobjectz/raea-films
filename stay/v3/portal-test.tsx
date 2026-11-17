// feasibility: a doorway that shows another world's frames, mapped in screen space, under the ray-traced light
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, Environment, Model, ShaderMesh, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
const PORTAL = /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let uv = in.position.xy / view.viewport.zw;
  let c = textureSample(tex_next, samp_next, uv, i32(u_layer()));
  return vec4<f32>(c.rgb * u_gain(), 1.0);
}`;
function T({ rt }: { rt: boolean }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(0.4, 1.45, 3 - f * 0.02).lookingAt([0, 1.2, -3])} projection={{ Perspective: { fov: (50 * Math.PI) / 180, near: 0.05, far: 500 } }}>{rt && <SolariLighting bounces={2} />}</Camera3d>
        <ToneMapping mode="agx" exposure={0} />
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={1} background />
        <Model name="wall" src={staticFile("models/hallway/wall-door.glb")} position={[0, 0, -3.2]} />
        <ShaderMesh name="portal" shape="box(0.95, 2.08, 0.01)" position={[0, 1.04, -3.15]} wgsl={PORTAL} uniforms={{ layer: Math.min(3, Math.floor(f / 10)), gain: 1 }} textures={{ next: { src: staticFile("portal/test.png"), layers: 4 } }} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <><Composition id="p" component={() => <T rt={false} />} width={1350} height={1080} fps={30} durationInFrames={40} /><Composition id="p-rt" component={() => <T rt />} width={1350} height={1080} fps={30} durationInFrames={40} /></>);
