// The raea app in the space. Its pictures are captures of the real app once they're made (kit.tsx picture), until
// then placeholders that say so. In the dark: the screen over a black mirror floor, the cursor pinning comment 2 on a
// canyon frame as the song stops. The burst: on the drop the screen's picture comes apart into tiles thrown at the
// camera, which goes through it. Over the sea: the screen floating at sunset, the whole film's comments resolved.
import { LinearRgba } from "raea/color";
import { staticFile } from "raea";
import { Cuboid, Mesh3d, Plane3d } from "raea/mesh";
import { StandardMaterial } from "raea/pbr";
import { Quat, Transform } from "raea/transform";
import { Screen, Slab, type V3 } from "./kit";
import { screenGlow } from "./light";
import { FPS, SCREENS, SHOTS, cutEnd } from "./plan";
import { camAt, fovOf } from "./cams";
import { yawTo } from "./aim";
/** a burst tile glows like the screen it came from */
const BURST = screenGlow("burst") * 0.6;
import { Sea } from "./sea";

export const IN_DARK: V3 = [0, 1.35, 0];
export const OVER_SEA: V3 = [0, 2.1, -9];
/** the picture on `shot`'s screen at `t` */
export const screenFile = (shot: string, t: number) => SCREENS.filter((s) => s.shot === shot && s.from <= t + 1e-6).pop()?.file ?? SCREENS.find((s) => s.shot === shot)!.file;

export function AppDark({ t }: { t: number }) {
  return (
    <>
      <Slab name="mirror" lo={[-30, -0.2, -30]} hi={[30, 0, 30]} color="#030304" rough={0.08} reflect={0.6} />
      <Screen at={IN_DARK} file={screenFile("app-dark", t)} glow={screenGlow("app-dark")} />
    </>
  );
}

/** the tiles of the screen's picture, 16 across and 10 down, blown outward from the drop, off the frame's edges, each
 *  from its place on the screen with its own speed, spin and fall (no physics: a graybox). Outward, not at the lens:
 *  tiles thrown at the camera swept the frame light and dark past WCAG's flash limit, and the camera's way through
 *  into the canyon stays clear */
const COLS = 16, ROWS = 10;
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
export function Burst({ t, from }: { t: number; from: number }) {
  const a = Math.max(0, t - from);
  return (
    <>
      <Slab name="mirror" lo={[-30, -0.2, -30]} hi={[30, 0, 30]} color="#030304" rough={0.08} reflect={0.6} />
      <Through t={t} from={from} />
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const cx = i % COLS, cy = Math.floor(i / COLS);
        const x0 = IN_DARK[0] - 0.96 + (cx + 0.5) * (1.92 / COLS), y0 = IN_DARK[1] - 0.6 + (cy + 0.5) * (1.2 / ROWS);
        // out from the screen's centre at 1.6 m/s or more (the middle tiles too), a little toward the camera
        const dx = x0 - IN_DARK[0], dy = (y0 - IN_DARK[1]) * 1.6, r = Math.hypot(dx, dy) || 1;
        const speed = 1.6 + 2.4 * r + 1.2 * rnd(i, 1);
        // neighbours part in depth at once (a checkerboard of two speeds), so no tile spins into the next
        const v: V3 = [(dx / r) * speed, (dy / r) * speed * (0.8 + 0.4 * rnd(i, 2)) + 0.6, 0.3 + ((cx + cy) % 2) * 0.9 + 0.3 * rnd(i, 3)];
        const p: V3 = [x0 + v[0] * a, y0 + v[1] * a - 4.9 * a * a, IN_DARK[2] + v[2] * a];
        const spin = (rnd(i, 4) - 0.5) * 9 * a;
        const g = 0.35 + 0.5 * rnd(i, 5);
        return (
          <Mesh3d key={i} name={`tile-${i}`} castShadow={false} transform={Transform.fromXyz(...p).withRotation(Quat.fromEuler("XYZ", spin, spin * 0.7, spin * 0.3))}>
            <Cuboid half_size={[0.058, 0.058, 0.006]} />
            <StandardMaterial base_color="#202022" emissive={new LinearRgba(g * BURST, g * BURST, g * BURST * 1.06, 1)} />
          </Mesh3d>
        );
      })}
    </>
  );
}

/** behind the screen, the canyon: its shot's first frame (media/stills/canyon-in.png, tools/film.sh takes it from the
 *  canyon's chunk) on a plane that exactly fills the burst's last frame, so the camera flies through the bursting
 *  screen into the picture the canyon shot opens on. Its glow reads like a screen's at the burst's exposure */
const THROUGH = (() => {
  const i = SHOTS.findIndex((s) => s.name === "burst");
  const cam = camAt((cutEnd(i) - 1) / FPS);
  const d = 1.9;
  const f = [cam.look[0] - cam.pos[0], cam.look[1] - cam.pos[1], cam.look[2] - cam.pos[2]];
  const l = Math.hypot(f[0], f[1], f[2]);
  const at: V3 = [cam.pos[0] + (f[0] / l) * d, cam.pos[1] + (f[1] / l) * d, cam.pos[2] + (f[2] / l) * d];
  const hh = d * Math.tan(fovOf(cam.mm) / 2) * 1.01;
  return { at, half: [hh * 1.25, hh] as [number, number], yaw: yawTo(at, cam.pos), last: (cutEnd(i) - 1) / FPS };
})();
/** brighter than a screen by what the tone mapping takes off a full-frame picture (measured: 2.0 matches the canyon's
 *  first frame); 0.8 of its size on the drop, hidden behind the screen from the side, growing to fill the last frame */
const THROUGH_GLOW = 2.0;
function Through({ t, from }: { t: number; from: number }) {
  const g = screenGlow("burst") * THROUGH_GLOW;
  const s = 0.8 + 0.2 * Math.min(1, Math.max(0, (t - from) / (THROUGH.last - from)));
  return (
    <Mesh3d name="canyon-through" castShadow={false} transform={Transform.fromXyz(...THROUGH.at).withRotation(Quat.fromEuler("YXZ", THROUGH.yaw, Math.PI / 2, 0)).withScale([s, 1, s])}>
      <Plane3d half_size={THROUGH.half} />
      <StandardMaterial base_color="#000000" emissive_texture={staticFile("stills/canyon-in.png")} emissive={new LinearRgba(g, g, g, 1)} perceptual_roughness={0.2} />
    </Mesh3d>
  );
}

export function Hero({ t }: { t: number }) {
  return (
    <>
      <Sea t={t} />
      <Screen at={OVER_SEA} file={screenFile("hero", t)} glow={screenGlow("hero")} />
    </>
  );
}
