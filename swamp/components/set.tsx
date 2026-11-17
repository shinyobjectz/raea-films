// The swamp: every prop of the hype film, built here (no models, no pictures from outside), each taking the film's
// four values (sun, water, grow, dusk) so the dead grey world and the living one are the same parts.
import type { ReactNode } from "react";
import { interpolate, staticFile } from "raea";
import { Entity, Instances, Model, crossSection, grow, manifold, scatter, sdf } from "raea/3d";
import { LinearRgba, Srgba } from "raea/color";
import { Cuboid, Cylinder, Mesh3d, Sphere, Torus } from "raea/mesh";
import { ExtendedMaterial, FogVolume, PaintExtension, StandardMaterial, WearExtension } from "raea/pbr";
import { Affine2 } from "raea/math";
import { Quat, Transform } from "raea/transform";
import { GLASS_Z, KB, KB_YAW, KEYS, KEY_WIDTHS, MON, MON_ROT, RINGS, SH, SW, U, type V3, clamp, hex, keyDown, keyLocal, lerp, rnd, tremorAt } from "./timeline";

export type World = { f: number; power: number; sun: number; water: number; grow: number; dusk: number; /** the note's answer: mist over the water */ mist?: number };
const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);
const quat = (x: number, y: number, z: number) => Quat.fromEuler("XYZ", x, y, z);

// ------------------------------------------------------------------ the monitor
const BW = SW + 0.36, BH = SH + 0.36, BD = 0.3; // the bezel's box
const BODY = manifold
  .roundedBox(BW, BH, BD, 0.07)
  .minus(manifold.box(SW, SH, 0.2).move(0, 0, BD / 2 + 0.1 - (BD / 2 - GLASS_Z) - 0.0)) // the recess the glass sits in
  .union(manifold.roundedBox(BW * 0.62, BH * 0.6, 0.34, 0.14).move(0, 0.05, -0.27)); // the bulge at the back
const NECK = manifold.roundedBox(0.62, 1.3, 0.2, 0.05).move(0, -BH / 2 - 0.45, -0.2).union(manifold.roundedBox(1.9, 0.12, 1.1, 0.05).move(0, -BH / 2 - 1.05, -0.1));
// moss: lumps along the top edge and down the left corner, and one on the lower right
const mossLump = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => sdf.ellipsoid(rx, ry, rz).move(x, y, z);
const MOSS = sdf
  .smoothUnion(
    0.12,
    mossLump(-1.7, BH / 2 + 0.02, 0.02, 0.55, 0.1, 0.2),
    mossLump(-0.9, BH / 2 + 0.03, 0.0, 0.4, 0.08, 0.19),
    mossLump(-2.16, BH / 2 - 0.25, 0.03, 0.1, 0.4, 0.19),
    mossLump(0.4, BH / 2 + 0.02, -0.02, 0.5, 0.07, 0.18),
    mossLump(1.75, BH / 2 + 0.03, 0.0, 0.45, 0.1, 0.2),
    mossLump(2.15, -BH / 2 + 0.22, 0.04, 0.09, 0.3, 0.18),
    mossLump(1.2, -BH / 2 + 0.0, 0.06, 0.6, 0.08, 0.14),
  )
  .displace(0.035, 7, 3, 4)
  .solid(0.022);
// a vine over the top right corner and down the front of the bezel
const VINE_PTS: [number, number, number, number][] = [
  [2.4, -1.5, -0.2, 0.03], [2.3, -0.6, -0.12, 0.028], [2.22, 0.5, 0.0, 0.026], [2.1, 1.25, 0.12, 0.024], [1.85, 1.34, 0.17, 0.022],
  [1.6, 1.2, 0.19, 0.02], [1.55, 0.9, 0.19, 0.017], [1.7, 0.6, 0.19, 0.014], [1.62, 0.32, 0.19, 0.01],
];
const VINE = sdf.tube(VINE_PTS).solid(0.012);
const LEAF = sdf.ellipsoid(0.07, 0.008, 0.045).move(0.07, 0, 0).solid(0.006);
const VINE_LEAVES = Array.from({ length: 16 }, (_, i) => {
  const t = 2 + (i / 15) * (VINE_PTS.length - 3);
  const a = VINE_PTS[Math.floor(t)], b = VINE_PTS[Math.min(VINE_PTS.length - 1, Math.floor(t) + 1)], k = t - Math.floor(t);
  return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k) + 0.02] as V3, yaw: rnd(i, 31) * 6.28, roll: (rnd(i, 32) - 0.5) * 1.2, s: 0.7 + rnd(i, 33) * 0.7, flower: i % 5 === 2 };
});
const PETALS = grow.rosette({ leaves: 7, length: 0.05, width: 0.03, thick: 0.006, tilt: 50, rise: 0.01 });

