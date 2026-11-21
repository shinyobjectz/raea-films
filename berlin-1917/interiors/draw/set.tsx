// Draws an interior set: each room's shell as one mesh per material, every prop as GPU instances (one per prop part,
// across all its placements), the props' own lights, the light from outside, one fog volume. Render equals play: the
// same rows a game streams in by portal (interiors/SYSTEM.md).
import { staticFile, useCurrentFrame } from "raea";
import { FogVolume, Instances, VolumetricFog } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba, Srgba } from "raea/color";
import { AmbientLight, DirectionalLight, PointLight, RectLight, SpotLight } from "raea/light";
import { Cuboid, Mesh3d, Plane3d, Sphere } from "raea/mesh";
import { ExtendedMaterial, ProceduralExtension, ShaderExtension, StandardMaterial } from "raea/pbr";
import { PROC, WEAR, type Wear } from "../kit/proc";
import { Bloom, ToneMapping } from "raea/post_process";
import { Quat, Transform } from "raea/transform";
import type { Solid } from "raea/3d";
import { hash } from "../kit/geo";
import { type Mat as MatDef, MATS, type MatId } from "../kit/mats";
import { get, type Prop } from "../kit/prop";
import { KITS } from "../kits";
export { KITS };
import { shell } from "../shell";
import { toSet, type Cam, type Set } from "../sets/types";
import { ATLAS } from "../atlas";
import { ROOMS_LAYER_FILES, standInPanes, WINDOW_WGSL, type StandPane } from "./window";

/** Real lumens to the engine's: Bevy's default exposure wants about 900,000 lm for daylight at 3 m. */
export const LUM = 1800;

/** `dark`: a glowing material (a flame, a mantle, a lit shade) on a placement whose light is off draws without its
 *  glow, so an unlit lamp throws nothing into a traced room (the GI reads emissive surfaces) */
export function Mat({ id, wear, dark }: { id: MatId; wear?: Wear; dark?: boolean }) {
  const m = MATS[id] as MatDef;
  const base = m.alpha !== undefined ? Srgba.hex(m.color).with_alpha(m.alpha) : m.color;
  const p = PROC[id];
  const std = (
    <StandardMaterial
      base_color={base}
      perceptual_roughness={m.rough}
      metallic={m.metal ?? 0}
      {...(m.reflect !== undefined ? { reflectance: m.reflect } : {})}
      {...(m.coat ? { clearcoat: m.coat, clearcoat_perceptual_roughness: m.coatRough ?? 0.2 } : {})}
      {...(m.alpha !== undefined ? { alpha_mode: "Blend" as const, double_sided: true, cull_mode: null } : {})}
      {...(m.glow && !dark ? { emissive: LinearRgba.from(Srgba.hex(m.glow)).mul(m.glowMul ?? 1) } : {})}
    />
  );
  if (!p || m.alpha !== undefined || m.glow) return std;
  // a material's own wear (outdoor paint: road mud low, soot on roofs) over the set's
  const w = { ...(wear ?? WEAR.interior), ...p.wear };
  return (
    <ExtendedMaterial base={std} extension={<ProceduralExtension pattern={p.pattern} colors={p.colors ?? [m.color, m.color]} scale={p.scale} bump={p.bump ?? 0.3} tile={p.tile} gap={p.gap} gap_color={p.gap_color} rough_a={p.rough?.[0] ?? m.rough} rough_b={p.rough?.[1] ?? Math.min(1, m.rough + 0.05)} dust={w.dust} dirt={w.dirt} edges={w.edges} dust_color={p.dust_color ?? "#8a8070"} dirt_color={p.dirt_color ?? "#2a2218"} seed={p.seed ?? 7} />} />
  );
}

type Built = { shells: { key: string; mat: MatId; solid: Solid; at: [number, number, number]; yaw: number }[]; groups: Map<string, { prop: Prop; at: { position: [number, number, number]; rotation: [number, number, number]; scale: number }[]; dark?: boolean }>; glows: { key: string; at: [number, number, number]; body: [number, number, number]; lumens: number; color: string; range: number; shadow: boolean; flicker: number; fill: boolean; noShadow: boolean }[] };
const cache = new Map<string, Built>();

