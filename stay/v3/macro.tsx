// After the rain on the window, before the dock: a slow run of macro shots of the rain, close enough to see what the
// film has never shown, water as a lens. the director, 11-12, on assembly 24, of the road: "i am asking for a contiuation of
// that set of shots showing different macros shots after the rain shot so that befire we go to the dock/ship scene its
// a slow cut between some really beautiful macro shots that show somethign we havent show nbefore".
//   bead    a drop on the outside of the kid's window, from inside, 5 cm off: the night yard turned over in it, the
//           street lamps blooming behind; the lens drifts in and the drop lets go and runs, leaving beads behind it
//   splash  (next)
//   web     (next)
// The drops are lenses, not pictures: each is drawn by tracing the eye's ray through it (in at the glass, through the
// water, out at its curved face, bent each time as water bends light), and what the ray meets out there is the night
// (`world`, below), the same night the background is drawn from, so what is upside down in a drop is what is behind it.
import { AbsoluteFill } from "raea";
import { AntiAliasing, Bloom, Canvas3D, DepthOfField, ShaderMesh, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { Transform } from "raea/transform";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import { FilmLook } from "./look";

// ---- the night, as seen from anywhere by the window: a direction's colour, linear light --------------------------
// Outside (-z): a low cloud lit sodium by the town, firs against it, the wet lawn, three street lamps and a neighbour's
// window. Inside (+z, only through a drop's rim): the kid's room, dim and warm, its desk lamp.
const WORLD_WGSL = /* wgsl */ `
fn hs(n: f32) -> f32 { return fract(sin(n * 127.1 + 17.3) * 43758.5453); }
fn vn1(x: f32) -> f32 { let i = floor(x); let f = fract(x); let u = f * f * (3.0 - 2.0 * f); return mix(hs(i), hs(i + 1.0), u); }
fn ang(d: vec3<f32>, at: vec3<f32>) -> f32 { return acos(clamp(dot(d, normalize(at)), -1.0, 1.0)); }
fn lamp(d: vec3<f32>, at: vec3<f32>, core: f32, i: f32) -> f32 {
  let a = ang(d, at);
  return i * exp(-(a * a) / (core * core)) + i * 0.02 * exp(-a / (core * 4.0)) + i * 0.0005 * exp(-a / (core * 25.0));
}
fn room(d: vec3<f32>) -> vec3<f32> {
  return vec3<f32>(0.022, 0.013, 0.007) + vec3<f32>(1.0, 0.62, 0.3) * lamp(d, vec3<f32>(0.55, -0.15, 1.0), 0.05, 6.0);
}
fn world(d0: vec3<f32>) -> vec3<f32> {
  let d = normalize(d0);
  if (d.z > 0.15) { return room(d); }
  let y = d.y;
  var c = mix(vec3<f32>(0.0045, 0.0075, 0.016), vec3<f32>(0.0012, 0.002, 0.0055), clamp(y * 1.5, 0.0, 1.0));
  c += vec3<f32>(0.07, 0.036, 0.013) * exp(-max(y, 0.0) * 9.0) * 0.12;            // (the town's glow under the cloud)
  c += vec3<f32>(0.012, 0.018, 0.032) * exp(-pow(ang(d, vec3<f32>(-0.4, 0.6, -1.0)) / 0.3, 2.0)) * 0.7;   // (the moon behind cloud)
  let az = atan2(d.x, -d.z);
  let ridge = 0.04 + 0.15 * vn1(az * 4.0 + 3.0) + 0.06 * vn1(az * 13.0 + 1.0) + 0.025 * vn1(az * 47.0);
  if (y < ridge) { c = vec3<f32>(0.0022, 0.0028, 0.0032); }                         // (the firs)
  if (y < -0.015) { c = vec3<f32>(0.0035, 0.0042, 0.0045) * (1.0 + 3.0 * exp(y * 25.0)); }   // (the wet lawn)
  let sodium = vec3<f32>(1.0, 0.56, 0.22);
  c += sodium * (lamp(d, vec3<f32>(0.3, 0.07, -1.0), 0.011, 45.0) + lamp(d, vec3<f32>(-0.52, 0.035, -1.0), 0.007, 30.0) + lamp(d, vec3<f32>(0.9, 0.02, -1.0), 0.005, 18.0));
  c += vec3<f32>(1.0, 0.72, 0.42) * lamp(d, vec3<f32>(-0.13, 0.012, -1.0), 0.016, 3.0);   // (a neighbour's window)
  return c;
}`;

// a drop on the glass: the glass is the plane z 0, the room (and the lens) on +z, the drop outside on -z. Drawn on
// its footprint, a disc on the glass; `drop` is its sphere's centre and radius
const BEAD_WGSL = WORLD_WGSL + /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> {
  let P = in.world_position.xyz; let V = normalize(P - view.world_position);
  let D = u_drop(); let C = D.xyz; let R = D.w;
  // in through the glass and into the water (the glass is thin and nearly the water's index: one bend)
  let T1 = refract(V, vec3<f32>(0.0, 0.0, 1.0), 1.0 / 1.33);
  // across the water to its curved face, and out (or turned back, past the critical angle, at its rim)
  let oc = P - C; let b = dot(oc, T1); let cc = dot(oc, oc) - R * R;
  let s = -b + sqrt(max(b * b - cc, 0.0));
  let N = normalize(P + s * T1 - C);
  let T2 = refract(T1, -N, 1.33);
  let ci = clamp(dot(T1, N), 0.0, 1.0);
  var F = 0.02 + 0.98 * pow(1.0 - ci, 5.0);
  var out_ = vec3<f32>(0.0);
  if (dot(T2, T2) < 1e-6) { F = 1.0; } else { out_ = world(T2); }
  let col = mix(out_, room(reflect(T1, -N)), F) * vec3<f32>(0.96, 0.99, 1.0);
  return vec4<f32>(col, 1.0);
}`;

// the night behind it all, on a sphere round the lens
const SKY_WGSL = WORLD_WGSL + /* wgsl */ `
fn shade(in: VertexOutput) -> vec4<f32> { return vec4<f32>(world(in.world_position.xyz - view.world_position), 1.0); }`;

// ---- a drop: its footprint on the glass (x, y), the footprint's radius, and the angle the water meets the glass at
type Drop = { x: number; y: number; a: number; th: number };
/** its sphere: the centre on the room's side of the glass when the cap is less than a half (as it always is) */
const sphereOf = (d: Drop): [number, number, number, number] => { const R = d.a / Math.sin(d.th), h = R * (1 - Math.cos(d.th)); return [d.x, d.y, R - h, R]; };
const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 233.1) * 43758.5453; return x - Math.floor(x); };
/** the rain on the pane: most of it fine, some middling, a few big; none on another (a drop that touched one would
 *  have run into it) */
const PANE: Drop[] = (() => {
  const out: Drop[] = [{ x: 0, y: 0, a: 0.0026, th: 1.25 }];
  for (let i = 0; out.length < 260 && i < 9000; i++) {
    const u = rnd(i, 3), a = u < 0.62 ? 0.00025 + 0.0005 * rnd(i, 4) : u < 0.92 ? 0.0007 + 0.0009 * rnd(i, 4) : 0.0017 + 0.0012 * rnd(i, 4);
    const d: Drop = { x: -0.032 + 0.064 * rnd(i, 1), y: -0.03 + 0.06 * rnd(i, 2), a, th: 1.05 + 0.35 * rnd(i, 5) };
    // (the hero's path down the glass kept clear: it runs there)
    if (Math.abs(d.x) < 0.0034 && d.y < 0.003) continue;
    if (out.every((o) => Math.hypot(o.x - d.x, o.y - d.y) > o.a + d.a + 0.0005)) out.push(d);
  }
  return out;
})();
/** the hero lets go at 0.95 s and runs down the glass, slowly gathering speed; behind it, the beads it leaves */
const RUN_FROM = 0.95;
const runOf = (t: number) => -0.011 * Math.max(0, t - RUN_FROM) ** 2;
const TRAIL = Array.from({ length: 7 }, (_, i) => ({ y: -0.0035 - 0.0011 * i, a: 0.00022 + 0.00018 * rnd(i, 9), x: 0.0004 * (rnd(i, 8) - 0.5) }));

function Bead({ t }: { t: number }) {
  // the lens: 5 cm off the glass, looking down across it a little, drifting in toward the drop and following it down
  const k = ease(clamp01(t / 1.9));
  const hy = runOf(t);
  const look: V3 = [0, 0.0003 + 0.55 * hy, 0];
  const eye: V3 = [0.021 - 0.007 * k, 0.003 - 0.002 * k + 0.5 * hy, 0.05 - 0.013 * k];
  const focus = Math.hypot(eye[0], eye[1] - hy, eye[2]);
  const drops: Drop[] = [{ ...PANE[0], y: hy }, ...PANE.slice(1)];
  // the beads it has left, each where it passed and from when it passed
  for (const b of TRAIL) if (hy < b.y - 0.0028) drops.push({ x: b.x, y: b.y, a: b.a, th: 1.2 });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (30 * Math.PI) / 180, near: 0.002, far: 100 } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={2.2} max_circle_of_confusion_diameter={80} mode={"Bokeh" as never} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={1.0} />
        <Bloom intensity={0.25} threshold={0.9} />
        <ShaderMesh name="night" shape={{ primitive: "Sphere", radius: 40 }} position={eye} doubleSided wgsl={SKY_WGSL} />
        {drops.map((d, i) => (
          <ShaderMesh key={i} name={`bead-${i}`} shape={{ primitive: "Circle", radius: d.a }} position={[d.x, d.y, 0.00002]} wgsl={BEAD_WGSL} uniforms={{ drop: sphereOf(d) }} />
        ))}
        <FilmLook look={{ base: 0, warm: -0.1, sat: 0.95, contrast: 0.6, halation: 0.7, vignette: 0.3 }} seed={1699} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

export const MACRO_IDS = ["bead"];
export function Macro({ id, t }: { id: string; t: number }) {
  if (id === "bead") return <Bead t={t} />;
  return <AbsoluteFill style={{ background: "#000" }} />;
}
