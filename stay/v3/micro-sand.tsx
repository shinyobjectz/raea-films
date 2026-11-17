// Micro: a seedling coming up through sand, seen at the size of the grains. the director, 11-12: "cut away to different macro
// shots like something rising in the sand or something while we fill that air time. i think i ment micro shots of
// things like how detailed and close up to things can we show".
// A radish's sprout, the lens 3 cm off it in a low evening sun from behind: the sand domes and cracks, the stem's hook
// shoulders up through it with grains riding on it, straightens and drags its seed leaves up out of the dark, the seed's
// coat slips off and tumbles, and the two leaves open into the light, the sun coming through them.
// Every grain is a grain (twelve thousand, each its own stone: quartz, feldspar, shell, a few dark ones), lying in the
// low sun's light with its own shadow; the ones by the sprout are moved by it.
import { AbsoluteFill, staticFile } from "raea";
import { AntiAliasing, Bloom, Canvas3D, DepthOfField, Environment, Instances, Shadows, ToneMapping } from "raea/3d";
import { Camera3d } from "raea/camera";
import { AmbientLight, DirectionalLight } from "raea/light";
import { BufferMesh, Capsule3d, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { clamp01, ease, ramp, type V3 } from "../v2/math";
import { FilmLook } from "./look";

// The world is built a hundred times its size (a millimetre is 10 cm): Bevy's sun shadows start 10 cm from the lens and
// its near plane and depth want the same, and none of it can tell. The lens's blur is set for the true size instead (its
// f-stop a hundredth of a macro lens's), so the depth of field is a few grains deep, as it is at 3 cm.
const MM = 0.1;
const rnd = (i: number, k: number) => { const x = Math.sin(i * 91.7 + k * 233.1 + 0.37) * 43758.5453; return x - Math.floor(x); };

// ---- the sand's face: a low ripple, and the ground under the grains ---------------------------------------------------
const surf = (x: number, z: number) => 0.35 * MM * Math.sin((x / MM) * 0.18 + (z / MM) * 0.06 + 0.4) + 0.12 * MM * Math.sin((x / MM) * 0.52 - (z / MM) * 0.31);

// ---- a grain: a rounded stone, an icosahedron split once and pushed in and out a little (three shapes) -------------
function pebble(seed: number, split = 2) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v: V3[] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const nrm = (p: V3): V3 => { const l = Math.hypot(...p); return [p[0] / l, p[1] / l, p[2] / l]; };
  v = v.map(nrm);
  for (let s = 0; s < split; s++) {
    const mid = new Map<string, number>(), nf: number[][] = [];
    const m = (a: number, b: number) => { const k = a < b ? `${a},${b}` : `${b},${a}`; let i = mid.get(k); if (i === undefined) { i = v.length; v.push(nrm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2])); mid.set(k, i); } return i; };
    for (const [a, b, c] of f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    f = nf;
  }
  // (lumps: a few broad bumps, so it is a worn stone, not a ball)
  const bumps = Array.from({ length: 8 }, (_, i) => ({ d: nrm([rnd(seed * 7 + i, 1) - 0.5, rnd(seed * 7 + i, 2) - 0.5, rnd(seed * 7 + i, 3) - 0.5]), k: 0.34 * (rnd(seed * 7 + i, 4) - 0.4), e: 2 + 4 * rnd(seed * 7 + i, 5) }));
  // (and a few flats where it broke: a quartz grain is a worn shard, not a bead)
  const cuts = Array.from({ length: 3 }, (_, i) => ({ d: nrm([rnd(seed * 5 + i, 6) - 0.5, rnd(seed * 5 + i, 7) - 0.5, rnd(seed * 5 + i, 8) - 0.5]), at: 0.72 + 0.18 * rnd(seed * 5 + i, 9) }));
  const P = v.map((p) => {
    let r = 1;
    for (const b of bumps) r += b.k * Math.max(0, p[0] * b.d[0] + p[1] * b.d[1] + p[2] * b.d[2]) ** b.e;
    for (const c of cuts) { const h = (p[0] * c.d[0] + p[1] * c.d[1] + p[2] * c.d[2]) * r; if (h > c.at) r *= (c.at + 0.25 * (h - c.at)) / h; }
    return [p[0] * r, p[1] * r, p[2] * r] as V3;
  });
  // smooth normals from the faces
  const N = P.map(() => [0, 0, 0] as V3);
  for (const [a, b, c] of f) {
    const u = [P[b][0] - P[a][0], P[b][1] - P[a][1], P[b][2] - P[a][2]], w = [P[c][0] - P[a][0], P[c][1] - P[a][1], P[c][2] - P[a][2]];
    const n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    for (const i of [a, b, c]) { N[i][0] += n[0]; N[i][1] += n[1]; N[i][2] += n[2]; }
  }
  return { positions: P.flat(), normals: N.map(nrm).flat(), indices: f.flat() };
}
const PEBBLES = [pebble(1), pebble(2), pebble(3)];
/** the far grains, out of focus: the same stones, coarser */
const FAR_PEBBLE = pebble(4, 1);

