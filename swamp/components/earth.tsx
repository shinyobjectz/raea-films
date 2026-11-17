// The Earth at full size (6,371 km), lit by the film's sun, from NASA's maps (assets/textures/earth, SOURCES.md).
//
// The surface is a shader over a lit standard surface: the Blue Marble's land and sea, the relief from GEBCO's heights
// (it catches the low sun along the terminator), the clouds over it with each cloud's shadow thrown along the sun, the
// sea glossy so the sun glints on it, the sun's light reddened by the air it has crossed, and Black Marble's city
// lights on the night side only, dimmed under cloud. Over it, a shell 100 km up computes the atmosphere per pixel:
// single scattering by air (Rayleigh) and haze (Mie), ozone's absorption, the Earth's own shadow, marched along each
// ray to the ground or through the limb, and the faint green airglow layer at 95 km. It is drawn over what is behind
// it (premultiplied): the blue limb, the haze on the disc, the red and purple band at the terminator.
//
// Neither is traced by Solari (a shader surface is drawn raster-lit after it), which a planet doesn't need: its light
// is the sun's, direct. Precision: keep the camera near the origin; the planet sits millions of metres away.
import { Mesh3d, Sphere } from "raea/mesh";
import { Transform } from "raea/transform";
import { ExtendedMaterial, ShaderExtension, StandardMaterial } from "raea/pbr";
import type { V3 } from "./timeline";
import dayMap from "../assets/textures/earth/earth-day.jpg";
import dataMap from "../assets/textures/earth/earth-data.png";
import lightsMap from "../assets/textures/earth/earth-lights.jpg";
import gulfMap from "../assets/textures/earth/earth-lights-gulf.jpg";

/** the Gulf's lights at 0.6 km (scripts/earth_lights_region.py): longitude and latitude bounds, degrees */
const GULF = [-120, -76, 12, 46];

export const R_EARTH = 6371000;
export const R_ATMO = R_EARTH + 100000;

/** where the Earth is and how it is turned: its centre, and the rows that take a world direction to the Earth's own
 * (x toward 0 N 90 E, y the north pole, z toward 0 N 0 E) */
