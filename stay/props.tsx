// The prop stand: each modelled prop alone on a grey floor under a low sun, to look at before it goes into a place.
// Not the film (the storyboard gate holds the film's renders): one composition a prop, rendered as one still.
//   raea render props.tsx --composition prop-cursor --at 0 -o out/props/cursor/
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Canvas3D, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

type V3 = [number, number, number];
function Stand({ src, scale, at, eye, look }: { src: string; scale: number; at: V3; eye: V3; look: V3 }) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (28 * Math.PI) / 180, near: 0.02, far: 200 } }}>
          <SolariLighting bounces={2} />
        </Camera3d>
        <ToneMapping exposure={0} />
        {/* no <Atmosphere light />: it panics with this setup (bevy_pbr atmosphere/environment.rs:124, 11-10) */}
        <DirectionalLight illuminance={40000} shadow_maps_enabled transform={Transform.fromXyz(-3, 2.2, 2).lookingAt([0, 0.4, 0])} />
        <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, 0)}>
          <Cuboid half_size={[6, 0.05, 6]} />
          <StandardMaterial base_color="#7a7a78" perceptual_roughness={0.85} />
        </Mesh3d>
        <Mesh3d name="wall" transform={Transform.fromXyz(0, 3, -2.5)}>
          <Cuboid half_size={[6, 3, 0.1]} />
          <StandardMaterial base_color="#8a8a88" perceptual_roughness={0.9} />
        </Mesh3d>
        <Model name="prop" src={staticFile(src)} position={at} scale={[scale, scale, scale]} rotation={[0, -0.35, 0.12]} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <>
    {/* the cursor 25 cm tall, its tip 70 cm up, as it hangs in a room */}
    <Composition id="prop-cursor" component={() => <Stand src="models/cursor.glb" scale={0.25} at={[-0.1, 0.7, 0]} eye={[0.55, 0.75, 1.3]} look={[0, 0.58, 0]} />} width={1350} height={1080} fps={30} durationInFrames={1} />
  </>
));