export function Monitor({ w, children, emit, real }: { w: World; children?: ReactNode; emit: [number, number, number]; /** photoreal: no modelled moss or vine, the growth on it is scanned (world.tsx) */ real?: boolean }) {
  const moss = hex(hex("#57503c", "#5b6b3c", w.sun * 0.5), "#5f9a3e", w.grow);
  const lit = w.power;
  return (
    <Entity transform={Transform.fromXyz(...MON).withRotation(quat(...MON_ROT))}>
      <Mesh3d name="monitor-body" shape={BODY}>
        <StandardMaterial base_color={real ? "#1d1f1e" : "#494c47"} perceptual_roughness={real ? 0.42 : 0.62} />
      </Mesh3d>
      <Mesh3d name="monitor-neck" allowOverlap shape={NECK}>
        <StandardMaterial base_color={real ? "#181a19" : "#3e413d"} perceptual_roughness={real ? 0.5 : 0.7} />
      </Mesh3d>
      {/* what the room is lit by: a plain emitter just behind the picture, the colour and strength of what the page shows */}
      {/* the paint finish needs one plain mesh in the screen's pass to draw the rest: a small block sealed inside the body */}
      <Mesh3d name="monitor-core" pass="ui" allowOverlap transform={Transform.fromXyz(0, 0, -0.02)}><Cuboid half_size={[0.05, 0.05, 0.02]} /><StandardMaterial base_color="#0b0d0c" /></Mesh3d>
      <Mesh3d name="monitor-light" allowOverlap transform={Transform.fromXyz(0, 0, GLASS_Z + 0.003)}>
        <Cuboid half_size={[SW / 2, SH / 2, 0.002]} />
        <StandardMaterial base_color="#0b0d0c" perceptual_roughness={0.2} emissive={new LinearRgba(emit[0] * lit, emit[1] * lit, emit[2] * lit, 1)} />
      </Mesh3d>
      {children}
      <Mesh3d name="monitor-led" allowOverlap transform={Transform.fromXyz(BW / 2 - 0.22, -BH / 2 + 0.085, BD / 2 + 0.002)}>
        <Sphere radius={0.012} />
        <StandardMaterial base_color="#1c1f1d" emissive={glow("#9fe8c0", 60 * lit)} />
      </Mesh3d>
      {!real && <Mesh3d name="monitor-moss" allowOverlap shape={MOSS}>
        <StandardMaterial base_color={moss} perceptual_roughness={1} />
      </Mesh3d>}
      {!real && <Mesh3d name="monitor-vine" allowOverlap shape={VINE}>
        <StandardMaterial base_color={hex("#4a4033", "#476b2e", w.grow)} perceptual_roughness={0.9} />
      </Mesh3d>}
      {!real && VINE_LEAVES.map((l, i) => {
        const g = interpolate(w.grow, [0.25 + (i / 16) * 0.4, 0.55 + (i / 16) * 0.4], [0, 1], clamp);
        if (g <= 0) return null;
        return (
          <Entity key={i} transform={Transform.fromXyz(...l.p).withRotation(quat(l.roll, l.yaw, 0.3)).withScale([g * l.s, g * l.s, g * l.s])}>
            <Mesh3d name={`vine-leaf-${i}`} allowOverlap shape={LEAF}>
              <StandardMaterial base_color="#6aa544" perceptual_roughness={0.8} />
            </Mesh3d>
            {l.flower && (
              <Mesh3d name={`vine-flower-${i}`} allowOverlap shape={PETALS} transform={Transform.fromXyz(0, 0.02, 0.02).withRotation(quat(1.2, 0, 0))}>
                <StandardMaterial base_color="#f3e3ec" perceptual_roughness={0.7} />
              </Mesh3d>
            )}
          </Entity>
        );
      })}
    </Entity>
  );
}

// ------------------------------------------------------------------ the keyboard
// a chunky vintage board: a deep beige case with a wide border and a tall ridge behind the top row, the keys in a well
const KW = 15 * U + 0.2, KD = 5 * U + 0.24;
const KB_BASE = manifold
  .roundedBox(KW, 0.16, KD, 0.03)
  .move(0, -0.07, -0.03)
  .union(manifold.roundedBox(KW, 0.11, 0.12, 0.03).move(0, 0.01, -KD / 2 + 0.03)) // the ridge at the back
  .minus(manifold.box(15 * U + 0.012, 0.06, 5 * U + 0.012).move(0, 0.022, 0)); // the well the keys stand in