// ---- the sand: kinds of grain, how common, their stone ------------------------------------------------------------
type Kind = { share: number; mat: Record<string, unknown> };
const KINDS: Kind[] = [
  { share: 0.48, mat: { base_color: "#e6d9c0", perceptual_roughness: 0.42, diffuse_transmission: 0.45, reflectance: 0.6 } },   // quartz, frosted
  { share: 0.24, mat: { base_color: "#c79a63", perceptual_roughness: 0.6, diffuse_transmission: 0.2 } },                       // feldspar
  { share: 0.1, mat: { base_color: "#3b322b", perceptual_roughness: 0.38, reflectance: 0.6 } },                                // dark lithic
  { share: 0.09, mat: { base_color: "#a35a3c", perceptual_roughness: 0.55 } },                                                 // red
  { share: 0.09, mat: { base_color: "#f2ede2", perceptual_roughness: 0.3, diffuse_transmission: 0.3 } },                       // shell
];
type Grain = { p: V3; r: V3; s: V3; kind: number; shape: number; i: number };
const GRAINS: Grain[] = (() => {
  const out: Grain[] = [];
  const step = 0.36 * MM;
  let i = 0;
  for (let z = -50 * MM; z < 22 * MM; z += step) {
    // (only where the lens sees: the frustum widens with distance)
    const half = 6 * MM + 0.33 * Math.max(0, 30 * MM - z);
    for (let x = -half; x < half; x += step) {
      i++;
      const gx = x + step * (rnd(i, 1) - 0.5), gz = z + step * (rnd(i, 2) - 0.5);
      const d = 0.17 * MM + 0.13 * MM * rnd(i, 3) ** 1.5;
      let u = rnd(i, 4), kind = 0;
      for (; kind < KINDS.length - 1 && u > KINDS[kind].share; kind++) u -= KINDS[kind].share;
      out.push({ p: [gx, surf(gx, gz) + 0.45 * d, gz], r: [6.28 * rnd(i, 5), 6.28 * rnd(i, 6), 6.28 * rnd(i, 7)], s: [d * (0.8 + 0.4 * rnd(i, 8)), d * (0.65 + 0.3 * rnd(i, 9)), d * (0.8 + 0.4 * rnd(i, 10))], kind, shape: i % 3, i });
    }
  }
  return out;
})();
/** the grains the sprout moves: within this of where it comes up */
const NEAR = 3.6 * MM;
const near = (g: Grain) => Math.hypot(g.p[0], g.p[2]) < NEAR;
const STILL = KINDS.flatMap((_, k) => [0, 1, 2].map((sh) => ({ k, sh, at: GRAINS.filter((g) => g.kind === k && g.shape === sh && !near(g)).map((g) => ({ position: g.p, rotation: g.r, scale: g.s })) })));
const MOVED = GRAINS.filter(near);
/** past the near field, out to 25 cm: grains on a grid that widens with distance (the lens only sees them as glints and
 *  tone there), each the size its neighbours would make it */
