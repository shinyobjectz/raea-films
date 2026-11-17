// Space: a frame in orbit. A hard sun, black sky, and the Earth itself at full size beneath (components/earth.tsx:
// NASA's maps on a 6,371 km globe under the same sun, with its own air). The ship and everything near it are traced by
// Solari; the Earth is drawn over its light, and gives the ship a faint blue earthshine from below. The beam is a long
// cone from a point on the ground up to wherever it ends, as wide as it is far, so it reads as one line all the way down.
import type { ReactNode } from "react";
import { AbsoluteFill } from "raea";
import { manifold } from "raea/3d";
import { Camera3d } from "raea/camera";
import { LinearRgba, Srgba } from "raea/color";
import { DirectionalLight, GlobalAmbientLight, SolariLighting } from "raea/light";
import { Mesh3d } from "raea/mesh";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import { DepthOfField, Grade, ToneMapping } from "raea/post_process";
import { Transform } from "raea/transform";
import { Flare, type FlareLight, SunDisc, exposed } from "./flare";
import { Earth, type EarthLook, type EarthPose, R_EARTH, earthAt, onEarth, sunFrom } from "./earth";
import type { Lens } from "./shot";
import type { V3 } from "./timeline";

const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);

/** where the Earth is and where its sun is */
export type Orbit = { pose: EarthPose; /** toward the sun */ sun: V3; lux: number; ground: { lat: number; lon: number } };

/** the Earth under a point: the ground at (lat, lon) `alt` metres straight below `over` along -up, its north toward
 * `north`, and the sun where it stands from that ground (elevation and compass bearing, degrees) */
export function orbitOver({ lat, lon, alt, over = [0, 0, 0], up, north, sun, lux = 24000 }: { lat: number; lon: number; alt: number; over?: V3; up: V3; north: V3; sun: { elev: number; bearing: number }; lux?: number }): Orbit {
  const l = Math.hypot(...up);
  const at: V3 = [over[0] - (up[0] / l) * alt, over[1] - (up[1] / l) * alt, over[2] - (up[2] / l) * alt];
  const pose = earthAt(lat, lon, at, up, north);
  return { pose, sun: sunFrom(pose, lat, lon, sun.elev, sun.bearing), lux, ground: { lat, lon } };
}
/** the Earth placed by how a shot's key camera sees it: the camera `alt` metres up, the limb crossing `limb` degrees
 * below the frame's middle, the sun standing at `sun` in the frame and the ground at (lat, lon) under `foot` (uv from
 * the top left), the sun setting due west of it. The world stays put as the camera moves through the shot. */
export function frameOrbit({ cam, aspect, alt, limb, roll = 0, sun, foot, lat, lon, lux = 24000 }: { cam: Lens; aspect: number; alt: number; limb: number; /** the limb's tilt in the frame, degrees (+ lowers its right) */ roll?: number; sun: [number, number]; foot: [number, number]; lat: number; lon: number; lux?: number }): Orbit & { foot: V3; sunElev: number; centre: V3 } {
  const nrm = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };
  const crs = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dt = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const f = nrm([cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]]);
  const r0 = nrm(crs(f, cam.up ?? [0, 1, 0]));
  const u0 = crs(r0, f);
  const t = Math.tan(cam.fov / 2);
  const ray = ([x, y]: [number, number]): V3 => nrm([0, 1, 2].map((i) => f[i] + r0[i] * (2 * x - 1) * t * aspect + u0[i] * (1 - 2 * y) * t) as V3);
  // the limb's "down": the frame's down turned by the roll
  const rl = (roll * Math.PI) / 180;
  const u: V3 = [0, 1, 2].map((i) => u0[i] * Math.cos(rl) + r0[i] * Math.sin(rl)) as V3;
  const rho = Math.asin(R_EARTH / (R_EARTH + alt));
  const a = rho + (limb * Math.PI) / 180;
  const e: V3 = [0, 1, 2].map((i) => f[i] * Math.cos(a) - u[i] * Math.sin(a)) as V3;
  const centre: V3 = [0, 1, 2].map((i) => cam.pos[i] + e[i] * (R_EARTH + alt)) as V3;
  // the foot: where the ray through it meets the ground
  const d = ray(foot);
  const oc: V3 = [cam.pos[0] - centre[0], cam.pos[1] - centre[1], cam.pos[2] - centre[2]];
  const b = dt(oc, d);
  const perp: V3 = [oc[0] - d[0] * b, oc[1] - d[1] * b, oc[2] - d[2] * b];
  const disc = R_EARTH * R_EARTH - dt(perp, perp);
  if (disc < 0) throw new Error(`frameOrbit: the foot at ${foot} misses the Earth`);
  const tt = -b - Math.sqrt(disc);
  const at: V3 = [cam.pos[0] + d[0] * tt, cam.pos[1] + d[1] * tt, cam.pos[2] + d[2] * tt];
  const s = ray(sun);
  const up = nrm([at[0] - centre[0], at[1] - centre[1], at[2] - centre[2]]);
  const west = nrm([s[0] - up[0] * dt(s, up), s[1] - up[1] * dt(s, up), s[2] - up[2] * dt(s, up)]);
  const north = crs(up, [-west[0], -west[1], -west[2]]);
  const pose = earthAt(lat, lon, at, up, north);
  return { pose, sun: s, lux, ground: { lat, lon }, foot: at, sunElev: (Math.asin(dt(s, up)) * 180) / Math.PI, centre };
}

