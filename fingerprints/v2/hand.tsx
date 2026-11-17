// The hand: the director's scanned 60s male hand (media/hand, a purchased scan), ten times life size so a lens's depth of
// field behaves as it does at arm's length, posed by v2/rig.ts. The skin is a plain StandardMaterial, which Solari
// traces (its light, its shadows on itself, its bounce). The mesh keeps one name: under Solari a mesh renamed every
// frame leaves its old shapes behind in the traced scene, where they shadow the new one, so the film is rendered a
// frame a process (tools/film.sh) and each process sees one shape.
import { staticFile } from "raea";
import { BufferMesh, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { MESH, MESH_LEFT, type Pose, skin, skinLeft } from "./rig";

export function Hand({ pose, left = false }: { f?: number; pose: Pose; left?: boolean }) {
  // the left hand is the right one in a mirror (its pose is given as the right hand's, mirrored at x = 0)
  const s = left ? skinLeft(pose) : skin(pose);
  const M = left ? MESH_LEFT : MESH;
  return (
    <Mesh3d name={left ? "skin-left" : "skin"}>
      <BufferMesh positions={s.positions} normals={s.normals} uvs={M.uvs} indices={M.indices} />
      <StandardMaterial base_color="#ffffff" base_color_texture={staticFile("hand/maps/colour.jpg")} normal_map_texture={staticFile("hand/maps/normal.png")} metallic_roughness_texture={staticFile("hand/maps/rough.jpg")} perceptual_roughness={1} metallic={0} reflectance={0.4} />
    </Mesh3d>
  );
}
