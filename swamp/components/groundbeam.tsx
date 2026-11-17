// The send's answer from the sky: the bank in front of the keyboard splits along a jagged seam of light, the seam
// widens into a slot, and a beam stands up out of it into the sky (the same beam the orbit shots see from space).
// Everything here glows: Solari traces the seam and the beam as lights, so the grass, the keys, the robot and the
// monitor are lit by them, blue-white, against the dusk.
import { interpolate } from "raea";
import { LinearRgba, Srgba } from "raea/color";
import { manifold } from "raea/3d";
import { Cuboid, Mesh3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { groundAt } from "./ground";
import { T, type V3, clamp, rnd } from "./timeline";

const glow = (c: string, k: number) => LinearRgba.from(Srgba.hex(c)).mul(k);

/** where the beam stands: on the bank to the left of the keyboard, in front of the monitor's left half */
export const BEAM_AT: V3 = [-1.3, 0.174, 2.7];
/** the bank's top (the grass's own rule, world.tsx) */
const bankY = (x: number, z: number) => 0.24 - 0.09 * Math.pow(Math.hypot((x - 0.25) / 2.6, (z - 3.55) / 1.3), 2.5);

// the seam: a jagged line across the bank through the beam's foot, each point a share of the way out from the middle
// (it runs out from there), and two short forks off it
type Seg = { a: [number, number]; b: [number, number]; out: number; w: number };
const SEAM: Seg[] = (() => {
  const segs: Seg[] = [];
  const line = (x0: number, z0: number, dir: number, n: number, step: number, wob: number, seed: number, w: number, out0: number) => {
    let x = x0, z = z0;
    for (let i = 0; i < n; i++) {
      const nx = x + dir * step * (0.8 + rnd(i, seed) * 0.4);
      const nz = z + (rnd(i, seed + 1) - 0.5) * wob;
      segs.push({ a: [x, z], b: [nx, nz], out: out0 + (i + 1) / n, w: w * (1 - (0.6 * i) / n) });
      x = nx;
      z = nz;
    }
  };
  line(BEAM_AT[0], BEAM_AT[2], 1, 9, 0.11, 0.09, 11, 1, 0);
  line(BEAM_AT[0], BEAM_AT[2], -1, 9, 0.11, 0.09, 21, 1, 0);
  line(BEAM_AT[0] + 0.42, BEAM_AT[2] + 0.02, 0.6, 4, 0.08, 0.12, 31, 0.5, 0.5);
  line(BEAM_AT[0] - 0.36, BEAM_AT[2] - 0.03, -0.7, 4, 0.08, 0.12, 41, 0.5, 0.5);
  return segs;
})();

/** how far the seam has run (0..1.5 of its arms), how wide it is open (metres), how bright (nits) */
export const seamAt = (f: number) => {
  const run = interpolate(f, [T.crack, T.crack + 10], [0, 1.5], clamp);
  const open = interpolate(f, [T.crack, T.crack + 6, T.blast, T.beam], [0.006, 0.012, 0.026, 0.04], clamp);
  // it flickers as it opens, steadies, and flares as the beam stands up
  const flick = f < T.beam ? 0.75 + 0.25 * Math.sin(f * 2.7) * Math.sin(f * 1.3 + 0.5) : 1;
  const k = interpolate(f, [T.crack - 1, T.crack + 4, T.blast - 2, T.blast, T.blast + 12, T.beam - 4, T.beam + 2, T.beam + 30], [0, 2500, 7000, 20000, 9000, 9000, 26000, 14000], clamp) * flick;
  return { run, open, k };
};
/** the beam's height, metres: 0 until it stands up, then shooting up out of the pit, faster and faster (a head of
 *  light running ahead of it), to the sky's height in about a second */
export const beamHigh = (f: number) => (f < T.beam ? 0 : Math.min(HIGH, 0.6 + 0.45 * (f - T.beam + 1) ** 2));

export function GroundBeam({ f }: { f: number }) {
  if (f < T.crack - 1) return null;
  const { run, open, k } = seamAt(f);
  const h = beamHigh(f);
  return (
    <>
      {SEAM.map((s, i) => {
        const shown = Math.max(0, Math.min(1, (run - s.out + 1) * 1.0));
        if (shown <= 0) return null;
        const bx = s.a[0] + (s.b[0] - s.a[0]) * shown, bz = s.a[1] + (s.b[1] - s.a[1]) * shown;
        const cx = (s.a[0] + bx) / 2, cz = (s.a[1] + bz) / 2;
        const len = Math.hypot(bx - s.a[0], bz - s.a[1]);
        const yaw = Math.atan2(-(bz - s.a[1]), bx - s.a[0]);
        const w = Math.max(0.003, open * s.w * (1 - 0.5 * s.out / 1.5));
        return (
          <Mesh3d key={i} name={`seam-${i}`} castShadow={false} allowOverlap transform={Transform.fromXyz(cx, groundAt(cx, cz) - 0.03, cz).withRotation(Quat.fromEuler("XYZ", 0, yaw, 0)).withScale([len + w, 0.07, w])}>
            {/* (a shape that changes from frame to frame isn't rebuilt in a video render: a unit shape, sized by its transform) */}
            <Cuboid half_size={[0.5, 0.5, 0.5]} />
            <StandardMaterial base_color="#ffffff" emissive={glow("#d9f1ff", k * (1 - 0.4 * (s.out / 1.5)))} />
          </Mesh3d>
        );
      })}
      {h > 0 && <Column h={h} f={f} />}
    </>
  );
}

/** how high the beam stands, metres (inside the swamp camera's far plane; past it the sky's picture is all there is) */
const HIGH = 900;
// a column a metre's height, standing up from its foot: scaled to the beam's height. v4: thin, a white-hot thread: the
// beam's body is its air (beamvol.tsx's pass), and this is what lights the swamp (Solari traces its glow)
const CORE = manifold.cylinder(0.05, 1).rotate(-90, 0, 0);
const HEAD = manifold.sphere(0.1);
/** where the beam stands on the ground, at the pit's floor */
export const beamFoot = (): V3 => [BEAM_AT[0], groundAt(BEAM_AT[0], BEAM_AT[2]) - 0.02, BEAM_AT[2]];

function Column({ h, f }: { h: number; f: number }) {
  void f;
  const foot = beamFoot();
  return (
    <>
      {/* the unit columns are centred: stood on the foot by half their height */}
      <Mesh3d name="beam" castShadow={false} transform={Transform.fromXyz(foot[0], foot[1] + h / 2, foot[2]).withScale([1, h, 1])} shape={CORE}>
        <StandardMaterial base_color="#ffffff" emissive={glow("#e2f5ff", 48000)} />
      </Mesh3d>
      {h < HIGH && (
        <Mesh3d name="beam-head" castShadow={false} transform={Transform.fromXyz(foot[0], foot[1] + h, foot[2]).withScale([1, 1.6, 1])} shape={HEAD}>
          <StandardMaterial base_color="#ffffff" emissive={glow("#f2faff", 80000)} />
        </Mesh3d>
      )}
    </>
  );
}
