// The city camera the Berlin film's exteriors were rendered with: a camera in the baked 1917 city under a sky (CityShot),
// with the stage, materials and skies it needs. Taken from the project's previz component, which also held sets this
// film doesn't use; only the parts the shot compositions need are kept here.
import { AbsoluteFill, Img, interpolate, staticFile } from "raea";
import { Capsule3d, Cone, Cuboid, Cylinder, Plane3d, Sphere, Torus, VolumetricFog, manifold, type Solid } from "raea/3d";
import { Camera3d, Canvas3D } from "raea/camera";
import { LinearRgba, Srgba } from "raea/color";
import { AmbientLight, DirectionalLight, PointLight, Shadows, SolariLighting } from "raea/light";
import { Mesh3d } from "raea/mesh";
import { Fog, StandardMaterial } from "raea/pbr";
import { Bloom, ToneMapping } from "raea/post_process";
import { Quat, Transform } from "raea/transform";
import { Fragment, type ReactNode } from "react";
import { City, toScene, type CityLook } from "../world/City";
import { WINTER_DUSK } from "../world/shaders";

export type V3 = [number, number, number];
/** Stops on top of every shot's exposure: the city is low-key, not underexposed. */
export const LIFT = 1;
/** What a shot is drawn from: its own frame, its length in frames, how far through it is (0 to 1), and T, seconds into
 *  the piece (the score's clock). */
export type Ctx = { f: number; n: number; t: number; fps: number; T: number };

// Every solid here may pass into another: grey stand-ins are joined by overlapping (a dome on its drum, a knob on its
// lever), so they are marked allowOverlap and raea's clipping check leaves them to the real set pieces.
// ------------------------------------------------------------------------------------------------ helpers
export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
export const mix = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
/** A handheld wobble or a shake, metres: the same every render. */
export const shake = (f: number, amp: number, seed = 1): V3 => [
  amp * (Math.sin(f * 1.31 + seed) + 0.5 * Math.sin(f * 3.7 + seed * 2)),
  amp * (Math.sin(f * 1.73 + seed * 3) + 0.5 * Math.sin(f * 4.1 + seed)),
  amp * 0.4 * Math.sin(f * 2.2 + seed * 5),
];
const glow = (hex: string, k: number) => LinearRgba.from(Srgba.hex(hex)).mul(k);
const rot = (x: number, y: number, z: number) => Quat.fromEuler("XYZ", x, y, z);

export function Cam({ eye, at, fov, near = 0.03, far = 4000, children }: { eye: V3; at: V3; fov: number; near?: number; far?: number; children?: ReactNode }) {
  return <Camera3d transform={Transform.fromXyz(...eye).lookingAt(at)} projection={{ Perspective: { fov: (fov * Math.PI) / 180, near, far } }}>{children}</Camera3d>;
}
/** Grey clay, or a colour where the shot needs one to read (the red lamp, brass, sand, field grey). */
export function Mat({ c = "#8c8b87", ro = 0.85, m = 0, g, k = 1, a }: { c?: string; ro?: number; m?: number; g?: string; k?: number; a?: number }) {
  return (
    <StandardMaterial
      base_color={a !== undefined ? Srgba.hex(c).with_alpha(a) : c}
      perceptual_roughness={ro}
      metallic={m}
      {...(g ? { emissive: glow(g, k) } : {})}
      {...(a !== undefined ? { alpha_mode: "Blend" as const, double_sided: true, cull_mode: null } : {})}
    />
  );
}
type MatP = Parameters<typeof Mat>[0];
export function Box({ at, size, yaw = 0, pitch = 0, roll = 0, ...m }: { at: V3; size: V3; yaw?: number; pitch?: number; roll?: number } & MatP) {
  return (
    <Mesh3d allowOverlap transform={Transform.fromXyz(...at).withRotation(rot(pitch, yaw, roll))}>
      <Cuboid half_size={[size[0] / 2, size[1] / 2, size[2] / 2]} />
      <Mat {...m} />
    </Mesh3d>
  );
}
/** A cylinder: standing on y, or turned by pitch (about x) and yaw. */
export function Cyl({ at, r, h, yaw = 0, pitch = 0, roll = 0, ...m }: { at: V3; r: number; h: number; yaw?: number; pitch?: number; roll?: number } & MatP) {
  return (
    <Mesh3d allowOverlap transform={Transform.fromXyz(...at).withRotation(rot(pitch, yaw, roll))}>
      <Cylinder radius={r} half_height={h / 2} />
      <Mat {...m} />
    </Mesh3d>
  );
}
export function Ball({ at, r, ...m }: { at: V3; r: number } & MatP) {
  return (
    <Mesh3d allowOverlap transform={Transform.fromXyz(...at)}>
      <Sphere radius={r} />
      <Mat {...m} />
    </Mesh3d>
  );
}
export function Shape({ shape, at = [0, 0, 0], yaw = 0, ...m }: { shape: Solid; at?: V3; yaw?: number } & MatP) {
  return (
    <Mesh3d allowOverlap shape={shape} transform={Transform.fromXyz(...at).withRotation(rot(0, yaw, 0))}>
      <Mat {...m} />
    </Mesh3d>
  );
}
/** A stand-in person: a body and a head, standing at `at` (feet), or bent (crouch 0 to 1), or fallen (fall 0 to 1). */
export function Person({ at, c = "#3c3a38", yaw = 0, crouch = 0, fall = 0, h = 1.68 }: { at: V3; c?: string; yaw?: number; crouch?: number; fall?: number; h?: number }) {
  const s = 1 - 0.4 * crouch, body = (h - 0.24) * s, tip = -fall * (Math.PI / 2);
  // a point (0, y, z) of the standing body, tipped about x by `tip`, turned by `yaw`, from the feet
  const P = (y: number, z: number): V3 => {
    const y1 = y * Math.cos(tip) - z * Math.sin(tip), z1 = y * Math.sin(tip) + z * Math.cos(tip);
    return [at[0] + z1 * Math.sin(yaw), at[1] + y1, at[2] + z1 * Math.cos(yaw)];
  };
  const q = rot(tip, yaw, 0);
  return (
    <>
      <Mesh3d allowOverlap transform={Transform.fromXyz(...P(body / 2, 0)).withRotation(q)}>
        <Capsule3d radius={0.2} half_length={Math.max(0.05, body / 2 - 0.2)} />
        <Mat c={c} ro={0.95} />
      </Mesh3d>
      <Mesh3d allowOverlap transform={Transform.fromXyz(...P(body + 0.12, 0.05 * crouch))}>
        <Sphere radius={0.11} />
        <Mat c="#b9a08a" ro={0.7} />
      </Mesh3d>
    </>
  );
}

