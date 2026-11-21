// Chimney smoke over the city (the script's aerial, beat 2: "chimney smoke leaning east"). The plumes rise from the
// bake's chimney tops (assets/world/<slice>/chimneys.json, facade.ts ChimRec), a share of them burning, each a train
// of puffs that rise on their own heat, lean downwind, swell and thin out.
//
// A puff is a card turned to the camera with a soft blob on it (assets/world/smoke/puff-0..3.png, ImageMagick plasma
// under a radial falloff: tools/world/smoke-puffs.sh). Two engine limits shape the rest:
//  - an instanced mesh takes no shader (raea refuses one), so the softness is the texture's, not a shader's;
//  - a video's <Instances> keeps one count for the whole shot and a copy carries a tint but no opacity. So each band
//    of ages is its own fixed set with its own opacity: a band holds every puff between two ages, and as one leaves a
//    band's end its successor, born at the same moment, enters the next band's start in the same place (a puff's
//    place depends only on its plume, its birth time and its age); a puff keeps its slot, and so its blob, for life.
//
// Which plumes: chosen once for the whole shot (never per frame, which would change the count): the chimneys within
// `radius` of `around`, a share `burning` of them by a hash of the chimney's index, at most `max`, nearest first.
//
// The numbers are ours, set by eye: no source here gives a 1917 Berlin stove's draught or the morning's wind. The
// coal shortage of that winter is a reason to keep `burning` well under one.
import { staticFile } from "raea";
import { Instances, Plane3d } from "raea/3d";
import { Srgba } from "raea/color";
import { StandardMaterial } from "raea/pbr";
import chimneysData from "../../assets/world/friedrichstadt/chimneys.json";

type V3 = [number, number, number];
const CHIMNEYS = (chimneysData as { chimneys: number[][] }).chimneys;

/** A puff's life, s, cut into bands of ages, each `PER` puffs. A plume puts out a puff every LIFE / (BANDS * PER) s. */
const LIFE = 18, BANDS = 8, PER = 5;
const DT = LIFE / (BANDS * PER);
/** Each band's opacity, youngest first: a third less a band, so the step as a puff crosses into the next is small and
 *  the last band is near nothing. A puff still can't fade inside a band, so it is born small (it swells from the stack
 *  over its first half second) and, in the last band, shrinks away: the only ends a puff has. */
const BAND_ALPHA = Array.from({ length: BANDS }, (_, b) => 0.8 * Math.pow(0.66, b));
const BLOBS = 4;

