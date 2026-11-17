// Study: a place as its wireframe (Bevy's own WireframeConfig, every mesh's edges), nothing lit.
import { AbsoluteFill, Composition, registerRoot, staticFile } from "raea";
import { Canvas3D, Model, BevyResource } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { VINYL } from "../sets/vinyl";

const Wire = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Canvas3D>
      <Camera3d transform={Transform.fromXyz(1.6, 2.2, 5.4).lookingAt([-0.6, 1.0, 0.5])} projection={{ Perspective: { fov: 0.7, near: 0.05, far: 200 } }} />
      <BevyResource type="bevy_pbr::wireframe::WireframeConfig" value={{ global: true, default_color: { LinearRgba: { red: 1, green: 1, blue: 1, alpha: 1 } }, default_line_width: 1.0, default_topology: "Quads", xray_mode: false }} />
      {VINYL.map((p, i) => <Model key={i} name={p.name ?? `${p.file}-${i}`} src={staticFile(`models/vinyl/${p.file}.glb`)} position={p.at} rotation={[0, p.yaw ?? 0, 0]} />)}
    </Canvas3D>
  </AbsoluteFill>
);
registerRoot(() => <Composition id="wire" component={Wire} width={1350} height={1080} fps={30} durationInFrames={2} />);