const CAP_H = 0.052;
// procedural grime (scripts/make_grime.py): a seamless tile that multiplies the plastic's colour
const GRIME = staticFile("textures/grime.png");
// a keycap: tall, tapered hard to a small dished top, the way old terminal keys are
const CAPS = new Map(
  KEY_WIDTHS.map((w) => {
    const hx = (w * U - 0.01) / 2;
    return [
      w,
      manifold
        .roundedBox(w * U - 0.01, CAP_H, U - 0.01, 0.01)
        .refineToLength(0.012)
        .warp((x, y, z) => {
          const t = (y + CAP_H / 2) / CAP_H; // 0 at the foot, 1 at the top
          const kx = 1 - (0.024 / hx) * t * 0.5, kz = 1 - 0.3 * t;
          const dish = t > 0.6 ? 0.0055 * (1 - Math.min(1, (x / hx) * (x / hx))) * ((t - 0.6) / 0.4) : 0;
          return [x * kx, y - dish, z * kz - 0.004 * t];
        }),
    ];
  }),
);
const LEGEND = new Map("abcdefghijklmnopqrstuvwxyz1234567890".split("").map((c) => [c, manifold.text3d(c.toUpperCase(), 0.03, 0.003)]));
// two tones and one accent: cream letters, grey-brown modifiers, a rust Return
const capColor = (id: string) => (id === "return" ? "#8f432c" : id.length > 1 ? "#625d53" : "#a39a82");
const MISSING = "]"; // one cap long gone: its stem shows
const BLADE = grow.loft([[0, "rect 0.012 0.004"], [0.1, "rect 0.011 0.003"], [0.2, "rect 0.007 0.003"], [0.27, "rect 0.002 0.002"]]).refineToLength(0.04).warp((x, y, z) => [x + y * y * 1.1, y, z]);
// grass: thick round the slab, thinner over it, none on the keys the robot hits
const inKb = (x: number, z: number) => {
  const dx = x - KB[0], dz = z - KB[2];
  return Math.abs(dx) < KW / 2 && Math.abs(dz) < KD / 2;
};
const GRASS = scatter({ area: { min: [KB[0] - 1.9, KB[2] - 0.75], max: [KB[0] + 1.9, KB[2] + 0.72] }, count: 1500, spacing: 0.022, seed: 7, yaw: [0, 6.28], tilt: 0.35, scale: [0.6, 1.5], y: () => 0.2, density: (x, z) => (inKb(x, z) ? 0.1 : Math.hypot((x - KB[0]) / 2.0, (z - KB[2]) / 0.8) < 1 ? 1 : 0) });
const PEBBLE = [0, 1, 2].map((s) => grow.boulder({ size: 0.09, squash: 0.6, rough: 0.35, seed: 40 + s }));
const STONE = [0, 1].map((s) => manifold.box(0.34, 0.07, 0.22).smooth({ angle: 40, refine: 3 }).refineToLength(0.05).warp((x, y, z) => [x * (1 + 0.25 * Math.sin(z * 9 + s)), y * (1 + 0.3 * Math.sin(x * 7 + s * 2)), z]));
// rubble: scanned mossy rock (Poly Haven rock_moss_set_02), small, lying on the caps and in the grass beside them
const rock = (k: number) => staticFile(`models/rock_moss_set_02/rock_moss_set_02.${k}.gltf`);
const SPACE_X = (KEYS.find((k) => k.id === "space")!.x - 7.5) * U;
const RUBBLE: { p: V3; r: V3; k: number; s: number }[] = [
  { p: [-0.98, 0.0, -0.2], r: [0.05, 0.4, 0.1], k: 0, s: 0.3 },
  { p: [1.02, -0.01, 0.34], r: [-0.08, 1.9, 0.06], k: 1, s: 0.26 },
  { p: [0.3, 0.06, -0.36], r: [0.1, 2.8, -0.08], k: 2, s: 0.13 },
  ...Array.from({ length: 11 }, (_, i) => {
    const x = (rnd(i, 51) - 0.5) * 2.3, z = (rnd(i, 52) - 0.5) * 1.0;
    const on = Math.abs(x) < KW / 2 && Math.abs(z) < KD / 2;
    return { p: [x, on ? 0.052 : Math.abs(x) < KW / 2 + 0.02 && Math.abs(z) < KD / 2 + 0.02 ? 0.012 : -0.01, z] as V3, r: [0, rnd(i, 55) * 6, 0] as V3, k: [0, 1, 2, 4][i % 4], s: 0.045 + rnd(i, 56) * 0.07 };
  }),
].filter((r) => !(Math.abs(r.p[0] - SPACE_X) < 0.36 && r.p[2] > 0.1 && r.p[2] < 0.3) && !(r.p[0] > 0.45 && r.p[0] < 0.8 && Math.abs(r.p[2]) < 0.09));

export function Keyboard({ w }: { w: World }) {
  const { f } = w;
  // the pebble on the space bar rolls off when the robot bumps it
  const roll = interpolate(f, [162, 190], [0, 1], { ...clamp });
  const sx = (KEYS.find((k) => k.id === "space")!.x - 7.5) * U;
  // v4: the keys rattle in their wells as the ground shakes before it opens (a hop of a few mm, a little tip)
  const tr = tremorAt(f);
  const rattle = (seed: number) => (tr > 0 ? tr * 0.0025 * Math.max(0, Math.sin(f * 2.9 + seed * 1.7) + Math.sin(f * 4.1 + seed * 0.9) - 0.4) : 0);
  return (
    <Entity transform={Transform.fromXyz(...KB).withRotation(quat(0.02, KB_YAW, -0.015))}>
      <Mesh3d name="kb-base" allowOverlap shape={KB_BASE} transform={Transform.fromXyz(0, -0.012, 0)}>
        <StandardMaterial base_color="#857b64" perceptual_roughness={0.75} base_color_texture={GRIME} uv_transform={Affine2.fromScale([6, 2.6])} />
      </Mesh3d>
      {KEYS.map((k) => {
        const [x, , z] = keyLocal(k);
        const d = keyDown(k.id, f);
        if (k.id === MISSING)
          return (
            <Mesh3d key={k.id} name="key-stem" allowOverlap transform={Transform.fromXyz(x, 0.02, z)}>
              <Cuboid half_size={[0.012, 0.012, 0.012]} />
              <StandardMaterial base_color="#8a2f2a" perceptual_roughness={0.6} />
            </Mesh3d>
          );
        const leg = LEGEND.get(k.id);
        return (
          <Entity key={k.id} transform={Transform.fromXyz(x, 0.03 - d * 0.016 + rattle(k.x * 7 + k.row * 31), z).withRotation(quat(rattle(k.x * 3 + k.row * 11) * 2, 0, rattle(k.x * 5 + k.row * 13) * 2))}>
            <Mesh3d name={`key-${k.id}`} allowOverlap shape={CAPS.get(k.w)!}>
              <StandardMaterial base_color={hex(capColor(k.id), "#d9d2bd", d * 0.5)} perceptual_roughness={0.66} base_color_texture={GRIME} uv_transform={Affine2.fromScale([0.35 + 0.5 * rnd(k.x * 7 + k.row * 31, 61), 0.35 + 0.5 * rnd(k.x * 3 + k.row * 17, 62)])} />
            </Mesh3d>
            {leg && (
              <Mesh3d name={`legend-${k.id}`} allowOverlap shape={leg} transform={Transform.fromXyz(-0.011, CAP_H / 2 - 0.0052, 0.004).withRotation(quat(-Math.PI / 2, 0, 0))}>
                <StandardMaterial base_color="#3a3832" perceptual_roughness={0.8} />
              </Mesh3d>
            )}
          </Entity>
        );
      })}
      {/* earth packed into the well, between the caps' feet */}
      <Mesh3d name="kb-dirt" allowOverlap transform={Transform.fromXyz(0, 0.0, 0)}>
        <Cuboid half_size={[7.5 * U, 0.012, 2.5 * U]} />
        <StandardMaterial base_color="#2a231a" perceptual_roughness={1} />
      </Mesh3d>
      {RUBBLE.map((r, i) => (
        <Model key={i} name={`rubble-${i}`} src={rock(r.k)} position={r.p} rotation={r.r} scale={r.s} />
      ))}
      <Model name="pebble-space" src={rock(0)} position={[sx + 0.16 + roll * 0.2, 0.056 - roll * roll * 0.03, 2 * U + 0.01 + roll * 0.09]} rotation={[roll * 5, 0.4, roll * 3]} scale={0.085} />
    </Entity>
  );
}

