// The baked city, streamed by the camera (world/SOP.md §8): each tile in assets/world/<slice>/ drawn at the level of
// detail its distance asks for (world/budgets.ts), its four materials re-covered with the world shaders and the shot's
// weather. A tile that is too far is not drawn at all, so a shot only loads what it sees.
import { staticFile } from "raea";
import { Instances, Model, surfaceShader } from "raea/3d";
import { ROOMS_LAYER_FILES, windowTileWgsl } from "../../interiors/draw/window";
import { SIGN_GLYPH_WGSL } from "../../interiors/signs/layout";
import { PointLight } from "raea/light";
import { Transform } from "raea/transform";
import propsData from "../../assets/world/friedrichstadt/props.json";
import foliageData from "../../assets/foliage/species.json";
import { CITY, TreeCovers } from "../foliage/Tree";
import { useMemo } from "react";
import { CELL_M, LOD_RANGE, lodFor, type Lod } from "../../world/budgets";
import { boxDistance, detailList, drawList, heldLevels, type Box, type StreamState, type StreamTile } from "../../world/stream";
import index from "../../assets/world/friedrichstadt/index.json";
import { FACADE, GLASS, GROUND, NO_CLIP, WATER, worldUniforms } from "./shaders";

type V3 = [number, number, number];
type Tile = { tile: string; bbox: number[]; center: V3; lods: { lod: Lod; bytes: number }[]; rail?: boolean };
export const TILES = (index as { tiles: Tile[] }).tiles;
const ORIGIN = [391000, 5819000];

/** Scene frame to EPSG:25833. */
export const toMap = (p: V3): [number, number] => [p[0] + ORIGIN[0], -p[2] + ORIGIN[1]];
/** EPSG:25833 (and a height) to the scene frame. */
export const toScene = (e: number, n: number, h: number): V3 => [e - ORIGIN[0], h, -(n - ORIGIN[1])];

/** Each tile's level for a camera at `eye`, or null when beyond every range. `bias` scales the distances (a scope
 *  or a hero shot draws finer further out: 0.5 halves every distance). */
export function tileLods(eye: V3, bias = 1, maxLod: Lod = 2): { tile: string; lod: Lod }[] {
  const [e, n] = toMap(eye);
  const out: { tile: string; lod: Lod }[] = [];
  for (const t of TILES) {
    const [x0, y0, x1, y1] = t.bbox;
    const dx = Math.max(x0 - e, 0, e - x1), dy = Math.max(y0 - n, 0, n - y1);
    const d = Math.hypot(dx, dy) * bias;
    const want = lodFor(d, null);
    if (want === null || want > maxLod) continue;
    // a tile baked without its finest level (bake.ts --lod0) draws its next one
    const have = t.lods.map((l) => l.lod).filter((l) => l >= want);
    if (have.length) out.push({ tile: t.tile, lod: Math.min(...have) as Lod });
  }
  return out;
}

/** The cross-fade between a tile's levels with `levels="detail"`: this share of the distance, half either side. */
const FADE = 0.1;
/** A level is held this share of each edge's distance past it (stream.ts heldLevels): twice the fade's half-band, so it
 *  is there before raea starts to draw it (loaded, live) and kept until raea has faded it out. */
const HOLD = FADE;
/** Each tile's box for `levels="detail"` (scene frame): its map box, from 3 m under its ground to 30 m over it. raea
 *  measures every level of the tile, and its Stadtbahn detail, to this box (Detail's box), and the levels are held by
 *  the same distance (boxDistance), so a tile's levels switch at one distance and a level is held wherever raea draws
 *  it. Measured to their meshes, they didn't: a level's buildings overhang its tile by up to 100 m, and each level
 *  reaches differently, so on 11-17's fly a tile's LOD2 faded out to the sky with LOD1 not yet held (frame 35). */