const FAR = (() => {
  const out: { position: V3; rotation: V3; scale: V3; kind: number }[] = [];
  let i = 100000;
  for (let z = -50 * MM; z > -250 * MM;) {
    const step = 0.42 * MM * (1 + (-50 * MM - z) / (60 * MM));
    const half = 6 * MM + 0.33 * (30 * MM - z);
    for (let x = -half; x < half; x += step) {
      i++;
      const gx = x + step * (rnd(i, 1) - 0.5), gz = z + step * (rnd(i, 2) - 0.5), d = step * (0.55 + 0.35 * rnd(i, 3));
      let u = rnd(i, 4), kind = 0;
      for (; kind < KINDS.length - 1 && u > KINDS[kind].share; kind++) u -= KINDS[kind].share;
      out.push({ position: [gx, surf(gx, gz) + 0.4 * d, gz], rotation: [6.28 * rnd(i, 5), 6.28 * rnd(i, 6), 6.28 * rnd(i, 7)], scale: [d, d * 0.75, d], kind });
    }
    z -= step;
  }
  return KINDS.map((_, k) => out.filter((g) => g.kind === k).map(({ position, rotation, scale }) => ({ position, rotation, scale })));
})();

// ---- the sprout -------------------------------------------------------------------------------------------------
// Its stem is a tube along a line from the root, 4 mm down, up through the sand; the last of it bent over in a hook
// that straightens. Its head (the folded seed leaves in the seed's coat) is at the stem's end, along its line.
const SEG = 30, ROOT: V3 = [-0.7 * MM, -4 * MM, 0], STEM_R = 0.42 * MM;
/** the stem's length and its hook's bend, at t */
const growth = (t: number) => ({ L: (4.2 + 12.5 * ease(ramp(t, 0.05, 2.3)) ** 0.9) * MM, bend: Math.PI * (1 - ease(ramp(t, 0.95, 1.9))), hook: 3.6 * MM });
function stemAt(t: number) {
  const { L, bend, hook } = growth(t), ds = L / SEG;
  const pts: V3[] = [ROOT], ang: number[] = [];
  let p = ROOT;
  for (let i = 0; i < SEG; i++) {
    const s = (i + 0.5) * ds;
    // (the bend all in the hook, the stem's last few mm; a slight lean in the rest)
    const th = 0.08 + bend * ease(clamp01((s - (L - hook)) / hook));
    ang.push(th);
    p = [p[0] + ds * Math.sin(th), p[1] + ds * Math.cos(th), p[2]];
    pts.push(p);
  }
  return { pts, ang, ds };
}
/** a colour down a gradient of hex stops, linear rgb */
const lin = (h: string) => [1, 3, 5].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const grad = (stops: [number, string][], f: number) => {
  let i = 0;
  while (i < stops.length - 2 && f > stops[i + 1][0]) i++;
  const [f0, a] = stops[i], [f1, b] = stops[i + 1], k = clamp01((f - f0) / (f1 - f0)), A = lin(a), B = lin(b);
  return A.map((x, j) => x + (B[j] - x) * k);
};
/** the stem's colour from its root to its hook: a radish's, wine red low down, rose, then pale where it was in the dark */
const STEM_COLS: [number, string][] = [[0, "#6e1236"], [0.5, "#a8345c"], [0.78, "#d9a49a"], [1, "#e9e6b8"]];
/** the stem as one tube along its line, rings of 20, its tip closed by a half ball */
function stemTube(pts: V3[], ang: number[]) {
  const n = 20, P: number[] = [], N: number[] = [], C: number[] = [], I: number[] = [];
  const ring = (c: V3, a: number, r: number, lean: number, f: number) => {
    const nn: V3 = [Math.cos(a), -Math.sin(a), 0], T: V3 = [Math.sin(a), Math.cos(a), 0], col = grad(STEM_COLS, f);
    for (let j = 0; j < n; j++) {
      const ph = (j / n) * 2 * Math.PI, d: V3 = [nn[0] * Math.cos(ph), nn[1] * Math.cos(ph), Math.sin(ph)];
      // (a little fluting along it, so the light finds it)
      const rr = r * (1 + 0.025 * Math.sin(ph * 5 + f * 9));
      P.push(c[0] + rr * d[0], c[1] + rr * d[1], c[2] + rr * d[2]);
      const nv: V3 = [d[0] * Math.cos(lean) + T[0] * Math.sin(lean), d[1] * Math.cos(lean) + T[1] * Math.sin(lean), d[2] * Math.cos(lean)];
      N.push(...nv); C.push(col[0], col[1], col[2], 1);
    }
  };
  const last = pts.length - 1;
  for (let i = 0; i <= last; i++) {
    const a = i === 0 ? ang[0] : i === last ? ang[ang.length - 1] : (ang[i - 1] + ang[i]) / 2;
    ring(pts[i], a, STEM_R * (1 - 0.15 * (i / last)), 0, i / last);
  }
  const a = ang[ang.length - 1], T: V3 = [Math.sin(a), Math.cos(a), 0], r = STEM_R * 0.85;
  for (let k = 1; k <= 5; k++) { const p = (k / 5) * (Math.PI / 2); ring([pts[last][0] + T[0] * r * Math.sin(p), pts[last][1] + T[1] * r * Math.sin(p), 0], a, Math.max(r * Math.cos(p), 1e-5 * MM), p, 1); }
  const rings = P.length / 3 / n;
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < n; j++) { const a0 = i * n + j, b0 = i * n + ((j + 1) % n), c0 = a0 + n, d0 = b0 + n; I.push(a0, c0, b0, b0, c0, d0); }
  return { positions: P, normals: N, colors: C, indices: I };
}
/** a seed leaf: a radish's, a broad heart with a notch at its top, cupped, 5 mm, its base at the origin and its length
 *  along +y, its upper face toward +z; pale yellow where it was folded in the dark, greening to its edges */