export function build(set: Set): Built {
  const have = cache.get(set.id);
  if (have) return have;
  const out: Built = { shells: [], groups: new Map(), glows: [] };
  for (const r of set.rooms) {
    shell(r.shell).forEach((p, i) => out.shells.push({ key: `${r.id}-${p.mat}-${i}`, mat: p.mat, solid: p.solid, at: r.at, yaw: r.yaw ?? 0 }));
    for (const pl of r.props) {
      const prop = get(pl.prop);
      const yaw = (r.yaw ?? 0) + (pl.yaw ?? 0), s = pl.scale ?? 1;
      if (!pl.ghost) {
        // a placement whose light is off, of a prop with a glowing part, is its own group drawn without the glow
        const dark = pl.lit === false && prop.parts.some((q) => !!(MATS[q.mat] as { glow?: string }).glow), key = dark ? `${pl.prop}-unlit` : pl.prop;
        const g = out.groups.get(key) ?? { prop, at: [], dark };
        g.at.push({ position: toSet(r, pl.at), rotation: [0, yaw, 0], scale: s });
        out.groups.set(key, g);
      }
      if (prop.glow && pl.lit !== false)
        for (const [k, gl] of prop.glow.entries()) {
          const c = Math.cos(yaw), sn = Math.sin(yaw);
          const at = (q: readonly number[]): [number, number, number] => toSet(r, [pl.at[0] + (c * q[0] + sn * q[2]) * s, pl.at[1] + q[1] * s, pl.at[2] + (-sn * q[0] + c * q[2]) * s]);
          out.glows.push({ key: `${pl.name ?? pl.prop}-${r.id}-${k}-${out.glows.length}`, at: at(gl.at), body: at(gl.body ?? gl.at), lumens: gl.lumens, color: gl.color, range: gl.range, shadow: !!gl.shadow, flicker: gl.flicker ?? 0, fill: !!gl.fill, noShadow: gl.shadow === false });
        }
    }
  }
  cache.set(set.id, out);
  return out;
}

export function SetView({ set, cam, exposure = 0, shadows = 2 }: { set: Set; cam: Cam; exposure?: number; shadows?: number }) {
  return (
    <>
      <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.at)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 200 } }} />
      <AmbientLight brightness={set.ambient.brightness} color={set.ambient.color} />
      {cam.lamp ? <PointLight name="hand-lamp" transform={Transform.fromXyz(cam.eye[0], cam.eye[1] - 0.25, cam.eye[2]).lookingAt(cam.at)} intensity={cam.lamp * LUM} range={12} radius={0.02} color="#ffe2b0" shadow_maps_enabled /> : null}
      <SetRooms set={set} shadows={shadows} standIns />
      {set.fog && <VolumetricFog ambient={0.02} ambientColor="#2a2a30" />}
      <Bloom intensity={0.12} />
      <ToneMapping mode="agx" exposure={set.exposure + exposure + (cam.ev ?? 0)} />
    </>
  );
}

/** The set's lights as bodies Solari can trace (FP-LAB, 11-17): bevy_solari 0.20 samples only directional lights,
 *  emissive meshes and an environment's sun (docs/raytracing.feature RT3, RT6), so under <SolariLighting> a lamp's
 *  PointLight and a sky panel's RectLight lit nothing, and the kitchen drew black. Each lamp (a fill left out: its bounce
 *  is traced now) gets a small emissive bulb, and each sky panel (a bounce stand-in left out) an emissive sheet facing
 *  its look, at the luminance their lumens give: a sphere of radius r, L = flux / (4 pi^2 r^2); a one-sided sheet of area
 *  A, L = flux / (pi A). The raster lights stay for the raster-lit (a <Character>'s skin, RT5). */
const BULB_R = 0.02; // a 1917 carbon or tungsten lamp's glowing part, about a bulb's size (ASSUMED)
function TracedLights({ set, glows, origin, standIns }: { set: Set; glows: Built["glows"]; origin: [number, number, number]; standIns: boolean }) {
  const o = (p: readonly number[]): [number, number, number] => [p[0] + origin[0], p[1] + origin[1], p[2] + origin[2]];
  const lit = (c: string, nits: number) => LinearRgba.from(Srgba.hex(c)).mul(nits);
  return (
    <>
      {glows.filter((g) => !g.fill).map((g) => (
        <Mesh3d key={`bulb-${g.key}`} name={`bulb-${g.key}`} transform={Transform.fromXyz(...o(g.body))}>
          <Sphere radius={BULB_R} />
          <StandardMaterial base_color="#000000" emissive={lit(g.color, (g.lumens * LUM) / (4 * Math.PI * Math.PI * BULB_R * BULB_R))} />
        </Mesh3d>
      ))}
      {standIns && (set.sky ?? []).filter((s) => !s.bounce).map((s, i) => (
        <Mesh3d key={`skysheet-${i}`} name={`skysheet-${i}`} transform={Transform.fromXyz(...o(s.at)).lookingAt(o(s.look))}>
          <Plane3d normal={[0, 0, -1]} half_size={[s.w / 2, s.h / 2]} />
          <StandardMaterial base_color="#000000" emissive={lit(s.color, (s.lumens * LUM) / (Math.PI * s.w * s.h))} />
        </Mesh3d>
      ))}
    </>
  );
}