const BOXES = new Map(TILES.map((t): [string, Box] => {
  const [x0, y0, x1, y1] = t.bbox as [number, number, number, number], g = t.center[1];
  return [t.tile, [x0 - ORIGIN[0], g - 3, -(y1 - ORIGIN[1]), x1 - ORIGIN[0], g + 30, -(y0 - ORIGIN[1])]];
}));
/** Each tile's levels for `levels="detail"` (docs/realism.feature LT21), each with the distances raea draws it between
 *  (raea-sys-lod's Detail, to the tile's box): a level ends where the next one starts, at LOD_RANGE's upper ends over
 *  `bias`. A tile holds two levels only around the band where they cross. */
export function tileDetail(eye: V3, bias = 1, maxLod: Lod = 2): { tile: string; lod: Lod; near: number; far: number }[] {
  const ends = [LOD_RANGE[0][1], LOD_RANGE[1][1], LOD_RANGE[2][1]].map((d) => d / bias);
  return TILES.flatMap((t) => heldLevels(t.tile, boxDistance(eye, BOXES.get(t.tile)!), t.lods.map((l) => l.lod).filter((l) => l <= maxLod).sort((a, b) => a - b), ends, HOLD));
}

/** The shot's light and weather: the world shaders' (worldUniforms) and the street lamps'. gasNits/arcNits are the
 *  glazing's glow (cd/m2 against the scene's light); lampsLit is the share of gas lanterns burning (wartime: fewer,
 *  catalogue light-dimmed); lights is how many of the nearest burning lamps also light the street. */
/** `day`: the day of the year (1-365) the trees are drawn on. Set, each tree prop is its 1917 species with that day's
 *  leaves, flowers or bare twigs (components/foliage); unset, the bare limes of tools/world/trees.ts. */
export type CityLook = Parameters<typeof worldUniforms>[0] & { gasNits?: number; arcNits?: number; lampsLit?: number; lights?: number; hour?: number; day?: number };

/** The tiles the Stadtbahn crosses: their detail (bake.ts, tools/world/stadtbahn.ts) drawn with them at LOD0-1 */
const RAIL = new Set(TILES.filter((t) => t.rail).map((t) => t.tile));

/** The city around `eye`. `clip` cuts it for a section (shaders.ts clipPlane): every tile surface and street prop on
 *  the plane's far side from the city kept is left out. The shadow pass doesn't run the clip, so a cut city's tiles
 *  would still shade what's under them (the street over a section's cut face): `shadow` false stops them casting.
 *  `stream` (world/stream.ts) draws what the streamer holds (live play, or a render's streamAt) in place of every tile
 *  at its distance's level: tiles loaded at most two a frame and kept past their range. `levels="detail"` (no `only`;
 *  the default with a `stream`) holds each tile's levels for its distance (tileDetail, or the stream's detailList) and
 *  lets raea pick the level every frame, cross-faded, by the distance to the tile's box: React commits only when a
 *  level is taken up or let go, not every frame the camera moves. `levels="lods"` (the default without one) picks one
 *  level a tile in JS (tileLods, or the stream's drawList), switching in a frame. */