const LEAF = (() => {
  const n = 18, m = 12, P: number[] = [], N: number[] = [], C: number[] = [], I: number[] = [];
  for (let j = 0; j <= n; j++) for (let i = 0; i <= m; i++) {
    const v = j / n, u = i / m - 0.5;
    // (wide at its top with a notch in the middle of it, narrowing to its stalk)
    const w = 1.7 * MM * Math.sin(Math.PI * Math.min(1, 0.12 + v * 0.98)) ** 0.7;
    const notch = 0.55 * MM * Math.exp(-(u * u) / 0.012) * Math.max(0, v - 0.7) / 0.3;
    const x = u * 2 * w, y = 5 * MM * v - notch, z = 0.8 * MM * (u * 2) ** 2 * Math.sin(Math.PI * Math.min(1, v * 1.2)) + 0.25 * MM * Math.sin(Math.PI * v);
    P.push(x, y, z);
    N.push((-x / MM) * 0.45, (-0.25) * Math.cos(Math.PI * v), 1);
    const c = grad([[0, "#f1ecb6"], [0.55, "#d6dd8a"], [1, "#a8c95e"]], 0.6 * v + 0.4 * Math.abs(u) * 2);
    C.push(c[0], c[1], c[2], 1);
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < m; i++) { const a = j * (m + 1) + i, b = a + 1, c = a + m + 1, d = c + 1; I.push(a, b, c, b, d, c); }
  for (let k = 0; k < N.length; k += 3) { const l = Math.hypot(N[k], N[k + 1], N[k + 2]); N[k] /= l; N[k + 1] /= l; N[k + 2] /= l; }
  return { positions: P, normals: N, colors: C, indices: I };
})();
const STEM_MAT = { base_color: "#ffffff", perceptual_roughness: 0.32, diffuse_transmission: 0.5, clearcoat: 0.5, clearcoat_perceptual_roughness: 0.25 };
const LEAF_MAT = { base_color: "#ffffff", perceptual_roughness: 0.42, diffuse_transmission: 0.8, double_sided: true, cull_mode: null };
const COAT_MAT = { base_color: "#5a3b26", perceptual_roughness: 0.55, clearcoat: 0.3 };

/** the grains by the sprout, at t: lifted by the dome before it breaks; then pushed off the stem and down the
 *  crater's side; a few ride up on the hook's shoulder and fall off it */