export function BankGrass({ w }: { w: World }) {
  const g = 0.75 + 0.45 * w.grow;
  return (
    <Instances name="bank-grass" pass="grass" at={GRASS} shape={BLADE} shadow={false} scale={[1, g, 1]}>
      <StandardMaterial base_color={hex(hex("#8b8566", "#97915f", w.sun), "#6fae45", w.grow)} perceptual_roughness={0.9} double_sided cull_mode={null} />
    </Instances>
  );
}

// ------------------------------------------------------------------ the robot: a pointer arrow, its tip the origin
const H = 0.36; // tip to tail
const ARROW = crossSection
  .polygon([[0, 0], [0, -1], [0.235, -0.775], [0.39, -1.13], [0.535, -1.065], [0.38, -0.715], [0.7, -0.715]].map(([x, y]) => [x * H, y * H] as [number, number]))
  .offset(-0.012, { join: "round" })
  .offset(0.024, { join: "round" });
const ROBOT_BODY = ARROW.extrude(0.07).move(0, 0, -0.035).smooth({ angle: 50, refine: 2 });
const ROBOT_FACE = ARROW.offset(-0.022, { join: "round" }).extrude(0.012).move(0, 0, 0.03); // a raised plate, a seam round it
const EYE: V3 = [0.115, -0.2, 0.045];
export function Robot({ at, tilt, spin, f, lean }: { at: V3; tilt: number; spin: number; f: number; lean: [number, number] }) {
  // a blink every few seconds, and the thruster's flicker
  const blink = [70, 245, 410, 640, 870, 1090, 1290, 1445].reduce((b, t) => Math.max(b, interpolate(f, [t, t + 2, t + 5], [0, 1, 0], clamp)), 0);
  const thrust = 0.7 + 0.3 * Math.sin(f * 1.3);
  return (
    <Entity transform={Transform.fromXyz(...at).withRotation(quat(lean[1], spin + lean[0], tilt))}>
      <Mesh3d name="robot-body" allowOverlap shape={ROBOT_BODY}>
        <StandardMaterial base_color="#e3d2ae" perceptual_roughness={0.5} />
      </Mesh3d>
      <Mesh3d name="robot-face" allowOverlap shape={ROBOT_FACE}>
        <StandardMaterial base_color="#efe2c4" perceptual_roughness={0.45} />
      </Mesh3d>
      <Mesh3d name="robot-eye" allowOverlap transform={Transform.fromXyz(...EYE)}>
        <Sphere radius={0.034} />
        <StandardMaterial base_color="#1d2226" perceptual_roughness={0.08} />
      </Mesh3d>
      <Mesh3d name="robot-iris" allowOverlap transform={Transform.fromXyz(EYE[0], EYE[1], EYE[2] + 0.027).withScale([1, 1 - 0.9 * blink, 1])}>
        <Sphere radius={0.014} />
        <StandardMaterial base_color="#dff4ff" emissive={glow("#bfe6ff", 120)} />
      </Mesh3d>
      <Mesh3d name="robot-ring" allowOverlap transform={Transform.fromXyz(EYE[0], EYE[1], EYE[2] + 0.002)}>
        <Torus major_radius={0.037} minor_radius={0.006} />
        <StandardMaterial base_color="#b89f72" perceptual_roughness={0.4} />
      </Mesh3d>
      {/* an antenna at the tail and the little thruster under it */}
      <Mesh3d name="robot-antenna" allowOverlap transform={Transform.fromXyz(0.46 * H, -1.13 * H - 0.02, 0).withRotation(quat(0, 0, -0.42))}>
        <Cylinder radius={0.004} half_height={0.035} />
        <StandardMaterial base_color="#8a7a5c" perceptual_roughness={0.5} />
      </Mesh3d>
      <Mesh3d name="robot-bulb" allowOverlap transform={Transform.fromXyz(0.46 * H + 0.03, -1.13 * H - 0.055, 0)}>
        <Sphere radius={0.011} />
        <StandardMaterial base_color="#ffd9a0" emissive={glow("#ffc070", 40 + 40 * thrust)} />
      </Mesh3d>
      <Mesh3d name="robot-vent" allowOverlap transform={Transform.fromXyz(0.2 * H, -0.62 * H, -0.04)}>
        <Cylinder radius={0.03} half_height={0.008} />
        <StandardMaterial base_color="#6f6552" perceptual_roughness={0.5} emissive={glow("#9fd8ff", 14 * thrust)} />
      </Mesh3d>
    </Entity>
  );
}