export function City({ eye, look, bias = 1, maxLod = 2, only, clip = NO_CLIP, shadow = true, stream, extra = [], levels: asked }: { eye: V3; look: CityLook; bias?: number; maxLod?: Lod; only?: Lod; clip?: number[]; shadow?: boolean; stream?: StreamState; extra?: string[]; levels?: "lods" | "detail" }) {
  // the materials made once for a look (callers pass look inline, so by its value): every tile's Model gets the same
  // elements, and React skips them, instead of each tile re-serializing six shaders every frame a camera moves
  const mats = useMemo(() => materials(look, clip), [JSON.stringify([look, clip])]);
  const levels = asked ?? (stream ? "detail" : "lods");
  // detail, streamed: the stream's tiles at their levels, and both levels inside a fade band (stream.ts detailList)
  const held = levels !== "detail" || only !== undefined ? null : stream ? detailList(stream, TILES as unknown as StreamTile[], (t) => boxDistance(eye, BOXES.get(t.tile)!), [LOD_RANGE[0][1], LOD_RANGE[1][1], LOD_RANGE[2][1]].map((d) => d / bias), HOLD, maxLod) : tileDetail(eye, bias, maxLod);
  const heldKey = held && JSON.stringify(held);
  const detailed = useMemo(() => held && <DetailTiles held={held} mats={mats} shadow={shadow} railFar={LOD_RANGE[1][1] / bias} />, [heldKey, mats, shadow, bias]);
  return (
    <>
      {detailed ?? (stream ? drawList(stream) : tileLods(eye, bias, maxLod)).map(({ tile, lod: l }) => {
        const lod = only ?? l;
        return [
          <Model key={`${tile}-${lod}`} name={`tile-${tile}-lod${lod}`} src={staticFile(`world/friedrichstadt/${tile}/lod${lod}.glb`)} shadow={shadow}>
            {mats}
          </Model>,
          RAIL.has(tile) && lod <= 1 ? (
            <Model key={`${tile}-rail`} name={`tile-${tile}-rail`} src={staticFile(`world/friedrichstadt/${tile}/stadtbahn.glb`)} shadow={shadow}>
              {mats}
            </Model>
          ) : null,
        ];
      })}
      {/* the landmarks' towers, domes and spires (bake.ts skyline, tools/world/landmarks.ts), drawn at every distance:
          the city's silhouette when their tiles are out of range */}
      <Model name="skyline" src={staticFile("world/friedrichstadt/skyline.glb")} shadow={shadow}>
        {mats}
      </Model>
      {/* the Stadtbahn's brick, girders and the station hall's shell (tools/world/stadtbahn.ts), and the Spree crossing
          at Friedrichstraße as it stood in 1917 (tools/world/bridges.ts), drawn at every distance like the skyline */}
      <Model name="stadtbahn" src={staticFile("world/friedrichstadt/stadtbahn.glb")} shadow={shadow}>
        {mats}
      </Model>
      <Model name="bridges" src={staticFile("world/friedrichstadt/bridges.glb")} shadow={shadow}>
        {mats}
      </Model>
      {/* whole-slice meshes drawn at every distance, by name (assets/world/friedrichstadt/NAME.glb): "stadtbahn"
          (tools/world/stadtbahn.ts) while it is looked at before it joins the bake */}
      {extra.map((name) => (
        <Model key={name} name={name} src={staticFile(`world/friedrichstadt/${name}.glb`)} shadow={shadow}>
          {mats}
        </Model>
      ))}
      <Props eye={eye} look={look} clip={clip} />
    </>
  );
}

/** `levels="detail"`'s tiles: each held level with its Detail, and the Stadtbahn's detail with a tile held at LOD0-1 */
function DetailTiles({ held, mats, shadow, railFar }: { held: ReturnType<typeof tileDetail>; mats: ReturnType<typeof materials>; shadow: boolean; railFar: number }) {
  const rails = [...new Set(held.filter((t) => t.lod <= 1 && RAIL.has(t.tile)).map((t) => t.tile))];
  return (
    <>
      {held.map(({ tile, lod, near, far }) => (
        <Model key={`${tile}-${lod}`} name={`tile-${tile}-lod${lod}`} src={staticFile(`world/friedrichstadt/${tile}/lod${lod}.glb`)} shadow={shadow} detail={{ near, far, edge: true, fade: FADE, box: BOXES.get(tile) }}>
          {mats}
        </Model>
      ))}
      {rails.map((tile) => (
        <Model key={`${tile}-rail`} name={`tile-${tile}-rail`} src={staticFile(`world/friedrichstadt/${tile}/stadtbahn.glb`)} shadow={shadow} detail={{ far: railFar, edge: true, fade: FADE, box: BOXES.get(tile) }}>
          {mats}
        </Model>
      ))}
    </>
  );
}

/** The tiles' materials for a look: the world shaders over each glTF material, by name. */
function materials(look: CityLook, clip: number[]) {
  const u = worldUniforms(look, clip);
  return (
    <>
      <Recover material="facade" wesl={FACADE} uniforms={u.facade} />
      <Recover material="glass" wesl={GLASS} uniforms={u.glass} />
      {/* the room and shop panes (bake.ts "rooms": uv pane-local from the sill, colour = facade.ts paneColor): raea-fb's
          interior mapping, a room or a shop's display behind each pane, lit by its own hours at the shot's clock */}
      <Recover material="rooms" wesl={ROOMS_WGSL} uniforms={{ ...roomUniforms(look), clip }} textures={{ rooms: { layers: ROOMS_LAYER_FILES.map((f) => staticFile(f)) } }} />
      {/* the shop signs' letters (bake.ts "signs", LOD0): raea-fb's font atlas, alpha-tested, gilt or painted */}
      <Recover material="signs" wesl={SIGNS_WGSL} uniforms={{ clip }} textures={{ font: { src: staticFile("signs/font.png") } }} />
      <Recover material="ground" wesl={GROUND} uniforms={u.ground} />
      <Recover material="water" wesl={WATER} uniforms={u.water} />
    </>
  );
}