function movedAt(t: number, stem: V3[]) {
  const dome = 0.95 * MM * ease(ramp(t, 0.1, 0.6)) * (1 - 0.6 * ease(ramp(t, 0.55, 1.1)));
  const broke = ease(ramp(t, 0.42, 1.0));
  // the stem's points above the sand: what pushes
  const up = stem.filter((p) => p[1] > -0.4 * MM);
  return MOVED.map((g) => {
    const r0 = Math.hypot(g.p[0], g.p[2]), u: [number, number] = r0 > 1e-6 ? [g.p[0] / r0, g.p[2] / r0] : [1, 0];
    // out from the middle as it breaks: the nearer, the further, and down what was the dome
    const push = broke * 1.4 * MM * Math.exp(-((r0 / (1.6 * MM)) ** 2)) * (0.7 + 0.6 * rnd(g.i, 11));
    let x = g.p[0] + u[0] * push, z = g.p[2] + u[1] * push;
    const r1 = Math.hypot(x, z);
    let y = g.p[1] + dome * Math.exp(-((r1 / (1.8 * MM)) ** 2)) + broke * 0.35 * MM * Math.exp(-(((r1 - 1.9 * MM) / (0.7 * MM)) ** 2));
    // (and off the stem itself: nothing stands inside it)
    for (const p of up) {
      const dx = x - p[0], dy = y - p[1], dz = z - p[2], d = Math.hypot(dx, dy, dz), need = STEM_R + g.s[1] * 0.9;
      if (d < need && d > 1e-7) { x = p[0] + (dx / d) * need; y = p[1] + (dy / d) * need; z = p[2] + (dz / d) * need; }
    }
    // the riders: a handful from right over the hook, carried up on it until it straightens, then dropped
    if (r0 < 0.9 * MM && rnd(g.i, 12) < 0.5) {
      const apex = stem.reduce((a, b) => (b[1] > a[1] ? b : a));
      const off = 0.9 * MM * (rnd(g.i, 13) - 0.5), lift = clamp01((apex[1] - g.p[1]) / MM);
      const fall = Math.max(0, t - (1.15 + 0.4 * rnd(g.i, 14)));
      if (lift > 0) {
        const ride: V3 = [apex[0] + off, apex[1] + STEM_R + g.s[1], apex[2] + 0.4 * off];
        const g0: V3 = [ride[0] + (rnd(g.i, 15) - 0.3) * 4 * MM * fall, Math.max(g.p[1], ride[1] - 16 * MM * fall * fall), ride[2] + (rnd(g.i, 16) - 0.5) * 3 * MM * fall];
        if (fall <= 0 || g0[1] > g.p[1]) { x = g0[0]; y = g0[1]; z = g0[2]; } else { x = g0[0]; z = g0[2]; }
      }
    }
    const spin = broke * 3 * (rnd(g.i, 17) - 0.5);
    return { kind: g.kind, shape: g.shape, at: { position: [x, y, z] as V3, rotation: [g.r[0] + spin, g.r[1], g.r[2] + spin] as V3, scale: g.s } };
  });
}

/** the seed's coat: on the folded leaves until 1.75 s, then off, tumbling down onto the sand */
const COAT_OFF = 1.75;