// ------------------------------------------------------------------ trees
const TRUNKS = [0, 1, 2].map((s) => grow.tree({ height: 11 + s, trunk: 0.42, width: 1.15, base: 0.4 + s * 0.05, crown: "dome", points: 620, leaves: 0, tropism: 0.1, seed: 11 + s }, "wood"));
// a swamp tree's flared foot: cones leaning out of the trunk into roots
const FOOT = [0, 1, 2].map((s) =>
  sdf
    .smoothUnion(0.25, sdf.cone([0, -0.4, 0], [0, 2.2, 0], 0.75, 0.4), ...[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * 6.28 + s;
      return sdf.cone([Math.cos(a) * 1.25, -0.5, Math.sin(a) * 1.25], [Math.cos(a) * 0.2, 1.3, Math.sin(a) * 0.2], 0.1, 0.24);
    }))
    .displace(0.04, 3, 3, 9 + s)
    .solid(0.07),
);
// foliage as a painter lays it in: scalloped clumps, dark under the bough, mid green round it, sunlit yellow-green on top
const CLUMP = [0, 1, 2, 3].map((s) =>
  sdf
    .smoothUnion(0.35, sdf.ellipsoid(1.5, 0.95, 1.35), sdf.ellipsoid(0.95, 0.7, 0.9).move(1.05, -0.2, 0.35 - s * 0.2), sdf.ellipsoid(0.9, 0.65, 1.0).move(-1.0, -0.15, -0.3 + s * 0.15), sdf.ellipsoid(0.8, 0.6, 0.8).move(0.2 * s - 0.3, 0.55, 0.1))
    .displace(0.3, 1.7, 4, 31 + s)
    .solid(0.1),
);
/** a tree's clumps: [x, y, z, scale, layer 0 under / 1 round / 2 top, shape] */
const crownOf = (i: number, k: number): [number, number, number, number, number, number][] => {
  const out: [number, number, number, number, number, number][] = [];
  const top = 9.0 + k;
  for (let j = 0; j < 6; j++) { const a = (j / 6) * 6.283 + rnd(i * 17 + j, 81) * 0.7; const r = 2.3 + rnd(i * 17 + j, 82) * 1.3; out.push([Math.cos(a) * r, top - 2.0 + rnd(i * 17 + j, 83) * 0.8, Math.sin(a) * r, 0.9 + rnd(i * 17 + j, 84) * 0.45, 0, j % 4]); }
  for (let j = 0; j < 5; j++) { const a = (j / 5) * 6.283 + 0.6 + rnd(i * 19 + j, 85) * 0.7; const r = 1.5 + rnd(i * 19 + j, 86) * 1.0; out.push([Math.cos(a) * r, top - 0.9 + rnd(i * 19 + j, 87) * 0.7, Math.sin(a) * r, 0.95 + rnd(i * 19 + j, 88) * 0.4, 1, (j + 1) % 4]); }
  for (let j = 0; j < 3; j++) { const a = (j / 3) * 6.283 + 1.3 + rnd(i * 23 + j, 89); const r = 0.5 + rnd(i * 23 + j, 90) * 0.7; out.push([Math.cos(a) * r, top + 0.3 + rnd(i * 23 + j, 91) * 0.7, Math.sin(a) * r, 0.8 + rnd(i * 23 + j, 92) * 0.35, 2, (j + 2) % 4]); }
  return out;
};
// hanging moss: thin drapes under the boughs
const DRAPE = sdf.tube([[0, 0, 0, 0.03], [0.05, -0.6, 0.02, 0.05], [-0.03, -1.3, 0, 0.04], [0.02, -1.9, -0.02, 0.012]]).displace(0.02, 5, 2, 3).solid(0.02);
const CROWNS_OF = crownOf;
export const TREES: { p: [number, number]; k: number; yaw: number; s: number }[] = [
  { p: [-5.4, -4.6], k: 0, yaw: 0.3, s: 1 }, { p: [-7.6, -10.5], k: 1, yaw: 1.9, s: 1.15 }, { p: [8.4, -9.2], k: 2, yaw: 3.3, s: 1.05 },
  { p: [6.6, -3.2], k: 0, yaw: 4.4, s: 0.95 }, { p: [-8.6, 0.8], k: 1, yaw: 5.2, s: 1.05 }, { p: [8.8, 2.2], k: 2, yaw: 0.9, s: 1 },
  { p: [-13.5, -2.5], k: 0, yaw: 2.4, s: 1.2 }, { p: [-6.4, 5.6], k: 2, yaw: 1.1, s: 0.9 }, { p: [6.2, 7.4], k: 1, yaw: 3.9, s: 0.9 },
  { p: [-10.5, -7.5], k: 2, yaw: 0.2, s: 1.25 }, { p: [10.6, -8.4], k: 0, yaw: 2.9, s: 1.2 }, { p: [-3.4, 11.5], k: 0, yaw: 4.9, s: 1 }, { p: [3.6, 12.2], k: 1, yaw: 0.6, s: 1.05 },
];
const CROWNS = TREES.map((t, i) => CROWNS_OF(i, t.k));
// the far wood: plain trunks in a ring, so no horizon is ever open water
const FAR_TRUNK = grow.loft([[0, "circle 0.5"], [1.4, "circle 0.3"], [9, "circle 0.2"], [13, "circle 0.06"]]);
const FAR_CROWN = sdf.smoothUnion(0.6, sdf.ellipsoid(3.4, 1.8, 3.2), sdf.ellipsoid(2.2, 1.4, 2.2).move(2.4, 1.0, 0.5), sdf.ellipsoid(2.0, 1.3, 2.0).move(-2.2, 0.9, -0.6)).displace(0.6, 0.9, 3, 2).solid(0.35);
const FAR = Array.from({ length: 90 }, (_, i) => {
  const a = (i / 90) * 6.283 + rnd(i, 61) * 0.06;
  // a clearing behind the monitor: there the wood stands far back, a blue treeline under the clouds
  const back = Math.sin(a) < 0 && Math.abs(Math.cos(a)) < 0.5;
  const r = back ? 40 + rnd(i, 62) * 10 : 15 + rnd(i, 62) * 16;
  return { position: [Math.cos(a) * r, -0.1, Math.sin(a) * r] as V3, rotation: [0, rnd(i, 63) * 6, (rnd(i, 64) - 0.5) * 0.08] as V3, scale: 0.8 + rnd(i, 65) * 0.6 };
});
const FAR_TOPS = FAR.map((t, i) => ({ position: [t.position[0], 9.5 * t.scale + rnd(i, 66) * 1.5, t.position[2]] as V3, rotation: [0, rnd(i, 67) * 6, 0] as V3, scale: t.scale * (0.9 + rnd(i, 68) * 0.5) }));

