// v3's scene: a place's components, one dolly camera, the place's own light (a sun, a sky, glowing fittings), the air,
// and the film's pass (v3/look.tsx). The 2D layer (cursor, pick box, click rings) goes in `over`. Nothing here is text.
import type { ReactNode } from "react";
import { AbsoluteFill, staticFile } from "raea";
import { Bloom, Canvas3D, DepthOfField, Environment, FogVolume, Model, Refinish, ToneMapping, VolumetricFog } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba } from "raea/color";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { Part } from "../parts/library";
import type { V3 } from "../v2/math";
import type { Cam } from "./cam";
import { FilmLook, Finish, type Look } from "./look";

/** a component placed: its place and file, where, its turn, its clip and how far through it (0..1), a named material's new colour */
export type Item = { place: string; file: string; name: string; at: V3; yaw?: number; rot?: V3; scale?: number; /** a different scale each way (a blind stretched to a wider window) */ scale3?: V3; clip?: string; t?: number; /** it is meant to stand through its neighbours (grass through a table's legs) */ overlap?: boolean; finish?: { material: string; color?: string; roughness?: number; emissive?: string; emissiveIntensity?: number }[] };
export type Sun = { lux: number; from: V3; to?: V3; color?: string };
export type Env = { src: string; intensity?: number; rotation?: number };
export type Glow = { at: V3; half: V3; lum: number; color?: [number, number, number] };
export type Air = { at: V3; size: V3; density: number };
export type Rig = Record<string, { clip?: string; t: number }>;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** a set's parts (sets/PLACE) as items, each rig at the time the shot gives it, by the part's name or file */
export const fromParts = (place: string, parts: Part[], rig: Rig = {}): Item[] => parts.map((p, i) => {
  const name = p.name ?? `${p.file}-${i}`, r = rig[p.name ?? ""] ?? rig[p.file];
  // (a part may come from another place's models: the forest road's car and rain are the old road's)
  return { place: (p as { place?: string }).place ?? place, file: p.file, name, at: p.at, yaw: p.yaw, rot: (p as { rot?: V3 }).rot, scale: p.scale, scale3: (p as { scale3?: V3 }).scale3, overlap: (p as { overlap?: boolean }).overlap, clip: r?.clip ?? p.clip, t: r?.t ?? 0 };
});

export function Scene({ items, cam, focus, sun, env, ev = 0, glows = [], roof, ground, air, look, seed, reset, bloom, over, children, finish = true, doorway }: {
  /** end with the film's grain and vignette (look.tsx Finish); false in a portal's render, which the last world finishes */ finish?: boolean;
  /** drawn after the look and before the grain: a door's opening showing the next world (v3/kit.tsx Doorway) */ doorway?: ReactNode;
  /** a little glow round the sky and the brightest things, for an outdoor shot (the director, 11-11: "outdoor scenes needs clouds and a little bit of bloom ... just enough to make it feel vintage"); 0.35 is a little */ bloom?: number;
  items: Item[]; cam: Cam; /** the distance in sharp focus, metres: what is nearer or farther softens (a fast lens, f/2) */ focus?: number; sun?: Sun; env?: Env; ev?: number; glows?: Glow[]; roof?: { at: V3; half: V3 }; ground?: string; air?: Air; look: Look; seed?: number; reset?: boolean; over?: ReactNode; children?: ReactNode;
}) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.look)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 800 } }}>
          <SolariLighting bounces={2} {...(reset ? { reset: true } : {})} />
          {focus !== undefined && <DepthOfField focal_distance={focus} aperture_f_stops={0.7} max_circle_of_confusion_diameter={9} mode={"Bokeh" as never} />}
        </Camera3d>
        {/* AgX: highlights roll off toward white instead of clipping (the blown-out frames of assembly 8) */}
        <ToneMapping mode="agx" exposure={ev} />
        {/* (always a trace of it: bloom is what makes the camera's frame a float one, and the film's pass reads depth out of that frame's alpha) */}
        <Bloom intensity={bloom ?? 0.02} threshold={0.75} />
        {/* a sun that is off is parked at 0 lux, never removed: a render holds its first frame's lights */}
        <DirectionalLight illuminance={sun?.lux ?? 0} color={sun?.color ?? "#ffffff"} {...(air ? { volumetric: true } : {})} shadow_maps_enabled transform={Transform.fromXyz(...(sun?.from ?? [0, 10, 0])).lookingAt(sun?.to ?? [0, 0, 0])} />
        {env && <Environment src={staticFile(`hdri/${env.src}.hdr`)} intensity={env.intensity ?? 1} rotation={env.rotation ?? 0} background />}
        {air && <VolumetricFog ambient={0} />}
        {air && <FogVolume name="air" position={air.at} scale={air.size} density={air.density} scattering={0.6} anisotropy={0.7} />}
        {ground && <Mesh3d name="ground" transform={Transform.fromXyz(0, -0.06, 0)}><Cuboid half_size={[300, 0.05, 300]} /><StandardMaterial base_color={ground} perceptual_roughness={0.92} /></Mesh3d>}
        {roof && <Mesh3d name="roof" transform={Transform.fromXyz(...roof.at)}><Cuboid half_size={roof.half} /><StandardMaterial base_color="#2a2a2a" perceptual_roughness={0.9} /></Mesh3d>}
        {glows.map((g, i) => {
          const c = g.color ?? [1, 1, 1];
          return <Mesh3d key={`glow-${i}-${g.lum}`} name={`glow-${i}-${g.lum}`} castShadow={false} {...({ allowOverlap: true } as object) /* a glow is a bulb: it sits inside its fitting */} transform={Transform.fromXyz(...g.at)}><Cuboid half_size={g.half} /><StandardMaterial base_color="#ffffff" emissive={new LinearRgba(g.lum * c[0], g.lum * c[1], g.lum * c[2], 1)} /></Mesh3d>;
        })}
        {children}
        {items.map((p) => {
          const model = <Model key={p.name} name={p.name} src={staticFile(`models/${p.place}/${p.file}.glb`)} position={p.at} rotation={p.rot ?? [0, p.yaw ?? 0, 0]} scale={p.scale3 ?? [p.scale ?? 1, p.scale ?? 1, p.scale ?? 1]} {...(p.overlap ? ({ allowOverlap: true } as object) : {})} {...(p.clip ? { animation: p.clip, time: clamp01(p.t ?? 0) * 0.999, loop: false } : {})} />;
          return p.finish ? <Refinish key={`${p.name}-${p.finish.map((x) => x.color).join()}`} materials={p.finish}>{model}</Refinish> : model;
        })}
        <FilmLook look={look} seed={seed} cam={cam} finish={finish && !doorway} />
        {/* a doorway's picture of the next world goes over the finished frame, then the grain and vignette (v3/kit.tsx Doorway) */}
        {doorway}
        {doorway && finish && <Finish look={look} seed={seed} />}
      </Canvas3D>
      {over}
    </AbsoluteFill>
  );
}