const PROPS = (propsData as { props: Record<string, number[][]> }).props;
/** How far each kind of prop is drawn, metres (a burning lamp is a point of light from far off). */
const PROP_RANGE: Record<string, number> = { "gas-lantern": 800, "arc-lamp": 1000, litfass: 350, pump: 250, manhole: 120 };
/** The courts' props (bake.ts dressCourt, raea-fb's interiors/yard.ts), each a kit id with its glb in world/props/ once
 *  raea-fb exports it: listed here as each lands. Drawn within 150 m: a court reads from close or from above. */
const COURT_PROPS: string[] = ["carpet-rack", "dust-chest", "court-pump", "washing-posts", "handcart", "coal-sacks", "snow-bank", "cellar-neck", "house-rules"];
for (const k of COURT_PROPS) PROP_RANGE[k] = 150;
/** The trees (bake.ts from the map lane's trees layer; tools/world/trees.ts's bare limes): a crown of twigs reads as
 *  haze from far off, so 600 m */
const TREE_PROPS = ["lime-bare-0", "lime-bare-1", "lime-bare-2"];
for (const k of TREE_PROPS) PROP_RANGE[k] = 600;
/** The same tree props by species once a look has a `day` (raea-sys-foliage, components/foliage): each one's 1917
 *  species, grown variant and size from assets/foliage/species.json (tools/foliage/props-species.ts), a prop it has no
 *  row for a lime of its own size. Drawn at three levels by distance from the camera's cell (ASSUMED bands, metres):
 *  l0 16,000 leaves, l1 4,000 on pruned twigs, l2 1,000 on the main limbs (tools/foliage/lods.json). */
const FOLIAGE = foliageData as { grown: Record<string, [number, number]>; trees: Record<string, [string, number, number, number, number]> };
const TREE_BANDS: [string, number][] = [["l0", 60], ["l1", 250], ["l2", 1200]];
type Inst = { position: V3; rotation: V3; scale: number | V3 };

/** The street's props near the camera, as instances, and the nearest burning lamps as lights: picked from the centre
 *  of the camera's 64 m cell (CELL_M), not the eye, so a camera moving inside a cell commits nothing for them. The
 *  cell is the eye rounded, with no hysteresis, so a frame's props don't depend on the frames before it (a render
 *  that jumps to a frame draws what play does); the ranges are 120-1000 m, so a cell's 45 m slop doesn't show. */
export function Props({ eye, look, clip = NO_CLIP }: { eye: V3; look: CityLook; clip?: number[] }) {
  const cell: V3 = [Math.round(eye[0] / CELL_M) * CELL_M, eye[1], Math.round(eye[2] / CELL_M) * CELL_M];
  return useMemo(() => <PropsAt eye={cell} look={look} clip={clip} />, [JSON.stringify([cell[0], cell[2], look, clip])]);
}