export function Trees({ w }: { w: World }) {
  const bark = hex("#575049", "#6a5646", w.sun * 0.6 + w.grow * 0.4);
  // under the bough, round it, and the sunlit top: by dusk the tops go gold and the undersides blue
  const leaf = [hex("#3b7d52", "#27455a", w.dusk), hex("#58a54a", "#4a7a50", w.dusk), hex("#9ccf52", "#c9b45a", w.dusk)];
  const leafBreak = [hex("#1f4f4a", "#1c2f4a", w.dusk), hex("#75b34f", "#6a8a4a", w.dusk), hex("#d3e37a", "#f0c070", w.dusk)];
  return (
    <>
      {TREES.map((t, i) => {
        // the wave of leaves rolls away from the monitor
        const d = Math.min(0.6, Math.hypot(t.p[0], t.p[1]) / 22);
        const g = interpolate(w.grow, [d, d + 0.4], [0, 1], clamp);
        return (
          <Entity key={i} transform={Transform.fromXyz(t.p[0], -0.15, t.p[1]).withRotation(quat(0, t.yaw, 0)).withScale([t.s, t.s, t.s])}>
            <Mesh3d name={`trunk-${i}`} allowOverlap shape={TRUNKS[t.k]}><StandardMaterial base_color={bark} perceptual_roughness={0.95} /></Mesh3d>
            <Mesh3d name={`foot-${i}`} allowOverlap shape={FOOT[t.k]}><StandardMaterial base_color={bark} perceptual_roughness={0.95} /></Mesh3d>
            {[0, 1, 2].map((k) => (
              <Mesh3d key={k} name={`drape-${i}-${k}`} allowOverlap shape={DRAPE} transform={Transform.fromXyz(Math.cos(k * 2.3 + i) * (1.6 + k * 0.5), 6.4 + k * 0.5, Math.sin(k * 2.3 + i) * (1.6 + k * 0.5)).withRotation(quat(0, k + i, Math.sin(w.f / 40 + i + k) * 0.05)).withScale([1, 0.8 + 0.4 * rnd(i * 3 + k, 71), 1])}>
                <StandardMaterial base_color={hex("#6b6a5c", "#7f9a66", w.grow)} perceptual_roughness={1} />
              </Mesh3d>
            ))}
            {g > 0 && CROWNS[i].map(([x, y, z, sc, layer, shape], j) => {
              // each clump opens a little after the one below it
              const gj = interpolate(g, [layer * 0.18 + (j % 3) * 0.05, layer * 0.18 + (j % 3) * 0.05 + 0.5], [0, 1], clamp);
              if (gj <= 0) return null;
              const e = 1 - (1 - gj) * (1 - gj);
              const sway = Math.sin(w.f / 34 + i * 1.7 + j) * 0.012;
              return (
                <Mesh3d key={j} name={`leaf-${i}-${j}`} allowOverlap shape={CLUMP[shape]} transform={Transform.fromXyz(x * (0.4 + 0.6 * e), y, z * (0.4 + 0.6 * e)).withRotation(quat(sway, j * 1.3 + i, sway)).withScale([sc * e, sc * e, sc * e])}>
                  <ExtendedMaterial base={<StandardMaterial base_color={leaf[layer]} perceptual_roughness={0.9} />} extension={<PaintExtension breakup={0.55} scale={0.9} color={leafBreak[layer]} amount={0.55} />} />
                </Mesh3d>
              );
            })}
          </Entity>
        );
      })}
      <Instances name="far-trunks" at={FAR} shape={FAR_TRUNK}><StandardMaterial base_color={hex("#4f4c48", "#5a4f45", w.sun)} perceptual_roughness={1} /></Instances>
      {w.grow > 0.35 && (
        <Instances name="far-crowns" at={FAR_TOPS} shape={FAR_CROWN} scale={interpolate(w.grow, [0.35, 1], [0.01, 1], clamp)}><ExtendedMaterial base={<StandardMaterial base_color={hex("#3f7a55", "#35506a", w.dusk)} perceptual_roughness={0.9} />} extension={<PaintExtension breakup={0.5} scale={1.6} color={hex("#6fa85a", "#7a6a70", w.dusk)} amount={0.5} />} /></Instances>
      )}
    </>
  );
}

