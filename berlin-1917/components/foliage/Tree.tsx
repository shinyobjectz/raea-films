// A tree grown by raea-sys-foliage, drawn on a day (docs/foliage.feature FO3): its leaf groups' materials come and go
// with the fall (their shadows with them) and the hooks (look.ts) draw the day over its vertex colours. `src` is its
// .glb and `atlas` the leaf atlas grown with it (assets/foliage/ID.glb and ID-atlas.png).
import { Model, surfaceShader } from "raea/3d";
import { BARK, LEAF } from "./look";
import { TREES, groups, state, type State } from "./season";
import { BARK_SCAN, SCANS, scanTextures, tintToward } from "./scans";

type V3 = [number, number, number];
export type Weather = { wet: number; snow: number; soot: number; algae: number };

/** soot on a city tree, 0-1 (ASSUMED: coal smoke at its 1917 high); algae on the weather side (ASSUMED, low in smoke) */
export const CITY: Weather = { wet: 0, snow: 0, soot: 0.6, algae: 0.35 };

// a standard material with a hook; on a Model, `material` names the glTF material it covers
export function Cover({ material, props }: { material?: string; props: Record<string, unknown> }) {
  return <div data-3d="MeshStandardMaterial" data-props={JSON.stringify(material ? { material, ...props } : props)} />;
}

/** A tree's covers alone (bark and the eight leaf groups with their hooks), for a <Model> or an <Instances> of its
 * .glb: the day's leaves, their fall and their shadows. */
export function TreeCovers({ species, atlas, day, weather, ground = -1000 }: { species: string; atlas: string; day: number; weather: Weather; ground?: number }) {
  const tree = TREES[species];
  if (!tree) throw new Error(`Tree: no species ${species}; known: ${Object.keys(TREES).join(", ")}`);
  const s: State = state(tree, day);
  const c = tree.colour;
  const leaf = surfaceShader("MeshStandardMaterial", {
    wesl: LEAF,
    uniforms: { phase: [s.grown, s.mature, s.turned, s.browned], more: [s.fallen, s.flowering, weather.wet, weather.soot], young: c.young, green: c.green, autumn: c.autumn, dead: c.dead, flower: c.flower ?? c.young },
    textures: { atlas: { src: atlas } },
  });
  // the species' scan, its colour moved a third of the way to the species' (ASSUMED share: the scans' trees grew elsewhere)
  const scan = BARK_SCAN[species] ?? "tree_bark_03";
  const bark = surfaceShader("MeshStandardMaterial", {
    wesl: BARK,
    uniforms: { bark: tree.bark, kind: tree.kind, weather: [weather.wet, weather.snow, weather.soot, weather.algae], size: SCANS[scan].size, tint: tintToward(scan, tree.bark, 0.35), ground },
    textures: scanTextures(scan),
  });
  return (
    <>
      <Cover material="bark" props={{ shader: bark }} />
      {groups(s).map((o, k) => (
        <Cover key={k} material={`leaf-${k}`} props={{ shader: leaf, opacity: o, alphaMode: "mask", alphaCutoff: 0.1, diffuseTransmission: 0.3 }} />
      ))}
    </>
  );
}

export function Tree({ name, species, src, atlas, day, weather, position, yaw = 0 }: { name: string; species: string; src: string; atlas: string; day: number; weather: Weather; position?: V3; yaw?: number }) {
  return (
    <Model name={name} src={src} position={position} rotation={[0, yaw, 0]}>
      <TreeCovers species={species} atlas={atlas} day={day} weather={weather} ground={position?.[1] ?? 0} />
    </Model>
  );
}
