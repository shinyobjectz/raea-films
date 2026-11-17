// v8 (the director 11-16: "let's see this video as some kind of clay animatic or wireframe"): the film as the app's player
// shows it while it's being made: every surface grey clay, lit from its normals (a key from up and to the right, a sky
// fill from above), dark lines where depth or the surface's turn breaks, the sky a pale studio grey and distance
// fading into it. A frame pass over the 3D only (film.tsx#goose-clay draws none of the 2D overlays).
export const CLAY = /* wgsl */ `
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let res = vec2<f32>(textureDimensions(raea_normal)); let px = 1.0 / res; let k = res.y / 1080.0;
  let sky = mix(vec3<f32>(0.80, 0.81, 0.83), vec3<f32>(0.62, 0.63, 0.66), in.uv.y);
  let d0 = depth(in.uv);
  if (d0 > 1e20) { return vec4<f32>(sky, 1.0); }
  let n = normal(in.uv); let l = normalize(vec3<f32>(0.45, 0.8, 0.4));
  let key = max(0.0, dot(n, l)); let fill = 0.5 + 0.5 * n.y;
  var col = vec3<f32>(0.66, 0.64, 0.61) * (0.28 + 0.52 * key + 0.28 * fill);
  var e = 0.0;
  for (var a = 0; a < 8; a++) { let ang = f32(a) * 0.7853982; let q = in.uv + vec2<f32>(cos(ang), sin(ang)) * 1.6 * k * px;
    let dq = depth(q);
    if (abs(dq - d0) > 0.025 * d0 + 0.02) { e = 1.0; }
    if (dq < 1e20) { e = max(e, 1.0 - smoothstep(0.82, 0.94, dot(n, normal(q)))); } }
  col = mix(col, vec3<f32>(0.2, 0.22, 0.27), 0.8 * e);
  col = mix(col, sky, clamp((d0 - 14.0) / 45.0, 0.0, 0.7));
  return vec4<f32>(col, 1.0);
}`;