// ------------------------------------------------------------------ water, the bank, lilies, reeds, rings
const BANK = sdf.smoothUnion(0.3, sdf.ellipsoid(2.5, 0.32, 1.15), sdf.ellipsoid(1.1, 0.24, 0.7).move(-2.0, -0.04, 0.5), sdf.ellipsoid(0.9, 0.2, 0.6).move(2.2, -0.05, -0.3)).displace(0.05, 2.2, 3, 5).solid(0.05);
const MOUND = sdf.ellipsoid(1.6, 0.25, 1.1).displace(0.06, 1.8, 3, 8).solid(0.06);
const PAD = manifold.cylinder(0.2, 0.014).rotate(-90, 0, 0).minus(manifold.box(0.3, 0.1, 0.06).move(0.17, 0, 0)).refineToLength(0.05).warp((x, y, z) => [x, y + 0.012 * Math.hypot(x, z) * Math.hypot(x, z) * 8, z]);
const LILY_FLOWER = grow.rosette({ leaves: 13, length: 0.11, width: 0.045, thick: 0.01, tilt: 38, rise: 0.035 });
export const LILIES = Array.from({ length: 90 }, (_, i) => {
  const p: V3 = [(rnd(i, 23) - 0.5) * 15, 0.004, 0.5 + rnd(i, 24) * 8.5];
  return { p, s: 0.7 + rnd(i, 25) * 0.9, yaw: rnd(i, 26) * 6.28, flower: i % 4 === 0, dist: Math.hypot(p[0], p[2] - 0.6) };
}).filter((l) => !(Math.abs(l.p[0] - 0.2) < 2.9 && l.p[2] > 2.0 && l.p[2] < 4.9));
const REED = [0, 1, 2].map((s) =>
  sdf.smoothUnion(0.01, sdf.tube([[0, 0, 0, 0.012], [0.02 + s * 0.02, 0.6, 0.01, 0.01], [0.07 + s * 0.04, 1.25 + s * 0.2, 0.02, 0.006]]), sdf.capsule([0.06 + s * 0.035, 1.0 + s * 0.17, 0.018], [0.068 + s * 0.04, 1.18 + s * 0.19, 0.02], 0.024)).solid(0.012),
);
const REED_LEAF = grow.loft([[0, "rect 0.03 0.004"], [0.5, "rect 0.026 0.003"], [1.0, "rect 0.004 0.002"]]).refineToLength(0.1).warp((x, y, z) => [x + y * y * 0.35, y, z]);
const reedSpots = (seed: number, count: number) =>
  scatter({ area: { min: [-8, 0.6], max: [8, 10.5] }, count, spacing: 0.07, seed, yaw: [0, 6.28], tilt: 0.12, scale: [0.7, 1.3], y: () => -0.03, density: (x, z) => {
    if (Math.abs(x - 0.2) < 2.7 && z > 2.2 && z < 5.0) return 0; // the bank
    if (Math.abs(x) < 2.4 && z < 2.4) return 0; // in front of the glass
    // clumps: a few stands, and a lane kept clear for the opening drift
    const clump = Math.sin(x * 1.3 + seed) * Math.cos(z * 0.9 + seed * 2) + Math.sin(x * 0.4 - z * 0.5);
    const lane = Math.abs(x + 3.0 - (9 - z) * 0.2) < 0.55 && z > 6.5 ? 0 : 1;
    return clump > 0.75 ? lane : 0;
  } });
const REEDS = [reedSpots(3, 45), reedSpots(4, 45), reedSpots(5, 45)];
const REED_LEAVES = reedSpots(6, 110);