/** the ground under the orbit's point, in the world */
export const groundOf = (o: Orbit, h = 0) => onEarth(o.pose, o.ground.lat, o.ground.lon, h);

/** the beam: a thin cone of light from `from` (on the Earth) to `to`, `r` wide at `to` and widening as it goes, so it
 * reads as one line all the way down; and round it a glow worked out per pixel from how near each line of sight passes
 * its axis (drawn on the inside of a wider cone, added to the frame, not traced), so it can't step or facet */
const UNIT_CYL = manifold.cylinder(1, 1);
export function Beam({ from, to, r = 0.9, glowR = 2.5, ang = 0.0009, k = 60000, glowK = 500, grow = 1 }: { from: V3; to: V3; eye?: V3; r?: number; glowR?: number; /** the glow's least half-width, radians */ ang?: number; k?: number; glowK?: number; /** 0..1: how far up from the Earth it has reached */ grow?: number }) {
  if (grow <= 0) return null;
  const tip: V3 = [from[0] + (to[0] - from[0]) * grow, from[1] + (to[1] - from[1]) * grow, from[2] + (to[2] - from[2]) * grow];
  const len = Math.hypot(tip[0] - from[0], tip[1] - from[1], tip[2] - from[2]);
  const down: V3 = [(from[0] - tip[0]) / len, (from[1] - tip[1]) / len, (from[2] - tip[2]) / len];
  const mid: V3 = [(from[0] + tip[0]) / 2, (from[1] + tip[1]) / 2, (from[2] + tip[2]) / 2];
  // a cone along z; lookingAt turns its -z end (r1) to the tip
  const widen = 0.00025;
  // (a beam standing straight up can't be turned with +y as its up: that's along it)
  const at = Transform.fromXyz(...mid).lookingAt(tip, Math.abs(down[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0]);
  // v4: unit cylinders sized by the transform. In a video render a shape that changes from frame to frame isn't
  // rebuilt, and a ShaderExtension's uniforms keep their first frame's values (transforms and emissive do update): so
  // the glow's uniforms describe the whole beam, from \`from\` to \`to\`, and never change, and its mesh, clipped a
  // little past the tip, is what limits how far up it shows
  const W = glowR * 6 + len * ang * 8;
  void widen;
  const full = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  const fullDown: V3 = [(from[0] - to[0]) / full, (from[1] - to[1]) / full, (from[2] - to[2]) / full];
  const ext = glowR; // past each end
  return (
    <>
      <Mesh3d name="beam" castShadow={false} transform={at.withScale([r, r, len])} shape={UNIT_CYL}>
        <StandardMaterial base_color="#ffffff" emissive={glow("#e2f5ff", k)} />
      </Mesh3d>
      {glowK > 0 && <Mesh3d name="beam-glow" castShadow={false} transform={at.withScale([W, W, len + ext * 2])} shape={UNIT_CYL}>
        <ExtendedMaterial
          base={<StandardMaterial base_color="#000000" alpha_mode="Add" cull_mode="Front" reflectance={0} opaque_render_method="Forward" />}
          extension={<ShaderExtension wesl={BEAM_GLOW} uniforms={{ tip: to, axis: fullDown, len: full, r: glowR, ang, k: glowK, col: "#9fdcff" }} />}
        />
      </Mesh3d>}
    </>
  );
}
const BEAM_GLOW = /* wgsl */ `
// how far, as an angle from the eye, a line of sight passes the beam (the arc its points make across the sky), and how
// far off that nearest point of it is
fn lit(in: VertexOutput, pbr: PbrInput, color: vec4<f32>) -> vec4<f32> {
  let C = view.world_position.xyz;
  let v = normalize(in.world_position.xyz - C);
  let A = u_tip() - C;
  let F = u_tip() + u_axis() * u_len() - C;
  let dA = normalize(A);
  let dF = normalize(F);
  let n = normalize(cross(dA, dF));
  let m = normalize(v - n * dot(v, n));
  var ang = 0.0;
  var dist = 0.0;
  if (dot(cross(dA, m), n) >= 0.0 && dot(cross(m, dF), n) >= 0.0) {
    ang = asin(clamp(abs(dot(v, n)), 0.0, 1.0));
    // the beam's point seen along m, by the sines in the triangle eye, tip, point (the sight lines far down it run
    // all but parallel to it, where a meeting point in f32 is noise). Seen from beside the ship, most of the beam's
    // length across the frame is its first few kilometres.
    let sa = length(cross(dA, m));
    let ca = dot(dA, m);
    let sb = length(cross(-dA, u_axis()));
    let cb = dot(-dA, u_axis());
    dist = length(A) * sb / max(sa * cb + ca * sb, 1e-6);
  } else {
    let cA = acos(clamp(dot(v, dA), -1.0, 1.0));
    let cF = acos(clamp(dot(v, dF), -1.0, 1.0));
    ang = min(cA, cF);
    dist = select(length(F), length(A), cA < cF);
  }
  // its glow: glowR metres across near, never under u_ang() radians across far
  let x = ang / max(u_ang(), u_r() / max(dist, 1.0));
  let g = exp(-x * x * 0.5) * 0.7 + exp(-x * 1.2) * 0.3;
  return vec4<f32>(u_col().rgb * u_k() * g * view.exposure, 1.0);
}`;

/** the sun's disc, nits: far brighter than anything else in the frame, but held under the HDR frame's float limit */
const SUN_NITS = 3e6;

export function SpaceShot({ cam, orbit, exposure = 0.8, look, flare, aspect = 16 / 9, children, debug = "" }: { cam: Lens; orbit: Orbit; exposure?: number; look?: Partial<EarthLook>; /** the sun's flare (exposed units at its core; 0 none) and one more light's */ flare?: { sun: number; sunReach?: number; also?: FlareLight }; aspect?: number; children?: ReactNode; debug?: string }) {
  const s = orbit.sun.map((v) => v * 1000) as V3;
  // the earthshine: from the Earth's middle, its sunlit share of the disc's light (albedo 0.3), blue
  const c = orbit.pose.centre;
  const dc = Math.hypot(...c);
  const omega = 2 * Math.PI * (1 - Math.sqrt(Math.max(0, 1 - (R_EARTH / dc) ** 2)));
  const toEarth: V3 = [c[0] / dc, c[1] / dc, c[2] / dc];
  const lit = Math.max(0, 0.5 - 0.5 * (toEarth[0] * orbit.sun[0] + toEarth[1] * orbit.sun[1] + toEarth[2] * orbit.sun[2]));
  const shine = (orbit.lux * 0.3 * omega * lit) / Math.PI;
  return (
    <AbsoluteFill style={{ background: "#000000" }}>
      <Camera3d transform={Transform.fromXyz(...cam.pos).lookingAt(cam.look, cam.up ?? [0, 1, 0])} projection={{ Perspective: { fov: cam.fov, near: cam.near ?? 10, far: 1e8 } }}>
        {!debug.includes("nosolari") && <SolariLighting bounces={2} />}
        {cam.stop !== undefined && <DepthOfField focal_distance={cam.focus ?? 100} aperture_f_stops={cam.stop} />}
      </Camera3d>
      <ToneMapping exposure={exposure} />
      {/* space has no sky light: Bevy's default ambient (80 nits) greys the Earth's night side */}
      <GlobalAmbientLight brightness={0} />
      <DirectionalLight transform={Transform.fromXyz(...s).lookingAt([0, 0, 0])} illuminance={orbit.lux} color="#fff4e8" shadow_maps_enabled />
      {shine > 1 && !debug.includes("noshine") && <DirectionalLight transform={Transform.fromXyz(...toEarth.map((v) => v * 1000) as V3).lookingAt([0, 0, 0])} illuminance={shine} color="#a9c6ff" />}
      {!debug.includes("nograde") && <Grade saturation={1.0} midtones={{ contrast: 1.06 }} vignette={{ intensity: 0.28, radius: 0.8, smoothness: 4 }} skip={["ui"]} />}
      {!debug.includes("noearth") && <Earth pose={orbit.pose} sun={orbit.sun} look={{ lux: orbit.lux, ...look }} debug={debug} />}
      {!debug.includes("nosun") && <SunDisc dir={orbit.sun} nits={SUN_NITS} />}
      {children}
      {flare && !debug.includes("noflare") && <Flare cam={cam} aspect={aspect} lights={[{ dir: orbit.sun, r: Math.tan(0.004654) / Math.tan(cam.fov / 2) / 2, above: exposed(SUN_NITS, exposure) * 0.15, k: flare.sun, reach: flare.sunReach ?? 0 }, ...(flare.also ? [flare.also] : [])]} />}
    </AbsoluteFill>
  );
}