const hash = (i: number, k: number) => {
  const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Where a puff born at `tb` is at age `a`, and its radius. Rise: a buoyant start slowing to a slow climb; drift:
 *  the wind taking it once it leaves the stack's lee; wobble: slow gusts by the birth time, growing with age. */
function puff(top: number[], seed: number, tb: number, a: number, wind: [number, number], draught: number, swell: number): { p: V3; r: number } {
  const rise = draught * (2.2 * (1 - Math.exp(-a / 2.2)) + 0.18 * a);
  const take = a - 1.1 * (1 - Math.exp(-a / 1.1));
  const g = Math.sin(tb * 0.37 + seed * 6.28) + 0.6 * Math.sin(tb * 0.91 + seed * 17.0);
  const side = 0.22 * g * Math.sqrt(a);
  const wl = Math.hypot(wind[0], wind[1]) || 1, ux = wind[0] / wl, uz = wind[1] / wl;
  const gust = 1 + 0.15 * Math.sin(tb * 0.23 + seed * 3.1);
  return {
    p: [top[0] + wind[0] * take * gust - uz * side, top[1] + 0.2 + rise + 0.12 * g, top[2] + wind[1] * take * gust + ux * side],
    r: (0.4 + 0.4 * top[3]) * Math.min(1, a / 0.5) + swell * a,
  };
}

/** The Euler angles (x, y, z; Bevy's XYZ, R = Rx Ry Rz) that turn a card facing +z to face `d` (unit), spun `spin`
 *  about its own normal: R (0, 0, 1) = (sin y, -cos y sin x, cos y cos x). */
const facing = (d: V3, spin: number): V3 => [Math.atan2(-d[1], d[2]), Math.asin(Math.max(-1, Math.min(1, d[0]))), spin];

/** Young smoke is darker (thick, sooty), old smoke lighter and greyer (thinned into the air). Linear tints. */
const YOUNG: V3 = [0.2, 0.19, 0.18], OLD: V3 = [0.48, 0.48, 0.5];

export type SmokeProps = {
  /** seconds into the shot */
  t: number;
  /** the camera: every card turns to it */
  eye: V3;
  /** the scene point whose chimneys smoke, and how far round it, m */
  around: V3;
  radius?: number;
  /** the share of stacks burning */
  burning?: number;
  max?: number;
  /** m/s, scene x (east) and z (south): the morning's wind; "leaning east" is +x */
  wind?: [number, number];
  /** opacity, times the bands' own (1): from far off a plume is a few pixels wide and wants more body to read */
  thick?: number;
  /** how fast a puff's radius grows, m/s (0.22) */
  swell?: number;
};

export function Smoke({ t, eye, around, radius = 700, burning = 0.25, max = 2000, wind = [2.4, -0.3], thick = 1, swell = 0.22 }: SmokeProps) {
  const plumes = CHIMNEYS.map((c, i) => ({ c, i, d: Math.hypot(c[0] - around[0], c[2] - around[2]) }))
    .filter((p) => p.d < radius && hash(p.i, 1) < burning)
    .sort((a, b) => a.d - b.d)
    .slice(0, max);
  // sets[band][blob]: band b holds ages [b, b + 1) * LIFE / BANDS; slot j's age within it steps on with t and wraps
  type Card = { position: V3; rotation: V3; scale: number; color: V3 };
  const sets: Card[][][] = BAND_ALPHA.map(() => Array.from({ length: BLOBS }, () => [] as Card[]));
  const P = PER * DT;
  for (const pl of plumes) {
    const seed = hash(pl.i, 2), phase = hash(pl.i, 3) * DT, draught = 0.7 + 0.6 * hash(pl.i, 4), off = Math.floor(hash(pl.i, 5) * BLOBS);
    for (let j = 0; j < PER; j++) {
      const within = (t + phase + j * DT) % P;
      const spin0 = hash(pl.i, 10 + j) * 6.28;
      for (let b = 0; b < BANDS; b++) {
        const a = b * P + within;
        const { p, r } = puff(pl.c, seed, t - a, a, wind, draught, swell);
        const dx = eye[0] - p[0], dy = eye[1] - p[1], dz = eye[2] - p[2], dl = Math.hypot(dx, dy, dz) || 1;
        const k = Math.min(1, a / LIFE);
        sets[b][(j + off) % BLOBS].push({
          position: p,
          rotation: facing([dx / dl, dy / dl, dz / dl], spin0 + 0.06 * a),
          scale: Math.max(1e-3, 2.6 * r * (b === BANDS - 1 ? 1 - within / P : 1)),
          color: [YOUNG[0] + (OLD[0] - YOUNG[0]) * k, YOUNG[1] + (OLD[1] - YOUNG[1]) * k, YOUNG[2] + (OLD[2] - YOUNG[2]) * k],
        });
      }
    }
  }
  return (
    <>
      {sets.flatMap((blobs, b) => blobs.map((at, k) => at.length ? (
        <Instances key={`${b}-${k}`} name={`smoke-${b}-${k}`} at={at} shadow={false} receiveShadow={false}>
          <Plane3d normal={[0, 0, 1]} half_size={[0.5, 0.5]} />
          <StandardMaterial base_color={Srgba.hex("#ffffff").with_alpha(Math.min(0.95, BAND_ALPHA[b] * thick))} base_color_texture={staticFile(`world/smoke/puff-${k}.png`)} perceptual_roughness={1} alpha_mode="Blend" />
        </Instances>
      ) : null))}
    </>
  );
}