/** A set's rooms for someone else's shot: shells, props and the props' own lights (lamps, candles, the range's fire),
 *  moved to `origin`; no camera, ambient or tone mapping. `standIns` adds the set's sun, sky panels and outside lights,
 *  which stand in for a world that isn't there; leave them off inside the city. The set's fog volume comes along (the
 *  shot's camera needs a <VolumetricFog> for it to show). */
/** `shells={false}` draws the props and their lights only (the walkable city: the house's GLB has the walls); `glows`
 *  caps the props' lights at the brightest few (a whole house of lamps is too many lights for one view). */
export function SetRooms({ set, origin = [0, 0, 0], shadows = 2, standIns = false, traced = false, shells = true, glows }: { set: Set; origin?: [number, number, number]; shadows?: number; standIns?: boolean; traced?: boolean; shells?: boolean; glows?: number }) {
  const f = useCurrentFrame();
  const b = build(set);
  if (glows !== undefined) b.glows = b.glows.sort((a, z) => z.lumens - a.lumens).slice(0, glows);
  const o = (p: readonly number[]): [number, number, number] => [p[0] + origin[0], p[1] + origin[1], p[2] + origin[2]];
  // the brightest lamps cast shadows, but never a fill or a glow that says shadow: false (a chandelier: one point under its
  // shades drew blades of shadow on the ceiling that its bulbs, one in each shade, never would)
  const shadowed = b.glows.filter((g) => !g.fill && !g.noShadow).sort((a, z) => z.lumens - a.lumens).slice(0, shadows).map((g) => g.key);
  return (
    <>
      {shells && b.shells.map((s) => (
        <Mesh3d key={s.key} name={`shell-${s.key}`} shape={s.solid} transform={Transform.fromXyz(...o(s.at)).withRotation(Quat.fromEuler("XYZ", 0, s.yaw, 0))}>
          <Mat id={s.mat} wear={set.wear} />
        </Mesh3d>
      ))}
      {[...b.groups.entries()].flatMap(([id, g]) =>
        // one mesh per placement and part: instances can't take the procedural materials, and Bevy batches the copies
        // that share a mesh and a material anyway; a bake merges the static ones per material (SYSTEM.md)
        g.at.flatMap((a, k) =>
          g.prop.parts.map((p, i) => (
            <Mesh3d key={`${id}-${k}-${i}`} name={`prop-${id}-${k}-${i}`} shape={p.solid} allowOverlap={p.overlap} transform={Transform.fromXyz(...o(a.position)).withRotation(Quat.fromEuler("XYZ", 0, a.rotation[1], 0)).withScale([a.scale, a.scale, a.scale])}>
              <Mat id={p.mat} wear={set.wear} dark={g.dark} />
            </Mesh3d>
          )),
        ),
      )}
      {b.glows.map((g) => {
        const fl = g.flicker ? 1 - g.flicker * (0.5 + 0.5 * Math.sin(f * 0.9 + hash(g.at[0]) * 9) * Math.sin(f * 0.37 + 1.3)) : 1;
        return <PointLight key={g.key} name={`glow-${g.key}`} volumetric={!!set.fog && shadowed.includes(g.key)} transform={Transform.fromXyz(...o(g.at))} intensity={g.lumens * LUM * fl} range={g.range} radius={0.01} color={g.color} shadow_maps_enabled={shadowed.includes(g.key)} soft_shadows_enabled={shadowed.includes(g.key)} />;
      })}
      {traced && <TracedLights set={set} glows={b.glows} origin={origin} standIns={standIns} />}
      {/* a court's far walls: each window a room from the atlas, the lit ones throwing their lamplight into the court */}
      {/* the neighbours behind a stand-in court's walls, as far as the sun is concerned: a slab outside each standing wall, so a
          low sun doesn't stream through the window holes (the panes cover them but cast no shadow) */}
      {set.windows && set.rooms.filter((r) => r.panes).flatMap((r) => massesBehind(r, origin))}
      {set.windows && set.rooms.filter((r) => r.panes).flatMap((r) => standInPanes(r, set.windows!, origin)).flatMap((p) => [
        <Mesh3d key={p.key} name={p.key} transform={Transform.fromXyz(...p.at).withRotation(Quat.fromEuler("XYZ", 0, p.yaw, 0))}>
          <Plane3d normal={[0, 0, 1]} half_size={[p.w / 2, p.h / 2]} />
          <ExtendedMaterial
            base={<StandardMaterial base_color="#050506" perceptual_roughness={0.06} reflectance={0.5} opaque_render_method="Forward" />}
            extension={<ShaderExtension wgsl={WINDOW_WGSL} uniforms={{ room: p.u.room, size: p.u.size, cam_y: p.u.cam_y, sill: p.u.sill, pane: p.u.pane, center: p.at, glow: p.u.glow, flip: p.u.flip, lace: p.u.lace, tint: p.u.tint }} textures={{ rooms: { layers: ROOMS_LAYER_FILES.map((f) => staticFile(f)) } }} />}
          />
        </Mesh3d>,
        ...(p.lit ? [<RectLight key={`${p.key}-light`} name={`${p.key}-light`} transform={Transform.fromXyz(...out(p, 0.16)).lookingAt(out(p, 3))} intensity={set.windows!.lumens * LUM} width={p.w} height={p.h} color="#ffc98a" />] : []),
      ])}
      {standIns && set.sun ? <DirectionalLight transform={Transform.fromXyz(set.sun.at[0] + set.sun.from[0], set.sun.at[1] + set.sun.from[1], set.sun.at[2] + set.sun.from[2]).lookingAt(set.sun.at)} illuminance={set.sun.lux} color={set.sun.color} shadow_maps_enabled /> : null}
      {standIns && (set.sky ?? []).map((s, i) => <RectLight key={`sky-${i}`} name={`sky-${i}`} transform={Transform.fromXyz(...s.at).lookingAt(s.look)} intensity={s.lumens * LUM} width={s.w} height={s.h} color={s.color} />)}
      {standIns && (set.outside ?? []).map((o, i) =>
        o.kind === "spot" ? (
          <SpotLight key={`out-${i}`} name={`outside-${i}`} transform={Transform.fromXyz(...o.at).lookingAt(o.look)} intensity={o.lumens * LUM} range={14} outer_angle={0.75} inner_angle={0.3} color={o.color} shadow_maps_enabled volumetric />
        ) : (
          <PointLight key={`out-${i}`} name={`outside-${i}`} transform={Transform.fromXyz(...o.at)} intensity={o.lumens * LUM} range={10} color={o.color} />
        ),
      )}
      {set.fog && (
        <>
          <FogVolume name="air" position={o(set.fog.at)} scale={set.fog.size} density={set.fog.density} color={set.fog.color} scattering={0.4} absorption={0.2} anisotropy={0.5} />
        </>
      )}
    </>
  );
}

