// The walkable city's houses (tools/city/bake.ts, interiors/CITY.md) near an eye: each baked house within `range`
// metres drawn from its GLB, the levels named in `hide` left out (a cutaway). And CityCut, the world's tiles with the
// world's own shaders (components/world/City.tsx, shaders.ts) cut by a plane, for looking into the houses from above:
// it leaves out City's room atlas (the panes of a house whose rooms are loaded should be plain glass anyway).
import { staticFile } from "raea";
import { Model, surfaceShader } from "raea/3d";
import index from "../../assets/world/friedrichstadt/interiors/index.json";
import { tileLods, type CityLook } from "../world/City";
import { FACADE, GLASS, GROUND, WATER, worldUniforms } from "../world/shaders";

type V3 = [number, number, number];
const HOUSES = Object.entries(index as Record<string, { bbox: number[]; tris: number }>).filter(([, h]) => h.tris > 0);
const toScene = (e: number, n: number): [number, number] => [e - 391000, -(n - 5819000)];

export function Houses({ eye, range = 120, hide = [], shadow = true }: { eye: V3; range?: number; hide?: string[]; shadow?: boolean }) {
  return (
    <>
      {HOUSES.filter(([, h]) => {
        const [x0, z1] = toScene(h.bbox[0], h.bbox[1]), [x1, z0] = toScene(h.bbox[2], h.bbox[3]);
        const dx = Math.max(x0 - eye[0], 0, eye[0] - x1), dz = Math.max(z0 - eye[2], 0, eye[2] - z1);
        return Math.hypot(dx, dz) <= range;
      }).map(([key]) => (
        <Model key={key} name={`interior-${key}`} src={staticFile(`world/friedrichstadt/interiors/${key}.glb`)} hide={hide} shadow={shadow} allowOverlap />
      ))}
    </>
  );
}

function Recover({ material, wesl, uniforms }: { material: string; wesl: string; uniforms: Record<string, number | number[]> }) {
  const props = { material, shader: surfaceShader("MeshStandardMaterial", { wesl, uniforms }) };
  return <div data-3d="MeshStandardMaterial" data-props={JSON.stringify(props)} />;
}

export function CityCut({ eye, look, clip, maxLod = 1 }: { eye: V3; look: CityLook; clip: number[]; maxLod?: 0 | 1 | 2 }) {
  const u = worldUniforms(look, clip);
  const mats = (
    <>
      <Recover material="facade" wesl={FACADE} uniforms={u.facade} />
      <Recover material="glass" wesl={GLASS} uniforms={u.glass} />
      <Recover material="rooms" wesl={GLASS} uniforms={u.glass} />
      <Recover material="ground" wesl={GROUND} uniforms={u.ground} />
      <Recover material="water" wesl={WATER} uniforms={u.water} />
    </>
  );
  return (
    <>
      {tileLods(eye, 1, maxLod).map(({ tile, lod }) => (
        <Model key={`${tile}-${lod}`} name={`tile-${tile}-lod${lod}`} src={staticFile(`world/friedrichstadt/${tile}/lod${lod}.glb`)} shadow>
          {mats}
        </Model>
      ))}
    </>
  );
}
