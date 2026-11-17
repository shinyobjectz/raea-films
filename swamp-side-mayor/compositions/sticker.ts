// The sticker look for whatever is drawn in the "hero" pass (the goose, the critters, the ruins), as the reference
// draws its goose: flat colour cel-shaded in two tones (a cool blue-grey shade), a dark ink line round the silhouette,
// and a white halo just outside the line. A line falls wherever a sticker meets something farther away: the sky, the
// world, or another sticker behind it; whatever is in front of a sticker cuts it clean. Lines thin with distance
// (full width within `near` metres), and distant stickers take the paint look's haze, so the swamp keeps its depth.
// The pass's pixels are drawn unlit (`flat`) and skipped by the paint look; this pass shades them from the normals.
export const STICKER = `
fn tagAt(uv: vec2<f32>) -> u32 { return (u32(round(textureLoad(raea_normal, raea_texel(uv, textureDimensions(raea_normal)), 0).a * 3.0)) + 1u) % 4u; }
fn hero(uv: vec2<f32>) -> f32 { return select(0.0, 1.0, tagAt(uv) == 1u && depth(uv) < 1e20); }
fn wd(d: f32) -> f32 { return clamp(u_near() / max(d, 0.01), u_thin(), 1.0); }
fn hazed(c: vec3<f32>, d: f32) -> vec3<f32> { let f = min(u_hm(), 1.0 - exp(-max(0.0, d - u_hs()) * u_hd())); return mix(c, vec3<f32>(0.212, 0.546, 0.823), f); }
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let res = vec2<f32>(textureDimensions(raea_normal)); let px = 1.0 / res; let k = res.y / 1080.0;
  let ink = u_ink() * k; let halo = u_halo() * k; let R = ink + halo;
  let c = frame(in.uv); let me = hero(in.uv); let d0 = depth(in.uv);
  let navy = vec3<f32>(0.11, 0.15, 0.24); let cream = vec3<f32>(1.0, 0.992, 0.965);
  var dIn = 99.0; var dOut = 99.0; var dqOut = 1e30;
  for (var a = 0; a < 20; a++) { let ang = f32(a) * 0.3141593; let dir = vec2<f32>(cos(ang), sin(ang));
    for (var s = 1; s <= 7; s++) { let r = f32(s) / 7.0 * R; let q = in.uv + dir * r * px;
      let o = hero(q); let dq = depth(q);
      if (me > 0.5 && dq > d0 * 1.006 + 0.03 && (o < 0.5 || dq > d0 * 1.12)) { dIn = min(dIn, r / wd(d0)); }
      if (o > 0.5 && dq < select(d0 * 0.994 - 0.03, d0 * 0.88, me > 0.5)) { let e = r / wd(dq); if (e < dOut) { dOut = e; dqOut = dq; } } } }
  var col = c.rgb;
  if (me > 0.5) { let n = normal(in.uv); let l = normalize(vec3<f32>(u_sx(), u_sy(), u_sz()));
    let t = dot(n, l) - 0.12 + 0.18 * n.y; let lit = smoothstep(-0.03, 0.03, t);
    col = c.rgb; col = mix(col * vec3<f32>(u_sr(), u_sg(), u_sb()), col, lit);
    let line = 1.0 - smoothstep(ink - 0.8, ink + 0.8, dIn); col = hazed(mix(col, navy, line), d0); }
  if (dOut < 98.0) {
    let inner = 1.0 - smoothstep(ink * 0.35 - 0.8, ink * 0.35 + 0.8, dOut);
    let h = 1.0 - smoothstep(ink * 0.35 + halo - 0.8, ink * 0.35 + halo + 0.8, dOut);
    col = mix(mix(col, hazed(cream, dqOut), h), hazed(navy, dqOut), inner); }
  return vec4<f32>(col, c.a);
}`;
const lin = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export function stickerUniforms(sun: [number, number, number], o: { ink?: number; halo?: number; shade?: string; near?: number; thin?: number; hazeStart?: number; hazeDensity?: number; hazeMost?: number } = {}) {
  const sh = lin(o.shade ?? "#a9c2e0");   // the haze colour is the paint look's (#7fc3ea), fixed in the shader: a pass has 16 uniforms at most
  return { ink: o.ink ?? 3.6, halo: o.halo ?? 4.6, sx: sun[0], sy: sun[1], sz: sun[2], sr: sh[0], sg: sh[1], sb: sh[2],
    near: o.near ?? 7, thin: o.thin ?? 0.4, hs: o.hazeStart ?? 30, hd: o.hazeDensity ?? 0.009, hm: o.hazeMost ?? 0.75 };
}
