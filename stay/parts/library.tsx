// The component library's stand: a place's components standing where they belong on a grey floor before a wall, at
// rest on frame 0 and every rig's clip run to its end by frame 30. Each place has library/PLACE.tsx, which lists its
// parts and registers `library-PLACE`:  raea render library/PLACE.tsx --composition library-PLACE --at 0,30 -o out/library/PLACE/
import { AbsoluteFill, staticFile, useCurrentFrame } from "raea";
import { Canvas3D, Model, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";

export type V3 = [number, number, number];
/** a component placed: its file (media/models/PLACE/FILE.glb), where, its turn about y, the clip to run, its scale */
export type Part = { file: string; at: V3; yaw?: number; clip?: string; scale?: number; name?: string };

export function Place({ place, parts, eye, look, fov = 38, wall = true, sun = 14000 }: { place: string; parts: Part[]; eye: V3; look: V3; fov?: number; wall?: boolean; sun?: number }) {
  const f = useCurrentFrame();
  const t = Math.min(1, f / 30) * 0.999;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (fov * Math.PI) / 180, near: 0.05, far: 400 } }}>
          <SolariLighting bounces={2} />
        </Camera3d>
        <ToneMapping exposure={0} />
        <DirectionalLight illuminance={sun} shadow_maps_enabled transform={Transform.fromXyz(-4, 5, 5).lookingAt([0, 0.6, -0.5])} />
        <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, 0)}>
          <Cuboid half_size={[40, 0.05, 40]} />
          <StandardMaterial base_color="#77777a" perceptual_roughness={0.85} />
        </Mesh3d>
        {wall && (
          <Mesh3d name="wall" transform={Transform.fromXyz(0, 3, -2.5)}>
            <Cuboid half_size={[8, 3, 0.1]} />
            <StandardMaterial base_color="#a9a9a4" perceptual_roughness={0.9} />
          </Mesh3d>
        )}
        {parts.map((p, i) => (
          <Model key={p.name ?? `${p.file}-${i}`} name={p.name ?? `${p.file}-${i}`} src={staticFile(`models/${place}/${p.file}.glb`)} position={p.at} rotation={[0, p.yaw ?? 0, 0]} scale={[p.scale ?? 1, p.scale ?? 1, p.scale ?? 1]} {...(p.clip ? { animation: p.clip, time: t, loop: false } : {})} />
        ))}
      </Canvas3D>
    </AbsoluteFill>
  );
}