export function Ground({ w }: { w: World }) {
  const { f } = w;
  const waterCol = hex(hex("#1c2422", "#22302c", w.sun), "#1f8f96", w.water);
  return (
    <>
      <Mesh3d name="water" allowOverlap transform={Transform.fromXyz(0, -0.02, 0)}>
        <Cuboid half_size={[60, 0.02, 60]} />
        <StandardMaterial base_color={waterCol} perceptual_roughness={0.1} reflectance={0.55} />
      </Mesh3d>
      <Mesh3d name="bed" allowOverlap transform={Transform.fromXyz(0, -0.7, 0)}>
        <Cuboid half_size={[60, 0.3, 60]} />
        <StandardMaterial base_color="#161c19" perceptual_roughness={1} />
      </Mesh3d>
      <Mesh3d name="bank" allowOverlap shape={BANK} transform={Transform.fromXyz(0.2, -0.04, 3.45)}>
        <ExtendedMaterial base={<StandardMaterial base_color={hex(hex("#5a5646", "#665f47", w.sun), "#5a8a3e", w.grow)} perceptual_roughness={1} />} extension={<PaintExtension breakup={0.5} scale={0.5} color={hex(hex("#48463c", "#544c3a", w.sun), "#3f6a3c", w.grow)} amount={0.6} />} />
      </Mesh3d>
      {[[-6.5, 4.5, 0.4], [6.8, 6.0, 2.1], [-4.2, -3.2, 1.2], [5.2, -2.6, 3.0]].map(([x, z, yaw], i) => (
        <Mesh3d key={i} name={`mound-${i}`} allowOverlap shape={MOUND} transform={Transform.fromXyz(x, -0.1, z).withRotation(quat(0, yaw, 0))}>
          <ExtendedMaterial base={<StandardMaterial base_color={hex(hex("#55523f", "#5f5a43", w.sun), "#4f8040", w.grow)} perceptual_roughness={1} />} extension={<PaintExtension breakup={0.5} scale={0.6} color={hex(hex("#45433a", "#4c4838", w.sun), "#356040", w.grow)} amount={0.6} />} />
        </Mesh3d>
      ))}
      {REEDS.map((at, k) => (
        <Instances key={k} name={`reeds-${k}`} at={at} shape={REED[k]} shadow={false}>
          <StandardMaterial base_color={hex(hex("#5d5a4a", "#756c4d", w.sun), "#5f8a45", w.grow)} perceptual_roughness={0.9} />
        </Instances>
      ))}
      <Instances name="reed-leaves" at={REED_LEAVES} shape={REED_LEAF} shadow={false} scale={[1, 0.8 + 0.3 * w.grow, 1]}>
        <StandardMaterial base_color={hex(hex("#6a654f", "#857a52", w.sun), "#74a84e", w.grow)} perceptual_roughness={0.9} double_sided cull_mode={null} />
      </Instances>
      {/* lilies unroll outward from the monitor's foot once the water's colour is picked */}
      {LILIES.map((l, i) => {
        const at = 0.08 + (l.dist / 10) * 0.8;
        const on = interpolate(w.water, [at, at + 0.16], [0, 1], clamp);
        if (on <= 0) return null;
        const e = 1 - (1 - on) * (1 - on);
        return (
          <Entity key={i} transform={Transform.fromXyz(l.p[0], l.p[1] + Math.sin(f / 23 + i) * 0.002, l.p[2]).withRotation(quat(0, l.yaw + Math.sin(f / 50 + i) * 0.05, 0)).withScale([e * l.s, 1, e * l.s])}>
            <Mesh3d name={`pad-${i}`} allowOverlap shape={PAD}><StandardMaterial base_color={i % 3 === 0 ? "#5f9a4a" : "#4f8a44"} perceptual_roughness={0.6} /></Mesh3d>
            {l.flower && (
              <Mesh3d name={`lily-${i}`} allowOverlap shape={LILY_FLOWER} transform={Transform.fromXyz(-0.03, 0.02, 0.02).withScale([e, e, e])}>
                <StandardMaterial base_color={i % 8 === 0 ? "#f6dbe6" : "#fbf3ea"} perceptual_roughness={0.6} emissive={glow("#ffd9c0", 6 * w.dusk)} />
              </Mesh3d>
            )}
          </Entity>
        );
      })}
      {/* rings on the water where something touched it */}
      {RINGS.flatMap(([at, x, z], i) =>
        [0, 9].map((lag) => {
          const t = (f - at - lag) / 50;
          if (t <= 0 || t >= 1) return null;
          const r = 0.1 + t * 1.5;
          return (
            <Mesh3d key={`${i}-${lag}`} name={`ring-${i}-${lag}`} allowOverlap shadow={false} transform={Transform.fromXyz(x, 0.004, z).withRotation(quat(Math.PI / 2, 0, 0)).withScale([r, r, 0.4 * (1 - t)])}>
              <Torus major_radius={1} minor_radius={0.012} />
              <StandardMaterial base_color={hex("#9fb0aa", waterCol, t)} perceptual_roughness={0.3} />
            </Mesh3d>
          );
        }),
      )}
    </>
  );
}

// ------------------------------------------------------------------ fireflies and the mist
export const FLIES = Array.from({ length: 170 }, (_, i) => {
  const p: V3 = [(rnd(i, 9) - 0.5) * 19, 0.25 + rnd(i, 10) * 2.8, -5 + rnd(i, 11) * 13];
  return { p, dist: Math.hypot(p[0], p[2] - 0.5) };
});
export function Fireflies({ f, from }: { f: number; from: number }) {
  return (
    <>
      {FLIES.map((fl, i) => {
        const at = from + fl.dist * 11;
        const on = interpolate(f, [at, at + 14], [0, 1], clamp);
        if (on <= 0) return null;
        const blink = 0.55 + 0.45 * Math.sin(f / (5 + (i % 5)) + i * 1.7);
        const s = on * (0.7 + 0.3 * blink);
        return (
          <Mesh3d key={i} name={`fly-${i}`} allowOverlap shadow={false} transform={Transform.fromXyz(fl.p[0] + Math.sin(f / 43 + i) * 0.22, fl.p[1] + Math.sin(f / 31 + i * 2) * 0.14, fl.p[2] + Math.cos(f / 37 + i) * 0.2).withScale([s, s, s])}>
            <Sphere radius={0.022} />
            <StandardMaterial base_color="#ffd27a" emissive={glow("#ffb347", 260 * blink)} />
          </Mesh3d>
        );
      })}
    </>
  );
}

export function Mist({ w }: { w: World }) {
  // thick and low while the world is dead, thinner once the sun is up, warm again at dusk
  const low = lerp(lerp(0.05, 0.022, w.sun), 0.035, w.dusk);
  const col = hex(hex("#aab4b0", "#f0e2c4", w.sun), "#e0a888", w.dusk);
  return (
    <>
      <FogVolume name="mist-low" position={[0, 0.9, 0]} scale={[60, 1.8, 60]} density={low} color={col} scattering={0.7} anisotropy={0.75} falloff={1} />
      <FogVolume name="mist-air" position={[0, 6, 0]} scale={[60, 12, 60]} density={lerp(0.006, 0.003, w.sun)} color={col} scattering={0.6} anisotropy={0.8} />
    </>
  );
}
