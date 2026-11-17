// Under the pond: what the lens sees below the water (v6: the dive, its feet kicking, the swim round the computer).
// World2's plants are cards, and under the fog a card draws as a flat rectangle, so below the water the world is this
// instead: the pond's bed in mud and sand, the lily pads as dark shapes on the bright surface with their stems hanging
// down to the bed, weed swaying in clumps, stones, and flecks drifting in the murk. Solids only; no cards.
import { staticFile } from "raea";
import { BufferMesh, FramePass, Instances, sdf } from "raea/3d";
import { AmbientLight, DirectionalLight } from "raea/light";
import { StandardMaterial } from "raea/pbr";
import { Cuboid, Cylinder, Mesh3d } from "raea/mesh";
import { Transform } from "raea/transform";
import { WATER, hash, height, noise, pond, type V3 } from "./set";
import { SUN, TERRAIN, lilies, lilyShape } from "./world2";
import { PANOS, panoAt } from "./plan";

const hex = (h: string) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const MUD = hex("#3c5636"), SAND = hex("#77855a"), BANK = hex("#33452c");
/** the bed: the ground's own mesh, coloured as a pond's floor (mud with sandy patches; the banks darker) */
const BED = { ...TERRAIN, colors: (() => { const out: number[] = []; for (let i = 0; i < TERRAIN.positions.length; i += 3) {
  const x = TERRAIN.positions[i], z = TERRAIN.positions[i + 2], p = pond(x, z), u = Math.min(1, Math.max(0, noise(x * 0.6 + 3, z * 0.6) * 1.8 - 0.6)), c = p < 0 ? MUD.map((v, k) => v + (SAND[k] - v) * u) : BANK;
  out.push(c[0], c[1], c[2], 1); } return out; })() };
// weed in clumps over the pond's floor, near where the goose swims and dives
const WEED = (() => { const out: { x: number; z: number; h: number; k: number }[] = []; let i = 0;
  for (let x = -9; x <= 9; x += 0.32) for (let z = -19.5; z <= -5.5; z += 0.32) { i++; const jx = x + (hash(i, 1) - 0.5) * 0.3, jz = z + (hash(i, 2) - 0.5) * 0.3;
    if (pond(jx, jz) < -0.06 && noise(jx * 0.5 + 7, jz * 0.5) > 0.5 && hash(i, 3) > 0.35) out.push({ x: jx, z: jz, h: 0.5 + 0.9 * hash(i, 4), k: i }); }
  return out; })();
const STONES = (() => { const out: { x: number; z: number; s: number; k: number }[] = []; for (let i = 0; i < 400 && out.length < 70; i++) { const x = -9 + 18 * hash(i, 21), z = -19 + 13 * hash(i, 22); if (pond(x, z) < -0.05) out.push({ x, z, s: 0.5 + hash(i, 23), k: i }); } return out; })();
const BLADE = sdf.ellipsoid(0.04, 0.5, 0.012).solid(0.01);
const STONE = sdf.ellipsoid(0.16, 0.07, 0.12).displace(0.02, 9, 2, 3).solid(0.012);
const FLECK = sdf.ellipsoid(0.008, 0.003, 0.006).solid(0.002);