function PropsAt({ eye, look, clip }: { eye: V3; look: CityLook; clip: number[] }) {
  const lit = look.lampsLit ?? 0;
  const kept = (p: number[]) => p[0] * clip[0] + p[1] * clip[1] + p[2] * clip[2] <= clip[3] - 0.5;
  const near = (kind: string) => PROPS[kind].filter((p) => Math.hypot(p[0] - eye[0], p[2] - eye[2]) < PROP_RANGE[kind] && kept(p));
  // A video's Instances keeps one count for the whole shot, but a moving camera brings props into range and drops
  // others. So each group is padded with hidden copies (scale 1e-4, 200 m under the street; Instances refuses 0) up to the next multiple of 64. The bucket goes into
  // its key, so a group whose bucket changes is a new node, which happens rarely.
  const pad = (l: Inst[]) => {
    const list = [...l];
    const want = Math.max(64, Math.ceil(list.length / 64) * 64), far = list[0]?.position ?? ([0, -500, 0] as V3);
    while (list.length < want) list.push({ position: [far[0], far[1] - 200, far[2]], rotation: [0, 0, 0], scale: 1e-4 });
    return list;
  };
  const at = (l: number[][]) => pad(l.map((p) => ({ position: [p[0], p[1], p[2]] as V3, rotation: [0, p[3], 0] as V3, scale: p[4] })));
  // with a day, the trees by species, variant and level, each scaled from its grown size to its own (crown width
  // across, height up)
  const day = look.day;
  const trees = new Map<string, { species: string; list: Inst[] }>();
  if (day !== undefined) {
    for (const k of TREE_PROPS) {
      for (const p of PROPS[k] ?? []) {
        const band = TREE_BANDS.find(([, r]) => Math.hypot(p[0] - eye[0], p[2] - eye[2]) < r)?.[0];
        if (!band || !kept(p)) continue;
        const [species, v, w, h] = FOLIAGE.trees[`${p[0]},${p[2]}`] ?? ["lime", p[5], p[4] * 13.5, p[4] * 13.5 * 1.39];
        const [gw, gh] = FOLIAGE.grown[`${species}-${v}`];
        const id = `${species}-${v}-${band}`;
        (trees.get(id) ?? trees.set(id, { species, list: [] }).get(id)!).list.push({ position: [p[0], p[1], p[2]], rotation: [0, p[3], 0], scale: [w / gw, h / gh, w / gw] });
      }
    }
  }
  const weather = { wet: look.wet, snow: look.snow, soot: look.soot, algae: CITY.algae };
  const gas = near("gas-lantern"), arcs = near("arc-lamp");
  const gasOn = gas.filter((p) => p[5] < lit), gasOff = gas.filter((p) => p[5] >= lit);
  const groups: { kind: string; list: number[][]; glow?: { hex: string; nits: number } }[] = [
    { kind: "gas-lantern", list: gasOn, glow: { hex: "#ff9a48", nits: look.gasNits ?? 900 } },
    { kind: "gas-lantern", list: gasOff, glow: { hex: "#2a2a28", nits: 0 } },
    { kind: "arc-lamp", list: arcs, glow: { hex: "#dfe8ff", nits: lit > 0 ? (look.arcNits ?? 2600) : 0 } },
    { kind: "litfass", list: near("litfass") },
    { kind: "pump", list: near("pump") },
    { kind: "manhole", list: near("manhole") },
    ...[...COURT_PROPS, ...(day === undefined ? TREE_PROPS : [])].filter((k) => PROPS[k]).map((k) => ({ kind: k, list: near(k) })),
  ];
  // the nearest burning lamps light the street: a gas lantern's mantles ~1,500 lm at 2,000 K; an arc lamp ~10,000 lm
  const burning = [...gasOn.map((p) => ({ p, arc: false })), ...(lit > 0 ? arcs.map((p) => ({ p, arc: true })) : [])]
    .sort((a, b) => Math.hypot(a.p[0] - eye[0], a.p[2] - eye[2]) - Math.hypot(b.p[0] - eye[0], b.p[2] - eye[2]))
    .slice(0, look.lights ?? 0);
  return (
    <>
      {groups.filter((g) => g.list.length).map((g, i) => (
        <Instances key={`${g.kind}-${i}-${Math.ceil(g.list.length / 64)}`} name={`props-${g.kind}-${i}-${Math.ceil(g.list.length / 64)}`} src={staticFile(`world/props/${g.kind}.glb`)} at={at(g.list)}>
          {g.glow ? <Cover props={{ material: "lamp", emissive: g.glow.hex, emissive_nits: g.glow.nits }} /> : null}
        </Instances>
      ))}
      {day !== undefined
        ? [...trees].map(([id, g]) => (
            <Instances key={`tree-${id}-${Math.ceil(g.list.length / 64)}`} name={`trees-${id}-${Math.ceil(g.list.length / 64)}`} src={staticFile(`foliage/tree-${id}.glb`)} at={pad(g.list)}>
              <TreeCovers species={g.species} atlas={staticFile(`foliage/tree-${id.replace(/-l\d$/, "-l0")}-atlas.png`)} day={day} weather={weather} />
            </Instances>
          ))
        : null}
      {burning.map(({ p, arc }, i) => {
        // the light sits in the lantern (3.4 m up) or the arc globe (7.2 m up, 1.6 m out over the street)
        const pos: V3 = arc ? [p[0] + Math.sin(p[3]) * 1.62, p[1] + 7.2, p[2] + Math.cos(p[3]) * 1.62] : [p[0], p[1] + 3.4, p[2]];
        return <PointLight key={`lamp-${i}`} transform={Transform.fromXyz(...pos)} intensity={arc ? 10000 : 1500} range={arc ? 45 : 22} radius={arc ? 0.25 : 0.12} color={arc ? "#e4ecff" : "#ffad5c"} />;
      })}
    </>
  );
}

