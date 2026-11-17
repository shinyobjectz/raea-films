// A probe: which way an Environment's picture faces at a rotation (the lens looks down -z, level, 90 degrees wide).
//   raea render v3/hdri-probe.tsx --composition probe --frame 0 -o x.png
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Canvas3D, Environment } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
const Probe = () => (
  <AbsoluteFill><Canvas3D>
    <Camera3d transform={Transform.fromXyz(0, 0, 0).lookingAt([0, 0, -1])} projection={{ Perspective: { fov: Math.PI / 2, near: 0.01, far: 100 } }} />
    <Environment src={staticFile("hdri/sunset_forest.hdr")} intensity={1} rotation={0} background />
  </Canvas3D></AbsoluteFill>
);
registerRoot(() => <Composition id="probe" component={Probe} width={800} height={400} fps={30} durationInFrames={1} />);
