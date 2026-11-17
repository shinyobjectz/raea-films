// Which way it faces: the goose alone at the origin, unturned, seen from +z; a red ball where the plan says its bill's tip is.
import { AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame } from "raea";
import { Model } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Mesh3d, Sphere } from "raea/mesh";
import { Transform } from "raea/transform";
import tracks from "./goose.json";
function Test() {
  const f = useCurrentFrame(), tip = (tracks as any).tip[300] as [number, number, number], yaw = f === 0 ? 0 : f === 1 ? Math.PI : Math.PI / 2;
  return (
    <AbsoluteFill style={{ background: "#3da0d8" }}>
      <Camera3d transform={Transform.fromXyz(1.2, 0.6, 3).lookingAt([0, 0.4, 0])} projection={{ Perspective: { fov: (30 * Math.PI) / 180 } }} />
      <AmbientLight brightness={600} /><DirectionalLight transform={Transform.fromXyz(3, 5, 4).lookingAt([0, 0, 0])} illuminance={12000} />
      <Model name="goose" src={staticFile("glb/goose.glb")} position={[0, 0, 0]} rotation={[0, yaw, 0]} scale={1} graph={{ blend: [{ clip: "show", time: 10, weight: 1 }] }} />
      <Mesh3d name="tip" allowOverlap transform={Transform.fromXyz(tip[0], tip[1], tip[2])}><Sphere radius={0.03} /><StandardMaterial base_color="#ff0000" unlit /></Mesh3d>
      <Mesh3d name="plusz" allowOverlap transform={Transform.fromXyz(0, 0.02, 0.8)}><Sphere radius={0.05} /><StandardMaterial base_color="#00ff00" unlit /></Mesh3d>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="look" component={Test} width={1080} height={540} fps={30} durationInFrames={90} />);
