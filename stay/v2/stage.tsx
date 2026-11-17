// Graybox v2's stage: a place's components (sets/PLACE) standing in their room, each rig at the time its shot gives
// it, one camera, the light the shot states, and over it the frame's thirds (a guide, off in the film) so a shot's
// hooks can be put where the chain says they are.
import type { ReactNode } from "react";
import { AbsoluteFill, staticFile } from "raea";
import { Canvas3D, Model, Refinish, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { DirectionalLight, SolariLighting } from "raea/light";
import { Transform } from "raea/transform";
import { H, W, px } from "./plan";
import type { At } from "../board/thirds";
import { FilmLook, type Look } from "./look";

/** a component placed: its place and file, where, its turn about y, its clip and how far through it (0..1), and the
 *  glow of any of its named materials (white, times this; 0 is off) */
export type Piece = { place: string; file: string; at: V3; yaw?: number; clip?: string; t?: number; scale?: number; name: string; glow?: Record<string, number>; rot?: V3; finish?: { material: string; color: string }[] };
export type Cam = { eye: V3; look: V3; fov: number };
export type Sun = { lux: number; from: V3; to?: V3; color?: string; shafts?: boolean };

export { lerp, mix3, clamp01, ramp, ease, easeOut, type V3 } from "./math";
import { clamp01, type V3 } from "./math";

export function Stage({ pieces, cam, sun, ev = 0, guide, hooks, children, over, look, wire, seed, reset }: { look?: Look; wire?: boolean; seed?: number; reset?: boolean; pieces: Piece[]; cam: Cam; sun?: Sun; ev?: number; guide?: boolean; hooks?: { at: At; label: string; out?: boolean }[]; children?: ReactNode; over?: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...cam.eye).lookingAt(cam.look)} projection={{ Perspective: { fov: (cam.fov * Math.PI) / 180, near: 0.05, far: 600 } }}>
          <SolariLighting bounces={2} {...(reset ? { reset: true } : {})} />
        </Camera3d>
        <ToneMapping exposure={ev} />
        {/* a sun that is off is parked at 0 lux, never removed: a render holds its first frame's lights */}
        <DirectionalLight illuminance={sun?.lux ?? 0} color={sun?.color ?? "#ffffff"} {...(sun?.shafts ? { volumetric: true } : {})} shadow_maps_enabled transform={Transform.fromXyz(...(sun?.from ?? [0, 10, 0])).lookingAt(sun?.to ?? [0, 0, 0])} />
        {children}
        {look && <FilmLook look={look} wire={wire} seed={seed} />}
        {pieces.map((p) => {
          const model = <Model key={p.name} name={p.name} src={staticFile(`models/${p.place}/${p.file}.glb`)} position={p.at} rotation={p.rot ?? [0, p.yaw ?? 0, 0]} scale={[p.scale ?? 1, p.scale ?? 1, p.scale ?? 1]} {...(p.clip ? { animation: p.clip, time: clamp01(p.t ?? 0) * 0.999, loop: false } : {})} />;
          // a glow is a refinish of the model's own named material (keyed by its amount: a render can keep a material's first values)
          if (p.finish) return <Refinish key={`${p.name}-${p.finish.map((x) => x.color).join()}`} materials={p.finish}>{model}</Refinish>;
          return p.glow ? <Refinish key={`${p.name}-${JSON.stringify(p.glow)}`} materials={Object.entries(p.glow).map(([material, g]) => ({ material, emissive: "#fff8ea", emissiveIntensity: g }))}>{model}</Refinish> : model;
        })}
      </Canvas3D>
      {over}
      {guide && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {[1 / 3, 2 / 3].map((k) => <div key={`v${k}`} style={{ position: "absolute", left: W * k, top: 0, width: 1, height: H, background: "rgba(255,255,255,0.45)" }} />)}
          {[1 / 3, 2 / 3].map((k) => <div key={`h${k}`} style={{ position: "absolute", top: H * k, left: 0, height: 1, width: W, background: "rgba(255,255,255,0.45)" }} />)}
          {(hooks ?? []).map((h, i) => {
            const [x, y] = px(h.at);
            return <div key={i} style={{ position: "absolute", left: x - 38, top: y - 38, boxSizing: "border-box", width: 76, height: 76, borderRadius: 38, overflow: "visible", lineHeight: "170px", border: `3px ${h.out ? "solid #2bb3a6" : "dashed #e8a33d"}`, color: "#fff", fontSize: 15, fontFamily: "monospace", whiteSpace: "nowrap" }}>{h.label}</div>;
          })}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}
