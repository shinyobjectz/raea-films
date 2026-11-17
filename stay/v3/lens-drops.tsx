// Water on the lens: the sea's burst throws drops onto it. the director, 11-12, on the ocean rock: "maybe a little bit of water
// splash on the lens like drops".
// The lens is focused far off, so a drop on its glass is far out of focus: a soft round where the picture behind it is
// bent and swum (a drop is a little lens of its own: it turns what is behind it over and draws it small), with a faint
// bright meniscus at its edge and a crescent of light focused through it at its foot. They land in a quick spatter,
// the most low and to the right (the burst comes up there), a few run down, and they thin away. At the instant of the
// hit the whole frame shivers once, a sheet of water across the glass.
// (the first drops were small, crisp-edged and dark-rimmed: marbles in the air, not water on the glass; the second, twelve
// turned-over lenses with sparse taps, read as patterned glass balls: now seven, soft, barely bent)
//   <LensDrops age={seconds since the hit} />   (below 0: none)
import { FramePass } from "raea/3d";

const N = 7;
const DROPS_WGSL = /* wgsl */ `
fn h1(n: f32) -> f32 { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
fn shade(in: FullscreenVertexOutput) -> vec4<f32> {
  let uv = in.uv; let P = u_drops(); let age = P.x;
  let c0 = frame(uv);
  if (age < 0.0 || age > 4.0) { return c0; }
  let dims = vec2<f32>(textureDimensions(raea_frame)); let asp = dims.x / dims.y;
  // the sheet at the hit: the frame pulled by a ripple running across it, gone in a quarter second
  let sheet = exp(-age * 14.0) * smoothstep(0.0, 0.02, age);
  let wob = sheet * 0.014 * vec2<f32>(sin(uv.y * 23.0 + age * 60.0), cos(uv.x * 17.0 - age * 50.0));
  var e = frame(uv + wob).rgb;
  for (var i = 0; i < ${N}; i++) {
    let s = f32(i) * 7.31 + P.z;
    // where it lands (skewed low and right), how big (most middling, a few big), when (in the first fifth of a second),
    // how long it stays, and whether it runs
    let x = mix(0.06, 0.98, pow(h1(s), 0.7)); let y0 = mix(0.1, 0.96, pow(h1(s + 1.0), 0.6));
    let r = mix(0.03, 0.08, pow(h1(s + 2.0), 1.8));
    let t0 = 0.2 * h1(s + 3.0); let life = mix(1.0, 2.1, h1(s + 4.0));
    let a = age - t0;
    if (a <= 0.0) { continue; }
    let runs = step(0.6, h1(s + 5.0));
    let y = y0 + runs * 0.045 * a * a;
    let d = (uv - vec2<f32>(x, y)) * vec2<f32>(asp, 1.0) / vec2<f32>(r, r * (1.0 + 0.4 * runs * min(a, 1.0)));
    let l = length(d);
    if (l > 1.0) { continue; }
    let fade = (1.0 - smoothstep(0.5 * life, life, a)) * smoothstep(0.0, 0.05, a) * P.y;
    // what it shows: the picture behind, a little magnified and far softer (the drop is out of focus at the glass; a
    // strong turn-over and a few sparse taps drew patterned glass marbles, Stay a25)
    let h = sqrt(max(0.0, 1.0 - l * l));
    let src = vec2<f32>(x, y) + (uv - vec2<f32>(x, y)) * (1.0 - 0.45 * h);
    let bl = r * 0.7 / vec2<f32>(asp, 1.0);
    var inside = vec3<f32>(0.0);
    for (var j = 0; j < 24; j++) {
      let fj = f32(j) + 0.5; let rr = sqrt(fj / 24.0); let an = fj * 2.39996323;
      inside += frame(src + vec2<f32>(cos(an), sin(an)) * rr * bl).rgb;
    }
    inside = inside / 24.0 * 1.04;
    // the meniscus, barely: a faint bright rim; the light it focuses, a faint crescent at its foot
    inside += vec3<f32>(0.85, 0.92, 1.0) * 0.04 * exp(-pow((l - 0.82) * 7.0, 2.0));
    let cres = smoothstep(0.35, 0.8, d.y) * exp(-pow((l - 0.7) * 5.0, 2.0));
    inside += vec3<f32>(1.0, 0.97, 0.9) * 0.05 * cres;
    let k = 0.8 * fade * (1.0 - smoothstep(0.35, 1.0, l));
    e = mix(e, inside, k);
  }
  return vec4<f32>(e, c0.a);
}`;

/** the drops, `age` seconds after the hit; `amount` 0..1 */
export function LensDrops({ age, amount = 1, seed = 3 }: { age: number; amount?: number; seed?: number }) {
  return <FramePass wgsl={DROPS_WGSL} uniforms={{ drops: [age, amount, seed, 0] }} />;
}
