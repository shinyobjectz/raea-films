// a look at the man and his coat alone (media/ocean/figure.rseq, blender/rock.py): from behind and from the side
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, Environment, MeshSequence, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight } from "raea/light";
import { Transform } from "raea/transform";
function Man({ side }: { side: boolean }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#8b949c" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(side ? 4.2 : 0, 1.1, side ? 0 : 4.2).lookingAt([0, 0.95, 0])} projection={{ Perspective: { fov: 0.5, near: 0.1, far: 100 } }} />
        <ToneMapping mode="agx" exposure={-1.5} />
        <Environment src={staticFile("hdri/kloofendal_48d_partly_cloudy_puresky.hdr")} intensity={1} background />
        <DirectionalLight illuminance={30000} shadow_maps_enabled transform={Transform.fromXyz(3, 6, 5).lookingAt([0, 1, 0])} />
        <MeshSequence name="man" src={staticFile("ocean/figure.rseq")} frame={f} rotation={[0, Math.PI, 0]} color="#ffffff" roughness={0.85} metalness={0} clearcoat={0} />
      </Canvas3D>
    </AbsoluteFill>
  );
}
registerRoot(() => <><Composition id="man-back" component={() => <Man side={false} />} width={540} height={720} fps={30} durationInFrames={150} /><Composition id="man-side" component={() => <Man side />} width={540} height={720} fps={30} durationInFrames={150} /></>);