/** A point `d` metres out from a stand-in pane, along the way it faces. */
const out = (p: StandPane, d: number): [number, number, number] => [p.at[0] + Math.sin(p.yaw) * d, p.at[1], p.at[2] + Math.cos(p.yaw) * d];

/** Slabs just outside a stand-in court's standing walls (SetRooms): the houses behind them, for shadows only. */
function massesBehind(r: Set["rooms"][number], origin: [number, number, number]) {
  const s = r.shell, skip = s.skip ?? [], th = (w: "front" | "back" | "left" | "right") => (typeof s.t === "number" ? s.t : s.t?.[w] ?? 0.4);
  const walls: { w: "front" | "back" | "left" | "right"; c: [number, number, number]; half: [number, number, number] }[] = [
    { w: "front", c: [s.l / 2, s.h / 2, s.d + th("front") + 0.3], half: [s.l / 2 + th("left") + 0.6, s.h / 2, 0.25] },
    { w: "back", c: [s.l / 2, s.h / 2, -th("back") - 0.3], half: [s.l / 2 + th("left") + 0.6, s.h / 2, 0.25] },
    { w: "left", c: [-th("left") - 0.3, s.h / 2, s.d / 2], half: [0.25, s.h / 2, s.d / 2] },
    { w: "right", c: [s.l + th("right") + 0.3, s.h / 2, s.d / 2], half: [0.25, s.h / 2, s.d / 2] },
  ];
  return walls.filter((x) => !skip.includes(x.w)).map((x) => {
    const at = toSet(r, x.c);
    return (
      <Mesh3d key={`${r.id}-mass-${x.w}`} name={`${r.id}-mass-${x.w}`} transform={Transform.fromXyz(at[0] + origin[0], at[1] + origin[1], at[2] + origin[2]).withRotation(Quat.fromEuler("XYZ", 0, r.yaw ?? 0, 0))}>
        <Cuboid half_size={x.half} />
        <StandardMaterial base_color="#3a3836" perceptual_roughness={0.95} />
      </Mesh3d>
    );
  });
}
