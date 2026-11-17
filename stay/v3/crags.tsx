// a look at the candidate rocks (blender/crags.py), side by side, lit from behind as the shot is
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Canvas3D, Environment, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
const NAMES = ["crag-a", "crag-b", "crag-c", "crag-d", "crag-e", "crag-f"], SCALE = [1, 4, 2.4, 6, 3.2, 2];
function One({ i }: { i: number }) {
  return (
    <AbsoluteFill style={{ background: "#9aa3aa" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(4, 2.5, 26).lookingAt([0, 4.5, 0])} projection={{ Perspective: { fov: 0.6, near: 0.1, far: 800 } }}><SolariLighting bounces={2} /></Camera3d>
        <ToneMapping mode="agx" exposure={-1} />
        <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={0.8} rotation={4.1} background />
        <DirectionalLight illuminance={30000} color="#ffe2b0" shadow_maps_enabled transform={Transform.fromXyz(-40, 40, -60).lookingAt([0, 4, 0])} />
        <Model name="rock" src={staticFile(`models/sea/${NAMES[i]}.glb`)} position={[0, 0, 0]} scale={[SCALE[i], SCALE[i], SCALE[i]]} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <>{NAMES.map((n, i) => <Composition key={n} id={n} component={() => <One i={i} />} width={675} height={540} fps={30} durationInFrames={1} />)}</>);