export function Under({ t, eye, goose }: { t: number; eye: V3; goose: V3 }) {
  // nothing right over the lens or in front of it: a pad overhead or a blade at the glass fills the frame
  const near = lilies.filter((l) => { const d = Math.hypot(l.position[0] - eye[0], l.position[2] - eye[2]); return d < 13 && d > 1.6; });
  const clear = (x: number, z: number) => Math.hypot(x - eye[0], z - eye[2]) > 0.8 && Math.hypot(x - goose[0], z - goose[2]) > 0.7;
  return (
    <>
      <DirectionalLight name="sun" transform={Transform.fromXyz(...SUN).lookingAt([0, 0, -6])} illuminance={7000} />
      <AmbientLight brightness={600} />
      <Mesh3d name="bed" allowOverlap><BufferMesh {...BED} /><StandardMaterial base_color="#ffffff" perceptual_roughness={1} reflectance={0} /></Mesh3d>
      {/* the surface from below: bright, so the pads read as shadows on it */}
      {/* (v9: the light off the ripples is the window pass's caustic web now, not streak instances) */}
      <Instances name="lilies-under" shape={lilyShape} shadow={false} at={near.map((l, i) => ({ position: [l.position[0], WATER - 0.03 - 0.002 * (i % 3), l.position[2]] as V3, rotation: [0, hash(i, 1) * 6.28, 0] as V3, scale: l.scale }))}>
        <StandardMaterial base_color="#1d4a3a" unlit /></Instances>
      <Instances name="lily-stems" shadow={false} at={near.map((l, i) => { const x = l.position[0], z = l.position[2], bed = height(x, z), d = Math.max(0.05, WATER - bed);
        return { position: [x, (WATER + bed) / 2, z] as V3, rotation: [0.07 * Math.sin(t * 0.6 + i), 0, 0.07 * Math.cos(t * 0.5 + i * 1.7)] as V3, scale: [1, d, 1] as V3 }; })}>
        <Cylinder radius={0.012} half_height={0.5} /><StandardMaterial base_color="#3f7d3a" perceptual_roughness={1} reflectance={0} /></Instances>
      {[0, 1].map((k) => <Instances key={k} name={`weed-${k}`} shape={BLADE} shadow={false} at={WEED.filter((w) => w.k % 2 === k && clear(w.x, w.z)).map((w) => { const bed = height(w.x, w.z), h = Math.min(w.h, Math.max(0.2, (WATER - bed) * 0.85)), sw = 0.16 * Math.sin(t * 1.1 + w.k * 0.7);
        return { position: [w.x + Math.sin(sw) * h * 0.5, bed + h * 0.5, w.z] as V3, rotation: [0.05 * Math.cos(t * 0.8 + w.k), hash(w.k, 5) * 6.28, sw] as V3, scale: [1, h, 1] as V3 }; })}>
        <StandardMaterial base_color={k ? "#4f9a3e" : "#2f7a4a"} perceptual_roughness={1} reflectance={0} double_sided cull_mode={null} /></Instances>)}
      <Instances name="bed-stones" shape={STONE} shadow={false} at={STONES.map((s) => ({ position: [s.x, height(s.x, s.z) + 0.02, s.z] as V3, rotation: [0, hash(s.k, 24) * 6.28, 0] as V3, scale: s.s }))}>
        <StandardMaterial base_color="#77836a" perceptual_roughness={1} reflectance={0} /></Instances>
      <Instances name="flecks" shape={FLECK} shadow={false} at={Array.from({ length: 220 }, (_, i) => { const a = hash(i, 31) * 6.283, rr = 0.4 + 4.5 * Math.sqrt(hash(i, 32)), x = eye[0] + Math.cos(a) * rr + 0.04 * t, z = eye[2] + Math.sin(a) * rr, y = WATER - 0.05 - 2.2 * hash(i, 33) + 0.03 * Math.sin(t * 0.7 + i);
        return { position: [x, y, z] as V3, rotation: [t * 0.4 + i, i, 0] as V3, scale: 0.7 + 1.2 * hash(i, 34) }; })}>
        <StandardMaterial base_color="#e4f6ea" unlit /></Instances>
    </>
  );
}