/** A 3D shot's frame: background, the canvas, exposure and the camera's air. */
/** (`tone` "none": the light as it is, unmapped, for a capture: compositions/people-ingame-probe.tsx's panoramas) */
export function Stage({ bg = "#050506", ev = 0, amb = 0, ambCol = "#808080", fog, bloom = 0, tone = "agx", children }: { bg?: string; ev?: number; amb?: number; ambCol?: string; fog?: [string, number, number]; bloom?: number; tone?: "agx" | "none"; children: ReactNode }) {
  return (
    <AbsoluteFill style={{ background: bg }}>
      <Canvas3D>
        <AmbientLight brightness={amb} color={ambCol} />
        <ToneMapping mode={tone} exposure={ev + LIFT} />
        {fog ? <Fog color={fog[0]} near={fog[1]} far={fog[2]} /> : null}
        {bloom ? <Bloom intensity={bloom} /> : null}
        {children}
      </Canvas3D>
    </AbsoluteFill>
  );
}

/** A white or orange flash over the frame, fading from `at` seconds into the shot. */
export function Flash({ c, at = 0, len = 0.35, color = "#fff6e8", peak = 1 }: { c: Ctx; at?: number; len?: number; color?: string; peak?: number }) {
  const s = c.f / c.fps - at;
  const o = s < 0 ? 0 : peak * Math.exp(-s / (len / 3));
  return o > 0.003 ? <AbsoluteFill style={{ background: color, opacity: Math.min(1, o) }} /> : null;
}

