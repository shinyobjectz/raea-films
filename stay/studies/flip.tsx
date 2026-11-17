// Study: the simulated sea (blender/studies/flip.py), the boat riding its keyed path through the swell.
//   raea render studies/flip.tsx --composition flip -o out/studies/flip.mp4
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, Environment, Fog, MeshSequence, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import ride from "../media/ocean/flip.boat.json";

const R = ride as { frames: number; x: number[]; y: number[]; pitch: number[] };
function Flip({ name }: { name: string }) {
  const f = Math.min(R.frames - 1, useCurrentFrame());
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(-16 + 0.14 * f, 2.2, 15).lookingAt([-9 + 0.1 * f, 1.4, 0])} projection={{ Perspective: { fov: (34 * Math.PI) / 180, near: 0.1, far: 6000 } }} />
        <ToneMapping mode="agx" exposure={-2.8} />
        <Fog color="#6f7d95" near={30} far={500} />
        <Environment src={staticFile("hdri/qwantani_moonrise_puresky.hdr")} intensity={1.6} rotation={0.6} background />
        <DirectionalLight illuminance={9000} color="#ffb48a" shadow_maps_enabled transform={Transform.fromXyz(-40, 12, -50).lookingAt([0, 0, 0])} />
        <MeshSequence name="sea" src={staticFile(`ocean/${name}.rseq`)} frame={f} color="#ffffff" roughness={0.08} reflectance={0.5} metalness={0} clearcoat={0} />
        <MeshSequence name="spray" src={staticFile(`ocean/${name}-spray.rseq`)} frame={f} color="#ffffff" roughness={0.9} metalness={0} clearcoat={0} />
        <Mesh3d name="far-sea" transform={Transform.fromXyz(0, -0.6, 0)}><Cuboid half_size={[5000, 0.5, 5000]} /><StandardMaterial base_color="#03131a" perceptual_roughness={0.2} reflectance={0.35} /></Mesh3d>
        <Model name="boat" src={staticFile("models/sea/boat.glb")} position={[R.x[f], R.y[f] - 0.95, 0]} rotation={[0, Math.PI / 2, R.pitch[f]]} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="flip" component={() => <Flip name="flip" />} width={1350} height={1080} fps={30} durationInFrames={R.frames} />);