// ---- the surface from below. Every ray that reaches the water's underside before anything else is bent up through
// it (Snell, water to air), its normal rippled by a few wave trains, rings round the goose's paddling and the rings of
// its dive; a ray that gets out reads the swamp above from the dome rendered at that spot (plan.ts PANOS, tools/
// dome.py), so overhead there is a circle of sky, trees and the computer, squeezed and warping; past it the surface
// turns to a mirror of the murk (total internal reflection), and the fog takes it with distance.
const WINDOW = /* wgsl */ `
fn wave(p: vec2<f32>, d: vec2<f32>, k: f32, w: f32, a: f32, t: f32) -> vec2<f32> { return d * (a * k * cos(dot(p, d) * k + t * w)); }
fn rings(p: vec2<f32>, c: vec2<f32>, k: f32, w: f32, a: f32, fall: f32, t: f32) -> vec2<f32> {
  let d = p - c; let r = length(d) + 1e-4; return (d / r) * (a * cos(r * k - t * w) * exp(-r * fall));
}
fn dome(a: vec3<f32>, layer: i32) -> vec3<f32> {
  let th = acos(clamp(a.y, 0.0, 1.0)); let s = max(length(a.xz), 1e-5);
  let uv = vec2<f32>(0.5) + 0.5 * (th / 1.5707963) * (a.xz / s);
  return textureSampleLevel(tex_dome, samp_dome, uv, layer, 0.0).rgb;
}
// v9 (the director 11-16 on v8's clay-and-wire goose under the water: "remove the underwater thing maybe we just use some
// kind of new shader"): sunlight through the rippled surface, focused into a moving web of bright lines on whatever is
// under the water (the goose's body and feet, the bed, the stones, the weeds). The web is the classic iterated-warp
// caustic, slow (it must never flicker) and dimmer with depth, strongest on what faces up.
fn caustic(q: vec2<f32>, t: f32) -> f32 {
  let p = q - vec2<f32>(250.0); var i = p; var c = 1.0;
  for (var n = 0; n < 4; n++) {
    let tt = t * (1.0 - 3.5 / f32(n + 1));
    i = p + vec2<f32>(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2<f32>(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c = 1.17 - pow(c / 4.0, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}
fn lit(uv: vec2<f32>, base: vec4<f32>, P: vec3<f32>, W: vec4<f32>) -> vec4<f32> {
  if (P.y > W.x - 0.005) { return base; }
  let under = W.x - P.y; let up = 0.3 + 0.7 * clamp(normal(uv).y, 0.0, 1.0);
  let k = caustic(P.xz * 3.1, W.y * 0.55) * exp(-under * 1.4) * up;
  let fade = 1.0 - clamp((distance(P, u_eye().xyz) - W.z) / (W.w - W.z), 0.0, 1.0);
  return vec4<f32>(base.rgb + vec3<f32>(0.62, 0.92, 0.80) * (0.75 * k * fade), base.a);
}
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let base = frame(uv);
  let E = u_eye(); let F = u_fwd(); let W = u_wat(); let C = u_fogc();
  let ndc = vec2<f32>(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  let dir = normalize(F.xyz + u_right().xyz * (ndc.x * E.w * F.w) + u_up().xyz * (ndc.y * E.w));
  if (dir.y <= 1e-4) {   // level or down: the bed, the weeds, the goose's feet (lit when the lens is under)
    let d0 = depth(uv); if (E.y >= W.x || d0 > 1e20) { return base; }
    return lit(uv, base, E.xyz + dir * (d0 / max(dot(dir, F.xyz), 1e-4)), W); }
  let tS = (W.x - E.y) / dir.y;
  if (tS <= 0.0) { return base; }
  let dist = depth(uv) / max(dot(dir, F.xyz), 1e-4);
  if (dist < tS - 0.015) { return lit(uv, base, E.xyz + dir * dist, W); }   // something under the water stands nearer than the surface
  let p = (E.xyz + dir * tS).xz; let t = W.y;
  var g = wave(p, vec2<f32>(0.8, 0.6), 3.3, 2.1, 0.035, t) + wave(p, vec2<f32>(-0.45, 0.89), 5.1, 2.9, 0.022, t)
        + wave(p, vec2<f32>(0.96, -0.28), 8.7, 4.1, 0.012, t) + wave(p, vec2<f32>(-0.7, -0.71), 13.0, 5.3, 0.007, t);
  let G = u_goose(); g += rings(p, G.xy, 11.0, 8.0, 0.06 * G.z, 1.1, t);
  let S = u_splash(); if (S.z > 0.0 && S.z < 3.0) { g += rings(p, S.xy, 7.0, 0.0, 0.12 * exp(-S.z * 1.2), 0.9, -S.z * 9.0 * 0.6); }
  let n = normalize(vec3<f32>(g.x, -1.0, g.y));
  let a = refract(dir, n, 1.333);
  let ci = -dot(dir, n);
  var mirror = C.rgb * (0.78 + 0.5 * (g.x - g.y));
  // v8 (the director 11-16: "make the mirror layer of the water better or clearer so it's not just solid blue"): the mirror
  // side reflects the water under it: the ray off the rippled surface runs on down into the murk; where it is 75 cm
  // under, that point is found on the frame and what the frame shows there is what the mirror shows (the bed, the
  // weeds, the goose's belly), bent by the ripples, fogged by the whole way it travelled
  let rr = reflect(dir, n); let sr = 0.75 / max(-rr.y, 0.12);
  let Q = vec3<f32>(p.x, W.x, p.y) + rr * sr; let dQ = Q - E.xyz; let zQ = dot(dQ, F.xyz);
  if (zQ > 0.05) {
    let qx = dot(dQ, u_right().xyz) / (zQ * E.w * F.w); let qy = dot(dQ, u_up().xyz) / (zQ * E.w);
    let quv = vec2<f32>(qx * 0.5 + 0.5, 0.5 - qy * 0.5);
    let inside = (1.0 - smoothstep(0.9, 1.0, abs(qx))) * (1.0 - smoothstep(0.9, 1.0, abs(qy)));
    let seen = frame(clamp(quv, vec2<f32>(0.002), vec2<f32>(0.998))).rgb;
    let fq = clamp((tS + sr - W.z) / (W.w - W.z), 0.0, 1.0);
    mirror = mix(mirror, mix(seen * 1.1, C.rgb, 0.55 * fq), 0.85 * inside);
  }
  var col = mirror;
  if (dot(a, a) > 0.5) {
    let P = u_pano(); let sky = mix(dome(a, i32(P.x)), dome(a, i32(P.y)), P.z);
    let sky2 = select(sky, pow(sky, vec3<f32>(1.0 / 2.2)), C.w > 0.5);
    let ct = sqrt(max(0.0, 1.0 - 1.333 * 1.333 * (1.0 - ci * ci)));
    let fr = 0.02 + 0.98 * pow(1.0 - ct, 5.0);
    let glint = 1.0 + 0.6 * smoothstep(0.03, 0.09, length(g)) ;
    col = mix(sky2 * 1.05 * glint, mirror, fr);
  }
  let f = clamp((tS - W.z) / (W.w - W.z), 0.0, 1.0);
  return vec4<f32>(mix(col, C.rgb, f), 1.0);
}`;
const lin = (h: string) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const DOMES = PANOS.map((_, k) => staticFile(`pano/dome-${k}.png`));
export const UNDER_FOG = { color: "#1d7b8a", near: 0.3, far: 9 };
/** the pass; `display` says the frame it reads holds display colours (then the dome is read as written) */
export function SurfaceWindow({ t, eye, at, up, fov, aspect = 2, goose, splash, display = false }: { t: number; eye: V3; at: V3; up: V3; fov: number; aspect?: number; goose: V3; splash: [number, number, number]; display?: boolean }) {
  const sub = (a: V3, c: V3): V3 => [a[0] - c[0], a[1] - c[1], a[2] - c[2]], cross = (a: V3, c: V3): V3 => [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const f = norm(sub(at, eye)), r = norm(cross(f, up)), u = cross(r, f), pa = panoAt(eye);
  const fc = display ? [1, 3, 5].map((i) => parseInt(UNDER_FOG.color.slice(i, i + 2), 16) / 255) : lin(UNDER_FOG.color);
  return <FramePass wesl={WINDOW} prepass={{ depth: true, normal: true }} textures={{ dome: { layers: DOMES, sampler: { filter: "linear", mipmap: "none", wrap: "clamp" } } }}
    uniforms={{ eye: [...eye, Math.tan((fov * Math.PI) / 360)], fwd: [...f, aspect], right: [...r, 0], up: [...u, 0], wat: [WATER, t, UNDER_FOG.near, UNDER_FOG.far], fogc: [...fc, display ? 1 : 0],
      goose: [goose[0], goose[2], 1, 0], splash: [splash[0], splash[1], splash[2], 0], pano: [pa.a, pa.b, pa.w, 0] }} />;
}
