// The surface hooks over a tree grown by raea-sys-foliage (docs/foliage.feature FO2, FO3): one hook for its leaves, one
// for its bark, one for the ground under it. Nothing seasonal is in the tree: the leaf's vertex colour carries its own
// number (r), how exposed it is (g) and where it sits on its shoot (b), and the hooks draw the day over them.
//   leaves  unfold from their stalk's foot (tip leaves last); young light green darkening through June; autumn by
//           leaf, exposed and early-falling leaves first and from each leaf's edge inward, then brown in blotches;
//           fallen leaves drop out (a group's material goes as a whole with its shadow, so the hook only orders
//           within it); soot dulls them; rain darkens and glosses them
//   bark    the species' photo scan (scans.ts), closing round each branch; smooth on young shoots; green algae on
//           the weather side (W in Berlin, ASSUMED amount); soot; rain darkens and streams; snow on top
//   ground  fallen leaves under the crown from the litter of the season; snow; wet
// Amounts marked ASSUMED wait for a sheet beside photographs (FO12).
const COMMON = /* wgsl */ `
fn enc1(l: f32) -> f32 { return select(1.055 * pow(max(l, 0.0), 1.0 / 2.4) - 0.055, 12.92 * l, l <= 0.0031308); }
fn fh(p: vec2<f32>) -> f32 { return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453); }
// value noise, its x periodic over \`per\` cells (round a branch, so a pattern closes on itself)
fn pvn(p: vec2<f32>, per: f32) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let x0 = i.x - per * floor(i.x / per);
  let x1 = (i.x + 1.0) - per * floor((i.x + 1.0) / per);
  let a = mix(fh(vec2<f32>(x0, i.y)), fh(vec2<f32>(x1, i.y)), u.x);
  let b = mix(fh(vec2<f32>(x0, i.y + 1.0)), fh(vec2<f32>(x1, i.y + 1.0)), u.x);
  return mix(a, b, u.y);
}
fn vn(p: vec2<f32>) -> f32 { return pvn(p, 1.0e6); }
fn enc3(c: vec3<f32>) -> vec3<f32> { return vec3<f32>(enc1(c.x), enc1(c.y), enc1(c.z)); }
// a tangent frame from the screen derivatives of position and uv (Mikkelsen's cotangent frame: no tangents needed)
fn frame(n: vec3<f32>, p: vec3<f32>, uv: vec2<f32>) -> mat3x3<f32> {
  let dp1 = dpdx(p);
  let dp2 = dpdy(p);
  let du1 = dpdx(uv);
  let du2 = dpdy(uv);
  let p2 = cross(dp2, n);
  let p1 = cross(n, dp1);
  let t = p2 * du1.x + p1 * du2.x;
  let b = p2 * du1.y + p1 * du2.y;
  let k = inverseSqrt(max(max(dot(t, t), dot(b, b)), 1e-20));
  return mat3x3<f32>(t * k, b * k, n);
}
// a scan's normal (OpenGL: green up the picture, so toward -v) in the world, its relief scaled by k
fn scan_normal(raw: vec3<f32>, tbn: mat3x3<f32>, k: f32) -> vec3<f32> {
  let t = raw * 2.0 - 1.0;
  return normalize(tbn * vec3<f32>(t.x * k, -t.y * k, t.z));
}
// a height's slope as a normal, from screen derivatives (Mikkelsen 2010, no tangents needed)
fn bumped(pos: vec3<f32>, n: vec3<f32>, dhx: f32, dhy: f32) -> vec3<f32> {
  let dpx = dpdx(pos);
  let dpy = dpdy(pos);
  let r1 = cross(dpy, n);
  let r2 = cross(n, dpx);
  let det = dot(dpx, r1);
  let g = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * n - g);
}
`;

/** Leaves. Uniforms: phase (grown, mature, turned, browned), more (fallen, flowering, wet, soot), young, green,
 * autumn, dead, flower (linear colours). Texture: atlas (the tree's own leaf atlas). */