export type EarthPose = { centre: V3; rows: [V3, V3, V3] };

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const rad = (d: number) => (d * Math.PI) / 180;
/** a place's up, north and east in the Earth's own frame */
export function earthFrame(lat: number, lon: number) {
  const la = rad(lat), lo = rad(lon);
  const up: V3 = [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
  const north: V3 = [-Math.sin(la) * Math.sin(lo), Math.cos(la), -Math.sin(la) * Math.cos(lo)];
  const east: V3 = [Math.cos(lo), 0, -Math.sin(lo)];
  return { up, north, east };
}

/** the Earth placed so the ground at (lat, lon) is at `at`, its up along `up` and its north toward `north` (world) */
export function earthAt(lat: number, lon: number, at: V3, up: V3, north: V3): EarthPose {
  const E = earthFrame(lat, lon);
  const u = norm(up);
  const n = norm([north[0] - u[0] * dot(north, u), north[1] - u[1] * dot(north, u), north[2] - u[2] * dot(north, u)]);
  const e = cross(n, u);
  // world to Earth: the sum of each Earth axis times its world axis
  const rows = [0, 1, 2].map((i) => [0, 1, 2].map((j) => E.up[i] * u[j] + E.north[i] * n[j] + E.east[i] * e[j])) as [V3, V3, V3];
  return { centre: [at[0] - u[0] * R_EARTH, at[1] - u[1] * R_EARTH, at[2] - u[2] * R_EARTH], rows };
}
/** an Earth direction (its own frame) in the world */
export const earthToWorld = (p: EarthPose, d: V3): V3 => [0, 1, 2].map((j) => p.rows[0][j] * d[0] + p.rows[1][j] * d[1] + p.rows[2][j] * d[2]) as V3;
/** the ground at (lat, lon), and its height above it, in the world */
export function onEarth(p: EarthPose, lat: number, lon: number, h = 0): V3 {
  const d = earthToWorld(p, earthFrame(lat, lon).up);
  return [p.centre[0] + d[0] * (R_EARTH + h), p.centre[1] + d[1] * (R_EARTH + h), p.centre[2] + d[2] * (R_EARTH + h)];
}
/** the sun's direction (toward it) when it stands `elev` degrees above (or below) the horizon at (lat, lon), at
 * compass bearing `bearing` (270 is due west, for dusk) */
export function sunFrom(p: EarthPose, lat: number, lon: number, elev: number, bearing: number): V3 {
  const E = earthFrame(lat, lon);
  const el = rad(elev), b = rad(bearing);
  const d: V3 = [0, 1, 2].map((i) => E.up[i] * Math.sin(el) + Math.cos(el) * (E.north[i] * Math.cos(b) + E.east[i] * Math.sin(b))) as V3;
  return norm(earthToWorld(p, d));
}

const COMMON = /* wgsl */ `
const E_PI: f32 = 3.14159265;
const RE: f32 = 6371000.0;
const RA: f32 = 6471000.0;
const BR: vec3<f32> = vec3<f32>(5.802e-6, 13.558e-6, 33.1e-6);
const BM: f32 = 3.996e-6;
const BME: f32 = 4.4e-6;
const BO: vec3<f32> = vec3<f32>(0.65e-6, 1.881e-6, 0.085e-6);
fn ozone(h: f32) -> f32 { return max(0.0, 1.0 - abs(h - 25000.0) / 15000.0); }
fn to_srgb(c: f32) -> f32 { return select(1.055 * pow(max(c, 0.0), 1.0 / 2.4) - 0.055, c * 12.92, c <= 0.0031308); }
fn to_earth(d: vec3<f32>) -> vec3<f32> { return vec3<f32>(dot(u_rx(), d), dot(u_ry(), d), dot(u_rz(), d)); }
fn uv_of(e: vec3<f32>) -> vec2<f32> {
  return vec2<f32>(atan2(e.x, e.z) / (2.0 * E_PI) + 0.5, 0.5 - asin(clamp(e.y, -1.0, 1.0)) / E_PI);
}
// the air between x (from the centre) and the sun along s, as optical depths (Rayleigh, Mie, ozone); w < 0 when the
// planet stands in the way
fn sun_depth(x: vec3<f32>, s: vec3<f32>) -> vec4<f32> {
  let b = dot(x, s);
  let perp = x - s * b;
  let p2 = dot(perp, perp);
  if (b < 0.0 && p2 < RE * RE) { return vec4<f32>(0.0, 0.0, 0.0, -1.0); }
  let t1 = -b + sqrt(max(RA * RA - p2, 0.0));
  let dt = t1 / 6.0;
  var od = vec3<f32>(0.0);
  for (var i = 0; i < 6; i++) {
    let h = length(x + s * ((f32(i) + 0.5) * dt)) - RE;
    od += vec3<f32>(exp(-h / 8000.0), exp(-h / 1200.0), ozone(h)) * dt;
  }
  return vec4<f32>(od, 1.0);
}
fn pcg(v: u32) -> u32 {
  let st = v * 747796405u + 2891336453u;
  let w = ((st >> ((st >> 28u) + 4u)) ^ st) * 277803737u;
  return (w >> 22u) ^ w;
}
fn extinction(od: vec3<f32>) -> vec3<f32> { return exp(-(BR * od.x + BME * od.y + BO * od.z)); }
`;

const SURFACE = /* wgsl */ `${COMMON}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let x = in.world_position.xyz - u_centre();
  let n = normalize(x);
  let e = to_earth(n);
  let uv = uv_of(e);
  // gradients that don't jump at the date line
  var gx = dpdx(uv);
  var gy = dpdy(uv);
  let u2 = fract(uv.x + 0.5);
  let gx2 = dpdx(u2);
  let gy2 = dpdy(u2);
  if (abs(gx2) < abs(gx.x)) { gx.x = gx2; }
  if (abs(gy2) < abs(gy.x)) { gy.x = gy2; }
  let day = textureSampleGrad(tex_day, samp_day, uv, gx, gy).rgb;
  let dat = textureSampleGrad(tex_data, samp_data, uv, gx, gy).rgb;
  let water = to_srgb(dat.g);
  let cloud = to_srgb(dat.b);

  // the relief: GEBCO's heights (255 is 6,400 m) as slopes east and north, a texel and a half either side
  let k = 1.5;
  let du = vec2<f32>(k / 8192.0, 0.0);
  let dv = vec2<f32>(0.0, k / 4096.0);
  let hE = to_srgb(textureSampleGrad(tex_data, samp_data, uv + du, gx, gy).r);
  let hW = to_srgb(textureSampleGrad(tex_data, samp_data, uv - du, gx, gy).r);
  let hN = to_srgb(textureSampleGrad(tex_data, samp_data, uv - dv, gx, gy).r);
  let hS = to_srgb(textureSampleGrad(tex_data, samp_data, uv + dv, gx, gy).r);
  let lat = asin(clamp(e.y, -1.0, 1.0));
  let lenE = 2.0 * k / 8192.0 * 2.0 * E_PI * RE * max(cos(lat), 0.05);
  let lenN = 2.0 * k / 4096.0 * E_PI * RE;
  let sE = (hE - hW) * 6400.0 / lenE * u_relief() * (1.0 - cloud);
  let sN = (hN - hS) * 6400.0 / lenN * u_relief() * (1.0 - cloud);
  let pole = u_ry();
  let north = normalize(pole - n * dot(pole, n));
  let east = cross(north, n);
  (*pbr).N = normalize(n - (sE * east + sN * north));

  // each cloud's shadow, thrown along the sun from the cloud deck's height
  let s = u_sun();
  let mu = dot(n, s);
  let off = (s - n * mu) * (u_cloudh() / RE) / max(mu, 0.06);
  let cs = to_srgb(textureSampleGrad(tex_data, samp_data, uv_of(to_earth(normalize(n + off))), gx, gy).b);
  let ground = day * u_albedo() * (1.0 - 0.6 * cs);
  var albedo = mix(ground, vec3<f32>(u_cloud()), cloud);
  // the sun as the air leaves it here: white by day, orange and red toward the terminator
  let sd = sun_depth(x, s);
  if (sd.w > 0.0) { albedo = albedo * extinction(sd.xyz); } else { albedo = vec3<f32>(0.0); }
  (*pbr).material.base_color = vec4<f32>(albedo, 1.0);
  (*pbr).material.perceptual_roughness = mix(mix(0.92, 0.2, water), 0.96, cloud);
  (*pbr).material.metallic = 0.0;

  // the city lights, on the night side, dimmed under cloud: the Gulf's own at 0.6 km where it has them, else the world's
  let night = smoothstep(0.05, -0.1, mu);
  var lights = textureSampleGrad(tex_lights, samp_lights, uv, gx, gy).rgb;
  let gb = u_gulf();
  let lonD = (uv.x - 0.5) * 360.0;
  let latD = (0.5 - uv.y) * 180.0;
  let gs = vec2<f32>(360.0 / (gb.y - gb.x), 180.0 / (gb.w - gb.z));
  let guv = vec2<f32>((lonD - gb.x) / (gb.y - gb.x), (gb.w - latD) / (gb.w - gb.z));
  let gin = smoothstep(0.0, 0.02, min(min(guv.x, 1.0 - guv.x), min(guv.y, 1.0 - guv.y)));
  var sparkle = 1.0;
  if (gin > 0.0) {
    let gl = textureSampleGrad(tex_gulf, samp_gulf, guv, gx * gs, gy * gs).rgb;
    lights = mix(lights, gl, gin);
    // Black Marble clips a city's middle flat white: break it into the scatter of lights it is, cell by cell at a
    // quarter kilometre, and let it go smooth where the cells are smaller than a pixel (no shimmer as the camera moves)
    let cell = guv * vec2<f32>(7920.0, 6120.0) * 2.0;
    let px = max(length(dpdx(cell)), length(dpdy(cell)));
    let h = f32(pcg(u32(floor(cell.x)) + pcg(u32(floor(cell.y))))) / 4294967295.0;
    sparkle = mix(1.0, 0.18 + 1.3 * h * h, gin * (1.0 - smoothstep(0.6, 1.6, px)));
  }
  // sodium orange where they're faint, warm white in the cores; the faint halo between them held down
  let ll = max(lights.r, max(lights.g, lights.b));
  let lc = mix(vec3<f32>(1.0, 0.36, 0.07), vec3<f32>(1.0, 0.60, 0.26), smoothstep(0.85, 1.0, ll));
  let glowL = lc * pow(ll, 2.4) * mix(1.0, sparkle, smoothstep(0.5, 0.95, ll));
  (*pbr).material.emissive = vec4<f32>(glowL * u_lights() * night * (1.0 - 0.8 * cloud), 1.0);
}`;

const ATMOSPHERE = /* wgsl */ `${COMMON}
fn lit(in: VertexOutput, pbr: PbrInput, color: vec4<f32>) -> vec4<f32> {
  let cam = view.world_position.xyz - u_centre();
  let rd = normalize(in.world_position.xyz - view.world_position.xyz);
  let b = dot(cam, rd);
  let perp = cam - rd * b;
  let p2 = dot(perp, perp);
  if (p2 >= RA * RA) { return vec4<f32>(0.0); }
  let hc = sqrt(RA * RA - p2);
  let t0 = max(-b - hc, 0.0);
  var t1 = -b + hc;
  if (p2 < RE * RE) {
    let tp = -b - sqrt(RE * RE - p2);
    if (tp > 0.0) { t1 = min(t1, tp); }
  }
  if (t1 <= t0) { return vec4<f32>(0.0); }
  let s = u_sun();
  let N = 32;
  let dt = (t1 - t0) / f32(N);
  var od = vec3<f32>(0.0);
  var sumR = vec3<f32>(0.0);
  var sumM = vec3<f32>(0.0);
  var glow = 0.0;
  for (var i = 0; i < N; i++) {
    let xi = cam + rd * (t0 + (f32(i) + 0.5) * dt);
    let h = length(xi) - RE;
    let d = vec3<f32>(exp(-h / 8000.0), exp(-h / 1200.0), ozone(h)) * dt;
    let here = od + d * 0.5;
    od += d;
    let ag = (h - 95000.0) / 6000.0;
    glow += exp(-ag * ag) * dt;
    let sd = sun_depth(xi, s);
    if (sd.w < 0.0) { continue; }
    let att = extinction(here + sd.xyz);
    sumR += att * d.x;
    sumM += att * d.y;
  }
  let m = dot(rd, s);
  let pR = 3.0 / (16.0 * E_PI) * (1.0 + m * m);
  let g = 0.76;
  let pM = 3.0 / (8.0 * E_PI) * ((1.0 - g * g) * (1.0 + m * m)) / ((2.0 + g * g) * pow(1.0 + g * g - 2.0 * g * m, 1.5));
  let T = extinction(od);
  let sky = u_lux() * (sumR * BR * pR + sumM * BM * pM) + u_airglow() * glow * vec3<f32>(0.32, 1.0, 0.42) * T;
  return vec4<f32>(sky * view.exposure, 1.0 - (T.r + T.g + T.b) / 3.0);
}`;

const SAMPLER = { filter: "linear", mipmap: "linear", wrap: ["repeat", "clamp"], anisotropy: 16 } as const;

export type EarthLook = {
  /** the sun's illuminance, lux (the scene's DirectionalLight) */
  lux: number;
  /** the brightest city light, nits */
  lights?: number;
  /** the relief's slope, times the real one */
  relief?: number;
  /** the Blue Marble's colours, as reflectance, times this */
  albedo?: number;
  /** the clouds' reflectance */
  cloud?: number;
  /** the cloud deck's height, metres, for their shadows */
  cloudH?: number;
  /** the airglow, nits per metre of path through its layer */
  airglow?: number;
};

export function Earth({ pose, sun, look, debug = "" }: { pose: EarthPose; /** toward the sun */ sun: V3; look: EarthLook; debug?: string }) {
  const u = {
    centre: pose.centre,
    rx: pose.rows[0],
    ry: pose.rows[1],
    rz: pose.rows[2],
    sun,
    lux: look.lux,
  };
  return (
    <>
      <Mesh3d name="earth" castShadow={false} transform={Transform.fromXyz(...pose.centre)}>
        <Sphere radius={R_EARTH} ico={60} />
        {debug.includes("white") ? <StandardMaterial base_color="#ffffff" /> : debug.includes("plain") ? <StandardMaterial base_color="#ffffff" base_color_texture={dayMap} /> : <ExtendedMaterial
          base={<StandardMaterial base_color="#ffffff" opaque_render_method="Forward" />}
          extension={
            <ShaderExtension
              wesl={SURFACE}
              uniforms={{ ...u, gulf: GULF, lights: look.lights ?? 190, relief: look.relief ?? 3, albedo: look.albedo ?? 0.75, cloud: look.cloud ?? 0.8, cloudh: look.cloudH ?? 8000 }}
              textures={{ day: { src: dayMap, sampler: SAMPLER }, data: { src: dataMap, sampler: SAMPLER }, lights: { src: lightsMap, sampler: SAMPLER }, gulf: { src: gulfMap, sampler: { ...SAMPLER, wrap: "clamp" } } }}
            />
          }
        />}
      </Mesh3d>
      {!debug.includes("noair") && <Mesh3d name="earth-air" castShadow={false} transform={Transform.fromXyz(...pose.centre)}>
        <Sphere radius={R_ATMO} ico={60} />
        <ExtendedMaterial
          base={<StandardMaterial base_color="#000000" alpha_mode="Premultiplied" reflectance={0} />}
          extension={<ShaderExtension wesl={ATMOSPHERE} uniforms={{ ...u, airglow: look.airglow ?? 0.000004 }} />}
        />
      </Mesh3d>}
    </>
  );
}
