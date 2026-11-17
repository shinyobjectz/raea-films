// A take: a place's set (sets/PLACE, laid out by its library stand) under the stand's own light, with a camera that
// moves through the shot and each rig at the time the shot gives it. The 2D layer (cursor, type) goes in `over`.
import type { ReactNode } from "react";
import { AbsoluteFill, staticFile } from "raea";
import { Canvas3D, Environment, Model, Refinish, ToneMapping, VolumetricFog, FogVolume } from "raea/3d";
import { FilmLook, type Look } from "./look";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Transform } from "raea/transform";
import type { Part } from "../parts/library";
import { clamp01, type Cam } from "./stage";

/** which clip a part plays and how far through it (0..1), by the part's name or its file */
export type Rig = Record<string, { clip?: string; t: number }>;
/** `light`: the shot's own sun (where it shines from, its strength and colour), in place of the stand's; `finish`: a part's named material given a new colour (a refinish, keyed by the colour: a render keeps a material's first values) */
export type Light = { from: [number, number, number]; to?: [number, number, number]; lux: number; color?: string };
/** `env`: the sky the place stands under (an HDRI of media/hdri, its strength, its turn), drawn behind it too;
 *  `ground`: a colour for a plain ground reaching the horizon, for a place whose own floor stops short of it;
 *  `air`: haze the sun's shafts show in, a box centred at `at` of `size`; `look`: the film's stock and its drawing */
export type Env = { src: string; intensity?: number; rotation?: number };
export type Air = { at: [number, number, number]; size: [number, number, number]; density: number };
export function Take({ place, parts, cam, rig = {}, wall = false, floor = false, sun = 14000, ev = 0, over, light, finish = {}, env, ground, air, look, wire, reset, seed, children }: { env?: Env; ground?: string; air?: Air; look?: Look; wire?: boolean; reset?: boolean; seed?: number; children?: ReactNode; place: string; parts: Part[]; cam: Cam; rig?: Rig; wall?: boolean; floor?: boolean; sun?: number; ev?: number; over?: ReactNode; light?: Light; finish?: Record<string, { material: string; color: string; roughness?: number }> }) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.look)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 600 } }}>
          <SolariLighting bounces={2} {...(reset ? { reset: true } : {})} />
        </Camera3d>
        <ToneMapping exposure={ev} />
        <DirectionalLight illuminance={light?.lux ?? sun} color={light?.color ?? "#ffffff"} {...(air ? { volumetric: true } : {})} shadow_maps_enabled transform={Transform.fromXyz(...(light?.from ?? [-4, 5, 5])).lookingAt(light?.to ?? [0, 0.6, -0.5])} />
        {env && <Environment src={staticFile(`hdri/${env.src}.hdr`)} intensity={env.intensity ?? 1} rotation={env.rotation ?? 0} background />}
        {air && <VolumetricFog ambient={0} />}
        {air && <FogVolume name="air" position={air.at} scale={air.size} density={air.density} scattering={0.6} anisotropy={0.7} />}
        {ground && (
          <Mesh3d name="ground" transform={Transform.fromXyz(0, -0.06, 0)}>
            <Cuboid half_size={[300, 0.05, 300]} />
            <StandardMaterial base_color={ground} perceptual_roughness={0.92} />
          </Mesh3d>
        )}
        {children}
        {look && <FilmLook look={look} wire={wire} seed={seed} />}
        {floor && (
          <Mesh3d name="floor" transform={Transform.fromXyz(0, -0.05, 0)}>
            <Cuboid half_size={[40, 0.05, 40]} />
            <StandardMaterial base_color="#77777a" perceptual_roughness={0.85} />
          </Mesh3d>
        )}
        {wall && (
          <Mesh3d name="wall" transform={Transform.fromXyz(0, 3, -2.5)}>
            <Cuboid half_size={[8, 3, 0.1]} />
            <StandardMaterial base_color="#a9a9a4" perceptual_roughness={0.9} />
          </Mesh3d>
        )}
        {parts.map((p, i) => {
          const name = p.name ?? `${p.file}-${i}`;
          const r = rig[p.name ?? ""] ?? rig[p.file];
          const clip = r?.clip ?? p.clip;
          const model = <Model key={name} name={name} src={staticFile(`models/${place}/${p.file}.glb`)} position={p.at} rotation={[0, p.yaw ?? 0, 0]} scale={[p.scale ?? 1, p.scale ?? 1, p.scale ?? 1]} {...(clip ? { animation: clip, time: clamp01(r?.t ?? 0) * 0.999, loop: false } : {})} />;
          const fin = finish[name];
          return fin ? <Refinish key={`${name}-${fin.color}`} materials={[fin]}>{model}</Refinish> : model;
        })}
      </Canvas3D>
      {over}
    </AbsoluteFill>
  );
}