/** Any of a Model's or Instances' glTF materials re-covered (colour, emissive, finish), by name. */
function Cover({ props }: { props: Record<string, unknown> }) {
  return <div data-3d="MeshStandardMaterial" data-props={JSON.stringify(props)} />;
}

/** A Model's glTF material re-covered with a WESL surface shader. raea/3d exports no MeshStandardMaterial and
 *  <Refinish> drops `shader` (runtime/look surface_spec), so this writes the scene node the Model reads its
 *  material children from (runtime/scene "Model": MeshStandardMaterial kids with `shader`). */
function Recover({ material, wesl, uniforms, textures }: { material: string; wesl: string; uniforms: Record<string, number | number[]>; textures?: Record<string, { src: string; layers?: number } | { layers: string[] }> }) {
  const props = { material, shader: surfaceShader("MeshStandardMaterial", { wesl, uniforms, ...(textures ? { textures } : {}) }) };
  return <div data-3d="MeshStandardMaterial" data-props={JSON.stringify(props)} />;
}

/** The window shader's clock and glow for a look: the shot's hour (17:00, dusk, by default) held still
 *  (rate 0), a lit room as bright as the facade shader's lit glazing, a dark one a hundredth of that, a daytime pane
 *  a fourteenth (raea-fb's ratios in compositions/interior-windows.tsx). */
function roomUniforms(look: CityLook) {
  const lit = 0.5 * look.lamp * look.nits * 0.66; // rationed coal and gas: a lit room is a lamp, not a blaze (0.66: the far panes keep their amber under AgX)
  // the room panes reflect sky and street as the facade's glazing does (raea-fb's windowTileWgsl `reflect`)
  return { hour: look.hour ?? 17, rate: 0, glow_lit: lit, glow_dark: lit * 0.0092, glow_day: lit * 0.07, sky_top: [...look.skyTop, 1], sky_hor: [...look.skyHor, 1], nits: look.nits };
}
// raea-fb's room shader, wrapped so a section's cut (the clip uniform) drops its panes with the facades round them
const ROOMS_WGSL = windowTileWgsl({ displays: true, reflect: true }).replace("fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {", "fn surface_room(in: VertexOutput, pbr: ptr<function, PbrInput>) {") + `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; }
  surface_room(in, pbr);
}
`;

// a sign's letter: the atlas's coverage under a half is board, not letter; gold leaf (alpha 0) is metal, paint isn't
const SIGNS_WGSL = SIGN_GLYPH_WGSL + /* wgsl */ `
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  if (dot(in.world_position.xyz, u_clip().xyz) > u_clip().w) { discard; }
  if (sign_coverage(in.uv) < 0.5) { discard; }
  let gilt = in.color.a < 0.5;
  (*pbr).material.base_color = vec4<f32>(in.color.rgb, 1.0);
  (*pbr).material.metallic = select(0.0, 0.9, gilt);
  (*pbr).material.perceptual_roughness = select(0.55, 0.3, gilt);
}
`;

export { LOD_RANGE };