export function Sand({ t }: { t: number }) {
  const { pts, ang } = stemAt(t);
  const tip = pts[pts.length - 1], th = ang[ang.length - 1];
  const dir: V3 = [Math.sin(th), Math.cos(th), 0];
  // the leaves: folded together along the stem's line, then opening; and turning up to the light as it straightens
  const open = ease(ramp(t, 1.85, 2.45));
  // (each turned a quarter about the stem so they part left and right of it, upper faces to each other, then up)
  const leafRot = (side: number) => Quat.mul(Quat.mul(Quat.fromRotationZ(-th), Quat.fromRotationY((side * Math.PI) / 2)), Quat.fromRotationX(-(0.06 + 1.05 * open)));
  // the coat
  const off = Math.max(0, t - COAT_OFF);
  const coatAt: V3 = off <= 0 ? [tip[0] + dir[0] * 4.2 * MM, tip[1] + dir[1] * 4.2 * MM, tip[2]] : [tip[0] + dir[0] * 4.2 * MM + 5 * MM * off, Math.max(surf(6 * MM, 0) + 0.6 * MM, tip[1] + dir[1] * 4.2 * MM + 6 * MM * off - 14 * MM * off * off), tip[2] + 1.5 * MM * off];
  const moved = movedAt(t, pts);
  // the lens: low over the sand, 3 cm off, drifting in and rising with the sprout
  const k = ease(clamp01(t / 2.45));
  const look: V3 = [0.3 * MM, (1.2 + 3.2 * k) * MM, 0];
  const eye: V3 = [4 * MM - 2 * MM * k, (5.5 + 2 * k) * MM, 30 * MM - 6 * MM * k];
  const focus = Math.hypot(eye[0] - look[0], eye[1] - look[1], eye[2] - look[2]);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas3D>
        <Camera3d transform={Transform.fromXyz(...eye).lookingAt(look)} projection={{ Perspective: { fov: (28 * Math.PI) / 180, near: 0.5 * MM, far: 4000 * MM } }}>
          <DepthOfField focal_distance={focus} aperture_f_stops={0.45} max_circle_of_confusion_diameter={60} mode={"Bokeh" as never} />
        </Camera3d>
        <AntiAliasing mode="smaa" />
        <ToneMapping mode="agx" exposure={-0.6} />
        <Bloom intensity={0.25} threshold={0.85} />
        <Shadows mapSize={8192} distance={90 * MM} firstCascade={36 * MM} cascades={2} />
        <Environment src={staticFile("hdri/the_sky_is_on_fire.hdr")} intensity={0.4} rotation={0} background />
        <AmbientLight color="#000000" brightness={0} />
        {/* the low sun, from behind the sprout and a little to the left: it rims the grains and comes through the leaves */}
        <DirectionalLight illuminance={42000} color="#ffc98a" shadow_maps_enabled transform={Transform.fromXyz(-0.35, 0.22, -1).lookingAt([0, 0, 0])} />
        {/* the ground under the grains (damp, darker, where the dome cracks open) and the sand far off */}
        <Mesh3d name="sand-under" allowOverlap transform={Transform.fromXyz(0, -0.1 * MM, 0)}><BufferMesh {...UNDER} /><StandardMaterial base_color="#6e5a42" perceptual_roughness={0.95} /></Mesh3d>
        {STILL.map(({ k, sh, at }) => (
          <Instances key={`s${k}${sh}`} name={`grains-${k}-${sh}`} at={at} {...({ allowOverlap: true } as object)}><BufferMesh {...PEBBLES[sh]} /><StandardMaterial {...(KINDS[k].mat as object)} /></Instances>
        ))}
        {FAR.map((at, k) => (
          <Instances key={`f${k}`} name={`grains-far-${k}`} at={at} {...({ allowOverlap: true } as object)}><BufferMesh {...FAR_PEBBLE} /><StandardMaterial {...(KINDS[k].mat as object)} /></Instances>
        ))}
        {KINDS.flatMap((_, kk) => [0, 1, 2].map((sh) => (
          <Instances key={`m${kk}${sh}`} name={`grains-moved-${kk}-${sh}`} at={moved.filter((m) => m.kind === kk && m.shape === sh).map((m) => m.at)} {...({ allowOverlap: true } as object)}><BufferMesh {...PEBBLES[sh]} /><StandardMaterial {...(KINDS[kk].mat as object)} /></Instances>
        )))}
        <Mesh3d name="stem" allowOverlap><BufferMesh {...stemTube(pts, ang)} /><StandardMaterial {...STEM_MAT} /></Mesh3d>
        {[1, -1].map((side) => (
          <Mesh3d key={side} name={`seed-leaf-${side > 0 ? "a" : "b"}`} allowOverlap transform={Transform.fromXyz(tip[0] + dir[0] * 0.2 * MM - side * Math.cos(th) * (0.12 + 0.2 * open) * MM, tip[1] + dir[1] * 0.2 * MM + side * Math.sin(th) * (0.12 + 0.2 * open) * MM, tip[2]).withRotation(leafRot(side))}>
            <BufferMesh {...LEAF} /><StandardMaterial {...LEAF_MAT} />
          </Mesh3d>
        ))}
        <Mesh3d name="seed-coat" allowOverlap transform={Transform.fromXyz(...coatAt).withRotation(Quat.fromRotationZ(-th + 3.5 * off)).withScale([1.15, 1.5, 1.15])}>
          <Capsule3d radius={1.25 * MM} half_length={0.3 * MM} /><StandardMaterial {...COAT_MAT} />
        </Mesh3d>
        <FilmLook look={{ base: 0, warm: 0.35, sat: 1.0, contrast: 0.6, halation: 0.6, vignette: 0.28 }} seed={1821} lines={false} />
      </Canvas3D>
    </AbsoluteFill>
  );
}

// the ground under the grains, out to where the lens can't tell grains from sand
const UNDER = (() => {
  const P: number[] = [], N: number[] = [], U: number[] = [], I: number[] = [], nx = 160, nz = 160, x0 = -80 * MM, x1 = 80 * MM, z0 = -300 * MM, z1 = 30 * MM;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx, z = z0 + (z1 - z0) * (j / nz) ** 0.5;
    P.push(x, surf(x, z), z); N.push(0, 1, 0); U.push((x / MM) * 0.2, (z / MM) * 0.2);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  return { positions: P, normals: N, uvs: U, indices: I };
})();
