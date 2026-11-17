// A first look at bevy-aqua's water in raea (the plugin build: ~/raea/target/release/raea-bevy-sdk motion render ...):
// its FFT ocean under Bevy's atmosphere, with the film's rock and man standing in it. Two compositions: the crate's
// own lighting path (aqua), and the same under raea's ray-traced light (aqua-rt).
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Atmosphere, BevyComponent, BevyResource, Canvas3D, MeshSequence, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";

function Water({ rt }: { rt: boolean }) {
  const f = useCurrentFrame(), t = f / 30;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <BevyResource type="bevy_aqua_core::Ocean" value={{ level: 0 }} />
        <BevyResource type="bevy_aqua_core::OceanWaves" value={{ model: "Spectral", sea_state: "Rough", shallow_water_attenuation: 1, wind_direction_degrees: 180, wind_speed: 18, fetch: 90000, flow: [0, 0] }} />
        <Camera3d transform={Transform.fromXyz(3 - 0.35 * t, 2.2, 38 - 3.3 * t).lookingAt([0, 5.8, 0])} projection={{ Perspective: { fov: (34 * Math.PI) / 180, near: 0.1, far: 6000 } }}>
          {rt && <SolariLighting bounces={2} />}
          <BevyComponent type="bevy_core_pipeline::prepass::DepthPrepass" value={{}} />
        </Camera3d>
        <ToneMapping mode="agx" exposure={-3.2} />
        <Atmosphere light />
        <DirectionalLight illuminance={18000} color="#ffe8c8" shadow_maps_enabled transform={Transform.fromXyz(-56, 44, -186).lookingAt([0, 6, 0])} />
        <Model name="crag" src={staticFile("models/sea/crag-a.glb")} position={[0, -0.8, 0]} />
        <MeshSequence name="man" src={staticFile("ocean/figure.rseq")} frame={f} position={[0.206, 9.58, 0.209]} scale={1.25} color="#ffffff" roughness={0.85} metalness={0} clearcoat={0} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <>
  <Composition id="aqua" component={() => <Water rt={false} />} width={1350} height={1080} fps={30} durationInFrames={93} />
  <Composition id="aqua-rt" component={() => <Water rt />} width={1350} height={1080} fps={30} durationInFrames={93} />
</>);
