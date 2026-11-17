import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "raea";
import { ToneMapping } from "raea/3d";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Mesh3d } from "raea/mesh";
import { DirectionalLight, SolariLighting } from "raea/light";
import { LinearRgba } from "raea/color";
import { Quat, Transform } from "raea/transform";
import { Camera3d } from "raea/camera";

type V3 = [number, number, number];
const SLABS: { name: string; min: V3; max: V3; c: string }[] = [
  { name: "floor", min: [-1.4, -0.2, -30.2], max: [1.4, 0, 0.2], c: "#5d6b4f" },
  { name: "ceiling", min: [-1.4, 2.7, -30.2], max: [1.4, 2.9, 0.2], c: "#d8d4c8" },
  { name: "wall-r", min: [1.2, 0, -30.2], max: [1.4, 2.7, 0.2], c: "#cfc59a" },
  { name: "wall-l", min: [-1.4, 0, -30.2], max: [-1.2, 2.7, 0.2], c: "#cfc59a" },
  { name: "wall-far", min: [-1.4, 0, -30.2], max: [1.4, 2.7, -30], c: "#cfc59a" },
  { name: "wall-near", min: [-1.4, 0, 0], max: [1.4, 2.7, 0.2], c: "#cfc59a" },
];
const box = (min: V3, max: V3) => ({
  transform: Transform.fromXyz((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2),
  half: [(max[0] - min[0]) / 2, (max[1] - min[1]) / 2, (max[2] - min[2]) / 2] as V3,
});
const TUBES = [-3, -9, -15, -21, -27];

function Hall() {
  const f = useCurrentFrame();
  const z = -1 - f * 0.03;
  const yaw = Math.sin(f / 40) * 0.25;
  const flick = f % 37 < 3 ? 0.2 : 1;
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Camera3d transform={Transform.fromXyz(0.1, 1.62, z).withRotation(Quat.fromEuler("YXZ", yaw, -0.05, 0))} projection={{ Perspective: { fov: (75 * Math.PI) / 180 } }}>
        <SolariLighting bounces={2} />
      </Camera3d>
      <ToneMapping exposure={0} />
      <DirectionalLight illuminance={0.001} transform={Transform.fromXyz(0, -10, 0).lookingAt([0.1, 0, 0])} />
      {SLABS.map(({ name, min, max, c }) => {
        const b = box(min, max);
        return (
          <Mesh3d key={name} name={name} transform={b.transform}>
            <Cuboid half_size={b.half} />
            <StandardMaterial base_color={c} perceptual_roughness={0.85} />
          </Mesh3d>
        );
      })}
      {TUBES.map((tz, i) => (
        <Mesh3d key={tz} name={`tube-${i}`} castShadow={false} transform={Transform.fromXyz(0, 2.68, tz)}>
          <Cuboid half_size={[0.3, 0.015, 0.6]} />
          <StandardMaterial base_color="#ffffff" emissive={new LinearRgba(5000, 5200, 4600, 1).mul(i === 2 ? flick : 1)} />
        </Mesh3d>
      ))}
    </AbsoluteFill>
  );
}

registerRoot(() => <Composition id="spike" component={Hall} width={1920} height={1080} fps={60} durationInFrames={180} />);