/** Type on black (the opening cards, the title, the end card). */
export function Card({ c, lines, size = 34, spacing = 0.5, fadeIn = 0.3, fadeOut = 0.3 }: { c: Ctx; lines: { text: string; from?: number; size?: number }[]; size?: number; spacing?: number; fadeIn?: number; fadeOut?: number }) {
  const s = c.f / c.fps, end = c.n / c.fps;
  return (
    <AbsoluteFill style={{ background: "#000", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 26 }}>
      {lines.map((l, i) => {
        const o = interpolate(s, [l.from ?? 0, (l.from ?? 0) + fadeIn, end - fadeOut, end], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return <div key={i} style={{ color: "#e9e6df", fontFamily: "Didot, 'Bodoni 72', Georgia, serif", fontSize: l.size ?? size, letterSpacing: `${spacing}em`, opacity: o, textIndent: `${spacing}em` }}>{l.text}</div>;
      })}
    </AbsoluteFill>
  );
}

// ------------------------------------------------------------------------------------------------ the city
type Sky = { sky: string; sunAz: number; sunEl: number; sunLux: number; sunCol: string; amb: number; ambCol: string; fog: [number, number]; ev: number; look: CityLook };
export const DUSK: Sky = { sky: "#3a3c48", sunAz: 235, sunEl: 2, sunLux: 30, sunCol: "#ffb080", amb: 5, ambCol: "#6a7894", fog: [120, 900], ev: 6.6,
  look: { ...WINTER_DUSK, lit: 0.33, litShop: 0.7, lamp: 2.2, dark: 0.02, skyTop: [0.05, 0.07, 0.12], skyHor: [0.35, 0.3, 0.32], ice: 0.6, nits: 22, gasNits: 500, arcNits: 1600, lampsLit: 0.6, lights: 14 } };
/** One o'clock on a clear winter day : world-street's tested
 *  noon light (compositions/world-street.tsx `day`), the sun where it stands at 13:00 on 12 December at Berlin's
 *  latitude (52.5 N; elevation about 13.3 degrees, azimuth about 196 from the solar position formulas), the windows on
 *  the shot's own clock (raea-fb: shops open and lit by the day, City's roomUniforms `hour`). */
export const DAY: Sky = { sky: "#9cb2c8", sunAz: 196, sunEl: 13.3, sunLux: 8000, sunCol: "#fff1dc", amb: 300, ambCol: "#a9bdd6", fog: [900, 6000], ev: -1,
  look: { snow: 0.7, wet: 0.3, soot: 0.8, damp: 0.7, lit: 0.05, litShop: 0.3, lamp: 0.6, dark: 0.06, skyTop: [0.38, 0.5, 0.68], skyHor: [0.72, 0.78, 0.86], ice: 0.25, nits: 800, hour: 13 } };
export const DAWN: Sky = { sky: "#8a8d99", sunAz: 128, sunEl: 3, sunLux: 260, sunCol: "#ffc7a0", amb: 45, ambCol: "#9ba6ba", fog: [350, 2600], ev: 4.4,
  look: { snow: 0.85, wet: 0.2, soot: 0.8, damp: 0.6, lit: 0.12, litShop: 0.2, lamp: 1.2, dark: 0.05, skyTop: [0.35, 0.38, 0.46], skyHor: [0.6, 0.55, 0.55], ice: 0.8, nits: 90, gasNits: 300, arcNits: 900, lampsLit: 0.3, lights: 0 } };
export const NIGHT: Sky = { sky: "#0b0d13", sunAz: 200, sunEl: 35, sunLux: 0.6, sunCol: "#9fb2d6", amb: 1.4, ambCol: "#56607a", fog: [70, 650], ev: 8.4,
  look: { ...WINTER_DUSK, lit: 0.2, litShop: 0.1, lamp: 2.2, dark: 0.01, skyTop: [0.01, 0.015, 0.03], skyHor: [0.05, 0.05, 0.07], ice: 0.6, nits: 9, gasNits: 360, arcNits: 1100, lampsLit: 0.55, lights: 10 } };
const sunAt = (at: V3, az: number, el: number, d = 2000): V3 => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return [at[0] + Math.sin(a) * Math.cos(e) * d, at[1] + Math.sin(e) * d, at[2] - Math.cos(a) * Math.cos(e) * d];
};
/** A camera in the baked city under a sky, with whatever the shot adds (people, a tram, a horse). */
/** `amb` in place of the sky's ambient (0 when an <Environment> in the children lights the scene instead); `tone` as Stage's */
/** `solari`: Solari's ray-traced light in place of the shadow maps and the flat ambient (a trial, 11-17: give the sky's
 *  light as an <Environment> in the children and amb 0; RAEA_SOLARI_DYNAMIC=1 traces the people too, RT5) */
/** `shadows`: how far the sun's shadows reach (m); past it the streets are lit, faded over the last 30% (LT21) */
export function CityShot({ eye, at, fov, sky, bias = 1, ev = 0, extra, amb, tone, solari, levels, shadows = 300, children }: { eye: V3; at: V3; fov: number; sky: Sky; bias?: number; ev?: number; extra?: string[]; amb?: number; tone?: "agx" | "none"; solari?: boolean; levels?: "lods" | "detail"; shadows?: number; children?: ReactNode }) {
  return (
    <Stage bg={sky.sky} ev={sky.ev + ev} amb={amb ?? sky.amb} ambCol={sky.ambCol} fog={[sky.sky, sky.fog[0], sky.fog[1]]} tone={tone}>
      <Cam eye={eye} at={at} fov={fov} near={0.1} far={7000}>{solari ? <SolariLighting bounces={2} /> : null}</Cam>
      <DirectionalLight transform={Transform.fromXyz(...sunAt(eye, sky.sunAz, sky.sunEl)).lookingAt(eye)} illuminance={sky.sunLux} color={sky.sunCol} shadow_maps_enabled />
      <Shadows distance={shadows} firstCascade={25} mapSize={4096} />
      <City eye={eye} look={sky.look} bias={bias} extra={extra} levels={levels} />
      {children}
    </Stage>
  );
}
/** EPSG:25833 to the scene at a height over the ground (about 35 m NHN in the Friedrichstadt). */
export const at35 = (e: number, n: number, up = 0, ground = 35.0): V3 => toScene(e, n, ground + up);