export const LEAF = /* wgsl */ `${COMMON}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let cells = 4.0;
  let duvx = dpdx(in.uv);
  let duvy = dpdy(in.uv);
  let own = in.color.r;
  // the leaf's sky view through the crown (raea-sys-foliage light.rs), 0 deep inside to about 0.9 on top
  let sky = in.color.g;
  let exposed = smoothstep(0.03, 0.55, sky);
  let shoot = in.color.b;
  let ph = u_phase();
  let mo = u_more();
  // unfolding: the leaf grows from its stalk's foot (a cell's bottom middle); the tip leaves of a shoot open last
  let cell = floor(in.uv * cells);
  let local = in.uv * cells - cell;
  let grown = clamp(ph.x * 1.3 - shoot * 0.3, 0.0, 1.0);
  let s = mix(0.1, 1.0, grown);
  let q = vec2<f32>(0.5, 1.0) + (local - vec2<f32>(0.5, 1.0)) / s;
  let t = textureSampleGrad(tex_atlas, samp_atlas, (cell + clamp(q, vec2<f32>(0.0), vec2<f32>(1.0))) / cells, duvx / s, duvy / s);
  // the alpha is a distance (0.5 on the edge, 12 texels across): cut on the edge up close, and widen the leaf by half
  // a pixel as its texels shrink (no mipmaps), so thin leaves don't vanish far off; the glTF's own cut is 0.1
  let texels = max(length(duvx), length(duvy)) * 1024.0 / s;
  let cut = max(0.1, 0.5 - 0.5 * texels / 12.0);
  if (any(q < vec2<f32>(0.0)) || any(q > vec2<f32>(1.0)) || t.a < cut || own < mo.x) {
    discard;
  }
  let vein = enc1(t.r);
  let blot = enc1(t.g);
  let edge = enc1(t.b);
  let jit = fract(own * 7.31);
  // spring's yellow-green darkening to summer's; sun leaves lighter and yellower, shade leaves darker (ASSUMED)
  var col = mix(u_young(), u_green(), ph.y);
  col = col * mix(0.72, 1.15, exposed) * (0.88 + 0.24 * jit) * (0.86 + 0.28 * blot);
  col = mix(col, col * vec3<f32>(1.08, 1.05, 0.8), exposed * 0.4);
  // autumn: each leaf on its own day (exposed and early-falling ones first), from its edge inward
  let when = clamp(own * 0.7 + (1.0 - exposed) * 0.3, 0.0, 1.0);
  let k = clamp(ph.z * 1.5 - when * 0.6, 0.0, 1.0);
  let turned = smoothstep(0.0, 0.3, k * 1.3 - edge * 0.9 + 0.15 * (blot - 0.5));
  let aut = u_autumn() * mix(vec3<f32>(1.0), vec3<f32>(1.12, 0.82, 0.62), jit * jit);
  col = mix(col, aut * (0.82 + 0.36 * blot), turned);
  let b = clamp(ph.w * 1.6 - when * 0.6 - blot * 0.5 + 0.2, 0.0, 1.0);
  col = mix(col, u_dead() * (0.75 + 0.5 * blot), smoothstep(0.25, 0.65, b));
  // veins lighter
  col = mix(col, col * 1.3 + vec3<f32>(0.015), vein * 0.45);
  // flowering: sprays at the outer shoots' tips (on cards, a tint where they hang; ASSUMED until made as their own)
  let fl = step(fh(vec2<f32>(own, 3.1)), mo.y * 0.35) * smoothstep(0.4, 0.9, shoot);
  col = mix(col, u_flower() * (0.8 + 0.4 * blot), fl * smoothstep(0.25, 0.6, vn(local * 9.0 + own * 50.0)));
  // soot: a city's leaves dulled grey (ASSUMED); rain: darker, glossier
  let lum = dot(col, vec3<f32>(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3<f32>(lum * 0.8), mo.w * 0.18);
  col = col * (1.0 - 0.22 * mo.z);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = mix(0.68, 0.42, mo.z);
  // the sky light a leaf gets is what its sky view lets through: the crown's hollows and core go dark, as on a real
  // tree (direct sun is left to the shadows)
  (*pbr).diffuse_occlusion = vec3<f32>(max(sky, 0.03));
  (*pbr).specular_occlusion = max(sky, 0.03);
  // one shading normal on both sides (the cards' bent normals), so a crown shades as a volume, with the veins' relief
  let n = normalize(in.world_normal);
  let nb = bumped(in.world_position.xyz, n, dpdx(vein) * 0.002, dpdy(vein) * 0.002);
  (*pbr).N = nb;
  (*pbr).world_normal = nb;
}
`;

/** Bark: the species' photo scan (scans.ts BARK_SCAN) a whole number of times round each branch. Uniforms: bark
 * (linear colour, for young shoots and the birch), kind (2 birch, drawn; the rest scanned), weather (wet, snow, soot,
 * algae), size (the scan's metres, w and h), tint (what the scan is multiplied by), ground (the soil's world height,
 * for the earth on the foot; -1000 leaves it off). Textures: diff, nor, arm. Its uv
 * runs round the branch in whole repeats of 0.3 m and along it in 0.3 m; uv_b is (repeats, radius). */
