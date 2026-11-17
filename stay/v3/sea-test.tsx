// A first look at the FFT ocean (vendor/bevy_fft, the plugin build of raea) with the film's rock and man in it,
// under Bevy's atmosphere. `sea` is a calm-to-storm ramp over the shot's 93 frames; `sea-rt` is the same under
// raea's ray-traced light. Run with the plugin build:
//   RAEA_BUNDLE_LIB=~/raea/target/release/libraea_bundle.dylib vendor/bin/raea-sea motion render v3/sea-test.tsx ...
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Environment, BevyComponent, Canvas3D, Entity, MeshSequence, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function Water({ rt, storm }: { rt: boolean; storm?: number }) {
  const f = useCurrentFrame(), t = f / 30;
  const k = storm ?? Math.min(1, Math.max(0, (f - 9) / 46));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Entity name="sea" position={[0, 0, 0]}>
          <BevyComponent type="bevy_fft::ocean::sea::Sea" value={{
            extent: 3000, dense: 180, vertices: 900, grid: 1024, tile: 256,
            wind_speed: lerp(5.5, 10.5, k), wind_direction: 2.2, directional_spread: 0.25, peak_enhancement: 3.3,
            amplitude: lerp(1.2, 2.9, k), choppiness: lerp(0.9, 1.5, k), time_scale: 1, time: 20 + t,
            foam_intensity: 0.9, foam_cutoff: lerp(0.55, 0.82, k), foam_falloff: 0.3, foam_trail_decay: 0.955,
            color: [0.006, 0.02, 0.03], roughness: 0.12, reflectance: 0.5, fade_near: 900, fade_far: 2600, shore: [0.3, 0.2, 4.2, 2.6],
          }} />
        </Entity>
        <Camera3d transform={Transform.fromXyz(3 - 0.35 * t, 2.6, 38 - 3.3 * t).lookingAt([0, 5.8, 0])} projection={{ Perspective: { fov: (34 * Math.PI) / 180, near: 0.1, far: 8000 } }}>
          {rt && <SolariLighting bounces={2} />}
        </Camera3d>
        <ToneMapping mode="agx" exposure={-2.2} />
        <Environment src={staticFile("hdri/kloofendal_overcast_puresky.hdr")} intensity={0.9} rotation={2.2} background />
        <DirectionalLight illuminance={1400} color="#ffe8c8" shadow_maps_enabled transform={Transform.fromXyz(-56, 44, -186).lookingAt([0, 6, 0])} />
        <Model name="crag" src={staticFile("models/sea/crag-a.glb")} position={[0, -0.8, 0]} />
        <MeshSequence name="man" src={staticFile("ocean/figure.rseq")} frame={f} position={[0.206, 9.58, 0.209]} scale={1.25} color="#ffffff" roughness={0.85} metalness={0} clearcoat={0} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <>
  <Composition id="sea" component={() => <Water rt={false} />} width={1350} height={1080} fps={30} durationInFrames={93} />
  <Composition id="sea-calm" component={() => <Water rt={false} storm={0} />} width={1350} height={1080} fps={30} durationInFrames={93} />
  <Composition id="sea-storm" component={() => <Water rt={false} storm={1} />} width={1350} height={1080} fps={30} durationInFrames={93} />
  <Composition id="sea-rt" component={() => <Water rt />} width={1350} height={1080} fps={30} durationInFrames={93} />
</>);
