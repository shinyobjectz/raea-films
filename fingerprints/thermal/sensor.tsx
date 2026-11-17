// The thermal camera: one frame pass over a scene drawn in temperature. Every surface in a thermal shot is unlit grey,
// its brightness its temperature (0 the cold room, 1 the hottest skin), so the scene's own frame is a temperature
// map; this pass reads it the way a cheap uncooled sensor does:
//   - a coarse grid of cells (SENSOR across), each the average of what falls in it, scaled up bilinearly, as a
//     160 x 120 camera's picture is on its screen;
//   - the sensor's sharpening, which leaves a dark halo round anything hot;
//   - a little noise that moves every frame, and a faint fixed pattern of columns;
//   - the palette: ironbow by default (black, indigo, magenta, orange, yellow, white), or white-hot grey.
// Run before the tone mapper with <ToneMapping mode="none" />, so the palette's colours reach the screen exact.
import { FramePass } from "raea/3d";

export type Palette = "iron" | "white";

const WESL = /* wgsl */ `
fn temp(uv: vec2<f32>) -> f32 {
  let c = frame(uv).rgb;
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

// one sensor cell: the mean of four samples inside it
fn cell(i: vec2<f32>) -> f32 {
  let s = u_s();
  let n = s.xy;
  let c = (i + 0.5) / n;
  let o = 0.25 / n;
  return 0.25 * (temp(c + vec2<f32>(-o.x, -o.y)) + temp(c + vec2<f32>(o.x, -o.y)) + temp(c + vec2<f32>(-o.x, o.y)) + temp(c + vec2<f32>(o.x, o.y)));
}

fn hash(p: vec3<f32>) -> f32 {
  let q = fract(p * vec3<f32>(0.1031, 0.1030, 0.0973));
  let r = q + dot(q, q.yzx + 33.33);
  return fract((r.x + r.y) * r.z);
}

// the cell's reading: temperature, plus noise
fn reading(i: vec2<f32>) -> f32 {
  let s = u_s();
  let noise = (hash(vec3<f32>(i, s.z)) - 0.5) * s.w;
  let column = (hash(vec3<f32>(i.x, 7.0, 3.0)) - 0.5) * s.w * 0.5;
  return cell(i) + noise + column;
}

// the grid, scaled up bilinearly
fn sensor(uv: vec2<f32>) -> f32 {
  let n = u_s().xy;
  let g = uv * n - 0.5;
  let i = floor(g);
  let f = g - i;
  let a = reading(i);
  let b = reading(i + vec2<f32>(1.0, 0.0));
  let c = reading(i + vec2<f32>(0.0, 1.0));
  let d = reading(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

fn lin(c: vec3<f32>) -> vec3<f32> {
  return select(pow((c + 0.055) / 1.055, vec3<f32>(2.4)), c / 12.92, c <= vec3<f32>(0.04045));
}

fn iron(u: f32) -> vec3<f32> {
  let x = clamp(u, 0.0, 1.0);
  var k = array<vec3<f32>, 7>(
    vec3<f32>(0.0, 0.0, 0.02),
    vec3<f32>(0.10, 0.04, 0.33),
    vec3<f32>(0.42, 0.07, 0.58),
    vec3<f32>(0.80, 0.16, 0.38),
    vec3<f32>(0.96, 0.45, 0.10),
    vec3<f32>(0.99, 0.78, 0.17),
    vec3<f32>(1.0, 0.98, 0.86),
  );
  let p = x * 6.0;
  let i = min(i32(floor(p)), 5);
  return mix(k[i], k[i + 1], p - f32(i));
}

fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let n = u_s().xy;
  let look = u_look();
  let t = sensor(in.uv);
  // the sensor's sharpening: a reading against the mean round it (five cells off), so hot things sit in a dark ring
  let r = 5.0 / n;
  var m = 0.0;
  for (var k = 0; k < 8; k++) {
    let a = f32(k) * 0.7853982;
    m += sensor(in.uv + vec2<f32>(cos(a), sin(a)) * r);
  }
  m = m / 8.0;
  let sharp = t + look.z * (t - m);
  // the span mapped onto the palette
  let u = (sharp - look.x) / max(look.y - look.x, 1e-3);
  var col = iron(u);
  if look.w > 0.5 {
    col = vec3<f32>(clamp(u, 0.0, 1.0));
  }
  // the lens's fall-off
  let v = in.uv - 0.5;
  col *= 1.0 - 0.35 * dot(v, v) * 2.0;
  return vec4<f32>(lin(col), 1.0);
}
`;

/** the pass: `frame` moves the noise; lo/hi the temperatures at the palette's ends; `sharp` the halo's strength */
export function Sensor({ frame, across = 256, lo = 0.05, hi = 0.95, sharp = 0.6, noise = 0.02, palette = "iron" }: { frame: number; across?: number; lo?: number; hi?: number; sharp?: number; noise?: number; palette?: Palette }) {
  return (
    <FramePass
      wesl={WESL}
      at="before-tonemap"
      uniforms={{ s: [across, Math.round((across * 9) / 16), frame % 997, noise], look: [lo, hi, sharp, palette === "white" ? 1 : 0] }}
    />
  );
}