export const BARK = /* wgsl */ `${COMMON}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let w = u_weather();
  let kind = i32(round(u_kind()));
  let per = in.uv_b.x;
  let r = in.uv_b.y;
  let pos = in.world_position.xyz;
  let n0 = normalize(in.world_normal);
  // the scan round the branch a whole number of times, so it closes; along it at its own scale
  let sz = u_size().xy;
  let kx = max(1.0, round(per * 0.3 / sz.x)) / per;
  let tuv = vec2<f32>(in.uv.x * kx, in.uv.y * 0.3 / sz.y);
  let dif = textureSample(tex_diff, samp_diff, tuv).rgb;
  let nor = enc3(textureSample(tex_nor, samp_nor, tuv).rgb);
  let arm = enc3(textureSample(tex_arm, samp_arm, tuv).rgb);
  // a shoot under about 4 cm across is smooth: the species' colour, the scan's relief faint
  let old = smoothstep(0.02, 0.1, r);
  var col = mix(u_bark() * (0.85 + 0.3 * vn(in.uv * vec2<f32>(3.0, 1.0))), dif * u_tint().rgb, old);
  var relief = mix(0.25, 1.0, old);
  var ao = mix(1.0, arm.x, old);
  var rough = mix(0.8, arm.y, old);
  if (kind == 2) {
    // birch: white, dark lenticels across it, a black fissured foot on old trunks
    let p = vec2<f32>(in.uv.x * 6.0, in.uv.y * 30.0);
    let len = smoothstep(0.82, 0.9, pvn(vec2<f32>(p.x * 0.5, p.y), per * 3.0)) * smoothstep(0.3, 0.6, vn(p * 0.2));
    col = mix(u_bark(), vec3<f32>(0.04, 0.035, 0.03), len * 0.9);
    let foot = (1.0 - smoothstep(0.6, 2.2, pos.y)) * old;
    col = mix(col, dif * 0.25, foot);
    relief = mix(0.15, 1.0, foot);
    ao = mix(1.0, arm.x, foot);
    rough = mix(0.6, arm.y, foot);
  }
  // green algae on the weather side (west and north-west in Berlin), deepest in the scan's furrows (ASSUMED amounts)
  let side = dot(n0, normalize(vec3<f32>(-1.0, 0.25, -0.5)));
  let green = smoothstep(0.1, 0.8, side + 0.3 * vn(vec2<f32>(in.uv.x * 2.0, in.uv.y * 0.7)) + 0.3 * (1.0 - ao)) * w.w;
  col = mix(col, vec3<f32>(0.05, 0.075, 0.02), green * 0.6);
  // soot; rain darkens and runs down in streams
  let lum = dot(col, vec3<f32>(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3<f32>(lum) * 0.55, w.z * 0.35);
  let stream = smoothstep(0.55, 0.8, pvn(vec2<f32>(in.uv.x * 3.0, in.uv.y * 0.15), per * 3.0));
  col = col * (1.0 - w.x * (0.45 + 0.25 * stream));
  // earth on the foot: where bark meets the soil it's caked into the furrows first, 5-12 cm up (ASSUMED)
  let above = pos.y - u_ground();
  let earth = (1.0 - smoothstep(0.0, 0.05 + 0.07 * vn(in.uv * vec2<f32>(2.0, 0.6)), above - 0.05 * (1.0 - ao))) * step(-0.5, above);
  col = mix(col, vec3<f32>(0.06, 0.047, 0.034) * (0.75 + 0.5 * vn(pos.xz * 40.0)), earth * 0.85);
  rough = mix(rough, 0.97, earth);
  relief = relief * (1.0 - 0.5 * earth);
  // snow lies on what faces up, out of the furrows first
  let up = n0.y + 0.25 * (vn(in.uv * vec2<f32>(4.0, 2.0)) - 0.5) + 0.3 * (ao - 0.7);
  let snow = smoothstep(0.35, 0.7, up) * w.y;
  col = mix(col, vec3<f32>(0.85, 0.87, 0.9), snow);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = mix(mix(rough, 0.45, w.x), 0.8, snow);
  (*pbr).diffuse_occlusion = (*pbr).diffuse_occlusion * mix(ao, 1.0, snow);
  let nb = scan_normal(nor, frame(n0, pos, tuv), relief * (1.0 - snow));
  (*pbr).N = nb;
  (*pbr).world_normal = nb;
}
`;

/** The ground under a tree: packed sand and a ring of cobbles (ASSUMED), with fallen leaves from the season.
 * Uniforms: litter (0-1), crown (radius, m), centre (x, z, 0, 0), autumn, dead (linear), weather (wet, snow, 0, 0). */
