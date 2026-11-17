import { AbsoluteFill, Composition, registerRoot } from "raea";
import { grow } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
const A = grow.tree({ height: 6, crown: "dome" }, "wood");
const B = grow.tree({ height: 6, crown: "dome" }, "leaves");
const C = grow.tree({ height: 9, crown: "umbrella", width: 1.2 }, "all");
function T() {
  return (
    <AbsoluteFill style={{ background: "#b9c2b4" }}>
      <Camera3d transform={Transform.fromXyz(0, 4, 20).lookingAt([0, 4.5, 0])} projection={{ Perspective: { fov: (40 * Math.PI) / 180 } }} />
      <AmbientLight brightness={300} />
      <DirectionalLight transform={Transform.fromXyz(-7, 6, 9).lookingAt([0, 1, 0])} illuminance={9000} shadow_maps_enabled />
      <Mesh3d transform={Transform.fromXyz(0, -0.05, 0)}><Cuboid half_size={[20, 0.05, 20]} /><StandardMaterial base_color="#77806f" /></Mesh3d>
      <Mesh3d name="a" shape={A} transform={Transform.fromXyz(-5, 0, 0)}><StandardMaterial base_color="#5a4a3c" /></Mesh3d>
      <Mesh3d name="b" shape={B} transform={Transform.fromXyz(-5, 0, 0)}><StandardMaterial base_color="#6f9a52" /></Mesh3d>
      <Mesh3d name="c" shape={C} transform={Transform.fromXyz(4, 0, 0)}><StandardMaterial base_color="#5a4a3c" /></Mesh3d>
    </AbsoluteFill>
  );
}
registerRoot(() => <Composition id="tree" component={T} width={960} height={540} fps={30} durationInFrames={2} />);
