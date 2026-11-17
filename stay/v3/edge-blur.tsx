// A soft edge to the frame: sharp in the middle, a little softer toward the corners, as the corners of a lens behind an
// underwater housing's dome port are. the director, 11-12, on the kelp: "i think its just too crisp at the peripherals it would
// probably be better ot have it almost like blur volume at the perepherals just enough to make sure not everything is
// so sharp".
//   <EdgeBlur px={7} from={0.42} />   most blur `px` (in the film's 1080 lines) at the corners, none inside `from`
//   (0 the middle of the frame, 1 its corner)
import { FramePass } from "raea/3d";

const EDGE_WGSL = /* wgsl */ `
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let P = u_edge(); let c0 = frame(uv);
  let dims = vec2<f32>(textureDimensions(raea_frame)); let asp = dims.x / dims.y;
  // how far out this pixel is, 0 in the middle to 1 at a corner, and how soft it is there
  let c = (uv - 0.5) * vec2<f32>(asp, 1.0);
  let r = length(c) / length(vec2<f32>(0.5 * asp, 0.5));
  let k = P.w * smoothstep(P.y, P.z, r);
  if (k < 0.002) { return c0; }
  // a disc of 32 taps on the golden angle, its radius in the film's pixels, a little longer round the frame than across
  // it (as a dome's field curvature smears)
  let rad = P.x * k * (min(dims.x, dims.y) / 1080.0) / dims;
  let tang = normalize(vec2<f32>(-c.y, c.x) + vec2<f32>(1e-5, 0.0)); let radial = vec2<f32>(tang.y, -tang.x);
  var acc = vec3<f32>(0.0);
  for (var i = 0; i < 32; i++) {
    let fi = f32(i) + 0.5; let rr = sqrt(fi / 32.0); let a = fi * 2.39996323;
    let o = (tang * cos(a) * 1.25 + radial * sin(a) * 0.8) * rr;
    acc += frame(uv + o * rad).rgb;
  }
  return vec4<f32>(acc / 32.0, c0.a);
}`;

/** the soft edge; `k` (0..1) eases it in or out */
export function EdgeBlur({ px = 7, from = 0.42, to = 1.0, k = 1 }: { px?: number; from?: number; to?: number; k?: number }) {
  return <FramePass wgsl={EDGE_WGSL} uniforms={{ edge: [px, from, to, k] }} />;
}