export const GROUND = /* wgsl */ `${COMMON}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let p = in.world_position.xz;
  let w = u_weather();
  let d = length(p - u_centre().xy);
  // sand with cobbles beyond the tree's pit (centre.z its radius, as raea-sys-foliage grew it; 1 m when unset)
  let cob = step(max(u_centre().z, 1.0), d);
  let c = fract(p * 6.0);
  // joints fade out where a pixel spans a stone (no moire far off)
  let fw = max(fwidth(p.x * 6.0), fwidth(p.y * 6.0));
  let joint = (1.0 - smoothstep(0.0, max(0.12, fw), min(min(c.x, 1.0 - c.x), min(c.y, 1.0 - c.y)))) * (1.0 - smoothstep(0.15, 0.45, fw));
  var col = mix(vec3<f32>(0.19, 0.16, 0.12) * (0.85 + 0.3 * vn(p * 7.0)), vec3<f32>(0.2, 0.19, 0.18) * (0.75 + 0.45 * fh(floor(p * 6.0))), cob);
  col = mix(col, col * 0.45, joint * cob);
  var h = (1.0 - joint) * cob;
  // fallen leaves: thickest under the crown's edge, blown into drifts (ASSUMED)
  let reach = u_crown() * 1.3;
  let under = exp(-pow(d / reach, 2.0)) * u_litter();
  let leaf = smoothstep(0.5, 0.56, vn(p * 18.0) * 0.45 + vn(p * 3.0) * 0.25 + under * 0.9) * step(0.02, under);
  let lc = mix(u_autumn(), u_dead(), smoothstep(0.3, 0.7, vn(p * 31.0)));
  col = mix(col, lc * (0.75 + 0.5 * vn(p * 40.0)), leaf);
  h = mix(h, 0.6, leaf);
  // rain darkens; snow lies over all
  col = col * (1.0 - 0.45 * w.x);
  col = mix(col, vec3<f32>(0.86, 0.88, 0.92), w.y * smoothstep(0.2, 0.5, w.y + 0.2 * vn(p * 2.0)));
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = mix(0.95, 0.35, w.x * (1.0 - leaf));
  let n0 = normalize(in.world_normal);
  let nb = bumped(in.world_position.xyz, n0, dpdx(h) * 0.006, dpdy(h) * 0.006);
  (*pbr).N = nb;
  (*pbr).world_normal = nb;
}
`;

/** A piece of the street round a tree (Street.tsx), a photo scan laid flat (on a kerb's face, upright), with the
 * season's leaves gathering in its joints and hollows under the crown, rain and snow. Uniforms: size (the scan's metres
 * w, h, and an offset in repeats so pieces don't repeat in step), tint (rgb, the scan multiplied; a, its relief),
 * litter (0-1), crown (radius, m), centre (x, z of the tree), weather (wet, snow, 0, 0). Textures: diff, nor, arm, and
 * leaves (the litter scan's colour). */
export const PAVE = /* wgsl */ `${COMMON}
fn surface(in: VertexOutput, pbr: ptr<function, PbrInput>) {
  let p = in.world_position.xyz;
  let n0 = normalize(in.world_normal);
  let w = u_weather();
  let up = abs(n0.y) > 0.5;
  let q = select(vec2<f32>(p.x + p.z, -p.y), p.xz, up);
  let tuv = q / u_size().xy + u_size().zw;
  let dif = textureSample(tex_diff, samp_diff, tuv).rgb;
  let nor = enc3(textureSample(tex_nor, samp_nor, tuv).rgb);
  let arm = enc3(textureSample(tex_arm, samp_arm, tuv).rgb);
  let lv = textureSample(tex_leaves, samp_leaves, p.xz / 1.26).rgb;
  var col = dif * u_tint().rgb;
  // fallen leaves: thickest under the crown's edge, caught first in the joints and hollows (ASSUMED)
  let d = length(p.xz - u_centre().xy);
  let under = exp(-pow(d / (u_crown() * 1.3), 2.0)) * u_litter();
  let leaf = smoothstep(0.55, 0.7, vn(p.xz * 2.5) * 0.45 + (1.0 - arm.x) * 0.7 + under * 0.8) * step(0.02, under) * select(0.0, 1.0, up);
  col = mix(col, lv, leaf);
  // rain darkens, glosses, and stands in the joints; snow lies over all, the joints last
  let pool = smoothstep(0.75, 0.55, arm.x) * w.x;
  col = col * (1.0 - 0.4 * w.x);
  let snow = w.y * smoothstep(0.2, 0.5, w.y + 0.2 * vn(p.xz * 2.0) + 0.3 * (arm.x - 0.8)) * select(0.3, 1.0, up);
  col = mix(col, vec3<f32>(0.86, 0.88, 0.92), snow);
  (*pbr).material.base_color = vec4<f32>(col, 1.0);
  (*pbr).material.perceptual_roughness = mix(mix(mix(arm.y, 0.95, leaf), 0.3, w.x * 0.6), 0.08, pool);
  (*pbr).diffuse_occlusion = (*pbr).diffuse_occlusion * mix(arm.x, 1.0, max(snow, leaf * 0.5));
  let nb = scan_normal(nor, frame(n0, p, tuv), u_tint().a * (1.0 - 0.6 * leaf) * (1.0 - snow) * (1.0 - pool));
  (*pbr).N = nb;
  (*pbr).world_normal = nb;
}
`;
