// A ShaderMesh (raea/3d) that casts no shadow: the film's cards of light and air (a flame, its smoke, the sea's spray,
// a doorway's picture) stand across the lens's view, and a card that casts a shadow puts the whole world behind it in
// the dark (the rock's face, 11-11, under the spray's 30 slices). raea's ShaderMesh has no castShadow yet, so this one
// is the same entity with Bevy's NotShadowCaster on it.
import { BevyComponent, Entity } from "raea/3d";
import type { V3 } from "../v2/math";

type Uniform = number | string | number[];
export type NoShadowMeshProps = {
  name?: string; position?: V3; rotation?: V3; scale?: V3 | number;
  shape: { primitive: "Rectangle"; half_size: [number, number] } | string;
  wgsl: string; uniforms?: Record<string, Uniform>; textures?: Record<string, unknown>;
  alpha?: "blend" | "premultiplied" | "add" | "multiply"; doubleSided?: boolean;
};
export function NoShadowMesh({ shape, wgsl, uniforms = {}, textures = {}, alpha, doubleSided, ...place }: NoShadowMeshProps) {
  if (!/fn\s+shade\s*\(/.test(wgsl)) throw new TypeError("NoShadowMesh: wgsl defines fn shade(in: VertexOutput) -> vec4<f32>");
  const mesh = typeof shape === "string" ? `shape:${shape}` : shape;
  const material = { wgsl, uniforms, textures, ...(alpha ? { alpha } : {}), ...(doubleSided ? { double_sided: true } : {}) };
  return (
    <Entity {...(place as object)} {...({ allowOverlap: true } as object)}>
      <BevyComponent type="bevy_mesh::components::Mesh3d" value={mesh} />
      <BevyComponent type="bevy_pbr::mesh_material::MeshMaterial3d<raea_sys_material::shader_material::ShaderMaterial>" value={material} />
      <BevyComponent type="bevy_light::NotShadowCaster" value={{}} />
    </Entity>
  );
}
